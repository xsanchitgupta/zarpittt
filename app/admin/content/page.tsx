'use client';
import { useState, useEffect, useRef } from 'react';
import { adminFetch } from '@/lib/admin-fetch';
import { uploadImageToCloudinary } from '@/app/actions/image';
import {
  CONTENT_KEYS, DEFAULT_HOME, DEFAULT_BOOKING_FILTERS, parseContent,
  type HomeContent, type BookingFiltersContent,
} from '@/lib/content';
import { Save, Upload, Plus, Trash2, Loader2, CheckCircle2, Globe, FileText, SlidersHorizontal } from 'lucide-react';

/* =============================================
   Admin → Website Content
   Edits the CMS JSON stored in system_settings.
   Home page, legal pages and booking-sheet texts
   are all editable here; the site falls back to
   built-in defaults for anything left empty.
   ============================================= */

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', borderRadius: 10, fontSize: 14,
  background: 'var(--admin-bg-input, rgba(0,0,0,0.04))', color: 'inherit',
  border: '1px solid var(--admin-divider, rgba(128,128,128,0.25))', outline: 'none',
};

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 12.5, fontWeight: 700, opacity: 0.85 }}>{label}</label>
      {children}
      {hint && <span style={{ fontSize: 11.5, opacity: 0.55 }}>{hint}</span>}
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="admin-glass-panel" style={{ padding: 24, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <h3 style={{ fontSize: 15, fontWeight: 800 }}>{title}</h3>
      {children}
    </div>
  );
}

function ImageField({ label, value, onChange }: { label: string; value: string; onChange: (url: string) => void }) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await uploadImageToCloudinary(fd);
      if (res.success && res.url) onChange(res.url);
      else alert(res.error || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 12.5, fontWeight: 700, opacity: 0.85 }}>{label}</label>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <div style={{ width: 64, height: 48, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--admin-divider, rgba(128,128,128,0.25))', flexShrink: 0, background: 'rgba(128,128,128,0.1)' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {value && <img src={value} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
        </div>
        <input style={{ ...inputStyle, flex: 1 }} placeholder="Image URL or upload →" value={value} onChange={e => onChange(e.target.value)} />
        <button onClick={() => fileRef.current?.click()} disabled={uploading} style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '10px 14px', borderRadius: 10, whiteSpace: 'nowrap',
          border: '1px solid var(--admin-divider, rgba(128,128,128,0.25))', background: 'transparent', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: 'inherit',
        }}>
          {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />} Upload
        </button>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }} />
      </div>
    </div>
  );
}

function SaveBar({ onSave, saving, saved }: { onSave: () => void; saving: boolean; saved: boolean }) {
  return (
    <div style={{ position: 'sticky', bottom: 16, display: 'flex', justifyContent: 'flex-end', gap: 12, alignItems: 'center', zIndex: 5 }}>
      {saved && <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: '#22c55e' }}><CheckCircle2 size={16} /> Saved — live on the site</span>}
      <button onClick={onSave} disabled={saving} style={{
        display: 'flex', alignItems: 'center', gap: 8, padding: '13px 26px', borderRadius: 12,
        background: '#FF6B00', color: '#fff', border: 'none', fontSize: 14, fontWeight: 800, cursor: 'pointer',
        boxShadow: '0 8px 24px rgba(255,107,0,0.35)',
      }}>
        {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save Changes
      </button>
    </div>
  );
}

