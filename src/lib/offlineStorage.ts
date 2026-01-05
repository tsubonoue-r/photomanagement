/**
 * Offline Storage Utility
 * IndexedDB wrapper for offline photo storage and queue management
 */

const DB_NAME = 'photomanagement-offline';
const DB_VERSION = 1;
const STORE_NAME = 'photo-queue';

export interface OfflinePhoto {
  id: string;
  projectId: string;
  categoryId?: string;
  imageBlob: Blob;
  thumbnailBlob?: Blob;
  title?: string;
  description?: string;
  blackboardData?: {
    templateId: string;
    values: { fieldId: string; value: string | number | null }[];
    position: { x: number; y: number };
    scale: number;
  };
  metadata: {
    width: number;
    height: number;
    size: number;
    mimeType: string;
    capturedAt: Date;
    location?: {
      latitude: number;
      longitude: number;
      accuracy: number;
    };
  };
  status: 'pending' | 'uploading' | 'failed' | 'completed';
  retryCount: number;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

type OfflinePhotoInput = Omit<OfflinePhoto, 'status' | 'retryCount' | 'createdAt' | 'updatedAt'>;

class OfflineStorageManager {
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
        reject(new Error('Failed to open database'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(request.result);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create photo queue store
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('projectId', 'projectId', { unique: false });
          store.createIndex('status', 'status', { unique: false });
          store.createIndex('createdAt', 'createdAt', { unique: false });
        }
      };
    });

    return this.dbPromise;
  }

  /**
   * Add a photo to the offline queue
   */
  async addPhoto(photo: OfflinePhotoInput): Promise<string> {
    const db = await this.openDB();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);

      const now = new Date();
      const offlinePhoto: OfflinePhoto = {
        ...photo,
        status: 'pending',
        retryCount: 0,
        createdAt: now,
        updatedAt: now,
      };

      const request = store.add(offlinePhoto);

      request.onsuccess = () => {
        resolve(photo.id);
      };

      request.onerror = () => {
        reject(new Error('Failed to add photo to offline queue'));
      };
    });
  }

  /**
   * Get all photos from the offline queue
   */
  async getAllPhotos(): Promise<OfflinePhoto[]> {
    const db = await this.openDB();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result || []);
      };

      request.onerror = () => {
        reject(new Error('Failed to get photos from offline queue'));
      };
    });
  }

  /**
   * Get pending photos (ready for upload)
   */
  async getPendingPhotos(): Promise<OfflinePhoto[]> {
    const db = await this.openDB();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const index = store.index('status');
      const request = index.getAll('pending');

      request.onsuccess = () => {
        resolve(request.result || []);
      };

      request.onerror = () => {
        reject(new Error('Failed to get pending photos'));
      };
    });
  }

  /**
   * Get photos by project ID
   */
  async getPhotosByProject(projectId: string): Promise<OfflinePhoto[]> {
    const db = await this.openDB();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const index = store.index('projectId');
      const request = index.getAll(projectId);

      request.onsuccess = () => {
        resolve(request.result || []);
      };

      request.onerror = () => {
        reject(new Error('Failed to get photos by project'));
      };
    });
  }

  /**
   * Update photo status
   */
  async updatePhotoStatus(
    id: string,
    status: OfflinePhoto['status'],
    errorMessage?: string
  ): Promise<void> {
    const db = await this.openDB();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const photo = getRequest.result as OfflinePhoto;
        if (!photo) {
          reject(new Error('Photo not found'));
          return;
        }

        const updatedPhoto: OfflinePhoto = {
          ...photo,
          status,
          errorMessage: errorMessage || photo.errorMessage,
          retryCount: status === 'failed' ? photo.retryCount + 1 : photo.retryCount,
          updatedAt: new Date(),
        };

        const updateRequest = store.put(updatedPhoto);

        updateRequest.onsuccess = () => resolve();
        updateRequest.onerror = () => reject(new Error('Failed to update photo status'));
      };

      getRequest.onerror = () => {
        reject(new Error('Failed to get photo'));
      };
    });
  }

  /**
   * Remove a photo from the queue
   */
  async removePhoto(id: string): Promise<void> {
    const db = await this.openDB();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to remove photo'));
    });
  }

  /**
   * Clear all completed photos
   */
  async clearCompleted(): Promise<number> {
    const db = await this.openDB();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const index = store.index('status');
      const request = index.getAllKeys('completed');
      let deletedCount = 0;

      request.onsuccess = () => {
        const keys = request.result;
        keys.forEach((key) => {
          store.delete(key);
          deletedCount++;
        });
        resolve(deletedCount);
      };

      request.onerror = () => {
        reject(new Error('Failed to clear completed photos'));
      };
    });
  }

  /**
   * Get queue statistics
   */
  async getStats(): Promise<{
    total: number;
    pending: number;
    uploading: number;
    failed: number;
    completed: number;
    totalSize: number;
  }> {
    const photos = await this.getAllPhotos();

    return {
      total: photos.length,
      pending: photos.filter((p) => p.status === 'pending').length,
      uploading: photos.filter((p) => p.status === 'uploading').length,
      failed: photos.filter((p) => p.status === 'failed').length,
      completed: photos.filter((p) => p.status === 'completed').length,
      totalSize: photos.reduce((sum, p) => sum + p.metadata.size, 0),
    };
  }

  /**
   * Check storage usage
   */
  async getStorageUsage(): Promise<{ used: number; available: number } | null> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return {
        used: estimate.usage || 0,
        available: estimate.quota || 0,
      };
    }
    return null;
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
export const offlineStorage = new OfflineStorageManager();

// Export types
export type { OfflinePhotoInput };
