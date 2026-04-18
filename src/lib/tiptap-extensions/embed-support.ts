import { Node, mergeAttributes, RawCommands } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
// @ts-ignore
import EmbedComponent from './components/EmbedComponent';

export interface EmbedData {
  type: 'youtube' | 'twitter' | 'codepen' | 'vimeo' | 'spotify' | 'soundcloud' | 'github' | 'iframe';
  url: string;
  embedId?: string;
  title?: string;
  description?: string;
  thumbnail?: string;
  width?: number;
  height?: number;
  aspectRatio?: string;
  autoplay?: boolean;
  loop?: boolean;
  controls?: boolean;
  startTime?: number;
  endTime?: number;
}

// Helper function for rendering embed content
function renderEmbedContent(embedData: EmbedData): any[] {
  const { type, url, embedId, width, height, autoplay, controls, startTime } = embedData;

  switch (type) {
    case 'youtube':
      return [
        'iframe',
        {
          src: `https://www.youtube.com/embed/${embedId}?${new URLSearchParams({
            autoplay: autoplay ? '1' : '0',
            start: startTime?.toString() || '0',
            controls: controls ? '1' : '0',
          }).toString()}`,
          width: width || 640,
          height: height || 360,
          frameborder: '0',
          allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture',
          allowfullscreen: true,
        },
      ];

    case 'vimeo':
      return [
        'iframe',
        {
          src: `https://player.vimeo.com/video/${embedId}?${new URLSearchParams({
            autoplay: autoplay ? '1' : '0',
            byline: '0',
            portrait: '0',
            title: '0',
          }).toString()}`,
          width: width || 640,
          height: height || 360,
          frameborder: '0',
          allow: 'autoplay; fullscreen; picture-in-picture',
          allowfullscreen: true,
        },
      ];

    case 'twitter':
      return [
        'blockquote',
        {
          class: 'twitter-tweet',
          'data-theme': 'light',
        },
        [
          'a',
          {
            href: url,
          },
          `View tweet on Twitter`,
        ],
      ];

    case 'codepen':
      return [
        'iframe',
        {
          src: `https://codepen.io/embed/${embedId}?default-tab=result`,
          width: width || 640,
          height: height || 360,
          frameborder: '0',
          allowfullscreen: true,
        },
      ];

    case 'spotify':
      return [
        'iframe',
        {
          src: `https://open.spotify.com/embed/${embedId}`,
          width: width || 300,
          height: height || 152,
          frameborder: '0',
          allow: 'encrypted-media',
          allowtransparency: 'true',
        },
      ];

    case 'github':
      return [
        'iframe',
        {
          src: `https://github.com/${embedId}`,
          width: width || 640,
          height: height || 360,
          frameborder: '0',
        },
      ];

    case 'iframe':
    default:
      return [
        'iframe',
        {
          src: url,
          width: width || 640,
          height: height || 360,
          frameborder: '0',
        },
      ];
  }
}

