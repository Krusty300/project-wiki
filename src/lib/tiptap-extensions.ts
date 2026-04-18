import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { NoteLink } from './tiptap-extensions/note-link';
import { Math } from './tiptap-extensions/math-extension';
import { CustomCodeBlock } from './tiptap-extensions/code-block-extension';
import { SafeBackspace } from './tiptap-extensions/safe-backspace';

export function getExtensions() {
  return [
    StarterKit.configure({
      heading: {
        levels: [1, 2, 3],
      },
      link: {
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-500 hover:text-blue-600 underline cursor-pointer',
        },
      },
    }),
    Placeholder.configure({
      placeholder: ({ node }) => {
        if (node.type.name === 'heading') {
          return `Heading ${node.attrs.level}`;
        }
        return "Start typing your note... or type '/' for formatting options or [[note-name]] to link notes";
      },
    }),
    SafeBackspace,
    NoteLink.configure({
      HTMLAttributes: {
        class: 'note-link',
      },
    }),
    Table.configure({
      resizable: true,
    }),
    TableRow,
    TableHeader,
    TableCell,
    TaskList.configure({
      HTMLAttributes: {
        class: 'not-prose pl-6',
      },
    }),
    TaskItem.configure({
      HTMLAttributes: {
        class: 'flex items-start my-1',
      },
      nested: true,
    }),
    CustomCodeBlock,
    Math,
  ];
}
