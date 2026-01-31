'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Download, Loader2, Phone } from 'lucide-react';
import { formatDateTime, formatDuration, formatPhoneNumber } from '@/lib/utils';

interface CallLog {
  id: string;
  phoneNumber: string;
  startedAt: string;
  durationSeconds: number;
  outcome: string;
  invoice: {
    id: string;
    customerName: string;
  };
}

export default function HistoryPage() {
  const router = useRouter();
  const [calls, setCalls] = useState<CallLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [outcomeFilter, setOutcomeFilter] = useState<string>('all');

  const fetchCalls = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (outcomeFilter !== 'all') params.set('outcome', outcomeFilter);
      const response = await fetch(`/api/calls?${params}`);
      const data = await response.json();
      setCalls(data);
    } catch (error) {
      console.error('Failed to fetch calls:', error);
    } finally {
      setIsLoading(false);
    }
  }, [outcomeFilter]);

  useEffect(() => {
    fetchCalls();
  }, [fetchCalls]);

  const handleExport = async () => {
    try {
      const response = await fetch('/api/calls/export');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `call-history-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const getOutcomeBadgeVariant = (outcome: string) => {
    const variants: Record<
      string,
      'answered' | 'voicemail' | 'noAnswer' | 'busy' | 'wrongNumber' | 'disconnected' | 'pending'
    > = {
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

  const formatOutcome = (outcome: string) => {
    return outcome.replace(/_/g, ' ');
  };

  return (
    <div className="flex flex-col h-full">
      <Header title="Call History" />
      <div className="flex-1 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Select value={outcomeFilter} onValueChange={setOutcomeFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by outcome" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Outcomes</SelectItem>
              <SelectItem value="ANSWERED">Answered</SelectItem>
              <SelectItem value="VOICEMAIL">Voicemail</SelectItem>
              <SelectItem value="NO_ANSWER">No Answer</SelectItem>
              <SelectItem value="BUSY">Busy</SelectItem>
              <SelectItem value="WRONG_NUMBER">Wrong Number</SelectItem>
              <SelectItem value="DISCONNECTED">Disconnected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : calls.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Phone className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No calls have been made yet</h3>
              <p className="text-sm text-muted-foreground">
                Calls will appear here once the system starts following up on your overdue invoices.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date/Time</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Outcome</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {calls.map((call) => (
                  <TableRow 
                    key={call.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/invoices?selected=${call.invoice.id}`)}
                  >
                    <TableCell>{formatDateTime(call.startedAt)}</TableCell>
                    <TableCell className="font-medium">{call.invoice.customerName}</TableCell>
                    <TableCell>{formatPhoneNumber(call.phoneNumber)}</TableCell>
                    <TableCell>{formatDuration(call.durationSeconds)}</TableCell>
                    <TableCell>
                      <Badge variant={getOutcomeBadgeVariant(call.outcome)}>
                        {formatOutcome(call.outcome)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>
    </div>
  );
}
