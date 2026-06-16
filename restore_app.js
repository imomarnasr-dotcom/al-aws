const fs = require('fs');
let content = fs.readFileSync('src/App.jsx', 'utf8');

const toInsert = `  const [achievements, setAchievements] = useCloudStorage('achievements', 'all_data', {});
  const [wallets, setWallets] = useCloudStorage('wallets', 'all_data', {});
  const [walletTransactions, setWalletTransactions] = useCloudStorage('wallet_transactions', 'all_data', []);
  const [cafeteriaMenu, setCafeteriaMenu] = useCloudStorage('cafeteria_menu', 'all_data', []);
  const [cafeteriaOrders, setCafeteriaOrders] = useCloudStorage('cafeteria_orders', 'all_data', []);
  const [attendance, setAttendance] = useCloudStorage('attendance', 'all_data', {});
  const [studentNotifs, setStudentNotifs] = useCloudStorage('student_notifications', 'all_data', {});
  const [pinnedBadges, setPinnedBadges] = useCloudStorage('pinned_badges', 'all_data', ['⭐', '🏆', '🔥', '🧠']);
  const [globalNotifs, setGlobalNotifs] = useCloudStorage('notifications', 'all_data', []);

  const [currentPage, setCurrentPage] = useState('landing');
  const [currentUser, setCurrentUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showAcademicStore, setShowAcademicStore] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);\n`;

if (!content.includes("const [achievements, setAchievements]")) {
  content = content.replace('  const [isLoading, setIsLoading] = useState(false);', toInsert + '  const [isLoading, setIsLoading] = useState(false);');
}

fs.writeFileSync('src/App.jsx', content, 'utf8');
console.log('Restored App.jsx state declarations');
