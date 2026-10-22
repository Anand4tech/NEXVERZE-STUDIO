import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  ImageIcon,
  Wand2,
  ArrowRight,
  CheckCircle2,
  Volume2,
  VolumeX,
  Upload,
  Sliders,
  Check,
  X,
  RotateCcw,
  Download,
  Smartphone,
  Tv,
  Square,
  Play,
  Pause,
  Eye,
  EyeOff,
  Film,
  Move,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  Crop,
  Maximize2,
  Save,
} from 'lucide-react';
import {
  storeGalleryVideoBlob,
  loadGalleryVideoBlob,
  deleteGalleryVideoBlob,
} from '../lib/galleryStorage';
import { checkIsLivePreviewCreator } from './ShowcaseGallery';
import { enhancePrompt } from '../lib/promptEnhancer';

interface HeroSectionProps {
  onOpenStudioWithMode: (
    mode: 'text' | 'image' | 'mobile-to-cinematic',
    initialPrompt?: string,
    model?: string,
    ratio?: '9:16' | '16:9' | '1:1'
  ) => void;
  isStudioOpen: boolean;
  onRemixVideo?: (config?: {
    prompt?: string;
    modelName?: string;
    duration?: string;
    aspectRatio?: '9:16' | '16:9' | '1:1';
  }) => void;
  currentUserEmail?: string | null;
}

interface HomePreviewConfig {
  videoUrl: string;
  aspectRatio: '9:16' | '16:9' | '1:1';
  prompt: string;
  title: string;
  objectFit: 'cover' | 'contain';
  objectPositionX?: number;
  objectPositionY?: number;
  zoomScale?: number;
  isCustom: boolean;
}

const DEFAULT_HOME_PREVIEW: HomePreviewConfig = {
  videoUrl: '/videos/home-page-preview-panel-video.mp4',
  aspectRatio: '9:16',
  prompt: 'Cinematic vertical portrait of a beautiful young woman standing in a neon-lit futuristic cyberpunk city under gentle rain, translucent drops glistening on skin, high-tech glowing techwear collar, cinematic shallow depth of field, photorealistic 8k, volumetric bokeh lights',
  title: 'Cyberpunk Rain Reflection 4K Portrait',
  objectFit: 'cover',
  objectPositionX: 50,
  objectPositionY: 50,
  zoomScale: 1,
  isCustom: false,
};

const LUMA_VIRAL_PROMPT_SUGGESTIONS = [
  {
    icon: '🌧️',
    label: 'Cyberpunk Neon Rain',
    prompt: 'Cinematic 8k vertical portrait of a cyberpunk wanderer in reflective neon rain, Tokyo alleyway, glowing techwear, volumetric bokeh lights',
    model: 'luma' as const,
    ratio: '9:16' as const,
  },
  {
    icon: '🛕',
    label: 'Ancient Temple Drone',
    prompt: 'FPV drone flythrough of ancient South Indian temple gopuram towers at golden hour sunset, 8k volumetric light, photorealistic architectural hyper-detail',
    model: 'luma' as const,
    ratio: '9:16' as const,
  },
  {
    icon: '👰',
    label: 'Royal Indian Wedding',
    prompt: 'Cinematic 4K slow motion bride entry under floral canopy, velvet lehenga with real gold zardozi embroidery, fireworks bokeh, 60fps',
    model: 'kling' as const,
    ratio: '9:16' as const,
  },
  {
    icon: '🏜️',
    label: 'Desert Safari Drift',
    prompt: 'Epic high-speed rally 4x4 drifting across golden desert sand dunes at twilight, dust plumes illuminated by red taillights, cinematic IMAX 70mm',
    model: 'veo' as const,
    ratio: '16:9' as const,
  },
  {
    icon: '🏎️',
    label: 'Monaco Night Hypercar',
    prompt: 'Ultra-photorealistic glossy carbon fiber hypercar accelerating through Monaco tunnels, neon streaks, motion blur, 4K raytraced reflections',
    model: 'kling' as const,
    ratio: '16:9' as const,
  },
];

