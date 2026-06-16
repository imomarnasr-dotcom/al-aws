// مصفوفة الأيام المركزية (كاملة - لا تتغير)
export const WEEK_DAYS = ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];

// ========================================================================
// 🔥 محرك الحضور الموحد (Single Source of Truth)
// تنسيق الحالات الموحد لكل المشروع - لا تستخدم نصوصاً يدوية بعد الآن
// ========================================================================
export const ATTENDANCE_STATUS = {
  PRESENT: 'حاضر',
  ABSENT: 'غائب',
  EXEMPTED: 'معفي',
};

// تطبيع أي قيمة قديمة (true / 'ح' / 'حاضر') إلى تنسيق موحد
export const normalizeAttendanceValue = (val) => {
  if (val === true || val === 'ح' || val === ATTENDANCE_STATUS.PRESENT) return ATTENDANCE_STATUS.PRESENT;
  if (val === ATTENDANCE_STATUS.EXEMPTED) return ATTENDANCE_STATUS.EXEMPTED;
  return ATTENDANCE_STATUS.ABSENT;
};

// قراءة قائمة الطلاب
const getWhitelist = () => {
  try { return JSON.parse(localStorage.getItem('moo_whitelist') || '[]'); } catch { return []; }
};

// قراءة سجلات حضور الحصص الكاملة
const getClassAttendanceRecords = () => {
  try { return JSON.parse(localStorage.getItem('moo_attendance') || '{}'); } catch { return {}; }
};

// قراءة سجلات بوابة الصباح
const getManualDailyRecords = () => {
  try { return JSON.parse(localStorage.getItem('moo_daily_attendance_manual') || '{}'); } catch { return {}; }
};

/**
 * 🔥 الدالة المركزية الوحيدة لحساب حضور طالب.
 * تحسب لحظياً من السجلات التفصيلية (moo_attendance) — لا تعتمد على أرقام مجمّعة قابلة للانحراف.
 * تحترم الإعفاء (isExempted) وأيام العمل (isWorkingDay) وتجاهل الإجازات والجمعة/السبت المعطّل.
 *
 * @param {string} studentId
 * @returns {{percentage, total, present, absent, truancy, isExempted, morningStatus}}
 */
