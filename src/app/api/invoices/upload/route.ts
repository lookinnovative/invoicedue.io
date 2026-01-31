import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { parse } from 'csv-parse/sync';
import { parsePhoneNumber } from '@/lib/utils';

interface CSVMapping {
  customerName: string;
  phoneNumber: string;
  amount: string;
  dueDate: string;
  invoiceNumber?: string;
  email?: string;
  notes?: string;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const mappingStr = formData.get('mapping') as string;

    if (!file || !mappingStr) {
      return NextResponse.json(
        { error: 'File and mapping are required' },
        { status: 400 }
      );
    }

    const mapping: CSVMapping = JSON.parse(mappingStr);
    const text = await file.text();
    
    const records = parse(text, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    const invoices = [];
    const errors = [];

    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      
      try {
        const customerName = record[mapping.customerName]?.trim();
        const phoneNumber = parsePhoneNumber(record[mapping.phoneNumber]?.trim() || '');
        const amountStr = record[mapping.amount]?.trim().replace(/[$,]/g, '');
        const dueDateStr = record[mapping.dueDate]?.trim();
        
        if (!customerName || !phoneNumber || !amountStr || !dueDateStr) {
          errors.push({ row: i + 2, error: 'Missing required fields' });
          continue;
        }

        const amount = parseFloat(amountStr);
        if (isNaN(amount)) {
          errors.push({ row: i + 2, error: 'Invalid amount' });
          continue;
        }

        const dueDate = new Date(dueDateStr);
        if (isNaN(dueDate.getTime())) {
          errors.push({ row: i + 2, error: 'Invalid date' });
          continue;
        }

        invoices.push({
          tenantId: session.user.id,
          customerName,
          phoneNumber,
          amount,
          dueDate,
          invoiceNumber: mapping.invoiceNumber ? record[mapping.invoiceNumber]?.trim() : null,
          email: mapping.email ? record[mapping.email]?.trim() : null,
          notes: mapping.notes ? record[mapping.notes]?.trim() : null,
        });
      } catch {
        errors.push({ row: i + 2, error: 'Parse error' });
      }
    }

    if (invoices.length > 0) {
      await db.invoice.createMany({
        data: invoices,
      });
    }

    return NextResponse.json({
      imported: invoices.length,
      errors: errors.length,
      errorDetails: errors.slice(0, 10),
    });
  } catch (error) {
    console.error('Upload failed:', error);
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    );
  }
}
