'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { 
  Bold, 
  Italic, 
  Underline, 
  Strikethrough, 
  Code, 
  Heading1, 
  Heading2, 
  Heading3,
  List,
  ListOrdered,
  Quote,
  Link,
  Image,
  Table,
  Highlighter,
  AlignLeft,
  AlignCenter,
  AlignRight
} from 'lucide-react';

interface FloatingToolbarProps {
  editor: any;
  position: { x: number; y: number };
  onClose: () => void;
}

interface ToolbarButton {
  icon: React.ComponentType<any>;
  label: string;
  action: () => void;
  isActive?: boolean;
  isDisabled?: boolean;
}

export default function FloatingToolbar({ editor, position, onClose }: FloatingToolbarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const toolbarRef = useRef<HTMLDivElement>(null);

  const isButtonActive = (name: string) => {
    if (!editor) return false;
    return editor.isActive(name);
  };

  const createButton = (icon: React.ComponentType<any>, label: string, action: () => void, isActive = false, isDisabled = false): ToolbarButton => ({
    icon,
    label,
    action,
    isActive,
    isDisabled
  });

  const basicButtons: ToolbarButton[] = [
    createButton(Bold, 'Bold', () => editor.chain().focus().toggleBold().run(), isButtonActive('bold')),
    createButton(Italic, 'Italic', () => editor.chain().focus().toggleItalic().run(), isButtonActive('italic')),
    createButton(Underline, 'Underline', () => editor.chain().focus().toggleUnderline().run(), isButtonActive('underline')),
    createButton(Strikethrough, 'Strikethrough', () => editor.chain().focus().toggleStrike().run(), isButtonActive('strike')),
    createButton(Code, 'Code', () => editor.chain().focus().toggleCode().run(), isButtonActive('code')),
  ];

  const headingButtons: ToolbarButton[] = [
    createButton(Heading1, 'Heading 1', () => editor.chain().focus().toggleHeading({ level: 1 }).run(), editor.isActive('heading', { level: 1 })),
    createButton(Heading2, 'Heading 2', () => editor.chain().focus().toggleHeading({ level: 2 }).run(), editor.isActive('heading', { level: 2 })),
    createButton(Heading3, 'Heading 3', () => editor.chain().focus().toggleHeading({ level: 3 }).run(), editor.isActive('heading', { level: 3 })),
  ];

  const listButtons: ToolbarButton[] = [
    createButton(List, 'Bullet List', () => editor.chain().focus().toggleBulletList().run(), isButtonActive('bulletList')),
    createButton(ListOrdered, 'Numbered List', () => editor.chain().focus().toggleOrderedList().run(), isButtonActive('orderedList')),
    createButton(Quote, 'Blockquote', () => editor.chain().focus().toggleBlockquote().run(), isButtonActive('blockquote')),
  ];

  const insertButtons: ToolbarButton[] = [
    createButton(Link, 'Link', () => {
      const url = window.prompt('Enter URL:');
      if (url) {
        editor.chain().focus().setLink({ href: url }).run();
      }
    }, isButtonActive('link')),
    createButton(Image, 'Image', () => {
      const url = window.prompt('Enter image URL:');
      if (url) {
        editor.chain().focus().setImage({ src: url }).run();
      }
    }),
    createButton(Table, 'Table', () => {
      editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
    }),
    createButton(Highlighter, 'Highlight', () => editor.chain().focus().toggleHighlight().run(), editor.isActive('highlight')),
  ];

  const alignButtons: ToolbarButton[] = [
    createButton(AlignLeft, 'Align Left', () => editor.chain().focus().setTextAlign('left').run(), editor.isActive('textAlign', { align: 'left' })),
    createButton(AlignCenter, 'Align Center', () => editor.chain().focus().setTextAlign('center').run(), editor.isActive('textAlign', { align: 'center' })),
    createButton(AlignRight, 'Align Right', () => editor.chain().focus().setTextAlign('right').run(), editor.isActive('textAlign', { align: 'right' })),
  ];

  const allButtons = [...basicButtons, ...headingButtons, ...listButtons, ...insertButtons, ...alignButtons];

  const filteredButtons = searchQuery 
    ? allButtons.filter(button => 
        button.label.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : allButtons;

  const renderButton = (button: ToolbarButton) => {
    const IconComponent = button.icon;
    return (
      <button
        key={button.label}
        onClick={button.action}
        disabled={button.isDisabled}
        className={`p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
          button.isActive ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'
        } ${button.isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        title={button.label}
      >
        <IconComponent className="w-4 h-4" />
      </button>
    );
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (toolbarRef.current && !toolbarRef.current.contains(event.target as Node)) {
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

  // Adjust position if toolbar goes off-screen
  const adjustPosition = () => {
    if (!toolbarRef.current) return position;
    
    const rect = toolbarRef.current.getBoundingClientRect();
    const adjustedX = position.x;
    const adjustedY = position.y;
    
    // Check if toolbar goes beyond right edge
    if (position.x + rect.width > window.innerWidth) {
      return { x: window.innerWidth - rect.width - 10, y: adjustedY };
    }
    
    // Check if toolbar goes beyond bottom edge
    if (position.y + rect.height > window.innerHeight) {
      return { x: adjustedX, y: window.innerHeight - rect.height - 10 };
    }
    
    return { x: adjustedX, y: adjustedY };
  };

  const adjustedPosition = adjustPosition();

  return (
    <div
      ref={toolbarRef}
      className="fixed z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-2"
      style={{
        left: `${adjustedPosition.x}px`,
        top: `${adjustedPosition.y}px`,
      }}
    >
      {/* Search Bar */}
      <div className="mb-2">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search formatting options..."
          className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          autoFocus
        />
      </div>

      {/* Toolbar Sections */}
      <div className="space-y-2">
        {filteredButtons.length === 0 ? (
          <div className="text-sm text-gray-500 dark:text-gray-400 px-2 py-1">
            No formatting options found
          </div>
        ) : (
          <>
            {searchQuery ? (
              <div className="grid grid-cols-4 gap-1">
                {filteredButtons.map(renderButton)}
              </div>
            ) : (
              <>
                {/* Basic Formatting */}
                <div className="flex items-center gap-1 pb-2 border-b border-gray-200 dark:border-gray-700">
                  {basicButtons.map(renderButton)}
                </div>

                {/* Headings */}
                <div className="flex items-center gap-1 pb-2 border-b border-gray-200 dark:border-gray-700">
                  {headingButtons.map(renderButton)}
                </div>

                {/* Lists */}
                <div className="flex items-center gap-1 pb-2 border-b border-gray-200 dark:border-gray-700">
                  {listButtons.map(renderButton)}
                </div>

                {/* Insert */}
                <div className="flex items-center gap-1 pb-2 border-b border-gray-200 dark:border-gray-700">
                  {insertButtons.map(renderButton)}
                </div>

                {/* Alignment */}
                <div className="flex items-center gap-1">
                  {alignButtons.map(renderButton)}
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* Keyboard Shortcuts Hint */}
      {!searchQuery && (
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
          <div>Click to format • Esc to close</div>
        </div>
      )}
    </div>
  );
}
