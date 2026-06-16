const fs = require('fs');
let content = fs.readFileSync('src/App.jsx', 'utf8');

content = content.replace(/let wallets = \{\};\s*try \{ wallets = wallets \|\| \{\}; \} catch \{ wallets = \{\}; \}/g, '');
content = content.replace(/if \(wallets\[id\] === undefined\) \{\s*wallets\[id\] = 0;\s*setWallets\(wallets\);\s*\}/g, 'const currentWallets = { ...wallets }; if (currentWallets[id] === undefined) { currentWallets[id] = 0; setWallets(currentWallets); }');

fs.writeFileSync('src/App.jsx', content, 'utf8');
console.log('Fixed wallets zeroing out bug successfully via script.');
