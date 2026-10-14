'use client';
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import ServiceCard from '@/components/ServiceCard';
import CompanionServiceRow from '@/components/CompanionServiceRow';
import { getBookingMode, GENERAL_SAFETY_RULES } from '@/lib/companion';
import { toast } from '@/components/Toast';
import { fetchMoreServicesAction } from './actions';
import type { Category, Service } from '@/lib/database.types';
import { Settings2, Search, Loader2 } from 'lucide-react';
import Skeleton from '@/components/Skeleton';

export default function ServicesClient({ 
  initialCategories, 
  initialServices 
}: { 
  initialCategories: Category[]; 
  initialServices: Service[] 
}) {
  const searchParams = useSearchParams();
  const catParam = searchParams.get('cat');
  const [selectedCats, setSelectedCats] = useState<string[]>(catParam ? [catParam] : []);
  const [maxPrice, setMaxPrice] = useState(25000);
  const [sortBy, setSortBy] = useState('popular');
  const [categories] = useState<Category[]>(initialCategories || []);
  const [services, setServices] = useState<Service[]>(initialServices || []);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(2); // Initial services represent page 1
  const [hasMore, setHasMore] = useState((initialServices?.length || 0) >= 20);
  const observerTarget = useRef<HTMLDivElement | null>(null);

  // ==========================================
  // Infinite Scroll Intersection Observer
  // ==========================================
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadMoreServices();
        }
      },
      { threshold: 0.1, rootMargin: '400px' }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loading]);

  const loadMoreServices = useCallback(async () => {
    setLoading(true);
    try {
      const moreServices = await fetchMoreServicesAction(page, 20);
      if (moreServices.length > 0) {
        setServices(prev => {
          // Prevent duplicates by comparing IDs
          const existingIds = new Set(prev.map(s => s.id));
          const newUnique = moreServices.filter(s => !existingIds.has(s.id));
          return [...prev, ...newUnique];
        });
        setPage(p => p + 1);
        if (moreServices.length < 20) setHasMore(false);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error fetching more services', error);
    }
    setLoading(false);
  }, [page]);

  // Only Companion & Helping Buddy are live right now — the legacy home-service
  // categories are hidden from the sidebar and listing to match the home page.
  const liveCategoryIds = useMemo(
    () => new Set(categories.filter(c => getBookingMode(c)).map(c => c.id)),
    [categories]
  );
  const visibleCategories = useMemo(
    () => categories.filter(c => getBookingMode(c)),
    [categories]
  );

  const filtered = useMemo(() => {
    // Restrict to services in live (companion / helping buddy) categories
    let list = services.filter(s => liveCategoryIds.has(s.category_id));

    // Auto-hide generic parent services (like "Cleaning Service") if there are specific sub-services in that category
    const categoryCounts = list.reduce((acc, s) => {
      acc[s.category_id] = (acc[s.category_id] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    list = list.filter(s => {
      const cat = categories.find(c => c.id === s.category_id);
      if (cat && categoryCounts[s.category_id] > 1) {
        const sName = s.name.toLowerCase().trim();
        const generic1 = cat.name.toLowerCase().trim();
        const generic2 = `${generic1} service`;
        if (sName === generic1 || sName === generic2) {
          return false;
        }
      }
      return true;
    });

    if (selectedCats.length > 0) {
      const selectedCatIds = categories.filter(c => selectedCats.includes(c.slug) && !c.is_independent_service).map(c => c.id);
      const selectedServiceIds = categories.filter(c => selectedCats.includes(c.slug) && c.is_independent_service).map(c => c.service_id);

      list = list.filter(s => 
        selectedCatIds.includes(s.category_id) || 
        selectedServiceIds.includes(s.id)
      );
    }
    list = list.filter(s => s.price <= maxPrice);
    // Admin priority (sort_order) is the source of truth for the default view.
    const byPriority = (a: Service, b: Service) => {
      if (a.is_coming_soon !== b.is_coming_soon) return a.is_coming_soon ? 1 : -1;
      const diff = (a.sort_order || 0) - (b.sort_order || 0);
      return diff !== 0 ? diff : a.name.localeCompare(b.name); // stable tiebreak
    };
    if (sortBy === 'price-low') list.sort((a, b) => a.price - b.price);
    else if (sortBy === 'price-high') list.sort((a, b) => b.price - a.price);
    else if (sortBy === 'rating') list.sort((a, b) => b.rating - a.rating);
    // 'popular' (default) and the fallback both follow the admin's priority order
    else list.sort(byPriority);
    return list;
  }, [services, selectedCats, maxPrice, sortBy, categories, liveCategoryIds]);

  const toggleCat = (slug: string) => {
    setSelectedCats(prev => prev.includes(slug) ? prev.filter(c => c !== slug) : [...prev, slug]);
  };

  // Only resolve to a live category; legacy ?cat=cleaning URLs fall back to "All Services"
  const activeCat = selectedCats.length === 1
    ? categories.find(c => c.slug === selectedCats[0] && getBookingMode(c))
    : null;
  // Companion / Helping Buddy categories use a rows layout (icon left, no images)
  const activeMode = activeCat ? getBookingMode(activeCat) : null;

  // Category views paginate server-side by sort order, so keep loading until the
  // whole catalog is in memory — otherwise a filtered category shows partial rows.
  useEffect(() => {
    if (selectedCats.length > 0 && hasMore && !loading) {
      loadMoreServices();
    }
  }, [selectedCats, hasMore, loading, loadMoreServices]);

  // Remove global loading block, we only show loader at the bottom now.

  return (
    <div style={{paddingTop:'calc(var(--navbar-h) + 32px)',paddingBottom:80,minHeight:'100vh'}}>
      <div className="container">
        {/* Breadcrumb */}
        <div style={{display:'flex',alignItems:'center',gap:8,fontSize:13,color:'var(--text-muted)',marginBottom:24}}>
          <Link href="/" style={{color:'var(--text-secondary)',transition:'color 0.15s'}}>Home</Link>
          <span>›</span>
          <span style={{color:'var(--text)'}}>{activeCat?.name || 'All Services'}</span>
        </div>

        {/* Category Header — icon-based for Companion/Helping Buddy, image for others */}
        {activeCat && activeMode && (
          <div style={{display:'flex',alignItems:'center',gap:20,padding:'28px 32px',borderRadius:'var(--radius-2xl)',marginBottom:32,border:'1px solid var(--glass-border)',background:'var(--glass-bg)',backdropFilter:'blur(20px)'}}>
            <div style={{width:72,height:72,minWidth:72,borderRadius:'var(--radius-xl)',background:'var(--accent-light)',border:'1px solid var(--accent-border)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:36}}>
              {activeMode === 'companion' ? '🤝' : '🙌'}
            </div>
            <div>
              <h1 style={{fontFamily:'var(--font-heading)',fontSize:'2rem',fontWeight:700}}>{activeCat.name}</h1>
              <p style={{fontSize:14,color:'var(--text-secondary)',marginTop:4}}>
                {activeMode === 'companion'
                  ? 'Verified, friendly companions for outings, events, hospital visits & more.'
                  : 'A trusted extra pair of hands for errands, shifting, queues & everyday tasks.'}
              </p>
            </div>
          </div>
        )}
        {!activeCat && (
          <div style={{marginBottom:32}}>
            <h1 style={{fontFamily:'var(--font-heading)',fontSize:'2rem',fontWeight:700,marginBottom:8}}>All Services</h1>
            <p style={{color:'var(--text-secondary)',fontSize:15}}>Book a verified Companion or a Helping Buddy for outings, errands, events, shifting &amp; more.</p>
          </div>
        )}

        {/* Mobile filter toggle */}
        <button className="btn btn-secondary btn-sm hide-desktop" style={{marginBottom:16,width:'100%',display:'flex',alignItems:'center',justifyContent:'center',gap:8}} id="filterToggle"
          onClick={() => { const el = document.getElementById('filterSidebar'); if (el) el.classList.toggle('open'); }}
        ><Settings2 size={16} /> Filters & Sort</button>

        <div className="page-layout-services">
          {/* Filters */}
          <aside id="filterSidebar" className="filter-sidebar">
            <div style={{padding:24,background:'var(--glass-bg)',border:'1px solid var(--glass-border)',borderRadius:'var(--radius-xl)',backdropFilter:'blur(20px)'}}>
              <h3 style={{fontSize:12,fontWeight:600,letterSpacing:'0.08em',textTransform:'uppercase',marginBottom:18,color:'var(--text)'}}>Categories</h3>
              <div style={{display:'flex',flexDirection:'column',gap:12,marginBottom:28}}>
                {/* All Services */}
                <label style={{display:'flex',alignItems:'center',gap:12,cursor:'pointer'}}>
                  <div style={{
                    width: 20, height: 20, borderRadius: 6, flexShrink: 0,
                    border: selectedCats.length === 0 ? 'none' : '1.5px solid var(--border)',
                    background: selectedCats.length === 0 ? 'var(--accent)' : 'var(--surface)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease',
                    boxShadow: selectedCats.length === 0 ? '0 4px 10px rgba(255, 107, 0, 0.3)' : 'none'
                  }}>
                    {selectedCats.length === 0 && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    )}
                  </div>
                  <input type="checkbox" checked={selectedCats.length === 0} onChange={() => { setSelectedCats([]); setMaxPrice(25000); }} style={{display:'none'}} />
                  <div style={{display:'flex', alignItems:'center', gap:6, fontSize:14, fontWeight: selectedCats.length === 0 ? 700 : 500}}>
                    All Services
                  </div>
                </label>
                {visibleCategories.map(c => (
                  <label key={c.id} style={{display:'flex',alignItems:'center',gap:12,cursor:'pointer',fontSize:14,fontWeight: selectedCats.includes(c.slug) ? 600 : 400, color: selectedCats.includes(c.slug) ? 'var(--text)' : 'var(--text-secondary)',transition:'all 0.2s'}}>
                    <div style={{
                      width: 20, height: 20, borderRadius: 6, flexShrink: 0,
                      border: selectedCats.includes(c.slug) ? 'none' : '1.5px solid var(--border)',
                      background: selectedCats.includes(c.slug) ? 'var(--accent)' : 'var(--surface)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease',
                      boxShadow: selectedCats.includes(c.slug) ? '0 4px 10px rgba(255, 107, 0, 0.3)' : 'none'
                    }}>
                      {selectedCats.includes(c.slug) && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      )}
                    </div>
                    <input type="checkbox" checked={selectedCats.includes(c.slug)} onChange={() => toggleCat(c.slug)} style={{display:'none'}} />
                    <div style={{display:'flex', alignItems:'center', gap:6}}>
                      {c.name}
                      {c.is_coming_soon && <span style={{fontSize:9, padding:'1px 4px', background:'var(--warning-bg)', color:'var(--warning)', borderRadius:4, border:'1px solid rgba(245, 158, 11, 0.2)'}}>Soon</span>}
                    </div>
                  </label>
                ))}
              </div>



              <button className="btn btn-ghost btn-sm" style={{width:'100%',color:'var(--text-muted)'}} onClick={() => { setSelectedCats([]); setMaxPrice(25000); }}>
                Clear All Filters
              </button>
            </div>
          </aside>

          <div style={{flex:1}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:24}}>
              <p style={{color:'var(--text-secondary)',fontSize:14}}>{filtered.length} services found</p>
              <select className="input" style={{width:'auto',padding:'8px 32px 8px 16px',fontSize:13,background:'var(--bg-input)'}} value={sortBy} onChange={e => setSortBy(e.target.value)}>
                <option value="popular">Recommended</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
              </select>
            </div>

            {filtered.length === 0 ? (
              <div style={{textAlign:'center',padding:'80px 20px',background:'var(--glass-bg)',borderRadius:'var(--radius-xl)',border:'1px solid var(--glass-border)'}}>
                <Search size={48} style={{color:'var(--text-muted)',margin:'0 auto 16px',opacity:0.5}} />
                <h3 style={{fontSize:'1.2rem',fontWeight:600,marginBottom:8}}>No services found</h3>
                <p style={{color:'var(--text-secondary)'}}>Try adjusting your filters.</p>
              </div>
            ) : (
              <>
                {activeMode ? (
                  <div style={{display:'flex',flexDirection:'column',gap:14}}>
                    {filtered.map(s => {
                      const cat = categories.find(c => c.id === s.category_id);
                      return <CompanionServiceRow key={s.id} service={s} category={cat} mode={activeMode} onAdded={() => toast.success('Added', `${s.name} added to cart.`)} />;
                    })}
                  </div>
                ) : (
                  <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))',gap:24}}>
                    {filtered.map(s => {
                      const cat = categories.find(c => c.id === s.category_id);
                      return <ServiceCard key={s.id} service={s} category={cat} onAdded={() => toast.success('Added', `${s.name} added to cart.`)} />;
                    })}
                  </div>
                )}

                {/* General Safety & Service Rules for Companion / Helping Buddy */}
                {activeMode && (
                  <div style={{marginTop:32,padding:24,background:'var(--glass-bg)',border:'1px solid var(--glass-border)',borderRadius:'var(--radius-xl)',backdropFilter:'blur(20px)'}}>
                    <h3 style={{fontFamily:'var(--font-heading)',fontSize:'1.1rem',fontWeight:700,marginBottom:16}}>🌟 General Safety & Service Rules</h3>
                    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(280px, 1fr))',gap:20}}>
                      <div>
                        <h4 style={{fontSize:14,fontWeight:700,color:'var(--success)',marginBottom:10}}>✅ What Buddies Will Do</h4>
                        <ul style={{listStyle:'none',padding:0,margin:0,display:'flex',flexDirection:'column',gap:8}}>
                          {GENERAL_SAFETY_RULES.will.map((r, i) => (
                            <li key={i} style={{fontSize:13,color:'var(--text-secondary)',display:'flex',gap:8,lineHeight:1.5}}><span style={{color:'var(--success)'}}>✓</span>{r}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 style={{fontSize:14,fontWeight:700,color:'var(--error)',marginBottom:10}}>❌ What Buddies Will NOT Do</h4>
                        <ul style={{listStyle:'none',padding:0,margin:0,display:'flex',flexDirection:'column',gap:8}}>
                          {GENERAL_SAFETY_RULES.willNot.map((r, i) => (
                            <li key={i} style={{fontSize:13,color:'var(--text-secondary)',display:'flex',gap:8,lineHeight:1.5}}><span style={{color:'var(--error)'}}>✕</span>{r}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    <p style={{fontSize:12,color:'var(--text-muted)',marginTop:16,lineHeight:1.6,borderTop:'1px solid var(--border-light)',paddingTop:14}}>
                      <strong>Important:</strong> {GENERAL_SAFETY_RULES.note}
                    </p>
                  </div>
                )}

                {hasMore && (
                    <div ref={observerTarget} style={{ paddingTop: 32, paddingBottom: 40 }}>
                      {loading ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24 }}>
                          {[1, 2, 3, 4].map(i => (
                            <div key={i} style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-xl)', overflow: 'hidden', display: 'flex', flexDirection: 'column', height: 380 }}>
                              <Skeleton width="100%" height={180} borderRadius={0} />
                              <div style={{ padding: '18px 20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                <Skeleton width="40%" height={14} style={{ marginBottom: 12 }} />
                                <Skeleton width="80%" height={20} style={{ marginBottom: 12 }} />
                                <Skeleton width="60%" height={16} style={{ marginBottom: 16 }} />
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'auto' }}>
                                  <Skeleton width="30%" height={24} />
                                  <Skeleton width="20%" height={32} borderRadius={999} />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : <span style={{ opacity: 0 }}>.</span>}
                    </div>
                  )}
                
                {!hasMore && filtered.length > 0 && (
                  <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                    You've reached the end of the catalog.
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
