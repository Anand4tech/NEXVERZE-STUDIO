import React, { useState, useEffect } from 'react';
import { Sparkles, Coins, Gift, ArrowRight, X, Check } from 'lucide-react';

export const WelcomeCreditsModal: React.FC<{
  onStartCreating: () => void;
  onClaimTrialPack?: () => void;
}> = ({ onStartCreating, onClaimTrialPack }) => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hasSeenModal = localStorage.getItem('nexverze_welcome_credits_seen');
      if (!hasSeenModal) {
        // Show welcome popup automatically
        const timer = setTimeout(() => setIsOpen(true), 600);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem('nexverze_welcome_credits_seen', 'true');
    }
  };

  const handleClaimTrial = () => {
    handleClose();
    if (onClaimTrialPack) {
      onClaimTrialPack();
    } else {
      onStartCreating();
    }
  };

  const handleExplore = () => {
    handleClose();
    onStartCreating();
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={handleClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative bg-gradient-to-b from-[#1c1236] via-[#120d24] to-[#0a0717] border border-purple-500/40 rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl overflow-hidden text-center space-y-5"
      >
        {/* Glow ambient background */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-purple-500/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-pink-500/30 rounded-full blur-3xl pointer-events-none" />

        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-purple-500/20 border border-amber-400/40 text-amber-300 text-xs font-bold mono uppercase tracking-wider mx-auto shadow-md">
          <Gift className="w-4 h-4 text-amber-400 animate-bounce" />
          <span>⚡ Special Creator Welcome Offer</span>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
            Welcome to <br />
            <span className="bg-gradient-to-r from-purple-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">
              NexVerze Studio!
            </span>
          </h3>
          <p className="text-xs sm:text-sm text-purple-200/90 leading-relaxed font-medium">
            Next-Gen Photorealistic AI Video Generation with 4K Quality Lock Engine & Zero Watermark Renders.
          </p>
        </div>

        {/* Highlight Deal Card */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/80 via-indigo-950/80 to-purple-950/80 border border-purple-400/40 flex items-center justify-between gap-3 shadow-inner text-left">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-300 shrink-0">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-white/60 mono font-semibold">Starter Trial Pack</div>
              <div className="text-lg font-extrabold text-amber-300 font-mono">150 Credits • ₹99 Only</div>
              <div className="text-[10px] text-emerald-400 mono font-medium">⚡ Lifetime Validity — Never Expires</div>
            </div>
          </div>
          <span className="text-[10px] bg-purple-500/20 text-purple-200 px-2.5 py-1 rounded-full border border-purple-500/40 mono font-bold">
            ⚡ Popular
          </span>
        </div>

        {/* Checklist */}
        <div className="space-y-1.5 text-xs text-white/70 text-left px-1">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Generate 10 LTX fast reels, 2 Luma Ray 3, or 1 Kling Pro video</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Google Veo 3.1 & Kling Pro available from one wallet</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Instant UPI, GPay, PhonePe & Cards via Razorpay</span>
          </div>
        </div>

        {/* Buttons */}
        <div className="space-y-2 pt-1">
          <button
            onClick={handleClaimTrial}
            className="w-full font-extrabold py-3.5 px-6 rounded-2xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-xl shadow-purple-600/40 flex items-center justify-center gap-2 text-sm sm:text-base transition-all active:scale-[0.98] cursor-pointer"
          >
            <Sparkles className="w-4.5 h-4.5 fill-amber-300 text-amber-300" />
            <span>Claim ₹99 Trial Pack (150cr) ⚡</span>
            <ArrowRight className="w-4 h-4 text-white/80" />
          </button>

          <button
            onClick={handleExplore}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-white/60 hover:text-white transition-colors cursor-pointer"
          >
            Explore Free 4K Studio Previews First →
          </button>
        </div>
      </div>
    </div>
  );
};

