'use client';

import React, { useMemo } from 'react';
import ReviewClient from './ReviewClient';

export default function Review({ reviewsData }) {
  // Process real reviews data - only approved reviews
  const customerReviews = useMemo(() => {
    if (!Array.isArray(reviewsData) || reviewsData.length === 0) {
      // Return empty array if no real reviews exist - component will handle empty state
      return [];
    }

    // Map real approved reviews to expected format
    return reviewsData
      .filter(review => review.isApproved === true && review.rating && review.rating >= 4) // Only show approved good reviews on homepage
      .slice(0, 8) // Limit to 8 reviews for performance
      .map((review, index) => ({
        id: review._id || `review-${index}`,
        name: review.userName || review.customerName || review.name || `Customer ${index + 1}`,
        avatar: review.userAvatar || review.avatar || review.userAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(review.userName || 'Customer')}&size=150&background=f3f4f6&color=374151`,
        rating: review.rating || 5,
        title: review.title || review.subject || "Great Product!",
        comment: review.comment || review.review || review.description || "Excellent experience with this product!",
        product: review.productName || review.product || "Product",
        date: review.createdAt ? 
          new Date(review.createdAt).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
          }) : "Recently",
        verified: review.verified !== false // Default to verified unless explicitly false
      }));
  }, [reviewsData]);

  // Calculate review statistics
  const reviewStats = useMemo(() => {
    if (!Array.isArray(reviewsData) || reviewsData.length === 0) {
      return {
        averageRating: 4.8,
        totalReviews: 0,
        ratingBreakdown: {
          5: 85,
          4: 12,
          3: 2,
          2: 1,
          1: 0
        }
      };
    }

    const totalReviews = reviewsData.length;
    const averageRating = reviewsData.reduce((sum, review) => sum + (review.rating || 0), 0) / totalReviews;
    
    // Calculate rating breakdown
    const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviewsData.forEach(review => {
      const rating = Math.round(review.rating || 0);
      if (breakdown[rating] !== undefined) {
        breakdown[rating]++;
      }
    });

    // Convert to percentages
    const ratingBreakdown = {};
    Object.keys(breakdown).forEach(star => {
      ratingBreakdown[star] = Math.round((breakdown[star] / totalReviews) * 100);
    });

    return {
      averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
      totalReviews,
      ratingBreakdown
    };
  }, [reviewsData]);

  return (
    <section className="py-8 sm:py-12 md:py-16 bg-gradient-to-br from-gray-50 to-white">
      <div className="container mx-auto px-2 sm:px-4 xl:px-0 max-w-frame">
        <ReviewClient 
          reviews={customerReviews} 
          stats={reviewStats}
        />
      </div>
    </section>
  );
}
