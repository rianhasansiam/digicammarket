import { NextResponse } from 'next/server';
import { getCollection } from '../../../lib/mongodb';
import { checkOrigin, isAdmin, forbiddenResponse } from '../../../lib/security';
import { revalidateTag } from 'next/cache';

// GET - Get all coupons (Admin only)
export async function GET(request) {
  try {
    // Check origin for security
    const originCheck = checkOrigin(request);
    if (originCheck) return originCheck;

    // Check if user is admin
    const admin = await isAdmin();
    if (!admin) {
      return forbiddenResponse('Only admins can view coupons');
    }

    // Get the coupons collection
    const coupons = await getCollection('allCoupons');
    
    // Find all coupons
    const allCoupons = await coupons.find({}).toArray();

    return NextResponse.json(allCoupons);

  } catch (error) {
    console.error("Error fetching coupons:", error); 
    return NextResponse.json({ 
      success: false,
      error: "Failed to fetch coupons" 
    }, { status: 500 });
  }
} // End of GET function

// POST - Create new coupon (Admin only)
export async function POST(request) {
  try {
    // Check origin for security
    const originCheck = checkOrigin(request);
    if (originCheck) return originCheck;

    // Check if user is admin
    const admin = await isAdmin();
    if (!admin) {
      return forbiddenResponse('Only admins can create coupons');
    }

    // Get the coupons collection
    const coupons = await getCollection('allCoupons');
    
    // Get the request body
    const body = await request.json();
    
    // Add creation timestamp
    const couponData = {
      ...body,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Insert the new coupon
    const result = await coupons.insertOne(couponData);

    revalidateTag('coupons');
    return NextResponse.json({
      success: true,
      Data: result,
      message: "Coupon created successfully"
    });

  } catch (error) {
    console.error("Error creating coupon:", error); 
    return NextResponse.json({ 
      success: false,
      error: "Failed to create coupon" 
    }, { status: 500 });
  }
} // End of POST function