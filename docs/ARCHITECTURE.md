# Architecture

## 1. Complete architecture

```text
Browser
  |  Firebase Web SDK: email/password + Google sign-in → Firebase ID token
  |  HTTPS, Authorization: Bearer <id-token>
  v
Netlify: frontend/ Next.js client UI
  |
  | NEXT_PUBLIC_API_URL only
  v
Vercel: backend/ Express REST API /api/v1
  |  Firebase Admin SDK (verify ID tokens + data access)
  v
Firebase: Cloud Firestore (datastore) + Realtime Database (live notifications)

Vercel backend also integrates with:
- Firebase Authentication: identity, Google provider, password-reset links, custom claims
- Cloudinary: signed direct uploads for CVs, logos, ad images
- Payment gateways: bKash, Nagad, SSLCommerz, or compatible provider through PaymentGatewayInterface
- Vercel Cron or external scheduler for expiry/reconciliation jobs
```

## 2. Deployment architecture

### Frontend

- Host: Netlify
- Directory: `frontend/`
- Framework: Next.js App Router
- Public API variable: `NEXT_PUBLIC_API_URL`
- No database or payment secrets
- Admin dashboard lives at `/admin`, but all privileged operations call backend APIs

### Backend

- Host: Vercel
- Directory: `backend/`
- Entry: `api/index.ts`
- Runtime: Node.js serverless functions
- API base: `/api/v1`
- Strict configurable CORS
- Stateless auth: verifies Firebase ID tokens (Bearer); no cookies/CSRF required
- Firebase Admin SDK for Firestore/Realtime Database access

### Database

- Cloud Firestore (serverless, schemaless) — accessed through a Prisma-compatible
  query layer (`backend/src/database/orm.ts`) so no SQL exists in the stack
- Realtime Database mirrors notifications for live client updates
- Service-account credentials only in backend environment variables

### Storage

- Cloudinary for CVs, logos, documents and ad images
- Backend mints short-lived signed upload params; clients upload directly to Cloudinary
- Stored `public_id`s are persisted on the owning Firestore document

## 3. Backend module structure

```text
backend/
  api/index.ts
  src/
    app.ts
    server.ts
    config/
    database/
    middleware/
    routes/
    utils/
    jobs/
    webhooks/
    modules/
      auth/
      users/
      candidates/
      employers/
      companies/
      businesses/
      jobs/
      applications/
      packages/
      payments/
      subscriptions/
      advertisements/
      notifications/
      reports/
      locations/
      categories/
      skills/
      admin/
      audit/
      cms/
```

## 4. Frontend module structure

```text
frontend/
  src/
    app/
      (public routes)
      admin/
      auth/
      dashboard/
    components/
    hooks/
    lib/
    services/api.ts
    styles/
    types/
    utils/
  public/
```

## 5. Security architecture

- CORS allowlist is configured by backend `ALLOWED_ORIGINS`
- No `Access-Control-Allow-Origin: *` in production
- Secure headers via Helmet
- Rate limiting for public and auth endpoints
- Zod validation on all write endpoints
- Firestore is a document store — there is no SQL and therefore no SQL-injection surface
- Server-side RBAC middleware checks role and permission
- Audit logging for sensitive admin/payment operations
- Credentials are managed by Firebase Authentication (no password hashes stored by the app)
- Auth uses stateless Firebase ID tokens sent as `Authorization: Bearer` — no ambient
  cookies, so CSRF is not applicable

## 6. Serverless compatibility

- No local persistent uploads
- No in-memory sessions
- No long-running workers
- Database access uses the Firebase Admin SDK (stateless, serverless-friendly)
- Cron tasks are HTTP endpoints protected by `CRON_SECRET` and invoked by Vercel Cron
