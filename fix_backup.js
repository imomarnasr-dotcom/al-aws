const fs = require('fs');
let content = fs.readFileSync('src/components/AdminDashboard.jsx', 'utf8');

const targetRegex = /let targetName = 'الجميع';\s+'moo_pinned_badges', 'moo_dismissed_results',/g;

const replacement = `let targetName = 'الجميع';
    if (notifTarget !== 'all') {
      const sName = whitelist.find(s => s.id === notifTarget)?.name;
      targetName = notifAudience === 'parents' ? \`ولي أمر الطالب: \${sName}\` : sName;
    } else {
      targetName = notifAudience === 'parents' ? 'جميع أولياء الأمور' : 'جميع الطلاب';
      if (notifClassFilter !== 'all') targetName += \` (\${notifClassFilter})\`;
    }
    
    showToast(\`✅ تم إرسال الإشعار لـ \${targetName}\`);
  };

  // 🔥 إضافة: تصدير نسخة احتياطية كاملة (Backup) لكل بيانات النظام
  const BACKUP_KEYS = [
    'GLOBAL_ACADEMIC_MASTER', 'moo_achievements', 'moo_student_notifications',
    'moo_pinned_badges', 'moo_dismissed_results',`;

if (targetRegex.test(content)) {
    content = content.replace(targetRegex, replacement);
    fs.writeFileSync('src/components/AdminDashboard.jsx', content, 'utf8');
    console.log('Successfully repaired handleSendNotification & BACKUP_KEYS');
} else {
    console.log('Could not find corrupted block to repair');
}
