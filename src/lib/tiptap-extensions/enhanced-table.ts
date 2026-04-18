import { Node, mergeAttributes, RawCommands } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { Table as TableNode } from '@tiptap/extension-table';
// @ts-ignore
import EnhancedTableComponent from './components/EnhancedTableComponent';

export const EnhancedTable = TableNode.extend({
  name: 'enhancedTable',

  addAttributes() {
    return {
      ...this.parent?.(),
      sortable: {
        default: true,
        parseHTML: element => element.getAttribute('data-sortable') === 'true',
        renderHTML: attributes => ({
          'data-sortable': attributes.sortable,
        }),
      },
      resizable: {
        default: true,
        parseHTML: element => element.getAttribute('data-resizable') === 'true',
        renderHTML: attributes => ({
          'data-resizable': attributes.resizable,
        }),
      },
      columnWidths: {
        default: null,
        parseHTML: element => {
          const widths = element.getAttribute('data-column-widths');
          return widths ? JSON.parse(widths) : null;
        },
        renderHTML: attributes => {
          if (!attributes.columnWidths) return {};
          return {
            'data-column-widths': JSON.stringify(attributes.columnWidths),
          };
        },
      },
      sortState: {
        default: null,
        parseHTML: element => {
          const sortState = element.getAttribute('data-sort-state');
          return sortState ? JSON.parse(sortState) : null;
        },
        renderHTML: attributes => {
          if (!attributes.sortState) return {};
          return {
            'data-sort-state': JSON.stringify(attributes.sortState),
          };
        },
      },
    };
  },

  renderHTML({ HTMLAttributes, node }) {
    return [
      'div',
      {
        class: 'enhanced-table-wrapper',
        'data-type': 'enhanced-table',
      },
      [
        'table',
        mergeAttributes(
          { 'data-type': 'table' },
          this.options.HTMLAttributes,
          HTMLAttributes,
          {
            class: `enhanced-table ${node.attrs.sortable ? 'sortable' : ''} ${node.attrs.resizable ? 'resizable' : ''}`,
          }
        ),
        0,
      ],
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(EnhancedTableComponent);
  },

  addCommands() {
    return {
      ...this.parent?.(),
      setEnhancedTable: (attributes = {}) => ({ commands }: { commands: RawCommands }) => {
        return commands.insertContent({
          type: this.name,
          attrs: attributes,
          content: [
            {
              type: 'tableRow',
              content: [
                {
                  type: 'tableCell',
                  content: [{ type: 'paragraph', content: [] }],
                },
                {
                  type: 'tableCell',
                  content: [{ type: 'paragraph', content: [] }],
                },
              ],
            },
            {
              type: 'tableRow',
              content: [
                {
                  type: 'tableCell',
                  content: [{ type: 'paragraph', content: [] }],
                },
                {
                  type: 'tableCell',
                  content: [{ type: 'paragraph', content: [] }],
                },
              ],
            },
          ],
        });
      },
      addTableRow: () => ({ commands, state }: { commands: RawCommands; state: any }) => {
        const { selection } = state;
        const { $from } = selection;
        
        const table = $from.node(-1);
        if (!table || table.type.name !== this.name) return false;

        const rowCount = table.content.childCount;
        const colCount = table.content.child(0)?.content.childCount || 2;

        const newRow = state.schema.nodes.tableRow.create(
          {},
          Array.from({ length: colCount }, () => 
            state.schema.nodes.tableCell.create({}, [
              state.schema.nodes.paragraph.create()
            ])
          )
        );

        return commands.command(({ tr }) => {
          const insertPos = $from.end();
          tr.insert(insertPos, newRow);
          return true;
        });
      },
      addTableColumn: () => ({ commands, state }: { commands: RawCommands; state: any }) => {
        const { selection } = state;
        const { $from } = selection;
        
        const table = $from.node(-1);
        if (!table || table.type.name !== this.name) return false;

        return commands.command(({ tr }) => {
          table.content.forEach((row: any) => {
            const newCell = state.schema.nodes.tableCell.create({}, [
              state.schema.nodes.paragraph.create()
            ]);
            const insertPos = row.pos + row.nodeSize - 1;
            tr.insert(insertPos, newCell);
          });
          return true;
        });
      },
      deleteTableRow: () => ({ commands, state }: { commands: RawCommands; state: any }) => {
        const { selection } = state;
        const { $from } = selection;
        
        const table = $from.node(-1);
        const row = $from.node(-2);
        
        if (!table || table.type.name !== this.name) return false;
        if (!row || row.type.name !== 'tableRow') return false;
        
        // Don't delete if it's the only row
        if (table.content.childCount <= 1) return false;

        return commands.command(({ tr }) => {
          tr.delete(row.pos, row.pos + row.nodeSize);
          return true;
        });
      },
      deleteTableColumn: () => ({ commands, state }: { commands: RawCommands; state: any }) => {
        const { selection } = state;
        const { $from } = selection;
        
        const table = $from.node(-1);
        const cell = $from.node(-3);
        
        if (!table || table.type.name !== this.name) return false;
        if (!cell || cell.type.name !== 'tableCell') return false;
        
        // Don't delete if it's the only column
        const firstRow = table.content.child(0);
        if (firstRow.content.childCount <= 1) return false;

        // Find column index
        const row = $from.node(-2);
        const colIndex = row.content.indexOf(cell);

        return commands.command(({ tr }) => {
          table.content.forEach((row: any) => {
            const targetCell = row.content.child(colIndex);
            if (targetCell) {
              tr.delete(targetCell.pos, targetCell.pos + targetCell.nodeSize);
            }
          });
          return true;
        });
      },
      mergeTableCells: () => ({ commands, state }: { commands: RawCommands; state: any }) => {
        // Complex merge implementation would go here
        // For now, just return false
        return false;
      },
      sortTableColumn: (columnIndex: number, direction: 'asc' | 'desc') => ({ commands, state, tr }: { commands: RawCommands; state: any; tr: any }) => {
        const { selection } = state;
        const { $from } = selection;
        
        const table = $from.node(-1);
        if (!table || table.type.name !== this.name) return false;

        return commands.command(({ tr }) => {
          const rows = Array.from(table.content);
          const headerRow = rows[0];
          const dataRows = rows.slice(1);

          if (dataRows.length === 0) return true;

          // Sort data rows based on the specified column
          const sortedRows = dataRows.sort((a: any, b: any) => {
            const cellA = a.content.child(columnIndex);
            const cellB = b.content.child(columnIndex);
            
            const textA = cellA?.content?.child(0)?.text || '';
            const textB = cellB?.content?.child(0)?.text || '';
            
            const comparison = textA.localeCompare(textB);
            return direction === 'asc' ? comparison : -comparison;
          });

          // Rebuild table with sorted rows
          const newContent = [headerRow, ...sortedRows];
          
          const newTable = state.schema.nodes[this.name].create(
            table.attrs,
            newContent
          );

          const startPos = table.pos;
          const endPos = table.pos + table.nodeSize;
          
          tr.replaceWith(startPos, endPos, newTable);
          
          // Update sort state
          const sortState = { column: columnIndex, direction };
          tr.setNodeMarkup(startPos, null, {
            ...table.attrs,
            sortState,
          });

          return true;
        });
      },
    };
  },
});

export const EnhancedTableRow = Node.create({
  name: 'enhancedTableRow',
  group: 'tableRow',
  content: '(enhancedTableCell | tableCell)+',
  isolating: true,
  parseHTML() {
    return [{ tag: 'tr' }];
  },
  renderHTML() {
    return ['tr', 0];
  },
});

export const EnhancedTableCell = Node.create({
  name: 'enhancedTableCell',
  group: 'tableCell',
  content: 'block+',
  isolating: true,
  addAttributes() {
    return {
      colspan: {
        default: 1,
        parseHTML: element => {
          const colspan = element.getAttribute('colspan');
          return colspan ? parseInt(colspan, 10) : 1;
        },
        renderHTML: attributes => {
          if (attributes.colspan === 1) return {};
          return { colspan: attributes.colspan };
        },
      },
      rowspan: {
        default: 1,
        parseHTML: element => {
          const rowspan = element.getAttribute('rowspan');
          return rowspan ? parseInt(rowspan, 10) : 1;
        },
        renderHTML: attributes => {
          if (attributes.rowspan === 1) return {};
          return { rowspan: attributes.rowspan };
        },
      },
      backgroundColor: {
        default: null,
        parseHTML: element => element.getAttribute('data-bg-color'),
        renderHTML: attributes => {
          if (!attributes.backgroundColor) return {};
          return { 'data-bg-color': attributes.backgroundColor };
        },
      },
      alignment: {
        default: 'left',
        parseHTML: element => element.getAttribute('data-align') || 'left',
        renderHTML: attributes => {
          if (!attributes.alignment || attributes.alignment === 'left') return {};
          return { 'data-align': attributes.alignment };
        },
      },
    };
  },
  parseHTML() {
    return [{ tag: 'td' }, { tag: 'th' }];
  },
  renderHTML({ HTMLAttributes, node }) {
    const tag = node.attrs.colspan > 1 || node.attrs.rowspan > 1 ? 'th' : 'td';
    
    return [
      tag,
      mergeAttributes(
        HTMLAttributes,
        {
          class: `enhanced-table-cell enhanced-table-cell-${node.attrs.alignment || 'left'}`,
          style: node.attrs.backgroundColor ? `background-color: ${node.attrs.backgroundColor}` : undefined,
        }
      ),
      0,
    ];
  },
});
