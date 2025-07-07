import React, { useCallback, useMemo } from 'react';
import { Marker } from 'react-map-gl';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Users, Star } from 'lucide-react';
import type { HotelCluster } from '../../types/index';
import { cn } from '../../utils/cn';
import { getClusterColor } from '../../utils/colorUtils';
import { getClusterSize } from '../../utils/clusteringUtils';

// =============================================================================
// INTERFACES
// =============================================================================

export interface ClusterMarkerProps {
  cluster: HotelCluster;
  onClusterClick: (cluster: HotelCluster) => void;
  isHovered?: boolean;
  className?: string;
}

// =============================================================================
// CLUSTER MARKER COMPONENT
// =============================================================================

export const ClusterMarker = React.memo<ClusterMarkerProps>(({
  cluster,
  onClusterClick,
  isHovered = false,
  className,
}) => {
  const prefersReducedMotion = useReducedMotion();

  const handleClick = useCallback((e: any) => {
    e.originalEvent?.stopPropagation();
    onClusterClick(cluster);
  }, [cluster, onClusterClick]);

  const clusterColor = useMemo(() => getClusterColor(cluster.avgRating), [cluster.avgRating]);
  const { size, category } = useMemo(() => getClusterSize(cluster.count), [cluster.count]);

  const displaySize = useMemo(() => {
    if (isHovered) return size + 8;
    return size;
  }, [size, isHovered]);

  const textSize = useMemo(() => {
    if (category === 'large') return 'text-sm';
    if (category === 'medium') return 'text-xs';
    return 'text-xs';
  }, [category]);

  const badgeSize = useMemo(() => {
    if (category === 'large') return 'min-w-[28px] h-7';
    if (category === 'medium') return 'min-w-[24px] h-6';
    return 'min-w-[20px] h-5';
  }, [category]);

  // Simple animation variants
  const clusterVariants = useMemo(() => {
    if (prefersReducedMotion) {
      return {
        initial: { scale: 1, opacity: 1 },
        animate: { scale: 1, opacity: 1 },
        exit: { scale: 1, opacity: 1 },
      };
    }

    return {
      initial: { scale: 0, opacity: 0 },
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
      latitude={cluster.center.latitude}
      longitude={cluster.center.longitude}
      anchor="center"
      onClick={handleClick}
    >
      <motion.div
        className={cn(
          'cursor-pointer',
          'relative flex items-center justify-center',
          className
        )}
        variants={clusterVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        {...hoverEffects}
        style={{ 
          willChange: 'transform',
          transformOrigin: 'center center',
        }}
      >
        {/* Simple cluster circle */}
        <div
          className={cn(
            'rounded-full border-3 border-white shadow-lg',
            'flex items-center justify-center',
            'backdrop-blur-sm relative z-10'
          )}
          style={{
            width: displaySize,
            height: displaySize,
            backgroundColor: clusterColor,
            boxShadow: isHovered 
              ? '0 8px 32px rgba(0, 0, 0, 0.2), 0 0 0 4px rgba(255, 255, 255, 0.3)'
              : '0 4px 16px rgba(0, 0, 0, 0.15)',
          }}
        />

        {/* Content overlay */}
        <div className="absolute inset-0 flex items-center justify-center z-20">
          <div className={cn('flex flex-col items-center', textSize)}>
            <Users className="w-3 h-3 text-white mb-0.5" />
            <span className="font-bold text-white leading-none">
              {cluster.count}
            </span>
          </div>
        </div>

        {/* ✅ PRESERVED: Beloved elastic rating badge rotation */}
        <motion.div
          className={cn(
            'absolute -top-1 -right-1 z-30',
            badgeSize,
            'px-1 bg-white rounded-full border-2',
            'flex items-center justify-center',
            'text-xs font-bold shadow-md'
          )}
          style={{ 
            borderColor: clusterColor,
            color: clusterColor,
          }}
          initial={{ scale: 0, rotate: -180 }}
          animate={{ 
            scale: 1, 
            rotate: 0,
            transition: { 
              type: "spring" as const, 
              stiffness: 300, 
              damping: 15,
              delay: 0.1
            }
          }}
          whileHover={prefersReducedMotion ? {} : { 
            scale: 1.1,
            transition: { type: "spring" as const, stiffness: 400, damping: 10 }
          }}
        >
          <Star className="w-2.5 h-2.5 mr-0.5" fill="currentColor" />
          <span className="leading-none">
            {cluster.avgRating.toFixed(1)}
          </span>
        </motion.div>

        {/* Price range indicator for large clusters */}
        {category === 'large' && cluster.priceRange.min !== cluster.priceRange.max && (
          <motion.div
            className={cn(
              'absolute -bottom-1 -left-1 z-30',
              'min-w-[36px] h-5 px-1',
              'bg-white rounded-full border-2',
              'flex items-center justify-center',
              'text-xs font-medium shadow-md'
            )}
            style={{ 
              borderColor: clusterColor,
              color: clusterColor,
            }}
            initial={{ scale: 0, y: 10 }}
            animate={{ 
              scale: 1, 
              y: 0,
              transition: { 
                type: "spring" as const, 
                stiffness: 300, 
                damping: 15,
                delay: 0.15
              }
            }}
            whileHover={prefersReducedMotion ? {} : { 
              scale: 1.05,
              transition: { type: "spring" as const, stiffness: 400, damping: 10 }
            }}
          >
            <span className="leading-none">
              ${Math.round(cluster.priceRange.min)}-${Math.round(cluster.priceRange.max)}
            </span>
          </motion.div>
        )}

        {/* Simple hover effect ring */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-white pointer-events-none z-10"
              style={{
                width: displaySize + 8,
                height: displaySize + 8,
                marginLeft: -4,
                marginTop: -4,
              }}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ 
                scale: 1, 
                opacity: 0.6,
                transition: { 
                  type: "spring" as const, 
                  stiffness: 300, 
                  damping: 20 
                }
              }}
              exit={{ 
                scale: 1.2, 
                opacity: 0,
                transition: { duration: 0.2 }
              }}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </Marker>
  );
});

ClusterMarker.displayName = 'ClusterMarker';

export default ClusterMarker; 