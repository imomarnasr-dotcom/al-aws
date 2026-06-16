import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { User, Phone, Shield, Bell, Lock, HelpCircle, Save, Send, LogOut, Eye, EyeOff, CheckCircle2, Palette } from 'lucide-react';

const SettingsView = ({ studentData, setStudentData, onLogout, studentPassword }) => {
  const [activeTab, setActiveTab] = useState('profile');
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [logoutPassword, setLogoutPassword] = useState('');
  const [logoutError, setLogoutError] = useState('');

  const handleConfirmLogout = () => {
    if (logoutPassword !== studentPassword && studentPassword) {
      setLogoutError('كلمة المرور غير صحيحة');
      return;
    }
    onLogout();
  };

  // --- بيانات الملف الشخصي (للقراءة فقط) ---
  // تم إزالة formData وحقول الإدخال لتأمين البيانات

  // --- الشكاوى ---
  const [complaintSubject, setComplaintSubject] = useState('');
  const [complaintText, setComplaintText] = useState('');

  // 🔥 إضافة: state تغيير كلمة السر
  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' });
  const [showPw, setShowPw] = useState({ current: false, newPw: false, confirm: false });
  const [pwMsg, setPwMsg] = useState({ text: '', ok: false });

  const handleChangePassword = () => {
    const realPassword = studentPassword || studentData?.password || studentData?.personal?.password || '';
    if (!pwForm.current) return setPwMsg({ text: 'أدخل كلمة المرور الحالية', ok: false });
    if (pwForm.current !== realPassword) return setPwMsg({ text: '❌ كلمة المرور الحالية غلط', ok: false });
    if (pwForm.newPw.length < 6) return setPwMsg({ text: '❌ كلمة المرور الجديدة أقل من 6 أحرف', ok: false });
    if (pwForm.newPw !== pwForm.confirm) return setPwMsg({ text: '❌ كلمة المرور الجديدة مش متطابقة', ok: false });

    // حفظ كلمة السر الجديدة
    setStudentData(prev => {
      const base = prev && prev.personal?.id ? prev : studentData;
      return { ...base, personal: { ...(base.personal || {}), password: pwForm.newPw } };
    });
    // تحديث الـ whitelist في localStorage
    try {
      const wl = JSON.parse(localStorage.getItem('moo_whitelist') || '[]');
      const updated = wl.map(s => s.id === studentData?.personal?.id ? { ...s, password: pwForm.newPw } : s);
      localStorage.setItem('moo_whitelist', JSON.stringify(updated));
    } catch { }
    setPwMsg({ text: '✅ تم تغيير كلمة المرور بنجاح!', ok: true });
    setPwForm({ current: '', newPw: '', confirm: '' });
  };

  // --- المظهر والألوان ---
  const [theme, setTheme] = useState({
    primary: document.documentElement.style.getPropertyValue('--primary-color') || '#006C35',
    bg: document.documentElement.style.getPropertyValue('--bg-color') || '#F8F9FA'
  });

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

  const handleSendComplaint = () => {
    if (!complaintText.trim()) return;

    // التعديل: استخدام try/catch لمنع Crash لو البيانات باظت
    let complaints = [];
    try {
      complaints = JSON.parse(localStorage.getItem('moo_complaints') || '[]');
    } catch {
      complaints = [];
    }

    const newComplaint = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      studentId: studentData?.personal?.id,
      studentName: studentData?.personal?.name,
      subject: complaintSubject || 'بدون عنوان',
      text: complaintText,
      date: new Date().toISOString(),
      status: 'pending', // pending, read, resolved
      senderType: 'student'
    };

    complaints.push(newComplaint);
    localStorage.setItem('moo_complaints', JSON.stringify(complaints));

    setComplaintSubject('');
    setComplaintText('');
    window.dispatchEvent(new CustomEvent('moo-toast', { detail: { message: 'تم إرسال رسالتك بنجاح. سيتم الرد عليك قريباً.', type: 'success' } }));
  };

  return (
    <div className="space-y-6 sm:space-y-8 pb-10 max-w-5xl mx-auto">
      <header className="bg-white/50 p-6 rounded-[32px] backdrop-blur-xl border border-white/60 shadow-sm">
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
          <User className="text-primary" size={32} />
          الإعدادات والملف الشخصي
        </h1>
        <p className="text-gray-500 mt-1 font-medium">إدارة بياناتك الشخصية وحسابك</p>
      </header>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-64 flex-shrink-0 space-y-2">
          <button
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl font-bold transition-all text-right ${activeTab === 'profile'
              ? 'bg-primary text-white shadow-md shadow-primary/20'
              : 'bg-white/60 text-gray-600 hover:bg-white hover:text-gray-900'
              }`}
          >
            <User size={20} />
            البيانات الشخصية
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl font-bold transition-all text-right ${activeTab === 'security'
              ? 'bg-primary text-white shadow-md shadow-primary/20'
              : 'bg-white/60 text-gray-600 hover:bg-white hover:text-gray-900'
              }`}
          >
            <Shield size={20} />
            الأمان وكلمة المرور
          </button>
          <button
            onClick={() => setActiveTab('theme')}
            className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl font-bold transition-all text-right ${activeTab === 'theme'
              ? 'bg-primary text-white shadow-md shadow-primary/20'
              : 'bg-white/60 text-gray-600 hover:bg-white hover:text-gray-900'
              }`}
          >
            <Palette size={20} />
            المظهر والألوان
          </button>
          <button
            onClick={() => setActiveTab('support')}
            className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl font-bold transition-all text-right ${activeTab === 'support'
              ? 'bg-primary text-white shadow-md shadow-primary/20'
              : 'bg-white/60 text-gray-600 hover:bg-white hover:text-gray-900'
              }`}
          >
            <HelpCircle size={20} />
            الدعم والشكاوى
          </button>

          <div className="pt-4 mt-4 border-t border-gray-200/50">
            <button
              onClick={() => setShowLogoutModal(true)}
              className="w-full flex items-center gap-3 px-5 py-4 rounded-2xl font-bold transition-all text-right bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700"
            >
              <LogOut size={20} />
              تسجيل الخروج
            </button>
          </div>
        </div>

        <div className="flex-1">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white/70 backdrop-blur-xl rounded-[32px] p-6 sm:p-8 border border-white/60 shadow-sm"
          >
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <h2 className="text-xl font-black text-gray-900 flex items-center gap-2 mb-6">
                  <User className="text-primary" size={24} />
                  المعلومات الأساسية
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2 p-5 bg-gray-50 rounded-2xl border border-gray-100">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">الاسم الكامل</label>
                    <p className="text-lg font-black text-gray-800">{studentData?.personal?.name || 'غير متوفر'}</p>
                  </div>
                  <div className="space-y-2 p-5 bg-gray-50 rounded-2xl border border-gray-100">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">الرقم الأكاديمي</label>
                    <p className="text-lg font-black text-gray-800 font-mono">{studentData?.personal?.id || 'غير متوفر'}</p>
                  </div>
                  <div className="space-y-2 md:col-span-2 p-5 bg-gray-50 rounded-2xl border border-gray-100">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">الفصل الدراسي</label>
                    <p className="text-lg font-black text-gray-800">{studentData?.personal?.class || 'غير متوفر'}</p>
                  </div>
                </div>

                <div className="mt-8 p-4 bg-blue-50 text-blue-700 rounded-xl text-sm font-bold flex items-start gap-3 border border-blue-100">
                  <Shield size={20} className="shrink-0 text-blue-500" />
                  <p>هذه البيانات للقراءة فقط. في حال وجود خطأ في بياناتك، يرجى تقديم طلب للإدارة من قسم "الدعم والشكاوى".</p>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6">
                <h2 className="text-xl font-black text-gray-900 flex items-center gap-2 mb-6">
                  <Shield className="text-primary" size={24} />
                  إعدادات الأمان
                </h2>

                <div className="space-y-4 max-w-md">
                  {/* كلمة المرور الحالية */}
                  {[
                    { key: 'current', label: 'كلمة المرور الحالية' },
                    { key: 'newPw', label: 'كلمة المرور الجديدة' },
                    { key: 'confirm', label: 'تأكيد كلمة المرور الجديدة' },
                  ].map(field => (
                    <div key={field.key} className="space-y-2">
                      <label className="text-sm font-bold text-gray-700">{field.label}</label>
                      <div className="relative">
                        <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                          type={showPw[field.key] ? 'text' : 'password'}
                          value={pwForm[field.key]}
                          onChange={e => { setPwForm(p => ({ ...p, [field.key]: e.target.value })); setPwMsg({ text: '', ok: false }); }}
                          placeholder="••••••••"
                          className="w-full bg-white border border-gray-200 rounded-2xl py-3 pr-11 pl-12 font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                        <button type="button" onClick={() => setShowPw(p => ({ ...p, [field.key]: !p[field.key] }))} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                          {showPw[field.key] ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                  ))}

                  {pwMsg.text && (
                    <div className={`text-sm font-bold px-4 py-3 rounded-xl flex items-center gap-2 ${pwMsg.ok ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                      {pwMsg.ok && <CheckCircle2 size={16} />}
                      {pwMsg.text}
                    </div>
                  )}

                  <button
                    onClick={handleChangePassword}
                    className="w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-black text-white px-8 py-3.5 rounded-2xl font-bold transition-all"
                  >
                    <Lock size={18} /> تغيير كلمة المرور
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'support' && (
              <div className="space-y-6">
                <h2 className="text-xl font-black text-gray-900 flex items-center gap-2 mb-6">
                  <HelpCircle className="text-primary" size={24} />
                  تواصل مع الإدارة
                </h2>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 ml-1">موضوع الرسالة</label>
                    <input
                      type="text"
                      value={complaintSubject} onChange={(e) => setComplaintSubject(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
                      placeholder="مثال: استفسار عن الغياب، مشكلة في الجدول..."
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 ml-1">التفاصيل</label>
                    <textarea
                      rows={5}
                      value={complaintText} onChange={(e) => setComplaintText(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium resize-none"
                      placeholder="اكتب رسالتك أو شكوتك هنا بوضوح..."
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    onClick={handleSendComplaint}
                    disabled={!complaintText.trim()}
                    className="flex items-center gap-2 bg-gray-900 hover:bg-black disabled:bg-gray-300 disabled:text-gray-500 text-white px-8 py-3.5 rounded-2xl font-bold transition-all"
                  >
                    <Send size={20} />
                    إرسال للإدارة
                  </button>
                </div>

                {/* 🔥 إضافة: عرض ردود الإدارة على شكاوى الطالب */}
                {(() => {
                  try {
                    const all = JSON.parse(localStorage.getItem('moo_complaints') || '[]');
                    const myReplied = all.filter(c => c.studentId === studentData?.personal?.id && c.adminReply);
                    if (!myReplied.length) return null;
                    return (
                      <div className="mt-6 space-y-3">
                        <p className="text-xs font-black text-gray-500 uppercase tracking-wider">ردود الإدارة على شكاواك</p>
                        {myReplied.map(c => (
                          <div key={c.id} className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
                            <p className="text-xs font-black text-emerald-700 mb-1">📩 رد الإدارة — {c.subject}</p>
                            <p className="text-sm text-emerald-900 font-medium">{c.adminReply}</p>
                            {c.adminReplyDate && <p className="text-[10px] text-emerald-400 mt-2 font-bold">{c.adminReplyDate}</p>}
                          </div>
                        ))}
                      </div>
                    );
                  } catch { return null; }
                })()}
              </div>
            )}


            {activeTab === 'theme' && (
              <div className="space-y-8">
                <h2 className="text-xl font-black text-gray-900 flex items-center gap-2 mb-6">
                  <Palette className="text-primary" size={24} />
                  المظهر والألوان
                </h2>

                <div className="space-y-6">
                  <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100">
                    <label className="text-sm font-black text-gray-800 block mb-4 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-gray-400"></div> اللون الأساسي
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
              </div>
            )}

          </motion.div>
        </div>
      </div>

      {/* Logout Password Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-[32px] p-8 max-w-sm w-full shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-2 bg-red-500"></div>
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <LogOut size={32} />
            </div>
            <h3 className="text-2xl font-black text-gray-900 text-center mb-2">تأكيد تسجيل الخروج</h3>
            <p className="text-gray-500 text-center mb-6 text-sm font-medium">الرجاء إدخال كلمة المرور لتأكيد الخروج من البوابة.</p>
            
            <div className="space-y-4">
              <div>
                <div className="relative">
                  <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="password"
                    value={logoutPassword}
                    onChange={(e) => { setLogoutPassword(e.target.value); setLogoutError(''); }}
                    placeholder="كلمة المرور..."
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-3 pr-11 pl-4 font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-500/30 transition-all"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleConfirmLogout();
                    }}
                  />
                </div>
                {logoutError && <p className="text-red-500 text-xs font-bold mt-2">{logoutError}</p>}
              </div>
              
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleConfirmLogout}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 rounded-2xl font-bold transition-colors shadow-lg shadow-red-500/30"
                >
                  خروج
                </button>
                <button
                  onClick={() => { setShowLogoutModal(false); setLogoutPassword(''); setLogoutError(''); }}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-2xl font-bold transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsView;
SettingsView.propTypes = { studentData: PropTypes.object.isRequired, setStudentData: PropTypes.func.isRequired, onLogout: PropTypes.func, searchQuery: PropTypes.string, studentPassword: PropTypes.string };
