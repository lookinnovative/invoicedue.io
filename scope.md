# InvoiceDue — Engineering Scope Document

## Document Purpose

This document defines the product scope for InvoiceDue, a B2B SaaS application. It is intended for engineering implementation planning and serves as the authoritative reference for what the system does and does not do.

---

## 1. What the Product Is

InvoiceDue is a **self-serve, policy-driven accounts receivable follow-up system**.

Customers upload overdue invoice data, configure follow-up policies (call scripts, timing, escalation), and the system automatically places outbound phone calls to collect payment. The calling infrastructure is powered by VAPI as the voice orchestration layer.

The product is designed to feel like a simple business tool—not an AI platform. The user interface intentionally hides all automation, AI, and agent-related concepts from end users.

---

## 2. What Problem It Solves

Small and mid-sized businesses lose significant revenue to overdue invoices. Following up on these invoices is:

- **Time-consuming** — Staff must manually call customers, often repeatedly
- **Inconsistent** — Follow-up depends on individual employee diligence
- **Expensive** — Hiring dedicated AR staff or outsourcing to collection agencies is costly
- **Delayed** — The longer an invoice ages, the less likely it is to be paid

InvoiceDue automates the follow-up process through policy-driven outbound calls, ensuring consistent, timely contact with customers who have overdue balances—without requiring the business to hire additional staff or expose themselves to aggressive collection tactics.

---

## 3. Who the Product Is For

**Primary customers:**

- Small and mid-sized B2B companies (10–500 employees)
- Businesses with recurring invoicing (e.g., wholesalers, service providers, contractors)
- Finance teams or business owners who currently handle AR manually
- Companies without dedicated collections staff

**Not for:**

- Consumer debt collection
- Enterprises requiring deep ERP integration
- Businesses needing inbound call center functionality
- Companies requiring legal collections or enforcement

---

## 4. What the System Does (High-Level)

### 4.1 Data Ingestion

- Customers upload accounts receivable data via **CSV file upload**
- Each record represents an overdue invoice with: customer name, contact phone number, invoice amount, due date, and optional invoice reference
- Future: integrations with accounting systems (QuickBooks, Xero, etc.)

### 4.2 Policy Configuration

- Customers define **follow-up policies** that control:
  - **Call scripts**: What the system says when it reaches someone
  - **Call cadence**: When and how often to attempt contact (e.g., 3 days overdue, then 7 days, then 14 days)
  - **Escalation rules**: What happens if calls are unanswered or unsuccessful
  - **Payment link**: A URL provided by the customer where their clients can pay (e.g., Stripe payment link, QuickBooks pay portal)

### 4.3 Outbound Calling

- The system places outbound calls via **VAPI** (required dependency)
- Calls follow the configured script and cadence
- If a call connects, the system delivers the configured message and provides the payment link (via SMS or verbal instruction)
- Call outcomes are logged: answered, voicemail, no answer, wrong number, payment promised, etc.

### 4.4 Cost Control

- Customers subscribe to a plan with **included call minutes per month**
- Usage is tracked in real-time
- **Soft warnings** are issued as customers approach their limit (e.g., 80% usage)
- **Hard caps** prevent calls from being placed once the limit is reached
- Customers can upgrade their plan or purchase additional minutes

### 4.5 Auditability

- Every call is logged with: timestamp, duration, outcome, and recording (if enabled)
- Customers can view call history per invoice and per customer
- Export of call logs for compliance and internal review

---

## 5. What the System Explicitly Does NOT Do

| Exclusion | Rationale |
|-----------|-----------|
| **Inbound calling** | Out of scope. This is an outbound follow-up system only. |
| **Live payment processing** | InvoiceDue does not process payments. Customers provide their own payment links. |
| **Collections or legal enforcement** | This is not a collections agency. No legal threats, credit reporting, or debt recovery. |
| **Per-user pricing** | Pricing is based on call minutes, not seats. Unlimited users per account. |
| **Workflow builders or advanced customization** | No drag-and-drop workflow editors. Policies are configured via simple forms. |
| **AI/agent/bot terminology in UI** | The UI never mentions AI, agents, bots, automation, or machine learning. The experience is presented as a "follow-up service." |

