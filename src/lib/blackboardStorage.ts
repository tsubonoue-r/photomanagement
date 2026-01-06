/**
 * Blackboard Storage Utility
 * IndexedDB wrapper for saved blackboard templates and configurations
 */

import type { BlackboardFieldValue } from '@/types/blackboard';

export type { BlackboardFieldValue };

const DB_NAME = 'photomanagement-blackboard';
const DB_VERSION = 1;
const SAVED_BOARDS_STORE = 'saved-blackboards';
const PROJECT_DEFAULTS_STORE = 'project-defaults';

/**
 * Saved blackboard configuration
 */
export interface SavedBlackboard {
  id: string;
  name: string;
  projectId?: string;
  values: BlackboardFieldValue[];
  overlayState: {
    position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'custom';
    customPosition: { x: number; y: number };
    scale: number;
    opacity: number;
  };
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Project default blackboard mapping
 */
export interface ProjectDefaultBlackboard {
  projectId: string;
  blackboardId: string;
  updatedAt: Date;
}

export type SavedBlackboardInput = Omit<SavedBlackboard, 'id' | 'createdAt' | 'updatedAt'>;

class BlackboardStorageManager {
  private db: IDBDatabase | null = null;
  private dbPromise: Promise<IDBDatabase> | null = null;

  /**
   * Open the database connection
   */
  private async openDB(): Promise<IDBDatabase> {
    if (this.db) return this.db;
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      if (typeof indexedDB === 'undefined') {
        reject(new Error('IndexedDB is not supported'));
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        reject(new Error('Failed to open blackboard database'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(request.result);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create saved blackboards store
        if (!db.objectStoreNames.contains(SAVED_BOARDS_STORE)) {
          const store = db.createObjectStore(SAVED_BOARDS_STORE, { keyPath: 'id' });
          store.createIndex('projectId', 'projectId', { unique: false });
          store.createIndex('name', 'name', { unique: false });
          store.createIndex('isDefault', 'isDefault', { unique: false });
          store.createIndex('createdAt', 'createdAt', { unique: false });
        }

        // Create project defaults store
        if (!db.objectStoreNames.contains(PROJECT_DEFAULTS_STORE)) {
          const store = db.createObjectStore(PROJECT_DEFAULTS_STORE, { keyPath: 'projectId' });
          store.createIndex('blackboardId', 'blackboardId', { unique: false });
        }
      };
    });

    return this.dbPromise;
  }

