import { Book, Calculator, Globe, FlaskConical, Laptop, Dumbbell, Palette, Music, FileText } from 'lucide-react';

export const getSubjectIcon = (subject) => {
    if (!subject) return <Book size={18} />;
    const s = subject.toLowerCase();
    if (s.includes('رياضيات') || s.includes('حساب')) return <Calculator size={18} />;
    if (s.includes('عربي') || s.includes('لغة عربية') || s.includes('لغتي')) return <Book size={18} />;
    if (s.includes('انجليزي') || s.includes('english')) return <Globe size={18} />;
    if (s.includes('علوم') || s.includes('فيزياء') || s.includes('كيمياء') || s.includes('أحياء')) return <FlaskConical size={18} />;
    if (s.includes('حاسب') || s.includes('كمبيوتر')) return <Laptop size={18} />;
    if (s.includes('بدنية') || s.includes('العاب') || s.includes('تربية رياضية')) return <Dumbbell size={18} />;
    if (s.includes('فنية') || s.includes('رسم')) return <Palette size={18} />;
    if (s.includes('موسيقى')) return <Music size={18} />;
    return <FileText size={18} />;
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
    if (s.includes('إسلامية') || s.includes('دين') || s.includes('قرآن')) return 'from-teal-600 to-teal-500 border-teal-400';
    if (s.includes('اجتماعيات') || s.includes('تاريخ') || s.includes('جغرافيا')) return 'from-amber-600 to-amber-500 border-amber-400';
    if (s.includes('فنية') || s.includes('رسم')) return 'from-pink-600 to-pink-500 border-pink-400';

    // اللون الافتراضي لأي مادة تانية
    return 'from-slate-600 to-slate-500 border-slate-400';
};