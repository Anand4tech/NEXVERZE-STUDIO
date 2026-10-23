import React from 'react';
import { Flame, Sparkles } from 'lucide-react';

export interface PromptChipItem {
  id: string;
  label: string;
  prompt: string;
}

export const VIRAL_PROMPT_CHIPS: PromptChipItem[] = [
  {
    id: 'temple',
    label: '🏛️ Viral Cinematic Temple',
    prompt: 'Cinematic FPV drone flythrough of ancient Tamil temple gopuram at sunset, 8k volumetric light, golden hour, photorealistic hyper-detail',
  },
  {
    id: 'anime',
    label: '⚔️ Anime Character Action',
    prompt: 'Hyper-detailed 3D anime warrior invoking lightning aura on stormy cliff, Ufotable animation style, dynamic camera rotation, 8k render',
  },
  {
    id: 'cyberpunk',
    label: '🌃 3D Cyberpunk City',
    prompt: 'Futuristic Chennai 2099 cyberpunk neon street, hovering vehicles with purple plasma trail, rain reflections on asphalt, photorealistic 8k',
  },
  {
    id: 'drone',
    label: '🚁 FPV High Speed Drone',
    prompt: 'Ultra high-speed FPV drone diving down steep mist-covered Western Ghats mountain peak at sunrise, lens flare, cinematic motion blur',
  },
  {
    id: 'nature',
    label: '🌅 Golden Hour Nature',
    prompt: 'Serene Keralan backwaters reflection during golden hour, glowing sun ray breaking through palm leaves, cinematic slow motion 60fps',
  },
];

export const ViralPromptChips: React.FC<{
  onSelectPrompt: (promptText: string) => void;
  activePrompt?: string;
}> = ({ onSelectPrompt, activePrompt }) => {
  return (
    <div className="space-y-1.5 pt-1">
      <div className="flex items-center justify-between text-[11px] mono">
        <span className="flex items-center gap-1.5 text-amber-300 font-bold uppercase tracking-wider">
          <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400 animate-pulse" />
          <span>Viral Reel Ideas (1-Click Presets)</span>
        </span>
        <span className="text-white/40 text-[10px]">Click to apply</span>
      </div>

      <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1 pt-0.5">
        {VIRAL_PROMPT_CHIPS.map((chip) => {
          const isSelected = activePrompt === chip.prompt;
          return (
            <button
              key={chip.id}
              type="button"
              onClick={() => onSelectPrompt(chip.prompt)}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 border cursor-pointer shrink-0 active:scale-95 ${
                isSelected
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-purple-400 shadow-md shadow-purple-900/40'
                  : 'bg-[#141224] hover:bg-purple-950/40 text-purple-200 border-purple-500/25 hover:border-purple-400/50'
              }`}
            >
              <Sparkles className="w-3 h-3 text-amber-300" />
              <span>{chip.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
