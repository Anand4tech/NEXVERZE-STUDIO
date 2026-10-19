export interface VideoSample {
  id: string;
  title: string;
  model: 'luma' | 'veo3' | 'veo' | 'kling' | 'ltx' | 'wan' | 'hunyuan';
  prompt: string;
  aspect_ratio: '9:16' | '16:9' | '1:1';
  video_url: string;
  thumbnail_url: string;
  duration: string;
  created_at: string;
  hasVideo?: boolean;
  isCustomReplaced?: boolean;
  objectFit?: 'cover' | 'contain';
  objectPositionX?: number; // 0 to 100 (%)
  objectPositionY?: number; // 0 to 100 (%)
  zoomScale?: number; // 1 to 2 (100% to 200%)
  aspect_videos?: {
    '9:16': string;
    '16:9': string;
    '1:1': string;
  };
}

// 9:16 Vertical Reels Sample Videos
export const SAMPLE_VIDEOS_9_16: VideoSample[] = [
  {
    id: 'festival-dance-master',
    title: 'Festival Dance & Fireworks Celebration',
    model: 'luma',
    prompt: 'Cinematic festival celebration with graceful traditional dance performance, glowing festive lanterns, colorful rangoli floor art, sparkling fireworks lighting up the night sky, hyper-detailed 8k photorealistic masterwork',
    aspect_ratio: '9:16',
    video_url: '/videos/user-reference.mp4',
    aspect_videos: {
      '9:16': '/videos/user-reference.mp4',
      '16:9': '/videos/user-reference.mp4',
      '1:1': '/videos/user-reference.mp4',
    },
    thumbnail_url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=800&auto=format&fit=crop',
    duration: '6.0s',
    created_at: new Date(Date.now() - 3600000 * 1).toISOString(),
  },
  {
    id: 'gen-sample-1',
    title: 'Cyberpunk Chennai Neon Street',
    model: 'luma',
    prompt: 'Cinematic drone shot of Chennai Marina beach at midnight in 2085, neon cyberpunk holographic lights, rain reflections on asphalt, hyper-detailed photorealistic 8k, slow tracking shot',
    aspect_ratio: '9:16',
    video_url: '/videos/sample-1.mp4',
    thumbnail_url: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?q=80&w=800&auto=format&fit=crop',
    duration: '5.2s',
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'gen-sample-chola',
    title: 'Ancestral Temple Golden Hour Reel',
    model: 'veo3',
    prompt: 'Ancient Tamil Chola temple gopuram illuminated by dramatic sunset rays, atmospheric volumetric dust particles, slow motion camera ascending gracefully, vertical 9:16 mobile masterpiece',
    aspect_ratio: '9:16',
    video_url: '/videos/sample-2.mp4',
    thumbnail_url: 'https://images.unsplash.com/photo-1600100397608-f010f443b740?q=80&w=800&auto=format&fit=crop',
    duration: '6.0s',
    created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
  {
    id: 'gen-sample-neural',
    title: 'Quantum AI Neural Matrix Drift',
    model: 'kling',
    prompt: 'Macro shot of microscopic bioluminescent fibers pulsing with violet and cyan data streams, silky smooth camera drift, vertical 9:16 octane render 8k ultra realism',
    aspect_ratio: '9:16',
    video_url: '/videos/sample-3.mp4',
    thumbnail_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop',
    duration: '4.8s',
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
];

// Dedicated 4 Slots for 16:9 Widescreen Videos (Ready for user upload)
export const SLOTS_16_9: VideoSample[] = [
  {
    id: 'widescreen-16-9-slot-1',
    title: 'Hyper-Speed Cyberpunk Freeway',
    model: 'ltx',
    prompt: 'Ultra-fast tracking shot following a neon hypercar blasting through rain-slicked highway tunnels, volumetric lens flare, cinematic 16:9 widescreen 8k',
    aspect_ratio: '16:9',
    video_url: '/videos/festival-dance-16-9.mp4',
    thumbnail_url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=800&auto=format&fit=crop',
    duration: '5.0s',
    created_at: new Date().toISOString(),
  },
  {
    id: 'widescreen-16-9-slot-2',
    title: 'Chola Dynasty Golden Sunset',
    model: 'wan',
    prompt: 'Majestic ancient temple courtyard at golden hour, monks walking past stone pillars, hyper-detailed photorealistic shadows, widescreen 16:9',
    aspect_ratio: '16:9',
    video_url: '/videos/sample-1.mp4',
    thumbnail_url: 'https://images.unsplash.com/photo-1600100397608-f010f443b740?q=80&w=800&auto=format&fit=crop',
    duration: '5.0s',
    created_at: new Date().toISOString(),
  },
  {
    id: 'widescreen-16-9-slot-3',
    title: 'Deep Ocean Bioluminescent Coral',
    model: 'hunyuan',
    prompt: 'Subaquatic exploration of bioluminescent sea life, glowing tentacles undulating rhythmically, floating micro-particles, 8k cinematic 16:9',
    aspect_ratio: '16:9',
    video_url: '/videos/sample-2.mp4',
    thumbnail_url: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?q=80&w=800&auto=format&fit=crop',
    duration: '5.0s',
    created_at: new Date().toISOString(),
  },
  {
    id: 'widescreen-16-9-slot-4',
    title: 'Hollywood Sci-Fi Space Station',
    model: 'veo3',
    prompt: 'Orbiting planetary station overlooking aurora borealis swirls on the globe below, cinematic anamorphic bokeh, IMAX 16:9 widescreen master',
    aspect_ratio: '16:9',
    video_url: '/videos/sample-3.mp4',
    thumbnail_url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=800&auto=format&fit=crop',
    duration: '5.0s',
    created_at: new Date().toISOString(),
  },
];

// Dedicated 4 Slots for 1:1 Square Videos (Ready for user upload)
export const SLOTS_1_1: VideoSample[] = [
  {
    id: 'square-1-1-slot-1',
    title: 'Neon Tokyo Ramen Counter',
    model: 'luma',
    prompt: 'Cozy steam rising from freshly prepared noodles in a neon-lit Tokyo back-alley diner, cinematic shallow depth of field, 1:1 square master',
    aspect_ratio: '1:1',
    video_url: '/videos/festival-dance-1-1.mp4',
    thumbnail_url: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?q=80&w=800&auto=format&fit=crop',
    duration: '5.0s',
    created_at: new Date().toISOString(),
  },
  {
    id: 'square-1-1-slot-2',
    title: 'Luxury Chronograph Floating Geartrain',
    model: 'kling',
    prompt: 'Macro showcase of intricate gold mechanical watch gears rotating in zero gravity, studio lighting, hyper-realistic 1:1 square',
    aspect_ratio: '1:1',
    video_url: '/videos/sample-2.mp4',
    thumbnail_url: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=800&auto=format&fit=crop',
    duration: '5.0s',
    created_at: new Date().toISOString(),
  },
  {
    id: 'square-1-1-slot-3',
    title: 'Mythological Phoenix Rebirth',
    model: 'wan',
    prompt: 'Mythical fiery bird spreading glowing golden wings amidst cascading ember embers, silky smooth fluid motion, square 1:1 Instagram masterpiece',
    aspect_ratio: '1:1',
    video_url: '/videos/sample-3.mp4',
    thumbnail_url: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?q=80&w=800&auto=format&fit=crop',
    duration: '5.0s',
    created_at: new Date().toISOString(),
  },
  {
    id: 'square-1-1-slot-4',
    title: 'AI Cybernetic Iris Reflection',
    model: 'ltx',
    prompt: 'Extreme close up of human iris transforming into glowing holographic data circuit lines, ultra-fast crisp 60fps focus pull, 1:1 square',
    aspect_ratio: '1:1',
    video_url: '/videos/sample-1.mp4',
    thumbnail_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop',
    duration: '5.0s',
    created_at: new Date().toISOString(),
  },
];

// Backwards compatibility
export const SAMPLE_VIDEOS: VideoSample[] = SAMPLE_VIDEOS_9_16;

export const PROMPT_INSPIRATIONS = [
  {
    category: '⚡ LTX Realtime Fast',
    text: 'Dynamic cyberpunk street racer drifting through neon rain-slicked alleys, exhaust backfire sparks, ultra-fast cinematic camera tracking, sharp 60fps.',
    model: 'ltx' as const,
  },
  {
    category: '💎 Wan 2.1 Photoreal',
    text: 'Cinematic portrait of an ancient bronze temple sculptor hand-carving intricate deity motifs at golden sunrise, ultra-fine dust motes, flawless lifelike skin texture.',
    model: 'wan' as const,
  },
  {
    category: '🎬 Hunyuan 13B Epic',
    text: 'Mythological celestial chariot flying through swirling volcanic thunderclouds, dramatic lightning arcs illuminating golden armor, Hollywood VFX depth.',
    model: 'hunyuan' as const,
  },
  {
    category: 'Cinematic Drone',
    text: 'Cinematic FPV drone flythrough of a futuristic coastal metropolis, volumetric sunset lighting, reflection on ocean waves, 8k hyperrealism.',
    model: 'luma' as const,
  },
  {
    category: 'Heritage & Legacy',
    text: 'Old vintage Tamil heritage courtyard with bronze lamps flickering, slow motion camera gliding through ancient teakwood pillars, warm nostalgic golden haze.',
    model: 'veo3' as const,
  },
  {
    category: 'Action & Physics',
    text: 'Macro commercial studio reveal of an ultra-sleek obsidian smartphone spinning in zero gravity, purple rim lights, clean high-end aesthetic.',
    model: 'kling' as const,
  },
];
