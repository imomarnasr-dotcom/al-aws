const fs = require('fs');

function refactorDashboard() {
  const file = 'src/components/DashboardView.jsx';
  let content = fs.readFileSync(file, 'utf8');

  // Add useCloudStorage import
  if (!content.includes("import { useCloudStorage }")) {
    content = content.replace("import PropTypes from 'prop-types';", "import PropTypes from 'prop-types';\nimport { useCloudStorage } from '../services/useCloudStorage';");
  }

  // 1. Remove state and useEffect related to localStorage
  content = content.replace(/const \[globalExams, setGlobalExams\] = useState\(\(\) => \{[\s\S]*?\}\);/, "");
  content = content.replace(/const getAcademicLessons = \(\) => \{[\s\S]*?\}\);/, "");
  content = content.replace(/useEffect\(\(\) => \{\s*const timer = setInterval\(\(\) => setCurrentTime\(new Date\(\)\), 60000\);[\s\S]*?\}, \[\]\);/, "useEffect(() => {\n    const timer = setInterval(() => setCurrentTime(new Date()), 60000);\n    return () => clearInterval(timer);\n  }, []);");

  // 2. Add useCloudStorage hooks
  const hooks = `
  const [globalExams] = useCloudStorage('exams', 'all_data', []);
  const [teacherTests] = useCloudStorage('tests', 'all_data', []);
  const [academicLessons] = useCloudStorage('lessons', 'all_data', []);
  const [attendanceRecords] = useCloudStorage('attendance', 'all_data', {});
  const [gradesData] = useCloudStorage('grades', 'all_data', {});
  const [behaviorLogs] = useCloudStorage('behavior_logs', 'all_data', {});
  const [notifications] = useCloudStorage('notifications', 'all_data', []);
  const [spentPoints] = useCloudStorage('spent_points', 'all_data', {});
`;
  content = content.replace("const [currentTime, setCurrentTime] = useState(new Date());", "const [currentTime, setCurrentTime] = useState(new Date());\n" + hooks);

  // 3. Replace all JSON.parse(localStorage...) instances inside useMemos
  content = content.replace(/try \{ classRecords = JSON\.parse\(localStorage\.getItem\('moo_attendance'\) \|\| '\{\}'\); \} catch \{\}/g, "classRecords = attendanceRecords;");
  
  content = content.replace(/const realGrades = JSON\.parse\(localStorage\.getItem\('moo_grades'\) \|\| '\{\}'\);/g, "const realGrades = gradesData || {};");
  content = content.replace(/const t1 = JSON\.parse\(localStorage\.getItem\('moo_tests'\) \|\| '\[\]'\);/g, "const t1 = teacherTests || [];");
  content = content.replace(/const t2 = JSON\.parse\(localStorage\.getItem\('exams'\) \|\| '\[\]'\);/g, "const t2 = globalExams || [];");

  content = content.replace(/return JSON\.parse\(localStorage\.getItem\('moo_behavior_logs'\) \|\| '\{\}'\)\[studentData\?\.personal\?\.id\] \|\| \[\];/g, "return (behaviorLogs || {})[studentData?.personal?.id] || [];");

  content = content.replace(/try \{ generalNotifs = JSON\.parse\(localStorage\.getItem\('moo_notifications'\) \|\| '\[\]'\); \} catch \{ generalNotifs = \[\]; \}/g, "generalNotifs = notifications || [];");

  content = content.replace(/try \{ allExams = JSON\.parse\(localStorage\.getItem\('exams'\) \|\| '\[\]'\); \} catch \{ allExams = \[\]; \}/g, "allExams = globalExams || [];");

  content = content.replace(/JSON\.parse\(localStorage\.getItem\('moo_spent_points'\) \|\| '\{\}'\)\[studentData\?\.personal\?\.id\]/g, "(spentPoints || {})[studentData?.personal?.id]");

  fs.writeFileSync(file, content, 'utf8');
  console.log('DashboardView refactored!');
}

