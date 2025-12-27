'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Zap, 
  Package, 
  Calendar, 
  Tag,
  Percent,
  Image,
  Palette,
  Clock,
  CheckCircle
} from 'lucide-react';
import { useAddData } from '../../../../../lib/hooks/useAddData';

const AddSaleModal = ({ isOpen, onClose, onSuccess, products = [], categories = [] }) => {
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    description: '',
    saleType: 'flash',
    discountType: 'percentage',
    discountValue: '',
    startDate: '',
    endDate: '',
    status: 'active',
    backgroundColor: '#dc2626',
    textColor: '#ffffff',
    accentColor: '#fbbf24',
    productIds: [],
    categoryIds: [],
    bannerImage: '',
    showCountdown: true,
    featured: false,
    priority: ''
  });

  const [errors, setErrors] = useState({});
  const [activeTab, setActiveTab] = useState('basic');

  const { addData, isLoading } = useAddData({
    name: 'sales',
    api: '/api/sales'
  });

  const validateForm = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.startDate) newErrors.startDate = 'Start date is required';
    if (!formData.endDate) newErrors.endDate = 'End date is required';
    if (new Date(formData.startDate) >= new Date(formData.endDate)) {
      newErrors.endDate = 'End date must be after start date';
    }
    if (formData.discountValue !== '' && formData.discountValue < 0) newErrors.discountValue = 'Discount cannot be negative';
    if (formData.discountType === 'percentage' && formData.discountValue > 100) {
      newErrors.discountValue = 'Percentage cannot exceed 100%';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      await addData(formData);
      onSuccess();
      resetForm();
    } catch (error) {
      console.error('Failed to create sale:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      subtitle: '',
      description: '',
      saleType: 'flash',
      discountType: 'percentage',
      discountValue: '',
      startDate: '',
      endDate: '',
      status: 'active',
      backgroundColor: '#dc2626',
      textColor: '#ffffff',
      accentColor: '#fbbf24',
      productIds: [],
      categoryIds: [],
      bannerImage: '',
      showCountdown: true,
      featured: false,
      priority: ''
    });
    setErrors({});
    setActiveTab('basic');
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleProductToggle = (productId) => {
    setFormData(prev => ({
      ...prev,
      productIds: prev.productIds.includes(productId)
        ? prev.productIds.filter(id => id !== productId)
        : [...prev.productIds, productId]
    }));
  };

  const handleCategoryToggle = (categoryId) => {
    setFormData(prev => ({
      ...prev,
      categoryIds: prev.categoryIds.includes(categoryId)
        ? prev.categoryIds.filter(id => id !== categoryId)
        : [...prev.categoryIds, categoryId]
    }));
  };

  const saleTypes = [
    { value: 'flash', label: 'Flash Sale', icon: Zap, color: 'text-yellow-500', description: 'Limited time offer' },
    { value: 'bundle', label: 'Bundle Deal', icon: Package, color: 'text-purple-500', description: 'Multiple products together' },
    { value: 'seasonal', label: 'Seasonal', icon: Calendar, color: 'text-green-500', description: 'Holiday or season specific' },
    { value: 'clearance', label: 'Clearance', icon: Tag, color: 'text-red-500', description: 'Stock clearance sale' }
  ];

  const presetColors = [
    { bg: '#dc2626', text: '#ffffff', accent: '#fbbf24', name: 'Red Hot' },
    { bg: '#1f2937', text: '#ffffff', accent: '#3b82f6', name: 'Dark Blue' },
    { bg: '#059669', text: '#ffffff', accent: '#fcd34d', name: 'Emerald' },
    { bg: '#7c3aed', text: '#ffffff', accent: '#f472b6', name: 'Purple' },
    { bg: '#ea580c', text: '#ffffff', accent: '#fbbf24', name: 'Orange' },
    { bg: '#0891b2', text: '#ffffff', accent: '#a78bfa', name: 'Cyan' }
  ];

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
          className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-600 to-red-600 p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Zap className="w-8 h-8" />
                <div>
                  <h2 className="text-2xl font-bold">Create New Sale</h2>
                  <p className="text-white/80 text-sm">Set up a promotion to boost your sales</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <div className="flex">
              {['basic', 'appearance', 'products'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-3 font-medium capitalize transition-colors ${
                    activeTab === tab
                      ? 'text-orange-600 border-b-2 border-orange-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab === 'basic' ? 'Basic Info' : tab === 'appearance' ? 'Appearance' : 'Products'}
                </button>
              ))}
            </div>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            {activeTab === 'basic' && (
              <div className="space-y-6">
                {/* Sale Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Sale Type</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {saleTypes.map((type) => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => handleChange('saleType', type.value)}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          formData.saleType === type.value
                            ? 'border-orange-500 bg-orange-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <type.icon className={`w-6 h-6 ${type.color} mx-auto mb-2`} />
                        <div className="font-medium text-gray-900">{type.label}</div>
                        <div className="text-xs text-gray-500">{type.description}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Title & Subtitle */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => handleChange('title', e.target.value)}
                      placeholder="e.g., Summer Flash Sale"
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                        errors.title ? 'border-red-500' : 'border-gray-200'
                      }`}
                    />
                    {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle</label>
                    <input
                      type="text"
                      value={formData.subtitle}
                      onChange={(e) => handleChange('subtitle', e.target.value)}
                      placeholder="e.g., Up to 50% off on selected items"
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    placeholder="Describe your sale..."
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                  />
                </div>

                {/* Discount */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Discount Type</label>
                    <select
                      value={formData.discountType}
                      onChange={(e) => handleChange('discountType', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed Amount (৳)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Discount Value</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={formData.discountValue}
                        onChange={(e) => handleChange('discountValue', parseFloat(e.target.value) || 0)}
                        min="0"
                        max={formData.discountType === 'percentage' ? 100 : undefined}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                          errors.discountValue ? 'border-red-500' : 'border-gray-200'
                        }`}
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                        {formData.discountType === 'percentage' ? '%' : '৳'}
                      </span>
                    </div>
                    {errors.discountValue && <p className="text-red-500 text-sm mt-1">{errors.discountValue}</p>}
                  </div>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.startDate}
                      onChange={(e) => handleChange('startDate', e.target.value)}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                        errors.startDate ? 'border-red-500' : 'border-gray-200'
                      }`}
                    />
                    {errors.startDate && <p className="text-red-500 text-sm mt-1">{errors.startDate}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.endDate}
                      onChange={(e) => handleChange('endDate', e.target.value)}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                        errors.endDate ? 'border-red-500' : 'border-gray-200'
                      }`}
                    />
                    {errors.endDate && <p className="text-red-500 text-sm mt-1">{errors.endDate}</p>}
                  </div>
                </div>

                {/* Options */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => handleChange('status', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    >
                      <option value="active">Active</option>
                      <option value="scheduled">Scheduled</option>
                      <option value="paused">Paused</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                    <input
                      type="number"
                      value={formData.priority}
                      onChange={(e) => handleChange('priority', parseInt(e.target.value) || 0)}
                      min="0"
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                  <div className="flex items-center space-x-4 pt-6">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.showCountdown}
                        onChange={(e) => handleChange('showCountdown', e.target.checked)}
                        className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500"
                      />
                      <span className="text-sm text-gray-700">Show Countdown</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.featured}
                        onChange={(e) => handleChange('featured', e.target.checked)}
                        className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500"
                      />
                      <span className="text-sm text-gray-700">Featured</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'appearance' && (
              <div className="space-y-6">
                {/* Color Presets */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Color Presets</label>
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                    {presetColors.map((preset, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => {
                          handleChange('backgroundColor', preset.bg);
                          handleChange('textColor', preset.text);
                          handleChange('accentColor', preset.accent);
                        }}
                        className="p-3 rounded-xl border-2 border-gray-200 hover:border-orange-500 transition-all"
                      >
                        <div
                          className="w-full h-12 rounded-lg mb-2 flex items-center justify-center"
                          style={{ backgroundColor: preset.bg }}
                        >
                          <span
                            className="text-sm font-bold"
                            style={{ color: preset.accent }}
                          >
                            SALE
                          </span>
                        </div>
                        <span className="text-xs text-gray-600">{preset.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Colors */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Background Color</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={formData.backgroundColor}
                        onChange={(e) => handleChange('backgroundColor', e.target.value)}
                        className="w-12 h-10 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={formData.backgroundColor}
                        onChange={(e) => handleChange('backgroundColor', e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Text Color</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={formData.textColor}
                        onChange={(e) => handleChange('textColor', e.target.value)}
                        className="w-12 h-10 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={formData.textColor}
                        onChange={(e) => handleChange('textColor', e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Accent Color</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={formData.accentColor}
                        onChange={(e) => handleChange('accentColor', e.target.value)}
                        className="w-12 h-10 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={formData.accentColor}
                        onChange={(e) => handleChange('accentColor', e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg"
                      />
                    </div>
                  </div>
                </div>

                {/* Preview */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Preview</label>
                  <div
                    className="rounded-xl p-6 text-center"
                    style={{ backgroundColor: formData.backgroundColor }}
                  >
                    <div
                      className="text-sm font-medium uppercase tracking-wider mb-2 opacity-80"
                      style={{ color: formData.accentColor }}
                    >
                      {formData.saleType} Sale
                    </div>
                    <h3
                      className="text-2xl font-bold mb-1"
                      style={{ color: formData.textColor }}
                    >
                      {formData.title || 'Sale Title'}
                    </h3>
                    <p
                      className="text-sm opacity-80"
                      style={{ color: formData.textColor }}
                    >
                      {formData.subtitle || 'Sale subtitle goes here'}
                    </p>
                    {formData.discountValue > 0 && (
                      <div
                        className="inline-block mt-3 px-4 py-2 rounded-full font-bold"
                        style={{ backgroundColor: formData.accentColor, color: formData.backgroundColor }}
                      >
                        {formData.discountType === 'percentage' ? `${formData.discountValue}% OFF` : `৳${formData.discountValue} OFF`}
                      </div>
                    )}
                  </div>
                </div>

                {/* Banner Image */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Banner Image URL (Optional)</label>
                  <div className="flex items-center space-x-2">
                    <Image size={20} className="text-gray-400" />
                    <input
                      type="url"
                      value={formData.bannerImage}
                      onChange={(e) => handleChange('bannerImage', e.target.value)}
                      placeholder="https://example.com/banner.jpg"
                      className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'products' && (
              <div className="space-y-6">
                {/* Categories Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Apply to Categories (Optional)
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-h-40 overflow-y-auto">
                    {categories.map((category) => (
                      <button
                        key={category._id || category.id}
                        type="button"
                        onClick={() => handleCategoryToggle(category._id || category.id)}
                        className={`p-2 rounded-lg border text-sm text-left transition-all ${
                          formData.categoryIds.includes(category._id || category.id)
                            ? 'border-orange-500 bg-orange-50 text-orange-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          {formData.categoryIds.includes(category._id || category.id) && (
                            <CheckCircle size={14} className="text-orange-500" />
                          )}
                          <span>{category.name}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                  {formData.categoryIds.length > 0 && (
                    <p className="text-sm text-orange-600 mt-2">
                      {formData.categoryIds.length} categories selected
                    </p>
                  )}
                </div>

                {/* Products Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Apply to Specific Products (Optional)
                  </label>
                  <div className="border border-gray-200 rounded-lg max-h-64 overflow-y-auto">
                    {products.length === 0 ? (
                      <div className="p-8 text-center text-gray-500">
                        No products available
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-100">
                        {products.slice(0, 50).map((product) => (
                          <button
                            key={product._id || product.id}
                            type="button"
                            onClick={() => handleProductToggle(product._id || product.id)}
                            className={`w-full p-3 text-left transition-colors flex items-center space-x-3 ${
                              formData.productIds.includes(product._id || product.id)
                                ? 'bg-orange-50'
                                : 'hover:bg-gray-50'
                            }`}
                          >
                            <div className={`w-5 h-5 rounded border flex items-center justify-center ${
                              formData.productIds.includes(product._id || product.id)
                                ? 'bg-orange-500 border-orange-500'
                                : 'border-gray-300'
                            }`}>
                              {formData.productIds.includes(product._id || product.id) && (
                                <CheckCircle size={14} className="text-white" />
                              )}
                            </div>
                            {product.primaryImage && (
                              <img
                                src={product.primaryImage}
                                alt={product.name}
                                className="w-10 h-10 rounded object-cover"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-gray-900 truncate">{product.name}</div>
                              <div className="text-sm text-gray-500">৳{product.price}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {formData.productIds.length > 0 && (
                    <p className="text-sm text-orange-600 mt-2">
                      {formData.productIds.length} products selected
                    </p>
                  )}
                </div>

                <p className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
                  💡 <strong>Tip:</strong> If no products or categories are selected, the sale banner will be displayed without automatic discount application. You can use this for promotional announcements.
                </p>
              </div>
            )}
          </form>

          {/* Footer */}
          <div className="border-t border-gray-200 p-4 bg-gray-50 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <Zap size={18} />
                  <span>Create Sale</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AddSaleModal;
