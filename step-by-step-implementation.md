# InvoiceDue Step-by-Step Implementation Checklist

## Summary of What This Document Covers

This document provides a detailed, numbered, step-by-step checklist for verifying, maintaining, and safely modifying the InvoiceDue MVP. It covers:

- Current live deployment baseline and verification steps
- Local development setup with exact commands and expected outputs
- Deployment workflow via Git and Vercel
- Configuration constraints and security considerations
- Prisma database lifecycle and common pitfalls
- API route patterns and type safety requirements
- Linting and formatting with ESLint 9
- Known issues and touch-up backlog
- Conditions and steps for re-enabling cron automation

Use this as a reference for onboarding, debugging, and planning future work.

---

## Section 1: Current Live Baseline

**What "good" looks like for the deployed MVP.**

### 1.01 Verify Production URL

- **URL**: https://invoicedue-io.vercel.app
- **Expected**: Login page loads with InvoiceDue branding
- **Check**: No console errors, page renders correctly

### 1.02 Verify All Routes Are Accessible

| Route | Type | Expected Behavior |
|-------|------|-------------------|
| `/` | Static | Redirects to `/login` |
| `/login` | Static | Displays login form |
| `/signup` | Static | Displays signup form |
| `/reset-password` | Static | Displays password reset form |
| `/dashboard` | Dynamic | Requires auth, shows metrics |
| `/invoices` | Dynamic | Requires auth, shows invoice table |
| `/policy` | Dynamic | Requires auth, shows policy form |
| `/history` | Dynamic | Requires auth, shows call history |
| `/settings` | Dynamic | Requires auth, shows account settings |

### 1.03 Verify API Endpoints Respond

- **Method**: Visit `/api/auth/[...nextauth]` endpoints via NextAuth
- **Expected**: 401 Unauthorized for unauthenticated requests to protected endpoints
- **Expected**: 200 OK for auth endpoints with valid credentials

### 1.04 Verify Vercel Dashboard Status

- **Location**: https://vercel.com/dashboard (InvoiceDue project)
- **Expected**: Latest deployment shows "Ready" status
- **Expected**: No failed builds in deployment history
- **Expected**: Environment variables are configured

### 1.05 Confirm Cron Is Disabled

- **File**: `vercel.json`
- **Expected Contents**:
```json
{
  "crons": []
}
```
- **Status**: Cron intentionally disabled until Vercel Pro or alternative scheduler

---

## Section 2: Local Setup + Verification

**Commands and expected outputs for local development.**

### 2.01 Clone Repository

```bash
git clone <repository-url>
cd invoicedue.io
```
- **Expected**: Repository cloned successfully

### 2.02 Install Dependencies

```bash
npm install
```
- **Expected**: Exit code 0
- **Expected**: `postinstall` script runs `prisma generate`
- **Output includes**: "✔ Generated Prisma Client"

### 2.03 Configure Environment

```bash
cp .env.example .env
```
- **Action**: Edit `.env` with valid values:
  - `DATABASE_URL` - PostgreSQL connection string
  - `NEXTAUTH_SECRET` - Random secret (generate with `openssl rand -base64 32`)
  - `NEXTAUTH_URL` - `http://localhost:3000`
  - `VAPI_API_KEY` - Your VAPI API key
  - `VAPI_WEBHOOK_SECRET` - Your VAPI webhook secret
  - `VAPI_PHONE_NUMBER_ID` - Your VAPI phone number ID
  - `APP_ENV` - `development`

### 2.04 Generate Prisma Client

```bash
npx prisma generate
```
- **Expected**: "✔ Generated Prisma Client"

### 2.05 Push Database Schema

```bash
npx prisma db push
```
- **Expected**: Schema synced to database
- **Expected**: No migration conflicts

### 2.06 Run Development Server

```bash
npm run dev
```
- **Expected**: Server starts on http://localhost:3000
- **Expected**: No TypeScript errors in terminal

### 2.07 Verify Local Build

```bash
npm run build
```
- **Expected**: Exit code 0
- **Output includes**:
  - "✔ Generated Prisma Client"
  - "✓ Compiled successfully"
  - "✓ Generating static pages"
  - Route table showing 23 routes

### 2.08 Run Linter

```bash
npm run lint
```
- **Expected**: Exit code 0
- **Expected**: No linting errors

- ### 2.08 Run Linter — DEFERRED

