import React, { useState, useRef } from 'react';
import {
  Upload,
  Image as ImageIcon,
  X,
  Grid,
  RefreshCw,
  Layers,
  Wand2,
  Sparkles,
  ArrowRight,
  Plus,
  Trash2,
  Check,
  RotateCcw,
  Magnet,
  Move,
  ZoomIn,
  Crop,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  Camera,
  Music,
  Subtitles,
  Volume2,
  VolumeX,
  Eye,
  Lock,
  GitCommitHorizontal,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { LanguageSelectorButton } from './LanguageSelectorButton';
import { ViralPromptChips } from './ViralPromptChips';
import {
  SmartSoundscapeConfig,
  BGM_MOOD_OPTIONS,
  SFX_AMBIENT_OPTIONS,
  smartSoundscapeEngine,
} from '../lib/smartSoundscape';
import { ViralCaptionsConfig } from './TextToVideoPowerSuite';

export type AspectRatioType = '9:16' | '16:9' | '1:1';

export type MotionZoneMode = 'full' | 'subject_only' | 'background_only' | 'cinemagraph';

export interface PhotoCameraPresetOption {
  id: string;
  label: string;
  badge: string;
  promptDirective: string;
  hoverTransformClass: string;
}

export const PHOTO_CAMERA_PRESETS: PhotoCameraPresetOption[] = [
  {
    id: 'none',
    label: 'Natural Motion',
    badge: 'Default',
    promptDirective: '',
    hoverTransformClass: '',
  },
  {
    id: 'parallax_push',
    label: '🔍 3D Parallax Push-In',
    badge: 'Depth 3D',
    promptDirective:
      '3D parallax camera push-in toward the foreground subject while background separates with realistic depth-of-field bokeh',
    hoverTransformClass: 'scale-110 transition-transform duration-700 ease-out',
  },
  {
    id: 'drone_reveal',
    label: '🦅 Pull-Back Drone Reveal',
    badge: 'Epic Wide',
    promptDirective:
      'cinematic aerial crane pull-back camera reveal expanding from the subject to showcase the surrounding environment',
    hoverTransformClass: 'scale-95 transition-transform duration-700 ease-out',
  },
  {
    id: 'product_orbit',
    label: '🔄 360° Hero Orbit',
    badge: 'Commercial',
    promptDirective:
      'smooth 180-degree orbital tracking shot circling around the primary subject with dynamic studio rim lighting',
    hoverTransformClass: 'scale-105 rotate-1 transition-transform duration-700 ease-out',
  },
  {
    id: 'handheld_action',
    label: '⚡ Handheld Action Energy',
    badge: 'Mass / Reels',
    promptDirective:
      'energetic handheld cinema camera motion with subtle organic shake, fast focus rack, and high-adrenaline pacing',
    hoverTransformClass: 'scale-105 -rotate-1 transition-transform duration-300 ease-in-out',
  },
  {
    id: 'golden_pan',
    label: '🌅 Golden Hour Slow Pan',
    badge: 'Aesthetic',
    promptDirective:
      'slow horizontal Steadicam pan across the frame with warm golden-hour volumetric light rays and floating dust motes',
    hoverTransformClass: 'scale-105 translate-x-1.5 transition-transform duration-700 ease-out',
  },
];

export const MOTION_ZONE_OPTIONS: Array<{
  id: MotionZoneMode;
  title: string;
  subtitle: string;
  cost: number;
  promptConstraint: string;
}> = [
  {
    id: 'full',
    title: '🎬 Full Scene Motion',
    subtitle: 'Subject + Background animate together',
    cost: 0,
    promptConstraint: '',
  },
  {
    id: 'subject_only',
    title: '🎭 Animate Subject Only',
    subtitle: 'Lock background architecture static',
    cost: 5,
    promptConstraint:
      '[MOTION ZONE LOCK: Animate ONLY the foreground main subject with natural lifelike motion while keeping the background environment and architecture 100% locked and static]',
  },
  {
    id: 'background_only',
    title: '🌊 Animate Background Only',
    subtitle: 'Lock subject/face 100% crisp & still',
    cost: 5,
    promptConstraint:
      '[MOTION ZONE LOCK: Keep the primary foreground subject and face 100% sharp and still while animating ONLY the background sky, water, lights, clouds, and atmosphere]',
  },
  {
    id: 'cinemagraph',
    title: '✨ Living Cinemagraph Loop',
    subtitle: 'Subtle seamless micro-motion loop',
    cost: 5,
    promptConstraint:
      '[MOTION ZONE LOCK: Seamless living cinemagraph loop with ultra-subtle micro-movements in hair, fabric, and lighting while preserving exact photo identity]',
  },
];

export interface ImageCropState {
  posX: number; // 0 to 100 (%)
  posY: number; // 0 to 100 (%)
  scale: number; // 1 to 3
}

export const DEFAULT_CROP: ImageCropState = {
  posX: 50,
  posY: 50,
  scale: 1,
};

// Grid Snap Points: 0% (Edge), 33.33% (Rule of Thirds), 50% (Center), 66.67% (Rule of Thirds), 100% (Edge)
export const SNAP_POINTS = [
  { value: 0, label: '0% Edge' },
  { value: 33.33, label: '33% Rule of Thirds' },
  { value: 50, label: '50% Center' },
  { value: 66.67, label: '67% Rule of Thirds' },
  { value: 100, label: '100% Edge' },
];
export const SNAP_THRESHOLD = 3.5; // percent threshold to snap magnetically

// Real HTML5 Offscreen Canvas Crop & Zoom Baker (Fix #1)
export async function bakeImageCropToDataUrl(
  imageSrc: string,
  crop: ImageCropState,
  ratio: AspectRatioType
): Promise<string> {
  const isDefault =
    Math.abs(crop.posX - 50) <= 0.5 &&
    Math.abs(crop.posY - 50) <= 0.5 &&
    Math.abs(crop.scale - 1) <= 0.05;

  if (isDefault) {
    return imageSrc;
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const targetW = ratio === '16:9' ? 1920 : 1080;
        const targetH = ratio === '9:16' ? 1920 : 1080;
        const canvas = document.createElement('canvas');
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(imageSrc);
          return;
        }

        const imgW = img.naturalWidth || img.width || targetW;
        const imgH = img.naturalHeight || img.height || targetH;

        // Calculate object-fit: cover base dimensions
        const targetAspect = targetW / targetH;
        const imgAspect = imgW / imgH;

        let renderW = targetW;
        let renderH = targetH;

        if (imgAspect > targetAspect) {
          renderH = targetH;
          renderW = targetH * imgAspect;
        } else {
          renderW = targetW;
          renderH = targetW / imgAspect;
        }

        // Apply user zoom scale
        const scaledW = renderW * crop.scale;
        const scaledH = renderH * crop.scale;

        // Apply objectPosition (posX%, posY%)
        const offsetX = (targetW - scaledW) * (crop.posX / 100);
        const offsetY = (targetH - scaledH) * (crop.posY / 100);

        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, targetW, targetH);
        ctx.drawImage(img, offsetX, offsetY, scaledW, scaledH);

        const bakedDataUrl = canvas.toDataURL('image/jpeg', 0.94);
        resolve(bakedDataUrl);
      } catch {
        resolve(imageSrc);
      }
    };
    img.onerror = () => resolve(imageSrc);
    img.src = imageSrc;
  });
}

export interface VisionMotionSuggestion {
  title: string;
  style: string;
  prompt: string;
}

interface ImageUploadGuideProps {
  imageUrl: string | null;
  imageUrls?: string[];
  onImageUpload: (file: File) => void;
  onImagesUpload?: (files: File[]) => void;
  onRemoveImage: () => void;
  onRemoveImageAt?: (index: number) => void;
  onClearAllImages?: () => void;
  onSelectActiveImage?: (imageUrl: string, index: number) => void;
  onUpdateImageAt?: (index: number, newImageUrl: string) => void;
  selectedRatio: AspectRatioType;
  onRatioChange: (ratio: AspectRatioType) => void;

