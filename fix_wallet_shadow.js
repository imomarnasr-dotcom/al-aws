const fs = require('fs');

let content = fs.readFileSync('src/components/AdminDashboard.jsx', 'utf8');

// Replace local definition of wallets inside executeWalletTransaction and other local scopes that shadow state
content = content.replace(/const wallets = JSON\.parse\(localStorage\?\.getItem\?\.\('moo_wallets'\) \|\| '\{\}'\) \|\| \{\};/g, 'const currentWallets = { ...wallets };');
content = content.replace(/const wallets = JSON\.parse\(localStorage\.getItem\('moo_wallets'\) \|\| '\{\}'\) \|\| \{\};/g, 'const currentWallets = { ...wallets };');

// Fix the uses of wallets that we just replaced with currentWallets
content = content.replace(/wallets\[student\?\.id\]/g, 'currentWallets[student?.id]');
content = content.replace(/wallets\[oldId\]/g, 'currentWallets[oldId]');
content = content.replace(/wallets\[editingStudent\.id\]/g, 'currentWallets[editingStudent.id]');
content = content.replace(/delete wallets\[id\];/g, 'delete currentWallets[id];');

// And ensure setWallets uses currentWallets where wallets was shadowed
content = content.replace(/setWallets\(wallets\);/g, 'setWallets(currentWallets);');

// Handle reset wallets in line 2481
content = content.replace(/localStorage\.setItem\('moo_wallets',\s*JSON\.stringify\(resetWallets\)\);/g, '');

fs.writeFileSync('src/components/AdminDashboard.jsx', content, 'utf8');
console.log('Fixed executeWalletTransaction shadowing');
