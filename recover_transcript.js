const fs = require('fs');

const dumpPath = 'c:/al aws done/moo_project/transcript_dump.json';
const dumpStr = fs.readFileSync(dumpPath, 'utf8');

try {
  const data = JSON.parse(dumpStr);
  let content = '';

  if (data.type === 'PLANNER_RESPONSE' && data.content) {
    content = data.content;
  } else if (data.type === 'TOOL_RESPONSE' && data.responses) {
     for (const r of data.responses) {
         if (r.response && r.response.output) {
             content += r.response.output;
         }
     }
  } else if (data.content) {
     content = data.content;
  } else {
     content = JSON.stringify(data);
  }

  // Extract lines that look like `1234: some code`
  const lines = content.split('\n');
  const codeLines = [];
  
  for (const line of lines) {
    const match = line.match(/^\d+:\s(.*)/);
    if (match) {
       codeLines.push(match[1]);
    }
  }

  if (codeLines.length > 0) {
     fs.writeFileSync('c:/al aws done/moo_project/App_recovered_partial.jsx', codeLines.join('\n'), 'utf8');
     console.log('Successfully recovered ' + codeLines.length + ' lines to App_recovered_partial.jsx');
  } else {
     console.log('No numbered lines found. Dumping raw content to App_recovered_partial.jsx');
     fs.writeFileSync('c:/al aws done/moo_project/App_recovered_partial.jsx', content, 'utf8');
  }
} catch(e) {
  console.log("Error parsing JSON:", e);
}
