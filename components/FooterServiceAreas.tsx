'use client';
import { useState, useEffect } from 'react';
import { MapPin } from 'lucide-react';

export default function FooterServiceAreas() {
  const [areas, setAreas] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/service-areas').then(res => res.json()).then(({data}) => {
      if (data && data.length > 0) {
        setAreas(data);
      }
    }).catch(err => console.error(err));
  }, []);

  if (areas.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <span style={{ color: 'var(--text-tertiary)', fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }} className="footer-item-center"><MapPin size={16} /> Greater Noida</span>
        <span style={{ color: 'var(--text-tertiary)', fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }} className="footer-item-center"><MapPin size={16} /> Noida</span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {areas.map(a => (
        <span key={a.name} style={{ color: 'var(--text-tertiary)', fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }} className="footer-item-center">
          <MapPin size={16} /> {a.name}
        </span>
      ))}
    </div>
  );
}
