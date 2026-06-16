const fs = require('fs');

const path = 'c:/al aws done/moo_project/src/components/CafeteriaAdminDashboard.jsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add Search and Filter to imports
if (!content.includes('Search,')) {
    content = content.replace('import {', 'import {\n  Search, Filter, Check,');
}

// 2. Add state
const stateInjection =     const [activeTab, setActiveTab] = useState('pos'); // pos, inventory, orders
    const [searchOrders, setSearchOrders] = useState('');
    const [filterGrade, setFilterGrade] = useState('');;

content = content.replace("    const [activeTab, setActiveTab] = useState('pos'); // pos, inventory, orders", stateInjection);

// 3. Add handleDeliverOrder and filteredOrders
const functionsInjection =     const stats = useMemo(() => {;
const functionsReplacement = 
    const handleDeliverOrder = (orderId) => {
      const updated = orders.map(o => o.id === orderId ? { ...o, status: 'completed' } : o);
      updateOrdersState(updated);
      playSound('success');
      window.dispatchEvent(new CustomEvent('moo-toast', { detail: { message: ' „  ”·Ì„ «·ÿ·» ··ÿ«·» »‰Ã«Õ!', type: 'success' } }));
    };

    const filteredOrders = useMemo(() => {
      return orders.filter(o => {
        const term = searchOrders.toLowerCase();
        const matchSearch = !term || (o.studentName?.toLowerCase().includes(term)) || (o.studentId?.toLowerCase().includes(term));
        const matchGrade = !filterGrade || o.studentGrade === filterGrade;
        return matchSearch && matchGrade;
      });
    }, [orders, searchOrders, filterGrade]);

    const stats = useMemo(() => {;

content = content.replace(functionsInjection, functionsReplacement);

// 4. Update the Orders Tab UI Header
const headerInjection =                 <h2 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
                  <BellRing size={20} className="text-orange-500" /> ”Ã· «·ÿ·»«  «·‘«„·
                </h2>;

const headerReplacement =                 <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
                  <h2 className="text-lg font-black text-slate-800 flex items-center gap-2 shrink-0">
                    <BellRing size={20} className="text-orange-500" /> ”Ã· «·ÿ·»«  Ê«· ÃÂÌ“
                  </h2>
                  <div className="flex w-full md:w-auto items-center gap-3">
                    <div className="relative flex-1 md:w-64">
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input 
                        type="text" 
                        placeholder="«»ÕÀ »«”„ «·ÿ«·» √Ê «·„⁄—›..." 
                        value={searchOrders}
                        onChange={(e) => setSearchOrders(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl h-10 pl-4 pr-10 text-sm font-bold text-slate-700 outline-none focus:border-orange-500 transition-all"
                      />
                    </div>
                    <div className="relative shrink-0">
                      <Filter className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <select 
                        value={filterGrade}
                        onChange={(e) => setFilterGrade(e.target.value)}
                        className="bg-slate-50 border border-slate-200 rounded-xl h-10 pl-4 pr-10 text-sm font-bold text-slate-700 outline-none focus:border-orange-500 transition-all appearance-none cursor-pointer"
                      >
                        <option value="">Ã„Ì⁄ «·›’Ê·</option>
                        <option value="√Ê· √">√Ê· √</option>
                        <option value="√Ê· »">√Ê· »</option>
                        <option value="À«‰Ì √">À«‰Ì √</option>
                        <option value="À«·À √">À«·À √</option>
                        <option value="—«»⁄ √">—«»⁄ √</option>
                        <option value="Œ«„” √">Œ«„” √</option>
                        <option value="”«œ” √">”«œ” √</option>
                      </select>
                    </div>
                  </div>
                </div>;

content = content.replace(headerInjection, headerReplacement);

// 5. Replace mapped array
content = content.replace(/{orders\.length === 0 \?/g, "{filteredOrders.length === 0 ?");
content = content.replace(/{orders\.map\(order => \(/g, "{filteredOrders.map(order => (");

// 6. Add Deliver Button inside mapping
const deliverBtnInjection =                         {order.source === 'pos' && (
                          <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[9px] font-black px-3 py-1 rounded-bl-xl shadow-sm z-10">»Ì⁄ „»«‘—</div>
                        )};

const deliverBtnReplacement =                         {order.source === 'pos' ? (
                          <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[9px] font-black px-3 py-1 rounded-bl-xl shadow-sm z-10">»Ì⁄ „»«‘—</div>
                        ) : order.status === 'pending' ? (
                          <div className="absolute top-0 right-0 bg-orange-500 text-white text-[9px] font-black px-3 py-1 rounded-bl-xl shadow-sm z-10 animate-pulse">ﬁÌœ «· ÃÂÌ“</div>
                        ) : (
                          <div className="absolute top-0 right-0 bg-blue-500 text-white text-[9px] font-black px-3 py-1 rounded-bl-xl shadow-sm z-10"> „ «· ”·Ì„ „”»ﬁ«</div>
                        )};

content = content.replace(deliverBtnInjection, deliverBtnReplacement);

// 7. Add Deliver button action
const refundBtnInjection =                             <button onClick={() => handleRefundOrder(order.id)} className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-rose-600 bg-slate-100 hover:bg-rose-50 px-3 py-1.5 rounded-lg transition-colors">
                              <RefreshCcw size={14} /> «” —Ã«⁄
                            </button>;

const refundBtnReplacement =                             <div className="flex gap-2">
                              {order.source === 'student_portal' && order.status === 'pending' && (
                                <button onClick={() => handleDeliverOrder(order.id)} className="flex items-center gap-1 text-xs font-black text-emerald-600 hover:text-white bg-emerald-100 hover:bg-emerald-500 px-3 py-1.5 rounded-lg transition-colors shadow-sm">
                                  <Check size={14} />  ÃÂÌ“ Ê ”·Ì„
                                </button>
                              )}
                              <button onClick={() => handleRefundOrder(order.id)} className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-rose-600 bg-slate-100 hover:bg-rose-50 px-3 py-1.5 rounded-lg transition-colors">
                                <RefreshCcw size={14} /> «” —Ã«⁄
                              </button>
                            </div>;

content = content.replace(refundBtnInjection, refundBtnReplacement);

fs.writeFileSync(path, content, 'utf8');
