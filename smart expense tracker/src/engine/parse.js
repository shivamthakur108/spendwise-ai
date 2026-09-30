const CATEGORY_KEYWORDS = {
  Transportation: ["uber", "ola", "metro", "auto", "bus", "petrol"],
  Food: ["dinner", "lunch", "zomato", "swiggy", "chai", "canteen", "coffee"],
  Shopping: ["amazon", "myntra", "shirt", "shoes"],
  Subscriptions: ["netflix", "spotify", "prime", "subscription"],
  Entertainment: ["movie", "game", "concert"],
  Education: ["course", "book", "fees", "printout"]
};

const fillerWords = /\b(spent|paid|on|for)\b/gi;

export function parseExpense(text) {
  const source = String(text || "");
  const amountMatch = source.match(/(?:₹|rs\.?|inr)?\s*(\d[\d,]*(?:\.\d+)?\s*k?)/i);
  if (!amountMatch) return null;

  const amountText = amountMatch[1].replace(/,/g, "").trim().toLowerCase();
  const amount = Number(amountText.endsWith("k") ? Number.parseFloat(amountText) * 1000 : amountText);
  if (!Number.isFinite(amount)) return null;

  const lowerText = source.toLowerCase();
  let category = "Other";
  let bestScore = 0;
  for (const [candidate, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    const score = keywords.reduce((total, keyword) => total + (lowerText.includes(keyword) ? 1 : 0), 0);
    if (score > bestScore) {
      category = candidate;
      bestScore = score;
    }
  }

  const cleaned = source
    .replace(amountMatch[0], " ")
    .replace(fillerWords, " ")
    .replace(/\s+/g, " ")
    .replace(/^[,.:;-]+|[,.:;-]+$/g, "")
    .trim();
  const description = cleaned ? cleaned[0].toUpperCase() + cleaned.slice(1) : "Expense";
  const date = new Date();
  if (/\byesterday\b/i.test(source)) date.setDate(date.getDate() - 1);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return {
    amount,
    category,
    description,
    date: `${year}-${month}-${day}`
  };
}
