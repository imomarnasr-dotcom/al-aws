import React, { useState, useEffect } from 'react';
import { getStudentAvatar } from '../utils/avatarUtils';
import { QRCodeSVG } from 'qrcode.react';
import { Filter, Search, UserCircle, Users, FileText, CreditCard, ShieldCheck } from 'lucide-react';
import ReactDOMServer from 'react-dom/server';

const StudentIdGenerator = () => {
  const [students, setStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState('All');

  const printDirect = (student, type) => {
    const html = generateCardHTML(student, type, 'print');
    const win = window.open('', '_blank', 'width=800,height=800');
    win.document.write(html);
    win.document.close();
    setTimeout(() => { 
      win.focus(); 
      win.print(); 
    }, 500);
  };

  useEffect(() => {
    const whitelist = JSON.parse(localStorage.getItem('moo_whitelist') || '[]');
    setStudents(whitelist);
  }, []);

  const classes = ['All', ...new Set(students.map(s => s.className).filter(Boolean))];

  const filteredStudents = students.filter(s => {
    const matchesClass = selectedClass === 'All' || s.className === selectedClass;
    const matchesSearch = s.name.includes(searchQuery) || s.id.toString().includes(searchQuery);
    return matchesClass && matchesSearch;
  });

  const getTheme = (className) => {
    const name = className || '';
    if (name.includes('ابتدائي')) return {
      name: 'ابتدائي', primary: '#059669', secondary: '#34d399',
      dark: '#064e3b', light: '#ecfdf5', mid: '#a7f3d0',
      gradient: 'linear-gradient(135deg, #047857, #10b981)',
      gradientDark: 'linear-gradient(135deg, #022c22, #047857)',
    };
    if (name.includes('متوسط')) return {
      name: 'متوسط', primary: '#2563eb', secondary: '#60a5fa',
      dark: '#1e3a8a', light: '#eff6ff', mid: '#bfdbfe',
      gradient: 'linear-gradient(135deg, #1e40af, #3b82f6)',
      gradientDark: 'linear-gradient(135deg, #0f1f5c, #1e40af)',
    };
    if (name.includes('ثانوي')) return {
      name: 'ثانوي', primary: '#d97706', secondary: '#fbbf24',
      dark: '#78350f', light: '#fffbeb', mid: '#fde68a',
      gradient: 'linear-gradient(135deg, #b45309, #f59e0b)',
      gradientDark: 'linear-gradient(135deg, #451a03, #92400e)',
    };
    return {
      name: 'عام', primary: '#7c3aed', secondary: '#a78bfa',
      dark: '#2e1065', light: '#f5f3ff', mid: '#ddd6fe',
      gradient: 'linear-gradient(135deg, #5b21b6, #8b5cf6)',
      gradientDark: 'linear-gradient(135deg, #13044f, #4c1d95)',
    };
  };

  const generateCardHTML = (student, type, mode) => {
    const logoSrc = '/logo.jpg';
    const theme = getTheme(student.className);
    const idZoom = mode === 'print' ? 'zoom: calc(90vw / 856);' : '';
    const paperZoom = mode === 'print' ? 'zoom: 0.378; margin: 0 auto;' : '';
    const qrText = JSON.stringify({ id: student.id, name: student.name });
    const qrSvg = ReactDOMServer.renderToStaticMarkup(
      <QRCodeSVG value={qrText} size={type === 'id' ? 240 : 350} level="H" includeMargin={false} fgColor={theme.dark} />
    );

    if (type === 'id') {
      return `<!DOCTYPE html><html dir="rtl"><head>
        <meta charset="UTF-8">
        <title>كارنيه - ${student.name}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap');
          * { margin:0; padding:0; box-sizing:border-box; }
          @page { size: landscape; margin: 0; }
          body { background: white; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; font-family:'Cairo',Tahoma,Arial,sans-serif; }
          .card-design { width: 856px; height: 540px; display: flex; flex-direction: row; background: white; border-radius: 32px; border: 4px solid #e2e8f0; overflow: hidden; -webkit-print-color-adjust: exact; print-color-adjust: exact; ${idZoom} }
          .left-panel { width: 320px; background: ${theme.gradientDark}; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; position: relative; overflow: hidden; border-left: 2px solid rgba(0,0,0,0.1); }
          .left-panel::before { content:''; position:absolute; top:-40px; left:-40px; width:150px; height:150px; border-radius:50%; background:rgba(255,255,255,0.06); }
          .logo-box { background: rgba(255,255,255,0.15); padding: 12px; border-radius: 20px; border: 2px solid rgba(255,255,255,0.2); backdrop-filter: blur(5px); }
          .logo-box img { width: 60px; height: 60px; object-fit: contain; }
          .qr-box { background: white; padding: 16px; border-radius: 24px; box-shadow: 0 10px 30px rgba(0,0,0,0.3); }
          .scan-text { font-size: 16px; font-weight: 900; color: rgba(255,255,255,0.8); letter-spacing: 4px; text-align: center; }
          .right-panel { flex: 1; display: flex; flex-direction: column; position: relative; overflow: hidden; }
          .top-bar { height: 12px; background: ${theme.gradient}; }
          .deco { position: absolute; width: 250px; height: 250px; border-radius: 50%; background: ${theme.light}; z-index: 0; }
          .deco.tr { top: -80px; right: -80px; opacity: 0.8; }
          .deco.bl { bottom: -80px; left: -80px; opacity: 0.5; }
          .header { padding: 24px 32px 16px; display: flex; justify-content: space-between; align-items: flex-start; z-index: 1; }
          .school-title { font-size: 28px; font-weight: 900; color: #0f172a; line-height: 1.1; margin-bottom: 4px; }
          .school-sub { font-size: 14px; font-weight: 700; color: #64748b; letter-spacing: 1.5px; }
          .badge { background: ${theme.light}; color: ${theme.primary}; border: 2px solid ${theme.mid}; padding: 6px 20px; border-radius: 100px; font-size: 16px; font-weight: 900; }
          .content { padding: 16px 32px; flex: 1; display: flex; flex-direction: column; justify-content: center; z-index: 1; }
          .label { font-size: 14px; color: #94a3b8; font-weight: 800; letter-spacing: 1px; margin-bottom: 8px; }
          .student-name { font-size: 38px; font-weight: 900; color: #0f172a; margin-bottom: 24px; line-height: 1.2; }
          .info-grid { display: flex; gap: 16px; }
          .info-card { flex: 1; padding: 16px; border-radius: 20px; }
          .info-card.light { background: ${theme.light}; border: 2px solid ${theme.mid}; }
          .info-card.dark { background: #0f172a; }
          .info-label { font-size: 12px; font-weight: 800; margin-bottom: 6px; }
          .info-label.light { color: ${theme.primary}; }
          .info-label.dark { color: #94a3b8; }
          .info-val { font-size: 24px; font-weight: 900; }
          .info-val.light { color: ${theme.dark}; }
          .info-val.dark { color: ${theme.secondary}; letter-spacing: 2px; }
          .footer { background: ${theme.light}; padding: 12px 32px; border-top: 2px solid ${theme.mid}; display: flex; justify-content: space-between; align-items: center; z-index: 1; }
          .footer-text { font-size: 12px; font-weight: 800; color: ${theme.primary}; }
          .footer-text.muted { color: #94a3b8; }
        </style>
      </head><body>
        <div class="card-design">
          <div class="left-panel">
            <div class="logo-box"><img src="${logoSrc}" alt="Logo"></div>
            <div class="qr-box">${qrSvg}</div>
            <div class="scan-text">SCAN ME</div>
          </div>
          <div class="right-panel">
            <div class="top-bar"></div><div class="deco tr"></div><div class="deco bl"></div>
            <div class="header">
              <div><div class="school-title">مدارس الأوس الأهلية</div><div class="school-sub">AL Aws Private Schools</div></div>
              <div class="badge">قسم ال${theme.name}</div>
            </div>
            <div class="content">
              <div class="label">الاسم الكامل للطالب</div>
              <div class="student-name">${student.name}</div>
              <div class="info-grid">
                <div class="info-card light"><div class="info-label light">الفصل الدراسي</div><div class="info-val light">${student.className || 'غير مسجل'}</div></div>
                <div class="info-card dark"><div class="info-label dark">الكود التعريفي</div><div class="info-val dark">${student.id}</div></div>
              </div>
            </div>
            <div class="footer"><div class="footer-text">بطاقة هوية طالب رسمية</div><div class="footer-text muted">www.alaws-school.edu</div></div>
          </div>
        </div>
      </body></html>`;
    } else {
      return `<!DOCTYPE html><html dir="rtl"><head>
        <meta charset="UTF-8">
        <title>كارت - ${student.name}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap');
          * { margin:0; padding:0; box-sizing:border-box; }
          @page { size: portrait; margin: 0; }
          body { background: white; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; font-family:'Cairo',Tahoma,Arial,sans-serif; }
          .card-design { width: 1050px; height: 1480px; display: flex; flex-direction: column; background: white; border-radius: 48px; border: 4px solid #f1f5f9; overflow: hidden; position: relative; -webkit-print-color-adjust: exact; print-color-adjust: exact; ${paperZoom} }
          .deco { position: absolute; border-radius: 50%; z-index: 0; }
          .deco.tr { top: -150px; right: -150px; width: 500px; height: 500px; background: ${theme.light}; opacity: 0.8; }
          .deco.bl { bottom: -200px; left: -200px; width: 600px; height: 600px; background: ${theme.light}; opacity: 0.5; }
          .deco.center { top: 50%; left: 50%; transform: translate(-50%,-50%); width: 800px; height: 800px; border: 4px solid ${theme.mid}; opacity: 0.15; }
          .top-bar { height: 16px; background: ${theme.gradient}; z-index: 1; }
          .header { display: flex; flex-direction: column; align-items: center; padding: 48px 40px 32px; z-index: 1; }
          .logo-box { background: white; padding: 24px; border-radius: 32px; border: 4px solid ${theme.mid}; box-shadow: 0 16px 40px ${theme.primary}20; margin-bottom: 24px; }
          .logo-box img { width: 100px; height: 100px; object-fit: contain; }
          .school-title { font-size: 46px; font-weight: 900; color: #0f172a; margin-bottom: 8px; }
          .school-sub { font-size: 20px; font-weight: 700; color: #64748b; letter-spacing: 2px; margin-bottom: 24px; }
          .badge { background: ${theme.gradientDark}; color: white; padding: 12px 40px; border-radius: 100px; font-size: 22px; font-weight: 900; letter-spacing: 1px; box-shadow: 0 10px 24px ${theme.primary}40; }
          .content { display: flex; flex-direction: column; align-items: center; flex: 1; padding: 32px 40px; z-index: 1; }
          .qr-box { background: white; padding: 28px; border-radius: 40px; border: 4px solid ${theme.mid}; box-shadow: 0 24px 64px ${theme.primary}25, 0 8px 24px rgba(0,0,0,0.06); margin-bottom: 40px; }
          .scan-badge { background: ${theme.light}; border: 2px solid ${theme.mid}; padding: 12px 32px; border-radius: 100px; font-size: 18px; font-weight: 900; color: ${theme.primary}; letter-spacing: 6px; margin-top: 24px; text-align: center; }
          .label { font-size: 16px; color: #94a3b8; font-weight: 800; letter-spacing: 2px; margin-bottom: 8px; }
          .student-name { font-size: 48px; font-weight: 900; color: #0f172a; margin-bottom: 40px; text-align: center; }
          .info-grid { display: flex; gap: 24px; width: 100%; }
          .info-card { flex: 1; padding: 24px; border-radius: 32px; text-align: center; }
          .info-card.light { background: ${theme.light}; border: 3px solid ${theme.mid}; }
          .info-card.dark { background: #0f172a; }
          .info-label { font-size: 16px; font-weight: 800; margin-bottom: 8px; letter-spacing: 1px; }
          .info-label.light { color: ${theme.primary}; }
          .info-label.dark { color: #94a3b8; }
          .info-val { font-size: 32px; font-weight: 900; }
          .info-val.light { color: ${theme.dark}; }
          .info-val.dark { color: ${theme.secondary}; letter-spacing: 2px; }
          .bottom-bar { height: 16px; background: ${theme.gradient}; z-index: 1; margin-top: auto; }
        </style>
      </head><body>
        <div class="card-design">
          <div class="deco tr"></div><div class="deco bl"></div><div class="deco center"></div><div class="top-bar"></div>
          <div class="header">
            <div class="logo-box"><img src="${logoSrc}" alt="Logo"></div>
            <div class="school-title">مدارس الأوس الأهلية</div><div class="school-sub">AL Aws Private Schools</div>
            <div class="badge">البطاقة الذكية · قسم ال${theme.name}</div>
          </div>
          <div class="content">
            <div class="qr-box">${qrSvg}<div class="scan-badge">SCAN ME</div></div>
            <div class="label">الاسم الكامل للطالب</div><div class="student-name">${student.name}</div>
            <div class="info-grid">
              <div class="info-card light"><div class="info-label light">الفصل الدراسي</div><div class="info-val light">${student.className || 'غير مسجل'}</div></div>
              <div class="info-card dark"><div class="info-label dark">الكود التعريفي</div><div class="info-val dark">${student.id}</div></div>
            </div>
          </div>
          <div class="bottom-bar"></div>
        </div>
      </body></html>`;
    }
  };


  const renderCardPreview = (student) => {
    const theme = getTheme(student.className);
    return (
      <div style={{ background: 'white', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.08)', border: '1px solid #f3f4f6', display: 'flex', flexDirection: 'column', aspectRatio: '1.6 / 1', position: 'relative' }}>
        <div style={{ height: '5px', background: theme.gradient }}></div>
        <div style={{ background: '#f8fafc', padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img src="/logo.jpg" alt="Logo" style={{ width: '32px', height: '32px', objectFit: 'contain' }} />
            <div>
              <h4 style={{ margin: 0, fontSize: '12px', fontWeight: 900, color: '#1e293b' }}>مدارس الأوس الأهلية</h4>
              <p style={{ margin: 0, fontSize: '8px', fontWeight: 700, color: '#64748b' }}>AL Aws Private Schools</p>
            </div>
          </div>
          <div style={{ padding: '3px 10px', borderRadius: '100px', fontSize: '9px', fontWeight: 800, background: theme.light, color: theme.primary, border: `1px solid ${theme.mid}` }}>{theme.name}</div>
        </div>
        <div style={{ display: 'flex', padding: '12px', gap: '12px', flex: 1, alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <div style={{ background: theme.light, padding: '6px', borderRadius: '50%' }}>
                <img src={getStudentAvatar(student.className)} alt="Avatar" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
              </div>
              <div>
                <p style={{ fontSize: '8px', color: '#64748b', margin: 0, fontWeight: 700 }}>اسم الطالب</p>
                <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 900, color: '#0f172a' }}>{student.name}</h3>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ background: theme.light, padding: '6px 10px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '8px', color: '#64748b', fontWeight: 700 }}>الفصل</span>
                <span style={{ fontSize: '10px', fontWeight: 900, color: theme.dark }}>{student.className || 'غير مسجل'}</span>
              </div>
              <div style={{ background: theme.light, padding: '6px 10px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '8px', color: '#64748b', fontWeight: 700 }}>الكود</span>
                <span style={{ fontSize: '10px', fontWeight: 900, color: theme.primary }}>{student.id}</span>
              </div>
            </div>
          </div>
          <div style={{ background: 'white', padding: '6px', borderRadius: '12px', border: `2px solid ${theme.mid}`, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <QRCodeSVG value={JSON.stringify({ id: student.id, name: student.name })} size={70} level="H" includeMargin={false} fgColor={theme.dark} />
            <p style={{ textAlign: 'center', fontSize: '7px', margin: '4px 0 0 0', fontWeight: 900, color: theme.primary, letterSpacing: '1px' }}>SCAN</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 sm:p-6" style={{ overflowX: 'hidden' }}>
      <div style={{ background: 'white', borderRadius: '20px', padding: '20px 24px', boxShadow: '0 4px 16px rgba(0,0,0,0.05)', marginBottom: '28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 900, color: '#111827', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShieldCheck size={28} color="#7c3aed" /> مصنع البطاقات الفاخرة
          </h2>
          <p style={{ margin: '4px 0 0 0', color: '#6b7280', fontSize: '13px', fontWeight: 600 }}>إصدار بطاقات ذكية بتصميم مخصص لكل مرحلة وباركود حقيقي 100%</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
            <input type="text" placeholder="ابحث..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ padding: '10px 36px 10px 14px', borderRadius: '12px', border: '2px solid #f1f5f9', outline: 'none', fontSize: '13px', fontWeight: 600, background: '#f8fafc', width: '200px' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f8fafc', padding: '8px 14px', borderRadius: '12px', border: '2px solid #f1f5f9' }}>
            <Filter size={16} color="#6b7280" />
            <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '13px', fontWeight: 700, color: '#374151', cursor: 'pointer' }}>
              {classes.map(c => <option key={c} value={c}>{c === 'All' ? 'جميع الفصول' : c}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 340px), 1fr))', gap: '24px' }}>
        {filteredStudents.map(student => (
          <div key={student.id} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {renderCardPreview(student)}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button onClick={() => printDirect(student, 'id')} style={{ background: 'white', color: '#1e293b', border: '2px solid #e2e8f0', padding: '11px', borderRadius: '14px', fontSize: '13px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px' }}>
                <CreditCard size={16} color="#2563eb" /> طباعة كارنيه
              </button>
              <button onClick={() => printDirect(student, 'paper')} style={{ background: 'white', color: '#1e293b', border: '2px solid #e2e8f0', padding: '11px', borderRadius: '14px', fontSize: '13px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px' }}>
                <FileText size={16} color="#7c3aed" /> طباعة كارت ورقي
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredStudents.length === 0 && (
        <div style={{ textAlign: 'center', padding: '80px', background: 'white', borderRadius: '24px', border: '2px dashed #e2e8f0' }}>
          <Users size={48} style={{ color: '#cbd5e1', marginBottom: '16px' }} />
          <h3 style={{ margin: 0, color: '#64748b', fontSize: '18px', fontWeight: 800 }}>لا يوجد طلاب</h3>
        </div>
      )}

    </div>
  );
};

export default StudentIdGenerator;
