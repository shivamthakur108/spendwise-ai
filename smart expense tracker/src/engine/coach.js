import { getForecast, getSummary } from "./analytics.js";

const money = (value) => `₹${Number(value).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
const monthExpenses = (expenses) => {
  const today = new Date();
  const key = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  return expenses.filter((expense) => expense.date?.startsWith(key));
};
const totals = (expenses) => expenses.reduce((result, expense) => {
  result[expense.category] = (result[expense.category] || 0) + Number(expense.amount || 0);
  return result;
}, {});
const sortedTotals = (expenses) => Object.entries(totals(expenses)).sort((a, b) => b[1] - a[1]);

export function askCoach(question, expenses, budget) {
  const text = String(question || "").toLowerCase();
  const current = monthExpenses(expenses);
  const summary = getSummary(expenses, budget);
  const categoryTotals = sortedTotals(current);
  const total = summary.spent;

  if (text.includes("where spending most") || text.includes("where am i spending most")) {
    if (!categoryTotals.length || total === 0) return "There is not enough spending data this month yet.";
    const [category, amount] = categoryTotals[0];
    return `You spend the most on ${category}: ${money(amount)}, which is ${Math.round((amount / total) * 10000) / 100}% of this month's ${money(total)}.`;
  }

  if (text.includes("can i afford")) {
    const match = text.match(/(?:₹|rs\.?|inr)?\s*([\d,]+(?:\.\d+)?)/i);
    if (!match) return "Tell me the amount, for example: Can I afford ₹500?";
    const amount = Number(match[1].replace(/,/g, ""));
    const yes = amount <= summary.safeToSpend && amount <= Math.max(0, summary.remaining);
    return `${yes ? "Yes" : "No"}, ${money(amount)} is ${yes ? "within" : "above"} today's safe-to-spend amount of ${money(summary.safeToSpend)} and ${yes ? "within" : "above"} the remaining monthly budget of ${money(Math.max(0, summary.remaining))}.`;
  }

  if (text.includes("reduce expenses")) {
    if (!categoryTotals.length) return "There is not enough spending data this month to identify a category to reduce.";
    const [category, amount] = categoryTotals[0];
    return `Start with ${category}. Cutting it by 15% would save ${money(amount * 0.15)} from its current ${money(amount)} this month.`;
  }

  if (text.includes("why increased") || (text.includes("why") && text.includes("increase"))) {
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;
    const thisWeek = current.filter((expense) => new Date(`${expense.date}T00:00:00`).getTime() >= now - 7 * day);
    const lastWeek = current.filter((expense) => {
      const time = new Date(`${expense.date}T00:00:00`).getTime();
      return time >= now - 14 * day && time < now - 7 * day;
    });
    const changes = Object.entries(totals(thisWeek)).map(([category, amount]) => [category, amount - (totals(lastWeek)[category] || 0)]).sort((a, b) => b[1] - a[1]);
    if (!changes.length || changes[0][1] <= 0) return "Spending has not increased in a category versus last week based on this month's data.";
    const [category, increase] = changes[0];
    return `${category} explains the biggest increase: it is up ${money(increase)} versus last week (${money(totals(thisWeek)[category])} this week vs ${money(totals(lastWeek)[category] || 0)} last week).`;
  }

  if (text.includes("which category first")) {
    const typicalShares = { Food: 0.3, Transportation: 0.15, Shopping: 0.15, Subscriptions: 0.1, Entertainment: 0.1, Education: 0.15, Other: 0.05 };
    const overTypical = categoryTotals.filter(([category, amount]) => total > 0 && amount / total > (typicalShares[category] || 0.05));
    if (!overTypical.length) return "No category is above its typical student spending share this month.";
    const [category, amount] = overTypical[0];
    return `Start with ${category}: it is ${Math.round((amount / total) * 10000) / 100}% of your spending, above the typical ${typicalShares[category] * 100}% share.`;
  }

  return "I can answer: where am I spending most, can I afford ₹N, how can I reduce expenses, why did spending increase, and which category should I address first?";
}

function getApiEndpoint() {
  if (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_API_BASE_URL) {
    const baseUrl = String(import.meta.env.VITE_API_BASE_URL).replace(/\/+$/, "");
    return `${baseUrl}/api/coach`;
  }
  if (typeof window !== "undefined" && window.location && window.location.port === "5173") {
    return "http://localhost:3001/api/coach";
  }
  return "/api/coach";
}

export async function askCoachAsync(question, expenses, budget, history = []) {
  try {
    const endpoint = getApiEndpoint();

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, expenses, budget, history })
    });

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }

    const data = await response.json();
    if (data && data.success && data.answer) {
      return data.answer;
    }
    throw new Error(data.error || "Invalid response from AI coach endpoint");
  } catch (error) {
    console.warn("[SpendWise Client] Backend API unreachable or error. Falling back to local coach engine:", error.message);
    return askCoach(question, expenses, budget);
  }
}
