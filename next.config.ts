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
};
export default config;
