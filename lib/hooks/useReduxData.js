'use client';

import { useEffect, useCallback, useMemo, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/redux/reduxHooks';
import {
  fetchProducts,
  fetchCategories,
  fetchReviews,
  fetchUsers,
  fetchOrders,
  fetchCoupons,
  fetchContacts,
  fetchShippingTaxSettings,
  fetchBusinessTracking,
  fetchSales,
  fetchBanners,
  fetchInitialData,
  selectProducts,
  selectCategories,
  selectReviews,
  selectUsers,
  selectOrders,
  selectCoupons,
  selectContacts,
  selectShippingTaxSettings,
  selectBusinessTracking,
  selectSales,
  selectBanners,
  selectGlobalLoading,
  selectInitialDataLoaded,
  selectProductById,
  selectReviewsByProductId,
  selectApprovedReviews,
  selectOrdersByUserId,
  clearCache as clearCacheAction
} from '@/app/redux/dataSlice';

// Map of entity names to their fetch actions and selectors
const entityConfig = {
  products: {
    fetchAction: fetchProducts,
    selector: selectProducts
  },
  categories: {
    fetchAction: fetchCategories,
    selector: selectCategories
  },
  reviews: {
    fetchAction: fetchReviews,
    selector: selectReviews
  },
  users: {
    fetchAction: fetchUsers,
    selector: selectUsers
  },
  orders: {
    fetchAction: fetchOrders,
    selector: selectOrders
  },
  coupons: {
    fetchAction: fetchCoupons,
    selector: selectCoupons
  },
  contacts: {
    fetchAction: fetchContacts,
    selector: selectContacts
  },
  shippingTaxSettings: {
    fetchAction: fetchShippingTaxSettings,
    selector: selectShippingTaxSettings
  },
  businessTracking: {
    fetchAction: fetchBusinessTracking,
    selector: selectBusinessTracking
  },
  sales: {
    fetchAction: fetchSales,
    selector: selectSales
  },
  banners: {
    fetchAction: fetchBanners,
    selector: selectBanners
  }
};

/**
 * Custom hook to fetch and cache data using Redux store
 * This hook replaces individual useGetData calls and provides centralized caching
 * 
 * @param {Object} options
 * @param {string} options.entity - The entity to fetch (products, categories, reviews, etc.)
 * @param {boolean} options.enabled - Whether to enable fetching (default: true)
 * @param {Object} options.params - Additional parameters for the fetch
 * @returns {Object} - { data, isLoading, error, refetch, hasData, isEmpty, count }
 */
export const useReduxData = ({ entity, enabled = true, params = {} }) => {
  const dispatch = useAppDispatch();
  const fetchInitiatedRef = useRef(false);
  
  const config = entityConfig[entity];
  
  // Get the selector - must be called unconditionally
  const selector = config?.selector || selectProducts; // fallback to products selector
  const entityState = useAppSelector(selector);
  
  // Fetch data on mount if enabled and not already loaded
  useEffect(() => {
    if (!config) return;
    
    // Check if we should fetch - only once per mount if not already fetched
    const shouldFetch = enabled && 
                        !fetchInitiatedRef.current && 
                        !entityState.isLoading && 
                        entityState.lastFetched === null;
    
    if (shouldFetch) {
      fetchInitiatedRef.current = true;
      dispatch(config.fetchAction(params));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, entity, dispatch]);
  
  // Reset ref when entity changes
  useEffect(() => {
    fetchInitiatedRef.current = false;
  }, [entity]);
  
  // Check if data exists - handle both arrays and objects
  const hasData = entityState.data !== null && entityState.data !== undefined && (
    Array.isArray(entityState.data) ? entityState.data.length > 0 : Object.keys(entityState.data).length > 0
  );
  
  // Refetch function
  const refetch = useCallback(() => {
    if (!config) return;
    dispatch(clearCacheAction({ entity }));
    dispatch(config.fetchAction(params));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, entity]);
  
  // Handle invalid entity
  if (!config) {
    console.error(`Unknown entity: ${entity}. Available entities: ${Object.keys(entityConfig).join(', ')}`);
    return {
      data: null,
      isLoading: false,
      error: `Unknown entity: ${entity}`,
      refetch: () => {},
      hasData: false,
      isEmpty: true,
      count: 0
    };
  }
  
  return {
    data: entityState.data,
    isLoading: entityState.isLoading,
    error: entityState.error,
    refetch,
    hasData,
    isEmpty: !hasData,
    count: entityState.data ? (Array.isArray(entityState.data) ? entityState.data.length : 1) : 0,
    lastFetched: entityState.lastFetched
  };
};

/**
 * Hook to fetch all initial data at once (products, categories, reviews)
 * Use this in the root layout or main page component
 */
export const useInitialData = () => {
  const dispatch = useAppDispatch();
  const globalLoading = useAppSelector(selectGlobalLoading);
  const initialDataLoaded = useAppSelector(selectInitialDataLoaded);
  const products = useAppSelector(selectProducts);
  const categories = useAppSelector(selectCategories);
  const reviews = useAppSelector(selectReviews);
  
  useEffect(() => {
    if (!initialDataLoaded && !globalLoading) {
      dispatch(fetchInitialData());
    }
  }, [dispatch, initialDataLoaded, globalLoading]);
  
  return {
    isLoading: globalLoading || products.isLoading || categories.isLoading || reviews.isLoading,
    isLoaded: initialDataLoaded,
    products: products.data,
    categories: categories.data,
    reviews: reviews.data,
    hasError: products.error || categories.error || reviews.error
  };
};

/**
 * Hook to get products from Redux store
 */
export const useProducts = (enabled = true) => {
  return useReduxData({ entity: 'products', enabled });
};

/**
 * Hook to get categories from Redux store
 */
export const useCategories = (enabled = true) => {
  return useReduxData({ entity: 'categories', enabled });
};

/**
 * Hook to get reviews from Redux store
 */
export const useReviews = (enabled = true, params = {}) => {
  return useReduxData({ entity: 'reviews', enabled, params });
};

/**
 * Hook to get users from Redux store
 */
export const useUsers = (enabled = true) => {
  return useReduxData({ entity: 'users', enabled });
};

/**
 * Hook to get orders from Redux store
 */
export const useOrders = (enabled = true) => {
  return useReduxData({ entity: 'orders', enabled });
};

/**
 * Hook to get coupons from Redux store
 */
export const useCoupons = (enabled = true) => {
  return useReduxData({ entity: 'coupons', enabled });
};

/**
 * Hook to get contacts from Redux store
 */
export const useContacts = (enabled = true) => {
  return useReduxData({ entity: 'contacts', enabled });
};

/**
 * Hook to get shipping tax settings from Redux store
 */
export const useShippingTax = (enabled = true) => {
  return useReduxData({ entity: 'shippingTaxSettings', enabled });
};

/**
 * Hook to get business tracking from Redux store
 */
export const useBusinessTracking = (enabled = true) => {
  return useReduxData({ entity: 'businessTracking', enabled });
};

/**
 * Hook to get sales from Redux store - always fetches fresh data (no caching)
 */
export const useSales = (enabled = true, params = {}) => {
  const dispatch = useAppDispatch();
  const entityState = useAppSelector(selectSales);
  const config = entityConfig.sales;
  
  // Always fetch fresh on mount - no caching for sales
  useEffect(() => {
    if (!enabled) return;
    
    if (!entityState.isLoading) {
      dispatch(config.fetchAction(params));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);
  
  // Refetch function - clears cache and fetches fresh
  const refetch = useCallback(() => {
    dispatch(clearCacheAction({ entity: 'sales' }));
    if (config?.fetchAction) {
      dispatch(config.fetchAction(params));
    }
  }, [dispatch, params, config]);
  
  const hasData = entityState.data !== null && entityState.data !== undefined && 
                  (Array.isArray(entityState.data) ? entityState.data.length > 0 : true);
  
  return {
    data: entityState.data,
    isLoading: entityState.isLoading,
    error: entityState.error,
    refetch,
    hasData,
    isEmpty: !hasData,
    count: entityState.data ? (Array.isArray(entityState.data) ? entityState.data.length : 1) : 0,
    lastFetched: entityState.lastFetched
  };
};

/**
 * Hook to get banners from Redux store
 */
export const useBanners = (enabled = true, params = {}) => {
  return useReduxData({ entity: 'banners', enabled, params });
};

/**
 * Hook to get a single product by ID from cached data
 */
export const useProductById = (productId) => {
  const dispatch = useAppDispatch();
  const products = useAppSelector(selectProducts);
  const product = useAppSelector(selectProductById(productId));
  
  // Fetch products if not loaded
  useEffect(() => {
    if (!products.data?.length && !products.isLoading) {
      dispatch(fetchProducts());
    }
  }, [dispatch, products.data?.length, products.isLoading]);
  
  return {
    data: product,
    isLoading: products.isLoading,
    error: products.error,
    hasData: Boolean(product)
  };
};

/**
 * Hook to get reviews for a specific product from cached data
 */
export const useProductReviews = (productId) => {
  const dispatch = useAppDispatch();
  const reviews = useAppSelector(selectReviews);
  const productReviews = useAppSelector(selectReviewsByProductId(productId));
  
  // Fetch reviews if not loaded
  useEffect(() => {
    if (!reviews.data?.length && !reviews.isLoading) {
      dispatch(fetchReviews());
    }
  }, [dispatch, reviews.data?.length, reviews.isLoading]);
  
  return {
    data: productReviews,
    isLoading: reviews.isLoading,
    error: reviews.error,
    hasData: productReviews.length > 0,
    count: productReviews.length
  };
};

/**
 * Hook to get approved reviews from cached data
 */
export const useApprovedReviews = () => {
  const dispatch = useAppDispatch();
  const reviews = useAppSelector(selectReviews);
  const approvedReviews = useAppSelector(selectApprovedReviews);
  
  // Fetch reviews if not loaded
  useEffect(() => {
    if (!reviews.data?.length && !reviews.isLoading) {
      dispatch(fetchReviews());
    }
  }, [dispatch, reviews.data?.length, reviews.isLoading]);
  
  return {
    data: approvedReviews,
    isLoading: reviews.isLoading,
    error: reviews.error,
    hasData: approvedReviews.length > 0,
    count: approvedReviews.length
  };
};

/**
 * Hook to get orders for a specific user from cached data
 */
export const useUserOrders = (userId) => {
  const dispatch = useAppDispatch();
  const orders = useAppSelector(selectOrders);
  const userOrders = useAppSelector(selectOrdersByUserId(userId));
  
  // Fetch orders if not loaded
  useEffect(() => {
    if (!orders.data?.length && !orders.isLoading) {
      dispatch(fetchOrders());
    }
  }, [dispatch, orders.data?.length, orders.isLoading]);
  
  return {
    data: userOrders,
    isLoading: orders.isLoading,
    error: orders.error,
    hasData: userOrders.length > 0,
    count: userOrders.length
  };
};

/**
 * Hook to manually clear cache and refetch data
 */
export const useClearCache = () => {
  const dispatch = useAppDispatch();
  
  const clearCache = useCallback((entity) => {
    dispatch(clearCacheAction({ entity }));
  }, [dispatch]);
  
  const clearAndRefetch = useCallback((entity) => {
    const config = entityConfig[entity];
    if (config) {
      dispatch(clearCacheAction({ entity }));
      dispatch(config.fetchAction());
    }
  }, [dispatch]);
  
  return { clearCache, clearAndRefetch };
};
