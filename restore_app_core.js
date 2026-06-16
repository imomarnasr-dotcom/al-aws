const fs = require('fs');
const path = 'c:/al aws done/moo_project/src/App.jsx';
let content = fs.readFileSync(path, 'utf8');

const missingBlock = `          <div className="flex-1 flex overflow-hidden">
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
                          {/* التعديل هنا: تمرير handleSetStudentData وتمرير onNavigateToSchedule */}
                          {/* 🔥 إصلاح: الإعلانات تظهر في كل صفحات الطالب */}
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
          </div>`;

// Where to insert this? Right before the `{!hideStudentUI && (` that wraps the cart button.
// Actually, in the original code, this block came AFTER `NotificationDropdown` and BEFORE the cart logic.
// Let's find the NotificationDropdown:
const anchor = `onClose={() => setShowNotifications(false)}
            />
          )}`;

if (content.includes(anchor)) {
    content = content.replace(anchor, anchor + "\n\n" + missingBlock);
    fs.writeFileSync(path, content, 'utf8');
    console.log("App.jsx restored successfully!");
} else {
    console.log("Could not find anchor.");
}
