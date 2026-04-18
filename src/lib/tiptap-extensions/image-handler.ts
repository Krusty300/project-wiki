import { Node, mergeAttributes, RawCommands } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
// @ts-ignore
import ImageComponent from './components/ImageComponent';

export const ImageHandler = Node.create({
  name: 'imageHandler',

  group: 'block',

  atom: true,

  draggable: true,

  addAttributes() {
    return {
      src: {
        default: null,
        parseHTML: element => element.getAttribute('src'),
        renderHTML: attributes => {
          if (!attributes.src) return {};
          return { src: attributes.src };
        },
      },
      alt: {
        default: null,
        parseHTML: element => element.getAttribute('alt'),
        renderHTML: attributes => {
          if (!attributes.alt) return {};
          return { alt: attributes.alt };
        },
      },
      title: {
        default: null,
        parseHTML: element => element.getAttribute('title'),
        renderHTML: attributes => {
          if (!attributes.title) return {};
          return { title: attributes.title };
        },
      },
      width: {
        default: null,
        parseHTML: element => {
          const width = element.getAttribute('width');
          return width ? parseInt(width, 10) : null;
        },
        renderHTML: attributes => {
          if (!attributes.width) return {};
          return { width: attributes.width };
        },
      },
      height: {
        default: null,
        parseHTML: element => {
          const height = element.getAttribute('height');
          return height ? parseInt(height, 10) : null;
        },
        renderHTML: attributes => {
          if (!attributes.height) return {};
          return { height: attributes.height };
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
      caption: {
        default: null,
        parseHTML: element => element.getAttribute('data-caption'),
        renderHTML: attributes => {
          if (!attributes.caption) return {};
          return { 'data-caption': attributes.caption };
        },
      },
      borderRadius: {
        default: 0,
        parseHTML: element => {
          const radius = element.getAttribute('data-border-radius');
          return radius ? parseInt(radius, 10) : 0;
        },
        renderHTML: attributes => {
          if (!attributes.borderRadius || attributes.borderRadius === 0) return {};
          return { 'data-border-radius': attributes.borderRadius };
        },
      },
      opacity: {
        default: 100,
        parseHTML: element => {
          const opacity = element.getAttribute('data-opacity');
          return opacity ? parseInt(opacity, 10) : 100;
        },
        renderHTML: attributes => {
          if (!attributes.opacity || attributes.opacity === 100) return {};
          return { 'data-opacity': attributes.opacity };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'img[src]',
      },
      {
        tag: 'div[data-type="image-handler"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes, node }) {
    const { width, height, alignment, borderRadius, opacity } = node.attrs;
    
    const style: Record<string, string> = {};
    if (width) style.width = `${width}px`;
    if (height) style.height = `${height}px`;
    if (borderRadius) style.borderRadius = `${borderRadius}px`;
    if (opacity && opacity !== 100) style.opacity = (opacity / 100).toString();

    const content = [
      [
        'img',
        {
          src: node.attrs.src,
          alt: node.attrs.alt || '',
          title: node.attrs.title || '',
          style: 'max-width: 100%; height: auto;',
        },
      ]
    ];

    if (node.attrs.caption) {
      content.push([
        'div',
        { class: 'image-caption' },
        node.attrs.caption,
      ]);
    }

    return [
      'div',
      mergeAttributes(
        { 'data-type': 'image-handler' },
        this.options.HTMLAttributes,
        HTMLAttributes,
        {
          class: `image-handler image-handler-${alignment || 'left'}`,
          style: Object.keys(style).length > 0 ? Object.entries(style).map(([k, v]) => `${k}: ${v}`).join('; ') : undefined,
        }
      ),
      ...content,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageComponent);
  },

  addCommands() {
    return {
      ...this.parent?.(),
      setImage: (options: { src: string; alt?: string; title?: string; width?: number; height?: number }) => ({ commands }: { commands: any }) => {
        return commands.insertContent({
          type: this.name,
          attrs: options,
        });
      },

      setImageAlignment: (alignment: 'left' | 'center' | 'right') => ({ commands, state }: { commands: any; state: any }) => {
        const { selection } = state;
        const { $from } = selection;
        
        const image = $from.node();
        if (image.type.name !== this.name) return false;

        return commands.command(({ tr }: { tr: any }) => {
          tr.setNodeMarkup($from.before(), null, {
            ...image.attrs,
            alignment,
          });
          return true;
        });
      },

      setImageSize: (width?: number, height?: number) => ({ commands, state }: { commands: any; state: any }) => {
        const { selection } = state;
        const { $from } = selection;
        
        const image = $from.node();
        if (image.type.name !== this.name) return false;

        return commands.command(({ tr }: { tr: any }) => {
          tr.setNodeMarkup($from.before(), null, {
            ...image.attrs,
            width: width || image.attrs.width,
            height: height || image.attrs.height,
          });
          return true;
        });
      },

      setImageCaption: (caption: string) => ({ commands, state }: { commands: any; state: any }) => {
        const { selection } = state;
        const { $from } = selection;
        
        const image = $from.node();
        if (image.type.name !== this.name) return false;

        return commands.command(({ tr }: { tr: any }) => {
          tr.setNodeMarkup($from.before(), null, {
            ...image.attrs,
            caption,
          });
          return true;
        });
      },

      setImageStyle: (styles: { borderRadius?: number; opacity?: number }) => ({ commands, state }: { commands: any; state: any }) => {
        const { selection } = state;
        const { $from } = selection;
        
        const image = $from.node();
        if (image.type.name !== this.name) return false;

        return commands.command(({ tr }: { tr: any }) => {
          tr.setNodeMarkup($from.before(), null, {
            ...image.attrs,
            borderRadius: styles.borderRadius ?? image.attrs.borderRadius,
            opacity: styles.opacity ?? image.attrs.opacity,
          });
          return true;
        });
      },
    };
  },
});

// Drag and drop plugin
export const ImageDragDropPlugin = {
  props: {
    handleDOMEvents: {
      dragover: (view: any, event: DragEvent) => {
        if (!event.dataTransfer) return false;

        // Check if files are being dragged
        const hasFiles = event.dataTransfer.types.includes('Files');
        if (hasFiles) {
          event.preventDefault();
          return true;
        }

        return false;
      },
      drop: (view: any, event: DragEvent) => {
        if (!event.dataTransfer) return false;

        const files = Array.from(event.dataTransfer.files);
        const imageFiles = files.filter(file => file.type.startsWith('image/'));

        if (imageFiles.length === 0) return false;

        event.preventDefault();

        // Process each image file
        imageFiles.forEach(file => {
          const reader = new FileReader();
          reader.onload = (e) => {
            const src = e.target?.result as string;
            const { state } = view;
            const { selection } = state;
            const { $from } = selection;

            const imageNode = state.schema.nodes.imageHandler.create({
              src,
              alt: file.name,
              title: file.name,
            });

            const tr = state.tr;
            tr.insert($from.pos, imageNode);
            view.dispatch(tr);
          };
          reader.readAsDataURL(file);
        });

        return true;
      },
    },
  },
};

// Paste handler for images
export const ImagePastePlugin = {
  props: {
    handlePaste: (view: any, event: ClipboardEvent, slice: any) => {
      const items = Array.from(event.clipboardData?.items || []);
      const imageItems = items.filter(item => item.type.startsWith('image/'));

      if (imageItems.length === 0) return false;

      // Handle image paste
      imageItems.forEach(item => {
        const file = item.getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = (e) => {
            const src = e.target?.result as string;
            const { state } = view;
            const { selection } = state;
            const { $from } = selection;

            const imageNode = state.schema.nodes.imageHandler.create({
              src,
              alt: 'Pasted image',
              title: 'Pasted image',
            });

            const tr = state.tr;
            tr.insert($from.pos, imageNode);
            view.dispatch(tr);
          };
          reader.readAsDataURL(file);
        }
      });

      return true;
    },
  },
};
