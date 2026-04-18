import { useState, useCallback, useRef, useEffect } from 'react';
import { Note, Folder } from '@/types';

interface OptimisticAction<T> {
  id: string;
  type: 'create' | 'update' | 'delete' | 'move';
  data: T;
  timestamp: number;
  status: 'pending' | 'success' | 'error';
  error?: string;
}

interface OptimisticState<T> {
  items: T[];
  pendingActions: OptimisticAction<T>[];
  isLoading: boolean;
}

interface OptimisticUpdateOptions<T extends Note | Folder> {
  timeout?: number;
  retryAttempts?: number;
  onConflict?: (local: T, remote: T) => T;
}

export function useOptimisticUpdates<T extends Note | Folder>(
  initialItems: T[],
  options: OptimisticUpdateOptions<T> = {}
) {
  const {
    timeout = 10000, // 10 seconds
    retryAttempts = 3,
    onConflict,
  } = options;

  const [state, setState] = useState<OptimisticState<T>>({
    items: initialItems,
    pendingActions: [],
    isLoading: false,
  });

  const pendingActionsRef = useRef<Map<string, OptimisticAction<T>>>(new Map());
  const retryCountRef = useRef<Map<string, number>>(new Map());

  // Apply optimistic action to local state
  const applyOptimisticAction = useCallback((
    items: T[],
    action: OptimisticAction<T>
  ): T[] => {
    switch (action.type) {
      case 'create':
        return [...items, action.data];
      
      case 'update':
        return items.map(item => 
          item.id === action.id ? { ...item, ...action.data } : item
        );
      
      case 'delete':
        return items.filter(item => item.id !== action.id);
      
      case 'move':
        return items.map(item => 
          item.id === action.id ? { ...item, ...action.data } : item
        );
      
      default:
        return items;
    }
  }, []);

  // Create optimistic action
  const createOptimisticAction = useCallback((
    type: OptimisticAction<T>['type'],
    data: T,
    executeAction: () => Promise<T>
  ) => {
    const action: OptimisticAction<T> = {
      id: data.id,
      type,
      data,
      timestamp: Date.now(),
      status: 'pending',
    };

    // Add to pending actions
    pendingActionsRef.current.set(data.id, action);
    
    // Update state immediately
    setState(prev => ({
      ...prev,
      items: applyOptimisticAction(prev.items, action),
      pendingActions: [...prev.pendingActions, action],
      isLoading: true,
    }));

    // Execute the actual action
    executeAction()
      .then((result) => {
        const successAction = { ...action, status: 'success' as const };
        pendingActionsRef.current.set(data.id, successAction);
        
        setState(prev => ({
          ...prev,
          pendingActions: prev.pendingActions.map(a => 
            a.id === data.id ? successAction : a
          ),
          isLoading: prev.pendingActions.some(a => a.status === 'pending'),
        }));

        // Clean up successful action after a delay
        setTimeout(() => {
          pendingActionsRef.current.delete(data.id);
          retryCountRef.current.delete(data.id);
          
          setState(prev => ({
            ...prev,
            pendingActions: prev.pendingActions.filter(a => a.id !== data.id),
          }));
        }, 1000);
      })
      .catch((error) => {
        const retryCount = retryCountRef.current.get(data.id) || 0;
        
        if (retryCount < retryAttempts) {
          // Retry the action
          retryCountRef.current.set(data.id, retryCount + 1);
          createOptimisticAction(type, data, executeAction);
        } else {
          // Mark as failed
          const failedAction = { 
            ...action, 
            status: 'error' as const,
            error: error.message 
          };
          
          pendingActionsRef.current.set(data.id, failedAction);
          
          setState(prev => ({
            ...prev,
            items: initialItems, // Revert to initial state
            pendingActions: prev.pendingActions.map(a => 
              a.id === data.id ? failedAction : a
            ),
            isLoading: prev.pendingActions.some(a => a.status === 'pending'),
          }));
        }
      });

    return action;
  }, [applyOptimisticAction, initialItems, retryAttempts]);

  // Optimistic create
  const create = useCallback((
    data: T,
    createFunction: () => Promise<T>
  ) => {
    return createOptimisticAction('create', data, createFunction);
  }, [createOptimisticAction]);

  // Optimistic update
  const update = useCallback((
    data: Partial<T> & { id: string },
    updateFunction: () => Promise<T>
  ) => {
    const fullData = { ...state.items.find(item => item.id === data.id), ...data } as T;
    return createOptimisticAction('update', fullData, updateFunction);
  }, [state.items, createOptimisticAction]);

  // Optimistic delete
  const remove = useCallback((
    id: string,
    deleteFunction: () => Promise<void>
  ) => {
    const item = state.items.find(item => item.id === id);
    if (!item) return null;

    const deleteData = { ...item, isDeleted: true } as T;
    return createOptimisticAction('delete', deleteData, () => 
      deleteFunction().then(() => deleteData)
    );
  }, [state.items, createOptimisticAction]);

  // Optimistic move
  const move = useCallback((
    id: string,
    newData: Partial<T>,
    moveFunction: () => Promise<T>
  ) => {
    const item = state.items.find(item => item.id === id);
    if (!item) return null;

    const fullData = { ...item, ...newData } as T;
    return createOptimisticAction('move', fullData, moveFunction);
  }, [state.items, createOptimisticAction]);

  // Retry failed action
  const retry = useCallback((id: string) => {
    const action = pendingActionsRef.current.get(id);
    if (!action || action.status !== 'error') return;

    retryCountRef.current.set(id, 0);
    // Re-execute the action based on its type
    // This would need to be implemented based on your specific API calls
  }, []);

  // Cancel pending action
  const cancel = useCallback((id: string) => {
    const action = pendingActionsRef.current.get(id);
    if (!action || action.status !== 'pending') return;

    pendingActionsRef.current.delete(id);
    retryCountRef.current.delete(id);

    setState(prev => ({
      ...prev,
      items: initialItems, // Revert to initial state
      pendingActions: prev.pendingActions.filter(a => a.id !== id),
      isLoading: prev.pendingActions.some(a => a.status === 'pending'),
    }));
  }, [initialItems]);

  // Clear all pending actions
  const clearPending = useCallback(() => {
    pendingActionsRef.current.clear();
    retryCountRef.current.clear();

    setState(prev => ({
      ...prev,
      items: initialItems,
      pendingActions: [],
      isLoading: false,
    }));
  }, [initialItems]);

  // Sync with remote changes
  const syncWithRemote = useCallback((remoteItems: T[]) => {
    setState(prev => {
      const newItems = [...remoteItems];
      
      // Apply any pending actions to the remote items
      const pendingActions = Array.from(pendingActionsRef.current.values())
        .filter(action => action.status === 'pending');

      for (const action of pendingActions) {
        const index = newItems.findIndex(item => item.id === action.id);
        if (action.type === 'delete') {
          if (index > -1) newItems.splice(index, 1);
        } else if (index > -1) {
          newItems[index] = { ...newItems[index], ...action.data };
        } else if (action.type === 'create') {
          newItems.push(action.data);
        }
      }

      return {
        ...prev,
        items: newItems,
      };
    });
  }, []);

  // Clean up timeout actions
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const toRemove: string[] = [];

      for (const [id, action] of pendingActionsRef.current.entries()) {
        if (now - action.timestamp > timeout && action.status === 'pending') {
          toRemove.push(id);
        }
      }

      toRemove.forEach(id => {
        const action = pendingActionsRef.current.get(id);
        if (action) {
          const failedAction = { 
            ...action, 
            status: 'error' as const,
            error: 'Action timed out'
          };
          
          pendingActionsRef.current.set(id, failedAction);
          
          setState(prev => ({
            ...prev,
            items: initialItems,
            pendingActions: prev.pendingActions.map(a => 
              a.id === id ? failedAction : a
            ),
            isLoading: prev.pendingActions.some(a => a.status === 'pending'),
          }));
        }
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeout, initialItems]);

  return {
    items: state.items,
    pendingActions: state.pendingActions,
    isLoading: state.isLoading,
    create,
    update,
    remove,
    move,
    retry,
    cancel,
    clearPending,
    syncWithRemote,
  };
}

