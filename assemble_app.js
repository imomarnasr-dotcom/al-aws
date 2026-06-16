const fs = require('fs');

const appPath = 'c:/al aws done/moo_project/src/App.jsx';
let content = fs.readFileSync(appPath, 'utf8');

// Normalize line endings to \n for easier string manipulation
content = content.replace(/\r\n/g, '\n');

// 1. Get everything up to NotificationDropdown
const anchorStart = content.indexOf('onClose={() => setShowNotifications(false)}');
const anchorEndStr = ')}';
const anchorIdx = content.indexOf(anchorEndStr, anchorStart);
if (anchorStart === -1 || anchorIdx === -1) {
  console.log("Could not find NotificationDropdown anchor");
  process.exit(1);
}

// 2. We also need to extract the showAcademicStore logic from the current App.jsx
const storeAnchor = `{showAcademicStore && (() => {`;
const storeStartIdx = content.indexOf(storeAnchor);
let storeLogic = "";
if (storeStartIdx !== -1) {
  const storeEndStr = `} return null; })()}`;
  const storeEndIdx = content.indexOf(storeEndStr, storeStartIdx);
  if (storeEndIdx !== -1) {
     storeLogic = content.substring(storeStartIdx, storeEndIdx + storeEndStr.length);
  }
}

let head = content.substring(0, anchorIdx + anchorEndStr.length);

// 3. The main layout block
const mainLayout = `
          <div className="flex-1 flex overflow-hidden">
            {!hideStudentUI && (
              <Sidebar
                activeNav={currentPage}
                setActiveNav={setCurrentPage}
                onLogoutClick={() => setCurrentPage('landing')}
              />
            )}

            {/* 🔥 إضافة: Mobile Bottom Nav للطالب */}
            {!hideStudentUI && (
              <MobileNav activeNav={currentPage} setActiveNav={setCurrentPage} />
            )}

            <main className={\`flex-1 overflow-y-auto transition-all duration-500 \${hideStudentUI ? '' : 'p-6 lg:p-8 pb-24 lg:pb-8'}\`}>
              <div className="max-w-7xl mx-auto h-full">
                {isLoading && !hideStudentUI && <SkeletonLoader />}

                {/* 🪄 تنقل سينمائي بين الصفحات */}
                {!isLoading && (
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentPage}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.4 }}
                      className="h-full"
                    >
                      {currentPage === 'landing' && <LandingPage onNavigate={handleNavigate} />}
                      {currentPage === 'teacher-dashboard' && <TeacherDashboard onLogout={() => setCurrentPage('landing')} currentTeacherUser={currentUser?.username} />}
                      {currentPage === 'admin' && <AdminDashboard onLogout={() => setCurrentPage('landing')} />}
                      {currentPage === 'cafeteria-admin' && <CafeteriaAdminDashboard onLogout={() => setCurrentPage('landing')} />}
                      {currentPage === 'parent-dashboard' && <ParentDashboard onLogout={() => setCurrentPage('landing')} />}

                      {!hideStudentUI && (
                        <>
                          <ExamResultNotification student={student} />
                          <AnnouncementBanner />
                          {currentPage === 'home' && <DashboardView studentData={student} searchQuery={searchQuery} onNavigateToSchedule={() => setCurrentPage('schedule')} />}
                          {currentPage === 'schedule' && <ScheduleView studentData={student} searchQuery={searchQuery} />}
                          {currentPage === 'grades' && <GradesView studentData={student} />}
                          {currentPage === 'attendance' && <AttendanceView studentData={student} />}
                          {currentPage === 'settings' && <SettingsView studentData={student} />}
                          {currentPage === 'cafeteria' && <CafeteriaView studentData={student} onUpdateLocalBalance={(newBal) => {
                            const wallets = JSON.parse(localStorage.getItem('moo_wallets')) || {};
                            if (wallets[student?.personal?.id] !== undefined) {
                              wallets[student.personal.id] = newBal;
                              localStorage.setItem('moo_wallets', JSON.stringify(wallets));
                              setStudentBalance(newBal);
                              window.dispatchEvent(new Event('storage'));
                            }
                          }} />}
                        </>
                      )}
                    </motion.div>
                  </AnimatePresence>
                )}
              </div>
            </main>
          </div>
`;

// 4. The Cart Checkout Logic
const cartTopHalf = `
          {!hideStudentUI && (
            <>
              {currentPage === 'cafeteria' && cart.length > 0 && (
                <motion.button
                  drag
                  dragMomentum={false}
                  dragConstraints={{ left: 0, right: typeof window !== 'undefined' ? window.innerWidth - 100 : 1000, top: 0, bottom: typeof window !== 'undefined' ? window.innerHeight - 100 : 1000 }}
                  whileDrag={{ scale: 1.1, cursor: "grabbing" }}
                  onClick={() => { setIsCartOpen(true); setCheckoutStatus('idle'); }}
                  className="fixed left-8 top-1/3 z-[90] w-20 h-20 bg-orange-500 text-white rounded-full shadow-[0_15px_40px_rgba(249,115,22,0.4)] flex items-center justify-center hover:bg-orange-600 transition-colors border-4 border-white cursor-grab"
                  style={{ touchAction: "none" }}
                >
                  <ShoppingCart size={32} />
                  {cart.length > 0 && (
                    <span className="absolute -top-2 -right-2 bg-slate-900 text-white text-sm font-bold w-8 h-8 rounded-full flex items-center justify-center border-2 border-white shadow-lg">
                      {cart.reduce((acc, item) => acc + item.cartQuantity, 0)}
                    </span>
                  )}
                </motion.button>
              )}

              {isCartOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="bg-white rounded-[32px] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col relative"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {checkoutStatus === 'idle' && (
                      <>
                        <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
`;

let cartBottomHalf = fs.readFileSync('c:/al aws done/moo_project/App_recovered_partial.jsx', 'utf8');
const dupIdx = cartBottomHalf.indexOf('<div className="flex-1 flex overflow-hidden">');
if (dupIdx !== -1) {
    cartBottomHalf = cartBottomHalf.substring(0, dupIdx);
}
cartBottomHalf = cartBottomHalf.replace(')}\\n                  </motion.div>', ')}\n                  </motion.div>');

// 5. Build final App.jsx
let finalContent = head + "\n\n" + storeLogic + "\n\n" + mainLayout + "\n" + cartTopHalf + cartBottomHalf + `
        </div>
      </ErrorBoundary>

      <SuccessModal
        isVisible={successModal.isVisible}
        message={successModal.message}
        type={successModal.type}
        onClose={() => setSuccessModal({ ...successModal, isVisible: false })}
      />
    </>
  );
};

export default App;
`;

fs.writeFileSync(appPath, finalContent, 'utf8');
console.log("App.jsx fully assembled and restored!");
