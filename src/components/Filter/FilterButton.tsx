import { motion } from 'framer-motion';
import { SlidersHorizontal, Filter } from 'lucide-react';
import { cn } from '../../utils/cn';

// =============================================================================
// TYPES
// =============================================================================

interface FilterButtonProps {
  onClick: () => void;
  activeFiltersCount?: number;
  isOpen?: boolean;
  className?: string;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  showIcon?: boolean;
  showCount?: boolean;
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function FilterButton({
  onClick,
  activeFiltersCount = 0,
  isOpen = false,
  className,
  variant = 'primary',
  size = 'md',
  disabled = false,
  showIcon = true,
  showCount = true
}: FilterButtonProps) {
  // Base styles
  const baseStyles = cn(
    "relative inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200",
    "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500",
    "disabled:opacity-50 disabled:cursor-not-allowed",
    "select-none"
  );

  // Variant styles
  const variantStyles = {
    primary: cn(
      "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800",
      "shadow-sm hover:shadow-md active:shadow-lg",
      isOpen && "bg-blue-700 shadow-md"
    ),
    secondary: cn(
      "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 active:bg-gray-100",
      "shadow-sm hover:shadow-md active:shadow-lg",
      isOpen && "bg-gray-50 border-gray-400 shadow-md"
    ),
    ghost: cn(
      "bg-transparent text-gray-600 hover:bg-gray-100 active:bg-gray-200",
      "hover:text-gray-900",
      isOpen && "bg-gray-100 text-gray-900"
    )
  };

  // Size styles
  const sizeStyles = {
    sm: "px-3 py-1.5 text-sm gap-1.5",
    md: "px-4 py-2 text-sm gap-2",
    lg: "px-5 py-2.5 text-base gap-2.5"
  };

  // Icon size
  const iconSizes = {
    sm: "h-4 w-4",
    md: "h-4 w-4",
    lg: "h-5 w-5"
  };

  const hasActiveFilters = activeFiltersCount > 0;

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        baseStyles,
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      transition={{ duration: 0.1 }}
    >
      {/* Icon */}
      {showIcon && (
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <SlidersHorizontal className={iconSizes[size]} />
        </motion.div>
      )}

      {/* Button Text */}
      <span>
        Filters
      </span>

      {/* Active Filters Count Badge */}
      {showCount && hasActiveFilters && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0 }}
          transition={{ duration: 0.2 }}
          className={cn(
            "absolute -top-2 -right-2 flex items-center justify-center",
            "min-w-[20px] h-5 px-1.5 rounded-full text-xs font-semibold",
            "bg-red-500 text-white shadow-md"
          )}
        >
          {activeFiltersCount > 99 ? '99+' : activeFiltersCount}
        </motion.div>
      )}

      {/* Active Filters Indicator (Alternative to Badge) */}
      {hasActiveFilters && !showCount && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0 }}
          transition={{ duration: 0.2 }}
          className="w-2 h-2 bg-red-500 rounded-full"
        />
      )}
    </motion.button>
  );
}

// =============================================================================
// FLOATING FILTER BUTTON (FOR MOBILE)
// =============================================================================

interface FloatingFilterButtonProps extends Omit<FilterButtonProps, 'variant' | 'size'> {
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center';
}

export function FloatingFilterButton({
  position = 'bottom-right',
  className,
  ...props
}: FloatingFilterButtonProps) {
  const positionStyles = {
    'bottom-right': 'fixed bottom-6 right-6 z-40',
    'bottom-left': 'fixed bottom-6 left-6 z-40',
    'bottom-center': 'fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40'
  };

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(positionStyles[position], className)}
    >
      <FilterButton
        {...props}
        variant="primary"
        size="lg"
        className="shadow-lg hover:shadow-xl"
      />
    </motion.div>
  );
}

// =============================================================================
// COMPACT FILTER BUTTON (FOR HEADERS)
// =============================================================================

interface CompactFilterButtonProps extends Omit<FilterButtonProps, 'showIcon' | 'showCount'> {
  showText?: boolean;
}

export function CompactFilterButton({
  showText = true,
  className,
  ...props
}: CompactFilterButtonProps) {
  const hasActiveFilters = (props.activeFiltersCount || 0) > 0;

  return (
    <motion.button
      onClick={props.onClick}
      disabled={props.disabled}
      className={cn(
        "relative inline-flex items-center justify-center p-2 rounded-lg",
        "text-gray-600 hover:text-gray-900 hover:bg-gray-100",
        "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500",
        "transition-all duration-200",
        props.isOpen && "bg-gray-100 text-gray-900",
        className
      )}
      whileHover={{ scale: props.disabled ? 1 : 1.05 }}
      whileTap={{ scale: props.disabled ? 1 : 0.95 }}
      transition={{ duration: 0.1 }}
    >
      {/* Icon */}
      <motion.div
        animate={{ rotate: props.isOpen ? 180 : 0 }}
        transition={{ duration: 0.2 }}
      >
        <Filter className="h-5 w-5" />
      </motion.div>

      {/* Text (if shown) */}
      {showText && (
        <span className="ml-2 text-sm font-medium">
          Filters
        </span>
      )}

      {/* Active Filters Count Badge */}
      {hasActiveFilters && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0 }}
          transition={{ duration: 0.2 }}
          className={cn(
            "absolute -top-1 -right-1 flex items-center justify-center",
            "min-w-[18px] h-4 px-1 rounded-full text-xs font-semibold",
            "bg-red-500 text-white shadow-sm"
          )}
        >
          {(props.activeFiltersCount || 0) > 99 ? '99+' : props.activeFiltersCount}
        </motion.div>
      )}
    </motion.button>
  );
} 