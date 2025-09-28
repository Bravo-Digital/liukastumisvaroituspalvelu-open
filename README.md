# Liukasbotti — Slippery Pedestrian Weather Warning Service

> [!IMPORTANT]
> This document targets software developers. For product info, visit **https://liukasbotti.fi**.

Liukasbotti sends localized *slippery conditions* warnings to subscribers via SMS. It’s a modern, typed, containerized stack with an admin dashboard, GDPR tooling, i18n, and optional 2FA for admin login.

---

## Table of contents

- [Features](#features)
- [Architecture](#architecture)
- [Tech stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Quick start (local)](#quick-start-local)
- [Environment variables](#environment-variables)
- [Database & migrations (Drizzle)](#database--migrations-drizzle)
- [Email (Nodemailer)](#email-nodemailer)
- [SMS (GatewayAPI)](#sms-gatewayapi)
- [Internationalization & Theming](#internationalization--theming)
- [Admin dashboard & 2FA](#admin-dashboard--2fa)
- [Reports & GDPR tools](#reports--gdpr-tools)
- [Production with Docker & Traefik](#production-with-docker--traefik)
- [DNS & TLS](#dns--tls)
- [Troubleshooting](#troubleshooting)
- [Scripts](#scripts)
- [Credits](#credits)
- [Security policy](#security-policy)
- [License (AGPL-3.0)](#license-agpl-30)

---

## Features

- **Subscriber warnings**: Queue + scheduler for SMS with per-user language (FI/SV/EN) and preferred send hour  
- **Admin dashboard**: KPIs, active warning management, CSV export, feedback moderation, GDPR tools  
- **Internationalization**: `next-intl` with locale routes (`/fi`, `/sv`, `/en`) and translated UI  
- **Dark mode first**: Next Themes configured for dark mode by default, regardless of system preferences 
- **2FA (TOTP)**: Optional admin two-factor auth with QR enrollment (Google Authenticator, 1Password, Authy)  
- **Email**: Feedback notifications + user confirmations (via SMTP)  
- **Cookie consent**: Cookiebot script support  

---

## Architecture

```
apps/
  └─ Next.js (App Router) — web, admin, APIs
workers/
  └─ Node workers — queue processing & scheduler

PostgreSQL (Docker)
Drizzle ORM (schema + migrations)

Traefik — reverse proxy, TLS (from Let’s Encrypt)
```

**Services (compose):**
- `app`: Next.js server (port 3000)
- `worker`: Node worker processes (queue, schedulers)
- `db`: Postgres 16
- `migrate`: **migration worker (one-shot)** that applies DB migrations
- `pgadmin`: optional DB UI
- `traefik`: reverse proxy + TLS

---

## Tech stack

- **Runtime**: Node.js (PNPM)  
- **Web**: Next.js, React  
- **Styling/UI**: Tailwind, shadcn/ui, lucide icons  
- **Data**: Postgres, Drizzle ORM  
- **Background**: Node workers (concurrently)  
- **Auth (admin)**: Cookie-based + optional TOTP  
- **i18n**: next-intl  
- **Email**: nodemailer  
- **SMS**: GatewayAPI  

---

## Prerequisites

- **Node.js**: 18.x or 20.x  
- **PNPM**: `npm i -g pnpm`  
- **Docker & Docker Compose**  
- **(Prod) domain & DNS** pointing to your VPS  
- **SMTP account** (e.g. a transactional provider)  
- **SMS gateway** for SMS (if you will send SMS)  

---

## Quick start (local)

1) **Clone & install**
```bash
git clone https://github.com/bravo-digital/liukasbotti-open.git
cd liukasbotti-open
pnpm install
```

2) **Fill values to .env**

3) **Start the app**
```bash
# Local full stack (app, worker, db). The migration worker runs automatically.
docker compose -f compose.local-prod.yaml up 
```

> The **migration worker** (service `migrate`) will run once and apply all pending migrations on startup. You do **not** need to run Drizzle manually when using Docker.

---

## Environment variables

Create `.env`

Common keys:

```ini
# App
NODE_ENV=development
WEBHOOK_SECRET=change-me

# Admin login
ADMIN_USERNAME=admin
ADMIN_PASSWORD=supersecret
ADMIN_SECRET=some-random-string

# Database (app connects to db service inside Docker networks)
POSTGRES_DB=liukasbotti
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@db:5432/${POSTGRES_DB}

# Email (Nodemailer)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=postmaster@example.com
SMTP_PASS=yourpass
SMTP_FROM="Liukasbotti Open <noreply@example.com>"
ADMIN_EMAIL=owner@example.com

# SMS (GatewayAPI)
GATEWAYAPI_API_KEY=gw_xxx
REPLY_SENDER=LIUKAS
GATEWAYAPI_BASE=https://gatewayapi.eu

# Traefik / domains (prod)
APP_HOST=liukasbotti.fi
APP_HOST_ALT=www.liukasbotti.fi
LE_EMAIL=admin@liukasbotti.fi
```

---

## Database & migrations (Drizzle)

### TL;DR
- **Docker (recommended):** Migrations are handled **automatically** by the **migration worker** (`migrate` service). On every deploy/boot, it runs and applies pending migrations, then exits. **No manual step required.**

---

## Email (Nodemailer)

Set `SMTP_*` env vars. On VPSs, outbound SMTP ports (25/465/587) can be blocked by the provider/firewall:
- Use the provider’s relay or request port unblocking.
- For Gmail accounts, use **App Passwords** (with 2FA enabled) or an SMTP relay. Plain username/password with “less secure apps” no longer works.

Emails are sent when users submit feedback and (optionally) receive confirmation.

---

## SMS (GatewayAPI)

Set:
```ini
GATEWAYAPI_API_KEY=gw_xxx
REPLY_SENDER=LIUKAS
```
Workers pull pending messages from the `sms_queue` and send them via GatewayAPI. Ensure the `worker` service runs in production.

---

## Internationalization & Theming

- **i18n**: `next-intl` with language routes: `/fi`, `/sv`, `/en`.
- **Dark by default**: ensure you wrap the app with your ThemeProvider that sets:
  ```tsx
  <NextThemesProvider attribute="class" defaultTheme="dark" enableSystem={false} />
  ```
- **Avoid double render flicker**:
  - Use `suppressHydrationWarning` on `<html>`.
  - Pass `attribute="class"` and include Tailwind dark styles.

---

## Admin dashboard & 2FA

- Admin login at **`/admin/login`**. Uses `ADMIN_USERNAME`/`ADMIN_PASSWORD`.
- After login, visit **`/admin/2fa`** to enable TOTP 2FA:
  1. Click **Enable 2FA**.
  2. Scan the QR with Google Authenticator / 1Password / Authy.
  3. Enter code to finalize.
- Next sign-ins will require password **and** TOTP.

---

## Reports & GDPR tools

- **CSV report**: `/admin/report?from=YYYY-MM-DD&to=YYYY-MM-DD`
- **Active warnings**: edit expiry inline.
- **Feedback**: list + mark handled.
- **GDPR**:
  - **Export** (PDF/JSON) at `/admin/gdpr/export`
  - **Rectify / Erase** forms in dashboard

---

## Production with Docker & Traefik

### Build & run

- **Production**: `compose.yaml` (includes **Traefik** & TLS)

**Production example:**
```bash
# 1) Create .env with APP_HOST, APP_HOST_ALT, LE_EMAIL, DB credentials, SMTP, etc.
# 2) Build & start
docker compose up -d --build   # uses compose.yaml
# 3) The migration worker runs automatically. If you need to re-run manually:
docker compose run --rm migrate
```

### Traefik labels (excerpt)

```yaml
labels:
  - traefik.enable=true

  # Primary host (apex)
  - traefik.http.routers.app.rule=Host(`${APP_HOST}`)
  - traefik.http.routers.app.entrypoints=websecure
  - traefik.http.routers.app.tls.certresolver=le
  - traefik.http.services.app.loadbalancer.server.port=3000

  # WWW redirect -> apex
  - traefik.http.routers.www.rule=Host(`${APP_HOST_ALT}`)
  - traefik.http.routers.www.entrypoints=web,websecure
  - traefik.http.routers.www.tls.certresolver=le
  - traefik.http.routers.www.middlewares=redirect-www-to-apex
  - traefik.http.middlewares.redirect-www-to-apex.redirectregex.regex=^https?://${APP_HOST_ALT}/?(.*)
  - traefik.http.middlewares.redirect-www-to-apex.redirectregex.replacement=https://${APP_HOST}/$${1}
  - traefik.http.middlewares.redirect-www-to-apex.redirectregex.permanent=true
```

> **Common Traefik error**: `Host(\`\`) empty args` means an env var like `APP_HOST` or `APP_HOST_ALT` is **empty**. Fix your `.env` and `docker compose up -d`.

---

## DNS & TLS

Recommended records (replace IPs/domains):

```
A     liukasbotti.fi    203.0.113.42
AAAA  liukasbotti.fi    2001:db8::42       (optional IPv6)
CNAME www               liukasbotti.fi
```

Traefik will handle HTTP→HTTPS redirect and obtain Let’s Encrypt certificates automatically (ensure ports **80** and **443** are open).

---

## Troubleshooting

**1) Next.js shows “Invalid next.config.ts option serverComponentsExternalPackages”**  
Change to:
```ts
// next.config.ts
const nextConfig = {
  serverExternalPackages: ["<pkg1>", "<pkg2>"], // replace your previous experimental key
};
export default nextConfig;
```

**2) SMTP works locally but times out on server**  
- Check VPS firewall / provider network policy for **587/465**.
- Use provider SMTP relay or request port unblock.
- For Gmail, use **App Passwords** (requires Google 2FA).  
- Verify `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`.

**3) WWW redirect not working**  
- Ensure `.env` has **both**:
  ```
  APP_HOST=liukasbotti.fi
  APP_HOST_ALT=www.liukasbotti.fi
  ```
- Recreate Traefik: `docker compose up -d --force-recreate traefik`

**4) Dark mode not default**  
- Ensure your **ThemeProvider** uses `defaultTheme="dark"` and `enableSystem={false}`.
- Wrap in `attribute="class"` and have Tailwind `dark:` styles ready.
- Add `suppressHydrationWarning` on `<html>`.

**5) Reset admin 2FA (locked out)**  
From server shell (inside Postgres container):
```bash
docker compose exec db psql -U $POSTGRES_USER -d $POSTGRES_DB -c "DELETE FROM admin_settings;"
```
This clears MFA settings; login with password and re-enroll 2FA.

**6) Build fails after removing a DB column**  
If you removed a DB column (e.g., `name` on feedback) but code still reads it, update the UI to use existing fields (e.g., `subject`) and ensure the migration worker has applied the migration.

---

## Scripts

```bash
pnpm dev             # Next.js dev server
pnpm dev:workers     # Start workers in dev

pnpm build           # Next production build
pnpm build:workers   # Build worker code (if separate ts build)
pnpm start           # Next start (requires build)

# Drizzle commands are only needed when not using Docker.
pnpm drizzle:push    # Apply schema to DB
pnpm drizzle:generate# Generate migration files
```

---

## Credits

**Core & Stewardship**
- **Einari Mustakallio** — product & engineering
- **Moritz Uphoff** — product & engineering

**Design & Brand**
- **Bravo Digital Oy** — visual identity and assets

**Open Source**
- Next.js, Drizzle ORM, Tailwind, shadcn/ui, lucide-react, next-intl, nodemailer, Traefik, PostgreSQL, and many more.

---

## Security policy

- Use strong, unique credentials for admin login.
- Enable **2FA** for admin (recommended).
- Restrict inbound ports on the VPS to **80/443** (Traefik) and your SSH port.
- Store secrets in environment variables or a secrets manager; never commit them.
- Keep dependencies updated and rebuild images regularly.

---

## License (AGPL-3.0)

This project is licensed under the **GNU Affero General Public License v3.0 (AGPL-3.0)**.

- You may **use, modify, and distribute** this software.
- If you **distribute** it or **run it as a network service**, you must make the **complete source code** of your modified version available to users.

Full text: https://www.gnu.org/licenses/agpl-3.0.html

> In short: *you can use it freely, but any improvements you make and share must also remain open.*
