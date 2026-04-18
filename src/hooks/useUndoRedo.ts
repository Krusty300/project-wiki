import { useState, useCallback, useRef, useEffect } from 'react';
import { Note, Folder } from '@/types';

interface HistoryAction<T> {
  id: string;
  type: 'create' | 'update' | 'delete' | 'move' | 'reorder';
  data: T;
  previousData?: T;
  timestamp: number;
  description: string;
}

interface UndoRedoState<T> {
  history: HistoryAction<T>[];
  currentIndex: number;
  canUndo: boolean;
  canRedo: boolean;
}

interface UndoRedoOptions {
  maxHistorySize?: number;
  debounceTime?: number;
  groupSimilarActions?: boolean;
}

export function useUndoRedo<T extends Note | Folder>(
  initialItems: T[],
  options: UndoRedoOptions = {}
) {
  const {
    maxHistorySize = 50,
    debounceTime = 500,
    groupSimilarActions = true,
  } = options;

  const [state, setState] = useState<UndoRedoState<T>>({
    history: [],
    currentIndex: -1,
    canUndo: false,
    canRedo: false,
  });

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const actionGroupsRef = useRef<Map<string, HistoryAction<T>[]>>(new Map());

  // Generate unique ID for actions
  const generateActionId = useCallback(() => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Add action to history
  const addAction = useCallback((
    type: HistoryAction<T>['type'],
    data: T,
    previousData?: T,
    description?: string
  ) => {
    const action: HistoryAction<T> = {
      id: generateActionId(),
      type,
      data,
      previousData,
      timestamp: Date.now(),
      description: description || `${type} ${data.id}`,
    };

    setState(prevState => {
      let newHistory = [...prevState.history];
      
      // Remove any future actions (redo stack)
      if (prevState.currentIndex < newHistory.length - 1) {
        newHistory = newHistory.slice(0, prevState.currentIndex + 1);
      }

      // Group similar actions if enabled
      if (groupSimilarActions && type === 'update') {
        const lastAction = newHistory[newHistory.length - 1];
        if (lastAction && lastAction.type === 'update' && lastAction.data.id === data.id) {
          // Replace the last action instead of adding a new one
          newHistory[newHistory.length - 1] = action;
        } else {
          newHistory.push(action);
        }
      } else {
        newHistory.push(action);
      }

      // Limit history size
      if (newHistory.length > maxHistorySize) {
        newHistory = newHistory.slice(-maxHistorySize);
      }

      return {
        history: newHistory,
        currentIndex: newHistory.length - 1,
        canUndo: true,
        canRedo: false,
      };
    });
  }, [generateActionId, groupSimilarActions, maxHistorySize]);

  // Undo last action
  const undo = useCallback(() => {
    if (!state.canUndo) return null;

    const currentAction = state.history[state.currentIndex];
    if (!currentAction) return null;

    setState(prevState => ({
      ...prevState,
      currentIndex: prevState.currentIndex - 1,
      canUndo: prevState.currentIndex > 0,
      canRedo: true,
    }));

    return {
      action: currentAction,
      restoredData: currentAction.previousData,
    };
  }, [state.canUndo, state.history, state.currentIndex]);

  // Redo next action
  const redo = useCallback(() => {
    if (!state.canRedo) return null;

    const nextAction = state.history[state.currentIndex + 1];
    if (!nextAction) return null;

    setState(prevState => ({
      ...prevState,
      currentIndex: prevState.currentIndex + 1,
      canUndo: true,
      canRedo: prevState.currentIndex < prevState.history.length - 1,
    }));

    return {
      action: nextAction,
      restoredData: nextAction.data,
    };
  }, [state.canRedo, state.history, state.currentIndex]);

  // Create action wrappers
  const create = useCallback((
    data: T,
    description?: string
  ) => {
    addAction('create', data, undefined, description);
    return data;
  }, [addAction]);

  const update = useCallback((
    newData: T,
    previousData: T,
    description?: string
  ) => {
    addAction('update', newData, previousData, description);
    return newData;
  }, [addAction]);

  const remove = useCallback((
    data: T,
    description?: string
  ) => {
    addAction('delete', data, data, description);
    return data;
  }, [addAction]);

  const move = useCallback((
    data: T,
    previousData: T,
    description?: string
  ) => {
    addAction('move', data, previousData, description);
    return data;
  }, [addAction]);

  const reorder = useCallback((
    items: T[],
    previousOrder: string[],
    description?: string
  ) => {
    const action: HistoryAction<T> = {
      id: generateActionId(),
      type: 'reorder',
      data: items[0], // Use first item as representative
      timestamp: Date.now(),
      description: description || 'Reorder items',
    };

    setState(prevState => {
      let updatedHistory = [...prevState.history];
      
      if (prevState.currentIndex < updatedHistory.length - 1) {
        updatedHistory = updatedHistory.slice(0, prevState.currentIndex + 1);
      }

      updatedHistory.push(action);

      if (updatedHistory.length > maxHistorySize) {
        updatedHistory = updatedHistory.slice(-maxHistorySize);
      }

      return {
        history: updatedHistory,
        currentIndex: updatedHistory.length - 1,
        canUndo: true,
        canRedo: false,
      };
    });

    return items;
  }, [generateActionId, maxHistorySize]);

  // Clear history
  const clear = useCallback(() => {
    setState({
      history: [],
      currentIndex: -1,
      canUndo: false,
      canRedo: false,
    });
  }, []);

  // Get action history
  const getHistory = useCallback((limit?: number) => {
    const history = [...state.history];
    if (limit) {
      return history.slice(-limit);
    }
    return history;
  }, [state.history]);

  // Get current state at specific index
  const getStateAt = useCallback((index: number) => {
    if (index < 0 || index >= state.history.length) {
      return null;
    }

    // Reconstruct state by applying actions up to the index
    const actions = state.history.slice(0, index + 1);
    let currentItems = [...initialItems];

    for (const action of actions) {
      switch (action.type) {
        case 'create':
          currentItems.push(action.data);
          break;
        case 'update':
        case 'move':
          const itemIndex = currentItems.findIndex(item => item.id === action.data.id);
          if (itemIndex > -1) {
            currentItems[itemIndex] = action.data;
          }
          break;
        case 'delete':
          currentItems = currentItems.filter(item => item.id !== action.data.id);
          break;
        case 'reorder':
          // This would need more complex logic to handle reordering
          break;
      }
    }

    return currentItems;
  }, [state.history, initialItems]);

  // Batch multiple actions
  const batch = useCallback((
    actions: Array<() => void>,
    description?: string
  ) => {
    const batchId = generateActionId();
    const startTime = Date.now();

    actions.forEach((action, index) => {
      action();
    });

    // Add a batch marker action
    const batchAction: HistoryAction<T> = {
      id: batchId,
      type: 'update', // Use update as a placeholder
      data: initialItems[0] || ({} as T), // Placeholder
      timestamp: startTime,
      description: description || `Batch of ${actions.length} actions`,
    };

    setState(prevState => {
      let updatedHistory = [...prevState.history];
      
      if (prevState.currentIndex < updatedHistory.length - 1) {
        updatedHistory = updatedHistory.slice(0, prevState.currentIndex + 1);
      }

      updatedHistory.push(batchAction);

      return {
        history: updatedHistory,
        currentIndex: updatedHistory.length - 1,
        canUndo: true,
        canRedo: false,
      };
    });
  }, [generateActionId, initialItems]);

  // Debounced action for rapid changes
  const debouncedAction = useCallback((
    action: () => void,
    debounceMs?: number
  ) => {
    const delay = debounceMs || debounceTime;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      action();
      debounceTimerRef.current = null;
    }, delay);
  }, [debounceTime]);

  return {
    // State
    history: state.history,
    currentIndex: state.currentIndex,
    canUndo: state.canUndo,
    canRedo: state.canRedo,

    // Actions
    undo,
    redo,
    create,
    update,
    remove,
    move,
    reorder,
    clear,
    batch,
    debouncedAction,

    // Utilities
    getHistory,
    getStateAt,
  };
}

// Hook for keyboard shortcuts
export function useUndoRedoShortcuts(
  undo: () => void,
  redo: () => void,
  options: {
    enabled?: boolean;
    customUndoKeys?: string[];
    customRedoKeys?: string[];
  } = {}
) {
  const {
    enabled = true,
    customUndoKeys = ['ctrl+z', 'cmd+z'],
    customRedoKeys = ['ctrl+y', 'cmd+shift+z'],
  } = options;

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;

    const { ctrlKey, metaKey, shiftKey, key } = event;
    const hasCtrl = ctrlKey || metaKey;

    // Check for undo
    if (hasCtrl && key === 'z' && !shiftKey) {
      event.preventDefault();
      undo();
      return;
    }

    // Check for redo
    if (hasCtrl && ((key === 'y') || (key === 'z' && shiftKey))) {
      event.preventDefault();
      redo();
      return;
    }
  }, [enabled, undo, redo]);

  useEffect(() => {
    if (!enabled) return;

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown, enabled]);
}
