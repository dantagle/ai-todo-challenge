# AI To-Do Challenge
Next.js + Supabase + n8n (AI Automation) + API-first Inbox (WhatsApp Simulator)

**Live Demo (Vercel):**  
https://ai-todo-challenge-steel.vercel.app/

---

## Overview
A To-Do application with persistent storage powered by Supabase.

When a task is created, its title is **enhanced using AI** and optional **suggested steps** are generated via an **n8n webhook**.

The project also includes an **API-first Inbox endpoint** (`/api/inbox`) and a **WhatsApp Simulator UI** to demonstrate how tasks can be created from external messaging platforms.

---

## Features
- Create, edit, and complete tasks
- Persistent storage using Supabase (PostgreSQL)
- Flexible `user_identifier` (email, phone number, or username)
- Task creation with AI enhancement:
  - n8n improves the task title
  - Optional `steps[]` (suggested steps) are generated and stored
- UI controls for suggested steps:
  - Show / hide steps
  - Permanently remove steps (`steps: null`)
- **API-first design**:
  - `/api/inbox` endpoint designed for external integrations (WhatsApp, SMS, bots, etc.)
- **WhatsApp Simulator**:
  - Collapsible side panel
  - Sends messages to `/api/inbox`
  - Simulates real WhatsApp automation behavior

---

## Tech Stack
- **Frontend:** Next.js (App Router)
- **Backend / API:** Next.js Route Handlers
- **Database:** Supabase (PostgreSQL)
- **AI / Automation:** n8n (Webhook-based workflow)
- **Hosting:** Vercel

---

## Environment Variables
Create a `.env.local` file (DO NOT commit it).

```env
# Public (client-side)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Server-only (secrets)
SUPABASE_SERVICE_ROLE_KEY=
N8N_ENHANCE_WEBHOOK_URL=
.env.local is excluded via .gitignore.

API Endpoints
1) Tasks API
GET /api/tasks?user_identifier=...
Returns all tasks for a given user.

Example

bash
Copiar código
curl "http://localhost:3000/api/tasks?user_identifier=daniel@demo.com"
Response

json
Copiar código
{
  "tasks": [
    {
      "id": "uuid",
      "user_identifier": "daniel@demo.com",
      "title": "Purchase milk from grocery store",
      "steps": [
        "Go to the store",
        "Select milk",
        "Pay",
        "Store in refrigerator"
      ],
      "completed": false,
      "created_at": "2025-12-15T20:56:58.769036+00:00",
      "updated_at": "2025-12-15T20:56:58.769036+00:00"
    }
  ]
}
POST /api/tasks
Creates a new task.
If N8N_ENHANCE_WEBHOOK_URL is configured, the task title and steps are enhanced by AI.

Request

json
Copiar código
{
  "user_identifier": "daniel@demo.com",
  "title": "buy milk"
}
Response

json
Copiar código
{
  "task": { "...": "..." }
}
PATCH /api/tasks/:id
Updates an existing task.

Examples

✔ Mark as completed:

bash
Copiar código
curl -X PATCH "http://localhost:3000/api/tasks/<id>" \
  -H "Content-Type: application/json" \
  -d '{"completed": true}'
✔ Remove suggested steps:

bash
Copiar código
curl -X PATCH "http://localhost:3000/api/tasks/<id>" \
  -H "Content-Type: application/json" \
  -d '{"steps": null}'
2) Inbox API (API-First)
POST /api/inbox
Designed to receive messages from external channels (e.g. WhatsApp).

A task is created only if the message contains #to-do or #todo.

Request

json
Copiar código
{
  "channel": "whatsapp",
  "from": "+5215512345678",
  "message": "#to-do buy milk"
}
Response (triggered)

json
Copiar código
{
  "ok": true,
  "triggered": true,
  "channel": "whatsapp",
  "task": {
    "id": "uuid",
    "user_identifier": "+5215512345678",
    "title": "Buy milk from grocery store",
    "steps": ["..."],
    "completed": false
  }
}
Response (not triggered)

json
Copiar código
{
  "ok": true,
  "triggered": false
}
n8n Webhook Contract (Task Enhancer)
When a task is created, the backend calls the n8n webhook.

POST ${N8N_ENHANCE_WEBHOOK_URL}

Request

json
Copiar código
{
  "title": "buy milk"
}
Expected Response

n8n typically returns an array with a single item.

json
Copiar código
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
Fallback behavior

If n8n fails or returns invalid data:

The original title is stored

steps is saved as null

Local Development
bash
Copiar código
npm install
npm run dev
Open:

arduino
Copiar código
http://localhost:3000
Deployment (Vercel)
Import the GitHub repository into Vercel

Configure Environment Variables in Project → Settings → Environment Variables

Deploy

Each git push triggers an automatic redeploy.

Notes
.env.local is excluded from the repository

SUPABASE_SERVICE_ROLE_KEY is used server-side only

The WhatsApp Simulator is a UI tool to demonstrate API-first design

The /api/inbox endpoint can be easily connected to real WhatsApp providers (Twilio, Meta, etc.)

yaml
Copiar código


(This section is kept for reference)



This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