  // Embedded Prompt / Instructions Box
  prompt?: string;
  onPromptChange?: (prompt: string) => void;
  onEnhancePrompt?: () => void;
  isEnhancingPrompt?: boolean;
  promptEnhancedSuccess?: boolean;

  // New Image-to-Video Pro Power Suite Props
  keyframeBridgeEnabled?: boolean;
  onToggleKeyframeBridge?: (enabled: boolean) => void;
  startFrameIndex?: number;
  endFrameIndex?: number;
  onSelectStartFrameIndex?: (index: number) => void;
  onSelectEndFrameIndex?: (index: number) => void;

  motionZoneMode?: MotionZoneMode;
  onMotionZoneModeChange?: (mode: MotionZoneMode) => void;

  selectedPhotoCameraPreset?: string;
  onSelectPhotoCameraPreset?: (presetId: string, directive: string) => void;

  onEnhancePhoto4K?: (imageUrl: string, index: number) => Promise<string | null>;
  isEnhancingPhoto4K?: boolean;

  onAnalyzePhotoMotion?: (imageUrl: string) => Promise<VisionMotionSuggestion[] | null>;
  isAnalyzingPhotoMotion?: boolean;

  soundscapeConfig?: SmartSoundscapeConfig;
  onSoundscapeConfigChange?: (cfg: SmartSoundscapeConfig) => void;
  viralCaptions?: ViralCaptionsConfig;
  onViralCaptionsChange?: (cfg: ViralCaptionsConfig) => void;

  // Embedded Generate Button
  onGenerate?: (overrideCroppedStartUrl?: string, overrideCroppedEndUrl?: string) => void;
  isGenerating?: boolean;
  generationProgress?: number;
  liveCreditCost?: number;
  userCredits?: number;
  selectedModelName?: string;
}