// Hook for conflict resolution
export function useConflictResolution<T extends Note | Folder>(
  localItems: T[],
  remoteItems: T[],
  onConflict?: (local: T, remote: T) => T
) {
  const resolveConflicts = useCallback(() => {
    const conflicts: { local: T; remote: T; resolved: T }[] = [];
    const resolved: T[] = [];

    // Create a map of remote items for quick lookup
    const remoteMap = new Map(remoteItems.map(item => [item.id, item]));

    for (const localItem of localItems) {
      const remoteItem = remoteMap.get(localItem.id);
      
      if (!remoteItem) {
        // Local item doesn't exist remotely (deleted remotely)
        continue;
      }

      const localModified = new Date(localItem.updatedAt).getTime();
      const remoteModified = new Date(remoteItem.updatedAt).getTime();

      if (localModified !== remoteModified) {
        // Conflict detected
        const resolvedItem = onConflict 
          ? onConflict(localItem, remoteItem)
          : remoteItem; // Default to remote version

        conflicts.push({
          local: localItem,
          remote: remoteItem,
          resolved: resolvedItem,
        });
        
        resolved.push(resolvedItem);
      } else {
        // No conflict
        resolved.push(localItem);
      }

      remoteMap.delete(localItem.id);
    }

    // Add any new remote items
    for (const remoteItem of remoteMap.values()) {
      resolved.push(remoteItem);
    }

    return { conflicts, resolved };
  }, [localItems, remoteItems, onConflict]);

  return {
    resolveConflicts,
    hasConflicts: localItems.some(localItem => 
      remoteItems.some(remoteItem => 
        localItem.id === remoteItem.id && 
        new Date(localItem.updatedAt).getTime() !== new Date(remoteItem.updatedAt).getTime()
      )
    ),
  };
}
