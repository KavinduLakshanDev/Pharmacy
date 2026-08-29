import React, { useEffect, useState } from 'react';
import { useForm, usePage } from '@inertiajs/react';
import type { FormDataConvertible } from '@inertiajs/core';
import { AlertCircle, CreditCard, DollarSign, Receipt, Search } from 'lucide-react';
import { PageTemplate } from '@/components/page-template';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { showToast } from '@/components/ui/toast-notification';
import { Textarea } from '@/components/ui/textarea';

interface Customer {
    AdrKy: number;
    AdrCd: string | null;
    FstNm: string;
    LstNm: string;
    TP1: string | null;
    Address: string | null;
    current_balance: number;
}

interface BankAccount {
    id: number;
    name: string;
    bank_account_no: string | null;
    bank_branch: string | null;
}

interface OutstandingInvoice {
    id: number;
    sale_no: string;
    sale_date: string;
    total_amount: number;
    paid_amount: number;
    balance_amount: number;
}

interface PaymentData {
    [key: string]: FormDataConvertible;
    customer_id: number;
    payment_method: string;
    paid_amount: number;
    invoice_payments?: string;
    payment_date: string;
    notes?: string;
    selected_bank_id?: number;
    cheque_no?: string;
    cheque_bank_name?: string;
    cheque_branch?: string;
    cheque_date?: string;
    cheque_account_no?: string;
    bank_name?: string;
    bank_reference_no?: string;
    bank_branch?: string;
    bank_deposit_date?: string;
    bank_account_no?: string;
    transfer_reference_no?: string;
    transfer_transaction_id?: string;
    transfer_bank_name?: string;
    transfer_branch?: string;
    transfer_date?: string;
}

