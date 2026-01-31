import { db } from './db';
import { getDaysOverdue, formatCurrency } from './utils';
import type { Invoice, Policy, Tenant } from '@prisma/client';

const VAPI_API_URL = 'https://api.vapi.ai';

interface VapiCallResponse {
  id: string;
  status: string;
  createdAt: string;
}

interface CallContext {
  invoice: Invoice;
  policy: Policy;
  tenant: Tenant;
}

function interpolateScript(script: string, context: CallContext): string {
  const { invoice, tenant } = context;
  const daysOverdue = getDaysOverdue(invoice.dueDate);
  
  return script
    .replace(/\{\{customer_name\}\}/g, invoice.customerName)
    .replace(/\{\{amount_due\}\}/g, formatCurrency(invoice.amount.toString()))
    .replace(/\{\{invoice_number\}\}/g, invoice.invoiceNumber || 'N/A')
    .replace(/\{\{days_overdue\}\}/g, daysOverdue.toString())
    .replace(/\{\{company_name\}\}/g, tenant.companyName);
}

export async function initiateCall(
  invoice: Invoice,
  policy: Policy,
  tenant: Tenant
): Promise<string | null> {
  const apiKey = process.env.VAPI_API_KEY;
  const phoneNumberId = process.env.VAPI_PHONE_NUMBER_ID;

  if (!apiKey || !phoneNumberId) {
    console.error('VAPI configuration missing');
    return null;
  }

  const context: CallContext = { invoice, policy, tenant };
  const greetingMessage = interpolateScript(policy.greetingScript, context);
  const voicemailMessage = interpolateScript(policy.voicemailScript, context);

  try {
    const response = await fetch(`${VAPI_API_URL}/call/phone`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phoneNumberId,
        customer: {
          number: invoice.phoneNumber,
        },
        assistant: {
          firstMessage: greetingMessage,
          voicemailMessage: voicemailMessage,
          endCallMessage: 'Thank you for your time. Goodbye.',
          model: {
            provider: 'openai',
            model: 'gpt-4-turbo-preview',
            messages: [
              {
                role: 'system',
                content: `You are a professional accounts receivable representative for ${tenant.companyName}. You are calling about an overdue invoice. Be polite, professional, and brief. Do not negotiate payment terms. Simply remind the customer of the overdue amount and inform them a payment link will be sent via text message.`,
              },
            ],
          },
          voice: {
            provider: 'elevenlabs',
            voiceId: 'rachel',
          },
        },
        metadata: {
          tenantId: tenant.id,
          invoiceId: invoice.id,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('VAPI call failed:', error);
      return null;
    }

    const data: VapiCallResponse = await response.json();

    // Send SMS with payment link if enabled
    if (policy.smsEnabled && policy.paymentLink) {
      await sendPaymentLinkSms(invoice.phoneNumber, policy.paymentLink, tenant.companyName);
    }

    return data.id;
  } catch (error) {
    console.error('Failed to initiate VAPI call:', error);
    return null;
  }
}

async function sendPaymentLinkSms(
  phoneNumber: string,
  paymentLink: string,
  companyName: string
): Promise<void> {
  // VAPI handles SMS through their platform
  // This is a placeholder for the SMS integration
  console.log(`SMS queued to ${phoneNumber}: Pay your invoice to ${companyName}: ${paymentLink}`);
}

export function verifyVapiWebhook(
  payload: string,
  signature: string
): boolean {
  const secret = process.env.VAPI_WEBHOOK_SECRET;
  if (!secret) return false;

  // VAPI uses HMAC-SHA256 for webhook signatures
  const crypto = require('crypto');
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

export function mapVapiOutcome(vapiStatus: string): string {
  const outcomeMap: Record<string, string> = {
    'completed': 'ANSWERED',
    'voicemail': 'VOICEMAIL',
    'no-answer': 'NO_ANSWER',
    'busy': 'BUSY',
    'failed': 'DISCONNECTED',
    'canceled': 'DISCONNECTED',
  };

  return outcomeMap[vapiStatus] || 'DISCONNECTED';
}

export async function getCallStatus(callId: string): Promise<{
  status: string;
  duration: number;
} | null> {
  const apiKey = process.env.VAPI_API_KEY;
  if (!apiKey) return null;

  try {
    const response = await fetch(`${VAPI_API_URL}/call/${callId}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) return null;

    const data = await response.json();
    return {
      status: data.status,
      duration: data.duration || 0,
    };
  } catch {
    return null;
  }
}
