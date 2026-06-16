import re

file_path = 'c:\\al aws done\\moo_project\\src\\components\\TeacherDashboard.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add import
if 'useCloudStorage' not in content:
    content = content.replace("import React, { useState, useEffect, useRef } from 'react';", "import React, { useState, useEffect, useRef } from 'react';\nimport { useCloudStorage } from '../services/useCloudStorage';")
    content = content.replace("import React, { useState, useEffect, useMemo, useRef } from 'react';", "import React, { useState, useEffect, useMemo, useRef } from 'react';\nimport { useCloudStorage } from '../services/useCloudStorage';")

# Replace states
replacements = {
    'moo_staff': 'staff',
    'moo_whitelist': 'students',
    'moo_tests': 'tests',
    'moo_announcements': 'announcements'
}

for localKey, stateVar in replacements.items():
    # Regex to match any format of useState(() => JSON.parse(localStorage.getItem('key') || '[]'))
    # Because TeacherDashboard has: const [students, setStudents] = useState(() => { try { return JSON.parse(localStorage.getItem('moo_whitelist') || '[]'); } catch { return []; } });
    pattern_state = rf"const \[{stateVar}, set{stateVar[0].upper() + stateVar[1:]}\] = useState\(\(\) => {{?.*?localStorage.*?getItem\('{localKey}'\).*?}}\)?;"
    
    match = re.search(pattern_state, content, re.DOTALL)
    if match:
        cloud_key = localKey.replace('moo_', '')
        if localKey == 'moo_whitelist': cloud_key = 'whitelist'
        setter = f"set{stateVar[0].upper() + stateVar[1:]}"
        replacement = f"const [{stateVar}, {setter}] = useCloudStorage('{cloud_key}', 'all_data', []);"
        content = content.replace(match.group(0), replacement)

    # Some are like: const [tests, setTests] = useState(() => JSON.parse(localStorage.getItem('moo_tests') || '[]'));
    pattern_state2 = rf"const \[{stateVar}, set{stateVar[0].upper() + stateVar[1:]}\] = useState\(\(\) => JSON.parse\(localStorage\.getItem\('{localKey}'\)[^\)]+\)\);"
    match2 = re.search(pattern_state2, content)
    if match2:
        cloud_key = localKey.replace('moo_', '')
        setter = f"set{stateVar[0].upper() + stateVar[1:]}"
        replacement = f"const [{stateVar}, {setter}] = useCloudStorage('{cloud_key}', 'all_data', []);"
        content = content.replace(match2.group(0), replacement)

# Remove useEffect setters
for localKey in replacements.keys():
    pattern_useeffect = rf"useEffect\(\(\) => {{\s*localStorage\.setItem\('{localKey}',.*?\n\s*}}, \[.*?\]\);"
    content = re.sub(pattern_useeffect, "", content)
    pattern_useeffect2 = rf"useEffect\(\(\) => localStorage\.setItem\('{localKey}',.*?\); \}}, \[.*?\]\);"
    content = re.sub(pattern_useeffect2, "", content)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Done!')
