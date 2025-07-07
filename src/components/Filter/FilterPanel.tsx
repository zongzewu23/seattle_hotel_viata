import { useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, SlidersHorizontal, RotateCcw } from 'lucide-react';
import { cn } from '../../utils/cn';
import type { Hotel, HotelFilters, Amenity } from '../../types/index';
import { getPriceRange, getRatingRange, getUniqueAmenities, getUniqueStarRatings } from '../../utils/dataProcessor';
import PriceRangeSlider from './PriceRangeSlider';
import AmenitiesFilter from './AmenitiesFilter';
import StarRatingFilter from './StarRatingFilter';
import GuestRatingFilter from './GuestRatingFilter';
import ActiveFilters from './ActiveFilters';

// =============================================================================
// TYPES
// =============================================================================

interface FilterPanelProps {
  isOpen: boolean;
  onClose: () => void;
  hotels: Hotel[];
  filters: HotelFilters;
  onFiltersChange: (filters: HotelFilters) => void;
  filteredHotelsCount: number;
  className?: string;
}

interface FilterMetadata {
  priceRange: { min: number; max: number };
  ratingRange: { min: number; max: number };
  availableAmenities: Amenity[];
  availableStarRatings: number[];
}

// =============================================================================
// ANIMATION VARIANTS
// =============================================================================

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 }
};

const desktopPanelVariants = {
  hidden: { 
    x: -400, 
    opacity: 0
  },
  visible: { 
    x: 0, 
    opacity: 1
  },
  exit: { 
    x: -400, 
    opacity: 0
  }
};

