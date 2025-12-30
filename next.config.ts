import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: '**.r2.dev',
      },
      {
        protocol: 'https',
        hostname: '**.r2.cloudflarestorage.com',
      },
      {
        protocol: 'https',
        hostname: 'recorrido360.mx',
      },
      {
        protocol: 'https',
        hostname: 'api.onedrive.com',
      },
      {
        protocol: 'https',
        hostname: '**.onedrive.com',
      },
      {
        protocol: 'https',
        hostname: '1drv.ms',
      },
    ],
  },
};

export default nextConfig;
