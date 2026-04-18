import { useState, useCallback, useEffect, useRef } from 'react';

interface KeyboardNavigationOptions {
  enabled?: boolean;
  loop?: boolean;
  wrapAround?: boolean;
  preventDefault?: boolean;
}

interface NavigationItem {
  id: string;
  element?: HTMLElement;
  index: number;
  data?: any;
}

export function useKeyboardNavigation(
  items: NavigationItem[],
  onSelect?: (item: NavigationItem) => void,
  options: KeyboardNavigationOptions = {}
) {
  const {
    enabled = true,
    loop = false,
    wrapAround = true,
    preventDefault = true,
  } = options;

  const selectedIndexRef = useRef<number>(-1);
  const containerRef = useRef<HTMLElement>(null);

  // Navigate to next item
  const navigateNext = useCallback(() => {
    if (!enabled || items.length === 0) return;

    const currentIndex = selectedIndexRef.current;
    let nextIndex = currentIndex + 1;

    if (nextIndex >= items.length) {
      nextIndex = wrapAround ? 0 : items.length - 1;
    }

    selectedIndexRef.current = nextIndex;
    onSelect?.(items[nextIndex]);
    
    // Focus the element if available
    items[nextIndex]?.element?.focus();
  }, [enabled, items, onSelect, wrapAround]);

  // Navigate to previous item
  const navigatePrevious = useCallback(() => {
    if (!enabled || items.length === 0) return;

    const currentIndex = selectedIndexRef.current;
    let prevIndex = currentIndex - 1;

    if (prevIndex < 0) {
      prevIndex = wrapAround ? items.length - 1 : 0;
    }

    selectedIndexRef.current = prevIndex;
    onSelect?.(items[prevIndex]);
    
    // Focus the element if available
    items[prevIndex]?.element?.focus();
  }, [enabled, items, onSelect, wrapAround]);

  // Navigate to specific index
  const navigateToIndex = useCallback((index: number) => {
    if (!enabled || items.length === 0 || index < 0 || index >= items.length) return;

    selectedIndexRef.current = index;
    onSelect?.(items[index]);
    
    // Focus the element if available
    items[index]?.element?.focus();
  }, [enabled, items, onSelect]);

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
    const currentIndex = selectedIndexRef.current;
    const nextIndex = Math.min(currentIndex + 10, items.length - 1);
    navigateToIndex(nextIndex);
  }, [navigateToIndex, items.length]);

  const navigatePageUp = useCallback(() => {
    const currentIndex = selectedIndexRef.current;
    const prevIndex = Math.max(currentIndex - 10, 0);
    navigateToIndex(prevIndex);
  }, [navigateToIndex]);

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
        const currentItem = items[selectedIndexRef.current];
        if (currentItem) {
          currentItem.element?.click();
        }
        break;
    }
  }, [enabled, preventDefault, navigateNext, navigatePrevious, navigateFirst, navigateLast, navigatePageDown, navigatePageUp, items]);

  // Set up keyboard event listener
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !enabled) return;

    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown, enabled]);

  return {
    selectedIndex: selectedIndexRef.current,
    setSelectedIndex: (index: number) => { selectedIndexRef.current = index; },
    navigateNext,
    navigatePrevious,
    navigateToIndex,
    navigateFirst,
    navigateLast,
    navigatePageUp,
    navigatePageDown,
    containerRef,
  };
}

