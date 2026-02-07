'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle } from 'lucide-react';

interface Policy {
  cadenceDays: number[];
  maxAttempts: number;
  callWindowStart: string;
  callWindowEnd: string;
  callDays: string[];
  greetingScript: string;
  voicemailScript: string;
  paymentLink: string;
  smsEnabled: boolean;
}

const defaultPolicy: Policy = {
  cadenceDays: [3, 7, 14, 30],
  maxAttempts: 5,
  callWindowStart: '09:00',
  callWindowEnd: '18:00',
  callDays: ['mon', 'tue', 'wed', 'thu', 'fri'],
  greetingScript:
    'Hi, this is Alex calling on behalf of {{company_name}}. I hope I\'m catching you at a good time. I\'m reaching out about invoice {{invoice_number}} — that\'s for {{amount_due}}. It looks like it\'s still open on our end, and I just wanted to touch base with you about it. Would it be helpful if I sent you a secure payment link?',
  voicemailScript:
    'Hi, this is Alex calling on behalf of {{company_name}}. I\'m reaching out about an invoice that\'s still open on your account. When you get a chance, please give us a call back, or I can send you the details by text or email. Thanks so much, and have a great day.',
  paymentLink: '',
  smsEnabled: true,
};

const cadenceOptions = [3, 7, 14, 21, 30, 45, 60, 90];
const dayOptions = [
  { id: 'mon', label: 'Mon' },
  { id: 'tue', label: 'Tue' },
  { id: 'wed', label: 'Wed' },
  { id: 'thu', label: 'Thu' },
  { id: 'fri', label: 'Fri' },
  { id: 'sat', label: 'Sat' },
  { id: 'sun', label: 'Sun' },
];

export default function PolicyPage() {
  const [policy, setPolicy] = useState<Policy>(defaultPolicy);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPolicy();
  }, []);

  const fetchPolicy = async () => {
    try {
      const response = await fetch('/api/policy');
      if (response.ok) {
        const data = await response.json();
        if (data) {
          setPolicy({
            ...defaultPolicy,
            ...data,
            paymentLink: data.paymentLink || '',
          });
        }
      }
    } catch (error) {
      console.error('Failed to fetch policy:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setError('');
    setShowSuccess(false);

    if (!policy.paymentLink) {
      setError('Payment link is required');
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch('/api/policy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(policy),
      });

      if (response.ok) {
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      } else {
        setError('Failed to save policy');
      }
    } catch {
      setError('Failed to save policy');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setPolicy({ ...defaultPolicy, paymentLink: policy.paymentLink });
  };

  const toggleCadenceDay = (day: number) => {
    setPolicy((prev) => ({
      ...prev,
      cadenceDays: prev.cadenceDays.includes(day)
        ? prev.cadenceDays.filter((d) => d !== day)
        : [...prev.cadenceDays, day].sort((a, b) => a - b),
    }));
  };

  const toggleCallDay = (day: string) => {
    setPolicy((prev) => ({
      ...prev,
      callDays: prev.callDays.includes(day)
        ? prev.callDays.filter((d) => d !== day)
        : [...prev.callDays, day],
    }));
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <Header title="Follow-Up Policy" />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <Header title="Follow-Up Policy" />
      <div className="flex-1 p-6 space-y-6 overflow-auto">
        <p className="text-muted-foreground">
          Configure how and when we follow up on your overdue invoices.
        </p>

        {showSuccess && (
          <Alert variant="success">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>Policy saved successfully.</AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Payment Link</CardTitle>
            <CardDescription>
              Where should customers go to pay? This link will be sent via SMS after each call.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Input
              type="url"
              placeholder="https://pay.stripe.com/your-link"
              value={policy.paymentLink}
              onChange={(e) => setPolicy({ ...policy, paymentLink: e.target.value })}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Call Schedule</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label>Follow up on invoices that are overdue by:</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {cadenceOptions.map((day) => (
                  <Button
                    key={day}
                    type="button"
                    variant={policy.cadenceDays.includes(day) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => toggleCadenceDay(day)}
                  >
                    {day} days
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <Label>Maximum attempts per invoice</Label>
              <Select
                value={policy.maxAttempts.toString()}
                onValueChange={(v) => setPolicy({ ...policy, maxAttempts: parseInt(v) })}
              >
                <SelectTrigger className="w-32 mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                    <SelectItem key={n} value={n.toString()}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Call window start</Label>
                <Input
                  type="time"
                  value={policy.callWindowStart}
                  onChange={(e) => setPolicy({ ...policy, callWindowStart: e.target.value })}
                  className="mt-2"
                />
              </div>
              <div>
                <Label>Call window end</Label>
                <Input
                  type="time"
                  value={policy.callWindowEnd}
                  onChange={(e) => setPolicy({ ...policy, callWindowEnd: e.target.value })}
                  className="mt-2"
                />
              </div>
            </div>

            <div>
              <Label>Call on these days</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {dayOptions.map((day) => (
                  <Button
                    key={day.id}
                    type="button"
                    variant={policy.callDays.includes(day.id) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => toggleCallDay(day.id)}
                  >
                    {day.label}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Call Scripts</CardTitle>
            <CardDescription>
              Alex, your AI assistant, uses these scripts as a guide and responds conversationally based on customer responses.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label>Opening message (when someone answers)</Label>
              <Textarea
                value={policy.greetingScript}
                onChange={(e) => setPolicy({ ...policy, greetingScript: e.target.value })}
                className="mt-2 min-h-24"
              />
            </div>

            <div>
              <Label>Voicemail message</Label>
              <Textarea
                value={policy.voicemailScript}
                onChange={(e) => setPolicy({ ...policy, voicemailScript: e.target.value })}
                className="mt-2 min-h-24"
              />
            </div>

            <div className="text-sm text-muted-foreground">
              <p className="font-medium">Available placeholders:</p>
              <p className="mt-1">
                {'{{customer_name}} {{amount_due}} {{invoice_number}} {{days_overdue}} {{company_name}}'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Options</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="smsEnabled"
                checked={policy.smsEnabled}
                onCheckedChange={(checked) =>
                  setPolicy({ ...policy, smsEnabled: checked as boolean })
                }
              />
              <Label htmlFor="smsEnabled" className="cursor-pointer">
                Send payment link via SMS after each call
              </Label>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={handleReset}>
            Reset to Defaults
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Policy
          </Button>
        </div>
      </div>
    </div>
  );
}
