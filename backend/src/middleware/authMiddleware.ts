import { Request, Response, NextFunction } from "express";

// SECURITY FIX: Extend Express Request type to include session typing
declare module "express-session" {
  interface SessionData {
    username?: string;
    userId?: string;
  }
}

// Middleware to check if user is authenticated
export const requireAuth = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // SECURITY FIX: More thorough session validation
  if (!req.session || !req.session.username || !req.session.userId) {
    res.status(401).json({ 
      error: "Authentication required",
      authenticated: false 
    });
    return;
  }

  // SECURITY FIX: Validate session data format
  if (typeof req.session.username !== 'string' || typeof req.session.userId !== 'string') {
    // Session data corrupted - destroy it
    req.session.destroy(() => {
      res.status(401).json({ 
        error: "Invalid session data",
        authenticated: false 
      });
    });
    return;
  }

  // SECURITY FIX: Check for session hijacking indicators
  // Store original user agent and IP on login, compare here
  // This is optional but recommended for high-security apps
  
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

// SECURITY FIX: Add CSRF protection middleware (optional but recommended)
// This is a simple double-submit cookie pattern
export const csrfProtection = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Skip CSRF for GET, HEAD, OPTIONS
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  const csrfToken = req.headers['x-csrf-token'] as string;
  const csrfCookie = req.cookies?.csrf;

  if (!csrfToken || !csrfCookie || csrfToken !== csrfCookie) {
    res.status(403).json({ 
      error: "Invalid CSRF token",
      code: "CSRF_INVALID" 
    });
    return;
  }

  next();
};

// SECURITY FIX: Role-based access control (if you add user roles later)
export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.session || !req.session.username) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    // You would fetch user role from database here
    // const user = await User.findById(req.session.userId);
    // if (!allowedRoles.includes(user.role)) { ... }

    // For now, just check authentication
    next();
  };
};

// SECURITY FIX: Request logging middleware for security monitoring
export const securityLogger = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const securityHeaders = {
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    method: req.method,
    path: req.path,
    timestamp: new Date().toISOString(),
  };

  // Log suspicious patterns
  if (req.body && typeof req.body === 'object') {
    const bodyStr = JSON.stringify(req.body);
    
    // Detect NoSQL injection attempts
    if (bodyStr.includes('$') && (
      bodyStr.includes('$ne') || 
      bodyStr.includes('$gt') || 
      bodyStr.includes('$lt') ||
      bodyStr.includes('$where')
    )) {
      console.warn('⚠️ SECURITY: Possible NoSQL injection attempt', securityHeaders);
    }

    // Detect XSS attempts
    if (bodyStr.includes('<script') || bodyStr.includes('onerror=')) {
      console.warn('⚠️ SECURITY: Possible XSS attempt', securityHeaders);
    }

    // Detect command injection
    if (bodyStr.includes('&&') || bodyStr.includes('||') || bodyStr.includes(';')) {
      console.warn('⚠️ SECURITY: Possible command injection attempt', securityHeaders);
    }
  }

  next();
};

export default { 
  requireAuth, 
  optionalAuth, 
  csrfProtection, 
  requireRole,
  securityLogger 
};