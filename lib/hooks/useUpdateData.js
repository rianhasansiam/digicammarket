'use client';

import axios from "axios";
import { useState, useCallback } from "react";
import { useAppDispatch } from '@/app/redux/reduxHooks';
import { 
  clearCache,
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
  fetchBanners
} from '@/app/redux/dataSlice';

// Entity to Redux entity name mapping
const entityMapping = {
  'allCategories': 'categories',
  'allProducts': 'products',
  'allReviews': 'reviews',
  'allUsers': 'users',
  'allOrders': 'orders',
  'allCoupons': 'coupons',
  'allContacts': 'contacts',
  'allSales': 'sales',
  'heroBanners': 'banners',
  // Direct mappings
  'categories': 'categories',
  'products': 'products',
  'reviews': 'reviews',
  'users': 'users',
  'orders': 'orders',
  'coupons': 'coupons',
  'contacts': 'contacts',
  'sales': 'sales',
  'banners': 'banners',
  'shippingTaxSettings': 'shippingTaxSettings',
  'businessTracking': 'businessTracking'
};

// Related entities that should be invalidated together
const relatedEntities = {
  'products': ['categories'],
  'reviews': ['products'],
  'orders': ['users', 'products'],
  'categories': ['products'],
  'sales': ['products'],
  'banners': []
};

// Entity to fetch action mapping
const entityFetchActions = {
  'products': fetchProducts,
  'categories': fetchCategories,
  'reviews': fetchReviews,
  'users': fetchUsers,
  'orders': fetchOrders,
  'coupons': fetchCoupons,
  'contacts': fetchContacts,
  'shippingTaxSettings': fetchShippingTaxSettings,
  'businessTracking': fetchBusinessTracking,
  'sales': fetchSales,
  'banners': fetchBanners
};

/**
 * Hook for updating data with Redux cache invalidation
 * @param {Object} options - { name: entityName, api: apiEndpoint, onSuccess?: callback }
 */
export const useUpdateData = ({ name, api, onSuccess }) => {
  const dispatch = useAppDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // updateData accepts either { id, data } or just data object with _id
  const updateData = useCallback(async (updatePayload) => {
    setIsLoading(true);
    setError(null);
    
    try {
      let response;
      
      // Handle both formats: { id, data } or just data object
      if (updatePayload.id !== undefined && updatePayload.data !== undefined) {
        // Format: { id, data }
        response = await axios.put(`${api}/${updatePayload.id}`, updatePayload.data);
      } else {
        // Format: data object with _id (PUT to base endpoint)
        response = await axios.put(api, updatePayload);
      }
      
      // Get the Redux entity name
      const reduxEntity = entityMapping[name] || name;
      
      // Clear cache and immediately refetch fresh data from database
      dispatch(clearCache({ entity: reduxEntity }));
      
      // Immediately fetch fresh data to update Redux store
      const fetchAction = entityFetchActions[reduxEntity];
      if (fetchAction) {
        dispatch(fetchAction());
      }
      
      // Also invalidate and refetch related entities
      const related = relatedEntities[reduxEntity] || [];
      related.forEach(relatedEntity => {
        dispatch(clearCache({ entity: relatedEntity }));
        const relatedFetchAction = entityFetchActions[relatedEntity];
        if (relatedFetchAction) {
          dispatch(relatedFetchAction());
        }
      });
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess(response.data);
      }
      
      setIsLoading(false);
      return response.data;
    } catch (err) {
      console.error('API Error details:', err.response?.data);
      const errorMessage = err.response?.data?.error || err.response?.data?.message || 'Failed to update data';
      setError(errorMessage);
      setIsLoading(false);
      throw new Error(errorMessage);
    }
  }, [api, name, dispatch, onSuccess]);

  return { 
    updateData,
    updateDataAsync: updateData, // Alias for async usage
    isLoading, 
    isPending: isLoading,
    error 
  };
};
