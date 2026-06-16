const fs = require('fs');

const path = 'c:/al aws done/moo_project/src/App.jsx';
let content = fs.readFileSync(path, 'utf8');

// Find the insertion point
const searchPoint = `    } catch { return 'لا يوجد'; }\n  }, [student, syncTrigger]);\n\n            />\n          )}`;

const insertion = `    } catch { return 'لا يوجد'; }
  }, [student, syncTrigger]);

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
            />
          )}`;

// Because of Arabic encoding, we should find by regex
const regex = /    \} catch \{ return '[^']+'; \}\n  \}, \[student, syncTrigger\]\);\n\n            \/>\n          \)\}/g;

if(regex.test(content)) {
    content = content.replace(regex, insertion);
    fs.writeFileSync(path, content, 'utf8');
    console.log("Successfully repaired App.jsx");
} else {
    console.log("Regex did not match!");
}
