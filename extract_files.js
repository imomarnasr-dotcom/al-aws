const fs = require('fs');
const readline = require('readline');
const path = require('path');

async function recover() {
  const logPath = 'C:\\Users\\CENTER_ELRahama\\.gemini\\antigravity\\brain\\b9b64a5c-7eed-4130-a826-850a81279ab6\\.system_generated\\logs\\transcript_full.jsonl';
  const fileStream = fs.createReadStream(logPath);
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  const recoveredDir = 'c:\\al aws done\\moo_project\\recovery';
  if (!fs.existsSync(recoveredDir)) fs.mkdirSync(recoveredDir);

  let bestContent = {
    'App.jsx': '',
    'DashboardView.jsx': '',
    'CafeteriaView.jsx': '',
    'CafeteriaAdminDashboard.jsx': '',
    'ExamsView.jsx': '',
    'GradesView.jsx': '',
    'ScheduleView.jsx': ''
  };

  for await (const line of rl) {
    try {
      const entry = JSON.parse(line);
      let textsToSearch = [];
      
      if (entry.content) textsToSearch.push(entry.content);
      
      if (entry.tool_calls) {
          entry.tool_calls.forEach(call => {
              if (call.function && call.function.arguments) {
                  textsToSearch.push(call.function.arguments);
              }
          });
      }
      
      // Some transcripts store tool output differently, try extracting from the raw JSON string
      textsToSearch.push(line);

      for (let text of textsToSearch) {
        if (!text) continue;
        
        for (const file in bestContent) {
          // If this block of text looks like it has the source code
          if (text.includes("import ") && text.includes("export default " + file.replace('.jsx', ''))) {
             const arabicMatches = text.match(/[\u0600-\u06FF]/g) || [];
             const oldMatches = bestContent[file].match(/[\u0600-\u06FF]/g) || [];
             if (arabicMatches.length > oldMatches.length) {
                // If the text comes from a JSON string, try to parse it or just save the raw text
                bestContent[file] = text;
             }
          }
        }
      }
    } catch (e) {}
  }

  for (const file in bestContent) {
     // Try to clean up if it's JSON encoded
     let out = bestContent[file];
     try {
         // Attempt to extract the "output" from the JSON line if it's a tool response
         const parsed = JSON.parse(out);
         if (parsed.content && Array.isArray(parsed.content)) {
            // Claude-like format
            out = parsed.content.map(c => c.text).join('\n');
         } else if (parsed.tool_responses) {
             out = JSON.stringify(parsed.tool_responses, null, 2);
         }
     } catch (e) {}
     
     fs.writeFileSync(path.join(recoveredDir, file), out, 'utf8');
     console.log('Recovered best match for', file, 'length:', out.length);
  }
}

recover().catch(console.error);
