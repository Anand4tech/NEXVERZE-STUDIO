import React, { useState, useEffect } from 'react';
import { StudioGeneration, StudioUser, fetchUserGenerations, deleteStudioGeneration } from '../lib/supabase';
import { QualityLockPlayer } from './QualityLockPlayer';
import { VideoCompareModal, CompareVideoItem } from './VideoCompareModal';
import { SAMPLE_VIDEOS, VideoSample } from '../lib/videoSamples';
import {
  Play,
  Download,
  Copy,
  Check,
  Trash2,
  Film,
  RefreshCw,
  AlertCircle,
  Sparkles,
  ArrowRight,
  GitCompare,
  CheckSquare,
  Square,
  Heart,
  Search,
  ExternalLink,
} from 'lucide-react';

import { CreditConsumptionChart } from './CreditConsumptionChart';
import {
  FavoriteCreation,
  getLocalFavorites,
  subscribeFavorites,
  removeFavoriteCreation,
  syncUserFavoritesFromCloud,
} from '../lib/favoritesStorage';

interface HistoryViewProps {
  userEmail?: string;
  userId?: string;
  userCredits?: number;
  user?: StudioUser | null;
  isFreeUser?: boolean;
  onCreditsUpdated?: (updatedUser: StudioUser) => void;
  onOpenPlans?: () => void;
  onSelectPrompt?: (prompt: string, model: 'luma' | 'veo3' | 'kling', ratio: '9:16' | '16:9' | '1:1') => void;
  onNavigateToGallery?: () => void;
  initialTab?: 'generations' | 'favorites';
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  userEmail,
  userId,
  userCredits = 0,
  user,
  isFreeUser = false,
  onCreditsUpdated,
  onOpenPlans,
  onSelectPrompt,
  onNavigateToGallery,
  initialTab = 'generations',
}) => {
  // Top Primary Tab Switcher
  const [activeTab, setActiveTab] = useState<'generations' | 'favorites'>(initialTab);

  // Generations State
  const [generations, setGenerations] = useState<StudioGeneration[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeVideo, setActiveVideo] = useState<StudioGeneration | null>(null);
  const [modelFilter, setModelFilter] = useState<'all' | 'ltx' | 'luma' | 'wan' | 'hunyuan' | 'kling' | 'veo'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Favorites State
  const [favorites, setFavorites] = useState<FavoriteCreation[]>(() => getLocalFavorites());
  const [favoritesFormatFilter, setFavoritesFormatFilter] = useState<'all' | '9:16' | '16:9' | '1:1'>('all');
  const [favoritesSearch, setFavoritesSearch] = useState<string>('');
  const [activeFavoriteVideo, setActiveFavoriteVideo] = useState<FavoriteCreation | null>(null);
  const [removingFavId, setRemovingFavId] = useState<string | null>(null);

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

  // Subscribe to favorites updates (from showcase card hearts or other tabs)
  useEffect(() => {
    return subscribeFavorites((items) => {
      setFavorites(items);
      // Auto-set active favorite if none selected yet
      if (items.length > 0 && !activeFavoriteVideo) {
        setActiveFavoriteVideo(items[0]);
      }
    });
  }, []);

  // Sync cloud favorites on mount when userEmail changes
  useEffect(() => {
    if (userEmail) {
      syncUserFavoritesFromCloud(userEmail).then((items) => {
        setFavorites(items);
      });
    }
  }, [userEmail]);

  const copyPrompt = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async (id: string) => {
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

  const handleRemoveFavorite = async (videoId: string) => {
    setRemovingFavId(videoId);
    try {
      await removeFavoriteCreation(videoId, userEmail);
      if (activeFavoriteVideo?.videoId === videoId || activeFavoriteVideo?.id === videoId) {
        setActiveFavoriteVideo(null);
      }
      setSelectedForCompare((prev) => prev.filter((id) => id !== videoId));
    } finally {
      setRemovingFavId(null);
    }
  };

  const filteredGenerations = generations.filter((g) => {
    if (modelFilter === 'all') return true;
    if (modelFilter === 'veo') return g.model === 'veo' || g.model === 'veo3';
    return g.model === modelFilter;
  });

  const filteredFavorites = favorites.filter((fav) => {
    // Format filter
    if (favoritesFormatFilter !== 'all' && fav.aspect_ratio !== favoritesFormatFilter) {
      return false;
    }
    // Search query
    if (favoritesSearch.trim()) {
      const q = favoritesSearch.toLowerCase().trim();
      const matchTitle = (fav.title || '').toLowerCase().includes(q);
      const matchPrompt = (fav.prompt || '').toLowerCase().includes(q);
      const matchModel = (fav.model || '').toLowerCase().includes(q);
      return matchTitle || matchPrompt || matchModel;
    }
    return true;
  });

  // Toggle video selection for comparison
  const toggleCompareSelect = (id: string) => {
    setSelectedForCompare((prev) => {
      if (prev.includes(id)) {
        return prev.filter((itemId) => itemId !== id);
      }
      if (prev.length >= 2) {
        return [prev[0], id];
      }
      return [...prev, id];
    });
  };

  // Convert item to CompareVideoItem
  const toCompareItem = (item: StudioGeneration | VideoSample | FavoriteCreation): CompareVideoItem => ({
    id: (item as any).videoId || item.id,
    prompt: item.prompt,
    model: item.model,
    aspect_ratio: item.aspect_ratio || '9:16',
    duration: item.duration || '5s',
    video_url: item.video_url,
    created_at: (item as any).created_at || (item as any).favorited_at || new Date().toISOString(),
  });

  // Combined pool of available items for comparing (Generations + Favorites + Sample library)
  const comparisonPool: (StudioGeneration | VideoSample | FavoriteCreation)[] = [
    ...generations,
    ...favorites,
    ...SAMPLE_VIDEOS,
  ];

  // Open Compare Modal
  const handleOpenCompare = () => {
    let itemA: CompareVideoItem | null = null;
    let itemB: CompareVideoItem | null = null;

    if (selectedForCompare.length === 2) {
      const gA = comparisonPool.find((g) => g.id === selectedForCompare[0] || (g as any).videoId === selectedForCompare[0]);
      const gB = comparisonPool.find((g) => g.id === selectedForCompare[1] || (g as any).videoId === selectedForCompare[1]);
      if (gA) itemA = toCompareItem(gA);
      if (gB) itemB = toCompareItem(gB);
    } else if (selectedForCompare.length === 1) {
      const gA = comparisonPool.find((g) => g.id === selectedForCompare[0] || (g as any).videoId === selectedForCompare[0]);
      if (gA) itemA = toCompareItem(gA);
      const gB = comparisonPool.find((g) => g.id !== selectedForCompare[0] && (g as any).videoId !== selectedForCompare[0]) || SAMPLE_VIDEOS[1];
      if (gB) itemB = toCompareItem(gB);
    } else if (activeTab === 'favorites' && favorites.length >= 2) {
      itemA = toCompareItem(favorites[0]);
      itemB = toCompareItem(favorites[1]);
    } else if (comparisonPool.length >= 2) {
      itemA = toCompareItem(comparisonPool[0]);
      itemB = toCompareItem(comparisonPool[1]);
    } else {
      itemA = toCompareItem(SAMPLE_VIDEOS[0]);
      itemB = toCompareItem(SAMPLE_VIDEOS[1]);
    }

    setCompareVideoA(itemA);
    setCompareVideoB(itemB);
    setIsCompareModalOpen(true);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* ========================================================================= */}
      {/* TOP PRIMARY TABS: MY GENERATIONS vs FAVORITES                             */}
      {/* ========================================================================= */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#27272a] pb-4">
        <div className="flex items-center gap-2">
          {/* Tab 1: My Generations */}
          <button
            type="button"
            onClick={() => setActiveTab('generations')}
            className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold mono flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'generations'
                ? 'bg-purple-600 text-white shadow-xl shadow-purple-950/50 ring-2 ring-purple-400/50'
                : 'bg-[#141224] hover:bg-[#1f1b36] text-white/70 hover:text-white border border-[#27253d]'
            }`}
          >
            <Film className="w-4 h-4 text-purple-300" />
            <span>My Generations</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                activeTab === 'generations'
                  ? 'bg-white/20 text-white'
                  : 'bg-black/40 text-purple-300'
              }`}
            >
              {generations.length}
            </span>
          </button>

          {/* Tab 2: Favorites */}
          <button
            type="button"
            onClick={() => setActiveTab('favorites')}
            className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold mono flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'favorites'
                ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-xl shadow-rose-950/50 ring-2 ring-rose-400/50'
                : 'bg-[#141224] hover:bg-[#1f1b36] text-white/70 hover:text-white border border-[#27253d]'
            }`}
          >
            <Heart
              className={`w-4 h-4 ${
                favorites.length > 0 ? 'fill-rose-400 text-rose-400' : 'text-rose-400'
              }`}
            />
            <span>Favorites</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                favorites.length > 0
                  ? 'bg-rose-500/25 text-rose-200 border border-rose-500/40 ring-1 ring-rose-400/30'
                  : 'bg-black/40 text-white/50'
              }`}
            >
              {favorites.length}
            </span>
          </button>
        </div>

        {/* Global Synchronized Compare Button */}
        <button
          onClick={handleOpenCompare}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold mono flex items-center gap-2 transition-all cursor-pointer ${
            selectedForCompare.length === 2
              ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg ring-2 ring-purple-400/50'
              : 'bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30'
          }`}
          title="Select two generated or favorited videos to compare side-by-side"
        >
          <GitCompare className="w-4 h-4 text-purple-400" />
          <span>Side-by-Side Compare</span>
          {selectedForCompare.length > 0 ? (
            <span className="bg-purple-500/40 text-white px-1.5 py-0.5 rounded-full text-[10px]">
              {selectedForCompare.length}/2
            </span>
          ) : (
            <span className="text-[10px] text-purple-400/80 hidden sm:inline">(Dual Sync)</span>
          )}
        </button>
      </div>

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
                  ? 'Select one more video from the list below, or launch compare to auto-pair.'
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

      {/* ========================================================================= */}
      {/* VIEW A: GENERATIONS TAB                                                   */}
      {/* ========================================================================= */}
      {activeTab === 'generations' && (
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* Header & Model Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2.5">
                <Film className="w-5 h-5 text-purple-400" />
                <span>Video Generation History</span>
              </h2>
              <p className="text-xs text-white/50 mt-1">
                Browse outputs, copy prompts, download videos, and reuse prompts in the main generator ({generations.length} total)
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
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

                  <button
                    onClick={() => {
                      copyPrompt(activeVideo.id, activeVideo.prompt);
                      onSelectPrompt?.(
                        activeVideo.prompt,
                        (activeVideo.model === 'veo' ? 'veo3' : activeVideo.model) as any,
                        (activeVideo.aspect_ratio || '9:16') as any
                      );
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
                isFreeUser={isFreeUser}
                user={user}
                onCreditsUpdated={onCreditsUpdated}
                onOpenPlans={onOpenPlans}
                onRemix={() => {
                  onSelectPrompt?.(
                    activeVideo.prompt,
                    (activeVideo.model === 'veo' ? 'veo3' : activeVideo.model) as any,
                    (activeVideo.aspect_ratio || '9:16') as any
                  );
                }}
              />
            </div>
          )}

          {/* Grid of history cards */}
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

                    {/* Prompt */}
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2 bg-[#0f0f17] p-2.5 rounded-xl border border-white/[0.04]">
                        <p className="text-xs text-white/90 line-clamp-2 leading-relaxed flex-1 select-all font-mono text-[11px]">
                          "{item.prompt}"
                        </p>

                        <div className="flex items-center gap-1 shrink-0 ml-1">
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
                            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                            <span className="hidden sm:inline">Reuse</span>
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] mono text-white/40 px-1">
                        <span>{new Date(item.created_at).toLocaleDateString()}</span>
                        <span className="text-purple-400 font-medium">-{item.credits_used}cr</span>
                      </div>
                    </div>

                    {/* Actions Footer */}
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
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW B: FAVORITES TAB (Saved from Showcase Gallery)                       */}
      {/* ========================================================================= */}
      {activeTab === 'favorites' && (
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* Header & Format Filters */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-rose-500/20">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
                <Heart className="w-6 h-6 fill-rose-500 text-rose-500 animate-pulse" />
                <span>Favorite Creations</span>
                <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold mono">
                  {favorites.length} saved
                </span>
              </h2>
              <p className="text-xs text-white/50 mt-1 max-w-xl">
                Your handpicked creations from the Showcase Gallery. Click <span className="text-rose-300 font-bold">Remix</span> to immediately clone prompts and camera models into the Studio, or download high-definition master MP4s.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Search box */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                  type="text"
                  value={favoritesSearch}
                  onChange={(e) => setFavoritesSearch(e.target.value)}
                  placeholder="Search favorites..."
                  className="pl-8 pr-3 py-1.5 rounded-xl bg-[#151226] border border-[#2e2a4a] text-xs text-white placeholder-white/40 focus:outline-none focus:border-rose-400"
                />
              </div>

              {/* Format Filter Pills */}
              <div className="flex items-center gap-1 bg-[#151226] border border-[#2e2a4a] p-1 rounded-xl mono text-xs">
                {(['all', '9:16', '16:9', '1:1'] as const).map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => setFavoritesFormatFilter(fmt)}
                    className={`px-2.5 py-1 rounded-lg uppercase transition-all ${
                      favoritesFormatFilter === fmt
                        ? 'bg-rose-600 text-white font-bold shadow-md shadow-rose-950/40'
                        : 'text-white/60 hover:text-white'
                    }`}
                  >
                    {fmt}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Active Featured Favorite Preview */}
          {activeFavoriteVideo && (
            <div className="bg-[#151226] border border-rose-500/30 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex-1 min-w-0 pr-2">
                  <div className="flex items-center gap-2 text-[11px] mono text-rose-400 font-semibold">
                    <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                    <span>Featured Favorite Selection</span>
                  </div>
                  <h3 className="text-lg font-bold text-white mt-0.5 truncate">
                    {activeFavoriteVideo.title}
                  </h3>
                  <p className="text-xs text-white/70 italic font-serif mt-0.5 line-clamp-1">
                    "{activeFavoriteVideo.prompt}"
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {/* Compare Button */}
                  <button
                    onClick={() => {
                      toggleCompareSelect(activeFavoriteVideo.videoId || activeFavoriteVideo.id);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors mono ${
                      selectedForCompare.includes(activeFavoriteVideo.videoId || activeFavoriteVideo.id)
                        ? 'bg-purple-600 text-white'
                        : 'bg-white/[0.04] hover:bg-white/[0.08] text-white/70 hover:text-white border border-white/10'
                    }`}
                  >
                    <GitCompare className="w-3.5 h-3.5 text-purple-400" />
                    <span>
                      {selectedForCompare.includes(activeFavoriteVideo.videoId || activeFavoriteVideo.id)
                        ? 'In Compare'
                        : 'Add to Compare'}
                    </span>
                  </button>

                  {/* Remix in Studio Button */}
                  <button
                    onClick={() => {
                      copyPrompt(activeFavoriteVideo.id, activeFavoriteVideo.prompt);
                      onSelectPrompt?.(
                        activeFavoriteVideo.prompt,
                        (activeFavoriteVideo.model === 'veo' ? 'veo3' : activeFavoriteVideo.model) as any,
                        (activeFavoriteVideo.aspect_ratio || '9:16') as any
                      );
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-rose-950/40 mono transition-all"
                    title="Remix this favorite video in the Studio generator"
                  >
                    <Sparkles className="w-3.5 h-3.5 fill-white" />
                    <span>Remix in Studio</span>
                  </button>

                  {/* Remove / Unlike */}
                  <button
                    onClick={() => handleRemoveFavorite(activeFavoriteVideo.videoId || activeFavoriteVideo.id)}
                    className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-colors"
                    title="Remove from Favorites"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Player */}
              <QualityLockPlayer
                videoUrl={activeFavoriteVideo.video_url}
                aspectRatio={(activeFavoriteVideo.aspect_ratio as any) || '9:16'}
                modelName={activeFavoriteVideo.model.toUpperCase()}
                duration={activeFavoriteVideo.duration || '10s'}
                timestamp={activeFavoriteVideo.favorited_at}
                prompt={activeFavoriteVideo.prompt}
                isFreeUser={isFreeUser}
                user={user}
                onCreditsUpdated={onCreditsUpdated}
                onOpenPlans={onOpenPlans}
                onRemix={() => {
                  onSelectPrompt?.(
                    activeFavoriteVideo.prompt,
                    (activeFavoriteVideo.model === 'veo' ? 'veo3' : activeFavoriteVideo.model) as any,
                    (activeFavoriteVideo.aspect_ratio || '9:16') as any
                  );
                }}
              />
            </div>
          )}

          {/* Grid of Favorite Cards */}
          {filteredFavorites.length === 0 ? (
            <div className="bg-[#151226]/60 border border-dashed border-rose-500/30 rounded-3xl p-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-400/30 text-rose-400 mx-auto flex items-center justify-center shadow-lg">
                <Heart className="w-8 h-8 fill-rose-500/20 text-rose-400 animate-pulse" />
              </div>
              <div className="space-y-1">
                <h4 className="text-lg font-bold text-white">No Favorite Creations Yet</h4>
                <p className="text-xs text-white/50 max-w-md mx-auto">
                  Click the <span className="text-rose-400 font-bold">❤️ Like button</span> on any showcase video in the gallery or homepage to bookmark your favorite inspirations here for 1-click remixing.
                </p>
              </div>

              {onNavigateToGallery && (
                <button
                  type="button"
                  onClick={onNavigateToGallery}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-white text-xs font-bold mono inline-flex items-center gap-2 shadow-xl shadow-rose-950/40 transition-all cursor-pointer active:scale-95"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Explore Showcase Gallery</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredFavorites.map((fav) => {
                const favId = fav.videoId || fav.id;
                const isSelected = selectedForCompare.includes(favId);
                const isActive = activeFavoriteVideo?.id === fav.id || activeFavoriteVideo?.videoId === favId;

                return (
                  <div
                    key={favId}
                    className={`bg-[#141224] border rounded-2xl overflow-hidden p-4 space-y-3 transition-all card-hover flex flex-col justify-between ${
                      isSelected
                        ? 'border-purple-400 ring-2 ring-purple-500/50 shadow-purple-900/30'
                        : isActive
                        ? 'border-rose-400 ring-1 ring-rose-500/40 bg-[#191530]'
                        : 'border-[#27253d] hover:border-rose-500/40'
                    }`}
                  >
                    <div className="space-y-3">
                      {/* Video Player / Thumbnail Preview */}
                      <div
                        onClick={() => setActiveFavoriteVideo(fav)}
                        className="relative aspect-[9/16] sm:aspect-video bg-black/90 rounded-xl overflow-hidden cursor-pointer group"
                      >
                        <video
                          src={fav.video_url}
                          poster={fav.thumbnail_url || undefined}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          muted
                          playsInline
                          preload="metadata"
                        />
                        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                          <div className="w-10 h-10 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                            <Play className="w-4 h-4 fill-white translate-x-0.5" />
                          </div>
                        </div>

                        {/* Top Badges */}
                        <div className="absolute top-2 left-2 flex items-center gap-1">
                          <span className="px-2 py-0.5 bg-black/80 backdrop-blur-md rounded text-[10px] mono text-purple-300 font-bold uppercase">
                            {fav.model}
                          </span>
                          <span className="px-1.5 py-0.5 bg-black/80 backdrop-blur-md rounded text-[10px] mono text-white/80">
                            {fav.aspect_ratio}
                          </span>
                        </div>

                        {/* Unlike / Heart Button in corner */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveFavorite(favId);
                          }}
                          className="absolute top-2 right-2 p-1.5 rounded-full bg-rose-600/90 text-white shadow-md hover:bg-rose-700 transition-transform active:scale-90"
                          title="Remove from favorites"
                        >
                          <Heart className="w-3.5 h-3.5 fill-white text-white" />
                        </button>

                        {/* Compare checkbox in bottom right */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleCompareSelect(favId);
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

                      {/* Title & Prompt */}
                      <div className="space-y-1.5">
                        <h4 className="font-bold text-sm text-white line-clamp-1">
                          {fav.title}
                        </h4>
                        <div className="bg-[#0e0c1a] p-2.5 rounded-xl border border-white/5">
                          <p className="text-[11px] text-white/80 italic font-serif line-clamp-2">
                            "{fav.prompt}"
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Actions Row */}
                    <div className="pt-2 border-t border-[#25223d] space-y-2">
                      <div className="flex items-center justify-between text-[10px] mono text-white/40">
                        <span>Favorited {new Date(fav.favorited_at).toLocaleDateString()}</span>
                        <span>{fav.duration || '10s'}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {/* 1-Click Remix */}
                        <button
                          type="button"
                          onClick={() => {
                            copyPrompt(fav.id, fav.prompt);
                            onSelectPrompt?.(
                              fav.prompt,
                              (fav.model === 'veo' ? 'veo3' : fav.model) as any,
                              (fav.aspect_ratio || '9:16') as any
                            );
                          }}
                          className="flex-1 py-1.5 px-3 rounded-xl bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-white font-extrabold text-xs mono flex items-center justify-center gap-1.5 shadow-md shadow-rose-950/40 transition-all cursor-pointer active:scale-95"
                          title="Remix: Fill prompt & engine into Studio"
                        >
                          <Sparkles className="w-3.5 h-3.5 fill-white" />
                          <span>Remix Prompt</span>
                        </button>

                        {/* Copy Prompt */}
                        <button
                          type="button"
                          onClick={() => copyPrompt(fav.id, fav.prompt)}
                          className="p-1.5 rounded-xl bg-[#19162e] hover:bg-purple-900/30 border border-[#2e2a4a] text-white/70 hover:text-white transition-colors cursor-pointer"
                          title="Copy prompt"
                        >
                          {copiedId === fav.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>

                        {/* Download MP4 */}
                        <a
                          href={fav.video_url}
                          download={`nexverze-${fav.id}.mp4`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded-xl bg-[#19162e] hover:bg-purple-900/30 border border-[#2e2a4a] text-white/70 hover:text-white transition-colors cursor-pointer"
                          title="Download MP4"
                        >
                          <Download className="w-3.5 h-3.5 text-emerald-400" />
                        </a>

                        {/* Remove from favorites */}
                        <button
                          type="button"
                          onClick={() => handleRemoveFavorite(favId)}
                          disabled={removingFavId === favId}
                          className="p-1.5 rounded-xl bg-[#19162e] hover:bg-rose-950/40 border border-[#2e2a4a] text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
                          title="Remove from favorites"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Side-by-Side Video & Prompt Comparison Modal */}
      <VideoCompareModal
        isOpen={isCompareModalOpen}
        onClose={() => setIsCompareModalOpen(false)}
        videoA={compareVideoA}
        videoB={compareVideoB}
        allGenerations={comparisonPool as any}
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
