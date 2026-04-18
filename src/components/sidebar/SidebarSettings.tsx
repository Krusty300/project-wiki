'use client';

import { useState } from 'react';
import { 
  Settings, 
  Palette, 
  Layout, 
  SortAsc, 
  Eye, 
  EyeOff, 
  RotateCcw,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useSidebarStore, getSidebarThemeClasses, getLayoutClasses } from '@/store/sidebar-store';
import type { SidebarTheme, SidebarLayout, SortOption } from '@/store/sidebar-store';

interface SidebarSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SidebarSettings({ isOpen, onClose }: SidebarSettingsProps) {
  const [expandedSections, setExpandedSections] = useState<string[]>(['theme', 'layout']);
  
  const {
    sidebarWidth,
    setSidebarWidth,
    sidebarTheme,
    setSidebarTheme,
    sidebarLayout,
    setSidebarLayout,
    sortOption,
    setSortOption,
    sortDirection,
    setSortDirection,
    showNoteCount,
    setShowNoteCount,
    showLastModified,
    setShowLastModified,
    showNotePreview,
    setShowNotePreview,
    autoCollapseFolders,
    setAutoCollapseFolders,
    enableAnimations,
    setEnableAnimations,
    showDragHandles,
    setShowDragHandles,
    resetToDefaults,
  } = useSidebarStore();

  const toggleSection = (section: string) => {
    setExpandedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const themeOptions: { value: SidebarTheme; label: string; description: string }[] = [
    { value: 'default', label: 'Default', description: 'Follows system theme' },
    { value: 'light', label: 'Light', description: 'Always light theme' },
    { value: 'dark', label: 'Dark', description: 'Always dark theme' },
    { value: 'auto', label: 'Auto', description: 'Matches app theme' },
  ];

  const layoutOptions: { value: SidebarLayout; label: string; description: string }[] = [
    { value: 'detailed', label: 'Detailed', description: 'Full information with previews' },
    { value: 'compact', label: 'Compact', description: 'Reduced spacing and text' },
    { value: 'icons-only', label: 'Icons Only', description: 'Minimal display with icons' },
  ];

  const sortOptions: { value: SortOption; label: string; icon: React.ReactNode }[] = [
    { value: 'manual', label: 'Manual', icon: <Settings className="w-4 h-4" /> },
    { value: 'title', label: 'Title', icon: <SortAsc className="w-4 h-4" /> },
    { value: 'date', label: 'Date Modified', icon: <Settings className="w-4 h-4" /> },
  ];

  if (!isOpen) return null;

  return (
    <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            <span className="font-medium">Sidebar Settings</span>
          </div>
          <button
            onClick={resetToDefaults}
            className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            <RotateCcw className="w-3 h-3" />
            Reset
          </button>
        </div>

        {/* Width Setting */}
        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-2">
            <Layout className="w-4 h-4" />
            Width: {sidebarWidth}px
          </label>
          <input
            type="range"
            min="180"
            max="480"
            value={sidebarWidth}
            onChange={(e) => setSidebarWidth(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>180px</span>
            <span>480px</span>
          </div>
        </div>

        {/* Theme Section */}
        <div className="space-y-2">
          <button
            onClick={() => toggleSection('theme')}
            className="flex items-center justify-between w-full text-sm font-medium"
          >
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4" />
              Theme
            </div>
            {expandedSections.includes('theme') ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          
          {expandedSections.includes('theme') && (
            <div className="pl-6 space-y-2">
              {themeOptions.map((option) => (
                <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="theme"
                    value={option.value}
                    checked={sidebarTheme === option.value}
                    onChange={(e) => setSidebarTheme(e.target.value as SidebarTheme)}
                    className="rounded"
                  />
                  <div className="flex-1">
                    <div className="text-sm">{option.label}</div>
                    <div className="text-xs text-gray-500">{option.description}</div>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Layout Section */}
        <div className="space-y-2">
          <button
            onClick={() => toggleSection('layout')}
            className="flex items-center justify-between w-full text-sm font-medium"
          >
            <div className="flex items-center gap-2">
              <Layout className="w-4 h-4" />
              Layout
            </div>
            {expandedSections.includes('layout') ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          
          {expandedSections.includes('layout') && (
            <div className="pl-6 space-y-2">
              {layoutOptions.map((option) => (
                <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="layout"
                    value={option.value}
                    checked={sidebarLayout === option.value}
                    onChange={(e) => setSidebarLayout(e.target.value as SidebarLayout)}
                    className="rounded"
                  />
                  <div className="flex-1">
                    <div className="text-sm">{option.label}</div>
                    <div className="text-xs text-gray-500">{option.description}</div>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Sort Section */}
        <div className="space-y-2">
          <button
            onClick={() => toggleSection('sort')}
            className="flex items-center justify-between w-full text-sm font-medium"
          >
            <div className="flex items-center gap-2">
              <SortAsc className="w-4 h-4" />
              Sorting
            </div>
            {expandedSections.includes('sort') ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          
          {expandedSections.includes('sort') && (
            <div className="pl-6 space-y-2">
              <div className="space-y-2">
                {sortOptions.map((option) => (
                  <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="sort"
                      value={option.value}
                      checked={sortOption === option.value}
                      onChange={(e) => setSortOption(e.target.value as SortOption)}
                      className="rounded"
                    />
                    <div className="flex items-center gap-2">
                      {option.icon}
                      <span className="text-sm">{option.label}</span>
                    </div>
                  </label>
                ))}
              </div>
              
              {sortOption !== 'manual' && (
                <div className="flex items-center gap-2">
                  <label className="text-sm">Direction:</label>
                  <button
                    onClick={() => setSortDirection('asc')}
                    className={`px-2 py-1 text-xs rounded ${
                      sortDirection === 'asc' 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-100 dark:bg-gray-700'
                    }`}
                  >
                    Asc
                  </button>
                  <button
                    onClick={() => setSortDirection('desc')}
                    className={`px-2 py-1 text-xs rounded ${
                      sortDirection === 'desc' 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-100 dark:bg-gray-700'
                    }`}
                  >
                    Desc
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Display Options */}
        <div className="space-y-2">
          <button
            onClick={() => toggleSection('display')}
            className="flex items-center justify-between w-full text-sm font-medium"
          >
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Display Options
            </div>
            {expandedSections.includes('display') ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          
          {expandedSections.includes('display') && (
            <div className="pl-6 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showNoteCount}
                  onChange={(e) => setShowNoteCount(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Show note count</span>
              </label>
              
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showLastModified}
                  onChange={(e) => setShowLastModified(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Show last modified</span>
              </label>
              
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showNotePreview}
                  onChange={(e) => setShowNotePreview(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Show note preview</span>
              </label>
              
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showDragHandles}
                  onChange={(e) => setShowDragHandles(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Always show drag handles</span>
              </label>
              
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableAnimations}
                  onChange={(e) => setEnableAnimations(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Enable animations</span>
              </label>
              
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoCollapseFolders}
                  onChange={(e) => setAutoCollapseFolders(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Auto-collapse folders</span>
              </label>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
