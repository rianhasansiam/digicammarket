import { NextResponse } from 'next/server';
import { getCollection } from '../../../lib/mongodb';
import { checkOrigin, isAdmin, forbiddenResponse } from '../../../lib/security';
import apiCache, { CACHE_DURATION, getCacheHeaders } from '../../../lib/cache/apiCache';

// Ensure database indexes for better query performance
let indexesCreated = false;

async function ensureIndexes() {
  if (indexesCreated) return;
  
  try {
    const products = await getCollection('allProducts');
    
    // Create indexes for frequently queried fields
    await products.createIndex({ category: 1 });
    await products.createIndex({ brand: 1 });
    await products.createIndex({ style: 1 });
    await products.createIndex({ price: 1 });
    await products.createIndex({ stock: 1 });
    await products.createIndex({ createdAt: -1 });
    await products.createIndex({ name: 'text', brand: 'text', shortDescription: 'text', description: 'text' });
    
    indexesCreated = true;
    console.log('✅ Product indexes created successfully');
  } catch (error) {
    console.error('Failed to create indexes:', error);
  }
}

// GET - Get products with optional pagination (Public - Anyone can view)
export async function GET(request) {
  try {
    // Check origin for security
    const originCheck = checkOrigin(request);
    if (originCheck) return originCheck;

    // Parse query parameters for pagination
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 0; // 0 means no pagination
    const limit = parseInt(searchParams.get('limit')) || 12;
    const isPaginated = page > 0;

    // Determine cache key based on pagination
    const cacheKey = isPaginated ? `products:page:${page}:${limit}` : 'products:all';
    const cachedData = apiCache.get(cacheKey, CACHE_DURATION.STATIC);
    
    if (cachedData) {
      return NextResponse.json(cachedData, {
        headers: {
          ...getCacheHeaders(1800), // 30 minutes
          'X-Cache': 'HIT'
        }
      });
    }

    // Ensure indexes are created
    await ensureIndexes();

    // Get the products collection
    const products = await getCollection('allProducts');

    // If paginated request
    if (isPaginated) {
      const skip = (page - 1) * limit;
      
      // Get total count and paginated products in parallel
      const [totalCount, paginatedProducts] = await Promise.all([
        products.countDocuments({}),
        products
          .find({})
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .toArray()
      ]);

      const totalPages = Math.ceil(totalCount / limit);
      const hasMore = page < totalPages;

      const responseData = {
        products: paginatedProducts,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages,
          hasMore
        }
      };

      // Cache paginated results
      apiCache.set(cacheKey, responseData);

      return NextResponse.json(responseData, {
        headers: {
          ...getCacheHeaders(1800),
          'X-Cache': 'MISS'
        }
      });
    }

    // Non-paginated: Return all products (backward compatible)
    const allProducts = await products
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    // Cache the results
    apiCache.set(cacheKey, allProducts);

    return NextResponse.json(allProducts, {
      headers: {
        ...getCacheHeaders(1800), // 30 minutes
        'X-Cache': 'MISS'
      }
    });

  } catch (error) {
    console.error('Products GET error:', error);
    return NextResponse.json({ 
      success: false,
      error: "Failed to fetch products" 
    }, { status: 500 });
  }
} // End of GET function

// POST - Create new product (Admin only)
export async function POST(request) {
  try {
    // Check origin for security
    const originCheck = checkOrigin(request);
    if (originCheck) return originCheck;

    // Check if user is admin
    const admin = await isAdmin();
    if (!admin) {
      return forbiddenResponse('Only admins can create products');
    }

    // Get the products collection
    const products = await getCollection('allProducts');
    
    // Get the request body
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['name', 'category', 'style', 'price', 'stock', 'shortDescription', 'description'];
    const missingFields = requiredFields.filter(field => !body[field]);
    
    if (missingFields.length > 0) {
      return NextResponse.json({ 
        success: false,
        error: `Missing required fields: ${missingFields.join(', ')}`
      }, { status: 400 });
    }
    
    // Validate arrays
    if (!Array.isArray(body.images) || body.images.length === 0) {
      return NextResponse.json({ 
        success: false,
        error: 'At least one product image is required'
      }, { status: 400 });
    }
    
    if (!Array.isArray(body.colors) || body.colors.length === 0) {
      return NextResponse.json({ 
        success: false,
        error: 'At least one color is required'
      }, { status: 400 });
    }
    
    if (!Array.isArray(body.sizes) || body.sizes.length === 0) {
      return NextResponse.json({ 
        success: false,
        error: 'At least one sensor type is required'
      }, { status: 400 });
    }
    
    // Prepare product data with schema structure
    const productData = {
      name: body.name.trim(),
      brand: body.brand ? body.brand.trim() : '',
      category: body.category.trim(),
      style: body.style.trim(),
      price: Number(body.price),
      originalPrice: body.originalPrice ? Number(body.originalPrice) : null,
      stock: Number(body.stock),
      shortDescription: body.shortDescription.trim(),
      description: body.description.trim(),
      images: body.images,
      image: body.images[0], // Primary image
      colors: body.colors,
      color: body.colors[0], // Primary color
      sizes: body.sizes,
      createdAt: new Date(),
    };
    
    // Insert the new product
    const result = await products.insertOne(productData);

    // Invalidate products cache
    apiCache.invalidateByPattern('products');

    return NextResponse.json({
      success: true,
      data: result,
      productId: result.insertedId,
      message: "Product created successfully"
    });

  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json({ 
      success: false,
      error: error.message || "Failed to create product" 
    }, { status: 500 });
  }
} // End of POST function