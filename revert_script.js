const fs = require('fs');

const pathCafeteria = 'c:/al aws done/moo_project/src/components/CafeteriaAdminDashboard.jsx';
let catContent = fs.readFileSync(pathCafeteria, 'utf8');

// 1. Revert import
catContent = catContent.replace("import { mooConfirm, mooPrompt, mooOptions } from './ConfirmManager';", "import { mooOptions } from './ConfirmManager';");
catContent = catContent.replace("import { mooConfirm } from './ConfirmManager';", "import { mooConfirm } from 'html5-qrcode';"); // Wait, previously it was import { Html5Qrcode } from 'html5-qrcode'; 
// Let's just fix the import block to match exactly what they had before my touch.
catContent = catContent.replace(/import \{ Html5Qrcode \} from 'html5-qrcode';[\s\S]*?import PropTypes from 'prop-types';/, "import { Html5Qrcode } from 'html5-qrcode';\nimport PropTypes from 'prop-types';");

// 2. Revert handleEndShift
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

// I need to use regex because the Arabic encoding might fail exact match
const regexEndShift = /const handleEndShift = async \(\) => \{[\s\S]*?const currentWallets = JSON\.parse/;
catContent = catContent.replace(regexEndShift, `const handleEndShift = () => {\n    if(window.confirm('?? ??? ????? ?? ????? ?????? ?????? ???? ????? ?????? ??????? ??? ???? ?????.')){\n       const currentWallets = JSON.parse`);


// 3. Revert slice(0, 20)
// wait, I never successfully removed it because my update_cafeteria.js failed on that step! Let me check if slice is there.
if (!catContent.includes('slice(0, 20)')) {
   catContent = catContent.replace(/return matchSearch && matchGrade;\n    \}\);/, "return matchSearch && matchGrade;\n    }).slice(0, 20);");
}

// 4. Revert POS buttons and Badges
// Wait, my update_cafeteria.js FAILED on step 4! So the POS buttons are ALREADY the old ones!
// I will not touch them.

// 5. Revert handleRefundOrder
// Wait, in handleRefundOrder, I used mooConfirm instead of window.confirm. Let's revert it.
const regexRefund = /if\(!\(await mooConfirm\('?? ??? ????? ?? ??????? ??? ?????\?'\)\)\) return;/;
catContent = catContent.replace(regexRefund, "if(!window.confirm('?? ??? ????? ?? ??????? ??? ??????')) return;");

fs.writeFileSync(pathCafeteria, catContent, 'utf8');

const pathConfirm = 'c:/al aws done/moo_project/src/components/ConfirmManager.jsx';
let confirmContent = fs.readFileSync(pathConfirm, 'utf8');

// remove mooPrompt export
const promptRegex = /export const mooPrompt = \(\(message\)?\s*=>\s*\{[\s\S]*?\}\);?\s*\}\)?;/g;
confirmContent = confirmContent.replace(/export const mooPrompt = \(message\) => \{[\s\S]*?\}\);?\n\n/m, "");

fs.writeFileSync(pathConfirm, confirmContent, 'utf8');

console.log("Successfully reverted changes!");
