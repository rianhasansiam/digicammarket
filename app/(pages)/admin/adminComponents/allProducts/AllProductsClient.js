'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { 
  Plus, 
  Search, 
  Package,
  Grid,
  List,
  AlertCircle,
  MessageSquare
} from 'lucide-react';
import ProductCard from './allProductsCompoment/ProductCard';
import ProductListItem from './allProductsCompoment/ProductListItem';
import AddProductModal from './allProductsCompoment/AddProductModal';
import EditProductModal from './allProductsCompoment/EditProductModal';
import DeleteConfirmationDialog from './allProductsCompoment/DeleteConfirmationDialog';
// import AddReviewModal from './allProductsCompoment/AddReviewModal';
import Toast from './allProductsCompoment/Toast';
import { useProducts, useCategories } from '@/lib/hooks/useReduxData';
import { useUpdateData } from '../../../../../lib/hooks/useUpdateData';
import { useDeleteData } from '../../../../../lib/hooks/useDeleteData';

const AllProductsClient = () => {
  const [viewMode, setViewMode] = useState('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  // const [showAddReviewModal, setShowAddReviewModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  // const [selectedProductForReview, setSelectedProductForReview] = useState(null);
  const [deletingProductId, setDeletingProductId] = useState(null);
  const [toast, setToast] = useState({ show: false, type: 'success', message: '' });

  // 🚀 OPTIMIZED: Use Redux store for centralized data caching - NO duplicate API calls
  const { data, isLoading, error } = useProducts();
  const { data: categoriesData, isLoading: categoriesLoading, error: categoriesError } = useCategories();

  // Initialize update and delete hooks
  const { updateData, isLoading: isUpdating } = useUpdateData({
    name: 'products',
    api: '/api/products'
  });

  const { deleteData, isLoading: isDeleting } = useDeleteData({
    name: 'products',
    api: '/api/products'
  });

  // Memoized computed values
  const { products, categories, stats } = useMemo(() => {
    const allProducts = Array.isArray(data) ? data : [];
    const allCategories = Array.isArray(categoriesData) ? categoriesData : [];
    
    const productStats = {
      total: allProducts.length,
      totalValue: allProducts.reduce((sum, product) => sum + (product.price || 0), 0),
      outOfStock: allProducts.filter(product => (product.stock || 0) === 0).length
    };
    
    return {
      products: allProducts,
      categories: allCategories,
      stats: productStats
    };
  }, [data, categoriesData]);

  // Memoized filtered and sorted products
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.category?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = filterCategory === 'all' || product.category === filterCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, filterCategory]);

  // Memoized handler functions
  const handleEditProduct = useCallback((product) => {
    setSelectedProduct(product);
    setShowEditModal(true);
  }, []);

  const handleDeleteProduct = useCallback((product) => {
    setSelectedProduct(product);
    setShowDeleteModal(true);
  }, []);

  // const handleAddReview = useCallback((product) => {
  //   setSelectedProductForReview(product);
  //   setShowAddReviewModal(true);
  // }, []);

  const handleConfirmDelete = async () => {
    if (selectedProduct) {
      setDeletingProductId(selectedProduct._id);
      try {
        await deleteData(selectedProduct._id);
        setShowDeleteModal(false);
        setSelectedProduct(null);
        setToast({
          show: true,
          type: 'success',
          message: `Product "${selectedProduct.name}" deleted successfully!`
        });
      } catch (error) {
        console.error('Delete failed:', error);
        setToast({
          show: true,
          type: 'error',
          message: 'Failed to delete product. Please try again.'
        });
      } finally {
        setDeletingProductId(null);
      }
    }
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setSelectedProduct(null);
  };

  const handleCloseDeleteModal = () => {
    if (!isDeleting) {  // Prevent closing during delete operation
      setShowDeleteModal(false);
      setSelectedProduct(null);
    }
  };

  // const handleCloseAddReviewModal = () => {
  //   setShowAddReviewModal(false);
  //   setSelectedProductForReview(null);
  // };

  // const handleSubmitReview = async (reviewData) => {
  //   try {
  //     const { productId, review } = reviewData;
      
  //     console.log('Review data received:', reviewData);
  //     console.log('Product ID:', productId);
      
  //     // Validate productId
  //     if (!productId) {
  //       throw new Error('Product ID is required');
  //     }
      
  //     // Find the product to update
  //     const productToUpdate = data?.find(product => product._id === productId);
  //     if (!productToUpdate) {
  //       throw new Error(`Product with ID ${productId} not found`);
  //     }

  //     console.log('Product to update:', productToUpdate);

  //     // Add the new review to the product's reviews array
  //     const updatedProduct = {
  //       ...productToUpdate,
  //       reviews: [...(productToUpdate.reviews || []), review]
  //     };

  //     console.log('Updated product:', updatedProduct);

  //     // Update the product using the updateData hook with correct format
  //     await updateData({ id: productId, data: updatedProduct });
      
  //     setToast({
  //       show: true,
  //       type: 'success',
  //       message: 'Review added successfully!'
  //     });
  //   } catch (error) {
  //     console.error('Error submitting review:', error);
  //     setToast({
  //       show: true,
  //       type: 'error',
  //       message: `Failed to add review: ${error.message}`
  //     });
  //     throw error;
  //   }
  // };

  // Handle loading and error states
  if (isLoading || categoriesLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || categoriesError) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-red-500">
        <AlertCircle size={48} />
        <h2 className="text-xl font-semibold mt-4">Error loading data</h2>
        <p>{error?.message || categoriesError?.message || 'Something went wrong'}</p>
      </div>
    );
  }

  // Use memoized categories with proper structure for dropdown
  const categoryOptions = [
    { _id: 'all', name: 'all' },
    ...categories.map(cat => ({
      _id: cat._id,
      name: cat.name,
      status: cat.status,
      productCount: cat.productCount
    }))
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Products Management</h1>
          <p className="text-gray-600">Manage your product inventory and listings</p>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* <button 
            onClick={() => setShowAddReviewModal(true)}
            className="flex items-center space-x-2 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
          >
            <MessageSquare size={16} />
            <span>Add Review</span>
          </button> */}
          
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
          >
            <Plus size={16} />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center space-x-2">
            <Package className="text-gray-700" size={20} />
            <span className="text-sm text-gray-600">Total Products</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
        </div>
        
       

      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent w-full lg:w-64"
              />
            </div>
            
            {/* Category Filter */}
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
            >
              {categoryOptions.map((category, index) => {
                if (category.name === 'all') {
                  return (
                    <option key="all" value="all">
                      All Categories
                    </option>
                  );
                }
                return (
                  <option key={category._id || `category-${index}`} value={category.name}>
                    {category.name} ({category.productCount || 0} products)
                  </option>
                );
              })}
            </select>
          </div>
          
          {/* View Mode Toggle */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'grid' ? 'bg-gray-800 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Grid size={16} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'list' ? 'bg-gray-800 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <List size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Products Grid/List */}
      <div className={`${
        viewMode === 'grid' 
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
          : 'space-y-4'
      }`}>
        {filteredProducts?.map(product => (
          <div key={product._id || product.id}>
            {viewMode === 'grid' ? (
              <ProductCard 
                product={product} 
                onEdit={handleEditProduct}
                onDelete={handleDeleteProduct}
                // onAddReview={handleAddReview}
                isDeleting={deletingProductId === product._id}
              />
            ) : (
              <ProductListItem 
                product={product}
                onEdit={handleEditProduct}
                onDelete={handleDeleteProduct}
                // onAddReview={handleAddReview}
                isDeleting={deletingProductId === product._id}
              />
            )}
          </div>
        ))}
      </div>

      {/* No Results */}
      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <Package className="mx-auto text-gray-400 mb-4" size={48} />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
          <p className="text-gray-600">Try adjusting your search or filter criteria</p>
        </div>
      )}

      {/* Add Product Modal */}
      <AddProductModal 
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        categories={categories}
      />

      {/* Edit Product Modal */}
      <EditProductModal 
        isOpen={showEditModal}
        onClose={handleCloseEditModal}
        product={selectedProduct}
        categories={categories}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog 
        isOpen={showDeleteModal}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
        productName={selectedProduct?.name}
        isLoading={isDeleting}
      />

      {/* Add Review Modal */}
      {/* <AddReviewModal 
        isOpen={showAddReviewModal}
        onClose={handleCloseAddReviewModal}
        products={data}
        onSubmitReview={handleSubmitReview}
      /> */}

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

export default AllProductsClient;