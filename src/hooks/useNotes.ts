import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { Note, Folder, Tag } from '@/types';
import { v4 as uuidv4 } from 'uuid';

export function useNotes(folderId?: string | null, tagIds?: string[]) {
  return useLiveQuery(
    () => {
      let query = db.notes.orderBy('updatedAt').reverse();
      if (folderId !== undefined && folderId !== null) {
        query = db.notes.where('folderId').equals(folderId).reverse();
      }
      return query.filter(note => !note.isArchived && !note.isDeleted).toArray();
    },
    [folderId, tagIds],
    []
  ) as Note[];
}

export function useNotesByTags(tagIds: string[]) {
  return useLiveQuery(
    () => {
      if (tagIds.length === 0) {
        return db.notes.orderBy('updatedAt').reverse().filter(note => !note.isArchived && !note.isDeleted).toArray();
      }
      
      return db.notes
        .filter(note => !note.isArchived && !note.isDeleted)
        .filter(note => tagIds.some(tagId => note.tags.includes(tagId)))
        .toArray()
        .then(notes => notes.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()));
    },
    [tagIds],
    []
  ) as Note[];
}

export function useNote(id: string) {
  return useLiveQuery(
    () => db.notes.get(id),
    [id],
    null
  ) as Note | null | undefined;
}

export function useFolders() {
  return useLiveQuery(
    () => db.folders.orderBy('name').toArray(),
    [],
    []
  ) as Folder[];
}

export function useTags() {
  return useLiveQuery(
    () => db.tags.orderBy('name').toArray(),
    [],
    []
  ) as Tag[];
}

export async function createNote(data: Partial<Note> = {}): Promise<Note> {
  const note: Note = {
    id: uuidv4(),
    title: data.title || 'Untitled',
    content: data.content || { type: 'doc', content: [{ type: 'paragraph', content: [] }] },
    markdown: data.markdown || '',
    folderId: data.folderId || null,
    tags: data.tags || [],
    updatedAt: new Date(),
    createdAt: new Date(),
    isArchived: false,
    isDeleted: false,
  };
  
  await db.notes.add(note);
  return note;
}

export async function updateNote(id: string, updates: Partial<Note>): Promise<void> {
  await db.notes.update(id, {
    ...updates,
    updatedAt: new Date(),
  });
}

export async function deleteNote(id: string): Promise<void> {
  await db.notes.update(id, {
    isDeleted: true,
    deletedAt: new Date(),
    updatedAt: new Date(),
  });
}

export async function restoreNote(id: string): Promise<void> {
  await db.notes.update(id, {
    isDeleted: false,
    deletedAt: undefined,
    updatedAt: new Date(),
  });
}

export async function permanentlyDeleteNote(id: string): Promise<void> {
  await db.notes.delete(id);
}

export async function emptyTrash(): Promise<void> {
  await db.emptyTrash();
}

export function useTrashedNotes() {
  return useLiveQuery(
    () => db.notes.filter(note => note.isDeleted).toArray(),
    [],
    []
  ) as Note[];
}

export async function archiveNote(id: string): Promise<void> {
  await db.notes.update(id, { isArchived: true, updatedAt: new Date() });
}

export async function createFolder(name: string, parentId: string | null = null): Promise<Folder> {
  const folder: Folder = {
    id: uuidv4(),
    name,
    parentId,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  await db.folders.add(folder);
  return folder;
}

export async function createTag(data: Partial<Tag> = {}): Promise<Tag> {
  const tag: Tag = {
    id: uuidv4(),
    name: data.name || 'Untitled Tag',
    color: data.color || '#3b82f6',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  await db.tags.add(tag);
  return tag;
}

export async function updateTag(id: string, updates: Partial<Tag>): Promise<void> {
  await db.tags.update(id, updates);
}

export async function deleteTag(id: string): Promise<void> {
  await db.tags.delete(id);
}

export async function updateFolder(id: string, updates: Partial<Folder>): Promise<void> {
  await db.folders.update(id, {
    ...updates,
    updatedAt: new Date(),
  });
}

export async function deleteFolder(id: string): Promise<void> {
  // Move all notes in this folder to root
  await db.notes.where('folderId').equals(id).modify({ folderId: null });
  // Delete subfolders
  const subfolders = await db.folders.where('parentId').equals(id).toArray();
  for (const subfolder of subfolders) {
    await deleteFolder(subfolder.id);
  }
  // Delete the folder
  await db.folders.delete(id);
}
