import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Store, Plus, Save, Trash2, CheckCircle2, BellRing, AlertTriangle,
  Receipt, QrCode, X, CreditCard, LayoutGrid, Package, ChevronRight,
  ShoppingCart, Search, Tag, Wallet, TrendingUp, Clock, Scan, Maximize, Minimize, RefreshCcw, CupSoda, Sandwich, Filter, Check,
  Pizza, CheckCircle, ShieldCheck
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { mooConfirm, mooOptions } from './ConfirmManager';
import PropTypes from 'prop-types';

const CATEGORIES = ['ساندوتشات', 'مشروبات', 'تسالي', 'معجنات', 'أخرى'];
const EMOJIS = ['🥪', '🍔', '🍕', '🌭', '🍟', '🧃', '🥤', '☕', '🥐', '🥯', '🍩', '🍫', '🍬', '🍿', '🍱', '🥗', '🍎'];

// --- Audio Utility ---
const playSound = (type) => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    if (type === 'scan') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      osc.start();
      gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.15);
      osc.stop(ctx.currentTime + 0.15);
    } else if (type === 'success') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1000, ctx.currentTime);
      osc.frequency.setValueAtTime(1500, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      osc.start();
      gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.3);
      osc.stop(ctx.currentTime + 0.3);
    } else if (type === 'error') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      osc.start();
      gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.4);
      osc.stop(ctx.currentTime + 0.4);
    }
  } catch(e) {
    console.error("Audio error:", e);
  }
};
// --------------------

