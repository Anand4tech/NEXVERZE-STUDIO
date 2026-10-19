import React, { useState } from 'react';

interface NexVerzeLogoProps {
  variant?: 'full' | 'compact' | 'icon';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  onClick?: () => void;
}

export const NexVerzeLogo: React.FC<NexVerzeLogoProps> = ({
  variant = 'compact',
  size = 'md',
  className = '',
  onClick,
}) => {
  const [symbolError, setSymbolError] = useState(false);
  const [textError, setTextError] = useState(false);
  const [customLogo, setCustomLogo] = useState<string | null>(null);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      setCustomLogo(localStorage.getItem('custom_header_logo'));
    }
  }, []);

  // High-clarity scaled heights
  const iconHeightClasses = {
    sm: 'h-11',
    md: 'h-[78px] w-[98px]',
    lg: 'h-20 sm:h-24',
    xl: 'h-24 sm:h-28',
  };

  const textHeightClasses = {
    sm: 'h-8',
    md: 'h-[62px] w-[220px]',
    lg: 'h-16 sm:h-18',
    xl: 'h-18 sm:h-20',
  };

  const iconHeight = iconHeightClasses[size] || iconHeightClasses.md;
  const textHeight = textHeightClasses[size] || textHeightClasses.md;

  // Icon only variant
  if (variant === 'icon') {
    return (
      <div
        onClick={onClick}
        className={`brand inline-flex items-center cursor-pointer ${className}`}
        title="NEXVERZE Icon"
      >
        <img
          src={customLogo || (symbolError ? '/studio/icon_infinity_transparent.png' : '/Screenshot_2026-10-10_231546-removebg-preview.png')}
          alt="NEXVERZE Icon"
          className={`${iconHeight} w-auto object-contain transition-transform duration-300 hover:scale-105`}
          style={{
            mixBlendMode: 'screen',
            filter: 'drop-shadow(0 0 14px rgba(0,212,255,0.85)) drop-shadow(0 0 22px rgba(255,140,0,0.65)) contrast(1.2) brightness(1.15)',
            imageRendering: '-webkit-optimize-contrast',
          }}
          onError={() => setSymbolError(true)}
        />
      </div>
    );
  }

  // Exact Brand Markup with High Visibility & Seamless Background Blending
  return (
    <div
      onClick={onClick}
      className={`brand flex items-center gap-3.5 cursor-pointer select-none ${className}`}
      title="NEXVERZE STUDIO"
    >
      {customLogo ? (
        <img
          src={customLogo}
          alt="Custom Header Logo"
          className="h-[96px] w-auto object-contain transition-transform duration-300 hover:scale-105"
          style={{
            objectFit: 'contain',
            background: 'transparent',
            imageRendering: '-webkit-optimize-contrast',
          }}
        />
      ) : (
        <>
          <img
            src={symbolError ? '/studio/icon_infinity_transparent.png' : '/icon-logo-clean.png'}
            alt="NEXVERZE Icon"
            className={`${iconHeight} w-auto object-contain transition-transform duration-300 hover:scale-105`}
            style={{
              mixBlendMode: 'screen',
              filter: 'drop-shadow(0 0 12px rgba(0,212,255,0.85)) drop-shadow(0 0 20px rgba(255,140,0,0.65)) contrast(1.2) brightness(1.2)',
              imageRendering: '-webkit-optimize-contrast',
            }}
            onError={() => setSymbolError(true)}
          />
          <img
            src={textError ? '/studio/text_nexverze_transparent.png' : '/text-logo-clean.png'}
            alt="NEXVERZE STUDIO"
            className={`${textHeight} w-auto object-contain transition-opacity duration-300 hover:opacity-95`}
            style={{
              mixBlendMode: 'screen',
              filter: 'drop-shadow(0 0 12px rgba(160,140,255,0.8)) drop-shadow(0 0 4px rgba(255,255,255,0.5)) contrast(1.25) brightness(1.3)',
              imageRendering: '-webkit-optimize-contrast',
            }}
            onError={() => setTextError(true)}
          />
        </>
      )}
    </div>
  );
};
