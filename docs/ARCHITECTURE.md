# Architecture

## 1. Complete architecture

```text
Browser
  |
  | HTTPS, credentials include, CSRF header
  v
Netlify: frontend/ Next.js client UI
  |
  | NEXT_PUBLIC_API_URL only
  v
Vercel: backend/ Express REST API /api/v1
  |
  | Prisma over pooled PostgreSQL connection
  v
Managed PostgreSQL

Vercel backend also integrates with:
- Payment gateways: bKash, Nagad, SSLCommerz, or compatible provider through PaymentGatewayInterface
- Object storage: S3-compatible private buckets for CVs, invoices, documents
- Email/SMS providers for verification, password reset, OTP-ready flows
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
- HTTP-only cookie auth, refresh token rotation, CSRF protection
- Prisma/PostgreSQL serverless connection strategy

### Database

- Managed PostgreSQL provider suitable for Vercel/serverless
- Credentials only in backend environment variables
- Prisma migrations define the schema

### Storage

- Private object storage for CVs, documents, invoice files
- Backend authorizes every file read and returns secure file response/signed URL

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
- Prisma parameterized queries protect against SQL injection
- Server-side RBAC middleware checks role and permission
- Audit logging for sensitive admin/payment operations
- Password hashing with bcrypt
- Refresh tokens are hashed at rest and rotated
- Cookie auth uses `HttpOnly`, `Secure`, and production `SameSite=None`
- CSRF double-submit token required for unsafe methods

## 6. Serverless compatibility

- No local persistent uploads
- No in-memory sessions
- No long-running workers
- Database access uses a singleton Prisma client and serverless-compatible pooling
- Cron tasks are HTTP endpoints protected by `CRON_SECRET` and invoked by Vercel Cron
