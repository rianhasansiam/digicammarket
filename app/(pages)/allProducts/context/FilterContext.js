'use client';

import React, { createContext, useContext, useReducer, useMemo, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

// Filter state structure
const getInitialState = (products = []) => {
  // Calculate max price from products, default to 1000000 if no products
  const maxPrice = products.length > 0 
    ? Math.max(...products.map(p => p.price || 0), 1000000)
    : 1000000;
  
  return {
    search: '',
    category: '',
    priceRange: { min: 0, max: maxPrice },
    colors: [],
    sizes: [],
    style: '',
    inStock: false,
    sortBy: 'newest'
  };
};

// Default initial state
const initialState = getInitialState();

// Filter actions
const FILTER_ACTIONS = {
  SET_SEARCH: 'SET_SEARCH',
  SET_CATEGORY: 'SET_CATEGORY', 
  SET_PRICE_RANGE: 'SET_PRICE_RANGE',
  SET_COLORS: 'SET_COLORS',
  SET_SIZES: 'SET_SIZES',
  SET_STYLE: 'SET_STYLE',
  SET_IN_STOCK: 'SET_IN_STOCK',
  SET_SORT_BY: 'SET_SORT_BY',
  CLEAR_ALL_FILTERS: 'CLEAR_ALL_FILTERS',
  INIT_FROM_URL: 'INIT_FROM_URL'
};

// Reducer function
const filterReducer = (state, action) => {
  switch (action.type) {
    case FILTER_ACTIONS.SET_SEARCH:
      return { ...state, search: action.payload };
    
    case FILTER_ACTIONS.SET_CATEGORY:
      return { ...state, category: action.payload };
    
    case FILTER_ACTIONS.SET_PRICE_RANGE:
      return { ...state, priceRange: action.payload };
    
    case FILTER_ACTIONS.SET_COLORS:
      return { ...state, colors: action.payload };
    
    case FILTER_ACTIONS.SET_SIZES:
      return { ...state, sizes: action.payload };
    
    case FILTER_ACTIONS.SET_STYLE:
      return { ...state, style: action.payload };
    
    case FILTER_ACTIONS.SET_IN_STOCK:
      return { ...state, inStock: action.payload };
    
    case FILTER_ACTIONS.SET_SORT_BY:
      return { ...state, sortBy: action.payload };
    
    case FILTER_ACTIONS.CLEAR_ALL_FILTERS:
      return { ...action.payload, sortBy: state.sortBy };
    
    case FILTER_ACTIONS.INIT_FROM_URL:
      return { ...state, ...action.payload };
    
    default:
      return state;
  }
};

// Create contexts
const FilterStateContext = createContext(null);
const FilterDispatchContext = createContext(null);

// Custom hooks
export const useFilterState = () => {
  const context = useContext(FilterStateContext);
  if (!context) {
    throw new Error('useFilterState must be used within a FilterProvider');
  }
  return context;
};

export const useFilterDispatch = () => {
  const context = useContext(FilterDispatchContext);
  if (!context) {
    throw new Error('useFilterDispatch must be used within a FilterProvider');
  }
  return context;
};

// Custom hook for filter actions
export const useFilterActions = () => {
  const dispatch = useFilterDispatch();
  
  return useMemo(() => ({
    setSearch: (search) => dispatch({ type: FILTER_ACTIONS.SET_SEARCH, payload: search }),
    setCategory: (category) => dispatch({ type: FILTER_ACTIONS.SET_CATEGORY, payload: category }),
    setPriceRange: (range) => dispatch({ type: FILTER_ACTIONS.SET_PRICE_RANGE, payload: range }),
    setColors: (colors) => dispatch({ type: FILTER_ACTIONS.SET_COLORS, payload: colors }),
    setSizes: (sizes) => dispatch({ type: FILTER_ACTIONS.SET_SIZES, payload: sizes }),
    setStyle: (style) => dispatch({ type: FILTER_ACTIONS.SET_STYLE, payload: style }),
    setInStock: (inStock) => dispatch({ type: FILTER_ACTIONS.SET_IN_STOCK, payload: inStock }),
    setSortBy: (sortBy) => dispatch({ type: FILTER_ACTIONS.SET_SORT_BY, payload: sortBy }),
    clearAllFilters: (initialState) => dispatch({ type: FILTER_ACTIONS.CLEAR_ALL_FILTERS, payload: initialState }),
    initFromUrl: (params) => dispatch({ type: FILTER_ACTIONS.INIT_FROM_URL, payload: params })
  }), [dispatch]);
};

// Helper functions
const parseUrlParams = (searchParams) => {
  const params = {};
  
  if (searchParams.get('search')) params.search = searchParams.get('search');
  if (searchParams.get('category')) params.category = searchParams.get('category');
  if (searchParams.get('style')) params.style = searchParams.get('style');
  if (searchParams.get('sort')) params.sortBy = searchParams.get('sort');
  if (searchParams.get('inStock')) params.inStock = searchParams.get('inStock') === 'true';
  
  if (searchParams.get('minPrice') || searchParams.get('maxPrice')) {
    params.priceRange = {
      min: parseInt(searchParams.get('minPrice')) || 0,
      max: parseInt(searchParams.get('maxPrice')) || 1000
    };
  }
  
  if (searchParams.get('colors')) {
    params.colors = searchParams.get('colors').split(',');
  }
  
  if (searchParams.get('sizes')) {
    params.sizes = searchParams.get('sizes').split(',');
  }
  
  return params;
};

const buildUrlParams = (filters) => {
  const params = new URLSearchParams();
  
  if (filters.search) params.set('search', filters.search);
  if (filters.category) params.set('category', filters.category);
  if (filters.style) params.set('style', filters.style);
  if (filters.sortBy !== 'newest') params.set('sort', filters.sortBy);
  if (filters.inStock) params.set('inStock', 'true');
  
  if (filters.priceRange.min > 0) params.set('minPrice', filters.priceRange.min.toString());
  if (filters.priceRange.max < 1000000) params.set('maxPrice', filters.priceRange.max.toString());
  
  if (filters.colors.length > 0) params.set('colors', filters.colors.join(','));
  if (filters.sizes.length > 0) params.set('sizes', filters.sizes.join(','));
  
  return params;
};

// Filter products function
export const useFilteredProducts = (products) => {
  const filters = useFilterState();
  
  return useMemo(() => {
    if (!Array.isArray(products)) return [];
    
    let filtered = products.filter(product => {
      // Search filter
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        const matchesSearch = 
          product.name?.toLowerCase().includes(searchTerm) ||
          product.shortDescription?.toLowerCase().includes(searchTerm) ||
          product.description?.toLowerCase().includes(searchTerm) ||
          product.category?.toLowerCase().includes(searchTerm);
        if (!matchesSearch) return false;
      }
      
      // Category filter
      if (filters.category) {
        if (product.category?.toLowerCase() !== filters.category.toLowerCase()) {
          return false;
        }
      }
      
      // Style filter
      if (filters.style) {
        if (product.style?.toLowerCase() !== filters.style.toLowerCase()) {
          return false;
        }
      }
      
      // Price range filter
      if (product.price < filters.priceRange.min || product.price > filters.priceRange.max) {
        return false;
      }
      
      // Colors filter
      if (filters.colors.length > 0) {
        const productColors = product.colors || [];
        const hasMatchingColor = filters.colors.some(color => 
          productColors.some(pColor => pColor.toLowerCase() === color.toLowerCase())
        );
        if (!hasMatchingColor) return false;
      }
      
      // Sizes filter
      if (filters.sizes.length > 0) {
        const productSizes = product.sizes || [];
        const hasMatchingSize = filters.sizes.some(size => 
          productSizes.some(pSize => pSize.toLowerCase() === size.toLowerCase())
        );
        if (!hasMatchingSize) return false;
      }
      
      // Stock filter
      if (filters.inStock && product.stock <= 0) {
        return false;
      }
      
      return true;
    });
    
    // Apply sorting
    switch (filters.sortBy) {
      case 'low-price':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'high-price':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'newest':
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case 'most-popular':
      default:
        // Keep original order or implement popularity logic
        break;
    }
    
    return filtered;
  }, [products, filters]);
};

// Provider component
export const FilterProvider = ({ children, initialProducts = [] }) => {
  // Generate initial state based on products
  const productBasedInitialState = useMemo(() => getInitialState(initialProducts), [initialProducts]);
  const [state, dispatch] = useReducer(filterReducer, productBasedInitialState);
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Initialize from URL on mount
  useEffect(() => {
    const urlParams = parseUrlParams(searchParams);
    if (Object.keys(urlParams).length > 0) {
      dispatch({ type: FILTER_ACTIONS.INIT_FROM_URL, payload: urlParams });
    }
  }, [searchParams]);
  
  // Update URL when filters change (debounced)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const params = buildUrlParams(state);
      const newUrl = params.toString() ? `?${params.toString()}` : '';
      router.replace(`/allProducts${newUrl}`, { scroll: false });
    }, 500);
    
    return () => clearTimeout(timeoutId);
  }, [state, router]);
  
  return (
    <FilterStateContext.Provider value={state}>
      <FilterDispatchContext.Provider value={dispatch}>
        {children}
      </FilterDispatchContext.Provider>
    </FilterStateContext.Provider>
  );
};