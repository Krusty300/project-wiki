import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { Note } from '@/types';

export interface NoteAnalytics {
  wordCount: number;
  characterCount: number;
  readingTime: number; // in minutes
  lastModified: Date;
  createdDate: Date;
  tags: string[];
  folderName?: string;
}

export interface AnalyticsSummary {
  totalNotes: number;
  totalWords: number;
  totalCharacters: number;
  averageWordsPerNote: number;
  mostActiveDay: string;
  topTags: { name: string; count: number }[];
  recentlyActive: number; // notes modified in last 7 days
}

export function useNoteAnalytics(noteId: string) {
  return useLiveQuery(
    () => {
      return db.notes.get(noteId).then(note => {
        if (!note) return null;
        
        const analytics = calculateNoteAnalytics(note);
        return analytics;
      });
    },
    [noteId],
    null
  );
}

export function useGlobalAnalytics() {
  return useLiveQuery(
    async () => {
      const allNotes = await db.notes.toArray();
      const analytics = calculateGlobalAnalytics(allNotes);
      return analytics;
    },
    [],
    {
      totalNotes: 0,
      totalWords: 0,
      totalCharacters: 0,
      averageWordsPerNote: 0,
      mostActiveDay: '',
      topTags: [],
      recentlyActive: 0,
    }
  );
}

// Calculate analytics for a single note
function calculateNoteAnalytics(note: Note): NoteAnalytics {
  const plainText = extractPlainText(note.content);
  
  return {
    wordCount: countWords(plainText),
    characterCount: plainText.length,
    readingTime: calculateReadingTime(plainText),
    lastModified: note.updatedAt,
    createdDate: note.createdAt,
    tags: note.tags,
  };
}

// Calculate global analytics across all notes
async function calculateGlobalAnalytics(notes: Note[]): Promise<AnalyticsSummary> {
  const totalNotes = notes.length;
  let totalWords = 0;
  let totalCharacters = 0;
  const tagCounts: { [key: string]: number } = {};
  const dailyActivity: { [key: string]: number } = {};
  
  // Count words, characters, and tag usage
  for (const note of notes) {
    const plainText = extractPlainText(note.content);
    const wordCount = countWords(plainText);
    
    totalWords += wordCount;
    totalCharacters += plainText.length;
    
    // Count tags
    for (const tagId of note.tags) {
      tagCounts[tagId] = (tagCounts[tagId] || 0) + 1;
    }
    
    // Count daily activity
    const dateKey = note.updatedAt.toISOString().split('T')[0];
    dailyActivity[dateKey] = (dailyActivity[dateKey] || 0) + 1;
  }
  
  // Find most active day
  const mostActiveDay = Object.keys(dailyActivity).reduce((a, b) => 
    dailyActivity[a] > dailyActivity[b] ? a : b
  );
  
  // Get top tags (would need to join with tags table for names)
  const topTags = Object.entries(tagCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([tagId, count]) => ({
      name: `Tag ${tagId}`, // In real implementation, fetch tag name
      count
    }));
  
  return {
    totalNotes,
    totalWords,
    totalCharacters,
    averageWordsPerNote: totalNotes > 0 ? Math.round(totalWords / totalNotes) : 0,
    mostActiveDay,
    topTags,
    recentlyActive: Object.values(dailyActivity).slice(-7).reduce((sum, count) => sum + count, 0),
  };
}

// Helper function to extract plain text from Tiptap content
function extractPlainText(content: any): string {
  if (!content || !content.content) return '';
  
  const extractText = (node: any): string => {
    if (node.type === 'text') {
      return node.text || '';
    }
    
    if (node.content) {
      return node.content.map(extractText).join(' ');
    }
    
    return '';
  };
  
  return content.content.map(extractText).join(' ');
}

// Count words in text
function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

// Calculate reading time (average 200 words per minute)
function calculateReadingTime(text: string): number {
  const wordCount = countWords(text);
  return Math.max(1, Math.ceil(wordCount / 200));
}

// Get writing streak (consecutive days with activity)
export function useWritingStreak(): { streak: number; longestStreak: number } {
  return useLiveQuery(
    async () => {
      const notes = await db.notes
        .orderBy('updatedAt')
        .reverse()
        .toArray();
      
      if (notes.length === 0) return { streak: 0, longestStreak: 0 };
      
      let currentStreak = 0;
      let longestStreak = 0;
      let tempStreak = 0;
      
      const dates = [...new Set(notes.map(note => 
        note.updatedAt.toISOString().split('T')[0]
      ))].sort().reverse();
      
      for (let i = 0; i < dates.length - 1; i++) {
        const currentDate = new Date(dates[i]);
        const nextDate = new Date(dates[i + 1]);
        const dayDiff = Math.ceil((nextDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (dayDiff === 1) {
          tempStreak++;
          currentStreak = Math.max(currentStreak, tempStreak);
        } else {
          longestStreak = Math.max(longestStreak, tempStreak);
          tempStreak = 0;
        }
      }
      
      return { streak: currentStreak, longestStreak };
    },
    [],
    { streak: 0, longestStreak: 0 }
  );
}
