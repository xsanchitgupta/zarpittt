'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ToastContainer, { toast } from '@/components/Toast';
import { getOffers } from '@/lib/data';
import type { Offer } from '@/lib/database.types';
import { Copy, Gift } from 'lucide-react';

export default function OffersPage() {
  const [offers, setOffers] = useState<Offer[]>([]);

  useEffect(() => {
    getOffers().then(setOffers);
  }, []);

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Copied!', `Code "${code}" copied to clipboard.`);
  };

  return (
    <>
      <Navbar /><ToastContainer />
      <div style={{paddingTop:'calc(var(--navbar-h) + 32px)',paddingBottom:80,minHeight:'100vh'}}>
        <div className="container">
          {/* Hero */}
          <div style={{textAlign:'center',padding:'64px 0 48px'}}>
            <span className="section-label">Deals & Offers</span>
            <h1 style={{fontFamily:'var(--font-heading)',fontSize:'clamp(2rem, 5vw, 3rem)',fontWeight:800,letterSpacing:'-0.03em',marginBottom:12}}>Save More, Live Better</h1>
            <p style={{fontSize:'1.1rem',color:'var(--text-secondary)',maxWidth:500,margin:'0 auto'}}>Exclusive discounts, cashback offers, and membership rewards — all in one place.</p>
          </div>

          {/* Deals */}
          <div className="grid-cols-2" style={{marginBottom:100}}>
            {offers.map(offer => (
              <div key={offer.id} style={{
                position:'relative',padding:'36px 32px',background:'var(--glass-bg)',border:'1px solid var(--glass-border)',
                borderRadius:'var(--radius-2xl)',overflow:'hidden',backdropFilter:'blur(20px)',transition:'all 0.3s ease'
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent-border)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--glass-border)'; (e.currentTarget as HTMLElement).style.transform = 'none'; }}
              >
                <div style={{position:'absolute',top:'-30%',right:'-15%',width:250,height:250,background:'radial-gradient(circle, var(--accent-light) 0%, transparent 70%)',borderRadius:'50%',opacity:0.5}} />
                <div style={{position:'relative'}}>
                  <div style={{fontFamily:'var(--font-heading)',fontSize:'3rem',fontWeight:800,color:'var(--accent)',lineHeight:1,marginBottom:14}}>
                    {offer.discount_type === 'percent' ? `${offer.discount_value}% OFF` : `₹${offer.discount_value} OFF`}
                  </div>
                  <h3 style={{fontFamily:'var(--font-heading)',fontSize:'1.3rem',fontWeight:600,marginBottom:8}}>{offer.title}</h3>
                  <p style={{fontSize:14,color:'var(--text-secondary)',marginBottom:18,lineHeight:1.7}}>{offer.description}</p>
                  <div style={{display:'flex',alignItems:'center',gap:14}}>
                    <button onClick={() => copyCode(offer.code)} style={{
                      display:'flex',alignItems:'center',gap:8,padding:'10px 20px',
                      border:'2px dashed var(--accent-border)',borderRadius:'var(--radius-md)',
                      fontFamily:'var(--font-heading)',fontWeight:700,color:'var(--accent)',letterSpacing:'0.1em',fontSize:14,
                      cursor:'pointer',background:'transparent',transition:'all 0.25s ease'
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--accent-light)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    ><Copy size={16} /> {offer.code}</button>
                    <span style={{fontSize:12,color:'var(--text-muted)'}}>Valid till {new Date(offer.valid_till).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Membership */}
          <div style={{textAlign:'center',marginBottom:64}}>
            <span className="section-label">Membership Plans</span>
            <h2 className="section-title">Join Zarpit Plus</h2>
            <p className="section-subtitle" style={{margin:'0 auto'}}>Unlock premium benefits with our membership plans.</p>
          </div>

          <div className="grid-cols-3" style={{marginBottom:100}}>
            {[
              { name: 'Basic', price: '₹99', period: '/month', features: ['5% off on all services','Priority support','Free rescheduling'], featured: false },
              { name: 'Pro', price: '₹249', period: '/month', features: ['15% off on all services','Priority support 24/7','Free rescheduling & cancellation','Exclusive member deals','1 free service per month'], featured: true },
              { name: 'Enterprise', price: '₹999', period: '/month', features: ['25% off on all services','Dedicated account manager','Custom scheduling','Bulk booking discounts','Invoice & billing support'], featured: false },
            ].map((plan, i) => (
              <div key={i} style={{
                padding:'40px 32px',background:'var(--glass-bg)',border: `1px solid ${plan.featured ? 'var(--accent)' : 'var(--glass-border)'}`,
                borderRadius:'var(--radius-2xl)',textAlign:'center',backdropFilter:'blur(20px)',
                transition:'all 0.3s ease',position:'relative',
                boxShadow: plan.featured ? 'var(--shadow-glow)' : 'none'
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-6px)'; if(!plan.featured) (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-hover)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'none'; if(!plan.featured) (e.currentTarget as HTMLElement).style.borderColor = 'var(--glass-border)'; }}
              >
                {plan.featured && <span style={{position:'absolute',top:-12,left:'50%',transform:'translateX(-50%)',padding:'4px 16px',background:'var(--accent)',color:'var(--black)',fontSize:11,fontWeight:700,borderRadius:'var(--radius-full)',textTransform:'uppercase',letterSpacing:'0.05em'}}>Most Popular</span>}
                <h3 style={{fontFamily:'var(--font-heading)',fontSize:'1.5rem',fontWeight:700,marginBottom:8}}>{plan.name}</h3>
                <div style={{fontFamily:'var(--font-heading)',fontSize:'2.5rem',fontWeight:800,color:'var(--accent)',marginBottom:4}}>{plan.price}<span style={{fontSize:16,fontWeight:400,color:'var(--text-secondary)'}}>{plan.period}</span></div>
                <p style={{fontSize:13,color:'var(--text-muted)',marginBottom:28}}>Billed monthly</p>
                <div style={{display:'flex',flexDirection:'column',gap:12,textAlign:'left',marginBottom:32}}>
                  {plan.features.map((f, j) => (
                    <div key={j} style={{display:'flex',alignItems:'center',gap:10,fontSize:14,color:'var(--text-secondary)'}}>
                      <span style={{width:20,height:20,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(34,197,94,0.1)',borderRadius:'var(--radius-full)',color:'var(--success)',fontSize:11,fontWeight:700,flexShrink:0}}>✓</span>
                      {f}
                    </div>
                  ))}
                </div>
                <button className={plan.featured ? 'btn btn-primary' : 'btn btn-secondary'} style={{width:'100%'}} onClick={() => toast.info('Coming Soon', 'Membership plans will be available soon!')}>
                  {plan.featured ? 'Get Pro' : plan.name === 'Enterprise' ? 'Contact Sales' : 'Get Started'}
                </button>
              </div>
            ))}
          </div>

          {/* Referral */}
          <div style={{position:'relative',padding:'80px 60px',background:'var(--glass-bg)',border:'1px solid var(--glass-border)',borderRadius:'var(--radius-3xl)',overflow:'hidden',textAlign:'center',backdropFilter:'blur(20px)'}}>
            <div style={{position:'absolute',top:'-30%',left:'50%',transform:'translateX(-50%)',width:400,height:400,background:'radial-gradient(circle, var(--accent-light) 0%, transparent 70%)',borderRadius:'50%',opacity:0.3}} />
            <div style={{position:'relative',zIndex:1}}>
              <h2 style={{fontFamily:'var(--font-heading)',fontSize:'clamp(1.5rem, 3.5vw, 2rem)',fontWeight:700,marginBottom:12,display:'flex',justifyContent:'center',alignItems:'center',gap:12}}>Refer Friends, Earn Rewards <Gift size={32} className="text-accent" /></h2>
              <p style={{color:'var(--text-secondary)',marginBottom:32,maxWidth:480,margin:'0 auto 32px'}}>Share your referral code with friends. You both get ₹500 off on your next booking!</p>
              <button onClick={() => copyCode('ZARPIT2026')} style={{
                display:'inline-flex',alignItems:'center',gap:14,padding:'18px 32px',
                background:'var(--glass-bg)',border:'2px dashed var(--accent)',borderRadius:'var(--radius-xl)',
                fontFamily:'var(--font-heading)',fontSize:'1.5rem',fontWeight:700,color:'var(--accent)',letterSpacing:'0.1em',cursor:'pointer',transition:'all 0.25s ease'
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--accent-light)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'var(--glass-bg)')}
              >ZARPIT2026 <Copy size={20} /></button>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
