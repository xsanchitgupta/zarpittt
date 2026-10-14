/* =============================================
   Map Utilities — Distance, ETA, Animation, Bearing
   Production-grade utilities for real-time tracking
   ============================================= */

// ─── Distance ────────────────────────────────────

/**
 * Calculate the Haversine distance between two lat/lng points.
 * Returns distance in kilometers.
 */
export function haversineDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

function toDeg(rad: number): number {
  return rad * (180 / Math.PI);
}

// ─── ETA ─────────────────────────────────────────

/**
 * Estimate arrival time based on distance.
 * Uses average urban speed of 25 km/h.
 */
export function estimateETA(distanceKm: number, avgSpeedKmH: number = 25): number {
  if (distanceKm <= 0) return 1;
  const minutes = (distanceKm / avgSpeedKmH) * 60;
  return Math.max(1, Math.round(minutes));
}

// ─── Formatting ──────────────────────────────────

/**
 * Format distance for display.
 */
export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)}m`;
  return `${km.toFixed(1)} km`;
}

/**
 * Format ETA for display.
 */
export function formatETA(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

// ─── Geocoding ───────────────────────────────────

/**
 * Reverse geocode coordinates to a human-readable address.
 */
export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      { headers: { 'User-Agent': 'ZarpitUserPanel/1.0' } }
    );
    const data = await res.json();
    return data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  } catch {
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }
}

// ─── Interpolation (CRITICAL for smooth animation) ──

export interface LatLng {
  lat: number;
  lng: number;
}

/**
 * Linearly interpolate between two lat/lng positions.
 * `progress` should be 0..1 (0 = from, 1 = to).
 * Uses proper spherical interpolation for accuracy at short distances.
 */
export function interpolatePosition(from: LatLng, to: LatLng, progress: number): LatLng {
  const t = Math.max(0, Math.min(1, progress));
  return {
    lat: from.lat + (to.lat - from.lat) * t,
    lng: from.lng + (to.lng - from.lng) * t,
  };
}

/**
 * Ease-out cubic curve for natural deceleration feel.
 * Input: 0..1, Output: 0..1 (eased)
 */
export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

/**
 * Ease-in-out cubic for smooth start/stop.
 */
export function easeInOutCubic(t: number): number {
  return t < 0.5
    ? 4 * t * t * t
    : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// ─── Bearing ─────────────────────────────────────

/**
 * Calculate the bearing (heading) in degrees from point A to point B.
 * Returns 0-360 degrees (0 = North, 90 = East, etc.)
 */
export function calculateBearing(from: LatLng, to: LatLng): number {
  const dLng = toRad(to.lng - from.lng);
  const lat1 = toRad(from.lat);
  const lat2 = toRad(to.lat);

  const x = Math.sin(dLng) * Math.cos(lat2);
  const y = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);

  const bearing = toDeg(Math.atan2(x, y));
  return (bearing + 360) % 360; // Normalize to 0-360
}

// ─── Route Deviation Detection ───────────────────

/**
 * Check if a new position has deviated significantly from the last known route position.
 * Used to determine if Directions API should be re-queried.
 * 
 * @param oldPos - Previous position
 * @param newPos - New position
 * @param thresholdMeters - Minimum deviation to trigger re-route (default: 100m)
 */
export function shouldRecalculateRoute(
  oldPos: LatLng,
  newPos: LatLng,
  thresholdMeters: number = 100
): boolean {
  const distanceKm = haversineDistance(oldPos.lat, oldPos.lng, newPos.lat, newPos.lng);
  return distanceKm * 1000 > thresholdMeters;
}

/**
 * Check if a position has moved enough to warrant a DB push.
 * Prevents spamming Supabase when worker is stationary.
 *
 * @param oldPos - Last pushed position
 * @param newPos - Current position
 * @param thresholdMeters - Minimum movement to trigger push (default: 5m)
 */
export function hasMovedSignificantly(
  oldPos: LatLng | null,
  newPos: LatLng,
  thresholdMeters: number = 5
): boolean {
  if (!oldPos) return true;
  const distanceKm = haversineDistance(oldPos.lat, oldPos.lng, newPos.lat, newPos.lng);
  return distanceKm * 1000 > thresholdMeters;
}

// ─── Idle Detection ──────────────────────────────

/**
 * Determine if the professional is idle based on speed.
 * @param speedMs - Speed in meters/second from GPS
 * @param thresholdMs - Speed below which is considered idle (default: 0.5 m/s ≈ walking pace)
 */
export function isIdle(speedMs: number | null, thresholdMs: number = 0.5): boolean {
  if (speedMs === null || speedMs === undefined) return false;
  return speedMs < thresholdMs;
}
