import { useState, useCallback, useRef, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { Note } from '@/types';

const PAGE_SIZE = 20;

interface UseInfiniteNotesOptions {
  folderId?: string | null;
  tagIds?: string[];
  initialPageSize?: number;
}

export function useInfiniteNotes(options: UseInfiniteNotesOptions = {}) {
  const { folderId, tagIds, initialPageSize = PAGE_SIZE } = options;
  
  const [page, setPage] = useState(0);
  const [allNotes, setAllNotes] = useState<Note[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  
  // Base query for current page
  const notesQuery = useCallback(() => {
    let query = db.notes.orderBy('updatedAt').reverse();
    
    if (folderId !== undefined) {
      if (folderId === null) {
        query = query.filter(note => !note.folderId);
      } else {
        query = query.filter(note => note.folderId === folderId);
      }
    }
    
    return query.filter(note => !note.isArchived);
  }, [folderId]);

  // Get current page of notes
  const currentPageNotes = useLiveQuery(
    () => notesQuery().offset(page * initialPageSize).limit(initialPageSize).toArray(),
    [page, notesQuery],
    []
  ) as Note[];

  // Merge new notes with existing ones
  useEffect(() => {
    if (currentPageNotes.length > 0) {
      setAllNotes(prev => {
        const existingIds = new Set(prev.map(note => note.id));
        const newNotes = currentPageNotes.filter(note => !existingIds.has(note.id));
        return [...prev, ...newNotes];
      });
    }
  }, [currentPageNotes]);

  // Check if there are more notes
  useEffect(() => {
    const checkHasMore = async () => {
      if (currentPageNotes.length < initialPageSize) {
        setHasMore(false);
        return;
      }
      
      try {
        const nextPageNotes = await notesQuery()
          .offset((page + 1) * initialPageSize)
          .limit(1)
          .toArray();
        setHasMore(nextPageNotes.length > 0);
      } catch (error) {
        console.warn('Error checking for more notes:', error);
        setHasMore(false);
      }
    };

    checkHasMore();
  }, [page, notesQuery, currentPageNotes.length]);

  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;
    
    setIsLoadingMore(true);
    try {
      setPage(prev => prev + 1);
    } catch (error) {
      console.error('Error loading more notes:', error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, hasMore]);

  const reset = useCallback(() => {
    setPage(0);
    setAllNotes([]);
    setHasMore(true);
    setIsLoadingMore(false);
  }, []);

  // Refetch data
  const refetch = useCallback(async () => {
    reset();
    // The useLiveQuery will automatically refetch
  }, [reset]);

  return {
    notes: allNotes,
    currentPageNotes,
    isLoadingMore,
    hasMore,
    loadMore,
    reset,
    refetch,
    page,
  };
}

// Hook for virtual scrolling with infinite loading
export function useVirtualInfiniteNotes(options: UseInfiniteNotesOptions = {}) {
  const { notes, isLoadingMore, hasMore, loadMore, reset } = useInfiniteNotes(options);
  
  return {
    notes,
    isLoadingMore,
    hasMore,
    loadMore,
    reset,
    // Virtual scrolling specific
    itemCount: notes.length,
    loadMoreThreshold: hasMore ? notes.length - 5 : -1, // Start loading 5 items before end
  };
}
