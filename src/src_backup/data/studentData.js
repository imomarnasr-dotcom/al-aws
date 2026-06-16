export const studentData = {
  personal: {
    id: "AWS-2024-0001",
    name: "أحمد محمد العتيبي",
    class: "الصف الثالث الثانوي",
    classCode: "3-A",
    email: "ahmed.alutaibi@school.edu.sa",
    phone: "+966501234567",
    joinDate: "2023-09-15",
    avatar: "أ م",
  },

  academics: {
    cumulativeGPA: 98.5,
    currentGPA: 3.95,
    totalHours: 124,
    attendance: 98.5,
    subjects: [
      { id: 1, name: "الرياضيات", grade: "A+", percentage: 98, credit: 3 },
      { id: 2, name: "اللغة الإنجليزية", grade: "A", percentage: 92, credit: 3 },
      { id: 3, name: "الفيزياء", grade: "A", percentage: 95, credit: 4 },
      { id: 4, name: "الكيمياء", grade: "B+", percentage: 88, credit: 3 },
      { id: 5, name: "اللغة العربية", grade: "A+", percentage: 96, credit: 3 },
      { id: 6, name: "التاريخ", grade: "A", percentage: 94, credit: 2 },
    ],
  },

  schedule: [
      {
        day: "الأحد",
        dayCode: "SUN",
        lessons: [
          { time: "08:00", subject: "الرياضيات", room: "قاعة 402", instructor: "د. علي أحمد", duration: 45 },
          { time: "09:00", subject: "اللغة الإنجليزية", room: "معمل اللغات", instructor: "أ. سارة محمود", duration: 45 },
          { time: "10:15", subject: "استراحة", room: "-", instructor: "-", duration: 15 },
          { time: "10:30", subject: "الفيزياء", room: "المختبر الرئيسي", instructor: "د. محمد حسن", duration: 45 },
          { time: "11:30", subject: "التاريخ", room: "قاعة 301", instructor: "أ. فاطمة علي", duration: 45 },
        ],
      },
      {
        day: "الإثنين",
        dayCode: "MON",
        lessons: [
          { time: "08:00", subject: "الكيمياء", room: "معمل الكيمياء", instructor: "د. خالد أحمد", duration: 45 },
          { time: "09:00", subject: "اللغة العربية", room: "قاعة 201", instructor: "أ. نور محمد", duration: 45 },
          { time: "10:15", subject: "استراحة", room: "-", instructor: "-", duration: 15 },
          { time: "10:30", subject: "الرياضيات", room: "قاعة 402", instructor: "د. علي أحمد", duration: 45 },
          { time: "11:30", subject: "الفيزياء", room: "المختبر الرئيسي", instructor: "د. محمد حسن", duration: 45 },
        ],
      },
      {
        day: "الثلاثاء",
        dayCode: "TUE",
        lessons: [
          { time: "08:00", subject: "اللغة الإنجليزية", room: "معمل اللغات", instructor: "أ. سارة محمود", duration: 45 },
          { time: "09:00", subject: "الرياضيات", room: "قاعة 402", instructor: "د. علي أحمد", duration: 45 },
          { time: "10:15", subject: "استراحة", room: "-", instructor: "-", duration: 15 },
          { time: "10:30", subject: "الكيمياء", room: "معمل الكيمياء", instructor: "د. خالد أحمد", duration: 45 },
          { time: "11:30", subject: "اللغة العربية", room: "قاعة 201", instructor: "أ. نور محمد", duration: 45 },
        ],
      },
      {
        day: "الأربعاء",
        dayCode: "WED",
        lessons: [
          { time: "08:00", subject: "الفيزياء", room: "المختبر الرئيسي", instructor: "د. محمد حسن", duration: 45 },
          { time: "09:00", subject: "التاريخ", room: "قاعة 301", instructor: "أ. فاطمة علي", duration: 45 },
          { time: "10:15", subject: "استراحة", room: "-", instructor: "-", duration: 15 },
          { time: "10:30", subject: "اللغة الإنجليزية", room: "معمل اللغات", instructor: "أ. سارة محمود", duration: 45 },
          { time: "11:30", subject: "الرياضيات", room: "قاعة 402", instructor: "د. علي أحمد", duration: 45 },
        ],
      },
      {
        day: "الخميس",
        dayCode: "THU",
        lessons: [
          { time: "08:00", subject: "الكيمياء", room: "معمل الكيمياء", instructor: "د. خالد أحمد", duration: 45 },
          { time: "09:00", subject: "اللغة العربية", room: "قاعة 201", instructor: "أ. نور محمد", duration: 45 },
          { time: "10:15", subject: "استراحة", room: "-", instructor: "-", duration: 15 },
          { time: "10:30", subject: "الفيزياء", room: "المختبر الرئيسي", instructor: "د. محمد حسن", duration: 45 },
        ],
      },
    ],

  cafeteria: {
    currentBalance: 150.50,
    transactions: [
      { id: 1, date: "2026-05-06", time: "12:30", item: "ساندوتش دجاج", price: 15, status: "مكتمل" },
      { id: 2, date: "2026-05-05", time: "12:15", item: "عصير برتقال", price: 8, status: "مكتمل" },
      { id: 3, date: "2026-05-05", time: "12:45", item: "حلويات وشوكولاتة", price: 12, status: "مكتمل" },
      { id: 4, date: "2026-05-04", time: "12:30", item: "فطيرة الجبنة", price: 10, status: "مكتمل" },
      { id: 5, date: "2026-05-04", time: "12:00", item: "ساندوتش تونة", price: 18, status: "مكتمل" },
      { id: 6, date: "2026-05-03", time: "12:30", item: "سلطة صحية", price: 20, status: "مكتمل" },
    ],
    menu: [
      { id: 1, name: "ساندوتش دجاج", price: 15, category: "ساندوتشات", icon: "🥪" },
      { id: 2, name: "ساندوتش تونة", price: 18, category: "ساندوتشات", icon: "🥪" },
      { id: 3, name: "فطيرة الجبنة", price: 10, category: "معجنات", icon: "🥐" },
      { id: 4, name: "سلطة صحية", price: 20, category: "سلطات", icon: "🥗" },
      { id: 5, name: "عصير برتقال", price: 8, category: "مشروبات", icon: "🧃" },
      { id: 6, name: "حليب طازج", price: 5, category: "مشروبات", icon: "🥛" },
      { id: 7, name: "حلويات وشوكولاتة", price: 12, category: "حلويات", icon: "🍫" },
    ],
  },

  notifications: [],

  achievements: [
    { id: 1, title: "طالب متفوق", description: "حصل على معدل 95% فأكثر", icon: "🏆", date: "2026-04-15" },
    { id: 2, title: "الحضور المثالي", description: "حضور كامل لمدة شهر", icon: "✓", date: "2026-04-30" },
    { id: 3, title: "نجم الفصل", description: "أفضل أداء في الاختبارات الشهرية", icon: "⭐", date: "2026-04-20" },
    { id: 4, title: "مشارك نشط", description: "مشاركة فعّالة في الأنشطة المدرسية", icon: "🎯", date: "2026-04-10" },
  ],
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
  // 🔥 إصلاح: لو اليوم جمعة أو غير دراسي نرجع null بدل fallback خاطئ
  if (dayIndex === undefined) return null;
  const scheduleDay = studentData.schedule[dayIndex];

  if (!scheduleDay) return null;

  const upcomingLesson = scheduleDay.lessons.find((lesson) => {
    const [lessonHour, lessonMinute] = lesson.time.split(":").map(Number);
    return lessonHour > currentHour || (lessonHour === currentHour && lessonMinute > currentMinute);
  });

  return upcomingLesson;
};

export const getTodaySchedule = () => {
  const today = new Date().toLocaleDateString("ar-SA", { weekday: "long" });
  const dayMap = {
    "السبت": 0,
    "الأحد": 1,
    "الاثنين": 2,
    "الثلاثاء": 3,
    "الأربعاء": 4,
    "الخميس": 5,
  };

  const dayIndex = dayMap[today];
  // 🔥 إصلاح: لو اليوم جمعة أو غير دراسي نرجع null
  if (dayIndex === undefined) return null;
  return studentData.schedule[dayIndex];
};

export const getNewNotificationsCount = () => {
  return studentData.notifications.filter((n) => n.isNew).length;
};
