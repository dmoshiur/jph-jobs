# Critical Flows

## Authentication flow

1. User registers or logs in via frontend form.
2. Frontend calls backend `/api/v1/auth/register` or `/api/v1/auth/login` with `credentials: include`.
3. Backend validates input, hashes/compares password, creates/revokes sessions as needed.
4. Backend sets:
   - `accessToken` HttpOnly cookie, short-lived
   - `refreshToken` HttpOnly cookie, rotated and hashed server-side
   - `csrfToken` readable cookie for double-submit header
5. Frontend calls `/api/v1/auth/me` to render UI.
6. Backend remains the source of truth for authorization.

## RBAC flow

1. Protected route invokes `requireAuth`.
2. Backend verifies token and session.
3. Backend loads roles and permissions from database.
4. Route invokes `requirePermission('resource.action')` or role guard.
5. Sensitive admin action writes an immutable audit log.

Roles supported by seed data:

- Candidate
- Employer
- Company Owner
- Recruiter
- Moderator
- Admin
- Super Admin
- Root Admin

Root Admin can manage Super Admin accounts. Super Admin cannot delete Root Admin.

## Payment flow

1. Employer selects package or subscription on frontend.
2. Frontend calls `POST /api/v1/payments/orders`.
3. Backend creates order and pending payment.
4. Backend initializes configured gateway through `PaymentGatewayInterface`.
5. Gateway checkout happens outside frontend secrets.
6. Gateway calls backend webhook `/api/v1/payments/webhook/{provider}`.
7. Backend verifies signature and transaction with provider API.
8. Backend validates amount, currency, order ID, and duplicate transaction.
9. Backend updates payment to `SUCCESS`, activates service, creates invoice.
10. Backend records audit/event log.

Never trust a frontend `payment_success=true` flag.

## Admin flow

1. Admin logs in with normal auth.
2. Frontend admin route displays dashboard only as UI convenience.
3. Every admin API call goes to `/api/v1/admin/*`.
4. Backend checks authentication plus granular permissions.
5. Backend records audit logs for changes.
6. Audit logs are viewable by authorized admins and not editable by normal admins.

## Cron flow

1. Vercel Cron calls `/api/v1/cron/*` endpoints.
2. Backend validates `Authorization: Bearer ${CRON_SECRET}`.
3. Cron performs expiry/reconciliation tasks using database transactions.
