import { SuggestionOptions } from '@tiptap/suggestion';
import { Node as ProseMirrorNode } from 'prosemirror-model';

export interface CommandItem {
  title: string;
  description: string;
  icon: string;
  command: ({ editor, range }: { editor: any; range: { from: number; to: number } }) => void;
}

export const slashCommands: CommandItem[] = [
  {
    title: 'Heading 1',
    description: 'Large heading',
    icon: 'H1',
    command: ({ editor, range }) => {
      editor.chain().focus().toggleHeading({ level: 1 }).run();
    },
  },
  {
    title: 'Heading 2',
    description: 'Medium heading',
    icon: 'H2',
    command: ({ editor, range }) => {
      editor.chain().focus().toggleHeading({ level: 2 }).run();
    },
  },
  {
    title: 'Heading 3',
    description: 'Small heading',
    icon: 'H3',
    command: ({ editor, range }) => {
      editor.chain().focus().toggleHeading({ level: 3 }).run();
    },
  },
  {
    title: 'Bullet List',
    description: 'Create a bullet list',
    icon: 'List',
    command: ({ editor, range }) => {
      editor.chain().focus().toggleBulletList().run();
    },
  },
  {
    title: 'Numbered List',
    description: 'Create a numbered list',
    icon: 'List',
    command: ({ editor, range }) => {
      editor.chain().focus().toggleOrderedList().run();
    },
  },
  {
    title: 'Table',
    description: 'Insert a table',
    icon: 'Table',
    command: ({ editor, range }) => {
      try {
        editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
      } catch (error) {
        // Fallback to content insertion if table insertion fails
        editor.chain().focus().insertContent('<table><thead><tr><th>Column 1</th><th>Column 2</th><th>Column 3</th></tr></thead><tbody><tr><td>Cell 1</td><td>Cell 2</td><td>Cell 3</td></tr><tr><td>Cell 4</td><td>Cell 5</td><td>Cell 6</td></tr><tr><td>Cell 7</td><td>Cell 8</td><td>Cell 9</td></tr></tbody></table>').run();
      }
    },
  },
  {
    title: 'Callout',
    description: 'Insert a callout block',
    icon: 'Callout',
    command: ({ editor, range }) => {
      // Insert a callout using a simple blockquote with styling
      editor.chain().focus().insertContent('<blockquote class="callout" style="border-left: 4px solid #3b82f6; padding: 16px; margin: 16px 0; background: #eff6ff; border-radius: 4px;"><div style="font-weight: bold; margin-bottom: 8px;">Info</div><div>This is an important note.</div></blockquote>').run();
    },
  },
  {
    title: 'Math Block',
    description: 'Insert math (LaTeX)',
    icon: 'Math',
    command: ({ editor, range }) => {
      try {
        editor.chain().focus().deleteRange(range).insertContent('<span style="font-family: \'KaTeX_Math\', serif; background: #f3f4f6; padding: 2px 4px; border-radius: 2px;">E = mc²</span>').run();
      } catch (error) {
        // Fallback to simple text
        editor.chain().focus().deleteRange(range).insertContent('E = mc²').run();
      }
    },
  },
  {
    title: 'Code Block',
    description: 'Create a code block',
    icon: 'Code',
    command: ({ editor, range }) => {
      try {
        editor.chain().focus().deleteRange(range).toggleCodeBlock().run();
      } catch (error) {
        // Fallback to content insertion
        editor.chain().focus().deleteRange(range).insertContent('<pre><code>// Your code here</code></pre>').run();
      }
    },
  },
  {
    title: 'Python Code',
    description: 'Insert Python code',
    icon: 'Python',
    command: ({ editor, range }) => {
      try {
        editor.chain().focus().deleteRange(range).insertContent('<pre><code class="language-python">def hello_world():\n    print("Hello, World!")\n    return True\n</code></pre>').run();
      } catch (error) {
        // Fallback to simple code block
        editor.chain().focus().deleteRange(range).toggleCodeBlock().run();
      }
    },
  },
  {
    title: 'TypeScript Code',
    description: 'Insert TypeScript code',
    icon: 'TS',
    command: ({ editor, range }) => {
      try {
        editor.chain().focus().deleteRange(range).insertContent('<pre><code class="language-typescript">const hello = "world";\nconsole.log(hello);\n</code></pre>').run();
      } catch (error) {
        // Fallback to simple code block
        editor.chain().focus().deleteRange(range).toggleCodeBlock().run();
      }
    },
  },
  {
    title: 'SQL Code',
    description: 'Insert SQL code',
    icon: 'SQL',
    command: ({ editor, range }) => {
      try {
        editor.chain().focus().deleteRange(range).insertContent('<pre><code class="language-sql">SELECT * FROM users WHERE active = true;</code></pre>').run();
      } catch (error) {
        // Fallback to simple code block
        editor.chain().focus().deleteRange(range).toggleCodeBlock().run();
      }
    },
  },
  {
    title: 'Block Quote',
    description: 'Create a block quote',
    icon: 'Quote',
    command: ({ editor, range }) => {
      try {
        editor.chain().focus().deleteRange(range).toggleBlockquote().run();
      } catch (error) {
        // Fallback to content insertion
        editor.chain().focus().deleteRange(range).insertContent('<blockquote>Quote text here</blockquote>').run();
      }
    },
  },
  {
    title: 'Horizontal Rule',
    description: 'Insert a horizontal rule',
    icon: 'Rule',
    command: ({ editor, range }) => {
      try {
        editor.chain().focus().deleteRange(range).setHorizontalRule().run();
      } catch (error) {
        // Fallback to content insertion
        editor.chain().focus().deleteRange(range).insertContent('<hr>').run();
      }
    },
  },
  {
    title: 'Text Align Left',
    description: 'Align text left',
    icon: 'Align Left',
    command: ({ editor, range }) => {
      try {
        editor.chain().focus().setTextAlign('left').run();
      } catch (error) {
        // Fallback to inline style
        editor.chain().focus().insertContent('<p style="text-align: left;">Aligned text</p>').run();
      }
    },
  },
  {
    title: 'Text Align Center',
    description: 'Align text center',
    icon: 'Align Center',
    command: ({ editor, range }) => {
      try {
        editor.chain().focus().setTextAlign('center').run();
      } catch (error) {
        // Fallback to inline style
        editor.chain().focus().insertContent('<p style="text-align: center;">Aligned text</p>').run();
      }
    },
  },
  {
    title: 'Text Align Right',
    description: 'Align text right',
    icon: 'Align Right',
    command: ({ editor, range }) => {
      try {
        editor.chain().focus().setTextAlign('right').run();
      } catch (error) {
        // Fallback to inline style
        editor.chain().focus().insertContent('<p style="text-align: right;">Aligned text</p>').run();
      }
    },
  },
  {
    title: 'Highlight',
    description: 'Highlight text',
    icon: 'Highlight',
    command: ({ editor, range }) => {
      try {
        editor.chain().focus().toggleHighlight().run();
      } catch (error) {
        // Fallback to inline style
        editor.chain().focus().insertContent('<mark>Highlighted text</mark>').run();
      }
    },
  },
  {
    title: 'Bold',
    description: 'Make text bold',
    icon: 'B',
    command: ({ editor, range }) => {
      editor.chain().focus().toggleBold().run();
    },
  },
  {
    title: 'Italic',
    description: 'Make text italic',
    icon: 'I',
    command: ({ editor, range }) => {
      editor.chain().focus().toggleItalic().run();
    },
  },
  {
    title: 'Strikethrough',
    description: 'Strike through text',
    icon: 'S',
    command: ({ editor, range }) => {
      editor.chain().focus().toggleStrike().run();
    },
  },
  {
    title: 'Link',
    description: 'Add a hyperlink',
    icon: 'L',
    command: ({ editor, range }) => {
      const url = window.prompt('Enter URL:');
      if (url) {
        editor.chain().focus().deleteRange(range).setMark('link', { href: url }).run();
      }
    },
  },
];

