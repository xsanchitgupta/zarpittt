'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { LocateFixed, MapPin, Navigation, Clock } from 'lucide-react';
import { useProviderTracking } from '@/lib/use-provider-tracking';
import { LatLng, interpolatePosition, easeOutCubic, shouldRecalculateRoute, formatDistance, formatETA } from '@/lib/map-utils';

interface TrackingMapProps {
  status: string;
  customerLocation: { lat: number; lng: number } | null;
  providerUserId: string | null;
  providerName?: string;
  height?: string | number;
  scheduledTime?: string;
  borderRadius?: string | number;
}

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

export default function TrackingMap({
  status,
  customerLocation,
  providerUserId,
  providerName = 'Professional',
  height = 400,
  scheduledTime,
  borderRadius
}: TrackingMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const workerMarkerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
  const workerIconRef = useRef<HTMLDivElement | null>(null);
  const customerMarkerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
  const routeLineRef = useRef<google.maps.Polyline | null>(null);
  const directionsServiceRef = useRef<google.maps.DirectionsService | null>(null);
  
  const [mapLoaded, setMapLoaded] = useState(false);
  const [directionsData, setDirectionsData] = useState<{ distance: string; duration: string } | null>(null);

  const isActive = ['en_route', 'arrived', 'started'].includes(status);
  const isCompleted = status === 'completed';
  const isCancelled = status === 'cancelled';
  const isPreJourney = ['pending', 'confirmed'].includes(status);

  // Hook for tracking provider location
  const tracking = useProviderTracking({
    providerUserId,
    enabled: isActive,
  });

  const mapHeight = typeof height === 'number' ? `${height}px` : height;
  const mapBorderRadius = borderRadius !== undefined ? borderRadius : 'var(--radius-3xl)';

  // ─── STAGE 1 & 5: Pre-Journey / Completed (No Map) ───
  if (isPreJourney || isCompleted || isCancelled) {
    return (
      <div style={{ width: '100%', height: mapHeight, background: 'var(--bg-card-solid)', borderRadius: mapBorderRadius, border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32, textAlign: 'center' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--bg)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
          {isCompleted ? <MapPin size={28} color="var(--success)" /> : <Clock size={28} color="var(--accent)" />}
        </div>
        <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)', marginBottom: 8 }}>
          {isCompleted ? 'Journey Completed' : 'Waiting for Journey to Start'}
        </h3>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', maxWidth: 280 }}>
          {isCompleted 
            ? 'The professional has arrived and completed the journey.'
            : `The map will appear here when ${providerName.split(' ')[0]} starts heading to your location.`}
        </p>
      </div>
    );
  }

  // ─── STAGE 2: Journey Started - Load Map ───
  useEffect(() => {
    if (!isActive || mapLoaded || !containerRef.current) return;

    const loader = new Loader({
      apiKey: GOOGLE_MAPS_API_KEY,
      version: 'weekly',
      libraries: ['marker', 'routes']
    });

    loader.load().then(async () => {
      const { Map, Polyline } = await google.maps.importLibrary("maps") as google.maps.MapsLibrary;
      const { AdvancedMarkerElement } = await google.maps.importLibrary("marker") as google.maps.MarkerLibrary;
      const { DirectionsService } = await google.maps.importLibrary("routes") as google.maps.RoutesLibrary;
      
      directionsServiceRef.current = new DirectionsService();
      
      const initialCenter = customerLocation || { lat: 28.6139, lng: 77.2090 };
      
      const map = new Map(containerRef.current!, {
        center: initialCenter,
        zoom: 15,
        mapId: 'ZARPIT_MAP_ID', // Replace with your Map ID
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
      
      // Setup Customer Marker
      if (customerLocation) {
        const content = document.createElement('div');
        content.innerHTML = `
          <div style="position:relative; display:flex; flex-direction:column; align-items:center;">
            <div style="width:44px; height:44px; border-radius:50%; background:linear-gradient(135deg, #3d1700, #5c2a00); display:flex; align-items:center; justify-content:center; font-size:22px; border:3px solid #fff; box-shadow:0 4px 16px rgba(61, 23, 0, 0.35);">🏠</div>
            <div style="width:0; height:0; border-left:8px solid transparent; border-right:8px solid transparent; border-top:10px solid #3d1700; margin-top:-2px;"></div>
          </div>
        `;

        customerMarkerRef.current = new AdvancedMarkerElement({
          map,
          position: customerLocation,
          content,
          title: 'Your Location'
        });
      }

      // Setup Worker Marker
      const workerContent = document.createElement('div');
      workerContent.innerHTML = `
        <div style="position:relative; display:flex; flex-direction:column; align-items:center; transition: transform 0.3s ease-out;">
          <div style="width:52px; height:52px; border-radius:50%; background:linear-gradient(135deg, #ff751f, #ff9a56); display:flex; align-items:center; justify-content:center; font-size:26px; border:3px solid #fff; box-shadow:0 4px 16px rgba(255, 117, 31, 0.45); z-index:2; position:relative;">🧑‍🔧</div>
          <div style="position:absolute; inset:0; border-radius:50%; background:rgba(255,117,31,0.25); animation:mapPulse 2s ease-in-out infinite; pointer-events:none; z-index:1;"></div>
        </div>
      `;
      workerIconRef.current = workerContent.firstElementChild as HTMLDivElement;

      workerMarkerRef.current = new AdvancedMarkerElement({
        map,
        position: tracking.position || customerLocation || { lat: 0, lng: 0 },
        content: workerContent,
        title: providerName
      });

      // Setup Route Polyline
      routeLineRef.current = new google.maps.Polyline({
        map,
        strokeColor: '#ff751f',
        strokeOpacity: 0.8,
        strokeWeight: 5,
      });

      setMapLoaded(true);
    }).catch((err) => {
      console.error("Google Maps failed to load:", err);
    });

    return () => {
      // Cleanup stage 5
      if (routeLineRef.current) routeLineRef.current.setMap(null);
      if (workerMarkerRef.current) workerMarkerRef.current.map = null;
      if (customerMarkerRef.current) customerMarkerRef.current.map = null;
    };
  }, [isActive, containerRef]);

  // ─── STAGE 3: Active Tracking & Animation ───
  const animationFrameRef = useRef<number | null>(null);
  const currentPosRef = useRef<LatLng | null>(null);
  const lastRoutePosRef = useRef<LatLng | null>(null);
  const lastRouteTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!mapLoaded || !tracking.position || !workerMarkerRef.current || !mapRef.current) return;

    const map = mapRef.current;
    const marker = workerMarkerRef.current;
    const targetPos = tracking.position;
    const startPos = currentPosRef.current || targetPos;
    
    // Rotate Marker based on heading
    if (workerIconRef.current && tracking.heading !== null) {
      workerIconRef.current.style.transform = `rotate(${tracking.heading}deg)`;
    }

    // Animate Marker
    const startTime = performance.now();
    const duration = 2000; // 2 seconds interpolation

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutCubic(progress);

      const newPos = interpolatePosition(startPos, targetPos, easedProgress);
      marker.position = newPos;
      currentPosRef.current = newPos;

      // Adjust camera only if marker is near edge of bounds
      const bounds = map.getBounds();
      if (bounds && !bounds.contains(newPos)) {
         map.panTo(newPos);
      }

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    };

    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    animationFrameRef.current = requestAnimationFrame(animate);

    // Initial camera fit
    if (!currentPosRef.current && customerLocation) {
      const bounds = new google.maps.LatLngBounds();
      bounds.extend(targetPos);
      bounds.extend(customerLocation);
      map.fitBounds(bounds, { top: 60, right: 60, bottom: 60, left: 60 });
    }

    // Directions API for real route (Throttled)
    const now = Date.now();
    const timeSinceLastRoute = now - lastRouteTimeRef.current;
    const needsNewRoute = 
      !lastRoutePosRef.current || 
      shouldRecalculateRoute(lastRoutePosRef.current, targetPos, 150) ||
      timeSinceLastRoute > 30000; // Force refresh every 30s max

    if (customerLocation && directionsServiceRef.current && routeLineRef.current && needsNewRoute && status === 'en_route') {
      lastRoutePosRef.current = targetPos;
      lastRouteTimeRef.current = now;

      directionsServiceRef.current.route({
        origin: targetPos,
        destination: customerLocation,
        travelMode: google.maps.TravelMode.DRIVING,
      }, (result, gStatus) => {
        if (gStatus === google.maps.DirectionsStatus.OK && result) {
          routeLineRef.current?.setPath(result.routes[0].overview_path);
          const leg = result.routes[0].legs[0];
          setDirectionsData({
            distance: leg.distance?.text || '',
            duration: leg.duration?.text || ''
          });
        }
      });
    }

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [mapLoaded, tracking.position, tracking.heading, customerLocation, status]);

  const recenter = () => {
    if (!mapRef.current) return;
    if (currentPosRef.current && customerLocation) {
      const bounds = new google.maps.LatLngBounds();
      bounds.extend(currentPosRef.current);
      bounds.extend(customerLocation);
      mapRef.current.fitBounds(bounds, { top: 40, right: 40, bottom: 40, left: 40 });
    } else if (currentPosRef.current) {
      mapRef.current.panTo(currentPosRef.current);
      mapRef.current.setZoom(15);
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: mapHeight, borderRadius: mapBorderRadius, overflow: 'hidden' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%', zIndex: 1, background: '#f0f0f0' }} />

      {/* HUD Overlay */}
      {isActive && directionsData && status === 'en_route' && (
        <div style={{ position: 'absolute', top: 16, left: 16, right: 16, display: 'flex', justifyContent: 'space-between', pointerEvents: 'none', zIndex: 10 }}>
          <div style={{ padding: '10px 18px', background: 'var(--bg-card-solid)', backdropFilter: 'blur(16px)', borderRadius: 16, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12, boxShadow: 'var(--shadow-md)', pointerEvents: 'auto' }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Navigation size={18} color="var(--accent)" />
            </div>
            <div>
              <div style={{ fontSize: 9, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Distance</div>
              <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--text)' }}>{directionsData.distance}</div>
            </div>
          </div>
          
          <div style={{ padding: '10px 18px', background: 'var(--accent)', borderRadius: 16, display: 'flex', alignItems: 'center', gap: 12, color: '#fff', boxShadow: '0 8px 24px rgba(255,117,31,0.35)', pointerEvents: 'auto' }}>
            <Clock size={18} />
            <div>
              <div style={{ fontSize: 9, fontWeight: 800, opacity: 0.75, textTransform: 'uppercase', letterSpacing: '0.1em' }}>ETA</div>
              <div style={{ fontSize: 16, fontWeight: 900 }}>{directionsData.duration}</div>
            </div>
          </div>
        </div>
      )}

      {/* Status Badges */}
      {isActive && (
        <div style={{ position: 'absolute', bottom: 16, left: 16, display: 'flex', gap: 8, zIndex: 10 }}>
          <div style={{ padding: '6px 14px', background: 'rgba(239,68,68,0.9)', borderRadius: 10, color: '#fff', fontSize: 11, fontWeight: 900, display: 'flex', alignItems: 'center', gap: 6, letterSpacing: '0.06em', backdropFilter: 'blur(8px)' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff', animation: 'liveBlink 1s infinite' }} />
            LIVE
          </div>
          {tracking.isStale && (
            <div style={{ padding: '6px 14px', background: 'rgba(0,0,0,0.7)', borderRadius: 10, color: '#fff', fontSize: 11, fontWeight: 700, backdropFilter: 'blur(8px)' }}>
              Updating location...
            </div>
          )}
          {tracking.isIdle && !tracking.isStale && status === 'en_route' && (
            <div style={{ padding: '6px 14px', background: 'rgba(234,179,8,0.9)', borderRadius: 10, color: '#fff', fontSize: 11, fontWeight: 700, backdropFilter: 'blur(8px)' }}>
              Stopped
            </div>
          )}
        </div>
      )}

      {/* Controls */}
      {isActive && (
        <div style={{ position: 'absolute', top: 16, right: 16, zIndex: 1000, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button onClick={recenter} className="map-ctrl" title="Recenter"><LocateFixed size={18} /></button>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes mapPulse {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.6); opacity: 0; }
        }
        @keyframes liveBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
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
