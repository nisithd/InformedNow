import { Article } from "./models/Article";
import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import session from "express-session";
import { createServer } from "http";
import mongoose from "mongoose";
import type { LLMResponse } from "./types/api";
import { fetchNews } from "./cron/newsFetch";
import { startWeeklyNewsletter } from "./cron/weeklyNewsletter";
import { verifyEmailConfig } from "./utils/emailService";
import cors from "cors";
import MongoStore from "connect-mongo";
import passport from "./config/passport";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { body, validationResult } from "express-validator";

import { preferencesRouter } from "./routes/UserPreferences";
import { authRouter } from "./routes/auth";

// ---------------------------
// Environment + constants
// ---------------------------
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
const NODE_ENV = process.env.NODE_ENV ?? "dev";
const SESSION_SECRET = process.env.SESSION_SECRET || "fallback_secret";
const mongoURI =
  process.env.NODE_ENV === "prod"
    ? "mongodb://mongo:27017/databaseName"
    : "mongodb://localhost:27017/testdb";
const GEMINI_API_KEY: string = process.env.GEMINI_API_KEY || "empty key";
const app = express();

// ---------------------------
// SECURITY MIDDLEWARE
// ---------------------------
app.set("trust proxy", 1);

app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
  message: "Too many authentication attempts, please try again later.",
});

const llmLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: "Too many AI requests, please try again later.",
});

app.use(generalLimiter);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: false, limit: "10mb" }));

app.use(
  cors({
    origin: ["http://localhost:3001", "http://localhost:4000"],
    credentials: true,
  })
);

// Custom sanitizer middleware
app.use((req: Request, _res: Response, next) => {
  if (req.body && typeof req.body === "object") {
    sanitizeObject(req.body);
  }
  if (req.query && typeof req.query === "object") {
    sanitizeObject(req.query);
  }
  next();
});

function sanitizeObject(obj: any) {
  // Only sanitize plain objects
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return;

  for (const key of Object.keys(obj)) {
    // SAFE hasOwnProperty
    if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;

    // Remove NoSQL-injection keys
    if (key.startsWith("$")) {
      delete obj[key];
      continue;
    }

    const value = obj[key];

    // Recurse into nested objects
    if (value && typeof value === "object" && !Array.isArray(value)) {
      sanitizeObject(value);
    }
  }
}

app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: mongoURI,
      collectionName: "sessions",
      ttl: 24 * 60 * 60,
    }),
    cookie: {
      sameSite: NODE_ENV === "prod" ? "strict" : "lax",
      secure: NODE_ENV === "prod",
      maxAge: 24 * 60 * 60 * 1000,
      httpOnly: true,
    },
    name: "sessionId",
  })
);

// Initialize passport AFTER session middleware
app.use(passport.initialize());
app.use(passport.session());

app.use((req: Request, _res: Response, next): void => {
  console.log("HTTP request", req.method, req.url, req.body || req.query);
  next();
});

// ---------------------------
// MongoDB connection
// ---------------------------
mongoose
  .connect(mongoURI)
  .then(() => {
    console.log("Connected to MongoDB");

    verifyEmailConfig().then((isValid) => {
      if (!isValid) {
        console.warn("⚠️  Email service not properly configured. Newsletters will not be sent.");
        console.warn("📧 Please check your EMAIL_USER and EMAIL_PASSWORD in .env file");
      }
    });

    fetchNews();
    startWeeklyNewsletter();
  })
  .catch((err) => console.error("Mongo connection failed:", err));

// ---------------------------
// SECURED LLM call function
// ---------------------------
async function callLLM(query: string) {
  if (query.length > 5000) {
    throw new Error("Input text too long. Maximum 5000 characters.");
  }

  try {
    console.log("Calling Gemini API with query:", query.substring(0, 100) + "...");

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": GEMINI_API_KEY,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: query,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1024,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error:", response.status, errorText);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    console.log("Gemini API response received successfully");
    return data;
  } catch (error) {
    console.error("Error calling LLM:", error);
    return {
      candidates: [
        {
          content: {
            parts: [
              {
                text: "Failed to generate response. Please try again later.",
              },
            ],
          },
        },
      ],
    };
  }
}

// ---------------------------
// Validation middleware for LLM endpoints
// ---------------------------
const validateLLMInput = [
  body("data")
    .trim()
    .notEmpty()
    .withMessage("Text is required")
    .isLength({ min: 1, max: 5000 })
    .withMessage("Text must be between 1 and 5000 characters")
    .customSanitizer((value) => {
      return value.replace(/ignore previous instructions/gi, "").replace(/system:/gi, "").replace(/assistant:/gi, "").substring(0, 5000);
    }),
];

// ---------------------------
// Routes
// ---------------------------
app.get("/api/testLLM", async (_req: Request, res: Response) => {
  try {
    const llmRes = await fetch("http://localgpt:11434/api/generate/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama3.2",
        prompt: "what is the capital of canada",
        stream: false,
      }),
    });
    const data = (await llmRes.json()) as LLMResponse;
    res.json(data.response);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to call LLM API" });
  }
});

app.post(
  "/api/addHistoricalContext",
  llmLimiter,
  validateLLMInput,
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    try {
      const userText = req.body.data;
      const context: string = `You are a helpful assistant. Provide historical context for the following text in 3 sentences or less. Be concise and informative.

Text to analyze: "${userText}"

Historical context:`;

      const response = await callLLM(context);
      res.json(response);
    } catch (error) {
      console.error("Error in addHistoricalContext:", error);
      res.status(500).json({ error: "Failed to generate historical context" });
    }
  }
);

app.post(
  "/api/summarizeArticle",
  llmLimiter,
  validateLLMInput,
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    try {
      const articleText = req.body.data;
      const context: string = `You are a helpful assistant. Summarize the following article in 6 sentences or less. Focus on the key points and main takeaways.

Article text: "${articleText}"

Summary:`;

      const response = await callLLM(context);
      res.json(response);
    } catch (error) {
      console.error("Error in summarizeArticle:", error);
      res.status(500).json({ error: "Failed to generate summary" });
    }
  }
);

// ---------------------------
// Auth & Preferences routes
// ---------------------------
app.use("/api/auth", authLimiter, authRouter);
app.use("/api/preferences", preferencesRouter);

app.post(
  "/api/location",
  [
    body("latitude").isFloat({ min: -90, max: 90 }).withMessage("Invalid latitude"),
    body("longitude").isFloat({ min: -180, max: 180 }).withMessage("Invalid longitude"),
  ],
  (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { latitude, longitude } = req.body;
    console.log("Received location:", latitude, longitude);
    res.json({ message: "Location received successfully!" });
  }
);

app.get("/api/articles", async (req: Request, res: Response) => {
  try {
    const articles = await Article.find().sort({ published_at: -1 }).limit(20).lean();
    res.json(articles);
  } catch (error) {
    console.error("Error fetching articles:", error);
    res.status(500).json({ error: "Failed to fetch articles" });
  }
});

// ---------------------------
// Error handler
// ---------------------------
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Unhandled error:", err);

  if (NODE_ENV === "prod") {
    res.status(500).json({ error: "Internal server error" });
  } else {
    res.status(500).json({
      error: "Internal server error",
      details: err.message,
    });
  }
});

// ---------------------------
// Start HTTP server
// ---------------------------
createServer(app).listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
