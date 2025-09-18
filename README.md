# Retell Backend API

Secure backend for Retell **Chat** (and optional Voice) to be used by your custom UI widget.

## Endpoints

- `POST /api/retell/chat/start` → `{ chat_id }`
- `POST /api/retell/chat/send` → `{ messages: [{ role, content }, ...] }`
- `POST /api/retell/chat/end` → `{ ok: true }`
- `POST /api/retell/voice/create-web-call` → Web call payload (optional)

## Setup

```bash
npm i
cp .env.example .env
# edit .env with RETELL_API_KEY and allowed CORS origins
npm dev
# server runs at http://localhost:3001
```
