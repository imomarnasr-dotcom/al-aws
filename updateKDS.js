const fs = require('fs');

const path = 'c:/al aws done/moo_project/src/components/CafeteriaAdminDashboard.jsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Import mooConfirm
if (!content.includes('mooConfirm')) {
    content = content.replace("import { Html5Qrcode } from 'html5-qrcode';", "import { Html5Qrcode } from 'html5-qrcode';\nimport { mooConfirm } from './ConfirmManager';");
}

// 2. Fix POS order status
content = content.replace("status: 'pending',\n      source: 'pos'", "status: 'completed',\n      source: 'pos'");

// 3. Make handleRefundOrder async and use mooConfirm
content = content.replace("const handleRefundOrder = (orderId) => {", "const handleRefundOrder = async (orderId) => {");
content = content.replace(/if\(!window\.confirm\([^)]+\)\) return;/g, "if(!(await mooConfirm('Â· √‰  „ √ﬂœ „‰ «” —Ã«⁄ Â–« «·ÿ·»ø (”Ì „ ≈⁄«œ… «·„»·€ ··ÿ«·» Ê≈·€«¡ «·⁄„·Ì…)'))) return;");

// 4. Update the filteredOrders variable
const oldFilteredOrders =   const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const term = searchOrders.toLowerCase();
      const matchSearch = !term || (o.studentName?.toLowerCase().includes(term)) || (o.studentId?.toLowerCase().includes(term));
      const matchGrade = !filterGrade || o.studentGrade === filterGrade;
      return matchSearch && matchGrade;
    });
  }, [orders, searchOrders, filterGrade]);;

