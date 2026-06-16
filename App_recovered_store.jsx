            <main className={`flex-1 overflow-y-auto bg-slate-50 relative ${!hideStudentUI ? 'p-4 md:p-8' : ''}`}>
              <div className="max-w-7xl mx-auto space-y-8">
                {(() => {
                  if (currentPage === 'dashboard') {
                    return <StudentDashboard studentData={student} setCurrentPage={setCurrentPage} studentBalance={studentBalance} />;
                  }
                  if (currentPage === 'cafeteria') {
                    return <CafeteriaView studentData={student} cart={cart} setCart={setCart} searchQuery={searchQuery} studentBalance={studentBalance} />;
                  }
                  if (currentPage === 'leaderboard') {
                    return <LeaderboardView studentData={student} />;
                  }
                  if (currentPage === 'settings') {
                    return <SettingsView studentData={student} setStudent={setStudent} />;
                  }
                  if (currentPage === 'store') {
                    const handleBuyItem = async (item) => {
                      if (!(await mooConfirm(`هل تريد تأكيد شراء ${item.name}؟`))) return;
                      const studentId = currentUser?.id;
                      if (!studentId) return;
