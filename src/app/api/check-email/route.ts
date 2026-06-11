import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    if (!email) {
      return NextResponse.json({ success: false, error: "Email required" }, { status: 400 });
    }

    const cleanedEmail = email.trim().toLowerCase();
    
    // Get OAuth token from service account
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (!serviceAccountKey) {
      return NextResponse.json({ success: false, error: "Server config error" }, { status: 500 });
    }

    const serviceAccount = JSON.parse(serviceAccountKey);

    // Use jose to sign — install jose: npm install jose
    const { SignJWT, importPKCS8 } = await import("jose");
    const privateKey = await importPKCS8(serviceAccount.private_key, "RS256");
    const jwt = await new SignJWT({ 
      iss: serviceAccount.client_email,
      scope: "https://www.googleapis.com/auth/cloud-platform",
      aud: "https://oauth2.googleapis.com/token",
    })
      .setProtectedHeader({ alg: "RS256" })
      .setIssuedAt()
      .setExpirationTime("1h")
      .sign(privateKey);

    // Exchange JWT for access token
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
    });
    
    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;
    const projectId = serviceAccount.project_id;

    // 1. Check Firebase Auth (Identity Toolkit API)
    let authExists = false;
    try {
      const authLookupRes = await fetch(
        `https://identitytoolkit.googleapis.com/v1/projects/${projectId}/accounts:lookup`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            email: [cleanedEmail],
          }),
        }
      );
      
      if (authLookupRes.ok) {
        const authData = await authLookupRes.json();
        authExists = Array.isArray(authData.users) && authData.users.length > 0;
      } else {
        console.warn("Identity Toolkit lookup failed:", await authLookupRes.text());
      }
    } catch (authErr) {
      console.error("Auth check error:", authErr);
    }

    // 2. Check Firestore
    let firestoreExists = false;
    try {
      const queryRes = await fetch(
        `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:runQuery`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            structuredQuery: {
              from: [{ collectionId: "users" }],
              where: {
                fieldFilter: {
                  field: { fieldPath: "email" },
                  op: "EQUAL",
                  value: { stringValue: cleanedEmail },
                },
              },
              limit: 1,
            },
          }),
        }
      );

      const results = await queryRes.json();
      firestoreExists = Array.isArray(results) && results.some(r => r.document);
    } catch (fsErr) {
      console.error("Firestore check error:", fsErr);
    }

    const exists = authExists || firestoreExists;

    return NextResponse.json({ success: true, exists });
  } catch (error: any) {
    console.error("check-email error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
