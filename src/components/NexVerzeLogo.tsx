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
  const [logoError, setLogoError] = useState(false);
  const [customLogo, setCustomLogo] = useState<string | null>(null);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('custom_header_logo');
      // If old placeholder/screenshot was cached, ignore so new blended logo renders
      if (stored && (stored.includes('Screenshot') || stored.includes('removebg'))) {
        localStorage.removeItem('custom_header_logo');
        setCustomLogo(null);
      } else {
        setCustomLogo(stored);
      }
    }
  }, []);

  // Responsive height classes
  const fullHeightClasses = {
    sm: 'h-9 sm:h-10',
    md: 'h-12 sm:h-14 md:h-16',
    lg: 'h-16 sm:h-20',
    xl: 'h-20 sm:h-24',
  };

  const iconHeightClasses = {
    sm: 'h-8 sm:h-9',
    md: 'h-12 sm:h-14',
    lg: 'h-16 sm:h-18',
    xl: 'h-20 sm:h-22',
  };

  const fullHeight = fullHeightClasses[size] || fullHeightClasses.md;
  const iconHeight = iconHeightClasses[size] || iconHeightClasses.md;

  // Icon only variant
  if (variant === 'icon') {
    return (
      <div
        onClick={onClick}
        className={`brand inline-flex items-center cursor-pointer ${className}`}
        title="NEXVERZE Icon"
      >
        <img
          src={customLogo || '/nexverze-knot-icon.png'}
          alt="NEXVERZE Icon"
          className={`${iconHeight} w-auto object-contain transition-transform duration-300 hover:scale-105`}
          style={{
            filter: 'drop-shadow(0 0 14px rgba(0,212,255,0.75)) drop-shadow(0 0 22px rgba(255,140,0,0.55))',
            imageRendering: '-webkit-optimize-contrast',
          }}
          onError={() => setLogoError(true)}
        />
      </div>
    );
  }

  // Full / Compact Brand Lockup (Seamless Transparent Background Blending)
  return (
    <div
      onClick={onClick}
      className={`brand flex items-center cursor-pointer select-none ${className}`}
      title="NEXVERZE STUDIO"
    >
      <img
        src={customLogo || (logoError ? '/icon-logo-clean.png' : '/nexverze-logo-full.png')}
        alt="NEXVERZE STUDIO"
        className={`${fullHeight} w-auto object-contain transition-transform duration-300 hover:scale-105`}
        style={{
          background: 'transparent',
          filter: 'drop-shadow(0 0 16px rgba(0,212,255,0.45)) drop-shadow(0 0 24px rgba(255,140,0,0.35))',
          imageRendering: '-webkit-optimize-contrast',
        }}
        onError={() => setLogoError(true)}
      />
    </div>
  );
};
