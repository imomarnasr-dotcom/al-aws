import { LogOut, Calendar, Clock, BookOpen, Trash2, X, Users, ClipboardCheck, FileText, Lock, AlertCircle, Bell, Plus, Save, CheckCircle2, Edit2, Search, Megaphone, BarChart2, Download, ArrowLeft } from 'lucide-react';
import { useState, useMemo, useEffect, useRef } from 'react';
import { useCloudStorage } from '../services/useCloudStorage';
import { motion, AnimatePresence } from 'framer-motion';
import { getGlobalMaster, SyncAll, getTeacherNotifications, sendSwapRequest, executeSwap, rejectSwap, ATTENDANCE_STATUS, calculateStudentAttendance } from '../utils/dataManager';

import GlassScheduleTable from './GlassScheduleTable';
import { useTeacherTable } from '../hooks/useTeacherTable';
import { getSubjectColor } from '../utils/subjectIcon';
import * as XLSX from 'xlsx';
import { toPng } from 'html-to-image';
import { db } from '../config/firebase';
import logoImage from '../assets/logo.jpg';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const LiveCountdown = ({ targetTime }) => {
  const [timeLeft, setTimeLeft] = useState('');
  useEffect(() => {
    if (!targetTime) return;
    const update = () => {
      const diff = targetTime - new Date();
      if (diff <= 0) {
        setTimeLeft('حان الوقت، يرجى التحديث');
      } else {
        const h = Math.floor(diff / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((diff % (1000 * 60)) / 1000);
        let str = '';
        if (h > 0) str += `${h}س `;
        if (m > 0 || h > 0) str += `${m}د `;
        str += `${s}ث`;
        setTimeLeft(str);
      }
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [targetTime]);

  if (!targetTime || timeLeft.includes('حان الوقت')) return <span className="text-[9px] text-amber-500 font-bold">يرجى تحديث الصفحة</span>;
  return <span className="text-[10px] font-bold">تبدأ بعد <span dir="ltr" className="inline-block font-black text-gray-700">{timeLeft}</span></span>;
};

const TeacherDashboard = ({ onLogout, currentTeacherUser }) => {
  const getCurrentDayNameArabic = () => {
    const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    return days[new Date().getDay()];
  };

  const parseTime = (timeStr) => {
    if (!timeStr) return 0;
    const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM|am|pm|ص|م)?/);
    if (!match) return 0;
    let hours = parseInt(match[1]);
    const mins = parseInt(match[2]);
    const modifier = match[3]?.toLowerCase();
    if (modifier === 'pm' || modifier === 'م') { if (hours < 12) hours += 12; }
    else if (modifier === 'am' || modifier === 'ص') { if (hours === 12) hours = 0; }
    else { if (hours >= 1 && hours <= 6) hours += 12; }
    const t = new Date();
    t.setHours(hours, mins, 0, 0);
    return t;
  };

  const isTestStarted = (t) => {
    try {
      const now = new Date();
      if (t.date) {
        const [year, month, day] = t.date.split('-');
        const testDate = new Date(year, month - 1, day);
        const pt = parseTime(t.time);
        testDate.setHours(pt.getHours(), pt.getMinutes(), 0, 0);
        return now >= testDate;
      } else if (t.day) {
        if (t.createdAt) {
          const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
          const createdDate = new Date(t.createdAt);
          const createdDayIndex = createdDate.getDay();
          const targetDayIndex = days.indexOf(t.day);
          let daysToAdd = targetDayIndex - createdDayIndex;
          if (daysToAdd < 0) daysToAdd += 7;
          const pt = parseTime(t.time);
          if (daysToAdd === 0 && pt < createdDate) daysToAdd += 7;
          const testDate = new Date(createdDate.getFullYear(), createdDate.getMonth(), createdDate.getDate() + daysToAdd);
          testDate.setHours(pt.getHours(), pt.getMinutes(), 0, 0);
          return now >= testDate;
        } else {
          const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
          if (t.day === days[now.getDay()]) return now >= parseTime(t.time);
        }
      }
    } catch { }
    return false;
  };

  const [activeTab, setActiveTab] = useState('schedule');
  const [isTeacherOverlayOpen, setIsTeacherOverlayOpen] = useState(false);
  const [isExamScheduleOpen, setIsExamScheduleOpen] = useState(false);
  const [gracePeriodMode, setGracePeriodMode] = useState(null);
  const [selectedClassForOverlay, setSelectedClassForOverlay] = useState('');

  const [notifications, setNotifications] = useState([]);
  const [showNotifs, setShowNotifs] = useState(false);

  const [toastMsg, setToastMsg] = useState('');
  const toastTimerRef = useRef(null);
  // ًں”¥ إصلاح: نستخدم useRef للـ timer عشان نعمل cleanup صح ونمنع setState على component ميت
  const showToast = (msg) => {
    setToastMsg(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToastMsg(''), 5000);
  };
  useEffect(() => () => { if (toastTimerRef.current) clearTimeout(toastTimerRef.current); }, []);

  const [announcements, setAnnouncements] = useState([]);
  const [hiddenAnnouncements, setHiddenAnnouncements] = useState(() => JSON.parse(localStorage.getItem('moo_hidden_announcements') || '[]'));

  const handleHideAnnouncement = (id) => {
    const newHidden = [...hiddenAnnouncements, id];
    setHiddenAnnouncements(newHidden);
    localStorage.setItem('moo_hidden_announcements', JSON.stringify(newHidden));
  };

  useEffect(() => {
    const updateAnnouncements = () => {
      const all = announcements;
      const now = new Date();
      const active = all.filter(a => {
        if (a.target !== 'all' && a.target !== 'teachers') return false;
        if (a.startDate && new Date(a.startDate) > now) return false;
        if (a.endDate && new Date(a.endDate) < now) return false;
        return true;
      });
      setAnnouncements(active);
    };
    updateAnnouncements();
    window.addEventListener('storage', updateAnnouncements);
    window.addEventListener('moo-sync', updateAnnouncements);
    return () => {
      window.removeEventListener('storage', updateAnnouncements);
      window.removeEventListener('moo-sync', updateAnnouncements);
    };
  }, []);

  const [masterData, setMasterData] = useState(() => getGlobalMaster());
  const [globalSchedule, setGlobalSchedule] = useCloudStorage('lessons', 'all_data', []);
  const [staff, setStaff] = useCloudStorage('staff', 'all_data', []);
  const [students, setStudents] = useCloudStorage('whitelist', 'all_data', []);

  const [globalClassesData] = useCloudStorage('classes', 'all_data', []);
  const adminClasses = useMemo(() => {
    const extraClasses = globalClassesData || [];
    return [...new Set([...(masterData.classes || []), ...extraClasses])];
  }, [masterData.classes, globalClassesData]);

  const teacherProfile = useMemo(() => staff.find(s => s.username === currentTeacherUser) || { name: 'معلم', specialization: 'عام' }, [staff, currentTeacherUser]);

  const [tests, setTests] = useCloudStorage('tests', 'all_data', []);
  const myTests = useMemo(() => tests.filter(t => t.teacherName === teacherProfile.name), [tests, teacherProfile.name]);
  const [questionBank, setQuestionBank] = useCloudStorage('questionBank', 'all_data', []);
  const [attendance, setAttendance] = useCloudStorage('attendance', 'all_data', {});
  const [gracePeriods, setGracePeriods] = useCloudStorage('gracePeriods', 'all_data', []);
  const [notificationsData, setNotificationsData] = useCloudStorage('notifications', 'all_data', []);
  const [exams, setExams] = useCloudStorage('exams', 'all_data', []);
  const [grades, setGrades] = useCloudStorage('grades', 'all_data', {});
  const [paperGrades, setPaperGrades] = useCloudStorage('paper_grades', 'all_data', {});
  const [paperArchive, setPaperArchive] = useCloudStorage('paper_archive', 'all_data', []);

  const [examMode, setExamTimingMode] = useState('schedule');
  const [newTest, setNewTest] = useState({ id: null, title: '', classCode: '', date: '', day: '', time: '', duration: 45, type: 'online' });
  const [questions, setQuestions] = useState([]);
  const [currentQ, setCurrentQ] = useState({ id: null, text: '', opt1: '', opt2: '', opt3: '', opt4: '', correctOpt: '1' });
  const [showBank, setShowBank] = useState(false);

  const handleSaveQuestion = () => {
    if (!currentQ.text || !currentQ.opt1 || !currentQ.opt2) return showToast('❌ يرجى إدخال نص السؤال وخيارين على الأقل.');
    const qToSave = { ...currentQ, id: currentQ.id || Date.now().toString(), classCode: newTest.classCode };
    if (currentQ.id) setQuestions(questions.map(q => q.id === currentQ.id ? qToSave : q));
    else {
      setQuestions([...questions, qToSave]);
      const updatedBank = [...questionBank, qToSave];
      setQuestionBank(updatedBank);
      setQuestionBank(updatedBank);
    }
    setCurrentQ({ id: null, text: '', opt1: '', opt2: '', opt3: '', opt4: '', correctOpt: '1' });
    showToast('✅ تم حفظ السؤال');
  };
  const handleEditQuestion = (q) => { setCurrentQ(q); };
  const handleDeleteQuestion = (id) => { setQuestions(questions.filter(q => q.id !== id)); showToast('ًں—‘ï¸ڈ تم حذف السؤال'); };
  const addFromBank = (q) => {
    if (questions.find(qx => qx.text === q.text)) return showToast('❌ السؤال موجود بالفعل!');
    setQuestions([...questions, { ...q, id: Date.now().toString() }]);
    setShowBank(false);
    showToast('✅ تمت إضافة السؤال من البنك');
  };

  const handleExamSlotSelect = (day, time, existingLesson) => {
    if (existingLesson && existingLesson.instructor !== teacherProfile.name) {
      showToast('❌ عذراً، هذه الحصة تابعة لمعلم آخر.');
      return;
    }
    const lessonDuration = masterData.settings?.lessonDuration || 45;
    setNewTest({ ...newTest, day, time, duration: lessonDuration });
    setIsExamScheduleOpen(false);
    showToast(`✅ تم ربط الاختبار بتوقيت الحصة (${time}) بنجاح`);
  };

  const handleSaveTest = () => {
    if (!newTest.title || !newTest.classCode) return showToast('❌ يرجى تحديد عنوان الاختبار والفصل المستهدف');
    if (examMode === 'schedule' && (!newTest.day || !newTest.time)) return showToast('❌ يرجى فتح الجدول وتحديد حصة الاختبار');
    if (examMode === 'evening' && (!newTest.date || !newTest.time)) return showToast('❌ يرجى تحديد تاريخ ووقت الاختبار المسائي');
    if (questions.length === 0) return showToast('❌ لا يمكن حفظ اختبار بدون أسئلة!');

    let finalSchedule = [...globalSchedule];
    let targetDayName = newTest.day;

    if (examMode === 'evening') {
      const dateObj = new Date(newTest.date);
      const daysArabic = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
      targetDayName = daysArabic[dateObj.getDay()];
      newTest.type = 'online';
    }

    if (examMode === 'schedule') {
      const conflictingLesson = globalSchedule.find(l =>
        (l.classCode === newTest.classCode || l.stage === newTest.classCode) &&
        l.day === targetDayName &&
        l.time === newTest.time &&
        l.type !== 'break' && !l.isBreak
      );

      if (conflictingLesson) {
        const confirmSwap = window.confirm(`⚠️ سيتم تحويل حصتك المسجلة في (${newTest.time}) إلى اختبار.\nهل أنت متأكد؟`);
        if (!confirmSwap) return showToast('تم إلغاء العملية.');

        finalSchedule = finalSchedule.map(l =>
          l.id === conflictingLesson.id ? { ...l, type: 'exam', subject: newTest.title } : l
        );
      } else {
        finalSchedule.push({
          id: Date.now().toString(),
          instructor: teacherProfile.name,
          subject: newTest.title,
          day: targetDayName,
          time: newTest.time,
          classCode: newTest.classCode,
          stage: newTest.classCode,
          type: 'exam'
        });
      }
    }

    const testId = newTest.id || Date.now().toString();
    const testObj = { ...newTest, id: testId, day: targetDayName, questions, questionsCount: questions.length, teacherName: teacherProfile.name };

    const globalExamObj = {
      id: testId,
      title: testObj.title,
      subject: testObj.title,
      stage: testObj.classCode,
      classCode: testObj.classCode,
      day: targetDayName,
      time: testObj.time,
      date: testObj.date,
      type: testObj.type,
      instructor: teacherProfile.name,
      duration: testObj.duration,
      questions: testObj.questions
    };

    setGlobalSchedule(finalSchedule);
    const master = getGlobalMaster();
    master.lessons = finalSchedule;
    SyncAll(master);

    const updatedTests = newTest.id ? tests.map(t => t.id === testId ? testObj : t) : [...tests, testObj];
    setTests(updatedTests);
    localStorage.setItem('moo_tests', JSON.stringify(updatedTests));

    const allExams = exams;
    const updatedExams = newTest.id ? allExams.map(ex => ex.id === testId ? globalExamObj : ex) : [...allExams, globalExamObj];
    setExams(updatedExams);

    
    window.dispatchEvent(new CustomEvent('moo-sync'));

    setNewTest({ id: null, title: '', classCode: '', date: '', day: '', time: '', duration: 45, type: 'online' });
    setQuestions([]);
    showToast('✅ تم رصد الاختبار بنجاح!');
  };

  const handleEditTest = (test) => {
    setNewTest(test);
    setExamTimingMode(test.date ? 'evening' : 'schedule');
    setQuestions(test.questions || []);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    showToast('✏️ جاهز للتعديل');
  };

  const handleDeleteTest = (id) => {
    const test = tests.find(t => t.id === id);
    if (!test) return;
    
    const started = isTestStarted(test);

    const pwd = window.prompt(
      started 
        ? 'هذا الاختبار بدأ بالفعل! حذفه سيقوم بإخفائه من لوحتك فقط للحفاظ على إجابات ودرجات الطلاب. يرجى إدخال كلمة المرور للتأكيد:'
        : 'سيتم حذف الاختبار بشكل نهائي من جميع المنصات لأنه لم يبدأ بعد. يرجى إدخال كلمة المرور للتأكيد:'
    );

    if (pwd !== teacherProfile?.password) {
      if (pwd !== null) showToast('❌ كلمة المرور غير صحيحة!');
      return;
    }

    const updatedTests = tests.filter(t => t.id !== id);
    setTests(updatedTests);

    if (!started) {
      const allExams = exams;
      const cleanedExams = allExams.filter(ex => ex.id !== id);
      setExams(cleanedExams);
    }

    const master = getGlobalMaster();
    if (master.lessons) {
      master.lessons = master.lessons.filter(l => l.id !== id);
      setGlobalSchedule(master.lessons);
      SyncAll(master);
    }

    
    window.dispatchEvent(new CustomEvent('moo-sync'));
    showToast('🗑️ تم حذف الاختبار نهائياً من كافة السجلات');
  };

  const [attendanceClass, setAttendanceClass] = useState('');
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceMap, setAttendanceMap] = useState({});
  const [confirmModalData, setConfirmModalData] = useState(null);

  useEffect(() => { 
    if (attendanceClass && attendanceDate) {
      const history = attendance;
      const recordKey = `${attendanceClass}_${attendanceDate}`;
      if (history[recordKey]) {
        const oldRecord = history[recordKey];
        const newMap = {};
        Object.keys(oldRecord).forEach(studentId => {
           newMap[studentId] = oldRecord[studentId] === ATTENDANCE_STATUS.PRESENT || oldRecord[studentId] === 'حاضر' || oldRecord[studentId] === 'حاضر' || oldRecord[studentId] === true;
        });
        setAttendanceMap(newMap);
      } else {
        setAttendanceMap({}); 
      }
    } else {
      setAttendanceMap({}); 
    }
  }, [attendanceClass, attendanceDate]);
  const toggleStudentAttendance = (studentId) => { 
    setAttendanceMap(prev => {
      const val = prev[studentId];
      const isPresent = val === undefined || val === true || val === 'PRESENT';
      return { ...prev, [studentId]: !isPresent };
    }); 
  };

  const [gradesClass, setGradesClass] = useState('');
  const [gradesSubject, setGradesSubject] = useState('');
  const [gradesSemester, setGradesSemester] = useState('الفصل الأول');
  const [gradesMode, setGradesMode] = useState('online'); 
  const [gradesMap, setGradesMap] = useState({});
  const [savedGrades, setSavedGrades] = useCloudStorage('grades', 'all_data', {});
  const [realGrades, setRealGrades] = useState(() => {
    try { return grades; } catch { return {}; }
  });

  useEffect(() => {
    const refresh = () => {
      try { setRealGrades(grades); } catch { }
    };
    window.addEventListener('moo-sync', refresh);
    window.addEventListener('storage', refresh);
    const interval = setInterval(refresh, 500);
    return () => { 
      window.removeEventListener('moo-sync', refresh); 
      window.removeEventListener('storage', refresh);
      clearInterval(interval);
    };
  }, []);

  const gradesClassStudents = useMemo(() =>
    students.filter(s => s.className === gradesClass),
    [students, gradesClass]
  );

  const gradesKey = `${gradesClass}__${gradesSubject}__${gradesSemester}`;

  useEffect(() => {
    if (!gradesKey || gradesKey === '____') return;
    const existing = savedGrades[gradesKey] || {};
    setGradesMap(existing);
  }, [gradesKey]);

  const handleSaveGrades = () => {
    if (!gradesClass || !gradesSubject) return showToast('❌ يرجى تحديد الفصل والمادة');
    const updated = { ...savedGrades, [gradesKey]: gradesMap };
    setSavedGrades(updated);
    setGrades(updated);
    window.dispatchEvent(new CustomEvent('moo-sync'));
    showToast('✅ تم حفظ الدرجات بنجاح!');
  };

  const [paperExamGradingMode, setPaperExamGradingMode] = useState('paper');
  const [selectedPaperExam, setSelectedPaperExam] = useState(null);
  const [paperExamEntryMode, setPaperExamEntryMode] = useState('table'); 
  const [paperExamGrades, setPaperExamGrades] = useState({});
  const [paperExamStatuses, setPaperExamStatuses] = useState({}); 
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [savedPaperExamGrades, setSavedPaperExamGrades] = useCloudStorage('paper_grades', 'all_data', {});
  const [paperExamArchive, setPaperExamArchive] = useCloudStorage('paper_archive', 'all_data', []);

  const paperExamGradingStudents = useMemo(() =>
    selectedPaperExam ? students.filter(s => s.className === selectedPaperExam.classCode) : [],
    [students, selectedPaperExam]
  );

  const availablePaperExams = useMemo(() => 
    myTests.filter(t => t.classCode === gradesClass && t.type === 'paper'),
    [myTests, gradesClass]
  );

  const handleSelectPaperExam = (exam) => {
    setSelectedPaperExam(exam);
    const examKey = `${exam.id}__${exam.classCode}`;
    const existing = savedPaperExamGrades[examKey] || {};
    
    const currentGrades = {};
    const currentStatuses = {};
    Object.keys(existing).forEach(studentId => {
      if (existing[studentId] === 'absent') {
        currentStatuses[studentId] = 'absent';
        currentGrades[studentId] = '';
      } else {
        currentStatuses[studentId] = 'present';
        currentGrades[studentId] = existing[studentId];
      }
    });

    setPaperExamGrades(currentGrades);
    setPaperExamStatuses(currentStatuses);
    setPaperExamGradingMode('entry');
    showToast(`✅ تم تحديد الاختبار: ${exam.title}`);
  };

  const handleToggleStudentStatus = (studentId) => {
    setPaperExamStatuses(prev => {
      const current = prev[studentId] || 'present';
      return { ...prev, [studentId]: current === 'present' ? 'absent' : 'present' };
    });
  };

  const handleSetCustomGrade = (studentId, grade) => {
    setPaperExamGrades(prev => ({ ...prev, [studentId]: grade }));
  };

  const handleSubmitPaperExamGrades = () => {
    if (!selectedPaperExam) return showToast('❌ لم يتم تحديد الاختبار');
    
    const finalGrades = {};
    paperExamGradingStudents.forEach(student => {
      const status = paperExamStatuses[student.id] || 'present';
      if (status === 'absent') {
        finalGrades[student.id] = 'absent';
      } else {
        finalGrades[student.id] = paperExamGrades[student.id] || 0;
      }
    });

    const examKey = `${selectedPaperExam.id}__${selectedPaperExam.classCode}`;
    const updated = { ...savedPaperExamGrades, [examKey]: finalGrades };
    setSavedPaperExamGrades(updated);
    setPaperGrades(updated);

    const archiveEntry = {
      id: selectedPaperExam.id,
      title: selectedPaperExam.title,
      classCode: selectedPaperExam.classCode,
      submittedAt: new Date().toISOString(),
      grades: finalGrades
    };
    const newArchive = [...paperExamArchive.filter(a => a.id !== selectedPaperExam.id), archiveEntry];
    setPaperExamArchive(newArchive);
    setPaperArchive(newArchive);

    window.dispatchEvent(new CustomEvent('moo-sync'));
    showToast('✅ تم إرسال الدرجات بنجاح!');
    
    setSelectedPaperExam(null);
    setPaperExamGrades({});
    setPaperExamStatuses({});
    setPaperExamGradingMode('select');
    setShowConfirmationModal(false);
  };

  const [showExportModal, setShowExportModal] = useState(false);
  const [showResultsExportDropdown, setShowResultsExportDropdown] = useState(false);
  const resultsExportRef = useRef(null);

  const getExportData = () => {
    if (selectedPaperExam && paperExamGradingMode === 'online') {
      const data = paperExamGradingStudents
        .map(student => {
          let score = null;
          for (const semester of ['الفصل الأول', 'الفصل الثاني', 'الفصل الثالث']) {
            const examKey = `${selectedPaperExam.classCode}__${selectedPaperExam.title}__${semester}`;
            if (realGrades[examKey]?.[student.id]) {
              score = realGrades[examKey][student.id];
              break;
            }
          }
          const letter = score ? (score >= 95 ? 'A+' : score >= 90 ? 'A' : score >= 85 ? 'B+' : score >= 80 ? 'B' : score >= 75 ? 'C+' : score >= 70 ? 'C' : score >= 65 ? 'D+' : score >= 60 ? 'D' : 'F') : '-';
          return { name: student.name, score: score || '-', letter };
        })
        .sort((a, b) => a.name.localeCompare(b.name, 'ar'));
      
      return {
        title: selectedPaperExam.title,
        className: selectedPaperExam.classCode,
        data
      };
    }

    if (gradesClass && gradesSubject) {
      const data = gradesClassStudents
        .map(student => {
          const score = gradesMap[student.id] ?? '-';
          const letter = getGradeLetter(score);
          return { name: student.name, score, letter };
        })
        .sort((a, b) => a.name.localeCompare(b.name, 'ar'));
      
      return {
        title: gradesSubject,
        className: gradesClass,
        data
      };
    }

    return null;
  };

  const exportAsExcel = () => {
    const exportData = getExportData();
    if (!exportData) return showToast('❌ لا توجد بيانات للتصدير');

    const rows = [];
    exportData.data.forEach(item => {
      let scoreNum = Number(item.score);
      let isAbsent = isNaN(scoreNum) || item.score === '-';
      
      let percentage = isAbsent ? '---' : `${scoreNum}%`;
      let letter = isAbsent ? '---' : item.letter;
      let status = '---';

      if (!isAbsent) {
        if (scoreNum >= 95) status = 'ممتاز مرتفع';
        else if (scoreNum >= 90) status = 'ممتاز';
        else if (scoreNum >= 85) status = 'جيد جداً مرتفع';
        else if (scoreNum >= 80) status = 'جيد جداً';
        else if (scoreNum >= 75) status = 'جيد مرتفع';
        else if (scoreNum >= 70) status = 'جيد';
        else if (scoreNum >= 65) status = 'مقبول مرتفع';
        else if (scoreNum >= 60) status = 'مقبول';
        else status = 'راسب';
      }

      rows.push([item.name, isAbsent ? 'لم يحضر' : scoreNum, percentage, letter, status]);
    });

    const wsData = [
      ['اسم الطالب', 'الدرجة', 'النسبة المئوية', 'التقدير', 'حالة النجاح'],
      ...rows
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws['!cols'] = [{ wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 20 }];
    ws['!views'] = [{ rightToLeft: true }];
    if (!ws['!sheetViews']) ws['!sheetViews'] = [{ rightToLeft: true }];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'الدرجات');
    XLSX.writeFile(wb, `درجات_${exportData.title}_${exportData.className}.xlsx`);
    showToast('✅ تم تحميل ملف Excel بنجاح!');
  };

  const exportAsImage = () => {
    const exportData = getExportData();
    if (!exportData) return showToast('❌ لا توجد بيانات للتصدير');

    setTimeout(() => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      const padding = 40;
      const rowHeight = 50;
      const colWidths = [200, 100, 100];
      const totalWidth = colWidths.reduce((a, b) => a + b) + padding * 2;
      const totalHeight = (exportData.data.length + 2) * rowHeight + padding * 2;
      
      canvas.width = totalWidth;
      canvas.height = totalHeight;
      
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.font = 'bold 18px Arial, serif';
      ctx.fillStyle = '#333333';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      
      let y = padding + rowHeight / 2;
      
      ctx.fillStyle = '#1f2937';
      ctx.fillRect(padding, padding, totalWidth - padding * 2, rowHeight);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 18px Arial, serif';
      
      let x = totalWidth - padding - 20;
      ctx.fillText('التقدير', x, y);
      x -= colWidths[2];
      ctx.fillText('الدرجة', x, y);
      x -= colWidths[1];
      ctx.fillText('الاسم', x, y);
      
      y += rowHeight;
      
      ctx.fillStyle = '#333333';
      ctx.font = '16px Arial, serif';
      exportData.data.forEach((item, idx) => {
        if (idx % 2 === 0) {
          ctx.fillStyle = '#f3f4f6';
          ctx.fillRect(padding, y - rowHeight / 2, totalWidth - padding * 2, rowHeight);
        }
        
        ctx.fillStyle = '#333333';
        x = totalWidth - padding - 20;
        ctx.textAlign = 'right';
        ctx.fillText(String(item.letter), x, y);
        x -= colWidths[2];
        ctx.fillText(String(item.score), x, y);
        x -= colWidths[1];
        ctx.fillText(item.name, x, y);
        
        y += rowHeight;
      });
      
      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = image;
      link.download = `درجات_${exportData.title}_${exportData.className}.png`;
      link.click();
      showToast('✅ تم تحميل الصورة!');
    }, 100);
  };

  const generatePDFWithCanvas = async (htmlContent, fileName) => {
    showToast('⏳ جاري تجهيز ملف الـ PDF...');
    const container = document.createElement('div');
    container.innerHTML = htmlContent;
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.width = '1000px';
    container.style.backgroundColor = 'white';
    container.style.direction = 'rtl';
    container.dir = 'rtl';
    document.body.appendChild(container);

    await new Promise(r => setTimeout(r, 800));

    try {
      const canvas = await html2canvas(container, { scale: 2, useCORS: true, logging: false });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'px', [canvas.width / 2, canvas.height / 2]);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(fileName + '.pdf');
      showToast('✅ تم التصدير بنجاح');
    } catch (err) {
      console.error(err);
      showToast('❌ حدث خطأ أثناء تصدير الـ PDF');
    } finally {
      document.body.removeChild(container);
    }
  };

  const exportAsPDF = () => {
    const exportData = getExportData();
    if (!exportData) return showToast('❌ لا توجد بيانات للتصدير');

    let html = `
      <div style="padding: 40px; font-family: 'Tajawal', sans-serif, Arial; direction: rtl; background: white; color: #1f2937;">
        <div style="display: flex; align-items: center; justify-content: center; gap: 20px; margin-bottom: 30px; border-bottom: 2px solid #e5e7eb; padding-bottom: 20px;">
          <img src="${logoImage}" style="width: 80px; height: 80px; object-fit: contain; border-radius: 16px;" />
          <div style="text-align: right;">
            <h1 style="margin: 0; font-size: 28px; font-weight: 900; color: #111827;">مدارس الأوس الأهلية</h1>
            <p style="margin: 5px 0 0 0; font-size: 16px; color: #6b7280; font-weight: bold;">سجل درجات الاختبار</p>
          </div>
        </div>
        
        <h2 style="text-align: center; font-size: 24px; color: #111827; margin-bottom: 10px;">${exportData.title}</h2>
        <p style="text-align: center; color: #6b7280; margin-bottom: 30px; font-size: 18px; font-weight: bold;">الفصل: ${exportData.className}</p>
        
        <table style="width: 100%; border-collapse: collapse; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          <thead>
            <tr style="background-color: #1f2937; color: white;">
              <th style="padding: 16px; text-align: right; font-size: 18px;">اسم الطالب</th>
              <th style="padding: 16px; text-align: center; font-size: 18px;">الدرجة / 100</th>
              <th style="padding: 16px; text-align: center; font-size: 18px;">التقدير</th>
            </tr>
          </thead>
          <tbody>
    `;

    exportData.data.forEach((item, i) => {
      const bg = i % 2 === 0 ? '#ffffff' : '#f9fafb';
      html += `
          <tr style="background-color: ${bg}; border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 16px; font-size: 18px; font-weight: bold; color: #111827;">${item.name}</td>
            <td style="padding: 16px; text-align: center; font-size: 18px; font-weight: bold;">${item.score}</td>
            <td style="padding: 16px; text-align: center; font-size: 18px; font-weight: bold; color: #059669;">${item.letter}</td>
          </tr>
      `;
    });

    html += `
          </tbody>
        </table>
        
        <div style="text-align: center; margin-top: 40px; color: #9ca3af; font-size: 14px; font-weight: bold;">
          تم التصدير عبر نظام الأوس الذكي بتاريخ ${new Date().toLocaleDateString('ar-SA')}
        </div>
      </div>
    `;

    generatePDFWithCanvas(html, `سجل_درجات_${exportData.className}`);
    setShowExportModal(false);
  };

  const exportResultsAsPDF = () => {
    if (!selectedPaperExam) return showToast('❌ لا يوجد اختبار مفتوح');

    const exam = selectedPaperExam;
    const examDate = exam.date || exam.day || '-';
    const examTime = exam.time || '-';
    const className = exam.classCode || '-';

    const studentsData = [];
    paperExamGradingStudents.forEach(student => {
      let score = null;
      let isAbsent = false;

      if (exam.type === 'online') {
        for (const semester of ['الفصل الأول', 'الفصل الثاني', 'الفصل الثالث']) {
          const examKey = `${exam.classCode}__${exam.title}__${semester}`;
          if (realGrades[examKey]?.[student.id]) {
            score = realGrades[examKey][student.id];
            break;
          }
        }
      } else {
        const examKey = `${exam.id}__${exam.classCode}`;
        const paperGrade = savedPaperExamGrades[examKey]?.[student.id];
        if (paperGrade === 'absent') {
          isAbsent = true;
        } else if (paperGrade !== undefined && paperGrade !== null) {
          score = paperGrade;
        }
      }

      if (isAbsent || (score === null || score === undefined)) {
        studentsData.push({ name: student.name, score: null, letter: null, absent: true });
      } else {
        const n = Number(score);
        const letter = n >= 95 ? 'A+' : n >= 90 ? 'A' : n >= 85 ? 'B+' : n >= 80 ? 'B' : n >= 75 ? 'C+' : n >= 70 ? 'C' : n >= 65 ? 'D+' : n >= 60 ? 'D' : 'F';
        studentsData.push({ name: student.name, score, letter, absent: false });
      }
    });

    let html = `
      <div style="padding: 40px; font-family: 'Tajawal', sans-serif, Arial; direction: rtl; background: white; color: #1f2937;">
        
        <div style="display: flex; align-items: center; justify-content: center; gap: 20px; margin-bottom: 30px; border-bottom: 2px solid #e5e7eb; padding-bottom: 20px;">
          <img src="${logoImage}" style="width: 80px; height: 80px; object-fit: contain; border-radius: 16px;" />
          <div style="text-align: right;">
            <h1 style="margin: 0; font-size: 28px; font-weight: 900; color: #111827;">مدارس الأوس الأهلية</h1>
            <p style="margin: 5px 0 0 0; font-size: 16px; color: #6b7280; font-weight: bold;">النتائج الرسمية للاختبار</p>
          </div>
        </div>

        <div style="background: linear-gradient(135deg, #1e293b 0%, #334155 100%); color: white; padding: 24px; border-radius: 16px; margin-bottom: 30px; text-align: center;">
          <h2 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 900;">نتائج اختبار: ${exam.title}</h2>
          <div style="display: flex; justify-content: center; gap: 20px; font-size: 16px; font-weight: bold;">
            <span style="background: rgba(255,255,255,0.15); padding: 6px 20px; border-radius: 20px;">الفصل: ${className}</span>
            <span style="background: rgba(255,255,255,0.15); padding: 6px 20px; border-radius: 20px;">التاريخ: ${examDate}</span>
          </div>
        </div>
        
        <table style="width: 100%; border-collapse: collapse; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          <thead>
            <tr style="background-color: #1e293b; color: white;">
              <th style="padding: 16px; text-align: right; font-size: 18px; width: 50%;">اسم الطالب</th>
              <th style="padding: 16px; text-align: center; font-size: 18px; width: 25%;">الدرجة</th>
              <th style="padding: 16px; text-align: center; font-size: 18px; width: 25%;">التقدير</th>
            </tr>
          </thead>
          <tbody>
    `;

    studentsData.forEach((item, i) => {
      const bg = i % 2 === 0 ? '#ffffff' : '#f8fafc';
      if (item.absent) {
        html += `
            <tr style="background-color: ${bg}; border-bottom: 1px solid #e5e7eb;">
              <td style="padding: 16px; font-size: 18px; font-weight: 900; color: #1e293b;">${item.name}</td>
              <td colspan="2" style="padding: 16px; text-align: center; font-size: 18px; font-weight: 900; color: #dc2626;">لم يحضر</td>
            </tr>
        `;
      } else {
        const color = item.letter.startsWith('A') ? '#059669' : item.letter.startsWith('B') ? '#2563eb' : item.letter.startsWith('C') ? '#d97706' : item.letter.startsWith('D') ? '#ea580c' : '#dc2626';
        html += `
            <tr style="background-color: ${bg}; border-bottom: 1px solid #e5e7eb;">
              <td style="padding: 16px; font-size: 18px; font-weight: 900; color: #1e293b;">${item.name}</td>
              <td style="padding: 16px; text-align: center; font-size: 18px; font-weight: bold; color: #4b5563;">${item.score}</td>
              <td style="padding: 16px; text-align: center; font-size: 18px; font-weight: 900; color: ${color};">${item.letter}</td>
            </tr>
        `;
      }
    });

    html += `
          </tbody>
        </table>
        
        <div style="text-align: center; margin-top: 40px; color: #9ca3af; font-size: 14px; font-weight: bold;">
          تم التصدير عبر نظام الأوس الذكي بتاريخ ${new Date().toLocaleDateString('ar-SA')} - الساعة ${new Date().toLocaleTimeString('ar-SA')}
        </div>
      </div>
    `;
    generatePDFWithCanvas(html, `نتائج_اختبار_${exam.title}`);
    setShowResultsExportDropdown(false);
  };

  const exportResultsAsExcel = () => {
    if (!selectedPaperExam) return showToast('❌ لا يوجد اختبار مفتوح');

    const exam = selectedPaperExam;
    const className = exam.classCode || '-';

    const rows = [];
    paperExamGradingStudents.forEach(student => {
      let score = null;
      let isAbsent = false;

      if (exam.type === 'online') {
        for (const semester of ['الفصل الأول', 'الفصل الثاني', 'الفصل الثالث']) {
          const examKey = `${exam.classCode}__${exam.title}__${semester}`;
          if (realGrades[examKey]?.[student.id]) {
            score = realGrades[examKey][student.id];
            break;
          }
        }
      } else {
        const examKey = `${exam.id}__${exam.classCode}`;
        const paperGrade = savedPaperExamGrades[examKey]?.[student.id];
        if (paperGrade === 'absent') {
          isAbsent = true;
        } else if (paperGrade !== undefined && paperGrade !== null) {
          score = paperGrade;
        }
      }

      if (isAbsent || (score === null || score === undefined)) {
        rows.push([student.name, 'لم يحضر', '---', '---', '---']);
      } else {
        const n = Number(score);
        let status = '---';
        if (n >= 95) status = 'ممتاز مرتفع';
        else if (n >= 90) status = 'ممتاز';
        else if (n >= 85) status = 'جيد جداً مرتفع';
        else if (n >= 80) status = 'جيد جداً';
        else if (n >= 75) status = 'جيد مرتفع';
        else if (n >= 70) status = 'جيد';
        else if (n >= 65) status = 'مقبول مرتفع';
        else if (n >= 60) status = 'مقبول';
        else status = 'راسب';
        
        const letter = n >= 95 ? 'A+' : n >= 90 ? 'A' : n >= 85 ? 'B+' : n >= 80 ? 'B' : n >= 75 ? 'C+' : n >= 70 ? 'C' : n >= 65 ? 'D+' : n >= 60 ? 'D' : 'F';
        rows.push([student.name, `${n}`, `${n}%`, letter, status]);
      }
    });

    const wsData = [
      ['اسم الطالب', 'الدرجة', 'النسبة المئوية', 'التقدير', 'حالة النجاح'],
      ...rows
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);

    ws['!cols'] = [
      { wch: 30 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 20 },
    ];

    ws['!views'] = [{ rightToLeft: true }];
    if (!ws['!sheetViews']) ws['!sheetViews'] = [{ rightToLeft: true }];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'النتائج');

    XLSX.writeFile(wb, `نتائج_${exam.title}_${className}.xlsx`);
    showToast('✅ تم تحميل ملف Excel بنجاح!');
    setShowResultsExportDropdown(false);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (resultsExportRef.current && !resultsExportRef.current.contains(e.target)) {
        setShowResultsExportDropdown(false);
      }
    };
    if (showResultsExportDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showResultsExportDropdown]);

  const handleExportGrades = () => {
    setShowExportModal(true);
    
    if (selectedPaperExam && paperExamGradingMode === 'online' && myTests.find(t => t.id === selectedPaperExam.id)?.type === 'online') {
      const rows = [
        ['اسم الطالب', 'رقم الهوية', 'الدرجة / 100', 'التقدير']
      ];

      paperExamGradingStudents.forEach(student => {
        let score = null;
        for (const semester of ['الفصل الأول', 'الفصل الثاني', 'الفصل الثالث']) {
          const examKey = `${selectedPaperExam.classCode}__${selectedPaperExam.title}__${semester}`;
          if (realGrades[examKey]?.[student.id]) {
            score = realGrades[examKey][student.id];
            break;
          }
        }

        const letter = score ? (score >= 95 ? 'A+' : score >= 90 ? 'A' : score >= 85 ? 'B+' : score >= 80 ? 'B' : score >= 75 ? 'C+' : score >= 70 ? 'C' : score >= 65 ? 'D+' : score >= 60 ? 'D' : 'F') : '-';
        rows.push([student.name, student.id, score || '-', letter]);
      });

      const BOM = '\uFEFF';
      const csv = BOM + rows.map(row =>
        row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
      ).join('\n');

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `درجات_${selectedPaperExam.title}_${selectedPaperExam.classCode}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast('✅ تم تحميل الدرجات بنجاح!');
      return;
    }

    if (!gradesClass || !gradesSubject) return showToast('❌ يرجى تحديد الفصل والمادة أولاً');
    if (gradesClassStudents.length === 0) return showToast('❌ لا يوجد طلاب لتصديرهم');

    const rows = [
      ['اسم الطالب', 'رقم الهوية', 'المادة', 'الفصل الدراسي', 'الدرجة / 100', 'التقدير'],
      ...gradesClassStudents.map(student => {
        const score = gradesMap[student.id] ?? '';
        const letter = getGradeLetter(score);
        return [student.name, student.id, gradesSubject, gradesSemester, score, letter];
      })
    ];

    const BOM = '\uFEFF';
    const csv = BOM + rows.map(row =>
      row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ).join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `درجات_${gradesClass}_${gradesSubject}_${gradesSemester}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('✅ تم تصدير الدرجات بنجاح!');
  };


  const getGradeLetter = (score) => {
    if (score === '' || score === undefined || score === null) return '-';
    const n = Number(score);
    if (n >= 95) return 'A+';
    if (n >= 90) return 'A';
    if (n >= 85) return 'B+';
    if (n >= 80) return 'B';
    if (n >= 75) return 'C+';
    if (n >= 70) return 'C';
    if (n >= 65) return 'D+';
    if (n >= 60) return 'D';
    return 'F';
  };

  const markAllPresent = () => {
    const classStudents = students.filter(s => s.className === attendanceClass && (!s.createdAt || !attendanceDate || s.createdAt <= attendanceDate));
    const newMap = { ...attendanceMap };
    classStudents.forEach(student => {
      newMap[student.id] = true;
    });
    setAttendanceMap(newMap);
  };

  const performSubmitAttendance = () => {
    const attendanceHistory = attendance;
    const recordKey = `${attendanceClass}_${attendanceDate}`;
    const classStudents = students.filter(s => s.className === attendanceClass && (!s.createdAt || !attendanceDate || s.createdAt <= attendanceDate));

    const todayRecord = {};
    classStudents.forEach(s => {
      if (s.isExempted) {
        todayRecord[s.id] = ATTENDANCE_STATUS.EXEMPTED;
      } else {
        const isPres = attendanceMap[s.id] !== false && attendanceMap[s.id] !== 'ABSENT';
        todayRecord[s.id] = isPres ? ATTENDANCE_STATUS.PRESENT : ATTENDANCE_STATUS.ABSENT;
      }
    });
    attendanceHistory[recordKey] = todayRecord;
    setAttendance(attendanceHistory);

    // ًں”¥ نُبقي إحصائيات whitelist محدّثة (لأغراض العرض السريع) لكن محسوبة لحظياً من الدالة المركزية
    const refreshedStudents = students.map(s => {
      if (s.className !== attendanceClass) return s;
      const stat = calculateStudentAttendance(s.id);
      return { ...s, totalClasses: stat.total, attendedClasses: stat.present, attendancePercentage: stat.percentage };
    });
    setStudents(refreshedStudents);

    const wasGraceMode = !!gracePeriodMode;
    if (gracePeriodMode) {
      const updatedGraces = gracePeriods.map(g => g.id === gracePeriodMode ? { ...g, status: 'pending_admin' } : g);
      setGracePeriods(updatedGraces);
      setGracePeriodMode(null);
    }

    
    window.dispatchEvent(new CustomEvent('moo-sync'));
    showToast('✅ تم اعتماد الحضور بنجاح!');
    setActiveTab(wasGraceMode ? 'attendance' : 'schedule');
    setConfirmModalData(null);
    setAttendanceClass('');
  };


  const submitAttendance = () => {
    if (!attendanceClass) return window.dispatchEvent(new CustomEvent('moo-toast', { detail: { message: 'يرجى اختيار الفصل', type: 'error' } }));

    const attendanceHistory = attendance;
    const recordKey = `${attendanceClass}_${attendanceDate}`;
    if (attendanceHistory[recordKey]) {
      setConfirmModalData({
        title: 'تأكيد تحديث الغياب',
        message: `تم تسجيل حضور فصل "${attendanceClass}" بتاريخ ${attendanceDate} مسبقاً. هل تريد تحديثه وتعديله؟`,
        onConfirm: performSubmitAttendance
      });
      return;
    }
    performSubmitAttendance();
  };

  useEffect(() => {
    const updateData = () => {
      const fresh = getGlobalMaster();
      setMasterData(fresh);
      setGlobalSchedule(fresh.lessons || []);
      setNotifications(getTeacherNotifications(teacherProfile.name));
      try { setStaff(JSON.parse(localStorage.getItem('moo_staff') || '[]')); } catch { }
      try { setStudents(JSON.parse(localStorage.getItem('moo_whitelist') || '[]')); } catch { }
    };
    updateData();
    window.addEventListener('storage', updateData);
    window.addEventListener('moo-sync', updateData);
    return () => {
      window.removeEventListener('storage', updateData);
      window.removeEventListener('moo-sync', updateData);
    };
  }, [teacherProfile.name]);

  const handleRemoveSlot = (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه الحصة؟')) return;
    removeSlot(id);
    window.dispatchEvent(new CustomEvent('moo-sync'));
    showToast('🗑️ تم حذف الحصة');
  };

  const { GRID_DAYS, masterTimeSlots, getCellState, bookSlot, removeSlot, moveSlot } = useTeacherTable({ teacherProfile, globalSchedule, setGlobalSchedule, selectedClass: isExamScheduleOpen ? newTest.classCode : selectedClassForOverlay });
  const myLessons = globalSchedule.filter(l => l.instructor === teacherProfile.name && l.type !== 'break' && !l.isBreak);

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-main" dir="rtl">

      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: -40, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className="fixed top-6 left-1/2 z-[200] bg-gray-900 text-white px-8 py-4 rounded-full shadow-2xl flex items-center gap-3 text-sm font-bold"
          >
            {toastMsg}
          </motion.div>
        )}
      </AnimatePresence>

      <header className="bg-white border-b border-gray-200 px-8 py-4 flex justify-between items-center sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center text-white"><BookOpen size={20} /></div>
          <div>
            <h1 className="text-lg font-black text-gray-900">منصة المعلم</h1>
            <p className="text-[10px] text-gray-500 font-bold">{teacherProfile.name}</p>
          </div>
        </div>

        <nav className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-2xl overflow-x-auto whitespace-nowrap [&::-webkit-scrollbar]:hidden">
          <button onClick={() => setActiveTab('schedule')} className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${activeTab === 'schedule' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}>الجدول والحصص</button>
          <button onClick={() => setActiveTab('tests')} className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${activeTab === 'tests' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}>منظومة الاختبارات</button>
          <button onClick={() => setActiveTab('attendance')} className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${activeTab === 'attendance' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}>سجل الحضور</button>
          <button onClick={() => setActiveTab('grades')} className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${activeTab === 'grades' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}>سجل الدرجات</button>
          
          <button onClick={() => setActiveTab('swaps')} className={`relative px-4 py-2 rounded-xl font-bold text-sm transition-all ${activeTab === 'swaps' ? 'bg-white text-amber-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}>
            طلبات التبديل
            {notifications.filter(n => n.type === 'swap_request').length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">
                {notifications.filter(n => n.type === 'swap_request').length}
              </span>
            )}
          </button>
        </nav>
        <div className="flex items-center gap-6">
          <div className="relative">
            <button onClick={() => setShowNotifs(!showNotifs)} className="text-gray-600 hover:text-gray-900 mt-1">
              <Bell size={24} />
              {notifications.length > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 border-2 border-white rounded-full"></span>}
            </button>
            {showNotifs && (
              <div className="absolute left-0 mt-4 w-80 bg-white border border-gray-100 rounded-2xl shadow-2xl z-50 p-4">
                <h4 className="font-black text-gray-800 border-b pb-2 mb-3">طلبات تبديل الحصص</h4>
                {notifications.length === 0 ? <p className="text-gray-400 text-sm font-bold text-center py-4">لا توجد إشعارات حالياً.</p> : notifications.map(n => (
                  <div key={n.id} className="bg-gray-50 p-3 rounded-xl mb-2 border border-gray-100">
                    <p className="font-bold text-gray-700 text-xs leading-relaxed mb-3">{n.message}</p>
                    <div className="flex gap-2">
                      <button onClick={() => { executeSwap(n.id); setShowNotifs(false); }} className="flex-1 bg-green-500 text-white text-xs font-bold rounded-lg py-2 shadow-sm">موافقة</button>
                      <button onClick={() => { rejectSwap(n.id); setShowNotifs(false); }} className="flex-1 bg-red-500 text-white text-xs font-bold rounded-lg py-2 shadow-sm">رفض</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <button onClick={onLogout} className="flex items-center gap-2 bg-red-50 text-red-600 px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-red-100 transition-colors"><LogOut size={16} /> خروج</button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-8">

        <AnimatePresence>
          {announcements.filter(a => !hiddenAnnouncements.includes(a.id)).map(ann => (
            <motion.div
              key={ann.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95, height: 0, marginBottom: 0 }}
              className={`mb-6 p-4 sm:p-5 rounded-[32px] shadow-sm border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-300 ${ann.priority === 'high'
                ? 'bg-red-50/90 border-red-200 text-red-900 backdrop-blur-md'
                : 'bg-blue-50/90 border-blue-200 text-blue-900 backdrop-blur-md'
                }`}
            >
              <div className="flex items-start sm:items-center gap-4">
                <div className={`p-3.5 rounded-2xl shadow-inner shrink-0 ${ann.priority === 'high' ? 'bg-red-100' : 'bg-blue-100'}`}>
                  <Megaphone size={26} className={ann.priority === 'high' ? 'text-red-600 animate-pulse' : 'text-blue-600'} />
                </div>
                <div>
                  <p className="font-black text-sm mb-1">{ann.priority === 'high' ? 'تنبيه إداري عاجل:' : 'إعلان مدرسي هام:'}</p>
                  <p className="font-bold text-sm leading-relaxed opacity-90">{ann.text}</p>
                </div>
              </div>
              <button
                onClick={() => handleHideAnnouncement(ann.id)}
                className={`p-2.5 rounded-xl transition-colors self-end sm:self-auto shrink-0 ${ann.priority === 'high' ? 'bg-red-100/50 hover:bg-red-200 text-red-700' : 'bg-blue-100/50 hover:bg-blue-200 text-blue-700'}`}
                title="إخفاء التنبيه"
              >
                <X size={18} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {activeTab === 'schedule' && (
            <motion.div key="sc" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-right">
              <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 h-fit">
                <div className="bg-blue-50 p-4 rounded-2xl mb-6"><h3 className="font-black text-blue-900 flex items-center gap-2 mb-1"><Calendar size={20} /> عرض جدول الفصل</h3></div>
                <select value={selectedClassForOverlay} onChange={(e) => setSelectedClassForOverlay(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-4 text-sm font-bold mb-4 outline-none cursor-pointer">
                  <option value="">-- اختر الفصل --</option>
                  {adminClasses.map(cls => <option key={cls} value={cls}>{cls}</option>)}
                </select>
                <button onClick={() => selectedClassForOverlay && setIsTeacherOverlayOpen(true)} disabled={!selectedClassForOverlay} className={`w-full py-4 rounded-2xl font-black text-lg transition-all ${selectedClassForOverlay ? 'bg-gray-900 text-white shadow-xl hover:-translate-y-1' : 'bg-gray-200 text-gray-400'}`}>فتح الجدول التفاعلي</button>
              </div>
              <div className="lg:col-span-2 bg-white rounded-[32px] p-8 shadow-sm border border-gray-100">
                <h3 className="font-black text-gray-800 mb-6 flex items-center gap-2"><Clock size={20} /> الحصص المجدولة ({myLessons.length})</h3>
                {myLessons.length === 0 ? <p className="text-gray-400 font-bold text-center py-10 border-2 border-dashed rounded-2xl">لا توجد حصص مسجلة باسمك حالياً.</p> : (
                  <div className="space-y-3">
                    {myLessons.map(l => (
                      <div key={l.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                        <div className="flex gap-4 items-center">
                          <div className="bg-white px-4 py-2 rounded-xl text-center shadow-sm border border-gray-100"><p className="font-black text-xs text-gray-900">{l.day}</p><p className="text-[10px] text-gray-400 font-mono mt-1">{l.time}</p></div>
                          <div>
                            <p className="font-black text-gray-800 flex items-center gap-2">
                              {l.subject}
                              {l.type === 'exam' && <span className="bg-red-100 text-red-600 px-2 py-0.5 rounded-md text-[10px] font-bold">اختبار</span>}
                            </p>
                            <p className="text-xs text-blue-600 font-bold mt-1">{l.stage || l.classCode}</p>
                          </div>
                        </div>
                        <button onClick={() => handleRemoveSlot(l.id)} className="p-3 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-xl transition-colors"><Trash2 size={20} /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'tests' && (
            <motion.div key="ts" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-right">
              <div className="mb-8">
                <h3 className="text-3xl font-black text-gray-900 flex items-center gap-3"><FileText className="text-blue-600" /> منظومة الاختبارات الذكية</h3>
              </div>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                <div className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm">
                  <h4 className="font-black text-gray-800 mb-6 flex items-center gap-2"><Edit2 size={20} className="text-blue-500" /> {newTest.id ? 'تعديل الاختبار الحالي' : 'إعداد بيانات الاختبار الجديد'}</h4>

                  <div className="space-y-4 mb-8 bg-blue-50/50 p-6 rounded-3xl border border-blue-100">
                    <input placeholder="عنوان الاختبار (مثل: اختبار الشهر الأول)" value={newTest.title} onChange={e => setNewTest({ ...newTest, title: e.target.value })} className="w-full bg-white border border-gray-200 rounded-2xl px-5 py-4 font-bold text-sm outline-none focus:border-blue-500" />

                    <select value={newTest.classCode} onChange={e => setNewTest({ ...newTest, classCode: e.target.value })} className="w-full bg-white border border-gray-200 rounded-2xl px-5 py-4 font-bold text-sm outline-none focus:border-blue-500">
                      <option value="">-- اختر الفصل المستهدف --</option>
                      {adminClasses.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>

                    <div className="flex gap-2 bg-white p-2 rounded-2xl border border-gray-200">
                      <button onClick={() => setExamTimingMode('schedule')} className={`flex-1 py-3 rounded-xl font-bold text-xs transition-all ${examMode === 'schedule' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>ضمن الجدول الدراسي</button>
                      <button onClick={() => setExamTimingMode('evening')} className={`flex-1 py-3 rounded-xl font-bold text-xs transition-all ${examMode === 'evening' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>اختبار حر / مسائي</button>
                    </div>

                    {examMode === 'schedule' ? (
                      <div className="bg-white p-5 rounded-2xl border border-blue-100 shadow-inner">
                        <p className="text-xs text-gray-500 font-bold mb-3">سيتم ربط الاختبار بوقت حصة فعلية في الجدول، وتأخذ نفس مدتها.</p>
                        <button onClick={() => { if (!newTest.classCode) return showToast('اختر الفصل أولاً'); setIsExamScheduleOpen(true); }} className="w-full bg-blue-50 text-blue-600 border border-blue-200 py-3 rounded-xl font-black flex justify-center gap-2 hover:bg-blue-100 transition-colors">
                          <Calendar size={18} /> {newTest.time ? `تم التحديد: يوم ${newTest.day} الساعة ${newTest.time}` : 'افتح الجدول لتحديد الحصة'}
                        </button>
                        <div className="mt-3 flex gap-2">
                          <select value={newTest.type} onChange={e => setNewTest({ ...newTest, type: e.target.value })} className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-bold text-xs outline-none">
                            <option value="online">إلكتروني (عبر المنصة)</option>
                            <option value="paper">ورقي (في الفصل)</option>
                          </select>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-white p-5 rounded-2xl border border-indigo-100 shadow-inner grid grid-cols-2 gap-3">
                        <div className="col-span-2">
                          <p className="text-xs text-indigo-500 font-bold mb-3">يُعقد هذا الاختبار (أونلاين) خارج أوقات الحصص الرسمية.</p>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-gray-400 block mb-1">تاريخ الاختبار</label>
                          <input type="date" value={newTest.date} onChange={e => setNewTest({ ...newTest, date: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-bold text-xs outline-none" />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-gray-400 block mb-1">وقت البدء</label>
                          <input type="time" value={newTest.time} onChange={e => setNewTest({ ...newTest, time: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-bold text-xs outline-none" />
                        </div>
                        <div className="col-span-2">
                          <label className="text-[10px] font-bold text-gray-400 block mb-1">المدة (بالدقائق)</label>
                          <input type="number" placeholder="مثال: 120" value={newTest.duration} onChange={e => setNewTest({ ...newTest, duration: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-bold text-xs outline-none" />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-gray-100 pt-6">
                    <div className="flex justify-between items-center mb-4">
                      <h5 className="font-black text-gray-700 text-sm">أسئلة الاختبار ({questions.length})</h5>
                      <button onClick={() => setShowBank(!showBank)} className="bg-white border border-gray-200 px-4 py-2 rounded-xl text-xs font-bold text-blue-600 shadow-sm flex items-center gap-1 hover:bg-blue-50"><Search size={14} /> بنك الأسئلة</button>
                    </div>
                    {showBank && (
                      <div className="bg-gray-100 p-4 rounded-2xl mb-4 max-h-60 overflow-auto border border-gray-200">
                        {questionBank.filter(qb => qb.classCode === newTest.classCode || !qb.classCode).length === 0 ? <p className="text-xs text-gray-400">البنك فارغ لهذا الفصل.</p> : questionBank.filter(qb => qb.classCode === newTest.classCode || !qb.classCode).map((qb, i) => (
                          <div key={i} className="bg-white p-3 rounded-xl mb-2 flex justify-between items-center shadow-sm">
                            <p className="text-sm font-bold truncate max-w-[200px]">{qb.text}</p>
                            <button onClick={() => addFromBank(qb)} className="text-blue-600 bg-blue-50 px-3 py-1 rounded-lg text-xs font-bold">+ إضافة</button>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="bg-gray-50 p-5 rounded-3xl border border-gray-200 mb-6 shadow-inner">
                      <input placeholder="نص السؤال..." value={currentQ.text} onChange={e => setCurrentQ({ ...currentQ, text: e.target.value })} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 font-bold text-sm mb-4 outline-none focus:border-blue-500" />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                        {[1, 2, 3, 4].map(num => (
                          <div key={num} className={`flex items-center bg-white border rounded-xl px-3 py-2 ${currentQ.correctOpt === String(num) ? 'border-green-500 ring-1 ring-green-200' : 'border-gray-200'}`}>
                            <input type="radio" name="correct" value={String(num)} checked={currentQ.correctOpt === String(num)} onChange={e => setCurrentQ({ ...currentQ, correctOpt: e.target.value })} className="ml-2 w-4 h-4" />
                            <input placeholder={`الخيار ${num}`} value={currentQ[`opt${num}`]} onChange={e => setCurrentQ({ ...currentQ, [`opt${num}`]: e.target.value })} className="w-full text-xs font-bold outline-none bg-transparent" />
                          </div>
                        ))}
                      </div>
                      <button onClick={handleSaveQuestion} className={`w-full font-bold py-3 rounded-xl text-sm ${currentQ.id ? 'bg-orange-500 hover:bg-orange-600 text-white' : 'bg-gray-900 hover:bg-gray-800 text-white'}`}>{currentQ.id ? 'حفظ التعديل' : '+ إضافة السؤال'}</button>
                    </div>
                    {questions.length > 0 && (
                      <div className="space-y-2 mb-6 max-h-48 overflow-auto pr-2">
                        {questions.map((q, idx) => (
                          <div key={q.id} className="bg-white p-3 rounded-xl border border-gray-100 flex justify-between items-center shadow-sm">
                            <div className="flex items-center gap-2"><span className="bg-blue-100 text-blue-700 w-6 h-6 flex items-center justify-center rounded-full text-xs font-black">{idx + 1}</span><p className="font-bold text-sm text-gray-800 truncate max-w-[150px]">{q.text}</p></div>
                            <div className="flex gap-2">
                              <button onClick={() => handleEditQuestion(q)} className="text-orange-500 bg-orange-50 p-1.5 rounded-lg"><Edit2 size={14} /></button>
                              <button onClick={() => handleDeleteQuestion(q.id)} className="text-red-500 bg-red-50 p-1.5 rounded-lg"><Trash2 size={14} /></button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    <button onClick={handleSaveTest} className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg"><Save size={20} /> {newTest.id ? 'تحديث بيانات الاختبار' : 'حفظ واعتماد الاختبار'}</button>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-[32px] p-8 border border-gray-200">
                  <h4 className="font-black text-gray-800 mb-6 flex items-center gap-2"><CheckCircle2 size={20} className="text-green-500" /> الاختبارات المُصدرة</h4>
                  {myTests.length === 0 ? (
                    <div className="py-16 text-center border-2 border-dashed border-gray-200 rounded-2xl">
                      <FileText size={32} className="text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-400 font-bold">لا توجد اختبارات مُنشأة بعد</p>
                    </div>
                  ) : myTests.map(t => (
                    <div key={t.id} className="bg-white p-5 border border-gray-100 rounded-2xl flex justify-between items-center shadow-sm mb-4">
                      <div>
                        <p className="font-black text-lg text-gray-900">{t.title}</p>
                        <p className="text-[11px] font-bold text-gray-500 mt-1">الفصل: {t.classCode} | المدة: {t.duration} د</p>
                        <div className="flex gap-2 mt-2">
                          <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded-md">{t.date ? t.date : `يوم ${t.day}`} - {t.time}</span>
                          <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${t.type !== 'paper' ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-600'}`}>
                            {t.type !== 'paper' ? 'إلكتروني' : 'ورقي'}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        {!isTestStarted(t) && (
                          <button onClick={() => handleEditTest(t)} className="bg-orange-50 text-orange-600 px-4 py-2 rounded-xl text-xs font-black"><Edit2 size={12} /> تعديل</button>
                        )}
                        <button onClick={() => handleDeleteTest(t.id)} className="bg-red-50 text-red-500 px-4 py-2 rounded-xl text-xs font-black"><Trash2 size={12} /> حذف</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'attendance' && (
            <motion.div key="at" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-[40px] p-10 border border-gray-100 shadow-sm text-right">
              <div className="mb-10"><h3 className="text-3xl font-black text-gray-900 flex items-center gap-3 mb-2"><Users className="text-green-600" /> سجل الحضور التفاعلي</h3></div>

              {/* حصص المعلم اليوم */}
              {(() => {
                const currentDay = getCurrentDayNameArabic();
                const todayLessons = myLessons.filter(l => l.day === currentDay);
                const attendanceHistory = attendance;
                const nowTime = new Date();

                if (todayLessons.length === 0) {
                  return (
                    <div className="mb-10 bg-gray-50 border border-gray-200 rounded-[32px] p-10 text-center">
                      <Calendar size={48} className="text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 font-black text-xl">ليس لديك حصص مجدولة لهذا اليوم ({currentDay}).</p>
                      <p className="text-gray-400 font-bold text-sm mt-2">نظام التحضير يعمل بناءً على الجدول الفعلي فقط لضمان دقة البيانات.</p>
                    </div>
                  );
                }

                return (
                  <div className="mb-10 bg-gray-50 p-8 rounded-[32px] border border-gray-100">
                    <h4 className="text-sm font-black text-gray-500 mb-6 flex items-center gap-2">
                      <Calendar size={18} /> حصصك المجدولة لليوم ({currentDay}):
                    </h4>
                    <div className="flex flex-wrap gap-4">
                      {todayLessons.map((lesson, idx) => {
                        const classCode = lesson.classCode || lesson.stage;
                        if (!classCode) return null; // Avoid empty classes
                        const isTaken = !!attendanceHistory[`${classCode}_${attendanceDate}`];
                        const lessonTime = parseTime(lesson.time);
                        const hasStarted = lessonTime ? nowTime >= lessonTime : true;

                        let cardClass = "";
                        let onClickHandler = null;

                        if (isTaken) {
                           cardClass = "bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100";
                           onClickHandler = () => {
                             setConfirmModalData({
                               title: 'تعديل السجل',
                               message: `تم أخذ الغياب لـ ${classCode} اليوم، هل تريد عرض وتعديل السجل؟`,
                               onConfirm: () => {
                                 setAttendanceClass(classCode);
                                 setConfirmModalData(null);
                               }
                             });
                           };
                        } else if (hasStarted) {
                           cardClass = "bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100 shadow-[0_4px_15px_rgba(245,158,11,0.1)]";
                           onClickHandler = () => setAttendanceClass(classCode);
                        } else {
                           cardClass = "bg-gray-100 border-gray-200 text-gray-400 opacity-60 cursor-not-allowed grayscale";
                           onClickHandler = () => showToast(`لم يحن وقت الحصة بعد! (تبدأ ${lesson.time})`);
                        }

                        return (
                          <button key={idx} onClick={onClickHandler} className={`border-2 px-6 py-5 rounded-2xl text-sm font-black transition-all flex flex-col gap-2 items-start w-52 text-right ${cardClass}`}>
                            <span className="text-xl">{classCode}</span>
                            <div className="flex items-center gap-2 text-xs opacity-80 mt-1">
                              <Clock size={12} />
                              {lesson.time}
                            </div>
                            <div className="text-[11px] mt-2 font-bold bg-white/50 px-2 py-1 rounded w-full text-center">
                              {isTaken ? '✅ تم التحضير' : hasStarted ? '⏳ بانتظار الغياب' : (
                                <div className="flex items-center gap-1 justify-center text-gray-500">
                                  <Lock size={10} />
                                  <LiveCountdown targetTime={lessonTime} />
                                </div>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              
              {(() => {
                const myGracePeriods = gracePeriods.filter(g => g.teacher === teacherProfile.name && (!g.status || g.status === 'pending_teacher'));
                if (myGracePeriods.length > 0) {
                  return (
                    <div className="mb-10 bg-gradient-to-br from-purple-50 to-white p-8 rounded-[32px] border border-purple-100 shadow-sm">
                      <h4 className="text-lg font-black text-purple-900 mb-6 flex items-center gap-2">
                        <AlertCircle size={24} className="text-purple-600" /> المهام المعلقة (نسيان الغياب):
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {myGracePeriods.map((grace, idx) => (
                          <button key={idx} onClick={() => {
                            setGracePeriodMode(grace.id);
                            setAttendanceClass(grace.classCode);
                            setAttendanceDate(grace.date);
                          }} className="bg-white border border-purple-200 hover:border-purple-400 hover:shadow-xl hover:-translate-y-1 p-6 rounded-[24px] text-right transition-all flex flex-col group">
                            <div className="flex justify-between items-center w-full mb-4">
                              <span className="text-2xl font-black text-purple-900">{grace.classCode}</span>
                              <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-bold">مهمة عاجلة</span>
                            </div>
                            <p className="text-gray-600 font-bold text-sm mb-6 flex items-center gap-2"><Calendar size={16} /> غياب منسي: <span className="text-gray-900">{grace.date}</span></p>
                            <div className="mt-auto flex items-center gap-2 text-purple-600 font-black text-sm group-hover:gap-3 transition-all">
                              <span>بدء عملية الرصد</span> <ArrowLeft size={16} />
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                }
                return null;
              })()}

              {attendanceClass && (
                <div>
                  {students.filter(s => s.className === attendanceClass && (!s.createdAt || !attendanceDate || s.createdAt <= attendanceDate)).length === 0 ? (
                    <div className="py-20 text-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                      <Users size={40} className="text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-400 font-black text-lg">لا يوجد طلاب مسجلون في هذا الفصل</p>
                      <p className="text-gray-400 text-sm mt-2 font-bold mb-8">يرجى مراجعة المسؤول لإضافة الطلاب.</p>
                      <button onClick={submitAttendance} className="bg-gray-900 text-white px-8 py-3 rounded-2xl font-black text-md shadow-xl hover:bg-gray-800 hover:-translate-y-1 transition-all inline-flex items-center justify-center gap-2">
                        <CheckCircle2 size={20} /> إرسال المهام (فصل فارغ)
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-10">
                        {students.filter(s => s.className === attendanceClass && (!s.createdAt || !attendanceDate || s.createdAt <= attendanceDate)).map(student => {
                          const isPresent = attendanceMap[student.id] !== false && attendanceMap[student.id] !== 'ABSENT';
                          return (
                            <button key={student.id} onClick={() => toggleStudentAttendance(student.id)} className={`relative p-5 rounded-[24px] border-2 transition-all duration-300 hover:-translate-y-1 ${isPresent ? 'bg-green-50 border-green-400 shadow-[0_8px_20px_rgba(74,222,128,0.15)] text-green-900' : 'bg-red-50 border-red-500 shadow-[0_8px_20px_rgba(248,113,113,0.2)] text-red-900'}`}>
                              <div className={`absolute top-3 left-3 w-3 h-3 rounded-full ${isPresent ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                              <Users size={32} className={`mx-auto mb-3 ${isPresent ? 'text-green-400' : 'text-red-400'}`} />
                              <p className="font-black text-sm truncate w-full text-center">{student.name}</p>
                              <p className={`text-xs font-bold text-center mt-2 ${isPresent ? 'text-green-600' : 'text-red-600'}`}>{isPresent ? '✅ حاضر' : '❌ غائب'}</p>
                            </button>
                          );
                        })}
                      </div>
                      <div className="border-t border-gray-100 pt-8 flex flex-col sm:flex-row justify-end items-center gap-4">
                        <button onClick={markAllPresent} className="bg-emerald-50 text-emerald-700 border-2 border-emerald-200 px-8 py-4 rounded-2xl font-black text-lg hover:bg-emerald-100 hover:-translate-y-1 transition-all w-full sm:w-auto">
                          ✅ حضور الكل
                        </button>
                        <button onClick={submitAttendance} className="bg-gray-900 text-white px-10 py-4 rounded-2xl font-black text-lg shadow-xl hover:bg-gray-800 hover:-translate-y-1 transition-all flex items-center justify-center gap-2 w-full sm:w-auto">
                          <CheckCircle2 size={24} /> إرسال واعتماد الحضور
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'grades' && (
            <motion.div key="gr" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-[40px] p-10 border border-gray-100 shadow-sm text-right">
              <div className="mb-10">
                <h3 className="text-3xl font-black text-gray-900 flex items-center gap-3 mb-2">
                  <BarChart2 className="text-emerald-600" /> إدخال الدرجات
                </h3>
                <p className="text-sm text-gray-400 font-bold">أدخل درجات الطلاب — اختر نوع الاختبار (ورقي أو أونلاين)</p>
              </div>

              {/* 🔥 الفلتر الموحد - فصل واحد فقط */}
              <div className="flex gap-4 mb-8 bg-gray-50 p-6 rounded-[32px] border border-gray-100">
                <div className="w-full md:w-80">
                  <label className="text-xs font-black text-gray-500 mb-2 block">اختر الفصل:</label>
                  <select value={gradesClass} onChange={e => setGradesClass(e.target.value)} className="w-full bg-white border border-gray-200 rounded-2xl px-5 py-4 font-bold text-sm outline-none shadow-sm focus:ring-2 focus:ring-emerald-500">
                    <option value="">-- اختر الفصل --</option>
                    {adminClasses.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              {/* 🔥 التبويبات - اختيار نوع الدرجات */}
              {gradesClass && (
                <div className="flex gap-2 mb-10 bg-white p-2 rounded-2xl border border-gray-200">
                  <button
                    onClick={() => setPaperExamGradingMode('paper')}
                    className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${
                      paperExamGradingMode === 'paper'
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    📄 الاختبارات الورقية
                  </button>
                  <button
                    onClick={() => setPaperExamGradingMode('online')}
                    className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${
                      paperExamGradingMode === 'online'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    ✅ الاختبارات الأونلاين
                  </button>
                </div>
              )}

              {/*  قسم درجات الاختبارات الورقية - محسّن */}
              {paperExamGradingMode === 'paper' && gradesClass && (
                <div>
                  {/* البحث عن اختبار */}
                  <div className="mb-8">
                    <input
                      type="text"
                      placeholder="🔍 ابحث عن اختبار..."
                      className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 font-bold text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  {/* عرض الاختبارات الورقية كبطاقات */}
                  <div className="mb-8">
                    <label className="text-xs font-black text-gray-600 mb-3 block">اختر الاختبار:</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {availablePaperExams.length > 0 ? (
                        availablePaperExams.map(exam => {
                          const isSubmitted = !!savedPaperExamGrades[`${exam.id}__${exam.classCode}`];
                          return (
                            <div
                              key={exam.id}
                              className={`p-5 rounded-2xl border-2 transition-all text-left relative ${
                                isSubmitted
                                  ? 'bg-orange-50 border-orange-400'
                                  : selectedPaperExam?.id === exam.id
                                  ? 'bg-emerald-50 border-emerald-500 shadow-lg'
                                  : 'bg-white border-gray-200 hover:border-emerald-300'
                              }`}
                            >
                              <div className="flex justify-between items-start mb-2">
                                <p className="font-black text-gray-900 text-lg">{exam.title}</p>
                                <span className={`px-3 py-1 rounded-lg text-xs font-black ${isSubmitted ? 'bg-orange-100 text-orange-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                  📝 ورقي
                                </span>
                              </div>
                              <p className="text-sm text-gray-500 mb-1">📚 الفصل: {exam.classCode}</p>
                              <p className="text-sm text-gray-400">🕐 {exam.day || exam.date} - {exam.time}</p>
                              
                              {isSubmitted ? (
                                <div className="mt-3 pt-3 border-t border-orange-200 flex flex-col gap-2">
                                  <p className="text-xs font-bold text-orange-600 mb-1 text-center">✅ تم ارسال النتائج</p>
                                  <div className="flex gap-2">
                                    <button
                                      onClick={(e) => { e.stopPropagation(); handleSelectPaperExam(exam); }}
                                      className="flex-1 text-xs bg-white border border-orange-200 text-orange-600 py-2 rounded-lg font-bold hover:bg-orange-100"
                                    >
                                      ✏️ تعديل النتائج
                                    </button>
                                    <div className="flex-1 relative" ref={resultsExportRef}>
                                      <button
                                        onClick={(e) => { 
                                          e.stopPropagation(); 
                                          setSelectedPaperExam(exam);
                                          setShowResultsExportDropdown(prev => !prev);
                                        }}
                                        className="w-full text-xs bg-orange-600 text-white py-2 rounded-lg font-bold hover:bg-orange-700"
                                      >
                                        تصدير النتائج ▾
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <button
                                  onClick={() => handleSelectPaperExam(exam)}
                                  className="w-full mt-3 pt-3 border-t border-gray-100 text-xs font-bold text-emerald-600 hover:text-emerald-700 text-right"
                                >
                                  👆 اضغط لإدخال الدرجات
                                </button>
                              )}
                            </div>
                          );
                        })
                      ) : (
                        <div className="col-span-3 text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                          <FileText size={40} className="text-gray-300 mx-auto mb-3" />
                          <p className="text-gray-400 font-bold">لا توجد اختبارات في هذا الفصل</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* جزء إدخال الدرجات */}
                  {selectedPaperExam && (
                    <div className="bg-emerald-50 p-8 rounded-3xl border-2 border-emerald-200 mb-8">
                      <h4 className="text-2xl font-black text-gray-900 mb-6">📊 إدخال درجات: {selectedPaperExam.title}</h4>

                      {/* نمط الإدخال - جدول أو كروت */}
                      <div className="mb-8">
                        <div className="flex gap-4 mb-8">
                          <button
                            onClick={() => setPaperExamEntryMode('table')}
                            className={`flex-1 py-4 rounded-2xl font-black text-lg transition-all ${
                              paperExamEntryMode === 'table'
                                ? 'bg-emerald-600 text-white shadow-lg'
                                : 'bg-white text-gray-600 hover:bg-gray-100'
                            }`}
                          >
                            📊 جدول
                          </button>
                          <button
                            onClick={() => setPaperExamEntryMode('cards')}
                            className={`flex-1 py-4 rounded-2xl font-black text-lg transition-all ${
                              paperExamEntryMode === 'cards'
                                ? 'bg-blue-600 text-white shadow-lg'
                                : 'bg-white text-gray-600 hover:bg-gray-100'
                            }`}
                          >
                            🎯 بطاقات
                          </button>
                        </div>

                        {/* نمط الجدول */}
                        {paperExamEntryMode === 'table' && (
                          <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="bg-gray-50 border-b border-gray-100">
                                    <th className="text-right px-6 py-4 font-black text-gray-600 text-xs uppercase tracking-wider">اسم الطالب</th>
                                    <th className="text-right px-6 py-4 font-black text-gray-600 text-xs uppercase tracking-wider">رقم الهوية</th>
                                    <th className="text-center px-6 py-4 font-black text-gray-600 text-xs uppercase tracking-wider">الحالة</th>
                                    <th className="text-center px-6 py-4 font-black text-gray-600 text-xs uppercase tracking-wider">الدرجة</th>
                                  </tr>
                                </thead>
                                <tbody>
                                    {paperExamGradingStudents.map((student, idx) => {
                                      const status = paperExamStatuses[student.id] || 'present';
                                      const currentGrade = paperExamGrades[student.id] || '';
                                      const n = Number(currentGrade);
                                      const letter = currentGrade === '' ? '-' : n >= 95 ? 'A+' : n >= 90 ? 'A' : n >= 85 ? 'B+' : n >= 80 ? 'B' : n >= 75 ? 'C+' : n >= 70 ? 'C' : n >= 65 ? 'D+' : n >= 60 ? 'D' : 'F';
                                      
                                      return (
                                        <tr key={student.id} className={`border-b border-gray-50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                                          <td className="px-6 py-4 font-bold text-gray-800">{student.name}</td>
                                          <td className="px-6 py-4 text-xs text-gray-400 font-mono">{student.id}</td>
                                          <td className="px-6 py-4 text-center">
                                            <button
                                              onClick={() => handleToggleStudentStatus(student.id)}
                                              className={`px-4 py-1.5 rounded-lg font-bold text-xs transition-all ${
                                                status === 'absent'
                                                  ? 'bg-red-100 text-red-700 shadow-md'
                                                  : 'bg-emerald-100 text-emerald-700 shadow-md'
                                              }`}
                                            >
                                              {status === 'absent' ? '❌ لم يحضر' : '✅ حاضر'}
                                            </button>
                                          </td>
                                          <td className="px-6 py-4 text-center">
                                            {status === 'present' ? (
                                              <div className="flex items-center justify-center gap-3">
                                                <input
                                                  type="number"
                                                  min="0"
                                                  max="100"
                                                  placeholder="0"
                                                  value={currentGrade}
                                                  onChange={e => handleSetCustomGrade(student.id, Math.min(100, Math.max(0, Number(e.target.value) || 0)))}
                                                  className="w-20 text-center border border-gray-200 rounded-lg px-3 py-2 font-bold text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                                                />
                                                <span className={`inline-block px-3 py-1 rounded-xl text-xs font-black ${
                                                  letter === '-' ? 'bg-gray-100 text-gray-400' :
                                                  letter === 'F' ? 'bg-red-50 text-red-600' :
                                                  letter.startsWith('A') ? 'bg-emerald-50 text-emerald-700' :
                                                  letter.startsWith('B') ? 'bg-blue-50 text-blue-700' :
                                                  letter.startsWith('C') ? 'bg-amber-50 text-amber-700' :
                                                  'bg-orange-50 text-orange-700'
                                                }`}>
                                                  {letter}
                                                </span>
                                              </div>
                                            ) : (
                                              <span className="text-gray-400 font-bold">-</span>
                                            )}
                                          </td>
                                        </tr>
                                      );
                                    })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}

                        {/* نمط الكروت */}
                        {paperExamEntryMode === 'cards' && (
                          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {paperExamGradingStudents.map(student => {
                              const status = paperExamStatuses[student.id] || 'pass';
                              const isPass = status === 'pass';
                              const isFail = status === 'fail';
                              const isCustom = status === 'custom';
                              
                              return (
                                <button
                                  key={student.id}
                                  onClick={() => handleToggleStudentStatus(student.id)}
                                  className={`relative p-4 rounded-2xl border-2 transition-all duration-300 hover:scale-105 ${
                                    isPass
                                      ? 'bg-emerald-50 border-emerald-400 shadow-[0_8px_20px_rgba(74,222,128,0.2)]'
                                      : isFail
                                      ? 'bg-red-50 border-red-500 shadow-[0_8px_20px_rgba(248,113,113,0.2)]'
                                      : 'bg-orange-50 border-orange-500 shadow-[0_8px_20px_rgba(251,146,60,0.2)]'
                                  }`}
                                >
                                  <div className={`absolute top-2 left-2 w-3 h-3 rounded-full ${isPass ? 'bg-emerald-500' : isFail ? 'bg-red-500' : 'bg-orange-500'} animate-pulse`}></div>
                                  <Users size={28} className={`mx-auto mb-2 ${isPass ? 'text-emerald-400' : isFail ? 'text-red-400' : 'text-orange-400'}`} />
                                  <p className="font-bold text-sm truncate text-center text-gray-900">{student.name}</p>
                                  <p className={`text-xs font-bold text-center mt-2 ${isPass ? 'text-emerald-600' : isFail ? 'text-red-600' : 'text-orange-600'}`}>
                                    {isPass ? '✅ ناجح' : isFail ? '❌ راسب' : '✏️ درجة'}
                                  </p>
                                  {isCustom && (
                                    <input
                                      type="number"
                                      min="0"
                                      max="100"
                                      placeholder="0-100"
                                      value={paperExamGrades[student.id] || ''}
                                      onChange={(e) => {
                                        e.stopPropagation();
                                        handleSetCustomGrade(student.id, Math.min(100, Math.max(0, Number(e.target.value) || 0)));
                                      }}
                                      onClick={(e) => e.stopPropagation()}
                                      className="w-full text-center border border-orange-300 rounded-lg px-2 py-1 font-bold text-xs mt-2 outline-none focus:ring-2 focus:ring-orange-400"
                                    />
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* زر إرسال الدرجات + تحميل */}
                      <div className="flex justify-end gap-3 flex-wrap">
                        <button
                          onClick={() => setSelectedPaperExam(null)}
                          className="px-8 py-3 bg-white border border-gray-200 rounded-2xl font-black text-lg shadow-sm hover:bg-gray-50"
                        >
                          إلغاء
                        </button>
                        <button
                          onClick={() => setShowExportModal(true)}
                          className="flex items-center gap-3 bg-blue-600 text-white px-8 py-3 rounded-2xl font-black text-lg shadow-xl hover:bg-blue-700 transition-all"
                          title="تحميل الدرجات كصورة أو PDF أو Excel"
                        >
                          <Download size={20} /> تحميل الدرجات
                        </button>
                        <button
                          onClick={() => setShowConfirmationModal(true)}
                          className="flex items-center gap-3 bg-emerald-600 text-white px-10 py-3 rounded-2xl font-black text-lg shadow-xl hover:bg-emerald-700 transition-all"
                        >
                          <CheckCircle2 size={24} /> إرسال الدرجات
                        </button>
                      </div>

                      {/* 🔥 Modal تحميل الدرجات - 3 خيارات */}
                      <AnimatePresence>
                        {showExportModal && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
                            onClick={() => setShowExportModal(false)}
                          >
                            <motion.div
                              initial={{ scale: 0.8, opacity: 0, y: 20 }}
                              animate={{ scale: 1, opacity: 1, y: 0 }}
                              exit={{ scale: 0.8, opacity: 0, y: 20 }}
                              className="bg-white rounded-3xl p-8 shadow-2xl max-w-2xl w-full mx-4"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <h3 className="text-2xl font-black text-gray-900 mb-2">تحميل درجات الاختبار</h3>
                              <p className="text-gray-500 font-bold mb-6">اختر صيغة التحميل المفضلة:</p>
                              
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                {/* الخيار 1: صورة */}
                                <button
                                  onClick={() => { exportAsImage(); setShowExportModal(false); }}
                                  className="p-6 rounded-2xl border-2 border-blue-200 bg-blue-50 hover:bg-blue-100 hover:border-blue-400 transition-all group"
                                >
                                  <div className="text-4xl mb-3">🖼️</div>
                                  <h4 className="font-black text-gray-900 mb-2 text-lg">صورة (PNG)</h4>
                                  <p className="text-xs text-gray-600 font-bold leading-relaxed">
                                    تحميل الدرجات كصورة مرتبة بشكل احترافي مع أسماء الطلاب والتقديرات
                                  </p>
                                  <div className="mt-4 pt-4 border-t border-blue-200 text-xs font-bold text-blue-600">
                                    ✓ تنسيق احترافي
                                  </div>
                                </button>

                                {/* الخيار 2: PDF */}
                                <button
                                  onClick={() => { exportAsPDF(); setShowExportModal(false); }}
                                  className="p-6 rounded-2xl border-2 border-red-200 bg-red-50 hover:bg-red-100 hover:border-red-400 transition-all group"
                                >
                                  <div className="text-4xl mb-3">📄</div>
                                  <h4 className="font-black text-gray-900 mb-2 text-lg">ملف PDF</h4>
                                  <p className="text-xs text-gray-600 font-bold leading-relaxed">
                                    تحميل جدول الدرجات كـ PDF، يتكيف مع عدد الطلاب (متعدد الصفحات)
                                  </p>
                                  <div className="mt-4 pt-4 border-t border-red-200 text-xs font-bold text-red-600">
                                    ✓ متعدد الصفحات
                                  </div>
                                </button>

                                {/* الخيار 3: Excel */}
                                <button
                                  onClick={() => { exportAsExcel(); setShowExportModal(false); }}
                                  className="p-6 rounded-2xl border-2 border-green-200 bg-green-50 hover:bg-green-100 hover:border-green-400 transition-all group"
                                >
                                  <div className="text-4xl mb-3">📊</div>
                                  <h4 className="font-black text-gray-900 mb-2 text-lg">ملف Excel</h4>
                                  <p className="text-xs text-gray-600 font-bold leading-relaxed">
                                    تحميل الدرجات كملف Excel قابل للتعديل والطباعة
                                  </p>
                                  <div className="mt-4 pt-4 border-t border-green-200 text-xs font-bold text-green-600">
                                    ✓ قابل للتعديل
                                  </div>
                                </button>
                              </div>

                              <div className="flex justify-end">
                                <button
                                  onClick={() => setShowExportModal(false)}
                                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                                >
                                  إغلاق
                                </button>
                              </div>
                            </motion.div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* modal التأكيد */}
                      <AnimatePresence>
                        {showConfirmationModal && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
                            onClick={() => setShowConfirmationModal(false)}
                          >
                            <motion.div
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0.8, opacity: 0 }}
                              className="bg-white rounded-3xl p-8 shadow-2xl max-w-md w-full mx-4"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="flex justify-center mb-6">
                                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
                                  <CheckCircle2 size={32} className="text-emerald-600" />
                                </div>
                              </div>
                              <h3 className="text-xl font-black text-gray-900 text-center mb-3">تأكيد إرسال الدرجات</h3>
                              <p className="text-gray-600 text-center font-bold mb-8">
                                هل أنت متأكد من إرسال درجات اختبار <span className="text-emerald-600">{selectedPaperExam?.title}</span>؟
                                <br />
                                <span className="text-sm text-gray-500 block mt-2">سيتم نقل الاختبار للأرشيف بعد الإرسال.</span>
                              </p>
                              <div className="flex gap-3">
                                <button
                                  onClick={() => setShowConfirmationModal(false)}
                                  className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-2xl font-black transition-all hover:bg-gray-200"
                                >
                                  إلغاء
                                </button>
                                <button
                                  onClick={handleSubmitPaperExamGrades}
                                  className="flex-1 bg-emerald-600 text-white px-6 py-3 rounded-2xl font-black transition-all hover:bg-emerald-700"
                                >
                                  تأكيد الإرسال
                                </button>
                              </div>
                            </motion.div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}

                  {/* قسم الأرشيف */}
                  {paperExamArchive.length > 0 && (
                    <div className="mt-12 bg-gray-50 rounded-3xl p-8 border border-gray-200">
                      <h4 className="font-black text-gray-800 mb-6 flex items-center gap-2">
                        <CheckCircle2 size={24} className="text-green-600" /> ✅ أرشيف الاختبارات الورقية
                      </h4>
                      <div className="space-y-3">
                        {paperExamArchive.map((archive, idx) => (
                          <div key={idx} className="bg-white p-5 border border-gray-100 rounded-2xl flex justify-between items-center shadow-sm">
                            <div>
                              <p className="font-black text-gray-900">{archive.title}</p>
                              <p className="text-xs text-gray-500 font-bold mt-1">
                                الفصل: {archive.classCode} | التاريخ: {new Date(archive.submittedAt).toLocaleDateString('ar-SA')}
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                عدد الطلاب: {Object.keys(archive.grades).length}
                              </p>
                            </div>
                            <span className="bg-green-100 text-green-700 px-4 py-2 rounded-xl text-xs font-black">✅ تم الإرسال</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ✅ قسم درجات الاختبارات الأونلاين - محسّن */}
              {paperExamGradingMode === 'online' && gradesClass && (
                <div>
                  {/* البحث عن اختبار */}
                  <div className="mb-8">
                    <input
                      type="text"
                      placeholder="🔍 ابحث عن اختبار أونلاين..."
                      className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 font-bold text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* عرض الاختبارات الأونلاين كبطاقات - درجات فقط (بدون تعديل) */}
                  <div>
                    <label className="text-xs font-black text-gray-600 mb-3 block">الاختبارات الأونلاين المتاحة:</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {myTests.filter(t => t.type === 'online' && t.classCode === gradesClass).length > 0 ? (
                        myTests.filter(t => t.type === 'online' && t.classCode === gradesClass).map(exam => {
                          // قراءة درجات الطلاب من مو_grades
                          const examGrades = realGrades[`${exam.classCode}__${exam.title}__الفصل الأول`] || {};
                          const studentCount = Object.keys(examGrades).length;
                          
                          return (
                            <button
                              key={exam.id}
                              onClick={() => setSelectedPaperExam(exam)}
                              className={`p-5 rounded-2xl border-2 transition-all text-left hover:shadow-lg ${
                                selectedPaperExam?.id === exam.id
                                  ? 'bg-blue-50 border-blue-500 shadow-lg'
                                  : 'bg-white border-gray-200 hover:border-blue-300'
                              }`}
                            >
                              <div className="flex justify-between items-start mb-2">
                                <h3 className="font-black text-gray-900 text-lg">{exam.title}</h3>
                                <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-lg text-xs font-black">🌐 أونلاين</span>
                              </div>
                              <p className="text-sm text-gray-500 mb-1">📚 الفصل: {exam.classCode}</p>
                              <p className="text-sm text-gray-400 mb-3">🕐 {exam.day || exam.date} - {exam.time}</p>
                              <div className="pt-3 border-t border-gray-100">
                                <p className="text-xs font-black text-blue-600">👆 اضغط لعرض درجات الطلاب</p>
                                {studentCount > 0 && <p className="text-xs text-gray-500 mt-1">📊 {studentCount} طالب أكملوا الاختبار</p>}
                              </div>
                            </button>
                          );
                        })
                      ) : (
                        <div className="col-span-3 text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                          <FileText size={40} className="text-gray-300 mx-auto mb-3" />
                          <p className="text-gray-400 font-bold">لا توجد اختبارات أونلاين في هذا الفصل</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* عرض درجات الاختبار الأونلاين المختار - بدون تعديل */}
                  {selectedPaperExam && myTests.find(t => t.id === selectedPaperExam.id)?.type === 'online' && (
                    <div className="mt-8 bg-blue-50 p-8 rounded-3xl border-2 border-blue-200">
                      <h4 className="text-2xl font-black text-gray-900 mb-6">📊 نتائج الاختبار: {selectedPaperExam.title}</h4>
                      <p className="text-sm text-gray-600 mb-6 font-bold">⚠️ هذه النتائج حقيقية من الاختبار الأونلاين - لا يمكن تعديلها</p>

                      {/* جدول درجات الطلاب الفعلية */}
                      <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="bg-gray-50 border-b border-gray-100">
                                <th className="text-right px-6 py-4 font-black text-gray-600 text-xs uppercase tracking-wider">اسم الطالب</th>
                                <th className="text-right px-6 py-4 font-black text-gray-600 text-xs uppercase tracking-wider">رقم الهوية</th>
                                <th className="text-center px-6 py-4 font-black text-gray-600 text-xs uppercase tracking-wider">الدرجة / 100</th>
                                <th className="text-center px-6 py-4 font-black text-gray-600 text-xs uppercase tracking-wider">التقدير</th>
                              </tr>
                            </thead>
                            <tbody>
                              {paperExamGradingStudents.map((student, idx) => {
                                // 🔥 إصلاح: ابحث عن الدرجات في أي semester
                                let score = null;
                                for (const semester of ['الفصل الأول', 'الفصل الثاني', 'الفصل الثالث']) {
                                  const examKey = `${selectedPaperExam.classCode}__${selectedPaperExam.title}__${semester}`;
                                  if (realGrades[examKey]?.[student.id]) {
                                    score = realGrades[examKey][student.id];
                                    break;
                                  }
                                }
                                
                                const letter = score ? (score >= 95 ? 'A+' : score >= 90 ? 'A' : score >= 85 ? 'B+' : score >= 80 ? 'B' : score >= 75 ? 'C+' : score >= 70 ? 'C' : score >= 65 ? 'D+' : score >= 60 ? 'D' : 'F') : '-';
                                const barColor = !score ? 'bg-gray-200' : score >= 90 ? 'bg-emerald-500' : score >= 75 ? 'bg-blue-500' : score >= 60 ? 'bg-amber-500' : 'bg-red-500';
                                
                                return (
                                  <tr key={student.id} className={`border-b border-gray-50 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                                    <td className="px-6 py-4 font-bold text-gray-800">{student.name}</td>
                                    <td className="px-6 py-4 text-xs text-gray-400 font-mono">{student.id}</td>
                                    <td className="px-6 py-4">
                                      <div className="flex items-center gap-3 justify-center">
                                        {score ? (
                                          <>
                                            <span className="font-black text-lg text-gray-800">{score}%</span>
                                            <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                                              <div className={`h-full ${barColor} rounded-full transition-all duration-500`} style={{ width: `${score}%` }} />
                                            </div>
                                          </>
                                        ) : (
                                          <span className="text-gray-400 font-bold">لم يكتمل</span>
                                        )}
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                      <span className={`inline-block px-3 py-1 rounded-xl text-xs font-black ${
                                        letter === '-' ? 'bg-gray-100 text-gray-400' :
                                        letter === 'F' ? 'bg-red-50 text-red-600' :
                                        letter.startsWith('A') ? 'bg-emerald-50 text-emerald-700' :
                                        letter.startsWith('B') ? 'bg-blue-50 text-blue-700' :
                                        letter.startsWith('C') ? 'bg-amber-50 text-amber-700' :
                                        'bg-orange-50 text-orange-700'
                                      }`}>
                                        {letter}
                                      </span>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* أزرار تصدير النتائج */}
                      <div className="mt-8 flex justify-end gap-3">
                        <button
                          onClick={() => setSelectedPaperExam(null)}
                          className="px-8 py-3 bg-white border border-gray-200 rounded-2xl font-black text-lg shadow-sm hover:bg-gray-50"
                        >
                          إلغاء
                        </button>
                        <div className="relative" ref={resultsExportRef}>
                          <button
                            onClick={() => setShowResultsExportDropdown(!showResultsExportDropdown)}
                            className="flex items-center gap-3 bg-blue-600 text-white px-10 py-3 rounded-2xl font-black text-lg shadow-xl hover:bg-blue-700 transition-all"
                          >
                            <Download size={24} /> تصدير النتائج ▾
                          </button>
                          <AnimatePresence>
                            {showResultsExportDropdown && (
                              <motion.div
                                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                                transition={{ duration: 0.15 }}
                                className="absolute left-0 bottom-full mb-2 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden min-w-[260px] z-50"
                              >
                                <button
                                  onClick={exportResultsAsPDF}
                                  className="w-full flex items-center gap-4 px-6 py-4 hover:bg-red-50 transition-colors text-right"
                                >
                                  <span className="text-3xl">📄</span>
                                  <div>
                                    <p className="font-black text-gray-900 text-base">تصدير PDF</p>
                                    <p className="text-xs text-gray-500 font-bold">ملف PDF بنتائج الاختبار كاملة</p>
                                  </div>
                                </button>
                                <div className="border-t border-gray-100"></div>
                                <button
                                  onClick={exportResultsAsExcel}
                                  className="w-full flex items-center gap-4 px-6 py-4 hover:bg-green-50 transition-colors text-right"
                                >
                                  <span className="text-3xl">📊</span>
                                  <div>
                                    <p className="font-black text-gray-900 text-base">تصدير Excel</p>
                                    <p className="text-xs text-gray-500 font-bold">شيت اكسيل منسق وملون</p>
                                  </div>
                                </button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* رسالة إذا لم يتم اختيار اختبار */}
                  {!selectedPaperExam && (
                    <div className="text-center py-12 mt-8">
                      <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <BarChart2 size={36} className="text-blue-300" />
                      </div>
                      <p className="text-gray-400 font-bold text-lg">اختر اختبار أونلاين لعرض درجات الطلاب</p>
                    </div>
                  )}
                </div>
              )}

              {/* رسالة إذا لم يتم اختيار فصل */}
              {!gradesClass && (
                <div className="text-center py-20">
                  <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <BarChart2 size={36} className="text-gray-300" />
                  </div>
                  <p className="text-gray-400 font-bold text-lg">اختر فصلاً لبدء إدخال الدرجات</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* 🔥 إضافة: تاب طلبات التبديل */}
        <AnimatePresence>
          {activeTab === 'swaps' && (
            <motion.div key="swaps" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-[40px] p-10 border border-gray-100 shadow-sm text-right">
              <div className="mb-8">
                <h3 className="text-3xl font-black text-gray-900 flex items-center gap-3 mb-2">
                  <Bell className="text-amber-500" /> سجل طلبات التبديل
                </h3>
                <p className="text-sm text-gray-400 font-bold">طلبات التبديل المرسلة والمستقبلة — اقبل أو ارفض</p>
              </div>

              {notifications.length === 0 ? (
                <div className="text-center py-20">
                  <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Bell size={36} className="text-amber-200" />
                  </div>
                  <p className="text-gray-400 font-bold text-lg">لا توجد طلبات تبديل حالياً</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {notifications.map((notif, i) => (
                    <div key={notif.id || i} className={`p-6 rounded-3xl border ${notif.status === 'accepted' ? 'bg-emerald-50 border-emerald-200' : notif.status === 'rejected' ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`text-xs font-black px-3 py-1 rounded-xl ${notif.status === 'accepted' ? 'bg-emerald-100 text-emerald-700' : notif.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                              {notif.status === 'accepted' ? '✅ مقبول' : notif.status === 'rejected' ? '❌ مرفوض' : '⏳ قيد الانتظار'}
                            </span>
                            <span className="text-xs text-gray-400 font-bold">{notif.timestamp ? new Date(notif.timestamp).toLocaleDateString('ar-SA') : ''}</span>
                          </div>
                          <p className="font-bold text-gray-800 text-sm leading-relaxed">{notif.message || notif.title}</p>
                          {notif.sourceLesson && notif.targetLesson && (
                            <div className="mt-3 flex gap-4 text-xs font-bold text-gray-500">
                              <span className="bg-white rounded-xl px-3 py-1.5 border border-gray-100">حصتك: {notif.sourceLesson.subject} — {notif.sourceLesson.day} {notif.sourceLesson.time}</span>
                              <span className="text-amber-500">⇄</span>
                              <span className="bg-white rounded-xl px-3 py-1.5 border border-gray-100">حصة: {notif.targetLesson.subject} — {notif.targetLesson.day} {notif.targetLesson.time}</span>
                            </div>
                          )}
                        </div>
                        {!notif.status && notif.targetInstructor === teacherProfile.name && (
                          <div className="flex gap-2 flex-shrink-0">
                            <button
                              onClick={() => { executeSwap(notif); setNotifications(getTeacherNotifications(teacherProfile.name)); showToast('✅ تم قبول طلب التبديل!'); }}
                              className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-black hover:bg-emerald-700 transition-colors"
                            >قبول</button>
                            <button
                              onClick={() => { rejectSwap(notif); setNotifications(getTeacherNotifications(teacherProfile.name)); showToast('❌ تم رفض طلب التبديل.'); }}
                              className="px-4 py-2 bg-red-500 text-white rounded-xl text-sm font-black hover:bg-red-600 transition-colors"
                            >رفض</button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* 🔥 الجدول التفاعلي العادي (عرض وتعديل الحصص) */}
        <AnimatePresence>
          {isTeacherOverlayOpen && (
            <GlassScheduleTable
              timeSlots={masterTimeSlots}
              days={GRID_DAYS}
              title={`جدول الفصل: ${selectedClassForOverlay}`}
              subtitle="اضغط للإضافة، أو اسحب حصتك فوق حصة زميلك لطلب التبديل (Drag & Drop)."
              onClose={() => setIsTeacherOverlayOpen(false)}
              renderDayLabel={(day) => <div className="font-black text-white text-base">{day}</div>}
              renderCell={(day, time) => {
                const { status, lesson } = getCellState(day, time);
                return (
                  <button
                    draggable={status === 'mine'}
                    onDragStart={(e) => { if (status === 'mine') e.dataTransfer.setData('sourceLessonId', lesson.id); }}
                    onDragOver={(e) => e.preventDefault()}

                    // 🔥 الرادار الذكي للتبديل بين المعلمين (منع السبام والتأكيد)
                    onDrop={(e) => {
                      e.preventDefault();
                      const sourceId = e.dataTransfer.getData('sourceLessonId');
                      if (!sourceId) return;
                      const sourceLesson = globalSchedule.find(l => l.id === sourceId);

                      if (status === 'other') {
                        const targetLesson = lesson;

                        // 1. فحص: هل المعلم التاني مشغول في وقت حصتي؟
                        const isTargetTeacherBusy = globalSchedule.some(l =>
                          l.instructor === targetLesson.instructor &&
                          l.day === sourceLesson.day &&
                          l.time === sourceLesson.time &&
                          l.id !== targetLesson.id
                        );

                        if (isTargetTeacherBusy) {
                          showToast(`❌ لا يمكن التبديل! المعلم (${targetLesson.instructor}) لديه حصة أخرى في فصل مختلف في نفس توقيت حصتك.`);
                          return;
                        }

                        // 2. فحص: هل أنا مشغول في وقت حصة المعلم التاني؟
                        const isMeBusy = globalSchedule.some(l =>
                          l.instructor === sourceLesson.instructor &&
                          l.day === targetLesson.day &&
                          l.time === targetLesson.time &&
                          l.id !== sourceLesson.id
                        );

                        if (isMeBusy) {
                          showToast(`❌ لا يمكن التبديل! أنت لديك حصة أخرى في نفس توقيت حصة المعلم (${targetLesson.instructor}).`);
                          return;
                        }

                        // 3. فحص السبام: هل بعت الطلب ده قبل كده؟
                        const existingNotifs = notificationsData;
                        const isAlreadySent = existingNotifs.some(n =>
                          n.type === 'swap_request' &&
                          n.sourceLesson?.id === sourceLesson.id &&
                          n.targetLesson?.id === targetLesson.id
                        );

                        if (isAlreadySent) {
                          showToast('⚠️ لقد قمت بإرسال طلب تبديل لهذه الحصة مسبقاً وهو قيد الانتظار.');
                          return;
                        }

                        // 4. رسالة التأكيد
                        if (window.confirm(`هل أنت متأكد من إرسال طلب تبديل حصتك (${sourceLesson.subject}) بحصة المعلم (${targetLesson.instructor})؟`)) {
                          sendSwapRequest(sourceLesson, targetLesson);
                          showToast(`✅ تم إرسال طلب التبديل للمعلم (${targetLesson.instructor}) بنجاح!`);
                        }
                      }
                      else if (status === 'empty') {
                        moveSlot(sourceId, day, time);
                      }
                    }}

                    onClick={() => { if (status === 'empty') bookSlot(day, time); else if (status === 'mine') handleRemoveSlot(lesson.id); }}
                    disabled={status === 'other' || status === 'busy_elsewhere' || status === 'break'}
                    // 🔥 تلوين الحصص للمعلم
                    className={`w-full h-full min-h-[85px] rounded-2xl border p-2 text-right transition-all font-bold ${status === 'break' ? 'bg-gradient-to-br from-orange-400 to-orange-500 border-orange-300 text-white shadow-lg cursor-not-allowed' :
                      status === 'mine' ? `bg-gradient-to-br text-white shadow-xl cursor-grab active:cursor-grabbing hover:scale-[1.02] ${getSubjectColor(lesson.subject)}` :
                        status === 'busy_elsewhere' ? 'bg-red-500/80 border-red-400 text-white shadow-lg cursor-not-allowed' :
                          status === 'other' ? 'bg-gray-800/40 text-white/30 cursor-not-allowed border-dashed' :
                            'bg-white/5 border-white/10 text-white/10 hover:bg-white/10 hover:border-solid border-dashed'
                      }`}
                  >
                    {status === 'break' ? 'فسحة' :
                      status === 'mine' ? <span className="text-[11px] leading-tight block pt-1">{lesson.subject} {lesson.type === 'exam' && '(اختبار)'}</span> :
                        status === 'busy_elsewhere' ? <span className="text-[10px]"><AlertCircle size={14} className="inline mr-1 mb-0.5 text-white" />مشغول في:<br />{lesson.classCode}</span> :
                          status === 'other' ? <span><Lock size={12} className="inline opacity-30 mb-0.5" /> {lesson.instructor}</span> : '+'}
                  </button>
                );
              }}
            />
          )}
        </AnimatePresence>

        {/* 🔥 جدول التحديد لمنظومة الاختبارات */}
        <AnimatePresence>
          {isExamScheduleOpen && newTest.classCode && (
            <GlassScheduleTable
              timeSlots={masterTimeSlots}
              days={GRID_DAYS}
              title={`تحديد حصة الاختبار - ${newTest.classCode}`}
              subtitle="اضغط على حصة من حصصك، أو حصة فارغة لتحويلها لاختبار."
              onClose={() => setIsExamScheduleOpen(false)}
              renderDayLabel={(day) => <div className="font-black text-white text-base">{day}</div>}
              renderCell={(day, time) => {
                const { status, lesson } = getCellState(day, time);
                return (
                  <button
                    onClick={() => handleExamSlotSelect(day, time, lesson)}
                    disabled={status === 'other' || status === 'busy_elsewhere' || status === 'break'}
                    // 🔥 تلوين الحصص للمعلم
                    className={`w-full h-full min-h-[85px] rounded-2xl border p-2 text-right transition-all font-bold ${status === 'break' ? 'bg-gradient-to-br from-orange-400 to-orange-500 border-orange-300 text-white shadow-lg cursor-not-allowed' :
                      status === 'mine' ? `bg-gradient-to-br border-white/20 text-white shadow-xl hover:scale-[1.02] ${getSubjectColor(lesson.subject)}` :
                        status === 'busy_elsewhere' ? 'bg-red-500/80 border-red-400 text-white shadow-lg cursor-not-allowed' :
                          status === 'other' ? 'bg-gray-800/40 text-white/30 cursor-not-allowed border-dashed' :
                            'bg-white/10 border-white/20 hover:bg-white/20 hover:border-solid border-dashed text-white'
                      }`}
                  >
                    {status === 'break' ? 'فسحة' :
                      status === 'mine' ? <span className="text-[11px] leading-tight block pt-1">{lesson.subject} (تحديد)</span> :
                        status === 'busy_elsewhere' ? <span className="text-[10px]"><AlertCircle size={14} className="inline mr-1 mb-0.5 text-white" />مشغول</span> :
                          status === 'other' ? <span><Lock size={12} className="inline opacity-30 mb-0.5" /> محجوز</span> : 'تحديد الموعد'}
                  </button>
                );
              }}
            />
          )}
        </AnimatePresence>

        {/* Modal تأكيد الحضور والغياب */}
        <AnimatePresence>
          {confirmModalData && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
              onClick={() => setConfirmModalData(null)}
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="bg-white rounded-[32px] p-8 shadow-2xl max-w-md w-full mx-4 border border-gray-100"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-center mb-6">
                  <div className="w-20 h-20 bg-amber-50 rounded-[24px] flex items-center justify-center shadow-inner">
                    <AlertCircle size={40} className="text-amber-500" />
                  </div>
                </div>
                <h3 className="text-2xl font-black text-gray-900 text-center mb-4">{confirmModalData.title}</h3>
                <p className="text-gray-500 text-center font-bold text-lg leading-relaxed mb-8">
                  {confirmModalData.message}
                </p>
                <div className="flex gap-4">
                  <button
                    onClick={() => setConfirmModalData(null)}
                    className="flex-1 bg-gray-50 text-gray-600 px-6 py-4 rounded-2xl font-black text-lg transition-all hover:bg-gray-100 border border-gray-200"
                  >
                    إلغاء
                  </button>
                  <button
                    onClick={confirmModalData.onConfirm}
                    className="flex-1 bg-gray-900 text-white px-6 py-4 rounded-2xl font-black text-lg shadow-xl hover:bg-gray-800 transition-all hover:-translate-y-1"
                  >
                    تأكيد
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </main>
    </div>
  );
};

export default TeacherDashboard;
import PropTypes from 'prop-types';
TeacherDashboard.propTypes = { onLogout: PropTypes.func, teacherData: PropTypes.object };



