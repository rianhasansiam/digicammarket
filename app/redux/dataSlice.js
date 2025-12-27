import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const isDev = process.env.NODE_ENV === 'development';

// Cache duration constants (in milliseconds)
const CACHE_DURATION = {
  STATIC: 60 * 60 * 1000,      // 1 hour for static data (products, categories)
  DYNAMIC: 10 * 60 * 1000,     // 10 minutes for dynamic data (reviews, coupons)
  USER_SPECIFIC: 5 * 60 * 1000 // 5 minutes for user-specific data (orders)
};

// Initial state with all data entities
const initialState = {
  // Products
  products: {
    data: [],
    isLoading: false,
    error: null,
    lastFetched: null,
    cacheType: 'STATIC'
  },
  
  // Categories
  categories: {
    data: [],
    isLoading: false,
    error: null,
    lastFetched: null,
    cacheType: 'STATIC'
  },
  
  // Reviews
  reviews: {
    data: [],
    isLoading: false,
    error: null,
    lastFetched: null,
    cacheType: 'DYNAMIC'
  },
  
  // Users
  users: {
    data: [],
    isLoading: false,
    error: null,
    lastFetched: null,
    cacheType: 'DYNAMIC'
  },
  
  // Orders
  orders: {
    data: [],
    isLoading: false,
    error: null,
    lastFetched: null,
    cacheType: 'USER_SPECIFIC'
  },
  
  // Coupons
  coupons: {
    data: [],
    isLoading: false,
    error: null,
    lastFetched: null,
    cacheType: 'DYNAMIC'
  },
  
  // Contacts/Messages
  contacts: {
    data: [],
    isLoading: false,
    error: null,
    lastFetched: null,
    cacheType: 'DYNAMIC'
  },
  
  // Shipping & Tax Settings
  shippingTaxSettings: {
    data: null,
    isLoading: false,
    error: null,
    lastFetched: null,
    cacheType: 'STATIC'
  },

  // Business Tracking
  businessTracking: {
    data: { totalRevenue: 0, totalInvestment: 0, entries: [] },
    isLoading: false,
    error: null,
    lastFetched: null,
    cacheType: 'DYNAMIC'
  },

  // Sales (Flash Sales, Bundle Sales, etc.)
  sales: {
    data: [],
    isLoading: false,
    error: null,
    lastFetched: null,
    cacheType: 'DYNAMIC'
  },

  // Global fetch status
  globalLoading: false,
  initialDataLoaded: false
};

// Helper to check if cache is valid
const isCacheValid = (lastFetched, cacheType) => {
  if (!lastFetched) return false;
  const now = Date.now();
  const duration = CACHE_DURATION[cacheType] || CACHE_DURATION.DYNAMIC;
  return (now - lastFetched) < duration;
};

// Async Thunks for data fetching

