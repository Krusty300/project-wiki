import { useState, useEffect, useCallback, useRef } from 'react';
import { useNotes, useFolders } from '@/hooks/useNotes';
import { Note, Folder } from '@/types';

interface LazyFolderContent {
  notes: Note[];
  folders: Folder[];
  isLoading: boolean;
  hasMore: boolean;
  loadMore: () => void;
  reset: () => void;
}

interface LazyLoadingOptions {
  pageSize?: number;
  initialLoadSize?: number;
  cacheSize?: number;
}

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface CacheEntry {
  data: {
    notes: Note[];
    folders: Folder[];
    hasMore: boolean;
  };
  timestamp: number;
}

export function useLazyFolderLoading(
  folderId: string | null,
  options: LazyLoadingOptions = {}
): LazyFolderContent {
  const {
    pageSize = 20,
    initialLoadSize = 50,
    cacheSize = 100
  } = options;

  const [loadedNotes, setLoadedNotes] = useState<Note[]>([]);
  const [loadedFolders, setLoadedFolders] = useState<Folder[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  
  const cacheRef = useRef<Map<string, CacheEntry>>(new Map());
  const abortControllerRef = useRef<AbortController | null>(null);

  const allNotes = useNotes(folderId);
  const allFolders = useFolders();

  // Filter and sort data
  const filteredData = useCallback(() => {
    let notes = allNotes || [];
    let folders = allFolders || [];

    if (folderId) {
      notes = notes.filter(note => note.folderId === folderId);
      folders = folders.filter(folder => folder.parentId === folderId);
    } else {
      // Root level
      folders = folders.filter(folder => folder.parentId === null);
    }

    return { notes, folders };
  }, [allNotes, allFolders, folderId]);

  // Load data with caching
  const loadData = useCallback(async (page: number, isInitial = false) => {
    const cacheKey = `${folderId}-${page}`;
    const cached = cacheRef.current.get(cacheKey);

    // Check cache first
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      const { notes, folders, hasMore } = cached.data;
      
      if (isInitial) {
        setLoadedNotes(notes);
        setLoadedFolders(folders);
      } else {
        setLoadedNotes(prev => [...prev, ...notes]);
        setLoadedFolders(prev => [...prev, ...folders]);
      }
      
      setHasMore(hasMore);
      return;
    }

    setIsLoading(true);
    
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    try {
      const { notes, folders } = filteredData();
      
      // Simulate pagination (in real app, this would be server-side)
      const startIndex = isInitial ? 0 : loadedNotes.length + loadedFolders.length;
      const endIndex = Math.min(
        startIndex + (isInitial ? initialLoadSize : pageSize),
        notes.length + folders.length
      );

      const paginatedNotes = notes.slice(0, Math.min(endIndex, notes.length));
      const paginatedFolders = folders.slice(0, Math.max(0, endIndex - notes.length));

      const newHasMore = endIndex < notes.length + folders.length;

      // Cache the results
      cacheRef.current.set(cacheKey, {
        data: {
          notes: paginatedNotes,
          folders: paginatedFolders,
          hasMore: newHasMore,
        },
        timestamp: Date.now(),
      });

      // Manage cache size
      if (cacheRef.current.size > cacheSize) {
        const oldestKey = cacheRef.current.keys().next().value;
        if (oldestKey) {
          cacheRef.current.delete(oldestKey);
        }
      }

      if (isInitial) {
        setLoadedNotes(paginatedNotes);
        setLoadedFolders(paginatedFolders);
      } else {
        setLoadedNotes(prev => [...prev, ...paginatedNotes]);
        setLoadedFolders(prev => [...prev, ...paginatedFolders]);
      }

      setHasMore(newHasMore);
      setCurrentPage(page);
    } catch (error) {
      console.error('Error loading folder content:', error);
    } finally {
      setIsLoading(false);
    }
  }, [folderId, filteredData, pageSize, initialLoadSize, cacheSize, loadedNotes.length, loadedFolders.length]);

  // Initial load
  useEffect(() => {
    loadData(0, true);
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [folderId, loadData]);

  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      loadData(currentPage + 1, false);
    }
  }, [isLoading, hasMore, currentPage, loadData]);

  const reset = useCallback(() => {
    setLoadedNotes([]);
    setLoadedFolders([]);
    setIsLoading(false);
    setHasMore(true);
    setCurrentPage(0);
    cacheRef.current.clear();
  }, []);

  return {
    notes: loadedNotes,
    folders: loadedFolders,
    isLoading,
    hasMore,
    loadMore,
    reset,
  };
}

// Hook for infinite scroll detection
export function useInfiniteScroll(
  containerRef: React.RefObject<HTMLElement>,
  hasMore: boolean,
  isLoading: boolean,
  onLoadMore: () => void,
  threshold: number = 200
) {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (!hasMore || isLoading) return;

      const { scrollTop, scrollHeight, clientHeight } = container;
      const distanceToBottom = scrollHeight - scrollTop - clientHeight;

      if (distanceToBottom <= threshold) {
        onLoadMore();
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [hasMore, isLoading, onLoadMore, threshold]);
}
