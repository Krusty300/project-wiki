'use client';

import React, { useMemo } from 'react';
import { Link2, ArrowLeft } from 'lucide-react';
import { useNotes } from '@/hooks/useNotes';
import { Note } from '@/types';

interface BacklinksProps {
  currentNoteId?: string;
  className?: string;
}

export default function Backlinks({ currentNoteId, className = '' }: BacklinksProps) {
  const allNotes = useNotes();

  const backlinks = useMemo(() => {
    if (!currentNoteId || !allNotes) return [];

    return allNotes.filter(note => {
      if (note.id === currentNoteId) return false;
      
      // Check if note content contains a link to current note
      const contentStr = JSON.stringify(note.content).toLowerCase();
      return contentStr.includes(currentNoteId.toLowerCase());
    });
  }, [currentNoteId, allNotes]);

  if (!currentNoteId || backlinks.length === 0) {
    return null;
  }

  const handleBacklinkClick = (noteId: string) => {
    window.dispatchEvent(new CustomEvent('openNote', { detail: { noteId } }));
  };

  return (
    <div className={`border-t border-gray-200 dark:border-gray-700 ${className}`}>
      <div className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Link2 className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Linked from {backlinks.length} {backlinks.length === 1 ? 'note' : 'notes'}
          </span>
        </div>
        
        <div className="space-y-2">
          {backlinks.map(note => (
            <button
              key={note.id}
              onClick={() => handleBacklinkClick(note.id)}
              className="w-full text-left p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group"
            >
              <div className="flex items-center gap-2">
                <ArrowLeft className="w-3 h-3 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                    {note.title}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(note.updatedAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
