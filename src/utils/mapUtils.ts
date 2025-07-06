import type { Hotel } from '../types/index';
import type { MapRef } from 'react-map-gl';

/**
 * Calculate map bounds for a set of hotels
 * @param hotels - Array of hotels
 * @returns Bounds object for map fitBounds
 */
export function calculateHotelBounds(hotels: Hotel[]) {
  if (hotels.length === 0) return null;

  const lats = hotels.map(h => h.latitude);
  const lngs = hotels.map(h => h.longitude);

  return {
    southwest: {
      longitude: Math.min(...lngs),
      latitude: Math.min(...lats),
    },
    northeast: {
      longitude: Math.max(...lngs),
      latitude: Math.max(...lats),
    },
  };
}

/**
 * Fit map to show all hotels
 * @param mapRef - Map reference
 * @param hotels - Array of hotels
 * @param padding - Padding around bounds
 */
export function fitMapToHotels(
  mapRef: React.RefObject<MapRef | null>,
  hotels: Hotel[],
  padding = 50
) {
  const bounds = calculateHotelBounds(hotels);
  if (!bounds || !mapRef.current) return;

  mapRef.current.fitBounds(
    [
      [bounds.southwest.longitude, bounds.southwest.latitude],
      [bounds.northeast.longitude, bounds.northeast.latitude],
    ],
    { padding }
  );
}

/**
 * Force map redraw for crisp rendering after animations
 * @param mapRef - Map reference
 */
export function refreshMapDisplay(mapRef: React.RefObject<MapRef | null>) {
  if (mapRef.current) {
    // Force canvas redraw for crisp rendering
    mapRef.current.resize();
  }
} 