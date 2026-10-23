import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Play,
  Pause,
  Upload,
  Film,
  Check,
  Flame,
  RotateCcw,
  CheckCircle2,
  Eye,
  EyeOff,
  Share2,
  Tv,
  Smartphone,
  Square,
  Volume2,
  Volume1,
  VolumeX,
  X,
  ExternalLink,
  Move,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Maximize2,
  Sliders,
  Crop,
  Download,
  Camera,
  Layers,
  Repeat,
  Settings,
  Palette,
  Gauge,
  Zap,
  ShieldCheck,
  Clock,
  Copy,
  Plus,
  Trash2,
  RefreshCw,
  Heart,
} from 'lucide-react';
import { doc, setDoc, collection, getDocs, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';

import {
  VideoSample,
  SAMPLE_VIDEOS_9_16,
  SLOTS_16_9,
  SLOTS_1_1,
} from '../lib/videoSamples';
import {
  storeGalleryVideoBlob,
  loadAllGalleryVideoBlobs,
  deleteGalleryVideoBlob,
} from '../lib/galleryStorage';
import {
  QualityLockPlayer,
  ColorGradingPreset,
  SceneTransitionType,
  COLOR_GRADING_PRESETS,
  KeyframePromptOverride,
} from './QualityLockPlayer';
import {
  isCreationFavorited,
  toggleFavoriteCreation,
  subscribeFavorites,
} from '../lib/favoritesStorage';

interface ShowcaseGalleryProps {
  onRemixVideo: (sample: any) => void;
  onOpenStudioWithMode?: (mode: 'text' | 'image') => void;
  currentUserEmail?: string | null;
  isFreeUser?: boolean;
  onOpenPlans?: () => void;
  user?: { id: string; email: string; credits: number } | null;
}

// Robust detector to ensure "Upload & Replace" is ONLY shown to the creator in LIVE PREVIEW
export const checkIsLivePreviewCreator = (userEmail?: string | null): boolean => {
  if (typeof window === 'undefined') return false;

  // 1. Direct creator/owner email match
  if (userEmail && userEmail.toLowerCase() === 'anand4earn@gmail.com') {
    return true;
  }

  // 2. Local storage explicit admin flag
  try {
    const stored = localStorage.getItem('nexverze_is_admin_preview');
    if (stored === 'true') return true;
  } catch {}

  // 3. Dev preview host check ONLY (never match production .run.app or nexverze public domains)
  const host = window.location.hostname || '';
  if (
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host.includes('-dev-') ||
    host.includes('webcontainer') ||
    host.includes('cloudshell')
  ) {
    return true;
  }

  return false;
};

// Generate thumbnail poster from video file in memory so cards show the first frame immediately
const extractThumbnailFromVideo = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    try {
      const url = URL.createObjectURL(file);
      const video = document.createElement('video');
      video.src = url;
      video.muted = true;
      video.playsInline = true;
      video.crossOrigin = 'anonymous';

      const cleanup = () => {
        try {
          URL.revokeObjectURL(url);
        } catch {}
      };

      video.onloadeddata = () => {
        video.currentTime = Math.min(0.2, (video.duration || 1) / 2);
      };

      video.onseeked = () => {
        try {
          const canvas = document.createElement('canvas');
          const maxDim = 720;
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
            const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
            cleanup();
            resolve(dataUrl);
            return;
          }
        } catch (err) {
          console.warn('Thumbnail generation error:', err);
        }
        cleanup();
        resolve('');
      };

      video.onerror = () => {
        cleanup();
        resolve('');
      };

      setTimeout(() => {
        cleanup();
        resolve('');
      }, 3500);
    } catch {
      resolve('');
    }
  });
};

// =========================================================================
// SHOWCASE VIDEO CARD (Equipped with full Home Page Preview Panel features)
// =========================================================================
interface ShowcaseVideoCardProps {
  video: VideoSample & { isCustomReplaced?: boolean; hasVideo?: boolean };
  activeVideoSrc?: string;
  isPlaying: boolean;
  onTogglePlay: () => void;
  showCreatorButtons: boolean;
  onOpenReplaceModal: (video: VideoSample) => void;
  onRevertToOriginal: (videoId: string, title: string) => void;
  onRemixVideo: (config: any) => void;
  onOpenStudioModal: (video: VideoSample) => void;
  onShareVideo: (video: VideoSample) => void;
  setGalleryNotice: (notice: string | null) => void;
  isFreeUser?: boolean;
  onOpenPlans?: () => void;
  currentUserEmail?: string | null;
  COLOR_FILTER_MAP: Record<ColorGradingPreset, string>;
  formatTimecode: (seconds: number) => string;
  getMotionLabel: (val: number) => string;
}

