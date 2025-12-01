import "express-session";
import { IUser } from "../models/User";

declare module "express-session" {
  interface SessionData {
    username?: string;
    userId?: string;
  }
}

declare global {
  namespace Express {
    interface User extends IUser {}
  }
}

export {};