import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin',
        '/api',
        '/print-dashboard',
        '/myalbumlink-embed-test',
        '/tools/quehaceres',
      ],
    },
  };
}
