import React, { useState } from 'react';
import {
  Mail,
  ArrowLeft,
  Building,
  Sparkles,
  Send,
  CheckCircle2,
  Copy,
  Check,
  MessageSquare,
  HelpCircle,
  ExternalLink,
  ShieldCheck,
  Clock,
} from 'lucide-react';

interface PolicyPageProps {
  onBackToStudio: () => void;
  onNavigate: (view: 'privacy' | 'terms' | 'refund' | 'contact') => void;
}

export const ContactSupportPage: React.FC<PolicyPageProps> = ({ onBackToStudio, onNavigate }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState<'studio' | 'billing' | 'model' | 'business'>('studio');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSent, setIsSent] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  const targetEmail = category === 'business' ? 'hello@nexverze.com' : 'studio@nexverze.com';

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedEmail(text);
    setTimeout(() => setCopiedEmail(null), 2500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const mailtoUrl = `mailto:${targetEmail}?subject=${encodeURIComponent(
      `[${category.toUpperCase()}] ${subject || 'NexVerze Studio Support Request'}`
    )}&body=${encodeURIComponent(
      `Name: ${name}\nEmail: ${email}\nCategory: ${category}\n\nMessage:\n${message}\n\n--- Sent from NexVerze Studio Support Portal`
    )}`;

    // Try to trigger mailto
    window.location.href = mailtoUrl;
    setIsSent(true);
  };

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
            onClick={() => onNavigate('refund')}
            className="hover:text-white transition-colors cursor-pointer"
          >
            Refund & Cancellation
          </button>
        </div>
      </div>

      {/* Hero Header */}
      <div className="relative rounded-3xl bg-gradient-to-r from-[#170e2e]/90 via-[#0e0a22]/90 to-[#191036]/90 border border-purple-500/30 p-6 sm:p-8 overflow-hidden shadow-xl backdrop-blur-xl">
        <div className="space-y-3 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-semibold mono">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>24/7 Creator & Business Support</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Contact Support & Official Desk
          </h1>
          <p className="text-white/60 text-sm max-w-2xl leading-relaxed">
            Need assistance with video generation, prompt engineering, Razorpay credits, or enterprise API access? Reach out directly to our engineering and support teams.
          </p>
        </div>
      </div>

      {/* Two Dedicated Support Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Card 1: Studio Support */}
        <div className="rounded-3xl bg-[#12111d] border border-purple-500/30 p-6 space-y-4 shadow-lg hover:border-purple-500/50 transition-all flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="w-10 h-10 rounded-2xl bg-purple-600/20 text-purple-300 border border-purple-500/30 flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </span>
              <span className="text-[10px] mono uppercase px-2 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30">
                Primary Studio Desk
              </span>
            </div>
            <h2 className="text-lg font-bold text-white">Studio & Creator Support</h2>
            <p className="text-xs text-white/60 leading-relaxed">
              For prompt debugging, generation errors, model performance (Luma, Kling, Veo), Razorpay credit top-ups, and refunds.
            </p>
          </div>

          <div className="space-y-2 pt-2 border-t border-white/[0.06]">
            <div className="text-[10px] mono uppercase text-white/40">Studio Support Email:</div>
            <div className="flex items-center justify-between gap-2 bg-[#0c0c14] border border-[#272738] rounded-xl px-3 py-2">
              <a
                href="mailto:studio@nexverze.com"
                className="text-purple-300 font-bold text-sm hover:underline truncate"
              >
                studio@nexverze.com
              </a>
              <button
                type="button"
                onClick={() => handleCopy('studio@nexverze.com')}
                className="p-1 rounded-md bg-white/[0.05] hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                title="Copy studio email"
              >
                {copiedEmail === 'studio@nexverze.com' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] mono text-emerald-400/90 pt-1">
              <Clock className="w-3 h-3" />
              <span>Response Time: Typically within 2–6 hours</span>
            </div>
          </div>
        </div>

        {/* Card 2: Business & Enterprise Support */}
        <div className="rounded-3xl bg-[#12111d] border border-white/[0.08] p-6 space-y-4 shadow-lg hover:border-white/20 transition-all flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="w-10 h-10 rounded-2xl bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 flex items-center justify-center">
                <Building className="w-5 h-5" />
              </span>
              <span className="text-[10px] mono uppercase px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                Corporate & Enterprise
              </span>
            </div>
            <h2 className="text-lg font-bold text-white">Business Contact Support</h2>
            <p className="text-xs text-white/60 leading-relaxed">
              For corporate partnerships, bulk API licensing, press inquiries, investment relations, and general business correspondence.
            </p>
          </div>

          <div className="space-y-2 pt-2 border-t border-white/[0.06]">
            <div className="text-[10px] mono uppercase text-white/40">Official Business Email:</div>
            <div className="flex items-center justify-between gap-2 bg-[#0c0c14] border border-[#272738] rounded-xl px-3 py-2">
              <a
                href="mailto:hello@nexverze.com"
                className="text-white/90 font-bold text-sm hover:underline truncate"
              >
                hello@nexverze.com
              </a>
              <button
                type="button"
                onClick={() => handleCopy('hello@nexverze.com')}
                className="p-1 rounded-md bg-white/[0.05] hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                title="Copy business email"
              >
                {copiedEmail === 'hello@nexverze.com' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] mono text-white/50 pt-1">
              <Building className="w-3 h-3 text-white/40" />
              <span>NexVerze Technologies Pvt. Ltd., Chennai, India</span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Support Request Form */}
      <div className="bg-[#12111d] border border-white/[0.08] rounded-3xl p-6 sm:p-10 space-y-6">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Send className="w-5 h-5 text-purple-400" />
            <span>Send a Direct Support Message</span>
          </h2>
          <p className="text-xs text-white/60 mt-1">
            Fill out the form below to route your query directly to <code className="text-purple-300">{targetEmail}</code>.
          </p>
        </div>

        {isSent && (
          <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 flex items-center gap-3 text-xs">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <div>
              <p className="font-bold">Your email client has been prepared!</p>
              <p className="text-emerald-400/80 mt-0.5">
                If your email application did not open automatically, please send your inquiry directly to{' '}
                <strong className="text-white underline">{targetEmail}</strong>.
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs mono text-white/70 mb-1.5 font-medium">Your Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. John Doe"
                className="w-full bg-[#0a0a12] border border-[#272738] focus:border-purple-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-white/30 focus:outline-hidden transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs mono text-white/70 mb-1.5 font-medium">Your Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. creator@example.com"
                className="w-full bg-[#0a0a12] border border-[#272738] focus:border-purple-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-white/30 focus:outline-hidden transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs mono text-white/70 mb-1.5 font-medium">Inquiry Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full bg-[#0a0a12] border border-[#272738] focus:border-purple-500 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-hidden transition-colors cursor-pointer"
              >
                <option value="studio">Video Generation & Technical Help (studio@nexverze.com)</option>
                <option value="billing">Credit Balance & Razorpay Billing (studio@nexverze.com)</option>
                <option value="model">Model API, Luma / Kling / Veo Inquiries (studio@nexverze.com)</option>
                <option value="business">Business & Enterprise Partnerships (hello@nexverze.com)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs mono text-white/70 mb-1.5 font-medium">Subject</label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Generation speed query or Credit assistance"
                className="w-full bg-[#0a0a12] border border-[#272738] focus:border-purple-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-white/30 focus:outline-hidden transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs mono text-white/70 mb-1.5 font-medium">Message Details</label>
            <textarea
              required
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe your question, issue, or partnership proposal in detail..."
              className="w-full bg-[#0a0a12] border border-[#272738] focus:border-purple-500 rounded-xl p-3.5 text-xs text-white placeholder-white/30 focus:outline-hidden transition-colors"
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <div className="text-[11px] mono text-white/40">
              Routing to: <span className="text-purple-300 font-bold">{targetEmail}</span>
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs mono shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send Support Message</span>
            </button>
          </div>
        </form>
      </div>

      {/* Ecosystem Links Banner */}
      <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
        <div>
          <h4 className="font-bold text-white">Explore More NexVerze Products</h4>
          <p className="text-white/50 text-[11px] mt-0.5">
            Discover our flagship family archival platform and digital tools.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="https://nexverze.com/thalaimurai"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 mono text-xs transition-colors font-medium"
          >
            <span>Thalaimurai — Family Tree Vault</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
};
