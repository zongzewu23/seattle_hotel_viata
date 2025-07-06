import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Hotel as HotelIcon, Loader2 } from 'lucide-react';

interface LoadingScreenProps {
  title?: string;
  subtitle?: string;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  title = "Loading Hotels", 
  subtitle = "Discovering amazing stays in Seattle..." 
}) => {
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
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          <p className="text-gray-600">{subtitle}</p>
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
};

export default LoadingScreen; 