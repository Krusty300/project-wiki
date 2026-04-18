'use client';

import { DndContext, DragEndEvent, DragOverEvent, DragStartEvent, 
         closestCenter, CollisionDetection, PointerSensor, useSensor, 
         useSensors, DragOverlay } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { useState } from 'react';
import { updateNote, updateFolder } from '@/hooks/useNotes';
import { Note, Folder } from '@/types';

interface DragDropContextProps {
  children: React.ReactNode;
}

export default function DragDropContext({ children }: DragDropContextProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draggedItem, setDraggedItem] = useState<{ type: 'note' | 'folder'; data: Note | Folder } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
    
    // Determine if it's a note or folder
    if (active.id.toString().startsWith('note-')) {
      // This would be set by the draggable component
      setDraggedItem({ type: 'note', data: {} as Note });
    } else if (active.id.toString().startsWith('folder-')) {
      setDraggedItem({ type: 'folder', data: {} as Folder });
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) {
      setActiveId(null);
      setDraggedItem(null);
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;

    // Handle reordering within the same list
    if (activeId.includes('note-') && overId.includes('note-')) {
      // Reordering notes
      console.log('Reordering notes:', activeId, overId);
    } else if (activeId.includes('folder-') && overId.includes('folder-')) {
      // Reordering folders
      console.log('Reordering folders:', activeId, overId);
    } else if (overId.includes('folder-drop-')) {
      // Moving item to folder
      const folderId = overId.replace('folder-drop-', '');
      console.log('Moving to folder:', folderId);
      
      if (activeId.includes('note-')) {
        const noteId = activeId.replace('note-', '');
        await updateNote(noteId, { folderId: folderId || null });
      }
    }

    setActiveId(null);
    setDraggedItem(null);
  };

  const handleDragOver = (event: DragOverEvent) => {
    // Handle drag over logic for visual feedback
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
    >
      {children}
      <DragOverlay>
        {activeId && draggedItem ? (
          <div className="bg-white dark:bg-gray-800 p-2 rounded shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              {draggedItem.type === 'note' ? (
                <>
                  <div className="w-4 h-4 bg-gray-500 rounded" />
                  <span className="text-sm">Note</span>
                </>
              ) : (
                <>
                  <div className="w-4 h-4 bg-blue-500 rounded" />
                  <span className="text-sm">Folder</span>
                </>
              )}
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
