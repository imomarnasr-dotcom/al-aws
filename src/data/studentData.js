export const studentData = {
  personal: {
    id: "",
    name: "",
    class: "",
    classCode: "",
    email: "",
    phone: "",
    joinDate: "",
    avatar: "",
  },

  academics: {
    cumulativeGPA: 0,
    currentGPA: 0,
    totalHours: 0,
    attendance: 0,
    subjects: [],
  },

  schedule: [
    { day: 'السبت',    dayCode: 'SAT', lessons: [] },
    { day: 'الأحد',    dayCode: 'SUN', lessons: [] },
    { day: 'الاثنين',  dayCode: 'MON', lessons: [] },
    { day: 'الثلاثاء', dayCode: 'TUE', lessons: [] },
    { day: 'الأربعاء', dayCode: 'WED', lessons: [] },
    { day: 'الخميس',  dayCode: 'THU', lessons: [] },
  ],

  cafeteria: {
    currentBalance: 0,
    transactions: [],
    menu: [],
  },

  notifications: [],
  achievements: [],
};

export const getUpcomingLesson = () => {
  const now = new Date();
  const currentDay = now.toLocaleDateString("ar-SA", { weekday: "long" });
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  const dayMap = {
    "السبت": 0,
    "الأحد": 1,
    "الاثنين": 2,
    "الثلاثاء": 3,
    "الأربعاء": 4,
    "الخميس": 5,
  };

  const dayIndex = dayMap[currentDay];
  if (dayIndex === undefined) return null;

  // 🔥 إصلاح: نقرأ الجدول من GLOBAL_ACADEMIC_MASTER مش من studentData الثابت
  try {
    const master = JSON.parse(localStorage.getItem('GLOBAL_ACADEMIC_MASTER') || '{}');
    const lessons = master.lessons || [];
    const todayLessons = lessons.filter(l => l.day === currentDay);
    return todayLessons.find(l => {
      const [h, m] = l.time.split(":").map(Number);
      return h > currentHour || (h === currentHour && m > currentMinute);
    }) || null;
  } catch {
    return null;
  }
};

export const getTodaySchedule = () => {
  const today = new Date().toLocaleDateString("ar-SA", { weekday: "long" });
  try {
    const master = JSON.parse(localStorage.getItem('GLOBAL_ACADEMIC_MASTER') || '{}');
    const lessons = (master.lessons || []).filter(l => l.day === today);
    return { day: today, lessons };
  } catch {
    return { day: today, lessons: [] };
  }
};

export const getNewNotificationsCount = () => {
  try {
    const store = JSON.parse(localStorage.getItem('moo_student_notifications') || '{}');
    const allNotifs = Object.values(store).flat();
    return allNotifs.filter(n => n.isNew).length;
  } catch {
    return 0;
  }
};
