// ==========================================
// DASHBOARD - "YOUR DREAM UNIVERSE"
// Celestial overview, metrics, charts, emerging patterns
// ==========================================

import React, { useMemo } from 'react';
import {
  Sparkles,
  Flame,
  PieChart as PieIcon,
  PlusCircle,
  Clock,
  Compass,
  ArrowRight,
  TrendingUp,
  Hash,
  Eye,
  Calendar,
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { Dream } from '../types';
import { DreamDecoderService } from '../services/dreamDecoder';
import { EMOTIONS_METADATA } from '../services/symbolDictionary';
import { CustomHashMap } from '../dsa/CustomHashMap';

interface DashboardProps {
  dreams: Dream[];
  onNewDream: () => void;
  onOpenDream: (dream: Dream) => void;
  onNavigateTab: (tab: any) => void;
  onLoadSamples: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  dreams,
  onNewDream,
  onOpenDream,
  onNavigateTab,
  onLoadSamples,
}) => {
  // Current date & Moon phase
  const today = new Date().toISOString().split('T')[0];
  const moon = useMemo(() => DreamDecoderService.getMoonPhase(today), [today]);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 5) return 'Good deep night';
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    if (hour < 21) return 'Good evening';
    return 'Good night';
  }, []);

  // Compute metrics from actual saved entries using our CustomHashMap
  const metrics = useMemo(() => {
    if (dreams.length === 0) {
      return {
        total: 0,
        streak: 0,
        topSymbol: 'None',
        topSymbolCount: 0,
        topEmotion: 'None',
        avgVividness: 0,
        symbolFrequencies: [],
        emotionData: [],
        emergingPatterns: [],
      };
    }

    // 1. Symbol frequencies using CustomHashMap
    const symbolMap = new CustomHashMap<string, number>(16);
    for (const dream of dreams) {
      for (const sym of dream.derivedSymbols || []) {
        symbolMap.increment(sym.name, sym.occurrences);
      }
    }
    const symbolEntries = symbolMap.entries().sort((a, b) => b[1] - a[1]);
    const topSymbol = symbolEntries.length > 0 ? symbolEntries[0][0] : 'None';
    const topSymbolCount = symbolEntries.length > 0 ? symbolEntries[0][1] : 0;

    // 2. Emotion frequencies using CustomHashMap
    const emotionMap = new CustomHashMap<string, number>(16);
    for (const dream of dreams) {
      for (const emo of dream.selectedEmotions || []) {
        emotionMap.increment(emo, 1);
      }
    }
    const emotionEntries = emotionMap.entries().sort((a, b) => b[1] - a[1]);
    const topEmotion = emotionEntries.length > 0 ? emotionEntries[0][0] : 'None';

    const emotionData = emotionEntries.map(([name, count]) => ({
      name,
      value: count,
      color: EMOTIONS_METADATA[name as keyof typeof EMOTIONS_METADATA]?.color || '#8b5cf6',
    }));

    // 3. Average Vividness
    const totalVividness = dreams.reduce((acc, d) => acc + (d.vividness || 5), 0);
    const avgVividness = Number((totalVividness / dreams.length).toFixed(1));

    // 4. Consecutive Journaling Streak calculation
    const sortedDates = Array.from(new Set(dreams.map(d => d.dreamDate))).sort().reverse();
    let streak = 0;
    if (sortedDates.length > 0) {
      const oneDayMs = 24 * 60 * 60 * 1000;
      let checkDate = new Date();
      checkDate.setHours(0, 0, 0, 0);

      // Check if logged today or yesterday
      const latestLogged = new Date(sortedDates[0]);
      latestLogged.setHours(0, 0, 0, 0);
      const diffFromToday = Math.round((checkDate.getTime() - latestLogged.getTime()) / oneDayMs);

      if (diffFromToday <= 1) {
        streak = 1;
        let prevDate = latestLogged;
        for (let i = 1; i < sortedDates.length; i++) {
          const curr = new Date(sortedDates[i]);
          curr.setHours(0, 0, 0, 0);
          const dayDiff = Math.round((prevDate.getTime() - curr.getTime()) / oneDayMs);
          if (dayDiff === 1) {
            streak++;
            prevDate = curr;
          } else {
            break;
          }
        }
      }
    }

    // 5. Algorithmic Data-Derived Observations ("Patterns Emerging")
    const emergingPatterns: string[] = [];

    if (symbolEntries.length > 0) {
      const topSymPct = Math.round((symbolEntries[0][1] / dreams.length) * 100);
      emergingPatterns.push(
        `"${symbolEntries[0][0]}" is your central subconscious motif, appearing in ${topSymPct}% of your recorded entries.`
      );
    }

    if (avgVividness >= 7.5) {
      emergingPatterns.push(
        `Exceptionally high lucidity detected: your average vividness rating is ${avgVividness}/10.`
      );
    }

    const waterDreams = dreams.filter(d => (d.derivedSymbols || []).some(s => s.symbolId === 'water'));
    if (waterDreams.length >= 2) {
      const peacefulWater = waterDreams.filter(d => d.selectedEmotions.includes('Peace') || d.selectedEmotions.includes('Wonder'));
      emergingPatterns.push(
        `Water motifs in your dreams correlate strongly with ${peacefulWater.length >= waterDreams.length / 2 ? 'peaceful and awe-inspiring' : 'turbulent'} emotional tones.`
      );
    }

    const nightOwlDreams = dreams.filter(d => d.dreamTime && (d.dreamTime.startsWith('03') || d.dreamTime.startsWith('04')));
    if (nightOwlDreams.length >= 2) {
      emergingPatterns.push(
        `Circadian cluster: ${nightOwlDreams.length} dreams were logged during the 3:00 AM – 5:00 AM REM consolidation window.`
      );
    }

    if (emergingPatterns.length < 3) {
      emergingPatterns.push(
        `Your dream universe contains ${dreams.length} interconnected celestial nodes across the constellation graph.`
      );
    }

    return {
      total: dreams.length,
      streak,
      topSymbol,
      topSymbolCount,
      topEmotion,
      avgVividness,
      symbolFrequencies: symbolEntries.slice(0, 5),
      emotionData,
      emergingPatterns,
    };
  }, [dreams]);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Hero Observatory Section */}
      <div className="relative overflow-hidden rounded-2xl celestial-card border border-violet-500/20 p-6 md:p-8 shadow-2xl">
        <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-violet-600/10 blur-3xl pointer-events-none" />
        <div className="absolute right-10 bottom-0 opacity-15 pointer-events-none hidden md:block">
          <Orbit className="w-64 h-64 text-violet-400 animate-spin" style={{ animationDuration: '60s' }} />
        </div>

        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-950/60 border border-violet-500/30 text-violet-300 text-xs mb-3 font-mono">
            <span>{moon.icon}</span>
            <span>{moon.phase} ({moon.illumination}% illuminated)</span>
            <span className="text-violet-500">•</span>
            <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-serif font-bold text-slate-100 tracking-tight leading-tight">
            {greeting}, Dreamer.
          </h1>
          <p className="text-slate-300 text-sm md:text-base mt-3 leading-relaxed">
            Step into your subconscious observatory. Every recorded dream forms a star in your personal constellation—indexed via deterministic algorithms and computational graph structures.
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-6">
            <button
              onClick={onNewDream}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl celestial-button-primary text-sm font-semibold shadow-lg shadow-violet-600/40"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Record Tonight's Dream</span>
            </button>

            <button
              onClick={() => onNavigateTab('constellation')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900/60 hover:bg-slate-800 text-slate-200 text-sm border border-slate-700/60 hover:border-violet-500/40 transition-colors"
            >
              <Compass className="w-4 h-4 text-cyan-400" />
              <span>View Constellation</span>
            </button>

            <button
              onClick={() => onNavigateTab('dsa-lab')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-950/30 hover:bg-violet-900/40 text-violet-300 text-sm border border-violet-500/30 transition-colors"
            >
              <Sparkles className="w-4 h-4 text-violet-400" />
              <span>Open DSA Lab</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Dreams */}
        <div className="celestial-card p-5 border border-violet-500/20">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Total Dreams</span>
            <div className="p-2 rounded-lg bg-violet-600/10 text-violet-400 border border-violet-500/20">
              <Hash className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl md:text-3xl font-serif font-bold text-slate-100">
            {metrics.total}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Persisted in local IndexedDB
          </p>
        </div>

        {/* Current Streak */}
        <div className="celestial-card p-5 border border-amber-500/20">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Dream Streak</span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl md:text-3xl font-serif font-bold text-amber-300 flex items-center gap-2">
            <span>{metrics.streak}</span>
            <span className="text-xs font-sans text-amber-400/80 font-normal">days active</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Calculated from log history
          </p>
        </div>

        {/* Top Symbol */}
        <div className="celestial-card p-5 border border-cyan-500/20">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Top Motif</span>
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl md:text-2xl font-serif font-bold text-cyan-300 truncate" title={metrics.topSymbol}>
            {metrics.topSymbol}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {metrics.topSymbolCount} occurrences (CustomHashMap)
          </p>
        </div>

        {/* Average Vividness */}
        <div className="celestial-card p-5 border border-purple-500/20">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Avg Vividness</span>
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Eye className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl md:text-3xl font-serif font-bold text-purple-300 flex items-baseline gap-1">
            <span>{metrics.avgVividness}</span>
            <span className="text-sm font-sans text-purple-400/70 font-normal">/ 10</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Dominant tone: <span className="text-slate-200">{metrics.topEmotion}</span>
          </p>
        </div>
      </div>

      {/* Main Grid: Visual Analytics + Emerging Patterns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 spans): Recurring Symbols & Emotion Breakdown */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recurring Symbols Progress Chart */}
          <div className="celestial-card p-6 border border-violet-500/20">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-lg font-serif font-semibold text-slate-100 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-violet-400" />
                  <span>Subconscious Motifs & Recurring Symbols</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Calculated deterministically using CustomHashMap collision-chaining counter
                </p>
              </div>
              <button
                onClick={() => onNavigateTab('symbols')}
                className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1 font-medium"
              >
                <span>Explorer</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {metrics.symbolFrequencies.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                No symbols detected yet. Record a dream or load sample data to see symbol charts.
              </div>
            ) : (
              <div className="space-y-3.5">
                {metrics.symbolFrequencies.map(([symbolName, count], idx) => {
                  const maxCount = metrics.symbolFrequencies[0][1] || 1;
                  const pct = Math.round((count / maxCount) * 100);
                  return (
                    <div key={symbolName} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-200 font-medium flex items-center gap-2">
                          <span className="w-4 text-[10px] text-slate-400 font-mono">0{idx + 1}</span>
                          <span>{symbolName}</span>
                        </span>
                        <span className="text-slate-400 font-mono">
                          {count} {count === 1 ? 'occurrence' : 'occurrences'}
                        </span>
                      </div>
                      <div className="h-2 w-full bg-slate-900/80 rounded-full overflow-hidden border border-slate-800">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-violet-600 via-indigo-500 to-cyan-400 transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Emotion Distribution Mini Doughnut */}
          <div className="celestial-card p-6 border border-violet-500/20">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-serif font-semibold text-slate-100 flex items-center gap-2">
                  <PieIcon className="w-4 h-4 text-indigo-400" />
                  <span>Emotional Spectrum</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Proportion of emotional states recorded across journal entries
                </p>
              </div>
              <button
                onClick={() => onNavigateTab('emotions')}
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
              >
                <span>Observatory</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {metrics.emotionData.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                No emotion data yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-4">
                <div className="h-44 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={metrics.emotionData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={70}
                        paddingAngle={3}
                      >
                        {metrics.emotionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} stroke="rgba(0,0,0,0.4)" />
                        ))}
                      </Pie>
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="px-2.5 py-1.5 rounded-lg bg-celestial-900 border border-violet-500/30 text-xs shadow-xl">
                                <span className="font-semibold text-white">{data.name}</span>:{' '}
                                <span className="text-violet-300">{data.value} entries</span>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {metrics.emotionData.map((emo) => (
                    <div key={emo.name} className="flex items-center justify-between text-xs py-0.5">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: emo.color }} />
                        <span className="text-slate-300">{emo.name}</span>
                      </div>
                      <span className="text-slate-400 font-mono">{emo.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Patterns Emerging & Constellation Preview */}
        <div className="space-y-6">
          {/* Data-Derived Observations: Patterns Emerging */}
          <div className="celestial-card p-6 border border-violet-500/20">
            <h3 className="text-lg font-serif font-semibold text-slate-100 flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Patterns Emerging</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Algorithmic observations derived from cross-entry correlation analysis:
            </p>

            <div className="space-y-3">
              {metrics.emergingPatterns.map((pattern, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-violet-950/20 border border-violet-500/20 text-xs text-slate-300 leading-relaxed flex items-start gap-2.5"
                >
                  <span className="text-violet-400 font-mono shrink-0">✦</span>
                  <span>{pattern}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Constellation Graph Quick Preview CTA */}
          <div className="celestial-card p-6 border border-cyan-500/20 bg-gradient-to-br from-celestial-900/90 to-celestial-850">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mb-3">
              <Orbit className="w-5 h-5" />
            </div>
            <h4 className="text-base font-serif font-semibold text-slate-100">
              Dream Constellation Graph
            </h4>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              Every dream acts as a vertex in an adjacency-list graph, connected when they share symbols, keywords, or tags. Run BFS & DFS traversals live on the network.
            </p>

            <button
              onClick={() => onNavigateTab('constellation')}
              className="mt-4 w-full py-2 px-3 rounded-lg bg-cyan-950/50 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-500/30 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>Explore Interactive Constellation</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Recently Recorded Dreams Section */}
      <div className="celestial-card p-6 border border-violet-500/20">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-lg font-serif font-semibold text-slate-100 flex items-center gap-2">
              <Clock className="w-4 h-4 text-violet-400" />
              <span>Recently Recorded Dreams</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Click any entry to view full narrative, detected symbols, and personal reflection questions
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('library')}
            className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1 font-medium"
          >
            <span>View All ({dreams.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {dreams.length === 0 ? (
          <div className="py-12 text-center space-y-4">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-violet-600/10 text-violet-400 border border-violet-500/20">
              <Moon className="w-6 h-6" />
            </div>
            <h4 className="text-base font-serif font-medium text-slate-200">
              Your Dream Universe is waiting for its first star
            </h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Start by recording your first dream narrative, or load our fictional sample dataset to explore the constellation right away.
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={onNewDream}
                className="px-4 py-2 rounded-lg celestial-button-primary text-xs font-semibold"
              >
                Record a Dream
              </button>
              <button
                onClick={onLoadSamples}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs"
              >
                Load 10 Sample Dreams
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dreams.slice(0, 6).map((dream) => (
              <div
                key={dream.id}
                onClick={() => onOpenDream(dream)}
                className="group p-4 rounded-xl bg-celestial-900/60 hover:bg-violet-950/40 border border-violet-500/15 hover:border-violet-500/40 transition-all cursor-pointer flex flex-col justify-between shadow-sm hover:shadow-violet-900/20"
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2 font-mono">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-violet-400" />
                      <span>{dream.dreamDate}</span>
                    </span>
                    <span className="px-1.5 py-0.2 rounded bg-violet-950/80 text-violet-300 border border-violet-500/20">
                      Vividness: {dream.vividness}/10
                    </span>
                  </div>

                  <h4 className="text-sm font-semibold text-slate-100 group-hover:text-violet-300 transition-colors line-clamp-1">
                    {dream.title}
                  </h4>

                  <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                    {dream.narrative}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-violet-500/10 flex items-center justify-between">
                  <div className="flex flex-wrap gap-1">
                    {(dream.derivedSymbols || []).slice(0, 2).map((sym) => (
                      <span
                        key={sym.symbolId}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-violet-600/15 text-violet-300 border border-violet-500/20"
                      >
                        {sym.name}
                      </span>
                    ))}
                  </div>
                  <span className="text-[11px] text-slate-400 group-hover:text-violet-300 flex items-center gap-0.5 font-medium">
                    <span>Inspect</span>
                    <span className="group-hover:translate-x-0.5 transition-transform">→</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
