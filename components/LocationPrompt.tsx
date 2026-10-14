'use client';
import { useState, useEffect } from 'react';
import { MapPin, X, AlertTriangle, Check, Loader2, Navigation } from 'lucide-react';
import { isLocationServiceable } from '@/lib/data';

interface LocationResult {
  status: 'serviceable' | 'not_serviceable';
  area: string | null;
  lat: number;
  lng: number;
  address?: string;
}

interface Props {
  onResult: (result: LocationResult | null) => void;
  onSkip?: () => void;
}

export default function LocationPrompt({ onResult, onSkip }: Props) {
  const [detecting, setDetecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detectedAddress, setDetectedAddress] = useState<string | null>(null);
  const [locationData, setLocationData] = useState<any>(null);
  useEffect(() => {
    console.log('[DEBUG] LocationPrompt mounted (client-only). Triggering auto-detect...');
    handleAllowLocation();
  }, []);

  const fetchAddress = async (lat: number, lng: number) => {
    try {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        console.warn('Geocoding disabled: NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is missing');
        return null;
      }
      const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`);
      const data = await response.json();
      if (data.status === 'OK' && data.results.length > 0) {
        return data.results[0].formatted_address;
      }
      return null;
    } catch (err) {
      console.error('Reverse geocoding failed:', err);
      return null;
    }
  };

  const handleAllowLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }

    setDetecting(true);
    setError(null);
    setDetectedAddress(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const address = await fetchAddress(latitude, longitude);
        const res = await fetch('/api/service-areas');
        const { data: areasData } = await res.json();
        const activeAreas = areasData || [];
        const result = isLocationServiceable(latitude, longitude, activeAreas.length > 0 ? activeAreas : undefined);
        
        setDetecting(false);
        setDetectedAddress(address);
        setLocationData({
          status: result.serviceable ? 'serviceable' : 'not_serviceable',
          area: result.area,
          lat: latitude,
          lng: longitude,
          address: address
        });
      },
      (err) => {
        setDetecting(false);
        if (err.code === err.PERMISSION_DENIED) {
          setError('Location access was denied. Please enable it in your browser settings.');
        } else {
          setError('Unable to detect location. Please try again.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleConfirm = () => {
    if (locationData) {
      onResult(locationData);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 50000,
      background: 'rgba(0,0,0,0.85)',
      backdropFilter: 'blur(12px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
    }}>
      <style jsx>{`
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.8; }
          100% { transform: scale(1); opacity: 1; }
        }
        .pulse-icon {
          animation: ${detecting ? 'pulse 1.5s infinite ease-in-out' : 'none'};
        }
      `}</style>
      
      <div style={{
        width: '100%', maxWidth: 440,
        background: 'var(--bg-card-solid)',
        border: '1px solid var(--glass-border)',
        borderRadius: 32,
        padding: '48px 40px',
        boxShadow: '0 24px 60px rgba(0,0,0,0.4)',
        position: 'relative',
        animation: 'fadeInUp 0.4s ease'
      }}>
        {/* Close */}
        {onSkip && (
          <button
            onClick={onSkip}
            style={{
              position: 'absolute', top: 16, right: 16,
              background: 'rgba(255, 255, 255, 0.08)', 
              border: '1px solid rgba(255, 255, 255, 0.1)', 
              borderRadius: '50%',
              cursor: 'pointer',
              color: 'var(--text)', 
              padding: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10,
              transition: 'background 0.2s ease'
            }}
            aria-label="Skip"
          >
            <X size={18} />
          </button>
        )}

        <div className="pulse-icon" style={{
          width: 88, height: 88,
          borderRadius: '50%',
          background: detectedAddress ? 'rgba(34,197,94,0.1)' : 'var(--accent-light)',
          border: `1px solid ${detectedAddress ? 'rgba(34,197,94,0.3)' : 'var(--accent-border)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 32px',
          transition: 'all 0.3s ease'
        }}>
          {detectedAddress ? (
            <Check size={40} style={{ color: '#22c55e' }} />
          ) : (
            <MapPin size={40} style={{ color: 'var(--accent)' }} />
          )}
        </div>

        <h2 style={{
          fontFamily: 'var(--font-heading)', fontSize: '1.75rem', fontWeight: 900,
          textAlign: 'center', marginBottom: 12, color: 'var(--text)', letterSpacing: '-0.02em'
        }}>
          {detectedAddress ? 'Location Found!' : 'Precise Location'}
        </h2>

        <p style={{
          fontSize: 15, color: 'var(--text-secondary)', textAlign: 'center',
          lineHeight: 1.6, marginBottom: 32,
        }}>
          {detectedAddress 
            ? 'We found your exact service area. Confirm to continue.' 
            : 'Allow access to fetch your exact street address for faster service booking.'}
        </p>

        {detectedAddress && (
          <div style={{
            padding: '20px', background: 'var(--bg-input)', border: '1px solid var(--border-light)',
            borderRadius: 20, marginBottom: 32, display: 'flex', alignItems: 'center', gap: 14,
            animation: 'fadeIn 0.3s ease'
          }}>
            <Navigation size={20} style={{ color: 'var(--accent)', flexShrink: 0 }} />
            <span style={{ fontSize: 14, color: 'var(--text)', fontWeight: 600, lineHeight: 1.4 }}>
              {detectedAddress}
            </span>
          </div>
        )}

        {error && !detecting && (
          <div style={{
            padding: '14px 18px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)',
            borderRadius: 16, marginBottom: 24, display: 'flex', alignItems: 'flex-start', gap: 12,
          }}>
            <AlertTriangle size={18} style={{ color: 'var(--error)', flexShrink: 0, marginTop: 2 }} />
            <span style={{ fontSize: 13, color: 'var(--error)', fontWeight: 500 }}>{error}</span>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {detectedAddress ? (
            <button className="btn btn-primary btn-lg" style={{ width: '100%' }} onClick={handleConfirm}>
              Confirm & Proceed
            </button>
          ) : (
            <button
              className="btn btn-primary btn-lg"
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}
              onClick={handleAllowLocation}
              disabled={detecting}
            >
              {detecting && <Loader2 size={20} className="animate-spin" />}
              {detecting ? 'Detecting...' : 'Allow Precise Location'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