export const EmbedSupport: any = Node.create({
  name: 'embedSupport',

  group: 'block',

  atom: true,

  draggable: true,

  isolating: true,

  addAttributes() {
    return {
      embedData: {
        default: null,
        parseHTML: element => {
          const data = element.getAttribute('data-embed');
          return data ? JSON.parse(data) : null;
        },
        renderHTML: attributes => {
          if (!attributes.embedData) return {};
          return { 'data-embed': JSON.stringify(attributes.embedData) };
        },
      },
      url: {
        default: null,
        parseHTML: element => element.getAttribute('data-url'),
        renderHTML: attributes => {
          if (!attributes.url) return {};
          return { 'data-url': attributes.url };
        },
      },
      type: {
        default: 'iframe',
        parseHTML: element => element.getAttribute('data-type') || 'iframe',
        renderHTML: attributes => {
          if (!attributes.type) return {};
          return { 'data-type': attributes.type };
        },
      },
      width: {
        default: 640,
        parseHTML: element => {
          const width = element.getAttribute('data-width');
          return width ? parseInt(width, 10) : 640;
        },
        renderHTML: attributes => {
          if (!attributes.width) return {};
          return { 'data-width': attributes.width };
        },
      },
      height: {
        default: 360,
        parseHTML: element => {
          const height = element.getAttribute('data-height');
          return height ? parseInt(height, 10) : 360;
        },
        renderHTML: attributes => {
          if (!attributes.height) return {};
          return { 'data-height': attributes.height };
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
      caption: {
        default: null,
        parseHTML: element => element.getAttribute('data-caption'),
        renderHTML: attributes => {
          if (!attributes.caption) return {};
          return { 'data-caption': attributes.caption };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="embed-support"]',
      },
      {
        tag: 'iframe[data-embed]',
      },
    ];
  },

  renderHTML({ HTMLAttributes, node }) {
    const embedData = node.attrs.embedData;
    const { width, height, caption } = node.attrs;

    if (embedData) {
      return [
        'div',
        mergeAttributes(
          { 'data-type': 'embed-support' },
          {},
          HTMLAttributes,
          {
            class: 'embed-support',
            style: `max-width: 100%; width: ${width}px;`,
          }
        ),
        [
          'div',
          { class: 'embed-container' },
          [
            'div',
            { class: 'embed-content' },
            renderEmbedContent(embedData),
          ],
          caption ? [
            'div',
            { class: 'embed-caption' },
            caption,
          ] : null,
        ],
      ];
    }

    return [
      'div',
      mergeAttributes(
        { 'data-type': 'embed-support' },
        this.options.HTMLAttributes,
        HTMLAttributes,
        {
          class: 'embed-support',
          style: `max-width: 100%; width: ${width}px;`,
        }
      ),
      [
        'div',
        { class: 'embed-container' },
        [
          'div',
          { class: 'embed-placeholder' },
          [
            'div',
            { class: 'placeholder-content' },
            [
              'div',
              { class: 'placeholder-icon' },
              'Embed',
            ],
            [
              'div',
              { class: 'placeholder-text' },
              node.attrs.url || 'No URL provided',
            ],
          ],
        ],
        caption ? [
          'div',
          { class: 'embed-caption' },
          caption,
        ] : null,
      ].filter(Boolean),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(EmbedComponent);
  },

  addCommands() {
    return {
      ...this.parent?.(),
      setEmbed: (embedData: EmbedData) => ({ commands }: { commands: any }) => {
        return commands.insertContent({
          type: this.name,
          attrs: {
            embedData,
            url: embedData.url,
            type: embedData.type,
            width: embedData.width || 640,
            height: embedData.height || 360,
            title: embedData.title,
          },
        });
      },

      setYouTubeEmbed: (videoId: string, options: Partial<EmbedData> = {}) => ({ commands }: { commands: any }) => {
        const embedData: EmbedData = {
          type: 'youtube',
          url: `https://www.youtube.com/watch?v=${videoId}`,
          embedId: videoId,
          width: 640,
          height: 360,
          ...options,
        };
        return commands.insertContent({
          type: this.name,
          attrs: {
            embedData,
            url: embedData.url,
            type: embedData.type,
            width: embedData.width || 640,
            height: embedData.height || 360,
            title: embedData.title,
          },
        });
      },

      setTwitterEmbed: (tweetUrl: string, options: Partial<EmbedData> = {}) => ({ commands }: { commands: any }) => {
        const embedData: EmbedData = {
          type: 'twitter',
          url: tweetUrl,
          width: 550,
          height: 300,
          ...options,
        };
        return commands.insertContent({
          type: this.name,
          attrs: {
            embedData,
            url: embedData.url,
            type: embedData.type,
            width: embedData.width || 640,
            height: embedData.height || 360,
            title: embedData.title,
          },
        });
      },

      setCodepenEmbed: (penId: string, options: Partial<EmbedData> = {}) => ({ commands }: { commands: any }) => {
        const embedData: EmbedData = {
          type: 'codepen',
          url: `https://codepen.io/pen/${penId}`,
          embedId: penId,
          width: 640,
          height: 360,
          ...options,
        };
        return commands.insertContent({
          type: this.name,
          attrs: {
            embedData,
            url: embedData.url,
            type: embedData.type,
            width: embedData.width || 640,
            height: embedData.height || 360,
            title: embedData.title,
          },
        });
      },

      setVimeoEmbed: (videoId: string, options: Partial<EmbedData> = {}) => ({ commands }: { commands: any }) => {
        const embedData: EmbedData = {
          type: 'vimeo',
          url: `https://vimeo.com/${videoId}`,
          embedId: videoId,
          width: 640,
          height: 360,
          ...options,
        };
        return commands.insertContent({
          type: this.name,
          attrs: {
            embedData,
            url: embedData.url,
            type: embedData.type,
            width: embedData.width || 640,
            height: embedData.height || 360,
            title: embedData.title,
          },
        });
      },

      setSpotifyEmbed: (embedId: string, options: Partial<EmbedData> = {}) => ({ commands }: { commands: any }) => {
        const embedData: EmbedData = {
          type: 'spotify',
          url: `https://open.spotify.com/${embedId}`,
          embedId,
          width: 300,
          height: 152,
          ...options,
        };
        return commands.insertContent({
          type: this.name,
          attrs: {
            embedData,
            url: embedData.url,
            type: embedData.type,
            width: embedData.width || 640,
            height: embedData.height || 360,
            title: embedData.title,
          },
        });
      },

      setIframeEmbed: (url: string, options: Partial<EmbedData> = {}) => ({ commands }: { commands: any }) => {
        const embedData: EmbedData = {
          type: 'iframe',
          url,
          width: 640,
          height: 360,
          ...options,
        };
        return commands.insertContent({
          type: this.name,
          attrs: {
            embedData,
            url: embedData.url,
            type: embedData.type,
            width: embedData.width || 640,
            height: embedData.height || 360,
            title: embedData.title,
          },
        });
      },
    };
  },
});

// URL parsing utilities
export function parseEmbedUrl(url: string): EmbedData | null {
  // YouTube
  const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/);
  if (youtubeMatch) {
    return {
      type: 'youtube',
      url,
      embedId: youtubeMatch[1],
      width: 640,
      height: 360,
    };
  }

  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) {
    return {
      type: 'vimeo',
      url,
      embedId: vimeoMatch[1],
      width: 640,
      height: 360,
    };
  }

  // Twitter
  const twitterMatch = url.match(/twitter\.com\/\w+\/status\/(\d+)/);
  if (twitterMatch) {
    return {
      type: 'twitter',
      url,
      embedId: twitterMatch[1],
      width: 550,
      height: 300,
    };
  }

  // CodePen
  const codepenMatch = url.match(/codepen\.io\/([^\/]+)\/pen\/([^\/]+)/);
  if (codepenMatch) {
    return {
      type: 'codepen',
      url,
      embedId: `${codepenMatch[1]}/pen/${codepenMatch[2]}`,
      width: 640,
      height: 360,
    };
  }

  // Spotify
  const spotifyMatch = url.match(/open\.spotify\.com\/(track|album|playlist)\/([a-zA-Z0-9]+)/);
  if (spotifyMatch) {
    return {
      type: 'spotify',
      url,
      embedId: `${spotifyMatch[1]}/${spotifyMatch[2]}`,
      width: 300,
      height: 152,
    };
  }

  // SoundCloud
  if (url.includes('soundcloud.com')) {
    return {
      type: 'soundcloud',
      url,
      width: 640,
      height: 166,
    };
  }

  // GitHub Gist
  const gistMatch = url.match(/gist\.github\.com\/([^\/]+)\/([a-zA-Z0-9]+)/);
  if (gistMatch) {
    return {
      type: 'github',
      url,
      embedId: `${gistMatch[1]}/${gistMatch[2]}`,
      width: 640,
      height: 360,
    };
  }

  // Generic iframe
  return {
    type: 'iframe',
    url,
    width: 640,
    height: 360,
  };
}

// Embed validation
export function isValidEmbedUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// Embed providers configuration
export const EMBED_PROVIDERS = [
  {
    name: 'YouTube',
    type: 'youtube',
    patterns: [/youtube\.com\/watch\?v=/, /youtu\.be\//, /youtube\.com\/embed\//],
    icon: 'youtube',
    color: '#FF0000',
  },
  {
    name: 'Vimeo',
    type: 'vimeo',
    patterns: [/vimeo\.com\//],
    icon: 'vimeo',
    color: '#00ADFF',
  },
  {
    name: 'Twitter',
    type: 'twitter',
    patterns: [/twitter\.com\/\w+\/status\//],
    icon: 'twitter',
    color: '#1DA1F2',
  },
  {
    name: 'CodePen',
    type: 'codepen',
    patterns: [/codepen\.io\/.*\/pen\//],
    icon: 'codepen',
    color: '#000000',
  },
  {
    name: 'Spotify',
    type: 'spotify',
    patterns: [/open\.spotify\.com\/(track|album|playlist)\//],
    icon: 'spotify',
    color: '#1DB954',
  },
  {
    name: 'SoundCloud',
    type: 'soundcloud',
    patterns: [/soundcloud\.com\//],
    icon: 'soundcloud',
    color: '#FF5500',
  },
  {
    name: 'GitHub',
    type: 'github',
    patterns: [/gist\.github\.com\//],
    icon: 'github',
    color: '#333333',
  },
  {
    name: 'Custom iframe',
    type: 'iframe',
    patterns: [],
    icon: 'iframe',
    color: '#666666',
  },
];
