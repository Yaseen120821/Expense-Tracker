require("dotenv").config({ path: ".env.local" });
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest", generationConfig: { responseMimeType: "application/json" } });

async function run() {
  try {
    const prompt = `Give me a JSON object with {"status": "ok"}`;
    const result = await model.generateContent(prompt);
    console.log("Success:", result.response.text());
  } catch (error) {
    console.error("Error:", error);
  }
}
run();
