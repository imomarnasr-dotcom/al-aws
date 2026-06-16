/**
 * Advanced Schedule Management Module
 * يوفر: Admin Actions, Global Break Toggle, Domino Time Engine, Enhanced Drag&Drop
 */

export const ScheduleManagerHelpers = {
  /**
   * 1️⃣ ADMIN ACTIONS FIX - تفعيل خيارات المسؤول الكاملة
   */
  removeSubject: (day, time, globalSchedule, globalExams) => {
    const schedule = [...globalSchedule];
    const exams = [...globalExams];
    
    const lessonIndex = schedule.findIndex(l => 
      l.day === day && l.time.trim() === time.trim()
    );
    
    const examIndex = exams.findIndex(ex => 
      ex.day === day && ex.time.trim() === time.trim()
    );
    
    if (lessonIndex >= 0) {
      const removed = schedule.splice(lessonIndex, 1)[0];
      return { schedule, exams, removed, type: 'lesson' };
    }
    
    if (examIndex >= 0) {
      const removed = exams.splice(examIndex, 1)[0];
      return { schedule, exams, removed, type: 'exam' };
    }
    
    return { schedule, exams, removed: null, type: null };
  },

  convertToBreak: (day, time, schoolTemplate) => {
    const template = schoolTemplate.map(slot => {
      if (slot.day === day && slot.startTime.trim() === time.trim()) {
        return {
          ...slot,
          isBreak: true,
          reserved: true,
          reservedType: 'break',
          reservedBy: 'system',
          reservationId: 'break',
          subject: 'الفسحة',
          classLabel: '',
          room: '',
        };
      }
      return slot;
    });
    return template;
  },

  convertToRest: (day, time, schoolTemplate) => {
    const template = schoolTemplate.map(slot => {
      if (slot.day === day && slot.startTime.trim() === time.trim()) {
        return {
          ...slot,
          isBreak: false,
          reserved: true,
          reservedType: 'rest',
          reservedBy: 'system',
          reservationId: 'rest',
          subject: 'وقت راحة',
          classLabel: '',
          room: '',
        };
      }
      return slot;
    });
    return template;
  },

  convertBreakToEmpty: (day, time, schoolTemplate) => {
    const template = schoolTemplate.map(slot => {
      if (slot.day === day && slot.startTime.trim() === time.trim()) {
        return {
          ...slot,
          isBreak: false,
          reserved: false,
          reservedType: '',
          reservedBy: '',
          reservationId: null,
          subject: '',
          classLabel: '',
          room: '',
        };
      }
      return slot;
    });
    return template;
  },

  /**
   * 2️⃣ GLOBAL BREAK TOGGLE - تحويل عمود كامل لفسحة
   */
  toggleColumnBreak: (time, schoolTemplate, globalSchedule, globalExams, WEEK_DAYS) => {
    const normalizeTime = (t) => t.trim();
    const columnSlots = schoolTemplate.filter(s => normalizeTime(s.startTime) === normalizeTime(time));
    
    if (columnSlots.length === 0) return { template: schoolTemplate, schedule: globalSchedule, exams: globalExams };

    const isCurrentlyBreak = columnSlots.some(s => s.isBreak || s.reservedType === 'break');
    const shouldBeBreak = !isCurrentlyBreak;

    let schedule = [...globalSchedule];
    let exams = [...globalExams];

    if (shouldBeBreak) {
      schedule = schedule.filter(l => normalizeTime(l.time) !== normalizeTime(time));
      exams = exams.filter(ex => normalizeTime(ex.time) !== normalizeTime(time));
    }

    const template = schoolTemplate.map(slot => {
      if (normalizeTime(slot.startTime) !== normalizeTime(time)) return slot;
      
      return shouldBeBreak 
        ? {
            ...slot,
            isBreak: true,
            reserved: true,
            reservedType: 'break',
            reservedBy: 'system',
            reservationId: 'break',
            subject: 'الفسحة',
          }
        : {
            ...slot,
            isBreak: false,
            reserved: false,
            reservedType: '',
            reservedBy: '',
            reservationId: null,
            subject: '',
            classLabel: '',
            room: '',
          };
    });

    return { template, schedule, exams, wasToggled: true };
  },

  /**
   * 3️⃣ DOMINO TIME ENGINE - محرك الإزاحة الزمنية الذكي
   */
  applyTimeShift: (slotIndex, newDuration, schoolTemplate, globalSchedule, globalExams, schoolDaySettings, timeDurations) => {
    const toMinutes = (time) => {
      const [h, m] = String(time || '08:00').split(':').map(Number);
      return (h * 60) + m;
    };

    const toTime = (mins) => {
      const h = Math.floor(mins / 60).toString().padStart(2, '0');
      const m = (mins % 60).toString().padStart(2, '0');
      return `${h}:${m}`;
    };

    const WEEK_DAYS = ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];
    const updatedTemplate = [...schoolTemplate];
    const updatedSchedule = [...globalSchedule];
    const updatedExams = [...globalExams];
    const updatedDurations = { ...timeDurations, [slotIndex]: newDuration };

    WEEK_DAYS.forEach(day => {
      let cursor = toMinutes(schoolDaySettings.firstLessonStart || '08:00');
      
      updatedTemplate
        .filter(s => s.day === day)
        .sort((a, b) => a.slotIndex - b.slotIndex)
        .forEach(slot => {
          if (slot.isBreak) {
            const breakDur = schoolDaySettings.breakDuration || 20;
            const breakStart = toMinutes(schoolDaySettings.breakStart || '10:30');
            if (cursor < breakStart) cursor = breakStart;
            return;
          }

          const dur = updatedDurations[slot.slotIndex] || schoolDaySettings.lessonDuration || 45;
          const newStart = toTime(cursor);
          const newEnd = toTime(cursor + dur);

          // تحديث في Template
          const templateIdx = updatedTemplate.findIndex(s => s.slotIndex === slot.slotIndex && s.day === day);
          if (templateIdx >= 0) {
            updatedTemplate[templateIdx] = {
              ...updatedTemplate[templateIdx],
              startTime: newStart,
              endTime: newEnd,
            };
          }

          // تحديث في Schedule
          const scheduleIdx = updatedSchedule.findIndex(l => 
            l.day === day && l.slotIndex === slot.slotIndex
          );
          if (scheduleIdx >= 0) {
            updatedSchedule[scheduleIdx] = {
              ...updatedSchedule[scheduleIdx],
              time: newStart,
            };
          }

          cursor += dur;
        });
    });

    return { template: updatedTemplate, schedule: updatedSchedule, exams: updatedExams, durations: updatedDurations };
  },

  /**
   * 4️⃣ ENHANCED DRAG & DROP - تبديل فعلي للبيانات
   */
  swapLessons: (sourceDay, sourceTime, targetDay, targetTime, globalSchedule, globalExams) => {
    const schedule = [...globalSchedule];
    const exams = [...globalExams];

    const sourceLessonIdx = schedule.findIndex(l => l.day === sourceDay && l.time.trim() === sourceTime.trim());
    const targetLessonIdx = schedule.findIndex(l => l.day === targetDay && l.time.trim() === targetTime.trim());
    const sourceExamIdx = exams.findIndex(ex => ex.day === sourceDay && ex.time.trim() === sourceTime.trim());
    const targetExamIdx = exams.findIndex(ex => ex.day === targetDay && ex.time.trim() === targetTime.trim());

    // Lesson swap
    if (sourceLessonIdx >= 0 && targetLessonIdx >= 0) {
      [schedule[sourceLessonIdx], schedule[targetLessonIdx]] = [schedule[targetLessonIdx], schedule[sourceLessonIdx]];
      return { schedule, exams };
    }

    // Exam swap
    if (sourceExamIdx >= 0 && targetExamIdx >= 0) {
      [exams[sourceExamIdx], exams[targetExamIdx]] = [exams[targetExamIdx], exams[sourceExamIdx]];
      return { schedule, exams };
    }

    return { schedule, exams };
  },

  /**
   * 5️⃣ EMPTY SLOT TO SUBJECT - إضافة مادة في خانة فارغة
   */
  addSubjectToSlot: (day, time, subjectData, globalSchedule) => {
    const newSchedule = [...globalSchedule];
    const existingIdx = newSchedule.findIndex(l => l.day === day && l.time.trim() === time.trim());
    
    if (existingIdx >= 0) {
      newSchedule[existingIdx] = { ...newSchedule[existingIdx], ...subjectData };
    } else {
      newSchedule.push({
        id: `lesson-${Date.now()}`,
        day,
        time,
        ...subjectData,
      });
    }
    
    return newSchedule;
  },

  /**
   * الحصول على قائمة الأوقات المتاحة من Template
   */
  getAvailableTimes: (schoolTemplate) => {
    return Array.from(new Set(schoolTemplate.map(s => s.startTime).filter(t => t))).sort();
  },

  /**
   * التحقق من حالة الخانة (فارغة/محجوزة/فسحة)
   */
  getSlotStatus: (slot) => {
    if (!slot) return 'empty';
    if (slot.isBreak || slot.reservedType === 'break') return 'break';
    if (slot.reservedType === 'rest') return 'rest';
    if (slot.reserved) return 'reserved';
    return 'empty';
  },
};
