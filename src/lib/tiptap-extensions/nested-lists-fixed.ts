import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';

// Helper functions
function indentListItem(view: any): boolean {
  const { state } = view;
  const { selection } = state;
  const { $from } = selection;

  const listItem = $from.parent;
  const list = listItem.parent;

  if (!listItem || !list) return false;

  // Check if we can indent (not too deep)
  if ((listItem.attrs.level || 0) >= 8) return false; // Max 8 levels deep

  // Find the previous list item to nest under
  const prevListItem = list.content.childBefore(listItem);
  if (!prevListItem) return false;

  const tr = state.tr;
  const newListType = list.type.name === 'bulletList' ? 'bulletList' : 'orderedList';

  // Create a new nested list
  const nestedList = state.schema.nodes[newListType].create(
    list.attrs,
    state.schema.nodes[listItem.type.name].create(
      { ...listItem.attrs, level: (listItem.attrs.level || 0) + 1 },
      listItem.content
    )
  );

  // Replace the previous list item with one that contains the nested list
  const newPrevItem = state.schema.nodes[listItem.type.name].create(
    prevListItem.attrs,
    prevListItem.content.concat([nestedList])
  );

  // Update the transaction
  const startPos = prevListItem.pos;
  const endPos = listItem.pos + listItem.nodeSize;

  tr.replaceWith(startPos, endPos, newPrevItem);

  view.dispatch(tr);
  return true;
}

function outdentListItem(view: any): boolean {
  const { state } = view;
  const { selection } = state;
  const { $from } = selection;

  const listItem = $from.parent;
  const list = listItem.parent;

  if (!listItem || !list) return false;

  // Check if we're already at the top level
  if ((listItem.attrs.level || 0) <= 0) return false;

  const tr = state.tr;

  // Decrease the level
  const newListItem = state.schema.nodes[listItem.type.name].create(
    { ...listItem.attrs, level: Math.max(0, (listItem.attrs.level || 0) - 1) },
    listItem.content
  );

  // Replace the list item
  tr.replaceWith(listItem.pos, listItem.pos + listItem.nodeSize, newListItem);

  view.dispatch(tr);
  return true;
}

function exitList(view: any): boolean {
  const { state } = view;
  const { selection } = state;
  const { $from } = selection;

  const listItem = $from.parent;
  const list = listItem.parent;

  if (!listItem || !list) return false;

  const tr = state.tr;
  const pos = $from.end();

  // Insert a new paragraph after the list
  const newParagraph = state.schema.nodes.paragraph.create();
  tr.insert(pos, newParagraph);

  // Move cursor to the new paragraph
  const newPos = pos + 1;
  tr.setSelection(state.tr.selection.constructor.near(tr.doc.resolve(newPos)));

  view.dispatch(tr);
  return true;
}

export const NestedLists = Extension.create({
  name: 'nestedLists',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('nestedLists'),
        props: {
          handleKeyDown: (view: any, event: KeyboardEvent) => {
            const { state } = view;
            const { selection, doc } = state;
            const { $from, $to } = selection;

            // Handle Tab and Shift+Tab for list indentation
            if (event.key === 'Tab') {
              event.preventDefault();
              
              if (event.shiftKey) {
                // Shift+Tab: Outdent list item
                return outdentListItem(view);
              } else {
                // Tab: Indent list item
                return indentListItem(view);
              }
            }

            // Handle Enter for list continuation
            if (event.key === 'Enter' && !event.shiftKey) {
              const listItem = $from.parent;
              
              if (listItem && (listItem.type.name === 'listItem' || listItem.type.name === 'taskItem')) {
                // Check if we're at the end of an empty list item
                const isEmpty = listItem.content.size === 0;
                
                if (isEmpty) {
                  // Exit list on empty item
                  event.preventDefault();
                  return exitList(view);
                }
              }
            }

            return false;
          },
        },
      }),
    ];
  },

  addCommands() {
    return {
      ...this.parent?.(),
      indentList: () => ({ commands, state }: any) => {
        const { selection } = state;
        const { $from } = selection;

        const listItem = $from.parent;
        if (!listItem || (listItem.type.name !== 'listItem' && listItem.type.name !== 'taskItem')) {
          return false;
        }

        return true;
      },

      outdentList: () => ({ commands, state }: any) => {
        const { selection } = state;
        const { $from } = selection;

        const listItem = $from.parent;
        if (!listItem || (listItem.type.name !== 'listItem' && listItem.type.name !== 'taskItem')) {
          return false;
        }

        return true;
      },

      toggleListType: (listType: 'bulletList' | 'orderedList' | 'taskList') => ({ commands, state, tr }: any) => {
        const { selection } = state;
        const { $from } = selection;

        const listItem = $from.parent;
        const list = listItem.parent;

        if (!listItem || !list) return false;

        // Convert between list types
        let targetListType;
        let targetItemType;

        switch (listType) {
          case 'bulletList':
            targetListType = state.schema.nodes.bulletList;
            targetItemType = state.schema.nodes.listItem;
            break;
          case 'orderedList':
            targetListType = state.schema.nodes.orderedList;
            targetItemType = state.schema.nodes.listItem;
            break;
          case 'taskList':
            targetListType = state.schema.nodes.taskList;
            targetItemType = state.schema.nodes.taskItem;
            break;
          default:
            return false;
        }

        // Create new list with same content but different type
        const newList = targetListType.create(
          list.attrs,
          list.content.map((item: any) => {
            if (item.type.name === 'listItem' || item.type.name === 'taskItem') {
              return targetItemType.create(item.attrs, item.content);
            }
            return item;
          })
        );

        const startPos = list.pos;
        const endPos = list.pos + list.nodeSize;

        tr.replaceWith(startPos, endPos, newList);

        return true;
      },

      increaseListLevel: () => ({ commands, state, tr }: any) => {
        const { selection } = state;
        const { $from } = selection;

        const listItem = $from.parent;
        if (!listItem || (listItem.type.name !== 'listItem' && listItem.type.name !== 'taskItem')) {
          return false;
        }

        const currentLevel = listItem.attrs.level || 0;
        if (currentLevel >= 8) return false; // Max 8 levels

        const newListItem = listItem.type.create(
          { ...listItem.attrs, level: currentLevel + 1 },
          listItem.content
        );

        tr.replaceWith(listItem.pos, listItem.pos + listItem.nodeSize, newListItem);

        return true;
      },

      decreaseListLevel: () => ({ commands, state, tr }: any) => {
        const { selection } = state;
        const { $from } = selection;

        const listItem = $from.parent;
        if (!listItem || (listItem.type.name !== 'listItem' && listItem.type.name !== 'taskItem')) {
          return false;
        }

        const currentLevel = listItem.attrs.level || 0;
        if (currentLevel <= 0) return false;

        const newListItem = listItem.type.create(
          { ...listItem.attrs, level: currentLevel - 1 },
          listItem.content
        );

        tr.replaceWith(listItem.pos, listItem.pos + listItem.nodeSize, newListItem);

        return true;
      },
    };
  },
});

// List level utilities
export function getListLevel(node: any): number {
  return node.attrs.level || 0;
}

export function canIncreaseListLevel(node: any): boolean {
  return getListLevel(node) < 8;
}

export function canDecreaseListLevel(node: any): boolean {
  return getListLevel(node) > 0;
}

export function getListDepth(node: any): number {
  let depth = 0;
  let current = node;

  while (current && (current.type.name === 'listItem' || current.type.name === 'taskItem')) {
    depth++;
    current = current.parent;
  }

  return depth;
}
