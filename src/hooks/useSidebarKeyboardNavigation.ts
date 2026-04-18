import { useCallback, useEffect, useRef, useState } from 'react';
import { Folder, Note } from '@/types';

interface NavigationItem {
  id: string;
  type: 'folder' | 'note' | 'section';
  name: string;
  element?: HTMLElement;
  data?: Folder | Note;
  parentId?: string;
  index: number;
}

interface KeyboardNavigationOptions {
  enabled?: boolean;
  loop?: boolean;
  wrapAround?: boolean;
  preventDefault?: boolean;
  onNavigate?: (item: NavigationItem) => void;
  onSelect?: (item: NavigationItem) => void;
  onExpand?: (folderId: string) => void;
  onCollapse?: (folderId: string) => void;
}

export function useSidebarKeyboardNavigation(
  items: NavigationItem[],
  options: KeyboardNavigationOptions = {}
) {
  const {
    enabled = true,
    loop = false,
    wrapAround = true,
    preventDefault = true,
    onNavigate,
    onSelect,
    onExpand,
    onCollapse,
  } = options;

  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const containerRef = useRef<HTMLElement>(null);

  // Navigate to next item
  const navigateNext = useCallback(() => {
    if (!enabled || items.length === 0) return;

    let nextIndex = selectedIndex + 1;
    
    // Skip disabled or hidden items
    while (nextIndex < items.length && (items[nextIndex].element as HTMLButtonElement)?.disabled) {
      nextIndex++;
    }

    if (nextIndex >= items.length) {
      nextIndex = wrapAround ? 0 : items.length - 1;
    }

    setSelectedIndex(nextIndex);
    onNavigate?.(items[nextIndex]);
    
    // Focus and scroll into view
    items[nextIndex]?.element?.focus();
    items[nextIndex]?.element?.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'nearest' 
    });
  }, [enabled, items, selectedIndex, wrapAround, onNavigate]);

  // Navigate to previous item
  const navigatePrevious = useCallback(() => {
    if (!enabled || items.length === 0) return;

    let prevIndex = selectedIndex - 1;
    
    // Skip disabled or hidden items
    while (prevIndex >= 0 && (items[prevIndex].element as HTMLButtonElement)?.disabled) {
      prevIndex--;
    }

    if (prevIndex < 0) {
      prevIndex = wrapAround ? items.length - 1 : 0;
    }

    setSelectedIndex(prevIndex);
    onNavigate?.(items[prevIndex]);
    
    // Focus and scroll into view
    items[prevIndex]?.element?.focus();
    items[prevIndex]?.element?.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'nearest' 
    });
  }, [enabled, items, selectedIndex, wrapAround, onNavigate]);

  // Navigate to parent folder
  const navigateToParent = useCallback(() => {
    if (!enabled || selectedIndex < 0) return;

    const currentItem = items[selectedIndex];
    if (currentItem.type !== 'folder' || !currentItem.parentId) return;

    const parentIndex = items.findIndex(item => 
      item.id === currentItem.parentId && item.type === 'folder'
    );

    if (parentIndex >= 0) {
      setSelectedIndex(parentIndex);
      onNavigate?.(items[parentIndex]);
      items[parentIndex]?.element?.focus();
    }
  }, [enabled, items, selectedIndex, onNavigate]);

  // Navigate to first child
  const navigateToFirstChild = useCallback(() => {
    if (!enabled || selectedIndex < 0) return;

    const currentItem = items[selectedIndex];
    if (currentItem.type !== 'folder') return;

    const firstChildIndex = items.findIndex(item => 
      item.parentId === currentItem.id
    );

    if (firstChildIndex >= 0) {
      setSelectedIndex(firstChildIndex);
      onNavigate?.(items[firstChildIndex]);
      items[firstChildIndex]?.element?.focus();
    }
  }, [enabled, items, selectedIndex, onNavigate]);

  // Toggle folder expansion
  const toggleFolderExpansion = useCallback((folderId: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
        onCollapse?.(folderId);
      } else {
        newSet.add(folderId);
        onExpand?.(folderId);
      }
      return newSet;
    });
  }, [onExpand, onCollapse]);

  // Select current item
  const selectCurrent = useCallback(() => {
    if (!enabled || selectedIndex < 0) return;

    const currentItem = items[selectedIndex];
    onSelect?.(currentItem);

    // If it's a folder, toggle expansion
    if (currentItem.type === 'folder') {
      toggleFolderExpansion(currentItem.id);
    }
  }, [enabled, items, selectedIndex, onSelect, toggleFolderExpansion]);

  // Navigate to specific index
  const navigateToIndex = useCallback((index: number) => {
    if (!enabled || items.length === 0 || index < 0 || index >= items.length) return;

    setSelectedIndex(index);
    onNavigate?.(items[index]);
    items[index]?.element?.focus();
  }, [enabled, items, onNavigate]);

  // Navigate to first item
  const navigateFirst = useCallback(() => {
    navigateToIndex(0);
  }, [navigateToIndex]);

  // Navigate to last item
  const navigateLast = useCallback(() => {
    navigateToIndex(items.length - 1);
  }, [navigateToIndex, items.length]);

  // Navigate by page
  const navigatePageDown = useCallback(() => {
    const currentIndex = selectedIndex;
    const nextIndex = Math.min(currentIndex + 10, items.length - 1);
    navigateToIndex(nextIndex);
  }, [selectedIndex, navigateToIndex, items.length]);

  const navigatePageUp = useCallback(() => {
    const currentIndex = selectedIndex;
    const prevIndex = Math.max(currentIndex - 10, 0);
    navigateToIndex(prevIndex);
  }, [selectedIndex, navigateToIndex]);

  // Handle keyboard events
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;

    switch (event.key) {
      case 'ArrowDown':
        if (preventDefault) event.preventDefault();
        navigateNext();
        break;
      case 'ArrowUp':
        if (preventDefault) event.preventDefault();
        navigatePrevious();
        break;
      case 'ArrowRight':
        if (preventDefault) event.preventDefault();
        // Expand folder or navigate to first child
        if (selectedIndex >= 0 && items[selectedIndex].type === 'folder') {
          if (!expandedFolders.has(items[selectedIndex].id)) {
            toggleFolderExpansion(items[selectedIndex].id);
          } else {
            navigateToFirstChild();
          }
        }
        break;
      case 'ArrowLeft':
        if (preventDefault) event.preventDefault();
        // Collapse folder or navigate to parent
        if (selectedIndex >= 0 && items[selectedIndex].type === 'folder') {
          if (expandedFolders.has(items[selectedIndex].id)) {
            toggleFolderExpansion(items[selectedIndex].id);
          } else {
            navigateToParent();
          }
        }
        break;
      case 'Home':
        if (preventDefault) event.preventDefault();
        navigateFirst();
        break;
      case 'End':
        if (preventDefault) event.preventDefault();
        navigateLast();
        break;
      case 'PageDown':
        if (preventDefault) event.preventDefault();
        navigatePageDown();
        break;
      case 'PageUp':
        if (preventDefault) event.preventDefault();
        navigatePageUp();
        break;
      case 'Enter':
      case ' ':
        if (preventDefault) event.preventDefault();
        selectCurrent();
        break;
      case 'Escape':
        if (preventDefault) event.preventDefault();
        setSelectedIndex(-1);
        break;
    }
  }, [
    enabled,
    preventDefault,
    navigateNext,
    navigatePrevious,
    navigateFirst,
    navigateLast,
    navigatePageUp,
    navigatePageDown,
    navigateToParent,
    navigateToFirstChild,
    selectCurrent,
    selectedIndex,
    items,
    expandedFolders,
    toggleFolderExpansion,
  ]);

  // Set up keyboard event listener
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !enabled) return;

    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown, enabled]);

  // Register elements for navigation
  const registerItem = useCallback((item: NavigationItem) => {
    return {
      ...item,
      element: item.element,
    };
  }, []);

  return {
    selectedIndex,
    setSelectedIndex,
    navigateNext,
    navigatePrevious,
    navigateToIndex,
    navigateFirst,
    navigateLast,
    navigatePageUp,
    navigatePageDown,
    navigateToParent,
    navigateToFirstChild,
    selectCurrent,
    toggleFolderExpansion,
    expandedFolders,
    isExpanded: (folderId: string) => expandedFolders.has(folderId),
    registerItem,
    containerRef,
  };
}

