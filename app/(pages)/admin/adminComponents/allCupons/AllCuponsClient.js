'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Ticket, 
  Calendar, 
  Percent, 
  TrendingUp,
  Filter,
  Grid,
  List,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import { useCoupons } from '@/lib/hooks/useReduxData';
import { useAddData } from '../../../../../lib/hooks/useAddData';
import { useUpdateData } from '../../../../../lib/hooks/useUpdateData';
import { useDeleteData } from '../../../../../lib/hooks/useDeleteData';
import AddCouponModal from './AddCouponModal';
import EditCouponModal from './EditCouponModal';
import DeleteConfirmationDialog from './DeleteConfirmationDialog';
import Toast from './Toast';

const AllCouponsClient = () => {
  const [viewMode, setViewMode] = useState('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [deletingCouponId, setDeletingCouponId] = useState(null);
  const [toast, setToast] = useState({ show: false, type: 'success', message: '' });

  // 🚀 OPTIMIZED: Use Redux store for centralized data caching - NO duplicate API calls
  const { data, isLoading, error } = useCoupons();

  const { updateData, isLoading: isUpdating } = useUpdateData({
    name: 'coupons',
    api: '/api/coupons'
  });

  const { deleteData, isLoading: isDeleting } = useDeleteData({
    name: 'coupons',
    api: '/api/coupons'
  });

  // Filter coupons based on search term and status
  const filteredCoupons = Array.isArray(data) ? data.filter(coupon => {
    if (!coupon) return false;
    
    const matchesSearch = coupon.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         coupon.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || coupon.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  }) : [];

  // Handler functions
  const handleEditCoupon = (coupon) => {
    setSelectedCoupon(coupon);
    setShowEditModal(true);
  };

  const handleDeleteCoupon = (coupon) => {

    setSelectedCoupon(coupon);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (selectedCoupon) {
      const couponId = selectedCoupon._id || selectedCoupon.id;

      if (!couponId) {
        console.error('No valid ID found for coupon:', selectedCoupon);
        setToast({
          show: true,
          type: 'error',
          message: 'Cannot delete coupon: Invalid ID'
        });
        return;
      }
      setDeletingCouponId(couponId);
      try {
        await deleteData(couponId);
        setShowDeleteModal(false);
        setSelectedCoupon(null);
        setToast({
          show: true,
          type: 'success',
          message: `Coupon "${selectedCoupon.code}" deleted successfully!`
        });
      } catch (error) {
        console.error('Delete failed:', error);
        setToast({
          show: true,
          type: 'error',
          message: 'Failed to delete coupon. Please try again.'
        });
      } finally {
        setDeletingCouponId(null);
      }
    }
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setSelectedCoupon(null);
  };

  const handleCloseDeleteModal = () => {
    if (!isDeleting) {
      setShowDeleteModal(false);
      setSelectedCoupon(null);
    }
  };

  // Calculate stats from filtered coupons
  const stats = {
    total: filteredCoupons.length || 0,
    active: filteredCoupons.filter(c => c && c.status === 'active').length || 0,
    expired: filteredCoupons.filter(c => c && c.status === 'expired').length || 0,
    totalUsage: filteredCoupons.reduce((sum, c) => sum + (c && c.used ? c.used : 0), 0)
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'expired':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'disabled':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <CheckCircle size={14} className="text-green-600" />;
      case 'expired':
        return <XCircle size={14} className="text-red-600" />;
      case 'disabled':
        return <Clock size={14} className="text-gray-600" />;
      default:
        return <Clock size={14} className="text-gray-600" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="mx-auto text-red-500 mb-4" size={48} />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error loading coupons</h3>
        <p className="text-gray-600">Please try refreshing the page</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with gradient background */}
      <div className="bg-gradient-to-r from-gray-800 via-gray-700 to-black rounded-2xl p-8 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20 backdrop-blur-sm"></div>
        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div>
              <h1 className="text-4xl font-bold mb-2">Coupon Management</h1>
              <p className="text-gray-200">Create, manage, and track your promotional coupons</p>
            </div>
            
            <button 
              onClick={() => setShowAddModal(true)}
              className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-6 py-3 rounded-xl transition-all duration-200 border border-white/20 hover:border-white/40"
            >
              <Plus size={20} />
              <span className="font-semibold">Add New Coupon</span>
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20"
            >
              <div className="flex items-center space-x-2">
                <Ticket className="text-white" size={20} />
                <span className="text-white/80 text-sm">Total Coupons</span>
              </div>
              <div className="text-2xl font-bold text-white mt-1">{stats.total}</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20"
            >
              <div className="flex items-center space-x-2">
                <CheckCircle className="text-green-400" size={20} />
                <span className="text-white/80 text-sm">Active</span>
              </div>
              <div className="text-2xl font-bold text-white mt-1">{stats.active}</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20"
            >
              <div className="flex items-center space-x-2">
                <XCircle className="text-red-400" size={20} />
                <span className="text-white/80 text-sm">Expired</span>
              </div>
              <div className="text-2xl font-bold text-white mt-1">{stats.expired}</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20"
            >
              <div className="flex items-center space-x-2">
                <TrendingUp className="text-blue-400" size={20} />
                <span className="text-white/80 text-sm">Total Usage</span>
              </div>
              <div className="text-2xl font-bold text-white mt-1">{stats.totalUsage}</div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search coupons by code or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-3 border border-gray-200/60 rounded-xl focus:ring-2 focus:ring-gray-500/20 focus:border-gray-500 w-full transition-all duration-200 bg-gray-50/50"
            />
          </div>
          
          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-3 border border-gray-200/60 rounded-xl focus:ring-2 focus:ring-gray-500/20 focus:border-gray-500 bg-gray-50/50 transition-all duration-200"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
            <option value="disabled">Disabled</option>
          </select>

          {/* View Mode Toggle */}
          <div className="flex items-center space-x-2 bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-all duration-200 ${
                viewMode === 'grid' 
                  ? 'bg-white text-gray-800 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Grid size={16} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all duration-200 ${
                viewMode === 'list' 
                  ? 'bg-white text-gray-800 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <List size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Coupons Grid/List */}
      <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
        {filteredCoupons.map((coupon, index) => (
          <motion.div
            key={coupon._id || coupon.id || `coupon-${index}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-gray-100 group"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-gradient-to-br from-gray-700 to-black rounded-xl text-white">
                  <Ticket size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{coupon.code}</h3>
                  <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(coupon.status)}`}>
                    {getStatusIcon(coupon.status)}
                    <span>{coupon.status?.toUpperCase() || 'UNKNOWN'}</span>
                  </span>
                </div>
              </div>
              
              <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <button 
                  onClick={() => handleEditCoupon(coupon)}
                  className="bg-gray-700 text-white p-2 rounded-lg hover:bg-gray-800 transition-colors"
                >
                  <Edit size={16} />
                </button>
                <button 
                  onClick={() => handleDeleteCoupon(coupon)}
                  disabled={deletingCouponId === (coupon._id || coupon.id)}
                  className="bg-red-600 text-white p-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {deletingCouponId === (coupon._id || coupon.id) ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Trash2 size={16} />
                  )}
                </button>
              </div>
            </div>
            
            <p className="text-gray-600 mb-4">{coupon.description}</p>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-sm text-gray-600 mb-1">Discount</p>
                <div className="flex items-center space-x-1">
                  <Percent className="text-green-600" size={16} />
                  <span className="font-bold text-green-600">
                    {coupon.type === 'percentage' ? `${coupon.discount}%` : `৳${coupon.discount}`}
                  </span>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-sm text-gray-600 mb-1">Min Amount</p>
                <span className="font-bold text-gray-900">৳{coupon.minAmount}</span>
              </div>
              
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-sm text-gray-600 mb-1">Usage</p>
                <div className="flex flex-col">
                  <span className="font-bold text-gray-900">{coupon.used || 0}/{coupon.usageLimit}</span>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                    <div 
                      className="bg-gray-700 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${Math.min((coupon.used || 0) / coupon.usageLimit * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-sm text-gray-600 mb-1">Valid Until</p>
                <div className="flex items-center space-x-1">
                  <Calendar className="text-gray-400" size={16} />
                  <span className="font-bold text-gray-900">{coupon.endDate}</span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* No Results */}
      {filteredCoupons.length === 0 && (
        <div className="text-center py-12">
          <Ticket className="mx-auto text-gray-400 mb-4" size={48} />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No coupons found</h3>
          <p className="text-gray-600">Try adjusting your search or create a new coupon</p>
        </div>
      )}

      {/* Add Coupon Modal */}
      <AddCouponModal 
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
      />

      {/* Edit Coupon Modal */}
      <EditCouponModal 
        isOpen={showEditModal}
        onClose={handleCloseEditModal}
        coupon={selectedCoupon}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog 
        isOpen={showDeleteModal}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
        couponCode={selectedCoupon?.code}
        isLoading={isDeleting}
      />

      {/* Toast Notification */}
      <Toast
        type={toast.type}
        message={toast.message}
        isVisible={toast.show}
        onClose={() => setToast({ ...toast, show: false })}
      />
    </div>
  );
};

export default AllCouponsClient;
