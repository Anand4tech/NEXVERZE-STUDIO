import React, { useState, useRef } from 'react';
import {
  Upload,
  Sparkles,
  RefreshCw,
  Check,
  Wand2,
  CheckCircle2,
  Video,
  Camera,
  Film,
  Music,
  Subtitles,
  Play,
  Pause,
  Layers,
  AlertTriangle,
  ShieldCheck,
  ArrowUpRight,
  Sliders,
  Link2,
} from 'lucide-react';
import { CanvasShield } from './CanvasShield';
import { MODEL_COST, ModelType, DurationType } from '../lib/modelConfig';
import { SmartSoundscapeConfig, smartSoundscapeEngine } from '../lib/smartSoundscape';
import { ViralCaptionsConfig } from './TextToVideoPowerSuite';

export interface ExtractedMobileFrame {
  id: string;
  label: string;
  timestampSec: number;
  dataUrl: string;
  isLutEnhanced?: boolean;
  lutLabel?: string;
}

export interface MobileFlawDiagnosis {
  original_description: string;
  flaws_detected: string;
  upgrades_applied: string;
}

interface MobileToCinematicStudioProps {
  user: { id?: string; email: string; credits: number; is_pro?: boolean } | null;
  onUpdateUser?: (updatedUser: any) => void;
  onOpenAuth: () => void;
  onOpenPlans?: () => void;
  setIsCreditModalOpen?: (open: boolean) => void;
  onRemixVideo: (config: {
    prompt: string;
    modelName: 'veo3' | 'veo' | 'luma' | 'kling' | 'ltx' | 'wan' | 'hunyuan';
    duration: '5s' | '8s' | '10s' | '15s';
    aspectRatio: '9:16' | '16:9' | '1:1';
    heroFrameUrl?: string;
    endFrameUrl?: string;
    lockHeroFrame?: boolean;
    motionBridgeEnabled?: boolean;
    soundscapeConfig?: SmartSoundscapeConfig;
    viralCaptions?: ViralCaptionsConfig;
  }) => void;
  onSelectRenderedVideo?: (videoData: {
    videoUrl: string;
    prompt: string;
    model: ModelType;
    duration: DurationType;
    aspectRatio: '9:16' | '16:9' | '1:1';
    thumbnailUrl?: string;
  }) => void;
  onBackToStudio?: () => void;
}

export const CINEMA_LUT_PRESETS = [
  {
    id: 'lut_imax',
    label: '🎬 IMAX Teal & Orange',
    badge: 'Blockbuster Contrast',
  },
  {
    id: 'lut_golden',
    label: '🌅 Anamorphic Golden Hour',
    badge: 'Warm Sun Flare',
  },
  {
    id: 'lut_netflix',
    label: '🌙 Moody Netflix Dark',
    badge: 'Deep Shadow Drama',
  },
  {
    id: 'lut_35mm',
    label: '🎞️ 35mm Kodak Film HDR',
    badge: 'Rich Analog Grain',
  },
] as const;

// Helper to extract proportional Start (15%), Middle (50%), End (85%) frames + detect aspect ratio
const extractSmartFramesFromMobileVideo = (
  file: File
): Promise<{
  frames: ExtractedMobileFrame[];
  detectedRatio: '9:16' | '16:9' | '1:1';
  durationSec: number;
}> => {
  return new Promise((resolve) => {
    try {
      const url = URL.createObjectURL(file);
      const video = document.createElement('video');
      video.src = url;
      video.muted = true;
      video.playsInline = true;
      video.crossOrigin = 'anonymous';

      const frames: ExtractedMobileFrame[] = [];
      let timestamps = [0.3, 1.2, 2.4];
      const labels = ['Start Pose (15%)', 'Hero Action (50%)', 'End Pose (85%)'];
      let currentIndex = 0;
      let detectedRatio: '9:16' | '16:9' | '1:1' = '9:16';
      let durationSec = 3.0;

      const cleanup = () => {
        try {
          URL.revokeObjectURL(url);
        } catch {}
      };

      video.onloadedmetadata = () => {
        const vw = video.videoWidth || 720;
        const vh = video.videoHeight || 1280;
        if (vw > vh * 1.15) {
          detectedRatio = '16:9';
        } else if (Math.abs(vw - vh) <= vw * 0.15) {
          detectedRatio = '1:1';
        } else {
          detectedRatio = '9:16';
        }

        const rawDur = Number.isFinite(video.duration) && video.duration > 0.5 ? video.duration : 4.0;
        durationSec = Number(rawDur.toFixed(1));
        timestamps = [
          Number(Math.max(0.15, rawDur * 0.15).toFixed(2)),
          Number(Math.max(0.4, rawDur * 0.5).toFixed(2)),
          Number(Math.max(0.7, Math.min(rawDur - 0.1, rawDur * 0.85)).toFixed(2)),
        ];
      };

      video.onloadeddata = () => {
        video.currentTime = timestamps[0] || 0.2;
      };

      video.onseeked = () => {
        try {
          const canvas = document.createElement('canvas');
          const maxDim = 768;
          let w = video.videoWidth || 720;
          let h = video.videoHeight || 1280;
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
            const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
            frames.push({
              id: `frame-${currentIndex + 1}-${Date.now()}`,
              label: labels[currentIndex] || `Frame #${currentIndex + 1}`,
              timestampSec: timestamps[currentIndex] || 0.2,
              dataUrl,
            });
          }
        } catch (err) {
          console.warn('Frame capture error:', err);
        }

        currentIndex++;
        if (currentIndex < timestamps.length) {
          video.currentTime = timestamps[currentIndex];
        } else {
          cleanup();
          resolve({ frames, detectedRatio, durationSec });
        }
      };

      video.onerror = () => {
        cleanup();
        resolve({ frames, detectedRatio, durationSec });
      };

      setTimeout(() => {
        cleanup();
        resolve({ frames, detectedRatio, durationSec });
      }, 6500);
    } catch {
      resolve({ frames: [], detectedRatio: '9:16', durationSec: 0 });
    }
  });
};

