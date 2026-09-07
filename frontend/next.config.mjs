/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production';

// Hosting is configurable via NEXT_PUBLIC_BASE_PATH. Set it when deploying
// under a sub-path (e.g. GitHub Pages user site: /Value-Cars), leave unset for
// a custom domain / Vercel / Docker where the app lives at the root.
const rawBasePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
const basePath = rawBasePath.replace(/\/+$/, ''); // strip trailing slash

const nextConfig = {
  output: 'export',
  basePath,
  assetPrefix: basePath ? `${basePath}/` : '',
  // If a basePath is used (static sub-path hosting) we must not hardcode it in
  // page metadata, so ensure app/page.tsx metadata uses relative-safe URLs.
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
};

export default nextConfig;
