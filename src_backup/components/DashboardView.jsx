import { Calendar, Bell, Zap, TrendingUp, ArrowUpRight, Award, UserCircle, BookOpen, Clock, CheckCircle, Star, ShieldAlert, ShieldCheck } from 'lucide-react';
import { useMemo, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { getSubjectIcon } from '../utils/subjectIcon';
import { calculateStudentAttendance } from '../utils/dataManager';



const getExamClassKey = (exam) => {
  const stage = String(exam?.stage || '').trim();
  const classCode = String(exam?.classCode || '').trim();
  const stageParts = stage.split(' - ').map(part => part.trim()).filter(Boolean);
  if (stageParts.length > 1) return stage;
  return classCode ? `${stage} - ${classCode}` : stage;
};

const getExactExamDate = (exam) => {
  if (exam.date) return new Date(exam.date);
  const createdAtTime = Number(exam.id);
  if (createdAtTime > 1600000000000) {
    const createdDate = new Date(createdAtTime);
    const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    const createdDayIndex = createdDate.getDay();
    const examDayIndex = days.indexOf(exam.day);
    if (examDayIndex !== -1) {
      let daysToAdd = (examDayIndex - createdDayIndex + 7) % 7;
      return new Date(createdDate.getFullYear(), createdDate.getMonth(), createdDate.getDate() + daysToAdd);
    }
  }
  return null;
};

const DashboardView = ({ studentData, searchQuery, onNavigateToSchedule }) => {

  // ✅ الـ state أولاً قبل أي useMemo يستخدمها
  const [currentTime, setCurrentTime] = useState(new Date());
  const [globalExams, setGlobalExams] = useState(() => {
    try { return JSON.parse(localStorage.getItem('moo_tests') || localStorage.getItem('exams') || '[]'); } catch { return []; }
  });
  const getAcademicLessons = () => {
    try { return JSON.parse(localStorage.getItem('GLOBAL_ACADEMIC_MASTER') || '{}').lessons || []; } catch { return []; }
  };
  const [academicLessons, setAcademicLessons] = useState(getAcademicLessons);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    const handleStorage = () => {
      try { setGlobalExams(JSON.parse(localStorage.getItem('moo_tests') || localStorage.getItem('exams') || '[]')); } catch { }
      setAcademicLessons(getAcademicLessons());
    };
    window.addEventListener('storage', handleStorage);
    window.addEventListener('moo-sync', handleStorage);
    return () => {
      clearInterval(timer);
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('moo-sync', handleStorage);
    };
  }, []);

  // ✅ إصلاح 2+3: جدول اليوم من GLOBAL_ACADEMIC_MASTER مباشرة
  const filteredSchedule = useMemo(() => {
    const ARABIC_DAYS = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    const todayName = ARABIC_DAYS[new Date().getDay()];
    const studentClass = studentData?.personal?.class;
    let lessons = academicLessons.filter(l =>
      l.day === todayName &&
      l.classCode === studentClass &&
      l.type !== 'break' && !l.isBreak
    );
    if (searchQuery?.trim()) {
      lessons = lessons.filter(l =>
        l.subject?.includes(searchQuery) || l.instructor?.includes(searchQuery)
      );
    }
    return lessons;
  }, [academicLessons, studentData?.personal?.class, searchQuery]);

  const nextClassData = useMemo(() => {
    const ARABIC_DAYS = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    const todayName = ARABIC_DAYS[new Date().getDay()];
    const studentClass = studentData?.personal?.class;
    const studentId = studentData?.personal?.id;

    const parseTime = (timeStr) => {
      if (!timeStr) return 0;
      const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM|am|pm|ص|م)?/);
      if (!match) return 0;
      let hours = parseInt(match[1]);
      const mins = parseInt(match[2]);
      const modifier = match[3]?.toLowerCase();
      if (modifier === 'pm' || modifier === 'م') { if (hours < 12) hours += 12; }
      else if (modifier === 'am' || modifier === 'ص') { if (hours === 12) hours = 0; }
      else { if (hours >= 1 && hours <= 6) hours += 12; }
      const t = new Date();
      t.setHours(hours, mins, 0, 0);
      return t.getTime();
    };

    const nowTime = currentTime.getTime();

    // 🔥 فحص الاختبارات الجارية الآن
    const currentExam = globalExams.find(ex => {
      const exClass = ex.classCode || ex.stage || '';
      if (exClass !== studentClass && ex.stage !== studentClass) return false;
      
      const exactDate = getExactExamDate(ex);
      if (exactDate) {
        const todayDate = new Date(currentTime.getFullYear(), currentTime.getMonth(), currentTime.getDate());
        const eDate = new Date(exactDate.getFullYear(), exactDate.getMonth(), exactDate.getDate());
        if (todayDate.getTime() !== eDate.getTime()) return false;
      } else {
        if (ex.day !== todayName) return false;
      }
      
      const startTime = parseTime(ex.time);
      const endTime = startTime + (ex.duration || 60) * 60000;
      
      return nowTime >= startTime && nowTime <= endTime;
    });

    if (currentExam) {
      const examsInProgress = JSON.parse(localStorage.getItem('moo_exams_in_progress') || '{}');
      const currentExamStatus = examsInProgress[currentExam.id];
      
      const startTime = parseTime(currentExam.time);
      const endTime = startTime + (currentExam.duration || 60) * 60000;
      const remainingMinutes = Math.ceil((endTime - nowTime) / 60000);

      // إذا كان الطالب أنهى الإجابات، عرض "تمت العملية بنجاح"
      if (currentExamStatus?.completedStudents?.includes(studentId)) {
        return {
          name: currentExam.title,
          subject: currentExam.subject || currentExam.title,
          instructor: currentExam.teacherName || currentExam.instructor,
          time: currentExam.time,
          room: 'عبر المنصة',
          type: 'exam',
          isOnline: true,
          isCurrentExam: true,
          examStatus: 'completed',
          statusMessage: 'تمت العملية بنجاح ✅',
          statusColor: 'emerald',
          diffMinutes: remainingMinutes,
          id: currentExam.id,
        };
      }

      // الاختبار جاري
      return {
        name: currentExam.title,
        subject: currentExam.subject || currentExam.title,
        instructor: currentExam.teacherName || currentExam.instructor,
        time: currentExam.time,
        room: 'عبر المنصة',
        type: 'exam',
        isOnline: true,
        isCurrentExam: true,
        examStatus: 'active',
        statusMessage: 'مازال الاختبار قائم ⏱️',
        statusColor: 'orange',
        diffMinutes: remainingMinutes,
        id: currentExam.id,
      };
    }

    // ✅ إصلاح 2+3: مصدر واحد — GLOBAL_ACADEMIC_MASTER
    const todayLessons = academicLessons
      .filter(l =>
        l.day === todayName &&
        l.classCode === studentClass &&
        l.type !== 'break' && !l.isBreak
      )
      .map(l => ({
        name: l.subject,
        subject: l.subject,
        instructor: l.instructor,
        time: l.time,
        room: l.room,
        type: 'lesson',
        id: l.id,
      }));

    // اختبارات اليوم من moo_tests (المستقبلية)
    const myExams = globalExams
      .filter(ex => {
        const exClass = ex.classCode || ex.stage || '';
        if (exClass !== studentClass && ex.stage !== studentClass) return false;
        
        const exactDate = getExactExamDate(ex);
        if (exactDate) {
          const todayDate = new Date(currentTime.getFullYear(), currentTime.getMonth(), currentTime.getDate());
          const eDate = new Date(exactDate.getFullYear(), exactDate.getMonth(), exactDate.getDate());
          if (todayDate.getTime() !== eDate.getTime()) return false;
        } else {
          if (ex.day !== todayName) return false;
        }
        
        const startTime = parseTime(ex.time);
        return startTime > nowTime;
      })
      .map(ex => {
        const startTime = parseTime(ex.time);
        const daysUntilExam = Math.ceil((startTime - nowTime) / (1000 * 60 * 60 * 24));
        const hoursUntilExam = Math.ceil((startTime - nowTime) / (1000 * 60 * 60));
        
        // تغيير اللون بناءً على القرب من الاختبار
        let colorIntensity = 'blue';
        if (hoursUntilExam <= 1) colorIntensity = 'red';
        else if (hoursUntilExam <= 6) colorIntensity = 'orange';
        else if (hoursUntilExam <= 24) colorIntensity = 'amber';

        return {
          name: ex.title,
          subject: ex.subject || ex.title,
          instructor: ex.teacherName || ex.instructor,
          time: ex.time,
          room: 'عبر المنصة',
          type: 'exam',
          isOnline: true,
          isUpcomingExam: true,
          colorIntensity,
          id: ex.id,
        };
      });

    const daySchedule = [...todayLessons, ...myExams];
    if (daySchedule.length === 0) return null;

    let upcoming = null;
    let minDiff = Infinity;
    for (const lesson of daySchedule) {
      const lt = parseTime(lesson.time);
      if (lt > nowTime && (lt - nowTime) < minDiff) {
        minDiff = lt - nowTime;
        upcoming = lesson;
      }
    }
    if (!upcoming) return null;
    return { ...upcoming, diffMinutes: Math.ceil(minDiff / 60000) };
  }, [academicLessons, globalExams, studentData?.personal?.class, studentData?.personal?.id, currentTime]);

  // ✅ ميزة جديدة: أقرب اختبار قادم
  const nextExam = useMemo(() => {
    const studentClass = studentData?.personal?.class;
    const upcomingExams = globalExams
      .filter(ex => (ex.classCode === studentClass || ex.stage === studentClass))
      .map(ex => {
         const exactDate = getExactExamDate(ex);
         let timeValue = 0;
         if (exactDate) {
            const timeMatch = String(ex.time || '').match(/(\d+):(\d+)\s*(AM|PM|am|pm|ص|م)?/);
            let hours = 0, mins = 0;
            if (timeMatch) {
               hours = parseInt(timeMatch[1], 10);
               mins = parseInt(timeMatch[2], 10);
               const mod = timeMatch[3]?.toLowerCase();
               if ((mod === 'pm' || mod === 'م') && hours < 12) hours += 12;
               else if ((mod === 'am' || mod === 'ص') && hours === 12) hours = 0;
               else if (!mod && hours >= 1 && hours <= 6) hours += 12;
            }
            const fullDate = new Date(exactDate.getFullYear(), exactDate.getMonth(), exactDate.getDate(), hours, mins);
            timeValue = fullDate.getTime();
         }
         return { ...ex, exactTime: timeValue };
      })
      .filter(ex => ex.exactTime > Date.now())
      .sort((a, b) => a.exactTime - b.exactTime);
      
    return upcomingExams[0] || null;
  }, [globalExams, studentData?.personal?.class]);

  const [attendanceTrigger, setAttendanceTrigger] = useState(0);
  useEffect(() => {
    const handleStorage = () => setAttendanceTrigger(prev => prev + 1);
    window.addEventListener('storage', handleStorage);
    window.addEventListener('moo-sync', handleStorage);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('moo-sync', handleStorage);
    }
  }, []);

  // ✅ ميزة جديدة: نسبة إنجاز اليوم مع أخذ الغياب في الاعتبار
  const todayProgress = useMemo(() => {
    const ARABIC_DAYS = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    const todayName = ARABIC_DAYS[new Date().getDay()];
    const studentClass = studentData?.personal?.class;
    const studentId = studentData?.personal?.id;

    const todayLessons = academicLessons.filter(l =>
      l.day === todayName && l.classCode === studentClass && l.type !== 'break' && !l.isBreak
    );
    if (todayLessons.length === 0) return null;

    const nowMins = new Date().getHours() * 60 + new Date().getMinutes();
    const todayDateStr = new Date().toISOString().split('T')[0];

    // 🔥 موحّد: نقرأ من moo_attendance الفعلي (سجل اليوم للفصل) بدل moo_attendance_records غير الموجود
    let classRecords = {};
    try { classRecords = JSON.parse(localStorage.getItem('moo_attendance') || '{}'); } catch {}
    const todayRecord = classRecords[`${studentClass}_${todayDateStr}`] || {};
    const isAbsentToday = todayRecord[studentId] === 'غائب';

    // عدد الحصص التي مضى وقتها اليوم
    const passedLessons = todayLessons.filter(l => {
      const [h, m] = (l.time || '00:00').split(':').map(Number);
      return (h * 60 + m) < nowMins;
    });

    // إن سُجّل غائباً اليوم، لا تُحتسب الحصص الماضية كإنجاز
    const done = isAbsentToday ? 0 : passedLessons.length;
    const absentCount = isAbsentToday ? passedLessons.length : 0;

    return { done, total: todayLessons.length, absentCount };

  }, [academicLessons, studentData?.personal?.class, studentData?.personal?.id, currentTime, attendanceTrigger]);


  // 🔥 موحّد: يعتمد كلياً على الدالة المركزية calculateStudentAttendance في dataManager
  const attendanceEngine = useMemo(() => {
    const greenColors = { text: 'text-emerald-500', bgGlow: 'bg-emerald-400/20', bgBox: 'bg-emerald-50/50', borderBox: 'border-emerald-100/50', textValue: 'text-emerald-600' };
    try {
      const studentId = studentData?.personal?.id;
      const stat = calculateStudentAttendance(studentId);

      let colors = greenColors;
      if (stat.total > 0) {
        if (stat.percentage < 70) {
          colors = { text: 'text-orange-500', bgGlow: 'bg-orange-400/20', bgBox: 'bg-orange-50/50', borderBox: 'border-orange-100/50', textValue: 'text-orange-600' };
        } else if (stat.percentage < 90) {
          colors = { text: 'text-sky-500', bgGlow: 'bg-sky-400/20', bgBox: 'bg-sky-50/50', borderBox: 'border-sky-100/50', textValue: 'text-sky-600' };
        }
      }

      return {
        percentage: stat.percentage,
        total: stat.total,
        present: stat.present,
        absent: stat.absent,
        truancy: stat.truancy,
        morningStatus: stat.morningStatus,
        isExempted: stat.isExempted,
        isYoungExempted: stat.isYoungExempted,
        isTodayHoliday: stat.isTodayHoliday,
        colors,
      };
    } catch (error) {
      console.error("Attendance Calculation Error", error);
      return {
        percentage: 100, total: 0, present: 0, absent: 0, truancy: 0,
        morningStatus: 'pending', isExempted: false, isYoungExempted: false,
        colors: greenColors,
      };
    }
  }, [studentData?.personal?.id, attendanceTrigger]);


  const gpaData = useMemo(() => {
    try {
      const studentId = studentData?.personal?.id;
      const studentClass = studentData?.personal?.class;
      const defaultGray = { percentage: 0, text: 'لم تخض أي اختبارات بعد', color: 'gray', from: 'from-gray-400', to: 'to-gray-500', bgLight: 'rgba(249,250,251,0.3)', bgAccent: 'rgba(156,163,175,0.2)', iconColor: '#9ca3af', textDark: '#4b5563', borderColor: '#e5e7eb' };
      
      if (!studentId || !studentClass) return defaultGray;

      const realGrades = JSON.parse(localStorage.getItem('moo_grades') || '{}');
      const t1 = JSON.parse(localStorage.getItem('moo_tests') || '[]');
      const t2 = JSON.parse(localStorage.getItem('exams') || '[]');
      const onlineExams = [...t1, ...t2];

      const liveSubjects = [];
      Object.entries(realGrades).forEach(([key, gradesMap]) => {
        const [cls, subject, semester] = key.split('__');
        if (cls !== studentClass) return;
        const score = gradesMap[studentId];
        if (score === undefined || score === '') return;
        liveSubjects.push({ name: subject, percentage: Number(score) });
      });

      onlineExams.forEach(exam => {
        const exClass = exam.classCode || exam.stage || '';
        if (exClass !== studentClass && exam.stage !== studentClass) return;
        const report = exam.reports?.find(r => r.studentId === studentId);
        if (report && report.status === 'submitted') {
          const pct = (report.score / report.total) * 100;
          const examName = exam.subject || exam.title;
          if (!liveSubjects.find(s => s.name === examName)) {
            liveSubjects.push({ name: examName, percentage: pct });
          }
        }
      });

      const uniqueSubjects = [];
      const seenNames = new Set();
      for (const sub of liveSubjects) {
        if (!seenNames.has(sub.name)) {
          seenNames.add(sub.name);
          uniqueSubjects.push(sub);
        }
      }

      if (uniqueSubjects.length === 0) return defaultGray;

      const avg = uniqueSubjects.reduce((sum, s) => sum + s.percentage, 0) / uniqueSubjects.length;
      const percentage = Math.round(avg);

      let color, text, from, to, bgLight, bgAccent, iconColor, textDark, borderColor;

      if (percentage >= 90) { color = 'emerald'; text = 'أداء عبقري! استمر في القمة'; from = 'from-emerald-400'; to = 'to-emerald-600'; bgLight = 'rgba(240,253,244,0.3)'; bgAccent = 'rgba(74,222,128,0.2)'; iconColor = '#22c55e'; textDark = '#16a34a'; borderColor = '#bbf7d0'; }
      else if (percentage >= 75) { color = 'blue'; text = 'جيد جداً، أنت في الطريق الصحيح'; from = 'from-blue-400'; to = 'to-blue-600'; bgLight = 'rgba(239,246,255,0.3)'; bgAccent = 'rgba(96,165,250,0.2)'; iconColor = '#3b82f6'; textDark = '#2563eb'; borderColor = '#bfdbfe'; }
      else if (percentage >= 50) { color = 'amber'; text = 'أداء متوسط، تحتاج للمزيد من التركيز'; from = 'from-amber-400'; to = 'to-orange-500'; bgLight = 'rgba(255,251,235,0.3)'; bgAccent = 'rgba(251,191,36,0.2)'; iconColor = '#f59e0b'; textDark = '#d97706'; borderColor = '#fde68a'; }
      else { color = 'red'; text = 'انتبه! تحتاج لمضاعفة مجهودك بشدة'; from = 'from-red-400'; to = 'to-red-600'; bgLight = 'rgba(254,242,242,0.3)'; bgAccent = 'rgba(248,113,113,0.2)'; iconColor = '#ef4444'; textDark = '#dc2626'; borderColor = '#fecaca'; }

      return { percentage, text, color, from, to, bgLight, bgAccent, iconColor, textDark, borderColor };
    } catch {
      return { percentage: 0, text: 'لم تخض أي اختبارات بعد', color: 'gray', from: 'from-gray-400', to: 'to-gray-500', bgLight: 'rgba(249,250,251,0.3)', bgAccent: 'rgba(156,163,175,0.2)', iconColor: '#9ca3af', textDark: '#4b5563', borderColor: '#e5e7eb' };
    }
  }, [studentData?.personal?.id, studentData?.personal?.class]);

  const dynamicPoints = useMemo(() => {
    if (studentData?.academics?.points) return studentData.academics.points;
    const gpaVal = gpaData.percentage || 0;
    const attVal = attendanceEngine.percentage || 0;
    if (gpaVal === 0 && attVal === 0) return 0;
    return Math.round((gpaVal * 10) + (attVal * 5));
  }, [studentData?.academics?.points, gpaData.percentage, attendanceEngine.percentage]);

  const behaviorLogs = useMemo(() => {
    return JSON.parse(localStorage.getItem('moo_behavior_logs') || '{}')[studentData?.personal?.id] || [];
  }, [studentData?.personal?.id]);

  const behaviorScore = useMemo(() => {
    return 100 + behaviorLogs.reduce((sum, log) => sum + log.points, 0);
  }, [behaviorLogs]);

  const importantNotifications = useMemo(() => {
    const alerts = [];
    
    // 1. Attendance Alert
    if (attendanceEngine.percentage < 50) {
      alerts.push({
        id: 'low_attendance',
        icon: '⚠️',
        title: 'تنبيه: نسبة الحضور منخفضة',
        description: `نسبة حضورك الحالية (${attendanceEngine.percentage}%) أقل من الحد المسموح. يرجى الانتظام لتجنب الحرمان.`,
        bgColor: 'bg-red-50 text-red-500 border-red-100',
        textColor: 'text-red-700',
        iconColor: 'text-red-600'
      });
    }

    if (attendanceEngine.truancy > 0) {
      alerts.push({
        id: 'truancy_alert',
        icon: '🚨',
        title: 'إنذار: هروب من الحصص',
        description: `تم رصد تهربك من (${attendanceEngine.truancy}) حصص بعد دخولك من البوابة. سيتم إبلاغ ولي الأمر حالاً.`,
        bgColor: 'bg-red-50 text-red-700 border-red-200',
        textColor: 'text-red-800',
        iconColor: 'text-red-600 animate-pulse'
      });
    }

    // 2. Admin Announcements
    let generalNotifs = [];
    try { generalNotifs = JSON.parse(localStorage.getItem('moo_notifications') || '[]'); } catch { generalNotifs = []; }
    const myClass = studentData?.personal?.class || studentData?.personal?.stage;
    generalNotifs.forEach(n => {
      if (n.targetClass && myClass && n.targetClass !== myClass) return;
      if (n.title?.includes('إجازة') || n.title?.includes('عطلة') || n.title?.includes('تحديث') || n.type === 'admin') {
        alerts.push({
          id: n.id,
          icon: '📢',
          title: n.title,
          description: n.message || n.description,
          bgColor: 'bg-blue-50 text-blue-500 border-blue-100',
          textColor: 'text-blue-700',
          iconColor: 'text-blue-600'
        });
      }
    });

    // 3. New Exams added recently
    let allExams = [];
    try { allExams = JSON.parse(localStorage.getItem('exams') || '[]'); } catch { allExams = []; }
    const recentExams = allExams.filter(ex => {
      const addedTime = Number(ex.id);
      if (!isNaN(addedTime) && addedTime > 1600000000000) {
         return (Date.now() - addedTime) < (48 * 60 * 60 * 1000);
      }
      return false;
    });

    recentExams.forEach(ex => {
      alerts.push({
        id: `new_exam_${ex.id}`,
        icon: '📝',
        title: `اختبار جديد: ${ex.title}`,
        description: `أضاف المعلم اختباراً جديداً لمادة ${ex.subject}. لا تفوت موعده!`,
        bgColor: 'bg-emerald-50 text-emerald-500 border-emerald-100',
        textColor: 'text-emerald-700',
        iconColor: 'text-emerald-600'
      });
    });

    return alerts.slice(0, 4); // Show top 4
  }, [attendanceEngine.percentage, studentData]);

  return (
    <div className="space-y-8 pb-10">

      {/* 🌟 Welcome & ID Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Main Welcome Card */}
        <div className="lg:col-span-2 glass-card p-8 rounded-[40px] relative overflow-hidden group hover-glow border border-white/60">
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-gradient-to-br from-primary/20 to-blue-400/20 rounded-full blur-[60px] group-hover:scale-150 transition-transform duration-700" />
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-gradient-to-tr from-yellow-300/20 to-pink-300/20 rounded-full blur-[60px] group-hover:scale-150 transition-transform duration-700 delay-100" />

          <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/50 border border-white/50 mb-4 shadow-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-bold text-gray-500 tracking-widest uppercase">متصل الآن</span>
              </div>
              <h1 className="text-4xl font-bold text-gray-800 leading-tight">
                مرحباً بك، <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-600">
                  {studentData?.personal?.name?.split(' ')[0] || 'طالبنا'}
                </span>
              </h1>
              <p className="text-gray-500 mt-4 font-medium text-sm max-w-md">
                لقد أنجزت 80% من مهامك الأسبوعية. استمر في هذا الأداء الرائع لتحقيق أهدافك الأكاديمية!
              </p>
            </div>

            {/* Smart ID Card Mini */}
            <div className="w-full sm:w-auto bg-white/40 p-1 rounded-3xl border border-white/60 shadow-lg backdrop-blur-md">
              <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 text-center text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMDUiLz4KPC9zdmc+')] opacity-20" />
                <UserCircle size={40} className="mx-auto mb-3 text-royal-gold opacity-80" />
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">الرقم الأكاديمي</p>
                <p className="text-lg font-bold font-mono tracking-wider text-royal-gold">{studentData?.personal?.id || 'AWS-2024-XXXX'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Next Class Engine UI - Updated with Exam States */}
        {nextClassData ? (
          <div className={`glass-card p-8 rounded-[40px] relative overflow-hidden group border transition-all duration-500 ${
            nextClassData.isCurrentExam 
              ? nextClassData.examStatus === 'completed' 
                ? 'border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.3)] bg-gradient-to-b from-emerald-50 to-transparent' 
                : 'border-orange-500 shadow-[0_0_30px_rgba(249,115,22,0.4)] animate-pulse bg-gradient-to-b from-orange-50 to-transparent'
              : nextClassData.diffMinutes <= 5 
              ? 'border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.4)] animate-pulse bg-gradient-to-b from-red-50 to-transparent' 
              : 'border-white/60 hover-glow bg-gradient-to-b from-primary/5 to-transparent'
          }`}>
            <div className={`absolute top-4 right-4 w-12 h-12 rounded-2xl shadow-sm flex items-center justify-center transition-transform group-hover:rotate-12 ${
              nextClassData.isCurrentExam 
                ? nextClassData.examStatus === 'completed' 
                  ? 'bg-emerald-500 text-white' 
                  : 'bg-orange-500 text-white'
                : nextClassData.diffMinutes <= 5 
                ? 'bg-red-500 text-white' 
                : 'bg-white text-primary'
            }`}>
              {nextClassData.isCurrentExam && nextClassData.examStatus === 'completed' ? '✅' : <Clock size={24} />}
            </div>
            <div className="mt-6 relative z-10">
              <p className={`text-xs font-bold uppercase tracking-widest mb-2 ${
                nextClassData.isCurrentExam 
                  ? nextClassData.examStatus === 'completed' 
                    ? 'text-emerald-500' 
                    : 'text-orange-500'
                  : nextClassData.diffMinutes <= 5 
                  ? 'text-red-500' 
                  : 'text-gray-400'
              }`}>
                {nextClassData.isCurrentExam ? (nextClassData.examStatus === 'completed' ? '✅ تمت العملية' : '⏱️ الاختبار جاري') : 'الحصة القادمة'}
              </p>
              <h3 className="text-2xl font-black text-gray-900 mb-2">{nextClassData.name || nextClassData.subject}</h3>
              <p className={`text-sm font-bold flex items-center gap-2 mb-6 ${
                nextClassData.isCurrentExam 
                  ? nextClassData.examStatus === 'completed' 
                    ? 'text-emerald-600' 
                    : 'text-orange-600'
                  : nextClassData.diffMinutes <= 5 
                  ? 'text-red-600' 
                  : 'text-primary'
              }`}>
                {nextClassData.isCurrentExam && nextClassData.examStatus === 'completed' 
                  ? '✅ ' + nextClassData.statusMessage 
                  : nextClassData.isCurrentExam && nextClassData.examStatus === 'active'
                  ? '⏱️ ' + nextClassData.statusMessage
                  : `في غضون ${nextClassData.diffMinutes} دقيقة`
                }
              </p>
              {(nextClassData.type === 'exam' && nextClassData.isOnline) || nextClassData.isCurrentExam ? (
                <p className={`text-[11px] font-bold px-3 py-1 rounded-full inline-block mb-4 border ${
                  nextClassData.isCurrentExam 
                    ? nextClassData.examStatus === 'completed'
                      ? 'text-emerald-600 bg-emerald-50 border-emerald-100'
                      : 'text-orange-600 bg-orange-50 border-orange-100'
                    : 'text-blue-600 bg-blue-50 border-blue-100'
                }`}>
                  اختبار أونلاين
                </p>
              ) : null}

              {nextClassData.isCurrentExam && nextClassData.examStatus === 'active' && (
                <button onClick={() => {
                   window.dispatchEvent(new CustomEvent('moo-navigate', { detail: 'exams' }));
                }} className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-4 rounded-xl mb-4 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-orange-500/30 hover:-translate-y-0.5">
                  دخول الاختبار الآن
                </button>
              )}
              <div className="flex items-center gap-3 p-4 bg-white/70 backdrop-blur-md rounded-2xl border border-white shadow-sm">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${
                  nextClassData.isCurrentExam 
                    ? nextClassData.examStatus === 'completed'
                      ? 'bg-emerald-100 text-emerald-600'
                      : 'bg-orange-100 text-orange-600'
                    : nextClassData.diffMinutes <= 5 
                    ? 'bg-red-100 text-red-500' 
                    : 'bg-primary/10 text-primary'
                }`}>
                  {getSubjectIcon(nextClassData.name || nextClassData.subject)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-gray-900 truncate">{nextClassData.room || 'تحدد لاحقاً'}</p>
                  <p className="text-[10px] text-gray-500 font-bold truncate">{nextClassData.instructor || 'المعلم'}</p>
                </div>
                <div className="text-left shrink-0">
                  <p className="text-xs font-bold text-gray-800 tabular-nums">{String(nextClassData.time || '--:--').split('-')[0].trim()}</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="glass-card p-8 rounded-[40px] relative overflow-hidden group hover-glow border border-white/60 bg-gradient-to-br from-emerald-50 to-teal-50 flex flex-col items-center justify-center text-center">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 mix-blend-overlay"></div>
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-3xl shadow-lg mb-4 text-emerald-500 relative z-10">
              <Award size={32} />
            </div>
            <h3 className="text-xl font-bold text-emerald-800 mb-2 relative z-10">انتهت حصص اليوم!</h3>
            <p className="text-xs font-bold text-emerald-600/80 relative z-10 max-w-[200px]">
              راجع دروسك بجد وقم بإنجاز واجباتك لتكون دائماً في القمة.
            </p>
          </div>
        )}

      </div>

      {/* ✅ ميزة جديدة: شريط الإنجاز اليومي والاختبار القادم */}
      {(todayProgress || nextExam) && (
        <div className={`grid grid-cols-1 ${todayProgress && nextExam ? 'md:grid-cols-2' : ''} gap-4`}>
          {todayProgress && (
            <div className="glass-card p-5 rounded-[28px] border border-white/60 flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                <BookOpen size={24} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest">إنجاز اليوم</p>
                  {todayProgress.absentCount > 0 && (
                    <span className="text-[10px] font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                      غياب: {todayProgress.absentCount} حصص
                    </span>
                  )}
                </div>
                <p className="font-black text-gray-900 text-lg">{todayProgress.done} من {todayProgress.total} حصص</p>
                <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${todayProgress.absentCount > 0 ? 'bg-orange-500' : 'bg-primary'}`} style={{ width: `${Math.round((todayProgress.done / todayProgress.total) * 100)}%` }} />
                </div>
              </div>
              <span className={`text-2xl font-black shrink-0 ${todayProgress.absentCount > 0 ? 'text-orange-500' : 'text-primary'}`}>{Math.round((todayProgress.done / todayProgress.total) * 100)}%</span>
            </div>
          )}
          {nextExam && (
            <div className="glass-card p-5 rounded-[28px] border border-orange-200/60 bg-orange-50/40 flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-orange-100 flex items-center justify-center shrink-0 text-2xl">📝</div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black text-orange-400 uppercase tracking-widest mb-1">اختبار قادم</p>
                <p className="font-black text-gray-900 truncate">{nextExam.title}</p>
                <p className="text-xs font-bold text-gray-500 mt-1">{nextExam.day} — {nextExam.time} — {nextExam.duration} دقيقة</p>
              </div>
              <span className="shrink-0 px-3 py-1.5 bg-orange-100 text-orange-600 text-xs font-black rounded-xl border border-orange-200">
                {nextExam.teacherName || nextExam.instructor || 'المعلم'}
              </span>
            </div>
          )}
        </div>
      )}

      {/* 🌟 Premium Stats & GPA Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 sm:gap-6">

        {/* Luxury GPA Card (Takes 2 columns) */}
        <div className="md:col-span-2 lg:col-span-2 xl:col-span-2 glass-card p-6 sm:p-8 rounded-[40px] relative overflow-hidden group hover-glow border border-white/60" style={{ background: `linear-gradient(135deg, ${gpaData.bgLight || 'rgba(240,253,244,0.3)'}, transparent)` }}>
          <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full blur-3xl transition-all duration-700" style={{ background: gpaData.bgAccent || 'rgba(74,222,128,0.2)' }} />
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-2">
                  <TrendingUp size={14} style={{ color: gpaData.iconColor || '#22c55e' }} />
                  المعدل التراكمي الشامل
                </p>
                <div className="flex items-center gap-3">
                  <h3 className={`text-4xl sm:text-5xl font-black tabular-nums text-transparent bg-clip-text bg-gradient-to-r ${gpaData.from} ${gpaData.to}`}>
                    {gpaData.percentage}%
                  </h3>
                  {gpaData.percentage === 100 && (
                    <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center animate-bounce shadow-lg border border-yellow-200" title="العلامة الكاملة!">
                      <Award size={20} className="text-yellow-600" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-4">
              <div className="w-full bg-gray-100/80 rounded-full h-3 mb-2 overflow-hidden shadow-inner border border-white">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${gpaData.from} ${gpaData.to} shadow-[0_0_15px_rgba(0,0,0,0.1)] transition-all duration-1000 ease-out`}
                  style={{ width: `${gpaData.percentage}%` }}
                />
              </div>
              <p className="text-xs font-bold inline-block px-3 py-1 rounded-lg" style={{ color: gpaData.textDark || '#16a34a', background: gpaData.bgLight || 'rgba(240,253,244,0.5)', border: `1px solid ${gpaData.borderColor || 'rgba(187,247,208,1)'}` }}>
                {gpaData.text}
              </p>
            </div>
          </div>
        </div>

        {/* Attendance Smart Card (1 Column) */}
        <div className="md:col-span-1 lg:col-span-1 xl:col-span-1 glass-card p-6 rounded-[40px] hover-glow border border-white/60 relative overflow-hidden group flex flex-col justify-between items-center">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 w-full text-right flex items-center gap-2">
            <Calendar size={14} className={attendanceEngine.colors.text} /> نسبة الحضور
          </p>

          {/* Circular Progress Bar */}
          <div className="relative w-20 h-20 flex items-center justify-center mb-2">
            <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-gray-100" />
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={`${2 * Math.PI * 40}`}
                strokeDashoffset={`${2 * Math.PI * 40 * (1 - attendanceEngine.percentage / 100)}`}
                className={`${attendanceEngine.colors.text} transition-all duration-1000 ease-out`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center flex-col">
              <span className={`text-xl font-black ${attendanceEngine.colors.textValue} drop-shadow-sm`}>{attendanceEngine.percentage}%</span>
            </div>
            {/* Glow Effect */}
            <div className={`absolute inset-0 rounded-full ${attendanceEngine.colors.bgGlow} blur-xl -z-10 opacity-50 group-hover:opacity-100 transition-opacity duration-500`} />
          </div>

          {/* Morning Status / Exemption */}
          {attendanceEngine.isTodayHoliday ? (
            <div className="bg-emerald-100 text-emerald-700 text-[10px] px-3 py-1 rounded-full font-black tracking-wide mb-3 flex items-center gap-1 border border-emerald-200">
               <Calendar size={12} /> عطلة رسمية
            </div>
          ) : attendanceEngine.isExempted ? (
            <div className="bg-amber-100 text-amber-700 text-[10px] px-3 py-1 rounded-full font-black tracking-wide mb-3 flex items-center gap-1 border border-amber-200" title="استثناء شامل (مستمع / معفى بالكامل)">
              <ShieldAlert size={12} /> مستثنى
            </div>
          ) : attendanceEngine.isYoungExempted ? (
            <div className="bg-blue-100 text-blue-700 text-[10px] px-3 py-1 rounded-full font-black tracking-wide mb-3 flex items-center gap-1 border border-blue-200" title="طالب صغير (يكفي حضور حصتين)">
              <CheckCircle size={12} /> طالب صغير (مستثنى)
            </div>
          ) : attendanceEngine.morningStatus === 'present' ? (
            <div className="bg-emerald-100 text-emerald-700 text-[10px] px-3 py-1 rounded-full font-black tracking-wide mb-3 flex items-center gap-1 border border-emerald-200">
              <CheckCircle size={12} /> مسجل حضور
            </div>
          ) : attendanceEngine.morningStatus === 'absent' ? (
            <div className="bg-rose-100 text-rose-700 text-[10px] px-3 py-1 rounded-full font-black tracking-wide mb-3 flex items-center gap-1 border border-rose-200" title="غائب عن طابور الصباح">
              <Bell size={12} /> غائب اليوم
            </div>
          ) : (
            <div className="bg-blue-100 text-blue-700 text-[10px] px-3 py-1 rounded-full font-black tracking-wide mb-3 flex items-center gap-1 border border-blue-200" title="نظام التجميع اللحظي للغياب مفعل">
               <Clock size={12} /> تجميع تلقائي
            </div>
          )}

          {/* Smart Summary */}
          <div className={`w-full ${attendanceEngine.colors.bgBox} rounded-xl p-2 border ${attendanceEngine.colors.borderBox} backdrop-blur-sm`}>
            {attendanceEngine.isExempted ? (
              <div className="text-center text-[11px] font-bold mt-1 text-amber-700">
                الطالب غير مطالب بتسجيل الحضور اليومي أو الحصص
              </div>
            ) : (
              <div className="flex justify-between items-center text-[10px] font-bold mt-2 pt-2 border-t border-gray-200/30">
                <span className="text-gray-600">إجمالي الحصص: <span className="text-gray-900">{attendanceEngine.total}</span></span>
                <span className="text-emerald-600">حضور: {attendanceEngine.present}</span>
                <span className="text-rose-500">غياب: {attendanceEngine.absent}</span>
                {attendanceEngine.truancy > 0 && <span className="text-red-600 animate-pulse">هروب: {attendanceEngine.truancy}</span>}
              </div>
            )}
          </div>
        </div>

        {/* Other Stats (Take 1 column each) */}
        {[
          { label: 'رصيد المقصف', value: (studentData?.cafeteria?.currentBalance || 0).toFixed(2), icon: <Zap />, color: 'from-amber-400 to-amber-600' },
          { label: 'نقاط التميز', value: Math.max(0, dynamicPoints - (JSON.parse(localStorage.getItem('moo_spent_points') || '{}')[studentData?.personal?.id] || 0)).toLocaleString(), icon: <Star />, color: 'from-fuchsia-400 to-purple-600', subtext: `المكتسبة: ${dynamicPoints.toLocaleString()}` },
          { label: 'درجة السلوك', value: `${behaviorScore}/100`, icon: <ShieldCheck />, color: behaviorScore < 90 ? 'from-rose-400 to-rose-600' : 'from-emerald-400 to-emerald-600', subtext: behaviorLogs.length > 0 ? `مخالفات: ${behaviorLogs.length}` : 'طالب مثالي' },
        ].map((stat, idx) => (
          <div key={idx} className="md:col-span-1 lg:col-span-1 xl:col-span-1 glass-card p-6 rounded-[40px] hover-glow border border-white/60 relative overflow-hidden group flex flex-col justify-center">
            <div className={`absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br ${stat.color} opacity-10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500`} />
            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${stat.color} text-white flex items-center justify-center shadow-lg mb-4 group-hover:scale-110 transition-transform`}>
              {stat.icon}
            </div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-black text-gray-800 tabular-nums">{stat.value}</p>
              {stat.subtext && <p className="text-[10px] text-gray-400 font-bold">{stat.subtext}</p>}
            </div>
          </div>
        ))}
      </div>

      {/* 🌟 Main Bento Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Schedule Section */}
        <div className="lg:col-span-8 glass-card rounded-[40px] p-6 sm:p-8 hover-glow border border-white/60">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
            <h3 className="text-2xl font-bold flex items-center gap-3 text-gray-800">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white shadow-lg">
                <BookOpen size={20} />
              </div>
              جدول اليوم
            </h3>
            {/* التعديل هنا: تفعيل زر التوجيه */}
            <button onClick={onNavigateToSchedule} className="text-xs font-bold text-primary bg-primary/5 hover:bg-primary/10 px-5 py-2.5 rounded-xl transition-colors border border-primary/10">
              الجدول الأسبوعي الكامل
            </button>
          </div>

          <div className="space-y-4">
            {(filteredSchedule || []).length > 0 ? (
              (filteredSchedule || []).map((lesson, idx) => (
                <div key={idx} className={`group flex items-center gap-4 sm:gap-6 p-4 sm:p-5 rounded-3xl border shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden ${lesson?.type === 'exam' ? 'bg-red-50/90 border-red-200 hover:bg-red-50' : 'bg-white/40 border-white hover:bg-white'}`}>
                  <div className={`absolute left-0 top-0 bottom-0 w-1 opacity-0 group-hover:opacity-100 transition-opacity ${lesson?.type === 'exam' ? 'bg-red-500' : 'bg-gradient-to-b from-primary to-blue-500'}`} />

                  <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl shadow-inner flex items-center justify-center text-2xl group-hover:scale-110 transition-transform shrink-0 border ${lesson?.type === 'exam' ? 'bg-red-100 text-red-500 border-red-200' : 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200/50'}`}>
                    {lesson?.type === 'exam' ? '📝' : getSubjectIcon(lesson?.name || lesson?.subject || '')}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className={`font-bold text-sm sm:text-base truncate mb-1 ${lesson?.type === 'exam' ? 'text-red-700' : 'text-gray-800'}`}>{lesson?.name || lesson?.subject || 'مادة دراسية'}</p>
                    <p className={`text-[10px] sm:text-xs font-bold truncate flex items-center gap-1.5 ${lesson?.type === 'exam' ? 'text-red-400' : 'text-gray-400'}`}>
                      <UserCircle size={12} className={lesson?.type === 'exam' ? 'text-red-500' : 'text-primary'} /> {lesson?.instructor || 'المعلم'}
                    </p>
                  </div>

                  <div className="text-left shrink-0">
                    <p className="text-xs sm:text-sm font-bold text-gray-800 tabular-nums">{lesson?.time || '00:00'}</p>
                    <p className="text-[9px] sm:text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1 bg-gray-100 px-2 py-0.5 rounded-full inline-block">{lesson?.room || 'قاعة'}</p>
                  </div>

                  <button className="hidden sm:flex w-10 h-10 rounded-2xl bg-primary/5 text-primary items-center justify-center group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
                    <ArrowUpRight size={18} />
                  </button>
                </div>
              ))
            ) : (
              <div className="text-center py-16 bg-white/30 rounded-3xl border border-dashed border-gray-300">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-2xl mx-auto mb-4">🎉</div>
                <p className="text-gray-500 font-bold">لا توجد حصص مجدولة لهذا اليوم.</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Actions/Notifications */}
        <div className="lg:col-span-4 space-y-6">
          {/* Important Notifications */}
          <div className="glass-card rounded-[40px] p-6 sm:p-8 hover-glow border border-white/60">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-3 text-gray-800">
              <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-500 flex items-center justify-center animate-pulse">
                <Bell size={18} />
              </div>
              إشعارات هامة
            </h3>
            <div className="space-y-4">
              {importantNotifications.length > 0 ? (
                importantNotifications.map((notif) => (
                  <div key={notif.id} className={`flex gap-4 p-4 rounded-2xl ${notif.bgColor} bg-opacity-40 border hover:bg-opacity-100 hover:shadow-md transition-all cursor-pointer group`}>
                    <div className="w-10 h-10 rounded-xl bg-white/60 flex items-center justify-center text-xl shrink-0 shadow-sm group-hover:scale-110 transition-transform">
                      {notif.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-bold ${notif.textColor} line-clamp-1 mb-1 transition-colors`}>{notif.title}</p>
                      <p className="text-[10px] text-gray-600 font-medium line-clamp-2 leading-relaxed">{notif.description}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 bg-white/30 rounded-3xl border border-dashed border-gray-300">
                  <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                    <CheckCircle className="text-gray-300" size={24} />
                  </div>
                  <p className="text-sm font-bold text-gray-500">لا توجد تنبيهات هامة حالياً</p>
                  <p className="text-[10px] text-gray-400 mt-1">كل أمورك على ما يرام!</p>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

DashboardView.propTypes = {
  studentData: PropTypes.object.isRequired,
  searchQuery: PropTypes.string,
  onNavigateToSchedule: PropTypes.func // التعديل هنا: إضافة PropType جديد
};

export default DashboardView;