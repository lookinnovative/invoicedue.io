import type { Invoice, CallLog, Policy, UsageRecord } from '@prisma/client';

export type InvoiceWithCalls = Invoice & {
  callLogs: CallLog[];
};

export type DashboardStats = {
  totalInvoices: number;
  callsThisPeriod: number;
  usage: {
    minutesUsed: number;
    minutesAllocated: number;
    percentUsed: number;
    warningLevel: 'none' | 'soft' | 'critical' | 'hard';
  };
  recentCalls: (CallLog & { invoice: { customerName: string } })[];
};

export type PolicyFormData = {
  cadenceDays: number[];
  maxAttempts: number;
  callWindowStart: string;
  callWindowEnd: string;
  callDays: string[];
  greetingScript: string;
  voicemailScript: string;
  paymentLink: string;
  smsEnabled: boolean;
};

export type CSVMapping = {
  customerName: string;
  phoneNumber: string;
  amount: string;
  dueDate: string;
  invoiceNumber?: string;
  email?: string;
  notes?: string;
};

export type CSVValidationError = {
  row: number;
  field: string;
  message: string;
};

export type CSVParseResult = {
  valid: ParsedInvoice[];
  errors: CSVValidationError[];
  headers: string[];
};

export type ParsedInvoice = {
  customerName: string;
  phoneNumber: string;
  amount: number;
  dueDate: Date;
  invoiceNumber?: string;
  email?: string;
  notes?: string;
};
