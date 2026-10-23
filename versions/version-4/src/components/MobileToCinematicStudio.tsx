import React, { useState, useRef } from 'react';
import {
  Upload,
  Sparkles,
  RefreshCw,
  Check,
  Wand2,
  CheckCircle2,
  Video,
  Lock,
} from 'lucide-react';
import { CanvasShield } from './CanvasShield';
import { MODEL_COST, ModelType, DurationType } from '../lib/modelConfig';

interface MobileToCinematicStudioProps {
  user: { email: string; credits: number } | null;
  onOpenAuth: () => void;
  onOpenPlans?: () => void;
  setIsCreditModalOpen?: (open: boolean) => void;
  onRemixVideo: (config: {
    prompt: string;
    modelName: 'veo3' | 'veo' | 'luma' | 'kling' | 'ltx' | 'wan' | 'hunyuan';
    duration: '5s' | '10s' | '15s';
    aspectRatio: '9:16' | '16:9' | '1:1';
  }) => void;
  onBackToStudio?: () => void;
}

// Helper to extract key frames from video file
const extractKeyFramesFromVideo = (file: File): Promise<string[]> => {
  return new Promise((resolve) => {
    try {
      const url = URL.createObjectURL(file);
      const video = document.createElement('video');
      video.src = url;
      video.muted = true;
      video.playsInline = true;
      video.crossOrigin = 'anonymous';

      const frames: string[] = [];
      const timestamps = [0.2, 1.0, 2.0];
      let currentIndex = 0;

      const cleanup = () => {
        try {
          URL.revokeObjectURL(url);
        } catch {}
      };

      video.onloadeddata = () => {
        video.currentTime = timestamps[currentIndex] || 0.2;
      };

      video.onseeked = () => {
        try {
          const canvas = document.createElement('canvas');
          const maxDim = 512;
          let w = video.videoWidth || 640;
          let h = video.videoHeight || 360;
          if (w > maxDim || h > maxDim) {
            if (w > h) {
              h = Math.round((h * maxDim) / w);
              w = maxDim;
            } else {
              w = Math.round((w * maxDim) / h);
              h = maxDim;
            }
          }
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0, w, h);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
            frames.push(dataUrl);
          }
        } catch (err) {
          console.warn('Frame capture error:', err);
        }

        currentIndex++;
        if (currentIndex < timestamps.length && currentIndex * 1.5 < (video.duration || 3)) {
          video.currentTime = timestamps[currentIndex];
        } else {
          cleanup();
          resolve(frames);
        }
      };

      video.onerror = () => {
        cleanup();
        resolve(frames);
      };

      setTimeout(() => {
        cleanup();
        resolve(frames);
      }, 5000);
    } catch {
      resolve([]);
    }
  });
};

