const fs = require('fs');

const text = fs.readFileSync('src/components/TeacherDashboard.jsx.backup', 'utf8');

// ==========================================
// DECODE MOJIBAKE
// ==========================================
const win1256CharToByteMap = {};
for (let i = 0; i < 128; i++) win1256CharToByteMap[String.fromCharCode(i)] = i;
const win1256_80FF = [
  0x20AC, 0x067E, 0x201A, 0x0192, 0x201E, 0x2026, 0x2020, 0x2021,
  0x02C6, 0x2030, 0x0679, 0x2039, 0x0152, 0x0686, 0x0698, 0x0688,
  0x06AF, 0x2018, 0x2019, 0x201C, 0x201D, 0x2022, 0x2013, 0x2014,
  0x06A9, 0x2122, 0x0691, 0x203A, 0x0153, 0x200C, 0x200D, 0x06BA,
  0x00A0, 0x060C, 0x00A2, 0x00A3, 0x00A4, 0x00A5, 0x00A6, 0x00A7,
  0x00A8, 0x00A9, 0x06BE, 0x00AB, 0x00AC, 0x00AD, 0x00AE, 0x00AF,
  0x00B0, 0x00B1, 0x00B2, 0x00B3, 0x00B4, 0x00B5, 0x00B6, 0x00B7,
  0x00B8, 0x00B9, 0x061B, 0x00BB, 0x00BC, 0x00BD, 0x00BE, 0x061F,
  0x06C1, 0x0621, 0x0622, 0x0623, 0x0624, 0x0625, 0x0626, 0x0627,
  0x0628, 0x0629, 0x062A, 0x062B, 0x062C, 0x062D, 0x062E, 0x062F,
  0x0630, 0x0631, 0x0632, 0x0633, 0x0634, 0x0635, 0x0636, 0x00D7,
  0x0637, 0x0638, 0x0639, 0x063A, 0x0640, 0x0641, 0x0642, 0x0643,
  0x00E0, 0x0644, 0x00E2, 0x0645, 0x0646, 0x0647, 0x0648, 0x00E7,
  0x00E8, 0x00E9, 0x00EA, 0x00EB, 0x0649, 0x064A, 0x00EE, 0x00EF,
  0x064B, 0x064C, 0x064D, 0x064E, 0x00F4, 0x064F, 0x0650, 0x00F7,
  0x0651, 0x00F9, 0x0652, 0x00FB, 0x00FC, 0x200E, 0x200F, 0x06D2,
];
for (let i = 0; i < win1256_80FF.length; i++) {
  win1256CharToByteMap[String.fromCharCode(win1256_80FF[i])] = 0x80 + i;
}

let code = '';
let i = 0;
while (i < text.length) {
  const ch = text[i];
  if (ch.charCodeAt(0) < 128) {
    code += ch;
    i++;
    continue;
  }
  if (win1256CharToByteMap[ch] !== undefined) {
    const bytes = [];
    let j = i;
    while (j < text.length && win1256CharToByteMap[text[j]] !== undefined) {
      bytes.push(win1256CharToByteMap[text[j]]);
      j++;
    }
    try {
      const decoded = Buffer.from(bytes).toString('utf8');
      if (decoded && !decoded.includes('\uFFFD')) {
        code += decoded;
        i = j;
        continue;
      }
    } catch(e) {}
  }
  code += ch;
  i++;
}

console.log('✅ Decoded mojibake');

// ==========================================
// TASKS TAB INLINE ATTENDANCE
// ==========================================
// 1. Change grace period click handler
const graceClickSearch = "setActiveTab('attendance'); // الانتقال لسجل الحضور لعملية الرصد";
if (code.includes(graceClickSearch)) {
  code = code.replace(graceClickSearch, "// نبقى في نفس تبويب المهام المعلقة - عرض الرصد هنا");
  console.log('✅ Fixed grace click handler');
} else {
  console.log('⚠️ Could not find grace click handler');
}

