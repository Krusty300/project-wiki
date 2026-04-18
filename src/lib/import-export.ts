import { db } from '@/lib/db';
import { Note, Folder, Tag } from '@/types';
import { v4 as uuidv4 } from 'uuid';

export interface ExportData {
  version: string;
  exportedAt: string;
  data: {
    notes: Note[];
    folders: Folder[];
    tags: Tag[];
  };
}

export async function exportAllData(): Promise<ExportData> {
  const notes = await db.notes.toArray();
  const folders = await db.folders.toArray();
  const tags = await db.tags.toArray();

  // Convert database types to our types
  const convertedFolders = folders.map(folder => ({
    ...folder,
    createdAt: new Date(),
    updatedAt: new Date(),
  }));

  const convertedTags = tags.map(tag => ({
    ...tag,
    createdAt: new Date(),
    updatedAt: new Date(),
  }));

  return {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    data: {
      notes,
      folders: convertedFolders,
      tags: convertedTags,
    }
  };
}

export async function importData(importData: ExportData): Promise<{
  notesImported: number;
  foldersImported: number;
  tagsImported: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let notesImported = 0;
  let foldersImported = 0;
  let tagsImported = 0;

  try {
    // Import tags first (notes reference them)
    if (importData.data.tags) {
      for (const tag of importData.data.tags) {
        try {
          // Check if tag already exists
          const existingTag = await db.tags.where('name').equals(tag.name).first();
          if (!existingTag) {
            await db.tags.add({
              id: uuidv4(),
              name: tag.name,
              color: tag.color,
            });
            tagsImported++;
          }
        } catch (error) {
          errors.push(`Failed to import tag "${tag.name}": ${error}`);
        }
      }
    }

    // Import folders
    if (importData.data.folders) {
      for (const folder of importData.data.folders) {
        try {
          // Check if folder already exists
          const existingFolder = await db.folders.where('name').equals(folder.name).first();
          if (!existingFolder) {
            await db.folders.add({
              id: uuidv4(),
              name: folder.name,
              parentId: folder.parentId,
              updatedAt: new Date(),
            });
            foldersImported++;
          }
        } catch (error) {
          errors.push(`Failed to import folder "${folder.name}": ${error}`);
        }
      }
    }

    // Import notes
    if (importData.data.notes) {
      for (const note of importData.data.notes) {
        try {
          // Check if note already exists
          const existingNote = await db.notes.where('title').equals(note.title).first();
          if (!existingNote) {
            await db.notes.add({
              ...note,
              id: uuidv4(), // Generate new ID to avoid conflicts
              createdAt: new Date(note.createdAt),
              updatedAt: new Date(note.updatedAt),
            });
            notesImported++;
          }
        } catch (error) {
          errors.push(`Failed to import note "${note.title}": ${error}`);
        }
      }
    }
  } catch (error) {
    errors.push(`Import failed: ${error}`);
  }

  return {
    notesImported,
    foldersImported,
    tagsImported,
    errors
  };
}

export function tiptapToMarkdown(content: any): string {
  if (!content?.content) return '';

  return content.content.map((block: any) => {
    switch (block.type) {
      case 'heading':
        const level = block.attrs?.level || 1;
        const headingText = block.content?.map((t: any) => t.text).join('') || '';
        return `${'#'.repeat(level)} ${headingText}\n`;
      
      case 'paragraph':
        const paragraphText = block.content?.map((t: any) => t.text).join('') || '';
        return `${paragraphText}\n`;
      
      case 'bulletList':
        return block.content?.map((item: any) => {
          const itemText = item.content?.map((t: any) => t.text).join('') || '';
          return `- ${itemText}\n`;
        }).join('') || '';
      
      case 'orderedList':
        return block.content?.map((item: any, index: number) => {
          const itemText = item.content?.map((t: any) => t.text).join('') || '';
          return `${index + 1}. ${itemText}\n`;
        }).join('') || '';
      
      case 'codeBlock':
        const code = block.content?.map((t: any) => t.text).join('') || '';
        return `\`\`\`${block.attrs?.language || ''}\n${code}\n\`\`\`\n`;
      
      case 'blockquote':
        const quoteText = block.content?.map((t: any) => t.text).join('') || '';
        return `> ${quoteText}\n`;
      
      default:
        return '';
    }
  }).join('\n');
}
