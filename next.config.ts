import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'blogs.t3.storage.dev',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'api.qrserver.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'blogs.s3.amazonaws.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        port: '',
        pathname: '/**',
      },
    ],
    // Add image optimization settings
    formats: ['image/webp', 'image/avif'],
    dangerouslyAllowSVG: false,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    // Reduce timeout for faster failover
    minimumCacheTTL: 60,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Add loader timeout
    loader: 'default',
    // Disable image optimization in development to avoid timeout issues
    unoptimized: process.env.NODE_ENV === 'development',
  },
  // Add experimental features for better performance
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  // Add serverExternalPackages to avoid issues
  serverExternalPackages: ['sharp'],
  // Add turbopack configuration to silence deployment warnings
  turbopack: {},
};

export default nextConfig;
