const fs = require('fs');
let content = fs.readFileSync('src/components/AdminDashboard.jsx', 'utf8');

const regex = /adminTabs\.map\(\(tab\) => \{/g;
const replacement = `[
                  { id: 'classes', label: 'إدارة الفصول' },
                  { id: 'smart_attendance', label: 'التحضير الذكي' },
                  { id: 'truancy_radar', label: 'رادار الغياب' },
                  { id: 'daily_scanner', label: 'الماسح اليومي (طلاب)' },
                  { id: 'id_generator', label: 'مُنشئ الهويات' },
                  { id: 'announcements', label: 'إدارة الإعلانات' },
                  { id: 'stats', label: 'إحصائيات متقدمة' },
                  { id: 'students', label: 'إدارة شؤون الطلاب' },
                  { id: 'staff', label: 'إدارة شؤون المعلمين' },
                  { id: 'employees', label: 'إدارة شؤون الموظفين' },
                  { id: 'wallets', label: 'إدارة المحافظ المالية' },
                  { id: 'complaints', label: 'إدارة الشكاوى' },
                  { id: 'notifications', label: 'إدارة الإشعارات' },
                  ...(!isDeputy ? [{ id: 'reset', label: 'تصفير النظام وبدء عام' }] : []),
                  ...(!isDeputy ? [{ id: 'graduates', label: 'أرشيف الخريجين' }] : []),
                  { id: 'settings', label: 'إعدادات المنظومة' },
                ].map((tab) => {`;

if (regex.test(content)) {
    content = content.replace(regex, replacement);
    fs.writeFileSync('src/components/AdminDashboard.jsx', content, 'utf8');
    console.log("Fixed adminTabs undefined error");
} else {
    console.log("Could not find adminTabs.map");
}
