import hotelData from '../data/seattle_hotel_data.json';
import type {
  Hotel,
  HotelWithPrice,
  HotelDistance,
  HotelFilters,
  Coordinates,
  SortBy,
  SortOrder,
  Amenity,
  HotelSortFunction,
  HotelFilterFunction,
} from '../types/index.ts';
import {
  SORT_BY,
  SORT_ORDER,
  AMENITIES,
} from '../types/index.ts';

// =============================================================================
// DATA LOADING & CACHING
// =============================================================================

let cachedHotels: Hotel[] | null = null;
let loadingPromise: Promise<Hotel[]> | null = null;

/**
 * Load hotel data from JSON file with caching and error handling
 * @returns Promise<Hotel[]> - Array of validated and normalized hotels
 */
export async function loadHotelData(): Promise<Hotel[]> {
  // Return cached data if available
  if (cachedHotels) {
    return cachedHotels;
  }

  // Return existing loading promise if already in progress
  if (loadingPromise) {
    return loadingPromise;
  }

  // Create new loading promise
  loadingPromise = new Promise<Hotel[]>((resolve, reject) => {
    try {
      // Validate and normalize the imported data
      const validatedHotels = validateHotelData(hotelData);
      const normalizedHotels = normalizeHotelData(validatedHotels);
      
      // Cache the processed data
      cachedHotels = normalizedHotels;
      resolve(normalizedHotels);
    } catch (error) {
      reject(new Error(`Failed to load hotel data: ${error instanceof Error ? error.message : 'Unknown error'}`));
    }
  });

  return loadingPromise;
}

/**
 * Clear cached hotel data (useful for testing or data refresh)
 */
export function clearHotelCache(): void {
  cachedHotels = null;
  loadingPromise = null;
}

// =============================================================================
// DATA VALIDATION
// =============================================================================

/**
 * Validate hotel data structure against TypeScript interfaces
 * @param hotels - Raw hotel data array
 * @returns Hotel[] - Validated hotel array
 */
