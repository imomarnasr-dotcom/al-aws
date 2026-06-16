import re

file_path = 'c:\\al aws done\\moo_project\\src\\components\\CafeteriaAdminDashboard.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

if 'useCloudStorage' not in content:
    content = content.replace("import React, { useState, useEffect } from 'react';", "import React, { useState, useEffect } from 'react';\nimport { useCloudStorage } from '../services/useCloudStorage';")

hooks_to_inject = """
  const [menu, setMenu] = useCloudStorage('cafeteria_menu', 'all_data', []);
  const [orders, setOrders] = useCloudStorage('cafeteria_orders', 'all_data', []);
  const [wallets, setWallets] = useCloudStorage('wallets', 'all_data', {});
  const [schoolVault, setSchoolVault] = useCloudStorage('school_vault', 'all_data', 0);
  const [walletTransactions, setWalletTransactions] = useCloudStorage('wallet_transactions', 'all_data', []);
  const [staff, setStaff] = useCloudStorage('staff', 'all_data', []);
"""

if 'const [menu, setMenu] = useCloudStorage' not in content:
    content = content.replace("const CafeteriaAdminDashboard = ({ onLogout }) => {", "const CafeteriaAdminDashboard = ({ onLogout }) => {\n" + hooks_to_inject)

# Replacements GET
replacements_get = {
    "JSON.parse(localStorage.getItem('moo_cafeteria_menu')) || []": "menu",
    "JSON.parse(localStorage.getItem('moo_cafeteria_orders')) || []": "orders",
    "JSON.parse(localStorage.getItem('moo_wallets')) || {}": "wallets",
    "JSON.parse(localStorage.getItem('moo_wallet_transactions')) || []": "walletTransactions",
    "JSON.parse(localStorage.getItem('moo_staff') || '[]')": "staff",
    "parseFloat(localStorage.getItem('moo_school_vault')) || 0": "schoolVault",
}

for old, new_var in replacements_get.items():
    content = content.replace(old, new_var)

# Fix setters
patterns_set = {
    'moo_cafeteria_menu': 'setMenu',
    'moo_cafeteria_orders': 'setOrders',
    'moo_wallets': 'setWallets',
    'moo_wallet_transactions': 'setWalletTransactions',
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
        
        if "'moo_school_vault'" in line:
            # localStorage.setItem('moo_school_vault', (currentVault + totalToDeduct).toString());
            # match whatever is inside the second argument, strip .toString()
            match = re.search(r"localStorage\.setItem\('moo_school_vault',\s*(.*?)\.toString\(\)\);?", line)
            if match:
                val = match.group(1)
                lines[i] = re.sub(r"localStorage\.setItem\(.*?\);?", f"setSchoolVault({val});", line)

content = '\n'.join(lines)

# Remove old useStates that we replaced
content = re.sub(r"const \[menu, setMenu\] = useState\(\(\) => menu\);", "", content)
content = re.sub(r"const \[orders, setOrders\] = useState\(\(\) => orders\);", "", content)
content = re.sub(r"const \[wallets, setWallets\] = useState\(\(\) => wallets\);", "", content)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Done!')