export const calculateStudentAttendance = (studentId, parsedData = null) => {
  const emptyGreen = {
    percentage: 100, total: 0, present: 0, absent: 0, truancy: 0,
    isExempted: false, morningStatus: 'pending',
  };
  if (!studentId) return emptyGreen;

  const whitelist = parsedData?.whitelist || getWhitelist();
  const student = whitelist.find(s => s.id === studentId);
  if (!student) return emptyGreen;

  const isExempted = !!student.isExempted;
  const classCode = student.className || student.class;

  // حالة البوابة الصباحية لليوم الحالي
  const _d = new Date();
  const today = `${_d.getFullYear()}-${String(_d.getMonth() + 1).padStart(2, '0')}-${String(_d.getDate()).padStart(2, '0')}`;
  const isTodayHoliday = !isWorkingDay(today);
  const allManualRecords = parsedData?.allManualRecords || getManualDailyRecords();
  const manualToday = allManualRecords[today] || {};
  const autoMode = parsedData?.autoMode !== undefined ? parsedData.autoMode : (() => {
    try { return JSON.parse(localStorage.getItem('moo_auto_attendance_enabled') || 'false'); } catch { return false; }
  })();

  let morningStatus = 'pending';
  if (isExempted) morningStatus = 'exempted';
  else if (autoMode) morningStatus = 'auto';
  else if (manualToday[studentId]) morningStatus = 'present';

  // الطلاب المعفيون (استثناء شامل)
  if (isExempted) {
    return { percentage: 100, total: 0, present: 0, absent: 0, truancy: 0, isExempted: true, morningStatus: isTodayHoliday ? 'holiday' : 'exempted', isTodayHoliday };
  }

  // فصول الطلاب الصغار
  let isYoungExempted = false;
  try {
    const youngClasses = parsedData?.youngClasses || JSON.parse(localStorage.getItem('moo_young_classes') || '[]');
    const normalizeStr = (str) => str ? str.trim().replace(/ي/g, 'ى').replace(/[أإآ]/g, 'ا') : '';
    const classCodeNorm = normalizeStr(classCode);
    
    if (youngClasses.some(c => normalizeStr(c) === classCodeNorm)) {
      isYoungExempted = true;
      if (morningStatus === 'pending') morningStatus = 'exempted_young';
    }
  } catch (e) {}

  const dailyRecords = parsedData?.dailyRecords || getClassAttendanceRecords();
  let periodRecords = parsedData?.periodRecords || {};
  if (!parsedData?.periodRecords) {
    try { Object.assign(periodRecords, JSON.parse(localStorage.getItem('moo_attendance_periods') || '{}')); } catch {}
  }

  let total = 0, present = 0, absent = 0, truancy = 0;

  if (classCode) {
    const datesWithPeriods = new Set();
    Object.keys(periodRecords).forEach(key => {
      if (key.startsWith(`${classCode}_`)) {
        const parts = key.split('_');
        if (parts.length >= 3) datesWithPeriods.add(parts[1]);
      }
    });

    const processMapRecord = (map, dateStr) => {
      let wasEnrolled = false;
      let status = undefined;

      if (map.__enrolled) {
        wasEnrolled = map.__enrolled.includes(studentId);
        if (wasEnrolled) {
           status = map[studentId] !== undefined ? normalizeAttendanceValue(map[studentId]) : ATTENDANCE_STATUS.PRESENT;
        }
      } else {
        wasEnrolled = map[studentId] !== undefined;
        if (wasEnrolled) {
           status = normalizeAttendanceValue(map[studentId]);
        }
      }

      if (!wasEnrolled) return;
      if (status === ATTENDANCE_STATUS.EXEMPTED) return;

      total++;
      if (status === ATTENDANCE_STATUS.PRESENT) { present++; } 
      else {
        absent++;
        const gate = allManualRecords[dateStr]?.[studentId];
        if (gate && ['حاضر', 'متأخر', 'انصراف'].includes(gate.status)) truancy++;
      }
    };

    // 1. Process daily records ONLY for dates that do NOT have period records
    Object.keys(dailyRecords).forEach(key => {
      if (!key.startsWith(`${classCode}_`)) return;
      const dateStr = key.slice(classCode.length + 1);
      if (datesWithPeriods.has(dateStr)) return; // Skip if period records exist for this day

      if (dateStr && !isWorkingDay(dateStr)) return;
      const map = dailyRecords[key] || {};
      processMapRecord(map, dateStr);
    });

    // 2. Process period records
    Object.keys(periodRecords).forEach(key => {
      if (!key.startsWith(`${classCode}_`)) return;
      const parts = key.split('_');
      if (parts.length < 3) return;
      const dateStr = parts[1];

      if (dateStr && !isWorkingDay(dateStr)) return;

      const map = periodRecords[key] || {};
      processMapRecord(map, dateStr);
    });
  }

  if (total === 0) {
    return { percentage: 100, total: 0, present: 0, absent: 0, truancy: 0, isExempted: false, isYoungExempted, morningStatus: isTodayHoliday ? 'holiday' : morningStatus, isTodayHoliday };
  }

  let percentage = Math.round((present / total) * 100);
  
  // تطبيق قاعدة استثناء الصغار: إذا حضر حصتين يعتبر يومه كامل
  if (isYoungExempted && present >= 2) {
    percentage = 100;
  }

  return { percentage, total, present, absent, truancy, isExempted: false, isYoungExempted, morningStatus: isTodayHoliday ? 'holiday' : morningStatus, isTodayHoliday };
};


// هل السبت يوم عمل؟
export const isSaturdayEnabled = () => {
    try {
        return JSON.parse(localStorage.getItem('moo_saturday_enabled') || 'true');
    } catch { return true; }
};

// الأيام الفعلية (بدون السبت لو مُعطَّل)
export const getActiveWeekDays = () => {
    if (isSaturdayEnabled()) return WEEK_DAYS;
    return WEEK_DAYS.filter(d => d !== 'السبت');
};

// تقويم الإجازات الرسمية
export const getHolidays = () => {
    try {
        return JSON.parse(localStorage.getItem('moo_holidays') || '[]');
    } catch { return []; }
};

export const saveHolidays = (holidays) => {
    localStorage.setItem('moo_holidays', JSON.stringify(holidays));
};

