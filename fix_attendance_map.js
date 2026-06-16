const fs = require('fs');
let content = fs.readFileSync('src/components/TeacherDashboard.jsx', 'utf-8');

const oldRegex = /newMap\[studentId\] = oldRecord\[studentId\] === '.*';/g;

if (content.match(oldRegex)) {
  content = content.replace(oldRegex, "newMap[studentId] = oldRecord[studentId] === ATTENDANCE_STATUS.PRESENT || oldRecord[studentId] === 'حاضر' || oldRecord[studentId] === 'ط­ط§ط¶ط±' || oldRecord[studentId] === true;");
  fs.writeFileSync('src/components/TeacherDashboard.jsx', content);
  console.log('Fixed attendanceMap initialization');
} else {
  console.log('Pattern not found');
}
