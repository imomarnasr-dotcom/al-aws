const fs = require('fs');
let content = fs.readFileSync('src/App.jsx', 'utf8');

content = content.replace(/const \[studentBalance, setStudentBalance\] = useState\(\(\) => \{[\s\S]*?\}\);/, 
  "const studentBalance = useMemo(() => {\n" +
  "  if (!currentUser || currentUser.role) return 0;\n" +
  "  const currentWallets = wallets || {};\n" +
  "  return currentWallets[currentUser.id || 'AWS-2024-0001'] || 0;\n" +
  "}, [wallets, currentUser]);"
);

content = content.replace(/useEffect\(\(\) => \{\s*if \(currentUser && !currentUser\.role\) \{\s*let wallets = \{\};\s*try \{ wallets = wallets \|\| \{\}; \} catch \{ wallets = \{\}; \}\s*wallets\[currentUser\.id \|\| 'AWS-2024-0001'\] = studentBalance;\s*setWallets\(wallets\);\s*\}\s*\}, \[studentBalance, currentUser\]\);/, '');

fs.writeFileSync('src/App.jsx', content, 'utf8');
console.log('Fixed studentBalance in App.jsx');