export function validateHotelData(hotels: unknown[]): Hotel[] {
  if (!Array.isArray(hotels)) {
    throw new Error('Hotel data must be an array');
  }

  const validHotels: Hotel[] = [];
  const errors: string[] = [];

  hotels.forEach((hotel, index) => {
    try {
      const validatedHotel = validateHotel(hotel);
      validHotels.push(validatedHotel);
    } catch (error) {
      errors.push(`Hotel ${index}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  if (errors.length > 0) {
    console.warn('Hotel validation warnings:', errors);
  }

  if (validHotels.length === 0) {
    throw new Error('No valid hotels found in dataset');
  }

  return validHotels;
}

/**
 * Validate individual hotel object
 * @param hotel - Raw hotel object
 * @returns Hotel - Validated hotel object
 */
export function validateHotel(hotel: unknown): Hotel {
  if (!hotel || typeof hotel !== 'object') {
    throw new Error('Hotel must be an object');
  }

  const h = hotel as Record<string, unknown>;

  // Required fields validation
  const requiredFields = [
    'hotel_id', 'name', 'latitude', 'longitude', 'address',
    'star_rating', 'price_per_night', 'currency', 'rating',
    'review_count', 'image_url', 'room_type', 'amenities'
  ];

  for (const field of requiredFields) {
    if (!(field in h) || h[field] === null || h[field] === undefined) {
      throw new Error(`Missing required field: ${field}`);
    }
  }

  // Type validation
  if (typeof h.hotel_id !== 'number' || h.hotel_id <= 0) {
    throw new Error('hotel_id must be a positive number');
  }

  if (typeof h.name !== 'string' || h.name.trim().length === 0) {
    throw new Error('name must be a non-empty string');
  }

  if (typeof h.latitude !== 'number' || h.latitude < -90 || h.latitude > 90) {
    throw new Error('latitude must be a number between -90 and 90');
  }

  if (typeof h.longitude !== 'number' || h.longitude < -180 || h.longitude > 180) {
    throw new Error('longitude must be a number between -180 and 180');
  }

  if (typeof h.address !== 'string' || h.address.trim().length === 0) {
    throw new Error('address must be a non-empty string');
  }

  if (typeof h.star_rating !== 'number' || h.star_rating < 1 || h.star_rating > 5) {
    throw new Error('star_rating must be a number between 1 and 5');
  }

  if (typeof h.currency !== 'string' || h.currency.trim().length === 0) {
    throw new Error('currency must be a non-empty string');
  }

  if (typeof h.rating !== 'number' || h.rating < 0 || h.rating > 10) {
    throw new Error('rating must be a number between 0 and 10');
  }

  if (typeof h.review_count !== 'number' || h.review_count < 0) {
    throw new Error('review_count must be a non-negative number');
  }

  if (typeof h.image_url !== 'string' || h.image_url.trim().length === 0) {
    throw new Error('image_url must be a non-empty string');
  }

  if (typeof h.room_type !== 'string' || h.room_type.trim().length === 0) {
    throw new Error('room_type must be a non-empty string');
  }

  if (!Array.isArray(h.amenities)) {
    throw new Error('amenities must be an array');
  }

  // Validate amenities array
  const validAmenities = h.amenities.filter((amenity): amenity is Amenity => {
    return typeof amenity === 'string' && Object.values(AMENITIES).includes(amenity as Amenity);
  });

  return {
    hotel_id: h.hotel_id as number,
    name: h.name as string,
    latitude: h.latitude as number,
    longitude: h.longitude as number,
    address: h.address as string,
    star_rating: h.star_rating as number,
    price_per_night: h.price_per_night as number | string,
    currency: h.currency as string,
    rating: h.rating as number,
    review_count: h.review_count as number,
    image_url: h.image_url as string,
    room_type: h.room_type as string,
    amenities: validAmenities,
  };
}

// =============================================================================
// DATA NORMALIZATION
// =============================================================================

/**
 * Normalize hotel data array
 * @param hotels - Array of validated hotels
 * @returns Hotel[] - Normalized hotel array
 */
export function normalizeHotelData(hotels: Hotel[]): Hotel[] {
  return hotels.map(normalizeHotel);
}

/**
 * Normalize individual hotel object
 * @param hotel - Hotel object to normalize
 * @returns Hotel - Normalized hotel object
 */
export function normalizeHotel(hotel: Hotel): Hotel {
  return {
    ...hotel,
    price_per_night: normalizePrice(hotel.price_per_night),
    name: hotel.name.trim(),
    address: hotel.address.trim(),
    room_type: hotel.room_type.trim(),
    amenities: hotel.amenities.filter(Boolean), // Remove empty amenities
  };
}

/**
 * Normalize price to number format
 * @param price - Price as string or number
 * @returns number - Normalized price
 */
export function normalizePrice(price: string | number): number {
  if (typeof price === 'number') {
    return Math.max(0, Math.round(price));
  }
  
  if (typeof price === 'string') {
    const numericPrice = parseFloat(price.replace(/[^0-9.]/g, ''));
    return isNaN(numericPrice) ? 0 : Math.max(0, Math.round(numericPrice));
  }
  
  return 0;
}

// =============================================================================
// DISTANCE CALCULATION
// =============================================================================

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param coord1 - First coordinate
 * @param coord2 - Second coordinate
 * @returns number - Distance in kilometers
 */
export function calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(coord2.latitude - coord1.latitude);
  const dLng = toRadians(coord2.longitude - coord1.longitude);
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(coord1.latitude)) * Math.cos(toRadians(coord2.latitude)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Math.round(distance * 100) / 100; // Round to 2 decimal places
}

/**
 * Convert degrees to radians
 * @param degrees - Degrees value
 * @returns number - Radians value
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Add distance property to hotels array
 * @param hotels - Array of hotels
 * @param referencePoint - Reference coordinates
 * @returns HotelDistance[] - Hotels with distance property
 */
export function addDistanceToHotels(hotels: Hotel[], referencePoint: Coordinates): HotelDistance[] {
  return hotels.map(hotel => ({
    ...hotel,
    distance: calculateDistance(
      { latitude: hotel.latitude, longitude: hotel.longitude },
      referencePoint
    ),
  }));
}

// =============================================================================
// SORTING FUNCTIONS
// =============================================================================

/**
 * Sort hotels by specified criteria
 * @param hotels - Array of hotels to sort
 * @param sortBy - Sort criteria
 * @param sortOrder - Sort order (asc/desc)
 * @returns Hotel[] - Sorted hotels array
 */
export function sortHotels(
  hotels: Hotel[],
  sortBy: SortBy = SORT_BY.Rating,
  sortOrder: SortOrder = SORT_ORDER.Descending
): Hotel[] {
  const sortFunction = getSortFunction(sortBy, sortOrder);
  return [...hotels].sort(sortFunction);
}

/**
 * Get sort function for specified criteria
 * @param sortBy - Sort criteria
 * @param sortOrder - Sort order
 * @returns HotelSortFunction - Sort function
 */
function getSortFunction(sortBy: SortBy, sortOrder: SortOrder): HotelSortFunction {
  const multiplier = sortOrder === SORT_ORDER.Ascending ? 1 : -1;
  
  switch (sortBy) {
    case SORT_BY.Price:
      return (a, b) => {
        const priceA = normalizePrice(a.price_per_night);
        const priceB = normalizePrice(b.price_per_night);
        return (priceA - priceB) * multiplier;
      };
    
    case SORT_BY.Rating:
      return (a, b) => (a.rating - b.rating) * multiplier;
    
    case SORT_BY.StarRating:
      return (a, b) => (a.star_rating - b.star_rating) * multiplier;
    
    case SORT_BY.ReviewCount:
      return (a, b) => (a.review_count - b.review_count) * multiplier;
    
    case SORT_BY.Name:
      return (a, b) => a.name.localeCompare(b.name) * multiplier;
    
    case SORT_BY.Distance:
      return (a, b) => {
        const distanceA = 'distance' in a ? (a as HotelDistance).distance : 0;
        const distanceB = 'distance' in b ? (b as HotelDistance).distance : 0;
        return (distanceA - distanceB) * multiplier;
      };
    
    default:
      return (a, b) => (a.rating - b.rating) * multiplier;
  }
}

// =============================================================================
// FILTERING FUNCTIONS
// =============================================================================

/**
 * Filter hotels based on specified criteria
 * @param hotels - Array of hotels to filter
 * @param filters - Filter criteria
 * @returns Hotel[] - Filtered hotels array
 */
export function filterHotels(hotels: Hotel[], filters: HotelFilters): Hotel[] {
  return hotels.filter(hotel => {
    // Price range filter
    if (filters.priceRange) {
      const price = normalizePrice(hotel.price_per_night);
      if (price < filters.priceRange.min || price > filters.priceRange.max) {
        return false;
      }
    }
    
    // Rating range filter
    if (filters.ratingRange) {
      if (hotel.rating < filters.ratingRange.min || hotel.rating > filters.ratingRange.max) {
        return false;
      }
    }
    
    // Star rating filter
    if (filters.starRating && filters.starRating.length > 0) {
      if (!filters.starRating.includes(hotel.star_rating)) {
        return false;
      }
    }
    
    // Amenities filter
    if (filters.amenities && filters.amenities.length > 0) {
      const hasAllAmenities = filters.amenities.every(amenity => 
        hotel.amenities.includes(amenity)
      );
      if (!hasAllAmenities) {
        return false;
      }
    }
    
    // Search query filter
    if (filters.searchQuery) {
      const searchMatch = matchesSearchQuery(hotel, filters.searchQuery);
      if (!searchMatch) {
        return false;
      }
    }
    
    return true;
  });
}

/**
 * Create filter function for hotels
 * @param filters - Filter criteria
 * @returns HotelFilterFunction - Filter function
 */
export function createHotelFilter(filters: HotelFilters): HotelFilterFunction {
  return (hotel: Hotel) => {
    return filterHotels([hotel], filters).length > 0;
  };
}

// =============================================================================
// SEARCH FUNCTIONS
// =============================================================================

/**
 * Search hotels by text query with fuzzy matching
 * @param hotels - Array of hotels to search
 * @param query - Search query
 * @param options - Search options
 * @returns Hotel[] - Hotels matching search query
 */
export function searchHotels(
  hotels: Hotel[],
  query: string,
  options: SearchOptions = {}
): Hotel[] {
  if (!query.trim()) {
    return hotels;
  }
  
  const {
    fuzzyThreshold = 0.6,
    includeAddress = true,
    includeAmenities = true,
    includeRoomType = true,
  } = options;
  
  const normalizedQuery = query.toLowerCase().trim();
  const results = hotels.filter(hotel => 
    matchesSearchQuery(hotel, normalizedQuery, {
      fuzzyThreshold,
      includeAddress,
      includeAmenities,
      includeRoomType,
    })
  );
  
  // Sort results by relevance
  return sortByRelevance(results, normalizedQuery);
}

interface SearchOptions {
  fuzzyThreshold?: number;
  includeAddress?: boolean;
  includeAmenities?: boolean;
  includeRoomType?: boolean;
}

/**
 * Check if hotel matches search query
 * @param hotel - Hotel to check
 * @param query - Search query
 * @param options - Search options
 * @returns boolean - Whether hotel matches query
 */
function matchesSearchQuery(
  hotel: Hotel,
  query: string,
  options: SearchOptions = {}
): boolean {
  const {
    fuzzyThreshold = 0.6,
    includeAddress = true,
    includeAmenities = true,
    includeRoomType = true,
  } = options;
  
  const normalizedQuery = query.toLowerCase();
  const searchFields: string[] = [hotel.name.toLowerCase()];
  
  if (includeAddress) {
    searchFields.push(hotel.address.toLowerCase());
  }
  
  if (includeRoomType) {
    searchFields.push(hotel.room_type.toLowerCase());
  }
  
  if (includeAmenities) {
    searchFields.push(...hotel.amenities.map(a => a.toLowerCase()));
  }
  
  // Exact match check
  for (const field of searchFields) {
    if (field.includes(normalizedQuery)) {
      return true;
    }
  }
  
  // Fuzzy match check
  for (const field of searchFields) {
    if (fuzzyMatch(field, normalizedQuery, fuzzyThreshold)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Simple fuzzy matching algorithm
 * @param text - Text to search in
 * @param query - Search query
 * @param threshold - Similarity threshold (0-1)
 * @returns boolean - Whether text matches query within threshold
 */
function fuzzyMatch(text: string, query: string, threshold: number): boolean {
  const similarity = calculateSimilarity(text, query);
  return similarity >= threshold;
}

/**
 * Calculate similarity between two strings using Levenshtein distance
 * @param str1 - First string
 * @param str2 - Second string
 * @returns number - Similarity score (0-1)
 */
function calculateSimilarity(str1: string, str2: string): number {
  const maxLength = Math.max(str1.length, str2.length);
  if (maxLength === 0) return 1;
  
  const distance = levenshteinDistance(str1, str2);
  return (maxLength - distance) / maxLength;
}

/**
 * Calculate Levenshtein distance between two strings
 * @param str1 - First string
 * @param str2 - Second string
 * @returns number - Levenshtein distance
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
  
  for (let i = 0; i <= str1.length; i++) {
    matrix[0][i] = i;
  }
  
  for (let j = 0; j <= str2.length; j++) {
    matrix[j][0] = j;
  }
  
  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,     // deletion
        matrix[j - 1][i] + 1,     // insertion
        matrix[j - 1][i - 1] + indicator  // substitution
      );
    }
  }
  
  return matrix[str2.length][str1.length];
}

/**
 * Sort search results by relevance
 * @param hotels - Hotels to sort
 * @param query - Search query
 * @returns Hotel[] - Sorted hotels
 */
function sortByRelevance(hotels: Hotel[], query: string): Hotel[] {
  return hotels.sort((a, b) => {
    const scoreA = calculateRelevanceScore(a, query);
    const scoreB = calculateRelevanceScore(b, query);
    return scoreB - scoreA; // Higher score first
  });
}

/**
 * Calculate relevance score for hotel and query
 * @param hotel - Hotel to score
 * @param query - Search query
 * @returns number - Relevance score
 */
function calculateRelevanceScore(hotel: Hotel, query: string): number {
  let score = 0;
  
  // Exact match in name gets highest score
  if (hotel.name.toLowerCase().includes(query)) {
    score += 100;
  }
  
  // Exact match in address gets medium score
  if (hotel.address.toLowerCase().includes(query)) {
    score += 50;
  }
  
  // Exact match in amenities gets lower score
  if (hotel.amenities.some(amenity => amenity.toLowerCase().includes(query))) {
    score += 25;
  }
  
  // Boost score based on hotel rating
  score += hotel.rating * 2;
  
  // Boost score based on review count (logarithmic)
  score += Math.log10(hotel.review_count + 1);
  
  return score;
}

// =============================================================================
// DATA TRANSFORMATION
// =============================================================================

/**
 * Convert hotel to normalized price format
 * @param hotel - Hotel to convert
 * @returns HotelWithPrice - Hotel with normalized price
 */
export function toHotelWithPrice(hotel: Hotel): HotelWithPrice {
  return {
    ...hotel,
    price_per_night: normalizePrice(hotel.price_per_night),
  };
}

/**
 * Convert hotels array to normalized price format
 * @param hotels - Hotels to convert
 * @returns HotelWithPrice[] - Hotels with normalized prices
 */
export function toHotelsWithPrice(hotels: Hotel[]): HotelWithPrice[] {
  return hotels.map(toHotelWithPrice);
}

/**
 * Get price range from hotels array
 * @param hotels - Hotels array
 * @returns Object with min and max prices
 */
export function getPriceRange(hotels: Hotel[]): { min: number; max: number } {
  if (hotels.length === 0) {
    return { min: 0, max: 0 };
  }
  
  const prices = hotels.map(hotel => normalizePrice(hotel.price_per_night));
  return {
    min: Math.min(...prices),
    max: Math.max(...prices),
  };
}

/**
 * Get rating range from hotels array
 * @param hotels - Hotels array
 * @returns Object with min and max ratings
 */
export function getRatingRange(hotels: Hotel[]): { min: number; max: number } {
  if (hotels.length === 0) {
    return { min: 0, max: 10 };
  }
  
  const ratings = hotels.map(hotel => hotel.rating);
  return {
    min: Math.min(...ratings),
    max: Math.max(...ratings),
  };
}

/**
 * Get unique amenities from hotels array
 * @param hotels - Hotels array
 * @returns Amenity[] - Array of unique amenities
 */
export function getUniqueAmenities(hotels: Hotel[]): Amenity[] {
  const amenitiesSet = new Set<Amenity>();
  
  hotels.forEach(hotel => {
    hotel.amenities.forEach(amenity => {
      amenitiesSet.add(amenity);
    });
  });
  
  return Array.from(amenitiesSet).sort();
}

/**
 * Get unique star ratings from hotels array
 * @param hotels - Hotels array
 * @returns number[] - Array of unique star ratings
 */
export function getUniqueStarRatings(hotels: Hotel[]): number[] {
  const ratingsSet = new Set<number>();
  
  hotels.forEach(hotel => {
    ratingsSet.add(hotel.star_rating);
  });
  
  return Array.from(ratingsSet).sort((a, b) => a - b);
}

// =============================================================================
// EXPORT INTERFACE
// =============================================================================

export interface DataProcessor {
  loadHotelData: () => Promise<Hotel[]>;
  validateHotelData: (hotels: unknown[]) => Hotel[];
  normalizeHotelData: (hotels: Hotel[]) => Hotel[];
  validateHotel: (hotel: unknown) => Hotel;
  normalizeHotel: (hotel: Hotel) => Hotel;
  normalizePrice: (price: string | number) => number;
  calculateDistance: (coord1: Coordinates, coord2: Coordinates) => number;
  addDistanceToHotels: (hotels: Hotel[], referencePoint: Coordinates) => HotelDistance[];
  sortHotels: (hotels: Hotel[], sortBy?: SortBy, sortOrder?: SortOrder) => Hotel[];
  filterHotels: (hotels: Hotel[], filters: HotelFilters) => Hotel[];
  searchHotels: (hotels: Hotel[], query: string, options?: SearchOptions) => Hotel[];
  toHotelWithPrice: (hotel: Hotel) => HotelWithPrice;
  toHotelsWithPrice: (hotels: Hotel[]) => HotelWithPrice[];
  getPriceRange: (hotels: Hotel[]) => { min: number; max: number };
  getRatingRange: (hotels: Hotel[]) => { min: number; max: number };
  getUniqueAmenities: (hotels: Hotel[]) => Amenity[];
  getUniqueStarRatings: (hotels: Hotel[]) => number[];
  clearHotelCache: () => void;
}

// Export default processor instance
export const dataProcessor: DataProcessor = {
  loadHotelData,
  validateHotelData,
  normalizeHotelData,
  validateHotel,
  normalizeHotel,
  normalizePrice,
  calculateDistance,
  addDistanceToHotels,
  sortHotels,
  filterHotels,
  searchHotels,
  toHotelWithPrice,
  toHotelsWithPrice,
  getPriceRange,
  getRatingRange,
  getUniqueAmenities,
  getUniqueStarRatings,
  clearHotelCache,
}; 