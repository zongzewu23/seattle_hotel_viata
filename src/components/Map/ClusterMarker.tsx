import React, { useCallback, useMemo } from 'react';
import { Marker } from 'react-map-gl';
import { motion } from 'framer-motion';
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

  return (
    <Marker
      latitude={cluster.center.latitude}
      longitude={cluster.center.longitude}
      anchor="center"
      onClick={handleClick}
    >
      <motion.div
        className={cn(
          'cursor-pointer transition-all duration-300',
          'hover:scale-110 active:scale-95',
          'relative flex items-center justify-center',
          className
        )}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        {/* Main cluster circle */}
        <motion.div
          className={cn(
            'rounded-full border-3 border-white shadow-lg',
            'flex items-center justify-center',
            'transition-all duration-300',
            'backdrop-blur-sm'
          )}
          style={{
            width: displaySize,
            height: displaySize,
            backgroundColor: clusterColor,
            boxShadow: isHovered 
              ? '0 8px 32px rgba(0, 0, 0, 0.2), 0 0 0 4px rgba(255, 255, 255, 0.3)'
              : '0 4px 16px rgba(0, 0, 0, 0.15)',
          }}
          animate={{
            scale: isHovered ? 1.1 : 1,
          }}
          transition={{ duration: 0.2 }}
        >
          {/* Hotel count */}
          <div className={cn('flex flex-col items-center', textSize)}>
            <Users className="w-3 h-3 text-white mb-0.5" />
            <span className="font-bold text-white leading-none">
              {cluster.count}
            </span>
          </div>
        </motion.div>

        {/* Rating badge */}
        <motion.div
          className={cn(
            'absolute -top-1 -right-1',
            badgeSize,
            'px-1 bg-white rounded-full border-2',
            'flex items-center justify-center',
            'text-xs font-bold shadow-md'
          )}
          style={{ 
            borderColor: clusterColor,
            color: clusterColor,
          }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 400, damping: 20 }}
        >
          <Star className="w-2.5 h-2.5 mr-0.5" fill="currentColor" />
          <span className="leading-none">
            {cluster.avgRating.toFixed(1)}
          </span>
        </motion.div>

        {/* Price range indicator (optional, for large clusters) */}
        {category === 'large' && cluster.priceRange.min !== cluster.priceRange.max && (
          <motion.div
            className={cn(
              'absolute -bottom-1 -left-1',
              'min-w-[36px] h-5 px-1',
              'bg-white rounded-full border-2',
              'flex items-center justify-center',
              'text-xs font-medium shadow-md'
            )}
            style={{ 
              borderColor: clusterColor,
              color: clusterColor,
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 400, damping: 20 }}
          >
            <span className="leading-none">
              ${Math.round(cluster.priceRange.min)}-${Math.round(cluster.priceRange.max)}
            </span>
          </motion.div>
        )}

        {/* Hover effect ring */}
        {isHovered && (
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-white"
            style={{
              width: displaySize + 8,
              height: displaySize + 8,
              marginLeft: -4,
              marginTop: -4,
            }}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.6 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
        )}
      </motion.div>
    </Marker>
  );
});

ClusterMarker.displayName = 'ClusterMarker';

export default ClusterMarker; 