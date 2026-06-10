import { NextRequest, NextResponse } from "next/server";
import { getDocument, updateDocument } from "@/lib/firestore-rest";

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Verification token is required." },
        { status: 400 }
      );
    }

    // 1. Fetch token document from Firestore using REST API
    const tokenDoc = await getDocument("emailVerifications", token);

    if (!tokenDoc.exists || !tokenDoc.data) {
      return NextResponse.json(
        { success: false, error: "Invalid verification link. Token not found." },
        { status: 404 }
      );
    }

    const tokenData = tokenDoc.data;

    // 2. Validate expiration and usage
    if (tokenData.used) {
      return NextResponse.json(
        { success: false, error: "This link has already been used to verify your account." },
        { status: 400 }
      );
    }

    // expiresAt comes back as an ISO string from the REST API
    const expiresAt = new Date(tokenData.expiresAt as string);
    if (new Date() > expiresAt) {
      return NextResponse.json(
        { success: false, error: "This verification link has expired (expired after 15 minutes)." },
        { status: 400 }
      );
    }

    // 3. Mark token as used
    await updateDocument("emailVerifications", token, {
      used: true,
      usedAt: new Date().toISOString(),
    });

    // 4. Set user as emailVerified
    const userId = tokenData.userId as string;
    await updateDocument("users", userId, {
      emailVerified: true,
      emailVerifiedAt: new Date().toISOString(),
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
