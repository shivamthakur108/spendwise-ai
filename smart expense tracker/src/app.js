import { getForecast, getInsights, getSummary, whatIf, CATEGORIES, getAvailableMonths } from "./engine/analytics.js";
import { askCoach, askCoachAsync } from "./engine/coach.js";
import { demoBudget, demoExpenses } from "./engine/demo.js";
import { parseExpense } from "./engine/parse.js";
import { loadAppState, saveAppState, clearAppState, sanitizeExpense } from "./engine/storage.js";

// Category Icons & Color Mapping
const CATEGORY_META = {
  Food: { icon: "ri-restaurant-line", color: "#f59e0b" },
  Transportation: { icon: "ri-car-line", color: "#06b6d4" },
  Shopping: { icon: "ri-shopping-bag-3-line", color: "#ec4899" },
  Subscriptions: { icon: "ri-tv-2-line", color: "#8b5cf6" },
  Entertainment: { icon: "ri-gamepad-line", color: "#a855f7" },
  Education: { icon: "ri-book-open-line", color: "#3b82f6" },
  Other: { icon: "ri-more-fill", color: "#94a3b8" }
};

// Initial App State from Storage Module
let appState = loadAppState();
let expenses = appState.expenses;
let budget = appState.budget;
let selectedFilterCategory = "All";

function persistState() {
  appState.expenses = expenses;
  appState.budget = budget;
  saveAppState(appState);
}

// Format Currency
const formatMoney = (val) => `₹${Number(val || 0).toLocaleString("en-IN")}`;

// Main Render Function
function render() {
  const summary = getSummary(expenses, budget);
  const forecast = getForecast(expenses, budget);
  const insights = getInsights(expenses);

  // Update Header & Budget Labels
  document.getElementById("header-budget-val").innerText = formatMoney(budget);
  document.getElementById("sub-budget-val").innerText = formatMoney(budget);

  // Spent Metric
  document.getElementById("val-spent").innerText = formatMoney(summary.spent);
  document.getElementById("val-pct-used").innerText = `${summary.pctUsed}% of monthly budget used`;
  const fill = document.getElementById("spent-progress-fill");
  fill.style.width = `${Math.min(100, summary.pctUsed)}%`;
  if (summary.pctUsed > 85) {
    fill.classList.add("warning");
  } else {
    fill.classList.remove("warning");
  }

  // Safe to Spend Metric
  document.getElementById("val-safe").innerText = `${formatMoney(summary.safeToSpend)} / day`;
  document.getElementById("val-days-left").innerText = `${summary.daysLeft} days remaining in month`;

  // Forecast Metric
  document.getElementById("val-forecast").innerText = formatMoney(forecast.projected);
  const forecastStatusEl = document.getElementById("val-forecast-status");
  if (forecast.status === "over") {
    forecastStatusEl.style.color = "var(--accent-rose)";
    forecastStatusEl.innerText = `Paced to exceed budget by ${formatMoney(Math.abs(forecast.diff))}`;
  } else {
    forecastStatusEl.style.color = "var(--accent-emerald)";
    forecastStatusEl.innerText = `Paced to save ${formatMoney(forecast.diff)} under budget`;
  }

  // Remaining Metric
  const remainingEl = document.getElementById("val-remaining");
  remainingEl.innerText = formatMoney(summary.remaining);
  if (summary.remaining < 0) {
    remainingEl.style.color = "var(--accent-rose)";
  } else {
    remainingEl.style.color = "#fff";
  }

  // Render Category Breakdown
  renderCategories(summary.byCategory, summary.spent);

  // Render Smart Insights
  renderInsights(insights);

  // Render What-If Simulator
  updateWhatIf();

  // Render Transactions List
  renderTransactions();
}

function renderCategories(byCategory, totalSpent) {
  const container = document.getElementById("category-breakdown-list");
  container.innerHTML = "";

  Object.entries(byCategory).forEach(([cat, amount]) => {
    const meta = CATEGORY_META[cat] || CATEGORY_META.Other;
    const pct = totalSpent > 0 ? Math.round((amount / totalSpent) * 100) : 0;

    const div = document.createElement("div");
    div.className = "category-item";
    div.innerHTML = `
      <div class="category-meta">
        <span class="category-name">
          <span class="cat-dot" style="background-color: ${meta.color};"></span>
          <i class="${meta.icon}" style="color: ${meta.color};"></i> ${cat}
        </span>
        <span style="color: var(--text-muted); font-size: 13px;">
          ${formatMoney(amount)} (${pct}%)
        </span>
      </div>
      <div class="progress-bar-bg" style="margin: 4px 0 0; height: 6px;">
        <div class="progress-bar-fill" style="width: ${pct}%; background: ${meta.color};"></div>
      </div>
    `;
    container.appendChild(div);
  });
}

