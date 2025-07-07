// =============================================================================
// UNIFIED COLOR SYSTEM FOR HOTELS AND CLUSTERS
// =============================================================================

/**
 * Centralized rating thresholds for consistent color assignment
 * Adjust these values to change the rating segments across the entire app
 */
export const RATING_THRESHOLDS = {
  HIGH: 8.7,    // Excellent hotels
  MEDIUM: 8.0,  // Good hotels
  // Below 7.0 = Average/Poor hotels
} as const;

/**
 * Hotel rating color palette
 * Colors are distinct and visually different for clear differentiation
 */
export const HOTEL_COLORS = {
  // State colors (selected/hovered)
  SELECTED: '#DC2626',    // red-600 - Clear selection indicator
  HOVERED: '#EA580C',     // orange-600 - Hover state
  
  // Rating-based colors (more distinct than before)
  HIGH_RATING: '#059669',    // emerald-600 - Green for excellent hotels
  MEDIUM_RATING: '#3B82F6', // blue-500 - Blue for good hotels (changed from teal)
  LOW_RATING: '#6B7280',    // gray-500 - Gray for average/poor hotels
  
  // Cluster colors (slightly different for visual distinction)
  CLUSTER_HIGH: '#10b981',  // green-500 - Brighter green for clusters
  CLUSTER_MEDIUM: '#f59e0b', // amber-500 - Amber for medium cluster ratings
  CLUSTER_LOW: '#6b7280',   // gray-500 - Gray for low cluster ratings
} as const;

/**
 * Gets the appropriate color for an individual hotel marker
 * @param rating - Hotel rating (0-10)
 * @param isSelected - Whether the hotel is currently selected
 * @param isHovered - Whether the hotel is currently hovered
 * @returns Hex color string
 */
export function getHotelMarkerColor(
  rating: number, 
  isSelected: boolean = false, 
  isHovered: boolean = false
): string {
  // State-based colors take priority
  if (isSelected) return HOTEL_COLORS.SELECTED;
  if (isHovered) return HOTEL_COLORS.HOVERED;
  
  // Rating-based colors
  if (rating >= RATING_THRESHOLDS.HIGH) return HOTEL_COLORS.HIGH_RATING;
  if (rating >= RATING_THRESHOLDS.MEDIUM) return HOTEL_COLORS.MEDIUM_RATING;
  return HOTEL_COLORS.LOW_RATING;
}

/**
 * Gets the appropriate color for a cluster marker
 * @param avgRating - Average rating of hotels in the cluster
 * @returns Hex color string
 */
export function getClusterColor(avgRating: number): string {
  if (avgRating >= RATING_THRESHOLDS.HIGH) return HOTEL_COLORS.CLUSTER_HIGH;
  if (avgRating >= RATING_THRESHOLDS.MEDIUM) return HOTEL_COLORS.CLUSTER_MEDIUM;
  return HOTEL_COLORS.CLUSTER_LOW;
}

/**
 * Gets color description for debugging/display purposes
 * @param rating - Rating value
 * @returns Object with color info
 */
export function getColorInfo(rating: number): {
  category: 'high' | 'medium' | 'low';
  description: string;
  markerColor: string;
  clusterColor: string;
} {
  if (rating >= RATING_THRESHOLDS.HIGH) {
    return {
      category: 'high',
      description: 'Excellent',
      markerColor: HOTEL_COLORS.HIGH_RATING,
      clusterColor: HOTEL_COLORS.CLUSTER_HIGH,
    };
  }
  
  if (rating >= RATING_THRESHOLDS.MEDIUM) {
    return {
      category: 'medium',
      description: 'Good',
      markerColor: HOTEL_COLORS.MEDIUM_RATING,
      clusterColor: HOTEL_COLORS.CLUSTER_MEDIUM,
    };
  }
  
  return {
    category: 'low',
    description: 'Average',
    markerColor: HOTEL_COLORS.LOW_RATING,
    clusterColor: HOTEL_COLORS.CLUSTER_LOW,
  };
}

/**
 * Debug function to test color assignments
 * Call from browser console: testColors()
 */
export function testColors(): void {
  console.log('🎨 Testing unified color system...');
  console.log('📊 Rating thresholds:', RATING_THRESHOLDS);
  console.log('🎯 Hotel colors:', HOTEL_COLORS);
  
  const testRatings = [9.5, 8.5, 8.0, 7.5, 7.0, 6.5, 5.0];
  
  console.log('🔍 Color assignments:');
  testRatings.forEach(rating => {
    const colorInfo = getColorInfo(rating);
    const markerColor = getHotelMarkerColor(rating);
    const clusterColor = getClusterColor(rating);
    
    console.log(`Rating ${rating}:`, {
      category: colorInfo.category,
      description: colorInfo.description,
      markerColor,
      clusterColor,
    });
  });
  
  console.log('✅ Color system test completed!');
}

// Expose test function globally for browser console access
if (typeof window !== 'undefined') {
  (window as any).testColors = testColors;
} 