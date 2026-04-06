import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
  try {
    const { imageBase64, mimeType } = await req.json();

    if (!imageBase64) {
      return NextResponse.json({ error: "imageBase64 required" }, { status: 400 });
    }

    const systemPrompt = `Analyze the provided receipt image. 
Extract the total amount, merchant/store name, and the date of purchase.

Classify this expense into one of these categories: Food, Travel, Shopping, Bills, Health, Entertainment, Others.

Finally, create a short receipt name using the format: Merchant-YYYY-MM-DD-Category.

Return strictly as JSON without markdown formatting:
{
  "amount": number (just the digits),
  "merchant": "string",
  "category": "string (one of the predefined categories)",
  "date": "YYYY-MM-DD",
  "title": "Merchant-YYYY-MM-DD-Category"
}`;
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash", generationConfig: { responseMimeType: "application/json" } });
    
    const imagePart = {
      inlineData: {
        data: imageBase64,
        mimeType: mimeType || "image/jpeg"
      }
    };

    const result = await model.generateContent([
      { text: systemPrompt },
      imagePart
    ]);

    const aiobj = JSON.parse(result.response.text() || "{}");

    return NextResponse.json({ success: true, data: aiobj });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
