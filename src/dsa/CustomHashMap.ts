// ==========================================
// CUSTOM HASH MAP - BUCKET ARRAY & SEPARATE CHAINING
// Used in: Symbol frequency counting, Keyword extraction, Emotion tallies
// ==========================================

export class HashEntry<K, V> {
  key: K;
  value: V;
  next: HashEntry<K, V> | null;

  constructor(key: K, value: V, next: HashEntry<K, V> | null = null) {
    this.key = key;
    this.value = value;
    this.next = next;
  }
}

export interface HashMapTraceStep {
  stepIndex: number;
  action: 'HASH_COMPUTED' | 'BUCKET_LOCATED' | 'TRAVERSING_CHAIN' | 'COLLISION_RESOLVED' | 'VALUE_STORED' | 'REHASH_TRIGGERED';
  key: string;
  hashCode: number;
  bucketIndex: number;
  chainPosition: number;
  currentValue: any;
  explanation: string;
  bucketsSnapshot: Array<{ index: number; chain: Array<{ key: string; value: any }> }>;
}

export class CustomHashMap<K extends string, V> {
  private buckets: Array<HashEntry<K, V> | null>;
  private _capacity: number;
  private _size: number;
  private readonly loadFactorThreshold: number;

  constructor(initialCapacity: number = 8, loadFactorThreshold: number = 0.75) {
    this._capacity = initialCapacity;
    this.buckets = new Array(this._capacity).fill(null);
    this._size = 0;
    this.loadFactorThreshold = loadFactorThreshold;
  }

  get size(): number {
    return this._size;
  }

  get capacity(): number {
    return this._capacity;
  }

  get loadFactor(): number {
    return this._size / this._capacity;
  }

  /**
   * Polynomial rolling hash function.
   * hash(s) = (s[0]*31^(n-1) + s[1]*31^(n-2) + ... + s[n-1]) % capacity
   */
  public computeHash(key: string): { rawHash: number; bucketIndex: number } {
    let rawHash = 0;
    const prime = 31;
    for (let i = 0; i < key.length; i++) {
      rawHash = (rawHash * prime + key.charCodeAt(i)) >>> 0; // maintain 32-bit unsigned
    }
    const bucketIndex = rawHash % this._capacity;
    return { rawHash, bucketIndex };
  }

  /**
   * Put key-value pair into hash map.
   * Average Time: O(1)
   * Worst Time: O(n) (when all keys hash to the same bucket)
   */
  put(key: K, value: V): void {
    const { bucketIndex } = this.computeHash(key);
    let head = this.buckets[bucketIndex];

    // Traverse chain to check if key exists
    while (head !== null) {
      if (head.key === key) {
        head.value = value;
        return;
      }
      head = head.next;
    }

    // Insert new entry at the head of the chain (Separate Chaining)
    const newEntry = new HashEntry<K, V>(key, value, this.buckets[bucketIndex]);
    this.buckets[bucketIndex] = newEntry;
    this._size++;

    // Check load factor and rehash if threshold is exceeded
    if (this.loadFactor > this.loadFactorThreshold) {
      this.rehash(this._capacity * 2);
    }
  }

  /**
   * Get value by key.
   * Average Time: O(1)
   */
  get(key: K): V | undefined {
    const { bucketIndex } = this.computeHash(key);
    let head = this.buckets[bucketIndex];

    while (head !== null) {
      if (head.key === key) {
        return head.value;
      }
      head = head.next;
    }
    return undefined;
  }

  /**
   * Increment numerical value by delta (defaults to 1).
   * Creates key with value delta if it doesn't exist.
   */
  increment(key: K, delta: number = 1): number {
    const existing = this.get(key) as unknown as number;
    const newVal = ((existing !== undefined ? existing : 0) + delta) as unknown as V;
    this.put(key, newVal);
    return newVal as unknown as number;
  }

  has(key: K): boolean {
    return this.get(key) !== undefined;
  }

  remove(key: K): boolean {
    const { bucketIndex } = this.computeHash(key);
    let current = this.buckets[bucketIndex];
    let prev: HashEntry<K, V> | null = null;

    while (current !== null) {
      if (current.key === key) {
        if (prev === null) {
          this.buckets[bucketIndex] = current.next;
        } else {
          prev.next = current.next;
        }
        this._size--;
        return true;
      }
      prev = current;
      current = current.next;
    }
    return false;
  }

  entries(): Array<[K, V]> {
    const result: Array<[K, V]> = [];
    for (let i = 0; i < this._capacity; i++) {
      let current = this.buckets[i];
      while (current !== null) {
        result.push([current.key, current.value]);
        current = current.next;
      }
    }
    return result;
  }

  keys(): K[] {
    return this.entries().map(([k]) => k);
  }

