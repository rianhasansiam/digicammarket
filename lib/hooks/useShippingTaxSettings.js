import { useShippingTax } from './useReduxData';

export const useShippingTaxSettings = () => {
  const { data, isLoading, error, refetch } = useShippingTax();

  // Default settings fallback
  const defaultSettings = {
    shippingSettings: {
      shippingCharge: 15,
      enabled: true
    },
    taxSettings: {
      taxRate: 8.25,
      enabled: true,
      taxName: "Sales Tax"
    }
  };

  // Handle both direct data and nested { data: ... } structures
  const settings = data?.shippingSettings ? data : (data?.data || defaultSettings);

  // Helper function to calculate shipping
  const calculateShipping = (subtotal) => {
    if (!settings.shippingSettings?.enabled) return 0;
    
    return settings.shippingSettings.shippingCharge || 15;
  };

  // Helper function to calculate tax
  const calculateTax = (subtotal) => {
    if (!settings.taxSettings?.enabled) return 0;
    
    return (subtotal * (settings.taxSettings.taxRate || 0)) / 100;
  };

  // Helper function to calculate totals
  const calculateTotals = (subtotal, couponDiscount = 0) => {
    const shipping = calculateShipping(subtotal);
    const subtotalAfterDiscount = Math.max(0, subtotal - couponDiscount);
    const tax = calculateTax(subtotalAfterDiscount);
    const total = subtotalAfterDiscount + shipping + tax;

    return {
      subtotal: subtotal.toFixed(2),
      shipping: shipping.toFixed(2),
      tax: tax.toFixed(2),
      discount: couponDiscount.toFixed(2),
      total: total.toFixed(2),
      taxName: settings.taxSettings?.taxName || 'Sales Tax',
      shippingCharge: settings.shippingSettings?.shippingCharge || 15
    };
  };

  return {
    settings,
    isLoading,
    error,
    refetch,
    calculateShipping,
    calculateTax,
    calculateTotals,
    // Convenience getters
    get shippingEnabled() { return settings.shippingSettings?.enabled ?? true; },
    get taxEnabled() { return settings.taxSettings?.enabled ?? true; },
    get shippingCharge() { return settings.shippingSettings?.shippingCharge ?? 15; },
    get taxRate() { return settings.taxSettings?.taxRate ?? 0; },
    get taxName() { return settings.taxSettings?.taxName ?? 'Sales Tax'; }
  };
};