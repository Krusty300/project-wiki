'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSnippets, TextSnippet } from '@/hooks/useSnippets';
import { Code, MessageSquare, Target, Zap } from 'lucide-react';

interface SnippetSelectorProps {
  onSelect: (snippet: TextSnippet) => void;
  trigger: string;
  position: { x: number; y: number };
  onClose: () => void;
}

const categoryIcons = {
  text: Code,
  formatting: MessageSquare,
  productivity: Target,
  communication: Zap,
};

export default function SnippetSelector({ onSelect, trigger, position, onClose }: SnippetSelectorProps) {
  const { snippets } = useSnippets();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredSnippets, setFilteredSnippets] = useState<TextSnippet[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let filtered = snippets;
    
    if (searchQuery) {
      const lowercaseQuery = searchQuery.toLowerCase();
      filtered = snippets.filter(snippet => 
        snippet.name.toLowerCase().includes(lowercaseQuery) ||
        snippet.description.toLowerCase().includes(lowercaseQuery) ||
        snippet.shortcut.toLowerCase().includes(lowercaseQuery)
      );
    } else if (trigger) {
      filtered = snippets.filter(snippet => 
        snippet.shortcut.includes(trigger) || 
        snippet.name.toLowerCase().includes(trigger.toLowerCase())
      );
    }
    
    setFilteredSnippets(filtered);
    setSelectedIndex(0);
  }, [searchQuery, trigger, snippets]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      } else if (event.key === 'ArrowDown') {
        event.preventDefault();
        setSelectedIndex(prev => (prev + 1) % filteredSnippets.length);
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredSnippets.length) % filteredSnippets.length);
      } else if (event.key === 'Enter' && filteredSnippets[selectedIndex]) {
        event.preventDefault();
        onSelect(filteredSnippets[selectedIndex]);
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, filteredSnippets, selectedIndex, onSelect]);

  const handleSnippetClick = (snippet: TextSnippet) => {
    onSelect(snippet);
    onClose();
  };

  if (filteredSnippets.length === 0) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className="fixed z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-80 overflow-y-auto"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        minWidth: '300px',
      }}
    >
      <div className="p-2 border-b border-gray-200 dark:border-gray-700">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search snippets..."
          className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          autoFocus
        />
      </div>
      
      <div className="py-1">
        {filteredSnippets.map((snippet, index) => {
          const IconComponent = categoryIcons[snippet.category];
          const isSelected = index === selectedIndex;
          
          return (
            <button
              key={snippet.id}
              onClick={() => handleSnippetClick(snippet)}
              className={`w-full text-left px-3 py-2 flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                isSelected ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : ''
              }`}
            >
              <div className="flex-shrink-0">
                <IconComponent className="w-4 h-4 text-gray-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {snippet.name}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">
                    {snippet.shortcut}
                  </span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                  {snippet.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
      
      <div className="px-3 py-2 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
        <div className="flex items-center justify-between">
          <span>↑↓ Navigate • Enter to select</span>
          <span>Esc to close</span>
        </div>
      </div>
    </div>
  );
}
