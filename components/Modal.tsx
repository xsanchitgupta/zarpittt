'use client';
import { useEffect, useRef, ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  width?: number;
}

export default function Modal({ isOpen, onClose, title, children, width = 520 }: ModalProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div style={{
      position:'fixed',inset:0,zIndex:10000,
      display:'flex',alignItems:'center',justifyContent:'center',
      animation:'fadeIn 0.2s ease',
    }} onClick={onClose}>
      {/* Backdrop */}
      <div style={{position:'absolute',inset:0,background:'rgba(0,0,0,0.6)',backdropFilter:'blur(4px)'}} />

      {/* Content */}
      <div ref={ref} onClick={e => e.stopPropagation()} style={{
        position:'relative', width:'92%', maxWidth:width, maxHeight:'90vh', overflowY:'auto', overflowX: 'hidden',
        background:'var(--bg-card-solid)', border:'1px solid var(--glass-border)',
        borderRadius:'var(--radius-2xl)', padding:0,
        boxShadow:'var(--shadow-xl)', animation:'fadeInUp 0.3s ease',
      }}>
        {/* Header */}
        <div style={{
          display:'flex', alignItems:'flex-start', justifyContent:'space-between',
          padding:'16px 24px', borderBottom:'1px solid var(--border)', position:'sticky', top:0,
          background:'var(--bg-card-solid)', zIndex:1, borderRadius:'var(--radius-2xl) var(--radius-2xl) 0 0',
          gap: 12
        }}>
          <h3 style={{
            fontFamily:'var(--font-heading)', fontSize:'clamp(0.9rem, 4vw, 1.1rem)', fontWeight:800, 
            lineHeight: 1.3, color: 'var(--text-primary)', flex: 1, wordBreak: 'break-word',
            margin: 0
          }}>
            {title}
          </h3>
          <button onClick={onClose} style={{
            width:32, height:32, flexShrink: 0, display:'flex', alignItems:'center', justifyContent:'center', 
            borderRadius:'10px', background:'var(--glass-bg)', border:'1px solid var(--border)', 
            cursor:'pointer', color:'var(--text-muted)', fontSize:14, transition:'all 0.2s',
            marginTop: -2
          }}>✕</button>
        </div>

        {/* Body */}
        <div style={{padding:'24px 28px'}}>
          {children}
        </div>
      </div>
    </div>
  );
}
