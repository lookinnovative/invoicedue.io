# InvoiceDue MVP Implementation Summary

## Overview

InvoiceDue is a self-serve, policy-driven accounts receivable follow-up system. The MVP enables businesses to upload overdue invoice data, configure follow-up policies, and automate outbound phone calls via VAPI. The system enforces usage limits, logs call outcomes, and maintains strict multi-tenant data isolation.

The implementation uses Next.js 14.2.35 with the App Router, TypeScript, Tailwind CSS, Prisma ORM with PostgreSQL, and NextAuth for authentication. It is designed for deployment on Vercel.

---

## MVP Scope Guardrail

The current MVP prioritizes:

1. **Successful build** - Clean compilation with no blocking errors
2. **Successful Vercel deployment** - Functional deployment on Vercel Hobby plan
3. **Core functionality** - Invoice management, call logging, policy configuration, and API operations

The following are intentionally deferred until post-MVP stabilization:

- Automated cron-based call scheduling (see "Cron Jobs" section below)
- Non-critical dependency vulnerability remediation (see "Security" section below)
- Advanced features outlined in scope.md v2 roadmap

This approach ensures a stable, deployable foundation before introducing automation and addressing lower-priority technical debt.

---

## Implemented Features

### User Interface

- **Authentication screens**: Login, signup, password reset request
- **Dashboard**: Summary metrics, usage meter, recent activity, onboarding prompt
- **Invoices page**: Table with status filter, CSV upload modal with column mapping, invoice detail panel with call history
- **Policy page**: Payment link, call schedule, scripts, SMS toggle, reset to defaults
- **Call History page**: Filterable table, outcome badges, CSV export, click-to-view invoice
- **Settings page**: Company profile, timezone, usage display, caller ID, account with change password

All UI components follow the Calendly-style minimalist design specified in design.md. No AI, agent, bot, or automation terminology appears in any user-facing text.

### Data Management

- CSV upload with file validation (max 5MB, 1000 rows)
- Auto-detection of column mappings with manual override
- Row-level validation before import
- Invoice CRUD operations with tenant isolation
- Invoice status tracking (Pending, In Progress, Completed, Failed)
- Call attempt counting and next call date scheduling

### Outbound Calling

- VAPI integration for call initiation
- Script interpolation with placeholders (customer_name, amount_due, invoice_number, days_overdue, company_name)
- SMS payment link delivery after calls (when enabled)
- Webhook handler for call outcome capture
- Call processing endpoint (`/api/cron/process-calls`) - **see Cron Jobs section for status**
- Reconciliation of pending calls with missing webhooks
- Call outcome mapping: Answered, Voicemail, No Answer, Busy, Wrong Number, Disconnected

### Usage Control

- Monthly usage period tracking
- Real-time minute recording from call duration
- Soft warning threshold at 80%
- Critical warning threshold at 95%
- Hard cap at 100% (calls blocked)
- Usage display on dashboard and settings pages
- Visual progress bar with color-coded states

### Security

- Password hashing with bcrypt (12 rounds)
- Session-based authentication via NextAuth with JWT strategy
- Tenant ID enforcement on all database queries
- VAPI webhook signature verification (HMAC-SHA256)
- Cron job authorization via bearer token (when enabled)
- No sensitive data exposed in client-side code
- Next.js 14.2.35 with critical security patches applied

---

## File Structure

### Configuration Files

```
/
├── .env.example
├── .gitignore
├── next.config.js
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── tsconfig.json
├── vercel.json
└── sample-invoices.csv
```

### Prisma

```
/prisma
└── schema.prisma
```

### Source Code

