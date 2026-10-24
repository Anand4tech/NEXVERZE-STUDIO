// Procedural WebAudio Synthesizer for Auto BGM & Ambient SFX ("Smart Soundscape")
// Zero external API cost — 100% browser-native WebAudio synthesis

export type BgmMoodType = 'mass' | 'lofi' | 'emotional' | 'horror' | 'chase';
export type SfxAmbientType = 'none' | 'rain' | 'traffic' | 'footsteps' | 'waves' | 'scifi';

export interface SmartSoundscapeConfig {
  enabled: boolean;
  bgmMood: BgmMoodType;
  sfxType: SfxAmbientType;
  bgmVolume: number; // 0 to 100
  sfxVolume: number; // 0 to 100
}

export const BGM_MOOD_OPTIONS: {
  id: BgmMoodType;
  label: string;
  tamilDesc: string;
  badge: string;
  bpm: number;
}[] = [
  {
    id: 'mass',
    label: '🔥 Mass Hero BGM',
    tamilDesc: 'Heavy bass drop & brass pulse (Thalapathy / Anirudh vibe)',
    badge: 'High Energy',
    bpm: 128,
  },
  {
    id: 'lofi',
    label: '☕ Lo-Fi Chennai Chill',
    tamilDesc: 'Warm Rhodes chords & aesthetic vinyl groove',
    badge: 'Aesthetic Reels',
    bpm: 82,
  },
  {
    id: 'emotional',
    label: '🎹 Emotional Piano & Strings',
    tamilDesc: 'Heart-touching melody for story & sentimental shorts',
    badge: 'Storytelling',
    bpm: 70,
  },
  {
    id: 'horror',
    label: '👻 Horror / Mystery Drone',
    tamilDesc: 'Dark sub-bass tension & eerie atmospheric shimmer',
    badge: 'Thriller',
    bpm: 60,
  },
  {
    id: 'chase',
    label: '🏎️ Action Chase Pulse',
    tamilDesc: 'Fast cyberpunk arpeggio & cinematic percussion',
    badge: 'Fast Paced',
    bpm: 140,
  },
];

export const SFX_AMBIENT_OPTIONS: {
  id: SfxAmbientType;
  label: string;
  desc: string;
}[] = [
  { id: 'rain', label: '🌧️ Mazhai & Thunder (Rain)', desc: 'Realistic rainfall texture + distant rumble' },
  { id: 'traffic', label: '🚗 Car Chase & Engine Roar', desc: 'Doppler turbo engine sweep & city hum' },
  { id: 'footsteps', label: '👣 Cinematic Wind & Steps', desc: 'Atmospheric wind gust & rhythmic tread' },
  { id: 'waves', label: '🌊 Marina Beach Waves', desc: 'Soothing ocean surf & coastal breeze' },
  { id: 'scifi', label: '⚡ Sci-Fi Whoosh & Energy', desc: 'Futuristic portal hum & electric pulses' },
  { id: 'none', label: '🔇 BGM Only (No SFX)', desc: 'Play background music without ambient SFX' },
];

class SmartSoundscapeEngine {
  private ctx: AudioContext | null = null;
  private isPlaying = false;
  private intervalId: number | null = null;
  private noiseNode: AudioNode | null = null;
  private masterGain: GainNode | null = null;

