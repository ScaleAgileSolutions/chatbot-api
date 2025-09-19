// src/lib/retell.ts

const API_BASE = "https://api.retellai.com/v2";

type Json = Record<string, any>;

function safeJson(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function apiFetch(path: string, apiKey: string, init: RequestInit = {}) {
  const resp = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });

  const raw = await resp.text();
  const isJson = (resp.headers.get("Content-Type") || "").includes(
    "application/json"
  );
  const data = isJson ? safeJson(raw) : raw;

  if (!resp.ok) {
    const err = new Error(`Retell API error: ${resp.status}`);
    (err as any).status = resp.status;
    (err as any).data = data;
    throw err;
  }
  return data;
}

/**
 * Crea un cliente con la API key (obtenida desde c.env.RETELL_API_KEY en tus handlers).
 * Mantiene exactamente las MISMAS firmas públicas que tenías en Express.
 */
export function createRetellClient(apiKey: string) {
  if (!apiKey) throw new Error("RETELL_API_KEY is missing in environment");

  return {
    /**
     * retell.chat.create(params)
     * POST /v2/chat
     */
    async createChat(params: {
      agent_id: string;
      metadata?: any;
    }): Promise<Json> {
      return apiFetch("/chat", apiKey, {
        method: "POST",
        body: JSON.stringify(params),
      });
    },

    /**
     * retell.chat.createChatCompletion(params)
     * POST /v2/chat/completions
     */
    async createChatCompletion(params: {
      chat_id: string;
      content: string;
      messages?: Array<{
        role: "user" | "assistant" | "system";
        content: string;
      }>;
    }): Promise<Json> {
      return apiFetch("/chat/completions", apiKey, {
        method: "POST",
        body: JSON.stringify(params),
      });
    },

    /**
     * retell.chat.end(chat_id)
     * POST /v2/chat/{chat_id}/end
     */
    async endChat(chat_id: string): Promise<void> {
      await apiFetch(`/chat/${encodeURIComponent(chat_id)}/end`, apiKey, {
        method: "POST",
        body: JSON.stringify({}),
      });
    },

    /**
     * retell.call.createWebCall(params)
     * POST /v2/create-web-call
     */
    async createWebCall(params: {
      agent_id: string;
      metadata?: any;
    }): Promise<Json> {
      return apiFetch("/create-web-call", apiKey, {
        method: "POST",
        body: JSON.stringify(params),
      });
    },
  };
}

// Para importar con los mismos nombres que usabas:
export type RetellClient = ReturnType<typeof createRetellClient>;
