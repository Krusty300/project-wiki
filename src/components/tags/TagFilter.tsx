'use client';

import { useState } from 'react';
import { useTags } from '@/hooks/useNotes';
import { useUIStore } from '@/store/ui-store';
import { Filter, Hash } from 'lucide-react';

export default function TagFilter() {
  const { selectedTagIds, setSelectedTagIds } = useUIStore();
  const tags = useTags();
  const [isOpen, setIsOpen] = useState(false);

  const handleToggleTag = (tagId: string) => {
    setSelectedTagIds(
      selectedTagIds.includes(tagId)
        ? selectedTagIds.filter((id: string) => id !== tagId)
        : [...selectedTagIds, tagId]
    );
  };

  const clearFilters = () => {
    setSelectedTagIds([]);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
      >
        <Filter className="w-4 h-4" />
        <span>Filter by tags</span>
        {selectedTagIds.length > 0 && (
          <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
            {selectedTagIds.length}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10">
          <div className="p-3 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Tags</span>
              {selectedTagIds.length > 0 && (
                <button
                  onClick={clearFilters}
                  className="text-xs text-blue-500 hover:text-blue-600"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto p-3">
            {tags?.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-2">
                No tags yet. Create some tags to filter notes.
              </p>
            ) : (
              <div className="space-y-2">
                {tags?.map(tag => (
                  <label
                    key={tag.id}
                    className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded"
                  >
                    <input
                      type="checkbox"
                      checked={selectedTagIds.includes(tag.id)}
                      onChange={() => handleToggleTag(tag.id)}
                      className="rounded border-gray-300 dark:border-gray-600"
                    />
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: tag.color }}
                      />
                      <span className="text-sm">{tag.name}</span>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
