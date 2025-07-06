import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Hotel as HotelIcon, AlertCircle, Loader2, Users, Star } from 'lucide-react';
import HotelMap from './components/Map/HotelMap';
import type { Hotel } from './types/index';
import { loadHotelData } from './utils/dataProcessor';
import { cn } from './utils/cn';

// =============================================================================
// APP CONFIGURATION
// =============================================================================

const APP_TITLE = import.meta.env.VITE_APP_TITLE || 'Seattle Hotel Explorer';
const DEBUG_MODE = import.meta.env.VITE_DEBUG_MODE === 'true';

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
  const [dataStats, setDataStats] = useState<{
    totalHotels: number;
    avgRating: number;
    priceRange: { min: number; max: number };
  } | null>(null);

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
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-6"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-16 h-16 mx-auto"
          >
            <Loader2 className="w-full h-full text-blue-600" />
          </motion.div>
          
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-gray-900">Loading Hotels</h2>
            <p className="text-gray-600">Discovering amazing stays in Seattle...</p>
          </div>
          
          <div className="flex items-center justify-center space-x-8 text-sm text-gray-500">
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4" />
              <span>Seattle Downtown</span>
            </div>
            <div className="flex items-center space-x-2">
              <HotelIcon className="w-4 h-4" />
              <span>Premium Hotels</span>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-100">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-6 max-w-md mx-auto p-6"
        >
          <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-gray-900">Unable to Load Hotels</h2>
            <p className="text-gray-600">{error}</p>
          </div>
          
          <motion.button
            onClick={handleRetry}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Try Again
          </motion.button>
        </motion.div>
      </div>
    );
  }

  // Main app render
  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white shadow-sm border-b border-gray-200 px-4 py-3 flex-shrink-0"
      >
        <div className="flex items-center justify-between">
          {/* App Title */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <MapPin className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{APP_TITLE}</h1>
              <p className="text-sm text-gray-500">Discover amazing stays in Seattle</p>
            </div>
          </div>

          {/* Stats */}
          {dataStats && (
            <div className="hidden md:flex items-center space-x-6 text-sm">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-blue-600" />
                <span className="font-medium">{dataStats.totalHotels}</span>
                <span className="text-gray-500">hotels</span>
              </div>
              <div className="flex items-center space-x-2">
                <Star className="w-4 h-4 text-yellow-500" />
                <span className="font-medium">{dataStats.avgRating.toFixed(1)}</span>
                <span className="text-gray-500">avg rating</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-green-600 font-medium">
                  ${dataStats.priceRange.min} - ${dataStats.priceRange.max}
                </span>
                <span className="text-gray-500">per night</span>
              </div>
            </div>
          )}
        </div>
      </motion.header>

      {/* Selected Hotel Info Bar */}
      <AnimatePresence>
        {selectedHotel && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-blue-50 border-b border-blue-200 px-4 py-3 flex-shrink-0"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <img
                  src={selectedHotel.image_url}
                  alt={selectedHotel.name}
                  className="w-12 h-12 rounded-lg object-cover"
                />
                <div>
                  <h3 className="font-semibold text-gray-900">{selectedHotel.name}</h3>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      <span>{selectedHotel.rating}</span>
                    </div>
                    <span>{selectedHotel.address}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={handleClearSelection}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <span className="sr-only">Close</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Map Container */}
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex-1 relative"
      >
        <HotelMap
          hotels={hotels}
          selectedHotel={selectedHotel}
          onHotelSelect={handleHotelSelect}
          onHotelHover={handleHotelHover}
          showPopup={true}
          className="w-full h-full"
        />
      </motion.main>

      {/* Debug Info */}
      {DEBUG_MODE && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="fixed bottom-4 right-4 bg-black/80 text-white text-xs p-3 rounded-lg font-mono max-w-xs"
        >
          <div className="space-y-1">
            <div>Hotels: {hotels.length}</div>
            <div>Selected: {selectedHotel?.name || 'None'}</div>
            <div>Hovered: {hoveredHotel?.name || 'None'}</div>
            <div>Map: Loaded</div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

export default App;
