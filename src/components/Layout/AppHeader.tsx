import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Users, Star } from 'lucide-react';

interface DataStats {
  totalHotels: number;
  avgRating: number;
  priceRange: { min: number; max: number };
}

interface AppHeaderProps {
  title: string;
  subtitle: string;
  stats?: DataStats | null;
  children?: React.ReactNode;
}

const AppHeader: React.FC<AppHeaderProps> = ({ title, subtitle, stats, children }) => {
  return (
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
            <h1 className="text-xl font-bold text-gray-900">{title}</h1>
            <p className="text-sm text-gray-500">{subtitle}</p>
          </div>
        </div>

        {/* Right Side Content */}
        <div className="flex items-center space-x-4">
          {/* Stats */}
          {stats && (
            <div className="hidden md:flex items-center space-x-6 text-sm">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-blue-600" />
                <span className="font-medium">{stats.totalHotels}</span>
                <span className="text-gray-500">hotels</span>
              </div>
              <div className="flex items-center space-x-2">
                <Star className="w-4 h-4 text-yellow-500" />
                <span className="font-medium">{stats.avgRating.toFixed(1)}</span>
                <span className="text-gray-500">avg rating</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-green-600 font-medium">
                  ${stats.priceRange.min} - ${stats.priceRange.max}
                </span>
                <span className="text-gray-500">per night</span>
              </div>
            </div>
          )}

          {/* Children (e.g., Filter Button) */}
          {children && (
            <div className="flex items-center space-x-2">
              {children}
            </div>
          )}
        </div>
      </div>
    </motion.header>
  );
};

export default AppHeader; 