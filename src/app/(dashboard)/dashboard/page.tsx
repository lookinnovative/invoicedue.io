import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { getUsageStatus } from '@/lib/usage';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { FileText, Phone, AlertTriangle, AlertCircle, XCircle } from 'lucide-react';
import Link from 'next/link';
import { formatDateTime } from '@/lib/utils';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const tenantId = session!.user.id;

  const [invoiceCount, callCount, usage, recentCalls, policy] = await Promise.all([
    db.invoice.count({ where: { tenantId } }),
    db.callLog.count({ where: { tenantId } }),
    getUsageStatus(tenantId),
    db.callLog.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { invoice: { select: { customerName: true } } },
    }),
    db.policy.findUnique({ where: { tenantId } }),
  ]);

  const getProgressVariant = () => {
    if (usage.warningLevel === 'hard') return 'destructive';
    if (usage.warningLevel === 'critical') return 'critical';
    if (usage.warningLevel === 'soft') return 'warning';
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

  const needsSetup = !policy?.paymentLink || invoiceCount === 0;

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

        {usage.warningLevel !== 'none' && (
          <Alert
            variant={usage.warningLevel === 'hard' ? 'destructive' : 'warning'}
          >
            {usage.warningLevel === 'hard' ? (
              <XCircle className="h-4 w-4" />
            ) : usage.warningLevel === 'critical' ? (
              <AlertCircle className="h-4 w-4" />
            ) : (
              <AlertTriangle className="h-4 w-4" />
            )}
            <AlertTitle>
              {usage.warningLevel === 'hard'
                ? 'Limit Reached'
                : usage.warningLevel === 'critical'
                ? 'Approaching Limit'
                : 'Usage Warning'}
            </AlertTitle>
            <AlertDescription>
              {usage.warningLevel === 'hard'
                ? 'You have used all your minutes. Follow-up calls are paused. Contact support to increase your allocation.'
                : usage.warningLevel === 'critical'
                ? `You have used ${Math.round(usage.percentUsed)}% of your minutes. Follow-up calls will pause when you reach 100%.`
                : `You have used ${Math.round(usage.percentUsed)}% of your minutes this period.`}
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
              <div className="text-3xl font-bold">{invoiceCount}</div>
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
              <div className="text-3xl font-bold">{callCount}</div>
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
            <Progress value={usage.percentUsed} variant={getProgressVariant()} />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>
                {usage.minutesUsed.toFixed(1)} / {usage.minutesAllocated} minutes
              </span>
              <span>{Math.round(usage.percentUsed)}% used</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {recentCalls.length === 0 ? (
              <p className="text-sm text-muted-foreground">No calls have been made yet.</p>
            ) : (
              <div className="space-y-3">
                {recentCalls.map((call) => (
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
