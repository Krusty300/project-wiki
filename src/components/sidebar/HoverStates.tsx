'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Folder, FileText, Tag, Clock, MoreHorizontal, Plus, Trash2, Edit3 } from 'lucide-react';

// Base hover state component
interface HoverStateProps {
  children: React.ReactNode;
  className?: string;
  hoverClassName?: string;
  disabled?: boolean;
  delay?: number;
  onHoverStart?: () => void;
  onHoverEnd?: () => void;
}

export function HoverState({
  children,
  className = '',
  hoverClassName = '',
  disabled = false,
  delay = 0,
  onHoverStart,
  onHoverEnd,
}: HoverStateProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isDelayedHovered, setIsDelayedHovered] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const handleMouseEnter = () => {
    if (disabled) return;
    
    setIsHovered(true);
    
    if (delay > 0) {
      timeoutRef.current = setTimeout(() => {
        setIsDelayedHovered(true);
        onHoverStart?.();
      }, delay);
    } else {
      setIsDelayedHovered(true);
      onHoverStart?.();
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setIsDelayedHovered(false);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    onHoverEnd?.();
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      className={`
        ${className}
        ${isDelayedHovered ? hoverClassName : ''}
        transition-all duration-200 ease-in-out
      `}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </div>
  );
}

// Enhanced folder item with hover states
interface EnhancedFolderItemProps {
  folder: any;
  level: number;
  isSelected: boolean;
  isExpanded: boolean;
  onFolderClick: (folder: any) => void;
  onDeleteFolder: (folderId: string) => void;
  onRenameFolder: (folderId: string, newName: string) => void;
  children?: React.ReactNode;
}

export function EnhancedFolderItem({
  folder,
  level,
  isSelected,
  isExpanded,
  onFolderClick,
  onDeleteFolder,
  onRenameFolder,
  children,
}: EnhancedFolderItemProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(folder.name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isRenaming && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isRenaming]);

  const handleRename = () => {
    if (newName.trim() && newName !== folder.name) {
      onRenameFolder(folder.id, newName.trim());
    }
    setIsRenaming(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRename();
    } else if (e.key === 'Escape') {
      setNewName(folder.name);
      setIsRenaming(false);
    }
  };

  return (
    <div className="group">
      <div
        className={`
          flex items-center justify-between px-3 py-2 cursor-pointer
          transition-all duration-200 ease-in-out
          ${isSelected 
            ? 'bg-blue-100 text-blue-700 border-l-4 border-blue-500' 
            : 'hover:bg-gray-100 text-gray-700 hover:text-gray-900'
          }
          ${isHovered ? 'shadow-sm' : ''}
        `}
        style={{ paddingLeft: `${level * 16 + 12}px` }}
        onClick={() => onFolderClick(folder)}
        onMouseEnter={() => {
          setIsHovered(true);
          setShowActions(true);
        }}
        onMouseLeave={() => {
          setIsHovered(false);
          setTimeout(() => setShowActions(false), 100);
        }}
      >
        <div className="flex items-center space-x-2 flex-1 min-w-0">
          {/* Chevron */}
          <div
            className={`
              transition-transform duration-200 ease-in-out
              ${isExpanded ? 'rotate-90' : ''}
            `}
          >
            <Folder className="w-4 h-4" />
          </div>

          {/* Folder Name */}
          {isRenaming ? (
            <input
              ref={inputRef}
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onBlur={handleRename}
              onKeyDown={handleKeyDown}
              className="flex-1 px-1 py-0.5 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          ) : (
            <span className="truncate text-sm font-medium">
              {folder.name}
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div
          className={`
            flex items-center space-x-1 transition-opacity duration-200
            ${showActions ? 'opacity-100' : 'opacity-0'}
          `}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsRenaming(true);
            }}
            className="p-1 hover:bg-gray-200 rounded transition-colors"
            title="Rename folder"
          >
            <Edit3 className="w-3 h-3 text-gray-500 hover:text-gray-700" />
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDeleteFolder(folder.id);
            }}
            className="p-1 hover:bg-red-100 rounded transition-colors"
            title="Delete folder"
          >
            <Trash2 className="w-3 h-3 text-gray-500 hover:text-red-600" />
          </button>
        </div>
      </div>

      {/* Children */}
      {isExpanded && children && (
        <div className="transition-all duration-200 ease-in-out">
          {children}
        </div>
      )}
    </div>
  );
}

// Enhanced note item with hover states
interface EnhancedNoteItemProps {
  note: any;
  isSelected: boolean;
  onNoteClick: (note: any) => void;
  onDeleteNote: (noteId: string) => void;
  onRenameNote: (noteId: string, newName: string) => void;
  showPreview?: boolean;
}

