// src/index.ts
/// <reference types="@cloudflare/workers-types" />
import { Hono } from "hono";
import { cors } from "hono/cors";
import { rateLimit } from "./middleware/rateLimit";
import { createRetellRoutes } from "./routes/retell";
import { onErrorHandler, notFoundHandler } from "./middleware/error";

// Tipos de bindings disponibles en el Worker
type Bindings = {
  CORS_ORIGINS: string; // CSV de orígenes permitidos
  RATE_LIMIT_KV: KVNamespace; // KV para rate limit
  RETELL_API_KEY?: string; // (opcional) si quieres llamar a la API de Retell
};

const app = new Hono<{ Bindings: Bindings }>();

// ---------- CORS por whitelist ----------
const parseOrigins = (csv: string) =>
  (csv || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

app.use("*", async (c, next) => {
  const allowed = parseOrigins(c.env.CORS_ORIGINS);

  const dynCors = cors({
    origin: (origin, _c) => {
      if (!origin) return "*";
      if (allowed.length === 0) return "*";
      return allowed.includes(origin) ? origin : null; // null = bloqueado
    },
    credentials: false,
  });

  return dynCors(c, next);
});

// ---------- Rate limit para todo lo que esté bajo /api ----------
app.use(
  "/api/*",
  rateLimit({
    windowSeconds: 60,
    max: 60,
    getKey: (c) => c.req.header("CF-Connecting-IP") || "unknown",
  })
);

// ---------- Health ----------
app.get("/health", (c) => c.json({ ok: true }));

// ---------- Rutas Retell ----------
app.route("/api/retell", createRetellRoutes());

// ---------- 404 ----------
app.notFound(notFoundHandler);

// ---------- Errores ----------
app.onError(onErrorHandler);

export default app;
