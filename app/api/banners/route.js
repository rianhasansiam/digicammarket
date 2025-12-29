import { NextResponse } from 'next/server';
import { getCollection } from '../../../lib/mongodb';
import { checkOrigin, isAdmin, forbiddenResponse } from '../../../lib/security';

// GET - Get all banners (Public - Anyone can view active banners)
export async function GET(request) {
  try {
    // Check origin for security
    const originCheck = checkOrigin(request);
    if (originCheck) return originCheck;

    const banners = await getCollection('heroBanners');
    
    // Check for active parameter
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active') === 'true';
    
    let query = {};
    if (activeOnly) {
      query.isActive = true;
    }
    
    // Sort by order (ascending) to control banner sequence
    const allBanners = await banners.find(query).sort({ order: 1 }).toArray();
    
    return NextResponse.json(allBanners);

  } catch (error) {
    console.error("Error fetching banners:", error); 
    return NextResponse.json({ 
      success: false,
      error: "Failed to fetch banners" 
    }, { status: 500 });
  }
}

// POST - Create new banner (Admin only)
export async function POST(request) {
  try {
    // Check origin for security
    const originCheck = checkOrigin(request);
    if (originCheck) return originCheck;

    // Check if user is admin
    const admin = await isAdmin();
    if (!admin) {
      return forbiddenResponse('Only admins can create banners');
    }

    const banners = await getCollection('heroBanners');
    const body = await request.json();
    
    // Validate required fields
    if (!body.image) {
      return NextResponse.json({
        success: false,
        error: "Banner image is required"
      }, { status: 400 });
    }
    
    // Get the highest order number
    const lastBanner = await banners.find({}).sort({ order: -1 }).limit(1).toArray();
    const nextOrder = lastBanner.length > 0 ? (lastBanner[0].order || 0) + 1 : 1;
    
    // Create banner data
    const bannerData = {
      title: body.title || '',
      subtitle: body.subtitle || '',
      description: body.description || '',
      image: body.image,
      link: body.link || '/allProducts',
      buttonText: body.buttonText || 'Shop Now',
      bannerType: body.bannerType || 'main', // 'main' for carousel, 'side' for side banners
      isActive: body.isActive !== false, // Default to true
      order: body.order || nextOrder,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await banners.insertOne(bannerData);

    return NextResponse.json({
      success: true,
      data: { ...bannerData, _id: result.insertedId },
      message: "Banner created successfully"
    });

  } catch (error) {
    console.error("Error creating banner:", error); 
    return NextResponse.json({ 
      success: false,
      error: "Failed to create banner" 
    }, { status: 500 });
  }
}

// PUT - Update banner (Admin only)
export async function PUT(request) {
  try {
    // Check origin for security
    const originCheck = checkOrigin(request);
    if (originCheck) return originCheck;

    // Check if user is admin
    const admin = await isAdmin();
    if (!admin) {
      return forbiddenResponse('Only admins can update banners');
    }

    const banners = await getCollection('heroBanners');
    const body = await request.json();
    
    if (!body._id && !body.id) {
      return NextResponse.json({
        success: false,
        error: "Banner ID is required"
      }, { status: 400 });
    }
    
    const { ObjectId } = await import('mongodb');
    const bannerId = body._id || body.id;
    
    // Remove _id from update data
    const { _id, id, ...updateData } = body;
    updateData.updatedAt = new Date();
    
    const result = await banners.updateOne(
      { _id: new ObjectId(bannerId) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({
        success: false,
        error: "Banner not found"
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Banner updated successfully"
    });

  } catch (error) {
    console.error("Error updating banner:", error); 
    return NextResponse.json({ 
      success: false,
      error: "Failed to update banner" 
    }, { status: 500 });
  }
}

// DELETE - Delete banner (Admin only)
export async function DELETE(request) {
  try {
    // Check origin for security
    const originCheck = checkOrigin(request);
    if (originCheck) return originCheck;

    // Check if user is admin
    const admin = await isAdmin();
    if (!admin) {
      return forbiddenResponse('Only admins can delete banners');
    }

    const banners = await getCollection('heroBanners');
    const { searchParams } = new URL(request.url);
    const bannerId = searchParams.get('id');
    
    if (!bannerId) {
      return NextResponse.json({
        success: false,
        error: "Banner ID is required"
      }, { status: 400 });
    }
    
    const { ObjectId } = await import('mongodb');
    
    const result = await banners.deleteOne({ _id: new ObjectId(bannerId) });

    if (result.deletedCount === 0) {
      return NextResponse.json({
        success: false,
        error: "Banner not found"
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Banner deleted successfully"
    });

  } catch (error) {
    console.error("Error deleting banner:", error); 
    return NextResponse.json({ 
      success: false,
      error: "Failed to delete banner" 
    }, { status: 500 });
  }
}
