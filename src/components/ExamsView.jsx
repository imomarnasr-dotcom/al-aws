import { BookOpen, Clock, AlertTriangle, CheckCircle2, FileText, ChevronRight } from 'lucide-react';
import { useState, useEffect, useMemo, useRef } from 'react';
import PropTypes from 'prop-types';

const getExamClassKey = (exam) => {
  const stage = String(exam?.stage || '').trim();
  const classCode = String(exam?.classCode || '').trim();
  const stageParts = stage.split(' - ').map(part => part.trim()).filter(Boolean);
  if (stageParts.length > 1) return stage;
  return classCode ? `${stage} - ${classCode}` : stage;
};

const parseTodayTime = (timeString, baseDate = new Date()) => {
  const match = String(timeString || '').match(/(\d+):(\d+)\s*(AM|PM|am|pm|ص|م)?/);
  if (!match) return null;
  let hours = parseInt(match[1], 10);
  const mins = parseInt(match[2], 10);
  const modifier = match[3]?.toLowerCase();
  if (modifier === 'pm' || modifier === 'م') {
    if (hours < 12) hours += 12;
  } else if (modifier === 'am' || modifier === 'ص') {
    if (hours === 12) hours = 0;
  }
  const date = new Date(baseDate);
  date.setHours(hours, mins, 0, 0);
  return date;
};

const cleanAndFetchExams = () => {
  try {
    const fromTeacher = JSON.parse(localStorage.getItem('moo_tests') || '[]');
    const fromOld = JSON.parse(localStorage.getItem('exams') || '[]');

    // 🔥 إصلاح: بنبني map من reports الموجودة في 'exams' عشان نحافظ عليها
    const reportsMap = {};
    fromOld.forEach(ex => {
      if (ex.id && Array.isArray(ex.reports) && ex.reports.length > 0) {
        reportsMap[ex.id] = ex.reports;
      }
    });

    // ندمج reports المحفوظة في أي اختبار راجع من moo_tests
    const mergedFromTeacher = fromTeacher.map(ex => ({
      ...ex,
      reports: reportsMap[ex.id] || ex.reports || []
    }));

    const validExams = fromOld.filter(ex => {
      if (ex.instructor) {
        return fromTeacher.some(t => t.id === ex.id);
      }
      return true;
    });

    if (validExams.length !== fromOld.length) {
      localStorage.setItem('exams', JSON.stringify(validExams));
      
    }

    return [...mergedFromTeacher, ...validExams.filter(e => !fromTeacher.find(t => t.id === e.id))];
  } catch { return []; }
};

// 🔥 الإصلاح: تحويل أسئلة المعلم (opt1..4 + text) لصيغة موحدة للطالب
const normalizeQuestion = (q) => {
  if (!q) return null;
  // إذا كانت options موجودة بالفعل (صيغة قديمة) نرجعها كما هي
  if (Array.isArray(q.options) && q.options.length > 0) {
    return {
      ...q,
      questionText: q.text || q.q || '',
      correctOptionIndex: q.correctIndex !== undefined ? q.correctIndex : (Number(q.correctOpt || 1) - 1)
    };
  }
  // الصيغة الجديدة: opt1, opt2, opt3, opt4
  const options = [q.opt1, q.opt2, q.opt3, q.opt4].filter(Boolean);
  return {
    ...q,
    options,
    questionText: q.text || q.q || '',
    // correctOpt يبدأ من "1" → نحوله لـ index يبدأ من 0
    correctOptionIndex: Number(q.correctOpt || 1) - 1
  };
};