// هل هذا التاريخ يوم عمل فعلي؟ (ليس جمعة، ليس سبت معطل، ليس إجازة رسمية)
export const isWorkingDay = (dateStr) => {
    const date = new Date(dateStr);
    const dayOfWeek = date.getDay(); // 0=Sun, 5=Fri, 6=Sat
    
    // الجمعة إجازة دائمة
    if (dayOfWeek === 5) return false;
    
    // السبت - حسب الإعداد
    if (dayOfWeek === 6 && !isSaturdayEnabled()) return false;
    
    // الإجازات الرسمية
    const holidays = getHolidays();
    const dateOnly = dateStr.split('T')[0]; // YYYY-MM-DD
    for (const h of holidays) {
        if (dateOnly >= h.startDate && dateOnly <= h.endDate) return false;
    }
    
    return true;
};

const timeToMinutes = (timeStr) => {
    const [h, m] = (timeStr || '00:00').split(':').map(n => parseInt(n, 10) || 0);
    return h * 60 + m;
};
const minutesToTime = (mins) => {
    const h = Math.floor(mins / 60).toString().padStart(2, '0');
    const m = (mins % 60).toString().padStart(2, '0');
    return `${h}:${m}`;
};

export const getGlobalMaster = () => {
    try {
        const master = localStorage.getItem('GLOBAL_ACADEMIC_MASTER');
        return master ? JSON.parse(master) : { lessons: [], settings: { firstLessonStart: '08:00', lessonDuration: 45, lessonsPerDay: 7, breakAfterPeriod: 4, breakDuration: 30 }, classes: [] };
    } catch { return { lessons: [], settings: { firstLessonStart: '08:00', lessonDuration: 45, lessonsPerDay: 7, breakAfterPeriod: 4, breakDuration: 30 }, classes: [] }; }
};

export const SyncAll = (newMaster) => {
    localStorage.setItem('GLOBAL_ACADEMIC_MASTER', JSON.stringify(newMaster));
    localStorage.setItem('moo_global_schedule', JSON.stringify(newMaster.lessons || []));
    // 🔥 الإصلاح: نبعت moo-sync فقط بدل storage+moo-sync
    // storage event المفروض يتبعت من المتصفح تلقائياً من tabs تانية
    // بعثه يدوياً من نفس الـ tab بيسبب infinite loops في الـ listeners
    window.dispatchEvent(new CustomEvent('moo-sync'));
};

export const generateScheduleTemplate = (settings = {}) => {
    const template = [];
    WEEK_DAYS.forEach(day => {
        let [h, m] = (settings.firstLessonStart || '08:00').split(':').map(Number);
        for (let i = 1; i <= (settings.lessonsPerDay || 7); i++) {
            const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
            template.push({ id: `slot-${day}-${timeStr}`, day, startTime: timeStr, label: `الحصة ${i}` });
            m += (settings.lessonDuration || 45);
            if (m >= 60) { h += Math.floor(m / 60); m %= 60; }
        }
    });
    return template;
};

// المحرك المركزي الموحد للمسئول والمعلم
export const getMasterTimeSlots = (settings = {}) => {
    const slots = [];
    let currentMins = timeToMinutes(settings.firstLessonStart || '08:00');
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
};

export const getLessonsForTeacher = (teacherName) => {
    const master = getGlobalMaster();
    return (master.lessons || []).filter(l => l.instructor === teacherName);
};

export const getSlotStatus = (teacherName, day, time, classCode) => {
    const master = getGlobalMaster();
    const lessons = master.lessons || [];
    const settings = master.settings || {};

    // 🔥 تطابق 100% مع المسئول لمعرفة الفسحة الحقيقية
    const masterSlots = getMasterTimeSlots(settings);
    const breakAfter = Number(settings.breakAfterPeriod || 4);
    const lessonsCount = Number(settings.lessonsPerDay || 7);
    // وقت الفسحة يقع في index رقم breakAfter داخل masterSlots
    // لو lessonsCount <= breakAfter فلا توجد فسحة أصلاً
    const breakSlotTime = (breakAfter < lessonsCount) ? masterSlots[breakAfter] : null;
    const isBreakTime = breakSlotTime !== null && (time === breakSlotTime);

    // 1. هل هي فسحة؟
    const breakLesson = lessons.find(l => l.day === day && l.time === time && l.classCode === classCode && (l.type === 'break' || l.isBreak));
    if (breakLesson || isBreakTime) return { status: 'break', lesson: breakLesson || { type: 'break', subject: 'فسحة' } };

    // 2. حصتي
    const myLessonHere = lessons.find(l => l.day === day && l.time === time && l.classCode === classCode && l.instructor === teacherName);
    if (myLessonHere) return { status: 'mine', lesson: myLessonHere };

    // 3. مشغول بمكان تاني
    const myLessonElsewhere = lessons.find(l => l.day === day && l.time === time && l.instructor === teacherName);
    if (myLessonElsewhere) return { status: 'busy_elsewhere', lesson: myLessonElsewhere };

    // 4. معلم آخر
    const otherLessonHere = lessons.find(l => l.day === day && l.time === time && l.classCode === classCode);
    if (otherLessonHere) return { status: 'other', lesson: otherLessonHere };

    return { status: 'empty' };
};

