import { useState, useCallback, useEffect, useRef } from 'react';
import { Note, Folder } from '@/types';

interface Conflict<T> {
  id: string;
  type: 'create' | 'update' | 'delete' | 'move';
  localItem: T;
  remoteItem: T;
  timestamp: number;
  status: 'pending' | 'resolved' | 'ignored';
  resolution?: T;
}

interface ConflictResolutionOptions<T> {
  autoResolve?: boolean;
  resolutionStrategy?: 'local' | 'remote' | 'merge' | 'prompt';
  onConflict?: (conflict: Conflict<T>) => Promise<T>;
  mergeStrategy?: (local: T, remote: T) => T;
  conflictTimeout?: number;
}

export function useConflictResolution<T extends Note | Folder>(
  localItems: T[],
  remoteItems: T[],
  options: ConflictResolutionOptions<T> = {}
) {
  const {
    autoResolve = false,
    resolutionStrategy = 'prompt',
    onConflict,
    mergeStrategy,
    conflictTimeout = 30000, // 30 seconds
  } = options;

  const [conflicts, setConflicts] = useState<Conflict<T>[]>([]);
  const [isResolving, setIsResolving] = useState(false);
  const conflictTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Detect conflicts between local and remote items
  const detectConflicts = useCallback((
    local: T[],
    remote: T[]
  ): Conflict<T>[] => {
    const detectedConflicts: Conflict<T>[] = [];
    const remoteMap = new Map(remote.map(item => [item.id, item]));

    for (const localItem of local) {
      const remoteItem = remoteMap.get(localItem.id);
      
      if (!remoteItem) {
        // Local item doesn't exist remotely (deleted remotely)
        detectedConflicts.push({
          id: localItem.id,
          type: 'delete',
          localItem,
          remoteItem: {} as T, // Placeholder
          timestamp: Date.now(),
          status: 'pending',
        });
        continue;
      }

      // Compare timestamps to detect conflicts
      const localModified = new Date(localItem.updatedAt).getTime();
      const remoteModified = new Date(remoteItem.updatedAt).getTime();

      if (localModified !== remoteModified) {
        detectedConflicts.push({
          id: localItem.id,
          type: 'update',
          localItem,
          remoteItem,
          timestamp: Date.now(),
          status: 'pending',
        });
      }

      remoteMap.delete(localItem.id);
    }

    // Check for remote items that don't exist locally (created remotely)
    for (const remoteItem of remoteMap.values()) {
      detectedConflicts.push({
        id: remoteItem.id,
        type: 'create',
        localItem: {} as T, // Placeholder
        remoteItem,
        timestamp: Date.now(),
        status: 'pending',
      });
    }

    return detectedConflicts;
  }, []);

  // Resolve conflict based on strategy
  const resolveConflict = useCallback(async (
    conflict: Conflict<T>
  ): Promise<T> => {
    if (onConflict) {
      return await onConflict(conflict);
    }

    switch (resolutionStrategy) {
      case 'local':
        return conflict.localItem;
      
      case 'remote':
        return conflict.remoteItem;
      
      case 'merge':
        if (mergeStrategy) {
          return mergeStrategy(conflict.localItem, conflict.remoteItem);
        }
        // Default merge strategy: prefer most recent
        const localModified = new Date(conflict.localItem.updatedAt).getTime();
        const remoteModified = new Date(conflict.remoteItem.updatedAt).getTime();
        return localModified > remoteModified ? conflict.localItem : conflict.remoteItem;
      
      case 'prompt':
      default:
        throw new Error('Manual resolution required');
    }
  }, [onConflict, resolutionStrategy, mergeStrategy]);

  // Auto-resolve conflicts
  const autoResolveConflicts = useCallback(async () => {
    if (!autoResolve || conflicts.length === 0) return;

    setIsResolving(true);
    const resolvedConflicts: Conflict<T>[] = [];

    for (const conflict of conflicts) {
      try {
        const resolution = await resolveConflict(conflict);
        resolvedConflicts.push({
          ...conflict,
          status: 'resolved',
          resolution,
        });
      } catch (error) {
        console.error('Error resolving conflict:', error);
        resolvedConflicts.push({
          ...conflict,
          status: 'ignored',
        });
      }
    }

    setConflicts(resolvedConflicts);
    setIsResolving(false);
  }, [autoResolve, conflicts, resolveConflict]);

  // Manually resolve a specific conflict
  const resolveConflictManually = useCallback(async (
    conflictId: string,
    resolution: T
  ) => {
    setConflicts(prev => 
      prev.map(conflict => 
        conflict.id === conflictId
          ? { ...conflict, status: 'resolved', resolution }
          : conflict
      )
    );
  }, []);

  // Ignore a conflict
  const ignoreConflict = useCallback((conflictId: string) => {
    setConflicts(prev => 
      prev.map(conflict => 
        conflict.id === conflictId
          ? { ...conflict, status: 'ignored' }
          : conflict
      )
    );
  }, []);

  // Clear resolved conflicts
  const clearResolvedConflicts = useCallback(() => {
    setConflicts(prev => 
      prev.filter(conflict => conflict.status === 'pending')
    );
  }, []);

  // Check for conflicts when items change
  useEffect(() => {
    const detectedConflicts = detectConflicts(localItems, remoteItems);
    
    // Set timeout for each conflict
    detectedConflicts.forEach(conflict => {
      const timeout = setTimeout(() => {
        if (conflict.status === 'pending') {
          ignoreConflict(conflict.id);
        }
      }, conflictTimeout);

      conflictTimeoutsRef.current.set(conflict.id, timeout);
    });

    setConflicts(detectedConflicts);

    // Clear old timeouts
    return () => {
      for (const timeout of conflictTimeoutsRef.current.values()) {
        clearTimeout(timeout);
      }
      conflictTimeoutsRef.current.clear();
    };
  }, [localItems, remoteItems, detectConflicts, ignoreConflict, conflictTimeout]);

  // Auto-resolve if enabled
  useEffect(() => {
    if (autoResolve && conflicts.length > 0) {
      autoResolveConflicts();
    }
  }, [autoResolve, conflicts.length, autoResolveConflicts]);

  // Get resolved items
  const getResolvedItems = useCallback((): T[] => {
    const resolvedMap = new Map<string, T>();
    
    // Start with local items
    localItems.forEach(item => {
      resolvedMap.set(item.id, item);
    });

    // Apply conflict resolutions
    conflicts.forEach(conflict => {
      if (conflict.status === 'resolved' && conflict.resolution) {
        resolvedMap.set(conflict.id, conflict.resolution);
      } else if (conflict.status === 'ignored') {
        // Keep the local version
        resolvedMap.set(conflict.id, conflict.localItem);
      } else if (conflict.type === 'delete') {
        // Remove the item
        resolvedMap.delete(conflict.id);
      }
    });

    // Add remote-only items
    const remoteMap = new Map(remoteItems.map(item => [item.id, item]));
    conflicts.forEach(conflict => {
      if (conflict.type === 'create' && conflict.status === 'pending') {
        resolvedMap.set(conflict.id, conflict.remoteItem);
      }
      remoteMap.delete(conflict.id);
    });

    for (const remoteItem of remoteMap.values()) {
      resolvedMap.set(remoteItem.id, remoteItem);
    }

    return Array.from(resolvedMap.values());
  }, [localItems, remoteItems, conflicts]);

  // Get conflict summary
  const getConflictSummary = useCallback(() => {
    const summary = {
      total: conflicts.length,
      pending: conflicts.filter(c => c.status === 'pending').length,
      resolved: conflicts.filter(c => c.status === 'resolved').length,
      ignored: conflicts.filter(c => c.status === 'ignored').length,
      byType: {
        create: conflicts.filter(c => c.type === 'create').length,
        update: conflicts.filter(c => c.type === 'update').length,
        delete: conflicts.filter(c => c.type === 'delete').length,
        move: conflicts.filter(c => c.type === 'move').length,
      },
    };

    return summary;
  }, [conflicts]);

  return {
    // State
    conflicts,
    isResolving,
    hasConflicts: conflicts.some(c => c.status === 'pending'),

    // Actions
    resolveConflict,
    resolveConflictManually,
    ignoreConflict,
    clearResolvedConflicts,
    autoResolveConflicts,

    // Utilities
    getResolvedItems,
    getConflictSummary,
  };
}