export const ShowcaseVideoCard: React.FC<ShowcaseVideoCardProps> = ({
  video,
  activeVideoSrc,
  isPlaying,
  onTogglePlay,
  showCreatorButtons,
  onOpenReplaceModal,
  onRevertToOriginal,
  onRemixVideo,
  onOpenStudioModal,
  onShareVideo,
  setGalleryNotice,
  isFreeUser,
  onOpenPlans,
  currentUserEmail,
  COLOR_FILTER_MAP,
  formatTimecode,
  getMotionLabel,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const promptBoxRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Playback & Scrubbing state
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(10);
  const [isMuted, setIsMuted] = useState(true);
  const [volume, setVolume] = useState(1);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isLooping, setIsLooping] = useState(true);
  const [hoverTime, setHoverTime] = useState<number | null>(null);

  // Home Page Preview Panel equivalent tools:
  const [colorGrading, setColorGrading] = useState<ColorGradingPreset>('Normal');
  const [is2xUpscaled, setIs2xUpscaled] = useState(false);
  const [isFrameSmoothing, setIsFrameSmoothing] = useState(false);
  const [isWatermarkActive, setIsWatermarkActive] = useState(false);
  const [motionIntensity, setMotionIntensity] = useState<number>(6);
  const [sceneTransition, setSceneTransition] = useState<SceneTransitionType>('Crossfade');

  // Favorites / Like state with heart burst animation:
  const [isLiked, setIsLiked] = useState<boolean>(() => isCreationFavorited(video.id));
  const [isAnimatingHeart, setIsAnimatingHeart] = useState<boolean>(false);
  const [floatingHearts, setFloatingHearts] = useState<{ id: number; x: number; y: number }[]>([]);

  // Synchronize favorite status in real time
  useEffect(() => {
    return subscribeFavorites((items) => {
      setIsLiked(items.some((f) => f.videoId === video.id || f.id === video.id));
    });
  }, [video.id]);

  // Toggle favorite with heart burst animation
  const handleToggleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsAnimatingHeart(true);
    setTimeout(() => setIsAnimatingHeart(false), 700);

    // Spawn floating micro-hearts burst particles
    const particles = [
      { id: Date.now() + 1, x: (Math.random() - 0.5) * 26, y: -22 },
      { id: Date.now() + 2, x: (Math.random() - 0.5) * 40, y: -38 },
      { id: Date.now() + 3, x: (Math.random() - 0.5) * 18, y: -52 },
    ];
    setFloatingHearts(particles);
    setTimeout(() => setFloatingHearts([]), 1100);

    const nextState = await toggleFavoriteCreation(
      {
        id: video.id,
        videoId: video.id,
        title: video.title || 'Showcase Creation',
        prompt: video.prompt || '',
        model: video.model || 'luma',
        aspect_ratio: video.aspect_ratio || '9:16',
        video_url: activeVideoSrc || video.video_url,
        thumbnail_url: video.thumbnail_url || '',
        duration: video.duration || '10s',
      },
      currentUserEmail
    );
    setIsLiked(nextState);

    if (nextState) {
      setGalleryNotice(`❤️ Saved "${video.title}" to Favorites! You can access it anytime in History → Favorites.`);
    } else {
      setGalleryNotice(`💔 Removed "${video.title}" from Favorites.`);
    }
    setTimeout(() => setGalleryNotice(null), 3200);
  };

  // Interactive extras:
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showKeyframes, setShowKeyframes] = useState(false);
  const [keyframes, setKeyframes] = useState<KeyframePromptOverride[]>([]);
  const [newKeyframePrompt, setNewKeyframePrompt] = useState('');
  const [isExtractingFrame, setIsExtractingFrame] = useState(false);
  const [activeKeyframeNotice, setActiveKeyframeNotice] = useState<string | null>(null);

  // Hover & Locked Playback state (Runway / Luma style)
  const [isHovered, setIsHovered] = useState(false);
  const [isLockedPlaying, setIsLockedPlaying] = useState(false);
  const [isRemixFlying, setIsRemixFlying] = useState(false);

  const isReplaced = Boolean(video.isCustomReplaced);
  const hasVideo = Boolean((video.hasVideo || isReplaced) && activeVideoSrc);

  // Play/pause sync with hover and locked status
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;
    const shouldPlay = isPlaying || isLockedPlaying || isHovered;
    if (shouldPlay) {
      vid.play().catch(() => {});
    } else {
      vid.pause();
    }
  }, [isPlaying, isLockedPlaying, isHovered]);

  // Keyframe notification check on currentTime update
  useEffect(() => {
    const matched = keyframes.find((k) => Math.abs(k.timestamp - currentTime) < 0.35);
    if (matched) {
      setActiveKeyframeNotice(matched.promptOverride);
    } else {
      setActiveKeyframeNotice(null);
    }
  }, [currentTime, keyframes]);

  // Seeking
  const handleScrub = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const target = pos * duration;
    if (videoRef.current && !isNaN(target)) {
      videoRef.current.currentTime = target;
      setCurrentTime(target);
    }
  };

  const handleScrubHover = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setHoverTime(pos * duration);
  };

  // Hover Timeline Scrubbing (YouTube Style - Suggestion 3)
  const handleVideoMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!hasVideo || !videoRef.current || duration <= 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const scrubRatio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const targetTime = scrubRatio * duration;
    setHoverTime(targetTime);
    
    // Live scrub video frame to match cursor position across card
    videoRef.current.currentTime = targetTime;
    setCurrentTime(targetTime);
  };

  // Speed cycle
  const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2];
  const cycleSpeed = (e: React.MouseEvent) => {
    e.stopPropagation();
    const idx = speeds.indexOf(playbackSpeed);
    const next = speeds[(idx + 1) % speeds.length];
    setPlaybackSpeed(next);
    if (videoRef.current) {
      videoRef.current.playbackRate = next;
    }
  };

  // Mute toggle
  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = !isMuted;
    setIsMuted(next);
    if (videoRef.current) {
      videoRef.current.muted = next;
    }
  };

  // Volume slider
  const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const val = parseFloat(e.target.value);
    setVolume(val);
    const shouldMute = val === 0;
    setIsMuted(shouldMute);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = shouldMute;
    }
  };

  // Loop toggle
  const toggleLoop = (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = !isLooping;
    setIsLooping(next);
    if (videoRef.current) {
      videoRef.current.loop = next;
    }
  };

  // Fullscreen
  const toggleFullscreen = (e: React.MouseEvent) => {
    e.stopPropagation();
    const el = cardRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      el.requestFullscreen().catch(() => {});
    }
  };

  // Extract Frame (Camera Snapshot PNG)
  const handleExtractFrame = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const vid = videoRef.current;
    if (!vid) return;

    try {
      setIsExtractingFrame(true);
      const canvas = document.createElement('canvas');
      const w = is2xUpscaled ? (vid.videoWidth || 1080) * 2 : (vid.videoWidth || 1080);
      const h = is2xUpscaled ? (vid.videoHeight || 1920) * 2 : (vid.videoHeight || 1920);
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context unavailable');

      if (colorGrading !== 'Normal') {
        ctx.filter = COLOR_FILTER_MAP[colorGrading];
      }

      ctx.drawImage(vid, 0, 0, w, h);

      if (isWatermarkActive) {
        ctx.save();
        ctx.font = 'bold 28px sans-serif';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
        ctx.shadowBlur = 8;
        ctx.fillText('NexVerze Studio • AI Protected', 40, h - 40);
        ctx.restore();
      }

      const dataUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      const cleanTitle = (video.title || 'video').toLowerCase().replace(/[^a-z0-9]+/g, '-');
      a.download = `nexverze-${cleanTitle}-frame-${currentTime.toFixed(1)}s.png`;
      a.href = dataUrl;
      a.click();

      setGalleryNotice(`📸 Extracted high-res frame for "${video.title}" at ${currentTime.toFixed(1)}s!`);
      setTimeout(() => setGalleryNotice(null), 3000);
    } catch (err) {
      console.error('Frame extract error:', err);
    } finally {
      setIsExtractingFrame(false);
    }
  };

  // Download Master MP4
  const handleDownloadMp4 = (e: React.MouseEvent) => {
    e.stopPropagation();
    const cleanTitle = (video.title || 'video').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const a = document.createElement('a');
    a.href = activeVideoSrc || video.video_url;
    a.download = `${cleanTitle}.mp4`;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setGalleryNotice(`⬇️ Downloading master MP4: "${video.title}"`);
    setTimeout(() => setGalleryNotice(null), 3000);
  };

  // Frictionless "Remix Prompt" Floating Action with Upward Parameter Micro-Animation
  const handleRemix = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsRemixFlying(true);
    setTimeout(() => setIsRemixFlying(false), 1100);

    const originEl = promptBoxRef.current || cardRef.current || (e.currentTarget as HTMLElement);
    const rect = originEl ? originEl.getBoundingClientRect() : null;
    const sourceRect = rect
      ? {
          left: rect.left,
          top: rect.top,
          width: rect.width,
          height: rect.height,
        }
      : undefined;

    onRemixVideo({
      title: video.title,
      prompt: video.prompt,
      modelName: video.model,
      duration: video.duration || '10s',
      aspectRatio: video.aspect_ratio,
      motionIntensity,
      sceneTransition,
      colorGrading,
      sourceRect,
    });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('nexverze-remix-action', {
          detail: {
            title: video.title,
            prompt: video.prompt,
            modelName: video.model,
            duration: video.duration || '5s',
            aspectRatio: video.aspect_ratio,
            motionIntensity,
            sceneTransition,
            colorGrading,
            sourceRect,
          },
        })
      );
    }

    setGalleryNotice(`✨ Remixing "${video.title}" — floating prompt & model parameters to generator...`);
    setTimeout(() => setGalleryNotice(null), 3500);
  };

  // Social Sharing
  const handleShare = (platform: 'twitter' | 'linkedin' | 'whatsapp' | 'copy') => {
    const shareText = `Check out "${video.title}" created with NexVerze Studio! Prompt: ${video.prompt}`;
    const shareUrl = typeof window !== 'undefined' ? window.location.href : 'https://nexverze.ai';

    if (platform === 'twitter') {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`, '_blank');
    } else if (platform === 'linkedin') {
      window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, '_blank');
    } else if (platform === 'whatsapp') {
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`, '_blank');
    } else {
      navigator.clipboard?.writeText(`${shareText}\n${shareUrl}`);
      setGalleryNotice(`📋 Copied details & link for "${video.title}"!`);
      setTimeout(() => setGalleryNotice(null), 3000);
    }
    setShowShareMenu(false);
  };

  // Add Keyframe at current timestamp
  const handleAddKeyframe = (e: React.FormEvent) => {
    e.preventDefault();
    const ts = Math.round(currentTime * 10) / 10;
    const newKf: KeyframePromptOverride = {
      id: `kf-${Date.now()}`,
      timestamp: ts,
      promptOverride: newKeyframePrompt.trim() || `Dynamic scene transition at ${ts}s with enhanced lighting`,
      motionStrength: 'dynamic',
      cameraMove: 'zoom-in',
    };
    setKeyframes((prev) => [...prev, newKf].sort((a, b) => a.timestamp - b.timestamp));
    setNewKeyframePrompt('');
    setGalleryNotice(`📍 Added keyframe override at ${ts}s for "${video.title}"`);
    setTimeout(() => setGalleryNotice(null), 3000);
  };

  const removeKeyframe = (id: string) => {
    setKeyframes((prev) => prev.filter((k) => k.id !== id));
  };

  const seekToKeyframe = (ts: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = ts;
      setCurrentTime(ts);
    }
  };

  const ratioClass =
    video.aspect_ratio === '16:9'
      ? 'aspect-[16/9]'
      : video.aspect_ratio === '1:1'
      ? 'aspect-square'
      : 'aspect-[9/16]';

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Social proof formatted metrics (Suggestion 4)
  const baseLikes = video.likesCount || 2480;
  const currentLikes = isLiked ? baseLikes + 1 : baseLikes;
  const formattedLikes = currentLikes >= 1000 ? `${(currentLikes / 1000).toFixed(1)}k` : currentLikes;
  const baseViews = video.viewsCount || 18400;
  const formattedViews = baseViews >= 1000 ? `${(baseViews / 1000).toFixed(1)}k` : baseViews;

  return (
    <div className="relative group/card w-full">
      {/* Ambient Video Glow (The "Apple TV / YouTube Cinema" Effect - Suggestion 3) */}
      <div
        className={`absolute -inset-3 sm:-inset-4 rounded-3xl blur-3xl transition-all duration-700 pointer-events-none -z-10 ${
          video.dominantGlow === 'cyan'
            ? 'bg-gradient-to-r from-cyan-500/35 via-blue-500/25 to-teal-500/35'
            : video.dominantGlow === 'amber'
            ? 'bg-gradient-to-r from-amber-500/35 via-orange-500/25 to-yellow-500/35'
            : video.dominantGlow === 'magenta'
            ? 'bg-gradient-to-r from-fuchsia-500/35 via-pink-500/25 to-rose-500/35'
            : video.dominantGlow === 'rose'
            ? 'bg-gradient-to-r from-rose-500/35 via-pink-500/25 to-orange-500/35'
            : video.dominantGlow === 'emerald'
            ? 'bg-gradient-to-r from-emerald-500/35 via-teal-500/25 to-cyan-500/35'
            : 'bg-gradient-to-r from-purple-600/40 via-fuchsia-600/30 to-pink-600/40'
        } ${
          isHovered || isPlaying
            ? 'opacity-85 scale-[1.03] animate-pulse'
            : 'opacity-25 scale-100 group-hover/card:opacity-80 group-hover/card:scale-[1.03]'
        }`}
      />

      {/* Card-Level Upward Launch Micro-Animation for Prompt & Model Parameters */}
      {isRemixFlying && (
        <div className="absolute inset-0 z-50 pointer-events-none flex flex-col items-center justify-center p-3 bg-black/75 backdrop-blur-md rounded-2xl overflow-visible">
          <div className="w-full max-w-[92%] p-3 rounded-2xl bg-gradient-to-br from-purple-950/95 via-[#181230] to-fuchsia-950/95 border border-fuchsia-400/70 shadow-[0_0_40px_rgba(217,70,239,0.55)] space-y-2 animate-remix-token-up">
            <div className="flex items-center justify-between gap-1.5 text-[10px] mono font-extrabold text-amber-300">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-spin" />
                <span>Floating to Generator Bar ↑</span>
              </span>
              <ArrowUp className="w-3.5 h-3.5 text-fuchsia-300 animate-bounce" />
            </div>
            <p className="text-[11px] text-white/95 line-clamp-2 italic font-serif">
              "{video.prompt}"
            </p>
            <div className="flex flex-wrap items-center gap-1 pt-0.5 text-[9px] mono font-bold">
              <span className="px-2 py-0.5 rounded-full bg-purple-600/50 border border-purple-300/50 text-white uppercase">
                {video.model}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-fuchsia-600/50 border border-fuchsia-300/50 text-white">
                {video.aspect_ratio}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/30 border border-amber-300/50 text-amber-200">
                {video.duration || '10s'}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-cyan-500/30 border border-cyan-300/50 text-cyan-200">
                Motion {motionIntensity}
              </span>
            </div>
          </div>
        </div>
      )}

      <div
        ref={cardRef}
        className={`group showcase-card-interactive bg-[#121020] border rounded-2xl overflow-hidden shadow-xl flex flex-col justify-between ${
          isReplaced && showCreatorButtons
            ? 'border-amber-500/60 ring-1 ring-amber-500/30 shadow-amber-950/20 hover:border-amber-400'
            : hasVideo
            ? 'border-[#272738] hover:border-purple-400/80 hover:ring-1 hover:ring-purple-400/40'
            : 'border-dashed border-purple-500/30 hover:border-amber-400/70 bg-[#121020]/70'
        }`}
      >
      {/* ========================================================================= */}
      {/* 1. VIDEO VIEWPORT CONTAINER                                               */}
      {/* ========================================================================= */}
      <div
        className={`relative ${ratioClass} bg-black/90 overflow-hidden cursor-pointer flex items-center justify-center select-none group/player`}
        onMouseEnter={() => {
          if (hasVideo) {
            setIsHovered(true);
          }
        }}
        onMouseMove={handleVideoMouseMove}
        onMouseLeave={() => {
          setIsHovered(false);
          setHoverTime(null);
        }}
        onTouchStart={() => {
          if (hasVideo) {
            setIsLockedPlaying((prev) => !prev);
            onTogglePlay();
          }
        }}
        onClick={() => {
          if (hasVideo) {
            const nextLocked = !isLockedPlaying;
            setIsLockedPlaying(nextLocked);
            if (!nextLocked) {
              setIsHovered(false);
            }
            onTogglePlay();
          } else if (showCreatorButtons) {
            onOpenReplaceModal(video);
          }
        }}
      >
        {hasVideo && activeVideoSrc ? (
          <>
            <video
              ref={videoRef}
              key={`${video.id}-${activeVideoSrc}`}
              src={activeVideoSrc}
              poster={video.thumbnail_url || undefined}
              loop={isLooping}
              muted={isMuted}
              playsInline
              preload="auto"
              crossOrigin="anonymous"
              style={{
                objectFit: video.objectFit || 'cover',
                objectPosition: `${video.objectPositionX ?? 50}% ${video.objectPositionY ?? 50}%`,
                transform: video.zoomScale && video.zoomScale !== 1 ? `scale(${video.zoomScale})` : undefined,
                transformOrigin: `${video.objectPositionX ?? 50}% ${video.objectPositionY ?? 50}%`,
                filter: COLOR_FILTER_MAP[colorGrading],
              }}
              className={`w-full h-full transition-transform duration-500 ${
                isFrameSmoothing ? 'transition-all duration-300 blur-[0.2px]' : ''
              }`}
              onTimeUpdate={() => {
                if (videoRef.current) setCurrentTime(videoRef.current.currentTime);
              }}
              onLoadedMetadata={() => {
                if (videoRef.current) setDuration(videoRef.current.duration || 10);
              }}
              onError={(e) => {
                const el = e.target as HTMLVideoElement;
                const fallbackUrl = '/videos/festival-dance-9-16.mp4';
                if (el.src !== fallbackUrl) {
                  el.src = fallbackUrl;
                }
              }}
            />

            {/* 2X AI UPSCALE CINEMATIC SHEEN OVERLAY */}
            {is2xUpscaled && (
              <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-cyan-500/10 via-transparent to-purple-500/10 mix-blend-screen animate-pulse" />
            )}

            {/* WATERMARK OVERLAY (When active) */}
            {isWatermarkActive && (
              <div className="absolute bottom-12 right-3 pointer-events-none flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/60 border border-white/20 backdrop-blur-md text-[10px] mono text-white/90 shadow-md">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                <span>NexVerze Studio</span>
              </div>
            )}

            {/* ACTIVE KEYFRAME OVERRIDE BANNER */}
            {activeKeyframeNotice && (
              <div className="absolute top-10 left-3 right-3 pointer-events-none z-20 px-3 py-1.5 rounded-xl bg-purple-950/90 border border-purple-400/50 backdrop-blur-md text-white text-[10px] mono shadow-lg animate-in slide-in-from-top-1">
                <span className="text-purple-300 font-bold">🎯 Keyframe Override:</span> "{activeKeyframeNotice}"
              </div>
            )}

            {/* CENTER PLAY/PAUSE ICON OVERLAY (Hidden during active hover preview or playback) */}
            {!isPlaying && !isHovered && !isLockedPlaying && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/10 transition-colors pointer-events-none">
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-purple-600 to-pink-600 text-white backdrop-blur-md flex items-center justify-center shadow-xl transition-transform group-hover:scale-110">
                  <Play className="w-5 h-5 fill-white ml-0.5" />
                </div>
              </div>
            )}

            {/* HOVER PREVIEW PILL INDICATOR (Runway / Pika style) */}
            {isHovered && !isLockedPlaying && !isPlaying && (
              <div className="absolute top-2.5 left-1/2 -translate-x-1/2 z-20 pointer-events-none px-2.5 py-0.5 rounded-full bg-black/80 border border-purple-400/50 backdrop-blur-md text-white text-[9px] mono font-bold shadow-lg animate-in fade-in flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Hover Preview</span>
              </div>
            )}

            {/* HOVER SCRUB TIMECODE BUBBLE (YouTube Style - Suggestion 3) */}
            {hoverTime !== null && isHovered && (
              <div
                className="absolute bottom-12 pointer-events-none z-30 px-2 py-0.5 rounded-md bg-black/90 border border-purple-400/60 text-white text-[10px] mono font-bold shadow-xl -translate-x-1/2 transition-all duration-75"
                style={{ left: `${Math.min(88, Math.max(12, (hoverTime / (duration || 1)) * 100))}%` }}
              >
                {formatTimecode(hoverTime)}
              </div>
            )}

            {/* 1-CLICK UNMUTE PILL ON HOVER (Suggestion 2) */}
            {hasVideo && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleMute(e);
                }}
                className={`absolute bottom-3 right-3 z-30 flex items-center gap-1.5 px-3 py-1 rounded-full backdrop-blur-md transition-all cursor-pointer shadow-xl active:scale-95 ${
                  isMuted
                    ? 'bg-black/85 hover:bg-purple-900/90 border border-purple-400/50 text-purple-200 hover:text-white hover:scale-105 ring-1 ring-purple-500/20'
                    : 'bg-emerald-950/85 hover:bg-emerald-900 border border-emerald-400/50 text-emerald-300'
                } ${isHovered || isPlaying ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none'}`}
                title={isMuted ? 'Click to Unmute Audio' : 'Click to Mute'}
              >
                {isMuted ? (
                  <>
                    <VolumeX className="w-3.5 h-3.5 text-pink-400 animate-pulse" />
                    <span className="text-[10px] mono font-bold">Unmute</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-[10px] mono font-bold">Sound On</span>
                  </>
                )}
              </button>
            )}

            {/* TOP OVERLAY: Model Badge + Quality Lock Shield + Aspect Tag + Quick Actions */}
            <div
              className="absolute top-2 left-2 right-2 flex items-center justify-between text-[10px] mono z-20"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded-full bg-black/80 backdrop-blur-md text-purple-300 font-bold border border-white/10 uppercase">
                  {video.model === 'luma'
                    ? 'Luma Ray 2'
                    : video.model === 'kling'
                    ? 'Kling v2.5'
                    : video.model === 'veo' || video.model === 'veo3'
                    ? 'Veo Ultra'
                    : video.model === 'wan'
                    ? 'Wan 2.1'
                    : video.model === 'hunyuan'
                    ? 'Hunyuan 13B'
                    : video.model === 'ltx'
                    ? 'LTX Fast'
                    : video.model}
                </span>

                {/* Quality Lock Raw Badge */}
                <span className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-400/40 text-emerald-300 font-semibold text-[9px]">
                  <ShieldCheck className="w-2.5 h-2.5 text-emerald-400" />
                  <span>Quality Lock</span>
                </span>

                {is2xUpscaled && (
                  <span className="px-1.5 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-400/50 text-cyan-300 font-bold text-[9px]">
                    4K UHD
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                {/* LIKE / FAVORITE HEART BUTTON WITH BURST ANIMATION */}
                <button
                  type="button"
                  onClick={handleToggleLike}
                  className={`relative p-1.5 rounded-full backdrop-blur-md transition-all duration-300 cursor-pointer shadow-lg active:scale-90 ${
                    isLiked
                      ? 'bg-rose-500/90 hover:bg-rose-600 text-white border border-rose-300/80 shadow-rose-500/50 ring-2 ring-rose-400/40'
                      : 'bg-black/75 hover:bg-black/95 text-white/70 hover:text-rose-400 border border-white/20 hover:border-rose-400/50'
                  } ${isAnimatingHeart ? 'animate-heart-pop scale-125' : 'scale-100'}`}
                  title={isLiked ? 'Saved in Favorites (Click to Remove)' : 'Like & Save to Favorites tab in History'}
                  aria-label={isLiked ? 'Unlike creation' : 'Like creation'}
                >
                  <Heart
                    className={`w-3.5 h-3.5 transition-all duration-300 ${
                      isLiked ? 'fill-white text-white drop-shadow' : 'text-current'
                    }`}
                  />
                  {/* Floating heart particles animation */}
                  {floatingHearts.map((fh) => (
                    <span
                      key={fh.id}
                      className="absolute pointer-events-none text-xs animate-float-heart z-40 select-none"
                      style={{
                        left: `calc(50% + ${fh.x}px)`,
                        top: `calc(50% + ${fh.y}px)`,
                      }}
                    >
                      ❤️
                    </span>
                  ))}
                </button>

                {isReplaced && showCreatorButtons && (
                  <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-black font-black text-[9px] uppercase tracking-wider shadow">
                    Replaced
                  </span>
                )}

                <span className="px-2 py-0.5 rounded-full bg-black/80 backdrop-blur-md text-white/90 font-bold border border-white/10">
                  {video.aspect_ratio}
                </span>

                {/* Studio View (Maximize to Full QualityLockPlayer Modal) */}
                <button
                  type="button"
                  onClick={() => onOpenStudioModal(video)}
                  className="p-1 rounded-lg bg-black/70 hover:bg-purple-600 text-white/80 hover:text-white border border-white/10 backdrop-blur-md transition-all cursor-pointer"
                  title="Open Full Studio Player View"
                >
                  <Maximize2 className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* BOTTOM OVERLAY: SCRUB BAR & PLAYBACK CONTROLS (Always accessible) */}
            <div
              className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/90 via-black/60 to-transparent z-20 space-y-1 opacity-90 group-hover:opacity-100 transition-opacity"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Interactive Scrub Timeline Bar */}
              <div
                className="relative w-full h-1.5 hover:h-2.5 bg-white/20 rounded-full cursor-pointer transition-all overflow-hidden"
                onClick={handleScrub}
                onMouseMove={handleScrubHover}
                onMouseLeave={() => setHoverTime(null)}
              >
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-75"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              {/* Timecode & Quick Action Bar */}
              <div className="flex items-center justify-between text-[10px] mono text-white/80 pt-0.5">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onTogglePlay}
                    className="p-1 rounded hover:bg-white/10 text-white cursor-pointer"
                    title={isPlaying ? 'Pause' : 'Play'}
                  >
                    {isPlaying ? <Pause className="w-3 h-3 fill-white" /> : <Play className="w-3 h-3 fill-white" />}
                  </button>

                  <span className="text-[10px] text-white/70">
                    {formatTimecode(currentTime)} / {formatTimecode(duration)}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  {/* Speed Cycle Button */}
                  <button
                    type="button"
                    onClick={cycleSpeed}
                    className="px-1.5 py-0.5 rounded bg-white/10 hover:bg-white/20 text-white text-[9px] font-bold cursor-pointer"
                    title="Cycle Playback Speed"
                  >
                    {playbackSpeed}x
                  </button>

                  {/* Loop Toggle */}
                  <button
                    type="button"
                    onClick={toggleLoop}
                    className={`p-1 rounded cursor-pointer ${
                      isLooping ? 'text-purple-300 bg-purple-500/20' : 'text-white/50 hover:text-white'
                    }`}
                    title={isLooping ? 'Loop Video: ON' : 'Loop Video: OFF'}
                  >
                    <Repeat className="w-3 h-3" />
                  </button>

                  {/* Mute/Volume Toggle */}
                  <button
                    type="button"
                    onClick={toggleMute}
                    className="p-1 rounded hover:bg-white/10 text-white/80 hover:text-white cursor-pointer"
                    title={isMuted ? 'Unmute' : 'Mute'}
                  >
                    {isMuted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                  </button>

                  {/* Fullscreen Button */}
                  <button
                    type="button"
                    onClick={toggleFullscreen}
                    className="p-1 rounded hover:bg-white/10 text-white/70 hover:text-white cursor-pointer"
                    title="Fullscreen Mode"
                  >
                    <Maximize2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          /* Empty Slot State */
          <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center space-y-2 bg-gradient-to-br from-[#16122c] to-[#0c091a]">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-400/30 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
              <Upload className="w-6 h-6 animate-pulse" />
            </div>
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-white/90 block">
                {video.aspect_ratio === '16:9'
                  ? '16:9 Widescreen Slot'
                  : video.aspect_ratio === '1:1'
                  ? '1:1 Square Slot'
                  : '9:16 Vertical Slot'}
              </span>
              <span className="text-[10px] text-amber-300/80 font-mono block">
                {showCreatorButtons ? 'Click card to upload custom video' : 'Showcase Reel'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 2. CARD METADATA & COMPREHENSIVE PREVIEW PANEL TOOLSET                     */}
      {/* ========================================================================= */}
      <div className="p-3.5 space-y-3 bg-[#0e0c1a] border-t border-[#1d1a30] text-xs">
        {/* Community Creator & Social Proof Metadata Header (Suggestion 4) */}
        <div className="flex items-center justify-between gap-2 pb-2 border-b border-white/[0.08]">
          <div className="flex items-center gap-2 min-w-0">
            <img
              src={video.creatorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop'}
              alt={video.creatorHandle || 'Creator'}
              className="w-5 h-5 rounded-full object-cover ring-1 ring-purple-400/50 shrink-0 shadow-sm"
            />
            <span className="font-bold text-white/90 truncate text-[11px] mono">
              {video.creatorHandle || '@neo_render'}
            </span>
            <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-wider bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white shrink-0 shadow-sm">
              {video.creatorBadge || 'PRO'}
            </span>
          </div>

          <div className="flex items-center gap-2.5 text-[10px] mono text-white/60 shrink-0">
            <span className="flex items-center gap-1 text-white/70" title="Community Views">
              <span>👁️</span>
              <span>{formattedViews}</span>
            </span>
            <span className="flex items-center gap-1 text-rose-400 font-bold" title="Community Likes">
              <span>❤️</span>
              <span>{formattedLikes}</span>
            </span>
          </div>
        </div>

        {/* Title & Prompt with Hover Lighting + Quick Remix Prompt Action */}
        <div
          ref={promptBoxRef}
          className={`p-2.5 rounded-xl transition-all duration-300 ${
            isHovered ? 'bg-[#1a1630] border border-purple-500/40 shadow-md shadow-purple-950/40' : 'bg-[#141126]/60 border border-white/[0.05]'
          }`}
        >
          <div className="flex items-center justify-between gap-1.5">
            <h4 className={`font-bold text-xs sm:text-sm line-clamp-1 transition-colors ${isHovered ? 'text-purple-200' : 'text-white group-hover:text-purple-300'}`}>
              {video.title}
            </h4>
            <div className="flex items-center gap-1 shrink-0">
              {isReplaced && showCreatorButtons && (
                <span className="text-[10px] font-bold text-amber-400 mono">
                  [Custom]
                </span>
              )}
              <button
                type="button"
                onClick={handleRemix}
                className="px-2 py-0.5 rounded-lg bg-purple-600/25 hover:bg-purple-600/50 border border-purple-400/40 text-purple-200 hover:text-white text-[10px] font-bold mono flex items-center gap-1 transition-all cursor-pointer active:scale-95"
                title="Remix Prompt: Float prompt & model parameters to main generator bar"
              >
                <Sparkles className="w-2.5 h-2.5 text-amber-300" />
                <span>Remix Prompt</span>
              </button>
            </div>
          </div>
          <p className="text-[11px] text-white/75 line-clamp-2 italic font-serif mt-1">
            "{video.prompt}"
          </p>

          {/* Speed, Model Parameters & Duration Tag */}
          <div className="flex items-center justify-between text-[10px] mono text-purple-300/80 pt-1.5 mt-1 border-t border-white/[0.05]">
            <span className="flex items-center gap-1 text-amber-300 font-semibold">
              <Zap className="w-3 h-3 text-amber-400 fill-amber-400" />
              <span>{video.renderSpeed || '⚡ 4.2s • 4K UHD'}</span>
            </span>
            <span className="text-white/50">
              {video.model.toUpperCase()} • {video.aspect_ratio} • {video.duration || '10s'}
            </span>
          </div>
        </div>

        {/* --------------------------------------------------------------------- */}
        {/* FEATURE ROW 1: COLOR GRADING & ENHANCEMENTS                           */}
        {/* --------------------------------------------------------------------- */}
        <div className="pt-2 border-t border-[#1a172c] space-y-2">
          <div className="flex items-center justify-between gap-1.5 flex-wrap">
            {/* Color Grading Preset Dropdown */}
            <div className="flex-1 min-w-[130px]">
              <div className="flex items-center gap-1 text-[10px] mono text-white/50 mb-1">
                <Palette className="w-3 h-3 text-purple-400" />
                <span>Color Grading:</span>
              </div>
              <select
                value={colorGrading}
                onChange={(e) => setColorGrading(e.target.value as ColorGradingPreset)}
                className="w-full px-2 py-1 rounded-lg bg-[#18152c] border border-[#2e2a4a] text-white/90 text-[11px] mono focus:outline-none focus:border-purple-400"
              >
                {COLOR_GRADING_PRESETS.map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    {preset.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Toggles: 2x AI Upscale, Smoothing, Watermark */}
            <div className="flex items-center gap-1 pt-3.5">
              {/* 2x AI Upscale */}
              <button
                type="button"
                onClick={() => setIs2xUpscaled(!is2xUpscaled)}
                className={`p-1.5 rounded-lg border text-[10px] mono font-bold flex items-center gap-1 transition-all cursor-pointer ${
                  is2xUpscaled
                    ? 'bg-cyan-950/60 border-cyan-400 text-cyan-200 ring-1 ring-cyan-400/30'
                    : 'bg-[#181528] border-[#2e2a4a] text-white/60 hover:text-white'
                }`}
                title="Toggle 2x AI Upscale (4K UHD Emulation)"
              >
                <Sparkles className="w-3 h-3 text-cyan-300" />
                <span>4K</span>
              </button>

              {/* 60fps Smoothing */}
              <button
                type="button"
                onClick={() => setIsFrameSmoothing(!isFrameSmoothing)}
                className={`p-1.5 rounded-lg border text-[10px] mono font-bold flex items-center gap-1 transition-all cursor-pointer ${
                  isFrameSmoothing
                    ? 'bg-purple-950/60 border-purple-400 text-purple-200 ring-1 ring-purple-400/30'
                    : 'bg-[#181528] border-[#2e2a4a] text-white/60 hover:text-white'
                }`}
                title="Toggle Frame Smoothing (60fps motion review)"
              >
                <Layers className="w-3 h-3 text-purple-400" />
                <span>60fps</span>
              </button>

              {/* Watermark Toggle */}
              <button
                type="button"
                onClick={() => setIsWatermarkActive(!isWatermarkActive)}
                className={`p-1.5 rounded-lg border text-[10px] mono font-bold flex items-center gap-1 transition-all cursor-pointer ${
                  isWatermarkActive
                    ? 'bg-purple-950/60 border-purple-400 text-purple-200'
                    : 'bg-[#181528] border-[#2e2a4a] text-white/60 hover:text-white'
                }`}
                title="Toggle Semi-transparent NexVerze Watermark"
              >
                <ShieldCheck className="w-3 h-3 text-purple-400" />
                <span>WM</span>
              </button>
            </div>
          </div>

          {/* ------------------------------------------------------------------- */}
          {/* FEATURE ROW 2: MOTION INTENSITY & SCENE TRANSITIONS                 */}
          {/* ------------------------------------------------------------------- */}
          <div className="grid grid-cols-2 gap-2 pt-1 bg-[#151226]/50 p-2 rounded-xl border border-white/5">
            {/* Motion Intensity (1-10) */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px] mono text-white/60">
                <span className="flex items-center gap-1">
                  <Gauge className="w-3 h-3 text-amber-400" />
                  <span>Motion:</span>
                </span>
                <span className="text-amber-300 font-bold">
                  {motionIntensity} ({getMotionLabel(motionIntensity)})
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={motionIntensity}
                onChange={(e) => setMotionIntensity(parseInt(e.target.value, 10))}
                className="w-full h-1 bg-[#262242] rounded-lg appearance-none cursor-pointer accent-amber-400"
              />
            </div>

            {/* Scene Transition Dropdown */}
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-[10px] mono text-white/60">
                <Zap className="w-3 h-3 text-pink-400" />
                <span>Transition:</span>
              </div>
              <select
                value={sceneTransition}
                onChange={(e) => setSceneTransition(e.target.value as SceneTransitionType)}
                className="w-full px-2 py-0.5 rounded-lg bg-[#18152c] border border-[#2e2a4a] text-white/90 text-[10px] mono focus:outline-none"
              >
                <option value="Crossfade">Crossfade</option>
                <option value="Cut">Cut</option>
                <option value="Wipe">Wipe</option>
              </select>
            </div>
          </div>

          {/* ------------------------------------------------------------------- */}
          {/* FEATURE ROW 3: CREATIVE TOOLS (FRAME EXTRACT, MP4, KEYFRAMES, SHARE)*/}
          {/* ------------------------------------------------------------------- */}
          <div className="flex items-center justify-between gap-1 pt-1">
            <div className="flex items-center gap-1">
              {/* Like / Heart Quick Toggle Button */}
              <button
                type="button"
                onClick={handleToggleLike}
                className={`p-1.5 rounded-lg border transition-all cursor-pointer flex items-center gap-1 text-[10px] mono ${
                  isLiked
                    ? 'bg-rose-950/70 border-rose-500/60 text-rose-300 ring-1 ring-rose-500/30 shadow-sm shadow-rose-950/40'
                    : 'bg-[#181528] hover:bg-rose-950/30 border-[#2e2a4a] text-white/70 hover:text-rose-300'
                } ${isAnimatingHeart ? 'animate-heart-pop' : ''}`}
                title={isLiked ? 'Favorited: Saved in History tab' : 'Like & Save to Favorites tab in History'}
              >
                <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-rose-400 text-rose-400' : ''}`} />
                <span className="hidden xs:inline">{isLiked ? 'Liked' : 'Like'}</span>
              </button>

              {/* Extract Frame (Camera Snapshot PNG) */}
              <button
                type="button"
                onClick={handleExtractFrame}
                disabled={isExtractingFrame}
                className="p-1.5 rounded-lg bg-[#181528] hover:bg-purple-900/30 border border-[#2e2a4a] text-white/70 hover:text-white transition-all cursor-pointer"
                title="Extract High-Res Current Frame (PNG Snapshot)"
              >
                <Camera className="w-3.5 h-3.5 text-purple-400" />
              </button>

              {/* Download Master MP4 */}
              <button
                type="button"
                onClick={handleDownloadMp4}
                className="p-1.5 rounded-lg bg-[#181528] hover:bg-purple-900/30 border border-[#2e2a4a] text-white/70 hover:text-white transition-all cursor-pointer"
                title="Download Master MP4 Video"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
              </button>

              {/* Keyframe Overrides Drawer Button */}
              <button
                type="button"
                onClick={() => setShowKeyframes(!showKeyframes)}
                className={`p-1.5 rounded-lg border transition-all cursor-pointer flex items-center gap-1 text-[10px] mono ${
                  showKeyframes || keyframes.length > 0
                    ? 'bg-purple-950/60 border-purple-400 text-purple-300'
                    : 'bg-[#181528] border-[#2e2a4a] text-white/60 hover:text-white'
                }`}
                title="Keyframe Overrides: Set timestamp-based prompt variations"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>{keyframes.length}</span>
              </button>
            </div>

            <div className="flex items-center gap-1 relative">
              {/* Share Button & Popover */}
              <button
                type="button"
                onClick={() => setShowShareMenu(!showShareMenu)}
                className="p-1.5 rounded-lg bg-[#181528] hover:bg-[#221e38] border border-[#2e2a4a] text-white/70 hover:text-white transition-all cursor-pointer"
                title="Share Video"
              >
                <Share2 className="w-3.5 h-3.5" />
              </button>

              {/* Share Popover Menu */}
              {showShareMenu && (
                <div className="absolute right-0 bottom-full mb-1 w-44 rounded-xl bg-[#151226] border border-purple-500/40 p-1.5 shadow-2xl z-30 space-y-1 text-xs mono animate-in fade-in">
                  <button
                    type="button"
                    onClick={() => handleShare('twitter')}
                    className="w-full text-left px-2 py-1 rounded-lg hover:bg-purple-600/20 text-white/90 hover:text-white flex items-center gap-2 cursor-pointer"
                  >
                    <span>Twitter / X</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleShare('whatsapp')}
                    className="w-full text-left px-2 py-1 rounded-lg hover:bg-purple-600/20 text-white/90 hover:text-white flex items-center gap-2 cursor-pointer"
                  >
                    <span>WhatsApp</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleShare('linkedin')}
                    className="w-full text-left px-2 py-1 rounded-lg hover:bg-purple-600/20 text-white/90 hover:text-white flex items-center gap-2 cursor-pointer"
                  >
                    <span>LinkedIn</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleShare('copy')}
                    className="w-full text-left px-2 py-1 rounded-lg hover:bg-purple-600/20 text-white/90 hover:text-white flex items-center gap-2 cursor-pointer border-t border-white/5 pt-1"
                  >
                    <Copy className="w-3 h-3 text-purple-400" />
                    <span>Copy Link</span>
                  </button>
                </div>
              )}

              {/* Full Studio Player View Expand Button */}
              <button
                type="button"
                onClick={() => onOpenStudioModal(video)}
                className="p-1.5 rounded-lg bg-gradient-to-r from-purple-900/40 to-indigo-900/40 hover:from-purple-900/60 hover:to-indigo-900/60 border border-purple-500/30 text-purple-300 transition-all cursor-pointer flex items-center gap-1 text-[10px] mono"
                title="Open in Full Studio Player View"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Studio</span>
              </button>
            </div>
          </div>

          {/* ------------------------------------------------------------------- */}
          {/* KEYFRAMES OVERRIDES COLLAPSIBLE DRAWER                              */}
          {/* ------------------------------------------------------------------- */}
          {showKeyframes && (
            <div className="p-2.5 rounded-xl bg-[#141124] border border-purple-500/30 space-y-2 text-xs mono animate-in slide-in-from-top-1">
              <div className="flex items-center justify-between text-[10px] text-white/60 border-b border-white/5 pb-1">
                <span className="font-bold text-purple-300">Keyframe Prompt Overrides</span>
                <span>Current: {currentTime.toFixed(1)}s</span>
              </div>

              {/* Add Keyframe Input */}
              <form onSubmit={handleAddKeyframe} className="flex gap-1.5">
                <input
                  type="text"
                  value={newKeyframePrompt}
                  onChange={(e) => setNewKeyframePrompt(e.target.value)}
                  placeholder={`Override at ${currentTime.toFixed(1)}s...`}
                  className="flex-1 px-2 py-1 rounded-lg bg-[#1a1630] border border-[#2e2a4a] text-white text-[10px] focus:outline-none focus:border-purple-400"
                />
                <button
                  type="submit"
                  className="px-2 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-bold cursor-pointer shrink-0"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </form>

              {/* Keyframe List */}
              {keyframes.length > 0 ? (
                <div className="max-h-24 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                  {keyframes.map((kf) => (
                    <div
                      key={kf.id}
                      className="flex items-center justify-between gap-1 p-1 rounded bg-[#1a172e] border border-white/5 text-[10px]"
                    >
                      <button
                        type="button"
                        onClick={() => seekToKeyframe(kf.timestamp)}
                        className="text-purple-300 hover:text-purple-200 font-bold cursor-pointer shrink-0"
                      >
                        ⏱️ {kf.timestamp.toFixed(1)}s:
                      </button>
                      <span className="truncate text-white/70 flex-1 px-1">
                        {kf.promptOverride}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeKeyframe(kf.id)}
                        className="text-rose-400 hover:text-rose-300 p-0.5 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <span className="text-[10px] text-white/40 block text-center py-1 italic">
                  No keyframes set. Type prompt above to add override at {currentTime.toFixed(1)}s.
                </span>
              )}
            </div>
          )}

          {/* ------------------------------------------------------------------- */}
          {/* PRIMARY ACTION BUTTONS: REMIX + CREATOR REPLACE / ADJUST / REVERT   */}
          {/* ------------------------------------------------------------------- */}
          <div className="space-y-1.5 pt-1">
            {/* Upload & Replace Button (Creator Mode in Live Preview Only) */}
            {showCreatorButtons && (
              <button
                type="button"
                onClick={() => onOpenReplaceModal(video)}
                className={`w-full py-2 px-3 rounded-xl border text-xs font-bold mono flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md active:scale-95 ${
                  isReplaced
                    ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-400/40 shadow-amber-950/20'
                    : 'bg-[#181528] hover:bg-purple-900/30 text-white/90 hover:text-white border-[#2e2a4a] hover:border-amber-400/50'
                }`}
                title="Upload and replace this video"
              >
                <Upload className="w-3.5 h-3.5 text-amber-400" />
                <span>Upload & Replace Video</span>
                {isReplaced && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse ml-0.5" />
                )}
              </button>
            )}

            {/* Adjust Framing Button (For Replaced Videos) */}
            {isReplaced && showCreatorButtons && (
              <button
                type="button"
                onClick={() => onOpenReplaceModal(video)}
                className="w-full py-1.5 px-3 rounded-xl bg-[#161327] hover:bg-amber-500/20 border border-amber-400/30 hover:border-amber-400 text-amber-300 text-[11px] font-bold mono flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
                title="Adjust video framing: move up and down, left and right by move/drag"
              >
                <Move className="w-3.5 h-3.5 text-amber-400" />
                <span>Adjust Framing ({video.objectPositionX ?? 50}% X, {video.objectPositionY ?? 50}% Y)</span>
              </button>
            )}

            {/* Action Row: Remix Prompt (Floats Prompt & Model Parameters Upward to Studio Generator) + Revert (if replaced) */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleRemix}
                className={`flex-1 py-2.5 px-3 rounded-xl text-white text-xs font-extrabold mono flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 ${
                  isHovered
                    ? 'bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-500 shadow-xl shadow-fuchsia-500/50 ring-2 ring-fuchsia-400/80 scale-[1.02] text-white'
                    : 'bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 shadow-lg shadow-purple-950/40'
                }`}
                title="Remix Prompt: Float prompt, model, aspect ratio, and duration upward into the main generator bar"
              >
                <Sparkles className={`w-3.5 h-3.5 fill-white ${isHovered ? 'animate-spin' : ''}`} />
                <span>{isHovered ? '✨ Remix Prompt (Float to Generator ↑)' : 'Remix Prompt'}</span>
              </button>

              {isReplaced && showCreatorButtons && (
                <button
                  type="button"
                  onClick={() => onRevertToOriginal(video.id, video.title)}
                  className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 transition-all cursor-pointer"
                  title="Revert video to default slot"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);
};

