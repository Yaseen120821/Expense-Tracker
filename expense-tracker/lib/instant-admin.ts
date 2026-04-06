import { init } from "@instantdb/admin";

// These are server-side only — never exposed to the browser
const APP_ID = process.env.NEXT_PUBLIC_INSTANT_APP_ID || "";
const ADMIN_TOKEN = process.env.INSTANT_ADMIN_TOKEN || "";

if (!APP_ID || !ADMIN_TOKEN) {
  console.warn("InstantDB admin credentials not set in environment variables.");
}

// Initialize Backend Admin Client for secure server-side operations
export const adminDb = init({
  appId: APP_ID,
  adminToken: ADMIN_TOKEN,
});
