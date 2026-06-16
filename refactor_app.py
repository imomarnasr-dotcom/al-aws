import re

file_path = 'c:\\al aws done\\moo_project\\src\\App.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add import
if 'useCloudStorage' not in content:
    content = content.replace("import { useState, useEffect, useMemo, useCallback } from 'react';", "import { useState, useEffect, useMemo, useCallback } from 'react';\nimport { useCloudStorage } from './services/useCloudStorage';")

# Add states at the top of App component
states_to_add = """
  const [whitelist, setWhitelist] = useCloudStorage('whitelist', 'all_data', []);
  const [exams, setExams] = useCloudStorage('exams', 'all_data', []);
  const [teacherTests, setTeacherTests] = useCloudStorage('tests', 'all_data', []);
  const [achievements, setAchievements] = useCloudStorage('achievements', 'all_data', {});
  const [wallets, setWallets] = useCloudStorage('wallets', 'all_data', {});
  const [walletTransactions, setWalletTransactions] = useCloudStorage('wallet_transactions', 'all_data', []);
  const [cafeteriaMenu, setCafeteriaMenu] = useCloudStorage('cafeteria_menu', 'all_data', []);
  const [cafeteriaOrders, setCafeteriaOrders] = useCloudStorage('cafeteria_orders', 'all_data', []);
  const [attendance, setAttendance] = useCloudStorage('attendance', 'all_data', {});
  const [studentNotifs, setStudentNotifs] = useCloudStorage('student_notifications', 'all_data', {});
  const [pinnedBadges, setPinnedBadges] = useCloudStorage('pinned_badges', 'all_data', ['⭐', '🏆', '🔥', '🧠']);
  const [globalNotifs, setGlobalNotifs] = useCloudStorage('notifications', 'all_data', []);
"""

if 'const [whitelist, setWhitelist] = useCloudStorage' not in content:
    content = content.replace("function App() {", "function App() {\n" + states_to_add)

# Replacements mapping
replacements = {
    'moo_whitelist': ('whitelist', 'setWhitelist'),
    'exams': ('exams', 'setExams'),
    'moo_tests': ('teacherTests', 'setTeacherTests'),
    'moo_achievements': ('achievements', 'setAchievements'),
    'moo_wallets': ('wallets', 'setWallets'),
    'moo_wallet_transactions': ('walletTransactions', 'setWalletTransactions'),
    'moo_cafeteria_menu': ('cafeteriaMenu', 'setCafeteriaMenu'),
    'moo_cafeteria_orders': ('cafeteriaOrders', 'setCafeteriaOrders'),
    'moo_attendance': ('attendance', 'setAttendance'),
    'moo_student_notifications': ('studentNotifs', 'setStudentNotifs'),
    'moo_pinned_badges': ('pinnedBadges', 'setPinnedBadges'),
    'moo_notifications': ('globalNotifs', 'setGlobalNotifs'),
}

for key, (var_name, setter_name) in replacements.items():
    # Replace JSON.parse(localStorage.getItem(key)) variants
    pattern_get = rf"JSON\.parse\(localStorage\[?\.?\]?getItem\[?\.?\]?\('{key}'\)[^\)]*\)"
    content = re.sub(pattern_get, var_name, content)
    
    # Replace direct localStorage.getItem without JSON.parse if any
    # Wait, pinned_badges might be used directly or parsed
    
    # Replace localStorage.setItem
    pattern_set = rf"localStorage\.setItem\('{key}',\s*JSON\.stringify\((.*?)\)\);?"
    content = re.sub(pattern_set, rf"{setter_name}(\1);", content)

# Remove the updateData listener 
# The UI shouldn't rely on 'storage' event anymore, since useCloudStorage handles real-time updates!
content = re.sub(r"useEffect\(\(\) => \{\s*window\.addEventListener\('storage', updateData\);.*?\}\);", "", content, flags=re.DOTALL)
content = re.sub(r"const updateData = \(\) => \{.*?\};", "", content, flags=re.DOTALL)
content = content.replace("window.dispatchEvent(new Event('storage'));", "")
content = content.replace("window.dispatchEvent(new Event('moo-sync'));", "")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Done!')
