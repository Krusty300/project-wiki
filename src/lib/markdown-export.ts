import { Note } from '@/types';

export interface MarkdownExportOptions {
  includeFrontmatter?: boolean;
  includeMetadata?: boolean;
  convertLinks?: boolean;
  codeBlockLanguage?: string;
}

export function exportToMarkdown(note: Note, options: MarkdownExportOptions = {}): string {
  const {
    includeFrontmatter = true,
    includeMetadata = true,
    convertLinks = true,
    codeBlockLanguage = 'text'
  } = options;

  let markdown = '';

  // Add frontmatter if enabled
  if (includeFrontmatter) {
    const frontmatter = [
      '---',
      `title: ${note.title}`,
      `created: ${note.createdAt.toISOString()}`,
      `updated: ${note.updatedAt.toISOString()}`,
      note.tags && note.tags.length > 0 ? `tags: [${note.tags.join(', ')}]` : '',
      note.folderId ? `folder: ${note.folderId}` : '',
      '---',
      ''
    ].filter(Boolean).join('\n');
    
    if (frontmatter) {
      markdown += frontmatter + '\n\n';
    }
  }

  // Convert Tiptap JSON to Markdown
  if (note.content) {
    markdown += tiptapToMarkdown(note.content, {
      convertLinks,
      codeBlockLanguage
    });
  }

  // Add metadata if enabled
  if (includeMetadata) {
    markdown += '\n\n---\n\n';
    markdown += `*Exported: ${new Date().toISOString()}*\n`;
    markdown += `*ID: ${note.id}*\n`;
  }

  return markdown;
}

function tiptapToMarkdown(content: any, options: { convertLinks: boolean; codeBlockLanguage: string }): string {
  if (!content || !content.content) {
    return '';
  }

  return processNode(content);
}

function processNode(node: any): string {
  switch (node.type) {
    case 'doc':
      return node.content ? node.content.map(processNode).join('') : '';
    
    case 'paragraph':
      return processInlineContent(node.content) + '\n\n';
    
    case 'heading':
      const level = node.attrs?.level || 1;
      const prefix = '#'.repeat(level);
      const nodeText = processInlineContent(node.content);
      return `${prefix} ${nodeText}\n\n`;
    
    case 'text':
      return node.text || '';
    
    case 'bold':
      return `**${processInlineContent(node.content)}**`;
    
    case 'italic':
      return `*${processInlineContent(node.content)}*`;
    
    case 'underline':
      return `__${processInlineContent(node.content)}__`;
    
    case 'strike':
      return `~~${processInlineContent(node.content)}~~`;
    
    case 'code':
      return `\`${processInlineContent(node.content)}\``;
    
    case 'blockquote':
      const blockquoteText = processInlineContent(node.content);
      return blockquoteText.split('\n').map(line => `> ${line}`).join('\n') + '\n\n';
    
    case 'bulletList':
      return node.content ? node.content.map((item: any) => `- ${processNode(item)}`).join('\n') : '';
    
    case 'orderedList':
      return node.content ? node.content.map((item: any, index: number) => `${index + 1}. ${processNode(item)}`).join('\n') : '';
    
    case 'taskList':
      return node.content ? node.content.map((item: any) => {
        const checked = item.attrs?.checked ? 'x' : ' ';
        return `${checked} [${processNode(item).replace(/^\s*\[|\s*\]\s*$/g, '').trim()}]`;
      }).join('\n') : '';
    
    case 'table':
      return processTable(node);
    
    case 'image':
      const src = node.attrs?.src || '';
      const alt = node.attrs?.alt || '';
      const title = node.attrs?.title || '';
      return `![${alt}](${src})`;
    
    case 'link':
      const href = node.attrs?.href || '';
      const linkText = processInlineContent(node.content);
      return `[${linkText}](${href})`;
    
    case 'hardBreak':
      return '\n';
    
    case 'horizontalRule':
      return '---\n';
    
    default:
      return processInlineContent(node.content) || '';
  }
}

function processInlineContent(content: any[]): string {
  if (!content) return '';
  return content.map(processNode).join('');
}

function processTable(node: any): string {
  if (!node.content) return '';
  
  const rows = node.content || [];
  let markdown = '';
  
  // Process table header
  if (rows.length > 0 && rows[0].type === 'tableRow') {
    const headerCells = rows[0].content || [];
    const header = '|' + headerCells.map((cell: any) => ` ${processNode(cell)} `).join('|') + '|\n';
    markdown += header;
    
    // Add separator
    const separator = '|' + headerCells.map(() => '---').join('|') + '|\n';
    markdown += separator;
    
    // Process data rows
    for (let i = 1; i < rows.length; i++) {
      const dataCells = rows[i].content || [];
      const row = '|' + dataCells.map((cell: any) => ` ${processNode(cell)} `).join('|') + '|\n';
      markdown += row;
    }
  }
  
  return markdown + '\n';
}
