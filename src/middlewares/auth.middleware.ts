import { Request, Response, NextFunction } from "express";
import { getSessionUser } from "../utils/auth";
import { IUser } from "../models/User.model";

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  const user = await getSessionUser(req);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  req.user = user;
  next();
};

export const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
  const user = await getSessionUser(req);
  if (!user || (user.role !== "admin" && user.role !== "superadmin")) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  req.user = user;
  next();
};
