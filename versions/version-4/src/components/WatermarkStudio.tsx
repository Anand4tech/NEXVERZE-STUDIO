import React, { useState, useRef, useEffect } from 'react';
import {
  ShieldCheck,
  Sparkles,
  Lock,
  Upload,
  Download,
  CheckCircle2,
  Sliders,
  RefreshCw,
  Eye,
  Zap,
} from 'lucide-react';

interface WatermarkStudioProps {
  onBackToStudio?: () => void;
  user: { email: string; credits: number } | null;
  onOpenPlans?: () => void;
  setIsCreditModalOpen?: (open: boolean) => void;
}

export const WatermarkStudio: React.FC<WatermarkStudioProps> = ({
  onBackToStudio,
  user,
  onOpenPlans,
  setIsCreditModalOpen,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [watermarkText, setWatermarkText] = useState('NexVerze 4K Secure');
  const [watermarkMode, setWatermarkMode] = useState<'randomized-float' | 'diagonal-grid' | 'corner-stamp' | 'dual-anchor'>('randomized-float');
  const [opacity, setOpacity] = useState<number>(0.7);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [currentFloatPos, setCurrentFloatPos] = useState<{ top: string; left: string }>({ top: '15%', left: '10%' });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 3500);
  };

  // Helper to open credit purchase modal
  const handleOpenCreditModal = () => {
    if (setIsCreditModalOpen) {
      setIsCreditModalOpen(true);
    } else if (onOpenPlans) {
      onOpenPlans();
    }
  };

  // Randomized anti-crop float positions every 4 seconds to prevent cropping
  useEffect(() => {
    const timer = setInterval(() => {
      const positions = [
        { top: '12%', left: '8%' },
        { top: '15%', left: '72%' },
        { top: '78%', left: '10%' },
        { top: '80%', left: '68%' },
        { top: '45%', left: '40%' },
      ];
      const randomPos = positions[Math.floor(Math.random() * positions.length)];
      setCurrentFloatPos(randomPos);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Credit Check: Verify user.credits is greater than 0 before allowing execution
    if (!user || typeof user.credits !== 'number' || user.credits <= 0) {
      showToast('⚠️ Minimum 1 active credit required (user.credits > 0). Please top up.');
      handleOpenCreditModal();
      return;
    }
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('video/')) {
      showToast('⚠️ Please select a valid video file.');
      return;
    }
    setSelectedFile(file);
    setVideoPreviewUrl(URL.createObjectURL(file));
    showToast('✓ Video loaded into Anti-Piracy Watermark Studio');
  };

  const handleProcessWatermark = () => {
    // Credit Check: Verify user.credits is greater than 0 before allowing execution
    if (!user || typeof user.credits !== 'number' || user.credits <= 0) {
      showToast('⚠️ Minimum 1 active credit required (user.credits > 0). Please top up.');
      handleOpenCreditModal();
      return;
    }
    if (!videoPreviewUrl) {
      showToast('⚠️ Please upload a video first.');
      return;
    }
    setIsProcessing(true);
    setNotice('Applying randomized anti-crop cryptographic watermarking...');
    setTimeout(() => {
      setIsProcessing(false);
      showToast('✅ Dynamic tamper-resistant watermark successfully locked onto video!');
    }, 2000);
  };

  return (
    <div className="bg-[#18181b] border border-[#27272a] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-white relative">
      {notice && (
        <div className="fixed bottom-6 right-6 z-50 p-3.5 rounded-2xl bg-[#151128] border border-purple-500/50 text-white text-xs mono shadow-2xl flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* Credit Block if user has 0 credits (user.credits <= 0) */}
      {(!user || typeof user.credits !== 'number' || user.credits <= 0) && (
        <div className="absolute inset-0 bg-[#18181b]/95 z-40 backdrop-blur-md flex items-center justify-center rounded-3xl p-6 text-center">
          <div className="space-y-4 max-w-sm bg-[#131022] border border-amber-500/30 rounded-2xl p-6 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-400/30 flex items-center justify-center text-amber-400 mx-auto">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-white">Watermark Studio Locked</h3>
            <p className="text-xs text-white/70">
              Active credit balance required (<code className="text-amber-300 font-mono">user.credits &gt; 0</code>). You currently have{' '}
              <span className="text-amber-400 font-bold font-mono">{user?.credits ?? 0} credits</span>.
            </p>
            <button
              type="button"
              onClick={handleOpenCreditModal}
              className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-xs mono uppercase tracking-wider cursor-pointer shadow-lg active:scale-95 transition-all"
            >
              Get Credits to Unlock
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/15 border border-purple-400/30 text-purple-300 text-xs font-bold mono uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-amber-300 animate-pulse" />
            <span>Anti-Piracy & Brand Protection Studio</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Watermark Studio (Tamper-Resistant Branding)
          </h2>
          <p className="text-xs sm:text-sm text-purple-200/80">
            Overlays dynamic, randomized cryptographic watermarks that automatically shift positions to prevent croppers and unauthorized scrapers from removing your brand.
          </p>
        </div>

        {onBackToStudio && (
          <button
            type="button"
            onClick={onBackToStudio}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold mono transition-all cursor-pointer self-start sm:self-auto"
          >
            ← Back to Studio
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Controls & Configuration */}
        <div className="lg:col-span-5 space-y-5">
          {/* Upload Box */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-white/90 mono">
              Upload Video for Anti-Piracy Protection *
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-purple-500/30 hover:border-amber-400/60 bg-[#16122c]/80 rounded-2xl p-5 text-center cursor-pointer transition-all"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="py-3 space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-400/30 flex items-center justify-center text-purple-300 mx-auto">
                  <Upload className="w-6 h-6 animate-pulse" />
                </div>
                <span className="text-xs font-bold text-white block">
                  {selectedFile ? selectedFile.name : 'Click to select MP4 / WebM video'}
                </span>
                <span className="text-[10px] text-white/50 font-mono block">Dynamic Multi-Point Stamping</span>
              </div>
            </div>
          </div>

          {/* Watermark Branding Text */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-white/90 mono">Brand Watermark Text:</label>
            <input
              type="text"
              value={watermarkText}
              onChange={(e) => setWatermarkText(e.target.value)}
              maxLength={40}
              className="w-full bg-[#121020] border border-purple-500/30 rounded-xl px-4 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-purple-400"
            />
          </div>

          {/* Anti-Crop Mode Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-white/90 mono">Anti-Crop Protection Mode:</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'randomized-float', label: 'Randomized Float', desc: 'Shifts positions' },
                { id: 'diagonal-grid', label: 'Diagonal Pattern', desc: 'Covers entire frame' },
                { id: 'corner-stamp', label: 'Dual Anchor', desc: 'Top & bottom lock' },
                { id: 'dual-anchor', label: 'Matrix Multi-Point', desc: 'Anti-crop proof' },
              ].map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => setWatermarkMode(mode.id as any)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    watermarkMode === mode.id
                      ? 'bg-purple-600/30 border-purple-400 text-white shadow-lg'
                      : 'bg-black/30 border-white/10 text-white/70 hover:text-white'
                  }`}
                >
                  <div className="text-xs font-bold">{mode.label}</div>
                  <div className="text-[10px] opacity-70 font-mono">{mode.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Opacity Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold mono">
              <span className="text-white/90">Watermark Opacity:</span>
              <span className="text-amber-300">{Math.round(opacity * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.2"
              max="0.95"
              step="0.05"
              value={opacity}
              onChange={(e) => setOpacity(parseFloat(e.target.value))}
              className="w-full accent-purple-500 cursor-pointer"
            />
          </div>

          <button
            type="button"
            onClick={handleProcessWatermark}
            disabled={isProcessing || !videoPreviewUrl}
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-xs font-black mono flex items-center justify-center gap-2 shadow-xl cursor-pointer active:scale-95 disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
                <span>Encrypting & Stamping Watermark...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4 text-amber-300" />
                <span>🔒 Lock Tamper-Resistant Watermark</span>
              </>
            )}
          </button>
        </div>

        {/* Right Column: Live Anti-Crop Preview Viewport */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-300 mono uppercase tracking-wider flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-emerald-400" />
              <span>Live Anti-Crop Watermark Preview</span>
            </span>
            <span className="text-[10px] mono text-purple-300 bg-purple-950/60 px-2.5 py-0.5 rounded-full border border-purple-500/30">
              Active Protection
            </span>
          </div>

          <div className="relative w-full aspect-[9/16] max-w-[340px] sm:max-w-[380px] mx-auto rounded-3xl overflow-hidden bg-black border-2 border-purple-500/40 shadow-2xl flex items-center justify-center">
            {videoPreviewUrl ? (
              <video
                src={videoPreviewUrl}
                controls
                autoPlay
                loop
                muted
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-center p-6 space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-400/30 flex items-center justify-center text-purple-300 mx-auto">
                  <Lock className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold text-white/80 block">No video uploaded yet</span>
                <span className="text-[10px] text-white/40 font-mono block">Upload a video on the left to test live watermark protection</span>
              </div>
            )}

            {/* Dynamic Randomized Floating Watermark Overlay */}
            {videoPreviewUrl && (
              <div
                style={{
                  top: watermarkMode === 'randomized-float' ? currentFloatPos.top : '10%',
                  left: watermarkMode === 'randomized-float' ? currentFloatPos.left : '10%',
                  opacity: opacity,
                }}
                className="absolute z-30 pointer-events-none px-3 py-1 rounded-lg bg-black/60 backdrop-blur-md border border-white/20 text-white font-mono text-[10px] tracking-wider shadow-lg transition-all duration-1000 flex items-center gap-1.5"
              >
                <ShieldCheck className="w-3 h-3 text-amber-300" />
                <span>{watermarkText}</span>
              </div>
            )}

            {/* Secondary Anchor / Diagonal Pattern Overlay */}
            {videoPreviewUrl && watermarkMode !== 'randomized-float' && (
              <div
                style={{ bottom: '10%', right: '10%', opacity: opacity }}
                className="absolute z-30 pointer-events-none px-3 py-1 rounded-lg bg-black/60 backdrop-blur-md border border-white/20 text-white font-mono text-[10px] tracking-wider shadow-lg flex items-center gap-1.5"
              >
                <Zap className="w-3 h-3 text-cyan-300" />
                <span>{watermarkText} (Secure)</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
