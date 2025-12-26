'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search,
  Star, 
  MessageSquare,
  Calendar,
  User,
  Trash2,
  Plus,
  X,
  Check,
  XCircle,
  Clock
} from 'lucide-react';
import AddReviewModal from './AddReviewModal';
import { useReviews } from '@/lib/hooks/useReduxData';
import axios from 'axios';
import Image from 'next/image';

const AllReviewsClient = ({reviewsData}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRating, setFilterRating] = useState('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [toast, setToast] = useState({ show: false, type: 'success', message: '' });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);
  const [deletingReviewId, setDeletingReviewId] = useState(null);
  const [approvingReviewId, setApprovingReviewId] = useState(null);
  const [rejectingReviewId, setRejectingReviewId] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  
  // 🚀 OPTIMIZED: Use Redux store for centralized data caching - NO duplicate API calls
  const { data: liveReviewsData, refetch: refetchReviews } = useReviews();

  // Use live data from API (direct array response)
  const reviewsList = Array.isArray(liveReviewsData) ? liveReviewsData : [];

  const currentReviewsData = {
    reviews: reviewsList,
    stats: {
      totalReviews: reviewsList.length || 0,
      averageRating: reviewsList.length > 0 ? 
        (reviewsList.reduce((sum, review) => sum + (review.rating || 0), 0) / reviewsList.length).toFixed(1) : 0,
      pendingReviews: reviewsList.filter(review => review.isApproved === false).length || 0,
      approvedReviews: reviewsList.filter(review => review.isApproved === true).length || 0
    }
  };

  // Auto-hide toast after 4 seconds
  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => {
        setToast(prevToast => ({ ...prevToast, show: false }));
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [toast.show]);

  if (!currentReviewsData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-500">Loading review data...</p>
      </div>
    );
  }

  const { reviews = [], stats = {} } = currentReviewsData;

  const filteredReviews = reviews.filter(review => {
    const matchesSearch = review.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         review.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         review.userName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRating = filterRating === 'all' || review.rating.toString() === filterRating;
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'approved' && review.isApproved === true) ||
                         (filterStatus === 'pending' && review.isApproved === false);
    return matchesSearch && matchesRating && matchesStatus;
  });

  const getRatingStars = (rating) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        size={16}
        className={index < rating ? 'text-yellow-500 fill-current' : 'text-gray-300'}
      />
    ));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'flagged':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const {
    totalReviews = 0,
    averageRating = 0,
    pendingReviews = 0,
    approvedReviews = 0
  } = stats;

  // Handle review added callback
  const handleReviewAdded = (newReview) => {
    setIsSubmittingReview(false);
    setIsAddModalOpen(false);
    setToast({
      show: true,
      type: 'success',
      message: 'Review added successfully!'
    });
    refetchReviews(); // Refresh the reviews list
  };

  // Handle review submission start
  const handleReviewSubmitStart = () => {
    setIsSubmittingReview(true);
  };

  // Handle review submission error
  const handleReviewSubmitError = () => {
    setIsSubmittingReview(false);
  };

  // Handle delete review
  const handleDeleteClick = (review) => {
    setSelectedReview(review);
    setShowDeleteModal(true);
  };

  // Handle approve review
  const handleApproveReview = async (review) => {
    const reviewId = review._id || review.id;
    setApprovingReviewId(reviewId);
    
    try {
      const response = await axios.put('/api/reviews', {
        _id: reviewId,
        isApproved: true
      });
      
      if (response.data.success) {
        setToast({
          show: true,
          type: 'success',
          message: 'Review approved successfully!'
        });
        refetchReviews();
      } else {
        throw new Error(response.data.error || 'Failed to approve review');
      }
    } catch (error) {
      console.error('Approve failed:', error);
      setToast({
        show: true,
        type: 'error',
        message: error.response?.data?.error || error.message || 'Failed to approve review'
      });
    } finally {
      setApprovingReviewId(null);
    }
  };

  // Handle reject review
  const handleRejectReview = async (review) => {
    const reviewId = review._id || review.id;
    setRejectingReviewId(reviewId);
    
    try {
      const response = await axios.put('/api/reviews', {
        _id: reviewId,
        isApproved: false
      });
      
      if (response.data.success) {
        setToast({
          show: true,
          type: 'success',
          message: 'Review rejected successfully!'
        });
        refetchReviews();
      } else {
        throw new Error(response.data.error || 'Failed to reject review');
      }
    } catch (error) {
      console.error('Reject failed:', error);
      setToast({
        show: true,
        type: 'error',
        message: error.response?.data?.error || error.message || 'Failed to reject review'
      });
    } finally {
      setRejectingReviewId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (selectedReview) {
      const reviewId = selectedReview._id || selectedReview.id;
      setDeletingReviewId(reviewId);
      

      
      try {
        const response = await axios.delete('/api/reviews', {
          data: { _id: reviewId }
        });
        

        
        if (response.data.success) {
          setShowDeleteModal(false);
          setSelectedReview(null);
          setToast({
            show: true,
            type: 'success',
            message: 'Review deleted successfully!'
          });
          refetchReviews(); // Refresh the reviews list
        } else {
          throw new Error(response.data.error || 'Failed to delete review');
        }
      } catch (error) {
        console.error('Delete failed:', error);
        setToast({
          show: true,
          type: 'error',
          message: error.response?.data?.error || error.message || 'Failed to delete review'
        });
      } finally {
        setDeletingReviewId(null);
      }
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setSelectedReview(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reviews Management</h1>
          <p className="text-gray-600">Monitor and manage customer reviews</p>
        </div>
        
        {/* <button
          onClick={() => {
            setIsAddModalOpen(true);
          }}
          disabled={isSubmittingReview}
          className="flex items-center space-x-2 bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600"
        >
          <Plus size={20} className={isSubmittingReview ? 'animate-spin' : ''} />
          <span>{isSubmittingReview ? 'Adding Review...' : 'Add Review'}</span>
        </button> */}
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center space-x-2">
            <MessageSquare className="text-gray-600" size={20} />
            <span className="text-sm text-gray-600">Total Reviews</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-1">{totalReviews}</p>
        </div>
        
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center space-x-2">
            <Star className="text-yellow-500" size={20} />
            <span className="text-sm text-gray-600">Avg Rating</span>
          </div>
          <p className="text-2xl font-bold text-gray-600 mt-1">{stats.averageRating || 0}</p>
        </div>
        
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center space-x-2">
            <Clock className="text-orange-500" size={20} />
            <span className="text-sm text-gray-600">Pending</span>
          </div>
          <p className="text-2xl font-bold text-orange-600 mt-1">{pendingReviews}</p>
        </div>
        
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center space-x-2">
            <Check className="text-green-500" size={20} />
            <span className="text-sm text-gray-600">Approved</span>
          </div>
          <p className="text-2xl font-bold text-green-600 mt-1">{approvedReviews}</p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search reviews..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent w-full lg:w-64"
            />
          </div>
          
          <select
            value={filterRating}
            onChange={(e) => setFilterRating(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
          >
            <option value="all">All Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
          </select>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending Approval</option>
            <option value="approved">Approved</option>
          </select>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {filteredReviews.map((review, index) => (
          <motion.div
            key={review._id || review.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="text-lg font-bold text-gray-900">{review.title || `Review by ${review.customerName || review.userName}`}</h3>
                  {/* Approval Status Badge */}
                  {review.isApproved === true ? (
                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                      <Check size={14} />
                      Approved
                    </span>
                  ) : (
                    <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                      <Clock size={14} />
                      Pending
                    </span>
                  )}
                </div>
                
                <div className="flex items-center space-x-4 mb-3">
                  <div className="flex items-center space-x-1">
                    {getRatingStars(review.rating)}
                  </div>
                  <span className="text-sm text-gray-600">by {review.customerName || review.userName || 'Anonymous'}</span>
                  <span className="text-sm text-gray-500">
                    {new Date(review.createdAt || Date.now()).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short', 
                      day: 'numeric'
                    })}
                  </span>
                </div>
                
                <p className="text-sm text-gray-600 mb-2">Product: <span className="font-medium">{review.productName || 'Unknown Product'}</span></p>
                {review.userEmail && (
                  <p className="text-sm text-gray-500 mb-2">Email: {review.userEmail}</p>
                )}
                <p className="text-gray-700 leading-relaxed">{review.comment}</p>
                
                {review.photo && (
                  <div className="mt-3">
                    <Image 
                      src={review.photo} 
                      alt="Review" 
                      width={128}
                      height={128}
                      className="w-32 h-32 object-cover rounded-lg shadow-sm"
                      unoptimized={true}
                    />
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-200">
              {/* Approve/Reject Buttons */}
              {review.isApproved === false ? (
                <button 
                  onClick={() => handleApproveReview(review)}
                  disabled={approvingReviewId === (review._id || review.id)}
                  className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm disabled:opacity-50"
                >
                  <Check size={14} className={approvingReviewId === (review._id || review.id) ? 'animate-spin' : ''} />
                  <span>{approvingReviewId === (review._id || review.id) ? 'Approving...' : 'Approve'}</span>
                </button>
              ) : (
                <button 
                  onClick={() => handleRejectReview(review)}
                  disabled={rejectingReviewId === (review._id || review.id)}
                  className="flex items-center space-x-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors text-sm disabled:opacity-50"
                >
                  <XCircle size={14} className={rejectingReviewId === (review._id || review.id) ? 'animate-spin' : ''} />
                  <span>{rejectingReviewId === (review._id || review.id) ? 'Rejecting...' : 'Unapprove'}</span>
                </button>
              )}
              
              {/* Delete Button */}
              <button 
                onClick={() => handleDeleteClick(review)}
                disabled={deletingReviewId === (review._id || review.id)}
                className="flex items-center space-x-2 bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm disabled:opacity-50"
              >
                <Trash2 size={14} className={deletingReviewId === (review._id || review.id) ? 'animate-spin' : ''} />
                <span>{deletingReviewId === (review._id || review.id) ? 'Deleting...' : 'Delete'}</span>
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* No Results */}
      {filteredReviews.length === 0 && (
        <div className="text-center py-12">
          <MessageSquare className="mx-auto text-gray-400 mb-4" size={48} />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No reviews found</h3>
          <p className="text-gray-600">Try adjusting your search or filter criteria</p>
        </div>
      )}

      {/* Add Review Modal */}
      <AddReviewModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setIsSubmittingReview(false);
        }}
        onReviewAdded={handleReviewAdded}
        onSubmitStart={handleReviewSubmitStart}
        onSubmitError={handleReviewSubmitError}
      />

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && selectedReview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={(e) => e.target === e.currentTarget && handleCancelDelete()}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Delete Review</h3>
                <button
                  onClick={handleCancelDelete}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  disabled={deletingReviewId}
                >
                  <X size={20} className="text-gray-500" />
                </button>
              </div>

              <div className="mb-6">
                <p className="text-gray-600 mb-4">
                  Are you sure you want to delete this review? This action cannot be undone.
                </p>
                <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-red-500">
                  <div className="flex items-start space-x-3">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{selectedReview.customerName}</p>
                      <p className="text-sm text-gray-600">Product: {selectedReview.productName}</p>
                      <div className="flex items-center mt-1">
                        {Array.from({ length: 5 }, (_, index) => (
                          <Star
                            key={index}
                            size={14}
                            className={index < selectedReview.rating ? 'text-yellow-500 fill-current' : 'text-gray-300'}
                          />
                        ))}
                        <span className="ml-2 text-sm text-gray-600">({selectedReview.rating}/5)</span>
                      </div>
                      <p className="text-sm text-gray-700 mt-2 line-clamp-2">{selectedReview.comment}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={handleCancelDelete}
                  disabled={deletingReviewId}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={deletingReviewId}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  <Trash2 size={16} className={deletingReviewId ? 'animate-spin' : ''} />
                  <span>{deletingReviewId ? 'Deleting...' : 'Delete Review'}</span>
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
            initial={{ opacity: 0, y: -100, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -100, scale: 0.95 }}
            className="fixed top-4 right-4 z-50"
          >
            <div className={`${
              toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
            } text-white rounded-xl shadow-2xl p-4 min-w-[300px] max-w-md`}>
              <div className="flex items-center justify-between">
                <p className="font-medium text-sm">{toast.message}</p>
                <button
                  onClick={() => setToast({ ...toast, show: false })}
                  className="ml-4 p-1 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AllReviewsClient;
