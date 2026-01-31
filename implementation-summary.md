# InvoiceDue MVP Implementation Summary

## Overview

InvoiceDue is a self-serve, policy-driven accounts receivable follow-up system. The MVP enables businesses to upload overdue invoice data, configure follow-up policies, and automate outbound phone calls via VAPI. The system enforces usage limits, logs call outcomes, and maintains strict multi-tenant data isolation.

The implementation uses Next.js 14 with the App Router, TypeScript, Tailwind CSS, Prisma ORM with PostgreSQL, and NextAuth for authentication. It is designed for deployment on Vercel.

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
- Cron job for scheduled call processing (runs every minute)
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
- Cron job authorization via bearer token
- No sensitive data exposed in client-side code

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
- Cron job scheduling (every minute for call processing)
- Environment variable management

### PostgreSQL
- Primary database via Prisma ORM
- Connection via DATABASE_URL environment variable

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

---

## Assumptions

1. **VAPI configuration**: A VAPI account with API key, phone number ID, and webhook secret is required. The VAPI assistant/agent must be configured externally.

2. **Database**: PostgreSQL is available and accessible via the DATABASE_URL connection string.

3. **Usage allocation**: New accounts receive 100 minutes per month by default. Allocation changes require manual database update or future admin functionality.

4. **Caller ID**: A fixed placeholder number (+1 555-000-1234) is displayed. Actual caller ID is determined by VAPI configuration.

5. **Time zones**: Call window times are assumed to be in the tenant's configured timezone. The cron job runs in UTC and does not perform timezone conversion (this is a known limitation).

6. **Payment links**: Customers provide their own payment links (Stripe, PayPal, etc.). The system does not validate or process payments.

7. **Webhook reliability**: VAPI webhooks may occasionally fail. The cron job includes reconciliation logic to poll for call status on pending calls older than 5 minutes.

8. **CSV format**: CSV files must be UTF-8 encoded with comma delimiters. Headers are expected on the first row.

---

## Environment Variables

| Variable | Purpose |
|----------|---------|
| DATABASE_URL | PostgreSQL connection string |
| NEXTAUTH_SECRET | Session encryption key |
| NEXTAUTH_URL | Application base URL |
| VAPI_API_KEY | VAPI authentication |
| VAPI_WEBHOOK_SECRET | Webhook signature verification |
| VAPI_PHONE_NUMBER_ID | Outbound caller ID |
| BLOB_READ_WRITE_TOKEN | Vercel Blob storage (optional) |
| APP_ENV | Environment mode (development/production) |
| CRON_SECRET | Cron job authorization |

---

## Running Locally

1. Copy `.env.example` to `.env` and configure all variables
2. Run `npm install`
3. Run `npx prisma generate`
4. Run `npx prisma db push` (or `migrate dev` for migrations)
5. Run `npm run dev`
6. Access at `http://localhost:3000`

For cron job testing, manually call `GET /api/cron/process-calls` with the authorization header.

---

*Document generated: January 2026*
