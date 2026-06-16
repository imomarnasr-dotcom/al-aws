const fs = require('fs');

let text = fs.readFileSync('src/components/TeacherDashboard.jsx', 'utf8');

const replacements = {
  'âœ…': '✅',
  'â‌Œ': '❌',
  'âœڈï¸ڈ': '✏️',
  'âڑ ï¸ڈ': '⚠️',
  'â€”': '—'
};

let count = 0;
for (const [bad, good] of Object.entries(replacements)) {
  const regex = new RegExp(bad, 'g');
  const matches = text.match(regex);
  if (matches) {
    count += matches.length;
    text = text.replace(regex, good);
  }
}

if (count > 0) {
  fs.writeFileSync('src/components/TeacherDashboard.jsx', text, 'utf8');
  console.log(`✅ Replaced ${count} emoji mojibakes!`);
} else {
  console.log('No emoji mojibakes found.');
}
