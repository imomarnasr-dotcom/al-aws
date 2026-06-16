import { useState, useMemo } from 'react';
import { getGlobalMaster, SyncAll, getActiveWeekDays, getMasterTimeSlots } from '../utils/dataManager';

export const useAdminTable = ({ globalMaster, setGlobalMaster, settings, selectedClass, showToast }) => {
  const [editingLesson, setEditingLesson] = useState(null);
  const [lessonForm, setLessonForm] = useState({ subject: '', instructor: '', room: '' });

  // سحب الأوقات من المحرك الموحد
  const timeSlots = useMemo(() => {
    return getMasterTimeSlots(settings);
  }, [settings]);

  const ACTIVE_WEEK_DAYS = getActiveWeekDays();

  const scheduleData = useMemo(() => {
    const byDay = {};
    ACTIVE_WEEK_DAYS.forEach(day => {
      byDay[day] = (globalMaster.lessons || []).filter(l => l.day === day && l.classCode === selectedClass);
    });
    return byDay;
  }, [globalMaster.lessons, selectedClass, ACTIVE_WEEK_DAYS.join(',')]);

  const handleEmptyCellClick = (day, time) => {
    setEditingLesson({ day, time, classCode: selectedClass, isEdit: false });
    setLessonForm({ subject: '', instructor: '', room: '' });
  };

  const handleSaveLesson = () => {
    // التحقق من الحقول
    if (!lessonForm.subject.trim() || !lessonForm.instructor.trim()) {
      showToast('⚠️ يرجى تعبئة المادة والمعلم');
      return;
    }

    // شرط التعارض: التحقق مما إذا كان المعلم مشغولاً في فصل آخر في نفس اليوم ونفس التوقيت
    const conflict = globalMaster.lessons.find(l => 
      l.day === editingLesson.day &&
      l.time === editingLesson.time &&
      l.instructor === lessonForm.instructor &&
      l.classCode !== selectedClass &&
      l.type !== 'break' && !l.isBreak
    );

    if (conflict) {
      showToast(`⚠️ تعارض! المعلم مشغول في فصل (${conflict.classCode}) في هذا التوقيت.`);
      return;
    }

    // clone لضمان عدم تغيير الـ state مباشرة
    const updated = { ...globalMaster, lessons: globalMaster.lessons.map(l => ({ ...l })) };

    if (editingLesson.isEdit) {
      updated.lessons = updated.lessons.map(l => l.id === editingLesson.id ? { ...l, subject: lessonForm.subject, instructor: lessonForm.instructor, room: lessonForm.room, type: 'basic', isBreak: false } : l);
    } else {
      // 🔥 هنا التعديل: ضفنا teacherId و stage عشان جدول المعلم يقدر يقرأ الحصة اللي المسئول بيضيفها
      const newLesson = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        day: editingLesson.day,
        time: editingLesson.time,
        classCode: selectedClass,
        stage: selectedClass,
        subject: lessonForm.subject,
        instructor: lessonForm.instructor,
        teacherId: lessonForm.instructor.toLowerCase().replace(/\s+/g, '-'),
        room: lessonForm.room,
        type: 'basic'
      };
      updated.lessons.push(newLesson);
    }

    SyncAll(updated);
    setGlobalMaster(updated);
    setEditingLesson(null);
    showToast('✅ تم الحفظ بنجاح');
  };

  const handleDeleteLesson = (lessonId) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه الحصة؟')) return;
    // clone آمن لكل كائن لتجنب التعديل بالمرجع على الـ state الأصلية
    const updated = { ...globalMaster, lessons: globalMaster.lessons.map(l => ({ ...l })) };
    updated.lessons = updated.lessons.filter(l => l.id !== lessonId);
    SyncAll(updated);
    setGlobalMaster(updated);
    setEditingLesson(null);
    setLessonForm({ subject: '', instructor: '', room: '' });
    showToast('🗑️ تم حذف الحصة بنجاح');
  };

  const toggleRest = (lessonId) => {
    // clone آمن لتجنب التعديل بالمرجع على الـ state الأصلية
    const updated = { ...globalMaster, lessons: globalMaster.lessons.map(l => ({ ...l })) };
    updated.lessons = updated.lessons.map(l => l.id === lessonId ? { ...l, type: 'break', subject: 'وقت راحة', isBreak: true } : l);
    SyncAll(updated);
    setGlobalMaster(updated);
    setEditingLesson(null);
    showToast('✅ تم تحويل الحصة لوقت راحة');
  };

  const handleMoveLesson = (lessonId, newDay, newTime) => {
    const updated = { ...globalMaster, lessons: globalMaster.lessons.map(l => ({ ...l })) };
    const lessonIndex = updated.lessons.findIndex(l => l.id === lessonId);
    if (lessonIndex > -1) {
      const sourceLesson = updated.lessons[lessonIndex];
      const targetLessonIndex = updated.lessons.findIndex(l => l.day === newDay && l.time === newTime && l.classCode === selectedClass);
      
      // Collision check for the source lesson moving to new time
      const sourceCollision = updated.lessons.find(l => 
        l.id !== sourceLesson.id && 
        l.day === newDay && 
        l.time === newTime && 
        l.instructor === sourceLesson.instructor && 
        l.classCode !== selectedClass
      );

      if (sourceCollision) {
        showToast(`❌ عذراً، المعلم ${sourceLesson.instructor} لديه حصة في التوقيت المستهدف في الفصل [${sourceCollision.classCode}]!`);
        return;
      }

      if (targetLessonIndex > -1) {
        const targetLesson = updated.lessons[targetLessonIndex];
        // Collision check for the target lesson moving to source time
        const targetCollision = updated.lessons.find(l => 
          l.id !== targetLesson.id && 
          l.day === sourceLesson.day && 
          l.time === sourceLesson.time && 
          l.instructor === targetLesson.instructor && 
          l.classCode !== selectedClass
        );

        if (targetCollision) {
          showToast(`❌ لا يمكن التبديل، المعلم ${targetLesson.instructor} لديه حصة في التوقيت الأصلي في الفصل [${targetCollision.classCode}]!`);
          return;
        }

        const tempDay = sourceLesson.day;
        const tempTime = sourceLesson.time;
        updated.lessons[lessonIndex].day = newDay;
        updated.lessons[lessonIndex].time = newTime;
        updated.lessons[targetLessonIndex].day = tempDay;
        updated.lessons[targetLessonIndex].time = tempTime;
      } else {
        updated.lessons[lessonIndex].day = newDay;
        updated.lessons[lessonIndex].time = newTime;
      }
      SyncAll(updated);
      setGlobalMaster(updated);
      showToast('✅ تم النقل والتبديل بنجاح');
    }
  };

  return { timeSlots, scheduleData, WEEK_DAYS: ACTIVE_WEEK_DAYS, editingLesson, setEditingLesson, lessonForm, setLessonForm, handleSaveLesson, handleDeleteLesson, handleEmptyCellClick, toggleRest, handleMoveLesson };
};