import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import HotelMap from './components/Map/HotelMap';
import LoadingScreen from './components/UI/LoadingScreen';
import ErrorScreen from './components/UI/ErrorScreen';
import AppHeader from './components/Layout/AppHeader';
import HotelInfoBar from './components/Hotel/HotelInfoBar';
import DebugPanel from './components/Debug/DebugPanel';
import type { Hotel } from './types/index';
import { loadHotelData } from './utils/dataProcessor';

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
        subtitle="Discover amazing stays in Seattle"
        stats={dataStats}
      />

      {/* Map Container with Overlay Info Bar */}
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className={`flex-1 relative ${selectedHotel ? 'has-info-bar' : ''}`}
      >
        <HotelMap
          hotels={hotels}
          selectedHotel={selectedHotel}
          onHotelSelect={handleHotelSelect}
          onHotelHover={handleHotelHover}
          showPopup={true}
          className="w-full h-full"
        />
        
        {/* Hotel Info Bar as Overlay */}
        <HotelInfoBar 
          hotel={selectedHotel}
          onClose={handleClearSelection}
        />
      </motion.main>

      {/* Debug Panel */}
      <DebugPanel 
        hotels={hotels}
        selectedHotel={selectedHotel}
        hoveredHotel={hoveredHotel}
        debugMode={DEBUG_MODE}
      />
    </div>
  );
}

export default App;