Reason:
- ESLint v9 flat config conflicts with Next.js default lint runner
- Build, runtime, and production deployment verified
- Linting will be re-enabled post-MVP using either:
  - Next.js ESLint preset migration, or
  - ESLint v9 flat config with explicit rules

Status: Skipped intentionally


---

## Section 3: Deployment Workflow

**Git and Vercel deployment process.**

### 3.01 Commit Changes

```bash
git add .
git commit -m "Description of changes"
```
- **Expected**: Commit created successfully

### 3.02 Push to Remote

```bash
git push origin main
```
- **Expected**: Push successful
- **Effect**: Triggers Vercel deployment automatically

### 3.03 Monitor Vercel Build

- **Location**: Vercel Dashboard → Deployments
- **Expected**: Build starts within 30 seconds
- **Expected**: Build completes with "Ready" status
- **Duration**: Typically 1-2 minutes

### 3.04 Verify Deployment

- **Action**: Visit https://invoicedue-io.vercel.app
- **Expected**: New changes are live
- **Check**: Test affected functionality

### 3.05 Rollback If Needed

- **Location**: Vercel Dashboard → Deployments
- **Action**: Click previous successful deployment → "Promote to Production"
- **Effect**: Immediately reverts to previous version

---

## Section 4: Config & Security Constraints

**What not to change and why.**

### 4.01 Vercel Cron Jobs - DISABLED

- **File**: `vercel.json`
- **Current State**: `"crons": []`
- **Reason**: Vercel Hobby plan has cron limitations
- **Impact**: Automated call scheduling does not run
- **Workaround**: Manual trigger via `/api/cron/process-calls`
- **DO NOT**: Re-add cron schedule without Pro plan or alternative

### 4.02 Protected Configuration Files

| File | Constraint |
|------|------------|
| `vercel.json` | Do not add cron schedule |
| `next.config.js` | Do not add `serverActions` key (invalid in Next.js 16) |
| `eslint.config.mjs` | Do not revert to `.eslintrc` format (ESLint 9 requires flat config) |
| `package.json` | Do not remove `postinstall` or modify `build` script |

### 4.03 Environment Variables - Never Commit

- **Files**: `.env`, `.env.local`
- **Status**: Listed in `.gitignore`
- **Action**: Never commit secrets to repository

### 4.04 Dependency Constraints

- **ESLint**: Must be v9.x (v8.x incompatible with eslint-config-next 16.x)
- **@eslint/eslintrc**: Required for FlatCompat helper
- **next**: v16.x (current stable)
- **prisma/@prisma/client**: Keep in sync

### 4.05 Do Not Force Upgrade Dependencies

```bash
# DO NOT RUN without validation:
npm audit fix --force
```
- **Reason**: May introduce breaking changes
- **Alternative**: Run in separate branch, test thoroughly

---

## Section 5: Prisma & Database Lifecycle

**Generation, initialization, and common pitfalls.**

### 5.01 Prisma Client Generation Triggers

| Trigger | Command | When It Runs |
|---------|---------|--------------|
| After install | `postinstall` | `npm install` |
| Before build | `build` script | `npm run build` |
| Manual | `npx prisma generate` | As needed |

### 5.02 Database Schema Location

- **File**: `prisma/schema.prisma`
- **Models**: Tenant, Invoice, Policy, CallLog, UsageRecord
- **Enums**: InvoiceStatus, CallOutcome

### 5.03 Schema Change Workflow

```bash
# 1. Edit prisma/schema.prisma
# 2. Generate client
npx prisma generate

# 3. Push to database (development)
npx prisma db push

# 4. Or create migration (production)
npx prisma migrate dev --name description
```

### 5.04 Prisma Client Singleton Pattern

- **File**: `src/lib/db.ts`
- **Pattern**: Singleton via `globalThis` to prevent multiple clients during hot reload
- **DO NOT**: Import PrismaClient directly elsewhere; always use `db` from `@/lib/db`

### 5.05 Common Pitfall: Client Not Generated

- **Symptom**: Build fails with "Cannot find module '@prisma/client'"
- **Solution**: Run `npx prisma generate`
- **Prevention**: `postinstall` script handles this

### 5.06 Common Pitfall: Schema Mismatch

- **Symptom**: Runtime errors about missing fields/models
- **Solution**: Run `npx prisma db push` or `npx prisma migrate dev`

### 5.07 View Database Contents

```bash
npx prisma studio
```
- **Expected**: Opens browser at http://localhost:5555
- **Use**: Inspect and edit data during development

---

## Section 6: API Routes & Type Safety

