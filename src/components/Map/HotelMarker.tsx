import React, { useCallback, useMemo } from 'react';
import { Marker } from 'react-map-gl';
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion';
import { MapPin, Star } from 'lucide-react';
import type { Hotel } from '../../types/index';
import { cn } from '../../utils/cn';
import { getHotelMarkerColor } from '../../utils/colorUtils';
import { SimpleRipple, simpleVariants, SIMPLE_TIMINGS } from './WaterDropAnimations';

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
  const prefersReducedMotion = useReducedMotion();

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

  // Simple animation variants
  const animationVariants = useMemo(() => {
    if (prefersReducedMotion) {
      return {
        initial: { scale: 1, opacity: 1 },
        animate: { scale: 1, opacity: 1 },
        exit: { scale: 1, opacity: 1 },
      };
    }

    return {
      initial: { scale: 0.8, opacity: 0 },
      animate: { scale: 1, opacity: 1 },
      exit: { scale: 0.8, opacity: 0 },
    };
  }, [prefersReducedMotion]);

  // Simple hover effects
  const hoverEffects = useMemo(() => {
    if (prefersReducedMotion) return {};
    
    return {
      whileHover: { 
        scale: 1.05,
        transition: { 
          type: "spring" as const, 
          stiffness: 400, 
          damping: 10 
        }
      },
      whileTap: { 
        scale: 0.95,
        transition: { 
          type: "spring" as const, 
          stiffness: 600, 
          damping: 15 
        }
      }
    };
  }, [prefersReducedMotion]);

  return (
    <Marker
      latitude={hotel.latitude}
      longitude={hotel.longitude}
      anchor="bottom"
      onClick={handleClick}
    >
      <motion.div
        className="cursor-pointer relative"
        variants={animationVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        {...hoverEffects}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{ 
          willChange: 'transform',
          transformOrigin: 'center center',
        }}
      >
        {/* Simple ripple effect on interaction */}
        <AnimatePresence>
          {(isSelected || isHovered) && (
            <SimpleRipple
              isActive={true}
              size={markerSize}
              color={markerColor}
              duration={0.6}
            />
          )}
        </AnimatePresence>

        {/* Main marker pin */}
        <div
          className={cn(
            'relative flex items-center justify-center',
            'rounded-full border-3 border-white shadow-lg',
            'transition-all duration-200',
            isSelected && 'shadow-xl',
          )}
          style={{
            width: markerSize,
            height: markerSize,
            backgroundColor: markerColor,
            boxShadow: isSelected 
              ? '0 8px 32px rgba(0, 0, 0, 0.3), 0 0 0 4px rgba(255, 255, 255, 0.4)'
              : isHovered
              ? '0 6px 24px rgba(0, 0, 0, 0.2), 0 0 0 2px rgba(255, 255, 255, 0.3)'
              : '0 4px 16px rgba(0, 0, 0, 0.15)',
          }}
        >
          <MapPin 
            className={cn(
              'text-white transition-all duration-200',
              isSelected ? 'w-5 h-5' : isHovered ? 'w-4 h-4' : 'w-3.5 h-3.5'
            )}
            fill="currentColor"
          />
        </div>

        {/* Rating badge */}
        <motion.div
          className={cn(
            'absolute -top-1 -right-1 z-10',
            'min-w-[20px] h-5 px-1',
            'bg-white rounded-full border-2',
            'flex items-center justify-center',
            'text-xs font-bold shadow-md',
            isSelected && 'min-w-[24px] h-6',
          )}
          style={{ 
            borderColor: markerColor,
            color: markerColor,
          }}
          variants={simpleVariants.badge}
          initial="initial"
          animate="animate"
          transition={{
            delay: SIMPLE_TIMINGS.hotel.appear,
          }}
        >
          <Star className="w-2 h-2 mr-0.5" fill="currentColor" />
          <span className="leading-none text-xs">
            {hotel.rating.toFixed(1)}
          </span>
        </motion.div>

        {/* Selection pulse effect */}
        <AnimatePresence>
          {isSelected && !prefersReducedMotion && (
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-white pointer-events-none"
              style={{
                width: markerSize + 8,
                height: markerSize + 8,
                marginLeft: -4,
                marginTop: -4,
              }}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ 
                scale: [1, 1.2, 1], 
                opacity: [0.8, 0.4, 0.8],
                transition: {
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }
              }}
              exit={{ scale: 0.8, opacity: 0 }}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </Marker>
  );
});

HotelMarker.displayName = 'HotelMarker';

export default HotelMarker; 