  values(): V[] {
    return this.entries().map(([, v]) => v);
  }

  clear(): void {
    this.buckets = new Array(this._capacity).fill(null);
    this._size = 0;
  }

  /**
   * Dynamic rehashing: doubles capacity and redistributes all entries.
   * Time Complexity: O(N) where N is total entries.
   */
  private rehash(newCapacity: number): void {
    const oldBuckets = this.buckets;
    this._capacity = newCapacity;
    this.buckets = new Array(this._capacity).fill(null);
    this._size = 0;

    for (const head of oldBuckets) {
      let current = head;
      while (current !== null) {
        this.put(current.key, current.value);
        current = current.next;
      }
    }
  }

  /**
   * Export snapshot of bucket array for visualization
   */
  getSnapshot(): Array<{ index: number; chain: Array<{ key: string; value: any }> }> {
    const snapshot: Array<{ index: number; chain: Array<{ key: string; value: any }> }> = [];
    for (let i = 0; i < this._capacity; i++) {
      const chain: Array<{ key: string; value: any }> = [];
      let current = this.buckets[i];
      while (current !== null) {
        chain.push({ key: current.key, value: current.value });
        current = current.next;
      }
      snapshot.push({ index: i, chain });
    }
    return snapshot;
  }

  /**
   * Instrumented put operation that records step-by-step trace for the DSA Laboratory.
   */
  tracePut(key: K, value: V): { steps: HashMapTraceStep[] } {
    const steps: HashMapTraceStep[] = [];
    const { rawHash, bucketIndex } = this.computeHash(key);

    steps.push({
      stepIndex: steps.length,
      action: 'HASH_COMPUTED',
      key,
      hashCode: rawHash,
      bucketIndex,
      chainPosition: 0,
      currentValue: value,
      explanation: `Calculated hash for "${key}": raw hash ${rawHash}, mapped to bucket index [${bucketIndex}] via modulo ${this._capacity}.`,
      bucketsSnapshot: this.getSnapshot(),
    });

    let head = this.buckets[bucketIndex];
    let position = 0;
    let found = false;

    if (head === null) {
      steps.push({
        stepIndex: steps.length,
        action: 'BUCKET_LOCATED',
        key,
        hashCode: rawHash,
        bucketIndex,
        chainPosition: 0,
        currentValue: value,
        explanation: `Bucket [${bucketIndex}] is currently empty. No collision detected.`,
        bucketsSnapshot: this.getSnapshot(),
      });
    } else {
      steps.push({
        stepIndex: steps.length,
        action: 'COLLISION_DETECTED',
        key,
        hashCode: rawHash,
        bucketIndex,
        chainPosition: 0,
        currentValue: head.value,
        explanation: `Bucket [${bucketIndex}] already contains key "${head.key}". Collision detected! Traversing separate chain.`,
        bucketsSnapshot: this.getSnapshot(),
      });

      while (head !== null) {
        if (head.key === key) {
          head.value = value;
          found = true;
          steps.push({
            stepIndex: steps.length,
            action: 'VALUE_STORED',
            key,
            hashCode: rawHash,
            bucketIndex,
            chainPosition: position,
            currentValue: value,
            explanation: `Found existing key "${key}" at chain position ${position}. Updated value to ${JSON.stringify(value)}.`,
            bucketsSnapshot: this.getSnapshot(),
          });
          return { steps };
        }
        head = head.next;
        position++;
      }
    }

    if (!found) {
      const newEntry = new HashEntry<K, V>(key, value, this.buckets[bucketIndex]);
      this.buckets[bucketIndex] = newEntry;
      this._size++;

      steps.push({
        stepIndex: steps.length,
        action: 'VALUE_STORED',
        key,
        hashCode: rawHash,
        bucketIndex,
        chainPosition: 0,
        currentValue: value,
        explanation: `Inserted new entry ("${key}" -> ${JSON.stringify(value)}) at the head of bucket [${bucketIndex}]. Size is now ${this._size}.`,
        bucketsSnapshot: this.getSnapshot(),
      });

      if (this.loadFactor > this.loadFactorThreshold) {
        const oldCap = this._capacity;
        this.rehash(this._capacity * 2);
        steps.push({
          stepIndex: steps.length,
          action: 'REHASH_TRIGGERED',
          key,
          hashCode: rawHash,
          bucketIndex,
          chainPosition: 0,
          currentValue: value,
          explanation: `Load factor ${(this._size / oldCap).toFixed(2)} exceeded threshold ${this.loadFactorThreshold}. Rehashed from ${oldCap} to ${this._capacity} buckets!`,
          bucketsSnapshot: this.getSnapshot(),
        });
      }
    }

    return { steps };
  }
}
