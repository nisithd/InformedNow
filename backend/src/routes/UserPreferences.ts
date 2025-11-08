import { Router, Request, Response } from "express";
import { body, validationResult, matchedData } from "express-validator";
import { UserPreference } from "../models/UserPreference";

export const preferencesRouter = Router();

// ==================== VALIDATION ====================
const validatePreferences = [
  body("categories")
    .isArray()
    .withMessage("Categories must be an array"),
  body("categories.*")
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage("Each category must be 1–50 characters")
    .escape(),
  (req: Request, res: Response, next: Function) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

// Utility to build LLM context
const buildLLMContext = (categories: string[]) => ({
  preferenceString: categories.join(", "),
  categoryCount: categories.length,
  prompt: `User interests: ${
    categories.length > 0 ? categories.join(", ") : "None selected"
  }`,
});

// ==================== TEMPORARY ROUTES ====================

// GET temp preferences
preferencesRouter.get("/temp", async (_req: Request, res: Response) => {
  const tempUserId = "temp-user-001";

  try {
    let prefs = await UserPreference.findOne({ userId: tempUserId });

    if (!prefs) {
      prefs = new UserPreference({
        userId: tempUserId,
        categories: [],
        llmContext: buildLLMContext([]),
      });
    }

    return res.json(prefs);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "DB error finding preferences" });
  }
});

// POST temp preferences
preferencesRouter.post("/temp", validatePreferences, async (req: Request, res: Response) => {
  const tempUserId = "temp-user-001";
  const data = matchedData(req);
  const categories = data.categories || [];
  const llmContext = buildLLMContext(categories);

  try {
    const existing = await UserPreference.findOne({ userId: tempUserId });

    if (existing) {
      existing.categories = categories;
      existing.llmContext = llmContext;
      await existing.save();
      return res.json(existing);
    }

    const newPrefs = await UserPreference.create({
      userId: tempUserId,
      categories,
      llmContext,
    });

    return res.status(201).json(newPrefs);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "DB error saving preferences" });
  }
});

// DELETE temp preferences
preferencesRouter.delete("/temp", async (_req: Request, res: Response) => {
  const tempUserId = "temp-user-001";

  try {
    const result = await UserPreference.deleteOne({ userId: tempUserId });
    if (result.deletedCount === 0)
      return res.status(404).json({ error: "No preferences found" });

    return res.json({ message: "Preferences deleted successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "DB error deleting preferences" });
  }
});

// ==================== AUTHENTICATED ROUTES ====================

preferencesRouter.get("/auth", async (req: Request, res: Response) => {
  const username = req.session?.username as string;
  if (!username) return res.status(401).json({ error: "Not authenticated" });

  try {
    let prefs = await UserPreference.findOne({ userId: username });

    if (!prefs) {
      prefs = new UserPreference({
        userId: username,
        categories: [],
        llmContext: buildLLMContext([]),
      });
    }

    return res.json(prefs);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "DB error finding preferences" });
  }
});

preferencesRouter.post("/auth", validatePreferences, async (req: Request, res: Response) => {
  const username = req.session?.username as string;
  if (!username) return res.status(401).json({ error: "Not authenticated" });

  const data = matchedData(req);
  const categories = data.categories || [];
  const llmContext = buildLLMContext(categories);

  try {
    const existing = await UserPreference.findOne({ userId: username });

    if (existing) {
      existing.categories = categories;
      existing.llmContext = llmContext;
      await existing.save();
      return res.json(existing);
    }

    const newPrefs = await UserPreference.create({
      userId: username,
      categories,
      llmContext,
    });

    return res.status(201).json(newPrefs);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "DB error saving preferences" });
  }
});

preferencesRouter.delete("/auth", async (req: Request, res: Response) => {
  const username = req.session?.username as string;
  if (!username) return res.status(401).json({ error: "Not authenticated" });

  try {
    const result = await UserPreference.deleteOne({ userId: username });
    if (result.deletedCount === 0)
      return res.status(404).json({ error: "Preferences not found" });

    return res.json({ message: "Preferences deleted successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "DB error deleting preferences" });
  }
});

export default preferencesRouter;