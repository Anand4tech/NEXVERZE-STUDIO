import fs from 'fs';
import sharp from 'sharp';

// World-class precision brand identity for "Nexverze Studio"
// Mathematical parametric infinity curves with dual gradient ribbon tracks,
// specular highlights, and pure vector letterforms that look stunning against dark background.

const emblemSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400" fill="none">
  <defs>
    <!-- Cyan to Electric Blue Gradient -->
    <linearGradient id="cyanRibbon" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#00F0FF" />
      <stop offset="40%" stop-color="#06B6D4" />
      <stop offset="100%" stop-color="#3B82F6" />
    </linearGradient>

    <!-- Magenta to Solar Amber Gradient -->
    <linearGradient id="purpleAmberRibbon" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#9333EA" />
      <stop offset="35%" stop-color="#EC4899" />
      <stop offset="70%" stop-color="#F97316" />
      <stop offset="100%" stop-color="#FBBF24" />
    </linearGradient>

    <!-- Radiant Ambient Core Glow -->
    <radialGradient id="ambientCore" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#00F0FF" stop-opacity="0.4" />
      <stop offset="45%" stop-color="#9333EA" stop-opacity="0.2" />
      <stop offset="100%" stop-color="#050508" stop-opacity="0" />
    </radialGradient>

    <!-- Neon Glow Filter -->
    <filter id="vectorGlow" x="-20%" y="-20%" width="140%" height="140%" filterUnits="userSpaceOnUse">
      <feGaussianBlur stdDeviation="8" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>

  <!-- Ambient Glow Core -->
  <circle cx="200" cy="200" r="150" fill="url(#ambientCore)" />

  <!-- Outer Ambient Glow Traces -->
  <path d="M 125 130 C 75 130 35 162 35 200 C 35 238 75 270 125 270 C 170 270 200 230 200 200 C 200 170 230 130 275 130 C 325 130 365 162 365 200 C 365 238 325 270 275 270 C 230 270 200 230 200 200"
        stroke="url(#cyanRibbon)" stroke-width="26" stroke-linecap="round" fill="none" opacity="0.35" filter="url(#vectorGlow)" />

  <path d="M 275 270 C 325 270 365 238 365 200 C 365 162 325 130 275 130 C 230 130 200 170 200 200 C 200 230 170 270 125 270 C 75 270 35 238 35 200 C 35 162 75 130 125 130"
        stroke="url(#purpleAmberRibbon)" stroke-width="26" stroke-linecap="round" fill="none" opacity="0.35" filter="url(#vectorGlow)" />

  <!-- Primary Precision Ribbon 1: Left Loop (Electric Cyan to Blue) -->
  <path d="M 125 140 C 85 140 52 168 52 200 C 52 232 85 260 125 260 C 165 260 190 226 200 200 C 210 174 235 140 275 140 C 315 140 348 168 348 200"
        stroke="url(#cyanRibbon)" stroke-width="16" stroke-linecap="round" fill="none" opacity="0.95" />

  <!-- Primary Precision Ribbon 2: Right Loop (Vibrant Violet to Solar Amber) -->
  <path d="M 348 200 C 348 232 315 260 275 260 C 235 260 210 226 200 200 C 190 174 165 140 125 140"
        stroke="url(#purpleAmberRibbon)" stroke-width="16" stroke-linecap="round" fill="none" opacity="0.95" />

  <!-- Geometric Circuit Tracers (Top & Bottom High-Tech Parallel Rails) -->
  <path d="M 125 152 C 92 152 66 174 66 200 C 66 226 92 248 125 248 C 158 248 180 220 200 200"
        stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" fill="none" opacity="0.85" />

  <path d="M 275 248 C 308 248 334 226 334 200 C 334 174 308 152 275 152 C 242 152 220 180 200 200"
        stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" fill="none" opacity="0.85" />

  <!-- Center Quantum Intersection (Star Spark + Core Ember) -->
  <g transform="translate(200, 200)">
    <!-- 4-point Diamond Flare -->
    <path d="M 0 -22 L 5 -6 L 22 0 L 5 6 L 0 22 L -5 6 L -22 0 L -5 -6 Z" fill="#FFFFFF" />
    <circle cx="0" cy="0" r="10" fill="#00F0FF" opacity="0.7" filter="url(#vectorGlow)" />
    <circle cx="0" cy="0" r="4" fill="#FFFFFF" />
  </g>

  <!-- Precision Accent Orbit Nodes -->
  <circle cx="52" cy="200" r="5" fill="#00F0FF" />
  <circle cx="348" cy="200" r="5" fill="#F97316" />
