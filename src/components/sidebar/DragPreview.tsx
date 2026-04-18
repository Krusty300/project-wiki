'use client';

import React, { createContext, useContext, useRef, useEffect } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Folder, FileText, Tag, MoreHorizontal } from 'lucide-react';

// Drag preview context
interface DragPreviewContextType {
  setDragPreview: (preview: React.ReactNode) => void;
  clearDragPreview: () => void;
}

const DragPreviewContext = createContext<DragPreviewContextType | null>(null);

export function useDragPreview() {
  const context = useContext(DragPreviewContext);
  if (!context) {
    throw new Error('useDragPreview must be used within DragPreviewProvider');
  }
  return context;
}

export function DragPreviewProvider({ children }: { children: React.ReactNode }) {
  const [dragPreview, setDragPreview] = React.useState<React.ReactNode>(null);

  const clearDragPreview = () => setDragPreview(null);

  return (
    <DragPreviewContext.Provider value={{ setDragPreview, clearDragPreview }}>
      {children}
      {dragPreview && (
        <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-50 flex items-center justify-center">
          {dragPreview}
        </div>
      )}
    </DragPreviewContext.Provider>
  );
}

// Custom drag preview component
interface CustomDragPreviewProps {
  item: {
    id: string;
    type: 'folder' | 'note' | 'tag';
    name: string;
    icon?: React.ReactNode;
    description?: string;
    metadata?: Record<string, any>;
  };
  style?: React.CSSProperties;
}

export function CustomDragPreview({ item, style }: CustomDragPreviewProps) {
  const getDefaultIcon = () => {
    switch (item.type) {
      case 'folder':
        return <Folder className="w-5 h-5 text-blue-500" />;
      case 'note':
        return <FileText className="w-5 h-5 text-gray-500" />;
      case 'tag':
        return <Tag className="w-5 h-5 text-green-500" />;
      default:
        return <MoreHorizontal className="w-5 h-5 text-gray-400" />;
    }
  };

  return (
    <div
      className={`
        bg-white border-2 border-gray-300 rounded-lg shadow-2xl
        p-3 flex items-center space-x-3 max-w-xs
        transform rotate-2 scale-110
        animate-pulse
      `}
      style={{
        ...style,
        backdropFilter: 'blur(8px)',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
      }}
    >
      {/* Icon */}
      <div className="flex-shrink-0">
        {item.icon || getDefaultIcon()}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="font-medium text-gray-900 truncate">
          {item.name}
        </div>
        
        {item.description && (
          <div className="text-sm text-gray-500 truncate mt-1">
            {item.description}
          </div>
        )}

        {/* Metadata */}
        {item.metadata && (
          <div className="flex items-center space-x-2 mt-2">
            {item.metadata.noteCount && (
              <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                {item.metadata.noteCount} notes
              </span>
            )}
            {item.metadata.tagCount && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                {item.metadata.tagCount} tags
              </span>
            )}
            {item.metadata.lastModified && (
              <span className="text-xs text-gray-400">
                {new Date(item.metadata.lastModified).toLocaleDateString()}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Drag indicator */}
      <div className="flex-shrink-0">
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping" />
      </div>
    </div>
  );
}

// Enhanced draggable component with custom preview
interface EnhancedDraggableProps {
  id: string;
  type: 'folder' | 'note' | 'tag';
  children: React.ReactNode;
  data?: any;
  preview?: React.ReactNode;
  disabled?: boolean;
}

export function EnhancedDraggable({
  id,
  type,
  children,
  data,
  preview,
  disabled = false,
}: EnhancedDraggableProps) {
  const { setDragPreview, clearDragPreview } = useDragPreview();
  const dragStartTime = useRef<number>(0);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id,
    data: {
      type,
      ...data,
    },
    disabled,
  });

  useEffect(() => {
    if (isDragging) {
      dragStartTime.current = Date.now();
      
      // Set custom preview if provided
      if (preview) {
        setDragPreview(preview);
      }
    } else {
      // Clear preview after a short delay to allow drop animation
      setTimeout(() => {
        clearDragPreview();
      }, 100);
    }
  }, [isDragging, preview, setDragPreview, clearDragPreview]);

  const style = {
    transform: CSS.Transform.toString(transform),
    opacity: isDragging ? 0.5 : 1,
    transition: isDragging ? 'none' : 'transform 200ms ease, opacity 200ms ease',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`
        ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        transition-all duration-200
      `}
    >
      {children}
    </div>
  );
}

// Draggable folder with preview
interface DraggableFolderWithPreviewProps {
  folder: any;
  children: React.ReactNode;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}

