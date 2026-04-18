'use client';

import React, { useState, useEffect } from 'react';
import { NodeViewProps, NodeViewWrapper } from '@tiptap/react';
import { Link2, FileText } from 'lucide-react';
import { useNotes } from '@/hooks/useNotes';

export default function NoteLinkComponent(props: NodeViewProps) {
  const { node, updateAttributes } = props;
  const { noteId, text } = node.attrs;
  const [isEditing, setIsEditing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [resolvedTitle, setResolvedTitle] = useState(text || '');
  
  const allNotes = useNotes();

  useEffect(() => {
    if (noteId && !text) {
      // Try to resolve the note title
      const note = allNotes?.find(n => n.id === noteId);
      if (note) {
        setResolvedTitle(note.title);
        updateAttributes({ text: note.title });
      }
    }
  }, [noteId, text, allNotes, updateAttributes]);

  useEffect(() => {
    if (searchQuery) {
      const results = allNotes?.filter(note => 
        note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.id === noteId
      ).slice(0, 5) || [];
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, allNotes, noteId]);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (noteId) {
      // Dispatch custom event to navigate to note
      window.dispatchEvent(new CustomEvent('navigateToNote', { detail: { noteId } }));
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsEditing(true);
    setSearchQuery('');
  };

  const handleNoteSelect = (selectedNote: any) => {
    updateAttributes({ 
      noteId: selectedNote.id, 
      text: selectedNote.title 
    });
    setResolvedTitle(selectedNote.title);
    setIsEditing(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsEditing(false);
      setSearchQuery('');
      setSearchResults([]);
    }
  };

  if (isEditing) {
    return (
      <NodeViewWrapper className="inline-block">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search notes..."
            className="px-2 py-1 text-sm border border-blue-300 rounded bg-blue-50 dark:bg-blue-900/20 dark:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[200px]"
            autoFocus
          />
          
          {searchResults.length > 0 && (
            <div className="absolute top-full left-0 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
              {searchResults.map(note => (
                <button
                  key={note.id}
                  onClick={() => handleNoteSelect(note)}
                  className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-sm"
                >
                  <FileText className="w-3 h-3 text-gray-400" />
                  <span className="truncate">{note.title}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </NodeViewWrapper>
    );
  }

  return (
    <NodeViewWrapper className="inline-block">
      <span
        className="inline-flex items-center gap-1 px-1 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
        onClick={handleClick}
        title={`Click to open: ${resolvedTitle || noteId}`}
      >
        <Link2 className="w-3 h-3" />
        <span>{resolvedTitle || `[[${noteId}]]`}</span>
        <button
          onClick={handleEdit}
          className="ml-1 opacity-0 hover:opacity-100 transition-opacity"
          title="Edit link"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        </button>
      </span>
    </NodeViewWrapper>
  );
}
