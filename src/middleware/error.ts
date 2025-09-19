// src/middleware/error.ts
import type { Context } from "hono";

export const notFoundHandler = (c: Context) =>
  c.json({ error: "Not Found" }, 404);

export const onErrorHandler = (err: unknown, c: Context) => {
  console.error(err);
  return c.json({ error: "Internal Error" }, 500);
};
