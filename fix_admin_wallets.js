const fs = require('fs');
let content = fs.readFileSync('src/components/AdminDashboard.jsx', 'utf8');

// replace wallets useState with useCloudStorage
content = content.replace(/const \[wallets, setWallets\] = useState\(\(\) => \{[\s\S]*?\}\);/, "const [wallets, setWallets] = useCloudStorage('wallets', 'all_data', {});");

// fix wallet transactions
content = content.replace(/const \[walletTransactions, setWalletTransactions\] = useState\(\(\) => \{[\s\S]*?\}\);/, "const [walletTransactions, setWalletTransactions] = useCloudStorage('wallet_transactions', 'all_data', []);");

// check import
content = content.replace(/import \{ useCloudStorage \} from '\.\.\/services\/useCloudStorage';/, "import useCloudStorage from '../services/useCloudStorage';");

// remove localStorage.setItem('moo_wallets', JSON.stringify(wallets)) inside executeWalletTransaction and other places
content = content.replace(/localStorage\?\.setItem\?\.\('moo_wallets',\s*JSON\.stringify\(wallets\)\);/g, '');
content = content.replace(/localStorage\.setItem\('moo_wallets',\s*JSON\.stringify\(wallets\)\);/g, '');

// remove localStorage.setItem('moo_wallet_transactions')
content = content.replace(/localStorage\?\.setItem\?\.\('moo_wallet_transactions',\s*JSON\.stringify\(updatedTransactions\)\);/g, '');
content = content.replace(/localStorage\.setItem\('moo_wallet_transactions',\s*JSON\.stringify\(updatedTransactions\)\);/g, '');

fs.writeFileSync('src/components/AdminDashboard.jsx', content, 'utf8');
console.log('Fixed wallets in AdminDashboard');
