import React, { useState, useEffect } from 'react';
import {
  Heart,
  Search,
  Sparkles,
  Download,
  Copy,
  Check,
  Play,
  Trash2,
  GitCompare,
  ArrowRight,
  Database,
  Film,
  Layers,
  ChevronDown,
} from 'lucide-react';
import {
  FavoriteCreation,
  getLocalFavorites,
  subscribeFavorites,
  removeFavoriteCreation,
  syncUserFavoritesFromCloud,
} from '../../lib/favoritesStorage';
import { QualityLockPlayer } from '../QualityLockPlayer';
import { VideoCompareModal, CompareVideoItem } from '../VideoCompareModal';
import { SAMPLE_VIDEOS } from '../../lib/videoSamples';
import { SUPABASE_STUDIO_SQL } from '../../lib/supabase';

interface FavoritesPageProps {
  userEmail?: string;
  onSelectPrompt?: (prompt: string, model: 'luma' | 'veo3' | 'kling', ratio: '9:16' | '16:9' | '1:1') => void;
  onNavigateToHome?: () => void;
  onNavigateToStudio?: () => void;
  onOpenSqlTab?: () => void;
}

export const FavoritesPage: React.FC<FavoritesPageProps> = ({
  userEmail,
  onSelectPrompt,
  onNavigateToHome,
  onNavigateToStudio,
  onOpenSqlTab,
}) => {
  const [favorites, setFavorites] = useState<FavoriteCreation[]>(() => getLocalFavorites());
  const [formatFilter, setFormatFilter] = useState<'all' | '9:16' | '16:9' | '1:1'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeVideo, setActiveVideo] = useState<FavoriteCreation | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [showSqlDrawer, setShowSqlDrawer] = useState(false);

  // Compare Iterations States
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);
  const [compareVideoA, setCompareVideoA] = useState<CompareVideoItem | null>(null);
  const [compareVideoB, setCompareVideoB] = useState<CompareVideoItem | null>(null);

  // Subscribe to real-time updates (syncs when like is toggled on cards)
  useEffect(() => {
    return subscribeFavorites((items) => {
      setFavorites(items);
      if (items.length > 0 && !activeVideo) {
        setActiveVideo(items[0]);
      }
    });
  }, []);

  // Sync Supabase & Cloud
  useEffect(() => {
    if (userEmail) {
      syncUserFavoritesFromCloud(userEmail).then((items) => {
        setFavorites(items);
      });
    }
  }, [userEmail]);

  const handleCopyPrompt = (id: string, promptText: string) => {
    navigator.clipboard?.writeText(promptText);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRemove = async (videoId: string) => {
    setRemovingId(videoId);
    try {
      await removeFavoriteCreation(videoId, userEmail);
      if (activeVideo?.videoId === videoId || activeVideo?.id === videoId) {
        setActiveVideo(null);
      }
      setSelectedForCompare((prev) => prev.filter((id) => id !== videoId));
    } finally {
      setRemovingId(null);
    }
  };

  const toggleCompareSelect = (id: string) => {
    setSelectedForCompare((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      }
      if (prev.length >= 2) {
        return [prev[0], id];
      }
      return [...prev, id];
    });
  };

  const toCompareItem = (fav: FavoriteCreation): CompareVideoItem => ({
    id: fav.videoId || fav.id,
    prompt: fav.prompt,
    model: fav.model,
    aspect_ratio: fav.aspect_ratio || '9:16',
    duration: fav.duration || '10s',
    video_url: fav.video_url,
    created_at: fav.favorited_at,
  });

  const handleOpenCompare = () => {
    let itemA: CompareVideoItem | null = null;
    let itemB: CompareVideoItem | null = null;

    if (selectedForCompare.length === 2) {
      const fA = favorites.find((f) => (f.videoId || f.id) === selectedForCompare[0]);
      const fB = favorites.find((f) => (f.videoId || f.id) === selectedForCompare[1]);
      if (fA) itemA = toCompareItem(fA);
      if (fB) itemB = toCompareItem(fB);
    } else if (selectedForCompare.length === 1) {
      const fA = favorites.find((f) => (f.videoId || f.id) === selectedForCompare[0]);
      if (fA) itemA = toCompareItem(fA);
      const fB = favorites.find((f) => (f.videoId || f.id) !== selectedForCompare[0]);
      if (fB) itemB = toCompareItem(fB);
    } else if (favorites.length >= 2) {
      itemA = toCompareItem(favorites[0]);
      itemB = toCompareItem(favorites[1]);
    }

    if (itemA && itemB) {
      setCompareVideoA(itemA);
      setCompareVideoB(itemB);
      setIsCompareModalOpen(true);
    }
  };

  // Filtered list
  const filtered = favorites.filter((fav) => {
    if (formatFilter !== 'all' && fav.aspect_ratio !== formatFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchTitle = (fav.title || '').toLowerCase().includes(q);
      const matchPrompt = (fav.prompt || '').toLowerCase().includes(q);
      const matchModel = (fav.model || '').toLowerCase().includes(q);
      return matchTitle || matchPrompt || matchModel;
    }
    return true;
  });

  const count916 = favorites.filter((f) => f.aspect_ratio === '9:16').length;
  const count169 = favorites.filter((f) => f.aspect_ratio === '16:9').length;
  const count11 = favorites.filter((f) => f.aspect_ratio === '1:1').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-8 animate-in fade-in duration-300">
      {/* ========================================================================= */}
      {/* 1. HERO HEADER                                                            */}
      {/* ========================================================================= */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1c122c] via-[#120d20] to-[#0a0814] border border-rose-500/30 p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-400/40 text-rose-300 text-xs font-bold mono uppercase tracking-wider shadow-sm">
              <Heart className="w-3.5 h-3.5 fill-rose-400 text-rose-400 animate-pulse" />
              <span>Supabase & Local Favorites</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              My Liked Creations
            </h1>
            <p className="text-xs sm:text-sm text-white/70 leading-relaxed font-sans">
              All video creations you have liked in NexVerze Studio are saved here in real-time. 1-click remix prompts back into the Studio, download master MP4s, or launch synchronized side-by-side comparison.
            </p>
          </div>

          {/* Quick Metrics Cards */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <div className="px-4 py-2.5 rounded-2xl bg-black/50 border border-rose-500/30 backdrop-blur-md text-center min-w-[80px]">
              <span className="block text-xl font-black text-rose-400 font-mono">
                {favorites.length}
              </span>
              <span className="text-[10px] text-white/50 mono uppercase font-bold">Total Liked</span>
            </div>
            <div className="px-4 py-2.5 rounded-2xl bg-black/50 border border-white/10 backdrop-blur-md text-center min-w-[70px]">
              <span className="block text-xl font-bold text-white font-mono">
                {count916}
              </span>
              <span className="text-[10px] text-white/50 mono uppercase">9:16 Reels</span>
            </div>
            <div className="px-4 py-2.5 rounded-2xl bg-black/50 border border-white/10 backdrop-blur-md text-center min-w-[70px]">
              <span className="block text-xl font-bold text-white font-mono">
                {count169}
              </span>
              <span className="text-[10px] text-white/50 mono uppercase">16:9 Cinema</span>
            </div>
            <div className="px-4 py-2.5 rounded-2xl bg-black/50 border border-white/10 backdrop-blur-md text-center min-w-[70px]">
              <span className="block text-xl font-bold text-white font-mono">
                {count11}
              </span>
              <span className="text-[10px] text-white/50 mono uppercase">1:1 Square</span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. TOOLBAR: SEARCH, FORMAT TABS, AND COMPARE TRIGGER                       */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#252038]">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Format Filters */}
          <div className="flex items-center gap-1 bg-[#151226] border border-[#2e2a4a] p-1 rounded-2xl mono text-xs">
            {(['all', '9:16', '16:9', '1:1'] as const).map((fmt) => (
              <button
                key={fmt}
                onClick={() => setFormatFilter(fmt)}
                className={`px-3 py-1.5 rounded-xl uppercase font-bold transition-all cursor-pointer ${
                  formatFilter === fmt
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-950/50'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                {fmt === 'all' ? `All (${favorites.length})` : fmt}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search prompts & titles..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-[#151226] border border-[#2e2a4a] text-xs text-white placeholder-white/40 focus:outline-none focus:border-rose-400"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Compare Button */}
          {favorites.length >= 2 && (
            <button
              onClick={handleOpenCompare}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold mono flex items-center gap-2 transition-all cursor-pointer ${
                selectedForCompare.length === 2
                  ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg ring-2 ring-purple-400/50'
                  : 'bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30'
              }`}
              title="Compare 2 liked creations side-by-side"
            >
              <GitCompare className="w-4 h-4 text-purple-400" />
              <span>Side-by-Side Compare</span>
              {selectedForCompare.length > 0 && (
                <span className="bg-purple-500/40 text-white px-1.5 py-0.5 rounded-full text-[10px]">
                  {selectedForCompare.length}/2
                </span>
              )}
            </button>
          )}

          {/* Supabase Schema Notice Button */}
          <button
            onClick={() => setShowSqlDrawer(!showSqlDrawer)}
            className="p-2 rounded-xl bg-[#151226] hover:bg-[#201b38] border border-[#2e2a4a] text-white/70 hover:text-white transition-colors cursor-pointer text-xs flex items-center gap-1.5 mono"
            title="View Supabase favorite_videos Table Schema"
          >
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Supabase Schema</span>
          </button>
        </div>
      </div>

      {/* Supabase Schema Drawer */}
      {showSqlDrawer && (
        <div className="p-4 rounded-2xl bg-[#0f0c1c] border border-emerald-500/30 space-y-3 animate-in slide-in-from-top-2 text-xs mono">
          <div className="flex items-center justify-between">
            <span className="font-bold text-emerald-300 flex items-center gap-1.5">
              <Database className="w-4 h-4 text-emerald-400" />
              <span>Supabase Table: favorite_videos</span>
            </span>
            <button
              onClick={() => setShowSqlDrawer(false)}
              className="text-white/50 hover:text-white"
            >
              ✕
            </button>
          </div>
          <p className="text-[11px] text-white/70 font-sans">
            Liked videos are stored in the <code className="text-emerald-300">favorite_videos</code> table with RLS enabled. If you haven't executed this SQL yet in your Supabase project, run the snippet below:
          </p>
          <pre className="p-3 rounded-xl bg-black/60 border border-white/5 text-[11px] text-emerald-300/90 overflow-x-auto">
{`CREATE TABLE IF NOT EXISTS favorite_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  email text NOT NULL,
  video_id text NOT NULL,
  title text NOT NULL,
  prompt text NOT NULL,
  model text NOT NULL,
  aspect_ratio text DEFAULT '9:16',
  video_url text NOT NULL,
  thumbnail_url text,
  duration text DEFAULT '10s',
  created_at timestamptz DEFAULT now(),
  UNIQUE(email, video_id)
);
ALTER TABLE favorite_videos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anon read/write favorite_videos" ON favorite_videos FOR ALL USING (true) WITH CHECK (true);`}
          </pre>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. ACTIVE FEATURED PLAYER                                                 */}
      {/* ========================================================================= */}
      {activeVideo && (
        <div className="bg-[#141026] border border-rose-500/30 rounded-3xl p-6 sm:p-8 space-y-4 shadow-2xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex-1 min-w-0 pr-2">
              <div className="flex items-center gap-2 text-[11px] mono text-rose-400 font-semibold">
                <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                <span>Active Liked Video</span>
              </div>
              <h3 className="text-lg font-bold text-white mt-0.5 truncate">
                {activeVideo.title}
              </h3>
              <p className="text-xs text-white/70 italic font-serif mt-0.5 line-clamp-1">
                "{activeVideo.prompt}"
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* Compare toggle */}
              <button
                onClick={() => toggleCompareSelect(activeVideo.videoId || activeVideo.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors mono ${
                  selectedForCompare.includes(activeVideo.videoId || activeVideo.id)
                    ? 'bg-purple-600 text-white'
                    : 'bg-white/[0.04] hover:bg-white/[0.08] text-white/70 hover:text-white border border-white/10'
                }`}
              >
                <GitCompare className="w-3.5 h-3.5 text-purple-400" />
                <span>
                  {selectedForCompare.includes(activeVideo.videoId || activeVideo.id)
                    ? 'In Compare'
                    : 'Add to Compare'}
                </span>
              </button>

              {/* Remix Prompt */}
              <button
                onClick={() => {
                  handleCopyPrompt(activeVideo.id, activeVideo.prompt);
                  onSelectPrompt?.(
                    activeVideo.prompt,
                    (activeVideo.model === 'veo' ? 'veo3' : activeVideo.model) as any,
                    (activeVideo.aspect_ratio || '9:16') as any
                  );
                }}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-white font-extrabold text-xs mono flex items-center gap-1.5 shadow-lg shadow-rose-950/40 cursor-pointer active:scale-95"
                title="Remix: Load prompt, model, and ratio into Studio"
              >
                <Sparkles className="w-3.5 h-3.5 fill-white" />
                <span>Remix in Studio</span>
              </button>

              {/* Copy Prompt */}
              <button
                onClick={() => handleCopyPrompt(activeVideo.id, activeVideo.prompt)}
                className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-white/70 hover:text-white transition-colors"
                title="Copy Prompt"
              >
                {copiedId === activeVideo.id ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>

              {/* Unlike / Remove */}
              <button
                onClick={() => handleRemove(activeVideo.videoId || activeVideo.id)}
                className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-colors cursor-pointer"
                title="Remove from Liked Videos"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          <QualityLockPlayer
            videoUrl={activeVideo.video_url}
            aspectRatio={(activeVideo.aspect_ratio as any) || '9:16'}
            modelName={activeVideo.model.toUpperCase()}
            duration={activeVideo.duration || '10s'}
            timestamp={activeVideo.favorited_at}
            prompt={activeVideo.prompt}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. FAVORITES GRID OR EMPTY STATE                                          */}
      {/* ========================================================================= */}
      {filtered.length === 0 ? (
        <div className="bg-[#141026]/70 border border-dashed border-rose-500/30 rounded-3xl p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-400/30 text-rose-400 mx-auto flex items-center justify-center shadow-lg">
            <Heart className="w-8 h-8 fill-rose-500/20 text-rose-400 animate-pulse" />
          </div>
          <div className="space-y-1">
            <h4 className="text-lg font-bold text-white">No Liked Videos Found</h4>
            <p className="text-xs text-white/50 max-w-md mx-auto">
              {searchQuery
                ? `No favorites matched "${searchQuery}". Try a different keyword or clear filters.`
                : 'Browse the Showcase Gallery and click the ❤️ Like button on any video to bookmark it here for instant prompt remixing and MP4 downloads.'}
            </p>
          </div>

          {onNavigateToHome && (
            <button
              type="button"
              onClick={onNavigateToHome}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-white text-xs font-bold mono inline-flex items-center gap-2 shadow-xl shadow-rose-950/40 transition-all cursor-pointer active:scale-95"
            >
              <Sparkles className="w-4 h-4" />
              <span>Explore Showcase Gallery</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((fav) => {
            const favId = fav.videoId || fav.id;
            const isSelected = selectedForCompare.includes(favId);
            const isActive = activeVideo?.id === fav.id || activeVideo?.videoId === favId;

            return (
              <div
                key={favId}
                className={`bg-[#130f24] border rounded-2xl overflow-hidden p-4 space-y-3 transition-all card-hover flex flex-col justify-between ${
                  isSelected
                    ? 'border-purple-400 ring-2 ring-purple-500/50 shadow-purple-900/30'
                    : isActive
                    ? 'border-rose-400 ring-1 ring-rose-500/40 bg-[#181230]'
                    : 'border-[#26213c] hover:border-rose-500/40'
                }`}
              >
                <div className="space-y-3">
                  {/* Thumbnail / Video */}
                  <div
                    onClick={() => setActiveVideo(fav)}
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

                    {/* Heart Button in corner to Unlike */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemove(favId);
                      }}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-rose-600/90 hover:bg-rose-700 text-white shadow-lg transition-transform active:scale-90"
                      title="Remove from Liked Videos"
                    >
                      <Heart className="w-3.5 h-3.5 fill-white text-white" />
                    </button>

                    {/* Compare Selection Pill */}
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
                    <div className="bg-[#0c0918] p-2.5 rounded-xl border border-white/5">
                      <p className="text-[11px] text-white/80 italic font-serif line-clamp-2">
                        "{fav.prompt}"
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="pt-2 border-t border-[#241e38] space-y-2">
                  <div className="flex items-center justify-between text-[10px] mono text-white/40">
                    <span>Liked {new Date(fav.favorited_at).toLocaleDateString()}</span>
                    <span>{fav.duration || '10s'}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* 1-Click Remix */}
                    <button
                      type="button"
                      onClick={() => {
                        handleCopyPrompt(fav.id, fav.prompt);
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
                      <span>Remix Video</span>
                    </button>

                    {/* Copy Prompt */}
                    <button
                      type="button"
                      onClick={() => handleCopyPrompt(fav.id, fav.prompt)}
                      className="p-1.5 rounded-xl bg-[#19152e] hover:bg-purple-900/30 border border-[#2e2a4a] text-white/70 hover:text-white transition-colors cursor-pointer"
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
                      className="p-1.5 rounded-xl bg-[#19152e] hover:bg-purple-900/30 border border-[#2e2a4a] text-white/70 hover:text-white transition-colors cursor-pointer"
                      title="Download MP4"
                    >
                      <Download className="w-3.5 h-3.5 text-emerald-400" />
                    </a>

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => handleRemove(favId)}
                      disabled={removingId === favId}
                      className="p-1.5 rounded-xl bg-[#19152e] hover:bg-rose-950/40 border border-[#2e2a4a] text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
                      title="Remove from Liked Videos"
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

      {/* Side-by-Side Video & Prompt Comparison Modal */}
      <VideoCompareModal
        isOpen={isCompareModalOpen}
        onClose={() => setIsCompareModalOpen(false)}
        videoA={compareVideoA}
        videoB={compareVideoB}
        allGenerations={favorites.map((f) => toCompareItem(f)) as any}
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
