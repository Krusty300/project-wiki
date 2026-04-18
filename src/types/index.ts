export interface Note {
  id: string;
  title: string;
  content: any;
  markdown?: string;
  folderId: string | null;
  tags: string[];
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
  createdAt: Date;
  updatedAt: Date;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SearchResult {
  id: string;
  title: string;
  content: string;
  score: number;
}
