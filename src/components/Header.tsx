import React, { useState, useRef } from 'react';
import { StudioUser } from '../lib/supabase';
import { Sparkles, Coins, Layers, LogOut, Globe, ChevronDown, Check, UploadCloud, RotateCcw } from 'lucide-react';
import { useLanguage, SUPPORTED_LANGUAGES } from '../context/LanguageContext';

interface HeaderProps {
  user: StudioUser | null;
  activeView: 'studio' | 'studioApp' | 'history' | 'sql' | 'privacy' | 'terms' | 'refund' | 'contact';
  setActiveView: (view: 'studio' | 'studioApp' | 'history' | 'sql' | 'privacy' | 'terms' | 'refund' | 'contact') => void;
  onOpenCreditModal: () => void;
  onOpenAuthModal: () => void;
  onOpenZipModal: () => void;
  onOpenSequenceBuilder?: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  activeView,
  setActiveView,
  onOpenCreditModal,
  onOpenAuthModal,
  onOpenZipModal,
  onOpenSequenceBuilder,
  onLogout,
}) => {
  const { language, setLanguage, t, currentLangInfo } = useLanguage();
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [iconError, setIconError] = useState(false);
  const [textError, setTextError] = useState(false);

  // Custom Uploaded Header Logo State & Toggle Switch with localStorage persistence
  const [customLogo, setCustomLogo] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('custom_header_logo');
    }
    return null;
  });

  const [isUploadOptionOn, setIsUploadOptionOn] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('logo_upload_switch') !== 'false';
    }
    return true;
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setCustomLogo(result);
        localStorage.setItem('custom_header_logo', result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleResetLogo = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setCustomLogo(null);
    localStorage.removeItem('custom_header_logo');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const isDevPreview = typeof window !== 'undefined' && (
    window.location.hostname.includes('dev') ||
    window.location.hostname.includes('localhost') ||
    window.location.hostname.includes('127.0.0.1') ||
    user?.email === 'anand4earn@gmail.com'
  );

  return (
    <header className="sticky top-0 z-50 px-3 sm:px-6 py-2.5 bg-[#0a0a12]/90 backdrop-blur-md border-b border-white/[0.04]">
      {/* TOP HEADER - NEXVERZE STUDIO LOGO (With ON/OFF Switch & Custom Upload Option) */}
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 sm:gap-4 flex-wrap sm:flex-nowrap">
        {/* Brand & Upload Container: Top-Left Header Area with ON/OFF Switch Below Logo */}
        <div className="flex flex-col gap-1">
          {/* Top Logo Row */}
          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleLogoUpload}
              accept="image/png,image/svg+xml,image/webp,image/jpeg,image/gif"
              className="hidden"
            />

            <a
              href="/"
              onClick={(e) => {
                e.preventDefault();
                setActiveView('studio');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="brand flex items-center gap-4 sm:gap-5 hover:opacity-95 transition-opacity py-0.5 px-0.5 bg-transparent border-none shadow-none cursor-pointer"
              style={{ textDecoration: 'none', background: 'transparent' }}
              title="NEXVERZE STUDIO - Home"
            >
              {customLogo ? (
                /* Custom Uploaded Logo - Scaled to fit */
                <img
                  src={customLogo}
                  alt="Custom Header Logo"
                  className="h-[96px] max-h-[106px] w-auto object-contain transition-transform duration-300 hover:scale-105"
                  style={{
                    height: '96px',
                    width: 'auto',
                    maxHeight: '106px',
                    objectFit: 'contain',
                    background: 'transparent',
                    imageRendering: '-webkit-optimize-contrast',
                  }}
                />
              ) : (
                /* Default Side-by-Side Logo Images */
                <>
                  {/* Image 1: Glowing Orange-Blue Infinity Knot Icon (98px width x 78px height) */}
                  <img
                    src={iconError ? '/studio/icon_infinity_transparent.png' : '/icon-logo-clean.png'}
                    alt="NEXVERZE Icon"
                    className="h-[60px] sm:h-[70px] md:h-[78px] w-[78px] sm:w-[88px] md:w-[98px] object-contain transition-transform duration-300 hover:scale-105"
                    style={{
                      height: '78px',
                      width: '98px',
                      objectFit: 'contain',
                      mixBlendMode: 'screen',
                      filter: 'drop-shadow(0 0 16px rgba(0,212,255,0.85)) drop-shadow(0 0 24px rgba(255,140,0,0.65)) contrast(1.22) brightness(1.25)',
                      imageRendering: '-webkit-optimize-contrast',
                    }}
                    onError={() => setIconError(true)}
                  />

                  {/* Image 2: NEXVERZE STUDIO Text Logo (220px width x 62px height) */}
                  <img
                    src={textError ? '/studio/text_nexverze_transparent.png' : '/text-logo-clean.png'}
                    alt="NEXVERZE STUDIO"
                    className="h-[48px] sm:h-[56px] md:h-[62px] w-[170px] sm:w-[195px] md:w-[220px] object-contain transition-opacity duration-300"
                    style={{
                      height: '62px',
                      width: '220px',
                      objectFit: 'contain',
                      mixBlendMode: 'screen',
                      filter: 'drop-shadow(0 0 16px rgba(160,140,255,0.85)) drop-shadow(0 0 4px rgba(255,255,255,0.65)) contrast(1.3) brightness(1.35)',
                      imageRendering: '-webkit-optimize-contrast',
                    }}
                    onError={() => setTextError(true)}
                  />
                </>
              )}
            </a>

            {/* Logo Upload Trigger Button (Visible only when switch is ON) */}
            {isDevPreview && isUploadOptionOn && (
              <div className="flex flex-col gap-1 ml-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-2 py-1 text-[10px] bg-purple-500/20 hover:bg-purple-500/40 text-purple-200 rounded border border-purple-500/30 transition-colors"
                >
                  {customLogo ? 'Change' : 'Upload'}
                </button>
                {customLogo && (
                  <button
                    onClick={handleResetLogo}
                    className="px-2 py-1 text-[10px] bg-red-500/10 hover:bg-red-500/30 text-red-300 rounded border border-red-500/20 transition-colors"
                  >
                    Reset
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Logo Upload Toggle Switch */}
          {isDevPreview && (
            <div className="flex items-center gap-2 mt-0.5">
              <button
                onClick={() => {
                  const newValue = !isUploadOptionOn;
                  setIsUploadOptionOn(newValue);
                  localStorage.setItem('logo_upload_switch', String(newValue));
                }}
                className={`w-8 h-4 rounded-full p-0.5 transition-colors flex ${isUploadOptionOn ? 'bg-purple-600 justify-end' : 'bg-slate-700 justify-start'}`}
              >
                <div className="w-3 h-3 bg-white rounded-full" />
              </button>
              <span className="text-[10px] text-white/40 font-mono uppercase">
                Logo Edit: {isUploadOptionOn ? 'ON' : 'OFF'}
              </span>
            </div>
          )}
        </div>

        {/* Primary Nav Links */}
        <nav className="hidden md:flex items-center gap-1 mono text-xs ml-1">
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              setActiveView('studio');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="px-3 py-1.5 rounded-full text-white/70 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
          >
            Home
          </a>
          <button
            onClick={() => setActiveView('studio')}
            className={`px-3 py-1.5 rounded-full font-semibold transition-colors flex items-center gap-1.5 ${
              activeView === 'studio'
                ? 'bg-purple-600/30 text-purple-200 border border-purple-400/40'
                : 'text-white/70 hover:text-white hover:bg-white/[0.06]'
            }`}
          >
            <Sparkles className="w-3 h-3 text-purple-400" />
            <span>Studio</span>
            <span className="text-[9px] bg-purple-500 text-slate-950 font-bold px-1 rounded">PRO</span>
          </button>
          {onOpenSequenceBuilder && (
            <button
              onClick={onOpenSequenceBuilder}
              className="px-3 py-1.5 rounded-full text-white/70 hover:text-white hover:bg-white/[0.06] transition-colors flex items-center gap-1.5"
              title="Open Sequence Timeline"
            >
              <Layers className="w-3 h-3 text-cyan-400" />
              <span>Timeline</span>
            </button>
          )}

        </nav>

        {/* Right Action Buttons */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isDevPreview && (
            <>
              {/* LIVE PREVIEW button with blinking green dot */}
              <button
                onClick={() => setActiveView('studio')}
                className="flex items-center cursor-pointer transition-transform hover:scale-105"
                style={{
                  padding: '6px 12px',
                  borderRadius: '999px',
                  background: 'rgba(34,197,94,.15)',
                  border: '1px solid rgba(34,197,94,.4)',
                  color: '#22c55e',
                  fontSize: '11px',
                  fontWeight: 600,
                }}
              >
                <span
                  className="animate-blink-dot"
                  style={{
                    width: '6px',
                    height: '6px',
                    background: '#22c55e',
                    borderRadius: '50%',
                    display: 'inline-block',
                    marginRight: '6px',
                  }}
                />
                LIVE PREVIEW
              </button>

              {/* Export 9:16 button */}
              <button
                onClick={onOpenZipModal}
                className="cursor-pointer hover:opacity-90 transition-opacity"
                style={{
                  padding: '8px 16px',
                  borderRadius: '999px',
                  background: '#fff',
                  color: '#000',
                  fontWeight: 700,
                  fontSize: '12px',
                  border: 0,
                }}
                title="Export 9:16 & Project Files"
              >
                Export 9:16
              </button>
            </>
          )}

          {/* Credits Balance Pill */}
          <button
            onClick={onOpenCreditModal}
            className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full border text-[11px] sm:text-xs mono transition-all cursor-pointer ${
              (user?.credits || 0) > 0
                ? 'border-emerald-500/40 bg-emerald-950/40 text-emerald-200 hover:bg-emerald-900/40'
                : 'border-purple-500/30 bg-purple-950/40 text-purple-200 hover:bg-purple-900/40 ring-1 ring-purple-500/20'
            }`}
            title="Buy / Manage Credits & Verified Grants"
          >
            <Coins className="w-3 h-3 text-purple-400 shrink-0" />
            <span className="font-semibold">{user ? user.credits : 0} cr</span>
            
            {/* Pro badge next to credit balance for positive reinforcement & status */}
            {user && (user.is_pro || (user.credits || 0) > 0 || user.email === 'anand4earn@gmail.com') ? (
              <span className="text-[9px] font-black tracking-wide uppercase px-1.5 py-0.5 rounded-md bg-gradient-to-r from-amber-400 via-purple-500 to-pink-500 text-white shadow-xs pro-badge-glow flex items-center gap-0.5">
                <Sparkles className="w-2.5 h-2.5 fill-amber-300 text-amber-200" />
                <span>PRO</span>
              </span>
            ) : (user?.credits || 0) === 0 ? (
              <span className="text-[10px] bg-purple-500/30 text-purple-200 px-1.5 py-0.2 rounded-full border border-purple-400/20">
                Preview
              </span>
            ) : null}
          </button>

          {/* Language Selector Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full border border-purple-500/30 bg-purple-950/40 hover:bg-purple-900/50 text-white text-xs font-semibold transition-all cursor-pointer shadow-sm"
              title="Select Language"
            >
              <Globe className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              <span className="hidden sm:inline">{currentLangInfo.nativeName}</span>
              <span className="sm:hidden font-mono uppercase">{currentLangInfo.code}</span>
              <ChevronDown className={`w-3 h-3 text-white/60 transition-transform ${isLangMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {isLangMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsLangMenuOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-52 bg-[#121024] border border-purple-500/30 rounded-2xl shadow-2xl p-2 z-50 text-xs space-y-1 backdrop-blur-xl">
                  <div className="px-2.5 py-1.5 text-[10px] font-mono uppercase tracking-wider text-purple-300 font-bold border-b border-white/10 flex items-center justify-between">
                    <span>{t('selectLanguage')}</span>
                    <Globe className="w-3.5 h-3.5 text-purple-400" />
                  </div>
                  <div className="max-h-64 overflow-y-auto custom-scrollbar pt-1 space-y-0.5">
                    {SUPPORTED_LANGUAGES.map((lang) => (
                      <button
                        key={lang.code}
                        type="button"
                        onClick={() => {
                          setLanguage(lang.code);
                          setIsLangMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl transition-all text-left cursor-pointer ${
                          language === lang.code
                            ? 'bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 text-white font-bold shadow-xs'
                            : 'text-white/80 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{lang.flag}</span>
                          <span className="font-medium">{lang.nativeName}</span>
                          <span className="text-[10px] text-white/40 font-mono">({lang.name})</span>
                        </div>
                        {language === lang.code && <Check className="w-3.5 h-3.5 text-white shrink-0" />}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Log in / Account Button */}
          {user ? (
            <div className="flex items-center gap-1.5">
              <div
                className="flex items-center gap-1.5 text-white"
                style={{
                  padding: '7px 14px',
                  borderRadius: '999px',
                  background: 'linear-gradient(135deg,#8b5cff,#ff3da8)',
                  fontWeight: 700,
                  fontSize: '12px',
                }}
                title={`Signed in as ${user.email}`}
              >
                <span>{user.email.split('@')[0]}</span>
                {(user.is_pro || user.email === 'anand4earn@gmail.com') && (
                  <span className="bg-black/30 text-[9px] px-1 rounded ml-0.5">PRO</span>
                )}
              </div>
              <button
                onClick={onLogout}
                className="p-1.5 text-white/50 hover:text-red-400 hover:bg-white/[0.06] rounded-full transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuthModal}
              className="cursor-pointer hover:opacity-95 transition-opacity"
              style={{
                padding: '8px 16px',
                borderRadius: '999px',
                background: 'linear-gradient(135deg,#8b5cff,#ff3da8)',
                color: '#fff',
                fontWeight: 700,
                fontSize: '12px',
                border: 0,
              }}
            >
              Log in
            </button>
          )}
        </div>
      </div>

      {/* Mobile nav sub-bar */}
      <div className="flex md:hidden items-center justify-around border-t border-white/[0.04] mt-2 pt-2 px-2 mono text-[11px]">
        <a href="/" className="text-white/60 py-1 px-3">
          Home
        </a>
        <button
          onClick={() => setActiveView('studio')}
          className={`py-1 px-3 rounded-full ${
            activeView === 'studio' ? 'bg-purple-600/30 text-purple-300 font-semibold' : 'text-white/60'
          }`}
        >
          Studio PRO
        </button>
        <button
          onClick={() => setActiveView('history')}
          className={`py-1 px-3 rounded-full ${
            activeView === 'history' ? 'bg-purple-600/30 text-purple-300 font-semibold' : 'text-white/60'
          }`}
        >
          History
        </button>
        <button onClick={onOpenZipModal} className="text-emerald-400 py-1 px-2 font-bold">
          Export
        </button>
      </div>
    </header>
  );
};
