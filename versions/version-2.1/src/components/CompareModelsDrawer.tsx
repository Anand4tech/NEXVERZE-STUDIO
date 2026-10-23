import React from 'react';
import { FAL_MODELS, MODEL_COST, ModelType } from '../lib/modelConfig';
import { X, Check, ShieldCheck, Zap } from 'lucide-react';

interface CompareModelsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectModel: (m: ModelType) => void;
}

export const CompareModelsDrawer: React.FC<CompareModelsDrawerProps> = ({
  isOpen,
  onClose,
  onSelectModel,
}) => {
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

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 p-0 sm:p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#18181b] border-t sm:border border-[#27272a] rounded-t-3xl sm:rounded-3xl max-w-4xl w-full p-5 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 sm:top-5 right-4 sm:right-5 p-2 text-white/60 hover:text-white hover:bg-white/10 active:bg-white/20 rounded-xl transition-all cursor-pointer ring-1 ring-white/10 hover:ring-purple-400/40 z-20"
          title="Close (Esc)"
          aria-label="Close drawer"
        >
          <X className="w-5 h-5 text-white" />
        </button>

        <div className="mb-6">
          <span className="mono text-xs text-purple-400 font-semibold uppercase tracking-wider">
            NexVerze Studio Engine Matrix
          </span>
          <h3 className="text-2xl font-bold text-white tracking-tight mt-1">
            Compare AI Video Models
          </h3>
          <p className="text-xs text-white/50 mt-1">
            All models run directly on Fal.ai with 1080×1920 Quality Lock master resolution
          </p>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-[#27272a]">
          <table className="w-full text-left text-xs min-w-[760px]">
            <thead className="bg-[#121217] text-white/70 mono border-b border-[#27272a]">
              <tr>
                <th className="p-3.5">Feature</th>
                <th className="p-3.5 text-amber-300">LTX-Video (Lightricks)</th>
                <th className="p-3.5 text-purple-300">Luma Fast (Ray 3)</th>
                <th className="p-3.5 text-emerald-300">Wan 2.1 (Alibaba 14B)</th>
                <th className="p-3.5 text-cyan-300">Hunyuan (Tencent 13B)</th>
                <th className="p-3.5 text-indigo-300">Kling Pro (v2.5 Turbo)</th>
                <th className="p-3.5 text-pink-300">Veo Ultra (3.1 Fast)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#27272a] text-white/80">
              <tr>
                <td className="p-3.5 font-semibold text-white/60">Category</td>
                <td className="p-3.5 mono text-[11px] text-amber-300">⚡ Budget & Realtime</td>
                <td className="p-3.5 mono text-[11px] text-purple-300">🚀 Fast Viral Reels</td>
                <td className="p-3.5 mono text-[11px] text-emerald-300">💎 Open-Weight Titan</td>
                <td className="p-3.5 mono text-[11px] text-cyan-300">🎬 Film Grade VFX</td>
                <td className="p-3.5 mono text-[11px] text-indigo-300">🎥 Action & Physics</td>
                <td className="p-3.5 mono text-[11px] text-pink-300">🔥 Hollywood Studio</td>
              </tr>
              <tr>
                <td className="p-3.5 font-semibold text-white/60">Watermark Policy</td>
                <td className="p-3.5">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono text-[10px] font-bold">
                    Zero Watermark (100% Clean)
                  </span>
                </td>
                <td className="p-3.5 text-white/70">NexVerze Shield Clean</td>
                <td className="p-3.5">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono text-[10px] font-bold">
                    Zero Watermark (Native)
                  </span>
                </td>
                <td className="p-3.5">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono text-[10px] font-bold">
                    Zero Watermark (Native)
                  </span>
                </td>
                <td className="p-3.5 text-white/70">NexVerze Shield Clean</td>
                <td className="p-3.5 text-white/70">NexVerze Shield Clean</td>
              </tr>
              <tr>
                <td className="p-3.5 font-semibold text-white/60">Speed</td>
                <td className="p-3.5 font-mono text-amber-300 font-bold">5–15 sec (Blazing)</td>
                <td className="p-3.5 font-mono">45–60 sec</td>
                <td className="p-3.5 font-mono">40–70 sec</td>
                <td className="p-3.5 font-mono">50–80 sec</td>
                <td className="p-3.5 font-mono">90–120 sec</td>
                <td className="p-3.5 font-mono">2–3 min</td>
              </tr>
              <tr>
                <td className="p-3.5 font-semibold text-white/60">Resolution</td>
                <td className="p-3.5">720p / 1080p Realtime</td>
                <td className="p-3.5">1080p Crystal HD</td>
                <td className="p-3.5">1080p Master Cinema HDR</td>
                <td className="p-3.5">1080p Volumetric Depth</td>
                <td className="p-3.5">1080p HDR Master</td>
                <td className="p-3.5">Cinema 1080p Ultra-Depth</td>
              </tr>
              <tr>
                <td className="p-3.5 font-semibold text-white/60">Audio Output</td>
                <td className="p-3.5 text-white/40">Visuals Only</td>
                <td className="p-3.5 text-white/40">Visuals Only</td>
                <td className="p-3.5 text-emerald-400">Native Audio & Foley</td>
                <td className="p-3.5 text-cyan-400">Sound & Ambient SFX</td>
                <td className="p-3.5 text-emerald-400">Ambient Sound & SFX</td>
                <td className="p-3.5 text-pink-400">Integrated Voice & Foley</td>
              </tr>
              <tr>
                <td className="p-3.5 font-semibold text-white/60">Durations</td>
                <td className="p-3.5 mono">5s, 8s, 10s, 15s</td>
                <td className="p-3.5 mono">5s, 8s, 10s, 15s</td>
                <td className="p-3.5 mono">5s, 8s, 10s, 15s</td>
                <td className="p-3.5 mono">5s, 8s, 10s, 15s</td>
                <td className="p-3.5 mono">5s, 8s, 10s, 15s</td>
                <td className="p-3.5 mono">5s, 8s, 10s, 15s</td>
              </tr>
              <tr>
                <td className="p-3.5 font-semibold text-white/60">Credits (5s Rate)</td>
                <td className="p-3.5 mono font-bold text-amber-300">15cr (₹10.50)</td>
                <td className="p-3.5 mono font-bold text-purple-300">50cr (₹35.00)</td>
                <td className="p-3.5 mono font-bold text-emerald-300">80cr (₹56.00)</td>
                <td className="p-3.5 mono font-bold text-cyan-300">90cr (₹63.00)</td>
                <td className="p-3.5 mono font-bold text-indigo-300">120cr (₹84.00)</td>
                <td className="p-3.5 mono font-bold text-pink-300">270cr (₹189.00)</td>
              </tr>
              <tr>
                <td className="p-3.5 font-semibold text-white/60">Best For</td>
                <td className="p-3.5 text-white/70">Storyboards, fast reels, ultra low-cost</td>
                <td className="p-3.5 text-white/70">Fast reels, ads, product motion</td>
                <td className="p-3.5 text-white/70">Photoreal faces, physics, Kling rival</td>
                <td className="p-3.5 text-white/70">Dramatic film lighting & VFX</td>
                <td className="p-3.5 text-white/70">Cinematic physics, realism & action</td>
                <td className="p-3.5 text-white/70">Hollywood scenes & character dialogue</td>
              </tr>
              <tr>
                <td className="p-3.5 font-semibold text-white/60">Action</td>
                <td className="p-3.5">
                  <button
                    onClick={() => {
                      onSelectModel('ltx');
                      onClose();
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold text-[11px] transition-colors"
                  >
                    Select LTX
                  </button>
                </td>
                <td className="p-3.5">
                  <button
                    onClick={() => {
                      onSelectModel('luma');
                      onClose();
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold text-[11px] transition-colors"
                  >
                    Select Luma
                  </button>
                </td>
                <td className="p-3.5">
                  <button
                    onClick={() => {
                      onSelectModel('wan');
                      onClose();
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[11px] transition-colors"
                  >
                    Select Wan 2.1
                  </button>
                </td>
                <td className="p-3.5">
                  <button
                    onClick={() => {
                      onSelectModel('hunyuan');
                      onClose();
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-[11px] transition-colors"
                  >
                    Select Hunyuan
                  </button>
                </td>
                <td className="p-3.5">
                  <button
                    onClick={() => {
                      onSelectModel('kling');
                      onClose();
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-[11px] transition-colors"
                  >
                    Select Kling
                  </button>
                </td>
                <td className="p-3.5">
                  <button
                    onClick={() => {
                      onSelectModel('veo');
                      onClose();
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-pink-600 hover:bg-pink-500 text-white font-semibold text-[11px] transition-colors"
                  >
                    Select Veo
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
