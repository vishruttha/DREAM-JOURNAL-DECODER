// ==========================================
// DREAM GRAPH - ADJACENCY LIST, BFS & DFS TRAVERSALS
// Used in: Dream Constellation, Connected dreams, Theme clustering
// ==========================================

import { Dream, GraphNode, GraphEdge } from '../types';

export interface GraphEdgeData {
  targetId: string;
  sharedSymbols: string[];
  sharedTags: string[];
  sharedKeywords: string[];
  weight: number;
}

export interface GraphTraceStep {
  stepIndex: number;
  algorithm: 'BFS' | 'DFS';
  action: 'VISIT_NODE' | 'ENQUEUE_NEIGHBORS' | 'PUSH_STACK' | 'POP_STACK' | 'ALREADY_VISITED' | 'COMPLETE';
  currentNodeId: string;
  currentNodeTitle: string;
  visitedNodes: string[];
  frontier: string[]; // Queue for BFS, Call Stack for DFS
  currentEdge?: { source: string; target: string; sharedTerms: string[] };
  explanation: string;
}

export class DreamGraph {
  vertices: Map<string, GraphNode>;
  adjacencyList: Map<string, GraphEdgeData[]>;

  constructor() {
    this.vertices = new Map();
    this.adjacencyList = new Map();
  }

  /**
   * Builds the graph from dream journal entries.
   * Compares pairs of dreams for shared symbols, tags, or keywords.
   * Time Complexity: O(V^2 * S) where V is dream count, S is avg symbols/tags per dream
   */
  buildFromDreams(dreams: Dream[]): void {
    this.vertices.clear();
    this.adjacencyList.clear();

    // 1. Add all vertices
    for (const dream of dreams) {
      const node: GraphNode = {
        id: dream.id,
        title: dream.title,
        date: dream.dreamDate,
        vividness: dream.vividness,
        emotions: dream.selectedEmotions || [],
        symbols: (dream.derivedSymbols || []).map(s => s.name),
      };
      this.vertices.set(dream.id, node);
      this.adjacencyList.set(dream.id, []);
    }

    // 2. Compute undirected edges between dreams sharing symbols, tags, or emotions
    for (let i = 0; i < dreams.length; i++) {
      for (let j = i + 1; j < dreams.length; j++) {
        const d1 = dreams[i];
        const d2 = dreams[j];

        const symbols1 = new Set((d1.derivedSymbols || []).map(s => s.name.toLowerCase()));
        const symbols2 = new Set((d2.derivedSymbols || []).map(s => s.name.toLowerCase()));
        const sharedSymbols = [...symbols1].filter(s => symbols2.has(s));

        const tags1 = new Set((d1.tags || []).map(t => t.toLowerCase()));
        const tags2 = new Set((d2.tags || []).map(t => t.toLowerCase()));
        const sharedTags = [...tags1].filter(t => tags2.has(t));

        const kw1 = new Set((d1.derivedKeywords || []).map(k => k.toLowerCase()));
        const kw2 = new Set((d2.derivedKeywords || []).map(k => k.toLowerCase()));
        const sharedKeywords = [...kw1].filter(k => kw2.has(k)).slice(0, 5);

        // Edge weight calculation based on shared attributes
        const weight = (sharedSymbols.length * 3) + (sharedTags.length * 2) + (sharedKeywords.length * 1);

        if (weight > 0) {
          // Add edge d1 -> d2
          this.adjacencyList.get(d1.id)!.push({
            targetId: d2.id,
            sharedSymbols,
            sharedTags,
            sharedKeywords,
            weight,
          });

          // Add edge d2 -> d1 (Undirected graph)
          this.adjacencyList.get(d2.id)!.push({
            targetId: d1.id,
            sharedSymbols,
            sharedTags,
            sharedKeywords,
            weight,
          });
        }
      }
    }
  }

  /**
   * Breadth-First Search (BFS) using a Queue (FIFO).
   * Time Complexity: O(V + E)
   * Space Complexity: O(V) for queue and visited set
   */
  bfs(startId: string): { order: string[]; distances: Map<string, number>; parentMap: Map<string, string | null> } {
    const order: string[] = [];
    const distances = new Map<string, number>();
    const parentMap = new Map<string, string | null>();
    const visited = new Set<string>();
    const queue: string[] = [];

    if (!this.vertices.has(startId)) return { order, distances, parentMap };

    queue.push(startId);
    visited.add(startId);
    distances.set(startId, 0);
    parentMap.set(startId, null);

    while (queue.length > 0) {
      const current = queue.shift()!;
      order.push(current);
      const currentDist = distances.get(current) || 0;

      const neighbors = this.adjacencyList.get(current) || [];
      for (const edge of neighbors) {
        if (!visited.has(edge.targetId)) {
          visited.add(edge.targetId);
          distances.set(edge.targetId, currentDist + 1);
          parentMap.set(edge.targetId, current);
          queue.push(edge.targetId);
        }
      }
    }

    return { order, distances, parentMap };
  }

