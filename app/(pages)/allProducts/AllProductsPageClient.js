'use client';

import { useProducts, useCategories } from "@/lib/hooks/useReduxData";
import LoadingSpinner from "../../componets/loading/LoadingSpinner";
import BreadcrumbShop from './filters/BreadcrumbShop';
import ProductsPageClient from './ProductsPageClient';

export default function AllProductsPageClient() {
  // 🚀 OPTIMIZED: Use Redux store for centralized data caching - NO duplicate API calls
  const { data: productsData, isLoading, error } = useProducts();
  const { data: categoriesData, isLoading: categoriesLoading } = useCategories();

  // Show loading state at page level
  const pageLoading = isLoading || categoriesLoading;

  if (pageLoading && !productsData?.length && !categoriesData?.length) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <LoadingSpinner size="lg" color="black" />
        <p className="mt-4 text-gray-500">Loading products...</p>
      </div>
    );
  }

  if (error && !productsData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Unable to load products</h2>
          <p className="text-gray-600 mb-6">Please try refreshing the page</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="pb-12 sm:pb-16 md:pb-20 container mx-auto">
      <div className="max-w-frame mx-auto px-2 sm:px-4 xl:px-0">
        <hr className="h-[1px] border-t-black/10 mb-5 sm:mb-6" />
        <BreadcrumbShop />
        <ProductsPageClient 
          productsData={productsData} 
          categoriesData={categoriesData} 
        />
      </div>
    </main>
  );
}