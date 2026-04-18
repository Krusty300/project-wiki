'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  AlignRight,
  Calendar,
  Clock,
  FileText,
  Hash,
  CheckSquare,
  Plus,
  Minus,
  Search,
  User,
  Paperclip,
  Video,
  Music,
  Archive,
  Trash2
} from 'lucide-react';

interface SlashCommand {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  keywords: string[];
  action: (editor: any, query?: string) => void;
  category: 'formatting' | 'insert' | 'media' | 'advanced';
}

interface SlashCommandsProps {
  editor: any;
  position: { x: number; y: number };
  onClose: () => void;
}

const slashCommands: SlashCommand[] = [
  // Formatting Commands
  {
    id: 'bold',
    name: 'Bold',
    description: 'Make text bold',
    icon: Bold,
    keywords: ['bold', 'b', 'strong'],
    category: 'formatting',
    action: (editor) => editor.chain().focus().toggleBold().run()
  },
  {
    id: 'italic',
    name: 'Italic',
    description: 'Make text italic',
    icon: Italic,
    keywords: ['italic', 'i', 'em'],
    category: 'formatting',
    action: (editor) => editor.chain().focus().toggleItalic().run()
  },
  {
    id: 'underline',
    name: 'Underline',
    description: 'Underline text',
    icon: Underline,
    keywords: ['underline', 'u'],
    category: 'formatting',
    action: (editor) => editor.chain().focus().toggleUnderline().run()
  },
  {
    id: 'strikethrough',
    name: 'Strikethrough',
    description: 'Strike through text',
    icon: Strikethrough,
    keywords: ['strikethrough', 'strike', 's'],
    category: 'formatting',
    action: (editor) => editor.chain().focus().toggleStrike().run()
  },
  {
    id: 'code',
    name: 'Code',
    description: 'Format as code',
    icon: Code,
    keywords: ['code', 'inline code', '`'],
    category: 'formatting',
    action: (editor) => editor.chain().focus().toggleCode().run()
  },
  {
    id: 'highlight',
    name: 'Highlight',
    description: 'Highlight text',
    icon: Highlighter,
    keywords: ['highlight', 'mark', 'yellow'],
    category: 'formatting',
    action: (editor) => editor.chain().focus().toggleHighlight().run()
  },
  
  // Heading Commands
  {
    id: 'h1',
    name: 'Heading 1',
    description: 'Large heading',
    icon: Heading1,
    keywords: ['h1', 'heading 1', 'title'],
    category: 'formatting',
    action: (editor) => editor.chain().focus().toggleHeading({ level: 1 }).run()
  },
  {
    id: 'h2',
    name: 'Heading 2',
    description: 'Medium heading',
    icon: Heading2,
    keywords: ['h2', 'heading 2', 'subtitle'],
    category: 'formatting',
    action: (editor) => editor.chain().focus().toggleHeading({ level: 2 }).run()
  },
  {
    id: 'h3',
    name: 'Heading 3',
    description: 'Small heading',
    icon: Heading3,
    keywords: ['h3', 'heading 3'],
    category: 'formatting',
    action: (editor) => editor.chain().focus().toggleHeading({ level: 3 }).run()
  },
  
  // List Commands
  {
    id: 'bullet-list',
    name: 'Bullet List',
    description: 'Create bullet list',
    icon: List,
    keywords: ['bullet', 'list', 'ul'],
    category: 'formatting',
    action: (editor) => editor.chain().focus().toggleBulletList().run()
  },
  {
    id: 'numbered-list',
    name: 'Numbered List',
    description: 'Create numbered list',
    icon: ListOrdered,
    keywords: ['numbered', 'ordered', 'ol'],
    category: 'formatting',
    action: (editor) => editor.chain().focus().toggleOrderedList().run()
  },
  {
    id: 'quote',
    name: 'Blockquote',
    description: 'Create blockquote',
    icon: Quote,
    keywords: ['quote', 'blockquote', 'indent'],
    category: 'formatting',
    action: (editor) => editor.chain().focus().toggleBlockquote().run()
  },
  
  // Insert Commands
  {
    id: 'link',
    name: 'Link',
    description: 'Insert link',
    icon: Link,
    keywords: ['link', 'url', 'hyperlink'],
    category: 'insert',
    action: (editor) => {
      const url = window.prompt('Enter URL:');
      if (url) {
        editor.chain().focus().setLink({ href: url }).run();
      }
    }
  },
  {
    id: 'image',
    name: 'Image',
    description: 'Insert image',
    icon: Image,
    keywords: ['image', 'img', 'picture', 'photo'],
    category: 'insert',
    action: (editor) => {
      const url = window.prompt('Enter image URL:');
      if (url) {
        editor.chain().focus().setImage({ src: url }).run();
      }
    }
  },
  {
    id: 'table',
    name: 'Table',
    description: 'Insert table',
    icon: Table,
    keywords: ['table', 'grid', 'spreadsheet'],
    category: 'insert',
    action: (editor) => {
      const rows = parseInt(window.prompt('Number of rows:', '3') || '3');
      const cols = parseInt(window.prompt('Number of columns:', '3') || '3');
      editor.chain().focus().insertTable({ rows, cols, withHeaderRow: true }).run();
    }
  },
  {
    id: 'divider',
    name: 'Divider',
    description: 'Insert divider',
    icon: Minus,
    keywords: ['divider', 'separator', 'hr', 'line'],
    category: 'insert',
    action: (editor) => editor.chain().focus().insertContent('<hr>').run()
  },
  
  // Media Commands
  {
    id: 'date',
    name: 'Date',
    description: 'Insert current date',
    icon: Calendar,
    keywords: ['date', 'time', 'today', 'now'],
    category: 'insert',
    action: (editor) => {
      const date = new Date().toLocaleDateString();
      editor.chain().focus().insertContent(date).run();
    }
  },
  {
    id: 'time',
    name: 'Time',
    description: 'Insert current time',
    icon: Clock,
    keywords: ['time', 'clock', 'hour'],
    category: 'insert',
    action: (editor) => {
      const time = new Date().toLocaleTimeString();
      editor.chain().focus().insertContent(time).run();
    }
  },
  
  // Advanced Commands
  {
    id: 'todo',
    name: 'Todo List',
    description: 'Insert todo checklist',
    icon: CheckSquare,
    keywords: ['todo', 'checklist', 'tasks', 'checkbox'],
    category: 'advanced',
    action: (editor) => {
      const todoContent = `<ul data-type="taskList">
  <li data-checked="false"><input type="checkbox"> Task 1</li>
  <li data-checked="false"><input type="checkbox"> Task 2</li>
  <li data-checked="false"><input type="checkbox"> Task 3</li>
</ul>`;
      editor.chain().focus().insertContent(todoContent).run();
    }
  },
  {
    id: 'callout',
    name: 'Callout',
    description: 'Insert callout box',
    icon: FileText,
    keywords: ['callout', 'note', 'info', 'warning', 'tip'],
    category: 'advanced',
    action: (editor, query) => {
      let calloutType = 'info';
      let calloutContent = 'Information';
      
      if (query) {
        const q = query.toLowerCase();
        if (q.includes('warn') || q.includes('warning')) {
          calloutType = 'warning';
          calloutContent = 'Warning';
        } else if (q.includes('tip') || q.includes('help')) {
          calloutType = 'tip';
          calloutContent = 'Tip';
        } else if (q.includes('error') || q.includes('danger')) {
          calloutType = 'error';
          calloutContent = 'Error';
        }
      }
      
      const calloutHtml = `<div class="callout callout-${calloutType}">
  <div class="callout-icon">📝</div>
  <div class="callout-content">
    <strong>${calloutContent}:</strong> Your message here
  </div>
</div>`;
      editor.chain().focus().insertContent(calloutHtml).run();
    }
  },
  {
    id: 'code-block',
    name: 'Code Block',
    description: 'Insert code block',
    icon: FileText,
    keywords: ['code block', 'pre', 'codeblock'],
    category: 'advanced',
    action: (editor) => {
      const language = window.prompt('Enter language (optional):') || '';
      const code = window.prompt('Enter code:') || '';
      editor.chain().focus().insertContent(`\`\`\`${language}\n${code}\n\`\``).run();
    }
  },
];

