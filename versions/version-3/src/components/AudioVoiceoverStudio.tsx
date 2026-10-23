import React, { useState } from 'react';
import {
  Volume2,
  VolumeX,
  Mic,
  Music,
  Sparkles,
  RefreshCw,
  Play,
  Square,
  Sliders,
  Flame,
  Check,
  Zap,
  Globe,
  Radio,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export interface VoiceOption {
  id: string;
  label: string;
  engine: 'Sarvam AI (Bulbul V3)' | 'ElevenLabs Realism';
  lang: 'Tamil' | 'Hindi' | 'Tanglish' | 'Telugu' | 'English';
  gender: 'Male' | 'Female';
  description: string;
  samplePhrase: string;
  phoneticSample: string;
  speechPitch: number;
  speechRate: number;
  speechLang: string;
}

export const VOICE_PRESETS: VoiceOption[] = [
  {
    id: 'ta-male-trailer',
    label: '🎙 Tamil Male — Cinematic Trailer (Deep & Bold)',
    engine: 'Sarvam AI (Bulbul V3)',
    lang: 'Tamil',
    gender: 'Male',
    description: 'Deep cinematic movie trailer narration with dramatic cadence',
    samplePhrase: 'வணக்கம்! இது நெக்ஸ்வெர்ஸ் ஸ்டுடியோவின் கம்பீரமான தமிழ் சினிமாட்டிக் குரல்.',
    phoneticSample: 'Vanakkam! Idhu NexVerze Studio-vin gambheeramaana Tamil cinematic kural.',
    speechPitch: 0.85,
    speechRate: 0.95,
    speechLang: 'ta-IN',
  },
  {
    id: 'ta-female-story',
    label: '🎙 Tamil Female — Storyteller (Warm & Natural)',
    engine: 'Sarvam AI (Bulbul V3)',
    lang: 'Tamil',
    gender: 'Female',
    description: 'Warm, empathetic storytelling voice for emotional reels',
    samplePhrase: 'வணக்கம்! இது உங்கள் கதைகளுக்கான மென்மையான தமிழ் வர்ணனைக் குரல்.',
    phoneticSample: 'Vanakkam! Idhu ungal kadhaigalukkaana menmaiyaana Tamil varnanai kural.',
    speechPitch: 1.2,
    speechRate: 0.95,
    speechLang: 'ta-IN',
  },
  {
    id: 'tanglish-male-vlog',
    label: '🎙 Tanglish Male — Casual YouTuber Vlog Style',
    engine: 'Sarvam AI (Bulbul V3)',
    lang: 'Tanglish',
    gender: 'Male',
    description: 'Energetic modern Chennai vlog speech with natural expressions',
    samplePhrase: 'Hey guys! Welcome to NexVerze Studio. Ippo namba semma viral reel create panna porom!',
    phoneticSample: 'Hey guys! Welcome to NexVerze Studio. Ippo namba semma viral reel create panna porom!',
    speechPitch: 1.05,
    speechRate: 1.05,
    speechLang: 'en-IN',
  },
  {
    id: 'hi-male-hero',
    label: '🎙 Hindi Male — Bollywood Hero Narration',
    engine: 'Sarvam AI (Bulbul V3)',
    lang: 'Hindi',
    gender: 'Male',
    description: 'Powerful Indian heroic voice with rich resonance',
    samplePhrase: 'नमस्ते! नेक्सवर्स स्टूडियो में आपका स्वागत है। देखिए यह शानदार दृश्य!',
    phoneticSample: 'Namaste! NexVerze Studio mein aapka swaagat hai. Dekhiye yeh shaandaar drishya!',
    speechPitch: 0.9,
    speechRate: 0.95,
    speechLang: 'hi-IN',
  },
  {
    id: 'hi-female-soft',
    label: '🎙 Hindi Female — Emotional Storytelling',
    engine: 'Sarvam AI (Bulbul V3)',
    lang: 'Hindi',
    gender: 'Female',
    description: 'Gentle, expressive narration for shorts & promos',
    samplePhrase: 'नमस्ते! यह दिल को छू लेने वाली मधुर और भावनात्मक आवाज़ है।',
    phoneticSample: 'Namaste! Yeh dil ko chhoo lene waali madhur aur bhaavanaatmak aawaaz hai.',
    speechPitch: 1.25,
    speechRate: 0.95,
    speechLang: 'hi-IN',
  },
  {
    id: 'en-male-hollywood',
    label: '🎙 English Male — Hollywood Movie Voice',
    engine: 'ElevenLabs Realism',
    lang: 'English',
    gender: 'Male',
    description: 'Ultra-lifelike movie trailer voice with breathing realism',
    samplePhrase: 'In a world of boundless imagination, NexVerze AI Studio brings your cinematic vision to life.',
    phoneticSample: 'In a world of boundless imagination, NexVerze AI Studio brings your cinematic vision to life.',
    speechPitch: 0.8,
    speechRate: 0.9,
    speechLang: 'en-US',
  },
];

export const BGM_PRESETS = [
  { id: 'epic', label: '⚔️ Epic Cinematic Trailer', mood: 'Dramatic Strings & Brass' },
  { id: 'lofi', label: '☕ Lofi Relax Chill', mood: 'Subtle Piano & Beats' },
  { id: 'cyber', label: '🌃 Cyberpunk Synthwave', mood: '80s Neon Pulse' },
  { id: 'action', label: '🔥 High-Speed Action Drums', mood: 'Fast Percussion' },
  { id: 'devotional', label: '🪔 Spiritual Temple Flute', mood: 'Divine Traditional' },
];

export interface AudioVoiceoverConfig {
  enabled: boolean;
  mode: 'voiceover' | 'bgm' | 'hybrid';
  voiceId: string;
  script: string;
  bgmId: string;
  speed: number; // 0.8, 1.0, 1.2
  voiceVolume: number; // 0 to 100
  bgmVolume: number; // 0 to 100
}

interface AudioVoiceoverStudioProps {
  config: AudioVoiceoverConfig;
  onChange: (newConfig: AudioVoiceoverConfig) => void;
  videoPrompt: string;
}

export const AudioVoiceoverStudio: React.FC<AudioVoiceoverStudioProps> = ({
  config,
  onChange,
  videoPrompt,
}) => {
  const { t, language } = useLanguage();
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [isPlayingVoiceSample, setIsPlayingVoiceSample] = useState(false);
  const [sampleNotice, setSampleNotice] = useState<string | null>(null);
  const [humanizerSuccess, setHumanizerSuccess] = useState(false);

  // Stop any active speech synthesis
  const stopAllSpeech = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlayingPreview(false);
    setIsPlayingVoiceSample(false);
    setSampleNotice(null);
  };

  // Toggle master audio
  const toggleEnabled = () => {
    if (config.enabled) {
      stopAllSpeech();
    }
    onChange({ ...config, enabled: !config.enabled });
  };

  // Auto-generate script based on video prompt
  const handleAutoGenerateScript = () => {
    setIsGeneratingScript(true);
    setTimeout(() => {
      let sampleScript = '';
      if (config.voiceId.includes('ta')) {
        sampleScript = `பார்த்து பரவசமடையும் பிரம்மாண்டமான காட்சி! ${videoPrompt.slice(0, 60)}... இதோ உங்கள் கண்முன்னே!`;
      } else if (config.voiceId.includes('tanglish')) {
        sampleScript = `Machi, idhu verithanamana AI generation! ${videoPrompt.slice(0, 50)}... Check this out guys!`;
      } else if (config.voiceId.includes('hi')) {
        sampleScript = `देखिए यह अद्भुत और शानदार दृश्य! ${videoPrompt.slice(0, 60)}... बिल्कुल असली जैसा!`;
      } else {
        sampleScript = `Experience this breathtaking cinematic masterwork! ${videoPrompt.slice(0, 60)}... Reimagined in 4K.`;
      }
      onChange({ ...config, script: sampleScript });
      setIsGeneratingScript(false);
    }, 700);
  };

  // Smart Humanizer: Inserts breathing pauses (...), commas, and natural rhythm
  const handleHumanizeScript = () => {
    if (!config.script) return;
    let humanized = config.script
      .replace(/([.!?])/g, '$1 ... ')
      .replace(/,/g, ', ... ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!humanized.includes('...')) {
      humanized = humanized + ' ... ';
    }

    onChange({ ...config, script: humanized });
    setHumanizerSuccess(true);
    setTimeout(() => setHumanizerSuccess(false), 2000);
  };

  const selectedVoice = VOICE_PRESETS.find((v) => v.id === config.voiceId) || VOICE_PRESETS[0];

  // PREVIEW VOICE ACCENT: Uses Web Speech API to sample the selected accent & tone in real-time
  const handlePreviewVoiceSample = (voiceToPlay?: VoiceOption) => {
    const targetVoice = voiceToPlay || selectedVoice;

    if (isPlayingVoiceSample) {
      stopAllSpeech();
      return;
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      stopAllSpeech();

      const voices = window.speechSynthesis.getVoices();
      let chosenVoice: SpeechSynthesisVoice | null = null;
      let textToSpeak = targetVoice.samplePhrase;
      let targetLang = targetVoice.speechLang;

      // 1. Try finding native voice for target language
      if (targetVoice.lang === 'Tamil') {
        chosenVoice = voices.find((v) => v.lang.startsWith('ta')) || null;
        if (!chosenVoice) {
          // If no Tamil TTS voice is installed, use Indian English or global voice with phonetic text
          chosenVoice = voices.find((v) => v.lang.includes('IN')) || voices.find((v) => v.lang.startsWith('en')) || null;
          textToSpeak = targetVoice.phoneticSample;
        }
      } else if (targetVoice.lang === 'Hindi') {
        chosenVoice = voices.find((v) => v.lang.startsWith('hi')) || null;
        if (!chosenVoice) {
          chosenVoice = voices.find((v) => v.lang.includes('IN')) || voices.find((v) => v.lang.startsWith('en')) || null;
          textToSpeak = targetVoice.phoneticSample;
        }
      } else if (targetVoice.lang === 'Tanglish') {
        chosenVoice = voices.find((v) => v.lang.includes('IN')) || voices.find((v) => v.lang.startsWith('en')) || null;
        textToSpeak = targetVoice.samplePhrase;
      } else {
        chosenVoice = voices.find((v) => v.lang.startsWith('en')) || null;
        textToSpeak = targetVoice.samplePhrase;
      }

      // 2. Try matching gender if available
      if (targetVoice.gender === 'Female') {
        const femaleMatch = voices.find(
          (v) => (v.lang.startsWith(targetVoice.speechLang.slice(0, 2)) || v.lang.includes('IN')) &&
            /female|zira|samantha|lekha|priya|kalpana|swara|veena|catherine|karen/i.test(v.name)
        );
        if (femaleMatch) chosenVoice = femaleMatch;
      } else {
        const maleMatch = voices.find(
          (v) => (v.lang.startsWith(targetVoice.speechLang.slice(0, 2)) || v.lang.includes('IN')) &&
            /male|david|rishi|ravi|valluvar|george|alex|daniel/i.test(v.name)
        );
        if (maleMatch) chosenVoice = maleMatch;
      }

      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      if (chosenVoice) {
        utterance.voice = chosenVoice;
        utterance.lang = chosenVoice.lang;
      } else {
        utterance.lang = targetLang;
      }

      utterance.pitch = targetVoice.speechPitch;
      utterance.rate = targetVoice.speechRate * (config.speed || 1.0);

      utterance.onstart = () => {
        setIsPlayingVoiceSample(true);
        setSampleNotice(`Playing accent sample: "${textToSpeak}"`);
      };

      utterance.onend = () => {
        setIsPlayingVoiceSample(false);
        setSampleNotice(null);
      };

      utterance.onerror = () => {
        setIsPlayingVoiceSample(false);
        setSampleNotice(null);
      };

      setIsPlayingVoiceSample(true);
      setSampleNotice(`Playing accent sample: "${textToSpeak}"`);
      window.speechSynthesis.speak(utterance);
    } else {
      setSampleNotice('Audio speech preview is not supported on this browser.');
      setTimeout(() => setSampleNotice(null), 3500);
    }
  };

  // Preview Speech synthesis for user-written script
  const handleTogglePreviewSpeech = () => {
    if (isPlayingPreview) {
      stopAllSpeech();
      return;
    }

    if (!config.script) {
      setSampleNotice('Please enter or generate a voiceover script first!');
      setTimeout(() => setSampleNotice(null), 3000);
      return;
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      stopAllSpeech();

      const utterance = new SpeechSynthesisUtterance(config.script.replace(/\.\.\./g, ' '));
      utterance.rate = config.speed;
      utterance.pitch = selectedVoice.speechPitch || 1.0;

      // Match voice language if available
      const voices = window.speechSynthesis.getVoices();
      if (config.voiceId.includes('hi')) {
        const hiVoice = voices.find((v) => v.lang.startsWith('hi'));
        if (hiVoice) utterance.voice = hiVoice;
      } else if (config.voiceId.includes('ta')) {
        const taVoice = voices.find((v) => v.lang.startsWith('ta'));
        if (taVoice) utterance.voice = taVoice;
      } else if (config.voiceId.includes('tanglish')) {
        const inVoice = voices.find((v) => v.lang.includes('IN'));
        if (inVoice) utterance.voice = inVoice;
      }

      utterance.onend = () => setIsPlayingPreview(false);
      utterance.onerror = () => setIsPlayingPreview(false);

      setIsPlayingPreview(true);
      window.speechSynthesis.speak(utterance);
    } else {
      setSampleNotice('Audio preview is not supported on this browser.');
      setTimeout(() => setSampleNotice(null), 3000);
    }
  };

  return (
    <div className="bg-[#12121a] border border-purple-500/30 rounded-3xl p-4 sm:p-6 space-y-4 shadow-xl">
      {/* Header & Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center text-white shadow-md">
            <Volume2 className="w-4.5 h-4.5" />
          </div>
          <div>
            <div className="font-extrabold text-white text-sm sm:text-base flex items-center gap-2">
              <span>AI Audio & Voiceover Integration</span>
              <span className="text-[10px] mono bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30 font-bold">
                Sarvam AI + ElevenLabs
              </span>
            </div>
            <p className="text-[11px] text-white/50">
              Auto-generate natural Indian voiceovers & cinematic BGM synced to video
            </p>
          </div>
        </div>

        {/* Master Switch Toggle */}
        <button
          type="button"
          onClick={toggleEnabled}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
            config.enabled
              ? 'bg-gradient-to-r from-purple-600 to-emerald-600 text-white border-emerald-400/50 shadow-md shadow-emerald-950/50'
              : 'bg-[#181824] text-white/50 border-[#272738] hover:text-white'
          }`}
        >
          {config.enabled ? (
            <>
              <Volume2 className="w-3.5 h-3.5 text-emerald-300" />
              <span>Audio Active</span>
            </>
          ) : (
            <>
              <VolumeX className="w-3.5 h-3.5" />
              <span>Audio Disabled</span>
            </>
          )}
        </button>
      </div>

      {/* When Audio is Active */}
      {config.enabled && (
        <div className="space-y-4 pt-1 animate-in fade-in duration-200">
          {/* Mode Selector Tabs */}
          <div className="grid grid-cols-3 gap-1.5 bg-[#0f0f17] p-1.5 rounded-2xl border border-[#27272a] text-xs font-semibold mono">
            <button
              type="button"
              onClick={() => onChange({ ...config, mode: 'voiceover' })}
              className={`py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                config.mode === 'voiceover'
                  ? 'bg-purple-600 text-white font-bold shadow-xs'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Mic className="w-3.5 h-3.5 text-purple-300" />
              <span>Voiceover Speech</span>
            </button>
            <button
              type="button"
              onClick={() => onChange({ ...config, mode: 'bgm' })}
              className={`py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                config.mode === 'bgm'
                  ? 'bg-purple-600 text-white font-bold shadow-xs'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Music className="w-3.5 h-3.5 text-cyan-300" />
              <span>BGM Music</span>
            </button>
            <button
              type="button"
              onClick={() => onChange({ ...config, mode: 'hybrid' })}
              className={`py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                config.mode === 'hybrid'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold shadow-xs'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Radio className="w-3.5 h-3.5 text-pink-300" />
              <span>Hybrid (Voice + BGM)</span>
            </button>
          </div>

          {/* VOICE SELECTION & SCRIPT PANEL */}
          {(config.mode === 'voiceover' || config.mode === 'hybrid') && (
            <div className="space-y-3 bg-[#0d0d14] p-3.5 sm:p-4 rounded-2xl border border-purple-500/25">
              {/* Voice Selector Dropdown */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs mono">
                  <label className="text-white/80 font-bold flex items-center gap-1.5">
                    <Mic className="w-3.5 h-3.5 text-purple-400" />
                    <span>Voice & Accent Selection:</span>
                  </label>
                  <span className="text-[10px] text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/30 font-bold">
                    {selectedVoice.engine}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <div className="flex-1">
                    <select
                      value={config.voiceId}
                      onChange={(e) => {
                        stopAllSpeech();
                        onChange({ ...config, voiceId: e.target.value });
                      }}
                      className="w-full bg-[#141220] border border-purple-500/40 focus:border-purple-400 rounded-xl px-3 py-2.5 text-xs text-white font-medium outline-none cursor-pointer"
                    >
                      {VOICE_PRESETS.map((preset) => (
                        <option key={preset.id} value={preset.id} className="bg-[#141220] text-white">
                          {preset.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* PREVIEW VOICE BUTTON */}
                  <button
                    type="button"
                    onClick={() => handlePreviewVoiceSample(selectedVoice)}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold mono flex items-center justify-center gap-2 transition-all cursor-pointer border shrink-0 shadow-md ${
                      isPlayingVoiceSample
                        ? 'bg-rose-600 text-white border-rose-400 shadow-rose-600/30 animate-pulse'
                        : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white border-purple-400/50 shadow-purple-600/25 active:scale-95'
                    }`}
                    title="Listen to a real-time sample of this voice & accent before generating"
                  >
                    {isPlayingVoiceSample ? (
                      <>
                        <Square className="w-3.5 h-3.5 fill-white" />
                        <span>Stop Voice</span>
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-3.5 h-3.5 text-amber-300" />
                        <span>Preview Voice</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Active Voice Accent Sample Playing Banner */}
                {isPlayingVoiceSample && sampleNotice && (
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-purple-950/80 border border-purple-500/50 text-[11px] text-purple-200 animate-in fade-in duration-150">
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <div className="flex gap-0.5 items-end h-3.5 shrink-0">
                        <span className="w-0.5 bg-amber-400 animate-pulse h-full"></span>
                        <span className="w-0.5 bg-purple-400 animate-pulse h-2.5"></span>
                        <span className="w-0.5 bg-pink-400 animate-pulse h-3.5"></span>
                        <span className="w-0.5 bg-cyan-400 animate-pulse h-2"></span>
                      </div>
                      <span className="italic font-medium text-white/90 truncate">
                        {sampleNotice}
                      </span>
                    </div>
                    <span className="text-[10px] mono text-amber-300 shrink-0 font-bold ml-2 bg-amber-500/15 px-2 py-0.5 rounded border border-amber-500/30">
                      {selectedVoice.lang} Accent Sample
                    </span>
                  </div>
                )}

                <p className="text-[10px] text-white/50 mono pl-1">{selectedVoice.description}</p>
              </div>

              {/* Script Textarea & Auto-Generate Button */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <label className="text-xs font-semibold text-white/80 mono flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-fuchsia-400" />
                    <span>Voiceover Narration Script:</span>
                  </label>

                  <div className="flex items-center gap-2">
                    {/* Auto-Humanizer Button */}
                    <button
                      type="button"
                      onClick={handleHumanizeScript}
                      className={`text-[11px] px-2.5 py-1 rounded-xl mono flex items-center gap-1 transition-all border cursor-pointer ${
                        humanizerSuccess
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : 'bg-purple-600/15 hover:bg-purple-600/25 text-purple-300 border-purple-500/30'
                      }`}
                      title="Insert natural breathing pauses (...) and punctuation rhythm"
                    >
                      {humanizerSuccess ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span>Humanized!</span>
                        </>
                      ) : (
                        <>
                          <Zap className="w-3 h-3 text-amber-300" />
                          <span>Auto-Humanizer (...)</span>
                        </>
                      )}
                    </button>

                    {/* Auto-Generate Script Button */}
                    <button
                      type="button"
                      onClick={handleAutoGenerateScript}
                      disabled={isGeneratingScript}
                      className="text-[11px] px-2.5 py-1 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold mono flex items-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isGeneratingScript ? (
                        <>
                          <RefreshCw className="w-3 h-3 animate-spin" />
                          <span>Generating...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3 h-3 text-amber-300 fill-amber-300" />
                          <span>✨ Auto-Generate Script</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <textarea
                  value={config.script}
                  onChange={(e) => onChange({ ...config, script: e.target.value })}
                  placeholder="Enter custom narration script, or click '✨ Auto-Generate Script' to create speech in Tamil, Hindi, or Tanglish..."
                  rows={2}
                  className="w-full bg-[#141220] border border-[#272738] focus:border-purple-500 rounded-xl p-3 text-xs sm:text-sm text-white placeholder-white/30 resize-none outline-none"
                />

                {/* Speech Pace & Voiceover Preview Button */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs mono">
                  {/* Speed Controls */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-white/50 uppercase font-semibold">Speech Speed:</span>
                    {[0.8, 1.0, 1.2].map((spd) => (
                      <button
                        key={spd}
                        type="button"
                        onClick={() => onChange({ ...config, speed: spd })}
                        className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                          config.speed === spd
                            ? 'bg-purple-600 text-white shadow-xs'
                            : 'bg-white/5 text-white/60 hover:text-white'
                        }`}
                      >
                        {spd === 0.8 ? '0.8x (Story)' : spd === 1.0 ? '1.0x (Normal)' : '1.2x (Promo)'}
                      </button>
                    ))}
                  </div>

                  {/* Audio Preview Button */}
                  <button
                    type="button"
                    onClick={handleTogglePreviewSpeech}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                      isPlayingPreview
                        ? 'bg-rose-600 text-white border-rose-400 animate-pulse'
                        : 'bg-purple-950/60 hover:bg-purple-900/60 text-purple-200 border-purple-500/30'
                    }`}
                  >
                    {isPlayingPreview ? (
                      <>
                        <Square className="w-3 h-3 fill-white" />
                        <span>Stop Voiceover Preview</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3 h-3 fill-purple-300 text-purple-300" />
                        <span>🔊 Preview Voiceover Speech</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* BGM SELECTION PANEL */}
          {(config.mode === 'bgm' || config.mode === 'hybrid') && (
            <div className="space-y-2 bg-[#0d0d14] p-3.5 rounded-2xl border border-cyan-500/25">
              <label className="text-xs font-bold text-white/80 mono flex items-center gap-1.5">
                <Music className="w-3.5 h-3.5 text-cyan-400" />
                <span>Cinematic Background BGM Track:</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {BGM_PRESETS.map((bgm) => (
                  <button
                    key={bgm.id}
                    type="button"
                    onClick={() => onChange({ ...config, bgmId: bgm.id })}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      config.bgmId === bgm.id
                        ? 'bg-gradient-to-r from-purple-900/50 to-indigo-900/50 border-cyan-400 text-white shadow-md'
                        : 'bg-[#141220] border-[#272738] text-white/60 hover:text-white'
                    }`}
                  >
                    <div className="font-bold text-xs flex items-center justify-between">
                      <span>{bgm.label}</span>
                      {config.bgmId === bgm.id && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                    </div>
                    <div className="text-[10px] text-white/40 mt-0.5 mono">{bgm.mood}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Volume Mix Sliders */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#0d0d14] p-3 rounded-2xl border border-white/10 text-xs mono">
            {(config.mode === 'voiceover' || config.mode === 'hybrid') && (
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-white/70 text-[11px] font-semibold">Voiceover Volume:</span>
                  <span className="text-purple-300 font-bold">{config.voiceVolume}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={config.voiceVolume}
                  onChange={(e) => onChange({ ...config, voiceVolume: Number(e.target.value) })}
                  className="w-full h-1.5 bg-[#272738] rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
              </div>
            )}

            {(config.mode === 'bgm' || config.mode === 'hybrid') && (
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-white/70 text-[11px] font-semibold">BGM Music Volume:</span>
                  <span className="text-cyan-300 font-bold">{config.bgmVolume}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={config.bgmVolume}
                  onChange={(e) => onChange({ ...config, bgmVolume: Number(e.target.value) })}
                  className="w-full h-1.5 bg-[#272738] rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
