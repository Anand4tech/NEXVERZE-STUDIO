import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StudioUser,
  StudioGeneration,
  getOrCreateStudioUser,
  deductUserCredits,
  saveStudioGeneration,
  SUPABASE_STUDIO_SQL,
} from './lib/supabase';
import {
  FAL_MODELS,
  MODEL_COST,
  INR_MAPPING,
  ModelType,
  DurationType,
} from './lib/modelConfig';
import { SAMPLE_VIDEOS, PROMPT_INSPIRATIONS, VideoSample } from './lib/videoSamples';
import { enhancePrompt } from './lib/promptEnhancer';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { QualityLockPlayer, SceneTransitionType, ColorGradingPreset } from './components/QualityLockPlayer';
import { CreditModal } from './components/CreditModal';
import { AuthModal } from './components/AuthModal';
import { HistoryView } from './components/HistoryView';
import {
  logApiConsumption,
  startPeriodicMarginMonitor,
  initDailyMarginCheck,
  runDailyMarginCheck,
} from './lib/marginGuard';
import { ZipExportModal } from './components/ZipExportModal';
import { ModelInfoModal } from './components/ModelInfoModal';
import { CompareModelsDrawer } from './components/CompareModelsDrawer';
import { ImageUploadGuide } from './components/ImageUploadGuide';
import { SequenceBuilderDrawer } from './components/SequenceBuilderDrawer';
import { HelpFaqSection } from './components/HelpFaqSection';
import { useLanguage } from './context/LanguageContext';
import { LanguageSelectorButton } from './components/LanguageSelectorButton';
import { WelcomeCreditsModal } from './components/WelcomeCreditsModal';
import { ViralPromptChips } from './components/ViralPromptChips';
import { AudioVoiceoverStudio, AudioVoiceoverConfig } from './components/AudioVoiceoverStudio';
import { HeroSection } from './components/HeroSection';
import { ShowcaseGallery } from './components/ShowcaseGallery';
import { PromptAutocompleteTextarea } from './components/PromptAutocompleteTextarea';
import { BatchGenerationMode } from './components/BatchGenerationMode';
import { MobileToCinematicStudio } from './components/MobileToCinematicStudio';
import { WatermarkStudio } from './components/WatermarkStudio';
import { PrivacyPolicyPage } from './components/pages/PrivacyPolicyPage';
import { TermsPage } from './components/pages/TermsPage';
import { RefundPolicyPage } from './components/pages/RefundPolicyPage';
import { ContactSupportPage } from './components/pages/ContactSupportPage';
import { FavoritesPage } from './components/pages/FavoritesPage';
import {
  Sparkles,
  Zap,
  Wand2,
  ShieldCheck,
  Coins,
  History,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  Code2,
  Film,
  Download,
  Sliders,
  Play,
  ArrowRight,
  Database,
  AlertCircle,
  HelpCircle,
  Upload,
  Image as ImageIcon,
  X,
  Clock,
  ArrowUpRight,
  Lock,
  ChevronDown,
  ChevronUp,
  Trash2,
  Layers,
  Shuffle,
} from 'lucide-react';

export type ActiveViewType = 'studio' | 'studioApp' | 'history' | 'favorites' | 'sql' | 'privacy' | 'terms' | 'refund' | 'contact';

