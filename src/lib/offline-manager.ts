import { useState, useRef, useEffect, useCallback } from 'react';
import { Note } from '@/types';

export interface OfflineStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
  clear(): Promise<void>;
  keys(): Promise<string[]>;
}

export class IndexedDBStorage implements OfflineStorage {
  private db: IDBDatabase | null = null;
  private readonly dbName = 'NotionWikiOffline';
  private readonly storeName = 'notes';

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'id' });
          store.createIndex('updatedAt', 'updatedAt', { unique: false });
          store.createIndex('folderId', 'folderId', { unique: false });
        }
      };
    });
  }

  private async getObjectStore(mode: IDBTransactionMode = 'readonly'): Promise<IDBObjectStore> {
    if (!this.db) await this.init();
    const transaction = this.db!.transaction([this.storeName], mode);
    return transaction.objectStore(this.storeName);
  }

  async getItem(key: string): Promise<string | null> {
    const store = await this.getObjectStore();
    return new Promise((resolve, reject) => {
      const request = store.get(key);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? JSON.stringify(result) : null);
      };
    });
  }

  async setItem(key: string, value: string): Promise<void> {
    const note = JSON.parse(value);
    const store = await this.getObjectStore('readwrite');
    return new Promise((resolve, reject) => {
      const request = store.put(note);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async removeItem(key: string): Promise<void> {
    const store = await this.getObjectStore('readwrite');
    return new Promise((resolve, reject) => {
      const request = store.delete(key);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async clear(): Promise<void> {
    const store = await this.getObjectStore('readwrite');
    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async keys(): Promise<string[]> {
    const store = await this.getObjectStore();
    return new Promise((resolve, reject) => {
      const request = store.getAllKeys();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result as string[]);
    });
  }
}

export interface SyncOperation {
  type: 'create' | 'update' | 'delete';
  noteId: string;
  note?: Note;
  timestamp: number;
  retryCount?: number;
}

export interface OfflineManagerOptions {
  storage?: OfflineStorage;
  syncEndpoint?: string;
  maxRetries?: number;
  onSyncStart?: () => void;
  onSyncComplete?: (synced: number, failed: number) => void;
  onSyncError?: (error: Error) => void;
  onStatusChange?: (status: 'online' | 'offline' | 'syncing') => void;
}

export class OfflineManager {
  private storage: OfflineStorage;
  private isOnline = navigator.onLine;
  private syncQueue: SyncOperation[] = [];
  private isSyncing = false;
  private syncTimer: NodeJS.Timeout | null = null;

  constructor(private options: OfflineManagerOptions = {}) {
    this.storage = options.storage || new IndexedDBStorage();
    this.setupEventListeners();
    this.loadSyncQueue();
  }

  private setupEventListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.options.onStatusChange?.('online');
      this.startSync();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.options.onStatusChange?.('offline');
      this.stopSync();
    });
  }

  private async loadSyncQueue() {
    try {
      const queueData = await this.storage.getItem('syncQueue');
      if (queueData) {
        this.syncQueue = JSON.parse(queueData);
      }
    } catch (error) {
      console.error('Failed to load sync queue:', error);
    }
  }

  private async saveSyncQueue() {
    try {
      await this.storage.setItem('syncQueue', JSON.stringify(this.syncQueue));
    } catch (error) {
      console.error('Failed to save sync queue:', error);
    }
  }

  private startSync() {
    if (this.syncTimer) return;
    
    this.syncTimer = setInterval(() => {
      if (this.isOnline && !this.isSyncing && this.syncQueue.length > 0) {
        this.processSyncQueue();
      }
    }, 5000); // Sync every 5 seconds when online
  }

  private stopSync() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
  }

  private async processSyncQueue() {
    if (this.isSyncing || !this.isOnline) return;

    this.isSyncing = true;
    this.options.onStatusChange?.('syncing');
    this.options.onSyncStart?.();

    const maxRetries = this.options.maxRetries || 3;
    let synced = 0;
    let failed = 0;

    try {
      const operationsToProcess = [...this.syncQueue];
      this.syncQueue = [];

      for (const operation of operationsToProcess) {
        try {
          await this.executeSyncOperation(operation);
          synced++;
        } catch (error) {
          console.error('Sync operation failed:', error);
          
          const retryCount = (operation.retryCount || 0) + 1;
          if (retryCount <= maxRetries) {
            // Retry later
            operation.retryCount = retryCount;
            this.syncQueue.push(operation);
          } else {
            failed++;
            this.options.onSyncError?.(error as Error);
          }
        }
      }

      await this.saveSyncQueue();
    } finally {
      this.isSyncing = false;
      this.options.onStatusChange?.(this.isOnline ? 'online' : 'offline');
      this.options.onSyncComplete?.(synced, failed);
    }
  }

  private async executeSyncOperation(operation: SyncOperation): Promise<void> {
    if (!this.options.syncEndpoint) {
      throw new Error('No sync endpoint configured');
    }

    const response = await fetch(this.options.syncEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(operation),
    });

    if (!response.ok) {
      throw new Error(`Sync failed: ${response.statusText}`);
    }
  }

  // Public API
  public async saveNote(note: Note): Promise<void> {
    // Save to local storage
    await this.storage.setItem(note.id, JSON.stringify(note));

    // Add to sync queue if online
    if (this.isOnline) {
      const operation: SyncOperation = {
        type: 'update',
        noteId: note.id,
        note,
        timestamp: Date.now(),
      };
      
      this.syncQueue.push(operation);
      await this.saveSyncQueue();
    }
  }

  public async getNote(noteId: string): Promise<Note | null> {
    try {
      const noteData = await this.storage.getItem(noteId);
      return noteData ? JSON.parse(noteData) : null;
    } catch (error) {
      console.error('Failed to get note:', error);
      return null;
    }
  }

  public async deleteNote(noteId: string): Promise<void> {
    // Remove from local storage
    await this.storage.removeItem(noteId);

    // Add to sync queue if online
    if (this.isOnline) {
      const operation: SyncOperation = {
        type: 'delete',
        noteId,
        timestamp: Date.now(),
      };
      
      this.syncQueue.push(operation);
      await this.saveSyncQueue();
    }
  }

  public async getAllNotes(): Promise<Note[]> {
    try {
      const keys = await this.storage.keys();
      const notes: Note[] = [];

      for (const key of keys) {
        if (key !== 'syncQueue') {
          const noteData = await this.storage.getItem(key);
          if (noteData) {
            notes.push(JSON.parse(noteData));
          }
        }
      }

      return notes;
    } catch (error) {
      console.error('Failed to get all notes:', error);
      return [];
    }
  }

  public isCurrentlyOnline(): boolean {
    return this.isOnline;
  }

  public getSyncQueueSize(): number {
    return this.syncQueue.length;
  }

  public isCurrentlySyncing(): boolean {
    return this.isSyncing;
  }

  public async forceSync(): Promise<{ synced: number; failed: number }> {
    if (!this.isOnline) {
      throw new Error('Cannot sync while offline');
    }

    const originalLength = this.syncQueue.length;
    await this.processSyncQueue();
    
    return {
      synced: originalLength - this.syncQueue.length,
      failed: this.syncQueue.filter(op => (op.retryCount || 0) >= (this.options.maxRetries || 3)).length,
    };
  }

  public async clearAllData(): Promise<void> {
    await this.storage.clear();
    this.syncQueue = [];
    await this.saveSyncQueue();
  }

  public destroy(): void {
    this.stopSync();
    window.removeEventListener('online', () => {});
    window.removeEventListener('offline', () => {});
  }
}

