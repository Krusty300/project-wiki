'use client';

import { useState } from 'react';
import { useNotes, createNote } from '@/hooks/useNotes';
import { useUIStore } from '@/store/ui-store';
import { noteTemplates, createNoteFromTemplate, NoteTemplate } from '@/lib/templates';
import { FileText, Calendar, Pen, Target, Lightbulb, CheckSquare, TrendingUp, Book } from 'lucide-react';

interface TemplateSelectorProps {
  className?: string;
}

const iconMap = {
  'note-sticky': FileText,
  'book': Book,
  'target': Target,
  'calendar': Calendar,
  'pen': Pen,
  'lightbulb': Lightbulb,
  'check-square': CheckSquare,
  'trending-up': TrendingUp,
};

export default function TemplateSelector({ className }: TemplateSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'personal' | 'work' | 'creative' | 'productivity'>('all');
  
  const { setCurrentNoteId } = useUIStore();
  const notes = useNotes();

  const filteredTemplates = selectedCategory === 'all' 
    ? noteTemplates 
    : noteTemplates.filter(template => template.category === selectedCategory);

  const handleCreateFromTemplate = async (template: NoteTemplate) => {
    try {
      // Get current folder from UI store
      const { currentFolderId } = useUIStore.getState();
      
      const noteData = createNoteFromTemplate(template, currentFolderId);
      const newNote = await createNote(noteData);
      setCurrentNoteId(newNote.id);
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to create note from template:', error);
    }
  };

  const categories = [
    { id: 'all', name: 'All Templates' },
    { id: 'personal', name: 'Personal' },
    { id: 'work', name: 'Work' },
    { id: 'creative', name: 'Creative' },
    { id: 'productivity', name: 'Productivity' },
  ];

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
      >
        <FileText className="w-4 h-4" />
        <span>Templates</span>
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-1 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10">
          <div className="p-3 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium mb-2">Quick Create</h3>
            
            {/* Category Filter */}
            <div className="flex gap-1 flex-wrap">
              {categories.map(category => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id as any)}
                  className={`px-2 py-1 text-xs rounded ${
                    selectedCategory === category.id
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto p-2">
            <div className="grid grid-cols-1 gap-2">
              {filteredTemplates.map(template => {
                const IconComponent = iconMap[template.icon as keyof typeof iconMap] || FileText;
                
                return (
                  <button
                    key={template.id}
                    onClick={() => handleCreateFromTemplate(template)}
                    className="flex items-start gap-3 p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <div className="flex-shrink-0 w-8 h-8 bg-gray-100 dark:bg-gray-600 rounded flex items-center justify-center">
                      <IconComponent className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-gray-900 dark:text-gray-100">
                        {template.name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                        {template.description}
                      </div>
                      {template.tags && template.tags.length > 0 && (
                        <div className="flex gap-1 mt-1">
                          {template.tags.map(tag => (
                            <span
                              key={tag}
                              className="px-1.5 py-0.5 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-3 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500">
            <p>Templates help you get started quickly with pre-structured content.</p>
          </div>
        </div>
      )}
    </div>
  );
}
