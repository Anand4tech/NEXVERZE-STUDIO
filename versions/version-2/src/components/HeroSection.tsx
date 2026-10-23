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
  ShieldCheck,
} from 'lucide-react';
import {
  storeGalleryVideoBlob,
  loadGalleryVideoBlob,
  deleteGalleryVideoBlob,
} from '../lib/galleryStorage';
import { checkIsLivePreviewCreator } from './ShowcaseGallery';

interface HeroSectionProps {
  onOpenStudioWithMode: (mode: 'text' | 'image' | 'mobile-to-cinematic' | 'watermark') => void;
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
  const [volumeLevel, setVolumeLevel] = useState<number>(100);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);

  // Touch & Gesture Feedback HUD state for mobile theater stage
  const [gestureFeedback, setGestureFeedback] = useState<{
    id: number;
    type: 'play' | 'pause' | 'mute' | 'unmute' | 'volume';
    label: string;
    sublabel?: string;
    x?: number;
    y?: number;
  } | null>(null);

  const tapTimeoutRef = useRef<number | null>(null);
  const lastTapTimeRef = useRef<number>(0);
  const touchSwipeStartRef = useRef<{
    x: number;
    y: number;
    startVolume: number;
    isSwipingVolume: boolean;
  } | null>(null);
  const gestureHudTimerRef = useRef<number | null>(null);

  const triggerGestureHud = (
    type: 'play' | 'pause' | 'mute' | 'unmute' | 'volume',
    label: string,
    sublabel?: string,
    x?: number,
    y?: number
  ) => {
    if (gestureHudTimerRef.current) {
      window.clearTimeout(gestureHudTimerRef.current);
    }
    setGestureFeedback({
      id: Date.now(),
      type,
      label,
      sublabel,
      x,
      y,
    });
    gestureHudTimerRef.current = window.setTimeout(() => {
      setGestureFeedback(null);
    }, 1150);
  };

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
    video.volume = Math.max(0, Math.min(1, volumeLevel / 100));
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
  }, [liveVideoSrc, isAudioOff, volumeLevel]);

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

  // Play / Pause Toggle with visual HUD feedback
  const togglePlayPause = (tapX?: number, tapY?: number) => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video
        .play()
        .then(() => {
          setIsPlaying(true);
          triggerGestureHud('play', 'Playing', 'Tap canvas to pause', tapX, tapY);
        })
        .catch(() => {
          setIsPlaying(false);
        });
    } else {
      video.pause();
      setIsPlaying(false);
      triggerGestureHud('pause', 'Paused', 'Tap canvas to play', tapX, tapY);
    }
  };

  // Audio Toggle (Default audio is OFF) with visual HUD feedback
  const toggleAudio = (tapX?: number, tapY?: number) => {
    const nextState = !isAudioOff;
    const nextVol = !nextState && volumeLevel === 0 ? 100 : volumeLevel;
    if (!nextState && volumeLevel === 0) {
      setVolumeLevel(100);
    }
    setIsAudioOff(nextState);
    if (videoRef.current) {
      videoRef.current.muted = nextState;
      if (!nextState) {
        videoRef.current.volume = Math.max(0.1, nextVol / 100);
        videoRef.current.play().catch(() => {});
      }
    }
    triggerGestureHud(
      nextState ? 'mute' : 'unmute',
      nextState ? 'Audio Muted' : `Audio ON • ${nextVol}%`,
      'Double-tap or swipe to adjust',
      tapX,
      tapY
    );
    showToast(nextState ? '🔇 Audio Muted (OFF)' : `🔊 Audio Enabled (${nextVol}%)`);
  };

  // Direct Volume Level change (from touch slider or horizontal swipe gesture)
  const handleVolumeChange = (newVolume: number, showHud: boolean = true) => {
    const clamped = Math.max(0, Math.min(100, Math.round(newVolume)));
    setVolumeLevel(clamped);
    const muted = clamped === 0;
    setIsAudioOff(muted);
    if (videoRef.current) {
      videoRef.current.volume = clamped / 100;
      videoRef.current.muted = muted;
      if (!muted && videoRef.current.paused && isPlaying) {
        videoRef.current.play().catch(() => {});
      }
    }
    if (showHud) {
      triggerGestureHud(
        muted ? 'mute' : 'volume',
        muted ? 'Audio Muted (0%)' : `Volume ${clamped}%`,
        'Slide horizontally to tune audio'
      );
    }
  };

  // Canvas Touch / Click Gesture Handlers (Single-tap = Play/Pause, Double-tap = Audio Toggle, Horizontal Swipe = Volume)
  const handleStageTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (isCreatorMode) return;
    const target = e.target as HTMLElement;
    if (target.closest('button, a, input, label, [data-no-canvas-gesture="true"]')) return;
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      touchSwipeStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        startVolume: isAudioOff ? 0 : volumeLevel,
        isSwipingVolume: false,
      };
    }
  };

  const handleStageTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (isCreatorMode || !touchSwipeStartRef.current || e.touches.length !== 1) return;
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchSwipeStartRef.current.x;
    const deltaY = touch.clientY - touchSwipeStartRef.current.y;

    // Activate horizontal volume swipe when horizontal movement clearly exceeds vertical scroll
    if (!touchSwipeStartRef.current.isSwipingVolume) {
      if (Math.abs(deltaX) > 28 && Math.abs(deltaX) > Math.abs(deltaY) * 1.6) {
        touchSwipeStartRef.current.isSwipingVolume = true;
      } else {
        return;
      }
    }

    if (touchSwipeStartRef.current.isSwipingVolume) {
      const volumeDelta = Math.round(deltaX / 2.2);
      const nextVolume = Math.max(0, Math.min(100, touchSwipeStartRef.current.startVolume + volumeDelta));
      handleVolumeChange(nextVolume, true);
    }
  };

  const handleStageTouchEnd = () => {
    if (touchSwipeStartRef.current?.isSwipingVolume) {
      // Suppress tap click if user just completed a volume swipe gesture
      lastTapTimeRef.current = 0;
      setTimeout(() => {
        touchSwipeStartRef.current = null;
      }, 60);
      return;
    }
    touchSwipeStartRef.current = null;
  };

  const handleStageCanvasTap = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isCreatorMode) return;
    if (touchSwipeStartRef.current?.isSwipingVolume) return;
    const target = e.target as HTMLElement;
    if (target.closest('button, a, input, label, [data-no-canvas-gesture="true"]')) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const tapX = e.clientX - rect.left;
    const tapY = e.clientY - rect.top;
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 260;

    if (now - lastTapTimeRef.current < DOUBLE_TAP_DELAY) {
      // Double-tap detected -> Toggle Volume / Mute
      if (tapTimeoutRef.current) {
        window.clearTimeout(tapTimeoutRef.current);
        tapTimeoutRef.current = null;
      }
      lastTapTimeRef.current = 0;
      toggleAudio(tapX, tapY);
    } else {
      // Single-tap candidate -> Wait briefly to confirm not a double-tap, then toggle Play/Pause
      lastTapTimeRef.current = now;
      if (tapTimeoutRef.current) {
        window.clearTimeout(tapTimeoutRef.current);
      }
      tapTimeoutRef.current = window.setTimeout(() => {
        togglePlayPause(tapX, tapY);
        tapTimeoutRef.current = null;
      }, DOUBLE_TAP_DELAY);
    }
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
    <section className="relative pt-2 sm:pt-4 pb-4 sm:pb-6 w-full max-w-full mx-auto">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-80 bg-gradient-to-r from-purple-600/20 via-fuchsia-600/20 to-pink-600/20 blur-3xl rounded-full pointer-events-none" />

      {/* Global Toast Notice */}
      {toastNotice && (
        <div className="fixed bottom-6 right-6 z-50 p-3.5 rounded-2xl bg-[#151128] border border-purple-500/50 text-white text-xs mono shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastNotice}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* OPTION A: RUNWAY-STYLE ROUNDED CINEMA FRAME HERO & PREVIEW PANEL          */}
      {/* Home Page Preview Panel video autoplays in the background of the texts    */}
      {/* and buttons (Text to Video, Image to Video, Mobile to Cinematic,          */}
      {/* Watermark Studio). Optimized for mobile with touch gesture controls.      */}
      {/* ========================================================================= */}
      <div className="relative w-full rounded-3xl overflow-hidden border border-purple-500/35 bg-[#0c0a1a] shadow-[0_0_60px_rgba(168,85,247,0.22)] p-2.5 sm:p-4 space-y-3">
        {/* Video Viewport Container (Runway-Style Rounded Cinema Frame) */}
        <div
          onClick={!isCreatorMode ? handleStageCanvasTap : undefined}
          onTouchStart={!isCreatorMode ? handleStageTouchStart : undefined}
          onTouchMove={!isCreatorMode ? handleStageTouchMove : undefined}
          onTouchEnd={!isCreatorMode ? handleStageTouchEnd : undefined}
          onPointerDown={isCreatorMode ? handleFramingPointerDown : undefined}
          onPointerMove={isCreatorMode ? handleFramingPointerMove : undefined}
          onPointerUp={isCreatorMode ? handleFramingPointerUp : undefined}
          onPointerCancel={isCreatorMode ? handleFramingPointerUp : undefined}
          className={`relative w-full min-h-[540px] sm:min-h-[620px] lg:min-h-[680px] flex items-center justify-center overflow-hidden rounded-2xl bg-black select-none transition-all ${
            isCreatorMode
              ? isDraggingFraming
                ? 'touch-none cursor-grabbing ring-2 ring-amber-400 scale-[1.002]'
                : 'touch-none cursor-grab hover:ring-1 hover:ring-amber-400/50'
              : 'touch-pan-y cursor-pointer'
          }`}
        >
          {/* Auto-Playing Background Preview Video */}
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
            className="absolute inset-0 w-full h-full pointer-events-none transition-transform duration-75"
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
            <source src="/videos/sample-1.mp4" type="video/mp4" />
          </video>

          {/* Cinematic Readability Gradient Overlay over Background Video */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/45 to-black/75 pointer-events-none z-[5]" />

          {/* Touch Coordinate Ripple & Center Gesture HUD Feedback Overlay */}
          {gestureFeedback && (
            <div
              key={gestureFeedback.id}
              className="absolute inset-0 pointer-events-none z-30 flex items-center justify-center"
            >
              {/* Localized Tap Ripple Ring where finger touched the canvas */}
              {typeof gestureFeedback.x === 'number' && typeof gestureFeedback.y === 'number' && (
                <span
                  style={{
                    left: `${gestureFeedback.x}px`,
                    top: `${gestureFeedback.y}px`,
                  }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full border-2 border-purple-400/70 bg-purple-500/20 animate-ping"
                />
              )}

              {/* Center Theater Stage Gesture Status HUD */}
              <div className="px-6 py-5 rounded-3xl bg-black/80 backdrop-blur-xl border border-white/20 shadow-[0_0_50px_rgba(168,85,247,0.45)] flex flex-col items-center gap-2.5 animate-in fade-in zoom-in-95 duration-150">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-600/40 to-pink-600/40 border border-purple-400/50 flex items-center justify-center text-white shadow-inner">
                  {gestureFeedback.type === 'play' && <Play className="w-8 h-8 fill-white text-white ml-0.5" />}
                  {gestureFeedback.type === 'pause' && <Pause className="w-8 h-8 fill-white text-white" />}
                  {gestureFeedback.type === 'mute' && <VolumeX className="w-8 h-8 text-rose-400" />}
                  {(gestureFeedback.type === 'unmute' || gestureFeedback.type === 'volume') && (
                    <Volume2 className="w-8 h-8 text-emerald-400" />
                  )}
                </div>
                <div className="text-center space-y-0.5">
                  <div className="text-sm font-extrabold text-white tracking-wide mono">
                    {gestureFeedback.label}
                  </div>
                  {gestureFeedback.sublabel && (
                    <div className="text-[11px] text-white/65 mono">
                      {gestureFeedback.sublabel}
                    </div>
                  )}
                </div>
                {(gestureFeedback.type === 'volume' || gestureFeedback.type === 'unmute' || gestureFeedback.type === 'mute') && (
                  <div className="w-36 h-1.5 rounded-full bg-white/15 overflow-hidden mt-0.5">
                    <div
                      className={`h-full transition-all duration-100 rounded-full ${
                        isAudioOff ? 'w-0 bg-rose-400' : 'bg-gradient-to-r from-emerald-400 to-cyan-400'
                      }`}
                      style={{ width: `${isAudioOff ? 0 : volumeLevel}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Top Overlay Controls: Ergonomic 44px+ Touch Hitboxes for Play/Pause & Volume */}
          <div className="absolute top-3 left-3 right-3 sm:top-3.5 sm:left-3.5 sm:right-3.5 flex items-center justify-between z-20 pointer-events-none">
            <div className="flex items-center gap-2">
              {/* Play / Pause Toggle Button (Min 44px touch target on mobile) */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  togglePlayPause();
                }}
                aria-label={isPlaying ? 'Pause background video' : 'Play background video'}
                className="pointer-events-auto min-h-[44px] min-w-[44px] sm:min-h-[36px] px-3.5 py-2 sm:px-3 sm:py-1.5 rounded-full bg-black/75 hover:bg-black active:scale-95 text-white text-xs sm:text-[11px] font-bold mono border border-white/20 backdrop-blur-md flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg"
                title={isPlaying ? 'Pause background video (or single-tap canvas)' : 'Play background video (or single-tap canvas)'}
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-4 h-4 sm:w-3.5 sm:h-3.5 fill-white text-white shrink-0" />
                    <span className="text-white/90 whitespace-nowrap">Playing</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 sm:w-3.5 sm:h-3.5 fill-white text-white shrink-0" />
                    <span className="text-white/90 whitespace-nowrap">Paused</span>
                  </>
                )}
              </button>

              {/* Aspect Ratio Badge: ONLY shown to creator, NOT shown to users */}
              {isCreatorMode && (
                <span className="px-2.5 py-1 rounded-full bg-black/75 backdrop-blur-md text-amber-300 text-[10px] font-bold mono border border-amber-400/30 uppercase flex items-center gap-1">
                  <Move className="w-3 h-3 text-amber-400" />
                  <span>{previewConfig.aspectRatio} (Creator Drag Enabled)</span>
                </span>
              )}
            </div>

            {/* Audio on/off toggle badge on video (Min 44px touch target on mobile) */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleAudio();
              }}
              aria-label={isAudioOff ? 'Unmute background video audio' : 'Mute background video audio'}
              className="pointer-events-auto min-h-[44px] min-w-[44px] sm:min-h-[36px] px-3.5 py-2 sm:px-3 sm:py-1.5 rounded-full bg-black/75 hover:bg-black active:scale-95 text-white text-xs sm:text-[11px] font-bold mono border border-white/20 backdrop-blur-md flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg"
              title={isAudioOff ? 'Tap to turn audio ON (or double-tap canvas)' : 'Tap to turn audio OFF (or double-tap canvas)'}
            >
              {isAudioOff ? (
                <>
                  <VolumeX className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-rose-400 shrink-0" />
                  <span className="text-white/90 whitespace-nowrap">Audio: OFF</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-emerald-400 shrink-0" />
                  <span className="text-emerald-300 whitespace-nowrap tabular-nums">
                    Audio: {volumeLevel}%
                  </span>
                </>
              )}
            </button>
          </div>

          {/* CENTERED HERO CONTENT OVERLAY ON THE CINEMA FRAME VIDEO */}
          <div className="relative z-10 text-center space-y-5 max-w-4xl mx-auto px-4 sm:px-8 py-16 sm:py-20">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-purple-400/40 text-purple-200 text-xs font-bold mono uppercase tracking-wider shadow-lg">
              <Sparkles className="w-4 h-4 text-amber-300 fill-amber-300" />
              <span>Next-Gen Photorealistic AI Video Studio</span>
            </div>

            <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-tight drop-shadow-[0_4px_24px_rgba(0,0,0,0.85)]">
              Turn Any Prompt & Photo Into <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-purple-300 via-fuchsia-300 to-pink-300 bg-clip-text text-transparent font-black">
                Cinematic 4K AI Videos
              </span>
            </h1>

            <p className="text-sm sm:text-base md:text-lg text-white/90 max-w-2xl mx-auto font-medium drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]">
              Create viral Instagram Reels & Shorts in seconds. Powered by Luma Fast, Kling Pro & Veo Ultra with 10 Indian Languages & AI Voiceover synthesis.
            </p>

            {/* Big CTA Buttons (Clicking each opens ONLY its respective workspace) */}
            <div
              data-no-canvas-gesture="true"
              className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 pt-3"
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenStudioWithMode('text');
                }}
                className="w-full sm:w-auto min-h-[48px] font-extrabold py-4 px-7 rounded-2xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-2xl shadow-purple-900/60 flex items-center justify-center gap-2.5 text-sm sm:text-base transition-all active:scale-[0.98] cursor-pointer ring-1 ring-purple-300/50 whitespace-nowrap"
              >
                <Wand2 className="w-5 h-5 text-amber-300 shrink-0" />
                <span>✨ Text to Video</span>
                <ArrowRight className="w-4 h-4 text-white/80 shrink-0" />
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenStudioWithMode('image');
                }}
                className="w-full sm:w-auto min-h-[48px] font-extrabold py-4 px-7 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white shadow-2xl shadow-indigo-900/60 flex items-center justify-center gap-2.5 text-sm sm:text-base transition-all active:scale-[0.98] cursor-pointer ring-1 ring-purple-300/50 whitespace-nowrap"
              >
                <ImageIcon className="w-5 h-5 text-cyan-300 shrink-0" />
                <span>🖼️ Image to Video</span>
                <ArrowRight className="w-4 h-4 text-white/80 shrink-0" />
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenStudioWithMode('mobile-to-cinematic');
                }}
                className="w-full sm:w-auto min-h-[48px] font-extrabold py-4 px-7 rounded-2xl bg-gradient-to-r from-amber-400 via-orange-500 to-pink-600 hover:from-amber-300 hover:to-pink-500 text-black shadow-2xl shadow-amber-900/60 flex items-center justify-center gap-2.5 text-sm sm:text-base transition-all active:scale-[0.98] cursor-pointer ring-1 ring-amber-300/70 whitespace-nowrap"
              >
                <Sparkles className="w-5 h-5 text-black shrink-0" />
                <span>🎥 Mobile to Cinematic</span>
                <ArrowRight className="w-4 h-4 text-black/80 shrink-0" />
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenStudioWithMode('watermark');
                }}
                className="w-full sm:w-auto min-h-[48px] font-extrabold py-4 px-6 rounded-2xl bg-black/70 hover:bg-purple-950/80 backdrop-blur-md text-purple-100 border border-purple-400/50 shadow-2xl flex items-center justify-center gap-2 text-sm sm:text-base transition-all active:scale-[0.98] cursor-pointer whitespace-nowrap"
              >
                <ShieldCheck className="w-5 h-5 text-cyan-300 shrink-0" />
                <span>🛡️ Watermark Studio</span>
                <ArrowRight className="w-4 h-4 text-purple-200/80 shrink-0" />
              </button>
            </div>

            {/* Feature Highlights (Clean Unboxed Metadata with Typographic Separators) */}
            <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 pt-2 text-xs mono text-white/90 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Instant ₹99 Trial Pack (150cr)</span>
              </span>
              <span aria-hidden="true" className="text-white/40">·</span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>10 Major Indian Languages</span>
              </span>
              <span aria-hidden="true" className="text-white/40">·</span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>4K Quality Lock Engine</span>
              </span>
            </div>
          </div>

          {/* PUBLIC MOBILE THUMB-ZONE GESTURE DOCK (Bottom of Hero Theater Stage) */}
          {!isCreatorMode && (
            <div
              data-no-canvas-gesture="true"
              onClick={(e) => e.stopPropagation()}
              className="absolute bottom-2.5 left-2.5 right-2.5 sm:bottom-3.5 sm:left-4 sm:right-4 flex items-center justify-between gap-2 z-20"
            >
              {/* Left: Quick Touch Play/Pause + Volume Scrubber Pill */}
              <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 py-1.5 rounded-2xl bg-black/75 backdrop-blur-md border border-white/15 shadow-lg">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePlayPause();
                  }}
                  aria-label={isPlaying ? 'Pause video' : 'Play video'}
                  className="min-h-[38px] min-w-[38px] rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center text-white transition-all cursor-pointer"
                  title={isPlaying ? 'Pause video' : 'Play video'}
                >
                  {isPlaying ? (
                    <Pause className="w-4 h-4 fill-white text-white" />
                  ) : (
                    <Play className="w-4 h-4 fill-white text-white ml-0.5" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleAudio();
                  }}
                  aria-label={isAudioOff ? 'Unmute audio' : 'Mute audio'}
                  className="min-h-[38px] min-w-[38px] rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center text-white transition-all cursor-pointer"
                  title={isAudioOff ? 'Unmute audio' : 'Mute audio'}
                >
                  {isAudioOff ? (
                    <VolumeX className="w-4 h-4 text-rose-400" />
                  ) : (
                    <Volume2 className="w-4 h-4 text-emerald-400" />
                  )}
                </button>

                {/* Touch-friendly inline volume slider */}
                <div className="flex items-center gap-2 pl-1 pr-1.5">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    aria-label="Background video volume"
                    value={isAudioOff ? 0 : volumeLevel}
                    onChange={(e) => handleVolumeChange(Number(e.target.value), true)}
                    className="w-20 sm:w-24 h-1.5 accent-emerald-400 bg-white/20 rounded-lg cursor-pointer"
                  />
                  <span className="text-[11px] font-mono tabular-nums text-white/80 min-w-[32px] text-right">
                    {isAudioOff ? 'OFF' : `${volumeLevel}%`}
                  </span>
                </div>
              </div>

              {/* Right: Interactive Touch Gesture Hint */}
              <div className="hidden xs:flex sm:flex items-center gap-2 px-3 py-2 rounded-2xl bg-black/65 backdrop-blur-md border border-white/10 text-[11px] text-white/75 mono pointer-events-none">
                <span>Tap: Play/Pause</span>
                <span aria-hidden="true" className="text-white/35">·</span>
                <span>2× Tap: Audio</span>
                <span aria-hidden="true" className="hidden md:inline text-white/35">·</span>
                <span className="hidden md:inline">Swipe ↔: Volume</span>
              </div>
            </div>
          )}

          {/* CREATOR MODE ONLY: Floating Drag Movement Indicator & Direct Save Badge */}
          {isCreatorMode && (
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between z-20 pointer-events-none gap-2">
              <span className="px-3 py-1 rounded-full bg-black/85 backdrop-blur-md text-amber-300 text-[10px] font-bold mono border border-amber-400/50 flex items-center gap-1.5 shadow-lg">
                <Move className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span>Drag: ↕ Up/Down • ↔ Left/Right ({uploadPosX}%, {uploadPosY}%)</span>
              </span>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSavePositionDirectly();
                }}
                className="pointer-events-auto px-3 py-1 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-black font-black text-[10px] mono border border-emerald-300 shadow-lg flex items-center gap-1 transition-all cursor-pointer active:scale-95"
                title="Save video movement position"
              >
                <Save className="w-3 h-3 text-black" />
                <span>Save Movement</span>
              </button>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* CONTROL BAR:                                                              */}
        {/* FOR REGULAR USERS: Ergonomic Play/Pause + Audio On/Off + Gesture Summary  */}
        {/* FOR CREATOR ('me'): Available when Creator Mode is toggled                */}
        {/* ========================================================================= */}
        {!isCreatorMode ? (
          /* ========================================================================= */
          /* 1. PUBLIC USER VIEW: Ergonomic Touch Controls & Audio On/Off              */
          /* ========================================================================= */
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[#1f1a3a]">
            <div className="flex items-center gap-2">
              {/* Play / Pause Touch Button */}
              <button
                type="button"
                onClick={() => togglePlayPause()}
                className="min-h-[44px] px-4 py-2 rounded-xl border border-[#2b2548] bg-[#141026] hover:border-purple-500/40 text-white/90 hover:text-white text-xs font-bold mono flex items-center gap-2 transition-all cursor-pointer shadow-sm active:scale-95 whitespace-nowrap"
                title="Toggle background video playback"
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-4 h-4 text-purple-400 fill-purple-400 shrink-0" />
                    <span>Pause Stage</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 text-emerald-400 fill-emerald-400 shrink-0" />
                    <span>Play Stage</span>
                  </>
                )}
              </button>

              {/* Audio On/Off (Default: OFF) */}
              <button
                type="button"
                onClick={() => toggleAudio()}
                className={`min-h-[44px] px-4 py-2 rounded-xl border text-xs font-bold mono flex items-center gap-2 transition-all cursor-pointer shadow-sm active:scale-95 whitespace-nowrap ${
                  isAudioOff
                    ? 'bg-[#141026] border-[#2b2548] text-white/80 hover:text-white hover:border-purple-500/40'
                    : 'bg-emerald-500/20 border-emerald-400/50 text-emerald-300 shadow-emerald-950/40'
                }`}
                title="Toggle audio sound (default is off)"
              >
                {isAudioOff ? (
                  <>
                    <VolumeX className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>Audio: OFF</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="tabular-nums">Audio: ON ({volumeLevel}%)</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-[11px] mono text-white/50 sm:hidden">
                Tap stage: Play/Pause · 2× Tap: Audio
              </span>

              {/* Discreet Creator toggle (ONLY shown to creator in live preview) */}
              {isLivePreview && (
                <button
                  type="button"
                  onClick={toggleCreatorMode}
                  className="min-h-[36px] text-[10px] mono text-white/20 hover:text-amber-400/80 px-2 py-1 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                  title="Toggle Creator Controls (Show to Me)"
                >
                  <EyeOff className="w-3 h-3" />
                  <span className="hidden sm:inline">Creator</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* 2. CREATOR VIEW (SHOW TO ME): Creator Controls Toolbar                    */
          /* ========================================================================= */
          <div className="space-y-3 pt-1 border-t border-[#1f1a3a]">
            <div className="flex items-center justify-between text-[11px] mono text-amber-300/80 bg-amber-500/10 px-3 py-1 rounded-xl border border-amber-400/20">
              <span className="font-bold flex items-center gap-1.5">
                👑 Creator Controls (Show to Me)
              </span>
              <button
                type="button"
                onClick={toggleCreatorMode}
                className="text-white/60 hover:text-white underline text-[10px] flex items-center gap-1 cursor-pointer"
              >
                <Eye className="w-3 h-3 text-amber-400" />
                <span>Switch to User View</span>
              </button>
            </div>

            {/* Interactive Video Framing & Movement Toolbar (ONLY shown in Creator Mode) */}
            <div className="p-2.5 rounded-2xl bg-[#141028] border border-amber-500/30 flex flex-wrap items-center justify-between gap-2 text-xs mono">
              <div className="flex items-center gap-2">
                <span className="text-amber-300 font-bold flex items-center gap-1 text-[11px]">
                  <Move className="w-3.5 h-3.5 text-amber-400" />
                  <span>Nudge Position:</span>
                </span>
                <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/10">
                  <button
                    type="button"
                    onClick={() => nudgeFraming('left')}
                    className="p-1 rounded-lg bg-white/5 hover:bg-amber-500/20 text-white hover:text-amber-300 transition-colors cursor-pointer"
                    title="Nudge Left"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => nudgeFraming('right')}
                    className="p-1 rounded-lg bg-white/5 hover:bg-amber-500/20 text-white hover:text-amber-300 transition-colors cursor-pointer"
                    title="Nudge Right"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => nudgeFraming('up')}
                    className="p-1 rounded-lg bg-white/5 hover:bg-amber-500/20 text-white hover:text-amber-300 transition-colors cursor-pointer"
                    title="Nudge Up"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => nudgeFraming('down')}
                    className="p-1 rounded-lg bg-white/5 hover:bg-amber-500/20 text-white hover:text-amber-300 transition-colors cursor-pointer"
                    title="Nudge Down"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={resetFraming}
                  className="px-2 py-1 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 text-[10px] flex items-center gap-1 transition-colors cursor-pointer"
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

              {/* Save Movement Button */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-white/50">
                  Pos: {uploadPosX}%, {uploadPosY}%
                </span>
                <button
                  type="button"
                  onClick={handleSavePositionDirectly}
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-black text-xs font-black mono flex items-center gap-1.5 shadow-md shadow-emerald-950/50 transition-all active:scale-95 cursor-pointer"
                  title="Save current video position and movement"
                >
                  <Save className="w-3.5 h-3.5 text-black" />
                  <span>Save Movement</span>
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2.5">
              {/* Format Buttons: 9:16, 16:9, 1:1 */}
              <div className="flex items-center gap-1.5 bg-[#141026] p-1 rounded-2xl border border-[#2b2548]">
                <button
                  type="button"
                  onClick={() => handleSelectAspectRatio('9:16')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold mono flex items-center gap-1.5 transition-all cursor-pointer ${
                    previewConfig.aspectRatio === '9:16'
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-950/60'
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
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md shadow-purple-950/60'
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
                      ? 'bg-gradient-to-r from-purple-600 to-cyan-600 text-white shadow-md shadow-purple-950/60'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Square className="w-3.5 h-3.5" />
                  <span>1:1</span>
                </button>
              </div>

              {/* Action Buttons: Audio On/Off, Upload & Replace, Remix, Edit */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Audio On/Off (Default: OFF) */}
                <button
                  type="button"
                  onClick={() => toggleAudio()}
                  className={`px-3 py-2 rounded-xl border text-xs font-bold mono flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95 ${
                    isAudioOff
                      ? 'bg-[#141026] border-[#2b2548] text-white/70 hover:text-white hover:border-purple-500/40'
                      : 'bg-emerald-500/20 border-emerald-400/50 text-emerald-300'
                  }`}
                  title="Toggle audio sound (default is off)"
                >
                  {isAudioOff ? (
                    <>
                      <VolumeX className="w-3.5 h-3.5 text-rose-400" />
                      <span>Audio: Off</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Audio: On</span>
                    </>
                  )}
                </button>

                {/* Upload and Replace Video */}
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
                  className="px-3 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black text-xs font-black mono flex items-center gap-1.5 shadow-md shadow-amber-950/40 transition-all active:scale-95 cursor-pointer"
                  title="Upload and replace this preview video"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload & Replace Video</span>
                </button>

                {/* Remix */}
                <button
                  type="button"
                  onClick={handleRemix}
                  className="px-3.5 py-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-200 text-xs font-bold mono flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                  title="Remix prompt into Studio"
                >
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  <span>Remix</span>
                </button>

                {/* Edit Button (decide 9:16, 16:9, 1:1 and save video) */}
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(true)}
                  className="px-3 py-2 rounded-xl bg-[#18142c] hover:bg-purple-900/30 border border-purple-500/40 text-purple-200 hover:text-white text-xs font-bold mono flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
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
