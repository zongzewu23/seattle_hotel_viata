import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import Map, {
  NavigationControl,
  GeolocateControl,
  Marker,
  Popup,
  ViewStateChangeEvent,
  MapRef,
} from 'react-map-gl';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Star, DollarSign, Users } from 'lucide-react';
import type { Hotel, Coordinates } from '../../types/index';
import { normalizePrice } from '../../utils/dataProcessor';
import { cn } from '../../utils/cn';

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

interface HotelMarkerProps {
  hotel: Hotel;
  isSelected: boolean;
  isHovered: boolean;
  onClick: (hotel: Hotel) => void;
  onHover: (hotel: Hotel | null) => void;
}

interface HotelPopupProps {
  hotel: Hotel;
  onClose: () => void;
}

// =============================================================================
// HOTEL MARKER COMPONENT
// =============================================================================

const HotelMarker = React.memo<HotelMarkerProps>(({
  hotel,
  isSelected,
  isHovered,
  onClick,
  onHover,
}) => {
  const markerRef = useRef<HTMLDivElement>(null);

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onClick(hotel);
  }, [hotel, onClick]);

  const handleMouseEnter = useCallback(() => {
    onHover(hotel);
  }, [hotel, onHover]);

  const handleMouseLeave = useCallback(() => {
    onHover(null);
  }, [onHover]);

  const markerColor = useMemo(() => {
    if (isSelected) return '#DC2626'; // red-600
    if (isHovered) return '#EA580C'; // orange-600
    if (hotel.rating >= 8.5) return '#059669'; // emerald-600
    if (hotel.rating >= 7.0) return '#0D9488'; // teal-600
    return '#6B7280'; // gray-500
  }, [isSelected, isHovered, hotel.rating]);

  const markerSize = useMemo(() => {
    if (isSelected) return 40;
    if (isHovered) return 36;
    return 32;
  }, [isSelected, isHovered]);

  return (
    <Marker
      latitude={hotel.latitude}
      longitude={hotel.longitude}
      anchor="bottom"
      onClick={handleClick}
    >
      <motion.div
        ref={markerRef}
        className={cn(
          'cursor-pointer transition-all duration-200',
          'hover:scale-110 active:scale-95',
          isSelected && 'z-10',
          isHovered && 'z-20'
        )}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <div
          className={cn(
            'relative flex items-center justify-center',
            'rounded-full border-2 border-white shadow-lg',
            'transition-all duration-200'
          )}
          style={{
            width: markerSize,
            height: markerSize,
            backgroundColor: markerColor,
          }}
        >
          <MapPin
            className="text-white"
            size={markerSize * 0.5}
            fill="currentColor"
          />
          
          {/* Rating badge */}
          <div
            className={cn(
              'absolute -top-2 -right-2',
              'min-w-[24px] h-6 px-1',
              'bg-white rounded-full border-2 border-current',
              'flex items-center justify-center',
              'text-xs font-bold'
            )}
            style={{ color: markerColor }}
          >
            {hotel.rating.toFixed(1)}
          </div>
        </div>
      </motion.div>
    </Marker>
  );
});

HotelMarker.displayName = 'HotelMarker';

// =============================================================================
// HOTEL POPUP COMPONENT
// =============================================================================

const HotelPopup = React.memo<HotelPopupProps>(({ hotel, onClose }) => {
  const normalizedPrice = normalizePrice(hotel.price_per_night);

  return (
    <Popup
      latitude={hotel.latitude}
      longitude={hotel.longitude}
      onClose={onClose}
      closeButton={true}
      closeOnClick={false}
      anchor="top"
      offset={[0, -10]}
      maxWidth="320px"
      className="hotel-popup"
    >
      <motion.div
        className="p-3 max-w-sm"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {/* Hotel Image */}
        <div className="relative mb-3 rounded-lg overflow-hidden">
          <img
            src={hotel.image_url}
            alt={hotel.name}
            className="w-full h-32 object-cover"
            loading="lazy"
          />
          <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-sm">
            {hotel.star_rating}★
          </div>
        </div>

        {/* Hotel Info */}
        <div className="space-y-2">
          <h3 className="font-semibold text-lg leading-tight line-clamp-2">
            {hotel.name}
          </h3>
          
          <p className="text-sm text-gray-600 line-clamp-1">
            {hotel.address}
          </p>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-500 fill-current" />
              <span className="text-sm font-medium">{hotel.rating}</span>
              <span className="text-sm text-gray-500">
                ({hotel.review_count} reviews)
              </span>
            </div>
            
            <div className="flex items-center gap-1">
              <DollarSign className="w-4 h-4 text-green-600" />
              <span className="text-sm font-semibold text-green-600">
                ${normalizedPrice}
              </span>
            </div>
          </div>
          
          <div className="text-sm text-gray-600">
            {hotel.room_type}
          </div>
          
          {/* Amenities */}
          {hotel.amenities.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {hotel.amenities.slice(0, 4).map((amenity, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-gray-100 text-xs rounded-full text-gray-700"
                >
                  {amenity}
                </span>
              ))}
              {hotel.amenities.length > 4 && (
                <span className="px-2 py-1 bg-gray-100 text-xs rounded-full text-gray-700">
                  +{hotel.amenities.length - 4}
                </span>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </Popup>
  );
});

HotelPopup.displayName = 'HotelPopup';

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

  // Memoized hotel markers
  const hotelMarkers = useMemo(() => {
    if (!hotels || hotels.length === 0) return [];

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
  }, [hotels, selectedHotel, hoveredHotel]);

  // Event handlers
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

  const handleMapError = useCallback((error: Error) => {
    setMapError(error.message);
    console.error('Map error:', error);
  }, []);

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