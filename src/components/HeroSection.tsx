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
  RefreshCw,
  Film,
  Move,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  Crop,
  Maximize2,
  Save,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import {
  storeGalleryVideoBlob,
  loadGalleryVideoBlob,
  deleteGalleryVideoBlob,
} from '../lib/galleryStorage';
import { checkIsLivePreviewCreator } from './ShowcaseGallery';

interface HeroSectionProps {
  onOpenStudioWithMode: (mode: 'text' | 'image' | 'mobile-to-cinematic') => void;
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

// Extract 3 key frames from video file for Gemini Vision multimodal analysis
const extractKeyFramesFromVideo = (file: File): Promise<string[]> => {
  return new Promise((resolve) => {
    try {
      const url = URL.createObjectURL(file);
      const video = document.createElement('video');
      video.src = url;
      video.muted = true;
      video.playsInline = true;

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      const captureFrame = (time: number): Promise<string> => {
        return new Promise((res) => {
          video.currentTime = time;
          video.onseeked = () => {
            try {
              canvas.width = Math.min(video.videoWidth || 640, 640);
              canvas.height = Math.round((canvas.width * (video.videoHeight || 360)) / (video.videoWidth || 640));
              if (ctx) {
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                res(canvas.toDataURL('image/jpeg', 0.8));
                return;
              }
            } catch {}
            res('');
          };
        });
      };

      video.onloadeddata = async () => {
        const dur = video.duration || 3;
        const f1 = await captureFrame(Math.max(0.1, dur * 0.15));
        const f2 = await captureFrame(dur * 0.5);
        const f3 = await captureFrame(Math.min(dur - 0.1, dur * 0.85));
        URL.revokeObjectURL(url);
        resolve([f1, f2, f3].filter(Boolean));
      };

      video.onerror = () => {
        URL.revokeObjectURL(url);
        resolve([]);
      };

      setTimeout(() => {
        URL.revokeObjectURL(url);
        resolve([]);
      }, 5000);
    } catch {
      resolve([]);
    }
  });
};

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

