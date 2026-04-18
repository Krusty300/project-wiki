'use client';

import { useState, useEffect } from 'react';
import { useUIStore } from '@/store/ui-store';
import { useNote, createNote, updateNote } from '@/hooks/useNotes';
import DraggableSidebar from '@/components/sidebar/DraggableSidebar';
import DragDropContext from '@/components/dnd/DragDropContext';
import SearchModal from '@/components/search/SearchModal';
import ThemeToggle from '@/components/theme/ThemeToggle';
import NoteEditor from '@/components/editor/NoteEditor';
import ExportImport from '@/components/export/ExportImport';
import TemplateSelector from '@/components/templates/TemplateSelector';
import TrashView from '@/components/trash/TrashView';
import { Menu, Search, Plus, FileText, Eye, EyeOff, Columns, Maximize2, Minimize2, Trash2 } from 'lucide-react';

export default function Home() {
  const { 
    sidebarOpen, 
    setSidebarOpen, 
    currentNoteId, 
    setCurrentNoteId,
    searchOpen,
    setSearchOpen,
    splitView,
    toggleSplitView,
    viewMode,
    setViewMode,
    focusMode,
    toggleFocusMode,
    showTrash,
    setShowTrash
  } = useUIStore();
  
  const currentNote = useNote(currentNoteId || '');
  const [isLoading, setIsLoading] = useState(false);

  
  const handleCreateNote = async (folderId?: string | null) => {
    setIsLoading(true);
    try {
      const newNote = await createNote({ folderId });
      setCurrentNoteId(newNote.id);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveNote = async (note: any) => {
    await updateNote(note.id, note);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      setSearchOpen(!searchOpen);
    }
    if (e.key === 'Escape' && searchOpen) {
      setSearchOpen(false);
    }
    if (e.key === 'Escape' && focusMode) {
      toggleFocusMode();
    }
    if ((e.metaKey || e.ctrlKey) && e.key === 'j') {
      e.preventDefault();
      toggleFocusMode();
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchOpen, setSearchOpen, focusMode, toggleFocusMode]);

  return (
    <DragDropContext>
      <div className="flex h-screen bg-white dark:bg-gray-900">
        {/* Sidebar - Hidden in focus mode */}
        {!focusMode && <DraggableSidebar />}
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header - Minimal in focus mode */}
        <header className={`${
          focusMode ? 'h-10 border-0' : 'h-14 border-b border-gray-200 dark:border-gray-700'
        } flex items-center justify-between px-4 transition-all duration-200`}>
          <div className="flex items-center gap-3">
            {!focusMode && (
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
              >
                <Menu className="w-4 h-4" />
              </button>
            )}
            
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-gray-500" />
              <span className={`font-medium ${focusMode ? 'text-sm' : 'text-sm'}`}>
                {currentNote?.title || 'Select a note or create a new one'}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {!focusMode && (
              <>
                <button
                  onClick={() => setSearchOpen(true)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                  title="Search (Cmd+K)"
                >
                  <Search className="w-4 h-4" />
                </button>
                
                <button
                  onClick={() => setShowTrash(!showTrash)}
                  className={`p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded ${
                    showTrash ? 'bg-red-100 dark:bg-red-900' : ''
                  }`}
                  title="Trash"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                
                {/* View Mode Controls */}
                <div className="flex items-center border border-gray-200 dark:border-gray-600 rounded">
                  <button
                    onClick={() => setViewMode('edit')}
                    className={`px-2 py-1 text-sm rounded-l ${
                      viewMode === 'edit' && !splitView
                        ? 'bg-blue-500 text-white'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                    title="Edit Mode"
                  >
                    <EyeOff className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('preview')}
                    className={`px-2 py-1 text-sm ${
                      viewMode === 'preview' && !splitView
                        ? 'bg-blue-500 text-white'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                    title="Preview Mode"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={toggleSplitView}
                    className={`px-2 py-1 text-sm rounded-r ${
                      splitView
                        ? 'bg-blue-500 text-white'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                    title="Split View"
                  >
                    <Columns className="w-4 h-4" />
                  </button>
                </div>
                
                <TemplateSelector />
                
                <button
                  onClick={() => handleCreateNote()}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-3 py-1.5 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  <span className="text-sm">New Note</span>
                </button>
                
                <ExportImport />
                
                <ThemeToggle />
              </>
            )}
            
            {/* Focus Mode Toggle */}
            <button
              onClick={toggleFocusMode}
              className={`p-2 rounded ${
                focusMode 
                  ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-400' 
                  : 'hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
              title={`${focusMode ? 'Exit Focus Mode (Esc)' : 'Enter Focus Mode (Cmd+J)'}`}
            >
              {focusMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </header>

        {/* Editor Area */}
        <div className={`flex-1 overflow-hidden ${focusMode ? 'max-w-4xl mx-auto' : ''}`}>
          {showTrash ? (
            <TrashView />
          ) : (
            <NoteEditor 
              note={currentNote || undefined} 
              onSave={handleSaveNote}
            />
          )}
        </div>
      </div>

      {/* Search Modal - Hidden in focus mode */}
      {!focusMode && <SearchModal />}
    </div>
    </DragDropContext>
  );
}