  /**
   * Generate a unique ID
   */
  private generateId(): string {
    return `bb_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Save a new blackboard
   */
  async saveBlackboard(input: SavedBlackboardInput): Promise<string> {
    const db = await this.openDB();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(SAVED_BOARDS_STORE, 'readwrite');
      const store = tx.objectStore(SAVED_BOARDS_STORE);

      const now = new Date();
      const id = this.generateId();
      const blackboard: SavedBlackboard = {
        ...input,
        id,
        createdAt: now,
        updatedAt: now,
      };

      const request = store.add(blackboard);

      request.onsuccess = () => {
        resolve(id);
      };

      request.onerror = () => {
        reject(new Error('黒板の保存に失敗しました'));
      };
    });
  }

  /**
   * Update an existing blackboard
   */
  async updateBlackboard(id: string, updates: Partial<SavedBlackboardInput>): Promise<void> {
    const db = await this.openDB();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(SAVED_BOARDS_STORE, 'readwrite');
      const store = tx.objectStore(SAVED_BOARDS_STORE);
      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const existing = getRequest.result as SavedBlackboard;
        if (!existing) {
          reject(new Error('黒板が見つかりません'));
          return;
        }

        const updated: SavedBlackboard = {
          ...existing,
          ...updates,
          updatedAt: new Date(),
        };

        const putRequest = store.put(updated);
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(new Error('黒板の更新に失敗しました'));
      };

      getRequest.onerror = () => {
        reject(new Error('黒板の取得に失敗しました'));
      };
    });
  }

  /**
   * Get a blackboard by ID
   */
  async getBlackboard(id: string): Promise<SavedBlackboard | null> {
    const db = await this.openDB();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(SAVED_BOARDS_STORE, 'readonly');
      const store = tx.objectStore(SAVED_BOARDS_STORE);
      const request = store.get(id);

      request.onsuccess = () => {
        resolve(request.result || null);
      };

      request.onerror = () => {
        reject(new Error('黒板の取得に失敗しました'));
      };
    });
  }

  /**
   * Get all saved blackboards
   */
  async getAllBlackboards(): Promise<SavedBlackboard[]> {
    const db = await this.openDB();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(SAVED_BOARDS_STORE, 'readonly');
      const store = tx.objectStore(SAVED_BOARDS_STORE);
      const request = store.getAll();

      request.onsuccess = () => {
        const results = request.result || [];
        // Sort by updatedAt desc
        results.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        resolve(results);
      };

      request.onerror = () => {
        reject(new Error('黒板一覧の取得に失敗しました'));
      };
    });
  }

  /**
   * Get blackboards by project ID
   */
  async getBlackboardsByProject(projectId: string): Promise<SavedBlackboard[]> {
    const db = await this.openDB();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(SAVED_BOARDS_STORE, 'readonly');
      const store = tx.objectStore(SAVED_BOARDS_STORE);
      const index = store.index('projectId');
      const request = index.getAll(projectId);

      request.onsuccess = () => {
        const results = request.result || [];
        results.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        resolve(results);
      };

      request.onerror = () => {
        reject(new Error('プロジェクトの黒板取得に失敗しました'));
      };
    });
  }

  /**
   * Get global blackboards (not tied to any project)
   */
  async getGlobalBlackboards(): Promise<SavedBlackboard[]> {
    const all = await this.getAllBlackboards();
    return all.filter(b => !b.projectId);
  }

  /**
   * Delete a blackboard
   */
  async deleteBlackboard(id: string): Promise<void> {
    const db = await this.openDB();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(SAVED_BOARDS_STORE, 'readwrite');
      const store = tx.objectStore(SAVED_BOARDS_STORE);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('黒板の削除に失敗しました'));
    });
  }

  /**
   * Set project default blackboard
   */
  async setProjectDefault(projectId: string, blackboardId: string): Promise<void> {
    const db = await this.openDB();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(PROJECT_DEFAULTS_STORE, 'readwrite');
      const store = tx.objectStore(PROJECT_DEFAULTS_STORE);

      const record: ProjectDefaultBlackboard = {
        projectId,
        blackboardId,
        updatedAt: new Date(),
      };

      const request = store.put(record);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('デフォルト黒板の設定に失敗しました'));
    });
  }

  /**
   * Get project default blackboard
   */
  async getProjectDefault(projectId: string): Promise<SavedBlackboard | null> {
    const db = await this.openDB();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(PROJECT_DEFAULTS_STORE, 'readonly');
      const store = tx.objectStore(PROJECT_DEFAULTS_STORE);
      const request = store.get(projectId);

      request.onsuccess = async () => {
        const mapping = request.result as ProjectDefaultBlackboard | undefined;
        if (mapping) {
          const blackboard = await this.getBlackboard(mapping.blackboardId);
          resolve(blackboard);
        } else {
          resolve(null);
        }
      };

      request.onerror = () => {
        reject(new Error('デフォルト黒板の取得に失敗しました'));
      };
    });
  }

  /**
   * Remove project default blackboard
   */
  async removeProjectDefault(projectId: string): Promise<void> {
    const db = await this.openDB();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(PROJECT_DEFAULTS_STORE, 'readwrite');
      const store = tx.objectStore(PROJECT_DEFAULTS_STORE);
      const request = store.delete(projectId);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('デフォルト設定の削除に失敗しました'));
    });
  }

  /**
   * Get statistics
   */
  async getStats(): Promise<{
    total: number;
    byProject: Map<string, number>;
    global: number;
  }> {
    const all = await this.getAllBlackboards();
    const byProject = new Map<string, number>();
    let global = 0;

    all.forEach(b => {
      if (b.projectId) {
        byProject.set(b.projectId, (byProject.get(b.projectId) || 0) + 1);
      } else {
        global++;
      }
    });

    return {
      total: all.length,
      byProject,
      global,
    };
  }

  /**
   * Close database connection
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.dbPromise = null;
    }
  }
}

// Export singleton instance
export const blackboardStorage = new BlackboardStorageManager();