  // Audio on/off state - Default audio is OFF (muted)
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
    return false; // Default to FALSE: Regular users ONLY see the video and Audio On/Off
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
        : '👁️ User View Enabled: Only Audio On/Off is shown to users'
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
      onOpenStudioWithMode('text');
    }
  };

  // Save changes from Edit Modal (decide 9:16, 16:9, 1:1, object-fit, title, prompt, and save the video)
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

  // Determine container aspect ratio sizing
  const getContainerRatioStyle = () => {
    switch (previewConfig.aspectRatio) {
      case '16:9':
        return 'w-full aspect-[16/9] max-h-[440px]';
      case '1:1':
        return 'w-full max-w-[420px] aspect-square mx-auto';
      case '9:16':
      default:
        return 'w-full max-w-[340px] sm:max-w-[360px] aspect-[9/16] mx-auto';
    }
  };

  return (
    <section className="relative pt-2 pb-6 max-w-7xl mx-auto">
      {/* Global Toast Notice */}
      {toastNotice && (
        <div className="fixed bottom-6 right-6 z-50 p-3.5 rounded-2xl bg-[#151128] border border-purple-500/50 text-white text-xs mono shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastNotice}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* UNIFIED RUNWAY & LUMA STYLE CINEMATIC HERO THEATER STAGE                  */}
      {/* Auto-looping background video canvas with dual-layer cinematic scrims,    */}
      {/* floating HUD, tap-to-play hover indicator, and overlay content stack.     */}
      {/* ========================================================================= */}
      <div
        onPointerDown={isCreatorMode ? handleFramingPointerDown : undefined}
        onPointerMove={isCreatorMode ? handleFramingPointerMove : undefined}
        onPointerUp={isCreatorMode ? handleFramingPointerUp : undefined}
        onPointerCancel={isCreatorMode ? handleFramingPointerUp : undefined}
        className={`relative w-full rounded-3xl sm:rounded-[2.5rem] overflow-hidden border border-purple-500/30 bg-[#070512] shadow-[0_0_80px_rgba(168,85,247,0.22)] min-h-[580px] sm:min-h-[640px] md:min-h-[700px] flex flex-col justify-between select-none transition-all ${
          isCreatorMode
            ? isDraggingFraming
              ? 'cursor-grabbing ring-2 ring-amber-400'
              : 'cursor-grab hover:ring-1 hover:ring-amber-400/50'
            : ''
        }`}
      >
        {/* 1. AUTO-LOOPING BACKGROUND VIDEO CANVAS (Runway & Luma Style) */}
        <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none select-none z-0">
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
              transform: (isCreatorMode ? uploadZoom : previewConfig.zoomScale) && (isCreatorMode ? uploadZoom : previewConfig.zoomScale) !== 1
                ? `scale(${isCreatorMode ? uploadZoom : previewConfig.zoomScale})`
                : undefined,
              transformOrigin: isCreatorMode
                ? `${uploadPosX}% ${uploadPosY}%`
                : `${previewConfig.objectPositionX ?? 50}% ${previewConfig.objectPositionY ?? 50}%`,
              userSelect: 'none',
            }}
            className="w-full h-full object-cover pointer-events-none transition-transform duration-300"
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onError={(e) => {
              console.warn('Hero preview video failed, reverting to fallback reference:', liveVideoSrc);
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
            <source src="/videos/home-page-preview-panel-video.mp4" type="video/mp4" />
            <source src="/videos/sample-1.mp4" type="video/mp4" />
          </video>
        </div>

        {/* 2. DUAL-LAYER CINEMATIC GRADIENT SCRIMS */}
        {/* Layer 1 (Linear vertical gradient): Balances brightness between top HUD and bottom command bar dock for deep cinematic contrast */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#06040e]/90 via-[#06040e]/45 to-[#06040e]/95 pointer-events-none z-[1]" />

        {/* Layer 2 (Radial focal vignette): Preserves vivid motion in the center subject while vignette-darkening outer margins to keep all typography razor-sharp */}
        <div className="absolute inset-0 [background:radial-gradient(ellipse_at_center,_transparent_20%,_rgba(6,4,14,0.45)_55%,_rgba(6,4,14,0.92)_100%)] pointer-events-none z-[2]" />

        {/* Background ambient cosmic glow flare */}
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[720px] h-[360px] bg-gradient-to-r from-purple-600/20 via-fuchsia-600/15 to-pink-600/20 blur-[100px] rounded-full pointer-events-none z-[3]" />

        {/* 3. TAP-TO-PLAY/PAUSE FLOATING INDICATOR ON VIDEO HOVER */}
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
            className="absolute inset-0 w-full h-full z-10 flex items-center justify-center cursor-pointer pointer-events-auto bg-transparent group focus:outline-none"
            aria-label={isPlaying ? 'Pause background video' : 'Play background video'}
          >
            <div className="w-16 h-16 rounded-full bg-black/60 group-hover:bg-black/80 backdrop-blur-md border border-white/20 text-white flex items-center justify-center shadow-2xl transition-all duration-300 transform scale-75 group-hover:scale-100 opacity-0 group-hover:opacity-100">
              {isPlaying ? (
                <Pause className="w-6 h-6 fill-white" />
              ) : (
                <Play className="w-6 h-6 fill-white ml-0.5" />
              )}
            </div>
          </button>
        )}

        {/* 4. FLOATING TOP HUD & AUDIO TOGGLE */}
        <div className="relative top-0 left-0 right-0 p-4 sm:p-6 flex items-center justify-between z-30 pointer-events-none">
          {/* Master quality indicator (4K Master Theater • 60 FPS) */}
          <div className="pointer-events-auto flex items-center gap-2 px-3 sm:px-3.5 py-1.5 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/15 text-white/90 text-[11px] sm:text-xs font-mono shadow-lg transition-colors">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-semibold tracking-wide">4K Master Theater • 60 FPS</span>
          </div>

          {/* Translucent glass Audio: OFF / Audio: ON toggle pinned at the top-right */}
          <div className="pointer-events-auto flex items-center gap-2">
            <button
              type="button"
              onClick={toggleAudio}
              className={`px-3.5 py-1.5 rounded-full border text-xs font-bold font-mono backdrop-blur-md flex items-center gap-2 transition-all cursor-pointer shadow-lg active:scale-95 ${
                isAudioOff
                  ? 'bg-black/60 hover:bg-black/80 border-white/15 text-white/85 hover:text-white hover:border-purple-500/40'
                  : 'bg-emerald-500/25 hover:bg-emerald-500/35 border-emerald-400/60 text-emerald-300 shadow-emerald-950/50'
              }`}
              title={isAudioOff ? 'Audio: OFF (Click to turn audio ON)' : 'Audio: ON (Click to turn audio OFF)'}
            >
              {isAudioOff ? (
                <>
                  <VolumeX className="w-3.5 h-3.5 text-rose-400" />
                  <span>Audio: OFF</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                  <span className="text-emerald-300">Audio: ON</span>
                </>
              )}
            </button>

            {/* Creator Mode toggle (Discreet icon shown only to creator) */}
            {isLivePreview && (
              <button
                type="button"
                onClick={toggleCreatorMode}
                className={`p-1.5 rounded-full border backdrop-blur-md text-xs font-mono transition-colors cursor-pointer ${
                  isCreatorMode
                    ? 'bg-amber-500/20 border-amber-400/60 text-amber-300'
                    : 'bg-black/50 border-white/10 text-white/40 hover:text-amber-300'
                }`}
                title={isCreatorMode ? 'Creator Controls Active' : 'Toggle Creator Controls'}
              >
                <Sliders className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* 5. OVERLAY CONTENT STACK (Directly Over Video Canvas) */}
        <div className="relative z-20 pointer-events-none flex flex-col items-center justify-center text-center px-4 sm:px-8 py-12 sm:py-16 md:py-20 my-auto space-y-6 max-w-4xl mx-auto">
          {/* Kicker Badge: ✨ Next-Gen Photorealistic AI Video Studio */}
          <div className="pointer-events-auto inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-purple-400/40 text-purple-200 text-xs font-bold font-mono uppercase tracking-wider shadow-xl">
            <Sparkles className="w-4 h-4 text-amber-300 fill-amber-300 animate-pulse" />
            <span>Next-Gen Photorealistic AI Video Studio</span>
          </div>

          {/* Main Headline: Turn Any Prompt & Photo Into Cinematic 4K AI Videos with high-impact gradient styling */}
          <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.08] drop-shadow-[0_2px_14px_rgba(0,0,0,0.85)]">
            Turn Any Prompt & Photo Into <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-purple-400 via-fuchsia-300 to-pink-400 bg-clip-text text-transparent font-black drop-shadow-[0_0_45px_rgba(217,70,239,0.4)]">
              Cinematic 4K AI Videos
            </span>
          </h1>

          {/* Subtitle: Create viral Instagram Reels & Shorts in seconds. Powered by Luma Fast, Kling Pro & Veo Ultra with 10 Indian Languages & AI Voiceover synthesis. */}
          <p className="text-sm sm:text-base md:text-lg text-purple-100/90 max-w-2xl mx-auto font-medium leading-relaxed drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
            Create viral Instagram Reels & Shorts in seconds. Powered by Luma Fast, Kling Pro & Veo Ultra with 10 Indian Languages & AI Voiceover synthesis.
          </p>

          {/* 3 Action CTAs: Text to Video, Image to Video, Mobile to Cinematic */}
          <div className="pointer-events-auto flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => onOpenStudioWithMode('text')}
              className="w-full sm:w-auto font-extrabold py-3.5 sm:py-4 px-6 sm:px-7 rounded-2xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-xl shadow-purple-600/40 flex items-center justify-center gap-2.5 text-sm sm:text-base transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer ring-1 ring-purple-400/40 backdrop-blur-sm"
            >
              <Wand2 className="w-5 h-5 text-amber-300" />
              <span>✨ Text to Video</span>
              <ArrowRight className="w-4 h-4 text-white/80" />
            </button>

            <button
              type="button"
              onClick={() => onOpenStudioWithMode('image')}
              className="w-full sm:w-auto font-extrabold py-3.5 sm:py-4 px-6 sm:px-7 rounded-2xl bg-gradient-to-r from-purple-700 via-indigo-600 to-fuchsia-600 hover:from-purple-600 hover:to-fuchsia-500 text-white shadow-xl shadow-purple-600/40 flex items-center justify-center gap-2.5 text-sm sm:text-base transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer ring-1 ring-purple-400/40 backdrop-blur-sm"
            >
              <ImageIcon className="w-5 h-5 text-cyan-300" />
              <span>🖼️ Image to Video</span>
              <ArrowRight className="w-4 h-4 text-white/80" />
            </button>

            <button
              type="button"
              onClick={() => onOpenStudioWithMode('mobile-to-cinematic')}
              className="w-full sm:w-auto font-extrabold py-3.5 sm:py-4 px-6 sm:px-7 rounded-2xl bg-gradient-to-r from-amber-400 via-orange-500 to-pink-600 hover:from-amber-300 hover:to-pink-500 text-black shadow-xl shadow-amber-600/40 flex items-center justify-center gap-2.5 text-sm sm:text-base transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer ring-1 ring-amber-300/60"
            >
              <Sparkles className="w-5 h-5 text-black" />
              <span>🎥 Mobile to Cinematic</span>
              <ArrowRight className="w-4 h-4 text-black/80" />
            </button>
          </div>

          {/* Spec & Trial Badges: ⚡ Instant ₹99 Trial Pack (150cr) • 10 Major Indian Languages • 4K Quality Lock Engine */}
          <div className="pointer-events-auto flex flex-wrap items-center justify-center gap-3 sm:gap-6 pt-1 text-xs font-mono text-white/85">
            <span className="flex items-center gap-1.5 drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-amber-300 font-semibold">⚡ Instant ₹99 Trial Pack (150cr)</span>
            </span>
            <span className="text-white/40 hidden sm:inline">•</span>
            <span className="flex items-center gap-1.5 drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>10 Major Indian Languages</span>
            </span>
            <span className="text-white/40 hidden sm:inline">•</span>
            <span className="flex items-center gap-1.5 drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>4K Quality Lock Engine</span>
            </span>
          </div>
        </div>

        {/* 6. CREATOR CONTROLS DOCK (ONLY visible when Creator Mode is active) */}
        {isCreatorMode && (
          <div className="relative z-30 p-4 border-t border-amber-500/30 bg-black/80 backdrop-blur-xl space-y-3">
            <div className="flex items-center justify-between text-[11px] mono text-amber-300">
              <span className="font-bold flex items-center gap-1.5">
                <Move className="w-3.5 h-3.5 text-amber-400" />
                <span>👑 Creator Mode: Drag Video to Nudge Framing ({uploadPosX}%, {uploadPosY}%)</span>
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSavePositionDirectly}
                  className="px-3 py-1 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black font-black text-[10px] mono flex items-center gap-1 cursor-pointer"
                >
                  <Save className="w-3 h-3 text-black" />
                  <span>Save Framing</span>
                </button>
                <button
                  type="button"
                  onClick={toggleCreatorMode}
                  className="text-white/60 hover:text-white underline text-[10px] cursor-pointer"
                >
                  Exit Creator View
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2.5">
              {/* Aspect Ratio Format Buttons */}
              <div className="flex items-center gap-1.5 bg-[#141026] p-1 rounded-2xl border border-[#2b2548]">
                <button
                  type="button"
                  onClick={() => handleSelectAspectRatio('9:16')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold mono flex items-center gap-1.5 transition-all cursor-pointer ${
                    previewConfig.aspectRatio === '9:16'
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white'
                      : 'text-white/60 hover:text-white'
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
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                      : 'text-white/60 hover:text-white'
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
                      ? 'bg-gradient-to-r from-purple-600 to-cyan-600 text-white'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  <Square className="w-3.5 h-3.5" />
                  <span>1:1</span>
                </button>
              </div>

              {/* Creator Action Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
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
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black text-xs font-black mono flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload & Replace Video</span>
                </button>

                <button
                  type="button"
                  onClick={handleRemix}
                  className="px-3 py-1.5 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/40 text-purple-200 text-xs font-bold mono flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  <span>Remix</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-[#18142c] hover:bg-purple-900/30 border border-purple-500/40 text-purple-200 hover:text-white text-xs font-bold mono flex items-center gap-1.5 cursor-pointer"
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
      {/* MODAL 1: UPLOAD & REPLACE VIDEO                                           */}
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

                        {/* Zoom / Scale Slider */}
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

                      {/* Precise Vertical & Horizontal Sliders */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        {/* Vertical Move (Up / Down) */}
                        <div className="space-y-1 bg-[#131024] p-2 rounded-xl border border-[#231e3d]">
                          <div className="flex items-center justify-between text-[10px] font-bold mono">
                            <span className="text-white/80">Vertical (Up/Down):</span>
                            <span className="text-amber-300">{uploadPosY}%</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            step="1"
                            value={uploadPosY}
                            onChange={(e) => setUploadPosY(Number(e.target.value))}
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
                            <span className="text-amber-300">{uploadPosX}%</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            step="1"
                            value={uploadPosX}
                            onChange={(e) => setUploadPosX(Number(e.target.value))}
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

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-[#181333] hover:bg-[#201a42] text-white/70 hover:text-white text-xs font-bold mono cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingUpload || (!uploadFile && !uploadPreviewUrl)}
                  className={`px-5 py-2.5 rounded-xl text-xs font-extrabold mono flex items-center gap-2 shadow-lg transition-all cursor-pointer ${
                    isSavingUpload || (!uploadFile && !uploadPreviewUrl)
                      ? 'bg-amber-500/40 text-black/60 cursor-not-allowed'
                      : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black shadow-amber-950/40 active:scale-95'
                  }`}
                >
                  {isSavingUpload ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-black/40 border-t-black rounded-full animate-spin" />
                      <span>Saving Video...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      <span>Save & Replace Video</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: EDIT BUTTON MODAL (Decide 9:16, 16:9, 1:1 & Save the Video)       */}
      {/* ========================================================================= */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-[#120f24] border border-purple-500/40 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
            <div className="p-5 border-b border-[#272142] flex items-center justify-between bg-gradient-to-r from-[#1a1438] to-[#120f24]">
              <div className="space-y-1">
                <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/40 text-[10px] font-bold mono uppercase">
                  Video Settings & Export
                </span>
                <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-purple-400" />
                  <span>Edit Video Options</span>
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

              {/* 1. DECIDE 9:16, 16:9, 1:1 */}
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

              {/* SAVE THE VIDEO OPTIONS */}
              <div className="pt-3 border-t border-[#272142] space-y-2.5">
                <div className="text-xs font-bold text-white/90 mono">Save Video Options</div>

                <div className="flex items-center gap-2">
                  {/* Save Video Settings button */}
                  <button
                    type="submit"
                    className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-xs font-extrabold mono flex items-center justify-center gap-2 shadow-lg shadow-purple-950/50 cursor-pointer active:scale-95"
                  >
                    <Check className="w-4 h-4" />
                    <span>Save Video Settings</span>
                  </button>

                  {/* Download Video file to device */}
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
