import React, { useEffect } from 'react';
import { CheckCircle2, Star, Sparkles } from 'lucide-react';

const SuccessModal = ({ message, isVisible, onClose, duration = 3000, type = 'success' }) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  if (!isVisible) return null;

  const icons = {
    success: <CheckCircle2 size={48} className="text-green-500 animate-bounce" />,
    star: <Star size={48} className="text-yellow-500 animate-bounce" />,
    sparkle: <Sparkles size={48} className="text-purple-500 animate-bounce" />
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[9999] p-4 animate-fade-in pointer-events-auto">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/30 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Confetti Animation */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `-10px`,
              animation: `fall ${2 + Math.random() * 2}s linear forwards`,
              opacity: Math.random() * 0.7 + 0.3
            }}
          >
            <span className="text-2xl">{['🎉', '✨', '🌟', '⭐', '🎊', '💚'][Math.floor(Math.random() * 6)]}</span>
          </div>
        ))}
      </div>

      {/* Success Card */}
      <div className="relative z-10 max-w-md w-full glass-card rounded-[40px] p-8 text-center border border-white/60 shadow-2xl animate-fade-in-up">
        {/* Gradient Top Bar */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 rounded-t-[40px]" />

        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            {icons[type]}
            {/* Glow Effect */}
            <div className="absolute inset-0 rounded-full blur-2xl opacity-40 animate-pulse" 
              style={{ 
                background: type === 'success' ? '#22c55e' : type === 'star' ? '#eab308' : '#a855f7'
              }} 
            />
          </div>
        </div>

        {/* Message */}
        <h2 className="text-2xl font-bold text-gray-900 mb-2 font-title">
          ✅ تم بنجاح!
        </h2>
        <p className="text-gray-600 font-bold text-sm leading-relaxed">
          {message}
        </p>

        {/* Animated Dots */}
        <div className="flex justify-center gap-2 mt-6">
          <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0s' }} />
          <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0.15s' }} />
          <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0.3s' }} />
        </div>
      </div>

      <style>{`
        @keyframes fall {
          to {
            transform: translateY(100vh) rotate(360deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default SuccessModal;

import PropTypes from 'prop-types';
SuccessModal.propTypes = { isVisible: PropTypes.bool, message: PropTypes.string, onClose: PropTypes.func };
