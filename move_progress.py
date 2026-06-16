import sys

with open('c:/al aws done/moo_project/src/components/DashboardView.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Extract Progress Block
split1 = content.split('{/* ? „Ì“… ÃœÌœ…: ‘—Ìÿ «·≈‰Ã«“ «·ÌÊ„Ì Ê«·«Œ »«— «·ﬁ«œ„ */}')
if len(split1) < 2:
    # Try mojibake version
    found = False
    for i, line in enumerate(content.split('\n')):
        if '&& (' in line and '(todayProgress || nextExam)' in line:
            # We found the block
            pass
    print("Could not find progress block start")
    sys.exit(1)

# Just search for the code exactly
start_str = '{(todayProgress || nextExam) && ('
if start_str not in content:
    print("Could not find start str")
    sys.exit(1)

pre_progress, rest = content.split(start_str, 1)

# The end is the start of Premium Stats
end_str = '{/* ?? Premium Stats & GPA Grid */}'
if end_str not in rest:
    # Try mojibake
    end_str = 'Premium Stats & GPA Grid'
    if end_str not in rest:
        print("Could not find end str")
        sys.exit(1)

progress_content, post_progress = rest.split(end_str, 1)

# Backtrack progress_content to remove the trailing </div> and spaces if necessary
# progress_content contains everything up to Premium Stats.
# We need to remove the closing brace of the condition
progress_block_full = start_str + progress_content.rsplit('}', 1)[0] + '}'

# Remove the block from original location
content_without_progress = content.replace(progress_block_full, '')

# 2. Find the Welcome Card end
next_engine_str = '{/* Next Class Engine UI - Updated with Exam States */}'
if next_engine_str not in content_without_progress:
    print("Could not find Next Class Engine UI")
    sys.exit(1)

pre_next_engine, post_next_engine = content_without_progress.split(next_engine_str, 1)

# The Welcome card ends with a '</div>' right before next_engine_str
# We just append our modified progress block right before next_engine_str
# First, change the welcome card's flex
welcome_decl = '<div className="lg:col-span-2 glass-card p-8 rounded-[40px] relative overflow-hidden group hover-glow border border-white/60">'
if welcome_decl not in pre_next_engine:
    print("Could not find Welcome Card decl")
    sys.exit(1)

pre_next_engine = pre_next_engine.replace(welcome_decl, '<div className="lg:col-span-2 glass-card p-8 rounded-[40px] relative overflow-hidden group hover-glow border border-white/60 flex flex-col justify-between">')

# Modify progress block
mod_prog = progress_block_full.replace('<div className={`grid grid-cols-1', '<div className={`relative z-10 mt-auto pt-6 grid grid-cols-1')
# Add it before the closing div of the welcome card.
# The pre_next_engine ends with:
#             </div>
#           </div>
#           
# We want to insert mod_prog right before the last </div>
last_div_idx = pre_next_engine.rfind('</div>')
if last_div_idx == -1:
    print("Could not find last div")
    sys.exit(1)

final_pre = pre_next_engine[:last_div_idx] + '  ' + mod_prog + '\n          </div>\n\n          '

new_final_content = final_pre + next_engine_str + post_next_engine

with open('c:/al aws done/moo_project/src/components/DashboardView.jsx', 'w', encoding='utf-8') as f:
    f.write(new_final_content)

print('SUCCESS')
