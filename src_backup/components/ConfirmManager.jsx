import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, X, Check, KeyRound } from 'lucide-react';

const ConfirmManager = () => {
  const [confirmState, setConfirmState] = useState(null);
  const [promptState, setPromptState] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [optionsState, setOptionsState] = useState(null);

  useEffect(() => {
    const handleConfirm = (e) => setConfirmState(e.detail);
    const handleOptions = (e) => setOptionsState(e.detail);
    const handlePrompt = (e) => {
      setPromptState(e.detail);
      setInputValue('');
    };

    window.addEventListener('moo-confirm', handleConfirm);
    window.addEventListener('moo-prompt', handlePrompt);
    window.addEventListener('moo-options', handleOptions);
    return () => {
      window.removeEventListener('moo-confirm', handleConfirm);
      window.removeEventListener('moo-prompt', handlePrompt);
      window.removeEventListener('moo-options', handleOptions);
    };
  }, []);

  const handleAction = (result) => {
    if (confirmState && confirmState.resolve) {
      confirmState.resolve(result);
    }
    setConfirmState(null);
  };

  const handleOptionsAction = (result) => {
    if (optionsState && optionsState.resolve) {
      optionsState.resolve(result);
    }
    setOptionsState(null);
  };

  const handlePromptAction = (isSubmit) => {
    if (promptState && promptState.resolve) {
      promptState.resolve(isSubmit ? inputValue : null);
    }
    setPromptState(null);
  };

  return (
    <AnimatePresence>
      {/* Confirm Modal */}
      {confirmState && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => handleAction(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-white rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-2xl border border-slate-100 flex flex-col items-center text-center"
          >
            <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mb-4">
              <AlertCircle size={32} />
            </div>
            <h3 className="text-xl font-black text-slate-800 mb-2">تأكيد الإجراء</h3>
            <p className="text-sm font-bold text-slate-500 mb-8 leading-relaxed">
              {confirmState.message}
            </p>
            <div className="flex gap-3 w-full">
              <button
                onClick={() => handleAction(false)}
                className="flex-1 h-12 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl flex items-center justify-center gap-2 transition-colors"
              >
                <X size={18} /> إلغاء
              </button>
              <button
                onClick={() => handleAction(true)}
                className="flex-1 h-12 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl shadow-lg shadow-rose-500/30 flex items-center justify-center gap-2 transition-all"
              >
                <Check size={18} /> نعم، متأكد
              </button>
            </div>
          </motion.div>
        </div>
      )}

      
      {/* Options Modal */}
      {optionsState && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => handleOptionsAction(null)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-white rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-2xl border border-slate-100 flex flex-col items-center text-center"
          >
            <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mb-4">
              <AlertCircle size={32} />
            </div>
            <h3 className="text-xl font-black text-slate-800 mb-2">تحديد نوع الاسترجاع</h3>
            <p className="text-sm font-bold text-slate-500 mb-8 leading-relaxed">
              {optionsState.message}
            </p>
            <div className="flex flex-col gap-3 w-full">
              {optionsState.options.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => handleOptionsAction(opt.value)}
                  className={`w-full h-12 font-bold rounded-xl flex items-center justify-center gap-2 transition-all ${opt.variant === 'danger' ? 'bg-rose-50 text-rose-600 hover:bg-rose-500 hover:text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-800 hover:text-white'}`}
                >
                  {opt.label}
                </button>
              ))}
              <button
                onClick={() => handleOptionsAction(null)}
                className="w-full h-12 bg-white border-2 border-slate-100 hover:border-slate-300 text-slate-500 font-bold rounded-xl mt-2 transition-colors"
              >
                إلغاء
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Prompt Modal */}
      {promptState && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => handlePromptAction(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-white rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-2xl border border-slate-100 flex flex-col items-center text-center"
          >
            <div className="w-16 h-16 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mb-4">
              <KeyRound size={32} />
            </div>
            <h3 className="text-xl font-black text-slate-800 mb-2">مصادقة مطلوبة</h3>
            <p className="text-sm font-bold text-slate-500 mb-6 leading-relaxed">
              {promptState.message}
            </p>
            <input
              type="password"
              autoFocus
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handlePromptAction(true)}
              className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-center text-lg font-bold text-slate-800 focus:border-indigo-500 outline-none mb-8 tracking-widest"
              placeholder="••••••••"
            />
            <div className="flex gap-3 w-full">
              <button
                onClick={() => handlePromptAction(false)}
                className="flex-1 h-12 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl flex items-center justify-center gap-2 transition-colors"
              >
                <X size={18} /> إلغاء
              </button>
              <button
                onClick={() => handlePromptAction(true)}
                className="flex-1 h-12 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2 transition-all"
              >
                <Check size={18} /> تأكيد
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmManager;

// Utility to call from anywhere: const confirmed = await mooConfirm("Are you sure?");
export const mooConfirm = (message) => {
  return new Promise((resolve) => {
    window.dispatchEvent(new CustomEvent('moo-confirm', { detail: { message, resolve } }));
  });
};

export const mooPrompt = (message) => {
  return new Promise((resolve) => {
    window.dispatchEvent(new CustomEvent('moo-prompt', { detail: { message, resolve } }));
  });
};

export const mooOptions = (message, options) => {
  return new Promise((resolve) => {
    window.dispatchEvent(new CustomEvent('moo-options', { detail: { message, options, resolve } }));
  });
};
