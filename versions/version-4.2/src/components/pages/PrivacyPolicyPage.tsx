import React from 'react';
import { ShieldCheck, ArrowLeft, Mail, Lock, Eye, Server, RefreshCw, FileText, CheckCircle2 } from 'lucide-react';

interface PolicyPageProps {
  onBackToStudio: () => void;
  onNavigate: (view: 'privacy' | 'terms' | 'refund' | 'contact') => void;
}

export const PrivacyPolicyPage: React.FC<PolicyPageProps> = ({ onBackToStudio, onNavigate }) => {
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
            onClick={() => onNavigate('terms')}
            className="hover:text-white transition-colors cursor-pointer"
          >
            Terms of Service
          </button>
          <span>•</span>
          <button
            onClick={() => onNavigate('refund')}
            className="hover:text-white transition-colors cursor-pointer"
          >
            Refund & Cancellation
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-semibold mono">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>NexVerze Studio Compliance</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Privacy Policy
          </h1>
          <p className="text-white/60 text-sm max-w-2xl leading-relaxed">
            NexVerze Technologies Pvt. Ltd. is committed to safeguarding creator privacy, prompt confidentiality, and generative asset ownership.
          </p>
          <div className="flex flex-wrap items-center gap-4 pt-2 text-xs mono text-white/40">
            <span>Effective Date: October 2026</span>
            <span>•</span>
            <span>Entity: NexVerze Technologies Pvt. Ltd., Chennai, India</span>
          </div>
        </div>
      </div>

      {/* Main Content Sections */}
      <div className="bg-[#12111d] border border-white/[0.08] rounded-3xl p-6 sm:p-10 space-y-8 text-white/80 text-sm leading-relaxed">
        {/* Section 1 */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Eye className="w-4 h-4 text-purple-400" />
            <span>1. Information We Collect</span>
          </h2>
          <p>
            When you use NexVerze Studio (located at <code className="text-purple-300">nexverze.com/studio</code>), we collect and process information necessary to deliver high-fidelity generative video synthesis:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-white/70">
            <li>
              <strong className="text-white">Account Details:</strong> Your email address and unique account identifier to associate purchased credits, saved generations, and sequence timeline data.
            </li>
            <li>
              <strong className="text-white">Creative Inputs & Prompts:</strong> Text prompts, reference image URLs, motion intensity parameters, and scene transition preferences provided during video generation.
            </li>
            <li>
              <strong className="text-white">Transaction Metadata:</strong> Razorpay order IDs, payment transaction IDs, currency, and timestamp. <span className="text-purple-300 font-medium">We never store your credit/debit card numbers or bank credentials;</span> all financial transactions are processed securely through PCI-DSS Level 1 certified Razorpay.
            </li>
            <li>
              <strong className="text-white">Technical Usage Data:</strong> Video resolution preferences, download counts, frame extraction requests, and browser device context to ensure fluid WebGL and video playback.
            </li>
          </ul>
        </section>

        {/* Section 2 */}
        <section className="space-y-3 border-t border-white/[0.06] pt-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Server className="w-4 h-4 text-purple-400" />
            <span>2. How We Use Your Data</span>
          </h2>
          <p>Your data is used strictly to power and protect your creative video workflow:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] space-y-1">
              <div className="font-semibold text-white text-xs flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>AI Video Synthesis</span>
              </div>
              <p className="text-xs text-white/60">
                Transmitting user prompts and reference frames to underlying high-fidelity AI models (Luma Ray 3, Kling Turbo Pro, Veo 3.1) via Fal.ai API endpoints.
              </p>
            </div>
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] space-y-1">
              <div className="font-semibold text-white text-xs flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Credit Ledger & Lifetime Validity</span>
              </div>
              <p className="text-xs text-white/60">
                Accurately maintaining your permanent credit balance, transaction receipts, and usage records with zero automated expiration.
              </p>
            </div>
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] space-y-1">
              <div className="font-semibold text-white text-xs flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Studio Customer Support</span>
              </div>
              <p className="text-xs text-white/60">
                Resolving generation issues, prompt debugging, and credit top-up requests submitted to <code className="text-purple-300">studio@nexverze.com</code>.
              </p>
            </div>
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] space-y-1">
              <div className="font-semibold text-white text-xs flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Platform Integrity & Anti-Abuse</span>
              </div>
              <p className="text-xs text-white/60">
                Enforcing community safety guidelines against harmful, malicious, or non-consensual deepfake generation.
              </p>
            </div>
          </div>
        </section>

        {/* Section 3 */}
        <section className="space-y-3 border-t border-white/[0.06] pt-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Lock className="w-4 h-4 text-purple-400" />
            <span>3. Model Training & Generative Asset Ownership</span>
          </h2>
          <p>
            <strong className="text-white">We do not sell your personal data or user-submitted prompts to external data brokers.</strong> Your prompts and outputs are processed through authorized generative infrastructure. You retain full commercial and intellectual rights to the video files created through your paid generations.
          </p>
        </section>

        {/* Section 4 */}
        <section className="space-y-3 border-t border-white/[0.06] pt-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-purple-400" />
            <span>4. Third-Party Service Providers</span>
          </h2>
          <p>NexVerze Studio collaborates with trusted industry partners to deliver reliable cloud compute:</p>
          <ul className="list-disc pl-5 space-y-1 text-white/70">
            <li><strong className="text-white">Fal.ai:</strong> GPU inference pipeline for Luma, Kling, and Veo video synthesis models.</li>
            <li><strong className="text-white">Supabase Inc.:</strong> Secure PostgreSQL database storage for user profiles and generation history.</li>
            <li><strong className="text-white">Razorpay Software Pvt. Ltd.:</strong> PCI-DSS compliant checkout and INR payment processing.</li>
          </ul>
        </section>

        {/* Section 5 */}
        <section className="space-y-3 border-t border-white/[0.06] pt-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-purple-400" />
            <span>5. Your Data Rights & Deletion</span>
          </h2>
          <p>
            Under applicable digital data protection regulations, you have the right to request access, correction, or permanent deletion of your account and generated video history. You can purge your history vault directly within the Studio UI or email our support desk at <a href="mailto:studio@nexverze.com" className="text-purple-300 underline font-medium">studio@nexverze.com</a>.
          </p>
        </section>

        {/* Section 6: Contact Support */}
        <section className="border-t border-white/[0.06] pt-6 rounded-2xl bg-purple-950/20 p-5 border border-purple-500/20">
          <h3 className="font-bold text-white text-base flex items-center gap-2 mb-2">
            <Mail className="w-4 h-4 text-purple-400" />
            <span>Data Protection & Support Contacts</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <div className="text-white/50 mono uppercase text-[10px]">Studio & Platform Support:</div>
              <a href="mailto:studio@nexverze.com" className="text-purple-300 font-bold hover:underline text-sm">
                studio@nexverze.com
              </a>
              <p className="text-white/60 mt-1">For video generation assistance, credit balance questions, and technical privacy inquiries.</p>
            </div>
            <div>
              <div className="text-white/50 mono uppercase text-[10px]">Corporate & Legal Inquiries:</div>
              <a href="mailto:hello@nexverze.com" className="text-purple-300 font-bold hover:underline text-sm">
                hello@nexverze.com
              </a>
              <p className="text-white/60 mt-1">NexVerze Technologies Pvt. Ltd., Operations in Chennai, Tamil Nadu, India.</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
