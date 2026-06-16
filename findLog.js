const fs = require('fs');
const logPath = 'C:/Users/CENTER_ELRahama/.gemini/antigravity/brain/b9b64a5c-7eed-4130-a826-850a81279ab6/.system_generated/logs/transcript_full.jsonl';
const lines = fs.readFileSync(logPath, 'utf8').split('\n').filter(Boolean);

let bestContent = null;
let maxLen = 0;

for (let i = lines.length - 1; i >= 0; i--) {
  try {
    const obj = JSON.parse(lines[i]);
    if (obj.type === 'PLANNER_RESPONSE' && obj.tool_calls) {
      for (const tc of obj.tool_calls) {
        if (tc.name === 'replace_file_content' || tc.name === 'multi_replace_file_content') {
           // We modified it. This might be useful, but what we really want is the full file.
        }
      }
    }
    // tool responses have output in content?
    // Let's just search any string containing "const TeacherDashboard = () => {" and "export default TeacherDashboard;"
    if (typeof obj.content === 'string' && obj.content.includes('const TeacherDashboard = () => {') && obj.content.includes('export default TeacherDashboard;')) {
       if (obj.content.length > maxLen) {
          maxLen = obj.content.length;
          bestContent = obj.content;
       }
    }
    
    // what if it's in a tool_responses array?
    if (obj.tool_responses) {
        for (const tr of obj.tool_responses) {
            if (tr.output && tr.output.includes('const TeacherDashboard = () => {') && tr.output.includes('export default TeacherDashboard;')) {
                if (tr.output.length > maxLen) {
                    maxLen = tr.output.length;
                    bestContent = tr.output;
                }
            }
        }
    }
  } catch(e) {}
}

if (bestContent) {
  // Extract the file content. Usually view_file has "The following code has been modified to include a line number..."
  // Wait, if it has line numbers, we'd need to strip them.
  // Let's just log what we found first!
  console.log('Found full content of length', maxLen);
  fs.writeFileSync('C:/al aws done/moo_project/found.txt', bestContent);
} else {
  console.log('Not found in transcript.');
}
