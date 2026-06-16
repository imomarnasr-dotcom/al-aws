import { useState, useEffect, useMemo, useCallback } from 'react';
import { getStudentAvatar } from './utils/avatarUtils';
import { motion, AnimatePresence } from 'framer-motion'; // 🪄 اللمسة السينمائية
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import MobileNav from './components/MobileNav';
import DashboardView from './components/DashboardView';
import ScheduleView from './components/ScheduleView';
import GradesView from './components/GradesView';
import CafeteriaView from './components/CafeteriaView';
import SettingsView from './components/SettingsView';
import AttendanceView from './components/AttendanceView';
import AnnouncementBanner from './components/AnnouncementBanner';
import LandingPage from './components/LandingPage';
import TeacherDashboard from './components/TeacherDashboard';
import AdminDashboard from './components/AdminDashboard';
import ParentDashboard from './components/ParentDashboard';
import CafeteriaAdminDashboard from './components/CafeteriaAdminDashboard';
import ExamsView from './components/ExamsView';
import ErrorBoundary from './components/ErrorBoundary';
import CustomCursor from './components/CustomCursor';

import SuccessModal from './components/SuccessModal';
import AcademicStore from './components/AcademicStore';
import ToastManager from './components/ToastManager';
import ConfirmManager from './components/ConfirmManager';
import CloudSyncDaemon from './services/CloudSyncDaemon';
import { studentData } from './data/studentData';
import { getStudentDynamicPoints } from './utils/dataManager';
import { Palette, X, Settings2, ShoppingCart, Trash2, CreditCard, Award, Star, BookOpen, Crown, Zap, Calendar, Bell } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

// 🪄 استدعاء ملفات التصميم والخلفية
import './styles/makeover.css';
import ParticlesBackground from './components/particlesbackground';

export const STORE_ITEMS = [
  // ألقاب VIP (Titles)
  { id: 'title_legend', category: 'title', name: 'أسطورة المدرسة', cost: 3000, icon: '👑', desc: 'لقب أسطوري يظهر بجوار اسمك' },
  { id: 'title_genius', category: 'title', name: 'العبقري', cost: 2500, icon: '🧠', desc: 'لقب مميز للطلاب الأذكياء' },
  { id: 'title_hero', category: 'title', name: 'بطل الأوس', cost: 2000, icon: '🦸‍♂️', desc: 'أنت بطل حقيقي' },
  { id: 'title_star', category: 'title', name: 'نجم ساطع', cost: 1500, icon: '⭐', desc: 'نجم يلمع في سماء المدرسة' },
  { id: 'title_leader', category: 'title', name: 'القائد', cost: 1200, icon: '🦅', desc: 'لقب القائد المحنك' },
  { id: 'title_fast', category: 'title', name: 'الصاروخ', cost: 1000, icon: '🚀', desc: 'سريع في إنجاز المهام' },
  { id: 'title_artist', category: 'title', name: 'الفنان', cost: 800, icon: '🎨', desc: 'لقب لأصحاب الذوق الرفيع' },
  { id: 'title_thinker', category: 'title', name: 'المفكر', cost: 600, icon: '🤔', desc: 'دائماً تفكر خارج الصندوق' },

  // إطارات البروفايل (Frames)
  { id: 'frame_diamond', category: 'frame', name: 'إطار الماسة', cost: 4000, icon: '💎', desc: 'إطار أسطوري نادر جداً لملفك' },
  { id: 'frame_fire', category: 'frame', name: 'إطار النيران', cost: 3000, icon: '🔥', desc: 'إطار ناري متحرك حول صورتك' },
  { id: 'frame_gold', category: 'frame', name: 'إطار الذهب الخالص', cost: 2000, icon: '🥇', desc: 'إطار ذهبي لامع' },
  { id: 'frame_neon', category: 'frame', name: 'إطار النيون', cost: 1500, icon: '⚡', desc: 'إطار مشع بألوان النيون' },
  { id: 'frame_silver', category: 'frame', name: 'إطار الفضة', cost: 1000, icon: '🥈', desc: 'إطار فضي أنيق' },
  { id: 'frame_bronze', category: 'frame', name: 'إطار البرونز', cost: 500, icon: '🥉', desc: 'إطار برونزي جميل' },

  // ألوان الواجهة (Themes)
  { id: 'theme_dark', category: 'theme', hex: '#111827', rgb: '17,24,39', name: 'وضع الظلام (Dark Mode)', cost: 1500, icon: '🌙', desc: 'لون أسود ملكي فخم للواجهة' },
  { id: 'theme_royal', category: 'theme', hex: '#4338CA', rgb: '67,56,202', name: 'أزرق ملكي', cost: 800, icon: '🌌', desc: 'لون الواجهة باللون الأزرق الملكي' },
  { id: 'theme_blood', category: 'theme', hex: '#991B1B', rgb: '153,27,27', name: 'أحمر قرمزي', cost: 700, icon: '🩸', desc: 'واجهة باللون الأحمر القرمزي الداكن' },
  { id: 'theme_forest', category: 'theme', hex: '#065F46', rgb: '6,95,70', name: 'أخضر غابة', cost: 600, icon: '🌲', desc: 'لون الغابات المنعش' },
  { id: 'theme_sunset', category: 'theme', hex: '#C2410C', rgb: '194,65,12', name: 'غروب الشمس', cost: 500, icon: '🌇', desc: 'لون برتقالي دافئ' },
  { id: 'theme_ocean', category: 'theme', hex: '#0369A1', rgb: '3,105,161', name: 'أزرق المحيط', cost: 400, icon: '🌊', desc: 'أزرق هادئ ومريح' },

  // إيموجيات مخصصة (Emojis)
  { id: 'emoji_alien', category: 'emoji', value: '👽', name: 'الفضائي', cost: 400, icon: '👽', desc: 'إيموجي فضائي نادر' },
  { id: 'emoji_ghost', category: 'emoji', value: '👻', name: 'الشبح', cost: 350, icon: '👻', desc: 'إيموجي شبح لملفك' },
  { id: 'emoji_robot', category: 'emoji', value: '🤖', name: 'الآلي', cost: 300, icon: '🤖', desc: 'إيموجي روبوت' },
  { id: 'emoji_ninja', category: 'emoji', value: '🥷', name: 'النينجا', cost: 250, icon: '🥷', desc: 'إيموجي النينجا الخفي' },
  { id: 'emoji_lion', category: 'emoji', value: '🦁', name: 'الأسد', cost: 200, icon: '🦁', desc: 'إيموجي الأسد الشجاع' },
  { id: 'emoji_fox', category: 'emoji', value: '🦊', name: 'الثعلب', cost: 150, icon: '🦊', desc: 'إيموجي الثعلب الماكر' },
  { id: 'emoji_cool', category: 'emoji', value: '😎', name: 'الكول', cost: 100, icon: '😎', desc: 'إيموجي بنظارة شمسية' },
  { id: 'emoji_nerd', category: 'emoji', value: '🤓', name: 'الدحيح', cost: 80, icon: '🤓', desc: 'إيموجي الطالب المجتهد' },
  { id: 'emoji_clown', category: 'emoji', value: '🤡', name: 'المهرج', cost: 60, icon: '🤡', desc: 'إيموجي مضحك' },
  { id: 'emoji_alien', category: 'emoji', value: '👽', name: 'الفضائي', cost: 50, icon: '👽', desc: 'إيموجي المخلوق الفضائي' },
];

