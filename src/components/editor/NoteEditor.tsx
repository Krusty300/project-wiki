'use client';

import React, { memo } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { getExtensions } from '@/lib/tiptap-extensions';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { Note } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import TagManager from '@/components/tags/TagManager';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useUIStore } from '@/store/ui-store';
import MarkdownRenderer from './MarkdownRenderer';
import DocumentOutline from './DocumentOutline';
import Backlinks from './Backlinks';
import SnippetSelector from './SnippetSelector';
import FloatingToolbar from './FloatingToolbar';
import ContextMenu from './ContextMenu';
import DragHandles, { useDragHandles } from './DragHandles';
import ResizeHandles, { useResizeHandles } from './ResizeHandles';
import { useSnippets } from '@/hooks/useSnippets';
import { useDebounce } from '@/lib/utils/debounce';

interface NoteEditorProps {
  note?: Note;
  onSave?: (note: Note) => void;
  placeholder?: string;
}

const NoteEditor = memo(function NoteEditor({ note, onSave, placeholder }: NoteEditorProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  const { saveStatus, setSaveStatus, splitView, viewMode, focusMode } = useUIStore();
  const { getSnippetByShortcut } = useSnippets();
  const [snippetSelector, setSnippetSelector] = useState<{
    show: boolean;
    trigger: string;
    position: { x: number; y: number };
  }>({ show: false, trigger: '', position: { x: 0, y: 0 } });

  // UI/UX Component States
  const [floatingToolbar, setFloatingToolbar] = useState<{
    show: boolean;
    position: { x: number; y: number };
  }>({ show: false, position: { x: 0, y: 0 } });

  const [contextMenu, setContextMenu] = useState<{
    show: boolean;
    position: { x: number; y: number };
    selection: { from: number; to: number } | null;
  }>({ show: false, position: { x: 0, y: 0 }, selection: null });

  const debouncedSave = useDebounce((noteToSave: Note) => {
    if (onSave) {
      onSave(noteToSave);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }
  }, 1000);

  // Content sanitization function - more robust
  const sanitizeContent = useCallback((content: any): any => {
    try {
      if (!content || typeof content !== 'object') {
        return { type: 'doc', content: [{ type: 'paragraph', content: [] }] };
      }

      // Ensure basic doc structure
      if (content.type !== 'doc') {
        return { type: 'doc', content: [{ type: 'paragraph', content: [] }] };
      }

      // Create a deep copy to avoid mutation issues
      const sanitized = JSON.parse(JSON.stringify(content));
      
      // Sanitize content array more permissively
      if (Array.isArray(sanitized.content)) {
        sanitized.content = sanitized.content.filter((node: any) => {
          if (!node || typeof node !== 'object') return false;
          // Ensure each node has a valid type
          if (!node.type || typeof node.type !== 'string') return false;
          // Fix invalid content structures instead of filtering
          if (node.content !== undefined && !Array.isArray(node.content)) {
            node.content = [];
          }
          return true;
        }).map((node: any) => {
          // Recursively sanitize nested content
          if (node.content && Array.isArray(node.content)) {
            node.content = node.content.filter((child: any) => {
              return child && typeof child === 'object' && child.type;
            });
          }
          return node;
        });
      }

      // Ensure at least one paragraph if content is empty
      if (!sanitized.content || sanitized.content.length === 0) {
        sanitized.content = [{ type: 'paragraph', content: [] }];
      }

      return sanitized;
    } catch (error) {
      // Return safe default if sanitization fails
      return { type: 'doc', content: [{ type: 'paragraph', content: [] }] };
    }
  }, []);
  
  const editor = useEditor({
    extensions: getExtensions(),
    editable: true,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      try {
        if (onSave && isInitialized && editor && !editor.isDestroyed) {
          setSaveStatus('saving');
          let content = editor.getJSON();
          
          // Sanitize content before saving
          content = sanitizeContent(content);
          
          const updatedNote: Note = {
            id: note?.id || uuidv4(),
            title: extractTitle(content) || 'Untitled',
            content: content,
            markdown: '', // TODO: Implement markdown export
            folderId: note?.folderId || null,
            tags: note?.tags || [],
            updatedAt: new Date(),
            createdAt: note?.createdAt || new Date(),
            isArchived: note?.isArchived || false,
            isDeleted: note?.isDeleted || false,
          };
          
          debouncedSave(updatedNote);
        }
      } catch (error) {
        // Enhanced error handling for content validation errors
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes('contentMatchAt') || 
            errorMessage.includes('invalid content') ||
            errorMessage.includes('Cannot destructure property \'isEditable\' of \'editor\' as it is null')) {
          // Try to recover by resetting content
          try {
            if (editor && !editor.isDestroyed) {
              const safeContent = sanitizeContent(null);
              editor.commands.setContent(safeContent);
            }
          } catch (recoveryError) {
            console.warn('Failed to recover from content error:', recoveryError);
          }
        } else {
          console.warn('Editor update error:', error);
          setSaveStatus('error');
        }
      }
    },
    onTransaction: ({ transaction }) => {
      try {
        // Remove aggressive validation - let ProseMirror handle most transactions
        // Only catch truly critical errors that would crash the editor
        if (transaction && transaction.doc) {
          const doc = transaction.doc;
          // Just check if doc exists, don't validate structure aggressively
          if (!doc) {
            console.warn('Missing document in transaction');
            return false;
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (!errorMessage.includes('Cannot destructure property \'isEditable\' of \'editor\' as it is null')) {
          console.warn('Editor transaction error:', error);
        }
      }
    },
  });

  const { dragHandles, updateDragHandles } = useDragHandles(editor);
  const { resizeHandles, updateResizeHandles } = useResizeHandles(editor);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (editor && !editor.isDestroyed) {
        editor.destroy();
      }
    };
  }, [editor]);

  // Set initial content and handle note changes
  useEffect(() => {
    if (editor && !isInitialized && !editor.isDestroyed) {
      // Add delay to ensure editor is fully initialized
      const timeoutId = setTimeout(() => {
        if (editor.view) {
          try {
            let initialContent = note?.content || { type: 'doc', content: [{ type: 'paragraph', content: [] }] };
            // Sanitize initial content
            initialContent = sanitizeContent(initialContent);
            editor.commands.setContent(initialContent);
            setIsInitialized(true);
            
            // Auto-focus for new notes
            if (!note?.content || (note.content.content?.[0]?.type === 'paragraph' && 
                (!note.content.content[0].content || note.content.content[0].content.length === 0))) {
              setTimeout(() => {
                if (editor && editor.view && !editor.isDestroyed) {
                  editor.commands.focus('start');
                }
              }, 100);
            }
          } catch (error) {
            // Enhanced error handling for initialization
            const errorMessage = error instanceof Error ? error.message : String(error);
            if (errorMessage.includes('contentMatchAt') || errorMessage.includes('invalid content')) {
              // Try to set safe default content
              try {
                const safeContent = sanitizeContent(null);
                editor.commands.setContent(safeContent);
              } catch (recoveryError) {
                console.warn('Failed to set safe content during initialization:', recoveryError);
              }
            } else if (!errorMessage.includes('Cannot destructure property \'isEditable\' of \'editor\' as it is null')) {
              console.warn('Failed to initialize editor:', error);
            }
            setIsInitialized(true); // Still mark as initialized to avoid infinite loop
          }
        }
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [editor, isInitialized, sanitizeContent]);

  // Handle note switching
  useEffect(() => {
    if (editor && isInitialized && note && editor.view && !editor.isDestroyed) {
      try {
        let content = note.content || { type: 'doc', content: [{ type: 'paragraph', content: [] }] };
        // Sanitize content before setting
        content = sanitizeContent(content);
        editor.commands.setContent(content);
      } catch (error) {
        // Enhanced error handling for note switching
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes('contentMatchAt') || errorMessage.includes('invalid content')) {
          // Try to recover with sanitized content
          try {
            const safeContent = sanitizeContent(note.content);
            editor.commands.setContent(safeContent);
          } catch (recoveryError) {
            console.warn('Failed to recover during note switching:', recoveryError);
            // Set empty content as last resort
            const emptyContent = sanitizeContent(null);
            editor.commands.setContent(emptyContent);
          }
        } else if (!errorMessage.includes('Cannot destructure property \'isEditable\' of \'editor\' as it is null')) {
          console.warn('Failed to switch note content:', error);
        }
      }
    }
  }, [note?.id, isInitialized, sanitizeContent]);

  useKeyboardShortcuts(editor);

  // Handle note navigation from note links
  useEffect(() => {
    const handleNavigateToNote = (event: CustomEvent) => {
      const { noteId } = event.detail;
      // This will be handled by the parent component
      window.dispatchEvent(new CustomEvent('openNote', { detail: { noteId } }));
    };

    window.addEventListener('navigateToNote', handleNavigateToNote as EventListener);
    return () => {
      window.removeEventListener('navigateToNote', handleNavigateToNote as EventListener);
    };
  }, []);

  // Handle snippet insertion
  const handleSnippetSelect = useCallback((snippet: any) => {
    if (editor && snippet.content) {
      editor.chain().focus().insertContent(snippet.content).run();
    }
    setSnippetSelector({ show: false, trigger: '', position: { x: 0, y: 0 } });
  }, [editor]);

  // Handle floating toolbar
  const handleFloatingToolbarAction = useCallback(() => {
    setFloatingToolbar({ show: false, position: { x: 0, y: 0 } });
  }, []);

  // Handle context menu
  const handleContextMenu = (e: MouseEvent) => {
    e.preventDefault();
    if (!editor) return;

    const { from, to } = editor.state.selection;
    setContextMenu({
      show: true,
      position: { x: e.clientX, y: e.clientY },
      selection: { from, to }
    });
  };

  const handleContextMenuAction = useCallback(() => {
    setContextMenu({ show: false, position: { x: 0, y: 0 }, selection: null });
  }, []);

  // Handle text selection for floating toolbar
  const handleTextSelection = () => {
    if (!editor || !editor.view || editor.isDestroyed) return;

    const { from, to } = editor.state.selection;
    const hasSelection = from !== to;

    if (hasSelection) {
      const coords = editor.view.coordsAtPos(to);
      setFloatingToolbar({
        show: true,
        position: { x: coords.right + 10, y: coords.top }
      });
    } else {
      setFloatingToolbar({ show: false, position: { x: 0, y: 0 } });
    }
  };

  // Handle keyboard shortcuts for snippets
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!editor || !editor.isEditable) return;

    const { selection } = editor.state;
    const { $from } = selection;
    const textBefore = $from.nodeBefore?.textContent || '';

    // Check for snippet shortcuts
    if (event.key === ' ' || event.key === 'Enter') {
      const words = textBefore.split(' ');
      const lastWord = words[words.length - 1];
      
      if (lastWord.startsWith('/')) {
        const snippet = getSnippetByShortcut(lastWord);
        if (snippet) {
          event.preventDefault();
          const pos = $from.pos;
          editor.chain()
            .focus()
            .deleteRange({ from: pos - lastWord.length, to: pos })
            .insertContent(snippet.content)
            .run();
          return;
        }
      }
    }

    // Show snippet selector for / commands
    if (event.key === '/' && textBefore.endsWith(' ')) {
      if (editor.view) {
        const coords = editor.view.coordsAtPos($from.pos);
        setSnippetSelector({
          show: true,
          trigger: '/',
          position: { x: coords.left, y: coords.bottom }
        });
      }
    }
  }, [editor, getSnippetByShortcut]);

  useEffect(() => {
    if (editor && editor.view && editor.view.dom && !editor.isDestroyed) {
      const dom = editor.view.dom;
      
      dom.addEventListener('keydown', handleKeyDown);
      dom.addEventListener('contextmenu', handleContextMenu);
      dom.addEventListener('mouseup', handleTextSelection);
      dom.addEventListener('keyup', handleTextSelection);
      
      return () => {
        dom.removeEventListener('keydown', handleKeyDown);
        dom.removeEventListener('contextmenu', handleContextMenu);
        dom.removeEventListener('mouseup', handleTextSelection);
        dom.removeEventListener('keyup', handleTextSelection);
      };
    }
  }, [editor, handleKeyDown]);

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

  // Document structure validation - more permissive
  const validateDocumentStructure = useCallback((doc: any): boolean => {
    try {
      if (!doc || typeof doc !== 'object') return false;
      if (doc.type !== 'doc') return false;
      if (!Array.isArray(doc.content)) return false;
      
      // Less strict validation - allow most content through
      // Only check for critical structural issues
      for (const node of doc.content) {
        if (!node || typeof node !== 'object') continue; // Skip invalid nodes instead of failing
        if (!node.type || typeof node.type !== 'string') continue; // Skip nodes without type
        
        // Don't validate content arrays strictly - they can be complex
        if (node.content !== undefined && !Array.isArray(node.content)) {
          // Fix invalid content structure instead of failing
          node.content = [];
        }
      }
      
      return true;
    } catch (error) {
      return true; // Allow the transaction if validation fails
    }
  }, []);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Header with save status - Minimal in focus mode */}
      {!focusMode && (
        <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              saveStatus === 'saving' ? 'bg-yellow-500 animate-pulse' :
              saveStatus === 'saved' ? 'bg-green-500' :
              saveStatus === 'error' ? 'bg-red-500' :
              'bg-gray-300'
            }`} />
            <span className="text-xs text-gray-500">
              {saveStatus === 'saving' ? 'Saving...' :
               saveStatus === 'saved' ? 'Saved' :
               saveStatus === 'error' ? 'Error' :
               'Ready'}
            </span>
          </div>
          <div className="text-xs text-gray-400">
            {Object.entries({
              '⌘B': 'Bold', '⌘I': 'Italic', '⌘K': 'Search', 
              '⌘E': 'Toggle View', '⌘N': 'New Note'
            }).map(([key, desc]) => (
              <span key={key} className="mr-3">{key}: {desc}</span>
            ))}
          </div>
        </div>
      )}
      
      {/* Tags - Hidden in focus mode */}
      {!focusMode && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <TagManager
            noteTags={note?.tags || []}
            onTagsChange={(tags) => {
              if (note && onSave) {
                onSave({ ...note, tags });
              }
            }}
          />
        </div>
      )}
      
      {/* Editor Content */}
      <div className="flex-1 flex">
        {splitView ? (
          <>
            {/* Edit Panel */}
            <div className="flex-1 border-r border-gray-200 dark:border-gray-700 flex">
              <div className="flex-1">
                {editor ? (
                  <EditorContent 
                    editor={editor} 
                    className={`min-h-[400px] focus:outline-none ${focusMode ? 'p-8' : 'p-6'}`}
                  />
                ) : (
                  <div className="min-h-[400px] p-6 flex items-center justify-center text-gray-500">
                    Loading editor...
                  </div>
                )}
              </div>
              
              {/* Document Outline in Edit Panel */}
              <div className="w-64 border-l border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                <DocumentOutline content={note?.content} />
              </div>
            </div>
            
            {/* Preview Panel */}
            <div className="flex-1 flex">
              <div className="flex-1 overflow-y-auto">
                <div className="sticky top-0 bg-gray-50 dark:bg-gray-800 px-6 py-2 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Preview</span>
                </div>
                <MarkdownRenderer content={note?.content} />
              </div>
              
              {/* Document Outline in Preview Panel */}
              <div className="w-64 border-l border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                <DocumentOutline content={note?.content} />
              </div>
            </div>
          </>
        ) : viewMode === 'preview' ? (
          /* Preview Only */
          <div className="flex-1 flex">
            <div className="flex-1 overflow-y-auto">
              <MarkdownRenderer content={note?.content} />
            </div>
            {/* Document Outline in Preview Only */}
            <div className="w-64 border-l border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              <DocumentOutline content={note?.content} />
            </div>
          </div>
        ) : (
          /* Edit Only */
          <div className={`flex-1 prose prose-lg dark:prose-invert max-w-none focus:outline-none ${focusMode ? 'text-xl leading-relaxed' : ''}`}>
            {editor ? (
              <EditorContent 
                editor={editor} 
                className={`min-h-[400px] focus:outline-none ${focusMode ? 'p-8' : 'p-6'}`}
              />
            ) : (
              <div className="min-h-[400px] p-6 flex items-center justify-center text-gray-500">
                Loading editor...
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Backlinks - Hidden in focus mode */}
      {!focusMode && (
        <Backlinks currentNoteId={note?.id} />
      )}
      
      {/* Snippet Selector */}
      {snippetSelector.show && (
        <SnippetSelector
          onSelect={handleSnippetSelect}
          trigger={snippetSelector.trigger}
          position={snippetSelector.position}
          onClose={() => setSnippetSelector({ show: false, trigger: '', position: { x: 0, y: 0 } })}
        />
      )}
      
      {/* Floating Toolbar */}
      {floatingToolbar.show && (
        <FloatingToolbar
          editor={editor}
          position={floatingToolbar.position}
          onClose={handleFloatingToolbarAction}
        />
      )}
      
      {/* Context Menu */}
      {contextMenu.show && (
        <ContextMenu
          editor={editor}
          position={contextMenu.position}
          selection={contextMenu.selection}
          onClose={handleContextMenuAction}
        />
      )}
    </div>
  );
});

export default NoteEditor;
