SpendWise AI
Track less. Understand more.

An AI-powered personal finance copilot for students.

SpendWise AI combines deterministic expense analytics with a Gemini-powered conversational coach to help students understand spending patterns, budget limits, forecasts, and savings scenarios.

📖 Overview
Managing personal finances as a college student is tough. Between fluctuating daily expenses (canteen, metro, Swiggy, books) and fixed monthly allowances, students frequently run out of money before the end of the month. Traditional budgeting apps require tedious manual category entry and offer static, generic financial advice.

SpendWise AI fixes this by giving students a real-time financial command center: a natural language expense parser, a daily safe-to-spend target, month-end run-rate forecasting, an interactive what-if savings simulator, and an empathetic, context-aware AI Financial Coach powered by Google Gemini.

🎯 Problem & Solution
The Problem

Unpredictable Micro-Spending: Small daily purchases (chai, snacks, food delivery) compound silently into month-end budget deficits.
Friction in Logging: Manual forms with dropdowns and category selectors discourage consistent expense tracking.
Static / Generic Advice: Generic financial apps tell users to "spend less" without understanding their actual active budget, daily targets, or category breakdowns.

The Solution
Natural Language Expense Entry: Simply type "paid 120 for chai and samosa" or "spent 1.2k on books", and the AI engine parses amount, category, description, and date instantly.
Daily Safe-To-Spend Target: Dynamically adjusts daily spending allowances based on remaining budget and days left in the month.
Month-End Spending Forecast: Run-rate projections alert students early if their current spending pace will lead to an overrun.
Contextual AI Financial Coach: A privacy-conscious assistant that receives the student's live financial data and answers natural questions like "Can I afford ₹800 this week?" or "Where am I overspending?".

✨ Key Features
🤖 AI Financial Coach
Natural Language Q&A: Ask any budgeting question in plain English.
Context-Grounded Reasoning: Receives current budget, total spent, safe-to-spend target, category breakdown, recent transactions, and multi-turn chat history.
Structured Responses: Concise direct answer followed by key observations, calculations, and recommendations.
Offline Fallback: Seamless fallback to deterministic analytics when offline or if API keys are absent.

📊 Smart Spending Analysis
Automated Insights: Identifies 7-day food spending trends, food delivery app patterns (Swiggy, Zomato, Blinkit), and micro-purchases under ₹300.
Category Breakdown: Visual progress bars and percentage distribution for Food, Transportation, Shopping, Subscriptions, Entertainment, Education, and Other.

🛡️ Safe-to-Spend
Daily Target Calculation: Evaluates Math.max(0, remainingBudget) / daysLeftInMonth in real time.
Dynamic Adjustments: Instantly updates as transactions are added, edited, or deleted.

📈 Month-End Forecast
Run-Rate Projection: Calculates (currentSpend / elapsedDays) * totalDaysInMonth.
Early Overrun Alerts: Highlights projected savings or budget deficits before the month ends.


🎛️ What-If Simulator
Interactive Scenario Planning: Adjust category cut percentages (5% to 50%) using an interactive slider.
Instant Calculation: Computes exact monthly savings and updated forecast metrics.
✍️ Natural Language Expense Entry
Regex & Keyword Parsing: Automatically maps amounts (1.2k 
→
 1200), categories (uber, zomato, netflix, amazon, printout), and descriptions.
Live AI Parse Preview: Displays parsed values in real time as the user types.

📅 Multi-Month Expense Architecture
Historical Persistence: Transactions naturally persist across calendar months without losing previous spending history.
Defensive Storage Engine: Schema versioning, input sanitization, safe migrations, and graceful error recovery.

🛠️ Tech Stack
Frontend: HTML5, Vanilla JavaScript (ES Modules), CSS3 (Custom Glassmorphic Dark Theme), Vite.
Backend: Node.js, Express.js, CORS, Dotenv.
AI Engine: Google Gemini API (@google/generative-ai SDK, gemini-1.5-flash model).
Styling & Typography: Google Fonts (Outfit, Plus Jakarta Sans), Remix Icons.

