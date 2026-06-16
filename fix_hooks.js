const fs = require('fs');

// ExamsView
let content = fs.readFileSync('src/components/ExamsView.jsx', 'utf8');
content = content.replace(/const ExamsView = \(\{[\s\S]*?searchQuery = ''\s*\}\) => \{/g, `const ExamsView = ({ studentData, setStudentData, searchQuery = '' }) => {
  const [teacherTests] = useCloudStorage('tests', 'all_data', []);
  const [globalExams] = useCloudStorage('exams', 'all_data', []);
  const [gradesData] = useCloudStorage('grades', 'all_data', {});`);

// Remove any top-level hooks that were injected earlier by mistake in ExamsView
content = content.replace(/^  const \[teacherTests\] = useCloudStorage\('tests', 'all_data', \[\]\);\n  const \[globalExams\] = useCloudStorage\('exams', 'all_data', \[\]\);\n  const \[gradesData\] = useCloudStorage\('grades', 'all_data', \{\}\);\n/gm, '');

fs.writeFileSync('src/components/ExamsView.jsx', content, 'utf8');

// GradesView
let content2 = fs.readFileSync('src/components/GradesView.jsx', 'utf8');
content2 = content2.replace(/const GradesView = \(\{[\s\S]*?searchQuery = ''\s*\}\) => \{/g, `const GradesView = ({ studentData, searchQuery = '' }) => {
  const [gradesData] = useCloudStorage('grades', 'all_data', {});
  const [teacherTests] = useCloudStorage('tests', 'all_data', []);
  const [globalExams] = useCloudStorage('exams', 'all_data', []);
  const [achievementsData] = useCloudStorage('achievements', 'all_data', []);`);

// Remove any top-level hooks that were injected earlier by mistake in GradesView
content2 = content2.replace(/^  const \[gradesData\] = useCloudStorage\('grades', 'all_data', \{\}\);\n  const \[teacherTests\] = useCloudStorage\('tests', 'all_data', \[\]\);\n  const \[globalExams\] = useCloudStorage\('exams', 'all_data', \[\]\);\n  const \[achievementsData\] = useCloudStorage\('achievements', 'all_data', \[\]\);\n/gm, '');

fs.writeFileSync('src/components/GradesView.jsx', content2, 'utf8');

console.log('Fixed hooks scopes!');
