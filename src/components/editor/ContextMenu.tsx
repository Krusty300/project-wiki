'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Copy, 
  Scissors, 
  Clipboard, 
  Trash2, 
  Link, 
  Image, 
  Table,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Quote,
  AlignLeft,
  AlignCenter,
  AlignRight
} from 'lucide-react';

interface ContextMenuProps {
  position: { x: number; y: number };
  onClose: () => void;
  editor: any;
  selection: { from: number; to: number } | null;
}

interface ContextMenuItem {
  icon: React.ComponentType<any>;
  label: string;
  action: () => void;
  separator?: boolean;
  disabled?: boolean;
  shortcut?: string;
}

export default function ContextMenu({ position, onClose, editor, selection }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  const hasSelection = selection && selection.from !== selection.to;
  const isLinkActive = editor?.isActive('link');
  const isImageActive = editor?.isActive('image');
  const isTableActive = editor?.isActive('table');

  const formatItems: ContextMenuItem[] = [
    {
      icon: Bold,
      label: 'Bold',
      action: () => editor.chain().focus().toggleBold().run(),
      shortcut: 'Ctrl+B',
      disabled: !hasSelection
    },
    {
      icon: Italic,
      label: 'Italic',
      action: () => editor.chain().focus().toggleItalic().run(),
      shortcut: 'Ctrl+I',
      disabled: !hasSelection
    },
    {
      icon: Underline,
      label: 'Underline',
      action: () => editor.chain().focus().toggleUnderline().run(),
      shortcut: 'Ctrl+U',
      disabled: !hasSelection
    },
    {
      icon: Strikethrough,
      label: 'Strikethrough',
      action: () => editor.chain().focus().toggleStrike().run(),
      shortcut: 'Ctrl+D',
      disabled: !hasSelection
    },
    {
      icon: Code,
      label: 'Code',
      action: () => editor.chain().focus().toggleCode().run(),
      shortcut: 'Ctrl+`',
      disabled: !hasSelection
    },
  ];

  const headingItems: ContextMenuItem[] = [
    {
      icon: Heading1,
      label: 'Heading 1',
      action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
      shortcut: 'Ctrl+Alt+1'
    },
    {
      icon: Heading2,
      label: 'Heading 2',
      action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
      shortcut: 'Ctrl+Alt+2'
    },
  ];

  const listItems: ContextMenuItem[] = [
    {
      icon: List,
      label: 'Bullet List',
      action: () => editor.chain().focus().toggleBulletList().run(),
      shortcut: 'Ctrl+Shift+L'
    },
    {
      icon: ListOrdered,
      label: 'Numbered List',
      action: () => editor.chain().focus().toggleOrderedList().run(),
      shortcut: 'Ctrl+Shift+O'
    },
    {
      icon: Quote,
      label: 'Blockquote',
      action: () => editor.chain().focus().toggleBlockquote().run(),
      shortcut: "Ctrl+'"
    },
  ];

  const alignItems: ContextMenuItem[] = [
    {
      icon: AlignLeft,
      label: 'Align Left',
      action: () => editor.chain().focus().setTextAlign('left').run()
    },
    {
      icon: AlignCenter,
      label: 'Align Center',
      action: () => editor.chain().focus().setTextAlign('center').run()
    },
    {
      icon: AlignRight,
      label: 'Align Right',
      action: () => editor.chain().focus().setTextAlign('right').run()
    },
  ];

  const insertItems: ContextMenuItem[] = [
    {
      icon: Link,
      label: 'Add Link',
      action: () => {
        const url = window.prompt('Enter URL:');
        if (url) {
          if (hasSelection) {
            editor.chain().focus().setLink({ href: url }).run();
          } else {
            editor.chain().focus().insertContent(`<a href="${url}">Link</a>`).run();
          }
        }
      }
    },
    {
      icon: Image,
      label: 'Insert Image',
      action: () => {
        const url = window.prompt('Enter image URL:');
        if (url) {
          editor.chain().focus().setImage({ src: url }).run();
        }
      }
    },
    {
      icon: Table,
      label: 'Insert Table',
      action: () => {
        editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
      }
    },
  ];

  const editItems: ContextMenuItem[] = [
    {
      icon: Copy,
      label: 'Copy',
      action: () => {
        if (hasSelection) {
          document.execCommand('copy');
        } else {
          navigator.clipboard.writeText(editor.state.doc.textBetween(selection?.from || 0, selection?.to || 0));
        }
      },
      shortcut: 'Ctrl+C'
    },
    {
      icon: Scissors,
      label: 'Cut',
      action: () => {
        if (hasSelection) {
          document.execCommand('cut');
        }
      },
      shortcut: 'Ctrl+X',
      disabled: !hasSelection
    },
    {
      icon: Clipboard,
      label: 'Paste',
      action: () => {
        document.execCommand('paste');
      },
      shortcut: 'Ctrl+V'
    },
    {
      icon: Trash2,
      label: 'Delete',
      action: () => {
        if (hasSelection) {
          editor.chain().focus().deleteSelection().run();
        }
      },
      shortcut: 'Del',
      disabled: !hasSelection
    },
  ];

  const allItems = [
    ...formatItems,
    { separator: true } as ContextMenuItem,
    ...headingItems,
    { separator: true } as ContextMenuItem,
    ...listItems,
    { separator: true } as ContextMenuItem,
    ...alignItems,
    { separator: true } as ContextMenuItem,
    ...insertItems,
    { separator: true } as ContextMenuItem,
    ...editItems,
  ];

  const handleItemClick = (item: ContextMenuItem) => {
    if (!item.disabled && !item.separator) {
      item.action();
      onClose();
    }
  };

  const renderMenuItem = (item: ContextMenuItem, index: number) => {
    if (item.separator) {
      return (
        <div key={`separator-${index}`} className="border-t border-gray-200 dark:border-gray-700 my-1" />
      );
    }

    const IconComponent = item.icon;
    return (
      <button
        key={item.label}
        onClick={() => handleItemClick(item)}
        disabled={item.disabled}
        className={`w-full text-left px-3 py-2 flex items-center gap-3 text-sm transition-colors ${
          item.disabled 
            ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed' 
            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
        }`}
      >
        <IconComponent className="w-4 h-4 flex-shrink-0" />
        <span className="flex-1">{item.label}</span>
        {item.shortcut && (
          <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
            {item.shortcut}
          </span>
        )}
      </button>
    );
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  // Adjust position if menu goes off-screen
  const adjustPosition = () => {
    if (!menuRef.current) return position;
    
    const rect = menuRef.current.getBoundingClientRect();
    let adjustedX = position.x;
    let adjustedY = position.y;
    
    // Check if menu goes beyond right edge
    if (position.x + rect.width > window.innerWidth) {
      adjustedX = window.innerWidth - rect.width - 10;
    }
    
    // Check if menu goes beyond bottom edge
    if (position.y + rect.height > window.innerHeight) {
      adjustedY = window.innerHeight - rect.height - 10;
    }
    
    return { x: adjustedX, y: adjustedY };
  };

  const adjustedPosition = adjustPosition();

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 min-w-[200px]"
      style={{
        left: `${adjustedPosition.x}px`,
        top: `${adjustedPosition.y}px`,
      }}
    >
      {allItems.map((item, index) => renderMenuItem(item, index))}
    </div>
  );
}
