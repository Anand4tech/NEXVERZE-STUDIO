import React, { useState } from 'react';
import { StudioUser, getOrCreateStudioUser } from '../lib/supabase';
import { User, Mail, Sparkles, X, ArrowRight, ShieldCheck } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserAuthenticated: (user: StudioUser) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onUserAuthenticated,
}) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle Escape key
  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setError('Please provide a valid email address.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const user = await getOrCreateStudioUser(email);
      onUserAuthenticated(user);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAdminLogin = () => {
    setEmail('anand4earn@gmail.com');
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#18181b] border border-[#27272a] rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto p-5 sm:p-7 shadow-2xl relative"
      >
        {/* Glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          type="button"
          onClick={() => onClose()}
          className="absolute top-4 sm:top-5 right-4 sm:right-5 p-2 text-white/60 hover:text-white hover:bg-white/10 active:bg-white/20 rounded-xl transition-all cursor-pointer ring-1 ring-white/10 hover:ring-purple-400/40 z-20"
          title="Close (Esc)"
          aria-label="Close modal"
        >
          <X className="w-5 h-5 text-white" />
        </button>

        {/* Icon & Heading */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-purple-600/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
            <User className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white tracking-tight">NexVerze Studio</h3>
            <p className="text-xs text-white/50">Enter your email to unlock Free Preview & cloud save</p>
          </div>
        </div>

        {/* Free Preview & Trial Callout */}
        <div className="mb-5 p-3.5 rounded-2xl bg-gradient-to-r from-purple-950/40 to-indigo-950/30 border border-purple-500/30 flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
          <div className="text-xs">
            <div className="font-semibold text-amber-300">Free Preview Active • Nano Trial at ₹99</div>
            <div className="text-white/60">Explore 9:16/16:9 previews free. Custom AI generations start at ₹99 with Lifetime Validity!</div>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-white/50 mb-1.5 mono">
              Your Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full bg-[#0f0f17] border border-[#27272a] focus:border-purple-500 focus:ring-1 focus:ring-purple-500 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white outline-none transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-purple-600/25 active:scale-[0.99] transition-all flex items-center justify-center gap-2 text-sm"
          >
            <span>{loading ? 'Connecting...' : 'Continue to Studio'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-5 pt-4 border-t border-[#27272a] flex items-center justify-between text-xs">
          <span className="text-white/40 mono text-[10px]">
            Protected by Server-Side Credit Verification
          </span>
          <span className="text-white/40 mono text-[10px] flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Supabase Auth
          </span>
        </div>
      </div>
    </div>
  );
};
