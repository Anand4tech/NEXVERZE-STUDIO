import React, { useState, useEffect } from 'react';

export type BrandStyle = 'nexus' | 'aperture' | 'hypernova' | 'glyph';

export interface BrandStyleInfo {
  id: BrandStyle;
  name: string;
  tagline: string;
  badgeText: string;
  titleGradient: string;
  titleGlow: string;
  badgeStyle: string;
  badgeTextGradient: string;
  accentColor: string;
  description: string;
}

export const BRAND_STYLES: Record<BrandStyle, BrandStyleInfo> = {
  nexus: {
    id: 'nexus',
    name: 'Nexus Horizon Prism',
    tagline: 'AI GENERATIVE ENGINE',
    badgeText: 'STUDIO',
    titleGradient: 'from-[#FF007F] via-[#FF6E40] via-[#00E5FF] to-[#A855F7]',
    titleGlow: 'drop-shadow-[0_2px_18px_rgba(255,0,127,0.5)] drop-shadow-[0_2px_18px_rgba(0,229,255,0.45)]',
    badgeStyle: 'from-pink-500/25 via-purple-500/25 to-cyan-500/25 border-pink-500/50 shadow-[0_0_15px_rgba(236,72,153,0.35)]',
    badgeTextGradient: 'from-pink-300 via-amber-200 to-cyan-200',
    accentColor: '#00E5FF',
    description: 'Stylized N-monogram galaxy vortex portal with celestial nebula core',
  },
  aperture: {
    id: 'aperture',
    name: 'Cinematic Iris',
    tagline: 'AI GENERATIVE ENGINE',
    badgeText: 'STUDIO',
    titleGradient: 'from-[#FF9E00] via-[#FF0055] to-[#00E5FF]',
    titleGlow: 'drop-shadow-[0_2px_16px_rgba(255,158,0,0.45)] drop-shadow-[0_2px_16px_rgba(0,229,255,0.45)]',
    badgeStyle: 'from-amber-500/25 via-rose-500/25 to-cyan-500/25 border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.3)]',
    badgeTextGradient: 'from-amber-300 via-rose-200 to-cyan-300',
    accentColor: '#FF9E00',
    description: 'Anamorphic movie studio camera iris with horizontal laser flare',
  },
  hypernova: {
    id: 'hypernova',
    name: 'Cosmic Singularity',
    tagline: 'AI GENERATIVE ENGINE',
    badgeText: 'STUDIO',
    titleGradient: 'from-[#C084FC] via-[#E879F9] to-[#00F0FF]',
    titleGlow: 'drop-shadow-[0_2px_16px_rgba(192,132,252,0.45)]',
    badgeStyle: 'from-purple-500/25 via-fuchsia-500/25 to-indigo-500/25 border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.3)]',
    badgeTextGradient: 'from-purple-200 via-fuchsia-200 to-cyan-200',
    accentColor: '#E879F9',
    description: 'Gravitational lensing event-horizon vortex with celestial singularity',
  },
  glyph: {
    id: 'glyph',
    name: 'Cyber Blades Monogram',
    tagline: 'AI GENERATIVE ENGINE',
    badgeText: 'STUDIO',
    titleGradient: 'from-[#00FFA3] via-[#00F0FF] to-[#3B82F6]',
    titleGlow: 'drop-shadow-[0_2px_16px_rgba(0,255,163,0.45)]',
    badgeStyle: 'from-emerald-500/25 via-cyan-500/25 to-blue-500/25 border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.3)]',
    badgeTextGradient: 'from-emerald-200 via-teal-200 to-cyan-200',
    accentColor: '#00FFA3',
    description: 'Minimalist architectural cyber blades forming an interlocking NV glyph',
  },
};

interface NexVerzeLogoProps {
  variant?: 'full' | 'compact' | 'icon';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  styleOverride?: BrandStyle;
  showStyleBadge?: boolean;
  showTagline?: boolean;
  className?: string;
  onClick?: () => void;
}

