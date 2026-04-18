import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';

// Define the list handling functions separately
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

  try {
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
  } catch (error) {
    console.warn('Failed to indent list item:', error);
    return false;
  }
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

  try {
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
  } catch (error) {
    console.warn('Failed to outdent list item:', error);
    return false;
  }
}

function exitList(view: any): boolean {
  const { state } = view;
  const { selection } = state;
  const { $from } = selection;

  const listItem = $from.parent;
  const list = listItem.parent;

  if (!listItem || !list) return false;

  try {
    const tr = state.tr;
    const pos = $from.end();

    // Insert a new paragraph after the list
    const newParagraph = state.schema.nodes.paragraph.create();
    tr.insert(pos, newParagraph);

    // Move cursor to the new paragraph
    const newPos = pos + 1;
    const newSelection = state.tr.selection.constructor.near(tr.doc.resolve(newPos));
    tr.setSelection(newSelection);

    view.dispatch(tr);
    return true;
  } catch (error) {
    console.warn('Failed to exit list:', error);
    return false;
  }
}

export const SimpleNestedLists = Extension.create({
  name: 'simpleNestedLists',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('simpleNestedLists'),
        props: {
          handleKeyDown: (view: any, event: KeyboardEvent) => {
            const { state } = view;
            const { selection } = state;
            const { $from } = selection;

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
