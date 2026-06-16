export const getSubjectIcon = (subject) => {
    if (!subject) return '📚';
    const s = subject.toLowerCase();
    if (s.includes('رياضيات') || s.includes('حساب')) return '🧮';
    if (s.includes('عربي') || s.includes('لغة عربية') || s.includes('لغتي')) return '📖';
    if (s.includes('انجليزي') || s.includes('english')) return '🌍';
    if (s.includes('علوم') || s.includes('فيزياء') || s.includes('كيمياء') || s.includes('أحياء')) return '🧪';
    if (s.includes('حاسب') || s.includes('كمبيوتر')) return '💻';
    if (s.includes('بدنية') || s.includes('العاب') || s.includes('تربية رياضية')) return '⚽';
    if (s.includes('فنية') || s.includes('رسم')) return '🎨';
    if (s.includes('موسيقى')) return '🎵';
    if (s.includes('إسلامية') || s.includes('دين') || s.includes('قرآن') || s.includes('توحيد') || s.includes('فقه')) return '🕌';
    if (s.includes('اجتماعيات') || s.includes('تاريخ') || s.includes('جغرافيا') || s.includes('وطنية')) return '🗺️';
    return '📚';
};

// 🔥 الميزة الجديدة: الألوان الذكية للمواد
export const getSubjectColor = (subject) => {
    if (!subject) return 'from-gray-500 to-gray-600 border-gray-400'; // رمادي للمجهول
    const s = subject.toLowerCase();
    if (s.includes('رياضيات') || s.includes('حساب')) return 'from-blue-600 to-blue-500 border-blue-400';
    if (s.includes('عربي') || s.includes('لغتي')) return 'from-emerald-600 to-emerald-500 border-emerald-400';
    if (s.includes('انجليزي') || s.includes('english')) return 'from-indigo-600 to-indigo-500 border-indigo-400';
    if (s.includes('علوم') || s.includes('فيزياء') || s.includes('كيمياء') || s.includes('أحياء')) return 'from-purple-600 to-purple-500 border-purple-400';
    if (s.includes('حاسب') || s.includes('كمبيوتر')) return 'from-cyan-600 to-cyan-500 border-cyan-400';
    if (s.includes('بدنية') || s.includes('رياضة')) return 'from-orange-500 to-orange-400 border-orange-300';
    if (s.includes('إسلامية') || s.includes('دين') || s.includes('قرآن') || s.includes('توحيد') || s.includes('فقه')) return 'from-teal-600 to-teal-500 border-teal-400';
    if (s.includes('اجتماعيات') || s.includes('تاريخ') || s.includes('جغرافيا') || s.includes('وطنية')) return 'from-amber-600 to-amber-500 border-amber-400';
    if (s.includes('فنية') || s.includes('رسم')) return 'from-pink-600 to-pink-500 border-pink-400';

    // اللون الافتراضي لأي مادة تانية
    return 'from-slate-600 to-slate-500 border-slate-400';
};