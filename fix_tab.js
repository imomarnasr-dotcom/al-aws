const fs = require('fs');
let content = fs.readFileSync('src/components/TeacherDashboard.jsx', 'utf-8');

const oldRegex = /    if \(gracePeriodMode\) \{\r?\n      const gracePeriods = JSON\.parse\(localStorage\.getItem\('moo_grace_periods'\) \|\| '\[\]'\);\r?\n      const updatedGraces = gracePeriods\.map\(g => g\.id === gracePeriodMode \? \{ \.\.\.g, status: 'pending_admin' \} : g\);\r?\n      localStorage\.setItem\('moo_grace_periods', JSON\.stringify\(updatedGraces\)\);\r?\n      setGracePeriodMode\(null\);\r?\n    \}\r?\n\r?\n    window\.dispatchEvent\(new Event\('storage'\)\);\r?\n    window\.dispatchEvent\(new CustomEvent\('moo-sync'\)\);\r?\n    showToast\('.*?'\);\r?\n    setActiveTab\(gracePeriodMode \? 'tasks' : 'schedule'\);/g;

if (content.match(oldRegex)) {
  content = content.replace(oldRegex, (match) => {
    return match.replace(
      'if (gracePeriodMode) {',
      'const wasGraceMode = !!gracePeriodMode;\n    if (gracePeriodMode) {'
    ).replace(
      "setActiveTab(gracePeriodMode ? 'tasks' : 'schedule');",
      "setActiveTab(wasGraceMode ? 'tasks' : 'schedule');"
    );
  });
  fs.writeFileSync('src/components/TeacherDashboard.jsx', content);
  console.log('Fixed setActiveTab logic');
} else {
  console.log('Pattern not found');
}
