import { useRef, useEffect, useCallback } from 'react';
import { Note } from '@/types';

export interface ExportOptions {
  format: 'pdf' | 'docx' | 'markdown' | 'html' | 'txt';
  includeMetadata?: boolean;
  includeTags?: boolean;
  customStyles?: string;
  theme?: 'light' | 'dark' | 'auto';
  pageSize?: 'a4' | 'letter' | 'legal';
  orientation?: 'portrait' | 'landscape';
  margin?: 'normal' | 'narrow' | 'wide';
}

export interface ExportProgress {
  noteId: string;
  title: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  error?: string;
}

export class ExportManager {
  private activeExports = new Map<string, ExportProgress>();

  async exportNotes(notes: Note[], options: ExportOptions): Promise<Blob> {
    const timestamp = new Date().toISOString();
    const filename = `notion-wiki-export-${timestamp}`;

    switch (options.format) {
      case 'markdown':
        return this.exportToMarkdown(notes, options);
      case 'html':
        return this.exportToHTML(notes, options);
      case 'txt':
        return this.exportToText(notes, options);
      case 'pdf':
        return this.exportToPDF(notes, options);
      case 'docx':
        return this.exportToDocx(notes, options);
      default:
        throw new Error(`Unsupported export format: ${options.format}`);
    }
  }

  private async exportToMarkdown(notes: Note[], options: ExportOptions): Promise<Blob> {
    let markdown = '';

    for (const note of notes) {
      markdown += this.noteToMarkdown(note, options);
      markdown += '\n\n---\n\n';
    }

    // Add metadata if requested
    if (options.includeMetadata) {
      markdown += this.generateMetadataMarkdown(notes);
    }

    return new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
  }

  private noteToMarkdown(note: Note, options: ExportOptions): string {
    let markdown = '';

    // Title
    if (note.title && note.title !== 'Untitled') {
      markdown += `# ${note.title}\n\n`;
    }

    // Tags
    if (options.includeTags && note.tags.length > 0) {
      markdown += `**Tags:** ${note.tags.map(tag => `#${tag}`).join(' ')}\n\n`;
    }

    // Content
    if (note.content) {
      markdown += this.tiptapToMarkdown(note.content);
    }

    // Metadata
    if (options.includeMetadata) {
      markdown += `\n\n---\n`;
      markdown += `*Created: ${new Date(note.createdAt).toLocaleString()}*\n`;
      markdown += `*Updated: ${new Date(note.updatedAt).toLocaleString()}*\n`;
      if (note.folderId) {
        markdown += `*Folder: ${note.folderId}*\n`;
      }
    }

    return markdown;
  }

  private tiptapToMarkdown(content: any): string {
    if (typeof content === 'string') {
      return content;
    }

    if (!content || !content.content) {
      return '';
    }

    let markdown = '';

    for (const node of content.content) {
      switch (node.type) {
        case 'paragraph':
          markdown += this.renderParagraph(node) + '\n\n';
          break;
        case 'heading':
          markdown += this.renderHeading(node) + '\n\n';
          break;
        case 'bulletList':
          markdown += this.renderBulletList(node) + '\n\n';
          break;
        case 'orderedList':
          markdown += this.renderOrderedList(node) + '\n\n';
          break;
        case 'codeBlock':
          markdown += this.renderCodeBlock(node) + '\n\n';
          break;
        case 'blockquote':
          markdown += this.renderBlockquote(node) + '\n\n';
          break;
        case 'table':
          markdown += this.renderTable(node) + '\n\n';
          break;
        default:
          if (node.content) {
            markdown += this.tiptapToMarkdown(node);
          }
      }
    }

    return markdown.trim();
  }

  private renderParagraph(node: any): string {
    if (!node.content) return '';
    return this.renderInlineContent(node.content);
  }

  private renderHeading(node: any): string {
    const level = node.attrs?.level || 1;
    const text = node.content ? this.renderInlineContent(node.content) : '';
    return `${'#'.repeat(level)} ${text}`;
  }

  private renderBulletList(node: any): string {
    if (!node.content) return '';
    
    let list = '';
    for (const item of node.content) {
      list += `- ${this.renderListItem(item)}\n`;
    }
    return list;
  }

  private renderOrderedList(node: any): string {
    if (!node.content) return '';
    
    let list = '';
    for (let i = 0; i < node.content.length; i++) {
      list += `${i + 1}. ${this.renderListItem(node.content[i])}\n`;
    }
    return list;
  }

