/**
 * Cinematic Keywords & Autocomplete Dictionary for NexVerze AI Studio
 * Provides categorized keywords, synonyms, and predictive search utilities
 * for high-end AI video prompt generation.
 */

export interface CinematicKeyword {
  id: string;
  keyword: string;
  category: 'quality' | 'lighting' | 'camera' | 'motion' | 'style' | 'atmosphere';
  description?: string;
  tags?: string[];
  popular?: boolean;
}

export const CINEMATIC_KEYWORDS: CinematicKeyword[] = [
  // --- Resolution & Quality ---
  {
    id: '4k',
    keyword: '4k',
    category: 'quality',
    description: 'Ultra high definition 4K resolution clarity',
    tags: ['resolution', 'sharp', 'uhd', '4'],
    popular: true,
  },
  {
    id: '8k-resolution',
    keyword: '8k resolution',
    category: 'quality',
    description: 'Maximum studio fidelity micro-texture resolution',
    tags: ['resolution', 'sharp', '8k', 'detail'],
    popular: true,
  },
  {
    id: 'hyper-realistic',
    keyword: 'hyper-realistic',
    category: 'quality',
    description: 'True-to-life photographic reality and textures',
    tags: ['photoreal', 'realistic', 'real', 'hyper'],
    popular: true,
  },
  {
    id: 'photorealistic',
    keyword: 'photorealistic',
    category: 'quality',
    description: 'Crisp photo-grade realism without CGI artifacts',
    tags: ['photo', 'real', 'lens'],
    popular: true,
  },
  {
    id: 'ultra-detailed',
    keyword: 'ultra-detailed',
    category: 'quality',
    description: 'Extreme micro-surface details and intricate textures',
    tags: ['detailed', 'crisp', 'textures'],
  },
  {
    id: 'unreal-engine-5',
    keyword: 'unreal engine 5 render',
    category: 'quality',
    description: 'Next-gen Lumen dynamic global illumination and Nanite detail',
    tags: ['ue5', 'unreal', 'render', '3d'],
  },
  {
    id: 'octane-render',
    keyword: 'octane render',
    category: 'quality',
    description: 'Physically based spectral ray tracing and specular highlights',
    tags: ['octane', 'render', '3d', 'raytracing'],
  },
  {
    id: 'imax-70mm',
    keyword: 'IMAX 70mm film format',
    category: 'quality',
    description: 'Large-format cinematic emulsion depth and organic grain',
    tags: ['film', 'imax', 'analog', '70mm'],
  },
  {
    id: 'film-grain-35mm',
    keyword: '35mm film grain',
    category: 'quality',
    description: 'Subtle nostalgic cinematic emulsion noise',
    tags: ['grain', 'film', 'analog', 'vintage'],
  },
  {
    id: 'raw-photo',
    keyword: 'raw photographic capture',
    category: 'quality',
    description: 'Uncompressed dynamic range with natural color grading',
    tags: ['raw', 'photo', 'dslr'],
  },

  // --- Lighting & Illumination ---
  {
    id: 'cinematic-lighting',
    keyword: 'cinematic lighting',
    category: 'lighting',
    description: 'Multi-point movie studio lighting with specular accents',
    tags: ['light', 'cinema', 'lighting', 'studio'],
    popular: true,
  },
  {
    id: 'volumetric-lighting',
    keyword: 'volumetric lighting',
    category: 'lighting',
    description: 'Visible light beams and atmospheric rays scattering through air',
    tags: ['volumetric', 'light', 'rays', 'beams'],
    popular: true,
  },
  {
    id: 'golden-hour',
    keyword: 'golden hour lighting',
    category: 'lighting',
    description: 'Warm sunset directional illumination and long shadows',
    tags: ['sun', 'sunset', 'warm', 'golden', 'hour'],
    popular: true,
  },
  {
    id: 'neon-rim-lighting',
    keyword: 'neon rim lighting',
    category: 'lighting',
    description: 'Electric edge highlights outlining subject silhouettes',
    tags: ['neon', 'rim', 'cyber', 'edge'],
    popular: true,
  },
  {
    id: 'dramatic-chiaroscuro',
    keyword: 'dramatic chiaroscuro',
    category: 'lighting',
    description: 'Extreme contrast between dark shadows and bright highlights',
    tags: ['contrast', 'shadow', 'moody', 'dark'],
  },
  {
    id: 'god-rays',
    keyword: 'god rays',
    category: 'lighting',
    description: 'Crepuscular rays breaking through clouds or windows',
    tags: ['crepuscular', 'sunbeams', 'rays', 'beams'],
  },
  {
    id: 'bioluminescent-glow',
    keyword: 'bioluminescent glow',
    category: 'lighting',
    description: 'Organic ambient neon luminosity in dark environments',
    tags: ['glow', 'bioluminescent', 'alien', 'ocean'],
  },
  {
    id: 'soft-studio-diffusion',
    keyword: 'soft diffused studio lighting',
    category: 'lighting',
    description: 'Flattering shadow roll-off with gentle beauty box illumination',
    tags: ['soft', 'studio', 'diffuse', 'portrait'],
  },

  // --- Camera & Optics ---
  {
    id: 'anamorphic-lens',
    keyword: 'anamorphic lens flare',
    category: 'camera',
    description: 'Horizontal cinematic blue streak flares and oval bokeh',
    tags: ['lens', 'flare', 'anamorphic', 'arri'],
    popular: true,
  },
  {
    id: 'shallow-depth-of-field',
    keyword: 'shallow depth of field f/1.4',
    category: 'camera',
    description: 'Sharp subject isolation with creamy out-of-focus background',
    tags: ['dof', 'focus', 'shallow', 'bokeh'],
    popular: true,
  },
  {
    id: 'bokeh',
    keyword: 'creamy circular bokeh',
    category: 'camera',
    description: 'Aesthetic blurred background light orbs',
    tags: ['bokeh', 'blur', 'lights'],
  },
  {
    id: 'fpv-drone',
    keyword: 'FPV drone flythrough',
    category: 'camera',
    description: 'High-speed dynamic aerobatic aerial camera movements',
    tags: ['drone', 'fpv', 'aerial', 'fly'],
    popular: true,
  },
  {
    id: 'wide-angle-shot',
    keyword: 'wide-angle establishing shot',
    category: 'camera',
    description: 'Expansive environmental panorama with deep perspective',
    tags: ['wide', 'angle', 'establishing', 'landscape'],
  },
  {
    id: 'macro-close-up',
    keyword: 'macro close-up shot',
    category: 'camera',
    description: 'Extreme magnification revealing microscopic textures',
    tags: ['macro', 'close', 'extreme', 'detail'],
  },
  {
    id: 'smooth-gimbal-orbit',
    keyword: 'smooth gimbal 360 orbit',
    category: 'camera',
    description: 'Stabilized cinematic circling movement around the focal point',
    tags: ['gimbal', 'orbit', 'stabilized', 'spin'],
  },
  {
    id: 'low-angle-hero-shot',
    keyword: 'low-angle hero perspective',
    category: 'camera',
    description: 'Upward-tilted camera angle conveying grandeur and power',
    tags: ['hero', 'low', 'angle', 'upward'],
  },
  {
    id: 'dolly-zoom',
    keyword: 'Vertigo dolly zoom effect',
    category: 'camera',
    description: 'Simultaneous dolly and focal zoom warping perspective',
    tags: ['dolly', 'zoom', 'vertigo', 'zolly'],
  },

  // --- Motion & Physics ---
  {
    id: 'slow-motion-120fps',
    keyword: 'slow motion 120fps',
    category: 'motion',
    description: 'Fluid high-speed capture slowing fast physical action',
    tags: ['slowmo', 'slow', 'motion', 'fps', '120fps'],
    popular: true,
  },
  {
    id: 'seamless-loop',
    keyword: 'seamless infinite loop',
    category: 'motion',
    description: 'Perfect cyclic animation without visible cut transitions',
    tags: ['loop', 'infinite', 'repeat', 'cycle'],
  },
  {
    id: 'dynamic-motion-blur',
    keyword: 'cinematic motion blur',
    category: 'motion',
    description: '180-degree shutter angle natural velocity blurring',
    tags: ['blur', 'motion', 'speed', 'fast'],
  },
  {
    id: 'timelapse',
    keyword: 'hyperlapse timelapse',
    category: 'motion',
    description: 'Accelerated temporal flow of clouds, traffic, or celestial bodies',
    tags: ['timelapse', 'hyperlapse', 'fast', 'time'],
  },
  {
    id: 'fluid-particle-dynamics',
    keyword: 'fluid particle dynamics',
    category: 'motion',
    description: 'Realistic smoke, water splash, and atmospheric ember physics',
    tags: ['particle', 'smoke', 'water', 'physics'],
  },

  // --- Style & Atmosphere ---
  {
    id: 'cyberpunk-aesthetic',
    keyword: 'cyberpunk neon aesthetic',
    category: 'style',
    description: 'High-tech dystopian urban noir with vivid magenta and cyan',
    tags: ['cyberpunk', 'cyber', 'neon', 'sci-fi', 'future'],
    popular: true,
  },
  {
    id: 'color-graded-teal-orange',
    keyword: 'teal and orange blockbuster color grade',
    category: 'style',
    description: 'Complementary color balance standard in Hollywood cinema',
    tags: ['color', 'grade', 'teal', 'orange', 'lut'],
    popular: true,
  },
  {
    id: 'atmospheric-haze',
    keyword: 'atmospheric volumetric haze',
    category: 'atmosphere',
    description: 'Subtle fog creating depth separation between planes',
    tags: ['haze', 'fog', 'mist', 'smoke'],
  },
  {
    id: 'film-noir',
    keyword: 'moody film noir aesthetic',
    category: 'style',
    description: 'High contrast monochrome or desaturated crime thriller styling',
    tags: ['noir', 'dark', 'crime', 'vintage'],
  },
  {
    id: 'epic-fantasy',
    keyword: 'epic cinematic fantasy atmosphere',
    category: 'style',
    description: 'Mythical grandiose vistas with ethereal lighting accents',
    tags: ['fantasy', 'epic', 'mythic', 'magic'],
  },
];

