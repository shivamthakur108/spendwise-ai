import { CATEGORIES } from "./analytics.js";
import { demoBudget, demoExpenses } from "./demo.js";

const CURRENT_VERSION = 1;
const STORAGE_KEY = "spendwise_app_state_v1";

// Legacy keys for backward compatibility migration
const LEGACY_KEYS = {
  expensesV2: "spendwise_expenses_v2",
  expensesV1: "spendwise_expenses_v1",
  budgetV2: "spendwise_budget_v2",
  budgetV1: "spendwise_budget_v1"
};

/**
 * Sanitizes a single expense object to ensure numeric validity and complete fields.
 */
export function sanitizeExpense(raw) {
  if (!raw || typeof raw !== "object") return null;

  const amount = Math.max(0, Number(raw.amount) || 0);
  const category = CATEGORIES.includes(raw.category) ? raw.category : "Other";
  const description = String(raw.description || raw.category || "Expense").trim();
  
  let date = String(raw.date || "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    date = `${year}-${month}-${day}`;
  }

  const id = String(raw.id || Date.now() + Math.random().toString(36).substr(2, 5));

  return { id, amount, category, description, date };
}

/**
 * Creates a default versioned application state.
 */
function createDefaultState() {
  const currentMonthKey = new Date().toISOString().slice(0, 7);
  return {
    version: CURRENT_VERSION,
    budget: demoBudget,
    expenses: demoExpenses.map(sanitizeExpense).filter(Boolean),
    monthlyBudgets: {
      [currentMonthKey]: demoBudget
    },
    settings: {
      currency: "INR"
    }
  };
}

/**
 * Validates and sanitizes a complete application state object.
 */
export function validateState(state) {
  if (!state || typeof state !== "object") {
    return createDefaultState();
  }

  const budget = Math.max(0, Number(state.budget) || demoBudget);
  const rawExpenses = Array.isArray(state.expenses) ? state.expenses : [];
  const sanitizedExpenses = rawExpenses
    .map(sanitizeExpense)
    .filter(Boolean);

  const monthlyBudgets = (state.monthlyBudgets && typeof state.monthlyBudgets === "object")
    ? state.monthlyBudgets
    : {};

  const currentMonthKey = new Date().toISOString().slice(0, 7);
  if (!monthlyBudgets[currentMonthKey]) {
    monthlyBudgets[currentMonthKey] = budget;
  }

  const settings = {
    currency: "INR",
    ...(state.settings && typeof state.settings === "object" ? state.settings : {})
  };

  return {
    version: CURRENT_VERSION,
    budget,
    expenses: sanitizedExpenses,
    monthlyBudgets,
    settings
  };
}

/**
 * Migrates legacy localStorage keys to versioned state structure.
 */
function migrateLegacyStorage() {
  if (typeof localStorage === "undefined") return null;

  try {
    const rawExpensesV2 = localStorage.getItem(LEGACY_KEYS.expensesV2);
    const rawExpensesV1 = localStorage.getItem(LEGACY_KEYS.expensesV1);
    const rawBudgetV2 = localStorage.getItem(LEGACY_KEYS.budgetV2);
    const rawBudgetV1 = localStorage.getItem(LEGACY_KEYS.budgetV1);

    if (!rawExpensesV2 && !rawExpensesV1 && !rawBudgetV2 && !rawBudgetV1) {
      return null;
    }

    let parsedExpenses = null;
    if (rawExpensesV2) {
      try { parsedExpenses = JSON.parse(rawExpensesV2); } catch (e) {}
    }
    if (!parsedExpenses && rawExpensesV1) {
      try { parsedExpenses = JSON.parse(rawExpensesV1); } catch (e) {}
    }

    let parsedBudget = null;
    if (rawBudgetV2 && !isNaN(Number(rawBudgetV2))) parsedBudget = Number(rawBudgetV2);
    if (!parsedBudget && rawBudgetV1 && !isNaN(Number(rawBudgetV1))) parsedBudget = Number(rawBudgetV1);

    const currentMonthKey = new Date().toISOString().slice(0, 7);
    const budget = parsedBudget || demoBudget;
    const expenses = Array.isArray(parsedExpenses) ? parsedExpenses.map(sanitizeExpense).filter(Boolean) : demoExpenses;

    const newState = {
      version: CURRENT_VERSION,
      budget,
      expenses,
      monthlyBudgets: {
        [currentMonthKey]: budget
      },
      settings: { currency: "INR" }
    };

    saveAppState(newState);
    return newState;
  } catch (err) {
    console.warn("[SpendWise Storage] Legacy migration failed, creating default state:", err);
    return null;
  }
}

/**
 * Loads the application state safely from LocalStorage.
 */
export function loadAppState() {
  if (typeof localStorage === "undefined") return createDefaultState();

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // Try legacy migration first
      const migrated = migrateLegacyStorage();
      if (migrated) return migrated;
      
      // First run: save default state
      const defaultState = createDefaultState();
      saveAppState(defaultState);
      return defaultState;
    }

    const parsed = JSON.parse(raw);
    return validateState(parsed);
  } catch (err) {
    console.error("[SpendWise Storage] Failed to load application state from LocalStorage:", err);
    const defaultState = createDefaultState();
    saveAppState(defaultState);
    return defaultState;
  }
}

/**
 * Saves the application state to LocalStorage safely.
 */
export function saveAppState(state) {
  if (typeof localStorage === "undefined") return;

  try {
    const valid = validateState(state);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(valid));
  } catch (err) {
    console.error("[SpendWise Storage] Failed to save state to LocalStorage:", err);
  }
}

/**
 * Clears the application state back to default demo state.
 */
export function clearAppState() {
  if (typeof localStorage === "undefined") return createDefaultState();

  try {
    const defaultState = createDefaultState();
    saveAppState(defaultState);
    return defaultState;
  } catch (err) {
    console.error("[SpendWise Storage] Failed to clear state:", err);
    return createDefaultState();
  }
}
