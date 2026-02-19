import { NextResponse } from 'next/server';
import { getCollection } from '../../../lib/mongodb';
import { checkOrigin, isAuthenticated, unauthorizedResponse } from '../../../lib/security';

// GET - Get all carts (Authenticated users only)
export async function GET(request) {
  try {
    const originCheck = checkOrigin(request);
    if (originCheck) return originCheck;

    const user = await isAuthenticated();
    if (!user) {
      return unauthorizedResponse('You must be logged in to view carts');
    }

    // Get the carts collection
    const carts = await getCollection('allCarts');
    
    // Find all carts
    const allCarts = await carts.find({}).toArray();
    
    return NextResponse.json({
      success: true,
      Data: allCarts
    });

  } catch (error) {
    console.error("Error fetching carts:", error); 
    return NextResponse.json({ 
      success: false,
      error: "Failed to fetch carts" 
    }, { status: 500 });
  }
} // End of GET function

// POST - Create new cart (Authenticated users only)
export async function POST(request) {
  try {
    const originCheck = checkOrigin(request);
    if (originCheck) return originCheck;

    const user = await isAuthenticated();
    if (!user) {
      return unauthorizedResponse('You must be logged in to create a cart');
    }

    // Get the carts collection
    const carts = await getCollection('allCarts');
    
    // Get the request body
    const body = await request.json();
    
    // Validate cart data
    if (!body.items || !Array.isArray(body.items)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Cart items are required and must be an array' 
      }, { status: 400 });
    }
    
    // Sanitize cart data
    const cartData = {
      userId: user.id || user.email,
      items: body.items.map(item => ({
        productId: String(item.productId || ''),
        quantity: Math.max(1, Number(item.quantity) || 1),
        size: item.size ? String(item.size) : undefined,
        color: item.color ? String(item.color) : undefined
      })),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Insert the new cart
    const result = await carts.insertOne(cartData);

    return NextResponse.json({
      success: true,
      Data: result,
      message: "Cart created successfully"
    });

  } catch (error) {
    console.error("Error creating cart:", error); 
    return NextResponse.json({ 
      success: false,
      error: "Failed to create cart" 
    }, { status: 500 });
  }
} // End of POST function


