'use client';

import React, { memo } from 'react';
import { motion } from 'framer-motion';
import ProductCard from '../shared/ProductCard';

const CardsClient = memo(({ products = [] }) => {
  if (!products.length) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No products available at the moment.</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Products Grid with improved responsive layout */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4 lg:gap-6 items-stretch">
        {products.map((product, index) => (
          <motion.div
            key={product._id || product.id || `product-card-${index}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.05 }}
            whileHover={{ y: -3 }}
            className="group"
          >
            <ProductCard 
              product={product}
              priority={index < 4}
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
});

CardsClient.displayName = 'CardsClient';

export default CardsClient;
