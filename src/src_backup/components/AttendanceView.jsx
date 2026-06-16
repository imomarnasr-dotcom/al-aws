import { useMemo, useState, useEffect } from 'react';
import { CheckCircle2, XCircle, Clock, AlertTriangle, QrCode, RefreshCw } from 'lucide-react';
import PropTypes from 'prop-types';
import { QRCodeSVG } from 'qrcode.react';

/* ─── بطاقة QR حقيقية قابلة للمسح بكاميرا المعلم (Html5Qrcode) ─── */
const QRCard = ({ studentId }) => {
  // 🔥 الماسح (CameraScanner) يطابق رقم الهوية مباشرةً: s.id === decodedText
  // لذلك يجب أن يحمل الـ QR رقم الهوية فقط (نفس StudentIdGenerator) ليُمسح فعلياً.
  const qrText = String(studentId || 'UNKNOWN');

  return (
    <div className="flex flex-col items-center">
      <div className="bg-white p-2 rounded-xl">
        <QRCodeSVG
          value={qrText}
          size={168}
          level="H"
          includeMargin={false}
          fgColor="#111111"
          bgColor="#ffffff"
        />
      </div>
      <p className="text-[10px] font-mono text-gray-400 mt-2 tracking-wider">{studentId}</p>
    </div>
  );
};

QRCard.propTypes = {
  studentId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};



