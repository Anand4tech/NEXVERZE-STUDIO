import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Zap,
  Film,
  Smartphone,
  Tv,
  Square,
  Clock,
  Sliders,
  ChevronDown,
  Check,
  RefreshCw,
  Camera,
  Layers,
  ArrowRight,
  Shuffle,
  X,
} from 'lucide-react';
import { ModelType, DurationType, FAL_MODELS } from '../lib/modelConfig';
import { enhancePrompt } from '../lib/promptEnhancer';

export interface FloatingCommandBarProps {
  prompt: string;
  onPromptChange: (newPrompt: string) => void;
  selectedModel: ModelType;
  onModelChange: (model: ModelType) => void;
  selectedRatio: '9:16' | '16:9' | '1:1';
  onRatioChange: (ratio: '9:16' | '16:9' | '1:1') => void;
  selectedDuration: DurationType;
  onDurationChange: (duration: DurationType) => void;
  motionIntensity?: number;
  onMotionIntensityChange?: (val: number) => void;
  onGenerate: () => void;
  isGenerating?: boolean;
  creditCost?: number;
  onEnhance?: () => void;
  isEnhancing?: boolean;
  placeholder?: string;
  highlightRemix?: boolean;
  remixNotice?: string | null;
  onClearPrompt?: () => void;
  className?: string;
}

