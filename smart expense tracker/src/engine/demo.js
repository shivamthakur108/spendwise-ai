const today = new Date();
const date = (daysAgo) => {
  const value = new Date(today);
  const targetDay = today.getDate() > 1 ? Math.max(1, today.getDate() - daysAgo) : 1;
  value.setDate(targetDay);
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const demoExpenses = [
  { id: "1", amount: 280, category: "Food", description: "Swiggy dinner", date: date(1) },
  { id: "2", amount: 180, category: "Food", description: "Canteen lunch", date: date(3) },
  { id: "3", amount: 220, category: "Food", description: "Zomato lunch", date: date(9) },
  { id: "4", amount: 150, category: "Transportation", description: "Metro recharge", date: date(2) },
  { id: "5", amount: 900, category: "Shopping", description: "Amazon shoes", date: date(5) },
  { id: "6", amount: 199, category: "Subscriptions", description: "Spotify subscription", date: date(12) },
  { id: "7", amount: 250, category: "Entertainment", description: "Movie", date: date(8) },
  { id: "8", amount: 120, category: "Education", description: "Printout notes", date: date(6) }
];

export const demoBudget = 5000;
