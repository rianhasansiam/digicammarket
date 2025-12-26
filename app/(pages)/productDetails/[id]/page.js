'use client';

import React from 'react';
import { useProducts, useProductReviews } from '@/lib/hooks/useReduxData';
import { useAppDispatch } from '@/app/redux/reduxHooks';
import { addToCart, removeFromCart, addToWishlist, removeFromWishlist } from '@/app/redux/slice';
import { PLACEHOLDER_IMAGES } from '@/lib/constants';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Star, StarIcon, ThumbsUp, ShieldCheck, Clock, User, MessageSquare, Heart, X } from 'lucide-react';
import LoadingSpinner from '../../../componets/loading/LoadingSpinner';
import { TextSkeleton } from '../../../componets/loading/SkeletonLoaders';
import { motion, AnimatePresence } from 'framer-motion';
import ReviewForm from '../components/ReviewForm';
import StructuredData, { MultipleStructuredData } from '../../../componets/shared/StructuredData';

// Optimized Image component with error handling
const OptimizedImage = ({ src, alt, className, width, height, priority = false, ...props }) => {
  const fallbackSrc = PLACEHOLDER_IMAGES.PRODUCT_LARGE;
  
  // Validate and clean the image URL
  const getValidImageUrl = (url) => {
    if (!url || typeof url !== 'string' || !url.trim()) return fallbackSrc;
    
    let cleanUrl = url.trim();
    
    // Fix common i.ibb.co URL issues
    if (cleanUrl.includes('i.ibb.co') && !cleanUrl.startsWith('http')) {
      cleanUrl = `https://${cleanUrl}`;
    }
    
    // Check if it's a valid URL
    try {
      const urlObj = new URL(cleanUrl);
      // Additional validation for i.ibb.co URLs
      if (urlObj.hostname === 'i.ibb.co') {
        // Ensure the path looks correct for i.ibb.co
        if (!urlObj.pathname || urlObj.pathname === '/') {
          return fallbackSrc;
        }
      }
      return cleanUrl;
    } catch {
      // If not a valid URL, return fallback
      return fallbackSrc;
    }
  };

  const initialSrc = getValidImageUrl(src);
  const [imageSrc, setImageSrc] = useState(initialSrc);
  const [imageError, setImageError] = useState(initialSrc === fallbackSrc);

  const handleError = useCallback(() => {
    setImageError(true);
    setImageSrc(fallbackSrc);
  }, [fallbackSrc]);

  // Check if image is external (ImageBB, etc.) or using fallback
  const isExternalImage = imageSrc.startsWith('http') && (imageSrc.includes('ibb.co') || imageSrc.includes('imagebb'));
  const isUsingFallback = imageSrc === fallbackSrc;
  const shouldUnoptimize = isUsingFallback || isExternalImage;

  return (
    <Image
      src={imageSrc}
      alt={alt}
      width={width}
      height={height}
      className={className}
      onError={handleError}
      unoptimized={shouldUnoptimize}
      {...props}
    />
  );
};

