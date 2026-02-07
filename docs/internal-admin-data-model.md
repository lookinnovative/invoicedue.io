# InvoiceDue.io — Internal Admin Data Model

## Overview

This document describes the data model additions required to support the internal admin dashboard. These entities provide observability, audit trails, and payment tracking.

## Terminology Change

**Tenant → Client**

The term "Tenant" is being renamed to "Client" throughout the codebase and documentation for semantic clarity. The underlying table may remain `tenant` for migration simplicity, but all new code and UI should use "Client."

## Existing Entities

These entities already exist in the MVP:

| Entity | Purpose |
|--------|---------|
| `Tenant` (→ Client) | Customer account |
| `Invoice` | AR record to follow up on |
| `CallLog` | Record of VAPI/Twilio calls |
| `Policy` | Client's follow-up configuration |
| `UsageRecord` | Call minutes tracking |

## New Entities (To Be Added)

### Event (Append-Only Audit Ledger)

```
Event {
  id: UUID (primary key)
  tenantId: UUID (foreign key → Tenant)
  entityType: "client" | "invoice" | "call" | "payment" | "policy"
  entityId: UUID
  eventType: string (e.g., "call.completed", "payment.received")
  payload: JSON (event-specific data)
  source: "system" | "user" | "webhook"
  createdAt: timestamp
}
```

**Purpose**: Immutable audit trail for debugging and reconstruction.

**Key Events**:
- `invoice.created` — CSV upload
- `invoice.status_changed` — Status progression
- `call.initiated` — VAPI call started
- `call.completed` — VAPI webhook received
- `payment_link.sent` — SMS/email with payment link
- `payment.received` — Stripe webhook (`payment_intent.succeeded`)
- `policy.updated` — User saves policy
- `webhook.received` — Any inbound webhook

### Payment (Stripe Payment Tracking)

```
Payment {
  id: UUID (primary key)
  tenantId: UUID (foreign key → Tenant)
  invoiceId: UUID (foreign key → Invoice)
  stripePaymentIntentId: string (unique)
  status: "pending" | "succeeded" | "failed"
  amount: decimal
  currency: string (default "usd")
  paidAt: timestamp (nullable)
  createdAt: timestamp
  updatedAt: timestamp
}
```

**Purpose**: Track Stripe payment lifecycle, linked to invoices.

**Critical Constraint**: This entity is **only updated by Stripe webhooks**, never by UI actions or assumptions.

### PaymentLinkSent (Delivery Tracking)

```
PaymentLinkSent {
  id: UUID (primary key)
  invoiceId: UUID (foreign key → Invoice)
  channel: "sms" | "email"
  recipientAddress: string (phone or email)
  paymentLink: string (URL)
  sentAt: timestamp
  deliveryStatus: "queued" | "sent" | "delivered" | "failed"
  externalId: string (Twilio SID or email provider ID)
  createdAt: timestamp
}
```

**Purpose**: Track when/if payment links were sent and delivery status.

### WebhookLog (Debugging)

```
WebhookLog {
  id: UUID (primary key)
  source: "vapi" | "twilio" | "stripe"
  eventType: string
  payload: JSON
  signature: string (for verification audit)
  processedAt: timestamp (nullable)
  processingError: string (nullable)
  createdAt: timestamp
}
```

**Purpose**: Debug inbound webhooks, enable replay if needed.

## Relationships

```
Tenant (Client)
  ├── Policy (1:1)
  ├── Invoice (1:many)
  │     ├── CallLog (1:many)
  │     ├── Payment (1:many)
  │     └── PaymentLinkSent (1:many)
  ├── Event (1:many, polymorphic via entityType/entityId)
  ├── UsageRecord (1:many)
  └── WebhookLog (1:many, via tenantId if extractable)
```

## Derived vs Event-Sourced State

### Events (Immutable, Append-Only)

| Field | Source |
|-------|--------|
| All Event records | System writes |
| WebhookLog records | Inbound webhooks |

### Derived State (Mutable, Computed from Events)

| Field | Derived From |
|-------|--------------|
| `invoice.status` | Latest status event |
| `invoice.callAttempts` | Count of call events |
| `invoice.lastCallOutcome` | Latest call event |
| `payment.status` | Latest Stripe webhook |

**Principle**: If state is ever wrong, events are the source of truth for reconstruction.

## Indexing Recommendations

```
Event: [tenantId, createdAt], [entityType, entityId], [eventType]
Payment: [tenantId], [invoiceId], [stripePaymentIntentId]
PaymentLinkSent: [invoiceId], [sentAt]
WebhookLog: [source, createdAt], [eventType]
```

---

*Last updated: February 2026*
