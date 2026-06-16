import { LayoutDashboard, Calendar, BookOpen, BarChart3, ShieldCheck, CreditCard, Settings } from 'lucide-react';
import PropTypes from 'prop-types';

const MOB_ITEMS = [
  { id: 'home',       icon: <LayoutDashboard size={22} />, label: 'الرئيسية' },
  { id: 'schedule',   icon: <Calendar size={22} />,        label: 'الجدول' },
  { id: 'exams',      icon: <BookOpen size={22} />,        label: 'الاختبارات' },
  { id: 'grades',     icon: <BarChart3 size={22} />,       label: 'النتائج' },
  { id: 'attendance', icon: <ShieldCheck size={22} />,     label: 'الحضور' },
  { id: 'cafeteria',  icon: <CreditCard size={22} />,      label: 'المقصف' },
  { id: 'settings',   icon: <Settings size={22} />,        label: 'الإعدادات' },
];

const MobileNav = ({ activeNav, setActiveNav }) => (
  <nav
    dir="rtl"
    className="lg:hidden fixed bottom-0 right-0 left-0 z-50 bg-white/90 backdrop-blur-xl border-t border-gray-100 shadow-[0_-4px_24px_rgba(0,0,0,0.07)] flex items-center justify-around px-2 pb-safe"
    style={{ paddingBottom: 'env(safe-area-inset-bottom, 8px)' }}
  >
    {MOB_ITEMS.map(item => {
      const isActive = activeNav === item.id;
      return (
        <button
          key={item.id}
          onClick={() => setActiveNav(item.id)}
          className={`flex flex-col items-center justify-center gap-0.5 py-2 px-2 rounded-2xl transition-all min-w-0 flex-1 ${
            isActive
              ? 'text-primary'
              : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          {/* أيقونة مع دائرة للـ active */}
          <div className={`flex items-center justify-center w-10 h-7 rounded-2xl transition-all ${isActive ? 'bg-primary/10' : ''}`}>
            {item.icon}
          </div>
          <span className={`text-[10px] font-bold truncate w-full text-center leading-none ${isActive ? 'text-primary' : 'text-gray-400'}`}>
            {item.label}
          </span>
        </button>
      );
    })}
  </nav>
);

MobileNav.propTypes = {
  activeNav: PropTypes.string.isRequired,
  setActiveNav: PropTypes.func.isRequired,
};

export default MobileNav;
