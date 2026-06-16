const fs = require('fs');
let content = fs.readFileSync('src/components/TeacherDashboard.jsx', 'utf-8');

const regex1 = /\{isPresent \? 'ط\u00adط§ط¶ط± 🟢' : 'ط؛ط§ط¦ط¨ 🔴'\}/g;
if (content.match(regex1)) {
    content = content.replace(regex1, "{isPresent ? 'حاضر 🟢' : 'غائب 🔴'}");
    console.log('Fixed present/absent text');
} else {
    console.log('regex1 not found');
}

const regex2 = /طھط£ظƒظٹط¯ طھط­ط¯ظٹط« ط§ظ„ط؛ظٹط§ط¨/g;
if (content.match(regex2)) {
    content = content.replace(regex2, 'تأكيد تحديث الغياب');
    console.log('Fixed confirm modal title');
}

const regex3 = /طھظ… طھط³ط¬ظٹظ„ ط­ط¶ظˆط± ظپطµظ„/g;
if (content.match(regex3)) {
    content = content.replace(regex3, 'تم تسجيل حضور فصل');
    console.log('Fixed confirm modal string part 1');
}

const regex4 = /ظ…ط³ط¨ظ‚ط§ظ‹\. ظ‡ظ„ طھط±ظٹط¯ طھط­ط¯ظٹط«ظ‡ ظˆطھط¹ط¯ظٹظ„ظ‡طں/g;
if (content.match(regex4)) {
    content = content.replace(regex4, 'مسبقاً. هل تريد تحديثه وتعديله؟');
    console.log('Fixed confirm modal string part 2');
}

fs.writeFileSync('src/components/TeacherDashboard.jsx', content);
