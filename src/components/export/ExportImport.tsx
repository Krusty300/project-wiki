'use client';

import { useState } from 'react';
import { Download, Upload, FileText, Database } from 'lucide-react';
import { useNotes, useFolders, useTags } from '@/hooks/useNotes';
import { Note, Folder, Tag } from '@/types';
import { exportAllData, importData, tiptapToMarkdown } from '@/lib/import-export';

interface ExportImportProps {
  className?: string;
}

export default function ExportImport({ className }: ExportImportProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  
  const notes = useNotes();
  const folders = useFolders();
  const tags = useTags();

  const exportToJSON = async () => {
    setIsExporting(true);
    try {
      const exportData = await exportAllData();

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `notion-wiki-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const exportToMarkdown = async () => {
    setIsExporting(true);
    try {
      const markdownContent = (notes || []).map(note => {
        const title = note.title || 'Untitled';
        const noteTags = note.tags || [];
        const tags = noteTags.length > 0 ? `Tags: ${noteTags.join(', ')}\n` : '';
        const date = `Created: ${new Date(note.createdAt).toLocaleDateString()}\n`;
        const content = tiptapToMarkdown(note.content);

        return `# ${title}\n\n${tags}${date}\n\n${content}\n\n---\n\n`;
      }).join('');

      const blob = new Blob([markdownContent], {
        type: 'text/markdown'
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `notion-wiki-export-${new Date().toISOString().split('T')[0]}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Markdown export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const importFromJSON = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const text = await file.text();
      const importData = JSON.parse(text);

      // Validate import data structure
      if (!importData.data || !importData.data.notes) {
        throw new Error('Invalid import file format');
      }

      // Import data
      const result = await importData(importData);
      
      if (result.errors.length > 0) {
        alert(`Import completed with ${result.errors.length} errors:\n${result.errors.join('\n')}`);
      } else {
        alert(`Import successful!\nNotes: ${result.notesImported}\nFolders: ${result.foldersImported}\nTags: ${result.tagsImported}`);
      }
    } catch (error) {
      console.error('Import failed:', error);
      alert('Import failed. Please check the file format.');
    } finally {
      setIsImporting(false);
      // Reset file input
      event.target.value = '';
    }
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
      >
        <Database className="w-4 h-4" />
        <span>Export/Import</span>
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-1 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10">
          <div className="p-3 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium">Export Options</h3>
          </div>

          <div className="p-2 space-y-1">
            <button
              onClick={exportToJSON}
              disabled={isExporting}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>Export as JSON</span>
              {isExporting && <span className="text-xs text-gray-500">Exporting...</span>}
            </button>

            <button
              onClick={exportToMarkdown}
              disabled={isExporting}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded disabled:opacity-50"
            >
              <FileText className="w-4 h-4" />
              <span>Export as Markdown</span>
              {isExporting && <span className="text-xs text-gray-500">Exporting...</span>}
            </button>
          </div>

          <div className="p-3 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium mb-2">Import Options</h3>
            <label className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer">
              <Upload className="w-4 h-4" />
              <span>Import from JSON</span>
              <input
                type="file"
                accept=".json"
                onChange={importFromJSON}
                disabled={isImporting}
                className="hidden"
              />
              {isImporting && <span className="text-xs text-gray-500">Importing...</span>}
            </label>
          </div>

          <div className="p-3 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500">
            <p>Export includes all notes, folders, and tags.</p>
            <p>Import will merge with existing data.</p>
          </div>
        </div>
      )}
    </div>
  );
}