  private renderListItem(item: any): string {
    if (!item.content) return '';
    return this.renderInlineContent(item.content);
  }

  private renderCodeBlock(node: any): string {
    const language = node.attrs?.language || '';
    const code = node.content ? this.renderTextContent(node.content) : '';
    return `\`\`\`${language}\n${code}\n\`\`\``;
  }

  private renderBlockquote(node: any): string {
    const text = node.content ? this.renderInlineContent(node.content) : '';
    return `> ${text.replace(/\n/g, '\n> ')}`;
  }

  private renderTable(node: any): string {
    if (!node.content) return '';
    
    let table = '';
    let headerRow = '';
    let separatorRow = '';
    
    for (let i = 0; i < node.content.length; i++) {
      const row = node.content[i];
      if (!row.content) continue;
      
      const cells = row.content.map((cell: any) => 
        cell.content ? this.renderInlineContent(cell.content) : ''
      );
      
      const rowText = `| ${cells.join(' | ')} |`;
      
      if (i === 0) {
        headerRow = rowText;
        separatorRow = `| ${cells.map(() => '---').join(' | ')} |`;
      } else {
        table += rowText + '\n';
      }
    }
    
    return `${headerRow}\n${separatorRow}\n${table}`;
  }

  private renderInlineContent(content: any[]): string {
    let text = '';
    
    for (const node of content) {
      switch (node.type) {
        case 'text':
          text += node.text || '';
          break;
        case 'bold':
          text += `**${this.renderInlineContent(node.content || [])}**`;
          break;
        case 'italic':
          text += `*${this.renderInlineContent(node.content || [])}*`;
          break;
        case 'code':
          text += `\`${node.text || ''}\``;
          break;
        case 'link':
          const href = node.attrs?.href || '';
          const linkText = node.content ? this.renderInlineContent(node.content) : href;
          text += `[${linkText}](${href})`;
          break;
        default:
          if (node.content) {
            text += this.renderInlineContent(node.content);
          } else if (node.text) {
            text += node.text;
          }
      }
    }
    
    return text;
  }

  private renderTextContent(content: any[]): string {
    return content.map(node => node.text || '').join('');
  }

  private async exportToHTML(notes: Note[], options: ExportOptions): Promise<Blob> {
    let html = this.generateHTMLHeader(options);

    for (const note of notes) {
      html += this.noteToHTML(note, options);
    }

    html += this.generateHTMLFooter(options);

    return new Blob([html], { type: 'text/html;charset=utf-8' });
  }

  private generateHTMLHeader(options: ExportOptions): string {
    const theme = options.theme || 'light';
    const styles = this.generateStyles(options);

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Notion Wiki Export</title>
    <style>
        ${styles}
    </style>
</head>
<body class="theme-${theme}">
    <div class="container">
`;
  }

  private generateStyles(options: ExportOptions): string {
    const baseStyles = `
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .theme-dark {
            background-color: #1a1a1a;
            color: #e0e0e0;
        }
        
        h1, h2, h3, h4, h5, h6 {
            margin-top: 2em;
            margin-bottom: 1em;
            font-weight: 600;
        }
        
        .note {
            margin-bottom: 3em;
            padding-bottom: 2em;
            border-bottom: 1px solid #eee;
        }
        
        .note-meta {
            font-size: 0.9em;
            color: #666;
            margin-bottom: 1em;
        }
        
        .theme-dark .note-meta {
            color: #999;
        }
        
        .tags {
            margin-bottom: 1em;
        }
        
        .tag {
            display: inline-block;
            background-color: #e3f2fd;
            color: #1976d2;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 0.8em;
            margin-right: 4px;
        }
        
        .theme-dark .tag {
            background-color: #1565c0;
            color: #bbdefb;
        }
        
        pre {
            background-color: #f5f5f5;
            padding: 1em;
            border-radius: 4px;
            overflow-x: auto;
        }
        
        .theme-dark pre {
            background-color: #2d2d2d;
        }
        
        blockquote {
            border-left: 4px solid #ddd;
            padding-left: 1em;
            margin: 1em 0;
            color: #666;
        }
        
        .theme-dark blockquote {
            border-left-color: #555;
            color: #999;
        }
        
        table {
            border-collapse: collapse;
            width: 100%;
            margin: 1em 0;
        }
        
        th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
        }
        
        .theme-dark th, .theme-dark td {
            border-color: #555;
        }
        
        th {
            background-color: #f5f5f5;
        }
        
