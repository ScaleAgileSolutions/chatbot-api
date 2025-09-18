import { Router } from "express";
import { z } from "zod";
import {
  createChat,
  createChatCompletion,
  endChat,
  createWebCall,
} from "../lib/retell.js";

const router = Router();

/* ---------- Schemas ---------- */
const StartChatSchema = z.object({
  agent_id: z.string().min(1),
  metadata: z.record(z.any()).optional(),
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
  metadata: z.record(z.any()).optional(),
});

/* ---------- Routes ---------- */

// POST /api/retell/chat/start
router.post("/chat/start", async (req, res, next) => {
  try {
    const { agent_id, metadata } = StartChatSchema.parse(req.body);
    const chat = await createChat({ agent_id, metadata });
    res.json({ chat_id: chat.chat_id });
  } catch (err: any) {
    console.error(
      "[Retell createChat error]",
      err?.status || err?.response?.status,
      err?.message,
      err?.response?.data || err?.data,
      err
    );
    next(err);
  }
});

// POST /api/retell/chat/send
router.post("/chat/send", async (req, res, next) => {
  try {
    const { chat_id, userText } = SendSchema.parse(req.body);
    const completion = await createChatCompletion({
      chat_id,
      content: userText,
    });

    res.json({ messages: completion.messages ?? [] });
  } catch (err) {
    next(err);
  }
});

// POST /api/retell/chat/end
router.post("/chat/end", async (req, res, next) => {
  try {
    const { chat_id } = EndChatSchema.parse(req.body);

    await endChat(chat_id);

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

router.post("/voice/create-web-call", async (req, res, next) => {
  try {
    const { agent_id, metadata } = CreateWebCallSchema.parse(req.body);
    const call = await createWebCall({ agent_id, metadata });
    res.json(call);
  } catch (err) {
    next(err);
  }
});

export default router;