const newFilteredOrders =   const handleReadyOrder = (orderId) => {
    const updatedOrders = orders.map(o => o.id === orderId ? { ...o, status: 'ready' } : o);
    updateOrdersState(updatedOrders);
    playSound('success');
    window.dispatchEvent(new CustomEvent('moo-toast', { detail: { message: ' „  ÃÂÌ“ «·ÿ·»!', type: 'success' } }));
  };

  const handleEndShift = async () => {
     if(!(await mooConfirm('Â· √‰  „ √ﬂœ „‰ ≈‰Â«¡ «·ÌÊ„ø ”Ì „ ≈·€«¡ «·ÿ·»«  «·„⁄·ﬁ… ÊŒ’„ —Ì«· €—«„… ··ÿ·»«  «·Ã«Â“… Ê€Ì— «·„” ·„….'))) return;
     
     const currentWallets = JSON.parse(localStorage.getItem('moo_wallets')) || {};
     let currentVault = parseFloat(localStorage.getItem('moo_school_vault')) || 0;
     const txLog = JSON.parse(localStorage.getItem('moo_wallet_transactions')) || [];
     let currentMenu = JSON.parse(localStorage.getItem('moo_cafeteria_menu')) || [];

     let updatedOrders = [...orders];

     updatedOrders = updatedOrders.map(o => {
       if (o.status === 'pending' && o.source === 'student_portal') {
         currentWallets[o.studentId] = (currentWallets[o.studentId] || 0) + o.total;
         currentVault -= o.total;
         txLog.unshift({ id: Date.now()+Math.random(), studentId: o.studentId, studentName: o.studentName, amount: o.total, type: 'add', date: new Date().toISOString(), note: '≈·€«¡ «·ÿ·» (·„ ÌÃÂ“)' });
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
            txLog.unshift({ id: Date.now()+Math.random(), studentId: o.studentId, studentName: o.studentName, amount: refundAmount, type: 'add', date: new Date().toISOString(), note: '«” —Ã«⁄ „⁄ €—«„…  —ﬂ «·ÿ·»' });
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
     window.dispatchEvent(new CustomEvent('moo-toast', { detail: { message: ' „ ≈‰Â«¡ «·ÌÊ„ «·œ—«”Ì »‰Ã«Õ!', type: 'success' } }));
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
  }, [orders, searchOrders, filterGrade, activeTab]);;

if (content.includes('const filteredOrders = useMemo(() => {')) {
    // Replace the exact block
    const regex = /const filteredOrders = useMemo\(\(\) => \{[\s\S]*?\}, \[orders, searchOrders, filterGrade\]\);/;
    content = content.replace(regex, newFilteredOrders);
}

// 5. Update tabs array
content = content.replace("{ id: 'inventory', icon: Package, label: '«·„Œ“Ê‰ Ê«·ﬁ«∆„…' },\n              { id: 'orders', icon: BellRing, label: '«·ÿ·»«  «·ÕÌ…' }", "{ id: 'inventory', icon: Package, label: '«·„Œ“Ê‰ Ê«·ﬁ«∆„…' },\n              { id: 'orders', icon: BellRing, label: '«·ÿ·»«  «·ÕÌ…' },\n              { id: 'delivered', icon: CheckCircle, label: ' „ «· ”·Ì„' }");
// In case the label was "”Ã· «·ÿ·»« "
content = content.replace("{ id: 'inventory', icon: Package, label: '«·„Œ“Ê‰ Ê«·ﬁ«∆„…' },\n              { id: 'orders', icon: BellRing, label: '”Ã· «·ÿ·»« ' }", "{ id: 'inventory', icon: Package, label: '«·„Œ“Ê‰ Ê«·ﬁ«∆„…' },\n              { id: 'orders', icon: BellRing, label: '«·ÿ·»«  «·ÕÌ…' },\n              { id: 'delivered', icon: CheckCircle, label: ' „ «· ”·Ì„' }");

// 6. Update the Orders Tab UI to show Delivered Tab as well
const ordersTabPattern = "{activeTab === 'orders' && (";
const bothTabsPattern = "{(activeTab === 'orders' || activeTab === 'delivered') && (";
content = content.replace(ordersTabPattern, bothTabsPattern);

// 7. Dynamic title based on tab
content = content.replace('<BellRing size={20} className="text-orange-500" /> ”Ã· «·ÿ·»«  Ê«· ÃÂÌ“', '<BellRing size={20} className="text-orange-500" /> {activeTab === "orders" ? "«·ÿ·»«  «·ÕÌ… (ﬁÌœ «· ÃÂÌ“)" : "”Ã· «·ÿ·»«  «·„”·„…"}');

// 8. Add End Shift button
const searchFilterHeader = '<div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">';
const searchFilterHeaderWithEndShift = <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
                  <h2 className="text-lg font-black text-slate-800 flex items-center gap-2 shrink-0">
                    <BellRing size={20} className="text-orange-500" /> {activeTab === "orders" ? "«·ÿ·»«  «·ÕÌ… (ﬁÌœ «· ÃÂÌ“)" : "”Ã· «·ÿ·»«  «·„”·„…"}
                  </h2>
                  <div className="flex w-full md:w-auto items-center gap-3">
                    {activeTab === 'orders' && (
                      <button onClick={handleEndShift} className="px-4 py-2 bg-rose-100 text-rose-600 hover:bg-rose-500 hover:text-white font-bold rounded-xl transition-all shadow-sm text-sm whitespace-nowrap">
                        ≈‰Â«¡ œÊ«„ «·„ﬁ’›
                      </button>
                    )};

// Wait, replacing the header... Let's just find the h2 and replace it.
const h2Regex = /<h2 className="text-lg font-black text-slate-800 flex items-center gap-2 shrink-0">[\s\S]*?<\/h2>/;
content = content.replace(h2Regex, ''); // remove old h2

const h2Replacement = <h2 className="text-lg font-black text-slate-800 flex items-center gap-2 shrink-0">
                    <BellRing size={20} className="text-orange-500" /> {activeTab === "orders" ? "«·ÿ·»«  «·ÕÌ… (ﬁÌœ «· ÃÂÌ“)" : "”Ã· «·ÿ·»«  «·„”·„…"}
                  </h2>
                  {activeTab === 'orders' && (
                      <button onClick={handleEndShift} className="shrink-0 px-4 py-2 bg-rose-100 text-rose-600 hover:bg-rose-500 hover:text-white font-bold rounded-xl transition-all shadow-sm text-sm">
                        ≈‰Â«¡ œÊ«„ «·„ﬁ’›
                      </button>
                  )};
content = content.replace('<div className="flex w-full md:w-auto items-center gap-3">', h2Replacement + '\\n                  <div className="flex w-full md:w-auto items-center gap-3">');

// 9. Update buttons in mapping
const buttonMapping =                               {order.source === 'student_portal' && order.status === 'pending' && (
                                <button onClick={() => handleDeliverOrder(order.id)} className="flex items-center gap-1 text-xs font-black text-emerald-600 hover:text-white bg-emerald-100 hover:bg-emerald-500 px-3 py-1.5 rounded-lg transition-colors shadow-sm">
                                  <Check size={14} />  ÃÂÌ“ Ê ”·Ì„
                                </button>
                              )}
                              <button onClick={() => handleRefundOrder(order.id)} className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-rose-600 bg-slate-100 hover:bg-rose-50 px-3 py-1.5 rounded-lg transition-colors">
                                <RefreshCcw size={14} /> «” —Ã«⁄
                              </button>;

const newButtonMapping =                               {activeTab === 'orders' && order.status === 'pending' && (
                                <button onClick={() => handleReadyOrder(order.id)} className="flex items-center gap-1 text-xs font-black text-orange-600 hover:text-white bg-orange-100 hover:bg-orange-500 px-3 py-1.5 rounded-lg transition-colors shadow-sm">
                                  <Check size={14} />  „ «· ÃÂÌ“
                                </button>
                              )}
                              {activeTab === 'orders' && order.status === 'ready' && (
                                <button onClick={() => handleDeliverOrder(order.id)} className="flex items-center gap-1 text-xs font-black text-emerald-600 hover:text-white bg-emerald-100 hover:bg-emerald-500 px-3 py-1.5 rounded-lg transition-colors shadow-sm">
                                  <Check size={14} />  „ «· ”·Ì„
                                </button>
                              )}
                              {activeTab === 'delivered' && (
                                <button onClick={() => handleRefundOrder(order.id)} className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-rose-600 bg-slate-100 hover:bg-rose-50 px-3 py-1.5 rounded-lg transition-colors">
                                  <RefreshCcw size={14} /> «” —Ã«⁄
                                </button>
                              )};

content = content.replace(buttonMapping, newButtonMapping);

// Also need to adjust the badge mapping to include 'ready' status
const badgeMapping =                         {order.source === 'pos' ? (
                          <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[9px] font-black px-3 py-1 rounded-bl-xl shadow-sm z-10">»Ì⁄ „»«‘—</div>
                        ) : order.status === 'pending' ? (
                          <div className="absolute top-0 right-0 bg-orange-500 text-white text-[9px] font-black px-3 py-1 rounded-bl-xl shadow-sm z-10 animate-pulse">ﬁÌœ «· ÃÂÌ“</div>
                        ) : (
                          <div className="absolute top-0 right-0 bg-blue-500 text-white text-[9px] font-black px-3 py-1 rounded-bl-xl shadow-sm z-10"> „ «· ”·Ì„ „”»ﬁ«</div>
                        )};

const newBadgeMapping =                         {order.source === 'pos' ? (
                          <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[9px] font-black px-3 py-1 rounded-bl-xl shadow-sm z-10">»Ì⁄ „»«‘—</div>
                        ) : order.status === 'pending' ? (
                          <div className="absolute top-0 right-0 bg-orange-500 text-white text-[9px] font-black px-3 py-1 rounded-bl-xl shadow-sm z-10 animate-pulse">ﬁÌœ «· ÃÂÌ“</div>
                        ) : order.status === 'ready' ? (
                          <div className="absolute top-0 right-0 bg-indigo-500 text-white text-[9px] font-black px-3 py-1 rounded-bl-xl shadow-sm z-10 animate-pulse">Ã«Â“ ··«” ·«„</div>
                        ) : (
                          <div className="absolute top-0 right-0 bg-blue-500 text-white text-[9px] font-black px-3 py-1 rounded-bl-xl shadow-sm z-10"> „ «· ”·Ì„ „”»ﬁ«</div>
                        )};

content = content.replace(badgeMapping, newBadgeMapping);

fs.writeFileSync(path, content, 'utf8');
