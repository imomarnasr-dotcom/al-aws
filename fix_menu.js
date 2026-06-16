const fs = require('fs');
let content = fs.readFileSync('src/components/AdminDashboard.jsx', 'utf8');

const replacement = `{/* Mobile Fullscreen Menu */}
                {isMobile && isSidebarOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white/95 backdrop-blur-xl p-6"
                  >
                    <button className="absolute top-6 right-6 p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors" onClick={() => setIsSidebarOpen(false)}>
                      <X size={32} />
                    </button>
                    <h2 className="text-2xl font-bold mb-8 text-gray-900">القائمة الرئيسية</h2>
                    <div className="flex flex-col gap-4 w-full max-w-sm overflow-y-auto pb-safe">
                      {adminTabs.map((tab) => {
                        return (
                          <button
                            key={tab.id}
                            onClick={() => { setActiveTab(tab.id); setIsSidebarOpen(false); }}
                            className={\`p-4 rounded-2xl font-bold text-lg text-center transition-all \${
                              activeTab === tab.id
                                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30'
                                : 'bg-gray-100/80 text-gray-700 hover:bg-gray-200'
                            }\`}
                          >
                            <div className="flex items-center justify-center gap-3">
                               {tab.label}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}

                {/* Desktop Sidebar */}
                {!isMobile && isSidebarOpen && (
                <motion.div
                  initial={{ width: 0, opacity: 0, marginInlineEnd: 0 }}
                  animate={{ width: 256, opacity: 1, marginInlineEnd: 32 }}
                  exit={{ width: 0, opacity: 0, marginInlineEnd: 0 }}`;

let parts = content.split('exit={{ width: 0, opacity: 0, marginInlineEnd: 0 }}');

if (parts.length >= 2) {
    let pre = parts[0];
    let post = parts.slice(1).join('exit={{ width: 0, opacity: 0, marginInlineEnd: 0 }}');
    
    let motionIndex = pre.lastIndexOf('<motion.div');
    if (motionIndex !== -1) {
        pre = pre.substring(0, motionIndex);
        content = pre + replacement + post;
        fs.writeFileSync('src/components/AdminDashboard.jsx', content);
        console.log('Mobile menu implemented!');
    }
}
