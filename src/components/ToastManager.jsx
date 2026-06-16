import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle2, Info, XCircle } from 'lucide-react';

const ToastManager = () => {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handleToast = (e) => {
      const { message, type = 'error', duration = 3000 } = e.detail;
      const id = Date.now() + Math.random();
      setToasts(prev => [...prev, { id, message, type }]);

      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, duration);
    };

    window.addEventListener('moo-toast', handleToast);
    return () => window.removeEventListener('moo-toast', handleToast);
  }, []);

  return (
    <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[99999] flex flex-col gap-3 pointer-events-none items-center w-full px-4">
      <AnimatePresence>
        {toasts.map(toast => {
          const isError = toast.type === 'error';
          const isSuccess = toast.type === 'success';
          const Icon = isError ? AlertCircle : isSuccess ? CheckCircle2 : Info;
          const colors = isError 
            ? 'bg-rose-50 border-rose-200 text-rose-600 shadow-rose-500/20' 
            : isSuccess 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-600 shadow-emerald-500/20'
            : 'bg-blue-50 border-blue-200 text-blue-600 shadow-blue-500/20';

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9 }}
              className={`flex items-center gap-3 px-6 py-4 rounded-2xl shadow-xl border backdrop-blur-md pointer-events-auto max-w-md w-max mx-auto ${colors}`}
            >
              <Icon size={24} className={isError ? "text-rose-500" : isSuccess ? "text-emerald-500" : "text-blue-500"} />
              <p className="font-bold text-sm tracking-wide leading-relaxed">{toast.message}</p>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

export default ToastManager;
