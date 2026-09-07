const isGitHubActions = process.env.GITHUB_ACTIONS === 'true';
const rawBasePath = process.env.NEXT_PUBLIC_BASE_PATH || (isGitHubActions ? '/Value-Cars' : '');
const basePath = rawBasePath.replace(/\/+$/, ''); // strip trailing slash

const nextConfig = {
  output: 'export',
  basePath,
  assetPrefix: basePath ? `${basePath}/` : '',
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
};

export default nextConfig;
