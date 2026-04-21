# CampX

Welcome to the **CampX** project!

**CampX** is a hyper-local, trust-first, peer-to-peer marketplace exclusively for university students. It enables buying, selling, and renting items (textbooks, electronics, furniture, sports gear, clothing, etc.) within and across campus communities.

For comprehensive documentation, please refer to the [CampX Wiki](https://github.com/theiter8r/campx/wiki), which covers the following:

*   **Architecture & Tech Stack:** Details on the frontend (React/Vite/TypeScript on Vercel), backend (Node.js/Express/Prisma on Railway), and third-party services.
*   **Database Schema:** A visual representation of the PostgreSQL schema.
*   **API Reference:** A detailed list of all backend API endpoints.

## Core Thesis

Shift student transactions from **"Interpersonal Trust"** (WhatsApp groups, Facebook Marketplace) to **"Institutional Trust"** — a platform with Administrative Oversight, Mandatory Real-Name Authentication (RNA), and Automated Escrow services.

## The Solution

A centralized digital platform with:

1.  **College ID Verification** — mandatory before selling (Admin-reviewed).
2.  **Razorpay Escrow** — funds held until buyer confirms receipt.
3.  **In-App Wallet** — frozen/available balance with withdrawal.
4.  **Real-time Chat** — buyer-seller messaging with location sharing.
5.  **Multi-College** — each college has its own scoped marketplace.
6.  **Ratings & Reviews** — trust built through transaction history.

## Tech Stack Highlights

*   **Frontend**: React 18, Vite 6, TypeScript 5, Tailwind CSS, shadcn/ui, TanStack Query, Clerk, Mapbox, Ably. (Hosted on Vercel)
*   **Backend**: Node.js 20, Express 5, Prisma ORM, PostgreSQL 16, Razorpay, Clerk SDK. (Hosted on Railway)

## Deploy on Render

This repository includes a root-level `render.yaml` Blueprint that provisions:

1.  `campx-db` (Render Postgres)
2.  `campx-api` (Node web service from `campx-server/`)
3.  `campx-web` (Static site from `campx-client/`)

### Steps

1.  Push this repo to GitHub.
2.  In Render, go to **New > Blueprint** and connect the repo.
3.  Select the branch and deploy the Blueprint.
4.  When prompted, provide values for all `sync: false` environment variables.
5.  After first deploy, set:
    *   `campx-web` → `VITE_API_URL=https://<campx-api>.onrender.com`
    *   `campx-api` → `FRONTEND_URL=https://<campx-web>.onrender.com`
6.  Redeploy both services once these two URLs are set.

`campx-api` runs Prisma schema changes on deploy:
* If `prisma/migrations` exists, it runs `prisma migrate deploy`.
* Otherwise, it falls back to `prisma db push`.

---
*For more details, see the [Wiki Documentation](https://github.com/theiter8r/miniproject-campx/wiki).*
