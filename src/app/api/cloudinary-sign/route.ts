import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const timestamp = Math.round(new Date().getTime() / 1000);
    const preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "youth_research_uploads";
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    const apiKey = process.env.CLOUDINARY_API_KEY;

    if (!apiSecret || !apiKey) {
      return NextResponse.json(
        { success: false, error: "Cloudinary credentials not configured on the server." },
        { status: 500 }
      );
    }

    // Sort parameters alphabetically: timestamp, upload_preset
    const parameterString = `timestamp=${timestamp}&upload_preset=${preset}`;
    
    // Append API Secret
    const stringToSign = parameterString + apiSecret;

    // Generate SHA-1 hash
    const signature = crypto
      .createHash("sha1")
      .update(stringToSign)
      .digest("hex");

    return NextResponse.json({
      success: true,
      signature,
      timestamp,
      apiKey,
      preset,
      cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "desdc0gbb"
    });
  } catch (error: any) {
    console.error("Cloudinary signing error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to generate upload signature." },
      { status: 500 }
    );
  }
}
