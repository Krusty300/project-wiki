import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { MathComponent } from './index'; // Math component for inline math rendering

export interface MathOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    math: {
      insertMath: (math: string) => ReturnType;
    };
  }
}

export const Math = Node.create<MathOptions>({
  name: 'math',

  group: 'inline',

  inline: true,

  atom: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      math: {
        default: null,
        parseHTML: element => element.getAttribute('data-math'),
        renderHTML: attributes => {
          if (!attributes.math) {
            return {};
          }
          return {
            'data-math': attributes.math,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-math]',
        getAttrs: (element: HTMLElement) => {
          return {
            math: element.getAttribute('data-math') || '',
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    if (!HTMLAttributes.math) {
      return '';
    }

    return `<span class="math-inline" data-math="${HTMLAttributes.math}">${HTMLAttributes.math}</span>`;
  },

  addNodeView() {
    return ReactNodeViewRenderer(MathComponent);
  },

  addCommands() {
    return {
      insertMath:
        (math: string) =>
        ({ chain }: { chain: any }) => {
          return chain()
            .insertContent({
              type: this.name,
              attrs: { math },
            })
            .run();
        },
    };
  },
});