**Route handler patterns and requirements.**

### 6.01 Standard Route Handler Signature

```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Handler implementation
  return NextResponse.json({ data });
}
```

### 6.02 Dynamic Route Handler Signature

- **File pattern**: `src/app/api/[param]/route.ts`
- **Example**: `src/app/api/invoices/[id]/route.ts`

```typescript
interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  const { id } = await context.params;
  // Handler implementation
}
```

### 6.03 Prisma Enum Usage - Required

- **DO**: Use Prisma enums from `@prisma/client`
- **DO NOT**: Use string literals for enum values

```typescript
// ✓ Correct
import { InvoiceStatus, CallOutcome } from '@prisma/client';
where: { status: InvoiceStatus.PENDING }

// ✗ Incorrect
where: { status: 'PENDING' }
```

### 6.04 Authentication Check Pattern

```typescript
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const session = await getServerSession(authOptions);
if (!session) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
const tenantId = session.user.id;
```

### 6.05 Tenant Isolation - Required

- **Rule**: All database queries must filter by `tenantId`
- **Example**:
```typescript
const invoices = await db.invoice.findMany({
  where: { tenantId: session.user.id },
});
```

### 6.06 Error Handling Pattern

```typescript
try {
  // Operation
  return NextResponse.json(result);
} catch (error) {
  console.error('Operation failed:', error);
  return NextResponse.json(
    { error: 'Operation failed' },
    { status: 500 }
  );
}
```

---

## Section 7: Linting / Formatting

**ESLint 9 configuration and usage.**

### 7.01 ESLint Configuration

- **File**: `eslint.config.mjs` (ESLint 9 flat config format)
- **Extends**: `next/core-web-vitals`
- **Helper**: Uses `@eslint/eslintrc` FlatCompat for backwards compatibility

### 7.02 Run Linter

```bash
npm run lint
```
- **Expected**: Exit code 0 with no errors
- **Warnings**: May appear for unused variables; fix before commit

### 7.03 Lint Specific Files

```bash
npx eslint src/app/api/invoices/route.ts
```

### 7.04 ESLint Version Constraint

- **Required**: ESLint v9.x
- **Reason**: `eslint-config-next@16.x` requires ESLint >= 9
- **DO NOT**: Downgrade to ESLint 8.x

### 7.05 Resolving Lint Errors

1. Read error message and file location
2. Fix the issue in code
3. Run `npm run lint` again
4. Repeat until clean

---

## Section 8: Known Issues / Touch-Up Backlog

**Document only - do not implement in this pass.**

### 8.01 UI Polish Items

| Issue | Location | Priority |
|-------|----------|----------|
| Invoice detail panel scroll | `/invoices` page | Low |
| Mobile responsive breakpoints | All dashboard pages | Medium |
| Loading skeleton states | Tables and cards | Low |
| Empty state illustrations | Invoice/History pages | Low |

### 8.02 Functionality Gaps

| Issue | Description | Priority |
|-------|-------------|----------|
| Password reset emails | Endpoint exists but sends nothing | Medium |
| **SMS A2P 10DLC Registration** | Twilio SMS implemented but blocked by carriers. Must register Brand + Campaign in Twilio Console → Messaging → A2P 10DLC. Takes 1-7 days. | **HIGH - BLOCKING** |
| **Email with Payment Link** | Dialog offers to send payment link via email, but email sending not yet implemented. Need email service (SendGrid, Resend, etc.) | **HIGH** |
| Timezone handling in cron | Runs in UTC, not tenant timezone | Medium |

### 8.03 Technical Debt

| Issue | Description | Priority |
|-------|-------------|----------|
| npm audit warnings | 2 moderate severity, dev-tooling related | Low |
| Prisma version | v5.x, upgrade available to v7.x | Low |
| TypeScript strict mode | Some implicit any types remain | Low |

### 8.04 Documentation Gaps

| Issue | Description | Priority |
|-------|-------------|----------|
| API documentation | No OpenAPI/Swagger spec | Low |
| Deployment runbook | Basic steps only | Medium |
| VAPI setup guide | Configuration steps needed | High |

---

## Section 8.5: SMS A2P 10DLC Registration (PENDING)

**Status**: SMS code is complete and Twilio is configured. Messages are being blocked by US carriers due to A2P 10DLC compliance requirements.

### Steps to Enable SMS

