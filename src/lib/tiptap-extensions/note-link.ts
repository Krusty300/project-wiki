import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import NoteLinkComponent from './NoteLinkComponent';

export interface NoteLinkOptions {
  HTMLAttributes: Record<string, any>;
  onNoteLinkClick?: (noteId: string) => void;
  resolveNoteTitle?: (noteId: string) => string;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    noteLink: {
      setNoteLink: (attributes: { noteId: string; text?: string }) => ReturnType;
      toggleNoteLink: (attributes: { noteId: string; text?: string }) => ReturnType;
      unsetNoteLink: () => ReturnType;
    };
  }
}

export const NoteLink = Node.create<NoteLinkOptions>({
  name: 'noteLink',

  group: 'inline',

  inline: true,

  atom: true,

  addOptions() {
    return {
      HTMLAttributes: {},
      onNoteLinkClick: undefined,
      resolveNoteTitle: undefined,
    };
  },

  addAttributes() {
    return {
      noteId: {
        default: null,
        parseHTML: element => element.getAttribute('data-note-id'),
        renderHTML: attributes => {
          if (!attributes.noteId) {
            return {};
          }
          return { 'data-note-id': attributes.noteId };
        },
      },
      text: {
        default: null,
        parseHTML: element => element.getAttribute('data-text'),
        renderHTML: attributes => {
          if (!attributes.text) {
            return {};
          }
          return { 'data-text': attributes.text };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-type="note-link"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes, node }) {
    return [
      'span',
      mergeAttributes(
        { 'data-type': 'note-link' },
        this.options.HTMLAttributes,
        HTMLAttributes
      ),
      node.attrs.text || `[[${node.attrs.noteId}]]`,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(NoteLinkComponent);
  },

  addCommands() {
    return {
      setNoteLink:
        attributes =>
        ({ chain }) => {
          return chain()
            .insertContent({
              type: this.name,
              attrs: attributes,
            })
            .run();
        },

      toggleNoteLink:
        attributes =>
        ({ chain }) => {
          return chain()
            .insertContent({
              type: this.name,
              attrs: attributes,
            })
            .run();
        },

      unsetNoteLink:
        () =>
        ({ chain }) => {
          return chain()
            .setNode(this.name)
            .run();
        },
    };
  },
});