export const ImageUploadGuide: React.FC<ImageUploadGuideProps> = ({
  imageUrl,
  imageUrls = [],
  onImageUpload,
  onImagesUpload,
  onRemoveImage,
  onRemoveImageAt,
  onClearAllImages,
  onSelectActiveImage,
  onUpdateImageAt,
  selectedRatio,
  onRatioChange,
  prompt,
  onPromptChange,
  onEnhancePrompt,
  isEnhancingPrompt,
  promptEnhancedSuccess,
  keyframeBridgeEnabled = false,
  onToggleKeyframeBridge,
  startFrameIndex = 0,
  endFrameIndex = 1,
  onSelectStartFrameIndex,
  onSelectEndFrameIndex,
  motionZoneMode = 'full',
  onMotionZoneModeChange,
  selectedPhotoCameraPreset = 'none',
  onSelectPhotoCameraPreset,
  onEnhancePhoto4K,
  isEnhancingPhoto4K = false,
  onAnalyzePhotoMotion,
  isAnalyzingPhotoMotion = false,
  soundscapeConfig,
  onSoundscapeConfigChange,
  viralCaptions,
  onViralCaptionsChange,
  onGenerate,
  isGenerating = false,
  generationProgress = 0,
  liveCreditCost = 50,
  userCredits = 0,
  selectedModelName = 'Luma Fast',
}) => {
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showGrid, setShowGrid] = useState(true);
  const [showAllBoundaries, setShowAllBoundaries] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [activePreviewIndex, setActivePreviewIndex] = useState(0);

  // Per-image crop state map (index -> ImageCropState)
  const [imageCrops, setImageCrops] = useState<Record<number, ImageCropState>>({});
  const [bakedIndices, setBakedIndices] = useState<Record<number, boolean>>({});
  const [enhancedIndices, setEnhancedIndices] = useState<Record<number, boolean>>({});
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [activeSnapLabel, setActiveSnapLabel] = useState<string | null>(null);
  const [isDraggingFraming, setIsDraggingFraming] = useState(false);
  const [hoveredCameraPresetId, setHoveredCameraPresetId] = useState<string | null>(null);
  const [visionSuggestions, setVisionSuggestions] = useState<VisionMotionSuggestion[]>([]);
  const [isTestingSoundscape, setIsTestingSoundscape] = useState(false);

  const dragStartRef = useRef<{
    startX: number;
    startY: number;
    initPosX: number;
    initPosY: number;
  } | null>(null);

  // Derive active image list (prefer imageUrls array if populated, fallback to single imageUrl)
  const activeImages = imageUrls.length > 0 ? imageUrls : imageUrl ? [imageUrl] : [];
  const safePreviewIndex = activeImages[activePreviewIndex] ? activePreviewIndex : 0;

  // Active crop state for currently selected image
  const currentCrop = imageCrops[safePreviewIndex] || DEFAULT_CROP;

  // Determine if image is currently manually adjusted from default center-fitted state
  const isManuallyAdjusted =
    Math.abs(currentCrop.posX - DEFAULT_CROP.posX) > 0.5 ||
    Math.abs(currentCrop.posY - DEFAULT_CROP.posY) > 0.5 ||
    Math.abs(currentCrop.scale - DEFAULT_CROP.scale) > 0.05;

  // Snap-to-grid utility: magnetically snaps value to closest point if within threshold
  const snapValue = (
    val: number
  ): { value: number; snappedPoint: (typeof SNAP_POINTS)[number] | null } => {
    const clamped = Math.max(0, Math.min(100, val));
    if (!snapToGrid) return { value: clamped, snappedPoint: null };
    for (const pt of SNAP_POINTS) {
      if (Math.abs(clamped - pt.value) <= SNAP_THRESHOLD) {
        return { value: pt.value, snappedPoint: pt };
      }
    }
    return { value: clamped, snappedPoint: null };
  };

  const updateCrop = (updates: Partial<ImageCropState>) => {
    setImageCrops((prev) => {
      const existing = prev[safePreviewIndex] || DEFAULT_CROP;
      return {
        ...prev,
        [safePreviewIndex]: {
          ...existing,
          ...updates,
        },
      };
    });
    setBakedIndices((prev) => ({ ...prev, [safePreviewIndex]: false }));
  };

  // Bake current crop into real Data URL and update active image (Fix #1)
  const handleBakeCurrentCrop = async () => {
    const targetImg = activeImages[safePreviewIndex];
    if (!targetImg) return;
    const baked = await bakeImageCropToDataUrl(targetImg, currentCrop, selectedRatio);
    onUpdateImageAt?.(safePreviewIndex, baked);
    onSelectActiveImage?.(baked, safePreviewIndex);
    setImageCrops((prev) => ({
      ...prev,
      [safePreviewIndex]: { ...DEFAULT_CROP },
    }));
    setBakedIndices((prev) => ({ ...prev, [safePreviewIndex]: true }));
    setActiveSnapLabel('✓ Cropped Frame Locked to Canvas!');
    setTimeout(() => setActiveSnapLabel(null), 2000);
  };

  // Reset crop to default center-fitted state
  const handleResetCrop = () => {
    setImageCrops((prev) => ({
      ...prev,
      [safePreviewIndex]: { ...DEFAULT_CROP },
    }));
    setActiveSnapLabel('Reset to Center (50%, 50%)');
    setTimeout(() => setActiveSnapLabel(null), 1800);
  };

  // Pointer drag events for direct canvas repositioning
  const handleFramingPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingFraming(true);
    try {
      (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    } catch {}
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initPosX: currentCrop.posX,
      initPosY: currentCrop.posY,
    };
  };

  const handleFramingPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingFraming || !dragStartRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const dx = e.clientX - dragStartRef.current.startX;
    const dy = e.clientY - dragStartRef.current.startY;

    const rawX = dragStartRef.current.initPosX - (dx / rect.width) * 100;
    const rawY = dragStartRef.current.initPosY - (dy / rect.height) * 100;

    const snapX = snapValue(rawX);
    const snapY = snapValue(rawY);

    if (snapX.snappedPoint && snapY.snappedPoint) {
      setActiveSnapLabel(`${snapX.snappedPoint.label} & ${snapY.snappedPoint.label}`);
    } else if (snapX.snappedPoint) {
      setActiveSnapLabel(`Horizontal ${snapX.snappedPoint.label}`);
    } else if (snapY.snappedPoint) {
      setActiveSnapLabel(`Vertical ${snapY.snappedPoint.label}`);
    } else {
      setActiveSnapLabel(null);
    }

    updateCrop({ posX: snapX.value, posY: snapY.value });
  };

  const handleFramingPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDraggingFraming(false);
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
    } catch {}
    dragStartRef.current = null;
  };

  // Directional nudge helper
  const nudge = (direction: 'up' | 'down' | 'left' | 'right', step = 5) => {
    let newX = currentCrop.posX;
    let newY = currentCrop.posY;
    if (direction === 'up') newY = Math.max(0, currentCrop.posY - step);
    if (direction === 'down') newY = Math.min(100, currentCrop.posY + step);
    if (direction === 'left') newX = Math.max(0, currentCrop.posX - step);
    if (direction === 'right') newX = Math.min(100, currentCrop.posX + step);

    const snapX = snapValue(newX);
    const snapY = snapValue(newY);

    const snapped = snapX.snappedPoint || snapY.snappedPoint;
    if (snapped) {
      setActiveSnapLabel(snapped.label);
      setTimeout(() => setActiveSnapLabel(null), 1500);
    }

    updateCrop({ posX: snapX.value, posY: snapY.value });
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (onImagesUpload) {
      onImagesUpload(Array.from(files));
    } else if (files[0]) {
      onImageUpload(files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;

    if (onImagesUpload) {
      onImagesUpload(Array.from(files));
    } else if (files[0]) {
      onImageUpload(files[0]);
    }
  };

  // Select thumbnail and immediately sync with App.tsx (Fix #2)
  const handleSelectThumbnail = (idx: number) => {
    setActivePreviewIndex(idx);
    if (activeImages[idx]) {
      onSelectActiveImage?.(activeImages[idx], idx);
    }
  };

  // Trigger 4K Photo Relight & Enhance (Feature #2 — 8 Cr / ₹5)
  const handleTriggerPhotoEnhance = async () => {
    const targetImg = activeImages[safePreviewIndex];
    if (!targetImg || !onEnhancePhoto4K) return;
    const enhancedUrl = await onEnhancePhoto4K(targetImg, safePreviewIndex);
    if (enhancedUrl) {
      setEnhancedIndices((prev) => ({ ...prev, [safePreviewIndex]: true }));
    }
  };

  // Trigger AI Vision Auto-Prompt from Photo (Feature #3 — 5 Cr / ₹3.30)
  const handleTriggerVisionAutoPrompt = async () => {
    const targetImg = activeImages[safePreviewIndex];
    if (!targetImg || !onAnalyzePhotoMotion) return;
    const results = await onAnalyzePhotoMotion(targetImg);
    if (results && results.length > 0) {
      setVisionSuggestions(results);
      if (onPromptChange && results[0]?.prompt) {
        onPromptChange(results[0].prompt);
      }
    }
  };

  // Auto-bake any active crop adjustments right before generating video (Fix #1 + Fix #3)
  const handleGenerateClick = async () => {
    if (!onGenerate) return;

    let finalStartUrl = activeImages[safePreviewIndex] || imageUrl || undefined;
    let finalEndUrl: string | undefined = undefined;

    if (keyframeBridgeEnabled && activeImages.length >= 2) {
      const sIdx = activeImages[startFrameIndex] ? startFrameIndex : 0;
      const eIdx = activeImages[endFrameIndex] ? endFrameIndex : Math.min(1, activeImages.length - 1);
      const sCrop = imageCrops[sIdx] || DEFAULT_CROP;
      const eCrop = imageCrops[eIdx] || DEFAULT_CROP;
      finalStartUrl = await bakeImageCropToDataUrl(activeImages[sIdx], sCrop, selectedRatio);
      finalEndUrl = await bakeImageCropToDataUrl(activeImages[eIdx], eCrop, selectedRatio);
    } else if (finalStartUrl) {
      finalStartUrl = await bakeImageCropToDataUrl(finalStartUrl, currentCrop, selectedRatio);
    }

    onGenerate(finalStartUrl, finalEndUrl);
  };

  const activePresetObj =
    PHOTO_CAMERA_PRESETS.find((p) => p.id === (hoveredCameraPresetId || selectedPhotoCameraPreset)) ||
    PHOTO_CAMERA_PRESETS[0];

  const ratioDetails = {
    '9:16': {
      label: '9:16 Vertical',
      dimensions: '1080 × 1920',
      bestFor: 'Reels, TikTok, Shorts',
    },
    '16:9': {
      label: '16:9 Cinema',
      dimensions: '1920 × 1080',
      bestFor: 'YouTube, Desktop, Widescreen',
    },
    '1:1': {
      label: '1:1 Square',
      dimensions: '1080 × 1080',
      bestFor: 'Instagram Feed, Profile',
    },
  };

  return (
    <div className="bg-[#12121a] border border-[#27272a] rounded-3xl p-4 sm:p-6 space-y-4 shadow-xl">
      {/* Section Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <label className="text-xs font-extrabold uppercase tracking-wider mono flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-fuchsia-400" />
          <span className="bg-gradient-to-r from-purple-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent font-black text-sm sm:text-base tracking-wide">
            {t('imageToVideo')}
          </span>
        </label>
        <div className="flex items-center gap-2">
          <span className="text-[10px] mono px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-bold">
            ✓ Real Canvas Crop & Pro Suite Active
          </span>
          <span className="text-[10px] mono px-2.5 py-0.5 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 font-bold">
            {activeImages.length > 0 ? `${activeImages.length}/10 Images Uploaded` : 'Max 10 Images'}
          </span>
        </div>
      </div>

      {/* Ratio Selector Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-[#0f0f17] border border-[#27272a] p-1.5 rounded-2xl text-xs mono">
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-white/40 uppercase font-semibold pl-1">Crop Ratio:</span>
          {(['9:16', '16:9', '1:1'] as const).map((ratio) => (
            <button
              key={ratio}
              type="button"
              onClick={() => onRatioChange(ratio)}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
                selectedRatio === ratio
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-xs'
                  : 'text-white/60 hover:text-white hover:bg-white/[0.05]'
              }`}
            >
              {ratio}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5 text-[11px] flex-wrap sm:flex-nowrap">
          {activeImages.length > 0 && (
            <>
              {/* Snap to Grid Toggle Utility */}
              <button
                type="button"
                onClick={() => setSnapToGrid(!snapToGrid)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-xl transition-all border cursor-pointer ${
                  snapToGrid
                    ? 'bg-cyan-950/40 border-cyan-500/50 text-cyan-300'
                    : 'bg-white/[0.03] border-transparent text-white/40 hover:text-white'
                }`}
                title="Toggle Snap to Grid alignment for image cropping & positioning"
              >
                <Magnet className={`w-3 h-3 ${snapToGrid ? 'text-cyan-400' : 'text-white/40'}`} />
                <span>Snap to Grid</span>
                {snapToGrid && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse ml-0.5" />}
              </button>

              {/* Bake Crop Button (Fix #1) */}
              {isManuallyAdjusted && (
                <button
                  type="button"
                  onClick={handleBakeCurrentCrop}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-400/50 font-bold shadow-sm active:scale-95 transition-all cursor-pointer"
                  title="Bake current zoom & pan directly into high-resolution canvas frame"
                >
                  <Check className="w-3 h-3" />
                  <span>Lock Crop</span>
                </button>
              )}

              {/* Reset Crop Button */}
              <button
                type="button"
                onClick={handleResetCrop}
                disabled={!isManuallyAdjusted}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-xl transition-all border cursor-pointer ${
                  isManuallyAdjusted
                    ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-400/50 shadow-sm active:scale-95'
                    : 'bg-white/[0.02] border-transparent text-white/30 cursor-not-allowed'
                }`}
                title="Reset image position and scale to default center-fitted state"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Crop</span>
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => setShowGrid(!showGrid)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-xl transition-colors border cursor-pointer ${
              showGrid
                ? 'bg-purple-950/40 border-purple-500/40 text-purple-300'
                : 'bg-white/[0.03] border-transparent text-white/40 hover:text-white'
            }`}
            title="Toggle Rule-of-Thirds Grid Guide"
          >
            <Grid className="w-3 h-3" />
            <span>Grid</span>
          </button>
          <button
            type="button"
            onClick={() => setShowAllBoundaries(!showAllBoundaries)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-xl transition-colors border cursor-pointer ${
              showAllBoundaries
                ? 'bg-cyan-950/40 border-cyan-500/40 text-cyan-300'
                : 'bg-white/[0.03] border-transparent text-white/40 hover:text-white'
            }`}
            title="Compare ratio boundaries"
          >
            <Layers className="w-3 h-3" />
            <span>All Ratios</span>
          </button>
        </div>
      </div>

      {/* Hidden File Input for Multiple Files */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        accept="image/png,image/jpeg,image/webp"
        multiple
        className="hidden"
      />

      {/* Main Upload Dropzone / Gallery State */}
      {activeImages.length === 0 ? (
        /* State 1: Dropzone for up to 10 images */
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all bg-[#0f0f17]/80 group overflow-hidden ${
            isDragOver ? 'border-purple-400 bg-purple-950/20' : 'border-[#27272a] hover:border-purple-500/60'
          }`}
        >
          <div className="relative z-10 flex flex-col items-center text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-purple-600/15 border border-purple-500/30 flex items-center justify-center group-hover:scale-105 transition-transform shadow-md">
              <Upload className="w-6 h-6 text-purple-400" />
            </div>

            <div className="text-sm font-semibold text-white/90">
              Drag & drop starting image(s) or <span className="text-purple-400 underline underline-offset-2">browse</span>
            </div>

            <p className="text-[11px] text-white/50 max-w-sm">
              Upload 1 image for standard animation or <strong className="text-fuchsia-300">2+ images for Start-to-End Keyframe Morph</strong> in{' '}
              <strong className="text-purple-300 font-bold">{ratioDetails[selectedRatio].label}</strong>
            </p>

            <div className="flex items-center gap-2 pt-1 text-[10px] mono text-white/40">
              <span>PNG, JPG, WEBP</span>
              <span>·</span>
              <span>Max 20MB per image</span>
              <span>·</span>
              <span className="text-emerald-400 font-medium">Up to 10 Images</span>
            </div>
          </div>
        </div>
      ) : (
        /* State 2: Active Uploaded Images Gallery & Selection Grid */
        <div className="space-y-3 bg-[#0c0c12] p-3.5 rounded-2xl border border-purple-500/30">
          <div className="flex items-center justify-between text-xs mono flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-white font-semibold">Uploaded Images ({activeImages.length}/10):</span>
              <span className="text-purple-300 font-bold">
                Active Frame #{safePreviewIndex + 1} ({selectedRatio})
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Feature #2: 1-Click AI Photo Enhance & 4K Relight (8 Cr / ₹5) */}
              {onEnhancePhoto4K && (
                <button
                  type="button"
                  onClick={handleTriggerPhotoEnhance}
                  disabled={isEnhancingPhoto4K}
                  className="px-2.5 py-1 rounded-xl bg-gradient-to-r from-amber-500/20 via-fuchsia-500/20 to-purple-500/20 hover:from-amber-500/30 hover:to-purple-500/30 border border-amber-400/50 text-amber-200 font-bold text-[11px] mono flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                  title="Upscale & relight active photo to 4K Studio HDR before animating (8 Credits / ₹5)"
                >
                  {isEnhancingPhoto4K ? (
                    <>
                      <RefreshCw className="w-3 h-3 animate-spin text-amber-300" />
                      <span>Relighting 4K...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3 h-3 text-amber-300 fill-amber-300" />
                      <span>🪄 4K Relight & Enhance (8 Cr / ₹5)</span>
                    </>
                  )}
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  if (onClearAllImages) onClearAllImages();
                  else onRemoveImage();
                }}
                className="text-red-400 hover:text-red-300 flex items-center gap-1 text-[11px] transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All</span>
              </button>
            </div>
          </div>

          {/* Multi-Image Thumbnails Grid (Fix #2: Clicking syncs active image with App.tsx) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2.5 pt-1">
            {activeImages.map((img, idx) => {
              const isSelected = safePreviewIndex === idx;
              const isStart = keyframeBridgeEnabled && startFrameIndex === idx;
              const isEnd = keyframeBridgeEnabled && endFrameIndex === idx && activeImages.length >= 2;
              return (
                <div
                  key={idx}
                  onClick={() => handleSelectThumbnail(idx)}
                  className={`relative group rounded-xl overflow-hidden border-2 cursor-pointer transition-all aspect-[9/16] bg-black ${
                    isSelected
                      ? 'border-purple-400 ring-2 ring-purple-500/50 scale-[1.02]'
                      : 'border-white/10 hover:border-purple-500/40'
                  }`}
                >
                  <img src={img} alt={`Upload ${idx + 1}`} className="w-full h-full object-cover" />

                  {/* Index badge */}
                  <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-black/80 text-white font-mono text-[9px] font-bold border border-white/20">
                    #{idx + 1} {isSelected ? '• ACTIVE' : ''}
                  </span>

                  {/* Start / End Bridge Badges */}
                  {isStart && (
                    <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-emerald-600/90 text-white font-mono text-[8px] font-black uppercase shadow">
                      START FRAME
                    </span>
                  )}
                  {isEnd && !isStart && (
                    <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-fuchsia-600/90 text-white font-mono text-[8px] font-black uppercase shadow">
                      END FRAME
                    </span>
                  )}

                  {/* Enhanced or Cropped Badges */}
                  {enhancedIndices[idx] && (
                    <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-amber-500/90 text-slate-950 font-mono text-[8px] font-black uppercase">
                      4K HDR
                    </span>
                  )}
                  {bakedIndices[idx] && !enhancedIndices[idx] && (
                    <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-cyan-500/90 text-slate-950 font-mono text-[8px] font-black uppercase">
                      CROPPED
                    </span>
                  )}

                  {/* Remove button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onRemoveImageAt) onRemoveImageAt(idx);
                      else onRemoveImage();
                    }}
                    className="absolute top-1.5 right-1.5 p-1 rounded-full bg-red-600/80 hover:bg-red-600 text-white transition-colors shadow-md cursor-pointer"
                    title="Remove this image"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              );
            })}

            {/* Add More Images Button Card */}
            {activeImages.length < 10 && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center p-3 rounded-xl border-2 border-dashed border-purple-500/40 hover:border-purple-400 bg-purple-950/20 hover:bg-purple-950/40 text-purple-300 transition-all text-xs font-semibold aspect-[9/16] gap-2 cursor-pointer"
              >
                <Plus className="w-6 h-6 text-purple-400" />
                <span className="text-[10px] text-center leading-tight">Add More ({activeImages.length}/10)</span>
              </button>
            )}
          </div>

          {/* 🌉 FEATURE #1 & FIX #3: START-TO-END FRAME MORPH ("KEYFRAME BRIDGE" +10 Cr / ₹6.60) */}
          <div className="p-3 rounded-2xl bg-gradient-to-r from-[#161129] via-[#131320] to-[#1d1128] border border-fuchsia-500/30 space-y-2.5">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <GitCommitHorizontal className="w-4 h-4 text-fuchsia-400" />
                <div>
                  <div className="text-xs font-extrabold text-white flex items-center gap-1.5">
                    <span>🌉 Start-to-End Frame Morph (Keyframe Bridge)</span>
                    <span className="px-2 py-0.5 rounded-md bg-fuchsia-500/20 border border-fuchsia-400/40 text-fuchsia-200 mono text-[10px] font-bold">
                      +10 Cr / ₹6.60
                    </span>
                  </div>
                  <p className="text-[11px] text-white/55">
                    Smoothly morphs your video from a starting photo (#1) into a target ending photo (#2)
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (activeImages.length < 2 && !keyframeBridgeEnabled) {
                    fileInputRef.current?.click();
                    return;
                  }
                  onToggleKeyframeBridge?.(!keyframeBridgeEnabled);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs mono font-bold border transition-all cursor-pointer ${
                  keyframeBridgeEnabled
                    ? 'bg-fuchsia-600 text-white border-fuchsia-400 shadow-lg shadow-fuchsia-600/30'
                    : 'bg-white/5 hover:bg-white/10 text-white/75 border-white/15'
                }`}
              >
                {keyframeBridgeEnabled
                  ? '✓ Bridge Active (+10 Cr)'
                  : activeImages.length < 2
                  ? '+ Upload 2nd Image to Bridge'
                  : 'Enable Bridge (+10 Cr)'}
              </button>
            </div>

            {keyframeBridgeEnabled && activeImages.length >= 2 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-white/10 text-xs mono">
                <div className="bg-black/40 border border-emerald-500/30 rounded-xl p-2.5 flex items-center justify-between gap-2">
                  <div>
                    <div className="text-[10px] text-emerald-300 font-bold uppercase">Start Frame (0.0s)</div>
                    <div className="text-white/70 text-[11px]">Select opening photo</div>
                  </div>
                  <select
                    value={startFrameIndex}
                    onChange={(e) => onSelectStartFrameIndex?.(Number(e.target.value))}
                    className="bg-[#181824] border border-emerald-500/40 rounded-lg px-2.5 py-1 text-xs text-white font-bold outline-none"
                  >
                    {activeImages.map((_, idx) => (
                      <option key={idx} value={idx}>
                        Image #{idx + 1}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="bg-black/40 border border-fuchsia-500/30 rounded-xl p-2.5 flex items-center justify-between gap-2">
                  <div>
                    <div className="text-[10px] text-fuchsia-300 font-bold uppercase">End Frame (Final)</div>
                    <div className="text-white/70 text-[11px]">Select target destination photo</div>
                  </div>
                  <select
                    value={endFrameIndex}
                    onChange={(e) => onSelectEndFrameIndex?.(Number(e.target.value))}
                    className="bg-[#181824] border border-fuchsia-500/40 rounded-lg px-2.5 py-1 text-xs text-white font-bold outline-none"
                  >
                    {activeImages.map((_, idx) => (
                      <option key={idx} value={idx}>
                        Image #{idx + 1}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Dedicated Interactive Cropping & Framing Viewport for Active Image */}
          {activeImages[safePreviewIndex] && (
            <div className="mt-4 pt-3 border-t border-white/10 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs mono">
                <div className="flex items-center gap-2">
                  <Crop className="w-4 h-4 text-purple-400" />
                  <span className="text-white font-bold">
                    Crop & Position Image #{safePreviewIndex + 1}
                  </span>
                  <span className="text-[11px] text-white/50">
                    ({ratioDetails[selectedRatio].label})
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-white/50 mono">
                    X: <strong className="text-purple-300">{Math.round(currentCrop.posX)}%</strong> · Y:{' '}
                    <strong className="text-purple-300">{Math.round(currentCrop.posY)}%</strong> · Zoom:{' '}
                    <strong className="text-purple-300">{currentCrop.scale.toFixed(1)}x</strong>
                  </span>
                  {isManuallyAdjusted && (
                    <button
                      type="button"
                      onClick={handleBakeCurrentCrop}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-400/50 transition-all cursor-pointer"
                    >
                      <Check className="w-3 h-3" />
                      <span>Bake Crop</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleResetCrop}
                    disabled={!isManuallyAdjusted}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold transition-all border cursor-pointer ${
                      isManuallyAdjusted
                        ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-400/50 shadow-sm active:scale-95'
                        : 'bg-white/[0.02] border-transparent text-white/30 cursor-not-allowed'
                    }`}
                    title="Return image position and scale to default center-fitted state"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset Crop</span>
                  </button>
                </div>
              </div>

              {/* Viewport Box */}
              <div className="relative w-full h-[320px] sm:h-[360px] bg-[#07070b] rounded-2xl border border-white/10 flex items-center justify-center overflow-hidden select-none p-3 shadow-inner">
                {/* Ratio boundary container */}
                <div
                  className={`relative rounded-xl overflow-hidden shadow-2xl border-2 border-purple-500/40 bg-black ${
                    selectedRatio === '9:16'
                      ? 'h-full aspect-[9/16]'
                      : selectedRatio === '16:9'
                      ? 'w-full max-w-[480px] aspect-[16/9]'
                      : 'h-full max-h-[300px] aspect-square'
                  }`}
                >
                  {/* The Scaled and Positioned Image with live 3D Camera Motion Hover Preview */}
                  <img
                    src={activeImages[safePreviewIndex]}
                    alt={`Preview #${safePreviewIndex + 1}`}
                    style={{
                      objectFit: 'cover',
                      objectPosition: `${currentCrop.posX}% ${currentCrop.posY}%`,
                      transform: `scale(${currentCrop.scale})`,
                      transformOrigin: `${currentCrop.posX}% ${currentCrop.posY}%`,
                    }}
                    className={`w-full h-full pointer-events-none select-none transition-transform duration-150 ${activePresetObj.hoverTransformClass}`}
                  />

                  {/* Drag and Move Pointer Layer */}
                  <div
                    onPointerDown={handleFramingPointerDown}
                    onPointerMove={handleFramingPointerMove}
                    onPointerUp={handleFramingPointerUp}
                    onPointerCancel={handleFramingPointerUp}
                    className={`absolute inset-0 z-20 ${
                      isDraggingFraming ? 'cursor-grabbing' : 'cursor-grab'
                    }`}
                    title="Click and drag to reposition image inside crop boundary"
                  />

                  {/* Rule of Thirds & Center Grid Lines Overlay */}
                  {showGrid && (
                    <div className="absolute inset-0 z-10 pointer-events-none">
                      <div
                        className={`absolute top-0 bottom-0 w-px transition-colors ${
                          snapToGrid && Math.abs(currentCrop.posX - 33.33) <= SNAP_THRESHOLD
                            ? 'bg-cyan-400 shadow-[0_0_8px_#22d3ee] z-20'
                            : 'bg-white/25'
                        }`}
                        style={{ left: '33.33%' }}
                      />
                      <div
                        className={`absolute top-0 bottom-0 w-px border-l border-dashed transition-colors ${
                          snapToGrid && Math.abs(currentCrop.posX - 50) <= SNAP_THRESHOLD
                            ? 'border-cyan-400 shadow-[0_0_8px_#22d3ee] z-20'
                            : 'border-white/20'
                        }`}
                        style={{ left: '50%' }}
                      />
                      <div
                        className={`absolute top-0 bottom-0 w-px transition-colors ${
                          snapToGrid && Math.abs(currentCrop.posX - 66.67) <= SNAP_THRESHOLD
                            ? 'bg-cyan-400 shadow-[0_0_8px_#22d3ee] z-20'
                            : 'bg-white/25'
                        }`}
                        style={{ left: '66.67%' }}
                      />
                      <div
                        className={`absolute left-0 right-0 h-px transition-colors ${
                          snapToGrid && Math.abs(currentCrop.posY - 33.33) <= SNAP_THRESHOLD
                            ? 'bg-cyan-400 shadow-[0_0_8px_#22d3ee] z-20'
                            : 'bg-white/25'
                        }`}
                        style={{ top: '33.33%' }}
                      />
                      <div
                        className={`absolute left-0 right-0 h-px border-t border-dashed transition-colors ${
                          snapToGrid && Math.abs(currentCrop.posY - 50) <= SNAP_THRESHOLD
                            ? 'border-cyan-400 shadow-[0_0_8px_#22d3ee] z-20'
                            : 'border-white/20'
                        }`}
                        style={{ top: '50%' }}
                      />
                      <div
                        className={`absolute left-0 right-0 h-px transition-colors ${
                          snapToGrid && Math.abs(currentCrop.posY - 66.67) <= SNAP_THRESHOLD
                            ? 'bg-cyan-400 shadow-[0_0_8px_#22d3ee] z-20'
                            : 'bg-white/25'
                        }`}
                        style={{ top: '66.67%' }}
                      />
                    </div>
                  )}

                  {/* Top-Left Format Pill */}
                  <div className="absolute top-2 left-2 z-30 pointer-events-none flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-md bg-black/75 text-[10px] text-white/90 border border-white/20 mono font-semibold backdrop-blur-xs">
                      {selectedRatio} Viewport
                    </span>
                    {isManuallyAdjusted && (
                      <span className="px-2 py-0.5 rounded-md bg-emerald-600/85 text-[10px] text-white border border-emerald-300/40 mono font-bold">
                        Custom Crop Ready
                      </span>
                    )}
                  </div>

                  {/* Top-Right Snap Indicator */}
                  <div className="absolute top-2 right-2 z-30 pointer-events-none">
                    <div
                      className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] mono font-bold border backdrop-blur-xs ${
                        snapToGrid
                          ? 'bg-cyan-950/80 border-cyan-500/50 text-cyan-300'
                          : 'bg-black/75 border-white/20 text-white/40'
                      }`}
                    >
                      <Magnet className="w-2.5 h-2.5" />
                      <span>{snapToGrid ? 'Snap Active' : 'Freeform'}</span>
                    </div>
                  </div>

                  {/* Active Magnetic Snap Toast Badge */}
                  {activeSnapLabel && (
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/95 border border-cyan-400 text-cyan-300 text-[11px] font-bold shadow-lg animate-pulse mono pointer-events-none backdrop-blur-md">
                      <Magnet className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                      <span>{activeSnapLabel}</span>
                    </div>
                  )}

                  {/* Drag to Reposition Helper */}
                  {!activeSnapLabel && (
                    <div className="absolute bottom-2 right-2 z-30 pointer-events-none flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/75 text-[9px] text-white/60 mono border border-white/10 backdrop-blur-xs">
                      <Move className="w-2.5 h-2.5" />
                      <span>Drag to pan • Auto-bakes on Generate</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Composition Controls & Snap Tools */}
              <div className="bg-[#0f0f17] border border-[#27272a] rounded-xl p-3 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  {/* Directional Nudges */}
                  <div className="flex items-center gap-1 text-xs mono">
                    <span className="text-[10px] text-white/40 uppercase font-semibold pr-1">Nudge:</span>
                    <button
                      type="button"
                      onClick={() => nudge('up')}
                      className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-purple-600/20 text-white/80 hover:text-white border border-white/10 hover:border-purple-500/30 transition-colors cursor-pointer"
                      title="Nudge Up (5%)"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => nudge('down')}
                      className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-purple-600/20 text-white/80 hover:text-white border border-white/10 hover:border-purple-500/30 transition-colors cursor-pointer"
                      title="Nudge Down (5%)"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => nudge('left')}
                      className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-purple-600/20 text-white/80 hover:text-white border border-white/10 hover:border-purple-500/30 transition-colors cursor-pointer"
                      title="Nudge Left (5%)"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => nudge('right')}
                      className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-purple-600/20 text-white/80 hover:text-white border border-white/10 hover:border-purple-500/30 transition-colors cursor-pointer"
                      title="Nudge Right (5%)"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Quick Snap Alignment Presets */}
                  <div className="flex items-center gap-1 text-[11px] mono flex-wrap">
                    <span className="text-[10px] text-white/40 uppercase font-semibold pr-1">Snap Preset:</span>
                    <button
                      type="button"
                      onClick={() => {
                        updateCrop({ posX: 50, posY: 50 });
                        setActiveSnapLabel('Center (50%, 50%)');
                        setTimeout(() => setActiveSnapLabel(null), 1500);
                      }}
                      className="px-2 py-0.5 rounded-lg bg-white/[0.04] hover:bg-cyan-950/40 text-white/70 hover:text-cyan-300 border border-white/10 hover:border-cyan-500/30 transition-colors cursor-pointer"
                    >
                      Center (50%)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        updateCrop({ posX: 50, posY: 33.33 });
                        setActiveSnapLabel('Top Third (33%)');
                        setTimeout(() => setActiveSnapLabel(null), 1500);
                      }}
                      className="px-2 py-0.5 rounded-lg bg-white/[0.04] hover:bg-cyan-950/40 text-white/70 hover:text-cyan-300 border border-white/10 hover:border-cyan-500/30 transition-colors cursor-pointer"
                    >
                      Top 1/3
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        updateCrop({ posX: 50, posY: 66.67 });
                        setActiveSnapLabel('Bottom Third (67%)');
                        setTimeout(() => setActiveSnapLabel(null), 1500);
                      }}
                      className="px-2 py-0.5 rounded-lg bg-white/[0.04] hover:bg-cyan-950/40 text-white/70 hover:text-cyan-300 border border-white/10 hover:border-cyan-500/30 transition-colors cursor-pointer"
                    >
                      Bottom 1/3
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        updateCrop({ posX: 33.33, posY: 50 });
                        setActiveSnapLabel('Left Third (33%)');
                        setTimeout(() => setActiveSnapLabel(null), 1500);
                      }}
                      className="px-2 py-0.5 rounded-lg bg-white/[0.04] hover:bg-cyan-950/40 text-white/70 hover:text-cyan-300 border border-white/10 hover:border-cyan-500/30 transition-colors cursor-pointer"
                    >
                      Left 1/3
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        updateCrop({ posX: 66.67, posY: 50 });
                        setActiveSnapLabel('Right Third (67%)');
                        setTimeout(() => setActiveSnapLabel(null), 1500);
                      }}
                      className="px-2 py-0.5 rounded-lg bg-white/[0.04] hover:bg-cyan-950/40 text-white/70 hover:text-cyan-300 border border-white/10 hover:border-cyan-500/30 transition-colors cursor-pointer"
                    >
                      Right 1/3
                    </button>
                  </div>
                </div>

                {/* Row 2: Precision Sliders for Horizontal, Vertical, and Zoom */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs mono">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-white/60">Horizontal (X)</span>
                      <span className="text-purple-300 font-bold">{Math.round(currentCrop.posX)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="0.5"
                      value={currentCrop.posX}
                      onChange={(e) => {
                        const raw = parseFloat(e.target.value);
                        const snapped = snapValue(raw);
                        if (snapped.snappedPoint) {
                          setActiveSnapLabel(`Horizontal ${snapped.snappedPoint.label}`);
                          setTimeout(() => setActiveSnapLabel(null), 1200);
                        }
                        updateCrop({ posX: snapped.value });
                      }}
                      className="w-full accent-purple-500 cursor-pointer h-1.5 bg-white/10 rounded-lg appearance-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-white/60">Vertical (Y)</span>
                      <span className="text-purple-300 font-bold">{Math.round(currentCrop.posY)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="0.5"
                      value={currentCrop.posY}
                      onChange={(e) => {
                        const raw = parseFloat(e.target.value);
                        const snapped = snapValue(raw);
                        if (snapped.snappedPoint) {
                          setActiveSnapLabel(`Vertical ${snapped.snappedPoint.label}`);
                          setTimeout(() => setActiveSnapLabel(null), 1200);
                        }
                        updateCrop({ posY: snapped.value });
                      }}
                      className="w-full accent-purple-500 cursor-pointer h-1.5 bg-white/10 rounded-lg appearance-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-white/60 flex items-center gap-1">
                        <ZoomIn className="w-3 h-3 text-white/40" />
                        <span>Scale / Zoom</span>
                      </span>
                      <span className="text-purple-300 font-bold">{currentCrop.scale.toFixed(1)}x</span>
                    </div>
                    <input
                      type="range"
                      min="1.0"
                      max="3.0"
                      step="0.05"
                      value={currentCrop.scale}
                      onChange={(e) => updateCrop({ scale: parseFloat(e.target.value) })}
                      className="w-full accent-purple-500 cursor-pointer h-1.5 bg-white/10 rounded-lg appearance-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 🎥 FEATURE #5: 3D PHOTO CAMERA MOTION PRESETS (FREE BOOSTER) */}
      <div className="bg-[#0e0e16] border border-[#272738] rounded-2xl p-3.5 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-extrabold text-white mono">
            <Camera className="w-4 h-4 text-cyan-400" />
            <span>🎥 3D Photo Camera Motion Presets</span>
          </div>
          <span className="text-[10px] mono px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-bold">
            FREE • Hover to Preview on Photo
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {PHOTO_CAMERA_PRESETS.map((preset) => {
            const isSelected = selectedPhotoCameraPreset === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onMouseEnter={() => setHoveredCameraPresetId(preset.id)}
                onMouseLeave={() => setHoveredCameraPresetId(null)}
                onClick={() => onSelectPhotoCameraPreset?.(preset.id, preset.promptDirective)}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-gradient-to-r from-cyan-950/80 to-purple-950/80 border-cyan-400 text-white shadow-md shadow-cyan-950/40'
                    : 'bg-[#13131f] border-white/10 text-white/70 hover:text-white hover:border-cyan-500/40'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[11px] font-bold truncate">{preset.label}</span>
                  <span className="text-[9px] mono px-1.5 py-0.2 rounded bg-white/10 text-cyan-200 shrink-0">
                    {preset.badge}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 🖌️ FEATURE #4: MOTION ZONE LOCK SELECTOR (+5 CREDITS / ₹3.30) */}
      <div className="bg-[#0e0e16] border border-[#272738] rounded-2xl p-3.5 space-y-2.5">
        <div className="flex items-center justify-between flex-wrap gap-1">
          <div className="flex items-center gap-2 text-xs font-extrabold text-white mono">
            <Lock className="w-4 h-4 text-amber-400" />
            <span>🖌️ Motion Zone Lock (Subject vs Background Control)</span>
          </div>
          <span className="text-[10px] mono px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 font-bold">
            {motionZoneMode === 'full' ? 'Standard (0 Cr)' : 'Zone Lock Active (+5 Cr / ₹3.30)'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {MOTION_ZONE_OPTIONS.map((zone) => {
            const isSelected = motionZoneMode === zone.id;
            return (
              <button
                key={zone.id}
                type="button"
                onClick={() => onMotionZoneModeChange?.(zone.id)}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
                  isSelected
                    ? 'bg-gradient-to-r from-amber-950/60 via-purple-950/60 to-indigo-950/60 border-amber-400 text-white shadow-md'
                    : 'bg-[#13131f] border-white/10 text-white/70 hover:text-white hover:border-amber-500/40'
                }`}
              >
                <div className="min-w-0">
                  <div className="text-xs font-bold truncate">{zone.title}</div>
                  <div className="text-[10px] text-white/50 truncate">{zone.subtitle}</div>
                </div>
                <span
                  className={`text-[10px] mono font-bold px-2 py-0.5 rounded-md shrink-0 ${
                    zone.cost === 0
                      ? 'bg-white/10 text-white/60'
                      : isSelected
                      ? 'bg-amber-400 text-slate-950'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  {zone.cost === 0 ? 'FREE' : `+${zone.cost} Cr`}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* User Text Instruction Input Box + 🧠 FEATURE #3: AI VISION AUTO-PROMPT FROM PHOTO (5 Cr / ₹3) */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <label className="text-xs font-extrabold uppercase tracking-wider mono flex items-center gap-2">
            <Wand2 className="w-3.5 h-3.5 text-fuchsia-400" />
            <span className="bg-gradient-to-r from-purple-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent font-extrabold text-xs sm:text-sm">
              Image to Video Instructions
            </span>
          </label>
          <div className="flex items-center gap-1.5 flex-wrap">
            <LanguageSelectorButton size="sm" />

            {/* 🧠 AI Vision Auto-Prompt Button (5 Cr / ₹3.30) */}
            {onAnalyzePhotoMotion && (
              <button
                type="button"
                onClick={handleTriggerVisionAutoPrompt}
                disabled={isAnalyzingPhotoMotion || activeImages.length === 0}
                className="text-[11px] px-2.5 py-1 rounded-xl mono flex items-center gap-1.5 transition-all border cursor-pointer bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-200 border-cyan-400/40 font-bold disabled:opacity-40"
                title="Analyze your uploaded photo with AI Vision to generate 3 custom motion prompts (5 Credits / ₹3)"
              >
                {isAnalyzingPhotoMotion ? (
                  <>
                    <RefreshCw className="w-3 h-3 animate-spin text-cyan-300" />
                    <span>Scanning Photo...</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-3 h-3 text-cyan-300" />
                    <span>🧠 Auto-Detect Motion (5 Cr / ₹3)</span>
                  </>
                )}
              </button>
            )}

            {onEnhancePrompt && (
              <button
                type="button"
                onClick={onEnhancePrompt}
                disabled={isEnhancingPrompt}
                className={`text-[11px] px-2.5 py-1 rounded-xl mono flex items-center gap-1.5 transition-all border cursor-pointer ${
                  promptEnhancedSuccess
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-purple-600/15 hover:bg-purple-600/25 text-purple-300 border-purple-500/30'
                }`}
              >
                {isEnhancingPrompt ? (
                  <>
                    <RefreshCw className="w-3 h-3 animate-spin text-purple-400" />
                    <span>Enhancing...</span>
                  </>
                ) : promptEnhancedSuccess ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span>Enhanced!</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3 h-3 text-purple-400" />
                    <span className="font-semibold">Prompt Enhancer</span>
                  </>
                )}
              </button>
            )}
            <span className="mono text-[10px] text-white/40">{prompt?.length || 0}/500 chars</span>
          </div>
        </div>

        {/* AI Vision Auto-Prompt Suggestions Drawer */}
        {visionSuggestions.length > 0 && (
          <div className="bg-[#0b131e] border border-cyan-500/40 rounded-2xl p-3 space-y-2 animate-in fade-in duration-200">
            <div className="flex items-center justify-between text-[11px] mono">
              <span className="text-cyan-300 font-bold flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-cyan-400" />
                <span>AI Vision Director Suggestions (Click any to apply):</span>
              </span>
              <button
                type="button"
                onClick={() => setVisionSuggestions([])}
                className="text-white/40 hover:text-white text-[10px]"
              >
                Dismiss
              </button>
            </div>
            <div className="grid grid-cols-1 gap-1.5">
              {visionSuggestions.map((sug, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => onPromptChange?.(sug.prompt)}
                  className="text-left p-2.5 rounded-xl bg-black/40 hover:bg-cyan-950/50 border border-cyan-500/25 hover:border-cyan-400 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between text-[11px] mono mb-0.5">
                    <span className="font-bold text-cyan-200 group-hover:text-white">
                      #{i + 1} {sug.title}
                    </span>
                    <span className="text-[10px] text-cyan-400/80">{sug.style}</span>
                  </div>
                  <p className="text-[11px] text-white/75 line-clamp-2">{sug.prompt}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        <textarea
          value={prompt || ''}
          onChange={(e) => onPromptChange?.(e.target.value)}
          placeholder="Enter instructions on how you want your uploaded starting images to animate, transition, or move in the generated video..."
          rows={3}
          className="w-full bg-[#0f0f17] border border-[#27272a] focus:border-purple-500/70 focus:ring-1 focus:ring-purple-500/50 rounded-2xl p-3.5 text-xs sm:text-sm text-white placeholder-white/30 resize-none transition-all outline-none"
        />

        {/* VIRAL PROMPT CHIPS */}
        {onPromptChange && (
          <ViralPromptChips onSelectPrompt={(p) => onPromptChange(p)} activePrompt={prompt} />
        )}
      </div>

      {/* 🎵📱 FIX #4 & FEATURE #6: SMART SOUNDSCAPE (+5 Cr) & VIRAL CAPTIONS (+5 Cr) FOR IMAGE-TO-VIDEO */}
      {soundscapeConfig && onSoundscapeConfigChange && viralCaptions && onViralCaptionsChange && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {/* Smart Soundscape (Auto BGM + SFX) */}
          <div className="bg-[#0e0e16] border border-[#272738] rounded-2xl p-3 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-white mono">
                <Music className="w-3.5 h-3.5 text-emerald-400" />
                <span>🎵 Smart Soundscape</span>
              </div>
              <button
                type="button"
                onClick={() =>
                  onSoundscapeConfigChange({
                    ...soundscapeConfig,
                    enabled: !soundscapeConfig.enabled,
                  })
                }
                className={`px-2.5 py-0.5 rounded-lg text-[10px] mono font-bold border transition-all cursor-pointer ${
                  soundscapeConfig.enabled
                    ? 'bg-emerald-500/25 border-emerald-400 text-emerald-200'
                    : 'bg-white/5 border-white/15 text-white/50'
                }`}
              >
                {soundscapeConfig.enabled ? 'ON (+5 Cr)' : 'OFF (+5 Cr)'}
              </button>
            </div>

            {soundscapeConfig.enabled && (
              <div className="space-y-2 pt-1 border-t border-white/10 text-[11px] mono">
                <div className="grid grid-cols-2 gap-1.5">
                  <select
                    value={soundscapeConfig.bgmMood}
                    onChange={(e) =>
                      onSoundscapeConfigChange({
                        ...soundscapeConfig,
                        bgmMood: e.target.value as any,
                      })
                    }
                    className="bg-[#161622] border border-white/15 rounded-lg px-2 py-1 text-[11px] text-white outline-none"
                  >
                    {BGM_MOOD_OPTIONS.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.label}
                      </option>
                    ))}
                  </select>

                  <select
                    value={soundscapeConfig.sfxType}
                    onChange={(e) =>
                      onSoundscapeConfigChange({
                        ...soundscapeConfig,
                        sfxType: e.target.value as any,
                      })
                    }
                    className="bg-[#161622] border border-white/15 rounded-lg px-2 py-1 text-[11px] text-white outline-none"
                  >
                    {SFX_AMBIENT_OPTIONS.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (isTestingSoundscape) {
                      smartSoundscapeEngine.stop();
                      setIsTestingSoundscape(false);
                    } else {
                      smartSoundscapeEngine.start(soundscapeConfig);
                      setIsTestingSoundscape(true);
                    }
                  }}
                  className="w-full py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 flex items-center justify-center gap-1.5 text-[10px] font-bold cursor-pointer"
                >
                  {isTestingSoundscape ? (
                    <>
                      <VolumeX className="w-3 h-3" />
                      <span>Stop Audio Preview</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-3 h-3" />
                      <span>Test BGM + SFX Mix</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Auto Viral Captions Overlay */}
          <div className="bg-[#0e0e16] border border-[#272738] rounded-2xl p-3 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-white mono">
                <Subtitles className="w-3.5 h-3.5 text-amber-400" />
                <span>📱 Auto Viral Captions</span>
              </div>
              <button
                type="button"
                onClick={() =>
                  onViralCaptionsChange({
                    ...viralCaptions,
                    enabled: !viralCaptions.enabled,
                  })
                }
                className={`px-2.5 py-0.5 rounded-lg text-[10px] mono font-bold border transition-all cursor-pointer ${
                  viralCaptions.enabled
                    ? 'bg-amber-500/25 border-amber-400 text-amber-200'
                    : 'bg-white/5 border-white/15 text-white/50'
                }`}
              >
                {viralCaptions.enabled ? 'ON (+5 Cr)' : 'OFF (+5 Cr)'}
              </button>
            </div>

            {viralCaptions.enabled && (
              <div className="space-y-2 pt-1 border-t border-white/10 text-[11px] mono">
                <select
                  value={viralCaptions.style}
                  onChange={(e) =>
                    onViralCaptionsChange({
                      ...viralCaptions,
                      style: e.target.value as any,
                    })
                  }
                  className="w-full bg-[#161622] border border-white/15 rounded-lg px-2 py-1 text-[11px] text-white outline-none"
                >
                  <option value="hormozi">🔥 Hormozi Bold Impact</option>
                  <option value="tanglish-neon">⚡ Tanglish Neon Glow</option>
                  <option value="cinema-lower">🎬 Cinema Yellow Subtitle</option>
                  <option value="kinetic-pop">💥 Kinetic Reels Pop</option>
                </select>
                <input
                  type="text"
                  value={viralCaptions.text}
                  onChange={(e) =>
                    onViralCaptionsChange({
                      ...viralCaptions,
                      text: e.target.value,
                    })
                  }
                  placeholder="Optional custom caption or leave blank for auto-sync..."
                  className="w-full bg-[#161622] border border-white/15 rounded-lg px-2.5 py-1 text-[11px] text-white placeholder-white/30 outline-none"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Embedded Dedicated Generate Video Button */}
      {onGenerate && (
        <div className="pt-1">
          <button
            type="button"
            onClick={handleGenerateClick}
            disabled={isGenerating}
            className={`w-full font-extrabold py-3.5 px-6 rounded-2xl shadow-xl flex items-center justify-center gap-2.5 text-xs sm:text-sm transition-all active:scale-[0.99] disabled:opacity-60 cursor-pointer ${
              (userCredits || 0) < (liveCreditCost || 50)
                ? 'bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-600/30 ring-1 ring-purple-400/30'
                : 'bg-gradient-to-r from-purple-600 via-purple-500 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-600/30'
            }`}
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
                <span>Rendering with {selectedModelName || 'Luma Fast'} ({generationProgress || 0}%)...</span>
              </>
            ) : (userCredits || 0) < (liveCreditCost || 50) ? (
              <>
                <Sparkles className="w-4 h-4 fill-amber-300 text-amber-300" />
                <span>Generate Video (-{liveCreditCost || 50}cr • Top Up Required)</span>
                <ArrowRight className="w-4 h-4 text-white/80" />
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 fill-white text-white" />
                <span>{t('generateVideo')} (-{liveCreditCost || 50} {t('credits')})</span>
                <ArrowRight className="w-4 h-4 text-white/80" />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
