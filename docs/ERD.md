# Database ERD

The Prisma schema at `backend/database/schema.prisma` is the source of truth.

## Core identity and RBAC

```mermaid
erDiagram
  users ||--o{ user_roles : has
  roles ||--o{ user_roles : assigned
  roles ||--o{ role_permissions : has
  permissions ||--o{ role_permissions : grants
  users ||--o{ sessions : owns
  users ||--o{ audit_logs : creates
```

## Candidate and skills

```mermaid
erDiagram
  users ||--o| candidate_profiles : owns
  candidate_profiles ||--o{ candidate_educations : has
  candidate_profiles ||--o{ candidate_experiences : has
  candidate_profiles ||--o{ candidate_skills : has
  skills ||--o{ candidate_skills : used_by
```

## Company, business and jobs

```mermaid
erDiagram
  users ||--o{ company_members : member
  companies ||--o{ company_members : has
  companies ||--o{ jobs : posts
  companies ||--o{ company_documents : verifies_with
  job_categories ||--o{ jobs : categorizes
  locations ||--o{ jobs : district
  locations ||--o{ jobs : upazila
  jobs ||--o{ applications : receives
  users ||--o{ applications : submits
  users ||--o{ saved_jobs : saves
  businesses }o--|| locations : located_in
```

## Payment and monetization

```mermaid
erDiagram
  packages ||--o{ package_features : includes
  users ||--o{ orders : creates
  orders ||--o{ payments : paid_by
  payments ||--o| invoices : generates
  users ||--o{ subscriptions : owns
  packages ||--o{ subscriptions : plan
  users ||--o{ advertisements : buys
```

## Admin/CMS/notifications

```mermaid
erDiagram
  users ||--o{ notifications : receives
  users ||--o{ reports : files
  users ||--o{ reviews : writes
  cms_pages }o--|| users : updated_by
  settings }o--|| users : updated_by
```

## Location strategy

Locations are database-driven. Initial seed data contains Bogura and Joypurhat districts and upazilas. Application logic queries the `locations` table; it does not hard-code location names.