// Hook for virtual list keyboard navigation
export function useVirtualListNavigation<T>(
  items: T[],
  getItemId: (item: T) => string,
  onSelect?: (item: T, index: number) => void,
  options: KeyboardNavigationOptions & {
    itemHeight?: number;
    containerHeight?: number;
    scrollIntoView?: boolean;
  } = {}
) {
  const {
    itemHeight = 40,
    containerHeight = 400,
    scrollIntoView = true,
    ...navOptions
  } = options;

  const containerRef = useRef<HTMLElement>(null);
  const selectedIndexRef = useRef<number>(-1);

  // Get navigation items
  const navigationItems = items.map((item, index) => ({
    id: getItemId(item),
    element: undefined, // Will be set by render function
    index,
    data: item,
  }));

  const { navigateNext, navigatePrevious, navigateToIndex, navigateFirst, navigateLast } = useKeyboardNavigation(
    navigationItems,
    (navItem) => {
      onSelect?.(navItem.data, navItem.index);
    },
    navOptions
  );

  // Scroll item into view
  const scrollToItem = useCallback((index: number) => {
    if (!scrollIntoView || !containerRef.current) return;

    const container = containerRef.current;
    const itemTop = index * itemHeight;
    const itemBottom = itemTop + itemHeight;
    const containerTop = container.scrollTop;
    const containerBottom = containerTop + containerHeight;

    // Scroll if item is not visible
    if (itemTop < containerTop) {
      container.scrollTop = itemTop;
    } else if (itemBottom > containerBottom) {
      container.scrollTop = itemBottom - containerHeight;
    }
  }, [itemHeight, containerHeight, scrollIntoView]);

  // Enhanced navigation with scrolling
  const navigateNextWithScroll = useCallback(() => {
    const currentIndex = selectedIndexRef.current;
    const nextIndex = Math.min(currentIndex + 1, items.length - 1);
    
    navigateToIndex(nextIndex);
    scrollToItem(nextIndex);
    selectedIndexRef.current = nextIndex;
  }, [items.length, navigateToIndex, scrollToItem]);

  const navigatePreviousWithScroll = useCallback(() => {
    const currentIndex = selectedIndexRef.current;
    const prevIndex = Math.max(currentIndex - 1, 0);
    
    navigateToIndex(prevIndex);
    scrollToItem(prevIndex);
    selectedIndexRef.current = prevIndex;
  }, [navigateToIndex, scrollToItem]);

  // Handle keyboard events with custom logic
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!navOptions.enabled) return;

    switch (event.key) {
      case 'ArrowDown':
        if (navOptions.preventDefault) event.preventDefault();
        navigateNextWithScroll();
        break;
      case 'ArrowUp':
        if (navOptions.preventDefault) event.preventDefault();
        navigatePreviousWithScroll();
        break;
      case 'Home':
        if (navOptions.preventDefault) event.preventDefault();
        navigateFirst();
        scrollToItem(0);
        selectedIndexRef.current = 0;
        break;
      case 'End':
        if (navOptions.preventDefault) event.preventDefault();
        navigateLast();
        scrollToItem(items.length - 1);
        selectedIndexRef.current = items.length - 1;
        break;
      case 'PageDown':
        if (navOptions.preventDefault) event.preventDefault();
        const pageDownIndex = Math.min(selectedIndexRef.current + Math.floor(containerHeight / itemHeight), items.length - 1);
        navigateToIndex(pageDownIndex);
        scrollToItem(pageDownIndex);
        selectedIndexRef.current = pageDownIndex;
        break;
      case 'PageUp':
        if (navOptions.preventDefault) event.preventDefault();
        const pageUpIndex = Math.max(selectedIndexRef.current - Math.floor(containerHeight / itemHeight), 0);
        navigateToIndex(pageUpIndex);
        scrollToItem(pageUpIndex);
        selectedIndexRef.current = pageUpIndex;
        break;
    }
  }, [navOptions, navigateNextWithScroll, navigatePreviousWithScroll, navigateFirst, navigateLast, scrollToItem, items.length, containerHeight, itemHeight]);

  // Set up keyboard event listener
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !navOptions.enabled) return;

    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown, navOptions.enabled]);

  return {
    selectedIndex: selectedIndexRef.current,
    setSelectedIndex: (index: number) => {
      selectedIndexRef.current = index;
      scrollToItem(index);
    },
    navigateNext: navigateNextWithScroll,
    navigatePrevious: navigatePreviousWithScroll,
    navigateToIndex: (index: number) => {
      navigateToIndex(index);
      scrollToItem(index);
      selectedIndexRef.current = index;
    },
    navigateFirst,
    navigateLast,
    containerRef,
    scrollToItem,
  };
}

// Hook for search navigation
export function useSearchNavigation<T>(
  items: T[],
  searchQuery: string,
  getItemText: (item: T) => string,
  getItemId: (item: T) => string,
  options: {
    caseSensitive?: boolean;
    wholeWord?: boolean;
    regex?: boolean;
  } = {}
) {
  const {
    caseSensitive = false,
    wholeWord = false,
    regex = false,
  } = options;

  const [currentMatchIndex, setCurrentMatchIndex] = useState(-1);
  const [matches, setMatches] = useState<Array<{ item: T; index: number; text: string }>>([]);

  // Find matches
  useEffect(() => {
    if (!searchQuery) {
      setMatches([]);
      setCurrentMatchIndex(-1);
      return;
    }

    const searchPattern = regex
      ? new RegExp(searchQuery, caseSensitive ? 'g' : 'gi')
      : new RegExp(
          searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
          wholeWord ? `\\b${caseSensitive ? '' : 'i'}g` : `${caseSensitive ? '' : 'i'}g`
        );

    const newMatches: Array<{ item: T; index: number; text: string }> = [];

    items.forEach((item, index) => {
      const text = getItemText(item);
      const itemMatches = text.match(searchPattern);
      
      if (itemMatches) {
        newMatches.push({
          item,
          index,
          text: itemMatches[0],
        });
      }
    });

    setMatches(newMatches);
    setCurrentMatchIndex(newMatches.length > 0 ? 0 : -1);
  }, [items, searchQuery, caseSensitive, wholeWord, regex, getItemText]);

  // Navigate to next match
  const navigateNextMatch = useCallback(() => {
    if (matches.length === 0) return;
    
    const nextIndex = (currentMatchIndex + 1) % matches.length;
    setCurrentMatchIndex(nextIndex);
  }, [matches.length, currentMatchIndex]);

  // Navigate to previous match
  const navigatePreviousMatch = useCallback(() => {
    if (matches.length === 0) return;
    
    const prevIndex = currentMatchIndex <= 0 ? matches.length - 1 : currentMatchIndex - 1;
    setCurrentMatchIndex(prevIndex);
  }, [matches.length, currentMatchIndex]);

  // Get current match
  const currentMatch = matches[currentMatchIndex];

  return {
    matches,
    currentMatchIndex,
    currentMatch,
    totalMatches: matches.length,
    navigateNextMatch,
    navigatePreviousMatch,
    setCurrentMatchIndex,
  };
}
