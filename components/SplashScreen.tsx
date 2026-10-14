'use client';
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';

interface SplashScreenProps {
  onComplete: () => void;
  fast?: boolean;
}

export default function SplashScreen({ onComplete, fast = false }: SplashScreenProps) {
  const [progress, setProgress] = useState(0);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => onCompleteRef.current(), fast ? 100 : 200);
          return 100;
        }
        // Much faster progress — user shouldn't wait
        const increment = fast
          ? (prev < 50 ? 20 : prev < 80 ? 12 : 8)
          : (prev < 60 ? 8 : prev < 85 ? 5 : 3);
        return Math.min(prev + increment, 100);
      });
    }, fast ? 15 : 25);

    return () => clearInterval(interval);
  }, [fast]);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 99999,
      background: 'var(--bg, #0a0a0a)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      transition: 'opacity 0.2s ease',
      opacity: progress >= 100 ? 0 : 1,
      pointerEvents: progress >= 100 ? 'none' : 'auto',
    }}>
      {/* Logo */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 14,
        marginBottom: 40,
        animation: 'fadeInUp 0.3s ease both',
      }}>
        <Image
          src="/images/logo.jpg"
          alt="Zarpit"
          width={52}
          height={52}
          style={{ borderRadius: 'var(--radius-lg)' }}
          priority
        />
        <span style={{
          fontFamily: 'var(--font-heading)',
          fontSize: '2rem',
          fontWeight: 800,
          letterSpacing: '-0.03em',
          background: 'linear-gradient(135deg, var(--accent) 0%, #ffb685 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          Zarpit
        </span>
      </div>

      {/* Progress bar */}
      <div style={{
        width: 200,
        height: 3,
        background: 'var(--border)',
        borderRadius: 'var(--radius-full)',
        overflow: 'hidden',
        animation: 'fadeInUp 0.3s ease 0.05s both',
      }}>
        <div style={{
          height: '100%',
          width: `${progress}%`,
          background: 'linear-gradient(90deg, var(--accent), #ffb685)',
          borderRadius: 'var(--radius-full)',
          transition: 'width 0.08s linear',
        }} />
      </div>

      {/* Tagline */}
      <p style={{
        marginTop: 20,
        fontSize: 13,
        color: 'var(--text-muted)',
        letterSpacing: '0.05em',
        animation: 'fadeInUp 0.3s ease 0.1s both',
      }}>
        Connecting Needs with Opportunities
      </p>
    </div>
  );
}
