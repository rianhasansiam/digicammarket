'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Upload, Check, AlertCircle, Loader, Plus, Minus, Tag, Palette, DollarSign } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUpdateData } from '@/lib/hooks/useUpdateData';
import { uploadToImageBB } from '@/lib/imagebb';
import Image from 'next/image';

const EditProductModal = ({ isOpen, onClose, categories, product }) => {
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
  
  // Initialize the useUpdateData hook
  const { updateData, isLoading, error } = useUpdateData({
    name: 'allProducts',
    api: '/api/products'
  });

  // Populate form when product prop changes
  useEffect(() => {
    if (product && isOpen) {
      setFormData({
        name: product.name || '',
        category: product.category || '',
        style: product.style || '',
        brand: product.brand || '',
        price: product.price?.toString() || '',
        originalPrice: product.originalPrice?.toString() || '',
        stock: product.stock?.toString() || '',
        shortDescription: product.shortDescription || '',
        description: product.description || '',
        images: product.images || [product.image] || [],
        colors: product.colors || [product.color] || [],
        sizes: product.sizes || []
      });
      
      // Set existing image previews
      if (product.images) {
        setImagePreviews(product.images);
      } else if (product.image) {
        setImagePreviews([product.image]);
      }
    }
  }, [product, isOpen]);

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
    if (formData.images.length === 0 && selectedFiles.length === 0 && imagePreviews.length === 0) {
      errors.images = 'At least one product image is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitAttempted(true);
    
    if (!validateForm()) return;
    
    try {
      let imageUrls = [...formData.images];
      
      // Upload new files if any
      if (selectedFiles.length > 0) {
        setImageUploading(true);
        try {
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
      
      // Prepare product data
      const productData = {
        ...formData,
        images: imageUrls,
        image: imageUrls[0], // Keep backward compatibility
        colors: formData.colors,
        color: formData.colors[0], // Keep backward compatibility
        price: parseFloat(formData.price),
        originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice) : null,
        stock: parseInt(formData.stock),
      };
      
      await updateData({ id: product._id, data: productData });
      setSuccessMessage('Product updated successfully!');
      
      // Close modal after success
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      console.error('Error updating product:', err);
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
      const newFiles = Array.from(files);
      setSelectedFiles(prev => [...prev, ...newFiles]);
      
      // Create previews for new files
      newFiles.forEach(file => {
        const reader = new FileReader();
        reader.onload = () => setImagePreviews(prev => [...prev, reader.result]);
        reader.readAsDataURL(file);
      });
    } else {
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
      const newFiles = Array.from(files);
      setSelectedFiles(prev => [...prev, ...newFiles]);
      
      newFiles.forEach(file => {
        const reader = new FileReader();
        reader.onload = () => setImagePreviews(prev => [...prev, reader.result]);
        reader.readAsDataURL(file);
      });
    }
  };

  // Remove individual image
  const removeImage = (index) => {
    const isExistingImage = index < formData.images.length;
    
    if (isExistingImage) {
      // Remove from existing images
      setFormData(prev => ({
        ...prev,
        images: prev.images.filter((_, i) => i !== index)
      }));
    } else {
      // Remove from new files
      const newFileIndex = index - formData.images.length;
      setSelectedFiles(prev => prev.filter((_, i) => i !== newFileIndex));
    }
    
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden backdrop-blur-sm flex items-center justify-center p-4">
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
              <h2 className="text-2xl font-bold text-gray-900">Edit Product</h2>
              <p className="text-sm text-gray-600 mt-1">Update product information</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Success Message */}
          {successMessage && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mx-6 mt-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2"
            >
              <Check className="text-green-600" size={20} />
              <span className="text-green-700 font-medium">{successMessage}</span>
            </motion.div>
          )}

          {/* Form */}
          <div className="flex-1 overflow-y-auto p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all ${
                      formErrors.name ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="e.g., Canon EOS R5, Nikon Z9, Sony A7 IV"
                  />
                  {formErrors.name && (
                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                      <AlertCircle size={14} />
                      {formErrors.name}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all ${
                      formErrors.category ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
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
                  {formErrors.category && (
                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                      <AlertCircle size={14} />
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
                </div>
              </div>

              {/* Brand Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Brand *
                </label>
                <input
                  type="text"
                  name="brand"
                  value={formData.brand}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all ${
                    formErrors.brand ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="e.g., Canon, Nikon, Sony, Fujifilm, Panasonic"
                />
                {formErrors.brand && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {formErrors.brand}
                  </p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Enter the manufacturer or brand name of the camera
                </p>
              </div>

              {/* Style and Prices */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Camera Type *
                  </label>
                  <select
                    name="style"
                    value={formData.style}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all ${
                      formErrors.style ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select camera type</option>
                    {availableStyles.map(style => (
                      <option key={style} value={style}>{style}</option>
                    ))}
                  </select>
                  {formErrors.style && (
                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                      <AlertCircle size={14} />
                      {formErrors.style}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price * 
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">৳</span>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleChange}
                      step="0.01"
                      min="0"
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all ${
                        formErrors.price ? 'border-red-500 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="0.00"
                    />
                  </div>
                  {formErrors.price && (
                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                      <AlertCircle size={14} />
                      {formErrors.price}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Original Price
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">৳</span>
                    <input
                      type="number"
                      name="originalPrice"
                      value={formData.originalPrice}
                      onChange={handleChange}
                      step="0.01"
                      min="0"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              {/* Stock */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stock Quantity *
                  </label>
                  <input
                    type="number"
                    name="stock"
                    value={formData.stock}
                    onChange={handleChange}
                    min="0"
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all ${
                      formErrors.stock ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="0"
                  />
                  {formErrors.stock && (
                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                      <AlertCircle size={14} />
                      {formErrors.stock}
                    </p>
                  )}
                </div>
                <div></div>
                <div></div>
              </div>

              {/* Short Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Short Description *
                </label>
                <input
                  type="text"
                  name="shortDescription"
                  value={formData.shortDescription}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all ${
                    formErrors.shortDescription ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="e.g., Professional mirrorless camera with 45MP sensor and 8K video"
                  maxLength="100"
                />
                <p className="mt-1 text-xs text-gray-500">
                  {formData.shortDescription.length}/100 characters
                </p>
                {formErrors.shortDescription && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {formErrors.shortDescription}
                  </p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none ${
                    formErrors.description ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="Describe camera features, specifications, image quality, video capabilities, autofocus system, and included accessories..."
                />
                {formErrors.description && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {formErrors.description}
                  </p>
                )}
              </div>

              {/* Images Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  <Upload className="inline mr-2" size={16} />
                  Product Images *
                </label>
                
                {/* Image Previews */}
                {imagePreviews.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="relative group">
                        <Image
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          width={150}
                          height={150}
                          className="w-full h-24 object-cover rounded-lg border border-gray-200"
                          unoptimized={true}
                          onError={(e) => {
                            e.target.src = '/default-product.png';
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Upload Area */}
                <div
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-all ${
                    formErrors.images ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-indigo-400 hover:bg-indigo-50'
                  }`}
                >
                  <Upload className="mx-auto text-gray-400 mb-3" size={32} />
                  <p className="text-gray-600 mb-2">Drag & drop images here, or click to browse</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-indigo-100 text-indigo-600 rounded-lg hover:bg-indigo-200 transition-colors"
                  >
                    Choose Files
                  </button>
                  <p className="text-xs text-gray-500 mt-2">PNG, JPG, JPEG up to 10MB each</p>
                </div>
                {formErrors.images && (
                  <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {formErrors.images}
                  </p>
                )}
              </div>

              {/* Colors */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  <Palette className="inline mr-2" size={16} />
                  Body Color *
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    />
                  </div>
                  <button type="button" onClick={() => handleAddColor(colorInput)} disabled={!colorInput.trim()} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                    <Plus className="w-4 h-4" />
                  </button>
                  <div className="flex items-center gap-1">
                    <input type="color" value={colorPickerValue} onChange={handleColorPicker} className="w-9 h-9 rounded-lg border border-gray-300 cursor-pointer p-0.5" title="Pick a color" />
                    <button type="button" onClick={handleColorPickerAdd} className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
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

                {formErrors.colors && (
                  <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {formErrors.colors}
                  </p>
                )}
              </div>

              {/* Sizes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  <Tag className="inline mr-2" size={16} />
                  Camera Type *
                </label>
                <div className="flex flex-wrap gap-3">
                  {availableSizes.map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => handleSizeToggle(size)}
                      className={`px-4 py-2 border rounded-lg font-medium transition-all ${
                        formData.sizes.includes(size)
                          ? 'border-indigo-500 bg-indigo-500 text-white'
                          : 'border-gray-300 text-gray-700 hover:border-indigo-300'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
                {formErrors.sizes && (
                  <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {formErrors.sizes}
                  </p>
                )}
              </div>
            </form>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 p-6 bg-gray-50">
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                onClick={handleSubmit}
                disabled={isLoading || imageUploading}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {isLoading || imageUploading ? (
                  <>
                    <Loader className="animate-spin" size={16} />
                    {imageUploading ? 'Uploading...' : 'Updating...'}
                  </>
                ) : (
                  'Update Product'
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default EditProductModal;