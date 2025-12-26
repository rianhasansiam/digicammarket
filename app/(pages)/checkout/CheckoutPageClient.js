'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useProducts } from '@/lib/hooks/useReduxData';
import { useAddData } from '@/lib/hooks/useAddData';
import { useAppSelector, useAppDispatch } from '@/app/redux/reduxHooks';
import { loadCartFromStorage, clearCart } from '@/app/redux/slice';
import { useShippingTaxSettings } from '@/lib/hooks/useShippingTaxSettings';
import { PLACEHOLDER_IMAGES } from '@/lib/constants';
import { 
  ShoppingBag, CheckCircle, AlertCircle, 
  ArrowLeft, User, Truck, Wallet, Upload, X, Info, Phone
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '../../componets/loading/LoadingSpinner';

const CheckoutPageClient = () => {
  // Hooks
  const router = useRouter();
  
  // Shipping and tax settings
  const { calculateTotals: calculateDynamicTotals, taxName, taxEnabled, isLoading: settingsLoading } = useShippingTaxSettings();
  
  // Redux hooks
  const dispatch = useAppDispatch();
  const cartItems = useAppSelector((state) => state.user.cart.items) || [];
  const cartTotalQuantity = useAppSelector((state) => state.user.cart.totalQuantity);
  
  // 🚀 OPTIMIZED: Use Redux store for centralized data caching - NO duplicate API calls
  const { data: products, isLoading, error } = useProducts();

  // Merge cart items with fresh product data to fix undefined values
  const enrichedCartItems = cartItems.map(cartItem => {
    if (!cartItem || !cartItem.id) return cartItem;
    
    // Find the current product data using MongoDB _id
    const currentProduct = products?.find(p => p._id === cartItem.id);
    
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
  
  // Hook for adding order to database
  const { addData: addOrder, isLoading: isAddingOrder, error: orderError } = useAddData({
    name: 'orders',
    api: '/api/orders'
  });
  
  // State management
  const [selectedPayment, setSelectedPayment] = useState('advance'); // Auto-select 15% Advance
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderProcessed, setOrderProcessed] = useState(false); // Prevent multiple submissions
  const [isRedirecting, setIsRedirecting] = useState(false); // Prevent showing empty cart during redirect
  
  // Payment proof modal states
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [paymentProof, setPaymentProof] = useState({
    paymentMethod: 'bkash', // bkash or nagad
    phoneNumber: '',
    transactionId: '',
    screenshot: null,
    screenshotPreview: null
  });
  const fileInputRef = useRef(null);
  
  // Customer information
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    zipCode: ''
  });

  // Payment methods configuration - Only 15% Advance Payment
  const paymentMethods = [
    { id: 'advance', name: '15% Advance Payment', icon: Wallet, description: 'Pay 15% now, rest on delivery' }
  ];

  // Load cart from localStorage when products are loaded
  useEffect(() => {
    if (products && products.length > 0) {
      const getCartFromStorage = () => {
        try {
          const cart = localStorage.getItem('cart');
          return cart ? JSON.parse(cart) : [];
        } catch (error) {
          console.error('Error loading cart:', error);
          return [];
        }
      };

      const cartData = getCartFromStorage();
      
      if (cartData.length > 0) {
        // Load cart data into Redux store
        dispatch(loadCartFromStorage({ cartItems: cartData, products }));
      }
    }
  }, [products, dispatch]);

  // Reset order processed flag when cart changes
  useEffect(() => {
    setOrderProcessed(false);
  }, [enrichedCartItems.length, selectedPayment]);

  // Calculate totals with dynamic shipping and tax
  const calculateTotals = () => {
    const subtotal = enrichedCartItems.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 0)), 0);
    
    // Use dynamic calculation if settings are loaded, otherwise fallback
    if (!settingsLoading && calculateDynamicTotals) {
      return calculateDynamicTotals(subtotal, 0); // No coupon discount in checkout
    }
    
    // Fallback to static calculation while loading
    const shipping = subtotal >= 500 ? 0 : 15.99;
    const tax = subtotal * 0.08;
    const total = subtotal + shipping + tax;

    return {
      subtotal: subtotal.toFixed(2),
      shipping: shipping.toFixed(2),
      tax: tax.toFixed(2),
      total: total.toFixed(2),
      taxName: 'Tax'
    };
  };

  const totals = calculateTotals();

  // Debug logs


  // Handle customer info change
  const handleInfoChange = (field, value) => {
    setCustomerInfo(prev => ({ ...prev, [field]: value }));
  };

  // Validate form
  const isFormValid = () => {
    return (
      customerInfo.name &&
      customerInfo.email &&
      customerInfo.phone &&
      customerInfo.address &&
      customerInfo.city &&
      customerInfo.zipCode &&
      selectedPayment &&
      enrichedCartItems.length > 0
    );
  };

  // Handle file upload for payment screenshot
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size should be less than 5MB');
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please upload an image file');
        return;
      }

      setPaymentProof(prev => ({
        ...prev,
        screenshot: file,
        screenshotPreview: URL.createObjectURL(file)
      }));
    }
  };

  // Upload image to ImageBB
  const uploadPaymentScreenshot = async (file) => {
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch(`https://api.imgbb.com/1/upload?key=${process.env.NEXT_PUBLIC_IMAGEBB_API_KEY}`, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      
      if (data.success) {
        return data.data.url;
      } else {
        throw new Error('Failed to upload image');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  };

  // Show payment instructions - Always show for advance payment
  const showPaymentInstructions = () => {
    setShowInstructions(true);
  };

  // Open payment proof modal
  const openPaymentModal = () => {
    setShowInstructions(false);
    setShowPaymentModal(true);
  };

  // Close payment modal
  const closePaymentModal = () => {
    setShowPaymentModal(false);
    setPaymentProof({
      paymentMethod: 'bkash',
      phoneNumber: '',
      transactionId: '',
      screenshot: null,
      screenshotPreview: null
    });
  };

  // Validate payment proof form
  const isPaymentProofValid = () => {
    return (
      paymentProof.paymentMethod &&
      paymentProof.phoneNumber &&
      paymentProof.transactionId &&
      paymentProof.screenshot
    );
  };

  // Create user if email doesn't exist in database
  const createUserIfNotExists = async (customerData) => {
    try {
      // Check if user exists by email
      const checkUserResponse = await fetch(`/api/users?email=${encodeURIComponent(customerData.email)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const checkResult = await checkUserResponse.json();

      // If user doesn't exist, create new user
      if (!checkResult.success || !checkResult.user) {

        
        const newUserData = {
          name: customerData.name,
          email: customerData.email,
          phone: customerData.phone,
          address: customerData.address,
          city: customerData.city,
          zipCode: customerData.zipCode,
          provider: 'checkout', // Mark as created during checkout
          role: 'user',
          emailVerified: false, // Since they haven't verified email yet
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        const createUserResponse = await fetch('/api/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newUserData)
        });

        const createResult = await createUserResponse.json();

        if (createResult.success) {

        } else {
          console.error('Failed to create user:', createResult.error);
        }
      } else {

      }
    } catch (error) {
      console.error('Error checking/creating user:', error);
      // Don't throw error - order should still complete even if user creation fails
    }
  };

  // Process order - 15% Advance Payment only
  const processOrder = async () => {
    if (orderProcessed) return; // Prevent multiple submissions
    
    if (!isFormValid()) {
      alert('Please fill in all required fields.');
      return;
    }

    // Require payment proof for advance payment
    if (!isPaymentProofValid()) {
      alert('Please provide payment proof before placing order.');
      return;
    }

    await processOrderWithPayment();
  };

  // Process order with payment details (15% Advance Payment)
  const processOrderWithPayment = async () => {
    if (orderProcessed || isProcessing) return; // Prevent multiple submissions
    
    setIsProcessing(true);
    setOrderProcessed(true); // Mark order as being processed

    try {
      let paymentScreenshotUrl = null;

      // Upload payment screenshot
      if (paymentProof.screenshot) {
        try {
          paymentScreenshotUrl = await uploadPaymentScreenshot(paymentProof.screenshot);
        } catch (error) {
          alert('Failed to upload payment screenshot. Please try again.');
          setIsProcessing(false);
          setOrderProcessed(false);
          return;
        }
      }

      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Calculate advance payment amount (15% of total)
      const advanceAmount = (parseFloat(totals.total) * 0.15).toFixed(2);
      const remainingAmount = (parseFloat(totals.total) * 0.85).toFixed(2);

      // Create order details for database
      const orderData = {
        orderId: 'ORD-' + Date.now(),
        orderDate: new Date().toISOString(),
        customerInfo: {
          name: customerInfo.name,
          email: customerInfo.email,
          phone: customerInfo.phone,
          address: {
            street: customerInfo.address,
            city: customerInfo.city,
            zipCode: customerInfo.zipCode
          }
        },
        items: enrichedCartItems.map(item => ({
          productId: item.id,
          productName: item.name || 'Product Name',
          price: item.price || 0,
          quantity: item.quantity || 0,
          size: item.size,
          color: item.color,
          subtotal: (item.price || 0) * (item.quantity || 0)
        })),
        paymentMethod: {
          type: 'advance',
          name: '15% Advance Payment',
          advancePayment: {
            amount: advanceAmount,
            remainingAmount: remainingAmount,
            method: paymentProof.paymentMethod,
            phoneNumber: paymentProof.phoneNumber,
            transactionId: paymentProof.transactionId,
            screenshot: paymentScreenshotUrl,
            paidAt: new Date().toISOString()
          }
        },
        orderSummary: {
          subtotal: parseFloat(totals.subtotal),
          shipping: parseFloat(totals.shipping),
          tax: parseFloat(totals.tax),
          total: parseFloat(totals.total),
          advancePaid: parseFloat(advanceAmount),
          remainingAmount: parseFloat(remainingAmount)
        },
        status: 'payment_verified',
        paymentStatus: 'partial',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Save order to database
      const savedOrder = await addOrder(orderData);

      // Check if user exists and create new user if not
      await createUserIfNotExists(customerInfo);

      // Create order details for display
      const order = {
        orderId: orderData.orderId,
        date: new Date().toLocaleDateString(),
        customer: customerInfo,
        items: enrichedCartItems,
        payment: {
          id: 'advance',
          type: 'advance',
          name: '15% Advance Payment',
          description: `Advance paid: ৳${advanceAmount}, Remaining: ৳${remainingAmount}`,
          advancePayment: {
            amount: advanceAmount,
            remainingAmount: remainingAmount,
            method: paymentProof.paymentMethod,
            transactionId: paymentProof.transactionId
          }
        },
        totals: totals,
        status: 'payment_verified'
      };

      setIsProcessing(false);

      // Close payment modal if open
      if (showPaymentModal) {
        closePaymentModal();
      }

      // Set redirecting state to prevent showing empty cart
      setIsRedirecting(true);

      // Clear cart from localStorage and Redux store
      dispatch(clearCart());

      // Redirect to order summary page
      // Use Base64 encoding to safely pass complex data
      const orderDataString = JSON.stringify(order);
      const orderDataBase64 = btoa(encodeURIComponent(orderDataString));
      router.push(`/orderSummary?orderData=${orderDataBase64}`);

    } catch (error) {
      console.error('Error processing order:', error);
      setIsProcessing(false);
      setOrderProcessed(false);
      alert('There was an error processing your order. Please try again.');
    }
  };

  // Empty cart state or redirecting state
  if ((!isLoading && enrichedCartItems.length === 0 && !isRedirecting) || isRedirecting) {
    if (isRedirecting) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <motion.div
            className="text-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Processing Order...</h2>
            <p className="text-gray-600 mb-6">Please wait while we confirm your order.</p>
            <div className="flex justify-center">
              <LoadingSpinner size="md" />
            </div>
          </motion.div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <ShoppingBag className="w-24 h-24 text-gray-400 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Your cart is empty</h2>
          <p className="text-gray-600 mb-8">Add some items to your cart to proceed with checkout.</p>
          <Link
            href="/allProducts"
            className="inline-flex items-center space-x-2 bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Continue Shopping</span>
          </Link>
        </motion.div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Checkout</h1>
          <p className="text-gray-600">Review your order and complete your purchase</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Customer Info & Payment */}
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            {/* Customer Information */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <User className="w-5 h-5 mr-2" />
                Shipping Information
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Full Name *"
                  value={customerInfo.name}
                  onChange={(e) => handleInfoChange('name', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <input
                  type="email"
                  placeholder="Email Address *"
                  value={customerInfo.email}
                  onChange={(e) => handleInfoChange('email', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <input
                  type="tel"
                  placeholder="Phone Number *"
                  value={customerInfo.phone}
                  onChange={(e) => handleInfoChange('phone', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <input
                  type="text"
                  placeholder="ZIP Code *"
                  value={customerInfo.zipCode}
                  onChange={(e) => handleInfoChange('zipCode', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <input
                  type="text"
                  placeholder="Street Address *"
                  value={customerInfo.address}
                  onChange={(e) => handleInfoChange('address', e.target.value)}
                  className="w-full md:col-span-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <input
                  type="text"
                  placeholder="City *"
                  value={customerInfo.city}
                  onChange={(e) => handleInfoChange('city', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Payment Methods */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <Truck className="w-5 h-5 mr-2" />
                Payment Method
              </h2>
              
              <div className="space-y-3">
                {paymentMethods.map((method) => (
                  <label
                    key={method.id}
                    className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedPayment === method.id
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value={method.id}
                      checked={selectedPayment === method.id}
                      onChange={(e) => setSelectedPayment(e.target.value)}
                      className="sr-only"
                    />
                    <method.icon className="w-6 h-6 text-gray-600 mr-4" />
                    <div>
                      <div className="font-medium text-gray-900">{method.name}</div>
                      <div className="text-sm text-gray-600">{method.description}</div>
                    </div>
                    {selectedPayment === method.id && (
                      <CheckCircle className="w-5 h-5 text-indigo-600 ml-auto" />
                    )}
                  </label>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Right Column - Order Summary */}
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            {/* Order Items */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <ShoppingBag className="w-5 h-5 mr-2" />
                Order Summary ({enrichedCartItems.length} items)
              </h2>
              
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {enrichedCartItems.map((item, index) => (
                  <div key={index} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                    <div className="relative w-16 h-16 rounded-lg overflow-hidden">
                      <Image
                        src={item.image || PLACEHOLDER_IMAGES.PRODUCT_MINI}
                        alt={item.name || 'Product'}
                        fill
                        sizes="64px"
                        className="object-cover"
                        unoptimized={true}
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 line-clamp-2">{item.name || 'Product Name'}</h3>
                      <p className="text-sm text-gray-600">
                        Size: {item.size || 'N/A'} | Color: {item.color || 'N/A'}
                      </p>
                      <p className="text-sm text-gray-600">Qty: {item.quantity || 0}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        ৳{((item.price || 0) * (item.quantity || 0)).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Price Summary */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Price Details</h2>
              
              <div className="space-y-3">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>৳{totals.subtotal}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span>৳{totals.shipping}</span>
                </div>
                {taxEnabled && parseFloat(totals.tax) > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>{totals.taxName || 'Tax'}</span>
                    <span>৳{totals.tax}</span>
                  </div>
                )}
                <div className="border-t pt-3 flex justify-between text-xl font-bold text-gray-900">
                  <span>Total</span>
                  <span>৳{totals.total}</span>
                </div>
              </div>

              {/* Place Order Button */}
              <motion.button
                onClick={showPaymentInstructions}
                disabled={!isFormValid() || isProcessing || orderProcessed}
                className={`w-full mt-6 py-4 rounded-lg font-medium text-white transition-colors ${
                  isFormValid() && !isProcessing && !orderProcessed
                    ? 'bg-gray-600 hover:bg-gray-700'
                    : 'bg-gray-400 cursor-not-allowed'
                }`}
                whileHover={isFormValid() && !isProcessing && !orderProcessed ? { scale: 1.02 } : {}}
                whileTap={isFormValid() && !isProcessing && !orderProcessed ? { scale: 0.98 } : {}}
              >
                {isProcessing ? (
                  <div className="flex items-center justify-center space-x-2">
                    <LoadingSpinner size="sm" color="white" />
                    <span>{isAddingOrder ? 'Saving order...' : 'Processing payment...'}</span>
                  </div>
                ) : orderProcessed ? (
                  'Order Placed Successfully!'
                ) : (
                  `Pay 15% (৳${(parseFloat(totals.total) * 0.15).toFixed(2)}) & Place Order`
                )}
              </motion.button>

              {/* Error Display */}
              {orderError && (
                <div className="mt-3 p-3 bg-red-100 border border-red-300 rounded-lg">
                  <p className="text-sm text-red-700 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    Error saving order: {orderError.message}
                  </p>
                </div>
              )}

              {/* Back to Cart */}
              <Link
                href="/addToCart"
                className="w-full mt-3 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors flex items-center justify-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Cart</span>
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Payment Instructions Modal */}
        <AnimatePresence>
          {showInstructions && (
            <motion.div
              className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowInstructions(false)}
            >
              <motion.div
                className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <Info className="w-6 h-6 text-gray-600" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">Payment Instructions</h2>
                        <p className="text-sm text-gray-600">15% Advance Payment</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowInstructions(false)}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  {/* Payment Amount */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 mb-6">
                    <div className="text-center">
                      <p className="text-sm text-gray-600 mb-2">Amount to Pay (15%)</p>
                      <p className="text-4xl font-bold text-blue-600">
                        ৳{(parseFloat(totals.total) * 0.15).toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-600 mt-2">
                        Remaining: ৳{(parseFloat(totals.total) * 0.85).toFixed(2)} (Pay on Delivery)
                      </p>
                    </div>
                  </div>

                  {/* Instructions */}
                  <div className="space-y-6 mb-6">
                    <div>
                      <h3 className="font-bold text-gray-900 mb-3 flex items-center">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                          <span className="text-blue-600 font-bold">1</span>
                        </div>
                        Choose Your Payment Method
                      </h3>
                      <div className="ml-11 space-y-2">
                        <div className="flex items-center space-x-3 p-3 bg-pink-50 rounded-lg">
                          <Phone className="w-5 h-5 text-pink-600" />
                          <div>
                            <p className="font-medium text-gray-900">bKash</p>
                            <p className="text-sm text-gray-600">Personal: 01870404001</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3 p-3 bg-orange-50 rounded-lg">
                          <Phone className="w-5 h-5 text-orange-600" />
                          <div>
                            <p className="font-medium text-gray-900">Nagad</p>
                            <p className="text-sm text-gray-600">Personal: 01322334625</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-bold text-gray-900 mb-3 flex items-center">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                          <span className="text-blue-600 font-bold">2</span>
                        </div>
                        Make the Payment
                      </h3>
                      <ul className="ml-11 space-y-2 text-gray-700">
                        <li className="flex items-start">
                          <span className="text-blue-600 mr-2">•</span>
                          <span>Open your bKash or Nagad app</span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-blue-600 mr-2">•</span>
                          <span>Select &quot;Send Money&quot;</span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-blue-600 mr-2">•</span>
                          <span>Enter the number shown above</span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-blue-600 mr-2">•</span>
                          <span>Enter amount: ৳{(parseFloat(totals.total) * 0.15).toFixed(2)}</span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-blue-600 mr-2">•</span>
                          <span>Complete the transaction</span>
                        </li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="font-bold text-gray-900 mb-3 flex items-center">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                          <span className="text-blue-600 font-bold">3</span>
                        </div>
                        Submit Payment Proof
                      </h3>
                      <ul className="ml-11 space-y-2 text-gray-700">
                        <li className="flex items-start">
                          <span className="text-blue-600 mr-2">•</span>
                          <span>Take a screenshot of the transaction confirmation</span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-blue-600 mr-2">•</span>
                          <span>Fill in the payment details in the next form</span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-blue-600 mr-2">•</span>
                          <span>Upload the screenshot as proof</span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-blue-600 mr-2">•</span>
                          <span>Enter your transaction ID correctly</span>
                        </li>
                      </ul>
                    </div>
                  </div>

                  {/* Important Notes */}
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                    <h4 className="font-bold text-yellow-800 mb-2 flex items-center">
                      <AlertCircle className="w-5 h-5 mr-2" />
                      Important Notes
                    </h4>
                    <ul className="text-sm text-yellow-700 space-y-1">
                      <li>• Your order will be confirmed after payment verification</li>
                      <li>• Keep your transaction ID safe for reference</li>
                      <li>• Payment verification may take 1-2 hours</li>
                      <li>• Incorrect details may delay your order</li>
                    </ul>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-3">
                    <button
                      onClick={() => setShowInstructions(false)}
                      className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={openPaymentModal}
                      className="flex-1 px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
                    >
                      I&apos;ve Made the Payment
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Payment Proof Modal */}
        <AnimatePresence>
          {showPaymentModal && (
            <motion.div
              className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closePaymentModal}
            >
              <motion.div
                className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                        <Wallet className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">Payment Proof</h2>
                        <p className="text-sm text-gray-600">Submit your payment details</p>
                      </div>
                    </div>
                    <button
                      onClick={closePaymentModal}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  {/* Form */}
                  <div className="space-y-4">
                    {/* Payment Method Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Payment Method *
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => setPaymentProof(prev => ({ ...prev, paymentMethod: 'bkash' }))}
                          className={`p-4 border-2 rounded-lg transition-all ${
                            paymentProof.paymentMethod === 'bkash'
                              ? 'border-pink-500 bg-pink-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <p className="font-bold text-lg">bKash</p>
                          <p className="text-xs text-gray-600">Mobile Banking</p>
                        </button>
                        <button
                          onClick={() => setPaymentProof(prev => ({ ...prev, paymentMethod: 'nagad' }))}
                          className={`p-4 border-2 rounded-lg transition-all ${
                            paymentProof.paymentMethod === 'nagad'
                              ? 'border-orange-500 bg-orange-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <p className="font-bold text-lg">Nagad</p>
                          <p className="text-xs text-gray-600">Mobile Banking</p>
                        </button>
                      </div>
                    </div>

                    {/* Phone Number */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Your {paymentProof.paymentMethod === 'bkash' ? 'bKash' : 'Nagad'} Number *
                      </label>
                      <input
                        type="tel"
                        placeholder="01XXXXXXXXX"
                        value={paymentProof.phoneNumber}
                        onChange={(e) => setPaymentProof(prev => ({ ...prev, phoneNumber: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        maxLength="11"
                      />
                    </div>

                    {/* Transaction ID */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Transaction ID *
                      </label>
                      <input
                        type="text"
                        placeholder="Enter transaction ID (e.g., 8HFGT4R8PM)"
                        value={paymentProof.transactionId}
                        onChange={(e) => setPaymentProof(prev => ({ ...prev, transactionId: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        You can find this in your transaction message
                      </p>
                    </div>

                    {/* Screenshot Upload */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Payment Screenshot *
                      </label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                        {paymentProof.screenshotPreview ? (
                          <div className="space-y-3">
                            <div className="relative w-full h-48 rounded-lg overflow-hidden">
                              <Image
                                src={paymentProof.screenshotPreview}
                                alt="Payment Screenshot"
                                fill
                                className="object-contain"
                              />
                            </div>
                            <button
                              onClick={() => {
                                setPaymentProof(prev => ({
                                  ...prev,
                                  screenshot: null,
                                  screenshotPreview: null
                                }));
                                if (fileInputRef.current) {
                                  fileInputRef.current.value = '';
                                }
                              }}
                              className="text-sm text-red-600 hover:text-red-700"
                            >
                              Remove Image
                            </button>
                          </div>
                        ) : (
                          <div>
                            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                            <p className="text-sm text-gray-600 mb-2">
                              Click to upload or drag and drop
                            </p>
                            <p className="text-xs text-gray-500">
                              PNG, JPG or JPEG (MAX. 5MB)
                            </p>
                          </div>
                        )}
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                        {!paymentProof.screenshotPreview && (
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            className="mt-3 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                          >
                            Choose File
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Amount Info */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-700">Amount Paid (15%)</span>
                        <span className="text-lg font-bold text-blue-600">
                          ৳{(parseFloat(totals.total) * 0.15).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-3 mt-6">
                    <button
                      onClick={closePaymentModal}
                      disabled={isProcessing}
                      className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={processOrder}
                      disabled={!isPaymentProofValid() || isProcessing}
                      className={`flex-1 px-6 py-3 rounded-lg font-medium text-white transition-colors ${
                        isPaymentProofValid() && !isProcessing
                          ? 'bg-green-600 hover:bg-green-700'
                          : 'bg-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {isProcessing ? (
                        <div className="flex items-center justify-center space-x-2">
                          <LoadingSpinner size="sm" color="white" />
                          <span>Processing...</span>
                        </div>
                      ) : (
                        'Submit & Place Order'
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default CheckoutPageClient;