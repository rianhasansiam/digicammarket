"use client";

import { useState, useCallback } from "react";
import { FiSliders, FiX } from "react-icons/fi";
import { Search } from "lucide-react";
import CardsClient from "../../componets/cards/CardsClient";
import { FilterProvider, useFilterState, useFilterActions, useFilteredProducts } from "./context/FilterContext";
import SearchBar from "./components/SearchBar";
import EnhancedFilters from "./components/EnhancedFilters";
import InfiniteScrollLoader from "./components/InfiniteScrollLoader";
import { useClientInfiniteScroll } from "../../../lib/hooks/useInfiniteScroll";

// Inner component that uses filter context
const ProductsContent = ({ productsData, categoriesData }) => {
  const filters = useFilterState();
  const { setSortBy } = useFilterActions();
  const processedProducts = useFilteredProducts(productsData);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const productsPerPage = 12;
  
  // Use infinite scroll instead of pagination
  const {
    visibleItems: currentProducts,
    loading,
    hasMore,
    totalCount,
    displayCount,
    loadMore,
    loadMoreRef
  } = useClientInfiniteScroll({
    allItems: processedProducts,
    itemsPerPage: productsPerPage
  });

  const handleSortChange = useCallback((value) => {
    setSortBy(value);
  }, [setSortBy]);

  return (
    <>
      {/* Mobile Filters Overlay */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 xl:hidden">
          <div className="fixed inset-0 bg-transparent transition-opacity" onClick={() => setMobileFiltersOpen(false)} />
          <div className="fixed inset-y-0 left-0 w-full max-w-sm bg-white shadow-xl overflow-y-auto transform transition-transform">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white sticky top-0 z-10">
              <h2 className="text-xl font-semibold text-gray-900">Filters</h2>
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="p-2 -mr-2 text-gray-400 hover:text-gray-500 transition-colors rounded-lg hover:bg-gray-100"
              >
                <FiX size={24} />
              </button>
            </div>
            <div className="p-6 pb-20">
              <EnhancedFilters categoriesData={categoriesData} products={productsData} />
            </div>
            {/* Apply Filters Button for Mobile */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200">
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="w-full bg-black text-white py-3 px-4 rounded-xl font-medium hover:bg-gray-800 transition-colors"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-2 sm:px-4 lg:px-6 py-4 sm:py-6 max-w-7xl">
        {/* Search Bar */}
        <div className="mb-4 sm:mb-6 md:mb-8">
          <SearchBar />
        </div>

        <div className="flex flex-col xl:flex-row xl:gap-8">
          {/* Desktop Filters Sidebar */}
          <div className="hidden xl:block xl:w-80 shrink-0">
            <div className="sticky top-6 border border-gray-200 rounded-2xl p-6 bg-white shadow-sm">
              <EnhancedFilters categoriesData={categoriesData} products={productsData} />
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            <div className="space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">All Products</h1>
                  <button
                    onClick={() => setMobileFiltersOpen(true)}
                    className="xl:hidden flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <FiSliders className="mr-2" size={16} />
                    Filters
                  </button>
                </div>
                
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <span className="text-xs sm:text-sm text-gray-600">
                    Showing {displayCount} of {totalCount} products
                  </span>
                  <div className="flex items-center gap-2">
                    <label htmlFor="sort" className="text-sm text-gray-700 hidden sm:block">Sort by:</label>
                    <select
                      id="sort"
                      value={filters.sortBy}
                      onChange={(e) => handleSortChange(e.target.value)}
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent min-w-[140px]"
                    >
                      <option value="newest">Newest First</option>
                      <option value="most-popular">Most Popular</option>
                      <option value="low-price">Price: Low to High</option>
                      <option value="high-price">Price: High to Low</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Products Grid */}
              <div className="min-h-[400px]">
                {currentProducts.length > 0 ? (
                  <CardsClient products={currentProducts} />
                ) : (
                  <div className="text-center py-16 bg-gray-50 rounded-xl">
                    <Search className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                    <h3 className="text-xl font-medium text-gray-900 mb-2">No products found</h3>
                    <p className="text-gray-500 mb-6">Try adjusting your search or filter criteria</p>
                    <button
                      onClick={() => window.location.reload()}
                      className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                    >
                      Reset Filters
                    </button>
                  </div>
                )}
              </div>

              {/* Infinite Scroll Loader */}
              {totalCount > 0 && (
                <div className="pt-4">
                  <InfiniteScrollLoader
                    ref={loadMoreRef}
                    loading={loading}
                    hasMore={hasMore}
                    totalCount={totalCount}
                    displayCount={displayCount}
                    onLoadMore={loadMore}
                    loadingText="Loading more products..."
                    endText="You've seen all products"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

const ProductsPageClient = ({ productsData, categoriesData }) => {
  return (
    <FilterProvider initialProducts={productsData}>
      <ProductsContent productsData={productsData} categoriesData={categoriesData} />
    </FilterProvider>
  );
};

export default ProductsPageClient;
