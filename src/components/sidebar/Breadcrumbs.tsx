'use client';

import React, { useMemo, useCallback } from 'react';
import { ChevronRight, Home, Folder } from 'lucide-react';
import { Folder as FolderType } from '@/types';
import { useFolders } from '@/hooks/useNotes';

interface BreadcrumbItem {
  id: string;
  name: string;
  type: 'home' | 'folder';
  path: string[];
}

interface BreadcrumbsProps {
  currentFolderId?: string | null;
  onNavigate?: (folderId: string | null) => void;
  className?: string;
  showHome?: boolean;
  maxItems?: number;
}

export default function Breadcrumbs({
  currentFolderId,
  onNavigate,
  className = '',
  showHome = true,
  maxItems = 5,
}: BreadcrumbsProps) {
  const folders = useFolders();

  // Build folder path recursively
  const buildFolderPath = useCallback((folderId: string): string[] => {
    const folder = folders.find(f => f.id === folderId);
    if (!folder || !folder.parentId) return [folderId];
    
    return [...buildFolderPath(folder.parentId), folderId];
  }, [folders]);

  // Build breadcrumb path
  const breadcrumbPath = useMemo(() => {
    const items: BreadcrumbItem[] = [];

    // Add home item
    if (showHome) {
      items.push({
        id: 'home',
        name: 'Home',
        type: 'home',
        path: [],
      });
    }

    // Add folder path
    if (currentFolderId) {
      const folderPath = buildFolderPath(currentFolderId);
      
      folderPath.forEach((folderId: string, index: number) => {
        const folder = folders.find((f: FolderType) => f.id === folderId);
        if (folder) {
          items.push({
            id: folder.id,
            name: folder.name,
            type: 'folder',
            path: folderPath.slice(0, index + 1),
          });
        }
      });
    }

    return items;
  }, [currentFolderId, folders, buildFolderPath, showHome]);

  // Truncate breadcrumbs if too many items
  const displayPath = useMemo(() => {
    if (breadcrumbPath.length <= maxItems) {
      return breadcrumbPath;
    }

    // Show first item, ellipsis, and last few items
    const firstItem = breadcrumbPath[0];
    const lastItems = breadcrumbPath.slice(- (maxItems - 2));
    
    return [
      firstItem,
      {
        id: 'ellipsis',
        name: '...',
        type: 'folder' as const,
        path: [],
      },
      ...lastItems,
    ];
  }, [breadcrumbPath, maxItems]);

  const handleItemClick = (item: BreadcrumbItem) => {
    if (item.id === 'ellipsis') return;
    
    const folderId = item.type === 'home' ? null : item.id;
    onNavigate?.(folderId);
  };

  const handleKeyDown = (e: React.KeyboardEvent, item: BreadcrumbItem) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleItemClick(item);
    }
  };

  return (
    <div className={`flex items-center space-x-1 text-sm ${className}`}>
      {displayPath.map((item, index) => (
        <React.Fragment key={item.id}>
          {index > 0 && (
            <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
          )}
          
          <button
            onClick={() => handleItemClick(item)}
            onKeyDown={(e) => handleKeyDown(e, item)}
            className={`
              flex items-center space-x-1 px-2 py-1 rounded-md transition-all duration-200
              ${item.id === currentFolderId 
                ? 'bg-blue-100 text-blue-700 font-medium' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }
              ${item.id === 'ellipsis' ? 'cursor-default opacity-50' : 'cursor-pointer'}
            `}
            disabled={item.id === 'ellipsis'}
            aria-current={item.id === currentFolderId ? 'page' : undefined}
            aria-label={`Navigate to ${item.name}`}
          >
            {item.type === 'home' && (
              <Home className="w-4 h-4" />
            )}
            {item.type === 'folder' && item.id !== 'ellipsis' && (
              <Folder className="w-4 h-4" />
            )}
            
            <span className="truncate max-w-[120px]">
              {item.name}
            </span>
          </button>
        </React.Fragment>
      ))}
    </div>
  );
}

