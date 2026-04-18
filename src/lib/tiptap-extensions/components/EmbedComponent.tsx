'use client';

import React, { useState, useRef } from 'react';
import { NodeViewContent, NodeViewProps, NodeViewWrapper } from '@tiptap/react';
import { 
  ExternalLink, 
  Settings, 
  Trash2, 
  Edit3,
  Maximize2,
  Minimize2,
  RefreshCw
} from 'lucide-react';

const EmbedComponent = ({ node, editor, updateAttributes, deleteNode }: NodeViewProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [url, setUrl] = useState(node.attrs.url || '');
  const [caption, setCaption] = useState(node.attrs.caption || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const urlInputRef = useRef<HTMLInputElement>(null);
  const { embedData, width, height, type } = node.attrs;

  const handleUrlChange = (newUrl: string) => {
    setUrl(newUrl);
    setError(null);
    
    if (newUrl && isValidUrl(newUrl)) {
      setIsLoading(true);
      
      // Simulate embed parsing (in real app, this would call an API)
      setTimeout(() => {
        const parsedEmbed = parseEmbedUrl(newUrl);
        if (parsedEmbed) {
          updateAttributes({ 
            url: newUrl, 
            embedData: parsedEmbed,
            type: parsedEmbed.type,
            width: parsedEmbed.width,
            height: parsedEmbed.height
          });
        } else {
          setError('Unable to embed this URL');
        }
        setIsLoading(false);
      }, 500);
    } else if (!newUrl) {
      updateAttributes({ url: '', embedData: null });
    }
  };

  const handleCaptionChange = (newCaption: string) => {
    setCaption(newCaption);
    updateAttributes({ caption: newCaption });
  };

  const handleSizeChange = (newWidth: number, newHeight: number) => {
    updateAttributes({ width: newWidth, height: newHeight });
    if (embedData) {
      updateAttributes({ 
        embedData: { ...embedData, width: newWidth, height: newHeight }
      });
    }
  };

  const handleRefresh = () => {
    if (url) {
      handleUrlChange(url);
    }
  };

  const handleOpenExternal = () => {
    if (url) {
      window.open(url, '_blank');
    }
  };

  const isValidUrl = (urlString: string): boolean => {
    try {
      new URL(urlString);
      return true;
    } catch {
      return false;
    }
  };

  const parseEmbedUrl = (urlString: string) => {
    // YouTube
    const youtubeMatch = urlString.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/);
    if (youtubeMatch) {
      return {
        type: 'youtube' as const,
        url: urlString,
        embedId: youtubeMatch[1],
        width: 640,
        height: 360,
      };
    }

    // Vimeo
    const vimeoMatch = urlString.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) {
      return {
        type: 'vimeo' as const,
        url: urlString,
        embedId: vimeoMatch[1],
        width: 640,
        height: 360,
      };
    }

    // Generic iframe fallback
    return {
      type: 'iframe' as const,
      url: urlString,
      width: 640,
      height: 360,
    };
  };

  const renderEmbedContent = () => {
    if (isLoading) {
      return (
        <div className="embed-loading">
          <RefreshCw className="animate-spin" size={24} />
          <span>Loading embed...</span>
        </div>
      );
    }

    if (error) {
      return (
        <div className="embed-error">
          <span>{error}</span>
          <button onClick={handleRefresh} className="retry-btn">
            <RefreshCw size={16} />
            Retry
          </button>
        </div>
      );
    }

    if (!embedData || !embedData.url) {
      return (
        <div className="embed-placeholder">
          <div className="placeholder-content">
            <ExternalLink size={48} />
            <h3>No URL provided</h3>
            <p>Enter a URL to embed content</p>
          </div>
        </div>
      );
    }

    return (
      <div className="embed-content">
        {embedData.type === 'youtube' && (
          <iframe
            src={`https://www.youtube.com/embed/${embedData.embedId}`}
            width={embedData.width}
            height={embedData.height}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        )}
        {embedData.type === 'vimeo' && (
          <iframe
            src={`https://player.vimeo.com/video/${embedData.embedId}`}
            width={embedData.width}
            height={embedData.height}
            frameBorder="0"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
          />
        )}
        {embedData.type === 'iframe' && (
          <iframe
            src={embedData.url}
            width={embedData.width}
            height={embedData.height}
            frameBorder="0"
          />
        )}
      </div>
    );
  };

  return (
    <NodeViewWrapper className="embed-support-wrapper">
      <div 
        className={`embed-support embed-type-${type || 'iframe'}`}
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => setShowControls(false)}
        style={{ maxWidth: '100%' }}
      >
        {/* URL Input */}
        {isEditing ? (
          <div className="embed-url-editor">
            <input
              ref={urlInputRef}
              type="url"
              value={url}
              onChange={(e) => handleUrlChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setIsEditing(false);
                } else if (e.key === 'Escape') {
                  setIsEditing(false);
                  setUrl(node.attrs.url || '');
                }
              }}
              onBlur={() => setIsEditing(false)}
              placeholder="Enter URL to embed..."
              className="url-input"
              autoFocus
            />
            <button
              onClick={() => setIsEditing(false)}
              className="cancel-btn"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="embed-url-display">
            <div className="url-info">
              <ExternalLink size={16} />
              <span className="url-text">
                {embedData ? embedData.url : 'No URL'}
              </span>
            </div>
            <button
              onClick={() => {
                setIsEditing(true);
                setTimeout(() => urlInputRef.current?.focus(), 0);
              }}
              className="edit-btn"
              title="Edit URL"
            >
              <Edit3 size={14} />
            </button>
          </div>
        )}

        {/* Embed Content */}
        <div className="embed-container" style={{ width: width || 640 }}>
          {renderEmbedContent()}
        </div>

        {/* Caption */}
        {caption && (
          <div className="embed-caption">
            {isEditing ? (
              <textarea
                value={caption}
                onChange={(e) => handleCaptionChange(e.target.value)}
                onBlur={() => setIsEditing(false)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setIsEditing(false);
                    setCaption(node.attrs.caption || '');
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

        {/* Controls */}
        {showControls && (
          <div className="embed-controls">
            <div className="control-group">
              <span className="control-label">Size:</span>
              <div className="size-buttons">
                <button
                  onClick={() => handleSizeChange(640, 360)}
                  className={`control-btn ${width === 640 ? 'active' : ''}`}
                  title="Default size"
                >
                  <Maximize2 size={14} />
                </button>
                <button
                  onClick={() => handleSizeChange(320, 180)}
                  className={`control-btn ${width === 320 ? 'active' : ''}`}
                  title="Small size"
                >
                  <Minimize2 size={14} />
                </button>
              </div>
            </div>

            <div className="control-group">
              <span className="control-label">Actions:</span>
              <div className="action-buttons">
                <button
                  onClick={handleRefresh}
                  className="control-btn"
                  title="Refresh embed"
                >
                  <RefreshCw size={14} />
                </button>
                <button
                  onClick={handleOpenExternal}
                  className="control-btn"
                  title="Open in new tab"
                >
                  <ExternalLink size={14} />
                </button>
                <button
                  onClick={() => setIsEditing(true)}
                  className="control-btn"
                  title="Edit URL"
                >
                  <Settings size={14} />
                </button>
                <button
                  onClick={deleteNode}
                  className="control-btn danger"
                  title="Remove embed"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
};

export default EmbedComponent;
