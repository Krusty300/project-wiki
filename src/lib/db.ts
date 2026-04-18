import Dexie, { Table } from 'dexie';

export interface Note {
  id: string;
  title: string;
  content: any; // Tiptap JSON (ProseMirror format)
  markdown?: string; // Optional for export/search
  folderId: string | null;
  tags: string[]; // Tag IDs
  updatedAt: Date;
  createdAt: Date;
  isArchived: boolean;
  isDeleted: boolean;
  deletedAt?: Date;
}

export interface Folder {
  id: string;
  name: string;
  parentId: string | null;
  updatedAt: Date;
}

export interface Tag {
  id: string;
  name: string;
  color: string; // e.g. "blue", "red"
}

class NotesDB extends Dexie {
  notes!: Table<Note>;
  folders!: Table<Folder>;
  tags!: Table<Tag>;

  constructor() {
    super('LocalWikiDB');
    this.version(1).stores({
      notes: 'id, title, folderId, updatedAt, createdAt, isArchived, isDeleted, deletedAt, *tags', // * = multi-entry index for tags
      folders: 'id, name, parentId, updatedAt',
      tags: 'id, name, color'
    });
  }

  // Performance optimization methods
  async optimizeDatabase() {
    try {
      // Compact database to reduce size
      await this.close();
      await Dexie.delete('LocalWikiDB');
      const newDb = new NotesDB();
      await newDb.open();
      return newDb;
    } catch (error) {
      console.warn('Database optimization failed:', error);
      return this;
    }
  }

  // Get database statistics
  async getStats() {
    const noteCount = await this.notes.count();
    const folderCount = await this.folders.count();
    const tagCount = await this.tags.count();
    const archivedCount = await this.notes.where('isArchived').equals(1).count();
    const deletedCount = await this.notes.where('isDeleted').equals(1).count();
    
    return {
      noteCount,
      folderCount,
      tagCount,
      archivedCount,
      deletedCount,
      activeNotes: noteCount - archivedCount - deletedCount
    };
  }

  // Get trashed notes
  async getTrashedNotes() {
    return await this.notes.filter(note => note.isDeleted).toArray();
  }

  // Empty trash
  async emptyTrash() {
    return await this.notes.filter(note => note.isDeleted).delete();
  }
}

export const db = new NotesDB();
