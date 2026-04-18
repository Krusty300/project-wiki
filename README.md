# Notion Wiki

A powerful, feature-rich wiki application built with Next.js 16, React 19, and TypeScript. Experience blazing-fast performance with virtual scrolling, advanced navigation, and a modern user interface.

Features

Navigation & User Experience
- Enhanced Sidebar Navigation - Collapsible sections, breadcrumbs, and keyboard shortcuts
- Virtual Scrolling - Handle 100,000+ notes and folders with smooth 60fps performance
- Drag & Drop - Intuitive folder and note organization with visual previews
- Keyboard Navigation - Full keyboard accessibility with comprehensive shortcuts
- Hover States & Micro-interactions - Smooth animations and visual feedback

Editor Features
- Rich Text Editor - Powered by Tiptap with advanced extensions
- Virtualized Editor - Line-based virtual scrolling for large documents
- Slash Commands - Quick access to formatting and content blocks
- Code Blocks - Syntax highlighting with multiple language support
- Math Support - LaTeX mathematical expressions
- Note Linking - Internal wiki-style linking between notes
- Templates - Pre-built note templates for quick content creation

Performance & Architecture
- Virtual Lists - Memory-efficient rendering of large datasets
- Optimistic Updates - Immediate UI feedback with conflict resolution
- Smart Caching - LRU cache with TTL for frequently accessed content
- Lazy Loading - On-demand content loading for better performance
- Undo/Redo System - Full history management with keyboard shortcuts

Data Management
- Local Storage - IndexedDB with Dexie for offline functionality
- Import/Export - Markdown and JSON export capabilities
- Search System - Advanced search with highlighting and filtering
- Tag Management - Organize content with flexible tagging
- Folder Organization - Hierarchical folder structure with drag & drop

## Technology Stack

- Framework: Next.js 16.2.3 with App Router
- UI: React 19.2.4 with TypeScript
- Editor: Tiptap with custom extensions
- State Management: Zustand with persistence
- Database: IndexedDB with Dexie
- Styling: TailwindCSS with custom animations
- Drag & Drop: @dnd-kit for performant drag operations
- Icons: Lucide React

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm, yarn, pnpm, or bun

### Installation

```bash
# Clone the repository
git clone https://github.com/Krusty300/project-wiki.git
cd project-wiki

# Install dependencies
npm install
# or
yarn install
# or
pnpm install
```

### Development

```bash
# Start the development server
npm run dev
# or
yarn dev
# or
pnpm dev

# Open http://localhost:3000
```

### Build

```bash
# Build for production
npm run build
# or
yarn build
# or
pnpm build
```

### Start Production Server

```bash
npm start
# or
yarn start
# or
pnpm start
```

## Keyboard Shortcuts

### Navigation
- `Ctrl+K` - Open search modal
- `Ctrl+1` - Focus sidebar
- `Ctrl+2` - Focus editor
- `Ctrl+B` - Toggle sidebar
- `Arrow Keys` - Navigate between items
- `Enter/Space` - Select item or toggle folder
- `Escape` - Clear selection

### Content Creation
- `Ctrl+N` - Create new note
- `Ctrl+Shift+N` - Create new folder
- `Ctrl+S` - Save current note
- `Ctrl+Z` - Undo
- `Ctrl+Y` - Redo

### Editor Shortcuts
- `/` - Open slash commands
- `Ctrl+B` - Bold
- `Ctrl+I` - Italic
- `Ctrl+K` - Insert link
- `Ctrl+Shift+C` - Code block
- `Ctrl+E` - Inline code

## Project Structure

```
src/
components/
  sidebar/          # Enhanced navigation components
    Breadcrumbs.tsx
    CollapsibleSection.tsx
    DragPreview.tsx
    HoverStates.tsx
  editor/           # Rich text editor components
    VirtualizedEditor.tsx
    SlashCommands.tsx
    FloatingToolbar.tsx
  notes/            # Note management components
    VirtualizedNotesList.tsx
    VirtualizedNotePreview.tsx
  ui/               # Reusable UI components
    VirtualList.tsx
    Pagination.tsx
    ConfirmDialog.tsx

hooks/
  useKeyboardNavigation.ts      # Keyboard navigation utilities
  useSmoothScrolling.ts         # Smooth scrolling animations
  useVirtualListNavigation.ts   # Virtual list navigation
  useOptimisticUpdates.ts       # Optimistic UI updates
  useFolderCache.ts             # Caching system

lib/
  tiptap-extensions/            # Custom editor extensions
  db.ts                         # Database configuration
  export-manager.ts             # Import/export utilities

store/
  ui-store.ts                   # UI state management
  sidebar-store.ts              # Sidebar state management
```

## Performance Features

### Virtual Scrolling
- Handles 100,000+ items with smooth 60fps performance
- Memory-efficient rendering with only visible items in DOM
- Configurable item heights and overscan
- Smooth scrolling with multiple easing functions

### Caching Strategy
- LRU cache with TTL for frequently accessed folders
- Lazy loading of folder contents
- Optimistic updates for immediate feedback
- Conflict resolution for concurrent changes

### Optimizations
- Debounced search and filtering
- Efficient keyboard navigation with minimal DOM queries
- Smooth animations using CSS transforms
- Component memoization for reduced re-renders

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Use semantic commit messages
- Add tests for new features
- Ensure accessibility standards
- Maintain performance benchmarks

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Next.js](https://nextjs.org/) - The React framework
- [Tiptap](https://tiptap.dev/) - Rich text editor framework
- [TailwindCSS](https://tailwindcss.com/) - Utility-first CSS framework
- [Zustand](https://github.com/pmndrs/zustand) - State management
- [Dnd Kit](https://dndkit.io/) - Drag and drop utilities
- [Lucide](https://lucide.dev/) - Beautiful icons

## Roadmap

- [ ] Real-time collaboration
- [ ] Plugin system
- [ ] Advanced search with filters
- [ ] Mobile app
- [ ] Cloud sync
- [ ] Advanced theming
- [ ] API documentation
- [ ] Performance analytics

---

Built with passion for productivity, daily avarage use and performance
