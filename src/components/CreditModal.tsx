import React, { useState, useEffect } from 'react';
import { StudioUser, addUserCredits, getOrCreateStudioUser } from '../lib/supabase';
import { RAZORPAY_PACKS } from '../lib/modelConfig';
import {
  Coins,
  AlertCircle,
  CheckCircle2,
  Shield,
  Sparkles,
  X,
  CreditCard,
  RefreshCw,
  Zap,
  ShieldCheck,
} from 'lucide-react';
import { UsageBreakdownCard } from './UsageBreakdownCard';

interface CreditModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: StudioUser | null;
  requiredCredits?: number;
  onCreditsUpdated: (updatedUser: StudioUser) => void;
  insufficientWarning?: boolean;
  autoTriggerCheckout?: boolean;
  initialPlanId?: string | null;
}

export const CreditModal: React.FC<CreditModalProps> = ({
  isOpen,
  onClose,
  user,
  requiredCredits,
  onCreditsUpdated,
  insufficientWarning = false,
  autoTriggerCheckout = false,
  initialPlanId = null,
}) => {
  const isNanoPlan = (id: string) => id === 'nano' || id === 'trial';

  const [hasClaimedNanoTrial, setHasClaimedNanoTrial] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('has_claimed_nano_trial') === 'true';
    }
    return false;
  });

  const [selectedPlanId, setSelectedPlanId] = useState<string>(() => {
    if (initialPlanId) {
      return initialPlanId;
    }
    if (typeof window !== 'undefined') {
      const isClaimed = localStorage.getItem('has_claimed_nano_trial') === 'true';
      const saved = localStorage.getItem('nexverze_auto_top_up_plan_id');
      if (saved && (!isClaimed || !isNanoPlan(saved))) {
        return saved;
      }
      return isClaimed ? 'starter' : 'trial';
    }
    return 'trial';
  });
  const [guestEmail, setGuestEmail] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Auto-Top-Up state & customer consent modal
  const [autoTopUpEnabled, setAutoTopUpEnabled] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('nexverze_auto_top_up_enabled') === 'true';
    }
    return false;
  });
  const [showConsentModal, setShowConsentModal] = useState<boolean>(false);
  const [hasAcceptedConsent, setHasAcceptedConsent] = useState<boolean>(false);

  const currentCredits = user ? user.credits : 0;
  const needed = requiredCredits ? Math.max(0, requiredCredits - currentCredits) : 0;
  const selectedPlan = RAZORPAY_PACKS.find((p) => p.id === selectedPlanId) || RAZORPAY_PACKS[0];

  useEffect(() => {
    if (!isOpen) return;
    if (initialPlanId) {
      const targetPack = RAZORPAY_PACKS.find((p) => p.id === initialPlanId) || RAZORPAY_PACKS.find((p) => p.popular);
      if (targetPack) {
        setSelectedPlanId(targetPack.id);
        return;
      }
    }
    if (typeof window !== 'undefined') {
      const claimed = localStorage.getItem('has_claimed_nano_trial') === 'true';
      setHasClaimedNanoTrial(claimed);
      if (claimed && isNanoPlan(selectedPlanId)) {
        setSelectedPlanId('starter');
      }
    }
  }, [isOpen, initialPlanId]);

  useEffect(() => {
    if (isOpen && autoTriggerCheckout && !isProcessing && user) {
      const timer = setTimeout(() => {
        handleRazorpayCheckout();
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [isOpen, autoTriggerCheckout]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showConsentModal) {
          setShowConsentModal(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, showConsentModal, onClose]);

  if (!isOpen) return null;

  const handleToggleAutoTopUp = () => {
    if (!autoTopUpEnabled) {
      setShowConsentModal(true);
    } else {
      setAutoTopUpEnabled(false);
      localStorage.setItem('nexverze_auto_top_up_enabled', 'false');
    }
  };

  const confirmEnableAutoTopUp = () => {
    setAutoTopUpEnabled(true);
    localStorage.setItem('nexverze_auto_top_up_enabled', 'true');
    localStorage.setItem('nexverze_auto_top_up_plan_id', selectedPlanId);
    setShowConsentModal(false);
    setHasAcceptedConsent(false);
  };

  const handleRazorpayCheckout = async () => {
    const activeEmail = (user?.email || guestEmail).trim().toLowerCase();
    if (!activeEmail || !activeEmail.includes('@')) {
      setStatusMessage({
        type: 'error',
        text: 'Please enter a valid email address so your credits can be delivered to your account.',
      });
      return;
    }

    setIsProcessing(true);
    setStatusMessage(null);

    let activeUser = user;
    if (!activeUser) {
      try {
        activeUser = await getOrCreateStudioUser(activeEmail);
        onCreditsUpdated(activeUser);
      } catch (authErr: any) {
        setStatusMessage({
          type: 'error',
          text: 'Failed to initialize account: ' + (authErr?.message || 'Please try again.'),
        });
        setIsProcessing(false);
        return;
      }
    }

    if (isNanoPlan(selectedPlanId)) {
      const alreadyClaimed = localStorage.getItem('has_claimed_nano_trial') === 'true';
      if (alreadyClaimed || hasClaimedNanoTrial) {
        setHasClaimedNanoTrial(true);
        setStatusMessage({
          type: 'error',
          text: 'Nano Trial already claimed on this device. Please select a different pack.',
        });
        setIsProcessing(false);
        return;
      }
    }

    try {
      let orderData: any = null;
      try {
        const orderRes = await fetch('/api/razorpay/create-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: selectedPlan.amount,
            credits: selectedPlan.credits,
            planId: selectedPlan.id,
            email: activeUser.email,
            userId: activeUser.id,
          }),
        });

        if (orderRes.ok) {
          orderData = await orderRes.json();
        }
      } catch (err) {
        console.warn('API route order fallback:', err);
      }

      const Razorpay = (window as any).Razorpay;
      if (typeof Razorpay === 'function') {
        const keyId =
          orderData?.key_id ||
          (typeof process !== 'undefined' ? (process.env as any).NEXT_PUBLIC_RAZORPAY_KEY_ID : null) ||
          'rzp_test_nexverze_demo';

        const options = {
          key: keyId,
          amount: (orderData?.amount || selectedPlan.amount * 100),
          currency: 'INR',
          name: 'NexVerze Studio',
          description: `${selectedPlan.name} Pack (+${selectedPlan.credits} credits)`,
          order_id: orderData?.id || undefined,
          prefill: {
            email: activeUser.email,
          },
          theme: {
            color: '#8b5cf6',
          },
          handler: async function (response: any) {
            try {
              const verifyRes = await fetch('/api/razorpay/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id || orderData?.id || 'demo_order',
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  userId: activeUser!.id,
                  email: activeUser!.email,
                  planId: selectedPlan.id,
                  credits: selectedPlan.credits,
                  amount: selectedPlan.amount,
                }),
              });

              if (verifyRes.ok) {
                const verifyData = await verifyRes.json();
                if (verifyData.success) {
                  if (isNanoPlan(selectedPlanId)) {
                    localStorage.setItem('has_claimed_nano_trial', 'true');
                    setHasClaimedNanoTrial(true);
                  }
                  if (verifyData.user) {
                    onCreditsUpdated(verifyData.user);
                  }
                  setStatusMessage({
                    type: 'success',
                    text: `Payment verified! Added ${selectedPlan.credits} credits to ${activeUser!.email}.`,
                  });
                } else {
                  throw new Error(verifyData.error || 'Payment verification failed');
                }
              } else {
                const errJson = await verifyRes.json().catch(() => ({}));
                throw new Error(errJson.error || 'Payment signature verification failed.');
              }
            } catch (vErr: any) {
              setStatusMessage({
                type: 'error',
                text: vErr?.message || 'Payment verification failed. If your account was debited, please contact support.',
              });
            } finally {
              setIsProcessing(false);
            }
          },
          modal: {
            ondismiss: function () {
              setIsProcessing(false);
            },
          },
        };

        const rzpInstance = new Razorpay(options);
        rzpInstance.open();
        return;
      }

      // Ad-blocker or script block safeguard: NEVER award free credits if gateway cannot load!
      throw new Error('Payment gateway (Razorpay) could not load. Please disable any ad-blockers, check your network, and refresh to proceed with checkout.');
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Payment initiation failed. Please try again.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#18181b] border border-[#27272a] rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto flex flex-col shadow-2xl relative"
      >
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-center justify-between px-5 sm:px-6 pt-5 pb-3 border-b border-white/[0.06] shrink-0 relative z-10 bg-[#18181b]/90 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-600/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                NexVerze Studio Credits & Plans
              </h3>
              <div className="flex items-center gap-2 text-xs text-white/50 mono">
                <span>Your Balance:</span>
                <span className="font-bold text-purple-300">{currentCredits} cr</span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onClose()}
            className="p-2 text-white/60 hover:text-white hover:bg-white/[0.08] active:bg-white/[0.15] rounded-xl transition-all cursor-pointer ring-1 ring-white/10 hover:ring-purple-400/40 z-20"
            title="Close (Esc)"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-4 space-y-3.5 custom-scrollbar relative z-10">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-[#1b1535] via-[#120d24] to-[#1a1238] border border-purple-500/40 shadow-xl relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-400 via-purple-500 to-pink-500 flex items-center justify-center text-white shadow-lg shrink-0">
                  <ShieldCheck className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-white font-mono">{user?.email || 'Guest Session'}</span>
                    <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-purple-500 text-slate-950 font-black text-[10px] uppercase tracking-wider shadow-sm">
                      {currentCredits > 0 ? 'ACTIVE WALLET' : 'FREE PREVIEW'}
                    </span>
                  </div>
                  <div className="text-xs text-purple-200/80 mt-0.5">
                    Studio Balance: <strong className="text-amber-300 font-mono text-sm">{currentCredits} Credits</strong> • 100% Lifetime Validity
                  </div>
                </div>
              </div>
              <div className="sm:text-right shrink-0">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-200 border border-purple-500/40 text-[11px] font-bold mono">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                  All 6 AI Engines
                </span>
              </div>
            </div>
          </div>

          {/* 30-Day AI Engine Credit Usage Breakdown in User Wallet */}
          <UsageBreakdownCard
            userEmail={user?.email}
            userCredits={currentCredits}
            compact={true}
          />

          {insufficientWarning && requiredCredits && (
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs">
                <div className="font-bold text-amber-300 text-sm">
                  {currentCredits <= 0 ? 'Free Preview Mode Active • Pay-to-Generate' : 'Insufficient Credits for Generation'}
                </div>
                <p className="text-white/80 mt-1 leading-relaxed">
                  {currentCredits <= 0 ? (
                    <>
                      To generate your custom AI video with Luma Ray 3, Kling, or Veo, top up credits starting at{' '}
                      <strong className="text-amber-300 font-mono">₹99 (Nano Trial — 150 Credits)</strong> with Lifetime Validity via UPI / GPay.
                    </>
                  ) : (
                    <>
                      You currently have <strong className="text-amber-300 font-mono">{currentCredits}cr</strong> and need{' '}
                      <strong className="text-amber-300 font-mono">{requiredCredits}cr</strong> (Shortfall of{' '}
                      <span className="text-white font-bold font-mono">{needed}cr</span>). Choose a pack below to proceed.
                    </>
                  )}
                </p>
              </div>
            </div>
          )}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-950/70 via-indigo-950/60 to-purple-950/70 border border-purple-500/40 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="font-bold text-amber-300 text-xs tracking-wide uppercase">
                  ⚡ Lifetime Validity — Credits Never Expire!
                </span>
              </div>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30 mono">
                GPay / UPI 🇮🇳
              </span>
            </div>
            <p className="text-white/80 text-[11px] leading-relaxed">
              All packs unlock <strong>100% watermark-free 1080p downloads</strong>, the multi-clip <strong>Sequence Builder</strong>, and give you access to all 3 top engines (<strong>Luma Ray 3, Kling v2.5 Turbo, and Veo 3.1</strong>) from a single shared balance.
            </p>
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5 text-[10px] mono text-purple-200">
              <span className="px-2 py-0.5 rounded-md bg-white/[0.06] border border-white/10">No Monthly Trap</span>
              <span className="px-2 py-0.5 rounded-md bg-white/[0.06] border border-white/10">Instant UPI QR</span>
              <span className="px-2 py-0.5 rounded-md bg-white/[0.06] border border-white/10">Commercial License</span>
            </div>
          </div>
          {statusMessage && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                  : 'bg-red-500/10 border border-red-500/30 text-red-300'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}
          {hasClaimedNanoTrial && (
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5 text-xs text-amber-300">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <span className="font-bold text-amber-200">Device Restriction:</span> Nano Trial already claimed on this device. Please select Starter Pack or Pro Studio for lifetime credits.
              </div>
            </div>
          )}
          <div className="space-y-2.5">
            {RAZORPAY_PACKS.map((plan) => {
              const isSelected = selectedPlanId === plan.id;
              const isThisNano = isNanoPlan(plan.id);
              const isNanoClaimed = isThisNano && hasClaimedNanoTrial;

              return (
                <div
                  key={plan.id}
                  onClick={() => {
                    if (isNanoClaimed) return;
                    setSelectedPlanId(plan.id);
                  }}
                  className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between relative ${
                    isNanoClaimed
                      ? 'bg-black/40 border-red-500/20 opacity-60 cursor-not-allowed select-none'
                      : 'cursor-pointer'
                  } ${
                    isSelected && !isNanoClaimed
                      ? 'bg-purple-950/40 border-purple-500 text-white shadow-lg shadow-purple-500/15 ring-1 ring-purple-500/30'
                      : 'bg-[#121217] border-[#27272a] text-white/70 hover:border-white/20'
                  }`}
                >
                  {plan.popular && !isNanoClaimed && (
                    <div className="absolute -top-2.5 right-4 px-2.5 py-0.5 bg-gradient-to-r from-purple-500 to-indigo-500 text-slate-950 text-[10px] font-bold rounded-full uppercase tracking-wider">
                      Most Popular
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                      isNanoClaimed ? 'border-red-400/40 bg-red-950/20' : 'border-purple-400'
                    }`}>
                      {isSelected && !isNanoClaimed && <div className="w-2 h-2 rounded-full bg-purple-400" />}
                    </div>
                    <div>
                      <div className="font-semibold text-white text-sm flex items-center gap-2 flex-wrap">
                        <span className={isNanoClaimed ? 'line-through text-white/50' : ''}>{plan.name}</span>
                        {isNanoClaimed ? (
                          <span className="text-[10px] bg-red-500/20 text-red-300 border border-red-500/30 px-2 py-0.5 rounded-full font-mono font-bold">
                            Claimed on this device
                          </span>
                        ) : (
                          <span className="mono text-xs text-purple-300 font-bold">(+{plan.credits} Credits)</span>
                        )}
                        {plan.popular && !isNanoClaimed && <Sparkles className="w-3.5 h-3.5 text-purple-400" />}
                        {(plan as any).badge && !isNanoClaimed && (
                          <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded border border-amber-500/30 font-mono font-bold">
                            {(plan as any).badge}
                          </span>
                        )}
                      </div>
                      {isNanoClaimed ? (
                        <div className="text-xs text-amber-400 font-medium flex items-center gap-1.5 mt-0.5">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span>Nano Trial already claimed on this device.</span>
                        </div>
                      ) : (
                        <div className="text-xs text-white/50 mono mt-0.5">
                          {plan.comparison}
                        </div>
                      )}
                    </div>
                  </div>
                  {isNanoClaimed ? (
                    <div className="text-right shrink-0 pl-2">
                      <button
                        type="button"
                        disabled
                        aria-disabled="true"
                        className="px-2.5 py-1 rounded-lg bg-red-500/10 text-red-300/80 border border-red-500/20 text-xs font-mono cursor-not-allowed opacity-80"
                        title="Nano Trial already claimed on this device."
                      >
                        Claimed
                      </button>
                    </div>
                  ) : (
                    <div className="text-right shrink-0 pl-2">
                      <div className="font-bold text-base text-white font-mono">₹{plan.amount}</div>
                      <div className="text-[10px] text-emerald-400 mono">
                        ₹{(plan.amount / plan.credits).toFixed(2)}/cr
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="p-3.5 rounded-2xl bg-[#121217] border border-[#27272a] hover:border-purple-500/30 transition-all flex items-center justify-between gap-3 relative overflow-hidden">
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all shrink-0 ${
                  autoTopUpEnabled
                    ? 'bg-purple-600/20 text-purple-400 border-purple-500/40 shadow-sm shadow-purple-900/30'
                    : 'bg-white/[0.04] text-white/40 border-white/10'
                }`}
              >
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white tracking-tight">Auto-Top-Up</span>
                  {autoTopUpEnabled ? (
                    <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.2 rounded font-mono font-bold">
                      ON ({selectedPlan.name})
                    </span>
                  ) : (
                    <span className="text-[9px] bg-white/10 text-white/40 px-1.5 py-0.2 rounded font-mono">
                      OFF
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-white/50 leading-tight mt-0.5">
                  Automatically prompt Razorpay for default pack when credits are low for seamless generation.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleToggleAutoTopUp}
              className={`w-11 h-6 rounded-full transition-colors relative p-0.5 shrink-0 focus:outline-none focus:ring-2 focus:ring-purple-500/50 cursor-pointer ${
                autoTopUpEnabled ? 'bg-purple-600' : 'bg-white/20'
              }`}
              title={autoTopUpEnabled ? 'Click to disable Auto-Top-Up' : 'Click to enable Auto-Top-Up'}
              aria-label="Toggle Auto-Top-Up"
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-200 ${
                  autoTopUpEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
        <div className="px-5 sm:px-6 py-4 border-t border-white/[0.06] bg-[#141418] shrink-0 relative z-10 space-y-2.5">
          {!user && (
            <div className="p-3 rounded-2xl bg-purple-950/40 border border-purple-500/30 space-y-1.5 text-left">
              <label className="block text-xs font-bold text-purple-200">
                Your Email Address <span className="text-white/40 font-normal">(for instant credit delivery & account setup)</span>
              </label>
              <input
                type="email"
                required
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full bg-[#0d0d14] border border-purple-500/30 focus:border-purple-400 rounded-xl px-3 py-2 text-xs text-white placeholder-white/30 outline-none"
              />
            </div>
          )}
          {isNanoPlan(selectedPlanId) && hasClaimedNanoTrial ? (
            <div className="space-y-1.5">
              <button
                type="button"
                disabled
                aria-disabled="true"
                className="w-full bg-zinc-800/80 border border-zinc-700/80 text-zinc-400 font-bold py-3.5 px-4 rounded-xl cursor-not-allowed opacity-75 flex items-center justify-center gap-2 text-sm"
              >
                <AlertCircle className="w-4 h-4 text-amber-400" />
                <span>Nano Trial already claimed on this device</span>
              </button>
              <p className="text-[11px] text-amber-300 text-center font-medium">
                ⚠️ Nano Trial is limited to 1 claim per device. Please select another pack.
              </p>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleRazorpayCheckout}
              disabled={isProcessing}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-purple-600/25 active:scale-[0.99] transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-60 cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Launching Razorpay Checkout...</span>
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4" />
                  <span>Pay ₹{selectedPlan.amount} via Razorpay (+{selectedPlan.credits}cr)</span>
                </>
              )}
            </button>
          )}
          <div className="flex items-center justify-between text-xs text-white/40 px-1">
            <span className="mono text-[11px] flex items-center gap-1">
              <Shield className="w-3 h-3 text-emerald-400" />
              Razorpay Secured 256-bit SSL
            </span>
            <span className="text-[11px] mono">Instant Balance Update</span>
          </div>
        </div>
        {showConsentModal && (
          <div
            onClick={() => setShowConsentModal(false)}
            className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-[#181822] border border-purple-500/40 rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto p-5 sm:p-6 shadow-2xl space-y-4 relative"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-purple-600/25 border border-purple-500/40 text-purple-300 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-white tracking-tight">Customer Consent: Auto-Top-Up</h4>
                    <p className="text-xs text-purple-300">Uninterrupted AI Video Generation</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowConsentModal(false)}
                  className="p-1.5 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                  title="Close consent modal"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#0e0e16] border border-[#272738] text-xs text-white/80 space-y-2.5 leading-relaxed">
                <p>
                  When your balance falls below the cost of a requested generation (e.g. 55cr for Luma, 130cr for Kling, 295cr for Veo), NexVerze Studio will automatically launch the Razorpay checkout for your chosen default package:
                </p>
                <div className="p-2.5 rounded-xl bg-purple-950/40 border border-purple-500/30 flex items-center justify-between font-mono text-xs">
                  <span className="text-white font-bold">{selectedPlan.name} (+{selectedPlan.credits}cr)</span>
                  <span className="text-emerald-400 font-bold">₹{selectedPlan.amount} (UPI/Card)</span>
                </div>
                <div className="text-[11px] text-white/50 space-y-1 pt-1">
                  <div>• <strong>You remain in control:</strong> Razorpay prompts for your standard UPI PIN / OTP confirmation before any charge.</div>
                  <div>• <strong>Prompt preservation:</strong> Your custom prompt, duration, and aspect ratio will never be lost.</div>
                  <div>• <strong>Toggle off anytime:</strong> You can disable Auto-Top-Up with a single click here.</div>
                </div>
              </div>
              <label className="flex items-start gap-2.5 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={hasAcceptedConsent}
                  onChange={(e) => setHasAcceptedConsent(e.target.checked)}
                  className="mt-0.5 rounded border-white/20 text-purple-600 focus:ring-purple-500 w-4 h-4 bg-[#121217]"
                />
                <span className="text-xs text-white/90 leading-tight">
                  I consent to automated Razorpay checkout prompts for my default package when credits fall short during generation.
                </span>
              </label>
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowConsentModal(false);
                    setHasAcceptedConsent(false);
                  }}
                  className="px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/10 text-white/70 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!hasAcceptedConsent}
                  onClick={confirmEnableAutoTopUp}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold transition-all shadow-md shadow-purple-600/30 flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Enable Auto-Top-Up</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