export const MobileToCinematicStudio: React.FC<MobileToCinematicStudioProps> = ({
  user,
  onUpdateUser,
  onOpenAuth,
  onOpenPlans,
  setIsCreditModalOpen,
  onRemixVideo,
  onSelectRenderedVideo,
  onBackToStudio,
}) => {
  const [mcFile, setMcFile] = useState<File | null>(null);
  const [mcPreviewUrl, setMcPreviewUrl] = useState<string | null>(null);
  const [mcVideoDurationSec, setMcVideoDurationSec] = useState<number>(0);
  const [mcAspectRatio, setMcAspectRatio] = useState<'9:16' | '16:9' | '1:1'>('9:16');
  const [extractedFrames, setExtractedFrames] = useState<ExtractedMobileFrame[]>([]);
  const [selectedHeroFrameIdx, setSelectedHeroFrameIdx] = useState<number>(1); // Default Middle Hero Frame (50%)
  const [subjectHintInput, setSubjectHintInput] = useState<string>('');

  // Feature #1: Metered Gemini Vision Scan (5 Cr) & Flaw Diagnosis
  const [mcAnalyzing, setMcAnalyzing] = useState(false);
  const [flawDiagnosis, setFlawDiagnosis] = useState<MobileFlawDiagnosis | null>(null);
  const [mcPrompts, setMcPrompts] = useState<Array<{ title: string; style: string; prompt: string }>>([]);

  // Feature #2: Lock Original Hero Frame (Image-to-Video Restyle +10 Cr vs Pure Concept 0 Cr)
  const [lockHeroFrame, setLockHeroFrame] = useState<boolean>(true);

  // Feature #3: 1-Click Cinema LUT & 4K Frame Relight (8 Cr / ₹5)
  const [selectedLutId, setSelectedLutId] = useState<string>(CINEMA_LUT_PRESETS[0].id);
  const [isEnhancingFrameLut, setIsEnhancingFrameLut] = useState<boolean>(false);

  // Feature #4: Start-to-End Mobile Motion Bridge (+10 Cr)
  const [motionBridgeEnabled, setMotionBridgeEnabled] = useState<boolean>(false);

  // Feature #5: Trailer Soundscape (+5 Cr) & Auto Viral Captions (+5 Cr)
  const [soundscapeConfig, setSoundscapeConfig] = useState<SmartSoundscapeConfig>({
    enabled: false,
    bgmMood: 'mass',
    sfxType: 'rain',
    bgmVolume: 80,
    sfxVolume: 65,
  });
  const [viralCaptions, setViralCaptions] = useState<ViralCaptionsConfig>({
    enabled: false,
    style: 'hormozi',
    text: 'SHOT ON MOBILE -> UPGRADED TO 8K CINEMA 🔥',
    position: 'bottom',
  });

  // Feature #6: Direct In-Place Render & Before/After Split-Screen Comparison Player
  const [mcModel, setMcModel] = useState<'veo3' | 'veo' | 'luma' | 'kling' | 'ltx' | 'wan' | 'hunyuan'>('kling');
  const [mcDuration, setMcDuration] = useState<'5s' | '8s' | '10s' | '15s'>('5s');
  const [isRenderingDirect, setIsRenderingDirect] = useState<boolean>(false);
  const [renderProgress, setRenderProgress] = useState<number>(0);
  const [renderStage, setRenderStage] = useState<string>('');
  const [renderedCinemaUrl, setRenderedCinemaUrl] = useState<string | null>(null);
  const [renderedTitle, setRenderedTitle] = useState<string>('');
  const [isSyncPlaying, setIsSyncPlaying] = useState<boolean>(false);

  const [toastNotice, setToastNotice] = useState<string | null>(null);
  const mcFileInputRef = useRef<HTMLInputElement>(null);
  const sourceVideoRef = useRef<HTMLVideoElement>(null);
  const beforeVideoRef = useRef<HTMLVideoElement>(null);
  const afterVideoRef = useRef<HTMLVideoElement>(null);

  const showToast = (msg: string) => {
    setToastNotice(msg);
    setTimeout(() => setToastNotice(null), 4000);
  };

  const handleOpenCreditModal = () => {
    if (setIsCreditModalOpen) {
      setIsCreditModalOpen(true);
    } else if (onOpenPlans) {
      onOpenPlans();
    }
  };

  const syncUserCredits = (newCredits: number) => {
    if (!user) return;
    const updated = { ...user, credits: newCredits };
    if (onUpdateUser) {
      onUpdateUser(updated);
    }
    try {
      localStorage.setItem('nexverze_studio_user', JSON.stringify(updated));
    } catch {}
  };

  // Calculate live credit breakdown for Direct Render
  const rawModelKey = (mcModel === 'veo3' ? 'veo' : mcModel) as ModelType;
  const baseVideoCredits = MODEL_COST[rawModelKey]?.[mcDuration as DurationType] || MODEL_COST[rawModelKey]?.['5s'] || 55;
  const heroLockCredits = lockHeroFrame && extractedFrames.length > 0 ? 10 : 0;
  const bridgeCredits = motionBridgeEnabled && extractedFrames.length >= 2 ? 10 : 0;
  const soundscapeCredits = soundscapeConfig.enabled ? 5 : 0;
  const captionsCredits = viralCaptions.enabled ? 5 : 0;
  const totalRenderCredits = baseVideoCredits + heroLockCredits + bridgeCredits + soundscapeCredits + captionsCredits;
  const totalRenderInr = Math.round(totalRenderCredits * 0.66);

  // Step 1: Upload Mobile Video & Extract Proportional Keyframes (Start 15%, Mid 50%, End 85%)
  const handleMcFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !user.email) {
      showToast('⚠️ Please sign in to use Mobile to Cinematic Studio.');
      onOpenAuth();
      return;
    }

    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('video/')) {
      showToast('⚠️ Please select a valid video file (MP4, MOV, WebM).');
      return;
    }

    setMcFile(file);
    const previewObjUrl = URL.createObjectURL(file);
    setMcPreviewUrl(previewObjUrl);
    setMcPrompts([]);
    setFlawDiagnosis(null);
    setRenderedCinemaUrl(null);
    const defaultSubject = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
    setSubjectHintInput(defaultSubject);

    const { frames, detectedRatio, durationSec } = await extractSmartFramesFromMobileVideo(file);
    setExtractedFrames(frames);
    setSelectedHeroFrameIdx(frames.length >= 2 ? 1 : 0);
    setMcAspectRatio(detectedRatio);
    setMcVideoDurationSec(durationSec);

    showToast(
      `✓ Extracted ${frames.length} proportional keyframes (${detectedRatio} • ${durationSec}s). Click "Scan with Gemini Vision (5 Cr)" to diagnose & generate 3 cinema prompts!`
    );
  };

  // Custom Frame Capture at current video scrubber position
  const handleCaptureCurrentVideoFrame = () => {
    const vid = sourceVideoRef.current;
    if (!vid) return;
    try {
      const canvas = document.createElement('canvas');
      const maxDim = 768;
      let w = vid.videoWidth || 720;
      let h = vid.videoHeight || 1280;
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
      if (!ctx) return;
      ctx.drawImage(vid, 0, 0, w, h);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      const timeSec = Number((vid.currentTime || 0).toFixed(2));
      const newFrame: ExtractedMobileFrame = {
        id: `custom-frame-${Date.now()}`,
        label: `Custom @ ${timeSec}s`,
        timestampSec: timeSec,
        dataUrl,
      };
      setExtractedFrames((prev) => {
        const updated = [...prev, newFrame].slice(0, 6);
        setSelectedHeroFrameIdx(updated.length - 1);
        return updated;
      });
      showToast(`📸 Captured custom Hero Frame at ${timeSec}s!`);
    } catch {
      showToast('⚠️ Could not capture frame from video player.');
    }
  };

  // Feature #1: Metered Gemini Vision Scan (5 Credits / ₹3.30)
  const triggerMcAnalysis = async () => {
    if (!user || !user.email) {
      showToast('⚠️ Please sign in to analyze mobile video.');
      onOpenAuth();
      return;
    }

    const SCAN_COST = 5;
    if (typeof user.credits !== 'number' || user.credits < SCAN_COST) {
      showToast(`⚠️ Gemini Vision Multi-Frame Scan requires ${SCAN_COST} Credits (₹3.30). Please top up!`);
      handleOpenCreditModal();
      return;
    }

    setMcAnalyzing(true);

    try {
      const frameUrls = extractedFrames.slice(0, 3).map((f) => f.dataUrl);
      const res = await fetch('/api/analyze-mobile-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          frames: frameUrls,
          subjectHint: subjectHintInput.trim() || mcFile?.name.replace(/\.[^/.]+$/, '') || 'mobile video subject',
          aspectRatio: mcAspectRatio,
          email: user.email,
          userId: user.id,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 402) {
          handleOpenCreditModal();
        }
        showToast(`❌ ${data.error || 'Failed to analyze mobile video'}`);
        setMcAnalyzing(false);
        return;
      }

      if (typeof data.remaining_credits === 'number') {
        syncUserCredits(data.remaining_credits);
      }

      const a = data?.analysis || {};
      setFlawDiagnosis({
        original_description:
          a.original_description ||
          `Mobile video capturing ${subjectHintInput || 'subject'} across start, middle, and end frames`,
        flaws_detected:
          a.flaws_detected || 'Handheld camera shake, flat indoor/ambient lighting, mobile sensor noise',
        upgrades_applied:
          a.upgrades_applied ||
          '3-Axis Steadicam Gimbal Stabilization, 35mm Anamorphic Golden Hour Relighting & Shallow f/1.4 Bokeh',
      });

      setMcPrompts([
        {
          title: '🌟 Luxury Commercial Style',
          style: 'High-end 35mm Anamorphic Commercial',
          prompt:
            a.cinematic_prompt_1 ||
            `Photorealistic cinematic commercial upgrade of ${subjectHintInput || 'subject'}, warm golden hour volumetric lighting, 35mm anamorphic lens, smooth 3-axis gimbal tracking shot, luxury aesthetic, ultra detailed textures, 8k, ${mcAspectRatio}, shallow depth of field`,
        },
        {
          title: '🎬 Epic Movie Style',
          style: 'Hollywood IMAX Masterpiece',
          prompt:
            a.cinematic_prompt_2 ||
            `Hollywood cinematic masterwork upgrade of ${subjectHintInput || 'subject'}, dramatic moody lighting, anamorphic lens flare, slow motion push-in tracking shot, atmospheric volumetric dust particles, photorealistic 8k, ${mcAspectRatio}, dramatic contrast`,
        },
        {
          title: '✨ Cozy Instagram Reel Style',
          style: 'Vibrant Creator Commercial',
          prompt:
            a.cinematic_prompt_3 ||
            `Aesthetically pleasing ${mcAspectRatio} creator reel upgrade of ${subjectHintInput || 'subject'}, vibrant cinematic color grading, natural bokeh background, cozy warm lighting, crisp 4K resolution, smooth fluid camera orbit`,
        },
      ]);

      showToast('✨ Gemini Vision diagnosed flaws & unlocked 3 editable cinematic prompts (-5 Cr)!');
    } catch {
      showToast('❌ Network error during Gemini Vision scan.');
    } finally {
      setMcAnalyzing(false);
    }
  };

  // Feature #3: 1-Click Cinema LUT & 4K Frame Relight (8 Credits / ₹5.00)
  const handleEnhanceSelectedFrameLut = async () => {
    const activeFrame = extractedFrames[selectedHeroFrameIdx];
    if (!activeFrame) {
      showToast('⚠️ Please select a frame first.');
      return;
    }

    if (!user || (user.credits || 0) < 8) {
      showToast('🪄 4K Cinema LUT Relight requires 8 Credits (₹5.00). Please top up!');
      handleOpenCreditModal();
      return;
    }

    const lutPreset = CINEMA_LUT_PRESETS.find((l) => l.id === selectedLutId) || CINEMA_LUT_PRESETS[0];
    setIsEnhancingFrameLut(true);

    try {
      const res = await fetch('/api/enhance-photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: activeFrame.dataUrl,
          mode: selectedLutId,
          userId: user.id,
          email: user.email,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 402) {
          handleOpenCreditModal();
        }
        showToast(`❌ ${data.error || 'Failed to apply 4K Cinema LUT'}`);
        return;
      }

      if (typeof data.remaining_credits === 'number') {
        syncUserCredits(data.remaining_credits);
      }

      const enhancedUrl = data.enhanced_image_url || activeFrame.dataUrl;
      setExtractedFrames((prev) =>
        prev.map((item, idx) =>
          idx === selectedHeroFrameIdx
            ? {
                ...item,
                dataUrl: enhancedUrl,
                isLutEnhanced: true,
                lutLabel: lutPreset.label,
              }
            : item
        )
      );
      showToast(`🪄 Applied ${lutPreset.label} + 4K Relight to ${activeFrame.label} (-8 Cr / ₹5)!`);
    } catch {
      showToast('❌ Network error applying 4K Cinema LUT.');
    } finally {
      setIsEnhancingFrameLut(false);
    }
  };

  // Feature #6A: Direct In-Place Render inside Mobile-to-Cinematic Studio
  const handleDirectRender = async (promptText: string, variationTitle: string) => {
    if (!user || !user.email) {
      showToast('⚠️ Please sign in to render cinematic video.');
      onOpenAuth();
      return;
    }

    if (typeof user.credits !== 'number' || user.credits < totalRenderCredits) {
      showToast(
        `⚠️ Insufficient credits: ${user.credits ?? 0} Cr available, ${totalRenderCredits} Cr (₹${totalRenderInr}) required.`
      );
      handleOpenCreditModal();
      return;
    }

    const heroFrame = extractedFrames[selectedHeroFrameIdx] || extractedFrames[0];
    const startBridgeFrame = extractedFrames[0];
    const endBridgeFrame = extractedFrames[extractedFrames.length - 1];

    const effectiveStartImageUrl = motionBridgeEnabled
      ? startBridgeFrame?.dataUrl
      : lockHeroFrame
      ? heroFrame?.dataUrl
      : undefined;

    const effectiveEndImageUrl =
      motionBridgeEnabled && extractedFrames.length >= 2 ? endBridgeFrame?.dataUrl : undefined;

    const bridgeDirective =
      motionBridgeEnabled && effectiveEndImageUrl
        ? '[MOBILE START-TO-END MOTION BRIDGE: Smoothly transition from the opening mobile frame pose to the closing mobile frame pose with 8K cinema stabilization] '
        : lockHeroFrame && effectiveStartImageUrl
        ? '[HERO FRAME LOCK: Preserve the primary subject identity, composition, and structure from the reference frame while upgrading lighting and camera motion to 8K cinema] '
        : '';

    const finalPrompt = `${bridgeDirective}${promptText.trim()}`;

    setIsRenderingDirect(true);
    setRenderProgress(8);
    setRenderStage('Locking Mobile Hero Frame & Initializing Cinema Pipeline...');

    const progressTimer = setInterval(() => {
      setRenderProgress((prev) => {
        if (prev < 30) {
          setRenderStage('Stabilizing handheld shake to 3-axis gimbal trajectory...');
          return prev + 2;
        } else if (prev < 65) {
          setRenderStage('Applying 35mm Anamorphic relighting & optical bokeh...');
          return prev + 1.5;
        } else if (prev < 92) {
          setRenderStage('Encoding 4K high-bitrate MP4 master...');
          return prev + 0.8;
        }
        return 92;
      });
    }, 150);

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: finalPrompt,
          model: rawModelKey,
          duration: mcDuration,
          aspect_ratio: mcAspectRatio,
          imageUrl: effectiveStartImageUrl,
          endImageUrl: effectiveEndImageUrl,
          hero_frame_lock_enabled: lockHeroFrame && Boolean(effectiveStartImageUrl),
          keyframe_bridge_enabled: motionBridgeEnabled && Boolean(effectiveEndImageUrl),
          smart_soundscape_enabled: soundscapeConfig.enabled,
          viral_captions_enabled: viralCaptions.enabled,
          userId: user.id,
          email: user.email,
        }),
      });

      const data = await res.json();
      clearInterval(progressTimer);

      if (!res.ok || !data.video_url) {
        if (res.status === 402) {
          handleOpenCreditModal();
        }
        showToast(`❌ ${data.error || 'Render failed. Your credits were not deducted.'}`);
        setIsRenderingDirect(false);
        return;
      }

      setRenderProgress(100);
      setRenderStage('✓ 4K Cinematic Upgrade Complete!');

      if (typeof data.remaining_credits === 'number') {
        syncUserCredits(data.remaining_credits);
      }

      setRenderedCinemaUrl(data.video_url);
      setRenderedTitle(variationTitle);

      if (soundscapeConfig.enabled) {
        smartSoundscapeEngine.start(soundscapeConfig);
      }

      if (onSelectRenderedVideo) {
        onSelectRenderedVideo({
          videoUrl: data.video_url,
          prompt: finalPrompt,
          model: rawModelKey,
          duration: mcDuration as DurationType,
          aspectRatio: mcAspectRatio,
          thumbnailUrl: effectiveStartImageUrl,
        });
      }

      showToast(`🎬 Rendered "${variationTitle}" (-${totalRenderCredits} Cr)! Compare Original vs AI below.`);
    } catch {
      clearInterval(progressTimer);
      showToast('❌ Network error while rendering cinematic video.');
    } finally {
      setTimeout(() => {
        setIsRenderingDirect(false);
      }, 400);
    }
  };

  // Feature #6B: Send Both Frame + Prompt to Main Studio (Fixes Loophole #3)
  const handleSendToMainStudio = (promptText: string) => {
    const heroFrame = extractedFrames[selectedHeroFrameIdx] || extractedFrames[0];
    const startBridgeFrame = extractedFrames[0];
    const endBridgeFrame = extractedFrames[extractedFrames.length - 1];

    onRemixVideo({
      prompt: promptText,
      modelName: mcModel,
      duration: mcDuration,
      aspectRatio: mcAspectRatio,
      heroFrameUrl: motionBridgeEnabled
        ? startBridgeFrame?.dataUrl
        : lockHeroFrame
        ? heroFrame?.dataUrl
        : undefined,
      endFrameUrl: motionBridgeEnabled && extractedFrames.length >= 2 ? endBridgeFrame?.dataUrl : undefined,
      lockHeroFrame,
      motionBridgeEnabled,
      soundscapeConfig,
      viralCaptions,
    });
  };

  // Synchronized Play/Pause for Before vs After Split-Screen Player
  const handleToggleSyncPlay = () => {
    const v1 = beforeVideoRef.current;
    const v2 = afterVideoRef.current;
    if (!v1 || !v2) return;

    if (isSyncPlaying) {
      v1.pause();
      v2.pause();
      smartSoundscapeEngine.stop();
      setIsSyncPlaying(false);
    } else {
      v1.currentTime = 0;
      v2.currentTime = 0;
      v1.play().catch(() => {});
      v2.play().catch(() => {});
      if (soundscapeConfig.enabled) {
        smartSoundscapeEngine.start(soundscapeConfig);
      }
      setIsSyncPlaying(true);
    }
  };

  const activeHeroFrame = extractedFrames[selectedHeroFrameIdx] || extractedFrames[0];

  return (
    <CanvasShield>
      <div className="bg-[#18181b] border border-[#27272a] rounded-3xl p-5 sm:p-8 shadow-2xl space-y-6 text-white relative">
        {toastNotice && (
          <div className="fixed bottom-6 right-6 z-50 p-3.5 rounded-2xl bg-[#151128] border border-amber-500/60 text-white text-xs mono shadow-2xl flex items-center gap-2 animate-in fade-in max-w-md">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastNotice}</span>
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
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-400/30 text-amber-300 text-xs font-bold mono uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-amber-300 fill-amber-300 animate-pulse" />
                <span>Mobile-to-Cinematic Power Suite v4.3</span>
              </div>
              <span className="text-[11px] mono px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-bold">
                Wallet: {user?.credits ?? 0} Cr
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Mobile Video ➡️ 8K Hollywood Cinema Upgrade
            </h2>
            <p className="text-xs sm:text-sm text-purple-200/80">
              Extract proportional keyframes, diagnose mobile flaws with Gemini Vision, pre-grade with 4K Cinema LUTs, lock your original hero frame, and render with synced BGM & Viral Captions.
            </p>
          </div>

          {onBackToStudio && (
            <button
              type="button"
              onClick={onBackToStudio}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold mono transition-all cursor-pointer self-start sm:self-auto shrink-0"
            >
              ← Back to Standard Studio
            </button>
          )}
        </div>

        {/* 💡 Pro Hollywood Upgrade Workflow & Stack Value Banner */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-950/40 via-purple-950/50 to-fuchsia-950/40 border border-amber-500/30 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-2.5 text-xs">
            <span className="px-2 py-1 rounded-lg bg-amber-500/20 border border-amber-400/40 text-amber-300 font-black mono shrink-0">
              💡 PRO WORKFLOW
            </span>
            <p className="text-white/85 leading-relaxed">
              <strong className="text-amber-300">Full Hollywood Stack Example:</strong> 1 Mobile Video Scan (
              <span className="text-amber-300 font-mono">5 Cr</span>) + 4K Cinema LUT Frame Relight (
              <span className="text-amber-300 font-mono">8 Cr</span>) + Hero Frame Lock (
              <span className="text-emerald-300 font-mono">+10 Cr</span>) + Trailer BGM (
              <span className="text-cyan-300 font-mono">+5 Cr</span>) + Kling 5s Render (
              <span className="text-purple-300 font-mono">130 Cr</span>) ={' '}
              <strong className="text-white font-mono underline">158 Credits (₹104)</strong> for a complete studio commercial!
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0 text-[11px] mono">
            <span className="px-2.5 py-1 rounded-xl bg-black/50 border border-white/10 text-white/80">
              Active Render Stack:{' '}
              <strong className="text-amber-300">
                {totalRenderCredits} Cr (₹{totalRenderInr})
              </strong>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
          {/* LEFT COLUMN (5 Cols): Video Upload, Extracted Keyframes, 4K LUT Relight & Engine Controls */}
          <div className="lg:col-span-5 space-y-5">
            {/* Step 1: Upload Mobile Video */}
            <div className="p-4 rounded-2xl bg-[#121020] border border-purple-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-extrabold text-white mono uppercase flex items-center gap-1.5">
                  <Video className="w-4 h-4 text-amber-400" />
                  <span>Step 1: Upload Mobile Video *</span>
                </label>
                {mcFile && (
                  <span className="text-[11px] text-amber-300 font-mono bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-400/30">
                    {(mcFile.size / (1024 * 1024)).toFixed(1)} MB • {mcVideoDurationSec}s • {mcAspectRatio}
                  </span>
                )}
              </div>

              <div
                onClick={() => mcFileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all ${
                  mcPreviewUrl
                    ? 'border-amber-500/60 bg-amber-950/15'
                    : 'border-purple-500/30 hover:border-amber-400/60 bg-[#16122c]/70'
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
                  <div className="space-y-2.5" onClick={(e) => e.stopPropagation()}>
                    <div className="relative w-full max-h-64 rounded-xl overflow-hidden bg-black mx-auto flex items-center justify-center border border-white/10 shadow-lg">
                      <video
                        ref={sourceVideoRef}
                        src={mcPreviewUrl}
                        controls
                        playsInline
                        className="max-h-60 object-contain rounded-xl"
                      />
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <button
                        type="button"
                        onClick={handleCaptureCurrentVideoFrame}
                        className="px-3 py-1.5 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 border border-purple-400/40 text-purple-200 text-[11px] font-bold mono flex items-center gap-1.5 cursor-pointer"
                        title="Pause the video at any second and click to capture that exact frame"
                      >
                        <Camera className="w-3.5 h-3.5 text-amber-300" />
                        <span>📸 Capture Frame at Current Second</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => mcFileInputRef.current?.click()}
                        className="text-[11px] text-amber-300 hover:text-amber-200 font-mono underline cursor-pointer"
                      >
                        Change Video
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="py-7 space-y-2.5">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-400/30 flex items-center justify-center text-amber-400 mx-auto animate-pulse">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <span className="text-sm font-bold text-white block">Click to upload shaky / casual mobile video</span>
                      <span className="text-xs text-white/50 font-mono block">
                        Auto-extracts Start (15%), Middle (50%), End (85%) frames & detects Aspect Ratio
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Subject Context Input + Aspect Ratio Override */}
              {mcPreviewUrl && (
                <div className="space-y-2.5 pt-1">
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                    <div className="sm:col-span-7">
                      <label className="text-[10px] mono text-white/60 uppercase block mb-1">
                        Subject / Scene Context (Optional):
                      </label>
                      <input
                        type="text"
                        value={subjectHintInput}
                        onChange={(e) => setSubjectHintInput(e.target.value)}
                        placeholder="e.g., Royal Enfield bike in rain, Chennai tea shop..."
                        className="w-full bg-black/50 border border-white/15 focus:border-amber-400 rounded-xl px-3 py-1.5 text-xs text-white outline-none"
                      />
                    </div>
                    <div className="sm:col-span-5">
                      <label className="text-[10px] mono text-white/60 uppercase block mb-1">
                        Output Aspect Ratio:
                      </label>
                      <div className="grid grid-cols-3 gap-1">
                        {(['9:16', '16:9', '1:1'] as const).map((r) => (
                          <button
                            key={r}
                            type="button"
                            onClick={() => setMcAspectRatio(r)}
                            className={`py-1.5 rounded-lg text-[11px] mono font-bold border cursor-pointer transition-all ${
                              mcAspectRatio === r
                                ? 'bg-amber-500 text-black border-amber-300'
                                : 'bg-black/40 border-white/10 text-white/60 hover:text-white'
                            }`}
                          >
                            {r}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 🔍 Metered Gemini Vision Multi-Frame Scan Button (5 Cr / ₹3.30) */}
                  <button
                    type="button"
                    onClick={triggerMcAnalysis}
                    disabled={mcAnalyzing}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-pink-600 hover:from-amber-400 hover:to-pink-500 text-black font-black text-xs mono uppercase tracking-wide flex items-center justify-center gap-2 shadow-lg cursor-pointer active:scale-98 disabled:opacity-50"
                  >
                    {mcAnalyzing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-black" />
                        <span>Scanning 3 Keyframes with Gemini Vision...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-black fill-black" />
                        <span>
                          {mcPrompts.length > 0
                            ? '🔄 Re-Scan Frames with Gemini Vision (5 Cr / ₹3.30)'
                            : '🔍 Scan Video & Diagnose Flaws with Gemini Vision (5 Cr / ₹3.30)'}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Extracted Keyframes Gallery + Feature #3: 1-Click 4K Cinema LUT Relight (8 Cr / ₹5) */}
            {extractedFrames.length > 0 && (
              <div className="p-4 rounded-2xl bg-[#141126] border border-amber-500/30 space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-amber-300 mono uppercase flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-amber-400" />
                    <span>Extracted Mobile Keyframes ({extractedFrames.length})</span>
                  </span>
                  <span className="text-[10px] mono text-white/60">Click a frame to set as Hero Frame</span>
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                  {extractedFrames.map((frame, idx) => {
                    const isSelectedHero = selectedHeroFrameIdx === idx;
                    const isStartBridge = motionBridgeEnabled && idx === 0;
                    const isEndBridge = motionBridgeEnabled && idx === extractedFrames.length - 1;

                    return (
                      <div
                        key={frame.id}
                        onClick={() => setSelectedHeroFrameIdx(idx)}
                        className={`relative rounded-xl overflow-hidden border-2 cursor-pointer transition-all group ${
                          isSelectedHero
                            ? 'border-amber-400 ring-2 ring-amber-400/40 scale-[1.02]'
                            : 'border-white/15 hover:border-white/40 opacity-80 hover:opacity-100'
                        }`}
                      >
                        <img
                          src={frame.dataUrl}
                          alt={frame.label}
                          className="w-full h-24 object-cover bg-black"
                        />
                        <div className="absolute top-1 left-1 flex flex-wrap gap-1">
                          {isSelectedHero && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-500 text-black text-[9px] font-black mono">
                              ★ HERO
                            </span>
                          )}
                          {isStartBridge && (
                            <span className="px-1.5 py-0.5 rounded bg-cyan-400 text-black text-[9px] font-black mono">
                              START
                            </span>
                          )}
                          {isEndBridge && (
                            <span className="px-1.5 py-0.5 rounded bg-pink-400 text-black text-[9px] font-black mono">
                              END
                            </span>
                          )}
                        </div>
                        {frame.isLutEnhanced && (
                          <div className="absolute top-1 right-1 px-1.5 py-0.5 rounded bg-emerald-500 text-black text-[8px] font-black mono">
                            4K LUT ✨
                          </div>
                        )}
                        <div className="bg-black/85 px-2 py-1 text-[10px] mono text-white/90 truncate flex items-center justify-between">
                          <span className="truncate">{frame.label}</span>
                          <span className="text-amber-300">{frame.timestampSec}s</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Feature #3: 1-Click Cinema LUT & 4K Frame Relight (8 Credits / ₹5.00) */}
                <div className="p-3 rounded-xl bg-black/50 border border-purple-500/30 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-purple-200 mono flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-fuchsia-400" />
                      <span>🪄 Pre-Grade & 4K Relight Hero Frame</span>
                    </span>
                    <span className="text-[10px] mono px-2 py-0.5 rounded-full bg-fuchsia-500/20 border border-fuchsia-400/40 text-fuchsia-200 font-bold">
                      8 Cr (₹5.00)
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5">
                    {CINEMA_LUT_PRESETS.map((lut) => (
                      <button
                        key={lut.id}
                        type="button"
                        onClick={() => setSelectedLutId(lut.id)}
                        className={`p-2 rounded-lg border text-left transition-all cursor-pointer ${
                          selectedLutId === lut.id
                            ? 'bg-purple-900/60 border-fuchsia-400 text-white'
                            : 'bg-black/40 border-white/10 text-white/65 hover:text-white'
                        }`}
                      >
                        <div className="text-[10px] font-bold mono truncate">{lut.label}</div>
                        <div className="text-[9px] text-white/45 truncate">{lut.badge}</div>
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={handleEnhanceSelectedFrameLut}
                    disabled={isEnhancingFrameLut || !activeHeroFrame}
                    className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white font-bold text-xs mono flex items-center justify-center gap-1.5 shadow-md cursor-pointer active:scale-98 disabled:opacity-50"
                  >
                    {isEnhancingFrameLut ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Applying 4K Cinema LUT & Relighting Frame...</span>
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-3.5 h-3.5 text-amber-300" />
                        <span>
                          🪄 Apply 4K LUT Relight to "{activeHeroFrame?.label || 'Hero Frame'}" (8 Cr / ₹5)
                        </span>
                      </>
                    )}
                  </button>
                </div>

                {/* Feature #2 & Feature #4: Hero Frame Lock (+10 Cr) & Start-to-End Motion Bridge (+10 Cr) */}
                <div className="space-y-2 pt-1">
                  {/* Feature #2: Lock Original Hero Frame */}
                  <div
                    onClick={() => setLockHeroFrame(!lockHeroFrame)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-3 ${
                      lockHeroFrame
                        ? 'bg-emerald-950/35 border-emerald-400/50 text-white'
                        : 'bg-black/40 border-white/10 text-white/60'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="text-xs font-bold flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        <span>🖼️ Lock Original Hero Frame (I2V Restyle)</span>
                        <span className="text-[10px] mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                          +10 Cr
                        </span>
                      </div>
                      <p className="text-[10px] text-white/65">
                        Preserves your real face, product, bike, or shop from "{activeHeroFrame?.label}" instead of generating a random stranger.
                      </p>
                    </div>
                    <div
                      className={`w-10 h-5 rounded-full p-0.5 transition-colors shrink-0 ${
                        lockHeroFrame ? 'bg-emerald-500' : 'bg-white/20'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-black transition-transform ${
                          lockHeroFrame ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Feature #4: Start-to-End Mobile Motion Bridge (+10 Cr) */}
                  {extractedFrames.length >= 2 && (
                    <div
                      onClick={() => setMotionBridgeEnabled(!motionBridgeEnabled)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-3 ${
                        motionBridgeEnabled
                          ? 'bg-cyan-950/35 border-cyan-400/50 text-white'
                          : 'bg-black/40 border-white/10 text-white/60'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="text-xs font-bold flex items-center gap-1.5">
                          <Link2 className="w-4 h-4 text-cyan-400" />
                          <span>🔗 Lock Start & End Mobile Frames (Motion Bridge)</span>
                          <span className="text-[10px] mono px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                            +10 Cr
                          </span>
                        </div>
                        <p className="text-[10px] text-white/65">
                          Anchors both Start Pose ({extractedFrames[0]?.timestampSec}s) and End Pose (
                          {extractedFrames[extractedFrames.length - 1]?.timestampSec}s) for exact movement continuity.
                        </p>
                      </div>
                      <div
                        className={`w-10 h-5 rounded-full p-0.5 transition-colors shrink-0 ${
                          motionBridgeEnabled ? 'bg-cyan-400' : 'bg-white/20'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-full bg-black transition-transform ${
                            motionBridgeEnabled ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Feature #5: Trailer BGM & SFX (+5 Cr) + Auto Viral Captions (+5 Cr) */}
            {extractedFrames.length > 0 && (
              <div className="p-4 rounded-2xl bg-[#141126] border border-purple-500/30 space-y-3">
                <span className="text-xs font-extrabold text-purple-200 mono uppercase block">
                  🎵 Step 3: Audio Soundscape & Viral Subtitles
                </span>

                {/* Smart Soundscape Toggle (+5 Cr) */}
                <div className="p-3 rounded-xl bg-black/45 border border-white/10 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={soundscapeConfig.enabled}
                        onChange={(e) =>
                          setSoundscapeConfig((prev) => ({ ...prev, enabled: e.target.checked }))
                        }
                        className="accent-amber-500 w-3.5 h-3.5"
                      />
                      <Music className="w-3.5 h-3.5 text-amber-400" />
                      <span>🎵 Replace Mobile Noise with Trailer BGM & SFX</span>
                    </label>
                    <span className="text-[10px] mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">
                      +5 Cr
                    </span>
                  </div>

                  {soundscapeConfig.enabled && (
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div>
                        <span className="text-[10px] mono text-white/50 block mb-1">BGM Mood:</span>
                        <select
                          value={soundscapeConfig.bgmMood}
                          onChange={(e) =>
                            setSoundscapeConfig((prev) => ({
                              ...prev,
                              bgmMood: e.target.value as any,
                            }))
                          }
                          className="w-full bg-black border border-white/15 rounded-lg px-2 py-1.5 text-xs text-white"
                        >
                          <option value="mass">🔥 Mass Hero BGM</option>
                          <option value="cyberpunk">⚡ Cyberpunk Bass</option>
                          <option value="emotional">🎻 Emotional Cinema</option>
                          <option value="lofi">🌙 Chill Lo-Fi</option>
                          <option value="horror">👻 Suspense Thriller</option>
                        </select>
                      </div>
                      <div>
                        <span className="text-[10px] mono text-white/50 block mb-1">Ambient SFX:</span>
                        <select
                          value={soundscapeConfig.sfxType}
                          onChange={(e) =>
                            setSoundscapeConfig((prev) => ({
                              ...prev,
                              sfxType: e.target.value as any,
                            }))
                          }
                          className="w-full bg-black border border-white/15 rounded-lg px-2 py-1.5 text-xs text-white"
                        >
                          <option value="rain">🌧️ Rain & Thunder</option>
                          <option value="whoosh">💨 Cinema Whoosh</option>
                          <option value="cars">🏎️ Supercar Engine</option>
                          <option value="crowd">🏟️ Stadium Roar</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                {/* Auto Viral Captions Toggle (+5 Cr) */}
                <div className="p-3 rounded-xl bg-black/45 border border-white/10 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={viralCaptions.enabled}
                        onChange={(e) =>
                          setViralCaptions((prev) => ({ ...prev, enabled: e.target.checked }))
                        }
                        className="accent-pink-500 w-3.5 h-3.5"
                      />
                      <Subtitles className="w-3.5 h-3.5 text-pink-400" />
                      <span>📱 Auto Viral Captions Overlay</span>
                    </label>
                    <span className="text-[10px] mono px-2 py-0.5 rounded bg-pink-500/20 text-pink-300 font-bold">
                      +5 Cr
                    </span>
                  </div>

                  {viralCaptions.enabled && (
                    <div className="space-y-2 pt-1">
                      <input
                        type="text"
                        value={viralCaptions.text}
                        onChange={(e) =>
                          setViralCaptions((prev) => ({ ...prev, text: e.target.value }))
                        }
                        placeholder="Enter viral reel caption overlay..."
                        className="w-full bg-black border border-white/15 rounded-lg px-2.5 py-1.5 text-xs text-white"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Target AI Video Model & Duration Selector */}
            {extractedFrames.length > 0 && (
              <div className="p-4 rounded-2xl bg-[#171330] border border-amber-400/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-300 mono uppercase">
                    ⚡ Step 4: Choose Cinema Engine & Duration
                  </span>
                  <span className="text-[10px] mono text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                    Base: {baseVideoCredits} Cr
                  </span>
                </div>

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

                <div className="flex gap-1.5">
                  {(['5s', '8s', '10s', '15s'] as const).map((d) => (
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
            )}
          </div>

          {/* RIGHT COLUMN (7 Cols): Flaw Diagnosis Report, 3 Editable Prompts & Before/After Split Player */}
          <div className="lg:col-span-7 space-y-5">
            {/* Feature #6: Before vs After Side-by-Side Comparison Player (Shown when a Direct Render completes) */}
            {renderedCinemaUrl && mcPreviewUrl && (
              <div className="p-5 rounded-3xl bg-gradient-to-br from-[#161229] via-[#121020] to-[#1a1128] border-2 border-emerald-400/50 shadow-2xl space-y-4 animate-in fade-in">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
                  <div>
                    <span className="text-[10px] mono uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-bold">
                      🎬 BEFORE vs AFTER COMPARISON STUDIO
                    </span>
                    <h3 className="text-base font-black text-white mt-1">
                      📱 Original Mobile Clip vs 🎬 {renderedTitle || '8K AI Cinema Master'}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={handleToggleSyncPlay}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-400 text-black font-black text-xs mono flex items-center gap-1.5 cursor-pointer shadow-lg active:scale-95"
                  >
                    {isSyncPlaying ? (
                      <>
                        <Pause className="w-4 h-4 fill-black" />
                        <span>Pause Sync Comparison</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 fill-black" />
                        <span>⏯️ Sync Play Before & After</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Left: Original Mobile Video */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs mono">
                      <span className="text-rose-300 font-bold">📱 BEFORE: Raw Mobile Video</span>
                      <span className="text-[10px] text-white/50">Handheld / Raw</span>
                    </div>
                    <div className="relative rounded-2xl overflow-hidden bg-black border border-white/15 aspect-[9/16] max-h-80 mx-auto flex items-center justify-center">
                      <video
                        ref={beforeVideoRef}
                        src={mcPreviewUrl}
                        controls
                        loop
                        muted
                        playsInline
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </div>

                  {/* Right: 4K AI Cinematic Output */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs mono">
                      <span className="text-emerald-300 font-bold">
                        🎬 AFTER: {mcModel.toUpperCase()} ({mcDuration})
                      </span>
                      <span className="text-[10px] text-amber-300">
                        {lockHeroFrame ? 'Hero Frame Locked' : '8K Cinema'}
                      </span>
                    </div>
                    <div className="relative rounded-2xl overflow-hidden bg-black border-2 border-emerald-400/50 aspect-[9/16] max-h-80 mx-auto flex items-center justify-center shadow-lg">
                      <video
                        ref={afterVideoRef}
                        src={renderedCinemaUrl}
                        controls
                        autoPlay
                        loop
                        playsInline
                        className="w-full h-full object-contain"
                      />
                      {viralCaptions.enabled && viralCaptions.text && (
                        <div className="absolute bottom-10 inset-x-3 text-center pointer-events-none">
                          <span className="inline-block px-3 py-1 rounded-xl bg-black/80 border border-amber-400/60 text-amber-300 font-black text-xs uppercase tracking-wider shadow-xl">
                            {viralCaptions.text}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Live Direct Render Progress Banner */}
            {isRenderingDirect && (
              <div className="p-5 rounded-3xl bg-[#16122c] border border-amber-400/50 space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between text-xs mono">
                  <span className="text-amber-300 font-bold flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                    <span>{renderStage}</span>
                  </span>
                  <span className="text-white font-black">{Math.round(renderProgress)}%</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-black/60 overflow-hidden p-0.5 border border-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-400 via-orange-500 to-pink-500 transition-all duration-200"
                    style={{ width: `${renderProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* State 1: No Video Uploaded Yet */}
            {!mcPreviewUrl ? (
              <div className="p-10 rounded-3xl bg-black/40 border border-white/10 text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-300 mx-auto">
                  <Film className="w-7 h-7" />
                </div>
                <h3 className="text-base font-bold text-white">
                  Upload a Mobile Video on the Left to Begin
                </h3>
                <p className="text-xs text-white/60 max-w-md mx-auto leading-relaxed">
                  Our engine automatically extracts Start (15%), Middle (50%), and End (85%) keyframes, diagnoses camera shake & lighting flaws with Gemini Vision, and lets you lock your original Hero Frame for an authentic 8K cinema restyle.
                </p>
              </div>
            ) : mcAnalyzing ? (
              <div className="p-12 rounded-3xl bg-black/60 border border-amber-400/40 text-center space-y-4 animate-in fade-in">
                <RefreshCw className="w-10 h-10 animate-spin text-amber-400 mx-auto" />
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-amber-300">
                    Gemini Vision is scanning your 3 mobile keyframes...
                  </h3>
                  <p className="text-xs text-white/60">
                    Detecting subject identity, diagnosing handheld shake & lighting flaws, and writing 3 Hollywood director prompts.
                  </p>
                </div>
              </div>
            ) : mcPrompts.length === 0 ? (
              <div className="p-8 rounded-3xl bg-[#131022] border border-amber-400/30 text-center space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-400/30 flex items-center justify-center text-amber-300 mx-auto">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-black text-white">
                    {extractedFrames.length} Keyframes Extracted & Ready for AI Diagnosis
                  </h3>
                  <p className="text-xs text-white/65 max-w-md mx-auto">
                    Run the Gemini Vision Multi-Frame Scan (5 Credits / ₹3.30) to diagnose mobile camera flaws and unlock 3 editable Hollywood prompts tailored to your clip.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={triggerMcAnalysis}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-pink-600 text-black font-black text-xs mono uppercase tracking-wide cursor-pointer shadow-xl active:scale-95"
                >
                  🔍 Scan Video & Generate 3 Cinema Prompts (5 Cr / ₹3.30)
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* AI Flaw Diagnosis & Cinema Upgrade Card */}
                {flawDiagnosis && (
                  <div className="p-4 rounded-2xl bg-[#131022] border border-amber-500/40 space-y-2.5 shadow-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-amber-300 mono uppercase flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        <span>Gemini Vision Multi-Frame Diagnosis Report</span>
                      </span>
                      <span className="text-[10px] mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                        ✓ Prompts Unlocked
                      </span>
                    </div>

                    <div className="text-xs text-white/85 bg-black/40 p-2.5 rounded-xl border border-white/10">
                      <strong className="text-purple-300 font-mono">📹 Detected Scene:</strong>{' '}
                      {flawDiagnosis.original_description}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                      <div className="p-2.5 rounded-xl bg-rose-950/30 border border-rose-500/30 text-rose-200">
                        <div className="font-bold mono text-[10px] uppercase text-rose-400 flex items-center gap-1 mb-0.5">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>⚠️ Mobile Flaws Detected:</span>
                        </div>
                        <p className="text-[11px] leading-relaxed">{flawDiagnosis.flaws_detected}</p>
                      </div>

                      <div className="p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-200">
                        <div className="font-bold mono text-[10px] uppercase text-emerald-400 flex items-center gap-1 mb-0.5">
                          <Check className="w-3.5 h-3.5" />
                          <span>✅ Cinema Upgrades Applied:</span>
                        </div>
                        <p className="text-[11px] leading-relaxed">{flawDiagnosis.upgrades_applied}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Low Balance Warning Overlay for Mobile-to-Cinematic Render */}
                {(user?.credits ?? 0) < totalRenderCredits && (
                  <div className="p-4 rounded-2xl low-balance-amber-pulse-card flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black uppercase text-amber-300 mono">
                          ⚠️ Low Balance for {mcModel.toUpperCase()} ({mcDuration})
                        </span>
                        <span className="text-[10px] mono px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold">
                          Need {Math.max(1, totalRenderCredits - (user?.credits ?? 0))} more Cr
                        </span>
                      </div>
                      <p className="text-[11px] text-white/80">
                        Selected render requires <strong className="text-amber-300 mono">{totalRenderCredits} Cr (₹{totalRenderInr})</strong>, while your balance is <strong className="text-white mono">{user?.credits ?? 0} Cr</strong>.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleOpenCreditModal}
                      className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-orange-500 to-pink-500 text-black font-black text-xs mono uppercase tracking-wide shrink-0 cursor-pointer shadow-lg active:scale-95"
                    >
                      ⚡ Top Up Credits (From ₹99)
                    </button>
                  </div>
                )}

                {/* 3 Unlocked & Editable Cinematic Variations */}
                <div className="space-y-3.5">
                  {mcPrompts.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-[#131022] border border-purple-500/30 hover:border-amber-400/50 transition-all space-y-3 shadow-lg"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs font-extrabold text-white flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40 flex items-center justify-center text-xs mono font-black">
                            {idx + 1}
                          </span>
                          {item.title}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {lockHeroFrame && activeHeroFrame && (
                            <span className="text-[10px] mono text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/30">
                              🔒 Frame: {activeHeroFrame.label}
                            </span>
                          )}
                          <span className="text-[10px] mono text-purple-200 bg-purple-900/50 px-2.5 py-0.5 rounded-full border border-purple-500/30">
                            {item.style}
                          </span>
                        </div>
                      </div>

                      {/* Unlocked Editable Director Prompt */}
                      <textarea
                        rows={3}
                        value={item.prompt}
                        onChange={(e) => {
                          const val = e.target.value;
                          setMcPrompts((prev) =>
                            prev.map((p, i) => (i === idx ? { ...p, prompt: val } : p))
                          );
                        }}
                        className="w-full bg-black/60 border border-purple-500/30 focus:border-amber-400 rounded-xl p-3 text-xs text-white/95 leading-relaxed outline-none resize-none"
                      />

                      {/* Live Breakdown Badges + Direct Render & Send to Studio Buttons */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
                        <div className="flex flex-wrap items-center gap-1 text-[10px] mono text-white/60">
                          <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10">
                            {mcModel.toUpperCase()} ({mcDuration}): {baseVideoCredits}cr
                          </span>
                          {heroLockCredits > 0 && (
                            <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                              +Hero Lock 10cr
                            </span>
                          )}
                          {bridgeCredits > 0 && (
                            <span className="px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                              +Bridge 10cr
                            </span>
                          )}
                          {soundscapeCredits > 0 && (
                            <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                              +BGM 5cr
                            </span>
                          )}
                          {captionsCredits > 0 && (
                            <span className="px-2 py-0.5 rounded bg-pink-500/15 text-pink-300 border border-pink-500/30">
                              +Captions 5cr
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleSendToMainStudio(item.prompt)}
                            className="px-3 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white text-[11px] font-bold mono flex items-center gap-1 cursor-pointer transition-all"
                            title="Load both locked Hero Frame and prompt into the main Studio workspace"
                          >
                            <span>Send to Studio</span>
                            <ArrowUpRight className="w-3.5 h-3.5 text-purple-300" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDirectRender(item.prompt, item.title)}
                            disabled={isRenderingDirect}
                            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-pink-600 hover:from-amber-400 hover:to-pink-500 text-black text-xs font-black mono flex items-center justify-center gap-1.5 shadow-xl cursor-pointer active:scale-95 disabled:opacity-50"
                          >
                            <Wand2 className="w-4 h-4 text-black" />
                            <span>
                              🚀 Render Cinema ({totalRenderCredits} Cr / ₹{totalRenderInr})
                            </span>
                          </button>
                        </div>
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
