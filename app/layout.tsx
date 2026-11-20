import type { Metadata, Viewport } from 'next';
import { RuntimeProvider } from '@/lib/runtime';
import { BASE } from '@/lib/base';
import './globals.css';

export const metadata: Metadata = {
  title: 'DREAMS · Teacher platform',
  description: 'DREAMS Inclusive Early Learning Framework™ · lesson day, Big 5 screening and tomorrow’s plan.',
};
export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#2A3D66' };

/* The We Help! runtime (the pilot's own files, unchanged except the demo roster) loads before React,
 * in this order, exactly as the pilot portal loads it. Nothing comes from a CDN, so class runs offline. */
const RUNTIME = ['runtime/vendor/supabase-2.119.1.js', 'runtime/config.js', 'runtime/scoring.js', 'runtime/screen-items.js', 'board/js/board-content.js', 'runtime/store.js'];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        {RUNTIME.map(src => <script key={src} src={`${BASE}/${src}`} />)}
      </head>
      <body>
        <RuntimeProvider>{children}</RuntimeProvider>
      </body>
    </html>
  );
}
