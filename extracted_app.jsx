Created At: 2026-06-12T23:19:18Z
Completed At: 2026-06-12T23:19:19Z
File Path: `file:///c:/al%20aws%20done/moo_project/src/App.jsx`
Total Lines: 1592
Total Bytes: 91559
Showing lines 1 to 100
The following code has been modified to include a line number before every line, in the format: <line_number>: <original_line>. Please note that any changes targeting the original code should remove the line number, colon, and leading space.
1: import { useState, useEffect, useMemo, useCallback } from 'react';
2: import { motion, AnimatePresence } from 'framer-motion'; // 🪄 اللمسة السينمائية
3: import Header from './components/Header';
4: import Sidebar from './components/Sidebar';
5: import MobileNav from './components/MobileNav';
6: import DashboardView from './components/DashboardView';
7: import ScheduleView from './components/ScheduleView';
8: import GradesView from './components/GradesView';
9: import CafeteriaView from './components/CafeteriaView';
10: import SettingsView from './components/SettingsView';
11: import AttendanceView from './components/AttendanceView';
12: import AnnouncementBanner from './components/AnnouncementBanner';
13: import LandingPage from './components/LandingPage';
14: import TeacherDashboard from './components/TeacherDashboard';
15: import AdminDashboard from './components/AdminDashboard';
16: import ParentDashboard from './components/ParentDashboard';
17: import CafeteriaAdminDashboard from './components/CafeteriaAdminDashboard';
18: import ExamsView from './components/ExamsView';
19: import ErrorBoundary from './components/ErrorBoundary';
20: import SuccessModal from './components/SuccessModal';
21: import { studentData } from './data/studentData';
22: import { getStudentDynamicPoints } from './utils/dataManager';
23: import { Palette, X, Settings2, ShoppingCart, Trash2, CreditCard, Award, Star, BookOpen, Crown, Zap, Calendar, Bell } from 'lucide-react';
24: import QRCode from 'react-qr-code';
25: 
26: // 🪄 استدعاء ملفات التصميم والخلفية
27: import './styles/makeover.css';
28: import ParticlesBackground from './components/ParticlesBackground';
29: 
30: export const STORE_ITEMS = [
31:   // ألقاب VIP (Titles)
32:   { id: 'title_legend', category: 'title', name: 'أسطورة المدرسة', cost: 3000, icon: '👑', desc: 'لقب أسطوري يظهر بجوار اسمك' },
33:   { id: 'title_genius', category: 'title', name: 'العبقري', cost: 2500, icon: '🧠', desc: 'لقب مميز للطلاب الأذكياء' },
34:   { id: 'title_hero', category: 'title', name: 'بطل الأوس', cost: 2000, icon: '🦸‍♂️', desc: 'أنت بطل حقيقي' },
35:   { id: 'title_star', category: 'title', name: 'نجم ساطع', cost: 1500, icon: '⭐', desc: 'نجم يلمع في سماء المدرسة' },
36:   { id: 'title_leader', category: 'title', name: 'القائد', cost: 1200, icon: '🦅', desc: 'لقب القائد المحنك' },
37:   { id: 'title_fast', category: 'title', name: 'الصاروخ', cost: 1000, icon: '🚀', desc: 'سريع في إنجاز المهام' },
38:   { id: 'title_artist', category: 'title', name: 'الفنان', cost: 800, icon: '🎨', desc: 'لقب لأصحاب الذوق الرفيع' },
39:   { id: 'title_thinker', category: 'title', name: 'المفكر', cost: 600, icon: '🤔', desc: 'دائماً تفكر خارج الصندوق' },
40: 
41:   // إطارات البروفايل (Frames)
42:   { id: 'frame_diamond', category: 'frame', name: 'إطار الماسة', cost: 4000, icon: '💎', desc: 'إطار أسطوري نادر جداً لملفك' },
43:   { id: 'frame_fire', category: 'frame', name: 'إطار النيران', cost: 3000, icon: '🔥', desc: 'إطار ناري متحرك حول صورتك' },
44:   { id: 'frame_gold', category: 'frame', name: 'إطار الذهب الخالص', cost: 2000, icon: '🥇', desc: 'إطار ذهبي لامع' },
45:   { id: 'frame_neon', category: 'frame', name: 'إطار النيون', cost: 1500, icon: '⚡', desc: 'إطار مشع بألوان النيون' },
46:   { id: 'frame_silver', category: 'frame', name: 'إطار الفضة', cost: 1000, icon: '🥈', desc: 'إطار فضي أنيق' },
47:   { id: 'frame_bronze', category: 'frame', name: 'إطار البرونز', cost: 500, icon: '🥉', desc: 'إطار برونزي جميل' },
48: 
49:   // ألوان الواجهة (Themes)
50:   { id: 'theme_dark', category: 'theme', hex: '#111827', rgb: '17,24,39', name: 'وضع الظلام (Dark Mode)', cost: 1500, icon: '🌙', desc: 'لون أسود ملكي فخم للواجهة' },
51:   { id: 'theme_royal', category: 'theme', hex: '#4338CA', rgb: '67,56,202', name: 'أزرق ملكي', cost: 800, icon: '🌌', desc: 'لون الواجهة باللون الأزرق الملكي' },
52:   { id: 'theme_blood', category: 'theme', hex: '#991B1B', rgb: '153,27,27', name: 'أحمر قرمزي', cost: 700, icon: '🩸', desc: 'واجهة باللون الأحمر القرمزي الداكن' },
53:   { id: 'theme_forest', category: 'theme', hex: '#065F46', rgb: '6,95,70', name: 'أخضر غابة', cost: 600, icon: '🌲', desc: 'لون الغابات المنعش' },
54:   { id: 'theme_sunset', category: 'theme', hex: '#C2410C', rgb: '194,65,12', name: 'غروب الشمس', cost: 500, icon: '🌇', desc: 'لون برتقالي دافئ' },
55:   { id: 'theme_ocean', category: 'theme', hex: '#0369A1', rgb: '3,105,161', name: 'أزرق المحيط', cost: 400, icon: '🌊', desc: 'أزرق هادئ ومريح' },
56: 
57:   // إيموجيات مخصصة (Emojis)
58:   { id: 'emoji_alien', category: 'emoji', value: '👽', name: 'الفضائي', cost: 400, icon: '👽', desc: 'إيموجي فضائي نادر' },
59:   { id: 'emoji_ghost', category: 'emoji', value: '👻', name: 'الشبح', cost: 350, icon: '👻', desc: 'إيموجي شبح لملفك' },
60:   { id: 'emoji_robot', category: 'emoji', value: '🤖', name: 'الآلي', cost: 300, icon: '🤖', desc: 'إيموجي روبوت' },
61:   { id: 'emoji_ninja', category: 'emoji', value: '🥷', name: 'النينجا', cost: 250, icon: '🥷', desc: 'إيموجي النينجا الخفي' },
62:   { id: 'emoji_lion', category: 'emoji', value: '🦁', name: 'الأسد', cost: 200, icon: '🦁', desc: 'إيموجي الأسد الشجاع' },
63:   { id: 'emoji_fox', category: 'emoji', value: '🦊', name: 'الثعلب', cost: 150, icon: '🦊', desc: 'إيموجي الثعلب الماكر' },
64:   { id: 'emoji_cool', category: 'emoji', value: '😎', name: 'الكول', cost: 100, icon: '😎', desc: 'إيموجي بنظارة شمسية' },
65:   { id: 'emoji_nerd', category: 'emoji', value: '🤓', name: 'الدحيح', cost: 80, icon: '🤓', desc: 'إيموجي الطالب المجتهد' },
66:   { id: 'emoji_clown', category: 'emoji', value: '🤡', name: 'المهرج', cost: 60, icon: '🤡', desc: 'إيموجي مضحك' },
67:   { id: 'emoji_alien', category: 'emoji', value: '👽', name: 'الفضائي', cost: 50, icon: '👽', desc: 'إيموجي المخلوق الفضائي' },
68: ];
69: 
70: /* --- Preloader (شاشة الدخول السينمائية) --- */
71: const Preloader = () => {
72:   const [loading, setLoading] = useState(true);
73: 
74:   useEffect(() => {
75:     // Auto-fix Mojibake
76:     try {
77:       let raw = localStorage.getItem('GLOBAL_ACADEMIC_MASTER');
78:       if(raw && raw.includes('ط')) {
79:         raw = decodeURIComponent(escape(raw));
80:         localStorage.setItem('GLOBAL_ACADEMIC_MASTER', raw);
81:         window.location.reload();
82:       }
83:     } catch(e) {}
84: 
85:     const timer = setTimeout(() => {
86:       setLoading(false);
87:     }, 2500);
88:     return () => clearTimeout(timer);
89:   }, []);
90: 
91:   return (
92:     <AnimatePresence>
93:       {loading && (
94:         <motion.div
95:           initial={{ opacity: 1 }}
96:           exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
97:           transition={{ duration: 0.8, ease: "easeInOut" }}
98:           className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-royal-dark/95 backdrop-blur-md"
99:         >
100:           <motion.div
The above content does NOT show the entire file contents. If you need to view any lines of the file which were not shown to complete your task, call this tool again to view those lines.
