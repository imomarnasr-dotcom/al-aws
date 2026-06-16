const fs = require('fs');

const replaces = {
  'src/components/AdminSmartAttendance.jsx': [
    { find: "window.dispatchEvent(new CustomEvent('moo-toast', { detail: { message: \\, type: 'error' } }));", replace: "window.dispatchEvent(new CustomEvent('moo-toast', { detail: { message: ' „ Õ›Ÿ «·€Ì«» »‰Ã«Õ.', type: 'success' } }));" },
    { find: "window.dispatchEvent(new CustomEvent('moo-toast', { detail: { message: \\, type: 'error' } }));", replace: "window.dispatchEvent(new CustomEvent('moo-toast', { detail: { message: ' „ ≈÷«›… «·ÿ«·» »‰Ã«Õ.', type: 'success' } }));" }
  ],
  'src/components/CafeteriaAdminDashboard.jsx': [
    { find: "window.dispatchEvent(new CustomEvent('moo-toast', { detail: { message: \\, type: 'error' } }));", replace: "window.dispatchEvent(new CustomEvent('moo-toast', { detail: { message: '·« ÌÊÃœ ﬂ„Ì… ﬂ«›Ì….', type: 'error' } }));" },
    { find: "window.dispatchEvent(new CustomEvent('moo-toast', { detail: { message: \\, type: 'error' } }));", replace: "window.dispatchEvent(new CustomEvent('moo-toast', { detail: { message: '‰›–  «·ﬂ„Ì….', type: 'error' } }));" },
    { find: "window.dispatchEvent(new CustomEvent('moo-toast', { detail: { message: \\, type: 'error' } }));", replace: "window.dispatchEvent(new CustomEvent('moo-toast', { detail: { message: '—’Ìœ «·ÿ«·» €Ì— ﬂ«›. «·—’Ìœ «·Õ«·Ì: ' + studentBalance.toFixed(2) + ' —.”', type: 'error' } }));" }
  ],
  'src/components/CafeteriaView.jsx': [
    { find: "window.dispatchEvent(new CustomEvent('moo-toast', { detail: { message: \\, type: 'error' } }));", replace: "window.dispatchEvent(new CustomEvent('moo-toast', { detail: { message: '⁄–—«° ·« ÌÊÃœ ﬂ„Ì… ﬂ«›Ì… ›Ì «·„ﬁ’› ·Â–« «·’‰›.', type: 'error' } }));" },
    { find: "window.dispatchEvent(new CustomEvent('moo-toast', { detail: { message: \\, type: 'error' } }));", replace: "window.dispatchEvent(new CustomEvent('moo-toast', { detail: { message: '‰›–  «·ﬂ„Ì….', type: 'error' } }));" }
  ],
  'src/components/ExamsView.jsx': [
    // ExamsView was correctly processed for lert(msg) by the script? Let's check!
    // Wait, let's just make sure.
  ],
  'src/components/GradesView.jsx': [
    // GradesView had err.message, it was replaced by the string match in the script. Let's leave it if it works, or check it.
  ],
  'src/components/SettingsView.jsx': [
    { find: "window.dispatchEvent(new CustomEvent('moo-toast', { detail: { message: \\, type: 'error' } }));", replace: "window.dispatchEvent(new CustomEvent('moo-toast', { detail: { message: ' „ Õ›Ÿ «·≈⁄œ«œ«  »‰Ã«Õ. ”Ì „ «· ÕœÌÀ ﬁ—Ì»«.', type: 'success' } }));" }
  ],
  'src/components/TeacherDashboard.jsx': [
    { find: "window.dispatchEvent(new CustomEvent('moo-toast', { detail: { message: \\, type: 'error' } }));", replace: "window.dispatchEvent(new CustomEvent('moo-toast', { detail: { message: 'Ì—ÃÏ «Œ Ì«— «·›’·', type: 'error' } }));" }
  ],
  'src/App.jsx': [
    { find: "window.dispatchEvent(new CustomEvent('moo-toast', { detail: { message: \\, type: 'error' } }));", replace: "window.dispatchEvent(new CustomEvent('moo-toast', { detail: { message: '⁄–—«° «·—’Ìœ €Ì— ﬂ«›Ì ·≈ „«„ «·‘—«¡.', type: 'error' } }));" }
  ]
};

for (const [file, items] of Object.entries(replaces)) {
    if (fs.existsSync(file)) {
        let content = fs.readFileSync(file, 'utf8');
        for (const item of items) {
            content = content.replace(item.find, item.replace);
        }
        fs.writeFileSync(file, content, 'utf8');
    }
}
