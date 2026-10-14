'use client';
import { use, useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ServiceCard from '@/components/ServiceCard';
import ToastContainer, { toast } from '@/components/Toast';
import { getServiceById, getServicesByCategory } from '@/lib/data';
import type { Service, Category, Testimonial } from '@/lib/database.types';
import supabase from '@/lib/supabase';
import { addToCart, getCart, formatPrice } from '@/lib/utils';
import DosAndDontsModal from '@/components/DosAndDontsModal';
import BookingOptionsModal from '@/components/BookingOptionsModal';
import { getBookingMode, getServiceIcon, COMPANION_HOURLY_INCREMENT, type BookingOptions } from '@/lib/companion';
import { Info, CheckCircle2, X } from 'lucide-react';

export default function ServiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [service, setService] = useState<Service | null>(null);
  const [related, setRelated] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [dbReviews, setDbReviews] = useState<Testimonial[]>([]);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<'add' | 'book'>('add');

  useEffect(() => {
    getServiceById(id).then(async s => {
      setService(s);
      if (s) {
        if (s.variants && s.variants.length > 0) {
          setSelectedVariant(s.variants[0]);
        }
        
        // Fetch real reviews by service_id first
        let { data } = await supabase.from('testimonials').select('*').eq('service_id', s.id).eq('is_approved', true).limit(5).order('created_at', { ascending: false });
        
        // Fallback to old service_name matching if no specific ones are linked
        if (!data || data.length === 0) {
          const { data: fallbackData } = await supabase.from('testimonials').select('*').eq('service_name', s.name).eq('is_approved', true).limit(5).order('created_at', { ascending: false });
          data = fallbackData;
        }
        
        if (data) setDbReviews(data);

        getServicesByCategory(s.category_id).then(list => {
          setRelated(list.filter(r => r.id !== s.id).slice(0, 3));
        });
      }
      setLoading(false);
      setTimeout(() => {
        if (window.location.hash === '#reviews') {
          document.getElementById('reviews')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    });
  }, [id]);

  if (loading) {
    return <><Navbar /><div style={{ minHeight: '100vh', paddingTop: 'var(--navbar-h)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p style={{ color: 'var(--text-secondary)' }}>Loading...</p></div></>;
  }

  if (!service) {
    return (
      <>
        <Navbar /><ToastContainer />
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: 'var(--navbar-h)' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>🔍</div>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', marginBottom: 8 }}>Service Not Found</h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>The service you&apos;re looking for doesn&apos;t exist.</p>
            <Link href="/services" className="btn btn-primary">Browse Services</Link>
          </div>
        </div>
      </>
    );
  }

  const cat = service.category as Category | undefined;
  // Companion / Helping Buddy services collect booking options before add-to-cart
  const bookingMode = getBookingMode(cat);

  const finalRating = service.rating;
  const finalReviews = service.reviews;

  const reviewData = [
    { name: 'Priya S.', avatar: 'P', text: 'Excellent service! The professional was very skilled and completed the work perfectly. Will definitely book again.', time: '2 days ago' },
    { name: 'Amit K.', avatar: 'A', text: 'Great value for money. The quality of work exceeded my expectations. Highly recommend Zarpit!', time: '4 days ago' },
    { name: 'Neha G.', avatar: 'N', text: 'Very punctual and professional. The work was done neatly and they cleaned up after themselves.', time: '1 week ago' },
    { name: 'Rahul M.', avatar: 'R', text: 'Good experience overall. The professional was friendly and knowledgeable. Top-notch quality.', time: '1 week ago' },
    { name: 'Kavita D.', avatar: 'K', text: 'Super fast and efficient! They knew exactly what to do and did it well.', time: '2 weeks ago' },
    { name: 'Sanjay V.', avatar: 'S', text: 'Amazing service! I was a bit skeptical at first but they proved me wrong. Will use again.', time: '2 weeks ago' },
    { name: 'Pooja R.', avatar: 'P', text: 'Highly professional behavior. The expert arrived on time and finished ahead of schedule.', time: '3 weeks ago' },
    { name: 'Ravi T.', avatar: 'R', text: 'Very clean and systematic approach. Totally worth the money spent.', time: '3 weeks ago' },
    { name: 'Sneha P.', avatar: 'S', text: 'I am so glad I booked this. The result is just flawless.', time: '1 month ago' },
    { name: 'Vikram B.', avatar: 'V', text: 'Polite and courteous professional. Did the job right the first time.', time: '1 month ago' },
    { name: 'Anjali S.', avatar: 'A', text: 'Booking was so easy, and the execution was even better. 5 stars!', time: '1 month ago' },
    { name: 'Arjun N.', avatar: 'A', text: 'Highly recommended for anyone looking for premium service quality.', time: '1 month ago' },
    { name: 'Divya C.', avatar: 'D', text: 'I loved how they explained everything before starting. Total transparency.', time: '2 months ago' },
    { name: 'Manoj L.', avatar: 'M', text: 'Great experience. Everything was seamless from start to finish.', time: '2 months ago' },
    { name: 'Deepa H.', avatar: 'D', text: 'They brought their own tools and did not ask for anything. Completely hassle-free.', time: '2 months ago' },
    { name: 'Karan J.', avatar: 'K', text: 'Brilliant work! They even gave some free advice on maintenance.', time: '3 months ago' },
    { name: 'Ritu K.', avatar: 'R', text: 'It was good, standard service. No complaints at all.', time: '3 months ago' },
    { name: 'Sachin D.', avatar: 'S', text: 'Absolutely fantastic. I have already recommended Zarpit to my friends.', time: '3 months ago' },
    { name: 'Megha W.', avatar: 'M', text: 'Very detailed work. The professional was very patient and answered all my questions.', time: '4 months ago' },
    { name: 'Tarun Y.', avatar: 'T', text: 'Great job! Keep up the good work guys.', time: '4 months ago' },
    { name: 'Prakash K.', avatar: 'P', text: 'Affordable and reliable. You cannot ask for more.', time: '5 months ago' },
    { name: 'Simran J.', avatar: 'S', text: 'Very hygienic and strictly followed safety protocols.', time: '5 months ago' },
    { name: 'Naveen A.', avatar: 'N', text: 'Good quality service at a reasonable price.', time: '6 months ago' }
  ];

  const handleAction = (action: 'add' | 'book') => {
    if (!service) return;
    if (bookingMode) {
      setPendingAction(action);
      setOptionsOpen(true);
      return;
    }
    handleAdd();
    if (action === 'book') window.location.href = '/cart';
  };

  const handleOptionsConfirm = (options: BookingOptions, totalPrice: number) => {
    if (!service) return;
    addToCart({
      id: service.id,
      name: service.name,
      price: totalPrice,
      originalPrice: totalPrice,
      duration: bookingMode === 'companion' ? `${options.hours} hr${options.hours > 1 ? 's' : ''}` : service.duration,
      category: cat?.name || service.category_id,
      image: service.image,
      options,
    });
    setOptionsOpen(false);
    if (pendingAction === 'book') {
      window.location.href = '/cart';
    } else {
      toast.success('Added to Cart', `${service.name} has been added to your cart.`);
    }
  };

  const handleAdd = () => {
    if (!service) return;
    const variantName = selectedVariant ? selectedVariant.name : undefined;
    const price = selectedVariant ? selectedVariant.price : service.price;
    const originalPrice = selectedVariant ? (selectedVariant.original_price || Math.floor(price * 1.2)) : service.original_price;

    const cartBefore = getCart();
    const existingItem = cartBefore.find(i => i.id === service.id && i.variantName === variantName);
    
    const isNew = addToCart({
      id: service.id,
      name: service.name,
      price: price,
      originalPrice: originalPrice,
      duration: service.duration,
      category: cat?.name || service.category_id,
      image: service.image,
      variantName: variantName
    });

    if (isNew) {
      toast.success('Added to Cart', `${service.name}${variantName ? ` - ${variantName}` : ''} has been added to your cart.`);
    } else {
      const newQty = existingItem ? Math.min(existingItem.quantity + 1, 5) : 1;
      if (existingItem && newQty === existingItem.quantity) {
        toast.info('Max Reached', `You can add up to 5 of the same service.`);
      } else {
        toast.success('Quantity Updated', `${service.name}${variantName ? ` - ${variantName}` : ''} quantity increased to ${newQty}.`);
      }
    }
  };

  const currentPrice = selectedVariant ? selectedVariant.price : service?.price || 0;
  const currentOriginalPrice = selectedVariant ? (selectedVariant.original_price || Math.floor(currentPrice * 1.2)) : service?.original_price || 0;
  const currentDiscount = Math.round(((currentOriginalPrice - currentPrice) / currentOriginalPrice) * 100);

  // Brute force fallbacks for when database columns are hidden/empty
  const fallbackData: Record<string, { inc: string[], not: string[] }> = {
    'cleaning': { 
      inc: ['All indoor rooms swept & mopped', 'Bathroom cleaning (toilet, basin, tiles, floor)', 'Kitchen countertops, cabinets & stove cleaning', 'Dusting of furniture, shelves & fixtures', 'Window sills & door frames wiped'],
      not: ['Balcony/terrace/outdoor areas', 'Heavy furniture moving', 'Deep stain removal or polishing', 'Inside drawers/cabinets', 'Appliance interiors (chimney, oven, fridge)']
    },
    'laundry': {
      inc: ['Wash & fold', 'Ironing', 'Stain removal', 'Doorstep pickup & delivery'],
      not: ['Dry cleaning of delicates', 'Leather or suede items', 'Heavy curtains or carpets', 'Shoe cleaning']
    },
    'cooking': {
      inc: ['Meal preparation', 'Kitchen cleaning', 'Grocery management'],
      not: ['Heavy cleaning', 'Professional catering', 'Ingredient costs']
    },
    'home-setting': {
      inc: ['Professional Dusting', 'Furniture arrangement', 'Surface cleaning', 'Organizing items'],
      not: ['Deep stain removal', 'Moving heavy appliances', 'External window cleaning']
    }
  };

  const currentSlug = (service.category as any)?.slug || service.category_id || 'cleaning';
  const localGuidelines = fallbackData[currentSlug] || fallbackData['cleaning'];

  const dosDonts = service.dos_and_donts;
  const hasDosDonts = !!dosDonts && (((dosDonts.dos?.length) || 0) + ((dosDonts.donts?.length) || 0) > 0);

  // When a service has its own Do's & Don'ts, don't fall back to generic cleaning guidelines
  const finalIncluded = (service.included && service.included.length > 0) ? service.included : (hasDosDonts ? [] : localGuidelines.inc);
  const finalNotIncluded = (service.not_included && service.not_included.length > 0) ? service.not_included : (hasDosDonts ? [] : localGuidelines.not);

  return (
    <>
      <Navbar /><ToastContainer />
      <div style={{ paddingTop: 'calc(var(--navbar-h) + 32px)', paddingBottom: 80, minHeight: '100vh' }}>
        <div className="container">
          {/* Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-muted)', marginBottom: 32 }}>
            <Link href="/" style={{ color: 'var(--text-secondary)' }}>Home</Link><span>›</span>
            <Link href={`/services?cat=${service.category_id}`} style={{ color: 'var(--text-secondary)' }}>{cat?.name || service.category_id}</Link><span>›</span>
            <span style={{ color: 'var(--text)' }}>{service.name}</span>
          </div>

          <style dangerouslySetInnerHTML={{
            __html: `
            .amazon-layout { display: grid; grid-template-columns: 350px 1fr 350px; gap: 40px; align-items: start; }
            .amazon-gallery { position: sticky; top: calc(var(--navbar-h) + 32px); align-self: start; }
            .amazon-buybox { position: sticky; top: calc(var(--navbar-h) + 32px); align-self: start; }
            @media (max-width: 1280px) {
              .amazon-layout { grid-template-columns: 300px 1fr 300px; gap: 24px; }
            }
            @media (max-width: 1024px) {
              .amazon-layout { grid-template-columns: 1fr 350px; }
              .amazon-gallery { grid-column: 1 / -1; display: flex; gap: 20px; position: relative; top: 0; }
              .amazon-gallery-main { flex: 1; }
              .amazon-gallery-thumbs { flex-direction: column; width: 100px; }
            }
            @media (max-width: 768px) {
              .amazon-layout { grid-template-columns: 1fr; gap: 24px; }
              .amazon-gallery { flex-direction: column; }
              .amazon-gallery-thumbs { flex-direction: row; width: 100%; }
              .amazon-buybox { position: relative; top: 0; }
            }
            `
          }} />

          <div className="amazon-layout">
            {/* Column 1: Image Gallery */}
            <div className="amazon-gallery" style={{ position: 'sticky', top: 'calc(var(--navbar-h) + 32px)', alignSelf: 'start' }}>
              <div className="amazon-gallery-main" style={{ position: 'relative', aspectRatio: '4/3', borderRadius: 'var(--radius-2xl)', overflow: 'hidden', border: '1px solid var(--border)', marginBottom: 14, background: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {service.image ? (
                  <Image src={service.image} alt={service.name} fill style={{ objectFit: 'cover' }} priority />
                ) : (
                  <span style={{ fontSize: 96 }}>{getServiceIcon(service.name, bookingMode)}</span>
                )}
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.3) 0%, transparent 30%)', pointerEvents: 'none' }} />
                {service.badge && <span className="badge badge-accent" style={{ position: 'absolute', top: 18, left: 18, padding: '6px 16px', fontSize: 12 }}>{service.badge}</span>}
              </div>
              <div className="amazon-gallery-thumbs" style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {[service.image, ...(service.gallery_images || [])].filter(Boolean).map((img, i) => (
                  <div key={i} style={{ width: 'calc(33.333% - 7px)', aspectRatio: '4/3', borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: i === 0 ? '2px solid var(--accent)' : '1px solid var(--border)', cursor: 'pointer', opacity: i === 0 ? 1 : 0.6, transition: 'all 0.2s ease', position: 'relative' }}
                       onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                       onMouseLeave={(e) => { if(i!==0) e.currentTarget.style.opacity = '0.6' }}>
                    <Image src={img} alt="" fill style={{ objectFit: 'cover' }} />
                  </div>
                ))}
              </div>
              {service.video_url && (
                <div style={{ marginTop: 24, borderRadius: 'var(--radius-xl)', overflow: 'hidden', border: '1px solid var(--border)', background: 'var(--bg-elevated)', position: 'relative', paddingTop: '56.25%' }}>
                  <iframe 
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                    src={service.video_url.includes('watch?v=') ? service.video_url.replace('watch?v=', 'embed/') : service.video_url} 
                    title="Service Video" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen>
                  </iframe>
                </div>
              )}
            </div>

            {/* Column 2: Details & Info */}
            <div>
              <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.5rem, 3vw, 2.2rem)', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 14 }}>{service.name}</h1>

              <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
                {!service.is_coming_soon && (
                  <button onClick={() => {
                    document.getElementById('reviews')?.scrollIntoView({behavior: 'smooth', block: 'start'});
                  }} style={{ cursor: 'pointer', border: '1px solid var(--accent-border)', display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', background: 'var(--accent-light)', borderRadius: 'var(--radius-full)', fontSize: 13, fontWeight: 600, color: 'var(--accent)' }}>
                    ★ {finalRating} ({finalReviews.toLocaleString()} reviews)
                  </button>
                )}
                <span style={{ fontSize: 14, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>⏱️ {service.duration}</span>
                <span style={{ fontSize: 14, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>📋 {(finalReviews * 3).toLocaleString()} bookings</span>
              </div>

              <div style={{ paddingBottom: 24, borderBottom: '1px solid var(--border)', marginBottom: 24 }}>
                <p style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.8 }}>{service.description}</p>
              </div>

              {/* Inclusion/Exclusion */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 32 }}>
                {/* Included */}
                {finalIncluded.length > 0 && (
                  <div style={{ padding: 24, background: 'rgba(34,197,94,0.03)', border: '1px solid rgba(34,197,94,0.1)', borderRadius: 'var(--radius-xl)' }}>
                    <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', fontWeight: 700, marginBottom: 18, color: 'var(--success)', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <CheckCircle2 size={18} /> {bookingMode ? "Do's" : <>What&apos;s Included</>}
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                      {finalIncluded.map((item, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'start', gap: 10, fontSize: 13, color: 'var(--text)', lineHeight: 1.4 }}>
                          <span style={{ color: 'var(--success)', flexShrink: 0, marginTop: 2 }}>✓</span>
                          {item.replace(/^-\s*/, '')}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Not Included */}
                {finalNotIncluded.length > 0 && (
                  <div style={{ padding: 24, background: 'rgba(239,68,68,0.03)', border: '1px solid rgba(239,68,68,0.1)', borderRadius: 'var(--radius-xl)' }}>
                    <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', fontWeight: 700, marginBottom: 18, color: 'var(--error)', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <X size={18} /> {bookingMode ? "Don'ts" : <>What&apos;s Not Included</>}
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                      {finalNotIncluded.map((item, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'start', gap: 10, fontSize: 13, color: 'var(--text)', lineHeight: 1.4 }}>
                          <span style={{ color: 'var(--error)', flexShrink: 0, marginTop: 2 }}>✕</span>
                          {item.replace(/^-\s*/, '')}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Do's & Don'ts */}
                {hasDosDonts && (
                  <>
                    {(dosDonts!.dos?.length || 0) > 0 && (
                      <div style={{ padding: 24, background: 'rgba(34,197,94,0.03)', border: '1px solid rgba(34,197,94,0.1)', borderRadius: 'var(--radius-xl)' }}>
                        <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', fontWeight: 700, marginBottom: 18, color: 'var(--success)', display: 'flex', alignItems: 'center', gap: 8 }}>
                          <CheckCircle2 size={18} /> Do&apos;s
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                          {dosDonts!.dos.map((item, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'start', gap: 10, fontSize: 13, color: 'var(--text)', lineHeight: 1.4 }}>
                              <span style={{ color: 'var(--success)', flexShrink: 0, marginTop: 2 }}>✓</span>
                              {item.replace(/^-\s*/, '')}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {(dosDonts!.donts?.length || 0) > 0 && (
                      <div style={{ padding: 24, background: 'rgba(239,68,68,0.03)', border: '1px solid rgba(239,68,68,0.1)', borderRadius: 'var(--radius-xl)' }}>
                        <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', fontWeight: 700, marginBottom: 18, color: 'var(--error)', display: 'flex', alignItems: 'center', gap: 8 }}>
                          <X size={18} /> Don&apos;ts
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                          {dosDonts!.donts.map((item, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'start', gap: 10, fontSize: 13, color: 'var(--text)', lineHeight: 1.4 }}>
                              <span style={{ color: 'var(--error)', flexShrink: 0, marginTop: 2 }}>✕</span>
                              {item.replace(/^-\s*/, '')}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Column 3: Buy Box */}
            <div className="amazon-buybox">
              <div style={{ padding: 28, background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-2xl)', boxShadow: 'var(--shadow-md)' }}>
                {/* Price block */}
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 13, color: 'var(--success)', fontWeight: 700, marginBottom: 4 }}>Save {currentDiscount}% right now</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
                    <span style={{ fontFamily: 'var(--font-heading)', fontSize: '2.5rem', fontWeight: 800 }}>{formatPrice(currentPrice)}</span>
                    <span style={{ fontSize: '1.2rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>{formatPrice(currentOriginalPrice)}</span>
                  </div>
                  {bookingMode === 'companion' && (
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600, marginTop: 4 }}>base price + ₹{COMPANION_HOURLY_INCREMENT} per extra hour, per companion</div>
                  )}
                </div>

                {/* Variants Selector */}
                {service.variants && service.variants.length > 0 && (
                  <div style={{ marginBottom: 24 }}>
                    <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>Options</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {service.variants.map((v: any, idx: number) => {
                        const isSelected = selectedVariant?.name === v.name;
                        return (
                          <button
                            key={idx}
                            onClick={() => setSelectedVariant(v)}
                            style={{
                              padding: '12px 16px',
                              borderRadius: 12,
                              background: isSelected ? 'var(--accent-light)' : 'transparent',
                              border: `1.5px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
                              color: 'var(--text)',
                              fontSize: 14,
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              transition: 'all 0.2s'
                            }}
                          >
                            <span>{v.name}</span>
                            <span style={{ color: isSelected ? 'var(--accent)' : 'var(--text-muted)' }}>{formatPrice(v.price)}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Trust Badges */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24, padding: 16, background: 'var(--bg)', borderRadius: 12, border: '1px solid var(--border-light)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--text-secondary)' }}><CheckCircle2 size={16} color="var(--success)" /> Verified Professionals</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--text-secondary)' }}><CheckCircle2 size={16} color="var(--success)" /> 100% Satisfaction Guarantee</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--text-secondary)' }}><CheckCircle2 size={16} color="var(--success)" /> Free Rescheduling</div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {(service.is_coming_soon || (service.category as any)?.is_coming_soon) ? (
                    <div style={{ padding: '16px', background: 'var(--warning-bg)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: 12, textAlign: 'center', color: 'var(--warning)' }}>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 4 }}>Coming Soon</h3>
                      <p style={{ fontSize: 13, opacity: 0.9 }}>This service will be launched shortly.</p>
                    </div>
                  ) : (
                    <>
                      <button className="btn btn-primary btn-lg" style={{ width: '100%', height: 52 }} onClick={() => handleAction('book')}>Book Now</button>
                      <button className="btn btn-secondary btn-lg" style={{ width: '100%', height: 52 }} onClick={() => handleAction('add')}>Add to Cart</button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 64, borderTop: '1px solid var(--border)', paddingTop: 40 }}>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', fontWeight: 700, marginBottom: 24 }}>Frequently Asked Questions</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: 16 }}>
              {[
                { q: 'How long does this service take?', a: `This service typically takes ${service.duration}. Duration may vary based on scope.` },
                { q: 'Is the professional background-verified?', a: 'Yes, all Zarpit professionals undergo thorough background verification, skill tests, and training.' },
                { q: 'What is the cancellation policy?', a: 'Free cancellation up to 45 minutes before the scheduled time.' },
              ].map((faq, i) => (
                <details key={i} style={{ padding: '20px 24px', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-xl)', backdropFilter: 'blur(12px)', cursor: 'pointer' }}>
                  <summary style={{ fontSize: 15, fontWeight: 700, listStyle: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {faq.q} <span style={{ color: 'var(--accent)', fontSize: 20 }}>+</span>
                  </summary>
                  <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border-light)' }}>{faq.a}</p>
                </details>
              ))}
            </div>
          </div>

          {/* Customer Reviews - Amazon Style */}
          <div id="reviews" style={{ marginTop: 80, borderTop: '1px solid var(--border)', paddingTop: 40 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 40 }} className="reviews-layout">
              <style dangerouslySetInnerHTML={{ __html: `@media (max-width: 768px) { .reviews-layout { grid-template-columns: 1fr !important; } }` }} />
              
              {/* Left Column: Summary */}
              <div>
                <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', fontWeight: 700, marginBottom: 8 }}>Customer Reviews</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <div style={{ color: '#FAAF00', fontSize: 24 }}>★★★★★</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{finalRating} out of 5</div>
                </div>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24 }}>{finalReviews.toLocaleString()} global ratings</p>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    { stars: 5, pct: 82 }, { stars: 4, pct: 12 }, { stars: 3, pct: 4 }, { stars: 2, pct: 1 }, { stars: 1, pct: 1 }
                  ].map(row => (
                    <div key={row.stars} style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 13, color: 'var(--accent)' }}>
                      <span style={{ width: 40, whiteSpace: 'nowrap' }}>{row.stars} star</span>
                      <div style={{ flex: 1, height: 12, background: 'var(--bg-elevated)', borderRadius: 6, border: '1px solid var(--border)', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${row.pct}%`, background: '#FAAF00', borderRadius: 4 }} />
                      </div>
                      <span style={{ width: 30, textAlign: 'right', color: 'var(--text-secondary)' }}>{row.pct}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Reviews List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 8 }}>Top reviews</h3>
                {dbReviews.length > 0 ? dbReviews.map((r, i) => (
                  <div key={i} style={{ paddingBottom: 24, borderBottom: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, border: '1px solid var(--border)' }}>{r.avatar || 'U'}</div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{r.user_name}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <div style={{ color: '#FAAF00', fontSize: 14 }}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</div>
                      <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 700 }}>Verified Purchase</span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>Reviewed in {r.location}</div>
                    <p style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.6 }}>{r.text}</p>
                  </div>
                )) : reviewData.map((r, i) => (
                  <div key={i} style={{ paddingBottom: 24, borderBottom: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, border: '1px solid var(--border)' }}>{r.avatar}</div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{r.name}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <div style={{ color: '#FAAF00', fontSize: 14 }}>★★★★★</div>
                      <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 700 }}>Verified Purchase</span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>Reviewed in India on {r.time}</div>
                    <p style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.6 }}>{r.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Related */}
          {related.length > 0 && (
            <div style={{ marginTop: 80 }}>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', fontWeight: 700, marginBottom: 28 }}>You Might Also Like</h2>
              <div className="grid-cols-3">
                {related.map(s => <ServiceCard key={s.id} service={s} onAdded={() => toast.success('Added', `${s.name} added!`)} />)}
              </div>
            </div>
          )}
        </div>
      </div>
      {service && bookingMode && (
        <BookingOptionsModal
          isOpen={optionsOpen}
          onClose={() => setOptionsOpen(false)}
          serviceName={service.name}
          basePrice={selectedVariant ? selectedVariant.price : service.price}
          mode={bookingMode}
          confirmLabel={pendingAction === 'book' ? 'Book Now' : 'Add to Cart'}
          onConfirm={handleOptionsConfirm}
        />
      )}
      {service && (
        <DosAndDontsModal
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          serviceName={service.name} 
          dosAndDonts={service.dos_and_donts}
          included={finalIncluded}
          not_included={finalNotIncluded}
        />
      )}
      <Footer />
    </>
  );
}
