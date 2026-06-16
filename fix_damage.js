const fs = require('fs');
let content = fs.readFileSync('src/components/AdminDashboard.jsx', 'utf8');

// Restore wallets[finalId] = 0;
content = content.replace(/const currentWallets = \{ \.\.\.wallets \};\n\s*\/\/ .*?\n\s*setWallets\(currentWallets\);/g, 'const currentWallets = { ...wallets };\n    currentWallets[finalId] = 0;\n    setWallets(currentWallets);');

// Restore the deleted keys array in handleExportPDF
content = content.replace(/'moo_cafeteria_menu', 'moo_cafeteria_orders', 'moo_notifications',\n\s*'schoolTemplate',/g, "'moo_cafeteria_menu', 'moo_cafeteria_orders', 'moo_notifications',\n    'moo_theme_color', 'moo_spent_points', 'moo_store_purchases',\n    'moo_auto_attendance_enabled', 'moo_announcements', 'moo_phases',\n    'schoolTemplate',");

// Now carefully remove the local storage setWallets by using simple string replacement instead of regex
content = content.replace("try { setWallets(JSON.parse(localStorage.getItem('moo_wallets') || '{}')); } catch { /* */ }", "");

fs.writeFileSync('src/components/AdminDashboard.jsx', content, 'utf8');
console.log('Restored deleted lines and fixed localStorage.getItem overwrites');
