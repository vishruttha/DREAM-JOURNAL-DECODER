// ==========================================
// DREAM JOURNAL DECODER - TYPE DEFINITIONS
// ==========================================

export type EmotionType = 
  | 'Wonder' 
  | 'Anxiety' 
  | 'Joy' 
  | 'Melancholy' 
  | 'Confusion' 
  | 'Fear' 
  | 'Peace' 
  | 'Euphoria' 
  | 'Nostalgia' 
  | 'Frustration' 
  | 'Liberation';

export interface EmotionMeta {
  name: EmotionType;
  color: string; // Tailwind color or hex
  glowColor: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  description: string;
}

export interface DreamSymbolDefinition {
  id: string;
  name: string;
  category: 'Nature' | 'Architecture' | 'Movement' | 'Objects' | 'Archetypes' | 'Abstract';
  keywords: string[];
  reflectiveMeaning: string; // Personal association, not scientific/fortune-telling
  inquiryQuestion: string; // Socratic question for personal context
  colorHue: number; // for visual styling
}

export interface DetectedSymbolMatch {
  symbolId: string;
  name: string;
  category: string;
  occurrences: number;
  matchedKeywords: string[];
  reflectiveMeaning: string;
  inquiryQuestion: string;
}

export interface Dream {
  id: string;
  title: string;
  narrative: string;
  dreamDate: string; // YYYY-MM-DD
  dreamTime?: string; // HH:MM
  selectedEmotions: EmotionType[];
  inferredEmotions?: EmotionType[]; // Derived from keyword matching
  vividness: number; // 1 to 10
  tags: string[];
  reflection?: string;
  createdAt: number; // timestamp
  updatedAt: number; // timestamp
  isSample?: boolean;
  derivedKeywords: string[];
  derivedSymbols: DetectedSymbolMatch[];
  wordCount: number;
  charCount: number;
}

export interface DreamDraft {
  title: string;
  narrative: string;
  dreamDate: string;
  dreamTime: string;
  selectedEmotions: EmotionType[];
  vividness: number;
  tags: string[];
  reflection: string;
}

// Graph Representation Types
export interface GraphNode {
  id: string;
  title: string;
  date: string;
  vividness: number;
  emotions: EmotionType[];
  symbols: string[];
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  isDragging?: boolean;
}

export interface GraphEdge {
  source: string;
  target: string;
  sharedSymbols: string[];
  sharedTags: string[];
  sharedKeywords: string[];
  weight: number;
}

export interface ConstellationGraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  adjacencyList: Map<string, { targetId: string; sharedTerms: string[]; weight: number }[]>;
}

// DSA Interactive Visualization Trace Types
export interface DSATraceStep {
  stepNumber: number;
  description: string;
  highlightedIndices?: number[];
  auxiliaryIndices?: number[];
  variables?: Record<string, string | number | boolean>;
  dataSnapshot?: any;
}

export interface ComplexityProfile {
  timeBest: string;
  timeAverage: string;
  timeWorst: string;
  space: string;
  rationale: string;
  appliedInFeature: string;
}

// Editor Stack Action for Undo/Redo
export interface EditorHistoryAction {
  id: string;
  timestamp: number;
  description: string;
  state: DreamDraft;
}