</svg>`;

// Full Horizontal Lockup (1500 x 360)
// Proportions tailored for Top Navigation Bars, Hero Headers, and Footer branding
const fullLockupSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1500 360" width="1500" height="360" fill="none">
  <defs>
    <linearGradient id="fullCyan" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#00F0FF" />
      <stop offset="40%" stop-color="#06B6D4" />
      <stop offset="100%" stop-color="#3B82F6" />
    </linearGradient>

    <linearGradient id="fullPurpleAmber" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#9333EA" />
      <stop offset="35%" stop-color="#EC4899" />
      <stop offset="70%" stop-color="#F97316" />
      <stop offset="100%" stop-color="#FBBF24" />
    </linearGradient>

    <linearGradient id="brandTextTitanium" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" />
      <stop offset="60%" stop-color="#F8FAFC" />
      <stop offset="100%" stop-color="#CBD5E1" />
    </linearGradient>

    <linearGradient id="studioGradient" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#00F0FF" />
      <stop offset="50%" stop-color="#A855F7" />
      <stop offset="100%" stop-color="#F97316" />
    </linearGradient>

    <radialGradient id="fullAura" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#00F0FF" stop-opacity="0.35" />
      <stop offset="50%" stop-color="#9333EA" stop-opacity="0.18" />
      <stop offset="100%" stop-color="#050508" stop-opacity="0" />
    </radialGradient>

    <filter id="markGlowFull" x="-20%" y="-20%" width="140%" height="140%" filterUnits="userSpaceOnUse">
      <feGaussianBlur stdDeviation="12" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>

  <!-- ==================== EMBLEM (Left: 20 to 340) ==================== -->
  <g transform="translate(20, 20) scale(0.8)">
    <circle cx="200" cy="200" r="160" fill="url(#fullAura)" />

    <!-- Outer Ambient Glow Traces -->
    <path d="M 125 130 C 75 130 35 162 35 200 C 35 238 75 270 125 270 C 170 270 200 230 200 200 C 200 170 230 130 275 130 C 325 130 365 162 365 200 C 365 238 325 270 275 270 C 230 270 200 230 200 200"
          stroke="url(#fullCyan)" stroke-width="28" stroke-linecap="round" fill="none" opacity="0.3" filter="url(#markGlowFull)" />

    <path d="M 275 270 C 325 270 365 238 365 200 C 365 162 325 130 275 130 C 230 130 200 170 200 200 C 200 230 170 270 125 270 C 75 270 35 238 35 200 C 35 162 75 130 125 130"
          stroke="url(#fullPurpleAmber)" stroke-width="28" stroke-linecap="round" fill="none" opacity="0.3" filter="url(#markGlowFull)" />

    <!-- Primary Ribbon 1 (Left loop) -->
    <path d="M 125 140 C 85 140 52 168 52 200 C 52 232 85 260 125 260 C 165 260 190 226 200 200 C 210 174 235 140 275 140 C 315 140 348 168 348 200"
          stroke="url(#fullCyan)" stroke-width="18" stroke-linecap="round" fill="none" opacity="0.95" />

    <!-- Primary Ribbon 2 (Right loop) -->
    <path d="M 348 200 C 348 232 315 260 275 260 C 235 260 210 226 200 200 C 190 174 165 140 125 140"
          stroke="url(#fullPurpleAmber)" stroke-width="18" stroke-linecap="round" fill="none" opacity="0.95" />

    <!-- Specular High-Tech Inner Inlays -->
    <path d="M 125 152 C 92 152 66 174 66 200 C 66 226 92 248 125 248 C 158 248 180 220 200 200"
          stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" fill="none" opacity="0.9" />

    <path d="M 275 248 C 308 248 334 226 334 200 C 334 174 308 152 275 152 C 242 152 220 180 200 200"
          stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" fill="none" opacity="0.9" />

    <!-- Center Fusion Nexus -->
    <g transform="translate(200, 200)">
      <path d="M 0 -24 L 6 -6 L 24 0 L 6 6 L 0 24 L -6 6 L -24 0 L -6 -6 Z" fill="#FFFFFF" />
      <circle cx="0" cy="0" r="10" fill="#00F0FF" opacity="0.8" filter="url(#markGlowFull)" />
      <circle cx="0" cy="0" r="4" fill="#FFFFFF" />
    </g>

    <!-- Node Accents -->
    <circle cx="52" cy="200" r="5" fill="#00F0FF" />
    <circle cx="348" cy="200" r="5" fill="#F97316" />
  </g>

  <!-- ==================== TYPOGRAPHY (X: 380 to 1480) ==================== -->
  <g transform="translate(380, 185)">
    <!-- Main Brand Name "NEXVERZE" in Geometric Display Font -->
    <text x="0" y="0"
          font-family="system-ui, -apple-system, 'Plus Jakarta Sans', 'Outfit', 'Montserrat', 'Segoe UI', sans-serif"
          font-weight="900"
          font-size="142"
          letter-spacing="10"
          fill="url(#brandTextTitanium)">
      NEXVERZE
    </text>

    <!-- Subtitle Lockup: STUDIO badge & tagline -->
    <g transform="translate(4, 76)">
      <!-- Gradient Pill for STUDIO -->
      <rect x="0" y="-30" width="220" height="42" rx="21" fill="url(#studioGradient)" opacity="0.18" />
      <rect x="0" y="-30" width="220" height="42" rx="21" stroke="url(#studioGradient)" stroke-width="1.5" opacity="0.6" />

      <text x="110" y="-2"
            text-anchor="middle"
            font-family="system-ui, -apple-system, 'Plus Jakarta Sans', 'Outfit', sans-serif"
            font-weight="800"
            font-size="24"
            letter-spacing="9"
            fill="url(#studioGradient)">
        STUDIO
      </text>

      <!-- Connecting Node -->
      <circle cx="260" cy="-9" r="3.5" fill="#00F0FF" />

      <text x="282" y="-1"
            font-family="system-ui, -apple-system, 'Plus Jakarta Sans', monospace, sans-serif"
            font-weight="600"
            font-size="18"
            letter-spacing="5"
            fill="#94A3B8">
        AI CINEMATIC ENGINE
      </text>

      <!-- Precision Hairline -->
      <line x1="610" y1="-9" x2="820" y2="-9" stroke="url(#studioGradient)" stroke-width="1.5" opacity="0.4" />
    </g>
  </g>
</svg>`;

// Write SVGs
fs.writeFileSync('public/nexverze-knot-icon.svg', emblemSvg);
fs.writeFileSync('public/nexverze-logo-full.svg', fullLockupSvg);
fs.writeFileSync('public/favicon.svg', emblemSvg);

console.log('SVGs created successfully!');

// Render high-res PNGs
async function renderPngs() {
  await sharp(Buffer.from(emblemSvg))
    .resize(512, 512)
    .png({ quality: 100 })
    .toFile('public/nexverze-knot-icon.png');

  await sharp(Buffer.from(emblemSvg))
    .resize(256, 256)
    .png()
    .toFile('public/icon-logo-clean.png');

  await sharp(Buffer.from(emblemSvg))
    .resize(192, 192)
    .png()
    .toFile('public/icon.png');

  await sharp(Buffer.from(fullLockupSvg))
    .resize(1500, 360)
    .png({ quality: 100 })
    .toFile('public/nexverze-logo-full.png');

  console.log('Rendered new PNGs!');
}

renderPngs().catch(console.error);
