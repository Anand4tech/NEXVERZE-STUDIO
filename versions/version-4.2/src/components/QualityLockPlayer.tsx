import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import {
  Play,
  Pause,
  Volume2,
  Volume1,
  VolumeX,
  Maximize2,
  ShieldCheck,
  Download,
  Sparkles,
  Clock,
  Calendar,
  Repeat,
  Camera,
  Check,
  Gauge,
  Layers,
  ArrowUpRight,
  Plus,
  Trash2,
  Edit3,
  Sliders,
  RefreshCw,
  Zap,
  Shield,
  ShieldAlert,
  Lock,
  Unlock,
  Settings,
  Type,
  Palette,
  X,
  Shuffle,
  ChevronDown,
  Share2,
  Copy,
  Instagram,
  Film,
  AlertTriangle,
  Music,
  Subtitles,
} from 'lucide-react';
import { ViralCaptionsConfig, StoryboardSceneItem } from './TextToVideoPowerSuite';
import { SmartSoundscapeConfig, smartSoundscapeEngine } from '../lib/smartSoundscape';

export interface KeyframePromptOverride {
  id: string;
  timestamp: number; // in seconds
  promptOverride: string;
  motionStrength?: 'subtle' | 'dynamic' | 'explosive';
  cameraMove?: 'pan-left' | 'pan-right' | 'zoom-in' | 'orbit' | 'fpv-roll' | 'static';
}

export type SceneTransitionType = 'Cut' | 'Crossfade' | 'Wipe';

export type ColorGradingPreset =
  | 'Normal'
  | 'Film Noir'
  | 'Vibrant'
  | 'Vintage'
  | 'Cyberpunk'
  | 'Cold Sci-Fi'
  | 'Warm Cinema';

export interface ColorGradingOption {
  id: ColorGradingPreset;
  label: string;
  filter: string;
  description: string;
  badgeColor: string;
}

export const COLOR_GRADING_PRESETS: ColorGradingOption[] = [
  {
    id: 'Normal',
    label: 'Normal (Raw Master)',
    filter: 'none',
    description: 'Direct clean camera master output',
    badgeColor: 'text-white/60',
  },
  {
    id: 'Film Noir',
    label: 'Film Noir',
    filter: 'grayscale(100%) contrast(155%) brightness(92%)',
    description: 'Moody monochrome with high-contrast shadows',
    badgeColor: 'text-zinc-300',
  },
  {
    id: 'Vibrant',
    label: 'Vibrant',
    filter: 'saturate(180%) contrast(115%) brightness(104%)',
    description: 'Punchy saturated colors with heightened dynamics',
    badgeColor: 'text-amber-400',
  },
  {
    id: 'Vintage',
    label: 'Vintage',
    filter: 'sepia(45%) contrast(95%) saturate(85%) hue-rotate(-10deg) brightness(105%)',
    description: 'Warm nostalgic 70s celluloid film look',
    badgeColor: 'text-orange-300',
  },
  {
    id: 'Cyberpunk',
    label: 'Cyberpunk',
    filter: 'hue-rotate(285deg) saturate(185%) contrast(135%) brightness(105%)',
    description: 'Neon synthwave magenta/cyan electric tint',
    badgeColor: 'text-fuchsia-400',
  },
  {
    id: 'Cold Sci-Fi',
    label: 'Cold Sci-Fi',
    filter: 'hue-rotate(185deg) saturate(130%) contrast(120%) brightness(95%)',
    description: 'Teal & icy matrix futuristic grade',
    badgeColor: 'text-cyan-400',
  },
  {
    id: 'Warm Cinema',
    label: 'Warm Cinema',
    filter: 'sepia(25%) saturate(140%) contrast(110%) brightness(102%)',
    description: 'Radiant golden hour cinematic ambient warmth',
    badgeColor: 'text-yellow-400',
  },
];

export const FALLBACK_PLACEHOLDER_VIDEO = '/videos/sample-1.mp4';

/**
 * Diagnostic tracking report captured on video loading failures
 */
export interface VideoDiagnosticReport {
  timestamp: string;
  failedUrl: string;
  sourceType: 'primary' | 'retry' | 'upscaled' | 'fallback';
  attempt: number;
  maxRetries: number;
  nextRetryDelayMs?: number;
  errorCode: number | null;
  errorMessage: string;
  networkState: string;
  readyState: string;
  online: boolean;
  videoDimensions: {
    videoWidth: number;
    videoHeight: number;
  };
  playerState: {
    currentTime: number;
    duration: number;
    aspectRatio: string;
    modelName: string;
  };
  userAgent: string;
}

export interface QualityLockPlayerProps {
  videoUrl?: string;
  currentVideo?: string;
  fallbackUrl?: string;
  fallbackVideoUrl?: string;
  fallbackPlaceholder?: string;
  posterUrl?: string;
  aspectRatio: '9:16' | '16:9' | '1:1';
  onRatioChange?: (ratio: '9:16' | '16:9' | '1:1') => void;
  title?: string;
  modelName?: string;
  duration?: string;
  timestamp?: string;
  prompt?: string;
  onKeyframesChange?: (keyframes: KeyframePromptOverride[]) => void;
  isFreeUser?: boolean;
  user?: { id: string; email: string; credits: number } | null;
  onCreditsUpdated?: (user: any) => void;
  onOpenPlans?: () => void;
  motionIntensity?: number;
  onMotionIntensityChange?: (intensity: number) => void;
  sceneTransition?: SceneTransitionType;
  onSceneTransitionChange?: (transition: SceneTransitionType) => void;
  colorGrading?: ColorGradingPreset;
  onColorGradingChange?: (grading: ColorGradingPreset) => void;
  isAiUpscaleActive?: boolean;
  onAiUpscaleChange?: (active: boolean) => void;
  isGenerating?: boolean;
  generationProgress?: number;
  generationStage?: string;
  onRemix?: (config: {
    prompt?: string;
    modelName?: string;
    duration?: string;
    aspectRatio?: '9:16' | '16:9' | '1:1';
    motionIntensity?: number;
    sceneTransition?: SceneTransitionType;
    colorGrading?: ColorGradingPreset;
  }) => void;
  onError?: (e: React.SyntheticEvent<HTMLVideoElement, Event>) => void;
  onVideoError?: (fallbackUrl: string) => void;
  maxRetries?: number;
  onDiagnosticReport?: (report: VideoDiagnosticReport) => void;
  viralCaptions?: ViralCaptionsConfig;
  soundscapeConfig?: SmartSoundscapeConfig;
  storyboardPlaylist?: StoryboardSceneItem[];
  activeStoryboardScene?: number;
  onSelectStoryboardScene?: (scene: StoryboardSceneItem) => void;
}

const getMediaErrorDetails = (error: MediaError | null) => {
  if (!error) return { code: null, message: 'Resource failed to fetch, 404 not found, or network disconnected' };
  switch (error.code) {
    case 1:
      return { code: 1, message: 'MEDIA_ERR_ABORTED: Media fetching was aborted by user agent' };
    case 2:
      return { code: 2, message: 'MEDIA_ERR_NETWORK: Network error interrupted media download' };
    case 3:
      return { code: 3, message: 'MEDIA_ERR_DECODE: Corruption or unsupported video decoding profile' };
    case 4:
      return { code: 4, message: 'MEDIA_ERR_SRC_NOT_SUPPORTED: Format unsupported or HTTP 404/CORS failure' };
    default:
      return { code: error.code, message: error.message || 'Unknown media error' };
  }
};

const getNetworkStateLabel = (state: number) => {
  switch (state) {
    case 0:
      return 'NETWORK_EMPTY (0)';
    case 1:
      return 'NETWORK_IDLE (1)';
    case 2:
      return 'NETWORK_LOADING (2)';
    case 3:
      return 'NETWORK_NO_SOURCE (3)';
    default:
      return `UNKNOWN (${state})`;
  }
};

const getReadyStateLabel = (state: number) => {
  switch (state) {
    case 0:
      return 'HAVE_NOTHING (0)';
    case 1:
      return 'HAVE_METADATA (1)';
    case 2:
      return 'HAVE_CURRENT_DATA (2)';
    case 3:
      return 'HAVE_FUTURE_DATA (3)';
    case 4:
      return 'HAVE_ENOUGH_DATA (4)';
    default:
      return `UNKNOWN (${state})`;
  }
};