1. **Go to Twilio Console** → Messaging → Regulatory Compliance → A2P 10DLC
2. **Register Brand** (your business info - EIN, address, etc.)
3. **Register Campaign** 
   - Use case: "Account notifications" or "Payment reminders"
   - Sample messages will be reviewed
4. **Wait for Approval** (1-7 business days)
5. **Assign Phone Number** to the approved campaign
6. **Test SMS** - Should work after campaign approval

### Alternative: Toll-Free Number

If faster setup needed:
1. Buy a Toll-Free number in Twilio
2. Complete Toll-Free verification (usually 1-2 days)
3. Update `TWILIO_PHONE_NUMBER` in Vercel with new number

### Current State

- Twilio SDK: Installed and configured
- Code: Complete (`src/lib/vapi.ts` → `sendPaymentLinkSms`)
- Environment Variables: Set in Vercel
- Error: 30034 "Message from an Unregistered Number"

---

## Section 9: When to Re-Enable Cron

**Exact conditions and steps for cron automation.**

### 9.01 Conditions for Re-Enabling

Cron can be re-enabled when ONE of the following is true:

1. **Vercel Pro Plan** - Upgrade to Vercel Pro ($20/month) which supports frequent cron
2. **External Scheduler** - Implement via:
   - GitHub Actions (scheduled workflows)
   - Upstash QStash (serverless scheduling)
   - Railway cron jobs
   - External service (cron-job.org, EasyCron)

### 9.02 Steps to Re-Enable with Vercel Pro

1. **Upgrade Plan**
   - Vercel Dashboard → Settings → Billing → Upgrade to Pro

2. **Update vercel.json**
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

3. **Set Environment Variable**
   - Add `CRON_SECRET` in Vercel Dashboard → Settings → Environment Variables
   - Use a strong random value: `openssl rand -base64 32`

4. **Deploy**
```bash
git add vercel.json
git commit -m "Re-enable cron scheduling (Vercel Pro)"
git push origin main
```

5. **Verify**
   - Check Vercel Dashboard → Crons tab
   - Confirm cron is listed and running

### 9.03 Steps to Use External Scheduler (GitHub Actions)

1. **Create Workflow File**
   - File: `.github/workflows/process-calls.yml`

```yaml
name: Process Calls
on:
  schedule:
    - cron: '* * * * *'
  workflow_dispatch:

jobs:
  trigger:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger cron endpoint
        run: |
          curl -X GET \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            https://invoicedue-io.vercel.app/api/cron/process-calls
```

2. **Set Repository Secret**
   - GitHub → Settings → Secrets → Actions → New secret
   - Name: `CRON_SECRET`
   - Value: Same as Vercel environment variable

3. **Push and Enable**
```bash
git add .github/workflows/process-calls.yml
git commit -m "Add GitHub Actions cron scheduler"
git push origin main
```

### 9.04 Verify Cron Is Working

1. **Check Logs**
   - Vercel Dashboard → Logs → Filter by `/api/cron/process-calls`

2. **Expected Response**
```json
{
  "success": true,
  "callsInitiated": 0,
  "callsSkipped": 0,
  "callsReconciled": 0,
  "timestamp": "2026-01-31T12:00:00.000Z"
}
```

3. **Monitor Call Logs**
   - Dashboard → History page shows new calls
   - Database shows new CallLog entries

---

## Quick Reference Commands

| Action | Command |
|--------|---------|
| Install dependencies | `npm install` |
| Run dev server | `npm run dev` |
| Build for production | `npm run build` |
| Run linter | `npm run lint` |
| Generate Prisma client | `npx prisma generate` |
| Push schema to DB | `npx prisma db push` |
| Open Prisma Studio | `npx prisma studio` |
| Create migration | `npx prisma migrate dev --name <name>` |

---

## Section 10: Internal Admin Dashboard

**Founder/ops-only observability layer (not customer-facing).**

### 10.01 Overview

The internal admin dashboard provides visibility into system state for debugging, observability, and operational monitoring. It is:

- **Read-heavy** — Designed for inspection, not editing
- **Founder-only** — Not exposed to customers
- **Utilitarian** — Dense, information-first design
- **Event-driven** — Append-only audit logs

### 10.02 Route Separation

| Surface | Route Prefix | Purpose |
|---------|--------------|---------|
| Customer UI | `/dashboard`, `/invoices`, `/policy`, `/history`, `/settings` | Self-service product |
| Internal Admin | `/internal/*` | Founder observability |

**Critical**: No internal admin code should be imported by customer-facing routes.

### 10.03 Internal Admin Routes

