import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
// @ts-ignore
import PullQuoteComponent from './components/PullQuoteComponent';
// @ts-ignore
import CalloutComponent from './components/CalloutComponent';
// @ts-ignore
import InfoBoxComponent from './components/InfoBoxComponent';

// Pull Quote Extension
export const PullQuote = Node.create({
  name: 'pullQuote',

  group: 'block',

  content: 'block+',

  isolating: true,

  addAttributes() {
    return {
      alignment: {
        default: 'left',
        parseHTML: element => element.getAttribute('data-alignment') || 'left',
        renderHTML: attributes => {
          if (!attributes.alignment) return {};
          return { 'data-alignment': attributes.alignment };
        },
      },
      citation: {
        default: null,
        parseHTML: element => element.getAttribute('data-citation'),
        renderHTML: attributes => {
          if (!attributes.citation) return {};
          return { 'data-citation': attributes.citation };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="pull-quote"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes, node }) {
    return [
      'div',
      mergeAttributes(
        { 'data-type': 'pull-quote' },
        this.options.HTMLAttributes,
        HTMLAttributes,
        {
          class: `pull-quote pull-quote-${node.attrs.alignment || 'left'}`,
        }
      ),
      0,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(PullQuoteComponent);
  },

  });

// Callout Extension
export const Callout = Node.create({
  name: 'callout',

  group: 'block',

  content: 'block+',

  isolating: true,

  addAttributes() {
    return {
      type: {
        default: 'info',
        parseHTML: element => element.getAttribute('data-type') || 'info',
        renderHTML: attributes => {
          if (!attributes.type) return {};
          return { 'data-type': attributes.type };
        },
      },
      title: {
        default: null,
        parseHTML: element => element.getAttribute('data-title'),
        renderHTML: attributes => {
          if (!attributes.title) return {};
          return { 'data-title': attributes.title };
        },
      },
      icon: {
        default: null,
        parseHTML: element => element.getAttribute('data-icon'),
        renderHTML: attributes => {
          if (!attributes.icon) return {};
          return { 'data-icon': attributes.icon };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="callout"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes, node }) {
    const calloutType = node.attrs.type || 'info';
    return [
      'div',
      mergeAttributes(
        { 'data-type': 'callout' },
        this.options.HTMLAttributes,
        HTMLAttributes,
        {
          class: `callout callout-${calloutType}`,
        }
      ),
      0,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(CalloutComponent);
  },

  });

// Info Box Extension
export const InfoBox = Node.create({
  name: 'infoBox',

  group: 'block',

  content: 'block+',

  isolating: true,

  addAttributes() {
    return {
      variant: {
        default: 'default',
        parseHTML: element => element.getAttribute('data-variant') || 'default',
        renderHTML: attributes => {
          if (!attributes.variant) return {};
          return { 'data-variant': attributes.variant };
        },
      },
      title: {
        default: null,
        parseHTML: element => element.getAttribute('data-title'),
        renderHTML: attributes => {
          if (!attributes.title) return {};
          return { 'data-title': attributes.title };
        },
      },
      collapsible: {
        default: false,
        parseHTML: element => element.getAttribute('data-collapsible') === 'true',
        renderHTML: attributes => {
          if (!attributes.collapsible) return {};
          return { 'data-collapsible': attributes.collapsible };
        },
      },
      collapsed: {
        default: false,
        parseHTML: element => element.getAttribute('data-collapsed') === 'true',
        renderHTML: attributes => {
          if (!attributes.collapsed) return {};
          return { 'data-collapsed': attributes.collapsed };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="info-box"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes, node }) {
    const variant = node.attrs.variant || 'default';
    const classes = [`info-box`, `info-box-${variant}`];
    
    if (node.attrs.collapsible) {
      classes.push('info-box-collapsible');
    }
    
    if (node.attrs.collapsed) {
      classes.push('info-box-collapsed');
    }

    return [
      'div',
      mergeAttributes(
        { 'data-type': 'info-box' },
        this.options.HTMLAttributes,
        HTMLAttributes,
        {
          class: classes.join(' '),
        }
      ),
      0,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(InfoBoxComponent);
  },

  });

// Slash command integration
export const blockFormatCommands = [
  {
    title: 'Pull Quote',
    description: 'Add a pull quote for emphasis',
    icon: 'quote',
    command: ({ editor, range }: { editor: any; range: any }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .setNode('pullQuote', {})
        .run();
    },
  },
  {
    title: 'Info Callout',
    description: 'Add an informational callout',
    icon: 'info',
    command: ({ editor, range }: { editor: any; range: any }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .setNode('callout', { type: 'info' })
        .run();
    },
  },
  {
    title: 'Warning Callout',
    description: 'Add a warning callout',
    icon: 'warning',
    command: ({ editor, range }: { editor: any; range: any }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .setNode('callout', { type: 'warning' })
        .run();
    },
  },
  {
    title: 'Success Callout',
    description: 'Add a success callout',
    icon: 'check',
    command: ({ editor, range }: { editor: any; range: any }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .setNode('callout', { type: 'success' })
        .run();
    },
  },
  {
    title: 'Error Callout',
    description: 'Add an error callout',
    icon: 'x',
    command: ({ editor, range }: { editor: any; range: any }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .setNode('callout', { type: 'error' })
        .run();
    },
  },
  {
    title: 'Info Box',
    description: 'Add an expandable info box',
    icon: 'box',
    command: ({ editor, range }: { editor: any; range: any }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .setNode('infoBox', { variant: 'default', collapsible: true })
        .run();
    },
  },
];
