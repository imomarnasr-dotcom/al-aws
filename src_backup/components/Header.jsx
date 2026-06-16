import { Bell, Clock, GraduationCap, Menu } from 'lucide-react';
import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import { quotes } from '../utils/quotes';

const Header = ({ studentData, newNotificationsCount, onNotificationClick, onProfileClick, searchQuery, setSearchQuery, onMenuClick }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [quoteIndex, setQuoteIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    const quoteTimer = setInterval(() => {
      setQuoteIndex(prev => (prev + 1) % quotes.length);
    }, 5000);
    return () => {
      clearInterval(timer);
      clearInterval(quoteTimer);
    };
  }, []);

  const formattedTime = currentTime.toLocaleTimeString('ar-SA', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const formattedDate = currentTime.toLocaleDateString('ar-SA', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <header className="glass-card border-b border-white/20 px-6 py-4 flex justify-between items-center sticky top-0 z-50 h-20">
      {/* Sidebar Menu Toggle & Mobile Branding */}
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuClick}
          className="w-10 h-10 flex items-center justify-center bg-gray-50 text-gray-600 hover:text-primary hover:bg-primary/10 rounded-xl transition-all"
        >
          <Menu size={24} />
        </button>

        {/* Desktop Branding (Hidden on Mobile) */}
        <div className="hidden md:flex items-center gap-3">
          <img src="/logo.jpg" alt="Logo" className="w-12 h-12 rounded-xl object-contain shadow-sm border border-gray-100" />
          <div className="text-right">
            <span className="font-black text-gray-900 text-lg block leading-none">مدارس الأوس الأهلية</span>
            <span className="text-primary text-[10px] font-bold mt-1 block uppercase tracking-widest">المدينة المنورة</span>
          </div>
        </div>

        {/* Mobile Branding */}
        <div className="flex items-center gap-3 md:hidden">
          <img src="/logo.jpg" alt="Logo" className="w-10 h-10 rounded-xl object-contain shadow-sm border border-gray-100" />
        </div>
      </div>

      {/* Quotes & Wisdom (Replaced Search) */}
      <div className="flex-1 overflow-hidden relative h-10 flex items-center mx-4 md:mx-8 bg-primary/5 rounded-2xl px-4 border border-primary/10">
        
        {/* Desktop Fade Animation */}
        <div className="hidden md:flex items-center justify-center w-full h-full relative">
          <AnimatePresence mode="wait">
            <motion.p
              key={quoteIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.5 }}
              className="absolute text-center text-primary font-bold text-sm lg:text-base whitespace-nowrap"
            >
              {quotes[quoteIndex]}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Mobile Marquee Animation */}
        <div className="md:hidden flex items-center h-full w-full overflow-hidden relative" dir="ltr">
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: '100vw' }}
            transition={{ duration: 300, repeat: Infinity, ease: 'linear' }}
            className="whitespace-nowrap absolute flex gap-24"
          >
            {quotes.map((q, i) => (
              <span key={i} className="text-primary font-bold text-xs" dir="rtl">{q}</span>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Utilities */}
      <div className="flex items-center gap-6">
        <div className="hidden md:flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-2xl border border-gray-100">
          <Clock size={16} className="text-primary" />
          <div className="flex flex-col items-end">
            <span className="text-xs font-bold leading-none">{formattedTime}</span>
            <span className="text-[10px] text-gray-400 font-medium mt-1">{formattedDate}</span>
          </div>
        </div>

        <button
          onClick={onNotificationClick}
          className="relative w-10 h-10 flex items-center justify-center rounded-2xl bg-gray-50 border border-gray-100 hover:bg-primary/5 hover:text-primary transition-all group"
        >
          <Bell size={20} className="text-gray-500 group-hover:text-primary" />
          {newNotificationsCount > 0 && (
            <span className="absolute -top-1 -left-1 w-5 h-5 bg-primary text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white animate-pulse">
              {newNotificationsCount}
            </span>
          )}
        </button>

        <div 
          onClick={onProfileClick}
          className="flex items-center gap-4 pr-6 border-r border-gray-100 cursor-pointer group"
        >
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-gray-800 group-hover:text-primary transition-colors leading-tight">{studentData?.personal?.name || 'زائر'}</p>
            <p className="text-[10px] text-primary font-bold mt-1 uppercase tracking-wider">{studentData?.personal?.class || 'غير محدد'}</p>
          </div>
          <div className="w-11 h-11 bg-primary/10 rounded-2xl flex items-center justify-center text-primary text-lg border border-primary/20 shadow-sm group-hover:scale-105 transition-transform overflow-hidden">
             {studentData?.personal?.avatar || '👤'}
          </div>
        </div>
      </div>
    </header>
  );
};

Header.propTypes = {
  studentData: PropTypes.object,
  newNotificationsCount: PropTypes.number,
  onNotificationClick: PropTypes.func,
  onProfileClick: PropTypes.func,
  searchQuery: PropTypes.string,
  setSearchQuery: PropTypes.func,
  onMenuClick: PropTypes.func
};

export default Header;
