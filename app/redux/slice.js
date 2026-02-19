import { createSlice, current } from '@reduxjs/toolkit';

const isDev = process.env.NODE_ENV === 'development';

const initialState = {
  users: [
    {
      name: "Rian Hasan Siam",
      email: "rian@example.com"
    }
  ],
  cart: {
    items: [],
    totalQuantity: 0,
    totalAmount: 0
  },
  wishlist: {
    items: [],
    totalItems: 0
  }
}

// Helper function to save cart to localStorage with debouncing
let saveCartTimeout;
const saveCartToStorage = (cartItems) => {
  if (typeof window !== 'undefined') {
    try {
      clearTimeout(saveCartTimeout);
      saveCartTimeout = setTimeout(() => {
        if (!cartItems || !Array.isArray(cartItems)) {
          if (isDev) console.warn('Invalid cart items:', cartItems);
          return;
        }
        
        const cartForStorage = cartItems.map(item => {
          if (!item || typeof item !== 'object') {
            if (isDev) console.warn('Invalid cart item:', item);
            return null;
          }
          
          return {
            id: item.id,
            name: item.name,
            price: item.price,
            image: item.image,
            quantity: item.quantity,
            size: item.size,
            color: item.color,
            stock: item.stock
          };
        }).filter(Boolean);
        
        localStorage.setItem('cart', JSON.stringify(cartForStorage));
      }, 100);
    } catch (error) {
      if (isDev) console.error('Error saving cart:', error);
    }
  }
};

// Helper function to save wishlist to localStorage with debouncing
let saveWishlistTimeout;
const saveWishlistToStorage = (wishlistItems) => {
  if (typeof window !== 'undefined') {
    try {
      clearTimeout(saveWishlistTimeout);
      saveWishlistTimeout = setTimeout(() => {
        if (!wishlistItems || !Array.isArray(wishlistItems)) {
          if (isDev) console.warn('Invalid wishlist items:', wishlistItems);
          return;
        }
        
        const wishlistForStorage = wishlistItems.map(item => {
          if (!item || typeof item !== 'object') {
            if (isDev) console.warn('Invalid wishlist item:', item);
            return null;
          }
          
          return {
            id: item.id,
            addedAt: item.addedAt
          };
        }).filter(Boolean);
        
        localStorage.setItem('wishlist', JSON.stringify(wishlistForStorage));
      }, 100);
    } catch (error) {
      if (isDev) console.error('Error saving wishlist:', error);
    }
  }
};

