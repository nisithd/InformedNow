import { Router, Request, Response } from "express";
import { body, validationResult } from "express-validator";
import { User } from "../models/User";
import { sendWelcomeNewsletter } from "../utils/sendWelcomeNewsletter";
import passport from "../config/passport";
import { securityLogger } from "../middleware/authMiddleware";

export const authRouter = Router();

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3001";

const validateSignup = [
  body("username")
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage("Username must be 3-30 characters")
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage("Username can only contain letters, numbers, and underscores")
    .customSanitizer((value) => {
      return value.replace(/[^a-zA-Z0-9_]/g, "");
    }),
  body("email").trim().isEmail().withMessage("Must be a valid email").normalizeEmail().isLength({ max: 254 }).withMessage("Email too long"),
  body("password").isLength({ min: 3, max: 128 }).withMessage("Password must be 3-128 characters"),
  body("newsletterOptIn").optional().isBoolean().withMessage("Newsletter opt-in must be a boolean").toBoolean(),
];

const validateSignin = [
  body("username").trim().notEmpty().withMessage("Username is required").isLength({ max: 30 }),
  body("password").notEmpty().withMessage("Password is required").isLength({ max: 128 }),
];

// GitHub OAuth
authRouter.get("/github", passport.authenticate("github", { scope: ["user:email"] }));

authRouter.get(
  "/github/callback",
  passport.authenticate("github", { failureRedirect: `${FRONTEND_URL}/signin?error=oauth_failed` }),
  (req: Request, res: Response) => {
    const user = req.user as any;
    req.session.username = user.username;
    req.session.userId = user._id.toString();
    req.session.save((err) => {
      if (err) {
        console.error("Session save error:", err);
        return res.redirect(`${FRONTEND_URL}/signin?error=session_error`);
      }
      res.redirect(`${FRONTEND_URL}/?oauth=success`);
    });
  }
);

// Sign Up
authRouter.post("/signup", securityLogger, validateSignup, async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  // Use sanitized body (middleware already sanitized req.body)
  const { username, email, password, newsletterOptIn } = req.body;

  const sanitizedUsername = String(username).toLowerCase().trim();
  const sanitizedEmail = String(email).toLowerCase().trim();

  try {
    const existingUser = await User.findOne({
      $or: [{ username: sanitizedUsername }, { email: sanitizedEmail }],
    });

    if (existingUser) {
      return res.status(409).json({
        error: "User already exists",
        field: existingUser.username === sanitizedUsername ? "username" : "email",
      });
    }

    const newUser = await User.create({
      username: sanitizedUsername,
      email: sanitizedEmail,
      password: password,
      newsletterOptIn: Boolean(newsletterOptIn),
    });

    req.session.username = newUser.username;
    req.session.userId = (newUser._id as any).toString();

    if (newsletterOptIn) {
      sendWelcomeNewsletter(newUser)
        .then(() => console.log(`✅ Welcome newsletter sent to ${sanitizedEmail}`))
        .catch((err) => console.error(`❌ Failed to send welcome newsletter to ${sanitizedEmail}:`, err));
    }

    return res.status(201).json({
      message: "User created successfully",
      user: {
        id: (newUser._id as any).toString(),
        username: newUser.username,
        email: newUser.email,
      },
    });
  } catch (error) {
    console.error("Signup error:", error);
    return res.status(500).json({ error: "Error creating user" });
  }
});

// Sign In
authRouter.post("/signin", securityLogger, validateSignin, async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, password } = req.body;
  const sanitizedUsername = String(username).toLowerCase().trim();

  try {
    const user = await User.findOne({ username: sanitizedUsername });

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    if (!user.password) {
      return res.status(401).json({
        error: "This account uses GitHub sign-in. Please sign in with GitHub.",
      });
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    req.session.username = user.username;
    req.session.userId = (user._id as any).toString();

    return res.json({
      message: "Signed in successfully",
      user: {
        id: (user._id as any).toString(),
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Signin error:", error);
    return res.status(500).json({ error: "Error signing in" });
  }
});

// Sign Out
authRouter.post("/signout", securityLogger, (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Signout error:", err);
      return res.status(500).json({ error: "Error signing out" });
    }
    res.clearCookie("connect.sid");
    return res.json({ message: "Signed out successfully" });
  });
});

// Check Auth Status
authRouter.get("/status", (req: Request, res: Response) => {
  if (req.session.username) {
    return res.json({
      authenticated: true,
      user: {
        username: req.session.username,
        userId: req.session.userId,
      },
    });
  }
  return res.json({ authenticated: false });
});

// Get Current User
authRouter.get("/me", async (req: Request, res: Response) => {
  if (!req.session.username) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    const user = await User.findById(req.session.userId).select("-password");

    if (!user) {
      req.session.destroy(() => {});
      return res.status(404).json({ error: "User not found" });
    }

    return res.json({
      id: (user._id as any).toString(),
      username: user.username,
      email: user.email,
      avatarUrl: user.avatarUrl,
      githubUsername: user.githubUsername,
      createdAt: user.createdAt,
    });
  } catch (error) {
    console.error("Get user error:", error);
    return res.status(500).json({ error: "Error fetching user" });
  }
});

export default authRouter;
