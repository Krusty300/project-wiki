'use client';

import { useState, useEffect, useRef } from 'react';
import { useNotes, useTags, useFolders } from '@/hooks/useNotes';
import { useUIStore } from '@/store/ui-store';
import { Search, FileText, Filter, X, Calendar, Tag, Folder } from 'lucide-react';
import Fuse from 'fuse.js';

interface SearchFilters {
  tags: string[];
  folderId: string | null;
  dateRange: 'all' | 'today' | 'week' | 'month';
  contentOnly: boolean;
  titleOnly: boolean;
}

interface SearchResultWithContent {
  id: string;
  title: string;
  content: any;
  markdown?: string;
  folderId: string | null;
  tags: string[];
  updatedAt: Date;
  createdAt: Date;
  isArchived: boolean;
  plainContent: string;
  score: number;
}

export default function SearchModal() {
  const { searchOpen, setSearchOpen, searchQuery, setSearchQuery } = useUIStore();
  const [localQuery, setLocalQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    tags: [],
    folderId: null,
    dateRange: 'all',
    contentOnly: false,
    titleOnly: false,
  });
  const inputRef = useRef<HTMLInputElement>(null);
  
  const notes = useNotes();
  const tags = useTags();
  const folders = useFolders();
  
  // Parse search query for advanced operators
  const parseSearchQuery = (query: string) => {
    const operators: { [key: string]: string } = {};
    let cleanQuery = query;
    
    // Extract operators like tag:work, folder:projects, etc.
    const operatorMatches = query.match(/(\w+):([^\s]+)/g);
    if (operatorMatches) {
      operatorMatches.forEach(match => {
        const [key, value] = match.split(':');
        operators[key] = value;
        cleanQuery = cleanQuery.replace(match, '').trim();
      });
    }
    
    return { cleanQuery, operators };
  };

  const { cleanQuery, operators } = parseSearchQuery(localQuery);
  
  // Apply filters to notes
  const filteredNotes = (notes || []).filter(note => {
    // Tag filter
    if (filters.tags.length > 0) {
      const hasTag = filters.tags.some(tagId => note.tags.includes(tagId));
      if (!hasTag) return false;
    }
    
    // Folder filter
    if (filters.folderId && note.folderId !== filters.folderId) {
      return false;
    }
    
    // Date range filter
    if (filters.dateRange !== 'all') {
      const noteDate = new Date(note.updatedAt);
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      if (filters.dateRange === 'today') {
        if (noteDate < today) return false;
      } else if (filters.dateRange === 'week') {
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        if (noteDate < weekAgo) return false;
      } else if (filters.dateRange === 'month') {
        const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        if (noteDate < monthAgo) return false;
      }
    }
    
    // Operator filters
    if (operators.tag) {
      const tag = tags.find(t => t.name.toLowerCase() === operators.tag.toLowerCase());
      if (!tag || !note.tags.includes(tag.id)) return false;
    }
    
    if (operators.folder) {
      const folder = folders.find(f => f.name.toLowerCase() === operators.folder.toLowerCase());
      if (!folder || note.folderId !== folder.id) return false;
    }
    
    return true;
  });

  // Configure Fuse.js search
  const searchKeys = [];
  if (!filters.titleOnly) {
    searchKeys.push({ name: 'content', weight: 0.6 });
  }
  if (!filters.contentOnly) {
    searchKeys.push({ name: 'title', weight: 0.4 });
  }

  const fuse = new Fuse(filteredNotes, {
    keys: searchKeys.length > 0 ? searchKeys : [
      { name: 'title', weight: 0.4 },
      { name: 'content', weight: 0.6 }
    ],
    threshold: 0.3,
    includeScore: true,
  });

  const results = cleanQuery ? fuse.search(cleanQuery) : filteredNotes.map(note => ({ item: note, score: 0 }));

  const extractPlainText = (content: any): string => {
    if (!content || !content.content) return '';
    
    const extractText = (node: any): string => {
      if (node.text) return node.text;
      if (node.content) {
        return node.content.map(extractText).join(' ');
      }
      return '';
    };
    
    return content.content.map(extractText).join(' ');
  };

  const searchResults: SearchResultWithContent[] = results.map(result => ({
    ...result.item,
    plainContent: extractPlainText(result.item.content),
    score: result.score || 0,
  }));

  useEffect(() => {
    if (searchOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [searchOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(!searchOpen);
      }
      if (e.key === 'Escape' && searchOpen) {
        setSearchOpen(false);
        setLocalQuery('');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchOpen, setSearchOpen]);

  const handleNoteClick = (noteId: string) => {
    useUIStore.getState().setCurrentNoteId(noteId);
    setSearchOpen(false);
    setLocalQuery('');
  };

  const clearFilters = () => {
    setFilters({
      tags: [],
      folderId: null,
      dateRange: 'all',
      contentOnly: false,
      titleOnly: false,
    });
  };

  const hasActiveFilters = filters.tags.length > 0 || 
                          filters.folderId !== null || 
                          filters.dateRange !== 'all' || 
                          filters.contentOnly || 
                          filters.titleOnly;

  if (!searchOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center pt-20 z-50">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-4xl mx-4">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Search className="w-5 h-5 text-gray-500" />
            <input
              ref={inputRef}
              type="text"
              value={localQuery}
              onChange={(e) => setLocalQuery(e.target.value)}
              placeholder="Search notes... (try: tag:work, folder:projects)"
              className="flex-1 outline-none text-lg bg-transparent"
            />
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded ${hasActiveFilters ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
              title="Toggle filters"
            >
              <Filter className="w-4 h-4" />
            </button>
            <span className="text-sm text-gray-500">
              Press ESC to close
            </span>
          </div>
          
          {/* Active filters display */}
          {hasActiveFilters && (
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {filters.tags.map(tagId => {
                const tag = tags.find(t => t.id === tagId);
                return tag ? (
                  <span key={tagId} className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs flex items-center gap-1">
                    <Tag className="w-3 h-3" />
                    {tag.name}
                    <button
                      onClick={() => setFilters(prev => ({ ...prev, tags: prev.tags.filter(id => id !== tagId) }))}
                      className="hover:text-red-500"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ) : null;
              })}
              {filters.folderId && (
                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs flex items-center gap-1">
                  <Folder className="w-3 h-3" />
                  {folders.find(f => f.id === filters.folderId)?.name}
                  <button
                    onClick={() => setFilters(prev => ({ ...prev, folderId: null }))}
                    className="hover:text-red-500"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {filters.dateRange !== 'all' && (
                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {filters.dateRange}
                  <button
                    onClick={() => setFilters(prev => ({ ...prev, dateRange: 'all' }))}
                    className="hover:text-red-500"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {(filters.contentOnly || filters.titleOnly) && (
                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs flex items-center gap-1">
                  {filters.contentOnly ? 'Content' : 'Title'} only
                  <button
                    onClick={() => setFilters(prev => ({ ...prev, contentOnly: false, titleOnly: false }))}
                    className="hover:text-red-500"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              <button
                onClick={clearFilters}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Tags Filter */}
              <div>
                <label className="block text-sm font-medium mb-2">Tags</label>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {tags.map(tag => (
                    <label key={tag.id} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={filters.tags.includes(tag.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFilters(prev => ({ ...prev, tags: [...prev.tags, tag.id] }));
                          } else {
                            setFilters(prev => ({ ...prev, tags: prev.tags.filter(id => id !== tag.id) }));
                          }
                        }}
                        className="rounded"
                      />
                      <span className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded" style={{ backgroundColor: tag.color }} />
                        {tag.name}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Folder Filter */}
              <div>
                <label className="block text-sm font-medium mb-2">Folder</label>
                <select
                  value={filters.folderId || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, folderId: e.target.value || null }))}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900"
                >
                  <option value="">All folders</option>
                  {folders.map(folder => (
                    <option key={folder.id} value={folder.id}>
                      {folder.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Range Filter */}
              <div>
                <label className="block text-sm font-medium mb-2">Date Range</label>
                <select
                  value={filters.dateRange}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value as any }))}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900"
                >
                  <option value="all">All time</option>
                  <option value="today">Today</option>
                  <option value="week">This week</option>
                  <option value="month">This month</option>
                </select>
              </div>

              {/* Search Scope */}
              <div>
                <label className="block text-sm font-medium mb-2">Search Scope</label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={!filters.contentOnly && !filters.titleOnly}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFilters(prev => ({ ...prev, contentOnly: false, titleOnly: false }));
                        }
                      }}
                      className="rounded"
                    />
                    Title and Content
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={filters.titleOnly}
                      onChange={(e) => {
                        setFilters(prev => ({ 
                          ...prev, 
                          titleOnly: e.target.checked, 
                          contentOnly: false 
                        }));
                      }}
                      className="rounded"
                    />
                    Title only
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={filters.contentOnly}
                      onChange={(e) => {
                        setFilters(prev => ({ 
                          ...prev, 
                          contentOnly: e.target.checked, 
                          titleOnly: false 
                        }));
                      }}
                      className="rounded"
                    />
                    Content only
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="max-h-96 overflow-y-auto">
          {localQuery && results.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              No results found for "{localQuery}"
              {hasActiveFilters && (
                <div className="mt-2">
                  Try adjusting your filters or <button onClick={clearFilters} className="text-blue-600 dark:text-blue-400 hover:underline">clear all filters</button>
                </div>
              )}
            </div>
          )}

          {!localQuery && !hasActiveFilters && (
            <div className="p-8 text-center text-gray-500">
              Type to search your notes or use filters...
            </div>
          )}

          {searchResults.map((note) => (
            <div
              key={note.id}
              onClick={() => handleNoteClick(note.id)}
              className="p-4 border-b border-gray-100 dark:border-gray-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-gray-400 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                    {note.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                    {note.plainContent}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="text-xs text-gray-500">
                      {new Date(note.updatedAt).toLocaleDateString()}
                    </div>
                    {note.tags.length > 0 && (
                      <div className="flex gap-1">
                        {note.tags.slice(0, 3).map(tagId => {
                          const tag = tags.find(t => t.id === tagId);
                          return tag ? (
                            <span
                              key={tagId}
                              className="px-1 py-0.5 text-xs rounded"
                              style={{ backgroundColor: tag.color + '20', color: tag.color }}
                            >
                              {tag.name}
                            </span>
                          ) : null;
                        })}
                        {note.tags.length > 3 && (
                          <span className="text-xs text-gray-400">+{note.tags.length - 3}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
