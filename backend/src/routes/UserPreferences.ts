import { Router, Request, Response, NextFunction } from "express";
import { body, validationResult, matchedData } from "express-validator";
import { UserPreference } from "../models/UserPreference";
import { requireAuth } from "../middleware/authMiddleware";

export const preferencesRouter = Router();

/* -----------------------------
   VALIDATION
------------------------------ */
const validatePreferences = [
  body("categories")
    .isArray({ min: 0, max: 50 })
    .withMessage("Categories must be an array with max 50 items"),

  body("categories.*")
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage("Each category must be 1-50 characters")
    .matches(/^[a-zA-Z0-9\s_-]+$/)
    .withMessage("Category contains invalid characters"),

  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

/* -----------------------------
   LLM CONTEXT BUILDER
------------------------------ */
const buildLLMContext = (categories: string[]) => {
  const sanitized = categories
    .filter((c) => c && c.trim().length > 0)
    .map((c) => c.toLowerCase().trim())
    .slice(0, 50);

  return {
    preferenceString: sanitized.join(", "),
    categoryCount: sanitized.length,
    prompt: `User interests: ${
      sanitized.length > 0 ? sanitized.join(", ") : "None selected"
    }`,
  };
};

/* -----------------------------
   TEMP ROUTES (NO AUTH)
------------------------------ */
preferencesRouter.get("/temp", async (_req: Request, res: Response) => {
  const tempUserId = "temp-user-001";

  try {
    let prefs = await UserPreference.findOne({ userId: tempUserId }).lean();

    if (!prefs) {
      return res.json({
        userId: tempUserId,
        categories: [],
        llmContext: buildLLMContext([]),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    return res.json(prefs);
  } catch (err) {
    console.error("Error finding preferences:", err);
    return res.status(500).json({ error: "Error finding preferences" });
  }
});

preferencesRouter.post(
  "/temp",
  validatePreferences,
  async (req: Request, res: Response) => {
  const tempUserId = "temp-user-001";

  const { categories } = matchedData(req) as { categories: string[] };
  const llmContext = buildLLMContext(categories);

  try {
    const existing = await UserPreference.findOne({ userId: tempUserId });

    if (existing) {
      existing.categories = categories;
      existing.llmContext = llmContext;
      await existing.save();
      return res.json(existing);
    }

    const created = await UserPreference.create({
      userId: tempUserId,
      categories,
      llmContext,
    });

    return res.status(201).json(created);
  } catch (err) {
    console.error("Error saving preferences:", err);
    return res.status(500).json({ error: "Error saving preferences" });
  }
});

preferencesRouter.delete(
  "/temp",
  async (_req: Request, res: Response) => {
  const tempUserId = "temp-user-001";

  try {
    const result = await UserPreference.deleteOne({ userId: tempUserId });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "No preferences found" });
    }

    return res.json({ message: "Preferences deleted successfully" });
  } catch (err) {
    console.error("Error deleting preferences:", err);
    return res.status(500).json({ error: "Error deleting preferences" });
  }
});

/* -----------------------------
   AUTHENTICATED ROUTES
------------------------------ */

/* GET authenticated user prefs */
preferencesRouter.get("/auth", requireAuth, async (req, res) => {
  const username = req.session?.username;
  const normalized = String(username).toLowerCase().trim();

  try {
    let prefs = await UserPreference.findOne({ userId: normalized }).lean();

    if (!prefs) {
      return res.json({
        userId: normalized,
        categories: [],
        llmContext: buildLLMContext([]),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    return res.json(prefs);
  } catch (err) {
    console.error("Error finding preferences:", err);
    return res.status(500).json({ error: "Error finding preferences" });
  }
});

/* SAVE authenticated user prefs */
preferencesRouter.post(
  "/auth",
  requireAuth,
  validatePreferences,
  async (req: Request, res: Response) => {
    const username = req.session?.username;
    const normalized = String(username).toLowerCase().trim();

    const { categories } = matchedData(req) as { categories: string[] };
    const llmContext = buildLLMContext(categories);

    try {
      const existing = await UserPreference.findOne({ userId: normalized });

      if (existing) {
        existing.categories = categories;
        existing.llmContext = llmContext;
        await existing.save();
        return res.json(existing);
      }

      const created = await UserPreference.create({
        userId: normalized,
        categories,
        llmContext,
      });

      return res.status(201).json(created);
    } catch (err) {
      console.error("Error saving preferences:", err);
      return res.status(500).json({ error: "Error saving preferences" });
    }
  }
);

/* DELETE authenticated user prefs */
preferencesRouter.delete(
  "/auth",
  requireAuth,
  async (req: Request, res: Response) => {
  const username = req.session?.username;
  const normalized = String(username).toLowerCase().trim();

  try {
    const result = await UserPreference.deleteOne({ userId: normalized });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Preferences not found" });
    }

    return res.json({ message: "Preferences deleted successfully" });
  } catch (err) {
    console.error("Error deleting preferences:", err);
    return res.status(500).json({ error: "Error deleting preferences" });
  }
});

export default preferencesRouter;