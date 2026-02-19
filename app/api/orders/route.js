import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getCollection } from '../../../lib/mongodb';
import { checkOrigin, isAdmin, isAuthenticated, forbiddenResponse, unauthorizedResponse } from '../../../lib/security';
import { revalidateTag } from 'next/cache';

// GET - Get all orders (Admin only)
export async function GET(request) {
  try {
    // Check origin for security
    const originCheck = checkOrigin(request);
    if (originCheck) return originCheck;

    // Check if user is admin
    const admin = await isAdmin();
    if (!admin) {
      return forbiddenResponse('Only admins can view all orders');
    }

    // Get the orders collection
    const orders = await getCollection('allOrders');
    
    // Find all orders
    const allOrders = await orders.find({}).toArray();

    return NextResponse.json(allOrders);

  } catch (error) {
    console.error("Error fetching orders:", error); 
    return NextResponse.json({ 
      success: false,
      error: "Failed to fetch orders" 
    }, { status: 500 });
  }
} // End of GET function

// POST - Create new order (Authenticated users only)
export async function POST(request) {
  try {
    // Check origin for security
    const originCheck = checkOrigin(request);
    if (originCheck) return originCheck;

    // Check if user is authenticated
    const user = await isAuthenticated();
    if (!user) {
      return unauthorizedResponse('You must be logged in to create an order');
    }

    // Get the request body
    const body = await request.json();

    // === Server-side validation ===
    // Validate required top-level fields
    if (!body.customerInfo || !body.items || !body.paymentMethod || !body.orderSummary) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required order fields: customerInfo, items, paymentMethod, orderSummary' 
      }, { status: 400 });
    }

    // Validate customer info
    const { customerInfo } = body;
    if (!customerInfo.name || !customerInfo.email || !customerInfo.phone || !customerInfo.address) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required customer fields: name, email, phone, address' 
      }, { status: 400 });
    }

    // Basic email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerInfo.email)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid email format' 
      }, { status: 400 });
    }

    // Validate items array
    if (!Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Order must contain at least one item' 
      }, { status: 400 });
    }

    for (const item of body.items) {
      if (!item.productId || !item.quantity || item.quantity < 1) {
        return NextResponse.json({ 
          success: false, 
          error: 'Each item must have a valid productId and quantity >= 1' 
        }, { status: 400 });
      }
      if (typeof item.price !== 'number' || item.price < 0) {
        return NextResponse.json({ 
          success: false, 
          error: 'Each item must have a valid non-negative price' 
        }, { status: 400 });
      }
    }

    // Validate payment method
    if (!body.paymentMethod.type) {
      return NextResponse.json({ 
        success: false, 
        error: 'Payment method type is required' 
      }, { status: 400 });
    }

    // === Stock verification & price verification ===
    const productsCollection = await getCollection('allProducts');
    const productIds = body.items.map(item => {
      try { return new ObjectId(item.productId); } catch { return null; }
    }).filter(Boolean);

    const dbProducts = await productsCollection.find({ _id: { $in: productIds } }).toArray();
    const productMap = {};
    dbProducts.forEach(p => { productMap[p._id.toString()] = p; });

    // Verify stock and prices for each item
    let verifiedSubtotal = 0;
    const stockUpdates = [];

    for (const item of body.items) {
      const dbProduct = productMap[item.productId];
      if (!dbProduct) {
        return NextResponse.json({ 
          success: false, 
          error: `Product not found: ${item.productId}` 
        }, { status: 400 });
      }

      // Check stock availability
      if (dbProduct.stock !== undefined && dbProduct.stock < item.quantity) {
        return NextResponse.json({ 
          success: false, 
          error: `Insufficient stock for "${dbProduct.name}". Available: ${dbProduct.stock}, Requested: ${item.quantity}` 
        }, { status: 400 });
      }

      // Use server-side price (prevent client-side price manipulation)
      item.price = dbProduct.price;
      item.subtotal = dbProduct.price * item.quantity;
      item.productName = dbProduct.name;
      verifiedSubtotal += item.subtotal;

      // Prepare stock decrement with atomic guard to prevent overselling
      if (dbProduct.stock !== undefined) {
        stockUpdates.push({
          updateOne: {
            filter: { _id: new ObjectId(item.productId), stock: { $gte: item.quantity } },
            update: { $inc: { stock: -item.quantity } }
          }
        });
      }
    }

    // Decrement stock for all items (atomic with guard)
    if (stockUpdates.length > 0) {
      const bulkResult = await productsCollection.bulkWrite(stockUpdates);
      // Check if all stock decrements succeeded
      if (bulkResult.modifiedCount < stockUpdates.length) {
        return NextResponse.json({ 
          success: false, 
          error: 'Some items went out of stock while processing your order. Please try again.' 
        }, { status: 409 });
      }
    }

    // Generate server-side order ID
    const orderId = 'ORD-' + Date.now() + '-' + Math.random().toString(36).substring(2, 8).toUpperCase();

    // Sanitize — build clean order document
    const sanitizedOrder = {
      orderId,
      orderDate: new Date().toISOString(),
      customerInfo: {
        name: String(customerInfo.name).trim().substring(0, 200),
        email: String(customerInfo.email).trim().toLowerCase().substring(0, 200),
        phone: String(customerInfo.phone).trim().substring(0, 20),
        address: {
          street: String(customerInfo.address?.street || '').trim().substring(0, 500),
          city: String(customerInfo.address?.city || '').trim().substring(0, 100),
          zipCode: String(customerInfo.address?.zipCode || '').trim().substring(0, 20)
        }
      },
      items: body.items.map(item => ({
        productId: String(item.productId),
        productName: String(item.productName || '').substring(0, 200),
        price: Number(item.price) || 0,
        quantity: Number(item.quantity) || 1,
        size: item.size ? String(item.size).substring(0, 50) : undefined,
        color: item.color ? String(item.color).substring(0, 50) : undefined,
        subtotal: Number(item.subtotal) || 0
      })),
      paymentMethod: {
        type: String(body.paymentMethod.type).substring(0, 50),
        name: String(body.paymentMethod.name || '').substring(0, 100),
        advancePayment: body.paymentMethod.advancePayment ? {
          amount: String(body.paymentMethod.advancePayment.amount || '0'),
          remainingAmount: String(body.paymentMethod.advancePayment.remainingAmount || '0'),
          method: String(body.paymentMethod.advancePayment.method || '').substring(0, 20),
          phoneNumber: String(body.paymentMethod.advancePayment.phoneNumber || '').substring(0, 20),
          transactionId: String(body.paymentMethod.advancePayment.transactionId || '').substring(0, 50),
          screenshot: body.paymentMethod.advancePayment.screenshot ? String(body.paymentMethod.advancePayment.screenshot).substring(0, 500) : null,
          paidAt: body.paymentMethod.advancePayment.paidAt || new Date().toISOString()
        } : undefined
      },
      orderSummary: {
        subtotal: verifiedSubtotal,
        shipping: Number(body.orderSummary.shipping) || 0,
        tax: Number(body.orderSummary.tax) || 0,
        total: verifiedSubtotal + (Number(body.orderSummary.shipping) || 0) + (Number(body.orderSummary.tax) || 0),
        advancePaid: Number(body.orderSummary.advancePaid) || 0,
        remainingAmount: Number(body.orderSummary.remainingAmount) || 0
      },
      userId: user.id || user.email,
      status: 'payment_verified',
      paymentStatus: 'partial',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Get the orders collection and insert
    const orders = await getCollection('allOrders');
    const orderResult = await orders.insertOne(sanitizedOrder);

    revalidateTag('orders');
    revalidateTag('products');
    return NextResponse.json({
      success: true,
      Data: orderResult,
      order: { orderId: sanitizedOrder.orderId },
      message: "Order created successfully"
    });

  } catch (error) {
    console.error("Error creating order:", error); 
    return NextResponse.json({ 
      success: false,
      error: "Failed to create order" 
    }, { status: 500 });
  }
} // End of POST function


