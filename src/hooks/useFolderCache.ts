import { useCallback, useRef, useEffect } from 'react';
import { Note, Folder } from '@/types';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
}

interface FolderCacheOptions {
  maxSize?: number;
  ttl?: number; // Time to live in milliseconds
  enableLRU?: boolean; // Least Recently Used eviction
}

interface FolderContent {
  notes: Note[];
  folders: Folder[];
  totalCount: number;
}

const DEFAULT_OPTIONS: FolderCacheOptions = {
  maxSize: 50,
  ttl: 10 * 60 * 1000, // 10 minutes
  enableLRU: true,
};

export function useFolderCache(options: FolderCacheOptions = {}) {
  const config = { ...DEFAULT_OPTIONS, ...options };
  const cacheRef = useRef<Map<string, CacheEntry<FolderContent>>>(new Map());
  const accessOrderRef = useRef<string[]>([]);

  // Clean up expired entries
  const cleanup = useCallback(() => {
    const now = Date.now();
    const cache = cacheRef.current;

    for (const [key, entry] of cache.entries()) {
      if (now - entry.timestamp > config.ttl!) {
        cache.delete(key);
        // Remove from access order
        const index = accessOrderRef.current.indexOf(key);
        if (index > -1) {
          accessOrderRef.current.splice(index, 1);
        }
      }
    }
  }, [config.ttl]);

  // Evict least recently used entries if cache is full
  const evictLRU = useCallback(() => {
    if (!config.enableLRU) return;

    const cache = cacheRef.current;
    const accessOrder = accessOrderRef.current;

    while (cache.size >= config.maxSize! && accessOrder.length > 0) {
      const lruKey = accessOrder.shift();
      if (lruKey) {
        cache.delete(lruKey);
      }
    }
  }, [config.maxSize, config.enableLRU]);

  // Update access order for LRU
  const updateAccessOrder = useCallback((key: string) => {
    if (!config.enableLRU) return;

    const accessOrder = accessOrderRef.current;
    const index = accessOrder.indexOf(key);
    
    if (index > -1) {
      accessOrder.splice(index, 1);
    }
    accessOrder.push(key);
  }, [config.enableLRU]);

  // Get cached data
  const get = useCallback((folderId: string | null): FolderContent | null => {
    const key = folderId || 'root';
    const entry = cacheRef.current.get(key);

    if (!entry) {
      return null;
    }

    const now = Date.now();
    
    // Check if entry is expired
    if (now - entry.timestamp > config.ttl!) {
      cacheRef.current.delete(key);
      const index = accessOrderRef.current.indexOf(key);
      if (index > -1) {
        accessOrderRef.current.splice(index, 1);
      }
      return null;
    }

    // Update access information
    entry.accessCount++;
    entry.lastAccessed = now;
    updateAccessOrder(key);

    return entry.data;
  }, [config.ttl, updateAccessOrder]);

  // Set cached data
  const set = useCallback((
    folderId: string | null, 
    data: FolderContent
  ) => {
    const key = folderId || 'root';
    const now = Date.now();

    cacheRef.current.set(key, {
      data,
      timestamp: now,
      accessCount: 1,
      lastAccessed: now,
    });

    updateAccessOrder(key);
    evictLRU();
  }, [updateAccessOrder, evictLRU]);

  // Delete cached data
  const del = useCallback((folderId: string | null) => {
    const key = folderId || 'root';
    cacheRef.current.delete(key);
    
    const index = accessOrderRef.current.indexOf(key);
    if (index > -1) {
      accessOrderRef.current.splice(index, 1);
    }
  }, []);

  // Clear all cache
  const clear = useCallback(() => {
    cacheRef.current.clear();
    accessOrderRef.current = [];
  }, []);

  // Get cache statistics
  const getStats = useCallback(() => {
    const cache = cacheRef.current;
    const entries = Array.from(cache.values());
    
    return {
      size: cache.size,
      maxSize: config.maxSize!,
      hitRate: entries.reduce((sum, entry) => sum + entry.accessCount, 0),
      oldestEntry: entries.length > 0 
        ? Math.min(...entries.map(entry => entry.timestamp))
        : null,
      newestEntry: entries.length > 0
        ? Math.max(...entries.map(entry => entry.timestamp))
        : null,
    };
  }, [config.maxSize]);

  // Periodic cleanup
  useEffect(() => {
    const interval = setInterval(cleanup, config.ttl! / 2); // Clean up twice per TTL
    return () => clearInterval(interval);
  }, [cleanup, config.ttl]);

  // Preload frequently accessed folders
  const preload = useCallback(async (folderIds: string[]) => {
    // In a real implementation, this would fetch data in parallel
    // For now, just mark them as recently accessed
    folderIds.forEach(id => {
      const key = id || 'root';
      updateAccessOrder(key);
    });
  }, [updateAccessOrder]);

  return {
    get,
    set,
    delete: del,
    clear,
    getStats,
    preload,
    cleanup,
  };
}

// Hook for folder access tracking
export function useFolderAccessTracking() {
  const accessHistory = useRef<Map<string, number>>(new Map());

  const trackAccess = useCallback((folderId: string | null) => {
    const key = folderId || 'root';
    const currentCount = accessHistory.current.get(key) || 0;
    accessHistory.current.set(key, currentCount + 1);
  }, []);

  const getFrequentlyAccessed = useCallback((limit: number = 5): string[] => {
    const sorted = Array.from(accessHistory.current.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([folderId]) => folderId === 'root' ? null : folderId);

    return sorted as string[];
  }, []);

  const clearHistory = useCallback(() => {
    accessHistory.current.clear();
  }, []);

  return {
    trackAccess,
    getFrequentlyAccessed,
    clearHistory,
  };
}