  /**
   * Depth-First Search (DFS) using recursion / call stack (LIFO).
   * Time Complexity: O(V + E)
   * Space Complexity: O(V) for call stack and visited set
   */
  dfs(startId: string): { order: string[]; parentMap: Map<string, string | null> } {
    const order: string[] = [];
    const parentMap = new Map<string, string | null>();
    const visited = new Set<string>();

    if (!this.vertices.has(startId)) return { order, parentMap };

    const dfsVisit = (nodeId: string, parent: string | null) => {
      visited.add(nodeId);
      order.push(nodeId);
      parentMap.set(nodeId, parent);

      const neighbors = this.adjacencyList.get(nodeId) || [];
      for (const edge of neighbors) {
        if (!visited.has(edge.targetId)) {
          dfsVisit(edge.targetId, nodeId);
        }
      }
    };

    dfsVisit(startId, null);
    return { order, parentMap };
  }

  /**
   * Finds shortest path between two dreams using BFS.
   */
  findShortestPath(startId: string, endId: string): string[] | null {
    if (!this.vertices.has(startId) || !this.vertices.has(endId)) return null;
    if (startId === endId) return [startId];

    const { parentMap } = this.bfs(startId);
    if (!parentMap.has(endId)) return null; // Not connected

    const path: string[] = [];
    let curr: string | null = endId;
    while (curr !== null) {
      path.unshift(curr);
      curr = parentMap.get(curr) || null;
    }
    return path;
  }

  /**
   * Identifies isolated nodes (dreams with zero connections).
   */
  detectIsolatedNodes(): string[] {
    const isolated: string[] = [];
    for (const [id] of this.vertices) {
      const edges = this.adjacencyList.get(id) || [];
      if (edges.length === 0) {
        isolated.push(id);
      }
    }
    return isolated;
  }

  /**
   * Finds connected components (clusters of thematic dreams).
   */
  getConnectedComponents(): string[][] {
    const components: string[][] = [];
    const visited = new Set<string>();

    for (const [id] of this.vertices) {
      if (!visited.has(id)) {
        const { order } = this.bfs(id);
        order.forEach(nodeId => visited.add(nodeId));
        components.push(order);
      }
    }
    return components;
  }

  /**
   * Instrumented Breadth-First Search trace for the DSA Laboratory and Constellation.
   */
  traceBFS(startId: string): { steps: GraphTraceStep[] } {
    const steps: GraphTraceStep[] = [];
    const visited = new Set<string>();
    const queue: string[] = [];

    if (!this.vertices.has(startId)) return { steps };

    queue.push(startId);
    visited.add(startId);

    const startTitle = this.vertices.get(startId)?.title || startId;
    steps.push({
      stepIndex: steps.length,
      algorithm: 'BFS',
      action: 'VISIT_NODE',
      currentNodeId: startId,
      currentNodeTitle: startTitle,
      visitedNodes: Array.from(visited),
      frontier: [...queue],
      explanation: `Initialized BFS Queue [FIFO] with start dream: "${startTitle}". Marked as visited (Level 0).`,
    });

    while (queue.length > 0) {
      const current = queue.shift()!;
      const currTitle = this.vertices.get(current)?.title || current;

      steps.push({
        stepIndex: steps.length,
        algorithm: 'BFS',
        action: 'VISIT_NODE',
        currentNodeId: current,
        currentNodeTitle: currTitle,
        visitedNodes: Array.from(visited),
        frontier: [...queue],
        explanation: `Dequeued "${currTitle}" from front of Queue. Inspecting all adjacent connected dreams.`,
      });

      const neighbors = this.adjacencyList.get(current) || [];
      for (const edge of neighbors) {
        const targetTitle = this.vertices.get(edge.targetId)?.title || edge.targetId;
        const sharedTerms = [...edge.sharedSymbols, ...edge.sharedTags];

        if (!visited.has(edge.targetId)) {
          visited.add(edge.targetId);
          queue.push(edge.targetId);

          steps.push({
            stepIndex: steps.length,
            algorithm: 'BFS',
            action: 'ENQUEUE_NEIGHBORS',
            currentNodeId: current,
            currentNodeTitle: currTitle,
            visitedNodes: Array.from(visited),
            frontier: [...queue],
            currentEdge: { source: current, target: edge.targetId, sharedTerms },
            explanation: `Found unvisited neighbor "${targetTitle}" connected by [${sharedTerms.join(', ')}]. Enqueued into Queue.`,
          });
        } else {
          steps.push({
            stepIndex: steps.length,
            algorithm: 'BFS',
            action: 'ALREADY_VISITED',
            currentNodeId: current,
            currentNodeTitle: currTitle,
            visitedNodes: Array.from(visited),
            frontier: [...queue],
            currentEdge: { source: current, target: edge.targetId, sharedTerms },
            explanation: `Neighbor "${targetTitle}" was already visited earlier. Skipping to prevent cycles.`,
          });
        }
      }
    }

    steps.push({
      stepIndex: steps.length,
      algorithm: 'BFS',
      action: 'COMPLETE',
      currentNodeId: '',
      currentNodeTitle: '',
      visitedNodes: Array.from(visited),
      frontier: [],
      explanation: `BFS traversal completed! Visited all ${visited.size} connected dreams in this constellation component.`,
    });

    return { steps };
  }

