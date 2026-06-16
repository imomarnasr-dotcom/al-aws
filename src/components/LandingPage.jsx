import { GraduationCap, ArrowLeft, ShieldCheck, UserCircle, KeyRound, Users, User, Store, BookOpen } from 'lucide-react';
import { useState, useMemo } from 'react';
import PropTypes from 'prop-types';

const LandingPage = ({ onNavigate }) => {
  const [activePortal, setActivePortal] = useState('student');
  const [loginData, setLoginData] = useState({ name: '', id: '', password: '', className: '' });
  const [error, setError] = useState('');

  // 🔥 جلب الفصول ديناميكياً من الهيكل الدراسي اللي بيعمله المسئول
  const globalClasses = useMemo(() => {
    try {
      const phases = JSON.parse(localStorage.getItem('moo_phases'));
      if (phases && phases.length > 0) {
        return phases.reduce((acc, p) => [...acc, ...p.classes], []);
      }

      const saved = JSON.parse(localStorage.getItem('moo_global_classes') || '[]');
      return (saved?.length > 0) ? saved : [
        'أول ابتدائي', 'ثاني ابتدائي', 'ثالث ابتدائي',
        'رابع ابتدائي', 'خامس ابتدائي', 'سادس ابتدائي',
        'أول متوسط', 'ثاني متوسط', 'ثالث متوسط',
        'أول ثانوي', 'ثاني ثانوي', 'ثالث ثانوي',
      ];
    } catch { return []; }
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');

    try {
      const staff = JSON.parse(localStorage.getItem('moo_staff') || '[]') || [];

      // Helper function to normalize strings: lowercase, trimmed, and multiple spaces replaced with single space
      const normalize = (str) => str ? str.toString().trim().replace(/\s+/g, ' ').toLowerCase() : '';
      
      const loginName = normalize(loginData.name);
      const loginId = normalize(loginData.id);
      const loginPassword = normalize(loginData.password);
      const loginClassName = normalize(loginData.className);

      // ==========================================
      // 1. بوابة الإدارة (المسؤول)
      // ==========================================
      if (activePortal === 'admin') {
        let adminCredentials = { name: 'محمد عمر', password: '0000' };
        try {
          const saved = localStorage.getItem('moo_admin_credentials');
          if (saved) adminCredentials = { ...adminCredentials, ...JSON.parse(saved) };
        } catch { }

        if (
          (loginName === normalize(adminCredentials.name) || loginName === 'admin' || loginName === 'مدير') &&
          loginPassword === normalize(adminCredentials.password)
        ) {
          return onNavigate('admin', { role: 'admin', name: adminCredentials.name, username: adminCredentials.name });
        }

        const adminStaff = staff.find(s => 
          (normalize(s.username) === loginName || normalize(s.name) === loginName) && 
          normalize(s.password) === loginPassword && 
          (s.role === 'admin' || s.role === 'deputy')
        );
        if (adminStaff) return onNavigate('admin', adminStaff);

        return setError('❌ بيانات دخول غير صحيحة للإدارة، أو لا تملك صلاحية الوصول.');
      }

      // ==========================================
      // 2. بوابة المعلمين
      // ==========================================
      if (activePortal === 'teacher') {
        const teacher = staff.find(s =>
          (normalize(s.username) === loginName || normalize(s.name) === loginName) &&
          normalize(s.password) === loginPassword &&
          s.role === 'teacher'
        );

        if (teacher) {
          return onNavigate('teacher-dashboard', teacher);
        }
        return setError('❌ بيانات الدخول غير صحيحة للمعلم. يرجى مراجعة المسؤول.');
      }

      // ==========================================
      // 3. بوابة الموظفين (المقصف)
      // ==========================================
      if (activePortal === 'staff') {
        const staffMember = staff.find(s =>
          (normalize(s.username) === loginName || normalize(s.name) === loginName) &&
          normalize(s.password) === loginPassword &&
          s.role === 'cafeteria'
        );

        if (staffMember) {
          return onNavigate('cafeteria-admin', staffMember);
        }
        return setError('❌ بيانات دخول غير صحيحة لموظف المقصف.');
      }

      // ==========================================
      // 4. بوابة الطلاب
      // ==========================================
      if (activePortal === 'student') {
        const whitelist = JSON.parse(localStorage.getItem('moo_whitelist') || '[]') || [];
        const isWhitelisted = whitelist.find(s =>
          normalize(s.id) === loginId &&
          normalize(s.name) === loginName &&
          normalize(s.password) === loginPassword &&
          normalize(s.className) === loginClassName
        );

        if (isWhitelisted) {
          return onNavigate('home', isWhitelisted);
        } else {
          return setError('❌ بيانات الدخول غير متطابقة، تأكد من الرقم الأكاديمي والاسم والفصل.');
        }
      }

      // ==========================================
      // 5. بوابة ولي الأمر
      // ==========================================
      if (activePortal === 'parent') {
        const whitelist = JSON.parse(localStorage.getItem('moo_whitelist') || '[]') || [];
        const isParent = whitelist.find(s =>
          normalize(s.parentName) === loginName &&
          normalize(s.id) === loginId &&
          normalize(s.parentPassword) === loginPassword
        );

        if (isParent) {
          return onNavigate('parent-dashboard', isParent);
        } else {
          return setError('❌ بيانات الدخول غير صحيحة لولي الأمر (تأكد من الاسم والرقم الأكاديمي وكلمة المرور).');
        }
      }
    } catch (err) {
      setError('حدث خطأ في النظام، يرجى المحاولة مرة أخرى');
    }
  };

  const portals = [
    { id: 'student', label: 'الطلاب', icon: <User size={18} /> },
    { id: 'parent', label: 'أولياء الأمور', icon: <Users size={18} /> },
    { id: 'teacher', label: 'المعلمين', icon: <BookOpen size={18} /> },
    { id: 'admin', label: 'الإدارة', icon: <ShieldCheck size={18} /> },
    { id: 'staff', label: 'المقصف', icon: <Store size={18} /> }
  ];

  const resetAndSwitch = (id) => {
    setActivePortal(id);
    setLoginData({ name: '', id: '', password: '', className: '' });
    setError('');
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-6 relative overflow-hidden font-main" dir="rtl">
      <div className="absolute top-1/4 -right-48 w-96 h-96 bg-primary/10 rounded-full blur-[100px] animate-pulse" />
      <div className="absolute bottom-1/4 -left-48 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] animate-pulse delay-1000" />

      <div className="glass-card rounded-[32px] sm:rounded-[40px] p-6 sm:p-8 md:p-12 max-w-2xl w-full border border-white/60 relative z-10 hover-glow group">

        <div className="text-center mb-8 relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-all duration-700" />
          <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto flex items-center justify-center shadow-2xl shadow-primary/20 mb-4 sm:mb-6 relative z-10 group-hover:scale-110 transition-all duration-500 bg-white rounded-3xl border border-gray-100 p-2">
            <img src="/logo.jpg" alt="Logo" className="w-full h-full object-contain rounded-2xl" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2 sm:mb-4 font-title tracking-tight">مدارس الأوس الأهلية</h1>
        </div>

        {/* أزرار اختيار البوابة - تم التحديث لـ 5 بوابات */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-3 mb-8 sm:mb-10 bg-white/30 p-1.5 sm:p-2 rounded-2xl border border-white/50">
          {portals.map((p) => (
            <button
              key={p.id}
              onClick={() => resetAndSwitch(p.id)}
              className={`flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 sm:py-3 px-1 sm:px-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 ${activePortal === p.id
                ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-100 sm:scale-105'
                : 'text-gray-500 hover:bg-white/50 hover:text-gray-900'
                }`}
            >
              {p.icon}
              {p.label}
            </button>
          ))}
        </div>

        {/* نموذج تسجيل الدخول */}
        <form onSubmit={handleLogin} className="space-y-5 animate-fade-in">
          {error && (
            <div className="bg-red-50 text-red-500 p-4 rounded-2xl text-xs font-bold text-center border border-red-100 animate-fade-in flex items-center justify-center gap-2">
              <ShieldCheck size={16} />
              {error}
            </div>
          )}

          <div className="relative">
            <UserCircle className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              required
              placeholder={activePortal === 'student' ? "الاسم الثلاثي للطالب" : activePortal === 'parent' ? "اسم ولي الأمر" : "الاسم أو اسم المستخدم"}
              className="w-full bg-white/50 border border-gray-200 rounded-2xl py-4 pr-12 pl-4 text-sm font-bold focus:border-primary focus:bg-white outline-none transition-all shadow-sm"
              value={loginData.name}
              onChange={(e) => setLoginData({ ...loginData, name: e.target.value })}
            />
          </div>

          {(activePortal === 'student' || activePortal === 'parent') && (
            <div className="relative animate-fade-in space-y-5">
              <div className="relative">
                <ShieldCheck className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  required
                  placeholder="الرقم الأكاديمي للطالب (AWS00000)"
                  className="w-full bg-white/50 border border-gray-200 rounded-2xl py-4 pr-12 pl-4 text-sm font-bold focus:border-primary focus:bg-white outline-none transition-all shadow-sm font-mono"
                  value={loginData.id}
                  onChange={(e) => setLoginData({ ...loginData, id: e.target.value })}
                />
              </div>

              {activePortal === 'student' && (
                <select
                  required
                  value={loginData.className}
                  onChange={e => setLoginData({ ...loginData, className: e.target.value })}
                  className="w-full bg-white/50 border border-gray-200 rounded-2xl px-4 py-4 text-sm font-bold focus:border-primary focus:bg-white outline-none transition-all shadow-sm cursor-pointer"
                >
                  <option value="">اختر الفصل</option>
                  {globalClasses.map((cls, i) => (
                    <option key={i} value={cls}>{cls}</option>
                  ))}
                </select>
              )}
            </div>
          )}

          <div className="relative">
            <KeyRound className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="password"
              required
              placeholder="كلمة المرور"
              className="w-full bg-white/50 border border-gray-200 rounded-2xl py-4 pr-12 pl-4 text-sm font-bold focus:border-primary focus:bg-white outline-none transition-all shadow-sm"
              value={loginData.password}
              onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
            />
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-gray-900 to-gray-800 text-white rounded-2xl py-4 font-bold text-base shadow-xl shadow-gray-900/20 hover:shadow-2xl hover:shadow-gray-900/30 hover:-translate-y-1 transition-all flex items-center justify-center gap-2 group mt-6 border border-gray-700"
          >
            تسجيل الدخول
            <ArrowLeft size={20} className="group-hover:-translate-x-2 transition-transform" />
          </button>
        </form>

        <div className="mt-8 text-center border-t border-gray-100 pt-6">
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Al-Aws OS v3.0 | Role-Based Access</p>
        </div>
      </div>
    </div>
  );
};

LandingPage.propTypes = {
  onNavigate: PropTypes.func.isRequired,
};

export default LandingPage;