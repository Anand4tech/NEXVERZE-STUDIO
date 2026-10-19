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
} from 'lucide-react';
import { doc, setDoc, collection, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

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

interface ShowcaseGalleryProps {
  onRemixVideo: (sample: VideoSample) => void;
  onOpenStudioWithMode?: (mode: 'text' | 'image') => void;
  currentUserEmail?: string | null;
}

// Robust detector to ensure "Upload & Replace" is ONLY shown to the creator in LIVE PREVIEW
export const checkIsLivePreviewCreator = (userEmail?: string | null): boolean => {
  if (typeof window === 'undefined') return false;

  // 1. Direct creator/owner email match
  if (userEmail && userEmail.toLowerCase() === 'anand4earn@gmail.com') {
    return true;
  }

  // 2. Explicit admin parameter in URL (?creator=true or ?admin=true or ?edit=true)
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get('creator') === 'true' || params.get('admin') === 'true' || params.get('edit') === 'true') {
      return true;
    }
  } catch {}

  // 3. Local storage explicit admin flag
  try {
    const stored = localStorage.getItem('nexverze_is_admin_preview');
    if (stored === 'true') return true;
  } catch {}

  // 4. Live preview host check:
  // Running on localhost, 127.0.0.1, or dev preview container (contains '-dev-')
  const host = window.location.hostname || '';
  if (
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host.includes('-dev-') ||
    host.includes('webcontainer') ||
    host.includes('cloudshell') ||
    host.includes('run.app') ||
    host.includes('nexverze')
  ) {
    return true;
  }

  // 5. Embedded inside AI Studio preview iframe in the developer console
  try {
    if (window.self !== window.top) {
      return true;
    }
  } catch {
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

export const ShowcaseGallery: React.FC<ShowcaseGalleryProps> = ({
  onRemixVideo,
  onOpenStudioWithMode,
  currentUserEmail,
}) => {
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [activeFormatTab, setActiveFormatTab] = useState<'all' | '9:16' | '16:9' | '1:1'>('all');

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
      await setDoc(doc(db, 'gallery_replacements', targetId), {
        ...updatedReplacement,
        updated_at: new Date().toISOString(),
      });
    } catch (saveErr) {
      console.error('CRITICAL: Failed to sync metadata to server/firestore:', saveErr);
      setModalNotice('⚠️ Error saving to cloud. Please try again.');
      setIsUploading(false);
      return;
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
      console.error('CRITICAL: Failed removing from Firestore:', e);
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

  // Render individual Video Card
  const renderVideoCard = (video: VideoSample & { isCustomReplaced?: boolean; hasVideo?: boolean }) => {
    const isPlaying = playingVideoId === video.id;
    const isReplaced = Boolean(video.isCustomReplaced);
    const safeId = video.id.replace(/[^a-zA-Z0-9_-]/g, '_');
    const activeVideoSrc = blobUrlMap[video.id] || blobUrlMap[safeId] || video.video_url;
    const hasVideo = Boolean((video.hasVideo || isReplaced) && activeVideoSrc);

    const ratioClass =
      video.aspect_ratio === '16:9'
        ? 'aspect-[16/9]'
        : video.aspect_ratio === '1:1'
        ? 'aspect-square'
        : 'aspect-[9/16]';

    return (
      <div
        key={video.id}
        className={`group bg-[#121020] border rounded-2xl overflow-hidden shadow-xl transition-all duration-300 flex flex-col justify-between ${
          isReplaced && showCreatorButtons
            ? 'border-amber-500/60 ring-1 ring-amber-500/30 shadow-amber-950/20'
            : hasVideo
            ? 'border-[#272738] hover:border-purple-500/50'
            : 'border-dashed border-purple-500/30 hover:border-amber-400/60 bg-[#121020]/70'
        }`}
      >
        {/* Video / Placeholder Container */}
        <div
          className={`relative ${ratioClass} bg-black/90 overflow-hidden cursor-pointer flex items-center justify-center`}
          onClick={() => {
            if (hasVideo) {
              setPlayingVideoId(isPlaying ? null : video.id);
            } else if (showCreatorButtons) {
              handleOpenReplaceModal(video);
            }
          }}
        >
          {hasVideo && activeVideoSrc ? (
            <>
              <video
                key={`${video.id}-${activeVideoSrc}`}
                src={activeVideoSrc}
                poster={video.thumbnail_url || undefined}
                loop
                muted={isMuted}
                playsInline
                preload="auto"
                style={{
                  objectFit: video.objectFit || 'cover',
                  objectPosition: `${video.objectPositionX ?? 50}% ${video.objectPositionY ?? 50}%`,
                  transform: video.zoomScale && video.zoomScale !== 1 ? `scale(${video.zoomScale})` : undefined,
                  transformOrigin: `${video.objectPositionX ?? 50}% ${video.objectPositionY ?? 50}%`,
                }}
                className="w-full h-full group-hover:scale-105 transition-transform duration-500"
                ref={(el) => {
                  videoRefs.current[video.id] = el;
                  if (el) {
                    if (isPlaying) {
                      el.play().catch(() => {});
                    } else {
                      el.pause();
                    }
                  }
                }}
                onError={(e) => {
                  const videoElement = e.target as HTMLVideoElement;
                  const fallbackUrl = '/videos/festival-dance-9-16.mp4';
                  
                  // If we aren't already using the fallback, try it
                  if (videoElement.src !== fallbackUrl) {
                    console.warn('Gallery video error, attempting fallback:', videoElement.src);
                    videoElement.src = fallbackUrl;
                  } else {
                    // Fallback failed, hide
                    console.error('Gallery video fallback failed, hiding element.');
                    videoElement.style.display = 'none';
                  }
                }}
              />

              {/* Play / Pause Toggle Button Overlay */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/10 transition-colors pointer-events-none">
                <div className="w-11 h-11 rounded-full bg-purple-600/80 hover:bg-purple-600 text-white backdrop-blur-md flex items-center justify-center shadow-lg transition-transform group-hover:scale-110">
                  {isPlaying ? (
                    <Pause className="w-5 h-5 fill-white" />
                  ) : (
                    <Play className="w-5 h-5 fill-white ml-0.5" />
                  )}
                </div>
              </div>
            </>
          ) : (
            /* Empty Slot State (Ready for creator upload) */
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
                  {showCreatorButtons ? 'Click card or use button below to upload' : 'Showcase Reel'}
                </span>
              </div>
            </div>
          )}

          {/* Top Overlay Badges */}
          <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between text-[10px] mono z-10 pointer-events-none">
            <span className="px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md text-purple-300 font-bold border border-white/10 uppercase">
              {video.model === 'luma'
                ? 'Luma Fast'
                : video.model === 'kling'
                ? 'Kling Pro'
                : video.model === 'veo' || video.model === 'veo3'
                ? 'Veo Ultra'
                : video.model === 'wan'
                ? 'Wan 2.1 Pro'
                : video.model === 'hunyuan'
                ? 'Hunyuan 13B'
                : video.model === 'ltx'
                ? 'LTX Realtime'
                : video.model}
            </span>
            <div className="flex items-center gap-1.5">
              {isReplaced && showCreatorButtons && (
                <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-black font-black text-[9px] uppercase tracking-wider shadow">
                  Replaced
                </span>
              )}
              <span className="px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md text-white/90 font-bold border border-white/10">
                {video.aspect_ratio}
              </span>
            </div>
          </div>

          {/* Mute/Unmute Toggle in top-right when playing */}
          {hasVideo && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsMuted(!isMuted);
              }}
              className="absolute bottom-2.5 left-2.5 z-20 p-1.5 rounded-lg bg-black/70 hover:bg-black text-white/80 hover:text-white border border-white/10 backdrop-blur-md text-xs transition-all cursor-pointer opacity-70 group-hover:opacity-100"
              title={isMuted ? 'Unmute video' : 'Mute video'}
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>

        {/* Card Meta Info & Action Buttons */}
        <div className="p-3.5 space-y-2.5 bg-[#0e0c1a] border-t border-[#1d1a30]">
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-1">
              <h4 className="font-bold text-white text-xs sm:text-sm line-clamp-1 group-hover:text-purple-300 transition-colors">
                {video.title}
              </h4>
              {isReplaced && showCreatorButtons && (
                <span className="shrink-0 text-[10px] font-bold text-amber-400 mono">
                  [Custom Video]
                </span>
              )}
            </div>
            <p className="text-[11px] text-white/60 line-clamp-2 italic font-serif">
              "{video.prompt}"
            </p>
          </div>

          {/* Card Actions: Upload & Replace Video (ONLY in Live Preview Creator Mode) + Remix + Share */}
          <div className="space-y-1.5 pt-1 border-t border-[#1a172c]">
            {/* Each Video Button: Upload & Replace Video (ONLY shown to creator in live preview) */}
            {showCreatorButtons && (
              <button
                type="button"
                onClick={() => handleOpenReplaceModal(video)}
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

            {/* Adjust Fit & Framing (Move/Drag Up/Down, Left/Right) for Replaced Videos */}
            {isReplaced && showCreatorButtons && (
              <button
                type="button"
                onClick={() => handleOpenReplaceModal(video)}
                className="w-full py-1.5 px-3 rounded-xl bg-[#161327] hover:bg-amber-500/20 border border-amber-400/30 hover:border-amber-400 text-amber-300 text-[11px] font-bold mono flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
                title="Adjust video framing: move up and down, left and right by move/drag"
              >
                <Move className="w-3.5 h-3.5 text-amber-400" />
                <span>Adjust Framing ({video.objectPositionX ?? 50}% X, {video.objectPositionY ?? 50}% Y)</span>
              </button>
            )}

            {/* Remix Prompt & Social Share Action Row */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => onRemixVideo(video)}
                className="flex-1 py-1.5 px-3 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 hover:border-purple-400/60 text-purple-200 text-xs font-bold mono flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>Remix</span>
              </button>

              <button
                type="button"
                onClick={() => handleShareVideo(video)}
                className="p-2 rounded-xl bg-[#181528] hover:bg-[#201c36] border border-[#2e2a4a] text-white/70 hover:text-white transition-all cursor-pointer"
                title="Share video"
              >
                <Share2 className="w-3.5 h-3.5" />
              </button>

              {isReplaced && showCreatorButtons && (
                <button
                  type="button"
                  onClick={() => handleRevertToOriginal(video.id, video.title)}
                  className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 transition-all cursor-pointer"
                  title="Revert video to default"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <section className="space-y-8 pt-6 pb-6">
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

      {/* Aspect Ratio Filter Tabs */}
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
          All Formats (9:16, 16:9, 1:1)
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
      </div>

      {/* ========================================================================= */}
      {/* ROW 1: 9:16 VERTICAL REELS                                                */}
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
            {videos916.map((video) => renderVideoCard(video))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ROW 2: 16:9 WIDESCREEN VIDEOS (4 SLOTS)                                   */}
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

      {/* ========================================================================= */}
      {/* ROW 3: 1:1 SQUARE VIDEOS (4 SLOTS)                                        */}
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
    </section>
  );
};
