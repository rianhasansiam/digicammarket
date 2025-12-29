'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Image as ImageIcon, 
  Search,
  Grid,
  List,
  Eye,
  EyeOff,
  GripVertical,
  ExternalLink
} from 'lucide-react';
import { useBanners } from '@/lib/hooks/useReduxData';
import { useUpdateData } from '@/lib/hooks/useUpdateData';
import { useDeleteData } from '@/lib/hooks/useDeleteData';
import AddBannerModal from './bannerComponents/AddBannerModal';
import EditBannerModal from './bannerComponents/EditBannerModal';
import DeleteConfirmationDialog from '../allCategory/categoryComponents/DeleteConfirmationDialog';
import Toast from '../allProducts/allProductsCompoment/Toast';
import Image from 'next/image';

const HeroBannersClient = () => {
  const [viewMode, setViewMode] = useState('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedBanner, setSelectedBanner] = useState(null);
  const [toast, setToast] = useState({ show: false, type: 'success', message: '' });

  // Use Redux store for centralized data caching
  const { data, isLoading, error, refetch } = useBanners();

  const { updateData, isLoading: isUpdating } = useUpdateData({
    name: 'banners',
    api: '/api/banners'
  });

  const { deleteData, isLoading: isDeleting } = useDeleteData({
    name: 'banners',
    api: '/api/banners'
  });

  // Filter banners based on search
  const filteredBanners = Array.isArray(data) ? data.filter(banner => {
    if (!banner) return false;
    return banner.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           banner.subtitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           banner.description?.toLowerCase().includes(searchTerm.toLowerCase());
  }) : [];

  // Handler functions
  const handleEditBanner = (banner) => {
    setSelectedBanner(banner);
    setShowEditModal(true);
  };

  const handleDeleteBanner = (banner) => {
    setSelectedBanner(banner);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (selectedBanner) {
      const bannerId = selectedBanner._id || selectedBanner.id;
      
      if (!bannerId) {
        setToast({
          show: true,
          type: 'error',
          message: 'Banner ID is missing. Cannot delete banner.'
        });
        return;
      }
      
      try {
        await deleteData(bannerId);
        setShowDeleteModal(false);
        setSelectedBanner(null);
        setToast({
          show: true,
          type: 'success',
          message: `Banner deleted successfully!`
        });
        refetch();
      } catch (error) {
        console.error('Delete failed:', error);
        setToast({
          show: true,
          type: 'error',
          message: 'Failed to delete banner. Please try again.'
        });
      }
    }
  };

  const handleToggleActive = async (banner) => {
    const bannerId = banner._id || banner.id;
    try {
      await updateData({ 
        _id: bannerId, 
        isActive: !banner.isActive 
      });
      setToast({
        show: true,
        type: 'success',
        message: `Banner ${!banner.isActive ? 'activated' : 'deactivated'} successfully!`
      });
      refetch();
    } catch (error) {
      console.error('Toggle failed:', error);
      setToast({
        show: true,
        type: 'error',
        message: 'Failed to update banner status.'
      });
    }
  };

  const handleSuccess = () => {
    refetch();
  };

  // Stats
  const totalBanners = Array.isArray(data) ? data.length : 0;
  const activeBanners = Array.isArray(data) ? data.filter(b => b.isActive).length : 0;
  const inactiveBanners = totalBanners - activeBanners;
  const mainBanners = Array.isArray(data) ? data.filter(b => b.bannerType !== 'side').length : 0;
  const sideBannersCount = Array.isArray(data) ? data.filter(b => b.bannerType === 'side').length : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        Error loading banners: {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Layout Info Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-xl p-4"
      >
        <div className="flex items-start gap-3">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <ImageIcon className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h4 className="font-semibold text-gray-800 mb-1">Hero Section Layout</h4>
            <p className="text-sm text-gray-600 mb-2">
              Your hero section displays banners in a modern layout with a main carousel (70% width) and side banners (30% width).
            </p>
            <div className="flex flex-wrap gap-4 text-sm">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
                <strong>Main Carousel:</strong> Large rotating banners ({mainBanners} banners)
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-3 h-3 bg-purple-500 rounded-full"></span>
                <strong>Side Banners:</strong> Two stacked cards on right ({sideBannersCount} banners)
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-5 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Total</p>
              <h3 className="text-2xl font-bold">{totalBanners}</h3>
            </div>
            <ImageIcon className="w-8 h-8 text-blue-200" />
          </div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-5 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Active</p>
              <h3 className="text-2xl font-bold">{activeBanners}</h3>
            </div>
            <Eye className="w-8 h-8 text-green-200" />
          </div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-xl p-5 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-indigo-100 text-sm">Main Carousel</p>
              <h3 className="text-2xl font-bold">{mainBanners}</h3>
            </div>
            <Grid className="w-8 h-8 text-indigo-200" />
          </div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-5 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Side Banners</p>
              <h3 className="text-2xl font-bold">{sideBannersCount}</h3>
            </div>
            <List className="w-8 h-8 text-purple-200" />
          </div>
        </motion.div>
      </div>

      {/* Header with Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search banners..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* View Mode & Add Button */}
          <div className="flex items-center gap-3">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Banner
            </button>
          </div>
        </div>
      </div>

      {/* Banners Grid/List */}
      {filteredBanners.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <ImageIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Banners Found</h3>
          <p className="text-gray-500 mb-4">
            {searchTerm ? 'No banners match your search criteria.' : 'Get started by adding your first hero banner.'}
          </p>
          {!searchTerm && (
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Your First Banner
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredBanners.map((banner, index) => (
              <motion.div
                key={banner._id || banner.id || index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden group"
              >
                {/* Banner Image */}
                <div className="relative aspect-[16/9] bg-gray-100">
                  {banner.image ? (
                    <Image
                      src={banner.image}
                      alt={banner.title || 'Banner'}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <ImageIcon className="w-12 h-12 text-gray-300" />
                    </div>
                  )}
                  
                  {/* Status Badge */}
                  <div className={`absolute top-3 left-3 px-2 py-1 rounded-full text-xs font-medium ${
                    banner.isActive 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {banner.isActive ? 'Active' : 'Inactive'}
                  </div>

                  {/* Banner Type Badge */}
                  <div className={`absolute top-3 left-20 px-2 py-1 rounded-full text-xs font-medium ${
                    banner.bannerType === 'side' 
                      ? 'bg-purple-100 text-purple-700' 
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {banner.bannerType === 'side' ? 'Side' : 'Main'}
                  </div>

                  {/* Order Badge */}
                  <div className="absolute top-3 right-3 bg-black/50 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                    <GripVertical className="w-3 h-3" />
                    #{banner.order || index + 1}
                  </div>
                </div>

                {/* Banner Info */}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 truncate">
                    {banner.title || 'Untitled Banner'}
                  </h3>
                  {banner.subtitle && (
                    <p className="text-sm text-gray-500 truncate">{banner.subtitle}</p>
                  )}
                  {banner.link && (
                    <a 
                      href={banner.link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-blue-500 hover:underline flex items-center gap-1 mt-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      {banner.link}
                    </a>
                  )}
                </div>

                {/* Actions */}
                <div className="px-4 pb-4 flex items-center gap-2">
                  <button
                    onClick={() => handleToggleActive(banner)}
                    disabled={isUpdating}
                    className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      banner.isActive
                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    {banner.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    {banner.isActive ? 'Hide' : 'Show'}
                  </button>
                  <button
                    onClick={() => handleEditBanner(banner)}
                    className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteBanner(banner)}
                    className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Banner</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Link</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredBanners.map((banner, index) => (
                <tr key={banner._id || banner.id || index} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="relative w-24 h-14 bg-gray-100 rounded-lg overflow-hidden">
                      {banner.image ? (
                        <Image
                          src={banner.image}
                          alt={banner.title || 'Banner'}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <ImageIcon className="w-6 h-6 text-gray-300" />
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-gray-900">{banner.title || 'Untitled'}</p>
                      {banner.subtitle && <p className="text-sm text-gray-500">{banner.subtitle}</p>}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {banner.link || '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    #{banner.order || index + 1}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                      banner.isActive 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {banner.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleToggleActive(banner)}
                        disabled={isUpdating}
                        className={`p-2 rounded-lg transition-colors ${
                          banner.isActive
                            ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                      >
                        {banner.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => handleEditBanner(banner)}
                        className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteBanner(banner)}
                        className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
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
      <AddBannerModal 
        isOpen={showAddModal} 
        onClose={() => setShowAddModal(false)}
        onSuccess={handleSuccess}
      />
      
      <EditBannerModal 
        isOpen={showEditModal} 
        onClose={() => {
          setShowEditModal(false);
          setSelectedBanner(null);
        }}
        banner={selectedBanner}
        onSuccess={handleSuccess}
      />
      
      <DeleteConfirmationDialog
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedBanner(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Banner"
        message={`Are you sure you want to delete this banner? This action cannot be undone.`}
        isLoading={isDeleting}
      />

      {/* Toast */}
      <Toast
        show={toast.show}
        type={toast.type}
        message={toast.message}
        onClose={() => setToast({ ...toast, show: false })}
      />
    </div>
  );
};

export default HeroBannersClient;
