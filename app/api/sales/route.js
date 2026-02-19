import { NextResponse } from 'next/server';
import { getCollection } from '../../../lib/mongodb';
import { checkOrigin, isAdmin, forbiddenResponse } from '../../../lib/security';
import { revalidateTag } from 'next/cache';

// GET - Get all sales (public for active sales, admin for all)
export async function GET(request) {
  try {
    // Check origin for security
    const originCheck = checkOrigin(request);
    if (originCheck) return originCheck;

    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active') === 'true';

    // Get the sales collection
    const sales = await getCollection('allSales');
    
    let query = {};
    
    // If requesting active only (public), filter by status and dates
    if (activeOnly) {
      const now = new Date();
      query = {
        status: 'active',
        startDate: { $lte: now },
        endDate: { $gte: now }
      };
    } else {
      // For all sales, require admin access
      const admin = await isAdmin();
      if (!admin) {
        // Return only active sales for non-admins
        const now = new Date();
        query = {
          status: 'active',
          startDate: { $lte: now },
          endDate: { $gte: now }
        };
      }
    }

    // Find sales with optional product population
    const allSales = await sales.find(query).sort({ createdAt: -1 }).toArray();

    return NextResponse.json(allSales);

  } catch (error) {
    console.error("Error fetching sales:", error); 
    return NextResponse.json({ 
      success: false,
      error: "Failed to fetch sales" 
    }, { status: 500 });
  }
}

// POST - Create new sale (Admin only)
export async function POST(request) {
  try {
    // Check origin for security
    const originCheck = checkOrigin(request);
    if (originCheck) return originCheck;

    // Check if user is admin
    const admin = await isAdmin();
    if (!admin) {
      return forbiddenResponse('Only admins can create sales');
    }

    // Get the sales collection
    const sales = await getCollection('allSales');
    
    // Get the request body
    const body = await request.json();
    
    // Validate required fields
    if (!body.title || !body.saleType || !body.startDate || !body.endDate) {
      return NextResponse.json({ 
        success: false,
        error: "Missing required fields: title, saleType, startDate, endDate" 
      }, { status: 400 });
    }

    // Add creation timestamp and defaults
    const saleData = {
      ...body,
      title: body.title,
      subtitle: body.subtitle || '',
      description: body.description || '',
      saleType: body.saleType, // 'flash', 'bundle', 'seasonal', 'clearance'
      discountType: body.discountType || 'percentage', // 'percentage' or 'fixed'
      discountValue: body.discountValue || 0,
      startDate: new Date(body.startDate),
      endDate: new Date(body.endDate),
      status: body.status || 'active', // 'active', 'scheduled', 'ended', 'paused'
      backgroundColor: body.backgroundColor || '#1f2937',
      textColor: body.textColor || '#ffffff',
      accentColor: body.accentColor || '#ef4444',
      productIds: body.productIds || [], // Specific products in sale
      categoryIds: body.categoryIds || [], // Specific categories in sale
      bannerImage: body.bannerImage || '',
      showCountdown: body.showCountdown !== false,
      featured: body.featured || false,
      priority: body.priority || 0, // Higher priority shows first
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Insert the new sale
    const result = await sales.insertOne(saleData);

    revalidateTag('sales');
    return NextResponse.json({
      success: true,
      data: { ...saleData, _id: result.insertedId },
      message: "Sale created successfully"
    });

  } catch (error) {
    console.error("Error creating sale:", error); 
    return NextResponse.json({ 
      success: false,
      error: "Failed to create sale" 
    }, { status: 500 });
  }
}