function renderInsights(insights) {
  const container = document.getElementById("insights-list");
  container.innerHTML = "";

  if (!insights || insights.length === 0) {
    container.innerHTML = `<div class="insight-item" style="border-left-color: var(--text-dim);">No insights generated yet. Add expenses to receive smart AI insights!</div>`;
    return;
  }

  insights.forEach((text) => {
    const item = document.createElement("div");
    item.className = "insight-item";
    item.innerText = text;
    container.appendChild(item);
  });
}

function renderTransactions() {
  const container = document.getElementById("tx-list");
  container.innerHTML = "";

  const filtered = selectedFilterCategory === "All"
    ? expenses
    : expenses.filter((e) => e.category === selectedFilterCategory);

  document.getElementById("tx-count").innerText = `${filtered.length} transactions`;

  if (filtered.length === 0) {
    container.innerHTML = `<div style="text-align: center; padding: 24px; color: var(--text-dim); font-size: 14px;">No transactions found.</div>`;
    return;
  }

  // Sort by date descending
  const sorted = [...filtered].sort((a, b) => new Date(b.date) - new Date(a.date));

  sorted.forEach((item) => {
    const meta = CATEGORY_META[item.category] || CATEGORY_META.Other;
    const row = document.createElement("div");
    row.className = "tx-row";
    row.innerHTML = `
      <div class="tx-left">
        <div class="tx-cat-icon">
          <i class="${meta.icon}" style="color: ${meta.color};"></i>
        </div>
        <div>
          <div class="tx-desc">${escapeHtml(item.description || item.category)}</div>
          <div class="tx-sub">${item.category} • ${item.date}</div>
        </div>
      </div>
      <div class="tx-right">
        <div class="tx-amount">${formatMoney(item.amount)}</div>
        <button class="tx-delete" data-id="${item.id}" title="Delete expense">
          <i class="ri-delete-bin-line"></i>
        </button>
      </div>
    `;
    container.appendChild(row);
  });

  // Attach delete handlers
  container.querySelectorAll(".tx-delete").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const id = e.currentTarget.getAttribute("data-id");
      deleteExpense(id);
    });
  });
}

function deleteExpense(id) {
  expenses = expenses.filter((item) => String(item.id) !== String(id));
  persistState();
  render();
}

function updateWhatIf() {
  const cat = document.getElementById("whatif-category").value;
  const pct = Number(document.getElementById("whatif-pct").value);
  document.getElementById("whatif-pct-label").innerText = `${pct}%`;

  const result = whatIf(expenses, budget, cat, pct);
  document.getElementById("whatif-savings-val").innerText = formatMoney(result.savings);
  document.getElementById("whatif-subtext").innerText = `New forecast projected: ${formatMoney(result.newProjected)}`;
}

function escapeHtml(str) {
  return String(str || "").replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
}

