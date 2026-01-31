# InvoiceDue — MVP Definition Document

## Document Purpose

This document defines the Minimum Viable Product (MVP) for InvoiceDue. It is derived from `scope.md` (the authoritative source of truth) and represents the smallest complete version of the product that can be shipped to real customers.

**Reference**: All definitions in this document must align with `scope.md`. In case of conflict, `scope.md` takes precedence.

---

## 1. MVP Goal

Ship a working, self-serve accounts receivable follow-up system that allows customers to:

1. Upload overdue invoices via CSV
2. Configure a follow-up policy (scripts, cadence, payment link)
3. Have the system place outbound calls automatically via VAPI
4. View call outcomes and history
5. Operate within enforced usage limits

The MVP proves the core value proposition: automated invoice follow-up calls reduce manual work and improve collection rates.

---

## 2. MVP Features (Complete List)

### 2.1 Authentication and Account Management

| Feature | Description |
|---------|-------------|
| Email/password signup | Self-serve account creation |
| Email/password login | Session-based authentication |
| Password reset | Email-based password recovery |
| Single tenant per account | One company per account |
| Company profile | Company name and timezone configuration |

### 2.2 Invoice Data Management

| Feature | Description |
|---------|-------------|
| CSV upload | Upload overdue invoices via CSV file |
| Column mapping | Auto-detect with manual override for CSV columns |
| Required fields | Customer name, phone number, amount, due date |
| Optional fields | Invoice number, email, notes |
| Validation | Inline validation errors before import |
| Invoice list view | Table with filter and sort |
| Invoice status | Pending, in-progress, completed, failed |
| Manual resolution | Mark invoice as "resolved" |
| Delete invoice | Remove invoice from system |

### 2.3 Follow-Up Policy Configuration

| Feature | Description |
|---------|-------------|
| Call cadence | Select days after due date (default: 3, 7, 14, 30) |
| Max attempts | Configure maximum call attempts per invoice (1–10, default: 5) |
| Call window | Start and end time for calls (default: 9 AM – 6 PM) |
| Call days | Select active days (default: Mon–Fri) |
| Greeting script | Customizable with variable placeholders |
| Voicemail script | Customizable with variable placeholders |
| Payment link | Customer-provided URL (required) |
| SMS toggle | Send payment link via SMS after call (default: on) |
| Default policy | New accounts start with sensible defaults |

**Variable placeholders for MVP:**
- `{{customer_name}}`
- `{{amount_due}}`
- `{{invoice_number}}`
- `{{days_overdue}}`
- `{{company_name}}`

### 2.4 Outbound Calling

| Feature | Description |
|---------|-------------|
| Automated call dispatch | System places calls based on policy and cadence |
| VAPI integration | All calls handled via VAPI |
| Call outcome capture | Logged via VAPI webhook |
| Outcome codes | `answered`, `voicemail`, `no_answer`, `busy`, `wrong_number`, `disconnected` |
| Retry logic | Respects max attempts and cadence rules |
| SMS delivery | Payment link sent via SMS when enabled |

### 2.5 Call History and Logging

| Feature | Description |
|---------|-------------|
| Call log table | Date/time, customer, phone, duration, outcome |
| Filter and sort | By outcome, date range, customer |
| Link to invoice | Navigate from call to related invoice |
| CSV export | Download call history as CSV |

### 2.6 Usage Tracking and Limits

| Feature | Description |
|---------|-------------|
| Minute tracking | Real-time tracking of call duration |
| Usage display | Minutes used / minutes allocated (displayed in UI) |
| Soft warning (80%) | In-app notification when approaching limit |
| Soft warning (95%) | Prominent warning near limit |
| Hard cap (100%) | Calls blocked when limit reached |
| Manual allocation | Usage limits set manually per tenant (admin/operator action) |

### 2.7 Dashboard

| Feature | Description |
|---------|-------------|
| Invoice summary | Total overdue invoices loaded |
| Call summary | Calls made this period |
| Usage meter | Visual display of minutes used vs. allocated |
| Recent activity | Last 10 call outcomes |
| Alerts | Usage warnings and system notifications |