function refactorExams() {
  const file = 'src/components/ExamsView.jsx';
  let content = fs.readFileSync(file, 'utf8');

  if (!content.includes("import { useCloudStorage }")) {
    content = content.replace("import PropTypes from 'prop-types';", "import PropTypes from 'prop-types';\nimport { useCloudStorage } from '../services/useCloudStorage';");
  }

  // Add hooks at the beginning of the component
  const hooks = `
  const [teacherTests] = useCloudStorage('tests', 'all_data', []);
  const [globalExams] = useCloudStorage('exams', 'all_data', []);
  const [gradesData] = useCloudStorage('grades', 'all_data', {});
`;
  content = content.replace("const [activeTab, setActiveTab] = useState('upcoming');", "const [activeTab, setActiveTab] = useState('upcoming');\n" + hooks);

  // Replace localStorage inside useMemos
  content = content.replace(/const fromTeacher = JSON\.parse\(localStorage\.getItem\('moo_tests'\) \|\| '\[\]'\);/g, "const fromTeacher = teacherTests || [];");
  content = content.replace(/const fromOld = JSON\.parse\(localStorage\.getItem\('exams'\) \|\| '\[\]'\);/g, "const fromOld = globalExams || [];");
  content = content.replace(/const teacherExams = JSON\.parse\(localStorage\.getItem\('moo_tests'\) \|\| '\[\]'\);/g, "const teacherExams = teacherTests || [];");
  content = content.replace(/const moGrades = JSON\.parse\(localStorage\.getItem\('moo_grades'\) \|\| '\{\}'\);/g, "const moGrades = gradesData || {};");

  // Remove handleStorage useEffect
  content = content.replace(/useEffect\(\(\) => \{\s*const handleStorage = \(\) => \{\s*setForceUpdate\(prev => prev \+ 1\);\s*\};\s*window\.addEventListener\('storage', handleStorage\);\s*window\.addEventListener\('moo-sync', handleStorage\);\s*return \(\) => \{\s*window\.removeEventListener\('storage', handleStorage\);\s*window\.removeEventListener\('moo-sync', handleStorage\);\s*\};\s*\}, \[\]\);/g, "");
  
  // Remove forceUpdate state if unused
  content = content.replace(/const \[forceUpdate, setForceUpdate\] = useState\(0\);/g, "");
  content = content.replace(/, forceUpdate/g, "");

  fs.writeFileSync(file, content, 'utf8');
  console.log('ExamsView refactored!');
}

