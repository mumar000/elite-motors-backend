import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();
// Load config for local development relative to workspace root if empty
import path from "path";
if (!process.env.MONGODB_URI) {
  dotenv.config({ path: path.join(__dirname, "../..", ".env.local") });
}

import authRoutes from "./routes/auth.route";
import carsRoutes from "./routes/cars.route";
import adminRoutes from "./routes/admin.route";
import { connectDB } from "./config/db";

const app = express();
const port = process.env.PORT || 5000;

// Middleware
const origin = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
app.use(cors({ origin, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/cars", carsRoutes);
app.use("/api/admin", adminRoutes);

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK" });
});

async function startServer() {
  try {
    const connection = await connectDB();
    console.log(
      `MongoDB connected: ${connection.connection.host}/${connection.connection.name}`
    );

    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : error;
    console.error("MongoDB connection failed:", message);
    process.exit(1);
  }
}

startServer();
