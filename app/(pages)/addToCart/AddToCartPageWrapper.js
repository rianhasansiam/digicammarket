'use client';

import { useProducts, useCoupons } from '@/lib/hooks/useReduxData';
import LoadingSpinner from '../../componets/loading/LoadingSpinner';
import AddToCartPageClient from './AddToCartPageClient';

export default function AddToCartPageWrapper() {
  // 🚀 OPTIMIZED: Use Redux store for centralized data caching - NO duplicate API calls
  const { data: productsData, isLoading: productsLoading, error: productsError } = useProducts();
  const { data: couponsData, isLoading: couponsLoading } = useCoupons();

  // Show loading state at page level
  const isLoading = productsLoading || couponsLoading;

  if (isLoading && !productsData?.length && !couponsData?.length) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="min-h-screen flex flex-col items-center justify-center">
          <div className="text-black text-center mb-8">
            <h1 className="text-6xl font-bold mb-4">Digicam Market</h1>
            <p className="text-xl mb-6">Loading your cart...</p>
          </div>
          <LoadingSpinner size="lg" color="black" />
        </div>
      </main>
    );
  }

  if (productsError && !productsData) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Unable to load cart</h2>
            <p className="text-gray-600 mb-6">Please try refreshing the page</p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <AddToCartPageClient 
        productsData={productsData}
        couponsData={couponsData}
      />
    </main>
  );
}