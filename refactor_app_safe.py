import re

file_path = 'c:\\al aws done\\moo_project\\src\\App.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add Import
if 'useCloudStorage' not in content:
    content = content.replace("import { useState, useEffect, useMemo, useCallback } from 'react';", "import { useState, useEffect, useMemo, useCallback } from 'react';\nimport { useCloudStorage } from './services/useCloudStorage';")

# 2. Add Hooks inside const App = () => {
hooks_to_inject = """
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

if 'useCloudStorage(' not in content:
    content = content.replace("const App = () => {", "const App = () => {\n" + hooks_to_inject)

# 3. Simple text replacements (NO REGEX to avoid hanging)
replacements_get = {
    "JSON.parse(localStorage.getItem('moo_whitelist') || '[]')": "whitelist",
    "JSON.parse(localStorage.getItem('moo_whitelist'))": "whitelist",
    "JSON.parse(localStorage.getItem('exams') || '[]')": "exams",
    "JSON.parse(localStorage.getItem('exams'))": "exams",
    "JSON.parse(localStorage.getItem('moo_tests') || '[]')": "teacherTests",
    "JSON.parse(localStorage.getItem('moo_tests'))": "teacherTests",
    "JSON.parse(localStorage.getItem('moo_achievements') || '{}')": "achievements",
    "JSON.parse(localStorage.getItem('moo_achievements'))": "achievements",
    "JSON.parse(localStorage.getItem('moo_wallets') || '{}')": "wallets",
    "JSON.parse(localStorage.getItem('moo_wallets'))": "wallets",
    "JSON.parse(localStorage.getItem('moo_wallet_transactions') || '[]')": "walletTransactions",
    "JSON.parse(localStorage.getItem('moo_wallet_transactions'))": "walletTransactions",
    "JSON.parse(localStorage.getItem('moo_cafeteria_menu') || '[]')": "cafeteriaMenu",
    "JSON.parse(localStorage.getItem('moo_cafeteria_menu'))": "cafeteriaMenu",
    "JSON.parse(localStorage.getItem('moo_cafeteria_orders') || '[]')": "cafeteriaOrders",
    "JSON.parse(localStorage.getItem('moo_cafeteria_orders'))": "cafeteriaOrders",
    "JSON.parse(localStorage.getItem('moo_attendance') || '{}')": "attendance",
    "JSON.parse(localStorage.getItem('moo_attendance'))": "attendance",
    "JSON.parse(localStorage.getItem('moo_student_notifications') || '{}')": "studentNotifs",
    "JSON.parse(localStorage.getItem('moo_student_notifications'))": "studentNotifs",
    "JSON.parse(localStorage.getItem('moo_pinned_badges') || 'null')": "pinnedBadges",
    "JSON.parse(localStorage.getItem('moo_pinned_badges'))": "pinnedBadges",
    "JSON.parse(localStorage.getItem('moo_notifications') || '[]')": "globalNotifs",
    "JSON.parse(localStorage.getItem('moo_notifications'))": "globalNotifs",
}

for old, new_var in replacements_get.items():
    content = content.replace(old, new_var)

# Also fix the weird fallback one:
content = content.replace("JSON.parse(localStorage.getItem('moo_pinned_badges')) || ['⭐', '🏆', '🔥', '🧠']", "pinnedBadges")

# 4. Replace setItem with direct simple regex on single lines
patterns_set = {
    'moo_whitelist': 'setWhitelist',
    'exams': 'setExams',
    'moo_tests': 'setTeacherTests',
    'moo_achievements': 'setAchievements',
    'moo_wallets': 'setWallets',
    'moo_wallet_transactions': 'setWalletTransactions',
    'moo_cafeteria_menu': 'setCafeteriaMenu',
    'moo_cafeteria_orders': 'setCafeteriaOrders',
    'moo_attendance': 'setAttendance',
    'moo_student_notifications': 'setStudentNotifs',
    'moo_pinned_badges': 'setPinnedBadges',
    'moo_notifications': 'setGlobalNotifs',
}

lines = content.split('\n')
for i, line in enumerate(lines):
    if 'localStorage.setItem' in line:
        for key, setter in patterns_set.items():
            if f"'{key}'" in line:
                # Find what is being stringified
                match = re.search(r"JSON\.stringify\((.*?)\)", line)
                if match:
                    val = match.group(1)
                    # Replace the entire localStorage.setItem(...) with setter(...)
                    lines[i] = re.sub(r"localStorage\.setItem\(.*?\);?", f"{setter}({val});", line)
                break

content = '\n'.join(lines)

# 5. Comment out updateData logic
content = content.replace("window.addEventListener('storage', updateData);", "// window.addEventListener('storage', updateData);")
content = content.replace("window.addEventListener('moo-sync', updateData);", "// window.addEventListener('moo-sync', updateData);")
content = content.replace("window.removeEventListener('storage', updateData);", "// window.removeEventListener('storage', updateData);")
content = content.replace("window.removeEventListener('moo-sync', updateData);", "// window.removeEventListener('moo-sync', updateData);")


with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Done!')
