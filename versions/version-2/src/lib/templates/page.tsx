'use client';

import React, { useState, useEffect, useRef } from 'react';
import { supabase, MODEL_COST, RAZORPAY_PACKS, StudioUser, StudioGeneration } from '@/lib/supabase';
import {
  Sparkles,
  Coins,
  ShieldCheck,
  Play,
  X,
  ExternalLink,
  Wand2,
  Sliders,
  ArrowRight,
  RefreshCw,
  Film,
  Download,
  AlertCircle,
  CreditCard,
  Upload,
  Image as ImageIcon,
  HelpCircle,
  Clock,
  Calendar,
  ArrowUpRight,
  Repeat,
  Camera,
  Check,
  Volume2,
  VolumeX,
  Gauge,
  Layers,
} from 'lucide-react';

type ModelType = 'luma' | 'kling' | 'veo';
type DurationType = '5s' | '8s' | '10s';

const MODEL_SPECS = {
  luma: {
    name: 'Luma Fast',
    versionName: 'Ray 3 Latest',
    badge: '⚡ 5s • Fastest • Reels',
    durations: ['5s', '8s', '10s'] as DurationType[],
    speed: '45-60 sec',
    quality: '1080p Crystal HD',
    audio: 'No Audio (Visuals Only)',
    bestFor: 'Fast viral reels, product turnarounds, dynamic drone zooms',
    desc: 'Ultra-fast camera motion dynamics powered by Ray 3 engine.',
    sample: 'https://assets.mixkit.co/videos/preview/mixkit-futuristic-city-with-flying-cars-and-skyscrapers-41551-large.mp4',
  },
  kling: {
    name: 'Kling Pro',
    versionName: 'v2.5 Turbo Pro',
    badge: '🎬 8s • Audio • Cinematic',
    durations: ['5s', '8s', '10s'] as DurationType[],
    speed: '90-120 sec',
    quality: '1080p HDR Master',
    audio: 'Ambient SFX & Sound',
    bestFor: 'Human expressions, action sequences, film trailers',
    desc: 'Turbo Pro engine with complex temporal consistency & natural physics.',
    sample: 'https://assets.mixkit.co/videos/preview/mixkit-digital-animation-of-screens-with-code-31911-large.mp4',
  },
  veo: {
    name: 'Veo Ultra',
    versionName: 'Veo 3.1 Fast',
    badge: '🔥 8s • Voice • Hollywood',
    durations: ['8s', '10s'] as DurationType[],
    speed: '2-3 min',
    quality: 'Cinema 1080p Ultra-Depth',
    audio: 'Integrated Voice & Foley',
    bestFor: 'Hollywood grade scenes, commercial spots, character dialogue',
    desc: 'DeepMind Veo 3.1 Fast engine tuned for Hollywood cinematic realism.',
    sample: 'https://assets.mixkit.co/videos/preview/mixkit-aerial-view-of-ancient-ruins-in-a-forest-41480-large.mp4',
  },
};

