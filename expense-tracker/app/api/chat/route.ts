import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const SYSTEM_PROMPT = `You are a professional, intelligent AI Financial Advisor named "Aria".
Your primary goal is to help the user with:
- Budgeting and expense tracking
- Saving money and achieving financial goals  
- Investment basics and stock market queries

RULES:
- Give clear, simple, and practical advice using emojis appropriately.
- Do NOT give guaranteed returns or risky/illegal suggestions.
- Keep answers concise but highly useful.
- If the user asks about a specific stock (e.g. "AAPL price", "Tesla stock trend", "Show Apple stock"), you MUST append a simulated stock widget at the END of your response using EXACTLY this format on its own line:
[STOCK_WIDGET: {"ticker": "AAPL", "price": 185.50, "trend": [178, 180, 182, 179, 183, 185, 185.5]}]
Replace ticker, price, and trend with realistic values for the requested stock. The trend array must have exactly 7 numbers.`;

export async function POST(req: Request) {
  try {
    const { messages, context } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Messages array required" }, { status: 400 });
    }

    const { budget = 0, currency = "₹", expenses = [], savings = [] } = context || {};

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Build conversation history in Gemini format.
    // We embed the system prompt as the very first user/model exchange so it works
    // with all SDK versions without needing systemInstruction support.
    const contextNote = `(Context: User monthly budget is ${currency}${budget.toLocaleString()}, they have ${expenses.length} tracked transactions and ${savings.length} savings goals.)`;
    
    const history: { role: "user" | "model"; parts: { text: string }[] }[] = [
      {
        role: "user",
        parts: [{ text: `${SYSTEM_PROMPT}\n\n${contextNote}\n\nPlease acknowledge that you are ready.` }],
      },
      {
        role: "model",
        parts: [{ text: "Hello! I'm Aria, your AI Financial Advisor. I'm ready to help you optimize your budget, analyze expenses, and explore financial opportunities. What would you like to discuss today? 💰" }],
      },
    ];

    // Append the actual conversation (skipping the UI's initial AI greeting)
    const conversationMessages = messages.filter((m: any) => m.id !== "intro");
    
    for (const m of conversationMessages.slice(0, -1)) {
      // Skip if it would cause two consecutive messages of the same role
      const lastRole = history[history.length - 1]?.role;
      const msgRole = m.role === "ai" ? "model" : "user";
      if (lastRole === msgRole) continue;
      
      history.push({
        role: msgRole,
        parts: [{ text: m.content }],
      });
    }

    const chat = model.startChat({ history });

    // The last message is what we send now
    const lastMessage = messages[messages.length - 1].content;
    const result = await chat.sendMessage(lastMessage);
    const text = result.response.text();

    return NextResponse.json({ success: true, text });
  } catch (error: any) {
    console.error("[chat api error]", error?.message, error?.status);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || "Failed to generate AI response.",
        details: String(error)
      },
      { status: 500 }
    );
  }
}