/* ─── المكون الرئيسي ─── */
const AttendanceView = ({ studentData, searchQuery }) => {
  const student = studentData?.personal || {};
  const today = new Date().toISOString().split('T')[0];
  const todayArabic = new Date().toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const [now, setNow] = useState(new Date());
  const [cardFlipped, setCardFlipped] = useState(false);

  // تحديث الساعة كل دقيقة
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  const [syncTrigger, setSyncTrigger] = useState(0);
  useEffect(() => {
    const onStorage = () => setSyncTrigger(prev => prev + 1);
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // قراءة سجل الحضور الحقيقي من moo_attendance
  const attendanceHistory = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('moo_attendance') || '{}'); } catch { return {}; }
  }, [syncTrigger]);

  // حساب نسبة الحضور من moo_whitelist
  const { totalClasses, attendedClasses, attendancePercentage } = useMemo(() => {
    try {
      const whitelist = JSON.parse(localStorage.getItem('moo_whitelist') || '[]');
      const me = whitelist.find(s => s.id === student.id);
      if (me) return {
        totalClasses: me.totalClasses || 0,
        attendedClasses: me.attendedClasses || 0,
        attendancePercentage: me.attendancePercentage || 0,
      };
    } catch { }
    return { totalClasses: 0, attendedClasses: 0, attendancePercentage: 0 };
  }, [student.id, syncTrigger]);

  // سجل الغياب التفصيلي (أيام غاب فيها الطالب)
  const absenceDays = useMemo(() => {
    const days = [];
    Object.entries(attendanceHistory).forEach(([key, record]) => {
      const lastUnderscore = key.lastIndexOf('_');
      if (lastUnderscore === -1) return;
      const cls = key.substring(0, lastUnderscore);
      const date = key.substring(lastUnderscore + 1);
      if (cls !== student.class) return;
      if (record[student.id] === 'غائب') days.push(date);
    });
    return days.sort((a, b) => new Date(b) - new Date(a));
  }, [attendanceHistory, student]);

  const absentCount = totalClasses - attendedClasses;
  const pctColor = attendancePercentage >= 90 ? 'text-emerald-600' : attendancePercentage >= 75 ? 'text-amber-500' : 'text-red-500';
  const barColor = attendancePercentage >= 90 ? 'bg-emerald-500' : attendancePercentage >= 75 ? 'bg-amber-400' : 'bg-red-500';
  const statusLabel = attendancePercentage >= 90 ? 'ممتاز' : attendancePercentage >= 75 ? 'مقبول' : 'خطر — تواصل مع الإدارة';
  const statusBg = attendancePercentage >= 90 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : attendancePercentage >= 75 ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-red-50 text-red-700 border-red-200';

  // فلترة الغياب بالبحث
  const filteredAbsence = useMemo(() => {
    if (!searchQuery?.trim()) return absenceDays;
    return absenceDays.filter(d => d.includes(searchQuery));
  }, [absenceDays, searchQuery]);

  return (
    <div className="flex-1 space-y-8 pb-10" dir="rtl">

      {/* ─── Header ─── */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-600">
            <CheckCircle2 size={24} />
          </div>
          سجل الحضور والغياب
        </h1>
        <p className="text-gray-400 mt-2 font-medium text-sm">{todayArabic}</p>
      </div>

      {/* ─── إحصائيات سريعة ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'إجمالي الحصص', value: totalClasses, icon: <Clock size={20} />, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'حضرت', value: attendedClasses, icon: <CheckCircle2 size={20} />, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'غبت', value: absentCount, icon: <XCircle size={20} />, color: 'text-red-500', bg: 'bg-red-50' },
          { label: 'نسبة الحضور', value: `${attendancePercentage}%`, icon: <AlertTriangle size={20} />, color: pctColor, bg: 'bg-gray-50' },
        ].map((s, i) => (
          <div key={i} className="glass-card rounded-3xl p-6 shadow-sm flex items-center justify-between group hover:-translate-y-1 transition-all">
            <div>
              <p className="text-gray-400 text-xs font-bold mb-1">{s.label}</p>
              <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
            </div>
            <div className={`w-11 h-11 ${s.bg} rounded-2xl flex items-center justify-center ${s.color}`}>{s.icon}</div>
          </div>
        ))}
      </div>

      {/* ─── شريط النسبة + الحالة ─── */}
      <div className="glass-card rounded-3xl p-8 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <span className="font-black text-gray-700 text-lg">نسبة الحضور الكلية</span>
          <span className={`text-sm font-black px-4 py-1.5 rounded-xl border ${statusBg}`}>{statusLabel}</span>
        </div>
        <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden mb-2">
          <div
            className={`h-full ${barColor} rounded-full transition-all duration-1000`}
            style={{ width: `${attendancePercentage}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-400 font-bold">
          <span>0%</span>
          <span className={`font-black text-base ${pctColor}`}>{attendancePercentage}%</span>
          <span>100%</span>
        </div>
        {attendancePercentage < 75 && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm font-bold flex items-center gap-2">
            <AlertTriangle size={16} />
            تحذير: نسبة الحضور أقل من 75% — يُرجى التواصل مع الإدارة فوراً
          </div>
        )}
      </div>

      {/* ─── بطاقة الحضور QR ─── */}
      <div className="glass-card rounded-3xl p-8 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-black text-gray-800 flex items-center gap-3">
            <QrCode size={22} className="text-blue-500" />
            بطاقة تأكيد الحضور
          </h2>
          <button
            onClick={() => setCardFlipped(f => !f)}
            className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-blue-600 transition-colors bg-gray-50 px-4 py-2 rounded-xl border border-gray-200"
          >
            <RefreshCw size={14} /> {cardFlipped ? 'عرض البطاقة' : 'عرض الـ QR'}
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-center">
          {/* البطاقة */}
          {!cardFlipped ? (
            <div className="w-full max-w-sm bg-gradient-to-br from-gray-900 via-blue-950 to-gray-900 rounded-[28px] p-6 text-white shadow-2xl relative overflow-hidden flex-shrink-0">
              {/* خلفية زخرفية */}
              <div className="absolute top-0 left-0 w-40 h-40 bg-blue-500/10 rounded-full -translate-x-1/2 -translate-y-1/2" />
              <div className="absolute bottom-0 right-0 w-32 h-32 bg-white/5 rounded-full translate-x-1/2 translate-y-1/2" />

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                    <CheckCircle2 size={20} className="text-blue-300" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-blue-300 opacity-70">بوابة الأوس</span>
                </div>

                <div className="mb-6">
                  <p className="text-white/50 text-xs font-bold mb-1">اسم الطالب</p>
                  <p className="text-xl font-black text-white leading-tight">{student.name || '—'}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <p className="text-white/50 text-xs font-bold mb-1">الفصل</p>
                    <p className="text-sm font-black text-white">{student.class || '—'}</p>
                  </div>
                  <div>
                    <p className="text-white/50 text-xs font-bold mb-1">رقم الهوية</p>
                    <p className="text-sm font-mono font-black text-blue-300">{student.id || '—'}</p>
                  </div>
                  <div>
                    <p className="text-white/50 text-xs font-bold mb-1">نسبة الحضور</p>
                    <p className={`text-sm font-black ${attendancePercentage >= 75 ? 'text-emerald-400' : 'text-red-400'}`}>{attendancePercentage}%</p>
                  </div>
                  <div>
                    <p className="text-white/50 text-xs font-bold mb-1">التاريخ</p>
                    <p className="text-sm font-black text-white/80">{today}</p>
                  </div>
                </div>

                <div className="border-t border-white/10 pt-4 flex items-center justify-between">
                  <div className="w-12 h-6 bg-white/10 rounded-md" />
                  <p className="text-[10px] text-white/30 font-mono">{student.id}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 flex-shrink-0">
              <div className="bg-white rounded-3xl p-4 shadow-lg border border-gray-100">
                <QRCard studentId={student.id || 'UNKNOWN'} />

              </div>
              <p className="text-xs text-gray-400 font-bold text-center">امسح الـ QR لتأكيد الحضور<br/>صالح ليوم {today} فقط</p>
            </div>
          )}

          {/* تعليمات الاستخدام */}
          <div className="flex-1 space-y-4">
            <h3 className="font-black text-gray-700 text-base">كيف تستخدم بطاقتك؟</h3>
            {[
              { step: '1', title: 'اعرض البطاقة أو الـ QR', desc: 'اضغط "عرض الـ QR" لتحويل البطاقة لكود QR يمسحه المعلم', icon: <QrCode size={18} className="text-blue-500" /> },
              { step: '2', title: 'أعطِها للمعلم', desc: 'المعلم يسجل حضورك يدوياً من سجل الحضور التفاعلي في بوابته', icon: <CheckCircle2 size={18} className="text-emerald-500" /> },
              { step: '3', title: 'تابع نسبتك', desc: 'نسبة حضورك تُحدَّث فور اعتماد الحضور من المعلم', icon: <RefreshCw size={18} className="text-amber-500" /> },
            ].map(s => (
              <div key={s.step} className="flex items-start gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center shadow-sm flex-shrink-0 border border-gray-100">
                  {s.icon}
                </div>
                <div>
                  <p className="font-black text-gray-800 text-sm">{s.title}</p>
                  <p className="text-xs text-gray-400 font-medium mt-0.5">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── سجل الغياب التفصيلي ─── */}
      <div className="glass-card rounded-3xl shadow-sm overflow-hidden border border-white/20">
        <div className="p-8 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center gap-3">
            <XCircle size={18} className="text-red-400" />
            أيام الغياب
          </h2>
          <span className="text-xs font-black text-gray-400 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100">{absentCount} يوم</span>
        </div>
        <div className="p-8">
          {filteredAbsence.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {filteredAbsence.map(date => (
                <div key={date} className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-2xl px-4 py-3">
                  <XCircle size={14} className="text-red-400 flex-shrink-0" />
                  <span className="text-sm font-bold text-red-700 font-mono">{date}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <CheckCircle2 size={40} className="text-emerald-300 mx-auto mb-3" />
              <p className="text-gray-400 font-bold">
                {absentCount === 0 ? 'لا يوجد غياب مسجل — أحسنت! 🎉' : 'لا توجد نتائج للبحث'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

AttendanceView.propTypes = {
  studentData: PropTypes.object.isRequired,
  searchQuery: PropTypes.string,
};

AttendanceView.defaultProps = { searchQuery: '' };

export default AttendanceView;
