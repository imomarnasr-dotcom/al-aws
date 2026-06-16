import re

file_path = 'c:\\al aws done\\moo_project\\src\\components\\ParentDashboard.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

if 'useCloudStorage' not in content:
    content = content.replace("import React, { useState, useEffect } from 'react';", "import React, { useState, useEffect } from 'react';\nimport { useCloudStorage } from '../services/useCloudStorage';")
    content = content.replace("import React, { useState, useEffect, useMemo } from 'react';", "import React, { useState, useEffect, useMemo } from 'react';\nimport { useCloudStorage } from '../services/useCloudStorage';")

hooks_to_inject = """
  const [parentNotifs, setParentNotifs] = useCloudStorage('parent_notifications', 'all_data', {});
  const [behaviorLogs, setBehaviorLogs] = useCloudStorage('behavior_logs', 'all_data', {});
  const [grades, setGrades] = useCloudStorage('grades', 'all_data', {});
  const [teacherTests, setTeacherTests] = useCloudStorage('tests', 'all_data', []);
  const [exams, setExams] = useCloudStorage('exams', 'all_data', []);
  const [achievements, setAchievements] = useCloudStorage('achievements', 'all_data', {});
  const [wallets, setWallets] = useCloudStorage('wallets', 'all_data', {});
  const [walletTransactions, setWalletTransactions] = useCloudStorage('wallet_transactions', 'all_data', []);
  const [complaints, setComplaints] = useCloudStorage('complaints', 'all_data', []);
"""

if 'const [parentNotifs, setParentNotifs] = useCloudStorage' not in content:
    content = content.replace("const ParentDashboard = ({ currentParentUser, onLogout }) => {", "const ParentDashboard = ({ currentParentUser, onLogout }) => {\n" + hooks_to_inject)

replacements_get = {
    "JSON.parse(localStorage.getItem('moo_parent_notifications') || '{}')": "parentNotifs",
    "JSON.parse(localStorage.getItem('moo_behavior_logs') || '{}')": "behaviorLogs",
    "JSON.parse(localStorage.getItem('moo_grades') || '{}')": "grades",
    "JSON.parse(localStorage.getItem('moo_tests') || '[]')": "teacherTests",
    "JSON.parse(localStorage.getItem('exams') || '[]')": "exams",
    "JSON.parse(localStorage.getItem('moo_achievements') || '{}')": "achievements",
    "JSON.parse(localStorage.getItem('moo_wallets') || '{}')": "wallets",
    "JSON.parse(localStorage.getItem('moo_wallet_transactions') || '[]')": "walletTransactions",
    "JSON.parse(localStorage.getItem('moo_complaints') || '[]')": "complaints",
}

for old, new_var in replacements_get.items():
    content = content.replace(old, new_var)

# Fix setters
patterns_set = {
    'moo_parent_notifications': 'setParentNotifs',
    'moo_complaints': 'setComplaints',
}

lines = content.split('\n')
for i, line in enumerate(lines):
    if 'localStorage.setItem' in line:
        for key, setter in patterns_set.items():
            if f"'{key}'" in line:
                match = re.search(r"JSON\.stringify\((.*?)\)", line)
                if match:
                    val = match.group(1)
                    lines[i] = re.sub(r"localStorage\.setItem\(.*?\);?", f"{setter}({val});", line)
                break

content = '\n'.join(lines)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Done!')
