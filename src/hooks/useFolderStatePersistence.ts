import { useCallback, useEffect, useRef } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface FolderState {
  expandedFolders: Set<string>;
  selectedFolders: Set<string>;
  folderNotes: Map<string, string[]>; // folderId -> noteIds
  folderOrder: string[]; // Manual order of folders
  lastAccessed: Map<string, number>; // folderId -> timestamp
}

interface FolderStateActions {
  expandFolder: (folderId: string) => void;
  collapseFolder: (folderId: string) => void;
  toggleFolder: (folderId: string) => void;
  expandAll: () => void;
  collapseAll: () => void;
  selectFolder: (folderId: string) => void;
  deselectFolder: (folderId: string) => void;
  clearSelection: () => void;
  setFolderNotes: (folderId: string, noteIds: string[]) => void;
  addNoteToFolder: (folderId: string, noteId: string) => void;
  removeNoteFromFolder: (folderId: string, noteId: string) => void;
  reorderFolders: (folderIds: string[]) => void;
  updateLastAccessed: (folderId: string) => void;
  resetState: () => void;
}

type FolderStateStore = FolderState & FolderStateActions;

const useFolderStateStore = create<FolderStateStore>()(
  persist(
    (set, get) => ({
      // Initial state
      expandedFolders: new Set(),
      selectedFolders: new Set(),
      folderNotes: new Map(),
      folderOrder: [],
      lastAccessed: new Map(),

      // Folder expansion
      expandFolder: (folderId: string) =>
        set((state) => ({
          expandedFolders: new Set([...state.expandedFolders, folderId]),
        })),

      collapseFolder: (folderId: string) =>
        set((state) => {
          const newExpanded = new Set(state.expandedFolders);
          newExpanded.delete(folderId);
          return { expandedFolders: newExpanded };
        }),

      toggleFolder: (folderId: string) =>
        set((state) => {
          const newExpanded = new Set(state.expandedFolders);
          if (newExpanded.has(folderId)) {
            newExpanded.delete(folderId);
          } else {
            newExpanded.add(folderId);
          }
          return { expandedFolders: newExpanded };
        }),

      expandAll: () =>
        set((state) => ({
          expandedFolders: new Set(state.folderOrder),
        })),

      collapseAll: () =>
        set(() => ({
          expandedFolders: new Set(),
        })),

      // Folder selection
      selectFolder: (folderId: string) =>
        set((state) => ({
          selectedFolders: new Set([...state.selectedFolders, folderId]),
        })),

      deselectFolder: (folderId: string) =>
        set((state) => {
          const newSelected = new Set(state.selectedFolders);
          newSelected.delete(folderId);
          return { selectedFolders: newSelected };
        }),

      clearSelection: () =>
        set(() => ({
          selectedFolders: new Set(),
        })),

      // Folder notes management
      setFolderNotes: (folderId: string, noteIds: string[]) =>
        set((state) => {
          const newFolderNotes = new Map(state.folderNotes);
          newFolderNotes.set(folderId, noteIds);
          return { folderNotes: newFolderNotes };
        }),

      addNoteToFolder: (folderId: string, noteId: string) =>
        set((state) => {
          const newFolderNotes = new Map(state.folderNotes);
          const currentNotes = newFolderNotes.get(folderId) || [];
          newFolderNotes.set(folderId, [...currentNotes, noteId]);
          return { folderNotes: newFolderNotes };
        }),

      removeNoteFromFolder: (folderId: string, noteId: string) =>
        set((state) => {
          const newFolderNotes = new Map(state.folderNotes);
          const currentNotes = newFolderNotes.get(folderId) || [];
          newFolderNotes.set(
            folderId,
            currentNotes.filter((id) => id !== noteId)
          );
          return { folderNotes: newFolderNotes };
        }),

      // Folder ordering
      reorderFolders: (folderIds: string[]) =>
        set(() => ({
          folderOrder: folderIds,
        })),

      // Last accessed tracking
      updateLastAccessed: (folderId: string) =>
        set((state) => {
          const newLastAccessed = new Map(state.lastAccessed);
          newLastAccessed.set(folderId, Date.now());
          return { lastAccessed: newLastAccessed };
        }),

      // Reset state
      resetState: () =>
        set(() => ({
          expandedFolders: new Set(),
          selectedFolders: new Set(),
          folderNotes: new Map(),
          folderOrder: [],
          lastAccessed: new Map(),
        })),
    }),
    {
      name: 'folder-state-storage',
      // Custom serialization for Sets and Maps
      partialize: (state) => ({
        expandedFolders: Array.from(state.expandedFolders),
        selectedFolders: Array.from(state.selectedFolders),
        folderNotes: Array.from(state.folderNotes.entries()),
        folderOrder: state.folderOrder,
        lastAccessed: Array.from(state.lastAccessed.entries()),
      }),
      onRehydrateStorage: (state) => {
        if (state) {
          state.expandedFolders = new Set(state.expandedFolders || []);
          state.selectedFolders = new Set(state.selectedFolders || []);
          state.folderNotes = new Map(state.folderNotes || []);
          state.lastAccessed = new Map(state.lastAccessed || []);
        }
      },
    }
  )
);

