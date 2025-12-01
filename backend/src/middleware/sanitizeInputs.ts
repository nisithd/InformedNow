import { Request, Response, NextFunction } from "express";

function stripMongoOperators(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(stripMongoOperators);
  const out: any = {};
  for (const key of Object.keys(obj)) {
    if (key.startsWith("$") || key.includes(".")) continue;
    out[key] = stripMongoOperators(obj[key]);
  }
  return out;
}

function tryAssign(target: any, prop: string, value: any): boolean {
  try {
    target[prop] = value;
    return true;
  } catch {
    try {
      Object.defineProperty(target, prop, {
        value,
        writable: true,
        configurable: true,
      });
      return true;
    } catch {
      return false;
    }
  }
}

export default function sanitizeInputs() {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (req.body && typeof req.body === "object") {
        req.body = stripMongoOperators(req.body);
      }
      if (req.params && typeof req.params === "object") {
        req.params = stripMongoOperators(req.params);
      }
      const sanitizedQuery = stripMongoOperators(req.query);
      const assigned = tryAssign(req, "query", sanitizedQuery);
      if (!assigned) {
        (req as any).sanitizedQuery = sanitizedQuery;
      }
    } catch {
      // never throw from sanitizer
    } finally {
      next();
    }
  };
}
