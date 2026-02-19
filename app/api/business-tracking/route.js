import { NextResponse } from 'next/server';
import { getCollection } from '../../../lib/mongodb';
import { checkOrigin, isAdmin, forbiddenResponse, unauthorizedResponse } from '../../../lib/security';
import { auth } from '../../../lib/auth';
import { revalidateTag } from 'next/cache';

// =======================
// GET - Fetch revenue and investment totals (Admin only)
// =======================
export async function GET(request) {
  try {
    // Check origin
    const originCheck = checkOrigin(request);
    if (originCheck) return originCheck;

    // Check if user is admin
    const admin = await isAdmin();
    if (!admin) {
      return forbiddenResponse('Only admins can view business tracking');
    }

    // Get business tracking collection
    try {
      const collection = await getCollection('businessTracking');
      
      if (!collection) {
        return NextResponse.json({
          totalRevenue: 0,
          totalInvestment: 0,
          entries: []
        }, { status: 200 });
      }

      // Fetch all entries
      const entries = await collection
        .find({})
        .sort({ createdAt: -1 })
        .toArray();

      // Calculate totals
      const totalRevenue = entries
        .filter(e => e.type === 'revenue')
        .reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);

      const totalInvestment = entries
        .filter(e => e.type === 'investment')
        .reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);

      return NextResponse.json({
        totalRevenue,
        totalInvestment,
        entries
      }, { status: 200 });
    } catch (dbError) {
      console.error('[Business Tracking] Database error:', dbError);
      return NextResponse.json({
        success: false,
        error: 'Database error fetching business tracking data'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('[Business Tracking] Error fetching:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch business tracking data'
    }, { status: 500 });
  }
}

// =======================
// POST - Add revenue or investment entry (Admin only)
// =======================
export async function POST(request) {
  try {
    // Check origin
    const originCheck = checkOrigin(request);
    if (originCheck) return originCheck;

    // Check if user is admin
    const admin = await isAdmin();
    if (!admin) {
      return forbiddenResponse('Only admins can add business tracking entries');
    }

    // Get authenticated user for createdBy field
    const session = await auth();
    if (!session?.user?.email) {
      return unauthorizedResponse('User authentication failed');
    }

    // Get request body
    let body;
    try {
      body = await request.json();
      console.log('[Business Tracking] Received POST request:', {
        type: body.type,
        amount: body.amount,
        hasDescription: !!body.description,
        date: body.date
      });
    } catch (parseError) {
      console.error('[Business Tracking] JSON parse error:', parseError);
      return NextResponse.json(
        { success: false, error: 'Invalid request body' },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!body.type || !body.amount || !body.description) {
      console.error('[Business Tracking] Missing required fields:', {
        hasType: !!body.type,
        hasAmount: !!body.amount,
        hasDescription: !!body.description
      });
      return NextResponse.json(
        { success: false, error: 'Type, amount, and description are required' },
        { status: 400 }
      );
    }

    // Validate type
    if (!['revenue', 'investment'].includes(body.type)) {
      console.error('[Business Tracking] Invalid type:', body.type);
      return NextResponse.json(
        { success: false, error: 'Type must be either "revenue" or "investment"' },
        { status: 400 }
      );
    }

    // Validate amount
    const amount = parseFloat(body.amount);
    if (isNaN(amount) || amount <= 0) {
      console.error('[Business Tracking] Invalid amount:', body.amount, 'parsed:', amount);
      return NextResponse.json(
        { success: false, error: 'Amount must be a positive number' },
        { status: 400 }
      );
    }

    // Create entry document
    const entryData = {
      type: body.type,
      amount: amount,
      description: body.description.trim(),
      date: body.date || new Date().toISOString().split('T')[0],
      createdBy: session.user.email,
      createdAt: new Date().toISOString()
    };

    console.log('[Business Tracking] Attempting to insert entry:', entryData);

    // Insert into database
    try {
      const collection = await getCollection('businessTracking');
      if (!collection) {
        console.error('[Business Tracking] Failed to get collection');
        return NextResponse.json(
          { success: false, error: 'Database connection error' },
          { status: 500 }
        );
      }

      console.log('[Business Tracking] Got collection, inserting document...');
      const result = await collection.insertOne(entryData);
      console.log('[Business Tracking] Insert successful, ID:', result.insertedId);

      revalidateTag('businessTracking');
      return NextResponse.json(
        {
          success: true,
          message: `${body.type === 'revenue' ? 'Revenue' : 'Investment'} added successfully`,
          data: { _id: result.insertedId, ...entryData }
        },
        { status: 201 }
      );
    } catch (dbError) {
      console.error('[Business Tracking] Database error details:', {
        name: dbError.name,
        message: dbError.message,
        code: dbError.code,
        stack: dbError.stack
      });
      return NextResponse.json(
        { success: false, error: `Database error: ${dbError.message}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[Business Tracking] Outer error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    return NextResponse.json(
      { success: false, error: `Server error: ${error.message}` },
      { status: 500 }
    );
  }
}
