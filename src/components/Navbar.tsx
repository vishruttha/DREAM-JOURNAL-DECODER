// ==========================================
// CELESTIAL NAVBAR COMPONENT
// Persistent navigation, quick stats, and data management
// ==========================================

import React, { useState } from 'react';
import {
  Moon,
  PlusCircle,
  LayoutDashboard,
  BookOpen,
  Orbit,
  Sparkles,
  PieChart,
  Binary,
  GraduationCap,
  Download,
  Upload,
  RefreshCw,
  Trash2,
  Menu,
  X,
} from 'lucide-react';
import { Dream } from '../types';

export type ActiveTab = 
  | 'dashboard' 
  | 'editor' 
  | 'library' 
  | 'symbols' 
  | 'emotions' 
  | 'constellation' 
  | 'dsa-lab' 
  | 'dossier';

interface NavbarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  dreams: Dream[];
  onNewDream: () => void;
  onExport: () => void;
  onImportClick: () => void;
  onResetSample: () => void;
  onClearAll: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  dreams,
  onNewDream,
  onExport,
  onImportClick,
  onResetSample,
  onClearAll,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dataMenuOpen, setDataMenuOpen] = useState(false);

  const sampleCount = dreams.filter(d => d.isSample).length;

  const navItems: Array<{ id: ActiveTab; label: string; icon: React.ReactNode; badge?: string }> = [
    { id: 'dashboard', label: 'Universe', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'editor', label: 'Record', icon: <PlusCircle className="w-4 h-4" /> },
    { id: 'library', label: 'Library', icon: <BookOpen className="w-4 h-4" />, badge: dreams.length > 0 ? String(dreams.length) : undefined },
    { id: 'symbols', label: 'Symbols', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'emotions', label: 'Emotions', icon: <PieChart className="w-4 h-4" /> },
    { id: 'constellation', label: 'Constellation', icon: <Orbit className="w-4 h-4" /> },
    { id: 'dsa-lab', label: 'DSA Lab', icon: <Binary className="w-4 h-4" />, badge: '6 DS' },
    { id: 'dossier', label: 'Viva & Report', icon: <GraduationCap className="w-4 h-4" /> },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-celestial-950/80 backdrop-blur-xl border-b border-violet-500/20 shadow-lg shadow-black/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div 
            onClick={() => onTabChange('dashboard')}
            className="flex items-center gap-3 cursor-pointer group shrink-0"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-700 via-purple-600 to-indigo-500 flex items-center justify-center shadow-md shadow-violet-700/30 border border-violet-400/30 group-hover:scale-105 transition-transform">
              <Moon className="w-5 h-5 text-amber-200 fill-amber-300/30" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-serif text-lg font-bold tracking-wider text-slate-100 group-hover:text-violet-300 transition-colors">
                  Dream Journal
                </span>
                <span className="text-xs px-1.5 py-0.5 rounded bg-violet-600/30 border border-violet-500/40 text-violet-300 font-mono">
                  DECODER
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono tracking-tight -mt-0.5 hidden sm:block">
                Celestial Observatory & DSA Engine
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden xl:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-violet-600/25 text-violet-200 border border-violet-500/40 shadow-sm shadow-violet-500/20'
                      : 'text-slate-300 hover:text-slate-100 hover:bg-slate-800/50 border border-transparent'
                  }`}
                >
                  <span className={isActive ? 'text-violet-300' : 'text-slate-400'}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] bg-violet-950/80 text-violet-300 border border-violet-500/30">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Desktop Action Buttons */}
          <div className="hidden sm:flex items-center gap-2.5">
            {/* Primary Action Button */}
            <button
              onClick={onNewDream}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md shadow-violet-600/30 border border-violet-400/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Record Dream</span>
            </button>

            {/* Data Management Dropdown */}
            <div className="relative">
              <button
                onClick={() => setDataMenuOpen(!dataMenuOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900/60 hover:bg-slate-800 text-slate-300 hover:text-slate-100 text-xs border border-slate-700/60 transition-colors"
                title="Data & Storage Actions"
              >
                <RefreshCw className="w-3.5 h-3.5 text-violet-400" />
                <span className="hidden lg:inline text-[11px]">Data</span>
              </button>

              {dataMenuOpen && (
                <div 
                  className="absolute right-0 mt-2 w-56 celestial-card border border-violet-500/30 p-2 shadow-2xl z-50 text-xs animate-in fade-in zoom-in-95"
                  onClick={() => setDataMenuOpen(false)}
                >
                  <div className="px-2 py-1.5 text-[10px] text-slate-400 uppercase tracking-wider font-mono border-b border-violet-500/20 mb-1">
                    Database Controls
                  </div>

                  <button
                    onClick={onExport}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-md hover:bg-violet-950/60 text-slate-200 transition-colors text-left"
                  >
                    <Download className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Export Journal (JSON)</span>
                  </button>

                  <button
                    onClick={onImportClick}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-md hover:bg-violet-950/60 text-slate-200 transition-colors text-left"
                  >
                    <Upload className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Import Journal (JSON)</span>
                  </button>

                  <div className="border-t border-violet-500/20 my-1" />

                  <button
                    onClick={onResetSample}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-md hover:bg-violet-950/60 text-amber-300 transition-colors text-left"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Load 10 Sample Dreams</span>
                  </button>

                  {sampleCount > 0 && (
                    <button
                      onClick={onClearAll}
                      className="w-full flex items-center gap-2 px-2.5 py-2 rounded-md hover:bg-rose-950/60 text-rose-300 transition-colors text-left"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                      <span>Clear All Journal Data</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex xl:hidden items-center gap-2">
            <button
              onClick={onNewDream}
              className="sm:hidden p-2 rounded-lg bg-violet-600 text-white"
            >
              <PlusCircle className="w-4 h-4" />
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-300 hover:text-white bg-slate-900/60 border border-slate-700/60"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="xl:hidden bg-celestial-900/95 border-b border-violet-500/20 px-4 pt-2 pb-4 space-y-1 backdrop-blur-xl">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onTabChange(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium ${
                  isActive
                    ? 'bg-violet-600/30 text-violet-200 border border-violet-500/40'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className={isActive ? 'text-violet-300' : 'text-slate-400'}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="px-2 py-0.5 rounded-full text-xs bg-violet-950 text-violet-300 border border-violet-500/30">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          <div className="pt-3 border-t border-violet-500/20 flex gap-2">
            <button
              onClick={() => {
                onExport();
                setMobileMenuOpen(false);
              }}
              className="flex-1 py-1.5 px-3 rounded-lg bg-slate-800 text-xs text-slate-200 border border-slate-700 flex items-center justify-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>
            <button
              onClick={() => {
                onImportClick();
                setMobileMenuOpen(false);
              }}
              className="flex-1 py-1.5 px-3 rounded-lg bg-slate-800 text-xs text-slate-200 border border-slate-700 flex items-center justify-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Import</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
