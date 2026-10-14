import { getBlogBySlug } from '@/app/actions/blogs';
import { notFound } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Calendar, User, Tag, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  // Try fetching by slug first, if not found or the "slug" is actually an ID, fetch by slug handles it because we can fallback.
  // Actually, getBlogBySlug matches the 'slug' field. If they pass an ID, getBlogBySlug will return null, so we also could check getBlogById. But for public facing, slug is better.
  const post = await getBlogBySlug(slug);

  if (!post) {
    notFound();
  }

  // A very simple markdown/line-break formatter for the MVP
  const formattedContent = post.content.split('\n').map((paragraph: string, index: number) => {
    if (!paragraph.trim()) return <br key={index} />;
    
    // Simple heading support
    if (paragraph.startsWith('### ')) {
      return <h3 key={index} style={{ fontSize: '1.4rem', fontWeight: 700, marginTop: 32, marginBottom: 16, color: 'var(--text-primary)' }}>{paragraph.replace('### ', '')}</h3>;
    }
    if (paragraph.startsWith('## ')) {
      return <h2 key={index} style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: 40, marginBottom: 20, color: 'var(--text-primary)' }}>{paragraph.replace('## ', '')}</h2>;
    }
    if (paragraph.startsWith('# ')) {
      return <h1 key={index} style={{ fontSize: '2.2rem', fontWeight: 800, marginTop: 48, marginBottom: 24, color: 'var(--text-primary)' }}>{paragraph.replace('# ', '')}</h1>;
    }
    
    // Simple bold support (naive)
    const boldFormatted = paragraph.split('**').map((text, i) => (i % 2 === 1 ? <strong key={i}>{text}</strong> : text));
    
    return <p key={index} style={{ marginBottom: 16, lineHeight: 1.8, fontSize: '1.1rem', color: 'var(--text-secondary)' }}>{boldFormatted}</p>;
  });

  return (
    <>
      <Navbar />
      <article style={{ paddingTop: 'calc(var(--navbar-h) + 40px)', minHeight: '100vh', background: 'var(--bg-default)' }}>
        
        {/* Header Section */}
        <header style={{ padding: '40px 0', textAlign: 'center' }}>
          <div className="container" style={{ maxWidth: 800 }}>
            <Link href="/blog" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--accent)', fontWeight: 600, textDecoration: 'none', marginBottom: 32 }}>
              <ArrowLeft size={16} /> Back to Blog
            </Link>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 24, color: 'var(--accent)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: 13 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Tag size={14} /> {post.category}</span>
            </div>
            
            <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(2.5rem, 6vw, 3.5rem)', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 24, lineHeight: 1.15, color: 'var(--text-primary)' }}>
              {post.title}
            </h1>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24, color: 'var(--text-muted)', fontSize: 14 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><User size={16} /> {post.author}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Calendar size={16} /> {new Date(post.published_at || post.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
            </div>
          </div>
        </header>

        {/* Cover Image */}
        {post.image_url && (
          <div className="container" style={{ maxWidth: 1000, marginBottom: 40 }}>
            <div style={{ position: 'relative', width: '100%', aspectRatio: '21/9', borderRadius: 'var(--radius-xl)', overflow: 'hidden', boxShadow: 'var(--shadow-lg)' }}>
              <img src={post.image_url} alt={post.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          </div>
        )}

        {/* Content */}
        <div className="container" style={{ maxWidth: 720, paddingBottom: 80 }}>
          <div style={{ fontSize: '1.25rem', color: 'var(--text-primary)', lineHeight: 1.7, fontWeight: 500, marginBottom: 40, padding: '0 24px', borderLeft: '4px solid var(--accent)' }}>
            {post.excerpt}
          </div>
          
          <div className="blog-content">
            {formattedContent}
          </div>
        </div>
      </article>
      <Footer />
    </>
  );
}
