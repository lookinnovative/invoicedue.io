'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { FileText, Phone, AlertTriangle, AlertCircle, XCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { formatDateTime } from '@/lib/utils';

interface CallLog {
  id: string;
  outcome: string;
  startedAt: string;
  invoice: {
    customerName: string;
  };
}

interface Usage {
  minutesUsed: number;
  minutesAllocated: number;
  percentUsed: number;
  warningLevel: 'none' | 'soft' | 'critical' | 'hard';
}

interface DashboardData {
  invoiceCount: number;
  callCount: number;
  usage: Usage;
  recentCalls: CallLog[];
  hasPaymentLink: boolean;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const [invoicesRes, callsRes, usageRes] = await Promise.all([
          fetch('/api/invoices'),
          fetch('/api/calls'),
          fetch('/api/usage'),
        ]);

        if (!invoicesRes.ok || !callsRes.ok || !usageRes.ok) {
          // Auth failed or other error - will be handled by layout redirect
          return;
        }

        const [invoices, calls, usage] = await Promise.all([
          invoicesRes.json(),
          callsRes.json(),
          usageRes.json(),
        ]);

        // Fetch policy to check payment link
        const policyRes = await fetch('/api/policy');
        const policy = policyRes.ok ? await policyRes.json() : null;

        setData({
          invoiceCount: Array.isArray(invoices) ? invoices.length : 0,
          callCount: Array.isArray(calls) ? calls.length : 0,
          usage: {
            minutesUsed: usage.minutesUsed || 0,
            minutesAllocated: usage.minutesAllocated || 100,
            percentUsed: usage.percentUsed || 0,
            warningLevel: usage.warningLevel || 'none',
          },
          recentCalls: Array.isArray(calls) ? calls.slice(0, 10) : [],
          hasPaymentLink: !!policy?.paymentLink,
        });
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  const getProgressVariant = () => {
    if (!data) return 'default';
    if (data.usage.warningLevel === 'hard') return 'destructive';
    if (data.usage.warningLevel === 'critical') return 'critical';
    if (data.usage.warningLevel === 'soft') return 'warning';
    return 'default';
  };

  const getOutcomeBadgeVariant = (outcome: string) => {
    const variants: Record<string, 'answered' | 'voicemail' | 'noAnswer' | 'busy' | 'wrongNumber' | 'disconnected' | 'pending'> = {
      ANSWERED: 'answered',
      VOICEMAIL: 'voicemail',
      NO_ANSWER: 'noAnswer',
      BUSY: 'busy',
      WRONG_NUMBER: 'wrongNumber',
      DISCONNECTED: 'disconnected',
      PENDING: 'pending',
    };
    return variants[outcome] || 'pending';
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <Header title="Dashboard" />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col h-full">
        <Header title="Dashboard" />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Failed to load dashboard data.</p>
        </div>
      </div>
    );
  }

  const needsSetup = !data.hasPaymentLink || data.invoiceCount === 0;

  return (
    <div className="flex flex-col h-full">
      <Header title="Dashboard" />
      <div className="flex-1 p-6 space-y-6">
        {needsSetup && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <h3 className="font-semibold text-lg mb-2">Welcome to InvoiceDue</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Get started by uploading your overdue invoices and configuring your payment link.
              </p>
              <div className="flex gap-3">
                <Button asChild>
                  <Link href="/invoices">Upload Invoices</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/policy">Configure Policy</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {data.usage.warningLevel !== 'none' && (
          <Alert
            variant={data.usage.warningLevel === 'hard' ? 'destructive' : 'warning'}
          >
            {data.usage.warningLevel === 'hard' ? (
              <XCircle className="h-4 w-4" />
            ) : data.usage.warningLevel === 'critical' ? (
              <AlertCircle className="h-4 w-4" />
            ) : (
              <AlertTriangle className="h-4 w-4" />
            )}
            <AlertTitle>
              {data.usage.warningLevel === 'hard'
                ? 'Limit Reached'
                : data.usage.warningLevel === 'critical'
                ? 'Approaching Limit'
                : 'Usage Warning'}
            </AlertTitle>
            <AlertDescription>
              {data.usage.warningLevel === 'hard'
                ? 'You have used all your minutes. Follow-up calls are paused. Contact support to increase your allocation.'
                : data.usage.warningLevel === 'critical'
                ? `You have used ${Math.round(data.usage.percentUsed)}% of your minutes. Follow-up calls will pause when you reach 100%.`
                : `You have used ${Math.round(data.usage.percentUsed)}% of your minutes this period.`}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Overdue Invoices</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{data.invoiceCount}</div>
              <Link href="/invoices" className="text-sm text-primary hover:underline">
                View Invoices
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Calls This Period</CardTitle>
              <Phone className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{data.callCount}</div>
              <Link href="/history" className="text-sm text-primary hover:underline">
                View History
              </Link>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Usage This Period</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Progress value={data.usage.percentUsed} variant={getProgressVariant()} />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>
                {data.usage.minutesUsed.toFixed(1)} / {data.usage.minutesAllocated} minutes
              </span>
              <span>{Math.round(data.usage.percentUsed)}% used</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {data.recentCalls.length === 0 ? (
              <p className="text-sm text-muted-foreground">No calls have been made yet.</p>
            ) : (
              <div className="space-y-3">
                {data.recentCalls.map((call) => (
                  <div
                    key={call.id}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                  >
                    <div>
                      <p className="font-medium">{call.invoice.customerName}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDateTime(call.startedAt)}
                      </p>
                    </div>
                    <Badge variant={getOutcomeBadgeVariant(call.outcome)}>
                      {call.outcome.replace('_', ' ')}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
