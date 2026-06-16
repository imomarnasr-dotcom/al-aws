const fs = require('fs');
const content = fs.readFileSync('C:/al aws done/moo_project/found_full_app_history.txt', 'utf-8');
const lines = content.split('\n').filter(Boolean);
const json = JSON.parse(lines[0]);
fs.writeFileSync('C:/al aws done/moo_project/App_original_backup.jsx', json.content);
console.log('Saved to App_original_backup.jsx');
