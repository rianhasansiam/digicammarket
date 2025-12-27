import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getCollection } from '../../../../lib/mongodb';
import { checkOrigin, isAdmin, forbiddenResponse } from '../../../../lib/security';

// GET - Get single sale by ID
export async function GET(request, { params }) {
  try {
    const originCheck = checkOrigin(request);
    if (originCheck) return originCheck;

    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ 
        success: false,
        error: "Invalid sale ID" 
      }, { status: 400 });
    }

    const sales = await getCollection('allSales');
    const sale = await sales.findOne({ _id: new ObjectId(id) });

    if (!sale) {
      return NextResponse.json({ 
        success: false,
        error: "Sale not found" 
      }, { status: 404 });
    }

    return NextResponse.json(sale);

  } catch (error) {
    console.error("Error fetching sale:", error);
    return NextResponse.json({ 
      success: false,
      error: "Failed to fetch sale" 
    }, { status: 500 });
  }
}

// PUT - Update sale (Admin only)
export async function PUT(request, { params }) {
  try {
    const originCheck = checkOrigin(request);
    if (originCheck) return originCheck;

    const admin = await isAdmin();
    if (!admin) {
      return forbiddenResponse('Only admins can update sales');
    }

    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ 
        success: false,
        error: "Invalid sale ID" 
      }, { status: 400 });
    }

    const sales = await getCollection('allSales');
    const body = await request.json();

    // Prepare update data
    const updateData = {
      ...body,
      updatedAt: new Date()
    };

    // Convert date strings to Date objects if present
    if (body.startDate) updateData.startDate = new Date(body.startDate);
    if (body.endDate) updateData.endDate = new Date(body.endDate);

    // Remove _id from update data if present
    delete updateData._id;

    const result = await sales.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateData },
      { returnDocument: 'after' }
    );

    if (!result) {
      return NextResponse.json({ 
        success: false,
        error: "Sale not found" 
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: result,
      message: "Sale updated successfully"
    });

  } catch (error) {
    console.error("Error updating sale:", error);
    return NextResponse.json({ 
      success: false,
      error: "Failed to update sale" 
    }, { status: 500 });
  }
}

// DELETE - Delete sale (Admin only)
export async function DELETE(request, { params }) {
  try {
    const originCheck = checkOrigin(request);
    if (originCheck) return originCheck;

    const admin = await isAdmin();
    if (!admin) {
      return forbiddenResponse('Only admins can delete sales');
    }

    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ 
        success: false,
        error: "Invalid sale ID" 
      }, { status: 400 });
    }

    const sales = await getCollection('allSales');
    const result = await sales.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json({ 
        success: false,
        error: "Sale not found" 
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Sale deleted successfully"
    });

  } catch (error) {
    console.error("Error deleting sale:", error);
    return NextResponse.json({ 
      success: false,
      error: "Failed to delete sale" 
    }, { status: 500 });
  }
}
