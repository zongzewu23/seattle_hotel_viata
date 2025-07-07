import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

// =============================================================================
// SIMPLE ANIMATION UTILITIES
// =============================================================================

// Basic animation timings
export const SIMPLE_TIMINGS = {
  cluster: {
    appear: 0.2,
    badge: 0.1,
    price: 0.15,
  },
  hotel: {
    appear: 0.15,
    hover: 0.1,
  },
} as const;

// Basic easing functions
export const SIMPLE_EASINGS = {
  smooth: "easeOut" as const,
  bounce: "easeInOut" as const,
} as const;

// =============================================================================
// BASIC ANIMATION VARIANTS
// =============================================================================

export const simpleVariants = {
  cluster: {
    initial: { scale: 0, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0.8, opacity: 0 },
  },
  hotel: {
    initial: { scale: 0, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0.8, opacity: 0 },
  },
  badge: {
    initial: { scale: 0, rotate: -180 },
    animate: { 
      scale: 1, 
      rotate: 0,
      transition: { 
        type: "spring" as const, 
        stiffness: 300, 
        damping: 15 
      }
    },
  },
} as const;

// =============================================================================
// SIMPLE COMPONENTS (if needed)
// =============================================================================

interface SimpleRippleProps {
  isActive: boolean;
  size: number;
  color: string;
  duration?: number;
}

export const SimpleRipple: React.FC<SimpleRippleProps> = ({ 
  isActive, 
  size, 
  color, 
  duration = 0.6 
}) => {
  const prefersReducedMotion = useReducedMotion();
  
  if (!isActive || prefersReducedMotion) return null;

  return (
    <motion.div
      className="absolute inset-0 rounded-full border pointer-events-none"
      style={{
        width: size + 20,
        height: size + 20,
        marginLeft: -10,
        marginTop: -10,
        borderColor: color,
      }}
      initial={{ scale: 0.8, opacity: 0.8 }}
      animate={{ 
        scale: 2, 
        opacity: 0,
        transition: { duration, ease: "easeOut" }
      }}
    />
  );
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

export const getSimpleAnimationConfig = () => ({
  enableBasicAnimations: true,
  enableRipples: true,
  staggerDelay: SIMPLE_TIMINGS.cluster.appear,
});

// Export types for compatibility
export interface AnimationConfig {
  enableBasicAnimations: boolean;
  enableRipples: boolean;
  staggerDelay: number;
}

// For backward compatibility with existing code
export const getOptimizedAnimationConfig = () => getSimpleAnimationConfig();
export const detectDevicePerformance = () => 'medium' as const; 