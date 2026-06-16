import re

file_path = 'c:\\al aws done\\moo_project\\src\\components\\AdminDashboard.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add import
if 'useCloudStorage' not in content:
    content = content.replace("import React, { useState, useEffect, useMemo, useRef } from 'react';", "import React, { useState, useEffect, useMemo, useRef } from 'react';\nimport { useCloudStorage } from '../services/useCloudStorage';")

# Replace states
replacements = {
    'moo_phases': 'phases',
    'moo_whitelist': 'whitelist',
    'moo_staff': 'staff',
    'moo_complaints': 'complaints',
    'moo_announcements': 'announcements',
    'moo_wallets': 'wallets',
    'moo_wallet_transactions': 'walletTransactions'
}

for localKey, stateVar in replacements.items():
    pattern_state = rf"const \[{stateVar}, set{stateVar[0].upper() + stateVar[1:]}\] = useState\(\(\) => {{\s*try {{ return JSON\.parse\(localStorage\[?\.?\]?getItem\[?\.?\]?\('{localKey}'\)[^;]+; }} catch {{ return [^;]+; }}\s*}}\);"
    
    match = re.search(pattern_state, content)
    if match:
        default_val = '[]' if '[]' in match.group(0) else '{}'
        cloud_key = localKey.replace('moo_', '')
        setter = f"set{stateVar[0].upper() + stateVar[1:]}"
        replacement = f"const [{stateVar}, {setter}] = useCloudStorage('{cloud_key}', 'all_data', {default_val});"
        content = content.replace(match.group(0), replacement)

# Now remove the useEffects that save to localStorage for these
for localKey in replacements.keys():
    pattern_useeffect = rf"useEffect\(\(\) => {{ localStorage\[?\.?\]?setItem\[?\.?\]?\('{localKey}'.*?}}\);?\n"
    content = re.sub(pattern_useeffect, "", content)

# Remove the window.dispatchEvent('storage') listeners to avoid confusing React since useCloudStorage is fully decoupled
with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Done!')