export const NexVerzeLogo: React.FC<NexVerzeLogoProps> = ({
  variant = 'full',
  size = 'md',
  styleOverride,
  showTagline = false,
  className = '',
  onClick,
}) => {
  const [currentStyle, setCurrentStyle] = useState<BrandStyle>(() => {
    if (styleOverride) return styleOverride;
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('nexverze_brand_style_v7') as BrandStyle;
      if (saved && BRAND_STYLES[saved]) return saved;
    }
    return 'nexus'; // Default style: Cloned Nexus Horizon Prism from reference image
  });

  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    if (styleOverride) {
      setCurrentStyle(styleOverride);
      return;
    }

    const handleStyleChange = (e: Event) => {
      const customEvent = e as CustomEvent<BrandStyle>;
      if (customEvent.detail && BRAND_STYLES[customEvent.detail]) {
        setCurrentStyle(customEvent.detail);
      }
    };

    window.addEventListener('nexverze-style-change', handleStyleChange);
    return () => {
      window.removeEventListener('nexverze-style-change', handleStyleChange);
    };
  }, [styleOverride]);

  // Size configurations with enlarged, highly visible dimensions and proper spatial rhythm
  const sizeConfig = {
    sm: {
      iconSize: 'h-10 w-10 sm:h-12 sm:w-12',
      titleSize: 'text-lg sm:text-xl font-black',
      badgeSize: 'text-[8.5px]',
      taglineSize: 'text-[8px]',
      subtext: 'hidden',
      gap: 'gap-3',
    },
    md: {
      iconSize: 'h-14 w-14 sm:h-16 sm:w-16 md:h-16 md:w-16',
      titleSize: 'text-2xl sm:text-3xl font-black',
      badgeSize: 'text-[10px]',
      taglineSize: 'text-[9.5px]',
      subtext: 'hidden sm:block',
      gap: 'gap-3.5',
    },
    lg: {
      iconSize: 'h-20 w-20 sm:h-24 sm:w-24',
      titleSize: 'text-3xl sm:text-4xl font-black',
      badgeSize: 'text-xs',
      taglineSize: 'text-[11px]',
      subtext: 'block',
      gap: 'gap-4',
    },
    xl: {
      iconSize: 'h-28 w-28 sm:h-36 sm:w-36',
      titleSize: 'text-4xl sm:text-5xl md:text-6xl font-black',
      badgeSize: 'text-sm',
      taglineSize: 'text-xs',
      subtext: 'block',
      gap: 'gap-6',
    },
  };

  const currentConfig = sizeConfig[size] || sizeConfig.md;
  const styleInfo = BRAND_STYLES[currentStyle] || BRAND_STYLES.nexus;

  // Render emblem based on active style
  const renderEmblem = () => {
    switch (currentStyle) {
      case 'nexus':
      default:
        // STYLE 1: MASTER NEXUS HORIZON PRISM (Stylized N-Monogram Galaxy Vortex Portal)
        return (
          <div className={`relative ${currentConfig.iconSize} flex-shrink-0 flex items-center justify-center group bg-transparent`}>
            {!imgError ? (
              <img
                src="/assets/nexus-horizon-prism-logo.png"
                alt="NexVerze Nexus Horizon Prism Emblem"
                className="w-full h-full object-contain relative z-10 bg-transparent drop-shadow-[0_2px_12px_rgba(255,0,127,0.3)] drop-shadow-[0_2px_10px_rgba(0,229,255,0.3)] transition-transform duration-300 group-hover:scale-105"
                loading="eager"
                onError={() => setImgError(true)}
              />
            ) : (
              /* Inline Vector Fallback with pure transparency */
              <svg
                viewBox="0 0 400 400"
                className="w-full h-full relative z-10 drop-shadow-[0_0_16px_rgba(255,0,127,0.45)] drop-shadow-[0_0_16px_rgba(0,229,255,0.45)]"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  <linearGradient id="nxLeftRibbon" x1="0%" y1="100%" x2="0%" y2="0%">
                    <stop offset="0%" stopColor="#D81B60" />
                    <stop offset="50%" stopColor="#E91E63" />
                    <stop offset="100%" stopColor="#FF4081" />
                  </linearGradient>
                  <linearGradient id="nxTopArch" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FF5252" />
                    <stop offset="50%" stopColor="#FF7043" />
                    <stop offset="100%" stopColor="#FF8A65" />
                  </linearGradient>
                  <linearGradient id="nxDiagMagenta" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FF4081" />
                    <stop offset="50%" stopColor="#E91E63" />
                    <stop offset="100%" stopColor="#C2185B" />
                  </linearGradient>
                  <linearGradient id="nxCyanSweep" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#00E5FF" />
                    <stop offset="50%" stopColor="#00BCD4" />
                    <stop offset="100%" stopColor="#0288D1" />
                  </linearGradient>
                </defs>
                <path d="M 70 315 C 60 280 75 190 85 150 C 95 115 125 105 145 125 C 120 125 102 165 98 235 C 95 285 68 315 70 315 Z" fill="url(#nxLeftRibbon)" />
                <path d="M 85 150 C 95 115 130 100 160 115 C 185 130 200 165 210 210 C 195 165 175 135 150 125 C 130 118 105 125 85 150 Z" fill="url(#nxTopArch)" />
                <path d="M 160 115 C 180 135 200 175 210 230 C 218 280 205 325 180 345 C 205 320 215 275 205 225 C 195 175 180 140 160 115 Z" fill="url(#nxDiagMagenta)" />
                <path d="M 115 155 C 135 185 165 240 195 295 C 225 340 270 350 315 325 C 265 345 220 330 190 285 C 160 235 135 185 115 155 Z" fill="url(#nxCyanSweep)" />
              </svg>
            )}
          </div>
        );

      case 'aperture':
        // STYLE 2: CINEMATIC IRIS
        return (
          <div className={`relative ${currentConfig.iconSize} flex-shrink-0 flex items-center justify-center group`}>
            <div className="absolute -inset-2 rounded-full bg-gradient-to-r from-amber-500/30 via-rose-500/25 to-cyan-500/30 blur-lg pointer-events-none" />
            <svg
              viewBox="0 0 400 400"
              className="w-full h-full relative z-10 drop-shadow-[0_0_16px_rgba(255,158,0,0.45)] drop-shadow-[0_0_16px_rgba(0,229,255,0.45)]"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="apertureBlade" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FFA000" />
                  <stop offset="50%" stopColor="#FF0055" />
                  <stop offset="100%" stopColor="#00E5FF" />
                </linearGradient>
              </defs>
              <circle cx="200" cy="200" r="170" stroke="url(#apertureBlade)" strokeWidth="4" strokeDasharray="18 10" />
              <circle cx="200" cy="200" r="145" fill="#0c0d18" stroke="rgba(255,255,255,0.15)" strokeWidth="2" />
              <polygon points="200,90 270,120 230,200 170,150" fill="url(#apertureBlade)" opacity="0.9" />
              <polygon points="270,120 310,180 240,230 200,170" fill="url(#apertureBlade)" opacity="0.85" />
              <polygon points="310,180 280,250 200,230 240,170" fill="url(#apertureBlade)" opacity="0.8" />
              <polygon points="280,250 200,290 170,210 230,200" fill="url(#apertureBlade)" opacity="0.85" />
              <polygon points="200,290 130,260 170,180 200,220" fill="url(#apertureBlade)" opacity="0.9" />
              <polygon points="130,260 100,190 180,160 170,220" fill="url(#apertureBlade)" opacity="0.95" />
              <circle cx="200" cy="200" r="18" fill="#FFFFFF" />
              <line x1="80" y1="200" x2="320" y2="200" stroke="#00E5FF" strokeWidth="3" strokeLinecap="round" />
            </svg>
          </div>
        );

      case 'hypernova':
        // STYLE 3: COSMIC SINGULARITY
        return (
          <div className={`relative ${currentConfig.iconSize} flex-shrink-0 flex items-center justify-center group`}>
            <div className="absolute -inset-2 rounded-full bg-gradient-to-r from-purple-500/30 via-fuchsia-500/25 to-cyan-500/30 blur-lg pointer-events-none" />
            <svg
              viewBox="0 0 400 400"
              className="w-full h-full relative z-10 drop-shadow-[0_0_16px_rgba(192,132,252,0.45)]"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="singularityGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#C084FC" />
                  <stop offset="50%" stopColor="#E879F9" />
                  <stop offset="100%" stopColor="#00F0FF" />
                </linearGradient>
              </defs>
              <ellipse cx="200" cy="200" rx="160" ry="70" transform="rotate(-25 200 200)" stroke="url(#singularityGrad)" strokeWidth="12" strokeLinecap="round" fill="none" opacity="0.9" />
              <ellipse cx="200" cy="200" rx="150" ry="65" transform="rotate(35 200 200)" stroke="url(#singularityGrad)" strokeWidth="6" strokeLinecap="round" fill="none" opacity="0.75" />
              <circle cx="200" cy="200" r="54" fill="#1e1035" stroke="#C084FC" strokeWidth="4" />
              <circle cx="200" cy="200" r="14" fill="#FFFFFF" />
              <circle cx="80" cy="145" r="7" fill="#00F0FF" />
              <circle cx="320" cy="255" r="7" fill="#E879F9" />
            </svg>
          </div>
        );

      case 'glyph':
        // STYLE 4: CYBER BLADES MONOGRAM
        return (
          <div className={`relative ${currentConfig.iconSize} flex-shrink-0 flex items-center justify-center group`}>
            <div className="absolute -inset-2 rounded-xl bg-gradient-to-tr from-emerald-500/30 via-cyan-500/25 to-blue-500/30 blur-lg pointer-events-none" />
            <svg
              viewBox="0 0 400 400"
              className="w-full h-full relative z-10 drop-shadow-[0_0_16px_rgba(0,255,163,0.45)]"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="cyberBlade" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#00FFA3" />
                  <stop offset="50%" stopColor="#00F0FF" />
                  <stop offset="100%" stopColor="#3B82F6" />
                </linearGradient>
              </defs>
              <rect x="70" y="70" width="260" height="260" rx="40" fill="#08101a" stroke="url(#cyberBlade)" strokeWidth="3" />
              <path d="M 120 120 L 120 280 L 160 280 L 160 180 L 240 280 L 280 280 L 280 120 L 240 120 L 240 220 L 160 120 Z" fill="url(#cyberBlade)" />
              <polygon points="170,160 200,220 230,160" fill="#FFFFFF" />
            </svg>
          </div>
        );
    }
  };

  // Standalone Icon
  if (variant === 'icon') {
    return (
      <div
        onClick={onClick}
        className={`brand inline-flex items-center cursor-pointer select-none transition-transform duration-300 hover:scale-105 ${className}`}
        title={`Nexverze Studio — ${styleInfo.name}`}
      >
        {renderEmblem()}
      </div>
    );
  }

  // Full Brand Lockup: Master Emblem + Colorful Brand Typography
  return (
    <div
      onClick={onClick}
      className={`brand inline-flex items-center ${currentConfig.gap} cursor-pointer select-none transition-transform duration-200 hover:scale-[1.01] ${className}`}
      title={`Nexverze Studio — ${styleInfo.name}: ${styleInfo.description}`}
    >
      {/* 1. Large, Clear Nexus Horizon Prism Master Emblem */}
      {renderEmblem()}

      {/* 2. Colorful Brand Typography adapted to Dark Theme */}
      <div className="flex flex-col justify-center items-center text-center select-none">
        {/* Main Brand Title: COLORFUL NEXVERZE */}
        <div className="flex items-center justify-center gap-1.5 leading-none">
          <span
            className={`tracking-[0.09em] ${currentConfig.titleSize} text-transparent bg-clip-text bg-gradient-to-r ${styleInfo.titleGradient} ${styleInfo.titleGlow}`}
            style={{
              fontFamily: "'Space Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            }}
          >
            NEXVERZE
          </span>
          <span
            className="w-2 h-2 rounded-full animate-pulse flex-shrink-0"
            style={{
              backgroundColor: styleInfo.accentColor,
              boxShadow: `0 0 12px ${styleInfo.accentColor}`,
            }}
          />
        </div>

        {/* Row 2: COLORFUL STUDIO Badge - Centered to match center of NEXVERZE */}
        <div className="flex items-center justify-center mt-1.5 leading-none w-full">
          <span
            className={`px-3 py-0.5 rounded-full ${currentConfig.badgeSize} font-black tracking-[0.26em] uppercase border bg-gradient-to-r ${styleInfo.badgeStyle}`}
            style={{
              fontFamily: "'JetBrains Mono', monospace, sans-serif",
            }}
          >
            <span className={`text-transparent bg-clip-text bg-gradient-to-r ${styleInfo.badgeTextGradient}`}>
              {styleInfo.badgeText}
            </span>
          </span>
        </div>

        {/* Row 3: Tagline (omitted by default so top header is clean) */}
        {showTagline && styleInfo.tagline && (
          <div className={`mt-1.5 leading-none ${currentConfig.subtext}`}>
            <span
              className={`${currentConfig.taglineSize} tracking-[0.22em] uppercase font-mono font-medium text-slate-400`}
            >
              {styleInfo.tagline}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
