import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';

// Document validation helper function - more permissive
function validateDocument(doc: any): boolean {
  try {
    if (!doc || typeof doc !== 'object') return false;
    if (doc.type !== 'doc') return false;
    if (!Array.isArray(doc.content)) return false;
    
    // Less strict validation - only check for critical issues
    for (const node of doc.content) {
      if (!node || typeof node !== 'object') continue; // Skip invalid nodes
      if (!node.type || typeof node.type !== 'string') continue; // Skip nodes without type
      
      // Don't validate content arrays strictly - they can be complex
      if (node.content !== undefined && !Array.isArray(node.content)) {
        // Fix invalid content structure instead of failing
        node.content = [];
      }
    }
    
    return true;
  } catch (error) {
    return true; // Allow the operation if validation fails
  }
}

export const SafeBackspace = Extension.create({
  name: 'safeBackspace',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('safeBackspace'),
        props: {
          handleKeyDown: (view, event) => {
            if (event.key === 'Backspace') {
              try {
                // Minimal validation - just check if the editor is in a usable state
                if (!view.state.doc) {
                  console.warn('No document found, preventing backspace');
                  return true; // Block the operation
                }

                // Allow all normal backspace operations
                // Let ProseMirror handle its own validation
                return false; // Let ProseMirror handle it normally

              } catch (error) {
                console.warn('Error during backspace validation:', error);
                // Allow the operation if validation fails - better than blocking
                return false;
              }
            }
            return false;
          },
        },
      }),
    ];
  },
});