// Fetch Products
export const fetchProducts = createAsyncThunk(
  'data/fetchProducts',
  async (_, { getState, rejectWithValue }) => {
    const { data: dataState } = getState();
    const { products } = dataState;
    
    // Skip if cache is valid
    if (products.data.length > 0 && isCacheValid(products.lastFetched, products.cacheType)) {
      return { data: products.data, fromCache: true };
    }
    
    try {
      const response = await axios.get('/api/products');
      return { data: response.data, fromCache: false };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// Fetch Categories
export const fetchCategories = createAsyncThunk(
  'data/fetchCategories',
  async (_, { getState, rejectWithValue }) => {
    const { data: dataState } = getState();
    const { categories } = dataState;
    
    if (categories.data.length > 0 && isCacheValid(categories.lastFetched, categories.cacheType)) {
      return { data: categories.data, fromCache: true };
    }
    
    try {
      const response = await axios.get('/api/categories');
      return { data: response.data, fromCache: false };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// Fetch Reviews
export const fetchReviews = createAsyncThunk(
  'data/fetchReviews',
  async ({ productId, approved } = {}, { getState, rejectWithValue }) => {
    const { data: dataState } = getState();
    const { reviews } = dataState;
    
    // For all reviews without filters, use cache
    if (!productId && !approved && reviews.data.length > 0 && isCacheValid(reviews.lastFetched, reviews.cacheType)) {
      return { data: reviews.data, fromCache: true };
    }
    
    try {
      let url = '/api/reviews';
      const params = new URLSearchParams();
      if (productId) params.append('productId', productId);
      if (approved !== undefined) params.append('approved', approved);
      if (params.toString()) url += `?${params.toString()}`;
      
      const response = await axios.get(url);
      return { data: response.data, fromCache: false, isFiltered: !!(productId || approved) };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// Fetch Users
export const fetchUsers = createAsyncThunk(
  'data/fetchUsers',
  async (_, { getState, rejectWithValue }) => {
    const { data: dataState } = getState();
    const { users } = dataState;
    
    if (users.data.length > 0 && isCacheValid(users.lastFetched, users.cacheType)) {
      return { data: users.data, fromCache: true };
    }
    
    try {
      const response = await axios.get('/api/users');
      return { data: response.data, fromCache: false };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// Fetch Orders
export const fetchOrders = createAsyncThunk(
  'data/fetchOrders',
  async (_, { getState, rejectWithValue }) => {
    const { data: dataState } = getState();
    const { orders } = dataState;
    
    if (orders.data.length > 0 && isCacheValid(orders.lastFetched, orders.cacheType)) {
      return { data: orders.data, fromCache: true };
    }
    
    try {
      const response = await axios.get('/api/orders');
      return { data: response.data, fromCache: false };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// Fetch Coupons
export const fetchCoupons = createAsyncThunk(
  'data/fetchCoupons',
  async (_, { getState, rejectWithValue }) => {
    const { data: dataState } = getState();
    const { coupons } = dataState;
    
    if (coupons.data.length > 0 && isCacheValid(coupons.lastFetched, coupons.cacheType)) {
      return { data: coupons.data, fromCache: true };
    }
    
    try {
      const response = await axios.get('/api/coupons');
      return { data: response.data, fromCache: false };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// Fetch Contacts
export const fetchContacts = createAsyncThunk(
  'data/fetchContacts',
  async (_, { getState, rejectWithValue }) => {
    const { data: dataState } = getState();
    const { contacts } = dataState;
    
    if (contacts.data.length > 0 && isCacheValid(contacts.lastFetched, contacts.cacheType)) {
      return { data: contacts.data, fromCache: true };
    }
    
    try {
      const response = await axios.get('/api/contacts');
      return { data: response.data, fromCache: false };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// Fetch Shipping & Tax Settings
export const fetchShippingTaxSettings = createAsyncThunk(
  'data/fetchShippingTaxSettings',
  async (_, { getState, rejectWithValue }) => {
    const { data: dataState } = getState();
    const { shippingTaxSettings } = dataState;
    
    if (shippingTaxSettings.data && isCacheValid(shippingTaxSettings.lastFetched, shippingTaxSettings.cacheType)) {
      return { data: shippingTaxSettings.data, fromCache: true };
    }
    
    try {
      const response = await axios.get('/api/shipping-tax-settings');
      return { data: response.data, fromCache: false };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// Fetch Business Tracking
export const fetchBusinessTracking = createAsyncThunk(
  'data/fetchBusinessTracking',
  async (_, { getState, rejectWithValue }) => {
    const { data: dataState } = getState();
    const { businessTracking } = dataState;
    
    if (businessTracking.data && isCacheValid(businessTracking.lastFetched, businessTracking.cacheType)) {
      return { data: businessTracking.data, fromCache: true };
    }
    
    try {
      const response = await axios.get('/api/business-tracking');
      return { data: response.data, fromCache: false };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// Fetch Sales
export const fetchSales = createAsyncThunk(
  'data/fetchSales',
  async ({ activeOnly = false } = {}, { getState, rejectWithValue }) => {
    const { data: dataState } = getState();
    const { sales } = dataState;
    
    // For all sales without filters, use cache
    if (!activeOnly && sales.data.length > 0 && isCacheValid(sales.lastFetched, sales.cacheType)) {
      return { data: sales.data, fromCache: true };
    }
    
    try {
      const url = activeOnly ? '/api/sales?active=true' : '/api/sales';
      const response = await axios.get(url);
      return { data: response.data, fromCache: false, isFiltered: activeOnly };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// Fetch Initial Data (products, categories, reviews) - reduces initial API calls
export const fetchInitialData = createAsyncThunk(
  'data/fetchInitialData',
  async (_, { dispatch, getState }) => {
    const { data: dataState } = getState();
    
    const promises = [];
    
    // Only fetch if not cached
    if (!dataState.products.data.length || !isCacheValid(dataState.products.lastFetched, dataState.products.cacheType)) {
      promises.push(dispatch(fetchProducts()));
    }
    
    if (!dataState.categories.data.length || !isCacheValid(dataState.categories.lastFetched, dataState.categories.cacheType)) {
      promises.push(dispatch(fetchCategories()));
    }
    
    if (!dataState.reviews.data.length || !isCacheValid(dataState.reviews.lastFetched, dataState.reviews.cacheType)) {
      promises.push(dispatch(fetchReviews()));
    }
    
    await Promise.all(promises);
    return true;
  }
);

// Create the data slice
export const dataSlice = createSlice({
  name: 'data',
  initialState,
  reducers: {
    // Clear all cache
    clearAllCache: (state) => {
      Object.keys(state).forEach(key => {
        if (state[key] && typeof state[key] === 'object' && 'lastFetched' in state[key]) {
          state[key].lastFetched = null;
        }
      });
      state.initialDataLoaded = false;
    },
    
    // Clear specific cache
    clearCache: (state, action) => {
      const { entity } = action.payload;
      if (state[entity]) {
        state[entity].lastFetched = null;
      }
    },
    
    // Update a single product (after add/edit)
    updateProduct: (state, action) => {
      const updatedProduct = action.payload;
      const index = state.products.data.findIndex(p => 
        p._id === updatedProduct._id || p.id === updatedProduct.id
      );
      if (index !== -1) {
        state.products.data[index] = updatedProduct;
      } else {
        state.products.data.push(updatedProduct);
      }
    },
    
    // Remove a product
    removeProduct: (state, action) => {
      const productId = action.payload;
      state.products.data = state.products.data.filter(p => 
        p._id !== productId && p.id !== productId
      );
    },
    
    // Update a single category
    updateCategory: (state, action) => {
      const updatedCategory = action.payload;
      const index = state.categories.data.findIndex(c => 
        c._id === updatedCategory._id || c.id === updatedCategory.id
      );
      if (index !== -1) {
        state.categories.data[index] = updatedCategory;
      } else {
        state.categories.data.push(updatedCategory);
      }
    },
    
    // Remove a category
    removeCategory: (state, action) => {
      const categoryId = action.payload;
      state.categories.data = state.categories.data.filter(c => 
        c._id !== categoryId && c.id !== categoryId
      );
    },
    
    // Update a single review
    updateReview: (state, action) => {
      const updatedReview = action.payload;
      const index = state.reviews.data.findIndex(r => 
        r._id === updatedReview._id || r.id === updatedReview.id
      );
      if (index !== -1) {
        state.reviews.data[index] = updatedReview;
      } else {
        state.reviews.data.push(updatedReview);
      }
    },
    
    // Remove a review
    removeReview: (state, action) => {
      const reviewId = action.payload;
      state.reviews.data = state.reviews.data.filter(r => 
        r._id !== reviewId && r.id !== reviewId
      );
    },
    
    // Update a single user
    updateUser: (state, action) => {
      const updatedUser = action.payload;
      const index = state.users.data.findIndex(u => 
        u._id === updatedUser._id || u.id === updatedUser.id
      );
      if (index !== -1) {
        state.users.data[index] = updatedUser;
      } else {
        state.users.data.push(updatedUser);
      }
    },
    
    // Remove a user
    removeUser: (state, action) => {
      const userId = action.payload;
      state.users.data = state.users.data.filter(u => 
        u._id !== userId && u.id !== userId
      );
    },
    
    // Update a single order
    updateOrder: (state, action) => {
      const updatedOrder = action.payload;
      const index = state.orders.data.findIndex(o => 
        o._id === updatedOrder._id || o.id === updatedOrder.id
      );
      if (index !== -1) {
        state.orders.data[index] = updatedOrder;
      } else {
        state.orders.data.push(updatedOrder);
      }
    },
    
    // Remove an order
    removeOrder: (state, action) => {
      const orderId = action.payload;
      state.orders.data = state.orders.data.filter(o => 
        o._id !== orderId && o.id !== orderId
      );
    },
    
    // Update a single coupon
    updateCoupon: (state, action) => {
      const updatedCoupon = action.payload;
      const index = state.coupons.data.findIndex(c => 
        c._id === updatedCoupon._id || c.id === updatedCoupon.id
      );
      if (index !== -1) {
        state.coupons.data[index] = updatedCoupon;
      } else {
        state.coupons.data.push(updatedCoupon);
      }
    },
    
    // Remove a coupon
    removeCoupon: (state, action) => {
      const couponId = action.payload;
      state.coupons.data = state.coupons.data.filter(c => 
        c._id !== couponId && c.id !== couponId
      );
    },

    // Update a single sale
    updateSale: (state, action) => {
      const updatedSale = action.payload;
      const index = state.sales.data.findIndex(s => 
        s._id === updatedSale._id || s.id === updatedSale.id
      );
      if (index !== -1) {
        state.sales.data[index] = updatedSale;
      } else {
        state.sales.data.push(updatedSale);
      }
    },
    
    // Remove a sale
    removeSale: (state, action) => {
      const saleId = action.payload;
      state.sales.data = state.sales.data.filter(s => 
        s._id !== saleId && s.id !== saleId
      );
    },

    // Update shipping tax settings
    updateShippingTaxSettings: (state, action) => {
      state.shippingTaxSettings.data = action.payload;
      state.shippingTaxSettings.lastFetched = Date.now();
    },

    // Set products data directly (for SSR hydration)
    setProductsData: (state, action) => {
      state.products.data = action.payload;
      state.products.lastFetched = Date.now();
      state.products.isLoading = false;
      state.products.error = null;
    },

    // Set categories data directly (for SSR hydration)
    setCategoriesData: (state, action) => {
      state.categories.data = action.payload;
      state.categories.lastFetched = Date.now();
      state.categories.isLoading = false;
      state.categories.error = null;
    },

    // Set reviews data directly
    setReviewsData: (state, action) => {
      state.reviews.data = action.payload;
      state.reviews.lastFetched = Date.now();
      state.reviews.isLoading = false;
      state.reviews.error = null;
    },

    // Set users data directly
    setUsersData: (state, action) => {
      state.users.data = action.payload;
      state.users.lastFetched = Date.now();
      state.users.isLoading = false;
      state.users.error = null;
    }
  },
  extraReducers: (builder) => {
    // Products
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.products.isLoading = true;
        state.products.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.products.isLoading = false;
        if (!action.payload.fromCache) {
          state.products.data = action.payload.data;
          state.products.lastFetched = Date.now();
        }
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.products.isLoading = false;
        state.products.error = action.payload;
      })
    
    // Categories
    builder
      .addCase(fetchCategories.pending, (state) => {
        state.categories.isLoading = true;
        state.categories.error = null;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.categories.isLoading = false;
        if (!action.payload.fromCache) {
          state.categories.data = action.payload.data;
          state.categories.lastFetched = Date.now();
        }
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.categories.isLoading = false;
        state.categories.error = action.payload;
      })
    
    // Reviews
    builder
      .addCase(fetchReviews.pending, (state) => {
        state.reviews.isLoading = true;
        state.reviews.error = null;
      })
      .addCase(fetchReviews.fulfilled, (state, action) => {
        state.reviews.isLoading = false;
        // Only update main reviews cache if not a filtered request
        if (!action.payload.fromCache && !action.payload.isFiltered) {
          state.reviews.data = action.payload.data;
          state.reviews.lastFetched = Date.now();
        }
      })
      .addCase(fetchReviews.rejected, (state, action) => {
        state.reviews.isLoading = false;
        state.reviews.error = action.payload;
      })
    
    // Users
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.users.isLoading = true;
        state.users.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.users.isLoading = false;
        if (!action.payload.fromCache) {
          state.users.data = action.payload.data;
          state.users.lastFetched = Date.now();
        }
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.users.isLoading = false;
        state.users.error = action.payload;
      })
    
    // Orders
    builder
      .addCase(fetchOrders.pending, (state) => {
        state.orders.isLoading = true;
        state.orders.error = null;
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.orders.isLoading = false;
        if (!action.payload.fromCache) {
          state.orders.data = action.payload.data;
          state.orders.lastFetched = Date.now();
        }
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.orders.isLoading = false;
        state.orders.error = action.payload;
      })
    
    // Coupons
    builder
      .addCase(fetchCoupons.pending, (state) => {
        state.coupons.isLoading = true;
        state.coupons.error = null;
      })
      .addCase(fetchCoupons.fulfilled, (state, action) => {
        state.coupons.isLoading = false;
        if (!action.payload.fromCache) {
          state.coupons.data = action.payload.data;
          state.coupons.lastFetched = Date.now();
        }
      })
      .addCase(fetchCoupons.rejected, (state, action) => {
        state.coupons.isLoading = false;
        state.coupons.error = action.payload;
      })
    
    // Contacts
    builder
      .addCase(fetchContacts.pending, (state) => {
        state.contacts.isLoading = true;
        state.contacts.error = null;
      })
      .addCase(fetchContacts.fulfilled, (state, action) => {
        state.contacts.isLoading = false;
        if (!action.payload.fromCache) {
          state.contacts.data = action.payload.data;
          state.contacts.lastFetched = Date.now();
        }
      })
      .addCase(fetchContacts.rejected, (state, action) => {
        state.contacts.isLoading = false;
        state.contacts.error = action.payload;
      })
    
    // Shipping & Tax Settings
    builder
      .addCase(fetchShippingTaxSettings.pending, (state) => {
        state.shippingTaxSettings.isLoading = true;
        state.shippingTaxSettings.error = null;
      })
      .addCase(fetchShippingTaxSettings.fulfilled, (state, action) => {
        state.shippingTaxSettings.isLoading = false;
        if (!action.payload.fromCache) {
          state.shippingTaxSettings.data = action.payload.data;
          state.shippingTaxSettings.lastFetched = Date.now();
        }
      })
      .addCase(fetchShippingTaxSettings.rejected, (state, action) => {
        state.shippingTaxSettings.isLoading = false;
        state.shippingTaxSettings.error = action.payload;
      })

    // Business Tracking
    builder
      .addCase(fetchBusinessTracking.pending, (state) => {
        state.businessTracking.isLoading = true;
        state.businessTracking.error = null;
      })
      .addCase(fetchBusinessTracking.fulfilled, (state, action) => {
        state.businessTracking.isLoading = false;
        if (!action.payload.fromCache) {
          state.businessTracking.data = action.payload.data;
          state.businessTracking.lastFetched = Date.now();
        }
      })
      .addCase(fetchBusinessTracking.rejected, (state, action) => {
        state.businessTracking.isLoading = false;
        state.businessTracking.error = action.payload;
      })

    // Sales
    builder
      .addCase(fetchSales.pending, (state) => {
        state.sales.isLoading = true;
        state.sales.error = null;
      })
      .addCase(fetchSales.fulfilled, (state, action) => {
        state.sales.isLoading = false;
        if (!action.payload.fromCache && !action.payload.isFiltered) {
          state.sales.data = action.payload.data;
          state.sales.lastFetched = Date.now();
        }
      })
      .addCase(fetchSales.rejected, (state, action) => {
        state.sales.isLoading = false;
        state.sales.error = action.payload;
      })
    
    // Initial Data Load
    builder
      .addCase(fetchInitialData.pending, (state) => {
        state.globalLoading = true;
      })
      .addCase(fetchInitialData.fulfilled, (state) => {
        state.globalLoading = false;
        state.initialDataLoaded = true;
      })
      .addCase(fetchInitialData.rejected, (state) => {
        state.globalLoading = false;
      });
  }
});

// Export actions
export const {
  clearAllCache,
  clearCache,
  updateProduct,
  removeProduct,
  updateCategory,
  removeCategory,
  updateReview,
  removeReview,
  updateUser,
  removeUser,
  updateOrder,
  removeOrder,
  updateCoupon,
  removeCoupon,
  updateSale,
  removeSale,
  updateShippingTaxSettings,
  setProductsData,
  setCategoriesData,
  setReviewsData,
  setUsersData
} = dataSlice.actions;

// Selectors
export const selectProducts = (state) => state.data.products;
export const selectCategories = (state) => state.data.categories;
export const selectReviews = (state) => state.data.reviews;
export const selectUsers = (state) => state.data.users;
export const selectOrders = (state) => state.data.orders;
export const selectCoupons = (state) => state.data.coupons;
export const selectContacts = (state) => state.data.contacts;
export const selectShippingTaxSettings = (state) => state.data.shippingTaxSettings;
export const selectBusinessTracking = (state) => state.data.businessTracking;
export const selectSales = (state) => state.data.sales;
export const selectGlobalLoading = (state) => state.data.globalLoading;
export const selectInitialDataLoaded = (state) => state.data.initialDataLoaded;

// Computed selectors
export const selectProductById = (productId) => (state) => {
  return state.data.products.data.find(p => p._id === productId || p.id === productId);
};

export const selectCategoryById = (categoryId) => (state) => {
  return state.data.categories.data.find(c => c._id === categoryId || c.id === categoryId);
};

export const selectReviewsByProductId = (productId) => (state) => {
  return state.data.reviews.data.filter(r => r.productId === productId);
};

export const selectApprovedReviews = (state) => {
  return state.data.reviews.data.filter(r => r.approved === true || r.isApproved === true);
};

export const selectUserById = (userId) => (state) => {
  return state.data.users.data.find(u => u._id === userId || u.id === userId);
};

export const selectOrderById = (orderId) => (state) => {
  return state.data.orders.data.find(o => o._id === orderId || o.id === orderId);
};

export const selectOrdersByUserId = (userId) => (state) => {
  return state.data.orders.data.filter(o => o.userId === userId);
};

export default dataSlice.reducer;
