import React, { useRef, useCallback, useMemo } from 'react';
import { Marker } from 'react-map-gl';
import { motion } from 'framer-motion';
import { MapPin } from 'lucide-react';
import type { Hotel } from '../../types/index';
import { cn } from '../../utils/cn';

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

export default HotelMarker; 