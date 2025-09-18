import Retell from "retell-sdk";

if (!process.env.RETELL_API_KEY) {
  throw new Error("RETELL_API_KEY is missing in environment");
}

export const retell = new Retell({
  apiKey: process.env.RETELL_API_KEY!,
});

export async function createChat(params: { agent_id: string; metadata?: any }) {
  return retell.chat.create(params);
}

export async function createChatCompletion(params: {
  chat_id: string;
  content: string;
  messages?: Array<{ role: "user" | "assistant" | "system"; content: string }>;
}) {
  return retell.chat.createChatCompletion(params);
}

export async function endChat(chat_id: string) {
  return retell.chat.end(chat_id);
}

export async function createWebCall(params: {
  agent_id: string;
  metadata?: any;
}) {
  return retell.call.createWebCall(params);
}
