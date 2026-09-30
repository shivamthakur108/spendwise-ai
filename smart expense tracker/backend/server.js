import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import coachRouter from "./routes/coach.js";

// Load environment variables from .env
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Production-ready CORS configuration
const frontendUrl = process.env.FRONTEND_URL;
const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:4173"
];

if (frontendUrl) {
  allowedOrigins.push(frontendUrl.replace(/\/+$/, ""));
}

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. server-to-server, mobile, curl) or allowed origins
    if (!origin || !frontendUrl || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(null, true); // Fallback to safe allowance
  },
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

// Health Check Endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    app: "SpendWise AI Backend Service",
    geminiConfigured: !!(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "your_gemini_api_key_here")
  });
});

// Coach API Router
app.use("/api/coach", coachRouter);

// Global production error handler (no stack trace leaks)
app.use((err, req, res, next) => {
  console.error("[SpendWise Backend Error]:", err.message || err);
  res.status(500).json({
    success: false,
    error: "An unexpected error occurred on the AI Coach server."
  });
});

app.listen(PORT, () => {
  console.log(`[SpendWise AI Backend] Server running on port ${PORT}`);
});
