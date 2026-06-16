const fs = require('fs');

let content = fs.readFileSync('src/App.jsx', 'utf8');
content = content.replace(/window\.dispatchEvent\(new CustomEvent\('moo-toast', \{ detail: \{ message: '.*?', type: 'error' \} \}\)\);/g, "window.dispatchEvent(new CustomEvent('moo-toast', { detail: { message: 'عذراً الرصيد غير كافٍ لإتمام العملية.', type: 'error' } }));");
fs.writeFileSync('src/App.jsx', content, 'utf8');

let adminAttendance = fs.readFileSync('src/components/AdminSmartAttendance.jsx', 'utf8');
adminAttendance = adminAttendance.replace(/window\.dispatchEvent\(new CustomEvent\('moo-toast', \{ detail: \{ message: '.*?', type: 'success' \} \}\)\);/g, "window.dispatchEvent(new CustomEvent('moo-toast', { detail: { message: 'تم الحفظ بنجاح.', type: 'success' } }));");
fs.writeFileSync('src/components/AdminSmartAttendance.jsx', adminAttendance, 'utf8');

let teacherDash = fs.readFileSync('src/components/TeacherDashboard.jsx', 'utf8');
teacherDash = teacherDash.replace(/message: '.*?'/g, "message: 'يرجى اختيار الفصل'");
fs.writeFileSync('src/components/TeacherDashboard.jsx', teacherDash, 'utf8');

console.log('Fixed App.jsx, AdminSmartAttendance.jsx, and TeacherDashboard.jsx');
