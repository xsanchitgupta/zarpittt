'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { LocateFixed, Layers } from 'lucide-react';

interface MapMarker {
  lat: number;
  lng: number;
  type: 'worker' | 'customer' | 'request';
  label?: string;
  pulse?: boolean;
}

interface LiveMapProps {
  center?: { lat: number; lng: number };
  zoom?: number;
  markers?: MapMarker[];
  showRoute?: boolean;
  workerLocation?: { lat: number; lng: number } | null;
  customerLocation?: { lat: number; lng: number } | null;
  height?: string | number;
  borderRadius?: string;
  onMarkerClick?: (marker: MapMarker) => void;
  radiusKm?: number;
  workerName?: string;
}

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

export default function LiveMap({
  center,
  zoom = 15,
  markers = [],
  showRoute = false,
  workerLocation,
  customerLocation,
  height = 400,
  borderRadius = 'var(--radius-3xl)',
  onMarkerClick,
  radiusKm,
  workerName,
}: LiveMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const workerMarkerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
  const customerMarkerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
  const routeLineRef = useRef<google.maps.Polyline | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  const mapHeight = typeof height === 'number' ? `${height}px` : height;

  // Initialize Map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const loader = new Loader({
      apiKey: GOOGLE_MAPS_API_KEY,
      version: 'weekly',
      libraries: ['marker']
    });

    loader.load().then(async () => {
      const { Map } = await google.maps.importLibrary("maps") as google.maps.MapsLibrary;
      
      const initialCenter = center || customerLocation || workerLocation || { lat: 28.6139, lng: 77.2090 };
      
      const map = new Map(containerRef.current!, {
        center: initialCenter,
        zoom,
        mapId: 'ZARPIT_MAP_ID', // Required for AdvancedMarkerElement
        disableDefaultUI: true,
        styles: [
          {
            "featureType": "poi",
            "elementType": "labels",
            "stylers": [{ "visibility": "off" }]
          }
        ]
      });

      mapRef.current = map;
      setMapLoaded(true);
    });
  }, []);

  // Update Customer Marker
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;

    if (customerMarkerRef.current) {
      if (customerLocation) {
        customerMarkerRef.current.position = customerLocation;
      } else {
        customerMarkerRef.current.map = null;
        customerMarkerRef.current = null;
      }
    } else if (customerLocation) {
      const content = document.createElement('div');
      content.innerHTML = `
        <div style="position:relative; display:flex; flex-direction:column; align-items:center;">
          <div style="width:44px; height:44px; border-radius:50%; background:linear-gradient(135deg, #3d1700, #5c2a00); display:flex; align-items:center; justify-content:center; font-size:22px; border:3px solid #fff; box-shadow:0 4px 16px rgba(61, 23, 0, 0.35);">🏠</div>
          <div style="width:0; height:0; border-left:8px solid transparent; border-right:8px solid transparent; border-top:10px solid #3d1700; margin-top:-2px;"></div>
        </div>
      `;

      customerMarkerRef.current = new google.maps.marker.AdvancedMarkerElement({
        map: mapRef.current,
        position: customerLocation,
        content,
        title: 'Your Location'
      });
    }
  }, [mapLoaded, customerLocation]);

  // Update Worker Marker
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || !workerLocation) return;

    if (workerMarkerRef.current) {
      workerMarkerRef.current.position = workerLocation;
    } else {
      const content = document.createElement('div');
      content.innerHTML = `
        <div style="position:relative; display:flex; flex-direction:column; align-items:center;">
          <div style="width:52px; height:52px; border-radius:50%; background:linear-gradient(135deg, #ff751f, #ff9a56); display:flex; align-items:center; justify-content:center; font-size:26px; border:3px solid #fff; box-shadow:0 4px 16px rgba(255, 117, 31, 0.45); z-index:2; position:relative;">🧑‍🔧</div>
          <div style="position:absolute; inset:0; border-radius:50%; background:rgba(255,117,31,0.25); animation:mapPulse 2s ease-in-out infinite; pointer-events:none; z-index:1;"></div>
        </div>
      `;

      workerMarkerRef.current = new google.maps.marker.AdvancedMarkerElement({
        map: mapRef.current,
        position: workerLocation,
        content,
        title: workerName || 'Professional'
      });
    }

    if (!customerLocation) {
      mapRef.current.panTo(workerLocation);
    }
  }, [mapLoaded, workerLocation, workerName, customerLocation]);

  // Update Generic Markers
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;

    markersRef.current.forEach(m => m.map = null);
    markersRef.current = [];

    markers.forEach(m => {
      const content = document.createElement('div');
      const color = m.type === 'worker' ? '#ff751f' : m.type === 'customer' ? '#3d1700' : '#3b82f6';
      const size = m.type === 'worker' ? 32 : 28;
      
      content.innerHTML = `
        <div style="width:${size}px; height:${size}px; border-radius:50%; background:${color}; border:3px solid #fff; box-shadow:0 2px 8px rgba(0,0,0,0.3);"></div>
      `;

      const marker = new google.maps.marker.AdvancedMarkerElement({
        map: mapRef.current,
        position: { lat: m.lat, lng: m.lng },
        content,
        title: m.label
      });

      if (onMarkerClick) {
        marker.addListener('click', () => onMarkerClick(m));
      }
      markersRef.current.push(marker);
    });
  }, [mapLoaded, markers]);

  // Route Line
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;

    if (routeLineRef.current) {
      routeLineRef.current.setMap(null);
      routeLineRef.current = null;
    }

    if (showRoute && workerLocation && customerLocation) {
      routeLineRef.current = new google.maps.Polyline({
        path: [workerLocation, customerLocation],
        geodesic: true,
        strokeColor: '#ff751f',
        strokeOpacity: 0.7,
        strokeWeight: 4,
        icons: [{
          icon: { path: 'M 0,-1 0,1', strokeOpacity: 1, scale: 4 },
          offset: '0',
          repeat: '20px'
        }],
        map: mapRef.current
      });

      const bounds = new google.maps.LatLngBounds();
      bounds.extend(workerLocation);
      bounds.extend(customerLocation);
      mapRef.current.fitBounds(bounds, { top: 60, right: 60, bottom: 60, left: 60 });
    }
  }, [mapLoaded, showRoute, workerLocation, customerLocation]);

  const recenter = () => {
    if (!mapRef.current) return;
    if (workerLocation && customerLocation) {
      const bounds = new google.maps.LatLngBounds();
      bounds.extend(workerLocation);
      bounds.extend(customerLocation);
      mapRef.current.fitBounds(bounds, { top: 40, right: 40, bottom: 40, left: 40 });
    } else if (customerLocation) {
      mapRef.current.panTo(customerLocation);
      mapRef.current.setZoom(15);
    } else if (workerLocation) {
      mapRef.current.panTo(workerLocation);
      mapRef.current.setZoom(15);
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: mapHeight, borderRadius, overflow: 'hidden' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%', zIndex: 1, background: '#f0f0f0' }} />

      {/* Controls */}
      <div style={{ position: 'absolute', top: 16, right: 16, zIndex: 1000, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button onClick={recenter} className="map-ctrl" title="Recenter"><LocateFixed size={18} /></button>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes mapPulse {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.6); opacity: 0; }
        }
        .map-ctrl {
          width: 42px; height: 42px; border-radius: 14px;
          background: rgba(255,255,255,0.92); backdrop-filter: blur(12px);
          color: #1a1a2e; display: flex; align-items: center; justify-content: center;
          cursor: pointer; border: 1px solid rgba(0,0,0,0.1);
          transition: all 0.2s; box-shadow: 0 2px 12px rgba(0,0,0,0.08);
        }
        .map-ctrl:hover { background: #fff; transform: translateY(-2px); box-shadow: 0 4px 20px rgba(0,0,0,0.12); }
      `}} />
    </div>
  );
}
