import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { adminDb } from "@/lib/instant-admin";

export async function POST(req: Request) {
  try {
    const { email, code, password } = await req.json();

    if (!email || !code || !password) {
      return NextResponse.json(
        { error: "Email, OTP code, and password are required" },
        { status: 400 }
      );
    }

    // Step 1: Check if user already exists in our custom users collection
    const existing = await adminDb.query({
      users: { $: { where: { email } } },
    });

    if (existing.users && existing.users.length > 0) {
      return NextResponse.json(
        { error: "An account with this email already exists. Please sign in." },
        { status: 400 }
      );
    }

    // Step 2: Verify the magic code using InstantDB admin SDK
    // checkMagicCode verifies the OTP and returns the user
    try {
      await adminDb.auth.checkMagicCode(email, code);
    } catch (otpError: any) {
      return NextResponse.json(
        { error: "Invalid or expired OTP code. Please try again." },
        { status: 401 }
      );
    }

    // Step 3: Hash password with bcrypt (cost factor 10 — industry standard, ~300ms)
    const passwordHash = await bcrypt.hash(password, 10);

    // Step 4: Create user record in our custom users collection
    const userId = crypto.randomUUID();
    await adminDb.transact([
      adminDb.tx.users[userId].update({
        email,
        passwordHash,
        monthlyBudget: 50000,
        createdAt: new Date().toISOString(),
      }),
    ]);

    // Step 5: Create a session token for the new user
    const instantToken = await adminDb.auth.createToken({ email });

    return NextResponse.json({ success: true, instantToken, userId });
  } catch (error: any) {
    console.error("[verify-otp]", error);
    return NextResponse.json(
      { error: error.message || "Signup failed. Please try again." },
      { status: 500 }
    );
  }
}
