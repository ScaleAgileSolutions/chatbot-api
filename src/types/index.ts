export type ChatMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

export type StartChatResponse = { chat_id: string };
export type SendResponse = { messages: ChatMessage[] };
