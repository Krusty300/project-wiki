'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown, ChevronRight, Folder, Tag, Clock, Plus } from 'lucide-react';

interface CollapsibleSectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  className?: string;
  onToggle?: (expanded: boolean) => void;
  showAddButton?: boolean;
  onAdd?: () => void;
  badge?: string | number;
  badgeColor?: string;
}

export default function CollapsibleSection({
  title,
  icon,
  children,
  defaultExpanded = true,
  className = '',
  onToggle,
  showAddButton = false,
  onAdd,
  badge,
  badgeColor = 'bg-blue-500',
}: CollapsibleSectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState<number | null>(null);

  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }
  }, [children]);

  useEffect(() => {
    if (expanded && contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }
  }, [expanded]);

  const handleToggle = () => {
    const newExpanded = !expanded;
    setExpanded(newExpanded);
    onToggle?.(newExpanded);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleToggle();
    }
  };

  return (
    <div className={`border-b border-gray-200 ${className}`}>
      {/* Section Header */}
      <div
        className={`
          flex items-center justify-between px-3 py-2 cursor-pointer
          hover:bg-gray-50 transition-colors duration-200
          group
        `}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        role="button"
        aria-expanded={expanded}
        aria-controls={`section-${title.replace(/\s+/g, '-').toLowerCase()}`}
        tabIndex={0}
      >
        <div className="flex items-center space-x-2">
          {/* Chevron Icon */}
          <div
            className={`
              transition-transform duration-200 ease-in-out
              ${expanded ? 'rotate-90' : ''}
            `}
          >
            <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-gray-700" />
          </div>

          {/* Section Icon */}
          <div className="text-gray-500 group-hover:text-gray-700 transition-colors">
            {icon}
          </div>

          {/* Title */}
          <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">
            {title}
          </span>

          {/* Badge */}
          {badge && (
            <span
              className={`
                px-2 py-0.5 text-xs rounded-full text-white
                ${badgeColor}
              `}
            >
              {badge}
            </span>
          )}
        </div>

        {/* Add Button */}
        {showAddButton && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAdd?.();
            }}
            className="
              opacity-0 group-hover:opacity-100 transition-opacity duration-200
              p-1 hover:bg-gray-200 rounded
            "
            aria-label={`Add ${title}`}
          >
            <Plus className="w-4 h-4 text-gray-500 hover:text-gray-700" />
          </button>
        )}
      </div>

      {/* Collapsible Content */}
      <div
        ref={contentRef}
        className={`
          overflow-hidden transition-all duration-300 ease-in-out
          ${expanded ? 'opacity-100' : 'opacity-0'}
        `}
        style={{
          maxHeight: expanded && contentHeight ? contentHeight : 0,
        }}
        id={`section-${title.replace(/\s+/g, '-').toLowerCase()}`}
      >
        <div className="pb-2">
          {children}
        </div>
      </div>
    </div>
  );
}

// Predefined section components
export function FoldersSection(props: Omit<CollapsibleSectionProps, 'icon'>) {
  return (
    <CollapsibleSection
      {...props}
      icon={<Folder className="w-4 h-4" />}
    />
  );
}

export function TagsSection(props: Omit<CollapsibleSectionProps, 'icon'>) {
  return (
    <CollapsibleSection
      {...props}
      icon={<Tag className="w-4 h-4" />}
    />
  );
}

export function RecentNotesSection(props: Omit<CollapsibleSectionProps, 'icon'>) {
  return (
    <CollapsibleSection
      {...props}
      icon={<Clock className="w-4 h-4" />}
    />
  );
}

// Hook for managing collapsible sections
export function useCollapsibleSections() {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['folders', 'tags']));

  const toggleSection = useCallback((sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  }, []);

  const expandSection = useCallback((sectionId: string) => {
    setExpandedSections(prev => new Set([...prev, sectionId]));
  }, []);

  const collapseSection = useCallback((sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      newSet.delete(sectionId);
      return newSet;
    });
  }, []);

  const isExpanded = useCallback((sectionId: string) => {
    return expandedSections.has(sectionId);
  }, [expandedSections]);

  const expandAll = useCallback(() => {
    setExpandedSections(new Set(['folders', 'tags', 'recent']));
  }, []);

  const collapseAll = useCallback(() => {
    setExpandedSections(new Set());
  }, []);

  return {
    expandedSections,
    toggleSection,
    expandSection,
    collapseSection,
    isExpanded,
    expandAll,
    collapseAll,
  };
}

// Enhanced sidebar container with collapsible sections
export function EnhancedSidebarContainer({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { expandAll, collapseAll, expandedSections } = useCollapsibleSections();

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Section Controls */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 bg-gray-50">
        <span className="text-xs font-medium text-gray-600 uppercase tracking-wider">
          Navigation
        </span>
        <div className="flex space-x-1">
          <button
            onClick={expandAll}
            className="px-2 py-1 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors"
            title="Expand all sections"
          >
            Expand All
          </button>
          <button
            onClick={collapseAll}
            className="px-2 py-1 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors"
            title="Collapse all sections"
          >
            Collapse All
          </button>
        </div>
      </div>

      {/* Sections Container */}
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
}
