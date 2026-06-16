const fs = require('fs');
let content = fs.readFileSync('src/components/TeacherDashboard.jsx', 'utf-8');

// Bug: only exempted students get recorded, normal students are skipped
const bugPattern = /classStudents\.forEach\(s => \{\r?\n\s+if \(s\.isExempted\) \{\r?\n\s+todayRecord\[s\.id\] = ATTENDANCE_STATUS\.EXEMPTED;\r?\n\s+const isPres = attendanceMap\[s\.id\] !== false && attendanceMap\[s\.id\] !== 'ABSENT';\r?\n\s+todayRecord\[s\.id\] = isPres \? ATTENDANCE_STATUS\.PRESENT : ATTENDANCE_STATUS\.ABSENT;\r?\n\s+\}\r?\n\s+\}\);/;

const match = content.match(bugPattern);
if (match) {
  const fix = `classStudents.forEach(s => {\r\n      if (s.isExempted) {\r\n        todayRecord[s.id] = ATTENDANCE_STATUS.EXEMPTED;\r\n      } else {\r\n        const isPres = attendanceMap[s.id] !== false && attendanceMap[s.id] !== 'ABSENT';\r\n        todayRecord[s.id] = isPres ? ATTENDANCE_STATUS.PRESENT : ATTENDANCE_STATUS.ABSENT;\r\n      }\r\n    });`;
  content = content.replace(bugPattern, fix);
  fs.writeFileSync('src/components/TeacherDashboard.jsx', content);
  console.log('BUG FIXED SUCCESSFULLY');
} else {
  console.log('Pattern not found');
}
