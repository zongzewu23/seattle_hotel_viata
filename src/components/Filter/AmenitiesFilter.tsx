import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Check, X, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '../../utils/cn';
import type { Amenity } from '../../types/index';

// =============================================================================
// TYPES
// =============================================================================

interface AmenitiesFilterProps {
  availableAmenities: Amenity[];
  selectedAmenities: Amenity[];
  onChange: (amenities: Amenity[]) => void;
  className?: string;
  disabled?: boolean;
  maxVisible?: number;
}

// =============================================================================
// AMENITY ICONS MAP
// =============================================================================

const amenityIcons: Record<string, string> = {
  'WiFi': '📶',
  'Parking': '🅿️',
  'Gym': '🏋️',
  'Pool': '🏊',
  'Restaurant': '🍽️',
  'Bar': '🍸',
  'Spa': '🧘',
  'Business Center': '💼',
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function AmenitiesFilter({
  availableAmenities,
  selectedAmenities,
  onChange,
  className,
  disabled = false,
  maxVisible = 6
}: AmenitiesFilterProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  // Filter amenities based on search query
  const filteredAmenities = useMemo(() => {
    if (!searchQuery.trim()) {
      return availableAmenities;
    }
    
    const query = searchQuery.toLowerCase();
    return availableAmenities.filter(amenity =>
      amenity.toLowerCase().includes(query)
    );
  }, [availableAmenities, searchQuery]);

  // Determine which amenities to show
  const visibleAmenities = useMemo(() => {
    if (isExpanded || filteredAmenities.length <= maxVisible) {
      return filteredAmenities;
    }
    return filteredAmenities.slice(0, maxVisible);
  }, [filteredAmenities, isExpanded, maxVisible]);

  const hasMoreAmenities = filteredAmenities.length > maxVisible;

  // Handle individual amenity toggle
  const handleAmenityToggle = useCallback((amenity: Amenity) => {
    if (disabled) return;
    
    const isSelected = selectedAmenities.includes(amenity);
    
    if (isSelected) {
      onChange(selectedAmenities.filter(a => a !== amenity));
    } else {
      onChange([...selectedAmenities, amenity]);
    }
  }, [selectedAmenities, onChange, disabled]);

  // Handle select all
  const handleSelectAll = useCallback(() => {
    if (disabled) return;
    onChange(filteredAmenities);
  }, [filteredAmenities, onChange, disabled]);

  // Handle clear all
  const handleClearAll = useCallback(() => {
    if (disabled) return;
    onChange([]);
  }, [onChange, disabled]);

  // Handle search input change
  const handleSearchChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  }, []);

  // Handle search clear
  const handleSearchClear = useCallback(() => {
    setSearchQuery('');
  }, []);

  // Handle expand/collapse
  const handleToggleExpand = useCallback(() => {
    setIsExpanded(!isExpanded);
  }, [isExpanded]);

  const allFilteredSelected = filteredAmenities.length > 0 && 
    filteredAmenities.every(amenity => selectedAmenities.includes(amenity));

  return (
    <div className={cn("w-full space-y-3", className)}>
      {/* Search Bar */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search amenities..."
            disabled={disabled}
            className={cn(
              "w-full pl-10 pr-10 py-2 text-sm border border-gray-300 rounded-lg",
              "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
              "disabled:bg-gray-50 disabled:text-gray-500",
              "transition-colors"
            )}
          />
          {searchQuery && (
            <button
              onClick={handleSearchClear}
              disabled={disabled}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Control Buttons */}
      {filteredAmenities.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={handleSelectAll}
              disabled={disabled || allFilteredSelected}
              className={cn(
                "text-xs text-blue-600 hover:text-blue-700",
                "disabled:text-gray-400 disabled:cursor-not-allowed",
                "transition-colors"
              )}
            >
              Select All
            </button>
            <span className="text-gray-300">•</span>
            <button
              onClick={handleClearAll}
              disabled={disabled || selectedAmenities.length === 0}
              className={cn(
                "text-xs text-blue-600 hover:text-blue-700",
                "disabled:text-gray-400 disabled:cursor-not-allowed",
                "transition-colors"
              )}
            >
              Clear All
            </button>
          </div>
          {selectedAmenities.length > 0 && (
            <span className="text-xs text-gray-500">
              {selectedAmenities.length} selected
            </span>
          )}
        </div>
      )}

      {/* Amenities List */}
      <div className="space-y-2">
        <AnimatePresence>
          {visibleAmenities.map((amenity) => {
            const isSelected = selectedAmenities.includes(amenity);
            const icon = amenityIcons[amenity] || '🏨';
            
            return (
              <motion.div
                key={amenity}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className={cn(
                  "flex items-center space-x-3 p-3 rounded-lg cursor-pointer",
                  "hover:bg-gray-50 transition-colors",
                  isSelected && "bg-blue-50 border border-blue-200",
                  disabled && "cursor-not-allowed opacity-50"
                )}
                onClick={() => handleAmenityToggle(amenity)}
              >
                {/* Custom Checkbox */}
                <div
                  className={cn(
                    "relative flex items-center justify-center w-5 h-5 rounded border-2 transition-all",
                    isSelected
                      ? "bg-blue-600 border-blue-600 text-white"
                      : "border-gray-300 hover:border-gray-400"
                  )}
                >
                  <AnimatePresence>
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ duration: 0.1 }}
                      >
                        <Check className="h-3 w-3" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Amenity Info */}
                <div className="flex items-center space-x-2 flex-1">
                  <span className="text-lg">{icon}</span>
                  <span className="text-sm font-medium text-gray-900">
                    {amenity}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Show More/Less Button */}
      {hasMoreAmenities && (
        <button
          onClick={handleToggleExpand}
          disabled={disabled}
          className={cn(
            "w-full flex items-center justify-center space-x-2 py-2 text-sm",
            "text-blue-600 hover:text-blue-700 transition-colors",
            "disabled:text-gray-400 disabled:cursor-not-allowed"
          )}
        >
          <span>
            {isExpanded 
              ? `Show Less (${filteredAmenities.length - maxVisible} hidden)`
              : `Show More (${filteredAmenities.length - maxVisible} more)`
            }
          </span>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
      )}

      {/* No Results Message */}
      {filteredAmenities.length === 0 && searchQuery && (
        <div className="text-center py-6 text-gray-500">
          <Search className="h-8 w-8 mx-auto mb-2 text-gray-300" />
          <p className="text-sm">No amenities found for "{searchQuery}"</p>
          <button
            onClick={handleSearchClear}
            className="text-sm text-blue-600 hover:text-blue-700 mt-1"
          >
            Clear search
          </button>
        </div>
      )}

      {/* Empty State */}
      {availableAmenities.length === 0 && (
        <div className="text-center py-6 text-gray-500">
          <div className="text-2xl mb-2">🏨</div>
          <p className="text-sm">No amenities available</p>
        </div>
      )}
    </div>
  );
} 