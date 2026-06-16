const fs = require('fs');
let content = fs.readFileSync('src/components/TeacherDashboard.jsx', 'utf-8');

const regex = /\{isPresent \? 'âœ… ط\u00adط§ط¶ط±' : 'â‌Œ ط؛ط§ط¦ط¨'\}/g;
if (content.match(regex)) {
    content = content.replace(regex, "{isPresent ? '✅ حاضر' : '❌ غائب'}");
    fs.writeFileSync('src/components/TeacherDashboard.jsx', content);
    console.log('Fixed present/absent UI text');
} else {
    // try exact string replacement
    const parts = content.split(`{isPresent ? 'âœ… ط\u00adط§ط¶ط±' : 'â‌Œ ط؛ط§ط¦ط¨'}`);
    if(parts.length > 1) {
        content = parts.join(`{isPresent ? '✅ حاضر' : '❌ غائب'}`);
        fs.writeFileSync('src/components/TeacherDashboard.jsx', content);
        console.log('Fixed present/absent UI text using split/join');
    } else {
        console.log('Could not find text to replace');
    }
}
