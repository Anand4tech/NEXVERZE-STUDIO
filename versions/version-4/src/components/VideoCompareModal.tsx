import React, { useRef, useState, useEffect, useCallback } from 'react';
import { StudioGeneration } from '../lib/supabase';
import { VideoSample, SAMPLE_VIDEOS } from '../lib/videoSamples';
import {
  X,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  Volume1,
  VolumeX,
  Sliders,
  GitCompare,
  ArrowLeftRight,
  Copy,
  Check,
  Sparkles,
  Maximize2,
  Film,
  Layers,
  Repeat,
  Activity,
  Split,
  Columns,
  Gauge,
  ChevronDown,
} from 'lucide-react';

export interface CompareVideoItem {
  id: string;
  title?: string;
  prompt: string;
  model: string;
  aspect_ratio?: string;
  duration?: string;
  video_url: string;
  created_at?: string;
}

interface VideoCompareModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoA: CompareVideoItem | null;
  videoB: CompareVideoItem | null;
  allGenerations: (StudioGeneration | VideoSample)[];
  onSelectVideoA: (item: CompareVideoItem) => void;
  onSelectVideoB: (item: CompareVideoItem) => void;
  onReusePrompt?: (prompt: string, model: string, ratio: string) => void;
}

export const VideoCompareModal: React.FC<VideoCompareModalProps> = ({
  isOpen,
  onClose,
  videoA,
  videoB,
  allGenerations,
  onSelectVideoA,
  onSelectVideoB,
  onReusePrompt,
}) => {
  const videoRefA = useRef<HTMLVideoElement>(null);
  const videoRefB = useRef<HTMLVideoElement>(null);
  const scrubBarRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [compareVolume, setCompareVolume] = useState<number>(0.8);
  const [isLooping, setIsLooping] = useState(true);
  const [isSyncLocked, setIsSyncLocked] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [maxDuration, setMaxDuration] = useState(5);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [viewMode, setViewMode] = useState<'side-by-side' | 'split-wipe'>('side-by-side');
  const [wipePercent, setWipePercent] = useState<number>(50);
  const [isDraggingWipe, setIsDraggingWipe] = useState(false);
  const [copiedSlot, setCopiedSlot] = useState<'A' | 'B' | null>(null);

  // Resolve active items with sensible fallbacks from sample videos if missing
  const activeItemA: CompareVideoItem = videoA || {
    id: SAMPLE_VIDEOS[0].id,
    title: SAMPLE_VIDEOS[0].title,
    prompt: SAMPLE_VIDEOS[0].prompt,
    model: SAMPLE_VIDEOS[0].model,
    aspect_ratio: SAMPLE_VIDEOS[0].aspect_ratio,
    duration: SAMPLE_VIDEOS[0].duration,
    video_url: SAMPLE_VIDEOS[0].video_url,
    created_at: SAMPLE_VIDEOS[0].created_at,
  };

  const activeItemB: CompareVideoItem = videoB || {
    id: SAMPLE_VIDEOS[1].id,
    title: SAMPLE_VIDEOS[1].title,
    prompt: SAMPLE_VIDEOS[1].prompt,
    model: SAMPLE_VIDEOS[1].model,
    aspect_ratio: SAMPLE_VIDEOS[1].aspect_ratio,
    duration: SAMPLE_VIDEOS[1].duration,
    video_url: SAMPLE_VIDEOS[1].video_url,
    created_at: SAMPLE_VIDEOS[1].created_at,
  };

  // Convert raw generation record to CompareVideoItem
  const normalizeItem = (item: StudioGeneration | VideoSample): CompareVideoItem => {
    return {
      id: item.id,
      title: 'title' in item ? item.title : undefined,
      prompt: item.prompt,
      model: item.model,
      aspect_ratio: item.aspect_ratio || '9:16',
      duration: item.duration || '5s',
      video_url: item.video_url,
      created_at: item.created_at,
    };
  };

  // Master Synchronized Play / Pause
  const togglePlay = useCallback(() => {
    const vA = videoRefA.current;
    const vB = videoRefB.current;
    if (!vA || !vB) return;

    if (isPlaying) {
      vA.pause();
      vB.pause();
      setIsPlaying(false);
    } else {
      // Re-align before starting
      if (isSyncLocked) {
        vB.currentTime = vA.currentTime;
      }
      Promise.all([vA.play(), vB.play()])
        .then(() => setIsPlaying(true))
        .catch((e) => console.warn('Sync play notice:', e));
    }
  }, [isPlaying, isSyncLocked]);

  // Master Synchronized Seek / Scrub
  const handleSeek = (newTime: number) => {
    const clamped = Math.max(0, Math.min(maxDuration, newTime));
    setCurrentTime(clamped);

    if (videoRefA.current) {
      videoRefA.current.currentTime = clamped;
    }
    if (videoRefB.current && isSyncLocked) {
      videoRefB.current.currentTime = clamped;
    }
  };

  // Time update listener
  useEffect(() => {
    const vA = videoRefA.current;
    const vB = videoRefB.current;
    if (!vA) return;

    const onTimeUpdateA = () => {
      if (!isScrubbing) {
        setCurrentTime(vA.currentTime);
      }
    };

    const onLoadedMetadataA = () => {
      const durA = vA.duration || 5;
      const durB = vB?.duration || 5;
      setMaxDuration(Math.max(durA, durB));
    };

    const onEndedA = () => {
      if (isLooping) {
        if (vA) vA.currentTime = 0;
        if (vB) vB.currentTime = 0;
        if (isPlaying) {
          vA?.play();
          vB?.play();
        }
      } else {
        setIsPlaying(false);
      }
    };

    vA.addEventListener('timeupdate', onTimeUpdateA);
    vA.addEventListener('loadedmetadata', onLoadedMetadataA);
    vA.addEventListener('ended', onEndedA);

    return () => {
      vA.removeEventListener('timeupdate', onTimeUpdateA);
      vA.removeEventListener('loadedmetadata', onLoadedMetadataA);
      vA.removeEventListener('ended', onEndedA);
    };
  }, [isScrubbing, isLooping, isPlaying]);

  // Handle Playback speed changes
  const handleSpeedChange = (spd: number) => {
    setPlaybackSpeed(spd);
    if (videoRefA.current) videoRefA.current.playbackRate = spd;
    if (videoRefB.current) videoRefB.current.playbackRate = spd;
  };

  const handleCompareVolumeChange = (newVol: number) => {
    const clamped = Math.max(0, Math.min(1, newVol));
    setCompareVolume(clamped);
    if (videoRefA.current) videoRefA.current.volume = clamped;
    if (videoRefB.current) videoRefB.current.volume = clamped;
    if (clamped > 0 && isMuted) {
      setIsMuted(false);
      if (videoRefA.current) videoRefA.current.muted = false;
      if (videoRefB.current) videoRefB.current.muted = false;
    } else if (clamped === 0 && !isMuted) {
      setIsMuted(true);
      if (videoRefA.current) videoRefA.current.muted = true;
      if (videoRefB.current) videoRefB.current.muted = true;
    }
  };

  // Synchronized Frame Stepping (1 frame = ~0.04s at 24/30fps)
  const stepFrame = (frames: number) => {
    const stepDelta = frames * 0.04;
    const vA = videoRefA.current;
    const vB = videoRefB.current;
    if (vA) {
      vA.pause();
      const nextTime = Math.max(0, Math.min(maxDuration, vA.currentTime + stepDelta));
      vA.currentTime = nextTime;
      setCurrentTime(nextTime);
      if (vB && isSyncLocked) {
        vB.pause();
        vB.currentTime = nextTime;
      }
      setIsPlaying(false);
    }
  };

  // Swap Video A and Video B
  const handleSwap = () => {
    const tempA = activeItemA;
    onSelectVideoA(activeItemB);
    onSelectVideoB(tempA);
  };

  // Copy prompt helper
  const handleCopyPrompt = (slot: 'A' | 'B', text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSlot(slot);
    setTimeout(() => setCopiedSlot(null), 2000);
  };

  // Scrub bar drag handlers
  const handleScrubBarMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsScrubbing(true);
    updateScrubPosition(e.clientX);
  };

  const updateScrubPosition = (clientX: number) => {
    if (!scrubBarRef.current) return;
    const rect = scrubBarRef.current.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const targetTime = percent * maxDuration;
    handleSeek(targetTime);
  };

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (isScrubbing) {
        updateScrubPosition(e.clientX);
      }
      if (isDraggingWipe) {
        const wipeContainer = document.getElementById('wipe-compare-container');
        if (wipeContainer) {
          const rect = wipeContainer.getBoundingClientRect();
          const percent = Math.max(5, Math.min(95, ((e.clientX - rect.left) / rect.width) * 100));
          setWipePercent(percent);
        }
      }
    };

    const onMouseUp = () => {
      if (isScrubbing) setIsScrubbing(false);
      if (isDraggingWipe) setIsDraggingWipe(false);
    };

    if (isScrubbing || isDraggingWipe) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [isScrubbing, isDraggingWipe, maxDuration]);

  // Compute Word Differences between Prompt A and Prompt B
  const computePromptDiff = () => {
    const wordsA = (activeItemA.prompt || '').trim().split(/\s+/);
    const wordsB = (activeItemB.prompt || '').trim().split(/\s+/);
    const setA = new Set(wordsA.map((w) => w.toLowerCase()));
    const setB = new Set(wordsB.map((w) => w.toLowerCase()));

    const additionsInB = wordsB.filter((w) => !setA.has(w.toLowerCase()));
    const removalsFromA = wordsA.filter((w) => !setB.has(w.toLowerCase()));

    return { additionsInB, removalsFromA };
  };

  const { additionsInB, removalsFromA } = computePromptDiff();

  // Handle Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#12121a] border border-[#272738] rounded-3xl w-full max-w-6xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden my-auto"
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-4 sm:px-7 py-3.5 sm:py-4 border-b border-[#272738] bg-[#0c0c14] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30 flex items-center justify-center shrink-0">
              <GitCompare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-lg font-bold text-white tracking-tight">
                  Side-by-Side Prompt & Video Comparison
                </h3>
                <span className="mono text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full border border-purple-500/30 font-semibold">
                  Synchronized
                </span>
              </div>
              <p className="text-xs text-white/50 hidden sm:block">
                Evaluate prompt iterations, camera velocity differences, and model outputs with frame-accurate locked sync
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Switcher: Side-by-Side vs Interactive Split-Screen Wipe */}
            <div className="flex items-center bg-[#181824] border border-[#272738] p-1 rounded-xl mono text-xs">
              <button
                type="button"
                onClick={() => setViewMode('side-by-side')}
                className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'side-by-side'
                    ? 'bg-purple-600 text-white font-semibold'
                    : 'text-white/60 hover:text-white'
                }`}
                title="50/50 Dual Video Columns"
              >
                <Columns className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Side-by-Side</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('split-wipe')}
                className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'split-wipe'
                    ? 'bg-purple-600 text-white font-semibold'
                    : 'text-white/60 hover:text-white'
                }`}
                title="Interactive Wipe Curtain Overlay"
              >
                <Split className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Split Wipe</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-white/60 hover:text-white hover:bg-white/10 active:bg-white/20 rounded-xl transition-all cursor-pointer ring-1 ring-white/10 hover:ring-purple-400/40 ml-1"
              title="Close Comparison (Esc)"
              aria-label="Close Comparison modal"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Master Synchronized Player Controls Bar */}
          <div className="bg-[#181824] border border-[#272738] rounded-2xl p-3 sm:p-4 space-y-3 shadow-lg">
            {/* Scrub Bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs mono text-white/70">
                <div className="flex items-center gap-2">
                  <span className="text-purple-300 font-bold">{currentTime.toFixed(2)}s</span>
                  <span className="text-white/30">/</span>
                  <span className="text-white/50">{maxDuration.toFixed(2)}s</span>
                  {isSyncLocked ? (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      Locked Sync
                    </span>
                  ) : (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30">
                      Independent
                    </span>
                  )}
                </div>

                <div className="text-[10px] text-white/40 hidden sm:block">
                  Drag scrubber to analyze frame differences across both generations
                </div>
              </div>

              {/* Master Scrub Bar Track */}
              <div
                ref={scrubBarRef}
                onMouseDown={handleScrubBarMouseDown}
                className="relative h-3 bg-[#0d0d14] rounded-full cursor-pointer group border border-white/10 overflow-hidden"
              >
                <div
                  className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-purple-600 via-indigo-500 to-cyan-400 transition-all duration-75"
                  style={{ width: `${(currentTime / maxDuration) * 100}%` }}
                />
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white shadow-md border border-purple-500 group-hover:scale-125 transition-transform"
                  style={{ left: `calc(${(currentTime / maxDuration) * 100}% - 8px)` }}
                />
              </div>
            </div>

            {/* Playback Controls Row */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-2">
                {/* Play / Pause */}
                <button
                  type="button"
                  onClick={togglePlay}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg transition-all"
                >
                  {isPlaying ? (
                    <>
                      <Pause className="w-4 h-4 fill-white" />
                      <span>Pause Both</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-white translate-x-0.5" />
                      <span>Play Both (Sync)</span>
                    </>
                  )}
                </button>


                {/* Restart / Reset */}
                <button
                  onClick={() => handleSeek(0)}
                  className="p-2 rounded-xl bg-[#0d0d14] hover:bg-white/10 border border-[#272738] text-white/70 hover:text-white transition-colors"
                  title="Restart from Beginning (0.00s)"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                {/* Mute toggle & Horizontal Volume Range Slider */}
                <div className="flex items-center gap-1.5 p-1 px-2 rounded-xl bg-[#0d0d14] border border-[#272738]">
                  <button
                    onClick={() => {
                      const next = !isMuted;
                      setIsMuted(next);
                      if (videoRefA.current) videoRefA.current.muted = next;
                      if (videoRefB.current) videoRefB.current.muted = next;
                    }}
                    className="p-1 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
                    title={isMuted ? 'Unmute Audio' : `Mute Audio • Volume: ${Math.round((isMuted ? 0 : compareVolume) * 100)}%`}
                    aria-label={isMuted ? 'Unmute Audio' : 'Mute Audio'}
                  >
                    {isMuted || compareVolume === 0 ? (
                      <VolumeX className="w-4 h-4 text-rose-400" />
                    ) : compareVolume < 0.5 ? (
                      <Volume1 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Volume2 className="w-4 h-4 text-emerald-400" />
                    )}
                  </button>

                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={isMuted ? 0 : compareVolume}
                    onChange={(e) => handleCompareVolumeChange(parseFloat(e.target.value))}
                    className="w-16 sm:w-20 h-1.5 bg-white/20 hover:bg-white/30 rounded-lg appearance-none cursor-pointer accent-purple-400 focus:outline-none focus:ring-1 focus:ring-purple-400 transition-all"
                    title={`Volume: ${Math.round((isMuted ? 0 : compareVolume) * 100)}%`}
                    aria-label="Compare Volume Slider"
                  />
                  <span className="text-[10px] mono text-white/70 min-w-[26px] text-right font-medium select-none">
                    {Math.round((isMuted ? 0 : compareVolume) * 100)}%
                  </span>
                </div>

                {/* Loop Video Checkbox Next to Mute/Unmute Toggle */}
                <label
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs mono cursor-pointer transition-colors select-none ${
                    isLooping
                      ? 'bg-purple-950/40 border-purple-500/50 text-purple-200 shadow-xs'
                      : 'bg-[#0d0d14] border-[#272738] text-white/60 hover:text-white'
                  }`}
                  title={isLooping ? 'Loop Video: Enabled (Continuous playback active)' : 'Loop Video: Disabled (Single playback)'}
                >
                  <input
                    type="checkbox"
                    checked={isLooping}
                    onChange={(e) => setIsLooping(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-purple-600 focus:ring-0 focus:ring-offset-0 bg-[#0f0f17] border-[#3f3f46] accent-purple-600 cursor-pointer"
                    aria-label="Loop Video Checkbox"
                  />
                  <span className="flex items-center gap-1 font-medium">
                    <Repeat className={`w-3.5 h-3.5 ${isLooping ? 'text-purple-400' : 'text-white/40'}`} />
                    <span>Loop Video</span>
                  </span>
                </label>
              </div>

              {/* Right tools: Speed, Loop, Swap A/B */}
              <div className="flex items-center gap-2">
                {/* Playback Speed Selection Menu & Buttons */}
                <div
                  className="relative flex items-center bg-[#0d0d14] hover:bg-[#151522] border border-[#272738] hover:border-purple-500/40 rounded-xl px-2 py-1 mono text-xs transition-colors cursor-pointer group"
                  title="Playback Speed: Select 0.5x, 1x, 1.5x, or 2x"
                >
                  <Gauge className="w-3.5 h-3.5 text-purple-400 mr-1.5 shrink-0" />
                  <label
                    htmlFor="compare-playback-speed-select"
                    className="text-white/70 text-[10px] hidden sm:inline mr-1 cursor-pointer font-medium select-none"
                  >
                    Speed:
                  </label>
                  <span className="text-white font-bold text-xs select-none">
                    {playbackSpeed}x
                  </span>
                  <ChevronDown className="w-3 h-3 text-white/50 ml-1 group-hover:text-white transition-colors shrink-0" />
                  <select
                    id="compare-playback-speed-select"
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

                {/* Speed quick buttons */}
                <div className="hidden md:flex items-center bg-[#0d0d14] border border-[#272738] p-1 rounded-xl mono text-xs">
                  {([0.5, 1, 1.5, 2] as const).map((spd) => (
                    <button
                      key={spd}
                      onClick={() => handleSpeedChange(spd)}
                      className={`px-2 py-0.5 rounded-lg transition-colors ${
                        playbackSpeed === spd
                          ? 'bg-purple-600/40 text-purple-300 font-bold border border-purple-500/40'
                          : 'text-white/60 hover:text-white'
                      }`}
                      title={`Inspect compare motion at ${spd}x playback speed`}
                      aria-label={`${spd}x playback speed`}
                    >
                      {spd}x
                    </button>
                  ))}
                </div>

                {/* Loop toggle */}
                <button
                  onClick={() => setIsLooping(!isLooping)}
                  className={`p-2 rounded-xl border transition-colors ${
                    isLooping
                      ? 'bg-purple-600/20 border-purple-500/40 text-purple-300'
                      : 'bg-[#0d0d14] border-[#272738] text-white/50'
                  }`}
                  title={isLooping ? 'Looping active' : 'Looping disabled'}
                >
                  <Repeat className="w-4 h-4" />
                </button>

                {/* Swap A/B */}
                <button
                  onClick={handleSwap}
                  className="px-3 py-1.5 rounded-xl bg-[#0d0d14] hover:bg-white/10 border border-[#272738] text-white/80 hover:text-white text-xs mono flex items-center gap-1.5 transition-colors"
                  title="Swap Slot A and Slot B"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="hidden sm:inline">Swap A ↔ B</span>
                </button>
              </div>
            </div>
          </div>

          {/* VIEW MODE 1: Side-by-Side Dual Video Display */}
          {viewMode === 'side-by-side' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* SLOT A: Video 1 */}
              <div className="bg-[#181824] border border-purple-500/30 rounded-2xl p-4 space-y-3 shadow-xl">
                {/* Slot Selector & Badges */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="mono text-[11px] font-bold px-2 py-0.5 rounded-md bg-purple-600 text-white shadow-xs">
                      VIDEO A
                    </span>
                    <span className="mono text-xs text-purple-300 uppercase font-semibold">
                      {activeItemA.model}
                    </span>
                  </div>

                  {/* Selector Dropdown for Slot A */}
                  <select
                    value={activeItemA.id}
                    onChange={(e) => {
                      const found = allGenerations.find((g) => g.id === e.target.value);
                      if (found) onSelectVideoA(normalizeItem(found));
                    }}
                    className="bg-[#0d0d14] border border-[#272738] rounded-lg px-2 py-1 text-xs text-white/90 mono focus:outline-hidden max-w-[200px] truncate"
                    title="Choose generation for Slot A"
                  >
                    {allGenerations.map((g) => (
                      <option key={`a-${g.id}`} value={g.id}>
                        {g.prompt.substring(0, 38)}...
                      </option>
                    ))}
                  </select>
                </div>

                {/* Video Player Container A */}
                <div className="relative aspect-video bg-[#090910] rounded-xl overflow-hidden border border-[#272738] group">
                  <video
                    ref={videoRefA}
                    src={activeItemA.video_url || '/videos/festival-dance-9-16.mp4'}
                    onError={(e) => {
                      (e.target as HTMLVideoElement).src = '/videos/festival-dance-9-16.mp4';
                    }}
                    loop={isLooping}
                    muted={isMuted}
                    playsInline
                    className="w-full h-full object-cover object-center"
                    onClick={togglePlay}
                  />

                  {/* Corner Overlay info */}
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/70 backdrop-blur-md text-[10px] mono text-purple-300">
                    Ratio: {activeItemA.aspect_ratio || '9:16'}
                  </div>
                  <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/70 backdrop-blur-md text-[10px] mono text-white/70">
                    A: {activeItemA.duration || '5s'}
                  </div>
                </div>

                {/* Prompt Details A */}
                <div className="space-y-1.5 bg-[#0d0d14] p-3 rounded-xl border border-white/5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] mono text-purple-400 font-semibold uppercase">
                      Iteration Prompt A:
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleCopyPrompt('A', activeItemA.prompt)}
                        className="p-1 text-white/50 hover:text-white transition-colors"
                        title="Copy Prompt A"
                      >
                        {copiedSlot === 'A' ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                      {onReusePrompt && (
                        <button
                          onClick={() =>
                            onReusePrompt(
                              activeItemA.prompt,
                              activeItemA.model,
                              activeItemA.aspect_ratio || '9:16'
                            )
                          }
                          className="text-[10px] mono text-purple-300 hover:text-purple-200 px-1.5 py-0.5 rounded bg-purple-600/20 border border-purple-500/30"
                          title="Reuse in Studio"
                        >
                          Reuse
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-white/90 leading-relaxed font-mono select-all">
                    "{activeItemA.prompt}"
                  </p>
                </div>
              </div>

              {/* SLOT B: Video 2 */}
              <div className="bg-[#181824] border border-cyan-500/30 rounded-2xl p-4 space-y-3 shadow-xl">
                {/* Slot Selector & Badges */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="mono text-[11px] font-bold px-2 py-0.5 rounded-md bg-cyan-600 text-white shadow-xs">
                      VIDEO B
                    </span>
                    <span className="mono text-xs text-cyan-300 uppercase font-semibold">
                      {activeItemB.model}
                    </span>
                  </div>

                  {/* Selector Dropdown for Slot B */}
                  <select
                    value={activeItemB.id}
                    onChange={(e) => {
                      const found = allGenerations.find((g) => g.id === e.target.value);
                      if (found) onSelectVideoB(normalizeItem(found));
                    }}
                    className="bg-[#0d0d14] border border-[#272738] rounded-lg px-2 py-1 text-xs text-white/90 mono focus:outline-hidden max-w-[200px] truncate"
                    title="Choose generation for Slot B"
                  >
                    {allGenerations.map((g) => (
                      <option key={`b-${g.id}`} value={g.id}>
                        {g.prompt.substring(0, 38)}...
                      </option>
                    ))}
                  </select>
                </div>

                {/* Video Player Container B */}
                <div className="relative aspect-video bg-[#090910] rounded-xl overflow-hidden border border-[#272738] group">
                  <video
                    ref={videoRefB}
                    src={activeItemB.video_url || '/videos/sample-2.mp4'}
                    onError={(e) => {
                      (e.target as HTMLVideoElement).src = '/videos/sample-2.mp4';
                    }}
                    loop={isLooping}
                    muted={isMuted}
                    playsInline
                    className="w-full h-full object-cover object-center"
                    onClick={togglePlay}
                  />

                  {/* Corner Overlay info */}
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/70 backdrop-blur-md text-[10px] mono text-cyan-300">
                    Ratio: {activeItemB.aspect_ratio || '9:16'}
                  </div>
                  <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/70 backdrop-blur-md text-[10px] mono text-white/70">
                    B: {activeItemB.duration || '5s'}
                  </div>
                </div>

                {/* Prompt Details B */}
                <div className="space-y-1.5 bg-[#0d0d14] p-3 rounded-xl border border-white/5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] mono text-cyan-400 font-semibold uppercase">
                      Iteration Prompt B:
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleCopyPrompt('B', activeItemB.prompt)}
                        className="p-1 text-white/50 hover:text-white transition-colors"
                        title="Copy Prompt B"
                      >
                        {copiedSlot === 'B' ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                      {onReusePrompt && (
                        <button
                          onClick={() =>
                            onReusePrompt(
                              activeItemB.prompt,
                              activeItemB.model,
                              activeItemB.aspect_ratio || '9:16'
                            )
                          }
                          className="text-[10px] mono text-cyan-300 hover:text-cyan-200 px-1.5 py-0.5 rounded bg-cyan-600/20 border border-cyan-500/30"
                          title="Reuse in Studio"
                        >
                          Reuse
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-white/90 leading-relaxed font-mono select-all">
                    "{activeItemB.prompt}"
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* VIEW MODE 2: Split Wipe Slider Overlay Mode */}
          {viewMode === 'split-wipe' && (
            <div className="bg-[#181824] border border-[#272738] rounded-2xl p-4 space-y-4 shadow-xl">
              <div className="flex items-center justify-between text-xs mono text-white/70">
                <div className="flex items-center gap-2">
                  <span className="text-purple-400 font-semibold">◀ Video A: {activeItemA.model}</span>
                  <span className="text-white/20">|</span>
                  <span className="text-cyan-400 font-semibold">Video B: {activeItemB.model} ▶</span>
                </div>
                <div className="text-[11px] text-white/40">
                  Drag the center divider left/right to reveal differences directly
                </div>
              </div>

              <div
                id="wipe-compare-container"
                className="relative aspect-video max-h-[500px] mx-auto bg-[#090910] rounded-xl overflow-hidden select-none border border-[#272738]"
              >
                {/* Bottom Video: A */}
                <video
                  ref={videoRefA}
                  src={activeItemA.video_url || '/videos/festival-dance-9-16.mp4'}
                  onError={(e) => {
                    (e.target as HTMLVideoElement).src = '/videos/festival-dance-9-16.mp4';
                  }}
                  loop={isLooping}
                  muted={isMuted}
                  playsInline
                  className="absolute inset-0 w-full h-full object-cover object-center"
                />

                {/* Top Clipped Video: B */}
                <div
                  className="absolute inset-0 overflow-hidden"
                  style={{
                    clipPath: `inset(0 0 0 ${wipePercent}%)`,
                  }}
                >
                  <video
                    ref={videoRefB}
                    src={activeItemB.video_url || '/videos/sample-2.mp4'}
                    onError={(e) => {
                      (e.target as HTMLVideoElement).src = '/videos/sample-2.mp4';
                    }}
                    loop={isLooping}
                    muted={isMuted}
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover object-center"
                  />
                </div>

                {/* Draggable Divider Handle */}
                <div
                  className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize z-20 shadow-[0_0_12px_rgba(255,255,255,0.8)]"
                  style={{ left: `${wipePercent}%` }}
                  onMouseDown={() => setIsDraggingWipe(true)}
                >
                  <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-black/80 border-2 border-white flex items-center justify-center text-white shadow-xl cursor-ew-resize">
                    <Sliders className="w-3.5 h-3.5 rotate-90 text-purple-300" />
                  </div>
                </div>

                {/* Labels on screen */}
                <div className="absolute bottom-3 left-3 px-2 py-0.5 rounded bg-black/75 backdrop-blur-md text-[10px] mono text-purple-300 z-10 pointer-events-none">
                  [A] {activeItemA.prompt.substring(0, 30)}...
                </div>
                <div className="absolute bottom-3 right-3 px-2 py-0.5 rounded bg-black/75 backdrop-blur-md text-[10px] mono text-cyan-300 z-10 pointer-events-none">
                  [B] {activeItemB.prompt.substring(0, 30)}...
                </div>
              </div>
            </div>
          )}

          {/* Iteration Prompt Differences (Diff Highlights) */}
          <div className="bg-[#101018] border border-[#272738] rounded-2xl p-4 sm:p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <h4 className="text-xs font-bold text-white uppercase mono tracking-wider">
                Prompt Iteration Diff & Keyword Evolution
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs mono">
              {/* Words unique to B (Additions) */}
              <div className="bg-[#181824] p-3 rounded-xl border border-emerald-500/30 space-y-1.5">
                <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1.5">
                  <span>+ Added in Iteration B ({additionsInB.length} words):</span>
                </span>
                {additionsInB.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {additionsInB.map((word, i) => (
                      <span
                        key={i}
                        className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[11px] border border-emerald-500/30"
                      >
                        +{word}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-white/40">No unique additions found.</p>
                )}
              </div>

              {/* Words unique to A (Removed) */}
              <div className="bg-[#181824] p-3 rounded-xl border border-rose-500/30 space-y-1.5">
                <span className="text-[11px] font-semibold text-rose-400 flex items-center gap-1.5">
                  <span>- Replaced from Iteration A ({removalsFromA.length} words):</span>
                </span>
                {removalsFromA.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {removalsFromA.map((word, i) => (
                      <span
                        key={i}
                        className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[11px] border border-rose-500/30 line-through"
                      >
                        -{word}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-white/40">No removals detected.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-[#272738] bg-[#0c0c14] flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs mono text-white/50">
            <span>Synchronized Comparison Engine</span>
            <span>•</span>
            <span className="text-purple-400">NexVerze Studio</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs mono transition-colors"
          >
            Close Comparison
          </button>
        </div>
      </div>
    </div>
  );
};
