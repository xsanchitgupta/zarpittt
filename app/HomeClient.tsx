'use client';
import Script from 'next/script';
import Image from 'next/image';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ToastContainer, { toast } from '@/components/Toast';
import type { Category, ServiceArea, Testimonial } from '@/lib/database.types';
import type { HomeContent } from '@/lib/content';
import { useRef, useEffect, useState } from 'react';
import { Smartphone, Apple, Search, Calendar, CheckCircle2, ArrowRight, Target, Rocket } from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';

const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.2, 0.8, 0.2, 1] as [number, number, number, number] } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15
    }
  }
};

export default function HomeClient({ initialCategories, initialAreas, initialTestimonials, content }: { initialCategories: Category[], initialAreas: ServiceArea[], initialTestimonials: Testimonial[], content: HomeContent }) {
  const categories = initialCategories || [];
  const areas = initialAreas || [];
  const areaNames = areas.map(a => a.name).join(', ') || 'Noida, Delhi, Ghaziabad';
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(() => {
        setDeferredPrompt(null);
      });
    } else {
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
      if (isIOS) {
        toast.info('To install the app on iOS, tap the Share icon and select "Add to Home Screen".');
      } else {
        toast.info('Either the app is already installed or you are not on the selected device.');
      }
    }
  };

  return (
    <>
      <Navbar />
      <ToastContainer />
      <Script
        id="faq-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": content.faqs.map(faq => ({
              "@type": "Question",
              "name": faq.q,
              "acceptedAnswer": {
                "@type": "Answer",
                "text": faq.a
              }
            }))
          })
        }}
      />

      {/* ===== HERO ===== */}
      <section style={{
        position:'relative', minHeight:'auto', display:'flex', alignItems:'center',
        paddingTop:'var(--navbar-h)', paddingBottom: 80, overflow:'hidden'
      }}>
        {/* Background layers */}
        <div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse 70% 50% at 50% 30%, rgba(255,117,31,0.05) 0%, transparent 60%)'}} />
        <div style={{position:'absolute',top:'-20%',right:'-10%',width:600,height:600,borderRadius:'50%',background:'radial-gradient(circle, rgba(255,117,31,0.04) 0%, transparent 70%)',filter:'blur(60px)'}} />
        <div style={{position:'absolute',bottom:'-20%',left:'-10%',width:500,height:500,borderRadius:'50%',background:'radial-gradient(circle, rgba(255,255,255,0.02) 0%, transparent 70%)',filter:'blur(60px)'}} />

        <div className="container" style={{position:'relative',zIndex:1}}>
          <div className="hero-grid" style={{minHeight: 'auto'}}>
            <motion.div initial="hidden" animate="visible" variants={staggerContainer}>
              <motion.div variants={fadeInUp} className="section-label hero-label">
                <span className="live-dot" style={{width:8,height:8,borderRadius:'50%',background:'var(--accent)',display:'inline-block',marginRight:6}}/> Serving {areaNames}
              </motion.div>
              <motion.h1 variants={fadeInUp} style={{fontFamily:'var(--font-heading)',fontSize:'clamp(2.5rem, 5.5vw, 4.2rem)',fontWeight:800,letterSpacing:'-0.04em',lineHeight:1.08,marginBottom:24}}>
                {content.heroLine1}<br/>
                <span style={{background:'linear-gradient(135deg, var(--accent) 0%, #ffb685 100%)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>{content.heroLine2}</span>
              </motion.h1>

              {/* Quick Order Grid - Moved here */}
              <motion.div variants={fadeInUp} style={{
                position:'relative', marginTop: 24, 
                padding:'var(--hero-card-padding)', background:'var(--glass-bg)', backdropFilter:'blur(24px)', 
                borderRadius:'var(--radius-2xl)', border:'1px solid var(--glass-border)', 
                boxShadow:'var(--shadow-xl)', maxWidth: 540
              }}>
                <h3 style={{fontFamily:'var(--font-heading)',fontSize:'1.15rem',fontWeight:700,marginBottom:16}}>{content.quickTitle}</h3>
                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:14}}>
                  {content.tiles.map((svc, idx) => {
                    // Prefer the matching DB category slug so links stay correct if slugs change
                    const dbCat = categories.find(c => c.slug === svc.slug || c.name.toLowerCase() === svc.name.toLowerCase());
                    const tileBody = (
                      <>
                        <div style={{position:'absolute', top:'-40%', left:'50%', transform:'translateX(-50%)', width:180, height:180, borderRadius:'50%', background:'radial-gradient(circle, var(--accent-light) 0%, transparent 70%)', opacity:0.6, pointerEvents:'none'}} />
                        {svc.comingSoon && (
                          <span style={{position:'absolute', top:10, right:10, fontSize:9.5, fontWeight:800, letterSpacing:'0.04em', padding:'4px 9px', borderRadius:999, background:'var(--warning-bg)', color:'var(--warning)', border:'1px solid rgba(245, 158, 11, 0.25)', textTransform:'uppercase'}}>Coming Soon</span>
                        )}
                        <div style={{
                          width:76, height:76, borderRadius:24, fontSize:38, position:'relative', overflow:'hidden',
                          background:'linear-gradient(135deg, var(--accent-light), rgba(255,154,86,0.15))',
                          border:'1px solid var(--accent-border)', display:'flex', alignItems:'center', justifyContent:'center',
                          boxShadow:'0 10px 28px rgba(255,117,31,0.18)',
                          filter: svc.comingSoon ? 'grayscale(0.4)' : 'none'
                        }}>
                          {/* Emoji sits behind the photo so a broken image URL still shows something */}
                          <span style={{position:'absolute'}}>{svc.icon}</span>
                          {svc.image && (
                            <Image src={svc.image} alt={svc.name} fill style={{objectFit:'cover', zIndex:1}} sizes="76px"
                              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                          )}
                        </div>
                        <span style={{fontSize:15.5, fontWeight:800, lineHeight:1.2, color:'var(--text-primary)', fontFamily:'var(--font-heading)'}}>{svc.name}</span>
                        <span style={{fontSize:11.5, color:'var(--text-secondary)', lineHeight:1.5}}>{svc.desc}</span>
                        <div style={{display:'flex', flexWrap:'wrap', gap:5, justifyContent:'center'}}>
                          {svc.tags.map((t, i) => (
                            <span key={i} style={{fontSize:10, fontWeight:700, color:'var(--text-secondary)', padding:'3px 9px', borderRadius:999, background:'var(--bg-input)', border:'1px solid var(--border-light)'}}>{t}</span>
                          ))}
                        </div>
                        {!svc.comingSoon && (
                          <span style={{fontSize:12.5, fontWeight:800, color:'var(--accent)', display:'flex', alignItems:'center', gap:5, marginTop:2}}>Explore <ArrowRight size={14} /></span>
                        )}
                      </>
                    );
                    const tileStyle: React.CSSProperties = {
                      position:'relative', overflow:'hidden',
                      display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center', gap:10,
                      padding:'24px 14px 20px', background:'var(--glass-bg)', borderRadius:'var(--radius-xl)',
                      transition:'all 0.3s ease', border:'1px solid var(--glass-border)'
                    };
                    if (svc.comingSoon) {
                      return <div key={idx} style={{...tileStyle, opacity:0.7, cursor:'not-allowed'}}>{tileBody}</div>;
                    }
                    return (
                      <Link key={idx} href={`/services?cat=${dbCat?.slug || svc.slug}`} style={tileStyle}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent-border)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px) scale(1.02)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 16px 40px rgba(255,117,31,0.15)'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--glass-border)'; (e.currentTarget as HTMLElement).style.transform = 'none'; (e.currentTarget as HTMLElement).style.boxShadow = 'none'; }}
                      >
                        {tileBody}
                      </Link>
                    );
                  })}
                </div>
              </motion.div>
            </motion.div>

            {/* Professional Service Collage - New second column */}
            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1, delay: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
              style={{
              position:'relative', height:'100%', minHeight: 500, display:'flex', alignItems:'center', 
              zIndex: 0
            }}>
              <div style={{position:'absolute', inset:0, background:'radial-gradient(circle at 50% 50%, var(--accent-light) 0%, transparent 70%)', opacity:0.3, borderRadius:'50%', filter:'blur(80px)'}} />
              
              <div style={{
                display:'grid', 
                gridTemplateColumns:'1fr 1fr', 
                gap:20, 
                width:'100%',
                position:'relative',
                paddingRight: 20
              }}>
                {/* Column 1 */}
                <div style={{display:'flex', flexDirection:'column', gap:20}}>
                   <div style={{position:'relative', height: 280, borderRadius:'var(--radius-2xl)', overflow:'hidden', border:'1px solid var(--glass-border)', boxShadow:'var(--shadow-xl)'}}>
                     <Image src={content.collageImages[0] || '/images/Baby care.png'} alt="Zarpit service" fill style={{objectFit:'cover'}} sizes="300px" />
                   </div>
                   <div style={{position:'relative', height: 180, borderRadius:'var(--radius-2xl)', overflow:'hidden', border:'1px solid var(--glass-border)', boxShadow:'var(--shadow-lg)'}}>
                     <Image src={content.collageImages[1] || '/images/Safety Person.png'} alt="Zarpit service" fill style={{objectFit:'cover'}} sizes="300px" />
                   </div>
                </div>

                {/* Column 2 - Staggered */}
                <div style={{display:'flex', flexDirection:'column', gap:20, paddingTop: 40}}>
                   <div style={{position:'relative', height: 180, borderRadius:'var(--radius-2xl)', overflow:'hidden', border:'1px solid var(--glass-border)', boxShadow:'var(--shadow-lg)'}}>
                     <Image src={content.collageImages[2] || '/images/cooking.png'} alt="Zarpit service" fill style={{objectFit:'cover'}} sizes="300px" />
                   </div>
                   <div style={{position:'relative', height: 280, borderRadius:'var(--radius-2xl)', overflow:'hidden', border:'1px solid var(--glass-border)', boxShadow:'var(--shadow-xl)'}}>
                     <Image src={content.collageImages[3] || '/images/IMG_20260416_114410.png'} alt="Zarpit service" fill style={{objectFit:'cover'}} sizes="300px" />
                   </div>
                </div>

                {/* Floating Badge - Moved to bottom left to avoid covering faces */}
                <div style={{
                  position:'absolute', bottom:'15%', left:'-5%', 
                  padding:'14px 24px', background:'rgba(10, 10, 10, 0.8)', backdropFilter:'blur(24px)', 
                  borderRadius:'var(--radius-2xl)', border:'1px solid var(--accent-border)',
                  boxShadow:'var(--shadow-xl)', display:'flex', alignItems:'center', gap:12,
                  animation:'float 4s ease-in-out infinite', zIndex: 10,
                  whiteSpace: 'nowrap'
                }}>
                  <div style={{width:36, height:36, background:'var(--accent)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--black)'}}>
                    <CheckCircle2 size={20} />
                  </div>
                  <div>
                    <div style={{fontSize:11, fontWeight:700, color:'var(--accent)', textTransform:'uppercase', letterSpacing:'0.05em'}}>Verified</div>
                    <div style={{fontSize:16, fontWeight:800, color:'#fff'}}>Professional</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ===== WHY US ===== */}
      <section className="section" style={{background:'var(--bg)'}}>
        <div className="container">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer} className="section-header">
            <motion.span variants={fadeInUp} className="section-label">{content.whyUs.label}</motion.span>
            <motion.h2 variants={fadeInUp} className="section-title">{content.whyUs.title}</motion.h2>
            <motion.p variants={fadeInUp} className="section-subtitle">{content.whyUs.subtitle}</motion.p>
          </motion.div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer} className="grid-cols-2">
            {[
              { icon: <Target size={32} />, data: content.vision },
              { icon: <Rocket size={32} />, data: content.mission },
            ].map((block, bi) => (
              <motion.div key={bi} variants={fadeInUp} style={{padding:'48px 40px', background:'var(--glass-bg)', borderRadius:'var(--radius-3xl)', border:'1px solid var(--glass-border)', position:'relative', overflow:'hidden'}}>
                <div style={{position:'absolute', top:0, right:0, width:120, height:120, background:'var(--accent)', opacity:0.03, borderRadius:'0 0 0 100%', pointerEvents:'none'}} />
                <div style={{width:56, height:56, background:'var(--accent-bg)', borderRadius:'var(--radius-xl)', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--accent)', marginBottom:24}}>
                  {block.icon}
                </div>
                <h3 style={{fontFamily:'var(--font-heading)', fontSize:'2rem', fontWeight:800, marginBottom:16}}>{block.data.title}</h3>
                <p style={{fontSize:'1.1rem', color:'var(--text-primary)', fontWeight:500, lineHeight:1.6, marginBottom:24}}>
                  {block.data.text}
                </p>
                <ul style={{listStyle:'none', padding:0, display:'flex', flexDirection:'column', gap:16}}>
                  {block.data.bullets.map((b, i) => (
                    <li key={i} style={{display:'flex', gap:12, fontSize:'0.95rem', color:'var(--text-secondary)'}}>
                      <div style={{width:6, height:6, borderRadius:'50%', background:'var(--accent)', marginTop:8}} />
                      <span><strong>{b.title}:</strong> {b.text}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ===== RELIABLE & TRUSTWORTHY ===== */}
      <section className="section" style={{background:'var(--bg)', paddingTop: 0}}>
        <div className="container">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer} className="section-header">
            <motion.h2 variants={fadeInUp} className="section-title" style={{marginBottom: 8}}>{content.reliable.title}</motion.h2>
            <motion.p variants={fadeInUp} className="section-subtitle">{content.reliable.subtitle}</motion.p>
          </motion.div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer} style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(300px, 1fr))', gap:32, marginTop:48}}>
            {content.reliable.cards.map(card => ({ img: card.image, title: card.title, desc: card.desc })).map((card, idx) => (
              <motion.div key={idx} variants={fadeInUp} style={{
                background:'var(--glass-bg)', 
                borderRadius:'var(--radius-3xl)', 
                overflow:'hidden', 
                border:'1px solid var(--glass-border)',
                transition:`border-color 0.3s ease, box-shadow 0.3s ease`,
                display:'flex',
                flexDirection:'column',
                boxShadow:'var(--shadow-md)'
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-8px)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent-border)'; (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-xl)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'none'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--glass-border)'; (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-md)'; }}
              >
                <div style={{position:'relative', width:'100%', aspectRatio:'1/1.1', overflow:'hidden'}}>
                  <Image src={card.img} alt={card.title} fill style={{objectFit:'cover'}} sizes="(max-width: 768px) 100vw, 33vw" />
                </div>
                <div style={{padding:'32px', textAlign:'center', flex:1, display:'flex', flexDirection:'column', justifyContent:'center'}}>
                  <h3 style={{fontFamily:'var(--font-heading)', fontSize:'1.4rem', fontWeight:700, lineHeight:1.3, marginBottom:12}}>{card.title}</h3>
                  <p style={{fontSize:'0.95rem', color:'var(--text-secondary)', lineHeight:1.6}}>{card.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ===== TESTIMONIALS ===== */}
      <section className="section" style={{background:'var(--bg-elevated)', overflow:'hidden'}}>
        <div className="container">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer} className="section-header">
            <motion.span variants={fadeInUp} className="section-label">Testimonials</motion.span>
            <motion.h2 variants={fadeInUp} className="section-title">What our happy customers say</motion.h2>
          </motion.div>
          
          <div style={{
            position: 'relative',
            width: '100vw',
            left: '50%',
            right: '50%',
            marginLeft: '-50vw',
            marginRight: '-50vw',
          }}>
            {/* Infinite Marquee Slider */}
            <div className="marquee-container" style={{ padding: '20px 0 48px', margin: '0' }}>
              <div className="marquee-track" style={{ gap: 28, paddingLeft: 28 }}>
                {[...Array(3)].flatMap(() => [
                  ...(initialTestimonials || []),
                  { id: 'ex1', text: 'Highly recommend ZARPIT for any deep cleaning needs. The experts were completely professional and left the place spotless!', rating: 5, user_name: 'Anita Sharma', location: 'Noida Sector 62', avatar: 'A' },
                  { id: 'ex2', text: 'Very convenient booking system. The plumber arrived exactly on time and fixed the issue quickly.', rating: 5, user_name: 'Rajat Verma', location: 'Greater Noida West', avatar: 'R' },
                  { id: 'ex3', text: 'I booked an electrician, and the service was absolutely top-notch. Completely transparent pricing too.', rating: 5, user_name: 'Neha Gupta', location: 'Delhi', avatar: 'N' },
                  { id: 'ex4', text: 'Excellent experience overall. The customer support team is super responsive and the job was flawless.', rating: 5, user_name: 'Vikram Singh', location: 'Noida Extension', avatar: 'V' }
                ]).map((t: any, idx) => (
                  <div key={idx} style={{
                    flex: '0 0 380px',
                    maxWidth: '85vw',
                    padding:'36px', background:'var(--glass-bg)', 
                    borderRadius:'var(--radius-3xl)', border:'1px solid var(--glass-border)',
                    transition:`border-color 0.3s ease, box-shadow 0.3s ease, transform 0.3s ease`,
                    display:'flex', flexDirection:'column', gap:24,
                    boxShadow:'var(--shadow-md)',
                    minHeight: '260px',
                    transform: 'translateZ(0)'
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-10px) scale(1.02)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent-border)'; (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-xl)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateZ(0)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--glass-border)'; (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-md)'; }}
                  >
                    <div style={{display:'flex', gap:4}}>
                      {[...Array(5)].map((_, i) => (
                        <span key={i} style={{color: i < (t.rating || 5) ? 'var(--accent)' : 'var(--text-muted)', fontSize:18}}>★</span>
                      ))}
                    </div>
                    <p style={{fontSize:'1.1rem', color:'var(--text-primary)', lineHeight:1.6, fontStyle:'italic', flex:1, fontWeight: 500}}>
                      &ldquo;{t.text}&rdquo;
                    </p>
                    <div style={{display:'flex', alignItems:'center', gap:16, borderTop:'1px solid var(--border-light)', paddingTop:24}}>
                      <div style={{
                        width:52, height:52, borderRadius:'50%', background:'var(--accent-light)', 
                        display:'flex', alignItems:'center', justifyContent:'center', fontSize:26,
                        border:'1px solid var(--accent-border)', boxShadow: '0 4px 12px rgba(255,107,0,0.1)'
                      }}>
                        {t.avatar || '👤'}
                      </div>
                      <div>
                        <div style={{fontWeight:800, color:'var(--text-primary)', fontSize: '1.05rem'}}>{t.user_name}</div>
                        <div style={{fontSize:12, color:'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em'}}>{t.location}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className="section" style={{background:'var(--bg)'}}>
        <div className="container">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer} className="section-header">
            <motion.span variants={fadeInUp} className="section-label">How It Works</motion.span>
            <motion.h2 variants={fadeInUp} className="section-title">Book in 3 simple steps</motion.h2>
            <motion.p variants={fadeInUp} className="section-subtitle">Getting premium home services has never been easier.</motion.p>
          </motion.div>
          <div style={{ position: 'relative', marginTop: 64, maxWidth: 1100, margin: '64px auto 0' }} className="timeline-container">
            <style dangerouslySetInnerHTML={{
              __html: `
              .timeline-container { display: grid; grid-template-columns: repeat(3, 1fr); grid-template-rows: 1fr auto 1fr; gap: 0 40px; }
              .timeline-step-wrapper { display: contents; }
              
              .desktop-line-bg, .desktop-line { position: absolute; left: 0; right: 0; top: 50%; transform: translateY(-50%); height: 2px; z-index: 0; }
              .desktop-line-bg { background: linear-gradient(to right, transparent, var(--glass-border) 10%, var(--glass-border) 90%, transparent); }
              .desktop-line { background: var(--accent); box-shadow: 0 0 16px var(--accent); transform-origin: left; }
              
              .timeline-node { width: 56px; height: 56px; border-radius: 50%; background: var(--bg); border: 2px solid var(--accent); display: flex; align-items: center; justify-content: center; color: var(--accent); z-index: 2; box-shadow: 0 0 24px rgba(255, 117, 31, 0.25); margin: 0 auto; position: relative; }
              .timeline-card { background: var(--glass-bg); border: 1px solid var(--glass-border); border-radius: var(--radius-3xl); backdrop-filter: blur(20px); padding: 32px; box-shadow: var(--shadow-md); text-align: center; }
              
              .item-0-card { grid-column: 1; grid-row: 1; align-self: end; margin-bottom: 32px; }
              .item-0-node { grid-column: 1; grid-row: 2; }
              
              .item-1-card { grid-column: 2; grid-row: 1; align-self: end; margin-bottom: 32px; }
              .item-1-node { grid-column: 2; grid-row: 2; }
              
              .item-2-card { grid-column: 3; grid-row: 1; align-self: end; margin-bottom: 32px; }
              .item-2-node { grid-column: 3; grid-row: 2; }

              @media (max-width: 768px) {
                .timeline-container { display: flex !important; flex-direction: column !important; gap: 32px !important; position: relative; margin-top: 32px !important; }
                .timeline-step-wrapper { display: flex !important; flex-direction: row !important; align-items: flex-start !important; gap: 20px !important; width: 100% !important; }
                
                .desktop-line-bg, .desktop-line { left: 17px !important; right: auto !important; top: 0 !important; bottom: 0 !important; width: 2px !important; height: 100% !important; transform: none !important; transform-origin: top !important; }
                .desktop-line-bg { background: linear-gradient(to bottom, transparent, var(--glass-border) 10%, var(--glass-border) 90%, transparent) !important; }
                
                .item-0-card, .item-1-card, .item-2-card { grid-column: auto !important; grid-row: auto !important; align-self: auto !important; margin: 0 !important; padding: 24px !important; text-align: left !important; flex: 1 !important; }
                .item-0-node, .item-1-node, .item-2-node { grid-column: auto !important; grid-row: auto !important; margin: 0 !important; position: relative !important; z-index: 2 !important; flex-shrink: 0 !important; width: 36px !important; height: 36px !important; }
                .timeline-node svg { width: 16px !important; height: 16px !important; }
                .timeline-title { font-size: 1.2rem !important; margin-bottom: 8px !important; line-height: 1.2 !important; }
                .timeline-desc { font-size: 0.9rem !important; line-height: 1.5 !important; }
                .timeline-step-text { font-size: 11px !important; margin-bottom: 8px !important; }
              }
              `
            }} />
            
            {/* Desktop Glowing Curvy Line Background */}
            <div className="desktop-line-bg" />
            <motion.div className="desktop-line" 
              initial={{ scaleX: 0, scaleY: 0 }}
              whileInView={{ scaleX: 1, scaleY: 1 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
            />

            {[
              {icon:<Search size={22} />,title:'Choose Service',desc:'Browse our premium catalog and select the service you need.'},
              {icon:<Calendar size={22} />,title:'Book a Slot',desc:'Pick your preferred date and time slot for the service.'},
              {icon:<CheckCircle2 size={22} />,title:'Get it Done',desc:'Our verified professional arrives and gets it done perfectly.'}
            ].map((step, i) => (
              <div key={i} className="timeline-step-wrapper">
                <motion.div initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.4, delay: i * 0.3 + 0.2 }}
                  className={`timeline-node item-${i}-node`}
                >
                  {step.icon}
                </motion.div>

                <motion.div initial={{ opacity: 0, y: i % 2 === 0 ? 30 : -30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.6, delay: i * 0.3 }}
                  className={`timeline-card item-${i}-card`}
                >
                  <div className="timeline-step-text" style={{fontSize:13,fontWeight:800,color:'var(--accent)',marginBottom:12,letterSpacing:'0.15em'}}>STEP 0{i + 1}</div>
                  <h3 className="timeline-title" style={{fontFamily:'var(--font-heading)',fontSize:'1.6rem',fontWeight:700,marginBottom:12}}>{step.title}</h3>
                  <p className="timeline-desc" style={{fontSize:15,color:'var(--text-secondary)',lineHeight:1.7}}>{step.desc}</p>
                </motion.div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section className="section" style={{background:'var(--bg-elevated)'}}>
        <div className="container">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer} className="section-header">
            <motion.span variants={fadeInUp} className="section-label">FAQ</motion.span>
            <motion.h2 variants={fadeInUp} className="section-title">Frequently Asked Questions</motion.h2>
          </motion.div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer} style={{maxWidth:800,margin:'0 auto'}}>
            {[
              ...content.faqs,
              { q: 'Which locations does ZARPIT serve?', a: `For now we are serving in ${areaNames}.` },
            ].map((faq, i) => (
              <details key={i} style={{padding:'20px 24px',background:'var(--glass-bg)',border:'1px solid var(--glass-border)',borderRadius:'var(--radius-lg)',marginBottom:12,backdropFilter:'blur(20px)',cursor:'pointer',transition:'all 0.3s ease'}}>
                <summary style={{fontSize:'1.05rem',fontWeight:600,listStyle:'none',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  {faq.q} <span style={{color:'var(--accent)',fontSize:20}} className="faq-icon">+</span>
                </summary>
                <p style={{fontSize:14,color:'var(--text-secondary)',lineHeight:1.7,marginTop:16,paddingTop:16,borderTop:'1px solid var(--border-light)'}}>{faq.a}</p>
              </details>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ===== APP CTA ===== */}
      <section className="section">
        <div className="container">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={fadeInUp} style={{position:'relative',padding:'80px 60px',background:'var(--glass-bg)',border:'1px solid var(--glass-border)',borderRadius:'var(--radius-3xl)',overflow:'hidden',textAlign:'center',backdropFilter:'blur(20px)'}}>
            <div style={{position:'absolute',top:'-30%',left:'50%',transform:'translateX(-50%)',width:500,height:500,background:'radial-gradient(circle, var(--accent-light) 0%, transparent 70%)',borderRadius:'50%',opacity:0.3}} />
            <div style={{position:'relative',zIndex:1}}>
              <span className="section-label">Download the App</span>
              <h2 style={{fontFamily:'var(--font-heading)',fontSize:'clamp(1.8rem, 4vw, 2.5rem)',fontWeight:700,letterSpacing:'-0.03em',marginBottom:16}}>Get Zarpit on your phone</h2>
              <p style={{fontSize:'1.05rem',color:'var(--text-secondary)',lineHeight:1.7,maxWidth:500,margin:'0 auto 36px'}}>
                Book services, track bookings, and manage everything from the Zarpit mobile app. Available soon!
              </p>
              <div style={{display:'flex',gap:14,justifyContent:'center',flexWrap:'wrap'}}>
                <button onClick={handleInstallClick} className="btn btn-primary btn-lg" style={{display:'flex', alignItems:'center', gap:8}}><svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M16.65,13.48c-0.1-2.73,2.22-4.08,2.32-4.14c-1.28-1.87-3.25-2.12-3.95-2.14c-1.68-0.17-3.27,1-4.13,1 c-0.87,0-2.18-1-3.56-0.97C5.45,7.26,3.75,8.38,2.77,10.08c-2,3.46-0.51,8.58,1.44,11.4c0.96,1.38,2.09,2.94,3.58,2.88 c1.44-0.06,1.99-0.94,3.74-0.94c1.74,0,2.26,0.94,3.76,0.91c1.54-0.03,2.51-1.42,3.46-2.81c1.09-1.59,1.54-3.13,1.56-3.21 C20.29,18.3,16.76,16.96,16.65,13.48 M14.28,4.72c0.8-0.96,1.33-2.31,1.18-3.64c-1.15,0.05-2.55,0.77-3.37,1.75 c-0.73,0.87-1.33,2.23-1.15,3.53C12.23,6.46,13.49,5.69,14.28,4.72"/></svg> Download for iOS</button>
                <button onClick={handleInstallClick} className="btn btn-secondary btn-lg" style={{display:'flex', alignItems:'center', gap:8}}><svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4482.9993.9993.0004.5511-.4482.9997-.9993.9997m-11.046 0c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4482.9993.9993 0 .5511-.4482.9997-.9993.9997m11.4045-6.02l1.9973-3.4592c.1158-.2004.0472-.4566-.1532-.5724-.2004-.1158-.4566-.0472-.5724.1532l-2.0382 3.53a11.536 11.536 0 0 0-10.2312 0L4.846 5.443c-.1158-.2004-.372-.269-.5724-.1532-.2004.1158-.269.372-.1532.5724l1.9973 3.4592C2.6889 11.1867.3432 14.6589 0 18.761h24c-.3432-4.1021-2.6889-7.5743-6.1185-9.44z"/></svg> Download for Android</button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </>
  );
}
