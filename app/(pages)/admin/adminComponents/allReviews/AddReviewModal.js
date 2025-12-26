'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, Upload, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';
import { useAddData } from '../../../../../lib/hooks/useAddData';
import { useProducts } from '@/lib/hooks/useReduxData';
import { uploadToImageBB } from '@/lib/imagebb';
import LoadingSpinner from '../../../../componets/loading/LoadingSpinner';

const AddReviewModal = ({ isOpen, onClose, onReviewAdded, onSubmitStart, onSubmitError }) => {
  const [formData, setFormData] = useState({
    productId: '',
    productName: '',
    customerName: '',
    customerEmail: '',
    rating: 0,
    comment: '',
    photo: null
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [toast, setToast] = useState({ show: false, type: 'success', message: '' });
  const [imageUploading, setImageUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Hooks for data operations
  const { addData: addReview, isLoading: isSubmitting } = useAddData({
    name: 'reviews',
    api: '/api/reviews'
  });
  
  // 🚀 OPTIMIZED: Use Redux store for centralized data caching - NO duplicate API calls
  const { data: productsData } = useProducts();

  // Debug: Log products data to see structure


  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleProductSelect = (e) => {
    const selectedProductId = e.target.value;
    const products = Array.isArray(productsData) ? productsData : [];
    const selectedProduct = products.find(product => product._id === selectedProductId);
    
    setFormData(prev => ({
      ...prev,
      productId: selectedProductId,
      productName: selectedProduct?.name || ''
    }));
  };

  const handleRatingClick = (rating) => {
    setFormData(prev => ({ ...prev, rating }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setToast({
          show: true,
          type: 'error',
          message: 'Please select a valid image file'
        });
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setToast({
          show: true,
          type: 'error',
          message: 'Image size must be less than 5MB'
        });
        return;
      }

      setImageUploading(true);
      
      try {
        // Create preview immediately using FileReader for better UX
        const reader = new FileReader();
        reader.onload = (e) => {
          setImagePreview(e.target.result);
        };
        reader.readAsDataURL(file);
        
        // Upload to ImageBB
        const imageUrl = await uploadToImageBB(file);

        
        // Update form data with ImageBB URL
        setFormData(prev => ({
          ...prev,
          photo: imageUrl
        }));

        setToast({
          show: true,
          type: 'success',
          message: 'Image uploaded successfully!'
        });
        
      } catch (error) {
        console.error('Error uploading image:', error);
        setToast({
          show: true,
          type: 'error',
          message: error.message || 'Failed to upload image'
        });
        
        // Clear preview on error
        setImagePreview(null);
        setFormData(prev => ({ ...prev, photo: null }));
      } finally {
        setImageUploading(false);
      }
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    setFormData(prev => ({ ...prev, photo: null }));
    setImageUploading(false);
    // Reset file input
    document.getElementById('imageUpload').value = '';
  };

  const validateForm = () => {
    const { productId, customerName, customerEmail, rating, comment } = formData;
    
    if (!productId) {
      setToast({
        show: true,
        type: 'error',
        message: 'Please select a product'
      });
      return false;
    }
    if (!customerName.trim()) {
      setToast({
        show: true,
        type: 'error',
        message: 'Customer name is required'
      });
      return false;
    }
    if (!customerEmail.trim()) {
      setToast({
        show: true,
        type: 'error',
        message: 'Customer email is required'
      });
      return false;
    }
    if (!customerEmail.includes('@')) {
      setToast({
        show: true,
        type: 'error',
        message: 'Please enter a valid email address'
      });
      return false;
    }
    if (rating === 0) {
      setToast({
        show: true,
        type: 'error',
        message: 'Please select a rating'
      });
      return false;
    }
    if (!comment.trim()) {
      setToast({
        show: true,
        type: 'error',
        message: 'Review comment is required'
      });
      return false;
    }
    if (comment.length < 10) {
      setToast({
        show: true,
        type: 'error',
        message: 'Review comment must be at least 10 characters'
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Prevent multiple submissions
    if (isProcessing || isSubmitting || imageUploading) {

      return;
    }
    
    if (!validateForm()) return;

    try {
      // Set local processing state immediately
      setIsProcessing(true);
      
      // Notify parent component that submission started
      onSubmitStart?.();

      const reviewData = {
        ...formData,
        title: `Review for ${formData.productName}`, // Auto-generate title
        status: 'approved', // Default status
        verified: true, // Default verification
        date: new Date().toISOString().split('T')[0],
        helpful: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };


      
      const result = await addReview(reviewData);

      
      if (result?.success) {
        setToast({
          show: true,
          type: 'success',
          message: 'Review added successfully!'
        });
        onReviewAdded?.(result.Data);
        setTimeout(() => handleClose(), 1500); // Close modal after showing success message
      } else {
        console.error('API returned unsuccessful result:', result);
        onSubmitError?.(); // Notify parent of error
        throw new Error(result?.error || result?.message || 'Failed to add review');
      }
    } catch (error) {
      console.error('Error adding review:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      onSubmitError?.(); // Notify parent of error
      setToast({
        show: true,
        type: 'error',
        message: error.message || 'Failed to add review'
      });
    } finally {
      // Always reset processing state
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setFormData({
      productId: '',
      productName: '',
      customerName: '',
      customerEmail: '',
      rating: 0,
      comment: '',
      photo: null
    });
    setImagePreview(null);
    setHoveredRating(0);
    setImageUploading(false);
    setIsProcessing(false);
    setToast({ show: false, type: 'success', message: '' });
    onClose();
  };

  const renderStars = () => {
    return Array.from({ length: 5 }, (_, index) => {
      const starValue = index + 1;
      const isFilled = starValue <= (hoveredRating || formData.rating);
      
      return (
        <Star
          key={starValue}
          size={24}
          className={`transition-colors duration-200 ${
            isSubmitting 
              ? 'cursor-not-allowed opacity-50' 
              : 'cursor-pointer'
          } ${
            isFilled ? 'text-yellow-500 fill-current' : 'text-gray-300 hover:text-yellow-400'
          }`}
          onClick={() => !isSubmitting && handleRatingClick(starValue)}
          onMouseEnter={() => !isSubmitting && setHoveredRating(starValue)}
          onMouseLeave={() => !isSubmitting && setHoveredRating(0)}
        />
      );
    });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 z-50"
        onClick={(e) => e.target === e.currentTarget && handleClose()}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-2xl font-bold text-gray-900">Add New Review</h2>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              disabled={isSubmitting}
            >
              <X size={24} className="text-gray-500" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Product Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Product *
              </label>
              <select
                name="productId"
                value={formData.productId}
                onChange={handleProductSelect}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                required
                disabled={isSubmitting}
              >
                <option value="">Choose a product...</option>
                {Array.isArray(productsData) ? productsData.map((product) => (
                  <option key={product._id} value={product._id}>
                    {product.name} - ৳{product.price}
                  </option>
                )) : []}
              </select>
            </div>

            {/* Customer Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Customer Name *
                </label>
                <input
                  type="text"
                  name="customerName"
                  value={formData.customerName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  required
                  disabled={isSubmitting}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Customer Email *
                </label>
                <input
                  type="email"
                  name="customerEmail"
                  value={formData.customerEmail}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Rating */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rating *
              </label>
              <div className="flex items-center space-x-1">
                {renderStars()}
                <span className="ml-2 text-sm text-gray-600">
                  {formData.rating > 0 ? `${formData.rating} star${formData.rating > 1 ? 's' : ''}` : 'Select rating'}
                </span>
              </div>
            </div>



            {/* Review Comment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Review Comment * (min 10 characters)
              </label>
              <textarea
                name="comment"
                value={formData.comment}
                onChange={handleInputChange}
                placeholder="Share your experience with this product..."
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                required
                minLength={10}
                disabled={isSubmitting}
              />
              <p className="text-sm text-gray-500 mt-1">
                {formData.comment.length}/500 characters
              </p>
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Review Image (Optional)
              </label>
              
              {imagePreview ? (
                <div className="relative">
                  <Image
                    src={imagePreview}
                    alt="Review"
                    width={500}
                    height={192}
                    className="w-full h-48 object-cover rounded-lg border"
                    unoptimized={true}
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
                  <ImageIcon className="mx-auto text-gray-400 mb-4" size={48} />
                  <p className="text-gray-600 mb-4">
                    {imageUploading ? 'Uploading to ImageBB...' : 'Click to upload an image'}
                  </p>
                  <input
                    id="imageUpload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={imageUploading}
                  />
                  <label
                    htmlFor="imageUpload"
                    className={`${
                      imageUploading 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-blue-500 hover:bg-blue-600 cursor-pointer'
                    } text-white px-4 py-2 rounded-lg transition-colors inline-flex items-center space-x-2`}
                  >
                    <Upload size={16} className={imageUploading ? 'animate-spin' : ''} />
                    <span>{imageUploading ? 'Uploading...' : 'Choose Image'}</span>
                  </label>
                </div>
              )}
              <p className="text-sm text-gray-500 mt-2">
                Supported formats: JPG, PNG, GIF. Max size: 5MB. Images uploaded to ImageBB.
              </p>
            </div>



            {/* Action Buttons */}
            <div className="flex space-x-4 pt-6">
              <button
                type="button"
                onClick={handleClose}
                className={`flex-1 px-6 py-3 border border-gray-300 rounded-lg transition-all duration-200 ${
                  isSubmitting || imageUploading || isProcessing
                    ? 'text-gray-400 cursor-not-allowed bg-gray-100 opacity-50'
                    : 'text-gray-700 hover:bg-gray-50 hover:border-gray-400 active:scale-95'
                }`}
                disabled={isSubmitting || imageUploading || isProcessing}
              >
                {(isSubmitting || imageUploading || isProcessing) ? 'Please wait...' : 'Cancel'}
              </button>
              
              <button
                type="submit"
                className={`flex-1 px-6 py-3 text-white rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 ${
                  isSubmitting || imageUploading || isProcessing
                    ? 'bg-gray-500 cursor-not-allowed opacity-70 transform scale-95' 
                    : 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg active:scale-95'
                }`}
                disabled={isSubmitting || imageUploading || isProcessing}
              >
                {(isSubmitting || isProcessing) && (
                  <LoadingSpinner size="sm" color="white" />
                )}
                {imageUploading && !isSubmitting && !isProcessing && (
                  <Upload size={16} className="animate-bounce" />
                )}
                {!isSubmitting && !imageUploading && !isProcessing && (
                  <Star size={16} className="animate-pulse" />
                )}
                <span>
                  {(isSubmitting || isProcessing) ? 'Adding Review...' : imageUploading ? 'Uploading Image...' : 'Add Review'}
                </span>
              </button>
            </div>
          </form>
        </motion.div>

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
      </motion.div>
    </AnimatePresence>
  );
};

export default AddReviewModal;