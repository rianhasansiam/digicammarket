'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Upload, Check, AlertCircle, Loader, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAddData } from '@/lib/hooks/useAddData';
import { uploadToImageBB } from '@/lib/imagebb';
import Image from 'next/image';

const AddBannerModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    description: '',
    image: '',
    link: '/allProducts',
    buttonText: 'Shop Now',
    bannerType: 'main', // 'main' for carousel, 'side' for side banners
    order: 1,
    isActive: true
  });
  
  const [imagePreview, setImagePreview] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [imageUploading, setImageUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);
  
  // Initialize the useAddData hook
  const { addData, isLoading, error } = useAddData({
    name: 'banners',
    api: '/api/banners'
  });

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        title: '',
        subtitle: '',
        description: '',
        image: '',
        link: '/allProducts',
        buttonText: 'Shop Now',
        bannerType: 'main',
        order: 1,
        isActive: true
      });
      setImagePreview('');
      setFormErrors({});
      setSubmitAttempted(false);
      setSuccessMessage('');
      setImageUploading(false);
      setSelectedFile(null);
    }
  }, [isOpen]);

  // Validate form
  const validateForm = () => {
    const errors = {};
    if (!formData.image && !selectedFile) errors.image = 'Banner image is required';
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitAttempted(true);
    
    if (!validateForm()) return;
    
    try {
      let imageUrl = formData.image;
      
      // Upload file if selected
      if (selectedFile) {
        setImageUploading(true);
        try {
          imageUrl = await uploadToImageBB(selectedFile);
        } catch (error) {
          setFormErrors(prev => ({ ...prev, image: error.message }));
          setImageUploading(false);
          return;
        }
        setImageUploading(false);
      }
      
      // Prepare banner data
      const bannerData = {
        ...formData,
        image: imageUrl,
        order: parseInt(formData.order) || 1
      };
      
      await addData(bannerData);
      setSuccessMessage('Banner added successfully!');
      
      // Call onSuccess callback
      if (onSuccess) onSuccess();
      
      // Close modal after success message is shown
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Error adding banner:', err);
      setImageUploading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    
    if (type === 'file' && files?.length > 0) {
      const file = files[0];
      setSelectedFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
      
      // Clear image error
      if (formErrors.image) {
        setFormErrors(prev => {
          const newErrors = {...prev};
          delete newErrors.image;
          return newErrors;
        });
      }
    } else if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
      
      // Clear field error
      if (formErrors[name]) {
        setFormErrors(prev => {
          const newErrors = {...prev};
          delete newErrors[name];
          return newErrors;
        });
      }
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = e.dataTransfer.files;
    if (files?.length > 0) {
      const file = files[0];
      setSelectedFile(file);
      
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
      
      if (formErrors.image) {
        setFormErrors(prev => {
          const newErrors = {...prev};
          delete newErrors.image;
          return newErrors;
        });
      }
    }
  };

  const removeImage = () => {
    setSelectedFile(null);
    setImagePreview('');
    setFormData(prev => ({ ...prev, image: '' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Add New Banner</h2>
              <p className="text-sm text-gray-500 mt-1">Create a new hero banner for your homepage</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Success Message */}
          {successMessage && (
            <div className="mx-6 mt-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
              <Check className="w-5 h-5 text-green-600" />
              <span className="text-green-700">{successMessage}</span>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <span className="text-red-700">{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Banner Image <span className="text-red-500">*</span>
              </label>
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
                  formErrors.image 
                    ? 'border-red-300 bg-red-50' 
                    : 'border-gray-300 hover:border-gray-400 bg-gray-50'
                }`}
              >
                {imagePreview || formData.image ? (
                  <div className="relative">
                    <div className="relative aspect-[16/9] w-full max-w-lg mx-auto rounded-lg overflow-hidden">
                      <Image
                        src={imagePreview || formData.image}
                        alt="Preview"
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex justify-center">
                      <div className="p-4 bg-gray-100 rounded-full">
                        <Upload className="w-8 h-8 text-gray-400" />
                      </div>
                    </div>
                    <div>
                      <p className="text-gray-600">Drag and drop your banner image here, or</p>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-blue-600 hover:text-blue-700 font-medium"
                      >
                        browse files
                      </button>
                    </div>
                    <p className="text-xs text-gray-400">
                      Recommended: 1920×600 pixels or 16:5 aspect ratio
                    </p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleChange}
                  className="hidden"
                />
              </div>
              {formErrors.image && (
                <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {formErrors.image}
                </p>
              )}
            </div>

            {/* Title & Subtitle */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g., Summer Sale"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subtitle
                </label>
                <input
                  type="text"
                  name="subtitle"
                  value={formData.subtitle}
                  onChange={handleChange}
                  placeholder="e.g., Up to 50% Off"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Short description for the banner..."
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>

            {/* Link & Button Text */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Link URL
                </label>
                <input
                  type="text"
                  name="link"
                  value={formData.link}
                  onChange={handleChange}
                  placeholder="/allProducts"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Button Text
                </label>
                <input
                  type="text"
                  name="buttonText"
                  value={formData.buttonText}
                  onChange={handleChange}
                  placeholder="Shop Now"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Order & Active Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Display Order
                </label>
                <input
                  type="number"
                  name="order"
                  value={formData.order}
                  onChange={handleChange}
                  min="1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex items-center">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleChange}
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Active (visible on homepage)</span>
                </label>
              </div>
            </div>

            {/* Banner Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Banner Position
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label 
                  className={`relative flex flex-col items-center p-4 border-2 rounded-xl cursor-pointer transition-all ${
                    formData.bannerType === 'main' 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="bannerType"
                    value="main"
                    checked={formData.bannerType === 'main'}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <div className={`w-full h-16 rounded-lg mb-2 flex items-center justify-center ${
                    formData.bannerType === 'main' ? 'bg-blue-200' : 'bg-gray-100'
                  }`}>
                    <div className="w-3/4 h-10 bg-blue-500 rounded-md"></div>
                  </div>
                  <span className={`font-medium ${
                    formData.bannerType === 'main' ? 'text-blue-700' : 'text-gray-700'
                  }`}>Main Carousel</span>
                  <span className="text-xs text-gray-500 text-center mt-1">Large rotating banner (70% width)</span>
                </label>
                
                <label 
                  className={`relative flex flex-col items-center p-4 border-2 rounded-xl cursor-pointer transition-all ${
                    formData.bannerType === 'side' 
                      ? 'border-purple-500 bg-purple-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="bannerType"
                    value="side"
                    checked={formData.bannerType === 'side'}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <div className={`w-full h-16 rounded-lg mb-2 flex items-center justify-end gap-1 px-2 ${
                    formData.bannerType === 'side' ? 'bg-purple-200' : 'bg-gray-100'
                  }`}>
                    <div className="w-1/4 h-6 bg-purple-500 rounded-sm"></div>
                    <div className="w-1/4 h-6 bg-purple-400 rounded-sm"></div>
                  </div>
                  <span className={`font-medium ${
                    formData.bannerType === 'side' ? 'text-purple-700' : 'text-gray-700'
                  }`}>Side Banner</span>
                  <span className="text-xs text-gray-500 text-center mt-1">Stacked cards on right (30% width)</span>
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || imageUploading}
                className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {(isLoading || imageUploading) && <Loader className="w-4 h-4 animate-spin" />}
                {imageUploading ? 'Uploading Image...' : isLoading ? 'Adding...' : 'Add Banner'}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AddBannerModal;
