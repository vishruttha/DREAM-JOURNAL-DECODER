// ==========================================
// DREAM JOURNAL EDITOR
// Distraction-free writing, moon phase, UndoStack, live decoder preview
// ==========================================

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Save,
  RotateCcw,
  Trash2,
  Sparkles,
  Calendar,
  Clock,
  Eye,
  Tag,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
} from 'lucide-react';
import { Dream, DreamDraft, EmotionType } from '../types';
import { EMOTIONS_METADATA } from '../services/symbolDictionary';
import { DreamDecoderService } from '../services/dreamDecoder';
import { storageService } from '../services/storage';
import { UndoStack } from '../dsa/UndoStack';
import { Trie } from '../dsa/Trie';
import { ConfirmDialog } from '../components/ConfirmDialog';

interface JournalEditorProps {
  initialDream?: Dream | null;
  allDreams: Dream[];
  onSaveSuccess: (savedDream: Dream) => void;
  onDeleteSuccess?: (deletedId: string) => void;
  onCancel: () => void;
}

export const JournalEditor: React.FC<JournalEditorProps> = ({
  initialDream,
  allDreams,
  onSaveSuccess,
  onDeleteSuccess,
  onCancel,
}) => {
  const isEditing = Boolean(initialDream);

  // Form State
  const [title, setTitle] = useState(initialDream?.title || '');
  const [narrative, setNarrative] = useState(initialDream?.narrative || '');
  const [dreamDate, setDreamDate] = useState(
    initialDream?.dreamDate || new Date().toISOString().split('T')[0]
  );
  const [dreamTime, setDreamTime] = useState(
    initialDream?.dreamTime || new Date().toTimeString().slice(0, 5)
  );
  const [selectedEmotions, setSelectedEmotions] = useState<EmotionType[]>(
    initialDream?.selectedEmotions || []
  );
  const [vividness, setVividness] = useState<number>(initialDream?.vividness || 7);
  const [tags, setTags] = useState<string[]>(initialDream?.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [reflection, setReflection] = useState(initialDream?.reflection || '');

  // Validation & UI states
  const [errors, setErrors] = useState<{ title?: string; narrative?: string }>({});
  const [lastSavedDraftTime, setLastSavedDraftTime] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);

  // Stack for Undo operations (DSA Integration)
  const undoStackRef = useRef<UndoStack<DreamDraft>>(new UndoStack<DreamDraft>(25));

  // Trie for Tag autocomplete suggestions
  const tagTrie = useMemo(() => {
    const trie = new Trie();
    for (const d of allDreams) {
      for (const t of d.tags || []) {
        trie.insert(t, d.id, { type: 'tag' });
      }
    }
    return trie;
  }, [allDreams]);

  // Push snapshot to undo stack
  const captureUndoState = (description: string = 'Edit') => {
    const currentDraft: DreamDraft = {
      title,
      narrative,
      dreamDate,
      dreamTime,
      selectedEmotions,
      vividness,
      tags,
      reflection,
    };
    undoStackRef.current.push(currentDraft);
    setHasUnsavedChanges(true);
  };

  // Check draft on mount if creating new
  useEffect(() => {
    if (!initialDream) {
      const savedDraft = storageService.getDraft();
      if (savedDraft && (!title && !narrative)) {
        setTitle(savedDraft.title || '');
        setNarrative(savedDraft.narrative || '');
        if (savedDraft.dreamDate) setDreamDate(savedDraft.dreamDate);
        if (savedDraft.dreamTime) setDreamTime(savedDraft.dreamTime);
        if (savedDraft.selectedEmotions) setSelectedEmotions(savedDraft.selectedEmotions);
        if (savedDraft.vividness) setVividness(savedDraft.vividness);
        if (savedDraft.tags) setTags(savedDraft.tags);
        if (savedDraft.reflection) setReflection(savedDraft.reflection);
        setLastSavedDraftTime('Restored from autosaved draft');
      }
    }
  }, [initialDream]);

  // Periodic autosave to storage draft
  useEffect(() => {
    if (!hasUnsavedChanges || isEditing) return;

    const timer = setTimeout(() => {
      storageService.saveDraft({
        title,
        narrative,
        dreamDate,
        dreamTime,
        selectedEmotions,
        vividness,
        tags,
        reflection,
      });
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setLastSavedDraftTime(`Draft autosaved at ${timeStr}`);
      setHasUnsavedChanges(false);
    }, 2500);

    return () => clearTimeout(timer);
  }, [title, narrative, dreamDate, dreamTime, selectedEmotions, vividness, tags, reflection, hasUnsavedChanges, isEditing]);

  // Undo recent changes using Stack.pop()
  const handleUndo = () => {
    if (undoStackRef.current.isEmpty()) return;

    const previousState = undoStackRef.current.pop();
    if (previousState) {
      setTitle(previousState.title);
      setNarrative(previousState.narrative);
      setDreamDate(previousState.dreamDate);
      setDreamTime(previousState.dreamTime);
      setSelectedEmotions(previousState.selectedEmotions);
      setVividness(previousState.vividness);
      setTags(previousState.tags);
      setReflection(previousState.reflection);
      setHasUnsavedChanges(true);
    }
  };

  // Live text analysis using deterministic decoder
  const liveAnalysis = useMemo(() => {
    if (!narrative.trim()) return null;
    return DreamDecoderService.analyzeDreamText(narrative, title);
  }, [narrative, title]);

  // Dynamic moon phase for selected dream date
  const moon = useMemo(() => {
    return DreamDecoderService.getMoonPhase(dreamDate);
  }, [dreamDate]);

  // Tag input handling & Trie suggestions
  const handleTagInputChange = (val: string) => {
    setTagInput(val);
    if (val.trim().length >= 1) {
      const suggestions = tagTrie.autocomplete(val, 5).map(s => s.word);
      setTagSuggestions(suggestions.filter(s => !tags.includes(s)));
    } else {
      setTagSuggestions([]);
    }
  };

  const handleAddTag = (rawTag: string) => {
    const clean = rawTag.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (clean && !tags.includes(clean)) {
      captureUndoState('Add Tag');
      setTags([...tags, clean]);
      setTagInput('');
      setTagSuggestions([]);
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    captureUndoState('Remove Tag');
    setTags(tags.filter(t => t !== tagToRemove));
  };

  // Toggle emotions
  const handleToggleEmotion = (emotion: EmotionType) => {
    captureUndoState('Toggle Emotion');
    if (selectedEmotions.includes(emotion)) {
      setSelectedEmotions(selectedEmotions.filter(e => e !== emotion));
    } else {
      setSelectedEmotions([...selectedEmotions, emotion]);
    }
  };

  // Form Validation & Save
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { title?: string; narrative?: string } = {};

    if (!title.trim()) {
      newErrors.title = 'Please provide a title for your dream.';
    }
    if (!narrative.trim() || narrative.trim().length < 15) {
      newErrors.narrative = 'Please write at least 15 characters describing your dream narrative.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Run deterministic analysis to derive symbols, keywords, emotions
    const analysis = DreamDecoderService.analyzeDreamText(narrative, title);
    const now = Date.now();

    const dreamRecord: Dream = {
      id: initialDream?.id || `dream-${now}-${Math.random().toString(36).substring(2, 7)}`,
      title: title.trim(),
      narrative: narrative.trim(),
      dreamDate,
      dreamTime,
      selectedEmotions,
      inferredEmotions: analysis.inferredEmotions,
      vividness,
      tags,
      reflection: reflection.trim() || undefined,
      createdAt: initialDream?.createdAt || now,
      updatedAt: now,
      isSample: false,
      derivedKeywords: analysis.topKeywords.map(k => k.word),
      derivedSymbols: analysis.detectedSymbols,
      wordCount: analysis.wordCount,
      charCount: analysis.charCount,
    };

    await storageService.saveDream(dreamRecord);
    storageService.clearDraft();
    onSaveSuccess(dreamRecord);
  };

  const handleDelete = async () => {
    if (initialDream?.id && onDeleteSuccess) {
      await storageService.deleteDream(initialDream.id);
      onDeleteSuccess(initialDream.id);
    }
  };

  const vividnessLabels: Record<number, string> = {
    1: '1 - Faint Whisper (Almost forgotten)',
    2: '2 - Distant Fog (Vague silhouettes)',
    3: '3 - Soft Murmur (Scattered fragments)',
    4: '4 - Gentle Haze (General outline intact)',
    5: '5 - Moderate Memory (Distinct sequence)',
    6: '6 - Clear Vision (Specific faces and colors)',
    7: '7 - Bright & Sensory (Rich sounds and textures)',
    8: '8 - Highly Lucid (Aware of dreaming state)',
    9: '9 - Hyper-Vivid (Intensely palpable and crisp)',
    10: '10 - Transcendental (Indistinguishable from reality)',
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-200 pb-12">
      {/* Header with Moon & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-violet-500/20">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">{moon.icon}</span>
            <h1 className="text-2xl md:text-3xl font-serif font-bold text-slate-100 tracking-wide">
              {isEditing ? 'Refine Dream Narrative' : 'Record a Dream'}
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Capture every sensory thread before morning daylight scatters the memory
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Undo Button (backed by UndoStack) */}
          <button
            type="button"
            onClick={handleUndo}
            disabled={undoStackRef.current.isEmpty()}
            title={`Undo edit (${undoStackRef.current.size} available in stack)`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-slate-900/60 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300 border border-slate-700/60 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5 text-violet-400" />
            <span>Undo ({undoStackRef.current.size})</span>
          </button>

          {isEditing && (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="p-2 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 border border-rose-500/20 transition-colors"
              title="Delete Dream"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            onClick={onCancel}
            className="px-3.5 py-1.5 rounded-lg text-xs text-slate-300 hover:bg-slate-800 border border-slate-700 transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold celestial-button-primary shadow-md shadow-violet-600/30"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isEditing ? 'Update Entry' : 'Save Dream'}</span>
          </button>
        </div>
      </div>

      {/* Main Form Card */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Title Input */}
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider">
            Dream Title *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => {
              captureUndoState('Edit Title');
              setTitle(e.target.value);
              if (errors.title) setErrors({ ...errors, title: undefined });
            }}
            placeholder="e.g. The Submerged Cathedral of Reverse Clocks"
            className={`w-full px-4 py-3 rounded-xl bg-celestial-900/80 border text-slate-100 placeholder-slate-500 font-serif text-lg tracking-wide focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all ${
              errors.title ? 'border-rose-500/80' : 'border-violet-500/25 focus:border-violet-400'
            }`}
          />
          {errors.title && (
            <p className="text-xs text-rose-400 flex items-center gap-1 mt-1">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{errors.title}</span>
            </p>
          )}
        </div>

        {/* Date, Time & Moon Phase Metadata Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Dream Date */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-violet-400" />
              <span>Dream Date</span>
            </label>
            <input
              type="date"
              value={dreamDate}
              onChange={(e) => {
                captureUndoState('Change Date');
                setDreamDate(e.target.value);
              }}
              className="w-full px-3.5 py-2 rounded-xl bg-celestial-900/80 border border-violet-500/25 text-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500/40"
            />
          </div>

          {/* Dream Time */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>Awakening Time (Optional)</span>
            </label>
            <input
              type="time"
              value={dreamTime}
              onChange={(e) => {
                captureUndoState('Change Time');
                setDreamTime(e.target.value);
              }}
              className="w-full px-3.5 py-2 rounded-xl bg-celestial-900/80 border border-violet-500/25 text-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500/40"
            />
          </div>

          {/* Computed Moon Phase Indicator */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
              <span>Lunar Transit</span>
            </label>
            <div className="px-3.5 py-2 rounded-xl bg-celestial-900/80 border border-violet-500/25 text-xs text-slate-300 flex items-center justify-between font-mono">
              <span className="flex items-center gap-1.5">
                <span>{moon.icon}</span>
                <span>{moon.phase}</span>
              </span>
              <span className="text-[11px] text-violet-400">{moon.illumination}%</span>
            </div>
          </div>
        </div>

        {/* Narrative Textarea with Live Counters */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <label className="font-medium text-slate-300 uppercase tracking-wider">
              Dream Narrative *
            </label>
            <div className="flex items-center gap-3 font-mono text-[11px]">
              <span>{narrative.split(/\s+/).filter(Boolean).length} words</span>
              <span>{narrative.length} characters</span>
              {lastSavedDraftTime && (
                <span className="text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>{lastSavedDraftTime}</span>
                </span>
              )}
            </div>
          </div>

          <textarea
            rows={8}
            value={narrative}
            onChange={(e) => {
              captureUndoState('Edit Narrative');
              setNarrative(e.target.value);
              if (errors.narrative) setErrors({ ...errors, narrative: undefined });
            }}
            placeholder="Describe the setting, sequence of events, tactile sensations, transitions, and characters. Did gravity behave normally? Were there bodies of water, flying, or ticking clocks?..."
            className={`w-full p-4 rounded-xl bg-celestial-900/80 border text-slate-100 placeholder-slate-500 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all ${
              errors.narrative ? 'border-rose-500/80' : 'border-violet-500/25 focus:border-violet-400'
            }`}
          />
          {errors.narrative && (
            <p className="text-xs text-rose-400 flex items-center gap-1 mt-1">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{errors.narrative}</span>
            </p>
          )}
        </div>

        {/* Vividness Rating Slider */}
        <div className="celestial-card p-4 border border-violet-500/20 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-slate-200 flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-purple-400" />
              <span>Dream Vividness & Lucidity</span>
            </label>
            <span className="text-xs font-mono font-semibold text-purple-300 bg-purple-950/60 px-2.5 py-0.5 rounded-full border border-purple-500/30">
              Level {vividness} / 10
            </span>
          </div>

          <input
            type="range"
            min={1}
            max={10}
            step={1}
            value={vividness}
            onChange={(e) => {
              captureUndoState('Change Vividness');
              setVividness(Number(e.target.value));
            }}
            className="w-full accent-purple-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
          />

          <p className="text-xs text-slate-400 italic">
            {vividnessLabels[vividness]}
          </p>
        </div>

        {/* Emotion Taxonomy Selection */}
        <div className="space-y-2">
          <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider">
            Primary Emotions Experienced
          </label>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(EMOTIONS_METADATA) as EmotionType[]).map((emotionKey) => {
              const meta = EMOTIONS_METADATA[emotionKey];
              const isSelected = selectedEmotions.includes(emotionKey);

              return (
                <button
                  key={emotionKey}
                  type="button"
                  onClick={() => handleToggleEmotion(emotionKey)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? 'border shadow-md'
                      : 'bg-slate-900/60 text-slate-400 border border-slate-800 hover:border-slate-700'
                  }`}
                  style={
                    isSelected
                      ? {
                          backgroundColor: meta.badgeBg,
                          borderColor: meta.badgeBorder,
                          color: meta.badgeText,
                          boxShadow: `0 0 12px ${meta.glowColor}`,
                        }
                      : {}
                  }
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: meta.color }}
                  />
                  <span>{meta.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tags with Trie Autocomplete Suggestions */}
        <div className="space-y-2">
          <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-cyan-400" />
            <span>Tags & Keywords (Trie-Indexed)</span>
          </label>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => handleTagInputChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddTag(tagInput);
                }
              }}
              placeholder="Type tag and press Enter (e.g. lucid, ocean, childhood)"
              className="flex-1 px-3.5 py-2 rounded-xl bg-celestial-900/80 border border-violet-500/25 text-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500/40"
            />
            <button
              type="button"
              onClick={() => handleAddTag(tagInput)}
              disabled={!tagInput.trim()}
              className="px-3.5 py-2 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors disabled:opacity-40"
            >
              Add Tag
            </button>
          </div>

          {/* Autocomplete Suggestions from Trie */}
          {tagSuggestions.length > 0 && (
            <div className="flex items-center gap-1.5 pt-1 text-xs">
              <span className="text-[11px] text-slate-400 font-mono">Trie Suggestions:</span>
              {tagSuggestions.map((sug) => (
                <button
                  key={sug}
                  type="button"
                  onClick={() => handleAddTag(sug)}
                  className="px-2 py-0.5 rounded-md bg-violet-950/60 hover:bg-violet-900 text-violet-300 border border-violet-500/30 text-[11px]"
                >
                  +{sug}
                </button>
              ))}
            </div>
          )}

          {/* Current Tag Pills */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs bg-slate-900 text-slate-200 border border-slate-700/80"
                >
                  <span>#{tag}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-rose-400 ml-0.5 text-slate-400"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Optional Reflection */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
            <span>Personal Reflection & Context (Optional)</span>
          </label>
          <textarea
            rows={3}
            value={reflection}
            onChange={(e) => {
              captureUndoState('Edit Reflection');
              setReflection(e.target.value);
            }}
            placeholder="What waking circumstances or thoughts might connect with this dream? What lingered when you woke up?"
            className="w-full p-3.5 rounded-xl bg-celestial-900/80 border border-violet-500/25 text-slate-200 placeholder-slate-500 text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-violet-500/40"
          />
        </div>
      </form>

      {/* Live Decoder Preview Section */}
      {liveAnalysis && liveAnalysis.detectedSymbols.length > 0 && (
        <div className="celestial-card p-6 border border-violet-500/30 space-y-4 bg-violet-950/20">
          <div className="flex items-center justify-between pb-3 border-b border-violet-500/20">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-violet-400 animate-pulse" />
              <h3 className="text-base font-serif font-semibold text-slate-100">
                Live Dream Decoder Preview
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              {liveAnalysis.detectedSymbols.length} motifs detected deterministically
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {liveAnalysis.detectedSymbols.map((sym) => (
              <div
                key={sym.symbolId}
                className="p-3.5 rounded-xl bg-celestial-900/80 border border-violet-500/20 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-violet-300">
                    {sym.name}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-600/20 text-violet-300 border border-violet-500/30 font-mono">
                    {sym.occurrences} {sym.occurrences === 1 ? 'match' : 'matches'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {sym.reflectiveMeaning}
                </p>
                <div className="p-2 rounded-lg bg-violet-950/50 border border-violet-500/15 text-[11px] text-amber-200/90 italic">
                  "{sym.inquiryQuestion}"
                </div>
              </div>
            ))}
          </div>

          <p className="text-[10px] text-slate-400 italic text-center pt-2">
            Interpretations are reflective prompts to foster introspection, not prophecies or clinical diagnostics.
          </p>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete Dream Entry?"
        message={`Are you sure you want to delete "${title || 'this dream'}"? This will also remove its corresponding vertex and edges from your constellation graph.`}
        confirmLabel="Yes, Delete Dream"
        isDestructive={true}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
};