---

## 6. Required Dependencies

| Dependency | Purpose |
|------------|---------|
| **VAPI** | Voice orchestration layer for all outbound calls. Required. No alternative voice providers are supported in initial scope. |
| **Vercel** | Deployment platform for frontend and backend. Required. All infrastructure assumes Vercel hosting. |
| **Stripe** | Subscription billing and payment method management. Required. |

---

## 7. Subscription and Billing Model

### 7.1 Subscription Tiers

Customers subscribe to monthly plans with included call minutes:

| Plan | Included Minutes | Overage Rate |
|------|------------------|--------------|
| Starter | 100 minutes/month | $0.15/min |
| Growth | 500 minutes/month | $0.12/min |
| Scale | 2,000 minutes/month | $0.10/min |

*Exact pricing TBD. Structure is fixed.*

### 7.2 Usage Enforcement

- **Real-time tracking**: Minute usage is tracked per call
- **Soft warning at 80%**: In-app notification and optional email
- **Soft warning at 95%**: Prominent in-app warning
- **Hard cap at 100%**: No further calls are placed until the next billing cycle or plan upgrade
- **Overage option**: Customers may opt-in to overage billing instead of hard cap

### 7.3 Billing Integration

- Subscription billing via Stripe
- Usage-based overage charges billed at end of cycle

---

## 8. Multi-Tenancy and Data Isolation

- Each customer account is a **tenant**
- All data (invoices, policies, call logs) is **strictly isolated by tenant**
- No cross-tenant data access under any circumstance
- Tenant ID is enforced at the database query level (row-level security or equivalent)

---

## 9. Auditability and Logging

### 9.1 Call Outcome Logging

Every outbound call records:

- Tenant ID
- Invoice/account reference
- Phone number dialed
- Timestamp (start, end)
- Duration (seconds)
- Outcome code: `answered`, `voicemail`, `no_answer`, `busy`, `wrong_number`, `disconnected`, `payment_promised`, `refused`
- Call recording URL (if recording enabled)
- VAPI call ID (for correlation)

### 9.2 Audit Trail

- All policy changes are logged with: timestamp, user, previous value, new value
- All data uploads are logged with: timestamp, user, file name, record count, error count

### 9.3 Retention

- Call logs retained for 2 years minimum
- Call recordings retained per customer preference (default: 90 days)

---

## 10. User Interface Specification (Authoritative)

This section defines the user interface screens, allowed actions, defaults, and explicit exclusions.

### 10.1 Design Principles

- **Calendly-level simplicity**: A user should complete setup in under 10 minutes
- **No AI language**: The UI never uses terms like "AI", "agent", "bot", "automation", "ML", or "intelligent"
- **Presented as a service**: The framing is "we follow up on your invoices" not "our AI calls your customers"
- **Minimal configuration**: Sensible defaults for everything; advanced options hidden or absent

### 10.2 Screens and Components

#### 10.2.1 Dashboard

**Purpose**: Overview of account status and recent activity

**Displays**:
- Total overdue invoices loaded
- Calls made this billing cycle
- Minutes used / minutes remaining (with visual progress bar)
- Recent call outcomes (last 10)
- Alerts (e.g., approaching usage limit)

**Actions**:
- Navigate to Invoices, Policies, Call History, Settings

---

#### 10.2.2 Invoices

**Purpose**: View and manage uploaded invoice data

**Displays**:
- Table of all invoices: Customer name, phone, amount, due date, status, last call outcome
- Filter by: status (pending, in-progress, completed, failed), date range
- Sort by: amount, due date, last activity

**Actions**:
- Upload CSV (opens upload modal)
- View invoice detail (side panel or modal)
- Mark invoice as "resolved" (manual override)
- Delete invoice

