import { ShoppingBag, Clock, TrendingDown, Wallet, ShoppingCart, CheckCircle2, CupSoda, Sandwich, Apple, Pizza, Search, CreditCard, X, Ticket } from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import PropTypes from 'prop-types';

const CafeteriaView = ({ studentData, cart, setCart, searchQuery = '', studentBalance }) => {
  const [transactions, setTransactions] = useState([]);
  const [liveMenu, setLiveMenu] = useState([]);
  const [activeTab, setActiveTab] = useState('menu');
  const [showRechargeModal, setShowRechargeModal] = useState(false);

  // Sync Data Safety
  useEffect(() => {
    const handleSync = () => {
      try {
        const menuData = JSON.parse(localStorage.getItem('moo_cafeteria_menu')) || [];
        setLiveMenu(menuData);

        const ordersData = JSON.parse(localStorage.getItem('moo_cafeteria_orders')) || [];
        const myId = studentData?.personal?.id;
        if (myId) {
          const myOrders = ordersData.filter(o => o.studentId === myId).slice(0, 50);
          setTransactions(myOrders);
        }
      } catch(e) {
        // Fallback silently
      }
    };

    handleSync();
    window.addEventListener('storage', handleSync);
    window.addEventListener('moo-sync', handleSync);
    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('moo-sync', handleSync);
    };
  }, [studentData?.personal?.id]);

  const filteredMenu = useMemo(() => {
    if (!searchQuery.trim()) return liveMenu;
    return liveMenu.filter(item =>
      item.name.includes(searchQuery) || item.category.includes(searchQuery)
    );
  }, [liveMenu, searchQuery]);

  const addToCart = (item) => {
    const existing = cart.find(c => c.id === item.id);
    if (existing) {
      if (existing.cartQuantity >= item.quantity) {
        window.dispatchEvent(new CustomEvent('moo-toast', { detail: { message: '����� �� ���� ���� ����� �� ������ ���� �����.', type: 'error' } }));
        return;
      }
      setCart(cart.map(c => c.id === item.id ? { ...c, cartQuantity: c.cartQuantity + 1 } : c));
    } else {
      if (item.quantity <= 0) {
        window.dispatchEvent(new CustomEvent('moo-toast', { detail: { message: '���� ������.', type: 'error' } }));
        return;
      }
      setCart([...cart, { ...item, cartQuantity: 1 }]);
    }
  };

  const getCategoryIcon = (cat) => {
     if(cat === 'مشروبات') return <CupSoda size={18} />;
     if(cat === 'معجنات') return <Pizza size={18} />;
     if(cat === 'تسالي') return <Apple size={18} />;
     return <Sandwich size={18} />;
  };

  const todaySpent = useMemo(() => {
     const todayStr = new Date().toISOString().split('T')[0];
     return transactions
       .filter(t => t.date && t.date.startsWith(todayStr))
       .reduce((sum, t) => sum + (Number(t.total) || 0), 0);
  }, [transactions]);

  const formatLocalizedDate = (isoString) => {
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return isoString; // fallback
      return date.toLocaleString('ar-SA', { 
        year: 'numeric', month: '2-digit', day: '2-digit', 
        hour: '2-digit', minute: '2-digit', hour12: true 
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="flex-1 space-y-8 pb-10">

      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black flex items-center gap-3 text-slate-800">
            <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-500 shadow-inner">
              <ShoppingCart size={26} strokeWidth={2.5} />
            </div>
            مقصف المدرسة
          </h1>
          <p className="text-slate-500 mt-2 font-medium">اطلب وجبتك إلكترونياً واستلمها فوراً</p>
        </div>

        <div className="flex gap-2 bg-white/60 backdrop-blur-xl p-1.5 rounded-2xl border border-white shadow-sm">
          {[
            { id: 'menu', label: 'قائمة الطعام', icon: <ShoppingBag size={18} /> },
            { id: 'transactions', label: 'سجل طلباتي', icon: <Clock size={18} /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === tab.id
                  ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                  : 'text-slate-500 hover:bg-orange-50 hover:text-orange-600'
                }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 relative group overflow-hidden bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-8 shadow-xl shadow-emerald-500/20">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:scale-150 transition-transform duration-700" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20">
                <Wallet className="text-white w-5 h-5" />
              </div>
              <p className="text-white/80 text-xs font-bold uppercase tracking-widest">رصيد المحفظة</p>
            </div>
            <div className="mb-8">
              <p className="text-4xl font-black text-white mb-1 tabular-nums drop-shadow-md">
                {(studentBalance || 0).toFixed(2)}
              </p>
              <p className="text-white/80 text-sm font-medium">ريال سعودي</p>
            </div>
            <button onClick={() => setShowRechargeModal(true)} className="w-full bg-white text-emerald-600 py-3.5 rounded-xl font-bold text-sm transition-all active:scale-95 shadow-lg shadow-black/5 hover:bg-emerald-50">
              شحن الرصيد
            </button>
          </div>
        </div>

        <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 flex flex-col justify-center items-center text-center group hover:border-orange-200 transition-colors">
            <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-500 mb-4 group-hover:scale-110 transition-transform">
              <TrendingDown size={28} />
            </div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">مصروفات اليوم</p>
            <p className="text-2xl font-black text-slate-800">
              {todaySpent.toFixed(2)} ر.س
            </p>
          </div>
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 flex flex-col justify-center items-center text-center group hover:border-blue-200 transition-colors">
            <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500 mb-4 group-hover:scale-110 transition-transform">
              <Ticket size={28} />
            </div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">إجمالي الطلبات</p>
            <p className="text-2xl font-black text-slate-800">{transactions.length}</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {activeTab === 'menu' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {(filteredMenu || []).map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col h-full overflow-hidden relative"
            >
              {item.quantity === 0 && (
                 <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center">
                    <span className="bg-rose-500 text-white font-bold px-4 py-1.5 rounded-full shadow-lg rotate-12 text-sm">نفذت الكمية</span>
                 </div>
              )}
              <div className="relative mb-6 text-center bg-slate-50 rounded-2xl p-6 group-hover:bg-orange-50 transition-colors">
                <span className="text-6xl inline-block drop-shadow-sm group-hover:scale-110 transition-transform duration-300">{item.icon}</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-3">
                  <span className="flex items-center gap-1 text-[10px] font-bold px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-600">
                    {getCategoryIcon(item.category)}
                    {item.category}
                  </span>
                  <p className="font-black text-orange-500 text-xl tabular-nums drop-shadow-sm">{item.price} <span className="text-[10px] font-bold text-slate-400">ر.س</span></p>
                </div>
                <h3 className="text-lg font-black text-slate-800 mb-1">{item.name}</h3>
                <p className={`text-xs font-bold ${item.quantity > 0 ? 'text-emerald-500' : 'text-rose-500'} mb-6`}>
                  {item.quantity > 0 ? `الكمية المتاحة: ${item.quantity}` : 'مباع بالكامل'}
                </p>
              </div>
              <button
                onClick={() => addToCart(item)}
                disabled={item.quantity <= 0}
                className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm transition-all duration-300 ${item.quantity > 0
                    ? 'bg-slate-900 text-white hover:bg-orange-500 hover:shadow-lg hover:shadow-orange-500/30 active:scale-95'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  }`}
              >
                {item.quantity > 0 ? (
                  <>
                    <ShoppingCart size={18} />
                    إضافة للسلة
                  </>
                ) : (
                  'غير متاح'
                )}
              </button>
            </div>
          ))}
          {filteredMenu.length === 0 && (
            <div className="col-span-full py-24 text-center bg-white rounded-3xl border border-slate-100 border-dashed">
              <div className="w-20 h-20 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search size={32} />
              </div>
              <p className="text-slate-500 font-bold text-lg">لا توجد أصناف مطابقة للبحث أو المقصف فارغ حالياً.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-sm overflow-hidden border border-slate-100">
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">رقم الطلب</th>
                  <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">محتوى الطلب</th>
                  <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">التاريخ والوقت</th>
                  <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">السعر</th>
                  <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-5">
                       <span className="font-mono text-xs font-bold text-slate-400">#{tx.id.toString().slice(-6)}</span>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-lg shadow-sm border border-orange-100">🍽️</div>
                        <span className="font-bold text-slate-700 text-sm">{tx.items || 'طلب مقصف'}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                       <span className="text-xs text-slate-500 font-bold bg-slate-100 px-3 py-1.5 rounded-lg">
                          {formatLocalizedDate(tx.date)}
                       </span>
                    </td>
                    <td className="px-8 py-5">
                       <span className="font-black text-rose-500 text-sm bg-rose-50 px-3 py-1.5 rounded-lg">-{Number(tx.total).toFixed(2)} ر.س</span>
                    </td>
                    <td className="px-8 py-5">
                      {tx.status === 'pending' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 text-slate-600 rounded-lg text-xs font-bold border border-slate-200">
                          <Clock size={14} /> في انتظار التجهيز
                        </span>
                      ) : tx.status === 'ready' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 text-orange-600 rounded-lg text-xs font-bold border border-orange-200">
                          <CheckCircle2 size={14} /> تم التجهيز
                        </span>
                      ) : tx.status === 'completed' || tx.source === 'pos' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-bold border border-emerald-100">
                          <CheckCircle2 size={14} /> مكتمل
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-600 rounded-lg text-xs font-bold border border-rose-100">
                          <X size={14} /> تم الإلغاء
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {transactions.length === 0 && (
            <div className="p-24 text-center text-slate-400 font-bold">
               <div className="w-20 h-20 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-4">
                 <Clock size={32} />
               </div>
               لا توجد عمليات شراء سابقة.
            </div>
          )}
        </div>
      )}

      {/* Recharge Modal */}
      {showRechargeModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white max-w-sm w-full rounded-[32px] p-8 shadow-2xl text-center relative border border-white animate-scale-in">
            <button 
              onClick={() => setShowRechargeModal(false)}
              className="absolute top-6 left-6 text-slate-400 hover:text-rose-500 hover:bg-rose-50 p-2 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
            <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border border-emerald-100">
              <CreditCard size={32} />
            </div>
            <h3 className="text-2xl font-black text-slate-800 mb-2">شحن الرصيد</h3>
            <p className="text-slate-500 font-medium text-sm mb-8 leading-relaxed">
              يرجى التوجه إلى أمين الصندوق أو الشؤون المالية لتعبئة رصيد المحفظة الإلكترونية الخاصة بك.
            </p>
            <button 
              onClick={() => setShowRechargeModal(false)}
              className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold text-sm hover:shadow-lg hover:-translate-y-1 transition-all"
            >
              حسناً، فهمت
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

CafeteriaView.propTypes = {
  studentData: PropTypes.object,
  cart: PropTypes.array.isRequired,
  setCart: PropTypes.func.isRequired,
  searchQuery: PropTypes.string,
  studentBalance: PropTypes.number
};

export default CafeteriaView;