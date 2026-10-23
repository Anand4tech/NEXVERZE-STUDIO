import React, { useState, useRef, useEffect } from 'react';
import { StudioUser } from '../lib/supabase';
import { Sparkles, Coins, Layers, LogOut, Globe, ChevronDown, Check, UploadCloud, RotateCcw, Heart, Film } from 'lucide-react';
import { useLanguage, SUPPORTED_LANGUAGES } from '../context/LanguageContext';
import { NexVerzeLogo } from './NexVerzeLogo';
import { getLocalFavorites, subscribeFavorites } from '../lib/favoritesStorage';

interface HeaderProps {
  user: StudioUser | null;
  activeView: 'studio' | 'studioApp' | 'history' | 'favorites' | 'sql' | 'privacy' | 'terms' | 'refund' | 'contact';
  setActiveView: (view: 'studio' | 'studioApp' | 'history' | 'favorites' | 'sql' | 'privacy' | 'terms' | 'refund' | 'contact') => void;
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
  const [favoritesCount, setFavoritesCount] = useState<number>(() => getLocalFavorites().length);

  useEffect(() => {
    return subscribeFavorites((items) => {
      setFavoritesCount(items.length);
    });
  }, []);

  // Ensure stale temporary upload logos are cleared from localStorage
  React.useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('custom_header_logo');
        localStorage.removeItem('logo_upload_switch');
        localStorage.removeItem('custom_logo_data');
      }
    } catch {
      // Ignore
    }
  }, []);

  const isDevPreview = typeof window !== 'undefined' && (
    window.location.hostname.includes('dev') ||
    window.location.hostname.includes('localhost') ||
    window.location.hostname.includes('127.0.0.1') ||
    window.location.hostname.includes('run.app') ||
    window.location.hostname.includes('nexverze') ||
    user?.email === 'anand4earn@gmail.com'
  );

  return (
    <header className="sticky top-0 z-50 w-full px-3 sm:px-6 lg:px-10 xl:px-12 py-2.5 bg-[#0a0a12]/90 backdrop-blur-md border-b border-white/[0.04]">
      {/* TOP HEADER - NEXVERZE STUDIO BRAND */}
      <div className="w-full max-w-full mx-auto flex items-center justify-between gap-2 sm:gap-4 flex-wrap sm:flex-nowrap">
        {/* Permanent Brand Container */}
        <div className="flex items-center gap-2 relative">
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              setActiveView('studio');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="brand flex items-center hover:opacity-95 transition-opacity py-0.5 px-0.5 bg-transparent border-none shadow-none cursor-pointer"
            style={{ textDecoration: 'none', background: 'transparent' }}
            title="NEXVERZE STUDIO - Home"
          >
            {/* Master Nexus Horizon Prism Brand Lockup */}
            <NexVerzeLogo variant="full" size="md" styleOverride="nexus" />
          </a>
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
            className={`px-3 py-1.5 rounded-full font-semibold transition-colors cursor-pointer ${
              activeView === 'studio'
                ? 'bg-purple-600/30 text-purple-200 border border-purple-400/40'
                : 'text-white/70 hover:text-white hover:bg-white/[0.06]'
            }`}
          >
            Home
          </a>
          <button
            onClick={() => setActiveView('studioApp')}
            className={`px-3 py-1.5 rounded-full font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeView === 'studioApp'
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
              className="px-3 py-1.5 rounded-full text-white/70 hover:text-white hover:bg-white/[0.06] transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Open Sequence Timeline"
            >
              <Layers className="w-3 h-3 text-cyan-400" />
              <span>Timeline</span>
            </button>
          )}

          {/* History link */}
          <button
            onClick={() => setActiveView('history')}
            className={`px-3 py-1.5 rounded-full font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeView === 'history'
                ? 'bg-purple-600/30 text-purple-200 border border-purple-400/40'
                : 'text-white/70 hover:text-white hover:bg-white/[0.06]'
            }`}
          >
            <Film className="w-3 h-3 text-purple-400" />
            <span>History</span>
          </button>

          {/* New Favorites Page link */}
          <button
            onClick={() => setActiveView('favorites')}
            className={`px-3 py-1.5 rounded-full font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeView === 'favorites'
                ? 'bg-rose-600/30 text-rose-200 border border-rose-400/50 shadow-sm shadow-rose-950/40 ring-1 ring-rose-400/30'
                : 'text-white/70 hover:text-white hover:bg-white/[0.06]'
            }`}
            title="View Liked Creations Page"
          >
            <Heart className={`w-3.5 h-3.5 ${favoritesCount > 0 ? 'fill-rose-400 text-rose-400' : 'text-rose-400'}`} />
            <span>Favorites</span>
            {favoritesCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-rose-500/20 text-rose-300 border border-rose-400/30">
                {favoritesCount}
              </span>
            )}
          </button>
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
        <a href="/" className="text-white/60 py-1 px-2">
          Home
        </a>
        <button
          onClick={() => setActiveView('studio')}
          className={`py-1 px-2 rounded-full ${
            activeView === 'studio' ? 'bg-purple-600/30 text-purple-300 font-semibold' : 'text-white/60'
          }`}
        >
          Studio
        </button>
        <button
          onClick={() => setActiveView('history')}
          className={`py-1 px-2 rounded-full ${
            activeView === 'history' ? 'bg-purple-600/30 text-purple-300 font-semibold' : 'text-white/60'
          }`}
        >
          History
        </button>
        <button
          onClick={() => setActiveView('favorites')}
          className={`py-1 px-2 rounded-full flex items-center gap-1 ${
            activeView === 'favorites' ? 'bg-rose-600/30 text-rose-300 font-bold border border-rose-500/30' : 'text-white/60'
          }`}
        >
          <Heart className={`w-3 h-3 ${favoritesCount > 0 ? 'fill-rose-400 text-rose-400' : 'text-rose-400'}`} />
          <span>Favs</span>
          {favoritesCount > 0 && <span className="text-[9px] text-rose-300">({favoritesCount})</span>}
        </button>
        <button onClick={onOpenZipModal} className="text-emerald-400 py-1 px-2 font-bold">
          Export
        </button>
      </div>
    </header>
  );
};
