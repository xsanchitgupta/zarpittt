'use client';
import { useState, useEffect, useCallback } from 'react';

interface ToastData { id: string; type: 'success' | 'error' | 'info' | 'warning'; title: string; message?: string; }
let addToastFn: ((t: Omit<ToastData, 'id'>) => void) | null = null;

export function showToast(type: ToastData['type'], title: string, message?: string) {
  addToastFn?.({ type, title, message });
}

export const toast = {
  success: (t: string, m?: string) => showToast('success', t, m),
  error: (t: string, m?: string) => showToast('error', t, m),
  info: (t: string, m?: string) => showToast('info', t, m),
  warning: (t: string, m?: string) => showToast('warning', t, m),
};

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const addToast = useCallback((t: Omit<ToastData, 'id'>) => {
    const id = Date.now().toString(36);
    setToasts(prev => [...prev, { ...t, id }]);
    setTimeout(() => setToasts(prev => prev.filter(x => x.id !== id)), 4000);
  }, []);

  useEffect(() => { addToastFn = addToast; return () => { addToastFn = null; }; }, [addToast]);

  const colors = { success: 'var(--success)', error: 'var(--error)', info: 'var(--text-secondary)', warning: 'var(--warning)' };
  const icons = { success: '✓', error: '✕', info: 'ℹ', warning: '⚠' };

  if (toasts.length === 0) return null;

  return (
    <div style={{position:'fixed',top:'calc(var(--navbar-h) + 16px)',right:16,zIndex:600,display:'flex',flexDirection:'column',gap:10,pointerEvents:'none'}}>
      {toasts.map(t => (
        <div key={t.id} style={{
          display:'flex',alignItems:'center',gap:12,padding:'14px 20px',
          background:'var(--bg-card-solid)',border:'1px solid var(--border)',
          borderLeft:`3px solid ${colors[t.type]}`,
          borderRadius:'var(--radius-lg)',boxShadow:'var(--shadow-xl)',
          minWidth:300,maxWidth:420,pointerEvents:'auto',
          animation:'toastIn 0.3s ease',backdropFilter:'blur(20px)'
        }}>
          <span style={{fontSize:16,color:colors[t.type],flexShrink:0}}>{icons[t.type]}</span>
          <div style={{flex:1}}>
            <div style={{fontSize:14,fontWeight:600}}>{t.title}</div>
            {t.message && <div style={{fontSize:12,color:'var(--text-secondary)',marginTop:2}}>{t.message}</div>}
          </div>
          <button onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))} style={{color:'var(--text-muted)',cursor:'pointer',flexShrink:0,fontSize:14}}>✕</button>
        </div>
      ))}
    </div>
  );
}
