'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, MoreHorizontal, FileText, Loader2, X } from 'lucide-react';
import { formatCurrency, formatDate, formatPhoneNumber, formatDateTime, formatDuration } from '@/lib/utils';
import { Badge as OutcomeBadge } from '@/components/ui/badge';
import { useDropzone } from 'react-dropzone';

interface CallLog {
  id: string;
  startedAt: string;
  durationSeconds: number;
  outcome: string;
}

interface Invoice {
  id: string;
  customerName: string;
  phoneNumber: string;
  amount: string;
  dueDate: string;
  invoiceNumber: string | null;
  description: string | null;
  email: string | null;
  notes: string | null;
  status: string;
  lastCallOutcome: string | null;
  callAttempts: number;
  callLogs?: CallLog[];
}

interface CSVMapping {
  customerName: string;
  phoneNumber: string;
  amount: string;
  dueDate: string;
  invoiceNumber: string;
  description: string;
}

export default function InvoicesPage() {
  const searchParams = useSearchParams();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvPreview, setCsvPreview] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<CSVMapping>({
    customerName: '',
    phoneNumber: '',
    amount: '',
    dueDate: '',
    invoiceNumber: '',
    description: '',
  });
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStep, setUploadStep] = useState<'select' | 'map'>('select');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  const fetchInvoices = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      const response = await fetch(`/api/invoices?${params}`);
      const data = await response.json();
      setInvoices(data);
    } catch (error) {
      console.error('Failed to fetch invoices:', error);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  // Handle pre-selected invoice from URL
  useEffect(() => {
    const selectedId = searchParams.get('selected');
    if (selectedId && invoices.length > 0 && !selectedInvoice) {
      const invoice = invoices.find(i => i.id === selectedId);
      if (invoice) {
        handleViewDetail(invoice);
      }
    }
  }, [searchParams, invoices, selectedInvoice]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setCsvFile(file);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').filter((line) => line.trim());
      const headers = lines[0].split(',').map((h) => h.trim().replace(/"/g, ''));
      const preview = lines.slice(1, 4).map((line) =>
        line.split(',').map((cell) => cell.trim().replace(/"/g, ''))
      );

      setCsvHeaders(headers);
      setCsvPreview(preview);

      // Auto-detect mapping
      const autoMapping: CSVMapping = {
        customerName: '',
        phoneNumber: '',
        amount: '',
        dueDate: '',
        invoiceNumber: '',
        description: '',
      };

      headers.forEach((header) => {
        const lower = header.toLowerCase();
        if (lower.includes('customer') || lower.includes('name') || lower.includes('company')) {
          autoMapping.customerName = header;
        } else if (lower.includes('phone') || lower.includes('tel')) {
          autoMapping.phoneNumber = header;
        } else if (lower.includes('amount') || lower.includes('balance') || lower.includes('total')) {
          autoMapping.amount = header;
        } else if (lower.includes('due') || lower.includes('date')) {
          autoMapping.dueDate = header;
        } else if (lower.includes('invoice') || lower.includes('number') || lower.includes('ref')) {
          autoMapping.invoiceNumber = header;
        } else if (lower.includes('description') || lower.includes('desc') || lower.includes('service') || lower.includes('item')) {
          autoMapping.description = header;
        }
      });

      setMapping(autoMapping);
      setUploadStep('map');
    };
    reader.readAsText(file);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'] },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024,
  });

  const handleUpload = async () => {
    if (!csvFile) return;

    setIsUploading(true);

    const formData = new FormData();
    formData.append('file', csvFile);
    formData.append('mapping', JSON.stringify(mapping));

    try {
      const response = await fetch('/api/invoices/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        setUploadModalOpen(false);
        setUploadStep('select');
        setCsvFile(null);
        fetchInvoices();
      }
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleMarkResolved = async (id: string) => {
    try {
      await fetch(`/api/invoices/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'COMPLETED' }),
      });
      fetchInvoices();
    } catch (error) {
      console.error('Failed to update invoice:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/invoices/${id}`, { method: 'DELETE' });
      setSelectedInvoice(null);
      fetchInvoices();
    } catch (error) {
      console.error('Failed to delete invoice:', error);
    }
  };

  const handleViewDetail = async (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsLoadingDetail(true);
    try {
      const response = await fetch(`/api/invoices/${invoice.id}`);
      if (response.ok) {
        const data = await response.json();
        setSelectedInvoice(data);
      }
    } catch (error) {
      console.error('Failed to fetch invoice detail:', error);
    } finally {
      setIsLoadingDetail(false);
    }
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

  const getStatusBadgeVariant = (status: string) => {
    const variants: Record<string, 'pending' | 'inProgress' | 'completed' | 'failed'> = {
      PENDING: 'pending',
      IN_PROGRESS: 'inProgress',
      COMPLETED: 'completed',
      FAILED: 'failed',
    };
    return variants[status] || 'pending';
  };

  return (
    <div className="flex flex-col h-full">
      <Header title="Invoices" />
      <div className="flex-1 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Button onClick={() => setUploadModalOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Upload CSV
          </Button>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="FAILED">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : invoices.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No invoices uploaded yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Upload a CSV file to start following up on your overdue invoices.
              </p>
              <Button onClick={() => setUploadModalOpen(true)}>
                <Upload className="mr-2 h-4 w-4" />
                Upload CSV
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="flex gap-6">
            <Card className={selectedInvoice ? 'flex-1' : 'w-full'}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Outcome</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => (
                    <TableRow 
                      key={invoice.id} 
                      className={`cursor-pointer ${selectedInvoice?.id === invoice.id ? 'bg-muted' : ''}`}
                      onClick={() => handleViewDetail(invoice)}
                    >
                      <TableCell className="font-medium">{invoice.customerName}</TableCell>
                      <TableCell>{formatPhoneNumber(invoice.phoneNumber)}</TableCell>
                      <TableCell>{formatCurrency(invoice.amount)}</TableCell>
                      <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(invoice.status)}>
                          {invoice.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {invoice.lastCallOutcome ? (
                          <span className="text-sm text-muted-foreground">
                            {invoice.lastCallOutcome.replace('_', ' ')}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleMarkResolved(invoice.id); }}>
                              Mark as Resolved
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => { e.stopPropagation(); handleDelete(invoice.id); }}
                              className="text-red-600"
                            >
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>

            {selectedInvoice && (
              <Card className="w-96 flex-shrink-0">
                <div className="p-4 border-b flex items-center justify-between">
                  <h3 className="font-semibold">Invoice Detail</h3>
                  <Button variant="ghost" size="icon" onClick={() => setSelectedInvoice(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="p-4 space-y-4">
                  {isLoadingDetail ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm text-muted-foreground">Customer</p>
                          <p className="font-medium">{selectedInvoice.customerName}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Phone</p>
                          <p className="font-medium">{formatPhoneNumber(selectedInvoice.phoneNumber)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Amount</p>
                          <p className="font-medium">{formatCurrency(selectedInvoice.amount)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Due Date</p>
                          <p className="font-medium">{formatDate(selectedInvoice.dueDate)}</p>
                        </div>
                        {selectedInvoice.invoiceNumber && (
                          <div>
                            <p className="text-sm text-muted-foreground">Invoice #</p>
                            <p className="font-medium">{selectedInvoice.invoiceNumber}</p>
                          </div>
                        )}
                        {selectedInvoice.description && (
                          <div>
                            <p className="text-sm text-muted-foreground">Description</p>
                            <p className="font-medium">{selectedInvoice.description}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-sm text-muted-foreground">Status</p>
                          <Badge variant={getStatusBadgeVariant(selectedInvoice.status)}>
                            {selectedInvoice.status.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>

                      <div className="border-t pt-4">
                        <h4 className="font-medium mb-3">Call History</h4>
                        {selectedInvoice.callLogs && selectedInvoice.callLogs.length > 0 ? (
                          <div className="space-y-2">
                            {selectedInvoice.callLogs.map((call) => (
                              <div key={call.id} className="flex items-center justify-between py-2 border-b last:border-0">
                                <div>
                                  <p className="text-sm">{formatDateTime(call.startedAt)}</p>
                                  <p className="text-xs text-muted-foreground">{formatDuration(call.durationSeconds)}</p>
                                </div>
                                <OutcomeBadge variant={getOutcomeBadgeVariant(call.outcome)}>
                                  {call.outcome.replace('_', ' ')}
                                </OutcomeBadge>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">No calls yet</p>
                        )}
                      </div>

                      <div className="border-t pt-4 flex gap-2">
                        <Button 
                          variant="outline" 
                          className="flex-1"
                          onClick={() => handleMarkResolved(selectedInvoice.id)}
                        >
                          Mark as Resolved
                        </Button>
                        <Button 
                          variant="destructive" 
                          className="flex-1"
                          onClick={() => handleDelete(selectedInvoice.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </Card>
            )}
          </div>
        )}

        <Dialog open={uploadModalOpen} onOpenChange={setUploadModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Upload Invoices</DialogTitle>
              <DialogDescription>
                {uploadStep === 'select'
                  ? 'Upload a CSV file with your overdue invoice data.'
                  : 'Map your CSV columns to invoice fields.'}
              </DialogDescription>
            </DialogHeader>

            {uploadStep === 'select' ? (
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
                }`}
              >
                <input {...getInputProps()} />
                <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground">
                  {isDragActive
                    ? 'Drop the file here...'
                    : 'Drag and drop your CSV file here, or click to browse'}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Max file size: 5MB, up to 1,000 rows
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Customer Name *</Label>
                    <Select
                      value={mapping.customerName}
                      onValueChange={(v) => setMapping({ ...mapping, customerName: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select column" />
                      </SelectTrigger>
                      <SelectContent>
                        {csvHeaders.map((h) => (
                          <SelectItem key={h} value={h}>
                            {h}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Phone Number *</Label>
                    <Select
                      value={mapping.phoneNumber}
                      onValueChange={(v) => setMapping({ ...mapping, phoneNumber: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select column" />
                      </SelectTrigger>
                      <SelectContent>
                        {csvHeaders.map((h) => (
                          <SelectItem key={h} value={h}>
                            {h}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Amount *</Label>
                    <Select
                      value={mapping.amount}
                      onValueChange={(v) => setMapping({ ...mapping, amount: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select column" />
                      </SelectTrigger>
                      <SelectContent>
                        {csvHeaders.map((h) => (
                          <SelectItem key={h} value={h}>
                            {h}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Due Date *</Label>
                    <Select
                      value={mapping.dueDate}
                      onValueChange={(v) => setMapping({ ...mapping, dueDate: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select column" />
                      </SelectTrigger>
                      <SelectContent>
                        {csvHeaders.map((h) => (
                          <SelectItem key={h} value={h}>
                            {h}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Invoice Number</Label>
                    <Select
                      value={mapping.invoiceNumber}
                      onValueChange={(v) => setMapping({ ...mapping, invoiceNumber: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select column (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {csvHeaders.map((h) => (
                          <SelectItem key={h} value={h}>
                            {h}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Select
                      value={mapping.description}
                      onValueChange={(v) => setMapping({ ...mapping, description: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select column (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {csvHeaders.map((h) => (
                          <SelectItem key={h} value={h}>
                            {h}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {csvPreview.length > 0 && (
                  <div>
                    <Label>Preview (first 3 rows)</Label>
                    <div className="mt-2 border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            {csvHeaders.map((h) => (
                              <TableHead key={h} className="text-xs">
                                {h}
                              </TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {csvPreview.map((row, i) => (
                            <TableRow key={i}>
                              {row.map((cell, j) => (
                                <TableCell key={j} className="text-xs">
                                  {cell}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </div>
            )}

            <DialogFooter>
              {uploadStep === 'map' && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setUploadStep('select');
                      setCsvFile(null);
                    }}
                  >
                    Back
                  </Button>
                  <Button
                    onClick={handleUpload}
                    disabled={
                      isUploading ||
                      !mapping.customerName ||
                      !mapping.phoneNumber ||
                      !mapping.amount ||
                      !mapping.dueDate
                    }
                  >
                    {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Import Invoices
                  </Button>
                </>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