```
/src
├── app/
│   ├── (auth)/
│   │   ├── layout.tsx
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   └── reset-password/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   ├── dashboard/page.tsx
│   │   ├── invoices/page.tsx
│   │   ├── policy/page.tsx
│   │   ├── history/page.tsx
│   │   └── settings/page.tsx
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts
│   │   ├── auth/signup/route.ts
│   │   ├── auth/reset-password/route.ts
│   │   ├── auth/change-password/route.ts
│   │   ├── invoices/route.ts
│   │   ├── invoices/[id]/route.ts
│   │   ├── invoices/upload/route.ts
│   │   ├── policy/route.ts
│   │   ├── calls/route.ts
│   │   ├── calls/export/route.ts
│   │   ├── settings/route.ts
│   │   ├── usage/route.ts
│   │   ├── webhooks/vapi/route.ts
│   │   └── cron/process-calls/route.ts
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── layout/
│   │   ├── header.tsx
│   │   └── sidebar.tsx
│   ├── providers/
│   │   └── session-provider.tsx
│   └── ui/
│       ├── alert.tsx
│       ├── badge.tsx
│       ├── button.tsx
│       ├── card.tsx
│       ├── checkbox.tsx
│       ├── dialog.tsx
│       ├── dropdown-menu.tsx
│       ├── input.tsx
│       ├── label.tsx
│       ├── progress.tsx
│       ├── select.tsx
│       ├── table.tsx
│       └── textarea.tsx
├── lib/
│   ├── auth.ts
│   ├── db.ts
│   ├── usage.ts
│   ├── utils.ts
│   └── vapi.ts
└── types/
    └── index.ts
```

---

## Prisma Models

### Tenant
Primary account entity. Stores email, password hash, company name, and timezone.

### Invoice
Overdue invoice record. Linked to tenant. Tracks customer details, amount, due date, status, call attempts, and next call date.

### Policy
Follow-up configuration. One per tenant. Stores cadence days, max attempts, call window, call days, scripts, payment link, and SMS toggle.

### CallLog
Individual call record. Linked to tenant and invoice. Stores phone number, timestamps, duration, outcome, and VAPI call ID.

### UsageRecord
Monthly usage tracking. Linked to tenant. Stores period dates, allocated minutes, and used minutes.

### Enums
- **InvoiceStatus**: PENDING, IN_PROGRESS, COMPLETED, FAILED
- **CallOutcome**: PENDING, ANSWERED, VOICEMAIL, NO_ANSWER, BUSY, WRONG_NUMBER, DISCONNECTED

---

## External Dependencies

### VAPI
- Used for outbound call initiation
- Webhook integration for call outcome capture
- SMS delivery for payment links
- API calls authenticated via VAPI_API_KEY
- Webhook verified via HMAC-SHA256 signature

### Vercel
- Hosting for frontend and serverless functions
- Environment variable management
- Cron job scheduling - **currently disabled** (see "Cron Jobs" section)

### PostgreSQL
- Primary database via Prisma ORM
- Connection via DATABASE_URL environment variable

---

## Cron Jobs (Temporarily Disabled)

### Current Status

Vercel cron job configuration has been **removed** from the MVP. The `vercel.json` file does not include cron scheduling.

### Reason

Vercel Hobby plan has limitations on cron job frequency and execution. To ensure reliable MVP deployment without plan-related failures, automated scheduling is disabled.

### What This Means

- The `/api/cron/process-calls` endpoint **exists and is functional**
- It can be triggered manually via HTTP GET with proper authorization
- Automated minute-by-minute scheduling is not active
- Calls will not be placed automatically until cron is restored

### Restoration Conditions

Cron jobs should be reintroduced when one of the following conditions is met:

1. **Vercel Pro upgrade** - Upgrade to Vercel Pro plan which supports more frequent cron execution
2. **External scheduler** - Implement scheduling via:
   - GitHub Actions (scheduled workflows)
   - Upstash QStash (serverless scheduling)
   - Railway cron jobs
   - External cron service (e.g., cron-job.org, EasyCron)
3. **Background worker** - Deploy a separate worker process for job scheduling

### Planned v2 Implementation

When restoring cron functionality, add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/process-calls",
      "schedule": "* * * * *"
    }
  ]
}
```

Ensure `CRON_SECRET` environment variable is configured for authorization.

---

## Security & Dependency Status

### Resolved

- **Critical vulnerabilities**: Resolved by upgrading Next.js to version 14.2.35
- **Build-blocking issues**: All resolved

### Acknowledged (Deferred)

The following are acknowledged but intentionally deferred for post-MVP remediation:

- **Moderate severity vulnerabilities**: Present in transitive dependencies
- **High severity vulnerabilities**: Present in some packages but not exploitable in current usage patterns

### Rationale for Deferral

1. **MVP stability priority**: Aggressive dependency upgrades risk breaking changes during active development
2. **Non-blocking nature**: Identified vulnerabilities do not affect core MVP functionality or create immediate exploit vectors
3. **Controlled environment**: MVP is deployed to a limited user base during initial rollout

### Remediation Plan

**After MVP stabilization, before production scaling:**

1. Run `npm audit` to generate current vulnerability report
2. Upgrade dependencies with breaking changes in a dedicated branch
3. Test all affected functionality
4. Address moderate/high issues in priority order
5. Document any vulnerabilities that cannot be resolved due to upstream dependencies

### Security Audit Commands

```bash
# View current vulnerabilities
npm audit

