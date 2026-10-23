import React, { useState } from 'react';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { useLanguage, SUPPORTED_LANGUAGES } from '../context/LanguageContext';

export const LanguageSelectorButton: React.FC<{ size?: 'sm' | 'md' }> = ({ size = 'sm' }) => {
  const { language, setLanguage, t, currentLangInfo } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 rounded-xl border border-purple-500/30 bg-purple-950/40 hover:bg-purple-900/50 text-white font-semibold transition-all cursor-pointer shadow-xs ${
          size === 'sm' ? 'px-2 py-1 text-[11px]' : 'px-2.5 py-1.5 text-xs'
        }`}
        title="Select Language"
      >
        <Globe className="w-3.5 h-3.5 text-purple-400 shrink-0" />
        <span>{currentLangInfo.nativeName}</span>
        <ChevronDown className={`w-3 h-3 text-white/60 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-48 bg-[#121024] border border-purple-500/30 rounded-2xl shadow-2xl p-2 z-50 text-xs space-y-1 backdrop-blur-xl">
            <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-purple-300 font-bold border-b border-white/10 flex items-center justify-between">
              <span>{t('selectLanguage')}</span>
              <Globe className="w-3 h-3 text-purple-400" />
            </div>
            <div className="max-h-56 overflow-y-auto custom-scrollbar pt-1 space-y-0.5">
              {SUPPORTED_LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => {
                    setLanguage(lang.code);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl transition-all text-left cursor-pointer ${
                    language === lang.code
                      ? 'bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 text-white font-bold shadow-xs'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs">{lang.flag}</span>
                    <span className="font-medium text-xs">{lang.nativeName}</span>
                  </div>
                  {language === lang.code && <Check className="w-3.5 h-3.5 text-white shrink-0" />}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
