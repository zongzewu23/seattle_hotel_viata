import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, DollarSign, Star, ThumbsUp, Wifi, RotateCcw } from 'lucide-react';
import { cn } from '../../utils/cn';
import type { HotelFilters } from '../../types/index';

// =============================================================================
// TYPES
// =============================================================================

interface ActiveFiltersProps {
  filters: HotelFilters;
  onRemoveFilter: (filterType: string, value?: string) => void;
  onClearAll: () => void;
  className?: string;
}

interface FilterChip {
  id: string;
  type: string;
  label: string;
  icon?: React.ReactNode;
  value?: string;
  color?: string;
}

// =============================================================================
// UTILITIES
// =============================================================================

const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
};

const formatRating = (rating: number): string => {
  return rating.toFixed(1);
};

const getAmenityIcon = (amenity: string): React.ReactNode => {
  const icons: Record<string, React.ReactNode> = {
    'WiFi': <Wifi className="h-3 w-3" />,
    'Parking': <span className="text-xs">🅿️</span>,
    'Gym': <span className="text-xs">🏋️</span>,
    'Pool': <span className="text-xs">🏊</span>,
    'Restaurant': <span className="text-xs">🍽️</span>,
    'Bar': <span className="text-xs">🍸</span>,
    'Spa': <span className="text-xs">🧘</span>,
    'Business Center': <span className="text-xs">💼</span>,
  };
  
  return icons[amenity] || <span className="text-xs">🏨</span>;
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function ActiveFilters({
  filters,
  onRemoveFilter,
  onClearAll,
  className
}: ActiveFiltersProps) {
  // Convert filters to chip objects
  const filterChips = useMemo<FilterChip[]>(() => {
    const chips: FilterChip[] = [];

    // Price range filter
    if (filters.priceRange) {
      chips.push({
        id: 'price',
        type: 'price',
        label: `${formatPrice(filters.priceRange.min)} - ${formatPrice(filters.priceRange.max)}`,
        icon: <DollarSign className="h-3 w-3" />,
        color: 'bg-green-100 text-green-800 border-green-200'
      });
    }

    // Rating range filter
    if (filters.ratingRange) {
      chips.push({
        id: 'rating',
        type: 'rating',
        label: `${formatRating(filters.ratingRange.min)} - ${formatRating(filters.ratingRange.max)} rating`,
        icon: <ThumbsUp className="h-3 w-3" />,
        color: 'bg-blue-100 text-blue-800 border-blue-200'
      });
    }

    // Star rating filter
    if (filters.starRating && filters.starRating.length > 0) {
      const sortedRatings = [...filters.starRating].sort((a, b) => b - a);
      chips.push({
        id: 'star',
        type: 'star',
        label: `${sortedRatings.join(', ')} star${sortedRatings.length > 1 ? 's' : ''}`,
        icon: <Star className="h-3 w-3" />,
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200'
      });
    }

    // Individual amenity filters
    if (filters.amenities && filters.amenities.length > 0) {
      filters.amenities.forEach(amenity => {
        chips.push({
          id: `amenity-${amenity}`,
          type: 'amenity',
          label: amenity,
          icon: getAmenityIcon(amenity),
          value: amenity,
          color: 'bg-purple-100 text-purple-800 border-purple-200'
        });
      });
    }

    // Search query filter
    if (filters.searchQuery && filters.searchQuery.trim()) {
      chips.push({
        id: 'search',
        type: 'search',
        label: `"${filters.searchQuery.trim()}"`,
        icon: <span className="text-xs">🔍</span>,
        color: 'bg-gray-100 text-gray-800 border-gray-200'
      });
    }

    return chips;
  }, [filters]);

  // Animation variants for chips
  const chipVariants = {
    hidden: { opacity: 0, scale: 0.8, x: -20 },
    visible: { opacity: 1, scale: 1, x: 0 },
    exit: { opacity: 0, scale: 0.8, x: -20 }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  // Handle individual filter removal
  const handleRemoveFilter = (chip: FilterChip) => {
    onRemoveFilter(chip.type, chip.value);
  };

  // Don't render if no active filters
  if (filterChips.length === 0) {
    return null;
  }

  return (
    <motion.div
      className={cn("w-full space-y-3", className)}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700">
            Active Filters
          </span>
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
            {filterChips.length}
          </span>
        </div>
        
        <button
          onClick={onClearAll}
          className="flex items-center space-x-1 text-sm text-red-600 hover:text-red-700 transition-colors"
        >
          <RotateCcw className="h-4 w-4" />
          <span>Clear all</span>
        </button>
      </div>

      {/* Filter Chips */}
      <div className="flex flex-wrap gap-2">
        <AnimatePresence mode="popLayout">
          {filterChips.map((chip) => (
            <motion.div
              key={chip.id}
              variants={chipVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ duration: 0.2 }}
              className={cn(
                "flex items-center space-x-2 px-3 py-1.5 rounded-full text-sm border",
                "transition-all duration-200 hover:shadow-sm",
                chip.color || 'bg-gray-100 text-gray-800 border-gray-200'
              )}
            >
              {/* Icon */}
              {chip.icon && (
                <div className="flex-shrink-0">
                  {chip.icon}
                </div>
              )}
              
              {/* Label */}
              <span className="font-medium whitespace-nowrap">
                {chip.label}
              </span>
              
              {/* Remove button */}
              <button
                onClick={() => handleRemoveFilter(chip)}
                className="flex-shrink-0 p-0.5 hover:bg-black/10 rounded-full transition-colors"
                aria-label={`Remove ${chip.label} filter`}
              >
                <X className="h-3 w-3" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Summary */}
      <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded-lg">
        <div className="flex items-center justify-between">
          <span>
            {filterChips.length} {filterChips.length === 1 ? 'filter' : 'filters'} applied
          </span>
          <span className="text-gray-400">
            Click any filter to remove it
          </span>
        </div>
      </div>
    </motion.div>
  );
} 