'use client';

import React, { useEffect, useState } from 'react';
import { List, ChevronRight, Hash } from 'lucide-react';

interface OutlineItem {
  id: string;
  text: string;
  level: number;
  element?: HTMLElement;
}

interface DocumentOutlineProps {
  content: any;
  className?: string;
}

export default function DocumentOutline({ content, className = '' }: DocumentOutlineProps) {
  const [outline, setOutline] = useState<OutlineItem[]>([]);
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    if (!content || !content.content) {
      setOutline([]);
      return;
    }

    const headings: OutlineItem[] = [];
    let headingCounter = 0;

    const extractHeadings = (node: any, path: string = '') => {
      if (node.type === 'heading') {
        headingCounter++;
        const text = node.content?.map((t: any) => t.text).join('') || '';
        const id = `heading-${headingCounter}`;
        
        headings.push({
          id,
          text,
          level: node.attrs?.level || 1,
        });
      }

      if (node.content) {
        node.content.forEach((child: any, index: number) => {
          extractHeadings(child, `${path}-${index}`);
        });
      }
    };

    extractHeadings(content);
    setOutline(headings);
  }, [content]);

  useEffect(() => {
    const handleScroll = () => {
      const headingElements = outline.map(item => ({
        ...item,
        element: document.getElementById(item.id)
      })).filter(item => item.element);

      if (headingElements.length === 0) return;

      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      
      // Find the heading that's currently in view
      let activeHeading = headingElements[0];
      for (let i = 1; i < headingElements.length; i++) {
        const element = headingElements[i].element!;
        if (element.offsetTop <= scrollTop + 100) {
          activeHeading = headingElements[i];
        } else {
          break;
        }
      }

      if (activeHeading.id !== activeId) {
        setActiveId(activeHeading.id);
      }
    };

    // Add IDs to heading elements in the preview
    const addIdsToHeadings = () => {
      const previewElement = document.querySelector('[class*="prose"]');
      if (!previewElement) return;

      const headings = previewElement.querySelectorAll('h1, h2, h3, h4, h5, h6');
      headings.forEach((heading, index) => {
        if (!heading.id && outline[index]) {
          heading.id = outline[index].id;
        }
      });
    };

    addIdsToHeadings();
    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial call

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [outline, activeId]);

  const scrollToHeading = (item: OutlineItem) => {
    const element = document.getElementById(item.id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveId(item.id);
    }
  };

  if (outline.length === 0) {
    return (
      <div className={`p-4 text-gray-500 dark:text-gray-400 ${className}`}>
        <div className="flex items-center gap-2 mb-3">
          <Hash className="w-4 h-4" />
          <span className="font-medium">Outline</span>
        </div>
        <p className="text-sm">No headings found</p>
      </div>
    );
  }

  return (
    <div className={`p-4 ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <Hash className="w-4 h-4" />
        <span className="font-medium">Outline</span>
      </div>
      
      <nav className="space-y-1">
        {outline.map((item) => {
          const paddingLeft = (item.level - 1) * 16;
          
          return (
            <button
              key={item.id}
              onClick={() => scrollToHeading(item)}
              className={`w-full text-left px-2 py-1 rounded text-sm transition-colors duration-200 flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-800 ${
                activeId === item.id
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
              style={{ paddingLeft: `${paddingLeft + 8}px` }}
            >
              {item.level > 1 && (
                <ChevronRight className="w-3 h-3 opacity-50" />
              )}
              <span className="truncate">{item.text}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
