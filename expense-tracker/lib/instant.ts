import { init } from "@instantdb/react";

export const APP_ID = process.env.NEXT_PUBLIC_INSTANT_APP_ID || "your_instantdb_app_id";

// ─── Data Models ────────────────────────────────────────────────────────────

export type User = {
  id: string;
  email: string;
  passwordHash: string;
  monthlyBudget: number;
  createdAt: string;
};

export type Expense = {
  id: string;
  userId: string;
  amount: number;
  category: string;
  merchant: string;
  date: string;
  month?: string;
  createdAt: string;
};

export type Receipt = {
  id: string;
  userId: string;
  imageUrl: string;
  extractedText: string;
  amount: number;
  merchant: string;
  category: string;
  date: string;
  month: string;
  title: string;
  processed: boolean;
  createdAt: string;
};

export type Insight = {
  id: string;
  userId: string;
  summary: string;
  tips: string[];
  createdAt: string;
};

export type SavingsGoal = {
  id: string;
  userId: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string;
  createdAt: string;
};

export type UserSettings = {
  id: string;
  userId: string;
  currency: string;          // "₹" | "$" | "€" | "£"
  monthlyBudget: number;
  theme: string;             // "light" | "dark"
  categories: string;        // JSON-stringified string[]
  aiMode: string;            // "normal" | "strict" | "aggressive"
};

// ─── Default Values ──────────────────────────────────────────────────────────

export const DEFAULT_CATEGORIES = [
  "Food",
  "Travel",
  "Shopping",
  "Bills",
  "Health",
  "Entertainment",
  "Others",
];

export const DEFAULT_SETTINGS: Omit<UserSettings, "id" | "userId"> = {
  currency: "₹",
  monthlyBudget: 50000,
  theme: "light",
  categories: JSON.stringify(DEFAULT_CATEGORIES),
  aiMode: "normal",
};

// ─── Frontend Client ─────────────────────────────────────────────────────────
// @ts-ignore - plain init without schema generic works fine at runtime
export const db = init({ appId: APP_ID });
