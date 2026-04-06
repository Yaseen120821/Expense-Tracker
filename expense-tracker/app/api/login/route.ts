import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { adminDb } from "@/lib/instant-admin";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Step 1: Fetch user by email
    const queryRes = await adminDb.query({
      users: { $: { where: { email } } },
    });

    const user = queryRes.users?.[0];

    if (!user || !user.passwordHash) {
      return NextResponse.json(
        { error: "No account found with this email. Please sign up." },
        { status: 401 }
      );
    }

    // Step 2: Compare password against stored hash
    const isValid = await bcrypt.compare(password, user.passwordHash);

    if (!isValid) {
      return NextResponse.json(
        { error: "Incorrect password. Please try again." },
        { status: 401 }
      );
    }

    // Step 3: Create InstantDB session token
    const instantToken = await adminDb.auth.createToken({ email });

    return NextResponse.json({ success: true, instantToken, userId: user.id });
  } catch (error: any) {
    console.error("[login]", error);
    return NextResponse.json(
      { error: error.message || "Login failed" },
      { status: 500 }
    );
  }
}
