import { Router } from "express";
import { askGeminiCoach } from "../services/geminiService.js";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const { question, expenses = [], budget = 5000, history = [] } = req.body || {};

    if (!question || typeof question !== "string" || !question.trim()) {
      return res.status(400).json({
        success: false,
        error: "Missing or invalid 'question' field in request body."
      });
    }

    const numericBudget = Number(budget);
    const validBudget = !isNaN(numericBudget) && numericBudget > 0 ? numericBudget : 5000;
    const validExpenses = Array.isArray(expenses) ? expenses : [];

    const result = await askGeminiCoach(question.trim(), validExpenses, validBudget, history);

    return res.json({
      success: true,
      answer: result.answer,
      source: result.source,
      warning: result.warning
    });
  } catch (err) {
    console.error("[SpendWise Backend] Route Error:", err);
    return res.status(500).json({
      success: false,
      error: "Sorry, I couldn't connect to the AI Coach right now. Please try again."
    });
  }
});

export default router;
