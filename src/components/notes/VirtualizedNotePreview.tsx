'use client';

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Note } from '@/types';
import VirtualList from '@/components/ui/VirtualList';

interface VirtualizedNotePreviewProps {
  note: Note;
  content: string;
  className?: string;
  itemHeight?: number;
  containerHeight?: number;
  overscan?: number;
  showLineNumbers?: boolean;
  enableSyntaxHighlighting?: boolean;
  fontSize?: number;
  lineHeight?: number;
}

interface PreviewLine {
  id: string;
  content: string;
  lineNumber: number;
  type: 'text' | 'heading' | 'code' | 'quote' | 'list';
  level?: number;
}

export default function VirtualizedNotePreview({
  note,
  content,
  className = '',
  itemHeight = 24,
  containerHeight = 400,
  overscan = 10,
  showLineNumbers = true,
  enableSyntaxHighlighting = true,
  fontSize = 14,
  lineHeight = 1.5,
}: VirtualizedNotePreviewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLineIndex, setSelectedLineIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse content into lines with syntax detection
  const parseContentToLines = useCallback((text: string): PreviewLine[] => {
    const lines = text.split('\n');
    return lines.map((line, index) => {
      let type: PreviewLine['type'] = 'text';
      let level: number | undefined;

      // Detect headings
      if (line.startsWith('#')) {
        type = 'heading';
        level = (line.match(/^#+/) || [''])[0].length;
      }
      // Detect code blocks
      else if (line.startsWith('```') || line.startsWith('    ')) {
        type = 'code';
      }
      // Detect quotes
      else if (line.startsWith('>')) {
        type = 'quote';
      }
      // Detect lists
      else if (/^[\s]*[-*+]\s/.test(line) || /^[\s]*\d+\.\s/.test(line)) {
        type = 'list';
      }

      return {
        id: `line-${index}`,
        content: line,
        lineNumber: index,
        type,
        level,
      };
    });
  }, []);

  // Parse content on mount and when content changes
  const lines = useMemo(() => parseContentToLines(content), [content, parseContentToLines]);

  // Filter lines based on search
  const filteredLines = useMemo(() => {
    if (!searchQuery) return lines;
    
    return lines.filter(line =>
      line.content.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [lines, searchQuery]);

  // Highlight search terms
  const highlightSearchTerm = useCallback((text: string, term: string): React.ReactNode => {
    if (!term) return text;

    const parts = text.split(new RegExp(`(${term})`, 'gi'));
    return parts.map((part, index) => 
      part.toLowerCase() === term.toLowerCase() ? (
        <mark key={index} className="bg-yellow-200 px-1 rounded">
          {part}
        </mark>
      ) : (
        part
      )
    );
  }, []);

  // Get line styling based on type
  const getLineStyle = useCallback((line: PreviewLine): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      fontSize: `${fontSize}px`,
      lineHeight: lineHeight,
      minHeight: `${itemHeight}px`,
      display: 'flex',
      alignItems: 'center',
    };

    switch (line.type) {
      case 'heading':
        return {
          ...baseStyle,
          fontWeight: 'bold',
          fontSize: `${fontSize * (1.5 - (line.level || 1) * 0.1)}px`,
          marginTop: line.level === 1 ? '8px' : '4px',
          marginBottom: '4px',
        };
      case 'code':
        return {
          ...baseStyle,
          fontFamily: 'monospace',
          backgroundColor: '#f5f5f5',
          padding: '2px 4px',
          borderRadius: '2px',
        };
      case 'quote':
        return {
          ...baseStyle,
          fontStyle: 'italic',
          borderLeft: '3px solid #ddd',
          paddingLeft: '12px',
          marginLeft: '8px',
        };
      case 'list':
        return {
          ...baseStyle,
          paddingLeft: '20px',
        };
      default:
        return baseStyle;
    }
  }, [fontSize, lineHeight, itemHeight]);

  // Render individual line
  const renderLine = useCallback((line: PreviewLine, index: number, style?: React.CSSProperties) => {
    const isSelected = selectedLineIndex === index;
    const lineNumber = showLineNumbers ? line.lineNumber + 1 : null;

    return (
      <div
        key={line.id}
        style={{
          ...style,
          ...getLineStyle(line),
          backgroundColor: isSelected ? '#f0f9ff' : 'transparent',
          borderBottom: '1px solid #f0f0f0',
          padding: '2px 8px',
          transition: 'background-color 0.2s ease',
        }}
        className={`group hover:bg-gray-50 ${className}`}
        onClick={() => setSelectedLineIndex(index)}
      >
        {/* Line number */}
        {lineNumber && (
          <div
            className="flex-shrink-0 text-right text-xs text-gray-400 select-none mr-4"
            style={{ minWidth: '40px' }}
          >
            {lineNumber}
          </div>
        )}

        {/* Line content */}
        <div className="flex-1 min-w-0">
          {enableSyntaxHighlighting ? (
            highlightSearchTerm(line.content, searchQuery)
          ) : (
            line.content || '\u00A0' // Non-breaking space for empty lines
          )}
        </div>

        {/* Line type indicator */}
        <div className="flex-shrink-0 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {line.type === 'heading' && (
            <span className="text-xs text-gray-400">H{line.level}</span>
          )}
          {line.type === 'code' && (
            <span className="text-xs text-gray-400">CODE</span>
          )}
          {line.type === 'quote' && (
            <span className="text-xs text-gray-400">QUOTE</span>
          )}
          {line.type === 'list' && (
            <span className="text-xs text-gray-400">LIST</span>
          )}
        </div>
      </div>
    );
  }, [selectedLineIndex, showLineNumbers, getLineStyle, enableSyntaxHighlighting, highlightSearchTerm, searchQuery, className]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!filteredLines.length) return;

    const currentIndex = selectedLineIndex ?? -1;
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (currentIndex < filteredLines.length - 1) {
          setSelectedLineIndex(currentIndex + 1);
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (currentIndex > 0) {
          setSelectedLineIndex(currentIndex - 1);
        }
        break;
      case 'Home':
        e.preventDefault();
        setSelectedLineIndex(0);
        break;
      case 'End':
        e.preventDefault();
        setSelectedLineIndex(filteredLines.length - 1);
        break;
      case 'f':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          // Focus search input
          const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
          searchInput?.focus();
        }
        break;
    }
  }, [filteredLines.length, selectedLineIndex]);

  // Calculate statistics
  const stats = useMemo(() => ({
    totalLines: lines.length,
    visibleLines: filteredLines.length,
    words: content.split(/\s+/).filter(word => word.length > 0).length,
    characters: content.length,
    headings: lines.filter(line => line.type === 'heading').length,
    codeBlocks: lines.filter(line => line.type === 'code').length,
  }), [lines, filteredLines, content]);

  return (
    <div className="flex flex-col h-full border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 border-b px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-900">{note.title || 'Untitled'}</h3>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>{stats.words} words</span>
            <span>•</span>
            <span>{stats.characters} chars</span>
            <span>•</span>
            <span>{stats.totalLines} lines</span>
          </div>
        </div>
        
        {/* Search bar */}
        <input
          type="text"
          placeholder="Search in note..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-3 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Virtualized content */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto"
        onKeyDown={handleKeyDown}
        tabIndex={0}
      >
        <VirtualList
          items={filteredLines}
          itemHeight={itemHeight}
          containerHeight={containerHeight}
          renderItem={renderLine}
          overscan={overscan}
        />
      </div>

      {/* Footer */}
      <div className="bg-gray-50 border-t px-4 py-2">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-4">
            <span>{stats.headings} headings</span>
            <span>{stats.codeBlocks} code blocks</span>
            <span>Line {selectedLineIndex !== null ? selectedLineIndex + 1 : '-'}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedLineIndex(null)}
              className="px-2 py-1 text-xs bg-gray-200 rounded hover:bg-gray-300"
            >
              Clear Selection
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Hook for managing virtualized note preview
export function useVirtualizedNotePreview(
  note: Note,
  options: {
    itemHeight?: number;
    containerHeight?: number;
    showLineNumbers?: boolean;
    enableSyntaxHighlighting?: boolean;
  } = {}
) {
  const {
    itemHeight = 24,
    containerHeight = 400,
    showLineNumbers = true,
    enableSyntaxHighlighting = true,
  } = options;

  const [selectedLineIndex, setSelectedLineIndex] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const goToLine = useCallback((lineNumber: number) => {
    setSelectedLineIndex(lineNumber - 1); // Convert to 0-based index
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedLineIndex(null);
  }, []);

  const scrollToLine = useCallback((lineNumber: number) => {
    // This would scroll to the specific line in the virtual list
    // Implementation depends on the virtual list library used
    goToLine(lineNumber);
  }, [goToLine]);

  return {
    selectedLineIndex,
    setSelectedLineIndex,
    searchQuery,
    setSearchQuery,
    goToLine,
    clearSelection,
    scrollToLine,
    itemHeight,
    containerHeight,
    showLineNumbers,
    enableSyntaxHighlighting,
  };
}
