import { NextRequest, NextResponse } from "next/server";
import { queryCollection } from "@/lib/firestore-rest";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { success: false, error: "Email field is required." },
        { status: 400 }
      );
    }

    const cleanedEmail = email.trim().toLowerCase();

    // Query the users collection using Firestore REST API
    const results = await queryCollection(
      "users",
      "email",
      "EQUAL",
      cleanedEmail,
      1
    );

    return NextResponse.json({
      success: true,
      exists: results.length > 0,
    });
  } catch (error: any) {
    console.error("API error in check-email:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to check if email exists." },
      { status: 500 }
    );
  }
}
