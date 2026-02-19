import { NextResponse } from 'next/server';
import { getCollection } from '../../../lib/mongodb';
import { checkOrigin, isAdmin, forbiddenResponse } from '../../../lib/security';
import { revalidateTag } from 'next/cache';

// GET - Get all categories (Public - Anyone can view)
export async function GET(request) {
  try {
    // Check origin for security
    const originCheck = checkOrigin(request);
    if (originCheck) return originCheck;

    // Get both categories and products collections
    const categories = await getCollection('allCategories');
    const products = await getCollection('allProducts');
    
    // Find all categories
    const allCategories = await categories.find({}).toArray();
    
    // Use MongoDB aggregation to count products per category efficiently
    const productCounts = await products.aggregate([
      { $group: { _id: { $toLower: { $trim: { input: { $ifNull: ['$category', ''] } } } }, count: { $sum: 1 } } }
    ]).toArray();
    
    // Build a lookup map for O(1) access
    const countMap = {};
    for (const pc of productCounts) {
      if (pc._id) countMap[pc._id] = pc.count;
    }
    
    // Calculate product count for each category using the lookup map
    const categoriesWithCount = allCategories.map(category => {
      const categoryName = category.name?.toLowerCase()?.trim() || '';
      return {
        ...category,
        productCount: countMap[categoryName] || 0
      };
    });
    
    return NextResponse.json(categoriesWithCount);

  } catch (error) {
    console.error("Error fetching categories:", error); 
    return NextResponse.json({ 
      success: false,
      error: "Failed to fetch categories" 
    }, { status: 500 });
  }
} // End of GET function

// POST - Create new category (Admin only)
export async function POST(request) {
  try {
    // Check origin for security
    const originCheck = checkOrigin(request);
    if (originCheck) return originCheck;

    // Check if user is admin
    const admin = await isAdmin();
    if (!admin) {
      return forbiddenResponse('Only admins can create categories');
    }

    // Get the categories collection
    const categories = await getCollection('allCategories');
    
    // Get the request body
    const body = await request.json();
    
    // Insert the new category
    const categoryData = await categories.insertOne(body);

    // On-demand revalidation
    revalidateTag('categories');
    revalidateTag('products');

    return NextResponse.json({
      success: true,
      Data: categoryData,
      message: "Category created successfully"
    });

  } catch (error) {
    console.error("Error creating category:", error); 
    return NextResponse.json({ 
      success: false,
      error: "Failed to create category" 
    }, { status: 500 });
  }
} // End of POST function

// PUT - Update category by _id (Admin only)
export async function PUT(request, { params }) {
  try {
    // Check origin for security
    const originCheck = checkOrigin(request);
    if (originCheck) return originCheck;

    // Check if user is admin
    const admin = await isAdmin();
    if (!admin) {
      return forbiddenResponse('Only admins can update categories');
    }

    const categories = await getCollection('allCategories');
    const body = await request.json();
    
    // Get _id from URL params or from body for backward compatibility
    const url = new URL(request.url);
    const idFromUrl = url.pathname.split('/').pop();
    const _id = idFromUrl !== 'categories' ? idFromUrl : body._id;
    
    if (!_id) {
      return NextResponse.json({ success: false, error: 'Category _id is required for update' }, { status: 400 });
    }
    
    const { ObjectId } = (await import('mongodb'));
    const result = await categories.updateOne({ _id: new ObjectId(_id) }, { $set: body });
    
    // On-demand revalidation
    revalidateTag('categories');
    revalidateTag('products');

    return NextResponse.json({ success: true, Data: result, message: 'Category updated successfully' });
  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json({ success: false, error: 'Failed to update category' }, { status: 500 });
  }
} // End of PUT function

// DELETE - Delete category by _id (Admin only)
export async function DELETE(request, { params }) {
  try {
    // Check origin for security
    const originCheck = checkOrigin(request);
    if (originCheck) return originCheck;

    // Check if user is admin
    const admin = await isAdmin();
    if (!admin) {
      return forbiddenResponse('Only admins can delete categories');
    }

    const categories = await getCollection('allCategories');
    
    // Get _id from URL params
    const url = new URL(request.url);
    const idFromUrl = url.pathname.split('/').pop();
    const _id = idFromUrl !== 'categories' ? idFromUrl : null;
    
    if (!_id) {
      return NextResponse.json({ success: false, error: 'Category _id is required for delete' }, { status: 400 });
    }
    
    const { ObjectId } = (await import('mongodb'));
    const result = await categories.deleteOne({ _id: new ObjectId(_id) });
    
    // On-demand revalidation
    revalidateTag('categories');
    revalidateTag('products');

    return NextResponse.json({ success: true, Data: result, message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete category' }, { status: 500 });
  }
} // End of DELETE function