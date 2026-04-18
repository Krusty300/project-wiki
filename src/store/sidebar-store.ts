import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type SidebarTheme = 'default' | 'dark' | 'light' | 'auto';
export type SidebarLayout = 'compact' | 'detailed' | 'icons-only';
export type SortOption = 'title' | 'date' | 'manual';

interface SidebarCustomizationState {
  // Width customization
  sidebarWidth: number;
  setSidebarWidth: (width: number) => void;
  isResizing: boolean;
  setIsResizing: (resizing: boolean) => void;
  
  // Theme
  sidebarTheme: SidebarTheme;
  setSidebarTheme: (theme: SidebarTheme) => void;
  
  // Layout
  sidebarLayout: SidebarLayout;
  setSidebarLayout: (layout: SidebarLayout) => void;
  
  // Sorting
  sortOption: SortOption;
  setSortOption: (option: SortOption) => void;
  sortDirection: 'asc' | 'desc';
  setSortDirection: (direction: 'asc' | 'desc') => void;
  
  // Display options
  showNoteCount: boolean;
  setShowNoteCount: (show: boolean) => void;
  showLastModified: boolean;
  setShowLastModified: (show: boolean) => void;
  showNotePreview: boolean;
  setShowNotePreview: (show: boolean) => void;
  
  // Advanced options
  autoCollapseFolders: boolean;
  setAutoCollapseFolders: (auto: boolean) => void;
  enableAnimations: boolean;
  setEnableAnimations: (enable: boolean) => void;
  showDragHandles: boolean;
  setShowDragHandles: (show: boolean) => void;
  
  // Reset to defaults
  resetToDefaults: () => void;
}

const DEFAULT_WIDTH = 256;
const MIN_WIDTH = 180;
const MAX_WIDTH = 480;

export const useSidebarStore = create<SidebarCustomizationState>()(
  persist(
    (set, get) => ({
      // Width customization
      sidebarWidth: DEFAULT_WIDTH,
      setSidebarWidth: (width) => set({ 
        sidebarWidth: Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, width)) 
      }),
      isResizing: false,
      setIsResizing: (resizing) => set({ isResizing: resizing }),
      
      // Theme
      sidebarTheme: 'default',
      setSidebarTheme: (theme) => set({ sidebarTheme: theme }),
      
      // Layout
      sidebarLayout: 'detailed',
      setSidebarLayout: (layout) => set({ sidebarLayout: layout }),
      
      // Sorting
      sortOption: 'manual',
      setSortOption: (option) => set({ sortOption: option }),
      sortDirection: 'asc',
      setSortDirection: (direction) => set({ sortDirection: direction }),
      
      // Display options
      showNoteCount: true,
      setShowNoteCount: (show) => set({ showNoteCount: show }),
      showLastModified: false,
      setShowLastModified: (show) => set({ showLastModified: show }),
      showNotePreview: false,
      setShowNotePreview: (show) => set({ showNotePreview: show }),
      
      // Advanced options
      autoCollapseFolders: false,
      setAutoCollapseFolders: (auto) => set({ autoCollapseFolders: auto }),
      enableAnimations: true,
      setEnableAnimations: (enable) => set({ enableAnimations: enable }),
      showDragHandles: false,
      setShowDragHandles: (show) => set({ showDragHandles: show }),
      
      // Reset to defaults
      resetToDefaults: () => set({
        sidebarWidth: DEFAULT_WIDTH,
        sidebarTheme: 'default',
        sidebarLayout: 'detailed',
        sortOption: 'manual',
        sortDirection: 'asc',
        showNoteCount: true,
        showLastModified: false,
        showNotePreview: false,
        autoCollapseFolders: false,
        enableAnimations: true,
        showDragHandles: false,
      }),
    }),
    {
      name: 'sidebar-customization-storage',
      partialize: (state) => ({
        sidebarWidth: state.sidebarWidth,
        sidebarTheme: state.sidebarTheme,
        sidebarLayout: state.sidebarLayout,
        sortOption: state.sortOption,
        sortDirection: state.sortDirection,
        showNoteCount: state.showNoteCount,
        showLastModified: state.showLastModified,
        showNotePreview: state.showNotePreview,
        autoCollapseFolders: state.autoCollapseFolders,
        enableAnimations: state.enableAnimations,
        showDragHandles: state.showDragHandles,
      }),
    }
  )
);

// Helper functions for styling
export const getSidebarThemeClasses = (theme: SidebarTheme, isDarkMode: boolean) => {
  switch (theme) {
    case 'dark':
      return 'bg-gray-900 border-gray-700 text-white';
    case 'light':
      return 'bg-white border-gray-200 text-gray-900';
    case 'auto':
      return isDarkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900';
    default:
      return 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white';
  }
};

export const getLayoutClasses = (layout: SidebarLayout) => {
  switch (layout) {
    case 'compact':
      return 'text-xs py-1';
    case 'detailed':
      return 'text-sm py-2';
    case 'icons-only':
      return 'text-xs py-2';
    default:
      return 'text-sm py-2';
  }
};

export const MIN_SIDEBAR_WIDTH = MIN_WIDTH;
export const MAX_SIDEBAR_WIDTH = MAX_WIDTH;
export const DEFAULT_SIDEBAR_WIDTH = DEFAULT_WIDTH;
