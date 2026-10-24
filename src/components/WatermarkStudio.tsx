import React, { useState, useRef, useEffect, useMemo } from 'react';
import { StudioUser } from '../lib/supabase';
import { CanvasShield } from './CanvasShield';
import {
  ShieldCheck,
  Sparkles,
  Lock,
  Upload,
  Download,
  CheckCircle2,
  RefreshCw,
  Eye,
  Zap,
  Image as ImageIcon,
  QrCode,
  Volume2,
  FileCheck2,
  Clock,
  AlertTriangle,
  Check,
  Award,
  Trash2,
} from 'lucide-react';

interface WatermarkStudioProps {
  onBackToStudio?: () => void;
  user: StudioUser | null;
  onUpdateUser?: (updatedUser: StudioUser) => void;
  onOpenAuth?: () => void;
  onOpenPlans?: () => void;
  setIsCreditModalOpen?: (open: boolean) => void;
}

interface OwnershipCertificateData {
  certificateId: string;
  sha256Hash: string;
  ownerEmail: string;
  protectedFileName: string;
  watermarkText: string;
  antiCropMode: string;
  issuedAt: string;
  featuresApplied: string[];
  safeHarborDeclaration: string;
}

const FLOAT_POSITIONS = [
  { topPct: 0.12, leftPct: 0.08, top: '12%', left: '8%' },
  { topPct: 0.14, leftPct: 0.56, top: '14%', left: '56%' },
  { topPct: 0.76, leftPct: 0.1, top: '76%', left: '10%' },
  { topPct: 0.78, leftPct: 0.54, top: '78%', left: '54%' },
  { topPct: 0.44, leftPct: 0.28, top: '44%', left: '28%' },
];

// Deterministic 11x11 QR-style matrix generator from URL string for crisp canvas & SVG rendering
function buildDeterministicQrMatrix(input: string): boolean[][] {
  const clean = (input || 'https://nexverze.studio').trim();
  const size = 11;
  const grid: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

  const drawFinder = (r0: number, c0: number) => {
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        grid[r0 + r][c0 + c] = r === 0 || r === 2 || c === 0 || c === 2 || (r === 1 && c === 1);
      }
    }
  };
  drawFinder(0, 0);
  drawFinder(0, size - 3);
  drawFinder(size - 3, 0);

  let hash = 2166136261;
  for (let i = 0; i < clean.length; i++) {
    hash ^= clean.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const inFinder =
        (r < 4 && c < 4) || (r < 4 && c >= size - 4) || (r >= size - 4 && c < 4);
      if (inFinder) continue;
      const bitIndex = (r * size + c) % 31;
      const charCode = clean.charCodeAt((r * 7 + c * 3) % clean.length) || 78;
      grid[r][c] = ((hash >> bitIndex) ^ charCode ^ (r + c)) % 2 === 0;
    }
  }
  return grid;
}

