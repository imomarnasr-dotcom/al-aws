import { LayoutDashboard, Calendar, BarChart3, CreditCard, Settings, LogOut, GraduationCap, ChevronLeft, ShieldCheck, BookOpen, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import logoImage from '../assets/logo.jpg';
import PropTypes from 'prop-types';

const NAV_ITEMS = [
  { id: 'home',       name: 'الرئيسية',      icon: <LayoutDashboard size={22} /> },
  { id: 'schedule',   name: 'جدول الحصص',    icon: <Calendar size={22} /> },
  { id: 'exams',      name: 'الاختبارات',    icon: <BookOpen size={22} /> },
  { id: 'grades',     name: 'النتائج',       icon: <BarChart3 size={22} /> },
  { id: 'attendance', name: 'الحضور',        icon: <ShieldCheck size={22} /> },
  { id: 'cafeteria',  name: 'المقصف',        icon: <CreditCard size={22} /> },
  { id: 'settings',   name: 'الإعدادات',     icon: <Settings size={22} /> },
];

const Sidebar = ({ activeNav, setActiveNav, onLogoutClick, studentData, isOpen, onClose }) => (
  <AnimatePresence>
    {isOpen && (
      <>
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-[100]"
        />
        
        {/* Sidebar Drawer */}
        <motion.aside
          initial={{ x: '100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed right-0 top-0 bottom-0 w-72 bg-white/95 backdrop-blur-xl border-l border-white/40 p-5 z-[110] shadow-2xl flex flex-col"
        >
          <div className="relative z-10 flex flex-col h-full overflow-y-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <style>{`
              .overflow-y-auto::-webkit-scrollbar { display: none; }
            `}</style>
            {/* Close Button & Brand Header */}
            <div className="flex items-start justify-between mb-8 gap-2">
              <div className="flex-1 flex flex-col items-center gap-3 p-4 rounded-3xl bg-primary/5 border border-primary/10">
                <img src={logoImage} alt="Logo" className="w-16 h-16 rounded-xl object-contain shadow-md border border-primary/20 bg-white" />
                <div className="text-center">
                  <span className="font-bold text-gray-800 text-lg block leading-tight">مدارس الأوس الأهلية</span>
                  <span className="text-primary text-[10px] font-bold uppercase tracking-widest block mt-1">بوابة الطالب الذكية</span>
                </div>
              </div>
              <button onClick={onClose} className="p-2 bg-gray-100 rounded-full text-gray-500 hover:text-red-500 hover:bg-red-50 transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Navigation Menu */}
            <nav className="flex-1 space-y-3">
              {NAV_ITEMS.map((item) => {
                const isActive = activeNav === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => { setActiveNav(item.id); onClose(); }}
                    className={`
                      w-full flex items-center gap-4 px-4 py-4 rounded-2xl
                      text-sm font-bold transition-all duration-300 group relative overflow-hidden
                      ${isActive
                        ? 'active-nav-item scale-[1.02]'
                        : 'text-gray-500 hover:bg-primary/5 hover:text-primary hover-glow border border-transparent'
                      }
                    `}
                  >
                    <span className={`transition-all duration-300 relative z-10 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-primary group-hover:scale-110'}`}>
                      {item.icon}
                    </span>

                    <span className="flex-1 text-right relative z-10">{item.name}</span>

                    {isActive ? (
                      <div className="w-2 h-2 bg-white rounded-full shadow-[0_0_10px_white] relative z-10 animate-pulse" />
                    ) : (
                      <ChevronLeft size={16} className="opacity-0 -translate-x-3 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-primary relative z-10" />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </motion.aside>
      </>
    )}
  </AnimatePresence>
);

Sidebar.propTypes = {
  activeNav: PropTypes.string.isRequired,
  setActiveNav: PropTypes.func.isRequired,
  onLogoutClick: PropTypes.func.isRequired,
  studentData: PropTypes.object,
  isOpen: PropTypes.bool,
  onClose: PropTypes.func
};

export default Sidebar;
