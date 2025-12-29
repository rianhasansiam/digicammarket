'use client';

import React, { memo, useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FiArrowRight } from 'react-icons/fi';
import { Loader2, CheckCircle } from 'lucide-react';
import ProductCard from '../shared/ProductCard';
import { useClientInfiniteScroll } from '../../../lib/hooks/useInfiniteScroll';

const FeaturedProductsClient = memo(({ products = [] }) => {
  // Sort products by newest first (same as all products page)
  const sortedProducts = useMemo(() => {
    return [...products].sort((a, b) => {
      const dateA = new Date(a.createdAt || 0);
      const dateB = new Date(b.createdAt || 0);
      return dateB - dateA;
    });
  }, [products]);

  // Use infinite scroll - show 8 initially, load 4 more on scroll
  const {
    visibleItems: featuredProducts,
    loading,
    hasMore,
    totalCount,
    displayCount,
    loadMore,
    loadMoreRef
  } = useClientInfiniteScroll({
    allItems: sortedProducts,
    itemsPerPage: 8
  });

  return (
    <section className="py-8 sm:py-12 md:py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-12">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 sm:mb-4"
          >
            Featured Products
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-gray-600 max-w-2xl mx-auto"
          >
            Discover our handpicked selection of premium products.
          </motion.p>
          {totalCount > 0 && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-gray-500 mt-2"
            >
              Showing {displayCount} of {totalCount} products
            </motion.p>
          )}
        </div>

        {featuredProducts.length > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4 md:gap-6 mb-6 sm:mb-8">
              {featuredProducts.map((product, index) => (
                <motion.div
                  key={product._id || product.id || `featured-product-${index}`}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: Math.min(index * 0.05, 0.3) }}
                >
                  <ProductCard 
                    product={product}
                    priority={index < 4}
                  />
                </motion.div>
              ))}
            </div>

            {/* Infinite Scroll Loader */}
            <div 
              ref={loadMoreRef}
              className="flex flex-col items-center justify-center py-6"
            >
              {loading ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center gap-3"
                >
                  <Loader2 className="w-8 h-8 animate-spin text-gray-600" />
                  <span className="text-sm text-gray-500">Loading more products...</span>
                </motion.div>
              ) : hasMore ? (
                <motion.button
                  onClick={loadMore}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors"
                >
                  <span className="text-sm font-medium">Load More</span>
                </motion.button>
              ) : displayCount > 8 ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 text-gray-500"
                >
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-sm font-medium">You've seen all featured products</span>
                </motion.div>
              ) : null}
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">No featured products available</p>
          </div>
        )}

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-4"
        >
          <Link href="/allProducts">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center px-5 py-2.5 sm:px-6 sm:py-3 md:px-8 md:py-4 bg-black text-white rounded-full hover:bg-gray-800 transition-colors duration-200 group text-sm sm:text-base"
            >
              <span className="mr-2">View All Products</span>
              <FiArrowRight 
                className="group-hover:translate-x-1 transition-transform duration-200" 
                size={18} 
              />
            </motion.button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
});

FeaturedProductsClient.displayName = 'FeaturedProductsClient';

export default FeaturedProductsClient;