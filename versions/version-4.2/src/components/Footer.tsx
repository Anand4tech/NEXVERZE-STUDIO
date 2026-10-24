import React from 'react';
import { NexVerzeLogo } from './NexVerzeLogo';
import { ExternalLink } from 'lucide-react';

interface FooterProps {
  onNavigate?: (view: 'privacy' | 'terms' | 'refund' | 'contact') => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const handleLinkClick = (e: React.MouseEvent, view: 'privacy' | 'terms' | 'refund' | 'contact') => {
    if (onNavigate) {
      e.preventDefault();
      onNavigate(view);
    }
  };

  return (
    <footer className="w-full bg-[#08080d] border-t border-white/[0.06] mt-16 sm:mt-20">
      <div className="w-full max-w-full mx-auto px-3 sm:px-6 lg:px-10 xl:px-12 py-10 sm:py-12 lg:py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {/* Col 1 */}
        <div className="space-y-4">
          <NexVerzeLogo variant="full" size="md" />
          <p className="text-white/55 text-sm leading-relaxed max-w-sm">
            Building Digital Futures. Crafted with precision in Chennai.{' '}
            <a
              href="https://nexverze.com/thalaimurai"
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-400 hover:text-purple-300 underline"
            >
              Thalaimurai Flagship
            </a>{' '}
            & NexVerze AI Studio.
          </p>
          <p className="mono text-white/30 text-xs leading-relaxed">
            © 2025–2026 NexVerze Technologies Pvt. Ltd.<br />
            Operations: Chennai, Tamil Nadu, India
          </p>
          <div className="flex flex-wrap gap-2 pt-2">
            <span className="mono border border-white/[0.07] bg-white/[0.03] rounded-full px-2.5 py-1 text-[11px] text-white/50 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
              nexverze.com/studio
            </span>
          </div>

          {/* Support Contacts Card */}
          <div className="border border-white/[0.06] bg-[#0f0f17] rounded-xl p-3.5 mt-4 space-y-2.5">
            <div>
              <div className="mono text-[10px] tracking-wider text-purple-400/80 uppercase font-semibold">
                Studio & Page Support
              </div>
              <div className="mt-0.5">
                <a href="mailto:studio@nexverze.com" className="text-sm font-semibold text-purple-300 hover:underline">
                  studio@nexverze.com
                </a>
                <div className="mono text-[10px] text-white/40">
                  AI Generation & Credit Helpdesk
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-white/[0.06]">
              <div className="mono text-[10px] tracking-wider text-white/30 uppercase font-semibold">
                Business Contact Support
              </div>
              <div className="mt-0.5">
                <a href="mailto:hello@nexverze.com" className="text-xs text-white/90 hover:underline">
                  hello@nexverze.com
                </a>
                <div className="mono text-[10px] text-white/40">
                  Corporate & Official Inquiries
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Col 2 */}
        <div>
          <div className="mono text-xs tracking-wider text-white/30 uppercase font-semibold">
            Products
          </div>
          <div className="mt-4 flex flex-col gap-2.5 text-sm text-white/60">
            {/* Thalaimurai - Family Tree Vault Button/Link */}
            <a
              href="https://nexverze.com/thalaimurai"
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-400 hover:text-purple-300 font-medium inline-flex items-center gap-1 group transition-colors"
              title="Open Thalaimurai — Family Tree Vault"
            >
              <span>Thalaimurai — Family Tree Vault</span>
              <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </a>
            <span className="text-white font-medium flex items-center gap-1.5">
              <span>NexVerze Studio</span>
              <span className="text-[10px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded border border-purple-500/30">
                AI Video
              </span>
            </span>
            <span className="text-white/40">Upcoming Tools — NexVerze Labs</span>
            <a href="/#apps" className="hover:text-white transition-colors">
              Our Apps
            </a>
            <a href="/#services" className="hover:text-white transition-colors">
              Services
            </a>
          </div>
        </div>

        {/* Col 3 */}
        <div>
          <div className="mono text-xs tracking-wider text-white/30 uppercase font-semibold">
            Company
          </div>
          <div className="mt-4 flex flex-col gap-2.5 text-sm text-white/60">
            <span>NexVerze Technologies Pvt. Ltd.</span>
            <span>Operations: Chennai, TN, India</span>
            <div className="pt-1">
              <div className="text-[10px] mono text-white/40 uppercase">Business Contact:</div>
              <a href="mailto:hello@nexverze.com" className="text-white hover:text-purple-300 transition-colors">
                hello@nexverze.com
              </a>
            </div>
            <div>
              <div className="text-[10px] mono text-white/40 uppercase">Studio Support:</div>
              <a href="mailto:studio@nexverze.com" className="text-purple-300 hover:underline transition-colors">
                studio@nexverze.com
              </a>
            </div>
            <a href="https://www.nexverze.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors pt-1">
              www.nexverze.com ↗
            </a>
          </div>
        </div>

        {/* Col 4 */}
        <div>
          <div className="mono text-xs tracking-wider text-white/30 uppercase font-semibold">
            Legal — Compliance
          </div>
          <div className="mt-4 flex flex-col gap-2.5 text-sm text-white/60">
            <a
              href="/privacy-policy/"
              onClick={(e) => handleLinkClick(e, 'privacy')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Privacy Policy
            </a>
            <a
              href="/terms/"
              onClick={(e) => handleLinkClick(e, 'terms')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Terms of Service
            </a>
            <a
              href="/refund-policy/"
              onClick={(e) => handleLinkClick(e, 'refund')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Refund & Cancellation
            </a>
            <a
              href="/contact/"
              onClick={(e) => handleLinkClick(e, 'contact')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Contact Support
            </a>
          </div>
        </div>
      </div>

      <div className="w-full max-w-full mx-auto px-3 sm:px-6 lg:px-10 xl:px-12 py-6 border-t border-white/[0.04] flex flex-col sm:flex-row items-center justify-between gap-3 mono text-[11px] text-white/40">
        <span>
          © 2025–2026 NexVerze Technologies Pvt. Ltd. All rights reserved. • Page Support:{' '}
          <a href="mailto:studio@nexverze.com" className="text-purple-300 hover:underline">
            studio@nexverze.com
          </a>{' '}
          • Business:{' '}
          <a href="mailto:hello@nexverze.com" className="text-white/70 hover:underline">
            hello@nexverze.com
          </a>
        </span>
        <span className="flex items-center gap-2">
          <span>Built with love in Chennai</span>
          <span className="px-1.5 py-0.5 rounded bg-purple-500/15 border border-purple-400/25 text-purple-300 text-[10px] font-semibold">
            v4.2
          </span>
        </span>
      </div>
    </footer>
  );
};
