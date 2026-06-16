import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LogOut, Bell, ShieldAlert, CheckCircle2, Clock, MessageSquare,
  Send, BookOpen, Calendar, TrendingUp, CreditCard, Award, Wallet,
  AlertTriangle, ChevronRight, Star, Activity,
  CheckCheck, Trash2, Menu, Home, X
} from 'lucide-react';
import { calculateStudentAttendance } from '../utils/dataManager';

/* ─── helpers ─── */
const pct = (n) => Math.min(100, Math.max(0, Number(n) || 0));

const gradeColor = (p) => {
  if (p >= 90) return { bar: 'bg-emerald-500', text: 'text-emerald-600', light: 'bg-emerald-50', border: 'border-emerald-200' };
  if (p >= 75) return { bar: 'bg-blue-500', text: 'text-blue-600', light: 'bg-blue-50', border: 'border-blue-200' };
  if (p >= 60) return { bar: 'bg-amber-500', text: 'text-amber-600', light: 'bg-amber-50', border: 'border-amber-200' };
  return { bar: 'bg-rose-500', text: 'text-rose-600', light: 'bg-rose-50', border: 'border-rose-200' };
};

const initials = (name = '') => name.trim().split(' ').slice(0, 2).map(w => w[0] || '').join('');

const TABS = [
  { id: 'overview',      label: 'الرئيسية',    icon: Home },
  { id: 'grades',        label: 'الدرجات',     icon: BookOpen },
  { id: 'attendance',    label: 'الحضور',      icon: CheckCheck },
  { id: 'schedule',      label: 'الجدول',      icon: Calendar },
  { id: 'cafeteria',     label: 'الكافيتيريا', icon: Wallet },
  { id: 'achievements',  label: 'الأوسمة',     icon: Award },
  { id: 'notifications', label: 'الإشعارات',   icon: Bell },
  { id: 'discipline',    label: 'الانضباط',    icon: ShieldAlert },
  { id: 'contact',       label: 'تواصل',       icon: MessageSquare },
];

