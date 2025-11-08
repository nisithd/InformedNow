import mongoose from "mongoose";
import { body, validationResult, matchedData } from 'express-validator';

// ==================== MONGODB SCHEMA ====================

const UserPreferencesSchema = new mongoose.Schema({
  userId: { 
    type: String, 
    required: true, 
    unique: true,
    index: true 
  },
  categories: [{ 
    type: String, 
    trim: true 
  }],
  llmContext: {
    preferenceString: String,
    categoryCount: Number,
    prompt: String
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Update the updatedAt timestamp before saving
UserPreferencesSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Compile model from schema
const UserPreferences = mongoose.model("UserPreferences", UserPreferencesSchema);

// ==================== VALIDATION ====================

const validatePreferences = [
  body('categories')
    .isArray()
    .withMessage('Categories must be an array'),
  body('categories.*')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Each category must be 1-50 characters')
    .escape(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

// ==================== TEMPORARY UNAUTHENTICATED ROUTES ====================

// GET temp preferences
export const getTempPreferences = async (req, res) => {
  try {
    const tempUserId = "temp-user-001";

    let prefs = await UserPreferences.findOne({ userId: tempUserId });

    if (!prefs) {
      return res.json({
        userId: tempUserId,
        categories: [],
        createdAt: null,
        updatedAt: null,
        llmContext: {
          preferenceString: '',
          categoryCount: 0,
          prompt: 'User interests: None selected'
        }
      });
    }

    return res.json(prefs);
  } catch (error) {
    console.error("Error fetching temp preferences:", error);
    return res.status(500).json({ error: "DB error finding preferences" });
  }
};

// POST temp preferences
export const saveTempPreferences = [
  validatePreferences,
  async (req, res) => {
    try {
      const tempUserId = "temp-user-001";
      const data = matchedData(req);
      const categories = data.categories || [];

      const llmContext = {
        preferenceString: categories.join(', '),
        categoryCount: categories.length,
        prompt: `User interests: ${categories.length > 0 ? categories.join(', ') : 'None selected'}`
      };

      // Find existing preferences or create new
      let preferences = await UserPreferences.findOne({ userId: tempUserId });

      if (preferences) {
        // Update existing preferences
        preferences.categories = categories;
        preferences.llmContext = llmContext;
        preferences.updatedAt = new Date();

        await preferences.save();
        return res.json(preferences);
      } else {
        // Create new preferences
        preferences = new UserPreferences({
          userId: tempUserId,
          categories: categories,
          llmContext: llmContext
        });

        await preferences.save();
        return res.status(201).json(preferences);
      }
    } catch (error) {
      console.error("Error saving temp preferences:", error);
      return res.status(500).json({ error: "DB error saving preferences" });
    }
  }
];

// DELETE temp preferences
export const deleteTempPreferences = async (req, res) => {
  try {
    const tempUserId = "temp-user-001";

    const result = await UserPreferences.deleteOne({ userId: tempUserId });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "No preferences found" });
    }

    return res.json({ message: "Preferences deleted successfully" });
  } catch (error) {
    console.error("Error deleting temp preferences:", error);
    return res.status(500).json({ error: "DB error deleting preferences" });
  }
};

// ==================== AUTHENTICATED ROUTES (future use) ====================

// GET authenticated preferences
export const getAuthPreferences = async (req, res) => {
  try {
    const username = req.session.username;

    let prefs = await UserPreferences.findOne({ userId: username });

    if (!prefs) {
      return res.json({
        userId: username,
        categories: [],
        createdAt: null,
        updatedAt: null,
        llmContext: {
          preferenceString: '',
          categoryCount: 0,
          prompt: 'User interests: None selected'
        }
      });
    }

    return res.json(prefs);
  } catch (error) {
    console.error("Error fetching auth preferences:", error);
    return res.status(500).json({ error: "DB error finding preferences" });
  }
};

// POST authenticated preferences
export const saveAuthPreferences = [
  validatePreferences,
  async (req, res) => {
    try {
      const username = req.session.username;
      const data = matchedData(req);
      const categories = data.categories || [];

      const llmContext = {
        preferenceString: categories.join(', '),
        categoryCount: categories.length,
        prompt: `User interests: ${categories.length > 0 ? categories.join(', ') : 'None selected'}`
      };

      // Find existing preferences or create new
      let preferences = await UserPreferences.findOne({ userId: username });

      if (preferences) {
        // Update existing preferences
        preferences.categories = categories;
        preferences.llmContext = llmContext;
        preferences.updatedAt = new Date();

        await preferences.save();
        return res.json(preferences);
      } else {
        // Create new preferences
        preferences = new UserPreferences({
          userId: username,
          categories: categories,
          llmContext: llmContext
        });

        await preferences.save();
        return res.status(201).json(preferences);
      }
    } catch (error) {
      console.error("Error saving auth preferences:", error);
      return res.status(500).json({ error: "DB error saving preferences" });
    }
  }
];

// DELETE authenticated preferences
export const deleteAuthPreferences = async (req, res) => {
  try {
    const username = req.session.username;

    const result = await UserPreferences.deleteOne({ userId: username });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Preferences not found" });
    }

    return res.json({ message: "Preferences deleted successfully" });
  } catch (error) {
    console.error("Error deleting auth preferences:", error);
    return res.status(500).json({ error: "DB error deleting preferences" });
  }
};