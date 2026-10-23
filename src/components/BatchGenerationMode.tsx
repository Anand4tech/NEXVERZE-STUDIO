import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Layers,
  Play,
  Pause,
  RefreshCw,
  Plus,
  Trash2,
  Check,
  AlertCircle,
  Clock,
  Coins,
  FileText,
  Upload,
  Download,
  Film,
  Zap,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  X,
  ExternalLink,
} from 'lucide-react';
import { ModelType, DurationType, FAL_MODELS, MODEL_COST, INR_MAPPING } from '../lib/modelConfig';
import { VideoSample } from '../lib/videoSamples';
import { StudioUser, deductUserCredits, saveStudioGeneration, StudioGeneration } from '../lib/supabase';
import { logApiConsumption } from '../lib/marginGuard';
import { AudioVoiceoverConfig } from './AudioVoiceoverStudio';
import { SceneTransitionType } from './QualityLockPlayer';

export interface BatchPromptItem {
  id: string;
  prompt: string;
  model: ModelType;
  duration: DurationType;
  aspectRatio: '9:16' | '16:9' | '1:1';
  status: 'queued' | 'processing' | 'completed' | 'error';
  progress: number;
  videoUrl?: string;
  error?: string;
  createdAt: number;
  completedAt?: number;
}

interface BatchGenerationModeProps {
  user: StudioUser | null;
  onUpdateUser: (user: StudioUser) => void;
  defaultModel: ModelType;
  defaultDuration: DurationType;
  defaultRatio: '9:16' | '16:9' | '1:1';
  audioConfig: AudioVoiceoverConfig;
  motionIntensity: number;
  sceneTransition: SceneTransitionType;
  isFreeUser: boolean;
  onOpenPlans: () => void;
  onSelectVideoForPlayer: (sample: VideoSample) => void;
}

const PRESET_STORYBOARD_PROMPTS = [
  'Cinematic FPV drone flythrough of ancient Tamil temple gopuram at sunrise, 8k volumetric light, golden hour, photorealistic hyper-detail',
  'Cyberpunk neon warrior riding high-speed hoverbike through rainy futuristic Chennai street with neon reflections',
  'Majestic mythological Indian hero drawing glowing bow inside sacred Himalayan cavern, swirling embers and atmospheric mist',
  'Lush Kerala backwaters traditional wooden houseboat drifting through morning emerald fog, serene reflection on water surface',
];

