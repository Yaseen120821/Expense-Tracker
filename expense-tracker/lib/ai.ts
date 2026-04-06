import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export type InsightResult = {
  summary: string;
  tips: string[];
  warning: string | null;
};

export type AiMode = "normal" | "strict" | "aggressive";

export async function generateInsights(
  expenses: Record<string, number>,
  settings: {
    budget: number;
    currency: string;
    categories: string[];
    mode?: AiMode;
  }
): Promise<InsightResult> {
  const { budget, currency, categories, mode = "normal" } = settings;

  const modeInstruction =
    mode === "strict"
      ? "Be strict and direct about overspending. Use firm language."
      : mode === "aggressive"
      ? "Be very aggressive about saving. Challenge every expense category ruthlessly."
      : "Be helpful and encouraging while giving practical advice.";

  const expensesText =
    Object.keys(expenses).length > 0
      ? Object.entries(expenses)
          .map(([k, v]) => `${k}: ${currency}${v.toLocaleString()}`)
          .join("\n")
      : "No expenses recorded yet.";

  const prompt = `You are a smart financial advisor. ${modeInstruction}

User Monthly Budget: ${currency}${budget.toLocaleString()}
Currency: ${currency}
Configured Categories: ${categories.join(", ")}

Current Spending Breakdown:
${expensesText}

Total spent: ${currency}${Object.values(expenses).reduce((a, b) => a + b, 0).toLocaleString()}
Remaining budget: ${currency}${Math.max(budget - Object.values(expenses).reduce((a, b) => a + b, 0), 0).toLocaleString()}

Respond ONLY with a valid JSON object. No markdown, no explanation outside the JSON:
{
  "summary": "1-2 sentence summary of spending patterns",
  "tips": ["Specific actionable tip 1", "Specific actionable tip 2", "Specific actionable tip 3"],
  "warning": "Short overspending warning if total > 80% of budget, otherwise null"
}`;

  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: { responseMimeType: "application/json" },
  });

  const result = await model.generateContent(prompt);
  const raw = result.response.text();

  try {
    const parsed = JSON.parse(raw);
    return {
      summary: parsed.summary || "Unable to generate summary.",
      tips: Array.isArray(parsed.tips) ? parsed.tips.slice(0, 3) : [],
      warning: parsed.warning || null,
    };
  } catch {
    // Fallback if JSON parsing fails
    return {
      summary: "AI analysis completed. Check the tips below for guidance.",
      tips: [
        "Review your highest spending category.",
        "Set weekly spending limits for non-essential categories.",
        "Track daily expenses to stay within budget.",
      ],
      warning: null,
    };
  }
}
