const fs = require('fs');
let content = fs.readFileSync('src/components/AdminDashboard.jsx', 'utf8');

// The syntax error is:
//               <AnimatePresence>
//                 {isSidebarOpen && (
//                 {/* Mobile Fullscreen Menu */}
//                 {isMobile && isSidebarOpen && (

// We just need to replace "{isSidebarOpen && (\n                {/* Mobile Fullscreen Menu */}" 
// with "{/* Mobile Fullscreen Menu */}"

const badString = "{isSidebarOpen && (\\n                {/* Mobile Fullscreen Menu */}";
const badString2 = "{isSidebarOpen && (\\r\\n                {/* Mobile Fullscreen Menu */}";
const badString3 = "{isSidebarOpen && (\\n                {/* Mobile";
const badString4 = "{isSidebarOpen && (\\r\\n                {/* Mobile";

if (content.includes(badString)) {
    content = content.replace(badString, "{/* Mobile Fullscreen Menu */}");
    fs.writeFileSync('src/components/AdminDashboard.jsx', content, 'utf8');
    console.log("Fixed syntax error");
} else if (content.includes(badString2)) {
    content = content.replace(badString2, "{/* Mobile Fullscreen Menu */}");
    fs.writeFileSync('src/components/AdminDashboard.jsx', content, 'utf8');
    console.log("Fixed syntax error");
} else {
    // Let's use regex
    const regex = /\{isSidebarOpen\s*&&\s*\(\s*\{\/\*\s*Mobile\s*Fullscreen\s*Menu\s*\*\/\}/g;
    if (regex.test(content)) {
        content = content.replace(regex, "{/* Mobile Fullscreen Menu */}");
        fs.writeFileSync('src/components/AdminDashboard.jsx', content, 'utf8');
        console.log("Fixed syntax error via regex");
    } else {
        console.log("Could not find syntax error");
    }
}