export default function SlashCommands({ editor, position, onClose }: SlashCommandsProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredCommands = slashCommands.filter(command => {
    const q = searchQuery.toLowerCase();
    return command.keywords.some(keyword => keyword.includes(q)) ||
           command.name.toLowerCase().includes(q) ||
           command.description.toLowerCase().includes(q);
  });

  const handleCommandSelect = (command: SlashCommand) => {
    if (command.action) {
      command.action(editor, searchQuery);
    }
    onClose();
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setSelectedIndex(prev => (prev + 1) % filteredCommands.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (filteredCommands[selectedIndex]) {
        handleCommandSelect(filteredCommands[selectedIndex]);
      }
    } else if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
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

  // Group commands by category
  const groupedCommands = filteredCommands.reduce((groups, command) => {
    if (!groups[command.category]) {
      groups[command.category] = [];
    }
    groups[command.category].push(command);
    return groups;
  }, {} as Record<string, SlashCommand[]>);

  const adjustPosition = () => {
    if (!containerRef.current) return position;
    
    const rect = containerRef.current.getBoundingClientRect();
    const adjustedX = Math.max(10, Math.min(position.x, window.innerWidth - rect.width - 10));
    const adjustedY = Math.max(10, Math.min(position.y, window.innerHeight - rect.height - 10));
    
    return { x: adjustedX, y: adjustedY };
  };

  const adjustedPosition = adjustPosition();

  return (
    <div
      ref={containerRef}
      className="fixed z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-w-md max-h-96 overflow-hidden"
      style={{
        left: `${adjustedPosition.x}px`,
        top: `${adjustedPosition.y}px`,
      }}
    >
      {/* Search Bar */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-700">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Type a command or search..."
            className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
        </div>
      </div>

      {/* Commands */}
      <div className="max-h-64 overflow-y-auto p-2">
        {Object.entries(groupedCommands).map(([category, commands]) => (
          <div key={category} className="mb-4">
            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
              {category}
            </div>
            <div className="space-y-1">
              {commands.map((command, index) => {
                const IconComponent = command.icon;
                const isSelected = index === selectedIndex;
                
                return (
                  <button
                    key={command.id}
                    onClick={() => handleCommandSelect(command)}
                    className={`w-full text-left px-3 py-2 flex items-center gap-3 rounded transition-colors ${
                      isSelected 
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
                        : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <IconComponent className="w-4 h-4 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">{command.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{command.description}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Keyboard Shortcuts Hint */}
      <div className="px-3 py-2 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
        <div className="flex items-center justify-between">
          <span>↑↓ Navigate • Enter to select • Esc to close</span>
          <span>Type to filter commands</span>
        </div>
      </div>
    </div>
  );
}