// Setup Event Listeners
document.addEventListener("DOMContentLoaded", () => {
  render();

  // Natural Language Input Live Preview
  const nlInput = document.getElementById("nl-input");
  const parsePreview = document.getElementById("parse-preview");
  const previewText = document.getElementById("preview-text");

  nlInput.addEventListener("input", () => {
    const val = nlInput.value.trim();
    if (val.length > 2) {
      const parsed = parseExpense(val);
      if (parsed) {
        parsePreview.style.display = "flex";
        previewText.innerHTML = `<strong>Amount:</strong> ₹${parsed.amount} | <strong>Category:</strong> ${parsed.category} | <strong>Desc:</strong> ${escapeHtml(parsed.description)}`;
      } else {
        parsePreview.style.display = "none";
      }
    } else {
      parsePreview.style.display = "none";
    }
  });

  // Add Expense Form Submit
  document.getElementById("nl-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const val = nlInput.value.trim();
    if (!val) return;

    const parsed = parseExpense(val);
    if (!parsed) {
      alert("Could not parse expense amount. Please include an amount like '150' or '₹200'.");
      return;
    }

    const newExpense = {
      id: String(Date.now()),
      amount: parsed.amount,
      category: parsed.category,
      description: parsed.description,
      date: parsed.date
    };

    expenses.unshift(newExpense);
    persistState();
    nlInput.value = "";
    parsePreview.style.display = "none";
    render();
  });

  // Filter Chips Click
  document.getElementById("category-filter-chips").addEventListener("click", (e) => {
    if (e.target.classList.contains("filter-chip")) {
      document.querySelectorAll(".filter-chip").forEach((chip) => chip.classList.remove("active"));
      e.target.classList.add("active");
      selectedFilterCategory = e.target.getAttribute("data-category");
      renderTransactions();
    }
  });

  // What-If Calculator Inputs
  document.getElementById("whatif-category").addEventListener("change", updateWhatIf);
  document.getElementById("whatif-pct").addEventListener("input", updateWhatIf);

  // Edit Budget Button
  document.getElementById("btn-edit-budget").addEventListener("click", () => {
    const newBudget = prompt("Enter your new monthly budget (₹):", budget);
    if (newBudget !== null && !isNaN(Number(newBudget)) && Number(newBudget) > 0) {
      budget = Number(newBudget);
      persistState();
      render();
    }
  });

  // Reset Demo Button
  document.getElementById("btn-reset-demo").addEventListener("click", () => {
    if (confirm("Reset to demo expenses and budget?")) {
      appState = clearAppState();
      expenses = appState.expenses;
      budget = appState.budget;
      render();
    }
  });

  // AI Coach Drawer Modal Logic
  const coachModal = document.getElementById("coach-modal");
  const chatMessages = document.getElementById("chat-messages");

  document.getElementById("btn-open-coach").addEventListener("click", () => {
    coachModal.classList.add("active");
  });

  document.getElementById("btn-close-coach").addEventListener("click", () => {
    coachModal.classList.remove("active");
  });

  coachModal.addEventListener("click", (e) => {
    if (e.target === coachModal) coachModal.classList.remove("active");
  });

  let chatHistory = [];

  // Reset Chat Conversation
  const btnResetChat = document.getElementById("btn-reset-chat");
  if (btnResetChat) {
    btnResetChat.addEventListener("click", () => {
      chatHistory = [];
      chatMessages.innerHTML = `
        <div class="chat-bubble bot">
          👋 Hi! I'm your SpendWise AI Financial Coach. Ask me any question about your budget, spending habits, or affordability!
        </div>
      `;
      const chatInput = document.getElementById("chat-input");
      if (chatInput) {
        chatInput.value = "";
        chatInput.focus();
      }
    });
  }

  async function handleCoachQuestion(promptText) {
    if (!promptText || !promptText.trim()) return;

    const chatInput = document.getElementById("chat-input");
    const sendBtn = document.querySelector("#chat-form button[type='submit']");
    const text = promptText.trim();

    // Disable input while request is pending
    if (chatInput) chatInput.disabled = true;
    if (sendBtn) sendBtn.disabled = true;

    // Add user message to UI
    const userMsg = document.createElement("div");
    userMsg.className = "chat-bubble user";
    userMsg.innerText = text;
    chatMessages.appendChild(userMsg);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // Add loading indicator bubble
    const loadingMsg = document.createElement("div");
    loadingMsg.className = "chat-bubble bot loading";
    loadingMsg.innerHTML = `<i class="ri-loader-4-line ri-spin" style="margin-right: 6px;"></i> Thinking about your spending...`;
    chatMessages.appendChild(loadingMsg);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    try {
      // Call async backend LLM service with fallback
      const answer = await askCoachAsync(text, expenses, budget, chatHistory);

      // Remove loading indicator
      if (loadingMsg.parentNode) loadingMsg.parentNode.removeChild(loadingMsg);

      // Add bot response message
      const botMsg = document.createElement("div");
      botMsg.className = "chat-bubble bot";
      
      // Format markdown line breaks & bold text
      const formattedHtml = escapeHtml(answer)
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .replace(/\n/g, "<br/>");
      botMsg.innerHTML = formattedHtml;
      
      chatMessages.appendChild(botMsg);

      // Record turn in chat history
      chatHistory.push({ sender: "user", text: text });
      chatHistory.push({ sender: "bot", text: answer });
    } catch (err) {
      if (loadingMsg.parentNode) loadingMsg.parentNode.removeChild(loadingMsg);
      const errorMsg = document.createElement("div");
      errorMsg.className = "chat-bubble bot";
      errorMsg.style.borderColor = "var(--accent-rose)";
      errorMsg.innerText = "Sorry, I couldn't connect to your AI Coach right now. Your expense data is still safe.";
      chatMessages.appendChild(errorMsg);
    } finally {
      if (chatInput) {
        chatInput.disabled = false;
        chatInput.value = "";
        chatInput.focus();
      }
      if (sendBtn) sendBtn.disabled = false;
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
  }

  const chatForm = document.getElementById("chat-form");
  const chatInput = document.getElementById("chat-input");

  if (chatForm) {
    chatForm.addEventListener("submit", (e) => {
      e.preventDefault();
      if (chatInput) {
        const val = chatInput.value;
        handleCoachQuestion(val);
      }
    });
  }

  if (chatInput) {
    // Handle Enter to send, Shift+Enter for newline
    chatInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        chatForm.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
      }
    });
  }

  // Quick Prompt Chips
  document.querySelectorAll(".prompt-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      const text = chip.getAttribute("data-prompt");
      handleCoachQuestion(text);
    });
  });
});
