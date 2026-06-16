import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, AlertTriangle, CheckCircle2, Calendar, Clock, CheckSquare } from 'lucide-react';
import { getGlobalMaster, isWorkingDay } from '../utils/dataManager';

const AdminSmartAttendance = () => {
  const [missedClasses, setMissedClasses] = useState([]);
  const [activeTab, setActiveTab] = useState('radar');
  const [gracePeriods, setGracePeriods] = useState(() => JSON.parse(localStorage.getItem('moo_grace_periods') || '[]'));
  const [isYesterdayHoliday, setIsYesterdayHoliday] = useState(false);

  useEffect(() => {
    const sync = () => {
      const allGraces = JSON.parse(localStorage.getItem('moo_grace_periods') || '[]');
      const today = new Date().toISOString().split('T')[0];

      // التنظيف التلقائي: الاحتفاظ فقط بفترات السماح الممنوحة اليوم
      const currentGraces = allGraces.filter(g => {
        if (!g.timeGranted) return false;
        const grantDate = g.timeGranted.split('T')[0];
        return grantDate === today;
      });

      if (allGraces.length !== currentGraces.length) {
        localStorage.setItem('moo_grace_periods', JSON.stringify(currentGraces));
      }

      setGracePeriods(currentGraces);
    };

    sync();
    window.addEventListener('storage', sync);
    window.addEventListener('moo-sync', sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener('moo-sync', sync);
    };
  }, []);

  const approveGracePeriod = (id) => {
    const updated = gracePeriods.filter(g => g.id !== id);
    localStorage.setItem('moo_grace_periods', JSON.stringify(updated));
    setGracePeriods(updated);
    window.dispatchEvent(new CustomEvent('moo-sync'));
  };

  const resendToTeacher = (id) => {
    const updated = gracePeriods.map(g => g.id === id ? { ...g, status: 'pending_teacher' } : g);
    localStorage.setItem('moo_grace_periods', JSON.stringify(updated));
    setGracePeriods(updated);
    window.dispatchEvent(new CustomEvent('moo-sync'));
  };

  const getYesterdayDateString = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  };

  const getYesterdayDayNameArabic = () => {
    const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return days[d.getDay()];
  };

  const parseTimeToDate = (timeStr) => {
    if (!timeStr) return new Date();
    const match = timeStr.match(/(\d+):(\d+)\s*(ص|م|AM|PM)/i);
    if (!match) return 0;
    let hours = parseInt(match[1]);
    const mins = parseInt(match[2]);
    const modifier = match[3]?.toLowerCase();
    if (modifier === 'pm' || modifier === 'م') { if (hours < 12) hours += 12; }
    else if (modifier === 'am' || modifier === 'ص') { if (hours === 12) hours = 0; }
    else { if (hours >= 1 && hours <= 6) hours += 12; }
    const t = new Date();
    t.setHours(hours, mins, 0, 0);
    return t;
  };

  const refreshRadar = () => {
    const master = getGlobalMaster();
    const globalSchedule = master.lessons || [];
    const yesterdayName = getYesterdayDayNameArabic();
    const yesterdayDate = getYesterdayDateString();

    if (!isWorkingDay(yesterdayDate)) {
      setIsYesterdayHoliday(true);
      setMissedClasses([]);
      return;
    }
    setIsYesterdayHoliday(false);

    const attendanceHistory = JSON.parse(localStorage.getItem('moo_attendance') || '{}');
    const allUsers = JSON.parse(localStorage.getItem('moo_users') || '[]');

    const yesterdayLessons = globalSchedule.filter(l =>
      l.day === yesterdayName && l.type !== 'break' && !l.isBreak
    );

    const missing = [];
    yesterdayLessons.forEach(lesson => {
      const classStudents = allUsers.filter(u => u.role === 'student' && (u.class === lesson.classCode || u.stage === lesson.classCode));
      if (classStudents.length === 0) return;
      const key = `${lesson.classCode}_${yesterdayDate}`;
      if (!attendanceHistory[key]) {
        missing.push({
          ...lesson,
          date: yesterdayDate
        });
      }
    });

    missing.sort((a, b) => parseTimeToDate(a.time) - parseTimeToDate(b.time));
    setMissedClasses(missing);
  };

  useEffect(() => {
    refreshRadar();
  }, []);

  const grantGracePeriod = (missedLesson) => {
    const gp = JSON.parse(localStorage.getItem('moo_grace_periods') || '[]');
    const newGrace = {
      id: Date.now().toString(),
      teacher: missedLesson.instructor,
      classCode: missedLesson.classCode,
      date: missedLesson.date,
      status: 'pending_teacher',
      timeGranted: new Date().toISOString()
    };
    gp.push(newGrace);
    localStorage.setItem('moo_grace_periods', JSON.stringify(gp));

    // إرسال إشعار للمعلم
    const notifs = JSON.parse(localStorage.getItem('moo_notifications') || '[]');
    notifs.push({
      id: Date.now().toString(),
      targetType: 'teacher',
      to: missedLesson.instructor,
      targetInstructor: missedLesson.instructor,
      title: 'سماح برصد غياب',
      content: `لقد منحتك الإدارة فترة سماح لرصد غياب حصة ${missedLesson.classCode} المتأخرة لتاريخ (${missedLesson.date}). يرجى رصد الغياب الآن.`,
      date: new Date().toISOString(),
      read: false
    });
    localStorage.setItem('moo_notifications', JSON.stringify(notifs));
    window.dispatchEvent(new Event('moo-sync'));

    refreshRadar();
    // تحديث القائمة المحلية
    setGracePeriods(JSON.parse(localStorage.getItem('moo_grace_periods') || '[]'));
    window.dispatchEvent(new CustomEvent('moo-toast', { detail: { message: 'تم الحفظ بنجاح.', type: 'success' } }));
  };

  const markAllPresent = (missedLesson) => {
    const attendanceHistory = JSON.parse(localStorage.getItem('moo_attendance') || '{}');
    const key = `${missedLesson.classCode}_${missedLesson.date}`;

    // تسجيل الكل كحاضرين
    attendanceHistory[key] = {};
    localStorage.setItem('moo_attendance', JSON.stringify(attendanceHistory));

    // إرسال إشعار للمعلم
    const notifs = JSON.parse(localStorage.getItem('moo_notifications') || '[]');
    notifs.push({
      id: Date.now().toString(),
      targetType: 'teacher',
      to: missedLesson.instructor,
      targetInstructor: missedLesson.instructor,
      title: 'إغلاق غياب حصة',
      content: `قامت الإدارة بإغلاق غياب حصة ${missedLesson.classCode} نيابة عنك لعدم رصده. يرجى الالتزام برصد الغياب يومياً.`,
      date: new Date().toISOString(),
      read: false
    });
    localStorage.setItem('moo_notifications', JSON.stringify(notifs));
    window.dispatchEvent(new Event('storage'));

    refreshRadar();
    window.dispatchEvent(new CustomEvent('moo-toast', { detail: { message: 'تم الحفظ بنجاح.', type: 'success' } }));
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-[40px] p-10 border border-gray-100 shadow-sm text-right">
      <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-3xl font-black text-gray-900 flex items-center gap-3 mb-2">
            <ShieldAlert className="text-blue-600" /> لوحة التحكم الذكية (رادار الغياب والاعتمادات)
          </h3>
          <p className="text-gray-500 font-bold">تتبع الحصص التي نسي المعلمون رصد غيابها، واعتمد تصحيحاتهم.</p>
        </div>
        <div className="flex bg-gray-100 p-1 rounded-2xl">
          <button onClick={() => setActiveTab('radar')} className={`px-6 py-3 rounded-xl font-black transition-all ${activeTab === 'radar' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}>رادار النواقص</button>
          <button onClick={() => setActiveTab('approvals')} className={`px-6 py-3 rounded-xl font-black transition-all flex items-center gap-2 ${activeTab === 'approvals' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}>
            قائمة الاعتماد
            {gracePeriods.filter(g => g.status === 'pending_admin').length > 0 && <span className="bg-rose-500 text-white text-xs px-2 py-0.5 rounded-full">{gracePeriods.filter(g => g.status === 'pending_admin').length}</span>}
          </button>
        </div>
      </div>

      {activeTab === 'radar' && (
        <div className="bg-rose-50/50 border border-rose-100 rounded-[32px] p-8">
          <h4 className="text-xl font-black text-rose-900 mb-6 flex items-center gap-3">
            <AlertTriangle className="text-rose-500" /> حصص منسية بالرادار (تحتاج تدخل إداري)
          </h4>

          {isYesterdayHoliday ? (
            <div className="bg-white/60 p-8 rounded-[24px] text-center border border-white">
              <Calendar className="text-emerald-500 mx-auto mb-4" size={48} />
              <p className="text-xl font-black text-gray-800">الأمس كان يوم إجازة رسمية (أو نهاية أسبوع)</p>
              <p className="text-sm text-gray-500 mt-2">لا توجد حصص منسية، الرادار لا يعمل ولا يُحاسب المعلمين في أيام العطلات.</p>
            </div>
          ) : missedClasses.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-[24px] border border-rose-50">
              <CheckCircle2 size={48} className="text-emerald-400 mx-auto mb-4" />
              <p className="text-emerald-700 font-black text-xl">الرادار نظيف!</p>
              <p className="text-emerald-600/70 font-bold mt-2">جميع المعلمين قاموا برصد الحضور اليوم وقبله.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {missedClasses.map((missed, idx) => {
                const hasGrace = gracePeriods.some(g => g.classCode === missed.classCode && g.date === missed.date && g.teacher === missed.instructor);

                return (
                  <div key={idx} className="bg-white p-6 rounded-[24px] border border-rose-100 flex flex-col md:flex-row justify-between items-center gap-4 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center font-black text-xl">
                        {missed.classCode}
                      </div>
                      <div>
                        <p className="font-black text-lg text-gray-900">{missed.subject} - المعلم: {missed.instructor}</p>
                        <p className="text-sm font-bold text-gray-500 mt-1 flex items-center gap-2">
                          <Calendar size={14} /> {missed.date}
                          <Clock size={14} className="ml-1" /> {missed.time}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 w-full md:w-auto">
                      {hasGrace ? (
                        <span className="bg-amber-50 text-amber-600 font-black px-6 py-3 rounded-xl border border-amber-200 flex items-center gap-2">
                          <Clock size={16} /> بانتظار رصد المعلم (فترة سماح)
                        </span>
                      ) : (
                        <>
                          <button onClick={() => grantGracePeriod(missed)} className="flex-1 md:flex-none bg-amber-50 text-amber-700 hover:bg-amber-100 px-6 py-3 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-2 border border-amber-200">
                            <CheckSquare size={16} /> منح فترة سماح
                          </button>
                          <button onClick={() => markAllPresent(missed)} className="flex-1 md:flex-none bg-rose-600 text-white hover:bg-rose-700 px-6 py-3 rounded-xl font-black text-sm transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2">
                            <CheckCircle2 size={16} /> اعتماد الكل كحاضرين
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'approvals' && (
        <div className="bg-emerald-50/50 border border-emerald-100 rounded-[32px] p-8">
          <h4 className="text-xl font-black text-emerald-900 mb-6 flex items-center gap-3">
            <CheckCircle2 className="text-emerald-500" /> غيابات بانتظار الاعتماد (قام المعلم بتسجيلها)
          </h4>

          {gracePeriods.filter(g => g.status === 'pending_admin').length === 0 ? (
            <div className="text-center py-12 bg-white rounded-[24px] border border-emerald-50">
              <CheckCircle2 size={48} className="text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-black text-xl">لا توجد طلبات اعتماد حالياً.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {gracePeriods.filter(g => g.status === 'pending_admin').map((grace, idx) => (
                <div key={idx} className="bg-white p-6 rounded-[24px] border border-emerald-200 flex flex-col md:flex-row justify-between items-center gap-4 shadow-sm hover:shadow-md transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center font-black text-xl">
                      {grace.classCode}
                    </div>
                    <div>
                      <p className="font-black text-lg text-gray-900">المعلم: {grace.teacher}</p>
                      <p className="text-sm font-bold text-gray-500 mt-1 flex items-center gap-2">
                        <Calendar size={14} /> تاريخ الغياب: {grace.date}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 w-full md:w-auto">
                    <button onClick={() => approveGracePeriod(grace.id)} className="flex-1 md:flex-none bg-emerald-600 text-white hover:bg-emerald-700 px-6 py-3 rounded-xl font-black text-sm transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2">
                      <CheckSquare size={16} /> اعتماد
                    </button>
                    <button onClick={() => resendToTeacher(grace.id)} className="flex-1 md:flex-none bg-rose-50 text-rose-700 hover:bg-rose-100 px-6 py-3 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-2 border border-rose-200">
                      <AlertTriangle size={16} /> إعادة للمعلم
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default AdminSmartAttendance;
