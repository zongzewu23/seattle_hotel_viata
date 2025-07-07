import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { DollarSign } from 'lucide-react';
import { cn } from '../../utils/cn';

// =============================================================================
// TYPES
// =============================================================================

interface PriceRangeSliderProps {
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

const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
};

const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

const parsePrice = (priceString: string): number => {
  // Remove all non-numeric characters except decimal point
  const cleanedString = priceString.replace(/[^0-9.]/g, '');
  const parsed = parseFloat(cleanedString);
  return isNaN(parsed) ? 0 : parsed;
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function PriceRangeSlider({
  min,
  max,
  step,
  value,
  onChange,
  className,
  disabled = false
}: PriceRangeSliderProps) {
  const [isDragging, setIsDragging] = useState<'min' | 'max' | null>(null);
  
  // Separate state for input display strings and actual values
  const [inputState, setInputState] = useState({
    minInput: value[0].toString(),
    maxInput: value[1].toString(),
    isMinFocused: false,
    isMaxFocused: false
  });

  const sliderRef = useRef<HTMLDivElement>(null);

  // Update input display when prop values change (but only if not focused)
  useEffect(() => {
    setInputState(prev => ({
      ...prev,
      minInput: prev.isMinFocused ? prev.minInput : value[0].toString(),
      maxInput: prev.isMaxFocused ? prev.maxInput : value[1].toString()
    }));
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
      
      const newValue = Math.round((percentage / 100) * (max - min) + min);
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

  // Handle input focus
  const handleInputFocus = useCallback((type: 'min' | 'max') => {
    setInputState(prev => ({
      ...prev,
      [`is${type === 'min' ? 'Min' : 'Max'}Focused`]: true
    }));
  }, []);

  // Handle input changes (allow free typing)
  const handleInputChange = useCallback((type: 'min' | 'max', inputValue: string) => {
    if (disabled) return;
    
    setInputState(prev => ({
      ...prev,
      [`${type}Input`]: inputValue
    }));
  }, [disabled]);

  // Handle input blur (validate and apply)
  const handleInputBlur = useCallback((type: 'min' | 'max') => {
    if (disabled) return;
    
    const inputValue = type === 'min' ? inputState.minInput : inputState.maxInput;
    const parsedValue = parsePrice(inputValue);
    const steppedValue = Math.round(parsedValue / step) * step;
    
    let finalValue: number;
    let newValues: [number, number];
    
    if (type === 'min') {
      finalValue = clamp(steppedValue, min, value[1] - step);
      newValues = [finalValue, value[1]];
    } else {
      finalValue = clamp(steppedValue, value[0] + step, max);
      newValues = [value[0], finalValue];
    }
    
    // Update input display with validated value
    setInputState(prev => ({
      ...prev,
      [`${type}Input`]: finalValue.toString(),
      [`is${type === 'min' ? 'Min' : 'Max'}Focused`]: false
    }));
    
    // Apply the change
    onChange(newValues);
  }, [disabled, inputState.minInput, inputState.maxInput, min, max, step, value, onChange]);

  // Handle Enter key in inputs
  const handleInputKeyDown = useCallback((_type: 'min' | 'max', event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.currentTarget.blur();
    }
  }, []);

  // Handle track click
  const handleTrackClick = useCallback((event: React.MouseEvent) => {
    if (disabled || !sliderRef.current) return;
    
    const rect = sliderRef.current.getBoundingClientRect();
    const percentage = ((event.clientX - rect.left) / rect.width) * 100;
    const clickValue = Math.round((percentage / 100) * (max - min) + min);
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

  return (
    <div className={cn("w-full space-y-4", className)}>
      {/* Input Fields */}
      <div className="flex items-center space-x-3">
        <div className="flex-1">
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Minimum
          </label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={inputState.minInput}
              onChange={(e) => handleInputChange('min', e.target.value)}
              onFocus={() => handleInputFocus('min')}
              onBlur={() => handleInputBlur('min')}
              onKeyDown={(e) => handleInputKeyDown('min', e)}
              disabled={disabled}
              className={cn(
                "w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-lg",
                "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                "disabled:bg-gray-50 disabled:text-gray-500",
                "transition-colors"
              )}
              placeholder="$0"
            />
          </div>
        </div>
        
        <div className="flex-shrink-0 text-gray-400 mt-5">
          <span className="text-sm">to</span>
        </div>
        
        <div className="flex-1">
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Maximum
          </label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={inputState.maxInput}
              onChange={(e) => handleInputChange('max', e.target.value)}
              onFocus={() => handleInputFocus('max')}
              onBlur={() => handleInputBlur('max')}
              onKeyDown={(e) => handleInputKeyDown('max', e)}
              disabled={disabled}
              className={cn(
                "w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-lg",
                "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                "disabled:bg-gray-50 disabled:text-gray-500",
                "transition-colors"
              )}
              placeholder="$1000"
            />
          </div>
        </div>
      </div>

      {/* Slider Track */}
      <div className="relative pt-6 pb-2">
        <div
          ref={sliderRef}
          className={cn(
            "relative h-2 bg-gray-200 rounded-full cursor-pointer",
            disabled && "cursor-not-allowed opacity-50"
          )}
          onClick={handleTrackClick}
        >
          {/* Active range */}
          <div
            className="absolute h-2 bg-blue-600 rounded-full"
            style={{
              left: `${leftPercentage}%`,
              width: `${rightPercentage - leftPercentage}%`
            }}
          />
          
          {/* Min thumb */}
          <motion.div
            className={cn(
              "absolute top-1/2 w-5 h-5 bg-white border-2 border-blue-600 rounded-full",
              "transform -translate-y-1/2 cursor-grab shadow-sm",
              isDragging === 'min' && "cursor-grabbing shadow-lg scale-110",
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
          />
          
          {/* Max thumb */}
          <motion.div
            className={cn(
              "absolute top-1/2 w-5 h-5 bg-white border-2 border-blue-600 rounded-full",
              "transform -translate-y-1/2 cursor-grab shadow-sm",
              isDragging === 'max' && "cursor-grabbing shadow-lg scale-110",
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
          />
        </div>
        
        {/* Value labels */}
        <div className="flex justify-between text-xs text-gray-500 mt-2">
          <span>{formatPrice(min)}</span>
          <span>{formatPrice(max)}</span>
        </div>
      </div>

      {/* Current selection display */}
      <div className="text-center">
        <span className="text-sm text-gray-600">
          {formatPrice(value[0])} - {formatPrice(value[1])}
        </span>
      </div>
    </div>
  );
} 