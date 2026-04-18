import { useState, useRef, useEffect, useCallback } from 'react';
import { Note } from '@/types';

export interface AutoSaveOptions {
  debounceMs?: number;
  maxRetries?: number;
  conflictResolution?: 'local' | 'remote' | 'merge' | 'prompt';
  onConflict?: (local: Note, remote: Note) => Promise<Note>;
  onSave?: (note: Note) => Promise<void>;
  onStatusChange?: (status: AutoSaveStatus) => void;
}

export type AutoSaveStatus = 'idle' | 'saving' | 'saved' | 'conflict' | 'error' | 'offline';

export interface ConflictResolution {
  type: 'local' | 'remote' | 'merged';
  note: Note;
  timestamp: Date;
}

export class AutoSaveManager {
  private debounceTimer: NodeJS.Timeout | null = null;
  private retryCount = 0;
  private status: AutoSaveStatus = 'idle';
  private lastSavedNote: Note | null = null;
  private pendingSave: Note | null = null;
  private isOnline = navigator.onLine;
  private saveQueue: Note[] = [];
  private isProcessingQueue = false;

  constructor(private options: AutoSaveOptions = {}) {
    this.setupOnlineStatusListener();
  }

  private setupOnlineStatusListener() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.setStatus('idle');
      this.processSaveQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.setStatus('offline');
    });
  }

  private setStatus(status: AutoSaveStatus) {
    this.status = status;
    this.options.onStatusChange?.(status);
  }

  private async processSaveQueue() {
    if (this.isProcessingQueue || this.saveQueue.length === 0) return;

    this.isProcessingQueue = true;
    this.setStatus('saving');

    while (this.saveQueue.length > 0 && this.isOnline) {
      const note = this.saveQueue.shift()!;
      
      try {
        await this.performSave(note);
        this.retryCount = 0;
      } catch (error) {
        console.error('Failed to save note:', error);
        
        if (this.retryCount < (this.options.maxRetries || 3)) {
          this.retryCount++;
          // Put it back in the queue with exponential backoff
          setTimeout(() => {
            this.saveQueue.unshift(note);
          }, Math.pow(2, this.retryCount) * 1000);
          break;
        } else {
          this.setStatus('error');
          break;
        }
      }
    }

    this.isProcessingQueue = false;
    
    if (this.saveQueue.length === 0) {
      this.setStatus('saved');
      setTimeout(() => this.setStatus('idle'), 2000);
    }
  }

  private async performSave(note: Note): Promise<void> {
    if (!this.isOnline) {
      this.saveQueue.push(note);
      this.setStatus('offline');
      return;
    }

    // Check for conflicts by comparing with last saved version
    if (this.lastSavedNote && this.lastSavedNote.id === note.id) {
      const conflict = await this.detectConflict(this.lastSavedNote, note);
      
      if (conflict) {
        return await this.handleConflict(this.lastSavedNote, note);
      }
    }

    await this.options.onSave?.(note);
    this.lastSavedNote = { ...note };
  }

  private async detectConflict(local: Note, remote: Note): Promise<boolean> {
    // Simple conflict detection based on timestamps
    const localTime = new Date(local.updatedAt).getTime();
    const remoteTime = new Date(remote.updatedAt).getTime();
    
    // If remote version is newer, there might be a conflict
    return remoteTime > localTime && localTime < Date.now() - 5000; // 5 second grace period
  }

  private async handleConflict(local: Note, remote: Note): Promise<void> {
    this.setStatus('conflict');

    const resolution = await this.resolveConflict(local, remote);
    
    if (resolution) {
      await this.performSave(resolution.note);
      this.lastSavedNote = { ...resolution.note };
    } else {
      // User cancelled or failed to resolve
      this.setStatus('error');
    }
  }

  private async resolveConflict(local: Note, remote: Note): Promise<ConflictResolution | null> {
    const resolution = this.options.conflictResolution || 'prompt';

    switch (resolution) {
      case 'local':
        return { type: 'local', note: local, timestamp: new Date() };
      
      case 'remote':
        return { type: 'remote', note: remote, timestamp: new Date() };
      
      case 'merge':
        return { type: 'merged', note: this.mergeNotes(local, remote), timestamp: new Date() };
      
      case 'prompt':
        return await this.promptForResolution(local, remote);
      
      default:
        return { type: 'local', note: local, timestamp: new Date() };
    }
  }

  private mergeNotes(local: Note, remote: Note): Note {
    // Simple merge strategy - prefer most recent content for each field
    const merged: Note = {
      ...local,
      id: local.id,
      title: this.mergeText(local.title, remote.title),
      content: this.mergeContent(local.content, remote.content),
      tags: [...new Set([...local.tags, ...remote.tags])],
      updatedAt: new Date(),
      // Keep other fields from local version
      folderId: local.folderId,
      isArchived: local.isArchived,
      isDeleted: local.isDeleted,
    };

    return merged;
  }

  private mergeText(local: string, remote: string): string {
    // Simple text merge - prefer longer, more recent version
    if (remote.length > local.length) return remote;
    return local;
  }

  private mergeContent(local: any, remote: any): any {
    // For complex content objects, prefer the one with more content
    const localSize = JSON.stringify(local).length;
    const remoteSize = JSON.stringify(remote).length;
    
    if (remoteSize > localSize) return remote;
    return local;
  }

  private async promptForResolution(local: Note, remote: Note): Promise<ConflictResolution | null> {
    if (!this.options.onConflict) {
      return { type: 'local', note: local, timestamp: new Date() };
    }

    try {
      const resolvedNote = await this.options.onConflict(local, remote);
      return { type: 'merged', note: resolvedNote, timestamp: new Date() };
    } catch (error) {
      console.error('Conflict resolution failed:', error);
      return null;
    }
  }

  public save(note: Note): void {
    this.pendingSave = note;

    // Clear existing timer
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    // Set new timer
    this.debounceTimer = setTimeout(() => {
      this.saveQueue.push(note);
      this.processSaveQueue();
      this.pendingSave = null;
    }, this.options.debounceMs || 1000);
  }

  public forceSave(note: Note): Promise<void> {
    // Clear any pending debounced save
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }

    this.saveQueue.push(note);
    return this.processSaveQueue();
  }

  public getStatus(): AutoSaveStatus {
    return this.status;
  }

  public isSaving(): boolean {
    return this.status === 'saving' || this.isProcessingQueue;
  }

  public getQueueSize(): number {
    return this.saveQueue.length;
  }

  public clearQueue(): void {
    this.saveQueue = [];
    this.setStatus('idle');
  }

  public destroy(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    
    window.removeEventListener('online', () => {});
    window.removeEventListener('offline', () => {});
  }
}

// Hook for React components
export function useAutoSave(options: AutoSaveOptions) {
  const [status, setStatus] = useState<AutoSaveStatus>('idle');
  const [queueSize, setQueueSize] = useState(0);
  
  const autoSaveRef = useRef<AutoSaveManager | null>(null);

  useEffect(() => {
    autoSaveRef.current = new AutoSaveManager({
      ...options,
      onStatusChange: setStatus,
    });

    const interval = setInterval(() => {
      if (autoSaveRef.current) {
        setQueueSize(autoSaveRef.current.getQueueSize());
      }
    }, 1000);

    return () => {
      clearInterval(interval);
      autoSaveRef.current?.destroy();
    };
  }, []);

  const save = useCallback((note: Note) => {
    autoSaveRef.current?.save(note);
  }, []);

  const forceSave = useCallback(async (note: Note) => {
    return await autoSaveRef.current?.forceSave(note);
  }, []);

  const clearQueue = useCallback(() => {
    autoSaveRef.current?.clearQueue();
  }, []);

  return {
    save,
    forceSave,
    clearQueue,
    status,
    queueSize,
    isSaving: status === 'saving' || status === 'conflict',
    isOnline: navigator.onLine,
  };
}
