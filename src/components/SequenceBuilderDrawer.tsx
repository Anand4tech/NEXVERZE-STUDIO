import React, { useState, useRef, useEffect, useCallback } from 'react';
import { StudioGeneration } from '../lib/supabase';
import { VideoSample, SAMPLE_VIDEOS } from '../lib/videoSamples';
import {
  X,
  Play,
  Pause,
  RotateCcw,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Download,
  Film,
  Layers,
  Copy,
  Clock,
  Sparkles,
  Sliders,
  Check,
  AlertCircle,
  Upload,
  ArrowRight,
  Maximize2,
  Scissors,
  FileVideo,
  ListOrdered,
  Lock,
} from 'lucide-react';

export type SequenceTransition = 'Cut' | 'Crossfade' | 'Wipe' | 'Fade Black';

export interface SequenceClip {
  id: string; // timeline instance id
  title: string;
  prompt: string;
  videoUrl: string;
  thumbnailUrl?: string;
  duration: number; // in seconds
  model: string;
  aspectRatio: '9:16' | '16:9' | '1:1';
  transitionToNext: SequenceTransition;
  speed: number;
}

interface SequenceBuilderDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  availableGenerations: (StudioGeneration | VideoSample)[];
  currentStudioVideo?: {
    video_url: string;
    prompt: string;
    model: string;
    aspect_ratio?: string;
    duration?: string;
  };
  isFreeUser?: boolean;
  onOpenPlans?: () => void;
}

