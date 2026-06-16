const fs = require('fs');

const path = 'c:/al aws done/moo_project/src/App.jsx';
const lines = fs.readFileSync(path, 'utf8').split('\n');

const startIndex = 1165; // Line 1166 (0-indexed) where `    } catch { return '...'; }` is.
const insertionLines = `
  const newNotificationsCount = student?.notifications?.filter(n => n.isNew).length || 0;

  const isTeacherRoute = currentPage === 'teacher-dashboard';
  const isAdminRoute = currentPage === 'admin' || currentPage === 'cafeteria-admin';
  const isLandingRoute = currentPage === 'landing';
  const hideStudentUI = isTeacherRoute || isAdminRoute || isLandingRoute || currentPage === 'parent-dashboard';

  // 🔥 إصلاح: Route Guard — لو مفيش مستخدم ومش في landing نرجع للـ landing
  useEffect(() => {
    if (!currentUser && currentPage !== 'landing') {
      setCurrentPage('landing');
    }
  }, [currentUser, currentPage]);

  if (!currentUser && !isLandingRoute) {
    return null;
  }

  return (
    <>
      <ErrorBoundary>
        <ToastManager />
        <ConfirmManager />
        <Preloader /> {/* 🪄 شاشة الدخول الاحترافية */}

        {/* 🪄 الخلفية العائمة تظل وراء كل شيء */}
        <div className="fixed inset-0 z-0 pointer-events-none">
          <ParticlesBackground />
        </div>

        <div className={\`relative z-10 min-h-screen flex flex-col font-main bg-transparent selection:bg-primary/20\`}>
          {!hideStudentUI && (
            <Header
              studentData={student}
              newNotificationsCount={newNotificationsCount}
              onNotificationClick={() => setShowNotifications(!showNotifications)}
              onProfileClick={() => setShowProfile(true)}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              onMenuClick={() => setIsSidebarOpen(true)}
`.split('\n');

// Find the line that has `}, [student, syncTrigger]);`
let insertAt = -1;
for (let i = 1150; i < 1180; i++) {
  if (lines[i] && lines[i].includes('}, [student, syncTrigger]);')) {
    insertAt = i + 1; // Insert AFTER this line
    break;
  }
}

if (insertAt !== -1) {
  lines.splice(insertAt, 0, ...insertionLines);
  fs.writeFileSync(path, lines.join('\n'), 'utf8');
  console.log('Successfully repaired App.jsx at line ' + insertAt);
} else {
  console.log('Could not find insertion point!');
}
