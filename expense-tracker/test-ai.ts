import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { generateInsights } from './lib/ai';

async function main() {
  try {
    const res = await generateInsights({ "Food": 100 }, {
      budget: 1000,
      currency: "$",
      categories: ["Food"],
      mode: "normal"
    });
    console.log(res);
  } catch (err: any) {
    console.error("error:", err.message);
  }
}

main();
