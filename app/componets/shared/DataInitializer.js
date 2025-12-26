'use client';

import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/redux/reduxHooks';
import {
  fetchInitialData,
  selectGlobalLoading,
  selectInitialDataLoaded,
  selectProducts,
  selectCategories
} from '@/app/redux/dataSlice';

/**
 * DataInitializer Component
 * 
 * This component is responsible for fetching initial data (products, categories, reviews)
 * when the app starts. It should be placed in the root layout or providers.
 * 
 * Benefits:
 * - Fetches data ONCE when app loads
 * - Data is stored in Redux and available to all components
 * - Prevents duplicate API calls across different pages/components
 * - Smart caching prevents unnecessary refetches
 */
export default function DataInitializer({ children }) {
  const dispatch = useAppDispatch();
  const globalLoading = useAppSelector(selectGlobalLoading);
  const initialDataLoaded = useAppSelector(selectInitialDataLoaded);
  const products = useAppSelector(selectProducts);
  const categories = useAppSelector(selectCategories);
  
  useEffect(() => {
    // Only fetch if data hasn't been loaded yet
    if (!initialDataLoaded && !globalLoading && !products.data.length && !categories.data.length) {
      dispatch(fetchInitialData());
    }
  }, [dispatch, initialDataLoaded, globalLoading, products.data.length, categories.data.length]);
  
  return children;
}

/**
 * Hook to check if initial data is ready
 * Use this in components that need to wait for initial data
 */
export const useDataReady = () => {
  const products = useAppSelector(selectProducts);
  const categories = useAppSelector(selectCategories);
  const globalLoading = useAppSelector(selectGlobalLoading);
  const initialDataLoaded = useAppSelector(selectInitialDataLoaded);
  
  return {
    isReady: initialDataLoaded || (products.data.length > 0 && categories.data.length > 0),
    isLoading: globalLoading || products.isLoading || categories.isLoading,
    hasProducts: products.data.length > 0,
    hasCategories: categories.data.length > 0
  };
};
