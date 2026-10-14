'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Clock, Star, Package, Info, ChevronRight } from 'lucide-react';
import { addToCart, removeFromCart, updateQuantity, formatPrice, getCart } from '@/lib/utils';
import type { Service, Category } from '@/lib/database.types';
import DosAndDontsModal from './DosAndDontsModal';
import ReviewsModal from './ReviewsModal';
import BookingOptionsModal from './BookingOptionsModal';
import { getBookingMode, type BookingOptions } from '@/lib/companion';

interface Props {
  service: Service;
  category?: Category | null;
  onAdded?: () => void;
}

export default function ServiceCard({ service: s, category, onAdded }: Props) {
  const [cartQty, setCartQty] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isReviewsOpen, setIsReviewsOpen] = useState(false);
  const [selectedVariantIdx, setSelectedVariantIdx] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [optionsOpen, setOptionsOpen] = useState(false);
  // Companion / Helping Buddy services need booking options (hours, persons, gender, need)
  const bookingMode = getBookingMode(category || (s as any).category || s.category_id);

  useEffect(() => {
    const handleClick = () => setDropdownOpen(false);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  useEffect(() => {
    const checkCart = () => {
      const cart = getCart();
      const variantName = s.variants && s.variants.length > 0 ? s.variants[selectedVariantIdx]?.name : undefined;
      const item = cart.find(i => i.id === s.id && i.variantName === variantName);
      setCartQty(item ? item.quantity : 0);
    };
    checkCart();
    window.addEventListener('cartUpdate', checkCart);
    return () => window.removeEventListener('cartUpdate', checkCart);
  }, [s.id, selectedVariantIdx, s.variants]);

  const handleOptionsConfirm = (options: BookingOptions, totalPrice: number) => {
    addToCart({
      id: s.id,
      name: s.name,
      price: totalPrice,
      originalPrice: totalPrice,
      duration: bookingMode === 'companion' ? `${options.hours} hr${options.hours > 1 ? 's' : ''}` : s.duration,
      category: category?.name || (s as any).category?.name || s.category_id || '',
      image: s.image,
      options,
    });
    setOptionsOpen(false);
    onAdded?.();
  };

  const handleAdd = (variant?: { name: string, price: number }) => {
    if (bookingMode) {
      setOptionsOpen(true);
      return;
    }
    addToCart({
      id: s.id,
      name: s.name,
      price: variant ? variant.price : s.price,
      originalPrice: variant ? variant.price : (s.original_price ?? s.price),
      duration: s.duration,
      category: s.is_independent ? s.name : (category?.name || (s as any).category?.name || s.category_id || ''),
      image: s.image,
      variantName: variant?.name,
    });
    // The cartUpdate event will trigger setIsInCart(true) via the effect
    onAdded?.();
  };

  const isComingSoon = s.is_coming_soon || category?.is_coming_soon || (s as any).category?.is_coming_soon;

  return (
    <div style={{
      position:'relative',
      background:'var(--glass-bg)', border:'1px solid var(--glass-border)',
      borderRadius:'var(--radius-xl)', backdropFilter:'blur(20px)',
      transition:'all 0.35s ease', display:'flex', flexDirection:'column',
    }}
    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent-border)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-glow)'; }}
    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--glass-border)'; (e.currentTarget as HTMLElement).style.transform = 'none'; (e.currentTarget as HTMLElement).style.boxShadow = 'none'; }}
    >
      {/* Image */}
      <Link href={`/services/${s.id}`} style={{
        position:'relative', height:180, overflow:'hidden', 
        borderTopLeftRadius: 'calc(var(--radius-xl) - 1px)', 
        borderTopRightRadius: 'calc(var(--radius-xl) - 1px)',
        background: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        textDecoration: 'none'
      }}>
        {s.image && !imgError ? (
          <Image 
            src={s.image} 
            alt={s.name} 
            fill 
            style={{objectFit:'cover', transition:'transform 0.5s ease'}} 
            sizes="(max-width: 768px) 90vw, 33vw" 
            onError={() => setImgError(true)}
          />
        ) : (
          <span style={{fontSize:'3rem',color:'var(--accent)',fontWeight:700}}>{s.name[0]}</span>
        )}
        <div style={{position:'absolute',inset:0,background:'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 50%)', pointerEvents:'none'}} />
        {s.badge && (
          <span className="badge badge-accent" style={{position:'absolute',top:12,left:12}}>{s.badge}</span>
        )}
        {s.discount > 0 && (
          <span style={{position:'absolute',top:12,right:12,background:'var(--success)',color:'#fff',padding:'3px 10px',borderRadius:'var(--radius-full)',fontSize:11,fontWeight:700}}>{s.discount}% OFF</span>
        )}
      </Link>

      {/* Content */}
      <div style={{padding:'18px 20px', flex:1, display:'flex', flexDirection:'column', gap:8}}>
        <div style={{display:'flex',alignItems:'center',gap:12,fontSize:12,color:'var(--text-tertiary)'}}>
          <span style={{display:'flex',alignItems:'center',gap:4}}><Package size={14} /> {s.is_independent ? s.name : (category?.name || (s as any).category?.name || 'Category')}</span>
          <span style={{display:'flex',alignItems:'center',gap:4}}><Clock size={14} /> {s.duration}</span>
        </div>
        <Link href={`/services/${s.id}`} style={{textDecoration:'none', color:'inherit', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent)'; }} 
              onMouseLeave={e => { e.currentTarget.style.color = 'inherit'; }}>
          <h3 style={{fontFamily:'var(--font-heading)',fontSize:'1.05rem',fontWeight:600,lineHeight:1.3, cursor: 'pointer', margin: 0}}>
            {s.name}
          </h3>
        </Link>
        {!isComingSoon && (
          <Link href={`/services/${s.id}#reviews`} style={{display:'flex',alignItems:'center',gap:8,fontSize:13, textDecoration: 'none', cursor: 'pointer'}}
                onMouseEnter={e => { e.currentTarget.style.opacity = '0.8'; }} 
                onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}>
            <span style={{color:'var(--accent)',display:'flex',alignItems:'center',gap:4}}><Star size={14} fill="currentColor" /> {s.rating}</span>
            <span style={{color:'var(--text-muted)'}}>
              ({s.reviews.toLocaleString()} reviews)
            </span>
          </Link>
        )}

        {s.variants && s.variants.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <select 
              value={selectedVariantIdx}
              onChange={(e) => setSelectedVariantIdx(Number(e.target.value))}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '10px',
                border: '1px solid var(--border)',
                background: 'var(--bg-elevated)',
                color: 'var(--text)',
                fontSize: 13,
                fontWeight: 600,
                outline: 'none',
                cursor: 'pointer',
                fontFamily: 'inherit'
              }}
              onClick={(e) => e.preventDefault()}
            >
              {s.variants.map((v, i) => (
                <option key={i} value={i}>{v.name}</option>
              ))}
            </select>
          </div>
        )}

        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginTop:'auto',paddingTop:14}}>
          <div style={{display:'flex',flexDirection:'column', gap: 2}}>
            <span style={{fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em'}}>
              {s.variants && s.variants.length > 0 ? 'Price' : 'Starts at'}
            </span>
            <div style={{display:'flex',alignItems:'baseline',gap:6}}>
              <span style={{fontFamily:'var(--font-heading)',fontSize:'1.3rem',fontWeight:700}}>
                {formatPrice(s.variants && s.variants.length > 0 ? s.variants[selectedVariantIdx].price : s.price)}
              </span>
              {(!s.variants || s.variants.length === 0) && s.original_price > s.price && (
                <span style={{fontSize:12,color:'var(--text-muted)',textDecoration:'line-through'}}>{formatPrice(s.original_price)}</span>
              )}
            </div>
          </div>
          {isComingSoon ? (
            <div style={{padding:'6px 12px', background:'var(--warning-bg)', color:'var(--warning)', borderRadius:'var(--radius-full)', fontSize:12, fontWeight:700, border:'1px solid rgba(245, 158, 11, 0.2)'}}>
              Coming Soon
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 8 }}>
              <Link href={`/services/${s.id}`} style={{textDecoration:'none'}}>
                <button
                  style={{
                    padding:'10px 14px', background:'transparent', color:'var(--text)',
                    borderRadius:'12px', fontSize:13, fontWeight:700, display: 'flex', alignItems: 'center', gap: 6,
                    border:'1.5px solid var(--border)', cursor:'pointer', whiteSpace:'nowrap', transition:'all 0.2s'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--text-muted)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; }}
                >
                  View Details
                </button>
              </Link>
              {cartQty > 0 && !bookingMode ? (
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  background: 'var(--accent-light)', 
                  borderRadius: '12px', 
                  border: '1px solid var(--accent)',
                  overflow: 'hidden',
                  height: '38px'
                }}>
                  <button onClick={(e) => { e.preventDefault(); updateQuantity(s.id, s.variants?.[selectedVariantIdx]?.name, cartQty - 1); }} style={{ width: 32, height: '100%', border: 'none', background: 'transparent', color: 'var(--accent)', cursor: 'pointer', fontWeight: 700 }}>−</button>
                  <span style={{ minWidth: 20, textAlign: 'center', fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{cartQty}</span>
                  <button onClick={(e) => { e.preventDefault(); if(cartQty < 5) updateQuantity(s.id, s.variants?.[selectedVariantIdx]?.name, cartQty + 1); }} style={{ width: 32, height: '100%', border: 'none', background: 'transparent', color: 'var(--accent)', cursor: 'pointer', fontWeight: 700 }}>+</button>
                </div>
              ) : (
                <button 
                  onClick={(e) => { e.preventDefault(); handleAdd(s.variants && s.variants.length > 0 ? s.variants[selectedVariantIdx] : undefined); }}
                  style={{
                    padding:'10px 20px', background:'var(--accent)', color:'#fff', 
                    borderRadius:'12px', fontSize:13, fontWeight:800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    border:'none', cursor:'pointer', whiteSpace:'nowrap', transition:'all 0.2s', boxShadow: '0 4px 12px rgba(255, 117, 31, 0.25)'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(255, 117, 31, 0.35)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 117, 31, 0.25)'; }}
                >
                  <span style={{ fontSize: 16, lineHeight: 1 }}>+</span> Add
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      {bookingMode && (
        <BookingOptionsModal
          isOpen={optionsOpen}
          onClose={() => setOptionsOpen(false)}
          serviceName={s.name}
          basePrice={s.price}
          mode={bookingMode}
          onConfirm={handleOptionsConfirm}
        />
      )}
    </div>
  );
}
