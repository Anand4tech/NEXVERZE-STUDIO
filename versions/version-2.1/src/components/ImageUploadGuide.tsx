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
  ZoomOut,
  Crop,
  Maximize2,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { LanguageSelectorButton } from './LanguageSelectorButton';
import { ViralPromptChips } from './ViralPromptChips';

export type AspectRatioType = '9:16' | '16:9' | '1:1';

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

interface ImageUploadGuideProps {
  imageUrl: string | null;
  imageUrls?: string[];
  onImageUpload: (file: File) => void;
  onImagesUpload?: (files: File[]) => void;
  onRemoveImage: () => void;
  onRemoveImageAt?: (index: number) => void;
  onClearAllImages?: () => void;
  selectedRatio: AspectRatioType;
  onRatioChange: (ratio: AspectRatioType) => void;

  // Embedded Prompt / Instructions Box
  prompt?: string;
  onPromptChange?: (prompt: string) => void;
  onEnhancePrompt?: () => void;
  isEnhancingPrompt?: boolean;
  promptEnhancedSuccess?: boolean;

  // Embedded Generate Button
  onGenerate?: () => void;
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
  selectedRatio,
  onRatioChange,
  prompt,
  onPromptChange,
  onEnhancePrompt,
  isEnhancingPrompt,
  promptEnhancedSuccess,
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
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [activeSnapLabel, setActiveSnapLabel] = useState<string | null>(null);
  const [isDraggingFraming, setIsDraggingFraming] = useState(false);
  const dragStartRef = useRef<{
    startX: number;
    startY: number;
    initPosX: number;
    initPosY: number;
  } | null>(null);

  // Derive active image list (prefer imageUrls array if populated, fallback to single imageUrl)
  const activeImages = imageUrls.length > 0 ? imageUrls : imageUrl ? [imageUrl] : [];

