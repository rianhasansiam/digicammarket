import { NextResponse } from 'next/server';
import { getCollection } from '../../../../lib/mongodb';
import { ObjectId } from 'mongodb';
import { revalidateTag } from 'next/cache';

// DELETE - Delete specific contact by ID
export async function DELETE(request, { params }) {
  try {
    // ✅ FIX: Await params in Next.js 15
    const { id } = await params;
    
    // Validate ObjectId
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ 
        success: false,
        error: "Invalid contact ID" 
      }, { status: 400 });
    }

    // Get the contacts collection
    const contacts = await getCollection('allContacts');
    
    // Delete the contact
    const result = await contacts.deleteOne({ _id: new ObjectId(id) });
    
    if (result.deletedCount === 0) {
      return NextResponse.json({ 
        success: false,
        error: "Contact not found" 
      }, { status: 404 });
    }

    revalidateTag('contacts');
    return NextResponse.json({
      success: true,
      message: "Contact deleted successfully"
    });

  } catch (error) {
    console.error("Error deleting contact:", error); 
    return NextResponse.json({ 
      success: false,
      error: "Failed to delete contact" 
    }, { status: 500 });
  }
}

// PATCH - Update contact status (mark as read/unread)
export async function PATCH(request, { params }) {
  try {
    // ✅ FIX: Await params in Next.js 15
    const { id } = await params;
    
    // Validate ObjectId
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ 
        success: false,
        error: "Invalid contact ID" 
      }, { status: 400 });
    }

    // Get the request body
    const body = await request.json();
    const { status } = body;

    // Validate status
    if (!['read', 'unread'].includes(status)) {
      return NextResponse.json({ 
        success: false,
        error: "Status must be 'read' or 'unread'" 
      }, { status: 400 });
    }

    // Get the contacts collection
    const contacts = await getCollection('allContacts');
    
    // Update the contact status
    const result = await contacts.updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          status: status,
          updatedAt: new Date()
        }
      }
    );
    
    if (result.matchedCount === 0) {
      return NextResponse.json({ 
        success: false,
        error: "Contact not found" 
      }, { status: 404 });
    }

    revalidateTag('contacts');
    return NextResponse.json({
      success: true,
      message: `Contact marked as ${status}`
    });

  } catch (error) {
    console.error("Error updating contact:", error); 
    return NextResponse.json({ 
      success: false,
      error: "Failed to update contact" 
    }, { status: 500 });
  }
}