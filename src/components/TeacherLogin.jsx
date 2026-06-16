/**
 * ⚠️ هذا المكوّن غير مستخدم حالياً في المشروع.
 *
 * تسجيل دخول المعلم يتم عبر LandingPage.jsx (بوابة "المعلم")
 * والتحقق يعتمد على moo_staff في localStorage:
 *
 *   const teacher = staff.find(s =>
 *     (s.username === loginData.name || s.name === loginData.name) &&
 *     s.password === loginData.password &&
 *     s.role === 'teacher'
 *   );
 *
 * لا تستخدم هذا المكوّن — احتفظ به للأرشيف فقط أو احذفه.
 */
import { ShieldCheck, Lock, ArrowLeft, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import PropTypes from 'prop-types';


const TeacherLogin = ({ onLogin, onBack }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === 'teacher123') {
      onLogin();
    } else {
      setError('كلمة المرور غير صحيحة. يرجى المحاولة مرة أخرى.');
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-2rem)] flex flex-col items-center justify-center overflow-hidden animate-fade-in">
      <div className="absolute top-1/4 -right-20 w-96 h-96 bg-royal-gold/10 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-1/4 -left-20 w-96 h-96 bg-primary/10 rounded-full blur-[120px] animate-pulse delay-700" />
      
      <button 
        onClick={onBack}
        className="absolute top-8 right-8 flex items-center gap-2 text-gray-500 hover:text-primary font-bold transition-colors z-20 bg-white/50 px-4 py-2 rounded-xl backdrop-blur-md"
      >
        <ArrowRight size={18} />
        العودة للرئيسية
      </button>

      <div className="relative z-10 w-full max-w-md">
        <div className="glass-card rounded-[40px] p-10 shadow-2xl border border-white/60 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-gray-900 to-gray-700" />
          
          <div className="text-center mb-10">
            <div className="w-20 h-20 bg-gray-900 rounded-3xl mx-auto flex items-center justify-center shadow-xl shadow-gray-900/20 mb-6 group-hover:scale-110 transition-transform">
              <ShieldCheck size={40} className="text-royal-gold" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">بوابة المعلم</h1>
            <p className="text-sm font-bold text-gray-500">نظام إدارة الحصص والجداول الدراسية</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-2 px-1">كلمة المرور الأمنية</label>
              <div className="relative">
                <Lock size={20} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  placeholder="أدخل كلمة المرور (teacher123)"
                  className="w-full bg-gray-50/50 border border-gray-200 rounded-2xl py-4 pr-12 pl-4 text-sm font-bold focus:border-gray-900 focus:bg-white outline-none transition-all"
                  autoFocus
                />
              </div>
              {error && <p className="text-xs text-red-500 font-bold mt-2 px-1">{error}</p>}
            </div>

            <button 
              type="submit"
              className="w-full bg-gray-900 text-white rounded-2xl py-4 font-bold text-sm shadow-xl shadow-gray-900/20 hover:bg-gray-800 hover:-translate-y-1 transition-all flex items-center justify-center gap-2"
            >
              دخول للوحة التحكم
              <ArrowLeft size={18} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

TeacherLogin.propTypes = {
  onLogin: PropTypes.func.isRequired,
  onBack: PropTypes.func.isRequired,
};

export default TeacherLogin;
