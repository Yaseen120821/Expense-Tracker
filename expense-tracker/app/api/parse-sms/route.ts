import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

// Rule-based fallback classifier — zero API calls, instant, offline
function ruleBasedClassify(merchant: string, type: string): { category: string; confidence: number } {
  const m = (merchant || "").toLowerCase();
  if (type === "credit") {
    if (/salary|payroll|ctc/.test(m)) return { category: "Salary", confidence: 0.9 };
    if (/refund|cashback/.test(m)) return { category: "Refund", confidence: 0.85 };
    return { category: "Transfer", confidence: 0.6 };
  }
  if (/uber|ola|rapido|taxi|auto|cab|metro|bus|train|irctc/.test(m)) return { category: "Transport", confidence: 0.9 };
  if (/swiggy|zomato|pizza|burger|kfc|mcdonald|restaurant|food|cafe|hotel|dhaba/.test(m)) return { category: "Food", confidence: 0.9 };
  if (/amazon|flipkart|myntra|mall|shop|market|store|blinkit|zepto/.test(m)) return { category: "Shopping", confidence: 0.85 };
  if (/netflix|spotify|hotstar|prime|youtube|movie|cinema/.test(m)) return { category: "Entertainment", confidence: 0.9 };
  if (/rent|housing|electricity|water|gas|bill|maintenance/.test(m)) return { category: "Utilities", confidence: 0.85 };
  if (/hospital|pharmacy|doctor|clinic|medicine|health/.test(m)) return { category: "Health", confidence: 0.9 };
  if (/school|college|university|course|udemy|education/.test(m)) return { category: "Education", confidence: 0.85 };
  if (/atm|cash|withdrawal/.test(m)) return { category: "Cash", confidence: 0.8 };
  return { category: "General", confidence: 0.5 };
}

async function classifyWithRetry(prompt: string, maxRetries = 2): Promise<string> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await model.generateContent(prompt);
      return result.response.text().trim();
    } catch (err: any) {
      const isRateLimit = err?.message?.includes("429") || err?.message?.includes("quota") || err?.message?.includes("retryDelay");
      if (isRateLimit && attempt < maxRetries) {
        // Wait and retry
        await new Promise(r => setTimeout(r, 3000 * (attempt + 1)));
        continue;
      }
      throw err;
    }
  }
  throw new Error("Max retries exceeded");
}

export async function POST(req: Request) {
  try {
    const { amount, type, merchant } = await req.json();

    if (!amount || !type) {
      return NextResponse.json({ error: "Amount and type are required" }, { status: 400 });
    }

    const systemPrompt = `You are a financial categorizer AI.
Your ONLY job is to take an extracted transaction (amount, type, and merchant/sender) and categorize it.
You MUST output EXACTLY valid JSON, with no other text, markdown, or backticks.

Output format:
{
  "category": "String (e.g., Food, Transport, Rent, Salary, Entertainment, Shopping)",
  "confidence": Number (0 to 1)
}

Rules:
- Give a standard, short category name (1 or 2 words).
- If it's a 'credit' (income), category might be 'Salary', 'Refund', 'Transfer', 'Investment', etc.
- If the merchant is unknown or "UPI", guess "General" or "Transfer" with lower confidence.
- Be highly accurate.`;

    const userPrompt = `Transaction Detail:
- Type: ${type}
- Amount: ${amount}
- Merchant/Sender: ${merchant || "Unknown"}`;

    const prompt = `${systemPrompt}\n\n${userPrompt}`;

    let category: string;
    let confidence: number;

    try {
      let outputText = await classifyWithRetry(prompt);

      // Remove markdown code blocks if the AI accidentally adds them
      if (outputText.startsWith("```json")) {
        outputText = outputText.replace(/^```json\n?/, "").replace(/```$/, "").trim();
      } else if (outputText.startsWith("```")) {
        outputText = outputText.replace(/^```\n?/, "").replace(/```$/, "").trim();
      }

      const parsed = JSON.parse(outputText);
      category = parsed.category;
      confidence = parsed.confidence;
    } catch (aiErr: any) {
      // Gemini failed (rate limit, quota, network) — fall back to rule-based
      console.warn("[parse-sms] Gemini unavailable, using rule-based fallback:", aiErr?.message);
      const fallback = ruleBasedClassify(merchant, type);
      category = fallback.category;
      confidence = fallback.confidence;
    }

    return NextResponse.json({ success: true, category, confidence });

  } catch (error: any) {
    console.error("[parse-sms error]", error);
    return NextResponse.json(
      { success: false, error: "Failed to categorize transaction.", details: error?.message || error.toString() },
      { status: 500 }
    );
  }
}
