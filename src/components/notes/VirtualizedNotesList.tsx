'use client';

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Note } from '@/types';
import { useNotes } from '@/hooks/useNotes';
import { useFolderCache } from '@/hooks/useFolderCache';
import { useLazyFolderLoading } from '@/hooks/useLazyFolderLoading';
import { useOptimisticUpdates } from '@/hooks/useOptimisticUpdates';
import VirtualList from '@/components/ui/VirtualList';

interface VirtualizedNotesListProps {
  folderId?: string | null;
  selectedNoteId?: string | null;
  onNoteSelect?: (noteId: string) => void;
  onNoteDelete?: (noteId: string) => void;
  className?: string;
  itemHeight?: number;
  containerHeight?: number;
  overscan?: number;
  enableVirtualScroll?: boolean;
  showPreviews?: boolean;
  sortBy?: 'title' | 'date' | 'manual';
  sortOrder?: 'asc' | 'desc';
}

interface VirtualNoteItem {
  note: Note;
  index: number;
  isSelected: boolean;
  isHovered: boolean;
}

export default function VirtualizedNotesList({
  folderId = null,
  selectedNoteId = null,
  onNoteSelect,
  onNoteDelete,
  className = '',
  itemHeight = 60,
  containerHeight = 400,
  overscan = 5,
  enableVirtualScroll = true,
  showPreviews = true,
  sortBy = 'date',
  sortOrder = 'desc',
}: VirtualizedNotesListProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Get notes with lazy loading and caching
  const { notes, folders, isLoading, hasMore, loadMore } = useLazyFolderLoading(folderId, {
    pageSize: 50,
    initialLoadSize: 100,
  });

  // Optimistic updates for immediate feedback
  const { items: optimisticNotes, create, update, remove } = useOptimisticUpdates(notes);

  // Cache frequently accessed notes
  const { get, set } = useFolderCache({ maxSize: 100 });

  // Filter and sort notes
  const filteredNotes = useMemo(() => {
    let filtered = optimisticNotes;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(note =>
        note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.content.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'date':
          comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
          break;
        case 'manual':
          comparison = 0; // Keep original order
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [optimisticNotes, searchQuery, sortBy, sortOrder]);

  // Handle note selection
  const handleNoteSelect = useCallback((note: Note) => {
    onNoteSelect?.(note.id);
    
    // Cache the selected note for faster access
    set(note.id, { notes: [note], folders: [], totalCount: 1 });
  }, [onNoteSelect, set]);

  // Handle note deletion with optimistic update
  const handleNoteDelete = useCallback(async (noteId: string) => {
    const note = optimisticNotes.find(n => n.id === noteId);
    if (!note) return;

    // Optimistic deletion
    remove(noteId, async () => {
      // Actual deletion would go here
      // await deleteNote(noteId);
    });

    try {
      // Actual deletion would go here
      // await deleteNote(noteId);
      onNoteDelete?.(noteId);
    } catch (error) {
      console.error('Failed to delete note:', error);
      // Error handling would revert the optimistic update
    }
  }, [optimisticNotes, remove, onNoteDelete]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!filteredNotes.length) return;

    const currentIndex = filteredNotes.findIndex(note => note.id === selectedNoteId);
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (currentIndex < filteredNotes.length - 1) {
          handleNoteSelect(filteredNotes[currentIndex + 1]);
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (currentIndex > 0) {
          handleNoteSelect(filteredNotes[currentIndex - 1]);
        }
        break;
      case 'Enter':
        e.preventDefault();
        if (currentIndex >= 0) {
          handleNoteSelect(filteredNotes[currentIndex]);
        }
        break;
      case 'Delete':
        e.preventDefault();
        if (currentIndex >= 0) {
          handleNoteDelete(filteredNotes[currentIndex].id);
        }
        break;
    }
  }, [filteredNotes, selectedNoteId, handleNoteSelect, handleNoteDelete]);

  // Render individual note item
  const renderNoteItem = useCallback((note: Note, index: number, style?: React.CSSProperties) => {
    const isSelected = note.id === selectedNoteId;
    const isHovered = index === hoveredIndex;

    return (
      <div
        key={note.id}
        style={{
          ...style,
          padding: '12px 16px',
          borderBottom: '1px solid #e5e7eb',
          backgroundColor: isSelected ? '#f3f4f6' : isHovered ? '#fafafa' : 'white',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
        className={`group ${className}`}
        onClick={() => handleNoteSelect(note)}
        onMouseEnter={() => setHoveredIndex(index)}
        onMouseLeave={() => setHoveredIndex(null)}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-gray-900 truncate">
              {note.title || 'Untitled'}
            </h3>
            
            {showPreviews && (
              <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                {note.content.substring(0, 100)}...
              </p>
            )}
            
            <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
              <span>{new Date(note.updatedAt).toLocaleDateString()}</span>
              {note.tags && note.tags.length > 0 && (
                <>
                  <span>•</span>
                  <div className="flex gap-1">
                    {note.tags.slice(0, 3).map(tag => (
                      <span key={tag} className="px-1 py-0.5 bg-gray-100 rounded text-xs">
                        {tag}
                      </span>
                    ))}
                    {note.tags.length > 3 && (
                      <span className="text-gray-400">+{note.tags.length - 3}</span>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
          
          {/* Action buttons */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleNoteDelete(note.id);
              }}
              className="p-1 text-gray-400 hover:text-red-600 transition-colors"
              title="Delete note"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  }, [selectedNoteId, hoveredIndex, showPreviews, className, handleNoteSelect, handleNoteDelete]);

  // Load more on scroll for virtual list
  const handleVirtualScroll = useCallback((scrollTop: number) => {
    if (hasMore && !isLoading) {
      loadMore();
    }
  }, [hasMore, isLoading, loadMore]);

  // Load more on scroll for regular list
  const handleRegularScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    if (hasMore && !isLoading) {
      loadMore();
    }
  }, [hasMore, isLoading, loadMore]);

  if (enableVirtualScroll) {
    return (
      <div className="flex flex-col h-full">
        {/* Search bar */}
        <div className="p-3 border-b">
          <input
            type="text"
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Virtualized list */}
        <div
          className="flex-1"
          onKeyDown={handleKeyDown}
          tabIndex={0}
        >
          <VirtualList
            items={filteredNotes}
            itemHeight={itemHeight}
            containerHeight={containerHeight}
            renderItem={renderNoteItem}
            overscan={overscan}
            onScroll={handleVirtualScroll}
          />
        </div>

        {/* Loading indicator */}
        {isLoading && (
          <div className="p-4 text-center text-sm text-gray-500">
            Loading more notes...
          </div>
        )}

        {/* Empty state */}
        {filteredNotes.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <svg className="w-12 h-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-lg font-medium">No notes found</p>
            <p className="text-sm">Create a new note to get started</p>
          </div>
        )}
      </div>
    );
  }

  // Fallback to non-virtual rendering for small lists
  return (
    <div className="flex flex-col h-full">
      {/* Search bar */}
      <div className="p-3 border-b">
        <input
          type="text"
          placeholder="Search notes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Regular list */}
      <div
        className="flex-1 overflow-auto"
        style={{ height: containerHeight }}
        onScroll={handleRegularScroll}
        onKeyDown={handleKeyDown}
        tabIndex={0}
      >
        {filteredNotes.map((note, index) => renderNoteItem(note, index))}
      </div>

      {/* Loading indicator */}
      {isLoading && (
        <div className="p-4 text-center text-sm text-gray-500">
          Loading more notes...
        </div>
      )}
    </div>
  );
}

// Hook for managing virtualized notes list
export function useVirtualizedNotesList(options: {
  folderId?: string | null;
  sortBy?: 'title' | 'date' | 'manual';
  sortOrder?: 'asc' | 'desc';
  itemHeight?: number;
  containerHeight?: number;
} = {}) {
  const {
    folderId = null,
    sortBy = 'date',
    sortOrder = 'desc',
    itemHeight = 60,
    containerHeight = 400,
  } = options;

  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);

  const handleNoteSelect = useCallback((noteId: string) => {
    setSelectedNoteId(noteId);
  }, []);

  const handleNoteDelete = useCallback((noteId: string) => {
    // Handle note deletion
    console.log('Delete note:', noteId);
  }, []);

  return {
    selectedNoteId,
    setSelectedNoteId,
    handleNoteSelect,
    handleNoteDelete,
    sortBy,
    sortOrder,
    itemHeight,
    containerHeight,
  };
}
