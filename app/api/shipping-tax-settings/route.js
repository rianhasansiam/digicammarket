import { NextResponse } from "next/server";
import { getCollection } from "../../../lib/mongodb";
import { revalidateTag } from 'next/cache';
import { checkOrigin, isAdmin, forbiddenResponse } from '../../../lib/security';

// Schema for shipping and tax settings
const ShippingTaxSettings = {
  _id: "shipping_tax_settings", // Fixed ID to ensure single document
  shippingSettings: {
    shippingCharge: 15.99, // Fixed shipping cost
    enabled: true
  },
  taxSettings: {
    taxRate: 8.25, // Tax percentage
    enabled: true,
    taxName: "Sales Tax"
  },
  lastUpdated: new Date()
};

// GET - Fetch current shipping and tax settings
export async function GET(request) {
  try {
    const collection = await getCollection('shippingTaxSettings');
    
    let settings = await collection.findOne({ _id: "shipping_tax_settings" });
    
    // If no settings exist, create default settings
    if (!settings) {
      await collection.insertOne(ShippingTaxSettings);
      settings = ShippingTaxSettings;
    }
    
    return NextResponse.json({
      success: true,
      data: settings
    });
    
  } catch (error) {
    console.error("Error fetching shipping and tax settings:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to fetch shipping and tax settings" 
      },
      { status: 500 }
    );
  }
}

// PUT - Update shipping and tax settings (Admin only)
export async function PUT(request) {
  try {
    const originCheck = checkOrigin(request);
    if (originCheck) return originCheck;

    const admin = await isAdmin();
    if (!admin) {
      return forbiddenResponse('Only admins can update shipping and tax settings');
    }

    const body = await request.json();
    const { shippingSettings, taxSettings } = body;
    
    // Validate input
    if (!shippingSettings && !taxSettings) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Either shipping or tax settings must be provided" 
        },
        { status: 400 }
      );
    }
    
    const collection = await getCollection('shippingTaxSettings');
    
    const updateData = {
      lastUpdated: new Date()
    };
    
    if (shippingSettings) {
      updateData.shippingSettings = {
        shippingCharge: Number(shippingSettings.shippingCharge) || 15.99,
        enabled: Boolean(shippingSettings.enabled)
      };
    }
    
    if (taxSettings) {
      updateData.taxSettings = {
        taxRate: Number(taxSettings.taxRate) || 0,
        enabled: Boolean(taxSettings.enabled),
        taxName: taxSettings.taxName || "Sales Tax"
      };
    }
    
    const result = await collection.updateOne(
      { _id: "shipping_tax_settings" },
      { $set: updateData },
      { upsert: true }
    );
    
    if (result.acknowledged) {
      // Fetch updated settings
      const updatedSettings = await collection.findOne({ _id: "shipping_tax_settings" });
      
      revalidateTag('shippingTaxSettings');
      return NextResponse.json({
        success: true,
        message: "Shipping and tax settings updated successfully",
        data: updatedSettings
      });
    } else {
      return NextResponse.json(
        { 
          success: false, 
          error: "Failed to update settings" 
        },
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error("Error updating shipping and tax settings:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to update shipping and tax settings" 
      },
      { status: 500 }
    );
  }
}