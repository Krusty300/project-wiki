'use client';

import React, { memo, useCallback, useRef, useEffect, useState, useMemo } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { getExtensions } from '@/lib/tiptap-extensions';
import { Note } from '@/types';
import { v4 as uuidv4 } from 'uuid';

interface VirtualizedEditorProps {
  note?: Note;
  onSave?: (note: Note) => void;
  placeholder?: string;
  chunkSize?: number;
  threshold?: number;
  itemHeight?: number;
  containerHeight?: number;
  overscan?: number;
  enableVirtualScroll?: boolean;
  showLineNumbers?: boolean;
}

const CHUNK_SIZE = 1000; // Characters per chunk
const THRESHOLD = 200; // Distance from viewport to load more chunks

const VirtualizedEditor = memo(function VirtualizedEditor({ 
  note, 
  onSave, 
  placeholder,
  chunkSize = CHUNK_SIZE,
  threshold = THRESHOLD 
}: VirtualizedEditorProps) {
  const [visibleChunks, setVisibleChunks] = useState<Set<number>>(new Set([0]));
  const [isLoading, setIsLoading] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const chunksRef = useRef<Map<number, string>>(new Map());
  const lastScrollTopRef = useRef(0);

  // Parse note content into chunks
  const chunks = useMemo(() => {
    if (!note?.content) return [''];
    
    const content = typeof note.content === 'string' 
      ? note.content 
      : JSON.stringify(note.content);
    
    const chunks: string[] = [];
    for (let i = 0; i < content.length; i += chunkSize) {
      chunks.push(content.slice(i, i + chunkSize));
    }
    
    return chunks;
  }, [note?.content, chunkSize]);

  // Initialize chunks cache
  useEffect(() => {
    chunksRef.current.clear();
    chunks.forEach((chunk, index) => {
      chunksRef.current.set(index, chunk);
    });
  }, [chunks]);

  // Calculate visible chunks based on scroll position
  const calculateVisibleChunks = useCallback((scrollTop: number, containerHeight: number) => {
    const startChunk = Math.max(0, Math.floor(scrollTop / chunkSize) - 1);
    const endChunk = Math.min(
      chunks.length - 1,
      Math.ceil((scrollTop + containerHeight) / chunkSize) + 1
    );

    const newVisibleChunks = new Set<number>();
    for (let i = startChunk; i <= endChunk; i++) {
      newVisibleChunks.add(i);
    }

    return newVisibleChunks;
  }, [chunks.length, chunkSize]);

  // Handle scroll events for virtual scrolling
  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current) return;

    const scrollTop = scrollContainerRef.current.scrollTop;
    const containerHeight = scrollContainerRef.current.clientHeight;
    
    // Only update if scroll position changed significantly
    if (Math.abs(scrollTop - lastScrollTopRef.current) > threshold) {
      const newVisibleChunks = calculateVisibleChunks(scrollTop, containerHeight);
      setVisibleChunks(prev => {
        const changed = new Set(newVisibleChunks);
        for (const chunk of prev) {
          if (newVisibleChunks.has(chunk)) {
            changed.delete(chunk);
          }
        }
        return changed.size > 0 ? newVisibleChunks : prev;
      });
      
      lastScrollTopRef.current = scrollTop;
    }
  }, [calculateVisibleChunks, threshold]);

  // Lazy load chunks
  const loadChunk = useCallback(async (chunkIndex: number) => {
    if (chunksRef.current.has(chunkIndex)) return;

    setIsLoading(true);
    try {
      // Simulate async loading - in real app, this would fetch from server
      await new Promise(resolve => setTimeout(resolve, 50));
      chunksRef.current.set(chunkIndex, chunks[chunkIndex] || '');
    } catch (error) {
      console.error('Failed to load chunk:', chunkIndex, error);
    } finally {
      setIsLoading(false);
    }
  }, [chunks]);

  // Preload chunks near viewport
  const preloadNearbyChunks = useCallback(() => {
    const currentChunks = Array.from(visibleChunks);
    currentChunks.forEach(chunkIndex => {
      // Preload previous and next chunks
      [chunkIndex - 1, chunkIndex + 1].forEach(nearbyIndex => {
        if (nearbyIndex >= 0 && nearbyIndex < chunks.length && !chunksRef.current.has(nearbyIndex)) {
          loadChunk(nearbyIndex);
        }
      });
    });
  }, [visibleChunks, chunks.length, loadChunk]);

  // Initialize editor with minimal content
  const editor = useEditor({
    extensions: getExtensions(),
    editable: true,
    immediatelyRender: false,
    content: { type: 'doc', content: [{ type: 'paragraph', content: [] }] },
    onUpdate: ({ editor }) => {
      if (onSave && editor && !editor.isDestroyed) {
        const content = editor.getJSON();
        const updatedNote: Note = {
          id: note?.id || uuidv4(),
          title: extractTitle(content) || 'Untitled',
          content: content,
          markdown: '',
          folderId: note?.folderId || null,
          tags: note?.tags || [],
          updatedAt: new Date(),
          createdAt: note?.createdAt || new Date(),
          isArchived: note?.isArchived || false,
          isDeleted: note?.isDeleted || false,
        };
        
        onSave(updatedNote);
      }
    },
  });

  // Extract title from content
  const extractTitle = useCallback((content: any): string => {
    if (!content?.content || content.content.length === 0) {
      return 'Untitled';
    }
    
    const firstBlock = content.content[0];
    if (firstBlock?.type === 'heading') {
      return firstBlock.content?.map((t: any) => t.text).join('') || 'Untitled';
    }
    if (firstBlock?.type === 'paragraph') {
      const text = firstBlock.content?.map((t: any) => t.text).join('').trim();
      return text.slice(0, 50) || 'Untitled';
    }
    return 'Untitled';
  }, []);

  // Set up scroll listener
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Preload nearby chunks when visible chunks change
  useEffect(() => {
    preloadNearbyChunks();
  }, [visibleChunks, preloadNearbyChunks]);

  // Load initial content
  useEffect(() => {
    if (editor && note?.content && !editor.isDestroyed) {
      try {
        const content = typeof note.content === 'string' 
          ? note.content 
          : JSON.stringify(note.content);
        
        // Load first chunk immediately
        if (content.length > 0) {
          const firstChunk = content.slice(0, chunkSize);
          editor.commands.setContent(firstChunk);
        }
      } catch (error) {
        console.warn('Failed to load initial content:', error);
      }
    }
  }, [editor, note?.content, chunkSize]);

  // Render visible content
  const visibleContent = useMemo(() => {
    const sortedChunks = Array.from(visibleChunks).sort((a, b) => a - b);
    return sortedChunks
      .map(index => chunksRef.current.get(index) || '')
      .join('');
  }, [visibleChunks]);

  // Calculate total height for virtual scrolling
  const totalHeight = useMemo(() => {
    return chunks.length * chunkSize * 20; // Approximate height per character
  }, [chunks.length, chunkSize]);

  return (
    <div className="flex flex-col h-full">
      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute top-4 right-4 z-10">
          <div className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm">
            Loading...
          </div>
        </div>
      )}

      {/* Virtual scroll container */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-auto relative"
        style={{ height: '100%' }}
      >
        {/* Spacer to maintain scroll height */}
        <div style={{ height: totalHeight }} />
        
        {/* Content area */}
        <div className="absolute top-0 left-0 right-0">
          {editor ? (
            <EditorContent 
              editor={editor} 
              className="prose prose-lg dark:prose-invert max-w-none p-6"
              style={{ minHeight: '200px' }}
            />
          ) : (
            <div className="p-6 text-gray-500">
              Loading editor...
            </div>
          )}
        </div>
      </div>

      {/* Performance stats */}
      <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500">
        <div className="flex justify-between">
          <span>Chunks: {visibleChunks.size}/{chunks.length}</span>
          <span>Content: {visibleContent.length.toLocaleString()} chars</span>
          <span>Total: {(chunks.length * chunkSize).toLocaleString()} chars</span>
        </div>
      </div>
    </div>
  );
});

export default VirtualizedEditor;
