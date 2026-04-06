import { NextResponse } from "next/server";
import { adminDb } from "@/lib/instant-admin";
import { generateInsights } from "@/lib/ai";
import type { AiMode } from "@/lib/ai";

export async function POST(req: Request) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }

    // Fetch expenses server-side
    const expensesRes = await adminDb.query({
      expenses: { $: { where: { userId } } },
    });
    const expenses = expensesRes.expenses || [];

    // Fetch user settings server-side
    const settingsRes = await adminDb.query({
      settings: { $: { where: { userId } } },
    });
    const settings = settingsRes.settings?.[0];

    // Parse settings with safe defaults
    const currency = settings?.currency || "₹";
    const budget = settings?.monthlyBudget || 50000;
    const aiMode = (settings?.aiMode || "normal") as AiMode;
    const categories: string[] = settings?.categories
      ? JSON.parse(settings.categories)
      : ["Food", "Travel", "Shopping", "Bills", "Health", "Entertainment", "Others"];

    // Aggregate expenses by category
    const categorized = expenses.reduce((acc, curr) => {
      const cat = curr.category || "Others";
      acc[cat] = (acc[cat] || 0) + curr.amount;
      return acc;
    }, {} as Record<string, number>);

    // Call Gemini AI
    const insight = await generateInsights(categorized, {
      budget,
      currency,
      categories,
      mode: aiMode,
    });

    // Persist insight to DB
    const insightId = crypto.randomUUID();
    await adminDb.transact([
      adminDb.tx.insights[insightId].update({
        userId,
        summary: insight.summary,
        tips: insight.tips,
        createdAt: new Date().toISOString(),
      }),
    ]);

    return NextResponse.json({ success: true, insight });
  } catch (error: any) {
    console.error("[insights]", error);

    // Return a graceful fallback instead of crashing the UI
    return NextResponse.json({
      success: false,
      insight: {
        summary: "AI insights are temporarily unavailable. Please try again later.",
        tips: [
          "Review your highest-spending category.",
          "Set a weekly spending limit for non-essential items.",
          "Track daily expenses to stay on budget.",
        ],
        warning: null,
      },
      error: error.message,
    });
  }
}
