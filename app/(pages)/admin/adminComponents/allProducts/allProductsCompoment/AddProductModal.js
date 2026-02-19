'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Upload, Check, AlertCircle, Loader, Plus, Minus, Tag, Palette, DollarSign } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAddData } from '@/lib/hooks/useAddData';
import { uploadToImageBB } from '@/lib/imagebb';
import Image from 'next/image';

const AddProductModal = ({ isOpen, onClose, categories }) => {
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    style: '',
    brand: '',
    price: '',
    originalPrice: '',
    stock: '',
    shortDescription: '',
    description: '',
    images: [],
    colors: [],
    sizes: []
  });
  
  const [imagePreviews, setImagePreviews] = useState([]);
  const [formErrors, setFormErrors] = useState({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [imageUploading, setImageUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [availableSizes] = useState(['Used', 'Used Like New', 'New']);
  const [availableStyles] = useState(['Digital Cameras', 'Handycams / Camcorders', 'Film Cameras', 'Bridge Cameras', 'DSLR Cameras', 'Mirrorless Cameras', 'Action Cameras','Instant Cameras','Disposable Cameras','Accessories (Batteries, Chargers, SD Cards, etc.)']);
  const [colorInput, setColorInput] = useState('');
  const [colorPickerValue, setColorPickerValue] = useState('#000000');
  const colorSuggestions = ['Black', 'Silver', 'Gray', 'White', 'Gold', 'Blue', 'Red', 'Bronze', 'Green', 'Brown', 'Pink', 'Purple', 'Orange', 'Yellow', 'Navy', 'Champagne', 'Titanium', 'Graphite'];
  const fileInputRef = useRef(null);
  
  // Initialize the useAddData hook
  const { addData, isLoading, error } = useAddData({
    name: 'products',
    api: '/api/products'
  });

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        name: '',
        category: '',
        style: '',
        brand: '',
        price: '',
        originalPrice: '',
        stock: '',
        shortDescription: '',
        description: '',
        images: [],
        colors: [],
        sizes: []
      });
      setImagePreviews([]);
      setFormErrors({});
      setSubmitAttempted(false);
      setSuccessMessage('');
      setImageUploading(false);
      setSelectedFiles([]);
    }
  }, [isOpen]);

  // Validate form
  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Product name is required';
    if (!formData.brand.trim()) errors.brand = 'Brand name is required';
    if (!formData.category) errors.category = 'Category is required';
    if (!formData.style) errors.style = 'Style is required';
    if (!formData.price) errors.price = 'Price is required';
    if (!formData.stock) errors.stock = 'Stock quantity is required';
    if (formData.colors.length === 0) errors.colors = 'At least one color is required';
    if (formData.sizes.length === 0) errors.sizes = 'At least one size is required';
    if (!formData.shortDescription.trim()) errors.shortDescription = 'Short description is required';
    if (!formData.description.trim()) errors.description = 'Description is required';
    if (formData.images.length === 0 && selectedFiles.length === 0) errors.images = 'At least one product image is required';
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitAttempted(true);
    
    if (!validateForm()) return;
    
    try {
      let imageUrls = [...formData.images];
      
      // Upload files if any
      if (selectedFiles.length > 0) {
        setImageUploading(true);
        try {
          // Upload all files
          const uploadedUrls = await Promise.all(
            selectedFiles.map(file => uploadToImageBB(file))
          );
          imageUrls = [...imageUrls, ...uploadedUrls];
        } catch (error) {
          setFormErrors(prev => ({ ...prev, images: error.message }));
          setImageUploading(false);
          return;
        }
        setImageUploading(false);
      }
      
      // Prepare product data with ImageBB URLs
      const productData = {
        ...formData,
        images: imageUrls,
        image: imageUrls[0], // Keep backward compatibility with single image field
        colors: formData.colors,
        color: formData.colors[0], // Keep backward compatibility with single color field
        price: parseFloat(formData.price),
        originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice) : null,
        stock: parseInt(formData.stock),
      };
      
      await addData(productData);
      setSuccessMessage('Product added successfully!');
      
      // Close modal after success message is shown
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      console.error('Error adding product:', err);
      setImageUploading(false);
    }
  };

  // Handle size selection
  const handleSizeToggle = (size) => {
    setFormData(prev => ({
      ...prev,
      sizes: prev.sizes.includes(size)
        ? prev.sizes.filter(s => s !== size)
        : [...prev.sizes, size]
    }));
    
    // Clear size error
    if (formErrors.sizes) {
      setFormErrors(prev => {
        const newErrors = {...prev};
        delete newErrors.sizes;
        return newErrors;
      });
    }
  };

  // Handle adding a color
  const handleAddColor = (colorName) => {
    const trimmed = colorName.trim();
    if (!trimmed) return;
    // Capitalize first letter
    const formatted = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
    if (formData.colors.includes(formatted)) return;
    setFormData(prev => ({ ...prev, colors: [...prev.colors, formatted] }));
    setColorInput('');
    if (formErrors.colors) {
      setFormErrors(prev => { const n = {...prev}; delete n.colors; return n; });
    }
  };

  // Handle removing a color
  const handleRemoveColor = (color) => {
    setFormData(prev => ({ ...prev, colors: prev.colors.filter(c => c !== color) }));
  };

  // Handle color input key press
  const handleColorKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); handleAddColor(colorInput); }
  };

  // Handle color picker
  const handleColorPicker = (e) => {
    setColorPickerValue(e.target.value);
  };

  const handleColorPickerAdd = () => {
    const hex = colorPickerValue.toUpperCase();
    if (!formData.colors.includes(hex)) {
      handleAddColor(hex);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    
    if (type === 'file' && files?.length > 0) {
      // Add files to selection
      const newFiles = Array.from(files);
      setSelectedFiles(prev => [...prev, ...newFiles]);
      
      // Create previews
      newFiles.forEach(file => {
        const reader = new FileReader();
        reader.onload = () => setImagePreviews(prev => [...prev, reader.result]);
        reader.readAsDataURL(file);
      });
    } else {
      // Regular form input
      setFormData(prev => ({ ...prev, [name]: value }));
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
      // Add dropped files
      const newFiles = Array.from(files);
      setSelectedFiles(prev => [...prev, ...newFiles]);
      
      // Create previews
      newFiles.forEach(file => {
        const reader = new FileReader();
        reader.onload = () => setImagePreviews(prev => [...prev, reader.result]);
        reader.readAsDataURL(file);
      });
    }
  };

  // Remove individual image
  const removeImage = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
    
    // Clear errors if no images left
    if (selectedFiles.length === 1) {
      setFormErrors(prev => ({
        ...prev,
        images: 'At least one product image is required'
      }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden backdrop-blur-sm  flex items-center justify-center p-4">
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 max-w-3xl w-full max-h-[90vh] flex flex-col relative overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-indigo-50">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                <Plus className="w-6 h-6 mr-2 text-gray-600" />
                Add New Product
              </h2>
              <p className="text-sm text-gray-600 mt-1">Create a new product for your store</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 hover:bg-white/50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-300 rounded-full p-2"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Success Message */}
          {successMessage && (
            <div className="bg-green-50 border-l-4 border-green-500 p-4 mx-6 mt-4 rounded-md">
              <div className="flex items-center">
                <Check className="text-green-500 mr-2" size={20} />
                <p className="text-green-700">{successMessage}</p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mx-6 mt-4 rounded-md">
              <div className="flex items-center">
                <AlertCircle className="text-red-500 mr-2" size={20} />
                <p className="text-red-700">{error.message || 'An error occurred while adding the product'}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="p-6 space-y-8 overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
            
            {/* Basic Information Section */}
            <div className="bg-gradient-to-r from-gray-50/50 to-indigo-50/40 p-6 rounded-xl border border-gray-100/50">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <Tag className="w-5 h-5 mr-2 text-gray-600" />
                Basic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Product Name */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Name*
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 rounded-lg border ${formErrors.name ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-200/60 focus:border-gray-500 focus:ring-gray-500/20'} focus:outline-none focus:ring-2 transition-all duration-200 text-sm bg-white/80 backdrop-blur-sm`}
                    placeholder="e.g., Canon EOS R5, Nikon Z9, Sony A7 IV"
                  />
                  {formErrors.name && submitAttempted && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {formErrors.name}
                    </p>
                  )}
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category*
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 rounded-lg border ${formErrors.category ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-200/60 focus:border-gray-500 focus:ring-gray-500/20'} focus:outline-none focus:ring-2 transition-all duration-200 text-sm bg-white/80 backdrop-blur-sm`}
                    disabled={!categories || categories.length === 0}
                  >
                    <option value="">
                      {!categories ? 'Loading categories...' : 
                       categories.length === 0 ? 'No categories available - Create one first' : 
                       'Select a category'}
                    </option>
                    {categories?.filter(category => category.status === 'active' || !category.status)?.map((category) => (
                      <option key={category._id || category.id || category.name} value={category.name}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  {formErrors.category && submitAttempted && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {formErrors.category}
                    </p>
                  )}
                  {categories && categories.length === 0 && (
                    <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-700 mb-2">
                        No categories found. You need to create categories first.
                      </p>
                      <p className="text-xs text-blue-600">
                        💡 Go to Category Management → Add New Category to create your first category
                      </p>
                    </div>
                  )}
                  {categories && categories.filter(cat => cat.status === 'active' || !cat.status).length !== categories.length && (
                    <p className="mt-1 text-xs text-gray-500">
                      Only showing active categories ({categories.filter(cat => cat.status === 'active' || !cat.status).length} available)
                    </p>
                  )}
                </div>

                {/* Style */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Camera Type*
                  </label>
                  <select
                    name="style"
                    value={formData.style}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 rounded-lg border ${formErrors.style ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-200/60 focus:border-gray-500 focus:ring-gray-500/20'} focus:outline-none focus:ring-2 transition-all duration-200 text-sm bg-white/80 backdrop-blur-sm`}
                  >
                    <option value="">Select camera type</option>
                    {availableStyles.map((style) => (
                      <option key={style} value={style}>
                        {style}
                      </option>
                    ))}
                  </select>
                  {formErrors.style && submitAttempted && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {formErrors.style}
                    </p>
                  )}
                </div>

                {/* Brand */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Brand*
                  </label>
                  <input
                    type="text"
                    name="brand"
                    value={formData.brand}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 rounded-lg border ${formErrors.brand ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-200/60 focus:border-gray-500 focus:ring-gray-500/20'} focus:outline-none focus:ring-2 transition-all duration-200 text-sm bg-white/80 backdrop-blur-sm`}
                    placeholder="e.g., Canon, Nikon, Sony, Fujifilm, Panasonic"
                  />
                  {formErrors.brand && submitAttempted && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {formErrors.brand}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    Enter the manufacturer or brand name of the camera
                  </p>
                </div>
              </div>
            </div>

            
            {/* Pricing & Attributes Section */}
            <div className="bg-gradient-to-r from-emerald-50/50 to-teal-50/40 p-6 rounded-xl border border-emerald-100/50">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <DollarSign className="w-5 h-5 mr-2 text-emerald-600" />
                Pricing & Attributes
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Price*
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-gray-500">
                      ৳
                    </div>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleChange}
                      className={`w-full pl-8 pr-4 py-3 rounded-lg border ${formErrors.price ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : 'border-emerald-200/60 focus:border-emerald-500 focus:ring-emerald-500/20'} focus:outline-none focus:ring-2 transition-all duration-200 text-sm bg-white/80 backdrop-blur-sm font-medium`}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  {formErrors.price && submitAttempted && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {formErrors.price}
                    </p>
                  )}
                </div>

                {/* Original Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Original Price <span className="text-gray-400">(For sale items)</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-gray-500">
                      ৳
                    </div>
                    <input
                      type="number"
                      name="originalPrice"
                      value={formData.originalPrice}
                      onChange={handleChange}
                      className="w-full pl-8 pr-4 py-3 rounded-lg border border-emerald-200/60 focus:outline-none focus:ring-2 focus:border-emerald-500 focus:ring-emerald-500/20 transition-all duration-200 text-sm bg-white/80 backdrop-blur-sm"
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>

                {/* Stock */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stock Quantity*
                  </label>
                  <input
                    type="number"
                    name="stock"
                    value={formData.stock}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 rounded-lg border ${formErrors.stock ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : 'border-emerald-200/60 focus:border-emerald-500 focus:ring-emerald-500/20'} focus:outline-none focus:ring-2 transition-all duration-200 text-sm bg-white/80 backdrop-blur-sm font-medium`}
                    placeholder="0"
                    min="0"
                  />
                  {formErrors.stock && submitAttempted && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {formErrors.stock}
                    </p>
                  )}
                </div>

                {/* Colors */}
                <div className="col-span-3">
                  <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                    <Palette className="w-4 h-4 mr-1" />
                    Body Color*
                  </label>

                  {/* Selected colors */}
                  {formData.colors.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {formData.colors.map((color) => (
                        <span
                          key={color}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-gray-100 border border-gray-300 text-sm font-medium text-gray-700"
                        >
                          {color.startsWith('#') && (
                            <span className="w-3 h-3 rounded-full border border-gray-300" style={{ backgroundColor: color }} />
                          )}
                          {color}
                          <button type="button" onClick={() => handleRemoveColor(color)} className="ml-1 text-gray-400 hover:text-red-500 transition-colors">
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Color input + picker */}
                  <div className="flex gap-2 mb-3">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={colorInput}
                        onChange={(e) => setColorInput(e.target.value)}
                        onKeyDown={handleColorKeyDown}
                        placeholder="Type a color name and press Enter..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-500 focus:border-gray-500 outline-none"
                      />
                    </div>
                    <button type="button" onClick={() => handleAddColor(colorInput)} disabled={!colorInput.trim()} className="px-4 py-2 bg-gray-600 text-white rounded-lg text-sm font-medium hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                      <Plus className="w-4 h-4" />
                    </button>
                    <div className="flex items-center gap-1">
                      <input type="color" value={colorPickerValue} onChange={handleColorPicker} className="w-9 h-9 rounded-lg border border-gray-300 cursor-pointer p-0.5" title="Pick a color" />
                      <button type="button" onClick={handleColorPickerAdd} className="px-3 py-2 bg-gray-600 text-white rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors">
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Quick suggestions */}
                  <div className="flex flex-wrap gap-2">
                    {colorSuggestions.filter(c => !formData.colors.includes(c)).slice(0, 12).map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => handleAddColor(color)}
                        className="px-2.5 py-1 rounded-md border border-gray-200 text-xs font-medium text-gray-600 hover:border-gray-400 hover:bg-gray-50 transition-all"
                      >
                        + {color}
                      </button>
                    ))}
                  </div>

                  {formErrors.colors && submitAttempted && (
                    <p className="mt-2 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {formErrors.colors}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Sizes Section */}
            <div className="bg-gradient-to-r from-purple-50/50 to-pink-50/40 p-6 rounded-xl border border-purple-100/50">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Camera Type*
              </h3>
              <div className="flex flex-wrap gap-3">
                {availableSizes.map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => handleSizeToggle(size)}
                    className={`px-4 py-2 rounded-lg border-2 transition-all duration-200 text-sm font-medium ${
                      formData.sizes.includes(size)
                        ? 'bg-gray-600 border-gray-600 text-white shadow-md transform scale-105'
                        : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
              {formErrors.sizes && submitAttempted && (
                <p className="mt-2 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {formErrors.sizes}
                </p>
              )}
            </div>

            {/* Description & Image Section */}
            <div className="bg-gradient-to-r from-amber-50/50 to-orange-50/40 p-6 rounded-xl border border-amber-100/50">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Product Details
              </h3>
              
              {/* Short Description */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Short Description*
                </label>
                <input
                  type="text"
                  name="shortDescription"
                  value={formData.shortDescription}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 rounded-lg border ${formErrors.shortDescription ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : 'border-amber-200/60 focus:border-amber-500 focus:ring-amber-500/20'} focus:outline-none focus:ring-2 transition-all duration-200 text-sm bg-white/80 backdrop-blur-sm`}
                  placeholder="e.g., Professional mirrorless camera with 45MP sensor and 8K video"
                  maxLength="100"
                />
                <p className="mt-1 text-xs text-gray-500">
                  {formData.shortDescription.length}/100 characters
                </p>
                {formErrors.shortDescription && submitAttempted && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {formErrors.shortDescription}
                  </p>
                )}
              </div>
              
              {/* Description */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Description*
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="4"
                  className={`w-full px-4 py-3 rounded-lg border ${formErrors.description ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : 'border-amber-200/60 focus:border-amber-500 focus:ring-amber-500/20'} focus:outline-none focus:ring-2 transition-all duration-200 text-sm resize-none bg-white/80 backdrop-blur-sm`}
                  placeholder="Describe camera features, specifications, image quality, video capabilities, autofocus system, and included accessories..."
                />
                {formErrors.description && submitAttempted && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {formErrors.description}
                  </p>
                )}
              </div>

              {/* Product Images */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Images* <span className="text-gray-400">(Multiple images supported)</span>
                </label>
                
                {/* Existing Images Preview */}
                {imagePreviews.length > 0 && (
                  <div className="mb-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {imagePreviews.map((preview, index) => (
                        <div key={index} className="relative group">
                          <div className="relative w-full h-32 rounded-lg overflow-hidden shadow-md border-2 border-amber-200/60">
                            <Image
                              src={preview}
                              alt={`Product preview ${index + 1}`}
                              fill
                              className="object-cover"
                              sizes="(max-width: 768px) 50vw, 33vw"
                              unoptimized={true}
                              onError={(e) => {
                                e.target.src = '/default-product.png';
                              }}
                            />
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-600"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* File Upload Area */}
                <div 
                  className={`flex justify-center px-6 pt-8 pb-8 border-2 ${formErrors.images ? 'border-red-300 bg-red-50/30' : 'border-amber-300/60 bg-white/60 backdrop-blur-sm'} border-dashed rounded-xl hover:border-amber-500/70 hover:bg-amber-50/30 transition-all duration-300 cursor-pointer group ${imageUploading ? 'pointer-events-none opacity-75' : ''}`}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onClick={() => !imageUploading && fileInputRef.current?.click()}
                >
                  <div className="space-y-3 text-center">
                    <div className="mx-auto h-16 w-16 text-amber-400 bg-amber-50/80 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:bg-amber-100/80 group-hover:text-amber-600 transition-all duration-200 border border-amber-200/50">
                      <Upload className="w-8 h-8" />
                    </div>
                    <div className="flex text-sm text-gray-600 items-center justify-center">
                      <label htmlFor="image-upload" className="relative cursor-pointer font-medium text-gray-600 hover:text-gray-500">
                        <span>{imagePreviews.length > 0 ? 'Add more images' : 'Upload images'}</span>
                        <input
                          id="image-upload"
                          name="images"
                          type="file"
                          className="sr-only"
                          accept="image/*"
                          multiple
                          onChange={handleChange}
                          ref={fileInputRef}
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">
                      PNG, JPG, WebP up to 10MB each • Recommended: 800x800px • Multiple files supported
                    </p>
                  </div>
                </div>
                {formErrors.images && submitAttempted && (
                  <p className="mt-2 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {formErrors.images}
                  </p>
                )}
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
              <div className="text-sm text-gray-500">
                * Required fields
              </div>
              <div className="flex items-center space-x-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-300"
                  disabled={isLoading || imageUploading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-lg text-sm font-medium hover:from-gray-700 hover:to-gray-800 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500/20 flex items-center shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isLoading || imageUploading}
                >
                  {imageUploading ? (
                    <>
                      <Loader className="animate-spin mr-2" size={16} />
                      Uploading Image...
                    </>
                  ) : isLoading ? (
                    <>
                      <Loader className="animate-spin mr-2" size={16} />
                      Adding Product...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Product
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default AddProductModal;