// ==========================================
// BINARY SEARCH - DATE-INDEXED LOOKUP
// Used in: Rapid date-indexed dream lookup, Timeline navigation
// ==========================================

export interface BinarySearchTraceStep {
  stepIndex: number;
  low: number;
  mid: number;
  high: number;
  target: string;
  midValue: string;
  action: 'CALCULATE_MID' | 'COMPARE_TARGET' | 'DISCARD_LEFT' | 'DISCARD_RIGHT' | 'TARGET_FOUND' | 'TARGET_NOT_FOUND';
  explanation: string;
}

export class BinarySearchVisualizer {
  /**
   * Performs instrumented Binary Search on a sorted array of items with a key extractor.
   * Time Complexity: O(log N)
   * Space Complexity: O(1) auxiliary space
   */
  static traceSearch<T>(
    sortedItems: T[],
    target: string,
    getKey: (item: T) => string
  ): { foundIndex: number; steps: BinarySearchTraceStep[] } {
    const steps: BinarySearchTraceStep[] = [];
    let low = 0;
    let high = sortedItems.length - 1;

    if (sortedItems.length === 0) {
      steps.push({
        stepIndex: 0,
        low: 0,
        mid: 0,
        high: -1,
        target,
        midValue: 'None',
        action: 'TARGET_NOT_FOUND',
        explanation: 'Array is empty. Binary search cannot proceed.',
      });
      return { foundIndex: -1, steps };
    }

    steps.push({
      stepIndex: steps.length,
      low,
      mid: Math.floor((low + high) / 2),
      high,
      target,
      midValue: getKey(sortedItems[Math.floor((low + high) / 2)]),
      action: 'CALCULATE_MID',
      explanation: `Initialized Binary Search for target "${target}" across range [${low}..${high}]. Requires array sorted by date.`,
    });

    while (low <= high) {
      const mid = Math.floor(low + (high - low) / 2);
      const midVal = getKey(sortedItems[mid]);

      steps.push({
        stepIndex: steps.length,
        low,
        mid,
        high,
        target,
        midValue: midVal,
        action: 'COMPARE_TARGET',
        explanation: `Comparing target "${target}" with mid-element at index ${mid}: "${midVal}".`,
      });

      if (midVal === target) {
        steps.push({
          stepIndex: steps.length,
          low,
          mid,
          high,
          target,
          midValue: midVal,
          action: 'TARGET_FOUND',
          explanation: `Exact match found at index ${mid}! Element key "${midVal}" equals target "${target}".`,
        });
        return { foundIndex: mid, steps };
      }

      if (midVal < target) {
        steps.push({
          stepIndex: steps.length,
          low,
          mid,
          high,
          target,
          midValue: midVal,
          action: 'DISCARD_LEFT',
          explanation: `Mid value "${midVal}" < target "${target}". Discarding left half [${low}..${mid}]. Updating low = ${mid + 1}.`,
        });
        low = mid + 1;
      } else {
        steps.push({
          stepIndex: steps.length,
          low,
          mid,
          high,
          target,
          midValue: midVal,
          action: 'DISCARD_RIGHT',
          explanation: `Mid value "${midVal}" > target "${target}". Discarding right half [${mid}..${high}]. Updating high = ${mid - 1}.`,
        });
        high = mid - 1;
      }
    }

    steps.push({
      stepIndex: steps.length,
      low,
      mid: -1,
      high,
      target,
      midValue: 'None',
      action: 'TARGET_NOT_FOUND',
      explanation: `Search range exhausted (low ${low} > high ${high}). Target "${target}" not found in journal date index.`,
    });

    return { foundIndex: -1, steps };
  }
}
