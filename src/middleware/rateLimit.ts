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
    const bucketBase = Math.floor(nowSec / windowSeconds);

    const keyPart = getKey ? getKey(c) : "global";
    const bucketKey = `rl:${keyPart}:${bucketBase}`;

    const current = await c.env.RATE_LIMIT_KV.get(bucketKey);
    const count = current ? parseInt(current, 10) : 0;

    if (count >= max) {
      return c.json({ error: "Too Many Requests" }, 429);
    }

    const ttl = (bucketBase + 1) * windowSeconds - nowSec;
    await c.env.RATE_LIMIT_KV.put(bucketKey, String(count + 1), {
      expirationTtl: ttl,
    });

    await next();
  };
};
