import React, { useState, useMemo, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import {
  Calendar, UserPlus, Users, CreditCard, Mailbox, Settings2, Plus, Trash2,
  CheckCircle2, ShieldAlert, Edit2, X, LogOut, Clock, Megaphone,
  BarChart2, TrendingUp, AlertTriangle, BookOpen, UserCheck, UserX, Bell,
  Download, Upload, Database, Search, Wallet, Menu
} from 'lucide-react';
import { safeMobileDownload } from '../utils/downloadUtils';


import {
  getGlobalMaster,
  SyncAll,
  isSaturdayEnabled,
  getHolidays,
  saveHolidays,
} from '../utils/dataManager';
import GlassScheduleTable from './GlassScheduleTable';
import AdminSmartAttendance from './AdminSmartAttendance';
import AdminTruancyRadar from './AdminTruancyRadar';
import AdminDailyScanner from './AdminDailyScanner';
import StudentIdGenerator from './StudentIdGenerator';
import AdminSettingsView from './AdminSettingsView';
import { useAdminTable } from '../hooks/useAdminTable';
import { getSubjectColor } from '../utils/subjectIcon';
import DataMigration from './DataMigration';

const WEEK_DAYS = ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];

// أيقونات التبديل (Toggle Switch)
const ToggleSwitch = ({ checked, onChange, label }) => (
  <div className="flex items-center justify-between gap-3">
    <span className="text-sm font-bold text-gray-700">{label}</span>
    <button
      onClick={() => onChange(!checked)}
      className={`relative w-14 h-7 rounded-full transition-all duration-300 ${checked ? 'bg-emerald-500 shadow-lg shadow-emerald-200' : 'bg-gray-300'}`}
    >
      <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-all duration-300 ${checked ? 'left-0.5' : 'left-7.5'}`} style={{ left: checked ? '2px' : '30px' }} />
    </button>
  </div>
);

/* 🔥 إضافة: مكون رد الإدارة على الشكاوى */
const ComplaintReplyBox = ({ complaint, onReply }) => {
  const [reply, setReply] = React.useState('');
  return (
    <div className="mt-3 flex gap-2">
      <input
        type="text"
        placeholder="اكتب ردك على الشكوى..."
        value={reply}
        onChange={e => setReply(e.target.value)}
        className="flex-1 border border-gray-200 rounded-xl px-4 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/30"
      />
      <button
        onClick={() => { if (reply.trim()) { onReply(complaint.id, reply.trim()); setReply(''); } }}
        disabled={!reply.trim()}
        className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold disabled:opacity-40 hover:bg-primary/90 transition-colors"
      >إرسال</button>
    </div>
  );
};
const SUBJECTS = ['الرياضيات', 'الفيزياء', 'الكيمياء', 'الأحياء', 'لغتي', 'اللغة الإنجليزية', 'الدراسات الإسلامية', 'الاجتماعيات', 'الحاسب الآلي', 'التربية البدنية', 'مادة أخرى'];

const timeToMinutes = (timeStr) => {
  const [h, m] = (timeStr || '00:00').split(':').map(Number);
  return h * 60 + m;
};
const minutesToTime = (mins) => {
  const h = Math.floor(mins / 60).toString().padStart(2, '0');
  const m = (mins % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
};

const AdminDashboard = ({ onLogout, account }) => {
  const isDeputy = account?.role === 'deputy';
  const availableRoles = isDeputy ? ['teacher', 'cafeteria'] : ['teacher', 'deputy', 'cafeteria'];
  const [activeTab, setActiveTab] = useState('classes');
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(!isMobile);
  const [successToast, setSuccessToast] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) setIsSidebarOpen(true);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const [globalMaster, setGlobalMaster] = useState(() => getGlobalMaster());
  
  const defaultPhases = [
    { id: 'primary', label: 'المرحلة الابتدائية', classes: ['أول ابتدائي', 'ثاني ابتدائي', 'ثالث ابتدائي', 'رابع ابتدائي', 'خامس ابتدائي', 'سادس ابتدائي'] },
    { id: 'middle', label: 'المرحلة المتوسطة', classes: ['أول متوسط', 'ثاني متوسط', 'ثالث متوسط'] },
    { id: 'high', label: 'المرحلة الثانوية', classes: ['أول ثانوي', 'ثاني ثانوي', 'ثالث ثانوي'] },
  ];

  const [phases, setPhases] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('moo_phases'));
      return stored && stored.length > 0 ? stored : defaultPhases;
    } catch { return defaultPhases; }
  });

  const [youngClasses, setYoungClasses] = useState(() => {
    try { return JSON.parse(localStorage.getItem('moo_young_classes')) || []; } catch { return []; }
  });

  const [whitelist, setWhitelist] = useState(() => {
    try { return JSON.parse(localStorage?.getItem?.('moo_whitelist') || '[]') || []; } catch { return []; }
  });

  const nextAwsId = useMemo(() => {
    let maxId = 0;
    (whitelist || []).forEach(s => {
      const idStr = s.id || '';
      if (idStr.toLowerCase().startsWith('aws')) {
        const num = parseInt(idStr.substring(3), 10);
        if (!isNaN(num) && num > maxId) {
          maxId = num;
        }
      }
    });
    return `aws${String(maxId + 1).padStart(5, '0')}`;
  }, [whitelist]);

  const [staff, setStaff] = useState(() => {
    try { return JSON.parse(localStorage?.getItem?.('moo_staff') || '[]') || []; } catch { return []; }
  });

  const [complaints, setComplaints] = useState(() => {
    try { return JSON.parse(localStorage?.getItem?.('moo_complaints') || '[]') || []; } catch { return []; }
  });
  const [complaintFilter, setComplaintFilter] = useState('all'); // all, students, parents

  const [announcements, setAnnouncements] = useState(() => {
    try { return JSON.parse(localStorage.getItem('moo_announcements') || '[]'); } catch { return []; }
  });
  
  const [newAnnouncement, setNewAnnouncement] = useState({
    id: '', text: '', target: 'all', priority: 'normal', startDate: '', endDate: ''
  });

  const [selectedPhase, setSelectedPhase] = useState('primary');
  const [selectedClass, setSelectedClass] = useState('');
  const [showScheduleOverlay, setShowScheduleOverlay] = useState(false);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const [settings, setSettings] = useState(globalMaster.settings || {
    firstLessonStart: '08:00',
    lessonDuration: 45,
    lessonsPerDay: 7,
    breakAfterPeriod: 4,
    breakDuration: 30
  });

  // إعداد السبت والإجازات
  const [saturdayEnabled, setSaturdayEnabled] = useState(() => isSaturdayEnabled());
  const [holidays, setHolidays] = useState(() => getHolidays());
  const [newHoliday, setNewHoliday] = useState({ name: '', startDate: '', endDate: '' });

  const [newStudent, setNewStudent] = useState({ name: '', id: 'AWS-2024-', className: '', password: '', isExempted: false, parentName: '', parentPhone: '', parentPassword: '' });
  const [newStaff, setNewStaff] = useState({ name: '', role: 'teacher', username: '', password: '', specialization: 'الرياضيات' });
  // 🔥 تحسين: حالات تعديل الطالب والموظف
  const [editingStudent, setEditingStudent] = useState(null);
  const [editingStaff, setEditingStaff] = useState(null);

  const [customSubject, setCustomSubject] = useState('');
  const [rechargeData, setRechargeData] = useState({ studentId: '', amount: '', type: 'add' });
  const [walletConfirm, setWalletConfirm] = useState(null);
  const [confirmClearLog, setConfirmClearLog] = useState(false);
  const [walletTransactions, setWalletTransactions] = useState(() => {
    try { return JSON.parse(localStorage?.getItem?.('moo_wallet_transactions') || '[]') || []; } catch { return []; }
  });
  const [walletSearch, setWalletSearch] = useState('');
  const [staffSearch, setStaffSearch] = useState('');
  const [staffFilter, setStaffFilter] = useState('all');

  // 🔥 إضافة: بحث في قائمة الطلاب
  const [studentSearch, setStudentSearch] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [studentsPage, setStudentsPage] = useState(1);
  const [importErrors, setImportErrors] = useState(null);
  const STUDENTS_PER_PAGE = 20;

  // 🔥 إضافة: نسخة من المحافظ في الحالة لتحديثها فوراً
  const [wallets, setWallets] = useState(() => {
    try { return JSON.parse(localStorage?.getItem?.('moo_wallets') || '{}') || {}; } catch { return {}; }
  });


  // 🔥 إضافة: states للإشعارات (نقلها من داخل IIFE لتجنب خطأ hooks)
  const [notifTarget, setNotifTarget] = useState('all');
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMsg, setNotifMsg] = useState('');
  const [notifAudience, setNotifAudience] = useState('students'); // students, parents
  const [notifSearch, setNotifSearch] = useState('');
  const [notifClassFilter, setNotifClassFilter] = useState('all');
  const [isNotifDropdownOpen, setIsNotifDropdownOpen] = useState(false);

  // 🔐 نظام كلمة مرور المدير الموحد
  const [passwordModalConfig, setPasswordModalConfig] = useState({ isOpen: false, title: '', desc: '', action: null, placeholder: 'أدخل كلمة مرور المدير للتأكيد...', isDanger: false });
  const [passwordInput, setPasswordInput] = useState('');

  // 🎓 نظام الترحيل والخريجين
  const [showPromotionModal, setShowPromotionModal] = useState(false);
  const [failingStudents, setFailingStudents] = useState({});
  const [promotionSelectedClass, setPromotionSelectedClass] = useState(null);
  const [graduationYear, setGraduationYear] = useState('');
  const [graduates, setGraduates] = useState(() => {
    try { return JSON.parse(localStorage.getItem('moo_graduates') || '[]'); } catch { return []; }
  });
  const [graduatesSearch, setGraduatesSearch] = useState('');
  const [graduatesYearFilter, setGraduatesYearFilter] = useState('all');

  const PROMOTION_MAP = {
    'أول ابتدائي': 'ثاني ابتدائي', 'ثاني ابتدائي': 'ثالث ابتدائي',
    'ثالث ابتدائي': 'رابع ابتدائي', 'رابع ابتدائي': 'خامس ابتدائي',
    'خامس ابتدائي': 'سادس ابتدائي', 'سادس ابتدائي': 'أول متوسط',
    'أول متوسط': 'ثاني متوسط', 'ثاني متوسط': 'ثالث متوسط',
    'ثالث متوسط': 'أول ثانوي', 'أول ثانوي': 'ثاني ثانوي',
    'ثاني ثانوي': 'ثالث ثانوي', 'ثالث ثانوي': '__graduate__',
  };

  // 🔥 useRef بعد جميع useState
  const toastTimerRef = useRef(null);
  
  // 🔥 useEffect بعد جميع useState و useRef
  // 🔥 إصلاح: useRef للـ timer
  const showToast = (msg) => {
    setSuccessToast(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setSuccessToast(''), 3000);
  };
  
  useEffect(() => () => { if (toastTimerRef.current) clearTimeout(toastTimerRef.current); }, []);

  // 🔥 إصلاح: try/catch لحماية من QuotaExceededError
  useEffect(() => {
    try { localStorage.setItem('moo_announcements', JSON.stringify(announcements)); }
    catch (e) { console.error('localStorage quota exceeded:', e); }
  }, [announcements]);

  useEffect(() => { localStorage?.setItem?.('moo_whitelist', JSON.stringify(whitelist || [])); }, [whitelist]);
  useEffect(() => { localStorage?.setItem?.('moo_staff', JSON.stringify(staff || [])); }, [staff]);
  useEffect(() => { localStorage?.setItem?.('moo_complaints', JSON.stringify(complaints || [])); }, [complaints]);

  useEffect(() => {
    const onStorage = () => {
      setGlobalMaster(getGlobalMaster());
      // 🔥 تحديث المحافظ فوراً عند أي تغيير
      try { setWallets(JSON.parse(localStorage.getItem('moo_wallets') || '{}') || {}); } catch { /* ignore */ }
    };

    window.addEventListener('storage', onStorage);
    window.addEventListener('moo-sync', onStorage);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('moo-sync', onStorage);
    };
  }, []);

  // 🔥 useMemo بعد جميع الـ hooks الأخرى
  const masterTimeSlots = useMemo(() => {
    const slots = [];
    let currentMins = timeToMinutes(settings.firstLessonStart);
    const lessonsCount = Number(settings.lessonsPerDay || 7);
    const breakAfter = Number(settings.breakAfterPeriod || 4);
    const breakDur = Number(settings.breakDuration || 30);
    const lessonDur = Number(settings.lessonDuration || 45);

    for (let i = 1; i <= lessonsCount; i++) {
      slots.push(minutesToTime(currentMins));
      currentMins += lessonDur;
      if (i === breakAfter) {
        slots.push(minutesToTime(currentMins));
        currentMins += breakDur;
      }
    }
    return slots;
  }, [settings]);

  const breakSlotTime = useMemo(() => {
    const breakAfter = Number(settings.breakAfterPeriod || 4);
    const lessonDur = Number(settings.lessonDuration || 45);
    const startMins = timeToMinutes(settings.firstLessonStart || '08:00');
    return minutesToTime(startMins + (breakAfter * lessonDur));
  }, [settings]);

  // 🔥 الدوال المساعدة
  const updatePhases = (newPhases, updatedLessons = null) => {
    setPhases(newPhases);
    localStorage.setItem('moo_phases', JSON.stringify(newPhases));

    const freshMaster = getGlobalMaster();
    const allClasses = newPhases.reduce((acc, p) => [...acc, ...p.classes], []);

    const updatedMaster = {
      ...freshMaster,
      classes: allClasses,
      lessons: updatedLessons !== null ? updatedLessons : freshMaster.lessons
    };

    SyncAll(updatedMaster);
    setGlobalMaster(updatedMaster);
    window.dispatchEvent(new Event('storage')); window.dispatchEvent(new CustomEvent('moo-sync'));
  };

  const toggleYoungClass = (className) => {
    const updated = youngClasses.includes(className)
      ? youngClasses.filter(c => c !== className)
      : [...youngClasses, className];
    setYoungClasses(updated);
    localStorage.setItem('moo_young_classes', JSON.stringify(updated));
    window.dispatchEvent(new Event('storage')); window.dispatchEvent(new CustomEvent('moo-sync'));
  };

  const handleAddClass = (phaseId, className) => {
    if (!className.trim()) return;
    let isDuplicate = false;
    const newPhases = phases.map(p => {
      if (p.id === phaseId) {
        if (p.classes.includes(className)) { isDuplicate = true; return p; }
        return { ...p, classes: [...p.classes, className] };
      }
      return p;
    });
    if (isDuplicate) { showToast('❌ هذا الفصل موجود بالفعل!'); return; }
    updatePhases(newPhases);
    showToast(`✅ تم إضافة فصل ${className} بنجاح`);
  };

  const handleDeleteClass = (phaseId, className) => {
    setPasswordModalConfig({
      isOpen: true,
      title: 'حذف فصل',
      desc: `هل أنت متأكد من حذف فصل: ${className}؟ سيتم حذف جميع الحصص المرتبطة به فوراً.`,
      isDanger: true,
      action: () => {
        const newPhases = phases.map(p => {
          if (p.id === phaseId) {
            return { ...p, classes: p.classes.filter(c => c !== className) };
          }
          return p;
        });
        const freshMaster = getGlobalMaster();
        const cleanedLessons = (freshMaster.lessons || []).filter(lesson => lesson.classCode !== className);
        updatePhases(newPhases, cleanedLessons);
        showToast(`❌ تم حذف فصل ${className} وتطهير جدوله بالكامل`);
      }
    });
  };

  const handleSaveAnnouncement = (e) => {
    e.preventDefault();
    if (!newAnnouncement.text.trim()) { showToast('❌ يرجى كتابة نص الإعلان'); return; }

    const toSave = { ...newAnnouncement, id: newAnnouncement.id || Date.now().toString() };
    const updated = newAnnouncement.id
      ? announcements.map(a => a.id === toSave.id ? toSave : a)
      : [toSave, ...announcements];

    setAnnouncements(updated);
    window.dispatchEvent(new Event('storage')); window.dispatchEvent(new CustomEvent('moo-sync'));
    setNewAnnouncement({ id: '', text: '', target: 'all', priority: 'normal', startDate: '', endDate: '' });
    showToast('✅ تم حفظ ونشر الإعلان بنجاح!');
  };

  const handleDeleteAnnouncement = (id) => {
    if (!window.confirm('حذف هذا الإعلان؟')) return;
    setAnnouncements(announcements.filter(a => a.id !== id));
    window.dispatchEvent(new Event('storage')); window.dispatchEvent(new CustomEvent('moo-sync'));
    showToast('❌ تم حذف الإعلان');
  };

  const {
    scheduleData,
    WEEK_DAYS: ADMIN_WEEK_DAYS,
    editingLesson, setEditingLesson,
    lessonForm, setLessonForm,
    handleSaveLesson,
    handleDeleteLesson,
    handleEmptyCellClick,
    handleMoveLesson,
  } = useAdminTable({ globalMaster, setGlobalMaster, settings, selectedClass, showToast });

  const totalClasses = useMemo(() => {
    const phaseClasses = (phases || []).flatMap(phase => phase.classes || []);
    return phaseClasses.length || (globalMaster.classes || []).length;
  }, [phases, globalMaster.classes]);

  const handleEditLesson = (lesson) => {
    if (!lesson || lesson.type === 'break' || lesson.isBreak) return;
    setEditingLesson({ ...lesson, isEdit: true });
    setLessonForm({
      subject: lesson.subject || '',
      instructor: lesson.instructor || '',
      room: lesson.room || ''
    });
  };

  const applyGlobalTimeSettings = () => {
    const newSettings = { ...settings };
    const oldSettings = globalMaster.settings || newSettings;

    const getLessonTimes = (cfg) => {
      const times = [];
      let mins = timeToMinutes(cfg.firstLessonStart || '08:00');
      const count = Number(cfg.lessonsPerDay || 7);
      const breakAfter = Number(cfg.breakAfterPeriod || 4);
      const breakDur = Number(cfg.breakDuration || 30);
      const lessonDur = Number(cfg.lessonDuration || 45);

      for (let i = 1; i <= count; i++) {
        times.push(minutesToTime(mins));
        mins += lessonDur;
        if (i === breakAfter) mins += breakDur;
      }
      return times;
    };

    const oldTimes = getLessonTimes(oldSettings);
    const newTimes = getLessonTimes(newSettings);

    const timeMap = {};
    oldTimes.forEach((oldTime, index) => {
      if (newTimes[index]) {
        timeMap[oldTime] = newTimes[index];
      }
    });

    let currentMins = timeToMinutes(newSettings.firstLessonStart);
    const newTimesMapping = [];
    const newSchoolTemplate = [];

    const lessonsCount = Number(newSettings.lessonsPerDay || 7);
    const breakAfter = Number(newSettings.breakAfterPeriod || 4);
    const breakDur = Number(newSettings.breakDuration || 30);
    const lessonDur = Number(newSettings.lessonDuration || 45);

    for (let i = 1; i <= lessonsCount; i++) {
      const timeStr = minutesToTime(currentMins);
      newTimesMapping.push({ period: i, time: timeStr, isBreak: false });

      ADMIN_WEEK_DAYS.forEach(day => {
        newSchoolTemplate.push({
          id: `slot-${day}-${timeStr}`,
          day: day,
          startTime: timeStr,
          duration: lessonDur,
          isBreak: false,
          reserved: false,
          label: `الحصة ${i}`
        });
      });

      currentMins += lessonDur;

      if (i === breakAfter) {
        const breakTimeStr = minutesToTime(currentMins);
        newTimesMapping.push({ period: 'break', time: breakTimeStr, isBreak: true });

        ADMIN_WEEK_DAYS.forEach(day => {
          newSchoolTemplate.push({
            id: `slot-${day}-${breakTimeStr}-break`,
            day: day,
            startTime: breakTimeStr,
            duration: breakDur,
            isBreak: true,
            reserved: true,
            reservedType: 'break',
            label: 'فسحة'
          });
        });

        currentMins += breakDur;
      }
    }

    const freshMaster = getGlobalMaster();
    let allLessons = Array.isArray(freshMaster.lessons) ? [...freshMaster.lessons] : [];

    allLessons = allLessons.filter(l => l.type !== 'break' && !l.isBreak && l.subject !== 'وقت راحة' && l.subject !== 'فسحة');

    const updatedLessons = allLessons.map(lesson => {
      if (timeMap[lesson.time]) {
        const newTime = timeMap[lesson.time];
        const templateSlot = newSchoolTemplate.find(s => s.day === lesson.day && s.startTime === newTime);
        if (templateSlot) {
          templateSlot.reserved = true;
          templateSlot.reservedBy = lesson.instructor;
          templateSlot.reservedType = 'lesson';
          templateSlot.subject = lesson.subject;
        }
        return { ...lesson, time: newTime };
      }
      return lesson;
    });

    const breakSlot = newTimesMapping.find(s => s.isBreak);
    if (breakSlot) {
      phases.forEach(phase => {
        phase.classes.forEach(cls => {
          ADMIN_WEEK_DAYS.forEach(day => {
            updatedLessons.push({
              id: `global-break-${cls}-${day}`,
              day: day,
              time: breakSlot.time,
              subject: 'فسحة',
              instructor: 'النظام',
              room: 'ساحة المدرسة',
              stage: phase.label,
              classCode: cls,
              type: 'break',
              isBreak: true
            });
          });
        });
      });
    }

    const updatedMaster = { ...freshMaster, settings: newSettings, lessons: updatedLessons };
    localStorage.setItem('schoolTemplate', JSON.stringify(newSchoolTemplate));
    localStorage.setItem('schoolMasterSchedule', JSON.stringify(newSchoolTemplate));

    SyncAll(updatedMaster);
    setGlobalMaster(updatedMaster);
    showToast('✅ تم تطبيق الهيكلة الزمنية والفسحة على جميع الجداول بنجاح!');

    window.dispatchEvent(new Event('storage')); window.dispatchEvent(new CustomEvent('moo-sync'));
  };

  const stats = [
    { label: 'الفصول', value: totalClasses, icon: <Calendar />, color: 'text-purple-400' },
    { label: 'الطلاب', value: whitelist?.length || 0, icon: <UserPlus />, color: 'text-blue-400' },
    { label: 'الكوادر', value: staff?.length || 0, icon: <Users />, color: 'text-emerald-400' },
    { label: 'الإعلانات', value: announcements?.length || 0, icon: <Megaphone />, color: 'text-orange-400' },
  ];

  const currentPhase = phases.find(p => p.id === selectedPhase) || phases[0];

  // 🔥 تصدير واستيراد الإكسيل
  const fileInputRef = useRef(null);

  const handleExportStudents = () => {
    if (!whitelist || whitelist.length === 0) {
      showToast('⚠️ لا يوجد طلاب لتصديرهم!');
      return;
    }
    const dataToExport = whitelist.map(s => ({
      'الاسم': s.name || '',
      'رقم الهوية': s.id || '',
      'الفصل': s.className || '',
      'اسم ولي الأمر': s.parentName || '',
      'رقم هاتف ولي الأمر': s.parentPhone || '',
      'الرقم السري': s.password || '',
      'الرقم السري لولي الأمر': s.parentPassword || '',
      'بروتوكول الأطفال': s.isExempted ? 'نعم' : 'لا',
      'تاريخ الإضافة': s.createdAt || ''
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    
    // 🔥 ضبط اتجاه الورقة (من اليمين لليسار)
    ws['!dir'] = 'rtl';

    // 🔥 ضبط عرض الأعمدة بشكل احترافي
    ws['!cols'] = [
      { wch: 30 }, // الاسم
      { wch: 20 }, // رقم الهوية
      { wch: 18 }, // الفصل
      { wch: 30 }, // اسم ولي الأمر
      { wch: 20 }, // رقم هاتف ولي الأمر
      { wch: 15 }, // الرقم السري
      { wch: 25 }, // الرقم السري لولي الأمر
      { wch: 15 }, // بروتوكول الأطفال
      { wch: 15 }  // تاريخ الإضافة
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "الطلاب");
    const b64 = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' }); safeMobileDownload(b64, "سجل_الطلاب.xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    showToast('✅ تم تصدير بيانات الطلاب بنجاح!');
  };

  const handleImportStudents = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);

        const errors = [];
        const parsedStudents = [];

        // 🔥 جلب أعلى رقم هوية موجود لتكملة التسلسل
        let currentMaxId = 0;
        (whitelist || []).forEach(s => {
          const idStr = s.id || '';
          if (idStr.toLowerCase().startsWith('aws')) {
            const num = parseInt(idStr.substring(3), 10);
            if (!isNaN(num) && num > currentMaxId) {
              currentMaxId = num;
            }
          }
        });

        json.forEach((row, index) => {
          const rowNum = index + 2; // +1 لتعويض الاندكس 0، و +1 لأن الصف الأول هو العناوين
          const name = row['الاسم'] || row['Name'] || row['name'] || '';
          let id = (row['رقم الهوية'] || row['الهوية'] || row['ID'] || row['id'] || '').toString().trim();
          
          // الاسم فقط هو الإجباري
          if (!name) {
            errors.push({ row: rowNum, name: 'بدون اسم', id: id || 'لا يوجد' });
            return;
          }

          if (id) {
            // لو كاتب هوية، لازم نتأكد من صيغتها
            if (!/^aws\d+$/i.test(id)) {
              errors.push({ row: rowNum, name: name, id: `${id} (صيغة خاطئة، يجب أن يبدأ بـ aws يليه أرقام)` });
              return;
            }
            // تحديث العداد لو كتب رقم هوية أكبر من الموجود
            const num = parseInt(id.substring(3), 10);
            if (!isNaN(num) && num > currentMaxId) {
              currentMaxId = num;
            }
          } else {
            // إذا لم يتم كتابة رقم الهوية، نبحث عن الطالب بالاسم لتفادي التكرار
            const existingStudentByName = (whitelist || []).find(s => s.name.trim() === name.trim());
            if (existingStudentByName) {
              id = existingStudentByName.id; // تحديث بياناته الموجودة بدلاً من إنشاء طالب جديد
            } else {
              // لو مكتبش هوية والاسم جديد، هنولدله هوية بالتسلسل
              currentMaxId++;
              id = `aws${String(currentMaxId).padStart(5, '0')}`;
            }
          }

          const isExempted = (row['بروتوكول الأطفال'] === 'نعم' || row['معفى (مستمع)'] === 'نعم' || row['معفى'] === 'نعم' || row['isExempted'] === 'true');
          
          const studentData = {
            id: id,
            name: name,
            className: row['الفصل'] || row['Class'] || row['class'] || '',
            parentName: row['اسم ولي الأمر'] || row['Parent Name'] || '',
            parentPhone: (row['رقم هاتف ولي الأمر'] || row['Parent Phone'] || '').toString(),
            password: (row['باسورد الطالب'] || row['الرقم السري'] || row['Password'] || id).toString(),
            parentPassword: (row['باسورد ولي الأمر'] || row['الرقم السري لولي الأمر'] || row['Parent Password'] || id).toString(),
            isExempted: isExempted,
            type: 'student',
            createdAt: row['تاريخ الإضافة'] || new Date().toISOString().split('T')[0]
          };

          parsedStudents.push(studentData);
        });

        if (errors.length > 0) {
          setImportErrors(errors);
          if (fileInputRef.current) fileInputRef.current.value = '';
          return;
        }

        let addedCount = 0;
        let updatedCount = 0;
        let newWhitelist = [...(whitelist || [])];

        parsedStudents.forEach(studentData => {
          const existingIndex = newWhitelist.findIndex(s => s.id === studentData.id);
          if (existingIndex >= 0) {
            newWhitelist[existingIndex] = { ...newWhitelist[existingIndex], ...studentData };
            updatedCount++;
          } else {
            newWhitelist.push(studentData);
            addedCount++;
          }
        });

        setWhitelist(newWhitelist);
        localStorage.setItem('moo_whitelist', JSON.stringify(newWhitelist));
        window.dispatchEvent(new Event('storage')); window.dispatchEvent(new CustomEvent('moo-sync'));
        showToast(`✅ تم استيراد ${addedCount} طالب جديد، وتحديث ${updatedCount} طالب بنجاح!`);
      } catch (err) {
        showToast('❌ حدث خطأ أثناء الاستيراد! تأكد من صيغة الملف.');
        console.error(err);
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsArrayBuffer(file);
  };

  const handleAddStudent = (e) => {
    e?.preventDefault?.();
    const finalId = nextAwsId;
    const studentWithAutoId = { ...newStudent, id: finalId };

    if (!studentWithAutoId?.name?.trim?.() || !studentWithAutoId?.password?.trim?.() || !studentWithAutoId?.className?.trim?.() || !studentWithAutoId?.parentPassword?.trim?.()) {
      showToast('❌ ملء جميع حقول الطالب وولي الأمر مطلوب');
      return;
    }
    if ((whitelist || [])?.find?.(s => s?.id === finalId)) {
      showToast(`❌ هذا الـ ID مسجل بالفعل!`);
      return;
    }
    // 🔥 إضافة: تحذير duplicate الاسم
    if ((whitelist || [])?.find?.(s => s?.name?.trim() === studentWithAutoId?.name?.trim())) {
      if (!window.confirm(`⚠️ يوجد طالب بنفس الاسم "${studentWithAutoId.name}" مسبقاً.\nهل تريد الإضافة على أي حال؟`)) return;
    }
    const studentWithDate = { ...studentWithAutoId, createdAt: new Date().toISOString().split('T')[0] };
    setWhitelist([...(whitelist || []), studentWithDate]);
    const wallets = JSON.parse(localStorage?.getItem?.('moo_wallets') || '{}') || {};
    // 🔥 إصلاح: الطالب الجديد يبدأ بـ 0 — المسئول هو اللي يشحن الرصيد يدوياً
    wallets[finalId] = 0;
    localStorage?.setItem?.('moo_wallets', JSON.stringify(wallets));
    setWallets(wallets);
    window.dispatchEvent(new Event('storage')); window.dispatchEvent(new CustomEvent('moo-sync'));
    setNewStudent({ name: '', id: '', className: '', password: '', isExempted: false, parentName: '', parentPhone: '', parentPassword: '' });
    showToast(`✅ تم إضافة طالب: ${studentWithAutoId?.name}`);
  };

  const handleToggleExemption = (id) => {
    const updated = (whitelist || []).map(s => s.id === id ? { ...s, isExempted: !s.isExempted } : s);
    setWhitelist(updated);
    showToast('✅ تم تحديث حالة الاستثناء للطالب');
  };

  // 🔥 التعديل 1: منع تكرار الكوادر والتفرقة الدقيقة
  const handleAddStaff = (e, explicitRole = null) => {
    e?.preventDefault?.();
    if (!newStaff?.name || !newStaff?.username || !newStaff?.password) {
      showToast('❌ أكمل البيانات المطلوبة');
      return;
    }

    // فحص تكرار اسم المستخدم
    const isUsernameExists = (staff || []).some(s => s.username === newStaff.username);
    if (isUsernameExists) {
      showToast('❌ اسم المستخدم هذا مسجل مسبقاً، يرجى اختيار اسم آخر.');
      return;
    }

    // فحص تكرار كلمة المرور (حسب طلبك)
    const isPasswordExists = (staff || []).some(s => s.password === newStaff.password);
    if (isPasswordExists) {
      showToast('❌ كلمة المرور هذه مستخدمة، يرجى اختيار كلمة مرور مختلفة.');
      return;
    }

    const actualRole = explicitRole || newStaff?.role || 'teacher';
    let finalSpec = '';
    if (actualRole === 'teacher') {
      finalSpec = newStaff?.specialization === 'مادة أخرى' ? customSubject : (newStaff?.specialization || 'الرياضيات');
    } else if (actualRole === 'deputy') {
      finalSpec = 'إدارة عليا (وكيل)';
    } else {
      finalSpec = 'خدمات مساندة (مقصف)';
    }

    const updatedStaff = [...(staff || []), { ...newStaff, role: actualRole, specialization: finalSpec, id: Date.now().toString() }];
    setStaff(updatedStaff);
    localStorage.setItem('moo_staff', JSON.stringify(updatedStaff));

    setNewStaff({ name: '', role: 'teacher', username: '', password: '', specialization: 'الرياضيات' });
    setCustomSubject('');
    showToast('✅ تم إضافة الموظف بنجاح');
  };

  const handleRemoveStudent = (id) => {
    if (!window.confirm('حذف هذا الطالب؟')) return;
    setWhitelist((whitelist || [])?.filter?.(s => s?.id !== id));
    // 🔥 إضافة: حذف المحفظة والإشعارات أيضاً عند حذف الطالب
    try {
      const wallets = JSON.parse(localStorage.getItem('moo_wallets') || '{}') || {};
      delete wallets[id];
      localStorage.setItem('moo_wallets', JSON.stringify(wallets));
      setWallets(wallets);
      const notifs = JSON.parse(localStorage.getItem('moo_student_notifications') || '{}') || {};
      delete notifs[id];
      localStorage.setItem('moo_student_notifications', JSON.stringify(notifs));
    } catch { }
    window.dispatchEvent(new Event('storage')); window.dispatchEvent(new CustomEvent('moo-sync'));
    showToast('❌ تم الحذف');
  };

  // 🔥 التعديل 2: الحذف الشامل والتطهير الكامل للمعلم
  const handleRemoveStaff = (id) => {
    if (!window.confirm('⚠️ هل أنت متأكد من حذف الموظف نهائياً؟\nسيتم مسح جميع حصصه واختباراته وتصبح أوقاتها فارغة ومتاحة للجميع.')) return;

    const staffToRemove = (staff || [])?.find?.(s => s?.id === id);
    const updatedStaffList = (staff || [])?.filter?.(s => s?.id !== id);
    setStaff(updatedStaffList);
    localStorage.setItem('moo_staff', JSON.stringify(updatedStaffList));

    if (staffToRemove?.role === 'teacher') {
      // أ. مسح الحصص من الجدول لتصبح خانات فارغة
      const master = getGlobalMaster();
      master.lessons = (master.lessons || []).filter(l => l?.instructor !== staffToRemove?.name);
      SyncAll(master);
      setGlobalMaster(master);

      // ب. مسح اختبارات المعلم من منصته
      const tests = JSON.parse(localStorage.getItem('moo_tests') || '[]');
      const remainingTests = tests.filter(t => t.teacherName !== staffToRemove.name);
      localStorage.setItem('moo_tests', JSON.stringify(remainingTests));

      // ج. مسح اختبارات المعلم من بوابة الطلاب
      const exams = JSON.parse(localStorage.getItem('exams') || '[]');
      const remainingExams = exams.filter(ex => ex.instructor !== staffToRemove.name);
      localStorage.setItem('exams', JSON.stringify(remainingExams));
    }

    window.dispatchEvent(new Event('storage')); window.dispatchEvent(new CustomEvent('moo-sync'));
    window.dispatchEvent(new CustomEvent('moo-sync'));
    showToast('❌ تم الحذف وتطهير بيانات الموظف بنجاح');
  };

  // 🔥 تحسين: حفظ تعديل بيانات الطالب (مع نقل المحفظة والإشعارات لو تغيّر الـ ID)
  const handleSaveStudentEdit = (e) => {
    e?.preventDefault?.();
    if (!editingStudent?.name?.trim?.() || !editingStudent?.id?.trim?.() || !editingStudent?.password?.trim?.() || !editingStudent?.className?.trim?.()) {
      showToast('❌ ملء جميع الحقول مطلوب');
      return;
    }
    const oldId = editingStudent._oldId;
    // لو تغيّر الـ ID نتأكد أنه غير مستخدم لطالب آخر
    if (oldId !== editingStudent.id && (whitelist || []).some(s => s.id === editingStudent.id)) {
      showToast('❌ رقم الهوية الجديد مستخدم بالفعل لطالب آخر!');
      return;
    }
    const cleanStudent = { ...editingStudent };
    delete cleanStudent._oldId;
    setWhitelist((whitelist || []).map(s => s.id === oldId ? cleanStudent : s));

    // نقل المحفظة لو تغيّر الـ ID
    if (oldId !== editingStudent.id) {
      try {
        const wallets = JSON.parse(localStorage.getItem('moo_wallets') || '{}') || {};
        if (Object.prototype.hasOwnProperty.call(wallets, oldId)) {
          wallets[editingStudent.id] = wallets[oldId];
          delete wallets[oldId];
          localStorage.setItem('moo_wallets', JSON.stringify(wallets));
          setWallets(wallets);
        }
        const notifs = JSON.parse(localStorage.getItem('moo_student_notifications') || '{}') || {};
        if (Object.prototype.hasOwnProperty.call(notifs, oldId)) {
          notifs[editingStudent.id] = notifs[oldId];
          delete notifs[oldId];
          localStorage.setItem('moo_student_notifications', JSON.stringify(notifs));
        }
      } catch { }
    }
    window.dispatchEvent(new Event('storage')); window.dispatchEvent(new CustomEvent('moo-sync'));
    setEditingStudent(null);
    showToast('✅ تم حفظ تعديلات الطالب بنجاح');
  };

  // 🔥 تحسين: حفظ تعديل بيانات الموظف/المعلم (مع تحديث اسم المعلم في الحصص)
  const handleSaveStaffEdit = (e) => {
    e?.preventDefault?.();
    if (!editingStaff?.name?.trim?.() || !editingStaff?.username?.trim?.() || !editingStaff?.password?.trim?.()) {
      showToast('❌ أكمل البيانات المطلوبة');
      return;
    }
    const sid = editingStaff.id;
    // فحص تكرار اسم المستخدم لدى موظف آخر
    if ((staff || []).some(s => s.id !== sid && s.username === editingStaff.username)) {
      showToast('❌ اسم المستخدم هذا مسجل لموظف آخر!');
      return;
    }
    // فحص تكرار كلمة المرور لدى موظف آخر
    if ((staff || []).some(s => s.id !== sid && s.password === editingStaff.password)) {
      showToast('❌ كلمة المرور هذه مستخدمة لموظف آخر!');
      return;
    }

    const oldStaff = (staff || []).find(s => s.id === sid);
    let finalSpec = editingStaff.specialization;
    if (editingStaff.role === 'teacher') {
      finalSpec = editingStaff.specialization === 'مادة أخرى' ? (editingStaff._customSubject || customSubject || 'مادة أخرى') : (editingStaff.specialization || 'الرياضيات');
    } else if (editingStaff.role === 'deputy') {
      finalSpec = 'إدارة عليا (وكيل)';
    } else {
      finalSpec = 'خدمات مساندة (مقصف)';
    }
    const cleanStaff = { ...editingStaff, specialization: finalSpec };
    delete cleanStaff._customSubject;

    const updatedStaffList = (staff || []).map(s => s.id === sid ? cleanStaff : s);
    setStaff(updatedStaffList);
    localStorage.setItem('moo_staff', JSON.stringify(updatedStaffList));

    // لو تغيّر اسم المعلم نحدّث اسمه في كل الحصص المرتبطة به
    if (oldStaff?.role === 'teacher' && oldStaff?.name !== cleanStaff.name) {
      const master = getGlobalMaster();
      master.lessons = (master.lessons || []).map(l => l?.instructor === oldStaff.name ? { ...l, instructor: cleanStaff.name } : l);
      SyncAll(master);
      setGlobalMaster(master);
    }

    window.dispatchEvent(new Event('storage')); window.dispatchEvent(new CustomEvent('moo-sync'));
    window.dispatchEvent(new CustomEvent('moo-sync'));
    setEditingStaff(null);
    showToast('✅ تم حفظ تعديلات الموظف بنجاح');
  };

  const handleDeleteComplaint = (id) => {
    const updated = (complaints || [])?.filter?.(c => c?.id !== id);
    setComplaints(updated);
    showToast('✅ تم حذف الشكوى');
  };

  const handleRecharge = (e) => {
    e?.preventDefault?.();
    if (!rechargeData?.studentId || !rechargeData?.amount) {
      showToast('❌ أكمل البيانات');
      return;
    }
    const student = (whitelist || [])?.find?.(s => s?.id === rechargeData?.studentId) ||
      (whitelist || [])?.find?.(s => s?.name?.includes?.(rechargeData?.studentId));
    if (!student) {
      showToast('❌ لم يتم العثور على طالب');
      return;
    }
    const amount = parseFloat(rechargeData?.amount);
    if (isNaN(amount) || amount <= 0) {
      showToast('❌ المبلغ غير صحيح');
      return;
    }

    const actionText = rechargeData?.type === 'subtract' ? 'سحب' : 'شحن';
    
    // إظهار كارت التأكيد بدلاً من window.confirm
    setWalletConfirm({
      student,
      amount,
      type: rechargeData.type,
      actionText
    });
  };

  const executeWalletTransaction = () => {
    if (!walletConfirm) return;

    const { student, amount, type } = walletConfirm;
    const wallets = JSON.parse(localStorage?.getItem?.('moo_wallets') || '{}') || {};
    const currentBalance = wallets[student?.id] || 0;
    
    let newBalance = currentBalance;
    if (type === 'subtract') {
      newBalance -= amount;
      if (newBalance < 0) newBalance = 0; // منع الرصيد السالب
    } else {
      newBalance += amount;
    }

    wallets[student?.id] = newBalance;
    localStorage?.setItem?.('moo_wallets', JSON.stringify(wallets));
    setWallets(wallets);

    // تسجيل العملية في السجل
    const newTransaction = {
      id: Date.now(),
      studentId: student.id,
      studentName: student.name,
      amount: amount,
      type: type || 'add',
      date: new Date().toISOString()
    };
    const updatedTransactions = [newTransaction, ...walletTransactions].slice(0, 20); // الاحتفاظ بآخر 20 عملية فقط
    localStorage.setItem('moo_wallet_transactions', JSON.stringify(updatedTransactions));
    setWalletTransactions(updatedTransactions);

    window?.dispatchEvent?.(new Event('storage'));
    setRechargeData({ studentId: '', amount: '', type: 'add' });
    setWalletConfirm(null);
    showToast(type === 'subtract' ? `✅ تم سحب ${amount} ريال من رصيد ${student.name}` : `✅ تم شحن ${amount} ريال لـ ${student.name}`);
  };

  const handleClearLog = () => {
    setWalletTransactions([]);
    localStorage.removeItem('moo_wallet_transactions');
    setConfirmClearLog(false);
    showToast('✅ تم مسح السجل بنجاح');
  };

  // 🔥 إضافة: دالة إرسال الإشعارات (نقلت من داخل IIFE)
  const handleSendNotif = () => {
    if (!notifTitle.trim() || !notifMsg.trim()) return showToast('❌ يرجى ملء العنوان والرسالة');
    
    const notifKey = notifAudience === 'parents' ? 'moo_parent_notifications' : 'moo_student_notifications';
    const store = JSON.parse(localStorage.getItem(notifKey) || '{}');
    
    const newNotif = {
      id: `admin_${Date.now()}`,
      title: notifTitle.trim(),
      message: notifMsg.trim(),
      time: 'الآن',
      date: new Date().toISOString(),
      isNew: true,
      read: false,
      type: 'admin',
      from: 'الإدارة'
    };
    
    const targets = notifTarget === 'all'
      ? (whitelist || [])
          .filter(s => notifClassFilter === 'all' || s.className === notifClassFilter)
          .map(s => s.id)
      : [notifTarget];
      
    targets.forEach(id => {
      if (!store[id]) store[id] = [];
      store[id].unshift(newNotif);
      if (store[id].length > 50) store[id] = store[id].slice(0, 50);
    });
    
    localStorage.setItem(notifKey, JSON.stringify(store));
    window.dispatchEvent(new CustomEvent('moo-sync'));
    
    setNotifTitle('');
    setNotifMsg('');
    
    let targetName = 'الجميع';
    if (notifTarget !== 'all') {
      const sName = whitelist.find(s => s.id === notifTarget)?.name;
      targetName = notifAudience === 'parents' ? `ولي أمر الطالب: ${sName}` : sName;
    } else {
      targetName = notifAudience === 'parents' ? 'جميع أولياء الأمور' : 'جميع الطلاب';
      if (notifClassFilter !== 'all') targetName += ` (${notifClassFilter})`;
    }
    
    showToast(`✅ تم إرسال الإشعار لـ ${targetName}`);
  };

  // 🔥 إضافة: تصدير نسخة احتياطية كاملة (Backup) لكل بيانات النظام
  const BACKUP_KEYS = [
    'GLOBAL_ACADEMIC_MASTER', 'moo_achievements', 'moo_student_notifications',
    'moo_pinned_badges', 'moo_dismissed_results', 'moo_wallets', 'moo_cart',
    'exams', 'moo_tests', 'moo_global_schedule', 'moo_exams_migrated',
    'moo_cafeteria_menu', 'moo_cafeteria_orders', 'moo_notifications',
    'moo_theme_color', 'moo_spent_points', 'moo_store_purchases',
    'moo_auto_attendance_enabled', 'moo_announcements', 'moo_phases',
    'schoolTemplate', 'schoolMasterSchedule', 'moo_staff', 'moo_saturday_enabled',
    'moo_whitelist', 'moo_grace_periods', 'moo_attendance', 'moo_school_vault',
    'moo_daily_attendance_manual', 'moo_grades', 'moo_complaints',
    'moo_question_bank', 'moo_paper_exam_grades', 'moo_paper_exam_archive',
    'moo_holidays', 'moo_graduates'
  ];

  const [isExportingPDF, setIsExportingPDF] = useState(false);

  const handleExportPDF = async () => {
    setIsExportingPDF(true);
    const element = document.getElementById('pdf-report-template');
    if (!element) {
      showToast('خطأ: لم يتم العثور على القالب', 'error');
      setIsExportingPDF(false);
      return;
    }

    try {
      element.style.display = 'block';
      const canvas = await html2canvas(element, { scale: 2, useCORS: true, logging: false });
      element.style.display = 'none';

      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`احصائيات_مدارس_الاوس_${new Date().toLocaleDateString('ar-SA').replace(/\//g, '-')}.pdf`);
      showToast('✅ تم استخراج التقرير بنجاح', 'success');
    } catch (error) {
      console.error('Error generating PDF:', error);
      showToast('❌ حدث خطأ أثناء إنشاء التقرير', 'error');
    }
    setIsExportingPDF(false);
  };

  const handleExportBackup = () => {
    try {
      const data = {};
      BACKUP_KEYS.forEach(k => {
        const v = localStorage.getItem(k);
        if (v !== null) data[k] = v;
      });
      const payload = {
        _meta: { app: 'MOO', type: 'full-backup', version: 1, date: new Date().toISOString() },
        data,
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `moo-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('✅ تم تصدير النسخة الاحتياطية بنجاح');
    } catch (err) {
      console.error(err);
      showToast('❌ فشل تصدير النسخة الاحتياطية');
    }
  };

  const handleImportBackup = (e) => {
    const file = e?.target?.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result);
        const data = parsed?.data || parsed;
        if (!data || typeof data !== 'object') throw new Error('صيغة غير صالحة');
        if (!window.confirm('⚠️ سيتم استبدال البيانات الحالية بمحتوى النسخة الاحتياطية. هل أنت متأكد؟')) return;
        Object.keys(data).forEach(k => {
          if (BACKUP_KEYS.includes(k) && typeof data[k] === 'string') {
            localStorage.setItem(k, data[k]);
          }
        });        // تحديث الحالة المحلية بعد الاستيراد
        try { setWhitelist(JSON.parse(localStorage.getItem('moo_whitelist') || '[]')); } catch { /* */ }
        try { setStaff(JSON.parse(localStorage.getItem('moo_staff') || '[]')); } catch { /* */ }
        try { setComplaints(JSON.parse(localStorage.getItem('moo_complaints') || '[]')); } catch { /* */ }
        try { setAnnouncements(JSON.parse(localStorage.getItem('moo_announcements') || '[]')); } catch { /* */ }
        try { setPhases(JSON.parse(localStorage.getItem('moo_phases') || '[]')); } catch { /* */ }
        try { setWallets(JSON.parse(localStorage.getItem('moo_wallets') || '{}')); } catch { /* */ }
        setGlobalMaster(getGlobalMaster());
        window.dispatchEvent(new Event('storage')); window.dispatchEvent(new CustomEvent('moo-sync'));
        showToast('✅ تم استيراد النسخة الاحتياطية بنجاح');
      } catch (err) {
        console.error(err);
        showToast('❌ ملف النسخة الاحتياطية غير صالح');
      } finally {
        e.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="relative min-h-screen bg-transparent">
      <AnimatePresence>
        {successToast && (
          <motion.div
            initial={{ opacity: 0, y: -50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className="fixed top-10 left-1/2 z-[100] bg-emerald-500 text-white px-8 py-4 rounded-full shadow-2xl flex items-center gap-4"
          >
            <CheckCircle2 size={20} />
            <span className="font-bold text-sm">{successToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col" dir="rtl">
        {!showScheduleOverlay && (
          <>
            <motion.header
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="header-modern bg-white/80 backdrop-blur-xl border-b border-white/20 px-4 sm:px-8 py-3 sm:py-4 flex flex-wrap justify-between items-center sticky top-0 z-50 shadow-sm gap-y-3"
            >
              <div className="flex items-center gap-2 sm:gap-4 order-1">
                <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 sm:p-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl transition-all shadow-sm border border-gray-200 ml-1 sm:ml-2">
                  <Menu size={24} className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
                  <img src="/logo.jpg" alt="Logo" className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl object-contain shadow-sm border border-gray-100 bg-white" />
                <div>
                  <h1 className="text-sm sm:text-xl font-bold text-gray-900 leading-tight">مدارس الأوس الأهلية</h1>
                  <p className="text-[8px] sm:text-[10px] font-bold text-primary uppercase tracking-widest mt-0.5">لوحة المسؤول الشاملة</p>
                </div>
              </div>
              <div className="flex items-center gap-3 sm:gap-4 order-2">
                <div className="hidden md:flex flex-col items-end text-sm font-bold text-gray-700">
                  <div className="flex items-center gap-2">
                    <span className="text-primary">{currentDateTime.toLocaleDateString('ar-SA-u-ca-islamic', { year: 'numeric', month: 'long', day: 'numeric' }).replace('هـ', '').trim()} هـ</span>
                    <span className="text-gray-300">|</span>
                    <span>{currentDateTime.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-gray-500">
                    <Clock size={14} />
                    <span>{currentDateTime.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                    <span className="bg-gray-100 px-2 rounded-md">{currentDateTime.toLocaleDateString('ar-SA', { weekday: 'long' })}</span>
                  </div>
                </div>
                <button onClick={onLogout} className="btn-secondary flex items-center gap-1.5 sm:gap-2 px-3 py-2 sm:px-5 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm">
                  <span className="hidden sm:inline">خروج</span>
                  <LogOut size={16} className="sm:w-[18px] sm:h-[18px]" />
                </button>
              </div>
            </motion.header>

            <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-4 sm:p-8 flex relative">
              <AnimatePresence>
                {/* Mobile Fullscreen Menu */}
                {isMobile && isSidebarOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white/95 backdrop-blur-xl p-6"
                  >
                    <button className="absolute top-6 right-6 p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors" onClick={() => setIsSidebarOpen(false)}>
                      <X size={32} />
                    </button>
                    <h2 className="text-2xl font-bold mb-8 text-gray-900">القائمة الرئيسية</h2>
                    <div className="flex flex-col gap-4 w-full max-w-sm overflow-y-auto pb-safe">
                      {[
                  { id: 'classes', label: 'إدارة الفصول' },
                  { id: 'smart_attendance', label: 'التحضير الذكي' },
                  { id: 'truancy_radar', label: 'رادار الغياب' },
                  { id: 'daily_scanner', label: 'الماسح اليومي (طلاب)' },
                  { id: 'id_generator', label: 'مُنشئ الهويات' },
                  { id: 'announcements', label: 'إدارة الإعلانات' },
                  { id: 'stats', label: 'إحصائيات متقدمة' },
                  { id: 'students', label: 'إدارة شؤون الطلاب' },
                  { id: 'staff', label: 'إدارة شؤون المعلمين' },
                  { id: 'employees', label: 'إدارة شؤون الموظفين' },
                  { id: 'wallets', label: 'إدارة المحافظ المالية' },
                  { id: 'complaints', label: 'إدارة الشكاوى' },
                  { id: 'notifications', label: 'إدارة الإشعارات' },
                  ...(!isDeputy ? [{ id: 'reset', label: 'تصفير النظام وبدء عام' }] : []),
                  ...(!isDeputy ? [{ id: 'graduates', label: 'أرشيف الخريجين' }] : []),
                  { id: 'settings', label: 'إعدادات المنظومة' },
                ].map((tab) => {
                        return (
                          <button
                            key={tab.id}
                            onClick={() => { setActiveTab(tab.id); setIsSidebarOpen(false); }}
                            className={`p-4 rounded-2xl font-bold text-lg text-center transition-all ${
                              activeTab === tab.id
                                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30'
                                : 'bg-gray-100/80 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            <div className="flex items-center justify-center gap-3">
                               <span className={`${activeTab === tab.id ? 'text-white' : 'text-primary'}`}>
                                 {tab.icon}
                               </span>
                               {tab.label}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}

                {/* Desktop Sidebar */}
                {!isMobile && isSidebarOpen && (
                <motion.div
                  initial={{ width: 0, opacity: 0, marginInlineEnd: 0 }}
                  animate={{ width: 256, opacity: 1, marginInlineEnd: 32 }}
                  exit={{ width: 0, opacity: 0, marginInlineEnd: 0 }}
                  transition={{ duration: 0.3 }}
                  className="shrink-0 overflow-hidden absolute z-40 md:relative bg-white/95 backdrop-blur-xl md:bg-transparent rounded-2xl md:rounded-none shadow-2xl md:shadow-none min-h-fit"
                >
                  <div className="sidebar-modern w-64 space-y-3 p-4 md:p-0">
                {[
                  { id: 'classes', label: '📚 إدارة الفصول' },
                  { id: 'smart_attendance', label: '📡 الرادار الذكي' },
                  { id: 'truancy_radar', label: '🚨 إشعارات التسلل' },
                  { id: 'daily_scanner', label: '📷 الماسح الصباحي (الطلاب)' },
                  { id: 'id_generator', label: '🖨️ طباعة البطاقات' },
                  { id: 'announcements', label: '📢 إدارة الإعلانات' },
                  { id: 'stats', label: '📈 إحصائيات النظام' },
                  { id: 'students', label: '👨‍🎓 إدارة الطلاب' },
                  { id: 'staff', label: '👨‍🏫 إدارة المعلمين' },
                  { id: 'employees', label: '👨‍💼 إدارة الموظفين' },
                  { id: 'wallets', label: '💰 إدارة المحافظ' },
                  { id: 'complaints', label: '📥 إدارة الشكاوى' },
                  { id: 'notifications', label: '🔔 إرسال إشعارات' },
                  ...(!isDeputy ? [{ id: 'reset', label: '⚙️ تهيئة النظام' }] : []),
                  ...(!isDeputy ? [{ id: 'graduates', label: '🎓 سجل الخريجين' }] : []),
                  { id: 'settings', label: '⚙️ الإعدادات' },
                ].map(tab => (
                  <button
                    key={tab?.id}
                    onClick={() => {
                      setActiveTab(tab?.id);
                      if (window.innerWidth < 768) setIsSidebarOpen(false);
                      // 🔥 ضبط الدور الافتراضي المناسب لكل تبويب
                      if (tab?.id === 'employees') setNewStaff(prev => ({ ...prev, role: 'deputy' }));
                      else if (tab?.id === 'staff') setNewStaff(prev => ({ ...prev, role: 'teacher' }));
                    }}
                    className={`sidebar-item w-full px-5 py-3.5 sm:py-4 rounded-2xl font-bold text-sm transition-all ${
                      activeTab === tab?.id
                        ? 'bg-gradient-to-l from-gray-900 to-gray-800 text-white shadow-xl shadow-gray-900/20 md:translate-x-[-4px]'
                        : 'bg-white/60 text-gray-700 hover:bg-white hover:shadow-md'
                    }`}
                  >
                    {tab?.label}
                  </button>
                ))}
                </div>
              </motion.div>
              )}
              </AnimatePresence>

              <div className="flex-1 min-w-0 space-y-8 w-full max-w-full">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                  >
                    {activeTab === 'id_generator' && <StudentIdGenerator />}
                    {activeTab === 'stats' && (
                      <div className="space-y-8 overflow-x-hidden w-full max-w-full">
                        <div className="border-b border-gray-200/50 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div>
                            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2"><BarChart2 className="text-emerald-500" /> إحصائيات النظام</h2>
                            <p className="text-xs sm:text-sm text-gray-400 mt-1">نظرة شاملة على بيانات المدرسة + النسخ الاحتياطي</p>
                          </div>
                          {/* 🔥 أزرار النسخ الاحتياطي وتصدير التقرير */}
                          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                            <button onClick={handleExportPDF} disabled={isExportingPDF} className={`flex-1 sm:flex-none justify-center flex items-center gap-2 ${isExportingPDF ? 'bg-emerald-400' : 'bg-emerald-600 hover:bg-emerald-700'} text-white px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-colors shadow-md`}>
                              {isExportingPDF ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Download size={16} />} 
                              {isExportingPDF ? 'جاري الاستخراج...' : 'تصدير التقرير PDF'}
                            </button>
                            <button onClick={handleExportBackup} className="flex-1 sm:flex-none justify-center flex items-center gap-2 bg-gray-900 text-white px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold hover:bg-gray-800 transition-colors shadow-md">
                              <Download size={16} /> تصدير نسخة
                            </button>
                            <label className="flex-1 sm:flex-none justify-center flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold hover:bg-gray-50 transition-colors shadow-sm cursor-pointer">
                              <Upload size={16} /> استيراد نسخة
                              <input type="file" accept="application/json,.json" onChange={handleImportBackup} className="hidden" />
                            </label>
                          </div>
                        </div>

                        {/* البطاقات الأساسية */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:p-6">
                          {stats.map((s, i) => (
                            <div key={i} className="glass-card bg-white/70 p-4 sm:p-6 rounded-3xl border border-white/50 shadow-sm flex items-center gap-4">
                              <div className={`p-4 rounded-2xl bg-white shadow-sm ${s.color}`}>
                                {s.icon}
                              </div>
                              <div>
                                <p className="text-sm font-bold text-gray-500">{s.label}</p>
                                <p className="text-2xl font-black text-gray-900">{s.value}</p>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* 🔥 تحليلات إضافية */}
                        {(() => {
                          const teachers = (staff || []).filter(s => s.role === 'teacher');
                          const exempted = (whitelist || []).filter(s => s.isExempted);
                          const totalBalance = Object.values(wallets || {}).reduce((a, b) => a + (Number(b) || 0), 0);
                          const avgAttendance = (whitelist || []).length
                            ? Math.round((whitelist.reduce((a, s) => a + (Number(s.attendancePercentage) || 0), 0) / whitelist.length))
                            : 0;
                          const openComplaints = (complaints || []).filter(c => !c.adminReply).length;

                          const analytics = [
                            { label: 'عدد المعلمين', value: teachers.length, icon: <BookOpen size={20} />, color: 'bg-blue-50 text-blue-600' },
                            { label: 'طلاب مستثنون', value: exempted.length, icon: <UserX size={20} />, color: 'bg-amber-50 text-amber-600' },
                            { label: 'إجمالي الأرصدة (ر.س)', value: totalBalance.toFixed(2), icon: <Wallet size={20} />, color: 'bg-emerald-50 text-emerald-600' },
                            { label: 'متوسط نسبة الحضور', value: `${avgAttendance}%`, icon: <UserCheck size={20} />, color: 'bg-purple-50 text-purple-600' },
                            { label: 'شكاوى بانتظار الرد', value: openComplaints, icon: <Mailbox size={20} />, color: 'bg-rose-50 text-rose-600' },
                            { label: 'عدد الإجازات', value: (holidays || []).length, icon: <TrendingUp size={20} />, color: 'bg-orange-50 text-orange-600' },
                          ];

                          return (
                            <>
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                                {analytics.map((a, i) => (
                                  <div key={i} className="glass-card bg-white/70 p-5 rounded-2xl border border-white/50 shadow-sm flex items-center gap-3">
                                    <div className={`p-3 rounded-xl ${a.color}`}>{a.icon}</div>
                                    <div>
                                      <p className="text-xs font-bold text-gray-500">{a.label}</p>
                                      <p className="text-xl font-black text-gray-900">{a.value}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>

                              {/* 🔥 الرسوم البيانية التفاعلية (Recharts) */}
                              {(() => {
                                const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6'];
                                
                                const phaseData = phases.map(phase => ({
                                  name: phase.label,
                                  value: (whitelist || []).filter(s => phase.classes.includes(s.className)).length
                                })).filter(p => p.value > 0);

                                const classStats = (globalMaster.classes || []).map(cls => {
                                  const classStudents = (whitelist || []).filter(s => s.className === cls);
                                  const avg = classStudents.length ? Math.round(classStudents.reduce((acc, s) => acc + (Number(s.attendancePercentage) || 0), 0) / classStudents.length) : 0;
                                  return { name: cls, avg, count: classStudents.length };
                                }).filter(c => c.count > 0).sort((a,b) => b.avg - a.avg);

                                const bestClass = classStats[0];
                                const worstClass = classStats.length > 1 ? classStats[classStats.length - 1] : null;

                                const topWallets = Object.entries(wallets || {})
                                  .map(([id, balance]) => {
                                    const student = (whitelist || []).find(s => s.id === id);
                                    return { id, name: student ? student.name : id, balance: Number(balance) || 0 };
                                  })
                                  .filter(w => w.balance > 0)
                                  .sort((a, b) => b.balance - a.balance)
                                  .slice(0, 5);

                                return (
                                  <div className="space-y-6">
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:p-6">
                                      {/* الرسم البياني الدائري */}
                                      <div className="glass-card bg-white/70 rounded-3xl p-4 sm:p-6 border border-white/50 shadow-xl flex flex-col items-center">
                                        <h3 className="text-lg font-bold text-gray-900 w-full mb-2 flex items-center gap-2"><PieChart size={20} className="text-emerald-500" /> توزيع الطلاب على المراحل</h3>
                                        {phaseData.length > 0 ? (
                                          <div className="w-full h-[300px]" dir="ltr">
                                            <ResponsiveContainer width="100%" height="100%">
                                              <PieChart>
                                                <Pie data={phaseData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                                                  {phaseData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                                </Pie>
                                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                                                <Legend verticalAlign="bottom" height={36} />
                                              </PieChart>
                                            </ResponsiveContainer>
                                          </div>
                                        ) : <div className="h-[300px] flex items-center justify-center text-gray-400 font-bold">لا يوجد طلاب مسجلين</div>}
                                      </div>

                                      {/* الرسم البياني الشريطي */}
                                      <div className="glass-card bg-white/70 rounded-3xl p-4 sm:p-6 border border-white/50 shadow-xl flex flex-col items-center">
                                        <h3 className="text-lg font-bold text-gray-900 w-full mb-2 flex items-center gap-2"><BarChart2 size={20} className="text-blue-500" /> متوسط الحضور حسب الفصل</h3>
                                        {classStats.length > 0 ? (
                                          <div className="w-full h-[300px]" dir="ltr">
                                            <ResponsiveContainer width="100%" height="100%">
                                              <BarChart data={classStats} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                                                <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} angle={-45} textAnchor="end" />
                                                <YAxis />
                                                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                                                <Bar dataKey="avg" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                                                  {classStats.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                                </Bar>
                                              </BarChart>
                                            </ResponsiveContainer>
                                          </div>
                                        ) : <div className="h-[300px] flex items-center justify-center text-gray-400 font-bold">لا يوجد بيانات كافية</div>}
                                      </div>
                                    </div>

                                    {/* 🏆 قوائم الأفضل والأسوأ */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:p-6">
                                      <div className="glass-card bg-emerald-50/50 rounded-3xl p-4 sm:p-6 border border-emerald-100 shadow-sm">
                                        <h4 className="text-emerald-800 font-bold flex items-center gap-2 mb-4"><CheckCircle2 size={18} /> الفصل الأفضل التزاماً</h4>
                                        {bestClass ? (
                                          <div>
                                            <p className="text-3xl font-black text-emerald-600 mb-1">{bestClass.name}</p>
                                            <p className="text-sm font-bold text-emerald-700/70">متوسط الحضور: {bestClass.avg}%</p>
                                          </div>
                                        ) : <p className="text-gray-400 text-sm">لا يوجد بيانات</p>}
                                      </div>

                                      <div className="glass-card bg-rose-50/50 rounded-3xl p-4 sm:p-6 border border-rose-100 shadow-sm">
                                        <h4 className="text-rose-800 font-bold flex items-center gap-2 mb-4"><AlertTriangle size={18} /> الفصل الأكثر غياباً</h4>
                                        {worstClass ? (
                                          <div>
                                            <p className="text-3xl font-black text-rose-600 mb-1">{worstClass.name}</p>
                                            <p className="text-sm font-bold text-rose-700/70">متوسط الحضور: {worstClass.avg}%</p>
                                          </div>
                                        ) : <p className="text-gray-400 text-sm">لا يوجد بيانات</p>}
                                      </div>

                                      <div className="glass-card bg-amber-50/50 rounded-3xl p-4 sm:p-6 border border-amber-100 shadow-sm">
                                        <h4 className="text-amber-800 font-bold flex items-center gap-2 mb-4"><Wallet size={18} /> نجوم المقصف (الأعلى رصيداً)</h4>
                                        <div className="space-y-3">
                                          {topWallets.length > 0 ? topWallets.map((w, i) => (
                                            <div key={i} className="flex items-center justify-between bg-white/60 p-2 px-3 rounded-xl">
                                              <span className="text-sm font-bold text-gray-700 truncate max-w-[120px]">{w.name}</span>
                                              <span className="text-xs font-black bg-amber-200 text-amber-800 px-2 py-1 rounded-md">{w.balance} ر.س</span>
                                            </div>
                                          )) : <p className="text-gray-400 text-sm">لا يوجد أرصدة مشحونة</p>}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })()}
                            </>
                          );
                        })()}
                      </div>
                    )}
                    
                    {activeTab === 'announcements' && (
                      <div className="space-y-6 overflow-x-hidden w-full max-w-full">
                        <div className="border-b border-gray-200/50 pb-6">
                          <h2 className="text-3xl font-bold text-gray-900 drop-shadow-sm flex items-center gap-3">
                            <Megaphone className="text-orange-500" />
                            إدارة الإعلانات
                          </h2>
                          <p className="text-sm text-gray-500 mt-2">قم بنشر وتعديل الإعلانات الهامة</p>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-4 sm:p-6">
                          <div className="lg:col-span-1 space-y-4">
                            <div className="glass-card bg-white/70 p-4 sm:p-6 rounded-3xl border border-white/50 shadow-xl">
                              <h3 className="font-bold text-gray-900 mb-4">{newAnnouncement.id ? 'تعديل إعلان' : 'إعلان جديد'}</h3>
                              <form onSubmit={handleSaveAnnouncement} className="space-y-4">
                                <div>
                                  <label className="text-xs text-gray-500 font-bold mb-1 block">نص الإعلان</label>
                                  <textarea required value={newAnnouncement.text} onChange={e => setNewAnnouncement({...newAnnouncement, text: e.target.value})} className="w-full border border-gray-200 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 min-h-[100px]"></textarea>
                                </div>
                                <div>
                                  <label className="text-xs text-gray-500 font-bold mb-1 block">الأهمية</label>
                                  <select value={newAnnouncement.priority} onChange={e => setNewAnnouncement({...newAnnouncement, priority: e.target.value})} className="w-full border border-gray-200 rounded-xl p-3 text-sm outline-none">
                                    <option value="normal">عادي</option>
                                    <option value="high">هام جداً</option>
                                  </select>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-2">
                                  <div>
                                    <label className="text-xs text-gray-500 font-bold mb-1 block">تاريخ البدء (اختياري)</label>
                                    <input type="datetime-local" value={newAnnouncement.startDate} onChange={e => setNewAnnouncement({...newAnnouncement, startDate: e.target.value})} className="w-full border border-gray-200 rounded-xl p-2.5 sm:p-2 text-xs outline-none" />
                                  </div>
                                  <div>
                                    <label className="text-xs text-gray-500 font-bold mb-1 block">تاريخ الانتهاء (اختياري)</label>
                                    <input type="datetime-local" value={newAnnouncement.endDate} onChange={e => setNewAnnouncement({...newAnnouncement, endDate: e.target.value})} className="w-full border border-gray-200 rounded-xl p-2.5 sm:p-2 text-xs outline-none" />
                                  </div>
                                </div>
                                <button type="submit" className="w-full bg-emerald-500 text-white py-3 rounded-xl font-bold shadow-md hover:shadow-lg transition-all">{newAnnouncement.id ? 'حفظ التعديلات' : 'نشر الإعلان'}</button>
                                {newAnnouncement.id && <button type="button" onClick={() => setNewAnnouncement({ id: '', text: '', target: 'all', priority: 'normal', startDate: '', endDate: '' })} className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-bold mt-2">إلغاء التعديل</button>}
                              </form>
                            </div>
                          </div>
                          <div className="lg:col-span-2 space-y-4">
                            <div className="space-y-3">
                              {announcements.length === 0 ? (
                                <div className="text-center py-12 bg-white/50 rounded-3xl border border-dashed border-gray-300">
                                  <p className="text-gray-500 font-bold">لا توجد إعلانات حالية</p>
                                </div>
                              ) : (
                                announcements.map(ann => (
                                  <motion.div key={ann.id} initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 relative">
                                    <div className="flex justify-between items-start mb-2">
                                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${ann.priority === 'high' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                                        {ann.priority === 'high' ? 'هام جداً' : 'عادي'}
                                      </span>
                                      <div className="flex gap-2">
                                        <button onClick={() => setNewAnnouncement(ann)} className="text-emerald-600 hover:bg-emerald-100 p-1.5 rounded-lg transition-colors"><Edit2 size={14} /></button>
                                        <button onClick={() => handleDeleteAnnouncement(ann.id)} className="text-red-500 hover:bg-red-100 p-1.5 rounded-lg transition-colors"><Trash2 size={14} /></button>
                                      </div>
                                    </div>
                                    <p className={`font-bold text-sm ${ann.priority === 'high' ? 'text-red-900' : 'text-blue-900'} leading-relaxed`}>{ann.text}</p>
                                    {(ann.startDate || ann.endDate) && (
                                      <div className="mt-3 text-[10px] text-gray-500 font-mono bg-white/50 p-2 rounded-lg">
                                        {ann.startDate && <span>من: {new Date(ann.startDate).toLocaleString('ar-SA')} </span>}
                                        {ann.endDate && <span>| إلى: {new Date(ann.endDate).toLocaleString('ar-SA')}</span>}
                                      </div>
                                    )}
                                  </motion.div>
                                ))
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    {/* Classes Tab */}
                    {activeTab === 'smart_attendance' && <AdminSmartAttendance />}
                    {activeTab === 'truancy_radar' && <AdminTruancyRadar />}
                    {activeTab === 'daily_scanner' && <AdminDailyScanner />}
                  {activeTab === 'classes' && (
                      <div className="space-y-6 overflow-x-hidden w-full max-w-full">
                        <div>
                          <h2 className="text-3xl font-bold text-gray-900 mb-2 drop-shadow-sm">📚 إدارة الجداول والوقت</h2>
                          <p className="text-sm text-gray-500">تحكم في الهيكل الزمني للمدرسة بالكامل، والفسحة، وجداول الفصول.</p>
                        </div>
                        <div className="glass-card bg-white/70 rounded-3xl p-4 sm:p-8 border border-white/50 space-y-6 shadow-xl">

                          <div>
                            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                              <Clock className="text-primary" size={20} />
                              الهيكلة الزمنية المركزية (تُطبق على الجميع)
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                              <div>
                                <label className="text-xs text-gray-500 mb-1 block font-bold">بداية اليوم</label>
                                <input type="time" value={settings.firstLessonStart} onChange={(e) => setSettings({ ...settings, firstLessonStart: e.target.value })} className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all shadow-sm text-center" />
                              </div>
                              <div>
                                <label className="text-xs text-gray-500 mb-1 block font-bold">مدة الحصة (د)</label>
                                <input type="number" min="20" value={settings.lessonDuration} onChange={(e) => setSettings({ ...settings, lessonDuration: Number(e.target.value) })} className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all shadow-sm text-center" />
                              </div>
                              <div>
                                <label className="text-xs text-gray-500 mb-1 block font-bold">عدد الحصص</label>
                                <input type="number" min="3" value={settings.lessonsPerDay} onChange={(e) => setSettings({ ...settings, lessonsPerDay: Number(e.target.value) })} className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all shadow-sm text-center" />
                              </div>
                              <div className="bg-orange-50/80 p-2.5 rounded-xl border border-orange-100 shadow-sm sm:col-span-2 md:col-span-1">
                                <label className="text-xs text-orange-700 mb-1 block font-bold">الفسحة بعد الحصة</label>
                                <select value={settings.breakAfterPeriod || 4} onChange={(e) => setSettings({ ...settings, breakAfterPeriod: Number(e.target.value) })} className="w-full bg-white border border-orange-200 rounded-lg px-2 py-1.5 text-sm text-orange-900 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all cursor-pointer">
                                  {Array.from({ length: settings.lessonsPerDay - 1 }, (_, i) => (
                                    <option key={i + 1} value={i + 1}>الحصة {i + 1}</option>
                                  ))}
                                </select>
                              </div>
                              <div className="bg-orange-50/80 p-2.5 rounded-xl border border-orange-100 shadow-sm sm:col-span-2 md:col-span-1">
                                <label className="text-xs text-orange-700 mb-1 block font-bold">مدة الفسحة (د)</label>
                                <input type="number" min="5" value={settings.breakDuration || 30} onChange={(e) => setSettings({ ...settings, breakDuration: Number(e.target.value) })} className="w-full bg-white border border-orange-200 rounded-lg px-2 py-1.5 text-sm text-orange-900 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all text-center" />
                              </div>
                            </div>
                            <button onClick={() => {
                              setPasswordModalConfig({
                                isOpen: true,
                                title: 'تطبيق الهيكلة الزمنية والفسحة',
                                desc: 'تنبيه: سيتم إعادة ترتيب مواعيد كافة الحصص المحجوزة مسبقاً تلقائياً في جميع الجداول.\nهل أنت متأكد من تنفيذ هذا الإجراء؟',
                                isDanger: true,
                                action: applyGlobalTimeSettings
                              });
                            }} className="mt-4 w-full bg-gradient-to-l from-emerald-600 to-emerald-500 text-white py-3 rounded-xl font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 btn-oversized">
                              🔄 تطبيق الهيكلة الزمنية والفسحة على جميع الجداول
                            </button>
                            <p className="text-[10px] text-gray-500 text-center mt-2">تنبيه: سيتم إعادة ترتيب مواعيد كافة الحصص المحجوزة مسبقاً تلقائياً.</p>
                          </div>

                          {/* === إدارة أيام العمل والإجازات === */}
                          <div className="border-t border-gray-200/50 pt-8 mt-8">
                            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                              <Calendar className="text-primary" size={20} />
                              إدارة أيام العمل والإجازات
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-4 sm:p-6">
                              {/* السبت Toggle */}
                              <div className="bg-gray-50/50 p-5 rounded-2xl border border-gray-100">
                                <div className="flex items-center gap-3 mb-3">
                                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                                    <Calendar size={20} className="text-blue-500" />
                                  </div>
                                  <div>
                                    <p className="text-sm font-black text-gray-800">يوم السبت</p>
                                    <p className="text-xs text-gray-500">يوم الجمعة إجازة دائمة تلقائياً</p>
                                  </div>
                                </div>
                                <ToggleSwitch
                                  checked={saturdayEnabled}
                                  onChange={(val) => {
                                    setSaturdayEnabled(val);
                                    localStorage.setItem('moo_saturday_enabled', JSON.stringify(val));
                                    window.dispatchEvent(new CustomEvent('moo-sync'));
                                    showToast(val ? '✅ تم تفعيل يوم السبت' : '❌ تم إيقاف يوم السبت (سيعامل كإجازة)');
                                  }}
                                  label={saturdayEnabled ? 'مفعّل (يوم عمل)' : 'مُعطَّل (إجازة)'}
                                />
                                <p className="text-[10px] text-gray-400 mt-3">عند الإيقاف: سيختفي السبت من الجداول ولن يُحسب فيه غياب.</p>
                              </div>

                              {/* تقويم الإجازات */}
                              <div className="bg-orange-50/50 p-5 rounded-2xl border border-orange-100">
                                <div className="flex items-center gap-3 mb-3">
                                  <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                                    <AlertTriangle size={20} className="text-orange-500" />
                                  </div>
                                  <div>
                                    <p className="text-sm font-black text-gray-800">تقويم الإجازات الرسمية</p>
                                    <p className="text-xs text-gray-500">إجازة نصف السنة، نهاية العام، الأعياد...</p>
                                  </div>
                                </div>
                                <div className="space-y-2 mb-3 max-h-32 overflow-y-auto">
                                  {holidays.length === 0 && <p className="text-xs text-gray-400">لا توجد إجازات مسجلة</p>}
                                  {holidays.map((h, i) => (
                                    <div key={i} className="flex items-center justify-between bg-white rounded-xl px-3 py-2 border border-orange-100">
                                      <div>
                                        <p className="text-xs font-bold text-gray-700">{h.name}</p>
                                        <p className="text-[10px] text-gray-400">{h.startDate} → {h.endDate}</p>
                                      </div>
                                      <button onClick={() => {
                                        const updated = holidays.filter((_, idx) => idx !== i);
                                        setHolidays(updated);
                                        saveHolidays(updated);
                                        showToast('❌ تم حذف الإجازة');
                                      }} className="text-red-400 hover:text-red-600 p-1"><X size={14} /></button>
                                    </div>
                                  ))}
                                </div>
                                <div className="space-y-2">
                                  <input type="text" placeholder="اسم الإجازة (مثلاً: إجازة نصف السنة)" value={newHoliday.name} onChange={e => setNewHoliday({...newHoliday, name: e.target.value})} className="w-full bg-white border border-orange-200 rounded-xl px-3 py-2 text-sm outline-none" />
                                  <div className="flex gap-2">
                                    <input type="date" value={newHoliday.startDate} onChange={e => setNewHoliday({...newHoliday, startDate: e.target.value})} className="flex-1 bg-white border border-orange-200 rounded-xl px-3 py-2 text-sm outline-none" />
                                    <input type="date" value={newHoliday.endDate} onChange={e => setNewHoliday({...newHoliday, endDate: e.target.value})} className="flex-1 bg-white border border-orange-200 rounded-xl px-3 py-2 text-sm outline-none" />
                                  </div>
                                  <button onClick={() => {
                                    if (!newHoliday.name || !newHoliday.startDate || !newHoliday.endDate) return;
                                    const updated = [...holidays, {...newHoliday}];
                                    setHolidays(updated);
                                    saveHolidays(updated);
                                    setNewHoliday({ name: '', startDate: '', endDate: '' });
                                    showToast('✅ تم إضافة الإجازة');
                                  }} className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-xl text-sm font-bold transition-colors">
                                    + إضافة إجازة
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="border-t border-gray-200/50 pt-8 mt-8">
                            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                              <Settings2 className="text-primary" size={24} />
                              إدارة الهيكل الدراسي للفصول (ديناميكي)
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:p-6">
                              {phases.map(phase => (
                                <div key={phase.id} className="bg-white/60 p-4 sm:p-6 rounded-3xl border border-white/50 shadow-sm hover:shadow-md transition-shadow">
                                  <h4 className="font-black text-gray-800 mb-4 text-lg border-b border-gray-100 pb-2">{phase.label}</h4>
                                   <div className="flex flex-wrap gap-2 mb-6 min-h-[60px] items-start">
                                     {phase.classes.length === 0 && <span className="text-xs text-gray-400">لا يوجد فصول...</span>}
                                     {phase.classes.map(cls => (
                                       <span key={cls} className="bg-white px-3 py-1.5 rounded-xl text-sm font-bold text-gray-700 shadow-sm border border-gray-100 flex items-center gap-2 group">
                                         {cls}
                                         <button onClick={() => handleDeleteClass(phase.id, cls)} className="text-gray-300 hover:text-red-500 transition-colors bg-gray-50 hover:bg-red-50 p-1 rounded-md opacity-0 group-hover:opacity-100">
                                           <X size={14} />
                                         </button>
                                       </span>
                                     ))}
                                   </div>
                                   <div className="flex gap-2">
                                     <input
                                       type="text"
                                       placeholder="اسم الفصل الجديد..."
                                       id={`new-class-${phase.id}`}
                                       onKeyDown={(e) => {
                                         if (e.key === 'Enter') {
                                           handleAddClass(phase.id, e.target.value);
                                           e.target.value = '';
                                         }
                                       }}
                                       className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary transition-colors"
                                     />
                                     <button
                                       onClick={() => {
                                         const input = document.getElementById(`new-class-${phase.id}`);
                                         if (input.value) {
                                           handleAddClass(phase.id, input.value);
                                           input.value = '';
                                         }
                                       }}
                                       className="bg-primary hover:bg-emerald-600 text-white p-2.5 rounded-xl shadow-sm transition-colors"
                                     >
                                       <Plus size={20} />
                                     </button>
                                   </div>
                                 </div>
                               ))}
                             </div>

                             {/* إعدادات فصول الطلاب الصغار */}
                             <div className="border-t border-gray-200/50 pt-8 mt-8">
                               <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                                 <ShieldAlert className="text-primary" size={24} />
                                 إعدادات فصول الطلاب الصغار
                                 <div className="group relative inline-block cursor-help ml-2">
                                   <div className="w-5 h-5 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-xs font-black">?</div>
                                   <div className="absolute top-full right-1/2 translate-x-1/2 mt-2 w-72 bg-gray-900 text-white text-xs p-3 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
                                     هذه الفصول معفاة تماماً من طابور الصباح والماسح الذكي، ولا تظهر في الإحصائيات الصباحية. بالإضافة إلى ذلك، يكفي لأي طالب في هذه الفصول حضور حصتين فقط ليتم احتساب يومه كحضور كامل بنسبة 100%.
                                   </div>
                                 </div>
                               </h3>
                               <p className="text-sm text-gray-500 mb-6 font-bold">حدد الفصول التي تنطبق عليها ميزة الاستثناء للصغار.</p>
                               
                               <div className="bg-white/60 p-4 sm:p-6 rounded-3xl border border-white/50 shadow-sm">
                                 <div className="flex flex-wrap gap-3">
                                   {(phases || []).flatMap(p => p.classes).length === 0 ? (
                                     <span className="text-xs text-gray-400">لا يوجد فصول في النظام. أضف فصولاً أولاً.</span>
                                   ) : (
                                     (phases || []).flatMap(p => p.classes).map(cls => {
                                       const isSelected = youngClasses.includes(cls);
                                       return (
                                         <button
                                           key={cls}
                                           onClick={() => toggleYoungClass(cls)}
                                           className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all ${
                                             isSelected
                                               ? 'bg-blue-100 text-blue-700 border-blue-200 shadow-sm'
                                               : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                                           }`}
                                         >
                                           {cls} {isSelected && '✓'}
                                         </button>
                                       );
                                     })
                                   )}
                                 </div>
                               </div>
                             </div>
                           </div>

                           <div className="border-t border-gray-200/50 pt-6 mt-6">
                             <h3 className="text-lg font-bold text-gray-900 mb-4">عرض وتعديل جداول الفصول</h3>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                               <div>
                                 <label className="text-xs font-bold text-gray-500 mb-2 block">المرحلة الدراسية</label>
                                 <div className="flex gap-2 flex-wrap">
                                   {phases.map(phase => (
                                     <button
                                       key={phase.id}
                                       onClick={() => { setSelectedPhase(phase.id); setSelectedClass(''); }}
                                       className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${selectedPhase === phase.id ? 'bg-gray-900 text-white shadow-md' : 'bg-white/80 text-gray-700 hover:bg-white border border-gray-200'}`}
                                     >
                                       {phase.label}
                                     </button>
                                   ))}
                                 </div>
                               </div>
                               <div>
                                 <label className="text-xs font-bold text-gray-500 mb-2 block">اختر الفصل</label>
                                 <select
                                   value={selectedClass}
                                   onChange={(e) => setSelectedClass(e.target.value)}
                                   className="w-full bg-white/80 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold focus:border-primary outline-none transition-all shadow-sm cursor-pointer"
                                 >
                                   <option value="">-- اضغط لاختيار الفصل --</option>
                                   {currentPhase.classes.map(cls => (
                                     <option key={cls} value={cls}>{cls}</option>
                                   ))}
                                 </select>
                               </div>
                             </div>
                           </div>

                           <div className="border-t border-gray-200/50 pt-6">
                             <button
                               onClick={() => setShowScheduleOverlay(!!selectedClass)}
                               disabled={!selectedClass}
                               className={`btn-oversized w-full px-4 sm:px-6 py-4 rounded-2xl font-bold text-lg transition-all ${selectedClass
                                 ? 'bg-gradient-to-l from-gray-900 to-gray-800 text-white shadow-xl shadow-gray-900/20'
                                 : 'bg-gray-200/50 text-gray-400 cursor-not-allowed'
                                 }`}
                             >
                               {selectedClass ? `📅 فتح جدول ${selectedClass}` : 'اختر فصلاً لفتح جدوله'}
                             </button>
                           </div>
                         </div>
                       </div>
                     )}


                    {/* Students Tab */}
                    {activeTab === 'students' && (
                      <div className="space-y-6 overflow-x-hidden w-full max-w-full">
                        <div className="border-b border-gray-200/50 pb-6">
                          <h2 className="text-2xl font-bold text-gray-900 drop-shadow-sm">👥 إدارة الطلاب</h2>
                        </div>
                        <div className="glass-card bg-white/70 rounded-3xl p-4 sm:p-8 border border-white/50 space-y-6 shadow-xl">
                          <div>
                            <h3 className="text-lg font-bold text-gray-900 mb-4">➕ إضافة طالب جديد</h3>
                            <form onSubmit={handleAddStudent} className="grid grid-cols-1 md:grid-cols-6 gap-4">
                              <div className="md:col-span-6 bg-emerald-50/50 p-4 rounded-xl border border-emerald-100/50">
                                <h4 className="text-sm font-bold text-emerald-800 mb-3 flex items-center gap-2"><UserPlus size={16}/> بيانات الطالب</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3 sm:gap-4">
                                  <input type="text" placeholder="الاسم الكامل" value={newStudent?.name || ''} onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })} className="sm:col-span-2 bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all" />
                                  <input type="text" placeholder="رقم الهوية" value={nextAwsId} readOnly className="bg-gray-100/50 cursor-not-allowed border border-white rounded-xl px-4 py-3 text-sm text-gray-500 font-mono outline-none transition-all" title="يتم توليد رقم الهوية تلقائياً" />
                                  <input type="password" placeholder="كلمة المرور" value={newStudent?.password || ''} onChange={(e) => setNewStudent({ ...newStudent, password: e.target.value })} className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all" />
                                  <select value={newStudent?.className || ''} onChange={(e) => setNewStudent({ ...newStudent, className: e.target.value })} className="sm:col-span-2 bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all">
                                    <option value="">اختر الفصل</option>
                                    {(globalMaster.classes || []).map((cls, i) => <option key={i} value={cls}>{cls}</option>)}
                                  </select>
                                </div>
                              </div>

                              <div className="md:col-span-6 bg-blue-50/50 p-4 rounded-xl border border-blue-100/50">
                                <h4 className="text-sm font-bold text-blue-800 mb-3 flex items-center gap-2"><Users size={16}/> بيانات ولي الأمر (للبوابة الخاصة بهم)</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3 sm:gap-4">
                                  <input type="text" placeholder="اسم ولي الأمر" value={newStudent?.parentName || ''} onChange={(e) => setNewStudent({ ...newStudent, parentName: e.target.value })} className="sm:col-span-2 bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all" />
                                  <input type="text" placeholder="رقم جوال ولي الأمر (اختياري)" value={newStudent?.parentPhone || ''} onChange={(e) => setNewStudent({ ...newStudent, parentPhone: e.target.value })} className="sm:col-span-2 bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 font-mono focus:ring-2 focus:ring-blue-500/20 outline-none transition-all" />
                                  <input type="password" placeholder="كلمة مرور البوابة" value={newStudent?.parentPassword || ''} onChange={(e) => setNewStudent({ ...newStudent, parentPassword: e.target.value })} className="sm:col-span-2 bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all" />
                                </div>
                              </div>
                              <div className="md:col-span-6 flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm">
                                <input type="checkbox" id="isExempted" checked={newStudent?.isExempted || false} onChange={(e) => setNewStudent({ ...newStudent, isExempted: e.target.checked })} className="w-5 h-5 accent-emerald-600 rounded cursor-pointer" />
                                <label htmlFor="isExempted" className="text-sm font-bold text-gray-900 cursor-pointer select-none">
                                  استثناء شامل (مستمع / معفى بالكامل)
                                </label>
                              </div>
                              <button type="submit" className="btn-oversized md:col-span-6 bg-gradient-to-l from-emerald-600 to-emerald-500 text-white py-3 rounded-xl font-bold shadow-lg shadow-emerald-500/30">
                                حفظ الطالب
                              </button>
                            </form>
                          </div>
                          <div className="border-t border-gray-200/50 pt-6">
                            <div className="flex flex-col gap-4 mb-6">
                              <div className="flex items-center justify-between flex-wrap gap-3">
                                <h3 className="text-lg font-bold text-gray-900">قائمة الطلاب ({whitelist?.length || 0})</h3>
                                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                                  <button type="button" onClick={handleExportStudents} className="flex-1 sm:flex-none justify-center btn-modern bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-100 px-4 py-2.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all">
                                    <Download size={16}/> تصدير
                                  </button>
                                  <label className="flex-1 sm:flex-none justify-center btn-modern bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-100 px-4 py-2.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer transition-all">
                                    <Upload size={16}/> استيراد
                                    <input type="file" accept=".xlsx, .xls" className="hidden" ref={fileInputRef} onChange={handleImportStudents} />
                                  </label>
                                </div>
                              </div>
                              
                              {/* 🔥 أدوات البحث والفلترة */}
                              <div className="flex flex-col md:flex-row items-center gap-3 bg-gray-50/50 p-3 rounded-2xl border border-gray-100">
                                <select value={classFilter} onChange={(e) => { setClassFilter(e.target.value); setStudentsPage(1); }} className="w-full md:w-1/3 bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 text-gray-700 font-bold">
                                  <option value="">جميع الفصول</option>
                                  {(globalMaster.classes || []).map((cls, i) => <option key={i} value={cls}>{cls}</option>)}
                                </select>
                                <div className="relative w-full md:w-2/3">
                                  <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                  <input
                                    type="text"
                                    placeholder="ابحث بالاسم / الهوية..."
                                    value={studentSearch}
                                    onChange={(e) => { setStudentSearch(e.target.value); setStudentsPage(1); }}
                                    className="w-full bg-white border border-gray-200 rounded-xl pr-9 pl-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                                  />
                                </div>
                              </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <AnimatePresence>
                                {(() => {
                                  const filtered = (whitelist || []).filter(student => {
                                    if (classFilter && student?.className !== classFilter) return false;
                                    const q = studentSearch.trim();
                                    if (!q) return true;
                                    return (
                                      (student?.name || '').includes(q) ||
                                      (student?.id || '').includes(q)
                                    );
                                  });
                                  const totalPages = Math.ceil(filtered.length / STUDENTS_PER_PAGE) || 1;
                                  const paginated = filtered.slice((studentsPage - 1) * STUDENTS_PER_PAGE, studentsPage * STUDENTS_PER_PAGE);

                                  return (
                                    <>
                                      <div className="col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {paginated.map((student, i) => (
                                          <motion.div
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            transition={{ delay: i * 0.02 }}
                                            key={student?.id || i}
                                            className={`flex items-center justify-between p-4 backdrop-blur-md border rounded-2xl group shadow-sm hover:shadow-md transition-shadow ${student?.isExempted ? 'bg-amber-50/60 border-amber-200' : 'bg-white/60 border-white'}`}
                                          >
                                            <div className="flex-1">
                                              <div className="flex items-center gap-2">
                                                <p className="font-bold text-gray-900 text-sm">{student?.name}</p>
                                                {student?.isExempted && <span className="bg-amber-100 text-amber-700 text-[10px] px-2 py-0.5 rounded-full font-black tracking-wide">مستثنى 🛡️</span>}
                                              </div>
                                              <p className="text-xs text-gray-500 font-mono mt-1 bg-white/50 inline-block px-2 py-0.5 rounded-md">{student?.id}</p>
                                              <p className="text-xs text-emerald-600 font-bold mt-1">{student?.className}</p>
                                            </div>
                                            <div className="flex gap-2">
                                              <button onClick={() => setEditingStudent({ ...student, _oldId: student?.id })} title="تعديل" className="text-gray-400 hover:text-emerald-600 bg-white shadow-sm hover:shadow p-2 rounded-xl opacity-0 group-hover:opacity-100 transition-all">
                                                <Edit2 size={18} />
                                              </button>
                                              <button onClick={() => handleToggleExemption(student?.id)} title="تبديل حالة الاستثناء" className={`p-2 rounded-xl transition-all ${student?.isExempted ? 'text-amber-600 bg-amber-100 hover:bg-amber-200' : 'text-gray-400 bg-white shadow-sm hover:bg-gray-100 opacity-0 group-hover:opacity-100'}`}>
                                                <ShieldAlert size={18} />
                                              </button>
                                              <button onClick={() => handleRemoveStudent(student?.id)} title="حذف" className="text-gray-400 hover:text-red-500 bg-white shadow-sm hover:shadow p-2 rounded-xl opacity-0 group-hover:opacity-100 transition-all">
                                                <Trash2 size={18} />
                                              </button>
                                            </div>
                                          </motion.div>
                                        ))}
                                      </div>
                                      
                                      {/* أزرار التصفح (Pagination) */}
                                      {totalPages > 1 && (
                                        <div className="col-span-2 flex items-center justify-center gap-3 mt-6">
                                          <button 
                                            disabled={studentsPage === 1} 
                                            onClick={() => setStudentsPage(p => p - 1)}
                                            className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-sm font-bold transition-all"
                                          >
                                            السابق
                                          </button>
                                          <span className="text-sm font-bold text-gray-600 bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-sm">
                                            صفحة {studentsPage} من {totalPages}
                                          </span>
                                          <button 
                                            disabled={studentsPage === totalPages} 
                                            onClick={() => setStudentsPage(p => p + 1)}
                                            className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-sm font-bold transition-all"
                                          >
                                            التالي
                                          </button>
                                        </div>
                                      )}
                                    </>
                                  );
                                })()}
                              </AnimatePresence>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}


                    {/* Employees Tab */}
                    {activeTab === 'employees' && (
                      <div className="space-y-6 overflow-x-hidden w-full max-w-full">
                        <div className="border-b border-gray-200/50 pb-6">
                          <h2 className="text-2xl font-bold text-gray-900 drop-shadow-sm">👥 إدارة الموظفين والإداريين</h2>
                        </div>
                        <div className="glass-card bg-white/70 rounded-3xl p-4 sm:p-8 border border-white/50 space-y-6 shadow-xl">
                          <div>
                            <h3 className="text-lg font-bold text-gray-900 mb-4">➕ إضافة موظف</h3>
                            <form onSubmit={handleAddStaff} className="space-y-4">
                              <div className="bg-gray-100 p-1.5 rounded-xl flex gap-1 mb-4">
                                {['deputy', 'cafeteria'].filter(role => !isDeputy || role !== 'deputy').map(role => (
                                  <button key={role} type="button" onClick={() => setNewStaff({ ...newStaff, role })} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${newStaff.role === role ? 'bg-emerald-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}>
                                    {role === 'deputy' ? 'وكيل' : 'مقصف'}
                                  </button>
                                ))}
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                <input type="text" placeholder="الاسم الكامل" value={newStaff.name} onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })} className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all" />
                                <input type="text" placeholder="اسم المستخدم" value={newStaff.username} onChange={(e) => setNewStaff({ ...newStaff, username: e.target.value })} className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all" />
                                <input type="password" placeholder="كلمة المرور" value={newStaff.password} onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })} className="sm:col-span-2 bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all" />
                              </div>
                              <button type="submit" className="btn-oversized w-full bg-gradient-to-l from-emerald-600 to-emerald-500 text-white py-3 rounded-xl font-bold shadow-lg shadow-emerald-500/30">
                                إضافة الموظف
                              </button>
                            </form>
                          </div>
                          <div className="border-t border-gray-200/50 pt-6">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                              <h3 className="text-lg font-bold text-gray-900">👥 قائمة الموظفين</h3>
                              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                <input type="text" placeholder="ابحث بالاسم أو الحساب..." value={staffSearch} onChange={(e) => setStaffSearch(e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl py-2.5 px-4 text-sm text-gray-900 focus:ring-2 focus:ring-emerald-500/20 outline-none sm:w-48 md:w-64" />
                                <select value={staffFilter} onChange={(e) => setStaffFilter(e.target.value)} className="w-full sm:w-auto bg-white border border-gray-200 rounded-xl py-2.5 px-4 text-sm text-gray-900 focus:ring-2 focus:ring-emerald-500/20 outline-none">
                                  <option value="all">الكل</option>
                                  {!isDeputy && <option value="deputy">الوكلاء</option>}
                                  <option value="cafeteria">المقصف</option>
                                </select>
                              </div>
                            </div>
                            <div className="space-y-3">
                              {(() => {
                                const filteredStaff = (staff || []).filter(s => {
                                  if (s.role === 'teacher') return false; // Not teacher!
                                  if (staffFilter !== 'all' && s.role !== staffFilter) return false;
                                  if (staffSearch && !s.name?.includes(staffSearch) && !s.username?.includes(staffSearch)) return false;
                                  return true;
                                });

                                if (filteredStaff.length === 0) {
                                  return <p className="text-sm text-gray-400">لا يوجد موظفون مطابقون للبحث.</p>;
                                }

                                return (
                                  <AnimatePresence>
                                    {filteredStaff.map((s, i) => (
                                      <motion.div
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        transition={{ delay: i * 0.05 }}
                                        key={s?.id || i}
                                        className="flex items-center justify-between p-4 bg-white/60 backdrop-blur-md border border-white rounded-2xl group shadow-sm hover:shadow-md transition-all"
                                      >
                                        <div className="flex items-center gap-4 flex-1">
                                          <span className={`px-4 py-1.5 border text-xs font-bold rounded-xl ${s?.role === 'deputy' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-orange-50 text-orange-700 border-orange-200'}`}>
                                            {s?.role === 'deputy' ? 'وكيل' : 'مقصف'}
                                          </span>
                                          <div>
                                            <p className="font-bold text-gray-900 text-sm">{s?.name}</p>
                                            <p className="text-xs text-gray-500 mt-1">{s?.username}</p>
                                          </div>
                                        </div>
                                        <div className="flex gap-2">
                                          {(!isDeputy || s.role !== 'deputy') && (
                                            <>
                                              <button onClick={() => setEditingStaff({ ...s })} title="تعديل" className="text-gray-400 hover:text-emerald-600 bg-white shadow-sm hover:shadow p-2 rounded-xl opacity-0 group-hover:opacity-100 transition-all">
                                                <Edit2 size={18} />
                                              </button>
                                              <button onClick={() => handleRemoveStaff(s?.id)} className="text-gray-400 hover:text-red-500 bg-white shadow-sm hover:shadow p-2 rounded-xl opacity-0 group-hover:opacity-100 transition-all">
                                                <Trash2 size={18} />
                                              </button>
                                            </>
                                          )}
                                        </div>
                                      </motion.div>
                                    ))}
                                  </AnimatePresence>
                                );
                              })()}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Staff Tab */}
                    {activeTab === 'staff' && (
                      <div className="space-y-6 overflow-x-hidden w-full max-w-full">
                        <div className="border-b border-gray-200/50 pb-6">
                          <h2 className="text-2xl font-bold text-gray-900 drop-shadow-sm">🧑‍🏫 إدارة المعلمين</h2>
                        </div>
                        <div className="glass-card bg-white/70 rounded-3xl p-4 sm:p-8 border border-white/50 space-y-6 shadow-xl">
                          <div>
                            <h3 className="text-lg font-bold text-gray-900 mb-4">➕ إضافة معلم</h3>
                            <form onSubmit={(e) => { setNewStaff(prev => ({...prev, role: 'teacher'})); handleAddStaff(e); }} className="space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                                <input type="text" placeholder="الاسم الكامل" value={newStaff?.name || ''} onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })} className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:ring-2 focus:ring-emerald-500/20 outline-none" />
                                <input type="text" placeholder="اسم المستخدم" value={newStaff?.username || ''} onChange={(e) => setNewStaff({ ...newStaff, username: e.target.value })} className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:ring-2 focus:ring-emerald-500/20 outline-none" />
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                                <input type="password" placeholder="كلمة المرور" value={newStaff?.password || ''} onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })} className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:ring-2 focus:ring-emerald-500/20 outline-none" />

                                <select value={newStaff?.specialization || 'الرياضيات'} onChange={(e) => setNewStaff({ ...newStaff, specialization: e.target.value })} className="sm:col-span-2 bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:ring-2 focus:ring-emerald-500/20 outline-none">
                                  {SUBJECTS.map((sub, i) => <option key={i} value={sub}>{sub}</option>)}
                                </select>
                              </div>

                              {newStaff?.specialization === 'مادة أخرى' && (
                                <motion.input initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} type="text" placeholder="اسم المادة" value={customSubject || ''} onChange={(e) => setCustomSubject(e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:ring-2 focus:ring-emerald-500/20 outline-none" />
                              )}
                              <button type="submit" className="btn-oversized w-full bg-gradient-to-l from-emerald-600 to-emerald-500 text-white py-3 rounded-xl font-bold shadow-lg shadow-emerald-500/30">
                                إضافة معلم
                              </button>
                            </form>
                          </div>
                          <div className="border-t border-gray-200/50 pt-6">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                              <h3 className="text-lg font-bold text-gray-900">👥 قائمة المعلمين</h3>
                              <div className="flex items-center gap-2 w-full sm:w-auto">
                                <input type="text" placeholder="ابحث بالاسم أو الحساب..." value={staffSearch} onChange={(e) => setStaffSearch(e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl py-2 px-4 text-sm text-gray-900 focus:ring-2 focus:ring-emerald-500/20 outline-none sm:w-48 md:w-64" />
                              </div>
                            </div>
                            <div className="space-y-3">
                              {(() => {
                                const filteredStaff = (staff || []).filter(s => {
                                  if (s.role !== 'teacher') return false;
                                  if (staffSearch && !s.name?.includes(staffSearch) && !s.username?.includes(staffSearch)) return false;
                                  return true;
                                });

                                if (filteredStaff.length === 0) {
                                  return <p className="text-sm text-gray-400">لا يوجد معلمون مطابقون للبحث.</p>;
                                }

                                return (
                                  <AnimatePresence>
                                    {filteredStaff.map((s, i) => (
                                      <motion.div
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        transition={{ delay: i * 0.05 }}
                                        key={s?.id || i}
                                        className="flex items-center justify-between p-4 bg-white/60 backdrop-blur-md border border-white rounded-2xl group shadow-sm hover:shadow-md transition-all"
                                      >
                                        <div className="flex items-center gap-4 flex-1">
                                          <span className={`px-4 py-1.5 border text-xs font-bold rounded-xl ${s?.role === 'teacher' ? 'bg-blue-50 text-blue-700 border-blue-200' : s?.role === 'deputy' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-orange-50 text-orange-700 border-orange-200'}`}>
                                            {s?.role === 'teacher' ? 'معلم' : s?.role === 'deputy' ? 'وكيل' : 'مقصف'}
                                          </span>
                                          <div>
                                            <p className="font-bold text-gray-900 text-sm">{s?.name}</p>
                                            <p className="text-xs text-gray-500 mt-1">{s?.username} {s?.role === 'teacher' && s?.specialization && <span>• <span className="text-emerald-600 font-bold">{s?.specialization}</span></span>}</p>
                                          </div>
                                        </div>
                                        <div className="flex gap-2">
                                          <button onClick={() => setEditingStaff({ ...s, _customSubject: SUBJECTS.includes(s.specialization) ? '' : s.specialization, specialization: SUBJECTS.includes(s.specialization) ? s.specialization : 'مادة أخرى' })} title="تعديل" className="text-gray-400 hover:text-emerald-600 bg-white shadow-sm hover:shadow p-2 rounded-xl opacity-0 group-hover:opacity-100 transition-all">
                                            <Edit2 size={18} />
                                          </button>
                                          <button onClick={() => handleRemoveStaff(s?.id)} className="text-gray-400 hover:text-red-500 bg-white shadow-sm hover:shadow p-2 rounded-xl opacity-0 group-hover:opacity-100 transition-all">
                                            <Trash2 size={18} />
                                          </button>
                                        </div>
                                      </motion.div>
                                    ))}
                                  </AnimatePresence>
                                );
                              })()}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Wallets Tab */}
                    {activeTab === 'wallets' && (
                      <div className="space-y-6 overflow-x-hidden w-full max-w-full">
                        <div className="border-b border-gray-200/50 pb-6 flex justify-between items-end">
                          <div>
                            <h2 className="text-2xl font-bold text-gray-900 drop-shadow-sm">💳 إدارة الأرصدة</h2>
                            <p className="text-sm text-gray-400 mt-1">شحن، سحب، واستعلام عن أرصدة الطلاب</p>
                          </div>
                          <div className="bg-white px-4 sm:px-4 sm:px-6 py-3 rounded-2xl shadow-sm border border-emerald-100 flex items-center gap-3 sm:gap-4 w-full sm:w-auto mt-4 md:mt-0">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                              <CreditCard size={18} className="sm:w-5 sm:h-5" />
                            </div>
                            <div>
                              <p className="text-[10px] sm:text-xs font-bold text-gray-500">إجمالي أرصدة الطلاب</p>
                              <p className="text-lg sm:text-xl font-black text-emerald-600 tabular-nums">
                                {Object.values(wallets).reduce((a, b) => a + b, 0).toFixed(2)} <span className="text-xs sm:text-sm">ر.س</span>
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:p-6 sm:gap-4 sm:p-8">
                          <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-3xl p-4 sm:p-6 sm:p-4 sm:p-8 shadow-xl shadow-emerald-900/20 text-white relative overflow-hidden flex flex-col">
                            <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                            <h3 className="text-lg font-bold mb-6 relative z-10 flex items-center gap-2"><CreditCard /> إدارة رصيد الطالب</h3>
                            
                            <form onSubmit={handleRecharge} className="space-y-4 relative z-10 flex-1 flex flex-col">
                              {/* نوع العملية */}
                              <div className="flex gap-2 bg-white/10 p-1.5 rounded-xl border border-white/20 backdrop-blur-sm">
                                <button type="button" onClick={() => setRechargeData({ ...rechargeData, type: 'add' })} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${rechargeData.type === 'add' ? 'bg-white text-emerald-700 shadow-md' : 'text-white/70 hover:text-white hover:bg-white/5'}`}>
                                  ➕ إيداع (شحن)
                                </button>
                                <button type="button" onClick={() => setRechargeData({ ...rechargeData, type: 'subtract' })} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${rechargeData.type === 'subtract' ? 'bg-white text-red-600 shadow-md' : 'text-white/70 hover:text-white hover:bg-white/5'}`}>
                                  ➖ سحب (خصم)
                                </button>
                              </div>

                              <div className="space-y-1 relative">
                                <input type="text" placeholder="رقم هوية الطالب أو الاسم..." value={rechargeData?.studentId || ''} onChange={(e) => setRechargeData({ ...rechargeData, studentId: e.target.value })} className="w-full bg-white/10 border border-white/20 rounded-xl py-3 px-4 text-white placeholder-white/50 focus:border-white outline-none backdrop-blur-sm transition-all" />
                              </div>
                              
                              <input type="number" placeholder="المبلغ (ريال سعودي)" min="1" value={rechargeData?.amount || ''} onChange={(e) => setRechargeData({ ...rechargeData, amount: e.target.value })} className="w-full bg-white/10 border border-white/20 rounded-xl py-3 px-4 text-white placeholder-white/50 focus:border-white outline-none backdrop-blur-sm transition-all" />
                              
                              <div className="mt-auto pt-4">
                                <button type="submit" className={`btn-oversized w-full py-3.5 rounded-xl font-black shadow-lg transition-all ${rechargeData.type === 'subtract' ? 'bg-red-50 text-red-600 hover:bg-white' : 'bg-white text-emerald-700 hover:bg-gray-50'}`}>
                                  {rechargeData.type === 'subtract' ? 'تأكيد السحب' : 'تأكيد الشحن'}
                                </button>
                              </div>
                            </form>
                          </div>
                          <div className="glass-card bg-white/70 rounded-3xl p-4 sm:p-6 sm:p-4 sm:p-8 border border-white/50 space-y-4 shadow-xl">
                            <h3 className="text-lg font-bold text-gray-900">🔍 استعلام الأرصدة</h3>
                            <input type="text" placeholder="ابحث عن طالب..." value={walletSearch || ''} onChange={(e) => setWalletSearch(e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl py-3 px-4 text-sm text-gray-900 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all" />
                            <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                              {(whitelist || [])
                                .filter(s => s?.name?.includes?.(walletSearch) || s?.id?.includes?.(walletSearch))
                                .map((student, i) => {
                                  const balance = (wallets || {})[student?.id] || 0;
                                  return (
                                    <motion.div
                                      initial={{ opacity: 0, scale: 0.95 }}
                                      animate={{ opacity: 1, scale: 1 }}
                                      key={i}
                                      onClick={() => setRechargeData({ ...rechargeData, studentId: student?.id })}
                                      className="flex justify-between items-center p-3 bg-white/60 rounded-xl border border-white hover:border-emerald-400 hover:shadow-md cursor-pointer transition-all group"
                                    >
                                      <div>
                                        <p className="font-bold text-gray-900 text-sm">{student?.name}</p>
                                        <p className="text-[10px] text-gray-500 font-mono mt-0.5">{student?.id}</p>
                                      </div>
                                      <p className="font-black text-emerald-600 text-lg tabular-nums group-hover:scale-110 transition-transform">{balance.toFixed(2)}</p>
                                    </motion.div>
                                  );
                                })}
                            </div>
                          </div>
                        </div>

                        {/* سجل العمليات المالية */}
                        <div className="glass-card bg-white/70 rounded-3xl p-4 sm:p-8 border border-white/50 shadow-xl mt-6">
                          <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-gray-900">📜 سجل العمليات المالية</h3>
                            {walletTransactions.length > 0 && (
                              <button type="button" onClick={() => setConfirmClearLog(true)} className="flex items-center gap-2 text-sm font-bold text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors">
                                <Trash2 size={16} /> مسح السجل
                              </button>
                            )}
                          </div>
                          {walletTransactions.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">لا توجد عمليات مالية مسجلة بعد</div>
                          ) : (
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm text-right">
                                <thead className="bg-gray-50 text-gray-600 font-bold border-b border-gray-200">
                                  <tr>
                                    <th className="px-4 py-3 rounded-tr-xl">اسم الطالب</th>
                                    <th className="px-4 py-3">رقم الهوية</th>
                                    <th className="px-4 py-3">العملية</th>
                                    <th className="px-4 py-3">المبلغ</th>
                                    <th className="px-4 py-3 rounded-tl-xl">التاريخ والوقت</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {walletTransactions.slice(0, 50).map((tx, idx) => (
                                    <tr key={idx} className="border-b border-gray-100 hover:bg-white/50 transition-colors">
                                      <td className="px-4 py-3 font-bold text-gray-900">{tx.studentName}</td>
                                      <td className="px-4 py-3 font-mono text-gray-500">{tx.studentId}</td>
                                      <td className="px-4 py-3">
                                        <span className={`px-2 py-1 rounded-md text-xs font-bold ${tx.type === 'add' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                          {tx.type === 'add' ? 'إيداع' : 'سحب'}
                                        </span>
                                      </td>
                                      <td className="px-4 py-3 font-black tabular-nums">{tx.amount.toFixed(2)} ر.س</td>
                                      <td className="px-4 py-3 text-gray-500 text-xs" dir="ltr">{new Date(tx.date).toLocaleString('ar-EG')}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Complaints Tab */}
                    {activeTab === 'complaints' && (
                      <div className="space-y-6 overflow-x-hidden w-full max-w-full">
                        <div className="border-b border-gray-200/50 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
                          <div>
                            <h2 className="text-2xl font-bold text-gray-900 drop-shadow-sm">📬 صندوق الشكاوى</h2>
                            <p className="text-sm text-gray-400 mt-1">تتبع شكاوى وملاحظات الطلاب وأولياء الأمور والرد عليها</p>
                          </div>
                          
                          <div className="flex flex-wrap bg-white rounded-xl p-1.5 shadow-sm border border-gray-100 w-full md:w-auto">
                            <button onClick={() => setComplaintFilter('all')} className={`flex-1 md:flex-none px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${complaintFilter === 'all' ? 'bg-primary text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>الكل</button>
                            <button onClick={() => setComplaintFilter('students')} className={`flex-1 md:flex-none px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${complaintFilter === 'students' ? 'bg-orange-500 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>الطلاب 🎓</button>
                            <button onClick={() => setComplaintFilter('parents')} className={`flex-1 md:flex-none px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${complaintFilter === 'parents' ? 'bg-indigo-500 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>أولياء الأمور 👨‍👩‍👦</button>
                          </div>
                        </div>

                        <div className="glass-card bg-white/70 rounded-3xl p-4 sm:p-8 border border-white/50 shadow-xl">
                          {(() => {
                            const filteredComplaints = (complaints || []).filter(c => {
                              if (complaintFilter === 'all') return true;
                              if (complaintFilter === 'students') return c.senderType !== 'parent';
                              if (complaintFilter === 'parents') return c.senderType === 'parent';
                              return true;
                            });

                            return filteredComplaints.length > 0 ? (
                              <div className="space-y-4">
                                <AnimatePresence>
                                  {filteredComplaints.slice().reverse().map((c, i) => {
                                    const isParent = c.senderType === 'parent';
                                    return (
                                      <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        key={c?.id || i}
                                        className={`p-4 sm:p-6 bg-white/60 backdrop-blur-md border-2 rounded-2xl relative hover:shadow-md transition-all group ${isParent ? 'border-indigo-100' : 'border-orange-100'}`}
                                      >
                                        <button onClick={() => handleDeleteComplaint(c?.id)} className="absolute top-4 sm:p-6 right-6 text-gray-400 hover:text-red-500 bg-white shadow-sm hover:shadow p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                                          <X size={16} />
                                        </button>
                                        
                                        <div className="flex items-center gap-2 mb-2">
                                          <div className={`px-2 py-1 rounded-md text-[10px] font-black tracking-wider ${isParent ? 'bg-indigo-100 text-indigo-700' : 'bg-orange-100 text-orange-700'}`}>
                                            {isParent ? 'ولي أمر' : 'طالب'}
                                          </div>
                                          <p className="font-bold text-gray-900 text-sm">{isParent ? c.parentName || 'ولي أمر' : c.studentName || 'طالب'}</p>
                                          {isParent && <p className="text-xs text-gray-500 font-bold bg-gray-100 px-2 py-0.5 rounded-md">طالب: {c.studentName}</p>}
                                        </div>

                                        {c?.subject && <p className="text-sm font-black text-gray-800 mb-2">{c.subject}</p>}
                                        <p className="text-sm text-gray-600 leading-relaxed bg-white/80 p-4 rounded-xl mb-3 shadow-inner border border-gray-50">{c?.text || c?.message || 'لا يوجد محتوى'}</p>
                                        <p className="text-[10px] text-gray-400 font-bold mb-4 flex items-center gap-1"><Clock size={12} /> {new Date(c?.date).toLocaleString('ar-SA')}</p>

                                        {/* رد المسئول */}
                                        {c?.adminReply ? (
                                          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                                            <p className="text-xs font-black text-emerald-700 mb-1 flex items-center gap-1"><CheckCircle2 size={14} /> ردك على الشكوى:</p>
                                            <p className="text-sm text-emerald-800 font-bold mt-2 bg-white/50 p-3 rounded-lg border border-emerald-100">{c.adminReply}</p>
                                            <button
                                              onClick={() => {
                                                const updated = complaints.map(x => x.id === c.id ? { ...x, adminReply: null } : x);
                                                setComplaints(updated);
                                              }}
                                              className="text-xs text-emerald-500 hover:text-red-500 mt-3 font-bold flex items-center gap-1"
                                            >حذف الرد وإعادة الفتح</button>
                                          </div>
                                        ) : (
                                          <ComplaintReplyBox complaint={c} onReply={(id, reply) => {
                                            const updated = complaints.map(x => x.id === id ? { ...x, adminReply: reply, adminReplyDate: new Date().toLocaleDateString('ar-SA') } : x);
                                            setComplaints(updated);
                                            
                                            // إرسال الإشعار للشخص الصحيح
                                            try {
                                              const notifKey = isParent ? 'moo_parent_notifications' : 'moo_student_notifications';
                                              const notifs = JSON.parse(localStorage.getItem(notifKey) || '{}');
                                              const studentId = c.studentId;
                                              if (studentId) {
                                                if (!notifs[studentId]) notifs[studentId] = [];
                                                notifs[studentId].unshift({
                                                  id: `reply_${id}_${Date.now()}`,
                                                  title: 'رد الإدارة على رسالتك',
                                                  message: `موضوع: ${c.subject || 'شكوى'} — ${reply}`,
                                                  date: new Date().toISOString(),
                                                  read: false,
                                                  type: 'admin_reply'
                                                });
                                                localStorage.setItem(notifKey, JSON.stringify(notifs));
                                                window.dispatchEvent(new CustomEvent('moo-sync'));
                                              }
                                            } catch { }
                                          }} />
                                        )}
                                      </motion.div>
                                    );
                                  })}
                                </AnimatePresence>
                              </div>
                            ) : (
                              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-20 text-center border-2 border-dashed border-gray-200 rounded-3xl bg-gray-50/50">
                                <Mailbox size={48} className="mx-auto text-gray-300 mb-4 drop-shadow-sm" />
                                <p className="text-gray-500 font-bold text-lg">الصندوق فارغ تماماً</p>
                                <p className="text-sm text-gray-400 mt-1">لا توجد شكاوى جديدة في هذا القسم حالياً.</p>
                              </motion.div>
                            );
                          })()}
                        </div>
                      </div>
                    )}

                    {/* 🔥 إضافة: تاب إشعارات الطلاب */}
                    {activeTab === 'notifications' && (
                      <div className="space-y-6 overflow-x-hidden w-full max-w-full">
                        <div className="border-b border-gray-200/50 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
                          <div>
                            <h2 className="text-2xl font-bold text-gray-900 drop-shadow-sm">🔔 إرسال الإشعارات</h2>
                            <p className="text-sm text-gray-400 mt-1">أرسل إشعاراً مخصصاً لجمهورك المستهدف (طلاب / أولياء أمور)</p>
                          </div>
                          
                          <div className="flex flex-wrap bg-white rounded-xl p-1.5 shadow-sm border border-gray-100">
                            <button onClick={() => { setNotifAudience('students'); setNotifTarget('all'); }} className={`flex-1 md:flex-none px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${notifAudience === 'students' ? 'bg-orange-500 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>للطلاب 🎓</button>
                            <button onClick={() => { setNotifAudience('parents'); setNotifTarget('all'); }} className={`flex-1 md:flex-none px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${notifAudience === 'parents' ? 'bg-indigo-500 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>لأولياء الأمور 👨‍👩‍👦</button>
                          </div>
                        </div>

                        <div className={`glass-card bg-white/70 rounded-3xl p-4 sm:p-8 border shadow-xl space-y-5 transition-colors ${notifAudience === 'parents' ? 'border-indigo-100' : 'border-orange-100'}`}>
                          <div>
                            <label className="text-xs font-black text-gray-500 mb-2 block">المستهدف ({notifAudience === 'parents' ? 'أولياء الأمور' : 'الطلاب'}):</label>
                            {/* فلتر الفصول والبحث والتحديد */}
                            <div className="relative">
                              <div className="flex flex-col sm:flex-row gap-2 mb-3">
                                <select 
                                  value={notifClassFilter} 
                                  onChange={e => { setNotifClassFilter(e.target.value); setNotifTarget('all'); }} 
                                  className="w-full sm:w-1/3 border border-gray-200 rounded-2xl px-4 py-2.5 font-bold text-sm outline-none focus:ring-2 focus:ring-primary/30 bg-gray-50"
                                >
                                  <option value="all">جميع الفصول</option>
                                  {[...new Set((whitelist || []).map(s => s.className))].map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                                
                                <input
                                  type="text"
                                  placeholder={`ابحث عن ${notifAudience === 'parents' ? 'ولي أمر / طالب' : 'طالب'}...`}
                                  value={notifSearch}
                                  onChange={(e) => { setNotifSearch(e.target.value); setIsNotifDropdownOpen(true); }}
                                  onClick={() => setIsNotifDropdownOpen(true)}
                                  className="w-full sm:flex-1 border border-gray-200 rounded-2xl px-4 py-2.5 font-bold text-sm outline-none focus:ring-2 focus:ring-primary/30 bg-gray-50"
                                />
                              </div>

                              {isNotifDropdownOpen && (
                                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-2xl shadow-2xl max-h-64 overflow-y-auto">
                                  {/* Close button for mobile / convenience */}
                                  <div className="sticky top-0 bg-gray-50 border-b border-gray-200 px-4 py-2 flex justify-between items-center">
                                    <span className="text-xs font-black text-gray-500">اختر المستهدف:</span>
                                    <button onClick={() => setIsNotifDropdownOpen(false)} className="text-xs font-bold text-red-500 hover:text-red-700 bg-red-50 px-2 py-1 rounded-md">إغلاق القائمة</button>
                                  </div>

                                  <button 
                                    className={`w-full text-right px-4 py-3 font-bold text-sm border-b border-gray-100 flex justify-between items-center ${notifTarget === 'all' ? 'bg-primary/10 text-primary' : 'hover:bg-gray-50'}`}
                                    onClick={() => { setNotifTarget('all'); setNotifSearch(''); setIsNotifDropdownOpen(false); }}
                                  >
                                    <span>📢 جميع {notifAudience === 'parents' ? 'أولياء الأمور' : 'الطلاب'} {notifClassFilter !== 'all' ? `(${notifClassFilter})` : ''}</span>
                                    {notifTarget === 'all' && <span>✅</span>}
                                  </button>
                                  
                                  {(whitelist || [])
                                    .filter(s => notifClassFilter === 'all' || s.className === notifClassFilter)
                                    .filter(s => {
                                      if (!notifSearch) return true;
                                      const searchLower = notifSearch.toLowerCase();
                                      const studentNameMatch = s.name?.toLowerCase().includes(searchLower);
                                      const parentNameMatch = s.parentName?.toLowerCase().includes(searchLower);
                                      return studentNameMatch || parentNameMatch;
                                    })
                                    .map(s => (
                                      <button 
                                        key={s.id}
                                        className={`w-full text-right px-4 py-3 font-bold text-sm border-b border-gray-100 flex justify-between items-center ${notifTarget === s.id ? 'bg-primary/10 text-primary' : 'hover:bg-gray-50'}`}
                                        onClick={() => { setNotifTarget(s.id); setNotifSearch(notifAudience === 'parents' ? `ولي أمر الطالب: ${s.name}` : s.name); setIsNotifDropdownOpen(false); }}
                                      >
                                        <div>
                                          <p>{notifAudience === 'parents' ? `ولي أمر الطالب: ${s.name}` : s.name}</p>
                                          <p className="text-xs text-gray-400 mt-0.5">{s.className}</p>
                                        </div>
                                        {notifTarget === s.id && <span>✅</span>}
                                      </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                          <div>
                            <label className="text-xs font-black text-gray-500 mb-2 block">عنوان الإشعار:</label>
                            <input type="text" placeholder="مثال: تذكير بموعد الاختبار / اجتماع مجلس الآباء" value={notifTitle} onChange={e => setNotifTitle(e.target.value)} className="w-full border border-gray-200 rounded-2xl px-4 py-3 font-bold text-sm outline-none focus:ring-2 focus:ring-primary/30" />
                          </div>
                          <div>
                            <label className="text-xs font-black text-gray-500 mb-2 block">نص الإشعار:</label>
                            <textarea rows={3} placeholder="اكتب نص الإشعار هنا..." value={notifMsg} onChange={e => setNotifMsg(e.target.value)} className="w-full border border-gray-200 rounded-2xl px-4 py-3 font-bold text-sm outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
                          </div>
                          <button onClick={handleSendNotif} disabled={!notifTitle.trim() || !notifMsg.trim()} className={`w-full flex items-center justify-center gap-2 text-white py-4 rounded-2xl font-black text-base disabled:opacity-40 transition-colors ${notifAudience === 'parents' ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-orange-500 hover:bg-orange-600'}`}>
                            <Bell size={20} /> إرسال الإشعار {notifAudience === 'parents' ? 'لولي الأمر' : 'للطالب'}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* 🔥 تاب تهيئة النظام */}
                    {activeTab === 'reset' && (
                      <div className="space-y-6 overflow-x-hidden w-full max-w-full">
                        <DataMigration />
                        <div className="border-b border-gray-200/50 pb-6">
                          <h2 className="text-2xl font-bold text-gray-900">🔄 تهيئة النظام — بداية سنة دراسية جديدة</h2>
                          <p className="text-sm text-red-500 font-bold mt-1">⚠️ تحذير: هذه العمليات لا يمكن التراجع عنها</p>
                        </div>

                        {/* أزرار المسح الفردية */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {[
                            { title: 'مسح سجلات الحضور', desc: 'يمسح كل سجلات حضور الطلاب ويعيد النسب لـ 0%', keys: ['moo_attendance', 'moo_daily_attendance_manual'], icon: '📋', color: 'amber', special: 'attendance' },
                            { title: 'مسح الدرجات', desc: 'يمسح كل الدرجات المدخلة + درجات الاختبارات الورقية وأرشيفها', keys: ['moo_grades', 'moo_paper_exam_grades', 'moo_paper_exam_archive'], icon: '📊', color: 'blue' },
                            { title: 'مسح الاختبارات', desc: 'يمسح كل الاختبارات ونتائجها وبنك الأسئلة', keys: ['exams', 'moo_tests', 'moo_exams_migrated', 'moo_question_bank', 'moo_paper_exam_grades', 'moo_paper_exam_archive'], icon: '📝', color: 'purple' },
                            { title: 'مسح الأوسمة', desc: 'يمسح كل أوسمة وإنجازات الطلاب', keys: ['moo_achievements', 'moo_pinned_badges'], icon: '🏅', color: 'emerald' },
                            { title: 'مسح الإشعارات', desc: 'يمسح كل الإشعارات والشكاوى', keys: ['moo_student_notifications', 'moo_notifications', 'moo_complaints'], icon: '🔔', color: 'rose' },
                            { title: 'تصفير الأرصدة', desc: 'يعيد أرصدة جميع الطلاب لـ 0 ريال', keys: [], icon: '💳', color: 'orange', special: 'wallets' },
                          ].map((item, i) => (
                            <div key={i} className="bg-white/70 rounded-3xl p-4 sm:p-6 border border-white/50 shadow-sm">
                              <div className="flex items-start gap-3 mb-4">
                                <span className="text-2xl">{item.icon}</span>
                                <div>
                                  <p className="font-black text-gray-800">{item.title}</p>
                                  <p className="text-xs text-gray-400 font-medium mt-0.5">{item.desc}</p>
                                </div>
                              </div>
                              <button
                                onClick={() => {
                                  setPasswordModalConfig({
                                    isOpen: true,
                                    title: `تأكيد: ${item.title}`,
                                    desc: 'هذه العملية حساسة ولا يمكن التراجع عنها. الرجاء إدخال كلمة مرور المدير للتأكيد.',
                                    isDanger: true,
                                    action: () => {
                                      if (item.special === 'wallets') {
                                        const wl = JSON.parse(localStorage.getItem('moo_whitelist') || '[]');
                                        const resetWallets = {};
                                        wl.forEach(s => { resetWallets[s.id] = 0; });
                                        localStorage.setItem('moo_wallets', JSON.stringify(resetWallets));
                                        setWallets(resetWallets);
                                      } else if (item.special === 'attendance') {
                                        item.keys.forEach(k => localStorage.removeItem(k));
                                        const wl = JSON.parse(localStorage.getItem('moo_whitelist') || '[]');
                                        localStorage.setItem('moo_whitelist', JSON.stringify(wl.map(s => ({ ...s, totalClasses: 0, attendedClasses: 0, attendancePercentage: 0 }))));
                                      } else {
                                        item.keys.forEach(k => localStorage.removeItem(k));
                                      }
                                      window.dispatchEvent(new Event('storage')); window.dispatchEvent(new CustomEvent('moo-sync'));
                                      showToast(`✅ تم ${item.title} بنجاح`);
                                    }
                                  });
                                }}
                                className="w-full py-2.5 bg-red-50 text-red-600 border border-red-200 rounded-2xl text-sm font-black hover:bg-red-100 transition-colors"
                              >
                                تنفيذ — {item.title}
                              </button>
                            </div>
                          ))}
                        </div>

                        {/* تهيئة نصف السنة */}
                        <div className="bg-blue-50 border border-blue-200 rounded-3xl p-4 sm:p-6">
                          <p className="font-black text-blue-700 text-lg mb-2">📘 تهيئة نصف السنة (الترم الأول)</p>
                          <p className="text-sm text-blue-400 font-medium mb-1">يمسح: الدرجات، الاختبارات، الإشعارات، الشكاوى</p>
                          <p className="text-sm text-emerald-500 font-bold mb-4">✅ يحافظ على: الحضور، الأرصدة، الأوسمة، بنك الأسئلة</p>
                          <button
                            onClick={() => {
                              setPasswordModalConfig({
                                isOpen: true,
                                title: 'تهيئة نصف السنة',
                                desc: 'سيتم مسح الدرجات والاختبارات والإشعارات فقط، مع الاحتفاظ بالحضور والأرصدة. أدخل كلمة مرور المدير للمتابعة.',
                                isDanger: false,
                                action: () => {
                                  ['moo_grades', 'moo_paper_exam_grades', 'moo_paper_exam_archive', 'exams', 'moo_tests', 'moo_exams_migrated', 'moo_student_notifications', 'moo_notifications', 'moo_complaints'].forEach(k => localStorage.removeItem(k));
                                  window.dispatchEvent(new Event('storage')); window.dispatchEvent(new CustomEvent('moo-sync'));
                                  showToast('✅ تمت تهيئة نصف السنة بنجاح — النظام جاهز للترم الثاني');
                                }
                              });
                            }}
                            className="w-full py-3 bg-blue-600 text-white rounded-2xl font-black hover:bg-blue-700 transition-colors"
                          >📘 تنفيذ تهيئة نصف السنة</button>
                        </div>

                        {/* تهيئة شاملة */}
                        <div className="bg-red-50 border border-red-200 rounded-3xl p-4 sm:p-6">
                          <p className="font-black text-red-700 text-lg mb-2">☢️ تهيئة شاملة — مسح كل البيانات</p>
                          <p className="text-sm text-red-400 font-medium mb-4">يمسح كل شيء: الحضور، الدرجات، الاختبارات، الأوسمة، الإشعارات، الأرصدة</p>
                          <button
                            onClick={() => {
                              setPasswordModalConfig({
                                isOpen: true,
                                title: '☢️ تهيئة شاملة',
                                desc: 'تحذير نهائي: سيتم مسح كل بيانات النظام بما فيها الحضور والدرجات والاختبارات والأوسمة والأرصدة!',
                                isDanger: true,
                                action: () => {
                                  ['moo_attendance', 'moo_daily_attendance_manual', 'moo_grades', 'moo_paper_exam_grades', 'moo_paper_exam_archive', 'exams', 'moo_tests', 'moo_exams_migrated', 'moo_question_bank', 'moo_achievements', 'moo_pinned_badges', 'moo_student_notifications', 'moo_notifications', 'moo_complaints'].forEach(k => localStorage.removeItem(k));
                                  const wl = JSON.parse(localStorage.getItem('moo_whitelist') || '[]');
                                  const resetWallets = {};
                                  wl.forEach(s => { resetWallets[s.id] = 0; });
                                  localStorage.setItem('moo_wallets', JSON.stringify(resetWallets));
                                  setWallets(resetWallets);
                                  localStorage.setItem('moo_whitelist', JSON.stringify(wl.map(s => ({ ...s, totalClasses: 0, attendedClasses: 0, attendancePercentage: 0 }))));
                                  window.dispatchEvent(new Event('storage')); window.dispatchEvent(new CustomEvent('moo-sync'));
                                  showToast('✅ تمت التهيئة الشاملة بنجاح — النظام جاهز لسنة دراسية جديدة');
                                }
                              });
                            }}
                            className="w-full py-3 bg-red-600 text-white rounded-2xl font-black hover:bg-red-700 transition-colors"
                          >☢️ تهيئة شاملة — مسح كل شيء</button>
                        </div>

                        {/* 🎓 نظام ترحيل الطلاب */}
                        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-3xl p-4 sm:p-6">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-3xl">🎓</span>
                            <div>
                              <p className="font-black text-emerald-800 text-xl">ترحيل الطلاب — نهاية السنة الدراسية</p>
                              <p className="text-sm text-emerald-500 font-medium">نقل الطلاب الناجحين للصف التالي + تخريج طلاب ثالث ثانوي</p>
                            </div>
                          </div>
                          <div className="bg-white/60 rounded-2xl p-4 mb-4 text-sm text-gray-600 font-medium space-y-1">
                            <p>• سادس ابتدائي ← أول متوسط</p>
                            <p>• ثالث متوسط ← أول ثانوي</p>
                            <p>• ثالث ثانوي ← 🎓 سجل الخريجين</p>
                            <p className="text-orange-600 font-bold mt-2">⚠️ الطلاب الراسبون اللي هتحددهم هيفضلوا في نفس فصلهم</p>
                          </div>
                          <button
                            onClick={() => {
                              setFailingStudents({});
                              setPromotionSelectedClass(null);
                              const gregorian = new Date().getFullYear();
                              const hijri = Math.round((gregorian - 622) * (33 / 32));
                              setGraduationYear(`${gregorian}-${hijri}`);
                              setShowPromotionModal(true);
                            }}
                            className="w-full py-3 bg-emerald-600 text-white rounded-2xl font-black hover:bg-emerald-700 transition-colors text-lg"
                          >🎓 بدء عملية الترحيل</button>
                        </div>

                        {/* مودال الترحيل */}
                        {showPromotionModal && (
                          <div className="fixed inset-0 z-[99999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) setShowPromotionModal(false); }}>
                            <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col" dir="rtl">
                              {/* Header */}
                              <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gradient-to-l from-emerald-50 to-white shrink-0">
                                <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">🎓 ترحيل الطلاب</h3>
                                <button onClick={() => setShowPromotionModal(false)} className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-500 transition-colors text-lg font-bold">✕</button>
                              </div>

                              <div className="overflow-y-auto flex-1 p-5 space-y-4">
                                {/* سنة التخرج */}
                                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                                  <label className="block text-sm font-black text-amber-700 mb-2">📅 أدخل السنة الدراسية (مثال: 1446-1447)</label>
                                  <input type="text" value={graduationYear} onChange={(e) => setGraduationYear(e.target.value)} placeholder="مثال: 1446-1447" className="w-full p-3 rounded-xl border-2 border-amber-200 outline-none focus:border-amber-400 text-center font-bold text-lg" />
                                </div>

                                {!promotionSelectedClass ? (
                                  <>
                                    <p className="text-sm font-bold text-gray-500">اختر فصل لتحديد الطلاب الراسبين (أو اتركهم كلهم ناجحين):</p>
                                    <div className="grid grid-cols-1 gap-3">
                                      {(() => {
                                        const allClasses = phases.reduce((acc, p) => [...acc, ...p.classes], []);
                                        return allClasses.map(cls => {
                                          const studentsInClass = (whitelist || []).filter(s => s.className === cls);
                                          const failCount = studentsInClass.filter(s => failingStudents[s.id]).length;
                                          const nextClass = PROMOTION_MAP[cls] || '—';
                                          return (
                                            <button key={cls} onClick={() => setPromotionSelectedClass(cls)}
                                              className="flex items-center justify-between p-4 rounded-2xl border-2 border-gray-100 hover:border-emerald-300 hover:bg-emerald-50/50 transition-all text-right">
                                              <div>
                                                <p className="font-black text-gray-800">{cls}</p>
                                                <p className="text-xs text-gray-400 font-medium">{studentsInClass.length} طالب → {nextClass === '__graduate__' ? '🎓 خريج' : nextClass}</p>
                                              </div>
                                              <div className="flex items-center gap-2">
                                                {failCount > 0 && <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-1 rounded-full">{failCount} راسب</span>}
                                                <span className="text-gray-300 text-lg">←</span>
                                              </div>
                                            </button>
                                          );
                                        });
                                      })()}
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    {(() => {
                                      const allClasses = phases.reduce((acc, p) => [...acc, ...p.classes], []);
                                      const currentIndex = allClasses.indexOf(promotionSelectedClass);
                                      const nextClass = allClasses[currentIndex + 1];
                                      const prevClass = allClasses[currentIndex - 1];

                                      return (
                                        <div className="flex justify-between items-center mb-2">
                                          <button onClick={() => setPromotionSelectedClass(prevClass || null)} className="flex items-center gap-2 text-sm font-bold text-emerald-600 hover:text-emerald-800 transition-colors px-4 py-2 bg-emerald-50 rounded-xl hover:bg-emerald-100 border border-emerald-200">
                                            → {prevClass ? `الفصل السابق` : 'قائمة الفصول'}
                                          </button>
                                          <button onClick={() => setPromotionSelectedClass(null)} className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-700 transition-colors px-4 py-2 bg-gray-50 rounded-xl hover:bg-gray-100 border border-gray-200">
                                            قائمة الفصول
                                          </button>
                                          <button onClick={() => setPromotionSelectedClass(nextClass || null)} className="flex items-center gap-2 text-sm font-bold text-emerald-600 hover:text-emerald-800 transition-colors px-4 py-2 bg-emerald-50 rounded-xl hover:bg-emerald-100 border border-emerald-200">
                                            {nextClass ? `الفصل التالي` : 'قائمة الفصول'} ←
                                          </button>
                                        </div>
                                      );
                                    })()}
                                    <div className="bg-gray-50 rounded-2xl p-4">
                                      <p className="font-black text-gray-800 mb-1">📚 {promotionSelectedClass}</p>
                                      <p className="text-xs text-gray-400 font-medium mb-3">حدد الطلاب الراسبين (اللي مش هيترحلوا):</p>
                                      <div className="space-y-2 max-h-[40vh] overflow-y-auto">
                                        {(whitelist || []).filter(s => s.className === promotionSelectedClass).map(student => (
                                          <label key={student.id} className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${failingStudents[student.id] ? 'bg-red-50 border-2 border-red-200' : 'bg-white border-2 border-gray-100 hover:border-gray-200'}`}>
                                            <input type="checkbox" checked={!!failingStudents[student.id]}
                                              onChange={() => setFailingStudents(prev => {
                                                const updated = { ...prev };
                                                if (updated[student.id]) delete updated[student.id];
                                                else updated[student.id] = true;
                                                return updated;
                                              })}
                                              className="w-5 h-5 rounded accent-red-500"
                                            />
                                            <div className="flex-1">
                                              <p className="font-bold text-gray-800">{student.name}</p>
                                              <p className="text-xs text-gray-400">كود: {student.id}</p>
                                            </div>
                                            {failingStudents[student.id] && <span className="text-xs font-bold text-red-500 bg-red-100 px-2 py-1 rounded-full">راسب</span>}
                                          </label>
                                        ))}
                                        {(whitelist || []).filter(s => s.className === promotionSelectedClass).length === 0 && (
                                          <p className="text-center text-gray-400 py-4 font-medium">لا يوجد طلاب في هذا الفصل</p>
                                        )}
                                      </div>
                                    </div>
                                  </>
                                )}
                              </div>

                              {/* Footer — زر الترحيل */}
                              <div className="p-5 border-t border-gray-100 bg-gray-50/50 shrink-0">
                                <button
                                  onClick={() => {
                                    if (!graduationYear.trim()) { showToast('❌ أدخل السنة الدراسية أولاً'); return; }
                                    const totalStudents = (whitelist || []).length;
                                    const failCount = Object.keys(failingStudents).length;
                                    setPasswordModalConfig({
                                      isOpen: true,
                                      title: '🎓 تأكيد عملية الترحيل',
                                      desc: `سيتم ترحيل ${totalStudents - failCount} طالب ناجح\nسيبقى ${failCount} طالب راسب في فصولهم.`,
                                      isDanger: true,
                                      action: () => {
                                        // تنفيذ الترحيل
                                        const newGraduates = [];
                                        const updatedWhitelist = (whitelist || []).filter(student => {
                                          if (failingStudents[student.id]) return true; // راسب — يبقى
                                          const nextClass = PROMOTION_MAP[student.className];
                                          if (nextClass === '__graduate__') {
                                            // خريج — نقله لسجل الخريجين
                                            newGraduates.push({
                                              ...student,
                                              graduationYear: graduationYear,
                                              graduatedAt: new Date().toISOString(),
                                              lastClass: student.className,
                                            });
                                            return false; // حذفه من الطلاب
                                          }
                                          if (nextClass) student.className = nextClass;
                                          return true;
                                        });

                                        // حفظ الخريجين
                                        const allGraduates = [...graduates, ...newGraduates];
                                        setGraduates(allGraduates);
                                        localStorage.setItem('moo_graduates', JSON.stringify(allGraduates));

                                        // حفظ الطلاب بعد الترحيل
                                        setWhitelist(updatedWhitelist);

                                        // مسح بيانات السنة القديمة
                                        ['moo_attendance', 'moo_daily_attendance_manual', 'moo_grades', 'moo_paper_exam_grades', 'moo_paper_exam_archive', 'exams', 'moo_tests', 'moo_exams_migrated', 'moo_achievements', 'moo_pinned_badges', 'moo_student_notifications', 'moo_notifications', 'moo_complaints'].forEach(k => localStorage.removeItem(k));

                                        window.dispatchEvent(new Event('storage')); window.dispatchEvent(new CustomEvent('moo-sync'));
                                        setShowPromotionModal(false);
                                        showToast(`✅ تم الترحيل بنجاح! ${updatedWhitelist.length} طالب تم ترحيلهم + ${newGraduates.length} خريج تم تسجيلهم`);
                                      }
                                    });
                                  }}
                                  className="w-full py-3.5 bg-emerald-600 text-white rounded-2xl font-black hover:bg-emerald-700 transition-colors text-lg"
                                >
                                  🎓 تنفيذ الترحيل ({(whitelist || []).length - Object.keys(failingStudents).length} ناجح / {Object.keys(failingStudents).length} راسب)
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* 🎓 تاب سجل الخريجين */}
                    {activeTab === 'settings' && <AdminSettingsView account={account} isDeputy={isDeputy} />}

                    {activeTab === 'graduates' && (
                      <div className="space-y-6 overflow-x-hidden w-full max-w-full">
                        <div className="border-b border-gray-200/50 pb-6">
                          <h2 className="text-2xl font-bold text-gray-900">🎓 سجل الخريجين</h2>
                          <p className="text-sm text-gray-500 font-medium mt-1">سجل دائم لجميع الطلاب المتخرجين من المدرسة</p>
                        </div>

                        {/* فلاتر */}
                        <div className="flex flex-wrap gap-3">
                          <div className="flex-1 min-w-[120px] sm:min-w-[200px] relative">
                            <Search size={16} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                            <input type="text" placeholder="ابحث بالاسم أو الكود..." value={graduatesSearch} onChange={(e) => setGraduatesSearch(e.target.value)}
                              className="w-full p-3 pr-10 rounded-xl border-2 border-gray-100 outline-none focus:border-emerald-300 text-sm font-bold" />
                          </div>
                          <select value={graduatesYearFilter} onChange={(e) => setGraduatesYearFilter(e.target.value)}
                            className="p-3 rounded-xl border-2 border-gray-100 outline-none text-sm font-bold bg-white min-w-[100px] sm:min-w-[160px]">
                            <option value="all">كل السنوات</option>
                            {[...new Set(graduates.map(g => g.graduationYear))].map(y => (
                              <option key={y} value={y}>{y}</option>
                            ))}
                          </select>
                        </div>

                        {/* إحصائيات */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          <div className="bg-emerald-50 rounded-2xl p-4 text-center border border-emerald-100">
                            <p className="text-3xl font-black text-emerald-600">{graduates.length}</p>
                            <p className="text-xs font-bold text-emerald-400 mt-1">إجمالي الخريجين</p>
                          </div>
                          <div className="bg-blue-50 rounded-2xl p-4 text-center border border-blue-100">
                            <p className="text-3xl font-black text-blue-600">{[...new Set(graduates.map(g => g.graduationYear))].length}</p>
                            <p className="text-xs font-bold text-blue-400 mt-1">عدد الدفعات</p>
                          </div>
                          <div className="bg-purple-50 rounded-2xl p-4 text-center border border-purple-100">
                            <p className="text-3xl font-black text-purple-600">
                              {graduatesYearFilter !== 'all' ? graduates.filter(g => g.graduationYear === graduatesYearFilter).length : graduates.length}
                            </p>
                            <p className="text-xs font-bold text-purple-400 mt-1">{graduatesYearFilter !== 'all' ? `دفعة ${graduatesYearFilter}` : 'المعروضين'}</p>
                          </div>
                        </div>

                        {/* جدول الخريجين */}
                        {(() => {
                          const filtered = graduates.filter(g => {
                            const matchSearch = !graduatesSearch || g.name?.includes(graduatesSearch) || g.id?.toString().includes(graduatesSearch);
                            const matchYear = graduatesYearFilter === 'all' || g.graduationYear === graduatesYearFilter;
                            return matchSearch && matchYear;
                          });

                          // تجميع حسب السنة
                          const grouped = {};
                          filtered.forEach(g => {
                            const yr = g.graduationYear || 'غير محدد';
                            if (!grouped[yr]) grouped[yr] = [];
                            grouped[yr].push(g);
                          });

                          const years = Object.keys(grouped).sort().reverse();

                          if (years.length === 0) {
                            return (
                              <div className="text-center py-16 bg-white/50 rounded-3xl border-2 border-dashed border-gray-200">
                                <span className="text-5xl mb-4 block">🎓</span>
                                <p className="font-bold text-gray-400 text-lg">لا يوجد خريجون بعد</p>
                                <p className="text-sm text-gray-300 mt-1">سيظهر الخريجون هنا بعد إجراء عملية ترحيل من صفحة تهيئة النظام</p>
                              </div>
                            );
                          }

                          return years.map(year => (
                            <div key={year} className="bg-white/70 rounded-3xl border border-white/50 shadow-sm overflow-hidden">
                              <div className="bg-gradient-to-l from-emerald-600 to-teal-700 text-white p-4 flex items-center justify-between">
                                <h3 className="font-black text-lg">🎓 دفعة {year}</h3>
                                <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-bold">{grouped[year].length} خريج</span>
                              </div>
                              <div className="divide-y divide-gray-50">
                                {grouped[year].map((grad, idx) => (
                                  <div key={grad.id || idx} className="flex items-center justify-between p-4 hover:bg-gray-50/50 transition-colors">
                                    <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-black text-sm">
                                        {idx + 1}
                                      </div>
                                      <div>
                                        <p className="font-bold text-gray-800">{grad.name}</p>
                                        <p className="text-xs text-gray-400">كود: {grad.id} | آخر فصل: {grad.lastClass || grad.className || '—'}</p>
                                      </div>
                                    </div>
                                    <div className="text-left">
                                      <p className="text-xs text-gray-400 font-medium">{grad.graduatedAt ? new Date(grad.graduatedAt).toLocaleDateString('ar-SA') : '—'}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>

                            {/* إعدادات فصول الطلاب الصغار */}
                            <div className="border-t border-gray-200/50 pt-8 mt-8">
                              <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                                <ShieldAlert className="text-primary" size={24} />
                                إعدادات فصول الطلاب الصغار
                                <div className="group relative inline-block cursor-help ml-2">
                                  <div className="w-5 h-5 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-xs font-black">?</div>
                                  <div className="absolute top-full right-1/2 translate-x-1/2 mt-2 w-72 bg-gray-900 text-white text-xs p-3 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
                                    هذه الفصول معفاة تماماً من طابور الصباح والماسح الذكي، ولا تظهر في الإحصائيات الصباحية. بالإضافة إلى ذلك، يكفي لأي طالب في هذه الفصول حضور حصتين فقط ليتم احتساب يومه كحضور كامل بنسبة 100%.
                                  </div>
                                </div>
                              </h3>
                              <p className="text-sm text-gray-500 mb-6 font-bold">حدد الفصول التي تنطبق عليها ميزة الاستثناء للصغار.</p>
                              
                              <div className="bg-white/60 p-4 sm:p-6 rounded-3xl border border-white/50 shadow-sm">
                                <div className="flex flex-wrap gap-3">
                                  {(phases || []).flatMap(p => p.classes).length === 0 ? (
                                    <span className="text-xs text-gray-400">لا يوجد فصول في النظام. أضف فصولاً أولاً.</span>
                                  ) : (
                                    (phases || []).flatMap(p => p.classes).map(cls => {
                                      const isSelected = youngClasses.includes(cls);
                                      return (
                                        <button
                                          key={cls}
                                          onClick={() => toggleYoungClass(cls)}
                                          className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all ${
                                            isSelected
                                              ? 'bg-blue-100 text-blue-700 border-blue-200 shadow-sm'
                                              : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                                          }`}
                                        >
                                          {cls} {isSelected && '✓'}
                                        </button>
                                      );
                                    })
                                  )}
                                </div>
                              </div>
                            </div>

                            </div>
                          ));
                        })()}
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </main>
          </>
        )}

        {/* SCHEDULE OVERLAY (الجدول المالي للشاشة) */}
        <AnimatePresence>
          {showScheduleOverlay && selectedClass && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 z-[100] w-full h-full flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm"
            >
              <GlassScheduleTable
                timeSlots={masterTimeSlots}
                days={ADMIN_WEEK_DAYS}
                title={`جدول الفصل: ${selectedClass}`}
                subtitle="اضغط على خانة فارغة لإضافة حصة. الفسحة مبرمجة تلقائياً."
                onClose={() => setShowScheduleOverlay(false)}
                renderDayLabel={(day) => (
                  <div key={`day-hdr-${day}`} className="bg-gray-900/10 rounded-xl p-2 text-center text-xs font-black text-gray-800 shadow-sm select-none">
                    {day}
                  </div>
                )}
                renderCell={(day, time) => {
                  const dayLessons = scheduleData[day] || [];
                  const lesson = dayLessons.find(l => l.time === time);
                  
                  // Calculate exact index of this time slot to robustly verify break
                  const timeSlotIndex = masterTimeSlots.indexOf(time);
                  const isBreakSlot = timeSlotIndex === Number(settings.breakAfterPeriod);
                  
                  const finalLesson = lesson || (isBreakSlot ? { type: 'break', subject: 'فسحة' } : null);

                  return (
                    <button
                      key={`cell-${day}-${time}`}
                      draggable={finalLesson && finalLesson.type !== 'break'}
                      onDragStart={(e) => {
                        if (finalLesson && finalLesson.type !== 'break') {
                          e.dataTransfer.setData('sourceLessonId', finalLesson.id);
                        }
                      }}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const sourceId = e.dataTransfer.getData('sourceLessonId');
                        if (sourceId && finalLesson?.type !== 'break') {
                          handleMoveLesson(sourceId, day, time);
                        }
                      }}
                      onClick={() => { 
                        if (!finalLesson) {
                          handleEmptyCellClick(day, time); 
                        } else if (finalLesson.type !== 'break') {
                          // Allow editing of existing basic lesson
                          setEditingLesson({ ...finalLesson, day, time, classCode: selectedClass, isEdit: true });
                          setLessonForm({ subject: finalLesson.subject, instructor: finalLesson.instructor, room: finalLesson.room || '' });
                        }
                      }}
                      disabled={finalLesson?.type === 'break'}
                      className={`w-full min-h-[86px] rounded-xl border p-3 text-right transition-all font-bold text-sm shadow-sm hover:shadow-md hover:-translate-y-0.5 ${finalLesson
                        ? finalLesson.type === 'break'
                          ? 'bg-gradient-to-br from-orange-400 to-orange-500 border-orange-300 text-white cursor-not-allowed'
                          : `bg-gradient-to-br text-white cursor-pointer hover:ring-2 hover:ring-white/50 ${getSubjectColor(finalLesson.subject)}`
                        : 'bg-white/50 border-white text-gray-400 hover:bg-white hover:text-gray-800 backdrop-blur-sm'
                        }`}
                    >
                      {finalLesson ? (
                        <>
                          <p className="line-clamp-1 drop-shadow-sm">{finalLesson.subject}</p>
                          {finalLesson.instructor && (
                            <p className="text-[10px] text-white/90 mt-1.5 line-clamp-1 bg-black/10 inline-block px-1.5 py-0.5 rounded">{finalLesson.instructor}</p>
                          )}
                        </>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                          <span className="text-gray-400 text-xl font-light">+</span>
                        </div>
                      )}
                    </button>
                  );
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Lesson Edit Modal */}
        <AnimatePresence>
          {editingLesson && showScheduleOverlay && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[500] bg-black/40 backdrop-blur-md flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="glass-card bg-white/95 rounded-[2rem] p-4 sm:p-8 w-full max-w-md space-y-5 shadow-2xl border border-white"
              >
                <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                  <h4 className="text-xl font-bold text-gray-900 flex items-center gap-2"><Edit2 size={20} className="text-emerald-500" /> إضافة حصة</h4>
                  <button onClick={() => { setEditingLesson(null); setLessonForm({ subject: '', instructor: '', room: '' }); }} className="text-gray-400 hover:text-red-500 bg-gray-50 hover:bg-red-50 p-2 rounded-xl transition-colors">
                    <X size={20} />
                  </button>
                </div>
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-2xl border border-gray-200/50 flex justify-between items-center">
                  <div>
                    <p className="font-bold text-gray-900">{editingLesson?.day}</p>
                    <p className="text-xs text-emerald-600 font-bold">{selectedClass}</p>
                  </div>
                  <span className="bg-white px-3 py-1.5 rounded-lg text-sm font-bold text-gray-600 shadow-sm">{editingLesson?.time}</span>
                </div>
                <div className="space-y-3">
                  <select 
                    value={lessonForm.subject} 
                    onChange={(e) => setLessonForm({ ...lessonForm, subject: e.target.value, instructor: '' })} 
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3.5 text-sm font-bold text-gray-900 shadow-sm focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                  >
                    <option value="" disabled>اختر المادة</option>
                    {SUBJECTS.filter(s => s !== 'مادة أخرى').map((sub, i) => <option key={i} value={sub}>{sub}</option>)}
                  </select>

                  <select 
                    value={lessonForm.instructor} 
                    onChange={(e) => setLessonForm({ ...lessonForm, instructor: e.target.value })} 
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3.5 text-sm text-gray-900 shadow-sm focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                    disabled={!lessonForm.subject}
                  >
                    <option value="" disabled>{lessonForm.subject ? 'اختر المعلم' : 'اختر المادة أولاً'}</option>
                    {(staff || []).filter(s => s.role === 'teacher' && (!lessonForm.subject || s.specialization === lessonForm.subject || s.specialization === 'عام')).map((t, i) => (
                      <option key={i} value={t.name}>{t.name} ({t.specialization})</option>
                    ))}
                  </select>

                  <input type="text" placeholder="الحجرة (اختياري)" value={lessonForm.room} onChange={(e) => setLessonForm({ ...lessonForm, room: e.target.value })} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3.5 text-sm text-gray-900 shadow-sm focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all" />
                </div>
                <div className="flex flex-col gap-3 pt-6 border-t border-gray-100">
                  <div className="flex gap-3">
                    <button onClick={handleSaveLesson} className="btn-oversized flex-1 bg-gradient-to-l from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-emerald-500/30">
                      💾 حفظ الحصة
                    </button>
                    <button onClick={() => { setEditingLesson(null); setLessonForm({ subject: '', instructor: '', room: '' }); }} className="btn-secondary flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3.5 rounded-xl font-bold transition-colors">
                      إلغاء
                    </button>
                  </div>
                  {editingLesson?.isEdit && (
                    <button onClick={() => handleDeleteLesson(editingLesson.id)} className="w-full bg-red-50 hover:bg-red-500 text-red-600 hover:text-white py-3 rounded-xl font-bold transition-colors shadow-sm">
                      🗑️ حذف الحصة
                    </button>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 🔥 Student Edit Modal */}
        <AnimatePresence>
          {editingStudent && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[500] bg-black/40 backdrop-blur-md flex items-center justify-center p-4">
              <motion.form
                onSubmit={handleSaveStudentEdit}
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="glass-card bg-white/95 rounded-[2rem] p-4 sm:p-8 w-full max-w-md space-y-4 shadow-2xl border border-white"
              >
                <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                  <h4 className="text-xl font-bold text-gray-900 flex items-center gap-2"><Edit2 size={20} className="text-emerald-500" /> تعديل بيانات الطالب</h4>
                  <button type="button" onClick={() => setEditingStudent(null)} className="text-gray-400 hover:text-red-500 bg-gray-50 hover:bg-red-50 p-2 rounded-xl transition-colors"><X size={20} /></button>
                </div>
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input type="text" placeholder="الاسم الكامل" value={editingStudent.name || ''} onChange={(e) => setEditingStudent({ ...editingStudent, name: e.target.value })} className="md:col-span-2 w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-emerald-500/20" />
                    <input type="text" placeholder="رقم الهوية" value={editingStudent.id || ''} readOnly className="w-full bg-gray-100 cursor-not-allowed border border-gray-200 rounded-xl px-4 py-3 text-sm font-mono text-gray-500 outline-none" title="لا يمكن تغيير رقم الهوية" />
                    <input type="password" placeholder="كلمة المرور" value={editingStudent.password || ''} onChange={(e) => setEditingStudent({ ...editingStudent, password: e.target.value })} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-emerald-500/20" />
                    
                    <input type="text" placeholder="اسم ولي الأمر" value={editingStudent.parentName || ''} onChange={(e) => setEditingStudent({ ...editingStudent, parentName: e.target.value })} className="w-full bg-blue-50/30 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-emerald-500/20" />
                    <input type="text" placeholder="رقم جوال ولي الأمر" value={editingStudent.parentPhone || ''} onChange={(e) => setEditingStudent({ ...editingStudent, parentPhone: e.target.value })} className="w-full bg-blue-50/30 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-emerald-500/20" />
                    <input type="password" placeholder="باسورد البوابة لولي الأمر" value={editingStudent.parentPassword || ''} onChange={(e) => setEditingStudent({ ...editingStudent, parentPassword: e.target.value })} className="md:col-span-2 w-full bg-blue-50/30 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-emerald-500/20" />

                    <select value={editingStudent.className || ''} onChange={(e) => setEditingStudent({ ...editingStudent, className: e.target.value })} className="md:col-span-2 w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-emerald-500/20">
                      <option value="">اختر الفصل</option>
                      {(globalMaster.classes || []).map((cls, i) => <option key={i} value={cls}>{cls}</option>)}
                    </select>
                  </div>
                  <label className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 cursor-pointer">
                    <input type="checkbox" checked={editingStudent.isExempted || false} onChange={(e) => setEditingStudent({ ...editingStudent, isExempted: e.target.checked })} className="w-5 h-5 accent-emerald-600 rounded" />
                    <span className="text-sm font-bold text-gray-900 select-none">استثناء شامل (مستمع / معفى بالكامل)</span>
                  </label>
                </div>
                <div className="flex gap-3 pt-4 border-t border-gray-100">
                  <button type="submit" className="btn-oversized flex-1 bg-gradient-to-l from-emerald-600 to-emerald-500 text-white py-3 rounded-xl font-bold shadow-lg shadow-emerald-500/30">💾 حفظ التعديلات</button>
                  <button type="button" onClick={() => setEditingStudent(null)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-bold transition-colors">إلغاء</button>
                </div>
              </motion.form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 🔥 Staff Edit Modal */}
        <AnimatePresence>
          {editingStaff && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[500] bg-black/40 backdrop-blur-md flex items-center justify-center p-4">
              <motion.form
                onSubmit={handleSaveStaffEdit}
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="glass-card bg-white/95 rounded-[2rem] p-4 sm:p-8 w-full max-w-md space-y-4 shadow-2xl border border-white"
              >
                <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                  <h4 className="text-xl font-bold text-gray-900 flex items-center gap-2"><Edit2 size={20} className="text-emerald-500" /> تعديل بيانات {editingStaff.role === 'teacher' ? 'المعلم' : 'الموظف'}</h4>
                  <button type="button" onClick={() => setEditingStaff(null)} className="text-gray-400 hover:text-red-500 bg-gray-50 hover:bg-red-50 p-2 rounded-xl transition-colors"><X size={20} /></button>
                </div>
                <div className="space-y-3">

                  <input type="text" placeholder="الاسم الكامل" value={editingStaff.name || ''} onChange={(e) => setEditingStaff({ ...editingStaff, name: e.target.value })} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-emerald-500/20" />
                  <input type="text" placeholder="اسم المستخدم" value={editingStaff.username || ''} onChange={(e) => setEditingStaff({ ...editingStaff, username: e.target.value })} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-emerald-500/20" />
                  <input type="password" placeholder="كلمة المرور" value={editingStaff.password || ''} onChange={(e) => setEditingStaff({ ...editingStaff, password: e.target.value })} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-emerald-500/20" />
                  {editingStaff.role === 'teacher' && (
                    <>
                      <select value={editingStaff.specialization || 'الرياضيات'} onChange={(e) => setEditingStaff({ ...editingStaff, specialization: e.target.value })} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-emerald-500/20">
                        {SUBJECTS.map((sub, i) => <option key={i} value={sub}>{sub}</option>)}
                      </select>
                      {editingStaff.specialization === 'مادة أخرى' && (
                        <input type="text" placeholder="اسم المادة" value={editingStaff._customSubject || ''} onChange={(e) => setEditingStaff({ ...editingStaff, _customSubject: e.target.value })} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-emerald-500/20" />
                      )}
                    </>
                  )}
                </div>
                <div className="flex gap-3 pt-4 border-t border-gray-100">
                  <button type="submit" className="btn-oversized flex-1 bg-gradient-to-l from-emerald-600 to-emerald-500 text-white py-3 rounded-xl font-bold shadow-lg shadow-emerald-500/30">💾 حفظ التعديلات</button>
                  <button type="button" onClick={() => setEditingStaff(null)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-bold transition-colors">إلغاء</button>
                </div>
              </motion.form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 🚨 Import Errors Modal */}
        <AnimatePresence>
          {importErrors && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[600] bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
              <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} className="bg-white rounded-3xl p-4 sm:p-6 w-full max-w-2xl shadow-2xl border border-red-100 max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
                  <h4 className="text-xl font-bold text-red-600 flex items-center gap-2"><AlertTriangle size={24} /> خطأ في ملف الإكسيل!</h4>
                  <button onClick={() => setImportErrors(null)} className="text-gray-400 hover:text-red-500 bg-gray-50 hover:bg-red-50 p-2 rounded-xl transition-colors"><X size={20} /></button>
                </div>
                <div className="bg-red-50 text-red-800 p-4 rounded-xl text-sm mb-4 border border-red-100 font-bold">
                  ⚠️ لم يتم استيراد أي طالب. يرجى تصحيح الأخطاء التالية في ملف الإكسيل وإعادة رفعه:
                </div>
                <div className="flex-1 overflow-y-auto pr-2 space-y-2">
                  {importErrors.map((err, i) => (
                    <div key={i} className="flex items-center gap-4 bg-gray-50 p-3 rounded-xl border border-gray-100">
                      <span className="bg-red-100 text-red-700 font-mono px-3 py-1 rounded-lg text-sm font-bold shrink-0">صف {err.row}</span>
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-900 text-sm">الاسم: {err.name}</span>
                        <span className="text-gray-500 text-xs">الهوية: {err.id}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end">
                  <button onClick={() => setImportErrors(null)} className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 sm:px-6 py-2.5 rounded-xl font-bold transition-all">إغلاق وتعديل الملف</button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 💳 كارت تأكيد الشحن/السحب (Wallet Confirm Modal) */}
        <AnimatePresence>
          {walletConfirm && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[600] bg-black/40 backdrop-blur-md flex items-center justify-center p-4">
              <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="glass-card bg-white/95 rounded-[2rem] p-4 sm:p-8 w-full max-w-md space-y-6 shadow-2xl border border-white text-center">
                <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-2 ${walletConfirm.type === 'subtract' ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-500'}`}>
                  <CreditCard size={40} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">تأكيد عملية الـ{walletConfirm.actionText}</h3>
                  <p className="text-gray-500 text-sm">هل أنت متأكد من {walletConfirm.actionText} مبلغ <strong className="text-lg text-gray-900">{walletConfirm.amount} ريال</strong> {walletConfirm.type === 'subtract' ? 'من رصيد' : 'إلى رصيد'} الطالب <strong className="text-gray-900">{walletConfirm.student.name}</strong>؟</p>
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={executeWalletTransaction} className={`flex-1 py-3 rounded-xl font-bold text-white shadow-lg transition-transform hover:scale-105 ${walletConfirm.type === 'subtract' ? 'bg-red-500 shadow-red-500/30' : 'bg-emerald-600 shadow-emerald-600/30'}`}>
                    تأكيد ال{walletConfirm.actionText}
                  </button>
                  <button type="button" onClick={() => setWalletConfirm(null)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-bold transition-colors">
                    إلغاء
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 🗑️ كارت تأكيد مسح السجل */}
        <AnimatePresence>
          {confirmClearLog && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[600] bg-black/40 backdrop-blur-md flex items-center justify-center p-4">
              <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="glass-card bg-white/95 rounded-[2rem] p-4 sm:p-8 w-full max-w-md space-y-6 shadow-2xl border border-white text-center">
                <div className="w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-2 bg-red-50 text-red-500">
                  <Trash2 size={40} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">تأكيد مسح السجل</h3>
                  <p className="text-gray-500 text-sm">هل أنت متأكد من مسح جميع العمليات المالية؟ <strong className="text-red-500 block mt-1">هذا الإجراء لا يمكن التراجع عنه!</strong></p>
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={handleClearLog} className="flex-1 py-3 rounded-xl font-bold text-white shadow-lg transition-transform hover:scale-105 bg-red-500 shadow-red-500/30">
                    تأكيد المسح
                  </button>
                  <button type="button" onClick={() => setConfirmClearLog(false)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-bold transition-colors">
                    إلغاء
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 🔐 مودال إدخال كلمة مرور المدير الموحد */}
      {passwordModalConfig.isOpen && (
        <div className="fixed inset-0 z-[999999] bg-black/60 backdrop-blur-md flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) { setPasswordModalConfig({ ...passwordModalConfig, isOpen: false }); setPasswordInput(''); } }}>
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200" dir="rtl">
            <div className={`p-4 sm:p-6 border-b ${passwordModalConfig.isDanger ? 'bg-red-50 border-red-100' : 'bg-emerald-50 border-emerald-100'}`}>
              <div className="flex items-center gap-3">
                <span className="text-3xl">{passwordModalConfig.isDanger ? '⚠️' : '🔐'}</span>
                <div>
                  <h3 className={`text-xl font-black ${passwordModalConfig.isDanger ? 'text-red-800' : 'text-emerald-800'}`}>{passwordModalConfig.title}</h3>
                </div>
              </div>
            </div>
            <div className="p-4 sm:p-6">
              <p className="text-sm font-bold text-gray-600 mb-6 whitespace-pre-line leading-relaxed">{passwordModalConfig.desc}</p>
              
              <div className="mb-6">
                <label className="block text-sm font-black text-gray-700 mb-2">كلمة مرور المدير للتأكيد</label>
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder={passwordModalConfig.placeholder}
                  className="w-full p-4 rounded-xl border-2 border-gray-200 outline-none focus:border-emerald-500 font-bold text-lg text-center tracking-widest"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      document.getElementById('confirm-password-btn').click();
                    }
                  }}
                />
              </div>

              <div className="flex gap-3">
                <button
                  id="confirm-password-btn"
                  onClick={() => {
                    let storedPass = '0000';
                    try {
                      const creds = JSON.parse(localStorage.getItem('moo_admin_credentials') || '{}');
                      if (creds.password) storedPass = creds.password;
                    } catch {}
                    if (passwordInput !== storedPass) {
                      showToast('❌ كلمة المرور غير صحيحة');
                      return;
                    }
                    if (passwordModalConfig.action) {
                      passwordModalConfig.action();
                    }
                    setPasswordModalConfig({ ...passwordModalConfig, isOpen: false });
                    setPasswordInput('');
                  }}
                  className={`flex-1 py-3 text-white rounded-xl font-black transition-colors shadow-lg ${passwordModalConfig.isDanger ? 'bg-red-600 hover:bg-red-700 shadow-red-500/30' : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/30'}`}
                >
                  تأكيد وتنفيذ
                </button>
                <button
                  onClick={() => {
                    setPasswordModalConfig({ ...passwordModalConfig, isOpen: false });
                    setPasswordInput('');
                  }}
                  className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-black transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hidden PDF Report Template */}
      <div style={{ position: 'absolute', top: '-9999px', left: '-9999px' }}>
        <div id="pdf-report-template" style={{ width: '210mm', minHeight: '297mm', padding: '20mm', backgroundColor: '#fff', color: '#000', direction: 'rtl', fontFamily: 'system-ui, sans-serif' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '2px solid #10b981', paddingBottom: '20px', marginBottom: '30px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <img src="/logo.jpg" style={{ width: '80px', height: '80px', objectFit: 'contain', borderRadius: '10px' }} alt="Logo" />
              <div>
                <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0, color: '#111827' }}>مدارس الأوس الأهلية</h1>
                <p style={{ fontSize: '16px', margin: '5px 0 0 0', color: '#6b7280' }}>التقرير الإحصائي الشامل للنظام</p>
              </div>
            </div>
            <div style={{ textAlign: 'left' }}>
              <p style={{ fontSize: '14px', margin: 0, color: '#374151', fontWeight: 'bold' }}>تاريخ الإصدار:</p>
              <p style={{ fontSize: '14px', margin: '5px 0 0 0', color: '#6b7280' }}>{new Date().toLocaleString('ar-SA')}</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', marginBottom: '30px' }}>
            <div style={{ padding: '15px', backgroundColor: '#f3f4f6', borderRadius: '10px', textAlign: 'center' }}>
              <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 5px 0' }}>إجمالي الطلاب</p>
              <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827', margin: 0 }}>{(whitelist || []).length}</p>
            </div>
            <div style={{ padding: '15px', backgroundColor: '#f3f4f6', borderRadius: '10px', textAlign: 'center' }}>
              <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 5px 0' }}>إجمالي المعلمين</p>
              <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827', margin: 0 }}>{(staff || []).filter(s => s.role === 'teacher').length}</p>
            </div>
            <div style={{ padding: '15px', backgroundColor: '#ecfdf5', borderRadius: '10px', textAlign: 'center' }}>
              <p style={{ fontSize: '12px', color: '#047857', margin: '0 0 5px 0' }}>إجمالي الأرصدة</p>
              <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#065f46', margin: 0 }}>{Object.values(wallets || {}).reduce((a, b) => a + (Number(b) || 0), 0).toFixed(2)} ر.س</p>
            </div>
            <div style={{ padding: '15px', backgroundColor: '#fef2f2', borderRadius: '10px', textAlign: 'center' }}>
              <p style={{ fontSize: '12px', color: '#b91c1c', margin: '0 0 5px 0' }}>الشكاوى المفتوحة</p>
              <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#991b1b', margin: 0 }}>{(complaints || []).filter(c => !c.adminReply).length}</p>
            </div>
          </div>

          <div style={{ marginBottom: '30px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#111827', borderBottom: '1px solid #e5e7eb', paddingBottom: '10px', marginBottom: '15px' }}>توزيع الطلاب على المراحل الدراسية</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
              <thead>
                <tr style={{ backgroundColor: '#f9fafb' }}>
                  <th style={{ padding: '12px', borderBottom: '2px solid #e5e7eb', fontSize: '14px' }}>المرحلة</th>
                  <th style={{ padding: '12px', borderBottom: '2px solid #e5e7eb', fontSize: '14px' }}>عدد الطلاب</th>
                  <th style={{ padding: '12px', borderBottom: '2px solid #e5e7eb', fontSize: '14px' }}>النسبة</th>
                </tr>
              </thead>
              <tbody>
                {phases.map(phase => {
                  const count = (whitelist || []).filter(s => phase.classes.includes(s.className)).length;
                  const total = (whitelist || []).length || 1;
                  const pct = Math.round((count / total) * 100);
                  if (count === 0) return null;
                  return (
                    <tr key={`pdf-${phase.id}`}>
                      <td style={{ padding: '12px', borderBottom: '1px solid #e5e7eb', fontSize: '14px', fontWeight: 'bold' }}>{phase.label}</td>
                      <td style={{ padding: '12px', borderBottom: '1px solid #e5e7eb', fontSize: '14px' }}>{count} طالب</td>
                      <td style={{ padding: '12px', borderBottom: '1px solid #e5e7eb', fontSize: '14px' }}>{pct}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#111827', borderBottom: '1px solid #e5e7eb', paddingBottom: '10px', marginBottom: '15px' }}>أفضل الفصول حضوراً (Top 5)</h2>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {(() => {
                  const classStats = (globalMaster.classes || []).map(cls => {
                    const classStudents = (whitelist || []).filter(s => s.className === cls);
                    const avg = classStudents.length ? Math.round(classStudents.reduce((acc, s) => acc + (Number(s.attendancePercentage) || 0), 0) / classStudents.length) : 0;
                    return { name: cls, avg, count: classStudents.length };
                  }).filter(c => c.count > 0).sort((a,b) => b.avg - a.avg).slice(0, 5);
                  
                  if (classStats.length === 0) return <li style={{ fontSize: '14px', color: '#6b7280' }}>لا يوجد بيانات كافية</li>;
                  return classStats.map((c, i) => (
                    <li key={`pdf-best-${i}`} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px dashed #e5e7eb' }}>
                      <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#047857' }}>{c.name}</span>
                      <span style={{ fontSize: '14px', color: '#374151' }}>{c.avg}%</span>
                    </li>
                  ));
                })()}
              </ul>
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#111827', borderBottom: '1px solid #e5e7eb', paddingBottom: '10px', marginBottom: '15px' }}>نجوم المقصف (أعلى 5 أرصدة)</h2>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {(() => {
                  const topWallets = Object.entries(wallets || {}).map(([id, balance]) => {
                    const student = (whitelist || []).find(s => s.id === id);
                    return { name: student ? student.name : id, balance: Number(balance) || 0 };
                  }).filter(w => w.balance > 0).sort((a, b) => b.balance - a.balance).slice(0, 5);
                  
                  if (topWallets.length === 0) return <li style={{ fontSize: '14px', color: '#6b7280' }}>لا يوجد بيانات كافية</li>;
                  return topWallets.map((w, i) => (
                    <li key={`pdf-wallet-${i}`} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px dashed #e5e7eb' }}>
                      <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#92400e', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '150px' }}>{w.name}</span>
                      <span style={{ fontSize: '14px', color: '#374151' }}>{w.balance} ر.س</span>
                    </li>
                  ));
                })()}
              </ul>
            </div>
          </div>

          <div style={{ position: 'absolute', bottom: '20mm', left: '20mm', right: '20mm', textAlign: 'center', borderTop: '1px solid #e5e7eb', paddingTop: '15px' }}>
            <p style={{ fontSize: '12px', color: '#9ca3af', margin: 0 }}>تم استخراج هذا التقرير تلقائياً من نظام إدارة مدارس الأوس</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
AdminDashboard.propTypes = { onLogout: PropTypes.func.isRequired };

