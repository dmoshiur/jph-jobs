# API Documentation

Base URL: `/api/v1`

All responses use:

```json
{ "success": true, "message": "Success", "data": {} }
```

Errors use:

```json
{ "success": false, "message": "Something went wrong", "errors": {} }
```

Production stack traces are never returned.

## Auth

Authentication is handled by **Firebase Auth**. Clients sign in with the Firebase Web SDK
(email/password or Google), then send the Firebase **ID token** as
`Authorization: Bearer <token>` on every request. The backend verifies the token and
resolves roles/permissions from Firestore.

| Method | Endpoint | Auth | Description |
|---|---|---:|---|
| POST | `/auth/register` | No | Create the account server-side and assign the RBAC role (candidate/employer/shop-owner) |
| POST | `/auth/session` | Yes (Bearer) | Record login + ensure the Firestore user document is provisioned |
| POST | `/auth/logout` | Yes (Bearer) | No-op server-side (client calls Firebase `signOut`) |
| GET | `/auth/me` | Yes (Bearer) | Current user, roles, permissions, memberships, companies |
| POST | `/auth/forgot-password` | No | Issue a Firebase password-reset link |

Login, token refresh, email verification and password reset are performed by the Firebase
Web SDK on the client — there are no server login/refresh/verify endpoints.

## Storage (Cloudinary)

| Method | Endpoint | Auth | Description |
|---|---|---:|---|
| POST | `/storage/sign` | Yes (Bearer) | Mint signed params for a direct client→Cloudinary upload |
| GET | `/storage/url` | Yes (Bearer) | Resolve a stored `public_id` to a delivery URL |

## Jobs

| Method | Endpoint | Auth | Permission | Description |
|---|---|---:|---|---|
| GET | `/jobs` | No | - | Public paginated job search |
| GET | `/jobs/:id` | No | - | Public job detail |
| POST | `/jobs` | Yes | `jobs.create` | Employer creates job |
| PATCH | `/jobs/:id` | Yes | `jobs.edit` or owner | Edit job |
| DELETE | `/jobs/:id` | Yes | `jobs.delete` | Delete job |
| POST | `/jobs/:id/apply` | Yes | candidate | Apply to job |

## Companies and businesses

| Method | Endpoint | Auth | Permission | Description |
|---|---|---:|---|---|
| GET | `/companies` | No | - | Company directory |
| GET | `/companies/:id` | No | - | Company profile |
| POST | `/companies` | Yes | `companies.create` | Create company |
| PATCH | `/companies/:id` | Yes | owner/`companies.edit` | Edit company |
| GET | `/businesses` | No | - | Business directory |
| POST | `/businesses` | Yes | `businesses.create` | Add business |

## Candidates and applications

| Method | Endpoint | Auth | Permission | Description |
|---|---|---:|---|---|
| GET | `/candidates/me` | Yes | candidate | Own profile |
| PATCH | `/candidates/me` | Yes | candidate | Update profile |
| GET | `/candidates/me/cv` | Yes | candidate | Authorized CV download/signed URL |
| GET | `/applications` | Yes | owner/admin | List applications |
| POST | `/applications` | Yes | candidate | Apply to a job |
| PATCH | `/applications/:id/status` | Yes | company/admin | Move application stage |

## Packages/subscriptions

| Method | Endpoint | Auth | Description |
|---|---|---:|---|
| GET | `/packages` | No | Public configurable packages |
| GET | `/subscriptions/me` | Yes | Current subscriptions |
| POST | `/subscriptions` | Yes | Create subscription order |

## Payments

| Method | Endpoint | Auth | Description |
|---|---|---:|---|
| POST | `/payments/orders` | Yes | Create backend order and initialize gateway checkout |
| GET | `/payments/:id` | Yes | Return backend-known status only |
| POST | `/payments/webhook/:provider` | Gateway signature | Validate gateway event idempotently |
| GET | `/invoices/:id/download` | Yes | Authorized invoice retrieval |

Webhook validation includes signature, gateway, transaction verification, order ID, amount, currency, duplicate transaction, service activation, invoice creation, and audit/event log.

## Admin

All admin endpoints require backend auth and granular permissions.

| Method | Endpoint | Permission |
|---|---|---|
| GET | `/admin/analytics` | `analytics.view` |
| GET/POST/PATCH/DELETE | `/admin/users` | `users.*` |
| GET/POST/PATCH/DELETE | `/admin/jobs` | `jobs.*` |
| GET/POST/PATCH/DELETE | `/admin/companies` | `companies.*` |
| GET/POST/PATCH/DELETE | `/admin/payments` | `payments.*` |
| GET/POST/PATCH/DELETE | `/admin/packages` | `packages.*` |
| GET/POST/PATCH/DELETE | `/admin/subscriptions` | `subscriptions.*` |
| GET/POST/PATCH/DELETE | `/admin/advertisements` | `advertisements.*` |
| GET/POST/PATCH/DELETE | `/admin/categories` | `categories.*` |
| GET/POST/PATCH/DELETE | `/admin/skills` | `skills.*` |
| GET/POST/PATCH/DELETE | `/admin/locations` | `locations.*` |
| GET/POST/PATCH/DELETE | `/admin/cms` | `cms.*` |
| GET/PATCH | `/admin/settings` | `settings.*` |
| GET | `/admin/audit-logs` | `audit_logs.view` |
| POST/PATCH/DELETE | `/admin/admins` | `admins.*`, root restrictions |

## Validation examples

### Register request

```json
{
  "name": "Ayesha Rahman",
  "email": "ayesha@example.com",
  "password": "StrongPass123!",
  "accountType": "candidate"
}
```

### Create payment order request

```json
{
  "packageId": "pkg_id",
  "purpose": "JOB_PACKAGE",
  "jobId": "job_id"
}
```
