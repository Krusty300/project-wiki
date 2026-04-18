'use client';

import { useState } from 'react';
import { useNotes, useFolders, createFolder, useNotesByTags, deleteNote, deleteFolder } from '@/hooks/useNotes';
import { useUIStore } from '@/store/ui-store';
import { useSidebarStore, getSidebarThemeClasses } from '@/store/sidebar-store';
import { useSortedNotes, useSortedFolders } from '@/hooks/useSortedItems';
import { Folder as FolderIcon, FileText, Plus, Settings, GripVertical, Trash2, MoreHorizontal } from 'lucide-react';
import { Folder, Note } from '@/types';
import DraggableNote from '../dnd/DraggableNote';
import DraggableFolder from '../dnd/DraggableFolder';
import DroppableFolder from '../dnd/DroppableFolder';
import DragDropContext from '../dnd/DragDropContext';
import TagFilter from '../tags/TagFilter';
import ConfirmDialog from '../ui/ConfirmDialog';
import SidebarResizeHandle from './SidebarResizeHandle';
import SidebarSettings from './SidebarSettings';
import { NoteItem, FolderItem } from './LayoutComponents';

export default function DraggableSidebar() {
  const [newFolderName, setNewFolderName] = useState('');
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: 'note' | 'folder';
    item: Note | Folder | null;
  } | null>(null);
  
  const { 
    sidebarOpen, 
    currentFolderId, 
    currentNoteId, 
    setCurrentFolderId, 
    setCurrentNoteId, 
    selectedTagIds,
    darkMode 
  } = useUIStore();
  
  const {
    sidebarWidth,
    sidebarTheme,
    enableAnimations,
  } = useSidebarStore();
  
  const rootNotes = useNotesByTags(selectedTagIds);
  const allFolders = useFolders();
  const rootFolders = allFolders.filter(f => f.parentId === null);
  
  // Apply sorting
  const sortedRootNotes = useSortedNotes(rootNotes || []);
  const sortedRootFolders = useSortedFolders(rootFolders);

  const handleDeleteNote = (note: Note) => {
    setDeleteConfirm({ type: 'note', item: note });
  };

  const handleDeleteFolder = (folder: Folder) => {
    setDeleteConfirm({ type: 'folder', item: folder });
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirm?.item) return;
    
    if (deleteConfirm.type === 'note') {
      await deleteNote(deleteConfirm.item.id);
    } else if (deleteConfirm.type === 'folder') {
      await deleteFolder(deleteConfirm.item.id);
    }
    
    setDeleteConfirm(null);
  };

  const getDeleteMessage = () => {
    if (!deleteConfirm?.item) return '';
    
    if (deleteConfirm.type === 'note') {
      const note = deleteConfirm.item as Note;
      return `Are you sure you want to delete "${note.title}"? This action cannot be undone.`;
    } else {
      const folder = deleteConfirm.item as Folder;
      return `Are you sure you want to delete "${folder.name}"? All notes in this folder will be moved to the root directory.`;
    }
  };

  const handleCreateFolder = async () => {
    if (newFolderName.trim()) {
      await createFolder(newFolderName.trim());
      setNewFolderName('');
      setShowNewFolder(false);
    }
  };

  const renderFolderTree = (folders: Folder[], notes: Note[], level: number = 0, currentNoteId: string | null = null) => {
    return folders.map(folder => {
      const folderNotes = notes.filter((note: Note) => note.folderId === folder.id);
      const subfolders = allFolders.filter((f: Folder) => f.parentId === folder.id);
      
      return (
        <DroppableFolder key={folder.id} folder={folder}>
          <DraggableFolder
            key={folder.id}
            folder={folder}
            level={level}
            isSelected={currentFolderId === folder.id}
            currentNoteId={currentNoteId}
            onFolderClick={setCurrentFolderId}
            notes={folderNotes}
            subfolders={subfolders}
            renderSubfolders={(subs, nts, l, cId) => renderFolderTree(subs, nts, l, cId)}
            onDeleteFolder={handleDeleteFolder}
            onDeleteNote={handleDeleteNote}
          />
          
          {/* New Note Button for Folder */}
          {currentFolderId === folder.id && (
            <button
              onClick={() => {
                const createNewNote = async () => {
                  const { createNote } = await import('@/hooks/useNotes');
                  const newNote = await createNote({ folderId: folder.id });
                  setCurrentNoteId(newNote.id);
                };
                createNewNote();
              }}
              className="flex items-center gap-2 px-2 py-1 ml-6 mb-2 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              <Plus className="w-3 h-3" />
              New Note
            </button>
          )}
          
          {renderFolderTree(subfolders, notes, level + 1, currentNoteId)}
        </DroppableFolder>
      );
    });
  };

  if (!sidebarOpen) return null;

  const themeClasses = getSidebarThemeClasses(sidebarTheme, darkMode);
  const animationClasses = enableAnimations ? 'transition-all duration-200' : '';

  return (
    <div 
      className={`h-full flex flex-col ${themeClasses} ${animationClasses}`}
      style={{ width: `${sidebarWidth}px` }}
    >
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Wiki</h2>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded ${
                showSettings ? 'bg-gray-100 dark:bg-gray-800' : ''
              }`}
              title="Sidebar Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowNewFolder(true)}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* Settings Panel */}
        {showSettings && (
          <div className="relative">
            <SidebarSettings
              isOpen={showSettings}
              onClose={() => setShowSettings(false)}
            />
          </div>
        )}
        
        <TagFilter />
      </div>
        
      {showNewFolder && (
        <div className="flex gap-2 p-4 border-b border-gray-200 dark:border-gray-700">
          <input
            type="text"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreateFolder();
              if (e.key === 'Escape') {
                setShowNewFolder(false);
                setNewFolderName('');
              }
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
          <button
            onClick={() => {
              setShowNewFolder(false);
              setNewFolderName('');
            }}
            className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            Cancel
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-2">
        <div className="mb-4">
          <button
            onClick={() => setCurrentFolderId(null)}
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
          
          {/* New Note Button */}
          <button
            onClick={() => {
              // Create new note and set it as current
              const createNewNote = async () => {
                const { createNote } = await import('@/hooks/useNotes');
                const newNote = await createNote();
                setCurrentNoteId(newNote.id);
              };
              createNewNote();
            }}
            className="w-full flex items-center gap-2 px-2 py-1 rounded cursor-pointer bg-blue-500 text-white hover:bg-blue-600"
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm font-medium">New Note</span>
          </button>
        </div>

        {currentFolderId === null && sortedRootNotes.map((note: Note) => (
          <NoteItem
            key={note.id}
            note={note}
            isSelected={currentNoteId === note.id}
            onClick={() => setCurrentNoteId(note.id)}
            onDelete={handleDeleteNote}
          />
        ))}

        {renderFolderTree(sortedRootFolders, rootNotes || [], 0, currentNoteId)}
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
      
      {/* Resize Handle */}
      <SidebarResizeHandle />
    </div>
  );
}