# Attempt automatic fixes (non-breaking)
npm audit fix

# Force fixes (may include breaking changes - use with caution)
npm audit fix --force
```

---

## Not Implemented (Out of Scope)

The following items are explicitly excluded from the MVP per scope.md and mvp.md:

- Subscription billing (Stripe integration)
- Inbound calling
- Integrations beyond CSV (QuickBooks, Xero, etc.)
- Advanced customization or workflow builders
- Email notifications
- Multi-user accounts (single user per tenant)
- Actual password reset emails (endpoint exists but sends nothing)
- Call recording or transcription
- Per-user pricing or role-based access
- Custom caller ID provisioning
- Real-time call status updates (polling-based reconciliation only)

### Temporarily Deferred (Post-MVP)

- **Automated call scheduling**: Cron jobs disabled pending Vercel Pro upgrade or external scheduler
- **Dependency vulnerability remediation**: Moderate/high issues deferred until post-MVP stabilization

---

## Assumptions

1. **VAPI configuration**: A VAPI account with API key, phone number ID, and webhook secret is required. The VAPI assistant/agent must be configured externally.

2. **Database**: PostgreSQL is available and accessible via the DATABASE_URL connection string.

3. **Usage allocation**: New accounts receive 100 minutes per month by default. Allocation changes require manual database update or future admin functionality.

4. **Caller ID**: A fixed placeholder number (+1 555-000-1234) is displayed. Actual caller ID is determined by VAPI configuration.

5. **Time zones**: Call window times are assumed to be in the tenant's configured timezone. When cron is enabled, it runs in UTC and does not perform timezone conversion (this is a known limitation).

6. **Payment links**: Customers provide their own payment links (Stripe, PayPal, etc.). The system does not validate or process payments.

7. **Webhook reliability**: VAPI webhooks may occasionally fail. The call processing endpoint includes reconciliation logic to poll for call status on pending calls older than 5 minutes. This requires cron to be enabled or manual endpoint invocation.

8. **CSV format**: CSV files must be UTF-8 encoded with comma delimiters. Headers are expected on the first row.

---

## Environment Variables

| Variable | Purpose | Required |
|----------|---------|----------|
| DATABASE_URL | PostgreSQL connection string | Yes |
| NEXTAUTH_SECRET | Session encryption key | Yes |
| NEXTAUTH_URL | Application base URL | Yes |
| VAPI_API_KEY | VAPI authentication | Yes |
| VAPI_WEBHOOK_SECRET | Webhook signature verification | Yes (production) |
| VAPI_PHONE_NUMBER_ID | Outbound caller ID | Yes |
| BLOB_READ_WRITE_TOKEN | Vercel Blob storage | No |
| APP_ENV | Environment mode (development/production) | Yes |
| CRON_SECRET | Cron job authorization (when cron enabled) | No (cron disabled) |

---

## Running Locally

1. Copy `.env.example` to `.env` and configure all variables
2. Run `npm install`
3. Run `npx prisma generate`
4. Run `npx prisma db push` (or `migrate dev` for migrations)
5. Run `npm run dev`
6. Access at `http://localhost:3000`

### Testing Call Processing

Since cron jobs are disabled, manually trigger call processing:

```bash
# Local development (no auth required when APP_ENV=development)
curl http://localhost:3000/api/cron/process-calls

# Production (requires CRON_SECRET)
curl -H "Authorization: Bearer YOUR_CRON_SECRET" https://your-domain.vercel.app/api/cron/process-calls
```

---

## Document History

| Date | Change |
|------|--------|
| January 2026 | Initial implementation summary |
| January 2026 | Added cron job deferral, security remediation plan, MVP scope guardrail |

---

*Last updated: January 2026*