export const FloatingCommandBar: React.FC<FloatingCommandBarProps> = ({
  prompt,
  onPromptChange,
  selectedModel,
  onModelChange,
  selectedRatio,
  onRatioChange,
  selectedDuration,
  onDurationChange,
  motionIntensity = 6,
  onMotionIntensityChange,
  onGenerate,
  isGenerating = false,
  creditCost = 50,
  onEnhance,
  isEnhancing = false,
  placeholder = "Describe your cinematic scene, camera angle, lighting, mood... (e.g. 'Cyberpunk street in rain, neon reflections, 8k')",
  highlightRemix = false,
  remixNotice = null,
  onClearPrompt,
  className = '',
}) => {
  // Dropdown Popovers state
  const [activePopover, setActivePopover] = useState<'model' | 'ratio' | 'duration' | 'motion' | null>(null);
  const [localEnhancing, setLocalEnhancing] = useState(false);
  const [enhanceSuccess, setEnhanceSuccess] = useState(false);
  const [activeCameraPreset, setActiveCameraPreset] = useState<string>('Pan Right');

  const containerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Close popovers on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setActivePopover(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleEnhanceClick = () => {
    if (onEnhance) {
      onEnhance();
      return;
    }
    setLocalEnhancing(true);
    setTimeout(() => {
      const enhanced = enhancePrompt(prompt, { model: selectedModel });
      onPromptChange(enhanced);
      setLocalEnhancing(false);
      setEnhanceSuccess(true);
      setTimeout(() => setEnhanceSuccess(false), 2200);
    }, 450);
  };

  const modelInfo = FAL_MODELS[selectedModel] || {
    name: 'Kling 1.5 Pro',
    tag: 'Ultra-Realism',
  };

  const cameraPresets = [
    { name: 'Dynamic Motion', icon: '⚡', desc: 'Fluid cinematic tracking' },
    { name: 'Pan Right', icon: '➡️', desc: 'Smooth horizontal glide' },
    { name: 'Slow Zoom In', icon: '🔍', desc: 'Intimate focal push' },
    { name: 'FPV Drone Flythrough', icon: '🚁', desc: 'Fast sweeping curves' },
    { name: 'Low Angle Hero', icon: '📐', desc: 'Epic majestic framing' },
  ];

  return (
    <div
      ref={containerRef}
      id="floating-command-bar"
      className={`relative rounded-3xl bg-[#0f0c1e]/90 backdrop-blur-2xl border transition-all duration-300 shadow-[0_15px_60px_rgba(168,85,247,0.22)] ${
        highlightRemix
          ? 'border-fuchsia-400 ring-4 ring-fuchsia-500/40 shadow-[0_0_60px_rgba(217,70,239,0.45)] scale-[1.01]'
          : 'border-purple-500/30 hover:border-purple-400/50'
      } ${className}`}
    >
      {/* Radiant Edge Glow */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600/30 via-fuchsia-500/30 to-pink-500/30 rounded-3xl blur-xl opacity-40 pointer-events-none -z-10" />

      {/* Remix Notice Pill (Top Floating) */}
      {remixNotice && (
        <div className="absolute -top-3.5 left-6 z-30 flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white text-[11px] font-black tracking-wider mono shadow-lg shadow-fuchsia-900/50 animate-bounce">
          <Shuffle className="w-3 h-3 animate-spin" />
          <span>{remixNotice}</span>
        </div>
      )}

      {/* TOP: Glass Prompt Input Bar */}
      <div className="p-4 sm:p-5 pb-2">
        <div className="relative flex items-start gap-2.5">
          <div className="mt-1 p-1.5 rounded-xl bg-purple-500/15 border border-purple-400/30 text-purple-300 shrink-0">
            <Sparkles className="w-4 h-4 text-fuchsia-400 animate-pulse" />
          </div>

          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              rows={2}
              value={prompt}
              onChange={(e) => onPromptChange(e.target.value)}
              placeholder={placeholder}
              className="w-full bg-transparent text-white placeholder-white/40 text-sm sm:text-base font-sans font-medium outline-none resize-none leading-relaxed selection:bg-purple-500/30 pr-8 custom-scrollbar"
            />
            {prompt && onClearPrompt && (
              <button
                type="button"
                onClick={onClearPrompt}
                className="absolute right-0 top-1 text-white/40 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
                title="Clear prompt"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* BOTTOM: Sleek Micro-Chips Command Bar */}
      <div className="relative border-t border-white/[0.08] px-3.5 sm:px-5 py-2.5 flex flex-wrap items-center justify-between gap-2 bg-[#0a0815]/60 rounded-b-3xl">
        {/* Left Side: Inline Micro-Chips */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          {/* 1. Model Chip & Popover */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setActivePopover(activePopover === 'model' ? null : 'model')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold mono flex items-center gap-1.5 border transition-all cursor-pointer ${
                activePopover === 'model'
                  ? 'bg-purple-600/30 text-purple-200 border-purple-400 shadow-md ring-1 ring-purple-400/50'
                  : 'bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border-white/10'
              }`}
            >
              <span>🎬</span>
              <span>{modelInfo.name}</span>
              <span className="text-[10px] text-white/50">▾</span>
            </button>

            {/* Model Dropdown Popover */}
            {activePopover === 'model' && (
              <div className="absolute left-0 bottom-full mb-2 z-50 w-64 p-2 rounded-2xl bg-[#141026] border border-purple-500/40 shadow-2xl space-y-1 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-2">
                <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider mono text-purple-300/70 border-b border-white/10 mb-1">
                  Select AI Video Model
                </div>
                {(Object.keys(FAL_MODELS) as ModelType[]).map((mKey) => {
                  const m = FAL_MODELS[mKey];
                  const isSelected = selectedModel === mKey;
                  return (
                    <button
                      key={mKey}
                      type="button"
                      onClick={() => {
                        onModelChange(mKey);
                        setActivePopover(null);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-purple-600/30 border border-purple-400/50 text-white font-bold'
                          : 'hover:bg-white/5 text-white/70 hover:text-white'
                      }`}
                    >
                      <div className="flex flex-col">
                        <span className="font-bold flex items-center gap-1.5">
                          {m.name}
                          {mKey === 'kling' && <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-purple-500/20 text-purple-300">Kling 1.5</span>}
                          {mKey === 'luma' && <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300">Fastest</span>}
                          {mKey === 'veo' && <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300">Veo 3.1</span>}
                        </span>
                        <span className="text-[10px] text-white/50">{m.badge || (m as any).tag || 'High fidelity'}</span>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-purple-400" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 2. Aspect Ratio Chip & Popover */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setActivePopover(activePopover === 'ratio' ? null : 'ratio')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold mono flex items-center gap-1.5 border transition-all cursor-pointer ${
                activePopover === 'ratio'
                  ? 'bg-purple-600/30 text-purple-200 border-purple-400 shadow-md ring-1 ring-purple-400/50'
                  : 'bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border-white/10'
              }`}
            >
              <span>📐</span>
              <span>{selectedRatio === '9:16' ? '9:16 Vertical' : selectedRatio === '16:9' ? '16:9 Cinema' : '1:1 Square'}</span>
              <span className="text-[10px] text-white/50">▾</span>
            </button>

            {/* Ratio Dropdown Popover */}
            {activePopover === 'ratio' && (
              <div className="absolute left-0 bottom-full mb-2 z-50 w-52 p-2 rounded-2xl bg-[#141026] border border-purple-500/40 shadow-2xl space-y-1 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-2">
                <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider mono text-purple-300/70 border-b border-white/10 mb-1">
                  Aspect Ratio
                </div>
                {[
                  { id: '9:16', label: '9:16 Vertical (Reels / TikTok)', icon: Smartphone },
                  { id: '16:9', label: '16:9 Cinema (Landscape)', icon: Tv },
                  { id: '1:1', label: '1:1 Square (Instagram Posts)', icon: Square },
                ].map((item) => {
                  const isSelected = selectedRatio === item.id;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        onRatioChange(item.id as any);
                        setActivePopover(null);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-purple-600/30 border border-purple-400/50 text-white font-bold'
                          : 'hover:bg-white/5 text-white/70 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="w-3.5 h-3.5 text-purple-400" />
                        <span>{item.label}</span>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-purple-400" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 3. Duration Chip & Popover */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setActivePopover(activePopover === 'duration' ? null : 'duration')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold mono flex items-center gap-1.5 border transition-all cursor-pointer ${
                activePopover === 'duration'
                  ? 'bg-purple-600/30 text-purple-200 border-purple-400 shadow-md ring-1 ring-purple-400/50'
                  : 'bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border-white/10'
              }`}
            >
              <span>⏱️</span>
              <span>{selectedDuration}</span>
              <span className="text-[10px] text-white/50">▾</span>
            </button>

            {/* Duration Dropdown Popover */}
            {activePopover === 'duration' && (
              <div className="absolute left-0 bottom-full mb-2 z-50 w-44 p-2 rounded-2xl bg-[#141026] border border-purple-500/40 shadow-2xl space-y-1 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-2">
                <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider mono text-purple-300/70 border-b border-white/10 mb-1">
                  Video Duration
                </div>
                {(FAL_MODELS[selectedModel]?.durations || ['5s', '10s']).map((dur) => {
                  const isSelected = selectedDuration === dur;
                  return (
                    <button
                      key={dur}
                      type="button"
                      onClick={() => {
                        onDurationChange(dur);
                        setActivePopover(null);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-purple-600/30 border border-purple-400/50 text-white font-bold'
                          : 'hover:bg-white/5 text-white/70 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        <span>{dur} Duration</span>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-purple-400" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 4. Motion & Camera Preset Chip & Popover */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setActivePopover(activePopover === 'motion' ? null : 'motion')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold mono flex items-center gap-1.5 border transition-all cursor-pointer ${
                activePopover === 'motion'
                  ? 'bg-purple-600/30 text-purple-200 border-purple-400 shadow-md ring-1 ring-purple-400/50'
                  : 'bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border-white/10'
              }`}
            >
              <span>🎥</span>
              <span>{activeCameraPreset}</span>
              <span className="text-[10px] text-white/50">▾</span>
            </button>

            {/* Motion Popover */}
            {activePopover === 'motion' && (
              <div className="absolute left-0 bottom-full mb-2 z-50 w-72 p-3 rounded-2xl bg-[#141026] border border-purple-500/40 shadow-2xl space-y-2.5 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-2">
                <div className="text-[10px] font-bold uppercase tracking-wider mono text-purple-300/70 border-b border-white/10 pb-1 flex items-center justify-between">
                  <span>Camera Direction & Motion</span>
                  <span className="text-cyan-300">Level {motionIntensity}</span>
                </div>

                {/* Slider */}
                {onMotionIntensityChange && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-white/70">
                      <span>Motion Intensity</span>
                      <span className="font-bold text-white">{motionIntensity}/10</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={10}
                      value={motionIntensity}
                      onChange={(e) => onMotionIntensityChange(Number(e.target.value))}
                      className="w-full accent-fuchsia-500 h-1.5 bg-black/40 rounded-lg cursor-pointer"
                    />
                  </div>
                )}

                {/* Camera Presets */}
                <div className="space-y-1 pt-1">
                  {cameraPresets.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => {
                        setActiveCameraPreset(preset.name);
                        if (!prompt.includes(preset.name.toLowerCase())) {
                          onPromptChange(`${prompt.trim()}, ${preset.desc.toLowerCase()}`);
                        }
                        setActivePopover(null);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs flex items-center justify-between transition-all cursor-pointer ${
                        activeCameraPreset === preset.name
                          ? 'bg-purple-600/30 text-white border border-purple-400/40 font-bold'
                          : 'hover:bg-white/5 text-white/70 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span>{preset.icon}</span>
                        <div>
                          <div className="font-medium text-white">{preset.name}</div>
                          <div className="text-[10px] text-white/50">{preset.desc}</div>
                        </div>
                      </div>
                      {activeCameraPreset === preset.name && <Check className="w-3.5 h-3.5 text-purple-400" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 5. Prompt Enhancer Chip */}
          <button
            type="button"
            onClick={handleEnhanceClick}
            disabled={isEnhancing || localEnhancing}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold mono flex items-center gap-1.5 border transition-all cursor-pointer ${
              enhanceSuccess
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-purple-600/15 hover:bg-purple-600/25 text-purple-300 border-purple-500/30 active:scale-95'
            }`}
            title="Auto-enhance prompt with photorealistic cinematic details"
          >
            {isEnhancing || localEnhancing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-purple-400" />
                <span>Enhancing...</span>
              </>
            ) : enhanceSuccess ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Enhanced!</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-fuchsia-400" />
                <span>✨ Enhance</span>
              </>
            )}
          </button>
        </div>

        {/* Right Side: Primary Generate Button */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onGenerate}
            disabled={isGenerating}
            className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-extrabold text-xs sm:text-sm mono shadow-lg shadow-fuchsia-900/40 flex items-center gap-2 transition-all active:scale-95 cursor-pointer disabled:opacity-50 ring-1 ring-purple-400/40"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
                <span>Generate Video</span>
                <span className="px-1.5 py-0.2 rounded-full bg-black/40 text-[10px] text-amber-300 border border-amber-300/30">
                  {creditCost}cr
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-white/80" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
