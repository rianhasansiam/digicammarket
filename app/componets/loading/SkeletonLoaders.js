'use client';

import { motion } from 'framer-motion';

// Shared shimmer animation variants
const shimmerVariants = {
  initial: { x: '-100%' },
  animate: { x: '100%' }
};

const ProductCardSkeleton = () => {
  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Image skeleton */}
      <div className="relative h-48 bg-gray-200 overflow-hidden">
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
          variants={shimmerVariants}
          initial="initial"
          animate="animate"
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      </div>

      <div className="p-4 space-y-3">
        {/* Title skeleton */}
        <div className="relative h-4 bg-gray-200 rounded overflow-hidden">
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
            variants={shimmerVariants}
            initial="initial"
            animate="animate"
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "linear",
              delay: 0.1
            }}
          />
        </div>

        {/* Price skeleton */}
        <div className="relative h-3 bg-gray-200 rounded w-2/3 overflow-hidden">
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
            variants={shimmerVariants}
            initial="initial"
            animate="animate"
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "linear",
              delay: 0.2
            }}
          />
        </div>

        {/* Buttons skeleton */}
        <div className="flex space-x-2 pt-2">
          <div className="relative flex-1 h-8 bg-gray-200 rounded overflow-hidden">
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
              variants={shimmerVariants}
              initial="initial"
              animate="animate"
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "linear",
                delay: 0.3
              }}
            />
          </div>
          <div className="relative w-8 h-8 bg-gray-200 rounded overflow-hidden">
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
              variants={shimmerVariants}
              initial="initial"
              animate="animate"
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "linear",
                delay: 0.4
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const ProductGridSkeleton = ({ count = 8 }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  );
};

const CategorySkeleton = () => {
  return (
    <div className="flex items-center space-x-4 p-4 bg-white rounded-lg">
      {/* Icon skeleton */}
      <div className="relative w-12 h-12 bg-gray-200 rounded-lg overflow-hidden">
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
          variants={shimmerVariants}
          initial="initial"
          animate="animate"
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      </div>

      <div className="flex-1 space-y-2">
        {/* Name skeleton */}
        <div className="relative h-4 bg-gray-200 rounded w-3/4 overflow-hidden">
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
            variants={shimmerVariants}
            initial="initial"
            animate="animate"
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "linear",
              delay: 0.1
            }}
          />
        </div>

        {/* Count skeleton */}
        <div className="relative h-3 bg-gray-200 rounded w-1/2 overflow-hidden">
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
            variants={shimmerVariants}
            initial="initial"
            animate="animate"
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "linear",
              delay: 0.2
            }}
          />
        </div>
      </div>
    </div>
  );
};

const CategoriesSkeleton = ({ count = 6 }) => {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, index) => (
        <CategorySkeleton key={index} />
      ))}
    </div>
  );
};

const TextSkeleton = ({ lines = 3, className = '' }) => {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <div key={index} className={`relative h-4 bg-gray-200 rounded overflow-hidden ${
          index === lines - 1 ? 'w-3/4' : 'w-full'
        }`}>
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
            variants={shimmerVariants}
            initial="initial"
            animate="animate"
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "linear",
              delay: index * 0.1
            }}
          />
        </div>
      ))}
    </div>
  );
};

export {
  ProductCardSkeleton,
  ProductGridSkeleton,
  CategorySkeleton,
  CategoriesSkeleton,
  TextSkeleton
};