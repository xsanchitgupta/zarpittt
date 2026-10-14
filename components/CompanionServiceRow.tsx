'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Star, Clock } from 'lucide-react';
import { addToCart, formatPrice } from '@/lib/utils';
import type { Service, Category } from '@/lib/database.types';
import { getServiceIcon, COMPANION_HOURLY_INCREMENT, type BookingMode, type BookingOptions } from '@/lib/companion';
import BookingOptionsModal from './BookingOptionsModal';

interface Props {
  service: Service;
  category?: Category | null;
  mode: BookingMode;
  onAdded?: () => void;
}

/** Rounded rectangular row: icon on the left (no image), name + snippet, Add to Cart + Details */
export default function CompanionServiceRow({ service: s, category, mode, onAdded }: Props) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<'add' | 'book'>('add');
  const icon = getServiceIcon(s.name, mode);
  const isComingSoon = s.is_coming_soon || category?.is_coming_soon;
  const firstSentence = (s.description || '').split('. ')[0];
  const snippet = firstSentence ? firstSentence.slice(0, 110) : '';

  const handleConfirm = (options: BookingOptions, totalPrice: number) => {
    addToCart({
      id: s.id,
      name: s.name,
      price: totalPrice,
      originalPrice: totalPrice,
      duration: mode === 'companion' ? `${options.hours} hr${options.hours > 1 ? 's' : ''}` : s.duration,
      category: category?.name || s.category?.name || s.category_id,
      image: s.image,
      options,
    });
    setModalOpen(false);
    onAdded?.();
    if (pendingAction === 'book') router.push('/cart');
  };

  return (
    <>
      <div className="svc-row" style={{ opacity: isComingSoon ? 0.6 : 1 }}>
        {/* Icon tile (left) */}
        <div style={{
          width: 60, height: 60, minWidth: 60, borderRadius: 18, fontSize: 30,
          background: 'linear-gradient(135deg, var(--accent-light), rgba(255,154,86,0.12))',
          border: '1px solid var(--accent-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 6px 16px rgba(255,117,31,0.1)',
        }}>{icon}</div>

        {/* Name, snippet, meta */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <Link href={`/services/${s.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.08rem', fontWeight: 800, margin: 0, lineHeight: 1.3 }}>{s.name}</h3>
          </Link>
          {snippet && (
            <p style={{
              fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 3, lineHeight: 1.5,
              display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden',
            }}>{snippet}</p>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 7, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'var(--font-heading)', fontSize: '1.02rem', fontWeight: 800, color: 'var(--accent)' }}>
              {formatPrice(s.price)}
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginLeft: 4 }}>{mode === 'companion' ? `+ ₹${COMPANION_HOURLY_INCREMENT}/extra hr` : '/ task'}</span>
            </span>
            {!isComingSoon && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11.5, fontWeight: 700, color: 'var(--text-secondary)', padding: '3px 8px', borderRadius: 999, background: 'var(--bg-input)', border: '1px solid var(--border-light)' }}>
                <Star size={11} fill="var(--accent)" color="var(--accent)" /> {s.rating}
              </span>
            )}
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11.5, fontWeight: 700, color: 'var(--text-secondary)', padding: '3px 8px', borderRadius: 999, background: 'var(--bg-input)', border: '1px solid var(--border-light)' }}>
              <Clock size={11} /> {mode === 'companion' ? 'Hourly' : 'Per task'}
            </span>
          </div>
        </div>

        {/* Actions */}
        {isComingSoon ? (
          <div style={{ padding: '6px 12px', background: 'var(--warning-bg)', color: 'var(--warning)', borderRadius: 'var(--radius-full)', fontSize: 12, fontWeight: 700, border: '1px solid rgba(245, 158, 11, 0.2)', whiteSpace: 'nowrap' }}>
            Coming Soon
          </div>
        ) : (
          <div className="svc-row-actions">
            <Link href={`/services/${s.id}`} style={{ textDecoration: 'none' }}>
              <button style={{
                padding: '11px 16px', background: 'transparent', color: 'var(--text)',
                borderRadius: 13, fontSize: 13, fontWeight: 700, border: '1.5px solid var(--border)',
                cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s',
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--text-muted)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; }}
              >Details</button>
            </Link>
            <button
              onClick={() => { setPendingAction('add'); setModalOpen(true); }}
              style={{
                padding: '11px 20px', color: '#fff', borderRadius: 13, fontSize: 13, fontWeight: 800,
                background: 'linear-gradient(135deg, var(--accent), #ff9a56)',
                border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s',
                boxShadow: '0 6px 18px rgba(255, 117, 31, 0.3)',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(255, 117, 31, 0.4)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 6px 18px rgba(255, 117, 31, 0.3)'; }}
            >+ Add to Cart</button>
          </div>
        )}
      </div>

      <BookingOptionsModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        serviceName={s.name}
        basePrice={s.price}
        mode={mode}
        onConfirm={handleConfirm}
      />
    </>
  );
}
