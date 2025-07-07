import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ThumbsUp, Star } from 'lucide-react';
import { cn } from '../../utils/cn';

// =============================================================================
// TYPES
// =============================================================================

interface GuestRatingFilterProps {
  min: number;
  max: number;
  step: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
  className?: string;
  disabled?: boolean;
}

// =============================================================================
// UTILITIES
// =============================================================================

const formatRating = (rating: number): string => {
  return rating.toFixed(1);
};

const getRatingLabel = (rating: number): string => {
  if (rating >= 9.0) return 'Exceptional';
  if (rating >= 8.0) return 'Excellent';
  if (rating >= 7.0) return 'Very Good';
  if (rating >= 6.0) return 'Good';
  if (rating >= 5.0) return 'Average';
  return 'Below Average';
};

const getRatingColor = (rating: number): string => {
  if (rating >= 9.0) return 'text-green-600';
  if (rating >= 8.0) return 'text-blue-600';
  if (rating >= 7.0) return 'text-indigo-600';
  if (rating >= 6.0) return 'text-purple-600';
  if (rating >= 5.0) return 'text-yellow-600';
  return 'text-red-600';
};

const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function GuestRatingFilter({
  min,
  max,
  step,
  value,
  onChange,
  className,
  disabled = false
}: GuestRatingFilterProps) {
  const [isDragging, setIsDragging] = useState<'min' | 'max' | null>(null);
  const [inputValues, setInputValues] = useState<[string, string]>([
    formatRating(value[0]),
    formatRating(value[1])
  ]);
  const sliderRef = useRef<HTMLDivElement>(null);

  // Update input values when prop values change
  useEffect(() => {
    setInputValues([formatRating(value[0]), formatRating(value[1])]);
  }, [value]);

  // Calculate percentage positions for the slider
  const getPercentage = useCallback((val: number): number => {
    return ((val - min) / (max - min)) * 100;
  }, [min, max]);

  const leftPercentage = getPercentage(value[0]);
  const rightPercentage = getPercentage(value[1]);

  // Handle slider drag
  const handleMouseDown = useCallback((thumb: 'min' | 'max') => (event: React.MouseEvent) => {
    if (disabled) return;
    
    event.preventDefault();
    setIsDragging(thumb);
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!sliderRef.current) return;
      
      const rect = sliderRef.current.getBoundingClientRect();
      const percentage = clamp(
        ((e.clientX - rect.left) / rect.width) * 100,
        0,
        100
      );
      
      const newValue = (percentage / 100) * (max - min) + min;
      const steppedValue = Math.round(newValue / step) * step;
      
      if (thumb === 'min') {
        const newMin = clamp(steppedValue, min, value[1] - step);
        onChange([newMin, value[1]]);
      } else {
        const newMax = clamp(steppedValue, value[0] + step, max);
        onChange([value[0], newMax]);
      }
    };
    
    const handleMouseUp = () => {
      setIsDragging(null);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [disabled, min, max, step, value, onChange]);

  // Handle input changes
  const handleInputChange = useCallback((index: 0 | 1, inputValue: string) => {
    const newInputValues: [string, string] = [...inputValues];
    newInputValues[index] = inputValue;
    setInputValues(newInputValues);
    
    // Parse and validate the input
    const numValue = parseFloat(inputValue);
    if (isNaN(numValue)) return;
    
    const steppedValue = Math.round(numValue / step) * step;
    const newValue: [number, number] = [...value];
    
    if (index === 0) {
      newValue[0] = clamp(steppedValue, min, value[1] - step);
    } else {
      newValue[1] = clamp(steppedValue, value[0] + step, max);
    }
    
    onChange(newValue);
  }, [inputValues, value, min, max, step, onChange]);

  // Handle input blur (format the display value)
  const handleInputBlur = useCallback((index: 0 | 1) => {
    const newInputValues: [string, string] = [...inputValues];
    newInputValues[index] = formatRating(value[index]);
    setInputValues(newInputValues);
  }, [inputValues, value]);

  // Handle track click
  const handleTrackClick = useCallback((event: React.MouseEvent) => {
    if (disabled || !sliderRef.current) return;
    
    const rect = sliderRef.current.getBoundingClientRect();
    const percentage = ((event.clientX - rect.left) / rect.width) * 100;
    const clickValue = (percentage / 100) * (max - min) + min;
    const steppedValue = Math.round(clickValue / step) * step;
    
    // Determine which thumb is closer and update accordingly
    const distanceToMin = Math.abs(clickValue - value[0]);
    const distanceToMax = Math.abs(clickValue - value[1]);
    
    if (distanceToMin < distanceToMax) {
      const newMin = clamp(steppedValue, min, value[1] - step);
      onChange([newMin, value[1]]);
    } else {
      const newMax = clamp(steppedValue, value[0] + step, max);
      onChange([value[0], newMax]);
    }
  }, [disabled, min, max, step, value, onChange]);

  // Get gradient colors for the slider track
  const getGradientColors = useCallback(() => {
    const colors = [];
    const steps = 10;
    
    for (let i = 0; i <= steps; i++) {
      const rating = min + (i / steps) * (max - min);
      if (rating >= 9.0) colors.push('#10b981'); // green
      else if (rating >= 8.0) colors.push('#3b82f6'); // blue
      else if (rating >= 7.0) colors.push('#6366f1'); // indigo
      else if (rating >= 6.0) colors.push('#8b5cf6'); // purple
      else if (rating >= 5.0) colors.push('#eab308'); // yellow
      else colors.push('#ef4444'); // red
    }
    
    return colors;
  }, [min, max]);

  const gradientColors = getGradientColors();

  return (
    <div className={cn("w-full space-y-4", className)}>
      {/* Input Fields */}
      <div className="flex items-center space-x-3">
        <div className="flex-1">
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Minimum Rating
          </label>
          <div className="relative">
            <ThumbsUp className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={inputValues[0]}
              onChange={(e) => handleInputChange(0, e.target.value)}
              onBlur={() => handleInputBlur(0)}
              disabled={disabled}
              className={cn(
                "w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-lg",
                "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                "disabled:bg-gray-50 disabled:text-gray-500",
                "transition-colors"
              )}
              placeholder="6.0"
            />
          </div>
        </div>
        
        <div className="flex-shrink-0 text-gray-400 mt-5">
          <span className="text-sm">to</span>
        </div>
        
        <div className="flex-1">
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Maximum Rating
          </label>
          <div className="relative">
            <Star className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={inputValues[1]}
              onChange={(e) => handleInputChange(1, e.target.value)}
              onBlur={() => handleInputBlur(1)}
              disabled={disabled}
              className={cn(
                "w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-lg",
                "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                "disabled:bg-gray-50 disabled:text-gray-500",
                "transition-colors"
              )}
              placeholder="10.0"
            />
          </div>
        </div>
      </div>

      {/* Slider Track */}
      <div className="relative pt-6 pb-2">
        <div
          ref={sliderRef}
          className={cn(
            "relative h-3 rounded-full cursor-pointer",
            disabled && "cursor-not-allowed opacity-50"
          )}
          onClick={handleTrackClick}
          style={{
            background: `linear-gradient(to right, ${gradientColors.join(', ')})`
          }}
        >
          {/* Inactive regions */}
          <div
            className="absolute h-3 bg-gray-200 rounded-full"
            style={{
              left: 0,
              width: `${leftPercentage}%`
            }}
          />
          <div
            className="absolute h-3 bg-gray-200 rounded-full"
            style={{
              left: `${rightPercentage}%`,
              width: `${100 - rightPercentage}%`
            }}
          />
          
          {/* Min thumb */}
          <motion.div
            className={cn(
              "absolute top-1/2 w-6 h-6 bg-white border-2 border-gray-800 rounded-full",
              "transform -translate-y-1/2 cursor-grab shadow-lg",
              isDragging === 'min' && "cursor-grabbing shadow-xl scale-110",
              disabled && "cursor-not-allowed opacity-50"
            )}
            style={{ left: `${leftPercentage}%` }}
            onMouseDown={handleMouseDown('min')}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            animate={{
              scale: isDragging === 'min' ? 1.1 : 1,
              transition: { duration: 0.1 }
            }}
          >
            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2">
              <div className="bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                {formatRating(value[0])}
              </div>
            </div>
          </motion.div>
          
          {/* Max thumb */}
          <motion.div
            className={cn(
              "absolute top-1/2 w-6 h-6 bg-white border-2 border-gray-800 rounded-full",
              "transform -translate-y-1/2 cursor-grab shadow-lg",
              isDragging === 'max' && "cursor-grabbing shadow-xl scale-110",
              disabled && "cursor-not-allowed opacity-50"
            )}
            style={{ left: `${rightPercentage}%` }}
            onMouseDown={handleMouseDown('max')}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            animate={{
              scale: isDragging === 'max' ? 1.1 : 1,
              transition: { duration: 0.1 }
            }}
          >
            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2">
              <div className="bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                {formatRating(value[1])}
              </div>
            </div>
          </motion.div>
        </div>
        
        {/* Value labels */}
        <div className="flex justify-between text-xs text-gray-500 mt-2">
          <span>{formatRating(min)}</span>
          <span>{formatRating(max)}</span>
        </div>
      </div>

      {/* Current selection display */}
      <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
        <div className="flex items-center space-x-2">
          <ThumbsUp className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">
            Selected Range:
          </span>
        </div>
        <div className="flex items-center space-x-1">
          <span className={cn("text-sm font-semibold", getRatingColor(value[0]))}>
            {formatRating(value[0])}
          </span>
          <span className="text-gray-400">-</span>
          <span className={cn("text-sm font-semibold", getRatingColor(value[1]))}>
            {formatRating(value[1])}
          </span>
        </div>
      </div>

      {/* Rating descriptions */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="p-2 bg-gray-50 rounded">
          <div className="flex items-center space-x-2">
            <span className={cn("font-medium", getRatingColor(value[0]))}>
              {formatRating(value[0])}
            </span>
            <span className="text-gray-600">
              {getRatingLabel(value[0])}
            </span>
          </div>
        </div>
        <div className="p-2 bg-gray-50 rounded">
          <div className="flex items-center space-x-2">
            <span className={cn("font-medium", getRatingColor(value[1]))}>
              {formatRating(value[1])}
            </span>
            <span className="text-gray-600">
              {getRatingLabel(value[1])}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
} 