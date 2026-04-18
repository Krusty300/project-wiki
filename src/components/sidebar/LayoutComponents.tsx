'use client';

import { Note, Folder } from '@/types';
import { useSidebarStore } from '@/store/sidebar-store';
import { 
  FileText, 
  Folder as FolderIcon, 
  Calendar,
  Hash,
  GripVertical,
  MoreHorizontal,
  Trash2
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface NoteItemProps {
  note: Note;
  isSelected: boolean;
  onClick: () => void;
  onDelete?: (note: Note) => void;
  level?: number;
}

interface FolderItemProps {
  folder: Folder;
  isSelected: boolean;
  onClick: () => void;
  onDelete?: (folder: Folder) => void;
  noteCount?: number;
  level?: number;
}

export function CompactNoteItem({ note, isSelected, onClick, onDelete }: NoteItemProps) {
  const { showDragHandles } = useSidebarStore();
  
  return (
    <div
      className={`flex items-center gap-1 px-2 py-1 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 group ${
        isSelected ? 'bg-blue-100 dark:bg-blue-900' : ''
      }`}
      onClick={onClick}
    >
      {showDragHandles && (
        <GripVertical className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
      )}
      <FileText className="w-3 h-3 text-gray-500 flex-shrink-0" />
      <span className="flex-1 truncate text-xs">{note.title}</span>
      {onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(note);
          }}
          className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

export function DetailedNoteItem({ note, isSelected, onClick, onDelete }: NoteItemProps) {
  const { showNoteCount, showLastModified, showNotePreview, showDragHandles } = useSidebarStore();
  
  return (
    <div
      className={`flex flex-col gap-1 px-2 py-2 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 group ${
        isSelected ? 'bg-blue-100 dark:bg-blue-900' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-center gap-2">
        {showDragHandles && (
          <GripVertical className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
        )}
        <FileText className="w-4 h-4 text-gray-500 flex-shrink-0" />
        <span className="flex-1 truncate text-sm font-medium">{note.title}</span>
        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(note);
            }}
            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
      
      {(showLastModified || showNotePreview) && (
        <div className="pl-6 space-y-1">
          {showLastModified && (
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Calendar className="w-3 h-3" />
              {formatDistanceToNow(note.updatedAt, { addSuffix: true })}
            </div>
          )}
          
          {showNotePreview && note.content && (
            <div className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
              {typeof note.content === 'string' 
                ? note.content.substring(0, 100) + '...'
                : 'Rich content...'
              }
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function IconsOnlyNoteItem({ note, isSelected, onClick, onDelete }: NoteItemProps) {
  return (
    <div
      className={`flex items-center justify-center p-2 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 group ${
        isSelected ? 'bg-blue-100 dark:bg-blue-900' : ''
      }`}
      onClick={onClick}
      title={note.title}
    >
      <FileText className="w-4 h-4 text-gray-500" />
      {onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(note);
          }}
          className="absolute opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

export function CompactFolderItem({ folder, isSelected, onClick, onDelete, noteCount = 0 }: FolderItemProps) {
  const { showDragHandles, showNoteCount } = useSidebarStore();
  
  return (
    <div
      className={`flex items-center gap-1 px-2 py-1 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 group ${
        isSelected ? 'bg-blue-100 dark:bg-blue-900' : ''
      }`}
      onClick={onClick}
    >
      {showDragHandles && (
        <GripVertical className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
      )}
      <FolderIcon className="w-3 h-3 text-gray-500 flex-shrink-0" />
      <span className="flex-1 truncate text-xs">{folder.name}</span>
      {showNoteCount && (
        <span className="text-xs text-gray-500">{noteCount}</span>
      )}
      {onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(folder);
          }}
          className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

export function DetailedFolderItem({ folder, isSelected, onClick, onDelete, noteCount = 0 }: FolderItemProps) {
  const { showDragHandles, showNoteCount, showLastModified } = useSidebarStore();
  
  return (
    <div
      className={`flex flex-col gap-1 px-2 py-2 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 group ${
        isSelected ? 'bg-blue-100 dark:bg-blue-900' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-center gap-2">
        {showDragHandles && (
          <GripVertical className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
        )}
        <FolderIcon className="w-4 h-4 text-gray-500 flex-shrink-0" />
        <span className="flex-1 truncate text-sm font-medium">{folder.name}</span>
        {showNoteCount && (
          <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">
            {noteCount}
          </span>
        )}
        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(folder);
            }}
            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
      
      {showLastModified && (
        <div className="pl-6 flex items-center gap-1 text-xs text-gray-500">
          <Calendar className="w-3 h-3" />
          {formatDistanceToNow(folder.updatedAt, { addSuffix: true })}
        </div>
      )}
    </div>
  );
}

export function IconsOnlyFolderItem({ folder, isSelected, onClick, onDelete, noteCount = 0 }: FolderItemProps) {
  return (
    <div
      className={`flex flex-col items-center p-2 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 group ${
        isSelected ? 'bg-blue-100 dark:bg-blue-900' : ''
      }`}
      onClick={onClick}
      title={`${folder.name} (${noteCount} notes)`}
    >
      <FolderIcon className="w-4 h-4 text-gray-500" />
      <span className="text-xs text-gray-500 mt-1">{noteCount}</span>
      {onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(folder);
          }}
          className="absolute opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

// Layout selector component
export function NoteItem({ note, isSelected, onClick, onDelete, level = 0 }: NoteItemProps) {
  const { sidebarLayout } = useSidebarStore();
  
  switch (sidebarLayout) {
    case 'compact':
      return <CompactNoteItem note={note} isSelected={isSelected} onClick={onClick} onDelete={onDelete} />;
    case 'icons-only':
      return <IconsOnlyNoteItem note={note} isSelected={isSelected} onClick={onClick} onDelete={onDelete} />;
    case 'detailed':
    default:
      return <DetailedNoteItem note={note} isSelected={isSelected} onClick={onClick} onDelete={onDelete} />;
  }
}

export function FolderItem({ folder, isSelected, onClick, onDelete, noteCount = 0, level = 0 }: FolderItemProps) {
  const { sidebarLayout } = useSidebarStore();
  
  switch (sidebarLayout) {
    case 'compact':
      return <CompactFolderItem folder={folder} isSelected={isSelected} onClick={onClick} onDelete={onDelete} noteCount={noteCount} />;
    case 'icons-only':
      return <IconsOnlyFolderItem folder={folder} isSelected={isSelected} onClick={onClick} onDelete={onDelete} noteCount={noteCount} />;
    case 'detailed':
    default:
      return <DetailedFolderItem folder={folder} isSelected={isSelected} onClick={onClick} onDelete={onDelete} noteCount={noteCount} />;
  }
}
