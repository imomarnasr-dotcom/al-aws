const fs = require('fs');
const path = 'C:/Users/CENTER_ELRahama/.gemini/antigravity/brain/b9b64a5c-7eed-4130-a826-850a81279ab6/.system_generated/logs/transcript_full.jsonl';
const lines = fs.readFileSync(path, 'utf-8').split('\n').filter(Boolean);

let bestCode = '';

for (const line of lines) {
    try {
        const json = JSON.parse(line);
        if (json.tool_calls) {
            for (const call of json.tool_calls) {
                if (call.name === 'write_to_file' || call.name === 'replace_file_content') {
                    const code = call.args.CodeContent || call.args.ReplacementContent;
                    if (code && code.includes('STORE_ITEMS') && code.includes('getStudentDynamicPoints')) {
                        bestCode = code;
                    }
                }
            }
        }
    } catch (e) {}
}

if (bestCode) {
    fs.writeFileSync('C:/al aws done/moo_project/extracted_app.jsx', bestCode);
    console.log('Saved to extracted_app.jsx. Length: ' + bestCode.length);
} else {
    console.log('Not found');
}