// Hook for folder-specific navigation
export function useFolderNavigation(
  folders: Folder[],
  notes: Note[],
  currentFolderId?: string | null,
  options: Omit<KeyboardNavigationOptions, 'onNavigate' | 'onSelect'> & {
    onFolderSelect?: (folder: Folder) => void;
    onNoteSelect?: (note: Note) => void;
    onFolderExpand?: (folderId: string) => void;
    onFolderCollapse?: (folderId: string) => void;
  } = {}
) {
  const {
    onFolderSelect,
    onNoteSelect,
    onFolderExpand,
    onFolderCollapse,
    ...navigationOptions
  } = options;

  // Build navigation items from folders and notes
  const navigationItems = useCallback(() => {
    const items: NavigationItem[] = [];
    let index = 0;

    // Add folders
    folders.forEach(folder => {
      items.push({
        id: folder.id,
        type: 'folder',
        name: folder.name,
        data: folder,
        parentId: folder.parentId || undefined,
        index: index++,
      });
    });

    // Add notes
    notes.forEach(note => {
      items.push({
        id: note.id,
        type: 'note',
        name: note.title || 'Untitled',
        data: note,
        parentId: note.folderId || undefined,
        index: index++,
      });
    });

    return items;
  }, [folders, notes]);

  const navigation = useSidebarKeyboardNavigation(navigationItems(), {
    ...navigationOptions,
    onNavigate: (item) => {
      if (item.type === 'folder' && item.data) {
        onFolderSelect?.(item.data as Folder);
      } else if (item.type === 'note' && item.data) {
        onNoteSelect?.(item.data as Note);
      }
    },
    onSelect: (item) => {
      if (item.type === 'folder' && item.data) {
        onFolderSelect?.(item.data as Folder);
      } else if (item.type === 'note' && item.data) {
        onNoteSelect?.(item.data as Note);
      }
    },
    onExpand: onFolderExpand,
    onCollapse: onFolderCollapse,
  });

  return {
    ...navigation,
    folders,
    notes,
    currentFolderId,
  };
}

