const fs = require('fs');

function replaceFile(path, searchParams, replacement) {
  let content = fs.readFileSync(path, 'utf8');
  content = content.replace(searchParams, replacement);
  fs.writeFileSync(path, content, 'utf8');
}

// Use \uFFFD since the literal character doesn't copy perfectly in some encodings
replaceFile('src/App.jsx', /message: '[\uFFFD]+\s*[\uFFFD]+\s*[\uFFFD]+\s*[\uFFFD]+\s*[\uFFFD]+\s*[\uFFFD]+\.'/, "message: 'عذراً الرصيد غير كافٍ لإتمام العملية.'");
replaceFile('src/components/CafeteriaView.jsx', /message: '[\uFFFD]+\s+[\uFFFD]+\s+[\uFFFD]+\s+[\uFFFD]+\s+[\uFFFD]+\s+[\uFFFD]+\s+[\uFFFD]+\s+[\uFFFD]+\.'/, "message: 'عذراً لا يمكنك إضافة المزيد من هذا الصنف.'");
replaceFile('src/components/CafeteriaView.jsx', /message: '[\uFFFD]+\s+[\uFFFD]+\.'/, "message: 'عذراً، الكمية غير متوفرة.'");
replaceFile('src/components/TeacherDashboard.jsx', /message: '[\uFFFD]+\s+[\uFFFD]+\s+[\uFFFD]+'/, "message: 'يرجى اختيار الفصل'");
replaceFile('src/components/AdminSmartAttendance.jsx', /message: '[\uFFFD]+\s+[\uFFFD]+\s+[\uFFFD]+\s+[\uFFFD]+\.'/, "message: 'تم حفظ البيانات بنجاح.'");
replaceFile('src/components/AdminSmartAttendance.jsx', /message: '[\uFFFD]+\s+[\uFFFD]+\s+[\uFFFD]+\s+[\uFFFD]+\.'/, "message: 'تم تحديث البيانات بنجاح.'");

console.log('Fixed garbled strings!');
