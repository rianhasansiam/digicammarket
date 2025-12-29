"use client";

import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { Loader2, ChevronDown, CheckCircle } from 'lucide-react';

/**
 * Infinite Scroll Loader Component
 * Shows loading state and end-of-content message
 */
const InfiniteScrollLoader = forwardRef(({ 
  loading = false, 
  hasMore = true,
  totalCount = 0,
  displayCount = 0,
  onLoadMore,
  loadingText = "Loading more products...",
  endText = "You've seen all products",
  className = ""
}, ref) => {
  
  if (!hasMore && displayCount > 0) {
    // End of content
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`flex flex-col items-center justify-center py-8 ${className}`}
      >
        <div className="flex items-center gap-2 text-gray-500">
          <CheckCircle className="w-5 h-5 text-green-500" />
          <span className="text-sm font-medium">{endText}</span>
        </div>
        <p className="text-xs text-gray-400 mt-1">
          Showing all {totalCount} products
        </p>
      </motion.div>
    );
  }

  return (
    <div 
      ref={ref}
      className={`flex flex-col items-center justify-center py-8 ${className}`}
    >
      {loading ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-3"
        >
          <Loader2 className="w-8 h-8 animate-spin text-gray-600" />
          <span className="text-sm text-gray-500">{loadingText}</span>
        </motion.div>
      ) : hasMore ? (
        <motion.button
          onClick={onLoadMore}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors"
        >
          <span className="text-sm font-medium">Load More</span>
          <ChevronDown className="w-4 h-4" />
        </motion.button>
      ) : null}
      
      {hasMore && !loading && (
        <p className="text-xs text-gray-400 mt-3">
          Showing {displayCount} of {totalCount} products
        </p>
      )}
    </div>
  );
});

InfiniteScrollLoader.displayName = 'InfiniteScrollLoader';

/**
 * Simple loading skeleton for initial load
 */
export const ProductsLoadingSkeleton = ({ count = 8 }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: index * 0.05 }}
          className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100"
        >
          {/* Image skeleton */}
          <div className="aspect-square bg-gray-200 animate-pulse" />
          
          {/* Content skeleton */}
          <div className="p-4 space-y-3">
            <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
            <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2" />
            <div className="flex justify-between items-center pt-2">
              <div className="h-5 bg-gray-200 rounded animate-pulse w-20" />
              <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse" />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

/**
 * Scroll Progress Indicator
 */
export const ScrollProgressIndicator = ({ 
  current = 0, 
  total = 0,
  className = "" 
}) => {
  const progress = total > 0 ? (current / total) * 100 : 0;
  
  return (
    <div className={`w-full max-w-xs mx-auto ${className}`}>
      <div className="flex justify-between text-xs text-gray-500 mb-1">
        <span>{current} products</span>
        <span>{total} total</span>
      </div>
      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-gray-600 to-gray-800 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        />
      </div>
    </div>
  );
};

export default InfiniteScrollLoader;
