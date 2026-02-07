# Client Admin Dashboard

## Purpose

The client admin dashboard provides InvoiceDue customers with visibility into their accounts receivable operations. It mirrors the structure and concepts of the internal admin, scoped to a single client.

## Design Principle

> Clients should feel like they are seeing "the same dashboard we use — scoped to their company."

The client admin intentionally reuses the same:
- Navigation structure
- Page concepts (Invoices, Payments, Calls, Events, System Health, Errors, Settings)
- UI patterns and components
- Mental model

The only differences are:
1. **Data scope**: Client sees only their own data
2. **Detail level**: Summarized, human-readable (no raw payloads, stack traces, or debug fields)

## Route Structure

```
/client                    → Overview (key metrics, recent activity)
/client/invoices          → Client's invoices with status tracking
/client/payments          → Payment history from Stripe webhooks
/client/calls             → Call log with outcomes
/client/events            → Activity timeline (human-readable)
/client/system-health     → Success rates and system status
/client/errors            → Issues that need attention
/client/settings          → Read-only view of account config
```

## Authorization Model

| Route | Access Rule |
|-------|-------------|
| `/internal/*` | Authenticated + `isAdmin = true` |
| `/client/*` | Authenticated (any tenant) |
| `/dashboard/*` | Authenticated (any tenant) |

A user with `isAdmin = true` can access both `/internal` and `/client`.

## Data Scoping (Critical)

All queries in client admin MUST include `tenantId` filter:

```typescript
const tenantId = await getClientTenantId();
const data = await db.invoice.findMany({
  where: { tenantId }, // ← REQUIRED
});
```

There is no cross-client access. Period.

## Level of Detail

### Client Admin Shows:
- Status badges (Pending, Paid, Failed)
- Counts and totals
- Success rates (percentages)
- Dates and timestamps
- Human-readable activity descriptions
- Masked phone numbers (last 4 digits only)

### Client Admin Does NOT Show:
- Raw JSON payloads
- Stack traces
- Webhook signatures
- Vendor retry internals
- Debug-level metadata
- Other clients' data

## Navigation

```
📊 Overview
📄 Invoices
💳 Payments
📞 Calls
📋 Activity
🏥 System Health
⚠️ Errors
⚙️ Settings
```

## Relationship to Existing UI

The client admin is **separate from** the existing simple dashboard:

| Surface | Purpose | Complexity |
|---------|---------|------------|
| `/dashboard` | Quick glance, upload, policy config | Calendly-simple |
| `/client/*` | Operational visibility, analytics | Admin-depth |

Both are available to authenticated tenants. The simple dashboard links to client admin via "Back to Dashboard" and vice versa.

## v0 Constraints

- Read-only (no edits from client admin UI)
- No role complexity (all authenticated users see client admin)
- No advanced filtering or export
- No real-time updates

## Files

```
/src/app/client/
  layout.tsx           → Navigation and auth verification
  page.tsx             → Overview
  invoices/page.tsx    → Invoice list
  payments/page.tsx    → Payment list
  calls/page.tsx       → Call log
  events/page.tsx      → Activity timeline
  system-health/page.tsx → Health metrics
  errors/page.tsx      → Error list
  settings/page.tsx    → Config view

/src/app/api/client/
  verify/route.ts      → Auth verification
  overview/route.ts    → Dashboard stats
  invoices/route.ts    → Invoice data
  payments/route.ts    → Payment data
  calls/route.ts       → Call data
  events/route.ts      → Event data
  system-health/route.ts → Health metrics
  errors/route.ts      → Error data
  settings/route.ts    → Settings data

/src/lib/client/
  permissions.ts       → verifyClientAccess, getClientTenantId
```
