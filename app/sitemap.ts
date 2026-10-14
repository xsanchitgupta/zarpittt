import type { MetadataRoute } from 'next';

const SITE_URL = 'https://zarpit.com';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date().toISOString();

  // Static routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/services`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/about`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/careers`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/terms`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/blog`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/offers`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
  ];

  // Category routes
  const categories = [
    'cleaning', 'laundry', 'cooking', 'salon', 'plumbing', 'electrician',
    'ac-repair', 'painting', 'pest-control', 'baby-care', 'elder-care',
    'pandit', 'pet-walker', 'doctor', 'luggage-shifter', 'mechanic',
    'safety-person', 'pregnancy-care',
  ];

  const categoryRoutes: MetadataRoute.Sitemap = categories.map(slug => ({
    url: `${SITE_URL}/services?cat=${slug}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  return [...staticRoutes, ...categoryRoutes];
}
