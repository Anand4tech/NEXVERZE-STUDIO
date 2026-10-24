import React, { useState, useRef } from 'react';
import {
  Sparkles,
  Zap,
  Film,
  UserCheck,
  Music,
  Camera,
  Subtitles,
  RefreshCw,
  Check,
  Upload,
  Lock,
  Play,
  Square,
  Layers,
  Eye,
  Plus,
  X,
  ArrowRight,
  Wand2,
  Volume2,
} from 'lucide-react';
import {
  SmartSoundscapeConfig,
  BGM_MOOD_OPTIONS,
  SFX_AMBIENT_OPTIONS,
  smartSoundscapeEngine,
  BgmMoodType,
  SfxAmbientType,
} from '../lib/smartSoundscape';

export interface StoryboardSceneItem {
  sceneNumber: 1 | 2 | 3;
  title: string;
  prompt: string;
  cameraMove: string;
  duration: string;
  videoUrl?: string;
  status: 'idle' | 'generating' | 'completed' | 'error';
}

export interface CharacterLockConfig {
  enabled: boolean;
  characterTag: string;
  referenceImageUrl: string | null;
  traitDescription: string;
  presetId: string | null;
}

export type ViralCaptionStyle = 'hormozi' | 'tanglish-neon' | 'cinema-lower' | 'kinetic-pop';

export interface ViralCaptionsConfig {
  enabled: boolean;
  style: ViralCaptionStyle;
  text: string;
  position: 'bottom' | 'center' | 'top';
}

export interface DraftKeyframeItem {
  frameNumber: number; // 1 to 5
  imageUrl: string;
  angleLabel: string;
  timestamp: string;
}

export interface CameraMotionOption {
  id: string;
  label: string;
  promptTag: string;
  tamilHint: string;
  badge: string;
}

export const CAMERA_MOTION_OPTIONS: CameraMotionOption[] = [
  {
    id: 'static',
    label: '🎯 Static Lock',
    promptTag: 'locked-off tripod static camera shot, zero camera shake',
    tamilHint: 'Camera aadaama ore idathula steady-aa focus pannum',
    badge: 'Tripod',
  },
  {
    id: 'pan-left',
    label: '⬅️ Pan Left',
    promptTag: 'smooth cinematic horizontal camera pan to the left',
    tamilHint: 'Camera valathu pakkathilirunthu idathu pakkam smooth-aa thirumbum',
    badge: 'Horizontal',
  },
  {
    id: 'pan-right',
    label: '➡️ Pan Right',
    promptTag: 'smooth cinematic horizontal camera pan to the right',
    tamilHint: 'Camera idathu pakkathilirunthu valathu pakkam smooth-aa நகரும்',
    badge: 'Horizontal',
  },
  {
    id: 'zoom-in',
    label: '🔍+ Slow Push-In',
    promptTag: 'slow dramatic dolly push-in zoom toward the main subject face',
    tamilHint: 'Subject kitta medhuva zoom panni intense emotion kaattum',
    badge: 'Hero Focus',
  },
  {
    id: 'zoom-out',
    label: '🔍- Epic Pull-Back',
    promptTag: 'epic wide pull-back zoom out revealing the massive environment',
    tamilHint: 'Subject-lirunthu pinnadi vanthu periya world/background-a kaattum',
    badge: 'Wide Reveal',
  },
  {
    id: 'dolly-zoom',
    label: '🌀 Dolly Zoom (Vertigo)',
    promptTag: 'Hollywood Hitchcock dolly zoom vertigo effect, background warps while subject stays locked in frame',
    tamilHint: 'Character size maaraama, pinnadi irukka background mattum viriyura Hollywood effect!',
    badge: 'Mind-Blowing',
  },
  {
    id: 'orbit',
    label: '🔄 360° Hero Orbit',
    promptTag: 'smooth 360-degree circular gimbal orbit rotating around the central hero subject',
    tamilHint: 'Hero/Subject-a suthi 360 degree-la camera சுற்றி varum (Mass Intro shot)',
    badge: 'Mass Intro',
  },
  {
    id: 'drone',
    label: '🚁 FPV Drone Flyover',
    promptTag: 'high-speed cinematic FPV drone aerial flythrough banking over the scene',
    tamilHint: 'Melirunthu paranthu pora FPV Drone shot (Establishing views-ku best)',
    badge: 'Aerial 8K',
  },
  {
    id: 'handheld',
    label: '📹 Handheld Action',
    promptTag: 'organic handheld cinema camera movement with gritty realistic action energy',
    tamilHint: 'Real fight & chase scenes-ku etha natural cinema camera shake',
    badge: 'Realistic',
  },
];