export default function ProductDetailPage({ params }) {
  // Unwrap params using React.use() for Next.js 15 compatibility
  const resolvedParams = React.use(params);
  const productId = resolvedParams.id;
  
  // Redux hook
  const dispatch = useAppDispatch();
  
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isInCart, setIsInCart] = useState(false);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [toast, setToast] = useState({ show: false, type: 'success', message: '' });
  const [isPaused, setIsPaused] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const scrollContainerRef = useRef(null);
  
  // 🚀 OPTIMIZED: Use Redux store for centralized data caching - NO duplicate API calls
  const { data: products, isLoading, error } = useProducts();

  // Fetch reviews for this product from Redux cache
  const { data: productReviews = [], isLoading: reviewsLoading, refetch: refetchReviews } = useProductReviews(productId);

  // Find the specific product by ID from real database (handle both _id and id)
  const product = products?.find(p => p._id === productId || p.id === productId);

  // Local Storage utility functions
  const getCartFromStorage = () => {
    if (typeof window !== 'undefined') {
      const cart = localStorage.getItem('cart');
      return cart ? JSON.parse(cart) : [];
    }
    return [];
  };

  const getWishlistFromStorage = () => {
    if (typeof window !== 'undefined') {
      const wishlist = localStorage.getItem('wishlist');
      return wishlist ? JSON.parse(wishlist) : [];
    }
    return [];
  };

  const saveCartToStorage = (cart) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('cart', JSON.stringify(cart));
    }
  };

  const saveWishlistToStorage = (wishlist) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('wishlist', JSON.stringify(wishlist));
    }
  };

  // Check if product is in cart or wishlist
  useEffect(() => {
    if (product && selectedSize && selectedColor) {
      const cart = getCartFromStorage();
      const wishlist = getWishlistFromStorage();
      
      // Check if this specific product variant (id + size + color) is in cart
      setIsInCart(cart.some(item => 
        item.id === product._id && 
        item.size === selectedSize && 
        item.color === selectedColor
      ));
      setIsInWishlist(wishlist.some(item => item.id === product._id));
    }
  }, [product, selectedSize, selectedColor]);

  // Show toast notification
  const showToast = (type, message) => {
    setToast({ show: true, type, message });
    setTimeout(() => {
      setToast({ show: false, type: 'success', message: '' });
    }, 3000);
  };

  // Add/Remove from Cart function (Toggle)
  const handleAddToCart = () => {
    if (!product) return;
    
    if (!selectedSize || !selectedColor) {
      showToast('error', 'Please select size and color before adding to cart!');
      return;
    }
    
    try {
      const cart = getCartFromStorage();
      const existingItem = cart.find(item => 
        item.id === product._id && 
        item.size === selectedSize && 
        item.color === selectedColor
      );
      
      if (existingItem) {
        // Remove from cart
        dispatch(removeFromCart({
          id: product._id,
          size: selectedSize,
          color: selectedColor
        }));
        setIsInCart(false);
        showToast('success', 'Product removed from cart!');
      } else {
        // Add to cart
        dispatch(addToCart({
          product: product,
          quantity: quantity,
          size: selectedSize,
          color: selectedColor
        }));
        setIsInCart(true);
        showToast('success', 'Product added to cart successfully!');
      }
    } catch (error) {
      console.error('Error updating cart:', error);
      showToast('error', 'Failed to update cart!');
    }
  };

  // Add to Wishlist function
  const handleAddToWishlist = () => {
    if (!product) return;
    
    try {
      if (isInWishlist) {
        // Remove from wishlist
        dispatch(removeFromWishlist(product._id));
        setIsInWishlist(false);
        showToast('success', 'Product removed from wishlist!');
      } else {
        // Add to wishlist
        dispatch(addToWishlist(product));
        setIsInWishlist(true);
        showToast('success', 'Product added to wishlist successfully!');
      }
    } catch (error) {
      console.error('Error updating wishlist:', error);
      showToast('error', 'Failed to update wishlist!');
    }
  };

  // Smooth auto-scroll effect for reviews using requestAnimationFrame
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer || productReviews.length === 0) return;

    let scrollSpeed = 0.5; // pixels per frame - smoother than interval
    let animationFrame;

    const autoScroll = () => {
      if (!isPaused && scrollContainer) {
        scrollContainer.scrollLeft += scrollSpeed;
        
        // Reset scroll when reaching the end for seamless loop
        if (scrollContainer.scrollLeft >= scrollContainer.scrollWidth - scrollContainer.clientWidth) {
          scrollContainer.scrollLeft = 0;
        }
      }
      animationFrame = requestAnimationFrame(autoScroll);
    };

    // Start auto-scroll
    animationFrame = requestAnimationFrame(autoScroll);

    // Cleanup
    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [isPaused, productReviews.length]);

  // Handle mouse events for pausing
  const handleMouseEnter = () => {
    setIsPaused(true);
  };

  const handleMouseLeave = () => {
    setIsPaused(false);
  };

  // Set default selections when product loads
  if (product && !selectedColor && product.colors?.length > 0) {
    setSelectedColor(product.colors[0]);
  }
  if (product && !selectedSize && product.sizes?.length > 0) {
    setSelectedSize(product.sizes[0]);
  }

  // Handle loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          
        </div>
      </div>
    );
  }

  // Handle error or product not found
  if (error || !product) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h2>
          <p className="text-gray-600 mb-8">The product you&apos;re looking for doesn&apos;t exist.</p>
          <Link 
            href="/allProducts" 
            className="inline-flex items-center px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            Back to All Products
          </Link>
        </div>
      </div>
    );
  }

  // Calculate average rating from product reviews
  const avgRating = productReviews.length > 0 
    ? (productReviews.reduce((sum, review) => sum + review.rating, 0) / productReviews.length).toFixed(1)
    : 0;

  return (
    <>
      {/* Structured Data for SEO */}
      <MultipleStructuredData 
        items={[
          {
            type: 'product',
            data: {
              name: product.name || product.title,
              description: product.description,
              image: product.images?.[0] || product.primaryImage || product.image,
              price: product.price,
              currency: 'BDT',
              brand: product.category || 'Digicam Market',
              sku: product._id,
              stock: product.stock,
              rating: avgRating,
              reviewCount: productReviews.length
            }
          },
          {
            type: 'breadcrumb',
            data: {
              items: [
                { name: 'Home', url: '/' },
                { name: 'Products', url: '/allProducts' },
                { name: product.name || product.title, url: `/productDetails/${product._id}` }
              ]
            }
          }
        ]}
      />
      
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8 bg-white shadow-sm">
        {/* Breadcrumb */}
        <nav className="mb-8">
          <div className="flex items-center space-x-2 text-sm">
            <Link href="/" className="text-gray-500 hover:text-gray-700 transition-colors">
              Home
            </Link>
            <span className="text-gray-400">→</span>
            <Link href="/allProducts" className="text-gray-500 hover:text-gray-700 transition-colors">
              Products
            </Link>
            <span className="text-gray-400">→</span>
            <span className="text-gray-900 font-medium">{product.name || product.title}</span>
          </div>
        </nav>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Product Images */}
        <div className="space-y-4">
          {/* Main Image */}
          <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
            <OptimizedImage
              src={product.images?.[selectedImageIndex] || product.primaryImage || product.image || product.images?.[0]}
              alt={product.name}
              width={600}
              height={600}
              className="w-full h-full object-cover transition-opacity duration-300"
              key={selectedImageIndex}
              priority={true}
            />
          </div>
          
          {/* Image Thumbnails */}
          {product.images && product.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => {

                    setSelectedImageIndex(index);
                  }}
                  className={`flex-shrink-0 w-20 h-20 rounded-md overflow-hidden border-2 transition-all duration-200 hover:border-gray-400 ${
                    selectedImageIndex === index ? 'border-black' : 'border-gray-200'
                  }`}
                  type="button"
                >
                  <OptimizedImage
                    src={image}
                    alt={`${product.name} ${index + 1}`}
                    width={80}
                    height={80}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          <div>
            <p className="text-sm text-gray-500 uppercase tracking-wide mb-2">{product.category}</p>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
            
            {/* Brand */}
            {product.brand && (
              <div className="mb-4 flex items-center gap-2">
                <span className="bg-indigo-100 text-indigo-800 px-3 py-1 text-sm font-semibold rounded-full">
                  {product.brand}
                </span>
              </div>
            )}
            
            {/* Short Description */}
            {product.shortDescription && (
              <p className="text-lg text-gray-600 mb-6 font-medium leading-relaxed">
                {product.shortDescription}
              </p>
            )}
            
            {/* Price */}
            <div className="flex items-center gap-4 mb-4">
              <span className="text-3xl font-bold text-gray-900">৳{product.price}</span>
              {product.originalPrice && product.originalPrice > product.price && (
                <>
                  <span className="text-xl text-gray-500 line-through">৳{product.originalPrice}</span>
                  <span className="bg-red-100 text-red-800 px-2 py-1 text-xs font-medium rounded-full">
                    {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
                  </span>
                </>
              )}
            </div>

            {/* Stock Information */}
            <div className="mb-6">
              {(() => {
                const stock = product.stock || 0;
                if (stock === 0) {
                  return (
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                      <span className="text-red-600 font-medium">Out of Stock</span>
                    </div>
                  );
                } else if (stock <= 10) {
                  return (
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                      <span className="text-orange-600 font-medium">Low Stock - Only {stock} left!</span>
                    </div>
                  );
                } else {
                  return (
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      <span className="text-green-600 font-medium">In Stock ({stock} available)</span>
                    </div>
                  );
                }
              })()}
            </div>

            {/* Rating */}
            {product.rating && (
              <div className="flex items-center gap-2 mb-6">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <span
                      key={i}
                      className={`text-lg ${
                        i < Math.floor(product.rating) ? 'text-yellow-400' : 'text-gray-300'
                      }`}
                    >
                      ★
                    </span>
                  ))}
                </div>
                <span className="text-sm text-gray-600">
                  {product.rating} ({product.reviews?.user?.length || 0} reviews)
                </span>
              </div>
            )}
          </div>

          <div className="space-y-6">

          {/* Colors */}
          {product.colors && product.colors.length > 0 && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <label className="block text-sm font-semibold text-gray-800 mb-3">
                Available Colors{selectedColor ? ` - ${selectedColor}` : ''}
              </label>
              <div className="flex flex-wrap gap-3">
                {product.colors.map((color, index) => {
                  // Map color names to actual color values
                  const colorMap = {
                    'Red': '#EF4444',
                    'Blue': '#3B82F6', 
                    'Green': '#10B981',
                    'Black': '#000000',
                    'White': '#FFFFFF',
                    'Gray': '#6B7280',
                    'Grey': '#6B7280',
                    'Yellow': '#F59E0B',
                    'Orange': '#F97316',
                    'Purple': '#8B5CF6',
                    'Pink': '#EC4899',
                    'Brown': '#92400E',
                    'Navy': '#1E3A8A',
                    'Beige': '#F5F5DC',
                    'Maroon': '#7F1D1D'
                  };
                  
                  const colorValue = colorMap[color] || color.toLowerCase();
                  
                  return (
                    <button
                      key={index}
                      onClick={() => setSelectedColor(color)}
                      className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-2 rounded-lg transition-all duration-200 ${
                        selectedColor === color
                          ? 'border-black bg-gray-50 shadow-lg transform scale-105'
                          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                      }`}
                    >
                      <div 
                        className={`w-8 h-8 rounded-full border-2 ${
                          color === 'White' ? 'border-gray-300' : 'border-gray-400'
                        }`}
                        style={{ backgroundColor: colorValue }}
                      ></div>
                      <span className="text-gray-800">{color}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Sizes */}
          {product.sizes && product.sizes.length > 0 && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <label className="block text-sm font-semibold text-gray-800 mb-3">
                Camera Type
                {selectedSize && <span className="text-gray-500 font-normal ml-2">- {selectedSize}</span>}
              </label>
              <div className="flex flex-wrap gap-3">
                {product.sizes.map((size, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedSize(size)}
                    className={`px-5 py-2.5 text-sm font-medium border-2 rounded-lg transition-all duration-200 min-w-[60px] ${
                      selectedSize === size
                        ? 'border-black bg-black text-white shadow-lg transform scale-105'
                        : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <label className="block text-sm font-semibold text-gray-800 mb-3">Quantity</label>
            <div className="flex items-center gap-4">
              <div className="flex items-center border-2 border-gray-200 rounded-lg bg-white">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-12 h-12 flex items-center justify-center text-lg font-semibold hover:bg-gray-50 transition-colors rounded-l-lg"
                  disabled={quantity <= 1}
                >
                  -
                </button>
                <span className="px-6 py-3 text-lg font-semibold border-x border-gray-200 bg-white min-w-[60px] text-center">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(Math.min((product.stock || 99), quantity + 1))}
                  className="w-12 h-12 flex items-center justify-center text-lg font-semibold hover:bg-gray-50 transition-colors rounded-r-lg"
                  disabled={quantity >= (product.stock || 99)}
                >
                  +
                </button>
              </div>
              {product.stock && quantity >= product.stock && (
                <span className="text-sm text-orange-600">Max quantity reached</span>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4 pt-6">
            <button 
              onClick={handleAddToCart}
              className={`w-full py-4 px-6 rounded-lg font-semibold text-lg transition-all duration-200 ${
                (product.stock || 0) === 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : isInCart
                  ? 'bg-red-600 text-white hover:bg-red-700 hover:shadow-lg transform hover:-translate-y-0.5'
                  : 'bg-black text-white hover:bg-gray-800 hover:shadow-lg transform hover:-translate-y-0.5'
              }`}
              disabled={(product.stock || 0) === 0}
            >
              {(product.stock || 0) === 0 
                ? 'Out of Stock' 
                : isInCart 
                ? '✗ Remove from Cart' 
                : 'Add to Cart'
              }
            </button>
            
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={handleAddToWishlist}
                className={`py-3 px-6 border-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                  isInWishlist
                    ? 'border-red-500 bg-red-50 text-red-600 hover:bg-red-100'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <Heart 
                  size={18} 
                  className={`${isInWishlist ? 'fill-current text-red-500' : ''}`} 
                />
                {isInWishlist ? 'In Wishlist' : 'Add to Wishlist'}
              </button>
              <Link
                href="/allProducts"
                className="py-3 px-6 border-2 border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-colors font-medium text-center"
              >
                Continue Shopping
              </Link>
            </div>
          </div>

           




          </div>
        </div>
      </div>
      </div>

   {/* Product Description Section */}
              <div className="bg-white border border-gray-200 rounded-xl p-8 mb-8 container mx-auto">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                    <span className="text-gray-600 text-lg">📝</span>
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-gray-900">Product Description</h4>
                    <p className="text-gray-600 text-sm">Detailed information about this product</p>
                  </div>
                </div>
                <div className="prose prose-lg text-gray-700 leading-relaxed">
                  <p>{product.description || 'High quality product with excellent features and comfortable design. Made with premium materials and attention to detail, this product offers exceptional value and durability for everyday use.'}</p>
                </div>
              </div>


 {/* Product Information */}
            <div className="border-t border-gray-200 pt-8 container mx-auto px-4">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <ShieldCheck className="text-blue-600" size={20} />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Product Details</h3>
                  <p className="text-gray-600 text-sm">Everything you need to know about this product</p>
                </div>
              </div>

              {/* Information Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {/* Product ID Card */}
                <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                      <span className="text-gray-600 font-mono text-lg">#</span>
                    </div>
                    <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-md text-xs font-medium">ID</span>
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-1">Product ID</h4>
                  <p className="text-gray-600 text-sm font-mono">{product._id?.slice(-8).toUpperCase()}</p>
                </div>

                {/* Category Card */}
                <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <span className="text-blue-600 text-lg">📂</span>
                    </div>
                    <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-md text-xs font-medium">Category</span>
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-1">Category</h4>
                  <p className="text-blue-600 font-medium">{product.category || 'General'}</p>
                </div>

                {/* Brand Card */}
                <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <span className="text-purple-600 text-lg">🏷️</span>
                    </div>
                    <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-md text-xs font-medium">Brand</span>
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-1">Brand</h4>
                  <p className="text-purple-600 font-medium">{product.brand ||'Digicam Market'}</p>
                </div>

                {/* Stock Status Card */}
                <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      (product.stock || 0) > 10 
                        ? 'bg-green-100' 
                        : (product.stock || 0) > 0 
                        ? 'bg-orange-100' 
                        : 'bg-red-100'
                    }`}>
                      <span className={`text-lg ${
                        (product.stock || 0) > 10 
                          ? 'text-green-600' 
                          : (product.stock || 0) > 0 
                          ? 'text-orange-600' 
                          : 'text-red-600'
                      }`}>📦</span>
                    </div>
                    <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                      (product.stock || 0) > 10 
                        ? 'bg-green-100 text-green-700' 
                        : (product.stock || 0) > 0 
                        ? 'bg-orange-100 text-orange-700' 
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {(product.stock || 0) > 10 ? 'In Stock' : (product.stock || 0) > 0 ? 'Limited' : 'Out'}
                    </span>
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-1">Availability</h4>
                  <p className={`font-medium ${
                    (product.stock || 0) > 10 
                      ? 'text-green-600' 
                      : (product.stock || 0) > 0 
                      ? 'text-orange-600' 
                      : 'text-red-600'
                  }`}>
                    {(product.stock || 0)} units available
                  </p>
                </div>

                {/* Style Card */}
                <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center">
                      <span className="text-pink-600 text-lg">✨</span>
                    </div>
                    <span className="bg-pink-100 text-pink-700 px-2 py-1 rounded-md text-xs font-medium">Style</span>
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-1">Style</h4>
                  <p className="text-pink-600 font-medium">{product.style || 'Classic'}</p>
                </div>

                {/* Date Added Card */}
                {product.createdAt && (
                  <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow duration-300">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                        <Clock className="text-indigo-600" size={20} />
                      </div>
                      <span className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded-md text-xs font-medium">Added</span>
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-1">Date Added</h4>
                    <p className="text-indigo-600 font-medium">
                      {new Date(product.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                )}
              </div>

           

              {/* Premium Features Section */}
              <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-8 border border-blue-100">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                    <Star className="text-white fill-current" size={18} />
                  </div>
                  <h4 className="text-xl font-bold text-gray-900">Premium Benefits</h4>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="flex items-center gap-3 bg-white/60 backdrop-blur-sm rounded-xl p-4">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <span className="text-green-600 text-lg">🚚</span>
                    </div>
                    <div>
                      <h5 className="font-semibold text-gray-900 text-sm">Free Shipping</h5>
                      <p className="text-gray-600 text-xs">On all orders</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 bg-white/60 backdrop-blur-sm rounded-xl p-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <span className="text-blue-600 text-lg">↩️</span>
                    </div>
                    <div>
                      <h5 className="font-semibold text-gray-900 text-sm">30-Day Returns</h5>
                      <p className="text-gray-600 text-xs">Easy returns</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 bg-white/60 backdrop-blur-sm rounded-xl p-4">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <ShieldCheck className="text-purple-600" size={20} />
                    </div>
                    <div>
                      <h5 className="font-semibold text-gray-900 text-sm">Quality Guarantee</h5>
                      <p className="text-gray-600 text-xs">Premium quality</p>
                    </div>
                  </div>
                  
                  {(product.stock || 0) > 0 && (
                    <div className="flex items-center gap-3 bg-white/60 backdrop-blur-sm rounded-xl p-4">
                      <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                        <span className="text-orange-600 text-lg">⚡</span>
                      </div>
                      <div>
                        <h5 className="font-semibold text-gray-900 text-sm">Fast Delivery</h5>
                        <p className="text-gray-600 text-xs">Quick shipping</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

      {/* Reviews Section - Full Width */}
      <div className="bg-gray-50 border-t border-gray-200">
        <div className="container mx-auto px-4 py-16">
          {/* Section Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <MessageSquare className="text-blue-600" size={32} />
              <h2 className="text-3xl font-bold text-gray-900">Customer Reviews</h2>
            </div>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              See what our customers are saying about this product
            </p>
            <div className="mt-4">
              <span className="bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium">
                {productReviews.length} review{productReviews.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          {/* Reviews Summary */}
          {productReviews.length > 0 && (
            <div className="bg-white rounded-2xl shadow-lg p-8 mb-12 max-w-4xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="text-center">
                  <div className="text-5xl font-bold text-gray-900 mb-2">
                    {productReviews.length > 0 
                      ? (productReviews.reduce((sum, review) => sum + review.rating, 0) / productReviews.length).toFixed(1)
                      : '0.0'
                    }
                  </div>
                  <div className="flex items-center justify-center mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={24}
                        className={`${
                          i < Math.round(productReviews.reduce((sum, review) => sum + review.rating, 0) / productReviews.length)
                            ? 'text-yellow-400 fill-current' 
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-gray-600">
                    Based on {productReviews.length} reviews
                  </p>
                </div>
                
                <div className="space-y-3">
                  {[5, 4, 3, 2, 1].map(rating => {
                    const count = productReviews.filter(review => review.rating === rating).length;
                    const percentage = productReviews.length > 0 ? (count / productReviews.length) * 100 : 0;
                    return (
                      <div key={rating} className="flex items-center space-x-3">
                        <span className="text-gray-600 w-4 text-sm font-medium">{rating}</span>
                        <Star size={16} className="text-yellow-400 fill-current" />
                        <div className="flex-1 bg-gray-200 rounded-full h-3 max-w-40">
                          <div 
                            className="bg-yellow-400 h-3 rounded-full transition-all duration-500" 
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-gray-600 text-sm w-8">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
          
          {/* Enhanced Reviews Cards - Horizontal Scroll */}
          <div className="relative">
            {reviewsLoading ? (
              <div className="text-center py-16">
                <LoadingSpinner size="lg" />
                <p className="text-gray-600 text-lg mt-4">Loading reviews...</p>
              </div>
            ) : productReviews.length > 0 ? (
              <motion.div 
                className="relative overflow-hidden"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
              >
                {/* Gradient overlays for smooth edges */}
                <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-gray-50 to-transparent z-10 pointer-events-none"></div>
                <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-gray-50 to-transparent z-10 pointer-events-none"></div>
                
                {/* Scroll Container */}
                <div 
                  ref={scrollContainerRef}
                  className="flex gap-6 overflow-x-hidden py-4"
                  style={{
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none'
                  }}
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                >
                  {/* Duplicate reviews for seamless scrolling */}
                  {[...productReviews, ...productReviews].map((review, index) => (
                    <motion.div 
                      key={`${review._id}-${index}`} 
                      className="flex-shrink-0 w-80 md:w-96 bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300"
                      whileHover={{ y: -5 }}
                    >
                      {/* Customer Info */}
                      <div className="flex items-center gap-4 mb-4">
                        <div className="relative w-12 h-12">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold shadow-lg">
                            <User size={20} />
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-gray-900">
                              {review.customerName || 'Anonymous Customer'}
                            </h4>
                            {review.verified && (
                              <div className="flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs">
                                <ShieldCheck className="w-3 h-3" />
                                <span>Verified</span>
                              </div>
                            )}
                          </div>
                          <p className="text-sm text-gray-500">
                            {new Date(review.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>

                      {/* Rating */}
                      <div className="flex items-center gap-2 mb-3">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < review.rating 
                                  ? 'text-yellow-400 fill-current' 
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm font-medium text-gray-700">
                          {review.rating}.0
                        </span>
                      </div>

                      {/* Review Title */}
                      <h3 className="font-bold text-lg text-gray-900 mb-3">
                        {review.title || 'Great Product!'}
                      </h3>

                      {/* Review Comment */}
                      <p className="text-gray-600 text-sm leading-relaxed mb-4 line-clamp-4">
                        {review.comment}
                      </p>

                      {/* Product Info */}
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500 mb-1">Reviewed Product:</p>
                        <p className="font-medium text-gray-900 text-sm">{product?.name || 'This Product'}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Pause indicator */}
                <motion.div 
                  className="text-center mt-8"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: isPaused ? 1 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <p className="text-sm text-gray-500">
                    Hover over reviews to pause scrolling
                  </p>
                </motion.div>
              </motion.div>
            ) : (
              <div className="text-center py-16 bg-white rounded-2xl shadow-lg">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <MessageSquare className="text-gray-400" size={32} />
                </div>
                <h4 className="text-2xl font-medium text-gray-900 mb-3">No Reviews Yet</h4>
                <p className="text-gray-600 mb-8 max-w-md mx-auto">Be the first to share your thoughts about this product and help other customers make informed decisions!</p>
                <button 
                  onClick={() => setShowReviewForm(true)}
                  className="inline-flex items-center space-x-2 px-8 py-4 bg-gray-800 hover:bg-gray-700 text-white font-medium rounded-xl transition-colors shadow-lg"
                >
                  <Star size={20} />
                  <span>Write a Review</span>
                </button>
              </div>
            )}
          </div>

          {/* Write Review Button - Show when there are reviews */}
          {productReviews.length > 0 && (
            <div className="text-center mt-12">
              <button
                onClick={() => setShowReviewForm(true)}
                className="inline-flex items-center space-x-2 px-8 py-4 bg-black hover:bg-gray-800 text-white font-medium rounded-xl transition-colors shadow-lg"
              >
                <Star size={20} />
                <span>Write Your Review</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast.show && (
          <motion.div
            initial={{ opacity: 0, y: -100, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -100, scale: 0.95 }}
            className="fixed top-4 right-4 z-[60]"
          >
            <div className={`${
              toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
            } text-white rounded-xl shadow-2xl p-4 min-w-[300px] max-w-md`}>
              <div className="flex items-center justify-between">
                <p className="font-medium text-sm">{toast.message}</p>
                <button
                  onClick={() => setToast({ ...toast, show: false })}
                  className="ml-4 p-1 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Review Form Modal */}
      <AnimatePresence>
        {showReviewForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowReviewForm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">Write a Review</h3>
                <button
                  onClick={() => setShowReviewForm(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-6">
                <ReviewForm
                  productId={productId}
                  productName={product?.name || 'Product'}
                  onClose={() => setShowReviewForm(false)}
                  onSuccess={() => {
                    refetchReviews();
                    setToast({
                      show: true,
                      type: 'success',
                      message: 'Review submitted successfully! Pending approval.'
                    });
                  }}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    </>
  );
}