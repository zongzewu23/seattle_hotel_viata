import React, { useRef, useCallback, useMemo, useEffect } from 'react';
import { Marker } from 'react-map-gl';
import { motion } from 'framer-motion';
import { MapPin } from 'lucide-react';
import type { Hotel } from '../../types/index';
import { cn } from '../../utils/cn';
import { getHotelMarkerColor } from '../../utils/colorUtils';

// =============================================================================
// INTERFACES
// =============================================================================

export interface HotelMarkerProps {
  hotel: Hotel;
  isSelected: boolean;
  isHovered: boolean;
  onClick: (hotel: Hotel) => void;
  onHover: (hotel: Hotel | null) => void;
}

// =============================================================================
// HOTEL MARKER COMPONENT
// =============================================================================

export const HotelMarker = React.memo<HotelMarkerProps>(({
  hotel,
  isSelected,
  isHovered,
  onClick,
  onHover,
}) => {
  const markerRef = useRef<HTMLDivElement>(null);

  // Debug logging for positioning and color issues
  useEffect(() => {
    if (import.meta.env.DEV) {
      const currentColor = getHotelMarkerColor(hotel.rating, isSelected, isHovered);
      
      if (isSelected) {
        console.log('🎯 Selected marker debug:', {
          hotel: hotel.name,
          rating: hotel.rating,
          color: currentColor,
          latitude: hotel.latitude,
          longitude: hotel.longitude,
        });
      }
      
      // Log color assignment for verification (only once per hotel)
      if (!isSelected && !isHovered) {
        console.log('🎨 Marker color debug:', {
          hotel: hotel.name,
          rating: hotel.rating,
          color: currentColor,
          category: hotel.rating >= 8.5 ? 'high' : hotel.rating >= 7.0 ? 'medium' : 'low',
        });
      }
    }
  }, [isSelected, hotel, isHovered]);

  const handleClick = useCallback((e: any) => {
    e.originalEvent?.stopPropagation();
    onClick(hotel);
  }, [hotel, onClick]);

  const handleMouseEnter = useCallback(() => {
    onHover(hotel);
  }, [hotel, onHover]);

  const handleMouseLeave = useCallback(() => {
    onHover(null);
  }, [onHover]);

  const markerColor = useMemo(() => {
    return getHotelMarkerColor(hotel.rating, isSelected, isHovered);
  }, [hotel.rating, isSelected, isHovered]);

  const markerSize = useMemo(() => {
    if (isSelected) return 40;
    if (isHovered) return 36;
    return 32;
  }, [isSelected, isHovered]);

  // Debug lifecycle for animation jitter investigation
  if (import.meta.env.DEV) {
    console.log('🎯 Hotel marker lifecycle:', {
      hotelId: hotel.hotel_id,
      hotelName: hotel.name,
      action: 'render',
      isSelected,
      isHovered,
      timestamp: Date.now()
    });
  }

  return (
    <Marker
      latitude={hotel.latitude}
      longitude={hotel.longitude}
      anchor="center"
      onClick={handleClick}
    >
      <motion.div
        ref={markerRef}
        className={cn(
          'cursor-pointer',
          isSelected && 'z-10',
          isHovered && 'z-20'
        )}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ 
          type: 'tween', 
          duration: 0.2, 
          ease: 'easeOut' 
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <div
          className={cn(
            'relative flex items-center justify-center',
            'rounded-full border-2 border-white shadow-lg'
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

export default HotelMarker; 