export const QualityLockPlayer: React.FC<QualityLockPlayerProps> = ({
  videoUrl,
  currentVideo: currentVideoProp,
  fallbackUrl,
  fallbackVideoUrl,
  fallbackPlaceholder: fallbackPropPlaceholder,
  posterUrl,
  aspectRatio,
  onRatioChange,
  title = 'AI Video Output',
  modelName = 'Luma Ray 3',
  duration = '5s',
  timestamp,
  prompt,
  onKeyframesChange,
  isFreeUser = false,
  user,
  onCreditsUpdated,
  onOpenPlans,
  motionIntensity = 6,
  onMotionIntensityChange,
  sceneTransition = 'Crossfade',
  onSceneTransitionChange,
  colorGrading = 'Normal',
  onColorGradingChange,
  isAiUpscaleActive = false,
  onAiUpscaleChange,
  isGenerating = false,
  generationProgress = 0,
  generationStage = 'Synthesizing frames & temporal consistency...',
  onRemix,
  onError,
  onVideoError,
  maxRetries = 3,
  onDiagnosticReport,
  viralCaptions,
  soundscapeConfig,
  storyboardPlaylist,
  activeStoryboardScene,
  onSelectStoryboardScene,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrubBarRef = useRef<HTMLDivElement>(null);
  const [remixToast, setRemixToast] = useState(false);

  const handleRemixClick = () => {
    if (onRemix) {
      onRemix({
        prompt,
        modelName,
        duration,
        aspectRatio,
        motionIntensity: motionIntensityState,
        sceneTransition: sceneTransitionState,
        colorGrading: colorGradingState,
      });
    }
    setRemixToast(true);
    setTimeout(() => setRemixToast(false), 2500);
  };

  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('nexverze_player_muted');
        if (stored !== null) {
          return stored === 'true';
        }
      } catch {
        // fallback
      }
    }
    return true; // default initial muted for browser auto-play policies
  });
  const [volume, setVolume] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('nexverze_player_volume');
        if (stored !== null) {
          const val = parseFloat(stored);
          if (!isNaN(val) && val >= 0 && val <= 1) return val;
        }
      } catch {
        // fallback
      }
    }
    return 0.8; // default 80% volume
  });
  const [isLooping, setIsLooping] = useState(true);
  const [isFrameSmoothing, setIsFrameSmoothing] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [isExtractingFrame, setIsExtractingFrame] = useState(false);
  const [frameExtractedSuccess, setFrameExtractedSuccess] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverPercent, setHoverPercent] = useState<number>(0);
  const [isPlayerHovered, setIsPlayerHovered] = useState(false);
  const [frameStepNotice, setFrameStepNotice] = useState<string | null>(null);

  // Motion Intensity (1-10) and Scene Transition ('Cut', 'Crossfade', 'Wipe')
  const [motionIntensityState, setMotionIntensityState] = useState<number>(motionIntensity);
  const [sceneTransitionState, setSceneTransitionState] = useState<SceneTransitionType>(sceneTransition);
  const [colorGradingState, setColorGradingState] = useState<ColorGradingPreset>(colorGrading);

  useEffect(() => {
    if (motionIntensity !== undefined) {
      setMotionIntensityState(motionIntensity);
    }
  }, [motionIntensity]);

  useEffect(() => {
    if (sceneTransition !== undefined) {
      setSceneTransitionState(sceneTransition);
    }
  }, [sceneTransition]);

  useEffect(() => {
    if (colorGrading !== undefined) {
      setColorGradingState(colorGrading);
    }
  }, [colorGrading]);

  const handleMotionIntensityChange = (val: number) => {
    const clamped = Math.min(10, Math.max(1, val));
    setMotionIntensityState(clamped);
    onMotionIntensityChange?.(clamped);
  };

  const handleSceneTransitionChange = (val: SceneTransitionType) => {
    setSceneTransitionState(val);
    onSceneTransitionChange?.(val);
  };

  const handleColorGradingChange = (val: ColorGradingPreset) => {
    setColorGradingState(val);
    onColorGradingChange?.(val);
    setFrameStepNotice(`Color Grade Applied: ${val}`);
    setTimeout(() => setFrameStepNotice(null), 2500);
  };

  const getMotionDescription = (val: number) => {
    if (val <= 2) return 'Subtle Pan (Minimal Drift)';
    if (val <= 4) return 'Smooth Tracking / Dolly';
    if (val <= 6) return 'Cinematic Motion (Balanced)';
    if (val <= 8) return 'Dynamic Crane / High Orbit';
    return 'Aggressive FPV (Turbo Velocity)';
  };

  // Watermark States (Circuit Knot Watermark enabled, customizable text, position, and opacity)
  const [isWatermarkActive, setIsWatermarkActive] = useState<boolean>(true);
  const [watermarkText, setWatermarkText] = useState<string>('NexVerze Studio');
  const [watermarkPosition, setWatermarkPosition] = useState<
    'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'center'
  >('bottom-right');
  const [watermarkOpacity, setWatermarkOpacity] = useState<number>(0.65);
  const [watermarkScale, setWatermarkScale] = useState<'sm' | 'md' | 'lg'>('sm');
  const [showWatermarkSettings, setShowWatermarkSettings] = useState<boolean>(false);
  const [watermarkUpgradeAlert, setWatermarkUpgradeAlert] = useState<boolean>(false);
  const [shareCopied, setShareCopied] = useState<boolean>(false);

  const handleSocialShare = (platform: 'twitter' | 'linkedin' | 'instagram' | 'whatsapp' | 'copy') => {
    const shareText = `Check out my cinematic AI video "${title || 'NexVerze Creation'}" generated with NexVerze Studio! 🚀✨`;
    const shareUrl = typeof window !== 'undefined' ? window.location.href : 'https://nexverze.ai';

    if (platform === 'twitter') {
      const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
      try {
        window.open(url, '_blank', 'width=600,height=400');
      } catch (e) {
        navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
        setFrameStepNotice('🔗 Link copied to clipboard! Share on X.');
      }
    } else if (platform === 'linkedin') {
      const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
      try {
        window.open(url, '_blank', 'width=600,height=400');
      } catch (e) {
        navigator.clipboard.writeText(shareUrl);
        setFrameStepNotice('🔗 Link copied to clipboard! Share on LinkedIn.');
      }
    } else if (platform === 'instagram') {
      navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
      setShareCopied(true);
      setFrameStepNotice('📸 Caption & video link copied! Ready to paste into Instagram Story or Reel.');
      setTimeout(() => setShareCopied(false), 3000);
      setTimeout(() => setFrameStepNotice(null), 4000);
      try {
        window.open('https://www.instagram.com', '_blank');
      } catch (e) {
        // Safe fallback in iframe
      }
    } else if (platform === 'whatsapp') {
      const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`;
      try {
        window.open(url, '_blank', 'width=600,height=400');
      } catch (e) {
        navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
        setFrameStepNotice('🔗 Link copied to clipboard! Share on WhatsApp.');
      }
    } else if (platform === 'copy') {
      navigator.clipboard.writeText(shareUrl);
      setShareCopied(true);
      setFrameStepNotice('🔗 Video share link copied to clipboard!');
      setTimeout(() => setShareCopied(false), 2500);
      setTimeout(() => setFrameStepNotice(null), 2500);
    }
  };

  // Handle Escape key to dismiss watermark popups
  useEffect(() => {
    if (!showWatermarkSettings && !watermarkUpgradeAlert) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowWatermarkSettings(false);
        setWatermarkUpgradeAlert(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showWatermarkSettings, watermarkUpgradeAlert]);

  // Fallback placeholder video resolution
  const fallbackPlaceholderVideo =
    fallbackUrl || fallbackVideoUrl || fallbackPropPlaceholder || FALLBACK_PLACEHOLDER_VIDEO;

  // 1. 2x AI Upscale State & API
  const [is2xUpscaled, setIs2xUpscaled] = useState(isAiUpscaleActive ?? false);
  const [isUpscalingLoading, setIsUpscalingLoading] = useState(false);

  // Current video source state (with fallback placeholder video)
  const [currentVideo, setCurrentVideo] = useState<string>(
    videoUrl || currentVideoProp || fallbackPlaceholderVideo
  );

  // Backward-compatibility aliases for activeVideoUrl
  const activeVideoUrl = currentVideo;
  const setActiveVideoUrl = setCurrentVideo;

  // Visual skeleton loader & buffering state specifically when changing/reloading video source
  const [isVideoLoadingSource, setIsVideoLoadingSource] = useState<boolean>(true);

  // Automatic retry state & exponential backoff tracking
  const retryCountRef = useRef<number>(0);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [retryStatus, setRetryStatus] = useState<{
    attempt: number;
    max: number;
    nextDelayMs: number;
  } | null>(null);

  // Diagnostic tracking state for inspection
  const [latestDiagnostic, setLatestDiagnostic] = useState<VideoDiagnosticReport | null>(null);
  const [showDiagnosticModal, setShowDiagnosticModal] = useState<boolean>(false);

  const [upscaleDetails, setUpscaleDetails] = useState<{
    resolution: string;
    notice: string;
  } | null>(null);

  // Synchronize with external prop if provided
  useEffect(() => {
    if (isAiUpscaleActive !== undefined && isAiUpscaleActive !== is2xUpscaled) {
      setIs2xUpscaled(isAiUpscaleActive);
    }
  }, [isAiUpscaleActive]);

  // Synchronize base video URL if incoming prop changes: activates skeleton loader and resets retry state
  useEffect(() => {
    const nextUrl = videoUrl || currentVideoProp;
    if (nextUrl) {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
      retryCountRef.current = 0;
      setRetryStatus(null);
      setIsVideoLoadingSource(true);
      setCurrentVideo(nextUrl);
      setIs2xUpscaled(false);
      if (onAiUpscaleChange) onAiUpscaleChange(false);
    }
  }, [videoUrl, currentVideoProp]);

  // Handle 2x AI Upscale Toggle with external /api/upscale API
  const handleToggleUpscale = async () => {
    if (isUpscalingLoading) return;

    if (is2xUpscaled) {
      // Revert to original
      setIs2xUpscaled(false);
      if (onAiUpscaleChange) onAiUpscaleChange(false);
      setCurrentVideo(videoUrl || currentVideoProp || fallbackPlaceholderVideo);
      setUpscaleDetails(null);
      setFrameStepNotice('Reverted to 1080p Master (Standard)');
      setTimeout(() => setFrameStepNotice(null), 2500);
      return;
    }

    const currentCredits = user?.credits ?? (isFreeUser ? 0 : 50);
    if (currentCredits < 25) {
      setFrameStepNotice(`⚠️ 25 credits required for 2x AI 4K Upscaler (Current balance: ${currentCredits}cr).`);
      if (onOpenPlans) onOpenPlans();
      return;
    }

    try {
      setIsUpscalingLoading(true);
      setFrameStepNotice('Contacting AI Upscaler API (2x Super-Resolution • 25cr)...');

      const response = await fetch('/api/upscale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoUrl: activeVideoUrl,
          scale: 2,
          cinematicStyle: true,
          maintainCinematicGrain: true,
          userId: user?.id,
          email: user?.email,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to upscale video');
      }

      if (data.remainingCredits !== undefined && user && onCreditsUpdated) {
        onCreditsUpdated({ ...user, credits: data.remainingCredits });
      }

      setIs2xUpscaled(true);
      if (onAiUpscaleChange) onAiUpscaleChange(true);
      if (data.upscaledUrl && data.upscaledUrl !== activeVideoUrl) {
        setActiveVideoUrl(data.upscaledUrl);
      }
      setUpscaleDetails({
        resolution: data.masterResolution || '2160x3840 (4K Master)',
        notice: data.message || '2x AI Upscale Active: Doubled Resolution (4K UHD) with Cinematic Grain Lock (-25cr)',
      });
      setFrameStepNotice(`✨ 2x AI-Upscale Enabled: 4K UHD Master (-25 credits, Balance: ${data.remainingCredits ?? currentCredits - 25}cr)`);
    } catch (err: any) {
      console.warn('Upscale API notice:', err);
      setFrameStepNotice(`⚠️ Upscale notice: ${err?.message || 'Could not process upscale'}`);
    } finally {
      setIsUpscalingLoading(false);
      setTimeout(() => setFrameStepNotice(null), 3500);
    }
  };

  // 2. Keyframe Editor State
  const [showKeyframeEditor, setShowKeyframeEditor] = useState(false);
  const [keyframes, setKeyframes] = useState<KeyframePromptOverride[]>([
    {
      id: 'kf-1',
      timestamp: 0.0,
      promptOverride: prompt || 'Establish wide angle shot with volumetric sunset illumination',
      motionStrength: 'subtle',
      cameraMove: 'pan-left',
    },
    {
      id: 'kf-2',
      timestamp: 2.5,
      promptOverride: 'Dynamic camera push-in focusing on glowing highlights and surface reflections',
      motionStrength: 'dynamic',
      cameraMove: 'zoom-in',
    },
  ]);

  const [newKeyframePrompt, setNewKeyframePrompt] = useState('');
  const [newKeyframeMotion, setNewKeyframeMotion] = useState<'subtle' | 'dynamic' | 'explosive'>('dynamic');
  const [newKeyframeCamera, setNewKeyframeCamera] = useState<'pan-left' | 'pan-right' | 'zoom-in' | 'orbit' | 'fpv-roll' | 'static'>('zoom-in');
  const [activeKeyframeNotice, setActiveKeyframeNotice] = useState<KeyframePromptOverride | null>(null);

  // Active Keyframe tracking during video playback
  useEffect(() => {
    const active = [...keyframes]
      .sort((a, b) => b.timestamp - a.timestamp)
      .find((kf) => currentTime >= kf.timestamp);
    if (active && active.id !== activeKeyframeNotice?.id) {
      setActiveKeyframeNotice(active);
    }
  }, [currentTime, keyframes, activeKeyframeNotice]);

  const addKeyframeAtCurrentTime = () => {
    const time = Math.round(currentTime * 10) / 10;
    const existingIndex = keyframes.findIndex((k) => Math.abs(k.timestamp - time) < 0.2);

    const newKf: KeyframePromptOverride = {
      id: `kf-${Date.now()}`,
      timestamp: time,
      promptOverride: newKeyframePrompt.trim() || `Motion override at ${time.toFixed(1)}s: accelerated cinematic push`,
      motionStrength: newKeyframeMotion,
      cameraMove: newKeyframeCamera,
    };

    let updated: KeyframePromptOverride[];
    if (existingIndex >= 0) {
      updated = [...keyframes];
      updated[existingIndex] = newKf;
    } else {
      updated = [...keyframes, newKf].sort((a, b) => a.timestamp - b.timestamp);
    }

    setKeyframes(updated);
    setNewKeyframePrompt('');
    onKeyframesChange?.(updated);
    setFrameStepNotice(`Keyframe added at ${time.toFixed(1)}s`);
    setTimeout(() => setFrameStepNotice(null), 2000);
  };

  const removeKeyframe = (id: string) => {
    const updated = keyframes.filter((k) => k.id !== id);
    setKeyframes(updated);
    onKeyframesChange?.(updated);
  };

  const seekToKeyframe = (ts: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = ts;
      setCurrentTime(ts);
    }
  };

  // Synchronize playbackRate whenever speed or videoUrl changes
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed, activeVideoUrl]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onTimeUpdate = () => setCurrentTime(video.currentTime);
    const onLoadedMetadata = () => {
      setVideoDuration(video.duration || 5);
      video.playbackRate = playbackSpeed;
      setIsVideoLoadingSource(false);
    };
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => {
      if (!isLooping) {
        setIsPlaying(false);
      }
    };

    const onLoadStart = () => setIsVideoLoadingSource(true);
    const onWaiting = () => setIsVideoLoadingSource(true);
    const onCanPlay = () => setIsVideoLoadingSource(false);
    const onPlaying = () => {
      setIsPlaying(true);
      setIsVideoLoadingSource(false);
    };
    const onLoadedData = () => setIsVideoLoadingSource(false);

    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('loadedmetadata', onLoadedMetadata);
    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('ended', onEnded);
    video.addEventListener('loadstart', onLoadStart);
    video.addEventListener('waiting', onWaiting);
    video.addEventListener('canplay', onCanPlay);
    video.addEventListener('playing', onPlaying);
    video.addEventListener('loadeddata', onLoadedData);

    video.load();
    // Auto-play with muted standard & audio volume level
    video.muted = isMuted;
    video.volume = isMuted ? 0 : volume;
    video.playbackRate = playbackSpeed;
    video.play().catch((err) => {
      console.warn('Auto-play prevented:', err);
      setIsPlaying(false);
    });

    return () => {
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('loadedmetadata', onLoadedMetadata);
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('ended', onEnded);
      video.removeEventListener('loadstart', onLoadStart);
      video.removeEventListener('waiting', onWaiting);
      video.removeEventListener('canplay', onCanPlay);
      video.removeEventListener('playing', onPlaying);
      video.removeEventListener('loadeddata', onLoadedData);
    };
  }, [activeVideoUrl, isLooping, isMuted, volume, playbackSpeed]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch((err) => {
        console.warn('Video play interrupted:', err);
        setIsPlaying(false);
      });
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const nextMuted = !isMuted;
    videoRef.current.muted = nextMuted;
    if (!nextMuted) {
      const targetVol = volume === 0 ? 0.8 : volume;
      videoRef.current.volume = targetVol;
      if (volume === 0) setVolume(0.8);
    }
    setIsMuted(nextMuted);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('nexverze_player_muted', String(nextMuted));
      } catch {
        // ignore
      }
    }
    const currentDisplayVol = Math.round((!nextMuted && volume === 0 ? 0.8 : volume) * 100);
    setFrameStepNotice(nextMuted ? '🔇 Audio Muted' : `🔊 Audio: ${currentDisplayVol}% (Master Track Active)`);
    setTimeout(() => setFrameStepNotice(null), 2000);
  };

  const handleVolumeChange = (newVolume: number) => {
    const clamped = Math.max(0, Math.min(1, newVolume));
    setVolume(clamped);
    if (videoRef.current) {
      videoRef.current.volume = clamped;
      if (clamped > 0 && isMuted) {
        videoRef.current.muted = false;
        setIsMuted(false);
        try {
          localStorage.setItem('nexverze_player_muted', 'false');
        } catch {
          // ignore
        }
      } else if (clamped === 0 && !isMuted) {
        videoRef.current.muted = true;
        setIsMuted(true);
        try {
          localStorage.setItem('nexverze_player_muted', 'true');
        } catch {
          // ignore
        }
      }
    }
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('nexverze_player_volume', String(clamped));
      } catch {
        // ignore
      }
    }
    setFrameStepNotice(clamped === 0 ? '🔇 Audio Muted' : `🔊 Volume: ${Math.round(clamped * 100)}%`);
    setTimeout(() => setFrameStepNotice(null), 1500);
  };

  const toggleLoop = (newValue?: boolean) => {
    const next = typeof newValue === 'boolean' ? newValue : !isLooping;
    setIsLooping(next);
    if (videoRef.current) {
      videoRef.current.loop = next;
    }
    setFrameStepNotice(next ? '🔁 Loop Video: Enabled (Continuous Playback)' : '➡️ Loop Video: Disabled (Single Playback)');
    setTimeout(() => setFrameStepNotice(null), 2000);
  };

  // Sync native video loop attribute whenever isLooping state changes
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.loop = isLooping;
    }
  }, [isLooping]);

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
    setFrameStepNotice(`⚡ Playback Speed: ${speed}x`);
    setTimeout(() => setFrameStepNotice(null), 1500);
  };

  /**
   * Precise frame-by-frame navigation (30 frames/sec standard)
   */
  const stepFrame = useCallback((deltaFrames: number) => {
    const video = videoRef.current;
    if (!video) return;

    if (!video.paused) {
      video.pause();
      setIsPlaying(false);
    }

    const FPS = 30;
    const frameDuration = 1 / FPS;
    const maxTime = video.duration || videoDuration || 5;
    const newTime = Math.max(0, Math.min(maxTime, video.currentTime + deltaFrames * frameDuration));
    video.currentTime = newTime;
    setCurrentTime(newTime);

    const currentFrameNumber = Math.round(newTime * FPS);
    const totalFrames = Math.round(maxTime * FPS);
    const label = `${deltaFrames > 0 ? '▶' : '◀'} Frame ${currentFrameNumber}/${totalFrames} (${newTime.toFixed(2)}s)`;
    setFrameStepNotice(label);

    const timer = setTimeout(() => {
      setFrameStepNotice((curr) => (curr === label ? null : curr));
    }, 1200);

    return () => clearTimeout(timer);
  }, [videoDuration]);

  // Keyboard navigation: Left/Right Arrow keys for frame-by-frame, Space for Play/Pause, M for Mute
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA');
      if (isInput) return;

      if (!isPlayerHovered && document.activeElement !== containerRef.current) {
        return;
      }

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        stepFrame(e.shiftKey ? -5 : -1);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        stepFrame(e.shiftKey ? 5 : 1);
      } else if (e.key === ' ') {
        e.preventDefault();
        togglePlay();
      } else if (e.key.toLowerCase() === 'm') {
        e.preventDefault();
        toggleMute();
      } else if (e.key.toLowerCase() === 'l') {
        e.preventDefault();
        toggleLoop();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        handleVolumeChange(Math.min(1, Number((volume + 0.05).toFixed(2))));
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        handleVolumeChange(Math.max(0, Number((volume - 0.05).toFixed(2))));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isPlayerHovered, stepFrame, isPlaying, isMuted, isLooping, volume]);

  // Scrub bar dragging handling
  const seekToClientX = (clientX: number) => {
    if (!scrubBarRef.current || !videoRef.current) return;
    const rect = scrubBarRef.current.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const targetDuration = videoDuration || videoRef.current.duration || 5;
    const targetTime = percent * targetDuration;
    videoRef.current.currentTime = targetTime;
    setCurrentTime(targetTime);
  };

  const handleScrubMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsScrubbing(true);
    seekToClientX(e.clientX);
  };

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (isScrubbing) {
        seekToClientX(e.clientX);
      }
    };
    const onMouseUp = () => {
      if (isScrubbing) {
        setIsScrubbing(false);
      }
    };

    if (isScrubbing) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [isScrubbing, videoDuration]);

  const handleScrubHover = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!scrubBarRef.current) return;
    const rect = scrubBarRef.current.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const targetDuration = videoDuration || 5;
    setHoverPercent(percent);
    setHoverTime(percent * targetDuration);
  };

  const handleScrubLeave = () => {
    setHoverTime(null);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const handleDownload = () => {
    if (isFreeUser) {
      if (onOpenPlans) {
        onOpenPlans();
      }
      setWatermarkUpgradeAlert(true);
      setFrameStepNotice('🔒 Watermark-free 1080p HD Download Locked in Free Preview. Top up ₹99 Nano Trial Pack to unlock!');
      setTimeout(() => setFrameStepNotice(null), 5000);
      return;
    }
    const link = document.createElement('a');
    link.href = activeVideoUrl;
    link.download = `nexverze-studio-${is2xUpscaled ? '4k-upscaled-' : ''}${aspectRatio.replace(':', '-')}.mp4`;
    link.target = '_blank';
    link.click();
  };

  // Watermark toggle logic
  const handleToggleWatermark = () => {
    setIsWatermarkActive((prev) => {
      const nextState = !prev;
      setFrameStepNotice(nextState ? '🛡️ Watermark overlay enabled' : '✨ Watermark removed');
      setTimeout(() => setFrameStepNotice(null), 2500);
      return nextState;
    });
  };

  const getWatermarkPositionClasses = () => {
    switch (watermarkPosition) {
      case 'bottom-left':
        return 'bottom-16 left-4';
      case 'top-right':
        return 'top-14 right-4';
      case 'top-left':
        return 'top-14 left-4';
      case 'center':
        return 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2';
      case 'bottom-right':
      default:
        return 'bottom-16 right-4';
    }
  };

  const getWatermarkScaleClasses = () => {
    switch (watermarkScale) {
      case 'sm':
        return 'text-[10px] py-1 px-2.5';
      case 'lg':
        return 'text-sm py-2 px-4';
      case 'md':
      default:
        return 'text-xs py-1.5 px-3';
    }
  };

  /**
   * Extract Frame: Renders the active video frame onto an in-memory canvas
   * at full native video resolution (1080x1920 or 2160x3840 when upscaled) and triggers PNG download.
   * If watermark is active, stamps the customizable semi-transparent watermark to protect generated assets.
   */
  const handleExtractFrame = async () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      setIsExtractingFrame(true);
      const canvas = document.createElement('canvas');
      canvas.width = is2xUpscaled ? 2160 : (video.videoWidth || 1080);
      canvas.height = is2xUpscaled ? 3840 : (video.videoHeight || 1920);
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('Canvas context unavailable');
      }

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Protect generated asset: Stamp semi-transparent customizable image watermark on exported frame
      if (isWatermarkActive) {
        try {
          await new Promise<void>((resolve) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
              ctx.save();
              ctx.globalAlpha = watermarkOpacity;
              const baseW = is2xUpscaled ? 180 : 100;
              const w = watermarkScale === 'sm' ? baseW * 0.75 : watermarkScale === 'lg' ? baseW * 1.35 : baseW;
              const h = (img.height / img.width) * w;
              const padX = is2xUpscaled ? 80 : 40;
              const padY = is2xUpscaled ? 80 : 40;

              let x = canvas.width - w - padX;
              let y = canvas.height - h - padY;

              if (watermarkPosition === 'bottom-left') {
                x = padX;
                y = canvas.height - h - padY;
              } else if (watermarkPosition === 'top-right') {
                x = canvas.width - w - padX;
                y = padY;
              } else if (watermarkPosition === 'top-left') {
                x = padX;
                y = padY;
              } else if (watermarkPosition === 'center') {
                x = (canvas.width - w) / 2;
                y = (canvas.height - h) / 2;
              }

              ctx.drawImage(img, x, y, w, h);
              ctx.restore();
              resolve();
            };
            img.onerror = () => resolve();
            img.src = '/studio/circuit_watermark.png';
          });
        } catch (e) {
          console.error('Watermark stamp error:', e);
        }
      }

      // Export as PNG
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      const timeStampSec = Math.floor(currentTime * 10) / 10;
      link.download = `nexverze-${is2xUpscaled ? '4k-' : ''}frame-${aspectRatio.replace(':', '-')}-${timeStampSec}s${
        isWatermarkActive ? '-watermarked' : ''
      }.png`;
      link.href = dataUrl;
      link.click();

      setFrameExtractedSuccess(true);
      if (isFreeUser && isWatermarkActive) {
        setFrameStepNotice('For remove watermark or watermark free video use our payment models (show our plans)');
        setTimeout(() => setFrameStepNotice(null), 4500);
      }
      setTimeout(() => setFrameExtractedSuccess(false), 2500);
    } catch (err) {
      console.error('Extract frame error (cross-origin or playback):', err);
      setFrameStepNotice('Frame extraction: If video is hosted cross-origin, right-click video & choose "Copy video frame" or save full MP4.');
      setTimeout(() => setFrameStepNotice(null), 4500);
    } finally {
      setIsExtractingFrame(false);
    }
  };

  const getRatioStyle = () => {
    switch (aspectRatio) {
      case '9:16':
        return 'aspect-[9/16] max-w-[340px] sm:max-w-[380px]';
      case '16:9':
        return 'aspect-[16/9] max-w-[680px] w-full';
      case '1:1':
        return 'aspect-square max-w-[440px] w-full';
    }
  };

  const formattedTimestamp = timestamp
    ? new Date(timestamp).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : new Date().toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

  const progressPercent = videoDuration > 0 ? (currentTime / videoDuration) * 100 : 0;
  const currentFrame = Math.round(currentTime * 30);
  const totalFrames = Math.round((videoDuration || 5) * 30);

  /**
   * Video error handler: Captures diagnostic reports, executes exponential backoff retries, and falls back if max retries exceeded.
   */
  const handleVideoError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    const videoEl = videoRef.current || (e.currentTarget as HTMLVideoElement);
    const mediaErrorObj = videoEl ? videoEl.error : null;
    const errorDetails = getMediaErrorDetails(mediaErrorObj);

    // 1. Diagnostic Report Construction & Console Diagnostic Tracking
    const report: VideoDiagnosticReport = {
      timestamp: new Date().toISOString(),
      failedUrl: currentVideo,
      sourceType:
        currentVideo === fallbackPlaceholderVideo
          ? 'fallback'
          : is2xUpscaled
          ? 'upscaled'
          : retryCountRef.current > 0
          ? 'retry'
          : 'primary',
      attempt: retryCountRef.current + 1,
      maxRetries,
      nextRetryDelayMs:
        retryCountRef.current < maxRetries
          ? Math.min(1000 * Math.pow(2, retryCountRef.current), 8000)
          : undefined,
      errorCode: errorDetails.code,
      errorMessage: errorDetails.message,
      networkState: getNetworkStateLabel(videoEl ? videoEl.networkState : 0),
      readyState: getReadyStateLabel(videoEl ? videoEl.readyState : 0),
      online: typeof navigator !== 'undefined' ? navigator.onLine : true,
      videoDimensions: {
        videoWidth: videoEl ? videoEl.videoWidth : 0,
        videoHeight: videoEl ? videoEl.videoHeight : 0,
      },
      playerState: {
        currentTime: videoEl ? videoEl.currentTime : currentTime,
        duration: videoEl ? videoEl.duration || videoDuration : videoDuration,
        aspectRatio,
        modelName,
      },
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Server',
    };

    // Diagnostic console log group
    console.group(`🚨 [QualityLockPlayer Diagnostic Tracking] Video Load Failure #${report.attempt}/${report.maxRetries}`);
    console.error(`Failed Source URL:`, report.failedUrl);
    console.error(`Error Code ${report.errorCode}:`, report.errorMessage);
    console.warn(`Network State:`, report.networkState);
    console.warn(`Ready State:`, report.readyState);
    if (report.nextRetryDelayMs) {
      console.info(`Exponential Backoff Scheduled Delay: ${report.nextRetryDelayMs}ms`);
    }
    console.table({
      SourceType: report.sourceType,
      OnlineStatus: report.online ? 'Online (Connected)' : 'Offline (No Connection)',
      Resolution: `${report.videoDimensions.videoWidth}x${report.videoDimensions.videoHeight}`,
      Position: `${report.playerState.currentTime.toFixed(2)}s / ${report.playerState.duration.toFixed(2)}s`,
      Model: report.playerState.modelName,
      AspectRatio: report.playerState.aspectRatio,
    });
    console.groupEnd();

    setLatestDiagnostic(report);
    onDiagnosticReport?.(report);

    // 2. Exponential Backoff Retry Strategy before fallback
    if (retryCountRef.current < maxRetries && currentVideo !== fallbackPlaceholderVideo) {
      retryCountRef.current += 1;
      const attemptNumber = retryCountRef.current;
      const delayMs = Math.min(1000 * Math.pow(2, attemptNumber - 1), 8000);

      setRetryStatus({
        attempt: attemptNumber,
        max: maxRetries,
        nextDelayMs: delayMs,
      });
      setIsVideoLoadingSource(true);

      setFrameStepNotice(`🔄 Video load failed. Retrying (${attemptNumber}/${maxRetries}) in ${(delayMs / 1000).toFixed(1)}s (Exponential Backoff)...`);

      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }

      retryTimeoutRef.current = setTimeout(() => {
        if (!videoEl) return;
        console.info(`🔄 [QualityLockPlayer Retry #${attemptNumber}/${maxRetries}] Executing backoff reload for URL: ${currentVideo}`);
        const cacheBustUrl = currentVideo.includes('?')
          ? `${currentVideo}&_retry=${Date.now()}`
          : `${currentVideo}?_retry=${Date.now()}`;

        videoEl.src = cacheBustUrl;
        videoEl.load();
        videoEl.play().catch((playErr) => {
          console.warn('QualityLockPlayer: Play interrupted on retry:', playErr);
        });
      }, delayMs);

      return;
    }

    // 3. Max Retries Reached: Transition to fallback placeholder video
    console.error(`❌ [QualityLockPlayer Max Retries Reached] Switching to fallback placeholder video: ${fallbackPlaceholderVideo}`);
    setRetryStatus(null);
    setIsVideoLoadingSource(false);

    const fallbackVideo = fallbackPlaceholderVideo;
    if (currentVideo !== fallbackVideo) {
      setCurrentVideo(fallbackVideo);
    }

    if (videoEl) {
      const isAlreadyFallback =
        videoEl.src.endsWith(fallbackVideo) ||
        videoEl.currentSrc?.endsWith(fallbackVideo) ||
        videoEl.src === fallbackVideo;

      if (!isAlreadyFallback) {
        videoEl.src = fallbackVideo;
        videoEl.load();
        videoEl.play().catch((playErr) => {
          console.warn('QualityLockPlayer: Fallback placeholder video auto-play prevented by policy:', playErr);
        });
      }
    }

    setFrameStepNotice('⚠️ Video failed to load after retries. Reset to fallback placeholder video.');
    setTimeout(() => setFrameStepNotice(null), 3500);

    onVideoError?.(fallbackVideo);
    onError?.(e);
  };

  return (
    <div className="flex flex-col items-center w-full">
      {/* Viewport Top Bar: Display Viewport, 2x AI Upscale, Frame Smoothing, Loop Video, Quality Lock */}
      <div className="w-full flex flex-wrap items-center justify-between gap-2.5 mb-3 px-1">
        <div className="flex items-center gap-2">
          <span className="mono text-xs text-white/50">Display Viewport:</span>
          <div className="flex items-center gap-1 bg-[#18181b] border border-[#27272a] p-1 rounded-xl">
            {(['9:16', '16:9', '1:1'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => onRatioChange?.(r)}
                className={`px-2.5 py-1 rounded-lg text-xs mono font-semibold transition-all ${
                  aspectRatio === r
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-white/60 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* 2X AI-UPSCALE TOGGLE (Uses external API to double resolution while maintaining cinematic style) */}
          <button
            type="button"
            onClick={handleToggleUpscale}
            disabled={isUpscalingLoading}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs mono transition-all border ${
              is2xUpscaled
                ? 'bg-gradient-to-r from-purple-900/60 to-indigo-900/60 border-purple-400 text-purple-200 shadow-md shadow-purple-900/40 ring-1 ring-purple-400/40'
                : 'bg-[#18181b] border-[#27272a] hover:border-purple-500/40 text-white/70 hover:text-white'
            }`}
            title="2x AI Upscale: Call external AI super-resolution API to double resolution (1080p -> 4K) while preserving cinematic grain and grading"
          >
            {isUpscalingLoading ? (
              <RefreshCw className="w-3.5 h-3.5 text-purple-400 animate-spin" />
            ) : (
              <Sparkles className={`w-3.5 h-3.5 ${is2xUpscaled ? 'text-cyan-300 fill-cyan-300 animate-pulse' : 'text-purple-400'}`} />
            )}
            <span className="font-semibold">2x AI Upscale</span>
            {is2xUpscaled ? (
              <span className="px-1.5 py-0.2 rounded bg-cyan-400/20 text-cyan-200 text-[9px] font-bold border border-cyan-400/40">
                4K UHD
              </span>
            ) : (
              <span className="text-[9px] text-white/40">2x</span>
            )}
          </button>

          {/* Keyframe Editor Drawer Toggle */}
          <button
            type="button"
            onClick={() => setShowKeyframeEditor(!showKeyframeEditor)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs mono transition-all border ${
              showKeyframeEditor
                ? 'bg-purple-900/40 border-purple-400 text-purple-200'
                : 'bg-[#18181b] border-[#27272a] hover:border-purple-500/40 text-white/70 hover:text-white'
            }`}
            title="Keyframe Editor: Set timestamp-based prompt overrides for advanced camera & motion control"
          >
            <Sliders className="w-3.5 h-3.5 text-purple-400" />
            <span>Keyframes ({keyframes.length})</span>
          </button>

          {/* Frame Smoothing Toggle */}
          <label
            className={`flex items-center gap-1.5 cursor-pointer select-none border px-2.5 py-1.5 rounded-xl text-xs mono transition-all ${
              isFrameSmoothing
                ? 'bg-purple-950/40 border-purple-500/60 text-purple-200 shadow-sm shadow-purple-900/30 ring-1 ring-purple-500/30'
                : 'bg-[#18181b] border-[#27272a] hover:border-purple-500/40 text-white/70 hover:text-white'
            }`}
            title="Frame Smoothing: Applies CSS blur-transition interpolation to mimic high frame rate motion review"
          >
            <input
              type="checkbox"
              checked={isFrameSmoothing}
              onChange={(e) => setIsFrameSmoothing(e.target.checked)}
              className="w-3.5 h-3.5 rounded text-purple-600 focus:ring-0 focus:ring-offset-0 bg-[#0f0f17] border-[#3f3f46] accent-purple-600 cursor-pointer"
            />
            <span className="flex items-center gap-1">
              <Layers className={`w-3 h-3 ${isFrameSmoothing ? 'text-purple-400 animate-pulse' : 'text-white/40'}`} />
              <span className={isFrameSmoothing ? 'text-white font-medium' : 'text-white/60'}>Smoothing</span>
              {isFrameSmoothing && (
                <span className="text-[9px] px-1 py-0.2 rounded bg-purple-500/30 text-purple-300 font-bold uppercase tracking-wider">
                  60fps
                </span>
              )}
            </span>
          </label>

          {/* Loop Video Checkbox */}
          <label className="flex items-center gap-1.5 cursor-pointer select-none bg-[#18181b] border border-[#27272a] hover:border-purple-500/40 px-2.5 py-1.5 rounded-xl text-xs mono text-white/80 transition-colors">
            <input
              type="checkbox"
              checked={isLooping}
              onChange={(e) => toggleLoop(e.target.checked)}
              className="w-3.5 h-3.5 rounded text-purple-600 focus:ring-0 focus:ring-offset-0 bg-[#0f0f17] border-[#3f3f46] accent-purple-600 cursor-pointer"
            />
            <span className="flex items-center gap-1">
              <Repeat className={`w-3 h-3 ${isLooping ? 'text-purple-400' : 'text-white/40'}`} />
              <span className={isLooping ? 'text-white font-medium' : 'text-white/50'}>Loop Video</span>
            </span>
          </label>

          {/* WATERMARK TOGGLE (Overlays customizable semi-transparent 'NexVerze Studio' watermark) */}
          <div className="flex items-center">
            <button
              type="button"
              onClick={handleToggleWatermark}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-l-xl text-xs mono transition-all border ${
                isWatermarkActive
                  ? 'bg-purple-950/50 border-purple-500 text-purple-200 shadow-sm shadow-purple-900/30'
                  : 'bg-[#18181b] border-[#27272a] hover:border-purple-500/40 text-white/60 hover:text-white'
              }`}
              title={
                isFreeUser
                  ? 'Watermark active for free users. For remove watermark or watermark free video use our payment models (show our plans)'
                  : 'Toggle semi-transparent NexVerze Studio watermark overlay to protect assets'
              }
            >
              {isFreeUser ? (
                <Lock className="w-3.5 h-3.5 text-purple-400" />
              ) : isWatermarkActive ? (
                <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
              ) : (
                <Shield className="w-3.5 h-3.5 text-white/40" />
              )}
              <span className="font-semibold">Watermark</span>
              <span
                className={`text-[9px] px-1 py-0.2 rounded font-bold uppercase ${
                  isWatermarkActive
                    ? 'bg-purple-500/30 text-purple-200 border border-purple-400/30'
                    : 'bg-white/10 text-white/50'
                }`}
              >
                {isFreeUser ? 'Free' : isWatermarkActive ? 'On' : 'Off'}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setShowWatermarkSettings(!showWatermarkSettings)}
              className={`p-1.5 rounded-r-xl border-y border-r text-xs transition-colors ${
                isWatermarkActive
                  ? 'bg-purple-950/50 border-purple-500 text-purple-300 hover:text-white'
                  : 'bg-[#18181b] border-[#27272a] text-white/50 hover:text-white'
              }`}
              title="Customize Watermark Text, Position & Opacity"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quality Lock Indicator Badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs mono">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="font-semibold">QUALITY LOCK</span>
            <span className="text-white/40 hidden sm:inline">|</span>
            <span className="text-white/70 hidden sm:inline">
              {is2xUpscaled ? '2160×3840 (4K Master)' : '1080×1920 Master'}
            </span>
          </div>
        </div>
      </div>



      {/* Multi-Scene Connected Storyboard Playlist Bar (when 3-Scene Storyboard has generated clips) */}
      {storyboardPlaylist && storyboardPlaylist.some((s) => s.status === 'completed' && s.videoUrl) && (
        <div className="w-full mb-3 p-2.5 rounded-2xl bg-gradient-to-r from-purple-950/70 via-[#141225] to-indigo-950/70 border border-purple-500/40 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-purple-200 mono">
            <Film className="w-3.5 h-3.5 text-amber-300" />
            <span>🎞️ 3-Scene Storyboard Playlist:</span>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {storyboardPlaylist.map((sc) => {
              const isReady = sc.status === 'completed' && Boolean(sc.videoUrl);
              const isCurr = activeStoryboardScene === sc.sceneNumber;
              return (
                <button
                  key={sc.sceneNumber}
                  type="button"
                  disabled={!isReady}
                  onClick={() => isReady && onSelectStoryboardScene?.(sc)}
                  className={`px-2.5 py-1 rounded-xl text-[11px] mono font-bold transition-all flex items-center gap-1 cursor-pointer border ${
                    isCurr
                      ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 border-amber-300 shadow-md'
                      : isReady
                      ? 'bg-purple-900/50 text-white border-purple-400/40 hover:bg-purple-800/60'
                      : 'bg-white/5 text-white/30 border-white/10 cursor-not-allowed'
                  }`}
                >
                  <span>Scene #{sc.sceneNumber}: {sc.title}</span>
                  {isReady && <Check className="w-3 h-3" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* The Quality-Locked Video Container */}
      <div
        ref={containerRef}
        tabIndex={0}
        onMouseEnter={() => {
          setShowControls(true);
          setIsPlayerHovered(true);
        }}
        onMouseLeave={() => {
          setShowControls(false);
          setIsPlayerHovered(false);
        }}
        className={`relative ${getRatioStyle()} bg-[#0f0f17] rounded-2xl overflow-hidden border ${
          isGenerating
            ? 'animate-player-generating'
            : is2xUpscaled
            ? 'border-purple-500/60 shadow-purple-900/30 ring-1 ring-purple-500/20'
            : 'border-[#27272a]'
        } shadow-2xl transition-all duration-300 group focus:outline-hidden focus:ring-1 focus:ring-purple-500/50`}
      >
        {/* QUALITY LOCK: ALWAYS MASTER SOURCE, DISPLAYED WITH object-cover object-center */}
        <video
          ref={videoRef}
          src={currentVideo || fallbackPlaceholderVideo}
          poster={posterUrl}
          loop={isLooping}
          crossOrigin={currentVideo?.startsWith('http') ? 'anonymous' : undefined}
          playsInline
          muted={isMuted}
          className={`w-full h-full object-cover object-center cursor-pointer select-none transition-[filter] duration-300 ${
            isFrameSmoothing ? 'frame-smoothing-active' : ''
          } ${is2xUpscaled ? 'ai-upscale-2x-active' : ''}`}
          style={{
            filter:
              COLOR_GRADING_PRESETS.find((p) => p.id === colorGradingState)?.filter !== 'none'
                ? COLOR_GRADING_PRESETS.find((p) => p.id === colorGradingState)?.filter
                : undefined,
          }}
          onClick={togglePlay}
          onError={handleVideoError}
          onLoadStart={() => setIsVideoLoadingSource(true)}
          onWaiting={() => setIsVideoLoadingSource(true)}
          onCanPlay={() => setIsVideoLoadingSource(false)}
          onPlaying={() => {
            setIsPlaying(true);
            setIsVideoLoadingSource(false);
          }}
          onLoadedData={() => setIsVideoLoadingSource(false)}
          onSeeking={() => setIsVideoLoadingSource(true)}
          onSeeked={() => setIsVideoLoadingSource(false)}
        >
          <source src={currentVideo || fallbackPlaceholderVideo} type="video/mp4" />
          <source src={fallbackPlaceholderVideo} type="video/mp4" />
        </video>

        {/* VISUAL SKELETON LOADER & SPINNER OVERLAY (Activates when video source is changing or reloading to prevent blank flickers) */}
        {isVideoLoadingSource && !isGenerating && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center p-6 bg-[#0a0a12]/85 backdrop-blur-md animate-in fade-in duration-150 select-none">
            {/* Ambient Cosmic Pulses Background */}
            <div className="absolute inset-0 bg-gradient-to-tr from-purple-900/20 via-transparent to-cyan-900/20 animate-pulse pointer-events-none" />

            {/* Shimmer Light Bar Effect */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
              <div className="w-1/2 h-full bg-gradient-to-r from-transparent via-purple-300/30 to-transparent skew-x-12 animate-pulse" />
            </div>

            {/* Central Dual Spinner & Status HUD */}
            <div className="relative z-10 flex flex-col items-center text-center space-y-3 max-w-xs">
              <div className="relative flex items-center justify-center">
                <div className="w-14 h-14 rounded-full border-2 border-purple-500/20 border-t-purple-400 border-r-cyan-400 animate-spin shadow-xl shadow-purple-900/40" />
                <RefreshCw className="absolute w-5 h-5 text-purple-300 animate-spin" />
              </div>

              <div className="space-y-1">
                <span className="mono text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-200 border border-purple-400/30 shadow-xs">
                  {retryStatus ? `Retry Attempt ${retryStatus.attempt}/${retryStatus.max}` : 'Loading Video Stream'}
                </span>
                <h5 className="text-xs font-semibold text-white tracking-tight">
                  {retryStatus
                    ? `Retrying in ${(retryStatus.nextDelayMs / 1000).toFixed(1)}s (Exponential Backoff)`
                    : 'Synchronizing Master Frame Quality...'}
                </h5>
                <p className="text-[10px] mono text-white/50 truncate max-w-[220px]">
                  {currentVideo}
                </p>
              </div>

              {/* Skeleton Pulse Bar */}
              <div className="w-full space-y-1.5 pt-1 opacity-75">
                <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden p-0.5">
                  <div className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-400 animate-pulse w-3/4 rounded-full" />
                </div>
                <div className="flex justify-between text-[9px] mono text-white/40">
                  <span>Buffering stream</span>
                  <span>1080p Master Lock</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* GENERATION IN PROGRESS: DIRECT PLAYER OVERLAY WITH PROGRESS BAR & GLOWING HUD */}
        {isGenerating && (
          <div className="absolute inset-0 z-35 flex flex-col items-center justify-center p-5 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
            {/* Ambient Cosmic Radial Glow Behind Spinner */}
            <div className="absolute w-44 h-44 rounded-full bg-purple-600/30 blur-2xl pointer-events-none animate-pulse" />

            <div className="relative z-10 w-full max-w-xs flex flex-col items-center text-center space-y-4">
              {/* Spinner & Progress Indicator */}
              <div className="relative flex items-center justify-center">
                <div className="w-16 h-16 rounded-full border-3 border-purple-500/20 border-t-purple-400 border-r-pink-400 animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-amber-300 animate-pulse" />
                </div>
              </div>

              {/* Status Header */}
              <div className="space-y-1">
                <div className="flex items-center justify-center gap-2">
                  <span className="mono text-[11px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-200 border border-purple-400/30">
                    Generating Master Video
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white tracking-tight">
                  Rendering {modelName} Output
                </h4>
                <p className="text-[11px] text-purple-200/90 font-mono font-medium animate-pulse min-h-[1.5rem] flex items-center justify-center">
                  {generationStage}
                </p>
              </div>

              {/* Direct Progress Bar Overlay */}
              <div className="w-full space-y-2 pt-1">
                <div className="flex items-center justify-between text-xs mono">
                  <span className="text-white/80 flex items-center gap-1.5 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
                    <span>Neural Pipeline</span>
                  </span>
                  <span className="text-amber-300 font-black text-sm px-2.5 py-0.5 rounded-md bg-amber-500/20 border border-amber-500/40 shadow-sm">
                    {Math.round(generationProgress)}%
                  </span>
                </div>

                {/* Progress Track */}
                <div className="w-full h-3 rounded-full bg-white/10 overflow-hidden p-0.5 border border-purple-500/40 shadow-inner">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-purple-500 via-pink-500 to-amber-400 transition-all duration-150 ease-out shadow-[0_0_18px_rgba(236,72,153,0.95)]"
                    style={{ width: `${Math.max(4, Math.min(100, generationProgress))}%` }}
                  />
                </div>
              </div>

              <div className="text-[10px] mono text-white/40">
                1080×1920 Master Quality Lock active
              </div>
            </div>
          </div>
        )}


        {/* SCENE TRANSITION VISUAL OVERLAY: Crossfade blend or Wipe sweep at frame boundary */}
        {sceneTransitionState === 'Crossfade' && (
          <div
            className={`absolute inset-0 z-10 pointer-events-none transition-opacity duration-300 ${
              currentTime < 0.35 || (videoDuration > 0 && currentTime > videoDuration - 0.35)
                ? 'opacity-25 bg-purple-950/40 backdrop-blur-[0.5px]'
                : 'opacity-0'
            }`}
            aria-hidden="true"
          />
        )}
        {sceneTransitionState === 'Wipe' && (
          <div
            className={`absolute inset-0 z-10 pointer-events-none overflow-hidden transition-opacity duration-300 ${
              currentTime < 0.4 || (videoDuration > 0 && currentTime > videoDuration - 0.4)
                ? 'opacity-70'
                : 'opacity-0'
            }`}
            aria-hidden="true"
          >
            <div className="w-full h-full bg-gradient-to-r from-transparent via-cyan-500/25 to-black/60" />
          </div>
        )}

        {/* 2X AI UPSCALE SUBTLE CINEMATIC SHEEN OVERLAY */}
        {is2xUpscaled && (
          <div
            className="absolute inset-0 z-10 pointer-events-none ai-upscale-sheen"
            aria-hidden="true"
          />
        )}

        {/* FRAME SMOOTHING CSS BLUR-TRANSITION INTERPOLATION OVERLAY EFFECT */}
        {isFrameSmoothing && (
          <div
            className="absolute inset-0 z-10 pointer-events-none frame-interpolation-overlay mix-blend-screen transition-opacity duration-300"
            aria-hidden="true"
          >
            <div className="w-full h-full backdrop-blur-[0.5px] bg-gradient-to-t from-purple-500/[0.03] via-transparent to-transparent" />
          </div>
        )}

        {/* CUSTOMIZABLE SEMI-TRANSPARENT CIRCUIT KNOT LOGO WATERMARK OVERLAY */}
        {isWatermarkActive && (
          <div
            className={`absolute z-20 pointer-events-none select-none transition-all duration-300 ${getWatermarkPositionClasses()}`}
            style={{ opacity: watermarkOpacity }}
          >
            <img
              src="/studio/circuit_watermark.png"
              alt="Circuit Knot Watermark Logo"
              className={`object-contain drop-shadow-[0_2px_10px_rgba(0,0,0,0.95)] ${
                watermarkScale === 'sm' ? 'h-6 sm:h-7' : watermarkScale === 'lg' ? 'h-12 sm:h-14' : 'h-8 sm:h-10'
              }`}
            />
          </div>
        )}

        {/* 📱 AUTO VIRAL CAPTIONS / SUBTITLES OVERLAY (Hormozi / Tanglish Neon / Cinema / Kinetic) */}
        {viralCaptions?.enabled && (
          <div className="absolute inset-x-3 bottom-16 z-25 pointer-events-none flex flex-col items-center justify-center text-center select-none">
            {(() => {
              const rawCaptionText =
                (viralCaptions.text && viralCaptions.text.trim()) ||
                prompt ||
                'Wait for the cinematic twist! 🔥 Shot in 4K Master Quality';
              const words = rawCaptionText.split(/\s+/).filter(Boolean);
              const chunkSize = 4;
              const chunks: string[] = [];
              for (let i = 0; i < words.length; i += chunkSize) {
                chunks.push(words.slice(i, i + chunkSize).join(' '));
              }
              const activeChunkIdx =
                chunks.length > 0
                  ? Math.floor((currentTime * 1.4) % chunks.length)
                  : 0;
              const currentPhrase = chunks[activeChunkIdx] || rawCaptionText;

              if (viralCaptions.style === 'hormozi') {
                return (
                  <div className="px-3.5 py-1.5 rounded-xl bg-black/75 border-2 border-amber-400 shadow-[0_4px_20px_rgba(0,0,0,0.9)] transform transition-all duration-150 scale-105">
                    <span className="text-sm sm:text-base font-black uppercase tracking-wider text-amber-300 drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">
                      {currentPhrase} 🔥
                    </span>
                  </div>
                );
              }
              if (viralCaptions.style === 'tanglish-neon') {
                return (
                  <div className="px-4 py-1.5 rounded-2xl bg-purple-950/80 backdrop-blur-md border border-fuchsia-400/60 shadow-[0_0_25px_rgba(217,70,239,0.8)]">
                    <span className="text-sm sm:text-base font-extrabold italic bg-gradient-to-r from-amber-300 via-fuchsia-300 to-cyan-300 bg-clip-text text-transparent">
                      ✨ {currentPhrase} ✨
                    </span>
                  </div>
                );
              }
              if (viralCaptions.style === 'kinetic-pop') {
                return (
                  <div className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-black text-xs sm:text-sm uppercase tracking-wide shadow-xl ring-2 ring-white/40">
                    ⚡ {currentPhrase}
                  </div>
                );
              }
              return (
                <div className="px-3.5 py-1 rounded-lg bg-black/85 border border-white/15 text-yellow-200 font-semibold text-xs sm:text-sm shadow-lg">
                  {currentPhrase}
                </div>
              );
            })()}
          </div>
        )}

        {/* TOP OVERLAY CONTROLS (AUTO-FIT TO 9:16, 16:9, 1:1) */}
        <div className="absolute top-2.5 inset-x-2.5 z-25 flex items-center justify-between gap-1 pointer-events-none">
          {/* Top Left: Model & 4K Indicator */}
          <div className="flex items-center gap-1 px-2 py-1 rounded-xl bg-black/75 backdrop-blur-md border border-white/10 text-[10px] mono text-white/90 shadow-md pointer-events-auto shrink-0 select-none">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse shrink-0" />
            <span className="font-semibold truncate max-w-[80px] sm:max-w-none">{modelName}</span>
            {is2xUpscaled && (
              <span className="text-cyan-300 font-bold ml-0.5 bg-cyan-950/70 px-1 py-0.2 rounded border border-cyan-400/40 text-[9px]">
                4K
              </span>
            )}
          </div>

          {/* Top Right: Quick Remix + Mute/Unmute Toggle + Aspect Ratio Badge */}
          <div className="flex items-center gap-1.5 pointer-events-auto shrink-0">
            {/* Quick Remix Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleRemixClick();
              }}
              className="flex items-center gap-1 px-2 py-1 rounded-xl backdrop-blur-md bg-purple-900/80 hover:bg-purple-800 text-white border border-purple-400/40 hover:border-amber-400/60 shadow-lg active:scale-95 transition-all cursor-pointer text-[10px] mono font-semibold shrink-0"
              title="Remix: Clone prompt & settings into Studio"
              aria-label="Remix current video"
            >
              <Shuffle className="w-3 h-3 text-amber-300 shrink-0" />
              <span className="hidden xs:inline sm:inline">Remix</span>
            </button>

            {/* Quick Top Mute Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleMute();
              }}
              className={`p-1.5 rounded-xl backdrop-blur-md border text-[10px] mono font-semibold transition-all shadow-md cursor-pointer shrink-0 ${
                isMuted
                  ? 'bg-black/85 text-rose-300 border-rose-500/40 hover:border-rose-400'
                  : 'bg-purple-950/85 text-emerald-300 border-purple-400/50 hover:border-emerald-400'
              }`}
              title={isMuted ? 'Unmute Audio (M key)' : `Mute Audio (M key) • Volume: ${Math.round((isMuted ? 0 : volume) * 100)}%`}
              aria-label={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-3.5 h-3.5" />
              ) : volume < 0.5 ? (
                <Volume1 className="w-3.5 h-3.5" />
              ) : (
                <Volume2 className="w-3.5 h-3.5" />
              )}
            </button>

            {/* Dynamic Aspect Ratio Tag */}
            <div className="px-2 py-1 rounded-xl bg-black/75 backdrop-blur-md border border-white/15 text-[10px] mono text-purple-300 font-bold shadow-md shrink-0 select-none">
              {aspectRatio}
            </div>
          </div>
        </div>

        {/* REMIX CONFIRMATION TOAST HUD */}
        {remixToast && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-35 pointer-events-none px-4 py-2 rounded-2xl bg-gradient-to-r from-purple-950/95 via-indigo-950/95 to-purple-950/95 backdrop-blur-md border border-purple-400/60 text-white mono text-xs font-bold shadow-2xl animate-fade-in flex items-center gap-2 whitespace-nowrap ring-1 ring-purple-400/40">
            <Shuffle className="w-4 h-4 text-amber-300 animate-spin" />
            <span>⚡ Remixed! Prompt & Configuration Cloned to Studio</span>
          </div>
        )}

        {/* Active Keyframe Prompt Override Banner in Viewport */}
        {activeKeyframeNotice && isPlaying && (
          <div className="absolute top-12 left-3 right-3 z-20 pointer-events-none px-3 py-1.5 rounded-xl bg-black/85 backdrop-blur-md border border-purple-500/40 text-purple-200 mono text-[11px] shadow-lg flex items-center justify-between gap-2 transition-all">
            <div className="flex items-center gap-1.5 truncate">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping shrink-0" />
              <span className="text-cyan-300 font-bold shrink-0">KF @ {activeKeyframeNotice.timestamp.toFixed(1)}s:</span>
              <span className="truncate text-white/90 italic">"{activeKeyframeNotice.promptOverride}"</span>
            </div>
            <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 uppercase">
              {activeKeyframeNotice.cameraMove}
            </span>
          </div>
        )}

        {/* Frame Step Notice HUD */}
        {frameStepNotice && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 pointer-events-none px-3 py-1.5 rounded-full bg-black/85 backdrop-blur-md border border-purple-500/40 text-purple-300 mono text-xs font-semibold shadow-xl animate-fade-in flex items-center gap-1.5 whitespace-nowrap">
            <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping"></span>
            <span>{frameStepNotice}</span>
          </div>
        )}

        {/* Center Play Button Overlay when paused */}
        {!isPlaying && (
          <button
            onClick={togglePlay}
            className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-purple-600/90 hover:bg-purple-500 text-white flex items-center justify-center backdrop-blur-sm z-20 shadow-xl transition-transform hover:scale-110 active:scale-95"
            aria-label="Play Video"
          >
            <Play className="w-7 h-7 translate-x-0.5 fill-white" />
          </button>
        )}

        {/* Interactive Bottom Control Bar (AUTO-FIT TO 9:16, 16:9, 1:1) */}
        <div
          className={`absolute bottom-0 inset-x-0 p-2 sm:p-2.5 bg-gradient-to-t from-black/95 via-black/85 to-transparent z-20 transition-opacity duration-200 space-y-1.5 ${
            showControls || !isPlaying || isScrubbing ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {/* CUSTOM SCRUB BAR WITH TIMESTAMPS & HOVER PREVIEW */}
          <div
            ref={scrubBarRef}
            onMouseDown={handleScrubMouseDown}
            onMouseMove={handleScrubHover}
            onMouseLeave={handleScrubLeave}
            className="group/scrub relative w-full pt-1 pb-1 cursor-pointer select-none"
            title="Click or drag to scrub · Use ← / → arrow keys for frame-by-frame navigation"
          >
            {/* Tooltip Timestamp on Hover */}
            {hoverTime !== null && (
              <div
                className="absolute -top-7 -translate-x-1/2 pointer-events-none px-2 py-0.5 rounded-md bg-black/90 border border-purple-500/40 text-white mono text-[10px] font-semibold whitespace-nowrap shadow-lg flex items-center gap-1 z-30"
                style={{ left: `${hoverPercent * 100}%` }}
              >
                <span className="text-purple-300">{hoverTime.toFixed(2)}s</span>
                <span className="text-white/40">·</span>
                <span className="text-emerald-400">F{Math.round(hoverTime * 30)}</span>
              </div>
            )}

            {/* Keyframe Markers on Scrub Bar */}
            {keyframes.map((kf) => {
              const markerPercent = (videoDuration > 0 ? (kf.timestamp / videoDuration) : (kf.timestamp / 5)) * 100;
              return (
                <div
                  key={kf.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    seekToKeyframe(kf.timestamp);
                  }}
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-20 w-2 h-3.5 bg-cyan-400 hover:bg-cyan-300 rounded-sm shadow-md cursor-pointer group/marker"
                  style={{ left: `${Math.min(100, Math.max(0, markerPercent))}%` }}
                  title={`Keyframe @ ${kf.timestamp}s: ${kf.promptOverride}`}
                >
                  <div className="hidden group-hover/marker:block absolute bottom-4 -left-12 px-2 py-0.5 bg-black/95 border border-cyan-400/50 text-[9px] mono text-cyan-200 rounded whitespace-nowrap z-40 pointer-events-none">
                    {kf.timestamp}s: {kf.cameraMove}
                  </div>
                </div>
              );
            })}

            {/* Track Background */}
            <div className="w-full h-1.5 group-hover/scrub:h-2 bg-white/20 rounded-full overflow-hidden transition-all duration-150 relative">
              {/* Progress Fill */}
              <div
                className="h-full bg-gradient-to-r from-purple-500 via-indigo-500 to-purple-400 transition-all duration-75 relative"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Thumb Handle */}
            <div
              className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-white border-2 border-purple-500 shadow-lg shadow-purple-500/50 pointer-events-none transition-transform ${
                isScrubbing ? 'scale-125' : 'group-hover/scrub:scale-110 opacity-90'
              }`}
              style={{ left: `${progressPercent}%` }}
            />
          </div>

          {/* ROW 1: PLAYBACK, AUDIO, LOOP & FULLSCREEN (AUTO-FIT TO 9:16, 16:9, 1:1) */}
          <div className="flex items-center justify-between gap-1 sm:gap-2 text-xs text-white">
            {/* Left: Play/Pause & Timestamps */}
            <div className="flex items-center gap-1 sm:gap-1.5 min-w-0 shrink-0">
              <button
                type="button"
                onClick={togglePlay}
                className="p-1 rounded-md hover:bg-white/10 text-white transition-colors shrink-0 cursor-pointer"
                title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
              </button>

              {/* Timestamp Display */}
              <div className="mono text-[10px] sm:text-[11px] text-white/80 shrink-0 select-none">
                <span className="text-white font-medium">{currentTime.toFixed(1)}s</span>
                <span className="text-white/40 mx-0.5">/</span>
                <span className="text-white/60">{(videoDuration || 5).toFixed(1)}s</span>
              </div>
            </div>

            {/* Right: Audio Volume Slider & Loop Video Checkbox */}
            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
              {/* Bottom Mute Button & Horizontal Volume Range Slider */}
              <div className="flex items-center gap-1 bg-white/[0.08] border border-white/10 rounded-lg px-1.5 py-0.5 shrink-0">
                <button
                  type="button"
                  onClick={toggleMute}
                  className="p-0.5 rounded hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer shrink-0"
                  title={isMuted ? 'Unmute Audio (M)' : `Mute Audio (M) • ${Math.round((isMuted ? 0 : volume) * 100)}%`}
                  aria-label={isMuted ? 'Unmute Audio' : 'Mute Audio'}
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-3.5 h-3.5 text-rose-400" />
                  ) : volume < 0.5 ? (
                    <Volume1 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                  )}
                </button>

                {/* Horizontal Volume Slider - responsive width */}
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                  className="w-10 sm:w-16 md:w-20 h-1 bg-white/20 hover:bg-white/30 rounded-lg appearance-none cursor-pointer accent-purple-400 focus:outline-none"
                  aria-label="Volume slider"
                  title={`Volume: ${Math.round((isMuted ? 0 : volume) * 100)}%`}
                />
                <span className="text-[9px] mono text-white/70 min-w-[22px] text-right font-medium select-none">
                  {Math.round((isMuted ? 0 : volume) * 100)}%
                </span>
              </div>

              {/* Loop Video Checkbox (Auto-Fit compact label) */}
              <label
                className={`flex items-center gap-1 px-1.5 py-0.5 rounded-lg border text-[10px] mono cursor-pointer transition-colors select-none shrink-0 ${
                  isLooping
                    ? 'bg-purple-950/50 border-purple-500/50 text-purple-200'
                    : 'bg-white/[0.08] border-white/10 text-white/60 hover:text-white'
                }`}
                title={isLooping ? 'Loop Video: Enabled (Continuous playback · L key)' : 'Loop Video: Disabled (L key to enable)'}
              >
                <input
                  type="checkbox"
                  checked={isLooping}
                  onChange={(e) => toggleLoop(e.target.checked)}
                  className="w-3 h-3 rounded text-purple-600 bg-[#0f0f17] border-[#3f3f46] accent-purple-600 cursor-pointer"
                  aria-label="Loop Video Checkbox"
                />
                <Repeat className={`w-3 h-3 ${isLooping ? 'text-purple-400' : 'text-white/40'}`} />
                <span className="font-medium hidden xs:inline sm:inline">Loop</span>
              </label>

              {/* Fullscreen Button */}
              <button
                type="button"
                onClick={toggleFullscreen}
                className="p-1 rounded-md hover:bg-white/10 text-white/70 hover:text-white transition-colors shrink-0 cursor-pointer"
                title="Fullscreen"
                aria-label="Fullscreen"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* ROW 2: SPEED SELECTION MENU, COLOR GRADING, REMIX, FRAME EXTRACTION & DOWNLOAD (AUTO-FIT) */}
          <div className="flex items-center justify-between gap-1 sm:gap-1.5 text-xs text-white pt-1 border-t border-white/[0.06]">
            {/* Left: Playback Speed Selection Menu & Color Grading Dropdown */}
            <div className="flex items-center gap-1 sm:gap-1.5 min-w-0 shrink-0">
              {/* PLAYBACK SPEED SELECTION MENU DROPDOWN */}
              <div
                className="relative flex items-center bg-white/[0.08] hover:bg-white/[0.14] border border-white/15 hover:border-purple-500/40 rounded-lg px-1.5 sm:px-2 py-0.5 mono text-[10px] transition-colors cursor-pointer group shrink-0"
                title="Playback Speed: Select 0.5x, 1x, 1.5x, or 2x"
              >
                <Gauge className="w-3 h-3 text-purple-400 mr-1 shrink-0" />
                <span className="text-white font-bold text-[10px] select-none">
                  {playbackSpeed}x
                </span>
                <ChevronDown className="w-2.5 h-2.5 text-white/50 ml-0.5 group-hover:text-white transition-colors shrink-0" />
                <select
                  id="playback-speed-select"
                  name="playbackSpeed"
                  aria-label="Playback Speed"
                  title="Playback Speed"
                  value={playbackSpeed}
                  onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full text-black bg-[#181824]"
                >
                  <option value="0.5" className="bg-[#181824] text-white">0.5x</option>
                  <option value="1" className="bg-[#181824] text-white">1x</option>
                  <option value="1.5" className="bg-[#181824] text-white">1.5x</option>
                  <option value="2" className="bg-[#181824] text-white">2x</option>
                </select>
              </div>

              {/* Quick Playback Speed Buttons (visible in wide 16:9 mode) */}
              <div
                className="hidden xl:flex items-center gap-0.5 bg-white/[0.08] border border-white/15 rounded-lg p-0.5 mono text-[9px]"
                aria-label="Playback Speed options"
              >
                {([0.5, 1, 1.5, 2] as const).map((spd) => (
                  <button
                    key={spd}
                    type="button"
                    onClick={() => handleSpeedChange(spd)}
                    className={`px-1 py-0.5 rounded font-semibold transition-all ${
                      playbackSpeed === spd
                        ? 'bg-purple-600 text-white'
                        : 'text-white/60 hover:text-white hover:bg-white/10'
                    }`}
                    title={`Set playback speed to ${spd}x`}
                    aria-label={`${spd}x playback speed`}
                  >
                    {spd}x
                  </button>
                ))}
              </div>

              {/* COLOR GRADING DROPDOWN LIST */}
              <div
                className="relative flex items-center bg-white/[0.08] hover:bg-white/[0.14] border border-white/15 hover:border-amber-500/40 rounded-lg px-1.5 sm:px-2 py-0.5 mono text-[10px] transition-colors cursor-pointer group shrink-0"
                title="Color Grading filter preset"
              >
                <Palette className="w-3 h-3 text-amber-400 mr-1 shrink-0" />
                <span className="text-white/90 max-w-[45px] sm:max-w-[65px] truncate font-medium select-none">
                  {colorGradingState}
                </span>
                <ChevronDown className="w-2.5 h-2.5 text-white/50 ml-0.5 group-hover:text-white transition-colors shrink-0" />
                <select
                  value={colorGradingState}
                  onChange={(e) => handleColorGradingChange(e.target.value as ColorGradingPreset)}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full text-black bg-[#181824]"
                  title="Color Grading filter preset"
                  aria-label="Color Grading preset"
                >
                  {COLOR_GRADING_PRESETS.map((p) => (
                    <option key={p.id} value={p.id} className="bg-[#181824] text-white">
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Features & Advanced Settings Dropdown Menu */}
              <div
                className="relative flex items-center bg-white/[0.08] hover:bg-white/[0.14] border border-white/15 rounded-lg px-1.5 py-0.5 mono text-[10px] transition-colors cursor-pointer group shrink-0"
                title="Features & Settings Menu"
              >
                <Sliders className="w-3 h-3 text-cyan-400 mr-0.5 shrink-0" />
                <ChevronDown className="w-2.5 h-2.5 text-white/50 group-hover:text-white transition-colors shrink-0" />
                <select
                  onChange={(e) => {
                    const action = e.target.value;
                    if (action === 'remix') handleRemixClick();
                    else if (action === 'extract') handleExtractFrame();
                    else if (action === 'download') handleDownload();
                    else if (action === 'keyframe') setShowKeyframeEditor(!showKeyframeEditor);
                    else if (action === 'smoothing') setIsFrameSmoothing(!isFrameSmoothing);
                    else if (action === 'upscale') handleToggleUpscale();
                    else if (action === 'diagnostic') setShowDiagnosticModal(true);
                    e.target.value = '';
                  }}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full text-black bg-[#181824]"
                  title="Player Features Menu"
                  aria-label="Player Features Menu"
                  value=""
                >
                  <option value="" disabled className="bg-[#181824] text-white">Features Menu...</option>
                  <option value="remix" className="bg-[#181824] text-white">🔀 Remix to Studio</option>
                  <option value="extract" className="bg-[#181824] text-white">📷 Extract Current Frame</option>
                  <option value="download" className="bg-[#181824] text-white">⬇ Download MP4 Video</option>
                  <option value="keyframe" className="bg-[#181824] text-white">⏱ Toggle Keyframe Motion</option>
                  <option value="smoothing" className="bg-[#181824] text-white">✨ 60fps Frame Smoothing</option>
                  <option value="upscale" className="bg-[#181824] text-white">🔍 4K 2x AI Upscale</option>
                  <option value="diagnostic" className="bg-[#181824] text-white">📊 Diagnostic Tracking Report</option>
                </select>
              </div>
            </div>

            {/* Right: Quick Actions (Remix, Extract Frame, Download) */}
            <div className="flex items-center gap-1 shrink-0">
              {/* Quick Remix Button */}
              <button
                type="button"
                onClick={handleRemixClick}
                className="px-1.5 sm:px-2 py-0.5 rounded-lg bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 hover:text-white border border-purple-500/40 transition-all flex items-center gap-1 mono text-[10px] font-semibold cursor-pointer shadow-xs active:scale-95 shrink-0"
                title="Remix: Clone prompt & settings into Studio"
              >
                <Shuffle className="w-3 h-3 text-amber-300 shrink-0" />
                <span className="hidden xs:inline">Remix</span>
              </button>

              {/* Extract Frame (PNG) Button */}
              <button
                type="button"
                onClick={handleExtractFrame}
                disabled={isExtractingFrame}
                className="p-1 rounded-md bg-white/[0.08] hover:bg-white/15 text-white/80 hover:text-purple-300 transition-colors shrink-0 cursor-pointer"
                title="Extract Current Frame (PNG)"
                aria-label="Extract Current Frame"
              >
                {frameExtractedSuccess ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Camera className="w-3.5 h-3.5" />
                )}
              </button>

              {/* Download MP4 Button */}
              <button
                type="button"
                onClick={handleDownload}
                className="p-1 rounded-md bg-white/[0.08] hover:bg-white/15 text-white/80 hover:text-white transition-colors shrink-0 cursor-pointer"
                title="Download MP4"
                aria-label="Download MP4"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Player Meta Info Pill */}
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] mono text-white/40 px-1 w-full max-w-xl">
        <span className="flex items-center gap-1.5 text-white/50">
          <Sparkles className="w-3 h-3 text-purple-400" />
          <span>Studio Master Playback</span>
        </span>
        <span className="flex items-center gap-1.5 text-purple-300/80">
          {is2xUpscaled && (
            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-[10px] border border-cyan-500/30">
              <Sparkles className="w-2.5 h-2.5" />
              4K AI Master
            </span>
          )}
          {isFrameSmoothing && (
            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[10px] border border-purple-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse"></span>
              Interpolated (60fps)
            </span>
          )}
          <span>Speed:</span>
          <span className="text-white font-semibold">{playbackSpeed}x</span>
        </span>
      </div>

      {/* KEYFRAME EDITOR PANEL: Timestamp-based prompt overrides for advanced motion control */}
      {showKeyframeEditor && (
        <div className="mt-3 max-w-xl w-full bg-[#12121a] border border-purple-500/40 rounded-2xl p-4 shadow-xl text-xs">
          <div className="flex items-center justify-between pb-3 border-b border-[#27272a] mb-3">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <span className="font-bold text-white text-sm">Keyframe Motion & Prompt Overrides</span>
              <span className="mono text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded border border-purple-500/30">
                {keyframes.length} Active Keyframes
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowKeyframeEditor(false)}
              className="text-white/40 hover:text-white mono text-[10px]"
            >
              ✕ Close
            </button>
          </div>

          <p className="text-white/60 text-[11px] mb-3">
            Set timestamp-based prompt overrides and camera directions to execute complex multi-stage camera movements and visual transitions across the timeline.
          </p>

          {/* Add Keyframe at Current Time */}
          <div className="bg-[#181824] border border-[#272738] rounded-xl p-3 mb-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="mono font-bold text-cyan-300 flex items-center gap-1">
                <span>Timestamp:</span>
                <span className="text-white bg-black/60 px-2 py-0.5 rounded border border-white/10">
                  {currentTime.toFixed(2)}s (F{currentFrame})
                </span>
              </div>
              <span className="text-[10px] text-white/50 mono">Current Playhead Position</span>
            </div>

            <input
              type="text"
              value={newKeyframePrompt}
              onChange={(e) => setNewKeyframePrompt(e.target.value)}
              placeholder="e.g. Rapid camera spin, lighting shifts to dramatic violet neon, debris burst..."
              className="w-full bg-[#0d0d14] border border-[#27272a] focus:border-purple-500 rounded-lg px-3 py-2 text-xs text-white placeholder-white/30 focus:outline-hidden"
            />

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] mono text-white/50 block mb-1">Camera Motion:</label>
                <select
                  value={newKeyframeCamera}
                  onChange={(e: any) => setNewKeyframeCamera(e.target.value)}
                  className="w-full bg-[#0d0d14] border border-[#27272a] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-hidden"
                >
                  <option value="pan-left">Pan Left (Slow Orbit)</option>
                  <option value="pan-right">Pan Right (Slow Orbit)</option>
                  <option value="zoom-in">Zoom In (Push In)</option>
                  <option value="orbit">Full 360 Orbit</option>
                  <option value="fpv-roll">FPV Drone Roll</option>
                  <option value="static">Static Lock-off</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] mono text-white/50 block mb-1">Motion Strength:</label>
                <select
                  value={newKeyframeMotion}
                  onChange={(e: any) => setNewKeyframeMotion(e.target.value)}
                  className="w-full bg-[#0d0d14] border border-[#27272a] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-hidden"
                >
                  <option value="subtle">Subtle (Smooth)</option>
                  <option value="dynamic">Dynamic (Cinematic)</option>
                  <option value="explosive">Explosive (High-Speed)</option>
                </select>
              </div>
            </div>

            <button
              type="button"
              onClick={addKeyframeAtCurrentTime}
              className="w-full py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold rounded-lg text-xs flex items-center justify-center gap-1.5 shadow-md shadow-purple-900/40 active:scale-[0.99] transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Set Keyframe Prompt Override at {currentTime.toFixed(1)}s</span>
            </button>
          </div>

          {/* Keyframe List */}
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {keyframes.length === 0 ? (
              <div className="text-center py-4 text-white/40 text-xs italic">
                No keyframe overrides configured yet.
              </div>
            ) : (
              keyframes.map((kf) => (
                <div
                  key={kf.id}
                  className={`p-2.5 rounded-xl border text-xs flex items-start justify-between gap-3 transition-colors ${
                    activeKeyframeNotice?.id === kf.id
                      ? 'bg-purple-950/40 border-purple-500 text-white'
                      : 'bg-[#181822] border-[#272733] text-white/80 hover:border-white/20'
                  }`}
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="mono font-bold text-cyan-300 bg-cyan-950/60 border border-cyan-500/30 px-1.5 py-0.5 rounded text-[10px]">
                        {kf.timestamp.toFixed(1)}s
                      </span>
                      <span className="mono text-[10px] text-purple-300 font-semibold uppercase">
                        {kf.cameraMove}
                      </span>
                      <span className="text-[10px] text-white/40 mono">
                        • {kf.motionStrength}
                      </span>
                      {activeKeyframeNotice?.id === kf.id && (
                        <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded border border-emerald-500/30">
                          Active Now
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-white/90 italic truncate">
                      "{kf.promptOverride}"
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => seekToKeyframe(kf.timestamp)}
                      className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-white text-[10px] mono transition-colors"
                      title="Seek playhead to this keyframe"
                    >
                      Seek
                    </button>
                    <button
                      type="button"
                      onClick={() => removeKeyframe(kf.id)}
                      className="p-1 rounded hover:bg-rose-500/20 text-white/40 hover:text-rose-400 transition-colors"
                      title="Remove Keyframe"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* DISPLAY BENEATH GENERATED VIDEO - MODEL NAME, DURATION, AND GENERATION TIMESTAMP */}
      <div className="mt-3.5 max-w-xl w-full bg-[#14141c] border border-purple-500/30 rounded-2xl p-3 sm:p-3.5 flex flex-wrap items-center justify-between gap-2.5 text-xs shadow-lg">
        <div className="flex items-center gap-2 sm:gap-2.5">
          <div className="flex items-center gap-1.5 bg-purple-500/15 border border-purple-500/30 px-2.5 py-1 rounded-xl text-purple-300 font-semibold mono">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>{modelName}</span>
          </div>

          <div className="flex items-center gap-1.5 bg-white/[0.04] border border-white/[0.08] px-2.5 py-1 rounded-xl text-white/80 mono">
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
            <span>Duration: {duration}</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-white/50 mono text-[11px] bg-white/[0.02] border border-white/[0.05] px-2.5 py-1 rounded-xl">
          <Calendar className="w-3.5 h-3.5 text-purple-400" />
          <span>{formattedTimestamp}</span>
        </div>
      </div>

      {/* Quality Lock Verification Box */}
      <div className="mt-2.5 max-w-xl w-full bg-[#18181b]/70 border border-[#27272a] rounded-xl p-3 text-xs flex items-center justify-between gap-3 text-white/70">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="font-semibold text-white text-[12px] flex items-center gap-1.5">
              <span>CSS Lossless Crop Engine</span>
              <span className="text-[10px] text-emerald-400 font-mono">
                {is2xUpscaled ? '200% 4K UHD Master' : '100% Fidelity'}
              </span>
            </div>
            <p className="text-[11px] text-white/50">
              {is2xUpscaled
                ? 'Upscaled to 2160x3840 4K Ultra-HD via external neural super-resolution API; cinema grain preserved.'
                : 'Generated once at 1080x1920 master resolution; cropped via CSS without lossy re-encoding.'}
            </p>
          </div>
        </div>
        <div className="shrink-0 flex items-center gap-2">
          <button
            type="button"
            onClick={handleExtractFrame}
            disabled={isExtractingFrame}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-white/80 border border-white/[0.08] font-medium text-xs transition-colors"
            title="Grab and save current frame as PNG"
          >
            {frameExtractedSuccess ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">{is2xUpscaled ? '4K Frame Saved' : 'Frame Saved'}</span>
              </>
            ) : (
              <>
                <Camera className="w-3.5 h-3.5 text-purple-400" />
                <span>Extract Frame {is2xUpscaled ? '(4K)' : '(PNG)'}</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={handleDownload}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium text-xs transition-colors border ${
              isFreeUser
                ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/40 ring-1 ring-amber-500/20'
                : 'bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border-purple-500/30'
            }`}
          >
            {isFreeUser ? <Lock className="w-3 h-3 text-amber-400" /> : <Download className="w-3 h-3" />}
            <span>{isFreeUser ? '🔒 Unlock HD Download (₹99)' : is2xUpscaled ? 'Save 4K MP4' : 'Save MP4'}</span>
          </button>
        </div>

        {/* Social Share Buttons Bar (X/Twitter, LinkedIn, WhatsApp, Copy Link) */}
        <div className="mt-2.5 pt-2.5 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-2">
          <span className="text-[11px] mono text-white/60 flex items-center gap-1.5 font-semibold">
            <Share2 className="w-3.5 h-3.5 text-purple-400" />
            <span>Share Creation:</span>
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleSocialShare('twitter')}
              className="px-2.5 py-1 rounded-lg bg-black/50 hover:bg-black/75 border border-white/10 text-white text-[11px] mono font-medium flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
              title="Share on X (Twitter)"
            >
              <span className="font-bold text-cyan-400">𝕏</span>
              <span>X</span>
            </button>
            <button
              type="button"
              onClick={() => handleSocialShare('linkedin')}
              className="px-2.5 py-1 rounded-lg bg-blue-950/50 hover:bg-blue-900/50 border border-blue-500/30 text-blue-300 text-[11px] mono font-medium flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
              title="Share on LinkedIn"
            >
              <span>💼</span>
              <span>LinkedIn</span>
            </button>
            <button
              type="button"
              onClick={() => handleSocialShare('instagram')}
              className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-amber-500/20 via-pink-500/20 to-purple-500/20 hover:from-amber-500/30 hover:via-pink-500/30 hover:to-purple-500/30 border border-pink-500/35 text-pink-200 text-[11px] mono font-medium flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
              title="Share on Instagram (Copies caption & link, opens Instagram)"
            >
              <Instagram className="w-3.5 h-3.5 text-pink-400" />
              <span>Instagram</span>
            </button>
            <button
              type="button"
              onClick={() => handleSocialShare('whatsapp')}
              className="px-2.5 py-1 rounded-lg bg-emerald-950/50 hover:bg-emerald-900/50 border border-emerald-500/30 text-emerald-300 text-[11px] mono font-medium flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
              title="Share on WhatsApp"
            >
              <span>💬</span>
              <span>WhatsApp</span>
            </button>
            <button
              type="button"
              onClick={() => handleSocialShare('copy')}
              className="px-2.5 py-1 rounded-lg bg-purple-950/50 hover:bg-purple-900/50 border border-purple-500/30 text-purple-300 text-[11px] mono font-medium flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
              title="Copy Share Link"
            >
              {shareCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-purple-400" />}
              <span>{shareCopied ? 'Copied!' : 'Copy Link'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* AI GENERATION MOTION INTENSITY & SCENE TRANSITION CONTROLS */}
      <div className="mt-3 w-full max-w-xl bg-[#13131c] border border-[#272738] rounded-2xl p-3 sm:p-3.5 shadow-lg space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gauge className="w-4 h-4 text-purple-400" />
            <span className="font-bold text-white text-xs">Generation Motion & Transition Style</span>
            <span className="text-[10px] mono bg-purple-500/15 text-purple-300 px-2 py-0.5 rounded border border-purple-500/30">
              Camera AI Controls
            </span>
          </div>
          <div className="text-[10px] mono text-white/40 hidden sm:inline">
            Directs camera velocity & frame transitions
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-stretch">
          {/* Motion Intensity Slider (1-10) */}
          <div className="sm:col-span-5 bg-[#181824] border border-[#272738] rounded-xl p-2.5 space-y-1.5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold text-white/80 mono flex items-center gap-1.5">
                <Sliders className="w-3 h-3 text-purple-400" />
                <span>Motion Intensity:</span>
                <span className="text-purple-300 font-bold bg-purple-950/60 px-1.5 py-0.2 rounded border border-purple-500/30">
                  {motionIntensityState}/10
                </span>
              </label>
              <span className="text-[10px] mono text-purple-300/80 font-medium truncate max-w-[140px]">
                {getMotionDescription(motionIntensityState)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] mono text-white/40">1</span>
              <input
                type="range"
                min="1"
                max="10"
                step="1"
                value={motionIntensityState}
                onChange={(e) => handleMotionIntensityChange(Number(e.target.value))}
                className="w-full h-1.5 bg-[#272738] rounded-lg appearance-none cursor-pointer accent-purple-500 hover:accent-purple-400"
                title="Motion Intensity (1-10): Sets camera motion velocity and scene dynamism for generation API calls"
              />
              <span className="text-[10px] mono text-white/40">10</span>
            </div>

            {/* Quick preset chips */}
            <div className="flex items-center justify-between pt-0.5 text-[9px] mono text-white/50">
              <button
                type="button"
                onClick={() => handleMotionIntensityChange(2)}
                className={`hover:text-purple-300 px-1.5 py-0.5 rounded transition-colors cursor-pointer ${
                  motionIntensityState === 2 ? 'bg-purple-600/30 text-purple-300 font-semibold' : 'bg-white/5'
                }`}
              >
                Subtle (2)
              </button>
              <button
                type="button"
                onClick={() => handleMotionIntensityChange(5)}
                className={`hover:text-purple-300 px-1.5 py-0.5 rounded transition-colors cursor-pointer ${
                  motionIntensityState === 5 ? 'bg-purple-600/30 text-purple-300 font-semibold' : 'bg-white/5'
                }`}
              >
                Cinematic (5)
              </button>
              <button
                type="button"
                onClick={() => handleMotionIntensityChange(8)}
                className={`hover:text-purple-300 px-1.5 py-0.5 rounded transition-colors cursor-pointer ${
                  motionIntensityState === 8 ? 'bg-purple-600/30 text-purple-300 font-semibold' : 'bg-white/5'
                }`}
              >
                Dynamic (8)
              </button>
              <button
                type="button"
                onClick={() => handleMotionIntensityChange(10)}
                className={`hover:text-purple-300 px-1.5 py-0.5 rounded transition-colors cursor-pointer ${
                  motionIntensityState === 10 ? 'bg-purple-600/30 text-purple-300 font-semibold' : 'bg-white/5'
                }`}
              >
                Turbo (10)
              </button>
            </div>
          </div>

          {/* Scene Transition Selector Dropdown ('Cut', 'Crossfade', 'Wipe') */}
          <div className="sm:col-span-3 bg-[#181824] border border-[#272738] rounded-xl p-2.5 space-y-1.5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold text-white/80 mono flex items-center gap-1.5">
                <Layers className="w-3 h-3 text-cyan-400" />
                <span>Scene Transition:</span>
              </label>
              <span className="text-[10px] mono text-cyan-300 font-bold">
                {sceneTransitionState}
              </span>
            </div>

            <select
              value={sceneTransitionState}
              onChange={(e) => handleSceneTransitionChange(e.target.value as SceneTransitionType)}
              className="w-full bg-[#0d0d14] border border-[#272738] focus:border-cyan-500/60 rounded-lg px-2.5 py-1.5 text-xs text-white mono focus:outline-hidden cursor-pointer"
              title="Scene Transition: Select between Cut, Crossfade, or Wipe to influence generation style of initial/final frames"
            >
              <option value="Cut">Cut (Direct frame cut)</option>
              <option value="Crossfade">Crossfade (Dissolve & blend)</option>
              <option value="Wipe">Wipe (Directional sweep)</option>
            </select>

            <div className="text-[9px] mono text-white/40 truncate">
              {sceneTransitionState === 'Cut' && 'Crisp hard frame boundary cut'}
              {sceneTransitionState === 'Crossfade' && 'Blends initial & final frame overlap'}
              {sceneTransitionState === 'Wipe' && 'Linear directional wipe sweep'}
            </div>
          </div>

          {/* Color Grading Dropdown ('Film Noir', 'Vibrant', 'Vintage', 'Cyberpunk', etc.) */}
          <div className="sm:col-span-4 bg-[#181824] border border-[#272738] rounded-xl p-2.5 space-y-1.5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold text-white/80 mono flex items-center gap-1.5">
                <Palette className="w-3 h-3 text-amber-400" />
                <span>Color Grading:</span>
              </label>
              <span className="text-[10px] mono text-amber-300 font-bold">
                {colorGradingState}
              </span>
            </div>

            <select
              value={colorGradingState}
              onChange={(e) => handleColorGradingChange(e.target.value as ColorGradingPreset)}
              className="w-full bg-[#0d0d14] border border-[#272738] focus:border-amber-500/60 rounded-lg px-2.5 py-1.5 text-xs text-white mono focus:outline-hidden cursor-pointer"
              title="Color Grading: Select CSS filter presets (Film Noir, Vibrant, Vintage, Cyberpunk) for instant cinematic styling"
            >
              {COLOR_GRADING_PRESETS.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.label}
                </option>
              ))}
            </select>

            <div className="text-[9px] mono text-white/40 truncate">
              {COLOR_GRADING_PRESETS.find((p) => p.id === colorGradingState)?.description}
            </div>
          </div>
        </div>
      </div>

      {prompt && (
        <div className="mt-2.5 max-w-xl w-full text-left text-xs text-white/50 bg-[#121217] border border-[#27272a]/60 rounded-xl p-3">
          <div className="mono text-[10px] uppercase text-white/40 mb-1">Prompt Used:</div>
          <p className="text-white/80 italic line-clamp-2">"{prompt}"</p>
        </div>
      )}

      {/* Watermark Free User Notice & Payment Models Callout */}
      {isFreeUser && (
        <div className="mt-3 max-w-xl w-full p-3.5 rounded-2xl bg-gradient-to-r from-purple-950/40 via-[#18181b] to-indigo-950/40 border border-purple-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-lg">
          <div className="flex items-start sm:items-center gap-2.5 text-purple-200">
            <div className="p-1.5 rounded-xl bg-purple-500/20 text-purple-300 shrink-0 mt-0.5 sm:mt-0">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-white flex items-center gap-1.5">
                <span>Watermark Active (Free User)</span>
              </div>
              <p className="text-purple-200/90 text-[11px] mt-0.5">
                For remove watermark or watermark free video use our payment models (show our plans)
              </p>
            </div>
          </div>
          {onOpenPlans && (
            <button
              type="button"
              onClick={onOpenPlans}
              className="self-end sm:self-auto px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold mono text-xs shadow-md shadow-purple-900/40 active:scale-95 transition-all flex items-center gap-1.5 shrink-0"
            >
              <span>Show Our Plans</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* WATERMARK CUSTOMIZATION MODAL */}
      {showWatermarkSettings && (
        <div
          onClick={() => setShowWatermarkSettings(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#18181b] border border-purple-500/40 rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto p-5 sm:p-6 shadow-2xl relative"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#27272a] mb-4">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-purple-400" />
                <h3 className="font-bold text-white text-sm">Watermark Settings & Asset Protection</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowWatermarkSettings(false)}
                className="p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                title="Close (Esc)"
                aria-label="Close watermark settings"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>

            {/* Notice for Free Users */}
            {isFreeUser && (
              <div className="mb-4 p-3 rounded-2xl bg-purple-950/40 border border-purple-500/30 text-xs">
                <div className="font-semibold text-purple-200 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-purple-400" />
                  <span>Free Plan Protection</span>
                </div>
                <p className="text-white/80 text-[11px] mt-1 leading-relaxed">
                  For remove watermark or watermark free video use our payment models (show our plans). You can customize position, text, and opacity below while on free tier.
                </p>
                {onOpenPlans && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowWatermarkSettings(false);
                      onOpenPlans();
                    }}
                    className="mt-2 text-xs font-bold text-purple-300 hover:text-purple-200 underline flex items-center gap-1 mono"
                  >
                    <span>Show Our Payment Plans</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            )}

            <div className="space-y-4 text-xs">
              {/* Watermark Text Input */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-white/70 mono uppercase flex items-center gap-1">
                  <Type className="w-3 h-3 text-purple-400" />
                  <span>Watermark Text</span>
                </label>
                <input
                  type="text"
                  value={watermarkText}
                  onChange={(e) => setWatermarkText(e.target.value)}
                  placeholder="NexVerze Studio"
                  maxLength={40}
                  className="w-full bg-[#0f0f17] border border-[#27272a] focus:border-purple-500 rounded-xl px-3 py-2 text-white text-xs outline-none"
                />
                <div className="text-[10px] text-white/40 mono flex justify-between">
                  <span>Default: NexVerze Studio</span>
                  <span>{watermarkText.length}/40 chars</span>
                </div>
              </div>

              {/* Position Selector */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-white/70 mono uppercase">
                  Position on Video
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {(
                    [
                      { id: 'bottom-right', label: 'Bottom Right' },
                      { id: 'bottom-left', label: 'Bottom Left' },
                      { id: 'top-right', label: 'Top Right' },
                      { id: 'top-left', label: 'Top Left' },
                      { id: 'center', label: 'Center (Draft)' },
                    ] as const
                  ).map((pos) => (
                    <button
                      key={pos.id}
                      type="button"
                      onClick={() => setWatermarkPosition(pos.id)}
                      className={`px-2 py-1.5 rounded-xl border text-[11px] mono transition-all ${
                        watermarkPosition === pos.id
                          ? 'bg-purple-600/30 border-purple-500 text-purple-200 font-bold'
                          : 'bg-[#0f0f17] border-[#27272a] text-white/60 hover:text-white'
                      }`}
                    >
                      {pos.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Opacity Selector */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] mono">
                  <span className="font-semibold text-white/70 uppercase">Semi-Transparency (Opacity)</span>
                  <span className="text-purple-300 font-bold">{Math.round(watermarkOpacity * 100)}%</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {[0.35, 0.5, 0.65, 0.85].map((op) => (
                    <button
                      key={op}
                      type="button"
                      onClick={() => setWatermarkOpacity(op)}
                      className={`flex-1 py-1.5 rounded-xl border text-[11px] mono transition-all ${
                        watermarkOpacity === op
                          ? 'bg-purple-600 text-white border-purple-400 font-bold'
                          : 'bg-[#0f0f17] border-[#27272a] text-white/60 hover:text-white'
                      }`}
                    >
                      {Math.round(op * 100)}%
                    </button>
                  ))}
                </div>
              </div>

              {/* Watermark Scale */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-white/70 mono uppercase">
                  Badge Size
                </label>
                <div className="flex items-center gap-1.5">
                  {(['sm', 'md', 'lg'] as const).map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => setWatermarkScale(sz)}
                      className={`flex-1 py-1.5 rounded-xl border text-[11px] mono uppercase transition-all ${
                        watermarkScale === sz
                          ? 'bg-purple-600 text-white border-purple-400 font-bold'
                          : 'bg-[#0f0f17] border-[#27272a] text-white/60 hover:text-white'
                      }`}
                    >
                      {sz === 'sm' ? 'Small' : sz === 'md' ? 'Medium' : 'Large'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-5 pt-3 border-t border-[#27272a] flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  setWatermarkText('NexVerze Studio');
                  setWatermarkPosition('bottom-right');
                  setWatermarkOpacity(0.65);
                  setWatermarkScale('sm');
                }}
                className="text-white/40 hover:text-white text-xs mono underline"
              >
                Reset Defaults
              </button>
              <button
                type="button"
                onClick={() => setShowWatermarkSettings(false)}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WATERMARK REMOVAL PROMPT FOR FREE USERS */}
      {watermarkUpgradeAlert && (
        <div
          onClick={() => setWatermarkUpgradeAlert(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#18181b] border border-purple-500/50 rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto p-5 sm:p-6 shadow-2xl relative text-center"
          >
            {/* Top-right X close button */}
            <button
              type="button"
              onClick={() => setWatermarkUpgradeAlert(false)}
              className="absolute top-4 right-4 p-1.5 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              title="Close (Esc)"
              aria-label="Close modal"
            >
              <X className="w-4 h-4 text-white" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-purple-600/20 text-purple-400 flex items-center justify-center mx-auto mb-3.5 border border-purple-500/30">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white tracking-tight mb-2">
              Watermark Protected on Free Tier
            </h3>
            <div className="p-3.5 rounded-2xl bg-purple-950/40 border border-purple-500/30 text-xs text-purple-200 mb-4 leading-relaxed font-medium">
              For remove watermark or watermark free video use our payment models (show our plans)
            </div>
            <p className="text-white/60 text-xs mb-5 leading-relaxed">
              Free user renders are protected with the semi-transparent 'NexVerze Studio' watermark. Upgrading to any starter or pro pack immediately removes all watermarks from video renders and extracted frames.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              {onOpenPlans && (
                <button
                  type="button"
                  onClick={() => {
                    setWatermarkUpgradeAlert(false);
                    onOpenPlans();
                  }}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <span>Show Our Plans</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setWatermarkUpgradeAlert(false)}
                className="py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                Continue with Watermark
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DIAGNOSTIC TRACKING REPORT MODAL */}
      {showDiagnosticModal && (
        <div
          onClick={() => setShowDiagnosticModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#12121c] border border-purple-500/50 rounded-3xl max-w-xl w-full max-h-[85vh] overflow-y-auto p-5 sm:p-6 shadow-2xl relative text-left"
          >
            <button
              type="button"
              onClick={() => setShowDiagnosticModal(false)}
              className="absolute top-4 right-4 p-1.5 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              title="Close (Esc)"
              aria-label="Close modal"
            >
              <X className="w-4 h-4 text-white" />
            </button>

            <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-white/10">
              <div className="p-2 rounded-xl bg-purple-600/20 text-purple-300 border border-purple-500/30">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white tracking-tight">
                  QualityLockPlayer Diagnostic Tracking System
                </h3>
                <p className="text-[11px] mono text-white/50">
                  URL & Network Load Failure Telemetry
                </p>
              </div>
            </div>

            {latestDiagnostic ? (
              <div className="space-y-3.5 text-xs">
                <div className="bg-[#0a0a12] border border-purple-500/30 rounded-2xl p-3.5 space-y-2 mono text-[11px]">
                  <div className="flex justify-between items-center text-purple-300 font-bold pb-2 border-b border-white/10">
                    <span>STATUS: REPORT CAPTURED</span>
                    <span className="text-white/40">{latestDiagnostic.timestamp}</span>
                  </div>
                  <div className="space-y-1 text-white/80">
                    <div><span className="text-white/40">Failed URL:</span> <span className="text-amber-300 break-all">{latestDiagnostic.failedUrl}</span></div>
                    <div><span className="text-white/40">Error Code:</span> <span className="text-rose-400 font-bold">{latestDiagnostic.errorCode ?? 'N/A'}</span></div>
                    <div><span className="text-white/40">Error Message:</span> <span className="text-rose-300">{latestDiagnostic.errorMessage}</span></div>
                    <div><span className="text-white/40">Source Type:</span> <span className="text-cyan-300 uppercase font-semibold">{latestDiagnostic.sourceType}</span></div>
                    <div><span className="text-white/40">Attempt Count:</span> <span className="text-purple-300 font-bold">{latestDiagnostic.attempt} / {latestDiagnostic.maxRetries}</span></div>
                    <div><span className="text-white/40">Network State:</span> {latestDiagnostic.networkState}</div>
                    <div><span className="text-white/40">Ready State:</span> {latestDiagnostic.readyState}</div>
                    <div><span className="text-white/40">Online Status:</span> {latestDiagnostic.online ? '🟢 Connected' : '🔴 Disconnected'}</div>
                    <div><span className="text-white/40">Resolution:</span> {latestDiagnostic.videoDimensions.videoWidth}x{latestDiagnostic.videoDimensions.videoHeight}</div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(JSON.stringify(latestDiagnostic, null, 2));
                      setFrameStepNotice('📋 Diagnostic JSON copied to clipboard!');
                      setTimeout(() => setFrameStepNotice(null), 2500);
                    }}
                    className="flex-1 py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Diagnostic JSON</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDiagnosticModal(false)}
                    className="py-2 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white font-semibold text-xs transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 space-y-2">
                <Shield className="w-8 h-8 text-emerald-400/80 mx-auto" />
                <p className="text-xs font-semibold text-white">No Video Failures Logged</p>
                <p className="text-[11px] text-white/50 max-w-xs mx-auto">
                  The QualityLockPlayer diagnostic tracking system is active. All video loading, backoff retries, and error events are monitored and logged to console in real-time.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

