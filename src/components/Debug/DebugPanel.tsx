import React from 'react';
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
  if (!debugMode) return null;

  return (
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
  );
};

export default DebugPanel; 