// Hook for using folder state persistence
export function useFolderStatePersistence() {
  const {
    expandedFolders,
    selectedFolders,
    folderNotes,
    folderOrder,
    lastAccessed,
    expandFolder,
    collapseFolder,
    toggleFolder,
    expandAll,
    collapseAll,
    selectFolder,
    deselectFolder,
    clearSelection,
    setFolderNotes,
    addNoteToFolder,
    removeNoteFromFolder,
    reorderFolders,
    updateLastAccessed,
    resetState,
  } = useFolderStateStore();

  // Auto-collapse folders that haven't been accessed recently
  const cleanupOldFolders = useCallback(() => {
    const now = Date.now();
    const threshold = 30 * 60 * 1000; // 30 minutes

    for (const [folderId, timestamp] of lastAccessed.entries()) {
      if (now - timestamp > threshold && expandedFolders.has(folderId)) {
        collapseFolder(folderId);
      }
    }
  }, [expandedFolders, lastAccessed, collapseFolder]);

  // Periodic cleanup
  useEffect(() => {
    const interval = setInterval(cleanupOldFolders, 5 * 60 * 1000); // Every 5 minutes
    return () => clearInterval(interval);
  }, [cleanupOldFolders]);

  // Get frequently accessed folders
  const getFrequentlyAccessed = useCallback((limit: number = 5) => {
    const sorted = Array.from(lastAccessed.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([folderId]) => folderId);

    return sorted;
  }, [lastAccessed]);

  // Get recently expanded folders
  const getRecentlyExpanded = useCallback((limit: number = 3) => {
    const recent = Array.from(expandedFolders)
      .filter(folderId => lastAccessed.has(folderId))
      .sort((a, b) => (lastAccessed.get(b) || 0) - (lastAccessed.get(a) || 0))
      .slice(0, limit);

    return recent;
  }, [expandedFolders, lastAccessed]);

  // Check if folder is expanded
  const isFolderExpanded = useCallback((folderId: string) => {
    return expandedFolders.has(folderId);
  }, [expandedFolders]);

  // Check if folder is selected
  const isFolderSelected = useCallback((folderId: string) => {
    return selectedFolders.has(folderId);
  }, [selectedFolders]);

  // Get notes for a folder
  const getFolderNotes = useCallback((folderId: string) => {
    return folderNotes.get(folderId) || [];
  }, [folderNotes]);

  return {
    // State
    expandedFolders,
    selectedFolders,
    folderNotes,
    folderOrder,
    lastAccessed,

    // Actions
    expandFolder,
    collapseFolder,
    toggleFolder,
    expandAll,
    collapseAll,
    selectFolder,
    deselectFolder,
    clearSelection,
    setFolderNotes,
    addNoteToFolder,
    removeNoteFromFolder,
    reorderFolders,
    updateLastAccessed,
    resetState,

    // Utility methods
    getFrequentlyAccessed,
    getRecentlyExpanded,
    isFolderExpanded,
    isFolderSelected,
    getFolderNotes,
    cleanupOldFolders,
  };
}

// Hook for auto-expanding folders based on user behavior
export function useAutoFolderExpansion(
  currentFolderId: string | null,
  userPreferences: {
    autoExpandOnSelect?: boolean;
    maxAutoExpanded?: number;
    collapseOnNavigate?: boolean;
  } = {}
) {
  const {
    autoExpandOnSelect = true,
    maxAutoExpanded = 3,
    collapseOnNavigate = false,
  } = userPreferences;

  const {
    expandedFolders,
    expandFolder,
    collapseFolder,
    getRecentlyExpanded,
  } = useFolderStatePersistence();

  // Auto-expand folder when selected
  useEffect(() => {
    if (currentFolderId && autoExpandOnSelect) {
      const recentlyExpanded = getRecentlyExpanded(maxAutoExpanded);
      
      if (recentlyExpanded.length < maxAutoExpanded) {
        expandFolder(currentFolderId);
      }
    }
  }, [currentFolderId, autoExpandOnSelect, maxAutoExpanded, expandFolder, getRecentlyExpanded]);

  // Auto-collapse when navigating away
  useEffect(() => {
    if (collapseOnNavigate && !currentFolderId) {
      const recentlyExpanded = getRecentlyExpanded(1);
      if (recentlyExpanded.length > 0) {
        collapseFolder(recentlyExpanded[0]);
      }
    }
  }, [currentFolderId, collapseOnNavigate, collapseFolder, getRecentlyExpanded]);

  return {
    autoExpandedFolders: Array.from(expandedFolders).filter(folderId => 
      getRecentlyExpanded(maxAutoExpanded).includes(folderId)
    ),
  };
}
