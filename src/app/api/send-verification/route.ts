import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { adminDb } from "@/lib/firebase-admin";
import nodemailer from "nodemailer";

export async function POST(request: NextRequest) {
  try {
    const { email, userId, name } = await request.json();

    if (!email || !userId) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: email and userId." },
        { status: 400 }
      );
    }

    // Secure: Validate user document in Firestore to prevent unauthorized email spamming
    const userDocSnap = await adminDb.collection("users").doc(userId).get();
    if (!userDocSnap.exists) {
      return NextResponse.json(
        { success: false, error: "Access denied. User record not found." },
        { status: 404 }
      );
    }

    const userData = userDocSnap.data();
    if (!userData || userData.email.trim().toLowerCase() !== email.trim().toLowerCase()) {
      return NextResponse.json(
        { success: false, error: "Access denied. Email mismatch." },
        { status: 400 }
      );
    }

    if (userData.emailVerified === true) {
      return NextResponse.json(
        { success: false, error: "This email address is already verified." },
        { status: 400 }
      );
    }

    // 1. Generate unique token
    const token = crypto.randomUUID();

    // 2. Save token inside Firestore with 15-minute expiration
    await adminDb.collection("emailVerifications").doc(token).set({
      token,
      email: email.trim().toLowerCase(),
      userId,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
      used: false,
    });

    // 3. Setup Nodemailer Transporter using Gmail SMTP credentials
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;
    const emailFrom = process.env.EMAIL_FROM || "noreply@youthresearchforum.com";

    if (!emailUser || !emailPass) {
      console.warn("SMTP email credentials are not fully configured in environment variables.");
      return NextResponse.json(
        { success: false, error: "SMTP server is not configured. Please check environment variables." },
        { status: 500 }
      );
    }

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: emailUser,
        pass: emailPass,
      },
    });

    // 4. Calculate Origin & Verification URL
    const protocol = request.headers.get("x-forwarded-proto") || "http";
    const host = request.headers.get("host") || "localhost:3000";
    const origin = `${protocol}://${host}`;
    const verifyUrl = `${origin}/verify?token=${token}`;

    // 5. Construct Email HTML Body
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Verify your Youth Research Forum account</title>
      </head>
      <body style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #ffffff; color: #161616; margin: 0; padding: 0; -webkit-font-smoothing: antialiased;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <!-- Header Logo -->
          <tr>
            <td align="center" style="padding: 20px 0 40px 0;">
              <img src="https://youthresearchforum.org/logo.jpg" alt="Youth Research Forum Logo" style="max-width: 180px; width: 100%; height: auto; display: block; margin: 0 auto;" />
            </td>
          </tr>
          
          <!-- Heading -->
          <tr>
            <td align="center" style="padding-bottom: 20px;">
              <h1 style="font-family: Georgia, serif; font-size: 26px; font-weight: 700; color: #161616; margin: 0; line-height: 1.3;">Welcome to Youth Research Forum!</h1>
            </td>
          </tr>

          <!-- Message 1 -->
          <tr>
            <td align="center" style="padding-bottom: 30px;">
              <p style="font-size: 15px; line-height: 24px; color: #5a5a5a; margin: 0; max-width: 480px; font-weight: 300; text-align: center;">
                Click the link below to validate your email address and complete your registration. You will need to verify your email before your account is activated.
              </p>
            </td>
          </tr>

          <!-- CTA Button -->
          <tr>
            <td align="center" style="padding-bottom: 35px;">
              <table border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="background-color: #930B51; border-radius: 2px;">
                    <a href="${verifyUrl}" target="_blank" style="display: inline-block; padding: 14px 32px; font-size: 13px; font-weight: bold; color: #ffffff; text-decoration: none; text-transform: uppercase; letter-spacing: 0.1em; font-family: monospace;">Confirm your Email Address</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Intro -->
          <tr>
            <td align="center" style="padding-bottom: 30px; border-bottom: 1px solid #e6e2da;">
              <p style="font-size: 14px; line-height: 22px; color: #5a5a5a; margin: 0; max-width: 460px; font-style: italic; text-align: center;">
                As a member you can submit articles, engage with research, and be part of national and international discussions.
              </p>
            </td>
          </tr>

          <!-- Footer/Support & Sign-off -->
          <tr>
            <td align="center" style="padding-top: 30px; padding-bottom: 20px;">
              <p style="font-size: 13px; line-height: 20px; color: #5a5a5a; margin: 0 0 16px 0; text-align: center;">
                If you have any problems or questions, contact us at <a href="mailto:support@youthresearchforum.com" style="color: #930B51; text-decoration: none; font-weight: 500;">support@youthresearchforum.com</a>
              </p>
              <p style="font-size: 13px; color: #5a5a5a; margin: 0 0 24px 0; font-style: italic; font-weight: 500; text-align: center;">
                The Youth Research Forum Team
              </p>
              <p style="font-size: 12px; margin: 0 0 8px 0; text-align: center;">
                <a href="https://youthresearchforum.org" target="_blank" style="color: #930B51; text-decoration: underline; font-weight: bold; letter-spacing: 0.05em; font-family: monospace;">https://youthresearchforum.org</a>
              </p>
              <p style="font-size: 11px; color: #aaaaaa; margin: 0; text-align: center;">
                If you did not create this account, please ignore this email.
              </p>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    // 6. Send Mail
    await transporter.sendMail({
      from: `"Youth Research Forum" <${emailFrom}>`,
      to: email.trim().toLowerCase(),
      subject: "Verify your Youth Research Forum account",
      html: htmlContent,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Nodemailer API error sending verification email:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to send email." },
      { status: 500 }
    );
  }
}
