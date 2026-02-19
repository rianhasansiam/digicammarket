import { NextResponse } from 'next/server';
import { getCollection } from '../../../lib/mongodb';
import { checkOrigin, isAdmin, isAuthenticated, forbiddenResponse, unauthorizedResponse } from '../../../lib/security';
import apiCache from '../../../lib/cache/apiCache';
import { revalidateTag } from 'next/cache';

// 🚀 PERFORMANCE: Create indexes for faster queries
async function ensureIndexes(collection) {
  try {
    await collection.createIndex({ productId: 1 }); // For filtering by product
    await collection.createIndex({ isApproved: 1 }); // For filtering approved reviews
    await collection.createIndex({ rating: -1 }); // For sorting by rating
    await collection.createIndex({ createdAt: -1 }); // For sorting by date
    await collection.createIndex({ productId: 1, isApproved: 1 }); // Compound index for common queries
    // Indexes created successfully
  } catch (error) {
    // Indexes might already exist
  }
}

// GET - Get all reviews (Public - Anyone can view)
export async function GET(request) {
  try {
    // Check origin for security
    const originCheck = checkOrigin(request);
    if (originCheck) return originCheck;

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const isApprovedOnly = searchParams.get('approved') === 'true';

    // 🚀 PERFORMANCE: Build cache key based on query parameters
    const cacheKey = `reviews:${productId || 'all'}:${isApprovedOnly ? 'approved' : 'all'}`;
    
    // Check server-side cache (on-demand invalidation only)
    const cached = apiCache.get(cacheKey);
    if (cached) {
      return NextResponse.json(cached, {
        headers: { 'X-Cache': 'HIT' }
      });
    }

    // Get the reviews collection
    let reviews;
    try {
      reviews = await getCollection('allReviews');
    } catch (collectionError) {
      console.error('Error accessing reviews collection:', collectionError);
      console.error('Collection error details:', collectionError.message);
      // Return empty array if collection doesn't exist yet
      return NextResponse.json([], {
        headers: { 
          'X-Cache': 'MISS',
          'X-Collection-Status': 'not-initialized'
        }
      });
    }
    
    // 🚀 PERFORMANCE: Create indexes on first request
    try {
      await ensureIndexes(reviews);
    } catch (indexError) {
      console.warn('Error creating indexes (may already exist):', indexError.message);
    }
    
    // Build query based on parameters
    const query = {};
    if (productId) {
      query.productId = productId;
    }
    if (isApprovedOnly) {
      query.isApproved = true;
    }
    
    // Find reviews with query and sort by date (newest first)
    const allReviews = await reviews.find(query).sort({ createdAt: -1 }).toArray();

    // 🚀 PERFORMANCE: Cache the results
    apiCache.set(cacheKey, allReviews);

    return NextResponse.json(allReviews, {
      headers: { 
        'X-Cache': 'MISS',
        'Cache-Control': 'private, no-cache, must-revalidate'
      }
    });

  } catch (error) {
    console.error("Critical error fetching reviews:", error);
    console.error("Error name:", error.name);
    console.error("Error message:", error.message); 
    console.error("Error stack:", error.stack);
    
    // Return error details for debugging
    return NextResponse.json({ 
      success: false,
      error: "Failed to fetch reviews",
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { 
      status: 500,
      headers: { 
        'X-Error': 'true',
        'X-Error-Message': error.message
      }
    });
  }
} // End of GET function

// POST - Create new review (Authenticated users only)
export async function POST(request) {
  try {
    // Check origin for security
    const originCheck = checkOrigin(request);
    if (originCheck) return originCheck;

    // Check if user is authenticated
    let user;
    try {
      user = await isAuthenticated();
    } catch (authError) {
      console.error('Authentication error:', authError);
      return NextResponse.json({ 
        success: false,
        error: "Authentication failed. Please log in again." 
      }, { status: 401 });
    }
    
    if (!user) {
      return unauthorizedResponse('You must be logged in to create a review');
    }

    // Get the reviews collection - MongoDB will create it if it doesn't exist
    let reviews;
    try {
      reviews = await getCollection('allReviews');
      
      // Ensure indexes exist
      try {
        await ensureIndexes(reviews);
      } catch (indexError) {
        console.warn('Could not create indexes (may already exist):', indexError.message);
      }
    } catch (collectionError) {
      console.error('Error accessing reviews collection:', collectionError);
      console.error('Collection error stack:', collectionError.stack);
      return NextResponse.json({ 
        success: false,
        error: "Database collection not available. Please try again later." 
      }, { status: 500 });
    }
    
    // Get the request body
    let body;
    try {
      body = await request.json();
    } catch (jsonError) {
      console.error('Error parsing request body:', jsonError);
      return NextResponse.json({ 
        success: false,
        error: "Invalid request data" 
      }, { status: 400 });
    }
    
    // Validate required fields
    if (!body.rating || !body.comment) {
      return NextResponse.json({ 
        success: false,
        error: "Rating and comment are required" 
      }, { status: 400 });
    }
    
    // Validate rating range
    if (body.rating < 1 || body.rating > 5) {
      return NextResponse.json({ 
        success: false,
        error: "Rating must be between 1 and 5" 
      }, { status: 400 });
    }
    
    // Add metadata
    const reviewData = {
      productId: body.productId || null,
      productName: body.productName || '',
      rating: parseInt(body.rating),
      title: body.title || '',
      comment: body.comment,
      userId: user.id || user._id || user.email,
      userName: user.name || user.email,
      userEmail: user.email,
      userAvatar: body.userAvatar || user.image || null, // Store user avatar
      isApproved: false, // Reviews need admin approval by default
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Insert the new review
    const result = await reviews.insertOne(reviewData);

    // Invalidate all review caches on-demand
    try {
      apiCache.invalidateByPattern('reviews:');
      revalidateTag('reviews');
    } catch (cacheError) {
      console.warn('Could not invalidate cache:', cacheError.message);
    }

    return NextResponse.json({
      success: true,
      Data: result,
      message: "Review submitted successfully and is pending approval"
    }, { status: 201 });

  } catch (error) {
    console.error("Error creating review:", error);
    console.error("Error stack:", error.stack);
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    
    return NextResponse.json({ 
      success: false,
      error: error.message || "Failed to create review",
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
} // End of POST function

// PUT - Update review by _id (Admin only)
export async function PUT(request) {
  try {
    // Check origin for security
    const originCheck = checkOrigin(request);
    if (originCheck) return originCheck;

    // Check if user is admin
    const admin = await isAdmin();
    if (!admin) {
      return forbiddenResponse('Only admins can update reviews');
    }

    // Get the reviews collection
    let reviews;
    try {
      reviews = await getCollection('allReviews');
    } catch (collectionError) {
      console.error('Error accessing reviews collection:', collectionError);
      return NextResponse.json({ 
        success: false,
        error: "Database collection not available. Please try again later." 
      }, { status: 500 });
    }
    const body = await request.json();
    const { _id, ...updateData } = body;
    if (!_id) {
      return NextResponse.json({ success: false, error: 'Review _id is required for update' }, { status: 400 });
    }
    
    // Add updated timestamp
    updateData.updatedAt = new Date().toISOString();
    
    const { ObjectId } = (await import('mongodb'));
    const result = await reviews.updateOne({ _id: new ObjectId(_id) }, { $set: updateData });
    
    if (result.matchedCount === 0) {
      return NextResponse.json({ success: false, error: 'Review not found' }, { status: 404 });
    }
    
    // Invalidate all review caches on-demand
    apiCache.invalidateByPattern('reviews:');
    revalidateTag('reviews');
    
    return NextResponse.json({ success: true, Data: result, message: 'Review updated successfully' });
  } catch (error) {
    console.error('Error updating review:', error);
    return NextResponse.json({ success: false, error: 'Failed to update review' }, { status: 500 });
  }
} // End of PUT function

// DELETE - Delete review by _id (Admin only)
export async function DELETE(request) {
  try {
    // Check origin for security
    const originCheck = checkOrigin(request);
    if (originCheck) return originCheck;

    // Check if user is admin
    const admin = await isAdmin();
    if (!admin) {
      return forbiddenResponse('Only admins can delete reviews');
    }

    // Get the reviews collection
    let reviews;
    try {
      reviews = await getCollection('allReviews');
    } catch (collectionError) {
      console.error('Error accessing reviews collection:', collectionError);
      return NextResponse.json({ 
        success: false,
        error: "Database collection not available. Please try again later." 
      }, { status: 500 });
    }
    const body = await request.json();
    const { _id } = body;
    if (!_id) {
      return NextResponse.json({ success: false, error: 'Review _id is required for delete' }, { status: 400 });
    }
    const { ObjectId } = (await import('mongodb'));
    const result = await reviews.deleteOne({ _id: new ObjectId(_id) });
    
    if (result.deletedCount === 0) {
      return NextResponse.json({ success: false, error: 'Review not found' }, { status: 404 });
    }
    
    // Invalidate all review caches on-demand
    apiCache.invalidateByPattern('reviews:');
    revalidateTag('reviews');
    
    return NextResponse.json({ success: true, Data: result, message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Error deleting review:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete review' }, { status: 500 });
  }
} // End of DELETE function