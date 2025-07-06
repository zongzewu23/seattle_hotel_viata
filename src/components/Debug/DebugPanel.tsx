import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import type { Hotel } from '../../types/index';

interface DebugPanelProps {
  hotels: Hotel[];
  selectedHotel?: Hotel | null;
  hoveredHotel?: Hotel | null;
  debugMode: boolean;
}

const DebugPanel: React.FC<DebugPanelProps> = ({ 
  hotels, 
  selectedHotel, 
  hoveredHotel,
  debugMode 
}) => {
  const [mapboxCssLoaded, setMapboxCssLoaded] = useState(false);

  useEffect(() => {
    if (!debugMode) return;

    // Check for mapbox CSS loading with a delay to allow DOM to render
    const checkMapboxCSS = () => {
      if (typeof window === 'undefined') return false;
      
      // Check for mapbox canvas elements (most reliable indicator)
      const hasCanvas = document.querySelector('canvas.mapboxgl-canvas') !== null;
      
      // Check for mapbox control elements
      const hasControls = document.querySelector('.mapboxgl-control-container') !== null;
      
      // Check for any mapbox-gl CSS classes
      const hasMapboxClasses = document.querySelector('[class*="mapboxgl"]') !== null;
      
      const cssLoaded = hasCanvas || hasControls || hasMapboxClasses;
      
      if (import.meta.env.DEV) {
        console.log('🎯 Mapbox CSS Debug Check:', {
          hasCanvas,
          hasControls,
          hasMapboxClasses,
          cssLoaded,
          timestamp: new Date().toISOString()
        });
      }
      
      return cssLoaded;
    };

    // Initial check
    const isLoaded = checkMapboxCSS();
    setMapboxCssLoaded(isLoaded);

    // Recheck after a short delay if not loaded initially
    if (!isLoaded) {
      const timer = setTimeout(() => {
        setMapboxCssLoaded(checkMapboxCSS());
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [debugMode]);

  if (!debugMode) return null;

  const coordinatePrecision = selectedHotel ? {
    lat: selectedHotel.latitude.toString().split('.')[1]?.length || 0,
    lng: selectedHotel.longitude.toString().split('.')[1]?.length || 0,
  } : null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5 }}
      className="fixed bottom-4 right-4 bg-black/80 text-white text-xs p-3 rounded-lg font-mono max-w-xs space-y-1"
    >
      <div className="text-yellow-400 font-bold">🐛 DEBUG PANEL</div>
      
      <div className="space-y-1">
        <div>Hotels: {hotels.length}</div>
        <div>Selected: {selectedHotel?.name || 'None'}</div>
        <div>Hovered: {hoveredHotel?.name || 'None'}</div>
        <div>Map: Loaded</div>
      </div>

      <div className="border-t border-gray-600 pt-2 mt-2">
        <div className="text-blue-400 font-bold">🎯 POSITIONING</div>
        <div className={`flex items-center gap-1 ${mapboxCssLoaded ? 'text-green-400' : 'text-red-400'}`}>
          <span>{mapboxCssLoaded ? '✅' : '❌'}</span>
          <span>Mapbox CSS</span>
        </div>
        
        {selectedHotel && (
          <>
            <div className="text-gray-300">Coordinates:</div>
            <div className="text-green-400">{selectedHotel.latitude.toFixed(6)}</div>
            <div className="text-green-400">{selectedHotel.longitude.toFixed(6)}</div>
            {coordinatePrecision && (
              <div className="text-gray-400">
                Precision: {coordinatePrecision.lat}/{coordinatePrecision.lng} digits
              </div>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
};

export default DebugPanel; 