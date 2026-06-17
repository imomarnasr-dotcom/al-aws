import React, { useState, useEffect, useRef } from 'react';
import { Play } from 'lucide-react';

export default function IntroVideo({ onFinished }) {
  const [showSkip, setShowSkip] = useState(false);
  const [hasError, setHasError] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    // Show skip button after 2 seconds just in case they want to bypass it
    const timer = setTimeout(() => setShowSkip(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleVideoEnd = () => {
    onFinished();
  };

  const handleVideoError = () => {
    console.warn("Intro video not found or error playing. Skipping...");
    setHasError(true);
    onFinished();
  };

  // If there's an error loading the video, we've already called onFinished, but return null to unmount gracefully
  if (hasError) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-[#111827] flex items-center justify-center overflow-hidden">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        onEnded={handleVideoEnd}
        onError={handleVideoError}
        className="w-full h-full object-cover scale-[1.05]"
        src="/intro.mp4"
      />
      
      {/* Watermark Hider Overlay (Bottom Right) */}
      <div className="absolute bottom-0 right-0 w-40 h-20 bg-[#111827] z-10" style={{ filter: 'blur(8px)' }}></div>
      <div className="absolute bottom-0 right-0 w-32 h-16 bg-[#111827] z-10"></div>

      {showSkip && (
        <button
          onClick={handleVideoEnd}
          className="absolute bottom-10 right-8 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white px-6 py-2 rounded-full border border-white/20 transition-all font-main flex items-center gap-2 animate-fade-in z-20"
        >
          <span>تخطي</span>
          <Play size={16} className="rotate-180" />
        </button>
      )}
    </div>
  );
}
