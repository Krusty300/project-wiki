'use client';

import React from 'react';
import { Link, FileText, Clock } from 'lucide-react';
import { useBacklinks } from '@/hooks/useNoteLinks';
import { Note } from '@/types';

interface BacklinksPanelProps {
  noteId: string;
  className?: string;
}

export default function BacklinksPanel({ noteId, className = '' }: BacklinksPanelProps) {
  const backlinks = useBacklinks(noteId);

  if (backlinks.length === 0) {
    return null;
  }

  return (
    <div className={`p-4 bg-gray-50 dark:bg-gray-800 rounded-lg ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <Link className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
          Backlinks ({backlinks.length})
        </h3>
      </div>
      
      <div className="space-y-2">
        {backlinks.map((backlink) => {
          const fromNote = backlink as any; // Access note data from the hook result
          return (
            <div
              key={backlink.id}
              className="flex items-start gap-3 p-3 bg-white dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 hover:shadow-sm transition-shadow cursor-pointer"
              onClick={() => {
                // Navigate to the linking note
                window.location.hash = fromNote.id;
              }}
            >
              <FileText className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                  {fromNote.title}
                </h4>
                {fromNote.content && fromNote.content.content && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                    {fromNote.content.content
                      .filter((node: any) => node.type === 'text')
                      .map((node: any) => node.text)
                      .join('')
                      .slice(0, 100)}
                    ...
                  </p>
                )}
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Clock className="w-3 h-3" />
                  {new Date(fromNote.updatedAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {backlinks.length > 5 && (
        <div className="mt-4 text-center">
          <button className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
            Show all {backlinks.length} backlinks
          </button>
        </div>
      )}
    </div>
  );
}
