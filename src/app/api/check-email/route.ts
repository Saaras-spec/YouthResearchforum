import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

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

    // Query the users collection using adminDb (Admin SDK) to bypass security rules
    const snapshot = await adminDb
      .collection("users")
      .where("email", "==", cleanedEmail)
      .limit(1)
      .get();

    return NextResponse.json({
      success: true,
      exists: !snapshot.empty,
    });
  } catch (error: any) {
    console.error("API error in check-email:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to check if email exists." },
      { status: 500 }
    );
  }
}