export default function AdminContentPage() {
  const [tab, setTab] = useState<'home' | 'legal' | 'filters'>('home');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [home, setHome] = useState<HomeContent>(DEFAULT_HOME);
  const [terms, setTerms] = useState('');
  const [privacy, setPrivacy] = useState('');
  const [filters, setFilters] = useState<BookingFiltersContent>(DEFAULT_BOOKING_FILTERS);

  useEffect(() => {
    (async () => {
      try {
        const res = await adminFetch('/api/admin/settings');
        if (res.ok) {
          const data = await res.json();
          const sys: { key: string; value: string }[] = data.system_settings || [];
          const get = (k: string) => sys.find(s => s.key === k)?.value;
          setHome(parseContent(DEFAULT_HOME, get(CONTENT_KEYS.home)));
          setTerms(get(CONTENT_KEYS.terms) || '');
          setPrivacy(get(CONTENT_KEYS.privacy) || '');
          setFilters(parseContent(DEFAULT_BOOKING_FILTERS, get(CONTENT_KEYS.bookingFilters)));
        }
      } catch (err) {
        console.error('Load content failed:', err);
      }
      setLoading(false);
    })();
  }, []);

  const save = async (entries: { key: string; value: string }[]) => {
    setSaving(true);
    setSaved(false);
    try {
      const res = await adminFetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table: 'system_settings', data: entries }),
      });
      if (!res.ok) throw new Error((await res.json())?.error || 'Save failed');
      setSaved(true);
      setTimeout(() => setSaved(false), 4000);
    } catch (err: any) {
      alert(`Save failed: ${err.message}`);
    }
    setSaving(false);
  };

  // Immutable helpers for nested edits
  const setTile = (i: number, patch: Partial<HomeContent['tiles'][number]>) =>
    setHome(h => ({ ...h, tiles: h.tiles.map((t, j) => j === i ? { ...t, ...patch } : t) }));
  const setCollage = (i: number, url: string) =>
    setHome(h => ({ ...h, collageImages: h.collageImages.map((c, j) => j === i ? url : c) }));
  const setReliableCard = (i: number, patch: Partial<HomeContent['reliable']['cards'][number]>) =>
    setHome(h => ({ ...h, reliable: { ...h.reliable, cards: h.reliable.cards.map((c, j) => j === i ? { ...c, ...patch } : c) } }));
  const setFaq = (i: number, patch: Partial<{ q: string; a: string }>) =>
    setHome(h => ({ ...h, faqs: h.faqs.map((f, j) => j === i ? { ...f, ...patch } : f) }));
  const setBullet = (which: 'vision' | 'mission', i: number, patch: Partial<{ title: string; text: string }>) =>
    setHome(h => ({ ...h, [which]: { ...h[which], bullets: h[which].bullets.map((b, j) => j === i ? { ...b, ...patch } : b) } }));

  const smallBtn: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 8, fontSize: 12.5, fontWeight: 700,
    border: '1px solid var(--admin-divider, rgba(128,128,128,0.25))', background: 'transparent', cursor: 'pointer', color: 'inherit',
  };

  if (loading) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}><Loader2 size={28} className="animate-spin" /></div>;
  }

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 980 }}>
      <div>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800 }}>Website Content</h1>
        <p style={{ fontSize: 13.5, opacity: 0.65, marginTop: 4 }}>Edit everything customers see — home page photos & texts, legal pages, and the booking form texts. Changes go live within seconds of saving.</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {([
          { id: 'home', label: 'Home Page', icon: Globe },
          { id: 'legal', label: 'Terms & Privacy', icon: FileText },
          { id: 'filters', label: 'Booking Form', icon: SlidersHorizontal },
        ] as const).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 10, fontSize: 13.5, fontWeight: 700, cursor: 'pointer',
            background: tab === t.id ? '#FF6B00' : 'transparent',
            color: tab === t.id ? '#fff' : 'inherit',
            border: `1px solid ${tab === t.id ? '#FF6B00' : 'var(--admin-divider, rgba(128,128,128,0.25))'}`,
          }}>
            <t.icon size={15} /> {t.label}
          </button>
        ))}
      </div>

      {/* ============ HOME TAB ============ */}
      {tab === 'home' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <Card title="Hero Heading">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <Field label="Line 1"><input style={inputStyle} value={home.heroLine1} onChange={e => setHome({ ...home, heroLine1: e.target.value })} /></Field>
              <Field label="Line 2 (orange)"><input style={inputStyle} value={home.heroLine2} onChange={e => setHome({ ...home, heroLine2: e.target.value })} /></Field>
            </div>
            <Field label="Services box title"><input style={inputStyle} value={home.quickTitle} onChange={e => setHome({ ...home, quickTitle: e.target.value })} /></Field>
          </Card>

          <Card title="Main Services (tiles on home screen)">
            {home.tiles.map((t, i) => (
              <div key={i} style={{ padding: 16, borderRadius: 12, border: '1px solid var(--admin-divider, rgba(128,128,128,0.25))', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, fontWeight: 800, opacity: 0.7 }}>Tile {i + 1}</span>
                  <button style={{ ...smallBtn, color: '#ef4444' }} onClick={() => setHome(h => ({ ...h, tiles: h.tiles.filter((_, j) => j !== i) }))}><Trash2 size={13} /> Remove</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '70px 1fr 1fr', gap: 12 }}>
                  <Field label="Icon"><input style={inputStyle} value={t.icon} onChange={e => setTile(i, { icon: e.target.value })} /></Field>
                  <Field label="Name"><input style={inputStyle} value={t.name} onChange={e => setTile(i, { name: e.target.value })} /></Field>
                  <Field label="Category slug" hint="Must match a category (e.g. companion)"><input style={inputStyle} value={t.slug} onChange={e => setTile(i, { slug: e.target.value })} /></Field>
                </div>
                <Field label="Short description"><input style={inputStyle} value={t.desc} onChange={e => setTile(i, { desc: e.target.value })} /></Field>
                <ImageField label="Tile photo (optional — replaces the emoji icon)" value={t.image || ''} onChange={url => setTile(i, { image: url })} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'end' }}>
                  <Field label="Tags (comma separated)">
                    <input style={inputStyle} value={t.tags.join(', ')} onChange={e => setTile(i, { tags: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} />
                  </Field>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', paddingBottom: 10 }}>
                    <input type="checkbox" checked={t.comingSoon} onChange={e => setTile(i, { comingSoon: e.target.checked })} style={{ width: 16, height: 16 }} />
                    Coming Soon
                  </label>
                </div>
              </div>
            ))}
            <button style={smallBtn} onClick={() => setHome(h => ({ ...h, tiles: [...h.tiles, { name: 'New Service', icon: '✨', desc: '', tags: [], slug: '', comingSoon: true }] }))}>
              <Plus size={13} /> Add tile
            </button>
          </Card>

          <Card title="Hero Photos (right-side collage)">
            {home.collageImages.map((img, i) => (
              <ImageField key={i} label={`Photo ${i + 1} ${i === 0 || i === 3 ? '(large)' : '(small)'}`} value={img} onChange={url => setCollage(i, url)} />
            ))}
          </Card>

          <Card title="Why Us — Section Heading">
            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 14 }}>
              <Field label="Label"><input style={inputStyle} value={home.whyUs.label} onChange={e => setHome({ ...home, whyUs: { ...home.whyUs, label: e.target.value } })} /></Field>
              <Field label="Title"><input style={inputStyle} value={home.whyUs.title} onChange={e => setHome({ ...home, whyUs: { ...home.whyUs, title: e.target.value } })} /></Field>
            </div>
            <Field label="Subtitle"><input style={inputStyle} value={home.whyUs.subtitle} onChange={e => setHome({ ...home, whyUs: { ...home.whyUs, subtitle: e.target.value } })} /></Field>
          </Card>

          {(['vision', 'mission'] as const).map(which => (
            <Card key={which} title={which === 'vision' ? 'Our Vision' : 'Our Mission'}>
              <Field label="Title"><input style={inputStyle} value={home[which].title} onChange={e => setHome({ ...home, [which]: { ...home[which], title: e.target.value } })} /></Field>
              <Field label="Main text"><textarea rows={2} style={{ ...inputStyle, resize: 'vertical' }} value={home[which].text} onChange={e => setHome({ ...home, [which]: { ...home[which], text: e.target.value } })} /></Field>
              {home[which].bullets.map((b, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12 }}>
                  <Field label={`Point ${i + 1} — title`}><input style={inputStyle} value={b.title} onChange={e => setBullet(which, i, { title: e.target.value })} /></Field>
                  <Field label="Text"><input style={inputStyle} value={b.text} onChange={e => setBullet(which, i, { text: e.target.value })} /></Field>
                </div>
              ))}
            </Card>
          ))}

          <Card title="Reliable & Trustworthy Section">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <Field label="Title"><input style={inputStyle} value={home.reliable.title} onChange={e => setHome({ ...home, reliable: { ...home.reliable, title: e.target.value } })} /></Field>
              <Field label="Subtitle"><input style={inputStyle} value={home.reliable.subtitle} onChange={e => setHome({ ...home, reliable: { ...home.reliable, subtitle: e.target.value } })} /></Field>
            </div>
            {home.reliable.cards.map((c, i) => (
              <div key={i} style={{ padding: 16, borderRadius: 12, border: '1px solid var(--admin-divider, rgba(128,128,128,0.25))', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <span style={{ fontSize: 13, fontWeight: 800, opacity: 0.7 }}>Card {i + 1}</span>
                <ImageField label="Photo" value={c.image} onChange={url => setReliableCard(i, { image: url })} />
                <Field label="Title"><input style={inputStyle} value={c.title} onChange={e => setReliableCard(i, { title: e.target.value })} /></Field>
                <Field label="Description"><input style={inputStyle} value={c.desc} onChange={e => setReliableCard(i, { desc: e.target.value })} /></Field>
              </div>
            ))}
          </Card>

          <Card title="FAQs">
            {home.faqs.map((f, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, alignItems: 'start' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <input style={inputStyle} placeholder="Question" value={f.q} onChange={e => setFaq(i, { q: e.target.value })} />
                  <textarea rows={2} style={{ ...inputStyle, resize: 'vertical' }} placeholder="Answer" value={f.a} onChange={e => setFaq(i, { a: e.target.value })} />
                </div>
                <button style={{ ...smallBtn, color: '#ef4444', marginTop: 4 }} onClick={() => setHome(h => ({ ...h, faqs: h.faqs.filter((_, j) => j !== i) }))}><Trash2 size={13} /></button>
              </div>
            ))}
            <button style={smallBtn} onClick={() => setHome(h => ({ ...h, faqs: [...h.faqs, { q: '', a: '' }] }))}><Plus size={13} /> Add FAQ</button>
          </Card>

          <SaveBar saving={saving} saved={saved} onSave={() => save([{ key: CONTENT_KEYS.home, value: JSON.stringify(home) }])} />
        </div>
      )}

      {/* ============ LEGAL TAB ============ */}
      {tab === 'legal' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ padding: '12px 16px', borderRadius: 10, fontSize: 12.5, lineHeight: 1.6, border: '1px solid var(--admin-divider, rgba(128,128,128,0.25))', opacity: 0.8 }}>
            Formatting: start a line with <code>## </code> for a heading, <code>- </code> for a bullet point, <code>&gt; </code> for a highlighted note. Blank line = new paragraph. <strong>Leave a box empty to keep the current built-in text.</strong>
          </div>
          <Card title="Terms & Conditions">
            <textarea rows={18} style={{ ...inputStyle, resize: 'vertical', fontFamily: 'monospace', fontSize: 13 }} placeholder="Empty = built-in terms text is shown" value={terms} onChange={e => setTerms(e.target.value)} />
          </Card>
          <Card title="Privacy Policy">
            <textarea rows={18} style={{ ...inputStyle, resize: 'vertical', fontFamily: 'monospace', fontSize: 13 }} placeholder="Empty = built-in privacy text is shown" value={privacy} onChange={e => setPrivacy(e.target.value)} />
          </Card>
          <SaveBar saving={saving} saved={saved} onSave={() => save([
            { key: CONTENT_KEYS.terms, value: terms },
            { key: CONTENT_KEYS.privacy, value: privacy },
          ])} />
        </div>
      )}

      {/* ============ FILTERS TAB ============ */}
      {tab === 'filters' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <Card title="Companion Booking Filters">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <Field label="Hours label"><input style={inputStyle} value={filters.companion.hoursLabel} onChange={e => setFilters(f => ({ ...f, companion: { ...f.companion, hoursLabel: e.target.value } }))} /></Field>
              <Field label="Persons label"><input style={inputStyle} value={filters.companion.personsLabel} onChange={e => setFilters(f => ({ ...f, companion: { ...f.companion, personsLabel: e.target.value } }))} /></Field>
              <Field label="Max hours"><input type="number" min={1} max={24} style={inputStyle} value={filters.companion.maxHours} onChange={e => setFilters(f => ({ ...f, companion: { ...f.companion, maxHours: Math.max(1, parseInt(e.target.value) || 12) } }))} /></Field>
              <Field label="Max persons"><input type="number" min={1} max={20} style={inputStyle} value={filters.companion.maxPersons} onChange={e => setFilters(f => ({ ...f, companion: { ...f.companion, maxPersons: Math.max(1, parseInt(e.target.value) || 10) } }))} /></Field>
              <Field label="Gender question label"><input style={inputStyle} value={filters.companion.genderLabel} onChange={e => setFilters(f => ({ ...f, companion: { ...f.companion, genderLabel: e.target.value } }))} /></Field>
              <Field label="Preference label"><input style={inputStyle} value={filters.companion.prefLabel} onChange={e => setFilters(f => ({ ...f, companion: { ...f.companion, prefLabel: e.target.value } }))} /></Field>
            </div>
            <Field label="Note shown to male customers"><textarea rows={2} style={{ ...inputStyle, resize: 'vertical' }} value={filters.companion.maleNote} onChange={e => setFilters(f => ({ ...f, companion: { ...f.companion, maleNote: e.target.value } }))} /></Field>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <Field label="Meet point label"><input style={inputStyle} value={filters.companion.meetLabel} onChange={e => setFilters(f => ({ ...f, companion: { ...f.companion, meetLabel: e.target.value } }))} /></Field>
              <Field label="Meet point placeholder"><input style={inputStyle} value={filters.companion.meetPlaceholder} onChange={e => setFilters(f => ({ ...f, companion: { ...f.companion, meetPlaceholder: e.target.value } }))} /></Field>
            </div>
            <Field label="Meet point hint"><input style={inputStyle} value={filters.companion.meetHint} onChange={e => setFilters(f => ({ ...f, companion: { ...f.companion, meetHint: e.target.value } }))} /></Field>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, fontWeight: 700, cursor: 'pointer' }}>
              <input type="checkbox" checked={filters.companion.showMeetPoint} onChange={e => setFilters(f => ({ ...f, companion: { ...f.companion, showMeetPoint: e.target.checked } }))} style={{ width: 16, height: 16 }} />
              Show pickup / meet point field
            </label>
          </Card>

          <Card title='"Describe your need" box (both Companion & Helping Buddy)'>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <Field label="Label"><input style={inputStyle} value={filters.need.label} onChange={e => setFilters(f => ({ ...f, need: { ...f.need, label: e.target.value } }))} /></Field>
              <Field label="Placeholder"><input style={inputStyle} value={filters.need.placeholder} onChange={e => setFilters(f => ({ ...f, need: { ...f.need, placeholder: e.target.value } }))} /></Field>
            </div>
            <Field label="Hint below the box"><input style={inputStyle} value={filters.need.hint} onChange={e => setFilters(f => ({ ...f, need: { ...f.need, hint: e.target.value } }))} /></Field>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, fontWeight: 700, cursor: 'pointer' }}>
              <input type="checkbox" checked={filters.need.show} onChange={e => setFilters(f => ({ ...f, need: { ...f.need, show: e.target.checked } }))} style={{ width: 16, height: 16 }} />
              Show the need description box
            </label>
          </Card>

          <SaveBar saving={saving} saved={saved} onSave={() => save([{ key: CONTENT_KEYS.bookingFilters, value: JSON.stringify(filters) }])} />
        </div>
      )}
    </div>
  );
}
