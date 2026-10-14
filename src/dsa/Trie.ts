// ==========================================
// TRIE DATA STRUCTURE - PREFIX SEARCH & AUTOCOMPLETE
// Used in: Dream Library search bar, Tag suggestions, Keyword lookup
// ==========================================

export interface TrieNodeMetadata {
  type?: 'title' | 'tag' | 'symbol' | 'keyword';
  category?: string;
}

export class TrieNode {
  char: string;
  children: Map<string, TrieNode>;
  isEndOfWord: boolean;
  frequency: number;
  dreamIds: Set<string>;
  metadata?: TrieNodeMetadata;

  constructor(char: string = '') {
    this.char = char;
    this.children = new Map();
    this.isEndOfWord = false;
    this.frequency = 0;
    this.dreamIds = new Set();
  }
}

export interface TrieTraceStep {
  stepIndex: number;
  action: 'VISIT_NODE' | 'CHAR_FOUND' | 'CHAR_NOT_FOUND' | 'MARK_WORD' | 'COLLECT_WORD';
  char: string;
  depth: number;
  currentPrefix: string;
  matchedWordsSoFar: string[];
  explanation: string;
}

export class Trie {
  root: TrieNode;
  totalWords: number;

  constructor() {
    this.root = new TrieNode();
    this.totalWords = 0;
  }

  /**
   * Inserts a word into the Trie.
   * Time Complexity: O(L) where L is the length of the word
   * Space Complexity: O(L) in the worst case (when no prefix is shared)
   */
  insert(word: string, dreamId?: string, metadata?: TrieNodeMetadata): void {
    if (!word) return;
    const cleanWord = word.trim().toLowerCase();
    if (!cleanWord) return;

    let current = this.root;
    for (let i = 0; i < cleanWord.length; i++) {
      const char = cleanWord[i];
      if (!current.children.has(char)) {
        current.children.set(char, new TrieNode(char));
      }
      current = current.children.get(char)!;
    }

    if (!current.isEndOfWord) {
      current.isEndOfWord = true;
      this.totalWords++;
    }
    current.frequency += 1;
    if (dreamId) {
      current.dreamIds.add(dreamId);
    }
    if (metadata) {
      current.metadata = metadata;
    }
  }

  /**
   * Search for an exact word in the Trie.
   * Time Complexity: O(L)
   */
  search(word: string): boolean {
    const node = this.getNode(word);
    return node !== null && node.isEndOfWord;
  }

  /**
   * Checks if any word starts with the given prefix.
   * Time Complexity: O(P) where P is prefix length
   */
  startsWith(prefix: string): boolean {
    return this.getNode(prefix) !== null;
  }

  /**
   * Returns a node at the end of the given prefix, or null.
   */
  private getNode(prefix: string): TrieNode | null {
    if (!prefix) return null;
    const clean = prefix.trim().toLowerCase();
    let current = this.root;
    for (let i = 0; i < clean.length; i++) {
      const char = clean[i];
      if (!current.children.has(char)) {
        return null;
      }
      current = current.children.get(char)!;
    }
    return current;
  }

  /**
   * Autocomplete: Returns words matching the prefix, sorted by frequency.
   * Time Complexity: O(P + K) where P is prefix length, K is number of descendants
   */
  autocomplete(prefix: string, limit: number = 8): { word: string; frequency: number; dreamIds: string[]; metadata?: TrieNodeMetadata }[] {
    const clean = prefix.trim().toLowerCase();
    const results: { word: string; frequency: number; dreamIds: string[]; metadata?: TrieNodeMetadata }[] = [];
    if (!clean) return results;

    const startNode = this.getNode(clean);
    if (!startNode) return results;

    this.collectAllWords(startNode, clean, results);

    // Sort by frequency descending, then alphabetically
    results.sort((a, b) => b.frequency - a.frequency || a.word.localeCompare(b.word));
    return results.slice(0, limit);
  }

