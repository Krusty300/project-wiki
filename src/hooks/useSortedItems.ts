import { useMemo } from 'react';
import { useSidebarStore } from '@/store/sidebar-store';
import type { Note, Folder } from '@/types';

export function useSortedNotes(notes: Note[]) {
  const { sortOption, sortDirection } = useSidebarStore();

  return useMemo(() => {
    if (sortOption === 'manual') {
      return notes;
    }

    const sorted = [...notes].sort((a, b) => {
      switch (sortOption) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'date':
          return b.updatedAt.getTime() - a.updatedAt.getTime();
        default:
          return 0;
      }
    });

    return sortDirection === 'desc' ? sorted.reverse() : sorted;
  }, [notes, sortOption, sortDirection]);
}

export function useSortedFolders(folders: Folder[]) {
  const { sortOption, sortDirection } = useSidebarStore();

  return useMemo(() => {
    if (sortOption === 'manual') {
      return folders;
    }

    const sorted = [...folders].sort((a, b) => {
      switch (sortOption) {
        case 'title':
          return a.name.localeCompare(b.name);
        case 'date':
          return b.updatedAt.getTime() - a.updatedAt.getTime();
        default:
          return 0;
      }
    });

    return sortDirection === 'desc' ? sorted.reverse() : sorted;
  }, [folders, sortOption, sortDirection]);
}

export function useSortedItems<T extends Note | Folder>(items: T[], type: 'notes' | 'folders') {
  const { sortOption, sortDirection } = useSidebarStore();

  return useMemo(() => {
    if (sortOption === 'manual') {
      return items;
    }

    const sorted = [...items].sort((a, b) => {
      const aTitle = type === 'notes' ? (a as Note).title : (a as Folder).name;
      const bTitle = type === 'notes' ? (b as Note).title : (b as Folder).name;
      
      switch (sortOption) {
        case 'title':
          return aTitle.localeCompare(bTitle);
        case 'date':
          return b.updatedAt.getTime() - a.updatedAt.getTime();
        default:
          return 0;
      }
    });

    return sortDirection === 'desc' ? sorted.reverse() : sorted;
  }, [items, sortOption, sortDirection, type]);
}
