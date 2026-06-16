const fs = require('fs');

// 1. Edit App.jsx to add cafeteria_notifications and trigger it on checkout
let appContent = fs.readFileSync('src/App.jsx', 'utf8');

if (!appContent.includes('cafeteria_notifications')) {
  // Add state
  appContent = appContent.replace(
    /const \[cafeteriaOrders, setCafeteriaOrders\] = useCloudStorage\('cafeteria_orders', 'all_data', \[\]\);/,
    "const [cafeteriaOrders, setCafeteriaOrders] = useCloudStorage('cafeteria_orders', 'all_data', []);\n  const [cafeteriaNotifs, setCafeteriaNotifs] = useCloudStorage('cafeteria_notifications', 'all_data', []);"
  );
  
  // Update confirmPurchase
  appContent = appContent.replace(
    /setCart\(\[\]\);\s*setIsCartOpen\(false\);/,
    `setCart([]);
      setIsCartOpen(false);

      // Notify Cafeteria Admin
      const newNotif = {
        id: Date.now(),
        title: 'طلب جديد!',
        text: \`تم استلام طلب جديد بقيمة \${cartTotal} ريال من الطالب \${currentUser?.name || 'غير معروف'}\`,
        date: new Date().toISOString(),
        isNew: true
      };
      setCafeteriaNotifs([newNotif, ...(cafeteriaNotifs || [])].slice(0, 50));`
  );
  
  fs.writeFileSync('src/App.jsx', appContent, 'utf8');
  console.log('App.jsx updated with cafeteria_notifications');
} else {
  console.log('App.jsx already has cafeteria_notifications');
}

// 2. Edit CafeteriaAdminDashboard.jsx
let adminContent = fs.readFileSync('src/components/CafeteriaAdminDashboard.jsx', 'utf8');

if (!adminContent.includes('cafeteria_notifications')) {
  // Add states
  adminContent = adminContent.replace(
    /const \[orders, setOrders\] = useCloudStorage\('cafeteria_orders', 'all_data', \[\]\);/,
    `const [orders, setOrders] = useCloudStorage('cafeteria_orders', 'all_data', []);
  const [studentNotifs, setStudentNotifs] = useCloudStorage('student_notifications', 'all_data', {});
  const [cafeteriaNotifs, setCafeteriaNotifs] = useCloudStorage('cafeteria_notifications', 'all_data', []);
  const [showNotifs, setShowNotifs] = useState(false);`
  );
  
  // Fix handleReadyOrder to notify student
  adminContent = adminContent.replace(
    /const handleReadyOrder = \(orderId\) => \{\s*const updatedOrders = orders\.map\(o => o\.id === orderId \? \{ \.\.\.o, status: 'ready' \} : o\);/,
    `const handleReadyOrder = (orderId) => {
    const order = orders.find(o => o.id === orderId);
    const updatedOrders = orders.map(o => o.id === orderId ? { ...o, status: 'ready' } : o);
    
    if (order && order.studentId) {
      const notifs = { ...studentNotifs };
      if (!notifs[order.studentId]) notifs[order.studentId] = [];
      notifs[order.studentId].unshift({
        id: 'cafeteria_ready_' + Date.now(),
        icon: '🍔',
        title: 'طلبك جاهز!',
        text: \`طلب المقصف الخاص بك جاهز للاستلام الآن! (رقم الطلب: \${order.id.toString().slice(-4)})\`,
        isNew: true,
        date: new Date().toISOString()
      });
      setStudentNotifs(notifs);
    }`
  );
  
  // Fix header to show notification bell
  adminContent = adminContent.replace(
    /<\/div>\s*<button onClick=\{onLogout\}/,
    `</div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <button onClick={() => { setShowNotifs(!showNotifs); setCafeteriaNotifs((cafeteriaNotifs || []).map(n => ({...n, isNew: false}))); }} className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-600 transition-colors relative">
                  <BellRing size={20} />
                  {(cafeteriaNotifs || []).filter(n => n.isNew).length > 0 && (
                    <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-rose-500 rounded-full animate-ping"></span>
                  )}
                  {(cafeteriaNotifs || []).filter(n => n.isNew).length > 0 && (
                    <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white"></span>
                  )}
                </button>
                
                {showNotifs && (
                  <div className="absolute left-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50">
                    <div className="p-4 border-b border-slate-50 bg-slate-50/50">
                      <h3 className="font-bold text-slate-800">الإشعارات</h3>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {(!cafeteriaNotifs || cafeteriaNotifs.length === 0) ? (
                        <div className="p-6 text-center text-slate-400 text-sm">لا توجد إشعارات حالياً</div>
                      ) : (
                        cafeteriaNotifs.map(n => (
                          <div key={n.id} className="p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors text-right">
                            <p className="text-sm font-bold text-slate-800 mb-1">{n.title}</p>
                            <p className="text-xs text-slate-500">{n.text}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
              <button onClick={onLogout}`
  );
  
  // Fix tabs to add pendingCount badge
  adminContent = adminContent.replace(
    /\{ id: 'orders', icon: BellRing, label: 'طلبات الطلاب' \}/,
    `{ id: 'orders', icon: BellRing, label: 'طلبات الطلاب', count: (orders || []).filter(o => o.status === 'pending').length }`
  );
  
  // Add badge rendering to tabs
  adminContent = adminContent.replace(
    /className=\{\`flex items-center gap-2 px-6 py-4 rounded-2xl font-bold transition-all whitespace-nowrap\n\s*\$\{activeTab === t\.id \? 'bg-slate-800 text-white shadow-lg shadow-slate-200' : 'bg-white text-slate-500 hover:bg-slate-50'\}\`\}>\n\s*<t\.icon size=\{18\} \/> \{t\.label\}/,
    `className={\`flex items-center gap-2 px-6 py-4 rounded-2xl font-bold transition-all whitespace-nowrap
                        \${activeTab === t.id ? 'bg-slate-800 text-white shadow-lg shadow-slate-200' : 'bg-white text-slate-500 hover:bg-slate-50'}\`}>
                        <t.icon size={18} /> {t.label}
                        {t.count > 0 && <span className="bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">{t.count}</span>}`
  );

  fs.writeFileSync('src/components/CafeteriaAdminDashboard.jsx', adminContent, 'utf8');
  console.log('CafeteriaAdminDashboard.jsx updated');
} else {
  console.log('CafeteriaAdminDashboard.jsx already updated');
}
