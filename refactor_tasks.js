const fs = require('fs');
let code = fs.readFileSync('src/components/TeacherDashboard.jsx', 'utf8');

// 1. Change navigation target
code = code.replace(
  "setActiveTab(wasGraceMode ? 'tasks' : 'schedule');",
  "setActiveTab(wasGraceMode ? 'attendance' : 'schedule');"
);

// 2. Remove nav button
code = code.replace(
  /<button onClick=\{\(\) => setActiveTab\('tasks'\)\}.*?المهام المعلقة<\/button>\n?/g,
  ""
);

// 3. Insert grace periods into attendance tab
const gracePeriodsCode = `
              {(() => {
                const gracePeriods = JSON.parse(localStorage.getItem('moo_grace_periods') || '[]');
                const myGracePeriods = gracePeriods.filter(g => g.teacher === teacherProfile.name && (!g.status || g.status === 'pending_teacher'));
                if (myGracePeriods.length > 0) {
                  return (
                    <div className="mb-10 bg-gradient-to-br from-purple-50 to-white p-8 rounded-[32px] border border-purple-100 shadow-sm">
                      <h4 className="text-lg font-black text-purple-900 mb-6 flex items-center gap-2">
                        <AlertCircle size={24} className="text-purple-600" /> المهام المعلقة (نسيان الغياب):
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {myGracePeriods.map((grace, idx) => (
                          <button key={idx} onClick={() => {
                            setGracePeriodMode(grace.id);
                            setAttendanceClass(grace.classCode);
                            setAttendanceDate(grace.date);
                          }} className="bg-white border border-purple-200 hover:border-purple-400 hover:shadow-xl hover:-translate-y-1 p-6 rounded-[24px] text-right transition-all flex flex-col group">
                            <div className="flex justify-between items-center w-full mb-4">
                              <span className="text-2xl font-black text-purple-900">{grace.classCode}</span>
                              <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-bold">مهمة عاجلة</span>
                            </div>
                            <p className="text-gray-600 font-bold text-sm mb-6 flex items-center gap-2"><Calendar size={16} /> غياب منسي: <span className="text-gray-900">{grace.date}</span></p>
                            <div className="mt-auto flex items-center gap-2 text-purple-600 font-black text-sm group-hover:gap-3 transition-all">
                              <span>بدء عملية الرصد</span> <ArrowLeft size={16} />
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                }
                return null;
              })()}
`;

code = code.replace(
  /(\s*\}\)\(\)\}\s+)(?=\{attendanceClass && \()/g,
  "$1" + gracePeriodsCode + "\n              "
);

// 4. Remove Tasks tab block
// The Tasks block starts with "{/* TAB: PENDING TASKS */}" and ends right before "{/* 🔥 إضافة: تاب طلبات التبديل */}"
const startIdx = code.indexOf("{/* TAB: PENDING TASKS */}");
const endIdx = code.indexOf("{/* 🔥 إضافة: تاب طلبات التبديل */}");
if (startIdx !== -1 && endIdx !== -1) {
  code = code.slice(0, startIdx) + code.slice(endIdx);
}

fs.writeFileSync('src/components/TeacherDashboard.jsx', code);
console.log('Refactoring complete!');
