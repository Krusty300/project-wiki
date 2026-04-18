'use client';

import { useState } from 'react';
import { useTags, useNotes, createTag, deleteTag, updateNote } from '@/hooks/useNotes';
import { Tag } from '@/types';
import { X, Plus, Hash, Trash2, MoreHorizontal } from 'lucide-react';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

interface TagManagerProps {
  noteTags: string[];
  onTagsChange: (tags: string[]) => void;
  className?: string;
}

const TAG_COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#f59e0b', // amber
  '#84cc16', // lime
  '#22c55e', // green
  '#10b981', // emerald
  '#14b8a6', // teal
  '#06b6d4', // cyan
  '#0ea5e9', // sky
  '#3b82f6', // blue
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#a855f7', // purple
  '#d946ef', // fuchsia
  '#ec4899', // pink
  '#f43f5e', // rose
];

export default function TagManager({ noteTags, onTagsChange, className }: TagManagerProps) {
  const [showCreateTag, setShowCreateTag] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [selectedColor, setSelectedColor] = useState(TAG_COLORS[0]);
  const [deleteConfirm, setDeleteConfirm] = useState<Tag | null>(null);
  const [showManageTags, setShowManageTags] = useState(false);
  
  const tags = useTags();
  const allNotes = useNotes();

  const handleCreateTag = async () => {
    if (newTagName.trim()) {
      const newTag = await createTag({
        name: newTagName.trim(),
        color: selectedColor,
      });
      onTagsChange([...noteTags, newTag.id]);
      setNewTagName('');
      setShowCreateTag(false);
    }
  };

  const handleRemoveTag = (tagId: string) => {
    onTagsChange(noteTags.filter(id => id !== tagId));
  };

  const handleDeleteTag = async (tag: Tag) => {
    // Remove tag from all notes that use it
    const notesWithThisTag = allNotes?.filter(note => note.tags.includes(tag.id)) || [];
    
    for (const note of notesWithThisTag) {
      await updateNote(note.id, {
        tags: note.tags.filter(id => id !== tag.id)
      });
    }
    
    // Delete the tag
    await deleteTag(tag.id);
    setDeleteConfirm(null);
  };

  const getTagById = (id: string) => tags?.find(tag => tag.id === id);

  const getTagUsageCount = (tagId: string) => {
    return allNotes?.filter(note => note.tags.includes(tagId)).length || 0;
  };

  return (
    <>
      <div className={`flex flex-wrap gap-2 items-center ${className}`}>
      {/* Existing Tags */}
      {noteTags.map(tagId => {
        const tag = getTagById(tagId);
        if (!tag) return null;
        
        return (
          <span
            key={tag.id}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium text-white"
            style={{ backgroundColor: tag.color }}
          >
            <Hash className="w-3 h-3" />
            {tag.name}
            <button
              onClick={() => handleRemoveTag(tag.id)}
              className="hover:bg-white/20 rounded-full p-0.5"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        );
      })}

        {/* Add Tag Button */}
        {!showCreateTag && (
          <div className="flex gap-1">
            <button
              onClick={() => setShowCreateTag(true)}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <Plus className="w-3 h-3" />
              Add tag
            </button>
            
            <button
              onClick={() => setShowManageTags(true)}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              title="Manage tags"
            >
              <MoreHorizontal className="w-3 h-3" />
            </button>
          </div>
        )}

      {/* Create Tag Form */}
      {showCreateTag && (
        <div className="flex items-center gap-2 p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800">
          <input
            type="text"
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreateTag();
              if (e.key === 'Escape') {
                setShowCreateTag(false);
                setNewTagName('');
              }
            }}
            placeholder="Tag name..."
            className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
            autoFocus
          />
          
          {/* Color Picker */}
          <div className="flex gap-1">
            {TAG_COLORS.map(color => (
              <button
                key={color}
                onClick={() => setSelectedColor(color)}
                className={`w-4 h-4 rounded-full border-2 ${
                  selectedColor === color ? 'border-gray-900 dark:border-white' : 'border-transparent'
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>

          <button
            onClick={handleCreateTag}
            className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Add
          </button>
          <button
            onClick={() => {
              setShowCreateTag(false);
              setNewTagName('');
            }}
            className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            Cancel
          </button>
        </div>
      )}
    </div>

      {/* Manage Tags Modal */}
      {showManageTags && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-md w-full mx-4 max-h-96 overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Manage Tags
              </h3>
              <button
                onClick={() => setShowManageTags(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            
            <div className="p-4 space-y-2">
              {tags?.map(tag => {
                const usageCount = getTagUsageCount(tag.id);
                return (
                  <div
                    key={tag.id}
                    className="flex items-center justify-between p-2 border border-gray-200 dark:border-gray-700 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: tag.color }}
                      />
                      <span className="text-sm font-medium">{tag.name}</span>
                      <span className="text-xs text-gray-500">({usageCount} notes)</span>
                    </div>
                    
                    {usageCount === 0 && (
                      <button
                        onClick={() => setDeleteConfirm(tag)}
                        className="p-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                );
              })}
              
              {tags?.length === 0 && (
                <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                  No tags created yet
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => deleteConfirm && handleDeleteTag(deleteConfirm)}
        title="Delete Tag"
        message={`Are you sure you want to delete "${deleteConfirm?.name}"? This tag is not used in any notes.`}
        confirmText="Delete"
        type="danger"
      />
    </>
  );
}
