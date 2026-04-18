import { useEffect, useCallback } from 'react';
import { useUIStore } from '@/store/ui-store';
import { useNotes } from '@/hooks/useNotes';

interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  action: () => void;
  description: string;
}

export function useKeyboardShortcuts(editor: any) {
  const { 
    setSidebarOpen, 
    setSearchOpen,
    viewMode,
    setViewMode,
    toggleViewMode,
    currentNoteId,
    setCurrentNoteId 
  } = useUIStore();
  
  const notes = useNotes();

  const createNote = useCallback(() => {
    // This will be passed from the parent component
    window.dispatchEvent(new CustomEvent('createNote'));
  }, []);

  const navigateToNote = useCallback((direction: 'next' | 'previous') => {
    if (!notes || notes.length === 0) return;
    
    const currentIndex = notes.findIndex(note => note.id === currentNoteId);
    let targetIndex;
    
    if (direction === 'next') {
      targetIndex = currentIndex < notes.length - 1 ? currentIndex + 1 : 0;
    } else {
      targetIndex = currentIndex > 0 ? currentIndex - 1 : notes.length - 1;
    }
    
    const targetNote = notes[targetIndex];
    if (targetNote) {
      setCurrentNoteId(targetNote.id);
    }
  }, [notes, currentNoteId, setCurrentNoteId]);

  const shortcuts: KeyboardShortcut[] = [
    // File operations
    {
      key: 'n',
      ctrlKey: true,
      metaKey: true,
      action: createNote,
      description: 'Create new note'
    },
    {
      key: 's',
      ctrlKey: true,
      metaKey: true,
      action: () => {
        if (editor) {
          window.dispatchEvent(new CustomEvent('saveNote', { detail: editor.getJSON() }));
        }
      },
      description: 'Save note'
    },
    
    // View operations
    {
      key: 'b',
      ctrlKey: true,
      metaKey: true,
      action: () => {
        const currentState = useUIStore.getState().sidebarOpen;
        setSidebarOpen(!currentState);
      },
      description: 'Toggle sidebar'
    },
    {
      key: 'k',
      ctrlKey: true,
      metaKey: true,
      action: () => {
        const currentState = useUIStore.getState().searchOpen;
        setSearchOpen(!currentState);
      },
      description: 'Toggle search'
    },
    {
      key: 'e',
      ctrlKey: true,
      metaKey: true,
      action: toggleViewMode,
      description: 'Toggle edit/preview mode'
    },
    
    // Text formatting
    {
      key: 'b',
      ctrlKey: true,
      metaKey: true,
      action: () => editor?.chain().focus().toggleBold().run(),
      description: 'Bold'
    },
    {
      key: 'i',
      ctrlKey: true,
      metaKey: true,
      action: () => editor?.chain().focus().toggleItalic().run(),
      description: 'Italic'
    },
    {
      key: 'u',
      ctrlKey: true,
      metaKey: true,
      action: () => editor?.chain().focus().toggleUnderline().run(),
      description: 'Underline'
    },
    {
      key: 'd',
      ctrlKey: true,
      metaKey: true,
      action: () => editor?.chain().focus().toggleStrike().run(),
      description: 'Strikethrough'
    },
    {
      key: 'k',
      ctrlKey: true,
      metaKey: true,
      shiftKey: true,
      action: () => {
        const url = window.prompt('Enter URL:');
        if (url && editor) {
          editor.chain().focus().setLink({ href: url }).run();
        }
      },
      description: 'Insert link'
    },
    
    // Heading shortcuts
    {
      key: '1',
      ctrlKey: true,
      metaKey: true,
      action: () => editor?.chain().focus().toggleHeading({ level: 1 }).run(),
      description: 'Heading 1'
    },
    {
      key: '2',
      ctrlKey: true,
      metaKey: true,
      action: () => editor?.chain().focus().toggleHeading({ level: 2 }).run(),
      description: 'Heading 2'
    },
    {
      key: '3',
      ctrlKey: true,
      metaKey: true,
      action: () => editor?.chain().focus().toggleHeading({ level: 3 }).run(),
      description: 'Heading 3'
    },
    {
      key: '0',
      ctrlKey: true,
      metaKey: true,
      action: () => editor?.chain().focus().setParagraph().run(),
      description: 'Paragraph'
    },
    
    // List shortcuts
    {
      key: 'l',
      ctrlKey: true,
      metaKey: true,
      shiftKey: true,
      action: () => editor?.chain().focus().toggleBulletList().run(),
      description: 'Bullet list'
    },
    {
      key: 'o',
      ctrlKey: true,
      metaKey: true,
      shiftKey: true,
      action: () => editor?.chain().focus().toggleOrderedList().run(),
      description: 'Numbered list'
    },
    
    // Other formatting
    {
      key: "'",
      ctrlKey: true,
      metaKey: true,
      action: () => editor?.chain().focus().toggleBlockquote().run(),
      description: 'Block quote'
    },
    {
      key: 'e',
      ctrlKey: true,
      metaKey: true,
      shiftKey: true,
      action: () => editor?.chain().focus().toggleCodeBlock().run(),
      description: 'Code block'
    },
    {
      key: 'h',
      ctrlKey: true,
      metaKey: true,
      shiftKey: true,
      action: () => editor?.chain().focus().toggleHighlight().run(),
      description: 'Highlight'
    },
    
    // Note Navigation
    {
      key: 'ArrowUp',
      ctrlKey: true,
      metaKey: true,
      action: () => navigateToNote('previous'),
      description: 'Previous note'
    },
    {
      key: 'ArrowDown',
      ctrlKey: true,
      metaKey: true,
      action: () => navigateToNote('next'),
      description: 'Next note'
    },
    {
      key: 'j',
      ctrlKey: true,
      metaKey: true,
      action: () => navigateToNote('next'),
      description: 'Next note'
    },
    {
      key: 'k',
      shiftKey: true,
      ctrlKey: true,
      metaKey: true,
      action: () => navigateToNote('previous'),
      description: 'Previous note'
    },
    {
      key: '[',
      ctrlKey: true,
      metaKey: true,
      action: () => navigateToNote('previous'),
      description: 'Previous note'
    },
    {
      key: ']',
      ctrlKey: true,
      metaKey: true,
      action: () => navigateToNote('next'),
      description: 'Next note'
    },
    
    // Browser Navigation
    {
      key: 'ArrowLeft',
      altKey: true,
      action: () => window.history.back(),
      description: 'Go back'
    },
    {
      key: 'ArrowRight',
      altKey: true,
      action: () => window.history.forward(),
      description: 'Go forward'
    },
  ];

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true') {
        // Allow some shortcuts even when editing
        const allowedWhenEditing = ['s', 'b', 'i', 'u', 'd', 'k', '1', '2', '3', '0', 'l', 'o', "'", 'e', 'h', 'j', 'ArrowUp', 'ArrowDown', '[', ']'];
        if (!allowedWhenEditing.includes(event.key.toLowerCase())) {
          return;
        }
      }

      const matchingShortcut = shortcuts.find(shortcut => {
        return (
          shortcut.key === event.key &&
          !!shortcut.ctrlKey === (event.ctrlKey || event.metaKey) &&
          !!shortcut.metaKey === (event.metaKey || event.ctrlKey) &&
          !!shortcut.shiftKey === event.shiftKey &&
          !!shortcut.altKey === event.altKey
        );
      });

      if (matchingShortcut) {
        event.preventDefault();
        event.stopPropagation();
        matchingShortcut.action();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts, editor, navigateToNote]);

  return { shortcuts };
}