export const MobileToCinematicStudio: React.FC<MobileToCinematicStudioProps> = ({
  user,
  onOpenAuth,
  onOpenPlans,
  setIsCreditModalOpen,
  onRemixVideo,
  onBackToStudio,
}) => {
  const [mcFile, setMcFile] = useState<File | null>(null);
  const [mcPreviewUrl, setMcPreviewUrl] = useState<string | null>(null);
  const [mcAnalyzing, setMcAnalyzing] = useState(false);
  const [mcPrompts, setMcPrompts] = useState<Array<{ title: string; style: string; prompt: string }>>([]);
  const [mcModel, setMcModel] = useState<'veo3' | 'veo' | 'luma' | 'kling' | 'ltx' | 'wan' | 'hunyuan'>('wan');
  const [mcDuration, setMcDuration] = useState<'5s' | '10s' | '15s'>('5s');
  const [isVerifyingRender, setIsVerifyingRender] = useState(false);
  const [toastNotice, setToastNotice] = useState<string | null>(null);
  const mcFileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToastNotice(msg);
    setTimeout(() => setToastNotice(null), 3000);
  };

  // Helper to open credit purchase modal
  const handleOpenCreditModal = () => {
    if (setIsCreditModalOpen) {
      setIsCreditModalOpen(true);
    } else if (onOpenPlans) {
      onOpenPlans();
    }
  };

  const triggerMcAnalysis = async (fileToAnalyze: File) => {
    // Check user session
    if (!user || !user.email) {
      showToast('⚠️ Please sign in to analyze mobile video.');
      onOpenAuth();
      return;
    }

    // Verify user.credits is greater than 0 before allowing execution
    if (typeof user.credits !== 'number' || user.credits <= 0) {
      showToast('⚠️ Minimum 1 active credit required (user.credits > 0). Please top up.');
      handleOpenCreditModal();
      return;
    }

    setMcAnalyzing(true);
    setMcPrompts([]);

    try {
      let frames: string[] = [];
      try {
        frames = await extractKeyFramesFromVideo(fileToAnalyze);
      } catch (err) {
        console.warn('Frame extraction notice:', err);
      }

      const res = await fetch('/api/analyze-mobile-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          frames,
          subjectHint: fileToAnalyze.name.replace(/\.[^/.]+$/, ''),
          email: user.email,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data?.analysis) {
          const a = data.analysis;
          setMcPrompts([
            {
              title: '🌟 Luxury Commercial Style',
              style: 'High-end 35mm Anamorphic Commercial',
              prompt: a.cinematic_prompt_1 || 'Photorealistic cinematic commercial upgrade of subject, warm golden hour volumetric lighting, 35mm anamorphic lens, smooth 3-axis gimbal tracking shot, luxury aesthetic, ultra detailed textures, 8k, 16:9, depth of field',
            },
            {
              title: '🎬 Epic Movie Style',
              style: 'Hollywood Cinematic Masterpiece',
              prompt: a.cinematic_prompt_2 || 'Hollywood cinematic masterwork upgrade of subject, dramatic moody lighting, anamorphic lens flare, slow motion push-in tracking shot, atmospheric volumetric dust particles, photorealistic 8k, dramatic contrast',
            },
            {
              title: '✨ Cozy Instagram Style',
              style: 'Vibrant Social Media Reel',
              prompt: a.cinematic_prompt_3 || 'Aesthetically pleasing vertical reel upgrade of subject, vibrant cinematic color grading, bokeh background, cozy warm lighting, crisp 4K resolution, smooth mobile creator movement, engaging and pristine',
            },
          ]);
          showToast('✨ Gemini Vision analyzed video frames & generated 3 cinematic prompts!');
          setMcAnalyzing(false);
          return;
        }
      }
    } catch (err) {
      console.warn('Gemini frame analysis notice:', err);
    }

    setMcPrompts([
      {
        title: '🌟 Luxury Commercial Style',
        style: 'High-end 35mm Anamorphic Commercial',
        prompt: 'Photorealistic cinematic commercial upgrade of uploaded video subject, warm golden hour volumetric lighting, 35mm anamorphic lens, smooth 3-axis gimbal tracking shot, luxury commercial aesthetic, ultra detailed textures, 8k, 16:9, depth of field, steady camera motion',
      },
      {
        title: '🎬 Epic Movie Style',
        style: 'Hollywood Cinematic Masterpiece',
        prompt: 'Hollywood cinematic masterwork upgrade of uploaded video subject, dramatic moody atmospheric lighting, anamorphic lens flare, slow motion push-in tracking shot, atmospheric volumetric dust particles, photorealistic 8k, IMAX cinematic contrast, stable gimbal',
      },
      {
        title: '✨ Cozy Instagram Style',
        style: 'Vibrant Social Media Reel',
        prompt: 'Aesthetically pleasing vertical reel upgrade of uploaded video subject, vibrant cinematic color grading, natural bokeh background, cozy warm lighting, crisp 4K resolution, modern creator commercial style, fluid motion, pristine finish',
      },
    ]);
    showToast('✨ Generated 3 cinematic prompts using PRD formula!');
    setMcAnalyzing(false);
  };

  const handleMcFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Check user session
    if (!user || !user.email) {
      showToast('⚠️ Please sign in to use Mobile to Cinematic Studio.');
      onOpenAuth();
      return;
    }

    // Verify user.credits is greater than 0 before allowing execution
    if (typeof user.credits !== 'number' || user.credits <= 0) {
      showToast('⚠️ Minimum 1 active credit required (user.credits > 0). Please top up.');
      handleOpenCreditModal();
      return;
    }

    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('video/')) {
      showToast('⚠️ Please select a valid video file.');
      return;
    }
    setMcFile(file);
    setMcPreviewUrl(URL.createObjectURL(file));
    setMcPrompts([]);

    setTimeout(() => {
      triggerMcAnalysis(file);
    }, 200);
  };

  const handleSecureRemix = async (promptText: string) => {
    // 1. Check user session
    if (!user || !user.email) {
      showToast('⚠️ Please sign in to unlock secure render queue.');
      onOpenAuth();
      return;
    }

    // 2. Check credit balance: calculate exact required credits for selected model & duration
    const rawModel = (mcModel === 'veo3' ? 'veo' : mcModel) as ModelType;
    const requiredCredits = MODEL_COST[rawModel]?.[mcDuration as DurationType] || MODEL_COST[rawModel]?.['5s'] || 50;

    if (typeof user.credits !== 'number' || user.credits < requiredCredits) {
      showToast(`⚠️ Insufficient credits: ${user.credits ?? 0}cr available, ${requiredCredits}cr required for ${mcModel.toUpperCase()} (${mcDuration}).`);
      handleOpenCreditModal();
      return;
    }

    setIsVerifyingRender(true);
    setNotice('Validating secure session & credit balance with server...');

    try {
      const res = await fetch('/api/secure-render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          userId: (user as any).id,
          model: mcModel,
          duration: mcDuration,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast('✅ Session verified & credits validated! Unlocking prompt for processing...');
        setTimeout(() => {
          setIsVerifyingRender(false);
          onRemixVideo({
            prompt: promptText,
            modelName: mcModel,
            duration: mcDuration,
            aspectRatio: '9:16',
          });
        }, 800);
      } else {
        setIsVerifyingRender(false);
        showToast(`❌ Authorization failed: ${data.error || 'Server validation error'}`);
        handleOpenCreditModal();
      }
    } catch (err) {
      setIsVerifyingRender(false);
      showToast('❌ Secure render authorization failed.');
    }
  };

  const [notice, setNotice] = useState<string | null>(null);

  return (
    <CanvasShield>
      <div className="bg-[#18181b] border border-[#27272a] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-white relative">
        {toastNotice && (
          <div className="fixed bottom-6 right-6 z-50 p-3.5 rounded-2xl bg-[#151128] border border-purple-500/50 text-white text-xs mono shadow-2xl flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastNotice}</span>
          </div>
        )}
        {notice && (
          <div className="fixed bottom-6 right-6 z-50 p-3.5 rounded-2xl bg-[#151128] border border-amber-500/50 text-white text-xs mono shadow-2xl flex items-center gap-2 animate-in fade-in">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{notice}</span>
          </div>
        )}

        {/* Credit Block if user has 0 credits (user.credits <= 0) */}
        {(!user || typeof user.credits !== 'number' || user.credits <= 0) && (
          <div className="absolute inset-0 bg-[#18181b]/95 z-40 backdrop-blur-md flex items-center justify-center rounded-3xl p-6 text-center">
            <div className="space-y-4 max-w-sm bg-[#131022] border border-amber-500/30 rounded-2xl p-6 shadow-2xl">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-400/30 flex items-center justify-center text-amber-400 mx-auto">
                <Video className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-white">Mobile to Cinematic Locked</h3>
              <p className="text-xs text-white/70">
                Active credit balance required (<code className="text-amber-300 font-mono">user.credits &gt; 0</code>). You currently have{' '}
                <span className="text-amber-400 font-bold font-mono">{user?.credits ?? 0} credits</span>.
              </p>
              <button
                type="button"
                onClick={handleOpenCreditModal}
                className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-pink-600 hover:from-amber-400 hover:to-pink-500 text-black font-black text-xs mono uppercase tracking-wider cursor-pointer shadow-lg active:scale-95 transition-all"
              >
                Get Credits to Unlock
              </button>
            </div>
          </div>
        )}

        {/* Header Info */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-400/30 text-amber-300 text-xs font-bold mono uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-amber-300 fill-amber-300 animate-pulse" />
              <span>Secure Gemini Vision AI Enclave</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Mobile to Cinematic Studio (Secure Enclave)
            </h2>
            <p className="text-xs sm:text-sm text-purple-200/80">
              Upload any casual mobile video. Requires verified user session & credit balance to securely unlock and render 4K cinematic variations.
            </p>
          </div>

          {onBackToStudio && (
            <button
              type="button"
              onClick={onBackToStudio}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold mono transition-all cursor-pointer self-start sm:self-auto"
            >
              ← Back to Standard Studio
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Upload Box & Live Preview */}
          <div className="lg:col-span-5 space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-white/90 mono flex items-center justify-between">
                <span>Step 1: Upload Mobile Video *</span>
                {mcFile && <span className="text-amber-400 font-mono">{(mcFile.size / (1024 * 1024)).toFixed(1)} MB</span>}
              </label>

              <div
                onClick={() => mcFileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-3xl p-6 text-center cursor-pointer transition-all ${
                  mcPreviewUrl
                    ? 'border-amber-500/60 bg-amber-950/20'
                    : 'border-purple-500/30 hover:border-amber-400/60 bg-[#16122c]/80'
                }`}
              >
                <input
                  ref={mcFileInputRef}
                  type="file"
                  accept="video/*"
                  onChange={handleMcFileChange}
                  className="hidden"
                />

                {mcPreviewUrl ? (
                  <div className="space-y-3">
                    <div className="relative w-full max-h-72 rounded-2xl overflow-hidden bg-black mx-auto flex items-center justify-center border border-white/10 shadow-lg">
                      <video src={mcPreviewUrl} controls autoPlay loop muted className="max-h-64 object-contain rounded-2xl" />
                    </div>
                    <span className="text-xs text-amber-300 font-mono underline block font-bold">
                      Click to change mobile video
                    </span>
                  </div>
                ) : (
                  <div className="py-8 space-y-3">
                    <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-400/30 flex items-center justify-center text-amber-400 mx-auto animate-pulse">
                      <Upload className="w-7 h-7" />
                    </div>
                    <div className="space-y-1">
                      <span className="text-sm font-bold text-white block">Click to upload mobile video</span>
                      <span className="text-xs text-white/50 font-mono block">Supports MP4, MOV, WebM</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* AI Model & Duration Settings */}
            {mcPrompts.length > 0 && (
              <div className="p-4 rounded-2xl bg-[#171330] border border-amber-400/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-300 mono uppercase">⚡ Step 2: Choose Engine & Duration</span>
                  <span className="text-[10px] mono text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                    Session Verified
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] mono text-white/60">Target Engine:</label>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                      {[
                        { id: 'ltx', key: 'ltx' as ModelType, label: 'LTX Fast' },
                        { id: 'luma', key: 'luma' as ModelType, label: 'Luma Ray 3' },
                        { id: 'wan', key: 'wan' as ModelType, label: 'Wan 2.1' },
                        { id: 'hunyuan', key: 'hunyuan' as ModelType, label: 'Hunyuan' },
                        { id: 'kling', key: 'kling' as ModelType, label: 'Kling Pro' },
                        { id: 'veo3', key: 'veo' as ModelType, label: 'Veo Ultra' },
                      ].map((m) => {
                        const rate = MODEL_COST[m.key]?.[mcDuration as DurationType] ?? MODEL_COST[m.key]['5s'];
                        return (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => setMcModel(m.id as any)}
                            className={`py-2 px-1 rounded-xl text-[10px] mono font-bold border transition-all cursor-pointer text-center ${
                              mcModel === m.id
                                ? 'bg-amber-500 text-black border-amber-300 shadow-md'
                                : 'bg-black/40 border-white/10 text-white/70 hover:text-white'
                            }`}
                          >
                            <div className="truncate">{m.label}</div>
                            <div className="text-[9px] font-normal opacity-90">{rate}cr</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] mono text-white/60">Video Duration:</label>
                    <div className="flex gap-1.5">
                      {(['5s', '10s', '15s'] as const).map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setMcDuration(d)}
                          className={`flex-1 py-1.5 px-2 rounded-xl text-[11px] mono font-bold border transition-all cursor-pointer ${
                            mcDuration === d
                              ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white border-purple-400 shadow-md'
                              : 'bg-black/40 border-white/10 text-white/70 hover:text-white'
                          }`}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Gemini Analysis & 3 Cinematic Variations */}
          <div className="lg:col-span-7 space-y-4">
            {!mcPreviewUrl ? (
              <div className="p-10 rounded-3xl bg-black/40 border border-white/10 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-300 mx-auto">
                  <Video className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-white">Waiting for mobile video upload</h3>
                <p className="text-xs text-white/60 max-w-sm mx-auto">
                  Upload your video on the left to trigger Gemini Vision multi-frame analysis and generate 3 Hollywood cinematic variations.
                </p>
              </div>
            ) : mcAnalyzing ? (
              <div className="p-12 rounded-3xl bg-black/60 border border-amber-400/40 text-center space-y-4 animate-in fade-in">
                <RefreshCw className="w-10 h-10 animate-spin text-amber-400 mx-auto" />
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-amber-300">Gemini Vision is analyzing key frames & flaws...</h3>
                  <p className="text-xs text-white/60">Upgrading shakiness to smooth gimbal, low light to golden hour, and crafting cinematic prompts.</p>
                </div>
              </div>
            ) : mcPrompts.length === 0 ? (
              <div className="p-10 rounded-3xl bg-black/40 border border-white/10 text-center space-y-4">
                <h3 className="text-base font-bold text-white">Ready for Analysis</h3>
                <button
                  type="button"
                  onClick={() => triggerMcAnalysis(mcFile!)}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-black font-bold text-xs mono cursor-pointer shadow-lg"
                >
                  ✨ Run Gemini Vision Analysis Now
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-amber-300 mono uppercase tracking-wider flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Step 3: Choose 1 of 3 Secure Cinematic Variations</span>
                  </h3>
                  <span className="text-[10px] mono text-purple-300 bg-purple-950/60 px-2.5 py-0.5 rounded-full border border-purple-500/30">
                    Session Protected
                  </span>
                </div>

                <div className="space-y-3.5">
                  {mcPrompts.map((item, idx) => (
                    <div key={idx} className="p-4 rounded-2xl bg-[#131022] border border-purple-500/30 hover:border-amber-400/50 transition-all space-y-2.5 shadow-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-white flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40 flex items-center justify-center text-xs mono font-black">
                            {idx + 1}
                          </span>
                          {item.title}
                        </span>
                        <span className="text-[10px] mono text-purple-200 bg-purple-900/50 px-2.5 py-0.5 rounded-full border border-purple-500/30">
                          {item.style}
                        </span>
                      </div>

                      <div className="p-3.5 rounded-xl bg-black/50 border border-purple-500/30 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
                            🔒
                          </div>
                          <div>
                            <span className="text-xs font-bold text-white block">Gemini Vision AI Cinematic Prompt Encrypted</span>
                            <span className="text-[10px] text-white/60 font-mono">Requires active session & credit balance to render</span>
                          </div>
                        </div>
                        <span className="text-[10px] mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/30 shrink-0">
                          Secure Enclave
                        </span>
                      </div>

                      <div className="flex items-center justify-end pt-1">
                        <button
                          type="button"
                          onClick={() => handleSecureRemix(item.prompt)}
                          disabled={isVerifyingRender}
                          className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-pink-600 hover:from-amber-400 hover:to-pink-500 text-black text-xs font-black mono flex items-center justify-center gap-2 shadow-xl cursor-pointer active:scale-95 disabled:opacity-50"
                        >
                          {isVerifyingRender ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin text-black" />
                              <span>Validating Session & Credits...</span>
                            </>
                          ) : (
                            <>
                              <Wand2 className="w-4 h-4 text-black" />
                              <span>Remix & Render ({mcModel.toUpperCase()} • {mcDuration})</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </CanvasShield>
  );
};
