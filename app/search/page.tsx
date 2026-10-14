'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ServiceCard from '@/components/ServiceCard';
import ToastContainer, { toast } from '@/components/Toast';
import { searchServices } from '@/lib/data';
import type { Service } from '@/lib/database.types';
import { getBookingMode } from '@/lib/companion';
import { Search, Frown } from 'lucide-react';

function SearchContent() {
  const searchParams = useSearchParams();
  const initialQ = searchParams.get('q') || '';
  const [query, setQuery] = useState(initialQ);
  const [results, setResults] = useState<Service[]>([]);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (query.length >= 2) {
      // Only surface live Companion / Helping Buddy services
      searchServices(query).then(r => {
        setResults(r.filter(s => getBookingMode((s.category as any) || s.category_id)));
        setSearched(true);
      });
    } else {
      setResults([]);
      setSearched(false);
    }
  }, [query]);

  return (
    <div style={{paddingTop:'calc(var(--navbar-h) + 32px)',paddingBottom:80,minHeight:'100vh'}}>
      <div className="container">
        {/* Search Hero */}
        <div style={{textAlign:'center',padding:'48px 0 32px'}}>
          <h1 style={{fontFamily:'var(--font-heading)',fontSize:'clamp(1.5rem, 4vw, 2rem)',fontWeight:700,marginBottom:24}}>Search Services</h1>
          <div style={{maxWidth:600,margin:'0 auto',display:'flex',gap:8,padding:6,background:'var(--glass-bg)',border:'1px solid var(--glass-border)',borderRadius:'var(--radius-2xl)',backdropFilter:'blur(20px)'}}>
            <input value={query} onChange={e => setQuery(e.target.value)} className="input" placeholder="Search for any service..." autoFocus
              style={{border:'none',background:'transparent',fontSize:16,paddingLeft:20}} />
            <button className="btn btn-primary" style={{borderRadius:'var(--radius-xl)'}}>Search</button>
          </div>
        </div>

        <p style={{padding:'16px 0',fontSize:14,color:'var(--text-secondary)',borderBottom:'1px solid var(--border)',marginBottom:24}}>
          {searched ? `${results.length} result${results.length !== 1 ? 's' : ''} for "${query}"` : 'Type to search for services...'}
        </p>

        {searched && results.length === 0 && (
          <div style={{textAlign:'center',padding:80}}>
            <div style={{marginBottom:16,display:'flex',justifyContent:'center'}}><Frown size={64} style={{color:'var(--text-muted)'}} /></div>
            <h3 style={{fontFamily:'var(--font-heading)',fontSize:'1.2rem',marginBottom:8}}>No results found</h3>
            <p style={{color:'var(--text-secondary)',fontSize:14,marginBottom:24}}>Try different keywords or browse our categories.</p>
            <a href="/services" className="btn btn-primary">Browse All Services</a>
          </div>
        )}

        {!searched && (
          <div style={{textAlign:'center',padding:80}}>
            <div style={{marginBottom:16,display:'flex',justifyContent:'center'}}><Search size={64} style={{color:'var(--accent)'}} /></div>
            <h3 style={{fontFamily:'var(--font-heading)',fontSize:'1.2rem',marginBottom:8}}>Search for services</h3>
            <p style={{color:'var(--text-secondary)',fontSize:14}}>Try &quot;companion&quot;, &quot;shifting&quot;, &quot;airport&quot;, &quot;queue&quot;, etc.</p>
          </div>
        )}

        {results.length > 0 && (
          <div className="grid-cols-3">
            {results.map(s => <ServiceCard key={s.id} service={s} onAdded={() => toast.success('Cart Updated', `${s.name} replaced your current selection.`)} />)}
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <>
      <Navbar /><ToastContainer />
      <Suspense fallback={<div style={{minHeight:'100vh',paddingTop:'var(--navbar-h)'}} />}>
        <SearchContent />
      </Suspense>
      <Footer />
    </>
  );
}
