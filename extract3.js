const fs = require('fs');
const path = 'C:/Users/CENTER_ELRahama/.gemini/antigravity/brain/b9b64a5c-7eed-4130-a826-850a81279ab6/.system_generated/logs/transcript_full.jsonl';
const lines = fs.readFileSync(path, 'utf-8').split('\n').filter(Boolean);

let found = false;

for (const line of lines) {
    try {
        const json = JSON.parse(line);
        if (json.content && json.content.includes('const STORE_ITEMS =')) {
            fs.writeFileSync('C:/al aws done/moo_project/extracted_app.jsx', json.content);
            console.log('Found it in content! Length: ' + json.content.length);
            found = true;
            break;
        }
    } catch (e) {}
}

if (!found) {
    console.log('Not found');
}
