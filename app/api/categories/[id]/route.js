import { NextResponse } from 'next/server';
import { getCollection } from '../../../../lib/mongodb';
import { revalidateTag } from 'next/cache';
import { checkOrigin, isAdmin, forbiddenResponse } from '../../../../lib/security';

// PUT - Update category by ID (Admin only)
export async function PUT(request, { params }) {
  try {
    const originCheck = checkOrigin(request);
    if (originCheck) return originCheck;

    const admin = await isAdmin();
    if (!admin) {
      return forbiddenResponse('Only admins can update categories');
    }

    // ✅ FIX: Await params in Next.js 15
    const { id } = await params;
    const categories = await getCollection('allCategories');
    const body = await request.json();
    
    if (!id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Category ID is required for update' 
      }, { status: 400 });
    }

    const { ObjectId } = (await import('mongodb'));
    const { _id: bodyId, ...updateData } = body;
    const result = await categories.updateOne(
      { _id: new ObjectId(id) }, 
      { $set: { ...updateData, updatedAt: new Date() } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Category not found' 
      }, { status: 404 });
    }

    // On-demand revalidation
    revalidateTag('categories');
    revalidateTag('products');

    return NextResponse.json({ 
      success: true, 
      Data: result, 
      message: 'Category updated successfully' 
    });

  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to update category' 
    }, { status: 500 });
  }
}

// DELETE - Delete category by ID (Admin only)
export async function DELETE(request, { params }) {
  try {
    const originCheck = checkOrigin(request);
    if (originCheck) return originCheck;

    const admin = await isAdmin();
    if (!admin) {
      return forbiddenResponse('Only admins can delete categories');
    }

    // ✅ FIX: Await params in Next.js 15
    const { id } = await params;
    const categories = await getCollection('allCategories');
    
    if (!id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Category ID is required for delete' 
      }, { status: 400 });
    }

    const { ObjectId } = (await import('mongodb'));
    const result = await categories.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Category not found' 
      }, { status: 404 });
    }

    // On-demand revalidation
    revalidateTag('categories');
    revalidateTag('products');

    return NextResponse.json({ 
      success: true, 
      Data: result, 
      message: 'Category deleted successfully' 
    });

  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to delete category' 
    }, { status: 500 });
  }
}

// GET - Get single category by ID
export async function GET(request, { params }) {
  try {
    // ✅ FIX: Await params in Next.js 15
    const { id } = await params;
    const categories = await getCollection('allCategories');
    
    if (!id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Category ID is required' 
      }, { status: 400 });
    }

    const { ObjectId } = (await import('mongodb'));
    const category = await categories.findOne({ _id: new ObjectId(id) });

    if (!category) {
      return NextResponse.json({ 
        success: false, 
        error: 'Category not found' 
      }, { status: 404 });
    }

    return NextResponse.json(category);

  } catch (error) {
    console.error('Error fetching category:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch category' 
    }, { status: 500 });
  }
}