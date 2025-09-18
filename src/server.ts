import "dotenv/config";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import { apiLimiter } from "./middleware/rateLimit";
import { notFound, errorHandler } from "./middleware/error";
import retellRoutes from "./routes/retell";

const app = express();

const PORT = Number(process.env.PORT || 3001);
const ALLOWED = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.set("trust proxy", 1);

app.use(helmet());
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

// CORS
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || ALLOWED.length === 0 || ALLOWED.includes(origin)) {
        return callback(null, true);
      }
      callback(new Error("Not allowed by CORS"));
    },
    credentials: false,
  })
);

// Rate limit everything under /api
app.use("/api", apiLimiter);

// Health
app.get("/health", (_req, res) => res.json({ ok: true }));

// Retell API routes
app.use("/api/retell", retellRoutes);

// 404 + error
app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Retell backend listening on http://localhost:${PORT}`);
});