// PUT - Update admin order by _id (Admin only)
export async function PUT(request) {
  try {
    // Check origin for security
    const originCheck = checkOrigin(request);
    if (originCheck) return originCheck;

    // Check if user is admin
    const admin = await isAdmin();
    if (!admin) {
      return forbiddenResponse('Only admins can update orders');
    }

    const adminOrders = await getCollection('allOrders');
    const body = await request.json();
    const { _id, ...updateData } = body;
    if (!_id) {
      return NextResponse.json({ success: false, error: 'Admin order _id is required for update' }, { status: 400 });
    }
    const result = await adminOrders.updateOne({ _id: new ObjectId(_id) }, { $set: updateData });
    revalidateTag('orders');
    revalidateTag('products');
    return NextResponse.json({ success: true, Data: result, message: 'Admin order updated successfully' });
  } catch (error) {
    console.error('Error updating admin order:', error);
    return NextResponse.json({ success: false, error: 'Failed to update admin order' }, { status: 500 });
  }
} // End of PUT function

// DELETE - Delete admin order by _id (Admin only)
export async function DELETE(request) {
  try {
    // Check origin for security
    const originCheck = checkOrigin(request);
    if (originCheck) return originCheck;

    // Check if user is admin
    const admin = await isAdmin();
    if (!admin) {
      return forbiddenResponse('Only admins can delete orders');
    }

    const adminOrders = await getCollection('allOrders');
    const body = await request.json();
    const { _id } = body;
    if (!_id) {
      return NextResponse.json({ success: false, error: 'Admin order _id is required for delete' }, { status: 400 });
    }
    const result = await adminOrders.deleteOne({ _id: new ObjectId(_id) });
    revalidateTag('orders');
    revalidateTag('products');
    return NextResponse.json({ success: true, Data: result, message: 'Admin order deleted successfully' });
  } catch (error) {
    console.error('Error deleting admin order:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete admin order' }, { status: 500 });
  }
} // End of DELETE function