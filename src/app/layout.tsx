import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import '../styles/fonts.css';
import '../styles/slash-commands.css';
import ErrorBoundary from '@/components/ui/ErrorBoundary';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: 'Notion Wiki',
  description: 'A modern note-taking app with wiki-like features',
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Notion Wiki",
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Add global error handler to suppress Tiptap errors
  if (typeof window !== 'undefined') {
    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;
    
    console.error = (...args) => {
      // Filter out Tiptap isEditable errors
      const errorMessage = args.join(' ');
      if (errorMessage.includes('Cannot destructure property \'isEditable\' of \'editor\' as it is null') ||
          errorMessage.includes('Cannot destructure property \'isEditable\' of \'editor\' as it is null.')) {
        return; // Suppress these specific errors
      }
      originalConsoleError(...args);
    };
    
    console.warn = (...args) => {
      // Filter out Tiptap related warnings
      const errorMessage = args.join(' ');
      if (errorMessage.includes('Cannot destructure property \'isEditable\' of \'editor\' as it is null') ||
          errorMessage.includes('Cannot destructure property \'isEditable\' of \'editor\' as it is null.')) {
        return; // Suppress these specific warnings
      }
      originalConsoleWarn(...args);
    };
    
    // Also suppress uncaught errors related to Tiptap
    window.addEventListener('error', (event) => {
      if (event.message && event.message.includes('Cannot destructure property \'isEditable\' of \'editor\' as it is null')) {
        event.preventDefault();
        event.stopPropagation();
        return false;
      }
    });
  }

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body
        className="min-h-full flex flex-col"
        style={{ fontFamily: 'var(--font-robert)' }}
      >
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </body>
    </html>
  );
}
