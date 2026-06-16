const fs = require('fs');

const path = 'c:/al aws done/moo_project/src/components/CafeteriaAdminDashboard.jsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace("import { mooConfirm, mooPrompt, mooOptions } from './ConfirmManager';", "import { mooConfirm } from './ConfirmManager';");

const newEndShift = `  const handleEndShift = async () => {
     if(!(await mooConfirm('هل أنت متأكد من إنهاء دوام المقصف لليوم؟ سيتم تفريغ الطلبات الحية وحفظ الإيرادات.'))) return;
     
     const pwd = await mooPrompt('أدخل كلمة مرور المقصف لإنهاء الدوام:');
     if (pwd !== '1234') {
        window.dispatchEvent(new CustomEvent('moo-toast', { detail: { message: 'كلمة المرور غير صحيحة!', type: 'error' } }));
        return;
     }
     
     const currentWallets = JSON.parse(localStorage.getItem('moo_wallets')) || {};`;

const oldEndShift = `  const handleEndShift = () => {
    if(window.confirm('هل أنت متأكد من إنهاء دوام المقصف لليوم؟ سيتم تفريغ الطلبات الحية وحفظ الإيرادات.')){
       const currentWallets = JSON.parse(localStorage.getItem('moo_wallets')) || {};`;

// Replace handleEndShift ignoring encoding
content = content.replace(/const handleEndShift = async \(\) => \{[\s\S]*?const currentWallets = JSON\.parse\(localStorage\.getItem\('moo_wallets'\)\) \|\| \{\};/, `const handleEndShift = () => {\n    if(window.confirm('هل أنت متأكد من إنهاء دوام المقصف لليوم؟ سيتم تفريغ الطلبات الحية وحفظ الإيرادات.')){\n       const currentWallets = JSON.parse(localStorage.getItem('moo_wallets')) || {};`);

// Replace mooConfirm back to window.confirm in handleRefundOrder
content = content.replace(/if\(!\(await mooConfirm\('([^']+)'\)\)\) return;/g, "if(!window.confirm('$1')) return;");

fs.writeFileSync(path, content, 'utf8');
console.log("Reverted Cafeteria");
