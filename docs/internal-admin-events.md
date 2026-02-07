# InvoiceDue.io — Event-Driven Architecture

## Philosophy

InvoiceDue.io follows an **event-driven, append-only** approach for observability and auditability:

1. **Write events first** — Before updating derived state
2. **Events are immutable** — Never delete, never modify
3. **Events are the source of truth** — If state is wrong, events can reconstruct it
4. **External systems are authoritative** — Stripe for payments, VAPI/Twilio for calls

## Event Model

### Event Entity

```
Event {
  id: UUID
  tenantId: UUID
  entityType: "client" | "invoice" | "call" | "payment" | "policy"
  entityId: UUID
  eventType: string
  payload: JSON
  source: "system" | "user" | "webhook"
  createdAt: timestamp
}
```

### Event Types

| Event Type | Trigger | Payload Example |
|------------|---------|-----------------|
| `client.created` | User signup | `{ email, companyName }` |
| `client.updated` | Settings change | `{ changes: {...} }` |
| `invoice.created` | CSV upload | `{ invoiceNumber, amount, dueDate }` |
| `invoice.status_changed` | Status update | `{ from, to, reason }` |
| `call.initiated` | VAPI call started | `{ vapiCallId, phoneNumber }` |
| `call.completed` | VAPI webhook | `{ outcome, duration, vapiCallId }` |
| `payment_link.sent` | SMS/email sent | `{ channel, recipient, link }` |
| `payment.received` | Stripe webhook | `{ stripePaymentIntentId, amount }` |
| `policy.updated` | User saves policy | `{ changes: {...} }` |
| `webhook.received` | Any inbound webhook | `{ source, eventType, rawPayload }` |
| `webhook.failed` | Processing error | `{ source, error, rawPayload }` |

## Source of Truth Hierarchy

| Domain | Source of Truth | InvoiceDue Role |
|--------|-----------------|-----------------|
| Payments | Stripe | Read + display Stripe state |
| Calls | VAPI/Twilio | Read + display call outcomes |
| Invoices | InvoiceDue | Full ownership |
| Clients | InvoiceDue | Full ownership |
| Usage | InvoiceDue | Full ownership |

### Payment State Rules

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

## Event Flow Examples

### Invoice → Call → Payment Flow

```
1. invoice.created (CSV upload)
   └── payload: { invoiceNumber: "INV-001", amount: 100.00 }

2. call.initiated (cron job)
   └── payload: { vapiCallId: "abc123", phoneNumber: "+1..." }

3. call.completed (VAPI webhook)
   └── payload: { outcome: "ANSWERED", duration: 45 }

4. payment_link.sent (after call)
   └── payload: { channel: "sms", link: "https://..." }

5. payment.received (Stripe webhook)
   └── payload: { stripePaymentIntentId: "pi_...", amount: 100.00 }

6. invoice.status_changed (system)
   └── payload: { from: "IN_PROGRESS", to: "COMPLETED", reason: "payment_received" }
```

### Reconstruction Scenario

If `invoice.status` shows "PENDING" but there's a `payment.received` event:

1. Query events for this invoice
2. Find `payment.received` event exists
3. Recognize derived state is stale
4. Update `invoice.status` to "COMPLETED"

## Webhook Logging

All inbound webhooks are logged to `WebhookLog` for:

- **Debugging** — See exactly what external systems sent
- **Replay** — Reprocess webhooks if handler had bugs
- **Audit** — Prove what data was received and when

```
WebhookLog {
  source: "stripe" | "vapi" | "twilio"
  eventType: "payment_intent.succeeded"
  payload: { raw JSON }
  processedAt: timestamp
  processingError: null | "error message"
}
```

## Admin Dashboard Usage

The Event Log page (`/internal/events`) surfaces events for:

- **Debugging** — "Why is this invoice stuck?"
- **Auditing** — "When did this payment come in?"
- **Understanding** — "What happened to this client's account?"

### Filters

- By entity type (client, invoice, call, payment)
- By event type (call.completed, payment.received, etc.)
- By time range
- By client

### Display

- Chronological list (newest first)
- Expandable JSON payload
- Links to related entities

## Implementation Notes

### Writing Events

```typescript
// Pattern: Write event, then update derived state
await db.event.create({
  data: {
    tenantId,
    entityType: 'invoice',
    entityId: invoice.id,
    eventType: 'invoice.status_changed',
    payload: { from: oldStatus, to: newStatus, reason },
    source: 'system',
  },
});

await db.invoice.update({
  where: { id: invoice.id },
  data: { status: newStatus },
});
```

### Querying Events

```typescript
// Get all events for an entity
const events = await db.event.findMany({
  where: {
    entityType: 'invoice',
    entityId: invoiceId,
  },
  orderBy: { createdAt: 'desc' },
});
```

---

*Last updated: February 2026*