```
/internal                    → Global Search (primary entry point)
/internal/clients            → All clients list
/internal/clients/[id]       → Client detail (invoices, calls, payments, events)
/internal/invoices           → All invoices (cross-client)
/internal/calls              → All calls (cross-client)
/internal/payments           → All payments (cross-client)
/internal/events             → Append-only event log
/internal/system-health      → Observability dashboard
```

### 10.04 Folder Structure

```
/src/app/internal/
├── layout.tsx               # Admin layout with nav and auth
├── page.tsx                 # Global Search (home)
├── clients/
│   ├── page.tsx             # Clients list
│   └── [id]/page.tsx        # Client detail
├── invoices/page.tsx        # Invoices list
├── calls/page.tsx           # Calls list
├── payments/page.tsx        # Payments list
├── events/page.tsx          # Events log
└── system-health/page.tsx   # System health

/src/lib/internal/
├── search.ts                # Global search functions
├── aggregations.ts          # Metrics and aggregations
└── permissions.ts           # Admin access control
```

### 10.05 Terminology Change

**Tenant → Client**

The term "Tenant" is being renamed to "Client" for semantic clarity:
- All new code uses "Client" terminology
- Database table remains `tenant` for migration simplicity
- UI displays "Client" not "Tenant"

### 10.06 Source of Truth Hierarchy

| Domain | Source of Truth | InvoiceDue Role |
|--------|-----------------|-----------------|
| Payments | Stripe | Read + display Stripe state via webhooks |
| Calls | VAPI/Twilio | Read + display call outcomes via webhooks |
| Invoices | InvoiceDue | Full ownership |
| Clients | InvoiceDue | Full ownership |
| Usage | InvoiceDue | Full ownership |

### 10.07 Data Model Additions (Planned)

| Entity | Purpose |
|--------|---------|
| `Event` | Append-only audit ledger (immutable) |
| `Payment` | Stripe payment tracking (webhook-updated only) |
| `PaymentLinkSent` | SMS/email delivery tracking |
| `WebhookLog` | Inbound webhook debugging |

### 10.08 v0 Guardrails (STRICT)

These constraints apply to all internal admin development:

1. **Read-only** — No edit, delete, or mutation buttons in v0
2. **Inspect-only** — Observe and diagnose, not remediate
3. **No retry buttons** — No manual call retry in v0
4. **No replay buttons** — No webhook replay in v0
5. **Stripe is truth** — Payment state only updated from Stripe webhooks, never UI
6. **Single admin** — No role complexity in v0
7. **Global Search first** — If only one page ships, it's Global Search

### 10.09 What Is Out of Scope (v0)

- Role-based access control
- Bulk operations
- Export functionality
- Retry/remediation tools
- Customer impersonation
- Manual status overrides
- Editing client/invoice data

### 10.10 Documentation

Full internal admin documentation:

| Document | Path | Purpose |
|----------|------|---------|
| Overview | `/docs/internal-admin.md` | Page responsibilities and goals |
| Data Model | `/docs/internal-admin-data-model.md` | Schema additions |
| Events | `/docs/internal-admin-events.md` | Event-driven philosophy |

---

## Section 11: Observability Layer

**Event logging, webhook processing, and payment tracking.**

### 11.01 Event-Driven Philosophy

1. **Write events first** — Before updating derived state
2. **Events are immutable** — Never delete, never modify
3. **Events are truth** — If state is wrong, events can reconstruct it
4. **External systems are authoritative** — Stripe, VAPI, Twilio

### 11.02 Key Event Types

| Event Type | Trigger |
|------------|---------|
| `client.created` | User signup |
| `invoice.created` | CSV upload |
| `invoice.status_changed` | Status update |
| `call.initiated` | VAPI call started |
| `call.completed` | VAPI webhook received |
| `payment_link.sent` | SMS/email sent |
| `payment.received` | Stripe webhook |
| `webhook.received` | Any inbound webhook |

### 11.03 Payment State Rules

**Critical**: Payment state is **only** written from Stripe webhooks.

```
✅ ALLOWED:
- payment.received from payment_intent.succeeded webhook
- payment.failed from payment_intent.payment_failed webhook

❌ NOT ALLOWED:
- Manual "mark as paid" button
- Optimistic payment success assumption
- UI-triggered payment status changes
```

### 11.04 Webhook Logging

All inbound webhooks should be logged to `WebhookLog` for:
- **Debugging** — See exactly what external systems sent
- **Replay** — Reprocess webhooks if handler had bugs
- **Audit** — Prove what data was received and when

