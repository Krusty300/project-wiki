import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { CodeBlockComponent } from './index';

export interface CodeBlockOptions {
  HTMLAttributes: Record<string, any>;
  defaultLanguage?: string;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    customCodeBlock: {
      insertCodeBlock: (code: string, language?: string) => ReturnType;
    };
  }
}

export const CustomCodeBlock = Node.create<CodeBlockOptions>({
  name: 'customCodeBlock',

  group: 'block',

  code: true,

  defining: true,

  addOptions() {
    return {
      defaultLanguage: 'text',
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      language: {
        default: null,
        parseHTML: element => element.getAttribute('data-language'),
        renderHTML: attributes => {
          if (!attributes.language) {
            return {};
          }
          return {
            'data-language': attributes.language,
          };
        },
      },
      code: {
        default: null,
        parseHTML: element => element.textContent || '',
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'pre',
        getAttrs: (element: HTMLElement) => {
          const code = element.querySelector('code');
          return {
            language: code?.getAttribute('data-language') || 'text',
            code: code?.textContent || '',
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes, node }) {
    const language = node.attrs?.language || 'text';
    const code = node.attrs?.code || '';
    
    return `<pre><code class="language-${language}" data-language="${language}">${code}</code></pre>`;
  },

  addNodeView() {
    return ReactNodeViewRenderer(CodeBlockComponent);
  },

  addCommands() {
    return {
      insertCodeBlock:
        (code: string, language?: string) =>
        ({ chain }: { chain: any }) => {
          return chain()
            .insertContent({
              type: this.name,
              attrs: { language, code },
            })
            .run();
        },
    };
  },
});
