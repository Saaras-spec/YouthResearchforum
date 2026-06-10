import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Verification token is required." },
        { status: 400 }
      );
    }

    // 1. Fetch token document from Firestore using Admin SDK
    const tokenDocRef = adminDb.collection("emailVerifications").doc(token);
    const tokenDocSnap = await tokenDocRef.get();

    if (!tokenDocSnap.exists) {
      return NextResponse.json(
        { success: false, error: "Invalid verification link. Token not found." },
        { status: 404 }
      );
    }

    const tokenData = tokenDocSnap.data();
    if (!tokenData) {
      return NextResponse.json(
        { success: false, error: "Failed to parse token details." },
        { status: 500 }
      );
    }

    // 2. Validate expiration and usage
    if (tokenData.used) {
      return NextResponse.json(
        { success: false, error: "This link has already been used to verify your account." },
        { status: 400 }
      );
    }

    const expiresAt = tokenData.expiresAt.toDate ? tokenData.expiresAt.toDate() : new Date(tokenData.expiresAt);
    if (new Date() > expiresAt) {
      return NextResponse.json(
        { success: false, error: "This verification link has expired (expired after 15 minutes)." },
        { status: 400 }
      );
    }

    // 3. Perform atomic updates: mark token as used, set user as emailVerified
    await tokenDocRef.update({
      used: true,
      usedAt: new Date(),
    });

    const userDocRef = adminDb.collection("users").doc(tokenData.userId);
    await userDocRef.update({
      emailVerified: true,
      emailVerifiedAt: new Date(),
    });

    return NextResponse.json({ success: true, email: tokenData.email });
  } catch (error: any) {
    console.error("Token verification API error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to verify token." },
      { status: 500 }
    );
  }
}
