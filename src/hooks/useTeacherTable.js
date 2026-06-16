import { useMemo, useCallback } from 'react';
// 🔥 تم إضافة getMasterTimeSlots هنا عشان المعلم يقرأ نفس توقيتات المسئول
import { getGlobalMaster, SyncAll, getSlotStatus, getActiveWeekDays, getMasterTimeSlots } from '../utils/dataManager';

export const useTeacherTable = ({ teacherProfile, globalSchedule, setGlobalSchedule, selectedClass }) => {
    // ✅ يتجدد عند كل تغيير في الجدول بدلاً من قراءة ثابتة عند التحميل
    const masterData = useMemo(() => getGlobalMaster(), [globalSchedule]);

    // 🔥 إصلاح: نمرر القيم الفعلية كـ dependency بدلاً من الـ object مباشرةً
    // لأن getGlobalMaster تُنشئ object جديد في كل مرة فيُبطل useMemo
    const masterTimeSlots = useMemo(() => {
        return getMasterTimeSlots(masterData.settings);
    }, [
        masterData.settings?.firstLessonStart,
        masterData.settings?.lessonDuration,
        masterData.settings?.lessonsPerDay,
        masterData.settings?.breakAfterPeriod,
        masterData.settings?.breakDuration
    ]);

    const bookSlot = useCallback((day, time) => {
        const lesson = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            instructor: teacherProfile.name,
            teacherId: teacherProfile.name.toLowerCase().replace(/\s+/g, '-'),
            subject: teacherProfile.specialization,
            day,
            time,
            stage: selectedClass,
            classCode: selectedClass,
            type: 'basic'
        };
        const newLessons = [...globalSchedule, lesson];
        setGlobalSchedule(newLessons);
        SyncAll({ ...getGlobalMaster(), lessons: newLessons });
    }, [teacherProfile, selectedClass, globalSchedule, setGlobalSchedule]);

    const removeSlot = useCallback((id) => {
        const newLessons = globalSchedule.filter(l => l.id !== id);
        setGlobalSchedule(newLessons);
        SyncAll({ ...getGlobalMaster(), lessons: newLessons });
    }, [globalSchedule, setGlobalSchedule]);

    const moveSlot = useCallback((id, newDay, newTime) => {
        const master = getGlobalMaster();
        const lessonIndex = master.lessons.findIndex(l => l.id === id);
        if (lessonIndex > -1) {
            // clone آمن لتجنب التعديل بالمرجع على الـ state الأصلية
            const updatedLessons = master.lessons.map(l => ({ ...l }));
            updatedLessons[lessonIndex].day = newDay;
            updatedLessons[lessonIndex].time = newTime;
            setGlobalSchedule(updatedLessons);
            SyncAll({ ...master, lessons: updatedLessons });
        }
    }, [setGlobalSchedule]);

    return {
        GRID_DAYS: getActiveWeekDays(),
        masterTimeSlots,
        getCellState: (day, time) => getSlotStatus(teacherProfile.name, day, time, selectedClass),
        bookSlot,
        removeSlot,
        moveSlot
    };
};