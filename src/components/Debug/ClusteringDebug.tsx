import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Settings, MapPin, Users, Star, Eye } from 'lucide-react';
import type { Hotel, MapViewport } from '../../types/index';
import { cn } from '../../utils/cn';
import { 
  calculateClustersCached, 
  DEFAULT_CLUSTERING_CONFIG, 
  shouldCluster,
  getClusterSize,
} from '../../utils/clusteringUtils';
import { getClusterColor } from '../../utils/colorUtils';

// =============================================================================
// INTERFACES
// =============================================================================

interface ClusteringDebugProps {
  hotels: Hotel[];
  viewState: {
    latitude: number;
    longitude: number;
    zoom: number;
  };
  enableClustering: boolean;
  isVisible?: boolean;
  onToggleVisibility?: () => void;
}

// =============================================================================
// CLUSTERING DEBUG COMPONENT
// =============================================================================

export const ClusteringDebug: React.FC<ClusteringDebugProps> = ({
  hotels,
  viewState,
  enableClustering,
  isVisible = false,
  onToggleVisibility,
}) => {
  // Calculate clustering stats
  const clusteringStats = useMemo(() => {
    if (!hotels || hotels.length === 0) {
      return {
        totalHotels: 0,
        clusters: [],
        individualHotels: [],
        shouldClusterAtZoom: false,
      };
    }

    const viewport: MapViewport = {
      bounds: {
        northeast: {
          latitude: viewState.latitude + 0.1,
          longitude: viewState.longitude + 0.1,
        },
        southwest: {
          latitude: viewState.latitude - 0.1,
          longitude: viewState.longitude - 0.1,
        },
      },
      center: {
        latitude: viewState.latitude,
        longitude: viewState.longitude,
      },
      zoom: viewState.zoom,
    };

    const shouldClusterAtZoom = shouldCluster(viewState.zoom, DEFAULT_CLUSTERING_CONFIG);
    const { clusters, individualHotels } = calculateClustersCached(
      hotels,
      viewport,
      DEFAULT_CLUSTERING_CONFIG
    );

    return {
      totalHotels: hotels.length,
      clusters,
      individualHotels,
      shouldClusterAtZoom,
    };
  }, [hotels, viewState]);

  if (!isVisible) {
    return (
      <motion.button
        onClick={onToggleVisibility}
        className="fixed bottom-4 right-4 bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-full shadow-lg z-50"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Settings className="w-5 h-5" />
      </motion.button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 300 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 300 }}
      className="fixed top-4 right-4 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-y-auto"
    >
      {/* Header */}
      <div className="bg-blue-500 text-white p-4 rounded-t-lg">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Clustering Debug</h3>
          <button
            onClick={onToggleVisibility}
            className="text-white hover:text-gray-200 transition-colors"
          >
            <Eye className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="p-4 space-y-4">
        {/* Basic Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <MapPin className="w-6 h-6 mx-auto mb-2 text-blue-500" />
            <div className="text-lg font-bold">{clusteringStats.totalHotels}</div>
            <div className="text-sm text-gray-600">Total Hotels</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <Users className="w-6 h-6 mx-auto mb-2 text-green-500" />
            <div className="text-lg font-bold">{clusteringStats.clusters.length}</div>
            <div className="text-sm text-gray-600">Clusters</div>
          </div>
        </div>

        {/* Zoom Info */}
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Zoom Level</span>
            <span className="text-lg font-bold">{viewState.zoom.toFixed(1)}</span>
          </div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Should Cluster</span>
            <span className={cn(
              "text-sm font-bold",
              clusteringStats.shouldClusterAtZoom ? "text-green-600" : "text-red-600"
            )}>
              {clusteringStats.shouldClusterAtZoom ? "Yes" : "No"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Clustering Enabled</span>
            <span className={cn(
              "text-sm font-bold",
              enableClustering ? "text-green-600" : "text-red-600"
            )}>
              {enableClustering ? "Yes" : "No"}
            </span>
          </div>
        </div>

        {/* Cluster Details */}
        {clusteringStats.clusters.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-gray-900">Clusters</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {clusteringStats.clusters.map((cluster, index) => {
                const color = getClusterColor(cluster.avgRating);
                const { size, category } = getClusterSize(cluster.count);
                
                return (
                  <div
                    key={cluster.id}
                    className="p-3 bg-gray-50 rounded-lg border-l-4"
                    style={{ borderLeftColor: color }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">Cluster {index + 1}</span>
                      <span className="text-xs text-gray-500 uppercase">{category}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="text-center">
                        <Users className="w-3 h-3 mx-auto mb-1" />
                        <div className="font-bold">{cluster.count}</div>
                        <div className="text-gray-600">Hotels</div>
                      </div>
                      <div className="text-center">
                        <Star className="w-3 h-3 mx-auto mb-1" />
                        <div className="font-bold">{cluster.avgRating.toFixed(1)}</div>
                        <div className="text-gray-600">Rating</div>
                      </div>
                      <div className="text-center">
                        <div className="w-3 h-3 mx-auto mb-1 rounded-full border" style={{ backgroundColor: color }} />
                        <div className="font-bold">{size}px</div>
                        <div className="text-gray-600">Size</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Individual Hotels */}
        {clusteringStats.individualHotels.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-gray-900">Individual Hotels</h4>
            <div className="text-sm text-gray-600">
              {clusteringStats.individualHotels.length} hotels displayed individually
            </div>
          </div>
        )}

        {/* Configuration */}
        <div className="p-3 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Configuration</h4>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span>Min Zoom:</span>
              <span className="font-mono">{DEFAULT_CLUSTERING_CONFIG.minZoom}</span>
            </div>
            <div className="flex justify-between">
              <span>Max Zoom:</span>
              <span className="font-mono">{DEFAULT_CLUSTERING_CONFIG.maxZoom}</span>
            </div>
            <div className="flex justify-between">
              <span>Cluster Radius:</span>
              <span className="font-mono">{DEFAULT_CLUSTERING_CONFIG.clusterRadius}px</span>
            </div>
            <div className="flex justify-between">
              <span>Max Cluster Size:</span>
              <span className="font-mono">{DEFAULT_CLUSTERING_CONFIG.maxClusterSize}</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ClusteringDebug; 