export function DraggableFolderWithPreview({
  folder,
  children,
  onDragStart,
  onDragEnd,
}: DraggableFolderWithPreviewProps) {
  const { setDragPreview, clearDragPreview } = useDragPreview();

  const preview = (
    <CustomDragPreview
      item={{
        id: folder.id,
        type: 'folder',
        name: folder.name,
        metadata: {
          noteCount: folder.noteCount || 0,
          lastModified: folder.updatedAt,
        },
      }}
    />
  );

  return (
    <EnhancedDraggable
      id={folder.id}
      type="folder"
      data={{ folder }}
      preview={preview}
    >
      <div
        onMouseDown={() => {
          onDragStart?.();
          setDragPreview(preview);
        }}
        onMouseUp={() => {
          onDragEnd?.();
          setTimeout(clearDragPreview, 100);
        }}
      >
        {children}
      </div>
    </EnhancedDraggable>
  );
}

// Draggable note with preview
interface DraggableNoteWithPreviewProps {
  note: any;
  children: React.ReactNode;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}

export function DraggableNoteWithPreview({
  note,
  children,
  onDragStart,
  onDragEnd,
}: DraggableNoteWithPreviewProps) {
  const { setDragPreview, clearDragPreview } = useDragPreview();

  const preview = (
    <CustomDragPreview
      item={{
        id: note.id,
        type: 'note',
        name: note.title || 'Untitled',
        description: note.content?.substring(0, 100),
        metadata: {
          tagCount: note.tags?.length || 0,
          lastModified: note.updatedAt,
        },
      }}
    />
  );

  return (
    <EnhancedDraggable
      id={note.id}
      type="note"
      data={{ note }}
      preview={preview}
    >
      <div
        onMouseDown={() => {
          onDragStart?.();
          setDragPreview(preview);
        }}
        onMouseUp={() => {
          onDragEnd?.();
          setTimeout(clearDragPreview, 100);
        }}
      >
        {children}
      </div>
    </EnhancedDraggable>
  );
}

// Drop zone with visual feedback
interface DropZoneProps {
  children: React.ReactNode;
  onDrop?: (item: any) => void;
  isActive?: boolean;
  className?: string;
}

export function DropZone({ children, onDrop, isActive = false, className = '' }: DropZoneProps) {
  const [isDragOver, setIsDragOver] = React.useState(false);

  return (
    <div
      className={`
        relative transition-all duration-200
        ${isDragOver ? 'scale-105' : 'scale-100'}
        ${isActive ? 'border-2 border-dashed border-blue-400 bg-blue-50' : ''}
        ${isDragOver && isActive ? 'bg-blue-100 border-blue-500' : ''}
        ${className}
      `}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={() => {
        setIsDragOver(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragOver(false);
        
        try {
          const data = JSON.parse(e.dataTransfer.getData('text/plain'));
          onDrop?.(data);
        } catch (error) {
          console.error('Failed to parse drop data:', error);
        }
      }}
    >
      {children}
      
      {/* Drop indicator */}
      {isDragOver && isActive && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-blue-500 text-white px-3 py-1 rounded-lg text-sm font-medium">
            Drop here
          </div>
        </div>
      )}
    </div>
  );
}

// Drag and drop utilities
export const dragDropUtils = {
  // Format drag data
  formatDragData: (item: any) => {
    return JSON.stringify({
      id: item.id,
      type: item.type,
      data: item,
      timestamp: Date.now(),
    });
  },

  // Parse drag data
  parseDragData: (data: string) => {
    try {
      return JSON.parse(data);
    } catch (error) {
      console.error('Failed to parse drag data:', error);
      return null;
    }
  },

  // Check if item can be dropped
  canDrop: (draggedItem: any, dropTarget: any) => {
    // Prevent dropping on self
    if (draggedItem.id === dropTarget.id) return false;
    
    // Prevent dropping folder into its own children
    if (draggedItem.type === 'folder' && dropTarget.type === 'folder') {
      // This would need to be implemented based on your folder structure
      return true;
    }
    
    return true;
  },

  // Get drop effect
  getDropEffect: (draggedItem: any, dropTarget: any) => {
    if (draggedItem.type === 'folder' && dropTarget.type === 'folder') {
      return 'move';
    }
    
    if (draggedItem.type === 'note' && dropTarget.type === 'folder') {
      return 'move';
    }
    
    return 'none';
  },
};

// Global drag styles
export const globalDragStyles = `
  /* Hide default drag preview */
  .dndkit-draggable-preview {
    display: none !important;
  }

  /* Custom drag cursor */
  .dndkit-draggable {
    cursor: grab !important;
  }

  .dndkit-draggable.dragging {
    cursor: grabbing !important;
  }

  /* Drop zone styles */
  .dndkit-droppable {
    transition: all 200ms ease;
  }

  .dndkit-droppable.drag-over {
    background-color: rgba(59, 130, 246, 0.1);
    border-color: rgb(59, 130, 246);
  }

  /* Drag overlay */
  .drag-overlay {
    pointer-events: none;
    z-index: 9999;
  }

  /* Drag ghost image */
  .drag-ghost {
    opacity: 0.5;
    transform: rotate(2deg);
  }
`;
