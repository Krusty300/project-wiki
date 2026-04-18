'use client';

import { useTrashedNotes, restoreNote, permanentlyDeleteNote, emptyTrash } from '@/hooks/useNotes';
import { Note } from '@/types';
import { Trash2, RotateCcw, AlertTriangle, X } from 'lucide-react';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useState } from 'react';

export default function TrashView() {
  const trashedNotes = useTrashedNotes();
  const [deleteConfirm, setDeleteConfirm] = useState<Note | null>(null);
  const [emptyConfirm, setEmptyConfirm] = useState(false);

  const handleRestore = async (noteId: string) => {
    await restoreNote(noteId);
  };

  const handlePermanentDelete = async (note: Note) => {
    await permanentlyDeleteNote(note.id);
    setDeleteConfirm(null);
  };

  const handleEmptyTrash = async () => {
    await emptyTrash();
    setEmptyConfirm(false);
  };

  return (
    <>
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-red-500" />
              <h1 className="text-2xl font-bold">Trash</h1>
              <span className="text-sm text-gray-500">
                ({trashedNotes?.length || 0} items)
              </span>
            </div>
            
            {trashedNotes && trashedNotes.length > 0 && (
              <button
                onClick={() => setEmptyConfirm(true)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-red-600 text-white rounded hover:bg-red-700"
              >
                <Trash2 className="w-4 h-4" />
                Empty Trash
              </button>
            )}
          </div>

          {trashedNotes && trashedNotes.length === 0 ? (
            <div className="text-center py-12">
              <Trash2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Your trash is empty</p>
            </div>
          ) : (
            <div className="space-y-2">
              {trashedNotes?.map(note => (
                <div
                  key={note.id}
                  className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <div className="flex-1">
                    <h3 className="font-medium">{note.title}</h3>
                    <p className="text-sm text-gray-500">
                      Deleted {note.deletedAt ? new Date(note.deletedAt).toLocaleDateString() : 'recently'}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleRestore(note.id)}
                      className="flex items-center gap-1 px-2 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Restore
                    </button>
                    
                    <button
                      onClick={() => setDeleteConfirm(note)}
                      className="flex items-center gap-1 px-2 py-1 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                    >
                      <Trash2 className="w-3 h-3" />
                      Delete Forever
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Confirm Permanent Delete */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => deleteConfirm && handlePermanentDelete(deleteConfirm)}
        title="Delete Forever"
        message={`Are you sure you want to permanently delete "${deleteConfirm?.title}"? This action cannot be undone.`}
        confirmText="Delete Forever"
        type="danger"
      />

      {/* Confirm Empty Trash */}
      <ConfirmDialog
        isOpen={emptyConfirm}
        onClose={() => setEmptyConfirm(false)}
        onConfirm={handleEmptyTrash}
        title="Empty Trash"
        message={`Are you sure you want to empty the trash? This will permanently delete ${trashedNotes?.length || 0} items and cannot be undone.`}
        confirmText="Empty Trash"
        type="danger"
      />
    </>
  );
}