**Upload Modal**:
- Drag-and-drop or file picker for CSV
- Shows column mapping preview (auto-detected with manual override)
- Required columns: customer name, phone number, amount, due date
- Optional columns: invoice number, email, notes
- Validation errors shown inline before import

---

#### 10.2.3 Follow-Up Policy

**Purpose**: Configure how and when calls are made

**Displays**:
- Current policy summary (cadence, script preview, payment link)

**Configurable Fields**:

| Field | Type | Default |
|-------|------|---------|
| Call cadence | Multi-select days after due date | 3, 7, 14, 30 |
| Max attempts per invoice | Number (1–10) | 5 |
| Call window start | Time (local timezone) | 9:00 AM |
| Call window end | Time (local timezone) | 6:00 PM |
| Call days | Multi-select (Mon–Sun) | Mon–Fri |
| Greeting script | Text (with variable placeholders) | Default provided |
| Payment link | URL | Required |
| Send SMS with payment link | Toggle | On |
| Voicemail script | Text | Default provided |

**Variable Placeholders Available**:
- `{{customer_name}}`
- `{{amount_due}}`
- `{{invoice_number}}`
- `{{days_overdue}}`
- `{{company_name}}`

**Actions**:
- Save policy
- Preview call (plays sample using VAPI in test mode)
- Reset to defaults

---

#### 10.2.4 Call History

**Purpose**: Audit log of all calls placed

**Displays**:
- Table: Date/time, customer name, phone, duration, outcome, recording link
- Filter by: outcome, date range, customer
- Sort by: date, duration

**Actions**:
- Play recording (inline player)
- Export to CSV
- View invoice (links to invoice detail)

---

#### 10.2.5 Settings

**Purpose**: Account configuration

**Sections**:

**Company Profile**:
- Company name (used in scripts)
- Timezone
- Logo (optional, not used in calls)

**Billing**:
- Current plan
- Minutes used / included
- Upgrade plan button
- Payment method (managed via Stripe portal)
- Billing history

**Users** (if multi-user enabled):
- List of users with email and role
- Invite user
- Remove user
- Roles: Admin, Member (view-only)

**Notifications**:
- Email alerts for: usage warnings, daily summary, call failures
- Toggle each on/off

**Caller ID**:
- Display the outbound phone number (provisioned automatically or selected)
- Option to request number change (support flow)

---

### 10.3 UI Exclusions (Authoritative)

The following elements are **explicitly prohibited** in the user interface:

| Exclusion | Rationale |
|-----------|-----------|
| Terms: "AI", "agent", "bot", "automation", "assistant", "LLM", "machine learning" | Product positioning as a service, not a tech platform |
| Workflow builder / flowchart editor | Complexity out of scope |
| Custom integrations UI | Future scope; not self-serve initially |
| Inbound call configuration | Not supported |
| Payment processing setup | Customers provide their own links |
| Per-user billing or seat management | Pricing is usage-based |
| API key management (for customers) | No public API in initial scope |
| A/B testing for scripts | Out of scope |
| Custom call outcome codes | Fixed set only |

---

### 10.4 Default Behaviors

- New accounts start with a **default follow-up policy** (3, 7, 14, 30 day cadence, default scripts)
- Call recording is **off by default** (opt-in via settings)
- SMS payment link is **on by default**
- Hard usage cap is **on by default** (overage billing is opt-in)

---

## 11. Security Requirements

- All data encrypted at rest and in transit
- Authentication via email/password with optional SSO (future)
- Session management with secure token handling
- Tenant isolation enforced at database and application layer
- VAPI API keys stored encrypted, never exposed to frontend
- PII (phone numbers, customer names) treated as sensitive data
- GDPR/CCPA considerations for call recordings and data retention

---

## 12. Deployment Architecture (Vercel)

The system is deployed on **Vercel** as the sole hosting platform. All architecture decisions must be compatible with Vercel's infrastructure model.

### 12.1 Frontend Hosting

