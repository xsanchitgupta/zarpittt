'use client';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle, XCircle } from 'lucide-react';

interface DosAndDontsModalProps {
  isOpen: boolean;
  onClose: () => void;
  serviceName: string;
  dosAndDonts?: { dos: string[]; donts: string[] };
  included?: string[];
  not_included?: string[];
}

export default function DosAndDontsModal({ isOpen, onClose, serviceName, dosAndDonts, included, not_included }: DosAndDontsModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  const defaultDos = ['Ensure clear access to the service area', 'Keep pets in a separate room', 'Verify the professional\'s identity before allowing entry'];
  const defaultDonts = ['Do not negotiate prices with the professional directly', 'Do not ask the professional to perform tasks outside the booked service', 'Do not pay in cash unless Cash on Delivery is selected'];

  // Prioritize specific inclusions/exclusions if available
  const hasSpecificData = (included && included.length > 0) || (not_included && not_included.length > 0);
  const dosList = hasSpecificData ? (included || []) : (dosAndDonts?.dos?.length ? dosAndDonts.dos : defaultDos);
  const dontsList = hasSpecificData ? (not_included || []) : (dosAndDonts?.donts?.length ? dosAndDonts.donts : defaultDonts);
  const dosTitle = hasSpecificData ? "What's Included" : "DOs";
  const dontsTitle = hasSpecificData ? "What's Not Included" : "DON'Ts";

  return createPortal(
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', animation: 'fadeIn 0.2s ease'
    }}>
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)',
        width: '100%', maxWidth: 600, maxHeight: '90vh', display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-2xl)', margin: 16, animation: 'slideUp 0.3s ease'
      }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', fontWeight: 700 }}>Service Guidelines</h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>For {serviceName}</p>
          </div>
          <button onClick={onClose} style={{
            width: 32, height: 32, borderRadius: 8, background: 'var(--surface)', border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-secondary)'
          }}>
            <X size={18} />
          </button>
        </div>
        
        <div style={{ padding: 24, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* DOS */}
          <div>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 600, color: 'var(--success)', marginBottom: 16 }}>
              <CheckCircle size={20} /> {dosTitle}
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {dosList.map((item: string, i: number) => (
                <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 14, color: 'var(--text)' }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success)', marginTop: 8, flexShrink: 0 }} />
                  <span style={{ lineHeight: 1.5 }}>{item.replace(/^-\s*/, '')}</span>
                </li>
              ))}
            </ul>
          </div>
          
          <div style={{ height: 1, background: 'var(--border)' }} />
          
          {/* DON'TS */}
          <div>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 600, color: 'var(--error)', marginBottom: 16 }}>
              <XCircle size={20} /> {dontsTitle}
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {dontsList.map((item: string, i: number) => (
                <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 14, color: 'var(--text)' }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--error)', marginTop: 8, flexShrink: 0 }} />
                  <span style={{ lineHeight: 1.5 }}>{item.replace(/^-\s*/, '')}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', background: 'var(--surface)' }}>
          <button onClick={onClose} className="btn btn-primary">Understood</button>
        </div>
      </div>
    </div>,
    document.body
  );
}
