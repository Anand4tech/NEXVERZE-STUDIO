import React, { useState } from 'react';
import JSZip from 'jszip';
import { Download, CheckCircle2, GitBranch, Terminal, ExternalLink, X, FolderArchive, Sparkles } from 'lucide-react';
import { getNextJsProjectFiles } from '../lib/nextjsProjectFiles';

interface ZipExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ZipExportModal: React.FC<ZipExportModalProps> = ({ isOpen, onClose }) => {
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

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

  const handleDownloadZip = async () => {
    setDownloading(true);
    try {
      const zip = new JSZip();
      const files = getNextJsProjectFiles();

      // Add each file to ZIP
      Object.entries(files).forEach(([filePath, content]) => {
        zip.file(filePath, content);
      });

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'nexverze-studio.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setDownloaded(true);
    } catch (err) {
      console.error('ZIP generation error:', err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#18181b] border border-[#27272a] rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-5 sm:p-8 shadow-2xl relative"
      >
        {/* Glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

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

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-purple-600/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
            <FolderArchive className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <span>Next.js 14 Standalone Project</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-mono px-2 py-0.5 rounded border border-emerald-500/30">
                VERCEL READY
              </span>
            </h3>
            <p className="text-xs text-white/50 mono mt-0.5">
              Target Repo: github.com/Anand4tech/nexverze-studio
            </p>
          </div>
        </div>

        {/* Info card */}
        <div className="bg-[#121217] border border-[#27272a] rounded-2xl p-4 text-xs space-y-2 mb-5">
          <div className="flex items-center justify-between text-white/80 font-semibold">
            <span>Package Contents:</span>
            <span className="mono text-purple-300">Next.js 14 (App Router)</span>
          </div>
          <ul className="space-y-1 text-white/60 list-disc list-inside text-[11px] mono">
            <li>app/page.tsx — NexVerze Studio main video generator</li>
            <li>app/history/page.tsx — Video generation history & downloads</li>
            <li>app/layout.tsx — Dark #0a0a12, metadata & typography</li>
            <li>app/manifest.ts — PWA manifest compliance</li>
            <li>lib/supabase.ts — studio_users & studio_generations client</li>
            <li>components/QualityLockPlayer.tsx — 1080x1920 CSS lossless crop</li>
            <li>package.json, next.config.mjs, tailwind.config.ts</li>
          </ul>
        </div>

        {/* Git Instructions */}
        <div className="bg-[#0f0f17] border border-[#27272a] rounded-2xl p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-white/70 flex items-center gap-1.5 mono">
              <Terminal className="w-3.5 h-3.5 text-purple-400" />
              <span>Deployment Steps for GitHub & Vercel:</span>
            </span>
          </div>
          <pre className="text-[11px] font-mono text-emerald-400/90 overflow-x-auto p-2.5 bg-black/50 rounded-xl leading-relaxed">
{`# 1. Extract nexverze-studio.zip
cd nexverze-studio

# 2. Push to your GitHub repo:
git init
git add .
git commit -m "feat: complete NexVerze Studio Next.js 14 App Router"
git branch -M main
git remote add origin https://github.com/Anand4tech/nexverze-studio.git
git push -u origin main --force

# 3. Deploy on Vercel as: nexverze-studio.vercel.app
# Your main vercel.json rewrite already maps /studio -> nexverze-studio.vercel.app!`}
          </pre>
        </div>

        {/* Download Button */}
        <div className="space-y-3">
          <button
            onClick={handleDownloadZip}
            disabled={downloading}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-purple-600/25 active:scale-[0.99] transition-all flex items-center justify-center gap-2 text-sm"
          >
            {downloading ? (
              <span>Packaging Next.js 14 ZIP...</span>
            ) : downloaded ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Downloaded nexverze-studio.zip (Click to re-download)</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Download Complete nexverze-studio.zip</span>
              </>
            )}
          </button>

          <div className="flex items-center justify-between text-xs text-white/40 pt-1">
            <a
              href="https://github.com/Anand4tech/nexverze-studio"
              target="_blank"
              rel="noreferrer"
              className="text-purple-400 hover:underline flex items-center gap-1 mono text-[11px]"
            >
              <span>github.com/Anand4tech/nexverze-studio</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <span className="mono text-[10px]">Zero Dependencies Setup</span>
          </div>
        </div>
      </div>
    </div>
  );
};
