'use client';

import { RotateCcw } from 'lucide-react';
import { useFilterActions, useFilterState } from '../context/FilterContext';
import CategoryFilter from './CategoryFilter';
import PriceRangeFilter from './PriceRangeFilter';
import ColorFilter from './ColorFilter';
import SizeFilter from './SizeFilter';
import StyleFilter from './StyleFilter';
import StockFilter from './StockFilter';

const EnhancedFilters = ({ categoriesData, products }) => {
  const filters = useFilterState();
  const { clearAllFilters } = useFilterActions();
  
  // Calculate max price from products
  const maxPrice = products?.length > 0 
    ? Math.max(...products.map(p => p.price || 0), 1000000)
    : 1000000;
  
  // Check if any filters are applied
  const hasActiveFilters = 
    filters.search || 
    filters.category || 
    filters.style || 
    filters.colors.length > 0 || 
    filters.sizes.length > 0 || 
    filters.priceRange.min > 0 || 
    filters.priceRange.max < maxPrice || 
    filters.inStock;
  
  // Handle clear all filters with proper initial state
  const handleClearFilters = () => {
    const initialState = {
      search: '',
      category: '',
      priceRange: { min: 0, max: maxPrice },
      colors: [],
      sizes: [],
      style: '',
      inStock: false,
      sortBy: 'newest'
    };
    clearAllFilters(initialState);
  };

  return (
    <div className="space-y-6">
      {/* Filter Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
        {hasActiveFilters && (
          <button
            onClick={handleClearFilters}
            className="flex items-center text-sm text-red-600 hover:text-red-800 transition-colors"
          >
            <RotateCcw size={14} className="mr-1" />
            Clear All
          </button>
        )}
      </div>
      
      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-sm text-gray-600 mb-2">Active filters:</p>
          <div className="flex flex-wrap gap-2">
            {filters.category && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-black text-white">
                {filters.category}
              </span>
            )}
            {filters.style && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-black text-white">
                {filters.style}
              </span>
            )}
            {filters.colors.map(color => (
              <span key={color} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-black text-white">
                {color}
              </span>
            ))}
            {filters.sizes.map(size => (
              <span key={size} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-black text-white">
                {size}
              </span>
            ))}
            {(filters.priceRange.min > 0 || filters.priceRange.max < maxPrice) && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-black text-white">
                ৳{filters.priceRange.min}-৳{filters.priceRange.max}
              </span>
            )}
            {filters.inStock && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-600 text-white">
                In Stock
              </span>
            )}
          </div>
        </div>
      )}
      
      {/* Filter Components */}
      <div className="space-y-6">
        <CategoryFilter categoriesData={categoriesData} />
        <PriceRangeFilter products={products} />
        <ColorFilter products={products} />
        <SizeFilter products={products} />
        <StyleFilter products={products} />
        <StockFilter />
      </div>
    </div>
  );
};

export default EnhancedFilters;