import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import Map, {
  NavigationControl,
  GeolocateControl,
  type ViewStateChangeEvent,
  type MapRef,
} from 'react-map-gl';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Users } from 'lucide-react';
import type { Hotel, Coordinates } from '../../types/index';
import { cn } from '../../utils/cn';
import HotelMarker from './HotelMarker';
import HotelPopup from './HotelPopup';

// =============================================================================
// MAPBOX CONFIGURATION
// =============================================================================

const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

if (!MAPBOX_ACCESS_TOKEN) {
  console.error('Missing VITE_MAPBOX_ACCESS_TOKEN environment variable');
}

// Seattle downtown coordinates
const SEATTLE_CENTER: Coordinates = {
  latitude: 47.6089,
  longitude: -122.3345,
};

const INITIAL_VIEW_STATE = {
  latitude: SEATTLE_CENTER.latitude,
  longitude: SEATTLE_CENTER.longitude,
  zoom: 12.5,
  pitch: 0,
  bearing: 0,
};

// Map style options
const MAP_STYLE = 'mapbox://styles/mapbox/streets-v12';

// =============================================================================
// COMPONENT INTERFACES
// =============================================================================

export interface HotelMapProps {
  hotels: Hotel[];
  selectedHotel?: Hotel | null;
  onHotelSelect?: (hotel: Hotel) => void;
  onHotelHover?: (hotel: Hotel | null) => void;
  className?: string;
  showPopup?: boolean;
  enableClustering?: boolean;
  mapStyle?: string;
}



// =============================================================================
// MAIN HOTEL MAP COMPONENT
// =============================================================================

export const HotelMap = React.memo<HotelMapProps>(({
  hotels,
  selectedHotel,
  onHotelSelect,
  onHotelHover,
  className,
  showPopup = true,
  enableClustering = false,
  mapStyle = MAP_STYLE,
}) => {
  const mapRef = useRef<MapRef>(null);
  
  // Local state
  const [viewState, setViewState] = useState(INITIAL_VIEW_STATE);
  const [hoveredHotel, setHoveredHotel] = useState<Hotel | null>(null);
  const [popupHotel, setPopupHotel] = useState<Hotel | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  // Event handlers (must be declared before useMemo)
  const handleViewStateChange = useCallback((evt: ViewStateChangeEvent) => {
    setViewState(evt.viewState);
  }, []);

  const handleHotelClick = useCallback((hotel: Hotel) => {
    onHotelSelect?.(hotel);
    if (showPopup) {
      setPopupHotel(hotel);
    }
  }, [onHotelSelect, showPopup]);

  const handleHotelHover = useCallback((hotel: Hotel | null) => {
    setHoveredHotel(hotel);
    onHotelHover?.(hotel);
  }, [onHotelHover]);

  const handlePopupClose = useCallback(() => {
    setPopupHotel(null);
  }, []);

  const handleMapClick = useCallback(() => {
    setPopupHotel(null);
  }, []);

  const handleMapLoad = useCallback(() => {
    setIsMapLoaded(true);
    setMapError(null);
  }, []);

  const handleMapError = useCallback((error: any) => {
    const errorMessage = error.error?.message || error.message || 'Map error';
    setMapError(errorMessage);
    console.error('Map error:', error);
  }, []);

  // Memoized hotel markers (after event handlers are declared)
  const hotelMarkers = useMemo(() => {
    if (!hotels || hotels.length === 0) return [];

    // TODO: Implement clustering when enableClustering is true
    if (enableClustering) {
      // Clustering logic will be implemented here
    }

    return hotels.map((hotel) => (
      <HotelMarker
        key={hotel.hotel_id}
        hotel={hotel}
        isSelected={selectedHotel?.hotel_id === hotel.hotel_id}
        isHovered={hoveredHotel?.hotel_id === hotel.hotel_id}
        onClick={handleHotelClick}
        onHover={handleHotelHover}
      />
    ));
  }, [hotels, selectedHotel, hoveredHotel, handleHotelClick, handleHotelHover]);

  // Fly to selected hotel
  useEffect(() => {
    if (selectedHotel && mapRef.current) {
      mapRef.current.flyTo({
        center: [selectedHotel.longitude, selectedHotel.latitude],
        zoom: Math.max(viewState.zoom, 14),
        duration: 1000,
      });
    }
  }, [selectedHotel, viewState.zoom]);

  // Error boundary for missing token
  if (!MAPBOX_ACCESS_TOKEN) {
    return (
      <div className={cn('flex items-center justify-center bg-gray-100', className)}>
        <div className="text-center p-8">
          <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Map Configuration Required
          </h3>
          <p className="text-gray-600">
            Please add VITE_MAPBOX_ACCESS_TOKEN to your environment variables
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (mapError) {
    return (
      <div className={cn('flex items-center justify-center bg-gray-100', className)}>
        <div className="text-center p-8">
          <MapPin className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Map Error
          </h3>
          <p className="text-gray-600">{mapError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('relative w-full h-full', className)}>
      <Map
        ref={mapRef}
        {...viewState}
        onMove={handleViewStateChange}
        onClick={handleMapClick}
        onLoad={handleMapLoad}
        onError={handleMapError}
        mapboxAccessToken={MAPBOX_ACCESS_TOKEN}
        style={{ width: '100%', height: '100%' }}
        mapStyle={mapStyle}
        reuseMaps={true}
        preserveDrawingBuffer={true}
        attributionControl={false}
        interactiveLayerIds={[]}
        cursor="grab"
      >
        {/* Navigation Controls */}
        <NavigationControl
          position="top-right"
          showCompass={true}
          showZoom={true}
          visualizePitch={true}
        />

        {/* Geolocation Control */}
        <GeolocateControl
          position="top-right"
          positionOptions={{ enableHighAccuracy: true }}
          trackUserLocation={true}
          showAccuracyCircle={true}
          showUserLocation={true}
        />

        {/* Hotel Markers */}
        <AnimatePresence>
          {isMapLoaded && hotelMarkers}
        </AnimatePresence>

        {/* Hotel Popup */}
        {showPopup && popupHotel && (
          <HotelPopup
            hotel={popupHotel}
            onClose={handlePopupClose}
          />
        )}
      </Map>

      {/* Loading State */}
      {!isMapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
          <div className="text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"
            />
            <p className="text-gray-600">Loading map...</p>
          </div>
        </div>
      )}

      {/* Hotel Count Badge */}
      {hotels && hotels.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg px-3 py-2"
        >
          <div className="flex items-center gap-2 text-sm">
            <Users className="w-4 h-4 text-blue-500" />
            <span className="font-medium">
              {hotels.length} hotel{hotels.length !== 1 ? 's' : ''}
            </span>
          </div>
        </motion.div>
      )}
    </div>
  );
});

HotelMap.displayName = 'HotelMap';

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

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
  mapRef: React.RefObject<MapRef>,
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

export default HotelMap; 