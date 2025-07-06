import React from 'react';
import { motion } from 'framer-motion';
import { Star, DollarSign, X } from 'lucide-react';
import type { Hotel } from '../../types/index';
import { normalizePrice } from '../../utils/dataProcessor';
import { PinContainer } from '../UI/3d-pin';

// =============================================================================
// INTERFACES
// =============================================================================

export interface HotelPopupProps {
  hotel: Hotel;
  onClose: () => void;
}

// =============================================================================
// HOTEL POPUP COMPONENT WITH 3D PIN EFFECT
// =============================================================================

export const HotelPopup = React.memo<HotelPopupProps>(({ hotel, onClose }) => {
  const normalizedPrice = normalizePrice(hotel.price_per_night);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute -top-2 -right-2 z-[70] bg-white rounded-full p-2 shadow-lg hover:bg-gray-50 transition-colors"
        >
          <X className="w-4 h-4 text-gray-600" />
        </button>

        <PinContainer
          title={hotel.name}
          href={`/hotel/${hotel.hotel_id}`}
          className="w-full"
          containerClassName="w-fit"
        >
          <motion.div
            className="w-full max-w-sm"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            {/* Hotel Image */}
            <div className="relative mb-3 rounded-lg overflow-hidden">
              <img
                src={hotel.image_url}
                alt={hotel.name}
                className="w-full h-32 object-cover"
                loading="lazy"
              />
              <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-sm">
                {hotel.star_rating}★
              </div>
            </div>

            {/* Hotel Info */}
            <div className="space-y-2">
              <h3 className="font-semibold text-lg leading-tight line-clamp-2 text-gray-900">
                {hotel.name}
              </h3>
              
              <p className="text-sm text-gray-600 line-clamp-1">
                {hotel.address}
              </p>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-500 fill-current" />
                  <span className="text-sm font-medium text-gray-900">{hotel.rating}</span>
                  <span className="text-sm text-gray-500">
                    ({hotel.review_count} reviews)
                  </span>
                </div>
                
                <div className="flex items-center gap-1">
                  <DollarSign className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-semibold text-green-600">
                    {normalizedPrice}
                  </span>
                </div>
              </div>
              
              <div className="text-sm text-gray-600">
                {hotel.room_type}
              </div>
              
              {/* Amenities - Complete List with Scrollable Container */}
              {hotel.amenities.length > 0 && (
                <div className="mt-2">
                  <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                    {hotel.amenities.map((amenity, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-gray-100 text-xs rounded-full text-gray-700 flex-shrink-0"
                      >
                        {amenity}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </PinContainer>
      </div>
    </div>
  );
});

HotelPopup.displayName = 'HotelPopup';

export default HotelPopup; 