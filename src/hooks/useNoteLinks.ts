import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { Note } from '@/types';

export interface NoteLink {
  id: string;
  fromNoteId: string;
  toNoteId: string;
  linkText: string;
  createdAt: Date;
}

// Extract note links from content
export function extractNoteLinks(content: any): string[] {
  const links: string[] = [];
  
  const extractFromNode = (node: any): void => {
    if (node.type === 'text' && node.text) {
      // Match [[note-title]] or [[note-id]] patterns
      const wikiLinkMatches = node.text.match(/\[\[([^\]]+)\]/g);
      if (wikiLinkMatches) {
        wikiLinkMatches.forEach((match: string) => {
          const linkText = match.slice(2, -2); // Remove [[ and ]]
          if (!links.includes(linkText)) {
            links.push(linkText);
          }
        });
      }
      
      // Match [text](note-id) patterns
      const markdownLinkMatches = node.text.match(/\[([^\]]+)\]\(([^)]+)\)/g);
      if (markdownLinkMatches) {
        markdownLinkMatches.forEach((match: string) => {
          const linkMatch = match.match(/\[([^\]]+)\]\(([^)]+)\)/);
          const url = linkMatch ? linkMatch[2] : '';
          // Check if it's an internal link (note ID or title)
          if (url && !url.startsWith('http') && !url.startsWith('www')) {
            if (!links.includes(url)) {
              links.push(url);
            }
          }
        });
      }
    }
    
    if (node.content && Array.isArray(node.content)) {
      node.content.forEach(extractFromNode);
    }
  };
  
  if (content && content.content) {
    content.content.forEach(extractFromNode);
  }
  
  return links;
}

// Find note by title or ID
export async function findNoteByReference(reference: string): Promise<Note | undefined> {
  // Try to find by exact title first
  let note = await db.notes.where('title').equals(reference).first();
  
  if (!note) {
    // Try to find by ID
    note = await db.notes.get(reference);
  }
  
  return note;
}

// Hook for managing note links
export function useNoteLinks(noteId: string) {
  return useLiveQuery(
    () => db.notes.where('id').equals(noteId).toArray(),
    [noteId],
    []
  ) as Note[];
}

// Hook for getting backlinks (notes that reference this note)
export function useBacklinks(noteId: string) {
  return useLiveQuery(
    () => {
      // This is a simplified version - in production you'd want to optimize this
      return db.notes.toArray().then(allNotes => {
        const backlinks: NoteLink[] = [];
        
        for (const note of allNotes) {
          if (note.id === noteId) continue; // Skip self
          
          const links = extractNoteLinks(note.content);
          const hasReference = links.some((link: string) => {
            // Check if link matches current note ID or title
            return link === noteId || link === note.title;
          });
          
          if (hasReference) {
            backlinks.push({
              id: `${note.id}-${noteId}`,
              fromNoteId: note.id,
              toNoteId: noteId,
              linkText: note.title,
              createdAt: note.updatedAt,
            });
          }
        }
        
        return backlinks;
      });
    },
    [noteId],
    []
  );
}

// Hook for getting all note links in the system
export function useAllNoteLinks() {
  return useLiveQuery(() => {
    // Simplified version - in production you'd want more sophisticated link tracking
    return db.notes.toArray().then(allNotes => {
      const allLinks: NoteLink[] = [];
      
      for (const note of allNotes) {
        const links = extractNoteLinks(note.content);
        
        for (const linkText of links) {
          // For now, just create link records without full resolution
          allLinks.push({
            id: `${note.id}-${linkText}`,
            fromNoteId: note.id,
            toNoteId: linkText, // This would be resolved to actual note ID
            linkText: linkText,
            createdAt: note.updatedAt,
          });
        }
      }
      
      return allLinks;
    });
  }, []);
}

// Create a note link
export async function createNoteLink(fromNoteId: string, toNoteId: string, linkText: string): Promise<void> {
  // In a real implementation, this would store in a links table
  // For now, we'll just log it
  console.log(`Created link: ${fromNoteId} -> ${toNoteId} (${linkText})`);
}

// Parse and replace wiki links in content
export function processWikiLinks(content: any, currentNoteId: string): any {
  if (!content || !content.content) return content;
  
  const processNode = (node: any): any => {
    if (node.type === 'text' && node.text) {
      // Replace [[note-title]] with actual links
      let processedText = node.text;
      const wikiLinkMatches = node.text.match(/\[\[([^\]]+)\]/g);
      
      if (wikiLinkMatches) {
        for (const match of wikiLinkMatches) {
          const linkText = match.slice(2, -2);
          processedText = processedText.replace(match, `[[${linkText}]]`);
        }
      }
      
      return { ...node, text: processedText };
    }
    
    if (node.content) {
      return {
        ...node,
        content: node.content.map(processNode)
      };
    }
    
    return node;
  };
  
  return {
    ...content,
    content: content.content.map(processNode)
  };
}

// Validate note link format
export function isValidNoteLink(link: string): boolean {
  return link.length > 0 && 
         !link.includes('[') && 
         !link.includes(']') &&
         !link.startsWith('http') &&
         !link.startsWith('www');
}
