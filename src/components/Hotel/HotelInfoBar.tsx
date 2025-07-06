import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star } from 'lucide-react';
import type { Hotel } from '../../types/index';

interface HotelInfoBarProps {
  hotel: Hotel | null;
  onClose: () => void;
}

const HotelInfoBar: React.FC<HotelInfoBarProps> = ({ hotel, onClose }) => {
  return (
    <AnimatePresence>
      {hotel && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ 
            opacity: 0,
            transition: { duration: 0.15 }
          }}
          transition={{ duration: 0.25 }}
          className="absolute top-0 left-0 right-0 z-10 bg-blue-50 border-b border-blue-200 px-4 py-3 shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img
                src={hotel.image_url}
                alt={hotel.name}
                className="w-12 h-12 rounded-lg object-cover"
              />
              <div>
                <h3 className="font-semibold text-gray-900">{hotel.name}</h3>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    <span>{hotel.rating}</span>
                  </div>
                  <span>{hotel.address}</span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
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
  );
};

export default HotelInfoBar; 