'use client';
import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { ArrowRight, Calendar, User, Tag, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { getPublishedBlogs } from '@/app/actions/blogs';

export default function BlogPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    try {
      const data = await getPublishedBlogs();
      setPosts(data || []);
    } catch (error) {
      console.error('Failed to load blogs', error);
    }
    setLoading(false);
  };

  return (
    <>
      <Navbar />
      <div style={{ paddingTop: 'calc(var(--navbar-h) + 32px)', minHeight: '100vh' }}>

        {/* Hero */}
        <section style={{ padding: '60px 0 40px', textAlign: 'center' }}>
          <div className="container" style={{ maxWidth: 800 }}>
            <span className="section-label">Zarpit Blog</span>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 16 }}>
              Insights, Tips & Stories
            </h1>
            <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
              Learn more about home care, wellness, and how we are empowering lives.
            </p>
          </div>
        </section>

        {/* Blog Grid */}
        <section style={{ padding: '40px 0 80px' }}>
          <div className="container" style={{ maxWidth: 1100 }}>
            {loading ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 32 }}>
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-xl)', overflow: 'hidden', display: 'flex', flexDirection: 'column', height: 420 }}>
                    <div className="skeleton" style={{ width: '100%', height: 200, borderRadius: 0 }} />
                    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', flex: 1 }}>
                      <div className="skeleton" style={{ width: '30%', height: 16, marginBottom: 12 }} />
                      <div className="skeleton" style={{ width: '85%', height: 24, marginBottom: 8 }} />
                      <div className="skeleton" style={{ width: '60%', height: 24, marginBottom: 20 }} />
                      <div className="skeleton" style={{ width: '100%', height: 14, marginBottom: 8 }} />
                      <div className="skeleton" style={{ width: '90%', height: 14, marginBottom: 24 }} />
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: 16, marginTop: 'auto' }}>
                        <div className="skeleton" style={{ width: '40%', height: 16 }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : posts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-secondary)' }}>No articles found. Check back later!</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 32 }}>
                {posts.map((post) => (
                  <Link href={`/blog/${post.slug || post.id}`} key={post.id} style={{ textDecoration: 'none' }}>
                    <div style={{
                      background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
                      borderRadius: 'var(--radius-xl)', overflow: 'hidden', backdropFilter: 'blur(20px)',
                      display: 'flex', flexDirection: 'column', height: '100%', transition: 'all 0.3s ease', cursor: 'pointer'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-border)'; e.currentTarget.style.transform = 'translateY(-4px)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--glass-border)'; e.currentTarget.style.transform = 'none'; }}
                    >
                      <div style={{ position: 'relative', width: '100%', height: 200, background: 'var(--bg-elevated)' }}>
                        {post.image_url ? (
                          <img src={post.image_url} alt={post.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--border)' }}>
                            <Tag color="var(--text-muted)" size={32} />
                          </div>
                        )}
                      </div>
                      <div style={{ padding: 24, display: 'flex', flexDirection: 'column', flex: 1 }}>
                        <div style={{ display: 'flex', gap: 12, marginBottom: 12, fontSize: 12, fontWeight: 600, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Tag size={12} /> {post.category}</span>
                        </div>
                        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 700, marginBottom: 12, lineHeight: 1.4, color: 'var(--text)' }}>
                          {post.title}
                        </h2>
                        <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 20, flex: 1 }}>
                          {post.excerpt}
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: 16, marginTop: 'auto' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 12, color: 'var(--text-muted)' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Calendar size={14} /> {new Date(post.created_at).toLocaleDateString()}</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><User size={14} /> {post.author}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

      </div>
      <Footer />
    </>
  );
}
