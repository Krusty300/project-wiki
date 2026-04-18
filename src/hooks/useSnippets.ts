import { useState, useCallback } from 'react';

export interface TextSnippet {
  id: string;
  name: string;
  description: string;
  shortcut: string;
  content: any;
  category: 'text' | 'formatting' | 'productivity' | 'communication';
}

const defaultSnippets: TextSnippet[] = [
  // Text snippets
  {
    id: 'email-template',
    name: 'Email Template',
    description: 'Professional email template',
    shortcut: '/email',
    category: 'communication',
    content: {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Hi [Name],' }]
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: '' }]
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'I hope this message finds you well.' }]
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: '' }]
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: '[Your message here]' }]
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: '' }]
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Best regards,' }]
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: '[Your Name]' }]
        }
      ]
    }
  },
  {
    id: 'meeting-notes-template',
    name: 'Meeting Notes Template',
    description: 'Quick meeting notes structure',
    shortcut: '/meeting',
    category: 'productivity',
    content: {
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Meeting Notes' }]
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Date: ' }]
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Attendees: ' }]
        },
        {
          type: 'heading',
          attrs: { level: 3 },
          content: [{ type: 'text', text: 'Key Points' }]
        },
        {
          type: 'bulletList',
          content: [
            {
              type: 'listItem',
              content: [{ type: 'text', text: '' }]
            }
          ]
        },
        {
          type: 'heading',
          attrs: { level: 3 },
          content: [{ type: 'text', text: 'Action Items' }]
        },
        {
          type: 'taskList',
          content: [
            {
              type: 'taskItem',
              attrs: { checked: false },
              content: [{ type: 'paragraph', content: [{ type: 'text', text: '' }] }]
            }
          ]
        }
      ]
    }
  },
  
  // Formatting snippets
  {
    id: 'callout-info',
    name: 'Info Callout',
    description: 'Information callout box',
    shortcut: '/info',
    category: 'formatting',
    content: {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'ℹ️ ' },
            { type: 'text', text: '**Note:** ' }
          ]
        }
      ]
    }
  },
  {
    id: 'callout-warning',
    name: 'Warning Callout',
    description: 'Warning callout box',
    shortcut: '/warning',
    category: 'formatting',
    content: {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: '⚠️ ' },
            { type: 'text', text: '**Warning:** ' }
          ]
        }
      ]
    }
  },
  {
    id: 'callout-tip',
    name: 'Tip Callout',
    description: 'Tip callout box',
    shortcut: '/tip',
    category: 'formatting',
    content: {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: '💡 ' },
            { type: 'text', text: '**Tip:** ' }
          ]
        }
      ]
    }
  },

  // Productivity snippets
  {
    id: 'swot-analysis',
    name: 'SWOT Analysis',
    description: 'SWOT analysis framework',
    shortcut: '/swot',
    category: 'productivity',
    content: {
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'SWOT Analysis' }]
        },
        {
          type: 'heading',
          attrs: { level: 3 },
          content: [{ type: 'text', text: 'Strengths' }]
        },
        {
          type: 'bulletList',
          content: [
            {
              type: 'listItem',
              content: [{ type: 'text', text: '' }]
            }
          ]
        },
        {
          type: 'heading',
          attrs: { level: 3 },
          content: [{ type: 'text', text: 'Weaknesses' }]
        },
        {
          type: 'bulletList',
          content: [
            {
              type: 'listItem',
              content: [{ type: 'text', text: '' }]
            }
          ]
        },
        {
          type: 'heading',
          attrs: { level: 3 },
          content: [{ type: 'text', text: 'Opportunities' }]
        },
        {
          type: 'bulletList',
          content: [
            {
              type: 'listItem',
              content: [{ type: 'text', text: '' }]
            }
          ]
        },
        {
          type: 'heading',
          attrs: { level: 3 },
          content: [{ type: 'text', text: 'Threats' }]
        },
        {
          type: 'bulletList',
          content: [
            {
              type: 'listItem',
              content: [{ type: 'text', text: '' }]
            }
          ]
        }
      ]
    }
  },
  {
    id: 'decision-matrix',
    name: 'Decision Matrix',
    description: 'Decision making matrix',
    shortcut: '/decision',
    category: 'productivity',
    content: {
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Decision Matrix' }]
        },
        {
          type: 'table',
          content: [
            {
              type: 'tableRow',
              content: [
                {
                  type: 'tableHeader',
                  content: [{ type: 'text', text: 'Option' }]
                },
                {
                  type: 'tableHeader',
                  content: [{ type: 'text', text: 'Pros' }]
                },
                {
                  type: 'tableHeader',
                  content: [{ type: 'text', text: 'Cons' }]
                },
                {
                  type: 'tableHeader',
                  content: [{ type: 'text', text: 'Score' }]
                }
              ]
            },
            {
              type: 'tableRow',
              content: [
                {
                  type: 'tableCell',
                  content: [{ type: 'text', text: 'Option 1' }]
                },
                {
                  type: 'tableCell',
                  content: [{ type: 'text', text: '' }]
                },
                {
                  type: 'tableCell',
                  content: [{ type: 'text', text: '' }]
                },
                {
                  type: 'tableCell',
                  content: [{ type: 'text', text: '' }]
                }
              ]
            }
          ]
        }
      ]
    }
  },

  // Communication snippets
  {
    id: 'follow-up-email',
    name: 'Follow-up Email',
    description: 'Professional follow-up email',
    shortcut: '/followup',
    category: 'communication',
    content: {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Hi [Name],' }]
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: '' }]
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Just following up on our previous conversation regarding [topic].' }]
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: '' }]
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Please let me know if you need any additional information from my end.' }]
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: '' }]
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Best regards,' }]
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: '[Your Name]' }]
        }
      ]
    }
  },
  {
    id: 'thank-you-note',
    name: 'Thank You Note',
    description: 'Professional thank you message',
    shortcut: '/thanks',
    category: 'communication',
    content: {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Dear [Name],' }]
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: '' }]
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Thank you so much for [specific reason]. I truly appreciate your [help/support/guidance].' }]
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: '' }]
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Your contribution made a significant difference, and I wanted to express my sincere gratitude.' }]
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: '' }]
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Warm regards,' }]
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: '[Your Name]' }]
        }
      ]
    }
  }
];

