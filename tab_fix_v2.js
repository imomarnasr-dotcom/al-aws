const fs = require('fs');
const path = 'C:\\al aws done\\moo_project\\src\\components\\AdminDashboard.jsx';
let content = fs.readFileSync(path, 'utf8');

// Add employees tab
content = content.replace(
  "{ id: 'staff', label: 'إدارة المعلمين' },",
  "{ id: 'staff', label: 'إدارة المعلمين' },\n                  { id: 'employees', label: 'إدارة الموظفين' },"
);

// Add StudentIdGenerator component rendering
content = content.replace(
  "{activeTab === 'stats' && (",
  "{activeTab === 'id_generator' && <StudentIdGenerator />}\n                    {activeTab === 'stats' && ("
);

// Modify the Staff Tab to only allow Teacher
content = content.replace(
  "{['teacher', 'deputy', 'cafeteria'].map(role => (",
  "{['teacher'].map(role => ("
);

// Find the Staff tab and duplicate it for Employees
// We will look for {/* Staff Tab */} and the end of it
const lines = content.split('\n');
const staffTabStart = lines.findIndex(l => l.includes("{/* Staff Tab */}"));

if (staffTabStart !== -1) {
  // Let's create the Employee tab JSX
  const employeeTab = `
                    {/* Employees Tab */}
                    {activeTab === 'employees' && (
                      <div className="space-y-6">
                        <div className="border-b border-gray-200/50 pb-6">
                          <h2 className="text-2xl font-bold text-gray-900 drop-shadow-sm">👥 إدارة الموظفين والإداريين</h2>
                        </div>
                        <div className="glass-card bg-white/70 rounded-3xl p-8 border border-white/50 space-y-6 shadow-xl">
                          <div>
                            <h3 className="text-lg font-bold text-gray-900 mb-4">➕ إضافة موظف</h3>
                            <form onSubmit={handleAddStaff} className="space-y-4">
                              <div className="bg-white/10 p-1.5 rounded-xl flex gap-1 mb-4">
                                {['deputy', 'cafeteria'].map(role => (
                                  <button key={role} type="button" onClick={() => setNewStaff({ ...newStaff, role })} className={\`flex-1 py-2 rounded-lg text-xs font-bold transition-all \${newStaff.role === role ? 'bg-emerald-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-800'}\`}>
                                    {role === 'deputy' ? 'وكيل' : 'مقصف'}
                                  </button>
                                ))}
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <input type="text" placeholder="اسم الموظف" value={newStaff.name} onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })} className="bg-white/50 border border-white rounded-xl px-4 py-3 text-sm text-gray-900 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all" />
                                <input type="password" placeholder="كلمة المرور" value={newStaff.password} onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })} className="bg-white/50 border border-white rounded-xl px-4 py-3 text-sm text-gray-900 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all" />
                              </div>
                              <button type="submit" className="btn-oversized w-full bg-gradient-to-l from-emerald-600 to-emerald-500 text-white py-3 rounded-xl font-bold shadow-lg shadow-emerald-500/30">
                                حفظ الموظف
                              </button>
                            </form>
                          </div>
                          <div className="border-t border-gray-200/50 pt-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">قائمة الموظفين</h3>
                            <div className="grid grid-cols-2 gap-4">
                              {staffList.filter(s => s.role !== 'teacher').map((s, i) => (
                                <div key={i} className="flex items-center justify-between p-4 backdrop-blur-md bg-white/60 border border-white rounded-2xl group shadow-sm hover:shadow-md transition-shadow">
                                  <div className="flex-1">
                                    <p className="font-bold text-gray-900 text-sm">{s.name}</p>
                                    <p className="text-xs text-emerald-600 font-bold mt-1">{s.role === 'deputy' ? 'وكيل' : 'مقصف'}</p>
                                  </div>
                                  <button onClick={() => handleRemoveStaff(s.id)} className="text-gray-400 hover:text-red-500 bg-white shadow-sm hover:shadow p-2 rounded-xl opacity-0 group-hover:opacity-100 transition-all">
                                    <Trash2 size={18} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
`;
  lines.splice(staffTabStart, 0, employeeTab);
}

// Modify the Staff Tab's list rendering to ONLY show teachers
const updatedContent = lines.join('\n').replace(
  "{staffList.map((s, i) => (",
  "{staffList.filter(s => s.role === 'teacher').map((s, i) => ("
);

fs.writeFileSync(path, updatedContent, 'utf8');
console.log('Tabs fixed successfully with Employees separation');