export const ShowcaseGallery: React.FC<ShowcaseGalleryProps> = ({
  onRemixVideo,
  onOpenStudioWithMode,
  currentUserEmail,
  isFreeUser = false,
  onOpenPlans,
  user = null,
}) => {
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [activeFormatTab, setActiveFormatTab] = useState<'bento' | 'all' | '9:16' | '16:9' | '1:1'>('all');
  const [studioModalVideo, setStudioModalVideo] = useState<VideoSample | null>(null);

  // Detect whether the current viewer is the creator in live preview
  const isLivePreview = checkIsLivePreviewCreator(currentUserEmail);

  // Creator Mode state: ONLY allowed if isLivePreview is true. Defaults to true in live preview.
  const [isCreatorMode, setIsCreatorMode] = useState<boolean>(() => {
    if (!checkIsLivePreviewCreator(currentUserEmail)) return false;
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('nexverze_gallery_creator_mode');
        if (stored !== null) return stored === 'true';
      } catch (e) {
        console.error('Error reading creator mode:', e);
      }
    }
    return true; // Default to true in live preview for creator
  });

  // Effective creator buttons visibility: ONLY true if live preview AND creator mode active
  const showCreatorButtons = isLivePreview && isCreatorMode;

  // Replaced / Customized videos dictionary mapping video ID -> overridden properties
  const [replacedVideos, setReplacedVideos] = useState<Record<string, Partial<VideoSample>>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('nexverze_replaced_gallery_videos');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && typeof parsed === 'object') return parsed;
        }
      } catch (e) {
        console.error('Error loading replaced gallery videos:', e);
      }
    }
    return {};
  });

  // In-memory map of videoId -> objectUrl loaded from IndexedDB for zero-loss instant local playback
  const [blobUrlMap, setBlobUrlMap] = useState<Record<string, string>>({});

  // Target video currently selected for upload & replacement
  const [targetVideoToReplace, setTargetVideoToReplace] = useState<VideoSample | null>(null);

  // Modal form states for video replacement
  const [replaceTitle, setReplaceTitle] = useState('');
  const [replacePrompt, setReplacePrompt] = useState('');
  const [replaceModel, setReplaceModel] = useState<VideoSample['model']>('luma');
  const [replaceRatio, setReplaceRatio] = useState<'9:16' | '16:9' | '1:1'>('9:16');
  const [replaceVideoUrl, setReplaceVideoUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [replaceFileName, setReplaceFileName] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [replaceSuccess, setReplaceSuccess] = useState(false);
  const [modalNotice, setModalNotice] = useState<string | null>(null);
  const [galleryNotice, setGalleryNotice] = useState<string | null>(null);

  // Fit & Framing Positioning States (Move Up/Down, Left/Right, Move/Drag)
  const [replaceFit, setReplaceFit] = useState<'cover' | 'contain'>('cover');
  const [replacePosX, setReplacePosX] = useState<number>(50); // 0 (left) to 100 (right)
  const [replacePosY, setReplacePosY] = useState<number>(50); // 0 (top) to 100 (bottom)
  const [replaceZoom, setReplaceZoom] = useState<number>(1);
  const [isDraggingFraming, setIsDraggingFraming] = useState<boolean>(false);
  const dragStartRef = useRef<{ startX: number; startY: number; initPosX: number; initPosY: number } | null>(null);

  const handleFramingPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDraggingFraming(true);
    try {
      (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    } catch {}
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initPosX: replacePosX,
      initPosY: replacePosY,
    };
  };

  const handleFramingPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingFraming || !dragStartRef.current) return;
    const deltaX = e.clientX - dragStartRef.current.startX;
    const deltaY = e.clientY - dragStartRef.current.startY;
    // Moving mouse left moves object-position right, moving mouse up moves object-position down
    const newX = Math.max(0, Math.min(100, Math.round(dragStartRef.current.initPosX - deltaX * 0.4)));
    const newY = Math.max(0, Math.min(100, Math.round(dragStartRef.current.initPosY - deltaY * 0.4)));
    setReplacePosX(newX);
    setReplacePosY(newY);
  };

  const handleFramingPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDraggingFraming(false);
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
    } catch {}
    dragStartRef.current = null;
  };

  const nudgeFraming = (dir: 'up' | 'down' | 'left' | 'right', amount: number = 5) => {
    if (dir === 'up') setReplacePosY((prev) => Math.max(0, prev - amount));
    if (dir === 'down') setReplacePosY((prev) => Math.min(100, prev + amount));
    if (dir === 'left') setReplacePosX((prev) => Math.max(0, prev - amount));
    if (dir === 'right') setReplacePosX((prev) => Math.min(100, prev + amount));
  };

  const resetFraming = () => {
    setReplacePosX(50);
    setReplacePosY(50);
    setReplaceZoom(1);
    setReplaceFit('cover');
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});

  // Load all persisted video blobs from IndexedDB into memory blobUrlMap on mount & sync with server manifest
  useEffect(() => {
    let isMounted = true;
    async function loadStoredData() {
      // 1. Fetch server replacements manifest to persist across devices and reloads
      try {
        const res = await fetch('/api/gallery-replacements');
        if (res.ok) {
          const data = await res.json();
          // Merge with Firestore replacements for ultimate truth
          try {
            const snapshot = await getDocs(collection(db, 'gallery_replacements'));
            const firestoreReplacements: Record<string, any> = {};
            snapshot.forEach((doc) => {
              firestoreReplacements[doc.id] = doc.data();
            });

            if (isMounted) {
              setReplacedVideos((prev) => {
                const merged = { ...prev, ...data.replacements, ...firestoreReplacements };
                try {
                  localStorage.setItem('nexverze_replaced_gallery_videos', JSON.stringify(merged));
                } catch {}
                return merged;
              });
            }
          } catch (fsErr) {
            console.warn('Firestore connection notice (using cached server replacements):', fsErr);
            if (isMounted) {
              setReplacedVideos((prev) => ({ ...prev, ...data.replacements }));
            }
          }
        }
      } catch (err) {
        console.warn('Notice checking server replacements manifest:', err);
      }

      // 2. Load all IndexedDB blobs for zero-latency local playback
      try {
        const urls = await loadAllGalleryVideoBlobs();
        if (isMounted && Object.keys(urls).length > 0) {
          setBlobUrlMap((prev) => ({ ...prev, ...urls }));
        }
      } catch (err) {
        console.warn('Notice loading IndexedDB blobs:', err);
      }
    }
    loadStoredData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Helper to merge default slots with any replaced videos from localStorage, server manifest & IndexedDB
  const getProcessedVideos = (defaultList: VideoSample[]) => {
    return defaultList.map((video) => {
      const safeId = video.id.replace(/[^a-zA-Z0-9_-]/g, '_');
      const override = replacedVideos[video.id] || replacedVideos[safeId];
      if (override) {
        return {
          ...video,
          ...override,
          isCustomReplaced: true,
          hasVideo: true,
        };
      }
      return {
        ...video,
        isCustomReplaced: false,
        hasVideo: Boolean(blobUrlMap[video.id] || blobUrlMap[safeId] || video.video_url),
      };
    });
  };

  const videos916 = getProcessedVideos(SAMPLE_VIDEOS_9_16);
  const videos169 = getProcessedVideos(SLOTS_16_9);
  const videos11 = getProcessedVideos(SLOTS_1_1);

  // Dynamic Bento Grid Video Sequence (Interleaving wide 16:9 banners with tall 9:16 and square 1:1)
  const bentoVideos = [
    videos169[0], // Wide 16:9 (2 cols)
    videos916[0], // Tall 9:16
    videos916[1], // Tall 9:16
    videos11[0],  // Square 1:1
    videos11[1],  // Square 1:1
    videos169[1], // Wide 16:9 (2 cols)
    videos916[2], // Tall 9:16
    videos916[3], // Tall 9:16
    videos169[2], // Wide 16:9 (2 cols)
    videos11[2],  // Square 1:1
    videos916[4], // Tall 9:16
    videos169[3], // Wide 16:9 (2 cols)
    videos11[3],  // Square 1:1
    videos916[5], // Tall 9:16
    videos916[6], // Tall 9:16
    videos916[7], // Tall 9:16
  ].filter(Boolean);

  // Open replace modal for a specific video
  const handleOpenReplaceModal = (video: VideoSample) => {
    setTargetVideoToReplace(video);
    setReplaceTitle(video.title || '');
    setReplacePrompt(video.prompt || '');
    setReplaceModel(video.model || 'luma');
    setReplaceRatio(video.aspect_ratio || '9:16');
    const safeId = video.id.replace(/[^a-zA-Z0-9_-]/g, '_');
    const existingVideo = blobUrlMap[video.id] || blobUrlMap[safeId] || video.video_url || null;
    setReplaceVideoUrl(existingVideo);
    setSelectedFile(null);
    setReplaceFileName(null);
    setModalNotice(null);
    setReplaceSuccess(false);

    // Initialize fit & positioning states from current video
    setReplaceFit(video.objectFit || 'cover');
    setReplacePosX(typeof video.objectPositionX === 'number' ? video.objectPositionX : 50);
    setReplacePosY(typeof video.objectPositionY === 'number' ? video.objectPositionY : 50);
    setReplaceZoom(typeof video.zoomScale === 'number' ? video.zoomScale : 1);
  };

  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      setModalNotice('⚠️ Please select a valid video file (MP4, WebM, MOV).');
      return;
    }

    setModalNotice(null);
    setSelectedFile(file);
    setReplaceFileName(`${file.name} (${(file.size / (1024 * 1024)).toFixed(1)} MB)`);

    // Create live ObjectURL for immediate preview in modal
    const previewUrl = URL.createObjectURL(file);
    setReplaceVideoUrl(previewUrl);
  };

  // Submit replacement for the target video
  const handleSaveVideoReplacement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetVideoToReplace) return;

    if (!selectedFile && !replaceVideoUrl) {
      setModalNotice('⚠️ Please select a video file to upload and replace this video.');
      return;
    }

    setIsUploading(true);
    setModalNotice('Saving video to gallery storage...');

    const targetId = targetVideoToReplace.id;
    const safeId = targetId.replace(/[^a-zA-Z0-9_-]/g, '_');
    let localBlobUrl = replaceVideoUrl;

    // 1. Extract video poster frame thumbnail so slot never appears as a blank/black box
    let generatedThumb = '';
    if (selectedFile) {
      try {
        generatedThumb = await extractThumbnailFromVideo(selectedFile);
      } catch (err) {
        console.warn('Thumbnail generation notice:', err);
      }
    }

    // 2. Upload thumbnail frame to server disk for permanent lightweight URL
    let finalThumbUrl = generatedThumb || targetVideoToReplace.thumbnail_url || '';
    if (generatedThumb && generatedThumb.startsWith('data:')) {
      try {
        const thumbRes = await fetch('/api/upload-gallery-thumbnail', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: safeId,
            dataUrl: generatedThumb,
          }),
        });
        if (thumbRes.ok) {
          const tData = await thumbRes.json();
          if (tData?.thumbnailUrl) {
            finalThumbUrl = tData.thumbnailUrl;
          }
        }
      } catch (tErr) {
        console.warn('Notice saving thumbnail on server:', tErr);
      }
    }

    // 3. Immediately store in browser IndexedDB for permanent local persistence
    if (selectedFile) {
      try {
        await storeGalleryVideoBlob(targetId, selectedFile);
        localBlobUrl = URL.createObjectURL(selectedFile);
        setBlobUrlMap((prev) => ({
          ...prev,
          [targetId]: localBlobUrl!,
          [safeId]: localBlobUrl!,
        }));
      } catch (idbErr) {
        console.warn('IndexedDB write notice:', idbErr);
      }
    }

    // 4. Upload raw binary buffer to server binary endpoint for persistent disk storage
    let finalVideoUrl = replaceVideoUrl || targetVideoToReplace.video_url || `/videos/${safeId}.mp4?v=${Date.now()}`;
    if (selectedFile) {
      try {
        const buffer = await selectedFile.arrayBuffer();
        const res = await fetch(`/api/upload-gallery-video?id=${encodeURIComponent(safeId)}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/octet-stream',
            'x-video-id': targetId,
          },
          body: buffer,
        });
        if (res.ok) {
          const data = await res.json();
          if (data?.videoUrl) {
            finalVideoUrl = data.videoUrl;
          }
        }
      } catch (err) {
        console.warn('Server upload notice (using fallback server path):', err);
      }
    }

    // 5. Construct replacement data with persistent URLs, thumbnail frame, and custom framing
    const updatedReplacement: Partial<VideoSample> = {
      id: targetId,
      title: replaceTitle.trim() || targetVideoToReplace.title,
      prompt: replacePrompt.trim() || targetVideoToReplace.prompt,
      model: replaceModel,
      aspect_ratio: replaceRatio,
      video_url: finalVideoUrl,
      thumbnail_url: finalThumbUrl,
      hasVideo: true,
      isCustomReplaced: true,
      objectFit: replaceFit,
      objectPositionX: replacePosX,
      objectPositionY: replacePosY,
      zoomScale: replaceZoom,
    };

    // 6. Sync metadata to server manifest and Firestore for permanent cross-session retention
    try {
      // Sync to server manifest
      await fetch('/api/save-gallery-replacement-meta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: targetId,
          metadata: updatedReplacement,
        }),
      });

      // Sync to Firestore for permanent persistence
      try {
        await setDoc(doc(db, 'gallery_replacements', targetId), {
          ...updatedReplacement,
          updated_at: new Date().toISOString(),
        });
      } catch (fsErr) {
        console.warn('Notice syncing replacement to Firestore:', fsErr);
        if (fsErr instanceof Error && fsErr.message.includes('permission')) {
          handleFirestoreError(fsErr, OperationType.WRITE, `gallery_replacements/${targetId}`);
        }
      }
    } catch (saveErr) {
      console.error('Notice syncing metadata to server:', saveErr);
      setModalNotice('⚠️ Notice saving cloud copy. Local version saved.');
    }

    // 7. Update replacedVideos map and persist to localStorage
    const newReplacedMap = {
      ...replacedVideos,
      [targetId]: updatedReplacement,
      [safeId]: updatedReplacement,
    };

    setReplacedVideos(newReplacedMap);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('nexverze_replaced_gallery_videos', JSON.stringify(newReplacedMap));
      } catch (e) {
        console.warn('LocalStorage save error:', e);
      }
    }

    setIsUploading(false);
    setReplaceSuccess(true);
    setModalNotice(null);

    // Auto-close modal after brief celebration
    setTimeout(() => {
      setReplaceSuccess(false);
      setTargetVideoToReplace(null);
      setGalleryNotice(`✅ Successfully uploaded & replaced video for: "${updatedReplacement.title}" (Permanent across all visitors)`);
      setTimeout(() => setGalleryNotice(null), 4000);
    }, 1000);
  };

  // Revert a replaced video back to its original default slot
  const handleRevertToOriginal = async (videoId: string, title: string) => {
    const updated = { ...replacedVideos };
    delete updated[videoId];
    setReplacedVideos(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('nexverze_replaced_gallery_videos', JSON.stringify(updated));
    }

    // Clear from in-memory blob map and IndexedDB
    const safeId = videoId.replace(/[^a-zA-Z0-9_-]/g, '_');
    await deleteGalleryVideoBlob(safeId);
    setBlobUrlMap((prev) => {
      const next = { ...prev };
      delete next[videoId];
      return next;
    });

    // Notify server to remove static file if present
    fetch(`/api/upload-gallery-video?id=${encodeURIComponent(safeId)}`, {
      method: 'DELETE',
    }).catch(() => {});

    // Remove from Firestore
    try {
      await deleteDoc(doc(db, 'gallery_replacements', videoId));
    } catch (e) {
      console.warn('Notice removing from Firestore:', e);
      if (e instanceof Error && e.message.includes('permission')) {
        handleFirestoreError(e, OperationType.DELETE, `gallery_replacements/${videoId}`);
      }
    }

    setTargetVideoToReplace(null);
    setGalleryNotice(`🔄 Reset "${title}" to default showcase slot.`);
    setTimeout(() => setGalleryNotice(null), 3500);
  };

  // Toggle Creator Mode (Show to Me)
  const toggleCreatorMode = () => {
    const next = !isCreatorMode;
    setIsCreatorMode(next);
    if (typeof window !== 'undefined') {
      localStorage.setItem('nexverze_gallery_creator_mode', String(next));
    }
    setGalleryNotice(
      next
        ? '👑 Creator Mode Enabled: Upload & Replace button is now visible on each video.'
        : '👁️ Visitor Mode: Upload & Replace buttons are now hidden.'
    );
    setTimeout(() => setGalleryNotice(null), 3500);
  };

  // Share video helper
  const handleShareVideo = (video: VideoSample) => {
    if (navigator.share) {
      navigator
        .share({
          title: video.title,
          text: `Check out "${video.title}" generated on NexVerze AI Studio! Prompt: ${video.prompt}`,
          url: window.location.href,
        })
        .catch(() => {});
    } else {
      navigator.clipboard?.writeText(
        `NexVerze AI Studio Creation: "${video.title}"\nPrompt: ${video.prompt}\n${window.location.href}`
      );
      setGalleryNotice(`📋 Copied details & link for "${video.title}" to clipboard!`);
      setTimeout(() => setGalleryNotice(null), 3500);
    }
  };

  // Color Grading CSS Filter mapping
  const COLOR_FILTER_MAP: Record<ColorGradingPreset, string> = {
    'Normal': 'none',
    'Film Noir': 'grayscale(100%) contrast(155%) brightness(92%)',
    'Vibrant': 'saturate(180%) contrast(115%) brightness(104%)',
    'Vintage': 'sepia(45%) contrast(95%) saturate(85%) hue-rotate(-10deg) brightness(105%)',
    'Cyberpunk': 'hue-rotate(285deg) saturate(185%) contrast(135%) brightness(105%)',
    'Cold Sci-Fi': 'hue-rotate(185deg) saturate(130%) contrast(120%) brightness(95%)',
    'Warm Cinema': 'sepia(25%) saturate(140%) contrast(110%) brightness(102%)',
  };

  const formatTimecode = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const getMotionLabel = (val: number) => {
    if (val <= 3) return 'Subtle';
    if (val <= 6) return 'Balanced';
    if (val <= 8) return 'Cinematic';
    return 'Hyper';
  };

  // Render individual Showcase Video Card with full Home Page Preview Panel features & options
  const renderVideoCard = (video: VideoSample & { isCustomReplaced?: boolean; hasVideo?: boolean }) => {
    return (
      <ShowcaseVideoCard
        key={video.id}
        video={video}
        activeVideoSrc={blobUrlMap[video.id] || blobUrlMap[video.id.replace(/[^a-zA-Z0-9_-]/g, '_')] || video.video_url}
        isPlaying={playingVideoId === video.id}
        onTogglePlay={() => setPlayingVideoId(playingVideoId === video.id ? null : video.id)}
        showCreatorButtons={showCreatorButtons}
        onOpenReplaceModal={handleOpenReplaceModal}
        onRevertToOriginal={handleRevertToOriginal}
        onRemixVideo={onRemixVideo}
        onOpenStudioModal={(v) => setStudioModalVideo(v)}
        onShareVideo={handleShareVideo}
        setGalleryNotice={setGalleryNotice}
        isFreeUser={isFreeUser}
        onOpenPlans={onOpenPlans}
        currentUserEmail={currentUserEmail}
        COLOR_FILTER_MAP={COLOR_FILTER_MAP}
        formatTimecode={formatTimecode}
        getMotionLabel={getMotionLabel}
      />
    );
  };

  return (
    <section id="showcase-gallery" className="space-y-8 pt-6 pb-6 scroll-mt-24">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-purple-500/20 pb-4">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/20 via-purple-500/20 to-pink-500/20 border border-amber-400/30 text-amber-300 text-xs font-bold mono uppercase tracking-wider">
            <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400 animate-pulse" />
            <span>High-Fidelity Showcase & Sample Gallery</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Explore Viral AI Video Reels
          </h2>
          <p className="text-xs sm:text-sm text-white/60 max-w-2xl">
            Watch community creations rendered in 4K Quality Lock across <strong className="text-purple-300">9:16 Vertical</strong>, <strong className="text-pink-300">16:9 Widescreen</strong>, and <strong className="text-indigo-300">1:1 Square</strong> formats! Click <strong className="text-purple-300">"Remix"</strong> to auto-fill prompts directly into your Studio editor.
          </p>
        </div>

        {/* Action Controls: "Only Show to Me" Creator Toggle + Create Video Button */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          {/* Creator Toggle (ONLY shown in Live Preview for creator) */}
          {isLivePreview && (
            <button
              type="button"
              onClick={toggleCreatorMode}
              className={`px-3 py-2 rounded-2xl border text-xs font-bold mono flex items-center gap-2 transition-all cursor-pointer shadow-md active:scale-95 ${
                isCreatorMode
                  ? 'bg-amber-500/20 border-amber-400/50 text-amber-300 hover:bg-amber-500/30 shadow-amber-950/40 ring-1 ring-amber-400/30'
                  : 'bg-[#121020] border-[#272738] text-white/60 hover:text-white hover:border-purple-500/40'
              }`}
              title="Toggle Live Preview Creator Mode (Upload & Replace controls)"
            >
              {isCreatorMode ? (
                <Eye className="w-3.5 h-3.5 text-amber-400" />
              ) : (
                <EyeOff className="w-3.5 h-3.5 text-white/40" />
              )}
              <span>{isCreatorMode ? 'Live Preview: Creator Mode (ON)' : 'Preview as Visitor (Uploads Hidden)'}</span>
              <span
                className={`w-2 h-2 rounded-full ${
                  isCreatorMode ? 'bg-amber-400 animate-pulse' : 'bg-white/30'
                }`}
              />
            </button>
          )}

          {onOpenStudioWithMode && (
            <button
              type="button"
              onClick={() => onOpenStudioWithMode('text')}
              className="px-4 py-2 rounded-2xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-xs font-extrabold shadow-lg shadow-purple-900/40 flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
            >
              <Sparkles className="w-4 h-4 fill-white" />
              <span>Create Your Video</span>
            </button>
          )}
        </div>
      </div>

      {/* Global Gallery Notice Toast */}
      {galleryNotice && (
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-950/90 via-[#16122c] to-indigo-950/90 border border-purple-500/40 text-purple-200 text-xs mono flex items-center justify-between shadow-xl animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{galleryNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setGalleryNotice(null)}
            className="text-white/50 hover:text-white p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Aspect Ratio & Layout Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1 text-xs mono">
        <button
          type="button"
          onClick={() => setActiveFormatTab('all')}
          className={`px-3.5 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer border ${
            activeFormatTab === 'all'
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-purple-400 shadow-md'
              : 'bg-[#121020] text-white/60 border-[#272738] hover:text-white'
          }`}
        >
          All Formats by Section
        </button>
        <button
          type="button"
          onClick={() => setActiveFormatTab('9:16')}
          className={`px-3.5 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer border flex items-center gap-1.5 ${
            activeFormatTab === '9:16'
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-purple-400 shadow-md'
              : 'bg-[#121020] text-white/60 border-[#272738] hover:text-white'
          }`}
        >
          <Smartphone className="w-3.5 h-3.5 text-purple-400" />
          <span>9:16 Vertical Reels</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveFormatTab('1:1')}
          className={`px-3.5 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer border flex items-center gap-1.5 ${
            activeFormatTab === '1:1'
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-purple-400 shadow-md'
              : 'bg-[#121020] text-white/60 border-[#272738] hover:text-white'
          }`}
        >
          <Square className="w-3.5 h-3.5 text-indigo-400" />
          <span>1:1 Square (4 Slots)</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveFormatTab('16:9')}
          className={`px-3.5 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer border flex items-center gap-1.5 ${
            activeFormatTab === '16:9'
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-purple-400 shadow-md'
              : 'bg-[#121020] text-white/60 border-[#272738] hover:text-white'
          }`}
        >
          <Tv className="w-3.5 h-3.5 text-pink-400" />
          <span>16:9 Widescreen (4 Slots)</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveFormatTab('bento')}
          className={`px-3.5 py-1.5 rounded-xl font-extrabold transition-all whitespace-nowrap cursor-pointer border flex items-center gap-1.5 ${
            activeFormatTab === 'bento'
              ? 'bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 text-white border-fuchsia-400 shadow-md ring-1 ring-fuchsia-400/50'
              : 'bg-[#121020] text-purple-300/80 border-[#272738] hover:text-white hover:border-purple-500/40'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-300 fill-amber-300 animate-pulse" />
          <span>🍱 Dynamic Bento Grid (Magazine)</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* DYNAMIC BENTO / FLUID MASONRY SHOWCASE GRID                               */}
      {/* ========================================================================= */}
      {activeFormatTab === 'bento' && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <div className="flex items-center justify-between border-b border-purple-500/15 pb-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white">
                <Sparkles className="w-4 h-4 fill-white" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2 flex-wrap">
                  <span>Dynamic Bento Showcase</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30 font-mono font-bold">
                    Magazine Layout • 16:9 + 9:16 + 1:1
                  </span>
                </h3>
                <p className="text-[11px] text-white/50">
                  Fluid editorial layout interleaving cinematic widescreen banners with mobile vertical reels and ambient back-glow.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 items-start">
            {bentoVideos.map((video, idx) => {
              const isWide = video.aspect_ratio === '16:9';
              return (
                <div
                  key={`bento-card-${video.id}-${idx}`}
                  className={isWide ? 'sm:col-span-2' : ''}
                >
                  {renderVideoCard(video)}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ROW 1: 9:16 VERTICAL REELS (FIRST ROW: 4 VIDEOS)                          */}
      {/* ========================================================================= */}
      {(activeFormatTab === 'all' || activeFormatTab === '9:16') && (
        <div className="space-y-3.5">
          <div className="flex items-center justify-between border-b border-purple-500/15 pb-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-300">
                <Smartphone className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                  <span>9:16 Vertical Reels</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-mono">
                    Shorts & Stories
                  </span>
                </h3>
                <p className="text-[11px] text-white/50">
                  Optimized for mobile viewing, Instagram Reels & TikTok.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {(activeFormatTab === 'all' ? videos916.slice(0, 4) : videos916).map((video) => renderVideoCard(video))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ROW 2: 1:1 SQUARE VIDEOS (SECOND ROW: 4 VIDEOS)                           */}
      {/* ========================================================================= */}
      {(activeFormatTab === 'all' || activeFormatTab === '1:1') && (
        <div className="space-y-3.5 pt-2">
          <div className="flex items-center justify-between border-b border-indigo-500/15 pb-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-300">
                <Square className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                  <span>1:1 Square Showcase</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono">
                    4 Slots • Instagram & Social Feeds
                  </span>
                </h3>
                <p className="text-[11px] text-white/50">
                  Square 1:1 format optimized for Instagram posts and social media feeds.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {videos11.map((video) => renderVideoCard(video))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ROW 3: 16:9 WIDESCREEN VIDEOS (THIRD ROW: 4 VIDEOS)                       */}
      {/* ========================================================================= */}
      {(activeFormatTab === 'all' || activeFormatTab === '16:9') && (
        <div className="space-y-3.5 pt-2">
          <div className="flex items-center justify-between border-b border-pink-500/15 pb-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-pink-500/20 text-pink-300">
                <Tv className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                  <span>16:9 Widescreen Showcase</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30 font-mono">
                    4 Slots • Cinema & YouTube
                  </span>
                </h3>
                <p className="text-[11px] text-white/50">
                  Landscape 16:9 widescreen format for cinematic storytelling and YouTube.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {videos169.map((video) => renderVideoCard(video))}
          </div>
        </div>
      )}

      {/* Preserve remaining 9:16 videos below Row 3 when viewing All Formats so nothing is deleted */}
      {activeFormatTab === 'all' && videos916.length > 4 && (
        <div className="space-y-3.5 pt-2">
          <div className="flex items-center justify-between border-b border-purple-500/15 pb-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-300">
                <Smartphone className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                  <span>More 9:16 Vertical Reels</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-mono">
                    Shorts & Stories
                  </span>
                </h3>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {videos916.slice(4).map((video) => renderVideoCard(video))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: UPLOAD & REPLACE SPECIFIC VIDEO (Shows only on click)              */}
      {/* ========================================================================= */}
      {targetVideoToReplace && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-[#121020] border border-amber-500/40 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="p-5 border-b border-[#272738] flex items-center justify-between bg-gradient-to-r from-[#18152c] to-[#121020]">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40 text-[10px] font-bold mono uppercase">
                    Slot: {targetVideoToReplace.aspect_ratio}
                  </span>
                  {replacedVideos[targetVideoToReplace.id] && (
                    <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-bold mono">
                      Previously Replaced
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                  <Upload className="w-5 h-5 text-amber-400" />
                  <span>Upload & Replace Video</span>
                </h3>
                <p className="text-xs text-white/60">
                  Target: <strong className="text-white">{targetVideoToReplace.title}</strong>
                </p>
              </div>

              <button
                type="button"
                onClick={() => setTargetVideoToReplace(null)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSaveVideoReplacement} className="p-5 space-y-4 overflow-y-auto custom-scrollbar flex-1">
              {modalNotice && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-400/40 text-amber-200 text-xs mono flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-amber-400" />
                  <span>{modalNotice}</span>
                </div>
              )}

              {/* Video File Picker & Interactive Fit/Framing Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-white/80 mono flex items-center gap-1.5">
                    <Film className="w-3.5 h-3.5 text-amber-400" />
                    <span>Video File (MP4, WebM, MOV) *</span>
                  </label>
                  {replaceVideoUrl && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-2.5 py-1 rounded-lg bg-[#1e1a38] hover:bg-[#28224d] text-amber-300 border border-amber-400/40 text-[11px] font-bold mono flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Upload className="w-3 h-3" />
                      <span>{replaceFileName ? 'Change Video File' : 'Upload New File'}</span>
                    </button>
                  )}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime,video/*"
                  onChange={handleVideoFileChange}
                  className="hidden"
                />

                {!replaceVideoUrl ? (
                  /* Initial Upload Dropzone when no video is loaded */
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all border-purple-500/30 hover:border-amber-400/60 bg-[#17142b]/60 hover:bg-[#1c1836]"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-400/30 flex items-center justify-center text-amber-400 mx-auto mb-2">
                      <Upload className="w-6 h-6 animate-bounce" />
                    </div>
                    <p className="text-xs font-bold text-white">Click to browse or drag & drop video</p>
                    <p className="text-[11px] text-white/50 mono mt-0.5">Supports 1080p / 4K MP4, WebM, QuickTime up to 250MB</p>
                  </div>
                ) : (
                  /* Interactive Video Fit & Move/Drag Framing Viewport */
                  <div className="p-3.5 rounded-2xl bg-[#0d0b1a] border border-[#272244] space-y-3.5">
                    <div className="flex items-center justify-between text-[11px] mono">
                      <span className="text-amber-300 font-bold flex items-center gap-1.5">
                        <Move className="w-3.5 h-3.5 text-amber-400" />
                        <span>Interactive Framing (Move / Drag)</span>
                      </span>
                      <span className="text-white/60">
                        {replaceFileName || 'Video Loaded'}
                      </span>
                    </div>

                    {/* Draggable Viewport Container matching target Aspect Ratio */}
                    <div className="flex flex-col items-center justify-center py-1">
                      <div
                        onPointerDown={handleFramingPointerDown}
                        onPointerMove={handleFramingPointerMove}
                        onPointerUp={handleFramingPointerUp}
                        onPointerCancel={handleFramingPointerUp}
                        className={`relative rounded-2xl overflow-hidden bg-black border-2 select-none touch-none transition-all shadow-2xl ${
                          isDraggingFraming
                            ? 'border-amber-400 ring-4 ring-amber-400/30 cursor-grabbing scale-[1.01]'
                            : 'border-amber-500/50 hover:border-amber-400 cursor-grab'
                        }`}
                        style={{
                          width:
                            replaceRatio === '9:16'
                              ? '190px'
                              : replaceRatio === '1:1'
                              ? '230px'
                              : '320px',
                          maxWidth: '100%',
                          aspectRatio:
                            replaceRatio === '9:16'
                              ? '9/16'
                              : replaceRatio === '1:1'
                              ? '1/1'
                              : '16/9',
                        }}
                      >
                        <video
                          src={replaceVideoUrl}
                          autoPlay
                          loop
                          muted
                          playsInline
                          style={{
                            objectFit: replaceFit,
                            objectPosition: `${replacePosX}% ${replacePosY}%`,
                            transform: replaceZoom !== 1 ? `scale(${replaceZoom})` : undefined,
                            transformOrigin: `${replacePosX}% ${replacePosY}%`,
                          }}
                          className="w-full h-full pointer-events-none select-none transition-transform duration-75"
                        />

                        {/* Drag Status Badges */}
                        <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none z-10">
                          <span className="px-2 py-0.5 rounded-full bg-black/80 backdrop-blur-md text-amber-300 text-[10px] font-bold mono border border-amber-400/40 flex items-center gap-1 shadow">
                            <Move className="w-3 h-3 text-amber-400 animate-pulse" />
                            <span>Drag: ↕ Up/Down • ↔ Left/Right</span>
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-black/80 backdrop-blur-md text-white font-mono text-[10px] border border-white/20 shadow">
                            {replacePosX}% X • {replacePosY}% Y
                          </span>
                        </div>

                        {/* Interactive Grid / Crosshair Guide Lines */}
                        <div className={`absolute inset-0 pointer-events-none border border-white/20 transition-opacity ${isDraggingFraming ? 'opacity-70' : 'opacity-20'}`}>
                          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/30 -translate-x-1/2" />
                          <div className="absolute top-1/2 left-0 right-0 h-px bg-white/30 -translate-y-1/2" />
                        </div>
                      </div>
                    </div>

                    {/* Directional Nudge Buttons (Move Up, Move Down, Move Left, Move Right) */}
                    <div className="space-y-2 pt-1 border-t border-[#1f1b36]">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-white/80 mono flex items-center gap-1">
                          <Sliders className="w-3 h-3 text-purple-400" />
                          <span>Move Up / Down & Left / Right Options:</span>
                        </span>
                        <button
                          type="button"
                          onClick={resetFraming}
                          className="text-[10px] font-bold text-amber-400 hover:text-amber-300 mono underline cursor-pointer"
                        >
                          Reset to Center
                        </button>
                      </div>

                      {/* Directional Nudge Bar */}
                      <div className="grid grid-cols-5 gap-1.5">
                        <button
                          type="button"
                          onClick={() => nudgeFraming('left')}
                          className="py-1.5 px-2 rounded-xl bg-[#17142b] hover:bg-amber-500/20 text-white hover:text-amber-300 border border-[#2e2a4a] text-[11px] font-bold mono flex items-center justify-center gap-1 transition-all cursor-pointer active:scale-95"
                          title="Move Left (-5% X)"
                        >
                          <ArrowLeft className="w-3 h-3" />
                          <span>Left</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => nudgeFraming('right')}
                          className="py-1.5 px-2 rounded-xl bg-[#17142b] hover:bg-amber-500/20 text-white hover:text-amber-300 border border-[#2e2a4a] text-[11px] font-bold mono flex items-center justify-center gap-1 transition-all cursor-pointer active:scale-95"
                          title="Move Right (+5% X)"
                        >
                          <span>Right</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => nudgeFraming('up')}
                          className="py-1.5 px-2 rounded-xl bg-[#17142b] hover:bg-amber-500/20 text-white hover:text-amber-300 border border-[#2e2a4a] text-[11px] font-bold mono flex items-center justify-center gap-1 transition-all cursor-pointer active:scale-95"
                          title="Move Up (-5% Y)"
                        >
                          <ArrowUp className="w-3 h-3" />
                          <span>Up</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => nudgeFraming('down')}
                          className="py-1.5 px-2 rounded-xl bg-[#17142b] hover:bg-amber-500/20 text-white hover:text-amber-300 border border-[#2e2a4a] text-[11px] font-bold mono flex items-center justify-center gap-1 transition-all cursor-pointer active:scale-95"
                          title="Move Down (+5% Y)"
                        >
                          <span>Down</span>
                          <ArrowDown className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={resetFraming}
                          className="py-1.5 px-2 rounded-xl bg-purple-900/30 hover:bg-purple-900/50 text-purple-200 border border-purple-500/30 text-[11px] font-bold mono flex items-center justify-center gap-1 transition-all cursor-pointer active:scale-95"
                          title="Center framing"
                        >
                          <span>Center</span>
                        </button>
                      </div>

                      {/* Fit Mode Toggle & Zoom */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        {/* Fit Mode (Cover vs Contain) */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-white/70 mono flex items-center gap-1">
                            <Crop className="w-3 h-3 text-purple-400" />
                            <span>Fit Mode:</span>
                          </label>
                          <div className="grid grid-cols-2 gap-1.5">
                            <button
                              type="button"
                              onClick={() => setReplaceFit('cover')}
                              className={`py-1.5 px-2 rounded-xl text-[10px] font-bold mono border transition-all cursor-pointer ${
                                replaceFit === 'cover'
                                  ? 'bg-amber-500/20 text-amber-300 border-amber-400'
                                  : 'bg-[#151226] text-white/60 border-[#272142] hover:text-white'
                              }`}
                            >
                              Cover (Fill & Crop)
                            </button>
                            <button
                              type="button"
                              onClick={() => setReplaceFit('contain')}
                              className={`py-1.5 px-2 rounded-xl text-[10px] font-bold mono border transition-all cursor-pointer ${
                                replaceFit === 'contain'
                                  ? 'bg-amber-500/20 text-amber-300 border-amber-400'
                                  : 'bg-[#151226] text-white/60 border-[#272142] hover:text-white'
                              }`}
                            >
                              Contain (Fit Whole)
                            </button>
                          </div>
                        </div>

                        {/* Zoom / Scale Slider */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[10px] font-bold text-white/70 mono">
                            <span className="flex items-center gap-1">
                              <Maximize2 className="w-3 h-3 text-purple-400" />
                              <span>Zoom / Scale:</span>
                            </span>
                            <span className="text-amber-300">{Math.round(replaceZoom * 100)}%</span>
                          </div>
                          <input
                            type="range"
                            min="1"
                            max="1.6"
                            step="0.05"
                            value={replaceZoom}
                            onChange={(e) => setReplaceZoom(Number(e.target.value))}
                            className="w-full accent-amber-400 cursor-pointer"
                          />
                        </div>
                      </div>

                      {/* Precise Vertical & Horizontal Sliders */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        {/* Vertical Move (Up / Down) */}
                        <div className="space-y-1 bg-[#131024] p-2 rounded-xl border border-[#231e3d]">
                          <div className="flex items-center justify-between text-[10px] font-bold mono">
                            <span className="text-white/80">Vertical (Up/Down):</span>
                            <span className="text-amber-300">{replacePosY}%</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            step="1"
                            value={replacePosY}
                            onChange={(e) => setReplacePosY(Number(e.target.value))}
                            className="w-full accent-amber-400 cursor-pointer"
                          />
                          <div className="flex justify-between text-[9px] text-white/40 mono">
                            <span>Top (0%)</span>
                            <span>Center (50%)</span>
                            <span>Bottom (100%)</span>
                          </div>
                        </div>

                        {/* Horizontal Move (Left / Right) */}
                        <div className="space-y-1 bg-[#131024] p-2 rounded-xl border border-[#231e3d]">
                          <div className="flex items-center justify-between text-[10px] font-bold mono">
                            <span className="text-white/80">Horizontal (Left/Right):</span>
                            <span className="text-amber-300">{replacePosX}%</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            step="1"
                            value={replacePosX}
                            onChange={(e) => setReplacePosX(Number(e.target.value))}
                            className="w-full accent-amber-400 cursor-pointer"
                          />
                          <div className="flex justify-between text-[9px] text-white/40 mono">
                            <span>Left (0%)</span>
                            <span>Center (50%)</span>
                            <span>Right (100%)</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Title Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-white/80 mono">Video Title</label>
                <input
                  type="text"
                  value={replaceTitle}
                  onChange={(e) => setReplaceTitle(e.target.value)}
                  placeholder="e.g., Cyberpunk Monsoon Tokyo Night"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#17142b] border border-[#2e2a4a] text-white text-xs focus:border-amber-400 focus:outline-none mono"
                />
              </div>

              {/* Prompt Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-white/80 mono">Prompt Description (For Remix)</label>
                <textarea
                  value={replacePrompt}
                  onChange={(e) => setReplacePrompt(e.target.value)}
                  rows={2}
                  placeholder="Cinematic drone shot with volumetric atmospheric rays, 8k hyperrealism..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#17142b] border border-[#2e2a4a] text-white text-xs focus:border-amber-400 focus:outline-none resize-none"
                />
              </div>

              {/* Model & Aspect Ratio Selectors */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-white/80 mono">AI Engine Badge</label>
                  <select
                    value={replaceModel}
                    onChange={(e) => setReplaceModel(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-[#17142b] border border-[#2e2a4a] text-white text-xs mono focus:border-amber-400 focus:outline-none"
                  >
                    <option value="ltx">LTX-Video (15cr • Fast & ₹10.50)</option>
                    <option value="luma">Luma Ray 3 (50cr • ₹35)</option>
                    <option value="wan">Wan 2.1 (45cr • Zero Watermark • ₹31.50)</option>
                    <option value="hunyuan">HunyuanVideo (65cr • 720p Pro • ₹45.50)</option>
                    <option value="kling">Kling Pro (50cr • ₹35)</option>
                    <option value="veo3">Veo Ultra (75cr • 4K • ₹52.50)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-white/80 mono">Aspect Ratio</label>
                  <select
                    value={replaceRatio}
                    onChange={(e) => setReplaceRatio(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-[#17142b] border border-[#2e2a4a] text-white text-xs mono focus:border-amber-400 focus:outline-none"
                  >
                    <option value="9:16">9:16 Vertical Reel</option>
                    <option value="16:9">16:9 Widescreen</option>
                    <option value="1:1">1:1 Square</option>
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-[#272738] flex items-center justify-between gap-3">
                {replacedVideos[targetVideoToReplace.id] ? (
                  <button
                    type="button"
                    onClick={() => handleRevertToOriginal(targetVideoToReplace.id, targetVideoToReplace.title)}
                    className="px-3.5 py-2.5 rounded-xl border border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-bold mono flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Revert to Default</span>
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setTargetVideoToReplace(null)}
                    className="px-4 py-2.5 rounded-xl bg-[#181528] hover:bg-[#221e38] text-white/70 hover:text-white text-xs font-bold mono cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={isUploading || (!selectedFile && !replaceVideoUrl)}
                    className={`px-5 py-2.5 rounded-xl text-xs font-extrabold mono flex items-center gap-2 shadow-lg transition-all cursor-pointer ${
                      replaceSuccess
                        ? 'bg-emerald-500 text-black'
                        : isUploading || (!selectedFile && !replaceVideoUrl)
                        ? 'bg-amber-500/40 text-black/60 cursor-not-allowed'
                        : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black shadow-amber-950/40 active:scale-95'
                    }`}
                  >
                    {isUploading ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-black/40 border-t-black rounded-full animate-spin" />
                        <span>Saving Video...</span>
                      </>
                    ) : replaceSuccess ? (
                      <>
                        <Check className="w-4 h-4 text-black" />
                        <span>Saved Successfully!</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        <span>Save & Replace Video</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: FULL STUDIO PLAYER VIEW (Expands any showcase video into QualityLockPlayer) */}
      {/* ========================================================================= */}
      {studioModalVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-xl animate-in fade-in overflow-y-auto">
          <div className="relative w-full max-w-4xl bg-[#0f0d1b] border border-purple-500/40 rounded-3xl p-4 sm:p-6 shadow-2xl space-y-4 my-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-purple-500/20 pb-3">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-purple-600/30 text-purple-300 border border-purple-400/40 text-[10px] font-bold mono uppercase">
                  Studio Player View • {studioModalVideo.aspect_ratio}
                </span>
                <h3 className="text-sm sm:text-base font-bold text-white line-clamp-1">
                  {studioModalVideo.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setStudioModalVideo(null)}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-all cursor-pointer"
                title="Close Studio View"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quality-Locked Player with complete Home Page Preview features */}
            <QualityLockPlayer
              videoUrl={
                blobUrlMap[studioModalVideo.id] ||
                blobUrlMap[studioModalVideo.id.replace(/[^a-zA-Z0-9_-]/g, '_')] ||
                studioModalVideo.video_url
              }
              aspectRatio={studioModalVideo.aspect_ratio}
              title={studioModalVideo.title}
              modelName={studioModalVideo.model.toUpperCase()}
              duration={studioModalVideo.duration}
              timestamp={studioModalVideo.created_at}
              prompt={studioModalVideo.prompt}
              isFreeUser={isFreeUser}
              user={user}
              onOpenPlans={onOpenPlans}
              onRemix={(config) => {
                setStudioModalVideo(null);
                onRemixVideo({
                  ...studioModalVideo,
                  ...config,
                });
              }}
            />
          </div>
        </div>
      )}
    </section>
  );
};
