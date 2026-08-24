# Production Deployment & Verification

JOBHUB is a split-stack job marketplace for Bogura & Joypurhat, Bangladesh.

```
Browser → Netlify (frontend, Next.js) → HTTPS REST → Vercel (backend, Express) → Firebase
                   │                                                                  │
                   └── Firebase Auth (email/password + Google) ──────────────────────┤
                       Realtime Database (live notifications)                          │
                                                                    Cloud Firestore ───┘
                                                                    Cloudinary (media)
```

The platform runs entirely on **Firebase** — there is no SQL/PostgreSQL/Prisma anywhere:

- **Firebase Authentication** owns identity (email/password + "Continue with Google").
  The browser holds a Firebase ID token and sends it as a `Bearer` credential.
- **Cloud Firestore** is the datastore. The backend accesses it through the Admin SDK
  via a Prisma-compatible query layer (`backend/src/database/orm.ts`).
- **Realtime Database** mirrors notifications for instant, live updates.
- **Cloudinary** stores images and CVs via signed, direct-to-Cloudinary uploads.

The frontend never holds admin secrets and never trusts client-side role/payment checks.
All business logic, token verification, RBAC, payments and audit logging live in the backend.

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
# Firebase Web SDK (public by design)
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebaseio.com
```

Config file: `frontend/netlify.toml`. In the Firebase console, add your Netlify domain
to **Authentication → Settings → Authorized domains** and enable the **Google** provider.

## 2. Backend → Vercel

- Root/base directory: `backend`
- Build command: `npm run build` (= `tsc --noEmit`)
- Serverless entry: `api/index.ts`
- Build command: `npm run build` (= `tsc --noEmit`)
- Required environment variables (see `backend/.env.example`):

```bash
NODE_ENV=production
# Firebase Admin — either the full service-account JSON…
FIREBASE_SERVICE_ACCOUNT={"type":"service_account", ... }
# …or the three discrete fields:
FIREBASE_PROJECT_ID=your-project
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebaseio.com
# Cloudinary (media/CV storage)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
FRONTEND_URL=https://www.yourdomain.com
ALLOWED_ORIGINS=https://www.yourdomain.com,https://yourdomain.com
PAYMENT_GATEWAY=sslcommerz
PAYMENT_MERCHANT_ID=
PAYMENT_API_KEY=
PAYMENT_SECRET=
PAYMENT_WEBHOOK_SECRET=
PAYMENT_BASE_URL=
BACKEND_PUBLIC_URL=https://api.yourdomain.com
CRON_SECRET=<random>
ROOT_ADMIN_EMAIL=admin@yourdomain.com
ROOT_ADMIN_PASSWORD=<12+ char strong>
```

- Cron jobs are declared in `backend/vercel.json` (hourly job expiry, payment reconciliation).

### Data seeding (no migrations required)

Firestore is schemaless, so there is nothing to migrate. Seed reference data once:

```bash
cd backend
npm run seed     # roles, permissions, locations, categories, packages, settings
SEED_DEMO=1 npm run seed   # optional demo employers/jobs/candidate
```

The core roles/permissions and the root admin (created in **Firebase Auth** and mirrored to
Firestore from `ROOT_ADMIN_EMAIL`/`ROOT_ADMIN_PASSWORD`) are also auto-bootstrapped on first
server start (`src/config/bootstrap.ts`), so the platform is immediately usable.

---

## 3. Security posture

| Control | Implementation |
|---|---|
| CORS | Explicit allowlist via `ALLOWED_ORIGINS`; no wildcard in production |
| Auth | Firebase Authentication (email/password + Google); backend verifies ID tokens (Admin SDK) |
| Sessions | Stateless Bearer ID tokens — no ambient cookies, so CSRF is not applicable |
| Passwords | Managed by Firebase Auth (never stored by the app) |
| RBAC | Role + permission middleware; roles stored in Firestore; `root-admin` short-circuit; every privileged route guarded |
| Input validation | Zod schemas on every request body/query/params |
| Rate limiting | Global 500 req/15min, strict 20 req/15min on auth |
| Headers | Helmet, compression, trust-proxy for correct client IPs |
| Payments | Backend-only; webhook signature verified; idempotent by transaction ID |
| Media | Cloudinary uploads authorized by short-lived signed params minted server-side |
| Audit | Every admin mutation writes to the `audit_logs` collection with actor, before/after, IP |

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

- [ ] Firebase project created; Admin service account set on the backend (`FIREBASE_*`)
- [ ] Firebase web config set on the frontend (`NEXT_PUBLIC_FIREBASE_*`)
- [ ] Email/password + Google providers enabled; Netlify domain added to Authorized domains
- [ ] Realtime Database created; `FIREBASE_DATABASE_URL` set on both apps
- [ ] Cloudinary account created; `CLOUDINARY_*` set for CVs/logos/ads
- [ ] Strong unique `CRON_SECRET`
- [ ] `ALLOWED_ORIGINS` set to the exact Netlify origin(s); no wildcard
- [ ] `ROOT_ADMIN_PASSWORD` strong; root admin verified after first deploy
- [ ] `npm run seed` run for locations/categories/packages
- [ ] Payment gateway credentials + webhook secret set; webhook URL registered
- [ ] HTTPS enforced on both domains; DNS verified
- [ ] Smoke test: register candidate → post free job (employer) → apply → approve (admin)
- [ ] Smoke test: buy package → webhook → job auto-publishes; duplicate webhook is a no-op
- [ ] Mobile layout verified at 320/375/414 px; desktop at 1280/1440 px
