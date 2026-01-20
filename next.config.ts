import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  typescript: {
    // Build-time type checking is enabled by default
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