export function useSnippets() {
  const [snippets, setSnippets] = useState<TextSnippet[]>(defaultSnippets);

  const getSnippetById = useCallback((id: string): TextSnippet | undefined => {
    return snippets.find(snippet => snippet.id === id);
  }, [snippets]);

  const getSnippetByShortcut = useCallback((shortcut: string): TextSnippet | undefined => {
    return snippets.find(snippet => snippet.shortcut === shortcut);
  }, [snippets]);

  const getSnippetsByCategory = useCallback((category: string): TextSnippet[] => {
    return snippets.filter(snippet => snippet.category === category);
  }, [snippets]);

  const getAllCategories = useCallback((): string[] => {
    return Array.from(new Set(snippets.map(snippet => snippet.category)));
  }, [snippets]);

  const createSnippet = useCallback((snippet: Omit<TextSnippet, 'id'>): TextSnippet => {
    const newSnippet: TextSnippet = {
      ...snippet,
      id: `snippet-${Date.now()}`
    };
    setSnippets(prev => [...prev, newSnippet]);
    return newSnippet;
  }, []);

  const updateSnippet = useCallback((id: string, updates: Partial<TextSnippet>): void => {
    setSnippets(prev => 
      prev.map(snippet => 
        snippet.id === id ? { ...snippet, ...updates } : snippet
      )
    );
  }, []);

  const deleteSnippet = useCallback((id: string): void => {
    setSnippets(prev => prev.filter(snippet => snippet.id !== id));
  }, []);

  const searchSnippets = useCallback((query: string): TextSnippet[] => {
    const lowercaseQuery = query.toLowerCase();
    return snippets.filter(snippet => 
      snippet.name.toLowerCase().includes(lowercaseQuery) ||
      snippet.description.toLowerCase().includes(lowercaseQuery) ||
      snippet.shortcut.toLowerCase().includes(lowercaseQuery)
    );
  }, [snippets]);

  return {
    snippets,
    getSnippetById,
    getSnippetByShortcut,
    getSnippetsByCategory,
    getAllCategories,
    createSnippet,
    updateSnippet,
    deleteSnippet,
    searchSnippets
  };
}