/* --- Preloader (شاشة الدخول السينمائية) --- */
const Preloader = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Auto-fix Mojibake
    try {
      let raw = localStorage.getItem('GLOBAL_ACADEMIC_MASTER');
      if(raw && raw.includes('ط')) {
        raw = decodeURIComponent(escape(raw));
        localStorage.setItem('GLOBAL_ACADEMIC_MASTER', raw);
        window.location.reload();
      }
    } catch(e) {}

    const timer = setTimeout(() => {
      setLoading(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {loading && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-royal-dark/95 backdrop-blur-md"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: [0.8, 1.1, 1], opacity: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="relative flex items-center justify-center w-24 h-24 mb-6 rounded-full shadow-gold bg-gradient-gold"
          >
            <span className="text-4xl text-royal-white">👑</span>
            <motion.div
              animate={{ scale: [1, 1.5, 2], opacity: [0.5, 0.2, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
              className="absolute inset-0 rounded-full border-2 border-royal-gold"
            />
          </motion.div>
          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="text-3xl font-arabic font-bold text-transparent bg-clip-text bg-gradient-gold drop-shadow-lg"
          >
            مدارس الأوس الأهلية
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="mt-2 text-royal-light font-arabic text-lg tracking-widest"
          >
            جاري تهيئة النظام السينمائي...
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

/* --- Theme Control Panel --- */
const ThemeControl = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [theme, setTheme] = useState({
    primary: '#006C35',
    bg: '#F8F9FA',
    font: "'Tajawal', sans-serif"
  });

  const updateTheme = (key, value) => {
    const newTheme = { ...theme, [key]: value };
    setTheme(newTheme);
    document.documentElement.style.setProperty(`--${key}-color`, value);
    if (key === 'primary') {
      const r = parseInt(value.slice(1, 3), 16);
      const g = parseInt(value.slice(3, 5), 16);
      const b = parseInt(value.slice(5, 7), 16);
      document.documentElement.style.setProperty('--primary-rgb', `${r}, ${g}, ${b}`);
    }
  };

  return (
    <div className="fixed left-6 bottom-6 z-[100] no-print">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-12 h-12 rounded-full bg-primary text-white shadow-xl flex items-center justify-center hover:scale-110 transition-transform border-4 border-white btn-oversized"
      >
        {isOpen ? <X size={20} /> : <Palette size={20} />}
      </button>

      {isOpen && (
        <div className="absolute bottom-16 left-0 w-64 glass-card rounded-2xl p-5 animate-fade-in border border-white/40 shadow-2xl">
          <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-3">
            <Settings2 size={16} className="text-primary" />
            <h3 className="text-sm font-bold text-gray-800">تخصيص المظهر</h3>
          </div>

          <div className="space-y-5">
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-3">اللون الأساسي</label>
              <div className="flex flex-wrap gap-2">
                {['#006C35', '#1E40AF', '#7C3AED', '#BE185D', '#D4AF37'].map(color => (
                  <button
                    key={color}
                    onClick={() => updateTheme('primary', color)}
                    className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 ${theme.primary === color ? 'border-gray-800 scale-110' : 'border-transparent'}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-3">لون الخلفية</label>
              <div className="flex flex-wrap gap-2">
                {['#F8F9FA', '#F0FDF4', '#FFFBEB', '#FDF2F8'].map(color => (
                  <button
                    key={color}
                    onClick={() => updateTheme('bg', color)}
                    className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 ${theme.bg === color ? 'border-gray-800 scale-110' : 'border-transparent'}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* --- Loading Skeleton --- */
const SkeletonLoader = () => (
  <div className="flex-1 space-y-8 animate-pulse relative z-10">
    <div className="h-40 glass-card rounded-3xl" />
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="h-32 glass-card rounded-2xl" />
      ))}
    </div>
    <div className="h-96 glass-card rounded-3xl" />
  </div>
);

/* --- Notifications Dropdown --- */
const NotificationDropdown = ({ notifications, onMarkAllRead, onClose }) => (
  <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
    <div className="relative bg-white rounded-[40px] p-8 max-w-md w-full shadow-2xl my-auto animate-scale-in" onClick={e => e.stopPropagation()}>
      <button onClick={onClose} className="absolute top-5 left-5 w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center hover:bg-gray-200 transition-colors text-gray-600 font-bold">✕</button>

      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-gradient-to-br from-primary to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
          <Bell size={32} className="text-white" />
        </div>
        <h2 className="text-2xl font-black text-gray-900 mb-1">التنبيهات الجديدة</h2>
        <p className="text-sm text-gray-400 font-medium">اطلع على آخر المستجدات</p>
      </div>

      <div className="max-h-[50vh] overflow-y-auto divide-y divide-gray-50 pr-2">
        {notifications.length > 0 ? (
          notifications.map((n) => (
            <div key={n.id} onClick={() => { if(n.action === 'open_store') { window.dispatchEvent(new CustomEvent('moo-open-store')); onClose(); } }} className={`p-4 flex gap-4 transition-colors cursor-pointer rounded-2xl mt-2 ${n.action === 'open_store' ? 'hover:bg-indigo-50 border border-indigo-100 bg-indigo-50/30' : 'hover:bg-gray-50/50'}`}>
              <span className="text-2xl">{n.icon || '🔔'}</span>
              <div className="flex-1">
                <p className="font-bold text-sm text-gray-800 mb-1">{n.title}</p>
                <p className="text-xs text-gray-500 leading-relaxed">{n.description}</p>
                <span className="text-[10px] text-gray-400 mt-2 block font-medium">{n.time}</span>
              </div>
            </div>
          ))
        ) : (
          <div className="py-10 text-center text-gray-400">
            <Bell size={48} className="mx-auto mb-4 opacity-20" />
            <p className="font-bold text-lg text-gray-500">لا توجد تنبيهات حالية</p>
            <p className="text-xs mt-1">كل أمورك على ما يرام!</p>
          </div>
        )}
      </div>

      {notifications.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-100 text-center">
          <button onClick={() => { onMarkAllRead(); onClose(); }} className="text-sm text-primary font-bold hover:underline px-6 py-2 rounded-xl bg-primary/5 hover:bg-primary/10 transition-colors">إخفاء الكل والتحديد كمقروء</button>
        </div>
      )}
    </div>
  </div>
);

/* --- Student Profile Modal --- */
const StudentProfile = ({ student, lastExamScore, onClose, onLogout, syncTrigger, onOpenStore }) => {

  const qrValue = JSON.stringify({
    id: student?.personal?.id,
    name: student?.personal?.name
  });

  const allAchievements = JSON.parse(localStorage.getItem('moo_achievements')) || {};
  const myBadges = allAchievements[student?.personal?.id] || [];

  // 🔥 إضافة: قراءة مشتريات المتجر وتطبيق أثرها الحقيقي في الـ UI
  const myPurchases = useMemo(() => {
    try {
      const purchases = JSON.parse(localStorage.getItem('moo_store_purchases') || '{}');
      const p = purchases[student?.personal?.id];
      return Array.isArray(p) ? p : [];
    } catch { return []; }
  }, [student?.personal?.id, syncTrigger]);

  const hasGoldenFrame = myPurchases.includes('frame_gold') || myPurchases.includes('frame_diamond') || myPurchases.includes('frame_fire') || myPurchases.includes('frame_neon') || myPurchases.includes('frame_silver') || myPurchases.includes('frame_bronze') || myPurchases.includes('golden_frame'); // fallback
  const purchasedFrameItem = STORE_ITEMS.find(item => item.category === 'frame' && myPurchases.includes(item.id)) || (myPurchases.includes('golden_frame') ? { id: 'golden_frame', name: 'إطار الذهب الخالص', icon: '🥇' } : null);

  const hasVipBadge = myPurchases.includes('vip_badge');
  const purchasedTitleItem = STORE_ITEMS.find(item => item.category === 'title' && myPurchases.includes(item.id));
  const activeTitle = purchasedTitleItem ? purchasedTitleItem.name : null;

  const hasCustomEmoji = STORE_ITEMS.some(item => item.category === 'emoji' && myPurchases.includes(item.id)) || myPurchases.includes('custom_emoji');
  const customEmoji = useMemo(() => {
    if (!hasCustomEmoji) return null;
    const purchasedEmojiItem = STORE_ITEMS.find(item => item.category === 'emoji' && myPurchases.includes(item.id));
    if (purchasedEmojiItem) return purchasedEmojiItem.value;
    try {
      const emojis = JSON.parse(localStorage.getItem('moo_custom_emojis') || '{}');
      return emojis[student?.personal?.id] || '🌟';
    } catch { return '🌟'; }
  }, [hasCustomEmoji, myPurchases, student?.personal?.id, syncTrigger]);

  // 🔥 إصلاح: حساب weeklyCommitment الحقيقي من سجل الحضور
  const weeklyCommitment = useMemo(() => {
    try {
      const attendance = JSON.parse(localStorage.getItem('moo_attendance') || '{}');
      const studentId = student?.personal?.id;
      if (!studentId) return 0;
      // نحسب أيام الأسبوع الحالي فقط
      const now = new Date();
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay());
      let total = 0, present = 0;
      Object.entries(attendance).forEach(([key, record]) => {
        if (!key.includes('_')) return;
        const parts = key.split('_');
        const cls = parts.slice(0, -1).join('_');
        const dateStr = parts[parts.length - 1];
        if (cls !== student?.personal?.class) return;
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return;
        if (d >= weekStart && d <= now) {
          total++;
          if (record && record[studentId] === 'حاضر') present++;
        }
      });
      return total === 0 ? 0 : Math.round((present / total) * 100);
    } catch { return 0; }
  }, [student?.personal?.id, student?.personal?.class, syncTrigger]);

  // 🔥 الإصلاح: نقل الـ side effect من داخل الـ render لـ useEffect لمنع التعديل أثناء التصيير
  useEffect(() => {
    if (!student?.personal?.id) return;
    const achievements = JSON.parse(localStorage.getItem('moo_achievements')) || {};
    let badges = achievements[student.personal.id];
    if (!Array.isArray(badges)) badges = [];
    let changed = false;

    // وسام المواظب — حضور أسبوعي 100%
    if (weeklyCommitment === 100 && !badges.includes('وسام المواظب')) {
      badges.push('وسام المواظب'); changed = true;
    }

    // وسام المتفوق — درجة كاملة في اختبار
    if (lastExamScore && lastExamScore !== 'لا يوجد' && !lastExamScore.includes('قيّمت')) {
      const parts = lastExamScore.split('/');
      if (parts.length === 2 && parts[0] === parts[1] && !badges.includes('وسام المتفوق')) {
        badges.push('وسام المتفوق'); changed = true;
      }
    }

    // 🔥 إضافة: وسام القارئ — أكمل أكثر من 3 اختبارات
    try {
      const allExams = JSON.parse(localStorage.getItem('exams') || '[]');
      const mooTests = JSON.parse(localStorage.getItem('moo_tests') || '[]');
      const allTests = [...allExams, ...mooTests];
      const myAttempts = allTests.filter(ex =>
        ex.reports?.some(r => r.studentId === student.personal.id && r.status === 'submitted')
      ).length;
      if (myAttempts >= 3 && !badges.includes('وسام القارئ')) {
        badges.push('وسام القارئ'); changed = true;
      }
    } catch { }

    // 🔥 إضافة: نجم الأوس — معدل حضور فوق 95% + درجة كاملة في اختبار
    try {
      const wl = JSON.parse(localStorage.getItem('moo_whitelist') || '[]');
      const me = wl.find(s => s.id === student.personal.id);
      const highAttendance = me?.attendancePercentage >= 95;
      const hasFullScore = lastExamScore && lastExamScore !== 'لا يوجد' &&
        (() => { const p = lastExamScore.split('/'); return p.length === 2 && p[0] === p[1]; })();
      if (highAttendance && hasFullScore && !badges.includes('نجم الأوس')) {
        badges.push('نجم الأوس'); changed = true;
      }
    } catch { }

    if (changed) {
      achievements[student.personal.id] = badges;
      localStorage.setItem('moo_achievements', JSON.stringify(achievements));

      const studentNotifs = JSON.parse(localStorage.getItem('moo_student_notifications') || '{}');
      if (!studentNotifs[student.personal.id]) studentNotifs[student.personal.id] = [];
      const newBadge = badges[badges.length - 1];
      studentNotifs[student.personal.id].push({
        id: 'achv_' + Date.now(),
        icon: '🏆',
        title: 'أوسمة جديدة!',
        description: `تهانينا! لقد حققت وساماً جديداً (${newBadge}). اضغط هنا لزيارة المتجر واستبدال نقاطك بمكافآت حصرية!`,
        time: 'الآن',
        read: false,
        action: 'open_store'
      });
      localStorage.setItem('moo_student_notifications', JSON.stringify(studentNotifs));
    }
  }, [student?.personal?.id, weeklyCommitment, lastExamScore, syncTrigger]);

  const [showBadgeSelector, setShowBadgeSelector] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [pinnedBadges, setPinnedBadges] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('moo_pinned_badges')) || ['وسام المواظب', 'وسام المتفوق', 'نجم الأوس', 'وسام القارئ'];
    } catch { return ['وسام المواظب', 'وسام المتفوق', 'نجم الأوس', 'وسام القارئ']; }
  });

  const allPossibleBadges = useMemo(() => [
    { id: 'وسام المواظب', icon: <Calendar size={20} />, color: 'text-blue-500', bg: 'bg-blue-100', glow: 'shadow-blue-500/30' },
    { id: 'وسام المتفوق', icon: <Award size={20} />, color: 'text-emerald-500', bg: 'bg-emerald-100', glow: 'shadow-emerald-500/30' },
    { id: 'وسام القارئ', icon: <BookOpen size={20} />, color: 'text-purple-500', bg: 'bg-purple-100', glow: 'shadow-purple-500/30' },
    { id: 'نجم الأوس', icon: <Star size={20} />, color: 'text-amber-500', bg: 'bg-amber-100', glow: 'shadow-amber-500/30' },
    ...STORE_ITEMS.map(i => ({
      id: i.name, icon: <span className="text-xl drop-shadow-sm">{i.icon}</span>, color: 'text-indigo-500', bg: 'bg-indigo-100', glow: 'shadow-indigo-500/30', isStore: true
    }))
  ], []);

  const handleTogglePin = (badgeId) => {
    let newPinned = [...pinnedBadges];
    if (newPinned.includes(badgeId)) {
      newPinned = newPinned.filter(id => id !== badgeId);
    } else {
      // إذا كان العدد 4، نبحث عن وسام غير مملوك لنستبدله
      if (newPinned.length >= 4) {
        const unownedIdx = newPinned.findIndex(p => {
          const b = allPossibleBadges.find(x => x.id === p);
          return !(myBadges.includes(p) || myPurchases.includes(p) || (b?.isStore && myPurchases.some(pur => pur === STORE_ITEMS.find(i => i.name === p)?.id)));
        });
        if (unownedIdx !== -1) {
          newPinned[unownedIdx] = badgeId; // استبدال الوهمي
        }
      } else {
        newPinned.push(badgeId);
      }
    }
    setPinnedBadges(newPinned);
    localStorage.setItem('moo_pinned_badges', JSON.stringify(newPinned));
  };

  let rankTitle = 'طالب مستجد';
  let rankColor = 'text-gray-500';
  let ringColor = 'ring-gray-200 shadow-gray-200/50';
  if (myBadges.length === 1) { rankTitle = 'طالب نشيط'; rankColor = 'text-blue-500'; ringColor = 'ring-blue-400 shadow-blue-400/50'; }
  else if (myBadges.length === 2) { rankTitle = 'طالب مثالي'; rankColor = 'text-emerald-500'; ringColor = 'ring-emerald-400 shadow-emerald-400/50'; }
  else if (myBadges.length >= 3) { rankTitle = 'بطل الأوس'; rankColor = 'text-amber-500'; ringColor = 'ring-amber-400 shadow-amber-400/50'; }

  const [showQR, setShowQR] = useState(false);

  return (
    <>
      {/* === QR Code Cinematic Overlay === */}
      {showQR && (
        <div
          onClick={() => setShowQR(false)}
          className="fixed inset-0 flex items-center justify-center bg-black/80 backdrop-blur-2xl p-4"
          dir="rtl"
          style={{ zIndex: 999999, animation: 'fadeIn 0.3s ease' }}
        >
          <div
            className="bg-white rounded-[40px] p-8 sm:p-12 shadow-[0_0_100px_rgba(16,185,129,0.3)] flex flex-col items-center gap-6 relative"
            style={{ animation: 'qrBounceIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
            onClick={e => e.stopPropagation()}
          >
            <button onClick={() => setShowQR(false)} className="absolute top-4 left-4 text-gray-400 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 p-2 rounded-full transition-all">
              <X size={20} />
            </button>
            <div className="w-8 h-1 bg-gray-200 rounded-full mb-2" />
            <p className="text-lg font-black text-gray-800 tracking-wide">بطاقة الطالب الذكية</p>
            <div className="bg-white rounded-3xl shadow-xl border-2 border-emerald-100 p-6">
              <QRCodeSVG value={qrValue} size={220} level="H" includeMargin={false} fgColor="#111111" bgColor="#ffffff" className="w-full h-full" />
            </div>
            <p className="text-sm font-bold text-gray-500">{student?.personal?.name}</p>
            <p className="text-xs font-mono text-gray-400 bg-gray-50 px-4 py-2 rounded-xl">{student?.personal?.id}</p>
            <p className="text-[11px] text-gray-400 mt-2">وجّه الكاميرا نحو الباركود للمسح 📷</p>
          </div>
        </div>
      )}

      {/* === Main Profile Modal === */}
      <div className="fixed inset-0 flex items-center justify-center bg-gray-900/70 backdrop-blur-xl animate-fade-in p-3 sm:p-6 lg:p-10" dir="rtl" style={{ zIndex: 99999 }}>
        <div className="bg-gradient-to-br from-white/95 to-white/90 backdrop-blur-2xl w-full max-w-sm sm:max-w-2xl lg:max-w-5xl rounded-[32px] sm:rounded-[40px] shadow-2xl overflow-hidden border border-white/50 relative animate-fade-in-up flex flex-col max-h-[95vh] ring-1 ring-black/5 glass-card">

          {/* --- Header Banner --- */}
          <div className="h-28 sm:h-36 lg:h-44 bg-gradient-to-r from-emerald-900 via-emerald-700 to-emerald-900 relative overflow-hidden shrink-0">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-400 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-pulse"></div>
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-emerald-300 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-pulse" style={{ animationDelay: '2s' }}></div>
            <button onClick={onClose} className="absolute top-4 sm:top-6 left-4 sm:left-6 text-white/70 hover:text-white bg-black/20 hover:bg-black/40 backdrop-blur-md p-2 sm:p-2.5 rounded-full transition-all z-10 hover:rotate-90">
              <X size={20} />
            </button>
            <div className="absolute top-4 sm:top-6 right-4 sm:right-6 flex items-center gap-2 bg-black/20 backdrop-blur-md px-3 sm:px-4 py-1.5 sm:py-2 rounded-2xl border border-white/10 shadow-lg">
              <Crown size={16} className={rankColor} />
              <span className="text-white text-[11px] sm:text-xs font-bold tracking-widest">{rankTitle}</span>
            </div>
          </div>

          {/* --- Content Area --- */}
          <div className="px-4 sm:px-8 lg:px-12 pb-6 sm:pb-8 relative -mt-14 sm:-mt-18 lg:-mt-20 flex-1 flex flex-col overflow-y-auto">

            {/* === Desktop: Side-by-side | Mobile: Stacked === */}
            <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 mb-6">

              {/* -- Left Column: Avatar + Info -- */}
              <div className="flex-1 flex flex-col gap-5">
                {/* Avatar Card */}
                <div className="bg-white/80 backdrop-blur-xl rounded-[28px] sm:rounded-[32px] p-5 sm:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-emerald-600"></div>
                  <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-center text-center sm:text-right">
                    <div className={`w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32 bg-white rounded-full p-1.5 shrink-0 shadow-xl ring-4 ${purchasedFrameItem ? (purchasedFrameItem.id === 'frame_diamond' ? 'ring-cyan-300 shadow-cyan-200' : purchasedFrameItem.id === 'frame_fire' ? 'ring-red-500 shadow-red-300' : purchasedFrameItem.id === 'frame_neon' ? 'ring-fuchsia-500 shadow-fuchsia-300' : 'ring-yellow-400 shadow-yellow-200') : ringColor} transition-all duration-500 relative`}>
                      <div className="w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 rounded-full flex items-center justify-center text-4xl sm:text-5xl lg:text-6xl shadow-inner relative">
                        <img src={getStudentAvatar(student?.personal?.class)} alt="Avatar" className="w-full h-full object-cover rounded-full" />

                      </div>
                      {purchasedFrameItem && (
                        <div className={`absolute -inset-1 rounded-full opacity-30 blur-sm -z-10 ${purchasedFrameItem.id === 'frame_diamond' ? 'bg-cyan-300' : purchasedFrameItem.id === 'frame_fire' ? 'bg-red-500 animate-pulse' : purchasedFrameItem.id === 'frame_neon' ? 'bg-fuchsia-500' : 'bg-gradient-to-br from-yellow-300 via-yellow-500 to-amber-400'}`} />
                      )}
                    </div>
                    <div className="flex-1 space-y-3 w-full">
                      <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-gray-900 tracking-tight flex flex-wrap justify-center sm:justify-start items-center gap-2">
                        {student?.personal?.name}
                        {hasVipBadge && <span className="text-[10px] sm:text-xs font-black bg-gradient-to-r from-amber-400 to-yellow-500 text-white px-2 sm:px-2.5 py-1 rounded-lg shadow-sm">⭐ VIP</span>}
                        {activeTitle && <span className="text-[10px] sm:text-xs font-black bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-2 sm:px-2.5 py-1 rounded-lg shadow-sm">{purchasedTitleItem.icon} {activeTitle}</span>}
                      </h2>
                      <div className="flex flex-wrap justify-center sm:justify-start gap-2 sm:gap-3">
                        <span className="bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold tracking-widest">{student?.personal?.class}</span>
                        <span className="bg-gray-50 text-gray-600 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold font-mono border border-gray-100">{student?.personal?.id}</span>
                      </div>
                      <div className="flex flex-wrap justify-center sm:justify-start gap-2 pt-1">
                        <span className="text-[11px] sm:text-xs text-gray-400 font-bold bg-gray-50 px-3 py-1 rounded-lg">📊 آخر اختبار: {lastExamScore}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Wallet + QR Row */}
                <div className="grid grid-cols-2 gap-4 sm:gap-5">
                  {/* Wallet */}
                  <div className="bg-white rounded-[24px] sm:rounded-3xl p-5 sm:p-6 shadow-[4px_4px_10px_rgba(0,0,0,0.02),-4px_-4px_10px_rgba(255,255,255,1)] border border-gray-50 flex flex-col items-center justify-center text-center relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-amber-400/10 rounded-full blur-2xl group-hover:bg-amber-400/20 transition-all duration-500" />
                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full flex items-center justify-center mb-2 sm:mb-3 shadow-[0_0_20px_rgba(251,191,36,0.3)] animate-bounce-slow border border-amber-200/50">
                      <span className="text-2xl sm:text-3xl drop-shadow-md">🪙</span>
                    </div>
                    <p className="text-[9px] sm:text-[10px] font-black text-gray-400 mb-1 uppercase tracking-widest">المحفظة</p>
                    <div className="flex items-baseline gap-1">
                      <span className="font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-orange-500 text-2xl sm:text-3xl tabular-nums">{student?.cafeteria?.currentBalance}</span>
                      <span className="text-[10px] sm:text-xs font-bold text-amber-600">ر.س</span>
                    </div>
                  </div>

                  {/* QR Code - Clickable */}
                  <div
                    onClick={() => setShowQR(true)}
                    className="bg-white rounded-[24px] sm:rounded-3xl p-5 sm:p-6 shadow-[4px_4px_10px_rgba(0,0,0,0.02),-4px_-4px_10px_rgba(255,255,255,1)] border border-gray-50 flex flex-col items-center justify-center relative group cursor-pointer hover:shadow-lg hover:border-emerald-100 transition-all"
                  >
                    <p className="text-[9px] sm:text-[10px] font-black text-gray-400 mb-2 sm:mb-3 uppercase tracking-widest">البطاقة الذكية</p>
                    <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white rounded-2xl shadow-sm border border-gray-100 p-1.5 sm:p-2 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <QRCodeSVG value={qrValue} size={80} level="H" includeMargin={false} fgColor="#111111" bgColor="#ffffff" className="w-full h-full" />
                    </div>
                    <p className="text-[9px] sm:text-[10px] text-emerald-600 font-bold mt-2 opacity-0 group-hover:opacity-100 transition-opacity">اضغط للتكبير 🔍</p>
                  </div>
                </div>
              </div>

              {/* -- Right Column (Desktop) / Below (Mobile): Badges + Store -- */}
              <div className="w-full lg:w-80 flex flex-col gap-5">
                {/* Badges */}
                <div className="bg-white rounded-[24px] sm:rounded-3xl p-5 sm:p-6 shadow-[4px_4px_10px_rgba(0,0,0,0.02),-4px_-4px_10px_rgba(255,255,255,1)] border border-gray-50 flex flex-col items-center flex-1 relative">
                  <div className="w-full flex justify-between items-center mb-4 sm:mb-5">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">خزنة الأوسمة</p>
                    <button onClick={() => setIsEditMode(!isEditMode)} className={`text-[10px] font-bold px-3 py-1 rounded-lg transition-colors ${isEditMode ? 'bg-indigo-600 text-white shadow-md' : 'text-indigo-500 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100'}`}>
                      {isEditMode ? 'تم' : 'تعديل'}
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:gap-4 w-full">
                    {[0, 1, 2, 3].map((slotIndex) => {
                      const validPinnedBadges = pinnedBadges.filter(badgeId => {
                        const b = allPossibleBadges.find(x => x.id === badgeId);
                        return myBadges.includes(badgeId) || myPurchases.includes(badgeId) || (b?.isStore && myPurchases.some(p => p === STORE_ITEMS.find(i => i.name === badgeId)?.id));
                      });
                      
                      const badgeId = validPinnedBadges[slotIndex];
                      
                      if (!badgeId) {
                        return (
                          <div key={slotIndex} className={`w-full aspect-square rounded-2xl bg-gray-50/50 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-2 transition-all ${isEditMode ? 'opacity-50' : ''}`}>
                            <div className="text-gray-300">
                              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-50">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                              </svg>
                            </div>
                            <span className="text-[9px] font-bold text-gray-400">في تقدم</span>
                          </div>
                        );
                      }
                      
                      const badge = allPossibleBadges.find(b => b.id === badgeId);
                      return (
                        <div key={slotIndex} className="relative w-full aspect-square">
                          {isEditMode && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleTogglePin(badge.id); }}
                              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-lg hover:bg-red-600 hover:scale-110 transition-all z-10 border-2 border-white"
                            >
                              ✕
                            </button>
                          )}
                          <button
                            type="button"
                            title={badge.id}
                            onClick={() => { if (!isEditMode) setShowBadgeSelector(true); }}
                            className={`w-full h-full rounded-2xl sm:rounded-3xl flex flex-col items-center justify-center gap-1.5 transition-all duration-300 bg-white ${badge.color} shadow-[0_5px_15px_rgba(0,0,0,0.08)] border border-gray-100 group ${!isEditMode ? 'hover:-translate-y-1 hover:shadow-xl cursor-pointer' : 'cursor-default'}${isEditMode ? ' animate-pulse-slow' : ''}`}
                          >
                            <div className={`drop-shadow-md transition-transform ${!isEditMode ? 'group-hover:scale-110' : ''}`}>
                              {badge.icon}
                            </div>
                            <span className={`text-[9px] sm:text-[10px] font-black text-gray-600`}>{badge.id}</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Academic Store Button */}
                <div onClick={() => onOpenStore && onOpenStore()} className="w-full relative rounded-[24px] sm:rounded-3xl p-4 sm:p-5 flex items-center justify-between cursor-pointer overflow-hidden group btn-oversized">
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-violet-600 opacity-90 group-hover:opacity-100 transition-opacity"></div>
                  <div className="absolute -right-10 -top-10 w-32 h-32 bg-white/20 rounded-full blur-2xl group-hover:bg-white/30 transition-all"></div>
                  <div className="flex items-center gap-3 sm:gap-4 relative z-10">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 backdrop-blur-md rounded-xl sm:rounded-2xl flex items-center justify-center text-white shadow-inner border border-white/30 group-hover:scale-110 group-hover:rotate-12 transition-all">
                      <Zap size={20} className="drop-shadow-lg" />
                    </div>
                    <div className="text-right">
                      <p className="text-sm sm:text-base font-black text-white tracking-wide">متجر التميز</p>
                      <p className="text-[10px] sm:text-[11px] text-indigo-100 font-medium mt-0.5 opacity-90">استبدل أوسمتك بمكافآت حصرية</p>
                    </div>
                  </div>
                  <span className="text-white/80 bg-white/10 p-2 rounded-xl group-hover:bg-white/20 group-hover:-translate-x-1 transition-all relative z-10">←</span>
                </div>
              </div>
            </div>


          </div>
        </div>
      </div>

      {/* --- Cinematic Animations --- */}
      <style>{`
        @keyframes qrBounceIn {
          0% { transform: scale(0.3) rotate(-8deg); opacity: 0; }
          50% { transform: scale(1.05) rotate(2deg); opacity: 1; }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>

      {/* Badge Selector Modal */}
      {showBadgeSelector && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm" style={{ animation: 'fadeIn 0.3s ease-out' }}>
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 to-purple-500" />
            <button onClick={() => setShowBadgeSelector(false)} className="absolute top-4 left-4 p-2 bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-full transition-colors">
              <X size={18} />
            </button>
            <h3 className="text-xl font-black text-gray-800 mb-2">تعديل الأوسمة المعروضة</h3>
            <p className="text-sm text-gray-500 mb-6 font-medium">اختر 4 أوسمة بحد أقصى لعرضها في ملفك الشخصي.</p>
            
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-[50vh] overflow-y-auto p-2">
              {allPossibleBadges.map((badge, idx) => {
                const hasBadge = myBadges.includes(badge.id) || myPurchases.includes(badge.id) || (badge?.isStore && myPurchases.some(p => p === STORE_ITEMS.find(i => i.name === badge.id)?.id));
                if (!hasBadge) return null;
                
                const isSelected = pinnedBadges.includes(badge.id);
                return (
                  <div
                    key={idx}
                    onClick={() => handleTogglePin(badge.id)}
                    className={`aspect-square rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-all border-2 ${isSelected ? 'border-indigo-500 bg-indigo-50 shadow-md' : 'border-gray-100 bg-gray-50 hover:bg-gray-100'}`}
                  >
                    <div className={isSelected ? 'scale-110 drop-shadow-md transition-transform' : ''}>{badge.icon}</div>
                    <span className={`text-[10px] font-black text-center px-1 ${isSelected ? 'text-indigo-700' : 'text-gray-500'}`}>{badge.id}</span>
                  </div>
                );
              })}
            </div>
            
            <button onClick={() => setShowBadgeSelector(false)} className="mt-6 w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl shadow-lg shadow-indigo-200 transition-all">
              حفظ التغييرات
            </button>
          </div>
        </div>
      )}
    </>
  );
};

/* --- Exam Result Notification --- */
const ExamResultNotification = ({ student }) => {
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    if (!student?.personal?.id) return;
    
    const checkResults = () => {
      try {
        const exams = JSON.parse(localStorage.getItem('exams') || '[]');
        const teacherExams = JSON.parse(localStorage.getItem('moo_tests') || '[]');
        const allExams = [...exams, ...teacherExams];
        const dismissed = JSON.parse(localStorage.getItem('moo_dismissed_results') || '[]');

        const now = new Date();

        for (const exam of allExams) {
          if (dismissed.includes(exam.id)) continue;
          
          const report = exam.reports?.find(r => r.studentId === student.personal.id);
          if (report && report.status === 'submitted') {
            const submittedAt = new Date(report.timestamp);
            const diffMinutes = (now - submittedAt) / 60000;
            
            if (diffMinutes >= 0 && diffMinutes <= 30) {
              setNotification({ exam, report });
              return;
            }
          }
        }
        setNotification(null);
      } catch (e) {
        console.error(e);
      }
    };

    checkResults();
    const timer = setInterval(checkResults, 30000);
    return () => clearInterval(timer);
  }, [student?.personal?.id]);

  if (!notification) return null;

  const dismiss = () => {
    try {
      const dismissed = JSON.parse(localStorage.getItem('moo_dismissed_results') || '[]');
      dismissed.push(notification.exam.id);
      localStorage.setItem('moo_dismissed_results', JSON.stringify(dismissed));
      setNotification(null);
    } catch {}
  };

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[3000] w-[90%] max-w-md bg-white rounded-3xl p-6 shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-emerald-100 animate-fade-in-up flex items-start gap-4">
      <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0">
        <Award size={24} />
      </div>
      <div className="flex-1">
        <h4 className="font-black text-gray-900 text-lg mb-1">تم إصدار نتيجة الاختبار!</h4>
        <p className="text-sm font-bold text-emerald-600 mb-1">{notification.exam.title}</p>
        <p className="text-xs text-gray-500 font-bold">يمكنك رؤية النتيجة والأسئلة الآن من بوابة الاختبارات.</p>
      </div>
      <button onClick={dismiss} className="w-8 h-8 bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-full flex items-center justify-center transition-colors">
        <X size={16} />
      </button>
    </div>
  );
};

const App = () => {
  const [currentPage, setCurrentPage] = useState(() => localStorage.getItem('moo_currentPage') || 'landing');
  const [currentUser, setCurrentUser] = useState(() => JSON.parse(localStorage.getItem('moo_currentUser') || 'null'));

  useEffect(() => {
    localStorage.setItem('moo_currentPage', currentPage);
  }, [currentPage]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('moo_currentUser', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('moo_currentUser');
    }
  }, [currentUser]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showAcademicStore, setShowAcademicStore] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [syncTrigger, setSyncTrigger] = useState(0);

  const [cart, setCart] = useState(() => JSON.parse(localStorage.getItem('moo_cart')) || []);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [checkoutStatus, setCheckoutStatus] = useState('idle');
  const [studentBalance, setStudentBalance] = useState(() => {
    // 🔥 إصلاح: نقرأ الرصيد من moo_wallets لو موجود، بدل ما نبدأ بـ 150 ثابت
    // لو مش موجود نبدأ بـ 0 عشان المسئول هو اللي يشحن
    try {
      const wallets = JSON.parse(localStorage.getItem('moo_wallets') || '{}');
      // مش عارفين id الطالب هنا بعد، هنحدده في useEffect بعدين
      return 0;
    } catch { return 0; }
  });
  const [successModal, setSuccessModal] = useState({ isVisible: false, message: '', type: 'success' });

  // 🔥 الإصلاح: studentData الحقيقية للطالب تتخزن هنا عشان SettingsView وExamsView يقدروا يعدلوا عليها
  const [studentOverrides, setStudentOverrides] = useState({});

  // 🔥 الإصلاح: handleSetStudentData بتقبل دالة أو object وتطبق التعديل على studentOverrides
  const handleSetStudentData = useCallback((updaterOrData) => {
    if (typeof updaterOrData === 'function') {
      setStudentOverrides(prev => {
        const merged = updaterOrData(prev);
        return merged && typeof merged === 'object' ? merged : prev;
      });
    } else if (updaterOrData && typeof updaterOrData === 'object') {
      setStudentOverrides(updaterOrData);
    }
    setSyncTrigger(prev => prev + 1);
  }, []);

  useEffect(() => {
    if (currentUser && !currentUser.role) {
      let wallets = {};
      try { wallets = JSON.parse(localStorage.getItem('moo_wallets')) || {}; } catch { wallets = {}; }
      const id = currentUser.id || 'AWS-2024-0001';
      // 🔥 إصلاح: لو الطالب مش موجود في الـ wallets نبدأ بـ 0 مش 150
      // المسئول هو اللي يشحن الرصيد من AdminDashboard
      if (wallets[id] === undefined) {
        wallets[id] = 0;
        localStorage.setItem('moo_wallets', JSON.stringify(wallets));
      }
      setStudentBalance(wallets[id]);
    }
  }, [currentUser, syncTrigger]);

  // 🔥 إصلاح: اسمع على moo-sync عشان لو الـ daemon حدّث الـ wallets من السحابة نحدث الرصيد فوراً
  useEffect(() => {
    const handleSync = () => {
      if (currentUser && !currentUser.role) {
        try {
          const wallets = JSON.parse(localStorage.getItem('moo_wallets') || '{}');
          const id = currentUser.id || 'AWS-2024-0001';
          setStudentBalance(wallets[id] ?? 0);
        } catch { /* ignore */ }
      }
    };
    window.addEventListener('moo-sync', handleSync);
    return () => window.removeEventListener('moo-sync', handleSync);
  }, [currentUser]);
  useEffect(() => { localStorage.setItem('moo_cart', JSON.stringify(cart)); }, [cart]);

  const handleCheckout = () => {
    if (cart.length === 0) return;
    const cartTotal = cart.reduce((total, item) => total + (item.price * item.cartQuantity), 0);

    if (studentBalance < cartTotal) {
      window.dispatchEvent(new CustomEvent('moo-toast', { detail: { message: 'عذراً، الرصيد غير كافٍ لإتمام العملية.', type: 'error' } }));
      return;
    }
    setCheckoutStatus('confirming');
  };

  const confirmPurchase = () => {
    // 1. Calculate Cart Total
    const cartTotal = cart.reduce((total, item) => total + (item.price * item.cartQuantity), 0);
    
    // 2. Update Menu
    const savedMenu = JSON.parse(localStorage.getItem('moo_cafeteria_menu')) || [];
    let updatedMenu = [...savedMenu];
    cart.forEach(cartItem => {
      updatedMenu = updatedMenu.map(m => m.id === cartItem.id ? { ...m, quantity: Math.max(0, m.quantity - cartItem.cartQuantity) } : m);
    });
    localStorage.setItem('moo_cafeteria_menu', JSON.stringify(updatedMenu));

    // 3. Create Order
    const existingOrders = JSON.parse(localStorage.getItem('moo_cafeteria_orders')) || [];
    const normalizedCart = cart.map(c => ({ ...c, cartQty: c.cartQuantity })); // Standardize with POS
    
    const newOrder = {
      id: Date.now(),
      studentName: currentUser?.name || 'طالب',
      studentId: currentUser?.id || 'غير معروف',
      items: normalizedCart.map(c => `${c.name} (${c.cartQty})`).join(' + '),
      cart: normalizedCart, // Essential for Refund!
      total: cartTotal,
      date: new Date().toISOString(), // Standardized ISO Date
      status: 'pending',
        source: 'student_portal'
    };
    localStorage.setItem('moo_cafeteria_orders', JSON.stringify([newOrder, ...existingOrders].slice(0, 100)));

    // 4. Update Wallets
    const currentWallets = JSON.parse(localStorage.getItem('moo_wallets')) || {};
    const myId = currentUser?.id;
    if (myId) {
      const currentBal = currentWallets[myId] || 0;
      currentWallets[myId] = Math.max(0, currentBal - cartTotal);
      localStorage.setItem('moo_wallets', JSON.stringify(currentWallets));
    }
    
    const newBalance = studentBalance - cartTotal;
    setStudentBalance(newBalance);

    // 5. Add to Vault
    const currentVault = parseFloat(localStorage.getItem('moo_school_vault')) || 0;
    localStorage.setItem('moo_school_vault', (currentVault + cartTotal).toString());

    // 6. Record transaction in wallet transactions
    const existingTransactions = JSON.parse(localStorage.getItem('moo_wallet_transactions')) || [];
    const purchaseTransaction = {
      id: Date.now() + 1,
      studentId: currentUser?.id || 'غير معروف',
      studentName: currentUser?.name || 'طالب',
      amount: cartTotal,
      type: 'subtract',
      date: new Date().toISOString(),
      note: 'مشتريات عبر البوابة'
    };
    const updatedTransactions = [purchaseTransaction, ...existingTransactions].slice(0, 50);
    localStorage.setItem('moo_wallet_transactions', JSON.stringify(updatedTransactions));

    
    setCart([]);
    setIsCartOpen(false);
    setCheckoutStatus('idle');

    setSuccessModal({
      isVisible: true,
      message: 'تم استلام طلبك بنجاح!',
      type: 'success'
    });
    
    window.dispatchEvent(new Event('storage')); window.dispatchEvent(new CustomEvent('moo-sync'));
  };

  useEffect(() => {
    // 🔥 إصلاح: نشغل الـ migration مرة واحدة بس باستخدام flag
    if (localStorage.getItem('moo_exams_migrated') === 'v2') return;
    try {
      const exams = JSON.parse(localStorage.getItem('exams') || '[]');
      const legacyExams = JSON.parse(localStorage.getItem('moo_exams') || '[]');
      const merged = [...(Array.isArray(exams) ? exams : []), ...(Array.isArray(legacyExams) ? legacyExams : [])];

      const seen = new Set();
      const normalized = merged
        .map((ex) => {
          const item = { ...ex };
          const stage = String(item.stage || '').trim();
          const classCode = String(item.classCode || '').trim();
          const stageParts = stage.split(' - ').map(part => part.trim()).filter(Boolean);
          if (stageParts.length > 1 && (!classCode || classCode === '1/1')) {
            item.classCode = stageParts[stageParts.length - 1];
          }
          item.type = item.type === 'paper' ? 'paper' : 'online';
          return item;
        })
        .filter((ex) => {
          const key = `${ex.title || ''}__${ex.stage || ''}__${ex.classCode || ''}__${ex.day || ''}__${ex.time || ''}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });

      localStorage.setItem('exams', JSON.stringify(normalized));
      localStorage.removeItem('moo_exams');
      const teacherExams = JSON.parse(localStorage.getItem('moo_tests') || '[]');
      const reportsMap = {};
      normalized.forEach(ex => { if (ex.id && ex.reports?.length) reportsMap[ex.id] = ex.reports; });
      const updatedTeacher = teacherExams.map(ex => ({ ...ex, reports: reportsMap[ex.id] || ex.reports || [] }));
      localStorage.setItem('moo_tests', JSON.stringify(updatedTeacher));

      const globalSchedule = JSON.parse(localStorage.getItem('moo_global_schedule') || '[]');
      if (Array.isArray(globalSchedule)) {
        const cleanedSchedule = globalSchedule.filter(item => item?.type !== 'exam');
        localStorage.setItem('moo_global_schedule', JSON.stringify(cleanedSchedule));
      }
      localStorage.setItem('moo_exams_migrated', 'v2');
    } catch (error) {
      console.error('Exam migration failed', error);
    }
  }, []);

  useEffect(() => {
    if (currentUser && !currentUser.role) {
      let wallets = {};
      try { wallets = JSON.parse(localStorage.getItem('moo_wallets')) || {}; } catch { wallets = {}; }
      wallets[currentUser.id || 'AWS-2024-0001'] = studentBalance;
      localStorage.setItem('moo_wallets', JSON.stringify(wallets));
    }
  }, [studentBalance, currentUser]);


  useEffect(() => {
    const existing = localStorage.getItem('GLOBAL_ACADEMIC_MASTER');
    if (!existing) {
      const init = {
        settings: {
          firstLessonStart: '08:00',
          lessonDuration: 45,
          breakStart: '10:30',
          breakDuration: 20,
          lessonsPerDay: 7,
        },
        classes: [
          'أول ابتدائي', 'ثاني ابتدائي', 'ثالث ابتدائي',
          'رابع ابتدائي', 'خامس ابتدائي', 'سادس ابتدائي',
          'أول متوسط', 'ثاني متوسط', 'ثالث متوسط',
          'أول ثانوي', 'ثاني ثانوي', 'ثالث ثانوي',
        ],
        lessons: [],
        daySchedule: {},
      };
      localStorage.setItem('GLOBAL_ACADEMIC_MASTER', JSON.stringify(init));
    }
  }, []);

  useEffect(() => {
    const handleStorageChange = (e) => {
      if (!e || !e.key || e.key === 'GLOBAL_ACADEMIC_MASTER' || e.key.startsWith('moo_') || e.key === 'exams') {
        setSyncTrigger(prev => prev + 1);
      }
    };
    const handleNavigateEvent = (e) => {
      if (e.detail) setCurrentPage(e.detail);
    };
    const handleOpenStore = () => setShowAcademicStore(true);
    // 🔥 إضافة المستمع الجديد `moo-sync` مع الـ storage العادي
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('moo-sync', handleStorageChange);
    window.addEventListener('moo-navigate', handleNavigateEvent);
    window.addEventListener('moo-open-store', handleOpenStore);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('moo-sync', handleStorageChange);
      window.removeEventListener('moo-navigate', handleNavigateEvent);
      window.removeEventListener('moo-open-store', handleOpenStore);
    };
  }, []);

  useEffect(() => {
    if (currentPage !== 'landing') {
      setIsLoading(true);
      const timer = setTimeout(() => setIsLoading(false), 500);
      return () => clearTimeout(timer);
    }
  }, [currentPage]);

  // 🔥 إصلاح: تطبيق لون الواجهة للجميع مع جعل البنفسجي هو الافتراضي
    useEffect(() => {
      try {
        const primaryHex = localStorage.getItem('moo_theme_primary') || '#7C3AED';
        const bgHex = localStorage.getItem('moo_theme_bg') || '#F8F9FA';
        
        document.documentElement.style.setProperty('--primary-color', primaryHex);
        
        // حساب RGB
        const r = parseInt(primaryHex.slice(1, 3), 16);
        const g = parseInt(primaryHex.slice(3, 5), 16);
        const b = parseInt(primaryHex.slice(5, 7), 16);
        document.documentElement.style.setProperty('--primary-rgb', `${r}, ${g}, ${b}`);
        document.documentElement.style.setProperty('--bg-color', bgHex);

        // التوافقية مع نظام الطالب القديم
        if (primaryHex !== '#7C3AED') {
            localStorage.setItem('moo_theme_color', JSON.stringify({ hex: primaryHex, rgb: `${r}, ${g}, ${b}` }));
        }
      } catch { }
    }, [currentUser]);

  const handleMarkAllRead = useCallback(() => {
    // 🔥 إصلاح: نعلم الإشعارات كمقروءة في localStorage ونحدث الـ state
    try {
      const store = JSON.parse(localStorage.getItem('moo_student_notifications') || '{}');
      const id = currentUser?.id;
      if (id && store[id]) {
        store[id] = store[id].map(n => ({ ...n, isNew: false }));
        localStorage.setItem('moo_student_notifications', JSON.stringify(store));
      }
    } catch { /* تجاهل الخطأ */ }
    setSyncTrigger(prev => prev + 1);
    setShowNotifications(false);
  }, [currentUser]);

  const handleNavigate = (page, user) => {
    setCurrentPage(page);
    if (user) setCurrentUser(user);
  };

  const student = useMemo(() => {
    if (!currentUser || currentUser.role) return studentData;

    const stage = currentUser.className || currentUser.stage || 'الأول الثانوي';
    let globalSchedule = [];
    try {
      // 🔥 الإصلاح: قراءة من GLOBAL_ACADEMIC_MASTER (المصدر الرسمي) بدل moo_global_schedule
      const master = JSON.parse(localStorage.getItem('GLOBAL_ACADEMIC_MASTER') || '{}');
      globalSchedule = master.lessons || [];
    } catch (e) {
      console.error(e);
    }
    // 🔥 إصلاح: نشمل الفسحة في جدول الطالب عشان الأوقات ما تبانش متقطعة
    const myLessons = globalSchedule.filter(l =>
      (l.stage === stage || l.classCode === stage || l.className === stage) && l.type !== 'exam'
    );

    const mapLesson = (l, i) => ({ id: l.id, name: l.subject, time: l.time, type: l.type || 'basic', period: i + 1, instructor: l.instructor, room: l.room });
    const formattedSchedule = [
      { day: 'السبت', lessons: myLessons.filter(l => l.day === 'السبت').map(mapLesson) },
      { day: 'الأحد', lessons: myLessons.filter(l => l.day === 'الأحد').map(mapLesson) },
      { day: 'الاثنين', lessons: myLessons.filter(l => l.day === 'الاثنين').map(mapLesson) },
      { day: 'الثلاثاء', lessons: myLessons.filter(l => l.day === 'الثلاثاء').map(mapLesson) },
      { day: 'الأربعاء', lessons: myLessons.filter(l => l.day === 'الأربعاء').map(mapLesson) },
      { day: 'الخميس', lessons: myLessons.filter(l => l.day === 'الخميس').map(mapLesson) },
    ];

    let syncedNotifications = [];
    try {
      const store = JSON.parse(localStorage.getItem('moo_student_notifications') || '{}') || {};
      syncedNotifications = Array.isArray(store[currentUser.id]) ? store[currentUser.id] : [];

      // 🔥 إصلاح كامل: دمج moo_notifications (swap + عامة) مع moo_student_notifications
      // عشان نضمن إن الطالب يشوف كل إشعاراته في مكان واحد
      const generalNotifs = JSON.parse(localStorage.getItem('moo_notifications') || '[]');
      const myClass = currentUser?.class || currentUser?.stage;

      const relevantGeneralNotifs = generalNotifs
        .filter(n => {
          if (n.targetType === 'teacher' || n.targetInstructor || n.to) return false; // خاص بمعلم مش طالب
          if (n.targetClass && myClass && n.targetClass !== myClass) return false; // مش فصله
          return true;
        })
        .filter(n => !syncedNotifications.find(sn => sn.id === n.id))
        .map(n => ({ ...n, isNew: true }));

      syncedNotifications = [...syncedNotifications, ...relevantGeneralNotifs];

      // نحفظ الدمج في moo_student_notifications عشان يبقى موحد
      if (relevantGeneralNotifs.length > 0) {
        const updatedStore = { ...store, [currentUser.id]: syncedNotifications.slice(0, 50) };
        localStorage.setItem('moo_student_notifications', JSON.stringify(updatedStore));
        // نحذف الإشعارات العامة اللي اتدمجت عشان ما تتكررش
        const remaining = generalNotifs.filter(n =>
          n.targetType === 'teacher' || n.targetInstructor || n.to || // خاص بمعلم — نحتفظ بيه
          (n.targetClass && myClass && n.targetClass !== myClass) // مش فصله — نحتفظ بيه
        );
        localStorage.setItem('moo_notifications', JSON.stringify(remaining));
      }
    } catch {
      syncedNotifications = [];
    }

    return {
      ...studentData,
      personal: {
        ...studentData.personal,
        name: currentUser.name,
        id: currentUser.id,
        class: stage,
        // 🔥 إصلاح: ندمج personal من studentOverrides هنا بدل ما يحل محل كل personal
        ...(studentOverrides?.personal || {})
      },
      cafeteria: {
        ...studentData.cafeteria,
        currentBalance: studentBalance
      },
      schedule: formattedSchedule,
      notifications: [...syncedNotifications, ...(studentData.notifications || [])].slice(0, 50),
      currentSchedule: myLessons.filter(l => l.day === new Date().toLocaleDateString('ar-SA', { weekday: 'long' })).map(l => ({
        id: l.id,
        subject: l.subject,
        time: l.time,
        progress: 0,
        status: 'upcoming',
        instructor: l.instructor,
        room: l.room,
        type: l.type || 'basic'
      })),
      // 🔥 إصلاح: ندمج باقي الـ overrides بدون personal عشان ما يحلش محله
      ...Object.fromEntries(Object.entries(studentOverrides || {}).filter(([k]) => k !== 'personal'))
    };
  }, [currentUser, syncTrigger, studentBalance, studentOverrides]);

  const lastExamScore = useMemo(() => {
    try {
      if (!student?.personal?.id) return 'لا يوجد';
      const exams = JSON.parse(localStorage.getItem('exams') || '[]');
      const myExams = exams.filter(ex => ex.reports?.some(r => r.studentId === student.personal.id));
      if (myExams.length === 0) return 'لا يوجد';
      const lastExam = myExams[myExams.length - 1];
      const report = lastExam.reports.find(r => r.studentId === student.personal.id);
      return report && report.score !== undefined ? `${report.score}/${report.total}` : 'قيّمت';
    } catch { return 'لا يوجد'; }
  }, [student, syncTrigger]);

  const newNotificationsCount = student?.notifications?.filter(n => n.isNew).length || 0;

  const isTeacherRoute = currentPage === 'teacher-dashboard';
  const isAdminRoute = currentPage === 'admin' || currentPage === 'cafeteria-admin';
  const isLandingRoute = currentPage === 'landing';
  const hideStudentUI = isTeacherRoute || isAdminRoute || isLandingRoute || currentPage === 'parent-dashboard';

  // 🔥 إصلاح: Route Guard — لو مفيش مستخدم ومش في landing نرجع للـ landing
  useEffect(() => {
    if (!currentUser && currentPage !== 'landing') {
      setCurrentPage('landing');
    }
  }, [currentUser, currentPage]);

  if (!currentUser && !isLandingRoute) {
    return null;
  }

  return (
    <>
      <CloudSyncDaemon />
      <ToastManager />
      <ConfirmManager />
      <ErrorBoundary>
      <CustomCursor />
        <Preloader /> {/* 🪄 شاشة الدخول الاحترافية */}

        {/* 🪄 الخلفية العائمة تظل وراء كل شيء */}
        <div className="fixed inset-0 z-0 pointer-events-none">
          <ParticlesBackground />
        </div>

        <div className={`relative z-10 h-screen flex flex-col font-main bg-transparent selection:bg-primary/20`}>
          {!hideStudentUI && (
            <Header
              studentData={student}
              newNotificationsCount={newNotificationsCount}
              onNotificationClick={() => setShowNotifications(!showNotifications)}
              onProfileClick={() => setShowProfile(true)}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              onMenuClick={() => setIsSidebarOpen(true)}


            />
          )}

          {showProfile && !hideStudentUI && (
            <StudentProfile
              student={student}
              lastExamScore={lastExamScore}
              syncTrigger={syncTrigger}
              onClose={() => setShowProfile(false)}
              onOpenStore={() => { setShowProfile(false); setShowAcademicStore(true); }}
              onLogout={() => {
                setShowProfile(false);
                setCurrentUser(null);
                setCurrentPage('landing');
              }}
            />
          )}

          {showNotifications && (
            <NotificationDropdown
              notifications={(student?.notifications || []).filter(n => n.targetType !== 'teacher' && !n.to && !n.targetInstructor && !n.title?.includes('رصد غياب'))}
              onMarkAllRead={handleMarkAllRead}
              onClose={() => setShowNotifications(false)}
            />
          )}

          <div className="flex-1 flex overflow-hidden">
            {!hideStudentUI && (
              <Sidebar
                activeNav={currentPage}
                setActiveNav={(nav) => { setCurrentPage(nav); setIsSidebarOpen(false); }}
                onLogoutClick={() => { setCurrentPage('landing'); setCurrentUser(null); }}
                studentData={student}
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
              />
            )}

            {/* 🔥 إضافة: Mobile Bottom Nav للطالب */}
            {!hideStudentUI && (
              <MobileNav activeNav={currentPage} setActiveNav={setCurrentPage} />
            )}

            <main className={`flex-1 overflow-y-auto overflow-x-hidden transition-all duration-500 ${hideStudentUI ? '' : 'p-6 lg:p-8 pb-24 lg:pb-8'}`}>
              <div className="max-w-7xl mx-auto min-h-full">
                {isLoading && !hideStudentUI && <SkeletonLoader />}

                {/* 🪄 تنقل سينمائي بين الصفحات */}
                {!isLoading && (
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentPage}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.4 }}
                      className="h-full"
                    >
                      {currentPage === 'landing' && <LandingPage onNavigate={handleNavigate} />}
                      {currentPage === 'teacher-dashboard' && <TeacherDashboard onLogout={() => { setCurrentPage('landing'); setCurrentUser(null); }} currentTeacherUser={currentUser?.username} />}
                      {currentPage === 'admin' && <AdminDashboard account={currentUser} onLogout={() => { setCurrentPage('landing'); setCurrentUser(null); }} />}
                      {currentPage === 'cafeteria-admin' && <CafeteriaAdminDashboard onLogout={() => { setCurrentPage('landing'); setCurrentUser(null); }} />}
                      {currentPage === 'parent-dashboard' && <ParentDashboard studentData={currentUser} onLogout={() => { setCurrentPage('landing'); setCurrentUser(null); }} />}

                      {!hideStudentUI && (
                        <>
                          <ExamResultNotification student={student} />
                          <AnnouncementBanner />
                          {currentPage === 'home' && <DashboardView studentData={student} searchQuery={searchQuery} onNavigateToSchedule={() => setCurrentPage('schedule')} />}
                          {currentPage === 'schedule' && <ScheduleView studentData={student} searchQuery={searchQuery} />}
                          {currentPage === 'grades' && <GradesView studentData={student} />}
                          {currentPage === 'attendance' && <AttendanceView studentData={student} />}
                          {currentPage === 'settings' && <SettingsView studentData={student} setStudentData={handleSetStudentData} onLogout={() => { setCurrentPage('landing'); setCurrentUser(null); }} />}
                          {currentPage === 'exams' && <ExamsView studentData={student} setStudentData={handleSetStudentData} searchQuery={searchQuery} />}
                          {currentPage === 'cafeteria' && <CafeteriaView studentData={student} cart={cart} setCart={setCart} searchQuery={searchQuery} studentBalance={studentBalance} onUpdateLocalBalance={(newBal) => {
                            const wallets = JSON.parse(localStorage.getItem('moo_wallets')) || {};
                            if (wallets[student?.personal?.id] !== undefined) {
                              wallets[student.personal.id] = newBal;
                              localStorage.setItem('moo_wallets', JSON.stringify(wallets));
                              setStudentBalance(newBal);
                              window.dispatchEvent(new Event('storage')); window.dispatchEvent(new CustomEvent('moo-sync'));
                            }
                          }} />}
                        </>
                      )}
                    </motion.div>
                  </AnimatePresence>
                )}
              </div>
            </main>
          </div>


          {!hideStudentUI && (
            <>
              {currentPage === 'cafeteria' && cart.length > 0 && (
                <motion.button
                  drag
                  dragMomentum={false}
                  dragConstraints={{ left: 0, right: typeof window !== 'undefined' ? window.innerWidth - 100 : 1000, top: 0, bottom: typeof window !== 'undefined' ? window.innerHeight - 100 : 1000 }}
                  whileDrag={{ scale: 1.1, cursor: "grabbing" }}
                  onClick={() => { setIsCartOpen(true); setCheckoutStatus('idle'); }}
                  className="fixed left-8 top-1/3 z-[90] w-20 h-20 bg-orange-500 text-white rounded-full shadow-[0_15px_40px_rgba(249,115,22,0.4)] flex items-center justify-center hover:bg-orange-600 transition-colors border-4 border-white cursor-grab"
                  style={{ touchAction: "none" }}
                >
                  <ShoppingCart size={32} />
                  {cart.length > 0 && (
                    <span className="absolute -top-2 -right-2 bg-slate-900 text-white text-sm font-bold w-8 h-8 rounded-full flex items-center justify-center border-2 border-white shadow-lg">
                      {cart.reduce((acc, item) => acc + item.cartQuantity, 0)}
                    </span>
                  )}
                </motion.button>
              )}

              {isCartOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="bg-white rounded-[32px] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col relative"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {checkoutStatus === 'idle' && (
                      <>
                        <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                          <h3 className="font-bold text-gray-800 text-2xl flex items-center gap-3">
                            <ShoppingCart className="text-orange-500" size={28} />
                            سلة المشتريات الذكية
                          </h3>
                          <button onClick={() => setIsCartOpen(false)} className="w-12 h-12 flex items-center justify-center bg-white rounded-2xl text-gray-400 hover:text-rose-500 hover:bg-rose-50 shadow-sm transition-colors border border-gray-100">
                            <X size={24} />
                          </button>
                        </div>

                        <div className="max-h-[50vh] overflow-y-auto p-8 space-y-4">
                          {cart.length > 0 ? cart.map(item => (
                            <div key={item.id} className="flex justify-between items-center bg-white p-5 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group">
                              <div className="flex items-center gap-6">
                                <span className="text-4xl bg-orange-50 text-orange-500 w-16 h-16 flex items-center justify-center rounded-2xl group-hover:scale-110 transition-transform">{item.icon}</span>
                                <div>
                                  <p className="font-bold text-gray-800 text-lg mb-1">{item.name}</p>
                                  <p className="text-sm font-bold text-gray-400 bg-gray-50 px-3 py-1 rounded-lg inline-block">الكمية المحددة: {item.cartQuantity}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-6">
                                <p className="font-bold text-orange-500 text-xl tabular-nums">{item.price * item.cartQuantity} <span className="text-sm text-gray-400">ر.س</span></p>
                                <button onClick={() => setCart(cart.filter(c => c.id !== item.id))} className="text-gray-400 hover:text-rose-500 hover:bg-rose-50 p-3 rounded-2xl transition-colors">
                                  <Trash2 size={20} />
                                </button>
                              </div>
                            </div>
                          )) : (
                            <div className="py-20 flex flex-col items-center justify-center text-gray-400">
                              <ShoppingCart size={64} className="mb-6 opacity-20" />
                              <p className="font-bold text-xl text-gray-500">السلة فارغة حالياً!</p>
                              <p className="text-sm mt-2">تصفح قائمة الطعام وأضف ما تشتهيه.</p>
                            </div>
                          )}
                        </div>

                        <div className="p-8 border-t border-gray-100 bg-gray-50/50">
                          <div className="flex justify-between items-center mb-8 bg-white p-6 rounded-3xl border border-gray-100">
                            <p className="text-lg text-gray-600 font-bold">الإجمالي المطلوب</p>
                            <p className="text-4xl font-bold text-gray-900 tabular-nums">
                              {cart.reduce((total, item) => total + (item.price * item.cartQuantity), 0)} <span className="text-lg text-gray-400">ر.س</span>
                            </p>
                          </div>
                          <button
                            onClick={handleCheckout}
                            disabled={cart.length === 0}
                            className={`w-full text-white py-5 rounded-2xl font-bold text-xl transition-transform flex items-center justify-center gap-3 ${cart.length === 0 ? 'bg-gray-300 cursor-not-allowed' : 'btn-oversized bg-gradient-to-r from-primary to-emerald-500 hover:-translate-y-1 shadow-[0_15px_30px_rgba(0,108,53,0.3)]'}`}
                          >
                            <CreditCard size={24} />
                            إتمام الطلب
                          </button>
                        </div>
                      </>
                    )}

                    {checkoutStatus === 'confirming' && (
                      <div className="p-16 text-center animate-fade-in">
                        <div className="w-24 h-24 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-6">
                          <ShoppingCart size={40} />
                        </div>
                        <h3 className="text-3xl font-bold text-gray-900 mb-4">تأكيد عملية الشراء</h3>
                        <p className="text-gray-500 font-medium mb-8 text-lg">
                          سيتم خصم <span className="font-bold text-primary">{cart.reduce((total, item) => total + (item.price * item.cartQuantity), 0)} ر.س</span> من محفظتك الإلكترونية.
                        </p>
                        <div className="flex gap-4 max-w-sm mx-auto">
                          <button onClick={confirmPurchase} className="flex-1 bg-primary text-white py-4 rounded-2xl font-bold shadow-lg shadow-primary/30 hover:-translate-y-1 transition-transform">
                            تأكيد الدفع
                          </button>
                          <button onClick={() => setCheckoutStatus('idle')} className="flex-1 bg-gray-100 text-gray-600 py-4 rounded-2xl font-bold hover:bg-gray-200 transition-colors">
                            إلغاء
                          </button>
                        </div>
                      </div>
                    )}
                  </motion.div>
                </div>
              )}
            </>
          )}

          
        </div>
      </ErrorBoundary>

      {showAcademicStore && (
        <AcademicStore 
          student={student} 
          onClose={() => setShowAcademicStore(false)} 
        />
      )}

      <SuccessModal
        isVisible={successModal.isVisible}
        message={successModal.message}
        type={successModal.type}
        onClose={() => setSuccessModal({ ...successModal, isVisible: false })}
      />
    </>
  );
};

export default App;


