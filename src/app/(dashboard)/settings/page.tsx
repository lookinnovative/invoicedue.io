'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Settings {
  companyName: string;
  timezone: string;
  email: string;
}

interface Usage {
  minutesUsed: number;
  minutesAllocated: number;
  percentUsed: number;
  warningLevel: string;
  periodStart: string;
  periodEnd: string;
}

const timezones = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Phoenix',
  'America/Anchorage',
  'Pacific/Honolulu',
  'Europe/London',
  'Europe/Paris',
  'Asia/Tokyo',
  'Australia/Sydney',
];

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    companyName: '',
    timezone: 'America/New_York',
    email: '',
  });
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [passwordData, setPasswordData] = useState({ current: '', new: '', confirm: '' });
  const [passwordError, setPasswordError] = useState('');
  const [usage, setUsage] = useState<Usage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [settingsRes, usageRes] = await Promise.all([
        fetch('/api/settings'),
        fetch('/api/usage'),
      ]);

      if (settingsRes.ok) {
        const data = await settingsRes.json();
        setSettings({
          companyName: data.companyName || '',
          timezone: data.timezone || 'America/New_York',
          email: data.email || '',
        });
      }

      if (usageRes.ok) {
        const data = await usageRes.json();
        setUsage(data);
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setError('');
    setShowSuccess(false);
    setIsSaving(true);

    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      } else {
        setError('Failed to save settings');
      }
    } catch {
      setError('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const getProgressVariant = () => {
    if (!usage) return 'default';
    if (usage.warningLevel === 'hard') return 'destructive';
    if (usage.warningLevel === 'critical') return 'critical';
    if (usage.warningLevel === 'soft') return 'warning';
    return 'default';
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <Header title="Settings" />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <Header title="Settings" />
      <div className="flex-1 p-6 space-y-6 overflow-auto">
        {showSuccess && (
          <Alert variant="success">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>Settings saved successfully.</AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Company Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Company Name</Label>
              <Input
                value={settings.companyName}
                onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                placeholder="Your Company Name"
                className="mt-2"
              />
              <p className="text-sm text-muted-foreground mt-1">
                This name is used in call scripts.
              </p>
            </div>

            <div>
              <Label>Timezone</Label>
              <Select
                value={settings.timezone}
                onValueChange={(v) => setSettings({ ...settings, timezone: v })}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {timezones.map((tz) => (
                    <SelectItem key={tz} value={tz}>
                      {tz.replace(/_/g, ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </CardContent>
        </Card>

        {usage && (
          <Card>
            <CardHeader>
              <CardTitle>Usage</CardTitle>
              <CardDescription>Minutes used this billing period</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Progress value={usage.percentUsed} variant={getProgressVariant()} />
              <div className="flex justify-between text-sm">
                <span>
                  {usage.minutesUsed.toFixed(1)} of {usage.minutesAllocated} minutes used
                </span>
                <span className="text-muted-foreground">
                  {Math.round(usage.percentUsed)}%
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Period: {new Date(usage.periodStart).toLocaleDateString()} -{' '}
                {new Date(usage.periodEnd).toLocaleDateString()}
              </p>
              <p className="text-sm text-muted-foreground">
                Need more minutes? Contact support@invoicedue.io
              </p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Caller ID</CardTitle>
            <CardDescription>The phone number used for outbound calls</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="font-mono">+1 (555) 000-1234</p>
            <p className="text-sm text-muted-foreground mt-2">
              Need a different number? Contact support@invoicedue.io
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Email</Label>
              <p className="mt-1">{settings.email}</p>
            </div>
            <Button variant="outline" onClick={() => setShowPasswordDialog(true)}>
              Change Password
            </Button>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Enter your current password and a new password.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {passwordError && (
              <Alert variant="destructive">
                <AlertDescription>{passwordError}</AlertDescription>
              </Alert>
            )}
            <div>
              <Label>Current Password</Label>
              <Input
                type="password"
                value={passwordData.current}
                onChange={(e) => setPasswordData({ ...passwordData, current: e.target.value })}
                className="mt-2"
              />
            </div>
            <div>
              <Label>New Password</Label>
              <Input
                type="password"
                value={passwordData.new}
                onChange={(e) => setPasswordData({ ...passwordData, new: e.target.value })}
                className="mt-2"
              />
            </div>
            <div>
              <Label>Confirm New Password</Label>
              <Input
                type="password"
                value={passwordData.confirm}
                onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })}
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowPasswordDialog(false);
              setPasswordData({ current: '', new: '', confirm: '' });
              setPasswordError('');
            }}>
              Cancel
            </Button>
            <Button onClick={async () => {
              setPasswordError('');
              if (passwordData.new !== passwordData.confirm) {
                setPasswordError('Passwords do not match');
                return;
              }
              if (passwordData.new.length < 8) {
                setPasswordError('Password must be at least 8 characters');
                return;
              }
              try {
                const response = await fetch('/api/auth/change-password', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    currentPassword: passwordData.current,
                    newPassword: passwordData.new,
                  }),
                });
                if (response.ok) {
                  setShowPasswordDialog(false);
                  setPasswordData({ current: '', new: '', confirm: '' });
                  setShowSuccess(true);
                  setTimeout(() => setShowSuccess(false), 3000);
                } else {
                  const data = await response.json();
                  setPasswordError(data.error || 'Failed to change password');
                }
              } catch {
                setPasswordError('Failed to change password');
              }
            }}>
              Change Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
