'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FileText, GripVertical, MoreHorizontal, Trash2 } from 'lucide-react';
import { Note } from '@/types';
import { useState } from 'react';

interface DraggableNoteProps {
  note: Note;
  level: number;
  isSelected: boolean;
  currentNoteId: string | null;
  onClick: () => void;
  onDeleteNote?: (note: Note) => void;
}

export default function DraggableNote({ note, level, isSelected, currentNoteId, onClick, onDeleteNote }: DraggableNoteProps) {
  const [showMenu, setShowMenu] = useState(false);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `note-${note.id}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div className="group">
      <div
        ref={setNodeRef}
        className={`flex items-center gap-2 px-2 py-1 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 ${
          isSelected ? 'bg-gray-100 dark:bg-gray-800' : ''
        } ${isDragging ? 'shadow-lg' : ''}`}
        style={{ paddingLeft: `${level * 12 + 20}px`, ...style }}
        onClick={onClick}
      >
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-0.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
        >
          <GripVertical className="w-3 h-3 text-gray-400" />
        </div>
        <FileText className="w-4 h-4 text-gray-500" />
        <span className="text-sm truncate flex-1">{note.title}</span>
        
        {onDeleteNote && (
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreHorizontal className="w-3 h-3" />
            </button>
            
            {showMenu && (
              <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-10 min-w-[120px]">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteNote(note);
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <Trash2 className="w-3 h-3" />
                  Delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
