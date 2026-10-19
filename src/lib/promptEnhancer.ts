/**
 * Cinematic Prompt Enhancer for NexVerze Studio
 * Intelligently expands user prompt with high-fidelity camera direction,
 * lighting atmosphere, lens characteristics, and motion dynamics tailored
 * to the selected AI engine (Luma Ray 3, Kling v2.5 Turbo Pro, Veo 3.1 Fast).
 */

export interface PromptEnhanceOptions {
  model?: 'luma' | 'kling' | 'veo' | string;
  style?: 'cinematic' | 'hyperreal' | 'cyberpunk' | 'vintage' | 'anime';
}

const CINEMATIC_LIGHTING = [
  'golden hour volumetric side-lighting casting warm rim highlights',
  'diffused anamorphic blue lens flare with subtle atmospheric haze',
  'dramatic chiaroscuro lighting with deep velvet shadows',
  'soft natural twilight with photorealistic subsurface scattering',
  'neon-soaked reflective wet pavement lighting with vibrant ambient glow',
  'subtle Rembrandt studio portrait lighting with cinematic specular reflections',
];

const CAMERA_DIRECTIONS = [
  'captured on ARRI Alexa 65 with 35mm Master Anamorphic prime lens',
  'smooth slow-motion dolly forward tracking shot at 60fps',
  'sweeping low-angle crane reveal shot with shallow depth of field, f/1.8',
  'dynamic handheld gimbal orbit shot maintaining razor-sharp subject focus',
  'subtle Dutch angle tracking shot with organic film grain and motion blur',
  'epic slow-push cinematic zoom shot with ultra-crisp micro-textures',
];

const ATMOSPHERIC_DETAILS = [
  'floating dust motes caught in sunbeams, hyper-detailed 8k resolution',
  'subtle wind-blown particulate movement, award-winning cinematography',
  'dense morning mist rolling across the background, 1080x1920 crisp vertical composition',
  'pristine photorealism, cinematic color grading inspired by Roger Deakins',
  'ultra-detailed environment textures, zero compression artifacts, realistic physics',
];

const MODEL_MODIFIERS: Record<string, string> = {
  luma: 'high-frame-rate fluid motion, pristine spatial coherence, Ray 3 hyper-smooth camera path',
  kling: 'photorealistic human anatomy, nuanced facial expressions, cinematic natural lighting, v2.5 Turbo Pro fidelity',
  veo: 'Hollywood blockbuster visual fidelity, rich contextual ambient soundstage, Veo 3.1 fast dynamic physics',
};

/**
 * Expands a raw user prompt into an elite cinematic production prompt
 */
export function enhancePrompt(rawPrompt: string, options: PromptEnhanceOptions = {}): string {
  const trimmed = rawPrompt.trim();
  if (!trimmed) {
    return 'Hyper-realistic cinematic slow-motion sequence, dramatic golden hour rim lighting, ARRI Alexa 65 anamorphic lens, shallow depth of field, 8k resolution, award-winning cinematography';
  }

  // Pick random descriptors to give natural variation
  const lighting = CINEMATIC_LIGHTING[Math.floor(Math.random() * CINEMATIC_LIGHTING.length)];
  const camera = CAMERA_DIRECTIONS[Math.floor(Math.random() * CAMERA_DIRECTIONS.length)];
  const atmosphere = ATMOSPHERIC_DETAILS[Math.floor(Math.random() * ATMOSPHERIC_DETAILS.length)];
  const modelMod = options.model && MODEL_MODIFIERS[options.model] ? MODEL_MODIFIERS[options.model] : MODEL_MODIFIERS.luma;

  // Check if prompt already has camera or lighting words
  const hasCamera = /(camera|lens|shot|angle|arri|dolly|zoom)/i.test(trimmed);
  const hasLighting = /(lighting|shadow|glow|sunlight|neon|highlight)/i.test(trimmed);

  const additions: string[] = [];

  if (!hasCamera) {
    additions.push(camera);
  }
  if (!hasLighting) {
    additions.push(lighting);
  }
  additions.push(atmosphere);
  additions.push(modelMod);

  // Capitalize base prompt ending
  const base = trimmed.replace(/[.,;]+$/, '');
  return `${base}, ${additions.join(', ')}.`;
}
