import { getCategories, getServiceAreas, getTestimonials, getContentValue } from '@/lib/data';
import { CONTENT_KEYS, DEFAULT_HOME, parseContent } from '@/lib/content';
import HomeClient from './HomeClient';

// Enable ISR/Caching at the layout/page level for the homepage.
// This ensures that the page is pre-rendered and only revalidates periodically.
export const revalidate = 10; // revalidate every 10 seconds during final testing

export default async function HomePage() {
  // Fetch categories, areas, testimonials and CMS content on the server side.
  const [categories, areas, testimonials, contentRaw] = await Promise.all([
    getCategories(),
    getServiceAreas(),
    getTestimonials(),
    getContentValue(CONTENT_KEYS.home),
  ]);

  const content = parseContent(DEFAULT_HOME, contentRaw);

  return <HomeClient initialCategories={categories} initialAreas={areas} initialTestimonials={testimonials} content={content} />;
}
