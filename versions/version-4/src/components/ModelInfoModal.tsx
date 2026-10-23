import React from 'react';
import { FAL_MODELS, ModelType } from '../lib/modelConfig';
import { X, Play, Zap, Sparkles, CheckCircle2 } from 'lucide-react';

interface ModelInfoModalProps {
  modelKey: ModelType | null;
  onClose: () => void;
}

export const ModelInfoModal: React.FC<ModelInfoModalProps> = ({ modelKey, onClose }) => {
  // Handle Escape key
  React.useEffect(() => {
    if (!modelKey) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [modelKey, onClose]);

  if (!modelKey) return null;
  const model = FAL_MODELS[modelKey];

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#18181b] border border-[#27272a] rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-5 sm:p-7 shadow-2xl relative"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 sm:top-5 right-4 sm:right-5 p-2 text-white/60 hover:text-white hover:bg-white/10 active:bg-white/20 rounded-xl transition-all cursor-pointer ring-1 ring-white/10 hover:ring-purple-400/40 z-20"
          title="Close (Esc)"
          aria-label="Close modal"
        >
          <X className="w-5 h-5 text-white" />
        </button>

        <div className="flex items-center gap-2 mb-2">
          <span className="mono text-xs px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/30">
            {model.badge}
          </span>
          <span className="mono text-[11px] text-white/40">{model.versionName}</span>
        </div>

        <h3 className="text-2xl font-bold text-white tracking-tight">{model.name}</h3>
        <p className="text-xs text-white/60 mt-1.5 leading-relaxed">{model.description}</p>

        {/* Video Preview */}
        <div className="my-5 rounded-2xl overflow-hidden border border-[#27272a] aspect-video bg-black relative group">
          <video
            src={model.sampleVideo || '/videos/festival-dance-9-16.mp4'}
            onError={(e) => {
              (e.target as HTMLVideoElement).src = '/videos/festival-dance-9-16.mp4';
            }}
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
          />
          <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded text-[10px] mono text-purple-300">
            Sample Output
          </div>
        </div>

        {/* Specs breakdown */}
        <div className="grid grid-cols-2 gap-3 text-xs mb-6">
          <div className="bg-[#121217] p-3 rounded-xl border border-[#27272a]">
            <div className="text-[10px] text-white/40 mono uppercase">Inference Speed</div>
            <div className="text-white font-semibold mt-0.5">{model.speed}</div>
          </div>
          <div className="bg-[#121217] p-3 rounded-xl border border-[#27272a]">
            <div className="text-[10px] text-white/40 mono uppercase">Resolution & Fidelity</div>
            <div className="text-white font-semibold mt-0.5">{model.quality}</div>
          </div>
          <div className="bg-[#121217] p-3 rounded-xl border border-[#27272a]">
            <div className="text-[10px] text-white/40 mono uppercase">Audio Capability</div>
            <div className="text-white font-semibold mt-0.5">{model.audio}</div>
          </div>
          <div className="bg-[#121217] p-3 rounded-xl border border-[#27272a]">
            <div className="text-[10px] text-white/40 mono uppercase">Supported Durations</div>
            <div className="text-white font-semibold mt-0.5 mono">{model.durations.join(' • ')}</div>
          </div>
        </div>

        <div className="bg-purple-950/20 border border-purple-500/30 p-3.5 rounded-2xl text-xs text-white/80">
          <div className="font-semibold text-purple-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Best Used For:</span>
          </div>
          <p className="mt-1 text-white/70">{model.bestFor}</p>
        </div>
      </div>
    </div>
  );
};
