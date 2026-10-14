'use client';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Mic, Square, MapPin, Clock, Users, AlertCircle, ShieldCheck } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { useSpeech } from '@/lib/use-speech';
import { clampHours, clampPersons, getServiceIcon, companionTotal, COMPANION_HOURLY_INCREMENT, type BookingMode, type BookingOptions } from '@/lib/companion';
import { CONTENT_KEYS, DEFAULT_BOOKING_FILTERS, type BookingFiltersContent } from '@/lib/content';
import { fetchContent } from '@/lib/content-client';

interface BookingOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  serviceName: string;
  basePrice: number;
  mode: BookingMode;
  confirmLabel?: string;
  onConfirm: (options: BookingOptions, totalPrice: number) => void;
}

/* ---- Stepper card: label + big value + round +/- controls ---- */
function StepperCard({ icon, label, sub, value, onChange, min = 1, max = 12 }: {
  icon: React.ReactNode; label: string; sub: string; value: number;
  onChange: (v: number) => void; min?: number; max?: number;
}) {
  const btn = (disabled: boolean): React.CSSProperties => ({
    width: 34, height: 34, borderRadius: '50%', border: `1.5px solid ${disabled ? 'var(--border)' : 'var(--accent-border)'}`,
    background: disabled ? 'transparent' : 'var(--accent-light)',
    color: disabled ? 'var(--text-muted)' : 'var(--accent)',
    fontSize: 18, fontWeight: 700, cursor: disabled ? 'default' : 'pointer',
    display: 'grid', placeItems: 'center', transition: 'all 0.15s ease', lineHeight: 1,
  });
  return (
    <div style={{
      flex: 1, minWidth: 140, padding: '14px 16px', borderRadius: 16,
      background: 'var(--bg-input)', border: '1px solid var(--border-light)',
      display: 'flex', flexDirection: 'column', gap: 10,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        <span style={{ color: 'var(--accent)', display: 'flex' }}>{icon}</span> {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button type="button" style={btn(value <= min)} disabled={value <= min} onClick={() => onChange(Math.max(min, value - 1))} aria-label={`Decrease ${label}`}>−</button>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 26, fontWeight: 800, lineHeight: 1 }}>{value}</div>
          <div style={{ fontSize: 10.5, color: 'var(--text-muted)', fontWeight: 600, marginTop: 2 }}>{sub}</div>
        </div>
        <button type="button" style={btn(value >= max)} disabled={value >= max} onClick={() => onChange(Math.min(max, value + 1))} aria-label={`Increase ${label}`}>+</button>
      </div>
    </div>
  );
}

/* ---- Selectable choice card (gender / preference) ---- */
function ChoiceCard({ emoji, label, sub, active, onClick }: {
  emoji: string; label: string; sub?: string; active: boolean; onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} style={{
      flex: 1, padding: '14px 12px', borderRadius: 16, cursor: 'pointer', textAlign: 'center',
      border: `1.5px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
      background: active ? 'var(--accent-light)' : 'var(--bg-input)',
      boxShadow: active ? '0 6px 18px rgba(255,117,31,0.18)' : 'none',
      transition: 'all 0.18s ease', position: 'relative',
    }}>
      {active && (
        <span style={{ position: 'absolute', top: 8, right: 8, width: 18, height: 18, borderRadius: '50%', background: 'var(--accent)', color: '#fff', fontSize: 11, fontWeight: 800, display: 'grid', placeItems: 'center' }}>✓</span>
      )}
      <div style={{ fontSize: 26, marginBottom: 6 }}>{emoji}</div>
      <div style={{ fontSize: 14, fontWeight: 800, color: active ? 'var(--accent)' : 'var(--text)' }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, lineHeight: 1.4 }}>{sub}</div>}
    </button>
  );
}

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <div style={{ fontSize: 11.5, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>{children}</div>
);

export default function BookingOptionsModal({ isOpen, onClose, serviceName, basePrice, mode, confirmLabel = 'Add to Cart', onConfirm }: BookingOptionsModalProps) {
  const [mounted, setMounted] = useState(false);
  const [hours, setHours] = useState(1);
  const [persons, setPersons] = useState(1);
  const [userGender, setUserGender] = useState<'male' | 'female' | ''>('');
  const [genderPreference, setGenderPreference] = useState<'male' | 'female' | ''>('');
  const [meetPoint, setMeetPoint] = useState('');
  const [need, setNeed] = useState('');
  // Labels/limits are admin-editable (Admin → Website Content → Booking Filters)
  const [cfg, setCfg] = useState<BookingFiltersContent>(DEFAULT_BOOKING_FILTERS);

  const speech = useSpeech((finalText) => {
    setNeed(prev => (prev ? prev.trimEnd() + ' ' : '') + finalText);
  });

  useEffect(() => {
    setMounted(true);
    fetchContent(CONTENT_KEYS.bookingFilters, DEFAULT_BOOKING_FILTERS).then(setCfg).catch(() => { /* defaults stay */ });
  }, []);

  // Reset fields per open + lock background scroll + Esc to close
  useEffect(() => {
    if (!isOpen) return;
    setHours(1); setPersons(1); setUserGender(''); setGenderPreference('');
    setMeetPoint(''); setNeed('');
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => { if (!isOpen) speech.stop(); }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!isOpen || !mounted) return null;

  const isCompanion = mode === 'companion';
  const total = isCompanion ? companionTotal(basePrice, hours, persons) : basePrice;
  const extraHours = Math.max(0, clampHours(hours) - 1);
  const genderMissing = isCompanion && !userGender;
  const prefMissing = isCompanion && userGender === 'female' && !genderPreference;
  const canConfirm = !genderMissing && !prefMissing;
  const icon = getServiceIcon(serviceName, mode);

  const handleConfirm = () => {
    if (!canConfirm) return;
    speech.stop();
    onConfirm({
      hours: isCompanion ? clampHours(hours) : 1,
      persons: isCompanion ? clampPersons(persons) : 1,
      userGender: isCompanion && userGender ? userGender : undefined,
      // Male customers are always matched with male companions
      genderPreference: isCompanion ? (userGender === 'male' ? 'male' : (genderPreference || undefined)) : undefined,
      meetPoint: isCompanion && meetPoint.trim() ? meetPoint.trim() : undefined,
      need: need.trim() ? need.trim() : undefined,
    }, total);
  };

  return createPortal(
    <div className="zsheet-overlay" onClick={onClose}>
      <div className="zsheet" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={`Booking details for ${serviceName}`}>
        <div className="zsheet-handle" />

        {/* Header */}
        <div style={{ padding: '18px 24px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 48, height: 48, minWidth: 48, borderRadius: 14, fontSize: 24,
            background: 'linear-gradient(135deg, var(--accent-light), rgba(255,154,86,0.15))',
            border: '1px solid var(--accent-border)', display: 'grid', placeItems: 'center',
          }}>{icon}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', fontWeight: 800, lineHeight: 1.25, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{serviceName}</h3>
            <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 2 }}>
              <span style={{ fontWeight: 800, color: 'var(--accent)' }}>{formatPrice(basePrice)}</span>
              {isCompanion ? ` base + ${formatPrice(COMPANION_HOURLY_INCREMENT)}/extra hr` : ' per task'}
            </div>
          </div>
          <button onClick={onClose} aria-label="Close" style={{
            width: 34, height: 34, borderRadius: 10, background: 'var(--bg-input)', border: '1px solid var(--border)',
            display: 'grid', placeItems: 'center', cursor: 'pointer', color: 'var(--text-secondary)', flexShrink: 0,
          }}><X size={17} /></button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 24 }}>
          {isCompanion && (
            <>
              {/* Duration & people */}
              <div>
                <SectionLabel>Duration &amp; people</SectionLabel>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <StepperCard icon={<Clock size={14} />} label={cfg.companion.hoursLabel} sub={hours > 1 ? 'hours' : 'hour'} value={hours} onChange={setHours} min={1} max={cfg.companion.maxHours} />
                  <StepperCard icon={<Users size={14} />} label={cfg.companion.personsLabel} sub="needed" value={persons} onChange={setPersons} min={1} max={cfg.companion.maxPersons} />
                </div>
              </div>

              {/* Gender */}
              <div>
                <SectionLabel>{cfg.companion.genderLabel} <span style={{ color: 'var(--error)' }}>*</span></SectionLabel>
                <div style={{ display: 'flex', gap: 12 }}>
                  <ChoiceCard emoji="👨" label="Male" active={userGender === 'male'} onClick={() => { setUserGender('male'); setGenderPreference('male'); }} />
                  <ChoiceCard emoji="👩" label="Female" active={userGender === 'female'} onClick={() => { setUserGender('female'); setGenderPreference(''); }} />
                </div>
                {userGender === 'male' && (
                  <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginTop: 10, padding: '10px 12px', borderRadius: 12, background: 'var(--accent-light)', border: '1px solid var(--accent-border)' }}>
                    <ShieldCheck size={15} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: 1 }} />
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{cfg.companion.maleNote}</span>
                  </div>
                )}
              </div>

              {/* Preference — female customers only */}
              {userGender === 'female' && (
                <div style={{ animation: 'fadeInUp 0.3s ease' }}>
                  <SectionLabel>{cfg.companion.prefLabel} <span style={{ color: 'var(--error)' }}>*</span></SectionLabel>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <ChoiceCard emoji="👩" label="Female" sub="companion" active={genderPreference === 'female'} onClick={() => setGenderPreference('female')} />
                    <ChoiceCard emoji="👨" label="Male" sub="companion" active={genderPreference === 'male'} onClick={() => setGenderPreference('male')} />
                  </div>
                </div>
              )}

              {/* Meet point */}
              {cfg.companion.showMeetPoint && (
                <div>
                  <SectionLabel>{cfg.companion.meetLabel}</SectionLabel>
                  <div style={{ position: 'relative' }}>
                    <MapPin size={16} style={{ position: 'absolute', left: 14, top: 15, color: 'var(--accent)' }} />
                    <input className="input" placeholder={cfg.companion.meetPlaceholder} value={meetPoint} onChange={e => setMeetPoint(e.target.value)}
                      style={{ height: 46, borderRadius: 14, background: 'var(--bg-input)', paddingLeft: 40, width: '100%' }} />
                  </div>
                  <p style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 6 }}>{cfg.companion.meetHint}</p>
                </div>
              )}
            </>
          )}

          {/* Need — text + voice */}
          {cfg.need.show && (
          <div>
            <SectionLabel>{cfg.need.label}</SectionLabel>
            <div style={{
              borderRadius: 16, border: `1.5px solid ${speech.listening ? 'var(--accent)' : 'var(--border)'}`,
              background: 'var(--bg-input)', overflow: 'hidden', transition: 'border-color 0.2s ease',
            }}>
              <textarea
                rows={3}
                placeholder={cfg.need.placeholder}
                value={need}
                onChange={e => setNeed(e.target.value.slice(0, 1000))}
                style={{
                  width: '100%', border: 'none', outline: 'none', resize: 'none', background: 'transparent',
                  padding: '12px 14px 4px', fontSize: 13.5, lineHeight: 1.6, color: 'var(--text)',
                  fontFamily: 'inherit', minHeight: 76,
                }}
              />
              {/* Live transcript while speaking */}
              {speech.listening && (
                <div style={{ padding: '0 14px 8px', fontSize: 13, color: 'var(--accent)', fontStyle: 'italic', minHeight: 20 }}>
                  {speech.interim || 'Listening…'}
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', borderTop: '1px solid var(--border-light)' }}>
                {speech.supported ? (
                  <button type="button" onClick={speech.toggle} style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 999,
                    border: `1.5px solid ${speech.listening ? 'var(--error)' : 'var(--accent-border)'}`,
                    background: speech.listening ? 'rgba(239,68,68,0.08)' : 'var(--accent-light)',
                    color: speech.listening ? 'var(--error)' : 'var(--accent)',
                    fontSize: 12.5, fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s ease',
                  }}>
                    {speech.listening ? (
                      <>
                        <span className="zvoice-bars" aria-hidden><span /><span /><span /></span>
                        <Square size={12} fill="currentColor" /> Stop
                      </>
                    ) : (
                      <><Mic size={14} /> Speak instead</>
                    )}
                  </button>
                ) : (
                  <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>Voice input isn&apos;t supported on this browser — typing works!</span>
                )}
                <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>{need.length}/1000</span>
              </div>
            </div>
            {speech.error && (
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginTop: 8, padding: '9px 12px', borderRadius: 12, background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <AlertCircle size={14} style={{ color: 'var(--error)', flexShrink: 0, marginTop: 1 }} />
                <span style={{ fontSize: 12, color: 'var(--error)', lineHeight: 1.5, fontWeight: 600 }}>{speech.error}</span>
              </div>
            )}
            <p style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 8 }}>{cfg.need.hint}</p>
          </div>
          )}
        </div>

        {/* Sticky footer */}
        <div style={{
          padding: '14px 24px calc(16px + env(safe-area-inset-bottom))', borderTop: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
          background: 'var(--bg-elevated)',
        }}>
          <div style={{ minWidth: 0 }}>
            {isCompanion && (() => {
              const unit = extraHours > 0 ? `${formatPrice(basePrice)} + ${formatPrice(extraHours * COMPANION_HOURLY_INCREMENT)}` : formatPrice(basePrice);
              const breakdown = persons > 1 ? `(${unit}) × ${persons}` : unit;
              return (
                <div style={{ fontSize: 11.5, color: 'var(--text-muted)', fontWeight: 600, whiteSpace: 'nowrap' }}>{breakdown}</div>
              );
            })()}
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.45rem', fontWeight: 800, lineHeight: 1.2 }}>{formatPrice(total)}</div>
          </div>
          <button
            onClick={handleConfirm}
            disabled={!canConfirm}
            style={{
              padding: '14px 26px', borderRadius: 16, border: 'none', whiteSpace: 'nowrap',
              background: canConfirm ? 'linear-gradient(135deg, var(--accent), #ff9a56)' : 'var(--bg-input)',
              color: canConfirm ? '#fff' : 'var(--text-muted)',
              fontSize: 14.5, fontWeight: 800, cursor: canConfirm ? 'pointer' : 'not-allowed',
              boxShadow: canConfirm ? '0 8px 24px rgba(255,117,31,0.35)' : 'none',
              transition: 'all 0.2s ease',
            }}
          >
            {genderMissing ? 'Select your gender' : prefMissing ? 'Select preference' : confirmLabel}
          </button>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        .zsheet-overlay {
          position: fixed; inset: 0; z-index: 9999;
          background: rgba(0,0,0,0.55); backdrop-filter: blur(8px);
          display: flex; align-items: center; justify-content: center;
          animation: fadeIn 0.2s ease;
        }
        .zsheet {
          background: var(--bg-elevated); border: 1px solid var(--border);
          border-radius: 24px; width: 100%; max-width: 520px; max-height: 92vh;
          display: flex; flex-direction: column; overflow: hidden;
          box-shadow: 0 32px 90px rgba(0,0,0,0.5); margin: 16px;
          animation: slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .zsheet-handle { display: none; }
        @media (max-width: 640px) {
          .zsheet-overlay { align-items: flex-end; }
          .zsheet {
            margin: 0; max-width: 100%; border-radius: 24px 24px 0 0;
            border-bottom: none; max-height: 94vh;
            animation: zsheetUp 0.35s cubic-bezier(0.16, 1, 0.3, 1);
          }
          .zsheet-handle {
            display: block; width: 44px; height: 4.5px; border-radius: 999px;
            background: var(--border); margin: 10px auto 0; flex-shrink: 0;
          }
        }
        @keyframes zsheetUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        .zvoice-bars { display: inline-flex; align-items: flex-end; gap: 2.5px; height: 14px; }
        .zvoice-bars span {
          width: 3px; border-radius: 2px; background: currentColor;
          animation: zvoiceBar 0.9s ease-in-out infinite;
        }
        .zvoice-bars span:nth-child(1) { height: 6px; animation-delay: 0s; }
        .zvoice-bars span:nth-child(2) { height: 12px; animation-delay: 0.15s; }
        .zvoice-bars span:nth-child(3) { height: 8px; animation-delay: 0.3s; }
        @keyframes zvoiceBar { 0%, 100% { transform: scaleY(0.5); } 50% { transform: scaleY(1.15); } }
      `}} />
    </div>,
    document.body
  );
}
