const fs = require('fs');
const lines = fs.readFileSync('c:/Users/CENTER_ELRahama/.gemini/antigravity/brain/b9b64a5c-7eed-4130-a826-850a81279ab6/.system_generated/logs/transcript_full.jsonl', 'utf8').split('\n');
const matches = lines.filter(l => l.includes('1500:             <div className="fixed inset-0 z-[200]'));
console.log('Found matches:', matches.length);
if(matches.length > 0) {
   const dumpStr = matches[matches.length - 1];
   const data = JSON.parse(dumpStr);
   let content = '';
   if (data.type === 'PLANNER_RESPONSE' && data.content) { content = data.content; }
   else if (data.type === 'TOOL_RESPONSE' && data.responses) {
      for (const r of data.responses) {
         if (r.response && r.response.output) { content += r.response.output; }
      }
   } else if (data.content) { content = data.content; }
   
   const codeLines = [];
   for (const line of content.split('\n')) {
      const match = line.match(/^\d+:\s(.*)/);
      if (match) codeLines.push(match[1]);
   }
   if (codeLines.length > 0) {
      fs.writeFileSync('c:/al aws done/moo_project/App_recovered_store.jsx', codeLines.join('\n'), 'utf8');
      console.log('Successfully recovered ' + codeLines.length + ' lines');
   }
}
