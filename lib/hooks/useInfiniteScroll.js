"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';

/**
 * Custom hook for infinite scroll functionality
 * @param {Object} options - Configuration options
 * @param {string} options.endpoint - API endpoint to fetch from
 * @param {number} options.limit - Number of items per page
 * @param {boolean} options.enabled - Whether to enable fetching
 * @returns {Object} - Infinite scroll state and controls
 */
export const useInfiniteScroll = ({ 
  endpoint = '/api/products', 
  limit = 12,
  enabled = true 
}) => {
  const [data, setData] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  
  const observerRef = useRef(null);
  const loadMoreRef = useRef(null);

  // Fetch data for a specific page
  const fetchData = useCallback(async (pageNum, isInitial = false) => {
    if (!enabled) return;
    
    try {
      if (isInitial) {
        setInitialLoading(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const response = await axios.get(`${endpoint}?page=${pageNum}&limit=${limit}`);
      const result = response.data;

      if (result.pagination) {
        // Paginated response
        const { products, pagination } = result;
        
        if (isInitial) {
          setData(products);
        } else {
          setData(prev => [...prev, ...products]);
        }
        
        setHasMore(pagination.hasMore);
        setTotalCount(pagination.total);
      } else {
        // Backward compatible: array response (all products)
        setData(result);
        setHasMore(false);
        setTotalCount(result.length);
      }
    } catch (err) {
      console.error('Infinite scroll fetch error:', err);
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  }, [endpoint, limit, enabled]);

  // Initial fetch
  useEffect(() => {
    if (enabled) {
      setPage(1);
      setData([]);
      setHasMore(true);
      fetchData(1, true);
    }
  }, [enabled, endpoint, limit]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load more function
  const loadMore = useCallback(() => {
    if (!loading && !initialLoading && hasMore && enabled) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchData(nextPage, false);
    }
  }, [loading, initialLoading, hasMore, page, fetchData, enabled]);

  // Intersection Observer for auto-loading
  useEffect(() => {
    if (!enabled) return;

    const currentRef = loadMoreRef.current;
    
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !initialLoading) {
          loadMore();
        }
      },
      { 
        root: null,
        rootMargin: '100px', // Start loading 100px before element is visible
        threshold: 0.1 
      }
    );

    if (currentRef) {
      observerRef.current.observe(currentRef);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, loading, initialLoading, loadMore, enabled]);

  // Reset function
  const reset = useCallback(() => {
    setPage(1);
    setData([]);
    setHasMore(true);
    setError(null);
    if (enabled) {
      fetchData(1, true);
    }
  }, [fetchData, enabled]);

  return {
    data,
    loading,
    initialLoading,
    hasMore,
    error,
    totalCount,
    loadMore,
    reset,
    loadMoreRef, // Ref to attach to the sentinel element
    currentPage: page
  };
};

/**
 * Hook for client-side infinite scroll (when all data is already loaded)
 * This is useful when filtering/sorting is done client-side
 * @param {Object} options - Configuration options
 * @param {Array} options.allItems - All items to paginate through
 * @param {number} options.itemsPerPage - Number of items to show per load
 * @returns {Object} - Infinite scroll state and controls
 */
export const useClientInfiniteScroll = ({ 
  allItems = [], 
  itemsPerPage = 12 
}) => {
  const [displayCount, setDisplayCount] = useState(itemsPerPage);
  const [loading, setLoading] = useState(false);
  
  const observerRef = useRef(null);
  const loadMoreRef = useRef(null);

  // Current visible items
  const visibleItems = allItems.slice(0, displayCount);
  const hasMore = displayCount < allItems.length;
  const totalCount = allItems.length;

  // Reset when allItems changes (e.g., after filtering)
  useEffect(() => {
    setDisplayCount(itemsPerPage);
  }, [allItems, itemsPerPage]);

  // Load more function
  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      setLoading(true);
      // Small delay for smooth UX
      setTimeout(() => {
        setDisplayCount(prev => Math.min(prev + itemsPerPage, allItems.length));
        setLoading(false);
      }, 300);
    }
  }, [loading, hasMore, itemsPerPage, allItems.length]);

  // Intersection Observer for auto-loading
  useEffect(() => {
    const currentRef = loadMoreRef.current;
    
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadMore();
        }
      },
      { 
        root: null,
        rootMargin: '200px', // Start loading 200px before element is visible
        threshold: 0.1 
      }
    );

    if (currentRef) {
      observerRef.current.observe(currentRef);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, loading, loadMore]);

  // Reset function
  const reset = useCallback(() => {
    setDisplayCount(itemsPerPage);
  }, [itemsPerPage]);

  return {
    visibleItems,
    loading,
    hasMore,
    totalCount,
    displayCount,
    loadMore,
    reset,
    loadMoreRef
  };
};

export default useInfiniteScroll;