// Hook for real-time conflict detection
export function useRealTimeConflictDetection<T extends Note | Folder>(
  items: T[],
  onConflictDetected: (conflicts: Conflict<T>[]) => void,
  options: {
    pollingInterval?: number;
    enableWebSocket?: boolean;
    websocketUrl?: string;
  } = {}
) {
  const {
    pollingInterval = 5000, // 5 seconds
    enableWebSocket = false,
    websocketUrl,
  } = options;

  const lastSyncTime = useRef<number>(Date.now());
  const websocketRef = useRef<WebSocket | null>(null);

  // Polling-based conflict detection
  const pollForConflicts = useCallback(async () => {
    try {
      // In a real implementation, this would fetch remote items
      // For now, simulate with a timeout
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Compare with current items to detect conflicts
      // This would be replaced with actual API calls
      const remoteItems = items; // Placeholder
      
      // Simple conflict detection based on timestamps
      const conflicts: Conflict<T>[] = [];
      const now = Date.now();
      
      for (const item of items) {
        const itemTime = new Date(item.updatedAt).getTime();
        if (now - itemTime < pollingInterval) {
          // Item was recently modified, potential conflict
          conflicts.push({
            id: item.id,
            type: 'update',
            localItem: item,
            remoteItem: item, // Would be actual remote item
            timestamp: now,
            status: 'pending',
          });
        }
      }

      if (conflicts.length > 0) {
        onConflictDetected(conflicts);
      }
      
      lastSyncTime.current = now;
    } catch (error) {
      console.error('Error polling for conflicts:', error);
    }
  }, [items, pollingInterval, onConflictDetected]);

  // WebSocket-based conflict detection
  const setupWebSocket = useCallback(() => {
    if (!enableWebSocket || !websocketUrl) return;

    const ws = new WebSocket(websocketUrl);
    
    ws.onopen = () => {
      console.log('WebSocket connected for conflict detection');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'conflict') {
          onConflictDetected(data.conflicts);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected, attempting to reconnect...');
      setTimeout(setupWebSocket, 5000);
    };

    websocketRef.current = ws;
  }, [enableWebSocket, websocketUrl, onConflictDetected]);

  // Initialize conflict detection
  useEffect(() => {
    if (enableWebSocket) {
      setupWebSocket();
    } else {
      const interval = setInterval(pollForConflicts, pollingInterval);
      return () => clearInterval(interval);
    }

    return () => {
      if (websocketRef.current) {
        websocketRef.current.close();
      }
    };
  }, [enableWebSocket, pollingInterval, pollForConflicts, setupWebSocket]);

  return {
    isConnected: websocketRef.current?.readyState === WebSocket.OPEN,
    lastSyncTime: lastSyncTime.current,
  };
}
