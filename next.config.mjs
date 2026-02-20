/** @type {import('next').NextConfig} */
const rawBasePath =
  process.env.NEXT_PUBLIC_BASE_PATH || process.env.NEXT_BASE_PATH || "";
const normalizedBasePath =
  rawBasePath && rawBasePath !== "/"
    ? rawBasePath.startsWith("/")
      ? rawBasePath.replace(/\/$/, "")
      : `/${rawBasePath.replace(/\/$/, "")}`
    : "";

const nextConfig = {
  ...(normalizedBasePath ? { basePath: normalizedBasePath } : {}),
  ...(normalizedBasePath
    ? { assetPrefix: `${normalizedBasePath}/` }
    : {}),
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
