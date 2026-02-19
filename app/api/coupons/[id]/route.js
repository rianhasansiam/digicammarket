import { NextResponse } from 'next/server';
import { getCollection } from '../../../../lib/mongodb';
import { revalidateTag } from 'next/cache';

// PUT - Update coupon by ID
export async function PUT(request, { params }) {
  try {
    // ✅ FIX: Await params in Next.js 15
    const { id } = await params;
    const coupons = await getCollection('allCoupons');
    const body = await request.json();

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Coupon ID is required for update'
      }, { status: 400 });
    }

    const { ObjectId } = (await import('mongodb'));
    const result = await coupons.updateOne(
      { _id: new ObjectId(id) },
      { $set: { ...body, updatedAt: new Date() } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({
        success: false,
        error: 'Coupon not found'
      }, { status: 404 });
    }

    revalidateTag('coupons');
    return NextResponse.json({
      success: true,
      Data: result,
      message: 'Coupon updated successfully'
    });

  } catch (error) {
    console.error('Error updating coupon:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update coupon'
    }, { status: 500 });
  }
}

// DELETE - Delete coupon by ID
export async function DELETE(request, { params }) {
  try {
    // ✅ FIX: Await params in Next.js 15
    const { id } = await params;
    const coupons = await getCollection('allCoupons');

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Coupon ID is required for deletion'
      }, { status: 400 });
    }

    const { ObjectId } = (await import('mongodb'));
    const result = await coupons.deleteOne({
      _id: new ObjectId(id)
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({
        success: false,
        error: 'Coupon not found'
      }, { status: 404 });
    }

    revalidateTag('coupons');
    return NextResponse.json({
      success: true,
      Data: result,
      message: 'Coupon deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting coupon:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to delete coupon'
    }, { status: 500 });
  }
}