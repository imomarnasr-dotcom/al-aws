const fs = require('fs');

const path = 'c:/al aws done/moo_project/src/components/CafeteriaAdminDashboard.jsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Import mooConfirm
if (!content.includes("import { mooConfirm }")) {
    content = content.replace("import { Html5Qrcode }", "import { Html5Qrcode } from 'html5-qrcode';\\nimport { mooConfirm }");
}

// 2. POS status
content = content.replace(/status: 'pending',\\s*source: 'pos'/g, "status: 'completed',\\n      source: 'pos'");

// 3. handleRefundOrder
content = content.replace("const handleRefundOrder = (orderId) => {", "const handleRefundOrder = async (orderId) => {");
content = content.replace(/if\\(!window\\.confirm\\([^)]+\\)\\) return;/g, "if(!(await mooConfirm('هل أنت متأكد من استرجاع هذا الطلب؟ (سيتم إعادة المبلغ للطالب وإلغاء العملية)'))) return;");

// 4. KDS Functions
const kdsFunctions = `  const handleReadyOrder = (orderId) => {
    const updatedOrders = orders.map(o => o.id === orderId ? { ...o, status: 'ready' } : o);
    updateOrdersState(updatedOrders);
    playSound('success');
    window.dispatchEvent(new CustomEvent('moo-toast', { detail: { message: 'تم تجهيز الطلب وإشعار الطالب!', type: 'success' } }));
  };

  const handleEndShift = async () => {
     if(!(await mooConfirm('هل أنت متأكد من إنهاء اليوم؟ سيتم إلغاء الطلبات المعلقة وخصم ريال غرامة للطلبات غير المستلمة.'))) return;
     
     const currentWallets = JSON.parse(localStorage.getItem('moo_wallets')) || {};
     let currentVault = parseFloat(localStorage.getItem('moo_school_vault')) || 0;
     const txLog = JSON.parse(localStorage.getItem('moo_wallet_transactions')) || [];
     let currentMenu = JSON.parse(localStorage.getItem('moo_cafeteria_menu')) || [];

     let updatedOrders = [...orders];

     updatedOrders = updatedOrders.map(o => {
       if (o.status === 'pending' && o.source === 'student_portal') {
         currentWallets[o.studentId] = (currentWallets[o.studentId] || 0) + o.total;
         currentVault -= o.total;
         txLog.unshift({ id: Date.now()+Math.random(), studentId: o.studentId, studentName: o.studentName, amount: o.total, type: 'add', date: new Date().toISOString(), note: 'إلغاء الطلب (لم يجهز)' });
         if (o.cart && Array.isArray(o.cart)) {
           o.cart.forEach(cItem => {
             currentMenu = currentMenu.map(m => m.id === cItem.id ? { ...m, quantity: m.quantity + cItem.cartQty } : m);
           });
         }
         return { ...o, status: 'cancelled_full_refund' };
       } else if (o.status === 'ready' && o.source === 'student_portal') {
         const penalty = 1;
         const refundAmount = Math.max(0, o.total - penalty);
         if (refundAmount > 0) {
            currentWallets[o.studentId] = (currentWallets[o.studentId] || 0) + refundAmount;
            currentVault -= refundAmount;
            txLog.unshift({ id: Date.now()+Math.random(), studentId: o.studentId, studentName: o.studentName, amount: refundAmount, type: 'add', date: new Date().toISOString(), note: 'استرجاع مع غرامة ترك الطلب' });
         }
         return { ...o, status: 'cancelled_penalty' };
       }
       return o;
     });

     localStorage.setItem('moo_wallets', JSON.stringify(currentWallets));
     localStorage.setItem('moo_school_vault', currentVault.toString());
     localStorage.setItem('moo_wallet_transactions', JSON.stringify(txLog.slice(0, 50)));
     updateMenuState(currentMenu);
     updateOrdersState(updatedOrders.filter(o => o.status === 'completed' || o.source === 'pos'));

     window.dispatchEvent(new Event('storage'));
     window.dispatchEvent(new CustomEvent('moo-toast', { detail: { message: 'تم إنهاء اليوم الدراسي بنجاح!', type: 'success' } }));
  };

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const term = searchOrders.toLowerCase();
      const matchSearch = !term || (o.studentName?.toLowerCase().includes(term)) || (o.studentId?.toLowerCase().includes(term));
      const matchGrade = !filterGrade || o.studentGrade === filterGrade;
      
      if (activeTab === 'orders') {
         if (o.status !== 'pending' && o.status !== 'ready') return false;
      } else if (activeTab === 'delivered') {
         if (o.status !== 'completed' && o.source !== 'pos') return false;
      }
      return matchSearch && matchGrade;
    });
  }, [orders, searchOrders, filterGrade, activeTab]);`;

