'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Zap, 
  Calendar, 
  Percent, 
  TrendingUp,
  Filter,
  Grid,
  List,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Package,
  Tag,
  Eye,
  EyeOff,
  Flame
} from 'lucide-react';
import { useSales, useProducts, useCategories } from '@/lib/hooks/useReduxData';
import { useAddData } from '../../../../../lib/hooks/useAddData';
import { useUpdateData } from '../../../../../lib/hooks/useUpdateData';
import { useDeleteData } from '../../../../../lib/hooks/useDeleteData';
import AddSaleModal from './AddSaleModal';
import EditSaleModal from './EditSaleModal';
import DeleteConfirmationDialog from './DeleteConfirmationDialog';
import Toast from './Toast';

const AllSalesClient = () => {
  const [viewMode, setViewMode] = useState('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  const [deletingSaleId, setDeletingSaleId] = useState(null);
  const [toast, setToast] = useState({ show: false, type: 'success', message: '' });

  // Use Redux store for centralized data caching
  const { data, isLoading, error, refetch } = useSales();
  const { data: products = [] } = useProducts();
  const { data: categories = [] } = useCategories();

  const { addData, isLoading: isAdding } = useAddData({
    name: 'sales',
    api: '/api/sales',
    onSuccess: () => {
      // Refetch Redux sales cache after successful add
      refetch();
    }
  });

  const { updateData, isLoading: isUpdating } = useUpdateData({
    name: 'sales',
    api: '/api/sales',
    onSuccess: () => {
      // Refetch Redux sales cache after successful update
      refetch();
    }
  });

  const { deleteData, isLoading: isDeleting } = useDeleteData({
    name: 'sales',
    api: '/api/sales',
    onSuccess: () => {
      // Refetch Redux sales cache after successful delete
      refetch();
    }
  });

  // Filter sales based on search term, status, and type
  const filteredSales = Array.isArray(data) ? data.filter(sale => {
    if (!sale) return false;
    
    const matchesSearch = sale.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sale.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || sale.status === filterStatus;
    const matchesType = filterType === 'all' || sale.saleType === filterType;
    
    return matchesSearch && matchesStatus && matchesType;
  }) : [];

  // Handler functions
  const handleEditSale = (sale) => {
    setSelectedSale(sale);
    setShowEditModal(true);
  };

  const handleDeleteSale = (sale) => {
    setSelectedSale(sale);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (selectedSale) {
      const saleId = selectedSale._id || selectedSale.id;

      if (!saleId) {
        setToast({
          show: true,
          type: 'error',
          message: 'Cannot delete sale: Invalid ID'
        });
        return;
      }
      setDeletingSaleId(saleId);
      try {
        await deleteData(saleId);
        setShowDeleteModal(false);
        setSelectedSale(null);
        setToast({
          show: true,
          type: 'success',
          message: `Sale "${selectedSale.title}" deleted successfully!`
        });
      } catch (error) {
        console.error('Delete failed:', error);
        setToast({
          show: true,
          type: 'error',
          message: 'Failed to delete sale. Please try again.'
        });
      } finally {
        setDeletingSaleId(null);
      }
    }
  };

  const handleToggleStatus = async (sale) => {
    const newStatus = sale.status === 'active' ? 'paused' : 'active';
    try {
      await updateData(sale._id || sale.id, { status: newStatus });
      setToast({
        show: true,
        type: 'success',
        message: `Sale ${newStatus === 'active' ? 'activated' : 'paused'} successfully!`
      });
    } catch (error) {
      setToast({
        show: true,
        type: 'error',
        message: 'Failed to update sale status.'
      });
    }
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setSelectedSale(null);
  };

  const handleCloseDeleteModal = () => {
    if (!isDeleting) {
      setShowDeleteModal(false);
      setSelectedSale(null);
    }
  };

  // Calculate stats
  const stats = {
    total: filteredSales.length || 0,
    active: filteredSales.filter(s => s?.status === 'active').length || 0,
    scheduled: filteredSales.filter(s => s?.status === 'scheduled').length || 0,
    ended: filteredSales.filter(s => s?.status === 'ended').length || 0,
    flash: filteredSales.filter(s => s?.saleType === 'flash').length || 0,
    bundle: filteredSales.filter(s => s?.saleType === 'bundle').length || 0
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'ended':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <CheckCircle size={14} className="text-green-600" />;
      case 'scheduled':
        return <Clock size={14} className="text-blue-600" />;
      case 'ended':
        return <XCircle size={14} className="text-gray-600" />;
      case 'paused':
        return <EyeOff size={14} className="text-yellow-600" />;
      default:
        return <Clock size={14} className="text-gray-600" />;
    }
  };

  const getSaleTypeIcon = (type) => {
    switch (type) {
      case 'flash':
        return <Zap size={16} className="text-yellow-500" />;
      case 'bundle':
        return <Package size={16} className="text-purple-500" />;
      case 'seasonal':
        return <Calendar size={16} className="text-green-500" />;
      case 'clearance':
        return <Tag size={16} className="text-red-500" />;
      default:
        return <Percent size={16} className="text-blue-500" />;
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeRemaining = (endDate) => {
    if (!endDate) return null;
    const now = new Date();
    const end = new Date(endDate);
    const diff = end - now;
    
    if (diff <= 0) return 'Ended';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h remaining`;
    return `${hours}h remaining`;
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
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error loading sales</h3>
        <p className="text-gray-600">Please try refreshing the page</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with gradient background */}
      <div className="bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 rounded-2xl p-8 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20 backdrop-blur-sm"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32"></div>
        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <Flame className="w-10 h-10" />
                <h1 className="text-4xl font-bold">Sales & Promotions</h1>
              </div>
              <p className="text-white/80">Create flash sales, bundle deals, and seasonal promotions</p>
            </div>
            
            <button 
              onClick={() => setShowAddModal(true)}
              className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-6 py-3 rounded-xl transition-all duration-200 border border-white/20 hover:border-white/40"
            >
              <Plus size={20} />
              <span className="font-semibold">Create New Sale</span>
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mt-8">
            {[
              { label: 'Total Sales', value: stats.total, icon: TrendingUp, color: 'from-white/20 to-white/10' },
              { label: 'Active', value: stats.active, icon: CheckCircle, color: 'from-green-400/30 to-green-500/20' },
              { label: 'Scheduled', value: stats.scheduled, icon: Clock, color: 'from-blue-400/30 to-blue-500/20' },
              { label: 'Ended', value: stats.ended, icon: XCircle, color: 'from-gray-400/30 to-gray-500/20' },
              { label: 'Flash Sales', value: stats.flash, icon: Zap, color: 'from-yellow-400/30 to-yellow-500/20' },
              { label: 'Bundles', value: stats.bundle, icon: Package, color: 'from-purple-400/30 to-purple-500/20' },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`bg-gradient-to-br ${stat.color} backdrop-blur-sm rounded-xl p-4 border border-white/20`}
              >
                <div className="flex items-center space-x-2 mb-2">
                  <stat.icon size={18} className="text-white/80" />
                  <span className="text-white/80 text-sm">{stat.label}</span>
                </div>
                <p className="text-2xl font-bold">{stat.value}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search sales..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter size={18} className="text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="scheduled">Scheduled</option>
                <option value="paused">Paused</option>
                <option value="ended">Ended</option>
              </select>
            </div>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="flash">Flash Sale</option>
              <option value="bundle">Bundle Deal</option>
              <option value="seasonal">Seasonal</option>
              <option value="clearance">Clearance</option>
            </select>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
              >
                <Grid size={18} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
              >
                <List size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sales Grid/List */}
      {filteredSales.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <Zap className="mx-auto text-gray-300 mb-4" size={64} />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No sales found</h3>
          <p className="text-gray-500 mb-6">Create your first sale to attract more customers!</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center space-x-2 bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors"
          >
            <Plus size={20} />
            <span>Create Sale</span>
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredSales.map((sale, index) => (
              <motion.div
                key={sale._id || sale.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Sale Header */}
                <div 
                  className="p-4 text-white relative"
                  style={{ backgroundColor: sale.backgroundColor || '#1f2937' }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      {getSaleTypeIcon(sale.saleType)}
                      <span className="text-xs font-medium uppercase tracking-wider opacity-80">
                        {sale.saleType} Sale
                      </span>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getStatusColor(sale.status)}`}>
                      {getStatusIcon(sale.status)}
                      <span>{sale.status}</span>
                    </span>
                  </div>
                  <h3 className="text-xl font-bold mt-3">{sale.title}</h3>
                  {sale.subtitle && (
                    <p className="text-sm opacity-80 mt-1">{sale.subtitle}</p>
                  )}
                  {sale.discountValue > 0 && (
                    <div className="mt-3 inline-flex items-center space-x-1 bg-white/20 px-3 py-1 rounded-full">
                      <Percent size={14} />
                      <span className="font-bold">
                        {sale.discountType === 'percentage' ? `${sale.discountValue}% OFF` : `৳${sale.discountValue} OFF`}
                      </span>
                    </div>
                  )}
                </div>

                {/* Sale Body */}
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 flex items-center space-x-1">
                      <Calendar size={14} />
                      <span>Start</span>
                    </span>
                    <span className="font-medium text-gray-700">{formatDate(sale.startDate)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 flex items-center space-x-1">
                      <Clock size={14} />
                      <span>End</span>
                    </span>
                    <span className="font-medium text-gray-700">{formatDate(sale.endDate)}</span>
                  </div>
                  
                  {sale.status === 'active' && (
                    <div className="bg-orange-50 text-orange-700 px-3 py-2 rounded-lg text-sm font-medium flex items-center space-x-2">
                      <Flame size={16} />
                      <span>{getTimeRemaining(sale.endDate)}</span>
                    </div>
                  )}

                  {sale.productIds?.length > 0 && (
                    <div className="text-sm text-gray-500">
                      <Package size={14} className="inline mr-1" />
                      {sale.productIds.length} products included
                    </div>
                  )}
                </div>

                {/* Sale Actions */}
                <div className="border-t border-gray-100 p-3 flex items-center justify-between">
                  <button
                    onClick={() => handleToggleStatus(sale)}
                    className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      sale.status === 'active' 
                        ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' 
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    {sale.status === 'active' ? <EyeOff size={14} /> : <Eye size={14} />}
                    <span>{sale.status === 'active' ? 'Pause' : 'Activate'}</span>
                  </button>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEditSale(sale)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleDeleteSale(sale)}
                      className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-600"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        /* List View */
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Sale</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Type</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Discount</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Duration</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredSales.map((sale) => (
                <tr key={sale._id || sale.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: sale.backgroundColor || '#1f2937' }}
                      >
                        {getSaleTypeIcon(sale.saleType)}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{sale.title}</div>
                        <div className="text-sm text-gray-500">{sale.subtitle}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="capitalize text-gray-700">{sale.saleType}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-medium text-orange-600">
                      {sale.discountType === 'percentage' ? `${sale.discountValue}%` : `৳${sale.discountValue}`}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <div>{formatDate(sale.startDate)}</div>
                    <div className="text-gray-400">to</div>
                    <div>{formatDate(sale.endDate)}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(sale.status)}`}>
                      {getStatusIcon(sale.status)}
                      <span className="capitalize">{sale.status}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => handleToggleStatus(sale)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title={sale.status === 'active' ? 'Pause' : 'Activate'}
                      >
                        {sale.status === 'active' ? <EyeOff size={18} className="text-yellow-600" /> : <Eye size={18} className="text-green-600" />}
                      </button>
                      <button
                        onClick={() => handleEditSale(sale)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <Edit size={18} className="text-gray-600" />
                      </button>
                      <button
                        onClick={() => handleDeleteSale(sale)}
                        className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={18} className="text-red-600" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modals */}
      <AddSaleModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => {
          setShowAddModal(false);
          setToast({ show: true, type: 'success', message: 'Sale created successfully!' });
          refetch();
        }}
        products={products}
        categories={categories}
      />

      <EditSaleModal
        isOpen={showEditModal}
        onClose={handleCloseEditModal}
        sale={selectedSale}
        onSuccess={() => {
          handleCloseEditModal();
          setToast({ show: true, type: 'success', message: 'Sale updated successfully!' });
          refetch();
        }}
        products={products}
        categories={categories}
      />

      <DeleteConfirmationDialog
        isOpen={showDeleteModal}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
        title="Delete Sale"
        message={`Are you sure you want to delete "${selectedSale?.title}"? This action cannot be undone.`}
        isLoading={isDeleting}
      />

      {/* Toast */}
      <AnimatePresence>
        {toast.show && (
          <Toast
            type={toast.type}
            message={toast.message}
            onClose={() => setToast({ ...toast, show: false })}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default AllSalesClient;