export const CHARACTER_PRESETS = [
  {
    id: 'arjun-hero',
    name: '@Arjun',
    role: 'Mass Action Hero',
    traits: 'Sharp jawline, thick beard, intense dark eyes, rugged black leather jacket, consistent Indian cinema action hero face',
    avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=300&auto=format&fit=crop',
  },
  {
    id: 'ananya-lead',
    name: '@Ananya',
    role: 'Classical Heroine',
    traits: 'Expressive almond eyes, warm radiant skin, traditional silk aesthetic with jasmine flowers, consistent South Indian heroine face',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300&auto=format&fit=crop',
  },
  {
    id: 'vikram-cyber',
    name: '@Vikram',
    role: 'Sci-Fi Detective',
    traits: 'Futuristic neon visor, silver-streaked hair, tactical trench coat, consistent cyberpunk protagonist face',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=300&auto=format&fit=crop',
  },
  {
    id: 'kavi-kid',
    name: '@Kavi',
    role: '3D Animation Kid',
    traits: 'Cute Pixar-style curious 8-year-old Indian boy with glowing wristwatch, bright eyes, red hoodie, consistent 3D character',
    avatarUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?q=80&w=300&auto=format&fit=crop',
  },
];

export const VIRAL_CAPTION_STYLES: {
  id: ViralCaptionStyle;
  label: string;
  desc: string;
  previewClass: string;
}[] = [
  {
    id: 'hormozi',
    label: '🔥 Hormozi Viral Pop',
    desc: 'Bold yellow/white punchy reels text with black stroke',
    previewClass: 'text-amber-300 font-black uppercase tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)]',
  },
  {
    id: 'tanglish-neon',
    label: '💜 Tamil-English Lyrics Glow',
    desc: 'Neon pink/cyan glowing aesthetic lyrics overlay',
    previewClass: 'text-fuchsia-300 font-extrabold italic drop-shadow-[0_0_10px_rgba(217,70,239,0.9)]',
  },
  {
    id: 'cinema-lower',
    label: '🎬 Cinema Subtitle Bar',
    desc: 'Classic yellow movie theatre translation subtitle',
    previewClass: 'text-yellow-200 font-semibold bg-black/75 px-2.5 py-0.5 rounded',
  },
  {
    id: 'kinetic-pop',
    label: '⚡ Kinetic Word Highlight',
    desc: 'High-retention highlighted active word box',
    previewClass: 'text-white font-black bg-purple-600 px-2 py-0.5 rounded-md shadow-md',
  },
];

interface TextToVideoPowerSuiteProps {
  prompt: string;
  onPromptChange: (newPrompt: string) => void;
  aspectRatio: '9:16' | '16:9' | '1:1';
  selectedModelName: string;
  baseVideoCreditCost: number;
  userCredits: number;
  // 1. Draft Keyframe Preview (8 Cr / ₹5 per frame, up to 5 frames)
  draftFrames: DraftKeyframeItem[];
  selectedDraftFrameIndex: number;
  isGeneratingKeyframe: boolean;
  onGenerateDraftKeyframe: () => void;
  onSelectDraftFrame: (index: number) => void;
  onUseFrameAndGenerateVideo: (frame: DraftKeyframeItem) => void;
  onResetDraftFrames: () => void;
  // 2. Storyboard Mode (3x Scenes)
  isStoryboardMode: boolean;
  onToggleStoryboardMode: (enabled: boolean) => void;
  storyIdea: string;
  onStoryIdeaChange: (idea: string) => void;
  storyboardScenes: StoryboardSceneItem[];
  onUpdateStoryboardScene: (sceneNumber: 1 | 2 | 3, newPrompt: string) => void;
  isSplittingStory: boolean;
  onSplitStoryToScenes: () => void;
  isGeneratingStoryboard: boolean;
  onGenerateAllStoryboardScenes: () => void;
  onGenerateSingleStoryboardScene: (sceneNumber: 1 | 2 | 3) => void;
  onPlayStoryboardSceneInPlayer: (scene: StoryboardSceneItem) => void;
  // 3. Consistent Character Lock (+10 Cr)
  characterLock: CharacterLockConfig;
  onCharacterLockChange: (cfg: CharacterLockConfig) => void;
  // 4. Camera Motion Preview (0 Cr / Free)
  selectedCameraMotion: string;
  onSelectCameraMotion: (motion: CameraMotionOption) => void;
  // 5. Smart Soundscape Auto BGM & SFX (+5 Cr)
  soundscapeConfig: SmartSoundscapeConfig;
  onSoundscapeConfigChange: (cfg: SmartSoundscapeConfig) => void;
  // 6. Auto Viral Captions (+5 Cr)
  viralCaptions: ViralCaptionsConfig;
  onViralCaptionsChange: (cfg: ViralCaptionsConfig) => void;
}

