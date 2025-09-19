// src/routes/retell.ts

import { Hono } from "hono";
import { z } from "zod";
import { createRetellClient } from "../lib/retell";

type Bindings = {
  RETELL_API_KEY?: string;
};
// ----- Schemas (mismos que tenías) -----
const StartChatSchema = z.object({
  agent_id: z.string().min(1),
  metadata: z.record(z.string(), z.any()).optional(),
});

const SendSchema = z.object({
  chat_id: z.string().min(1),
  userText: z.string().min(1),
});

const EndChatSchema = z.object({
  chat_id: z.string().min(1),
});

const CreateWebCallSchema = z.object({
  agent_id: z.string().min(1),
  metadata: z.record(z.string(), z.any()).optional(),
});

export const createRetellRoutes = () => {
  const r = new Hono<{ Bindings: Bindings }>();

  // POST /api/retell/chat/start
  r.post("/chat/start", async (c) => {
    try {
      const body = await c.req.json();
      const { agent_id, metadata } = StartChatSchema.parse(body);

      const apiKey = c.env.RETELL_API_KEY;
      if (!apiKey)
        return c.json({ error: "RETELL_API_KEY not configured" }, 500);

      const retell = createRetellClient(apiKey);
      const chat = await retell.createChat({ agent_id, metadata });

      return c.json({ chat_id: chat.chat_id });
    } catch (err: any) {
      if (err?.issues)
        return c.json({ error: "Invalid request", details: err.issues }, 400);
      console.error(
        "[Retell createChat error]",
        err?.status,
        err?.message,
        err?.data || err
      );
      return c.json({ error: "Internal Error" }, 500);
    }
  });

  // POST /api/retell/chat/send
  r.post("/chat/send", async (c) => {
    try {
      const body = await c.req.json();
      const { chat_id, userText } = SendSchema.parse(body);

      const apiKey = c.env.RETELL_API_KEY;
      if (!apiKey)
        return c.json({ error: "RETELL_API_KEY not configured" }, 500);

      const retell = createRetellClient(apiKey);
      const completion = await retell.createChatCompletion({
        chat_id,
        content: userText,
      });

      return c.json({ messages: completion.messages ?? [] });
    } catch (err: any) {
      if (err?.issues)
        return c.json({ error: "Invalid request", details: err.issues }, 400);
      return c.json({ error: "Internal Error" }, 500);
    }
  });

  // POST /api/retell/chat/end
  r.post("/chat/end", async (c) => {
    try {
      const body = await c.req.json();
      const { chat_id } = EndChatSchema.parse(body);

      const apiKey = c.env.RETELL_API_KEY;
      if (!apiKey)
        return c.json({ error: "RETELL_API_KEY not configured" }, 500);

      const retell = createRetellClient(apiKey);
      await retell.endChat(chat_id);

      return c.json({ ok: true });
    } catch (err: any) {
      if (err?.issues)
        return c.json({ error: "Invalid request", details: err.issues }, 400);
      return c.json({ error: "Internal Error" }, 500);
    }
  });

  // POST /api/retell/voice/create-web-call
  r.post("/voice/create-web-call", async (c) => {
    try {
      const body = await c.req.json();
      const { agent_id, metadata } = CreateWebCallSchema.parse(body);

      const apiKey = c.env.RETELL_API_KEY;
      if (!apiKey)
        return c.json({ error: "RETELL_API_KEY not configured" }, 500);

      const retell = createRetellClient(apiKey);
      const call = await retell.createWebCall({ agent_id, metadata });

      return c.json(call);
    } catch (err: any) {
      if (err?.issues)
        return c.json({ error: "Invalid request", details: err.issues }, 400);
      return c.json({ error: "Internal Error" }, 500);
    }
  });

  return r;
};