export const CATEGORY_METADATA: Record<CinematicKeyword['category'], { label: string; color: string; border: string; bg: string }> = {
  quality: {
    label: 'Quality',
    color: 'text-cyan-300',
    border: 'border-cyan-500/40',
    bg: 'bg-cyan-500/10',
  },
  lighting: {
    label: 'Lighting',
    color: 'text-amber-300',
    border: 'border-amber-500/40',
    bg: 'bg-amber-500/10',
  },
  camera: {
    label: 'Camera',
    color: 'text-purple-300',
    border: 'border-purple-500/40',
    bg: 'bg-purple-500/10',
  },
  motion: {
    label: 'Motion',
    color: 'text-emerald-300',
    border: 'border-emerald-500/40',
    bg: 'bg-emerald-500/10',
  },
  style: {
    label: 'Style',
    color: 'text-rose-300',
    border: 'border-rose-500/40',
    bg: 'bg-rose-500/10',
  },
  atmosphere: {
    label: 'Atmosphere',
    color: 'text-indigo-300',
    border: 'border-indigo-500/40',
    bg: 'bg-indigo-500/10',
  },
};

/**
 * Parses user text at current cursor index and returns the active word/phrase
 * fragment being typed before cursor.
 */
export function getActiveTypingQuery(text: string, cursorPos: number): { query: string; startIndex: number; endIndex: number } {
  if (cursorPos < 0) cursorPos = text.length;
  const beforeCursor = text.slice(0, cursorPos);
  
  // Find the last delimiter before cursor (comma, semicolon, newline, or double-space)
  // We allow multi-word typing like "cinematic lig" before a comma
  const lastDelimiterMatch = beforeCursor.match(/[,;\n](?!.*[,;\n])/);
  const startIndex = lastDelimiterMatch ? (lastDelimiterMatch.index! + 1) : 0;
  
  // Trim leading whitespace for clean query
  const rawSubstr = beforeCursor.slice(startIndex);
  const leadingSpaces = rawSubstr.match(/^\s*/)?.[0].length || 0;
  const query = rawSubstr.trim();

  return {
    query,
    startIndex: startIndex + leadingSpaces,
    endIndex: cursorPos,
  };
}

