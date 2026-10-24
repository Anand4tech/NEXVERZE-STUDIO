import React, { useState, useEffect } from 'react';
import { ShieldAlert } from 'lucide-react';

export const CanvasShield: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isProtectedActive, setIsProtectedActive] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Detect PrintScreen or Developer tools / screenshot shortcuts
      if (
        e.key === 'PrintScreen' ||
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'C' || e.key === 'c' || e.key === 'J' || e.key === 'j')) ||
        (e.metaKey && e.shiftKey && e.key === '3') ||
        (e.metaKey && e.shiftKey && e.key === '4')
      ) {
        setIsProtectedActive(true);
        setTimeout(() => setIsProtectedActive(false), 2500);
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsProtectedActive(true);
      } else {
        setTimeout(() => setIsProtectedActive(false), 1000);
      }
    };

    const handleBlur = () => {
      setIsProtectedActive(true);
    };

    const handleFocus = () => {
      setTimeout(() => setIsProtectedActive(false), 800);
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  return (
    <div className="relative w-full overflow-hidden">
      {/* Viewport Content */}
      <div className={`transition-all duration-300 ${isProtectedActive ? 'filter blur-xl select-none opacity-20 pointer-events-none' : ''}`}>
        {children}
      </div>

      {/* Security Protected Overlay */}
      {isProtectedActive && (
        <div className="absolute inset-0 z-50 bg-[#090714]/90 backdrop-blur-20 flex flex-col items-center justify-center p-6 text-center space-y-3 animate-in fade-in">
          <div className="w-16 h-16 rounded-3xl bg-purple-500/20 border border-purple-400/40 flex items-center justify-center text-amber-300 shadow-2xl animate-pulse">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div className="space-y-1 max-w-sm">
            <h3 className="text-base font-black text-white tracking-wide">
              🔒 SECURITY PROTECTED VIEWPORT
            </h3>
            <p className="text-xs text-purple-200/80 font-mono leading-relaxed">
              Screen capture & snapshot protection active. Cinematic prompts and AI weights are cryptographically encrypted.
            </p>
          </div>
          <span className="text-[10px] mono text-emerald-400 bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-500/30">
            NexVerze Secure Enclave Active
          </span>
        </div>
      )}
    </div>
  );
};
