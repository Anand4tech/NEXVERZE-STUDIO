import React, { useState } from 'react';
import {
  HelpCircle,
  Clock,
  CreditCard,
  Layers,
  ChevronDown,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Lock,
  ArrowRight,
  Zap,
  Info,
} from 'lucide-react';

interface FaqItem {
  id: string;
  category: 'validity' | 'payment' | 'sequence';
  question: string;
  badge: string;
  badgeColor: string;
  answer: React.ReactNode;
}

interface HelpFaqSectionProps {
  onOpenPlans: () => void;
  onOpenSequenceBuilder?: () => void;
}

export const HelpFaqSection: React.FC<HelpFaqSectionProps> = ({
  onOpenPlans,
  onOpenSequenceBuilder,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'validity' | 'payment' | 'sequence'>('all');
  const [openItemIds, setOpenItemIds] = useState<Record<string, boolean>>({
    'faq-validity': true,
    'faq-payment': true,
    'faq-sequence': true,
  });

  const toggleItem = (id: string) => {
    setOpenItemIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const faqItems: FaqItem[] = [
    {
      id: 'faq-validity',
      category: 'validity',
      badge: 'Lifetime Validity',
      badgeColor: 'border-purple-400/30 text-purple-300 bg-purple-500/15',
      question: 'How does Credit Validity work? Do my credits ever expire?',
      answer: (
        <div className="space-y-2.5 text-xs text-white/80 leading-relaxed">
          <p>
            <strong className="text-white">Credits have 100% Lifetime Validity</strong> and never expire! Unlike monthly SaaS tools that confiscate unused balance at the end of each billing cycle, your credits remain securely in your account until you generate videos.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px] mono">
            <div className="p-2.5 rounded-xl bg-purple-950/30 border border-purple-500/20">
              <span className="text-purple-300 font-semibold block mb-0.5">⚡ No Monthly Expiry</span>
              <span className="text-white/60">Generate 1 video today, another in 6 months. Your balance stays active permanently.</span>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-500/20">
              <span className="text-emerald-300 font-semibold block mb-0.5">🎯 Unified Wallet</span>
              <span className="text-white/60">Use your credits across Luma Ray 3, Kling Pro, or Google Veo 3.1 with zero model lock-in.</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'faq-payment',
      category: 'payment',
      badge: 'Instant Indian & Global Payments',
      badgeColor: 'border-emerald-400/30 text-emerald-300 bg-emerald-500/15',
      question: 'Which payment methods are supported for purchasing credit packs?',
      answer: (
        <div className="space-y-2.5 text-xs text-white/80 leading-relaxed">
          <p>
            All credit top-ups are processed through <strong className="text-white">Razorpay</strong>, India's leading secure payment gateway, supporting instant activation without manual wait times:
          </p>
          <ul className="space-y-1.5 text-xs text-white/70 pl-1">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span><strong className="text-white">UPI & QR Code:</strong> Google Pay, PhonePe, Paytm, BHIM, CRED, and all UPI apps.</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span><strong className="text-white">Cards:</strong> Visa, MasterCard, RuPay, and American Express Debit & Credit Cards.</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span><strong className="text-white">NetBanking:</strong> 50+ major Indian banks (HDFC, ICICI, SBI, Axis, Kotak, etc.).</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span><strong className="text-white">Optional Auto-Top-Up:</strong> Can be enabled with explicit consent to maintain uninterrupted generations.</span>
            </li>
          </ul>
        </div>
      ),
    },
    {
      id: 'faq-sequence',
      category: 'sequence',
      badge: 'Multi-Clip Timeline',
      badgeColor: 'border-cyan-400/30 text-cyan-300 bg-cyan-500/15',
      question: 'How does the Sequence Builder work for free users vs paid users?',
      answer: (
        <div className="space-y-2.5 text-xs text-white/80 leading-relaxed">
          <p>
            The <strong className="text-white">Sequence Builder</strong> is our multi-clip timeline editor that allows you to arrange generated clips, adjust playback speed (0.5x – 2x), and configure cinematic transitions (Cut, Crossfade, Wipe):
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px] mono">
            <div className="p-3 rounded-xl bg-amber-950/25 border border-amber-500/30">
              <div className="flex items-center gap-1.5 text-amber-300 font-bold mb-1">
                <Lock className="w-3.5 h-3.5" />
                <span>Free Users (Preview Mode)</span>
              </div>
              <p className="text-white/70 leading-normal">
                Can assemble, trim, re-order, configure cuts/transitions, and preview the concatenated sequence in the browser player with a subtle preview badge.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-950/25 border border-emerald-500/30">
              <div className="flex items-center gap-1.5 text-emerald-300 font-bold mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Paid / Pro Users (₹99+ Pack)</span>
              </div>
              <p className="text-white/70 leading-normal">
                Unlocks <strong className="text-emerald-300">Full Combined Video Export</strong> (.mp4 download) without watermarks, full commercial license, and instant stitch downloads.
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'faq-trial-pack',
      category: 'validity',
      badge: '₹99 Trial Pack',
      badgeColor: 'border-amber-400/30 text-amber-300 bg-amber-500/15',
      question: 'What do I get with the ₹99 Nano Trial Pack?',
      answer: (
        <div className="space-y-2 text-xs text-white/80 leading-relaxed">
          <p>
            The ₹99 Trial Pack delivers <strong className="text-amber-300 font-mono">150 Credits</strong> designed for creators to test real cinematic generation:
          </p>
          <ul className="space-y-1 text-white/70 pl-1">
            <li>• <strong>3 Full Videos on Luma Ray 3</strong> (50 cr each) OR <strong>1 Video on Kling v2.5 Turbo</strong> (120 cr).</li>
            <li>• Immediate unlock of <strong>Watermark-Free 1080p HD exports</strong>.</li>
            <li>• Full access to <strong>Sequence Builder combined file export</strong>.</li>
            <li>• 100% Lifetime Validity — credits never expire.</li>
          </ul>
        </div>
      ),
    },
    {
      id: 'faq-pricing-packs',
      category: 'payment',
      badge: 'All Credit Packs',
      badgeColor: 'border-purple-400/30 text-purple-300 bg-purple-500/15',
      question: 'What are the available Credit Packs and costs per video?',
      answer: (
        <div className="space-y-2 text-xs text-white/80 leading-relaxed">
          <p>We offer 4 pay-as-you-go credit packs with lifetime validity and no subscriptions:</p>
          <ul className="space-y-1 text-white/70 pl-1">
            <li>• <strong>⚡ Nano Trial:</strong> ₹99 for 150 Credits (~3 Luma 5s or 1 Kling video)</li>
            <li>• <strong>🎁 Starter Pack:</strong> ₹350 for 600 Credits (550 + 50 Bonus credits)</li>
            <li>• <strong>🔥 Pro Studio (Best Seller):</strong> ₹750 for 1,300 Credits (Watermark-free, commercial license)</li>
            <li>• <strong>👑 Creator Studio:</strong> ₹1,499 for 3,200 Credits (Priority 4K queue for creators & agencies)</li>
          </ul>
          <p className="pt-1 text-[11px] text-purple-200">
            <strong>Cost Per Generation:</strong> Luma Fast: 50cr (5s) / 80cr (8s) / 100cr (10s) • Kling Pro: 120cr (5s) / 192cr (8s) / 240cr (10s) • Veo Ultra: 400cr (8s) / 500cr (10s).
          </p>
        </div>
      ),
    },
    {
      id: 'faq-upscale',
      category: 'sequence',
      badge: 'AI Upscale 2x',
      badgeColor: 'border-indigo-400/30 text-indigo-300 bg-indigo-500/15',
      question: 'What is the "AI Upscale" toggle and how does it improve quality?',
      answer: (
        <p className="text-xs text-white/80 leading-relaxed">
          Enabling the <strong className="text-white">AI Upscale</strong> toggle applies specialized sub-pixel edge sharpening and enhanced contrast filters (<code className="text-purple-300 mono text-[11px]">.ai-upscale-2x-active</code>) to simulate 4K super-resolution directly in your viewport, accompanied by an animated chromatic sheen overlay (<code className="text-purple-300 mono text-[11px]">.ai-upscale-sheen</code>) for studio monitoring.
        </p>
      ),
    },
  ];

  const filteredItems = faqItems.filter(
    (item) => activeTab === 'all' || item.category === activeTab
  );

  return (
    <section className="mt-14 pt-10 border-t border-white/[0.08] relative">
      {/* Background radial glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-40 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="space-y-6 relative z-10">
        {/* Header & Badges */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="mono text-[11px] px-2.5 py-1 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30 font-semibold flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-purple-400" />
                <span>NexVerze Studio Knowledge Base</span>
              </span>
              <span className="mono text-[11px] px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-semibold hidden md:inline-flex">
                Instant Razorpay UPI Support
              </span>
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <span>Help & Frequently Asked Questions</span>
              <span className="text-amber-400 text-lg">💡</span>
            </h3>

            <p className="text-xs sm:text-sm text-white/60 max-w-2xl leading-relaxed">
              Clear answers regarding credit validity, Indian UPI/card payments, and Sequence Builder timeline functionality.
            </p>
          </div>

          {/* Quick CTA to open plans */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onOpenPlans}
              className="px-4 py-2.5 rounded-xl bg-purple-600/25 hover:bg-purple-600/40 text-purple-200 border border-purple-400/40 text-xs font-bold mono transition-all flex items-center gap-2 cursor-pointer shadow-md active:scale-95"
            >
              <Zap className="w-3.5 h-3.5 text-amber-300" />
              <span>View ₹99 Pack & Plans</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#12121c] border border-[#272738] rounded-2xl w-fit mono text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              activeTab === 'all'
                ? 'bg-purple-600 text-white font-bold shadow-md'
                : 'text-white/60 hover:text-white'
            }`}
          >
            All Questions ({faqItems.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('validity')}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'validity'
                ? 'bg-purple-600 text-white font-bold shadow-md'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <Clock className="w-3 h-3 text-purple-300" />
            <span>Credit Validity</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('payment')}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'payment'
                ? 'bg-purple-600 text-white font-bold shadow-md'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <CreditCard className="w-3 h-3 text-emerald-300" />
            <span>Payment Methods</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('sequence')}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'sequence'
                ? 'bg-purple-600 text-white font-bold shadow-md'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <Layers className="w-3 h-3 text-cyan-300" />
            <span>Sequence Builder</span>
          </button>
        </div>

        {/* Accordion FAQ Grid */}
        <div className="grid grid-cols-1 gap-3">
          {filteredItems.map((item) => {
            const isOpen = Boolean(openItemIds[item.id]);
            return (
              <div
                key={item.id}
                className={`rounded-2xl border transition-all overflow-hidden ${
                  isOpen
                    ? 'bg-[#151522] border-purple-500/40 shadow-lg shadow-purple-950/20'
                    : 'bg-[#101018] border-[#222232] hover:border-[#333348]'
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleItem(item.id)}
                  className="w-full text-left p-4 sm:p-5 flex items-center justify-between gap-4 cursor-pointer"
                >
                  <div className="space-y-1.5 pr-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${item.badgeColor}`}>
                        {item.badge}
                      </span>
                    </div>
                    <h4 className="text-sm sm:text-base font-bold text-white tracking-tight">
                      {item.question}
                    </h4>
                  </div>

                  <div
                    className={`w-8 h-8 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-center shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 bg-purple-600 text-white border-purple-500' : 'text-white/60'
                    }`}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-0 border-t border-white/[0.05] mt-1 animate-in fade-in duration-150">
                    <div className="pt-3">
                      {item.answer}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Summary Footer Helper Banner */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-purple-950/30 via-[#141028] to-indigo-950/30 border border-purple-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600/20 text-purple-300 border border-purple-500/30 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h5 className="text-xs sm:text-sm font-bold text-white">
                Have additional questions or need enterprise bulk credits?
              </h5>
              <p className="text-[11px] text-white/60 mt-0.5">
                Our support desk is active 24/7 for creator billing and studio questions at <a href="mailto:studio@nexverze.com" className="text-purple-300 hover:underline">studio@nexverze.com</a> (or <a href="mailto:hello@nexverze.com" className="text-purple-300 hover:underline">hello@nexverze.com</a> for enterprise).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onOpenSequenceBuilder && (
              <button
                type="button"
                onClick={onOpenSequenceBuilder}
                className="px-3 py-2 rounded-xl bg-white/[0.06] hover:bg-white/10 border border-white/10 text-white/80 hover:text-white text-xs mono transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                <span>Test Sequence Builder</span>
              </button>
            )}
            <button
              type="button"
              onClick={onOpenPlans}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-bold text-xs mono shadow-md transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>Get ₹99 Pack</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