export function EnhancedNoteItem({
  note,
  isSelected,
  onNoteClick,
  onDeleteNote,
  onRenameNote,
  showPreview = false,
}: EnhancedNoteItemProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showActions, setShowActions] = useState(false);

  return (
    <HoverState
      className={`
        px-3 py-2 cursor-pointer border-l-2
        ${isSelected 
          ? 'bg-blue-50 text-blue-700 border-blue-500' 
          : 'hover:bg-gray-50 text-gray-700 hover:text-gray-900 border-transparent'
        }
      `}
      hoverClassName="shadow-sm transform scale-[1.01]"
      onHoverStart={() => setShowActions(true)}
      onHoverEnd={() => setTimeout(() => setShowActions(false), 100)}
    >
      <div
        className="flex items-start justify-between"
        onClick={() => onNoteClick(note)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="flex items-start space-x-2 flex-1 min-w-0">
          <FileText className="w-4 h-4 mt-0.5 text-gray-400 flex-shrink-0" />
          
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium truncate">
              {note.title || 'Untitled'}
            </h3>
            
            {showPreview && note.content && (
              <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                {note.content.substring(0, 100)}...
              </p>
            )}
            
            <div className="flex items-center space-x-2 mt-1">
              <span className="text-xs text-gray-400">
                {new Date(note.updatedAt).toLocaleDateString()}
              </span>
              
              {note.tags && note.tags.length > 0 && (
                <div className="flex space-x-1">
                  {note.tags.slice(0, 2).map((tag: string) => (
                    <span
                      key={tag}
                      className="px-1 py-0.5 bg-gray-100 text-gray-600 text-xs rounded"
                    >
                      {tag}
                    </span>
                  ))}
                  {note.tags.length > 2 && (
                    <span className="text-xs text-gray-400">
                      +{note.tags.length - 2}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div
          className={`
            flex items-center space-x-1 ml-2 transition-all duration-200
            ${showActions ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2'}
          `}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDeleteNote(note.id);
            }}
            className="p-1 hover:bg-red-100 rounded transition-colors"
            title="Delete note"
          >
            <Trash2 className="w-3 h-3 text-gray-500 hover:text-red-600" />
          </button>
        </div>
      </div>
    </HoverState>
  );
}

// Animated button with micro-interactions
interface AnimatedButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

export function AnimatedButton({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  className = '',
}: AnimatedButtonProps) {
  const [isPressed, setIsPressed] = useState(false);

  const baseClasses = `
    inline-flex items-center justify-center font-medium rounded-lg
    transition-all duration-200 ease-in-out
    focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
  `;

  const variantClasses = {
    primary: 'bg-blue-500 text-white hover:bg-blue-600 focus:ring-blue-500',
    secondary: 'bg-gray-200 text-gray-700 hover:bg-gray-300 focus:ring-gray-500',
    ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-500',
  };

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-2 text-sm',
    lg: 'px-4 py-3 text-base',
  };

  const transformClasses = isPressed ? 'scale-95' : 'scale-100';

  return (
    <button
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${transformClasses}
        ${className}
      `}
      onClick={onClick}
      disabled={disabled || loading}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
    >
      {loading ? (
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          <span>Loading...</span>
        </div>
      ) : (
        children
      )}
    </button>
  );
}

// Floating action button with hover effects
interface FloatingActionButtonProps {
  icon: React.ReactNode;
  onClick: () => void;
  label?: string;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  color?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function FloatingActionButton({
  icon,
  onClick,
  label,
  position = 'bottom-right',
  color = 'bg-blue-500',
  size = 'md',
}: FloatingActionButtonProps) {
  const [isHovered, setIsHovered] = useState(false);

  const positionClasses = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
  };

  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-12 h-12',
    lg: 'w-14 h-14',
  };

  return (
    <div className={`fixed ${positionClasses[position]} z-50`}>
      <div
        className={`
          relative ${sizeClasses[size]} ${color} rounded-full
          shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out
          cursor-pointer flex items-center justify-center
          ${isHovered ? 'scale-110' : 'scale-100'}
        `}
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="text-white">
          {icon}
        </div>
        
        {/* Tooltip */}
        {label && isHovered && (
          <div className="absolute bottom-full mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap">
            {label}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
              <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Micro-interaction utilities
export const microInteractions = {
  // Bounce animation
  bounce: 'animate-bounce',
  
  // Pulse animation
  pulse: 'animate-pulse',
  
  // Spin animation
  spin: 'animate-spin',
  
  // Fade in
  fadeIn: 'animate-fade-in',
  
  // Slide up
  slideUp: 'animate-slide-up',
  
  // Scale in
  scaleIn: 'animate-scale-in',
};

// CSS for custom animations
export const customAnimations = `
  @keyframes fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes slide-up {
    from { transform: translateY(10px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
  
  @keyframes scale-in {
    from { transform: scale(0.9); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
  }
  
  .animate-fade-in {
    animation: fade-in 0.2s ease-in-out;
  }
  
  .animate-slide-up {
    animation: slide-up 0.3s ease-out;
  }
  
  .animate-scale-in {
    animation: scale-in 0.2s ease-out;
  }
`;