export const SequenceBuilderDrawer: React.FC<SequenceBuilderDrawerProps> = ({
  isOpen,
  onClose,
  availableGenerations,
  currentStudioVideo,
  isFreeUser = false,
  onOpenPlans,
}) => {
  // Timeline sequence state initialized with high-quality sample clips
  const [clips, setClips] = useState<SequenceClip[]>(() => {
    return [
      {
        id: 'seq-1',
        title: 'Scene 01: Cyberpunk City',
        prompt: SAMPLE_VIDEOS[0].prompt,
        videoUrl: SAMPLE_VIDEOS[0].video_url,
        thumbnailUrl: SAMPLE_VIDEOS[0].thumbnail_url,
        duration: 5.0,
        model: SAMPLE_VIDEOS[0].model.toUpperCase(),
        aspectRatio: SAMPLE_VIDEOS[0].aspect_ratio,
        transitionToNext: 'Crossfade',
        speed: 1,
      },
      {
        id: 'seq-2',
        title: 'Scene 02: Golden Temple Flight',
        prompt: SAMPLE_VIDEOS[1].prompt,
        videoUrl: SAMPLE_VIDEOS[1].video_url,
        thumbnailUrl: SAMPLE_VIDEOS[1].thumbnail_url,
        duration: 5.5,
        model: SAMPLE_VIDEOS[1].model.toUpperCase(),
        aspectRatio: SAMPLE_VIDEOS[1].aspect_ratio,
        transitionToNext: 'Wipe',
        speed: 1,
      },
      {
        id: 'seq-3',
        title: 'Scene 03: Neural Bioluminescence',
        prompt: SAMPLE_VIDEOS[2].prompt,
        videoUrl: SAMPLE_VIDEOS[2].video_url,
        thumbnailUrl: SAMPLE_VIDEOS[2].thumbnail_url,
        duration: 4.8,
        model: SAMPLE_VIDEOS[2].model.toUpperCase(),
        aspectRatio: SAMPLE_VIDEOS[2].aspect_ratio,
        transitionToNext: 'Cut',
        speed: 1,
      },
    ];
  });

  // Playback state across the concatenated timeline
  const [activeClipIndex, setActiveClipIndex] = useState<number>(0);
  const [isPlayingSequence, setIsPlayingSequence] = useState<boolean>(false);
  const [sequenceTime, setSequenceTime] = useState<number>(0);
  const [isLoopingSequence, setIsLoopingSequence] = useState<boolean>(true);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<number>(0);
  const [exportSuccessNotice, setExportSuccessNotice] = useState<string | null>(null);
  const [isAddClipModalOpen, setIsAddClipModalOpen] = useState<boolean>(false);

  const previewVideoRef = useRef<HTMLVideoElement>(null);
  const timelineScrubRef = useRef<HTMLDivElement>(null);
  const fileUploadInputRef = useRef<HTMLInputElement>(null);

  // Calculate total timeline duration
  const totalDuration = clips.reduce((acc, c) => acc + (c.duration / c.speed), 0);

  // Compute accumulated starting time for each clip
  const clipStartTimes = clips.reduce<number[]>((acc, clip, idx) => {
    if (idx === 0) return [0];
    const prevStart = acc[idx - 1];
    const prevDur = clips[idx - 1].duration / clips[idx - 1].speed;
    return [...acc, prevStart + prevDur];
  }, []);

  // Synchronize sequence playback: advance when single clip finishes
  const handleClipEnded = () => {
    if (activeClipIndex < clips.length - 1) {
      const nextIdx = activeClipIndex + 1;
      setActiveClipIndex(nextIdx);
    } else {
      if (isLoopingSequence) {
        setActiveClipIndex(0);
        setSequenceTime(0);
      } else {
        setIsPlayingSequence(false);
      }
    }
  };

  // Keep preview video in sync when active clip changes
  useEffect(() => {
    const vid = previewVideoRef.current;
    if (!vid) return;

    if (clips[activeClipIndex]) {
      vid.src = clips[activeClipIndex].videoUrl;
      vid.playbackRate = clips[activeClipIndex].speed || 1;
      vid.load();
      if (isPlayingSequence) {
        vid.play().catch(() => {});
      }
    }
  }, [activeClipIndex, clips]);

  // Master timeupdate tracking
  useEffect(() => {
    const vid = previewVideoRef.current;
    if (!vid) return;

    const onTimeUpdate = () => {
      const clipStart = clipStartTimes[activeClipIndex] || 0;
      const currentInClip = vid.currentTime;
      setSequenceTime(clipStart + currentInClip);
    };

    vid.addEventListener('timeupdate', onTimeUpdate);
    vid.addEventListener('ended', handleClipEnded);

    return () => {
      vid.removeEventListener('timeupdate', onTimeUpdate);
      vid.removeEventListener('ended', handleClipEnded);
    };
  }, [activeClipIndex, clipStartTimes, clips, isLoopingSequence]);

  // Master Play/Pause Sequence toggle
  const togglePlaySequence = () => {
    const vid = previewVideoRef.current;
    if (!vid) return;

    if (isPlayingSequence) {
      vid.pause();
      setIsPlayingSequence(false);
    } else {
      vid.play()
        .then(() => setIsPlayingSequence(true))
        .catch((e) => console.warn('Preview play warning:', e));
    }
  };

  // Master Timeline Seek
  const handleSeekSequence = (targetTime: number) => {
    const clamped = Math.max(0, Math.min(totalDuration, targetTime));
    setSequenceTime(clamped);

    // Find which clip contains this timestamp
    for (let i = 0; i < clips.length; i++) {
      const start = clipStartTimes[i];
      const dur = clips[i].duration / clips[i].speed;
      if (clamped >= start && clamped <= start + dur) {
        if (activeClipIndex !== i) {
          setActiveClipIndex(i);
        }
        if (previewVideoRef.current) {
          previewVideoRef.current.currentTime = clamped - start;
        }
        break;
      }
    }
  };

  // Reorder Clips: Move Left (Earlier)
  const moveClipLeft = (index: number) => {
    if (index <= 0) return;
    setClips((prev) => {
      const copy = [...prev];
      const temp = copy[index - 1];
      copy[index - 1] = copy[index];
      copy[index] = temp;
      return copy;
    });
    if (activeClipIndex === index) setActiveClipIndex(index - 1);
    else if (activeClipIndex === index - 1) setActiveClipIndex(index);
  };

  // Reorder Clips: Move Right (Later)
  const moveClipRight = (index: number) => {
    if (index >= clips.length - 1) return;
    setClips((prev) => {
      const copy = [...prev];
      const temp = copy[index + 1];
      copy[index + 1] = copy[index];
      copy[index] = temp;
      return copy;
    });
    if (activeClipIndex === index) setActiveClipIndex(index + 1);
    else if (activeClipIndex === index + 1) setActiveClipIndex(index);
  };

  // Delete clip from timeline
  const deleteClip = (id: string) => {
    if (clips.length <= 1) {
      setExportSuccessNotice('The sequence must contain at least 1 video clip.');
      setTimeout(() => setExportSuccessNotice(null), 3500);
      return;
    }
    const idx = clips.findIndex((c) => c.id === id);
    setClips((prev) => prev.filter((c) => c.id !== id));
    if (activeClipIndex >= idx && activeClipIndex > 0) {
      setActiveClipIndex(activeClipIndex - 1);
    }
  };

  // Duplicate clip in timeline
  const duplicateClip = (index: number) => {
    const target = clips[index];
    const cloned: SequenceClip = {
      ...target,
      id: `seq-${crypto.randomUUID().slice(0, 8)}`,
      title: `${target.title} (Duplicate)`,
    };
    setClips((prev) => {
      const copy = [...prev];
      copy.splice(index + 1, 0, cloned);
      return copy;
    });
  };

  // Cycle transition to next
  const cycleTransition = (index: number) => {
    const transitions: SequenceTransition[] = ['Cut', 'Crossfade', 'Wipe', 'Fade Black'];
    const current = clips[index].transitionToNext;
    const nextIdx = (transitions.indexOf(current) + 1) % transitions.length;
    setClips((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], transitionToNext: transitions[nextIdx] };
      return copy;
    });
  };

  // Add clip to timeline helper
  const addClipToTimeline = (
    videoUrl: string,
    prompt: string,
    model: string,
    ratio: '9:16' | '16:9' | '1:1',
    durationSec: number = 5.0
  ) => {
    const newClip: SequenceClip = {
      id: `seq-${crypto.randomUUID().slice(0, 8)}`,
      title: `Scene 0${clips.length + 1}: ${model} render`,
      prompt,
      videoUrl,
      duration: durationSec,
      model: model.toUpperCase(),
      aspectRatio: ratio,
      transitionToNext: 'Crossfade',
      speed: 1,
    };
    setClips((prev) => [...prev, newClip]);
    setIsAddClipModalOpen(false);
  };

  // Add current active studio video
  const handleAddCurrentStudioClip = () => {
    if (!currentStudioVideo?.video_url) return;
    addClipToTimeline(
      currentStudioVideo.video_url,
      currentStudioVideo.prompt || 'Studio Generation',
      currentStudioVideo.model || 'LUMA',
      (currentStudioVideo.aspect_ratio || '9:16') as any,
      parseFloat(currentStudioVideo.duration?.replace('s', '') || '5')
    );
  };

  // Handle local user file upload into sequence
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    addClipToTimeline(url, `Uploaded File: ${file.name}`, 'MP4 SOURCE', '9:16', 5.0);
  };

  // EXPORT COMBINED VIDEO FILE
  // High-performance client-side concatenation via Canvas + MediaRecorder
  const handleExportCombinedVideo = async () => {
    if (isFreeUser) {
      if (onOpenPlans) {
        onOpenPlans();
      }
      setExportSuccessNotice('🔒 Full Sequence Video Export is locked in Free Preview. Top up ₹99 Nano Trial Pack to unlock!');
      setTimeout(() => setExportSuccessNotice(null), 5000);
      return;
    }
    if (isExporting || clips.length === 0) return;
    setIsExporting(true);
    setExportProgress(5);

    try {
      // 1. Prepare canvas for rendering combined output
      const canvas = document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = 1920;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas 2D context unavailable');

      // 2. Setup MediaRecorder
      const stream = canvas.captureStream(30);
      let mimeType = 'video/webm; codecs=vp9';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm';
      }

      const recorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 8000000, // 8 Mbps high quality
      });

      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      const recordPromise = new Promise<Blob>((resolve) => {
        recorder.onstop = () => {
          resolve(new Blob(chunks, { type: 'video/webm' }));
        };
      });

      recorder.start(100);

      // 3. Render clips in sequential order through offscreen video element
      const offscreenVideo = document.createElement('video');
      offscreenVideo.crossOrigin = 'anonymous';
      offscreenVideo.muted = true;
      offscreenVideo.playsInline = true;

      for (let i = 0; i < clips.length; i++) {
        const clip = clips[i];
        setExportProgress(Math.round(((i) / clips.length) * 85) + 5);

        await new Promise<void>((resolve, reject) => {
          offscreenVideo.src = clip.videoUrl;
          offscreenVideo.load();

          offscreenVideo.onloadeddata = async () => {
            try {
              await offscreenVideo.play();
              const clipDurationMs = (clip.duration / clip.speed) * 1000;
              const startTime = performance.now();

              const drawFrame = () => {
                const elapsed = performance.now() - startTime;
                if (elapsed >= clipDurationMs || offscreenVideo.ended) {
                  offscreenVideo.pause();
                  resolve();
                  return;
                }

                // Draw video frame centered
                ctx.fillStyle = '#0a0a12';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                try {
                  ctx.drawImage(offscreenVideo, 0, 0, canvas.width, canvas.height);
                } catch {
                  // Ignore CORS draw if tainted
                }

                // Render watermark / title tag
                ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
                ctx.fillRect(20, canvas.height - 80, 420, 50);
                ctx.fillStyle = '#a855f7';
                ctx.font = 'bold 24px monospace';
                ctx.fillText(`NexVerze Studio • Scene ${i + 1}`, 35, canvas.height - 47);

                requestAnimationFrame(drawFrame);
              };

              requestAnimationFrame(drawFrame);
            } catch (err) {
              resolve(); // Continue to next clip on play error
            }
          };

          offscreenVideo.onerror = () => resolve(); // Skip errored clips
        });
      }

      setExportProgress(95);
      recorder.stop();
      const combinedBlob = await recordPromise;

      // 4. Trigger download
      const downloadUrl = URL.createObjectURL(combinedBlob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `nexverze-combined-sequence-${Date.now()}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setExportProgress(100);
      setExportSuccessNotice('Combined video successfully exported and downloaded!');
      setTimeout(() => setExportSuccessNotice(null), 4000);
    } catch (err) {
      console.warn('Canvas export fallback, creating project file package:', err);

      // Fallback: Generate EDL Project Concat script & JSON bundle
      const edlContent = clips
        .map((c, idx) => `file '${c.videoUrl}' # Clip ${idx + 1}: ${c.title}`)
        .join('\n');
      const projectBlob = new Blob([edlContent], { type: 'text/plain' });
      const dlUrl = URL.createObjectURL(projectBlob);
      const a = document.createElement('a');
      a.href = dlUrl;
      a.download = `nexverze-timeline-manifest-${Date.now()}.txt`;
      a.click();

      setExportSuccessNotice('Timeline concatenation project manifest exported!');
      setTimeout(() => setExportSuccessNotice(null), 4000);
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  // Handle Escape key for drawer and add clip modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isAddClipModalOpen) {
          setIsAddClipModalOpen(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isAddClipModalOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#12121a] border-t border-[#272738] rounded-t-3xl w-full max-w-7xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden"
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-4 sm:px-8 py-3.5 sm:py-4 border-b border-[#272738] bg-[#0c0c14] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30 flex items-center justify-center shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-lg font-bold text-white tracking-tight">
                  Sequence Builder & Multi-Clip Timeline
                </h3>
                <span className="mono text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full border border-purple-500/30 font-semibold">
                  {clips.length} Clips • {totalDuration.toFixed(1)}s Runtime
                </span>
              </div>
              <p className="text-xs text-white/50 hidden sm:block">
                Arrange multiple generated clips on a timeline, set transitions, preview seamless concatenation, and export as a combined video file
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Add Clip Dropdown Button */}
            <button
              type="button"
              onClick={() => setIsAddClipModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs mono flex items-center gap-1.5 shadow-lg transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add Clip</span>
            </button>

            {/* Export Combined Video Button */}
            <button
              type="button"
              onClick={handleExportCombinedVideo}
              disabled={isExporting}
              className={`px-3.5 py-1.5 rounded-xl font-semibold text-xs mono flex items-center gap-1.5 transition-all shadow-lg cursor-pointer ${
                isExporting
                  ? 'bg-purple-900/50 text-purple-300 border border-purple-500/40 cursor-wait'
                  : isFreeUser
                  ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 ring-1 ring-amber-500/30'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white ring-1 ring-emerald-400/30'
              }`}
              title={isFreeUser ? '🔒 Unlock Full Sequence Export with ₹99 Pack' : 'Export all timeline clips concatenated into a combined video file'}
            >
              {isFreeUser ? <Lock className="w-3.5 h-3.5 text-amber-400" /> : <Download className="w-3.5 h-3.5" />}
              <span>
                {isExporting
                  ? `Exporting (${exportProgress}%)...`
                  : isFreeUser
                  ? '🔒 Unlock Full Export (₹99)'
                  : 'Export Combined Video'}
              </span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-white/60 hover:text-white hover:bg-white/10 active:bg-white/20 rounded-xl transition-all cursor-pointer ring-1 ring-white/10 hover:ring-purple-400/40 ml-1"
              title="Close Sequence Builder (Esc)"
              aria-label="Close Sequence Builder"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Drawer Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {/* Export Success Toast */}
          {exportSuccessNotice && (
            <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs mono flex items-center gap-2 animate-in slide-in-from-top">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{exportSuccessNotice}</span>
            </div>
          )}

          {/* Top Section: Active Sequence Concatenation Player */}
          <div className="bg-[#181824] border border-[#272738] rounded-2xl p-4 sm:p-5 grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
            {/* Player Viewport */}
            <div className="md:col-span-6 lg:col-span-5 relative aspect-video bg-[#090910] rounded-xl overflow-hidden border border-[#272738] shadow-inner group">
              <video
                ref={previewVideoRef}
                src={clips[activeClipIndex]?.videoUrl || '/videos/sample-1.mp4'}
                onError={(e) => {
                  (e.target as HTMLVideoElement).src = '/videos/sample-1.mp4';
                }}
                playsInline
                className="w-full h-full object-cover object-center"
                onClick={togglePlaySequence}
              />

              {/* Sequence Time & Active Clip Badge */}
              <div className="absolute top-2 left-2 flex items-center gap-1.5 z-10 pointer-events-none">
                <span className="px-2 py-0.5 rounded bg-black/75 backdrop-blur-md text-[10px] mono text-purple-300 font-bold border border-white/10">
                  Clip {activeClipIndex + 1}/{clips.length}
                </span>
                <span className="px-2 py-0.5 rounded bg-black/75 backdrop-blur-md text-[10px] mono text-cyan-300 border border-white/10">
                  {clips[activeClipIndex]?.model}
                </span>
              </div>

              <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/75 backdrop-blur-md text-[10px] mono text-white/80 z-10 pointer-events-none">
                {sequenceTime.toFixed(1)}s / {totalDuration.toFixed(1)}s
              </div>
            </div>

            {/* Sequence Playback Controls & Info */}
            <div className="md:col-span-6 lg:col-span-7 space-y-3.5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="mono text-[10px] text-purple-400 font-semibold uppercase tracking-wider">
                    Timeline Monitor
                  </span>
                  <h4 className="text-sm font-bold text-white mt-0.5">
                    {clips[activeClipIndex]?.title || 'Multi-Clip Sequence'}
                  </h4>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (activeClipIndex > 0) setActiveClipIndex(activeClipIndex - 1);
                    }}
                    disabled={activeClipIndex === 0}
                    className="p-1.5 rounded-lg bg-[#0d0d14] hover:bg-white/10 disabled:opacity-30 border border-[#272738] text-white/80 hover:text-white"
                    title="Previous Clip"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (activeClipIndex < clips.length - 1) setActiveClipIndex(activeClipIndex + 1);
                    }}
                    disabled={activeClipIndex >= clips.length - 1}
                    className="p-1.5 rounded-lg bg-[#0d0d14] hover:bg-white/10 disabled:opacity-30 border border-[#272738] text-white/80 hover:text-white"
                    title="Next Clip"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Master Global Timeline Scrubber */}
              <div className="space-y-1">
                <div
                  ref={timelineScrubRef}
                  onClick={(e) => {
                    if (!timelineScrubRef.current) return;
                    const rect = timelineScrubRef.current.getBoundingClientRect();
                    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                    handleSeekSequence(percent * totalDuration);
                  }}
                  className="relative h-2.5 bg-[#0d0d14] rounded-full cursor-pointer overflow-hidden border border-white/10"
                >
                  <div
                    className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-purple-500 to-cyan-400"
                    style={{ width: `${(sequenceTime / (totalDuration || 1)) * 100}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] mono text-white/40">
                  <span>00:00.0</span>
                  <span className="text-purple-300 font-bold">{sequenceTime.toFixed(2)}s</span>
                  <span>{totalDuration.toFixed(1)}s Total</span>
                </div>
              </div>

              {/* Sequence Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  onClick={togglePlaySequence}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs mono flex items-center gap-2 shadow-md transition-all"
                >
                  {isPlayingSequence ? (
                    <>
                      <Pause className="w-4 h-4 fill-white" />
                      <span>Pause Sequence</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-white translate-x-0.5" />
                      <span>Play Combined Sequence</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => handleSeekSequence(0)}
                  className="p-2 rounded-xl bg-[#0d0d14] hover:bg-white/10 border border-[#272738] text-white/70 hover:text-white transition-colors"
                  title="Restart Sequence from Beginning"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                {currentStudioVideo?.video_url && (
                  <button
                    onClick={handleAddCurrentStudioClip}
                    className="px-3 py-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 text-xs mono flex items-center gap-1.5 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add Current Studio Clip</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Timeline Track Strip */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ListOrdered className="w-4 h-4 text-purple-400" />
                <h4 className="text-xs font-bold text-white uppercase mono tracking-wider">
                  Timeline Clips Track ({clips.length})
                </h4>
                <span className="text-[10px] text-white/40 hidden sm:inline">
                  • Reorder clips using left/right arrows, customize transitions & export
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsAddClipModalOpen(true)}
                  className="px-2.5 py-1 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 hover:text-white text-[11px] mono border border-purple-500/30 flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="w-3 h-3 text-purple-400" />
                  <span>+ Add From Generations</span>
                </button>
              </div>
            </div>

            {/* Horizontal Clips Container */}
            <div className="flex items-stretch gap-3 overflow-x-auto pb-4 pt-1">
              {clips.map((clip, index) => {
                const isActive = activeClipIndex === index;
                return (
                  <React.Fragment key={clip.id}>
                    {/* Clip Card */}
                    <div
                      onClick={() => setActiveClipIndex(index)}
                      className={`min-w-[240px] max-w-[260px] bg-[#181824] border rounded-2xl p-3 flex flex-col justify-between shrink-0 cursor-pointer transition-all ${
                        isActive
                          ? 'border-purple-400 ring-2 ring-purple-500/50 shadow-purple-900/30'
                          : 'border-[#272738] hover:border-white/20'
                      }`}
                    >
                      {/* Card Header: Order Number + Actions */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="mono text-[11px] font-bold px-2 py-0.5 rounded-md bg-purple-600 text-white">
                          #{index + 1}
                        </span>

                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => moveClipLeft(index)}
                            disabled={index === 0}
                            className="p-1 rounded bg-[#0d0d14] hover:bg-white/10 disabled:opacity-20 text-white/70 hover:text-white"
                            title="Move earlier in timeline"
                          >
                            <ChevronLeft className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => moveClipRight(index)}
                            disabled={index === clips.length - 1}
                            className="p-1 rounded bg-[#0d0d14] hover:bg-white/10 disabled:opacity-20 text-white/70 hover:text-white"
                            title="Move later in timeline"
                          >
                            <ChevronRight className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => duplicateClip(index)}
                            className="p-1 rounded bg-[#0d0d14] hover:bg-white/10 text-white/70 hover:text-white"
                            title="Duplicate clip"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => deleteClip(clip.id)}
                            className="p-1 rounded bg-[#0d0d14] hover:bg-rose-500/20 text-white/40 hover:text-rose-400"
                            title="Remove clip from timeline"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Video Thumbnail Preview */}
                      <div className="relative aspect-video bg-[#090910] rounded-xl overflow-hidden mb-2 border border-white/5 group/thumb">
                        <video
                          src={clip.videoUrl || '/videos/sample-1.mp4'}
                          onError={(e) => {
                            (e.target as HTMLVideoElement).src = '/videos/sample-1.mp4';
                          }}
                          className="w-full h-full object-cover object-center"
                          muted
                          playsInline
                        />
                        <div className="absolute top-1.5 left-1.5 px-1.5 py-0.2 rounded bg-black/70 text-[9px] mono text-purple-300">
                          {clip.model}
                        </div>
                        <div className="absolute top-1.5 right-1.5 px-1.5 py-0.2 rounded bg-black/70 text-[9px] mono text-white/70">
                          {clip.duration.toFixed(1)}s
                        </div>
                      </div>

                      {/* Prompt / Title */}
                      <div className="space-y-1">
                        <p className="text-[11px] font-mono text-white/90 line-clamp-2 leading-tight">
                          "{clip.prompt}"
                        </p>
                      </div>

                      {/* Speed adjuster */}
                      <div className="flex items-center justify-between text-[10px] mono text-white/50 pt-2 border-t border-white/5 mt-2">
                        <span>Speed: {clip.speed}x</span>
                        <span className="text-purple-300 font-bold">{clip.aspectRatio}</span>
                      </div>
                    </div>

                    {/* Transition Pill Between Clips */}
                    {index < clips.length - 1 && (
                      <div className="flex flex-col items-center justify-center shrink-0 px-1">
                        <button
                          onClick={() => cycleTransition(index)}
                          className="px-2 py-1 rounded-lg bg-[#181824] hover:bg-purple-900/40 border border-[#272738] hover:border-purple-500/40 text-[10px] mono font-semibold text-cyan-300 transition-colors flex items-center gap-1 shadow-sm"
                          title="Click to cycle transition style (Cut, Crossfade, Wipe, Fade Black)"
                        >
                          <Scissors className="w-2.5 h-2.5 text-cyan-400" />
                          <span>{clip.transitionToNext}</span>
                        </button>
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal to add clip from history or creative sample library */}
        {isAddClipModalOpen && (
          <div
            onClick={() => setIsAddClipModalOpen(false)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-[#181824] border border-[#272738] rounded-3xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#27272a]">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Film className="w-4 h-4 text-purple-400" />
                  <span>Add Clip to Timeline</span>
                </h4>
                <button
                  type="button"
                  onClick={() => setIsAddClipModalOpen(false)}
                  className="p-1.5 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                  title="Close (Esc)"
                  aria-label="Close add clip modal"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>

              <div className="overflow-y-auto space-y-3 flex-1 pr-1">
                {availableGenerations.map((g) => (
                  <div
                    key={g.id}
                    onClick={() =>
                      addClipToTimeline(
                        g.video_url,
                        g.prompt,
                        g.model,
                        (g.aspect_ratio || '9:16') as any,
                        5.0
                      )
                    }
                    className="p-3 rounded-xl bg-[#0d0d14] hover:bg-purple-950/30 border border-[#272738] hover:border-purple-500/40 cursor-pointer flex items-center justify-between gap-3 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-16 h-10 rounded-lg bg-[#090910] overflow-hidden shrink-0 border border-white/5">
                        <video
                          src={g.video_url || '/videos/sample-1.mp4'}
                          onError={(e) => {
                            (e.target as HTMLVideoElement).src = '/videos/sample-1.mp4';
                          }}
                          className="w-full h-full object-cover"
                          muted
                          playsInline
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-white truncate">{g.prompt}</div>
                        <div className="text-[10px] mono text-purple-300 uppercase mt-0.5">
                          {g.model} • {g.aspect_ratio || '9:16'}
                        </div>
                      </div>
                    </div>

                    <button className="px-2.5 py-1 rounded-lg bg-purple-600/30 hover:bg-purple-600 text-purple-200 text-xs mono shrink-0 font-semibold">
                      + Insert
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