// 2. Add the inline form
// VERY IMPORTANT: Find the ACTUAL tasks panel, not the tab button!
const tasksStartPattern = "{activeTab === 'tasks' && (";
const tasksIdx = code.indexOf(tasksStartPattern);
if (tasksIdx > -1) {
  const iifeStartSearch = "{(() => {";
  const iifeIdx = code.indexOf(iifeStartSearch, tasksIdx);
  if (iifeIdx > -1) {
    // We found the start of the tasks tab IIFE.
    const inlineForm = `{gracePeriodMode ? (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-br from-purple-50 to-white rounded-[32px] p-8 border border-purple-200">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-white shadow-lg"><Users size={24} /></div>
                      <div>
                        <h3 className="text-xl font-black text-gray-900">رصد غياب: {attendanceClass}</h3>
                        <p className="text-sm text-purple-600 font-bold">📅 تاريخ: {attendanceDate}</p>
                      </div>
                    </div>
                    <button onClick={() => { setGracePeriodMode(null); setAttendanceClass(''); }} className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-sm transition-all flex items-center gap-2">
                      <ArrowLeft size={16} /> العودة للمهام
                    </button>
                  </div>
                  <div className="space-y-3">
                    {students.filter(s => s.className === attendanceClass && (!s.createdAt || !attendanceDate || s.createdAt <= attendanceDate)).length === 0 ? (
                      <div className="text-center py-10 bg-white/50 rounded-2xl border border-dashed border-gray-300">
                        <p className="text-gray-500 font-bold">لا يوجد طلاب مسجلين في هذا الفصل بتاريخ {attendanceDate}</p>
                      </div>
                    ) : (
                      students.filter(s => s.className === attendanceClass && (!s.createdAt || !attendanceDate || s.createdAt <= attendanceDate)).map(student => (
                        <div key={student.id} className={\`flex items-center justify-between p-4 rounded-2xl border transition-all \${student.isExempted ? 'bg-blue-50 border-blue-200' : attendanceMap[student.id] === false || attendanceMap[student.id] === 'ABSENT' ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'}\`}>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-gray-600 font-black text-sm">{(student.name || '?')[0]}</div>
                            <div><p className="font-bold text-gray-900 text-sm">{student.name}</p><p className="text-[10px] text-gray-400 font-bold">{student.id}</p></div>
                          </div>
                          {student.isExempted ? (<span className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-xl text-xs font-black">معفي</span>) : (
                            <div className="flex gap-2">
                              <button onClick={() => setAttendanceMap(prev => ({ ...prev, [student.id]: true }))} className={\`px-4 py-2 rounded-xl text-xs font-black transition-all \${attendanceMap[student.id] !== false && attendanceMap[student.id] !== 'ABSENT' ? 'bg-emerald-500 text-white shadow-lg scale-105' : 'bg-gray-100 text-gray-500 hover:bg-emerald-100'}\`}>حاضر</button>
                              <button onClick={() => setAttendanceMap(prev => ({ ...prev, [student.id]: false }))} className={\`px-4 py-2 rounded-xl text-xs font-black transition-all \${attendanceMap[student.id] === false || attendanceMap[student.id] === 'ABSENT' ? 'bg-red-500 text-white shadow-lg scale-105' : 'bg-gray-100 text-gray-500 hover:bg-red-100'}\`}>غائب</button>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                  <div className="flex gap-4 mt-8">
                    <button onClick={markAllPresent} className="flex-1 py-3.5 bg-emerald-100 text-emerald-700 rounded-2xl font-black text-sm hover:bg-emerald-200 transition-all">✅ تحديد الكل حاضر</button>
                    <button onClick={() => setConfirmModalData({ type: 'attendance' })} className="flex-1 py-3.5 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-2xl font-black text-sm hover:shadow-xl transition-all">📤 اعتماد وإرسال</button>
                  </div>
                </motion.div>
              ) : (
              (() => {`;

    code = code.substring(0, iifeIdx) + inlineForm + code.substring(iifeIdx + "{(() => {".length);
    
    // Now we need to close the ternary at the end of this IIFE.
    // The IIFE ends with `})()}`
    const endStr = "})()}";
    const inlineStart = iifeIdx + inlineForm.length;
    // We expect the IIFE to end somewhere after `اضغط لبدء عملية الرصد الآن`
    const btnText = "اضغط لبدء عملية الرصد الآن";
    const btnIdx = code.indexOf(btnText, inlineStart);
    if (btnIdx > -1) {
      const endIdx = code.indexOf(endStr, btnIdx);
      if (endIdx > -1) {
        code = code.substring(0, endIdx) + "})()\n              )}" + code.substring(endIdx + endStr.length);
        console.log('✅ Added inline form and closed ternary');
      } else {
        console.log('⚠️ Could not find IIFE end');
      }
    } else {
      console.log('⚠️ Could not find button text in IIFE');
    }
  } else {
    console.log('⚠️ Could not find IIFE start');
  }
} else {
  console.log('⚠️ Could not find tasks tab start');
}

// ==========================================
// NEW STUDENT FILTER
// ==========================================
// Replace generic `students.filter(s => s.className === attendanceClass)` with date check
const oldFilter = "students.filter(s => s.className === attendanceClass)";
const newFilter = "students.filter(s => s.className === attendanceClass && (!s.createdAt || !attendanceDate || s.createdAt <= attendanceDate))";
let count = 0;
while (code.includes(oldFilter)) {
  code = code.replace(oldFilter, newFilter);
  count++;
}
console.log(`✅ Replaced filter ${count} times`);

fs.writeFileSync('src/components/TeacherDashboard.jsx', code, 'utf8');
console.log('✅ Fix complete.');
