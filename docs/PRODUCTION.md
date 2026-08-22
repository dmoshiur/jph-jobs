# Production Deployment & Verification

JOBHUB is a split-stack job marketplace for Bogura & Joypurhat, Bangladesh.

```
Browser → Netlify (frontend, Next.js) → HTTPS REST → Vercel (backend, Express) → PostgreSQL
```

The frontend never connects to the database, never stores secrets, and never trusts
client-side role/payment checks. All business logic, auth, RBAC, payments and audit
logging live in the backend.

---

## 1. Frontend → Netlify

- Base directory: `frontend`
- Build command: `npm run build`
- Publish directory: `.next` (uses `@netlify/plugin-nextjs`)
- Node version: 22
- Build env:

```bash
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api/v1
NEXT_PUBLIC_SITE_URL=https://www.yourdomain.com
```

Config file: `frontend/netlify.toml`.

## 2. Backend → Vercel

- Root/base directory: `backend`
- Build command: `npm run build` (= `tsc --noEmit`)
- Serverless entry: `api/index.ts`
- Prisma generates in the Vercel build via `vercel.json.buildCommand`
  (`npm run prisma:generate && npm run build`)
- Required environment variables (see `backend/.env.example`):

```bash
NODE_ENV=production
DATABASE_URL=postgres://...              # managed PostgreSQL (pooled)
DIRECT_DATABASE_URL=postgres://...        # direct connection for migrations
JWT_SECRET=<64-char random>
REFRESH_TOKEN_SECRET=<64-char random>
COOKIE_SECRET=<random>
FRONTEND_URL=https://www.yourdomain.com
ALLOWED_ORIGINS=https://www.yourdomain.com,https://yourdomain.com
COOKIE_SAME_SITE=none                     # cross-site Netlify↔Vercel cookies
PAYMENT_GATEWAY=sslcommerz
PAYMENT_MERCHANT_ID=
PAYMENT_API_KEY=
PAYMENT_SECRET=
PAYMENT_WEBHOOK_SECRET=
PAYMENT_BASE_URL=
BACKEND_PUBLIC_URL=https://api.yourdomain.com
STORAGE_PROVIDER=s3
STORAGE_BUCKET=
STORAGE_REGION=
STORAGE_ACCESS_KEY_ID=
STORAGE_SECRET_ACCESS_KEY=
EMAIL_API_KEY=
SMS_API_KEY=
CRON_SECRET=<random>
ROOT_ADMIN_EMAIL=admin@yourdomain.com
ROOT_ADMIN_PASSWORD=<12+ char strong>
```

- Cron jobs are declared in `backend/vercel.json` (hourly job expiry, payment reconciliation).

### Database migrations

```bash
cd backend
npx prisma migrate deploy --schema database/schema.prisma
npm run seed     # optional: locations, categories, packages, demo (SEED_DEMO=1)
```

The root admin account is auto-bootstrapped from `ROOT_ADMIN_EMAIL`/`ROOT_ADMIN_PASSWORD`
on first server start (`src/config/bootstrap.ts`), so the platform is immediately usable.

---

## 3. Security posture

| Control | Implementation |
|---|---|
| CORS | Explicit allowlist via `ALLOWED_ORIGINS`; no wildcard in production |
| Auth | JWT access (15m) + rotating refresh (30d), stored in HttpOnly Secure SameSite cookies |
| CSRF | Double-submit token enforced on all unsafe methods when cookie-auth is used |
| Passwords | bcrypt cost 12 |
| RBAC | Role + permission middleware; `root-admin` short-circuit; every privileged route guarded |
| Input validation | Zod schemas on every request body/query/params |
| Rate limiting | Global 500 req/15min, strict 20 req/15min on auth |
| Headers | Helmet, compression, trust-proxy for correct client IPs |
| Payments | Backend-only; webhook signature verified; idempotent by transaction ID |
| CV privacy | CV object keys served only via authorized, signed-URL endpoint |
| Audit | Every admin mutation writes to `audit_logs` with actor, before/after, IP |

---

## 4. Payment flow (idempotent)

1. Employer selects a package → `POST /api/v1/payments/orders` (creates `Order` + `Payment`).
2. Backend calls the gateway and returns a `checkoutUrl`.
3. Gateway calls `POST /api/v1/payments/webhook/:provider` with a signature.
4. Backend verifies the signature **and** re-queries the transaction (`verifyTransaction`).
5. Inside a transaction it:
   - checks for an existing SUCCESS payment with the same `providerTransactionId` (idempotency — returns early if found),
   - marks order/payment SUCCESS,
   - generates a unique `Invoice`,
   - creates a `Subscription` or **publishes/links the Job** (JOB_PACKAGE),
   - sends in-app notifications.

Duplicate/delayed webhooks never double-charge, double-publish, or double-invoice.

---

## 5. API surface (all under `/api/v1`)

Public: `/public/stats`, `/public/categories`, `/public/locations`, `/public/search/suggest`,
`/jobs`, `/jobs/x/featured|hot|latest|deadline-tomorrow`, `/jobs/:id`, `/companies`,
`/companies/top`, `/companies/:id`, `/businesses`, `/packages`, `/skills`, `/cms/pages/:slug`.

Authenticated candidate: `/applications`, `/saved-jobs`, `/job-alerts`, `/candidates/me`,
`/jobs/:id/save`, `/notifications`.

Employer: `/jobs` (POST), `/jobs/mine/list`, `/jobs/:id/applicants`, `/companies`,
`/payments/orders`, `/businesses`.

Admin (`/admin/*`): analytics, users, jobs, companies, businesses, applications, payments,
orders, invoices, refunds, packages, categories, locations, reports, reviews,
admins (root only), roles, permissions, settings, broadcast notifications, audit logs.

---

## 6. Pre-launch checklist

- [ ] Strong unique `JWT_SECRET`, `REFRESH_TOKEN_SECRET`, `COOKIE_SECRET`, `CRON_SECRET`
- [ ] `ALLOWED_ORIGINS` set to the exact Netlify origin(s); no wildcard
- [ ] `ROOT_ADMIN_PASSWORD` strong; root admin verified after first deploy
- [ ] Database migrations applied; `npm run seed` run for locations/categories/packages
- [ ] Payment gateway credentials + webhook secret set; webhook URL registered
- [ ] Object storage (S3/R2) bucket + credentials configured for CVs/logos
- [ ] Email/SMS providers configured (tokens/notifications)
- [ ] `COOKIE_SAME_SITE=none` for cross-site Netlify↔Vercel (cookies Secure automatically)
- [ ] HTTPS enforced on both domains; DNS verified
- [ ] Smoke test: register candidate → post free job (employer) → apply → approve (admin)
- [ ] Smoke test: buy package → webhook → job auto-publishes; duplicate webhook is a no-op
- [ ] Mobile layout verified at 320/375/414 px; desktop at 1280/1440 px
