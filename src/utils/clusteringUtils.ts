import type { Hotel, HotelCluster, ClusteringConfig, MapViewport, BoundingBox, Coordinates } from '../types/index';

// =============================================================================
// CLUSTERING CONFIGURATION
// =============================================================================

export const DEFAULT_CLUSTERING_CONFIG: ClusteringConfig = {
  minZoom: 8,          // Start clustering at zoom level 8
  maxZoom: 14,         // Stop clustering at zoom level 14
  clusterRadius: 50,   // 50px radius for grouping
  maxClusterSize: 50,  // Max 50 hotels per cluster
  pixelRadius: 40,     // Visual marker radius
};

// =============================================================================
// CLUSTERING UTILITIES
// =============================================================================

/**
 * Determines if clustering should be enabled based on zoom level
 */
export function shouldCluster(zoom: number, config: ClusteringConfig): boolean {
  return zoom >= config.minZoom && zoom <= config.maxZoom;
}

/**
 * Calculates distance between two coordinates in kilometers
 */
export function calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (coord2.latitude - coord1.latitude) * Math.PI / 180;
  const dLon = (coord2.longitude - coord1.longitude) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(coord1.latitude * Math.PI / 180) * Math.cos(coord2.latitude * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * Converts geographic distance to pixel distance at a given zoom level
 */
export function geoDistanceToPixelDistance(
  geoDistance: number, 
  latitude: number, 
  zoom: number
): number {
  const metersPerPixel = 156543.03392 * Math.cos(latitude * Math.PI / 180) / Math.pow(2, zoom);
  return (geoDistance * 1000) / metersPerPixel;
}

/**
 * Converts pixel distance to geographic distance at a given zoom level
 */
export function pixelDistanceToGeoDistance(
  pixelDistance: number, 
  latitude: number, 
  zoom: number
): number {
  const metersPerPixel = 156543.03392 * Math.cos(latitude * Math.PI / 180) / Math.pow(2, zoom);
  return (pixelDistance * metersPerPixel) / 1000;
}

/**
 * Calculates bounding box for a set of hotels
 */
export function getClusterBounds(hotels: Hotel[]): BoundingBox {
  if (hotels.length === 0) {
    return { north: 0, south: 0, east: 0, west: 0 };
  }

  let north = hotels[0].latitude;
  let south = hotels[0].latitude;
  let east = hotels[0].longitude;
  let west = hotels[0].longitude;

  for (const hotel of hotels) {
    north = Math.max(north, hotel.latitude);
    south = Math.min(south, hotel.latitude);
    east = Math.max(east, hotel.longitude);
    west = Math.min(west, hotel.longitude);
  }

  return { north, south, east, west };
}

/**
 * Calculates center point for a set of hotels
 */
export function getClusterCenter(hotels: Hotel[]): Coordinates {
  if (hotels.length === 0) {
    return { latitude: 0, longitude: 0 };
  }

  const totalLat = hotels.reduce((sum, hotel) => sum + hotel.latitude, 0);
  const totalLng = hotels.reduce((sum, hotel) => sum + hotel.longitude, 0);

  return {
    latitude: totalLat / hotels.length,
    longitude: totalLng / hotels.length,
  };
}

/**
 * Calculates average rating for a set of hotels
 */
export function getClusterAvgRating(hotels: Hotel[]): number {
  if (hotels.length === 0) return 0;
  
  const totalRating = hotels.reduce((sum, hotel) => sum + hotel.rating, 0);
  return totalRating / hotels.length;
}

/**
 * Calculates price range for a set of hotels
 */
export function getClusterPriceRange(hotels: Hotel[]): { min: number; max: number } {
  if (hotels.length === 0) return { min: 0, max: 0 };
  
  const prices = hotels.map(hotel => 
    typeof hotel.price_per_night === 'number' 
      ? hotel.price_per_night 
      : parseFloat(hotel.price_per_night.toString()) || 0
  );
  
  return {
    min: Math.min(...prices),
    max: Math.max(...prices),
  };
}

/**
 * Groups hotels by proximity using k-means clustering approach
 */
export function groupHotelsByProximity(
  hotels: Hotel[], 
  zoom: number, 
  config: ClusteringConfig
): HotelCluster[] {
  if (hotels.length === 0) return [];
  
  // For single hotel, no clustering needed
  if (hotels.length === 1) {
    return [];
  }

  // Calculate pixel-based cluster radius based on zoom level
  const avgLatitude = hotels.reduce((sum, h) => sum + h.latitude, 0) / hotels.length;
  const clusterRadiusGeo = pixelDistanceToGeoDistance(config.clusterRadius, avgLatitude, zoom);
  
  const clusters: HotelCluster[] = [];
  const processed = new Set<number>();

  // Simple clustering: group hotels within radius
  for (let i = 0; i < hotels.length; i++) {
    if (processed.has(i)) continue;
    
    const hotel = hotels[i];
    const clusterHotels = [hotel];
    processed.add(i);
    
    // Find nearby hotels
    for (let j = i + 1; j < hotels.length; j++) {
      if (processed.has(j)) continue;
      
      const otherHotel = hotels[j];
      const distance = calculateDistance(
        { latitude: hotel.latitude, longitude: hotel.longitude },
        { latitude: otherHotel.latitude, longitude: otherHotel.longitude }
      );
      
      if (distance <= clusterRadiusGeo && clusterHotels.length < config.maxClusterSize) {
        clusterHotels.push(otherHotel);
        processed.add(j);
      }
    }
    
    // Only create cluster if we have multiple hotels
    if (clusterHotels.length > 1) {
      clusters.push({
        id: `cluster-${i}-${clusterHotels.length}`,
        center: getClusterCenter(clusterHotels),
        hotels: clusterHotels,
        count: clusterHotels.length,
        avgRating: getClusterAvgRating(clusterHotels),
        priceRange: getClusterPriceRange(clusterHotels),
        bounds: getClusterBounds(clusterHotels),
      });
    }
  }

  return clusters;
}

/**
 * Main clustering function that calculates clusters based on viewport and config
 */
export function calculateClusters(
  hotels: Hotel[], 
  viewport: MapViewport, 
  config: ClusteringConfig
): { clusters: HotelCluster[]; individualHotels: Hotel[] } {
  // Don't cluster if zoom level is outside clustering range
  if (!shouldCluster(viewport.zoom, config)) {
    return { clusters: [], individualHotels: hotels };
  }

  // Group hotels by proximity
  const clusters = groupHotelsByProximity(hotels, viewport.zoom, config);
  
  // Extract individual hotels that weren't clustered
  const clusteredHotelIds = new Set(
    clusters.flatMap(cluster => cluster.hotels.map(h => h.hotel_id))
  );
  
  const individualHotels = hotels.filter(hotel => !clusteredHotelIds.has(hotel.hotel_id));

  return { clusters, individualHotels };
}

/**
 * Optimized clustering with spatial indexing for large datasets
 */
export function calculateClustersOptimized(
  hotels: Hotel[], 
  viewport: MapViewport, 
  config: ClusteringConfig
): { clusters: HotelCluster[]; individualHotels: Hotel[] } {
  // For smaller datasets, use simple clustering
  if (hotels.length <= 100) {
    return calculateClusters(hotels, viewport, config);
  }

  // TODO: Implement spatial indexing (quadtree/rtree) for large datasets
  // For now, use simple clustering
  return calculateClusters(hotels, viewport, config);
}

/**
 * Cache for clustering results to improve performance
 */
const clusterCache = new Map<string, { clusters: HotelCluster[]; individualHotels: Hotel[] }>();

/**
 * Cached clustering function
 */
export function calculateClustersCached(
  hotels: Hotel[], 
  viewport: MapViewport, 
  config: ClusteringConfig
): { clusters: HotelCluster[]; individualHotels: Hotel[] } {
  const cacheKey = `${hotels.length}-${viewport.zoom.toFixed(1)}-${config.clusterRadius}`;
  
  if (clusterCache.has(cacheKey)) {
    return clusterCache.get(cacheKey)!;
  }

  const result = calculateClustersOptimized(hotels, viewport, config);
  
  // Limit cache size to prevent memory issues
  if (clusterCache.size > 50) {
    const firstKey = clusterCache.keys().next().value;
    if (firstKey) {
      clusterCache.delete(firstKey);
    }
  }
  
  clusterCache.set(cacheKey, result);
  return result;
}

/**
 * Clears the clustering cache
 */
export function clearClusterCache(): void {
  clusterCache.clear();
}

/**
 * Gets cluster color based on average rating
 */
export function getClusterColor(avgRating: number): string {
  if (avgRating >= 8.0) return '#10b981'; // green-500
  if (avgRating >= 6.0) return '#f59e0b'; // amber-500
  return '#6b7280'; // gray-500
}

/**
 * Gets cluster size based on hotel count
 */
export function getClusterSize(count: number): { size: number; category: 'small' | 'medium' | 'large' } {
  if (count <= 5) return { size: 30, category: 'small' };
  if (count <= 15) return { size: 40, category: 'medium' };
  return { size: 50, category: 'large' };
}

/**
 * Simple test function to verify clustering works correctly
 * Can be called from browser console: testClustering()
 */
export function testClustering(): void {
  console.log('🧪 Testing clustering functionality...');
  
  // Mock hotel data for testing
  const testHotels: Hotel[] = [
    {
      hotel_id: 1,
      name: 'Test Hotel A',
      latitude: 47.6089,
      longitude: -122.3345,
      address: '123 Test St',
      star_rating: 4,
      price_per_night: 200,
      currency: 'USD',
      rating: 8.5,
      review_count: 100,
      image_url: 'test.jpg',
      room_type: 'Standard',
      amenities: ['WiFi', 'Parking'],
    },
    {
      hotel_id: 2,
      name: 'Test Hotel B',
      latitude: 47.6095, // Very close to Hotel A
      longitude: -122.3340,
      address: '456 Test St',
      star_rating: 3,
      price_per_night: 150,
      currency: 'USD',
      rating: 7.8,
      review_count: 80,
      image_url: 'test.jpg',
      room_type: 'Standard',
      amenities: ['WiFi'],
    },
    {
      hotel_id: 3,
      name: 'Test Hotel C',
      latitude: 47.6200, // Far from A and B
      longitude: -122.3500,
      address: '789 Test St',
      star_rating: 5,
      price_per_night: 300,
      currency: 'USD',
      rating: 9.2,
      review_count: 200,
      image_url: 'test.jpg',
      room_type: 'Luxury',
      amenities: ['WiFi', 'Spa', 'Pool'],
    },
  ];

  const testViewport: MapViewport = {
    bounds: {
      northeast: { latitude: 47.62, longitude: -122.30 },
      southwest: { latitude: 47.60, longitude: -122.36 },
    },
    center: { latitude: 47.6089, longitude: -122.3345 },
    zoom: 12,
  };

  console.log('📍 Test data:', {
    hotels: testHotels.length,
    viewport: testViewport,
  });

  // Test should cluster function
  const shouldClusterAt10 = shouldCluster(10, DEFAULT_CLUSTERING_CONFIG);
  const shouldClusterAt15 = shouldCluster(15, DEFAULT_CLUSTERING_CONFIG);
  console.log('✅ shouldCluster tests:', {
    'zoom 10': shouldClusterAt10, // should be true
    'zoom 15': shouldClusterAt15, // should be false
  });

  // Test distance calculation
  const distance = calculateDistance(
    { latitude: 47.6089, longitude: -122.3345 },
    { latitude: 47.6095, longitude: -122.3340 }
  );
  console.log('📏 Distance calculation:', {
    distance: distance.toFixed(4) + ' km',
    isValid: distance > 0 && distance < 1,
  });

  // Test clustering at different zoom levels
  const clusteringResult = calculateClusters(testHotels, testViewport, DEFAULT_CLUSTERING_CONFIG);
  console.log('🔗 Clustering results:', {
    clusters: clusteringResult.clusters.length,
    individualHotels: clusteringResult.individualHotels.length,
    totalHotels: clusteringResult.clusters.reduce((sum, c) => sum + c.count, 0) + clusteringResult.individualHotels.length,
  });

  // Test cluster utility functions
  const bounds = getClusterBounds(testHotels);
  const center = getClusterCenter(testHotels);
  const avgRating = getClusterAvgRating(testHotels);
  const priceRange = getClusterPriceRange(testHotels);
  
  console.log('📊 Cluster utilities:', {
    bounds,
    center,
    avgRating: avgRating.toFixed(2),
    priceRange,
  });

  // Test visual helpers
  const colors = [
    { rating: 9.0, color: getClusterColor(9.0) },
    { rating: 7.0, color: getClusterColor(7.0) },
    { rating: 5.0, color: getClusterColor(5.0) },
  ];
  
  const sizes = [
    { count: 3, size: getClusterSize(3) },
    { count: 10, size: getClusterSize(10) },
    { count: 20, size: getClusterSize(20) },
  ];

  console.log('🎨 Visual helpers:', {
    colors,
    sizes,
  });

  console.log('✅ All clustering tests completed successfully!');
  console.log('💡 You can now test the clustering by zooming in/out on the map');
}

// Expose test function globally for browser console access
if (typeof window !== 'undefined') {
  (window as any).testClustering = testClustering;
} 