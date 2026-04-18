import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { Note, Tag } from '@/types';

export interface SmartFolder {
  id: string;
  name: string;
  type: 'tag' | 'recent' | 'untagged' | 'favorite' | 'date-range' | 'custom';
  criteria?: {
    tagIds?: string[];
    dateRange?: 'today' | 'week' | 'month';
    isFavorite?: boolean;
    customFilter?: (note: Note) => boolean;
  };
  icon?: string;
  color?: string;
}

export function useSmartFolders(): SmartFolder[] {
  const tags = useLiveQuery(() => db.tags.toArray(), [], []) as Tag[];
  const recentNotes = useLiveQuery(
    () => db.notes.orderBy('updatedAt').reverse().limit(10).toArray(),
    [],
    []
  ) as Note[];
  
  const untaggedNotes = useLiveQuery(
    () => db.notes.filter(note => !note.isArchived && note.tags.length === 0).toArray(),
    [],
    []
  ) as Note[];

  // Generate smart folders based on available tags and usage
  const smartFolders: SmartFolder[] = [
    // Recent notes
    {
      id: 'recent',
      name: 'Recent',
      type: 'recent',
      icon: 'Clock',
      color: '#3b82f6',
    },
    
    // Untagged notes
    {
      id: 'untagged',
      name: 'Untagged',
      type: 'untagged',
      icon: 'Tag',
      color: '#6b7280',
    },
    
    // Today's notes
    {
      id: 'today',
      name: 'Today',
      type: 'date-range',
      criteria: { dateRange: 'today' },
      icon: 'Calendar',
      color: '#10b981',
    },
    
    // This week's notes
    {
      id: 'week',
      name: 'This Week',
      type: 'date-range',
      criteria: { dateRange: 'week' },
      icon: 'Calendar',
      color: '#8b5cf6',
    },
  ];

  // Add tag-based smart folders for frequently used tags
  const tagUsage = tags.map(tag => {
    const count = recentNotes.filter(note => note.tags.includes(tag.id)).length;
    return { tag, count };
  })
  .filter(({ count }) => count > 0)
  .sort((a, b) => b.count - a.count)
  .slice(0, 5); // Top 5 most used tags

  tagUsage.forEach(({ tag, count }) => {
    smartFolders.push({
      id: `tag-${tag.id}`,
      name: tag.name,
      type: 'tag',
      criteria: { tagIds: [tag.id] },
      icon: 'Hash',
      color: tag.color,
    });
  });

  return smartFolders;
}

export function useSmartFolderNotes(folder: SmartFolder) {
  return useLiveQuery(() => {
    const baseQuery = db.notes.filter(note => !note.isArchived);

    switch (folder.type) {
      case 'recent':
        return db.notes.orderBy('updatedAt').reverse().limit(20).toArray();
      
      case 'untagged':
        return baseQuery.filter(note => note.tags.length === 0).toArray();
      
      case 'tag':
        if (folder.criteria?.tagIds && folder.criteria.tagIds.length > 0) {
          return baseQuery.filter(note => 
            folder.criteria!.tagIds!.some(tagId => note.tags.includes(tagId))
          ).toArray();
        }
        return baseQuery.toArray();
      
      case 'date-range':
        if (folder.criteria && folder.criteria.dateRange) {
          const now = new Date();
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          
          if (folder.criteria.dateRange === 'today') {
            return baseQuery.filter(note => 
              new Date(note.updatedAt) >= today
            ).toArray();
          } else if (folder.criteria.dateRange === 'week') {
            const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
            return baseQuery.filter(note => 
              new Date(note.updatedAt) >= weekAgo
            ).toArray();
          } else if (folder.criteria.dateRange === 'month') {
            const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
            return baseQuery.filter(note => 
              new Date(note.updatedAt) >= monthAgo
            ).toArray();
          }
        }
        return baseQuery.toArray();
      
      case 'favorite':
        if (folder.criteria && folder.criteria.isFavorite) {
          // Assuming we have a favorite flag on notes
          return baseQuery.filter(note => (note as any).isFavorite).toArray();
        }
        return baseQuery.toArray();
      
      case 'custom':
        if (folder.criteria && folder.criteria.customFilter) {
          return baseQuery.filter(folder.criteria.customFilter).toArray();
        }
        return baseQuery.toArray();
      
      default:
        return baseQuery.toArray();
    }
  }, [folder], []) as Note[];
}

// Custom smart folder management
export function createCustomSmartFolder(data: Omit<SmartFolder, 'id'>): SmartFolder {
  return {
    ...data,
    id: `custom-${Date.now()}`,
    type: 'custom',
  };
}

export function updateSmartFolderCriteria(folderId: string, criteria: SmartFolder['criteria']) {
  // This would typically be stored in a separate smart folders table
  // For now, we'll manage it in localStorage or state
  const existing = localStorage.getItem('smart-folders');
  const folders = existing ? JSON.parse(existing) : {};
  
  folders[folderId] = criteria;
  localStorage.setItem('smart-folders', JSON.stringify(folders));
}

export function getSmartFolderCriteria(folderId: string): SmartFolder['criteria'] | null {
  const existing = localStorage.getItem('smart-folders');
  const folders = existing ? JSON.parse(existing) : {};
  return folders[folderId] || null;
}