export const BatchGenerationMode: React.FC<BatchGenerationModeProps> = ({
  user,
  onUpdateUser,
  defaultModel,
  defaultDuration,
  defaultRatio,
  audioConfig,
  motionIntensity,
  sceneTransition,
  isFreeUser,
  onOpenPlans,
  onSelectVideoForPlayer,
}) => {
  // Batch Prompt Queue State (saved to localStorage for persistence across reloads)
  const [items, setItems] = useState<BatchPromptItem[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('nexverze_batch_queue');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (e) {
        console.warn('Failed to parse stored batch queue:', e);
      }
    }
    // Default initial queued prompts
    return [
      {
        id: 'batch-1',
        prompt: 'Cinematic FPV drone flythrough of ancient Tamil temple gopuram at sunrise, 8k volumetric light, golden hour',
        model: defaultModel,
        duration: defaultDuration,
        aspectRatio: defaultRatio,
        status: 'queued',
        progress: 0,
        createdAt: Date.now(),
      },
      {
        id: 'batch-2',
        prompt: 'Cyberpunk neon street racer speeding through rainy futuristic night city with wet ground reflections and light trails',
        model: defaultModel,
        duration: defaultDuration,
        aspectRatio: defaultRatio,
        status: 'queued',
        progress: 0,
        createdAt: Date.now() + 1,
      },
      {
        id: 'batch-3',
        prompt: 'Epic mythological warrior awakening inside glowing ancient cavern with dramatic particle smoke and cinematic rim lighting',
        model: defaultModel,
        duration: defaultDuration,
        aspectRatio: defaultRatio,
        status: 'queued',
        progress: 0,
        createdAt: Date.now() + 2,
      },
    ];
  });

  const [newPromptInput, setNewPromptInput] = useState('');
  const [isMultiLineModalOpen, setIsMultiLineModalOpen] = useState(false);
  const [multiLineText, setMultiLineText] = useState('');
  const [isProcessingBatch, setIsProcessingBatch] = useState(false);
  const [currentProcessingId, setCurrentProcessingId] = useState<string | null>(null);
  const [activeBatchNotice, setActiveBatchNotice] = useState<string | null>(null);
  const isStopRequestedRef = useRef(false);

  // Sync to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('nexverze_batch_queue', JSON.stringify(items));
      } catch (e) {
        console.warn('Failed to persist batch queue:', e);
      }
    }
  }, [items]);

  // Compute live total credit cost for all remaining queued / error items
  const queuedItems = items.filter((i) => i.status === 'queued' || i.status === 'error');
  const completedItems = items.filter((i) => i.status === 'completed');
  
  const totalBatchCost = queuedItems.reduce((acc, curr) => {
    const cost = MODEL_COST[curr.model]?.[curr.duration] || 50;
    return acc + cost;
  }, 0);

  // Add single prompt to queue
  const handleAddSinglePrompt = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newPromptInput.trim()) return;

    const newItem: BatchPromptItem = {
      id: `batch-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      prompt: newPromptInput.trim(),
      model: defaultModel,
      duration: defaultDuration,
      aspectRatio: defaultRatio,
      status: 'queued',
      progress: 0,
      createdAt: Date.now(),
    };

    setItems((prev) => [...prev, newItem]);
    setNewPromptInput('');
  };

  // Add multi-line prompt list
  const handleImportMultiLine = () => {
    if (!multiLineText.trim()) return;

    const lines = multiLineText
      .split('\n')
      .map((l) => l.trim().replace(/^[-*•\d.]+\s*/, ''))
      .filter((l) => l.length > 5);

    if (lines.length === 0) {
      setActiveBatchNotice('⚠️ Please enter at least one valid prompt (more than 5 characters).');
      setTimeout(() => setActiveBatchNotice(null), 3500);
      return;
    }

    const newItems: BatchPromptItem[] = lines.map((line, idx) => ({
      id: `batch-${Date.now()}-${idx}`,
      prompt: line,
      model: defaultModel,
      duration: defaultDuration,
      aspectRatio: defaultRatio,
      status: 'queued',
      progress: 0,
      createdAt: Date.now() + idx,
    }));

    setItems((prev) => [...prev, ...newItems]);
    setMultiLineText('');
    setIsMultiLineModalOpen(false);
    setActiveBatchNotice(`Added ${newItems.length} prompts to the batch queue!`);
    setTimeout(() => setActiveBatchNotice(null), 3000);
  };

  // Load preset storyboard prompts
  const handleLoadStoryboardPack = () => {
    const newItems: BatchPromptItem[] = PRESET_STORYBOARD_PROMPTS.map((p, idx) => ({
      id: `batch-story-${Date.now()}-${idx}`,
      prompt: p,
      model: defaultModel,
      duration: defaultDuration,
      aspectRatio: defaultRatio,
      status: 'queued',
      progress: 0,
      createdAt: Date.now() + idx,
    }));

    setItems((prev) => [...prev, ...newItems]);
    setActiveBatchNotice('Loaded 4 cinematic storyboard prompts into batch queue!');
    setTimeout(() => setActiveBatchNotice(null), 3000);
  };

  // Remove single item
  const handleRemoveItem = (id: string) => {
    if (currentProcessingId === id) {
      setActiveBatchNotice('⚠️ Cannot remove an item while it is currently generating.');
      setTimeout(() => setActiveBatchNotice(null), 3500);
      return;
    }
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  // Clear completed items
  const handleClearCompleted = () => {
    setItems((prev) => prev.filter((i) => i.status !== 'completed'));
  };

  // Clear all items
  const handleClearAll = () => {
    if (isProcessingBatch) {
      setActiveBatchNotice('⚠️ Please pause or stop the batch before clearing all items.');
      setTimeout(() => setActiveBatchNotice(null), 3500);
      return;
    }
    setItems([]);
  };

  // Re-queue failed items
  const handleRequeueFailed = () => {
    setItems((prev) =>
      prev.map((i) => (i.status === 'error' ? { ...i, status: 'queued', error: undefined, progress: 0 } : i))
    );
  };

  // Update item config
  const handleUpdateItem = (id: string, updates: Partial<BatchPromptItem>) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...updates } : i)));
  };

  // Stop / Cancel Batch Processing
  const handleStopBatch = () => {
    isStopRequestedRef.current = true;
    setIsProcessingBatch(false);
    setActiveBatchNotice('Batch processing paused by user.');
    setTimeout(() => setActiveBatchNotice(null), 3500);
  };

  // START SEQUENTIAL BATCH GENERATION
  const handleStartBatchProcessing = async () => {
    if (queuedItems.length === 0) {
      setActiveBatchNotice('⚠️ No queued prompts to process. Add prompts to the queue first.');
      setTimeout(() => setActiveBatchNotice(null), 3500);
      return;
    }

    // Check credits for first item
    const firstItem = queuedItems[0];
    const firstCost = MODEL_COST[firstItem.model]?.[firstItem.duration] || 50;
    let runningCredits = user ? user.credits : 0;

    if (!user || runningCredits < firstCost) {
      onOpenPlans();
      setActiveBatchNotice(`⚠️ Insufficient credits for batch generation. You have ${runningCredits}cr, but need at least ${firstCost}cr to start.`);
      setTimeout(() => setActiveBatchNotice(null), 4000);
      return;
    }

    isStopRequestedRef.current = false;
    setIsProcessingBatch(true);
    let successCount = 0;

    // Loop through queued items sequentially
    for (let index = 0; index < items.length; index++) {
      const currentItem = items[index];

      // Only process items that are queued or error
      if (currentItem.status !== 'queued' && currentItem.status !== 'error') {
        continue;
      }

      // Check if user requested stop
      if (isStopRequestedRef.current) {
        break;
      }

      const itemCost = MODEL_COST[currentItem.model]?.[currentItem.duration] || 50;

      // Check running balance before processing this item (prevents stale closure overdraft)
      if (runningCredits < itemCost) {
        setActiveBatchNotice(`Batch stopped: Insufficient credits (${runningCredits}cr remaining, need ${itemCost}cr) for "${currentItem.prompt.slice(0, 30)}...". Please top up.`);
        onOpenPlans();
        break;
      }

      setCurrentProcessingId(currentItem.id);

      // Update status to processing
      setItems((prev) =>
        prev.map((i) => (i.id === currentItem.id ? { ...i, status: 'processing', progress: 15, error: undefined } : i))
      );

      // Progress bar simulation
      const progressTimer = setInterval(() => {
        setItems((prev) =>
          prev.map((i) => {
            if (i.id === currentItem.id && i.status === 'processing') {
              const next = Math.min(88, i.progress + 14);
              return { ...i, progress: next };
            }
            return i;
          })
        );
      }, 500);

      try {
        const response = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: currentItem.prompt.trim(),
            model: currentItem.model,
            duration: currentItem.duration,
            aspect_ratio: currentItem.aspectRatio,
            motion_intensity: motionIntensity,
            scene_transition: sceneTransition,
            audio_config: audioConfig.enabled ? audioConfig : undefined,
            userId: user?.id,
            email: user?.email,
          }),
        });

        clearInterval(progressTimer);
        const data = await response.json();

        if (!response.ok || !data.video_url) {
          if (response.status === 402) {
            onOpenPlans();
          }
          throw new Error(data.error || 'Video generation failed');
        }

        const generatedUrl = data.video_url;

        // Synchronize credits using server-authoritative balance
        if (user) {
          const remaining =
            typeof data.remaining_credits === 'number'
              ? data.remaining_credits
              : Math.max(0, runningCredits - itemCost);
          runningCredits = remaining;
          const updatedUser = { ...user, credits: remaining };
          onUpdateUser(updatedUser);
          try {
            if (typeof window !== 'undefined') {
              localStorage.setItem('nexverze_studio_user', JSON.stringify(updatedUser));
            }
          } catch (e) {
            console.warn('LocalStorage save error:', e);
          }

          // Save record to Supabase
          const genRecord: StudioGeneration = {
            id: crypto.randomUUID(),
            user_id: user.id,
            email: user.email,
            prompt: currentItem.prompt.trim(),
            model: currentItem.model,
            duration: currentItem.duration,
            credits_used: itemCost,
            video_url: generatedUrl,
            status: 'completed',
            aspect_ratio: currentItem.aspectRatio,
            created_at: new Date().toISOString(),
          };
          await saveStudioGeneration(genRecord);
          // System logic: log API consumption rate alongside credit deductions to track margins per model
          logApiConsumption(currentItem.model, currentItem.duration, itemCost);
        }

        // Update item as completed
        setItems((prev) =>
          prev.map((i) =>
            i.id === currentItem.id
              ? {
                  ...i,
                  status: 'completed',
                  progress: 100,
                  videoUrl: generatedUrl,
                  completedAt: Date.now(),
                }
              : i
          )
        );

        // Update main preview player with newly generated video
        const sample: VideoSample = {
          id: `batch-gen-${Date.now()}`,
          title: currentItem.prompt.slice(0, 32) + '...',
          model: (currentItem.model === 'veo' ? 'veo3' : currentItem.model) as any,
          prompt: currentItem.prompt,
          aspect_ratio: currentItem.aspectRatio,
          video_url: generatedUrl,
          thumbnail_url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=800&auto=format&fit=crop',
          duration: currentItem.duration,
          created_at: new Date().toISOString(),
        };
        onSelectVideoForPlayer(sample);

        successCount++;
        setActiveBatchNotice(`✓ Generated ${successCount} of ${queuedItems.length} videos!`);
      } catch (err: any) {
        clearInterval(progressTimer);
        console.error('Batch generation item error:', err);
        setItems((prev) =>
          prev.map((i) =>
            i.id === currentItem.id
              ? {
                  ...i,
                  status: 'error',
                  progress: 0,
                  error: err?.message || 'Generation failed',
                }
              : i
          )
        );
      }

      // Small cooldown between sequential requests
      await new Promise((resolve) => setTimeout(resolve, 800));
    }

    setIsProcessingBatch(false);
    setCurrentProcessingId(null);
    if (successCount > 0) {
      setActiveBatchNotice(`🎉 Batch Complete! Successfully generated ${successCount} cinematic videos.`);
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Batch Mode Overview Card */}
      <div className="bg-gradient-to-r from-purple-950/70 via-[#181824] to-indigo-950/70 border border-purple-500/35 rounded-2xl p-4 sm:p-5 shadow-lg space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-amber-500 to-fuchsia-600 flex items-center justify-center text-white shadow-md shadow-fuchsia-600/30">
              <Zap className="w-5 h-5 fill-white text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-white text-base">Batch Generation Queue</h3>
                <span className="text-[10px] mono bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded-full border border-amber-500/30">
                  Sequential Pipeline
                </span>
              </div>
              <p className="text-xs text-purple-200/80">
                Queue multiple prompts for automated sequential rendering.
              </p>
            </div>
          </div>

          {/* Action Tools */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setIsMultiLineModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-white/90 text-xs mono font-bold border border-white/10 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-cyan-300" />
              <span>Paste Prompt List</span>
            </button>

            <button
              type="button"
              onClick={handleLoadStoryboardPack}
              className="px-3 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/35 text-purple-200 text-xs mono font-bold border border-purple-500/30 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Load Storyboard Pack</span>
            </button>
          </div>
        </div>

        {/* Live Batch Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-white/[0.08] text-xs mono">
          <div className="bg-[#12121a] p-2 rounded-xl border border-white/[0.05]">
            <div className="text-[10px] text-white/50 uppercase font-semibold">Total Queued</div>
            <div className="text-sm font-black text-white mt-0.5">{queuedItems.length} Videos</div>
          </div>
          <div className="bg-[#12121a] p-2 rounded-xl border border-white/[0.05]">
            <div className="text-[10px] text-white/50 uppercase font-semibold">Completed</div>
            <div className="text-sm font-black text-emerald-400 mt-0.5">{completedItems.length} Videos</div>
          </div>
          <div className="bg-[#12121a] p-2 rounded-xl border border-white/[0.05]">
            <div className="text-[10px] text-white/50 uppercase font-semibold">Batch Cost</div>
            <div className="text-sm font-black text-purple-300 mt-0.5">{totalBatchCost} Credits</div>
          </div>
          <div className="bg-[#12121a] p-2 rounded-xl border border-white/[0.05]">
            <div className="text-[10px] text-white/50 uppercase font-semibold">Your Balance</div>
            <div className="text-sm font-black text-amber-300 mt-0.5">{user?.credits || 0} Credits</div>
          </div>
        </div>

        {/* Real-time Notice Banner */}
        {activeBatchNotice && (
          <div className="p-2.5 rounded-xl bg-purple-950/80 border border-purple-500/40 text-xs text-purple-200 flex items-center gap-2 animate-in fade-in">
            <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
            <span className="font-medium">{activeBatchNotice}</span>
          </div>
        )}
      </div>

      {/* Quick Add Prompt Bar */}
      <form onSubmit={handleAddSinglePrompt} className="flex gap-2">
        <input
          type="text"
          value={newPromptInput}
          onChange={(e) => setNewPromptInput(e.target.value)}
          placeholder="Add prompt to batch queue (e.g., 'Cinematic sunrise over temple with golden mist')..."
          className="flex-1 bg-[#141220] border border-purple-500/35 focus:border-purple-400 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-white/40 outline-none"
        />
        <button
          type="submit"
          className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold mono flex items-center gap-1.5 transition-all cursor-pointer shrink-0 shadow-md shadow-purple-600/30"
        >
          <Plus className="w-4 h-4" />
          <span>Add to Queue</span>
        </button>
      </form>

      {/* Queue Items List */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-xs mono text-white/60 px-1">
          <span className="font-bold uppercase tracking-wider text-[11px] text-white/70">
            Queue List ({items.length})
          </span>
          <div className="flex items-center gap-3 text-[11px]">
            {completedItems.length > 0 && (
              <button
                type="button"
                onClick={handleClearCompleted}
                className="text-white/60 hover:text-white underline cursor-pointer"
              >
                Clear Completed
              </button>
            )}
            {items.some((i) => i.status === 'error') && (
              <button
                type="button"
                onClick={handleRequeueFailed}
                className="text-amber-400 hover:text-amber-300 underline cursor-pointer"
              >
                Retry Failed
              </button>
            )}
            {items.length > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                className="text-rose-400/80 hover:text-rose-300 underline cursor-pointer"
              >
                Clear All
              </button>
            )}
          </div>
        </div>

        {items.length === 0 ? (
          <div className="p-8 rounded-2xl bg-[#12121a] border border-[#272738] text-center space-y-2">
            <Layers className="w-8 h-8 text-white/30 mx-auto" />
            <h4 className="text-sm font-bold text-white">Batch Queue is Empty</h4>
            <p className="text-xs text-white/50 max-w-sm mx-auto">
              Add individual prompts using the bar above, click "Paste Prompt List" to paste several prompts, or load our pre-made cinematic storyboard pack.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((item, index) => {
              const itemCost = MODEL_COST[item.model]?.[item.duration] || 50;
              const isCurrentProcessing = currentProcessingId === item.id;

              return (
                <div
                  key={item.id}
                  className={`p-3 sm:p-3.5 rounded-2xl border transition-all ${
                    isCurrentProcessing
                      ? 'bg-purple-950/40 border-purple-400 shadow-md shadow-purple-500/20 ring-1 ring-purple-400/30'
                      : item.status === 'completed'
                      ? 'bg-emerald-950/20 border-emerald-500/30'
                      : item.status === 'error'
                      ? 'bg-rose-950/20 border-rose-500/30'
                      : 'bg-[#141220] border-[#272738] hover:border-purple-500/30'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5 flex-1 min-w-0">
                      {/* Step Number Badge */}
                      <span className="mono font-bold text-xs px-2 py-0.5 rounded-lg bg-white/5 border border-white/10 text-white/70 shrink-0 mt-0.5">
                        #{index + 1}
                      </span>

                      {/* Prompt Content & Details */}
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <p className="text-xs text-white font-medium break-words leading-relaxed">
                          {item.prompt}
                        </p>

                        <div className="flex flex-wrap items-center gap-2 text-[10px] mono">
                          {/* Model Pill */}
                          <select
                            disabled={isProcessingBatch}
                            value={item.model}
                            onChange={(e) => handleUpdateItem(item.id, { model: e.target.value as ModelType })}
                            className="bg-[#0f0f17] border border-[#272738] rounded-md px-1.5 py-0.5 text-purple-300 font-bold outline-none cursor-pointer disabled:opacity-50"
                          >
                            <option value="ltx">LTX-Video (15cr • Fast & ₹10.50)</option>
                            <option value="luma">Luma Ray 3 (50cr • ₹35)</option>
                            <option value="wan">Wan 2.1 (45cr • Zero Watermark • ₹31.50)</option>
                            <option value="hunyuan">HunyuanVideo (65cr • 720p Film • ₹45.50)</option>
                            <option value="kling">Kling Pro (50cr • ₹35)</option>
                            <option value="veo">Google Veo Ultra (75cr • 4K • ₹52.50)</option>
                          </select>

                          {/* Duration Pill */}
                          <select
                            disabled={isProcessingBatch}
                            value={item.duration}
                            onChange={(e) => handleUpdateItem(item.id, { duration: e.target.value as DurationType })}
                            className="bg-[#0f0f17] border border-[#272738] rounded-md px-1.5 py-0.5 text-cyan-300 font-bold outline-none cursor-pointer disabled:opacity-50"
                          >
                            <option value="5s">5s</option>
                            <option value="8s">8s</option>
                            <option value="10s">10s</option>
                          </select>

                          {/* Aspect Ratio Pill */}
                          <select
                            disabled={isProcessingBatch}
                            value={item.aspectRatio}
                            onChange={(e) => handleUpdateItem(item.id, { aspectRatio: e.target.value as any })}
                            className="bg-[#0f0f17] border border-[#272738] rounded-md px-1.5 py-0.5 text-white/70 font-bold outline-none cursor-pointer disabled:opacity-50"
                          >
                            <option value="9:16">9:16 Vertical</option>
                            <option value="16:9">16:9 Cinema</option>
                            <option value="1:1">1:1 Square</option>
                          </select>

                          {/* Cost Badge */}
                          <span className="text-amber-300/80 font-bold px-1.5 py-0.5 bg-amber-500/10 rounded border border-amber-500/20">
                            {itemCost}cr
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Status & Actions Right Column */}
                    <div className="flex items-center gap-2 shrink-0">
                      {item.status === 'queued' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] mono bg-white/5 text-white/60 border border-white/10 font-bold">
                          ⏳ Queued
                        </span>
                      )}

                      {item.status === 'processing' && (
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] mono bg-purple-500/20 text-purple-200 border border-purple-400/40 font-bold animate-pulse">
                          <RefreshCw className="w-3 h-3 animate-spin text-purple-300" />
                          <span>Generating ({item.progress}%)</span>
                        </div>
                      )}

                      {item.status === 'completed' && (
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded-full text-[10px] mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                            ✓ Done
                          </span>
                          {item.videoUrl && (
                            <button
                              type="button"
                              onClick={() => {
                                const sample: VideoSample = {
                                  id: `batch-${item.id}`,
                                  title: item.prompt.slice(0, 30) + '...',
                                  model: (item.model === 'veo' ? 'veo3' : item.model) as any,
                                  prompt: item.prompt,
                                  aspect_ratio: item.aspectRatio,
                                  video_url: item.videoUrl || '',
                                  thumbnail_url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=800&auto=format&fit=crop',
                                  duration: item.duration,
                                  created_at: new Date().toISOString(),
                                };
                                onSelectVideoForPlayer(sample);
                              }}
                              className="px-2 py-1 rounded-lg bg-purple-600/30 hover:bg-purple-600/50 text-white text-[11px] font-bold mono border border-purple-400/40 flex items-center gap-1 transition-all cursor-pointer"
                              title="Inspect & play in 4K Quality Lock Player"
                            >
                              <Play className="w-3 h-3 fill-white" />
                              <span>Play</span>
                            </button>
                          )}
                        </div>
                      )}

                      {item.status === 'error' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] mono bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold">
                          Failed
                        </span>
                      )}

                      {/* Delete button */}
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        disabled={isCurrentProcessing}
                        className="p-1 text-white/40 hover:text-rose-400 transition-colors cursor-pointer disabled:opacity-20"
                        title="Remove from batch queue"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Progress Bar for active item */}
                  {isCurrentProcessing && (
                    <div className="mt-2.5 w-full h-1.5 bg-black/40 rounded-full overflow-hidden border border-purple-500/30">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-amber-400 transition-all duration-300 rounded-full shadow-[0_0_10px_rgba(236,72,153,0.8)]"
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                  )}

                  {/* Error notice */}
                  {item.error && (
                    <div className="mt-1.5 text-[10px] text-rose-300 mono flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      <span>{item.error}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Main Start / Stop Batch Action Bar */}
      <div className="pt-2">
        {isProcessingBatch ? (
          <button
            type="button"
            onClick={handleStopBatch}
            className="w-full font-bold py-4 px-6 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white shadow-xl shadow-rose-600/30 flex items-center justify-center gap-2.5 text-sm transition-all cursor-pointer active:scale-98"
          >
            <Pause className="w-4 h-4 fill-white" />
            <span>Pause / Stop Batch Processing</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={handleStartBatchProcessing}
            disabled={queuedItems.length === 0}
            className={`w-full font-bold py-4 px-6 rounded-2xl shadow-xl flex items-center justify-center gap-2.5 text-sm transition-all active:scale-98 disabled:opacity-50 cursor-pointer ${
              (user?.credits || 0) < totalBatchCost && queuedItems.length > 0
                ? 'bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-600/30'
                : 'bg-gradient-to-r from-purple-600 via-fuchsia-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-600/30 ring-1 ring-purple-400/40'
            }`}
          >
            <Zap className="w-4 h-4 fill-amber-300 text-amber-300" />
            <span>
              Start Batch Processing ({queuedItems.length} Prompts • {totalBatchCost} Credits)
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* MULTI-LINE PASTE / IMPORT MODAL */}
      {isMultiLineModalOpen && (
        <div
          onClick={() => setIsMultiLineModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#141220] border border-purple-500/40 rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-white text-base">Paste Multi-Line Prompts</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsMultiLineModalOpen(false)}
                className="p-1.5 text-white/50 hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-white/60 leading-relaxed">
              Paste your list of scene prompts below (one prompt per line). Each line will be queued as an individual video to generate.
            </p>

            <textarea
              rows={6}
              value={multiLineText}
              onChange={(e) => setMultiLineText(e.target.value)}
              placeholder={`Scene 1: Ancient Tamil temple gopuram illuminated at golden hour\nScene 2: Cyberpunk hero riding lightning hoverbike in rain\nScene 3: Deep jungle drone camera diving over waterfall`}
              className="w-full bg-[#0d0d14] border border-[#272738] focus:border-purple-500 rounded-xl p-3 text-xs text-white placeholder-white/30 outline-none resize-none"
            />

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsMultiLineModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white/70 hover:text-white bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleImportMultiLine}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-600/30 transition-all cursor-pointer"
              >
                Import Prompts
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
