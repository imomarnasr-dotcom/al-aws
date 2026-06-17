import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, Search, CheckCircle2, UserCheck, SearchX, Clock, AlertCircle, Maximize, Minimize, AlertTriangle, Users, LogOut } from 'lucide-react';
import { getGlobalMaster } from '../utils/dataManager';

const CameraScanner = () => {
  const [scanResult, setScanResult] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [dailyAttendance, setDailyAttendance] = useState({});
  const [allStudents, setAllStudents] = useState([]);
  const [youngClasses, setYoungClasses] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const scannerRef = useRef(null);
  const searchInputRef = useRef(null);
  const isScanningRef = useRef(false); // To prevent multiple rapid scans

  const _d = new Date();
  const todayDate = `${_d.getFullYear()}-${String(_d.getMonth() + 1).padStart(2, '0')}-${String(_d.getDate()).padStart(2, '0')}`;

  useEffect(() => {
    const whitelist = JSON.parse(localStorage.getItem('moo_whitelist') || '[]');
    setAllStudents(whitelist);
    
    const youngs = JSON.parse(localStorage.getItem('moo_young_classes') || '[]');
    setYoungClasses(youngs);

    const attendanceRecord = JSON.parse(localStorage.getItem('moo_daily_attendance_manual') || '{}');
    if (!attendanceRecord[todayDate]) {
      attendanceRecord[todayDate] = {};
    }
    setDailyAttendance(attendanceRecord[todayDate]);
  }, [todayDate]);

  useEffect(() => {
    let html5QrCode;
    let isMounted = true;

    const startScanner = async () => {
      try {
        const devices = await Html5Qrcode.getCameras();
        if (!isMounted) return;

        if (devices && devices.length > 0) {
          html5QrCode = new Html5Qrcode("qr-reader-container");
          scannerRef.current = html5QrCode;
          
          try {
            // Try back camera first
            await html5QrCode.start({ facingMode: "environment" }, { fps: 10 }, (t) => onScanSuccess(t), undefined);
          } catch(e) {
            if (!isMounted) return;
            // Fallback to the default camera (often the webcam on laptops)
            await html5QrCode.start(devices[0].id, { fps: 10 }, (t) => onScanSuccess(t), undefined);
          }
        } else {
          setCameraError(true);
        }
      } catch (err) {
        if (isMounted) setCameraError(true);
      }
    };

    startScanner();

    return () => {
      isMounted = false;
      if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().then(() => {
          html5QrCode.clear();
        }).catch(() => {});
      }
    };
  }, [allStudents, youngClasses]); // Add dependencies so onScanSuccess has the latest closure state

  const isStudentExempt = (student) => {
    if (!student) return false;
    if (student.isExempted) return true;
    
    const normalizeStr = (str) => str ? str.trim().replace(/ي/g, 'ى').replace(/[أإآ]/g, 'ا') : '';
    const studentClass = normalizeStr(student.className || student.class);
    
    return youngClasses.some(c => normalizeStr(c) === studentClass);
  };

  // Sync state reference for the scanner callback
  const dailyAttendanceRef = useRef(dailyAttendance);
  useEffect(() => {
    dailyAttendanceRef.current = dailyAttendance;
  }, [dailyAttendance]);

  const playSound = (type) => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      if (type === 'success') {
        osc.frequency.value = 800;
        gain.gain.value = 0.3;
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
        setTimeout(() => {
          const osc2 = ctx.createOscillator();
          const gain2 = ctx.createGain();
          osc2.connect(gain2);
          gain2.connect(ctx.destination);
          osc2.frequency.value = 1200;
          gain2.gain.value = 0.3;
          osc2.start();
          osc2.stop(ctx.currentTime + 0.2);
        }, 150);
      } else if (type === 'error') {
        osc.frequency.value = 300;
        osc.type = 'sawtooth';
        gain.gain.value = 0.2;
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      }
    } catch (e) { /* silent */ }
  };

  const onScanSuccess = (decodedText) => {
    if (isScanningRef.current) return;

    let scannedId = decodedText;
    try {
      const parsed = JSON.parse(decodedText);
      if (parsed && parsed.id) scannedId = parsed.id;
    } catch(e) {}

    const student = allStudents.find((s) => s.id === scannedId || s.id?.toString() === scannedId);
    if (!student) {
      isScanningRef.current = true;
      playSound('error');
      setScanResult({ student: null, status: 'error', message: 'الكود غير مسجل في النظام' });
      setTimeout(() => {
        isScanningRef.current = false;
        setScanResult(null);
      }, 2000);
      return;
    }

    if (isStudentExempt(student)) {
      isScanningRef.current = true;
      playSound('warning');
      const msg = student.isExempted ? 'طالب مستثنى (معفى بالكامل)' : 'طالب مستثنى من الطابور (صغار)';
      setScanResult({ student, status: 'warning', message: msg });
      setTimeout(() => {
        isScanningRef.current = false;
        setScanResult(null);
      }, 2000);
      return;
    }

    isScanningRef.current = true;

    // جلب وقت بداية اليوم لحساب التأخير
    const master = getGlobalMaster();
    const firstLessonStart = master.settings?.firstLessonStart || '08:00 AM';
    
    // تحويل وقت البداية لمقارنة
    const parseTime = (timeStr) => {
      const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM|am|pm|ص|م)?/);
      if (!match) return new Date();
      let hours = parseInt(match[1]);
      const mins = parseInt(match[2]);
      const modifier = match[3]?.toLowerCase();
      if (modifier === 'pm' || modifier === 'م') { if (hours < 12) hours += 12; }
      else if (modifier === 'am' || modifier === 'ص') { if (hours === 12) hours = 0; }
      const t = new Date();
      t.setHours(hours, mins, 0, 0);
      return t;
    };

    const startTimeObj = parseTime(firstLessonStart);
    const now = new Date();
    const isLate = now > startTimeObj;

    const existingRecord = dailyAttendanceRef.current[student.id];

    if (existingRecord) {
      playSound('warning');
      setScanResult({ student, status: 'warning', message: 'تم تسجيل الدخول مسبقاً' });
      setTimeout(() => { isScanningRef.current = false; setScanResult(null); }, 2000);
      return;
    }

    playSound('success');
    const scanStatus = isLate ? 'متأخر' : 'حاضر';
    const newRecord = { 
      ...dailyAttendanceRef.current, 
      [student.id]: { 
        status: scanStatus, 
        time: now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
        entryTime: now.toISOString()
      } 
    };
    
    setDailyAttendance(newRecord);
    dailyAttendanceRef.current = newRecord;
    
    const allRecords = JSON.parse(localStorage.getItem('moo_daily_attendance_manual') || '{}');
    allRecords[todayDate] = newRecord;
    localStorage.setItem('moo_daily_attendance_manual', JSON.stringify(allRecords));
    

    setScanResult({ student, status: 'success', message: scanStatus === 'متأخر' ? 'تم تسجيل الحضور (متأخر)' : 'تم تسجيل الحضور بنجاح' });

    setSearchQuery('');
    setShowSearchResults(false);
    
    setTimeout(() => {
      isScanningRef.current = false;
      setScanResult(null);
    }, 2500);
  };

  const searchResults = useMemo(() => {
    if (!searchQuery.trim() || searchQuery.length < 1) return [];
    const q = searchQuery.toLowerCase();
    return allStudents.filter(s => {
      // Hide exempted students and already processed students from search
      if (isStudentExempt(s) || dailyAttendance[s.id]) return false;

      return s.name?.toLowerCase().includes(q) || s.id?.toString() === searchQuery;
    }).slice(0, 8);
  }, [searchQuery, allStudents, dailyAttendance]);

  const activeStudents = allStudents.filter(s => !isStudentExempt(s));
  const presentCount = Object.keys(dailyAttendance).filter(id => {
    const student = allStudents.find(s => s.id === id);
    return student && !isStudentExempt(student);
  }).length;
  const totalStudents = activeStudents.length;
  const absentCount = totalStudents - presentCount;

  const cameraContainerStyles = isFullscreen ? {
    position: 'fixed',
    inset: 0,
    zIndex: 9999,
    background: '#000',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center'
  } : {
    borderRadius: '24px', 
    overflow: 'hidden', 
    position: 'relative', 
    boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
    background: '#000',
    minHeight: '400px',
    height: '100%',
    display: 'flex',
    alignItems: 'stretch'
  };

  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      #qr-reader-container { width: 100% !important; height: 100% !important; border: none !important; }
      #qr-reader-container video { object-fit: cover !important; width: 100% !important; height: 100% !important; }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  return (
    <div style={{
      background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 50%, #f0fdfa 100%)',
      borderRadius: '32px',
      padding: '32px',
      border: '1px solid #d1fae5',
      boxShadow: '0 4px 32px rgba(16, 185, 129, 0.08)'
    }}>
      {/* Header and Toggle */}
      <div style={{ padding: '20px', borderBottom: '1px solid #e0e0e0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '900', color: '#111827', margin: 0 }}>نظام البوابة الذكية</h2>
          <p style={{ fontSize: '14px', color: '#6B7280', margin: '4px 0 0 0' }}>المسح التلقائي قيد التشغيل</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 400px', minWidth: '300px', display: 'flex', flexDirection: 'column' }}>
          <div style={cameraContainerStyles}>
            <button 
              onClick={() => setIsFullscreen(!isFullscreen)}
              style={{
                position: 'absolute', top: isFullscreen ? '24px' : '12px', right: isFullscreen ? '24px' : '12px', zIndex: 30,
                background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '12px', padding: '12px',
                color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                backdropFilter: 'blur(4px)', transition: 'background 0.2s', boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
              }}
            >
              {isFullscreen ? <Minimize size={28} /> : <Maximize size={24} />}
            </button>
            <div id="qr-reader-container" style={{ width: '100%', height: '100%', flex: 1 }}></div>

            {cameraError && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#111827', color: '#9ca3af', padding: '24px', textAlign: 'center', zIndex: 10 }}>
                <AlertCircle size={64} style={{ marginBottom: '16px', opacity: 0.5, color: '#ef4444' }} />
                <p style={{ fontWeight: 800, fontSize: '18px', color: 'white' }}>لا يمكن تشغيل الكاميرا</p>
              </div>
            )}

            {scanResult && (
              <div style={{
                position: 'absolute', inset: 0, zIndex: 20,
                background: scanResult.status === 'success' ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.95), rgba(5, 150, 105, 0.95))' : 'linear-gradient(135deg, rgba(244, 63, 94, 0.95), rgba(225, 29, 72, 0.95))',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                color: 'white', backdropFilter: 'blur(12px)',
                animation: 'fadeIn 0.3s ease'
              }}>
                {scanResult.student ? (
                  <>
                    <h3 style={{ fontSize: '32px', fontWeight: 900, marginBottom: '8px' }}>{scanResult.student.name}</h3>
                    <div style={{ marginTop: '24px', background: 'rgba(255,255,255,0.2)', padding: '12px 32px', borderRadius: '100px', fontWeight: 900 }}>
                      {scanResult.message}
                    </div>
                  </>
                ) : (
                  <p style={{ fontSize: '24px', fontWeight: 900 }}>{scanResult.message}</p>
                )}
              </div>
            )}
          </div>

          {/* Manual Search Input */}
          <div style={{ marginTop: '16px', position: 'relative' }}>
            <div style={{ position: 'relative' }}>
              <input 
                ref={searchInputRef}
                type="text" 
                placeholder="بحث يدوي بالاسم أو بالكود..." 
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSearchResults(true);
                }}
                onFocus={() => setShowSearchResults(true)}
                style={{ width: '100%', padding: '16px 48px 16px 16px', borderRadius: '16px', border: '2px solid #e5e7eb', fontSize: '16px', outline: 'none', transition: 'border 0.3s', boxSizing: 'border-box' }}
              />
              <Search style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} size={20} />
            </div>

            {showSearchResults && searchResults.length > 0 && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '8px', background: 'white', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', zIndex: 50, overflow: 'hidden', border: '1px solid #e5e7eb' }}>
                {searchResults.map(student => (
                  <div 
                    key={student.id} 
                    onClick={() => {
                      onScanSuccess(student.id.toString());
                      setShowSearchResults(false);
                      setSearchQuery('');
                    }}
                    style={{ padding: '12px 16px', borderBottom: '1px solid #f3f4f6', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  >
                    <div>
                      <p style={{ margin: 0, fontWeight: 'bold', color: '#111827' }}>{student.name}</p>
                      <p style={{ margin: 0, fontSize: '12px', color: '#6B7280' }}>الفصل: {student.className} | الكود: {student.id}</p>
                    </div>
                    <button style={{ background: '#10b981', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '8px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}>
                      تسجيل دخول
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{ flex: '0 0 280px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{ background: '#ecfdf5', padding: '20px 16px', borderRadius: '20px', textAlign: 'center' }}>
              <p style={{ fontSize: '32px', fontWeight: 900, color: '#059669', margin: 0 }}>{presentCount}</p>
              <p style={{ fontSize: '11px', color: '#059669', margin: 0 }}>حاضر</p>
            </div>
            <div style={{ background: '#fef2f2', padding: '20px 16px', borderRadius: '20px', textAlign: 'center' }}>
              <p style={{ fontSize: '32px', fontWeight: 900, color: '#dc2626', margin: 0 }}>{absentCount}</p>
              <p style={{ fontSize: '11px', color: '#dc2626', margin: 0 }}>لم يحضر</p>
            </div>
          </div>

          <div style={{ background: 'white', borderRadius: '20px', border: '1px solid #e5e7eb', flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '400px' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #f3f4f6' }}>
              <h4 style={{ fontSize: '13px', fontWeight: 900, color: '#374151', margin: 0 }}>أحدث العمليات</h4>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
              {Object.entries(dailyAttendance).reverse().slice(0, 15).map(([id, data]) => {
                const student = allStudents.find(s => s.id === id || s.id?.toString() === id);
                if (!student) return null;
                return (
                  <div key={id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'white', borderRadius: '16px', marginBottom: '8px', border: '1px solid #f3f4f6' }}>
                    <div style={{ width: '40px', height: '40px', background: '#F3F4F6', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', color: '#374151' }}>
                      {student.name.substring(0, 1)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontWeight: 'bold', fontSize: '14px', color: '#111827' }}>{student.name}</p>
                      <p style={{ margin: 0, fontSize: '12px', color: '#6B7280' }}>{student.className}</p>
                    </div>
                    <div style={{ textAlign: 'left' }}>
                      <span style={{ 
                        display: 'inline-block', padding: '4px 8px', borderRadius: '8px', fontSize: '11px', fontWeight: 'bold', marginBottom: '4px',
                        background: data.status === 'حاضر' ? '#D1FAE5' : data.status === 'متأخر' ? '#FEF3C7' : '#FFE4E6',
                        color: data.status === 'حاضر' ? '#059669' : data.status === 'متأخر' ? '#D97706' : '#E11D48'
                      }}>
                        {data.status}
                      </span>
                      <p style={{ margin: 0, fontSize: '11px', color: '#9CA3AF', fontWeight: 'bold' }}>
                        {data.status === 'انصراف' ? data.exitTime : data.time}
                      </p>
                    </div>
                  </div>
                );
              })}
                {Object.entries(dailyAttendance).length === 0 && (
                  <div style={{ textAlign: 'center', padding: '32px 0', color: '#d1d5db' }}>
                    <SearchX size={28} style={{ marginBottom: '8px', opacity: 0.5, display: 'inline-block' }} />
                    <p style={{ fontSize: '12px', fontWeight: 700, margin: 0 }}>لم يحضر أحد حتى الآن</p>
                  </div>
                )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CameraScanner;