export default function App() {
  const [user, setUser] = useState<StudioUser | null>(null);
  const [activeView, setActiveView] = useState<ActiveViewType>(() => {
    if (typeof window !== 'undefined') {
      const p = window.location.pathname.toLowerCase().replace(/\/+$/, '');
      if (p === '/privacy-policy' || p === '/privacy') return 'privacy';
      if (p === '/terms' || p === '/terms-of-service') return 'terms';
      if (p === '/refund-policy' || p === '/refund-and-cancellation' || p === '/refund') return 'refund';
      if (p === '/contact' || p === '/contact-support') return 'contact';
      if (p === '/history' || p === '/studio/history') return 'history';
      if (p === '/favorites' || p === '/favourites' || p === '/liked') return 'favorites';
      if (p === '/sql') return 'sql';
      if (p === '/studio') return 'studioApp';
    }
    return 'studio';
  });

  const navigateToView = useCallback((view: ActiveViewType) => {
    setActiveView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    let path = '/';
    if (view === 'privacy') path = '/privacy-policy/';
    else if (view === 'terms') path = '/terms/';
    else if (view === 'refund') path = '/refund-policy/';
    else if (view === 'contact') path = '/contact/';
    else if (view === 'history') path = '/history';
    else if (view === 'favorites') path = '/favorites';
    else if (view === 'sql') path = '/sql';
    else if (view === 'studioApp') path = '/studio';
    else path = '/';

    if (typeof window !== 'undefined' && window.location.pathname !== path) {
      window.history.pushState({ view }, '', path);
    }
  }, []);

  const navigateToStudioApp = useCallback((initialPrompt?: string, model?: ModelType) => {
    if (initialPrompt) setPrompt(initialPrompt);
    if (model) setSelectedModel(model);
    setActiveView('studioApp');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    let path = '/studio';
    if (typeof window !== 'undefined' && window.location.pathname !== path) {
      window.history.pushState({ view: 'studioApp' }, '', path);
    }
  }, []);



  // Browser back/forward button popstate handler
  useEffect(() => {
    const handlePopState = () => {
      const p = window.location.pathname.toLowerCase().replace(/\/+$/, '');
      if (p === '/privacy-policy' || p === '/privacy') setActiveView('privacy');
      else if (p === '/terms' || p === '/terms-of-service') setActiveView('terms');
      else if (p === '/refund-policy' || p === '/refund-and-cancellation' || p === '/refund') setActiveView('refund');
      else if (p === '/contact' || p === '/contact-support') setActiveView('contact');
      else if (p === '/history' || p === '/studio/history') setActiveView('history');
      else if (p === '/sql') setActiveView('sql');
      else setActiveView('studio');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const { t } = useLanguage();

  // Studio form states
  const [prompt, setPrompt] = useState(
    'Cinematic FPV drone flythrough of ancient Tamil temple gopuram at sunset, 8k volumetric light, golden hour, photorealistic hyper-detail'
  );
  const [selectedModel, setSelectedModel] = useState<ModelType>('luma');
  const [selectedDuration, setSelectedDuration] = useState<DurationType>('5s');
  const [selectedRatio, setSelectedRatio] = useState<'9:16' | '16:9' | '1:1'>('9:16');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [isEnhancingPrompt, setIsEnhancingPrompt] = useState(false);
  const [promptEnhancedSuccess, setPromptEnhancedSuccess] = useState(false);

  // Loading & Error states
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStage, setGenerationStage] = useState<string>('Initializing Neural Pipeline...');
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [studioModeTab, setStudioModeTab] = useState<'single' | 'batch'>('single');
  const [globalNotice, setGlobalNotice] = useState<string | null>(null);

  const showGlobalNotice = (msg: string) => {
    setGlobalNotice(msg);
    setTimeout(() => setGlobalNotice(null), 4000);
  };

  // Active Video Output - check localStorage for persistent uploaded reference video
  const [currentVideo, setCurrentVideo] = useState<VideoSample>(() => {
    if (typeof window !== 'undefined') {
      try {
        const storedCustom = localStorage.getItem('nexverze_custom_reference_video');
        if (storedCustom) {
          const parsed = JSON.parse(storedCustom);
          if (parsed && parsed.video_url) {
            return parsed;
          }
        }
      } catch (e) {
        // fallback
      }
    }
    return SAMPLE_VIDEOS[0];
  });

  // Motion Intensity (1-10) & Scene Transition ('Cut' | 'Crossfade' | 'Wipe') & Color Grading
  const [motionIntensity, setMotionIntensity] = useState<number>(6);
  const [sceneTransition, setSceneTransition] = useState<SceneTransitionType>('Crossfade');
  const [colorGrading, setColorGrading] = useState<ColorGradingPreset>('Normal');
  const [isSequenceBuilderOpen, setIsSequenceBuilderOpen] = useState(false);

  // Audio & Voiceover Integration State
  const [audioConfig, setAudioConfig] = useState<AudioVoiceoverConfig>({
    enabled: false,
    mode: 'hybrid',
    voiceId: 'ta-male-trailer',
    script: '',
    bgmId: 'epic',
    speed: 1.0,
    voiceVolume: 90,
    bgmVolume: 40,
  });

  // Collapsible Studio Workspace State & Studio Tab State ('text' | 'image' | 'mobile-to-cinematic' | 'watermark')
  const [isStudioExpanded, setIsStudioExpanded] = useState<boolean>(true);
  const [activeStudioTab, setActiveStudioTab] = useState<'text' | 'image' | 'mobile-to-cinematic' | 'watermark'>('text');

  const handleOpenStudioWithMode = (mode: 'text' | 'image' | 'mobile-to-cinematic' | 'watermark') => {
    setActiveStudioTab(mode);
    navigateToStudioApp();
  };

  // Recent Prompts Drawer State (saves last 5 successful prompts)
  interface RecentPromptItem {
    id: string;
    prompt: string;
    model: ModelType;
    duration: DurationType;
    aspect_ratio: '9:16' | '16:9' | '1:1';
    timestamp: number;
  }

  const [recentPrompts, setRecentPrompts] = useState<RecentPromptItem[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('nexverze_recent_prompts');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed.slice(0, 5);
          }
        }
      } catch (e) {
        console.error('Failed to parse recent prompts:', e);
      }
    }
    // High-quality seed creative prompts so the drawer is immediately useful and demonstrable
    return [
      {
        id: 'seed-1',
        prompt: 'Futuristic hypercar speeding through neon Tokyo in heavy rain, reflections on asphalt, dynamic camera tracking, 8k cinematic.',
        model: 'kling',
        duration: '5s',
        aspect_ratio: '9:16',
        timestamp: Date.now() - 1000 * 60 * 15,
      },
      {
        id: 'seed-2',
        prompt: 'A majestic bioluminescent stag walking gently through an enchanted glowing mist forest, ethereal particles drifting, 4k ultra-realistic.',
        model: 'luma',
        duration: '5s',
        aspect_ratio: '16:9',
        timestamp: Date.now() - 1000 * 60 * 60,
      },
      {
        id: 'seed-3',
        prompt: 'Extreme macro cinematic close-up of emerald green mechanical robot eye with intricate gears turning and glowing iris aperture.',
        model: 'veo',
        duration: '8s',
        aspect_ratio: '1:1',
        timestamp: Date.now() - 1000 * 60 * 180,
      },
    ];
  });
  const [isRecentPromptsDrawerOpen, setIsRecentPromptsDrawerOpen] = useState(false);
  const [appliedPromptId, setAppliedPromptId] = useState<string | null>(null);
  const [copiedPromptId, setCopiedPromptId] = useState<string | null>(null);

  const saveSuccessfulPrompt = (newPrompt: string, model: ModelType, dur: DurationType, ratio: '9:16' | '16:9' | '1:1') => {
    if (!newPrompt.trim()) return;
    setRecentPrompts((prev) => {
      const filtered = prev.filter((p) => p.prompt.trim().toLowerCase() !== newPrompt.trim().toLowerCase());
      const newItem: RecentPromptItem = {
        id: crypto.randomUUID(),
        prompt: newPrompt.trim(),
        model,
        duration: dur,
        aspect_ratio: ratio,
        timestamp: Date.now(),
      };
      const updated = [newItem, ...filtered].slice(0, 5);
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('nexverze_recent_prompts', JSON.stringify(updated));
        } catch (e) {
          console.error('Failed to save recent prompt:', e);
        }
      }
      return updated;
    });
  };

  // Modals & Drawers
  const [isCreditModalOpen, setIsCreditModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isZipModalOpen, setIsZipModalOpen] = useState(false);
  const [insufficientCreditTrigger, setInsufficientCreditTrigger] = useState(false);
  const [autoTriggerCheckout, setAutoTriggerCheckout] = useState(false);
  const [isAiUpscaleActive, setIsAiUpscaleActive] = useState(false);
  const [infoModalModel, setInfoModalModel] = useState<ModelType | null>(null);
  const [isCompareDrawerOpen, setIsCompareDrawerOpen] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewVideoInputRef = useRef<HTMLInputElement>(null);

  const handleUploadReferenceVideo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const buffer = await file.arrayBuffer();
      const res = await fetch('/api/upload-reference-video-binary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/octet-stream' },
        body: buffer,
      });
      const data = await res.json();
      const permanentUrl = data?.videoUrl || `/videos/user-reference.mp4?v=${Date.now()}`;

      const customVideo: VideoSample = {
        id: 'user-uploaded-reference-' + Date.now(),
        title: file.name.replace(/\.[^/.]+$/, ''),
        model: (selectedModel === 'veo' ? 'veo3' : selectedModel) as 'kling' | 'luma' | 'veo3',
        prompt: 'User uploaded reference video',
        aspect_ratio: selectedRatio,
        video_url: permanentUrl,
        aspect_videos: {
          '9:16': permanentUrl,
          '16:9': permanentUrl,
          '1:1': permanentUrl,
        },
        thumbnail_url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=800&auto=format&fit=crop',
        duration: '5.0s',
        created_at: new Date().toISOString(),
      };

      setCurrentVideo(customVideo);
      try {
        localStorage.setItem('nexverze_custom_reference_video', JSON.stringify(customVideo));
      } catch (err) {
        console.warn('LocalStorage save error:', err);
      }
      showGlobalNotice(`✓ Master reference video "${file.name}" uploaded successfully! Set as default preview.`);
    } catch (err) {
      console.error('Failed to upload video to server:', err);
      showGlobalNotice('⚠️ Video upload failed. Please try again with an MP4 video.');
    }
  };

  // Automatically adjust duration when switching models (e.g. Veo supports only 8s and 10s)
  useEffect(() => {
    const validDurations = FAL_MODELS[selectedModel].durations;
    if (!validDurations.includes(selectedDuration)) {
      setSelectedDuration(validDurations[0]);
    }
  }, [selectedModel]);

  // Initialize user (Pro account initialized by default for workspace owner anand4earn@gmail.com)
  useEffect(() => {
    async function initDefaultUser() {
      const stored = localStorage.getItem('nexverze_studio_user');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed && typeof parsed === 'object') {
            if (parsed.email?.toLowerCase() === 'anand4earn@gmail.com' || parsed.is_pro) {
              parsed.is_pro = true;
              parsed.plan = 'pro';
              parsed.credits = Math.max(parsed.credits || 0, 5000);
              localStorage.setItem('nexverze_studio_user', JSON.stringify(parsed));
              localStorage.setItem('nexverze_studio_paid_user', 'true');
              localStorage.setItem('nexverze_user_plan', 'pro');
            }
            setUser(parsed);
            return;
          }
        } catch {
          // ignore error
        }
      }

      // Default to verified PRO account
      const proUser: StudioUser = {
        id: 'pro-user-anand',
        email: 'anand4earn@gmail.com',
        credits: 5000,
        plan: 'pro',
        is_pro: true,
        created_at: new Date().toISOString(),
      };
      setUser(proUser);
      try {
        localStorage.setItem('nexverze_studio_user', JSON.stringify(proUser));
        localStorage.setItem('nexverze_studio_paid_user', 'true');
        localStorage.setItem('nexverze_user_plan', 'pro');
      } catch (err) {
        console.warn('LocalStorage notice:', err);
      }
    }
    initDefaultUser();
    const cleanupMarginMonitor = startPeriodicMarginMonitor(15);
    const cleanupDailyMargin = initDailyMarginCheck();
    return () => {
      cleanupMarginMonitor();
      cleanupDailyMargin();
    };
  }, []);

  // Compute live credit cost
  const liveCreditCost = MODEL_COST[selectedModel]?.[selectedDuration] || 50;
  const inrEstimate = INR_MAPPING[selectedModel]?.[selectedDuration] || Math.round(liveCreditCost * 0.7);

  // Check if current user is on Free Tier (PRO users have unlimited unwatermarked 4K access)
  const isFreeUser = typeof window !== 'undefined'
    ? (!localStorage.getItem('nexverze_studio_paid_user') && !user?.is_pro && user?.email !== 'anand4earn@gmail.com' && (!user || (user.credits <= 0)))
    : false;

  // Image Upload handler
  const handleImageUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      showGlobalNotice('⚠️ Please upload an image file (PNG, JPG, WEBP).');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setImageUrl(dataUrl);
      setImageUrls((prev) => (prev.includes(dataUrl) ? prev : [...prev, dataUrl].slice(0, 10)));
    };
    reader.readAsDataURL(file);
  };

  const handleImagesUpload = (files: FileList | File[]) => {
    const fileArray = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (fileArray.length === 0) return;

    const remainingSlots = 10 - imageUrls.length;
    if (remainingSlots <= 0) {
      showGlobalNotice('⚠️ Maximum 10 images limit reached.');
      return;
    }

    const filesToUpload = fileArray.slice(0, remainingSlots);
    const newUrls: string[] = [];

    let count = 0;
    filesToUpload.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          newUrls.push(reader.result);
        }
        count++;
        if (count === filesToUpload.length) {
          setImageUrls((prev) => {
            const updated = [...prev, ...newUrls].slice(0, 10);
            if (updated.length > 0) {
              setImageUrl(updated[0]);
            }
            return updated;
          });
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveImageAt = (index: number) => {
    setImageUrls((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      if (updated.length > 0) {
        setImageUrl(updated[0]);
      } else {
        setImageUrl(null);
      }
      return updated;
    });
  };

  const handleClearAllImages = () => {
    setImageUrls([]);
    setImageUrl(null);
  };

  // REMIX HANDLER: Clones current video prompt and configuration settings into Studio input fields
  const [remixBanner, setRemixBanner] = useState<{ active: boolean; message: string }>({ active: false, message: '' });

  const handleRemixVideo = (config?: {
    prompt?: string;
    modelName?: string;
    model?: string;
    duration?: string;
    aspectRatio?: '9:16' | '16:9' | '1:1';
    aspect_ratio?: '9:16' | '16:9' | '1:1';
    motionIntensity?: number;
    sceneTransition?: SceneTransitionType;
    colorGrading?: ColorGradingPreset;
  }) => {
    // 0. Frictionless "1-Tap Remix" (Suggestion 5):
    // If user is on the landing page, keep them on the landing page without navigating away!
    // The prompt parameters float directly up into the Hero Floating Command Center.
    const isHomePage = activeView === 'studio';
    if (!isHomePage && activeView !== 'studioApp') {
      setActiveView('studioApp');
      if (typeof window !== 'undefined' && window.location.pathname !== '/studio') {
        window.history.pushState({ view: 'studioApp' }, '', '/studio');
      }
    }
    setIsStudioExpanded(true);

    // 1. Clone prompt
    const targetPrompt = config?.prompt || currentVideo.prompt;
    if (targetPrompt) {
      setPrompt(targetPrompt);
    }

    // 2. Clone model
    const targetModelStr = (config?.modelName || (config as any)?.model || currentVideo.model || '').toLowerCase();
    let matchedModel: ModelType = selectedModel;
    if (targetModelStr.includes('veo') || targetModelStr === 'veo3') {
      matchedModel = 'veo';
    } else if (targetModelStr.includes('kling')) {
      matchedModel = 'kling';
    } else if (targetModelStr.includes('luma')) {
      matchedModel = 'luma';
    } else if (targetModelStr.includes('wan')) {
      matchedModel = 'wan';
    } else if (targetModelStr.includes('hunyuan')) {
      matchedModel = 'hunyuan';
    } else if (targetModelStr.includes('ltx')) {
      matchedModel = 'ltx';
    }
    setSelectedModel(matchedModel);

    // 3. Clone duration (ensuring it's valid for the selected engine)
    const rawDur = (config?.duration || currentVideo.duration || '').trim();
    const durNum = rawDur.replace(/[^0-9]/g, '');
    let matchedDur: DurationType = durNum ? (`${durNum}s` as DurationType) : '5s';
    if (!FAL_MODELS[matchedModel].durations.includes(matchedDur)) {
      matchedDur = FAL_MODELS[matchedModel].durations[0];
    }
    setSelectedDuration(matchedDur);

    // 4. Clone aspect ratio
    const targetRatio = config?.aspectRatio || (config as any)?.aspect_ratio || currentVideo.aspect_ratio;
    if (targetRatio && ['9:16', '16:9', '1:1'].includes(targetRatio)) {
      setSelectedRatio(targetRatio);
    }

    // 5. Clone motion dynamics & color grade
    if (config?.motionIntensity !== undefined) {
      setMotionIntensity(config.motionIntensity);
    }
    if (config?.sceneTransition) {
      setSceneTransition(config.sceneTransition);
    }
    if (config?.colorGrading) {
      setColorGrading(config.colorGrading);
    }

    // 6. Smooth scroll to prompt command bar on homepage or textarea in studio
    setTimeout(() => {
      const targetElem = isHomePage
        ? document.getElementById('floating-command-bar')
        : (document.getElementById('studio-prompt-textarea') || document.getElementById('floating-command-bar'));
      if (targetElem) {
        targetElem.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const inputInside = targetElem.querySelector('textarea, input');
        (inputInside as HTMLElement)?.focus();
      }
    }, 120);

    // 7. Show feedback banner
    setRemixBanner({
      active: true,
      message: `✨ Cloned into Command Center: "${targetPrompt.slice(0, 42)}..." • ${FAL_MODELS[matchedModel].name} (${matchedDur}) • ${targetRatio || '9:16'}`,
    });
    setTimeout(() => {
      setRemixBanner({ active: false, message: '' });
    }, 4500);
  };

  // PROMPT ENHANCER: Expands user prompt with cinematic lighting, camera angles, and model-specific depth
  const handleEnhancePrompt = () => {
    setIsEnhancingPrompt(true);
    setTimeout(() => {
      const enhanced = enhancePrompt(prompt, { model: selectedModel });
      setPrompt(enhanced);
      setIsEnhancingPrompt(false);
      setPromptEnhancedSuccess(true);
      setTimeout(() => setPromptEnhancedSuccess(false), 2000);
    }, 450);
  };

  // REAL GENERATION: calls /api/generate (FAL ONLY)
  const handleGenerate = async () => {
    if (!prompt.trim() && !imageUrl) {
      setGenerationError('Please provide a prompt or upload an image.');
      return;
    }

    setGenerationError(null);
    const requiredCredits = liveCreditCost;
    const currentCredits = user ? user.credits : 0;

    // 1. Check credits before generate (Pay-to-Generate enforcement with Auto-Top-Up support)
    if (currentCredits < requiredCredits) {
      const isAutoTopUp = typeof window !== 'undefined' && localStorage.getItem('nexverze_auto_top_up_enabled') === 'true';
      if (isAutoTopUp) {
        setAutoTriggerCheckout(true);
      } else {
        setAutoTriggerCheckout(false);
      }
      setInsufficientCreditTrigger(true);
      setIsCreditModalOpen(true);
      return;
    }

    setIsGenerating(true);
    setGenerationProgress(6);
    setGenerationStage('Initializing Neural Latents & Prompt Embeddings...');

    // Smooth real-time animated progress bar updater
    const progressInterval = setInterval(() => {
      setGenerationProgress((prev) => {
        if (prev < 22) {
          setGenerationStage('Initializing AI model parameters & prompt latents...');
          return Math.min(prev + 1.4, 94);
        } else if (prev < 48) {
          setGenerationStage('Synthesizing motion dynamics & camera vectors...');
          return Math.min(prev + 1.1, 94);
        } else if (prev < 72) {
          setGenerationStage('Rendering high-dynamic 4K keyframe sequence...');
          return Math.min(prev + 0.8, 94);
        } else if (prev < 88) {
          setGenerationStage('Applying cinematic color grading & audio synthesis...');
          return Math.min(prev + 0.5, 94);
        } else if (prev < 94) {
          setGenerationStage('Packaging high-bitrate MP4 container...');
          return Math.min(prev + 0.25, 94);
        }
        return 94;
      });
    }, 110);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          model: selectedModel,
          duration: selectedDuration,
          imageUrl: imageUrl || undefined,
          aspect_ratio: selectedRatio,
          motion_intensity: motionIntensity,
          scene_transition: sceneTransition,
          audio_config: audioConfig.enabled ? audioConfig : undefined,
          userId: user?.id,
          email: user?.email,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.video_url) {
        if (response.status === 402) {
          setInsufficientCreditTrigger(true);
          setIsCreditModalOpen(true);
        }
        throw new Error(data.error || 'Generation failed, try again');
      }

      clearInterval(progressInterval);
      setGenerationProgress(100);
      setGenerationStage('✓ Master Output Generated Successfully!');

      // Brief pause to allow user to see 100% completion celebration
      await new Promise((resolve) => setTimeout(resolve, 450));

      // On Success: Set Video Output
      const newVideoSample: VideoSample = {
        id: `gen-${Date.now()}`,
        title: prompt.slice(0, 30) + '...',
        model: (selectedModel === 'veo' ? 'veo3' : selectedModel) as any,
        prompt: prompt.trim(),
        aspect_ratio: selectedRatio,
        video_url: data.video_url,
        thumbnail_url: imageUrl || currentVideo.thumbnail_url,
        duration: selectedDuration,
        created_at: new Date().toISOString(),
      };
      setCurrentVideo(newVideoSample);

      // Save prompt to Recent Prompts (Last 5 successful)
      saveSuccessfulPrompt(prompt.trim(), selectedModel, selectedDuration, selectedRatio);

      // Synchronize credits using server-authoritative balance (single source of truth)
      if (user) {
        const remaining =
          typeof data.remaining_credits === 'number'
            ? data.remaining_credits
            : Math.max(0, (user.credits || 0) - requiredCredits);
        const updatedUser = { ...user, credits: remaining };
        setUser(updatedUser);
        try {
          if (typeof window !== 'undefined') {
            localStorage.setItem('nexverze_studio_user', JSON.stringify(updatedUser));
          }
        } catch (e) {
          console.warn('LocalStorage save error:', e);
        }

        const genRecord: StudioGeneration = {
          id: crypto.randomUUID(),
          user_id: user.id,
          email: user.email,
          prompt: prompt.trim(),
          model: selectedModel,
          duration: selectedDuration,
          credits_used: requiredCredits,
          video_url: data.video_url,
          image_url: imageUrl || undefined,
          status: 'completed',
          aspect_ratio: selectedRatio,
          created_at: new Date().toISOString(),
        };
        await saveStudioGeneration(genRecord);

        // System logic: log real API consumption rate alongside credit deductions to track margins per model
        logApiConsumption(selectedModel, selectedDuration, requiredCredits);
      }
    } catch (err: any) {
      console.error('Generation error:', err);
      clearInterval(progressInterval);
      setGenerationError(err?.message || 'Generation failed, try again');
    } finally {
      setIsGenerating(false);
      setGenerationProgress(0);
      setGenerationStage('Initializing Neural Pipeline...');
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_STUDIO_SQL);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  return (
    <div className="min-h-screen bg-[#0a0a12] text-slate-100 flex flex-col justify-between selection:bg-purple-600 selection:text-white">
      {/* Top Header: Logo + Home (/) + Studio (active) + History (/studio/history) */}
      <Header
        user={user}
        activeView={activeView}
        setActiveView={navigateToView}
        onOpenCreditModal={() => {
          setInsufficientCreditTrigger(false);
          setIsCreditModalOpen(true);
        }}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onOpenZipModal={() => setIsZipModalOpen(true)}
        onOpenSequenceBuilder={() => setIsSequenceBuilderOpen(true)}
        onLogout={() => {
          localStorage.removeItem('nexverze_studio_user');
          setUser(null);
        }}
      />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
        {/* Navigation View Selector */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => navigateToView('studio')}
              className={`px-3.5 py-1.5 rounded-xl text-xs mono font-semibold transition-colors ${
                activeView === 'studio'
                  ? 'bg-purple-600/30 text-purple-300 border border-purple-500/40'
                  : 'text-white/60 hover:text-white bg-[#18181b]'
              }`}
            >
              Studio Generator
            </button>
            <button
              onClick={() => navigateToView('history')}
              className={`px-3.5 py-1.5 rounded-xl text-xs mono font-semibold transition-colors ${
                activeView === 'history'
                  ? 'bg-purple-600/30 text-purple-300 border border-purple-500/40'
                  : 'text-white/60 hover:text-white bg-[#18181b]'
              }`}
            >
              History Vault
            </button>
            <button
              onClick={() => setIsSequenceBuilderOpen(true)}
              className="px-3.5 py-1.5 rounded-xl text-xs mono font-semibold transition-colors flex items-center gap-1.5 text-cyan-300 hover:text-white bg-[#18181b] hover:bg-[#202028] border border-cyan-500/25 cursor-pointer"
              title="Open Sequence Builder & Multi-Clip Timeline"
            >
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>Sequence Builder</span>
            </button>

            {/* Active Sub-page indicators */}
            {activeView === 'privacy' && (
              <span className="px-3.5 py-1.5 rounded-xl text-xs mono font-semibold bg-purple-600/30 text-purple-300 border border-purple-500/40">
                Privacy Policy
              </span>
            )}
            {activeView === 'terms' && (
              <span className="px-3.5 py-1.5 rounded-xl text-xs mono font-semibold bg-purple-600/30 text-purple-300 border border-purple-500/40">
                Terms of Service
              </span>
            )}
            {activeView === 'refund' && (
              <span className="px-3.5 py-1.5 rounded-xl text-xs mono font-semibold bg-purple-600/30 text-purple-300 border border-purple-500/40">
                Refund & Cancellation
              </span>
            )}
            {activeView === 'contact' && (
              <span className="px-3.5 py-1.5 rounded-xl text-xs mono font-semibold bg-purple-600/30 text-purple-300 border border-purple-500/40">
                Contact Support
              </span>
            )}
          </div>

          {activeView !== 'studio' && (
            <button
              onClick={() => navigateToView('studio')}
              className="text-xs mono text-purple-400 hover:text-purple-300 hover:underline flex items-center gap-1"
            >
              <span>← Back to Studio</span>
            </button>
          )}
        </div>

        {/* 1. STUDIO LANDING PAGE VIEW */}
        {activeView === 'studio' && (
          <div className="space-y-6 sm:space-y-7 animate-in fade-in duration-300">
            {/* HERO SECTION WITH BIG CTA BUTTONS & HOME PAGE PREVIEW PANEL */}
            <HeroSection
              onOpenStudioWithMode={handleOpenStudioWithMode}
              isStudioOpen={false}
              onRemixVideo={handleRemixVideo}
              currentUserEmail={user?.email}
            />

            {/* PERSISTENT GALAXY PRICING STRATEGY BANNER: Lifetime Validity & ₹99 Trial Pack */}
            <div className="relative rounded-3xl bg-gradient-to-r from-[#170e2e]/95 via-[#0e0a22]/95 to-[#191036]/95 border border-purple-500/40 p-5 sm:p-6 overflow-hidden shadow-[0_0_50px_rgba(168,85,247,0.22)] backdrop-blur-xl flex flex-col lg:flex-row lg:items-center justify-between gap-5 group transition-all hover:border-purple-400/60 animate-float-subtle">
              {/* Cosmic Nebula Backdrops */}
              <div className="absolute -top-20 -right-20 w-80 h-80 bg-purple-600/20 rounded-full blur-3xl pointer-events-none group-hover:bg-purple-600/30 transition-all duration-700" />
              <div className="absolute -bottom-20 -left-10 w-72 h-72 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute top-1/2 left-1/3 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="space-y-2.5 relative z-10 max-w-3xl">
                {/* Badges Strip */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500 text-slate-950 text-[11px] font-black uppercase tracking-wider shadow-md shadow-orange-500/20 flex items-center gap-1.5 animate-pulse">
                    <span>⚡</span>
                    <span>TRIAL PACK • ₹99 ONLY</span>
                  </span>

                  <span className="px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-200 text-[11px] font-bold uppercase tracking-wider mono flex items-center gap-1.5 backdrop-blur-md">
                    <Clock className="w-3.5 h-3.5 text-purple-300" />
                    <span>Lifetime Validity — Credits Never Expire!</span>
                  </span>

                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] mono font-semibold flex items-center gap-1">
                    <span>🇮🇳</span>
                    <span>Instant UPI / GPay / PhonePe</span>
                  </span>
                </div>

                {/* Main Heading */}
                <h2 className="text-lg sm:text-xl lg:text-2xl font-black text-white tracking-tight flex flex-wrap items-center gap-2">
                  <span>Create 3 Cinematic Videos for</span>
                  <span className="galaxy-text font-black text-xl sm:text-2xl">just ₹99</span>
                  <span className="text-white/40 hidden sm:inline">•</span>
                  <span className="text-amber-300 font-semibold text-sm sm:text-base">
                    No Monthly Subscriptions
                  </span>
                </h2>

                {/* High-Intent Value Proposition */}
                <p className="text-xs sm:text-[13px] text-white/80 leading-relaxed max-w-2xl">
                  Get <strong className="text-amber-300 font-mono">150 Credits for ₹99</strong> (generate 3 Luma Ray 3 videos OR 1 Kling v2.5 Turbo video). Switch freely between <strong>Luma Ray 3, Kling Pro, and Google Veo 3.1</strong> from one shared wallet. Top up once, create anytime with zero monthly expiration trap.
                </p>

                {/* Feature Checklist */}
                <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] mono text-white/60">
                  <span className="flex items-center gap-1">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    100% Watermark-Free HD Exports
                  </span>
                  <span className="flex items-center gap-1">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    Sequence Builder Timeline Included
                  </span>
                  <span className="flex items-center gap-1">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    Commercial Creator License
                  </span>
                </div>
              </div>

              {/* Action Conversion Button */}
              <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end gap-2 shrink-0 relative z-10 pt-2 lg:pt-0">
                <button
                  type="button"
                  onClick={() => {
                    setInsufficientCreditTrigger(false);
                    setIsCreditModalOpen(true);
                  }}
                  className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-purple-500 via-indigo-500 to-purple-600 hover:from-purple-400 hover:to-indigo-500 text-white font-bold text-sm mono shadow-xl shadow-purple-600/35 active:scale-95 transition-all flex items-center justify-center gap-2.5 ring-2 ring-purple-400/40"
                >
                  <Sparkles className="w-4 h-4 text-amber-300 fill-amber-300" />
                  <span>⚡ Claim ₹99 Trial Pack</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <span className="text-[10px] text-white/40 mono text-center lg:text-right">
                  🔒 Razorpay Secured • Instant 150cr Credit
                </span>
              </div>
            </div>

            {/* SHOWCASE GALLERY (Sample Videos Grid with Upload Feature Above FAQ) */}
            <ShowcaseGallery
              onRemixVideo={handleRemixVideo}
              onOpenStudioWithMode={handleOpenStudioWithMode}
              currentUserEmail={user?.email}
            />

            {/* HELP & FAQ SECTION AT THE BOTTOM OF LANDING PAGE */}
            <HelpFaqSection
              onOpenPlans={() => {
                setInsufficientCreditTrigger(false);
                setIsCreditModalOpen(true);
              }}
              onOpenSequenceBuilder={() => setIsSequenceBuilderOpen(true)}
            />
          </div>
        )}

        {/* 1.B. DEDICATED STUDIO APP WORKSPACE VIEW (Runway Mode) */}
        {activeView === 'studioApp' && (
          <div className="space-y-6 sm:space-y-7 animate-in fade-in duration-300">
            {/* Dedicated Top Bar: Back to Website & Mode Switcher */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between bg-gradient-to-r from-purple-950/90 via-[#181824] to-indigo-950/90 border border-purple-500/40 p-4 sm:p-5 rounded-3xl shadow-xl gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 flex items-center justify-center text-white shadow-md shrink-0">
                  <Sparkles className="w-5 h-5 fill-white" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2 flex-wrap">
                    <span>Studio Creation Workspace</span>
                    <span className="text-[10px] mono bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-500/30 font-bold">
                      Runway Mode
                    </span>
                  </h2>
                  <p className="text-xs text-purple-200/80">
                    Generate 4K AI videos with custom prompts, models, multi-images, aspect ratios & batch queue
                  </p>
                </div>
              </div>

              {/* Mode Switcher & Navigation */}
              <div className="flex flex-wrap items-center gap-2.5">
                {/* Generation Mode Switcher */}
                <div className="flex items-center bg-[#0d0d14] p-1 rounded-2xl border border-purple-500/30">
                  <button
                    type="button"
                    onClick={() => setStudioModeTab('single')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold mono transition-all flex items-center gap-1.5 cursor-pointer ${
                      studioModeTab === 'single'
                        ? 'bg-purple-600 text-white shadow-md'
                        : 'text-white/60 hover:text-white'
                    }`}
                  >
                    <Film className="w-3.5 h-3.5" />
                    <span>Single Studio</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setStudioModeTab('batch')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold mono transition-all flex items-center gap-1.5 cursor-pointer ${
                      studioModeTab === 'batch'
                        ? 'bg-gradient-to-r from-amber-500 to-fuchsia-600 text-white shadow-md shadow-fuchsia-950/40'
                        : 'text-white/60 hover:text-white'
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-300" />
                    <span>⚡ Batch Queue</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => navigateToView('studio')}
                  className="px-4 py-2 rounded-xl bg-purple-950/60 hover:bg-purple-900/60 text-purple-200 hover:text-white font-extrabold mono text-xs border border-purple-400/30 transition-all cursor-pointer shadow-sm flex items-center gap-1.5"
                >
                  <span>← Back to Website</span>
                </button>
              </div>
            </div>

            {/* Global Notice Toast */}
            {globalNotice && (
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-950/90 to-indigo-950/90 border border-purple-400/40 text-xs text-white font-mono flex items-center gap-2.5 shadow-lg animate-in fade-in">
                <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
                <span>{globalNotice}</span>
              </div>
            )}

            {/* Error Notification */}
            {generationError && (
              <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <div className="font-bold text-red-300 text-sm">Generation Error</div>
                  <p className="text-white/80 mt-1">{generationError}</p>
                </div>
              </div>
            )}

            {/* Primary Studio Feature Tabs: Text to Video, Image to Video, Mobile to Cinematic */}
            <div className="flex flex-wrap items-center gap-2 bg-[#121020] p-1.5 rounded-2xl border border-purple-500/30">
              <button
                type="button"
                onClick={() => {
                  setActiveStudioTab('text');
                  if (studioModeTab === 'batch') setStudioModeTab('single');
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold mono transition-all flex items-center gap-2 cursor-pointer ${
                  activeStudioTab === 'text' && studioModeTab === 'single'
                    ? 'bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white shadow-lg'
                    : 'text-white/60 hover:text-white bg-white/5'
                }`}
              >
                <Wand2 className="w-4 h-4 text-amber-300" />
                <span>✨ Text to Video</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveStudioTab('image');
                  if (studioModeTab === 'batch') setStudioModeTab('single');
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold mono transition-all flex items-center gap-2 cursor-pointer ${
                  activeStudioTab === 'image' && studioModeTab === 'single'
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg'
                    : 'text-white/60 hover:text-white bg-white/5'
                }`}
              >
                <span>🖼️ Image to Video</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveStudioTab('mobile-to-cinematic');
                  if (studioModeTab === 'batch') setStudioModeTab('single');
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold mono transition-all flex items-center gap-2 cursor-pointer ${
                  activeStudioTab === 'mobile-to-cinematic' && studioModeTab === 'single'
                    ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-pink-600 text-black font-extrabold shadow-lg'
                    : 'text-amber-300/80 hover:text-amber-300 bg-amber-950/20 border border-amber-500/30'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>🎥 Mobile to Cinematic</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveStudioTab('watermark');
                  if (studioModeTab === 'batch') setStudioModeTab('single');
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold mono transition-all flex items-center gap-2 cursor-pointer ${
                  activeStudioTab === 'watermark' && studioModeTab === 'single'
                    ? 'bg-gradient-to-r from-purple-500 via-indigo-600 to-purple-700 text-white shadow-lg'
                    : 'text-purple-300/80 hover:text-purple-300 bg-purple-950/20 border border-purple-500/30'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-cyan-300" />
                <span>🛡️ Watermark Studio</span>
              </button>
            </div>

            {/* If Batch Mode is selected */}
            {studioModeTab === 'batch' ? (
              <div className="bg-[#18181b] border border-[#27272a] rounded-3xl p-6 sm:p-7 shadow-xl">
                <BatchGenerationMode
                  user={user}
                  onUpdateUser={(updatedUser) => setUser(updatedUser)}
                  defaultModel={selectedModel}
                  defaultDuration={selectedDuration}
                  defaultRatio={selectedRatio}
                  audioConfig={audioConfig}
                  motionIntensity={motionIntensity}
                  sceneTransition={sceneTransition}
                  isFreeUser={isFreeUser}
                  onOpenPlans={() => {
                    setInsufficientCreditTrigger(false);
                    setIsCreditModalOpen(true);
                  }}
                  onSelectVideoForPlayer={(sample) => {
                    setCurrentVideo(sample);
                    showGlobalNotice(`✓ Loaded "${sample.title}" to Master Preview Player!`);
                  }}
                />
              </div>
            ) : activeStudioTab === 'mobile-to-cinematic' ? (
              <MobileToCinematicStudio
                user={user}
                onOpenAuth={() => setIsAuthModalOpen(true)}
                onOpenPlans={() => {
                  setInsufficientCreditTrigger(false);
                  setIsCreditModalOpen(true);
                }}
                setIsCreditModalOpen={setIsCreditModalOpen}
                onRemixVideo={(cfg) => {
                  setPrompt(cfg.prompt);
                  setSelectedModel(cfg.modelName as any);
                  setSelectedDuration(cfg.duration as any);
                  setSelectedRatio(cfg.aspectRatio);
                  setActiveStudioTab('text');
                  showGlobalNotice('✨ Loaded cinematic prompt into studio workspace!');
                }}
                onBackToStudio={() => setActiveStudioTab('text')}
              />
            ) : activeStudioTab === 'watermark' ? (
              <WatermarkStudio
                onBackToStudio={() => setActiveStudioTab('text')}
                user={user}
                onOpenPlans={() => {
                  setInsufficientCreditTrigger(false);
                  setIsCreditModalOpen(true);
                }}
                setIsCreditModalOpen={setIsCreditModalOpen}
              />
            ) : (
              <div id="studio-workspace-anchor" className="space-y-6 pt-2">
                <div className="space-y-6 animate-in fade-in duration-200">
                  {/* Split Grid: Left Controls | Right Quality Lock Viewport */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column (6 Cols): Input & Controls */}
              <div className="lg:col-span-6 bg-[#18181b] border border-[#27272a] rounded-3xl p-6 sm:p-7 space-y-6 shadow-xl">
                {/* 1. Dynamic Cropping Boundaries Image Upload Guide */}
                <div id="image-upload-guide-container">
                  <ImageUploadGuide
                  imageUrl={imageUrl}
                  imageUrls={imageUrls}
                  onImageUpload={handleImageUpload}
                  onImagesUpload={handleImagesUpload}
                  onRemoveImage={() => {
                    setImageUrl(null);
                    setImageUrls([]);
                  }}
                  onRemoveImageAt={handleRemoveImageAt}
                  onClearAllImages={handleClearAllImages}
                  selectedRatio={selectedRatio}
                  onRatioChange={setSelectedRatio}
                  prompt={prompt}
                  onPromptChange={setPrompt}
                  onEnhancePrompt={handleEnhancePrompt}
                  isEnhancingPrompt={isEnhancingPrompt}
                  promptEnhancedSuccess={promptEnhancedSuccess}
                  onGenerate={handleGenerate}
                  isGenerating={isGenerating}
                  generationProgress={generationProgress}
                  liveCreditCost={liveCreditCost}
                  userCredits={user?.credits || 0}
                  selectedModelName={FAL_MODELS[selectedModel].name}
                />
                </div>

                {/* 2. Text Prompt Input */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-extrabold uppercase tracking-wider mono flex items-center gap-2">
                      <Wand2 className="w-4 h-4 text-fuchsia-400" />
                      <span className="bg-gradient-to-r from-purple-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent font-black text-sm sm:text-base tracking-wide">
                        {t('textToVideo')}
                      </span>
                    </label>
                    <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                      <LanguageSelectorButton size="sm" />
                      {/* Prompt Enhancer Button */}
                      <button
                        type="button"
                        onClick={handleEnhancePrompt}
                        disabled={isEnhancingPrompt}
                        className={`text-xs px-2.5 py-1 rounded-xl mono flex items-center gap-1.5 transition-all border ${
                          promptEnhancedSuccess
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : 'bg-purple-600/15 hover:bg-purple-600/25 text-purple-300 border-purple-500/30 active:scale-95'
                        }`}
                        title="Enhance prompt with cinematic lighting, camera moves, and engine details"
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
                      <span className="mono text-[11px] text-white/40">{prompt.length}/500 chars</span>
                    </div>
                  </div>

                  {/* REMIX NOTIFICATION BANNER */}
                  {remixBanner.active && (
                    <div className="p-3 rounded-2xl bg-gradient-to-r from-purple-900/80 via-indigo-900/80 to-purple-900/80 border border-purple-400/50 flex items-center justify-between gap-3 text-xs text-white shadow-lg animate-fade-in ring-1 ring-purple-400/30">
                      <div className="flex items-center gap-2">
                        <Shuffle className="w-4 h-4 text-amber-300 animate-spin shrink-0" />
                        <span className="font-semibold text-purple-200">
                          {remixBanner.message}
                        </span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40 mono font-bold shrink-0">
                        ⚡ Remixed
                      </span>
                    </div>
                  )}

                  <PromptAutocompleteTextarea
                    id="studio-prompt-textarea"
                    rows={3}
                    value={prompt}
                    onChange={setPrompt}
                    placeholder="Enter detailed cinematic scene description, camera angles, lighting, mood... (Type for cinematic autocomplete)"
                    className="w-full bg-[#0f0f17] border border-[#27272a] focus:border-purple-500 focus:ring-1 focus:ring-purple-500 rounded-2xl p-3.5 text-sm text-white placeholder-white/30 outline-none resize-none transition"
                  />

                  {/* VIRAL PROMPT CHIPS (1-Click Presets for Reels) */}
                  <ViralPromptChips onSelectPrompt={setPrompt} activePrompt={prompt} />

                  {/* RECENT PROMPTS DRAWER (Saves last 5 successful prompts for quick re-apply or iteration) */}
                  <div className="space-y-2 pt-0.5">
                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setIsRecentPromptsDrawerOpen(!isRecentPromptsDrawerOpen)}
                        className={`flex items-center gap-1.5 text-xs font-semibold mono px-2.5 py-1.5 rounded-xl border transition-all select-none ${
                          isRecentPromptsDrawerOpen
                            ? 'bg-purple-900/40 border-purple-500 text-purple-200 shadow-sm shadow-purple-900/30 ring-1 ring-purple-500/30'
                            : 'bg-[#0f0f17] border-[#27272a] hover:border-purple-500/40 text-white/70 hover:text-white'
                        }`}
                        title="Click to toggle Recent Prompts drawer (Last 5 successful generations)"
                      >
                        <History className="w-3.5 h-3.5 text-purple-400" />
                        <span>Recent Prompts</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-purple-500/25 text-purple-200 border border-purple-400/30 font-bold">
                          {recentPrompts.length}/5
                        </span>
                        {isRecentPromptsDrawerOpen ? (
                          <ChevronUp className="w-3.5 h-3.5 text-purple-300 ml-0.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 text-purple-300 ml-0.5" />
                        )}
                      </button>

                      {isRecentPromptsDrawerOpen && recentPrompts.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setRecentPrompts([]);
                            if (typeof window !== 'undefined') {
                              localStorage.removeItem('nexverze_recent_prompts');
                            }
                          }}
                          className="text-[10px] mono text-white/40 hover:text-rose-400 transition-colors flex items-center gap-1"
                          title="Clear recent prompts"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Clear Recent</span>
                        </button>
                      )}
                    </div>

                    {/* Expandable Drawer Body */}
                    {isRecentPromptsDrawerOpen && (
                      <div className="bg-[#0c0c14] border border-[#272738] rounded-2xl p-3 space-y-2 animate-in fade-in slide-in-from-top-2 duration-150 shadow-xl">
                        <div className="flex items-center justify-between pb-2 border-b border-[#272738] text-[10px] mono text-white/50">
                          <span className="flex items-center gap-1 text-purple-300 font-semibold">
                            <Sparkles className="w-3 h-3 text-purple-400" />
                            <span>Recent Successful Prompts (Last 5)</span>
                          </span>
                          <span className="text-white/40">
                            Re-apply or iterate ideas
                          </span>
                        </div>

                        {recentPrompts.length === 0 ? (
                          <div className="text-center py-4 text-xs text-white/40 italic">
                            No recent prompts saved yet. Generate a video to save prompts automatically!
                          </div>
                        ) : (
                          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                            {recentPrompts.map((item, idx) => {
                              const isApplied = appliedPromptId === item.id;
                              const isCopied = copiedPromptId === item.id;
                              return (
                                <div
                                  key={item.id}
                                  className="bg-[#12121d] border border-[#272738] hover:border-purple-500/40 rounded-xl p-2.5 space-y-1.5 transition-all text-xs"
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-[10px] mono font-bold text-purple-400 bg-purple-950/60 border border-purple-500/30 px-1.5 py-0.2 rounded">
                                        #{idx + 1}
                                      </span>
                                      <span className="text-[10px] mono uppercase text-white/80 font-semibold bg-white/5 px-1.5 py-0.2 rounded">
                                        {item.model}
                                      </span>
                                      <span className="text-[10px] mono text-white/40">
                                        {item.duration} • {item.aspect_ratio}
                                      </span>
                                    </div>
                                    <span className="text-[10px] mono text-white/40">
                                      {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  </div>

                                  <p className="text-xs text-white/90 line-clamp-2 italic font-sans leading-relaxed">
                                    "{item.prompt}"
                                  </p>

                                  <div className="flex items-center justify-between pt-1 border-t border-white/[0.04]">
                                    <div className="flex items-center gap-1.5">
                                      {/* Quick Apply */}
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setPrompt(item.prompt);
                                          setSelectedModel(item.model);
                                          setSelectedDuration(item.duration);
                                          setSelectedRatio(item.aspect_ratio);
                                          setAppliedPromptId(item.id);
                                          setTimeout(() => setAppliedPromptId(null), 2000);
                                        }}
                                        className={`px-2.5 py-1 rounded-lg text-[10px] mono font-semibold flex items-center gap-1 transition-all ${
                                          isApplied
                                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                            : 'bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 active:scale-95'
                                        }`}
                                        title="Apply this prompt to creative input"
                                      >
                                        {isApplied ? (
                                          <>
                                            <Check className="w-3 h-3 text-emerald-400" />
                                            <span>Applied!</span>
                                          </>
                                        ) : (
                                          <>
                                            <Wand2 className="w-3 h-3 text-purple-400" />
                                            <span>Apply</span>
                                          </>
                                        )}
                                      </button>

                                      {/* Iterate on Idea */}
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setPrompt(`${item.prompt}, volumetric lighting, cinematic depth, 8k camera tracking`);
                                          setSelectedModel(item.model);
                                          setAppliedPromptId(item.id);
                                          setTimeout(() => setAppliedPromptId(null), 2000);
                                        }}
                                        className="px-2.5 py-1 rounded-lg text-[10px] mono text-cyan-300 bg-cyan-950/40 hover:bg-cyan-900/40 border border-cyan-500/30 flex items-center gap-1 transition-all active:scale-95"
                                        title="Load prompt with creative iteration directives"
                                      >
                                        <Sparkles className="w-3 h-3 text-cyan-400" />
                                        <span>Iterate</span>
                                      </button>
                                    </div>

                                    <div className="flex items-center gap-1">
                                      {/* Copy */}
                                      <button
                                        type="button"
                                        onClick={() => {
                                          navigator.clipboard.writeText(item.prompt);
                                          setCopiedPromptId(item.id);
                                          setTimeout(() => setCopiedPromptId(null), 2000);
                                        }}
                                        className="p-1 rounded hover:bg-white/10 text-white/50 hover:text-white transition-colors"
                                        title="Copy prompt text"
                                      >
                                        {isCopied ? (
                                          <Check className="w-3 h-3 text-emerald-400" />
                                        ) : (
                                          <Copy className="w-3 h-3" />
                                        )}
                                      </button>

                                      {/* Delete item */}
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setRecentPrompts((prev) => {
                                            const updated = prev.filter((p) => p.id !== item.id);
                                            if (typeof window !== 'undefined') {
                                              localStorage.setItem('nexverze_recent_prompts', JSON.stringify(updated));
                                            }
                                            return updated;
                                          });
                                        }}
                                        className="p-1 rounded hover:bg-rose-500/20 text-white/40 hover:text-rose-400 transition-colors"
                                        title="Remove from recent"
                                      >
                                        <Trash2 className="w-3 h-3" />
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
                  </div>

                  {/* Prompt Inspirations */}
                  <div className="space-y-1.5 pt-0.5">
                    <span className="mono text-[10px] uppercase text-white/40 font-semibold">
                      Prompt Inspirations:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {PROMPT_INSPIRATIONS.map((insp, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setPrompt(insp.text);
                            setSelectedModel(insp.model === 'veo3' ? 'veo' : (insp.model as ModelType));
                          }}
                          className="text-[11px] px-2.5 py-1 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] text-white/70 hover:text-white transition-colors text-left"
                        >
                          {insp.category}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 3. Model Selector (3 Buttons with Badge + Modal Info ? Combo) */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold uppercase tracking-wider text-white/60 mono">
                      AI Model Engine
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsCompareDrawerOpen(true)}
                      className="text-xs text-purple-400 hover:text-purple-300 mono flex items-center gap-1 transition-colors"
                    >
                      <span>Compare Models</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Two Rows Layout: Row 1 (3 Models), Row 2 (3 Models) */}
                  <div className="space-y-3">
                    {/* Row 1: 3 Models */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] mono text-white/50 px-1">
                        <span className="flex items-center gap-1.5 font-semibold text-purple-300 tracking-wide">
                          <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse"></span>
                          ROW 1 • ULTRA-FAST & SOTA OPEN ENGINES
                        </span>
                        <span className="text-[10px] text-white/40 mono">3 Models (LTX • Luma • Wan)</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 sm:gap-3">
                        {(['ltx', 'luma', 'wan'] as const).map((mKey) => {
                          const m = FAL_MODELS[mKey];
                          const isSelected = selectedModel === mKey;
                          const baseCost = MODEL_COST[mKey]?.[selectedDuration] || MODEL_COST[mKey]?.['5s'] || 50;

                          return (
                            <div
                              key={mKey}
                              onClick={() => setSelectedModel(mKey)}
                              className={`relative cursor-pointer p-3 sm:p-3.5 rounded-2xl border text-left transition-all group ${
                                isSelected
                                  ? 'bg-gradient-to-r from-[#9333ea] via-[#c026d3] to-[#ec4899] border-fuchsia-300 text-white shadow-xl shadow-fuchsia-500/30 ring-2 ring-fuchsia-400/50 scale-[1.02]'
                                  : 'bg-[#0f0f17] border-[#27272a] text-white/60 hover:text-white hover:border-fuchsia-500/40 hover:bg-[#151522]'
                              }`}
                            >
                              {/* Top-right ? info button */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setInfoModalModel(mKey);
                                }}
                                className={`absolute top-2 right-2 p-1 rounded-lg transition-colors ${
                                  isSelected ? 'bg-black/20 hover:bg-black/40 text-white' : 'hover:bg-white/10 text-white/40 hover:text-white'
                                }`}
                                title={`Inspect ${m.name} specifications & sample`}
                              >
                                <HelpCircle className="w-3.5 h-3.5" />
                              </button>

                              <div className="pr-4">
                                <div className="font-extrabold text-xs sm:text-sm text-white flex items-center gap-1">
                                  <span className="truncate">{m.name}</span>
                                  {isSelected && (
                                    <span className="text-[8px] font-black uppercase px-1.5 py-0.2 rounded-full bg-white/20 text-white border border-white/30 backdrop-blur-xs shrink-0">
                                      ON
                                    </span>
                                  )}
                                </div>
                                <div className={`text-[9px] mono truncate ${isSelected ? 'text-white/80 font-medium' : 'text-white/40'}`}>
                                  {m.versionName}
                                </div>
                              </div>

                              {/* Zero Watermark or Shield Badge */}
                              <div className="mt-1.5">
                                {m.isZeroWatermark ? (
                                  <span className={`text-[8px] sm:text-[9px] mono font-bold px-1.5 py-0.5 rounded border inline-block ${
                                    isSelected
                                      ? 'bg-black/30 text-emerald-200 border-emerald-300/40'
                                      : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
                                  }`}>
                                    ✓ Zero Watermark
                                  </span>
                                ) : (
                                  <span className={`text-[8px] sm:text-[9px] mono font-medium px-1.5 py-0.5 rounded border inline-block ${
                                    isSelected
                                      ? 'bg-black/20 text-white/90 border-white/20'
                                      : 'text-white/40 bg-white/5 border-white/10'
                                  }`}>
                                    🛡️ NexVerze Clean
                                  </span>
                                )}
                              </div>

                              <div className={`mt-2 flex items-baseline justify-between text-xs pt-1.5 border-t ${
                                isSelected ? 'border-white/20' : 'border-white/[0.05]'
                              }`}>
                                <span className={`mono font-black text-xs ${isSelected ? 'text-white' : 'text-purple-300'}`}>{baseCost}cr</span>
                                <span className={`text-[9px] font-mono ${isSelected ? 'text-white/90 font-bold' : 'text-emerald-400'}`}>
                                  ₹{Math.round(baseCost * 0.7)}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Row 2: 3 Models */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between text-[11px] mono text-white/50 px-1">
                        <span className="flex items-center gap-1.5 font-semibold text-fuchsia-300 tracking-wide">
                          <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-400 animate-pulse"></span>
                          ROW 2 • CINEMATIC PRO & HOLLYWOOD STUDIO
                        </span>
                        <span className="text-[10px] text-white/40 mono">3 Models (Hunyuan • Kling • Veo)</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 sm:gap-3">
                        {(['hunyuan', 'kling', 'veo'] as const).map((mKey) => {
                          const m = FAL_MODELS[mKey];
                          const isSelected = selectedModel === mKey;
                          const baseCost = MODEL_COST[mKey]?.[selectedDuration] || MODEL_COST[mKey]?.['5s'] || 50;

                          return (
                            <div
                              key={mKey}
                              onClick={() => setSelectedModel(mKey)}
                              className={`relative cursor-pointer p-3 sm:p-3.5 rounded-2xl border text-left transition-all group ${
                                isSelected
                                  ? 'bg-gradient-to-r from-[#9333ea] via-[#c026d3] to-[#ec4899] border-fuchsia-300 text-white shadow-xl shadow-fuchsia-500/30 ring-2 ring-fuchsia-400/50 scale-[1.02]'
                                  : 'bg-[#0f0f17] border-[#27272a] text-white/60 hover:text-white hover:border-fuchsia-500/40 hover:bg-[#151522]'
                              }`}
                            >
                              {/* Top-right ? info button */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setInfoModalModel(mKey);
                                }}
                                className={`absolute top-2 right-2 p-1 rounded-lg transition-colors ${
                                  isSelected ? 'bg-black/20 hover:bg-black/40 text-white' : 'hover:bg-white/10 text-white/40 hover:text-white'
                                }`}
                                title={`Inspect ${m.name} specifications & sample`}
                              >
                                <HelpCircle className="w-3.5 h-3.5" />
                              </button>

                              <div className="pr-4">
                                <div className="font-extrabold text-xs sm:text-sm text-white flex items-center gap-1">
                                  <span className="truncate">{m.name}</span>
                                  {isSelected && (
                                    <span className="text-[8px] font-black uppercase px-1.5 py-0.2 rounded-full bg-white/20 text-white border border-white/30 backdrop-blur-xs shrink-0">
                                      ON
                                    </span>
                                  )}
                                </div>
                                <div className={`text-[9px] mono truncate ${isSelected ? 'text-white/80 font-medium' : 'text-white/40'}`}>
                                  {m.versionName}
                                </div>
                              </div>

                              {/* Zero Watermark or Shield Badge */}
                              <div className="mt-1.5">
                                {m.isZeroWatermark ? (
                                  <span className={`text-[8px] sm:text-[9px] mono font-bold px-1.5 py-0.5 rounded border inline-block ${
                                    isSelected
                                      ? 'bg-black/30 text-emerald-200 border-emerald-300/40'
                                      : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
                                  }`}>
                                    ✓ Zero Watermark
                                  </span>
                                ) : (
                                  <span className={`text-[8px] sm:text-[9px] mono font-medium px-1.5 py-0.5 rounded border inline-block ${
                                    isSelected
                                      ? 'bg-black/20 text-white/90 border-white/20'
                                      : 'text-white/40 bg-white/5 border-white/10'
                                  }`}>
                                    🛡️ NexVerze Clean
                                  </span>
                                )}
                              </div>

                              <div className={`mt-2 flex items-baseline justify-between text-xs pt-1.5 border-t ${
                                isSelected ? 'border-white/20' : 'border-white/[0.05]'
                              }`}>
                                <span className={`mono font-black text-xs ${isSelected ? 'text-white' : 'text-purple-300'}`}>{baseCost}cr</span>
                                <span className={`text-[9px] font-mono ${isSelected ? 'text-white/90 font-bold' : 'text-emerald-400'}`}>
                                  ₹{Math.round(baseCost * 0.7)}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. Durations Selector (5s, 8s, 10s based on model) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold uppercase tracking-wider text-white/60 mono flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-purple-400" />
                      <span>Duration</span>
                    </label>
                    <span className="mono text-[11px] text-purple-300 font-bold">
                      {liveCreditCost} credits (₹{inrEstimate} value)
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    {(['5s', '8s', '10s', '15s'] as const).map((dur) => {
                      const isAvailable = FAL_MODELS[selectedModel].durations.includes(dur);
                      const isSelected = selectedDuration === dur;
                      const durCost = MODEL_COST[selectedModel]?.[dur];

                      if (!isAvailable) {
                        return (
                          <div
                            key={dur}
                            className="py-2.5 px-2 rounded-xl border border-white/[0.04] bg-[#0f0f17]/40 text-center text-white/20 text-[11px] mono cursor-not-allowed"
                          >
                            <div>{dur}</div>
                            <div className="text-[8px]">N/A</div>
                          </div>
                        );
                      }

                      return (
                        <button
                          key={dur}
                          type="button"
                          onClick={() => setSelectedDuration(dur)}
                          className={`py-2.5 px-3 rounded-xl border text-center font-mono text-xs font-bold transition-all ${
                            isSelected
                              ? 'bg-purple-600 text-white border-purple-500 shadow-sm'
                              : 'bg-[#0f0f17] border-[#27272a] text-white/70 hover:text-white'
                          }`}
                        >
                          <div>{dur}</div>
                          <div className="text-[10px] opacity-80">{durCost}cr</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 5. Aspect Ratio Buttons with Quality Lock Rule */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold uppercase tracking-wider text-white/60 mono flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-purple-400" />
                      <span>Aspect Ratio</span>
                    </label>
                    <span className="text-[10px] text-emerald-400 mono flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      <span>Quality Lock: 1080x1920 Master</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: '9:16', label: '9:16 Vertical', desc: 'Reels / Shorts' },
                      { id: '16:9', label: '16:9 Cinema', desc: 'Widescreen' },
                      { id: '1:1', label: '1:1 Square', desc: 'Feed' },
                    ].map((ratio) => (
                      <button
                        key={ratio.id}
                        type="button"
                        onClick={() => setSelectedRatio(ratio.id as any)}
                        className={`p-2.5 rounded-xl border text-center transition-all ${
                          selectedRatio === ratio.id
                            ? 'bg-purple-950/30 border-purple-500 text-white shadow-sm'
                            : 'bg-[#0f0f17] border-[#27272a] text-white/60 hover:text-white'
                        }`}
                      >
                        <div className="font-bold text-xs mono">{ratio.id}</div>
                        <div className="text-[10px] text-white/40 mt-0.5">{ratio.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 5. AI Audio & Voiceover Integration */}
                <AudioVoiceoverStudio
                  config={audioConfig}
                  onChange={setAudioConfig}
                  videoPrompt={prompt}
                />

                {/* 6. Generate Action Button */}
                <div className="space-y-3 pt-2">
                  {/* Pay-to-Generate Free Preview Notice when credits are 0 or insufficient */}
                  {isFreeUser && (user?.credits || 0) < liveCreditCost && (
                    <div
                      onClick={() => {
                        setInsufficientCreditTrigger(true);
                        setIsCreditModalOpen(true);
                      }}
                      className="cursor-pointer p-3 rounded-2xl bg-gradient-to-r from-purple-950/60 to-indigo-950/60 border border-purple-500/30 hover:border-purple-400/50 flex items-center justify-between gap-3 text-xs transition-all shadow-md"
                    >
                      <div className="flex items-center gap-2">
                        <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                        <span className="text-white/80 text-[11px]">
                          <strong>Free Preview Active:</strong> Top up to run fresh AI generations.
                        </span>
                      </div>
                      <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30 mono font-bold shrink-0">
                        ₹99 Trial Pack ⚡
                      </span>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className={`w-full font-bold py-4 px-6 rounded-2xl shadow-xl flex items-center justify-center gap-2.5 text-sm transition-all active:scale-[0.99] disabled:opacity-60 ${
                      (user?.credits || 0) < liveCreditCost
                        ? 'bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-600/30 ring-1 ring-purple-400/30'
                        : 'bg-gradient-to-r from-purple-600 via-purple-500 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-600/30'
                    }`}
                  >
                    {isGenerating ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Rendering with {FAL_MODELS[selectedModel].name} ({generationProgress}%)...</span>
                      </>
                    ) : (user?.credits || 0) < liveCreditCost ? (
                      <>
                        <Sparkles className="w-4 h-4 fill-amber-300 text-amber-300" />
                        <span>
                          Generate Video (-{liveCreditCost}cr • Requires Credit Pack)
                        </span>
                        <ArrowRight className="w-4 h-4 opacity-70" />
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 fill-white" />
                        <span>
                          {t('generateVideo')} (-{liveCreditCost} {t('credits')})
                        </span>
                        <ArrowRight className="w-4 h-4 opacity-70" />
                      </>
                    )}
                  </button>

                  {isGenerating && (
                    <div className="space-y-2 pt-1 animate-in fade-in duration-200">
                      <div className="flex items-center justify-between text-xs mono">
                        <span className="text-purple-300 font-bold flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                          <span>Rendering AI Video</span>
                        </span>
                        <span className="text-amber-300 font-black text-sm px-2.5 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30">
                          {Math.round(generationProgress)}%
                        </span>
                      </div>
                      <div className="w-full h-3 bg-[#0f0f17] rounded-full overflow-hidden border border-purple-500/40 p-0.5 shadow-inner">
                        <div
                          className="h-full bg-gradient-to-r from-purple-500 via-fuchsia-500 to-amber-400 transition-all duration-150 ease-out rounded-full shadow-[0_0_15px_rgba(192,38,211,0.7)]"
                          style={{ width: `${Math.max(5, Math.min(100, generationProgress))}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[11px] mono text-purple-200/90 px-0.5">
                        <span className="animate-pulse">{generationStage}</span>
                        <span className="text-white/40">{Math.round(generationProgress)}%</span>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[11px] mono text-white/50 px-1">
                    <span>
                      User balance:{' '}
                      <strong className="text-purple-300">{user?.credits ?? 0}cr</strong>
                      {isFreeUser && (user?.credits || 0) === 0 && (
                        <span className="text-[10px] text-amber-300 ml-1.5">(Preview Mode)</span>
                      )}
                    </span>
                    <span>
                      {(user?.credits || 0) < liveCreditCost ? (
                        <button
                          type="button"
                          onClick={() => {
                            setInsufficientCreditTrigger(true);
                            setIsCreditModalOpen(true);
                          }}
                          className="text-amber-300 hover:text-amber-200 underline"
                        >
                          Unlock with ₹99 Pack
                        </button>
                      ) : (
                        <span>
                          After generate:{' '}
                          <strong className="text-white">
                            {Math.max(0, (user?.credits || 0) - liveCreditCost)}cr
                          </strong>
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column (6 Cols): Quality Lock Master Viewport */}
              <div className="lg:col-span-6 bg-[#18181b] border border-[#27272a] rounded-3xl p-6 sm:p-7 shadow-xl flex flex-col items-center">
                <div className="w-full flex items-center justify-between mb-4 pb-3 border-b border-[#27272a]">
                  <div>
                    <h3 className="font-bold text-white text-sm flex items-center gap-2">
                      <Film className="w-4 h-4 text-purple-400" />
                      <span>Live Output Preview</span>
                      {isFreeUser && (
                        <span
                          onClick={() => setIsCreditModalOpen(true)}
                          className="cursor-pointer text-[10px] mono px-2 py-0.5 rounded-full bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-300 flex items-center gap-1 transition-colors"
                          title="For remove watermark or watermark free video use our payment models (show our plans)"
                        >
                          <Lock className="w-3 h-3 text-purple-400" />
                          <span>Watermarked (Free)</span>
                        </span>
                      )}
                    </h3>
                    <p className="text-[11px] text-white/50">
                      Real-time CSS crop viewport on 1080x1920 source
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      ref={previewVideoInputRef}
                      onChange={handleUploadReferenceVideo}
                      accept="video/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => previewVideoInputRef.current?.click()}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs mono bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 transition-all font-semibold shadow-xs"
                      title="Upload your reference video to replace the preview panel video instantly"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Upload Reference Video</span>
                      <span className="sm:hidden">Upload</span>
                    </button>
                    {/* AI Upscale 2x Toggle Button */}
                    <button
                      type="button"
                      onClick={() => setIsAiUpscaleActive((prev) => !prev)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs mono transition-all border ${
                        isAiUpscaleActive
                          ? 'bg-gradient-to-r from-purple-900/60 to-cyan-900/60 border-cyan-400 text-cyan-200 shadow-md shadow-cyan-900/40 ring-1 ring-cyan-400/40'
                          : 'bg-[#121217] border-[#27272a] hover:border-purple-500/40 text-white/70 hover:text-white'
                      }`}
                      title="AI Upscale: Apply .ai-upscale-2x-active crisp filter and .ai-upscale-sheen overlay for 4K super-resolution"
                    >
                      <Sparkles className={`w-3.5 h-3.5 ${isAiUpscaleActive ? 'text-cyan-300 fill-cyan-300 animate-pulse' : 'text-purple-400'}`} />
                      <span className="font-semibold">AI Upscale</span>
                      <span
                        className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                          isAiUpscaleActive
                            ? 'bg-cyan-400/20 text-cyan-200 border border-cyan-400/30'
                            : 'bg-white/10 text-white/40'
                        }`}
                      >
                        {isAiUpscaleActive ? '4K UHD' : '2x'}
                      </span>
                    </button>

                    {isFreeUser && (
                      <button
                        type="button"
                        onClick={() => setIsCreditModalOpen(true)}
                        className="hidden sm:flex text-[11px] mono text-purple-300 hover:text-purple-200 underline items-center gap-1"
                        title="For remove watermark or watermark free video use our payment models (show our plans)"
                      >
                        <span>Remove Watermark</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </button>
                    )}
                    <div className="mono text-xs font-bold text-white bg-gradient-to-r from-[#9333ea] via-[#c026d3] to-[#ec4899] px-3 py-1 rounded-full border border-fuchsia-300/40 shadow-md shadow-fuchsia-500/20">
                      {FAL_MODELS[selectedModel].name.toUpperCase()}
                    </div>
                  </div>
                </div>

                {/* The Quality-Locked Player */}
                <QualityLockPlayer
                  videoUrl={
                    currentVideo.aspect_videos && currentVideo.aspect_videos[selectedRatio]
                      ? currentVideo.aspect_videos[selectedRatio]
                      : currentVideo.video_url
                  }
                  aspectRatio={selectedRatio}
                  onRatioChange={setSelectedRatio}
                  title={currentVideo.title}
                  modelName={FAL_MODELS[selectedModel].name}
                  duration={currentVideo.duration || selectedDuration}
                  timestamp={currentVideo.created_at}
                  prompt={currentVideo.prompt}
                  isFreeUser={isFreeUser}
                  user={user}
                  onCreditsUpdated={setUser}
                  onOpenPlans={() => setIsCreditModalOpen(true)}
                  motionIntensity={motionIntensity}
                  onMotionIntensityChange={setMotionIntensity}
                  sceneTransition={sceneTransition}
                  onSceneTransitionChange={setSceneTransition}
                  colorGrading={colorGrading}
                  onColorGradingChange={setColorGrading}
                  isAiUpscaleActive={isAiUpscaleActive}
                  onAiUpscaleChange={setIsAiUpscaleActive}
                  isGenerating={isGenerating}
                  generationProgress={generationProgress}
                  generationStage={generationStage}
                  fallbackUrl="/videos/sample-1.mp4"
                  onVideoError={(fallbackUrl) => {
                    setCurrentVideo((prev) => ({
                      ...prev,
                      video_url: fallbackUrl,
                    }));
                  }}
                  onRemix={handleRemixVideo}
                />
              </div>
            </div>
          </div>
        </div>
      )}

        {/* SHOWCASE GALLERY (Sample Videos Grid with Upload Feature Above FAQ) */}
        <ShowcaseGallery
          onRemixVideo={handleRemixVideo}
          onOpenStudioWithMode={handleOpenStudioWithMode}
          currentUserEmail={user?.email}
          isFreeUser={isFreeUser}
          onOpenPlans={() => {
            setInsufficientCreditTrigger(false);
            setIsCreditModalOpen(true);
          }}
          user={user}
        />

        {/* HELP & FAQ SECTION AT THE BOTTOM OF STUDIO PAGE */}
            <HelpFaqSection
              onOpenPlans={() => {
                setInsufficientCreditTrigger(false);
                setIsCreditModalOpen(true);
              }}
              onOpenSequenceBuilder={() => setIsSequenceBuilderOpen(true)}
            />
          </div>
        )}

        {/* 2. HISTORY VIEW */}
        {activeView === 'history' && (
          <HistoryView
            userEmail={user?.email}
            userId={user?.id}
            userCredits={user?.credits ?? 0}
            onSelectPrompt={(p, m, r) => {
              setPrompt(p);
              setSelectedModel((m === 'veo3' ? 'veo' : m) as ModelType);
              setSelectedRatio(r);
              setActiveView('studio');
            }}
            onNavigateToGallery={() => {
              setActiveView('studio');
              setTimeout(() => {
                document.getElementById('showcase-gallery')?.scrollIntoView({ behavior: 'smooth' });
              }, 120);
            }}
          />
        )}

        {/* 2.5 DEDICATED FAVORITES PAGE */}
        {activeView === 'favorites' && (
          <FavoritesPage
            userEmail={user?.email}
            onSelectPrompt={(p, m, r) => {
              setPrompt(p);
              setSelectedModel((m === 'veo3' ? 'veo' : m) as ModelType);
              setSelectedRatio(r);
              navigateToView('studio');
            }}
            onNavigateToHome={() => {
              navigateToView('studio');
              setTimeout(() => {
                document.getElementById('showcase-gallery')?.scrollIntoView({ behavior: 'smooth' });
              }, 120);
            }}
            onNavigateToStudio={() => navigateToView('studio')}
            onOpenSqlTab={() => navigateToView('sql')}
          />
        )}

        {/* 3. SUPABASE SCHEMA TAB */}
        {activeView === 'sql' && (
          <div className="bg-[#18181b] border border-[#27272a] rounded-3xl p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                  <Database className="w-5 h-5 text-emerald-400" />
                  <span>Supabase Database Schema Setup</span>
                </h2>
                <p className="text-xs text-white/50 mt-1">
                  Run this SQL in your Supabase project (<code className="text-purple-300">vfrndplroxqkoubzstwd.supabase.co</code>) SQL Editor.
                </p>
              </div>

              <button
                onClick={handleCopySql}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 font-semibold text-xs mono transition-colors"
              >
                {copiedSql ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Copied to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy Migration SQL</span>
                  </>
                )}
              </button>
            </div>

            <pre className="p-4 bg-[#0a0a12] border border-[#27272a] rounded-2xl text-xs font-mono text-emerald-400 overflow-x-auto leading-relaxed">
              {SUPABASE_STUDIO_SQL}
            </pre>
          </div>
        )}

        {/* 4. PRIVACY POLICY PAGE */}
        {activeView === 'privacy' && (
          <PrivacyPolicyPage
            onBackToStudio={() => navigateToView('studio')}
            onNavigate={navigateToView}
          />
        )}

        {/* 5. TERMS OF SERVICE PAGE */}
        {activeView === 'terms' && (
          <TermsPage
            onBackToStudio={() => navigateToView('studio')}
            onNavigate={navigateToView}
          />
        )}

        {/* 6. REFUND & CANCELLATION PAGE */}
        {activeView === 'refund' && (
          <RefundPolicyPage
            onBackToStudio={() => navigateToView('studio')}
            onNavigate={navigateToView}
          />
        )}

        {/* 7. CONTACT SUPPORT PAGE */}
        {activeView === 'contact' && (
          <ContactSupportPage
            onBackToStudio={() => navigateToView('studio')}
            onNavigate={navigateToView}
          />
        )}
      </main>

      {/* Modals & Drawers */}
      <CreditModal
        isOpen={isCreditModalOpen}
        onClose={() => {
          setIsCreditModalOpen(false);
          setInsufficientCreditTrigger(false);
          setAutoTriggerCheckout(false);
        }}
        user={user}
        requiredCredits={liveCreditCost}
        insufficientWarning={insufficientCreditTrigger}
        autoTriggerCheckout={autoTriggerCheckout}
        onCreditsUpdated={(updated) => {
          setUser(updated);
          setAutoTriggerCheckout(false);
        }}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onUserAuthenticated={(u) => setUser(u)}
      />

      <ZipExportModal
        isOpen={isZipModalOpen}
        onClose={() => setIsZipModalOpen(false)}
      />

      <ModelInfoModal
        modelKey={infoModalModel}
        onClose={() => setInfoModalModel(null)}
      />

      <CompareModelsDrawer
        isOpen={isCompareDrawerOpen}
        onClose={() => setIsCompareDrawerOpen(false)}
        onSelectModel={(m) => setSelectedModel(m)}
      />

      <SequenceBuilderDrawer
        isOpen={isSequenceBuilderOpen}
        onClose={() => setIsSequenceBuilderOpen(false)}
        availableGenerations={SAMPLE_VIDEOS}
        currentStudioVideo={{
          video_url: currentVideo.video_url,
          prompt: currentVideo.prompt,
          model: currentVideo.model,
          aspect_ratio: currentVideo.aspect_ratio,
          duration: currentVideo.duration,
        }}
        isFreeUser={isFreeUser}
        onOpenPlans={() => {
          setInsufficientCreditTrigger(false);
          setIsCreditModalOpen(true);
        }}
      />

      {/* WELCOME TRIAL & PREVIEW POPUP MODAL */}
      <WelcomeCreditsModal
        onStartCreating={() => {
          const el = document.getElementById('studio-prompt-textarea');
          if (el) el.focus();
        }}
        onClaimTrialPack={() => {
          setInsufficientCreditTrigger(false);
          setIsCreditModalOpen(true);
        }}
      />

      <Footer onNavigate={navigateToView} />
    </div>
  );
}
