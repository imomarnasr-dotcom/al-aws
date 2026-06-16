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

// Let's modify the Staff Tab to only allow Teacher
// Currently it maps: {['teacher', 'deputy', 'cafeteria'].map(role => ... )}
content = content.replace(
  "{['teacher', 'deputy', 'cafeteria'].map(role => (",
  "{['teacher'].map(role => ("
);

fs.writeFileSync(path, content, 'utf8');
console.log('Tabs fixed successfully');
