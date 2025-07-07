import React, { useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Check } from 'lucide-react';
import { cn } from '../../utils/cn';

// =============================================================================
// TYPES
// =============================================================================

interface StarRatingFilterProps {
  availableRatings: number[];
  selectedRatings: number[];
  onChange: (ratings: number[]) => void;
  className?: string;
  disabled?: boolean;
}

// =============================================================================
// UTILITIES
// =============================================================================

const renderStars = (rating: number, size: 'sm' | 'md' = 'sm') => {
  const stars = [];
  const starSize = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';
  
  for (let i = 1; i <= 5; i++) {
    stars.push(
      <Star
        key={i}
        className={cn(
          starSize,
          i <= rating 
            ? 'text-yellow-400 fill-yellow-400' 
            : 'text-gray-300 fill-gray-300'
        )}
      />
    );
  }
  
  return stars;
};

const getRatingLabel = (rating: number): string => {
  const labels: Record<number, string> = {
    1: 'Basic',
    2: 'Good',
    3: 'Very Good',
    4: 'Excellent',
    5: 'Luxury'
  };
  return labels[rating] || `${rating} Star`;
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function StarRatingFilter({
  availableRatings,
  selectedRatings,
  onChange,
  className,
  disabled = false
}: StarRatingFilterProps) {
  // Sort ratings in descending order (5 stars first)
  const sortedRatings = [...availableRatings].sort((a, b) => b - a);

  // Handle rating toggle
  const handleRatingToggle = useCallback((rating: number) => {
    if (disabled) return;
    
    const isSelected = selectedRatings.includes(rating);
    
    if (isSelected) {
      onChange(selectedRatings.filter(r => r !== rating));
    } else {
      onChange([...selectedRatings, rating]);
    }
  }, [selectedRatings, onChange, disabled]);

  // Handle select all
  const handleSelectAll = useCallback(() => {
    if (disabled) return;
    onChange(sortedRatings);
  }, [sortedRatings, onChange, disabled]);

  // Handle clear all
  const handleClearAll = useCallback(() => {
    if (disabled) return;
    onChange([]);
  }, [onChange, disabled]);

  const allSelected = sortedRatings.length > 0 && 
    sortedRatings.every(rating => selectedRatings.includes(rating));

  return (
    <div className={cn("w-full space-y-3", className)}>
      {/* Control Buttons */}
      {sortedRatings.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={handleSelectAll}
              disabled={disabled || allSelected}
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
              disabled={disabled || selectedRatings.length === 0}
              className={cn(
                "text-xs text-blue-600 hover:text-blue-700",
                "disabled:text-gray-400 disabled:cursor-not-allowed",
                "transition-colors"
              )}
            >
              Clear All
            </button>
          </div>
          {selectedRatings.length > 0 && (
            <span className="text-xs text-gray-500">
              {selectedRatings.length} selected
            </span>
          )}
        </div>
      )}

      {/* Rating Options */}
      <div className="space-y-2">
        {sortedRatings.map((rating) => {
          const isSelected = selectedRatings.includes(rating);
          const label = getRatingLabel(rating);
          
          return (
            <motion.div
              key={rating}
              className={cn(
                "flex items-center space-x-3 p-3 rounded-lg cursor-pointer",
                "hover:bg-gray-50 transition-colors",
                isSelected && "bg-blue-50 border border-blue-200",
                disabled && "cursor-not-allowed opacity-50"
              )}
              onClick={() => handleRatingToggle(rating)}
              whileHover={{ scale: disabled ? 1 : 1.02 }}
              whileTap={{ scale: disabled ? 1 : 0.98 }}
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

              {/* Rating Display */}
              <div className="flex items-center space-x-3 flex-1">
                {/* Stars */}
                <div className="flex items-center space-x-1">
                  {renderStars(rating)}
                </div>
                
                {/* Label */}
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-900">
                    {rating} Star{rating !== 1 ? 's' : ''}
                  </span>
                  <span className="text-xs text-gray-500">
                    {label}
                  </span>
                </div>
              </div>

              {/* Rating Badge */}
              <div className={cn(
                "flex items-center justify-center w-8 h-8 rounded-full text-xs font-semibold",
                "bg-gray-100 text-gray-700"
              )}>
                {rating}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Empty State */}
      {sortedRatings.length === 0 && (
        <div className="text-center py-6 text-gray-500">
          <div className="flex justify-center mb-2">
            {renderStars(0, 'md')}
          </div>
          <p className="text-sm">No star ratings available</p>
        </div>
      )}

      {/* Selected Summary */}
      {selectedRatings.length > 0 && (
        <div className="pt-3 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-900">
              Selected Star Ratings:
            </span>
            <div className="flex items-center space-x-1">
              {[...selectedRatings].sort((a, b) => b - a).map((rating, index) => (
                <React.Fragment key={rating}>
                  {index > 0 && (
                    <span className="text-gray-400 text-sm">•</span>
                  )}
                  <div className="flex items-center space-x-1">
                    <span className="text-sm font-medium text-gray-700">
                      {rating}
                    </span>
                    <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                  </div>
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 