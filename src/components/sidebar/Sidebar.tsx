'use client';

import { useState, memo, useMemo, useCallback } from 'react';
import { useNotes, useFolders, createFolder, deleteNote, deleteFolder } from '@/hooks/useNotes';
import { useUIStore } from '@/store/ui-store';
import { Folder as FolderIcon, FileText, Plus, ChevronRight, ChevronDown, Trash2, MoreHorizontal } from 'lucide-react';
import { Folder, Note } from '@/types';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import VirtualList from '@/components/ui/VirtualList';

interface FolderItemProps {
  folder: Folder;
  level: number;
  onFolderClick: (folderId: string) => void;
  currentFolderId: string | null;
  onDeleteFolder: (folder: Folder) => void;
  onDeleteNote: (note: Note) => void;
}

const FolderItem = memo(function FolderItem({ folder, level, onFolderClick, currentFolderId, onDeleteFolder, onDeleteNote }: FolderItemProps) {
  const [expanded, setExpanded] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const notes = useNotes(folder.id);
  const subfolders = useMemo(() => useFolders().filter(f => f.parentId === folder.id), [folder.id]);

  const handleFolderClick = useCallback(() => {
    onFolderClick(folder.id);
  }, [onFolderClick, folder.id]);

  const handleToggleExpanded = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded(!expanded);
  }, [expanded]);

  const handleDeleteFolder = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onDeleteFolder(folder);
    setShowMenu(false);
  }, [onDeleteFolder, folder]);

  const renderNoteItem = useCallback((note: Note, index: number) => (
    <NoteItem
      key={note.id}
      note={note}
      level={level + 1}
      onDeleteNote={onDeleteNote}
    />
  ), [level, onDeleteNote]);

  return (
    <div>
      <div
        className={`group flex items-center gap-1 px-2 py-1 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 ${
          currentFolderId === folder.id ? 'bg-gray-100 dark:bg-gray-800' : ''
        }`}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
        onClick={handleFolderClick}
      >
        <button
          onClick={handleToggleExpanded}
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
          {notes?.length || 0}
        </span>
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
                onClick={handleDeleteFolder}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <Trash2 className="w-3 h-3" />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
      
      {expanded && (
        <div>
          {subfolders.map(subfolder => (
            <FolderItem
              key={subfolder.id}
              folder={subfolder}
              level={level + 1}
              onFolderClick={onFolderClick}
              currentFolderId={currentFolderId}
              onDeleteFolder={onDeleteFolder}
              onDeleteNote={onDeleteNote}
            />
          ))}
          {notes && notes.length > 0 && (
            <VirtualList
              items={notes}
              itemHeight={32}
              containerHeight={Math.min(notes.length * 32, 400)}
              renderItem={renderNoteItem}
              className="mb-2"
            />
          )}
        </div>
      )}
    </div>
  );
});

interface NoteItemProps {
  note: Note;
  level: number;
  onDeleteNote: (note: Note) => void;
}

const NoteItem = memo(function NoteItem({ note, level, onDeleteNote }: NoteItemProps) {
  const { setCurrentNoteId, currentNoteId } = useUIStore();
  const [showMenu, setShowMenu] = useState(false);

  const handleNoteClick = useCallback(() => {
    setCurrentNoteId(note.id);
  }, [setCurrentNoteId, note.id]);

  const handleDeleteNote = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onDeleteNote(note);
    setShowMenu(false);
  }, [onDeleteNote, note]);

  return (
    <div
      className={`group flex items-center gap-2 px-2 py-1 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 ${
        currentNoteId === note.id ? 'bg-gray-100 dark:bg-gray-800' : ''
      }`}
      style={{ paddingLeft: `${level * 12 + 20}px` }}
      onClick={handleNoteClick}
    >
      <FileText className="w-4 h-4 text-gray-500" />
      <span className="text-sm truncate flex-1">{note.title}</span>
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
              onClick={handleDeleteNote}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <Trash2 className="w-3 h-3" />
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
});