- Web application hosted on Vercel's edge network
- Static assets and client-side code served via Vercel CDN
- Automatic HTTPS with managed SSL certificates
- Preview deployments for pull requests (development workflow)

### 12.2 Backend APIs (Serverless Functions)

All backend logic runs as **Vercel Serverless Functions**:

| Constraint | Implication |
|------------|-------------|
| **Stateless execution** | No in-memory state between requests. All state persisted to database. |
| **Execution time limit** | Functions must complete within Vercel's timeout (default 10s, max 60s on Pro). Long-running operations must be handled asynchronously. |
| **Cold starts** | Functions may cold start. Optimize initialization paths. |
| **No persistent connections** | Database connections must use connection pooling suitable for serverless (e.g., Prisma Data Proxy, PgBouncer, or Neon serverless driver). |
| **No background processes** | Cron-based call scheduling requires Vercel Cron Jobs or external scheduler. |
| **No WebSockets** | Real-time updates require polling or external service if needed. |

### 12.3 Scheduled Jobs (Cron)

Call scheduling and cadence execution require scheduled jobs:

- **Vercel Cron Jobs** for triggering call queue processing
- Cron functions check for invoices due for follow-up and dispatch calls via VAPI
- Minimum granularity: 1 minute (Vercel Cron limitation on Pro plan)
- Cron jobs are serverless functions triggered on schedule

### 12.4 Environment Configuration

All configuration is managed via **environment variables** in Vercel:

| Variable Category | Examples |
|-------------------|----------|
| **Database** | `DATABASE_URL`, `DATABASE_POOL_URL` |
| **VAPI** | `VAPI_API_KEY`, `VAPI_WEBHOOK_SECRET` |
| **Stripe** | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID_*` |
| **Authentication** | `NEXTAUTH_SECRET`, `NEXTAUTH_URL` |
| **Application** | `APP_ENV` (development, preview, production) |

**Environment separation:**

- **Production**: Live customer data, real VAPI calls, real Stripe billing
- **Preview**: Test data, VAPI test mode, Stripe test mode
- **Development**: Local development with environment variable overrides

### 12.5 File Storage

CSV uploads and call recordings require external storage:

- **Vercel Blob** or **AWS S3** for file storage (Vercel has no native persistent filesystem)
- Signed URLs for secure, time-limited access to recordings
- Upload size limits enforced at API layer

### 12.6 Database

- **External managed database** required (Vercel does not provide databases)
- Recommended: PostgreSQL via Neon, Supabase, or PlanetScale (MySQL)
- Connection pooling mandatory for serverless compatibility
- Row-level security or application-enforced tenant isolation

### 12.7 Webhook Handling

VAPI and Stripe communicate via webhooks:

- Webhook endpoints are Vercel Serverless Functions
- Signature verification required for all incoming webhooks
- Idempotency keys for safe retry handling
- Webhook events logged for debugging and audit

### 12.8 Vercel-Specific Exclusions

| Exclusion | Rationale |
|-----------|-----------|
| Long-running background workers | Not supported. Use cron + queue pattern. |
| Persistent WebSocket connections | Not natively supported on Vercel. Polling acceptable for this product. |
| On-premise or self-hosted deployment | Vercel-only. No Docker/Kubernetes deployment path. |
| Custom server runtime | Must use Vercel-compatible frameworks (Next.js, etc.). |

---

## 13. Summary

InvoiceDue is a focused, simple product that solves one problem well: automated follow-up on overdue invoices via outbound calls. It is not a collections agency, not a payment processor, and not a general-purpose communication platform.

The system is designed for ease of use (minimal configuration), predictable costs (usage-based with hard caps), and operational transparency (full call logging and auditability).

All voice orchestration is handled by VAPI. The entire application is deployed on Vercel, with serverless functions for backend APIs and cron jobs for scheduled call processing. The UI presents the service as a human-like follow-up system without exposing AI or automation terminology.

---

*This document is the authoritative scope reference for InvoiceDue. Implementation planning should treat inclusions as requirements and exclusions as hard constraints.*