  private collectAllWords(
    node: TrieNode,
    currentWord: string,
    results: { word: string; frequency: number; dreamIds: string[]; metadata?: TrieNodeMetadata }[]
  ): void {
    if (node.isEndOfWord) {
      results.push({
        word: currentWord,
        frequency: node.frequency,
        dreamIds: Array.from(node.dreamIds),
        metadata: node.metadata,
      });
    }

    for (const [char, childNode] of node.children.entries()) {
      this.collectAllWords(childNode, currentWord + char, results);
    }
  }

  /**
   * Instrumented execution trace for the DSA Laboratory visualizer.
   * Returns a step-by-step record of searching and gathering autocomplete suggestions.
   */
  traceAutocomplete(prefix: string, limit: number = 6): { steps: TrieTraceStep[]; suggestions: string[] } {
    const steps: TrieTraceStep[] = [];
    const clean = prefix.trim().toLowerCase();
    const suggestions: string[] = [];

    if (!clean) {
      steps.push({
        stepIndex: 0,
        action: 'VISIT_NODE',
        char: 'ROOT',
        depth: 0,
        currentPrefix: '',
        matchedWordsSoFar: [],
        explanation: 'Prefix is empty. Autocomplete requires at least 1 character.',
      });
      return { steps, suggestions };
    }

    let current = this.root;
    let accumulated = '';

    steps.push({
      stepIndex: steps.length,
      action: 'VISIT_NODE',
      char: 'ROOT',
      depth: 0,
      currentPrefix: '',
      matchedWordsSoFar: [],
      explanation: `Starting prefix search at Trie Root for prefix "${clean}".`,
    });

    // Traverse prefix characters
    for (let i = 0; i < clean.length; i++) {
      const char = clean[i];
      accumulated += char;

      if (!current.children.has(char)) {
        steps.push({
          stepIndex: steps.length,
          action: 'CHAR_NOT_FOUND',
          char,
          depth: i + 1,
          currentPrefix: accumulated,
          matchedWordsSoFar: [],
          explanation: `Character '${char}' not found under current node '${current.char || "ROOT"}'. No words in journal share prefix "${accumulated}".`,
        });
        return { steps, suggestions };
      }

      current = current.children.get(char)!;
      steps.push({
        stepIndex: steps.length,
        action: 'CHAR_FOUND',
        char,
        depth: i + 1,
        currentPrefix: accumulated,
        matchedWordsSoFar: [],
        explanation: `Found branch for '${char}'. Navigating deeper into Trie. Shared prefix so far: "${accumulated}".`,
      });
    }

    // Now collect suggestions from startNode using DFS
    const matchedList: string[] = [];
    const dfsCollect = (node: TrieNode, word: string) => {
      if (node.isEndOfWord) {
        matchedList.push(word);
        steps.push({
          stepIndex: steps.length,
          action: 'COLLECT_WORD',
          char: node.char,
          depth: word.length,
          currentPrefix: word,
          matchedWordsSoFar: [...matchedList],
          explanation: `Found complete word: "${word}" (Frequency: ${node.frequency}, referenced in ${node.dreamIds.size} dreams).`,
        });
      }

      for (const [ch, child] of node.children.entries()) {
        dfsCollect(child, word + ch);
      }
    };

    dfsCollect(current, accumulated);

    return {
      steps,
      suggestions: matchedList.slice(0, limit),
    };
  }

  /**
   * Export hierarchical tree structure for canvas/SVG rendering
   */
  toVisualHierarchy(maxDepth: number = 4): any {
    const formatNode = (node: TrieNode, label: string, depth: number): any => {
      if (depth > maxDepth) return null;
      const children: any[] = [];
      for (const [char, child] of node.children.entries()) {
        const formatted = formatNode(child, char, depth + 1);
        if (formatted) children.push(formatted);
      }
      return {
        label: label || '●',
        char: node.char,
        isEndOfWord: node.isEndOfWord,
        frequency: node.frequency,
        children,
      };
    };

    return formatNode(this.root, 'ROOT', 0);
  }
}
