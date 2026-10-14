'use client';
import { X, Star, BadgeCheck } from 'lucide-react';
import { useEffect, useMemo } from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  serviceName: string;
  rating: number;
  reviewCount: number;
}

const FIRST_NAMES = ['Rahul', 'Priya', 'Amit', 'Sneha', 'Vikram', 'Anjali', 'Rohan', 'Pooja', 'Karan', 'Neha', 'Siddharth', 'Riya', 'Aditya', 'Kriti', 'Arjun', 'Ravi', 'Kavita', 'Sanjay', 'Meera', 'Vijay', 'Anita', 'Deepak', 'Nisha', 'Sunil', 'Kiran', 'Raj', 'Simran', 'Gaurav', 'Swati', 'Tarun'];
const LAST_NAMES = ['Sharma', 'Singh', 'Kumar', 'Gupta', 'Patel', 'Desai', 'Mehta', 'Reddy', 'Verma', 'Joshi', 'Iyer', 'Chawla', 'Nair', 'Bhatia', 'Kapoor', 'Das', 'Roy', 'Choudhury', 'Jain', 'Shah', 'Agarwal', 'Yadav', 'Rao', 'Mishra', 'Pandey'];

const REVIEWS_5 = [
  'Excellent service! Very professional and on time.',
  'Great experience. The expert was polite and did a fantastic job.',
  'Highly recommended. Saved me a lot of hassle.',
  'Superb service quality. The expert knew exactly what to do.',
  'Really good job. Left the place clean and tidy.',
  'Five stars! The best service I have used so far.',
  'Perfect in every way. The professional was very courteous.',
  'Beyond expectations. Very thorough and detail-oriented.',
  'Absolutely brilliant service, would book again immediately.'
];

const REVIEWS_4 = [
  'Good value for money. Quality of work was impressive.',
  'Very satisfied with the service. Will book again.',
  'Quick and efficient. Exactly what I needed.',
  'The professional was very knowledgeable and solved the issue quickly.',
  'Good service, arrived a bit late but work was done perfectly.',
  'Nice work. Very reliable and respectful.'
];

const REVIEWS_3 = [
  'Service was okay, could be improved.',
  'Average experience. Work was done but took longer than expected.',
  'Decent job, nothing extraordinary.',
  'It was fine, but the professional seemed a bit rushed.'
];

const REVIEWS_2 = [
  'Not very satisfied. The work felt incomplete.',
  'Below expectations. Had to point out a few things they missed.',
  'Disappointing service, took too much time.'
];

const REVIEWS_1 = [
  'Terrible experience. Would not recommend.',
  'Very poor service, completely unprofessional.',
  'Did not do the job properly. Waste of money.'
];

export default function ReviewsModal({ isOpen, onClose, serviceName, rating, reviewCount }: Props) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  const fakeReviews = useMemo(() => {
    if (!isOpen) return [];
    const seed = serviceName.length + reviewCount;
    
    // Exact matching of average rating
    const totalStarsTarget = Math.round(reviewCount * rating);
    let starsArray = Array(reviewCount).fill(1);
    let remaining = totalStarsTarget - reviewCount;
    
    let idx = 0;
    while (remaining > 0) {
      const randIdx = (seed + idx * 37 + remaining * 13) % reviewCount;
      if (starsArray[randIdx] < 5) {
        starsArray[randIdx]++;
        remaining--;
      }
      idx++;
    }

    const list = [];
    for (let i = 0; i < reviewCount; i++) {
      const firstName = FIRST_NAMES[(seed + i * 7) % FIRST_NAMES.length];
      const lastName = LAST_NAMES[(seed + i * 11) % LAST_NAMES.length];
      const stars = starsArray[i];
      
      let reviewBank = REVIEWS_5;
      if (stars === 4) reviewBank = REVIEWS_4;
      if (stars === 3) reviewBank = REVIEWS_3;
      if (stars === 2) reviewBank = REVIEWS_2;
      if (stars === 1) reviewBank = REVIEWS_1;
      
      const text = reviewBank[(seed + i * 13) % reviewBank.length];
      
      // Generate a deterministic time ago
      const daysAgo = (seed * 3 + i * 17) % 180 + 1;
      let timeAgo = '';
      if (daysAgo < 7) timeAgo = `${daysAgo} day${daysAgo > 1 ? 's' : ''} ago`;
      else if (daysAgo < 30) timeAgo = `${Math.floor(daysAgo / 7)} week${Math.floor(daysAgo / 7) > 1 ? 's' : ''} ago`;
      else timeAgo = `${Math.floor(daysAgo / 30)} month${Math.floor(daysAgo / 30) > 1 ? 's' : ''} ago`;

      list.push({
        id: i,
        name: `${firstName} ${lastName}`,
        text,
        stars,
        timeAgo
      });
    }
    
    // Sort by mostly highest rated first, but keep some randomness
    return list.sort((a, b) => b.stars - a.stars || a.name.localeCompare(b.name));
  }, [isOpen, serviceName, rating, reviewCount]);

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16, animation: 'fadeIn 0.2s ease'
    }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }} onClick={onClose} />
      <div style={{
        position: 'relative', background: 'var(--bg-elevated)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-2xl)', width: '100%', maxWidth: 560, height: '85vh',
        display: 'flex', flexDirection: 'column', boxShadow: 'var(--shadow-xl)', animation: 'scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
      }}>
        {/* Header */}
        <div style={{ padding: '24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', background: 'var(--bg)', borderTopLeftRadius: 'var(--radius-2xl)', borderTopRightRadius: 'var(--radius-2xl)' }}>
          <div>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', fontWeight: 800, marginBottom: 8, color: 'var(--text)' }}>{serviceName}</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: 'var(--text-secondary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'var(--accent)', color: 'var(--black)', padding: '2px 8px', borderRadius: '12px', fontWeight: 700 }}>
                {rating.toFixed(1)} <Star size={12} fill="currentColor" />
              </div>
              <span>•</span>
              <span style={{ fontWeight: 600 }}>{reviewCount.toLocaleString()} Verified Reviews</span>
            </div>
          </div>
          <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--bg-input)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', cursor: 'pointer', transition: 'all 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--border)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-input)'}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 28 }} className="hide-scrollbar">
          {fakeReviews.map(r => (
            <div key={r.id} style={{ display: 'flex', gap: 16 }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', flexShrink: 0, fontWeight: 700, fontFamily: 'var(--font-heading)', fontSize: 18 }}>
                {r.name.charAt(0)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>{r.name}</span>
                      <BadgeCheck size={14} style={{ color: 'var(--success)' }} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                      <span style={{ display: 'flex', color: '#FFB800' }}>
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={14} fill={i < r.stars ? 'currentColor' : 'var(--border)'} strokeWidth={0} />
                        ))}
                      </span>
                      <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{r.timeAgo}</span>
                    </div>
                  </div>
                </div>
                <p style={{ fontSize: 14.5, color: 'var(--text-secondary)', lineHeight: 1.6, marginTop: 10 }}>
                  {r.text}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
