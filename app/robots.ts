import { MetadataRoute } from 'next';

const SITE_URL = 'https://zarpit.com';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/api/', '/profile/'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