/**
 * Searches keywords matching user query with smart scoring:
 * - Exact prefix of keyword (highest)
 * - Prefix of any word inside keyword
 * - Substring match or tag match
 */
export function searchCinematicKeywords(
  query: string,
  currentPrompt: string,
  limit: number = 6
): CinematicKeyword[] {
  const cleanQuery = query.trim().toLowerCase();
  const lowerPrompt = currentPrompt.toLowerCase();

  // Filter out keywords already contained in the prompt
  const available = CINEMATIC_KEYWORDS.filter((item) => {
    return !lowerPrompt.includes(item.keyword.toLowerCase());
  });

  if (!cleanQuery) {
    // If no query yet, return popular recommendations
    return available.filter((item) => item.popular).slice(0, limit);
  }

  const scored = available
    .map((item) => {
      const lower = item.keyword.toLowerCase();
      let score = 0;

      if (lower === cleanQuery) {
        score = 100;
      } else if (lower.startsWith(cleanQuery)) {
        score = 80;
      } else if (lower.split(' ').some((word) => word.startsWith(cleanQuery))) {
        score = 60;
      } else if (lower.includes(cleanQuery)) {
        score = 40;
      } else if (item.tags?.some((t) => t.toLowerCase().startsWith(cleanQuery))) {
        score = 30;
      } else if (item.tags?.some((t) => t.toLowerCase().includes(cleanQuery))) {
        score = 20;
      }

      if (item.popular && score > 0) {
        score += 5;
      }

      return { item, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.item);

  return scored.slice(0, limit);
}

/**
 * Replaces the active fragment in text with chosen keyword, formatting commas nicely.
 */
export function insertKeywordAtRange(
  fullText: string,
  startIndex: number,
  endIndex: number,
  chosenKeyword: string
): { newText: string; newCursorPos: number } {
  const before = fullText.slice(0, startIndex);
  const after = fullText.slice(endIndex);

  // Determine if we need leading comma or space
  let prefix = '';
  const trimmedBefore = before.trim();
  if (trimmedBefore && !trimmedBefore.endsWith(',') && !before.endsWith(' ') && !before.endsWith(', ')) {
    if (!before.trimEnd().endsWith(',')) {
      prefix = ', ';
    }
  }

  // Determine trailing punctuation
  let suffix = ', ';
  if (after.startsWith(',')) {
    suffix = '';
  } else if (after.startsWith(' ,')) {
    suffix = '';
  }

  const inserted = `${prefix}${chosenKeyword}${suffix}`;
  const newText = before + inserted + after.replace(/^[\s,]+/, ' ');
  const newCursorPos = (before + inserted).length;

  return { newText, newCursorPos };
}
