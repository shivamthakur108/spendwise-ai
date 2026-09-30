const CATEGORIES = [
  "Food",
  "Transportation",
  "Shopping",
  "Entertainment",
  "Subscriptions",
  "Education",
  "Other"
];

const round = (value) => Math.round(((Number(value) || 0) + Number.EPSILON) * 100) / 100;

const formatMonthKey = (date) => {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

const parseDate = (value) => {
  if (!value) return new Date();
  const d = new Date(`${value}T00:00:00`);
  return isNaN(d.getTime()) ? new Date() : d;
};

// Multi-month helper functions
export function getCurrentMonthExpenses(expenses = [], today = new Date()) {
  const safeExpenses = Array.isArray(expenses) ? expenses : [];
  const targetKey = formatMonthKey(today);
  return safeExpenses.filter((expense) => expense && typeof expense.date === "string" && expense.date.startsWith(targetKey));
}

export function getExpensesForMonth(expenses = [], yearOrKey, monthNum) {
  const safeExpenses = Array.isArray(expenses) ? expenses : [];
  let targetKey = "";
  if (typeof yearOrKey === "string" && /^\d{4}-\d{2}$/.test(yearOrKey)) {
    targetKey = yearOrKey;
  } else if (yearOrKey && monthNum) {
    targetKey = `${yearOrKey}-${String(monthNum).padStart(2, "0")}`;
  }
  if (!targetKey) return getCurrentMonthExpenses(safeExpenses);
  return safeExpenses.filter((expense) => expense && typeof expense.date === "string" && expense.date.startsWith(targetKey));
}

export function getAvailableMonths(expenses = []) {
  const safeExpenses = Array.isArray(expenses) ? expenses : [];
  const monthSet = new Set();
  for (const e of safeExpenses) {
    if (e && typeof e.date === "string" && /^\d{4}-\d{2}/.test(e.date)) {
      monthSet.add(e.date.slice(0, 7));
    }
  }
  return Array.from(monthSet).sort().reverse();
}

const isCurrentMonth = (expense, today) => expense && typeof expense.date === "string" && expense.date.startsWith(formatMonthKey(today));

const sum = (expenses = []) =>
  (Array.isArray(expenses) ? expenses : []).reduce((total, expense) => total + (Number(expense?.amount) || 0), 0);

const categoryTotals = (expenses = []) => {
  const totals = Object.fromEntries(CATEGORIES.map((category) => [category, 0]));
  const safeExpenses = Array.isArray(expenses) ? expenses : [];
  for (const expense of safeExpenses) {
    if (!expense) continue;
    const cat = CATEGORIES.includes(expense.category) ? expense.category : "Other";
    totals[cat] = (totals[cat] || 0) + (Number(expense.amount) || 0);
  }
  return Object.fromEntries(Object.entries(totals).map(([category, amount]) => [category, round(amount)]));
};

export function getSummary(expenses = [], budget = 5000) {
  const safeBudget = Math.max(0, Number(budget) || 0);
  const today = new Date();
  const monthExpenses = getCurrentMonthExpenses(expenses, today);
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const daysLeft = Math.max(1, daysInMonth - today.getDate() + 1);
  const spent = round(sum(monthExpenses));
  const remaining = round(safeBudget - spent);

  return {
    spent,
    remaining,
    pctUsed: safeBudget > 0 ? round((spent / safeBudget) * 100) : 0,
    daysLeft,
    safeToSpend: round(Math.max(0, remaining) / daysLeft),
    byCategory: categoryTotals(monthExpenses)
  };
}

export function getForecast(expenses = [], budget = 5000) {
  const safeBudget = Math.max(0, Number(budget) || 0);
  const today = new Date();
  const monthExpenses = getCurrentMonthExpenses(expenses, today);
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const dayOfMonth = Math.max(1, today.getDate());
  const spent = sum(monthExpenses);
  const projected = round((spent / dayOfMonth) * daysInMonth);
  const diff = round(safeBudget - projected);

  return { projected, diff, status: diff >= 0 ? "under" : "over" };
}

export function getInsights(expenses = []) {
  const today = new Date();
  const monthExpenses = getCurrentMonthExpenses(expenses, today);
  const todayNumber = today.getTime();
  const day = 24 * 60 * 60 * 1000;
  const inWindow = (expense, start, end) => {
    if (!expense?.date) return false;
    const time = parseDate(expense.date).getTime();
    return time >= todayNumber - end * day && time < todayNumber - start * day;
  };
  const currentFood = sum(monthExpenses.filter((expense) => expense.category === "Food" && inWindow(expense, -1, 6)));
  const previousFood = sum(monthExpenses.filter((expense) => expense.category === "Food" && inWindow(expense, 6, 13)));
  const insights = [];

  if (previousFood > 0) {
    const change = round(((currentFood - previousFood) / previousFood) * 100);
    insights.push(`Food spending is ₹${round(currentFood).toLocaleString("en-IN")} in the last 7 days, ${change >= 0 ? "up" : "down"} ${Math.abs(change)}% from the previous 7 days.`);
  }

  const delivery = sum(monthExpenses.filter((expense) => /zomato|swiggy|blinkit|eatsure/i.test(expense.description || "")));
  if (delivery > 0) {
    insights.push(`You spent ₹${round(delivery).toLocaleString("en-IN")} on delivery from Zomato, Swiggy, Blinkit, or EatSure this month.`);
  }

  const smallPurchases = monthExpenses.filter((expense) => Number(expense.amount) < 300);
  if (smallPurchases.length > 0) {
    insights.push(`Small purchases under ₹300 add up to ₹${round(sum(smallPurchases)).toLocaleString("en-IN")} across ${smallPurchases.length} transactions.`);
  }

  const totals = Object.entries(categoryTotals(monthExpenses)).filter(([, amount]) => amount > 0).sort((a, b) => b[1] - a[1]);
  const totalSpent = sum(monthExpenses);
  if (totals.length >= 2 && totalSpent > 0) {
    const [[topCategory, topAmount], [secondCategory, secondAmount]] = totals;
    insights.push(`${topCategory} is your top category at ₹${topAmount.toLocaleString("en-IN")} (${round((topAmount / totalSpent) * 100)}%); ${secondCategory} is second at ₹${secondAmount.toLocaleString("en-IN")}.`);
  }

  return insights.slice(0, 4);
}

export function whatIf(expenses = [], budget = 5000, category = "Food", pct = 15) {
  const safeBudget = Math.max(0, Number(budget) || 0);
  const today = new Date();
  const monthExpenses = getCurrentMonthExpenses(expenses, today);
  const current = round(sum(monthExpenses.filter((expense) => expense?.category === category)));
  const savings = round(current * (Number(pct) / 100));
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const dayOfMonth = Math.max(1, today.getDate());
  const projected = round((sum(monthExpenses) / dayOfMonth) * daysInMonth);
  const newProjected = round(projected - savings);

  return { current, savings, newProjected, newDiff: round(safeBudget - newProjected) };
}

export { CATEGORIES };