// React hook
export function useOfflineManager(options: OfflineManagerOptions = {}) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncQueueSize, setSyncQueueSize] = useState(0);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  const managerRef = useRef<OfflineManager | null>(null);

  useEffect(() => {
    managerRef.current = new OfflineManager({
      ...options,
      onStatusChange: (status) => {
        setIsOnline(status === 'online');
        setIsSyncing(status === 'syncing');
      },
      onSyncComplete: (synced, failed) => {
        setLastSyncTime(new Date());
        setSyncQueueSize(managerRef.current?.getSyncQueueSize() || 0);
      },
    });

    const interval = setInterval(() => {
      if (managerRef.current) {
        setSyncQueueSize(managerRef.current.getSyncQueueSize());
      }
    }, 1000);

    return () => {
      clearInterval(interval);
      managerRef.current?.destroy();
    };
  }, []);

  const saveNote = useCallback(async (note: Note) => {
    await managerRef.current?.saveNote(note);
  }, []);

  const getNote = useCallback(async (noteId: string) => {
    return await managerRef.current?.getNote(noteId) || null;
  }, []);

  const deleteNote = useCallback(async (noteId: string) => {
    await managerRef.current?.deleteNote(noteId);
  }, []);

  const getAllNotes = useCallback(async () => {
    return await managerRef.current?.getAllNotes() || [];
  }, []);

  const forceSync = useCallback(async () => {
    return await managerRef.current?.forceSync() || { synced: 0, failed: 0 };
  }, []);

  const clearAllData = useCallback(async () => {
    await managerRef.current?.clearAllData();
  }, []);

  return {
    isOnline,
    isSyncing,
    syncQueueSize,
    lastSyncTime,
    saveNote,
    getNote,
    deleteNote,
    getAllNotes,
    forceSync,
    clearAllData,
  };
}