export default function StudioPage() {
  const [user, setUser] = useState<StudioUser | null>(null);
  const [email, setEmail] = useState('anand4earn@gmail.com');
  const [prompt, setPrompt] = useState(
    'Cinematic FPV drone flythrough of ancient Tamil temple gopuram at sunset, 8k volumetric light, golden hour reflections'
  );
  const [model, setModel] = useState<ModelType>('luma');
  const [duration, setDuration] = useState<DurationType>('5s');
  const [aspectRatio, setAspectRatio] = useState<'9:16' | '16:9' | '1:1'>('9:16');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLooping, setIsLooping] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [isFrameSmoothing, setIsFrameSmoothing] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [isEnhancingPrompt, setIsEnhancingPrompt] = useState(false);
  const [promptEnhancedSuccess, setPromptEnhancedSuccess] = useState(false);
  const [isExtractingFrame, setIsExtractingFrame] = useState(false);
  const [frameExtractedSuccess, setFrameExtractedSuccess] = useState(false);

  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [currentVideoUrl, setCurrentVideoUrl] = useState(
    'https://assets.mixkit.co/videos/preview/mixkit-aerial-view-of-ancient-ruins-in-a-forest-41480-large.mp4'
  );
  const [lastOutputInfo, setLastOutputInfo] = useState({
    modelName: 'Luma Fast (Ray 3)',
    duration: '5s',
    timestamp: new Date().toISOString(),
  });

  // Modals
  const [showInsufficientModal, setShowInsufficientModal] = useState(false);
  const [infoModalKey, setInfoModalKey] = useState<ModelType | null>(null);
  const [showCompareDrawer, setShowCompareDrawer] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(RAZORPAY_PACKS[1]);
  const [isPaying, setIsPaying] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Auto adjust duration when model changes
  useEffect(() => {
    const validDurs = MODEL_SPECS[model].durations;
    if (!validDurs.includes(duration)) {
      setDuration(validDurs[0]);
    }
  }, [model]);

  useEffect(() => {
    initUser(email);
  }, []);

  async function initUser(userEmail: string) {
    try {
      const { data } = await supabase
        .from('studio_users')
        .select('*')
        .eq('email', userEmail)
        .maybeSingle();

      if (data) {
        setUser(data);
      } else {
        const newUser: StudioUser = {
          id: crypto.randomUUID(),
          email: userEmail,
          credits: 50,
          created_at: new Date().toISOString(),
        };
        await supabase.from('studio_users').insert([newUser]);
        setUser(newUser);
      }
    } catch {
      setUser({ id: 'demo-user', email: userEmail, credits: 50 });
    }
  }

  const liveCost = MODEL_COST[model]?.[duration] || 50;

  const handleImageUpload = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => setImageUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleEnhancePrompt = () => {
    setIsEnhancingPrompt(true);
    setTimeout(() => {
      const descriptors = [
        'volumetric cinematic golden hour lighting, 35mm anamorphic prime lens',
        'subtle slow-motion dolly push, photorealistic subsurface scattering',
        '8k ultra-detailed resolution, award-winning cinematography, atmospheric depth',
      ];
      const addition = descriptors[Math.floor(Math.random() * descriptors.length)];
      setPrompt((prev) => `${prev.trim().replace(/[.,;]+$/, '')}, ${addition}.`);
      setIsEnhancingPrompt(false);
      setPromptEnhancedSuccess(true);
      setTimeout(() => setPromptEnhancedSuccess(false), 2000);
    }, 400);
  };

  const handleExtractFrame = () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      setIsExtractingFrame(true);
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 1080;
      canvas.height = video.videoHeight || 1920;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `nexverze-frame-${aspectRatio.replace(':', '-')}.png`;
        link.href = dataUrl;
        link.click();
        setFrameExtractedSuccess(true);
        setTimeout(() => setFrameExtractedSuccess(false), 2500);
      }
    } catch (err) {
      console.warn('Frame extraction notice:', err);
    } finally {
      setIsExtractingFrame(false);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim() && !imageUrl) {
      setGenerationError('Please provide a prompt or upload an image.');
      return;
    }

    setGenerationError(null);
    const required = liveCost;
    const currentCredits = user ? user.credits : 50;

    if (currentCredits < required) {
      setShowInsufficientModal(true);
      return;
    }

    setIsGenerating(true);
    setGenerationProgress(15);

    const progressTicker = setInterval(() => {
      setGenerationProgress((p) => (p >= 85 ? 85 : p + 15));
    }, 450);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          model,
          duration,
          imageUrl: imageUrl || undefined,
          aspect_ratio: aspectRatio,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.video_url) {
        throw new Error(data.error || 'Generation failed, try again');
      }

      clearInterval(progressTicker);
      setGenerationProgress(100);

      setCurrentVideoUrl(data.video_url);
      setLastOutputInfo({
        modelName: MODEL_SPECS[model].name,
        duration,
        timestamp: new Date().toISOString(),
      });

      const newCredits = currentCredits - required;
      const updatedUser = { ...user!, credits: newCredits };
      setUser(updatedUser);

      if (user?.id) {
        await supabase.from('studio_users').update({ credits: newCredits }).eq('id', user.id);
      }

      const genRecord: StudioGeneration = {
        id: crypto.randomUUID(),
        user_id: user?.id || 'demo',
        email: user?.email || email,
        prompt: prompt.trim(),
        model,
        duration,
        credits_used: required,
        video_url: data.video_url,
        image_url: imageUrl || undefined,
        status: 'completed',
        aspect_ratio: aspectRatio,
        created_at: new Date().toISOString(),
      };
      await supabase.from('studio_generations').insert([genRecord]);
    } catch (e: any) {
      console.error(e);
      clearInterval(progressTicker);
      setGenerationError(e?.message || 'Generation failed, try again');
    } finally {
      setIsGenerating(false);
      setGenerationProgress(0);
    }
  };

  const handleRazorpayPay = async () => {
    if (!user) return;
    setIsPaying(true);

    try {
      const orderRes = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: selectedPlan.amount,
          credits: selectedPlan.credits,
          planId: selectedPlan.id,
          email: user.email,
          userId: user.id,
        }),
      });

      const orderData = await orderRes.json();
      const Razorpay = (window as any).Razorpay;

      if (typeof Razorpay === 'function') {
        const options = {
          key: orderData.key_id || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_placeholder',
          amount: orderData.amount,
          currency: 'INR',
          name: 'NexVerze Studio',
          description: `${selectedPlan.name} Pack (+${selectedPlan.credits}cr)`,
          order_id: orderData.id,
          prefill: { email: user.email },
          theme: { color: '#8b5cf6' },
          handler: async function (resp: any) {
            await fetch('/api/razorpay/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: resp.razorpay_order_id,
                razorpay_payment_id: resp.razorpay_payment_id,
                razorpay_signature: resp.razorpay_signature,
                userId: user.id,
                email: user.email,
                credits: selectedPlan.credits,
                amount: selectedPlan.amount,
              }),
            });

            setUser((prev) => (prev ? { ...prev, credits: prev.credits + selectedPlan.credits } : null));
            setShowInsufficientModal(false);
            setIsPaying(false);
          },
          modal: {
            ondismiss: () => setIsPaying(false),
          },
        };
        const rzp = new Razorpay(options);
        rzp.open();
        return;
      }

      setUser((prev) => (prev ? { ...prev, credits: prev.credits + selectedPlan.credits } : null));
      setShowInsufficientModal(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsPaying(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a12] text-white flex flex-col justify-between selection:bg-purple-600">
      {/* Header */}
      <header className="h-14 border-b border-white/[0.06] bg-[#0a0a0f]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto h-full flex items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-6">
            <a href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-sm font-semibold text-purple-300">
                ∞
              </div>
              <span className="font-bold text-base galaxy-text">nexverze</span>
              <span className="mono text-[10px] text-white/50 border border-white/[0.08] bg-white/[0.03] rounded-full px-2 py-0.5">
                TIRUPUR 2025
              </span>
            </a>
            <nav className="hidden md:flex items-center gap-3 text-xs mono">
              <a href="/" className="text-white/60 hover:text-white px-2 py-1">
                Home
              </a>
              <span className="text-purple-300 font-bold bg-purple-600/20 px-2.5 py-1 rounded border border-purple-500/30">
                Studio
              </span>
              <a href="/studio/history" className="text-white/60 hover:text-white px-2 py-1">
                History
              </a>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowInsufficientModal(true)}
              className="flex items-center gap-2 bg-[#18181b] hover:bg-[#202026] border border-[#27272a] px-3 py-1.5 rounded-xl text-xs mono transition-colors"
            >
              <Coins className="w-3.5 h-3.5 text-purple-400" />
              <span>Credits: <strong className="text-purple-300">{user?.credits ?? 50}</strong>cr</span>
              <span className="text-[10px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded font-bold">+ Buy</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Studio Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1 space-y-8">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight galaxy-text">
            NexVerze AI Video Studio
          </h1>
          <p className="text-xs sm:text-sm text-white/50">
            Luma Ray 3, Kling v2.5 Turbo Pro, Veo 3.1 Fast • 1080x1920 Quality Lock
          </p>
        </div>

        {generationError && (
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div className="text-xs">
              <div className="font-bold text-red-300 text-sm">Generation Error</div>
              <p className="text-white/80 mt-1">{generationError}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Controls */}
          <div className="lg:col-span-6 bg-[#18181b] border border-[#27272a] rounded-3xl p-6 sm:p-7 space-y-6 shadow-xl">
            {/* Image-to-Video Box */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-white/60 mono flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-purple-400" />
                  <span>Upload Image (Optional Image-to-Video)</span>
                </label>
                <span className="text-[11px] text-white/40 mono">Same Credits</span>
              </div>

              {imageUrl ? (
                <div className="relative rounded-2xl border border-purple-500/40 p-2 bg-[#0f0f17] flex items-center gap-3">
                  <img src={imageUrl} alt="Uploaded" className="w-16 h-16 object-cover rounded-xl border border-white/10" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-white">Image-to-Video Active</div>
                    <p className="text-[11px] text-white/40 truncate">Model will animate starting image</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setImageUrl(null)}
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-red-500/20 text-white/60 hover:text-red-400 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-[#27272a] hover:border-purple-500/60 rounded-2xl p-4 text-center cursor-pointer transition-colors bg-[#0f0f17]/50 group"
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={(e) => {
                      if (e.target.files?.[0]) handleImageUpload(e.target.files[0]);
                    }}
                    accept="image/*"
                    className="hidden"
                  />
                  <Upload className="w-5 h-5 text-white/40 group-hover:text-purple-400 mx-auto transition-colors" />
                  <div className="text-xs font-medium text-white/70 mt-1">
                    Drag & drop image or <span className="text-purple-400 underline">browse</span>
                  </div>
                </div>
              )}
            </div>

            {/* Prompt Input */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-white/60 mono flex items-center gap-1.5">
                  <Wand2 className="w-3.5 h-3.5 text-purple-400" />
                  <span>Text Prompt</span>
                </label>
                <button
                  type="button"
                  onClick={handleEnhancePrompt}
                  disabled={isEnhancingPrompt}
                  className={`text-xs px-2.5 py-1 rounded-xl mono flex items-center gap-1.5 transition-all border ${
                    promptEnhancedSuccess
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-purple-600/15 hover:bg-purple-600/25 text-purple-300 border-purple-500/30 active:scale-95'
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
              </div>
              <textarea
                rows={3}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe your scene in cinematic detail..."
                className="w-full bg-[#0f0f17] border border-[#27272a] focus:border-purple-500 rounded-2xl p-3.5 text-sm text-white outline-none resize-none transition"
              />
            </div>

            {/* Model Selector 3 Buttons Grid with Badge + Modal Combo */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-white/60 mono">
                  AI Model Engine
                </label>
                <button
                  type="button"
                  onClick={() => setShowCompareDrawer(true)}
                  className="text-xs text-purple-400 hover:text-purple-300 mono flex items-center gap-1"
                >
                  <span>Compare Models</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {(['luma', 'kling', 'veo'] as const).map((mKey) => {
                  const m = MODEL_SPECS[mKey];
                  const isSelected = model === mKey;
                  const cost = MODEL_COST[mKey]?.[duration] || MODEL_COST[mKey]?.['8s'] || 50;

                  return (
                    <div
                      key={mKey}
                      onClick={() => setModel(mKey)}
                      className={`relative cursor-pointer p-3.5 rounded-2xl border text-left transition-all ${
                        isSelected
                          ? 'bg-purple-950/30 border-purple-500 text-white shadow-md shadow-purple-500/10'
                          : 'bg-[#0f0f17] border-[#27272a] text-white/60 hover:text-white'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setInfoModalKey(mKey);
                        }}
                        className="absolute top-2.5 right-2.5 p-1 rounded hover:bg-white/10 text-white/40 hover:text-white"
                      >
                        <HelpCircle className="w-3.5 h-3.5" />
                      </button>

                      <div className="font-bold text-xs text-white">{m.name}</div>
                      <div className="text-[10px] text-white/40 mono">{m.versionName}</div>

                      <div className="mt-2 text-[10px] font-mono text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20 inline-block">
                        {m.badge}
                      </div>

                      <div className="mt-2 flex items-baseline justify-between text-xs pt-1 border-t border-white/[0.05]">
                        <span className="mono font-bold text-purple-300">{cost}cr</span>
                        <span className="text-[10px] text-emerald-400 mono">₹{Math.round(cost * 0.7)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Duration Selector */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-white/60 mono flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-purple-400" />
                  <span>Duration</span>
                </label>
                <span className="mono text-[11px] text-purple-300 font-bold">{liveCost} credits (₹{Math.round(liveCost * 0.7)} value)</span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {(['5s', '8s', '10s'] as const).map((dur) => {
                  const isAvailable = MODEL_SPECS[model].durations.includes(dur);
                  const isSelected = duration === dur;
                  const durCost = MODEL_COST[model]?.[dur];

                  if (!isAvailable) {
                    return (
                      <div key={dur} className="py-2.5 px-3 rounded-xl border border-white/[0.04] bg-[#0f0f17]/40 text-center text-white/20 text-xs mono">
                        <div>{dur}</div>
                        <div className="text-[9px]">Not in {MODEL_SPECS[model].name}</div>
                      </div>
                    );
                  }

                  return (
                    <button
                      key={dur}
                      type="button"
                      onClick={() => setDuration(dur)}
                      className={`py-2.5 px-3 rounded-xl border text-center font-mono text-xs font-bold transition-all ${
                        isSelected ? 'bg-purple-600 text-white border-purple-500' : 'bg-[#0f0f17] border-[#27272a] text-white/70'
                      }`}
                    >
                      <div>{dur}</div>
                      <div className="text-[10px] opacity-80">{durCost}cr</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Aspect Ratio */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-white/60 mono flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-purple-400" />
                  <span>Aspect Ratio</span>
                </label>
                <span className="text-[10px] text-emerald-400 mono">Quality Lock: 1080x1920 Master</span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {(['9:16', '16:9', '1:1'] as const).map((ratio) => (
                  <button
                    key={ratio}
                    type="button"
                    onClick={() => setAspectRatio(ratio)}
                    className={`p-2.5 rounded-xl border text-center font-mono text-xs font-bold transition-all ${
                      aspectRatio === ratio ? 'bg-purple-600 text-white border-purple-500' : 'bg-[#0f0f17] border-[#27272a] text-white/60'
                    }`}
                  >
                    {ratio}
                  </button>
                ))}
              </div>
            </div>

            {/* Generate Action */}
            <div className="space-y-3 pt-2">
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold py-4 rounded-2xl shadow-xl shadow-purple-600/30 flex items-center justify-center gap-2 text-sm transition-transform active:scale-[0.99] disabled:opacity-60"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Rendering with {MODEL_SPECS[model].name} ({generationProgress}%)...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 fill-white" />
                    <span>Generate Video (-{liveCost} Credits)</span>
                    <ArrowRight className="w-4 h-4 opacity-70" />
                  </>
                )}
              </button>

              <div className="flex items-center justify-between text-[11px] mono text-white/40 px-1">
                <span>Balance: <strong className="text-purple-300">{user?.credits ?? 50}cr</strong></span>
                <span>After generate: <strong className="text-white">{Math.max(0, (user?.credits ?? 50) - liveCost)}cr</strong></span>
              </div>
            </div>
          </div>

          {/* Right Viewport Quality Lock */}
          <div className="lg:col-span-6 bg-[#18181b] border border-[#27272a] rounded-3xl p-6 sm:p-7 shadow-xl flex flex-col items-center">
            <div className="w-full flex items-center justify-between mb-4 pb-3 border-b border-[#27272a]">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>QUALITY LOCK VIEWPORT</span>
              </span>
              <div className="flex items-center gap-2">
                {/* Playback speed selector (0.5x, 1x, 2x) */}
                <div className="flex items-center gap-0.5 bg-[#0f0f17] border border-[#27272a] rounded-lg p-0.5 mono text-[10px]">
                  <span className="text-white/40 px-1 hidden sm:flex items-center gap-0.5">
                    <Gauge className="w-2.5 h-2.5" />
                  </span>
                  {([0.5, 1, 2] as const).map((spd) => (
                    <button
                      key={spd}
                      type="button"
                      onClick={() => {
                        setPlaybackSpeed(spd);
                        if (videoRef.current) {
                          videoRef.current.playbackRate = spd;
                        }
                      }}
                      className={`px-1.5 py-0.5 rounded font-semibold transition-all ${
                        playbackSpeed === spd
                          ? 'bg-purple-600 text-white shadow-xs'
                          : 'text-white/60 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      {spd}x
                    </button>
                  ))}
                </div>

                {/* Frame Smoothing Toggle */}
                <label
                  className={`flex items-center gap-1.5 cursor-pointer select-none border px-2.5 py-1 rounded-full text-xs mono transition-all ${
                    isFrameSmoothing
                      ? 'bg-purple-950/40 border-purple-500/60 text-purple-200'
                      : 'bg-[#0f0f17] border-[#27272a] hover:border-purple-500/40 text-white/70 hover:text-white'
                  }`}
                  title="Frame Smoothing: Applies CSS blur-transition interpolation to mimic high frame rate motion review"
                >
                  <input
                    type="checkbox"
                    checked={isFrameSmoothing}
                    onChange={(e) => setIsFrameSmoothing(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-purple-600 focus:ring-0 accent-purple-600 cursor-pointer"
                  />
                  <Layers className={`w-3 h-3 ${isFrameSmoothing ? 'text-purple-400 animate-pulse' : 'text-white/40'}`} />
                  <span className={isFrameSmoothing ? 'text-white font-medium' : 'text-white/50'}>Smoothing</span>
                </label>

                {/* Loop Video Checkbox */}
                <label className="flex items-center gap-1.5 cursor-pointer select-none bg-[#0f0f17] border border-[#27272a] hover:border-purple-500/40 px-2.5 py-1 rounded-full text-xs mono text-white/80 transition-colors">
                  <input
                    type="checkbox"
                    checked={isLooping}
                    onChange={(e) => setIsLooping(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-purple-600 focus:ring-0 accent-purple-600 cursor-pointer"
                  />
                  <Repeat className={`w-3 h-3 ${isLooping ? 'text-purple-400' : 'text-white/40'}`} />
                  <span className={isLooping ? 'text-white font-medium' : 'text-white/50'}>Loop</span>
                </label>
                <span className="mono text-[10px] bg-black/60 px-2.5 py-1 rounded-full text-purple-300 border border-white/10">
                  Crop: {aspectRatio}
                </span>
              </div>
            </div>

            <div
              className={`relative bg-[#0f0f17] rounded-2xl overflow-hidden border border-[#27272a] shadow-2xl transition-all duration-300 ${
                aspectRatio === '9:16'
                  ? 'aspect-[9/16] max-w-[320px] w-full'
                  : aspectRatio === '16:9'
                  ? 'aspect-[16/9] w-full'
                  : 'aspect-square max-w-[380px] w-full'
              }`}
            >
              <video
                ref={videoRef}
                src={currentVideoUrl}
                autoPlay
                loop={isLooping}
                muted={isMuted}
                playsInline
                crossOrigin="anonymous"
                className={`w-full h-full object-cover object-center transition-[filter] duration-300 ${
                  isFrameSmoothing ? 'frame-smoothing-active' : ''
                }`}
              />

              {/* FRAME SMOOTHING CSS BLUR-TRANSITION INTERPOLATION OVERLAY */}
              {isFrameSmoothing && (
                <div
                  className="absolute inset-0 z-10 pointer-events-none frame-interpolation-overlay mix-blend-screen transition-opacity duration-300"
                  aria-hidden="true"
                >
                  <div className="w-full h-full backdrop-blur-[0.5px] bg-gradient-to-t from-purple-500/[0.03] via-transparent to-transparent" />
                </div>
              )}

              {/* Mute / Unmute Overlay Button */}
              <button
                type="button"
                onClick={() => {
                  const next = !isMuted;
                  setIsMuted(next);
                  if (videoRef.current) {
                    videoRef.current.muted = next;
                  }
                }}
                className={`absolute top-3 right-3 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-lg backdrop-blur-md border text-[10px] mono font-semibold transition-all shadow-lg active:scale-95 ${
                  isMuted
                    ? 'bg-black/75 hover:bg-black/90 text-white/70 hover:text-white border-white/15'
                    : 'bg-purple-600/90 hover:bg-purple-500 text-white border-purple-400/50 shadow-purple-900/40'
                }`}
                title={isMuted ? 'Unmute Audio (Supported on Kling & Veo)' : 'Mute Audio'}
              >
                {isMuted ? (
                  <>
                    <VolumeX className="w-3.5 h-3.5 text-rose-400" />
                    <span>Muted</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-3.5 h-3.5 text-emerald-300 animate-pulse" />
                    <span>Sound On</span>
                  </>
                )}
              </button>
            </div>

            {/* Display beneath generated video: model name, duration, and timestamp */}
            <div className="mt-3.5 max-w-xl w-full bg-[#14141c] border border-purple-500/30 rounded-2xl p-3 sm:p-3.5 flex flex-wrap items-center justify-between gap-2.5 text-xs shadow-lg">
              <div className="flex items-center gap-2 sm:gap-2.5">
                <div className="flex items-center gap-1.5 bg-purple-500/15 border border-purple-500/30 px-2.5 py-1 rounded-xl text-purple-300 font-semibold mono">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  <span>{lastOutputInfo.modelName}</span>
                </div>

                <div className="flex items-center gap-1.5 bg-white/[0.04] border border-white/[0.08] px-2.5 py-1 rounded-xl text-white/80 mono">
                  <Clock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Duration: {lastOutputInfo.duration}</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-white/50 mono text-[11px] bg-white/[0.02] border border-white/[0.05] px-2.5 py-1 rounded-xl">
                <Calendar className="w-3.5 h-3.5 text-purple-400" />
                <span>
                  {new Date(lastOutputInfo.timestamp).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </div>

            <div className="mt-2.5 max-w-xl w-full bg-[#18181b]/70 border border-[#27272a] rounded-xl p-3 text-xs flex items-center justify-between gap-3 text-white/70">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-white text-[12px] flex items-center gap-1.5">
                    <span>CSS Lossless Crop Engine</span>
                    <span className="text-[10px] text-emerald-400 font-mono">100% Fidelity</span>
                  </div>
                  <p className="text-[11px] text-white/50">
                    Source: 1080×1920 Master • CSS viewport • Zero re-encode loss.
                  </p>
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExtractFrame}
                  disabled={isExtractingFrame}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-white/80 border border-white/[0.08] font-medium text-xs transition-colors"
                  title="Grab and save current frame as PNG"
                >
                  {frameExtractedSuccess ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Frame Saved</span>
                    </>
                  ) : (
                    <>
                      <Camera className="w-3.5 h-3.5 text-purple-400" />
                      <span>Extract Frame (PNG)</span>
                    </>
                  )}
                </button>
                <a
                  href={currentVideoUrl}
                  download="nexverze-studio.mp4"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 font-medium text-xs transition-colors"
                >
                  <Download className="w-3 h-3" />
                  <span>Save MP4</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Insufficient Credits Modal with 3 Packs */}
      {showInsufficientModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#18181b] border border-[#27272a] rounded-3xl max-w-lg w-full p-6 sm:p-7 space-y-5 relative">
            <button
              onClick={() => setShowInsufficientModal(false)}
              className="absolute top-5 right-5 text-white/40 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-purple-600/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
                <Coins className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Get Studio Credits</h3>
                <p className="text-xs text-white/50">
                  Current Balance: <strong className="text-purple-300 font-mono">{user?.credits ?? 50}cr</strong>
                </p>
              </div>
            </div>

            <div className="space-y-2.5">
              {RAZORPAY_PACKS.map((plan) => (
                <div
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan)}
                  className={`cursor-pointer p-3.5 rounded-2xl border transition-all flex items-center justify-between relative ${
                    selectedPlan.id === plan.id
                      ? 'bg-purple-950/30 border-purple-500 text-white shadow-md shadow-purple-500/10'
                      : 'bg-[#121217] border-[#27272a] text-white/70 hover:border-white/20'
                  }`}
                >
                  {plan.popular && (
                    <span className="absolute -top-2 right-4 px-2 py-0.5 bg-gradient-to-r from-purple-500 to-indigo-500 text-slate-950 text-[9px] font-bold rounded-full uppercase">
                      Most Popular
                    </span>
                  )}
                  <div>
                    <div className="font-semibold text-sm text-white flex items-center gap-1.5">
                      <span>{plan.name}</span>
                      <span className="text-purple-300 font-mono text-xs">(+{plan.credits}cr)</span>
                    </div>
                    <div className="text-[11px] text-white/50 mt-0.5">{plan.comparison}</div>
                  </div>
                  <div className="text-right font-mono font-bold text-white text-base">
                    ₹{plan.amount}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleRazorpayPay}
              disabled={isPaying}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 text-sm shadow-lg shadow-purple-600/25 transition-transform active:scale-[0.99]"
            >
              <CreditCard className="w-4 h-4" />
              <span>{isPaying ? 'Processing...' : `Pay ₹${selectedPlan.amount} via Razorpay (+${selectedPlan.credits}cr)`}</span>
            </button>
          </div>
        </div>
      )}

      {/* Model Specs Info Modal */}
      {infoModalKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#18181b] border border-[#27272a] rounded-3xl max-w-lg w-full p-6 sm:p-7 space-y-4 relative">
            <button
              onClick={() => setInfoModalKey(null)}
              className="absolute top-5 right-5 text-white/40 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="mono text-xs text-purple-300 bg-purple-500/10 px-2.5 py-1 rounded inline-block">
              {MODEL_SPECS[infoModalKey].badge}
            </div>
            <h3 className="text-xl font-bold">{MODEL_SPECS[infoModalKey].name} ({MODEL_SPECS[infoModalKey].versionName})</h3>
            <p className="text-xs text-white/60">{MODEL_SPECS[infoModalKey].desc}</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-[#121217] p-2.5 rounded-xl border border-[#27272a]">
                <div className="text-[10px] text-white/40">Speed</div>
                <div className="font-semibold">{MODEL_SPECS[infoModalKey].speed}</div>
              </div>
              <div className="bg-[#121217] p-2.5 rounded-xl border border-[#27272a]">
                <div className="text-[10px] text-white/40">Quality</div>
                <div className="font-semibold">{MODEL_SPECS[infoModalKey].quality}</div>
              </div>
              <div className="bg-[#121217] p-2.5 rounded-xl border border-[#27272a]">
                <div className="text-[10px] text-white/40">Audio</div>
                <div className="font-semibold">{MODEL_SPECS[infoModalKey].audio}</div>
              </div>
              <div className="bg-[#121217] p-2.5 rounded-xl border border-[#27272a]">
                <div className="text-[10px] text-white/40">Durations</div>
                <div className="font-semibold mono">{MODEL_SPECS[infoModalKey].durations.join(' • ')}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Compare Models Bottom Drawer */}
      {showCompareDrawer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#18181b] border border-[#27272a] rounded-3xl max-w-3xl w-full p-6 space-y-4 relative">
            <button
              onClick={() => setShowCompareDrawer(false)}
              className="absolute top-5 right-5 text-white/40 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold">Compare AI Video Models</h3>
            <div className="overflow-x-auto rounded-xl border border-[#27272a]">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#121217] text-white/60 mono border-b border-[#27272a]">
                  <tr>
                    <th className="p-3">Model</th>
                    <th className="p-3">Speed</th>
                    <th className="p-3">Quality</th>
                    <th className="p-3">Audio</th>
                    <th className="p-3">Credits</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#27272a] text-white/80">
                  <tr>
                    <td className="p-3 font-semibold text-purple-300">Luma Fast (Ray 3)</td>
                    <td className="p-3 mono">45-60s</td>
                    <td className="p-3">1080p Crystal</td>
                    <td className="p-3 text-white/40">No Audio</td>
                    <td className="p-3 mono text-purple-300">50cr / 80cr / 100cr</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-indigo-300">Kling Pro (v2.5 Turbo)</td>
                    <td className="p-3 mono">90-120s</td>
                    <td className="p-3">1080p HDR</td>
                    <td className="p-3 text-emerald-400">Ambient Sound</td>
                    <td className="p-3 mono text-indigo-300">120cr / 192cr / 240cr</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-pink-300">Veo Ultra (3.1 Fast)</td>
                    <td className="p-3 mono">2-3m</td>
                    <td className="p-3">Cinema 1080p</td>
                    <td className="p-3 text-emerald-400">Voice & Foley</td>
                    <td className="p-3 mono text-pink-300">— / 400cr / 500cr</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <footer className="w-full bg-[#08080d] border-t border-white/[0.06] py-8 px-4 text-center mono text-xs text-white/40">
        © 2025–2026 NexVerze Technologies. Registered: Tirupur | Operations: Chennai, India.
      </footer>
    </div>
  );
}