export const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    addUser: (state, action) => {
      state.users.push(action.payload);
    },
    
    // Cart actions
    addToCart: (state, action) => {
      try {
        const payload = action.payload;
        
        if (!payload) {
          if (isDev) console.warn('addToCart: no payload');
          return;
        }
        
        // Handle both old format { product, quantity, size, color } and new format { id, name, price, etc. }
        let itemToAdd;
        if (payload.product) {
          // Old format
          const { product, quantity = 1, size, color } = payload;
          if (!product || !product._id) {
            if (isDev) console.warn('Invalid product:', product);
            return;
          }
          
          itemToAdd = {
            id: product._id,
            name: product.name,
            brand: product.brand || '',
            price: product.price,
            image: product.image || product.images?.[0] || product.imageUrl,
            quantity,
            size,
            color,
            stock: product.stock ?? product.stockCount ?? 10
          };
        } else {
          // New format (from wishlist and other components)
          if (!payload.id) {
            if (isDev) console.warn('Missing id in payload:', payload);
            return;
          }
          
          itemToAdd = {
            id: payload.id,
            name: payload.name,
            brand: payload.brand || '',
            price: payload.price,
            image: payload.image,
            quantity: payload.quantity || 1,
            size: payload.size,
            color: payload.color,
            stock: payload.stock || 10
          };
        }
        
        // Ensure cart items array exists
        if (!state.cart.items) {
          state.cart.items = [];
        }
        
        const existingItem = state.cart.items.find(
          item => item.id === itemToAdd.id && item.size === itemToAdd.size && item.color === itemToAdd.color
        );
        
        if (existingItem) {
          existingItem.quantity += itemToAdd.quantity;
        } else {
          state.cart.items.push(itemToAdd);
        }
        
        state.cart.totalQuantity += itemToAdd.quantity;
        state.cart.totalAmount += itemToAdd.price * itemToAdd.quantity;
        
        // 🚀 OPTIMIZED: Use debounced localStorage save
        saveCartToStorage(current(state.cart.items));
      } catch (error) {
        if (isDev) console.error('addToCart error:', error);
      }
    },
    
    updateCartQuantity: (state, action) => {
      try {
        const { id, size, color, newQuantity } = action.payload;
        
        // Safety checks
        if (!state.cart.items || !Array.isArray(state.cart.items)) {
          if (isDev) console.warn('Cart items not available');
          return;
        }
        
        const item = state.cart.items.find(
          item => item && item.id === id && item.size === size && item.color === color
        );
        
        if (item && newQuantity > 0) {
          const quantityDiff = newQuantity - item.quantity;
          item.quantity = newQuantity;
          state.cart.totalQuantity += quantityDiff;
          state.cart.totalAmount += item.price * quantityDiff;
          
          // 🚀 OPTIMIZED: Use debounced localStorage save with current()
          saveCartToStorage(current(state.cart.items));
        }
      } catch (error) {
        if (isDev) console.error('updateCartQuantity error:', error);
      }
    },
    
    removeFromCart: (state, action) => {
      try {
        const { id, size, color } = action.payload;
        
        // Safety checks
        if (!state.cart.items || !Array.isArray(state.cart.items)) {
          if (isDev) console.warn('Cart items not available');
          return;
        }
        
        const itemIndex = state.cart.items.findIndex(
          item => item && item.id === id && item.size === size && item.color === color
        );
        
        if (itemIndex >= 0) {
          const item = state.cart.items[itemIndex];
          if (item) {
            state.cart.totalQuantity -= item.quantity || 0;
            state.cart.totalAmount -= (item.price || 0) * (item.quantity || 0);
            state.cart.items.splice(itemIndex, 1);
            
            // 🚀 OPTIMIZED: Use debounced localStorage save with current()
            saveCartToStorage(current(state.cart.items));
          }
        }
      } catch (error) {
        if (isDev) console.error('removeFromCart error:', error);
      }
    },
    
    clearCart: (state) => {
      state.cart.items = [];
      state.cart.totalQuantity = 0;
      state.cart.totalAmount = 0;
      
      // Cancel any pending debounced save that could restore cart
      clearTimeout(saveCartTimeout);
      
      // Clear localStorage immediately for cart clearing
      if (typeof window !== 'undefined') {
        localStorage.removeItem('cart');
      }
    },
    
    loadCartFromStorage: (state, action) => {
      if (typeof window !== 'undefined') {
        const cartFromStorage = localStorage.getItem('cart');
        if (cartFromStorage) {
          try {
            const cartItems = JSON.parse(cartFromStorage);
            // Load cart items from storage with proper stock information
            state.cart.items = cartItems.map(item => ({
              id: item.id,
              name: item.name,
              price: item.price,
              image: item.image || item.imageUrl,
              quantity: item.quantity,
              size: item.size,
              color: item.color,
              stock: item.stock || 10 // Default stock if not provided
            }));
            state.cart.totalQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0);
            state.cart.totalAmount = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
          } catch (error) {
            console.error('Error loading cart from storage:', error);
          }
        }
      }
    },
    
    // Wishlist actions
    addToWishlist: (state, action) => {
      const payload = action.payload;
      
      // Handle both old format (full product object) and new format { id, name, price, etc. }
      let itemToAdd;
      if (payload._id) {
        // Old format - full product object
        itemToAdd = {
          id: payload._id,
          name: payload.name,
          price: payload.price,
          image: payload.imageUrl || payload.image,
          addedAt: new Date().toISOString()
        };
      } else {
        // New format
        itemToAdd = {
          id: payload.id,
          name: payload.name,
          price: payload.price,
          image: payload.image,
          addedAt: new Date().toISOString()
        };
      }
      
      const existingItem = state.wishlist.items.find(item => item.id === itemToAdd.id);
      
      if (!existingItem) {
        state.wishlist.items.push(itemToAdd);
        state.wishlist.totalItems += 1;
        
        // 🚀 OPTIMIZED: Use debounced localStorage save with current() wrapper for safe proxy access
        saveWishlistToStorage(current(state.wishlist.items));
      }
    },
    
    removeFromWishlist: (state, action) => {
      const productId = action.payload;
      const itemIndex = state.wishlist.items.findIndex(item => item.id === productId);
      
      if (itemIndex >= 0) {
        state.wishlist.items.splice(itemIndex, 1);
        state.wishlist.totalItems -= 1;
        
        // 🚀 OPTIMIZED: Use debounced localStorage save with current() wrapper for safe proxy access
        saveWishlistToStorage(current(state.wishlist.items));
      }
    },
    
    loadWishlistFromStorage: (state, action) => {
      if (typeof window !== 'undefined') {
        const wishlistFromStorage = localStorage.getItem('wishlist');
        if (wishlistFromStorage) {
          try {
            const wishlistItems = JSON.parse(wishlistFromStorage);
            // Just load the basic structure, products will be matched in component
            state.wishlist.items = wishlistItems.map(item => ({
              id: item.id,
              addedAt: item.addedAt || new Date().toISOString()
            }));
            state.wishlist.totalItems = wishlistItems.length;
          } catch (error) {
            console.error('Error loading wishlist from storage:', error);
          }
        }
      }
    }
  },
})

// Export the actions
export const { 
  addUser, 
  addToCart, 
  updateCartQuantity, 
  removeFromCart, 
  clearCart, 
  loadCartFromStorage,
  addToWishlist, 
  removeFromWishlist, 
  loadWishlistFromStorage 
} = userSlice.actions

export default userSlice.reducer;