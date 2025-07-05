// =============================================================================
// HOTEL DATA TYPES
// =============================================================================

export interface Hotel {
  hotel_id: number;
  name: string;
  latitude: number;
  longitude: number;
  address: string;
  star_rating: number;
  price_per_night: number | string; // Handle inconsistent data types
  currency: string;
  rating: number;
  review_count: number;
  image_url: string;
  room_type: string;
  amenities: Amenity[];
}

// =============================================================================
// CONST OBJECTS & UNION TYPES
// =============================================================================

export const AMENITIES = {
  WiFi: 'WiFi',
  Parking: 'Parking',
  Gym: 'Gym',
  Pool: 'Pool',
  Restaurant: 'Restaurant',
  Bar: 'Bar',
  Spa: 'Spa',
  BusinessCenter: 'Business Center',
} as const;

export type Amenity = typeof AMENITIES[keyof typeof AMENITIES];

export const CURRENCIES = {
  USD: 'USD',
} as const;

export type Currency = typeof CURRENCIES[keyof typeof CURRENCIES];

export const SORT_BY = {
  Price: 'price',
  Rating: 'rating',
  StarRating: 'star_rating',
  ReviewCount: 'review_count',
  Name: 'name',
  Distance: 'distance',
} as const;

export type SortBy = typeof SORT_BY[keyof typeof SORT_BY];

export const SORT_ORDER = {
  Ascending: 'asc',
  Descending: 'desc',
} as const;

export type SortOrder = typeof SORT_ORDER[keyof typeof SORT_ORDER];

// =============================================================================
// FILTER TYPES
// =============================================================================

export interface PriceRange {
  min: number;
  max: number;
}

export interface RatingRange {
  min: number;
  max: number;
}

export interface HotelFilters {
  priceRange?: PriceRange;
  ratingRange?: RatingRange;
  starRating?: number[];
  amenities?: Amenity[];
  searchQuery?: string;
  sortBy?: SortBy;
  sortOrder?: SortOrder;
}

export interface FilterState {
  filters: HotelFilters;
  isActive: boolean;
  resultsCount: number;
}

// =============================================================================
// MAP TYPES
// =============================================================================

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface BoundingBox {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface MapBounds {
  northeast: Coordinates;
  southwest: Coordinates;
}

export interface MapViewport {
  bounds: MapBounds;
  center: Coordinates;
  zoom: number;
}

export interface HotelCluster {
  id: string;
  center: Coordinates;
  hotels: Hotel[];
  count: number;
  avgRating: number;
  priceRange: PriceRange;
  bounds: BoundingBox;
}

export interface ClusteringConfig {
  minZoom: number;
  maxZoom: number;
  clusterRadius: number;
  maxClusterSize: number;
  pixelRadius: number;
}

export interface MapState {
  viewport: MapViewport;
  clusters: HotelCluster[];
  visibleHotels: Hotel[];
  selectedHotel: Hotel | null;
  hoveredHotel: Hotel | null;
  isLoading: boolean;
  bounds: MapBounds | null;
}

// =============================================================================
// UI STATE TYPES
// =============================================================================

export interface LoadingState {
  isLoading: boolean;
  error: string | null;
  message?: string;
}

export interface SearchState {
  query: string;
  results: Hotel[];
  isSearching: boolean;
  hasSearched: boolean;
}

export interface AppState {
  hotels: Hotel[];
  filteredHotels: Hotel[];
  selectedHotel: Hotel | null;
  hoveredHotel: Hotel | null;
  filters: FilterState;
  map: MapState;
  search: SearchState;
  loading: LoadingState;
}

// =============================================================================
// UTILITY TYPES
// =============================================================================

export interface HotelDistance extends Hotel {
  distance: number; // Distance in kilometers
}

export interface HotelWithPrice extends Omit<Hotel, 'price_per_night'> {
  price_per_night: number; // Normalized to number
}

export interface HotelSummary {
  hotel_id: number;
  name: string;
  rating: number;
  price_per_night: number;
  star_rating: number;
  coordinates: Coordinates;
}

// =============================================================================
// EVENT TYPES
// =============================================================================

export interface HotelClickEvent {
  hotel: Hotel;
  coordinates: Coordinates;
  event: MouseEvent;
}

export interface ClusterClickEvent {
  cluster: HotelCluster;
  coordinates: Coordinates;
  event: MouseEvent;
}

export interface MapClickEvent {
  coordinates: Coordinates;
  event: MouseEvent;
}

export interface FilterChangeEvent {
  filters: HotelFilters;
  previousFilters: HotelFilters;
}

// =============================================================================
// API TYPES
// =============================================================================

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  error?: string;
}

export interface HotelApiResponse extends ApiResponse<Hotel[]> {
  total: number;
  page: number;
  limit: number;
}

// =============================================================================
// COMPONENT PROP TYPES
// =============================================================================

export interface HotelCardProps {
  hotel: Hotel;
  isSelected?: boolean;
  isHovered?: boolean;
  onSelect?: (hotel: Hotel) => void;
  onHover?: (hotel: Hotel | null) => void;
  showDistance?: boolean;
  distance?: number;
  className?: string;
}

export interface HotelMarkerProps {
  hotel: Hotel;
  isSelected?: boolean;
  isHovered?: boolean;
  onSelect?: (hotel: Hotel) => void;
  onHover?: (hotel: Hotel | null) => void;
  className?: string;
}

export interface ClusterMarkerProps {
  cluster: HotelCluster;
  onSelect?: (cluster: HotelCluster) => void;
  className?: string;
}

export interface FilterComponentProps {
  filters: HotelFilters;
  onFiltersChange: (filters: HotelFilters) => void;
  hotelCount: number;
  className?: string;
}

// =============================================================================
// STORE TYPES
// =============================================================================

export interface StoreActions {
  // Hotel actions
  setHotels: (hotels: Hotel[]) => void;
  setSelectedHotel: (hotel: Hotel | null) => void;
  setHoveredHotel: (hotel: Hotel | null) => void;
  
  // Filter actions
  setFilters: (filters: HotelFilters) => void;
  resetFilters: () => void;
  
  // Map actions
  setMapViewport: (viewport: MapViewport) => void;
  setClusters: (clusters: HotelCluster[]) => void;
  setVisibleHotels: (hotels: Hotel[]) => void;
  
  // Search actions
  setSearchQuery: (query: string) => void;
  setSearchResults: (results: Hotel[]) => void;
  
  // Loading actions
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
}

export interface AppStore extends AppState, StoreActions {}

// =============================================================================
// HELPER TYPES
// =============================================================================

export type HotelSortFunction = (a: Hotel, b: Hotel) => number;
export type HotelFilterFunction = (hotel: Hotel) => boolean;
export type CoordinatesArray = [number, number]; // [longitude, latitude] for mapping libraries
export type HotelId = number;
export type ClusterId = string; 