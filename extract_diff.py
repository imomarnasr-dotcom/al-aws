import json
import os

transcript_path = r'C:\Users\CENTER_ELRahama\.gemini\antigravity\brain\b9b64a5c-7eed-4130-a826-850a81279ab6\.system_generated\logs\transcript_full.jsonl'

with open(transcript_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

for line in reversed(lines):
    if 'The following changes were made by the multi_replace_file_content tool to' in line and '[diff_block_start]' in line:
        obj = json.loads(line)
        content = obj.get('content', '')
        if 'The following changes were made' in content:
            with open('real_diff.txt', 'w', encoding='utf-8') as out:
                out.write(content)
            print('Dumped to real_diff.txt')
            break
