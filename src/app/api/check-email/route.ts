import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    if (!email) {
      return NextResponse.json({ success: false, error: "Email required" }, { status: 400 });
    }

    const cleanedEmail = email.trim().toLowerCase();
    let exists = false;

    try {
      await adminAuth.getUserByEmail(cleanedEmail);
      exists = true;
    } catch (err: any) {
      if (err.code === "auth/user-not-found") {
        exists = false;
      } else {
        throw err;
      }
    }

    return NextResponse.json({ success: true, exists });
  } catch (error: any) {
    console.error("check-email error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
