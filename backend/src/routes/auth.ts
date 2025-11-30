import { Router, Request, Response } from "express";
import { body, validationResult } from "express-validator";
import { User } from "../models/User";
import { sendWelcomeNewsletter } from "../utils/sendWelcomeNewsletter";

export const authRouter = Router();

// ==================== VALIDATION MIDDLEWARE ====================
const validateSignup = [
  body("username")
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage("Username must be 3-30 characters")
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage("Username can only contain letters, numbers, and underscores"),
  body("email")
    .trim()
    .isEmail()
    .withMessage("Must be a valid email")
    .normalizeEmail(),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
  body("newsletterOptIn")
    .optional()
    .isBoolean()
    .withMessage("Newsletter opt-in must be a boolean"),
];

const validateSignin = [
  body("username").trim().notEmpty().withMessage("Username is required"),
  body("password").notEmpty().withMessage("Password is required"),
];

// ==================== ROUTES ====================

// Sign Up
authRouter.post("/signup", validateSignup, async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, email, password, newsletterOptIn } = req.body;

  try {
    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ username }, { email }],
    });

    if (existingUser) {
      return res.status(409).json({
        error: "User already exists",
        field: existingUser.username === username ? "username" : "email",
      });
    }

    // Create new user
    const newUser = await User.create({
      username,
      email,
      password,
      newsletterOptIn: newsletterOptIn || false,
    });

    // Set session
    req.session.username = newUser.username;
    req.session.userId = (newUser._id as any).toString();

    // Send welcome newsletter if opted in
    if (newsletterOptIn) {
      // Don't await - send in background
      sendWelcomeNewsletter(newUser)
        .then(() => console.log(`✅ Welcome newsletter sent to ${email}`))
        .catch(err => console.error(`❌ Failed to send welcome newsletter to ${email}:`, err));
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
authRouter.post("/signin", validateSignin, async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, password } = req.body;

  try {
    // Find user
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Check password
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Set session
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
authRouter.post("/signout", (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err) {
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
      return res.status(404).json({ error: "User not found" });
    }

    return res.json({
      id: (user._id as any).toString(),
      username: user.username,
      email: user.email,
      createdAt: user.createdAt,
    });
  } catch (error) {
    console.error("Get user error:", error);
    return res.status(500).json({ error: "Error fetching user" });
  }
});

export default authRouter;