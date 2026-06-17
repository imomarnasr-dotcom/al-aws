import { Award, TrendingUp, BarChart3, Filter, Star, GraduationCap, Download, X, Image as ImageIcon, FileText, Printer } from 'lucide-react';
import { useMemo, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { safeMobileDownload } from '../utils/downloadUtils';
const GradesView = ({ studentData, searchQuery = '' }) => {
  const academics = studentData?.academics || {};
  const staticSubjects = academics?.subjects || [];

  // 🔥 إصلاح: نقرأ الدرجات الحقيقية من moo_grades أولاً
  const [realGrades, setRealGrades] = useState(() => {
    try { return JSON.parse(localStorage.getItem('moo_grades') || '{}'); } catch { return {}; }
  });

  const [isDownloading, setIsDownloading] = useState(false);

  const [onlineExams, setOnlineExams] = useState(() => {
    try { 
      const t1 = JSON.parse(localStorage.getItem('moo_tests') || '[]');
      const t2 = JSON.parse(localStorage.getItem('exams') || '[]');
      return [...t1, ...t2];
    } catch { return []; }
  });

  useEffect(() => {
    const refresh = () => {
      try { 
        setRealGrades(JSON.parse(localStorage.getItem('moo_grades') || '{}')); 
        const t1 = JSON.parse(localStorage.getItem('moo_tests') || '[]');
        const t2 = JSON.parse(localStorage.getItem('exams') || '[]');
        const merged = [...t1, ...t2];
        setOnlineExams(Array.from(new Map(merged.map(e => [e.id, e])).values()));
      } catch { }
    };
    window.addEventListener('moo-sync', refresh);
    window.addEventListener('storage', refresh);
    return () => { window.removeEventListener('moo-sync', refresh); window.removeEventListener('storage', refresh); };
  }, []);

  // نبني subjects من moo_grades لو موجودة، وإلا نرجع للـ static
  const subjects = useMemo(() => {
    const studentId = studentData?.personal?.id;
    const studentClass = studentData?.personal?.class;
    if (!studentId || !studentClass) return [];

    const liveSubjects = [];
    Object.entries(realGrades).forEach(([key, gradesMap]) => {
      const [cls, subject, semester] = key.split('__');
      if (cls !== studentClass) return;
      const score = gradesMap[studentId];
      if (score === undefined || score === '') return;
      const pct = Number(score);
      const getLetter = (p) => {
        if (p >= 95) return 'A+'; if (p >= 90) return 'A';
        if (p >= 85) return 'B+'; if (p >= 80) return 'B';
        if (p >= 75) return 'C+'; if (p >= 70) return 'C';
        if (p >= 65) return 'D+'; if (p >= 60) return 'D';
        return 'F';
      };
      liveSubjects.push({
        id: key,
        name: subject,
        semester: semester || 'اختبار حضوري',
        percentage: pct,
        grade: getLetter(pct),
        credit: 3,
        isLive: true,
      });
    });

    onlineExams.forEach(exam => {
      const exClass = exam.classCode || exam.stage || '';
      if (exClass !== studentClass && exam.stage !== studentClass) return;
      
      const report = exam.reports?.find(r => r.studentId === studentId);
      if (report && report.status === 'submitted') {
        const pct = (report.score / report.total) * 100;
        const getLetter = (p) => {
          if (p >= 95) return 'A+'; if (p >= 90) return 'A';
          if (p >= 85) return 'B+'; if (p >= 80) return 'B';
          if (p >= 75) return 'C+'; if (p >= 70) return 'C';
          if (p >= 65) return 'D+'; if (p >= 60) return 'D';
          return 'F';
        };
        const examName = exam.subject || exam.title;
        // منع التكرار إذا كان الاختبار موجوداً مسبقاً (سواء من moo_grades أو من نسخة أخرى من الاختبار)
        if (!liveSubjects.find(s => s.name === examName)) {
          liveSubjects.push({
            id: `online_${exam.id}`,
            name: examName,
            semester: 'اختبار إلكتروني',
            percentage: pct,
            grade: getLetter(pct),
            credit: 3,
            isLive: true,
          });
        }
      }
    });

    // إزالة التكرارات الناتجة عن أي مشاكل سابقة في التخزين بناءً على اسم المادة
    const uniqueSubjects = [];
    const seenNames = new Set();
    for (const sub of liveSubjects) {
      if (!seenNames.has(sub.name)) {
        seenNames.add(sub.name);
        uniqueSubjects.push(sub);
      }
    }

    return uniqueSubjects;
  }, [realGrades, onlineExams, studentData]);

  // إعادة حساب المعدلات من الدرجات الحقيقية
  const computedGPA = useMemo(() => {
    const live = subjects.filter(s => s.isLive && s.percentage !== undefined);
    if (live.length === 0) return { current: academics?.currentGPA || 0, cumulative: academics?.cumulativeGPA || 0 };
    const avg = live.reduce((sum, s) => sum + s.percentage, 0) / live.length;
    return { current: avg.toFixed(2), cumulative: Math.round(avg) };
  }, [subjects, academics]);

  const filteredSubjects = useMemo(() => {
    if (!searchQuery.trim()) return subjects;
    return subjects.filter(s =>
      s?.name?.includes(searchQuery) || s?.grade?.includes(searchQuery)
    );
  }, [subjects, searchQuery]);

  const getGradeStyle = (percentage) => {
    if (percentage >= 90) return { color: 'bg-green-500', bg: 'bg-green-50', label: 'text-green-600', text: 'ممتاز مرتفع' };
    if (percentage >= 80) return { color: 'bg-blue-500', bg: 'bg-blue-50', label: 'text-blue-600', text: 'جيد جداً' };
    if (percentage >= 70) return { color: 'bg-amber-500', bg: 'bg-amber-50', label: 'text-amber-600', text: 'جيد' };
    return { color: 'bg-red-500', bg: 'bg-red-50', label: 'text-red-600', text: 'يحتاج تحسين' };
  };

  const handlePrint = () => window.print();

  const downloadAsImage = async () => {
    setIsDownloading(true);
    const element = document.getElementById('certificate-print-area');
    if (!element) {
      setIsDownloading(false);
      return;
    }
    
    const origCssText = element.style.cssText;
    const origClass = element.className;
    
    // Remove viewport constraints
    element.className = origClass.replace('hidden', '').replace('fixed', 'absolute').replace('inset-0', '').replace('min-h-screen', '');
    
    // Use regular styles (without !important) so they can be overridden by html-to-image on the clone
    element.style.cssText = `
      position: fixed;
      left: -9999px;
      top: 0;
      width: 1050px;
      min-height: 1480px;
      height: max-content;
      display: block;
      background: white;
      z-index: -9999;
    `;
    
    // Force the inner border to take AT LEAST the full 1480px height (minus 80px padding = 1400px)
    // but allow it to grow if there are many subjects!
    const innerDiv = document.getElementById('certificate-inner-border');
    let origInnerClass = '';
    if (innerDiv) {
      origInnerClass = innerDiv.className;
      innerDiv.className = origInnerClass.replace('min-h-[calc(100vh-5rem)]', 'min-h-[1400px]');
    }
    
    await new Promise(r => setTimeout(r, 300));
    
    try {
      const dataUrl = await toPng(element, { 
        pixelRatio: 2,
        width: 1050,
        height: element.scrollHeight, // Use the full expanded height
        style: {
          transform: 'none',
          left: '0',
          top: '0',
          position: 'static',
          background: 'white',
          height: '100%' // ensure the clone respects the new height
        }
      });
      
      const fileName = `شهادة_طالب_${studentData?.personal?.name?.replace(/\s+/g, '_') || 'طالب'}.png`;
        await safeMobileDownload(dataUrl, fileName, 'image/png');
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء استخراج الصورة: ' + (err.message || err));
    } finally {
      element.style.cssText = origCssText;
      element.className = origClass;
      if (innerDiv) innerDiv.className = origInnerClass;
      setIsDownloading(false);
    }
  };

  const downloadAsPDF = async () => {
    setIsDownloading(true);
    const element = document.getElementById('certificate-print-area');
    if (!element) {
      setIsDownloading(false);
      return;
    }
    
    const origCssText = element.style.cssText;
    const origClass = element.className;
    
    element.className = origClass.replace('hidden', '').replace('fixed', 'absolute').replace('inset-0', '').replace('min-h-screen', '');
    
    element.style.cssText = `
      position: fixed;
      left: -9999px;
      top: 0;
      width: 1050px;
      min-height: 1480px;
      height: max-content;
      display: block;
      background: white;
      z-index: -9999;
    `;
    
    const innerDiv = document.getElementById('certificate-inner-border');
    let origInnerClass = '';
    if (innerDiv) {
      origInnerClass = innerDiv.className;
      innerDiv.className = origInnerClass.replace('min-h-[calc(100vh-5rem)]', 'min-h-[1400px]');
    }
    
    await new Promise(r => setTimeout(r, 300));
    
    try {
      const dataUrl = await toPng(element, { 
        pixelRatio: 2,
        width: 1050,
        height: element.scrollHeight,
        style: {
          transform: 'none',
          left: '0',
          top: '0',
          position: 'static',
          background: 'white',
          height: '100%'
        }
      });
      
      const pdf = new jsPDF('p', 'px', [1050, 1480]);
      const imgProps = pdf.getImageProperties(dataUrl);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      let heightLeft = pdfHeight;
      let position = 0;
      const pageHeight = 1480;

      pdf.addImage(dataUrl, 'PNG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position -= pageHeight;
        pdf.addPage();
        pdf.addImage(dataUrl, 'PNG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;
      }
      
      const pdfBase64 = pdf.output('datauristring');
        const fileName = `إشعار_درجات_${studentData?.personal?.name?.replace(/\s+/g, '_') || 'طالب'}.pdf`;
        await safeMobileDownload(pdfBase64, fileName, 'application/pdf');
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء استخراج الـ PDF: ' + (err.message || err));
    } finally {
      element.style.cssText = origCssText;
      element.className = origClass;
      if (innerDiv) innerDiv.className = origInnerClass;
      setIsDownloading(false);
    }
  };

  return (
    <>
      <div className="print:hidden flex-1 space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 sm:p-6 no-print">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
              <BarChart3 size={24} />
            </div>
            السجل الأكاديمي
          </h1>
          <p className="text-gray-500 mt-2 font-medium">عرض النتائج التفصيلية والتقارير الشهرية</p>
        </div>

        <div className="flex flex-wrap justify-center gap-3 w-full md:w-auto">
          <button 
            onClick={downloadAsPDF}
            disabled={isDownloading}
            className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-red-600/20 hover:scale-105 transition-transform disabled:opacity-50"
          >
            <FileText size={18} />
            {isDownloading ? 'جاري...' : 'تحميل PDF'}
          </button>
          <button 
            onClick={downloadAsImage}
            disabled={isDownloading}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-600/20 hover:scale-105 transition-transform disabled:opacity-50"
          >
            <ImageIcon size={18} />
            {isDownloading ? 'جاري...' : 'تحميل كصورة'}
          </button>
          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
          >
            <Printer size={18} />
            طباعة الإشعار
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:p-6 no-print">
        {[
          { label: 'المعدل التراكمي', value: `${computedGPA.cumulative}%`, icon: <Award className="w-7 h-7" />, color: 'text-primary', bg: 'bg-primary/5' },
          { label: 'معدل الفصل الحالي', value: Number(computedGPA.current).toFixed(2), icon: <TrendingUp className="w-7 h-7" />, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'إجمالي الوحدات', value: subjects.reduce((sum, s) => sum + (s?.credit || 0), 0), icon: <Star className="w-7 h-7" />, color: 'text-amber-600', bg: 'bg-amber-50' },
        ].map((stat, idx) => (
          <div key={idx} className="glass-card rounded-3xl p-4 sm:p-8 shadow-sm flex items-center justify-between group">
            <div>
              <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">{stat.label}</p>
              <p className={`text-3xl font-bold ${stat.color} tabular-nums`}>{stat.value}</p>
            </div>
            <div className={`w-14 h-14 ${stat.bg} rounded-2xl flex items-center justify-center ${stat.color} group-hover:scale-110 transition-transform`}>
              {stat.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Main Subjects Table */}
      <div className="glass-card rounded-3xl shadow-sm overflow-hidden border border-white/20">
        <div className="p-4 sm:p-8 border-b border-gray-100 flex items-center justify-between no-print">
          <h2 className="text-xl font-bold flex items-center gap-3">
            <Filter size={18} className="text-primary" />
            نتائج المواد الدراسية
          </h2>
        </div>

        <div className="p-4 sm:p-8 lg:p-12 space-y-10">
          {(filteredSubjects || []).map((subject) => {
            const style = getGradeStyle(subject?.percentage || 0);
            return (
              <div key={subject?.id} className="group">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4 mb-4">
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-1 group-hover:text-primary transition-colors">{subject?.name || 'مادة غير معروفة'}</h3>
                    <p className="text-[10px] sm:text-xs text-gray-400 font-bold">
                      {subject?.semester ? `${subject.semester} • ` : ''}عدد الساعات المعتمدة: {subject?.credit || 0} ساعة
                      {subject?.isLive && <span className="mr-2 text-emerald-500">✓ معتمدة</span>}
                    </p>
                  </div>
                  <div className="text-right sm:text-left">
                    <span className={`inline-block px-4 py-1.5 rounded-xl ${style.bg} ${style.label} text-xs sm:text-sm font-bold shadow-sm border border-black/5 mb-1`}>
                      {subject?.grade || '-'} | {subject?.percentage || 0}%
                    </span>
                    <p className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-wider ${style.label} text-center sm:text-left`}>{style.text}</p>
                  </div>
                </div>
                <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden p-0.5 border border-gray-50">
                  <div
                    className={`h-full ${style.color} rounded-full transition-all duration-1000 relative`}
                    style={{ width: `${subject?.percentage || 0}%` }}
                  >
                    <div className="absolute inset-0 bg-white/20 blur-sm w-1/4" />
                  </div>
                </div>
              </div>
            );
          })}
          {(filteredSubjects || []).length === 0 && (
            <div className="text-center py-10">
               <div className="w-16 h-16 bg-gray-50 text-gray-300 rounded-full flex items-center justify-center mx-auto mb-4">
                 <Filter size={32} />
               </div>
               <h3 className="text-xl font-bold text-gray-400">لا توجد نتائج مسجلة حتى الآن</h3>
               <p className="text-sm text-gray-400 mt-2">ستظهر نتائجك الحقيقية هنا فور تصحيح اختباراتك.</p>
            </div>
          )}
        </div>


      </div>

      <div className="mt-12 no-print">
        <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
          <Star size={24} className="text-primary" />
          الأوسمة والجوائز
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:p-6">
          {(() => {
            let achievements = [];
            try {
              achievements = JSON.parse(localStorage.getItem('moo_achievements') || '[]').filter(a => a.studentId === studentData?.personal?.id);
            } catch { achievements = []; }
            if (achievements.length === 0) return <div className="col-span-full text-center text-gray-400 py-8">لا توجد أوسمة بعد. اكسب المزيد من النقاط لتحصل على أوسمة التميز!</div>;
            return achievements.map((achievement) => (
              <div key={achievement?.id || Math.random()} className="glass-card rounded-3xl p-4 sm:p-6 shadow-sm hover:-translate-y-2 transition-all duration-500 text-center group">
                <div className="w-16 h-16 bg-primary/5 rounded-full flex items-center justify-center text-4xl mx-auto mb-4 group-hover:scale-125 transition-transform">
                  {achievement?.icon || '🏆'}
                </div>
                <h4 className="font-bold text-gray-800 text-sm mb-1">{achievement?.title || 'إنجاز'}</h4>
                <p className="text-xs text-gray-400 font-medium">{achievement?.description || 'لا يوجد وصف'}</p>
              </div>
            ));
          })()}
        </div>
      </div>
      </div>

      {/* 🖨️ واجهة الطباعة فقط (تظهر عند الطباعة وتختفي في الموقع) */}
      <div id="certificate-print-area" className="hidden print:block fixed inset-0 bg-white z-[9999] p-10 font-main w-full min-h-screen text-black" dir="rtl">
        {/* إطار فخم */}
        <div id="certificate-inner-border" className="border-4 border-double border-gray-300 p-4 sm:p-8 min-h-[calc(100vh-5rem)] flex flex-col relative bg-white">
          
          {/* علامة مائية */}
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
             <img src="/logo.jpg" alt="Watermark" className="w-[500px] grayscale" />
          </div>

          {/* الترويسة */}
          <div className="flex items-center justify-between border-b-2 border-gray-200 pb-6 mb-8 relative z-10">
            <div className="flex items-center gap-4">
              <img src="/logo.jpg" alt="Logo" className="w-24 h-24 object-contain" />
              <div>
                <h2 className="text-3xl font-black text-gray-900 font-title mb-1">مدارس الأوس الأهلية</h2>
                <p className="text-sm text-gray-600 font-bold">الإدارة العامة للتعليم بمنطقة المدينة المنورة</p>
              </div>
            </div>
            <div className="text-center bg-gray-50 px-8 py-4 rounded-xl border border-gray-200">
              <h3 className="text-2xl font-black text-gray-800 tracking-wide mb-2">إشعار درجات فصلي</h3>
              <p className="text-sm font-bold text-red-600 bg-red-50 px-3 py-1 rounded-lg border border-red-100">(نسخة غير رسمية للمتابعة)</p>
            </div>
          </div>

          {/* بيانات الطالب */}
          <div className="grid grid-cols-2 gap-y-4 gap-x-8 mb-10 relative z-10 bg-gray-50 p-4 sm:p-6 rounded-xl border border-gray-100">
             <div className="flex items-center gap-3">
                <span className="text-gray-500 font-bold w-24">اسم الطالب:</span>
                <span className="text-lg font-black text-gray-900">{studentData?.personal?.name || 'غير محدد'}</span>
             </div>
             <div className="flex items-center gap-3">
                <span className="text-gray-500 font-bold w-24">الصف الدراسي:</span>
                <span className="text-lg font-black text-gray-900">{studentData?.personal?.class || 'غير محدد'}</span>
             </div>
             <div className="flex items-center gap-3">
                <span className="text-gray-500 font-bold w-24">المعدل التراكمي:</span>
                <span className="text-lg font-black text-gray-900">{computedGPA.current} / 100</span>
             </div>
             <div className="flex items-center gap-3">
                <span className="text-gray-500 font-bold w-24">تاريخ الإصدار:</span>
                <span className="text-lg font-black text-gray-900">{new Date().toLocaleDateString('ar-SA')}</span>
             </div>
          </div>

          {/* جدول الدرجات */}
          <div className="w-full mb-12 relative z-10 flex-1">
            <table className="w-full text-right border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100 border-b-2 border-gray-300">
                  <th className="py-4 px-6 font-bold text-gray-800 border-l border-gray-300 text-lg">المادة الدراسية</th>
                  <th className="py-4 px-6 font-bold text-gray-800 text-center border-l border-gray-300 text-lg">النسبة</th>
                  <th className="py-4 px-6 font-bold text-gray-800 text-center border-l border-gray-300 text-lg">التقدير</th>
                  <th className="py-4 px-6 font-bold text-gray-800 text-center text-lg">الوصف</th>
                </tr>
              </thead>
              <tbody>
                {(filteredSubjects || []).length > 0 ? (
                  filteredSubjects.map((subject, idx) => {
                    const style = getGradeStyle(subject?.percentage || 0);
                    return (
                      <tr key={idx} className="border-b border-gray-200 even:bg-gray-50/50">
                        <td className="py-4 px-6 font-bold text-gray-900 border-l border-gray-200 text-lg">{subject?.name}</td>
                        <td className="py-4 px-6 text-center font-bold text-gray-800 border-l border-gray-200 text-lg">{subject?.percentage || 0}%</td>
                        <td className="py-4 px-6 text-center font-black text-gray-900 border-l border-gray-200 text-lg">{subject?.grade || '-'}</td>
                        <td className="py-4 px-6 text-center font-bold text-gray-700 text-lg">{style.text}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="4" className="py-8 text-center text-gray-500 font-medium text-lg">لا توجد نتائج مسجلة حتى الآن</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* التذييل والملاحظة */}
          <div className="mt-auto pt-8 border-t-2 border-gray-200 text-center relative z-10">
             <div className="bg-white text-red-600 p-4 rounded-xl text-sm font-bold inline-block border-2 border-red-500 shadow-sm max-w-3xl">
                ⚠️ ملاحظة هامة: هذا البيان تم إصداره آلياً من منصة الطالب لغرض اطلاع ولي الأمر والمتابعة الشخصية فقط.
                <br/>
                ولا يُعتد به كمستند رسمي لأغراض النقل أو المعاملات الرسمية خارج المدرسة.
             </div>
             <p className="text-sm font-bold text-gray-400 mt-6">مدارس الأوس الأهلية © {new Date().getFullYear()} - تم استخراجه بواسطة حساب الطالب: {studentData?.personal?.id}</p>
          </div>

        </div>
      </div>


    </>
  );
};

GradesView.propTypes = {
  studentData: PropTypes.object.isRequired,
  searchQuery: PropTypes.string.isRequired,
};

export default GradesView;
