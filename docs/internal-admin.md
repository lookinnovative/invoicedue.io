# InvoiceDue.io — Internal Admin Dashboard

## Purpose

The internal admin dashboard is a founder/ops-only interface for observing, debugging, and understanding the state of the InvoiceDue.io system. It is **not customer-facing** and is designed to be dense, read-heavy, and utilitarian.

## What Problems It Solves

| Question | How Admin Answers It |
|----------|---------------------|
| Which clients are active? | Clients List page |
| Which invoices are outstanding? | Invoices List page with filters |
| What calls were placed and what happened? | Calls List page with outcomes |
| Were Stripe payment links sent? | Payments List + PaymentLinkSent tracking |
| Were payments completed? | Payments List (Stripe webhook data) |
| Where are failures occurring? | System Health page |
| What happened to entity X? | Event Log (append-only audit trail) |

## Route Structure

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

## Page Responsibilities

### Global Search (`/internal`)
- **Primary entry point** — if only one page ships, it's this one
- Search by email, phone, invoice ID, client name, Stripe ID, VAPI call ID
- Quick system health summary
- Recent errors count

### Clients List (`/internal/clients`)
- All clients (renamed from "Tenants")
- Status, signup date, invoice count, call count, payment status
- Click to drill into Client Detail

### Client Detail (`/internal/clients/[id]`)
- Deep-dive on one client
- All invoices, calls, payments, events for this client
- Policy configuration
- Usage summary

### Invoices List (`/internal/invoices`)
- Cross-client invoice view
- Filter by status, overdue days, amount range

### Calls List (`/internal/calls`)
- All VAPI/Twilio activity
- Outcome, duration, cost, timestamps

### Payments List (`/internal/payments`)
- Stripe payment activity
- Status, amount, payment link sent vs completed

### Events Log (`/internal/events`)
- Append-only audit trail
- Filter by entity type, event type, time range

### System Health (`/internal/system-health`)
- Failed calls (last 24h)
- Pending webhooks
- Error counts
- Basic charts (calls per day, outcomes distribution)

## Separation from Customer UI

| Aspect | Customer UI | Internal Admin |
|--------|-------------|----------------|
| Route prefix | `/dashboard`, `/invoices`, etc. | `/internal/*` |
| Access | Authenticated customers | Founder/ops only |
| Purpose | Self-service | Observability |
| Design | Polished, branded | Utilitarian, dense |
| Editability | Full CRUD | Read-only (v0) |

**Critical**: No internal admin code should be imported by customer-facing routes.

## v0 Constraints

- **Read-only** — No edit, delete, or mutation buttons
- **Inspect-only** — Observe, diagnose, understand
- **No remediation** — No retry, replay, or fix buttons
- **Stripe is truth** — Payment state only from webhooks
- **Single admin** — No role complexity

## Future Scope (Post-Revenue)

- Role-based access control
- Bulk operations
- Export functionality
- Retry/remediation tools
- Customer impersonation (read-only)

---

*Last updated: February 2026*