---

## 3. Explicit Non-Goals (MVP Exclusions)

The following are **not part of MVP** and must not be implemented:

| Exclusion | Rationale |
|-----------|-----------|
| Stripe integration | No subscription billing, payment method management, or automated invoicing in MVP. Usage limits are manually allocated. |
| Subscription tiers | No self-serve plan selection or upgrades |
| Overage billing | No automatic charges for exceeding limits |
| Accounting integrations | QuickBooks, Xero, etc. are post-MVP |
| Inbound calling | Outbound only per scope.md |
| Call recordings | Deferred. Logging only in MVP. |
| Call recording playback | No audio playback in UI |
| Multi-user accounts | Single user per account in MVP |
| User roles (Admin/Member) | No role-based access control |
| SSO authentication | Email/password only |
| Email notifications | No email alerts for usage, daily summary, or failures |
| Preview call feature | No VAPI test mode preview in UI |
| Caller ID selection | System-assigned number only |
| Logo upload | Not used in calls; deferred |
| Policy change audit log | Logging is call-only in MVP |
| Upload audit log | Deferred |

---

## 4. System Boundaries and Assumptions

### 4.1 Boundaries

| Boundary | Definition |
|----------|------------|
| Data input | CSV upload only. No API, no integrations. |
| Call direction | Outbound only. No inbound call handling. |
| Payment handling | Customer provides payment link. No payment processing. |
| Voice provider | VAPI only. No fallback or alternative providers. |
| Deployment | Vercel only. No self-hosted or alternative deployment. |
| Billing | Manual allocation of usage limits. No automated billing. |

### 4.2 Assumptions

| Assumption | Implication |
|------------|-------------|
| Customers have existing payment links | System does not generate or manage payment links |
| Customers have valid phone numbers | No phone number validation beyond format checking |
| VAPI is available and reliable | No fallback voice provider |
| Vercel Cron is sufficient for scheduling | No external job queue required |
| Single user per account is acceptable for early customers | Multi-user is post-MVP |
| Manual usage allocation is acceptable for early customers | Operator manually sets limits per tenant |

---

## 5. User Flows (Happy Path)

### 5.1 Signup and Onboarding

1. User visits signup page
2. User enters email, password, company name
3. Account is created with default follow-up policy
4. User is redirected to dashboard
5. Dashboard prompts user to upload invoices and configure payment link

### 5.2 Upload Invoices

1. User navigates to Invoices screen
2. User clicks "Upload CSV"
3. User selects or drags CSV file
4. System displays column mapping preview
5. User confirms or adjusts column mapping
6. System validates data and shows errors (if any)
7. User confirms import
8. Invoices appear in list with status "pending"

### 5.3 Configure Policy

1. User navigates to Policy screen
2. User enters payment link URL (required)
3. User optionally adjusts cadence, scripts, call window
4. User saves policy
5. System confirms policy saved

### 5.4 Calls Are Placed

1. Scheduled job runs (Vercel Cron)
2. System identifies invoices due for follow-up based on cadence
3. System checks usage limit (minutes remaining > 0)
4. System dispatches call via VAPI
5. VAPI places call and reports outcome via webhook
6. System logs call outcome and updates invoice status
7. If SMS enabled, system sends payment link via SMS

### 5.5 Review Call History

1. User navigates to Call History screen
2. User views table of calls with outcomes
3. User filters by outcome or date
4. User clicks call row to view related invoice
5. User exports call history to CSV

### 5.6 Usage Limit Reached

1. System tracks minutes used per call
2. At 80% usage, soft warning displayed on dashboard
3. At 95% usage, prominent warning displayed
4. At 100% usage, calls are blocked
5. User sees "limit reached" message on dashboard
6. Operator manually increases allocation (out-of-band)

---

## 6. Data Entities (MVP)

### 6.1 Tenant

| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary key |
| email | String | Login email |
| password_hash | String | Hashed password |
| company_name | String | Used in call scripts |
| timezone | String | IANA timezone identifier |
| created_at | Timestamp | |
| updated_at | Timestamp | |

### 6.2 Invoice

| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary key |
| tenant_id | UUID | Foreign key (tenant isolation) |
| customer_name | String | Required |
| phone_number | String | Required, E.164 format preferred |
| amount | Decimal | Required |
| due_date | Date | Required |
| invoice_number | String | Optional |
| email | String | Optional |
| notes | String | Optional |
| status | Enum | `pending`, `in_progress`, `completed`, `failed` |
| last_call_outcome | String | Nullable |
| call_attempts | Integer | Default 0 |
| next_call_date | Date | Nullable, calculated from cadence |
| created_at | Timestamp | |
| updated_at | Timestamp | |

### 6.3 Policy

| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary key |
| tenant_id | UUID | Foreign key (one policy per tenant) |
| cadence_days | Array[Integer] | e.g., [3, 7, 14, 30] |
| max_attempts | Integer | 1–10 |
| call_window_start | Time | e.g., 09:00 |
| call_window_end | Time | e.g., 18:00 |
| call_days | Array[String] | e.g., ["mon", "tue", "wed", "thu", "fri"] |
| greeting_script | Text | With placeholders |
| voicemail_script | Text | With placeholders |
| payment_link | String | URL, required |
| sms_enabled | Boolean | Default true |
| created_at | Timestamp | |
| updated_at | Timestamp | |

### 6.4 CallLog

| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary key |
| tenant_id | UUID | Foreign key (tenant isolation) |
| invoice_id | UUID | Foreign key |
| phone_number | String | Number dialed |
| started_at | Timestamp | Call start time |
| ended_at | Timestamp | Call end time |
| duration_seconds | Integer | Call duration |
| outcome | Enum | `answered`, `voicemail`, `no_answer`, `busy`, `wrong_number`, `disconnected` |
| vapi_call_id | String | VAPI correlation ID |
| created_at | Timestamp | |

### 6.5 UsageRecord

| Field | Type | Notes |
|-------|------|-------|
| id | UUID | Primary key |
| tenant_id | UUID | Foreign key |
| period_start | Date | Billing period start |
| period_end | Date | Billing period end |
| minutes_allocated | Integer | Manually set by operator |
| minutes_used | Decimal | Accumulated from calls |
| created_at | Timestamp | |
| updated_at | Timestamp | |

---

## 7. External Dependencies (MVP)

| Dependency | Purpose | Required for MVP |
|------------|---------|------------------|
| **VAPI** | Voice orchestration (outbound calls, SMS) | Yes |
| **Vercel** | Hosting (frontend, serverless functions, cron) | Yes |
| **PostgreSQL** | Database (via Neon, Supabase, or equivalent) | Yes |
| **Vercel Blob or S3** | CSV file storage | Yes |
| **Stripe** | Subscription billing | **No (excluded from MVP)** |

### 7.1 VAPI Integration Points

| Integration | Description |
|-------------|-------------|
| Outbound call API | Initiate calls with script and recipient |
| SMS API | Send payment link after call |
| Webhook receiver | Receive call outcome events |
| Signature verification | Validate webhook authenticity |

### 7.2 Vercel Integration Points

| Integration | Description |
|-------------|-------------|
| Serverless Functions | API routes for all backend logic |
| Cron Jobs | Scheduled job to process call queue |
| Environment Variables | Configuration for all secrets and settings |
| Blob Storage | CSV upload storage |

---

## 8. Operational Constraints

### 8.1 Usage Limits

| Constraint | Value | Enforcement |
|------------|-------|-------------|
| Minutes per tenant | Manually allocated | Stored in UsageRecord |
| Soft warning threshold | 80% | In-app notification |
| Hard warning threshold | 95% | Prominent in-app warning |
| Hard cap | 100% | Calls blocked |

### 8.2 Cost Controls

