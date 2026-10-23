'use client';

import React, { useState, useEffect } from 'react';
import { supabase, StudioGeneration } from '@/lib/supabase';
import { ArrowLeft, Film, Play, Download, Trash2, RefreshCw, Copy, Check, Sparkles } from 'lucide-react';

export default function HistoryPage() {
  const [generations, setGenerations] = useState<StudioGeneration[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeVideo, setActiveVideo] = useState<StudioGeneration | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadGenerations = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('studio_generations')
        .select('*')
        .order('created_at', { ascending: false });

      if (data) {
        setGenerations(data as StudioGeneration[]);
        if (data.length > 0 && !activeVideo) {
          setActiveVideo(data[0] as StudioGeneration);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGenerations();
  }, []);

  const copyPrompt = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this video?')) return;
    try {
      await supabase.from('studio_generations').delete().eq('id', id);
      setGenerations((prev) => prev.filter((item) => item.id !== id));
      if (activeVideo?.id === id) {
        setActiveVideo(null);
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a12] text-white p-6 sm:p-8 max-w-7xl mx-auto space-y-8">
      {/* Top Bar */}
      <div className="flex items-center justify-between pb-4 border-b border-[#27272a]">
        <a href="/" className="flex items-center gap-2 text-xs mono text-purple-400 hover:text-purple-300">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Studio</span>
        </a>
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Film className="w-5 h-5 text-purple-400" />
            <span>Generation History ({generations.length})</span>
          </h1>
          <button
            onClick={loadGenerations}
            className="p-1.5 rounded-lg bg-[#18181b] border border-[#27272a] text-white/60 hover:text-white"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Active Video Player with Quality Lock Style */}
      {activeVideo && (
        <div className="bg-[#18181b] border border-[#27272a] rounded-3xl p-6 sm:p-8 flex flex-col items-center">
          <div className="w-full flex items-center justify-between mb-4">
            <span className="text-xs font-mono text-purple-300 uppercase font-semibold">
              Selected Output ({activeVideo.model.toUpperCase()})
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => copyPrompt(activeVideo.id, activeVideo.prompt)}
                className="px-3 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors mono"
                title="Copy Prompt"
              >
                {copiedId === activeVideo.id ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Prompt</span>
                  </>
                )}
              </button>
              <span className="text-xs text-white/50 mono">
                {new Date(activeVideo.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>

          <div
            className={`relative bg-[#0f0f17] rounded-2xl overflow-hidden border border-[#27272a] shadow-2xl ${
              activeVideo.aspect_ratio === '9:16'
                ? 'aspect-[9/16] max-w-[320px] w-full'
                : activeVideo.aspect_ratio === '16:9'
                ? 'aspect-[16/9] max-w-[640px] w-full'
                : 'aspect-square max-w-[380px] w-full'
            }`}
          >
            <video
              src={activeVideo.video_url}
              controls
              autoPlay
              loop
              className="w-full h-full object-cover object-center"
            />
          </div>

          <p className="text-xs text-white/70 italic mt-4 max-w-xl text-center">
            "{activeVideo.prompt}"
          </p>
        </div>
      )}

      {/* Grid of videos with play, download, copy prompt, and delete */}
      {loading ? (
        <div className="text-center py-16 text-white/50 mono text-xs">Loading generation history...</div>
      ) : generations.length === 0 ? (
        <div className="text-center py-16 text-white/50 mono text-xs">
          No generated videos found. Head back to Studio and create your first video!
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {generations.map((g) => (
            <div
              key={g.id}
              className={`bg-[#18181b] border rounded-2xl overflow-hidden p-4 space-y-3 transition-all ${
                activeVideo?.id === g.id ? 'border-purple-500 ring-1 ring-purple-500/50' : 'border-[#27272a]'
              }`}
            >
              <div
                onClick={() => setActiveVideo(g)}
                className="relative aspect-video bg-[#0f0f17] rounded-xl overflow-hidden cursor-pointer group"
              >
                <video
                  src={g.video_url}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform"
                  muted
                  playsInline
                />
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 flex items-center justify-center transition-colors">
                  <div className="w-10 h-10 rounded-full bg-purple-600/90 text-white flex items-center justify-center">
                    <Play className="w-4 h-4 fill-white translate-x-0.5" />
                  </div>
                </div>
                <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/70 rounded text-[10px] mono text-purple-300 uppercase font-bold">
                  {g.model}
                </div>
                <div className="absolute top-2 right-2 px-2 py-0.5 bg-black/70 rounded text-[10px] mono text-white/70">
                  {g.aspect_ratio || '9:16'}
                </div>
              </div>

              {/* Prompt box with Copy Prompt icon button */}
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2 bg-[#0f0f17] p-2.5 rounded-xl border border-white/[0.04]">
                  <p className="text-xs text-white/80 line-clamp-2 leading-relaxed flex-1 font-mono text-[11px]">
                    "{g.prompt}"
                  </p>
                  <button
                    onClick={() => copyPrompt(g.id, g.prompt)}
                    className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.1] text-white/70 hover:text-white transition-colors shrink-0"
                    title="Copy Prompt"
                  >
                    {copiedId === g.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-between text-[11px] mono text-white/40 px-1">
                  <span>{new Date(g.created_at).toLocaleDateString()}</span>
                  <span className="text-purple-400 font-semibold">-{g.credits_used}cr</span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-[#27272a]">
                <button
                  onClick={() => setActiveVideo(g)}
                  className="flex-1 py-1.5 px-3 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 text-xs font-semibold flex items-center justify-center gap-1.5"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>Play</span>
                </button>
                <button
                  onClick={() => copyPrompt(g.id, g.prompt)}
                  className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-white/70 hover:text-white"
                  title="Copy Prompt"
                >
                  {copiedId === g.id ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
                <a
                  href={g.video_url}
                  download={`nexverze-${g.id}.mp4`}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-white/70 hover:text-white"
                  title="Download MP4"
                >
                  <Download className="w-3.5 h-3.5" />
                </a>
                <button
                  onClick={() => handleDelete(g.id)}
                  className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-red-500/20 text-white/40 hover:text-red-400"
                  title="Delete Video"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