// Keyboard shortcuts helper
export const KEYBOARD_SHORTCUTS = {
  NAVIGATION: {
    ARROW_DOWN: 'Navigate to next item',
    ARROW_UP: 'Navigate to previous item',
    ARROW_RIGHT: 'Expand folder or go to first child',
    ARROW_LEFT: 'Collapse folder or go to parent',
    HOME: 'Go to first item',
    END: 'Go to last item',
    PAGE_UP: 'Go up one page',
    PAGE_DOWN: 'Go down one page',
    ENTER: 'Select item or toggle folder',
    SPACE: 'Select item or toggle folder',
    ESCAPE: 'Clear selection',
  },
  GLOBAL: {
    CTRL_K: 'Open search',
    CTRL_N: 'Create new note',
    CTRL_SHIFT_N: 'Create new folder',
    CTRL_B: 'Toggle sidebar',
    CTRL_1: 'Focus sidebar',
    CTRL_2: 'Focus editor',
  },
} as const;

// Hook for global keyboard shortcuts
export function useGlobalKeyboardShortcuts() {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd + K: Open search
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        // Trigger search modal
        const searchEvent = new CustomEvent('open-search');
        window.dispatchEvent(searchEvent);
      }

      // Ctrl/Cmd + N: Create new note
      if ((event.ctrlKey || event.metaKey) && event.key === 'n' && !event.shiftKey) {
        event.preventDefault();
        // Trigger new note creation
        const newNoteEvent = new CustomEvent('create-note');
        window.dispatchEvent(newNoteEvent);
      }

      // Ctrl/Cmd + Shift + N: Create new folder
      if ((event.ctrlKey || event.metaKey) && event.key === 'n' && event.shiftKey) {
        event.preventDefault();
        // Trigger new folder creation
        const newFolderEvent = new CustomEvent('create-folder');
        window.dispatchEvent(newFolderEvent);
      }

      // Ctrl/Cmd + B: Toggle sidebar
      if ((event.ctrlKey || event.metaKey) && event.key === 'b') {
        event.preventDefault();
        // Trigger sidebar toggle
        const toggleSidebarEvent = new CustomEvent('toggle-sidebar');
        window.dispatchEvent(toggleSidebarEvent);
      }

      // Ctrl/Cmd + 1: Focus sidebar
      if ((event.ctrlKey || event.metaKey) && event.key === '1') {
        event.preventDefault();
        // Focus sidebar
        const focusSidebarEvent = new CustomEvent('focus-sidebar');
        window.dispatchEvent(focusSidebarEvent);
      }

      // Ctrl/Cmd + 2: Focus editor
      if ((event.ctrlKey || event.metaKey) && event.key === '2') {
        event.preventDefault();
        // Focus editor
        const focusEditorEvent = new CustomEvent('focus-editor');
        window.dispatchEvent(focusEditorEvent);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);
}
