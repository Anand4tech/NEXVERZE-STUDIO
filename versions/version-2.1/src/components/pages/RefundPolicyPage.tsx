import React from 'react';
import { RefreshCcw, ArrowLeft, Mail, ShieldCheck, CheckCircle2, Clock, AlertTriangle, CreditCard } from 'lucide-react';

interface PolicyPageProps {
  onBackToStudio: () => void;
  onNavigate: (view: 'privacy' | 'terms' | 'refund' | 'contact') => void;
}

export const RefundPolicyPage: React.FC<PolicyPageProps> = ({ onBackToStudio, onNavigate }) => {
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300 py-4">
      {/* Top Breadcrumb & Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
        <button
          onClick={onBackToStudio}
          className="inline-flex items-center gap-2 text-xs font-semibold mono text-purple-400 hover:text-purple-300 transition-colors bg-white/[0.04] hover:bg-white/[0.08] px-3.5 py-1.5 rounded-xl border border-purple-500/30 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Studio Generator</span>
        </button>

        <div className="flex items-center gap-2 text-xs mono text-white/50">
          <button
            onClick={() => onNavigate('privacy')}
            className="hover:text-white transition-colors cursor-pointer"
          >
            Privacy Policy
          </button>
          <span>•</span>
          <button
            onClick={() => onNavigate('terms')}
            className="hover:text-white transition-colors cursor-pointer"
          >
            Terms of Service
          </button>
          <span>•</span>
          <button
            onClick={() => onNavigate('contact')}
            className="hover:text-white transition-colors cursor-pointer"
          >
            Contact Support
          </button>
        </div>
      </div>

      {/* Hero Header */}
      <div className="relative rounded-3xl bg-gradient-to-r from-[#170e2e]/90 via-[#0e0a22]/90 to-[#191036]/90 border border-purple-500/30 p-6 sm:p-8 overflow-hidden shadow-xl backdrop-blur-xl">
        <div className="space-y-3 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold mono">
            <RefreshCcw className="w-3.5 h-3.5" />
            <span>Fair Creator Guarantee</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Refund & Cancellation Policy
          </h1>
          <p className="text-white/60 text-sm max-w-2xl leading-relaxed">
            Our transparent commitment: Zero risk for failed generations, lifetime credit validity, and straightforward refund requests.
          </p>
          <div className="flex flex-wrap items-center gap-4 pt-2 text-xs mono text-white/40">
            <span>Effective Date: October 2026</span>
            <span>•</span>
            <span>Support Desk: studio@nexverze.com</span>
          </div>
        </div>
      </div>

      {/* Main Content Sections */}
      <div className="bg-[#12111d] border border-white/[0.08] rounded-3xl p-6 sm:p-10 space-y-8 text-white/80 text-sm leading-relaxed">
        {/* Core Guarantees Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-emerald-500/30 space-y-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-white text-sm">Failed Generation Protection</h3>
            <p className="text-xs text-white/60">
              If an AI model run errors or fails to yield a playable video, credits are automatically not deducted or refunded instantly.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.03] border border-purple-500/30 space-y-2">
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-white text-sm">Lifetime Credit Validity</h3>
            <p className="text-xs text-white/60">
              Credits never expire. There is no recurring expiration pressure to use up balance before an arbitrary calendar date.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.03] border border-indigo-500/30 space-y-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-white text-sm">7-Day Unused Credit Refund</h3>
            <p className="text-xs text-white/60">
              Unused credit packs can be refunded to your original payment method within 7 days of purchase upon request.
            </p>
          </div>
        </div>

        {/* Section 1 */}
        <section className="space-y-3 border-t border-white/[0.06] pt-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-purple-400" />
            <span>1. Generation Failure & Credit Restitution</span>
          </h2>
          <p>
            NexVerze Studio operates an automated ledger protection system:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-white/70">
            <li>Credits are <strong className="text-white">only finalized upon successful generation</strong> and delivery of the MP4 video URL.</li>
            <li>In the rare event of upstream GPU cluster drops, timeouts, or model parameter rejection, no credits are deducted from your balance.</li>
            <li>If you believe a video output suffered from a technical file corruption or unplayable artifact, contact our support team at <code className="text-purple-300">studio@nexverze.com</code> with the Generation ID, and we will credit your account within 24 hours.</li>
          </ul>
        </section>

        {/* Section 2 */}
        <section className="space-y-3 border-t border-white/[0.06] pt-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-purple-400" />
            <span>2. Credit Pack Purchases & Refund Eligibility</span>
          </h2>
          <div className="space-y-2 text-white/70">
            <p>
              We want every creator to have complete peace of mind. We offer refunds on purchased credit packs (including Nano Trial ₹99, Starter Pack ₹350, Pro Studio ₹750, and Creator Studio ₹1,499) under the following conditions:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>The refund request is submitted within <strong className="text-white">7 days of the transaction timestamp</strong>.</li>
              <li>The purchased credits remain <strong className="text-white">unused</strong> in your account balance (or a proportional refund for the remaining unused balance).</li>
              <li>Requests must include your registered account email and Razorpay payment receipt ID.</li>
            </ul>
          </div>
        </section>

        {/* Section 3 */}
        <section className="space-y-3 border-t border-white/[0.06] pt-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <RefreshCcw className="w-4 h-4 text-purple-400" />
            <span>3. Cancellation of Auto Top-Up</span>
          </h2>
          <p>
            NexVerze Studio does not force recurring lock-in contracts:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-white/70">
            <li>If you have enabled Auto Top-Up in the Credit Manager, you can <strong className="text-white">turn it OFF instantly at any time</strong> with a single toggle switch.</li>
            <li>Disabling Auto Top-Up incurs zero cancellation fees, and your existing credits remain fully active with lifetime validity.</li>
          </ul>
        </section>

        {/* Section 4 */}
        <section className="space-y-3 border-t border-white/[0.06] pt-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-purple-400" />
            <span>4. Refund Processing Timeline & Method</span>
          </h2>
          <p className="text-white/70">
            Once approved by our support team, refunds are issued directly through Razorpay back to your original payment method (UPI, Net Banking, Credit/Debit Card). According to standard banking settlement networks in India, the funds will reflect in your account within <strong className="text-white">5 to 7 business days</strong>.
          </p>
        </section>

        {/* Section 5: Step-by-Step Instructions */}
        <section className="border-t border-white/[0.06] pt-6 rounded-2xl bg-white/[0.02] p-5 border border-white/10 space-y-3">
          <h3 className="font-bold text-white text-base flex items-center gap-2">
            <Mail className="w-4 h-4 text-purple-400" />
            <span>How to Submit a Refund Request</span>
          </h3>
          <p className="text-xs text-white/70">
            Send an email to our dedicated studio desk:
          </p>
          <div className="bg-[#0c0c14] border border-[#272738] rounded-xl p-4 space-y-2 mono text-xs">
            <div className="flex items-center justify-between">
              <span className="text-white/50">TO:</span>
              <a href="mailto:studio@nexverze.com" className="text-purple-300 font-bold hover:underline">
                studio@nexverze.com
              </a>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/50">CC (Business):</span>
              <a href="mailto:hello@nexverze.com" className="text-white/70 hover:underline">
                hello@nexverze.com
              </a>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/50">SUBJECT:</span>
              <span className="text-emerald-400">Refund Request — [Your Order ID / Registered Email]</span>
            </div>
            <div className="text-white/60 pt-2 text-[11px] leading-relaxed border-t border-white/10">
              Please include: 1) Your registered email address, 2) Razorpay Payment ID from your receipt, 3) Reason for refund (unused pack, accidental top-up, etc.).
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
