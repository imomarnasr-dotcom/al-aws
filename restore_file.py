import os

diff_file = 'real_diff.txt'
target_file = r'src/components/TeacherDashboard.jsx'

with open(diff_file, 'r', encoding='utf-8') as f:
    diff_lines = f.readlines()

in_block = False
deleted_lines = []

for line in diff_lines:
    if line.startswith('@@ -1092,395'):
        in_block = True
        continue
    
    if in_block:
        if line.startswith('@@ '):
            break
        if line.startswith('-') and not line.startswith('---'):
            deleted_lines.append(line[1:]) # keep newline
        elif line.startswith(' ') and len(deleted_lines) > 0 and len(deleted_lines) < 380:
            pass # ignore context lines inside the block unless we need them? 
            # Wait, diff shows all deleted lines as '-'. Context lines are ' '. 
            # Let's just collect all '-' lines!
            
print(f"Extracted {len(deleted_lines)} deleted lines.")

# Now we need to insert them back into TeacherDashboard.jsx
with open(target_file, 'r', encoding='utf-8') as f:
    code_lines = f.readlines()

# Find the insertion point:
# setGracePeriodMode(null);
# } <--- Wait, was '}' deleted?
# Let's check the first few deleted lines
# No printing

# The insertion point in the broken file is exactly where the 395 lines were deleted.
# In the broken file, after `setGracePeriodMode(null);`, the next line is `                              )}`
# Let's find this exact transition in the broken file.

insertion_index = -1
for i in range(len(code_lines) - 1):
    if 'setGracePeriodMode(null);' in code_lines[i] and ')}' in code_lines[i+1]:
        insertion_index = i + 1
        break

if insertion_index != -1:
    code_lines = code_lines[:insertion_index] + deleted_lines + code_lines[insertion_index:]
    with open(target_file, 'w', encoding='utf-8') as f:
        f.writelines(code_lines)
    print("File restored successfully!")
else:
    print("Could not find insertion point!")

