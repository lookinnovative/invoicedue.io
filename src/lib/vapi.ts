import { getDaysOverdue, formatCurrency } from './utils';
import type { Invoice, Policy, Tenant } from '@prisma/client';

const VAPI_API_URL = 'https://api.vapi.ai'; // VAPI base URL

// Normalize phone number to E.164 format
function normalizePhoneNumber(phone: string): string {
  // Remove all non-digit characters except leading +
  const cleaned = phone.replace(/[^\d+]/g, '');
  
  // If already has +, assume it's formatted
  if (cleaned.startsWith('+')) {
    return cleaned;
  }
  
  // If it's a 10-digit US number, add +1
  if (cleaned.length === 10) {
    return `+1${cleaned}`;
  }
  
  // If it's 11 digits starting with 1, add +
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `+${cleaned}`;
  }
  
  // Default: add + prefix
  return `+${cleaned}`;
}

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
  const apiKey = process.env.VAPI_API_KEY?.trim();
  const phoneNumberId = process.env.VAPI_PHONE_NUMBER_ID?.trim();

  if (!apiKey || !phoneNumberId) {
    console.error('VAPI configuration missing');
    return null;
  }

  // Extract first name from customer name
  const firstName = invoice.customerName.split(' ')[0];
  const amount = formatCurrency(invoice.amount.toString());
  const invoiceNumber = invoice.invoiceNumber || 'N/A';
  const description = invoice.description || '';
  const paymentLink = policy.paymentLink || '';

  // Conversational dialog system prompt
  const systemPrompt = `You are Alex, a warm and professional accounts receivable assistant calling on behalf of ${tenant.companyName}.

CURRENT CALL CONTEXT:
- Customer: ${invoice.customerName}
- First Name: ${firstName}
- Invoice Number: ${invoiceNumber}
- Amount Due: ${amount}
- Description: ${description || 'services rendered'}
- Company: ${tenant.companyName}
- Payment Link: ${paymentLink}

YOUR PERSONA:
- Name: Alex
- Tone: Warm, calm, professional, genuinely helpful (not salesy, not robotic, not pushy)
- Style: Conversational, friendly, uses the customer's first name occasionally
- Pacing: Speak slowly and clearly. Pause briefly between sentences. Allow the customer time to respond.

CONVERSATION FLOW:

1. OPENING (already delivered as first message)
You asked: "Hi, this is Alex calling on behalf of ${tenant.companyName}. I hope I'm catching you at a good time. Am I speaking with ${firstName}?"

2. IF THEY CONFIRM IDENTITY ("yes", "speaking", "this is them", etc.):
Say: "Thanks, ${firstName}. I'm reaching out about invoice ${invoiceNumber} — that's the ${description || 'services rendered'} for ${amount}. It looks like it's still open on our end, and I just wanted to touch base with you about it. Would it be helpful if I sent you a secure payment link? That way you can take care of it whenever's convenient for you."

3. RESPONSE HANDLING:

A) If they want the payment link ("yes send it", "text me", "email me", "sure", etc.):
Say: "Absolutely, I'll get that over to you right away. You should see it come through shortly. Really appreciate you taking the time to chat, ${firstName}. Have a great rest of your day."
Then end the call.

B) If they can't pay today ("not right now", "I need time", "can't today", "next week", etc.):
Say: "No problem at all, I completely understand. Just so I can make a note — when do you think works best for you to take care of it?"
After they give a date, say: "Perfect, I've got that noted. I'll go ahead and send the payment link now so you have it ready when you need it. Thanks so much, ${firstName}. Have a great day."
Then end the call.

C) If they already paid or have a question ("I already paid", "there's an issue", "I have a question", "need to check", etc.):
Say: "Oh, I appreciate you letting me know. I'll make sure to note that on our end. If there's anything that needs to be sorted out, someone from our team will be in touch. Thanks again, ${firstName}. Have a great day."
Then end the call.

D) If wrong person ("no", "wrong number", "they're not here", "who?", etc.):
Say: "Oh, my apologies for the mix-up. Thanks for letting me know. Have a great day."
Then end the call.

E) If they seem confused or need clarification:
Say: "No worries — I'm just calling from ${tenant.companyName} about an open invoice. Would it help if I sent the details to you by text or email?"
Then proceed based on their response.

CONVERSATION STYLE GUIDELINES:
- Use transition phrases naturally: "No problem", "Absolutely", "I understand", "No worries"
- Acknowledge what they say before responding
- Use their first name once or twice, but not every sentence
- Position payment as "taking care of it" rather than "paying"
- Keep a helpful, collaborative tone throughout
- If the conversation goes off-script, gently guide back to offering the payment link

STRICT RULES:
- Never take card details or process payment on the call
- Never negotiate payment plans or split payments
- Never discuss disputes in detail — offer to have someone follow up
- Never pretend to be human staff (you are Alex, an assistant)
- Always end warmly with "Have a great day" or similar
- If unsure how to proceed, offer to send the payment link and end gracefully`;

  // Voicemail script (neutral, no amount, compliant) - with natural pauses
  const voicemailScript = `Hi, this is Alex calling on behalf of ${tenant.companyName}. I'm reaching out about an invoice that's still open on your account. When you get a chance, please give us a call back, or I can send you the details by text or email. Thanks so much, and have a great day.`;

  // Opening message - warm and conversational
  const firstMessage = `Hi, this is Alex calling on behalf of ${tenant.companyName}. I hope I'm catching you at a good time. Am I speaking with ${firstName}?`;

  try {
    const requestBody = {
      phoneNumberId,
      customer: {
        number: normalizePhoneNumber(invoice.phoneNumber),
      },
      assistant: {
        firstMessage: firstMessage,
        voicemailMessage: voicemailScript,
        endCallMessage: 'Thank you for your time, and have a great day.',
        model: {
          provider: 'openai',
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: systemPrompt,
            },
          ],
        },
        voice: {
          provider: 'vapi',
          voiceId: 'Elliot',
        },
      },
      metadata: {
        tenantId: tenant.id,
        invoiceId: invoice.id,
      },
    };
    
    console.log('VAPI Request Body:', JSON.stringify(requestBody, null, 2));
    
    const response = await fetch(`${VAPI_API_URL}/call`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
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
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    console.log(`SMS skipped (Twilio not configured) to ${phoneNumber}`);
    return;
  }

  try {
    const twilio = require('twilio');
    const client = twilio(accountSid, authToken);

    const message = await client.messages.create({
      body: `${companyName}: Pay your invoice securely here: ${paymentLink}`,
      from: fromNumber,
      to: normalizePhoneNumber(phoneNumber),
    });

    console.log(`SMS sent to ${phoneNumber}, SID: ${message.sid}`);
  } catch (error) {
    console.error(`Failed to send SMS to ${phoneNumber}:`, error);
    // Don't throw - SMS failure shouldn't block the call flow
  }
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

export function mapVapiOutcome(vapiStatus: string): 'ANSWERED' | 'VOICEMAIL' | 'NO_ANSWER' | 'BUSY' | 'WRONG_NUMBER' | 'DISCONNECTED' {
  const outcomeMap: Record<string, 'ANSWERED' | 'VOICEMAIL' | 'NO_ANSWER' | 'BUSY' | 'WRONG_NUMBER' | 'DISCONNECTED'> = {
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
