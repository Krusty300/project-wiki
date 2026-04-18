'use client';

import { useDroppable } from '@dnd-kit/core';
import { Folder as FolderIcon } from 'lucide-react';
import { Folder } from '@/types';

interface DroppableFolderProps {
  folder: Folder;
  children: React.ReactNode;
  isDropTarget?: boolean;
}

export default function DroppableFolder({ folder, children, isDropTarget }: DroppableFolderProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `folder-drop-${folder.id}`,
    data: {
      folder,
      type: 'folder',
    },
  });

  return (
    <div
      ref={setNodeRef}
      className={`relative ${isOver || isDropTarget ? 'bg-blue-50 dark:bg-blue-900/20 rounded' : ''}`}
    >
      {children}
      {isOver && (
        <div className="absolute inset-0 bg-blue-500/10 rounded pointer-events-none flex items-center justify-center">
          <FolderIcon className="w-8 h-8 text-blue-500" />
        </div>
      )}
    </div>
  );
}
