'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  FolderOpen, 
  Package, 
  Search,
  Grid,
  List,
  TrendingUp,
  AlertCircle,
  Image as ImageIcon,
  X
} from 'lucide-react';
import { useCategories } from '@/lib/hooks/useReduxData';
import { useUpdateData } from '../../../../../lib/hooks/useUpdateData';
import { useDeleteData } from '../../../../../lib/hooks/useDeleteData';
import AddCategoryModal from './categoryComponents/AddCategoryModal';
import EditCategoryModal from './categoryComponents/EditCategoryModal';
import DeleteConfirmationDialog from './categoryComponents/DeleteConfirmationDialog';
import Toast from '../allProducts/allProductsCompoment/Toast';
import Image from 'next/image';

const AllCategoryClient = () => {
  const [viewMode, setViewMode] = useState('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [deletingCategoryId, setDeletingCategoryId] = useState(null);
  const [toast, setToast] = useState({ show: false, type: 'success', message: '' });

  // 🚀 OPTIMIZED: Use Redux store for centralized data caching - NO duplicate API calls
  const { data, isLoading, error } = useCategories();

  const { updateData, isLoading: isUpdating } = useUpdateData({
    name: 'categories',
    api: '/api/categories'
  });

  const { deleteData, isLoading: isDeleting } = useDeleteData({
    name: 'categories',
    api: '/api/categories'
  });

  // Filter categories based on search
  const filteredCategories = Array.isArray(data) ? data.filter(category => {
    if (!category) return false;
    return category.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           category.description?.toLowerCase().includes(searchTerm.toLowerCase());
  }) : [];

  // Handler functions
  const handleEditCategory = (category) => {

    setSelectedCategory(category);
    setShowEditModal(true);
  };

  const handleDeleteCategory = (category) => {

    setSelectedCategory(category);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (selectedCategory) {
      const categoryId = selectedCategory._id || selectedCategory.id;
      
      if (!categoryId) {
        console.error('Category ID is missing for deletion:', selectedCategory);
        setToast({
          show: true,
          type: 'error',
          message: 'Category ID is missing. Cannot delete category.'
        });
        return;
      }
      
      setDeletingCategoryId(categoryId);
      try {
        await deleteData(categoryId);
        setShowDeleteModal(false);
        setSelectedCategory(null);
        setToast({
          show: true,
          type: 'success',
          message: `Category "${selectedCategory.name}" deleted successfully!`
        });
      } catch (error) {
        console.error('Delete failed:', error);
        setToast({
          show: true,
          type: 'error',
          message: 'Failed to delete category. Please try again.'
        });
      } finally {
        setDeletingCategoryId(null);
      }
    }
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setSelectedCategory(null);
  };

  const handleCloseDeleteModal = () => {
    if (!isDeleting) {
      setShowDeleteModal(false);
      setSelectedCategory(null);
    }
  };

  // Statistics
  const stats = {
    totalCategories: filteredCategories.length,
    activeCategories: filteredCategories.filter(cat => cat && cat.status !== 'inactive').length,
    inactiveCategories: filteredCategories.filter(cat => cat && cat.status === 'inactive').length
  };

  // Handle loading and error states
  if (isLoading) {
    return (
      <div className="min-h-screen  flex items-center justify-center">
        <div className="bg-white rounded-xl p-8 shadow-xl">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-600 mx-auto"></div>
          <p className="text-gray-600 mt-4 text-center">Loading categories...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-700 to-black flex items-center justify-center">
        <div className="bg-white rounded-xl p-8 shadow-xl text-center">
          <AlertCircle className="text-red-500 mx-auto mb-4" size={48} />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error loading categories</h2>
          <p className="text-gray-600">{error.message || 'Something went wrong'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Categories Management</h1>
          <p className="text-gray-600">Manage your product categories</p>
        </div>
        
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 bg-gray-800 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors shadow-lg"
        >
          <Plus size={20} />
          <span>Add Category</span>
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center space-x-2">
            <FolderOpen className="text-blue-600" size={20} />
            <span className="text-sm text-gray-600">Total Categories</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalCategories}</p>
        </div>
        
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center space-x-2">
            <TrendingUp className="text-green-600" size={20} />
            <span className="text-sm text-gray-600">Active Categories</span>
          </div>
          <p className="text-2xl font-bold text-green-600 mt-1">{stats.activeCategories}</p>
        </div>
        
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center space-x-2">
            <AlertCircle className="text-red-600" size={20} />
            <span className="text-sm text-gray-600">Inactive Categories</span>
          </div>
          <p className="text-2xl font-bold text-red-600 mt-1">{stats.inactiveCategories}</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full lg:w-80"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-colors ${
                viewMode === 'grid' 
                  ? 'bg-blue-100 text-blue-600' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Grid size={16} />
              <span>Grid</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-colors ${
                viewMode === 'list' 
                  ? 'bg-blue-100 text-blue-600' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <List size={16} />
              <span>List</span>
            </button>
          </div>
        </div>
      </div>

      {/* Categories Display */}
      {filteredCategories.length > 0 ? (
        <div className="bg-white rounded-xl p-6 shadow-sm">
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredCategories.map((category, index) => (
                <CategoryCard 
                  key={category._id || category.id || `category-${index}`} 
                  category={category}
                  onEdit={handleEditCategory}
                  onDelete={handleDeleteCategory}
                  isDeleting={deletingCategoryId === (category._id || category.id)}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredCategories.map((category, index) => (
                <CategoryListItem 
                  key={category._id || category.id || `category-list-${index}`} 
                  category={category}
                  onEdit={handleEditCategory}
                  onDelete={handleDeleteCategory}
                  isDeleting={deletingCategoryId === (category._id || category.id)}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl p-12 shadow-sm text-center">
          <FolderOpen className="mx-auto text-gray-400 mb-4" size={48} />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No categories found</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm ? 
              "No categories match your search. Try different keywords." :
              "You haven't created any categories yet. Start by adding your first category."
            }
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={20} />
            <span>Add Category</span>
          </button>
        </div>
      )}

      {/* Modals */}
      <AddCategoryModal 
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
      />

      <EditCategoryModal 
        isOpen={showEditModal}
        onClose={handleCloseEditModal}
        category={selectedCategory}
      />

      <DeleteConfirmationDialog 
        isOpen={showDeleteModal}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
        categoryName={selectedCategory?.name}
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

// Clean Category Card Component
const CategoryCard = ({ category, onEdit, onDelete, isDeleting }) => (
  <div className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
    <div className="aspect-square bg-white rounded-lg mb-3 overflow-hidden">
      {category.image ? (
        <Image
          src={category.image}
          alt={category.name}
          width={200}
          height={200}
          className="w-full h-full object-cover"
          unoptimized={true}
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.nextElementSibling.style.display = 'flex';
          }}
        />
      ) : null}
      <div className="w-full h-full flex items-center justify-center bg-gray-100" style={{ display: category.image ? 'none' : 'flex' }}>
        <ImageIcon className="text-gray-400" size={32} />
      </div>
    </div>
    
    <h3 className="font-medium text-gray-900 mb-1">{category.name}</h3>
    {category.description && (
      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{category.description}</p>
    )}
    
    <div className="flex items-center justify-between">
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        category.status === 'active' 
          ? 'bg-green-100 text-green-800' 
          : 'bg-red-100 text-red-800'
      }`}>
        {category.status || 'active'}
      </span>
      
      <div className="flex items-center space-x-2">
        <button
          onClick={() => onEdit(category)}
          className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
        >
          <Edit3 size={16} />
        </button>
        <button
          onClick={() => onDelete(category)}
          disabled={isDeleting}
          className="p-1 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
        >
          <Trash2 size={16} className={isDeleting ? 'animate-spin' : ''} />
        </button>
      </div>
    </div>
  </div>
);

// Clean Category List Item Component
const CategoryListItem = ({ category, onEdit, onDelete, isDeleting }) => (
  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
    <div className="flex items-center space-x-4">
      <div className="w-12 h-12 bg-white rounded-lg overflow-hidden">
        {category.image ? (
          <Image
            src={category.image}
            alt={category.name}
            width={48}
            height={48}
            className="w-full h-full object-cover"
            unoptimized={true}
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextElementSibling.style.display = 'flex';
            }}
          />
        ) : null}
        <div className="w-full h-full flex items-center justify-center bg-gray-100" style={{ display: category.image ? 'none' : 'flex' }}>
          <ImageIcon className="text-gray-400" size={20} />
        </div>
      </div>
      
      <div>
        <h3 className="font-medium text-gray-900">{category.name}</h3>
        {category.description && (
          <p className="text-sm text-gray-600">{category.description}</p>
        )}
      </div>
    </div>
    
    <div className="flex items-center space-x-4">
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        category.status === 'active' 
          ? 'bg-green-100 text-green-800' 
          : 'bg-red-100 text-red-800'
      }`}>
        {category.status || 'active'}
      </span>
      
      <div className="flex items-center space-x-2">
        <button
          onClick={() => onEdit(category)}
          className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
        >
          <Edit3 size={16} />
        </button>
        <button
          onClick={() => onDelete(category)}
          disabled={isDeleting}
          className="p-2 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
        >
          <Trash2 size={16} className={isDeleting ? 'animate-spin' : ''} />
        </button>
      </div>
    </div>
  </div>
);

export default AllCategoryClient;
