import re

file_path = 'c:\\al aws done\\moo_project\\src\\components\\TeacherDashboard.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add states at the top of the component (right after const TeacherDashboard = ({ user, onLogout }) => {)
states_to_add = """
  const [questionBank, setQuestionBank] = useCloudStorage('question_bank', 'all_data', []);
  const [exams, setExams] = useCloudStorage('exams', 'all_data', []);
  const [attendance, setAttendance] = useCloudStorage('attendance', 'all_data', {});
  const [grades, setGrades] = useCloudStorage('grades', 'all_data', {});
  const [paperGrades, setPaperGrades] = useCloudStorage('paper_exam_grades', 'all_data', {});
  const [paperArchive, setPaperArchive] = useCloudStorage('paper_exam_archive', 'all_data', []);
  const [gracePeriods, setGracePeriods] = useCloudStorage('grace_periods', 'all_data', []);
  const [globalClasses, setGlobalClasses] = useCloudStorage('classes', 'all_data', []);
  const [notificationsData, setNotificationsData] = useCloudStorage('notifications', 'all_data', []);
"""

if 'setQuestionBank] = useCloudStorage' not in content:
    content = content.replace("const TeacherDashboard = ({ user, onLogout }) => {", "const TeacherDashboard = ({ user, onLogout }) => {\n" + states_to_add)

# Now, we replace JSON.parse(localStorage.getItem('key')) with the corresponding state variable
replacements = {
    'moo_question_bank': ('questionBank', 'setQuestionBank'),
    'exams': ('exams', 'setExams'),
    'moo_attendance': ('attendance', 'setAttendance'),
    'moo_grades': ('grades', 'setGrades'),
    'moo_paper_exam_grades': ('paperGrades', 'setPaperGrades'),
    'moo_paper_exam_archive': ('paperArchive', 'setPaperArchive'),
    'moo_grace_periods': ('gracePeriods', 'setGracePeriods'),
    'moo_global_classes': ('globalClasses', 'setGlobalClasses'),
    'moo_notifications': ('notificationsData', 'setNotificationsData'),
    'moo_announcements': ('announcements', 'setAnnouncements'),
}

for key, (var_name, setter_name) in replacements.items():
    # Replace JSON.parse(localStorage.getItem(key) || '...') with var_name
    pattern_get = rf"JSON\.parse\(localStorage\[?\.?\]?getItem\[?\.?\]?\('{key}'\)[^\)]*\)"
    content = re.sub(pattern_get, var_name, content)
    
    # Replace localStorage.setItem(key, JSON.stringify(val)) with setter_name(val)
    pattern_set = rf"localStorage\.setItem\('{key}',\s*JSON\.stringify\((.*?)\)\);?"
    content = re.sub(pattern_set, rf"{setter_name}(\1);", content)

# Remove the confusing states that were initialized using the now-replaced getters
# Example: const [savedGrades, setSavedGrades] = useState(() => grades); -> we can just keep them or remove them. 
# It's better to just let them be initialized with the state variables, which works fine in React. 
# But let's fix the useEffects that are no longer needed
for key in replacements.keys():
    pattern_useeffect = rf"useEffect\(\(\) => {{\s*localStorage\.setItem\('{key}',.*?\n\s*}}, \[.*?\]\);"
    content = re.sub(pattern_useeffect, "", content)

# Fix window.dispatchEvent
content = content.replace("window.dispatchEvent(new Event('storage'));", "")
content = content.replace("window.dispatchEvent(new Event('moo-sync'));", "")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Done!')
