'use client';

import React, { useState } from 'react';
import { NodeViewWrapper } from '@tiptap/react';
import { Copy, Check, ChevronDown } from 'lucide-react';

interface CodeBlockComponentProps {
  node: any;
  updateAttributes: (attributes: any) => void;
}

const LANGUAGES = [
  'javascript', 'typescript', 'python', 'java', 'cpp', 'c', 'html', 'css', 
  'sql', 'bash', 'powershell', 'json', 'xml', 'yaml', 'markdown', 'latex'
];

export default function CodeBlockComponent({ node, updateAttributes }: CodeBlockComponentProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [language, setLanguage] = useState(node.attrs?.language || 'text');
  const [code, setCode] = useState(node.attrs?.code || '');

  const handleDoubleClick = () => {
    setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);
    updateAttributes({ language, code });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      setIsEditing(false);
      updateAttributes({ language, code });
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsEditing(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
  };

  if (isEditing) {
    return (
      <NodeViewWrapper className="code-block-editing">
        <div className="flex flex-col gap-2">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {LANGUAGES.map(lang => (
              <option key={lang} value={lang}>{lang}</option>
            ))}
          </select>
          
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter code..."
            rows={6}
            autoFocus
          />
        </div>
      </NodeViewWrapper>
    );
  }

  return (
    <NodeViewWrapper className="code-block">
      <div className="relative group">
        {/* Header with language and copy button */}
        <div className="flex items-center justify-between px-3 py-2 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {language}
            </span>
            <button
              onClick={handleCopy}
              className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              title="Copy code"
            >
              <Copy className="w-3 h-3" />
            </button>
          </div>
          
          <button
            onDoubleClick={handleDoubleClick}
            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            title="Double-click to edit"
          >
            <Check className="w-3 h-3" />
          </button>
        </div>

        {/* Code content */}
        <pre className={`language-${language} bg-gray-50 dark:bg-gray-900 p-4 rounded-lg overflow-x-auto`}>
          <code className="text-sm">{code}</code>
        </pre>
      </div>
    </NodeViewWrapper>
  );
}
