const fs = require('fs');
let content = fs.readFileSync('src/components/DashboardView.jsx', 'utf8');

const missingCode = `
  const parseTime = (timeStr) => {
    const match = String(timeStr || '').match(/(\\d+):(\\d+)\\s*(AM|PM|am|pm|ص|م)?/);
    if (!match) return 0;
    let hours = parseInt(match[1], 10);
    const mins = parseInt(match[2], 10);
    const modifier = match[3]?.toLowerCase();
    if ((modifier === 'pm' || modifier === 'م') && hours < 12) hours += 12;
    else if ((modifier === 'am' || modifier === 'ص') && hours === 12) hours = 0;
    
    // Return ms from start of day
    return (hours * 60 + mins) * 60000;
  };

  const ARABIC_DAYS = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

  const filteredSchedule = useMemo(() => {
    const todayName = ARABIC_DAYS[currentTime.getDay()];
    const studentClass = studentData?.personal?.class;
    if (!studentClass) return [];
    
    return academicLessons.filter(l => 
      l.day === todayName && 
      l.classCode === studentClass && 
      l.type !== 'break' && !l.isBreak
    ).map(l => ({
      ...l,
      name: l.subject,
      type: 'lesson'
    }));
  }, [academicLessons, studentData, currentTime]);

  const nextClassData = useMemo(() => {
    const studentClass = studentData?.personal?.class;
    const studentId = studentData?.personal?.id;
    const todayName = ARABIC_DAYS[currentTime.getDay()];
    // nowTime is ms from start of day
    const nowTime = (currentTime.getHours() * 60 + currentTime.getMinutes()) * 60000;

    const allExams = [...globalExams, ...teacherTests];
    
    const currentExam = allExams.find(ex => {
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

`;

content = content.replace(/const \[spentPoints\] = useCloudStorage\('spent_points', 'all_data', \{\}\);[\s\S]*?if \(currentExam\) \{/, 
  "const [spentPoints] = useCloudStorage('spent_points', 'all_data', {});\n\n" + missingCode + "    if (currentExam) {"
);

fs.writeFileSync('src/components/DashboardView.jsx', content, 'utf8');
console.log('Fixed DashboardView missing declarations!');
