'use client';

import React, { memo, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Heart, Eye, ShoppingCart, Star } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/app/redux/reduxHooks';
import { addToCart, addToWishlist, removeFromWishlist, removeFromCart } from '@/app/redux/slice';
import { toggleUtils, calculateDiscount, formatPrice, stockUtils } from '@/lib/utils/productUtils';
import Image from 'next/image';

// Shared Badge component
const Badge = memo(({ children, className, variant = 'default' }) => {
  const baseClasses = "inline-flex items-center px-2 py-1 text-xs font-medium rounded-md";
  const variantClasses = {
    default: "bg-gray-100 text-gray-800",
    destructive: "bg-red-500 text-white"
  };
  const classes = `${baseClasses} ${variantClasses[variant]} ${className || ""}`;
  
  return <span className={classes}>{children}</span>;
});

Badge.displayName = 'Badge';

// Optimized Image with fallback
const OptimizedImage = memo(({ src, alt, className, priority = false, ...props }) => {
  // Use a data URL for placeholder to avoid optimization issues
  const fallbackSrc = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDQwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjZjNmNGY2Ii8+CjxyZWN0IHg9IjE1MCIgeT0iMTUwIiB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgcng9IjEwIiBmaWxsPSIjOWNhM2FmIi8+Cjx0ZXh0IHg9IjIwMCIgeT0iMjQwIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzM3NDE1MSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+UHJvZHVjdDwvdGV4dD4KPC9zdmc+';
  const initialSrc = src && src.trim() ? src : fallbackSrc;
  
  const [imageSrc, setImageSrc] = useState(initialSrc);
  const [imageError, setImageError] = useState(!src || !src.trim());

  const handleError = useCallback(() => {
    setImageError(true);
    setImageSrc(fallbackSrc);
  }, []);

  // Check if image is external (ImageBB, etc.) or using fallback
  const isExternalImage = imageSrc.startsWith('http') && (imageSrc.includes('ibb.co') || imageSrc.includes('imagebb'));
  const isUsingFallback = imageSrc === fallbackSrc;
  const shouldUnoptimize = isUsingFallback || isExternalImage;

  return (
    <Image
      src={imageSrc}
      alt={alt}
      width={400}
      height={400}
      className={className}
      onError={handleError}
      unoptimized={shouldUnoptimize}
      priority={priority}
      quality={85}
      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
      {...props}
    />
  );
});

OptimizedImage.displayName = 'OptimizedImage';