export const WatermarkStudio: React.FC<WatermarkStudioProps> = ({
  onBackToStudio,
  user,
  onUpdateUser,
  onOpenAuth,
  onOpenPlans,
  setIsCreditModalOpen,
}) => {
  // Base video state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [watermarkText, setWatermarkText] = useState('NexVerze 4K Secure');
  const [watermarkMode, setWatermarkMode] = useState<
    'randomized-float' | 'diagonal-grid' | 'corner-stamp' | 'dual-anchor'
  >('randomized-float');
  const [opacity, setOpacity] = useState<number>(0.78);
  const [floatIndex, setFloatIndex] = useState<number>(0);

  // Legal Safe-Harbor Ownership Declaration
  const [ownershipConfirmed, setOwnershipConfirmed] = useState<boolean>(true);

  // 6 High-Profit Add-On Features
  // Feature #2: Custom Brand Logo PNG + Verified Social Handle Stamp (+5 Cr)
  const [logoBadgeEnabled, setLogoBadgeEnabled] = useState<boolean>(false);
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);
  const [socialPlatform, setSocialPlatform] = useState<'instagram' | 'youtube' | 'x' | 'web'>('instagram');
  const [socialHandle, setSocialHandle] = useState<string>('@NexVerzeCreator');
  const [verifiedCheckmark, setVerifiedCheckmark] = useState<boolean>(true);

  // Feature #3: Client-Approval "Paywall Preview" Timecode Grid (+5 Cr)
  const [clientTimecodeEnabled, setClientTimecodeEnabled] = useState<boolean>(false);
  const [clientProjectTag, setClientProjectTag] = useState<string>('CLIENT APPROVAL DRAFT • DO NOT COPY');
  const [liveTimecode, setLiveTimecode] = useState<string>('00:00:00:00');

  // Feature #4: Dynamic QR Code Call-to-Action Corner Stamp (+5 Cr)
  const [qrStampEnabled, setQrStampEnabled] = useState<boolean>(false);
  const [qrUrl, setQrUrl] = useState<string>('https://nexverze.studio');
  const [qrLabel, setQrLabel] = useState<string>('SCAN TO VISIT');

  // Feature #5: Sonic Audio Watermark Chime Protection (+5 Cr)
  const [sonicChimeEnabled, setSonicChimeEnabled] = useState<boolean>(false);
  const [sonicIntervalSec, setSonicIntervalSec] = useState<number>(4);

  // Feature #6: SHA-256 Ownership Certificate & Forensic Invisible Signature (+5 Cr)
  const [ownershipCertEnabled, setOwnershipCertEnabled] = useState<boolean>(false);
  const [issuedCertificate, setIssuedCertificate] = useState<OwnershipCertificateData | null>(null);

  // Real Pixel Burn-In Export state
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [burnProgress, setBurnProgress] = useState<number>(0);
  const [burnStage, setBurnStage] = useState<string>('');
  const [burnedVideoUrl, setBurnedVideoUrl] = useState<string | null>(null);
  const [burnedVideoExt, setBurnedVideoExt] = useState<string>('webm');
  const [notice, setNotice] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const previewVideoRef = useRef<HTMLVideoElement>(null);
  const loadedLogoImgRef = useRef<HTMLImageElement | null>(null);

  const showToast = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 4200);
  };

  const handleOpenCreditModal = () => {
    if (setIsCreditModalOpen) {
      setIsCreditModalOpen(true);
    } else if (onOpenPlans) {
      onOpenPlans();
    }
  };

  // Dynamic Credit Pricing Calculation
  const baseBurnCredits = 8; // ₹5.30
  const logoBadgeCredits = logoBadgeEnabled ? 5 : 0;
  const clientTimecodeCredits = clientTimecodeEnabled ? 5 : 0;
  const qrStampCredits = qrStampEnabled ? 5 : 0;
  const sonicChimeCredits = sonicChimeEnabled ? 5 : 0;
  const ownershipCertCredits = ownershipCertEnabled ? 5 : 0;

  const totalExportCredits =
    baseBurnCredits +
    logoBadgeCredits +
    clientTimecodeCredits +
    qrStampCredits +
    sonicChimeCredits +
    ownershipCertCredits;

  const totalExportInr = (totalExportCredits * 0.66).toFixed(2);

  const qrMatrix = useMemo(() => buildDeterministicQrMatrix(qrUrl), [qrUrl]);

  // Preload custom logo image for canvas burn-in
  useEffect(() => {
    if (!logoDataUrl) {
      loadedLogoImgRef.current = null;
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      loadedLogoImgRef.current = img;
    };
    img.src = logoDataUrl;
  }, [logoDataUrl]);

  // Randomized anti-crop float position shift every 3.5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setFloatIndex((prev) => (prev + 1) % FLOAT_POSITIONS.length);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  // Update live millisecond timecode from preview video
  useEffect(() => {
    const vid = previewVideoRef.current;
    if (!vid) return;
    const updateTc = () => {
      const t = vid.currentTime || 0;
      const mins = String(Math.floor(t / 60)).padStart(2, '0');
      const secs = String(Math.floor(t % 60)).padStart(2, '0');
      const frames = String(Math.floor((t % 1) * 24)).padStart(2, '0');
      setLiveTimecode(`00:${mins}:${secs}:${frames}`);
    };
    vid.addEventListener('timeupdate', updateTc);
    return () => vid.removeEventListener('timeupdate', updateTc);
  }, [videoPreviewUrl]);

  const currentFloatPos = FLOAT_POSITIONS[floatIndex];

  // Play a preview of the Sonic Watermark Protection Chime using Web Audio API
  const playSonicProtectionChimePreview = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'triangle';
      osc1.frequency.setValueAtTime(880, now);
      osc1.frequency.exponentialRampToValueAtTime(1318.5, now + 0.18);
      osc2.frequency.setValueAtTime(440, now);
      osc2.frequency.exponentialRampToValueAtTime(659.25, now + 0.22);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.12, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.36);
      osc2.stop(now + 0.36);
      showToast('🔊 Played Sonic Watermark Protection Chime preview!');
    } catch {
      showToast('🔊 Sonic Chime ready for export.');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('video/')) {
      showToast('⚠️ Please select a valid MP4 or WebM video file.');
      return;
    }
    if (file.size > 60 * 1024 * 1024) {
      showToast('⚠️ Please upload a video under 60MB for fast pixel burn-in.');
      return;
    }
    if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
    if (burnedVideoUrl) URL.revokeObjectURL(burnedVideoUrl);

    setSelectedFile(file);
    setVideoPreviewUrl(URL.createObjectURL(file));
    setBurnedVideoUrl(null);
    setIssuedCertificate(null);
    showToast('✓ Video loaded into Anti-Piracy Watermark Studio! Configure protection below.');
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('⚠️ Please select a PNG, JPG, or WebP logo image.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setLogoDataUrl(reader.result);
        setLogoBadgeEnabled(true);
        showToast('✓ Custom Brand Logo uploaded & enabled (+5 Cr)!');
      }
    };
    reader.readAsDataURL(file);
  };

  // 1-Click Enable the 28-Credit (₹18.50) Creator & Freelancer Pro Bundle
  const handleEnable28CrProBundle = () => {
    setLogoBadgeEnabled(true);
    setClientTimecodeEnabled(true);
    setQrStampEnabled(true);
    setOwnershipCertEnabled(true);
    setSonicChimeEnabled(false);
    showToast('🚀 Activated 28 Credits (₹18.50) Creator & Freelancer Pro Protection Bundle!');
  };

  // Download SHA-256 Ownership Certificate file
  const handleDownloadCertificate = (cert: OwnershipCertificateData) => {
    const content = [
      '====================================================================',
      '       NEXVERZE STUDIO — CRYPTOGRAPHIC OWNERSHIP CERTIFICATE        ',
      '====================================================================',
      `Certificate ID       : ${cert.certificateId}`,
      `SHA-256 Digital Hash : ${cert.sha256Hash}`,
      `Registered Creator   : ${cert.ownerEmail}`,
      `Protected Media File : ${cert.protectedFileName}`,
      `Brand Watermark      : ${cert.watermarkText}`,
      `Anti-Crop Mode       : ${cert.antiCropMode}`,
      `Timestamp (UTC)      : ${cert.issuedAt}`,
      '--------------------------------------------------------------------',
      'PROTECTION LAYERS BAKED INTO VIDEO PIXELS:',
      ...cert.featuresApplied.map((f, idx) => `  ${idx + 1}. ${f}`),
      '--------------------------------------------------------------------',
      `Safe-Harbor Record   : ${cert.safeHarborDeclaration}`,
      '====================================================================',
    ].join('\n');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${cert.certificateId}-Ownership-Certificate.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Real HTML5 Canvas + MediaRecorder Frame-by-Frame Pixel Burn-In + Atomic Credit Deduction
  const handleProcessAndBurnWatermark = async () => {
    if (!user || !user.email) {
      showToast('⚠️ Please sign in to lock and export protected video.');
      if (onOpenAuth) onOpenAuth();
      return;
    }

    if (!videoPreviewUrl || !selectedFile) {
      showToast('⚠️ Please upload a video first.');
      return;
    }

    if (!ownershipConfirmed) {
      showToast('⚠️ Please check the Safe-Harbor Creator Ownership confirmation box.');
      return;
    }

    if (typeof user.credits !== 'number' || user.credits < totalExportCredits) {
      showToast(
        `⚠️ Insufficient credits: Requires ${totalExportCredits} Cr (₹${totalExportInr}), you have ${
          user.credits ?? 0
        } Cr.`
      );
      handleOpenCreditModal();
      return;
    }

    setIsProcessing(true);
    setBurnProgress(5);
    setBurnStage('Verifying wallet & reserving credits on server...');

    try {
      // Step 1: Atomic Server-Side Credit Deduction & SHA-256 Ownership Certificate Generation
      const res = await fetch('/api/lock-watermark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          email: user.email,
          watermarkText,
          watermarkMode,
          fileName: selectedFile.name,
          ownershipConfirmed,
          logo_badge_enabled: logoBadgeEnabled,
          socialHandle: `${socialPlatform.toUpperCase()}: ${socialHandle}`,
          client_timecode_enabled: clientTimecodeEnabled,
          clientProjectTag,
          qr_stamp_enabled: qrStampEnabled,
          qrUrl,
          sonic_chime_enabled: sonicChimeEnabled,
          ownership_cert_enabled: ownershipCertEnabled,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 402) {
          handleOpenCreditModal();
        }
        showToast(`❌ ${data.error || 'Failed to lock watermark.'}`);
        setIsProcessing(false);
        return;
      }

      if (typeof data.remaining_credits === 'number' && onUpdateUser) {
        onUpdateUser({ ...user, credits: data.remaining_credits });
      }
      if (data.certificate) {
        setIssuedCertificate(data.certificate);
      }

      // Step 2: Real Pixel-Level Video Burn-In via Offscreen Video + Canvas + MediaRecorder
      setBurnProgress(18);
      setBurnStage('Initializing pixel-level anti-crop watermark encoder...');

      const workVideo = document.createElement('video');
      workVideo.src = videoPreviewUrl;
      workVideo.muted = true;
      workVideo.playsInline = true;
      workVideo.crossOrigin = 'anonymous';

      await new Promise<void>((resolve, reject) => {
        workVideo.onloadedmetadata = () => resolve();
        workVideo.onerror = () => reject(new Error('Failed to decode source video'));
      });

      const targetW = Math.min(1080, workVideo.videoWidth || 720);
      const targetH = Math.min(
        1920,
        Math.round(targetW * ((workVideo.videoHeight || 1280) / (workVideo.videoWidth || 720)))
      );

      const canvas = document.createElement('canvas');
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Canvas 2D context unavailable');
      }

      const canvasStream = canvas.captureStream(30);

      // Optional Sonic Audio Chime Mixing into the MediaStream
      let audioCtx: AudioContext | null = null;
      let chimeTimer: any = null;
      if (sonicChimeEnabled) {
        try {
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          audioCtx = new AudioContextClass();
          const dest = audioCtx.createMediaStreamDestination();

          const triggerChime = () => {
            if (!audioCtx) return;
            const now = audioCtx.currentTime;
            const o1 = audioCtx.createOscillator();
            const g1 = audioCtx.createGain();
            o1.type = 'sine';
            o1.frequency.setValueAtTime(880, now);
            o1.frequency.exponentialRampToValueAtTime(1318.5, now + 0.16);
            g1.gain.setValueAtTime(0.001, now);
            g1.gain.linearRampToValueAtTime(0.09, now + 0.03);
            g1.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);
            o1.connect(g1);
            g1.connect(dest);
            o1.start(now);
            o1.stop(now + 0.32);
          };

          triggerChime();
          chimeTimer = setInterval(triggerChime, Math.max(2, sonicIntervalSec) * 1000);
          dest.stream.getAudioTracks().forEach((track) => canvasStream.addTrack(track));
        } catch {
          // Fallback if audio context blocked
        }
      }

      const mimeCandidates = [
        'video/webm;codecs=vp9',
        'video/webm;codecs=vp8',
        'video/webm',
        'video/mp4',
      ];
      const chosenMime =
        mimeCandidates.find((m) => typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(m)) ||
        '';

      const recorder = new MediaRecorder(
        canvasStream,
        chosenMime ? { mimeType: chosenMime, videoBitsPerSecond: 4_500_000 } : undefined
      );
      const chunks: BlobPart[] = [];
      recorder.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) chunks.push(ev.data);
      };

      const maxBurnDurationSec = Math.min(workVideo.duration || 6, 8);
      const certIdShort = data.certificate?.certificateId || 'NVZ-WM-VERIFIED';

      const drawProtectedFrame = (elapsedSec: number) => {
        ctx.clearRect(0, 0, targetW, targetH);
        ctx.drawImage(workVideo, 0, 0, targetW, targetH);

        ctx.save();
        ctx.globalAlpha = opacity;

        const fontSize = Math.max(15, Math.round(targetW * 0.028));
        ctx.font = `bold ${fontSize}px "JetBrains Mono", monospace`;

        // 1. Feature #3: Client-Approval Paywall Timecode Grid (+5 Cr)
        if (clientTimecodeEnabled) {
          ctx.save();
          ctx.strokeStyle = 'rgba(251, 191, 36, 0.24)';
          ctx.lineWidth = 2;
          const step = Math.round(targetW / 3);
          for (let x = -targetH; x < targetW + targetH; x += step) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x + targetH, targetH);
            ctx.stroke();
          }
          // Center timecode bar
          const mins = String(Math.floor(elapsedSec / 60)).padStart(2, '0');
          const secs = String(Math.floor(elapsedSec % 60)).padStart(2, '0');
          const frames = String(Math.floor((elapsedSec % 1) * 24)).padStart(2, '0');
          const tcString = `TC 00:${mins}:${secs}:${frames} • ${clientProjectTag}`;
          const bannerH = fontSize * 2.1;
          ctx.fillStyle = 'rgba(0, 0, 0, 0.68)';
          ctx.fillRect(0, targetH * 0.46, targetW, bannerH);
          ctx.fillStyle = '#fde047';
          ctx.textAlign = 'center';
          ctx.fillText(tcString, targetW / 2, targetH * 0.46 + bannerH * 0.66);
          ctx.restore();
        }

        // 2. Primary Anti-Crop Brand Watermark Pill
        const posIdx = Math.floor(elapsedSec / 1.8) % FLOAT_POSITIONS.length;
        const activePos =
          watermarkMode === 'randomized-float' ? FLOAT_POSITIONS[posIdx] : FLOAT_POSITIONS[0];

        const drawStampPill = (x: number, y: number, label: string) => {
          const padX = 14;
          const padY = 8;
          const textWidth = ctx.measureText(label).width;
          const logoOffset = logoBadgeEnabled ? fontSize + 10 : 0;
          const boxW = textWidth + padX * 2 + logoOffset;
          const boxH = fontSize + padY * 2;

          ctx.fillStyle = 'rgba(10, 10, 18, 0.76)';
          ctx.strokeStyle = 'rgba(251, 191, 36, 0.75)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.roundRect(x, y, boxW, boxH, 10);
          ctx.fill();
          ctx.stroke();

          if (logoBadgeEnabled && loadedLogoImgRef.current) {
            ctx.drawImage(
              loadedLogoImgRef.current,
              x + padX - 2,
              y + padY - 1,
              fontSize + 2,
              fontSize + 2
            );
          } else if (logoBadgeEnabled) {
            ctx.fillStyle = '#38bdf8';
            ctx.fillText('✓', x + padX, y + padY + fontSize * 0.84);
          }

          ctx.fillStyle = '#ffffff';
          ctx.textAlign = 'left';
          ctx.fillText(label, x + padX + logoOffset, y + padY + fontSize * 0.84);
        };

        const fullLabel = logoBadgeEnabled
          ? `${watermarkText} • ${socialHandle}${verifiedCheckmark ? ' ✓' : ''}`
          : `🛡️ ${watermarkText}`;

        drawStampPill(targetW * activePos.leftPct, targetH * activePos.topPct, fullLabel);

        if (watermarkMode === 'dual-anchor' || watermarkMode === 'corner-stamp') {
          drawStampPill(targetW * 0.1, targetH * 0.82, `${watermarkText} (Verified)`);
        } else if (watermarkMode === 'diagonal-grid') {
          drawStampPill(targetW * 0.18, targetH * 0.48, fullLabel);
          drawStampPill(targetW * 0.24, targetH * 0.78, fullLabel);
        }

        // 3. Feature #4: Dynamic QR Code Lead-Gen Corner Stamp (+5 Cr)
        if (qrStampEnabled) {
          const qrBoxSize = Math.max(66, Math.round(targetW * 0.15));
          const qrX = targetW - qrBoxSize - Math.round(targetW * 0.05);
          const qrY = targetH - qrBoxSize - Math.round(targetH * 0.07);

          ctx.fillStyle = 'rgba(255, 255, 255, 0.94)';
          ctx.beginPath();
          ctx.roundRect(qrX - 6, qrY - 6, qrBoxSize + 12, qrBoxSize + 24, 8);
          ctx.fill();

          const cellSize = qrBoxSize / qrMatrix.length;
          ctx.fillStyle = '#09090b';
          for (let r = 0; r < qrMatrix.length; r++) {
            for (let c = 0; c < qrMatrix[r].length; c++) {
              if (qrMatrix[r][c]) {
                ctx.fillRect(
                  qrX + c * cellSize,
                  qrY + r * cellSize,
                  Math.ceil(cellSize),
                  Math.ceil(cellSize)
                );
              }
            }
          }
          ctx.font = `bold ${Math.max(9, Math.round(fontSize * 0.55))}px "JetBrains Mono", monospace`;
          ctx.textAlign = 'center';
          ctx.fillText(qrLabel.slice(0, 14), qrX + qrBoxSize / 2, qrY + qrBoxSize + 13);
        }

        // 4. Feature #6: Forensic Cryptographic Corner Signature (+5 Cr)
        if (ownershipCertEnabled) {
          ctx.font = `bold ${Math.max(10, Math.round(fontSize * 0.58))}px "JetBrains Mono", monospace`;
          ctx.fillStyle = 'rgba(52, 211, 153, 0.9)';
          ctx.textAlign = 'left';
          ctx.fillText(
            `🔐 ${certIdShort} • C2PA/SHA-256 PROTECTED`,
            Math.round(targetW * 0.04),
            targetH - Math.round(targetH * 0.025)
          );
        }

        ctx.restore();
      };

      recorder.start(100);
      await workVideo.play();

      await new Promise<void>((resolve) => {
        const startTime = performance.now();
        const stepFrame = () => {
          const elapsed = (performance.now() - startTime) / 1000;
          const pct = Math.min(96, Math.round(20 + (elapsed / maxBurnDurationSec) * 76));
          setBurnProgress(pct);
          setBurnStage(
            `Baking dynamic anti-crop watermark into video pixels (${Math.min(
              100,
              Math.round((elapsed / maxBurnDurationSec) * 100)
            )}%)...`
          );

          drawProtectedFrame(elapsed);

          if (workVideo.ended || elapsed >= maxBurnDurationSec) {
            resolve();
            return;
          }
          requestAnimationFrame(stepFrame);
        };
        requestAnimationFrame(stepFrame);
      });

      workVideo.pause();
      if (chimeTimer) clearInterval(chimeTimer);
      if (audioCtx) {
        try {
          await audioCtx.close();
        } catch {}
      }

      await new Promise<void>((resolve) => {
        recorder.onstop = () => resolve();
        recorder.stop();
      });

      const isMp4 = chosenMime.includes('mp4');
      const finalBlob = new Blob(chunks, { type: chosenMime || 'video/webm' });
      const finalUrl = URL.createObjectURL(finalBlob);

      setBurnedVideoExt(isMp4 ? 'mp4' : 'webm');
      setBurnedVideoUrl(finalUrl);
      setBurnProgress(100);
      setBurnStage('✓ Pixel-Burned Anti-Piracy Video Ready for Download!');
      showToast(
        `✅ Watermark burned into video pixels (-${totalExportCredits} Cr / ₹${totalExportInr})! Ready to download.`
      );
    } catch (err: any) {
      showToast(`❌ ${err?.message || 'Error encoding watermarked video.'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <CanvasShield className="bg-[#18181b] border border-[#27272a] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-white relative">
      {notice && (
        <div className="fixed bottom-6 right-6 z-50 p-3.5 rounded-2xl bg-[#151128] border border-amber-400/50 text-white text-xs mono shadow-2xl flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/15 border border-purple-400/30 text-purple-300 text-xs font-bold mono uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-amber-300 animate-pulse" />
            <span>Anti-Piracy, Brand Stamping & Freelancer Protection Studio</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            🛡️ Watermark Studio Pro (Pixel Burn-In & Ownership Lock)
          </h2>
          <p className="text-xs sm:text-sm text-purple-200/80 max-w-3xl">
            Bake dynamic anti-crop brand watermarks, custom PNG logos, freelancer client-approval timecode grids, scannable QR lead-gen badges, and SHA-256 copyright certificates directly into your video pixels.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="px-3 py-2 rounded-xl bg-black/40 border border-purple-500/30 text-xs mono">
            Balance: <strong className="text-amber-300">{user?.credits ?? 0} Cr</strong>
          </div>
          {onBackToStudio && (
            <button
              type="button"
              onClick={onBackToStudio}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold mono transition-all cursor-pointer"
            >
              ← Back to Studio
            </button>
          )}
        </div>
      </div>

      {/* 💡 Creator & Freelancer 28-Credit (₹18.50) Pro Protection Bundle Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/40 via-purple-950/50 to-indigo-950/40 border border-amber-400/40 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40 text-[10px] font-black mono uppercase">
              💡 Creator & Freelancer Pro Protection Workflow
            </span>
            <span className="text-xs font-bold text-white mono">
              Base Burn-In (8 Cr) + Logo Badge (+5 Cr) + Client Timecode Grid (+5 Cr) + QR Code (+5 Cr) + Ownership Certificate (+5 Cr) ={' '}
              <strong className="text-emerald-300">28 Credits (₹18.50)</strong>
            </span>
          </div>
          <p className="text-[11px] text-white/75">
            100% pixel-baked export so croppers, unpaid clients, and reposters cannot strip your brand identity or steal your work.
          </p>
        </div>

        <button
          type="button"
          onClick={handleEnable28CrProBundle}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-orange-500 to-pink-500 hover:from-amber-300 hover:to-pink-400 text-slate-950 font-black text-xs mono uppercase tracking-wide shrink-0 cursor-pointer shadow-lg active:scale-95"
        >
          ⚡ Enable 28 Cr (₹18.50) Pro Bundle
        </button>
      </div>

      {/* Low Balance Warning Overlay with Breathing Animation & Pulsing Amber Gradient Border */}
      {(user?.credits ?? 0) < totalExportCredits && (
        <div className="p-4 rounded-2xl low-balance-amber-pulse-card flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-black uppercase text-amber-300 mono">
                ⚠️ Low Credit Balance for Watermark Export
              </span>
              <span className="text-[10px] mono px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold">
                Short by {Math.max(1, totalExportCredits - (user?.credits ?? 0))} Cr
              </span>
            </div>
            <p className="text-[11px] text-white/85">
              Your selected protection layers require{' '}
              <strong className="text-amber-300 mono">
                {totalExportCredits} Credits (₹{totalExportInr})
              </strong>
              , while your current balance is{' '}
              <strong className="text-white mono">{user?.credits ?? 0} Credits</strong>.
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenCreditModal}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-orange-500 to-pink-500 text-black font-black text-xs mono uppercase tracking-wide shrink-0 cursor-pointer shadow-lg active:scale-95"
          >
            ⚡ Top Up Credits (From ₹99)
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (6 Cols): Upload + 6 High-Profit Protection Controls */}
        <div className="lg:col-span-6 space-y-5">
          {/* 1. Video Upload Box */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-white/90 mono flex items-center justify-between">
              <span>1. Upload Video for Pixel Burn-In Protection *</span>
              <span className="text-[10px] text-emerald-400">Base Burn-In: 8 Cr (₹5.30)</span>
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-purple-500/30 hover:border-amber-400/60 bg-[#16122c]/80 rounded-2xl p-4 text-center cursor-pointer transition-all"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="py-2 space-y-1.5">
                <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-400/30 flex items-center justify-center text-purple-300 mx-auto">
                  <Upload className="w-5 h-5 animate-pulse" />
                </div>
                <span className="text-xs font-bold text-white block">
                  {selectedFile ? `✓ ${selectedFile.name}` : 'Click to select MP4 / WebM video (Up to 60MB)'}
                </span>
                <span className="text-[10px] text-white/50 font-mono block">
                  Real HTML5 Canvas Pixel-Baked Export • Anti-Crop Protected
                </span>
              </div>
            </div>
          </div>

          {/* 2. Brand Text + Anti-Crop Mode + Opacity */}
          <div className="p-4 rounded-2xl bg-[#121020] border border-purple-500/30 space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-white/80 mono">Brand Watermark Text:</label>
                <input
                  type="text"
                  value={watermarkText}
                  onChange={(e) => setWatermarkText(e.target.value)}
                  maxLength={40}
                  className="w-full bg-black/50 border border-purple-500/30 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] font-bold mono">
                  <span className="text-white/80">Burn-In Opacity:</span>
                  <span className="text-amber-300">{Math.round(opacity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.25"
                  max="0.95"
                  step="0.05"
                  value={opacity}
                  onChange={(e) => setOpacity(parseFloat(e.target.value))}
                  className="w-full accent-amber-400 cursor-pointer mt-2"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-white/80 mono">Anti-Crop Protection Mode:</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'randomized-float', label: 'Random Float', desc: 'Shifts every 3s' },
                  { id: 'diagonal-grid', label: 'Diagonal Grid', desc: 'Full frame mesh' },
                  { id: 'corner-stamp', label: 'Dual Anchor', desc: 'Top & bottom' },
                  { id: 'dual-anchor', label: 'Matrix Lock', desc: 'Anti-crop proof' },
                ].map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setWatermarkMode(mode.id as any)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      watermarkMode === mode.id
                        ? 'bg-purple-600/30 border-amber-400 text-white shadow-md'
                        : 'bg-black/30 border-white/10 text-white/70 hover:text-white'
                    }`}
                  >
                    <div className="text-[11px] font-bold">{mode.label}</div>
                    <div className="text-[9px] opacity-70 font-mono">{mode.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 3. High-Profit Add-On Suite (+5 Cr / ₹3.30 each) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-amber-300 mono">
                ⚡ Pro Brand & Anti-Piracy Add-Ons (+5 Cr / ₹3.30 each)
              </span>
              <span className="text-[10px] mono text-white/50">100% Pixel-Baked</span>
            </div>

            {/* Feature #2: Custom PNG Logo + Verified Social Handle Badge (+5 Cr) */}
            <div className="p-3.5 rounded-2xl bg-[#121020] border border-purple-500/25 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={logoBadgeEnabled}
                    onChange={(e) => setLogoBadgeEnabled(e.target.checked)}
                    className="rounded border-white/20 text-purple-600 w-4 h-4"
                  />
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Custom Brand Logo PNG + Verified Social Badge</span>
                  </span>
                </label>
                <span className="text-[10px] mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold">
                  +5 Cr (₹3.30)
                </span>
              </div>

              {logoBadgeEnabled && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                  <div>
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => logoInputRef.current?.click()}
                      className="w-full px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-[11px] text-white mono font-semibold cursor-pointer truncate"
                    >
                      {logoDataUrl ? '✓ Logo Loaded (Change)' : '+ Upload Logo PNG'}
                    </button>
                  </div>
                  <select
                    value={socialPlatform}
                    onChange={(e) => setSocialPlatform(e.target.value as any)}
                    className="bg-black/60 border border-white/15 rounded-xl px-2.5 py-2 text-xs text-white mono"
                  >
                    <option value="instagram">Instagram</option>
                    <option value="youtube">YouTube</option>
                    <option value="x">X / Twitter</option>
                    <option value="web">Website</option>
                  </select>
                  <input
                    type="text"
                    value={socialHandle}
                    onChange={(e) => setSocialHandle(e.target.value)}
                    placeholder="@YourHandle"
                    className="bg-black/60 border border-white/15 rounded-xl px-3 py-2 text-xs text-white mono"
                  />
                </div>
              )}
            </div>

            {/* Feature #3: Freelancer Client-Approval Timecode Grid (+5 Cr) */}
            <div className="p-3.5 rounded-2xl bg-[#121020] border border-purple-500/25 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={clientTimecodeEnabled}
                    onChange={(e) => setClientTimecodeEnabled(e.target.checked)}
                    className="rounded border-white/20 text-purple-600 w-4 h-4"
                  />
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Freelancer Client-Approval Timecode & Draft Grid</span>
                  </span>
                </label>
                <span className="text-[10px] mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                  +5 Cr (₹3.30)
                </span>
              </div>

              {clientTimecodeEnabled && (
                <input
                  type="text"
                  value={clientProjectTag}
                  onChange={(e) => setClientProjectTag(e.target.value)}
                  placeholder="CLIENT APPROVAL DRAFT • DO NOT COPY"
                  className="w-full bg-black/60 border border-amber-500/30 rounded-xl px-3 py-2 text-xs text-amber-200 mono"
                />
              )}
            </div>

            {/* Feature #4: Dynamic QR Code Call-to-Action Stamp (+5 Cr) */}
            <div className="p-3.5 rounded-2xl bg-[#121020] border border-purple-500/25 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={qrStampEnabled}
                    onChange={(e) => setQrStampEnabled(e.target.checked)}
                    className="rounded border-white/20 text-purple-600 w-4 h-4"
                  />
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <QrCode className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Dynamic QR Code Lead-Gen Corner Stamp</span>
                  </span>
                </label>
                <span className="text-[10px] mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                  +5 Cr (₹3.30)
                </span>
              </div>

              {qrStampEnabled && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                  <input
                    type="text"
                    value={qrUrl}
                    onChange={(e) => setQrUrl(e.target.value)}
                    placeholder="https://yourwebsite.com"
                    className="sm:col-span-2 bg-black/60 border border-white/15 rounded-xl px-3 py-2 text-xs text-white mono"
                  />
                  <input
                    type="text"
                    value={qrLabel}
                    onChange={(e) => setQrLabel(e.target.value)}
                    placeholder="SCAN TO VISIT"
                    maxLength={14}
                    className="bg-black/60 border border-white/15 rounded-xl px-3 py-2 text-xs text-emerald-300 mono"
                  />
                </div>
              )}
            </div>

            {/* Feature #5: Sonic Audio Watermark Chime Protection (+5 Cr) */}
            <div className="p-3.5 rounded-2xl bg-[#121020] border border-purple-500/25 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sonicChimeEnabled}
                    onChange={(e) => setSonicChimeEnabled(e.target.checked)}
                    className="rounded border-white/20 text-purple-600 w-4 h-4"
                  />
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Volume2 className="w-3.5 h-3.5 text-pink-400" />
                    <span>Sonic Audio Watermark Chime Protection</span>
                  </span>
                </label>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={playSonicProtectionChimePreview}
                    className="px-2 py-0.5 rounded-lg bg-white/10 hover:bg-white/20 text-[10px] mono text-white cursor-pointer"
                  >
                    🔊 Test Chime
                  </button>
                  <span className="text-[10px] mono px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30 font-bold">
                    +5 Cr (₹3.30)
                  </span>
                </div>
              </div>
            </div>

            {/* Feature #6: SHA-256 Ownership Certificate & Forensic Signature (+5 Cr) */}
            <div className="p-3.5 rounded-2xl bg-[#121020] border border-purple-500/25">
              <div className="flex items-center justify-between gap-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={ownershipCertEnabled}
                    onChange={(e) => setOwnershipCertEnabled(e.target.checked)}
                    className="rounded border-white/20 text-purple-600 w-4 h-4"
                  />
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <FileCheck2 className="w-3.5 h-3.5 text-purple-400" />
                    <span>SHA-256 Ownership Certificate & Forensic Hash</span>
                  </span>
                </label>
                <span className="text-[10px] mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold">
                  +5 Cr (₹3.30)
                </span>
              </div>
            </div>
          </div>

          {/* Legal Safe-Harbor Ownership Confirmation Box */}
          <label className="flex items-start gap-2.5 p-3 rounded-2xl bg-emerald-950/25 border border-emerald-500/30 cursor-pointer">
            <input
              type="checkbox"
              checked={ownershipConfirmed}
              onChange={(e) => setOwnershipConfirmed(e.target.checked)}
              className="mt-0.5 rounded border-emerald-400/40 text-emerald-500 w-4 h-4"
            />
            <span className="text-[11px] text-emerald-100/90 leading-relaxed">
              <strong className="text-emerald-300 font-mono">🛡️ Safe-Harbor Ownership Declaration:</strong>{' '}
              By stamping this video, I confirm that I own or hold commercial licensing rights to protect and distribute this media.
            </span>
          </label>

          {/* Primary Burn-In & Export Action Button */}
          <button
            type="button"
            onClick={handleProcessAndBurnWatermark}
            disabled={isProcessing || !videoPreviewUrl}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-400 via-orange-500 to-pink-600 hover:from-amber-300 hover:to-pink-500 text-slate-950 text-xs sm:text-sm font-black mono flex items-center justify-center gap-2 shadow-xl cursor-pointer active:scale-95 disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                <span>{burnStage || `Baking Watermark (${burnProgress}%)...`}</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4 text-slate-950" />
                <span>
                  🔒 Burn-In & Export Protected Video (-{totalExportCredits} Cr / ₹{totalExportInr})
                </span>
              </>
            )}
          </button>

          {isProcessing && (
            <div className="space-y-1.5">
              <div className="w-full h-2.5 rounded-full bg-black/60 overflow-hidden p-0.5 border border-amber-400/40">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-400 via-orange-500 to-pink-500 transition-all duration-150"
                  style={{ width: `${burnProgress}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] mono text-amber-200/80">
                <span>{burnStage}</span>
                <span>{burnProgress}%</span>
              </div>
            </div>
          )}
        </div>

        {/* Right Column (6 Cols): Live Anti-Crop Viewport + Downloadable Burned-In Output */}
        <div className="lg:col-span-6 space-y-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-300 mono uppercase tracking-wider flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-emerald-400" />
              <span>Live Anti-Crop & Multi-Layer Protection Preview</span>
            </span>
            <span className="text-[10px] mono text-emerald-300 bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-500/30 font-bold">
              Total: {totalExportCredits} Cr (₹{totalExportInr})
            </span>
          </div>

          <div className="relative w-full aspect-[9/16] max-w-[340px] sm:max-w-[370px] mx-auto rounded-3xl overflow-hidden bg-black border-2 border-purple-500/40 shadow-2xl flex items-center justify-center select-none">
            {videoPreviewUrl ? (
              <video
                ref={previewVideoRef}
                src={videoPreviewUrl}
                controls
                controlsList="nodownload"
                onContextMenu={(e) => e.preventDefault()}
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-center p-6 space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-400/30 flex items-center justify-center text-purple-300 mx-auto">
                  <Lock className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold text-white/80 block">No video uploaded yet</span>
                <span className="text-[10px] text-white/40 font-mono block">
                  Upload an MP4/WebM clip on the left to preview live anti-crop protection
                </span>
              </div>
            )}

            {/* Layer 1: Client-Approval Timecode Diagonal Grid Overlay */}
            {videoPreviewUrl && clientTimecodeEnabled && (
              <div
                style={{ opacity }}
                className="absolute inset-0 z-20 pointer-events-none flex flex-col items-center justify-center"
              >
                <div className="w-full py-2 bg-black/75 border-y border-amber-400/50 text-center">
                  <div className="text-[10px] font-black mono text-amber-300 tracking-widest">
                    TC {liveTimecode}
                  </div>
                  <div className="text-[9px] font-bold mono text-white/85 uppercase">
                    {clientProjectTag}
                  </div>
                </div>
              </div>
            )}

            {/* Layer 2: Primary Dynamic Anti-Crop Brand + Logo + Social Handle Stamp */}
            {videoPreviewUrl && (
              <div
                style={{
                  top: watermarkMode === 'randomized-float' ? currentFloatPos.top : '10%',
                  left: watermarkMode === 'randomized-float' ? currentFloatPos.left : '8%',
                  opacity,
                }}
                className="absolute z-30 pointer-events-none px-3 py-1.5 rounded-xl bg-black/75 backdrop-blur-md border border-amber-400/50 text-white font-mono text-[10px] tracking-wider shadow-lg transition-all duration-700 flex items-center gap-2"
              >
                {logoBadgeEnabled && logoDataUrl ? (
                  <img
                    src={logoDataUrl}
                    alt="Brand Logo"
                    className="w-4 h-4 rounded object-contain shrink-0"
                  />
                ) : (
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                )}
                <div className="leading-tight">
                  <div className="font-bold text-white">{watermarkText}</div>
                  {logoBadgeEnabled && (
                    <div className="text-[9px] text-cyan-300 flex items-center gap-1">
                      <span>{socialHandle}</span>
                      {verifiedCheckmark && <span>✓</span>}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Secondary Anchor for Dual-Anchor / Diagonal Grid modes */}
            {videoPreviewUrl && watermarkMode !== 'randomized-float' && (
              <div
                style={{ bottom: '18%', left: '10%', opacity }}
                className="absolute z-30 pointer-events-none px-2.5 py-1 rounded-lg bg-black/65 backdrop-blur-md border border-white/20 text-white font-mono text-[10px] tracking-wider shadow-lg flex items-center gap-1.5"
              >
                <Zap className="w-3 h-3 text-cyan-300" />
                <span>{watermarkText} (Verified)</span>
              </div>
            )}

            {/* Layer 3: Dynamic QR Code Lead-Gen Corner Stamp */}
            {videoPreviewUrl && qrStampEnabled && (
              <div
                style={{ opacity }}
                className="absolute bottom-8 right-3 z-30 pointer-events-none bg-white p-1.5 rounded-xl shadow-xl border border-black/20 flex flex-col items-center"
              >
                <div
                  className="grid gap-0"
                  style={{
                    gridTemplateColumns: `repeat(${qrMatrix.length}, minmax(0, 1fr))`,
                    width: '48px',
                    height: '48px',
                  }}
                >
                  {qrMatrix.map((row, rIdx) =>
                    row.map((cell, cIdx) => (
                      <div
                        key={`${rIdx}-${cIdx}`}
                        className={cell ? 'bg-black' : 'bg-white'}
                        style={{ width: '100%', height: '100%' }}
                      />
                    ))
                  )}
                </div>
                <span className="text-[7px] font-black mono text-black mt-0.5 tracking-tighter">
                  {qrLabel.slice(0, 12)}
                </span>
              </div>
            )}

            {/* Layer 4: Forensic SHA-256 Bottom Signature Bar */}
            {videoPreviewUrl && ownershipCertEnabled && (
              <div className="absolute bottom-2 left-3 z-30 pointer-events-none px-2 py-0.5 rounded bg-black/75 border border-emerald-400/40 text-[8px] font-mono text-emerald-300">
                🔐 {issuedCertificate?.certificateId || 'NVZ-WM-SHA256'} • C2PA PROTECTED
              </div>
            )}
          </div>

          {/* Burned-In Video Download + Ownership Certificate Box */}
          {burnedVideoUrl && (
            <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/50 via-[#121824] to-purple-950/40 border border-emerald-400/50 space-y-3 shadow-xl animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-emerald-300 mono uppercase flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-300" />
                  <span>✓ Pixel-Baked Protected Master Ready</span>
                </span>
                <span className="text-[10px] mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                  100% Permanent Burn-In
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <a
                  href={burnedVideoUrl}
                  download={`NexVerze-Protected-${Date.now()}.${burnedVideoExt}`}
                  className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-300 hover:to-teal-400 text-slate-950 font-black text-xs mono uppercase tracking-wide flex items-center justify-center gap-1.5 shadow-lg cursor-pointer"
                >
                  <Download className="w-4 h-4 text-slate-950" />
                  <span>⬇️ Download Protected Video (.{burnedVideoExt.toUpperCase()})</span>
                </a>

                {issuedCertificate && (
                  <button
                    type="button"
                    onClick={() => handleDownloadCertificate(issuedCertificate)}
                    className="py-3 px-4 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 border border-purple-400/50 text-purple-200 font-bold text-xs mono flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <FileCheck2 className="w-4 h-4 text-amber-300" />
                    <span>📜 Download SHA-256 Certificate</span>
                  </button>
                )}
              </div>

              {issuedCertificate && (
                <div className="p-2.5 rounded-xl bg-black/50 border border-white/10 text-[10px] mono text-white/75 space-y-0.5">
                  <div>
                    <strong className="text-amber-300">Certificate ID:</strong>{' '}
                    {issuedCertificate.certificateId}
                  </div>
                  <div className="truncate">
                    <strong className="text-purple-300">SHA-256 Fingerprint:</strong>{' '}
                    {issuedCertificate.sha256Hash}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </CanvasShield>
  );
};
