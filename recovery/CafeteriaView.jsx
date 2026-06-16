Created At: 2026-06-13T04:23:33Z
Completed At: 2026-06-13T04:23:33Z
File Path: `file:///c:/al%20aws%20done/moo_project/src/components/CafeteriaView.jsx`
Total Lines: 318
Total Bytes: 15483
Showing lines 1 to 318
The following code has been modified to include a line number before every line, in the format: <line_number>: <original_line>. Please note that any changes targeting the original code should remove the line number, colon, and leading space.
1: import { CreditCard, ShoppingBag, Clock, TrendingDown, Wallet, Plus, Trash2, CheckCircle2, ShoppingCart, X } from 'lucide-react';
2: import { useState, useMemo, useEffect } from 'react';
3: import PropTypes from 'prop-types';
4: 
5: const CafeteriaView = ({ studentData, cart, setCart, searchQuery, studentBalance }) => {
6:   // ✅ حماية Crash: cafeteria و transactions بـ fallback آمن
7:   const cafeteria = studentData?.cafeteria ?? {};
8: 
9:   // 🔥 إصلاح: نقرأ الطلبات الحقيقية من moo_cafeteria_orders بدل البيانات الوهمية
10:   const [transactions, setTransactions] = useState(() => {
11:     try {
12:       const allOrders = JSON.parse(localStorage.getItem('moo_cafeteria_orders') || '[]');
13:       const myId = studentData?.personal?.id;
14:       return myId
15:         ? allOrders.filter(o => o.studentId === myId).map(o => ({
16:             id: o.id,
17:             item: Array.isArray(o.items) ? o.items.map(i => i.name).join(', ') : o.items,
18:             date: o.date,
19:             time: o.date,
20:             price: o.total,
21:           }))
22:           .slice(0, 10)
23:         : [];
24:     } catch { return []; }
25:   });
26: 
27:   const [activeTab, setActiveTab] = useState('menu');
28:   const [showRechargeModal, setShowRechargeModal] = useState(false);
29:   const [liveMenu, setLiveMenu] = useState(() => {
30:     try {
31:       const saved = localStorage.getItem('moo_cafeteria_menu');
32:       return saved ? JSON.parse(saved) : (studentData?.cafeteria?.menu || []);
33:     } catch { return studentData?.cafeteria?.menu || []; }
34:   });
35: 
36:   // 🔗 مزامنة فورية عند تغيير موظف المقصف للقائمة
37:   useEffect(() => {
38:     const onStorage = (e) => {
39:       if (!e.key || e.key === 'moo_cafeteria_menu') {
40:         try {
41:           const saved = localStorage.getItem('moo_cafeteria_menu');
42:           if (saved) setLiveMenu(JSON.parse(saved));
43:         } catch { /* ignore */ }
44:       }
45:     };
46:     window.addEventListener('storage', onStorage);
47:     return () => window.removeEventListener('storage', onStorage);
48:   }, []);
49: 
50:   // 🔥 إصلاح: تحديث سجل المشتريات لما يحصل شراء جديد
51:   useEffect(() => {
52:     const refreshOrders = () => {
53:       try {
54:         const allOrders = JSON.parse(localStorage.getItem('moo_cafeteria_orders') || '[]');
55:         const myId = studentData?.personal?.id;
56:         if (!myId) return;
57:         setTransactions(
58:           allOrders.filter(o => o.studentId === myId).map(o => ({
59:             id: o.id,
60:             item: Array.isArray(o.items) ? o.items.map(i => i.name).join(', ') : o.items,
61:             date: o.date,
62:             time: o.date,
63:             price: o.total,
64:             status: 'مكتمل'
65:           })).slice(0, 10)
66:         );
67:       } catch { /* تجاهل */ }
68:     };
69:     window.addEventListener('moo-sync', refreshOrders);
70:     window.addEventListener('storage', refreshOrders);
71:     return () => {
72:       window.removeEventListener('moo-sync', refreshOrders);
73:       window.removeEventListener('storage', refreshOrders);
74:     };
75:   }, [studentData?.personal?.id]);
76: 
77:   const filteredMenu = useMemo(() => {
78:     const menu = liveMenu || [];
79:     if (!searchQuery.trim()) return menu;
80:     return menu.filter(item =>
81:       item.name.includes(searchQuery) || item.category.includes(searchQuery)
82:     );
83:   }, [liveMenu, searchQuery]);
84: 
85:   const addToCart = (item) => {
86:     const existing = cart.find(c => c.id === item.id);
87:     if (existing) {
88:       if (existing.cartQuantity >= item.quantity) {
89:         alert("لا يوجد كمية كافية في المخزون لإضافة المزيد.");
90:         return;
91:       }
92:       setCart(cart.map(c => c.id === item.id ? { ...c, cartQuantity: c.cartQuantity + 1 } : c));
93:     } else {
94:       if (item.quantity <= 0) {
95:         alert("نفذت الكمية.");
96:         return;
97:       }
98:       setCart([...cart, { ...item, cartQuantity: 1 }]);
99:     }
100:   };
101: 
102:   const categoryColors = {
103:     'ساندوتشات': 'bg-orange-100 text-orange-700',
104:     'معجنات': 'bg-yellow-100 text-yellow-700',
105:     'سلطات': 'bg-green-100 text-green-700',
106:     'مشروبات': 'bg-blue-100 text-blue-700',
107:     'حلويات': 'bg-pink-100 text-pink-700',
108:   };
109: 
110:   return (
111:     <div className="flex-1 space-y-8 pb-10">
112: 
113:       <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
114:         <div>
115:           <h1 className="text-3xl font-bold flex items-center gap-3">
116:             <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
117:               <ShoppingCart size={24} />
118:             </div>
119:             المقصف الإلكتروني
120:           </h1>
121:           <p className="text-gray-500 mt-2 font-medium">اطلب وجبتك بضغطة زر واحدة</p>
122:         </div>
123: 
124:         <div className="flex gap-2 glass-card p-1.5 rounded-2xl border border-white/40">
125:           {[
126:             { id: 'menu', label: 'قائمة الطعام', icon: <ShoppingBag size={18} /> },
127:             { id: 'transactions', label: 'سجل المشتريات', icon: <Clock size={18} /> },
128:           ].map((tab) => (
129:             <button
130:               key={tab.id}
131:               onClick={() => setActiveTab(tab.id)}
132:               className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === tab.id
133:                   ? 'bg-primary text-white shadow-lg'
134:                   : 'text-gray-500 hover:bg-primary/5 hover:text-primary'
135:                 }`}
136:             >
137:               {tab.icon}
138:               {tab.label}
139:             </button>
140:           ))}
141:         </div>
142:       </div>
143: 
144:       <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
145:         <div className="lg:col-span-4 relative group overflow-hidden bg-primary rounded-3xl p-8 shadow-lg shadow-primary/20">
146:           <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:scale-150 transition-transform duration-700" />
147:           <div className="relative z-10">
148:             <div className="flex items-center gap-3 mb-8">
149:               <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20">
150:                 <Wallet className="text-white w-6 h-6" />
151:               </div>
152:               <p className="text-white/60 text-xs font-bold uppercase tracking-widest">المحفظة الإلكترونية</p>
153:             </div>
154:             <div className="mb-8">
155:               <p className="text-4xl font-bold text-white mb-1 tabular-nums">
156:                 {(studentBalance || 0).toFixed(2)}
157:               </p>
158:               <p className="text-white/70 text-xs font-medium">ريال سعودي</p>
159:             </div>
160:             <button onClick={() => setShowRechargeModal(true)} className="w-full bg-white text-primary py-3.5 rounded-xl font-bold text-sm transition-all active:scale-95 shadow-lg hover:bg-gray-50">
161:               شحن الرصيد
162:             </button>
163:           </div>
164:         </div>
165: 
166:         <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
167:           <div className="glass-card rounded-3xl p-8 shadow-sm flex flex-col justify-center items-center text-center">
168:             <div className="w-14 h-14 bg-primary/5 rounded-2xl flex items-center justify-center text-primary mb-4 border border-primary/10">
169:               <TrendingDown size={28} />
170:             </div>
171:             <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">مصروفات اليوم</p>
172:             <p className="text-2xl font-bold text-gray-800">
173:               {transactions
174:                 .filter(t => t.date && t.date.startsWith(new Date().toISOString().split('T')[0]))
175:                 .reduce((sum, t) => sum + (Number(t.price) || 0), 0).toFixed(2)} ر.س
176:             </p>
177:           </div>
178:           <div className="glass-card rounded-3xl p-8 shadow-sm flex flex-col justify-center items-center text-center">
179:             <div className="w-14 h-14 bg-primary/5 rounded-2xl flex items-center justify-center text-primary mb-4 border border-primary/10">
180:               <CheckCircle2 size={28} />
181:             </div>
182:             <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">العمليات المنفذة</p>
183:             <p className="text-2xl font-bold text-gray-800">{transactions.length}</p>
184:           </div>
185:         </div>
186:       </div>
187: 
188:       {activeTab === 'menu' ? (
189:         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
190:           {(filteredMenu || []).map((item) => (
191:             <div
192:               key={item.id}
193:               className="glass-card rounded-3xl p-6 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 group flex flex-col h-full"
194:             >
195:               <div className="relative mb-6 text-center">
196:                 <span className="text-6xl inline-block drop-shadow-md group-hover:scale-110 transition-transform">{item.icon}</span>
197:               </div>
198:               <div className="flex-1">
199:                 <div className="flex items-center justify-between mb-3">
200:                   <span className={`text-[9px] font-bold px-2.5 py-1 rounded-full ${categoryColors[item.category] || 'bg-gray-100 text-gray-700'}`}>
201:                     {item.category}
202:                   </span>
203:                   <p className="font-bold text-primary text-lg tabular-nums">{item.price} <span className="text-[10px]">ر.س</span></p>
204:                 </div>
205:                 <h3 className="text-base font-bold text-gray-800 mb-2">{item.name}</h3>
206:                 <p className={`text-[10px] font-bold ${item.quantity > 0 ? 'text-emerald-500' : 'text-red-500'} mb-4`}>
207:                   {item.quantity > 0 ? `الكمية المتاحة: ${item.quantity}` : 'نفذت الكمية'}
208:                 </p>
209:               </div>
210:               <button
211:                 onClick={() => addToCart(item)}
212:                 disabled={item.quantity <= 0}
213:                 className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm transition-all duration-300 border ${item.quantity > 0
214:                     ? 'bg-primary/5 text-primary hover:bg-primary hover:text-white border-primary/10 active:scale-95'
215:                     : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
216:                   }`}
217:               >
218:                 {item.quantity > 0 ? (
219:                   <>
220:                     <ShoppingCart size={16} />
221:                     إضافة للسلة
222:                   </>
223:                 ) : (
224:                   'نفذت الكمية'
225:                 )}
226:               </button>
227:             </div>
228:           ))}
229:           {filteredMenu.length === 0 && (
230:             <div className="col-span-full py-20 text-center glass-card rounded-3xl">
231:               <p className="text-gray-400 font-bold">لا توجد نتائج مطابقة لبحثك.</p>
232:             </div>
233:           )}
234:         </div>
235:       ) : (
236:         <div className="glass-card rounded-3xl shadow-sm overflow-hidden border border-white/20">
237:           <div className="overflow-x-auto">
238:             <table className="w-full text-right">
239:               <thead>
240:                 <tr className="bg-primary/5 border-b border-gray-100">
241:                   <th className="px-8 py-5 text-xs font-bold text-primary uppercase tracking-widest">الوجبة</th>
242:                   <th className="px-8 py-5 text-xs font-bold text-primary uppercase tracking-widest">التوقيت</th>
243:                   <th className="px-8 py-5 text-xs font-bold text-primary uppercase tracking-widest">السعر</th>
244:                   <th className="px-8 py-5 text-xs font-bold text-primary uppercase tracking-widest">الحالة</th>
245:                   <th className="px-8 py-5 text-xs font-bold text-primary uppercase tracking-widest">الإجراء</th>
246:                 </tr>
247:               </thead>
248:               <tbody className="divide-y divide-gray-50">
249:                 {transactions.map((tx) => (
250:                   <tr key={tx.id} className="hover:bg-primary/5 transition-colors group">
251:                     <td className="px-8 py-5">
252:                       <div className="flex items-center gap-3">
253:                         <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-lg border border-gray-100 shadow-sm">🍽️</div>
254:                         <span className="font-bold text-gray-800 text-sm">{tx.item}</span>
255:                       </div>
256:                     </td>
257:                     <td className="px-8 py-5 text-sm text-gray-500 font-medium">{tx.date} — {tx.time}</td>
258:                     <td className="px-8 py-5 font-bold text-red-500 text-sm">-{tx.price.toFixed(2)} ر.س</td>
259:                     <td className="px-8 py-5">
260:                       <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-600 rounded-full text-[10px] font-bold border border-green-100">
261:                         <CheckCircle2 size={12} /> {tx.status}
262:                       </span>
263:                     </td>
264:                     <td className="px-8 py-5">
265:                       <button className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all active:scale-90">
266:                         <Trash2 size={16} />
267:                       </button>
268:                     </td>
269:                   </tr>
270:                 ))}
271:               </tbody>
272:             </table>
273:           </div>
274:           {transactions.length === 0 && (
275:             <div className="p-20 text-center text-gray-400 font-bold">لا توجد عمليات شراء سابقة.</div>
276:           )}
277:         </div>
278:       )}
279: 
280:       {/* 💳 نافذة شحن الرصيد العائمة */}
281:       {showRechargeModal && (
282:         <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 animate-fade-in">
283:           <div className="bg-white max-w-sm w-full rounded-[32px] p-8 shadow-2xl text-center relative border border-white scale-in">
284:             <button 
285:               onClick={() => setShowRechargeModal(false)}
286:               className="absolute top-6 left-6 text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-full transition-colors"
287:             >
288:               <X size={20} />
289:             </button>
290:             <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
291:               <CreditCard size={32} />
292:             </div>
293:             <h3 className="text-2xl font-black text-gray-800 mb-2">شحن الرصيد</h3>
294:             <p className="text-gray-500 font-medium mb-8 leading-relaxed">
295:               يرجى التواصل مع إدارة المدرسة أو التوجه إلى الشؤون المالية لتعبئة رصيد المحفظة الإلكترونية الخاصة بك.
296:             </p>
297:             <button 
298:               onClick={() => setShowRechargeModal(false)}
299:               className="w-full bg-primary text-white py-4 rounded-xl font-bold text-lg hover:shadow-lg hover:shadow-primary/30 transition-all hover:-translate-y-1"
300:             >
301:               حسناً، فهمت
302:             </button>
303:           </div>
304:         </div>
305:       )}
306:     </div>
307:   );
308: };
309: 
310: CafeteriaView.propTypes = {
311:   studentData: PropTypes.object,
312:   cart: PropTypes.array.isRequired,
313:   setCart: PropTypes.func.isRequired,
314:   searchQuery: PropTypes.string,
315:   studentBalance: PropTypes.number
316: };
317: 
318: export default CafeteriaView;
The above content shows the entire, complete file contents of the requested file.
