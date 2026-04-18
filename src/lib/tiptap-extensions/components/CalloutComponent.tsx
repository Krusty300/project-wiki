'use client';

import React, { useState, useRef } from 'react';
import { NodeViewContent, NodeViewProps, NodeViewWrapper } from '@tiptap/react';
import { 
  Info, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Lightbulb, 
  AlertCircle,
  X,
  Edit2
} from 'lucide-react';

const iconMap = {
  info: Info,
  warning: AlertTriangle,
  success: CheckCircle,
  error: XCircle,
  tip: Lightbulb,
  note: AlertCircle,
};

const defaultTitles = {
  info: 'Information',
  warning: 'Warning',
  success: 'Success',
  error: 'Error',
  tip: 'Tip',
  note: 'Note',
};

const CalloutComponent = ({ node, editor, updateAttributes, deleteNode }: NodeViewProps) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState(node.attrs.title || defaultTitles[node.attrs.type as keyof typeof defaultTitles] || '');
  const titleInputRef = useRef<HTMLInputElement>(null);

  const handleTypeChange = (type: string) => {
    updateAttributes({ 
      type,
      title: title || defaultTitles[type as keyof typeof defaultTitles] || ''
    });
  };

  const handleTitleChange = (value: string) => {
    setTitle(value);
    updateAttributes({ title: value });
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

  const Icon = iconMap[node.attrs.type as keyof typeof iconMap] || Info;

  return (
    <NodeViewWrapper className="callout-wrapper">
      <div className={`callout callout-${node.attrs.type || 'info'}`}>
        <div className="callout-header">
          <div className="callout-icon">
            <Icon size={20} />
          </div>
          
          {/* Title */}
          <div className="callout-title">
            {isEditingTitle ? (
              <input
                ref={titleInputRef}
                type="text"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                onKeyDown={handleTitleKeyDown}
                onBlur={finishEditingTitle}
                placeholder="Enter title..."
                className="callout-title-input"
              />
            ) : (
              <div 
                className="callout-title-text"
                onClick={startEditingTitle}
                title="Click to edit title"
              >
                {title || defaultTitles[node.attrs.type as keyof typeof defaultTitles] || 'Callout'}
                <Edit2 size={14} className="edit-icon" />
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="callout-controls">
            {/* Type Selector */}
            <div className="type-selector">
              <button
                onClick={() => handleTypeChange('info')}
                className={`type-btn ${node.attrs.type === 'info' ? 'active' : ''}`}
                title="Info"
              >
                <Info size={16} />
              </button>
              <button
                onClick={() => handleTypeChange('warning')}
                className={`type-btn ${node.attrs.type === 'warning' ? 'active' : ''}`}
                title="Warning"
              >
                <AlertTriangle size={16} />
              </button>
              <button
                onClick={() => handleTypeChange('success')}
                className={`type-btn ${node.attrs.type === 'success' ? 'active' : ''}`}
                title="Success"
              >
                <CheckCircle size={16} />
              </button>
              <button
                onClick={() => handleTypeChange('error')}
                className={`type-btn ${node.attrs.type === 'error' ? 'active' : ''}`}
                title="Error"
              >
                <XCircle size={16} />
              </button>
              <button
                onClick={() => handleTypeChange('tip')}
                className={`type-btn ${node.attrs.type === 'tip' ? 'active' : ''}`}
                title="Tip"
              >
                <Lightbulb size={16} />
              </button>
            </div>

            {/* Delete Button */}
            <button
              onClick={() => deleteNode()}
              className="delete-btn"
              title="Remove callout"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="callout-content">
          <NodeViewContent className="callout-text" />
        </div>
      </div>
    </NodeViewWrapper>
  );
};

export default CalloutComponent;
