// ==========================================
// DREAM DECODER SERVICE - DETERMINISTIC TEXT PROCESSING
// Uses CustomHashMap, Trie, and Tokenization Algorithms
// ==========================================

import { Dream, DetectedSymbolMatch, EmotionType } from '../types';
import { DREAM_SYMBOLS } from './symbolDictionary';
import { CustomHashMap } from '../dsa/CustomHashMap';

// Comprehensive English stop-words list
export const STOP_WORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'aren\'t', 'as', 'at',
  'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by',
  'can', 'can\'t', 'cannot', 'could', 'couldn\'t',
  'did', 'didn\'t', 'do', 'does', 'doesn\'t', 'doing', 'don\'t', 'down', 'during',
  'each', 'few', 'for', 'from', 'further',
  'had', 'hadn\'t', 'has', 'hasn\'t', 'have', 'haven\'t', 'having', 'he', 'he\'d', 'he\'ll', 'he\'s', 'her', 'here', 'here\'s', 'hers', 'herself', 'him', 'himself', 'his', 'how', 'how\'s',
  'i', 'i\'d', 'i\'ll', 'i\'m', 'i\'ve', 'if', 'in', 'into', 'is', 'isn\'t', 'it', 'it\'s', 'its', 'itself',
  'let\'s', 'me', 'more', 'most', 'mustn\'t', 'my', 'myself',
  'no', 'nor', 'not', 'of', 'off', 'on', 'once', 'only', 'or', 'other', 'ought', 'our', 'ours', 'ourselves', 'out', 'over', 'own',
  'same', 'shan\'t', 'she', 'she\'d', 'she\'ll', 'she\'s', 'should', 'shouldn\'t', 'so', 'some', 'such',
  'than', 'that', 'that\'s', 'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there', 'there\'s', 'these', 'they', 'they\'d', 'they\'ll', 'they\'re', 'they\'ve', 'this', 'those', 'through', 'to', 'too',
  'under', 'until', 'up', 'very',
  'was', 'wasn\'t', 'we', 'we\'d', 'we\'ll', 'we\'re', 'we\'ve', 'were', 'weren\'t', 'what', 'what\'s', 'when', 'when\'s', 'where', 'where\'s', 'which', 'while', 'who', 'who\'s', 'whom', 'why', 'why\'s', 'with', 'won\'t', 'would', 'wouldn\'t',
  'you', 'you\'d', 'you\'ll', 'you\'re', 'you\'ve', 'your', 'yours', 'yourself', 'yourselves',
  // Common conversational dream fillers
  'like', 'felt', 'seemed', 'saw', 'went', 'looked', 'started', 'then', 'suddenly', 'just', 'somewhere', 'something', 'someone',
]);

// Emotion keyword trigger mappings
const EMOTION_LEXICON: Record<EmotionType, string[]> = {
  Wonder: ['wonder', 'awe', 'marvel', 'astonished', 'celestial', 'magical', 'curious', 'infinite', 'breathless', 'beauty', 'luminous', 'starlight'],
  Anxiety: ['anxious', 'stress', 'hurry', 'late', 'panic', 'nervous', 'urgent', 'pressured', 'dread', 'tense', 'frantic', 'unprepared'],
  Joy: ['joy', 'happy', 'laugh', 'delight', 'smile', 'rejoice', 'glad', 'radiant', 'celebrate', 'warmth', 'ecstatic', 'cheerful'],
  Melancholy: ['sad', 'lonely', 'sorrow', 'grief', 'tear', 'crying', 'wept', 'fading', 'nostalgic', 'gloomy', 'bittersweet', 'mourning'],
  Confusion: ['confused', 'weird', 'strange', 'bizarre', 'lost', 'perplexed', 'puzzle', 'maze', 'disoriented', 'nonsensical', 'unreal'],
  Fear: ['fear', 'terror', 'terrified', 'scared', 'horror', 'monster', 'darkness', 'shiver', 'threat', 'nightmare', 'screamed', 'frightened'],
  Peace: ['peace', 'calm', 'serene', 'tranquil', 'quiet', 'restful', 'still', 'gentle', 'harmony', 'relax', 'soothing'],
  Euphoria: ['soaring', 'ecstasy', 'weightless', 'invincible', 'triumphant', 'flying', 'bliss', 'transcendent', 'powerful'],
  Nostalgia: ['childhood', 'remembered', 'old home', 'past', 'vintage', 'long ago', 'school', 'grandmother', 'grandfather', 'antique'],
  Frustration: ['stuck', 'blocked', 'unable', 'failed', 'cannot', 'futile', 'ignored', 'broken', 'refused', 'muffled'],
  Liberation: ['free', 'escaped', 'unlocked', 'released', 'breakthrough', 'unchained', 'fled', 'relieved', 'open space'],
};

