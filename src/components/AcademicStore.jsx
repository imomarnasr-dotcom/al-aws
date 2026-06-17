import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingCart, Award, Sparkles, Star } from 'lucide-react';
import { getStudentDynamicPoints } from '../utils/dataManager';
import { STORE_ITEMS } from '../App';

const AcademicStore = ({ student, onClose }) => {
  const [selectedCategory, setSelectedCategory] = useState('all');

  const [activeItems, setActiveItems] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('moo_active_store_items') || '{}')[student?.personal?.id] || {};
    } catch { return {}; }
  });

  const studentId = student?.personal?.id;
  const studentClass = student?.personal?.class;
  
  const totalPoints = getStudentDynamicPoints(studentId, studentClass);
  const spentPoints = JSON.parse(localStorage.getItem('moo_spent_points') || '{}')[studentId] || 0;
  const availablePoints = Math.max(0, totalPoints - spentPoints);
  
  const purchased = JSON.parse(localStorage.getItem('moo_store_purchases') || '{}')[studentId] || [];

  const handleEquip = (item) => {
    const allActive = JSON.parse(localStorage.getItem('moo_active_store_items') || '{}');
    if (!allActive[studentId]) allActive[studentId] = {};
    
    // Toggle
    if (allActive[studentId][item.category] === item.id) {
       if (item.category === 'theme') {
          document.documentElement.style.setProperty('--primary-color', '#7C3AED');
          document.documentElement.style.setProperty('--primary-rgb', '124, 58, 237');
          localStorage.removeItem('moo_theme_color');
          window.dispatchEvent(new Event('storage')); window.dispatchEvent(new CustomEvent('moo-sync'));
       }
       delete allActive[studentId][item.category];
    } else {
       allActive[studentId][item.category] = item.id;
       if (item.category === 'theme') {
          document.documentElement.style.setProperty('--primary-color', item.hex);
          document.documentElement.style.setProperty('--primary-rgb', item.rgb);
          localStorage.setItem('moo_theme_color', JSON.stringify({ hex: item.hex, rgb: item.rgb }));
          window.dispatchEvent(new Event('storage')); window.dispatchEvent(new CustomEvent('moo-sync'));
       }
    }
    
    localStorage.setItem('moo_active_store_items', JSON.stringify(allActive));
    setActiveItems(allActive[studentId]);
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new CustomEvent('moo-sync', { detail: { action: 'equip' } }));
  };

  const handlePurchase = (item) => {
    if (availablePoints < item.cost) return;
    if (purchased.includes(item.id)) return;

    // خصم النقاط
    const allSpent = JSON.parse(localStorage.getItem('moo_spent_points') || '{}');
    allSpent[studentId] = (allSpent[studentId] || 0) + item.cost;
    localStorage.setItem('moo_spent_points', JSON.stringify(allSpent));
    window.dispatchEvent(new Event('storage')); window.dispatchEvent(new CustomEvent('moo-sync'));

    // إضافة للمشتريات
    const purchases = JSON.parse(localStorage.getItem('moo_store_purchases') || '{}');
    if (!purchases[studentId]) purchases[studentId] = [];
    purchases[studentId].push(item.id);
    localStorage.setItem('moo_store_purchases', JSON.stringify(purchases));
    window.dispatchEvent(new Event('storage')); window.dispatchEvent(new CustomEvent('moo-sync'));

    // Auto-equip the newly purchased item
    handleEquip(item);

    // تحديث الأوسمة المثبتة إذا لم يكن ثيم أو إطار
    try {
      let pinned = JSON.parse(localStorage.getItem('moo_pinned_badges')) || ['طالب مثالي', 'نجم الأسبوع', 'متميز علمياً', 'أخلاق عالية'];
      if (!pinned.includes(item.name) && item.category !== 'theme' && item.category !== 'frame') {
        const myBadgesList = JSON.parse(localStorage.getItem('moo_badges') || '[]');
        const unownedIdx = pinned.findIndex(p => !myBadgesList.includes(p) && !purchases[studentId].some(id => STORE_ITEMS.find(s => s.id === id)?.name === p));
        if (unownedIdx !== -1) {
          pinned[unownedIdx] = item.name;
        } else {
          pinned.unshift(item.name);
          pinned = pinned.slice(0, 4);
        }
        localStorage.setItem('moo_pinned_badges', JSON.stringify(pinned));
        window.dispatchEvent(new Event('storage')); window.dispatchEvent(new CustomEvent('moo-sync'));
      }
    } catch (e) {}

    // Trigger storage event to update App.jsx
    window.dispatchEvent(new Event('storage')); 
    window.dispatchEvent(new CustomEvent('moo-sync', { detail: { action: 'purchase' } }));
  };

  const filteredItems = STORE_ITEMS.filter(item => selectedCategory === 'all' || item.category === selectedCategory);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm"
      />

      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="relative bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="bg-primary p-6 text-white flex justify-between items-center relative overflow-hidden shrink-0">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
          <div className="relative z-10">
            <h2 className="text-2xl font-black flex items-center gap-3">
              <ShoppingCart className="w-8 h-8" />
              متجر التمييز
            </h2>
            <p className="text-primary-100 mt-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              استبدل نقاطك بمكافآت حصرية
            </p>
          </div>
          <div className="relative z-10 flex flex-col items-end">
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors mb-2">
              <X className="w-6 h-6" />
            </button>
            <div className="bg-white/20 px-4 py-2 rounded-2xl backdrop-blur-sm border border-white/30 flex items-center gap-2">
              <span className="text-sm">رصيدك:</span>
              <span className="font-bold text-xl">{availablePoints}</span>
              <Star className="w-5 h-5 text-yellow-300 fill-yellow-300" />
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="flex p-4 gap-2 overflow-x-auto shrink-0 border-b border-gray-100 no-scrollbar">
          {[
            { id: 'all', name: 'الكل' },
            { id: 'title', name: 'الألقاب' },
            { id: 'frame', name: 'الإطارات' },
            { id: 'theme', name: 'الألوان' },
            { id: 'emoji', name: 'الإيموجي' },
          ].map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-5 py-2 rounded-full whitespace-nowrap font-bold transition-all ${
                selectedCategory === cat.id
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Items Grid */}
        <div className="p-6 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {filteredItems.map(item => {
                const isPurchased = purchased.includes(item.id);
                const canAfford = availablePoints >= item.cost;
                const isEquipped = activeItems[item.category] === item.id;

                return (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className={`relative p-5 rounded-2xl border-2 transition-all duration-300 ${
                      isEquipped 
                        ? 'bg-green-50 border-green-500 shadow-lg shadow-green-100'
                        : isPurchased 
                          ? 'bg-white border-gray-200 hover:border-gray-300' 
                          : canAfford
                            ? 'bg-white border-gray-100 hover:border-primary hover:shadow-xl'
                            : 'bg-gray-50 border-gray-100 opacity-75'
                    }`}
                  >
                    {isEquipped && (
                      <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded-md font-bold shadow-sm">
                        مُفعل حالياً
                      </div>
                    )}
                    <div className="flex justify-between items-start mb-4 mt-2">
                      <div className="text-4xl bg-gray-50 w-16 h-16 flex items-center justify-center rounded-2xl shadow-sm">
                        {item.icon}
                      </div>
                      {!isPurchased && (
                        <div className="bg-orange-100 text-orange-600 px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1 shadow-sm">
                          {item.cost} <Star className="w-4 h-4 fill-current" />
                        </div>
                      )}
                    </div>

                    <h3 className="font-bold text-lg text-gray-900 mb-1">{item.name}</h3>
                    <p className="text-sm text-gray-500 mb-6 line-clamp-2">{item.desc}</p>

                    <button
                      onClick={() => isPurchased ? handleEquip(item) : handlePurchase(item)}
                      disabled={!isPurchased && !canAfford}
                      className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                        isEquipped
                          ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
                          : isPurchased
                            ? 'bg-green-500 text-white hover:bg-green-600 shadow-md'
                            : canAfford
                              ? 'bg-primary text-white hover:bg-primary-dark active:scale-95 shadow-md hover:shadow-lg'
                              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {isEquipped ? (
                        <>إلغاء التفعيل ✕</>
                      ) : isPurchased ? (
                        <>تفعيل ✓</>
                      ) : canAfford ? (
                        <>شراء الآن</>
                      ) : (
                        <>نقاط غير كافية</>
                      )}
                    </button>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AcademicStore;