// --- نظام الإشعارات وتبديل الحصص ---
export const getTeacherNotifications = (teacherName) => {
    try {
        return JSON.parse(localStorage.getItem('moo_notifications') || '[]')
            .filter(n => n.to === teacherName);
    } catch {
        return [];
    }
};

export const sendSwapRequest = (sourceLesson, targetLesson) => {
    const notifs = JSON.parse(localStorage.getItem('moo_notifications') || '[]');
    notifs.push({
        id: Date.now().toString(),
        type: 'swap_request',
        from: sourceLesson.instructor,
        to: targetLesson.instructor,
        sourceLesson,
        targetLesson,
        message: `المعلم (${sourceLesson.instructor}) يطلب تبديل حصته بـ (${sourceLesson.classCode}) مع حصتك بـ (${targetLesson.classCode}) يوم ${sourceLesson.day} الساعة ${sourceLesson.time}`
    });
    localStorage.setItem('moo_notifications', JSON.stringify(notifs));
    window.dispatchEvent(new CustomEvent('moo-sync'));
};

export const executeSwap = (notifId) => {
    const notifs = JSON.parse(localStorage.getItem('moo_notifications') || '[]');
    const notif = notifs.find(n => n.id === notifId);
    if (!notif) return;

    const master = getGlobalMaster();
    const l1Index = master.lessons.findIndex(l => l.id === notif.sourceLesson.id);
    const l2Index = master.lessons.findIndex(l => l.id === notif.targetLesson.id);

    if (l1Index > -1 && l2Index > -1) {
        // clone آمن لكل كائن لتجنب التعديل بالمرجع على الـ state الأصلية
        const updatedLessons = master.lessons.map(l => ({ ...l }));
        const tempDay = updatedLessons[l1Index].day;
        const tempTime = updatedLessons[l1Index].time;
        updatedLessons[l1Index].day = updatedLessons[l2Index].day;
        updatedLessons[l1Index].time = updatedLessons[l2Index].time;
        updatedLessons[l2Index].day = tempDay;
        updatedLessons[l2Index].time = tempTime;
        SyncAll({ ...master, lessons: updatedLessons });
    }

    const remaining = notifs.filter(n => n.id !== notifId);
    localStorage.setItem('moo_notifications', JSON.stringify(remaining));
    window.dispatchEvent(new CustomEvent('moo-sync'));
};

export const rejectSwap = (notifId) => {
    const notifs = JSON.parse(localStorage.getItem('moo_notifications') || '[]');
    const remaining = notifs.filter(n => n.id !== notifId);
    localStorage.setItem('moo_notifications', JSON.stringify(remaining));
    window.dispatchEvent(new CustomEvent('moo-sync'));
};

export const getStudentDynamicPoints = (studentId, studentClass) => {
  try {
    const realGrades = JSON.parse(localStorage.getItem('moo_grades') || '{}');
    const t1 = JSON.parse(localStorage.getItem('moo_tests') || '[]');
    const t2 = JSON.parse(localStorage.getItem('exams') || '[]');
    const onlineExams = [...t1, ...t2];

    const liveSubjects = [];
    Object.entries(realGrades).forEach(([key, gradesMap]) => {
      const [cls, subject] = key.split('__');
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
        if (!liveSubjects.find(s => s.name === examName)) liveSubjects.push({ name: examName, percentage: pct });
      }
    });

    const uniqueSubjects = [];
    const seenNames = new Set();
    for (const sub of liveSubjects) {
      if (!seenNames.has(sub.name)) { seenNames.add(sub.name); uniqueSubjects.push(sub); }
    }

    const gpaPct = uniqueSubjects.length === 0 ? 0 : uniqueSubjects.reduce((sum, s) => sum + s.percentage, 0) / uniqueSubjects.length;
    const attendance = calculateStudentAttendance(studentId);
    const attPct = attendance.percentage || 0;

    if (gpaPct === 0 && attPct === 0) return 0;
    return Math.round((gpaPct * 10) + (attPct * 5));
  } catch { return 0; }
};