export const renderItems = () => {
  let component: any = null;
  let selectedIndex = 0;

  const renderItem = (item: CommandItem, index: number) => {
    const isSelected = index === selectedIndex;
    return `
      <div class="slash-command-item ${isSelected ? 'selected' : ''}" data-index="${index}">
        <div class="icon">${item.icon}</div>
        <div class="content">
          <div class="title">${item.title}</div>
          <div class="description">${item.description}</div>
        </div>
      </div>
    `;
  };

  return {
    onStart: (props: any) => {
      component = document.createElement('div');
      component.className = 'slash-command-popup';
      
      if (props.clientRect) {
        const rect = props.clientRect();
        component.style.top = `${rect.top + window.scrollY}px`;
        component.style.left = `${rect.left + window.scrollX}px`;
        component.style.position = 'absolute';
        component.style.zIndex = '1000';
      }

      document.body.appendChild(component);
    },

    onUpdate: (props: any) => {
      if (component && props.clientRect) {
        const rect = props.clientRect();
        component.style.top = `${rect.top + window.scrollY}px`;
        component.style.left = `${rect.left + window.scrollX}px`;
      }

      if (component) {
        component.innerHTML = `
          <div class="slash-command-list">
            ${props.items.map((item: CommandItem, index: number) => renderItem(item, index)).join('')}
          </div>
        `;
      }
    },

    onKeyDown: (props: any) => {
      if (props.event.key === 'ArrowUp') {
        selectedIndex = Math.max(0, selectedIndex - 1);
        return true;
      }

      if (props.event.key === 'ArrowDown') {
        selectedIndex = Math.min(props.items.length - 1, selectedIndex + 1);
        return true;
      }

      if (props.event.key === 'Enter') {
        const item = props.items[selectedIndex];
        if (item) {
          item.command(props);
        }
        return true;
      }

      if (props.event.key === 'Escape') {
        props.event.preventDefault();
        return true;
      }

      return false;
    },

    onExit: () => {
      if (component) {
        component.remove();
        component = null;
      }
      selectedIndex = 0;
    },
  };
};

export const slashCommandSuggestion: SuggestionOptions = {
  items: ({ query }) => {
    return slashCommands
      .filter(item => item.title.toLowerCase().startsWith(query.toLowerCase()))
      .slice(0, 10);
  },

  render: renderItems,

  allowSpaces: false,
  startOfLine: true,
  char: '/',
  editor: null as any, // Will be set by Tiptap
};
