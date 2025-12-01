import { Article } from "./models/Article";
import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import session from "express-session";
import { createServer } from "http";
import mongoose from "mongoose";
import type { LLMResponse, ErrorResponse } from "./types/api";
import { fetchNews } from "./cron/newsFetch";
import { startWeeklyNewsletter } from "./cron/weeklyNewsletter";
import { verifyEmailConfig } from "./utils/emailService";
import cors from "cors";
import MongoStore from "connect-mongo";
import passport from "./config/passport"; // ADDED: Import passport config

import { preferencesRouter } from "./routes/UserPreferences";
import { authRouter } from "./routes/auth";

// ---------------------------
// Environment + constants
// ---------------------------
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
const NODE_ENV = process.env.NODE_ENV ?? "dev";
const SESSION_SECRET = process.env.SESSION_SECRET || "fallback_secret";
const mongoURI = process.env.NODE_ENV === "prod" 
  ? 'mongodb://mongo:27017/databaseName'
  : 'mongodb://localhost:27017/testdb';
const GEMINI_API_KEY: string = process.env.GEMINI_API_KEY || "empty key";
const app = express();

// ---------------------------
// Middleware
// ---------------------------
app.set("trust proxy", 1);
app.use(express.json());

// CORS (only for testing locally)
app.use(cors({
  origin: "http://localhost:4000",
  credentials: true,
}));

app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: mongoURI,
      collectionName: "sessions",
      ttl: 24 * 60 * 60, // 1 day
    }),
    cookie: {
      sameSite: "strict",
      secure: NODE_ENV == "prod",
      maxAge: 24 * 60 * 60 * 1000, // 1 day
      httpOnly: true,
    },
  })
);

// ADDED: Initialize passport AFTER session middleware
app.use(passport.initialize());
app.use(passport.session());

app.use(express.urlencoded({ extended: false }));

app.use((req: Request, res: Response, next): void => {
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
    
    // Verify email configuration
    verifyEmailConfig()
      .then(isValid => {
        if (!isValid) {
          console.warn('⚠️  Email service not properly configured. Newsletters will not be sent.');
          console.warn('📧 Please check your EMAIL_USER and EMAIL_PASSWORD in .env file');
          console.warn('💡 For Gmail: Generate an App Password at https://myaccount.google.com/apppasswords');
        }
      });
    
    // Start cron jobs
    fetchNews(); // Fetch news articles
    startWeeklyNewsletter(); // Weekly newsletter job
  })
  .catch((err) => console.error("Mongo connection failed:", err));

// ---------------------------
// Example Mongoose model
// ---------------------------
const SomeSchema = new mongoose.Schema({
  a_string: String,
  a_date: Date,
});
const SomeModel = mongoose.model("SomeModel", SomeSchema);

// ---------------------------
// LLM call function
// ---------------------------
async function callLLM(query: string) {
  try {
    console.log("Calling Gemini API with query:", query.substring(0, 100) + "...");
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": GEMINI_API_KEY},
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
          }
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error:", response.status, errorText);
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
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
                text: "Failed to generate response. Please check your API key and try again."
              }
            ]
          }
        }
      ]
    };
  }
}

// ---------------------------
// Example external API route
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

app.post("/api/addHistoricalContext", async (req: Request, res: Response): Promise<void> => {
  try {
    const userText = req.body.data;
    if (!userText || userText.trim().length === 0) {
      res.status(400).json({ error: "No text provided" });
      return;
    }

    const context: string = `Provide historical context for the following text in 3 sentences or less. Be concise and informative:\n\n"${userText}"`;
    const response = await callLLM(context);
    res.json(response);
  } catch (error) {
    console.error("Error in addHistoricalContext:", error);
    res.status(500).json({ error: "Failed to generate historical context" });
  }
});

app.post("/api/summarizeArticle", async (req: Request, res: Response): Promise<void> => {
  try {
    const articleText = req.body.data;
    if (!articleText || articleText.trim().length === 0) {
      res.status(400).json({ error: "No article text provided" });
      return;
    }

    const context: string = `Summarize the following article in 6 sentences or less. Focus on the key points and main takeaways:\n\n"${articleText}"`;
    const response = await callLLM(context);
    res.json(response);
  } catch (error) {
    console.error("Error in summarizeArticle:", error);
    res.status(500).json({ error: "Failed to generate summary" });
  }
});

// ---------------------------
// Auth routes (includes GitHub OAuth)
// ---------------------------
app.use("/api/auth", authRouter);

// ---------------------------
// Preferences routes
// ---------------------------
app.use("/api/preferences", preferencesRouter);

app.post("/api/location", (req: Request, res: Response) => {
  const { latitude, longitude } = req.body;
  console.log("Received location:", latitude, longitude);
  res.json({ message: "Location received successfully!" });
});

// Get articles route
app.post("/api/articles", async (req: Request, res: Response) => {
  const { prefs, skip = 0 } = req.body;
  const offset = (skip - 1) * 20;

  console.log("skip", skip);
  console.log("offset", offset);

  try {
    const articles = await Article.find({ categories: { $in: prefs }}).sort({ published_at: -1 }).skip(offset).limit(20);
    res.json(articles);
  } catch (error) {
    console.error("Error fetching articles:", error);
    res.status(500).json({ error: "Failed to fetch articles" });
  }
});

// ---------------------------
// Error handler (optional)
// ---------------------------
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

// ---------------------------
// Start HTTP server
// ---------------------------
createServer(app).listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});