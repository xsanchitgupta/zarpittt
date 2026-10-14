'use client';

import type { ElementType } from 'react';

interface StatsCardProps {
  icon: ElementType;
  label: string;
  value: string | number;
  trend?: string;
  trendUp?: boolean;
}

export default function StatsCard({ icon: Icon, label, value, trend, trendUp }: StatsCardProps) {
  return (
    <div className="admin-glass-panel" style={{
      padding: '24px',
      transition: 'all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)',
      cursor: 'pointer'
    }}
    onMouseEnter={e => { 
      e.currentTarget.style.transform = 'translateY(-2px) scale(1.01)';
      e.currentTarget.style.boxShadow = 'var(--admin-shadow-lg)';
    }}
    onMouseLeave={e => { 
      e.currentTarget.style.transform = 'none';
      e.currentTarget.style.boxShadow = 'var(--admin-shadow-md)';
    }}
    >
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
        <div style={{
          width:40,height:40,borderRadius:12,
          background: 'var(--admin-glass-active)',
          display:'flex',alignItems:'center',justifyContent:'center',
          color: 'var(--admin-text-primary)'
        }}><Icon size={20} strokeWidth={2} /></div>
        {trend && (
          <span style={{
            fontSize:13,fontWeight:600,
            color: trendUp ? '#34c759' : '#ff3b30',
            display:'flex',alignItems:'center',gap:4,
          }}>
            {trendUp ? '↑' : '↓'} {trend}
          </span>
        )}
      </div>
      <div style={{fontFamily:'-apple-system, BlinkMacSystemFont, sans-serif',fontSize:'2rem',fontWeight:700,letterSpacing:'-0.02em',marginBottom:4, color: 'var(--admin-text-primary)'}}>
        {value}
      </div>
      <div style={{fontSize:14,color:'var(--admin-text-secondary)', fontWeight: 500}}>{label}</div>
    </div>
  );
}
