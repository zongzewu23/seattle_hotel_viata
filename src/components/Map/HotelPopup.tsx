import React from 'react';
import { Popup } from 'react-map-gl';
import { motion } from 'framer-motion';
import { Star, DollarSign } from 'lucide-react';
import type { Hotel } from '../../types/index';
import { normalizePrice } from '../../utils/dataProcessor';

// =============================================================================
// INTERFACES
// =============================================================================

export interface HotelPopupProps {
  hotel: Hotel;
  onClose: () => void;
}

// =============================================================================
// HOTEL POPUP COMPONENT
// =============================================================================

export const HotelPopup = React.memo<HotelPopupProps>(({ hotel, onClose }) => {
  const normalizedPrice = normalizePrice(hotel.price_per_night);

  return (
    <Popup
      latitude={hotel.latitude}
      longitude={hotel.longitude}
      onClose={onClose}
      closeButton={true}
      closeOnClick={false}
      anchor="top"
      offset={[0, -10]}
      maxWidth="320px"
      className="hotel-popup"
    >
      <motion.div
        className="p-3 max-w-sm"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
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
          <h3 className="font-semibold text-lg leading-tight line-clamp-2">
            {hotel.name}
          </h3>
          
          <p className="text-sm text-gray-600 line-clamp-1">
            {hotel.address}
          </p>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-500 fill-current" />
              <span className="text-sm font-medium">{hotel.rating}</span>
              <span className="text-sm text-gray-500">
                ({hotel.review_count} reviews)
              </span>
            </div>
            
            <div className="flex items-center gap-1">
              <DollarSign className="w-4 h-4 text-green-600" />
              <span className="text-sm font-semibold text-green-600">
                ${normalizedPrice}
              </span>
            </div>
          </div>
          
          <div className="text-sm text-gray-600">
            {hotel.room_type}
          </div>
          
          {/* Amenities */}
          {hotel.amenities.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {hotel.amenities.slice(0, 4).map((amenity, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-gray-100 text-xs rounded-full text-gray-700"
                >
                  {amenity}
                </span>
              ))}
              {hotel.amenities.length > 4 && (
                <span className="px-2 py-1 bg-gray-100 text-xs rounded-full text-gray-700">
                  +{hotel.amenities.length - 4}
                </span>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </Popup>
  );
});

HotelPopup.displayName = 'HotelPopup';

export default HotelPopup; 