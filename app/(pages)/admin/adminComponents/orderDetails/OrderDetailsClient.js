'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import { useDeleteData } from '@/lib/hooks/useDeleteData';
import { 
  Search, 
  Calendar,
  DollarSign,
  Package,
  Clock,
  Mail,
  MapPin,
  Truck,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Edit3,
  ChevronDown,
  X,
  Trash2,
  CreditCard,
  Phone,
  Image as ImageIcon,
  ExternalLink
} from 'lucide-react';

const OrderDetails = ({ ordersData }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [toast, setToast] = useState({ show: false, type: 'success', message: '' });
  const [isUpdating, setIsUpdating] = useState(false);

  const queryClient = useQueryClient();

  const showToast = (type, message) => {
    setToast({ show: true, type, message });
    setTimeout(() => {
      setToast({ show: false, type: '', message: '' });
    }, 3000);
  };

  // Use the delete hook for order deletion
  const { deleteData: deleteOrder, isLoading: isDeleting } = useDeleteData({
    name: 'orders',
    api: '/api/orders'
  });

  const { orders = [], stats: serverStats = {} } = ordersData;

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customer?.toLowerCase().includes(searchTerm.toLowerCase()) || '';
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Status update function using direct API call
  const updateOrderStatus = async (orderId, newStatus) => {
    if (isUpdating) return; // Prevent multiple updates

    if (!orderId) {
      console.error('updateOrderStatus called with undefined/null orderId');
      showToast('error', 'Invalid order ID. Please try again.');
      return;
    }



    setIsUpdating(true);
    try {
      const url = `/api/orders/${orderId}`;


      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });



      if (!response.ok) {
        const errorText = await response.text();
        console.error('Response error text:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const result = await response.json();

      
      // Refresh the orders data
      queryClient.invalidateQueries(['orders']);
      
      showToast('success', `Order status updated to ${newStatus} successfully!`);
    } catch (error) {
      console.error('Error updating order status:', error);
      showToast('error', 'Failed to update order status. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  // Delete order function
  const handleDeleteOrder = async (orderId) => {
    if (isDeleting) return; // Prevent multiple deletes

    try {
      await deleteOrder(orderId);
      
      // The hook will automatically refresh the data through React Query
      showToast('success', 'Order deleted successfully!');
      setShowDeleteModal(false);
      setDeleteConfirmId(null);
      
      // Close order modal if the deleted order was being viewed
      if (selectedOrder?._id === orderId) {
        setShowOrderModal(false);
        setSelectedOrder(null);
      }
    } catch (error) {
      console.error('Error deleting order:', error);
      showToast('error', 'Failed to delete order. Please try again.');
    }
  };

  // Show delete confirmation
  const showDeleteConfirmation = (orderId) => {
    setDeleteConfirmId(orderId);
    setShowDeleteModal(true);
  };

  // View detailed order function
  const viewOrderDetails = (order) => {

    setSelectedOrder(order);
    setShowOrderModal(true);

  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-orange-100 text-orange-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'shipped':
        return 'bg-blue-100 text-blue-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return AlertCircle;
      case 'confirmed':
        return CheckCircle;
      case 'processing':
        return Clock;
      case 'shipped':
        return Truck;
      case 'delivered':
        return CheckCircle;
      case 'cancelled':
        return XCircle;
      default:
        return Package;
    }
  };

  // Status options for dropdown
  const statusOptions = [
    { value: 'pending', label: 'Pending', color: 'text-orange-600' },
    { value: 'confirmed', label: 'Confirmed', color: 'text-blue-600' },
    { value: 'processing', label: 'Processing', color: 'text-yellow-600' },
    { value: 'shipped', label: 'Shipped', color: 'text-blue-600' },
    { value: 'delivered', label: 'Delivered', color: 'text-green-600' },
    { value: 'cancelled', label: 'Cancelled', color: 'text-red-600' },
  ];

  // Status Dropdown Component
  const StatusDropdown = ({ currentStatus, orderId }) => {

    const [isOpen, setIsOpen] = useState(false);

    // Close dropdown when clicking outside
    React.useEffect(() => {
      const handleClickOutside = () => setIsOpen(false);
      if (isOpen) {
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
      }
    }, [isOpen]);

    return (
      <div className="relative" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          disabled={isUpdating}
          className={`flex items-center space-x-2 px-3 py-2 rounded-lg border transition-colors ${
            isUpdating 
              ? 'opacity-50 cursor-not-allowed bg-gray-100' 
              : 'hover:bg-gray-50 border-gray-300'
          }`}
        >
          <Edit3 size={14} />
          <span className="text-sm">
            {isUpdating ? 'Updating...' : 'Update Status'}
          </span>
          <ChevronDown size={14} />
        </button>

        {isOpen && !isUpdating && (
          <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
            <div className="p-1">
              {statusOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {

                    updateOrderStatus(orderId, option.value);
                    setIsOpen(false);
                  }}
                  disabled={option.value === currentStatus}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                    option.value === currentStatus
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : `hover:bg-gray-50 ${option.color}`
                  }`}
                >
                  {option.label} {option.value === currentStatus && '(Current)'}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const {
    totalOrders = 0,
    pendingOrders = 0,
    confirmedOrders = 0,
    processingOrders = 0,
    shippedOrders = 0,
    deliveredOrders = 0,
    totalRevenue = 0
  } = serverStats || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Order Management</h1>
          <p className="text-gray-600">Track and manage customer orders</p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-7 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center space-x-2">
            <Package className="text-gray-600" size={20} />
            <span className="text-sm text-gray-600">Total Orders</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-1">{totalOrders}</p>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center space-x-2">
            <AlertCircle className="text-orange-600" size={20} />
            <span className="text-sm text-gray-600">Pending</span>
          </div>
          <p className="text-2xl font-bold text-orange-600 mt-1">{pendingOrders}</p>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center space-x-2">
            <CheckCircle className="text-blue-600" size={20} />
            <span className="text-sm text-gray-600">Confirmed</span>
          </div>
          <p className="text-2xl font-bold text-blue-600 mt-1">{confirmedOrders}</p>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center space-x-2">
            <Clock className="text-yellow-600" size={20} />
            <span className="text-sm text-gray-600">Processing</span>
          </div>
          <p className="text-2xl font-bold text-yellow-600 mt-1">{processingOrders}</p>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center space-x-2">
            <Truck className="text-blue-600" size={20} />
            <span className="text-sm text-gray-600">Shipped</span>
          </div>
          <p className="text-2xl font-bold text-blue-600 mt-1">{shippedOrders}</p>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center space-x-2">
            <CheckCircle className="text-green-600" size={20} />
            <span className="text-sm text-gray-600">Delivered</span>
          </div>
          <p className="text-2xl font-bold text-green-600 mt-1">{deliveredOrders}</p>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center space-x-2">
            <DollarSign className="text-green-600" size={20} />
            <span className="text-sm text-gray-600">Revenue</span>
          </div>
          <p className="text-2xl font-bold text-green-600 mt-1">৳{totalRevenue.toFixed(2)}</p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent w-full lg:w-64"
            />
          </div>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {!filteredOrders?.length ? (
          <div className="text-center py-12">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">No orders found</h3>
            <p className="mt-1 text-sm text-gray-500">Try adjusting your search or filter criteria</p>
          </div>
        ) : (
          filteredOrders.map((order, index) => (
            <motion.div
              key={order._id || order.id || index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="text-lg font-bold text-gray-900">
                      {order.orderId || `Order ${order.id}`}
                    </h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                      {order.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar size={14} className="mr-2" />
                    <span>{order.date}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600 mb-1">Payment & Total</p>
                  <div className="space-y-1">
                    <p className="text-sm">
                      {typeof order.paymentMethod === 'object' 
                        ? order.paymentMethod.name || order.paymentMethod.type || 'Unknown Payment'
                        : order.paymentMethod || 'Unknown Payment'}
                    </p>
                    <p className="text-lg font-bold text-green-600">৳{order.total}</p>
                  </div>
                </div>
              </div>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">Customer Details</p>
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="font-medium">{order.customer}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Mail size={14} className="mr-2" />
                    <span>{order.email}</span>
                  </div>
                </div>
              </div>
              
              {order.products && order.products.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">Items ({order.products.length})</p>
                  <div className="space-y-2">
                    {order.products.map((item, itemIndex) => (
                      <div key={`${order.id}-product-${itemIndex}-${item.name}`} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                        <div>
                          <p className="font-medium text-gray-900">{item.name}</p>
                          <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">৳{item.price}</p>
                          <p className="text-sm text-gray-500">৳{(item.price * item.quantity).toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {order.trackingNumber && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 font-medium">
                    Tracking Number: {order.trackingNumber}
                  </p>
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin size={14} className="mr-2" />
                  <span>{order.shippingAddress || 'No address provided'}</span>
                </div>
                
                <div className="flex space-x-2">
                  <button 
                    onClick={() => viewOrderDetails(order)}
                    className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    <Eye size={16} />
                    <span>View Details</span>
                  </button>
                  
                  <button 
                    onClick={() => showDeleteConfirmation(order.id || order._id)}
                    disabled={isDeleting}
                    className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Trash2 size={16} />
                    <span>Delete</span>
                  </button>
                  
                  <StatusDropdown 
                    currentStatus={order.status}
                    orderId={order.id}
                  />
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Detailed Order Modal */}
      <AnimatePresence>
        {showOrderModal && selectedOrder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 backdrop-blur-sm bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowOrderModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      Order Details - {selectedOrder.orderId || selectedOrder.id}
                    </h2>
                    <div className="flex items-center space-x-3 mt-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedOrder.status)}`}>
                        {selectedOrder.status.toUpperCase()}
                      </span>
                      <span className="text-gray-500">{selectedOrder.date}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowOrderModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-6">
                {/* Customer Information */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Name</label>
                      <p className="text-gray-900">{selectedOrder.customer}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Email</label>
                      <p className="text-gray-900">{selectedOrder.email}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Phone</label>
                      <p className="text-gray-900">{selectedOrder.phone || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Shipping Address</label>
                      <div className="text-gray-900">
                        {selectedOrder.customerInfo?.address && typeof selectedOrder.customerInfo.address === 'object' ? (
                          <div>
                            <p>{selectedOrder.customerInfo.address.street || selectedOrder.customerInfo.address.address}</p>
                            <p>{selectedOrder.customerInfo.address.city}, {selectedOrder.customerInfo.address.zipCode || selectedOrder.customerInfo.address.zip}</p>
                          </div>
                        ) : (
                          <p>{selectedOrder.shippingAddress || selectedOrder.customerInfo?.address || 'Not provided'}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Order Items ({selectedOrder.products?.length || 0})
                  </h3>
                  <div className="space-y-3">
                    {selectedOrder.products && selectedOrder.products.length > 0 ? (
                      selectedOrder.products.map((item, index) => (
                        <div key={`modal-product-${index}-${item.name}-${item.quantity}`} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{item.name}</h4>
                            <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                            <p className="text-sm text-gray-600">Unit Price: ৳{item.price}</p>
                          </div>
                          <div className="text-right">
                                                        <p className="text-sm text-gray-600">Unit Price: ৳{item.price}</p>
                            <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-lg">৳{(item.price * item.quantity).toFixed(2)}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-center py-4">No items found</p>
                    )}
                  </div>
                </div>

                {/* Payment & Total */}
                <div className="bg-blue-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment & Order Summary</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Payment Method</label>
                      <p className="text-gray-900">
                        {typeof selectedOrder.paymentMethod === 'object' 
                          ? selectedOrder.paymentMethod.name || selectedOrder.paymentMethod.type || 'Unknown Payment'
                          : selectedOrder.paymentMethod || 'Unknown Payment'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Payment Status</label>
                      <p className="text-gray-900">{selectedOrder.paymentStatus || 'Completed'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Tracking Number</label>
                      <p className="text-gray-900">{selectedOrder.trackingNumber || 'Not assigned'}</p>
                    </div>
                  </div>
                  
                  {/* Order Summary Breakdown */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Subtotal:</span>
                        <span className="text-gray-900">৳{selectedOrder.subtotal || 0}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Shipping:</span>
                        <span className="text-gray-900">৳{selectedOrder.shipping || 0}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Tax:</span>
                        <span className="text-gray-900">৳{selectedOrder.tax || 0}</span>
                      </div>
                      <div className="flex justify-between text-lg font-bold border-t pt-2">
                        <span className="text-gray-900">Total:</span>
                        <span className="text-green-600">৳{selectedOrder.total}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Proof Section - For Advance Payment */}
                {selectedOrder.paymentMethod?.advancePayment && (
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                    <div className="flex items-center gap-2 mb-4">
                      <CreditCard className="text-green-600" size={20} />
                      <h3 className="text-lg font-semibold text-gray-900">Payment Proof (15% Advance)</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Payment Details */}
                      <div className="space-y-4">
                        <div className="bg-white rounded-lg p-4 shadow-sm">
                          <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Method</label>
                          <p className="text-gray-900 font-semibold text-lg mt-1 capitalize">
                            {selectedOrder.paymentMethod.advancePayment.method === 'bkash' ? (
                              <span className="text-pink-600">bKash</span>
                            ) : selectedOrder.paymentMethod.advancePayment.method === 'nagad' ? (
                              <span className="text-orange-600">Nagad</span>
                            ) : (
                              selectedOrder.paymentMethod.advancePayment.method
                            )}
                          </p>
                        </div>
                        
                        <div className="bg-white rounded-lg p-4 shadow-sm">
                          <label className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1">
                            <Phone size={12} /> Payment Phone Number
                          </label>
                          <p className="text-gray-900 font-mono text-lg mt-1">
                            {selectedOrder.paymentMethod.advancePayment.phoneNumber || 'Not provided'}
                          </p>
                        </div>
                        
                        <div className="bg-white rounded-lg p-4 shadow-sm">
                          <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Transaction ID</label>
                          <p className="text-gray-900 font-mono text-lg mt-1 break-all">
                            {selectedOrder.paymentMethod.advancePayment.transactionId || 'Not provided'}
                          </p>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-white rounded-lg p-4 shadow-sm">
                            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Advance Paid</label>
                            <p className="text-green-600 font-bold text-xl mt-1">
                              ৳{selectedOrder.paymentMethod.advancePayment.amount || 0}
                            </p>
                          </div>
                          <div className="bg-white rounded-lg p-4 shadow-sm">
                            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Remaining (COD)</label>
                            <p className="text-orange-600 font-bold text-xl mt-1">
                              ৳{selectedOrder.paymentMethod.advancePayment.remainingAmount || 0}
                            </p>
                          </div>
                        </div>
                        
                        {selectedOrder.paymentMethod.advancePayment.paidAt && (
                          <div className="bg-white rounded-lg p-4 shadow-sm">
                            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Date & Time</label>
                            <p className="text-gray-900 mt-1">
                              {new Date(selectedOrder.paymentMethod.advancePayment.paidAt).toLocaleString('en-BD', {
                                dateStyle: 'medium',
                                timeStyle: 'short'
                              })}
                            </p>
                          </div>
                        )}
                      </div>
                      
                      {/* Payment Screenshot */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <ImageIcon size={16} className="text-gray-600" />
                          <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Screenshot</label>
                        </div>
                        {selectedOrder.paymentMethod.advancePayment.screenshot ? (
                          <div className="relative group">
                            <div className="bg-white rounded-xl p-2 shadow-sm border border-gray-200 overflow-hidden">
                              <img 
                                src={selectedOrder.paymentMethod.advancePayment.screenshot} 
                                alt="Payment proof screenshot"
                                className="w-full h-auto max-h-80 object-contain rounded-lg"
                              />
                            </div>
                            <a 
                              href={selectedOrder.paymentMethod.advancePayment.screenshot}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="absolute top-4 right-4 bg-black/70 hover:bg-black text-white px-3 py-2 rounded-lg flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <ExternalLink size={14} />
                              <span className="text-sm">View Full</span>
                            </a>
                          </div>
                        ) : (
                          <div className="bg-white rounded-xl p-8 shadow-sm border border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400">
                            <ImageIcon size={48} className="mb-2 opacity-50" />
                            <p className="text-sm">No screenshot uploaded</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                  <button
                    onClick={() => showDeleteConfirmation(selectedOrder.id || selectedOrder._id)}
                    disabled={isDeleting}
                    className="flex items-center space-x-2 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Trash2 size={16} />
                    <span>Delete Order</span>
                  </button>
                  
                  <div className="flex space-x-3">
                    <button
                      onClick={() => setShowOrderModal(false)}
                      className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Close
                    </button>
                    <StatusDropdown 
                      currentStatus={selectedOrder.status}
                      orderId={selectedOrder.id}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setShowDeleteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl p-6 max-w-md w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Delete Order</h3>
                  <p className="text-sm text-gray-600">This action cannot be undone</p>
                </div>
              </div>
              
              <p className="text-gray-700 mb-6">
                Are you sure you want to delete this order? This will permanently remove the order from the system and cannot be undone.
              </p>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteOrder(deleteConfirmId)}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDeleting ? 'Deleting...' : 'Delete Order'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
              <CheckCircle className="w-5 h-5" />
            ) : (
              <XCircle className="w-5 h-5" />
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

export default OrderDetails;