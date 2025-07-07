import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Filter, RotateCcw, Check, Loader2, Eye, EyeOff } from 'lucide-react';
import { cn } from '../../utils/cn';
import type { Hotel, HotelFilters, Amenity } from '../../types/index';
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
  pendingFilters: HotelFilters;
  appliedFilters: HotelFilters;
  originalFilters: HotelFilters;
  onPendingFiltersChange: (filters: HotelFilters) => void;
  onApplyFilters: () => void;
  onClearAllFilters: () => void;
  onResetPendingFilters: () => void;
  onPreview: () => void;
  previewCount: number;
  isApplyingFilters: boolean;
  hasPendingChanges: boolean;
  hasPendingFilters: boolean;
  hasFilterChanges: boolean;
  isPreviewing: boolean;
  showBackdrop: boolean;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const TRANSITION_VARIANTS = {
  desktop: {
    hidden: { x: -400, opacity: 0 },
    visible: { x: 0, opacity: 1 },
    exit: { x: -400, opacity: 0 }
  },
  mobile: {
    hidden: { y: '100%', opacity: 0 },
    visible: { y: 0, opacity: 1 },
    exit: { y: '100%', opacity: 0 }
  }
};

const BACKDROP_VARIANTS = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 }
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function FilterPanel({
  isOpen,
  onClose,
  hotels,
  pendingFilters,
  appliedFilters: _appliedFilters,
  originalFilters: _originalFilters,
  onPendingFiltersChange,
  onApplyFilters,
  onClearAllFilters,
  onResetPendingFilters,
  onPreview,
  previewCount,
  isApplyingFilters,
  hasPendingChanges,
  hasPendingFilters,
  hasFilterChanges,
  isPreviewing,
  showBackdrop
}: FilterPanelProps) {
  // Calculate price range from hotel data
  const priceRange = React.useMemo(() => {
    if (hotels.length === 0) return { min: 0, max: 1000 };
    
    return hotels.reduce(
      (range, hotel) => {
        const price = typeof hotel.price_per_night === 'number' 
          ? hotel.price_per_night 
          : parseFloat(hotel.price_per_night.toString()) || 0;
        return {
          min: Math.min(range.min, price),
          max: Math.max(range.max, price)
        };
      },
      { min: Infinity, max: -Infinity }
    );
  }, [hotels]);

  // Get unique amenities from all hotels
  const allAmenities = React.useMemo(() => {
    const amenitySet = new Set<string>();
    hotels.forEach(hotel => {
      hotel.amenities.forEach(amenity => {
        amenitySet.add(amenity);
      });
    });
    return Array.from(amenitySet).sort();
  }, [hotels]);

  // Filter update handlers
  const handlePriceRangeChange = React.useCallback((range: [number, number]) => {
    onPendingFiltersChange({
      ...pendingFilters,
      priceRange: { min: range[0], max: range[1] }
    });
  }, [pendingFilters, onPendingFiltersChange]);

  const handleStarRatingChange = React.useCallback((ratings: number[]) => {
    onPendingFiltersChange({
      ...pendingFilters,
      starRating: ratings
    });
  }, [pendingFilters, onPendingFiltersChange]);

  const handleGuestRatingChange = React.useCallback((range: [number, number]) => {
    onPendingFiltersChange({
      ...pendingFilters,
      ratingRange: { min: range[0], max: range[1] }
    });
  }, [pendingFilters, onPendingFiltersChange]);

  const handleAmenitiesChange = React.useCallback((amenities: string[]) => {
    onPendingFiltersChange({
      ...pendingFilters,
      amenities: amenities as Amenity[]
    });
  }, [pendingFilters, onPendingFiltersChange]);

  const handleRemoveFilter = React.useCallback((filterType: string, value?: string | number) => {
    const newFilters = { ...pendingFilters };
    
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
      default:
        break;
    }
    
    onPendingFiltersChange(newFilters);
  }, [pendingFilters, onPendingFiltersChange]);

  const handleClearPendingFilters = React.useCallback(() => {
    onPendingFiltersChange({});
  }, [onPendingFiltersChange]);

  // Convert filter values for component consumption
  const priceRangeValue: [number, number] = React.useMemo(() => {
    if (pendingFilters.priceRange) {
      return [pendingFilters.priceRange.min, pendingFilters.priceRange.max];
    }
    return [priceRange.min, priceRange.max];
  }, [pendingFilters.priceRange, priceRange]);

  const ratingRangeValue: [number, number] = React.useMemo(() => {
    if (pendingFilters.ratingRange) {
      return [pendingFilters.ratingRange.min, pendingFilters.ratingRange.max];
    }
    return [0, 10];
  }, [pendingFilters.ratingRange]);

  const amenitiesValue: string[] = React.useMemo(() => {
    return pendingFilters.amenities || [];
  }, [pendingFilters.amenities]);

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <>
          {/* Backdrop - Conditional based on showBackdrop prop */}
          {showBackdrop && (
            <motion.div
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
              variants={BACKDROP_VARIANTS}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ duration: 0.2 }}
              onClick={onClose}
            />
          )}

          {/* Filter Panel */}
          <motion.div
            className={cn(
              "fixed z-50 bg-white shadow-xl",
              // Desktop: Left side panel
              "md:left-0 md:top-0 md:h-full md:w-[400px] md:border-r",
              // Mobile: Bottom drawer
              "left-0 right-0 bottom-0 md:right-auto md:bottom-auto",
              "max-h-[70vh] md:max-h-none rounded-t-2xl md:rounded-none",
              "flex flex-col"
            )}
            variants={{
              hidden: window.innerWidth >= 768 ? TRANSITION_VARIANTS.desktop.hidden : TRANSITION_VARIANTS.mobile.hidden,
              visible: window.innerWidth >= 768 ? TRANSITION_VARIANTS.desktop.visible : TRANSITION_VARIANTS.mobile.visible,
              exit: window.innerWidth >= 768 ? TRANSITION_VARIANTS.desktop.exit : TRANSITION_VARIANTS.mobile.exit
            }}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ 
              type: "spring", 
              damping: 25, 
              stiffness: 300,
              duration: 0.3
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white">
              <div className="flex items-center space-x-3">
                <Filter className="h-5 w-5 text-gray-700" />
                <h2 className="text-lg font-semibold text-gray-900">
                  Filter Hotels
                </h2>
                {isPreviewing && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                    Preview Mode
                  </span>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Close filter panel"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* Active Filters */}
              <ActiveFilters 
                filters={pendingFilters}
                onRemoveFilter={handleRemoveFilter}
                onClearAll={handleClearPendingFilters}
              />

              {/* Price Range */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-gray-900">
                  Price Range
                </h3>
                <PriceRangeSlider
                  min={priceRange.min}
                  max={priceRange.max}
                  step={25}
                  value={priceRangeValue}
                  onChange={handlePriceRangeChange}
                />
              </div>

              {/* Star Rating */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-gray-900">
                  Star Rating
                </h3>
                <StarRatingFilter
                  availableRatings={[1, 2, 3, 4, 5]}
                  selectedRatings={pendingFilters.starRating || []}
                  onChange={handleStarRatingChange}
                />
              </div>

              {/* Guest Rating */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-gray-900">
                  Guest Rating
                </h3>
                <GuestRatingFilter
                  min={0}
                  max={10}
                  step={0.1}
                  value={ratingRangeValue}
                  onChange={handleGuestRatingChange}
                />
              </div>

              {/* Amenities */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-gray-900">
                  Amenities
                </h3>
                <AmenitiesFilter
                  availableAmenities={allAmenities as Amenity[]}
                  selectedAmenities={amenitiesValue as Amenity[]}
                  onChange={handleAmenitiesChange}
                />
              </div>

              {/* Filter Count Display */}
              <div className={cn(
                "border rounded-lg p-4 transition-colors",
                isPreviewing ? "bg-blue-50 border-blue-200" : "bg-gray-50 border-gray-200"
              )}>
                <div className="flex items-center justify-between">
                  <span className={cn(
                    "text-sm font-medium",
                    isPreviewing ? "text-blue-700" : "text-gray-700"
                  )}>
                    {isPreviewing ? (
                      `Showing ${previewCount} hotels`
                    ) : (
                      hasPendingChanges ? `Will show ${previewCount} hotels` : `Showing ${previewCount} hotels`
                    )}
                  </span>
                  {!isPreviewing && hasPendingChanges && (
                    <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
                      Pending
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Footer with Action Buttons */}
            <div className="border-t border-gray-200 p-6 bg-gray-50">
              {/* Preview Button Row */}
              {hasFilterChanges && (
                <div className="mb-3">
                  <button
                    type="button"
                    onClick={onPreview}
                    disabled={!hasFilterChanges}
                    className={cn(
                      "w-full flex items-center justify-center px-4 py-2.5 text-sm font-medium",
                      "border rounded-lg transition-colors",
                      isPreviewing 
                        ? "border-blue-600 bg-blue-50 text-blue-700 hover:bg-blue-100" 
                        : "border-blue-600 text-blue-600 hover:bg-blue-50",
                      !hasFilterChanges && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    {isPreviewing ? (
                      <>
                        <EyeOff className="h-4 w-4 mr-2" />
                        Hide Preview
                      </>
                    ) : (
                      <>
                        <Eye className="h-4 w-4 mr-2" />
                        Preview ({previewCount} hotels)
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Main Action Buttons */}
              <div className="flex space-x-3">
                {/* Clear All Button */}
                <button
                  onClick={onClearAllFilters}
                  disabled={!hasPendingFilters}
                  className={cn(
                    "flex-1 flex items-center justify-center px-4 py-2.5 text-sm font-medium",
                    "border border-gray-300 rounded-lg transition-colors",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    "hover:bg-gray-100 disabled:hover:bg-gray-50"
                  )}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Clear All
                </button>

                {/* Apply Filters Button */}
                <button
                  onClick={onApplyFilters}
                  disabled={!hasPendingChanges || isApplyingFilters}
                  className={cn(
                    "flex-1 flex items-center justify-center px-4 py-2.5 text-sm font-medium",
                    "bg-blue-600 text-white rounded-lg transition-colors",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    "hover:bg-blue-700 disabled:hover:bg-blue-600"
                  )}
                >
                  {isApplyingFilters ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Applying...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Apply Filters
                    </>
                  )}
                </button>
              </div>
              
              {/* Reset to Applied Filters */}
              {hasPendingChanges && !isPreviewing && (
                <button
                  onClick={onResetPendingFilters}
                  className="w-full mt-2 text-xs text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Reset to applied filters
                </button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
} 