// Main ProductCard Component - Memoized for performance
const ProductCard = memo(({ 
  product, 
  onProductClick,
  onAddToCart,
  variant = 'default', // 'default', 'featured'
  priority = false // For image priority loading (LCP optimization)
}) => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  
  // Get current cart and wishlist state from Redux
  const cartItems = useAppSelector((state) => state.user.cart.items);
  const wishlistItems = useAppSelector((state) => state.user.wishlist.items);
  
  // Check if product is already in cart or wishlist - memoized for performance
  const productId = product.id || product._id;
  const isInCart = React.useMemo(() => 
    cartItems.some(item => item.id === productId), [cartItems, productId]
  );
  const isInWishlist = React.useMemo(() => 
    wishlistItems.some(item => item.id === productId), [wishlistItems, productId]
  );
  
  const [justAdded, setJustAdded] = useState({ cart: false, wishlist: false });

  // Calculate discount percentage using utility
  const discount = React.useMemo(() => 
    calculateDiscount(product.originalPrice, product.price), 
    [product.originalPrice, product.price]
  );

  // Check stock - support both stockCount and stock fields
  const stockAmount = product.stockCount ?? product.stock ?? null;
  const isOutOfStock = stockAmount === 0;

  // Memoized event handlers
  const handleCartToggle = useCallback((e) => {
    e.stopPropagation();
    
    try {
      const result = toggleUtils.cart(dispatch, product, cartItems);
      
      // Show feedback animation for both add and remove actions
      if (result.action === 'added') {
        setJustAdded(prev => ({ ...prev, cart: true }));
        setTimeout(() => setJustAdded(prev => ({ ...prev, cart: false })), 2000);
      }
      
      onAddToCart?.(product);
    } catch (error) {
      console.error('Error toggling cart:', error);
    }
  }, [dispatch, product, cartItems, onAddToCart]);

  const handleWishlistToggle = useCallback((e) => {
    e.stopPropagation();
    
    try {
      const result = toggleUtils.wishlist(dispatch, product, wishlistItems);
      
      // Show feedback animation for both add and remove actions
      if (result.action === 'added') {
        setJustAdded(prev => ({ ...prev, wishlist: true }));
        setTimeout(() => setJustAdded(prev => ({ ...prev, wishlist: false })), 2000);
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error);
    }
  }, [dispatch, product, wishlistItems]);

  const handleProductClick = useCallback(() => {
    onProductClick?.();
    // Use the correct ID field from normalized data
    const productId = product.id || product._id;
    router.push(`/productDetails/${productId}`);
  }, [onProductClick, router, product.id, product._id]);

  const handleQuickView = useCallback((e) => {
    e.stopPropagation();
    // Quick view modal logic could be added here
  }, []);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ y: -8 }}
      onClick={handleProductClick}
      className={`
        relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl 
        transition-all duration-300 cursor-pointer group border border-gray-100
        flex flex-col h-full
        ${variant === 'featured' ? 'max-w-sm' : ''}
      `}
    >
      {/* Image Section */}
      <div className="relative aspect-square overflow-hidden bg-gray-50">
        <OptimizedImage
          src={product.primaryImage || product.imageUrl || product.image}
          alt={product.name || 'Product'}
          className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ${
            isOutOfStock ? 'grayscale opacity-60' : ''
          }`}
          priority={priority}
        />
        
        {/* SOLD OUT Text Overlay - Premium Design */}
        {isOutOfStock && (
          <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/20">
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
        
        {/* Discount Badge */}
        {discount > 0 && !isOutOfStock && (
          <Badge variant="destructive" className="absolute top-3 left-3 z-10">
            -{discount}%
          </Badge>
        )}

        {/* Action Buttons */}
        <div className="absolute top-3 right-3 flex flex-col space-y-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleWishlistToggle}
            className={`
              w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg
              ${isInWishlist 
                ? 'bg-red-500 text-white hover:bg-red-600' 
                : 'bg-white/90 backdrop-blur-sm text-gray-600 hover:bg-white hover:text-red-500'
              }
              ${justAdded.wishlist ? 'animate-pulse' : ''}
            `}
            title={isInWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
          >
            <Heart 
              size={14} 
              fill={isInWishlist ? 'currentColor' : 'none'}
              className="transition-all duration-200 sm:w-[18px] sm:h-[18px]"
            />
          </motion.button>
        </div>

        {/* Quick Add to Cart Button - Toggle Style */}
        <motion.button
          whileHover={{ scale: isOutOfStock ? 1 : 1.1 }}
          whileTap={{ scale: isOutOfStock ? 1 : 0.95 }}
          onClick={isOutOfStock ? (e) => e.stopPropagation() : handleCartToggle}
          disabled={isOutOfStock}
          className={`
            absolute bottom-2 right-2 sm:bottom-3 sm:right-3 w-8 h-8 sm:w-10 sm:h-10 rounded-full
            flex items-center justify-center transition-all duration-200 shadow-lg
            opacity-100 translate-y-0 md:opacity-0 md:group-hover:opacity-100 md:translate-y-2 md:group-hover:translate-y-0
            ${isOutOfStock 
              ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
              : isInCart 
                ? 'bg-green-500 text-white hover:bg-green-600' 
                : 'bg-black text-white hover:bg-gray-800'
            }
            ${justAdded.cart ? 'animate-bounce' : ''}
          `}
          title={isOutOfStock ? 'Out of Stock' : isInCart ? 'Remove from Cart' : 'Add to Cart'}
        >
          <ShoppingCart 
            size={14} 
            fill={isInCart ? 'currentColor' : 'none'}
            className="transition-all duration-200 sm:w-[18px] sm:h-[18px]"
          />
        </motion.button>
      </div>

      {/* Product Info */}
      <div className="p-2 sm:p-3 md:p-4 flex flex-col flex-grow">
        <div className="flex items-start justify-between mb-1 sm:mb-2">
          <h3 className="font-semibold text-gray-900 line-clamp-2 flex-1 text-xs sm:text-sm md:text-base">
            {product.name}
          </h3>
          <div className="flex items-center space-x-0.5 sm:space-x-1 ml-1 sm:ml-2 flex-shrink-0">
            <Star size={10} className="text-yellow-400 fill-current sm:w-[14px] sm:h-[14px]" />
            <span className="text-[10px] sm:text-xs md:text-sm text-gray-600">
              {product.rating || '4.5'}
            </span>
          </div>
        </div>
        
        {/* Brand Badge */}
        {product.brand && (
          <div className="mb-1 sm:mb-2">
            <span className="bg-indigo-100 text-indigo-700 px-1.5 py-0.5 text-[10px] sm:text-xs font-semibold rounded">
              {product.brand}
            </span>
          </div>
        )}
        
        <p className="text-gray-600 text-[10px] sm:text-xs md:text-sm mb-2 sm:mb-3 line-clamp-2 flex-grow hidden sm:block">
          {product.shortDescription || product.description}
        </p>
        
        <div className="flex items-center justify-between mt-auto">
          <div className="flex items-center space-x-2">
            <span className="text-sm sm:text-base md:text-xl font-bold text-gray-900">
              ৳{product.price}
            </span>
            {product.originalPrice && (
              <span className="text-[10px] sm:text-xs md:text-sm text-gray-500 line-through">
                ৳{product.originalPrice}
              </span>
            )}
          </div>
          
          <span className="text-[10px] sm:text-xs md:text-sm text-gray-500 capitalize flex-shrink-0">
            {product.category}
          </span>
        </div>

        {/* Stock Status */}
        {stockAmount !== null && (
          <div className="mt-2">
            {isOutOfStock ? (
              <Badge 
                variant="destructive"
                className="text-xs animate-pulse"
              >
                ❌ Out of Stock
              </Badge>
            ) : stockAmount <= 5 ? (
              <Badge 
                variant="default"
                className="text-xs bg-orange-100 text-orange-700"
              >
                ⚠️ Only {stockAmount} left
              </Badge>
            ) : (
              <Badge 
                variant="default"
                className="text-xs bg-green-100 text-green-700"
              >
                ✓ In Stock ({stockAmount})
              </Badge>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
});

ProductCard.displayName = 'ProductCard';

export default ProductCard;