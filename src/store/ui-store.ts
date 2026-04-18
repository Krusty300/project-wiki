import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  // Sidebar state
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  
  // Current note
  currentNoteId: string | null;
  setCurrentNoteId: (id: string | null) => void;
  
  // Current folder
  currentFolderId: string | null;
  setCurrentFolderId: (id: string | null) => void;
  
  // Search state
  searchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  
  // Theme
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
  toggleDarkMode: () => void;
  
  // View mode
  viewMode: 'edit' | 'preview';
  setViewMode: (mode: 'edit' | 'preview') => void;
  
  // Tag filtering
  selectedTagIds: string[];
  setSelectedTagIds: (tagIds: string[]) => void;
  toggleViewMode: () => void;
  
  // Focus mode
  focusMode: boolean;
  setFocusMode: (focus: boolean) => void;
  toggleFocusMode: () => void;
  
  // Auto-save status
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';
  setSaveStatus: (status: 'idle' | 'saving' | 'saved' | 'error') => void;
  
  // Split view
  splitView: boolean;
  setSplitView: (split: boolean) => void;
  toggleSplitView: () => void;
  
  // Trash view
  showTrash: boolean;
  setShowTrash: (show: boolean) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      // Sidebar state
      sidebarOpen: true,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      
      // Current note
      currentNoteId: null,
      setCurrentNoteId: (id) => set({ currentNoteId: id }),
      
      // Current folder
      currentFolderId: null,
      setCurrentFolderId: (id) => set({ currentFolderId: id }),
      
      // Search state
      searchOpen: false,
      setSearchOpen: (open) => set({ searchOpen: open }),
      searchQuery: '',
      setSearchQuery: (query) => set({ searchQuery: query }),
      
      // Theme
      darkMode: false,
      setDarkMode: (dark) => set({ darkMode: dark }),
      toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
      
      // View mode
      viewMode: 'edit' as const,
      setViewMode: (mode) => set({ viewMode: mode }),
      toggleViewMode: () => set((state) => ({ 
        viewMode: state.viewMode === 'edit' ? 'preview' : 'edit' 
      })),
      
      // Tag filtering
      selectedTagIds: [],
      setSelectedTagIds: (tagIds) => set({ selectedTagIds: tagIds }),
      
      // Focus mode
      focusMode: false,
      setFocusMode: (focus) => set({ focusMode: focus }),
      toggleFocusMode: () => set((state) => ({ focusMode: !state.focusMode })),
      
      // Auto-save status
      saveStatus: 'idle' as const,
      setSaveStatus: (status) => set({ saveStatus: status }),
      
      // Split view
      splitView: false,
      setSplitView: (split) => set({ splitView: split }),
      toggleSplitView: () => set((state) => ({ splitView: !state.splitView })),
      
      // Trash view
      showTrash: false,
      setShowTrash: (show) => set({ showTrash: show }),
    }),
    {
      name: 'ui-storage',
      partialize: (state) => ({
        sidebarOpen: state.sidebarOpen,
        darkMode: state.darkMode,
        viewMode: state.viewMode,
        selectedTagIds: state.selectedTagIds,
        showTrash: state.showTrash,
      }),
    }
  )
);