function refactorGrades() {
  const file = 'src/components/GradesView.jsx';
  let content = fs.readFileSync(file, 'utf8');

  if (!content.includes("import { useCloudStorage }")) {
    content = content.replace("import PropTypes from 'prop-types';", "import PropTypes from 'prop-types';\nimport { useCloudStorage } from '../services/useCloudStorage';");
  }

  const hooks = `
  const [gradesData] = useCloudStorage('grades', 'all_data', {});
  const [teacherTests] = useCloudStorage('tests', 'all_data', []);
  const [globalExams] = useCloudStorage('exams', 'all_data', []);
  const [achievementsData] = useCloudStorage('achievements', 'all_data', []);
`;
  content = content.replace("const [selectedSubject, setSelectedSubject] = useState(null);", "const [selectedSubject, setSelectedSubject] = useState(null);\n" + hooks);

  content = content.replace(/try \{ return JSON\.parse\(localStorage\.getItem\('moo_grades'\) \|\| '\{\}'\); \} catch \{ return \{\}; \}/g, "return gradesData || {};");
  content = content.replace(/const t1 = JSON\.parse\(localStorage\.getItem\('moo_tests'\) \|\| '\[\]'\);/g, "const t1 = teacherTests || [];");
  content = content.replace(/const t2 = JSON\.parse\(localStorage\.getItem\('exams'\) \|\| '\[\]'\);/g, "const t2 = globalExams || [];");
  
  content = content.replace(/achievements = JSON\.parse\(localStorage\.getItem\('moo_achievements'\) \|\| '\[\]'\)\.filter\(a => a\.studentId === studentData\?\.personal\?\.id\);/g, "achievements = (achievementsData || []).filter(a => a.studentId === studentData?.personal?.id);");

  // Remove the old useEffect that listens to storage
  content = content.replace(/useEffect\(\(\) => \{\s*const refresh = \(\) => \{\s*setRealGrades\(JSON\.parse\(localStorage\.getItem\('moo_grades'\) \|\| '\{\}'\)\);\s*const t1 = JSON\.parse\(localStorage\.getItem\('moo_tests'\) \|\| '\[\]'\);\s*const t2 = JSON\.parse\(localStorage\.getItem\('exams'\) \|\| '\[\]'\);\s*setExamsHistory\(\[...t1, ...t2\]\);\s*\};\s*window\.addEventListener\('moo-sync', refresh\);\s*window\.addEventListener\('storage', refresh\);\s*return \(\) => \{ window\.removeEventListener\('moo-sync', refresh\); window\.removeEventListener\('storage', refresh\); \};\s*\}, \[\]\);/g, "");
  
  content = content.replace(/const \[realGrades, setRealGrades\] = useState\(\(\) => \{[\s\S]*?\}\);/, "const realGrades = gradesData || {};");
  content = content.replace(/const \[examsHistory, setExamsHistory\] = useState\(\(\) => \{[\s\S]*?\}\);/, "const examsHistory = [...(teacherTests || []), ...(globalExams || [])];");

  fs.writeFileSync(file, content, 'utf8');
  console.log('GradesView refactored!');
}

function refactorSchedule() {
  const file = 'src/components/ScheduleView.jsx';
  let content = fs.readFileSync(file, 'utf8');

  if (!content.includes("import { useCloudStorage }")) {
    content = content.replace("import PropTypes from 'prop-types';", "import PropTypes from 'prop-types';\nimport { useCloudStorage } from '../services/useCloudStorage';");
  }

  const hooks = `
  const [lessonsData] = useCloudStorage('lessons', 'all_data', []);
`;
  content = content.replace("const [selectedDay, setSelectedDay] = useState(ARABIC_DAYS[new Date().getDay()] || 'الأحد');", "const [selectedDay, setSelectedDay] = useState(ARABIC_DAYS[new Date().getDay()] || 'الأحد');\n" + hooks);

  content = content.replace(/const \[academicLessons, setAcademicLessons\] = useState\(\(\) => \{[\s\S]*?return JSON\.parse\(localStorage\.getItem\('GLOBAL_ACADEMIC_MASTER'\) \|\| '\{\}'\)\.lessons \|\| \[\];[\s\S]*?\}\);/g, "const academicLessons = lessonsData || [];");

  // Remove the old useEffect that listens to storage
  content = content.replace(/useEffect\(\(\) => \{\s*const update = \(\) => \{\s*try \{\s*setAcademicLessons\(JSON\.parse\(localStorage\.getItem\('GLOBAL_ACADEMIC_MASTER'\) \|\| '\{\}'\)\.lessons \|\| \[\]\);\s*\} catch \{\}\s*\};\s*window\.addEventListener\('storage', update\);\s*window\.addEventListener\('moo-sync', update\);\s*return \(\) => \{ window\.removeEventListener\('storage', update\); window\.removeEventListener\('moo-sync', update\); \};\s*\}, \[\]\);/g, "");

  fs.writeFileSync(file, content, 'utf8');
  console.log('ScheduleView refactored!');
}

try {
  refactorDashboard();
  refactorExams();
  refactorGrades();
  refactorSchedule();
} catch (err) {
  console.error("Error during refactoring:", err);
}