export default memo(function Sidebar() {
  const [newFolderName, setNewFolderName] = useState('');
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: 'note' | 'folder';
    item: Note | Folder | null;
  } | null>(null);
  
  const { sidebarOpen, currentFolderId, setCurrentFolderId } = useUIStore();
  const rootNotes = useNotes(null);
  const rootFolders = useMemo(() => useFolders().filter(f => f.parentId === null), []);

  const handleDeleteNote = useCallback((note: Note) => {
    setDeleteConfirm({ type: 'note', item: note });
  }, []);

  const handleDeleteFolder = useCallback((folder: Folder) => {
    setDeleteConfirm({ type: 'folder', item: folder });
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteConfirm?.item) return;
    
    if (deleteConfirm.type === 'note') {
      await deleteNote(deleteConfirm.item.id);
    } else if (deleteConfirm.type === 'folder') {
      await deleteFolder(deleteConfirm.item.id);
    }
    
    setDeleteConfirm(null);
  }, [deleteConfirm]);

  const getDeleteMessage = useCallback(() => {
    if (!deleteConfirm?.item) return '';
    
    if (deleteConfirm.type === 'note') {
      const note = deleteConfirm.item as Note;
      return `Are you sure you want to delete "${note.title}"? This action cannot be undone.`;
    } else {
      const folder = deleteConfirm.item as Folder;
      return `Are you sure you want to delete "${folder.name}"? All notes in this folder will be moved to root directory.`;
    }
  }, [deleteConfirm]);

  const handleCreateFolder = useCallback(async () => {
    if (newFolderName.trim()) {
      await createFolder(newFolderName.trim());
      setNewFolderName('');
      setShowNewFolder(false);
    }
  }, [newFolderName]);

  const handleSetCurrentFolderId = useCallback((folderId: string | null) => {
    setCurrentFolderId(folderId);
  }, [setCurrentFolderId]);

  const renderRootNoteItem = useCallback((note: Note, index: number) => (
    <NoteItem 
      key={note.id} 
      note={note} 
      level={0} 
      onDeleteNote={handleDeleteNote}
    />
  ), [handleDeleteNote]);

  return (
    <div className="w-64 h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Wiki</h2>
          <button
            onClick={() => setShowNewFolder(true)}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        
        {showNewFolder && (
          <div className="flex gap-2">
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateFolder();
                if (e.key === 'Escape') setShowNewFolder(false);
              }}
              placeholder="Folder name..."
              className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
              autoFocus
            />
            <button
              onClick={handleCreateFolder}
              className="px-2 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Add
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        <div className="mb-4">
          <button
            onClick={() => handleSetCurrentFolderId(null)}
            className={`w-full flex items-center gap-2 px-2 py-1 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 ${
              currentFolderId === null ? 'bg-gray-100 dark:bg-gray-800' : ''
            }`}
          >
            <FileText className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium">All Notes</span>
            <span className="text-xs text-gray-500 ml-auto">
              {rootNotes?.length || 0}
            </span>
          </button>
        </div>

        {currentFolderId === null && rootNotes && rootNotes.length > 0 && (
          <VirtualList
            items={rootNotes}
            itemHeight={32}
            containerHeight={Math.min(rootNotes.length * 32, 400)}
            renderItem={renderRootNoteItem}
            className="mb-4"
          />
        )}

        {rootFolders.map(folder => (
          <FolderItem
            key={folder.id}
            folder={folder}
            level={0}
            onFolderClick={handleSetCurrentFolderId}
            currentFolderId={currentFolderId}
            onDeleteFolder={handleDeleteFolder}
            onDeleteNote={handleDeleteNote}
          />
        ))}
      </div>
      
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleConfirmDelete}
        title={`Delete ${deleteConfirm?.type === 'note' ? 'Note' : 'Folder'}`}
        message={getDeleteMessage()}
        confirmText="Delete"
        type="danger"
      />
    </div>
  );
});
