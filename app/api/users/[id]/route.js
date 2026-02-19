import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getCollection } from '../../../../lib/mongodb';
import { revalidateTag } from 'next/cache';

// DELETE - Delete user by ID
export async function DELETE(request, { params }) {
  try {
    // ✅ FIX: Await params in Next.js 15
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Validate ObjectId format
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid user ID format' },
        { status: 400 }
      );
    }

    const users = await getCollection('users');
    
    // Check if user exists
    const existingUser = await users.findOne({ _id: new ObjectId(id) });
    if (!existingUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Delete the user
    const result = await users.deleteOne({ _id: new ObjectId(id) });
    
    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Failed to delete user' },
        { status: 500 }
      );
    }

    // On-demand revalidation
    revalidateTag('users');

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully',
      deletedId: id
    });
    
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH - Update user by ID
export async function PATCH(request, { params }) {
  try {
    // ✅ FIX: Await params in Next.js 15
    const { id } = await params;
    const updateData = await request.json();
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Validate ObjectId format
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid user ID format' },
        { status: 400 }
      );
    }

    const users = await getCollection('users');
    
    // Check if user exists
    const existingUser = await users.findOne({ _id: new ObjectId(id) });
    if (!existingUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Prepare update fields - only allow certain fields to be updated
    const allowedUpdates = {};
    if (updateData.name) allowedUpdates.name = updateData.name;
    if (updateData.phone !== undefined) {
      // Allow empty string or valid phone number
      allowedUpdates.phone = updateData.phone === "" ? null : updateData.phone;
    }
    if (updateData.image) allowedUpdates.image = updateData.image;
    
    // Add update timestamp
    allowedUpdates.updatedAt = new Date();

    // Update the user
    const result = await users.updateOne(
      { _id: new ObjectId(id) },
      { $set: allowedUpdates }
    );
    
    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Get updated user data
    const updatedUser = await users.findOne({ _id: new ObjectId(id) });
    const { password, ...userWithoutPassword } = updatedUser;

    // On-demand revalidation
    revalidateTag('users');

    return NextResponse.json({
      success: true,
      message: 'User updated successfully',
      user: userWithoutPassword
    });
    
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET - Get specific user by ID
export async function GET(request, { params }) {
  try {
    // ✅ FIX: Await params in Next.js 15
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Validate ObjectId format
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid user ID format' },
        { status: 400 }
      );
    }

    const users = await getCollection('users');
    const user = await users.findOne({ _id: new ObjectId(id) });
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Remove password from response
    const { password, ...userWithoutPassword } = user;
    
    return NextResponse.json({
      success: true,
      user: userWithoutPassword
    });
    
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}