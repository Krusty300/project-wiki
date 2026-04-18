'use client';

import React, { useRef, useState } from 'react';
import { GripVertical, Plus, Trash2 } from 'lucide-react';

interface DragHandlesProps {
  node: any;
  position: { x: number; y: number };
  onDragStart: (e: React.MouseEvent) => void;
  onAddAbove: () => void;
  onAddBelow: () => void;
  onDelete: () => void;
  type: 'list' | 'table' | 'block';
}

export default function DragHandles({ 
  node, 
  position, 
  onDragStart, 
  onAddAbove, 
  onAddBelow, 
  onDelete,
  type 
}: DragHandlesProps) {
  const [isHovered, setIsHovered] = useState(false);
  const handleRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    onDragStart(e);
  };

  const getIcon = () => {
    switch (type) {
      case 'list':
        return '📝';
      case 'table':
        return '📊';
      case 'block':
        return '📄';
      default:
        return '📝';
    }
  };

  const getLabel = () => {
    switch (type) {
      case 'list':
        return 'List';
      case 'table':
        return 'Table';
      case 'block':
        return 'Block';
      default:
        return 'Block';
    }
  };

  return (
    <div
      ref={handleRef}
      className="fixed z-40 flex items-center gap-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-1"
      style={{
        left: `${position.x - 60}px`, // Position to the left of the element
        top: `${position.y}px`,
        opacity: isHovered ? 1 : 0.7,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Drag Handle */}
      <button
        onMouseDown={handleMouseDown}
        className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 cursor-move transition-colors"
        title={`Drag ${getLabel()}`}
      >
        <GripVertical className="w-3 h-3 text-gray-500" />
      </button>

      {/* Type Indicator */}
      <div className="px-2 py-1 text-xs text-gray-600 dark:text-gray-400 border-l border-gray-200 dark:border-gray-700">
        {getIcon()}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-1 border-l border-gray-200 dark:border-gray-700 pl-1">
        <button
          onClick={onAddAbove}
          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title={`Add ${getLabel()} Above`}
        >
          <Plus className="w-3 h-3 text-gray-500 rotate-180" />
        </button>
        
        <button
          onClick={onAddBelow}
          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title={`Add ${getLabel()} Below`}
        >
          <Plus className="w-3 h-3 text-gray-500" />
        </button>
        
        <button
          onClick={onDelete}
          className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 transition-colors"
          title={`Delete ${getLabel()}`}
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

// Hook to handle drag and drop functionality
export function useDragHandles(editor: any) {
  const [dragHandles, setDragHandles] = useState<Array<{
    id: string;
    node: any;
    position: { x: number; y: number };
    type: 'list' | 'table' | 'block';
  }>>([]);

  const updateDragHandles = () => {
    if (!editor) return;

    const handles: Array<{
      id: string;
      node: any;
      position: { x: number; y: number };
      type: 'list' | 'table' | 'block';
    }> = [];

    // Find all list items
    editor.state.doc.descendants((node: any, pos: number) => {
      const domNode = editor.view.nodeDOM(pos);
      if (!domNode) return;

      const rect = domNode.getBoundingClientRect();
      
      if (node.type.name === 'listItem') {
        handles.push({
          id: `list-${pos}`,
          node,
          position: { x: rect.left, y: rect.top },
          type: 'list'
        });
      } else if (node.type.name === 'table') {
        handles.push({
          id: `table-${pos}`,
          node,
          position: { x: rect.left, y: rect.top },
          type: 'table'
        });
      } else if (node.type.name === 'heading' || node.type.name === 'paragraph') {
        // Only add handles for significant blocks
        if (node.content && node.content.size > 20) {
          handles.push({
            id: `block-${pos}`,
            node,
            position: { x: rect.left, y: rect.top },
            type: 'block'
          });
        }
      }
    });

    setDragHandles(handles);
  };

  const handleDragStart = (e: React.MouseEvent, node: any, position: number) => {
    // Implement drag start logic
    console.log('Drag started for node:', node);
  };

  const handleAddAbove = (position: number) => {
    // Add new element above
    editor.chain().focus().insertContentAt(position, '<p>New paragraph</p>').run();
  };

  const handleAddBelow = (position: number) => {
    // Add new element below
    const nodeSize = editor.state.doc.nodeAt(position)?.nodeSize || 1;
    editor.chain().focus().insertContentAt(position + nodeSize, '<p>New paragraph</p>').run();
  };

  const handleDelete = (position: number) => {
    // Delete the element
    const node = editor.state.doc.nodeAt(position);
    if (node) {
      editor.chain().focus().deleteRange({ from: position, to: position + node.nodeSize }).run();
    }
  };

  return {
    dragHandles,
    updateDragHandles,
    handleDragStart,
    handleAddAbove,
    handleAddBelow,
    handleDelete
  };
}
