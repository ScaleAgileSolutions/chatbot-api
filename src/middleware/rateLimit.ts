/// <reference types="@cloudflare/workers-types" />

import type { MiddlewareHandler } from "hono";

type Bindings = {
  RATE_LIMIT_KV: KVNamespace;
};

type Opts = {
  windowSeconds: number;
  max: number;
  getKey?: (c: any) => string;
};

export const rateLimit = (
  opts: Opts
): MiddlewareHandler<{ Bindings: Bindings }> => {
  const { windowSeconds, max, getKey } = opts;

  return async (c, next) => {
    const nowSec = Math.floor(Date.now() / 1000);

    // Identidad del cliente (por defecto, IP)
    const keyPart =
      (getKey && getKey(c)) ||
      c.req.header("CF-Connecting-IP") ||
      c.req.header("x-forwarded-for") ||
      "unknown";

    const windowStart = Math.floor(nowSec / windowSeconds) * windowSeconds;
    const windowEnd = windowStart + windowSeconds;

    const bucketKey = `rl:${keyPart}:${windowStart}`;

    const current = await c.env.RATE_LIMIT_KV.get(bucketKey);
    const count = current ? parseInt(current, 10) : 0;

    if (count >= max) {
      const retryAfter = Math.max(1, windowEnd - nowSec);

      c.header("Retry-After", String(retryAfter));
      c.header("X-RateLimit-Limit", String(max));
      c.header("X-RateLimit-Remaining", "0");
      c.header("X-RateLimit-Reset", String(windowEnd));

      return c.json({ error: "Too Many Requests" }, 429);
    }

    const nextCount = count + 1;
    await c.env.RATE_LIMIT_KV.put(bucketKey, String(nextCount), {
      expiration: windowEnd,
    });

    c.header("X-RateLimit-Limit", String(max));
    c.header("X-RateLimit-Remaining", String(Math.max(0, max - nextCount)));
    c.header("X-RateLimit-Reset", String(windowEnd));

    await next();
  };
};
