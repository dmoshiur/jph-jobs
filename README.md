# JOBHUB — Bogura & Joypurhat Jobs Platform

JOBHUB is a production-ready, Bangla-first, two-application job marketplace for
Bogura and Joypurhat, Bangladesh — candidates, employers/companies and local
businesses on a professional dense job-portal UX, backed by a trusted API.

## What's included

- **Frontend (Next.js 15, Netlify):** blue design system, desktop multi-level header +
  dedicated mobile header/drawer + bottom nav, search hero with autocomplete, live
  stats, location chips, categories, featured/hot/latest jobs, companies directory,
  job details with JobPosting schema, candidate & employer dashboards, multi-step job
  posting, packages, and a full multi-admin SaaS backend UI.
- **Backend (Express + Prisma, Vercel):** auth (JWT + rotating refresh + CSRF),
  RBAC (candidate/employer/super-admin/root-admin), jobs/companies/businesses,
  applications + saved jobs + alerts, packages/orders/payments/invoices with
  idempotent webhook verification and job auto-activation, reports/reviews/ads,
  notifications, CMS/settings, comprehensive admin endpoints, audit logs, and a
  seed for Bogura & Joypurhat locations, categories, skills and packages.

See [`docs/PRODUCTION.md`](docs/PRODUCTION.md) for deployment, security and the API surface.

## Mandatory split

```text
frontend/  → Netlify-hosted Next.js client application
backend/   → Vercel-hosted trusted API application
```

The frontend never connects to PostgreSQL, never contains backend controllers, never verifies payments, and never stores private secrets. It communicates with the backend only through `NEXT_PUBLIC_API_URL`.

The backend is the only trusted service. It owns authentication, RBAC, database access, payments, webhooks, audit logs, file authorization, and admin operations.

## Local development

### 1. Backend

```bash
cd backend
cp .env.example .env
npm install
npm run prisma:generate
npm run prisma:migrate
npm run seed
npm run dev
```

Backend default: `http://localhost:3001/api/v1`

Required local backend variables are in `backend/.env.example`. Use a managed PostgreSQL database or a local PostgreSQL instance.

### 2. Frontend

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

Frontend default: `http://localhost:3000`

`frontend/.env.local` must contain:

```bash
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

Only public browser-safe variables may use `NEXT_PUBLIC_`.

## Production deployment

### Frontend → Netlify

- Base directory: `frontend`
- Build command: `npm run build`
- Publish directory: `.next`
- Node version: `22`
- Required environment variable:

```bash
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api/v1
NEXT_PUBLIC_SITE_URL=https://www.yourdomain.com
```

Use `frontend/netlify.toml`, which enables the official Next.js Netlify plugin.

### Backend → Vercel

- Root/base directory: `backend`
- Build command: `npm run build`
- Serverless entry: `api/index.ts`
- Cron routes: configured in `backend/vercel.json`
- Required environment variables:

```bash
DATABASE_URL=
DIRECT_DATABASE_URL=
JWT_SECRET=
REFRESH_TOKEN_SECRET=
COOKIE_SECRET=
FRONTEND_URL=https://www.yourdomain.com
ALLOWED_ORIGINS=https://www.yourdomain.com,https://yourdomain.com
PAYMENT_GATEWAY=sslcommerz
PAYMENT_MERCHANT_ID=
PAYMENT_API_KEY=
PAYMENT_SECRET=
PAYMENT_WEBHOOK_SECRET=
STORAGE_PROVIDER=s3
STORAGE_BUCKET=
STORAGE_REGION=
STORAGE_ACCESS_KEY_ID=
STORAGE_SECRET_ACCESS_KEY=
EMAIL_API_KEY=
SMS_API_KEY=
ROOT_ADMIN_EMAIL=
ROOT_ADMIN_PASSWORD=
```

Never put database, JWT, payment, webhook, storage, email, or SMS secrets in Netlify frontend variables.

## Custom domains

Recommended DNS:

```text
www.yourdomain.com  → Netlify frontend
api.yourdomain.com  → Vercel backend
```

Use HTTPS everywhere. Set backend `ALLOWED_ORIGINS` to the exact frontend domains only. Do not use wildcard production CORS.

## Authentication across Netlify + Vercel

Production uses cross-site secure cookies:

```text
HttpOnly: true
Secure: true
SameSite: none
Path: /
```

Access tokens are short-lived. Refresh tokens are rotated and stored server-side as hashes. CSRF protection uses a double-submit token for unsafe methods when cookies are used.

Frontend API calls set `credentials: 'include'` and send `X-CSRF-Token` from the CSRF cookie. Authorization decisions are never trusted from frontend role state; backend checks authentication, role, and permission on every protected route.

## Database

Backend uses Prisma with PostgreSQL. Schema is in:

```text
backend/database/schema.prisma
```

Run migrations:

```bash
cd backend
npm run prisma:migrate
```

Seed development data, Bogura/Joypurhat locations, packages, roles, permissions, and root admin:

```bash
npm run seed
```

Root admin credentials are read from `ROOT_ADMIN_EMAIL` and `ROOT_ADMIN_PASSWORD`. The seed refuses weak production defaults.

## Payments

Payment logic is backend-only.

Payment flow:

```text
Frontend create order request
→ Backend creates order/payment PENDING
→ Backend initializes configured gateway
→ Gateway redirects user to checkout
→ Gateway webhook/callback hits backend only
→ Backend validates signature and verifies transaction with provider API
→ Backend confirms order, amount, currency, duplicate transaction
→ Backend marks SUCCESS
→ Backend activates package/subscription/job service
→ Backend creates invoice and event/audit log
```

Webhook URL:

```text
https://api.yourdomain.com/api/v1/payments/webhook/{provider}
```

The frontend never receives or verifies raw gateway secrets and never decides payment success.

## Storage

Private CVs, invoices, and documents must use backend-controlled external object storage. The frontend only requests authorized backend URLs/endpoints such as:

```text
GET /api/v1/candidates/me/cv
GET /api/v1/invoices/:id/download
```

## API documentation

See:

- `docs/ARCHITECTURE.md`
- `docs/ERD.md`
- `docs/API.md`
- `docs/FLOWS.md`

## Testing

Backend tests:

```bash
cd backend
npm test
```

Frontend checks:

```bash
cd frontend
npm run lint
npm run typecheck
```

## Production safety checklist

- [ ] Backend `ALLOWED_ORIGINS` contains exact trusted frontend domains only.
- [ ] Frontend has only `NEXT_PUBLIC_API_URL` and other public variables.
- [ ] Backend payment secrets exist only in Vercel.
- [ ] Webhook endpoint is configured in the payment gateway dashboard.
- [ ] Root admin password is rotated immediately after first setup.
- [ ] Database migrations are applied.
- [ ] Object storage bucket is private.
- [ ] Cron endpoints are protected by `CRON_SECRET`.
- [ ] Audit log retention policy is configured.