const filteredOrdersRegex = /const filteredOrders = useMemo\(\(\) => \{[\s\S]*?\}, \[orders, searchOrders, filterGrade\]\);/;
content = content.replace(filteredOrdersRegex, kdsFunctions);

// 5. Tabs
content = content.replace(/\{ id: 'orders', icon: BellRing, label: 'سجل الطلبات' \}/, "{ id: 'orders', icon: BellRing, label: 'الطلبات الحية' },\n              { id: 'delivered', icon: CheckCircle, label: 'تم التسليم' }");
content = content.replace(/\{ id: 'orders', icon: BellRing, label: 'الطلبات الحية' \}/, "{ id: 'orders', icon: BellRing, label: 'الطلبات الحية' },\n              { id: 'delivered', icon: CheckCircle, label: 'تم التسليم' }");
// Clean up duplicate if ran twice
content = content.replace(/\{ id: 'delivered', icon: CheckCircle, label: 'تم التسليم' \},\n              \{ id: 'delivered', icon: CheckCircle, label: 'تم التسليم' \}/g, "{ id: 'delivered', icon: CheckCircle, label: 'تم التسليم' }");

// 6. UI Conditions
content = content.replace("{activeTab === 'orders' && (", "{(activeTab === 'orders' || activeTab === 'delivered') && (");

const oldHeaderRegex = /<div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">[\s\S]*?<BellRing size=\{20\} className="text-orange-500" \/> سجل الطلبات والتجهيز[\s\S]*?<\/h2>/;
const newHeader = `<div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
                  <h2 className="text-lg font-black text-slate-800 flex items-center gap-2 shrink-0">
                    <BellRing size={20} className="text-orange-500" /> {activeTab === "orders" ? "الطلبات الحية (قيد التجهيز)" : "سجل الطلبات المسلمة"}
                  </h2>
                  {activeTab === 'orders' && (
                      <button onClick={handleEndShift} className="shrink-0 px-4 py-2 bg-rose-100 text-rose-600 hover:bg-rose-500 hover:text-white font-bold rounded-xl transition-all shadow-sm text-sm">
                        إنهاء دوام المقصف
                      </button>
                  )}`;
content = content.replace(oldHeaderRegex, newHeader);

// 7. Buttons mapping
const oldBtns = /{order\.source === 'student_portal' && order\.status === 'pending' && \([\s\S]*?<RefreshCcw size=\{14\} \/> استرجاع[\s\S]*?<\/button>/;
const newBtns = `{activeTab === 'orders' && order.status === 'pending' && (
                                <button onClick={() => handleReadyOrder(order.id)} className="flex items-center gap-1 text-xs font-black text-orange-600 hover:text-white bg-orange-100 hover:bg-orange-500 px-3 py-1.5 rounded-lg transition-colors shadow-sm">
                                  <Check size={14} /> تم التجهيز
                                </button>
                              )}
                              {activeTab === 'orders' && order.status === 'ready' && (
                                <button onClick={() => handleDeliverOrder(order.id)} className="flex items-center gap-1 text-xs font-black text-emerald-600 hover:text-white bg-emerald-100 hover:bg-emerald-500 px-3 py-1.5 rounded-lg transition-colors shadow-sm">
                                  <Check size={14} /> تم التسليم
                                </button>
                              )}
                              {activeTab === 'delivered' && (
                                <button onClick={() => handleRefundOrder(order.id)} className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-rose-600 bg-slate-100 hover:bg-rose-50 px-3 py-1.5 rounded-lg transition-colors">
                                  <RefreshCcw size={14} /> استرجاع
                                </button>
                              )}`;
content = content.replace(oldBtns, newBtns);

// 8. Badge mapping
const oldBadges = /{order\.source === 'pos' \? \([\s\S]*?تم التسليم مسبقاً<\/div>\n                        \)}/;
const newBadges = `{order.source === 'pos' ? (
                          <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[9px] font-black px-3 py-1 rounded-bl-xl shadow-sm z-10">بيع مباشر</div>
                        ) : order.status === 'pending' ? (
                          <div className="absolute top-0 right-0 bg-orange-500 text-white text-[9px] font-black px-3 py-1 rounded-bl-xl shadow-sm z-10 animate-pulse">قيد التجهيز</div>
                        ) : order.status === 'ready' ? (
                          <div className="absolute top-0 right-0 bg-indigo-500 text-white text-[9px] font-black px-3 py-1 rounded-bl-xl shadow-sm z-10 animate-pulse">جاهز للاستلام</div>
                        ) : (
                          <div className="absolute top-0 right-0 bg-blue-500 text-white text-[9px] font-black px-3 py-1 rounded-bl-xl shadow-sm z-10">تم التسليم مسبقاً</div>
                        )}`;
content = content.replace(oldBadges, newBadges);

fs.writeFileSync(path, content, 'utf8');
console.log("Successfully updated CafeteriaAdminDashboard.jsx");
