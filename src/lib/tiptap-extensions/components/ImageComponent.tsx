'use client';

import React, { useState, useRef, useCallback } from 'react';
import { NodeViewContent, NodeViewProps, NodeViewWrapper } from '@tiptap/react';
import { 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  Maximize2, 
  Minimize2, 
  Trash2, 
  Edit3,
  Image as ImageIcon,
  Download,
  Eye,
  Settings
} from 'lucide-react';

const ImageComponent = ({ node, editor, updateAttributes, deleteNode }: NodeViewProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ width: 0, height: 0, x: 0, y: 0 });
  
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { src, alt, title, width, height, alignment, caption, borderRadius, opacity } = node.attrs;

  const handleAlignmentChange = (newAlignment: 'left' | 'center' | 'right') => {
    updateAttributes({ alignment: newAlignment });
  };

  const handleSizeChange = (newWidth?: number, newHeight?: number) => {
    updateAttributes({ width: newWidth, height: newHeight });
  };

  const handleCaptionChange = (newCaption: string) => {
    updateAttributes({ caption: newCaption });
  };

  const handleStyleChange = (styles: { borderRadius?: number; opacity?: number }) => {
    updateAttributes({ 
      borderRadius: styles.borderRadius ?? borderRadius,
      opacity: styles.opacity ?? opacity 
    });
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const newSrc = e.target?.result as string;
        updateAttributes({ 
          src: newSrc, 
          alt: file.name,
          title: file.name 
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.shiftKey) {
      // Start dragging
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
      e.preventDefault();
    }
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging && containerRef.current) {
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;
      
      containerRef.current.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
    }
    
    if (isResizing && imageRef.current) {
      const deltaX = e.clientX - resizeStart.x;
      const deltaY = e.clientY - resizeStart.y;
      
      const newWidth = Math.max(50, resizeStart.width + deltaX);
      const newHeight = Math.max(50, resizeStart.height + deltaY);
      
      handleSizeChange(newWidth, newHeight);
    }
  }, [isDragging, isResizing, dragStart, resizeStart]);

  const handleMouseUp = useCallback(() => {
    if (isDragging && containerRef.current) {
      // Apply the transform as position change
      const transform = containerRef.current.style.transform;
      const match = transform.match(/translate\(([-\d.]+)px,\s*([-\d.]+)px\)/);
      
      if (match) {
        const deltaX = parseFloat(match[1]);
        const deltaY = parseFloat(match[2]);
        
        // Reset transform
        containerRef.current.style.transform = '';
        
        // Update position (this would need position attributes in the schema)
        // For now, just reset the transform
      }
    }
    
    setIsDragging(false);
    setIsResizing(false);
  }, [isDragging]);

  const handleResizeStart = (e: React.MouseEvent, corner: string) => {
    e.preventDefault();
    setIsResizing(true);
    setResizeStart({ 
      width: width || imageRef.current?.naturalWidth || 300, 
      height: height || imageRef.current?.naturalHeight || 200,
      x: e.clientX,
      y: e.clientY 
    });
  };

  const handleResetSize = () => {
    if (imageRef.current) {
      handleSizeChange(imageRef.current.naturalWidth, imageRef.current.naturalHeight);
    }
  };

  const handleFitToContainer = () => {
    if (containerRef.current && imageRef.current) {
      const containerWidth = containerRef.current.clientWidth;
      const aspectRatio = imageRef.current.naturalWidth / imageRef.current.naturalHeight;
      const newWidth = containerWidth;
      const newHeight = containerWidth / aspectRatio;
      handleSizeChange(newWidth, newHeight);
    }
  };

  const handleDownload = () => {
    if (src) {
      const link = document.createElement('a');
      link.href = src;
      link.download = alt || title || 'image';
      link.click();
    }
  };

  const handlePreview = () => {
    if (src) {
      window.open(src, '_blank');
    }
  };

  // Add global mouse event listeners
  React.useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

  return (
    <NodeViewWrapper className="image-handler-wrapper">
      <div 
        ref={containerRef}
        className={`image-handler image-handler-${alignment || 'left'}`}
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => setShowControls(false)}
        onMouseDown={handleMouseDown}
        style={{ 
          cursor: isDragging ? 'grabbing' : 'grab',
          width: width ? `${width}px` : 'auto',
          height: height ? `${height}px` : 'auto',
          borderRadius: `${borderRadius}px`,
          opacity: opacity / 100,
        }}
      >
        {/* Image */}
        <img
          ref={imageRef}
          src={src}
          alt={alt || ''}
          title={title || ''}
          className="image-content"
          style={{ 
            maxWidth: '100%', 
            height: 'auto',
            display: 'block',
          }}
          draggable={false}
        />

        {/* Caption */}
        {caption && (
          <div className="image-caption">
            {isEditing ? (
              <textarea
                value={caption}
                onChange={(e) => handleCaptionChange(e.target.value)}
                onBlur={() => setIsEditing(false)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setIsEditing(false);
                  }
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    setIsEditing(false);
                  }
                }}
                className="caption-editor"
                placeholder="Add a caption..."
                rows={2}
              />
            ) : (
              <div 
                className="caption-display"
                onClick={() => setIsEditing(true)}
                title="Click to edit caption"
              >
                {caption}
                <Edit3 size={12} className="edit-icon" />
              </div>
            )}
          </div>
        )}

        {/* Resize Handles */}
        {showControls && (
          <>
            <div 
              className="resize-handle resize-handle-se"
              onMouseDown={(e) => handleResizeStart(e, 'se')}
              title="Resize"
            />
            <div 
              className="resize-handle resize-handle-e"
              onMouseDown={(e) => handleResizeStart(e, 'e')}
              title="Resize width"
            />
            <div 
              className="resize-handle resize-handle-s"
              onMouseDown={(e) => handleResizeStart(e, 's')}
              title="Resize height"
            />
          </>
        )}

        {/* Controls */}
        {showControls && (
          <div className="image-controls">
            <div className="control-group">
              <span className="control-label">Align:</span>
              <div className="alignment-buttons">
                <button
                  onClick={() => handleAlignmentChange('left')}
                  className={`control-btn ${alignment === 'left' ? 'active' : ''}`}
                  title="Align left"
                >
                  <AlignLeft size={14} />
                </button>
                <button
                  onClick={() => handleAlignmentChange('center')}
                  className={`control-btn ${alignment === 'center' ? 'active' : ''}`}
                  title="Align center"
                >
                  <AlignCenter size={14} />
                </button>
                <button
                  onClick={() => handleAlignmentChange('right')}
                  className={`control-btn ${alignment === 'right' ? 'active' : ''}`}
                  title="Align right"
                >
                  <AlignRight size={14} />
                </button>
              </div>
            </div>

            <div className="control-group">
              <span className="control-label">Size:</span>
              <div className="size-buttons">
                <button
                  onClick={handleResetSize}
                  className="control-btn"
                  title="Reset to original size"
                >
                  <Maximize2 size={14} />
                </button>
                <button
                  onClick={handleFitToContainer}
                  className="control-btn"
                  title="Fit to container"
                >
                  <Minimize2 size={14} />
                </button>
              </div>
            </div>

            <div className="control-group">
              <span className="control-label">Style:</span>
              <div className="style-buttons">
                <button
                  onClick={() => handleStyleChange({ borderRadius: Math.max(0, (borderRadius || 0) - 4) })}
                  className="control-btn"
                  title="Decrease border radius"
                >
                  <Minimize2 size={14} />
                </button>
                <button
                  onClick={() => handleStyleChange({ borderRadius: (borderRadius || 0) + 4 })}
                  className="control-btn"
                  title="Increase border radius"
                >
                  <Maximize2 size={14} />
                </button>
                <button
                  onClick={() => handleStyleChange({ opacity: Math.max(0, (opacity || 100) - 10) })}
                  className="control-btn"
                  title="Decrease opacity"
                >
                  <Eye size={14} />
                </button>
                <button
                  onClick={() => handleStyleChange({ opacity: Math.min(100, (opacity || 100) + 10) })}
                  className="control-btn"
                  title="Increase opacity"
                >
                  <Eye size={14} />
                </button>
              </div>
            </div>

            <div className="control-group">
              <span className="control-label">Actions:</span>
              <div className="action-buttons">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="control-btn"
                  title="Replace image"
                >
                  <ImageIcon size={14} />
                </button>
                <button
                  onClick={handleDownload}
                  className="control-btn"
                  title="Download image"
                >
                  <Download size={14} />
                </button>
                <button
                  onClick={handlePreview}
                  className="control-btn"
                  title="Preview in new tab"
                >
                  <Eye size={14} />
                </button>
                <button
                  onClick={deleteNode}
                  className="control-btn danger"
                  title="Delete image"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          style={{ display: 'none' }}
        />

        {/* Drag indicator */}
        {isDragging && (
          <div className="drag-indicator">
            <span>Dragging... (Shift+Click to drag)</span>
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
};

export default ImageComponent;
