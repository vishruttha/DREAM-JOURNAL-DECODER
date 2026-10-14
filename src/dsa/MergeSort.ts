// ==========================================
// MERGE SORT - DIVIDE AND CONQUER SORTING
// Used in: Sorting dreams by date, word count, vividness, and symbol frequency
// ==========================================

export interface MergeSortTraceStep {
  stepIndex: number;
  phase: 'DIVIDE' | 'COMPARE' | 'MERGE_ITEM' | 'SUBARRAY_MERGED' | 'COMPLETE';
  leftRange: [number, number];
  rightRange: [number, number];
  comparingIndices?: [number, number];
  comparedValues?: [any, any];
  activeArray: any[];
  comparisonsCount: number;
  explanation: string;
}

export class MergeSortVisualizer {
  /**
   * Sorts an array using Merge Sort while capturing all divide, compare, and merge steps.
   * Time Complexity: O(N log N) in all cases (Best, Average, Worst).
   * Space Complexity: O(N) auxiliary space.
   */
  static traceSort<T>(
    items: T[],
    compareFn: (a: T, b: T) => number,
    getLabel: (item: T) => string
  ): { sorted: T[]; steps: MergeSortTraceStep[]; totalComparisons: number } {
    const steps: MergeSortTraceStep[] = [];
    const array = [...items];
    let comparisonsCount = 0;

    steps.push({
      stepIndex: steps.length,
      phase: 'DIVIDE',
      leftRange: [0, Math.floor(array.length / 2)],
      rightRange: [Math.floor(array.length / 2), array.length],
      activeArray: [...array],
      comparisonsCount: 0,
      explanation: `Starting Merge Sort on ${array.length} items. Merge Sort uses Divide & Conquer to split the array recursively until sub-arrays of size 1 are reached.`,
    });

    const merge = (start: number, mid: number, end: number) => {
      const leftPart = array.slice(start, mid);
      const rightPart = array.slice(mid, end);

      steps.push({
        stepIndex: steps.length,
        phase: 'DIVIDE',
        leftRange: [start, mid],
        rightRange: [mid, end],
        activeArray: [...array],
        comparisonsCount,
        explanation: `Sub-array [${start}..${end - 1}] divided into left [${leftPart.map(getLabel).join(', ')}] and right [${rightPart.map(getLabel).join(', ')}]. Now merging.`,
      });

      let i = 0;
      let j = 0;
      let k = start;

      while (i < leftPart.length && j < rightPart.length) {
        comparisonsCount++;
        const cmp = compareFn(leftPart[i], rightPart[j]);

        steps.push({
          stepIndex: steps.length,
          phase: 'COMPARE',
          leftRange: [start, mid],
          rightRange: [mid, end],
          comparingIndices: [start + i, mid + j],
          comparedValues: [getLabel(leftPart[i]), getLabel(rightPart[j])],
          activeArray: [...array],
          comparisonsCount,
          explanation: `Comparing "${getLabel(leftPart[i])}" with "${getLabel(rightPart[j])}". Result: ${cmp <= 0 ? 'Left' : 'Right'} element comes first.`,
        });

        if (cmp <= 0) {
          array[k] = leftPart[i];
          i++;
        } else {
          array[k] = rightPart[j];
          j++;
        }

        steps.push({
          stepIndex: steps.length,
          phase: 'MERGE_ITEM',
          leftRange: [start, mid],
          rightRange: [mid, end],
          activeArray: [...array],
          comparisonsCount,
          explanation: `Placed "${getLabel(array[k])}" into index ${k} of merged partition.`,
        });

        k++;
      }

      while (i < leftPart.length) {
        array[k] = leftPart[i];
        i++;
        k++;
      }

      while (j < rightPart.length) {
        array[k] = rightPart[j];
        j++;
        k++;
      }

      steps.push({
        stepIndex: steps.length,
        phase: 'SUBARRAY_MERGED',
        leftRange: [start, mid],
        rightRange: [mid, end],
        activeArray: [...array],
        comparisonsCount,
        explanation: `Merged sub-array [${start}..${end - 1}]: [${array.slice(start, end).map(getLabel).join(', ')}].`,
      });
    };

    const divideAndMerge = (start: number, end: number) => {
      if (end - start <= 1) return;
      const mid = Math.floor((start + end) / 2);
      divideAndMerge(start, mid);
      divideAndMerge(mid, end);
      merge(start, mid, end);
    };

    if (array.length > 1) {
      divideAndMerge(0, array.length);
    }

    steps.push({
      stepIndex: steps.length,
      phase: 'COMPLETE',
      leftRange: [0, array.length],
      rightRange: [0, array.length],
      activeArray: [...array],
      comparisonsCount,
      explanation: `Merge Sort complete! Array fully sorted in O(N log N) time with ${comparisonsCount} comparisons. Stability preserved.`,
    });

    return { sorted: array, steps, totalComparisons: comparisonsCount };
  }
}