export default function CustomerPaymentsIndex() {
    const { flash, bankAccounts } = usePage().props as any;
    const [searchTerm, setSearchTerm] = useState('');
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [customerBalance, setCustomerBalance] = useState(0);
    const [recentPayments, setRecentPayments] = useState<any[]>([]);
    const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
    const [selectedBank, setSelectedBank] = useState<BankAccount | null>(null);
    const [outstandingInvoices, setOutstandingInvoices] = useState<OutstandingInvoice[]>([]);
    const [invoicePayAmounts, setInvoicePayAmounts] = useState<Record<number, string>>({});

    const { data, setData, post, processing, errors, reset } = useForm<PaymentData>({
        customer_id: 0,
        payment_method: '',
        paid_amount: 0,
        payment_date: new Date().toISOString().split('T')[0],
        notes: '',
        selected_bank_id: undefined,
        cheque_no: '',
        cheque_bank_name: '',
        cheque_branch: '',
        cheque_date: '',
        cheque_account_no: '',
        bank_name: '',
        bank_reference_no: '',
        bank_branch: '',
        bank_deposit_date: '',
        bank_account_no: '',
        transfer_reference_no: '',
        transfer_transaction_id: '',
        transfer_bank_name: '',
        transfer_branch: '',
        transfer_date: '',
    });

    useEffect(() => {
        if (searchTimeout) {
            clearTimeout(searchTimeout);
        }

        if (searchTerm.length >= 2) {
            const timeout = setTimeout(() => {
                searchCustomers(searchTerm);
            }, 300);
            setSearchTimeout(timeout);
        } else {
            setCustomers([]);
        }

        return () => {
            if (searchTimeout) {
                clearTimeout(searchTimeout);
            }
        };
    }, [searchTerm]);

    useEffect(() => {
        if (!selectedBank) {
            return;
        }

        if (data.payment_method === 'Cheque') {
            setData('cheque_bank_name', selectedBank.name);
            setData('cheque_account_no', selectedBank.bank_account_no ?? '');
            setData('cheque_branch', selectedBank.bank_branch ?? '');
        } else if (data.payment_method === 'Bank') {
            setData('bank_name', selectedBank.name);
            setData('bank_account_no', selectedBank.bank_account_no ?? '');
            setData('bank_branch', selectedBank.bank_branch ?? '');
        } else if (data.payment_method === 'Online Transfer') {
            setData('transfer_bank_name', selectedBank.name);
            setData('transfer_branch', selectedBank.bank_branch ?? '');
        }
    }, [selectedBank, data.payment_method]);

    const searchCustomers = async (query: string) => {
        const response = await fetch(route('inventory.customer-payments.search-customers') + `?search=${encodeURIComponent(query)}`);
        const results = await response.json();
        setCustomers(results);
    };

    const formatMoney = (value: number) => {
        const amount = Number.isFinite(value) ? value : 0;
        const sign = amount < 0 ? '-' : '';

        return `${sign}Rs. ${Math.abs(amount).toFixed(2)}`;
    };

    const selectCustomer = async (customer: Customer) => {
        setSelectedCustomer(customer);
        setData('customer_id', customer.AdrKy);
        setSearchTerm(customer.FstNm);
        setCustomerBalance(Number(customer.current_balance) || 0);
        setCustomers([]);

        try {
            const response = await fetch(route('inventory.customer-payments.customer-details') + `?customer_id=${customer.AdrKy}`);

            if (!response.ok) {
                return;
            }

            const details = await response.json();
            setCustomerBalance(Number(details.current_balance) || 0);
            setRecentPayments(details.recent_payments || []);
            setOutstandingInvoices(details.outstanding_invoices || []);
        } catch {
            // Keep balance from search payload if details request fails
        }
    };

    const handlePaymentMethodChange = (method: string) => {
        setData({
            ...data,
            payment_method: method,
            notes: '',
            selected_bank_id: undefined,
            cheque_no: '',
            cheque_bank_name: '',
            cheque_branch: '',
            cheque_date: '',
            cheque_account_no: '',
            bank_name: '',
            bank_reference_no: '',
            bank_branch: '',
            bank_deposit_date: '',
            bank_account_no: '',
            transfer_reference_no: '',
            transfer_transaction_id: '',
            transfer_bank_name: '',
            transfer_branch: '',
            transfer_date: '',
        });
        setSelectedBank(null);
    };

    const handleBankSelection = (bankId: string) => {
        const bank = (bankAccounts as BankAccount[]).find((account) => account.id === Number(bankId));
        setSelectedBank(bank || null);
        setData('selected_bank_id', Number(bankId));
    };

    useEffect(() => {
        if (flash?.success) {
            showToast(flash.success, 'success');
        }
    }, [flash?.success]);

    const handleInvoicePayAmount = (invoiceId: number, value: string, maxAmount: number) => {
        const parsed = Math.min(Math.max(0, parseFloat(value) || 0), maxAmount);
        const updated = { ...invoicePayAmounts, [invoiceId]: value === '' ? '' : String(parsed) };
        setInvoicePayAmounts(updated);
        const total = Object.values(updated).reduce((sum, v) => sum + (parseFloat(v) || 0), 0);
        setData('paid_amount', Math.round(total * 100) / 100);
    };

    const resetForm = () => {
        setSelectedCustomer(null);
        setCustomerBalance(0);
        setRecentPayments([]);
        setOutstandingInvoices([]);
        setInvoicePayAmounts({});
        setSearchTerm('');
        setCustomers([]);
        setSelectedBank(null);
        reset();
    };

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();

        const allocations = Object.entries(invoicePayAmounts)
            .filter(([, v]) => parseFloat(v) > 0)
            .map(([id, v]) => ({ sale_id: Number(id), amount: parseFloat(v) }));

        if (allocations.length > 0) {
            setData('invoice_payments', JSON.stringify(allocations));
        }

        post(route('inventory.customer-payments.store'), {
            onSuccess: () => {
                resetForm();
            },
        });
    };

    const paymentMethods = [
        { value: 'Cash', label: 'Cash', icon: DollarSign },
        { value: 'Cheque', label: 'Cheque', icon: Receipt },
        { value: 'Bank', label: 'Bank Deposit', icon: CreditCard },
        { value: 'Online Transfer', label: 'Online Transfer', icon: CreditCard },
    ];

    return (
        <PageTemplate
            title="Customer Payments"
            description="Record and manage customer payments"
            url="/inventory/customer-payments"
            breadcrumbs={[
                { title: 'Inventory', href: route('inventory.dashboard') },
                { title: 'Customer Payments' },
            ]}
        >
            <div className="flex flex-col gap-6">
                    <div>
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <Search className="mr-2 h-5 w-5" />
                                    Select Customer
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <Label htmlFor="customer-search">Search Customer</Label>
                                    <Input
                                        id="customer-search"
                                        type="text"
                                        placeholder="Search by name, code, phone, or email..."
                                        value={searchTerm}
                                        onChange={(event) => setSearchTerm(event.target.value)}
                                        className="mt-1"
                                    />
                                </div>

                                {customers.length > 0 && (
                                    <div className="max-h-48 overflow-y-auto rounded-md border">
                                        {customers.map((customer) => (
                                            <button
                                                key={customer.AdrKy}
                                                type="button"
                                                className="w-full cursor-pointer border-b p-3 text-left last:border-b-0 hover:bg-muted/50"
                                                onClick={() => selectCustomer(customer)}
                                            >
                                                <div className="font-medium">{customer.FstNm}</div>
                                                <div className="text-sm text-muted-foreground">{customer.AdrCd || '-'}</div>
                                                <div className="text-sm text-muted-foreground">{customer.TP1 || '-'}</div>
                                                <div className="mt-1 flex items-center justify-between text-sm">
                                                    <span className="font-medium">Current Balance</span>
                                                    <span className="font-semibold">{formatMoney(Number(customer.current_balance) || 0)}</span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {!selectedCustomer && customers.length === 0 && (
                                    <p className="rounded-lg border border-dashed p-3 text-center text-sm text-muted-foreground">
                                        Search and select a customer to view their current balance.
                                    </p>
                                )}

                                {selectedCustomer && (
                                    <div className="rounded-lg border bg-muted/40 p-4">
                                        <h3 className="font-semibold">{selectedCustomer.FstNm}</h3>
                                        <p className="text-sm text-muted-foreground">Code: {selectedCustomer.AdrCd || '-'}</p>
                                        <p className="text-sm text-muted-foreground">Phone: {selectedCustomer.TP1 || '-'}</p>
                                        <div className="mt-3 flex items-center justify-between rounded-md bg-background p-2">
                                            <span className="text-sm font-medium">Current Balance</span>
                                            <Badge variant={customerBalance > 0 ? 'destructive' : customerBalance < 0 ? 'outline' : 'secondary'} className="font-bold">
                                                {formatMoney(customerBalance)}
                                            </Badge>
                                        </div>
                                    </div>
                                )}

                                {recentPayments.length > 0 && (
                                    <div className="space-y-2">
                                        <h4 className="text-sm font-semibold">Recent Payments</h4>
                                        {recentPayments.map((payment) => (
                                            <div key={payment.id} className="rounded-lg border p-2 text-sm">
                                                <div className="flex justify-between">
                                                    <span>{payment.payment_method}</span>
                                                    <span>Rs. {Number(payment.paid_amount).toFixed(2)}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {outstandingInvoices.length > 0 && (
                                    <div className="space-y-2">
                                        <h4 className="text-sm font-semibold">Outstanding Invoices</h4>
                                        <div className="overflow-x-auto rounded-md border">
                                            <table className="w-full text-xs">
                                                <thead>
                                                    <tr className="border-b bg-muted/50">
                                                        <th className="px-2 py-2 text-left font-medium">Invoice</th>
                                                        <th className="px-2 py-2 text-left font-medium">Date</th>
                                                        <th className="px-2 py-2 text-right font-medium">Total</th>
                                                        <th className="px-2 py-2 text-right font-medium">Outstanding</th>
                                                        <th className="px-2 py-2 text-right font-medium">Pay Amount</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {outstandingInvoices.map((invoice) => (
                                                        <tr key={invoice.id} className="border-b last:border-b-0 hover:bg-muted/30">
                                                            <td className="px-2 py-2 font-medium">{invoice.sale_no}</td>
                                                            <td className="px-2 py-2 text-muted-foreground">{new Date(invoice.sale_date).toLocaleDateString()}</td>
                                                            <td className="px-2 py-2 text-right">{formatMoney(Number(invoice.total_amount))}</td>
                                                            <td className="px-2 py-2 text-right font-semibold text-destructive">{formatMoney(Number(invoice.balance_amount))}</td>
                                                            <td className="px-2 py-2 text-right">
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    step="0.01"
                                                                    max={Number(invoice.balance_amount)}
                                                                    value={invoicePayAmounts[invoice.id] ?? ''}
                                                                    onChange={(e) => handleInvoicePayAmount(invoice.id, e.target.value, Number(invoice.balance_amount))}
                                                                    placeholder="0.00"
                                                                    className="w-24 rounded border px-2 py-1 text-right text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                                                                />
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    <div>
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <CreditCard className="h-5 w-5" />
                                    {selectedCustomer ? `Record Payment for ${selectedCustomer.FstNm}` : 'Record Payment'}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {!selectedCustomer && (
                                    <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30">
                                        <div className="flex items-start gap-3">
                                            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
                                            <div>
                                                <h4 className="font-semibold text-amber-900 dark:text-amber-200">Customer Required</h4>
                                                <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">Please select a customer from the left panel before recording a payment.</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div>
                                        <Label className="text-base font-medium">Payment Method</Label>
                                        <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
                                            {paymentMethods.map(({ value, label, icon: Icon }) => (
                                                <button
                                                    key={value}
                                                    type="button"
                                                    onClick={() => handlePaymentMethodChange(value)}
                                                    className={`flex flex-col items-center rounded-lg border p-4 text-center transition-colors ${
                                                        data.payment_method === value
                                                            ? 'border-primary bg-primary/10 text-primary'
                                                            : 'border-border hover:border-primary/50 hover:bg-muted/50'
                                                    }`}
                                                >
                                                    <Icon className="mb-2 h-6 w-6" />
                                                    <div className="text-sm font-medium">{label}</div>
                                                </button>
                                            ))}
                                        </div>
                                        {errors.payment_method && <p className="mt-1 text-sm text-destructive">{errors.payment_method}</p>}
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor="paid_amount">Amount (Rs.)</Label>
                                            <Input
                                                id="paid_amount"
                                                type="number"
                                                step="0.01"
                                                value={data.paid_amount}
                                                onChange={(event) => setData('paid_amount', Number.parseFloat(event.target.value) || 0)}
                                                className="mt-1"
                                                required
                                            />
                                            {errors.paid_amount && <p className="mt-1 text-sm text-destructive">{errors.paid_amount}</p>}
                                        </div>
                                        <div>
                                            <Label htmlFor="payment_date">Payment Date</Label>
                                            <Input
                                                id="payment_date"
                                                type="date"
                                                value={data.payment_date}
                                                onChange={(event) => setData('payment_date', event.target.value)}
                                                className="mt-1"
                                                required
                                            />
                                            {errors.payment_date && <p className="mt-1 text-sm text-destructive">{errors.payment_date}</p>}
                                        </div>
                                    </div>

                                    {(data.payment_method === 'Cheque' || data.payment_method === 'Bank' || data.payment_method === 'Online Transfer') && (
                                        <div>
                                            <Label className="text-base font-medium">Select Bank Account</Label>
                                            <Select onValueChange={handleBankSelection}>
                                                <SelectTrigger className="mt-1">
                                                    <SelectValue placeholder="Choose a bank account" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {(bankAccounts as BankAccount[]).map((bank) => (
                                                        <SelectItem key={bank.id} value={bank.id.toString()}>
                                                        {bank.name}{bank.bank_account_no ? ` (${bank.bank_account_no})` : ''}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}

                                    {data.payment_method === 'Cheque' && (
                                        <div className="space-y-4 rounded-lg border p-4">
                                            <h3 className="font-semibold">Cheque Details</h3>
                                            <div className="grid grid-cols-2 gap-4">
                                                <Input placeholder="Cheque Number" value={data.cheque_no} onChange={(event) => setData('cheque_no', event.target.value)} />
                                                <Input type="date" value={data.cheque_date} onChange={(event) => setData('cheque_date', event.target.value)} />
                                            <Input placeholder="Bank Name" value={selectedBank ? selectedBank.name : data.cheque_bank_name} onChange={(event) => setData('cheque_bank_name', event.target.value)} readOnly={!!selectedBank} />
                                            <Input placeholder="Account Number" value={selectedBank ? (selectedBank.bank_account_no ?? '') : data.cheque_account_no} onChange={(event) => setData('cheque_account_no', event.target.value)} readOnly={!!selectedBank} />
                                            <Input placeholder="Branch" value={selectedBank ? (selectedBank.bank_branch ?? '') : data.cheque_branch} onChange={(event) => setData('cheque_branch', event.target.value)} readOnly={!!selectedBank} />
                                            </div>
                                        </div>
                                    )}

                                    {data.payment_method === 'Bank' && (
                                        <div className="space-y-4 rounded-lg border p-4">
                                            <h3 className="font-semibold">Bank Deposit Details</h3>
                                            <div className="grid grid-cols-2 gap-4">
                                                <Input placeholder="Bank Name" value={selectedBank ? selectedBank.name : data.bank_name} onChange={(event) => setData('bank_name', event.target.value)} readOnly={!!selectedBank} />
                                                <Input placeholder="Reference No" value={data.bank_reference_no} onChange={(event) => setData('bank_reference_no', event.target.value)} />
                                                <Input type="date" value={data.bank_deposit_date} onChange={(event) => setData('bank_deposit_date', event.target.value)} />
                                                <Input placeholder="Branch" value={selectedBank ? (selectedBank.bank_branch ?? '') : data.bank_branch} onChange={(event) => setData('bank_branch', event.target.value)} readOnly={!!selectedBank} />
                                                <Input placeholder="Account Number" value={selectedBank ? (selectedBank.bank_account_no ?? '') : data.bank_account_no} onChange={(event) => setData('bank_account_no', event.target.value)} readOnly={!!selectedBank} />
                                            </div>
                                        </div>
                                    )}

                                    {data.payment_method === 'Online Transfer' && (
                                        <div className="space-y-4 rounded-lg border p-4">
                                            <h3 className="font-semibold">Online Transfer Details</h3>
                                            <div className="grid grid-cols-2 gap-4">
                                                <Input placeholder="Reference Number" value={data.transfer_reference_no} onChange={(event) => setData('transfer_reference_no', event.target.value)} />
                                                <Input placeholder="Transaction ID" value={data.transfer_transaction_id} onChange={(event) => setData('transfer_transaction_id', event.target.value)} />
                                                <Input type="date" value={data.transfer_date} onChange={(event) => setData('transfer_date', event.target.value)} />
                                            <Input placeholder="Bank Name" value={selectedBank ? selectedBank.name : data.transfer_bank_name} onChange={(event) => setData('transfer_bank_name', event.target.value)} readOnly={!!selectedBank} />
                                            <Input placeholder="Branch" value={selectedBank ? (selectedBank.bank_branch ?? '') : data.transfer_branch} onChange={(event) => setData('transfer_branch', event.target.value)} readOnly={!!selectedBank} />
                                            </div>
                                        </div>
                                    )}

                                    <div>
                                        <Label htmlFor="notes">Description (Optional)</Label>
                                        <Textarea
                                            id="notes"
                                            value={data.notes}
                                            onChange={(event) => setData('notes', event.target.value)}
                                            placeholder="Enter payment description..."
                                            className="mt-1"
                                            rows={3}
                                        />
                                    </div>

                                    <div className="flex justify-end gap-3 border-t pt-4">
                                        <Button type="button" variant="outline" onClick={resetForm} disabled={processing}>
                                            Cancel
                                        </Button>
                                        <Button
                                            type="submit"
                                            disabled={processing || !data.payment_method || !selectedCustomer}
                                        >
                                            {processing ? 'Recording...' : 'Record Payment'}
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
            </div>
        </PageTemplate>
    );
}
