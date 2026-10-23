import React, { useEffect, useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import { StudioGeneration, fetchUserGenerations } from '../lib/supabase';
import {
  PieChart as PieChartIcon,
  BarChart3,
  Zap,
  Sparkles,
  Film,
  ArrowUpRight,
  Cpu,
} from 'lucide-react';

export interface EngineUsageStat {
  key: string;
  name: string;
  shortName: string;
  credits: number;
  renders: number;
  percentage: number;
  color: string;
  badgeBg: string;
  costPer5s: number;
}

interface UsageBreakdownCardProps {
  generations?: StudioGeneration[];
  userEmail?: string;
  userCredits?: number;
  compact?: boolean;
  onOpenFullHistory?: () => void;
  className?: string;
}

const ENGINE_METADATA: Record<
  string,
  {
    name: string;
    shortName: string;
    color: string;
    badgeBg: string;
    costPer5s: number;
  }
> = {
  luma: {
    name: 'Luma Ray 3 (Fast)',
    shortName: 'Luma Fast',
    color: '#ec4899',
    badgeBg: 'bg-pink-500/15 text-pink-300 border-pink-500/30',
    costPer5s: 50,
  },
  kling: {
    name: 'Kling v2.5 Turbo Pro',
    shortName: 'Kling Pro',
    color: '#f59e0b',
    badgeBg: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    costPer5s: 120,
  },
  veo: {
    name: 'Google Veo 3.1 Ultra',
    shortName: 'Veo Ultra',
    color: '#06b6d4',
    badgeBg: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
    costPer5s: 150,
  },
  ltx: {
    name: 'LTX-Video Realtime',
    shortName: 'LTX-Video',
    color: '#8b5cf6',
    badgeBg: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
    costPer5s: 35,
  },
  wan: {
    name: 'Wan 2.1 Cinematic',
    shortName: 'Wan 2.1',
    color: '#10b981',
    badgeBg: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    costPer5s: 45,
  },
  hunyuan: {
    name: 'HunyuanVideo HD',
    shortName: 'Hunyuan',
    color: '#6366f1',
    badgeBg: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
    costPer5s: 60,
  },
};

export const UsageBreakdownCard: React.FC<UsageBreakdownCardProps> = ({
  generations: externalGenerations,
  userEmail,
  userCredits = 0,
  compact = false,
  onOpenFullHistory,
  className = '',
}) => {
  const [internalGenerations, setInternalGenerations] = useState<StudioGeneration[]>([]);
  const [visualType, setVisualType] = useState<'bar' | 'donut'>('bar');

  useEffect(() => {
    if (externalGenerations) return;
    let isMounted = true;

    const loadData = async () => {
      try {
        const list = await fetchUserGenerations(userEmail);
        if (isMounted) {
          setInternalGenerations(list);
        }
      } catch {
        // Fallback to localStorage
        if (typeof window !== 'undefined') {
          try {
            const raw = localStorage.getItem('nexverze_studio_history');
            if (raw && isMounted) {
              setInternalGenerations(JSON.parse(raw));
            }
          } catch {
            // ignore
          }
        }
      }
    };

    loadData();
    return () => {
      isMounted = false;
    };
  }, [externalGenerations, userEmail]);

  const sourceGenerations = externalGenerations ?? internalGenerations;

  const { engineStats, totalCredits30d, totalRenders30d, isSimulated } = useMemo(() => {
    const now = new Date();
    const cutoff = new Date(now);
    cutoff.setDate(cutoff.getDate() - 30);

    const accum: Record<string, { credits: number; renders: number }> = {
      luma: { credits: 0, renders: 0 },
      kling: { credits: 0, renders: 0 },
      veo: { credits: 0, renders: 0 },
      ltx: { credits: 0, renders: 0 },
      wan: { credits: 0, renders: 0 },
      hunyuan: { credits: 0, renders: 0 },
    };

    let realTotalCredits = 0;
    let realTotalRenders = 0;

    sourceGenerations.forEach((gen) => {
      if (!gen.created_at) return;
      const d = new Date(gen.created_at);
      if (d < cutoff) return;

      const rawModel = (gen.model || 'luma').toLowerCase();
      let key = 'luma';
      if (rawModel.includes('kling')) key = 'kling';
      else if (rawModel.includes('veo')) key = 'veo';
      else if (rawModel.includes('ltx')) key = 'ltx';
      else if (rawModel.includes('wan')) key = 'wan';
      else if (rawModel.includes('hunyuan')) key = 'hunyuan';
      else if (rawModel.includes('luma')) key = 'luma';

      const credits = Number(gen.credits_used) || ENGINE_METADATA[key]?.costPer5s || 50;
      accum[key].credits += credits;
      accum[key].renders += 1;
      realTotalCredits += credits;
      realTotalRenders += 1;
    });

    const hasRealActivity = realTotalCredits > 0;

    if (!hasRealActivity) {
      // Baseline 30-day studio reference breakdown when no generations are logged yet
      accum.luma = { credits: 450, renders: 9 };
      accum.kling = { credits: 360, renders: 3 };
      accum.veo = { credits: 300, renders: 2 };
      accum.ltx = { credits: 140, renders: 4 };
      accum.wan = { credits: 90, renders: 2 };
      accum.hunyuan = { credits: 60, renders: 1 };
      realTotalCredits = 1400;
      realTotalRenders = 21;
    }

    const stats: EngineUsageStat[] = Object.keys(ENGINE_METADATA)
      .map((key) => {
        const meta = ENGINE_METADATA[key];
        const credits = accum[key]?.credits || 0;
        const renders = accum[key]?.renders || 0;
        const percentage =
          realTotalCredits > 0 ? Math.round((credits / realTotalCredits) * 1000) / 10 : 0;
        return {
          key,
          name: meta.name,
          shortName: meta.shortName,
          credits,
          renders,
          percentage,
          color: meta.color,
          badgeBg: meta.badgeBg,
          costPer5s: meta.costPer5s,
        };
      })
      .filter((item) => item.credits > 0)
      .sort((a, b) => b.credits - a.credits);

    return {
      engineStats: stats,
      totalCredits30d: realTotalCredits,
      totalRenders30d: realTotalRenders,
      isSimulated: !hasRealActivity,
    };
  }, [sourceGenerations]);

  const topEngine = engineStats[0];

  return (
    <div
      className={`bg-[#14141d] border border-[#27273a] rounded-2xl ${
        compact ? 'p-4 space-y-3.5' : 'p-5 sm:p-6 space-y-5'
      } relative overflow-hidden ${className}`}
    >
      {/* Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-sm sm:text-base font-bold text-white tracking-tight">
                Usage Breakdown by AI Engine
              </h4>
              <span className="px-2 py-0.5 rounded-md bg-white/[0.06] border border-white/10 text-[10px] font-mono text-purple-300 uppercase">
                Last 30 Days
              </span>
              {isSimulated && (
                <span className="px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/25 text-[10px] font-mono text-amber-300">
                  Sample Projection
                </span>
              )}
            </div>
            <p className="text-[11px] text-white/50">
              Credits spent across neural video engines ({totalRenders30d} renders •{' '}
              <span className="text-purple-300 font-mono tabular-nums font-semibold">
                {totalCredits30d.toLocaleString()} cr
              </span>{' '}
              spent)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Chart Mode Switcher: Bar vs Donut */}
          <div className="flex items-center bg-[#0e0e16] p-0.5 rounded-xl border border-[#27273a] text-[11px] font-mono">
            <button
              type="button"
              onClick={() => setVisualType('bar')}
              className={`px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer ${
                visualType === 'bar'
                  ? 'bg-purple-600 text-white font-semibold shadow-xs'
                  : 'text-white/55 hover:text-white'
              }`}
              title="Horizontal Bar Chart by AI Engine"
            >
              <BarChart3 className="w-3 h-3" />
              <span>Bars</span>
            </button>
            <button
              type="button"
              onClick={() => setVisualType('donut')}
              className={`px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer ${
                visualType === 'donut'
                  ? 'bg-purple-600 text-white font-semibold shadow-xs'
                  : 'text-white/55 hover:text-white'
              }`}
              title="Donut Share Chart by AI Engine"
            >
              <PieChartIcon className="w-3 h-3" />
              <span>Share</span>
            </button>
          </div>

          {onOpenFullHistory && (
            <button
              type="button"
              onClick={onOpenFullHistory}
              className="px-2.5 py-1 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-300 text-[11px] font-mono font-semibold flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap"
            >
              <span>Full Audit</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Multi-Segment Stacked Proportional Bar (30-Day Share at a Glance) */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px] font-mono text-white/60">
          <span>30-Day Engine Credit Distribution</span>
          <span className="tabular-nums text-white/80">
            Top Engine:{' '}
            <strong className="text-fuchsia-300">{topEngine?.shortName || 'Luma Fast'}</strong> (
            {topEngine?.percentage || 0}%)
          </span>
        </div>
        <div className="h-3 w-full rounded-full bg-[#0b0b12] border border-white/10 overflow-hidden flex p-0.5 gap-0.5">
          {engineStats.map((eng) => (
            <div
              key={eng.key}
              style={{
                width: `${Math.max(eng.percentage, 3)}%`,
                backgroundColor: eng.color,
              }}
              className="h-full first:rounded-l-full last:rounded-r-full transition-all duration-500 hover:opacity-90"
              title={`${eng.name}: ${eng.credits.toLocaleString()} cr (${eng.percentage}%)`}
            />
          ))}
        </div>
      </div>

      {/* Main Visualization Grid: Left Interactive Recharts View + Right Per-Engine Tabular Breakdown */}
      <div
        className={`grid grid-cols-1 ${
          compact ? 'md:grid-cols-12 gap-4' : 'lg:grid-cols-12 gap-5'
        } items-center`}
      >
        {/* Recharts Visualization (5 cols) */}
        <div
          className={`${
            compact ? 'md:col-span-5 h-44' : 'lg:col-span-5 h-52'
          } w-full bg-[#0e0e16]/90 border border-[#232336] rounded-xl p-3 flex flex-col justify-center`}
        >
          {visualType === 'bar' ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={engineStats}
                layout="vertical"
                margin={{ top: 4, right: 16, left: 4, bottom: 4 }}
              >
                <XAxis
                  type="number"
                  hide
                  domain={[0, 'dataMax']}
                />
                <YAxis
                  type="category"
                  dataKey="shortName"
                  width={74}
                  tick={{ fill: '#d4d4d8', fontSize: 11, fontFamily: 'monospace' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload as EngineUsageStat;
                      return (
                        <div className="bg-[#181826] border border-[#3b3b54] px-3 py-2 rounded-xl shadow-xl text-xs space-y-1 font-mono">
                          <div className="font-bold text-white flex items-center gap-1.5">
                            <span
                              className="w-2.5 h-2.5 rounded-full inline-block"
                              style={{ backgroundColor: d.color }}
                            />
                            <span>{d.name}</span>
                          </div>
                          <div className="text-purple-300 tabular-nums">
                            Credits Spent: <strong>{d.credits.toLocaleString()} cr</strong> ({d.percentage}%)
                          </div>
                          <div className="text-white/60 tabular-nums">
                            Videos Rendered: {d.renders} clips
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="credits" radius={[0, 6, 6, 0]} barSize={compact ? 14 : 18}>
                  {engineStats.map((entry) => (
                    <Cell key={entry.key} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="relative w-full h-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={engineStats}
                    dataKey="credits"
                    nameKey="shortName"
                    cx="50%"
                    cy="50%"
                    innerRadius={compact ? 38 : 46}
                    outerRadius={compact ? 62 : 72}
                    paddingAngle={3}
                    stroke="none"
                  >
                    {engineStats.map((entry) => (
                      <Cell key={entry.key} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload as EngineUsageStat;
                        return (
                          <div className="bg-[#181826] border border-[#3b3b54] px-3 py-2 rounded-xl shadow-xl text-xs space-y-1 font-mono">
                            <div className="font-bold text-white">{d.name}</div>
                            <div className="text-purple-300 tabular-nums">
                              {d.credits.toLocaleString()} cr ({d.percentage}%)
                            </div>
                            <div className="text-white/60 tabular-nums">{d.renders} renders</div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                <span className="text-[10px] font-mono uppercase text-white/45">30d Total</span>
                <span className="text-sm sm:text-base font-black text-white font-mono tabular-nums">
                  {totalCredits30d.toLocaleString()}
                </span>
                <span className="text-[10px] font-mono text-purple-400">credits</span>
              </div>
            </div>
          )}
        </div>

        {/* High-Density Tabular Engine Breakdown List (7 cols) */}
        <div className={`${compact ? 'md:col-span-7' : 'lg:col-span-7'} space-y-2`}>
          <div className="grid grid-cols-12 text-[10px] font-mono uppercase tracking-wider text-white/40 px-2.5 pb-1 border-b border-white/[0.06]">
            <div className="col-span-5">AI Engine</div>
            <div className="col-span-2 text-right">Renders</div>
            <div className="col-span-3 text-right">Credits Spent</div>
            <div className="col-span-2 text-right">Share</div>
          </div>

          <div className="space-y-1.5">
            {engineStats.map((eng) => (
              <div
                key={eng.key}
                className="grid grid-cols-12 items-center px-2.5 py-2 rounded-xl bg-[#0e0e16]/70 hover:bg-[#191927] border border-white/[0.04] transition-colors text-xs"
              >
                <div className="col-span-5 flex items-center gap-2 min-w-0 pr-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: eng.color }}
                  />
                  <span className="font-semibold text-white truncate">{eng.shortName}</span>
                  <span className="hidden sm:inline-block text-[10px] font-mono text-white/40 tabular-nums">
                    ({eng.costPer5s}cr/5s)
                  </span>
                </div>

                <div className="col-span-2 text-right font-mono tabular-nums text-white/70">
                  {eng.renders}
                </div>

                <div className="col-span-3 text-right font-mono tabular-nums font-bold text-white">
                  {eng.credits.toLocaleString()}{' '}
                  <span className="text-[10px] font-normal text-purple-400">cr</span>
                </div>

                <div className="col-span-2 text-right font-mono tabular-nums text-[11px] text-white/80">
                  {eng.percentage}%
                </div>
              </div>
            ))}
          </div>

          {/* Summary Footer Row */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 px-2.5 border-t border-white/[0.06] text-[11px] font-mono text-white/60">
            <span className="flex items-center gap-1.5">
              <Film className="w-3.5 h-3.5 text-purple-400" />
              <span>30-Day Total:</span>
              <strong className="text-white tabular-nums">{totalCredits30d.toLocaleString()} cr</strong>
              <span>across {engineStats.length} engines</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              <span>Available Wallet:</span>
              <strong className="text-cyan-300 tabular-nums">{userCredits.toLocaleString()} cr</strong>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
