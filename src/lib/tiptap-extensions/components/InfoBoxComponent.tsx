'use client';

import React, { useState, useRef } from 'react';
import { NodeViewContent, NodeViewProps, NodeViewWrapper } from '@tiptap/react';
import { 
  ChevronDown, 
  ChevronRight, 
  Info, 
  Settings, 
  HelpCircle, 
  BookOpen, 
  Zap,
  X,
  Edit2
} from 'lucide-react';

const iconMap = {
  default: Info,
  settings: Settings,
  help: HelpCircle,
  reference: BookOpen,
  tip: Zap,
};

const defaultTitles = {
  default: 'Information',
  settings: 'Settings',
  help: 'Help',
  reference: 'Reference',
  tip: 'Quick Tip',
};

const InfoBoxComponent = ({ node, editor, updateAttributes, deleteNode }: NodeViewProps) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState(node.attrs.title || defaultTitles[node.attrs.variant as keyof typeof defaultTitles] || '');
  const titleInputRef = useRef<HTMLInputElement>(null);

  const isCollapsible = node.attrs.collapsible || false;
  const isCollapsed = node.attrs.collapsed || false;
  const variant = node.attrs.variant || 'default';

  const handleVariantChange = (newVariant: string) => {
    updateAttributes({ 
      variant: newVariant,
      title: title || defaultTitles[newVariant as keyof typeof defaultTitles] || ''
    });
  };

  const handleTitleChange = (value: string) => {
    setTitle(value);
    updateAttributes({ title: value });
  };

  const toggleCollapse = () => {
    if (isCollapsible) {
      updateAttributes({ collapsed: !isCollapsed });
    }
  };

  const makeCollapsible = () => {
    updateAttributes({ collapsible: true, collapsed: false });
  };

  const makeNonCollapsible = () => {
    updateAttributes({ collapsible: false, collapsed: false });
  };

  const startEditingTitle = () => {
    setIsEditingTitle(true);
    setTimeout(() => titleInputRef.current?.focus(), 0);
  };

  const finishEditingTitle = () => {
    setIsEditingTitle(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      finishEditingTitle();
    } else if (e.key === 'Escape') {
      setTitle(node.attrs.title || '');
      finishEditingTitle();
    }
  };

  const Icon = iconMap[variant as keyof typeof iconMap] || Info;

  return (
    <NodeViewWrapper className="info-box-wrapper">
      <div className={`info-box info-box-${variant} ${isCollapsible ? 'info-box-collapsible' : ''} ${isCollapsed ? 'info-box-collapsed' : ''}`}>
        <div className="info-box-header">
          <div className="info-box-header-left">
            {/* Collapse Toggle */}
            {isCollapsible && (
              <button
                onClick={toggleCollapse}
                className="collapse-toggle"
                title={isCollapsed ? 'Expand' : 'Collapse'}
              >
                {isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
              </button>
            )}

            {/* Icon */}
            <div className="info-box-icon">
              <Icon size={18} />
            </div>
            
            {/* Title */}
            <div className="info-box-title">
              {isEditingTitle ? (
                <input
                  ref={titleInputRef}
                  type="text"
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  onKeyDown={handleTitleKeyDown}
                  onBlur={finishEditingTitle}
                  placeholder="Enter title..."
                  className="info-box-title-input"
                />
              ) : (
                <div 
                  className="info-box-title-text"
                  onClick={startEditingTitle}
                  title="Click to edit title"
                >
                  {title || defaultTitles[variant as keyof typeof defaultTitles] || 'Info Box'}
                  <Edit2 size={14} className="edit-icon" />
                </div>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="info-box-controls">
            {/* Variant Selector */}
            <div className="variant-selector">
              <button
                onClick={() => handleVariantChange('default')}
                className={`variant-btn ${variant === 'default' ? 'active' : ''}`}
                title="Default"
              >
                <Info size={16} />
              </button>
              <button
                onClick={() => handleVariantChange('settings')}
                className={`variant-btn ${variant === 'settings' ? 'active' : ''}`}
                title="Settings"
              >
                <Settings size={16} />
              </button>
              <button
                onClick={() => handleVariantChange('help')}
                className={`variant-btn ${variant === 'help' ? 'active' : ''}`}
                title="Help"
              >
                <HelpCircle size={16} />
              </button>
              <button
                onClick={() => handleVariantChange('reference')}
                className={`variant-btn ${variant === 'reference' ? 'active' : ''}`}
                title="Reference"
              >
                <BookOpen size={16} />
              </button>
              <button
                onClick={() => handleVariantChange('tip')}
                className={`variant-btn ${variant === 'tip' ? 'active' : ''}`}
                title="Tip"
              >
                <Zap size={16} />
              </button>
            </div>

            {/* Collapsible Toggle */}
            <div className="collapsible-controls">
              {!isCollapsible ? (
                <button
                  onClick={makeCollapsible}
                  className="collapsible-btn"
                  title="Make collapsible"
                >
                  <ChevronDown size={16} />
                </button>
              ) : (
                <button
                  onClick={makeNonCollapsible}
                  className="collapsible-btn active"
                  title="Remove collapsible"
                >
                  <ChevronDown size={16} />
                </button>
              )}
            </div>

            {/* Delete Button */}
            <button
              onClick={() => deleteNode()}
              className="delete-btn"
              title="Remove info box"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="info-box-content" style={{ display: isCollapsed ? 'none' : 'block' }}>
          <NodeViewContent className="info-box-text" />
        </div>

        {/* Collapsed Indicator */}
        {isCollapsed && (
          <div className="info-box-collapsed-indicator">
            <span className="collapsed-text">Content hidden</span>
            <button onClick={toggleCollapse} className="expand-btn">
              Expand
            </button>
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
};

export default InfoBoxComponent;