🏗️ Architecture
User Browser (Vite / HTML5)
   │
   ├─► Natural Language Input ──► Local Parser & Analytics Engine
   │                                     │ (LocalStorage Versioned State)
   └─► AI Coach Chat Drawer ─────────────┤
                                         │
                               POST /api/coach
                                         ▼
                                Express Backend API
                                         │ (Injects Budget, Expenses & Context)
                                         ▼
                               Google Gemini API
                                         │
                                         ▼
                                Structured AI Response

📁 Project Structure
smart expense tracker/
├── index.html               # Main Web Dashboard UI & AI Coach Drawer Modal
├── vite.config.js           # Vite dev server & /api proxy configuration
├── package.json             # App scripts and dependencies
├── .env.example             # Environment variables template
├── .gitignore               # Ignored files (node_modules, .env, dist)
├── backend/
│   ├── server.js            # Express API server entry point
│   ├── routes/
│   │   └── coach.js         # POST /api/coach endpoint validator
│   └── services/
│       └── geminiService.js # Gemini API prompt builder & context builder
└── src/
    ├── app.js               # Frontend application controller & DOM manager
    ├── style.css            # Glassmorphic dark design system
    └── engine/
        ├── analytics.js     # Deterministic analytics, forecast, safe-to-spend & insights
        ├── coach.js         # Offline coach engine & async API wrapper
        ├── demo.js          # Default sample student transactions & budget
        ├── parse.js         # Natural language regex/keyword expense parser
        ├── storage.js       # Versioned state loader, sanitizer & migration module
        └── test.js          # CLI engine verification test runner


🚀 Local Setup
1. Prerequisites
Node.js (v18.x or higher)
npm (v9.x or higher)
2. Installation
npm install
3. Environment Configuration
Create a .env file in the root directory:

cp .env.example .env
Open .env and add your Google Gemini API key:

GEMINI_API_KEY=your_actual_gemini_api_key_here
PORT=3001
FRONTEND_URL=http://localhost:5173
4. Running the Application
Run Backend & Frontend (Recommended): Terminal 1 (Backend): npm run server Terminal 2 (Frontend): npm run dev Access app at http://localhost:5173/.

Run Frontend Only (Offline Mode): npm run dev (Uses offline deterministic analytics & fallback coach).


🔑 Environment Variables
Variable	Scope	Description
GEMINI_API_KEY	Server-Side ONLY	Secret Google Gemini API Key
PORT	Server-Side	Backend port (default 3001)
FRONTEND_URL	Server-Side	Allowed CORS origin for production frontend
VITE_API_BASE_URL	Build-Time Optional	Deployed backend API base URL (e.g. https://spendwise-backend.onrender.com)
🧪 Testing
Run CLI analytics engine verification suite:
npm test


☁️ Production Deployment
Recommended Cloud Hosting
Frontend: Static host like Vercel or Netlify (npm run build).
Backend: Node server host like Render or Railway (npm run server).
Manual Deployment Procedure
Backend Deployment:
Host: Render / Railway
Build Command: npm install
Start Command: npm run server
Config: Set GEMINI_API_KEY, PORT, FRONTEND_URL.
Frontend Deployment:
Host: Vercel / Netlify
Build Command: npm run build


Output Folder: dist
Config: Set VITE_API_BASE_URL to deployed backend URL.

🔒 Security Notes

Server-Side API Keys: GEMINI_API_KEY is maintained exclusively on the Express backend server and is never bundled or exposed to frontend code.
Client-Side Privacy: Financial data is stored in the user's browser localStorage.
Non-Leaking Error Middleware: Production API error responses do not leak stack traces or file paths.
📌 Limitations & Future Scope
Current Scope
Single-user browser localStorage persistence.
No multi-user login or external bank integrations.
Future Scope
User accounts & cloud database sync.
Custom category budgets & PDF report exports.
