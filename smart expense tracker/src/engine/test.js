import { getForecast, getInsights, getSummary, whatIf } from "./analytics.js";
import { askCoach } from "./coach.js";
import { demoBudget, demoExpenses } from "./demo.js";
import { parseExpense } from "./parse.js";

console.log("summary", getSummary(demoExpenses, demoBudget));
console.log("forecast", getForecast(demoExpenses, demoBudget));
console.log("insights", getInsights(demoExpenses));
console.log("whatIf", whatIf(demoExpenses, demoBudget, "Food", 15));
console.log("parsed", parseExpense("paid 1200 for Amazon shoes"));
console.log("parsed", parseExpense("₹250 Uber ride"));
console.log("parsed", parseExpense("spent 1.2k on Netflix"));
console.log("coach: most", askCoach("where am I spending most?", demoExpenses, demoBudget));
console.log("coach: afford", askCoach("can I afford ₹500?", demoExpenses, demoBudget));
console.log("coach: reduce", askCoach("how can I reduce expenses?", demoExpenses, demoBudget));
console.log("coach: increased", askCoach("why increased?", demoExpenses, demoBudget));
console.log("coach: first", askCoach("which category first?", demoExpenses, demoBudget));
console.log("coach: fallback", askCoach("hello", demoExpenses, demoBudget));
