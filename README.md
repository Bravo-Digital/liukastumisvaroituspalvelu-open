# Liukasbotti Open — Slippery pedestrian weather warning service

> [!IMPORTANT]
> This README is for developers. Product copy lives at **https://liukasbotti.fi**.

Liukasbotti ingests Finnish Meteorological Institute (FMI) warnings, queues localized SMS alerts for subscribers, and ships with an admin dashboard for managing content, GDPR requests, and operational reporting. The codebase is TypeScript-first (Next.js App Router + workers) and ready to run locally or in Docker with Traefik.

---

## Table of contents
- [Features](#features)
- [Architecture](#architecture)
- [Project structure](#project-structure)
- [Tech stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Quick start (local)](#quick-start-local)
- [Quick start (production)](#quick-start-production)
- [Environment variables](#environment-variables)
- [Database & migrations](#database--migrations)
- [Email](#email)
- [SMS](#sms)
- [Internationalization & theming](#internationalization--theming)
- [Admin dashboard & 2FA](#admin-dashboard--2fa)
- [Reports & GDPR tools](#reports--gdpr-tools)
- [Troubleshooting](#troubleshooting)
- [Scripts](#scripts)
- [License](#license)

---

## Features
- **FMI ingest → SMS queue:** Workers poll FMI CAP RSS for slippery-pedestrian warnings, filter to target areas (e.g. Uusimaa), and enqueue subscriber SMS jobs with per-user hour windows. 【F:src/index.ts†L1-L132】
- **Scheduler:** A background scheduler batches due SMS queue items, sends through GatewayAPI, retries with backoff, and expires stale warnings. 【F:src/scheduler.ts†L1-L148】【F:src/scheduler.ts†L150-L210】
- **Admin experience:** Protected dashboard (username/password + optional TOTP) to view KPIs, warnings, feedback, GDPR exports, and CSV reports.
- **Internationalization:** Locale routes (`/fi`, `/sv`, `/en`) powered by `next-intl` and JSON message catalogs under `/messages`.
- **Dark-mode-first UI:** Theme provider defaults to dark, with shadcn/ui components and Tailwind CSS v4 styling.

---

## Architecture
```
Next.js (app router)          # Web + API routes
Workers (Node, compiled TS)   # RSS ingest (src/index.ts) + SMS scheduler (src/scheduler.ts)
PostgreSQL + Drizzle ORM      # Persistence
GatewayAPI                    # SMS provider
Nodemailer                    # Email delivery
Traefik                       # HTTPS reverse proxy (Docker)
```

**Compose services (production):**
- `app` – Next.js server (`pnpm start`, port 3000)
- `worker` – runs compiled workers via `pnpm workers`
- `migrate` – one-shot Drizzle migrator (runs `drizzle-kit push`)
- `db` – Postgres 16
- `traefik` – reverse proxy with ACME TLS
- `pgadmin` – optional UI for Postgres

---

## Project structure
```
messages/                 # i18n JSON messages for next-intl
public/                   # static assets (fonts, photos, favicon)
src/
  actions/                # server actions (admin auth, feedback mail, sms send, stats)
  app/                    # Next.js App Router (public site + admin)
  components/             # UI building blocks (shadcn/ui + custom)
  hooks/, i18n/, lib/     # helpers (auth, db, schema, SMS utils, logger)
  scheduler.ts            # SMS scheduler worker
  index.ts                # FMI RSS ingest worker
  middleware.ts           # locale handling
compose.yaml              # Production docker-compose (Traefik, app, worker, db)
Dockerfile                # Multi-stage build: app, worker, migrator
```

---

## Tech stack
- **Runtime:** Node.js 20, PNPM
- **Web:** Next.js 15 (App Router), React 19
- **Workers:** Compiled TypeScript (CommonJS) with `tsc`
- **Styling:** Tailwind CSS v4, shadcn/ui, lucide-react
- **Data:** PostgreSQL + Drizzle ORM
- **Background:** RSS ingest + SMS scheduler workers
- **Auth:** Cookie-based admin session + optional TOTP (otplib)
- **i18n:** `next-intl` with locale routes
- **Email:** Nodemailer
- **SMS:** GatewayAPI

---

## Prerequisites
- Node.js **20**
- PNPM (`corepack enable` recommended)
- PostgreSQL (local) or Docker
- SMTP credentials for feedback mail
- GatewayAPI API key for SMS sending

---

## Quick start (local)
1. **Install deps**
   ```bash
   pnpm install
   ```
2. **Configure environment** – copy `.env` locally with the keys listed below. Use a reachable Postgres `DATABASE_URL`.
3. **Database schema**
   ```bash
   pnpm drizzle-kit push --config=drizzle.config.ts
   ```
4. **Run web app**
   ```bash
   pnpm dev
   ```
5. **Run workers** (after a TypeScript build)
   ```bash
   pnpm build:workers
   pnpm workers
   ```

> Dev server uses Turbopack (`next dev --turbopack`). Workers run from compiled JS in `dist/workers`.

---

## Quick start (production)
1. **Set environment/secret files** – create `secrets/` with files for DB and other secrets, and `.env` for public values (hosts, Traefik ACME email).
2. **Build & start**
   ```bash
   docker compose up -d --build
   ```
   - `migrate` runs Drizzle migrations once on boot.
   - `app` and `worker` load secrets from `/run/secrets` via `scripts/export-and-exec`.
3. **Check HTTPS** – Traefik issues certificates using `APP_HOST`, `APP_HOST_ALT`, and `LE_EMAIL`.

---

## Environment variables
Minimum useful set:
- **App & URLs**: `NODE_ENV`, `NEXT_PUBLIC_SITE_URL` (base URL for sitemap/robots)
- **Admin auth**: `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `ADMIN_SECRET` (session signing)
- **Database**: `DATABASE_URL` (Postgres connection string)
- **Email**: `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`, `ADMIN_EMAIL`
- **SMS outbound**: `GATEWAYAPI_API_KEY`, `GATEWAYAPI_BASE` (optional override), `REPLY_SENDER`
- **SMS inbound**: `SMS_WEBHOOK_SECRET` (shared secret for `/api/receive-sms`)
- **Logging**: `LOG_LEVEL` (pino level, defaults to `info`)
- **Traefik (prod)**: `APP_HOST`, `APP_HOST_ALT`, `LE_EMAIL`

Secrets can be mounted as files (Docker Compose maps `./secrets/*` to `/run/secrets/*`). `scripts/export-and-exec` exports each file name/value to the process environment before boot. 【F:compose.yaml†L21-L92】【F:scripts/export-and-exec†L1-L15】

---

## Database & migrations
- Drizzle schema lives in `src/lib/schema.ts` and outputs SQL to `drizzle/`.
- **Docker:** migrations run automatically via the `migrate` service (`drizzle-kit push`).
- **Local:** run `pnpm drizzle-kit push --config=drizzle.config.ts` whenever the schema changes. 【F:compose.yaml†L93-L122】【F:drizzle.config.ts†L1-L11】

---

## Email
Feedback submissions send email using Nodemailer. Configure SMTP host/port/security and credentials. `SMTP_FROM` defaults to `SMTP_USER`, and admin notifications go to `ADMIN_EMAIL` (or fallback to `SMTP_USER`). 【F:src/actions/feedback.ts†L1-L21】

---

## SMS
- **Outbound:** `src/actions/sendSms.ts` calls GatewayAPI using `GATEWAYAPI_API_KEY` and optional `GATEWAYAPI_BASE`; messages originate from `REPLY_SENDER`. Scheduler batches sends and updates queue status. 【F:src/actions/sendSms.ts†L1-L49】【F:src/scheduler.ts†L150-L210】
- **Inbound:** `/api/receive-sms` validates `SMS_WEBHOOK_SECRET`, then can respond (e.g., STOP flows) while echoing via GatewayAPI with `REPLY_SENDER`. 【F:src/app/api/receive-sms/route.ts†L1-L77】

---

## Internationalization & theming
- Locale-aware routes at `/fi`, `/sv`, `/en` via `next-intl` and middleware.
- Message catalogs live in `messages/{fi,sv,en}.json`.
- Theme provider forces dark mode by default (Next Themes) with Tailwind v4 and shadcn/ui components.

---

## Admin dashboard & 2FA
- Login at `/admin/login` using `ADMIN_USERNAME` / `ADMIN_PASSWORD`.
- Optional TOTP (otplib) stored via admin settings; configure `ADMIN_SECRET` for cookie signing.
- Dashboard offers KPIs, warning management, feedback handling, GDPR exports, and CSV report downloads.

---

## Reports & GDPR tools
- CSV report endpoint: `/admin/report?from=YYYY-MM-DD&to=YYYY-MM-DD` (server route under `src/app/admin/(protected)/report`).
- GDPR tools include export, rectification, and erasure flows surfaced in the admin UI.

---

## Troubleshooting
- **Traefik host errors**: `Host(\"\") empty args` → ensure `APP_HOST` and `APP_HOST_ALT` are set.
- **SMTP timeouts**: many VPS providers block ports 465/587; use relays or request unblock.
- **Workers not sending SMS**: verify `worker` container is running, `GATEWAYAPI_API_KEY` is set, and `REPLY_SENDER` is configured.
- **Dark mode flicker**: ensure `<html suppressHydrationWarning>` with Next Themes `attribute="class"` and default dark theme.

---

## Scripts
```bash
pnpm dev           # Next.js dev server (Turbopack)
pnpm build         # Next.js production build
pnpm start         # Start compiled Next.js app
pnpm build:workers # Compile workers to dist/workers (tsc + tsc-alias)
pnpm workers       # Run compiled workers (RSS ingest + SMS scheduler)
```

---

## License
Licensed under the **GNU Affero General Public License v3.0 (AGPL-3.0)**. If you modify and deploy this service, you must make the complete corresponding source available to users. See https://www.gnu.org/licenses/agpl-3.0.html.