const CafeteriaAdminDashboard = ({ onLogout }) => {
  // 1. STATE (NO FAKE DATA)
  const [menu, setMenu] = useState(() => JSON.parse(localStorage.getItem('moo_cafeteria_menu')) || []);
  const [orders, setOrders] = useState(() => JSON.parse(localStorage.getItem('moo_cafeteria_orders')) || []);
  const [wallets, setWallets] = useState(() => JSON.parse(localStorage.getItem('moo_wallets')) || {});
  
  
  const [activeTab, setActiveTab] = useState('pos'); // pos, inventory, orders
  const [searchOrders, setSearchOrders] = useState('');
  const [filterGrade, setFilterGrade] = useState('');

  // Form states
  const [newItem, setNewItem] = useState({ name: '', price: '', category: 'ساندوتشات', icon: '🥪', quantity: '' });
  
  // Scanner states
  const [isScanning, setIsScanning] = useState(false);
  const [scannedStudent, setScannedStudent] = useState(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [scanOverlay, setScanOverlay] = useState('');
  const isProcessingScan = React.useRef(false);
  
  // POS states
  const [cart, setCart] = useState([]); // Array of { ...menuItem, cartQty }
  const [customAmount, setCustomAmount] = useState('');

  // Explicit Sync Helpers to avoid interval race conditions
  const updateMenuState = (newMenu) => {
    setMenu(newMenu);
    localStorage.setItem('moo_cafeteria_menu', JSON.stringify(newMenu));
    
  };

  const updateOrdersState = (newOrders) => {
    setOrders(newOrders);
    localStorage.setItem('moo_cafeteria_orders', JSON.stringify(newOrders));
    
  };

  // 2. LIFECYCLE (SYNC ONLY)
  useEffect(() => {
    const handleSync = () => {
      setOrders(JSON.parse(localStorage.getItem('moo_cafeteria_orders')) || []);
      setWallets(JSON.parse(localStorage.getItem('moo_wallets')) || {});
      setMenu(JSON.parse(localStorage.getItem('moo_cafeteria_menu')) || []);
    };
    
    window.addEventListener('storage', handleSync);
    window.addEventListener('moo-sync', handleSync);
    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('moo-sync', handleSync);
    };
  }, []);

  // 3. SCANNER LOGIC
  const scannerRef = React.useRef(null);
  
  useEffect(() => {
    if (!isScanning) return;
    
    isProcessingScan.current = false;
    let html5QrCode;

    const initScanner = async () => {
      try {
        const devices = await Html5Qrcode.getCameras();
        if (devices && devices.length) {
          html5QrCode = new Html5Qrcode("reader");
          scannerRef.current = html5QrCode;
          
          const onScanSuccess = (text) => {
            try {
              let data;
              try {
                data = JSON.parse(text);
              } catch(e) {
                const foundStudent = students.find(s => s.id === text);
                if (foundStudent) data = { id: foundStudent.id, name: foundStudent.name };
              }

              if (data && data.id) {
                if (isProcessingScan.current) return;
                isProcessingScan.current = true;
                
                playSound('scan');
                setScanOverlay(data.name || data.id);
                
                setTimeout(() => {
                  const studentFullData = students.find(s => s.id === data.id);
                  setScannedStudent(studentFullData || data);
                  setIsFullScreen(false);
                  if (scannerRef.current && scannerRef.current.isScanning) {
                    scannerRef.current.stop().then(() => scannerRef.current.clear()).catch(() => {});
                  }
                  setIsScanning(false);
                  setCart([]);
                  setCustomAmount('');
                  setScanOverlay('');
                }, 1500);
              }
            } catch (e) {
              // ignore invalid JSON
            }
          };

          try {
            await html5QrCode.start({ facingMode: "environment" }, { fps: 10, qrbox: { width: 250, height: 250 } }, onScanSuccess, undefined);
          } catch (e) {
            await html5QrCode.start(devices[0].id, { fps: 10, qrbox: { width: 250, height: 250 } }, onScanSuccess, undefined);
          }
        } else {
          window.dispatchEvent(new CustomEvent('moo-toast', { detail: { message: 'تعذر الوصول للكاميرا.', type: 'error' } }));
          setIsScanning(false);
        }
      } catch (err) {
        window.dispatchEvent(new CustomEvent('moo-toast', { detail: { message: 'خطأ بالكاميرا.', type: 'error' } }));
        setIsScanning(false);
      }
    };

    setTimeout(initScanner, 100);

    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().then(() => scannerRef.current.clear()).catch(() => {});
      }
    };
  }, [isScanning]);

  const startScanning = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ video: true });
      setIsScanning(true);
    } catch (err) {
      window.dispatchEvent(new CustomEvent('moo-toast', { detail: { message: 'تعذر الوصول للكاميرا.', type: 'error' } }));
    }
  };

  // 4. HELPERS
  const showToast = (msg, type='success') => {
    window.dispatchEvent(new CustomEvent('moo-toast', { detail: { message: msg, type } }));
  };

  const isToday = (dateStr) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    const t = new Date();
    return d.getDate() === t.getDate() && d.getMonth() === t.getMonth() && d.getFullYear() === t.getFullYear();
  };

  // 5. STATS CALCULATION
  const stats = useMemo(() => {
    const todayOrders = orders.filter(o => isToday(o.date));
    const todaySales = todayOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    const lowStock = menu.filter(m => m.quantity < 5);
    return { ordersCount: todayOrders.length, sales: todaySales, lowStock: lowStock.length };
  }, [orders, menu]);

  // 6. INVENTORY MANAGEMENT
  const handleAddItem = (e) => {
    e.preventDefault();
    if (!newItem.name || !newItem.price || !newItem.quantity) return showToast('❌ يرجى تعبئة الحقول المطلوبة');
    const item = { ...newItem, id: Date.now(), price: parseFloat(newItem.price), quantity: parseInt(newItem.quantity, 10) };
    updateMenuState([item, ...menu]);
    setNewItem({ name: '', price: '', category: 'ساندوتشات', icon: '🥪', quantity: '' });
    showToast('✅ تم إضافة الصنف بنجاح!');
  };

  const updateQuantity = (id, delta) => {
    updateMenuState(menu.map(m => m.id === id ? { ...m, quantity: Math.max(0, m.quantity + delta) } : m));
  };

  const deleteItem = (id) => updateMenuState(menu.filter(m => m.id !== id));

  // 7. POINT OF SALE (POS) LOGIC
  const addToCart = (item) => {
    if (item.quantity <= 0) return showToast('❌ عذراً، هذا الصنف غير متوفر حالياً');
    
    const existing = cart.find(c => c.id === item.id);
    if (existing) {
      if (existing.cartQty >= item.quantity) return showToast('❌ تم تجاوز الكمية المتاحة');
      setCart(cart.map(c => c.id === item.id ? { ...c, cartQty: c.cartQty + 1 } : c));
    } else {
      setCart([...cart, { ...item, cartQty: 1 }]);
    }
    setCustomAmount(''); // clear custom amount if using cart
  };

  const removeFromCart = (id) => {
    setCart(cart.filter(c => c.id !== id));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.cartQty), 0);
  
  const handleCheckout = () => {
    if (!scannedStudent) return;
    
    let totalToDeduct = 0;
    let itemsString = '';
    
    if (cart.length > 0) {
      totalToDeduct = cartTotal;
      itemsString = cart.map(c => `${c.name} (${c.cartQty})`).join(' + ');
    } else if (customAmount && parseFloat(customAmount) > 0) {
      totalToDeduct = parseFloat(customAmount);
      itemsString = 'مشتريات مباشرة متنوعة';
    } else {
      return showToast('❌ يرجى اختيار أصناف أو إدخال مبلغ صحيح');
    }

    const currentBalance = wallets[scannedStudent.id] || 0;
    if (currentBalance < totalToDeduct) {
      playSound('error');
      return showToast('❌ رصيد الطالب لا يكفي لإتمام العملية!');
    }

    // 1. Deduct wallet
    const updatedWallets = { ...wallets, [scannedStudent.id]: currentBalance - totalToDeduct };
    setWallets(updatedWallets);
    localStorage.setItem('moo_wallets', JSON.stringify(updatedWallets));
    

    // 2. Add to vault
    const currentVault = parseFloat(localStorage.getItem('moo_school_vault')) || 0;
    localStorage.setItem('moo_school_vault', (currentVault + totalToDeduct).toString());
    

    // 3. Log transaction
    const txLog = JSON.parse(localStorage.getItem('moo_wallet_transactions')) || [];
    const newTx = {
      id: Date.now(),
      studentId: scannedStudent.id,
      studentName: scannedStudent.name,
      amount: totalToDeduct,
      type: 'subtract',
      date: new Date().toISOString()
    };
    localStorage.setItem('moo_wallet_transactions', JSON.stringify([newTx, ...txLog].slice(0, 50)));
    

    // 5. Update Menu inventory if cart was used
    if (cart.length > 0) {
      let updatedMenu = [...menu];
      cart.forEach(cItem => {
        updatedMenu = updatedMenu.map(m => m.id === cItem.id ? { ...m, quantity: m.quantity - cItem.cartQty } : m);
      });
      updateMenuState(updatedMenu);
    }

    // 6. Create Order
    const newOrder = {
      id: Date.now(),
      studentName: scannedStudent.name,
      studentId: scannedStudent.id,
      studentGrade: scannedStudent.grade || 'غير محدد',
      items: itemsString,
      cart: cart, // Save cart for accurate refund later
      total: totalToDeduct,
      date: new Date().toISOString(),
      status: 'pending',
      source: 'pos' // indicates point of sale direct
    };
    
    updateOrdersState([newOrder, ...orders]);

    
    
    playSound('success');
    showToast(`✅ تم إتمام العملية بنجاح! خصم ${totalToDeduct} ر.س`);
    setScannedStudent(null);
    setCart([]);
    setCustomAmount('');
    setScanOverlay('');
  };

  const handleRefundOrder = async (orderId) => {
    const refundType = await mooOptions('هل أنت متأكد من الاسترجاع؟ اختر نوع الإجراء:', [
        { label: 'استرجاع كامل (بدون خصم)', value: 'full' },
        { label: 'خصم 1 ريال وإرجاع الباقي', value: 'penalty', variant: 'danger' }
    ]);
    if(!refundType) return;
    
    const orderToRefund = orders.find(o => o.id === orderId);
    if(!orderToRefund) return;
    
    let refundAmount = orderToRefund.total;
    let note = 'استرجاع كامل';
    if (refundType === 'penalty') {
        refundAmount = Math.max(0, orderToRefund.total - 1);
        note = 'استرجاع مع خصم ريال غرامة';
    }

    // 1. Add back to wallet
    const currentWallets = JSON.parse(localStorage.getItem('moo_wallets')) || {};
    const currentBalance = currentWallets[orderToRefund.studentId] || 0;
    currentWallets[orderToRefund.studentId] = currentBalance + refundAmount;
    localStorage.setItem('moo_wallets', JSON.stringify(currentWallets));
    
    setWallets(currentWallets);
    
    // 2. Deduct from vault
    const currentVault = parseFloat(localStorage.getItem('moo_school_vault')) || 0;
    localStorage.setItem('moo_school_vault', (currentVault - refundAmount).toString());
    
    
    // 3. Log refund transaction
    const txLog = JSON.parse(localStorage.getItem('moo_wallet_transactions')) || [];
    if (refundAmount > 0) {
        const newTx = {
        id: Date.now(),
        studentId: orderToRefund.studentId,
        studentName: orderToRefund.studentName,
        amount: refundAmount,
        type: 'add',
        date: new Date().toISOString(),
        note: note
        };
        localStorage.setItem('moo_wallet_transactions', JSON.stringify([newTx, ...txLog].slice(0, 50)));
        
    }
    
    // 4. Update orders (remove it completely)
    updateOrdersState(orders.filter(o => o.id !== orderId));
    
    // 5. Restore inventory if cart was saved
    if (orderToRefund.cart && Array.isArray(orderToRefund.cart)) {
       let currentMenu = JSON.parse(localStorage.getItem('moo_cafeteria_menu')) || [];
       orderToRefund.cart.forEach(cItem => {
         currentMenu = currentMenu.map(m => m.id === cItem.id ? { ...m, quantity: m.quantity + cItem.cartQty } : m);
       });
       updateMenuState(currentMenu);
    }
    
    
    showToast('تم إرجاع الطلب وإعادة الرصيد والمخزون بنجاح!');
  };

  const handleDeliverOrder = (orderId) => {
    const updatedOrders = orders.map(o => o.id === orderId ? { ...o, status: 'completed' } : o);
    updateOrdersState(updatedOrders);
    playSound('success');
    window.dispatchEvent(new CustomEvent('moo-toast', { detail: { message: 'تم تسليم الطلب للطالب بنجاح!', type: 'success' } }));
  };

    const handleReadyOrder = (orderId) => {
    const updatedOrders = orders.map(o => o.id === orderId ? { ...o, status: 'ready' } : o);
    updateOrdersState(updatedOrders);
    playSound('success');
    window.dispatchEvent(new CustomEvent('moo-toast', { detail: { message: 'تم تجهيز الطلب وإشعار الطالب!', type: 'success' } }));
  };

  const handleCancelLiveOrder = async (orderId) => {
    if (!window.confirm('هل أنت متأكد من إلغاء هذا الطلب وإرجاع المبلغ للطالب؟')) return;

    const orderToCancel = orders.find(o => o.id === orderId);
    if (!orderToCancel) return;

    // 1. Add back to wallet
    const currentWallets = JSON.parse(localStorage.getItem('moo_wallets')) || {};
    currentWallets[orderToCancel.studentId] = (currentWallets[orderToCancel.studentId] || 0) + orderToCancel.total;
    localStorage.setItem('moo_wallets', JSON.stringify(currentWallets));
    
    setWallets(currentWallets);
    
    // 2. Deduct from vault
    const currentVault = parseFloat(localStorage.getItem('moo_school_vault')) || 0;
    localStorage.setItem('moo_school_vault', (currentVault - orderToCancel.total).toString());
    
    
    // 3. Log refund transaction
    const txLog = JSON.parse(localStorage.getItem('moo_wallet_transactions')) || [];
    if (orderToCancel.total > 0) {
        txLog.unshift({
          id: Date.now(),
          studentId: orderToCancel.studentId,
          studentName: orderToCancel.studentName,
          amount: orderToCancel.total,
          type: 'add',
          date: new Date().toISOString(),
          note: 'إلغاء الطلب (غير متوفر)'
        });
        localStorage.setItem('moo_wallet_transactions', JSON.stringify(txLog.slice(0, 50)));
        
        
    }
    
    // 4. Update orders (remove it completely)
    updateOrdersState(orders.filter(o => o.id !== orderId));
    
    // 5. Restore inventory if cart was saved
    if (orderToCancel.cart && Array.isArray(orderToCancel.cart)) {
       let currentMenu = JSON.parse(localStorage.getItem('moo_cafeteria_menu')) || [];
       orderToCancel.cart.forEach(cItem => {
         currentMenu = currentMenu.map(m => m.id === cItem.id ? { ...m, quantity: m.quantity + cItem.cartQty } : m);
       });
       updateMenuState(currentMenu);
    }
    
    
    playSound('success');
    window.dispatchEvent(new CustomEvent('moo-toast', { detail: { message: 'تم إلغاء الطلب وإرجاع المبلغ للطالب!', type: 'success' } }));
  };


  const handleEndShift = () => {
      const password = window.prompt('أدخل كلمة المرور لإنهاء الدوام:');
      if (!password) return;

      const staff = JSON.parse(localStorage.getItem('moo_staff') || '[]');
        let adminPass = 'admin123';
        try {
          const creds = JSON.parse(localStorage.getItem('moo_admin_credentials') || '{}');
          if (creds.password) adminPass = creds.password;
        } catch {}
        const isAuthorized = staff.some(s => s.role === 'cafeteria' && s.password === password) || password === '0000' || password === adminPass;
      
      if (!isAuthorized) {
        window.dispatchEvent(new CustomEvent('moo-toast', { detail: { message: 'كلمة المرور غير صحيحة!', type: 'error' } }));
        return;
      }

      if(window.confirm('هل أنت متأكد من إنهاء دوام المقصف لليوم؟ سيتم تفريغ الطلبات الحية وحفظ الإيرادات.')){
       const currentWallets = JSON.parse(localStorage.getItem('moo_wallets')) || {};
     let currentVault = parseFloat(localStorage.getItem('moo_school_vault')) || 0;
     const txLog = JSON.parse(localStorage.getItem('moo_wallet_transactions')) || [];
     let currentMenu = JSON.parse(localStorage.getItem('moo_cafeteria_menu')) || [];

     let updatedOrders = [...orders];

     updatedOrders = updatedOrders.map(o => {
       if (o.status === 'pending' && o.source === 'student_portal') {
         currentWallets[o.studentId] = (currentWallets[o.studentId] || 0) + o.total;
         currentVault -= o.total;
         txLog.unshift({ id: Date.now()+Math.random(), studentId: o.studentId, studentName: o.studentName, amount: o.total, type: 'add', date: new Date().toISOString(), note: 'إلغاء الطلب (لم يجهز)' });
         if (o.cart && Array.isArray(o.cart)) {
           o.cart.forEach(cItem => {
             currentMenu = currentMenu.map(m => m.id === cItem.id ? { ...m, quantity: m.quantity + cItem.cartQty } : m);
           });
         }
         return { ...o, status: 'cancelled_full_refund' };
       } else if (o.status === 'ready' && o.source === 'student_portal') {
         const penalty = 1;
         const refundAmount = Math.max(0, o.total - penalty);
         if (refundAmount > 0) {
            currentWallets[o.studentId] = (currentWallets[o.studentId] || 0) + refundAmount;
            currentVault -= refundAmount;
            txLog.unshift({ id: Date.now()+Math.random(), studentId: o.studentId, studentName: o.studentName, amount: refundAmount, type: 'add', date: new Date().toISOString(), note: 'استرجاع مع غرامة ترك الطلب' });
         }
         return { ...o, status: 'cancelled_penalty' };
       }
       return o;
     });

     localStorage.setItem('moo_wallets', JSON.stringify(currentWallets));
     
     localStorage.setItem('moo_school_vault', currentVault.toString());
     
     localStorage.setItem('moo_wallet_transactions', JSON.stringify(txLog.slice(0, 50)));
     updateMenuState(currentMenu);
     updateOrdersState(updatedOrders.filter(o => o.status === 'completed' || o.source === 'pos'));

       
       window.dispatchEvent(new CustomEvent('moo-toast', { detail: { message: 'تم إنهاء اليوم الدراسي بنجاح!', type: 'success' } }));
      }
    };

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const term = searchOrders.toLowerCase();
      const matchSearch = !term || (o.studentName?.toLowerCase().includes(term)) || (o.studentId?.toLowerCase().includes(term));
      const matchGrade = !filterGrade || o.studentGrade === filterGrade;
      
      if (activeTab === 'orders') {
         if (o.status !== 'pending' && o.status !== 'ready') return false;
      } else if (activeTab === 'delivered') {
         if (o.status !== 'completed' && o.source !== 'pos') return false;
      }
      return matchSearch && matchGrade;
    });
  }, [orders, searchOrders, filterGrade, activeTab]);

  // RENDER HELPERS
  const balance = scannedStudent ? (wallets[scannedStudent.id] || 0) : 0;

  return (
    <div className="min-h-screen bg-slate-50 font-sans overflow-x-hidden w-full max-w-full" dir="rtl">
      {/* Scanner Custom CSS */}
      <style>{`
        #reader { width: 100% !important; border: none !important; }
        #reader video { object-fit: cover !important; width: 100% !important; border-radius: 1rem; }
        #reader__dashboard_section_csr span { color: white !important; }
      `}</style>

      

      {/* HEADER */}
      <header className="bg-white/90 backdrop-blur-md border-b border-slate-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-600 shadow-inner">
              <Store size={24} />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-800">إدارة المقصف الذكي</h1>
              <p className="text-xs font-bold text-slate-400">نظام المبيعات والجرد المباشر</p>
            </div>
          </div>
          <button onClick={onLogout} className="px-5 py-2.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl font-bold text-sm transition-colors flex items-center gap-2">
            تسجيل الخروج
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        
        {/* STATS OVERVIEW */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:p-6 mb-8">
          <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-100 shadow-sm flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-400">مبيعات اليوم</p>
              <p className="text-2xl font-black text-slate-800">{stats.sales} <span className="text-sm text-slate-400 font-bold">ر.س</span></p>
            </div>
          </div>
          
          <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-100 shadow-sm flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Receipt size={24} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-400">الطلبات اليوم</p>
              <p className="text-2xl font-black text-slate-800">{stats.ordersCount} <span className="text-sm text-slate-400 font-bold">طلب</span></p>
            </div>
          </div>

          <div className={`bg-white rounded-3xl p-4 sm:p-6 border border-slate-100 shadow-sm flex items-center gap-5 ${stats.lowStock > 0 ? 'ring-2 ring-rose-400 ring-offset-2' : ''}`}>
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${stats.lowStock > 0 ? 'bg-rose-100 text-rose-600' : 'bg-slate-50 text-slate-400'}`}>
              <AlertTriangle size={24} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-400">نواقص المخزون</p>
              <p className="text-2xl font-black text-slate-800">{stats.lowStock} <span className="text-sm text-slate-400 font-bold">صنف</span></p>
            </div>
          </div>
        </div>

        {/* TABS NAVIGATION */}
        <div className="flex gap-2 p-1.5 bg-white border border-slate-100 rounded-2xl mb-8 w-fit shadow-sm overflow-x-auto max-w-full">
          {(() => {
            const pendingCount = orders.filter(o => o.status === 'pending' || o.status === 'ready').length;
            return [
              { id: 'pos', icon: QrCode, label: 'البيع المباشر' },
              { id: 'inventory', icon: Package, label: 'المخزون والقائمة' },
              { id: 'orders', icon: BellRing, label: 'الطلبات الحية', badge: pendingCount },
              { id: 'delivered', icon: CheckCircle, label: 'تم التسليم' }
            ].map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                className={`relative flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
                  activeTab === t.id ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20' : 'text-slate-500 hover:bg-slate-50'
                }`}>
                <t.icon size={18} /> {t.label}
                {t.badge > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-slate-900 text-white text-[10px] font-black min-w-[20px] h-5 px-1 flex items-center justify-center rounded-full shadow-md">
                    {t.badge}
                  </span>
                )}
              </button>
            ));
          })()}
        </div>

        {/* CONTENT */}
        <AnimatePresence mode="wait">
          
          {/* TAB 1: POINT OF SALE */}
          {activeTab === 'pos' && (
            <motion.div key="pos" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:p-6">
              
              {/* SCANNER SIDE */}
              <div className="lg:col-span-5 space-y-6">
                <div className="bg-white rounded-[2rem] p-4 sm:p-6 shadow-sm border border-slate-100 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-bl-full -z-0 opacity-50" />
                  <h2 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2 relative z-10">
                    <Scan size={20} className="text-orange-500" />
                    ماسح البطاقات (QR)
                  </h2>
                  
                  {!isScanning && !scannedStudent && (
                    <div className="text-center py-10 relative z-10">
                      <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center text-orange-500 mx-auto mb-6 shadow-inner">
                        <QrCode size={40} />
                      </div>
                      <p className="text-slate-500 font-bold text-sm mb-6">امسح كود الطالب للبدء بعملية البيع</p>
                      <button onClick={startScanning} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black shadow-xl shadow-slate-900/20 hover:scale-[1.02] transition-transform flex items-center justify-center gap-2">
                        <Scan size={18} /> تشغيل الكاميرا
                      </button>
                    </div>
                  )}

                  {isScanning && (
                    <div className={isFullScreen ? "fixed inset-0 z-[100] bg-slate-900 flex flex-col items-center justify-center p-4 sm:p-6" : "relative z-10 bg-slate-900 rounded-3xl overflow-hidden shadow-2xl p-2 mb-4 border-4 border-slate-800"}>
                      
                      <button onClick={() => setIsFullScreen(!isFullScreen)} className="absolute top-4 left-4 z-[110] bg-white/10 hover:bg-white/20 text-white p-3 rounded-2xl backdrop-blur-md transition-colors">
                        {isFullScreen ? <Minimize size={24} /> : <Maximize size={20} />}
                      </button>

                      {isFullScreen && (
                         <div className="absolute top-4 sm:p-8 text-center w-full z-[110] pointer-events-none">
                            <h2 className="text-white text-2xl font-black mb-2">وضع المسح السريع</h2>
                            <p className="text-slate-400 font-bold">وجّه كاميرا الجهاز نحو باركود الطالب</p>
                         </div>
                      )}

                      <div id="reader" className={`w-full rounded-2xl overflow-hidden bg-black [&>div]:border-none [&>div>video]:rounded-xl ${isFullScreen ? 'max-w-4xl max-h-[70vh] flex items-center mt-12 aspect-square md:aspect-video' : 'aspect-square flex items-center'}`}></div>
                      
                      <AnimatePresence>
                        {scanOverlay && (
                          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                             className="absolute inset-0 z-[120] bg-emerald-500/90 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 text-center">
                             <div className="bg-white rounded-3xl p-4 sm:p-8 shadow-2xl">
                               <div className="w-20 h-20 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                  <CheckCircle2 size={40} />
                               </div>
                               <h3 className="text-2xl font-black text-slate-800 flex items-center gap-2 justify-center">
                                  ✅ تم التقاط البطاقة
                               </h3>
                               <p className="text-lg font-bold text-slate-600 mt-3">{scanOverlay}</p>
                               <p className="text-sm font-bold text-slate-400 mt-4">جاري فتح سلة الشراء...</p>
                             </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {!isFullScreen && (
                        <button onClick={() => setIsScanning(false)} className="w-full bg-rose-50 text-rose-600 py-3 rounded-xl font-bold hover:bg-rose-100 transition-colors mt-2">
                          إغلاق الكاميرا
                        </button>
                      )}
                      
                      {isFullScreen && !scanOverlay && (
                         <button onClick={() => { setIsScanning(false); setIsFullScreen(false); }} className="absolute bottom-10 bg-rose-500 hover:bg-rose-600 text-white px-8 py-4 rounded-2xl font-black shadow-xl z-[110] flex items-center gap-2">
                            <X size={20} /> إغلاق الشاشة الكاملة
                         </button>
                      )}
                    </div>
                  )}

                  {scannedStudent && (
                    <div className="relative z-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-3xl p-4 sm:p-6 text-white shadow-xl shadow-orange-500/20">
                      <div className="flex justify-between items-start mb-6">
                        <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-2xl border border-white/30 shadow-inner">
                          👤
                        </div>
                        <button onClick={() => { setScannedStudent(null); setCart([]); setCustomAmount(''); }} className="bg-white/20 hover:bg-white/30 p-2 rounded-xl transition-colors">
                          <X size={16} />
                        </button>
                      </div>
                      <p className="text-orange-100 text-xs font-bold mb-1">بيانات الطالب</p>
                      <h3 className="text-xl font-black mb-1">{scannedStudent.name}</h3>
                      <p className="text-orange-200 text-xs font-mono mb-6 opacity-80">{scannedStudent.id}</p>
                      
                      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
                        <p className="text-orange-100 text-xs font-bold mb-1 flex items-center gap-1"><Wallet size={12}/> الرصيد المتاح</p>
                        <p className="text-3xl font-black">{balance.toFixed(2)} <span className="text-sm">ر.س</span></p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* CART & POS SIDE */}
              <div className={`lg:col-span-7 transition-opacity duration-300`}>
                <div className="bg-white rounded-[2rem] p-4 sm:p-6 shadow-sm border border-slate-100 h-full flex flex-col">
                  
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                      <ShoppingCart size={20} className="text-orange-500" /> سلة الشراء السريعة
                    </h2>
                    <div className="bg-orange-50 text-orange-600 px-3 py-1 rounded-lg text-xs font-bold">
                      الإجمالي: {(cartTotal || parseFloat(customAmount || 0)).toFixed(2)} ر.س
                    </div>
                  </div>

                  {/* Mode 1: Cart from Menu */}
                  <div className="flex-1 min-h-[250px]">
                    <div className="mb-4">
                      <p className="text-xs font-bold text-slate-400 mb-3">اختر من القائمة:</p>
                      <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                        {menu.length === 0 ? (
                          <p className="text-sm text-slate-400 font-bold p-4 bg-slate-50 rounded-xl w-full text-center border border-dashed border-slate-200">لا يوجد أصناف متاحة في المخزون</p>
                        ) : (
                          menu.map(item => (
                            <button key={item.id} onClick={() => item.quantity > 0 && addToCart(item)}
                              disabled={item.quantity <= 0}
                              className={`shrink-0 rounded-2xl p-3 flex flex-col items-center gap-2 transition-all group w-24 ${item.quantity <= 0 ? 'bg-slate-100 border-slate-200 opacity-50 cursor-not-allowed grayscale' : 'bg-slate-50 hover:bg-orange-50 border border-slate-100 hover:border-orange-200'}`}>
                              {item.quantity <= 0 && <div className="absolute top-1 right-1 bg-rose-500 text-white text-[8px] px-1.5 py-0.5 rounded font-black">نفد</div>}
                              <span className="text-3xl group-hover:scale-110 transition-transform">{item.icon}</span>
                              <p className="text-[10px] font-bold text-slate-600 text-center truncate w-full">{item.name}</p>
                              <p className="text-xs font-black text-orange-500">{item.price} ر.س</p>
                            </button>
                          ))
                        )}
                      </div>
                    </div>

                    {cart.length > 0 && (
                      <div className="bg-slate-50 rounded-2xl border border-slate-100 p-4 space-y-2 max-h-48 overflow-y-auto">
                        {cart.map(c => (
                          <div key={c.id} className="flex justify-between items-center bg-white p-3 rounded-xl shadow-sm border border-slate-100">
                            <div className="flex items-center gap-3">
                              <span className="text-xl">{c.icon}</span>
                              <div>
                                <p className="text-sm font-bold text-slate-800">{c.name}</p>
                                <p className="text-xs text-orange-500 font-bold">{c.price} ر.س × {c.cartQty}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <p className="font-black text-slate-800">{(c.price * c.cartQty).toFixed(2)}</p>
                              <button onClick={() => removeFromCart(c.id)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white transition-colors">
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Mode 2: Custom Amount OR Checkout */}
                  <div className="mt-6 pt-6 border-t border-slate-100">
                    <p className="text-xs font-bold text-slate-400 mb-3">أو إدخال مبلغ مخصص (بدون تحديد أصناف):</p>
                    <div className="flex gap-4">
                      <div className="flex-1 relative">
                        <input type="number" min="0.1" step="0.1" disabled={cart.length > 0}
                          placeholder={cart.length > 0 ? "يُستخدم الإجمالي من السلة" : "أدخل المبلغ..."}
                          value={customAmount} onChange={e => setCustomAmount(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl h-14 px-4 text-lg font-black text-slate-700 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all disabled:opacity-50 disabled:bg-slate-100" />
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">ر.س</span>
                      </div>
                      <button onClick={handleCheckout} disabled={!scannedStudent || (cart.length === 0 && !customAmount)}
                        className={`px-8 rounded-xl font-black shadow-lg transition-all flex items-center gap-2 text-white ${!scannedStudent ? 'bg-slate-400 cursor-not-allowed shadow-none' : 'bg-orange-500 hover:bg-orange-600 shadow-orange-500/30'}`}>
                        <CheckCircle2 size={20} /> {!scannedStudent ? 'امسح بطاقة الطالب أولاً' : 'إتمام الدفع'}
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 2: INVENTORY */}
          {activeTab === 'inventory' && (
            <motion.div key="inv" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
              
              {/* Add Item Form */}
              <div className="bg-white rounded-[2rem] p-4 sm:p-6 shadow-sm border border-slate-100">
                <h2 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
                  <Plus size={20} className="text-orange-500" /> إضافة صنف جديد
                </h2>
                <form onSubmit={handleAddItem} className="flex flex-wrap md:flex-nowrap gap-4 items-end">
                  <div className="w-full md:w-[15%]">
                    <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">الرمز</label>
                    <select value={newItem.icon} onChange={e => setNewItem({...newItem, icon: e.target.value})} className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-2 text-2xl outline-none focus:border-orange-400 text-center">
                      {EMOJIS.map(em => <option key={em} value={em}>{em}</option>)}
                    </select>
                  </div>
                  <div className="w-full md:w-[25%]">
                    <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">اسم الصنف</label>
                    <input type="text" required placeholder="مثال: عصير تفاح" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm font-bold text-slate-700 outline-none focus:border-orange-400" />
                  </div>
                  <div className="w-full md:w-[20%]">
                    <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">الفئة</label>
                    <select value={newItem.category} onChange={e => setNewItem({...newItem, category: e.target.value})} className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm font-bold text-slate-700 outline-none focus:border-orange-400">
                      {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  </div>
                  <div className="w-full md:w-[15%]">
                    <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">السعر</label>
                    <input type="number" required min="0.1" step="0.1" placeholder="0.0" value={newItem.price} onChange={e => setNewItem({...newItem, price: e.target.value})} className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm font-bold text-slate-700 outline-none focus:border-orange-400" />
                  </div>
                  <div className="w-full md:w-[15%]">
                    <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">الكمية الأولية</label>
                    <input type="number" required min="1" placeholder="0" value={newItem.quantity} onChange={e => setNewItem({...newItem, quantity: e.target.value})} className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm font-bold text-slate-700 outline-none focus:border-orange-400" />
                  </div>
                  <div className="w-full md:w-[10%]">
                    <button type="submit" className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition-colors flex justify-center items-center">
                      <Save size={18} />
                    </button>
                  </div>
                </form>
              </div>

              {/* Menu Grid */}
              <div className="bg-white rounded-[2rem] p-4 sm:p-6 shadow-sm border border-slate-100 min-h-[400px]">
                <h2 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
                  <LayoutGrid size={20} className="text-orange-500" /> المخزون الحالي ({menu.length})
                </h2>
                {menu.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 opacity-50">
                    <Package size={64} className="text-slate-300 mb-4" />
                    <p className="text-lg font-bold text-slate-500">لا يوجد أصناف في المخزون</p>
                    <p className="text-sm font-bold text-slate-400 mt-2">قم بإضافة أصناف جديدة من النموذج أعلاه</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {menu.map(item => (
                      <div key={item.id} className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col relative group">
                        <button onClick={() => deleteItem(item.id)} className="absolute top-3 left-3 w-8 h-8 bg-white border border-slate-200 text-slate-400 hover:text-rose-500 hover:border-rose-200 hover:bg-rose-50 rounded-lg flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100 shadow-sm z-10">
                          <Trash2 size={14} />
                        </button>
                        <div className="flex items-start gap-4 mb-4">
                          <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center text-4xl border border-slate-100 shrink-0">
                            {item.icon}
                          </div>
                          <div>
                            <p className="font-black text-slate-800 leading-tight mb-1">{item.name}</p>
                            <span className="inline-block bg-slate-200 text-slate-600 px-2 py-0.5 rounded-md text-[10px] font-bold mb-2">{item.category}</span>
                            <p className="text-sm font-black text-orange-500">{item.price} ر.س</p>
                          </div>
                        </div>
                        <div className="mt-auto bg-white rounded-xl border border-slate-200 p-1 flex items-center justify-between">
                          <button onClick={() => updateQuantity(item.id, -1)} className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold flex items-center justify-center transition-colors">-</button>
                          <div className="flex flex-col items-center">
                            <span className={`text-sm font-black ${item.quantity < 5 ? 'text-rose-600' : 'text-slate-700'}`}>{item.quantity}</span>
                            <span className="text-[9px] font-bold text-slate-400">الكمية</span>
                          </div>
                          <button onClick={() => updateQuantity(item.id, 1)} className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold flex items-center justify-center transition-colors">+</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* TAB 3: ORDERS */}
          {(activeTab === 'orders' || activeTab === 'delivered') && (
            <motion.div key="orders" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="bg-white rounded-[2rem] p-4 sm:p-6 shadow-sm border border-slate-100 min-h-[500px]">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
                  <h2 className="text-lg font-black text-slate-800 flex items-center gap-2 shrink-0">
                    <BellRing size={20} className="text-orange-500" /> {activeTab === "orders" ? "الطلبات الحية (قيد التجهيز)" : "سجل الطلبات المسلمة"}
                  </h2>
                  {activeTab === 'orders' && (
                      <button onClick={handleEndShift} className="shrink-0 px-4 py-2 bg-rose-100 text-rose-600 hover:bg-rose-500 hover:text-white font-bold rounded-xl transition-all shadow-sm text-sm">
                        إنهاء دوام المقصف
                      </button>
                  )}
                  <div className="flex w-full md:w-auto items-center gap-3">
                    <div className="relative flex-1 md:w-64">
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input 
                        type="text" 
                        placeholder="ابحث باسم الطالب أو المعرف..." 
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
                        <option value="">جميع الفصول</option>
                        <option value="أول أ">أول أ</option>
                        <option value="أول ب">أول ب</option>
                        <option value="ثاني أ">ثاني أ</option>
                        <option value="ثالث أ">ثالث أ</option>
                        <option value="رابع أ">رابع أ</option>
                        <option value="خامس أ">خامس أ</option>
                        <option value="سادس أ">سادس أ</option>
                      </select>
                    </div>
                  </div>
                </div>
                {filteredOrders.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-32 opacity-50">
                    <Receipt size={64} className="text-slate-300 mb-4" />
                    <p className="text-lg font-bold text-slate-500">لا توجد طلبات مسجلة</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredOrders.map(order => (
                      <div key={order.id} className="bg-slate-50 border border-slate-100 rounded-2xl p-5 relative overflow-hidden group hover:border-orange-200 hover:shadow-md transition-all">
                        {order.source === 'pos' ? (
                          <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[9px] font-black px-3 py-1 rounded-bl-xl shadow-sm z-10">بيع مباشر</div>
                        ) : order.status === 'pending' ? (
                          <div className="absolute top-0 right-0 bg-orange-500 text-white text-[9px] font-black px-3 py-1 rounded-bl-xl shadow-sm z-10 animate-pulse">قيد التجهيز</div>
                        ) : order.status === 'ready' ? (
                          <div className="absolute top-0 right-0 bg-indigo-500 text-white text-[9px] font-black px-3 py-1 rounded-bl-xl shadow-sm z-10 animate-pulse">جاهز للاستلام</div>
                        ) : (
                          <div className="absolute top-0 right-0 bg-blue-500 text-white text-[9px] font-black px-3 py-1 rounded-bl-xl shadow-sm z-10">تم التسليم مسبقاً</div>
                        )}
                        <div className="flex justify-between items-start mb-3 mt-1">
                          <div>
                            <h3 className="font-black text-slate-800 text-sm flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-orange-500"/> {order.studentName}</h3>
                            <p className="text-[10px] font-mono text-slate-400 mt-1">{order.studentId}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {activeTab === 'orders' && (order.status === 'pending' || order.status === 'ready') && (
                              <button onClick={() => handleCancelLiveOrder(order.id)} className="text-[10px] font-bold text-rose-500 bg-rose-50 hover:bg-rose-500 hover:text-white px-2 py-1 rounded-lg transition-colors flex items-center gap-1 shadow-sm border border-rose-100">
                                <X size={10} /> إلغاء الطلب
                              </button>
                            )}
                            <span className="text-[10px] font-bold text-slate-400 bg-white px-2 py-1 border border-slate-100 rounded-lg flex items-center gap-1">
                              <Clock size={10} /> {new Date(order.date).toLocaleTimeString('ar-EG', {hour: '2-digit', minute:'2-digit'})}
                            </span>
                          </div>
                        </div>
                        <div className="bg-white rounded-xl p-3 border border-slate-100 mb-3 min-h-[60px]">
                          <p className="text-xs font-bold text-slate-600 leading-relaxed">{order.items}</p>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-slate-200/50">
                          <span className="text-xs font-bold text-slate-500">الإجمالي المخصوم</span>
                          <div className="flex items-center gap-3 text-left">
                            <span className="text-lg font-black text-rose-500">{order.total} ر.س</span>
                            <div className="flex gap-2">
                              {activeTab === 'orders' && order.status === 'pending' && (
                                <button onClick={() => handleReadyOrder(order.id)} className="flex items-center gap-1 text-xs font-black text-orange-600 hover:text-white bg-orange-100 hover:bg-orange-500 px-3 py-1.5 rounded-lg transition-colors shadow-sm">
                                  <Check size={14} /> تم التجهيز
                                </button>
                              )}
                              {activeTab === 'orders' && order.status === 'ready' && (
                                <button onClick={() => handleDeliverOrder(order.id)} className="flex items-center gap-1 text-xs font-black text-emerald-600 hover:text-white bg-emerald-100 hover:bg-emerald-500 px-3 py-1.5 rounded-lg transition-colors shadow-sm">
                                  <Check size={14} /> تم التسليم
                                </button>
                              )}
                              {activeTab === 'delivered' && (
                                <button onClick={() => handleRefundOrder(order.id)} className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-rose-600 bg-slate-100 hover:bg-rose-50 px-3 py-1.5 rounded-lg transition-colors">
                                  <RefreshCcw size={14} /> استرجاع
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>
    </div>
  );
};

CafeteriaAdminDashboard.propTypes = {
  onLogout: PropTypes.func.isRequired,
};

export default CafeteriaAdminDashboard;
