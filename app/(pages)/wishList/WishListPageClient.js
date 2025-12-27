'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useProducts } from '@/lib/hooks/useReduxData';
import { useAppSelector, useAppDispatch } from '@/app/redux/reduxHooks';
import { loadWishlistFromStorage, removeFromWishlist, addToCart } from '@/app/redux/slice';
import { PLACEHOLDER_IMAGES } from '@/lib/constants';
import LoadingSpinner from '../../componets/loading/LoadingSpinner';
import { ProductGridSkeleton } from '../../componets/loading/SkeletonLoaders';
import { 
  FiHeart, 
  FiShoppingCart, 
  FiStar, 
  FiEye, 
  FiTrash2,
  FiGrid,
  FiList,
  FiFilter,
  FiChevronDown,
  FiCheck,
  FiShare2
} from 'react-icons/fi';

// Wishlist Product Card Component
const WishlistProductCard = ({ product, onRemove, onAddToCart, isSelected, onSelect }) => {
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);

  const discount = product.originalPrice 
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsAddingToCart(true);
    await onAddToCart(product.id);
    setTimeout(() => setIsAddingToCart(false), 2000);
  };

  const handleRemove = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onRemove(product.id);
  };

  const handleSelect = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onSelect(product.id);
  };


  return (
    <Link href={`/productDetails/${product.id}`}>
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        whileHover={{ y: -5 }}
        className="group relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl border border-gray-100 transition-all duration-300 cursor-pointer"
      >
      {/* Selection Checkbox */}
      <div className="absolute top-4 left-4 z-10">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleSelect}
          className={`w-6 h-6 rounded-full border-2 transition-all duration-200 ${
            isSelected 
              ? 'bg-gray-900 border-gray-900 text-white' 
              : 'bg-white border-gray-300 hover:border-gray-900'
          }`}
        >
          {isSelected && <FiCheck size={12} />}
        </motion.button>
      </div>

      {/* Sale Badge */}
      {discount > 0 && (
        <div className="absolute top-4 right-4 z-10 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-medium">
          -{discount}%
        </div>
      )}

      {/* Actions */}
      <div className={`absolute z-20 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
        discount > 0 ? 'top-12 right-4' : 'top-4 right-4'
      }`}>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          className="p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-md hover:bg-white transition-colors text-gray-700"
        >
          <FiEye size={16} />
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleRemove}
          className="p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-md hover:bg-red-500 hover:text-white transition-colors text-gray-700"
        >
          <FiTrash2 size={16} />
        </motion.button>
      </div>

      {/* Product Image */}
      <div className="relative aspect-square overflow-hidden bg-gray-50">
        <Image
          src={product.image || PLACEHOLDER_IMAGES.PRODUCT_LARGE}
          alt={product.name}
          fill
          className={`object-cover group-hover:scale-105 transition-transform duration-500 ${
            product.stockCount === 0 || !product.inStock ? 'grayscale opacity-60' : ''
          }`}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          unoptimized={true}
          onError={(e) => {
            e.target.src = PLACEHOLDER_IMAGES.PRODUCT_LARGE;
          }}
        />
        
        {/* SOLD OUT Overlay - Premium Design */}
        {(product.stockCount === 0 || product.stock === 0 || !product.inStock) && (
          <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/20">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-red-700 via-red-600 to-red-700 blur-sm opacity-80"></div>
              <div className="relative bg-gradient-to-r from-red-800 via-red-600 to-red-800 text-white px-4 py-2 sm:px-6 sm:py-2.5 border border-red-400/30 shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent"></div>
                <span className="relative text-[10px] sm:text-xs md:text-sm font-semibold tracking-[0.2em] sm:tracking-[0.3em] uppercase">
                  Sold Out
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-5">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">{product.name}</h3>
            <p className="text-sm text-gray-500">{product.category}</p>
          </div>
        </div>

        {/* Rating */}
        <div className="flex items-center gap-1 mb-3">
          <div className="flex">
            {[...Array(5)].map((_, i) => (
              <FiStar
                key={i}
                className={`w-4 h-4 ${
                  i < Math.floor(product.rating) 
                    ? 'text-yellow-400 fill-current' 
                    : 'text-gray-300'
                }`}
              />
            ))}
          </div>
          <span className="text-sm text-gray-500">
            {product.rating} ({product.reviews})
          </span>
        </div>

        {/* Price */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xl font-bold text-gray-900">
            ৳{product.price}
          </span>
          {product.originalPrice && (
            <span className="text-sm text-gray-500 line-through">
              ৳{product.originalPrice}
            </span>
          )}
        </div>

        {/* Add to Cart Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleAddToCart}
          disabled={isAddingToCart || !product.inStock}
          className={`w-full py-3 rounded-xl font-medium transition-all duration-200 ${
            !product.inStock
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : isAddingToCart
              ? 'bg-green-500 text-white'
              : 'bg-gray-900 text-white hover:bg-gray-800'
          }`}
        >
          {!product.inStock ? (
            'Out of Stock'
          ) : isAddingToCart ? (
            <div className="flex items-center justify-center gap-2">
              <FiCheck className="w-4 h-4" />
              Added to Cart
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <FiShoppingCart className="w-4 h-4" />
              Add to Cart
            </div>
          )}
        </motion.button>
      </div>
      </motion.div>
    </Link>
  );
};

export default function WishListPageClient() {
  // 🚀 OPTIMIZED: Use Redux store for centralized data caching - NO duplicate API calls
  const { data: products, isLoading: productsLoading, error: productsError } = useProducts();

  // Redux hooks
  const dispatch = useAppDispatch();
  const wishlistItems = useAppSelector((state) => state.user.wishlist.items);
  
  const [items, setItems] = useState([]);
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('recent');
  const [filterBy, setFilterBy] = useState('all');
  const [selectedItems, setSelectedItems] = useState([]);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  // Load wishlist from localStorage on component mount
  useEffect(() => {
    dispatch(loadWishlistFromStorage());
  }, [dispatch]);

  // Load wishlist data from Redux store and match with products
  useEffect(() => {
    if (products && products.length > 0 && wishlistItems.length > 0) {
      // Match wishlist items with full product data
      const fullWishlistItems = wishlistItems
        .map(wishlistItem => {
          const fullProduct = products.find(product => product._id === wishlistItem.id);
          if (fullProduct) {
            return {
              id: fullProduct._id,
              name: fullProduct.name,
              category: fullProduct.category,
              style: fullProduct.style || 'Casual',
              price: fullProduct.price,
              originalPrice: fullProduct.originalPrice,
              image: fullProduct.primaryImage || fullProduct.image || fullProduct.images?.[0] || PLACEHOLDER_IMAGES.PRODUCT_LARGE,
              rating: fullProduct.rating || wishlistItem.rating || 4.0,
              reviews: fullProduct.reviews?.length || 0,
              isNew: false, // Could be calculated based on createdAt
              isOnSale: fullProduct.originalPrice && fullProduct.originalPrice > fullProduct.price,
              color: fullProduct.colors?.[0] || 'Multiple',
              sizes: fullProduct.sizes || ['S', 'M', 'L', 'XL'],
              inStock: (fullProduct.stock || 0) > 0,
              addedDate: new Date().toISOString(), // Current date as added date
              description: fullProduct.shortDescription || fullProduct.description || `High-quality ${fullProduct.category?.toLowerCase()} perfect for any occasion.`
            };
          }
          return null;
        })
        .filter(Boolean); // Remove null entries
      
      setItems(fullWishlistItems);
    }
  }, [products, wishlistItems]);

  // Filter and sort items
  const filteredItems = items
    .filter(item => {
      if (filterBy === 'in-stock') return item.inStock;
      if (filterBy === 'on-sale') return item.isOnSale;
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'name':
          return a.name.localeCompare(b.name);
        case 'recent':
        default:
          return new Date(b.addedDate) - new Date(a.addedDate);
      }
    });

  const handleRemoveItem = (itemId) => {
    // Remove from Redux store
    dispatch(removeFromWishlist(itemId));
    
    // Remove from local state
    const updatedItems = items.filter(item => item.id !== itemId);
    setItems(updatedItems);
    setSelectedItems(selectedItems.filter(id => id !== itemId));
  };

  const handleAddToCart = async (itemId) => {
    const item = items.find(item => item.id === itemId);
    if (!item) return;

    return new Promise(resolve => {
      setTimeout(() => {
        // Add to cart
        dispatch(addToCart({
          id: item.id,
          name: item.name,
          price: item.price,
          image: item.image,
          quantity: 1,
          size: item.sizes[0], // Default to first available size
          color: item.color,
          stock: item.inStock ? 10 : 0
        }));
        
        // Remove from wishlist after adding to cart
        dispatch(removeFromWishlist(item.id));
        
        // Update local state
        const updatedItems = items.filter(wishlistItem => wishlistItem.id !== itemId);
        setItems(updatedItems);
        setSelectedItems(selectedItems.filter(id => id !== itemId));
        

        resolve();
      }, 500);
    });
  };

  const handleSelectItem = (itemId) => {
    if (selectedItems.includes(itemId)) {
      setSelectedItems(selectedItems.filter(id => id !== itemId));
    } else {
      setSelectedItems([...selectedItems, itemId]);
    }
  };

  const handleSelectAll = () => {
    if (selectedItems.length === filteredItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredItems.map(item => item.id));
    }
  };

  const handleRemoveSelected = () => {
    selectedItems.forEach(itemId => {
      handleRemoveItem(itemId);
    });
  };

  const handleAddSelectedToCart = () => {
    selectedItems.forEach(itemId => {
      handleAddToCart(itemId);
    });
    // Clear selected items since they will be removed from wishlist
    setSelectedItems([]);
  };

  const totalValue = filteredItems.reduce((sum, item) => sum + item.price, 0);
  const totalSavings = filteredItems.reduce((sum, item) => {
    return sum + (item.originalPrice ? item.originalPrice - item.price : 0);
  }, 0);

  // Loading state
  if (productsLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          {/* <p className="text-gray-600 mt-4">Loading your wishlist...</p> */}
        </div>
      </div>
    );
  }

  // Error state
  if (productsError) {
    return (
      <div className="pt-10">
        <div className="text-center py-16">
          <div className="text-red-500 mb-4">⚠️</div>
          <p className="text-gray-600">Failed to load products. Please try again later.</p>
        </div>
      </div>
    );
  }

  // Empty wishlist state
  if (items.length === 0) {
    return (
      <div className="pt-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16"
        >
          <div className="text-6xl mb-6">💝</div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Your Wishlist is Empty</h1>
          <p className="text-gray-600 max-w-2xl mx-auto mb-8">
            Start adding items to your wishlist by clicking the heart icon on products you love.
          </p>
          <Link 
            href="/allProducts"
            className="inline-flex items-center px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            Browse Products
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="pt-10">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <h1 className="text-4xl font-bold text-gray-900 mb-4">My Wishlist</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Keep track of your favorite items and add them to your cart when you&apos;re ready to purchase.
        </p>
        
        {/* Stats */}
        <div className="flex justify-center gap-8 mt-8">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{filteredItems.length}</div>
            <div className="text-sm text-gray-500">Items</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">৳{totalValue.toFixed(2)}</div>
            <div className="text-sm text-gray-500">Total Value</div>
          </div>
          {totalSavings > 0 && (
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">৳{totalSavings.toFixed(2)}</div>
              <div className="text-sm text-gray-500">You Save</div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Controls */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 bg-white p-6 rounded-2xl border border-gray-100"
      >
        {/* Left Controls */}
        <div className="flex items-center gap-4">
          {/* View Mode */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'grid' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
              }`}
            >
              <FiGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'list' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
              }`}
            >
              <FiList className="w-4 h-4" />
            </button>
          </div>

          {/* Sort */}
          <div className="relative">
            <button
              onClick={() => setShowSortDropdown(!showSortDropdown)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Sort
              <FiChevronDown className="w-4 h-4" />
            </button>
            {showSortDropdown && (
              <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[150px]">
                {[
                  { value: 'recent', label: 'Recently Added' },
                  { value: 'price-low', label: 'Price: Low to High' },
                  { value: 'price-high', label: 'Price: High to Low' },
                  { value: 'name', label: 'Name A-Z' }
                ].map(option => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setSortBy(option.value);
                      setShowSortDropdown(false);
                    }}
                    className={`w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors ${
                      sortBy === option.value ? 'bg-gray-100' : ''
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Filter */}
          <div className="relative">
            <button
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <FiFilter className="w-4 h-4" />
              Filter
            </button>
            {showFilterDropdown && (
              <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[150px]">
                {[
                  { value: 'all', label: 'All Items' },
                  { value: 'in-stock', label: 'In Stock' },
                  { value: 'on-sale', label: 'On Sale' }
                ].map(option => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setFilterBy(option.value);
                      setShowFilterDropdown(false);
                    }}
                    className={`w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors ${
                      filterBy === option.value ? 'bg-gray-100' : ''
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleSelectAll}
            className="text-gray-600 hover:text-gray-900 transition-colors"
          >
            {selectedItems.length === filteredItems.length ? 'Deselect All' : 'Select All'}
          </button>

          {selectedItems.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">{selectedItems.length} selected</span>
              <button
                onClick={handleAddSelectedToCart}
                className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm"
              >
                Add to Cart
              </button>
              <button
                onClick={handleRemoveSelected}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
              >
                Remove
              </button>
            </div>
          )}
        </div>
      </motion.div>

      {/* Items Grid/List */}
      {filteredItems.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-20"
        >
          <FiHeart className="w-24 h-24 text-gray-300 mx-auto mb-8" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Your wishlist is empty</h2>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            Start adding items you love to keep track of them and purchase later.
          </p>
          <Link href="/">
            <button className="px-8 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors">
              Browse Products
            </button>
          </Link>
        </motion.div>
      ) : (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className={`grid gap-6 ${
            viewMode === 'grid' 
              ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
              : 'grid-cols-1'
          }`}
        >
          <AnimatePresence>
            {filteredItems.map((item) => (
              <WishlistProductCard
                key={item.id}
                product={item}
                onRemove={handleRemoveItem}
                onAddToCart={handleAddToCart}
                isSelected={selectedItems.includes(item.id)}
                onSelect={handleSelectItem}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}