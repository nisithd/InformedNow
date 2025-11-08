import Datastore from "@seald-io/nedb";
import path from "path";
import { body, validationResult, matchedData } from 'express-validator';

// Set up database path
const dbPath = process.env.NODE_ENV === 'test' ? './testDb' : './database';

// User Preferences Database
const userPreferences = new Datastore({ 
  filename: path.join(dbPath, "userPreferences.db"),
  autoload: true,
  timestampData: true 
});

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
export const getTempPreferences = (req, res) => {
  const tempUserId = "temp-user-001";

  userPreferences.findOne({ userId: tempUserId }, (err, prefs) => {
    if (err) return res.status(500).json({ error: "DB error finding preferences" });

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
  });
};

// POST temp preferences
export const saveTempPreferences = [
  validatePreferences,
  (req, res) => {
    const tempUserId = "temp-user-001";
    const data = matchedData(req);
    const categories = data.categories || [];

    const llmContext = {
      preferenceString: categories.join(', '),
      categoryCount: categories.length,
      prompt: `User interests: ${categories.length > 0 ? categories.join(', ') : 'None selected'}`
    };

    const preferenceDoc = {
      userId: tempUserId,
      categories: categories,
      updatedAt: new Date().toISOString(),
      llmContext: llmContext
    };

    userPreferences.findOne({ userId: tempUserId }, (err, existingPrefs) => {
      if (err) return res.status(500).json({ error: "DB error finding preferences" });

      if (existingPrefs) {
        // Update existing
        userPreferences.update(
          { userId: tempUserId },
          { $set: preferenceDoc },
          {},
          (updateErr) => {
            if (updateErr) return res.status(500).json({ error: "DB error updating preferences" });

            userPreferences.findOne({ userId: tempUserId }, (findErr, updated) => {
              if (findErr) return res.status(500).json({ error: "DB error retrieving updated preferences" });
              return res.json(updated);
            });
          }
        );
      } else {
        // Create new
        preferenceDoc.createdAt = new Date().toISOString();

        userPreferences.insert(preferenceDoc, (insertErr, newPrefs) => {
          if (insertErr) return res.status(500).json({ error: "DB error creating preferences" });
          return res.status(201).json(newPrefs);
        });
      }
    });
  }
];

// DELETE temp preferences
export const deleteTempPreferences = (req, res) => {
  const tempUserId = "temp-user-001";

  userPreferences.remove({ userId: tempUserId }, { multi: false }, (err, numRemoved) => {
    if (err) return res.status(500).json({ error: "DB error deleting preferences" });
    if (numRemoved === 0) return res.status(404).json({ error: "No preferences found" });

    return res.json({ message: "Preferences deleted successfully" });
  });
};

// ==================== AUTHENTICATED ROUTES (future use) ====================

// GET authenticated preferences
export const getAuthPreferences = (req, res) => {
  const username = req.session.username;

  userPreferences.findOne({ userId: username }, (err, prefs) => {
    if (err) return res.status(500).json({ error: "DB error finding preferences" });

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
  });
};

// POST authenticated preferences
export const saveAuthPreferences = [
  validatePreferences,
  (req, res) => {
    const username = req.session.username;
    const data = matchedData(req);
    const categories = data.categories || [];

    const llmContext = {
      preferenceString: categories.join(', '),
      categoryCount: categories.length,
      prompt: `User interests: ${categories.length > 0 ? categories.join(', ') : 'None selected'}`
    };

    const preferenceDoc = {
      userId: username,
      categories: categories,
      updatedAt: new Date().toISOString(),
      llmContext: llmContext
    };

    userPreferences.findOne({ userId: username }, (err, existingPrefs) => {
      if (err) return res.status(500).json({ error: "DB error finding preferences" });

      if (existingPrefs) {
        userPreferences.update(
          { userId: username },
          { $set: preferenceDoc },
          {},
          (updateErr) => {
            if (updateErr) return res.status(500).json({ error: "DB error updating preferences" });

            userPreferences.findOne({ userId: username }, (findErr, updated) => {
              if (findErr) return res.status(500).json({ error: "DB error retrieving updated preferences" });
              return res.json(updated);
            });
          }
        );
      } else {
        preferenceDoc.createdAt = new Date().toISOString();

        userPreferences.insert(preferenceDoc, (insertErr, newPrefs) => {
          if (insertErr) return res.status(500).json({ error: "DB error creating preferences" });
          return res.status(201).json(newPrefs);
        });
      }
    });
  }
];

// DELETE authenticated preferences
export const deleteAuthPreferences = (req, res) => {
  const username = req.session.username;

  userPreferences.remove({ userId: username }, { multi: false }, (err, numRemoved) => {
    if (err) return res.status(500).json({ error: "DB error deleting preferences" });
    if (numRemoved === 0) return res.status(404).json({ error: "Preferences not found" });

    return res.json({ message: "Preferences deleted successfully" });
  });
};
