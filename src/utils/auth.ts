import { Request, Response } from "express";
import Session from "../models/Session.model";
import User, { IUser } from "../models/User.model";
import crypto from "crypto";

export const SESSION_COOKIE = "emc_session";
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export async function createSession(userId: string, res: Response): Promise<string> {
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + THIRTY_DAYS_MS);

  await Session.create({ userId, token, expiresAt });

  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    expires: expiresAt,
    path: "/",
  });

  return token;
}

export async function getSessionUser(req: Request): Promise<IUser | null> {
  try {
    const token = req.cookies[SESSION_COOKIE];
    if (!token) return null;

    const session = await Session.findOne({
      token,
      expiresAt: { $gt: new Date() },
    }).lean();

    if (!session) return null;

    const user = await User.findById(session.userId).lean();
    return user as IUser | null;
  } catch {
    return null;
  }
}

export async function clearSession(req: Request, res: Response): Promise<void> {
  const token = req.cookies[SESSION_COOKIE];

  if (token) {
    await Session.deleteOne({ token });
  }

  res.cookie(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 0,
    path: "/",
  });
}
