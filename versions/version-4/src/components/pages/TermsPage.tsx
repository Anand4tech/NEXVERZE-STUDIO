import React from 'react';
import { FileText, ArrowLeft, Mail, ShieldAlert, CheckCircle2, Sparkles, AlertCircle, Scale } from 'lucide-react';

interface PolicyPageProps {
  onBackToStudio: () => void;
  onNavigate: (view: 'privacy' | 'terms' | 'refund' | 'contact') => void;
}

export const TermsPage: React.FC<PolicyPageProps> = ({ onBackToStudio, onNavigate }) => {
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
            <Scale className="w-3.5 h-3.5" />
            <span>NexVerze Studio Legal Agreement</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Terms of Service
          </h1>
          <p className="text-white/60 text-sm max-w-2xl leading-relaxed">
            Please read these terms carefully before accessing or creating AI-generated videos with NexVerze Studio.
          </p>
          <div className="flex flex-wrap items-center gap-4 pt-2 text-xs mono text-white/40">
            <span>Effective Date: October 2026</span>
            <span>•</span>
            <span>Governing Jurisdiction: Chennai, Tamil Nadu, India</span>
          </div>
        </div>
      </div>

      {/* Main Content Sections */}
      <div className="bg-[#12111d] border border-white/[0.08] rounded-3xl p-6 sm:p-10 space-y-8 text-white/80 text-sm leading-relaxed">
        {/* Section 1 */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-purple-400" />
            <span>1. Acceptance of Terms</span>
          </h2>
          <p>
            By accessing or using NexVerze Studio (<code className="text-purple-300">nexverze.com/studio</code>), purchasing credits, or initiating AI video generation, you agree to be bound by these Terms of Service between you and <strong className="text-white">NexVerze Technologies Pvt. Ltd.</strong> If you do not agree to these terms, do not access or use the platform.
          </p>
        </section>

        {/* Section 2 */}
        <section className="space-y-3 border-t border-white/[0.06] pt-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span>2. Description of Service</span>
          </h2>
          <p>
            NexVerze Studio is a high-performance generative AI video suite providing direct inference on cutting-edge models including Luma Ray 3, Kling Turbo Pro, and Google Veo 3.1. Features include text-to-video synthesis, image-to-video animation, multi-clip timeline sequence building, 2x AI upscaling, and frame extraction.
          </p>
        </section>

        {/* Section 3 */}
        <section className="space-y-3 border-t border-white/[0.06] pt-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-purple-400" />
            <span>3. Credit System, Lifetime Validity & Pricing</span>
          </h2>
          <div className="space-y-2 text-white/70">
            <p>
              <strong className="text-white">Lifetime Credit Validity:</strong> All credits purchased through Razorpay (including Nano Trial ₹99, Starter Pack ₹350, Pro Studio ₹750, and Creator Studio ₹1,499) possess 100% lifetime validity and never expire. You are never forced to spend balance on an arbitrary monthly cadence.
            </p>
            <p>
              <strong className="text-white">Deduction upon Success:</strong> Credits are only deducted from your balance upon successful generation and delivery of a playable video asset. If an upstream GPU provider or synthesis error occurs, your balance remains untouched or is automatically restored.
            </p>
            <p>
              <strong className="text-white">Optional Auto Top-Up:</strong> Users can enable or disable automated balance replenishment at any time via the Credit Manager modal with one click.
            </p>
          </div>
        </section>

        {/* Section 4 */}
        <section className="space-y-3 border-t border-white/[0.06] pt-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <span>4. Acceptable Use & Content Policy</span>
          </h2>
          <p>
            You agree not to use NexVerze Studio to generate, distribute, or facilitate any of the following:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-white/70">
            <li>Non-consensual sexual, abusive, or exploitative imagery or deepfakes of real individuals.</li>
            <li>Content that promotes violence, terrorism, illegal weapon manufacture, or hatred against protected groups.</li>
            <li>Material infringing on third-party trademarks, copyrights, or publicity rights without appropriate authorization.</li>
            <li>Automated scraping, denial-of-service, or attempts to circumvent generation rate limits and billing ledgers.</li>
          </ul>
          <p className="text-xs text-rose-300/90 pt-1">
            Violations of this Acceptable Use Policy will result in immediate suspension of account privileges and referral to competent law enforcement agencies where mandated by applicable law.
          </p>
        </section>

        {/* Section 5 */}
        <section className="space-y-3 border-t border-white/[0.06] pt-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span>5. Intellectual Property & Commercial License</span>
          </h2>
          <p>
            As between you and NexVerze Technologies Pvt. Ltd., <strong className="text-white">you retain ownership of all prompts and resulting video files generated through your paid credits.</strong> You are granted a worldwide, irrevocable commercial license to publish, monetize, broadcast, and distribute your generated video assets for social media, cinematic production, commercial marketing, or software development.
          </p>
        </section>

        {/* Section 6 */}
        <section className="space-y-3 border-t border-white/[0.06] pt-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-purple-400" />
            <span>6. Service Availability & Disclaimers</span>
          </h2>
          <p className="text-white/70">
            While we strive for 99.9% uptime, generative AI video inference relies on high-demand cloud GPU clusters. Temporary queue delays or model maintenance may occur. The service is provided &ldquo;AS IS&rdquo; and &ldquo;AS AVAILABLE&rdquo; without warranties of any kind regarding specific aesthetic outcomes from natural language prompts.
          </p>
        </section>

        {/* Section 7 */}
        <section className="space-y-3 border-t border-white/[0.06] pt-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Scale className="w-4 h-4 text-purple-400" />
            <span>7. Governing Law & Dispute Resolution</span>
          </h2>
          <p className="text-white/70">
            These terms are governed by and construed in accordance with the laws of India. Any disputes arising out of or in connection with these terms shall be subject to the exclusive jurisdiction of the courts located in Chennai, Tamil Nadu, India.
          </p>
        </section>

        {/* Section 8: Contact */}
        <section className="border-t border-white/[0.06] pt-6 rounded-2xl bg-purple-950/20 p-5 border border-purple-500/20">
          <h3 className="font-bold text-white text-base flex items-center gap-2 mb-2">
            <Mail className="w-4 h-4 text-purple-400" />
            <span>Support & Legal Notice Inquiries</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <div className="text-white/50 mono uppercase text-[10px]">Studio Creator Support:</div>
              <a href="mailto:studio@nexverze.com" className="text-purple-300 font-bold hover:underline text-sm">
                studio@nexverze.com
              </a>
              <p className="text-white/60 mt-1">For account assistance, generation troubleshooting, and credit inquiries.</p>
            </div>
            <div>
              <div className="text-white/50 mono uppercase text-[10px]">Corporate & Official Legal:</div>
              <a href="mailto:hello@nexverze.com" className="text-purple-300 font-bold hover:underline text-sm">
                hello@nexverze.com
              </a>
              <p className="text-white/60 mt-1">NexVerze Technologies Pvt. Ltd., Chennai, Tamil Nadu, India.</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
