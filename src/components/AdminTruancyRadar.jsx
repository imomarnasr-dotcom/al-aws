import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, AlertTriangle, CheckCircle2 } from 'lucide-react';

const AdminTruancyRadar = () => {
  const [discrepancies, setDiscrepancies] = useState([]);
  const [autoMode, setAutoMode] = useState(false);

  const loadData = () => {
    const isAuto = JSON.parse(localStorage.getItem('moo_auto_attendance_enabled') || 'false');
    setAutoMode(isAuto);
    if (isAuto) {
      setDiscrepancies([]);
      return;
    }
    
    const _d = new Date();
    const today = `${_d.getFullYear()}-${String(_d.getMonth() + 1).padStart(2, '0')}-${String(_d.getDate()).padStart(2, '0')}`;
    const manualAttendance = JSON.parse(localStorage.getItem('moo_daily_attendance_manual') || '{}')[today] || {};
    const attendanceHistory = JSON.parse(localStorage.getItem('moo_attendance') || '{}');
    const whitelist = JSON.parse(localStorage.getItem('moo_whitelist') || '[]');
    const penalizedLog = JSON.parse(localStorage.getItem('moo_truancy_penalized') || '{}')[today] || {};

    const disc = [];

    whitelist.filter(s => !s.isExempted).forEach(student => {
      if (!manualAttendance[student.id]) {
        const attendedClasses = [];
        Object.entries(attendanceHistory).forEach(([key, record]) => {
          if (key.endsWith('_' + today)) {
            const className = key.split('_')[0];
            const status = record[student.id];
            if (status === 'حاضر' || status === 'حضور' || status === '') {
              attendedClasses.push(className);
            }
          }
        });

        if (attendedClasses.length > 0) {
          disc.push({
            student,
            classes: attendedClasses,
            isPenalized: !!penalizedLog[student.id]
          });
        }
      }
    });

    setDiscrepancies(disc);
  };

  const handlePenalize = (student) => {
    if (!window.confirm(`هل أنت متأكد من تطبيق عقوبة التسلل على ${student.name}؟\n(سيتم خصم 5 نقاط تميز ومرتبتين سلوك وإرسال إنذار لولي الأمر)`)) return;
    
    const _d = new Date();
    const today = `${_d.getFullYear()}-${String(_d.getMonth() + 1).padStart(2, '0')}-${String(_d.getDate()).padStart(2, '0')}`;
    
    // 1. Mark as penalized
    const allPenalized = JSON.parse(localStorage.getItem('moo_truancy_penalized') || '{}');
    if (!allPenalized[today]) allPenalized[today] = {};
    allPenalized[today][student.id] = true;
    localStorage.setItem('moo_truancy_penalized', JSON.stringify(allPenalized));

    // 2. Deduct 5 Reward Points
    const spentPoints = JSON.parse(localStorage.getItem('moo_spent_points') || '{}');
    spentPoints[student.id] = (spentPoints[student.id] || 0) + 5;
    localStorage.setItem('moo_spent_points', JSON.stringify(spentPoints));

    // 3. Deduct Behavior Points
    const behaviorLogs = JSON.parse(localStorage.getItem('moo_behavior_logs') || '{}');
    if (!behaviorLogs[student.id]) behaviorLogs[student.id] = [];
    behaviorLogs[student.id].push({
      date: today,
      type: 'تخطي الماسح الصباحي (تسلل)',
      points: -2
    });
    localStorage.setItem('moo_behavior_logs', JSON.stringify(behaviorLogs));

    // 4. Send Parent Notification
    const parentNotes = JSON.parse(localStorage.getItem('moo_parent_notifications') || '{}');
    if (!parentNotes[student.id]) parentNotes[student.id] = [];
    parentNotes[student.id].push({
      id: Date.now().toString(),
      date: new Date().toISOString(),
      title: '⚠️ إنذار هروب صباحي',
      message: `تم رصد الطالب ${student.name} داخل الفصول رغم عدم مروره من بوابة الدخول الصباحية. تم تطبيق لائحة السلوك وخصم النقاط.`,
      read: false
    });
    localStorage.setItem('moo_parent_notifications', JSON.stringify(parentNotes));

    loadData();
    window.dispatchEvent(new Event('storage')); window.dispatchEvent(new CustomEvent('moo-sync'));
  };

  useEffect(() => {
    loadData();
    window.addEventListener('storage', loadData);
    window.addEventListener('moo-sync', loadData);
    return () => {
      window.removeEventListener('storage', loadData);
      window.removeEventListener('moo-sync', loadData);
    };
  }, []);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-[40px] p-4 sm:p-10 border border-gray-100 shadow-sm text-right overflow-x-hidden w-full max-w-full">
      <div className="mb-10 flex justify-between items-center">
        <div>
          <h3 className="text-3xl font-black text-rose-700 flex items-center gap-3 mb-2">
            <ShieldAlert size={36} /> إشعارات التسلل (الهروب الصباحي)
          </h3>
          <p className="text-gray-500 font-bold">مراقبة ورصد الطلاب الذين تخطوا الماسح الصباحي ولكنهم مسجلون (حضور) في الحصص.</p>
        </div>
      </div>

      {autoMode ? (
        <div className="bg-gray-50 rounded-[32px] p-12 text-center border border-gray-200">
          <AlertTriangle className="text-gray-400 mx-auto mb-4" size={48} />
          <p className="text-xl font-black text-gray-700">رادار التسلل معطل حالياً</p>
          <p className="text-sm text-gray-500 mt-2">يعمل هذا الرادار التلقائي فقط عندما يكون الماسح الصباحي قيد التشغيل (الاعتماد على الكاميرا).</p>
        </div>
      ) : discrepancies.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {discrepancies.map((d, idx) => (
            <div key={idx} className={`p-6 rounded-3xl border flex flex-col justify-between items-start gap-4 shadow-sm relative overflow-hidden transition-all ${d.isPenalized ? 'bg-gray-50 border-gray-200 opacity-80' : 'bg-rose-50 border-rose-200'}`}>
              <div className="absolute -left-8 -top-8 opacity-[0.03]">
                 {d.isPenalized ? <CheckCircle2 size={150} /> : <ShieldAlert size={150} />}
              </div>
              <div className="relative z-10 w-full">
                <div className="flex justify-between items-start mb-2">
                  <p className={`font-black text-2xl ${d.isPenalized ? 'text-gray-700' : 'text-rose-900'}`}>{d.student.name}</p>
                  {!d.isPenalized && (
                    <span className="bg-rose-600 text-white px-3 py-1 rounded-full text-[10px] font-black tracking-wider animate-pulse">متسلل اليوم 🚨</span>
                  )}
                </div>
                <p className={`text-sm font-bold mb-4 ${d.isPenalized ? 'text-gray-500' : 'text-rose-700/80'}`}>الفصل: {d.student.className} | الكود: {d.student.id}</p>
                <div className="bg-white/80 p-4 rounded-xl border border-rose-100 w-full mb-4">
                  <p className="text-[11px] font-black text-gray-500 mb-3 leading-relaxed">تخطى طابور الصباح، وتم رصده كـ (حاضر) في الحصص:</p>
                  <div className="flex flex-wrap gap-2">
                    {d.classes.map((cls, i) => (
                      <span key={i} className={`px-3 py-1 rounded-lg text-sm font-black border ${d.isPenalized ? 'bg-gray-100 text-gray-600 border-gray-200' : 'bg-amber-100 text-amber-800 border-amber-200'}`}>{cls}</span>
                    ))}
                  </div>
                </div>
                
                {d.isPenalized ? (
                  <div className="w-full bg-emerald-100 text-emerald-800 text-center py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2">
                    <CheckCircle2 size={18} /> تمت المعاقبة وخصم النقاط
                  </div>
                ) : (
                  <button onClick={() => handlePenalize(d.student)} className="w-full bg-gradient-to-l from-rose-600 to-rose-500 text-white py-3 rounded-xl font-bold shadow-lg shadow-rose-500/30 hover:scale-[1.02] transition-transform flex items-center justify-center gap-2">
                    <ShieldAlert size={18} /> إيقاع العقوبة الآلية
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-emerald-50 rounded-[32px] p-12 text-center border border-emerald-100">
          <CheckCircle2 className="text-emerald-500 mx-auto mb-4" size={64} />
          <h4 className="text-2xl font-black text-emerald-900 mb-2">لا توجد حالات تسلل</h4>
          <p className="text-emerald-700 font-bold">جميع الطلاب المتواجدين في الفصول التزموا بتسجيل الحضور عبر البوابة الصباحية.</p>
        </div>
      )}
    </motion.div>
  );
};

export default AdminTruancyRadar;

