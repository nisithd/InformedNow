import { Request, Response, NextFunction } from "express";

// Middleware to check if user is authenticated
export const requireAuth = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.session || !req.session.username) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  next();
};

// Middleware to optionally check auth (doesn't block if not authenticated)
export const optionalAuth = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Just pass through, auth info will be in session if available
  next();
};