'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Maximize2, Minus, Plus } from 'lucide-react';

interface ResizeHandlesProps {
  element: HTMLElement;
  type: 'table' | 'image';
  onResize: (width: number, height: number) => void;
  onRemove: () => void;
}

interface ResizeHandle {
  position: 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w';
  cursor: string;
}

export default function ResizeHandles({ element, type, onResize, onRemove }: ResizeHandlesProps) {
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<string>('');
  const [startSize, setStartSize] = useState({ width: 0, height: 0 });
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handles: ResizeHandle[] = type === 'table' 
    ? [
        { position: 'e', cursor: 'ew-resize' },
        { position: 'w', cursor: 'ew-resize' },
        { position: 'se', cursor: 'se-resize' },
        { position: 'sw', cursor: 'sw-resize' },
      ]
    : [
        { position: 'nw', cursor: 'nw-resize' },
        { position: 'ne', cursor: 'ne-resize' },
        { position: 'sw', cursor: 'sw-resize' },
        { position: 'se', cursor: 'se-resize' },
        { position: 'n', cursor: 'ns-resize' },
        { position: 's', cursor: 'ns-resize' },
        { position: 'e', cursor: 'ew-resize' },
        { position: 'w', cursor: 'ew-resize' },
      ];

  const handleMouseDown = (e: React.MouseEvent, direction: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsResizing(true);
    setResizeDirection(direction);
    setStartSize({
      width: element.offsetWidth,
      height: element.offsetHeight
    });
    setStartPos({
      x: e.clientX,
      y: e.clientY
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing) return;

    const deltaX = e.clientX - startPos.x;
    const deltaY = e.clientY - startPos.y;
    
    let newWidth = startSize.width;
    let newHeight = startSize.height;

    // Calculate new size based on resize direction
    if (resizeDirection.includes('e')) {
      newWidth = Math.max(50, startSize.width + deltaX);
    }
    if (resizeDirection.includes('w')) {
      newWidth = Math.max(50, startSize.width - deltaX);
    }
    if (resizeDirection.includes('s')) {
      newHeight = Math.max(50, startSize.height + deltaY);
    }
    if (resizeDirection.includes('n')) {
      newHeight = Math.max(50, startSize.height - deltaY);
    }

    // Apply constraints
    if (type === 'table') {
      newWidth = Math.max(200, newWidth); // Minimum table width
      newHeight = Math.max(100, newHeight); // Minimum table height
    } else {
      newWidth = Math.max(100, newWidth); // Minimum image width
      newHeight = Math.max(100, newHeight); // Minimum image height
    }

    // Apply the new size
    if (element.style.width !== undefined) {
      element.style.width = `${newWidth}px`;
    }
    if (element.style.height !== undefined && type === 'image') {
      element.style.height = `${newHeight}px`;
    }

    onResize(newWidth, newHeight);
  };

  const handleMouseUp = () => {
    setIsResizing(false);
    setResizeDirection('');
  };

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing, resizeDirection, startSize, startPos]);

  const getHandlePosition = (position: string) => {
    const rect = element.getBoundingClientRect();
    const containerRect = containerRef.current?.getBoundingClientRect();
    
    if (!containerRect) return { top: 0, left: 0 };

    const relativeTop = rect.top - containerRect.top;
    const relativeLeft = rect.left - containerRect.left;

    switch (position) {
      case 'nw':
        return { top: relativeTop - 4, left: relativeLeft - 4 };
      case 'ne':
        return { top: relativeTop - 4, left: relativeLeft + rect.width - 4 };
      case 'sw':
        return { top: relativeTop + rect.height - 4, left: relativeLeft - 4 };
      case 'se':
        return { top: relativeTop + rect.height - 4, left: relativeLeft + rect.width - 4 };
      case 'n':
        return { top: relativeTop - 4, left: relativeLeft + rect.width / 2 - 4 };
      case 's':
        return { top: relativeTop + rect.height - 4, left: relativeLeft + rect.width / 2 - 4 };
      case 'e':
        return { top: relativeTop + rect.height / 2 - 4, left: relativeLeft + rect.width - 4 };
      case 'w':
        return { top: relativeTop + rect.height / 2 - 4, left: relativeLeft - 4 };
      default:
        return { top: 0, left: 0 };
    }
  };

  const renderHandle = (handle: ResizeHandle) => {
    const position = getHandlePosition(handle.position);
    const isCorner = ['nw', 'ne', 'sw', 'se'].includes(handle.position);
    
    return (
      <div
        key={handle.position}
        className={`absolute z-50 bg-blue-500 hover:bg-blue-600 transition-colors ${
          isCorner ? 'w-2 h-2' : 'w-2 h-3'
        }`}
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`,
          cursor: handle.cursor,
          borderRadius: isCorner ? '50%' : '2px',
        }}
        onMouseDown={(e) => handleMouseDown(e, handle.position)}
      />
    );
  };

  const handleSizeIncrease = () => {
    const currentWidth = element.offsetWidth;
    const currentHeight = element.offsetHeight;
    const newWidth = currentWidth + 20;
    const newHeight = type === 'table' ? currentHeight : currentHeight + 20;
    
    element.style.width = `${newWidth}px`;
    if (type === 'image') {
      element.style.height = `${newHeight}px`;
    }
    
    onResize(newWidth, newHeight);
  };

  const handleSizeDecrease = () => {
    const currentWidth = element.offsetWidth;
    const currentHeight = element.offsetHeight;
    const newWidth = Math.max(50, currentWidth - 20);
    const newHeight = Math.max(50, currentHeight - 20);
    
    element.style.width = `${newWidth}px`;
    if (type === 'image') {
      element.style.height = `${newHeight}px`;
    }
    
    onResize(newWidth, newHeight);
  };

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-none z-40"
      style={{ pointerEvents: 'none' }}
    >
      {/* Resize Handles */}
      <div style={{ pointerEvents: 'auto' }}>
        {handles.map(renderHandle)}
      </div>

      {/* Size Controls */}
      <div
        className="absolute bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-1 flex items-center gap-1"
        style={{
          top: `${element.getBoundingClientRect().top - 40}px`,
          left: `${element.getBoundingClientRect().left}px`,
          pointerEvents: 'auto',
        }}
      >
        <button
          onClick={handleSizeDecrease}
          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title="Decrease size"
        >
          <Minus className="w-3 h-3 text-gray-500" />
        </button>
        
        <span className="text-xs text-gray-600 dark:text-gray-400 px-2 min-w-[60px] text-center">
          {element.offsetWidth} × {element.offsetHeight}
        </span>
        
        <button
          onClick={handleSizeIncrease}
          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title="Increase size"
        >
          <Plus className="w-3 h-3 text-gray-500" />
        </button>

        <div className="w-px h-4 bg-gray-300 dark:bg-gray-600 mx-1" />

        <button
          onClick={onRemove}
          className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 transition-colors"
          title="Remove element"
        >
          <Maximize2 className="w-3 h-3 rotate-45" />
        </button>
      </div>
    </div>
  );
}

// Hook to handle resize functionality
export function useResizeHandles(editor: any) {
  const [resizeHandles, setResizeHandles] = useState<Array<{
    id: string;
    element: HTMLElement;
    type: 'table' | 'image';
    position: { x: number; y: number };
  }>>([]);

  const updateResizeHandles = () => {
    if (!editor) return;

    const handles: Array<{
      id: string;
      element: HTMLElement;
      type: 'table' | 'image';
      position: { x: number; y: number };
    }> = [];

    // Find all tables and images
    editor.state.doc.descendants((node: any, pos: number) => {
      const domNode = editor.view.nodeDOM(pos);
      if (!domNode) return;

      if (node.type.name === 'table') {
        const tableElement = domNode as HTMLElement;
        const rect = tableElement.getBoundingClientRect();
        
        handles.push({
          id: `table-${pos}`,
          element: tableElement,
          type: 'table',
          position: { x: rect.left, y: rect.top }
        });
      } else if (node.type.name === 'image') {
        const imageElement = domNode as HTMLElement;
        const rect = imageElement.getBoundingClientRect();
        
        handles.push({
          id: `image-${pos}`,
          element: imageElement,
          type: 'image',
          position: { x: rect.left, y: rect.top }
        });
      }
    });

    setResizeHandles(handles);
  };

  const handleResize = (element: HTMLElement, width: number, height: number) => {
    // Update the element in the editor
    console.log(`Resized element to ${width}x${height}`);
  };

  const handleRemove = (element: HTMLElement) => {
    // Remove the element from the editor
    console.log('Removed element');
  };

  return {
    resizeHandles,
    updateResizeHandles,
    handleResize,
    handleRemove
  };
}
