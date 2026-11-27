import type { NextConfig } from 'next';

// Static export: `npm run build` writes a plain folder (out/) that any HTTPS host can serve, like the pilot.
// Set NEXT_PUBLIC_BASE_PATH when it is served from a sub-folder (e.g. GitHub Pages: /digital-dreamers-platform).
const base = process.env.NEXT_PUBLIC_BASE_PATH || '';

const config: NextConfig = {
  output: 'export',
  trailingSlash: true,
  basePath: base || undefined,
  images: { unoptimized: true },
  devIndicators: false,
  // Pin the project root: a stray package-lock.json higher up (e.g. in the home folder) otherwise makes Next.js
  // treat that folder as the workspace root, and dev/build crawl it.
  outputFileTracingRoot: __dirname,
};
export default config;
