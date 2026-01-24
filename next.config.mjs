/** @type {import('next').NextConfig} */
const nextConfig = {
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