/* ── reusable stat card ── */
const StatCard = ({ icon: Icon, label, value, sub, color = 'indigo' }) => {
  const g = {
    indigo:  'from-indigo-500 to-indigo-600',
    emerald: 'from-emerald-500 to-emerald-600',
    amber:   'from-amber-400 to-amber-500',
    rose:    'from-rose-500 to-rose-600',
    blue:    'from-blue-500 to-blue-600',
    violet:  'from-violet-500 to-violet-600',
  };
  return (
    <motion.div whileHover={{ y: -3, scale: 1.02 }} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex items-center gap-4">
      <div className={`w-13 h-13 rounded-2xl bg-gradient-to-br ${g[color]} flex items-center justify-center shrink-0 shadow-md p-3`}>
        <Icon size={24} className="text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-bold text-slate-400 mb-0.5 truncate">{label}</p>
        <p className="text-2xl font-black text-slate-800 leading-none">{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-1 font-medium">{sub}</p>}
      </div>
    </motion.div>
  );
};

const SectionHeader = ({ icon: Icon, title, color = 'text-indigo-600', badge }) => (
  <div className="flex items-center gap-3 mb-6">
    <div className={`w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center ${color}`}>
      <Icon size={20} />
    </div>
    <h2 className="text-xl font-black text-slate-800 flex-1">{title}</h2>
    {badge > 0 && <span className="bg-rose-500 text-white text-xs font-black px-2.5 py-1 rounded-full">{badge}</span>}
  </div>
);

/* ════════════════════════════════════════════════════════════════ */
const ParentDashboard = ({ studentData, onLogout }) => {
  /* ─── studentData is a FLAT whitelist object: { id, name, className, parentName, … } ─── */
  const sid        = studentData?.id;
  const sName      = studentData?.name      || 'الطالب';
  const sClass     = studentData?.className || '';  // e.g. "الصف الثالث الثانوي"
  const sParent    = studentData?.parentName || 'ولي الأمر';

  /* ─── state ─── */
  const [activeTab,       setActiveTab]       = useState('overview');
  const [sidebarOpen,     setSidebarOpen]     = useState(false);
  const [notifications,   setNotifications]   = useState([]);
  const [behaviorLogs,    setBehaviorLogs]     = useState([]);
  const [grades,          setGrades]          = useState([]);
  const [attendance,      setAttendance]      = useState({ percentage: 100, present: 0, absent: 0, truancy: 0, total: 0 });
  const [badges,          setBadges]          = useState([]);
  const [cafBalance,      setCafBalance]      = useState(0);
  const [cafTxns,         setCafTxns]         = useState([]);
  const [schedule,        setSchedule]        = useState([]);
  const [myComplaints,    setMyComplaints]    = useState([]);
  const [subject,         setSubject]         = useState('');
  const [msgText,         setMsgText]         = useState('');
  const [contactSuccess,  setContactSuccess]  = useState(false);

  /* ─── load everything from localStorage ─── */
  const loadData = () => {
    if (!sid) return;

    /* 1. Admin notifications (parent-targeted) */
    const allNotes = JSON.parse(localStorage.getItem('moo_parent_notifications') || '{}');
    setNotifications(allNotes[sid] || []);

    /* 2. Behavior logs – written by AdminTruancyRadar to moo_behavior_logs */
    const allLogs = JSON.parse(localStorage.getItem('moo_behavior_logs') || '{}');
    setBehaviorLogs(allLogs[sid] || []);

    /* 3. Grades from moo_grades
          Real key format: "className__subject__semester"  (3 parts)
          e.g. "الصف الثالث الثانوي__الرياضيات__الفصل الأول"             */
    const realGrades = JSON.parse(localStorage.getItem('moo_grades') || '{}');
    const gradeList  = [];
    Object.entries(realGrades).forEach(([key, map]) => {
      const parts = key.split('__');
      // valid grade key must have at least 2 parts (class + subject)
      if (parts.length < 2) return;
      const cls     = parts[0];  // className
      const subject = parts[1];  // subject name  (part[2] = semester, ignored here)
      if (cls !== sClass) return;
      const score = map[sid];
      if (score === undefined || score === '' || score === 'absent') return;
      const numScore = Number(score);
      if (isNaN(numScore)) return;
      // avoid duplicate subject entries (same subject, different semesters → keep highest)
      const existing = gradeList.find(g => g.subject === subject);
      if (existing) { if (numScore > existing.score) existing.score = numScore; }
      else gradeList.push({ subject, score: numScore });
    });

    /* 3b. Grades from online exams */
    const t1 = JSON.parse(localStorage.getItem('moo_tests') || '[]');
    const t2 = JSON.parse(localStorage.getItem('exams') || '[]');
    const merged = [...t1, ...t2];
    const uniqueExams = Array.from(new Map(merged.map(e => [e.id, e])).values());
    uniqueExams.forEach(exam => {
      const ec = exam.classCode || exam.stage || exam.class || '';
      if (ec !== sClass) return;
      const report = exam.reports?.find(r => r.studentId === sid && r.status === 'submitted');
      if (!report) return;
      const name = exam.subject || exam.title || 'اختبار';
      if (!gradeList.find(g => g.subject === name)) {
        gradeList.push({ subject: name, score: Math.round((report.score / report.total) * 100) });
      }
    });
    setGrades(gradeList);

    /* 4. Attendance via shared utility */
    const att = calculateStudentAttendance(sid);
    setAttendance(att);

    /* 5. Badges – moo_achievements[sid] holds badge NAMES */
    const allAch = JSON.parse(localStorage.getItem('moo_achievements') || '{}');
    setBadges(allAch[sid] || []);

    /* 6. Cafeteria balance – stored in moo_wallets */
    const wallets = JSON.parse(localStorage.getItem('moo_wallets') || '{}');
    setCafBalance(wallets[sid] ?? 0);

    /* 7. Cafeteria transactions – stored in moo_wallet_transactions (flat array)
          fields: { id, studentId, studentName, amount, type, date }  */
    const allTxns = JSON.parse(localStorage.getItem('moo_wallet_transactions') || '[]');
    setCafTxns(allTxns.filter(t => t.studentId === sid));

    /* 8. Weekly schedule from global master – lessons use "classCode" field */
    const master = (() => {
      try { return JSON.parse(localStorage.getItem('GLOBAL_ACADEMIC_MASTER') || 'null'); }
      catch { return null; }
    })();
    if (master?.lessons?.length) {
      const classLessons = master.lessons.filter(l =>
        l.classCode === sClass || l.class === sClass || l.className === sClass
      );
      const grouped = {};
      classLessons.forEach(l => {
        if (!grouped[l.day]) grouped[l.day] = [];
        grouped[l.day].push(l);
      });
      setSchedule(
        Object.entries(grouped).map(([day, lessons]) => ({
          day,
          lessons: lessons.sort((a, b) => (a.time || '').localeCompare(b.time || '')),
        }))
      );
    } else {
      setSchedule([]);
    }

    /* 9. Complaints */
    const allComplaints = JSON.parse(localStorage.getItem('moo_complaints') || '[]');
    setMyComplaints(allComplaints.filter(c => c.studentId === sid && c.senderType === 'parent'));
  };

  useEffect(() => {
    loadData();
    window.addEventListener('moo-sync', loadData);
    window.addEventListener('storage',  loadData);
    return () => {
      window.removeEventListener('moo-sync', loadData);
      window.removeEventListener('storage',  loadData);
    };
  }, [studentData]);

  /* ─── derived ─── */
  const avgGrade    = useMemo(() => grades.length ? Math.round(grades.reduce((s, g) => s + g.score, 0) / grades.length) : null, [grades]);
  const unreadNotif = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);
  const todayName   = new Date().toLocaleDateString('ar-SA', { weekday: 'long' });
  const todaySchd   = schedule.find(d => d.day === todayName) || schedule[0] || null;

  const totalPoints = useMemo(() => {
    const gpaPct = avgGrade  || 0;
    const attPct = attendance.percentage || 0;
    if (!gpaPct && !attPct) return 0;
    return Math.round((gpaPct * 10) + (attPct * 5));
  }, [avgGrade, attendance]);

  /* ─── actions ─── */
  const markAsRead = (id) => {
    const store = JSON.parse(localStorage.getItem('moo_parent_notifications') || '{}');
    store[sid] = (store[sid] || []).map(n => n.id === id ? { ...n, read: true } : n);
    localStorage.setItem('moo_parent_notifications', JSON.stringify(store));
    window.dispatchEvent(new CustomEvent('moo-sync'));
  };

  const deleteNotif = (id) => {
    const store = JSON.parse(localStorage.getItem('moo_parent_notifications') || '{}');
    store[sid] = (store[sid] || []).filter(n => n.id !== id);
    localStorage.setItem('moo_parent_notifications', JSON.stringify(store));
    window.dispatchEvent(new CustomEvent('moo-sync'));
  };

  const handleSend = () => {
    if (!msgText.trim()) return;
    const all = JSON.parse(localStorage.getItem('moo_complaints') || '[]');
    all.push({
      id:          `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      studentId:   sid,
      studentName: sName,
      parentName:  sParent,
      subject:     subject.trim() || 'رسالة من ولي الأمر',
      text:        msgText.trim(),
      date:        new Date().toISOString(),
      status:      'pending',
      senderType:  'parent',
    });
    localStorage.setItem('moo_complaints', JSON.stringify(all));
    setSubject(''); setMsgText('');
    setContactSuccess(true);
    setTimeout(() => setContactSuccess(false), 3500);
    window.dispatchEvent(new CustomEvent('moo-sync'));
  };

  /* ════ RENDER ════════════════════════════════════════════════ */
  return (
    <div className="min-h-screen bg-slate-50 font-sans" dir="rtl">

      {/* ── HEADER ── */}
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(v => !v)} className="md:hidden w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 text-slate-600">
              <Menu size={20} />
            </button>
            <img src="/logo.jpg" alt="logo" className="w-9 h-9 rounded-xl object-contain border border-slate-100 hidden md:block" onError={e => e.target.style.display='none'} />
            <div>
              <p className="text-sm font-black text-slate-800 leading-tight">بوابة ولي الأمر</p>
              <p className="text-xs text-indigo-500 font-bold">متابعة: {sName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('notifications')}
              className="relative w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 border border-slate-100 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
            >
              <Bell size={19} />
              {unreadNotif > 0 && (
                <span className="absolute -top-1 -left-1 w-4 h-4 bg-rose-500 text-white text-[9px] font-black flex items-center justify-center rounded-full border-2 border-white animate-pulse">
                  {unreadNotif}
                </span>
              )}
            </button>
            <button onClick={onLogout} className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl font-bold text-sm transition-colors">
              <LogOut size={15} /> خروج
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6 flex gap-6 relative">

        {/* ── MOBILE OVERLAY ── */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 bg-black/40 md:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        {/* ── SIDEBAR ── */}
        <aside className={`
          fixed top-0 right-0 h-full z-50 transition-transform duration-300 md:static md:h-auto md:z-auto
          ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'} md:translate-x-0
          w-60 md:w-56 shrink-0
        `}>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-3 h-full md:h-auto md:sticky md:top-20 overflow-y-auto">
            {/* close on mobile */}
            <div className="flex justify-end mb-2 md:hidden">
              <button onClick={() => setSidebarOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                <X size={16} />
              </button>
            </div>

            {/* mini profile */}
            <div className="bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl p-4 mb-3 text-white text-center">
              <div className="w-14 h-14 bg-white/20 border-2 border-white/30 rounded-2xl flex items-center justify-center mx-auto mb-2 text-xl font-black">
                {initials(sName) || '🎓'}
              </div>
              <p className="font-black text-sm leading-tight">{sName}</p>
              <p className="text-indigo-200 text-[11px] mt-0.5 font-bold truncate">{sClass}</p>
              {avgGrade !== null && (
                <div className="mt-2 bg-white/15 rounded-xl px-3 py-1.5">
                  <p className="text-[10px] text-indigo-200">المعدل</p>
                  <p className="text-2xl font-black">{avgGrade}%</p>
                </div>
              )}
            </div>

            {/* nav items */}
            {TABS.map(tab => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              const hasBadge = tab.id === 'notifications' && unreadNotif > 0;
              return (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id); setSidebarOpen(false); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-bold transition-all mb-0.5
                    ${active ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'text-slate-600 hover:bg-slate-50 hover:text-indigo-600'}`}
                >
                  <Icon size={16} />
                  <span className="flex-1 text-right">{tab.label}</span>
                  {hasBadge && <span className="w-5 h-5 bg-rose-500 text-white text-[10px] font-black flex items-center justify-center rounded-full">{unreadNotif}</span>}
                </button>
              );
            })}
          </div>
        </aside>

        {/* ── MAIN ── */}
        <main className="flex-1 min-w-0 space-y-6">
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }}>

              {/* ══ OVERVIEW ══ */}
              {activeTab === 'overview' && (
                <div className="space-y-5">

                  {/* Hero card */}
                  <div className="bg-gradient-to-l from-indigo-600 via-indigo-500 to-violet-600 rounded-3xl p-6 text-white relative overflow-hidden">
                    <div className="absolute -left-6 -top-6 w-40 h-40 bg-white/10 rounded-full pointer-events-none" />
                    <div className="absolute -left-2 -bottom-8 w-28 h-28 bg-white/5 rounded-full pointer-events-none" />
                    <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                      <div className="w-20 h-20 bg-white/20 border-4 border-white/30 rounded-2xl flex items-center justify-center text-2xl font-black backdrop-blur-sm">
                        {initials(sName) || '🎓'}
                      </div>
                      <div className="flex-1">
                        <p className="text-indigo-200 text-xs font-bold">الطالب</p>
                        <h1 className="text-2xl font-black mt-0.5 leading-tight">{sName}</h1>
                        <p className="text-indigo-200 font-bold mt-1 text-sm">{sClass}</p>
                      </div>
                      <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-4 text-center hidden sm:block">
                        <p className="text-indigo-200 text-[10px] font-bold">نقاط التميز</p>
                        <p className="text-3xl font-black">{totalPoints.toLocaleString()}</p>
                        <div className="flex justify-center gap-0.5 mt-1">
                          {[...Array(3)].map((_, i) => <Star key={i} size={11} className="text-amber-300 fill-amber-300" />)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <StatCard icon={TrendingUp} label="المعدل العام" value={avgGrade !== null ? `${avgGrade}%` : '—'} sub={avgGrade >= 90 ? 'ممتاز 🏆' : avgGrade >= 75 ? 'جيد جداً ⭐' : avgGrade !== null ? 'يحتاج تحسين' : 'لا توجد درجات بعد'} color="indigo" />
                    <StatCard icon={CheckCheck} label="نسبة الحضور" value={`${Math.round(attendance.percentage)}%`} sub={`${attendance.present} يوم حضور`} color={attendance.percentage >= 90 ? 'emerald' : 'amber'} />
                    <StatCard icon={Wallet} label="رصيد الكافيتيريا" value={`${cafBalance} ر.س`} sub="الرصيد الحالي" color="blue" />
                    <StatCard icon={Award} label="الأوسمة المكتسبة" value={badges.length} sub="وسام تميّز" color="violet" />
                  </div>

                  {/* Alerts */}
                  {(attendance.truancy > 0 || attendance.absent > 2 || behaviorLogs.length > 0 || unreadNotif > 0) && (
                    <div className="space-y-2">
                      <p className="text-xs font-black text-slate-500 flex items-center gap-1.5 mb-1">
                        <AlertTriangle size={13} className="text-amber-500" /> تنبيهات تستوجب الانتباه
                      </p>
                      {attendance.truancy > 0 && (
                        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-start gap-3">
                          <AlertTriangle size={18} className="text-rose-600 shrink-0 mt-0.5" />
                          <p className="text-rose-800 font-bold text-sm">سُجِّلت <strong>{attendance.truancy} حالة تغيب متعمد (هروب)</strong> على الطالب. يُرجى متابعة الأمر.</p>
                        </div>
                      )}
                      {attendance.absent > 2 && (
                        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
                          <Clock size={18} className="text-amber-600 shrink-0 mt-0.5" />
                          <p className="text-amber-800 font-bold text-sm">غاب الطالب <strong>{attendance.absent} أياماً</strong> هذا الفصل. تأكد من الأعذار الرسمية.</p>
                        </div>
                      )}
                      {behaviorLogs.length > 0 && (
                        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-center gap-3">
                          <ShieldAlert size={18} className="text-rose-600 shrink-0" />
                          <p className="text-rose-800 font-bold text-sm flex-1">يوجد <strong>{behaviorLogs.length} سجل سلوكي</strong> على الطالب.</p>
                          <button onClick={() => setActiveTab('discipline')} className="text-xs font-black text-rose-600 bg-rose-100 px-3 py-1.5 rounded-xl hover:bg-rose-200 transition-colors whitespace-nowrap">عرض</button>
                        </div>
                      )}
                      {unreadNotif > 0 && (
                        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-center gap-3">
                          <Bell size={18} className="text-blue-600 shrink-0" />
                          <p className="text-blue-800 font-bold text-sm flex-1">لديك <strong>{unreadNotif} إشعار جديد</strong> من إدارة المدرسة.</p>
                          <button onClick={() => setActiveTab('notifications')} className="text-xs font-black text-blue-600 bg-blue-100 px-3 py-1.5 rounded-xl hover:bg-blue-200 transition-colors whitespace-nowrap">قراءة</button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Today schedule preview */}
                  {todaySchd && (
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-black text-slate-800 flex items-center gap-2 text-sm">
                          <Calendar size={16} className="text-indigo-500" /> جدول اليوم — {todaySchd.day || todayName}
                        </h3>
                        <button onClick={() => setActiveTab('schedule')} className="text-xs font-bold text-indigo-500 hover:underline flex items-center gap-1">
                          الكامل <ChevronRight size={12} />
                        </button>
                      </div>
                      <div className="space-y-2">
                        {(todaySchd.lessons || []).filter(l => l.subject !== 'استراحة').slice(0, 5).map((l, i) => (
                          <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                            <div className="w-14 text-center bg-indigo-100 text-indigo-700 text-xs font-black py-1.5 rounded-lg shrink-0">{l.time}</div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-slate-800 text-sm truncate">{l.subject}</p>
                              {l.instructor && l.instructor !== '-' && <p className="text-xs text-slate-400">{l.instructor} · {l.room}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Grades preview */}
                  {grades.length > 0 && (
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-black text-slate-800 flex items-center gap-2 text-sm"><BookOpen size={16} className="text-emerald-500" /> آخر الدرجات</h3>
                        <button onClick={() => setActiveTab('grades')} className="text-xs font-bold text-emerald-500 hover:underline flex items-center gap-1">الكل <ChevronRight size={12} /></button>
                      </div>
                      <div className="space-y-3">
                        {grades.slice(0, 4).map((g, i) => {
                          const c = gradeColor(g.score);
                          return (
                            <div key={i} className="flex items-center gap-3">
                              <p className="text-sm font-bold text-slate-700 w-28 shrink-0 truncate">{g.subject}</p>
                              <div className="flex-1 bg-slate-100 rounded-full h-2.5 overflow-hidden">
                                <div className={`h-2.5 rounded-full ${c.bar}`} style={{ width: `${pct(g.score)}%`, transition: 'width .7s ease' }} />
                              </div>
                              <p className={`text-sm font-black w-12 text-right ${c.text}`}>{g.score}%</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ══ GRADES ══ */}
              {activeTab === 'grades' && (
                <div className="space-y-5">
                  <SectionHeader icon={BookOpen} title="التحصيل الأكاديمي والدرجات" color="text-emerald-600" />
                  {avgGrade !== null && (
                    <div className="bg-gradient-to-l from-emerald-500 to-teal-600 rounded-2xl p-6 text-white flex flex-col sm:flex-row gap-6 items-center">
                      <div className="text-center">
                        <p className="text-emerald-100 text-sm font-bold">المعدل العام</p>
                        <p className="text-5xl font-black mt-1">{avgGrade}%</p>
                        <p className="text-emerald-200 text-sm mt-1">{avgGrade >= 90 ? 'ممتاز' : avgGrade >= 75 ? 'جيد جداً' : avgGrade >= 60 ? 'مقبول' : 'ضعيف'}</p>
                      </div>
                      <div className="flex-1 w-full space-y-2 text-sm font-bold text-emerald-100">
                        {[
                          ['عدد المواد', `${grades.length} مادة`],
                          ['أعلى درجة', `${grades.length ? Math.max(...grades.map(g => g.score)) : 0}%`],
                          ['أقل درجة', `${grades.length ? Math.min(...grades.map(g => g.score)) : 0}%`],
                          ['مواد ممتازة (≥90%)', `${grades.filter(g => g.score >= 90).length} مادة`],
                        ].map(([k, v]) => (
                          <div key={k} className="flex justify-between border-b border-emerald-400/30 pb-1.5">
                            <span>{k}</span><span className="font-black text-white">{v}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {grades.length === 0 ? (
                    <div className="bg-white rounded-2xl p-12 text-center border border-slate-100">
                      <BookOpen size={52} className="mx-auto text-slate-200 mb-4" />
                      <h3 className="text-lg font-black text-slate-600">لا توجد درجات مسجلة بعد</h3>
                      <p className="text-slate-400 text-sm font-bold mt-1">ستظهر الدرجات فور رصدها من قِبل المعلمين.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {grades.map((g, i) => {
                        const c = gradeColor(g.score);
                        return (
                          <motion.div key={i} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                            className={`bg-white rounded-2xl border ${c.border} p-5 shadow-sm`}>
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl ${c.light} ${c.text} flex items-center justify-center font-black`}>
                                  {g.score >= 90 ? '🏆' : g.score >= 75 ? '⭐' : g.score >= 60 ? '📘' : '⚠️'}
                                </div>
                                <div>
                                  <p className="font-black text-slate-800">{g.subject}</p>
                                  <p className={`text-xs font-bold ${c.text}`}>{g.score >= 90 ? 'ممتاز' : g.score >= 75 ? 'جيد جداً' : g.score >= 60 ? 'مقبول' : 'يحتاج تحسين'}</p>
                                </div>
                              </div>
                              <div className={`text-2xl font-black ${c.text}`}>{g.score}%</div>
                            </div>
                            <div className="bg-slate-100 rounded-full h-3 overflow-hidden">
                              <motion.div className={`h-3 rounded-full ${c.bar}`} initial={{ width: 0 }} animate={{ width: `${pct(g.score)}%` }} transition={{ duration: 0.7, delay: i * 0.05 }} />
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ══ ATTENDANCE ══ */}
              {activeTab === 'attendance' && (
                <div className="space-y-5">
                  <SectionHeader icon={CheckCheck} title="سجل الحضور والغياب" color="text-teal-600" />
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <StatCard icon={Activity} label="نسبة الحضور" value={`${Math.round(attendance.percentage)}%`} color={attendance.percentage >= 90 ? 'emerald' : 'amber'} />
                    <StatCard icon={CheckCircle2} label="أيام الحضور" value={attendance.present} color="blue" />
                    <StatCard icon={Clock} label="أيام الغياب" value={attendance.absent} color="amber" />
                    <StatCard icon={AlertTriangle} label="حالات هروب" value={attendance.truancy} color="rose" />
                  </div>
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col sm:flex-row items-center gap-6">
                    {/* Ring */}
                    <div className="relative w-36 h-36 shrink-0">
                      <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                        <circle cx="60" cy="60" r="50" fill="none" stroke="#e2e8f0" strokeWidth="12" />
                        <circle cx="60" cy="60" r="50" fill="none"
                          stroke={attendance.percentage >= 90 ? '#10b981' : attendance.percentage >= 75 ? '#f59e0b' : '#ef4444'}
                          strokeWidth="12"
                          strokeDasharray={`${(attendance.percentage / 100) * 314} 314`}
                          strokeLinecap="round" style={{ transition: 'stroke-dasharray 1s ease' }} />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <p className="text-3xl font-black text-slate-800">{Math.round(attendance.percentage)}%</p>
                        <p className="text-[10px] font-bold text-slate-400">الحضور</p>
                      </div>
                    </div>
                    <div className="flex-1 w-full space-y-3">
                      {[
                        ['إجمالي الأيام', attendance.total, 'text-slate-700'],
                        ['✅ أيام الحضور', attendance.present, 'text-emerald-600'],
                        ['⏰ أيام الغياب', attendance.absent, 'text-amber-600'],
                        ['🚨 حالات الهروب', attendance.truancy, 'text-rose-600'],
                      ].map(([lbl, val, cls]) => (
                        <div key={lbl} className="flex justify-between items-center py-2 border-b border-slate-50">
                          <p className={`font-bold ${cls}`}>{lbl}</p>
                          <p className={`font-black ${cls}`}>{val} {typeof val === 'number' && val === attendance.total ? 'يوم' : typeof val === 'number' && lbl.includes('هروب') ? 'حالة' : 'يوم'}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  {attendance.percentage < 75 && (
                    <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 flex gap-3">
                      <AlertTriangle size={22} className="text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-black text-rose-800">⚠️ تحذير: نسبة الحضور منخفضة جداً</p>
                        <p className="text-rose-700 text-sm font-bold mt-1">نسبة الحضور أقل من 75% مما قد يؤثر على نتيجة الطالب. يُرجى التواصل مع الإدارة فوراً.</p>
                      </div>
                    </div>
                  )}
                  {attendance.percentage >= 95 && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex gap-3">
                      <CheckCircle2 size={22} className="text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-black text-emerald-800">ممتاز! نسبة حضور مشرّفة 🌟</p>
                        <p className="text-emerald-700 text-sm font-bold mt-1">الطالب ملتزم ومنضبط في حضوره. استمر على هذا المستوى الرائع!</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ══ SCHEDULE ══ */}
              {activeTab === 'schedule' && (
                <div className="space-y-5">
                  <SectionHeader icon={Calendar} title="الجدول الدراسي الأسبوعي" color="text-violet-600" />
                  {schedule.length === 0 ? (
                    <div className="bg-white rounded-2xl p-12 text-center border border-slate-100">
                      <Calendar size={52} className="mx-auto text-slate-200 mb-4" />
                      <h3 className="text-lg font-black text-slate-600">لم يُحدَّد الجدول بعد</h3>
                      <p className="text-slate-400 text-sm font-bold mt-1">سيظهر الجدول هنا فور إعداده من قِبل الإدارة.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {schedule.map((day, di) => (
                        <motion.div key={di} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: di * 0.05 }}
                          className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                          <div className={`px-5 py-3 flex items-center gap-2 ${day.day === todayName ? 'bg-indigo-600' : 'bg-slate-50 border-b border-slate-100'}`}>
                            <Calendar size={15} className={day.day === todayName ? 'text-white' : 'text-indigo-400'} />
                            <h3 className={`font-black text-sm ${day.day === todayName ? 'text-white' : 'text-slate-700'}`}>{day.day}</h3>
                            {day.day === todayName && <span className="mr-auto text-[10px] font-black bg-white/20 text-white px-2 py-0.5 rounded-full">اليوم</span>}
                          </div>
                          <div className="p-4 space-y-2">
                            {(day.lessons || []).map((l, li) => (
                              <div key={li} className={`flex items-center gap-3 p-3 rounded-xl ${l.subject === 'استراحة' ? 'bg-amber-50 border border-amber-100' : 'bg-slate-50'}`}>
                                <div className="w-14 text-center bg-white border border-slate-200 text-slate-700 text-xs font-black py-1.5 rounded-lg shrink-0">{l.time}</div>
                                <div className="flex-1 min-w-0">
                                  <p className={`font-bold text-sm truncate ${l.subject === 'استراحة' ? 'text-amber-700' : 'text-slate-800'}`}>{l.subject}</p>
                                  {l.instructor && l.instructor !== '-' && <p className="text-xs text-slate-400">{l.instructor} · {l.room}</p>}
                                </div>
                                <span className="text-base">{l.subject === 'استراحة' ? '☕' : '📚'}</span>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ══ CAFETERIA ══ */}
              {activeTab === 'cafeteria' && (
                <div className="space-y-5">
                  <SectionHeader icon={Wallet} title="الكافيتيريا والرصيد المالي" color="text-blue-600" />
                  <div className="bg-gradient-to-l from-blue-600 to-sky-500 rounded-2xl p-6 text-white">
                    <p className="text-blue-100 text-sm font-bold">الرصيد الحالي</p>
                    <p className="text-5xl font-black mt-2 tabular-nums">{cafBalance} <span className="text-xl text-blue-200">ر.س</span></p>
                  </div>
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
                    <div className="px-5 py-4 border-b border-slate-50 flex items-center gap-2">
                      <CreditCard size={16} className="text-blue-500" />
                      <h3 className="font-black text-slate-800 text-sm">سجل المعاملات</h3>
                    </div>
                    {cafTxns.length === 0 ? (
                      <div className="p-12 text-center">
                        <Wallet size={44} className="mx-auto text-slate-200 mb-3" />
                        <p className="font-bold text-slate-500">لا توجد معاملات مسجلة بعد</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-50">
                        {[...cafTxns].slice(0, 30).map((t, i) => (
                          <div key={t.id || i} className="flex items-center gap-3 px-5 py-3.5">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-base shrink-0 ${t.type === 'add' ? 'bg-emerald-50' : 'bg-rose-50'}`}>
                              {t.type === 'add' ? '💰' : '🛒'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-slate-800 text-sm">{t.type === 'add' ? 'إيداع رصيد' : 'مشتريات كافيتيريا'}</p>
                              <p className="text-xs text-slate-400 font-medium">{new Date(t.date).toLocaleString('ar-EG')}</p>
                            </div>
                            <p className={`font-black text-sm shrink-0 ${t.type === 'add' ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {t.type === 'add' ? '+' : '-'}{t.amount} ر.س
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ══ ACHIEVEMENTS ══ */}
              {activeTab === 'achievements' && (
                <div className="space-y-5">
                  <SectionHeader icon={Award} title="الأوسمة والإنجازات" color="text-amber-600" />
                  <div className="bg-gradient-to-l from-amber-500 to-orange-500 rounded-2xl p-6 text-white text-center">
                    <p className="text-amber-100 font-bold text-sm">إجمالي نقاط التميز</p>
                    <p className="text-5xl font-black mt-2">{totalPoints.toLocaleString()}</p>
                    <p className="text-amber-200 text-xs mt-1 font-bold">نقطة مكتسبة من الحضور والدرجات</p>
                  </div>
                  {badges.length === 0 ? (
                    <div className="bg-white rounded-2xl p-12 text-center border border-slate-100">
                      <Award size={52} className="mx-auto text-slate-200 mb-4" />
                      <h3 className="text-lg font-black text-slate-600">لا توجد أوسمة بعد</h3>
                      <p className="text-slate-400 text-sm font-bold mt-1">تُكسب الأوسمة تلقائياً بتحسّن الحضور والدرجات.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {badges.map((badge, i) => (
                        <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.07 }}
                          className="bg-white rounded-2xl border border-amber-100 shadow-sm p-5 text-center hover:shadow-md transition-shadow">
                          <div className="text-4xl mb-2">🏅</div>
                          <p className="font-black text-slate-800 text-sm">{badge}</p>
                          <div className="mt-2 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full inline-block">مكتسب</div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ══ NOTIFICATIONS ══ */}
              {activeTab === 'notifications' && (
                <div className="space-y-5">
                  <SectionHeader icon={Bell} title="الإشعارات الإدارية" color="text-blue-600" badge={unreadNotif} />
                  {notifications.length === 0 ? (
                    <div className="bg-white rounded-2xl p-12 text-center border border-slate-100">
                      <Bell size={52} className="mx-auto text-slate-200 mb-4" />
                      <h3 className="text-lg font-black text-slate-600">لا توجد إشعارات</h3>
                      <p className="text-slate-400 text-sm font-bold mt-1">ستصلك الإشعارات من إدارة المدرسة هنا.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {[...notifications].reverse().map((note) => (
                        <motion.div key={note.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                          className={`rounded-2xl border p-5 ${note.read ? 'bg-white border-slate-100 opacity-80' : 'bg-blue-50 border-blue-200 shadow-sm'}`}>
                          <div className="flex gap-3">
                            <div className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center ${note.read ? 'bg-slate-100 text-slate-400' : 'bg-blue-100 text-blue-600'}`}>
                              <Bell size={19} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start gap-2 mb-1">
                                <h4 className={`font-black text-sm ${note.read ? 'text-slate-700' : 'text-blue-900'}`}>{note.title}</h4>
                                {!note.read && <span className="w-2 h-2 bg-blue-500 rounded-full shrink-0 mt-1" />}
                              </div>
                              <p className={`text-sm leading-relaxed font-bold ${note.read ? 'text-slate-500' : 'text-blue-800'}`}>{note.message}</p>
                              <div className="flex items-center justify-between mt-3 gap-2 flex-wrap">
                                <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                                  <Clock size={10} />{new Date(note.date).toLocaleString('ar-EG')}
                                </span>
                                <div className="flex gap-1.5">
                                  {!note.read && (
                                    <button onClick={() => markAsRead(note.id)} className="text-xs font-black bg-blue-600 text-white px-3 py-1.5 rounded-xl hover:bg-blue-700 transition-colors">
                                      تحديد كمقروء
                                    </button>
                                  )}
                                  <button onClick={() => deleteNotif(note.id)} className="text-xs font-black bg-slate-100 text-slate-500 px-2.5 py-1.5 rounded-xl hover:bg-rose-50 hover:text-rose-600 transition-colors">
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ══ DISCIPLINE ══ */}
              {activeTab === 'discipline' && (
                <div className="space-y-5">
                  <SectionHeader icon={ShieldAlert} title="سجل الانضباط والإنذارات السلوكية" color="text-rose-600" />
                  {attendance.truancy > 0 && (
                    <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 flex gap-4">
                      <div className="w-11 h-11 bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center shrink-0"><AlertTriangle size={22} /></div>
                      <div>
                        <p className="font-black text-rose-800">تنبيه: غياب متعمد (هروب)</p>
                        <p className="text-rose-700 font-bold text-sm mt-1">سُجِّل على الطالب <strong>{attendance.truancy} حالة تغيب متعمد</strong> من الحصص. يُرجى المتابعة والتواصل مع الإدارة.</p>
                      </div>
                    </div>
                  )}
                  {behaviorLogs.length === 0 ? (
                    <div className="bg-white rounded-2xl p-12 text-center border border-slate-100">
                      <CheckCircle2 size={60} className="mx-auto text-emerald-400 mb-4" />
                      <h3 className="text-xl font-black text-slate-700">سجل الطالب ممتاز 🌟</h3>
                      <p className="text-slate-400 font-bold mt-2 text-sm">لا توجد أي ملاحظات أو إنذارات سلوكية مسجلة حالياً.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {[...behaviorLogs].reverse().map((log, i) => (
                        <motion.div key={i} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                          className="bg-rose-50 border border-rose-200 rounded-2xl p-5 shadow-sm">
                          <div className="flex gap-3">
                            <div className="w-10 h-10 shrink-0 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center"><ShieldAlert size={19} /></div>
                            <div className="flex-1">
                              <div className="flex justify-between items-start">
                                <h4 className="font-black text-rose-900 text-sm">{log.type || 'ملاحظة سلوكية'}</h4>
                                <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1"><Clock size={10} />{log.date}</span>
                              </div>
                              {log.points !== undefined && (
                                <p className="text-rose-800 font-bold text-sm mt-1">خصم نقاط: <strong>{Math.abs(log.points)} نقطة</strong></p>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ══ CONTACT ══ */}
              {activeTab === 'contact' && (
                <div className="space-y-5">
                  <SectionHeader icon={MessageSquare} title="التواصل مع إدارة المدرسة" color="text-indigo-600" />
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                    <h3 className="font-black text-slate-800 mb-5 text-sm flex items-center gap-2"><Send size={15} className="text-indigo-500" /> إرسال رسالة أو شكوى</h3>
                    <AnimatePresence>
                      {contactSuccess && (
                        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                          className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-4 flex items-center gap-3">
                          <CheckCircle2 size={18} className="text-emerald-600" />
                          <p className="font-black text-emerald-800 text-sm">تم الإرسال بنجاح! ستقوم الإدارة بالرد قريباً.</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <div className="space-y-3">
                      <input type="text" placeholder="موضوع الرسالة (اختياري)" value={subject} onChange={e => setSubject(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent text-slate-700 font-bold text-sm transition-all" />
                      <textarea placeholder="اكتب رسالتك للإدارة هنا..." value={msgText} onChange={e => setMsgText(e.target.value)} rows={5}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl resize-none outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent text-slate-700 font-bold text-sm leading-relaxed transition-all" />
                      <button onClick={handleSend} disabled={!msgText.trim()}
                        className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl font-black transition-colors shadow-md shadow-indigo-200 text-sm">
                        <Send size={15} /> إرسال للإدارة
                      </button>
                    </div>
                  </div>
                  {myComplaints.length > 0 && (
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
                      <div className="px-5 py-4 border-b border-slate-50 flex items-center gap-2">
                        <MessageSquare size={15} className="text-slate-400" />
                        <h3 className="font-black text-slate-800 text-sm">سجل المراسلات السابقة</h3>
                      </div>
                      <div className="divide-y divide-slate-50">
                        {[...myComplaints].reverse().map(c => (
                          <div key={c.id} className="p-5">
                            <div className="flex justify-between items-start mb-2 gap-2">
                              <p className="font-black text-slate-800 text-sm">{c.subject}</p>
                              <span className="text-[11px] text-slate-400 font-medium shrink-0">{new Date(c.date).toLocaleDateString('ar-SA')}</span>
                            </div>
                            <p className="text-slate-600 text-sm font-bold leading-relaxed">{c.text}</p>
                            {c.adminReply ? (
                              <div className="mt-3 bg-emerald-50 border border-emerald-100 rounded-xl p-4">
                                <p className="text-xs font-black text-emerald-700 mb-1 flex items-center gap-1"><CheckCircle2 size={12} /> رد الإدارة:</p>
                                <p className="text-sm text-emerald-800 font-bold">{c.adminReply}</p>
                              </div>
                            ) : (
                              <div className="mt-2 inline-flex items-center gap-1.5 bg-amber-50 text-amber-600 px-3 py-1.5 rounded-xl text-xs font-bold border border-amber-100">
                                <Clock size={11} /> قيد المراجعة
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default ParentDashboard;
