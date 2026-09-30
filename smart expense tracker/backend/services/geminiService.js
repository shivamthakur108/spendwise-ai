import { GoogleGenerativeAI } from "@google/generative-ai";
import { getForecast, getInsights, getSummary } from "../../src/engine/analytics.js";
import { askCoach as localAskCoach } from "../../src/engine/coach.js";

const MODEL_NAME = "gemini-1.5-flash";

/**
 * Builds structured text context from live application data.
 */
function buildFinancialContext(expenses = [], budget = 5000) {
  const summary = getSummary(expenses, budget);
  const forecast = getForecast(expenses, budget);
  const insights = getInsights(expenses);

  const categoryLines = Object.entries(summary.byCategory)
    .filter(([, amt]) => amt > 0)
    .map(([cat, amt]) => `- ${cat}: ₹${amt.toLocaleString("en-IN")}`)
    .join("\n") || "No expense breakdown available.";

  const recentLines = expenses
    .slice(0, 10)
    .map((e) => `- ${e.date || 'Today'}: ₹${e.amount} for "${e.description || e.category}" [${e.category}]`)
    .join("\n") || "No recent transactions logged.";

  const insightLines = insights.map((i) => `- ${i}`).join("\n") || "No custom insights generated.";

  return `
USER FINANCIAL CONTEXT:
=======================
MONTHLY BUDGET: ₹${Number(budget).toLocaleString("en-IN")}
TOTAL SPENT THIS MONTH: ₹${summary.spent.toLocaleString("en-IN")} (${summary.pctUsed}% of budget used)
REMAINING BUDGET: ₹${summary.remaining.toLocaleString("en-IN")}
DAYS LEFT IN MONTH: ${summary.daysLeft}
SAFE-TO-SPEND TODAY: ₹${summary.safeToSpend.toLocaleString("en-IN")} / day
FORECASTED END-OF-MONTH SPEND: ₹${forecast.projected.toLocaleString("en-IN")} (Paced to be ${forecast.status === 'over' ? 'OVER budget by ₹' + Math.abs(forecast.diff) : 'UNDER budget by ₹' + forecast.diff})

CATEGORY SPENDING BREAKDOWN:
${categoryLines}

RECENT TRANSACTIONS (Latest 10):
${recentLines}

AUTOMATED ANALYTICS INSIGHTS:
${insightLines}
=======================
`;
}

const SYSTEM_INSTRUCTION = `
You are "SpendWise AI Financial Coach", an encouraging, empathetic, and highly practical AI financial copilot designed specifically for college students.

PREFERRED RESPONSE STRUCTURE FORMAT:
- Give a short, direct answer first.
- Then, when useful for clarity or deeper guidance, add clean bullet points:
  • Key observation
  • Calculation / Breakdown
  • Recommendation

EXAMPLE:
"Your biggest spending area is Food at ₹4,200, which represents 42% of your current spending.

• Food is currently your highest category.
• Reducing it by 15% could save approximately ₹630.
• Consider setting a weekly food limit.

You are still within your overall monthly budget."

CORE RULES & SAFETY:
1. Ground every answer strictly in the provided USER FINANCIAL CONTEXT.
2. For questions about affordability (e.g. "Can I buy these ₹1200 headphones?"), explicitly compare the amount against the user's SAFE-TO-SPEND TODAY target and REMAINING BUDGET. Give a clear Yes/No verdict backed by mathematical calculations.
3. For spending analysis ("where am I overspending?", "analyze my spending"), reference exact category totals and top spending areas from the provided context.
4. Use currency symbol ₹ (INR).
5. Keep responses concise, student-friendly, and easy to skim.
6. NEVER invent transactions or financial numbers not present in the supplied context. If data is missing, explicitly state the limitation.
7. NEVER claim access to external bank accounts, UPI, credit cards, or investment portals.
8. Avoid pretending to provide professional financial planning advice.
`;

export async function askGeminiCoach(question, expenses = [], budget = 5000, history = []) {
  const apiKey = process.env.GEMINI_API_KEY;

  // If no API key or empty key provided, fallback gracefully to deterministic engine
  if (!apiKey || apiKey === "your_gemini_api_key_here" || !apiKey.trim()) {
    console.warn("[SpendWise Backend] GEMINI_API_KEY missing or default. Falling back to local coach engine.");
    const fallbackAnswer = localAskCoach(question, expenses, budget);
    return {
      answer: fallbackAnswer,
      source: "local-fallback",
      warning: "GEMINI_API_KEY is not configured on the backend server. Using offline deterministic engine."
    };
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: MODEL_NAME,
      systemInstruction: SYSTEM_INSTRUCTION
    });

    const contextStr = buildFinancialContext(expenses, budget);
    
    // Format conversation history for Gemini if present
    const formattedHistory = Array.isArray(history) ? history.map((msg) => ({
      role: msg.sender === "user" ? "user" : "model",
      parts: [{ text: msg.text }]
    })) : [];

    const chat = model.startChat({
      history: formattedHistory
    });

    const promptText = `${contextStr}\nUSER QUESTION: "${question}"`;
    const result = await chat.sendMessage(promptText);
    const responseText = result.response.text();

    return {
      answer: responseText,
      source: "gemini-ai"
    };
  } catch (error) {
    console.error("[SpendWise Backend] Gemini API Error:", error.message || error);
    // Graceful fallback to local engine on API error
    const fallbackAnswer = localAskCoach(question, expenses, budget);
    return {
      answer: fallbackAnswer,
      source: "local-fallback-error",
      warning: `Gemini API call encountered an error (${error.message || "Network error"}). Falling back to local engine.`
    };
  }
}