export interface TextAnalysisResult {
  tokens: string[];
  filteredTokens: string[];
  keywordFrequencies: CustomHashMap<string, number>;
  topKeywords: Array<{ word: string; count: number }>;
  detectedSymbols: DetectedSymbolMatch[];
  inferredEmotions: EmotionType[];
  wordCount: number;
  charCount: number;
  lexicalDiversity: number; // unique words / total words
  estimatedReadingTimeSec: number;
}

export class DreamDecoderService {
  /**
   * Normalizes text: lowercases, replaces non-alphanumeric chars with spaces
   */
  static normalizeText(text: string): string {
    return text.toLowerCase().replace(/[^a-z0-9'\s-]/g, ' ');
  }

  /**
   * Tokenizes text into individual words
   */
  static tokenize(text: string): string[] {
    const normalized = this.normalizeText(text);
    return normalized
      .split(/\s+/)
      .map(t => t.replace(/^['-]+|['-]+$/g, ''))
      .filter(t => t.length > 1);
  }

  /**
   * Removes stop-words using Set lookup O(1)
   */
  static removeStopWords(tokens: string[]): string[] {
    return tokens.filter(token => !STOP_WORDS.has(token));
  }

  /**
   * Deterministic dream analysis pipeline using our CustomHashMap
   */
  static analyzeDreamText(narrative: string, title: string = ''): TextAnalysisResult {
    const fullText = `${title} ${narrative}`;
    const tokens = this.tokenize(fullText);
    const filteredTokens = this.removeStopWords(tokens);
    const wordCount = tokens.length;
    const charCount = narrative.length;

    // Use CustomHashMap for O(1) average keyword frequency counting
    const keywordFrequencies = new CustomHashMap<string, number>(16);
    for (const token of filteredTokens) {
      keywordFrequencies.increment(token, 1);
    }

    // Extract top keywords sorted by frequency
    const entries = keywordFrequencies.entries();
    entries.sort((a, b) => b[1] - a[1]);
    const topKeywords = entries.slice(0, 10).map(([word, count]) => ({ word, count }));

    // Lexical diversity calculation
    const uniqueWordCount = entries.length;
    const lexicalDiversity = wordCount > 0 ? Number((uniqueWordCount / wordCount).toFixed(3)) : 0;
    const estimatedReadingTimeSec = Math.max(5, Math.round((wordCount / 200) * 60));

    // Detect Dream Symbols
    const lowerText = fullText.toLowerCase();
    const detectedSymbols: DetectedSymbolMatch[] = [];

    for (const symbolDef of DREAM_SYMBOLS) {
      let matchCount = 0;
      const matchedWords: string[] = [];

      for (const kw of symbolDef.keywords) {
        // Word boundary match
        const regex = new RegExp(`\\b${kw}\\b`, 'gi');
        const matches = lowerText.match(regex);
        if (matches) {
          matchCount += matches.length;
          matchedWords.push(kw);
        }
      }

      if (matchCount > 0) {
        detectedSymbols.push({
          symbolId: symbolDef.id,
          name: symbolDef.name,
          category: symbolDef.category,
          occurrences: matchCount,
          matchedKeywords: Array.from(new Set(matchedWords)),
          reflectiveMeaning: symbolDef.reflectiveMeaning,
          inquiryQuestion: symbolDef.inquiryQuestion,
        });
      }
    }

    // Sort detected symbols by occurrences descending
    detectedSymbols.sort((a, b) => b.occurrences - a.occurrences);

    // Inferred Emotions via lexicon matching
    const emotionScores: Partial<Record<EmotionType, number>> = {};
    for (const [emotion, keywords] of Object.entries(EMOTION_LEXICON)) {
      let score = 0;
      for (const kw of keywords) {
        const regex = new RegExp(`\\b${kw}\\b`, 'gi');
        const matches = lowerText.match(regex);
        if (matches) score += matches.length;
      }
      if (score > 0) {
        emotionScores[emotion as EmotionType] = score;
      }
    }

    const inferredEmotions = Object.entries(emotionScores)
      .sort((a, b) => (b[1] as number) - (a[1] as number))
      .slice(0, 3)
      .map(([emotion]) => emotion as EmotionType);

    return {
      tokens,
      filteredTokens,
      keywordFrequencies,
      topKeywords,
      detectedSymbols,
      inferredEmotions,
      wordCount,
      charCount,
      lexicalDiversity,
      estimatedReadingTimeSec,
    };
  }

  /**
   * Discovers related dreams from the journal sharing symbols, tags, or emotions
   */
  static findRelatedDreams(currentDream: Dream, allDreams: Dream[], maxResults: number = 4): Array<{ dream: Dream; sharedSymbols: string[]; sharedTags: string[]; score: number }> {
    const currentSymbols = new Set((currentDream.derivedSymbols || []).map(s => s.name));
    const currentTags = new Set((currentDream.tags || []).map(t => t.toLowerCase()));

    const related: Array<{ dream: Dream; sharedSymbols: string[]; sharedTags: string[]; score: number }> = [];

    for (const other of allDreams) {
      if (other.id === currentDream.id) continue;

      const otherSymbols = (other.derivedSymbols || []).map(s => s.name);
      const otherTags = (other.tags || []).map(t => t.toLowerCase());

      const sharedSymbols = otherSymbols.filter(s => currentSymbols.has(s));
      const sharedTags = otherTags.filter(t => currentTags.has(t));

      const score = (sharedSymbols.length * 4) + (sharedTags.length * 2);

      if (score > 0) {
        related.push({
          dream: other,
          sharedSymbols,
          sharedTags,
          score,
        });
      }
    }

    related.sort((a, b) => b.score - a.score);
    return related.slice(0, maxResults);
  }

  /**
   * Computes astronomical moon phase approximation from date string (YYYY-MM-DD)
   */
  static getMoonPhase(dateString: string): { phase: string; illumination: number; icon: string } {
    try {
      const date = new Date(dateString);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const day = date.getDate();

      // Simple Conway moon phase approximation
      let c = 0;
      let e = 0;
      let jd = 0;
      let b = 0;

      if (month < 3) {
        c = year - 1;
        e = month + 12;
      } else {
        c = year;
        e = month;
      }

      b = Math.floor(c / 400) - Math.floor(c / 100) + Math.floor(c / 4);
      jd = 365.25 * c + 30.6 * (e + 1) + day - 694039.09;
      jd /= 29.5305882; // lunar cycle in days
      b = parseInt(jd.toString(), 10);
      jd -= b; // fractional part represents cycle position [0..1]
      const phaseNum = Math.round(jd * 8);

      const phases = [
        { phase: 'New Moon', illumination: 0, icon: '🌑' },
        { phase: 'Waxing Crescent', illumination: 25, icon: '🌒' },
        { phase: 'First Quarter', illumination: 50, icon: '🌓' },
        { phase: 'Waxing Gibbous', illumination: 75, icon: '🌔' },
        { phase: 'Full Moon', illumination: 100, icon: '🌕' },
        { phase: 'Waning Gibbous', illumination: 75, icon: '🌖' },
        { phase: 'Last Quarter', illumination: 50, icon: '🌗' },
        { phase: 'Waning Crescent', illumination: 25, icon: '🌘' },
      ];

      return phases[phaseNum % 8] || phases[0];
    } catch {
      return { phase: 'Waning Crescent', illumination: 30, icon: '🌘' };
    }
  }
}