export const TextToVideoPowerSuite: React.FC<TextToVideoPowerSuiteProps> = ({
  prompt,
  onPromptChange,
  aspectRatio,
  selectedModelName,
  baseVideoCreditCost,
  userCredits,
  draftFrames,
  selectedDraftFrameIndex,
  isGeneratingKeyframe,
  onGenerateDraftKeyframe,
  onSelectDraftFrame,
  onUseFrameAndGenerateVideo,
  onResetDraftFrames,
  isStoryboardMode,
  onToggleStoryboardMode,
  storyIdea,
  onStoryIdeaChange,
  storyboardScenes,
  onUpdateStoryboardScene,
  isSplittingStory,
  onSplitStoryToScenes,
  isGeneratingStoryboard,
  onGenerateAllStoryboardScenes,
  onGenerateSingleStoryboardScene,
  onPlayStoryboardSceneInPlayer,
  characterLock,
  onCharacterLockChange,
  selectedCameraMotion,
  onSelectCameraMotion,
  soundscapeConfig,
  onSoundscapeConfigChange,
  viralCaptions,
  onViralCaptionsChange,
}) => {
  const [hoveredCamera, setHoveredCamera] = useState<CameraMotionOption | null>(null);
  const [isPlayingSoundscapePreview, setIsPlayingSoundscapePreview] = useState(false);
  const charFileInputRef = useRef<HTMLInputElement>(null);

  const activeCameraForPreview =
    hoveredCamera ||
    CAMERA_MOTION_OPTIONS.find((c) => c.id === selectedCameraMotion) ||
    CAMERA_MOTION_OPTIONS[0];

  const currentFrameCount = draftFrames.length;
  const maxFramesReached = currentFrameCount >= 5;
  const activeDraftFrame = draftFrames[selectedDraftFrameIndex] || draftFrames[draftFrames.length - 1] || null;

  const handleCharImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onCharacterLockChange({
          ...characterLock,
          enabled: true,
          referenceImageUrl: reader.result,
          presetId: null,
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const toggleSoundscapePreview = () => {
    if (isPlayingSoundscapePreview) {
      smartSoundscapeEngine.stop();
      setIsPlayingSoundscapePreview(false);
    } else {
      smartSoundscapeEngine.start({ ...soundscapeConfig, enabled: true });
      setIsPlayingSoundscapePreview(true);
    }
  };

  return (
    <div className="space-y-4 pt-2">
      {/* =====================================================================
          FEATURE 5: ⚡ "DRAFT PREVIEW FIRST" (1-SECOND KEYFRAME PREVIEW - 8 CR / ₹5)
          Up to 5 Frames max with "Use Frame #X & Generate Video" & "Do you need another frame?"
      ===================================================================== */}
      <div className="rounded-2xl bg-gradient-to-r from-amber-950/40 via-[#141222] to-purple-950/40 border border-amber-500/40 p-3.5 sm:p-4 space-y-3 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
              <Zap className="w-4 h-4 fill-amber-300" />
            </div>
            <div>
              <div className="text-xs sm:text-sm font-extrabold text-white flex items-center gap-2">
                <span>⚡ Draft Keyframe Preview First</span>
                <span className="text-[10px] mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40 font-black">
                  8 Cr / ₹5 per Frame
                </span>
              </div>
              <p className="text-[11px] text-white/60">
                Test your prompt & camera angle in 1 second before spending {baseVideoCreditCost}cr on full video!
              </p>
            </div>
          </div>

          {/* Primary Button when 0 frames generated yet */}
          {currentFrameCount === 0 ? (
            <button
              type="button"
              onClick={onGenerateDraftKeyframe}
              disabled={isGeneratingKeyframe || !prompt.trim()}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-black text-xs mono shadow-lg shadow-amber-500/25 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isGeneratingKeyframe ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-950" />
                  <span>Generating Frame 1/5...</span>
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5 fill-slate-950" />
                  <span>⚡ Preview Keyframe (8 Cr / ₹5)</span>
                </>
              )}
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-[11px] mono font-bold px-2.5 py-1 rounded-xl bg-purple-950/80 border border-purple-400/40 text-purple-200">
                Frames Used: {currentFrameCount}/5
              </span>
              <button
                type="button"
                onClick={onResetDraftFrames}
                className="text-[10px] mono text-white/40 hover:text-rose-300 px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                title="Clear draft frames"
              >
                Reset
              </button>
            </div>
          )}
        </div>

        {/* Display Generated Keyframe(s) & Exact Action Buttons */}
        {currentFrameCount > 0 && activeDraftFrame && (
          <div className="bg-[#0c0b14] border border-amber-500/30 rounded-2xl p-3 space-y-3 animate-in fade-in duration-200">
            {/* Frame Thumbnails Strip (1/5 to 5/5) */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {draftFrames.map((df, idx) => {
                  const isSelected = idx === selectedDraftFrameIndex;
                  return (
                    <button
                      key={df.frameNumber}
                      type="button"
                      onClick={() => onSelectDraftFrame(idx)}
                      className={`relative px-2.5 py-1.5 rounded-xl text-[11px] mono font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
                        isSelected
                          ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 border-amber-300 shadow-md'
                          : 'bg-[#161522] text-white/70 border-white/10 hover:text-white'
                      }`}
                    >
                      <span>Frame #{df.frameNumber}</span>
                      <span className="text-[9px] opacity-80">({df.frameNumber}/5)</span>
                    </button>
                  );
                })}
              </div>
              <span className="text-[10px] mono text-emerald-400 font-semibold">
                ✓ {activeDraftFrame.angleLabel}
              </span>
            </div>

            {/* Active Keyframe Image Preview */}
            <div className="relative rounded-xl overflow-hidden border border-white/15 bg-black/80 max-h-64 flex items-center justify-center">
              <img
                src={activeDraftFrame.imageUrl}
                alt={`Draft Keyframe #${activeDraftFrame.frameNumber}`}
                className="w-full max-h-60 object-contain"
              />
              <div className="absolute top-2 left-2 px-2.5 py-1 rounded-lg bg-black/80 backdrop-blur-md border border-amber-400/50 text-[10px] mono font-bold text-amber-300">
                ⚡ Draft Frame #{activeDraftFrame.frameNumber}/5 • {activeDraftFrame.angleLabel}
              </div>
              <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-emerald-950/90 border border-emerald-400/40 text-[10px] mono text-emerald-300">
                8 Cr (₹5) Paid
              </div>
            </div>

            {/* TWO CLEAR OPTIONS BELOW THE FRAME AS SPECIFIED */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              {/* Option 1: ✅ Use Frame #X & Generate Video */}
              <button
                type="button"
                onClick={() => onUseFrameAndGenerateVideo(activeDraftFrame)}
                className="w-full py-2.5 px-3.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs mono shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>
                  ✅ Use Frame #{activeDraftFrame.frameNumber} & Generate Video
                </span>
              </button>

              {/* Option 2: 🔄 Do you need another frame? (+8 Cr / ₹5) [X/5 Used] */}
              {!maxFramesReached ? (
                <button
                  type="button"
                  onClick={onGenerateDraftKeyframe}
                  disabled={isGeneratingKeyframe}
                  className="w-full py-2.5 px-3.5 rounded-xl bg-purple-900/70 hover:bg-purple-800/80 text-amber-200 border border-amber-400/50 font-bold text-xs mono shadow-md flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-amber-300 ${isGeneratingKeyframe ? 'animate-spin' : ''}`} />
                  <span>
                    {isGeneratingKeyframe
                      ? `Generating Frame ${currentFrameCount + 1}/5...`
                      : `🔄 Do you need another frame? (+8 Cr / ₹5) [${currentFrameCount}/5 Used]`}
                  </span>
                </button>
              ) : (
                <div className="w-full py-2.5 px-3 rounded-xl bg-amber-500/15 border border-amber-400/40 text-amber-200 font-bold text-[11px] mono flex items-center justify-center text-center">
                  <span>
                    Max 5/5 Frames Reached — Pick your favorite frame above to animate!
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* =====================================================================
          FEATURE 1: 🎞️ MULTI-SCENE STORYBOARD MODE (SCRIPT-TO-FULL VIDEO)
      ===================================================================== */}
      <div className="rounded-2xl bg-[#11101d] border border-purple-500/30 p-3.5 sm:p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-purple-500/20 border border-purple-400/40 flex items-center justify-center text-purple-300">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs sm:text-sm font-extrabold text-white flex items-center gap-2">
                <span>🎞️ Multi-Scene Storyboard Mode (Script-to-Full Video)</span>
                <span className="text-[10px] mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/30 font-bold">
                  3 Connected Scenes • 3x Credits
                </span>
              </div>
              <p className="text-[11px] text-white/55">
                Give a 1-line story idea — AI splits it into Scene 1 (Intro), Scene 2 (Action) & Scene 3 (Climax)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onToggleStoryboardMode(!isStoryboardMode)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold mono transition-all cursor-pointer border ${
              isStoryboardMode
                ? 'bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white border-fuchsia-400 shadow-md'
                : 'bg-[#181826] text-white/60 border-white/10 hover:text-white'
            }`}
          >
            {isStoryboardMode ? '✓ Storyboard Mode ON' : 'Enable Storyboard (3 Scenes)'}
          </button>
        </div>

        {isStoryboardMode && (
          <div className="space-y-3 pt-1 animate-in fade-in duration-200">
            {/* 1-Line Story Idea Input */}
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={storyIdea}
                onChange={(e) => onStoryIdeaChange(e.target.value)}
                placeholder="Ex: A boy finds a magical glowing watch on Chennai Marina beach at sunset..."
                className="flex-1 bg-[#0b0a12] border border-purple-500/40 focus:border-fuchsia-400 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-white/35 outline-none"
              />
              <button
                type="button"
                onClick={onSplitStoryToScenes}
                disabled={isSplittingStory}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-xs mono flex items-center justify-center gap-1.5 shadow-md cursor-pointer shrink-0 disabled:opacity-50"
              >
                {isSplittingStory ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Splitting 3 Scenes...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-3.5 h-3.5 text-amber-300" />
                    <span>✨ Split into 3 Scenes</span>
                  </>
                )}
              </button>
            </div>

            {/* 3 Connected Scene Cards */}
            <div className="grid grid-cols-1 gap-2.5">
              {storyboardScenes.map((scene) => (
                <div
                  key={scene.sceneNumber}
                  className="bg-[#0b0a12] border border-white/10 hover:border-purple-500/40 rounded-xl p-3 space-y-2 transition-all"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-purple-600/30 border border-purple-400/40 text-purple-200 text-[10px] font-black mono">
                        SCENE {scene.sceneNumber}/3 • {scene.title.toUpperCase()}
                      </span>
                      <span className="text-[10px] mono text-cyan-300 bg-cyan-950/50 px-2 py-0.5 rounded border border-cyan-500/30">
                        🎥 {scene.cameraMove}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {scene.status === 'completed' && scene.videoUrl && (
                        <button
                          type="button"
                          onClick={() => onPlayStoryboardSceneInPlayer(scene)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-400/40 text-[10px] mono font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Play className="w-3 h-3 fill-emerald-300" />
                          <span>Play Scene {scene.sceneNumber}</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onGenerateSingleStoryboardScene(scene.sceneNumber)}
                        disabled={scene.status === 'generating' || isGeneratingStoryboard}
                        className="px-2.5 py-1 rounded-lg bg-purple-600/25 hover:bg-purple-600/40 text-purple-200 border border-purple-400/30 text-[10px] mono font-bold cursor-pointer disabled:opacity-50"
                      >
                        {scene.status === 'generating'
                          ? 'Rendering...'
                          : `Render Scene #${scene.sceneNumber} (${baseVideoCreditCost}cr)`}
                      </button>
                    </div>
                  </div>

                  <textarea
                    rows={2}
                    value={scene.prompt}
                    onChange={(e) => onUpdateStoryboardScene(scene.sceneNumber, e.target.value)}
                    className="w-full bg-[#131220] border border-white/10 focus:border-purple-400 rounded-lg p-2 text-xs text-white/90 outline-none resize-none"
                  />
                </div>
              ))}
            </div>

            {/* Generate All 3 Connected Scenes Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
              <div className="text-[11px] mono text-white/60">
                Total 3-Scene Story Cost:{' '}
                <strong className="text-amber-300 font-bold">
                  {baseVideoCreditCost * 3} Credits (3 × {baseVideoCreditCost}cr)
                </strong>
              </div>
              <button
                type="button"
                onClick={onGenerateAllStoryboardScenes}
                disabled={isGeneratingStoryboard}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-fuchsia-600 to-purple-600 hover:from-amber-400 hover:to-purple-500 text-white font-black text-xs mono shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isGeneratingStoryboard ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Rendering 3-Scene Storyboard...</span>
                  </>
                ) : (
                  <>
                    <Film className="w-4 h-4" />
                    <span>🎞️ Generate All 3 Scenes ({baseVideoCreditCost * 3} Cr)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* =====================================================================
          FEATURE 2: 🧑 CONSISTENT CHARACTER LOCK (@CHARACTER REFERENCE • +10 CR)
      ===================================================================== */}
      <div className="rounded-2xl bg-[#11101d] border border-cyan-500/30 p-3.5 sm:p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs sm:text-sm font-extrabold text-white flex items-center gap-2">
                <span>🧑 Consistent Character Lock (@Character Reference)</span>
                <span className="text-[10px] mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 font-bold">
                  +10 Cr Extra (₹6.60)
                </span>
              </div>
              <p className="text-[11px] text-white/55">
                Keep the exact same hero/heroine face & outfit across multiple prompts
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              onCharacterLockChange({
                ...characterLock,
                enabled: !characterLock.enabled,
              })
            }
            className={`px-3 py-1.5 rounded-xl text-xs font-bold mono transition-all cursor-pointer border ${
              characterLock.enabled
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-black border-cyan-300 shadow-md'
                : 'bg-[#181826] text-white/60 border-white/10 hover:text-white'
            }`}
          >
            {characterLock.enabled ? '✓ Character Lock ON (+10 Cr)' : 'Lock Character (+10 Cr)'}
          </button>
        </div>

        {characterLock.enabled && (
          <div className="space-y-3 pt-1 animate-in fade-in duration-200">
            {/* Quick Character Presets + Custom Photo Upload */}
            <div className="flex flex-wrap items-center gap-2">
              {CHARACTER_PRESETS.map((preset) => {
                const isSelected = characterLock.presetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() =>
                      onCharacterLockChange({
                        enabled: true,
                        presetId: preset.id,
                        characterTag: preset.name,
                        referenceImageUrl: preset.avatarUrl,
                        traitDescription: preset.traits,
                      })
                    }
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-950/70 border-cyan-400 text-white shadow-sm ring-1 ring-cyan-400/40'
                        : 'bg-[#0b0a12] border-white/10 text-white/70 hover:text-white'
                    }`}
                  >
                    <img
                      src={preset.avatarUrl}
                      alt={preset.name}
                      className="w-6 h-6 rounded-full object-cover border border-cyan-400/50"
                    />
                    <div>
                      <div className="text-[11px] font-bold mono text-cyan-300">{preset.name}</div>
                      <div className="text-[9px] text-white/50">{preset.role}</div>
                    </div>
                  </button>
                );
              })}

              {/* Upload Custom Face Photo */}
              <input
                ref={charFileInputRef}
                type="file"
                accept="image/*"
                onChange={handleCharImageUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => charFileInputRef.current?.click()}
                className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-dashed border-cyan-400/50 text-cyan-300 text-xs mono font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Face Photo</span>
              </button>
            </div>

            {/* Active Character Details */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center bg-[#0b0a12] p-2.5 rounded-xl border border-white/10">
              {characterLock.referenceImageUrl && (
                <div className="sm:col-span-2 flex justify-center">
                  <img
                    src={characterLock.referenceImageUrl}
                    alt="Locked Character"
                    className="w-12 h-12 rounded-xl object-cover border-2 border-cyan-400 shadow-md"
                  />
                </div>
              )}
              <div className={`${characterLock.referenceImageUrl ? 'sm:col-span-10' : 'sm:col-span-12'} space-y-1.5`}>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={characterLock.characterTag}
                    onChange={(e) =>
                      onCharacterLockChange({ ...characterLock, characterTag: e.target.value })
                    }
                    placeholder="@Hero"
                    className="w-28 bg-[#151424] border border-cyan-500/40 rounded-lg px-2.5 py-1 text-xs mono font-bold text-cyan-300 outline-none"
                  />
                  <span className="text-[10px] mono text-white/50">
                    Identity & Facial Structure Locked across scenes
                  </span>
                </div>
                <input
                  type="text"
                  value={characterLock.traitDescription}
                  onChange={(e) =>
                    onCharacterLockChange({ ...characterLock, traitDescription: e.target.value })
                  }
                  placeholder="Describe locked face/outfit traits (e.g. Young Tamil hero with black jacket, sharp beard...)"
                  className="w-full bg-[#151424] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white/90 outline-none"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* =====================================================================
          FEATURE 4: 🎥 VISUAL CAMERA PATH PREVIEW (INTERACTIVE HOVER GIF / LIVE PREVIEW)
          100% FREE UI Helper (0 Credits)
      ===================================================================== */}
      <div className="rounded-2xl bg-[#11101d] border border-[#27273a] p-3.5 sm:p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Camera className="w-4 h-4 text-purple-400" />
            <span className="text-xs font-extrabold uppercase tracking-wider text-white mono">
              🎥 Visual Camera Path Director
            </span>
            <span className="text-[10px] mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold">
              FREE • Hover to Preview Motion
            </span>
          </div>
          <span className="text-[10px] mono text-purple-300">
            Active: {activeCameraForPreview.label}
          </span>
        </div>

        {/* Interactive Camera Buttons Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-3 gap-1.5">
          {CAMERA_MOTION_OPTIONS.map((cam) => {
            const isSelected = selectedCameraMotion === cam.id;
            return (
              <button
                key={cam.id}
                type="button"
                onMouseEnter={() => setHoveredCamera(cam)}
                onMouseLeave={() => setHoveredCamera(null)}
                onClick={() => onSelectCameraMotion(cam)}
                className={`px-2.5 py-2 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-1 ${
                  isSelected
                    ? 'bg-purple-600/35 border-purple-400 text-white shadow-sm ring-1 ring-purple-400/40'
                    : 'bg-[#0b0a12] border-white/10 text-white/70 hover:text-white hover:border-purple-500/40'
                }`}
              >
                <span className="text-[11px] font-bold mono truncate">{cam.label}</span>
                <span className="text-[9px] mono px-1.5 py-0.2 rounded bg-white/10 text-purple-200 shrink-0 hidden sm:inline">
                  {cam.badge}
                </span>
              </button>
            );
          })}
        </div>

        {/* Live Animated Visual Camera Path Preview Box */}
        <div className="bg-[#090910] border border-purple-500/30 rounded-xl p-3 flex flex-col sm:flex-row items-center gap-3">
          {/* Mini Animated Viewport */}
          <div className="relative w-full sm:w-44 h-20 rounded-lg bg-gradient-to-br from-purple-950/60 via-[#0f0f1a] to-indigo-950/60 border border-purple-400/40 overflow-hidden flex items-center justify-center shrink-0">
            {/* Perspective Grid */}
            <div
              className="absolute inset-0 opacity-30"
              style={{
                backgroundImage:
                  'linear-gradient(to right, rgba(168,85,247,0.3) 1px, transparent 1px), linear-gradient(to bottom, rgba(168,85,247,0.3) 1px, transparent 1px)',
                backgroundSize: '16px 16px',
                transform:
                  activeCameraForPreview.id === 'pan-left'
                    ? 'translateX(10px)'
                    : activeCameraForPreview.id === 'pan-right'
                    ? 'translateX(-10px)'
                    : activeCameraForPreview.id === 'zoom-in'
                    ? 'scale(1.25)'
                    : activeCameraForPreview.id === 'zoom-out'
                    ? 'scale(0.85)'
                    : activeCameraForPreview.id === 'dolly-zoom'
                    ? 'scale(1.35)'
                    : activeCameraForPreview.id === 'orbit'
                    ? 'rotate(8deg) scale(1.1)'
                    : activeCameraForPreview.id === 'drone'
                    ? 'rotate(-6deg) translateY(-6px) scale(1.15)'
                    : 'none',
                transition: 'transform 0.6s ease-in-out',
              }}
            />
            {/* Animated Subject + Camera Frame */}
            <div className="relative z-10 flex flex-col items-center">
              <div
                className={`px-2.5 py-1 rounded border border-amber-400/80 bg-amber-500/20 text-amber-200 text-[10px] mono font-black shadow-md transition-all duration-500 ${
                  activeCameraForPreview.id === 'zoom-in'
                    ? 'scale-125'
                    : activeCameraForPreview.id === 'zoom-out'
                    ? 'scale-75'
                    : activeCameraForPreview.id === 'handheld'
                    ? 'rotate-2'
                    : 'scale-100'
                }`}
              >
                {activeCameraForPreview.label}
              </div>
              <span className="text-[9px] mono text-cyan-300 mt-1 animate-pulse">
                ● LIVE PATH PREVIEW
              </span>
            </div>
          </div>

          <div className="space-y-1 text-left flex-1">
            <div className="text-xs font-bold text-purple-200 flex items-center gap-1.5">
              <span>{activeCameraForPreview.label}</span>
              <span className="text-[10px] mono text-emerald-400">(0 Cr • Free)</span>
            </div>
            <p className="text-[11px] text-amber-200/90 font-medium">
              💡 {activeCameraForPreview.tamilHint}
            </p>
            <p className="text-[10px] mono text-white/45 truncate">
              Prompt injection: "{activeCameraForPreview.promptTag}"
            </p>
          </div>
        </div>
      </div>

      {/* =====================================================================
          FEATURE 3 & 6 SIDE-BY-SIDE OR STACKED:
          🎵 SMART SOUNDSCAPE (AUTO BGM & SFX SYNC • +5 CR)
          📱 AUTO VIRAL CAPTIONS / SUBTITLES OVERLAY (+5 CR)
      ===================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* FEATURE 3: 🎵 AUTO BGM & SFX SYNC (+5 Cr) */}
        <div className="rounded-2xl bg-[#11101d] border border-emerald-500/30 p-3.5 space-y-2.5 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <Music className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-extrabold text-white">
                  🎵 Auto BGM & SFX
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  const next = !soundscapeConfig.enabled;
                  if (!next && isPlayingSoundscapePreview) {
                    smartSoundscapeEngine.stop();
                    setIsPlayingSoundscapePreview(false);
                  }
                  onSoundscapeConfigChange({ ...soundscapeConfig, enabled: next });
                }}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold mono cursor-pointer border transition-all ${
                  soundscapeConfig.enabled
                    ? 'bg-emerald-500 text-slate-950 border-emerald-300 font-black'
                    : 'bg-white/5 text-white/60 border-white/10 hover:text-white'
                }`}
              >
                {soundscapeConfig.enabled ? '✓ ON (+5 Cr)' : '+5 Cr (₹3.30)'}
              </button>
            </div>

            <p className="text-[10px] text-white/55">
              Auto-syncs Mass BGM / Lo-Fi + Rain, Car Chase or Beach SFX with video playback.
            </p>

            {soundscapeConfig.enabled && (
              <div className="space-y-2 pt-1 animate-in fade-in duration-150">
                <select
                  value={soundscapeConfig.bgmMood}
                  onChange={(e) =>
                    onSoundscapeConfigChange({
                      ...soundscapeConfig,
                      bgmMood: e.target.value as BgmMoodType,
                    })
                  }
                  className="w-full bg-[#0b0a12] border border-emerald-500/40 rounded-xl px-2.5 py-1.5 text-xs text-white outline-none"
                >
                  {BGM_MOOD_OPTIONS.map((m) => (
                    <option key={m.id} value={m.id} className="bg-[#0b0a12]">
                      {m.label}
                    </option>
                  ))}
                </select>

                <select
                  value={soundscapeConfig.sfxType}
                  onChange={(e) =>
                    onSoundscapeConfigChange({
                      ...soundscapeConfig,
                      sfxType: e.target.value as SfxAmbientType,
                    })
                  }
                  className="w-full bg-[#0b0a12] border border-white/15 rounded-xl px-2.5 py-1.5 text-xs text-white outline-none"
                >
                  {SFX_AMBIENT_OPTIONS.map((s) => (
                    <option key={s.id} value={s.id} className="bg-[#0b0a12]">
                      {s.label}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={toggleSoundscapePreview}
                  className={`w-full py-1.5 px-3 rounded-xl text-[11px] font-bold mono flex items-center justify-center gap-1.5 cursor-pointer border ${
                    isPlayingSoundscapePreview
                      ? 'bg-rose-600/80 text-white border-rose-400'
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                  }`}
                >
                  {isPlayingSoundscapePreview ? (
                    <>
                      <Square className="w-3 h-3 fill-white" />
                      <span>Stop Audio Preview</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>🎧 Test BGM + SFX Live</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* FEATURE 6: 📱 AUTO VIRAL CAPTIONS / SUBTITLES OVERLAY (+5 Cr) */}
        <div className="rounded-2xl bg-[#11101d] border border-pink-500/30 p-3.5 space-y-2.5 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <Subtitles className="w-4 h-4 text-pink-400" />
                <span className="text-xs font-extrabold text-white">
                  📱 Viral Captions Overlay
                </span>
              </div>
              <button
                type="button"
                onClick={() =>
                  onViralCaptionsChange({
                    ...viralCaptions,
                    enabled: !viralCaptions.enabled,
                  })
                }
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold mono cursor-pointer border transition-all ${
                  viralCaptions.enabled
                    ? 'bg-pink-500 text-slate-950 border-pink-300 font-black'
                    : 'bg-white/5 text-white/60 border-white/10 hover:text-white'
                }`}
              >
                {viralCaptions.enabled ? '✓ ON (+5 Cr)' : '+5 Cr (₹3.30)'}
              </button>
            </div>

            <p className="text-[10px] text-white/55">
              Renders animated Hormozi / Tamil-English viral subtitles directly on your video.
            </p>

            {viralCaptions.enabled && (
              <div className="space-y-2 pt-1 animate-in fade-in duration-150">
                <select
                  value={viralCaptions.style}
                  onChange={(e) =>
                    onViralCaptionsChange({
                      ...viralCaptions,
                      style: e.target.value as ViralCaptionStyle,
                    })
                  }
                  className="w-full bg-[#0b0a12] border border-pink-500/40 rounded-xl px-2.5 py-1.5 text-xs text-white outline-none"
                >
                  {VIRAL_CAPTION_STYLES.map((st) => (
                    <option key={st.id} value={st.id} className="bg-[#0b0a12]">
                      {st.label}
                    </option>
                  ))}
                </select>

                <input
                  type="text"
                  value={viralCaptions.text}
                  onChange={(e) =>
                    onViralCaptionsChange({
                      ...viralCaptions,
                      text: e.target.value,
                    })
                  }
                  placeholder="Custom caption or leave blank to auto-sync prompt/voiceover..."
                  className="w-full bg-[#0b0a12] border border-white/15 rounded-xl px-2.5 py-1.5 text-xs text-white placeholder-white/35 outline-none"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
