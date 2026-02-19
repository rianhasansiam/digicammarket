'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppSelector, useAppDispatch } from '@/app/redux/reduxHooks';
import { loadCartFromStorage, updateCartQuantity, removeFromCart } from '@/app/redux/slice';
import { ShoppingBag, Minus, Plus, X, Truck, ArrowLeft, ShoppingCart, Tag, Receipt } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useShippingTaxSettings } from '@/lib/hooks/useShippingTaxSettings';
import { PLACEHOLDER_IMAGES } from '@/lib/constants';

const AddToCartPageClient = ({ productsData, couponsData }) => {
  // Redux state
  const dispatch = useAppDispatch();
  const cartItems = useAppSelector((state) => state.user.cart.items, []);
  
  // Merge cart items with fresh product data to fix undefined values
  const enrichedCartItems = cartItems.map(cartItem => {
    if (!cartItem || !cartItem.id) return cartItem;
    
    // Find the current product data using MongoDB _id
    const currentProduct = productsData?.find(p => p._id === cartItem.id);
    
    if (currentProduct) {
      // Merge cart item with fresh product data, keeping cart-specific fields
      return {
        ...cartItem,
        name: cartItem.name || currentProduct.name,
        price: cartItem.price || currentProduct.price,
        originalPrice: currentProduct.originalPrice,
        image: cartItem.image || currentProduct.image || currentProduct.images?.[0],
        images: currentProduct.images,
        stock: currentProduct.stock,
        colors: currentProduct.colors,
        sizes: currentProduct.sizes,
        description: currentProduct.shortDescription || currentProduct.description,
        category: currentProduct.category,
        style: currentProduct.style
      };
    }
    
    // If product not found in database, return cart item as is
    return cartItem;
  });

  // Shipping and tax settings
  const { calculateTotals: calculateDynamicTotals, freeShippingThreshold, taxEnabled, taxName, isLoading: settingsLoading } = useShippingTaxSettings();

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [toast, setToast] = useState({ show: false, type: 'error', message: '' });

  const showToast = (type, message) => {
    setToast({ show: true, type, message });
    setTimeout(() => {
      setToast({ show: false, type: '', message: '' });
    }, 3000);
  };

  // Get available coupons from props (passed from page level)
  const availableCoupons = couponsData || [];

  // Load cart from localStorage when component mounts
  useEffect(() => {
    dispatch(loadCartFromStorage());
    // Restore persisted coupon from sessionStorage
    if (typeof window !== 'undefined') {
      try {
        const savedCoupon = sessionStorage.getItem('appliedCoupon');
        if (savedCoupon) {
          setAppliedCoupon(JSON.parse(savedCoupon));
        }
      } catch (e) {
        console.error('Error loading saved coupon:', e);
      }
    }
  }, [dispatch]);

  // Simple helper to get current product stock
  const getProductStock = (productId) => {
    if (!productsData) return 10; // Default stock if products not loaded
    const product = productsData.find(p => p._id === productId);
    return product?.stock || 0;
  };

  // Simple helper to check if product is in stock
  const isInStock = (productId) => {
    return getProductStock(productId) > 0;
  };

  // Apply coupon
  const handleApplyCoupon = () => {
    setCouponError('');
    
    // Check if coupon code is provided
    if (!couponCode.trim()) {
      setCouponError('Please enter a coupon code');
      return;
    }

    // Find coupon in database (case insensitive)
    const coupon = availableCoupons.find(c => 
      c.code && c.code.toLowerCase() === couponCode.toLowerCase()
    );
    
    if (!coupon) {
      setCouponError('Invalid coupon code');
      return;
    }

    // Check if coupon is active (if expiry date exists)
    if (coupon.expiryDate && new Date(coupon.expiryDate) < new Date()) {
      setCouponError('This coupon has expired');
      return;
    }

    // Check if coupon is active (if active field exists)
    if (coupon.hasOwnProperty('active') && !coupon.active) {
      setCouponError('This coupon is no longer active');
      return;
    }
    
    const subtotal = enrichedCartItems.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 0)), 0);
    
    // Check minimum amount (use minAmount or minimumAmount field)
    const minAmount = coupon.minAmount || coupon.minimumAmount || 0;
    if (subtotal < minAmount) {
      setCouponError(`Minimum order amount ৳${minAmount} required for this coupon`);
      return;
    }
    
    setAppliedCoupon(coupon);
    setCouponCode('');
    setCouponError('');
    // Persist applied coupon to sessionStorage for checkout page
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('appliedCoupon', JSON.stringify(coupon));
    }
  };

  // Remove coupon
  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError('');
    // Clear persisted coupon from sessionStorage
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('appliedCoupon');
    }
  };

  // Calculate totals with coupon and dynamic shipping/tax
  const calculateTotals = () => {
    const subtotal = enrichedCartItems.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 0)), 0);
    
    let discount = 0;
    if (appliedCoupon) {
      // Handle different field names from database
      const minAmount = appliedCoupon.minAmount || appliedCoupon.minimumAmount || 0;
      const discountValue = appliedCoupon.discount || appliedCoupon.discountPercentage || 0;
      
      if (subtotal >= minAmount) {
        discount = (subtotal * discountValue) / 100;
      }
    }
    
    // Use dynamic calculation if settings are loaded, otherwise fallback
    if (!settingsLoading && calculateDynamicTotals) {
      return calculateDynamicTotals(subtotal, discount);
    }
    
    // Fallback to static calculation while loading
    const shipping = subtotal > 500 ? 0 : 15.99;
    const total = subtotal + shipping - discount;
    
    return {
      subtotal: subtotal.toFixed(2),
      shipping: shipping.toFixed(2),
      discount: discount.toFixed(2),
      tax: '0.00',
      total: total.toFixed(2),
      taxName: 'Tax',
      freeShippingThreshold: 500
    };
  };

  const totals = calculateTotals();

  // Update item quantity
  const handleUpdateQuantity = (itemId, newQuantity) => {
    if (newQuantity < 1) return;
    
    const currentStock = getProductStock(itemId);
    if (newQuantity > currentStock) {
      showToast('error', `Only ${currentStock} items available in stock`);
      return;
    }
    
    const item = cartItems.find(item => item.id === itemId);
    if (item) {
      dispatch(updateCartQuantity({
        id: itemId,
        size: item.size,
        color: item.color,
        newQuantity: newQuantity
      }));
    }
  };

  // Remove item from cart
  const handleRemoveItem = (itemId) => {
    const item = cartItems.find(item => item.id === itemId);
    if (item) {
      dispatch(removeFromCart({
        id: itemId,
        size: item.size,
        color: item.color
      }));
    }
  };

  // Empty cart
  if (enrichedCartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-16">
            <ShoppingBag className="w-24 h-24 text-gray-300 mx-auto mb-8" />
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Your Cart is Empty</h1>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Start shopping to add items to your cart.
            </p>
            <Link href="/allProducts">
              <button className="bg-gray-900 text-white px-8 py-3 rounded-lg hover:bg-gray-800 transition-colors">
                Continue Shopping
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/allProducts">
            <button className="p-2 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
            <p className="text-gray-600">{enrichedCartItems.length} items in your cart</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <AnimatePresence>
                {(enrichedCartItems || []).map((item) => {
                  // Ensure item has required properties
                  if (!item || !item.id) return null;
                  
                  const currentStock = getProductStock(item.id);
                  const itemInStock = isInStock(item.id);
                  
                  return (
                    <motion.div
                      key={`${item.id}-${item.size}-${item.color}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="flex items-center gap-3 sm:gap-4 p-4 border-b border-gray-100 last:border-b-0"
                    >
                      {/* Product Image */}
                      <div className="relative flex-shrink-0">
                        <Image
                          src={item.image || PLACEHOLDER_IMAGES.PRODUCT_SMALL}
                          alt={item.name}
                          width={60}
                          height={60}
                          className="rounded-lg object-cover w-15 h-15 sm:w-20 sm:h-20"
                          unoptimized={true}
                        />
                        {!itemInStock && (
                          <div className="absolute inset-0 bg-red-500 bg-opacity-75 rounded-lg flex items-center justify-center">
                            <span className="text-white text-xs font-medium">Out of Stock</span>
                          </div>
                        )}
                      </div>

                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 mb-1 truncate">{item.name || 'Product Name'}</h3>
                        <div className="text-sm text-gray-500 mb-2">
                          Size: {item.size || 'N/A'} | Color: {item.color || 'N/A'}
                        </div>
                        <div className="text-lg font-bold text-gray-900">
                          ৳{(item.price || 0).toFixed(2)}
                        </div>

                        {/* Stock Status */}
                        {itemInStock && currentStock <= 5 && (
                          <div className="text-sm text-orange-600 mt-1">
                            Only {currentStock} left in stock
                          </div>
                        )}
                        {!itemInStock && (
                          <div className="text-sm text-red-600 mt-1">
                            Out of stock
                          </div>
                        )}
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="flex items-center border border-gray-200 rounded-lg">
                          <button
                            onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1 || !itemInStock}
                            className="p-1.5 sm:p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Minus className="w-3 h-3 sm:w-4 sm:h-4" />
                          </button>
                          <span className="px-2 sm:px-4 py-2 text-center min-w-[40px] sm:min-w-[60px] text-sm sm:text-base">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                            disabled={!itemInStock || item.quantity >= currentStock}
                            className="p-1.5 sm:p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                          </button>
                        </div>

                        {/* Remove Button */}
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Item Total */}
                      <div className="text-right hidden sm:block">
                        <div className="font-bold text-gray-900">
                          ৳{((item.price || 0) * (item.quantity || 0)).toFixed(2)}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>


          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm p-6 sticky top-24">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>
              
              {/* Coupon Section */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-3">Apply Coupon Code</h3>
                {!appliedCoupon ? (
                  <div>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        placeholder="Enter coupon code"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                      />
                      <button
                        onClick={handleApplyCoupon}
                        disabled={!couponCode}
                        className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Apply
                      </button>
                    </div>
                    {couponError && (
                      <p className="text-red-500 text-sm">{couponError}</p>
                    )}
                    <div className="text-xs text-gray-500 mt-2">
                      Available codes: WELCOME10, SAVE20, MEGA50
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between bg-green-50 p-3 rounded-lg">
                    <div>
                      <p className="font-medium text-green-800">{appliedCoupon.code}</p>
                      <p className="text-sm text-green-600">
                        {appliedCoupon.description || `${appliedCoupon.discount || appliedCoupon.discountPercentage || 0}% off`}
                      </p>
                    </div>
                    <button
                      onClick={handleRemoveCoupon}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">৳{totals.subtotal}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-medium">
                    {parseFloat(totals.shipping) === 0 ? 'Free' : `৳${totals.shipping}`}
                  </span>
                </div>
                
                {taxEnabled && parseFloat(totals.tax) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">{totals.taxName || 'Tax'}</span>
                    <span className="font-medium">৳{totals.tax}</span>
                  </div>
                )}
                
                {appliedCoupon && parseFloat(totals.discount) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-green-600">Discount ({appliedCoupon.discount}%)</span>
                    <span className="font-medium text-green-600">-৳{totals.discount}</span>
                  </div>
                )}
                
               
                
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between">
                    <span className="text-lg font-bold">Total</span>
                    <span className="text-lg font-bold">৳{totals.total}</span>
                  </div>
                </div>
              </div>

              {/* Shipping Info */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Truck className="w-4 h-4" />
                  <span>Safe Delivery</span>
                </div>
              </div>

              {/* Checkout Button */}
              <Link href="/checkout">
                <button className="w-full bg-gray-900 text-white py-3 sm:py-4 px-4 sm:px-6 rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base">
                  <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
                  Proceed to Checkout
                </button>
              </Link>

              {/* Continue Shopping */}
              <Link href="/allProducts">
                <button className="w-full mt-3 border border-gray-200 text-gray-700 py-3 sm:py-3 px-4 sm:px-6 rounded-lg hover:bg-gray-50 transition-colors text-sm sm:text-base">
                  Continue Shopping
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast.show && (
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 ${
              toast.type === 'success' 
                ? 'bg-green-500 text-white' 
                : 'bg-red-500 text-white'
            }`}
          >
            {toast.type === 'success' ? (
              <ShoppingCart className="w-5 h-5" />
            ) : (
              <X className="w-5 h-5" />
            )}
            <span>{toast.message}</span>
            <button
              onClick={() => setToast({ show: false, type: '', message: '' })}
              className="ml-2 text-white hover:text-gray-200"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AddToCartPageClient;