export const HeroSection: React.FC<HeroSectionProps> = ({
  onOpenStudioWithMode,
  isStudioOpen: _isStudioOpen,
  onRemixVideo,
  currentUserEmail,
}) => {
  // Live preview creator detection
  const isLivePreview = checkIsLivePreviewCreator(currentUserEmail);

  // Home Page Preview Panel configuration (persisted in localStorage + IndexedDB)
  const [previewConfig, setPreviewConfig] = useState<HomePreviewConfig>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('nexverze_home_preview_config');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && typeof parsed === 'object') {
            return {
              ...DEFAULT_HOME_PREVIEW,
              ...parsed,
            };
          }
        }
      } catch (err) {
        console.warn('Error loading home preview config:', err);
      }
    }
    return DEFAULT_HOME_PREVIEW;
  });

  // Audio on/off state - Default audio is OFF (muted for browser policy compliance)
  const [isAudioOff, setIsAudioOff] = useState<boolean>(true);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);

  // Loop video state - Default is ON (true)
  const [isAutoLoop, setIsAutoLoop] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('nexverze_home_auto_loop');
        return stored !== 'false'; // Default to true
      } catch (e) {
        console.error(e);
      }
    }
    return true;
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('nexverze_home_auto_loop', String(isAutoLoop));
    }
  }, [isAutoLoop]);

  // Creator Mode (Show to Me) toggle - ONLY available if isLivePreview is true
  const [isCreatorMode, setIsCreatorMode] = useState<boolean>(() => {
    if (!checkIsLivePreviewCreator(currentUserEmail)) return false;
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('nexverze_home_creator_mode');
        if (stored !== null) return stored === 'true';
      } catch (e) {
        console.error(e);
      }
    }
    return false; // Default to FALSE: Regular users see a clean, distraction-free cinematic presentation
  });

  const toggleCreatorMode = () => {
    if (!isLivePreview) return;
    const next = !isCreatorMode;
    setIsCreatorMode(next);
    if (typeof window !== 'undefined') {
      localStorage.setItem('nexverze_home_creator_mode', String(next));
    }
    showToast(
      next
        ? '👑 Creator Controls Enabled (Show to Me: ON)'
        : '👁️ User View Enabled: Clean cinematic presentation'
    );
  };

  // Live video source (from IndexedDB blob, server manifest, or static URL)
  const [liveVideoSrc, setLiveVideoSrc] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('nexverze_home_preview_config');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed?.videoUrl && !parsed.videoUrl.startsWith('blob:')) {
            return parsed.videoUrl;
          }
        }
      } catch {}
    }
    return DEFAULT_HOME_PREVIEW.videoUrl;
  });

  // Luma Prompt Command Bar states
  const [commandPrompt, setCommandPrompt] = useState<string>('');
  const [commandModel, setCommandModel] = useState<'luma' | 'kling' | 'veo'>('luma');
  const [commandRatio, setCommandRatio] = useState<'9:16' | '16:9' | '1:1'>('9:16');
  const [isEnhancingPrompt, setIsEnhancingPrompt] = useState<boolean>(false);

  // Modals
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Upload modal states
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadPreviewUrl, setUploadPreviewUrl] = useState<string | null>(null);
  const [uploadFileName, setUploadFileName] = useState<string | null>(null);
  const [isSavingUpload, setIsSavingUpload] = useState(false);
  const [uploadNotice, setUploadNotice] = useState<string | null>(null);

  // Framing Positioning States for Home Preview (Move Up/Down, Left/Right, Move/Drag)
  const [uploadFit, setUploadFit] = useState<'cover' | 'contain'>(previewConfig.objectFit || 'cover');
  const [uploadPosX, setUploadPosX] = useState<number>(previewConfig.objectPositionX ?? 50);
  const [uploadPosY, setUploadPosY] = useState<number>(previewConfig.objectPositionY ?? 50);
  const [uploadZoom, setUploadZoom] = useState<number>(previewConfig.zoomScale ?? 1);
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
      initPosX: uploadPosX,
      initPosY: uploadPosY,
    };
  };

  const handleFramingPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingFraming || !dragStartRef.current) return;
    const deltaX = e.clientX - dragStartRef.current.startX;
    const deltaY = e.clientY - dragStartRef.current.startY;
    const newX = Math.max(0, Math.min(100, Math.round(dragStartRef.current.initPosX - deltaX * 0.4)));
    const newY = Math.max(0, Math.min(100, Math.round(dragStartRef.current.initPosY - deltaY * 0.4)));
    setUploadPosX(newX);
    setUploadPosY(newY);
  };

  const handleFramingPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDraggingFraming(false);
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
    } catch {}
    dragStartRef.current = null;
  };

  const nudgeFraming = (dir: 'up' | 'down' | 'left' | 'right', amount: number = 5) => {
    if (dir === 'up') setUploadPosY((prev) => Math.max(0, prev - amount));
    if (dir === 'down') setUploadPosY((prev) => Math.min(100, prev + amount));
    if (dir === 'left') setUploadPosX((prev) => Math.max(0, prev - amount));
    if (dir === 'right') setUploadPosX((prev) => Math.min(100, prev + amount));
  };

  const resetFraming = () => {
    setUploadPosX(50);
    setUploadPosY(50);
    setUploadZoom(1);
    setUploadFit('cover');
  };

  // Save video movement / position directly from the preview panel
  const handleSavePositionDirectly = async () => {
    const updated: HomePreviewConfig = {
      ...previewConfig,
      objectFit: uploadFit,
      objectPositionX: uploadPosX,
      objectPositionY: uploadPosY,
      zoomScale: uploadZoom,
    };
    setPreviewConfig(updated);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('nexverze_home_preview_config', JSON.stringify(updated));
      } catch (e) {
        console.warn('LocalStorage save error:', e);
      }
    }

    try {
      await fetch('/api/save-gallery-replacement-meta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: 'home-preview-video',
          metadata: {
            title: updated.title,
            prompt: updated.prompt,
            aspect_ratio: updated.aspectRatio,
            object_fit: uploadFit,
            object_position_x: uploadPosX,
            object_position_y: uploadPosY,
            zoom_scale: uploadZoom,
            video_url: updated.videoUrl,
            isCustom: updated.isCustom,
          },
        }),
      });
    } catch (e) {
      console.warn('Server save warning:', e);
    }

    showToast(`✅ Saved video movement & position (X: ${uploadPosX}%, Y: ${uploadPosY}%)!`);
  };

  // Keep uploadPosX / Y in sync with previewConfig when previewConfig changes
  useEffect(() => {
    setUploadFit(previewConfig.objectFit || 'cover');
    setUploadPosX(previewConfig.objectPositionX ?? 50);
    setUploadPosY(previewConfig.objectPositionY ?? 50);
    setUploadZoom(previewConfig.zoomScale ?? 1);
  }, [previewConfig.objectFit, previewConfig.objectPositionX, previewConfig.objectPositionY, previewConfig.zoomScale]);

  // Edit modal states
  const [editRatio, setEditRatio] = useState<'9:16' | '16:9' | '1:1'>(previewConfig.aspectRatio);
  const [editFit, setEditFit] = useState<'cover' | 'contain'>(previewConfig.objectFit);
  const [editTitle, setEditTitle] = useState(previewConfig.title);
  const [editPrompt, setEditPrompt] = useState(previewConfig.prompt);
  const [editSuccessNotice, setEditSuccessNotice] = useState<string | null>(null);

  // Toast notice
  const [toastNotice, setToastNotice] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const uploadFileInputRef = useRef<HTMLInputElement>(null);

  // Load custom video blob from IndexedDB & server manifest on mount
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      // 1. Check server replacements manifest for saved home-preview-video
      try {
        const res = await fetch('/api/gallery-replacements');
        if (res.ok) {
          const data = await res.json();
          const homeSaved = data?.replacements?.['home-preview-video'];
          if (homeSaved?.video_url && isMounted) {
            setPreviewConfig((prev) => {
              const updated = {
                ...prev,
                videoUrl: homeSaved.video_url,
                isCustom: true,
              };
              try {
                localStorage.setItem('nexverze_home_preview_config', JSON.stringify(updated));
              } catch {}
              return updated;
            });
            setLiveVideoSrc(homeSaved.video_url);
          }
        }
      } catch (err) {
        console.warn('Notice checking server home preview:', err);
      }

      // 2. Load IndexedDB blob for instant local offline caching
      try {
        const blob = await loadGalleryVideoBlob('home-preview-video');
        if (blob && isMounted) {
          const objectUrl = URL.createObjectURL(blob);
          setLiveVideoSrc(objectUrl);
        }
      } catch (err) {
        console.warn('Could not load IndexedDB home preview blob:', err);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Ensure video auto-plays reliably without throwing unhandled promise rejections
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = isAudioOff;
    const playSafely = () => {
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => setIsPlaying(true))
          .catch((err) => {
            console.warn('Hero preview autoplay deferred:', err?.name || err);
            setIsPlaying(false);
          });
      }
    };

    video.addEventListener('canplay', playSafely, { once: true });
    if (video.readyState >= 2) {
      playSafely();
    }

    return () => {
      video.removeEventListener('canplay', playSafely);
    };
  }, [liveVideoSrc, isAudioOff]);

  // Sync edit modal state when opening
  useEffect(() => {
    if (isEditModalOpen) {
      setEditRatio(previewConfig.aspectRatio);
      setEditFit(previewConfig.objectFit);
      setEditTitle(previewConfig.title);
      setEditPrompt(previewConfig.prompt);
      setEditSuccessNotice(null);
    }
  }, [isEditModalOpen, previewConfig]);

  // Audio Toggle (Default audio is OFF)
  const toggleAudio = () => {
    const nextState = !isAudioOff;
    setIsAudioOff(nextState);
    if (videoRef.current) {
      videoRef.current.muted = nextState;
      if (!nextState) {
        videoRef.current.volume = 1.0;
        videoRef.current.play().catch(() => {});
      }
    }
    showToast(nextState ? '🔇 Audio Muted (OFF)' : '🔊 Audio Enabled (ON)');
  };

  // Change Aspect Ratio (9:16, 16:9, 1:1)
  const handleSelectAspectRatio = (ratio: '9:16' | '16:9' | '1:1') => {
    const updated: HomePreviewConfig = {
      ...previewConfig,
      aspectRatio: ratio,
    };
    setPreviewConfig(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('nexverze_home_preview_config', JSON.stringify(updated));
    }
    showToast(`📐 Aspect ratio switched to ${ratio}`);
  };

  const showToast = (msg: string) => {
    setToastNotice(msg);
    setTimeout(() => setToastNotice(null), 3000);
  };

  // Upload & Replace Video File Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      setUploadNotice('⚠️ Please select a valid video file (MP4, WebM, MOV).');
      return;
    }

    setUploadNotice(null);
    setUploadFile(file);
    setUploadFileName(`${file.name} (${(file.size / (1024 * 1024)).toFixed(1)} MB)`);
    const previewUrl = URL.createObjectURL(file);
    setUploadPreviewUrl(previewUrl);
  };

  // Save Uploaded Video (Upload & Replace)
  const handleSaveUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile && !uploadPreviewUrl) {
      setUploadNotice('⚠️ Please choose a video file to upload.');
      return;
    }

    setIsSavingUpload(true);
    setUploadNotice('Saving preview video to persistent storage...');

    let localUrl = uploadPreviewUrl || previewConfig.videoUrl;

    // 1. Save to IndexedDB
    if (uploadFile) {
      try {
        await storeGalleryVideoBlob('home-preview-video', uploadFile);
        localUrl = URL.createObjectURL(uploadFile);
      } catch (err) {
        console.warn('IndexedDB write warning:', err);
      }
    }

    // 2. Upload to server disk
    let serverUrl = `/videos/home-preview-video.mp4?v=${Date.now()}`;
    if (uploadFile) {
      try {
        const buffer = await uploadFile.arrayBuffer();
        const res = await fetch('/api/upload-gallery-video?id=home-preview-video', {
          method: 'POST',
          headers: { 'Content-Type': 'application/octet-stream' },
          body: buffer,
        });
        if (res.ok) {
          const data = await res.json();
          if (data?.videoUrl) {
            serverUrl = data.videoUrl;
          }
        }

        // Also sync to master reference video endpoint
        fetch('/api/upload-reference-video-binary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/octet-stream' },
          body: buffer,
        }).catch(() => {});
      } catch (err) {
        console.warn('Server upload fallback:', err);
      }
    }

    // 3. Update preview config
    const updated: HomePreviewConfig = {
      ...previewConfig,
      videoUrl: serverUrl,
      objectFit: uploadFit,
      objectPositionX: uploadPosX,
      objectPositionY: uploadPosY,
      zoomScale: uploadZoom,
      isCustom: true,
    };

    setPreviewConfig(updated);
    setLiveVideoSrc(localUrl || serverUrl);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('nexverze_home_preview_config', JSON.stringify(updated));
      } catch (e) {
        console.warn('LocalStorage save error:', e);
      }
    }

    // 4. Also sync metadata to server manifest
    try {
      fetch('/api/save-gallery-replacement-meta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: 'home-preview-video',
          metadata: {
            title: updated.title,
            prompt: updated.prompt,
            aspect_ratio: updated.aspectRatio,
            object_fit: uploadFit,
            object_position_x: uploadPosX,
            object_position_y: uploadPosY,
            zoom_scale: uploadZoom,
            video_url: serverUrl,
            isCustom: true,
          },
        }),
      }).catch(() => {});
    } catch {}

    setIsSavingUpload(false);
    setIsUploadModalOpen(false);
    setUploadFile(null);
    setUploadPreviewUrl(null);
    setUploadFileName(null);
    showToast('✅ Successfully replaced home preview video!');

    // Ensure video plays
    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.play().catch(() => {});
      }
    }, 200);
  };

  // Remix Video Handler
  const handleRemix = () => {
    if (onRemixVideo) {
      onRemixVideo({
        prompt: previewConfig.prompt,
        aspectRatio: previewConfig.aspectRatio,
        modelName: 'luma',
      });
    } else {
      onOpenStudioWithMode('text', previewConfig.prompt, 'luma', previewConfig.aspectRatio);
    }
  };

  // Save changes from Edit Modal
  const handleSaveEditChanges = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: HomePreviewConfig = {
      ...previewConfig,
      aspectRatio: editRatio,
      objectFit: editFit,
      objectPositionX: uploadPosX,
      objectPositionY: uploadPosY,
      zoomScale: uploadZoom,
      title: editTitle.trim() || previewConfig.title,
      prompt: editPrompt.trim() || previewConfig.prompt,
    };
    setPreviewConfig(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('nexverze_home_preview_config', JSON.stringify(updated));
    }
    setEditSuccessNotice('✅ Video settings saved successfully!');
    setTimeout(() => {
      setIsEditModalOpen(false);
      showToast(`✅ Video settings updated (${editRatio})`);
    }, 800);
  };

  // Download / Save Video File directly to user's device
  const handleDownloadVideo = () => {
    const a = document.createElement('a');
    a.href = liveVideoSrc;
    a.download = `nexverze-preview-${previewConfig.aspectRatio.replace(':', '-')}.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast('💾 Downloading video to device...');
  };

  // Revert back to default master video
  const handleRevertToDefault = async () => {
    await deleteGalleryVideoBlob('home-preview-video');
    fetch('/api/upload-gallery-video?id=home-preview-video', { method: 'DELETE' }).catch(() => {});
    const reset = { ...DEFAULT_HOME_PREVIEW };
    setPreviewConfig(reset);
    setLiveVideoSrc(reset.videoUrl);
    if (typeof window !== 'undefined') {
      localStorage.setItem('nexverze_home_preview_config', JSON.stringify(reset));
    }
    setIsEditModalOpen(false);
    showToast('🔄 Reverted to default showcase video');
  };

  // Luma Command Bar Execute Handler
  const handleExecuteCommandPrompt = (customPrompt?: string) => {
    const textToRun = (customPrompt ?? commandPrompt).trim();
    if (!textToRun) {
      onOpenStudioWithMode('text', previewConfig.prompt, commandModel, commandRatio);
      return;
    }
    onOpenStudioWithMode('text', textToRun, commandModel, commandRatio);
  };

  // Magic prompt enhancer for Luma Command Bar
  const handleEnhanceCommandPrompt = () => {
    setIsEnhancingPrompt(true);
    setTimeout(() => {
      const base = commandPrompt || previewConfig.prompt;
      const enhanced = enhancePrompt(base, { model: commandModel });
      setCommandPrompt(enhanced);
      setIsEnhancingPrompt(false);
      showToast('✨ Prompt enhanced with cinematic camera & lighting!');
    }, 350);
  };

  return (
    <section className="relative pt-1 pb-8 space-y-6 max-w-7xl mx-auto">
      {/* Ambient background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4/5 h-80 bg-gradient-to-r from-purple-600/20 via-fuchsia-600/20 to-pink-600/20 blur-3xl rounded-full pointer-events-none" />

      {/* Global Toast Notice */}
      {toastNotice && (
        <div className="fixed bottom-6 right-6 z-50 p-3.5 rounded-2xl bg-[#151128] border border-purple-500/50 text-white text-xs mono shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastNotice}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* INTEGRATED RUNWAY & LUMA STYLE CINEMATIC HERO THEATER STAGE               */}
      {/* Auto-looping video canvas + Dual-layer cinematic gradient scrims +        */}
      {/* Overlay content stack + Floating Top HUD with Audio ON/OFF Toggle        */}
      {/* ========================================================================= */}
      <div className="relative w-full rounded-3xl sm:rounded-[2.5rem] overflow-hidden border border-purple-500/35 bg-[#070514] shadow-[0_0_80px_rgba(168,85,247,0.22)] ring-1 ring-purple-500/20 transition-all flex flex-col justify-between min-h-[580px] sm:min-h-[640px] lg:min-h-[700px]">
        
        {/* ========================================================================= */}
        {/* 1. AUTO-LOOPING BACKGROUND VIDEO CANVAS (Runway & Luma Style)             */}
        {/* ========================================================================= */}
        <div
          onPointerDown={isCreatorMode ? handleFramingPointerDown : undefined}
          onPointerMove={isCreatorMode ? handleFramingPointerMove : undefined}
          onPointerUp={isCreatorMode ? handleFramingPointerUp : undefined}
          onPointerCancel={isCreatorMode ? handleFramingPointerUp : undefined}
          className={`absolute inset-0 w-full h-full overflow-hidden select-none touch-none ${
            isCreatorMode
              ? isDraggingFraming
                ? 'cursor-grabbing ring-2 ring-amber-400'
                : 'cursor-grab ring-1 ring-amber-400/50'
              : ''
          }`}
        >
          <video
            ref={videoRef}
            key={liveVideoSrc}
            src={liveVideoSrc}
            autoPlay
            loop={isAutoLoop}
            muted={isAudioOff}
            playsInline
            preload="auto"
            style={{
              objectFit: isCreatorMode ? uploadFit : (previewConfig.objectFit || 'cover'),
              objectPosition: isCreatorMode
                ? `${uploadPosX}% ${uploadPosY}%`
                : `${previewConfig.objectPositionX ?? 50}% ${previewConfig.objectPositionY ?? 50}%`,
              transform:
                (isCreatorMode ? uploadZoom : previewConfig.zoomScale) &&
                (isCreatorMode ? uploadZoom : previewConfig.zoomScale) !== 1
                  ? `scale(${isCreatorMode ? uploadZoom : previewConfig.zoomScale})`
                  : undefined,
              transformOrigin: isCreatorMode
                ? `${uploadPosX}% ${uploadPosY}%`
                : `${previewConfig.objectPositionX ?? 50}% ${previewConfig.objectPositionY ?? 50}%`,
              userSelect: 'none',
            }}
            className="w-full h-full pointer-events-none transition-transform duration-75"
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onError={(e) => {
              console.warn('Hero preview video failed, reverting to default reference:', liveVideoSrc);
              const target = e.target as HTMLVideoElement;
              if (liveVideoSrc !== DEFAULT_HOME_PREVIEW.videoUrl) {
                setLiveVideoSrc(DEFAULT_HOME_PREVIEW.videoUrl);
                setPreviewConfig((prev) => ({
                  ...prev,
                  videoUrl: DEFAULT_HOME_PREVIEW.videoUrl,
                }));
              } else if (target && target.src !== '/videos/festival-dance-9-16.mp4') {
                target.src = '/videos/festival-dance-9-16.mp4';
              }
            }}
          >
            <source src={liveVideoSrc} type="video/mp4" />
            <source src={DEFAULT_HOME_PREVIEW.videoUrl} type="video/mp4" />
            <source src="/videos/festival-dance-16-9.mp4" type="video/mp4" />
            <source src="/videos/sample-1.mp4" type="video/mp4" />
          </video>

          {/* DUAL-LAYER CINEMATIC GRADIENT SCRIMS */}
          {/* Layer 1: Linear vertical gradient scrim (darkening top & bottom for high text contrast) */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#070514]/85 via-[#070514]/40 to-[#070514]/95 pointer-events-none" />

          {/* Layer 2: Radial focal vignette (maintains vivid center motion while vignette-darkening edges) */}
          <div className="absolute inset-0 [background:radial-gradient(ellipse_at_center,rgba(7,5,20,0.12)_0%,rgba(7,5,20,0.65)_70%,rgba(7,5,20,0.96)_100%)] pointer-events-none" />

          {/* Ambient top light sheen */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-72 bg-gradient-to-r from-purple-600/30 via-fuchsia-600/25 to-pink-600/30 blur-3xl rounded-full pointer-events-none" />
        </div>

        {/* Tap to Play/Pause indicator on video hover (ONLY when NOT in Creator Mode) */}
        {!isCreatorMode && (
          <button
            type="button"
            onClick={() => {
              if (videoRef.current) {
                if (videoRef.current.paused) {
                  videoRef.current
                    .play()
                    .then(() => setIsPlaying(true))
                    .catch(() => setIsPlaying(false));
                } else {
                  videoRef.current.pause();
                  setIsPlaying(false);
                }
              }
            }}
            className="absolute inset-0 z-10 flex items-center justify-center bg-black/0 hover:bg-black/20 transition-all opacity-0 hover:opacity-100 cursor-pointer pointer-events-auto"
            title={isPlaying ? 'Click background to pause playback' : 'Click background to resume playback'}
          >
            <div className="w-16 h-16 rounded-full bg-black/75 backdrop-blur-md border border-white/20 text-white flex items-center justify-center shadow-2xl">
              {isPlaying ? (
                <Pause className="w-6 h-6 fill-white" />
              ) : (
                <Play className="w-6 h-6 fill-white ml-1" />
              )}
            </div>
          </button>
        )}

        {/* ========================================================================= */}
        {/* FLOATING TOP HUD & AUDIO TOGGLE                                           */}
        {/* Translucent glass Audio: OFF / Audio: ON pinned at top-right              */}
        {/* ========================================================================= */}
        <div className="relative z-30 flex items-center justify-between p-4 sm:p-6 pointer-events-none">
          {/* Top Left Status Badge */}
          <div className="pointer-events-auto flex items-center gap-2">
            {isCreatorMode ? (
              <span className="px-3.5 py-1.5 rounded-full bg-black/85 backdrop-blur-md text-amber-300 text-xs font-bold mono border border-amber-400/50 flex items-center gap-2 shadow-xl">
                <Move className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span>
                  Framing: {uploadPosX}% X • {uploadPosY}% Y ({previewConfig.aspectRatio})
                </span>
              </span>
            ) : (
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-white/90 text-xs font-bold mono shadow-xl">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span>4K Master Theater • 60 FPS</span>
              </div>
            )}
          </div>

          {/* Top Right: Audio Toggle & Creator Switch */}
          <div className="pointer-events-auto flex items-center gap-2">
            {/* Translucent glass Audio: OFF / Audio: ON button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleAudio();
              }}
              className="px-4 py-1.5 rounded-full bg-black/75 hover:bg-black text-white text-xs font-bold mono border border-white/20 backdrop-blur-md flex items-center gap-2 transition-all cursor-pointer shadow-xl hover:scale-105 active:scale-95 ring-1 ring-white/10"
              title={isAudioOff ? 'Click to turn audio ON' : 'Click to turn audio OFF'}
            >
              {isAudioOff ? (
                <>
                  <VolumeX className="w-3.5 h-3.5 text-rose-400" />
                  <span className="text-white/85">Audio: OFF</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                  <span className="text-emerald-300">Audio: ON</span>
                </>
              )}
            </button>

            {/* Discreet Creator toggle (ONLY shown to creator in live preview) */}
            {isLivePreview && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleCreatorMode();
                }}
                className={`p-2 rounded-full backdrop-blur-md transition-all cursor-pointer shadow-xl border ${
                  isCreatorMode
                    ? 'bg-amber-500/20 text-amber-300 border-amber-400/50 hover:bg-amber-500/30'
                    : 'bg-black/60 text-white/50 border-white/10 hover:text-amber-300 hover:border-amber-400/30'
                }`}
                title={isCreatorMode ? 'Switch to Clean User View' : '👑 Open Creator Controls'}
              >
                {isCreatorMode ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* OVERLAY CONTENT STACK (All Requested Details Directly Over Video)         */}
        {/* ========================================================================= */}
        <div className="relative z-20 flex flex-col items-center justify-center text-center px-4 sm:px-8 pt-4 sm:pt-8 pb-14 sm:pb-16 max-w-4xl mx-auto space-y-6 pointer-events-auto">
          
          {/* Kicker Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-950/75 border border-purple-400/40 text-purple-200 text-xs font-bold mono uppercase tracking-wider backdrop-blur-md shadow-2xl shadow-purple-950/50">
            <Sparkles className="w-4 h-4 text-amber-300 fill-amber-300 animate-pulse" />
            <span>✨ Next-Gen Photorealistic AI Video Studio</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-[1.12] drop-shadow-[0_4px_24px_rgba(0,0,0,0.95)]">
            Turn Any Prompt & Photo Into <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-purple-300 via-fuchsia-300 to-pink-400 bg-clip-text text-transparent font-black filter drop-shadow">
              Cinematic 4K AI Videos
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-base md:text-lg text-purple-100/90 max-w-2xl mx-auto font-medium leading-relaxed drop-shadow-[0_2px_14px_rgba(0,0,0,0.95)]">
            Create viral Instagram Reels & Shorts in seconds. Powered by Luma Fast, Kling Pro & Veo Ultra with 10 Indian Languages & AI Voiceover synthesis.
          </p>

          {/* 3 Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-1 w-full max-w-xl mx-auto">
            <button
              type="button"
              onClick={() => onOpenStudioWithMode('text')}
              className="w-full sm:w-auto font-extrabold py-3.5 px-6 rounded-2xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-xl shadow-purple-600/40 flex items-center justify-center gap-2.5 text-sm sm:text-base transition-all active:scale-[0.98] cursor-pointer ring-1 ring-purple-400/50"
            >
              <Wand2 className="w-4 h-4 text-amber-300" />
              <span>✨ Text to Video</span>
              <ArrowRight className="w-4 h-4 text-white/80" />
            </button>

            <button
              type="button"
              onClick={() => onOpenStudioWithMode('image')}
              className="w-full sm:w-auto font-extrabold py-3.5 px-6 rounded-2xl bg-[#140e2b]/85 hover:bg-[#201744] backdrop-blur-md text-white border border-purple-400/40 shadow-xl shadow-purple-950/60 flex items-center justify-center gap-2.5 text-sm sm:text-base transition-all active:scale-[0.98] cursor-pointer hover:border-purple-300 ring-1 ring-white/10"
            >
              <ImageIcon className="w-4 h-4 text-cyan-300" />
              <span>🖼️ Image to Video</span>
              <ArrowRight className="w-4 h-4 text-white/80" />
            </button>

            <button
              type="button"
              onClick={() => onOpenStudioWithMode('mobile-to-cinematic')}
              className="w-full sm:w-auto font-extrabold py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-400 via-orange-500 to-pink-600 hover:from-amber-300 hover:to-pink-500 text-black shadow-xl shadow-amber-600/35 flex items-center justify-center gap-2.5 text-sm sm:text-base transition-all active:scale-[0.98] cursor-pointer ring-1 ring-amber-300/60"
            >
              <Sparkles className="w-4 h-4 text-black" />
              <span>🎥 Mobile to Cinematic</span>
              <ArrowRight className="w-4 h-4 text-black/80" />
            </button>
          </div>

          {/* Spec & Trial Badges */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-4 pt-1 text-xs mono text-white/85">
            <span className="px-3.5 py-1.5 rounded-full bg-black/65 border border-emerald-400/40 backdrop-blur-md flex items-center gap-2 shadow-lg">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>⚡ Instant ₹99 Trial Pack (150cr)</span>
            </span>
            <span className="px-3.5 py-1.5 rounded-full bg-black/65 border border-emerald-400/40 backdrop-blur-md flex items-center gap-2 shadow-lg">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>10 Major Indian Languages</span>
            </span>
            <span className="px-3.5 py-1.5 rounded-full bg-black/65 border border-emerald-400/40 backdrop-blur-md flex items-center gap-2 shadow-lg">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>4K Quality Lock Engine</span>
            </span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* CREATOR MODE ONLY: In-stage Controls & Draggable Framing Toolbar          */}
        {/* ========================================================================= */}
        {isCreatorMode && (
          <div className="relative z-30 p-4 sm:p-5 border-t border-amber-500/30 bg-[#0e0a20]/95 backdrop-blur-xl space-y-3 pointer-events-auto">
            <div className="flex items-center justify-between text-[11px] mono text-amber-300 bg-amber-500/10 px-3.5 py-1.5 rounded-xl border border-amber-400/30">
              <span className="font-bold flex items-center gap-1.5">
                👑 Creator Controls (Show to Me: ON) • Drag video canvas above or nudge below
              </span>
              <button
                type="button"
                onClick={toggleCreatorMode}
                className="text-white/70 hover:text-white underline text-[10px] flex items-center gap-1 cursor-pointer"
              >
                <Eye className="w-3 h-3 text-amber-400" />
                <span>Switch to User View</span>
              </button>
            </div>

            {/* Interactive Framing Nudge & Action Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs mono">
              {/* Nudge buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-amber-300 font-bold flex items-center gap-1 text-[11px]">
                  <Move className="w-3.5 h-3.5 text-amber-400" />
                  <span>Nudge Position:</span>
                </span>
                <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/10">
                  <button
                    type="button"
                    onClick={() => nudgeFraming('left')}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-amber-500/20 text-white hover:text-amber-300 transition-colors cursor-pointer"
                    title="Nudge Left"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => nudgeFraming('right')}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-amber-500/20 text-white hover:text-amber-300 transition-colors cursor-pointer"
                    title="Nudge Right"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => nudgeFraming('up')}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-amber-500/20 text-white hover:text-amber-300 transition-colors cursor-pointer"
                    title="Nudge Up"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => nudgeFraming('down')}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-amber-500/20 text-white hover:text-amber-300 transition-colors cursor-pointer"
                    title="Nudge Down"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={resetFraming}
                  className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 text-[10px] flex items-center gap-1 transition-colors cursor-pointer"
                  title="Reset position to 50% Center"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>

                {/* Auto-Loop Checkbox */}
                <label className="flex items-center gap-1.5 text-[10px] text-amber-300 font-bold cursor-pointer hover:text-white pl-2 border-l border-white/10">
                  <input
                    type="checkbox"
                    checked={isAutoLoop}
                    onChange={(e) => setIsAutoLoop(e.target.checked)}
                    className="w-3 h-3 rounded border-amber-500/30 bg-black/40 text-amber-500 focus:ring-amber-500"
                  />
                  <span>Loop</span>
                </label>
              </div>

              {/* Format buttons: 9:16, 16:9, 1:1 */}
              <div className="flex items-center gap-1 bg-[#141026] p-1 rounded-2xl border border-[#2b2548]">
                <button
                  type="button"
                  onClick={() => handleSelectAspectRatio('9:16')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold mono flex items-center gap-1.5 transition-all cursor-pointer ${
                    previewConfig.aspectRatio === '9:16'
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>9:16</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectAspectRatio('16:9')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold mono flex items-center gap-1.5 transition-all cursor-pointer ${
                    previewConfig.aspectRatio === '16:9'
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Tv className="w-3.5 h-3.5" />
                  <span>16:9</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectAspectRatio('1:1')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold mono flex items-center gap-1.5 transition-all cursor-pointer ${
                    previewConfig.aspectRatio === '1:1'
                      ? 'bg-gradient-to-r from-purple-600 to-cyan-600 text-white shadow-md'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Square className="w-3.5 h-3.5" />
                  <span>1:1</span>
                </button>
              </div>

              {/* Actions: Save Movement, Upload & Replace, Remix, Edit */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleSavePositionDirectly}
                  className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-black text-xs font-black mono flex items-center gap-1.5 shadow-md shadow-emerald-950/50 transition-all active:scale-95 cursor-pointer"
                  title="Save current video framing and position"
                >
                  <Save className="w-3.5 h-3.5 text-black" />
                  <span>Save Movement</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setUploadNotice(null);
                    setUploadFile(null);
                    setUploadPreviewUrl(liveVideoSrc);
                    setUploadFileName(null);
                    setUploadFit(previewConfig.objectFit || 'cover');
                    setUploadPosX(previewConfig.objectPositionX ?? 50);
                    setUploadPosY(previewConfig.objectPositionY ?? 50);
                    setUploadZoom(previewConfig.zoomScale ?? 1);
                    setIsUploadModalOpen(true);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black text-xs font-black mono flex items-center gap-1.5 shadow-md shadow-amber-950/40 transition-all active:scale-95 cursor-pointer"
                  title="Upload and replace this preview video"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload & Replace</span>
                </button>

                <button
                  type="button"
                  onClick={handleRemix}
                  className="px-3.5 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-200 text-xs font-bold mono flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                  title="Remix prompt into Studio"
                >
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  <span>Remix</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-[#18142c] hover:bg-purple-900/30 border border-purple-500/40 text-purple-200 hover:text-white text-xs font-bold mono flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                  title="Edit video options: decide 9:16, 16:9, 1:1 and save video"
                >
                  <Sliders className="w-3.5 h-3.5 text-purple-400" />
                  <span>Edit</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 2. LUMA PROMPT COMMAND BAR (Interactive Floating Bar Docked Below Hero)    */}
      {/* ========================================================================= */}
      <div className="relative z-30 -mt-7 sm:-mt-9 max-w-4xl mx-auto px-2 sm:px-0">
        <div className="relative rounded-3xl bg-[#0f0b24]/95 backdrop-blur-2xl border border-purple-500/40 p-3 sm:p-4 shadow-[0_25px_65px_rgba(0,0,0,0.75)] ring-1 ring-purple-400/30 space-y-3">
          
          {/* Main Input Row */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2.5">
            {/* Text Input */}
            <div className="flex-1 flex items-center gap-2.5 bg-black/60 border border-[#2b244d] rounded-2xl px-3.5 py-2.5 focus-within:border-purple-400 focus-within:ring-2 focus-within:ring-purple-400/20 transition-all">
              <Wand2 className="w-4 h-4 text-purple-400 shrink-0" />
              <input
                type="text"
                value={commandPrompt}
                onChange={(e) => setCommandPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleExecuteCommandPrompt();
                  }
                }}
                placeholder="Describe your video in any language... e.g. Cyberpunk samurai walking in neon rain, 4k 60fps"
                className="w-full bg-transparent text-white placeholder-white/40 text-xs sm:text-sm focus:outline-none font-medium"
              />
              {commandPrompt && (
                <button
                  type="button"
                  onClick={() => setCommandPrompt('')}
                  className="text-white/40 hover:text-white p-1 cursor-pointer"
                  title="Clear prompt"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Quick Selectors & CTA */}
            <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap justify-end">
              {/* Model Tag */}
              <select
                value={commandModel}
                onChange={(e) => setCommandModel(e.target.value as any)}
                className="bg-[#181335] text-purple-200 border border-purple-500/40 text-xs font-bold mono rounded-xl px-2.5 py-2.5 focus:outline-none cursor-pointer"
                title="Select video generation engine"
              >
                <option value="luma">⚡ Luma Fast (Ray 2)</option>
                <option value="kling">🎬 Kling Pro (v2.5)</option>
                <option value="veo">🎥 Veo Ultra (3.1)</option>
              </select>

              {/* Ratio Tag */}
              <select
                value={commandRatio}
                onChange={(e) => setCommandRatio(e.target.value as any)}
                className="bg-[#181335] text-purple-200 border border-purple-500/40 text-xs font-bold mono rounded-xl px-2.5 py-2.5 focus:outline-none cursor-pointer"
                title="Select aspect ratio"
              >
                <option value="9:16">📱 9:16 Reels</option>
                <option value="16:9">🖥️ 16:9 Wide</option>
                <option value="1:1">⬛ 1:1 Feed</option>
              </select>

              {/* Magic Prompt Enhancer */}
              <button
                type="button"
                onClick={handleEnhanceCommandPrompt}
                disabled={isEnhancingPrompt}
                className="p-2.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/40 border border-purple-400/40 text-amber-300 transition-all cursor-pointer disabled:opacity-50"
                title="Enhance prompt with cinematic camera & lighting details"
              >
                <Sparkles className={`w-4 h-4 ${isEnhancingPrompt ? 'animate-spin' : ''}`} />
              </button>

              {/* Instant Execute CTA */}
              <button
                type="button"
                onClick={() => handleExecuteCommandPrompt()}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-extrabold text-xs sm:text-sm mono shadow-lg shadow-purple-600/40 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer whitespace-nowrap"
              >
                <span>Generate Video</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Viral Prompt Suggestions */}
          <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pt-1 pb-0.5">
            <span className="text-[10px] font-bold mono text-purple-300/70 uppercase tracking-wider shrink-0 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-300" />
              <span>Inspirations:</span>
            </span>
            {LUMA_VIRAL_PROMPT_SUGGESTIONS.map((sug, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setCommandPrompt(sug.prompt);
                  setCommandModel(sug.model);
                  setCommandRatio(sug.ratio);
                }}
                className="shrink-0 px-2.5 py-1 rounded-full bg-white/5 hover:bg-purple-500/20 border border-white/10 hover:border-purple-400/40 text-white/80 hover:text-white text-[11px] mono flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                title={sug.prompt}
              >
                <span>{sug.icon}</span>
                <span>{sug.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: UPLOAD & REPLACE VIDEO (Creator Mode Feature)                    */}
      {/* ========================================================================= */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-[#120f24] border border-amber-500/40 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col">
            <div className="p-5 border-b border-[#272142] flex items-center justify-between bg-gradient-to-r from-[#181333] to-[#120f24]">
              <div className="space-y-1">
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40 text-[10px] font-bold mono uppercase">
                  Home Preview Panel
                </span>
                <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                  <Upload className="w-5 h-5 text-amber-400" />
                  <span>Upload & Replace Preview Video</span>
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveUpload} className="p-5 space-y-4">
              {uploadNotice && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-400/40 text-amber-200 text-xs mono flex items-center gap-2">
                  <span>{uploadNotice}</span>
                </div>
              )}

              {/* Video File Picker & Interactive Fit/Framing Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-white/80 mono flex items-center gap-1.5">
                    <Film className="w-3.5 h-3.5 text-amber-400" />
                    <span>Select Video File (MP4, WebM, MOV) *</span>
                  </label>
                  {uploadPreviewUrl && (
                    <button
                      type="button"
                      onClick={() => uploadFileInputRef.current?.click()}
                      className="px-2.5 py-1 rounded-lg bg-[#1e1a38] hover:bg-[#28224d] text-amber-300 border border-amber-400/40 text-[11px] font-bold mono flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Upload className="w-3 h-3" />
                      <span>{uploadFileName ? 'Change Video File' : 'Upload New File'}</span>
                    </button>
                  )}
                </div>

                <input
                  ref={uploadFileInputRef}
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime,video/*"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {!uploadPreviewUrl ? (
                  /* Initial Upload Dropzone when no video is loaded */
                  <div
                    onClick={() => uploadFileInputRef.current?.click()}
                    className="border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all border-purple-500/30 hover:border-amber-400/60 bg-[#16122c]/60 hover:bg-[#1c1836]"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-400/30 flex items-center justify-center text-amber-400 mx-auto mb-2">
                      <Upload className="w-6 h-6 animate-bounce" />
                    </div>
                    <p className="text-xs font-bold text-white">Click to browse or drag & drop video</p>
                    <p className="text-[11px] text-white/50 mono mt-0.5">Supports 1080p / 4K MP4, WebM up to 250MB</p>
                  </div>
                ) : (
                  /* Interactive Video Fit & Move/Drag Framing Viewport */
                  <div className="p-3.5 rounded-2xl bg-[#0c0a1a] border border-[#272142] space-y-3.5">
                    <div className="flex items-center justify-between text-[11px] mono">
                      <span className="text-amber-300 font-bold flex items-center gap-1.5">
                        <Move className="w-3.5 h-3.5 text-amber-400" />
                        <span>Interactive Framing (Move / Drag)</span>
                      </span>
                      <span className="text-white/60">
                        {uploadFileName || 'Preview Video'}
                      </span>
                    </div>

                    {/* Draggable Viewport Container matching current preview aspect ratio */}
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
                            previewConfig.aspectRatio === '9:16'
                              ? '190px'
                              : previewConfig.aspectRatio === '1:1'
                              ? '230px'
                              : '320px',
                          maxWidth: '100%',
                          aspectRatio:
                            previewConfig.aspectRatio === '9:16'
                              ? '9/16'
                              : previewConfig.aspectRatio === '1:1'
                              ? '1/1'
                              : '16/9',
                        }}
                      >
                        <video
                          src={uploadPreviewUrl}
                          autoPlay
                          loop
                          muted
                          playsInline
                          style={{
                            objectFit: uploadFit,
                            objectPosition: `${uploadPosX}% ${uploadPosY}%`,
                            transform: uploadZoom !== 1 ? `scale(${uploadZoom})` : undefined,
                            transformOrigin: `${uploadPosX}% ${uploadPosY}%`,
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
                            {uploadPosX}% X • {uploadPosY}% Y
                          </span>
                        </div>

                        {/* Interactive Grid Guide Lines */}
                        <div className={`absolute inset-0 pointer-events-none border border-white/20 transition-opacity ${isDraggingFraming ? 'opacity-70' : 'opacity-20'}`}>
                          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/30 -translate-x-1/2" />
                          <div className="absolute top-1/2 left-0 right-0 h-px bg-white/30 -translate-y-1/2" />
                        </div>
                      </div>
                    </div>

                    {/* Directional Nudge Buttons */}
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
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-white/70 mono flex items-center gap-1">
                            <Crop className="w-3 h-3 text-purple-400" />
                            <span>Fit Mode:</span>
                          </label>
                          <div className="grid grid-cols-2 gap-1.5">
                            <button
                              type="button"
                              onClick={() => setUploadFit('cover')}
                              className={`py-1.5 px-2 rounded-xl text-[10px] font-bold mono border transition-all cursor-pointer ${
                                uploadFit === 'cover'
                                  ? 'bg-amber-500/20 text-amber-300 border-amber-400'
                                  : 'bg-[#151226] text-white/60 border-[#272142] hover:text-white'
                              }`}
                            >
                              Cover (Fill & Crop)
                            </button>
                            <button
                              type="button"
                              onClick={() => setUploadFit('contain')}
                              className={`py-1.5 px-2 rounded-xl text-[10px] font-bold mono border transition-all cursor-pointer ${
                                uploadFit === 'contain'
                                  ? 'bg-amber-500/20 text-amber-300 border-amber-400'
                                  : 'bg-[#151226] text-white/60 border-[#272142] hover:text-white'
                              }`}
                            >
                              Contain (Fit Whole)
                            </button>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[10px] font-bold text-white/70 mono">
                            <span className="flex items-center gap-1">
                              <Maximize2 className="w-3 h-3 text-purple-400" />
                              <span>Zoom / Scale:</span>
                            </span>
                            <span className="text-amber-300">{Math.round(uploadZoom * 100)}%</span>
                          </div>
                          <input
                            type="range"
                            min="1"
                            max="1.6"
                            step="0.05"
                            value={uploadZoom}
                            onChange={(e) => setUploadZoom(Number(e.target.value))}
                            className="w-full accent-amber-400 cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#272142]">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold mono text-white/60 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingUpload || !uploadPreviewUrl}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black text-xs font-black mono flex items-center gap-2 shadow-lg shadow-amber-950/50 cursor-pointer disabled:opacity-50 active:scale-95 transition-all"
                >
                  <Save className="w-4 h-4 text-black" />
                  <span>{isSavingUpload ? 'Saving Video...' : 'Save & Replace Video'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: EDIT VIDEO OPTIONS (Decide 9:16, 16:9, 1:1 and save video)        */}
      {/* ========================================================================= */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-[#120f24] border border-purple-500/40 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-[#272142] flex items-center justify-between bg-gradient-to-r from-[#181333] to-[#120f24]">
              <div className="space-y-1">
                <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/40 text-[10px] font-bold mono uppercase">
                  Home Preview Settings
                </span>
                <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-purple-400" />
                  <span>Edit Showcase Video Options</span>
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditChanges} className="p-5 space-y-4 overflow-y-auto custom-scrollbar">
              {editSuccessNotice && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-400/40 text-emerald-200 text-xs mono flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>{editSuccessNotice}</span>
                </div>
              )}

              {/* Decide Aspect Ratio */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-white/90 mono flex items-center justify-between">
                  <span>Decide Aspect Ratio *</span>
                  <span className="text-purple-300 font-mono text-[11px]">Selected: {editRatio}</span>
                </label>

                <div className="grid grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setEditRatio('9:16')}
                    className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
                      editRatio === '9:16'
                        ? 'bg-purple-600/30 border-purple-400 text-white shadow-lg shadow-purple-950/50'
                        : 'bg-[#17122e] border-[#29224c] text-white/60 hover:text-white hover:border-purple-500/40'
                    }`}
                  >
                    <Smartphone className="w-5 h-5 text-purple-400" />
                    <span className="text-xs font-bold mono">9:16</span>
                    <span className="text-[10px] text-white/50">Vertical Reels</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditRatio('16:9')}
                    className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
                      editRatio === '16:9'
                        ? 'bg-pink-600/30 border-pink-400 text-white shadow-lg shadow-pink-950/50'
                        : 'bg-[#17122e] border-[#29224c] text-white/60 hover:text-white hover:border-pink-500/40'
                    }`}
                  >
                    <Tv className="w-5 h-5 text-pink-400" />
                    <span className="text-xs font-bold mono">16:9</span>
                    <span className="text-[10px] text-white/50">Widescreen</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditRatio('1:1')}
                    className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
                      editRatio === '1:1'
                        ? 'bg-cyan-600/30 border-cyan-400 text-white shadow-lg shadow-cyan-950/50'
                        : 'bg-[#17122e] border-[#29224c] text-white/60 hover:text-white hover:border-cyan-500/40'
                    }`}
                  >
                    <Square className="w-5 h-5 text-cyan-400" />
                    <span className="text-xs font-bold mono">1:1</span>
                    <span className="text-[10px] text-white/50">Square Feed</span>
                  </button>
                </div>
              </div>

              {/* Framing Fit Style */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-white/80 mono">Video Framing Style</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditFit('cover')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold mono transition-all cursor-pointer ${
                      editFit === 'cover'
                        ? 'bg-purple-600/30 border-purple-400 text-purple-200'
                        : 'bg-[#17122e] border-[#29224c] text-white/60 hover:text-white'
                    }`}
                  >
                    Cover (Fill Frame)
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditFit('contain')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold mono transition-all cursor-pointer ${
                      editFit === 'contain'
                        ? 'bg-purple-600/30 border-purple-400 text-purple-200'
                        : 'bg-[#17122e] border-[#29224c] text-white/60 hover:text-white'
                    }`}
                  >
                    Contain (Fit Whole Video)
                  </button>
                </div>
              </div>

              {/* Title Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-white/80 mono">Video Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#17122e] border border-[#2e2652] text-white text-xs focus:border-purple-400 focus:outline-none mono"
                  placeholder="e.g., Festival Dance AI 4K"
                />
              </div>

              {/* Prompt Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-white/80 mono">Prompt Description (For Remix)</label>
                <textarea
                  value={editPrompt}
                  onChange={(e) => setEditPrompt(e.target.value)}
                  rows={2}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#17122e] border border-[#2e2652] text-white text-xs focus:border-purple-400 focus:outline-none resize-none"
                  placeholder="Enter prompt description..."
                />
              </div>

              {/* Save Video Options */}
              <div className="pt-3 border-t border-[#272142] space-y-2.5">
                <div className="text-xs font-bold text-white/90 mono">Save Video Options</div>

                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-xs font-extrabold mono flex items-center justify-center gap-2 shadow-lg shadow-purple-950/50 cursor-pointer active:scale-95"
                  >
                    <Check className="w-4 h-4" />
                    <span>Save Video Settings</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadVideo}
                    className="py-2.5 px-4 rounded-xl bg-[#1d1738] hover:bg-[#28204d] border border-purple-500/40 text-purple-200 text-xs font-bold mono flex items-center gap-2 transition-all cursor-pointer active:scale-95"
                    title="Download and save video file directly to device"
                  >
                    <Download className="w-4 h-4 text-purple-400" />
                    <span>Save Video File</span>
                  </button>
                </div>

                {previewConfig.isCustom && (
                  <button
                    type="button"
                    onClick={handleRevertToDefault}
                    className="w-full py-2 px-3 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-bold mono flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Revert to Default Showcase Video</span>
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
