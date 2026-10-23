import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  Sparkles,
  Command,
  CornerDownLeft,
  X,
  Lightbulb,
  Check,
  ChevronRight,
  Flame,
} from 'lucide-react';
import {
  CinematicKeyword,
  CINEMATIC_KEYWORDS,
  CATEGORY_METADATA,
  getActiveTypingQuery,
  searchCinematicKeywords,
  insertKeywordAtRange,
} from '../lib/cinematicKeywords';

interface PromptAutocompleteTextareaProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export const PromptAutocompleteTextarea: React.FC<PromptAutocompleteTextareaProps> = ({
  id = 'studio-prompt-textarea',
  value,
  onChange,
  rows = 3,
  placeholder = 'Enter detailed cinematic scene description, camera angles, lighting, mood...',
  className = '',
  disabled = false,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [cursorPos, setCursorPos] = useState<number>(value.length);
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const [isDropdownDismissed, setIsDropdownDismissed] = useState<boolean>(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [activeQueryInfo, setActiveQueryInfo] = useState<{
    query: string;
    startIndex: number;
    endIndex: number;
  }>({ query: '', startIndex: 0, endIndex: 0 });

  // Update active query whenever value or cursor moves
  const updateQueryState = useCallback((text: string, pos: number) => {
    const info = getActiveTypingQuery(text, pos);
    setActiveQueryInfo(info);
    setIsDropdownDismissed(false);
    setSelectedIndex(0);
  }, []);

  // Compute matched suggestions
  const suggestions = useMemo(() => {
    if (!isFocused || isDropdownDismissed) return [];
    // Only search if user typed at least 1 character in the current chunk
    if (!activeQueryInfo.query || activeQueryInfo.query.length < 1) return [];
    return searchCinematicKeywords(activeQueryInfo.query, value, 5);
  }, [isFocused, isDropdownDismissed, activeQueryInfo.query, value]);

  // Top predictive match for inline ghost/hint banner
  const topMatch: CinematicKeyword | null = suggestions.length > 0 ? suggestions[0] : null;

  // Contextual quick pills recommendations: keywords not yet in the prompt
  const quickPillRecommendations = useMemo(() => {
    const lowerPrompt = value.toLowerCase();
    // Prioritize popular ones like 4k, cinematic lighting, hyper-realistic
    return CINEMATIC_KEYWORDS.filter(
      (item) => item.popular && !lowerPrompt.includes(item.keyword.toLowerCase())
    ).slice(0, 6);
  }, [value]);

  // Handle inserting a selected keyword
  const handleSelectKeyword = useCallback(
    (keyword: string) => {
      if (!textareaRef.current) return;
      const currentPos = textareaRef.current.selectionStart ?? value.length;
      const info = getActiveTypingQuery(value, currentPos);

      const { newText, newCursorPos } = insertKeywordAtRange(
        value,
        info.startIndex,
        info.endIndex,
        keyword
      );

      onChange(newText);
      setIsDropdownDismissed(true);

      // Restore focus and update cursor position
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
          setCursorPos(newCursorPos);
        }
      }, 10);
    },
    [value, onChange]
  );

  // Quick pill 1-click append
  const handleAppendPill = useCallback(
    (keyword: string) => {
      const trimmed = value.trim();
      let newText = '';
      if (!trimmed) {
        newText = keyword + ', ';
      } else if (trimmed.endsWith(',')) {
        newText = `${trimmed} ${keyword}, `;
      } else {
        newText = `${trimmed}, ${keyword}, `;
      }
      onChange(newText);

      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          const len = newText.length;
          textareaRef.current.setSelectionRange(len, len);
          setCursorPos(len);
        }
      }, 10);
    },
    [value, onChange]
  );

  // Keyboard navigation inside textarea
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (suggestions.length > 0 && !isDropdownDismissed) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % suggestions.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
        return;
      }
      if (e.key === 'Tab' || (e.key === 'Enter' && !e.shiftKey)) {
        e.preventDefault();
        if (suggestions[selectedIndex]) {
          handleSelectKeyword(suggestions[selectedIndex].keyword);
        }
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setIsDropdownDismissed(true);
        return;
      }
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        textareaRef.current &&
        !textareaRef.current.contains(e.target as Node)
      ) {
        setIsDropdownDismissed(true);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  return (
    <div className="relative w-full space-y-2">
      {/* TEXTAREA WRAPPER */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          id={id}
          rows={rows}
          value={value}
          disabled={disabled}
          onChange={(e) => {
            onChange(e.target.value);
            const pos = e.target.selectionStart;
            setCursorPos(pos);
            updateQueryState(e.target.value, pos);
          }}
          onKeyDown={handleKeyDown}
          onClick={(e) => {
            const pos = e.currentTarget.selectionStart;
            setCursorPos(pos);
            updateQueryState(value, pos);
          }}
          onKeyUp={(e) => {
            const pos = e.currentTarget.selectionStart;
            setCursorPos(pos);
            updateQueryState(value, pos);
          }}
          onFocus={(e) => {
            setIsFocused(true);
            const pos = e.target.selectionStart;
            setCursorPos(pos);
            updateQueryState(value, pos);
          }}
          onBlur={() => {
            // Delay blur to allow clicks inside suggestions dropdown
            setTimeout(() => {
              setIsFocused(false);
            }, 200);
          }}
          placeholder={placeholder}
          className={`${className} relative z-10`}
        />

        {/* INLINE PREDICTIVE BADGE/HINT (Shows when user is typing a matching keyword) */}
        {topMatch && !isDropdownDismissed && isFocused && (
          <div className="absolute right-3 bottom-3 z-20 pointer-events-none hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-lg bg-purple-950/90 border border-purple-500/50 text-[11px] mono text-purple-200 shadow-md backdrop-blur-md animate-in fade-in duration-150">
            <Sparkles className="w-3 h-3 text-amber-300 animate-pulse" />
            <span>Tab to insert:</span>
            <span className="font-semibold text-white bg-purple-800/60 px-1.5 py-0.5 rounded border border-purple-400/40">
              {topMatch.keyword}
            </span>
          </div>
        )}

        {/* FLOATING AUTOCOMPLETE DROPDOWN */}
        {suggestions.length > 0 && isFocused && !isDropdownDismissed && (
          <div
            ref={dropdownRef}
            className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-[#0e0e17] border border-purple-500/50 rounded-2xl p-2 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150 space-y-1"
            role="listbox"
            aria-label="Cinematic keyword suggestions"
          >
            {/* Header / Instructions */}
            <div className="flex items-center justify-between px-2.5 py-1 text-[10px] mono text-white/50 border-b border-[#272738] mb-1">
              <span className="flex items-center gap-1.5 text-purple-300 font-semibold">
                <Sparkles className="w-3 h-3 text-purple-400" />
                <span>Cinematic Keyword Autocomplete</span>
              </span>
              <div className="flex items-center gap-2">
                <span className="hidden sm:inline">Use ↑↓ to navigate</span>
                <span className="px-1.5 py-0.5 rounded bg-white/10 text-white font-bold flex items-center gap-0.5">
                  <CornerDownLeft className="w-2.5 h-2.5" /> Tab / Enter
                </span>
                <button
                  type="button"
                  onClick={() => setIsDropdownDismissed(true)}
                  className="hover:text-white transition-colors"
                  title="Dismiss suggestions (Esc)"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Suggestions list */}
            <div className="max-h-56 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
              {suggestions.map((item, idx) => {
                const isSelected = idx === selectedIndex;
                const meta = CATEGORY_METADATA[item.category];
                return (
                  <button
                    key={item.id}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    onClick={() => handleSelectKeyword(item.keyword)}
                    className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between gap-3 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-purple-600/30 border border-purple-500/60 shadow-sm'
                        : 'hover:bg-white/[0.04] border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {/* Category tag */}
                      <span
                        className={`text-[10px] mono px-2 py-0.5 rounded-md border font-semibold shrink-0 ${meta.bg} ${meta.color} ${meta.border}`}
                      >
                        {meta.label}
                      </span>

                      {/* Keyword with description */}
                      <div className="min-w-0 truncate">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-white truncate">
                          <span>{item.keyword}</span>
                          {item.popular && (
                            <span className="text-[9px] px-1 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30 flex items-center gap-0.5 shrink-0">
                              <Flame className="w-2.5 h-2.5" /> Hot
                            </span>
                          )}
                        </div>
                        {item.description && (
                          <p className="text-[10px] text-white/50 truncate">
                            {item.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Action key indicator */}
                    <div className="shrink-0 flex items-center gap-1">
                      {isSelected ? (
                        <span className="text-[10px] mono px-2 py-0.5 rounded bg-purple-500 text-white font-bold flex items-center gap-1 shadow-sm">
                          Insert <ChevronRight className="w-3 h-3" />
                        </span>
                      ) : (
                        <span className="text-[10px] mono text-white/30">Select</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* QUICK CINEMATIC KEYWORD PILLS (1-Click instant add) */}
      {quickPillRecommendations.length > 0 && (
        <div className="pt-0.5">
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="flex items-center gap-1 text-[11px] mono text-white/40 shrink-0 mr-0.5 select-none">
              <Lightbulb className="w-3 h-3 text-amber-400" />
              <span>Quick Suggestions:</span>
            </span>
            {quickPillRecommendations.map((item) => {
              const meta = CATEGORY_METADATA[item.category];
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleAppendPill(item.keyword)}
                  className={`group px-2.5 py-1 rounded-xl text-xs mono border transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer ${meta.bg} ${meta.border} hover:border-purple-400/80 hover:bg-purple-900/30 text-white/80 hover:text-white`}
                  title={`Click to add "${item.keyword}" to your prompt`}
                >
                  <span className="text-purple-400 group-hover:text-purple-300 font-bold">+</span>
                  <span className="font-medium">{item.keyword}</span>
                  <span
                    className={`text-[9px] px-1 py-0.2 rounded border hidden sm:inline ${meta.border} ${meta.color}`}
                  >
                    {meta.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
