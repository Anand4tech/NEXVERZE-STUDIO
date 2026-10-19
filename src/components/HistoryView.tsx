import React, { useState, useEffect } from 'react';
import { StudioGeneration, fetchUserGenerations, deleteStudioGeneration } from '../lib/supabase';
import { QualityLockPlayer } from './QualityLockPlayer';
import { VideoCompareModal, CompareVideoItem } from './VideoCompareModal';
import { SAMPLE_VIDEOS, VideoSample } from '../lib/videoSamples';
import { Play, Download, Copy, Check, Trash2, Film, RefreshCw, AlertCircle, Sparkles, ArrowRight, GitCompare, CheckSquare, Square } from 'lucide-react';

import { CreditConsumptionChart } from './CreditConsumptionChart';

interface HistoryViewProps {
  userEmail?: string;
  userId?: string;
  userCredits?: number;
  onSelectPrompt?: (prompt: string, model: 'luma' | 'veo3' | 'kling', ratio: '9:16' | '16:9' | '1:1') => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  userEmail,
  userId,
  userCredits = 0,
  onSelectPrompt,
}) => {
  const [generations, setGenerations] = useState<StudioGeneration[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeVideo, setActiveVideo] = useState<StudioGeneration | null>(null);
  const [modelFilter, setModelFilter] = useState<'all' | 'ltx' | 'luma' | 'wan' | 'hunyuan' | 'kling' | 'veo'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Compare Iterations States
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);
  const [compareVideoA, setCompareVideoA] = useState<CompareVideoItem | null>(null);
  const [compareVideoB, setCompareVideoB] = useState<CompareVideoItem | null>(null);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const data = await fetchUserGenerations(userEmail);
      setGenerations(data);
      if (data.length > 0 && !activeVideo) {
        setActiveVideo(data[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [userEmail, userId]);

  const copyPrompt = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this generation from your history?')) return;
    setDeletingId(id);
    try {
      await deleteStudioGeneration(id);
      setGenerations((prev) => prev.filter((item) => item.id !== id));
      if (activeVideo?.id === id) {
        setActiveVideo(null);
      }
      setSelectedForCompare((prev) => prev.filter((itemId) => itemId !== id));
    } catch (err) {
      console.error('Delete generation error:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const filteredGenerations = generations.filter((g) => {
    if (modelFilter === 'all') return true;
    if (modelFilter === 'veo') return g.model === 'veo' || g.model === 'veo3';
    return g.model === modelFilter;
  });

  // Toggle video selection for comparison
  const toggleCompareSelect = (id: string) => {
    setSelectedForCompare((prev) => {
      if (prev.includes(id)) {
        return prev.filter((itemId) => itemId !== id);
      }
      if (prev.length >= 2) {
        // Replace second selection
        return [prev[0], id];
      }
      return [...prev, id];
    });
  };

  // Convert generation to CompareVideoItem
  const toCompareItem = (item: StudioGeneration | VideoSample): CompareVideoItem => ({
    id: item.id,
    prompt: item.prompt,
    model: item.model,
    aspect_ratio: item.aspect_ratio || '9:16',
    duration: item.duration || '5s',
    video_url: item.video_url,
    created_at: item.created_at,
  });

  // Combined pool of available generations & sample videos for comparing
  const comparisonPool: (StudioGeneration | VideoSample)[] =
    generations.length > 0 ? generations : SAMPLE_VIDEOS;

  // Open Compare Modal
  const handleOpenCompare = () => {
    let itemA: CompareVideoItem | null = null;
    let itemB: CompareVideoItem | null = null;

    if (selectedForCompare.length === 2) {
      const gA = comparisonPool.find((g) => g.id === selectedForCompare[0]);
      const gB = comparisonPool.find((g) => g.id === selectedForCompare[1]);
      if (gA) itemA = toCompareItem(gA);
      if (gB) itemB = toCompareItem(gB);
    } else if (selectedForCompare.length === 1) {
      const gA = comparisonPool.find((g) => g.id === selectedForCompare[0]);
      if (gA) itemA = toCompareItem(gA);
      // Pick another distinct video from pool
      const gB = comparisonPool.find((g) => g.id !== selectedForCompare[0]) || SAMPLE_VIDEOS[1];
      if (gB) itemB = toCompareItem(gB);
    } else {
      // Pick top 2 from pool or fallback
      if (comparisonPool.length >= 2) {
        itemA = toCompareItem(comparisonPool[0]);
        itemB = toCompareItem(comparisonPool[1]);
      } else if (comparisonPool.length === 1) {
        itemA = toCompareItem(comparisonPool[0]);
        itemB = toCompareItem(SAMPLE_VIDEOS[1]);
      } else {
        itemA = toCompareItem(SAMPLE_VIDEOS[0]);
        itemB = toCompareItem(SAMPLE_VIDEOS[1]);
      }
    }

    setCompareVideoA(itemA);
    setCompareVideoB(itemB);
    setIsCompareModalOpen(true);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Title & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#27272a]">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Film className="w-6 h-6 text-purple-400" />
            <span>Generation History</span>
          </h2>
          <p className="text-xs text-white/50 mt-1">
            Browse outputs, copy prompts, download videos, and reuse prompts in the main generator ({generations.length} total)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Synchronized Compare Button */}
          <button
            onClick={handleOpenCompare}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold mono flex items-center gap-2 transition-all ${
              selectedForCompare.length === 2
                ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg ring-2 ring-purple-400/50'
                : 'bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30'
            }`}
            title="Select two generated videos to compare them side-by-side with synchronized playback"
          >
            <GitCompare className="w-4 h-4 text-purple-400" />
            <span>Compare</span>
            {selectedForCompare.length > 0 ? (
              <span className="bg-purple-500/40 text-white px-1.5 py-0.2 rounded-full text-[10px]">
                {selectedForCompare.length}/2
              </span>
            ) : (
              <span className="text-[10px] text-purple-400/80 hidden sm:inline">(Dual Sync)</span>
            )}
          </button>

          {/* Filter tabs */}
          <div className="flex flex-wrap items-center gap-1 bg-[#18181b] border border-[#27272a] p-1 rounded-xl mono text-xs">
            {(['all', 'ltx', 'luma', 'wan', 'hunyuan', 'kling', 'veo'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setModelFilter(m)}
                className={`px-2.5 py-1 rounded-lg uppercase transition-all ${
                  modelFilter === m
                    ? 'bg-purple-600 text-white font-semibold'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                {m === 'veo' ? 'Veo' : m === 'wan' ? 'Wan 2.1' : m === 'hunyuan' ? 'Hunyuan' : m === 'ltx' ? 'LTX' : m}
              </button>
            ))}
          </div>

          <button
            onClick={loadHistory}
            className="p-2 bg-[#18181b] hover:bg-[#222228] border border-[#27272a] rounded-xl text-white/70 hover:text-white transition-colors"
            title="Refresh History"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 30-Day Credit Consumption Analytics Chart */}
      <CreditConsumptionChart
        generations={generations}
        userCredits={userCredits}
      />

      {/* Floating Selection Banner when user has selected 1 or 2 clips */}
      {selectedForCompare.length > 0 && (
        <div className="bg-purple-950/40 border border-purple-500/40 rounded-2xl p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3 shadow-xl backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-600/30 border border-purple-500/40 flex items-center justify-center text-purple-300">
              <GitCompare className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-2">
                <span>{selectedForCompare.length} of 2 videos selected for comparison</span>
                {selectedForCompare.length === 2 && (
                  <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/30">
                    Ready to compare
                  </span>
                )}
              </div>
              <p className="text-[11px] text-white/50">
                {selectedForCompare.length === 1
                  ? 'Select one more video from the grid below, or click Compare to auto-pair.'
                  : 'Both videos selected! Launch side-by-side synchronized comparison to inspect prompt evolution.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedForCompare([])}
              className="px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/10 text-white/60 hover:text-white text-xs mono transition-colors"
            >
              Clear
            </button>
            <button
              onClick={handleOpenCompare}
              className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs mono flex items-center gap-1.5 shadow-lg transition-all"
            >
              <GitCompare className="w-3.5 h-3.5" />
              <span>Launch Side-by-Side Compare</span>
            </button>
          </div>
        </div>
      )}

      {/* Featured Video Player if active */}
      {activeVideo && (
        <div className="bg-[#18181b] border border-[#27272a] rounded-3xl p-6 sm:p-8">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex-1 min-w-0 pr-2">
              <span className="mono text-[11px] text-purple-400 uppercase font-semibold">
                Active Selection
              </span>
              <h3 className="text-lg font-bold text-white mt-0.5 truncate">
                "{activeVideo.prompt}"
              </h3>
            </div>

            <div className="flex items-center gap-2">
              {/* Compare this clip button */}
              <button
                onClick={() => {
                  toggleCompareSelect(activeVideo.id);
                  if (!selectedForCompare.includes(activeVideo.id) && selectedForCompare.length >= 1) {
                    handleOpenCompare();
                  }
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors mono ${
                  selectedForCompare.includes(activeVideo.id)
                    ? 'bg-purple-600 text-white'
                    : 'bg-white/[0.04] hover:bg-white/[0.08] text-white/70 hover:text-white border border-white/10'
                }`}
                title="Select active video for comparison"
              >
                <GitCompare className="w-3.5 h-3.5 text-purple-400" />
                <span>{selectedForCompare.includes(activeVideo.id) ? 'Selected for Compare' : 'Add to Compare'}</span>
              </button>

              {/* Copy Prompt & Reuse Button */}
              <button
                onClick={() => {
                  copyPrompt(activeVideo.id, activeVideo.prompt);
                  onSelectPrompt?.(activeVideo.prompt, (activeVideo.model === 'veo' ? 'veo3' : activeVideo.model) as any, (activeVideo.aspect_ratio || '9:16') as any);
                }}
                className="px-3 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors mono"
                title="Copy and Reuse Prompt in Studio Generator"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>Reuse Prompt</span>
              </button>

              <button
                onClick={() => copyPrompt(activeVideo.id, activeVideo.prompt)}
                className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-white/70 hover:text-white transition-colors"
                title="Copy Prompt to Clipboard"
              >
                {copiedId === activeVideo.id ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>

              <span className="mono text-xs px-2.5 py-1.5 rounded-lg bg-purple-500/10 text-purple-300 border border-purple-500/20 uppercase font-bold">
                {activeVideo.model}
              </span>
            </div>
          </div>

          <QualityLockPlayer
            videoUrl={activeVideo.video_url}
            aspectRatio={activeVideo.aspect_ratio || '9:16'}
            modelName={activeVideo.model.toUpperCase()}
            duration={activeVideo.duration || '5s'}
            timestamp={activeVideo.created_at}
            prompt={activeVideo.prompt}
          />
        </div>
      )}

      {/* Grid of history cards with Compare, Play, Download, Copy Prompt, and Delete */}
      {loading ? (
        <div className="py-16 text-center text-white/50 mono text-xs">
          Loading your video history from Supabase...
        </div>
      ) : filteredGenerations.length === 0 ? (
        <div className="bg-[#18181b]/50 border border-[#27272a] rounded-3xl p-12 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-purple-600/10 text-purple-400 mx-auto flex items-center justify-center">
            <Film className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h4 className="text-base font-bold text-white">No Generations Found</h4>
            <p className="text-xs text-white/50 max-w-sm mx-auto">
              You haven't generated any videos with this filter yet. You can still test side-by-side comparison with our creative sample library!
            </p>
          </div>
          <button
            onClick={handleOpenCompare}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold mono inline-flex items-center gap-2 shadow-lg transition-all"
          >
            <GitCompare className="w-4 h-4" />
            <span>Try Compare with Creative Samples</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredGenerations.map((item) => {
            const isSelected = selectedForCompare.includes(item.id);
            return (
              <div
                key={item.id}
                className={`bg-[#18181b] border rounded-2xl overflow-hidden p-4 space-y-3 transition-all card-hover ${
                  isSelected
                    ? 'border-purple-400 ring-2 ring-purple-500/50 shadow-purple-900/30'
                    : activeVideo?.id === item.id
                    ? 'border-purple-500 ring-1 ring-purple-500/50'
                    : 'border-[#27272a]'
                }`}
              >
                {/* Video Thumbnail */}
                <div
                  onClick={() => setActiveVideo(item)}
                  className="relative aspect-video bg-[#0f0f17] rounded-xl overflow-hidden cursor-pointer group"
                >
                  <video
                    src={item.video_url || '/videos/festival-dance-9-16.mp4'}
                    onError={(e) => {
                      (e.target as HTMLVideoElement).src = '/videos/festival-dance-9-16.mp4';
                    }}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                    muted
                    playsInline
                  />
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-purple-600/90 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <Play className="w-4 h-4 fill-white translate-x-0.5" />
                    </div>
                  </div>
                  <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/70 backdrop-blur-md rounded text-[10px] mono text-purple-300 font-bold uppercase">
                    {item.model}
                  </div>
                  <div className="absolute top-2 right-2 px-2 py-0.5 bg-black/70 backdrop-blur-md rounded text-[10px] mono text-white/70">
                    {item.aspect_ratio || '9:16'}
                  </div>

                  {/* Compare Selection Checkbox Badge */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleCompareSelect(item.id);
                    }}
                    className={`absolute bottom-2 right-2 px-2 py-1 rounded-md text-[10px] mono font-bold flex items-center gap-1 transition-all ${
                      isSelected
                        ? 'bg-purple-600 text-white shadow-md ring-1 ring-white/50'
                        : 'bg-black/75 hover:bg-purple-900/80 text-white/80 hover:text-white border border-white/20'
                    }`}
                    title={isSelected ? 'Remove from compare' : 'Select for side-by-side comparison'}
                  >
                    <GitCompare className="w-3 h-3 text-purple-300" />
                    <span>{isSelected ? 'Selected' : 'Compare'}</span>
                  </button>
                </div>

                {/* Prompt with dedicated 'Copy Prompt' & 'Reuse' icon buttons */}
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2 bg-[#0f0f17] p-2.5 rounded-xl border border-white/[0.04]">
                    <p className="text-xs text-white/90 line-clamp-2 leading-relaxed flex-1 select-all font-mono text-[11px]">
                      "{item.prompt}"
                    </p>

                    <div className="flex items-center gap-1 shrink-0 ml-1">
                      {/* Copy Prompt Icon Button */}
                      <button
                        onClick={() => copyPrompt(item.id, item.prompt)}
                        className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.1] text-white/70 hover:text-white transition-colors"
                        title="Copy Prompt"
                      >
                        {copiedId === item.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>

                      {/* Quick Reuse Icon Button */}
                      <button
                        onClick={() => {
                          copyPrompt(item.id, item.prompt);
                          onSelectPrompt?.(
                            item.prompt,
                            (item.model === 'veo' ? 'veo3' : item.model) as any,
                            (item.aspect_ratio || '9:16') as any
                          );
                        }}
                        className="p-1.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 transition-colors flex items-center gap-1 text-[10px] mono"
                        title="Reuse Prompt in Generator"
                      >
                        <Sparkles className="w-3 h-3 text-purple-400" />
                        <span className="hidden sm:inline">Reuse</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] mono text-white/40 px-1">
                    <span>{new Date(item.created_at).toLocaleDateString()}</span>
                    <span className="text-purple-400 font-medium">-{item.credits_used}cr</span>
                  </div>
                </div>

                {/* Actions Footer: Compare Toggle, Play, Download, Delete */}
                <div className="flex items-center gap-2 pt-2 border-t border-[#27272a]">
                  <button
                    onClick={() => toggleCompareSelect(item.id)}
                    className={`py-1.5 px-2.5 rounded-lg text-xs font-semibold mono flex items-center gap-1 transition-colors ${
                      isSelected
                        ? 'bg-purple-600 text-white'
                        : 'bg-white/[0.04] hover:bg-white/[0.08] text-purple-300 border border-purple-500/20'
                    }`}
                    title="Toggle for comparison"
                  >
                    <GitCompare className="w-3 h-3" />
                    <span>{isSelected ? '✓ In Compare' : '+ Compare'}</span>
                  </button>

                  <button
                    onClick={() => setActiveVideo(item)}
                    className="flex-1 py-1.5 px-3 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Play</span>
                  </button>

                  <a
                    href={item.video_url}
                    download={`nexverze-${item.id}.mp4`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-white/70 hover:text-white transition-colors"
                    title="Download MP4"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </a>

                  <button
                    onClick={() => handleDelete(item.id)}
                    disabled={deletingId === item.id}
                    className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-red-500/20 text-white/40 hover:text-red-400 transition-colors"
                    title="Delete Video"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Side-by-Side Video & Prompt Comparison Modal */}
      <VideoCompareModal
        isOpen={isCompareModalOpen}
        onClose={() => setIsCompareModalOpen(false)}
        videoA={compareVideoA}
        videoB={compareVideoB}
        allGenerations={comparisonPool}
        onSelectVideoA={(item) => setCompareVideoA(item)}
        onSelectVideoB={(item) => setCompareVideoB(item)}
        onReusePrompt={(promptText, modelKey, ratio) => {
          setIsCompareModalOpen(false);
          onSelectPrompt?.(
            promptText,
            (modelKey === 'veo' ? 'veo3' : modelKey) as any,
            (ratio || '9:16') as any
          );
        }}
      />
    </div>
  );
};

