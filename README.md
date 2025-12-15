
# AI To-Do Challenge  
Next.js + Supabase + n8n (AI Automation)

This project is part of an AI Automation Developer challenge.  
It demonstrates how to build a persistent to-do app and enhance tasks using an AI workflow orchestrated with n8n.

---

## Features
- Create, edit, and complete tasks
- Data persistence using Supabase
- Basic user identifier (email / name)
- On task creation:
  - The task title is enhanced using an AI agent via n8n
  - Optional task steps are generated and stored
- API-first architecture with server-side Supabase access

---

## Tech Stack
- **Frontend:** Next.js (App Router)
- **Backend / API:** Next.js Route Handlers
- **Database:** Supabase (Postgres)
- **Automation / AI:** n8n (LLM-powered workflow)
- **Hosting:** Vercel

---

## Environment Variables

Create a `.env.local` file (do **NOT** commit it):

### Public (client-side)
```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

## Server-only (secret)
SUPABASE_SERVICE_ROLE_KEY=
N8N_ENHANCE_WEBHOOK_URL=

## n8n Webhook Contract

When a task is created, the API calls an n8n webhook to enhance the task.

### Request
**POST** `/webhook/enhance-task`

```json
{
  "title": "buy milk"
}



### Response

```json
[
  {
    "enhanced_title": "Purchase milk from grocery store",
    "steps": [
      "Go to the store",
      "Select milk",
      "Pay at checkout",
      "Store in refrigerator"
    ]
  }
]



The application stores:
- `enhanced_title` as the task title
- `steps` as an array in the database


If the webhook fails, the app gracefully falls back to the original title.

Local Development
npm install
npm run dev


Open:
👉 http://localhost:3000

Deployment

The app is deployed on Vercel.
Environment variables must be configured in the Vercel dashboard before deployment.

Notes

-.env.local is excluded from version control
-Supabase Service Role Key is only used server-side
-n8n workflow handles AI logic and JSON normalization
-Appendix: Next.js Default Docs

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