  /**
   * Instrumented Depth-First Search trace for the DSA Laboratory and Constellation.
   */
  traceDFS(startId: string): { steps: GraphTraceStep[] } {
    const steps: GraphTraceStep[] = [];
    const visited = new Set<string>();
    const callStack: string[] = [];

    if (!this.vertices.has(startId)) return { steps };

    const dfsRecursive = (nodeId: string) => {
      visited.add(nodeId);
      callStack.push(nodeId);
      const currTitle = this.vertices.get(nodeId)?.title || nodeId;

      steps.push({
        stepIndex: steps.length,
        algorithm: 'DFS',
        action: 'PUSH_STACK',
        currentNodeId: nodeId,
        currentNodeTitle: currTitle,
        visitedNodes: Array.from(visited),
        frontier: [...callStack],
        explanation: `Pushed "${currTitle}" onto Call Stack (Depth: ${callStack.length}). Traversing deeply into first unvisited thematic neighbor.`,
      });

      const neighbors = this.adjacencyList.get(nodeId) || [];
      for (const edge of neighbors) {
        const targetTitle = this.vertices.get(edge.targetId)?.title || edge.targetId;
        const sharedTerms = [...edge.sharedSymbols, ...edge.sharedTags];

        if (!visited.has(edge.targetId)) {
          dfsRecursive(edge.targetId);
        } else {
          steps.push({
            stepIndex: steps.length,
            algorithm: 'DFS',
            action: 'ALREADY_VISITED',
            currentNodeId: nodeId,
            currentNodeTitle: currTitle,
            visitedNodes: Array.from(visited),
            frontier: [...callStack],
            currentEdge: { source: nodeId, target: edge.targetId, sharedTerms },
            explanation: `Neighbor "${targetTitle}" already visited. Avoiding cycle.`,
          });
        }
      }

      callStack.pop();
      steps.push({
        stepIndex: steps.length,
        algorithm: 'DFS',
        action: 'POP_STACK',
        currentNodeId: nodeId,
        currentNodeTitle: currTitle,
        visitedNodes: Array.from(visited),
        frontier: [...callStack],
        explanation: `Finished exploring all paths from "${currTitle}". Popping frame from Call Stack (Backtracking).`,
      });
    };

    dfsRecursive(startId);

    steps.push({
      stepIndex: steps.length,
      algorithm: 'DFS',
      action: 'COMPLETE',
      currentNodeId: '',
      currentNodeTitle: '',
      visitedNodes: Array.from(visited),
      frontier: [],
      explanation: `DFS traversal complete! Visited ${visited.size} connected dreams through depth-first thematic exploration.`,
    });

    return { steps };
  }

  /**
   * Export edge list for Cytoscape or custom canvas renderers
   */
  getExportableEdges(): GraphEdge[] {
    const edges: GraphEdge[] = [];
    const seen = new Set<string>();

    for (const [sourceId, edgeList] of this.adjacencyList.entries()) {
      for (const edge of edgeList) {
        const edgeKey = [sourceId, edge.targetId].sort().join('--');
        if (!seen.has(edgeKey)) {
          seen.add(edgeKey);
          edges.push({
            source: sourceId,
            target: edge.targetId,
            sharedSymbols: edge.sharedSymbols,
            sharedTags: edge.sharedTags,
            sharedKeywords: edge.sharedKeywords,
            weight: edge.weight,
          });
        }
      }
    }
    return edges;
  }
}
