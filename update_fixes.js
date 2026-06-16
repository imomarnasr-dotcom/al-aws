const fs = require('fs');

const path = 'c:/al aws done/moo_project/src/components/CafeteriaAdminDashboard.jsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Import mooPrompt
content = content.replace("import { mooConfirm } from './ConfirmManager';", "import { mooConfirm, mooPrompt } from './ConfirmManager';");

// 2. Fix handleRefundOrder's window.confirm
const oldRefund = `  const handleRefundOrder = async (orderId) => {
    if(!window.confirm('هل أنت متأكد من استرجاع هذا الطلب؟ (سيتم إعادة المبلغ للطالب وإلغاء العملية)')) return;`;
// Note: powershell or file encoding might have weird characters for Arabic. 
// Let's replace using regex targeting window.confirm specifically.
content = content.replace(/if\(!window\.confirm\([^)]+\)\) return;/g, "if(!(await mooConfirm('هل أنت متأكد من استرجاع هذا الطلب؟ (سيتم إعادة المبلغ للطالب وإلغاء العملية)'))) return;");

// 3. Fix End Shift Password
const oldEndShift = "if(!(await mooConfirm('هل أنت متأكد من إنهاء اليوم؟ سيتم إلغاء الطلبات المعلقة وخصم ريال غرامة للطلبات غير المستلمة.'))) return;";
const newEndShift = `if(!(await mooConfirm('هل أنت متأكد من إنهاء اليوم؟ سيتم إلغاء الطلبات المعلقة وخصم ريال غرامة للطلبات الجاهزة وغير المستلمة.'))) return;
     
     const pwd = await mooPrompt('أدخل رمز المرور لإنهاء الدوام:');
     if (pwd !== '1234') {
        window.dispatchEvent(new CustomEvent('moo-toast', { detail: { message: 'رمز المرور غير صحيح!', type: 'error' } }));
        return;
     }`;
content = content.replace(oldEndShift, newEndShift);

// 4. Update the POS items mapping to gray out items with quantity <= 0
// The original line: menu.filter(m => m.quantity > 0).length === 0
// Replace with: menu.length === 0
content = content.replace("menu.filter(m => m.quantity > 0).length === 0", "menu.length === 0");
// The original map: menu.filter(m => m.quantity > 0).map(item => (
// Replace with: menu.map(item => (
content = content.replace("menu.filter(m => m.quantity > 0).map(item => (", "menu.map(item => (");

// Add disabled class and disabled attribute if item.quantity <= 0
const oldButton = `<button key={item.id} onClick={() => addToCart(item)}
                              className="shrink-0 bg-slate-50 hover:bg-orange-50 border border-slate-100 hover:border-orange-200 rounded-2xl p-3 flex flex-col items-center gap-2 transition-all group w-24">`;
const newButton = `<button key={item.id} onClick={() => item.quantity > 0 && addToCart(item)}
                              disabled={item.quantity <= 0}
                              className={\`shrink-0 rounded-2xl p-3 flex flex-col items-center gap-2 transition-all group w-24 \${item.quantity <= 0 ? 'bg-slate-100 border-slate-200 opacity-50 cursor-not-allowed grayscale' : 'bg-slate-50 hover:bg-orange-50 border border-slate-100 hover:border-orange-200'}\`}>
                              {item.quantity <= 0 && <div className="absolute top-1 right-1 bg-rose-500 text-white text-[8px] px-1.5 py-0.5 rounded font-black">نفد</div>}`;
content = content.replace(oldButton, newButton);


fs.writeFileSync(path, content, 'utf8');
console.log("Updated Dashboard successfully.");