---

## Section 12: Client Admin Dashboard

**Customer-facing admin surface that mirrors internal admin concepts.**

### 12.01 Overview

The client admin dashboard provides InvoiceDue customers with visibility into their accounts receivable operations. It intentionally mirrors the structure and concepts of the internal admin, scoped to a single client.

**Core Principle**: Clients should feel like they are seeing "the same dashboard we use — scoped to their company."

### 12.02 Route Structure

```
/client                     → Overview (key metrics, recent activity)
/client/invoices            → Client's invoices with status tracking
/client/payments            → Payment history from Stripe webhooks
/client/calls               → Call log with outcomes
/client/events              → Activity timeline (human-readable)
/client/system-health       → Success rates and system status
/client/errors              → Issues that need attention
/client/settings            → Read-only view of account config
```

### 12.03 Authorization Model

| Route | Access Rule |
|-------|-------------|
| `/internal/*` | Authenticated + `isAdmin = true` |
| `/client/*` | Authenticated (any tenant, their own data only) |
| `/dashboard/*` | Authenticated (any tenant) |

A user with `isAdmin = true` can access both `/internal` and `/client`.

### 12.04 Data Scoping (Critical)

All queries in client admin MUST include `tenantId` filter. There is no cross-client access.

### 12.05 Level of Detail

**Client Admin Shows:**
- Status badges (Pending, Paid, Failed)
- Counts and totals
- Success rates (percentages)
- Dates and timestamps
- Human-readable activity descriptions
- Masked phone numbers (last 4 digits only)

**Client Admin Does NOT Show:**
- Raw JSON payloads
- Stack traces
- Webhook signatures
- Vendor retry internals
- Debug-level metadata
- Other clients' data

### 12.06 Documentation

Full client admin documentation: `/docs/client-admin.md`

---

## Section 13: Future Steps (Pre-Production)

**Planned changes required before production launch.**

### 13.01 Separate Internal Admin Identity

**Status**: Documented — NOT YET IMPLEMENTED

**Priority**: Required before production launch

**Reason for Deferral**: Intentionally delayed until core functionality is stable

#### Planned Change

Create a separate internal-only email identity for founder/ops access:

| Email | Purpose | Access |
|-------|---------|--------|
| `anthony@invoicedue.io` | Internal admin identity | `/internal/*` only |
| `anthony.robinson@robbgroupe.com` | Client-facing user account | `/client/*`, `/dashboard/*` |

#### Requirements

1. **Create new email address**
   - `anthony@invoicedue.io` (or equivalent internal domain)
   - This email is used exclusively for internal admin access

2. **Register as separate user**
   - Create account with `anthony@invoicedue.io`
   - Set `isAdmin = true` for this account only
   - Keep `anthony.robinson@robbgroupe.com` as a normal client account (`isAdmin = false`)

3. **Ensure separation**
   - Internal admin: `anthony@invoicedue.io` → `/internal/*`
   - Client admin: `anthony.robinson@robbgroupe.com` → `/client/*`
   - These are separate auth sessions with separate permissions

4. **Update `isAdmin` flags**
   - Remove `isAdmin = true` from `anthony.robinson@robbgroupe.com`
   - Grant `isAdmin = true` only to `anthony@invoicedue.io`

#### What NOT to Do

- Do NOT share internal admin access with client accounts in production
- Do NOT rely on a single email address for both surfaces
- Do NOT allow client accounts to access `/internal/*` routes

#### Implementation Steps (When Ready)

```bash
# 1. Create internal admin account via signup or script
# 2. Grant admin access
npx tsx scripts/grant-admin.ts  # Update script with anthony@invoicedue.io

# 3. Revoke admin from client account
# (Update scripts/grant-admin.ts or run SQL)
UPDATE tenants SET is_admin = false WHERE email = 'anthony.robinson@robbgroupe.com';

# 4. Test both surfaces with correct accounts
```

#### Verification Checklist

- [ ] `anthony@invoicedue.io` can access `/internal/*`
- [ ] `anthony@invoicedue.io` cannot access client-specific data (no tenant invoices)
- [ ] `anthony.robinson@robbgroupe.com` can access `/client/*` with ROBB Groupe data
- [ ] `anthony.robinson@robbgroupe.com` cannot access `/internal/*`
- [ ] Both accounts have separate sessions

---

*Document created: January 2026*
*Last updated: February 2026*
