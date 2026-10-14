// ==========================================
// FIRST-RUN EXPERIENCE MODAL
// Choice between exploring sample dreams or starting blank
// ==========================================

import React from 'react';
import { Sparkles, Compass, Feather } from 'lucide-react';

interface FirstRunModalProps {
  isOpen: boolean;
  onSelectSample: () => void;
  onSelectBlank: () => void;
}

export const FirstRunModal: React.FC<FirstRunModalProps> = ({
  isOpen,
  onSelectSample,
  onSelectBlank,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-xl celestial-card border border-violet-500/30 p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-300">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 shadow-lg shadow-violet-500/30 mb-4 border border-violet-400/30">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-3xl font-serif text-slate-100 font-bold tracking-wide">
            Welcome to Dream Journal Decoder
          </h2>
          <p className="text-slate-300 text-sm mt-2 max-w-md mx-auto leading-relaxed">
            A celestial sanctuary and computer science observatory exploring subconscious symbols, emotional currents, and practical data structures.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Option 1: Sample Journal */}
          <button
            type="button"
            onClick={onSelectSample}
            className="group text-left p-5 rounded-xl bg-violet-950/40 hover:bg-violet-900/40 border border-violet-500/30 hover:border-violet-400/60 transition-all shadow-md hover:shadow-violet-900/30 flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-lg bg-violet-600/20 text-violet-300 border border-violet-500/30 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Compass className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-slate-100 mb-1 group-hover:text-violet-300 transition-colors">
                Explore Sample Universe
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Loads 10 rich, fictional dreams featuring interlocking water, flight, clock, and forest symbols to immediately explore the Constellation Graph, analytics, and Trie searches.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-violet-500/20 flex items-center justify-between text-xs text-violet-400 font-medium">
              <span>(Recommended)</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </button>

          {/* Option 2: Blank Slate */}
          <button
            type="button"
            onClick={onSelectBlank}
            className="group text-left p-5 rounded-xl bg-slate-900/50 hover:bg-slate-800/60 border border-slate-700/50 hover:border-slate-500/60 transition-all shadow-md flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Feather className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-slate-100 mb-1 group-hover:text-slate-200 transition-colors">
                Start with Empty Journal
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Begin with a pristine clean slate. You will record your own dreams from scratch and watch your personal constellation emerge over time.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 font-medium">
              <span>Blank Slate</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </button>
        </div>

        <p className="text-center text-xs text-slate-400 italic">
          You can add or remove sample data anytime from the navigation bar.
        </p>
      </div>
    </div>
  );
};
