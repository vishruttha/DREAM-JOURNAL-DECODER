// ==========================================
// STACK DATA STRUCTURE - LIFO UNDO/REDO ENGINE
// Used in: Dream Journal Editor (Undo edits), Call stack visualization in DFS
// ==========================================

export interface StackTraceStep {
  stepIndex: number;
  operation: 'PUSH' | 'POP' | 'PEEK' | 'CLEAR';
  item: any;
  topIndex: number;
  currentStack: any[];
  explanation: string;
}

export class UndoStack<T> {
  private items: T[];
  private readonly maxCapacity: number;

  constructor(maxCapacity: number = 30) {
    this.items = [];
    this.maxCapacity = maxCapacity;
  }

  get size(): number {
    return this.items.length;
  }

  isEmpty(): boolean {
    return this.items.length === 0;
  }

  isFull(): boolean {
    return this.items.length >= this.maxCapacity;
  }

  /**
   * Push operation: adds element to top of stack.
   * Time Complexity: O(1) amortized
   * Space Complexity: O(1)
   */
  push(item: T): void {
    if (this.isFull()) {
      // Remove oldest state from bottom when capacity is reached
      this.items.shift();
    }
    this.items.push(item);
  }

  /**
   * Pop operation: removes and returns topmost element (LIFO).
   * Time Complexity: O(1)
   */
  pop(): T | undefined {
    if (this.isEmpty()) return undefined;
    return this.items.pop();
  }

  /**
   * Peek operation: returns topmost element without removing it.
   * Time Complexity: O(1)
   */
  peek(): T | undefined {
    if (this.isEmpty()) return undefined;
    return this.items[this.items.length - 1];
  }

  clear(): void {
    this.items = [];
  }

  getItems(): T[] {
    return [...this.items];
  }

  /**
   * Instrumented execution trace for the DSA Laboratory.
   */
  traceOperation(
    op: 'PUSH' | 'POP' | 'PEEK',
    item?: T,
    getLabel: (item: T) => string = String
  ): { result: T | undefined; step: StackTraceStep } {
    let result: T | undefined;
    let explanation = '';

    if (op === 'PUSH' && item !== undefined) {
      this.push(item);
      result = item;
      explanation = `PUSH: Added state "${getLabel(item)}" onto top of stack (Index ${this.items.length - 1}). Top pointer incremented.`;
    } else if (op === 'POP') {
      result = this.pop();
      explanation = result !== undefined
        ? `POP: Removed topmost state "${getLabel(result)}" (LIFO). Top pointer decremented to ${this.items.length - 1}.`
        : 'POP attempted on empty stack (Underflow). No action taken.';
    } else if (op === 'PEEK') {
      result = this.peek();
      explanation = result !== undefined
        ? `PEEK: Inspected topmost state "${getLabel(result)}" without mutating stack.`
        : 'PEEK on empty stack.';
    }

    const step: StackTraceStep = {
      stepIndex: Date.now(),
      operation: op,
      item: result !== undefined ? getLabel(result) : null,
      topIndex: this.items.length - 1,
      currentStack: this.items.map(getLabel),
      explanation,
    };

    return { result, step };
  }
}
