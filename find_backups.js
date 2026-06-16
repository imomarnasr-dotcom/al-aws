const fs = require('fs');
const readline = require('readline');

async function processTranscript() {
  const logPath = 'C:\\Users\\CENTER_ELRahama\\.gemini\\antigravity\\brain\\b9b64a5c-7eed-4130-a826-850a81279ab6\\.system_generated\\logs\\transcript_full.jsonl';
  const fileStream = fs.createReadStream(logPath);
  
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });
  
  let filesFound = {};

  for await (const line of rl) {
    try {
      const entry = JSON.parse(line);
      const str = JSON.stringify(entry);
      
      const filesToCheck = [
        'App.jsx', 
        'DashboardView.jsx', 
        'CafeteriaView.jsx', 
        'CafeteriaAdminDashboard.jsx',
        'ExamsView.jsx',
        'GradesView.jsx',
        'ScheduleView.jsx'
      ];
      
      for (const file of filesToCheck) {
        if (str.includes(file) && (str.includes('الأحد') || str.includes('المقصف') || str.includes('الرصيد') || str.includes('اضافة') || str.includes('نعم'))) {
            // Keep track of the latest line where Arabic text and the filename co-occur
            filesFound[file] = filesFound[file] || [];
            filesFound[file].push(line.substring(0, 500) + '...');
        }
      }
    } catch (e) {}
  }

  for (const file in filesFound) {
    console.log(`Found ${filesFound[file].length} occurrences for ${file}`);
  }
}

processTranscript().catch(console.error);
