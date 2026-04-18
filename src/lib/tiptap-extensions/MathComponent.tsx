'use client';

import React from 'react';
import { NodeViewWrapper } from '@tiptap/react';

interface MathComponentProps {
  node: any;
  updateAttributes: (attributes: any) => void;
}

export default function MathComponent({ node, updateAttributes }: MathComponentProps) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [mathText, setMathText] = React.useState(node.attrs?.math || '');

  const handleDoubleClick = () => {
    setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (mathText !== node.attrs.math) {
      updateAttributes({ math: mathText });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      setIsEditing(false);
      if (mathText !== node.attrs.math) {
        updateAttributes({ math: mathText });
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <NodeViewWrapper className="math-node-editing">
        <input
          type="text"
          value={mathText}
          onChange={(e) => setMathText(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          onDoubleClick={handleDoubleClick}
          className="px-2 py-1 border border-blue-300 rounded text-sm font-mono bg-white dark:bg-gray-800 dark:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter LaTeX math..."
          autoFocus
        />
      </NodeViewWrapper>
    );
  }

  return (
    <NodeViewWrapper className="math-node">
      <span
        onDoubleClick={handleDoubleClick}
        className="px-1 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded font-mono text-sm cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
        title="Double-click to edit math"
      >
        {node.attrs?.math || '$x^2 + y^2 = z^2$'}
      </span>
    </NodeViewWrapper>
  );
}
