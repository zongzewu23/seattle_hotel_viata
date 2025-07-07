import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import Map, {
  NavigationControl,
  GeolocateControl,
  type ViewStateChangeEvent,
  type MapRef,
} from 'react-map-gl';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Users } from 'lucide-react';
import type { Hotel, Coordinates, HotelCluster, MapViewport } from '../../types/index';
import { cn } from '../../utils/cn';
import { refreshMapDisplay } from '../../utils/mapUtils';
import { 
  calculateClustersCached, 
  DEFAULT_CLUSTERING_CONFIG, 
  shouldCluster,
  clearClusterCache 
} from '../../utils/clusteringUtils';
import HotelMarker from './HotelMarker';
import HotelPopup from './HotelPopup';
import ClusterMarker from './ClusterMarker';

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
  onMapViewStateChange?: (viewState: { latitude: number; longitude: number; zoom: number }) => void;
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
  onMapViewStateChange,
}) => {
  const mapRef = useRef<MapRef>(null);
  const animationTimeoutRef = useRef<number | null>(null);
  
  // Local state
  const [viewState, setViewState] = useState(INITIAL_VIEW_STATE);
  const [hoveredHotel, setHoveredHotel] = useState<Hotel | null>(null);
  const [popupHotel, setPopupHotel] = useState<Hotel | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  // Event handlers (must be declared before useMemo)
  const handleViewStateChange = useCallback((evt: ViewStateChangeEvent) => {
    const newViewState = evt.viewState;
    setViewState(newViewState);
    
    // Notify parent about view state changes
    onMapViewStateChange?.({
      latitude: newViewState.latitude,
      longitude: newViewState.longitude,
      zoom: newViewState.zoom,
    });
    
    // Debug logging for zoom-related positioning issues
    if (import.meta.env.DEV && Math.abs(newViewState.zoom - viewState.zoom) > 0.5) {
      console.log('🗺️ Map zoom change debug:', {
        oldZoom: viewState.zoom.toFixed(2),
        newZoom: newViewState.zoom.toFixed(2),
        center: {
          lat: newViewState.latitude.toFixed(6),
          lng: newViewState.longitude.toFixed(6),
        },
        mapLoaded: isMapLoaded,
        timestamp: new Date().toISOString(),
      });
    }
  }, [viewState.zoom, isMapLoaded, onMapViewStateChange]);

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

  const handleClusterClick = useCallback((cluster: HotelCluster) => {
    if (mapRef.current) {
      // Calculate padding based on cluster size
      const padding = Math.max(50, cluster.count * 2);
      
      // Zoom to cluster bounds with animation
      mapRef.current.fitBounds([
        [cluster.bounds.west, cluster.bounds.south],
        [cluster.bounds.east, cluster.bounds.north]
      ], { 
        padding: { top: padding, bottom: padding, left: padding, right: padding },
        duration: 800,
        essential: true,
      });
    }
  }, []);

  // Memoized hotel markers and clusters (after event handlers are declared)
  const markers = useMemo(() => {
    if (!hotels || hotels.length === 0) return [];

    // Use clustering if enabled and should cluster at current zoom level
    if (enableClustering && shouldCluster(viewState.zoom, DEFAULT_CLUSTERING_CONFIG)) {
      const viewport: MapViewport = {
        bounds: {
          northeast: {
            latitude: viewState.latitude + 0.1,
            longitude: viewState.longitude + 0.1,
          },
          southwest: {
            latitude: viewState.latitude - 0.1,
            longitude: viewState.longitude - 0.1,
          },
        },
        center: {
          latitude: viewState.latitude,
          longitude: viewState.longitude,
        },
        zoom: viewState.zoom,
      };

      const { clusters, individualHotels } = calculateClustersCached(
        hotels,
        viewport,
        DEFAULT_CLUSTERING_CONFIG
      );

      // Debug logging for clustering
      if (import.meta.env.DEV && (clusters.length > 0 || individualHotels.length !== hotels.length)) {
        console.log('🔗 Clustering debug:', {
          totalHotels: hotels.length,
          clusters: clusters.length,
          individualHotels: individualHotels.length,
          zoom: viewState.zoom.toFixed(2),
          shouldCluster: shouldCluster(viewState.zoom, DEFAULT_CLUSTERING_CONFIG),
        });
      }

      return [
        // Render cluster markers
        ...clusters.map(cluster => (
          <ClusterMarker
            key={cluster.id}
            cluster={cluster}
            onClusterClick={handleClusterClick}
          />
        )),
        // Render individual hotel markers
        ...individualHotels.map(hotel => (
          <HotelMarker
            key={hotel.hotel_id}
            hotel={hotel}
            isSelected={selectedHotel?.hotel_id === hotel.hotel_id}
            isHovered={hoveredHotel?.hotel_id === hotel.hotel_id}
            onClick={handleHotelClick}
            onHover={handleHotelHover}
          />
        )),
      ];
    }

    // No clustering - render all hotels individually
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
  }, [hotels, selectedHotel, hoveredHotel, handleHotelClick, handleHotelHover, handleClusterClick, viewState.zoom, enableClustering]);

  // Fly to selected hotel with consistent animation timing
  useEffect(() => {
    if (selectedHotel && mapRef.current && !isAnimating) {
      // Clear any existing animation timeout
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
      
      setIsAnimating(true);
      
      // Calculate target zoom level consistently
      const targetZoom = Math.max(viewState.zoom, 14);
      
      mapRef.current.flyTo({
        center: [selectedHotel.longitude, selectedHotel.latitude],
        zoom: targetZoom,
        duration: 900, // Consistent 900ms duration
        essential: true, // Prevent interruption by user interaction
      });
      
      // Reset animation state after completion
      animationTimeoutRef.current = window.setTimeout(() => {
        setIsAnimating(false);
        animationTimeoutRef.current = null;
        // Force map redraw for crisp rendering after animation
        refreshMapDisplay(mapRef);
      }, 950); // Slightly longer than animation duration
    }
  }, [selectedHotel]); // Removed viewState.zoom to prevent re-triggering

  // Cleanup animation timeout on unmount
  useEffect(() => {
    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
    };
  }, []);

  // Cleanup cluster cache on unmount
  useEffect(() => {
    return () => {
      clearClusterCache();
    };
  }, []);

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
        style={{ 
          width: '100%', 
          height: '100%',
          imageRendering: 'crisp-edges',
          transform: 'translateZ(0)', // Force hardware acceleration
          backfaceVisibility: 'hidden' // Improve rendering quality
        }}
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

        {/* Hotel Markers and Clusters */}
        <AnimatePresence>
          {isMapLoaded && markers}
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

export default HotelMap; 