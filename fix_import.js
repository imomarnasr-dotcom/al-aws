const fs = require('fs');
let content = fs.readFileSync('src/components/AdminDashboard.jsx', 'utf8');

const targetStr = `        // ???? ?????? ??????? ??? ?????????
      } finally {
        e.target.value = '';
      }`;

const targetRegex = /\s*\/\/\s*تحديث الحالة المحلية بعد الاستيراد\r?\n\s*\}\s*finally\s*\{\r?\n\s*e\.target\.value\s*=\s*'';\r?\n\s*\}/;

const replacement = `        // تحديث الحالة المحلية بعد الاستيراد
        try { setWhitelist(JSON.parse(localStorage.getItem('moo_whitelist') || '[]')); } catch { /* */ }
        try { setStaff(JSON.parse(localStorage.getItem('moo_staff') || '[]')); } catch { /* */ }
        try { setComplaints(JSON.parse(localStorage.getItem('moo_complaints') || '[]')); } catch { /* */ }
        try { setAnnouncements(JSON.parse(localStorage.getItem('moo_announcements') || '[]')); } catch { /* */ }
        try { setPhases(JSON.parse(localStorage.getItem('moo_phases') || '[]')); } catch { /* */ }
        try { setWallets(JSON.parse(localStorage.getItem('moo_wallets') || '{}')); } catch { /* */ }
        setGlobalMaster(getGlobalMaster());
        window.dispatchEvent(new Event('storage')); window.dispatchEvent(new CustomEvent('moo-sync'));
        showToast('✅ تم استيراد النسخة الاحتياطية بنجاح');
      } catch (err) {
        console.error(err);
        showToast('❌ ملف النسخة الاحتياطية غير صالح');
      } finally {
        e.target.value = '';
      }`;

if (targetRegex.test(content)) {
    content = content.replace(targetRegex, replacement);
    fs.writeFileSync('src/components/AdminDashboard.jsx', content, 'utf8');
    console.log('Successfully repaired handleImportBackup');
} else {
    console.log('Could not find corrupted block to repair. Trying fallback string search');
    // Fallback: the unicode decoded comment
    let idx = content.indexOf('// تحديث الحالة المحلية بعد الاستيراد');
    if (idx !== -1) {
        let endIdx = content.indexOf('}', content.indexOf('finally', idx) + 8);
        if (endIdx !== -1) {
            let pre = content.substring(0, idx);
            let post = content.substring(endIdx + 1);
            content = pre + replacement + post;
            fs.writeFileSync('src/components/AdminDashboard.jsx', content, 'utf8');
            console.log('Successfully repaired handleImportBackup with fallback');
        } else {
            console.log('Failed fallback endIdx');
        }
    } else {
        console.log('Failed fallback completely');
    }
}