  // Active crop state for currently selected image
  const currentCrop = imageCrops[activePreviewIndex] || DEFAULT_CROP;

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
      const existing = prev[activePreviewIndex] || DEFAULT_CROP;
      return {
        ...prev,
        [activePreviewIndex]: {
          ...existing,
          ...updates,
        },
      };
    });
  };

  // Reset crop to default center-fitted state
  const handleResetCrop = () => {
    setImageCrops((prev) => ({
      ...prev,
      [activePreviewIndex]: { ...DEFAULT_CROP },
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

    // Movement: dragging moves the crop viewport over the image
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
      <div className="flex items-center justify-between">
        <label className="text-xs font-extrabold uppercase tracking-wider mono flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-fuchsia-400" />
          <span className="bg-gradient-to-r from-purple-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent font-black text-sm sm:text-base tracking-wide">
            {t('imageToVideo')}
          </span>
        </label>
        <div className="flex items-center gap-2">
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
            {/* Upload Button Icon */}
            <div className="w-12 h-12 rounded-2xl bg-purple-600/15 border border-purple-500/30 flex items-center justify-center group-hover:scale-105 transition-transform shadow-md">
              <Upload className="w-6 h-6 text-purple-400" />
            </div>

            {/* Prompt Text directly below Upload Button */}
            <div className="text-sm font-semibold text-white/90">
              Drag & drop starting image or <span className="text-purple-400 underline underline-offset-2">browse</span>
            </div>

            {/* Viewport Alignment details */}
            <p className="text-[11px] text-white/50 max-w-sm">
              Uploads will align with the <strong className="text-purple-300 font-bold">{ratioDetails[selectedRatio].label}</strong> ({ratioDetails[selectedRatio].dimensions}) viewport
            </p>

            {/* Helper badges */}
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
          <div className="flex items-center justify-between text-xs mono">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-white font-semibold">Uploaded Images ({activeImages.length}/10):</span>
              <span className="text-purple-300 font-bold">{selectedRatio} Viewport</span>
            </div>

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

          {/* Multi-Image Thumbnails Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2.5 pt-1">
            {activeImages.map((img, idx) => (
              <div
                key={idx}
                onClick={() => setActivePreviewIndex(idx)}
                className={`relative group rounded-xl overflow-hidden border-2 cursor-pointer transition-all aspect-[9/16] bg-black ${
                  activePreviewIndex === idx ? 'border-purple-400 ring-2 ring-purple-500/50 scale-[1.02]' : 'border-white/10 hover:border-purple-500/40'
                }`}
              >
                <img src={img} alt={`Upload ${idx + 1}`} className="w-full h-full object-cover" />

                {/* Index badge */}
                <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-black/80 text-white font-mono text-[9px] font-bold border border-white/20">
                  #{idx + 1}
                </span>

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
            ))}

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

          {/* Dedicated Interactive Cropping & Framing Viewport for Active Image */}
          {activeImages[activePreviewIndex] && (
            <div className="mt-4 pt-3 border-t border-white/10 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs mono">
                <div className="flex items-center gap-2">
                  <Crop className="w-4 h-4 text-purple-400" />
                  <span className="text-white font-bold">
                    Crop & Position Image #{activePreviewIndex + 1}
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
                  {/* Local Reset Crop Button */}
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
                  {/* The Scaled and Positioned Image */}
                  <img
                    src={activeImages[activePreviewIndex]}
                    alt={`Preview #${activePreviewIndex + 1}`}
                    style={{
                      objectFit: 'cover',
                      objectPosition: `${currentCrop.posX}% ${currentCrop.posY}%`,
                      transform: `scale(${currentCrop.scale})`,
                      transformOrigin: `${currentCrop.posX}% ${currentCrop.posY}%`,
                    }}
                    className="w-full h-full pointer-events-none select-none transition-transform duration-75"
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
                      {/* Vertical line 1 (33.33%) */}
                      <div
                        className={`absolute top-0 bottom-0 w-px transition-colors ${
                          snapToGrid && Math.abs(currentCrop.posX - 33.33) <= SNAP_THRESHOLD
                            ? 'bg-cyan-400 shadow-[0_0_8px_#22d3ee] z-20'
                            : 'bg-white/25'
                        }`}
                        style={{ left: '33.33%' }}
                      />
                      {/* Vertical line Center (50%) */}
                      <div
                        className={`absolute top-0 bottom-0 w-px border-l border-dashed transition-colors ${
                          snapToGrid && Math.abs(currentCrop.posX - 50) <= SNAP_THRESHOLD
                            ? 'border-cyan-400 shadow-[0_0_8px_#22d3ee] z-20'
                            : 'border-white/20'
                        }`}
                        style={{ left: '50%' }}
                      />
                      {/* Vertical line 2 (66.67%) */}
                      <div
                        className={`absolute top-0 bottom-0 w-px transition-colors ${
                          snapToGrid && Math.abs(currentCrop.posX - 66.67) <= SNAP_THRESHOLD
                            ? 'bg-cyan-400 shadow-[0_0_8px_#22d3ee] z-20'
                            : 'bg-white/25'
                        }`}
                        style={{ left: '66.67%' }}
                      />

                      {/* Horizontal line 1 (33.33%) */}
                      <div
                        className={`absolute left-0 right-0 h-px transition-colors ${
                          snapToGrid && Math.abs(currentCrop.posY - 33.33) <= SNAP_THRESHOLD
                            ? 'bg-cyan-400 shadow-[0_0_8px_#22d3ee] z-20'
                            : 'bg-white/25'
                        }`}
                        style={{ top: '33.33%' }}
                      />
                      {/* Horizontal line Center (50%) */}
                      <div
                        className={`absolute left-0 right-0 h-px border-t border-dashed transition-colors ${
                          snapToGrid && Math.abs(currentCrop.posY - 50) <= SNAP_THRESHOLD
                            ? 'border-cyan-400 shadow-[0_0_8px_#22d3ee] z-20'
                            : 'border-white/20'
                        }`}
                        style={{ top: '50%' }}
                      />
                      {/* Horizontal line 2 (66.67%) */}
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
                  <div className="absolute top-2 left-2 z-30 pointer-events-none">
                    <span className="px-2 py-0.5 rounded-md bg-black/75 text-[10px] text-white/90 border border-white/20 mono font-semibold backdrop-blur-xs">
                      {selectedRatio} Viewport
                    </span>
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
                      <span>Snapped to {activeSnapLabel}</span>
                    </div>
                  )}

                  {/* Drag to Reposition Helper */}
                  {!activeSnapLabel && (
                    <div className="absolute bottom-2 right-2 z-30 pointer-events-none flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/75 text-[9px] text-white/60 mono border border-white/10 backdrop-blur-xs">
                      <Move className="w-2.5 h-2.5" />
                      <span>Drag to pan</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Composition Controls & Snap Tools */}
              <div className="bg-[#0f0f17] border border-[#27272a] rounded-xl p-3 space-y-3">
                {/* Row 1: Directional Nudges & Quick Alignment Presets */}
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
                  {/* Horizontal Position X */}
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
                    <div className="flex justify-between text-[9px] text-white/30 px-0.5">
                      <span>Left</span>
                      <span>Center</span>
                      <span>Right</span>
                    </div>
                  </div>

                  {/* Vertical Position Y */}
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
                    <div className="flex justify-between text-[9px] text-white/30 px-0.5">
                      <span>Top</span>
                      <span>Center</span>
                      <span>Bottom</span>
                    </div>
                  </div>

                  {/* Scale / Zoom */}
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
                    <div className="flex justify-between text-[9px] text-white/30 px-0.5">
                      <span>1.0x (Fit)</span>
                      <span>2.0x</span>
                      <span>3.0x (Close-up)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* User Text Instruction Input Box */}
      <div className="space-y-1.5 pt-1">
        <div className="flex items-center justify-between">
          <label className="text-xs font-extrabold uppercase tracking-wider mono flex items-center gap-2">
            <Wand2 className="w-3.5 h-3.5 text-fuchsia-400" />
            <span className="bg-gradient-to-r from-purple-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent font-extrabold text-xs sm:text-sm">
              Image to Video Instructions
            </span>
          </label>
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <LanguageSelectorButton size="sm" />
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

      {/* Embedded Dedicated Generate Video Button */}
      {onGenerate && (
        <div className="pt-1">
          <button
            type="button"
            onClick={onGenerate}
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
