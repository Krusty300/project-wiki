'use client';

import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Folder as FolderIcon, ChevronRight, ChevronDown, GripVertical, MoreHorizontal, Trash2 } from 'lucide-react';
import { Folder, Note } from '@/types';
import DraggableNote from './DraggableNote';
import { useSortedNotes, useSortedFolders } from '@/hooks/useSortedItems';

interface DraggableFolderProps {
  folder: Folder;
  level: number;
  isSelected: boolean;
  currentNoteId: string | null;
  onFolderClick: (folderId: string) => void;
  notes: Note[];
  subfolders: Folder[];
  renderSubfolders: (subfolders: Folder[], notes: Note[], level: number, currentNoteId: string | null) => React.ReactNode;
  onDeleteFolder?: (folder: Folder) => void;
  onDeleteNote?: (note: Note) => void;
}

export default function DraggableFolder({
  folder,
  level,
  isSelected,
  currentNoteId,
  onFolderClick,
  notes,
  subfolders,
  renderSubfolders,
  onDeleteFolder,
  onDeleteNote,
}: DraggableFolderProps) {
  const [expanded, setExpanded] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  
  // Sort notes and subfolders
  const sortedNotes = useSortedNotes(notes);
  const sortedSubfolders = useSortedFolders(subfolders);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `folder-${folder.id}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div>
      <div
        ref={setNodeRef}
        className={`group flex items-center gap-1 px-2 py-1 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 ${
          isSelected ? 'bg-gray-100 dark:bg-gray-800' : ''
        } ${isDragging ? 'shadow-lg' : ''}`}
        style={{ paddingLeft: `${level * 12 + 8}px`, transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
        onClick={() => onFolderClick(folder.id)}
      >
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-0.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
        >
          <GripVertical className="w-3 h-3 text-gray-400" />
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(!expanded);
          }}
          className="p-0.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
        >
          {expanded ? (
            <ChevronDown className="w-3 h-3" />
          ) : (
            <ChevronRight className="w-3 h-3" />
          )}
        </button>
        <FolderIcon className="w-4 h-4 text-blue-500" />
        <span className="text-sm font-medium">{folder.name}</span>
        <span className="text-xs text-gray-500 ml-auto mr-2">
          {sortedNotes?.length || 0}
        </span>
        
        {onDeleteFolder && (
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
                    onDeleteFolder(folder);
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

      {expanded && (
        <div>
          {sortedSubfolders.map(subfolder => (
            <div key={subfolder.id}>
              {renderSubfolders([subfolder], notes, level + 1, currentNoteId)}
            </div>
          ))}
          {sortedNotes?.map(note => (
            <DraggableNote
              key={note.id}
              note={note}
              level={level + 1}
              isSelected={currentNoteId === note.id}
              currentNoteId={currentNoteId}
              onClick={() => {}} // Will be handled by parent
              onDeleteNote={onDeleteNote}
            />
          ))}
        </div>
      )}
    </div>
  );
}
