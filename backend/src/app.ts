import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import session from "express-session";
import path from "path";
import { createServer } from "http";
import mongoose from "mongoose";
import { genSalt, hash, compare } from "bcrypt";
import { body, validationResult, matchedData } from "express-validator";
import fetch from "node-fetch";
import type { LLMResponse, ErrorResponse } from "./types/api";
import cors from "cors";

import { preferencesRouter } from "./routes/UserPreferences";

// ---------------------------
// Environment + constants
// ---------------------------
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
const NODE_ENV = process.env.NODE_ENV ?? "dev";
const SESSION_SECRET = process.env.SESSION_SECRET || "fallback_secret";
const mongoURI = process.env.NODE_ENV === "prod" ? 'mongodb://mongo:27017/databaseName':'mongodb://localhost:27017/testdb';

const app = express();

// ---------------------------
// Middleware
// ---------------------------
app.set("trust proxy", 1);
app.use(express.json());
// CORS (only for testing locally)
// app.use(cors({
//   origin: "http://localhost:4000",
//   credentials: true,
// }));
app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
      sameSite: "strict",
      secure: NODE_ENV == "prod",
    },
  })
);
app.use(express.urlencoded({ extended: false }));

// ---------------------------
// MongoDB connection
// ---------------------------
mongoose
  .connect(mongoURI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ Mongo connection failed:", err));

// ---------------------------
// Example Mongoose model
// ---------------------------
const SomeSchema = new mongoose.Schema({
  a_string: String,
  a_date: Date,
});
const SomeModel = mongoose.model("SomeModel", SomeSchema);


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

// ---------------------------
// Preferences routes
// ---------------------------
app.use("/api/preferences", preferencesRouter);

app.post("/api/location", (req: Request, res: Response) => {
  const { latitude, longitude } = req.body;
  console.log("Received location:", latitude, longitude);
  res.json({ message: "Location received successfully!" });
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
