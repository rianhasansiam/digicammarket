import { NextResponse } from 'next/server';
import { getCollection } from '../../../lib/mongodb';
import { ObjectId } from 'mongodb';
import { revalidateTag } from 'next/cache';
import { checkOrigin, isAdmin, forbiddenResponse } from '../../../lib/security';

// GET - Get all contacts (Admin only)
export async function GET(request) {
  try {
    const originCheck = checkOrigin(request);
    if (originCheck) return originCheck;

    const admin = await isAdmin();
    if (!admin) {
      return forbiddenResponse('Only admins can view contact messages');
    }

    // Get the contacts collection
    const contacts = await getCollection('allContacts');
    
    // Find all contacts sorted by creation date (newest first)
    const allContacts = await contacts.find({}).sort({ createdAt: -1 }).toArray();
    
    return NextResponse.json({
      success: true,
      Data: allContacts
    });

  } catch (error) {
    console.error("Error fetching contacts:", error); 
    return NextResponse.json({ 
      success: false,
      error: "Failed to fetch contacts" 
    }, { status: 500 });
  }
} // End of GET function

// POST - Create new contact
export async function POST(request) {
  try {
    // Get the contacts collection
    const contacts = await getCollection('allContacts');
    
    // Get the request body
    const body = await request.json();
    
    // Validate required fields
    if (!body.name || !body.email || !body.message) {
      return NextResponse.json({ 
        success: false, 
        error: 'Name, email, and message are required' 
      }, { status: 400 });
    }
    
    // Add metadata
    const contactData = {
      name: String(body.name).trim().substring(0, 200),
      email: String(body.email).trim().toLowerCase().substring(0, 200),
      phone: body.phone ? String(body.phone).trim().substring(0, 20) : undefined,
      subject: body.subject ? String(body.subject).trim().substring(0, 300) : undefined,
      message: String(body.message).trim().substring(0, 5000),
      createdAt: new Date(),
      status: 'unread'
    };
    
    // Insert the new contact
    const result = await contacts.insertOne(contactData);

    revalidateTag('contacts');
    return NextResponse.json({
      success: true,
      Data: { ...contactData, _id: result.insertedId },
      message: "Contact message saved successfully"
    });

  } catch (error) {
    console.error("Error creating contact:", error); 
    return NextResponse.json({ 
      success: false,
      error: "Failed to save contact message" 
    }, { status: 500 });
  }
} // End of POST function