const ExamsView = ({ studentData, setStudentData, searchQuery = '' }) => {
  const [exams, setExams] = useState(cleanAndFetchExams);
  // 🔥 إصلاح: استرجاع حالة الاختبار لو موجودة في localStorage لحمايتها من الـ Refresh
  const getInitialExamState = () => {
    try {
      const saved = JSON.parse(localStorage.getItem('moo_active_exam_state'));
      if (saved && saved.studentId === studentData?.personal?.id) {
        return saved;
      }
    } catch { /* ignore */ }
    return null;
  };

  const initialExamState = getInitialExamState();

  const [activeExam, setActiveExam] = useState(initialExamState?.activeExam || null);
  const [answers, setAnswers] = useState(initialExamState?.answers || {});
  const [timeLeft, setTimeLeft] = useState(initialExamState?.timeLeft || 0);
  const [showResult, setShowResult] = useState(null);
  const [currentQIndex, setCurrentQIndex] = useState(initialExamState?.currentQIndex || 0);
  const [now, setNow] = useState(new Date());
  const [examToStart, setExamToStart] = useState(null);
  const [viewingAnswersExam, setViewingAnswersExam] = useState(null);

  // 🔥 الإصلاح: نحتفظ بـ ref للـ activeExam عشان submitExam يقدر يقرأ أحدث قيمة
  const activeExamRef = useRef(null);
  const answersRef = useRef({});

  useEffect(() => { activeExamRef.current = activeExam; }, [activeExam]);
  useEffect(() => { answersRef.current = answers; }, [answers]);

  // 🔥 إصلاح: حفظ تقدم الاختبار مع كل تغيير
  useEffect(() => {
    if (activeExam) {
      const stateToSave = {
        studentId: studentData?.personal?.id,
        activeExam,
        answers,
        timeLeft,
        currentQIndex
      };
      localStorage.setItem('moo_active_exam_state', JSON.stringify(stateToSave));
      
    }
  }, [activeExam, answers, timeLeft, currentQIndex, studentData?.personal?.id]);

  const [toast, setToast] = useState('');
  const toastTimerRef = useRef(null);
  // 🔥 إصلاح: useRef للـ timer عشان نمنع memory leak
  const showToast = (msg) => {
    setToast(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(''), 4000);
  };
  useEffect(() => () => { if (toastTimerRef.current) clearTimeout(toastTimerRef.current); }, []);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleStorage = () => { setExams(cleanAndFetchExams()); };
    window.addEventListener('storage', handleStorage);
    window.addEventListener('moo-sync', handleStorage);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('moo-sync', handleStorage);
    };
  }, []);

  const myExams = useMemo(() => {
    if (!studentData?.personal) return [];
    const studentClass = studentData.personal.class;
    let filtered = exams.filter(ex => {
      const exClass = ex.classCode || getExamClassKey(ex);
      return exClass === studentClass || ex.stage === studentClass;
    });
    
    // Filter out missed/expired exams as per user request
    filtered = filtered.filter(ex => {
      const isDone = ex.reports?.some(r => r.studentId === studentData.personal.id);
      if (isDone) return true; // Show taken exams so they can see result
      
      let examDateObj;
      if (ex.date) {
        examDateObj = new Date(ex.date);
      } else {
        const createdAtTime = Number(ex.id);
        if (createdAtTime > 1600000000000) {
          const createdDate = new Date(createdAtTime);
          const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
          const createdDayIndex = createdDate.getDay();
          const examDayIndex = days.indexOf(ex.day);
          if (examDayIndex !== -1) {
            let daysToAdd = (examDayIndex - createdDayIndex + 7) % 7;
            examDateObj = new Date(createdDate.getFullYear(), createdDate.getMonth(), createdDate.getDate() + daysToAdd);
          } else {
            examDateObj = new Date();
          }
        } else {
          examDateObj = new Date();
        }
      }
      
      const examTime = parseTodayTime(ex.time, examDateObj);
      if (!examTime) return false;
      
      const endTime = new Date(examTime.getTime() + (ex.duration || 60) * 60000);
      if (new Date() > endTime) {
        return false; // Exam is expired and not done
      }
      return true;
    });

    if (searchQuery.trim()) {
      filtered = filtered.filter(ex =>
        (ex.title || '').includes(searchQuery) || (ex.subject || '').includes(searchQuery)
      );
    }
    return filtered;
  }, [exams, studentData, searchQuery]);

  // 🔥 الإصلاح: submitExam يقرأ من الـ refs عشان لو اتنفذ بعد ما الـ state اتغير يكون آمن
  const submitExam = (auto = false) => {
    const currentExam = activeExamRef.current;
    const currentAnswers = answersRef.current;

    if (!currentExam) return;

    // 🔥 إصلاح: تحقق من الأسئلة غير المجابة قبل التسليم
    if (!auto) {
      const totalQ = currentExam?.questions?.length || 0;
      const answeredQ = Object.keys(currentAnswers).filter(k => currentAnswers[k] !== undefined && currentAnswers[k] !== null).length;
      const unanswered = totalQ - answeredQ;

      if (unanswered > 0) {
        const confirmMsg = unanswered === totalQ
          ? `⚠️ لم تُجب على أي سؤال! (${totalQ} سؤال بدون إجابة)\n\nهل تريد التسليم بدون إجابات؟`
          : `⚠️ لديك ${unanswered} سؤال لم تُجب عليه من أصل ${totalQ}\n\nهل تريد التسليم والمتابعة؟`;
        if (!window.confirm(confirmMsg)) return;
      } else {
        if (!window.confirm('هل أنت متأكد من تسليم الإجابات وإنهاء الاختبار؟')) return;
      }
    }

    if (!currentExam?.questions?.length) return;

    if (document.fullscreenElement) {
      document.exitFullscreen().catch(err => console.error(err));
    }

    // 🔥 الإصلاح: تطبيع الأسئلة واستخدام correctOptionIndex بدل correctIndex
    let score = 0;
    currentExam.questions.forEach((rawQ, idx) => {
      const q = normalizeQuestion(rawQ);
      if (!q) return;
      if (currentAnswers[idx] === q.correctOptionIndex) score++;
    });

    const report = {
      studentId: studentData.personal.id,
      studentName: studentData.personal.name,
      score,
      total: currentExam.questions.length,
      status: 'submitted',
      studentAnswers: currentAnswers,
      timestamp: new Date().toISOString()
    };

    const currentExams = cleanAndFetchExams();
    const updatedExams = currentExams.map(ex => {
      if (ex.id === currentExam.id) {
        const otherReports = (ex.reports || []).filter(r => r.studentId !== studentData.personal.id);
        return { ...ex, reports: [...otherReports, report] };
      }
      return ex;
    });

    setExams(updatedExams);
    localStorage.setItem('exams', JSON.stringify(updatedExams));
    

    // 🔥 إصلاح: نحفظ الـ reports في moo_tests كمان عشان cleanAndFetchExams تلاقيها بعد refresh
    try {
      const teacherExams = JSON.parse(localStorage.getItem('moo_tests') || '[]');
      const updatedTeacherExams = teacherExams.map(ex => {
        if (ex.id === currentExam.id) {
          const otherReports = (ex.reports || []).filter(r => r.studentId !== studentData.personal.id);
          return { ...ex, reports: [...otherReports, report] };
        }
        return ex;
      });
      localStorage.setItem('moo_tests', JSON.stringify(updatedTeacherExams));
      
    } catch { /* لو فشل مش كارثة، exams هو المصدر الأساسي */ }

    // 🔥 إصلاح: نقل درجات الاختبار الأونلاين تلقائياً إلى moo_grades ليراها المعلم
    try {
      const moGrades = JSON.parse(localStorage.getItem('moo_grades') || '{}');
      
      // حساب النسبة المئوية: (score/total)*100
      const percentage = Math.round((report.score / report.total) * 100);
      
      // المفتاح: classCode__examTitle__semester
      const gradeKey = `${currentExam.classCode}__${currentExam.title}__الفصل الأول`;
      
      // إنشاء/تحديث خريطة الدرجات للاختبار
      if (!moGrades[gradeKey]) {
        moGrades[gradeKey] = {};
      }
      
      moGrades[gradeKey][studentData.personal.id] = percentage;
      localStorage.setItem('moo_grades', JSON.stringify(moGrades));
      
    } catch (e) {
      console.warn('❌ خطأ في نقل الدرجات إلى moo_grades:', e);
    }

    

    // 🔥 إصلاح: مسح حالة الاختبار المحفوظة بعد التسليم
    localStorage.removeItem('moo_active_exam_state');
    

    setActiveExam(null);

    // 🔥 إصلاح: setStudentData في App.jsx هو handleSetStudentData الذي يزيد syncTrigger فقط
    // لكن لو جاءنا دالة حقيقية نستخدمها، لو لأ نتجاهل بأمان
    try {
      if (typeof setStudentData === 'function') {
        setStudentData(prev => {
          if (!prev || typeof prev !== 'object') return prev;
          return {
            ...prev,
            personal: {
              ...prev.personal,
              weeklyCommitment: Math.min(100, (prev?.personal?.weeklyCommitment || 80) + 5)
            }
          };
        });
      }
    } catch (e) {
      console.warn('setStudentData call skipped:', e);
    }

    setShowResult({
      score,
      total: currentExam.questions.length,
      exam: currentExam,
      answers: { ...currentAnswers },
      message: 'شكرًا لمجهودك، سيتم إعلان النتيجة فور انتهاء وقت الاختبار الكلي'
    });
    setActiveExam(null);
  };

  useEffect(() => {
    let timer;
    if (activeExam && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (activeExam && timeLeft === 0) {
      submitExam(true);
    }

    const handleVisibilityChange = () => {
      // auto submit disabled based on user request
    };

    if (activeExam) {
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }

    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [activeExam, timeLeft]);

  const startExam = (exam) => {
    // 🔥 إصلاح: تحقق مزدوج — من الـ state ومن localStorage مباشرة
    const attempt = exam.reports?.find(r => r.studentId === studentData.personal.id);
    if (attempt?.status === 'started' || attempt?.status === 'submitted') {
      showToast('⚠️ عذراً، لقد استنفدت محاولتك في هذا الاختبار');
      return;
    }
    // تحقق إضافي من localStorage مباشرة كطبقة أمان ثانية
    try {
      const freshExams = cleanAndFetchExams();
      const freshExam = freshExams.find(e => e.id === exam.id);
      const freshAttempt = freshExam?.reports?.find(r => r.studentId === studentData.personal.id);
      if (freshAttempt?.status === 'started' || freshAttempt?.status === 'submitted') {
        showToast('⚠️ عذراً، لقد استنفدت محاولتك في هذا الاختبار');
        setExams(freshExams);
        return;
      }
    } catch { /* نكمل لو في خطأ */ }
    if (!exam.questions || exam.questions.length === 0) {
      showToast('⚠️ هذا الاختبار لا يحتوي على أسئلة بعد');
      return;
    }
    setExamToStart(exam);
  };

  const confirmStartExam = () => {
    const exam = examToStart;
    setExamToStart(null);
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(err => console.error(err));
    }

    const report = {
      studentId: studentData.personal.id,
      studentName: studentData.personal.name,
      status: 'started',
      timestamp: new Date().toISOString()
    };

    const updatedExams = exams.map(ex => {
      if (ex.id === exam.id) {
        return { ...ex, reports: [...(ex.reports || []).filter(r => r.studentId !== studentData.personal.id), report] };
      }
      return ex;
    });
    setExams(updatedExams);
    localStorage.setItem('exams', JSON.stringify(updatedExams));
    

    setActiveExam(exam);
    setAnswers({});
    setCurrentQIndex(0);
    setTimeLeft(exam.duration * 60);
    setShowResult(null);
  };

  const handleAnswerSelect = (qIdx, optIdx) => {
    if (!activeExam?.questions?.length) return;
    setAnswers(prev => ({ ...prev, [qIdx]: optIdx }));
    if (qIdx < activeExam.questions.length - 1) {
      setTimeout(() => { setCurrentQIndex(qIdx + 1); }, 400);
    }
  };

  const checkExamAccess = (exam) => {
    let examDateObj;
    if (exam.date) {
      examDateObj = new Date(exam.date);
    } else {
      const createdAtTime = Number(exam.id);
      if (createdAtTime > 1600000000000) {
        const createdDate = new Date(createdAtTime);
        const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
        const createdDayIndex = createdDate.getDay();
        const examDayIndex = days.indexOf(exam.day);
        if (examDayIndex !== -1) {
          let daysToAdd = (examDayIndex - createdDayIndex + 7) % 7;
          examDateObj = new Date(createdDate.getFullYear(), createdDate.getMonth(), createdDate.getDate() + daysToAdd);
        } else {
          examDateObj = new Date(now);
        }
      } else {
        // Fallback for very old exams
        examDateObj = new Date(now);
      }
    }

    const examTime = parseTodayTime(exam.time, examDateObj);
    if (!examTime) return { isOpen: false, msg: 'توقيت الاختبار غير صالح', countdown: null };

    const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const eDate = new Date(examTime.getFullYear(), examTime.getMonth(), examTime.getDate());
    
    if (todayDate < eDate) return { isOpen: false, msg: `الاختبار سيبدأ بتاريخ ${eDate.toLocaleDateString('ar-SA')} الساعة ${exam.time}`, countdown: null };
    if (todayDate > eDate) return { isOpen: false, msg: 'لقد انتهى وقت الاختبار', countdown: null };

    const endTime = new Date(examTime.getTime() + (exam.duration || 60) * 60000);

    if (now < examTime) {
      const diffSeconds = Math.floor((examTime - now) / 1000);
      const h = Math.floor(diffSeconds / 3600);
      const m = Math.floor((diffSeconds % 3600) / 60);
      const s = diffSeconds % 60;
      const countdown = `${h > 0 ? `${h}س ` : ''}${m}د ${s}ث`;
      return { isOpen: false, msg: `يبدأ بعد: ${countdown}`, countdown };
    }

    if (now > endTime) {
      return { isOpen: false, msg: 'لقد انتهى وقت الاختبار', countdown: null };
    }

    return { isOpen: true, msg: '', countdown: null };
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (activeExam) {
    if (!activeExam?.questions?.length) return null;
    const progress = Math.round(((Object.keys(answers).length) / activeExam.questions.length) * 100);
    const rawQ = activeExam.questions[currentQIndex];
    if (!rawQ) return null;
    // 🔥 الإصلاح: تطبيع السؤال قبل العرض
    const q = normalizeQuestion(rawQ);
    if (!q) return null;

    return (
      <div className="fixed inset-0 z-[1000] bg-gray-50 flex flex-col font-main" dir="rtl">
        {toast && (
          <div className="fixed top-4 sm:p-6 left-1/2 -translate-x-1/2 z-[2000] bg-red-600 text-white px-8 py-4 rounded-full shadow-2xl font-black text-sm animate-bounce">
            {toast}
          </div>
        )}
        <div className="bg-white border-b shadow-sm px-8 py-4 flex flex-col md:flex-row justify-between items-center sticky top-0 z-10 gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{activeExam.title}</h2>
            <p className="text-sm text-gray-500 font-bold">{activeExam.subject} - {activeExam.instructor}</p>
          </div>

          <div className="flex-1 w-full max-w-md px-4 hidden md:block">
            <div className="flex justify-between text-xs font-bold text-gray-500 mb-2">
              <span>التقدم</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2.5">
              <div className="bg-primary h-2.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
            </div>
          </div>

          <div className="flex items-center gap-4 sm:p-6 w-full md:w-auto justify-between md:justify-end">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold font-mono text-lg shadow-inner ${timeLeft < 60 ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-gray-100 text-gray-800'}`}>
              <Clock size={20} />
              {formatTime(timeLeft)}
            </div>
            <button onClick={() => submitExam(false)} className="bg-primary text-white px-6 py-2 rounded-xl font-bold text-sm shadow-lg shadow-primary/30 hover:-translate-y-0.5 transition-all">
              تسليم الإجابات
            </button>
          </div>
        </div>

        <div className="w-full px-8 py-4 md:hidden bg-white border-b">
          <div className="flex justify-between text-xs font-bold text-gray-500 mb-2">
            <span>التقدم</span>
            <span>{Object.keys(answers).length} / {activeExam.questions.length} أسئلة مجابة</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div className="bg-primary h-2 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-4 sm:p-8 flex flex-col items-center justify-center w-full">
          <div className="w-full max-w-3xl">
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-2xl mb-8 text-sm font-bold flex items-start gap-3 shadow-sm">
              <AlertTriangle className="shrink-0 mt-0.5" size={18} />
              <p>تنبيه: الخروج من هذه الصفحة أو فتح تبويب آخر سيؤدي إلى إغلاق الاختبار وتسليمه تلقائياً. يرجى التركيز.</p>
            </div>

            <div className="bg-white p-4 sm:p-8 md:p-12 rounded-[40px] shadow-lg border border-gray-100 animate-fade-in-up relative overflow-hidden min-h-[400px] flex flex-col">
              <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-100">
                <span className="bg-primary/10 text-primary font-bold px-4 py-1.5 rounded-xl text-sm">
                  السؤال {currentQIndex + 1} من {activeExam.questions.length}
                </span>
                {answers[currentQIndex] !== undefined && (
                  <span className="text-emerald-500 flex items-center gap-1 font-bold text-sm">
                    <CheckCircle2 size={16} /> تم الإجابة
                  </span>
                )}
              </div>

              {/* 🔥 الإصلاح: q.questionText بدل q.q */}
              <h3 className="font-bold text-2xl text-gray-900 mb-10 leading-relaxed text-right flex-1">
                {q.questionText}
              </h3>

              {/* 🔥 الإصلاح: q.options (مُطبَّع) بدل q.options الأصلي الذي كان undefined */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(q.options || []).map((opt, optIdx) => (
                  <button
                    key={optIdx}
                    onClick={() => handleAnswerSelect(currentQIndex, optIdx)}
                    className={`p-5 rounded-2xl text-right font-bold text-base transition-all border-2 relative overflow-hidden ${answers[currentQIndex] === optIdx
                      ? 'border-primary bg-primary/5 text-primary shadow-md transform scale-[1.02]'
                      : 'border-gray-100 bg-gray-50 text-gray-700 hover:border-gray-300 hover:bg-white hover:shadow-sm'
                      }`}
                  >
                    {answers[currentQIndex] === optIdx && (
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 w-3 h-3 bg-primary rounded-full shadow-[0_0_10px_rgba(var(--color-primary),0.5)]"></div>
                    )}
                    {opt}
                  </button>
                ))}
              </div>

              <div className="flex justify-between items-center mt-10 pt-6 border-t border-gray-100">
                <button
                  onClick={() => setCurrentQIndex(prev => Math.max(0, prev - 1))}
                  disabled={currentQIndex === 0}
                  className="px-6 py-2.5 rounded-xl font-bold text-sm bg-gray-100 text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition-colors"
                >
                  السؤال السابق
                </button>
                <button
                  onClick={() => setCurrentQIndex(prev => Math.min(activeExam.questions.length - 1, prev + 1))}
                  disabled={currentQIndex === activeExam.questions.length - 1}
                  className="px-6 py-2.5 rounded-xl font-bold text-sm bg-gray-100 text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition-colors"
                >
                  السؤال التالي
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-8 pb-10 relative">
      {/* Confirmation Modal */}
      {examToStart && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-gray-900/70 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-4 sm:p-8 shadow-2xl animate-fade-in-up text-center border border-gray-100">
            <div className="w-20 h-20 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle size={40} />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">تنبيه هام جداً</h3>
            <p className="text-gray-600 mb-8 font-bold leading-relaxed text-sm">
              عند الدخول للاختبار لا يمكنك الخروج إلا بعد الإنهاء، ولديك فرصة واحدة فقط. هل أنت مستعد للبدء؟
            </p>
            <div className="flex gap-4">
              <button onClick={() => setExamToStart(null)} className="flex-1 py-3 rounded-xl font-bold bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">
                إلغاء
              </button>
              <button onClick={confirmStartExam} className="flex-1 py-3 rounded-xl font-bold bg-primary text-white hover:shadow-lg hover:shadow-primary/30 transition-all">
                موافق، ابدأ الآن
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Answers Viewing Modal */}
      {viewingAnswersExam && (
        <div className="fixed inset-0 z-[2000] bg-gray-50 flex flex-col font-main" dir="rtl">
          <div className="bg-white border-b shadow-sm px-8 py-4 flex justify-between items-center sticky top-0 z-10">
            <div>
              <h2 className="text-xl font-bold text-gray-900">نتيجة: {viewingAnswersExam.exam.title}</h2>
              <p className="text-sm text-gray-500 font-bold">الدرجة: {viewingAnswersExam.report.score} / {viewingAnswersExam.report.total}</p>
            </div>
            <button onClick={() => setViewingAnswersExam(null)} className="bg-gray-100 text-gray-600 px-6 py-2 rounded-xl font-bold hover:bg-gray-200 transition-all">
              إغلاق
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 md:p-4 sm:p-8">
            <div className="max-w-3xl mx-auto space-y-4">
              {viewingAnswersExam.exam.questions.map((rawQ, idx) => {
                const q = normalizeQuestion(rawQ);
                if (!q) return null;
                const studentAnswers = viewingAnswersExam.report.studentAnswers || {};
                const studentAnswer = studentAnswers[idx];
                const isCorrect = studentAnswer === q.correctOptionIndex;
                const options = [q.opt1, q.opt2, q.opt3, q.opt4].filter(Boolean);
                return (
                  <div key={idx} className={`rounded-3xl p-5 border ${isCorrect ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                    <div className="flex items-start gap-3 mb-3">
                      <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-black flex-shrink-0 ${isCorrect ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
                        {isCorrect ? '✓' : '✗'}
                      </span>
                      <p className="font-bold text-gray-800 text-sm leading-relaxed">{q.text || q.questionText}</p>
                    </div>
                    <div className="grid grid-cols-1 gap-2 mr-10">
                      {options.map((opt, oi) => {
                        const isStudentPick = studentAnswer === oi;
                        const isRight = q.correctOptionIndex === oi;
                        return (
                          <div key={oi} className={`px-4 py-2.5 rounded-2xl text-sm font-bold flex items-center gap-2 ${
                            isRight ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                            isStudentPick && !isRight ? 'bg-red-100 text-red-700 border border-red-300' :
                            'bg-white/60 text-gray-600 border border-gray-100'
                          }`}>
                            {isRight && <span className="text-emerald-600">✓</span>}
                            {isStudentPick && !isRight && <span className="text-red-500">✗</span>}
                            {opt}
                            {isStudentPick && <span className="text-xs font-black mr-auto opacity-60">إجابتك</span>}
                            {isRight && !isStudentPick && <span className="text-xs font-black mr-auto text-emerald-600">الصحيحة</span>}
                          </div>
                        );
                      })}
                      {studentAnswer === undefined && (
                        <p className="text-xs text-gray-400 font-bold px-4">— لم تُجب على هذا السؤال</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 sm:p-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
              <FileText size={24} />
            </div>
            بوابة الاختبارات
          </h1>
          <p className="text-gray-500 mt-2 font-medium">أنجز اختباراتك لرفع مؤشر الالتزام الأسبوعي الخاص بك</p>
        </div>
      </div>

      {showResult && (
        <div className="space-y-6 animate-fade-in-up max-w-3xl mx-auto">
          {/* بطاقة تأكيد التسليم */}
          <div className="bg-white rounded-[40px] p-10 shadow-2xl shadow-emerald-500/10 border border-emerald-100 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-full h-2 bg-gradient-to-l from-emerald-500 to-emerald-400"></div>
            <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
              <CheckCircle2 size={48} />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">تم تسليم الإجابات بنجاح!</h2>
            <p className="text-lg font-bold text-gray-500 mb-6 bg-gray-50 p-4 rounded-2xl border border-gray-100 inline-block">
              انتظر بعد انتهاء الوقت الفعلي للاختبار لرؤية النتيجة.
            </p>
          </div>

          <button onClick={() => setShowResult(null)} className="w-full bg-gray-900 text-white font-bold py-4 rounded-2xl hover:bg-gray-800 transition-colors shadow-xl shadow-gray-900/20">
            العودة لبوابة الاختبارات
          </button>
        </div>
      )}

      {!showResult && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:p-6">
          {myExams.length > 0 ? myExams.map(exam => {
            const isDone = exam.reports?.find(r => r.studentId === studentData.personal.id);
            const access = checkExamAccess(exam);
            const isMissed = !isDone && !access.isOpen && access.msg === 'لقد انتهى وقت الاختبار';

            return (
              <div key={exam.id} className="glass-card rounded-[32px] p-4 sm:p-6 shadow-sm border border-gray-100 flex flex-col group hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
                {isDone && (
                  <div className="absolute -left-10 top-4 sm:p-6 -rotate-45 bg-emerald-500 text-white font-bold text-[10px] py-1 px-10 shadow-sm z-10 text-center">
                    تم التسليم
                  </div>
                )}
                {isMissed && (
                  <div className="absolute -left-10 top-4 sm:p-6 -rotate-45 bg-red-500 text-white font-bold text-[10px] py-1 px-10 shadow-sm z-10 text-center">
                    غير حاضر
                  </div>
                )}
                <div className="flex justify-between items-start mb-6">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-inner ${exam.type === 'online' ? 'bg-blue-50 text-blue-500' : 'bg-orange-50 text-orange-500'}`}>
                    {exam.type === 'online' ? '💻' : '📄'}
                  </div>
                </div>

                <h3 className="font-bold text-xl text-gray-900 mb-1 leading-tight">{exam.title}</h3>
                <p className="text-sm font-bold text-primary mb-6">{exam.subject || exam.title} <span className="text-gray-400 font-normal">| أ. {exam.instructor || exam.teacherName}</span></p>

                <div className="space-y-3 mb-8 flex-1 bg-white/50 p-4 rounded-2xl border border-gray-50">
                  <p className="text-xs font-bold text-gray-600 flex items-center gap-2"><Clock size={16} className="text-gray-400" /> الموعد: {exam.date ? exam.date : exam.day} - {exam.time}</p>
                  <p className="text-xs font-bold text-gray-600 flex items-center gap-2"><BookOpen size={16} className="text-gray-400" /> المدة: {exam.duration} دقيقة</p>
                  <p className="text-xs font-bold text-gray-600 flex items-center gap-2"><AlertTriangle size={16} className="text-gray-400" /> النوع: {exam.type === 'online' ? 'إلكتروني (يتطلب حاسوب)' : 'ورقي (حضورياً بالفصل)'}</p>
                  {exam.questions?.length > 0 && (
                    <p className="text-xs font-bold text-gray-600 flex items-center gap-2"><FileText size={16} className="text-gray-400" /> عدد الأسئلة: {exam.questions.length}</p>
                  )}
                </div>

                {isDone ? (
                  (!access.isOpen && access.msg === 'لقد انتهى وقت الاختبار') ? (
                    <button onClick={() => {
                        const report = exam.reports.find(r => r.studentId === studentData.personal.id);
                        setViewingAnswersExam({ exam, report });
                    }} className="w-full bg-primary text-white py-3.5 rounded-xl font-bold text-sm hover:shadow-lg transition-all border border-primary shadow-sm">
                      عرض النتيجة والأسئلة
                    </button>
                  ) : (
                    <button disabled className="w-full bg-gray-100 text-gray-400 py-3.5 rounded-xl font-bold text-sm cursor-not-allowed border border-gray-200">
                      تم تسليم الاختبار (بانتظار انتهاء الوقت لعرض النتيجة)
                    </button>
                  )
                ) : (
                  <>
                    {isMissed ? (
                      <button disabled className="w-full bg-red-50 text-red-500 py-3.5 rounded-xl font-bold text-sm cursor-not-allowed border border-red-100 shadow-inner">
                        انتهت مدة الاختبار (غير حاضر)
                      </button>
                    ) : exam.type === 'online' ? (
                      access.isOpen ? (
                        <button
                          onClick={() => startExam(exam)}
                          className="w-full flex justify-center items-center gap-2 py-3.5 rounded-xl font-bold text-sm bg-primary text-white hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/30 transition-all"
                        >
                          بدء الاختبار الآن <ChevronRight size={18} />
                        </button>
                      ) : (
                        <button disabled className={`w-full flex justify-center items-center gap-2 py-3.5 rounded-xl font-bold text-xs border cursor-not-allowed ${access.countdown ? 'bg-primary/10 text-primary border-primary/20 shadow-inner' : 'bg-orange-50 text-orange-600 border-orange-100'}`}>
                          <Clock size={16} className={access.countdown ? "animate-pulse" : ""} /> {access.msg}
                        </button>
                      )
                    ) : (
                      <button
                        onClick={() => {
                          const msg = [
                            `📄 تعليمات الاختبار الورقي`,
                            ``,
                            `📚 الاختبار: ${exam.title}`,
                            `📖 المادة: ${exam.subject}`,
                            `👨‍🏫 المعلم: ${exam.instructor}`,
                            `📅 الموعد: ${exam.date || exam.day} — ${exam.time}`,
                            `⏱ المدة: ${exam.duration} دقيقة`,
                            ``,
                            `✅ تعليمات هامة:`,
                            `• احضر بالقلم الجاف الأزرق أو الأسود`,
                            `• أحضر بطاقتك الأكاديمية`,
                            `• كن في قاعة الاختبار قبل الموعد بـ 10 دقائق`,
                            `• لا يُسمح بالهاتف داخل القاعة`,
                            `• في حال الغياب تواصل مع إدارة المدرسة مسبقاً`,
                          ].join('\n');
                          window.dispatchEvent(new CustomEvent('moo-toast', { detail: { message: msg, type: 'error' } }));
                        }}
                        className="w-full flex justify-center items-center gap-2 py-3.5 rounded-xl font-bold text-sm bg-orange-50 text-orange-600 border border-orange-200 hover:bg-orange-100 transition-colors"
                      >
                        <FileText size={16} /> عرض تعليمات الاختبار الورقي
                      </button>
                    )}
                  </>
                )}
              </div>
            );
          }) : (
            <div className="col-span-full py-20 text-center glass-card rounded-[32px] border border-dashed border-gray-200">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                <FileText size={32} />
              </div>
              <p className="font-bold text-gray-400 text-lg">لا توجد اختبارات مجدولة لفصلك حالياً.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

ExamsView.propTypes = {
  studentData: PropTypes.object.isRequired,
  setStudentData: PropTypes.func.isRequired,
  searchQuery: PropTypes.string.isRequired,
};

export default ExamsView;

