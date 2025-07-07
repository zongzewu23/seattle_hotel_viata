import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import HotelMap from './components/Map/HotelMap';
import LoadingScreen from './components/UI/LoadingScreen';
import ErrorScreen from './components/UI/ErrorScreen';
import AppHeader from './components/Layout/AppHeader';
import HotelInfoBar from './components/Hotel/HotelInfoBar';
import DebugPanel from './components/Debug/DebugPanel';
import ClusteringDebug from './components/Debug/ClusteringDebug';
import FilterPanel from './components/Filter/FilterPanel';
import FilterButton, { FloatingFilterButton } from './components/Filter/FilterButton';
import type { Hotel, HotelFilters } from './types/index';
import { loadHotelData, filterHotels } from './utils/dataProcessor';

// =============================================================================
// APP CONFIGURATION
// =============================================================================

const APP_TITLE = import.meta.env.VITE_APP_TITLE || 'Seattle Hotel Explorer';
const DEBUG_MODE = true; // Temporarily enabled to verify CSS loading status

// =============================================================================
// TYPES
// =============================================================================

interface DataStats {
  totalHotels: number;
  avgRating: number;
  priceRange: { min: number; max: number };
}

// =============================================================================
// MAIN APP COMPONENT
// =============================================================================

function App() {
  // State management
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(null);
  const [hoveredHotel, setHoveredHotel] = useState<Hotel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dataStats, setDataStats] = useState<DataStats | null>(null);
  const [mapViewState, setMapViewState] = useState({
    latitude: 47.6089,
    longitude: -122.3345,
    zoom: 12.5,
  });
  const [showClusteringDebug, setShowClusteringDebug] = useState(false);
  const [enableClustering] = useState(true);

  // Filter state - Enhanced with preview functionality
  const [pendingFilters, setPendingFilters] = useState<HotelFilters>({});
  const [appliedFilters, setAppliedFilters] = useState<HotelFilters>({});
  const [originalFilters, setOriginalFilters] = useState<HotelFilters>({});
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [showBackdrop, setShowBackdrop] = useState(true);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isApplyingFilters, setIsApplyingFilters] = useState(false);

  // Apply filters to hotels (only when appliedFilters changes)
  const filteredHotels = useMemo(() => {
    if (hotels.length === 0) return [];
    return filterHotels(hotels, appliedFilters);
  }, [hotels, appliedFilters]);

  // Calculate preview count for pending filters
  const previewCount = useMemo(() => {
    if (hotels.length === 0) return 0;
    return filterHotels(hotels, pendingFilters).length;
  }, [hotels, pendingFilters]);

  // Count active applied filters (for badge display)
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    
    if (appliedFilters.priceRange) count++;
    if (appliedFilters.ratingRange) count++;
    if (appliedFilters.starRating && appliedFilters.starRating.length > 0) count++;
    if (appliedFilters.amenities && appliedFilters.amenities.length > 0) count += appliedFilters.amenities.length;
    if (appliedFilters.searchQuery && appliedFilters.searchQuery.trim()) count++;
    
    return count;
  }, [appliedFilters]);

  // Check if there are pending changes
  const hasPendingChanges = useMemo(() => {
    return JSON.stringify(pendingFilters) !== JSON.stringify(appliedFilters);
  }, [pendingFilters, appliedFilters]);

  // Check if pending filters are empty
  const hasPendingFilters = useMemo(() => {
    return Boolean(
      pendingFilters.priceRange ||
      pendingFilters.ratingRange ||
      (pendingFilters.starRating && pendingFilters.starRating.length > 0) ||
      (pendingFilters.amenities && pendingFilters.amenities.length > 0) ||
      (pendingFilters.searchQuery && pendingFilters.searchQuery.trim())
    );
  }, [pendingFilters]);

  // Check if filters have changed from original baseline
  const hasFilterChanges = useMemo(() => {
    return JSON.stringify(pendingFilters) !== JSON.stringify(originalFilters);
  }, [pendingFilters, originalFilters]);

  // Conditional backdrop visibility
  const shouldShowBackdrop = useMemo(() => {
    return isFilterPanelOpen && showBackdrop && !isPreviewing;
  }, [isFilterPanelOpen, showBackdrop, isPreviewing]);

  // Data loading effect
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        if (DEBUG_MODE) {
          console.log('Loading hotel data...');
        }

        const hotelData = await loadHotelData();
        
        if (!isMounted) return;

        if (hotelData.length === 0) {
          throw new Error('No hotel data found');
        }

        // Calculate data statistics
        const totalHotels = hotelData.length;
        const avgRating = hotelData.reduce((sum, hotel) => sum + hotel.rating, 0) / totalHotels;
        const prices = hotelData.map(hotel => 
          typeof hotel.price_per_night === 'number' 
            ? hotel.price_per_night 
            : parseFloat(hotel.price_per_night.toString()) || 0
        );
        const priceRange = {
          min: Math.min(...prices),
          max: Math.max(...prices),
        };

        setHotels(hotelData);
        setDataStats({ totalHotels, avgRating, priceRange });
        
        if (DEBUG_MODE) {
          console.log(`Loaded ${hotelData.length} hotels`, {
            avgRating: avgRating.toFixed(1),
            priceRange,
          });
        }
      } catch (err) {
        if (!isMounted) return;
        
        const errorMessage = err instanceof Error ? err.message : 'Failed to load hotel data';
        setError(errorMessage);
        console.error('Error loading hotel data:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Hotel interaction handlers
  const handleHotelSelect = useCallback((hotel: Hotel) => {
    setSelectedHotel(hotel);
    if (DEBUG_MODE) {
      console.log('Selected hotel:', hotel.name);
    }
  }, []);

  const handleHotelHover = useCallback((hotel: Hotel | null) => {
    setHoveredHotel(hotel);
  }, []);

  const handleClearSelection = useCallback(() => {
    setSelectedHotel(null);
  }, []);

  const handleRetry = useCallback(() => {
    window.location.reload();
  }, []);

  const handleMapViewStateChange = useCallback((newViewState: { latitude: number; longitude: number; zoom: number }) => {
    setMapViewState(newViewState);
  }, []);

  const handleToggleClusteringDebug = useCallback(() => {
    setShowClusteringDebug(prev => !prev);
  }, []);

  // Filter panel handlers
  const handleOpenFilterPanel = useCallback(() => {
    // Save current applied filters as baseline when opening panel
    setOriginalFilters(appliedFilters);
    setIsFilterPanelOpen(true);
    setShowBackdrop(true);
    setIsPreviewing(false);
  }, [appliedFilters]);

  const handleCloseFilterPanel = useCallback(() => {
    setIsFilterPanelOpen(false);
    setShowBackdrop(false);
    setIsPreviewing(false);
    // Reset pending filters to applied filters when closing without applying
    setPendingFilters(appliedFilters);
  }, [appliedFilters]);

  // Handle pending filter changes (update UI immediately, don't filter hotels)
  const handlePendingFiltersChange = useCallback((newFilters: HotelFilters) => {
    setPendingFilters(newFilters);
    if (DEBUG_MODE) {
      console.log('Pending filters changed:', newFilters);
      console.log('Preview count:', filterHotels(hotels, newFilters).length);
    }
  }, [hotels]);

  // Preview functionality
  const handlePreview = useCallback(() => {
    if (!isPreviewing) {
      // Enter preview mode
      setAppliedFilters(pendingFilters);
      setShowBackdrop(false);
      setIsPreviewing(true);
      
      if (DEBUG_MODE) {
        console.log('Preview mode activated:', pendingFilters);
      }
    } else {
      // Exit preview mode
      setAppliedFilters(originalFilters);
      setShowBackdrop(true);
      setIsPreviewing(false);
      
      if (DEBUG_MODE) {
        console.log('Preview mode deactivated, reverted to:', originalFilters);
      }
    }
  }, [isPreviewing, pendingFilters, originalFilters]);

  // Apply pending filters (filter hotels and close panel)
  const handleApplyFilters = useCallback(async () => {
    setIsApplyingFilters(true);
    
    // Add a small delay for visual feedback
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Apply filters permanently
    setAppliedFilters(pendingFilters);
    setOriginalFilters(pendingFilters);
    setIsApplyingFilters(false);
    
    // Close filter panel completely
    setIsFilterPanelOpen(false);
    setShowBackdrop(false);
    setIsPreviewing(false);
    
    if (DEBUG_MODE) {
      console.log('Filters applied and panel closed:', pendingFilters);
      console.log('Filtered hotels count:', filterHotels(hotels, pendingFilters).length);
    }
  }, [pendingFilters, hotels]);

  // Clear all filters
  const handleClearAllFilters = useCallback(() => {
    setPendingFilters({});
    setAppliedFilters({});
    setOriginalFilters({});
    
    if (DEBUG_MODE) {
      console.log('All filters cleared');
    }
  }, []);

  // Reset pending filters to applied filters (cancel changes)
  const handleResetPendingFilters = useCallback(() => {
    setPendingFilters(appliedFilters);
    setIsPreviewing(false);
    setShowBackdrop(true);
  }, [appliedFilters]);

  // Loading state
  if (isLoading) {
    return <LoadingScreen />;
  }

  // Error state
  if (error) {
    return <ErrorScreen error={error} onRetry={handleRetry} />;
  }

  // Main app render
  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <AppHeader 
        title={APP_TITLE}
        subtitle={`Discover amazing stays in Seattle • ${filteredHotels.length} hotels found`}
        stats={dataStats}
      >
        {/* Filter Button in Header */}
        <FilterButton
          onClick={handleOpenFilterPanel}
          activeFiltersCount={activeFiltersCount}
          isOpen={isFilterPanelOpen}
          variant="secondary"
          size="md"
        />
      </AppHeader>

      {/* Map Container with Overlay Info Bar */}
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className={`flex-1 relative ${selectedHotel ? 'has-info-bar' : ''}`}
      >
        <HotelMap
          hotels={filteredHotels}
          selectedHotel={selectedHotel}
          onHotelSelect={handleHotelSelect}
          onHotelHover={handleHotelHover}
          showPopup={true}
          enableClustering={enableClustering}
          onMapViewStateChange={handleMapViewStateChange}
          className="w-full h-full"
        />
        
        {/* Hotel Info Bar as Overlay */}
        <HotelInfoBar 
          hotel={selectedHotel}
          onClose={handleClearSelection}
        />

        {/* Mobile Floating Filter Button */}
        <div className="md:hidden">
          <FloatingFilterButton
            onClick={handleOpenFilterPanel}
            activeFiltersCount={activeFiltersCount}
            isOpen={isFilterPanelOpen}
            position="bottom-right"
          />
        </div>
      </motion.main>

      {/* Filter Panel */}
      <FilterPanel
        isOpen={isFilterPanelOpen}
        onClose={handleCloseFilterPanel}
        hotels={hotels}
        pendingFilters={pendingFilters}
        appliedFilters={appliedFilters}
        originalFilters={originalFilters}
        onPendingFiltersChange={handlePendingFiltersChange}
        onApplyFilters={handleApplyFilters}
        onClearAllFilters={handleClearAllFilters}
        onResetPendingFilters={handleResetPendingFilters}
        onPreview={handlePreview}
        previewCount={previewCount}
        isApplyingFilters={isApplyingFilters}
        hasPendingChanges={hasPendingChanges}
        hasPendingFilters={hasPendingFilters}
        hasFilterChanges={hasFilterChanges}
        isPreviewing={isPreviewing}
        showBackdrop={shouldShowBackdrop}
      />

      {/* Debug Panel */}
      <DebugPanel 
        hotels={filteredHotels}
        selectedHotel={selectedHotel}
        hoveredHotel={hoveredHotel}
        debugMode={DEBUG_MODE}
      />

      {/* Clustering Debug */}
      <ClusteringDebug
        hotels={filteredHotels}
        viewState={mapViewState}
        enableClustering={enableClustering}
        isVisible={showClusteringDebug}
        onToggleVisibility={handleToggleClusteringDebug}
      />
    </div>
  );
}

export default App;
