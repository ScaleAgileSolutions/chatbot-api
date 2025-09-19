const CHAT_BASE = "https://api.retellai.com";
const CALL_BASE = "https://api.retellai.com/v2";

async function apiFetch(
  base: string,
  path: string,
  apiKey: string,
  init: RequestInit = {}
) {
  const resp = await fetch(`${base}${path}`, {
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
  const data = isJson
    ? (() => {
        try {
          return JSON.parse(raw);
        } catch {
          return raw;
        }
      })()
    : raw;
  if (!resp.ok) {
    const err: any = new Error(`Retell API error: ${resp.status}`);
    err.status = resp.status;
    err.data = data;
    throw err;
  }
  return data;
}

export function createRetellClient(apiKey: string) {
  if (!apiKey) throw new Error("RETELL_API_KEY is missing in environment");
  return {
    createChat(params: { agent_id: string; metadata?: any }) {
      return apiFetch(CHAT_BASE, "/create-chat", apiKey, {
        method: "POST",
        body: JSON.stringify(params),
      });
    },
    createChatCompletion(params: {
      chat_id: string;
      content: string;
      messages?: { role: "user" | "assistant" | "system"; content: string }[];
    }) {
      return apiFetch(CHAT_BASE, "/create-chat-completion", apiKey, {
        method: "POST",
        body: JSON.stringify(params),
      });
    },
    endChat(chat_id: string) {
      return apiFetch(
        CHAT_BASE,
        `/end-chat/${encodeURIComponent(chat_id)}`,
        apiKey,
        { method: "PATCH", body: JSON.stringify({}) }
      );
    },
    createWebCall(params: { agent_id: string; metadata?: any }) {
      return apiFetch(CALL_BASE, "/create-web-call", apiKey, {
        method: "POST",
        body: JSON.stringify(params),
      });
    },
  };
}
