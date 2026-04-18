'use client';

import React from 'react';
import { Note } from '@/types';

interface MarkdownRendererProps {
  content: any;
  className?: string;
}

export default function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  const renderNode = (node: any, index: number): React.ReactNode => {
    if (!node) return null;

    switch (node.type) {
      case 'paragraph':
        return (
          <p key={index} className="mb-4 last:mb-0">
            {node.content?.map((child: any, i: number) => renderNode(child, i))}
          </p>
        );

      case 'heading':
        const level = node.attrs?.level || 1;
        const headingClasses: { [key: number]: string } = {
          1: 'text-4xl font-bold mb-4 mt-6',
          2: 'text-3xl font-semibold mb-3 mt-5',
          3: 'text-2xl font-medium mb-2 mt-4',
          4: 'text-xl font-medium mb-2 mt-3',
          5: 'text-lg font-medium mb-1 mt-2',
          6: 'text-base font-medium mb-1 mt-2',
        };
        
        const headingClass = headingClasses[level] || headingClasses[1];
        
        const headingText = node.content?.map((child: any, i: number) => renderNode(child, i)).join('') || '';
        const headingId = `heading-${index}`;
        
        if (level === 1) {
          return (
            <h1 key={index} id={headingId} className={headingClass}>
              {headingText}
            </h1>
          );
        } else if (level === 2) {
          return (
            <h2 key={index} id={headingId} className={headingClass}>
              {headingText}
            </h2>
          );
        } else if (level === 3) {
          return (
            <h3 key={index} id={headingId} className={headingClass}>
              {headingText}
            </h3>
          );
        } else if (level === 4) {
          return (
            <h4 key={index} id={headingId} className={headingClass}>
              {headingText}
            </h4>
          );
        } else if (level === 5) {
          return (
            <h5 key={index} id={headingId} className={headingClass}>
              {headingText}
            </h5>
          );
        } else {
          return (
            <h6 key={index} id={headingId} className={headingClass}>
              {headingText}
            </h6>
          );
        }

      case 'text':
        let text = node.text || '';
        if (node.marks) {
          return (
            <span key={index}>
              {node.marks.reduce((acc: React.ReactNode, mark: any) => {
                if (mark.type === 'bold') {
                  return <strong key={index}>{acc}</strong>;
                }
                if (mark.type === 'italic') {
                  return <em key={index}>{acc}</em>;
                }
                if (mark.type === 'underline') {
                  return <u key={index}>{acc}</u>;
                }
                if (mark.type === 'strike') {
                  return <s key={index}>{acc}</s>;
                }
                if (mark.type === 'code') {
                  return <code key={index} className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm">{acc}</code>;
                }
                if (mark.type === 'highlight') {
                  return <mark key={index}>{acc}</mark>;
                }
                if (mark.type === 'link') {
                  return (
                    <a 
                      key={index}
                      href={mark.attrs?.href}
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {acc}
                    </a>
                  );
                }
                return acc;
              }, text)}
            </span>
          );
        }
        return <span key={index}>{text}</span>;

      case 'bulletList':
        return (
          <ul key={index} className="list-disc list-inside mb-4 space-y-1">
            {node.content?.map((child: any, i: number) => renderNode(child, i))}
          </ul>
        );

      case 'orderedList':
        return (
          <ol key={index} className="list-decimal list-inside mb-4 space-y-1">
            {node.content?.map((child: any, i: number) => renderNode(child, i))}
          </ol>
        );

      case 'listItem':
        return (
          <li key={index} className="mb-1">
            {node.content?.map((child: any, i: number) => renderNode(child, i))}
          </li>
        );

      case 'blockquote':
        return (
          <blockquote key={index} className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 my-4 italic">
            {node.content?.map((child: any, i: number) => renderNode(child, i))}
          </blockquote>
        );

      case 'codeBlock':
        const language = node.attrs?.language || '';
        return (
          <pre key={index} className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 mb-4 overflow-x-auto">
            <code className={`language-${language} text-sm`}>
              {node.content?.map((child: any, i: number) => renderNode(child, i))}
            </code>
          </pre>
        );

      case 'table':
        return (
          <div key={index} className="overflow-x-auto mb-4">
            <table className="min-w-full border-collapse border border-gray-300 dark:border-gray-600">
              <tbody>
                {node.content?.map((child: any, i: number) => renderNode(child, i))}
              </tbody>
            </table>
          </div>
        );

      case 'tableRow':
        return (
          <tr key={index}>
            {node.content?.map((child: any, i: number) => renderNode(child, i))}
          </tr>
        );

      case 'tableCell':
      case 'tableHeader':
        const CellTag = node.type === 'tableHeader' ? 'th' : 'td';
        return (
          <CellTag 
            key={index} 
            className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left"
          >
            {node.content?.map((child: any, i: number) => renderNode(child, i))}
          </CellTag>
        );

      case 'horizontalRule':
        return <hr key={index} className="my-6 border-gray-300 dark:border-gray-600" />;

      case 'hardBreak':
        return <br key={index} />;

      default:
        return (
          <div key={index} className="mb-2">
            {node.content?.map((child: any, i: number) => renderNode(child, i))}
          </div>
        );
    }
  };

  if (!content || !content.content) {
    return (
      <div className={`p-6 text-gray-500 dark:text-gray-400 ${className}`}>
        No content to preview
      </div>
    );
  }

  return (
    <div className={`prose prose-lg dark:prose-invert max-w-none p-6 ${className}`}>
      {content.content.map((node: any, index: number) => renderNode(node, index))}
    </div>
  );
}
