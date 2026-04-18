'use client';

import { useState, useEffect, useRef } from 'react';
import { useSidebarStore, MIN_SIDEBAR_WIDTH, MAX_SIDEBAR_WIDTH } from '@/store/sidebar-store';
import { GripVertical } from 'lucide-react';

interface SidebarResizeHandleProps {
  onResizeStart?: () => void;
  onResizeEnd?: () => void;
}

export default function SidebarResizeHandle({ onResizeStart, onResizeEnd }: SidebarResizeHandleProps) {
  const [isDragging, setIsDragging] = useState(false);
  const { sidebarWidth, setSidebarWidth, setIsResizing, showDragHandles } = useSidebarStore();
  const startXRef = useRef<number>(0);
  const startWidthRef = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      e.preventDefault();
      const deltaX = e.clientX - startXRef.current;
      const newWidth = startWidthRef.current + deltaX;
      
      // Constrain width within bounds
      const constrainedWidth = Math.max(MIN_SIDEBAR_WIDTH, Math.min(MAX_SIDEBAR_WIDTH, newWidth));
      setSidebarWidth(constrainedWidth);
    };

    const handleMouseUp = () => {
      if (!isDragging) return;
      
      setIsDragging(false);
      setIsResizing(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      onResizeEnd?.();
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      if (isDragging) {
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    };
  }, [isDragging, setSidebarWidth, setIsResizing, onResizeEnd]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setIsResizing(true);
    startXRef.current = e.clientX;
    startWidthRef.current = sidebarWidth;
    onResizeStart?.();
  };

  const handleDoubleClick = () => {
    // Reset to default width on double click
    setSidebarWidth(256); // DEFAULT_SIDEBAR_WIDTH
  };

  return (
    <div
      ref={containerRef}
      className={`relative flex-shrink-0 w-1 bg-transparent hover:bg-blue-300 dark:hover:bg-blue-600 transition-colors cursor-col-resize group ${
        isDragging ? 'bg-blue-400 dark:bg-blue-500' : ''
      }`}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
      title="Drag to resize sidebar (double-click to reset)"
    >
      {/* Visual indicator */}
      <div className={`absolute inset-0 flex items-center justify-center ${
        showDragHandles || isDragging ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
      } transition-opacity`}>
        <GripVertical className="w-3 h-3 text-gray-400 dark:text-gray-600" />
      </div>
      
      {/* Hover effect */}
      <div className="absolute inset-y-0 -left-1 -right-1 hover:bg-blue-100 dark:hover:bg-blue-900/20 opacity-0 hover:opacity-100 transition-opacity" />
    </div>
  );
}