        .theme-dark th {
            background-color: #2d2d2d;
        }
    `;

    if (options.customStyles) {
      return baseStyles + '\n' + options.customStyles;
    }

    return baseStyles;
  }

  private noteToHTML(note: Note, options: ExportOptions): string {
    let html = '<div class="note">';

    // Title
    if (note.title && note.title !== 'Untitled') {
      html += `<h1>${this.escapeHtml(note.title)}</h1>`;
    }

    // Tags
    if (options.includeTags && note.tags.length > 0) {
      html += '<div class="tags">';
      note.tags.forEach(tag => {
        html += `<span class="tag">${this.escapeHtml(tag)}</span>`;
      });
      html += '</div>';
    }

    // Content
    if (note.content) {
      html += this.tiptapToHTML(note.content);
    }

    // Metadata
    if (options.includeMetadata) {
      html += '<div class="note-meta">';
      html += `<p>Created: ${new Date(note.createdAt).toLocaleString()}</p>`;
      html += `<p>Updated: ${new Date(note.updatedAt).toLocaleString()}</p>`;
      if (note.folderId) {
        html += `<p>Folder: ${this.escapeHtml(note.folderId)}</p>`;
      }
      html += '</div>';
    }

    html += '</div>';
    return html;
  }

  private tiptapToHTML(content: any): string {
    if (typeof content === 'string') {
      return this.escapeHtml(content);
    }

    if (!content || !content.content) {
      return '';
    }

    let html = '';

    for (const node of content.content) {
      switch (node.type) {
        case 'paragraph':
          html += `<p>${this.tiptapToHTML(node)}</p>`;
          break;
        case 'heading':
          const level = node.attrs?.level || 1;
          html += `<h${level}>${this.tiptapToHTML(node)}</h${level}>`;
          break;
        case 'bulletList':
          html += `<ul>${this.tiptapToHTML(node)}</ul>`;
          break;
        case 'orderedList':
          html += `<ol>${this.tiptapToHTML(node)}</ol>`;
          break;
        case 'codeBlock':
          const language = node.attrs?.language || '';
          const code = node.content ? this.renderTextContent(node.content) : '';
          html += `<pre><code class="language-${language}">${this.escapeHtml(code)}</code></pre>`;
          break;
        case 'blockquote':
          html += `<blockquote>${this.tiptapToHTML(node)}</blockquote>`;
          break;
        case 'table':
          html += this.renderTableHTML(node);
          break;
        default:
          if (node.content) {
            html += this.tiptapToHTML(node);
          }
      }
    }

    return html;
  }

  private renderTableHTML(node: any): string {
    if (!node.content) return '';

    let html = '<table>';
    
    for (const row of node.content) {
      html += '<tr>';
      if (row.content) {
        for (const cell of row.content) {
          const tag = row.type === 'tableHeader' ? 'th' : 'td';
          html += `<${tag}>${this.tiptapToHTML(cell)}</${tag}>`;
        }
      }
      html += '</tr>';
    }
    
    html += '</table>';
    return html;
  }

  private generateHTMLFooter(options: ExportOptions): string {
    return `
    </div>
</body>
</html>`;
  }

  private async exportToText(notes: Note[], options: ExportOptions): Promise<Blob> {
    let text = '';

    for (const note of notes) {
      text += this.noteToText(note, options);
      text += '\n\n---\n\n';
    }

    return new Blob([text], { type: 'text/plain;charset=utf-8' });
  }

  private noteToText(note: Note, options: ExportOptions): string {
    let text = '';

    // Title
    if (note.title && note.title !== 'Untitled') {
      text += `${note.title}\n\n`;
    }

    // Tags
    if (options.includeTags && note.tags.length > 0) {
      text += `Tags: ${note.tags.join(', ')}\n\n`;
    }

    // Content
    if (note.content) {
      text += this.tiptapToText(note.content);
    }

    // Metadata
    if (options.includeMetadata) {
      text += `\n---\n`;
      text += `Created: ${new Date(note.createdAt).toLocaleString()}\n`;
      text += `Updated: ${new Date(note.updatedAt).toLocaleString()}\n`;
      if (note.folderId) {
        text += `Folder: ${note.folderId}\n`;
      }
    }

    return text;
  }

  private tiptapToText(content: any): string {
    if (typeof content === 'string') {
      return content;
    }

    if (!content || !content.content) {
      return '';
    }

    let text = '';

    for (const node of content.content) {
      switch (node.type) {
        case 'paragraph':
          text += this.tiptapToText(node) + '\n\n';
          break;
        case 'heading':
          const level = node.attrs?.level || 1;
          const headingText = this.tiptapToText(node);
          text += `${'#'.repeat(level)} ${headingText}\n\n`;
          break;
        case 'bulletList':
          text += this.renderBulletListText(node);
          break;
        case 'orderedList':
          text += this.renderOrderedListText(node);
          break;
        case 'codeBlock':
          const code = node.content ? this.renderTextContent(node.content) : '';
          text += `\`\`\`\n${code}\n\`\`\`\n\n`;
          break;
        case 'blockquote':
          text += `> ${this.tiptapToText(node).replace(/\n/g, '\n> ')}\n\n`;
          break;
        default:
          if (node.content) {
            text += this.tiptapToText(node);
          }
      }
    }

    return text.trim();
  }

  private renderBulletListText(node: any): string {
    if (!node.content) return '';
    
    let list = '';
    for (const item of node.content) {
      list += `- ${this.tiptapToText(item).trim()}\n`;
    }
    return list + '\n';
  }

  private renderOrderedListText(node: any): string {
    if (!node.content) return '';
    
    let list = '';
    for (let i = 0; i < node.content.length; i++) {
      list += `${i + 1}. ${this.tiptapToText(node.content[i]).trim()}\n`;
    }
    return list + '\n';
  }

  private async exportToPDF(notes: Note[], options: ExportOptions): Promise<Blob> {
    // For now, convert to HTML and use browser's print functionality
    // In a real implementation, you'd use a library like Puppeteer or jsPDF
    const html = await this.exportToHTML(notes, options);
    
    // Create a temporary window to generate PDF
    return new Promise(async (resolve, reject) => {
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        reject(new Error('Failed to open print window'));
        return;
      }

      const htmlText = await html.text();
      printWindow.document.write(htmlText);
      printWindow.document.close();

      printWindow.onload = () => {
        printWindow.print();
        printWindow.close();
        
        // For now, return the HTML as blob (in real implementation, you'd generate actual PDF)
        resolve(html);
      };
    });
  }

  private async exportToDocx(notes: Note[], options: ExportOptions): Promise<Blob> {
    // For now, export as rich text format
    // In a real implementation, you'd use a library like docx
    const textBlob = await this.exportToText(notes, options);
    const text = await textBlob.text();
    
    // Simple RTF format
    const rtf = `{\\rtf1\\ansi\\deff0
{\\fonttbl{\\f0\\fnil\\fcharset0 Arial;}}
{\\colortbl;\\red0\\green0\\blue0;}
\\viewkind4\\uc1\\pard\\cf1\\lang1033\\f0\\fs24
${this.escapeRtf(text)}
\\par}`;
    
    return new Blob([rtf], { type: 'application/rtf' });
  }

  private generateMetadataMarkdown(notes: Note[]): string {
    let metadata = '\n\n# Export Metadata\n\n';
    metadata += `- **Total Notes:** ${notes.length}\n`;
    metadata += `- **Export Date:** ${new Date().toLocaleString()}\n`;
    metadata += `- **Tags:** ${[...new Set(notes.flatMap(note => note.tags))].join(', ')}\n`;
    
    const folderIds = [...new Set(notes.map(note => note.folderId).filter(Boolean))];
    if (folderIds.length > 0) {
      metadata += `- **Folders:** ${folderIds.join(', ')}\n`;
    }
    
    return metadata;
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  private escapeRtf(text: string): string {
    return text
      .replace(/\\/g, '\\\\')
      .replace(/{/g, '\\{')
      .replace(/}/g, '\\}')
      .replace(/\n/g, '\\par\n');
  }

  // Progress tracking
  getExportProgress(): ExportProgress[] {
    return Array.from(this.activeExports.values());
  }

  clearExportProgress(): void {
    this.activeExports.clear();
  }
}

// React hook
export function useExportManager() {
  const exportManagerRef = useRef<ExportManager | null>(null);

  useEffect(() => {
    exportManagerRef.current = new ExportManager();
    return () => {
      // Cleanup if needed
    };
  }, []);

  const exportNotes = useCallback(async (notes: Note[], options: ExportOptions) => {
    if (!exportManagerRef.current) {
      throw new Error('Export manager not initialized');
    }
    return await exportManagerRef.current.exportNotes(notes, options);
  }, []);

  const getProgress = useCallback(() => {
    return exportManagerRef.current?.getExportProgress() || [];
  }, []);

  const clearProgress = useCallback(() => {
    exportManagerRef.current?.clearExportProgress();
  }, []);

  return {
    exportNotes,
    getProgress,
    clearProgress,
  };
}
