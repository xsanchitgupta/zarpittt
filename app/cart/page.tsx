'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import ToastContainer, { toast } from '@/components/Toast';
import { getCart, removeFromCart, updateQuantity, getCartTotal, getCartSavings, getCartCount, applyCoupon, applyCouponDB, formatPrice, type CartItem } from '@/lib/utils';
import { formatOptionsSummary, optionsSignature } from '@/lib/companion';
import { ShoppingCart, Clock } from 'lucide-react';

export default function CartPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState('');
  const [selectedTime, setSelectedTime] = useState('02:00 PM');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setCart(getCart());
    const saved = localStorage.getItem('zarpit_coupon');
    if (saved) {
      setCouponApplied(saved);
      setCouponCode(saved);
    }
  }, []);

  useEffect(() => {
    const update = () => setCart(getCart());
    window.addEventListener('cartUpdate', update);
    return () => window.removeEventListener('cartUpdate', update);
  }, []);

  // Recalculate coupon discount whenever cart or couponApplied changes
  useEffect(() => {
    if (!couponApplied) {
      setCouponDiscount(0);
      return;
    }
    
    const code = couponApplied.toUpperCase();
    const recalc = async () => {
      try {
        const result = await applyCouponDB(code, getCartTotal());
        if (result) {
          setCouponDiscount(result.discount);
        } else {
          const offlineResult = applyCoupon(code);
          if (offlineResult) {
            setCouponDiscount(offlineResult.discount);
          } else {
            setCouponDiscount(0);
            setCouponApplied('');
            localStorage.removeItem('zarpit_coupon');
          }
        }
      } catch (e) {
        console.error('Recalc coupon failed', e);
      }
    };
    
    recalc();
  }, [cart, couponApplied]);

  if (!mounted) return <><Navbar /><div style={{minHeight:'100vh',paddingTop:'var(--navbar-h)'}} /></>;

  const subtotal = getCartTotal();
  const savings = getCartSavings();
  const tax = 0; // 0% GST as requested
  const total = subtotal + tax - couponDiscount;
  const today = new Date().toISOString().split('T')[0];

  const handleCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = couponCode.trim().toUpperCase();
    if (!code) return;

    try {
      const result = await applyCouponDB(code, subtotal);
      if (result) {
        setCouponDiscount(result.discount);
        setCouponApplied(result.code);
        localStorage.setItem('zarpit_coupon', result.code);
        toast.success('Coupon Applied!', `You saved ${formatPrice(result.discount)} with ${result.code}`);
      } else {
        const offlineResult = applyCoupon(code);
        if (offlineResult) {
          setCouponDiscount(offlineResult.discount);
          setCouponApplied(offlineResult.code);
          localStorage.setItem('zarpit_coupon', offlineResult.code);
          toast.success('Coupon Applied!', `You saved ${formatPrice(offlineResult.discount)} with ${offlineResult.code}`);
        } else {
          toast.error('Invalid', 'This coupon code is not valid.');
        }
      }
    } catch (err) {
      console.error('Coupon error:', err);
      toast.error('Error', 'Failed to validate coupon.');
    }
  };

  return (
    <>
      <Navbar /><ToastContainer />
      <div style={{paddingTop:'calc(var(--navbar-h) + 32px)',paddingBottom:80,minHeight:'100vh'}}>
        <div className="container">
          <div style={{display:'flex',alignItems:'center',gap:8,fontSize:13,color:'var(--text-muted)',marginBottom:24}}>
            <Link href="/" style={{color:'var(--text-secondary)'}}>Home</Link><span>›</span><span style={{color:'var(--text)'}}>Cart</span>
          </div>
          <h1 style={{fontFamily:'var(--font-heading)',fontSize:'2rem',fontWeight:700,marginBottom:32,letterSpacing:'-0.02em'}}>Your Cart</h1>

          {cart.length === 0 ? (
            <div style={{textAlign:'center',padding:80}}>
              <div style={{marginBottom:16,display:'flex',justifyContent:'center'}}>
                <ShoppingCart size={64} style={{color:'var(--text-muted)'}} />
              </div>
              <h3 style={{fontFamily:'var(--font-heading)',fontSize:'1.2rem',marginBottom:8}}>Your cart is empty</h3>
              <p style={{color:'var(--text-secondary)',marginBottom:24,fontSize:14}}>Browse our services and add them to your cart.</p>
              <Link href="/services" className="btn btn-primary">Browse Services</Link>
            </div>
          ) : (
            <div className="page-layout-sidebar">
              {/* Items */}
              <div style={{display:'flex',flexDirection:'column',gap:16}}>
                {cart.map(item => {
                  const optionLines = formatOptionsSummary(item.options);
                  return (
                    <div key={`${item.id}-${item.variantName || ''}-${optionsSignature(item.options)}`} style={{display:'flex',gap:20,padding:20,background:'var(--glass-bg)',border:'1px solid var(--glass-border)',borderRadius:'var(--radius-xl)',backdropFilter:'blur(20px)',transition:'all 0.25s ease'}}>
                      <div style={{width:100,height:100,borderRadius:'var(--radius-lg)',overflow:'hidden',flexShrink:0,position:'relative'}}>
                        <Image src={item.image || '/images/salon.png'} alt={item.name} fill style={{objectFit:'cover'}} />
                      </div>
                      <div style={{flex:1,display:'flex',flexDirection:'column',gap:4}}>
                        <h3 style={{fontFamily:'var(--font-heading)',fontSize:16,fontWeight:600}}>
                          {item.name}{item.variantName ? ` - ${item.variantName}` : ''}
                        </h3>
                        <p style={{fontSize:13,color:'var(--text-secondary)',display:'flex',alignItems:'center',gap:4}}><Clock size={12} /> {item.duration}{item.category && !item.category.includes('-') ? ` • ${item.category}` : ''}</p>
                        {optionLines.length > 0 && (
                          <div style={{display:'flex',flexDirection:'column',gap:2,marginTop:4,padding:'8px 12px',background:'var(--accent-light)',border:'1px solid var(--accent-border)',borderRadius:10}}>
                            {optionLines.map((line, i) => (
                              <span key={i} style={{fontSize:12,color:'var(--text-secondary)',lineHeight:1.5}}>{line}</span>
                            ))}
                          </div>
                        )}
                        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginTop:'auto'}}>
                          <span style={{fontFamily:'var(--font-heading)',fontSize:'1.1rem',fontWeight:700}}>{formatPrice(item.price * item.quantity)}</span>
                          <div style={{display:'flex',alignItems:'center',gap:12}}>
                            {/* Quantity controls */}
                            <div style={{display:'flex',alignItems:'center',gap:0,border:'1px solid var(--border)',borderRadius:999,overflow:'hidden'}}>
                              <button
                                onClick={() => { updateQuantity(item.id, item.variantName, item.quantity - 1, item.options); setCart(getCart()); }}
                                style={{width:30,height:30,display:'grid',placeItems:'center',background:'transparent',border:'none',color:'var(--text-secondary)',cursor:'pointer',fontSize:16,fontWeight:700,transition:'background 0.1s'}}
                                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                              >−</button>
                              <span style={{minWidth:28,textAlign:'center',fontSize:14,fontWeight:700,color:'var(--text)'}}>{item.quantity}</span>
                              <button
                                onClick={() => {
                                  if (item.quantity >= 5) { toast.info('Max Quantity', 'You can add up to 5 of the same service.'); return; }
                                  updateQuantity(item.id, item.variantName, item.quantity + 1, item.options);
                                  setCart(getCart());
                                }}
                                style={{width:30,height:30,display:'grid',placeItems:'center',background:'transparent',border:'none',color: item.quantity >= 5 ? 'var(--text-muted)' : 'var(--accent)',cursor: item.quantity >= 5 ? 'default' : 'pointer',fontSize:16,fontWeight:700,transition:'background 0.1s'}}
                                onMouseEnter={e => { if (item.quantity < 5) e.currentTarget.style.background = 'var(--bg-hover)'; }}
                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                              >+</button>
                            </div>
                            <button onClick={() => { removeFromCart(item.id, item.variantName, item.options); setCart(getCart()); toast.info('Removed', 'Item removed from cart.'); }} style={{fontSize:13,color:'var(--text-muted)',cursor:'pointer',transition:'color 0.15s'}}
                              onMouseEnter={e => (e.currentTarget.style.color = 'var(--error)')} onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}>Remove</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Summary */}
              <div style={{position:'sticky',top:'calc(var(--navbar-h) + 32px)'}}>
                <div style={{padding:28,background:'var(--glass-bg)',border:'1px solid var(--glass-border)',borderRadius:'var(--radius-xl)',backdropFilter:'blur(24px)'}}>
                  <h3 style={{fontFamily:'var(--font-heading)',fontSize:'1.1rem',fontWeight:600,marginBottom:24}}>Order Summary</h3>
                  <div style={{display:'flex',flexDirection:'column',gap:12,marginBottom:16}}>
                    <div style={{display:'flex',justifyContent:'space-between',fontSize:14,color:'var(--text-secondary)'}}><span>Subtotal</span><span>{formatPrice(subtotal)}</span></div>
                    <div style={{display:'flex',justifyContent:'space-between',fontSize:14,color:'var(--text-secondary)'}}><span>You Save</span><span style={{color:'var(--success)'}}>−{formatPrice(savings)}</span></div>
                    <div style={{display:'flex',justifyContent:'space-between',fontSize:14,color:'var(--text-secondary)'}}><span>Service Tax (0%)</span><span>{formatPrice(tax)}</span></div>
                    {couponDiscount > 0 && <div style={{display:'flex',justifyContent:'space-between',fontSize:14,color:'var(--text-secondary)'}}><span>Coupon ({couponApplied})</span><span style={{color:'var(--success)'}}>−{formatPrice(couponDiscount)}</span></div>}
                    <div style={{display:'flex',justifyContent:'space-between',fontSize:'1.1rem',fontWeight:700,paddingTop:14,borderTop:'1px solid var(--border)'}}><span>Total</span><span>{formatPrice(total)}</span></div>
                  </div>

                  {/* Coupon */}
                  {!couponApplied ? (
                    <form onSubmit={handleCoupon} style={{display:'flex',gap:8,marginBottom:20}}>
                      <input className="input" placeholder="Coupon code" value={couponCode} onChange={e => setCouponCode(e.target.value)} style={{fontSize:13,padding:'10px 14px'}} />
                      <button type="submit" style={{padding:'10px 18px',background:'var(--glass-bg)',border:'1px solid var(--glass-border)',borderRadius:'var(--radius-md)',color:'var(--accent)',fontWeight:600,fontSize:13,cursor:'pointer',whiteSpace:'nowrap'}}>Apply</button>
                    </form>
                  ) : (
                    <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:20}}>
                      <div className="badge badge-success" style={{flex:1,padding:'8px 14px',display:'flex',justifyContent:'space-between',alignItems:'center',width:'100%',borderRadius:'var(--radius-md)'}}>
                        <span>✓ {couponApplied} applied — {formatPrice(couponDiscount)} off</span>
                        <button 
                          onClick={() => {
                            setCouponApplied('');
                            setCouponDiscount(0);
                            setCouponCode('');
                            localStorage.removeItem('zarpit_coupon');
                            toast.info('Coupon Removed', 'The coupon discount has been removed.');
                          }}
                          style={{background:'transparent',border:'none',color:'inherit',cursor:'pointer',fontWeight:700,fontSize:14,marginLeft:8,padding:0,lineHeight:1}}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  )}


                  <Link href="/checkout" className="btn btn-primary btn-lg" style={{width:'100%',marginTop:24}}>
                    Proceed to Checkout
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