const mobilePanelVariants = {
  hidden: { 
    y: "100%", 
    opacity: 0
  },
  visible: { 
    y: 0, 
    opacity: 1
  },
  exit: { 
    y: "100%", 
    opacity: 0
  }
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function FilterPanel({
  isOpen,
  onClose,
  hotels,
  filters,
  onFiltersChange,
  filteredHotelsCount,
  className
}: FilterPanelProps) {
  // Calculate filter metadata from hotel data
  const filterMetadata = useMemo<FilterMetadata>(() => {
    if (hotels.length === 0) {
      return {
        priceRange: { min: 0, max: 1000 },
        ratingRange: { min: 0, max: 10 },
        availableAmenities: [],
        availableStarRatings: []
      };
    }

    return {
      priceRange: getPriceRange(hotels),
      ratingRange: getRatingRange(hotels),
      availableAmenities: getUniqueAmenities(hotels),
      availableStarRatings: getUniqueStarRatings(hotels)
    };
  }, [hotels]);

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return Boolean(
      filters.priceRange ||
      filters.ratingRange ||
      (filters.starRating && filters.starRating.length > 0) ||
      (filters.amenities && filters.amenities.length > 0) ||
      filters.searchQuery
    );
  }, [filters]);

  // Handle escape key press
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    return () => document.removeEventListener('keydown', handleEscapeKey);
  }, [isOpen, onClose]);

  // Handle backdrop click
  const handleBackdropClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  }, [onClose]);

  // Handle filter changes
  const handlePriceRangeChange = useCallback((priceRange: [number, number]) => {
    onFiltersChange({
      ...filters,
      priceRange: { min: priceRange[0], max: priceRange[1] }
    });
  }, [filters, onFiltersChange]);

  const handleRatingRangeChange = useCallback((ratingRange: [number, number]) => {
    onFiltersChange({
      ...filters,
      ratingRange: { min: ratingRange[0], max: ratingRange[1] }
    });
  }, [filters, onFiltersChange]);

  const handleStarRatingChange = useCallback((starRating: number[]) => {
    onFiltersChange({
      ...filters,
      starRating
    });
  }, [filters, onFiltersChange]);

  const handleAmenitiesChange = useCallback((amenities: Amenity[]) => {
    onFiltersChange({
      ...filters,
      amenities
    });
  }, [filters, onFiltersChange]);

  // Handle clear all filters
  const handleClearAllFilters = useCallback(() => {
    onFiltersChange({});
  }, [onFiltersChange]);

  // Handle individual filter removal
  const handleRemoveFilter = useCallback((filterType: string, value?: string) => {
    const newFilters = { ...filters };
    
    switch (filterType) {
      case 'price':
        delete newFilters.priceRange;
        break;
      case 'rating':
        delete newFilters.ratingRange;
        break;
      case 'star':
        delete newFilters.starRating;
        break;
      case 'amenity':
        if (value && newFilters.amenities) {
          newFilters.amenities = newFilters.amenities.filter(a => a !== value);
          if (newFilters.amenities.length === 0) {
            delete newFilters.amenities;
          }
        }
        break;
      case 'search':
        delete newFilters.searchQuery;
        break;
    }
    
    onFiltersChange(newFilters);
  }, [filters, onFiltersChange]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className={cn("fixed inset-0 z-50", className)}>
          {/* Backdrop */}
          <motion.div
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={handleBackdropClick}
          />

          {/* Desktop Panel */}
          <motion.div
            variants={desktopPanelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="hidden md:flex absolute left-0 top-0 h-full w-[400px] bg-white shadow-2xl"
          >
            <div className="flex flex-col w-full">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <SlidersHorizontal className="h-5 w-5 text-gray-600" />
                  <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="Close filters"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>

              {/* Active Filters */}
              {hasActiveFilters && (
                <div className="p-4 border-b border-gray-200">
                  <ActiveFilters
                    filters={filters}
                    onRemoveFilter={handleRemoveFilter}
                    onClearAll={handleClearAllFilters}
                  />
                </div>
              )}

              {/* Filter Content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {/* Price Range */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-gray-900">Price Range</h3>
                  <PriceRangeSlider
                    min={filterMetadata.priceRange.min}
                    max={filterMetadata.priceRange.max}
                    value={filters.priceRange ? [filters.priceRange.min, filters.priceRange.max] : [filterMetadata.priceRange.min, filterMetadata.priceRange.max]}
                    onChange={handlePriceRangeChange}
                    step={25}
                  />
                </div>

                {/* Star Rating */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-gray-900">Star Rating</h3>
                  <StarRatingFilter
                    availableRatings={filterMetadata.availableStarRatings}
                    selectedRatings={filters.starRating || []}
                    onChange={handleStarRatingChange}
                  />
                </div>

                {/* Guest Rating */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-gray-900">Guest Rating</h3>
                  <GuestRatingFilter
                    min={filterMetadata.ratingRange.min}
                    max={filterMetadata.ratingRange.max}
                    value={filters.ratingRange ? [filters.ratingRange.min, filters.ratingRange.max] : [filterMetadata.ratingRange.min, filterMetadata.ratingRange.max]}
                    onChange={handleRatingRangeChange}
                    step={0.1}
                  />
                </div>

                {/* Amenities */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-gray-900">Amenities</h3>
                  <AmenitiesFilter
                    availableAmenities={filterMetadata.availableAmenities}
                    selectedAmenities={filters.amenities || []}
                    onChange={handleAmenitiesChange}
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-gray-600">
                    {filteredHotelsCount} {filteredHotelsCount === 1 ? 'hotel' : 'hotels'} found
                  </span>
                  {hasActiveFilters && (
                    <button
                      onClick={handleClearAllFilters}
                      className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-700"
                    >
                      <RotateCcw className="h-4 w-4" />
                      <span>Clear all</span>
                    </button>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </motion.div>

          {/* Mobile Panel */}
          <motion.div
            variants={mobilePanelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="md:hidden absolute bottom-0 left-0 right-0 h-[70vh] bg-white rounded-t-xl shadow-2xl"
          >
            <div className="flex flex-col h-full">
              {/* Drag Handle */}
              <div className="flex justify-center py-3">
                <div className="w-10 h-1 bg-gray-300 rounded-full" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-4 pb-3 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <SlidersHorizontal className="h-5 w-5 text-gray-600" />
                  <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="Close filters"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>

              {/* Active Filters */}
              {hasActiveFilters && (
                <div className="px-4 py-3 border-b border-gray-200">
                  <ActiveFilters
                    filters={filters}
                    onRemoveFilter={handleRemoveFilter}
                    onClearAll={handleClearAllFilters}
                  />
                </div>
              )}

              {/* Filter Content - Scrollable */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
                {/* Price Range */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-gray-900">Price Range</h3>
                  <PriceRangeSlider
                    min={filterMetadata.priceRange.min}
                    max={filterMetadata.priceRange.max}
                    value={filters.priceRange ? [filters.priceRange.min, filters.priceRange.max] : [filterMetadata.priceRange.min, filterMetadata.priceRange.max]}
                    onChange={handlePriceRangeChange}
                    step={25}
                  />
                </div>

                {/* Star Rating */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-gray-900">Star Rating</h3>
                  <StarRatingFilter
                    availableRatings={filterMetadata.availableStarRatings}
                    selectedRatings={filters.starRating || []}
                    onChange={handleStarRatingChange}
                  />
                </div>

                {/* Guest Rating */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-gray-900">Guest Rating</h3>
                  <GuestRatingFilter
                    min={filterMetadata.ratingRange.min}
                    max={filterMetadata.ratingRange.max}
                    value={filters.ratingRange ? [filters.ratingRange.min, filters.ratingRange.max] : [filterMetadata.ratingRange.min, filterMetadata.ratingRange.max]}
                    onChange={handleRatingRangeChange}
                    step={0.1}
                  />
                </div>

                {/* Amenities */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-gray-900">Amenities</h3>
                  <AmenitiesFilter
                    availableAmenities={filterMetadata.availableAmenities}
                    selectedAmenities={filters.amenities || []}
                    onChange={handleAmenitiesChange}
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="px-4 py-3 border-t border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-gray-600">
                    {filteredHotelsCount} {filteredHotelsCount === 1 ? 'hotel' : 'hotels'} found
                  </span>
                  {hasActiveFilters && (
                    <button
                      onClick={handleClearAllFilters}
                      className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-700"
                    >
                      <RotateCcw className="h-4 w-4" />
                      <span>Clear all</span>
                    </button>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
} 