import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { User, Shield, Lock, Save, Eye, EyeOff, CheckCircle2, Palette } from 'lucide-react';

const AdminSettingsView = ({ account, isDeputy }) => {
  const [activeTab, setActiveTab] = useState('profile');
  
  // --- Profile Name Change State ---
  const [nameForm, setNameForm] = useState(account?.name || (isDeputy ? 'وكيل' : 'محمد عمر'));
  const [namePassword, setNamePassword] = useState('');
  const [showNamePw, setShowNamePw] = useState(false);
  const [nameMsg, setNameMsg] = useState({ text: '', ok: false });

  const handleChangeName = () => {
    if (!nameForm.trim()) return setNameMsg({ text: 'أدخل الاسم الجديد', ok: false });
    if (!namePassword) return setNameMsg({ text: 'أدخل كلمة المرور لتأكيد التغيير', ok: false });

    if (isDeputy) {
      const staffList = JSON.parse(localStorage.getItem('moo_staff') || '[]');
      const myAccountIndex = staffList.findIndex(s => s.username === account?.username || s.name === account?.name);
      
      if (myAccountIndex === -1 || namePassword !== staffList[myAccountIndex].password) {
        return setNameMsg({ text: '❌ كلمة المرور خاطئة', ok: false });
      }

      staffList[myAccountIndex].name = nameForm;
      localStorage.setItem('moo_staff', JSON.stringify(staffList));
      window.dispatchEvent(new Event('storage')); window.dispatchEvent(new CustomEvent('moo-sync'));
      
    } else {
      const adminCreds = JSON.parse(localStorage.getItem('moo_admin_credentials') || '{"password":"0000"}');
      const actualPassword = adminCreds.password || '0000';

      if (namePassword !== actualPassword) {
        return setNameMsg({ text: '❌ كلمة المرور خاطئة', ok: false });
      }

      const newCreds = { ...adminCreds, name: nameForm };
      localStorage.setItem('moo_admin_credentials', JSON.stringify(newCreds));
      window.dispatchEvent(new Event('storage')); window.dispatchEvent(new CustomEvent('moo-sync'));
    }

    setNameMsg({ text: '✅ تم تغيير الاسم بنجاح! سيتم تحديث الصفحة...', ok: true });
    setNamePassword('');
    setTimeout(() => window.location.reload(), 1500);
  };

  // --- Password Change State ---
  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' });
  const [showPw, setShowPw] = useState({ current: false, newPw: false, confirm: false });
  const [pwMsg, setPwMsg] = useState({ text: '', ok: false });

  const handleChangePassword = () => {
    if (!pwForm.current) return setPwMsg({ text: 'أدخل كلمة المرور الحالية', ok: false });
    if (pwForm.newPw.length < 6) return setPwMsg({ text: '❌ كلمة المرور الجديدة أقل من 6 أحرف', ok: false });
    if (pwForm.newPw !== pwForm.confirm) return setPwMsg({ text: '❌ كلمة المرور الجديدة غير متطابقة', ok: false });

    if (isDeputy) {
      const staffList = JSON.parse(localStorage.getItem('moo_staff') || '[]');
      const myAccountIndex = staffList.findIndex(s => s.username === account?.username || s.name === account?.name);
      
      if (myAccountIndex === -1 || pwForm.current !== staffList[myAccountIndex].password) {
        return setPwMsg({ text: '❌ كلمة المرور الحالية خاطئة', ok: false });
      }

      staffList[myAccountIndex].password = pwForm.newPw;
      localStorage.setItem('moo_staff', JSON.stringify(staffList));
      window.dispatchEvent(new Event('storage')); window.dispatchEvent(new CustomEvent('moo-sync'));
      
    } else {
      const adminCreds = JSON.parse(localStorage.getItem('moo_admin_credentials') || '{"password":"0000"}');
      const actualPassword = adminCreds.password || '0000';

      if (pwForm.current !== actualPassword) {
        return setPwMsg({ text: '❌ كلمة المرور الحالية خاطئة', ok: false });
      }

      const newCreds = { ...adminCreds, password: pwForm.newPw };
      localStorage.setItem('moo_admin_credentials', JSON.stringify(newCreds));
      window.dispatchEvent(new Event('storage')); window.dispatchEvent(new CustomEvent('moo-sync'));
    }

    setPwMsg({ text: '✅ تم تغيير كلمة المرور بنجاح!', ok: true });
    setPwForm({ current: '', newPw: '', confirm: '' });
  };

  // --- Theme & Appearance ---
  const [theme, setTheme] = useState({
    primary: document.documentElement.style.getPropertyValue('--primary-color') || '#7C3AED',
    bg: document.documentElement.style.getPropertyValue('--bg-color') || '#F8F9FA'
  });

  const [themeMsg, setThemeMsg] = useState({ text: '', ok: false });

  const updateTheme = (key, value) => {
    const newTheme = { ...theme, [key]: value };
    setTheme(newTheme);
    document.documentElement.style.setProperty(`--${key}-color`, value);
    if (key === 'primary') {
      const r = parseInt(value.slice(1, 3), 16);
      const g = parseInt(value.slice(3, 5), 16);
      const b = parseInt(value.slice(5, 7), 16);
      document.documentElement.style.setProperty('--primary-rgb', `${r}, ${g}, ${b}`);
    }
  };

  const saveThemeSettings = () => {
    localStorage.setItem('moo_theme_primary', theme.primary);
    window.dispatchEvent(new Event('storage')); window.dispatchEvent(new CustomEvent('moo-sync'));
    localStorage.setItem('moo_theme_bg', theme.bg);
    window.dispatchEvent(new Event('storage')); window.dispatchEvent(new CustomEvent('moo-sync'));
    setThemeMsg({ text: '✅ تم حفظ الثيم بنجاح!', ok: true });
    setTimeout(() => setThemeMsg({ text: '', ok: false }), 3000);
  };

  const [magicCursor, setMagicCursor] = useState(localStorage.getItem('moo_magic_cursor') !== 'false');

  const toggleMagicCursor = () => {
    const newVal = !magicCursor;
    setMagicCursor(newVal);
    localStorage.setItem('moo_magic_cursor', newVal.toString());
    window.dispatchEvent(new Event('storage')); window.dispatchEvent(new CustomEvent('moo-sync'));
    window.dispatchEvent(new Event('magic_cursor_toggled'));
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4 mb-8 border-b border-gray-100 pb-6">
        <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
          <Shield size={28} />
        </div>
        <div>
          <h2 className="text-2xl font-black text-gray-800">إعدادات الحساب</h2>
          <p className="text-gray-500 font-bold mt-1">
            إدارة {isDeputy ? 'حساب الوكيل' : 'حساب المدير العام'} والمظهر
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1 space-y-2">
          {[
            { id: 'profile', icon: User, label: 'الملف الشخصي' },
            { id: 'security', icon: Lock, label: 'الأمان والمرور' },
            { id: 'appearance', icon: Palette, label: 'المظهر والسمات' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold transition-all ${
                activeTab === tab.id 
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20' 
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-100'
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="md:col-span-3">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm min-h-[400px]"
          >
            {activeTab === 'profile' && (
              <div className="max-w-xl space-y-6">
                <h3 className="text-lg font-black text-gray-800 flex items-center gap-2 mb-6">
                  <User className="text-emerald-500" size={20} />
                  بيانات الحساب الأساسية
                </h3>
                
                {nameMsg.text && (
                  <div className={`p-4 rounded-xl flex items-center gap-3 font-bold ${nameMsg.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                    {nameMsg.ok ? <CheckCircle2 size={20} /> : <Shield size={20} />}
                    {nameMsg.text}
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-500 mb-2">الدور / الصلاحية</label>
                    <input 
                      type="text" 
                      value={isDeputy ? 'وكيل مدرسة' : 'مدير عام'} 
                      readOnly 
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-bold text-gray-700 focus:ring-0 cursor-not-allowed outline-none" 
                    />
                  </div>

                  <div className="pt-4 border-t border-gray-100">
                    <label className="block text-sm font-bold text-gray-600 mb-2">اسم العرض</label>
                    <input 
                      type="text" 
                      value={nameForm} 
                      onChange={(e) => setNameForm(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 font-bold text-gray-800 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all" 
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-600 mb-2">تأكيد كلمة المرور (مطلوب لتغيير الاسم)</label>
                    <div className="relative">
                      <input
                        type={showNamePw ? "text" : "password"}
                        value={namePassword}
                        onChange={(e) => setNamePassword(e.target.value)}
                        placeholder="أدخل كلمة المرور الحالية لتأكيد التغيير"
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 pl-12 font-bold text-gray-800 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                      />
                      <button
                        onClick={() => setShowNamePw(!showNamePw)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-emerald-600 transition-colors"
                      >
                        {showNamePw ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={handleChangeName}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-md shadow-emerald-600/20 flex justify-center items-center gap-2 mt-2"
                  >
                    <Save size={18} />
                    حفظ التغييرات
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="max-w-xl space-y-6">
                <h3 className="text-lg font-black text-gray-800 flex items-center gap-2 mb-6">
                  <Lock className="text-emerald-500" size={20} />
                  تغيير كلمة المرور
                </h3>

                {pwMsg.text && (
                  <div className={`p-4 rounded-xl flex items-center gap-3 font-bold ${pwMsg.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                    {pwMsg.ok ? <CheckCircle2 size={20} /> : <Shield size={20} />}
                    {pwMsg.text}
                  </div>
                )}

                <div className="space-y-4">
                  {[
                    { id: 'current', label: 'كلمة المرور الحالية', ph: 'أدخل كلمة المرور الحالية' },
                    { id: 'newPw', label: 'كلمة المرور الجديدة', ph: '6 أحرف على الأقل' },
                    { id: 'confirm', label: 'تأكيد كلمة المرور الجديدة', ph: 'أعد كتابة كلمة المرور الجديدة' }
                  ].map(field => (
                    <div key={field.id}>
                      <label className="block text-sm font-bold text-gray-600 mb-2">{field.label}</label>
                      <div className="relative">
                        <input
                          type={showPw[field.id] ? "text" : "password"}
                          value={pwForm[field.id]}
                          onChange={(e) => setPwForm({ ...pwForm, [field.id]: e.target.value })}
                          placeholder={field.ph}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 pl-12 font-bold text-gray-800 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                        />
                        <button
                          onClick={() => setShowPw({ ...showPw, [field.id]: !showPw[field.id] })}
                          className="absolute left-3 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-emerald-600 transition-colors"
                        >
                          {showPw[field.id] ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>
                  ))}

                  <button
                    onClick={handleChangePassword}
                    className="w-full bg-gray-800 hover:bg-gray-900 text-white font-bold py-3.5 rounded-xl transition-all shadow-md shadow-gray-800/20 flex justify-center items-center gap-2 mt-6"
                  >
                    <Save size={18} />
                    تحديث كلمة المرور
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'appearance' && (
              <div className="max-w-xl space-y-8">
                <h3 className="text-lg font-black text-gray-800 flex items-center gap-2 mb-6">
                  <Palette className="text-emerald-500" size={20} />
                  تخصيص المظهر
                </h3>

                {themeMsg.text && (
                  <div className={`p-4 rounded-xl flex items-center gap-3 font-bold mb-4 ${themeMsg.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                    <CheckCircle2 size={20} />
                    {themeMsg.text}
                  </div>
                )}

                {/* Theme Colors Selection */}
                <div className="space-y-6">
                  <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100">
                    <label className="text-sm font-black text-gray-800 block mb-4 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500"></div> اللون الأساسي
                    </label>
                    <div className="flex flex-wrap gap-4">
                      {['#006C35', '#1E40AF', '#7C3AED', '#BE185D', '#D4AF37'].map(color => (
                        <button
                          key={color}
                          onClick={() => updateTheme('primary', color)}
                          className={`w-12 h-12 rounded-full border-4 transition-all hover:scale-110 shadow-sm ${theme.primary === color ? 'border-gray-800 scale-110 shadow-md' : 'border-white'}`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100">
                    <label className="text-sm font-black text-gray-800 block mb-4 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-gray-400"></div> لون الخلفية
                    </label>
                    <div className="flex flex-wrap gap-4">
                      {['#F8F9FA', '#F0FDF4', '#FFFBEB', '#FDF2F8', '#F3F4F6'].map(color => (
                        <button
                          key={color}
                          onClick={() => updateTheme('bg', color)}
                          className={`w-12 h-12 rounded-full border-4 transition-all hover:scale-110 shadow-sm ${theme.bg === color ? 'border-gray-800 scale-110 shadow-md' : 'border-white'}`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  onClick={saveThemeSettings}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition-all shadow-md flex justify-center items-center gap-2 mt-4"
                >
                  <Save size={18} /> تأكيد وحفظ الثيمات
                </button>

                {/* Magic Cursor */}
                <div className="bg-gradient-to-bl from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-100/50 relative overflow-hidden mt-8">
                  <div className="absolute top-0 left-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/2"></div>
                  
                  <div className="flex items-center justify-between relative z-10">
                    <div>
                      <h4 className="text-lg font-black text-indigo-900 mb-1">المؤشر السحري 🪄</h4>
                      <p className="text-sm font-bold text-indigo-700/70">
                        تفعيل المؤشر التفاعلي الملون الذي يتبع حركة الماوس.
                      </p>
                    </div>
                    
                    <button
                      onClick={toggleMagicCursor}
                      className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors duration-300 focus:outline-none ${magicCursor ? 'bg-indigo-600' : 'bg-gray-300'}`}
                      dir="ltr"
                    >
                      <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition duration-300 ${magicCursor ? 'translate-x-8' : 'translate-x-1'}`} />
                    </button>
                  </div>
                </div>

              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

AdminSettingsView.propTypes = {
  account: PropTypes.object,
  isDeputy: PropTypes.bool
};

export default AdminSettingsView;