| Control | Description |
|---------|-------------|
| Pre-call check | Verify minutes remaining before dispatching call |
| Hard cap enforcement | Absolutely no calls placed when limit reached |
| No overage | MVP does not support overage; calls simply stop |

### 8.3 Failure Handling

| Failure Mode | Handling |
|--------------|----------|
| VAPI call fails | Log failure, mark invoice for retry on next cadence |
| VAPI webhook missing | Cron job queries VAPI for call status (reconciliation) |
| CSV upload fails | Show validation errors, do not import partial data |
| Database unavailable | Return 503, retry on next request |
| Cron job fails | Vercel retries automatically; calls processed on next run |

### 8.4 Rate Limits

| Limit | Value | Rationale |
|-------|-------|-----------|
| Concurrent calls per tenant | 5 | Prevent VAPI abuse and cost runaway |
| CSV upload size | 5 MB | Reasonable for initial use |
| Invoices per upload | 1,000 | Prevent excessive data loads |
| API requests per minute | 100 per tenant | Standard rate limiting |

---

## 9. Security and Multi-Tenant Isolation

### 9.1 Authentication

| Requirement | Implementation |
|-------------|----------------|
| Password hashing | bcrypt or argon2 |
| Session management | Secure HTTP-only cookies |
| CSRF protection | Token-based CSRF prevention |
| Rate limiting on login | Prevent brute force attacks |

### 9.2 Tenant Isolation

| Requirement | Implementation |
|-------------|----------------|
| All queries scoped by tenant_id | Enforced at application layer |
| No cross-tenant data access | Verified by tenant_id on every read/write |
| Row-level security (optional) | Database-level enforcement as defense in depth |
| Tenant ID from session | Never from client-provided input |

### 9.3 Data Protection

| Requirement | Implementation |
|-------------|----------------|
| Encryption in transit | HTTPS enforced (Vercel default) |
| Encryption at rest | Database provider encryption |
| PII handling | Phone numbers and names treated as sensitive |
| API key storage | VAPI keys encrypted, never exposed to frontend |
| Signed URLs for files | Time-limited access to uploaded CSVs |

### 9.4 Webhook Security

| Requirement | Implementation |
|-------------|----------------|
| VAPI signature verification | Validate HMAC signature on all webhooks |
| Idempotency | Handle duplicate webhook deliveries safely |
| Logging | All webhook events logged for debugging |

---

## 10. Deferred Features (Post-MVP)

The following features are defined in `scope.md` but explicitly deferred from MVP:

| Feature | Scope Reference | Notes |
|---------|-----------------|-------|
| Stripe subscription billing | Section 7 | Manual allocation for MVP |
| Subscription tiers and upgrades | Section 7.1 | Requires Stripe |
| Overage billing | Section 7.2 | Requires Stripe |
| Accounting integrations | Section 4.1 | QuickBooks, Xero, etc. |
| Call recordings | Section 9.1 | Storage and playback |
| Call recording playback | Section 10.2.4 | Requires recordings |
| Multi-user accounts | Section 10.2.5 | Single user for MVP |
| User roles | Section 10.2.5 | Requires multi-user |
| Email notifications | Section 10.2.5 | Usage warnings, daily summary |
| SSO authentication | Section 11 | OAuth/SAML |
| Preview call (VAPI test mode) | Section 10.2.3 | Script testing |
| Caller ID selection | Section 10.2.5 | System-assigned only |
| Policy change audit log | Section 9.2 | Call logging only |
| Upload audit log | Section 9.2 | Deferred |

---

## 11. MVP Completion Criteria

The MVP is complete when:

1. A new user can sign up with email/password
2. A new user can upload a CSV of overdue invoices
3. A new user can configure a follow-up policy with payment link
4. The system places outbound calls via VAPI according to the policy
5. Call outcomes are logged and visible in call history
6. Usage is tracked and hard caps prevent calls when limit reached
7. All data is isolated by tenant
8. The system runs reliably on Vercel

---

*This document defines the MVP for InvoiceDue. Features not listed here are out of scope for MVP. See `scope.md` for the full product scope.*
