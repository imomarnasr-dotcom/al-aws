const fs = require('fs');
let c = fs.readFileSync('src/components/TeacherDashboard.jsx', 'utf8');

c = c.replace(
  "import { LogOut, Calendar, Clock, BookOpen, Trash2, X, Users, ClipboardCheck, FileText, Lock, AlertCircle, Bell, Plus, Save, CheckCircle2, Edit2, Search, Megaphone, BarChart2, Download } from 'lucide-react';",
  "import { LogOut, Calendar, Clock, BookOpen, Trash2, X, Users, ClipboardCheck, FileText, Lock, AlertCircle, Bell, Plus, Save, CheckCircle2, Edit2, Search, Megaphone, BarChart2, Download, ArrowLeft } from 'lucide-react';"
);

c = c.replace(
  'className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-2xl flex-wrap"',
  'className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-2xl overflow-x-auto whitespace-nowrap hide-scrollbar"'
);

c = c.replace(
  /<button onClick=\{\(\) => setActiveTab\('tasks'\)\} className=\{`px-6 py-2 rounded-xl font-bold text-sm transition-all \$\{activeTab === 'tasks' \? 'bg-white text-purple-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'\}`\}>المهام المعلقة<\/button>/,
  `{JSON.parse(localStorage.getItem('moo_grace_periods') || '[]').filter(g => g.teacher === teacherProfile.name && (!g.status || g.status === 'pending_teacher')).length > 0 && (<button onClick={() => setActiveTab('tasks')} className={\`px-4 py-2 rounded-xl font-bold text-sm transition-all relative \${activeTab === 'tasks' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'}\`}>المهام المعلقة<span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping"></span><span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span></button>)}`
);

c = c.replace(/px-6 py-2/g, 'px-4 py-2');
c = c.replace(/relative px-6 py-2/g, 'relative px-4 py-2');

fs.writeFileSync('src/components/TeacherDashboard.jsx', c);
console.log('Done!');
