import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    console.log("=== check-email API called ===");
    console.log("FIREBASE_API_KEY exists:", !!process.env.FIREBASE_API_KEY);
    console.log("NEXT_PUBLIC_FIREBASE_API_KEY exists:", !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY);

    if (!email) {
      return NextResponse.json(
        { success: false, error: "Email field is required." },
        { status: 400 }
      );
    }

    const cleanedEmail = email.trim().toLowerCase();
    const apiKey = process.env.FIREBASE_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "";

    if (!apiKey) {
      console.error("check-email: Firebase API key is not configured.");
      return NextResponse.json(
        { success: false, error: "Server configuration error." },
        { status: 500 }
      );
    }

    // Use Firebase Auth REST API (createAuthUri) to check if email exists
    // fetchSignInMethodsForEmail was deprecated and removed by Google
    const encodedKey = encodeURIComponent(apiKey);
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:createAuthUri?key=${encodedKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: cleanedEmail,
          continueUri: "https://youth-researchforum.vercel.app",
        }),
      }
    );

    if (!res.ok) {
      const errBody = await res.text();
      console.error("Firebase Auth API error:", res.status, errBody);
      return NextResponse.json(
        { success: false, error: "Failed to check email." },
        { status: 500 }
      );
    }

    const data = await res.json();
    console.log("Firebase Auth API response:", JSON.stringify(data));

    // createAuthUri returns registered: true if email exists
    // If registered field is missing/undefined, treat as not registered
    const exists = data.registered === true;
    console.log("User exists:", exists, "| registered field:", data.registered);

    return NextResponse.json({
      success: true,
      exists,
    });
  } catch (error: any) {
    console.error("API error in check-email:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to check if email exists." },
      { status: 500 }
    );
  }
}