  public start(config: SmartSoundscapeConfig) {
    this.stop();
    if (typeof window === 'undefined') return;

    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    this.ctx = new AudioCtx();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.85;
    this.masterGain.connect(this.ctx.destination);
    this.isPlaying = true;

    const bgmGainValue = Math.max(0.05, (config.bgmVolume ?? 75) / 100) * 0.35;
    const sfxGainValue = Math.max(0.05, (config.sfxVolume ?? 65) / 100) * 0.25;

    // 1. Start BGM Pattern Loop
    const moodOption = BGM_MOOD_OPTIONS.find((m) => m.id === config.bgmMood) || BGM_MOOD_OPTIONS[0];
    const stepMs = Math.round((60 / moodOption.bpm) * 1000 / 2);
    let step = 0;

    const playStep = () => {
      if (!this.isPlaying || !this.ctx || !this.masterGain) return;
      const now = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const noteGain = this.ctx.createGain();

      // Scales per mood
      const notesMap: Record<BgmMoodType, number[]> = {
        mass: [110, 110, 130.81, 146.83, 110, 164.81, 146.83, 130.81], // A minor bass + brass punch
        lofi: [261.63, 329.63, 392.0, 493.88, 293.66, 349.23, 440.0, 392.0], // Cmaj7 warm chords
        emotional: [220, 261.63, 329.63, 440, 196, 246.94, 293.66, 392], // Am -> G piano arpeggio
        horror: [73.42, 77.78, 73.42, 69.3, 73.42, 82.41, 77.78, 65.41], // Dissonant low drone
        chase: [146.83, 293.66, 174.61, 349.23, 220, 440, 196, 392], // Fast octave synth pulse
      };

      const notes = notesMap[config.bgmMood] || notesMap.mass;
      const freq = notes[step % notes.length];

      osc.type =
        config.bgmMood === 'mass'
          ? 'sawtooth'
          : config.bgmMood === 'chase'
          ? 'square'
          : config.bgmMood === 'horror'
          ? 'triangle'
          : 'sine';

      osc.frequency.setValueAtTime(freq, now);

      // Low-pass filter for warm cinematic tone
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(config.bgmMood === 'mass' ? 650 : 1200, now);

      noteGain.gain.setValueAtTime(0.001, now);
      noteGain.gain.linearRampToValueAtTime(bgmGainValue, now + 0.03);
      noteGain.gain.exponentialRampToValueAtTime(0.001, now + stepMs / 1000);

      osc.connect(filter);
      filter.connect(noteGain);
      noteGain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + stepMs / 1000 + 0.02);

      // Sub-kick on downbeats for Mass & Chase
      if ((config.bgmMood === 'mass' || config.bgmMood === 'chase') && step % 2 === 0) {
        const kickOsc = this.ctx.createOscillator();
        const kickGain = this.ctx.createGain();
        kickOsc.type = 'sine';
        kickOsc.frequency.setValueAtTime(130, now);
        kickOsc.frequency.exponentialRampToValueAtTime(38, now + 0.14);
        kickGain.gain.setValueAtTime(bgmGainValue * 1.4, now);
        kickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
        kickOsc.connect(kickGain);
        kickGain.connect(this.masterGain);
        kickOsc.start(now);
        kickOsc.stop(now + 0.17);
      }

      step++;
    };

    playStep();
    this.intervalId = window.setInterval(playStep, stepMs);

    // 2. Start Ambient SFX Layer if selected
    if (config.sfxType && config.sfxType !== 'none') {
      this.startAmbientSfx(config.sfxType, sfxGainValue);
    }
  }

  private startAmbientSfx(sfxType: SfxAmbientType, gainAmount: number) {
    if (!this.ctx || !this.masterGain) return;

    // Create filtered white/pink noise buffer for rain, waves, wind, traffic
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    const sfxGain = this.ctx.createGain();
    sfxGain.gain.value = gainAmount;

    if (sfxType === 'rain') {
      filter.type = 'bandpass';
      filter.frequency.value = 1100;
      filter.Q.value = 0.7;
    } else if (sfxType === 'waves') {
      filter.type = 'lowpass';
      filter.frequency.value = 420;
      // Modulate wave surf volume
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      lfo.frequency.value = 0.22; // 4.5s wave cycle
      lfoGain.gain.value = gainAmount * 0.6;
      lfo.connect(lfoGain);
      lfoGain.connect(sfxGain.gain);
      lfo.start();
    } else if (sfxType === 'traffic') {
      filter.type = 'lowpass';
      filter.frequency.value = 260;
      sfxGain.gain.value = gainAmount * 1.1;
    } else if (sfxType === 'scifi') {
      filter.type = 'bandpass';
      filter.frequency.value = 880;
      filter.Q.value = 4.0;
    } else {
      // footsteps / wind
      filter.type = 'lowpass';
      filter.frequency.value = 550;
    }

    noise.connect(filter);
    filter.connect(sfxGain);
    sfxGain.connect(this.masterGain);
    noise.start();
    this.noiseNode = noise;
  }

  public stop() {
    this.isPlaying = false;
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.noiseNode) {
      try {
        (this.noiseNode as AudioBufferSourceNode).stop();
      } catch {
        // ignore
      }
      this.noiseNode = null;
    }
    if (this.ctx) {
      try {
        this.ctx.close();
      } catch {
        // ignore
      }
      this.ctx = null;
    }
  }

  public getPlayingState() {
    return this.isPlaying;
  }
}

export const smartSoundscapeEngine = new SmartSoundscapeEngine();
