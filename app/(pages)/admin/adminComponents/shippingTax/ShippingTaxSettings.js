'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Truck, Receipt, DollarSign, Save, AlertCircle, CheckCircle } from 'lucide-react';
import { useShippingTax } from '@/lib/hooks/useReduxData';
import axios from 'axios';

const ShippingTaxSettings = () => {
  const [settings, setSettings] = useState({
    shippingSettings: {
      shippingCharge: 15,
      enabled: true
    },
    taxSettings: {
      taxRate: 8.25,
      enabled: true,
      taxName: "Sales Tax"
    }
  });

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // 🚀 OPTIMIZED: Use Redux store for centralized data caching - NO duplicate API calls
  const { data: currentSettings, isLoading: fetchLoading, refetch } = useShippingTax();

  // Load settings when fetched
  useEffect(() => {
    if (currentSettings?.data) {
      const loadedSettings = {
        shippingSettings: {
          shippingCharge: currentSettings.data.shippingSettings?.shippingCharge || 15,
          enabled: currentSettings.data.shippingSettings?.enabled !== undefined 
            ? currentSettings.data.shippingSettings.enabled 
            : true
        },
        taxSettings: {
          taxRate: currentSettings.data.taxSettings?.taxRate || 8.25,
          enabled: currentSettings.data.taxSettings?.enabled !== undefined 
            ? currentSettings.data.taxSettings.enabled 
            : true,
          taxName: currentSettings.data.taxSettings?.taxName || "Sales Tax"
        }
      };
      setSettings(loadedSettings);
    }
  }, [currentSettings]);

  const handleInputChange = (section, field, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleNumberChange = (section, field, inputValue) => {
    if (inputValue === '' || inputValue === undefined || inputValue === null) {
      handleInputChange(section, field, '');
      return;
    }
    
    const numValue = parseFloat(inputValue);
    const safeValue = isNaN(numValue) ? 0 : numValue;
    handleInputChange(section, field, safeValue);
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      setMessage({ type: '', text: '' });
      
      const response = await axios.put('/api/shipping-tax-settings', settings);
      
      if (response.data.success) {
        setMessage({ type: 'success', text: 'Settings updated successfully!' });
        // Refetch the data to update the UI
        refetch();
      } else {
        throw new Error(response.data.error || 'Failed to update settings');
      }
      
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('Save error:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || error.message || 'Failed to update settings. Please try again.' 
      });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Shipping & Tax Settings</h1>
        <p className="text-gray-600">Configure shipping charges and tax rates for your store</p>
      </div>

      {message.text && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mb-6 p-4 rounded-lg flex items-center ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5 mr-2" />
          ) : (
            <AlertCircle className="w-5 h-5 mr-2" />
          )}
          {message.text}
        </motion.div>
      )}

      <div className="grid gap-8">
        {/* Shipping Settings */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center mb-6">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
              <Truck className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Shipping Settings</h2>
              <p className="text-gray-600 text-sm">Configure shipping charges</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">Enable Shipping</label>
              <button
                onClick={() => handleInputChange('shippingSettings', 'enabled', !settings.shippingSettings.enabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.shippingSettings.enabled ? 'bg-black' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.shippingSettings.enabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Shipping Charge ($)
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={settings.shippingSettings.shippingCharge || ''}
                  onChange={(e) => handleNumberChange('shippingSettings', 'shippingCharge', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="15"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Fixed shipping charge for all orders</p>
            </div>
          </div>
        </motion.div>

        {/* Tax Settings */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center mb-6">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
              <Receipt className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Tax Settings</h2>
              <p className="text-gray-600 text-sm">Configure tax rates and policies</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">Enable Tax Calculation</label>
              <button
                onClick={() => handleInputChange('taxSettings', 'enabled', !settings.taxSettings.enabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.taxSettings.enabled ? 'bg-black' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.taxSettings.enabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tax Name
              </label>
              <input
                type="text"
                value={settings.taxSettings.taxName || ''}
                onChange={(e) => handleInputChange('taxSettings', 'taxName', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                placeholder="Sales Tax"
              />
              <p className="text-xs text-gray-500 mt-1">Display name for tax (e.g., &quot;Sales Tax&quot;, &quot;VAT&quot;)</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tax Rate (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={settings.taxSettings.taxRate || ''}
                  onChange={(e) => handleNumberChange('taxSettings', 'taxRate', e.target.value)}
                  className="w-full px-4 py-3 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="8.25"
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">%</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Tax percentage to apply to orders</p>
            </div>
          </div>
        </motion.div>

        {/* Preview Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-50 rounded-xl p-6 border border-gray-200"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Preview</h3>
          <div className="bg-white rounded-lg p-4 border">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Sample Order (৳8,500.00):</span>
                <span>৳8,500.00</span>
              </div>
              {settings.shippingSettings.enabled && (
                <div className="flex justify-between">
                  <span>Shipping:</span>
                  <span>৳{settings.shippingSettings.shippingCharge || '0.00'}</span>
                </div>
              )}
              {settings.taxSettings.enabled && (
                <div className="flex justify-between">
                  <span>{settings.taxSettings.taxName}:</span>
                  <span>৳{((100 * (settings.taxSettings.taxRate || 0)) / 100).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold border-t pt-2">
                <span>Total:</span>
                <span>
                  \u09f3{(
                    100 + 
                    (settings.shippingSettings.enabled ? (settings.shippingSettings.shippingCharge || 0) : 0) + 
                    (settings.taxSettings.enabled ? ((100 * (settings.taxSettings.taxRate || 0)) / 100) : 0)
                  ).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="flex items-center px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {isLoading ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShippingTaxSettings;