const fs = require('fs');
const path = 'c:/al aws done/moo_project/src/App.jsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Remove the accidentally inserted block
const badBlockStart = `          {showNotifications && (
            <NotificationDropdown
              notifications={(student?.notifications || []).filter(n => n.targetType !== 'teacher' && !n.to && !n.targetInstructor && !n.title?.includes('ط±طµط¯ ط؛ظٹط§ط¨'))}
              onMarkAllRead={handleMarkAllRead}
              onClose={() => setShowNotifications(false)}
            />
          )}`;
const badBlockEnd = `                  </AnimatePresence>
                )}
              </div>
            </main>
          </div>`;

// We need to use regex to find the block because of Arabic text differences
// The block I inserted starts with `{showNotifications && (\n            <NotificationDropdown` and ends with `</main>\n          </div>`
const regexBadBlock = /\{showNotifications && \([\s\S]*?<NotificationDropdown[\s\S]*?<\/main>\s*<\/div>/;
let matchedBlock = content.match(regexBadBlock);

if (matchedBlock) {
    // Wait! There are TWO matches now! The original NotificationDropdown and the one I inserted.
    // The one I inserted has `<main` right after it!
    const regexInserted = /\{showNotifications && \([\s\S]*?<NotificationDropdown[\s\S]*?<\/main>\s*<\/div>/;
    
    // Let's just find the exact text I inserted!
    const insertedText = `          {showNotifications && (
            <NotificationDropdown
              notifications={(student?.notifications || []).filter(n => n.targetType !== 'teacher' && !n.to && !n.targetInstructor && !n.title?.includes('ط±طµط¯ ط؛ظٹط§ط¨'))}
              onMarkAllRead={handleMarkAllRead}
              onClose={() => setShowNotifications(false)}
            />
          )}

          <div className="flex-1 flex overflow-hidden">
            {!hideStudentUI && (
              <Sidebar`;
    
    // I will rebuild the file from pieces because string replacement might fail.
    
    // The destroyed useMemo block:
    const restoredUseMemo = `        ...studentData.cafeteria,
        currentBalance: studentBalance
      },
      schedule: formattedSchedule,
      notifications: [...syncedNotifications, ...(studentData.notifications || [])].slice(0, 50),
      currentSchedule: myLessons.filter(l => l.day === new Date().toLocaleDateString('ar-SA', { weekday: 'long' })).map(l => ({
        id: l.id,
        subject: l.subject,
        time: l.time,
        progress: 0,
        status: 'upcoming',
        instructor: l.instructor,
        room: l.room,
        type: l.type || 'basic'
      })),
      // 🔥 إصلاح: ندمج باقي الـ overrides بدون personal عشان ما يحلش محله
      ...Object.fromEntries(Object.entries(studentOverrides || {}).filter(([k]) => k !== 'personal'))
    };
  }, [currentUser, syncTrigger, studentBalance, studentOverrides]);

  const lastExamScore = useMemo(() => {`;

    // Let's try to just do this:
    // We know where `cafeteria: {` is.
    // And we know where `try {` of lastExamScore is.
    // We can replace whatever is between them!
    
    const repairRegex1 = /cafeteria:\s*\{[\s\S]*?try\s*\{/m;
    content = content.replace(repairRegex1, `cafeteria: {\n${restoredUseMemo}\n    try {`);
    
    // Now we need to insert the missing UI block!
    const missingBlock = `
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

    // Where to insert this? Right AFTER the real `NotificationDropdown`.
    // The real `NotificationDropdown` ends with:
    // `onClose={() => setShowNotifications(false)}`
    // `            />`
    // `          )}`
    
    // We will find the VERY LAST `setShowNotifications(false)` in the file, because my accidental insert was replaced by the `try {` fix above!
    // Wait, my `try {` fix replaced EVERYTHING between `cafeteria: {` and `try {`.
    // My accidental insert WAS between `cafeteria: {` and `try {` !
    // So by replacing that, I automatically deleted the accidental insert!
    
    const parts = content.split('setShowNotifications(false)');
    if (parts.length >= 2) {
        const lastPart = parts.pop();
        const secondLastPart = parts.pop();
        // The anchor is `setShowNotifications(false)\n            />\n          )}`
        // So we want to replace `setShowNotifications(false)` with `setShowNotifications(false)` + ... + missingBlock
        
        // Actually, let's just find `/>\n          )}` after the last `setShowNotifications(false)`
        const replaceAnchorRegex = /(setShowNotifications\(false\)\s*?\}?\s*\/>\s*\n\s*\)\})/;
        if (replaceAnchorRegex.test(content)) {
            content = content.replace(replaceAnchorRegex, "$1\n" + missingBlock);
            fs.writeFileSync(path, content, 'utf8');
            console.log("App.jsx completely repaired!");
        } else {
            console.log("Could not find the exact closing of NotificationDropdown");
        }
    }
}
