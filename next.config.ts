import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    // El arreglo de mayúsculas (/cumple-abi → /cumple-Abi) vive en middleware.ts:
    // estos redirects no distinguen mayúsculas y harían un loop.
    return [
      { source: '/cumple-abbie', destination: '/cumple-Abi', permanent: false },
    ];
  },
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
