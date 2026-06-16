import React from 'react';
import { AlertCircle, RotateCcw, Home } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('🔴 Error Boundary Caught:', error, errorInfo);
    this.setState(prev => ({
      errorCount: prev.errorCount + 1
    }));
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  reloadPage = () => {
    window.location.reload();
  };

  goHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50 flex items-center justify-center p-6 relative overflow-hidden">
        {/* Animated Background Orbs */}
        <div className="absolute top-1/4 -right-32 w-80 h-80 bg-red-200/20 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-1/3 -left-32 w-80 h-80 bg-orange-200/20 rounded-full blur-[100px] animate-pulse delay-700" />

        {/* Error Card */}
        <div className="relative z-10 max-w-2xl w-full glass-card rounded-[40px] p-8 md:p-12 border border-white/60 shadow-2xl animate-fade-in">
          {/* Red Accent Top */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-orange-500 rounded-t-[40px]" />

          {/* Error Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center animate-bounce">
              <AlertCircle size={40} className="text-red-600" />
            </div>
          </div>

          {/* Error Title */}
          <h1 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-3 font-title">
            🛑 حدث خطأ غير متوقع
          </h1>
          <p className="text-center text-gray-600 font-bold mb-6">
            اعتذر عن المشكلة. نحن نعمل على إصلاحها الآن.
          </p>

          {/* Error Details (Dev Mode) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 mb-6 max-h-40 overflow-y-auto">
              <p className="text-xs font-mono text-red-700 font-bold break-words">
                {this.state.error?.toString() || 'خطأ غير معروف'}
              </p>
            </div>
          )}

          {/* Error Counter */}
          {this.state.errorCount > 3 && (
            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-4 mb-6">
              <p className="text-xs text-yellow-800 font-bold text-center">
                ⚠️ حدث خطأ متكرر ({this.state.errorCount} مرات). الرجاء إعادة تحميل الصفحة بالكامل.
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={this.resetError}
              className="flex items-center justify-center gap-2 py-3 px-4 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-2xl transition-all hover:shadow-lg hover:shadow-blue-500/30 active:scale-95"
            >
              <RotateCcw size={18} />
              محاولة مجدداً
            </button>

            <button
              onClick={this.reloadPage}
              className="flex items-center justify-center gap-2 py-3 px-4 bg-purple-500 hover:bg-purple-600 text-white font-bold rounded-2xl transition-all hover:shadow-lg hover:shadow-purple-500/30 active:scale-95"
            >
              🔄 إعادة تحميل
            </button>

            <button
              onClick={this.goHome}
              className="flex items-center justify-center gap-2 py-3 px-4 bg-primary hover:bg-primary/90 text-white font-bold rounded-2xl transition-all hover:shadow-lg hover:shadow-primary/30 active:scale-95"
            >
              <Home size={18} />
              الصفحة الرئيسية
            </button>
          </div>

          {/* Support Message */}
          <p className="text-center text-xs text-gray-500 font-bold mt-6 leading-relaxed">
            إذا استمرت المشكلة، يرجى التواصل مع فريق الدعم الفني 📧
          </p>
        </div>
      </div>
    );
  }

  return this.props.children;
  }
}

export default ErrorBoundary;

import PropTypes from 'prop-types';
ErrorBoundary.propTypes = { children: PropTypes.node };
