# AI To-Do Challenge

Next.js + Supabase + n8n automation workflow that demonstrates how to build a persistent to-do list, enrich each task with AI, and keep everything API-first for Loom-friendly demos.

---

## Features
- Create, edit, complete, and delete (steps) tasks with per-user isolation via a simple identifier
- Persist data in Supabase and surface AI-generated task steps
- Trigger an n8n-hosted LLM workflow on every task creation, with graceful fallbacks
- Expose `/api/tasks` and `/api/inbox` endpoints for UI and chat-style integrations
- Toggle a floating WhatsApp-style simulator to test the inbox endpoint without external tooling

## Tech Stack
- **Frontend:** Next.js (App Router)
- **API:** Next.js Route Handlers
- **Database:** Supabase (Postgres)
- **Automation / AI:** n8n workflow calling LLM tools
- **Hosting:** Vercel (recommended)

---

## Environment Variables
Create a `.env.local` file (do **not** commit it):

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
N8N_ENHANCE_WEBHOOK_URL=
```

- `NEXT_PUBLIC_*` keys are safe for the browser and used by the client.
- `SUPABASE_SERVICE_ROLE_KEY` is server-only (never expose it).
- `N8N_ENHANCE_WEBHOOK_URL` points to the n8n workflow that enhances tasks.

---

## n8n Webhook Contract
When a task is created, the API calls the n8n webhook.

**Endpoint:** `POST /webhook/enhance-task`

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
    "enhanced_title": "Purchase milk from the grocery store",
    "steps": [
      "Go to the store",
      "Select milk",
      "Pay at checkout",
      "Store in refrigerator"
    ]
  }
]
```

- `enhanced_title` replaces the original title in the DB.
- `steps` (optional) are saved as an array per task.
- If the webhook fails, the app falls back to the original title without crashing the flow.

---

## Local Development
```bash
npm install
npm run dev
```
Open http://localhost:3000 and start editing `app/page.tsx`; the page hot-reloads automatically.

### Testing the WhatsApp Simulator
1. Set a `user_identifier` in the input field.
2. Click the floating "WhatsApp" button.
3. Send a message containing `#to-do` or `#todo` (e.g., `#to-do pay rent`).
4. Watch the tasks refresh instantly if the webhook created a task.

---

## Deployment
Deploy to Vercel (or your platform of choice) and configure the same environment variables in the hosting dashboard before building.

---

## Notes
- `.env.local` stays out of version control.
- Supabase service keys remain server-side only.
- The n8n workflow encapsulates all AI prompting and normalization logic.

---

## Appendix: Next.js Template Info
This project started from [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app). For more framework details, refer to:

- [Next.js Documentation](https://nextjs.org/docs)
- [Learn Next.js](https://nextjs.org/learn)
- [Deployment guide](https://nextjs.org/docs/app/building-your-application/deploying)
