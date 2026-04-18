'use client';

import React, { useState, useRef } from 'react';
import { NodeViewContent, NodeViewProps, NodeViewWrapper } from '@tiptap/react';
import { ChevronLeft, ChevronRight, Quote, User } from 'lucide-react';

const PullQuoteComponent = ({ node, editor, updateAttributes }: NodeViewProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [citation, setCitation] = useState(node.attrs.citation || '');
  const citationInputRef = useRef<HTMLInputElement>(null);

  const handleAlignmentChange = (alignment: 'left' | 'right' | 'center') => {
    updateAttributes({ alignment });
  };

  const handleCitationChange = (value: string) => {
    setCitation(value);
    updateAttributes({ citation: value });
  };

  const startEditingCitation = () => {
    setIsEditing(true);
    setTimeout(() => citationInputRef.current?.focus(), 0);
  };

  const finishEditingCitation = () => {
    setIsEditing(false);
  };

  const handleCitationKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      finishEditingCitation();
    } else if (e.key === 'Escape') {
      setCitation(node.attrs.citation || '');
      finishEditingCitation();
    }
  };

  return (
    <NodeViewWrapper className="pull-quote-wrapper">
      <div className={`pull-quote pull-quote-${node.attrs.alignment || 'left'}`}>
        <div className="pull-quote-content">
          <NodeViewContent className="pull-quote-text" />
          
          {/* Citation */}
          <div className="pull-quote-citation">
            {isEditing ? (
              <div className="citation-editor">
                <input
                  ref={citationInputRef}
                  type="text"
                  value={citation}
                  onChange={(e) => handleCitationChange(e.target.value)}
                  onKeyDown={handleCitationKeyDown}
                  onBlur={finishEditingCitation}
                  placeholder="Add citation..."
                  className="citation-input"
                />
              </div>
            ) : (
              <div 
                className="citation-display"
                onClick={startEditingCitation}
                title="Click to edit citation"
              >
                {citation ? (
                  <span className="citation-text">
                    <User className="citation-icon" size={12} />
                    {citation}
                  </span>
                ) : (
                  <span className="citation-placeholder">
                    <User className="citation-icon" size={12} />
                    Click to add citation
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Alignment Controls */}
        <div className="pull-quote-controls">
          <div className="alignment-buttons">
            <button
              onClick={() => handleAlignmentChange('left')}
              className={`alignment-btn ${node.attrs.alignment === 'left' ? 'active' : ''}`}
              title="Align left"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => handleAlignmentChange('center')}
              className={`alignment-btn ${node.attrs.alignment === 'center' ? 'active' : ''}`}
              title="Align center"
            >
              <Quote size={16} />
            </button>
            <button
              onClick={() => handleAlignmentChange('right')}
              className={`alignment-btn ${node.attrs.alignment === 'right' ? 'active' : ''}`}
              title="Align right"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </NodeViewWrapper>
  );
};

export default PullQuoteComponent;
