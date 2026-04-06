import { NextResponse } from "next/server";
import { adminDb } from "@/lib/instant-admin";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
    }

    // Use InstantDB Admin to send OTP to user's email
    await adminDb.auth.sendMagicCode(email);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[send-otp]", error);
    return NextResponse.json({ error: error.message || "Failed to send OTP" }, { status: 500 });
  }
}
