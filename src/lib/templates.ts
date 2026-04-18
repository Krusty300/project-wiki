import { Note } from '@/types';

export interface NoteTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  content: any;
  tags?: string[];
  category: 'personal' | 'work' | 'creative' | 'productivity';
}

export const noteTemplates: NoteTemplate[] = [
  // Personal Templates
  {
    id: 'meeting-notes',
    name: 'Meeting Notes',
    description: 'Structured template for meeting notes with action items',
    icon: 'note-sticky',
    category: 'personal' as const,
    tags: ['meeting', 'notes'],
    content: {
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 1 },
          content: [{ type: 'text', text: 'Meeting Notes' }]
        },
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'Date: ' },
            { type: 'text', text: new Date().toLocaleDateString() }
          ]
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Attendees' }]
        },
        {
          type: 'bulletList',
          content: [
            { type: 'listItem', content: [{ type: 'text', text: 'Attendee 1' }] },
            { type: 'listItem', content: [{ type: 'text', text: 'Attendee 2' }] }
          ]
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Key Discussion Points' }]
        },
        {
          type: 'bulletList',
          content: [
            { type: 'listItem', content: [{ type: 'text', text: 'Point 1' }] },
            { type: 'listItem', content: [{ type: 'text', text: 'Point 2' }] }
          ]
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Action Items' }]
        },
        {
          type: 'bulletList',
          content: [
            { type: 'listItem', content: [{ type: 'text', text: 'Action 1' }] },
            { type: 'listItem', content: [{ type: 'text', text: 'Action 2' }] }
          ]
        }
      ]
    }
  },
  {
    id: 'daily-journal',
    name: 'Daily Journal',
    description: 'Daily reflection and gratitude journal template',
    icon: 'book',
    category: 'personal' as const,
    tags: ['journal', 'daily'],
    content: {
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 1 },
          content: [{ type: 'text', text: `Daily Journal - ${new Date().toLocaleDateString()}` }]
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Gratitude' }]
        },
        {
          type: 'bulletList',
          content: [
            { type: 'listItem', content: [{ type: 'text', text: 'I am grateful for...' }] },
            { type: 'listItem', content: [{ type: 'text', text: 'Today I appreciated...' }] },
            { type: 'listItem', content: [{ type: 'text', text: 'Something that made me smile...' }] }
          ]
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Reflections' }]
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'What went well today?' }]
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'What could have been better?' }]
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'What did I learn today?' }]
        }
      ]
    }
  },

  // Work Templates
  {
    id: 'project-plan',
    name: 'Project Plan',
    description: 'Structured project planning template with goals and milestones',
    icon: 'target',
    category: 'work' as const,
    tags: ['project', 'planning'],
    content: {
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 1 },
          content: [{ type: 'text', text: 'Project Plan' }]
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Project Overview' }]
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Project description and objectives...' }]
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Goals' }]
        },
        {
          type: 'bulletList',
          content: [
            { type: 'listItem', content: [{ type: 'text', text: 'Primary goal: ' }] },
            { type: 'listItem', content: [{ type: 'text', text: 'Secondary goal: ' }] }
          ]
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Timeline & Milestones' }]
        },
        {
          type: 'bulletList',
          content: [
            { type: 'listItem', content: [{ type: 'text', text: 'Phase 1: ' }] },
            { type: 'listItem', content: [{ type: 'text', text: 'Phase 2: ' }] }
          ]
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Resources Needed' }]
        },
        {
          type: 'bulletList',
          content: [
            { type: 'listItem', content: [{ type: 'text', text: 'Resource 1' }] },
            { type: 'listItem', content: [{ type: 'text', text: 'Resource 2' }] }
          ]
        }
      ]
    }
  },
  {
    id: 'meeting-agenda',
    name: 'Meeting Agenda',
    description: 'Professional meeting agenda template',
    icon: 'calendar',
    category: 'work' as const,
    tags: ['meeting', 'agenda'],
    content: {
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 1 },
          content: [{ type: 'text', text: 'Meeting Agenda' }]
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Meeting Details' }]
        },
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'Date: ' },
            { type: 'text', text: new Date().toLocaleDateString() }
          ]
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Duration: ' }]
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Location: ' }]
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Attendees' }]
        },
        {
          type: 'bulletList',
          content: [
            { type: 'listItem', content: [{ type: 'text', text: 'Name - Role' }] }
          ]
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Agenda Items' }]
        },
        {
          type: 'orderedList',
          content: [
            { type: 'listItem', content: [{ type: 'text', text: 'Opening remarks' }] },
            { type: 'listItem', content: [{ type: 'text', text: 'Main discussion topic' }] },
            { type: 'listItem', content: [{ type: 'text', text: 'Decision making' }] },
            { type: 'listItem', content: [{ type: 'text', text: 'Next steps' }] }
          ]
        }
      ]
    }
  },

  // Creative Templates
  {
    id: 'story-outline',
    name: 'Story Outline',
    description: 'Creative writing template for story planning',
    icon: 'pen',
    category: 'creative' as const,
    tags: ['story', 'writing'],
    content: {
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 1 },
          content: [{ type: 'text', text: 'Story Outline' }]
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Title' }]
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Working title for your story...' }]
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Logline' }]
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'A [protagonist] must [goal] or [stakes] when [conflict].' }]
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Characters' }]
        },
        {
          type: 'bulletList',
          content: [
            { type: 'listItem', content: [{ type: 'text', text: 'Protagonist: ' }] },
            { type: 'listItem', content: [{ type: 'text', text: 'Antagonist: ' }] },
            { type: 'listItem', content: [{ type: 'text', text: 'Supporting characters: ' }] }
          ]
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Plot Structure' }]
        },
        {
          type: 'bulletList',
          content: [
            { type: 'listItem', content: [{ type: 'text', text: 'Act 1: Setup' }] },
            { type: 'listItem', content: [{ type: 'text', text: 'Act 2: Confrontation' }] },
            { type: 'listItem', content: [{ type: 'text', text: 'Act 3: Resolution' }] }
          ]
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Key Scenes' }]
        },
        {
          type: 'bulletList',
          content: [
            { type: 'listItem', content: [{ type: 'text', text: 'Opening scene' }] },
            { type: 'listItem', content: [{ type: 'text', text: 'Inciting incident' }] },
            { type: 'listItem', content: [{ type: 'text', text: 'Climax' }] }
          ]
        }
      ]
    }
  },
  {
    id: 'brainstorm',
    name: 'Brainstorming',
    description: 'Creative brainstorming template with mind map structure',
    icon: 'lightbulb',
    category: 'creative' as const,
    tags: ['brainstorm', 'ideas'],
    content: {
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 1 },
          content: [{ type: 'text', text: 'Brainstorming Session' }]
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Topic' }]
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Main topic or problem to explore...' }]
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Initial Ideas' }]
        },
        {
          type: 'bulletList',
          content: [
            { type: 'listItem', content: [{ type: 'text', text: 'Idea 1' }] },
            { type: 'listItem', content: [{ type: 'text', text: 'Idea 2' }] },
            { type: 'listItem', content: [{ type: 'text', text: 'Idea 3' }] }
          ]
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Exploration' }]
        },
        {
          type: 'bulletList',
          content: [
            { type: 'listItem', content: [{ type: 'text', text: 'Pros: ' }] },
            { type: 'listItem', content: [{ type: 'text', text: 'Cons: ' }] },
            { type: 'listItem', content: [{ type: 'text', text: 'Questions: ' }] }
          ]
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Next Steps' }]
        },
        {
          type: 'bulletList',
          content: [
            { type: 'listItem', content: [{ type: 'text', text: 'Action 1' }] },
            { type: 'listItem', content: [{ type: 'text', text: 'Action 2' }] }
          ]
        }
      ]
    }
  },

  // Productivity Templates
  {
    id: 'todo-list',
    name: 'Todo List',
    description: 'Simple and effective todo list template',
    icon: 'check-square',
    category: 'productivity' as const,
    tags: ['todo', 'tasks'],
    content: {
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 1 },
          content: [{ type: 'text', text: 'Todo List' }]
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Today' }]
        },
        {
          type: 'taskList',
          content: [
            {
              type: 'taskItem',
              attrs: { checked: false },
              content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Task 1' }] }]
            },
            {
              type: 'taskItem',
              attrs: { checked: false },
              content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Task 2' }] }]
            }
          ]
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'This Week' }]
        },
        {
          type: 'taskList',
          content: [
            {
              type: 'taskItem',
              attrs: { checked: false },
              content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Weekly goal 1' }] }]
            }
          ]
        }
      ]
    }
  },
  {
    id: 'habit-tracker',
    name: 'Habit Tracker',
    description: 'Track daily habits and build consistency',
    icon: 'trending-up',
    category: 'productivity' as const,
    tags: ['habits', 'tracking'],
    content: {
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 1 },
          content: [{ type: 'text', text: `Habit Tracker - ${new Date().toLocaleDateString()}` }]
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Daily Habits' }]
        },
        {
          type: 'taskList',
          content: [
            {
              type: 'taskItem',
              attrs: { checked: false },
              content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Morning routine' }] }]
            },
            {
              type: 'taskItem',
              attrs: { checked: false },
              content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Exercise' }] }]
            },
            {
              type: 'taskItem',
              attrs: { checked: false },
              content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Reading' }] }]
            },
            {
              type: 'taskItem',
              attrs: { checked: false },
              content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Meditation' }] }]
            }
          ]
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Reflection' }]
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'How did I do today?' }]
        }
      ]
    }
  }
];

export function createNoteFromTemplate(template: NoteTemplate, folderId?: string | null): Omit<Note, 'id' | 'createdAt' | 'updatedAt' | 'isArchived'> {
  return {
    title: template.name,
    content: template.content,
    markdown: '',
    folderId: folderId || null,
    tags: template.tags || [],
  };
}
