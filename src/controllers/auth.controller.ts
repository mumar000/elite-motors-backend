import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import User from "../models/User.model";
import { createSession, clearSession, getSessionUser } from "../utils/auth";

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    await createSession(user._id.toString(), res);

    return res.json({
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("[POST /api/auth/login]", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const me = async (req: Request, res: Response) => {
  try {
    const user = await getSessionUser(req);

    if (!user) {
      return res.status(401).json({ error: "Unauthenticated" });
    }

    return res.json({
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("[GET /api/auth/me]", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    await clearSession(req, res);
    return res.json({ success: true });
  } catch (error) {
    console.error("[POST /api/auth/logout]", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
