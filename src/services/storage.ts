// ==========================================
// STORAGE SERVICE - INDEXEDDB WITH LOCALSTORAGE FALLBACK
// Local-first persistent storage abstraction with JSON Export/Import
// ==========================================

import { Dream, DreamDraft } from '../types';
import { generateSampleDreams } from './sampleData';

const DB_NAME = 'DreamJournalDecoderDB';
const DB_VERSION = 1;
const STORE_NAME = 'dreams';
const LOCAL_STORAGE_KEY = 'djd_dreams_fallback';
const DRAFT_KEY = 'djd_dream_editor_draft';
const FIRST_RUN_KEY = 'djd_first_run_completed';

class StorageService {
  private dbPromise: Promise<IDBDatabase | null>;

  constructor() {
    this.dbPromise = this.initIndexedDB();
  }

  private initIndexedDB(): Promise<IDBDatabase | null> {
    if (typeof window === 'undefined' || !window.indexedDB) {
      console.warn('IndexedDB not supported, using localStorage fallback.');
      return Promise.resolve(null);
    }

    return new Promise((resolve) => {
      try {
        const request = window.indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            store.createIndex('dreamDate', 'dreamDate', { unique: false });
            store.createIndex('createdAt', 'createdAt', { unique: false });
          }
        };

        request.onsuccess = (event) => {
          resolve((event.target as IDBOpenDBRequest).result);
        };

        request.onerror = () => {
          console.warn('Failed to open IndexedDB, using localStorage.');
          resolve(null);
        };
      } catch (err) {
        console.warn('IndexedDB initialization failed, falling back:', err);
        resolve(null);
      }
    });
  }

  // Fallback helper methods for LocalStorage
  private getFromLocalStorage(): Dream[] {
    try {
      const data = localStorage.getItem(LOCAL_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private saveToLocalStorage(dreams: Dream[]): void {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(dreams));
    } catch (e) {
      console.error('LocalStorage save error:', e);
    }
  }

  /**
   * Retrieves all dreams, ordered by dreamDate descending.
   */
  async getAllDreams(): Promise<Dream[]> {
    const db = await this.dbPromise;

    if (!db) {
      const dreams = this.getFromLocalStorage();
      return dreams.sort((a, b) => b.dreamDate.localeCompare(a.dreamDate));
    }

    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onsuccess = () => {
          const results = (request.result as Dream[]) || [];
          results.sort((a, b) => b.dreamDate.localeCompare(a.dreamDate));
          resolve(results);
        };

        request.onerror = () => {
          resolve(this.getFromLocalStorage());
        };
      } catch {
        resolve(this.getFromLocalStorage());
      }
    });
  }

  /**
   * Retrieves a single dream by ID.
   */
  async getDreamById(id: string): Promise<Dream | undefined> {
    const db = await this.dbPromise;

    if (!db) {
      return this.getFromLocalStorage().find(d => d.id === id);
    }

    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const request = store.get(id);

        request.onsuccess = () => {
          resolve(request.result as Dream | undefined);
        };

        request.onerror = () => {
          resolve(this.getFromLocalStorage().find(d => d.id === id));
        };
      } catch {
        resolve(this.getFromLocalStorage().find(d => d.id === id));
      }
    });
  }

  /**
   * Saves or updates a dream.
   */
  async saveDream(dream: Dream): Promise<void> {
    // Keep localStorage in sync as backup
    const local = this.getFromLocalStorage();
    const idx = local.findIndex(d => d.id === dream.id);
    if (idx >= 0) {
      local[idx] = dream;
    } else {
      local.push(dream);
    }
    this.saveToLocalStorage(local);

    const db = await this.dbPromise;
    if (!db) return;

    return new Promise((resolve, reject) => {
      try {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const request = store.put(dream);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Deletes a dream by ID.
   */
  async deleteDream(id: string): Promise<void> {
    const local = this.getFromLocalStorage().filter(d => d.id !== id);
    this.saveToLocalStorage(local);

    const db = await this.dbPromise;
    if (!db) return;

    return new Promise((resolve, reject) => {
      try {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const request = store.delete(id);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Populates initial sample data if requested by the user.
   */
  async seedSampleData(): Promise<Dream[]> {
    const samples = generateSampleDreams();
    for (const sample of samples) {
      await this.saveDream(sample);
    }
    localStorage.setItem(FIRST_RUN_KEY, 'true');
    return samples;
  }

  /**
   * Removes only fictional sample dreams, preserving user dreams.
   */
  async clearSampleData(): Promise<void> {
    const dreams = await this.getAllDreams();
    for (const dream of dreams) {
      if (dream.isSample) {
        await this.deleteDream(dream.id);
      }
    }
  }

  /**
   * Clears all dreams in database.
   */
  async clearAllData(): Promise<void> {
    this.saveToLocalStorage([]);
    const db = await this.dbPromise;
    if (!db) return;

    return new Promise((resolve, reject) => {
      try {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const request = store.clear();

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Checks if user has already gone through the first run selection.
   */
  hasCompletedFirstRun(): boolean {
    return localStorage.getItem(FIRST_RUN_KEY) === 'true';
  }

  setFirstRunCompleted(): void {
    localStorage.setItem(FIRST_RUN_KEY, 'true');
  }

  // Draft Autosave Methods
  saveDraft(draft: DreamDraft): void {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...draft, savedAt: Date.now() }));
    } catch (e) {
      console.warn('Draft save failed:', e);
    }
  }

  getDraft(): (DreamDraft & { savedAt?: number }) | null {
    try {
      const data = localStorage.getItem(DRAFT_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  clearDraft(): void {
    localStorage.removeItem(DRAFT_KEY);
  }

  // Export / Import JSON
  async exportAsJSON(): Promise<string> {
    const dreams = await this.getAllDreams();
    const exportPayload = {
      app: 'Dream Journal Decoder',
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      dreamCount: dreams.length,
      dreams,
    };
    return JSON.stringify(exportPayload, null, 2);
  }

  async importFromJSON(jsonString: string): Promise<{ success: boolean; count: number; error?: string }> {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed || !Array.isArray(parsed.dreams)) {
        return { success: false, count: 0, error: 'Invalid JSON schema. Expected { dreams: [...] } structure.' };
      }

      let importedCount = 0;
      for (const item of parsed.dreams) {
        if (item.id && item.title && item.narrative && item.dreamDate) {
          await this.saveDream(item as Dream);
          importedCount++;
        }
      }

      return { success: true, count: importedCount };
    } catch (err: any) {
      return { success: false, count: 0, error: err.message || 'Error parsing JSON file.' };
    }
  }
}

export const storageService = new StorageService();
