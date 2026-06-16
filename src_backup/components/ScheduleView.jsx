import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Search, Clock, MapPin, User, ChevronLeft, ChevronRight } from 'lucide-react';
import { getSubjectIcon } from '../utils/subjectIcon';
import { getActiveWeekDays } from '../utils/dataManager';
import PropTypes from 'prop-types';

// عرض جميع أيام الأسبوع في بوابة الطالب ليكون جدولاً أسبوعياً متكاملاً
const getScheduleDays = () => {
  return [
    { name: 'الأحد', key: 0 },
    { name: 'الاثنين', key: 1 },
    { name: 'الثلاثاء', key: 2 },
    { name: 'الأربعاء', key: 3 },
    { name: 'الخميس', key: 4 },
    { name: 'الجمعة', key: 5 },
    { name: 'السبت', key: 6 },
  ];
};

// خارج الـ component لتجنب إعادة إنشاء الدالة في كل render
const getAcademicLessons = () => {
  try {
    return JSON.parse(localStorage.getItem('GLOBAL_ACADEMIC_MASTER') || '{}').lessons || [];
  } catch {
    return [];
  }
};

const ScheduleView = ({ studentData, searchQuery: globalSearch }) => {
  const SCHEDULE_DAYS = useMemo(() => getScheduleDays(), []);
  
  const todayNum = new Date().getDay();
  const initialDay = todayNum;

  const [activeDay, setActiveDay] = useState(initialDay);
  // 🔥 إصلاح: نستخدم الـ global searchQuery من Header أولاً، والـ internal كـ fallback
  const [internalSearch, setInternalSearch] = useState('');
  const searchQuery = globalSearch?.trim() ? globalSearch : internalSearch;

  const [academicLessons, setAcademicLessons] = useState(getAcademicLessons);

  useEffect(() => {
    const update = () => setAcademicLessons(getAcademicLessons());
    window.addEventListener('storage', update);
    window.addEventListener('moo-sync', update);
    return () => { window.removeEventListener('storage', update); window.removeEventListener('moo-sync', update); };
  }, []);

  const filteredSchedule = useMemo(() => {
    const activeDayData = SCHEDULE_DAYS.find(d => d.key === activeDay);
    if (!activeDayData) return [];
    const studentClass = studentData?.personal?.class;

    // 🔥 إصلاح: نشمل الفسحة ونعرضها كصف مميز بدل ما نحذفها
    let lessons = academicLessons.filter(l =>
      l.day === activeDayData.name &&
      l.classCode === studentClass
    );

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      lessons = lessons.filter(l =>
        l.isBreak || l.type === 'break' ||
        l.subject?.toLowerCase()?.includes(q) ||
        l.instructor?.toLowerCase()?.includes(q) ||
        l.room?.toLowerCase()?.includes(q)
      );
    }

    // 🔥 الترتيب الذكي للوقت (بيفهم ص و م وصيغة 24h)
    return lessons.sort((a, b) => {
      const getMins = (timeStr) => {
        if (!timeStr) return 0;
        const match = timeStr.match(/(\d+):(\d+)\s*(ص|م|AM|PM|am|pm)?/i);
        if (!match) return 0;
        let h = parseInt(match[1], 10);
        let m = parseInt(match[2], 10);
        const suffix = match[3];
        // لو مفيش لاحقة (صيغة 24h من dataManager) نتعامل معها مباشرة
        if (!suffix) return h * 60 + m;
        const isPm = ['م', 'pm'].includes(suffix.toLowerCase());
        if (isPm && h !== 12) h += 12;
        if (!isPm && h === 12) h = 0;
        return h * 60 + m;
      };
      return getMins(a.time) - getMins(b.time);
    });
  }, [academicLessons, activeDay, searchQuery, studentData?.personal?.class]);

  const activeDayName = SCHEDULE_DAYS.find(d => d.key === activeDay)?.name || '';

  const handlePrevDay = () => {
    const currentIndex = SCHEDULE_DAYS.findIndex(d => d.key === activeDay);
    if (currentIndex > 0) {
      setActiveDay(SCHEDULE_DAYS[currentIndex - 1].key);
    }
  };

  const handleNextDay = () => {
    const currentIndex = SCHEDULE_DAYS.findIndex(d => d.key === activeDay);
    if (currentIndex < SCHEDULE_DAYS.length - 1) {
      setActiveDay(SCHEDULE_DAYS[currentIndex + 1].key);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 pb-10">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/50 p-6 rounded-[32px] backdrop-blur-xl border border-white/60 shadow-sm">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            <Calendar className="text-primary" size={32} />
            الجدول الدراسي
          </h1>
          <p className="text-gray-500 mt-1 font-medium">تابع حصصك ومواعيدك الأسبوعية</p>
        </div>

        <div className="relative w-full sm:w-auto">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="ابحث عن مادة، معلم..."
            value={internalSearch}
            onChange={(e) => setInternalSearch(e.target.value)}
            className="w-full sm:w-72 bg-white/80 border border-gray-200/80 rounded-2xl py-3 pr-11 pl-4 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium placeholder:text-gray-400"
          />
        </div>
      </header>

      <div className="bg-white/60 backdrop-blur-md rounded-[32px] p-2 sm:p-3 border border-white/60 shadow-sm overflow-x-auto hide-scrollbar">
        <div className="flex items-center gap-2 min-w-max">
          {SCHEDULE_DAYS.map((day) => (
            <button
              key={day.key}
              onClick={() => setActiveDay(day.key)}
              className={`px-5 py-3 rounded-2xl font-bold transition-all ${activeDay === day.key
                ? 'bg-primary text-white shadow-md shadow-primary/20 scale-100'
                : 'bg-transparent text-gray-500 hover:bg-gray-100/80 hover:text-gray-900 scale-95 hover:scale-100'
                }`}
            >
              {day.name}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between px-2">
        <button
          onClick={handlePrevDay}
          disabled={activeDay === SCHEDULE_DAYS[0].key}
          className="p-2 rounded-xl text-gray-400 hover:text-gray-900 hover:bg-white/50 disabled:opacity-30 transition-all"
        >
          <ChevronRight size={24} />
        </button>

        <h2 className="text-lg font-black text-gray-800">
          حصص يوم {activeDayName}
        </h2>

        <button
          onClick={handleNextDay}
          disabled={activeDay === SCHEDULE_DAYS[SCHEDULE_DAYS.length - 1].key}
          className="p-2 rounded-xl text-gray-400 hover:text-gray-900 hover:bg-white/50 disabled:opacity-30 transition-all"
        >
          <ChevronLeft size={24} />
        </button>
      </div>

      {filteredSchedule.length === 0 ? (
        <div className="bg-white/40 backdrop-blur-md rounded-[32px] border border-dashed border-gray-300 p-12 text-center flex flex-col items-center justify-center min-h-[300px]">
          <div className="w-20 h-20 bg-gray-100 rounded-3xl flex items-center justify-center mb-4 text-gray-400">
            <Calendar size={32} />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">
            {activeDay === 5 ? 'إجازة الجمعة 🎉' : activeDay === 6 && !getActiveWeekDays().includes('السبت') ? 'إجازة السبت 🎈' : 'لا توجد حصص'}
          </h3>
          <p className="text-gray-500 font-medium max-w-sm">
            {activeDay === 5
              ? 'عطلة أسبوعية رسمية. استمتع بوقتك مع عائلتك واستعد لأسبوع دراسي جديد!'
              : activeDay === 6 && !getActiveWeekDays().includes('السبت')
                ? 'يوم السبت إجازة. نتمنى لك عطلة نهاية أسبوع سعيدة!'
                : searchQuery
                  ? 'لم نتمكن من العثور على حصص تطابق بحثك في هذا اليوم.'
                  : 'لا يوجد حصص مجدولة لك في هذا اليوم. استمتع بوقتك!'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredSchedule.map((lesson, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={`group relative backdrop-blur-lg rounded-[32px] p-6 border shadow-sm transition-all duration-300 overflow-hidden
                ${lesson.isBreak || lesson.type === 'break'
                  ? 'bg-amber-50/80 border-amber-200/60 hover:shadow-md'
                  : 'bg-white/70 border-white/60 hover:shadow-xl hover:bg-white'
                }`}
            >
              {/* 🔥 إضافة: عرض مميز للفسحة */}
              {(lesson.isBreak || lesson.type === 'break') ? (
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-500 flex items-center justify-center text-2xl flex-shrink-0">☕</div>
                  <div>
                    <h3 className="font-black text-amber-800 text-lg">فسحة</h3>
                    <p className="text-xs font-bold text-amber-600 mt-1">{lesson.time || ''}</p>
                  </div>
                </div>
              ) : (              <div className="space-y-3.5 relative z-10">
                <div className="flex items-center gap-3 text-gray-600">
                  <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 border border-gray-100">
                    <Clock size={16} />
                  </div>
                  <div className="flex-1">
                    <p className="text-[11px] text-gray-400 font-medium mb-0.5">الوقت</p>
                    <p className="font-bold text-sm text-gray-800" dir="ltr">
                      {lesson.time || '-'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-gray-600">
                  <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 border border-gray-100">
                    <User size={16} />
                  </div>
                  <div className="flex-1">
                    <p className="text-[11px] text-gray-400 font-medium mb-0.5">المعلم</p>
                    <p className="font-bold text-sm text-gray-800 truncate">أ. {lesson.instructor || 'غير محدد'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-gray-600">
                  <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 border border-gray-100">
                    <MapPin size={16} />
                  </div>
                  <div className="flex-1">
                    <p className="text-[11px] text-gray-400 font-medium mb-0.5">المكان</p>
                    <p className="font-bold text-sm text-gray-800 truncate">{lesson.room || 'الفصل الدراسي'}</p>
                  </div>
                </div>
              </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ScheduleView;
ScheduleView.propTypes = { studentData: PropTypes.object.isRequired, searchQuery: PropTypes.string };
