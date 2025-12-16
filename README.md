# AI To-Do Challenge
Next.js + Supabase + n8n automation that keeps your to-do list API-first while simulating WhatsApp-style inbox flows.

**Live Demo:** https://ai-todo-challenge-steel.vercel.app/

---

## Overview
When a task is created, the API calls an n8n webhook that enriches the title and can attach suggested steps. Tasks persist in Supabase, and the UI exposes both a traditional list and a floating WhatsApp simulator that hits `/api/inbox` so you can demo chat-driven task creation.

---

## Features
- Create, edit, and complete tasks tied to a flexible `user_identifier` (email, phone, username, etc.).
- Persist data in Supabase and optionally store AI-generated `steps[]` per task.
- Toggle AI steps in the UI: show, hide, or permanently remove them.
- `/api/tasks` CRUD plus `/api/inbox` for chat integrations (WhatsApp, SMS, bots).
- Floating simulator that mimics WhatsApp messages for Loom-ready demos.

## Tech Stack
- **Frontend:** Next.js App Router
- **API:** Next.js Route Handlers
- **Database:** Supabase (PostgreSQL)
- **AI / Automation:** n8n webhook calling LLM tools
- **Hosting:** Vercel (recommended)

---

## Environment Variables
Create `.env.local` (never commit it):

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
N8N_ENHANCE_WEBHOOK_URL=
```

- `NEXT_PUBLIC_*` keys are safe for the browser.
- `SUPABASE_SERVICE_ROLE_KEY` stays server-side only.
- `N8N_ENHANCE_WEBHOOK_URL` is the n8n webhook that enhances tasks.

`.env.local` is ignored via `.gitignore`.

---

## API Endpoints
### `GET /api/tasks?user_identifier=...`
Returns all tasks for the provided identifier.

```bash
curl "http://localhost:3000/api/tasks?user_identifier=daniel@demo.com"
```

### `POST /api/tasks`
Creates a task. If `N8N_ENHANCE_WEBHOOK_URL` is set, the API enriches the title and steps.

```json
{
  "user_identifier": "daniel@demo.com",
  "title": "buy milk"
}
```

### `PATCH /api/tasks/:id`
Update title, completion state, or clear steps.

```bash
curl -X PATCH "http://localhost:3000/api/tasks/<id>" \
  -H "Content-Type: application/json" \
  -d '{"completed": true}'
```

```bash
curl -X PATCH "http://localhost:3000/api/tasks/<id>" \
  -H "Content-Type: application/json" \
  -d '{"steps": null}'
```

### `POST /api/inbox`
Receives chat-style messages. A task is created only when the text contains `#to-do` or `#todo`.

```json
{
  "channel": "whatsapp",
  "from": "+5215512345678",
  "message": "#to-do buy milk"
}
```

Successful responses echo the created task and `triggered: true`; otherwise `triggered: false`.

---

## n8n Webhook Contract
**Endpoint:** `POST ${N8N_ENHANCE_WEBHOOK_URL}`

### Request
```json
{
  "title": "buy milk"
}
```

### Response
```json
[
  {
    "enhanced_title": "Purchase milk from grocery store",
    "steps": [
      "Go to the store",
      "Select milk",
      "Pay",
      "Store in refrigerator"
    ]
  }
]
```

- `enhanced_title` replaces the task title in Supabase.
- `steps` (optional) are stored as an array.
- If the webhook errors or returns invalid data, the original title is used and `steps` defaults to `null`.

---

## Local Development
```bash
npm install
npm run dev
```
Visit http://localhost:3000 and edit `app/page.tsx`; the page hot-reloads.

### Testing the WhatsApp Simulator
1. Enter a `user_identifier` in the input field.
2. Click the floating **WhatsApp** button.
3. Send a message such as `#to-do pay rent`.
4. The simulator calls `/api/inbox`, and tasks refresh if a trigger occurred.

---

## Deployment (Vercel)
1. Import the repo into Vercel.
2. Configure the environment variables in **Project → Settings → Environment Variables**.
3. Deploy; every push to main triggers a new build.

---

## Notes
- `.env.local` never leaves your machine.
- The Supabase service role key remains server-side only.
- `/api/inbox` can be wired to real WhatsApp providers (Twilio, Meta Cloud API, etc.).
- The simulator is purely for internal demos; production bots should call the same endpoint directly.

---

## Appendix: Next.js Template Info
Bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

Additional resources:
- [Next.js Documentation](https://nextjs.org/docs)
- [Learn Next.js](https://nextjs.org/learn)
- [Deployment guide](https://nextjs.org/docs/app/building-your-application/deploying)
