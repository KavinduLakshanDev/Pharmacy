import React, { useEffect, useState } from 'react';
import { useForm, usePage } from '@inertiajs/react';
import type { FormDataConvertible } from '@inertiajs/core';
import { AlertCircle, Building2, CreditCard, DollarSign, Receipt, Search } from 'lucide-react';
import { PageTemplate } from '@/components/page-template';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { showToast } from '@/components/ui/toast-notification';
import { Textarea } from '@/components/ui/textarea';

interface Supplier {
    AdrKy: number;
    AdrCd: string | null;
    FstNm: string;
    LstNm: string | null;
    TP1: string | null;
    Address: string | null;
}

interface BankAccount {
    id: number;
    name: string;
    bank_account_no: string | null;
    bank_branch: string | null;
}

interface PaymentData {
    [key: string]: FormDataConvertible;
    supplier_id: number;
    payment_method: string;
    paid_amount: number;
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

export default function SupplierPaymentsIndex() {
    const { flash, bankAccounts } = usePage().props as any;
    const [searchTerm, setSearchTerm] = useState('');
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
    const [supplierBalance, setSupplierBalance] = useState(0);
    const [recentPayments, setRecentPayments] = useState<any[]>([]);
    const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
    const [selectedBank, setSelectedBank] = useState<BankAccount | null>(null);

    const { data, setData, post, processing, errors, reset } = useForm<PaymentData>({
        supplier_id: 0,
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
        if (flash?.success) {
            showToast(flash.success, 'success');
        }
    }, [flash?.success]);

    useEffect(() => {
        if (searchTimeout) {
            clearTimeout(searchTimeout);
        }

        if (searchTerm.length >= 2) {
            const timeout = setTimeout(() => {
                searchSuppliers(searchTerm);
            }, 300);
            setSearchTimeout(timeout);
        } else {
            setSuppliers([]);
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

    const searchSuppliers = async (query: string) => {
        const response = await fetch(route('inventory.supplier-payments.search-suppliers') + `?search=${encodeURIComponent(query)}`);
        const results = await response.json();
        setSuppliers(results);
    };

    const formatMoney = (value: number) => {
        const amount = Number.isFinite(value) ? value : 0;
        const sign = amount < 0 ? '-' : '';

        return `${sign}Rs. ${Math.abs(amount).toFixed(2)}`;
    };

    const selectSupplier = async (supplier: Supplier) => {
        setSelectedSupplier(supplier);
        setData('supplier_id', supplier.AdrKy);
        setSearchTerm(supplier.FstNm);
        setSupplierBalance(0);
        setSuppliers([]);

        try {
            const response = await fetch(route('inventory.supplier-payments.supplier-details') + `?supplier_id=${supplier.AdrKy}`);

            if (!response.ok) {
                return;
            }

            const details = await response.json();
            setSupplierBalance(Number(details.current_balance) || 0);
            setRecentPayments(details.recent_payments || []);
        } catch {
            // Keep default balance if details request fails
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

    const resetForm = () => {
        setSelectedSupplier(null);
        setSupplierBalance(0);
        setRecentPayments([]);
        setSearchTerm('');
        setSuppliers([]);
        setSelectedBank(null);
        reset();
    };

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();

        post(route('inventory.supplier-payments.store'), {
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
            title="Supplier Payments"
            description="Record and manage supplier payments"
            url="/inventory/supplier-payments"
            breadcrumbs={[
                { title: 'Inventory', href: route('inventory.dashboard') },
                { title: 'Supplier Payments' },
            ]}
        >
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="lg:col-span-1">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Search className="h-5 w-5" />
                                Select Supplier
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label htmlFor="supplier-search">Search Supplier</Label>
                                <Input
                                    id="supplier-search"
                                    type="text"
                                    placeholder="Search by name, phone, or email..."
                                    value={searchTerm}
                                    onChange={(event) => setSearchTerm(event.target.value)}
                                    className="mt-1"
                                />
                            </div>

                            {suppliers.length > 0 && (
                                <div className="max-h-48 overflow-y-auto rounded-md border">
                                    {suppliers.map((supplier) => (
                                        <button
                                            key={supplier.AdrKy}
                                            type="button"
                                            className="w-full cursor-pointer border-b p-3 text-left last:border-b-0 hover:bg-muted/50"
                                            onClick={() => selectSupplier(supplier)}
                                        >
                                            <div className="font-medium">{supplier.FstNm}</div>
                                            {supplier.LstNm && <div className="text-sm text-muted-foreground">{supplier.LstNm}</div>}
                                            <div className="text-sm text-muted-foreground">{supplier.TP1 || '-'}</div>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {!selectedSupplier && suppliers.length === 0 && (
                                <p className="rounded-lg border border-dashed p-3 text-center text-sm text-muted-foreground">
                                    Search and select a supplier to view their outstanding balance.
                                </p>
                            )}

                            {selectedSupplier && (
                                <div className="rounded-lg border bg-muted/40 p-4">
                                    <div className="flex items-center gap-2">
                                        <Building2 className="h-4 w-4 text-muted-foreground" />
                                        <h3 className="font-semibold">{selectedSupplier.FstNm}</h3>
                                    </div>
                                    {selectedSupplier.LstNm && (
                                        <p className="mt-1 text-sm text-muted-foreground">Contact: {selectedSupplier.LstNm}</p>
                                    )}
                                    <p className="text-sm text-muted-foreground">Phone: {selectedSupplier.TP1 || '-'}</p>
                                    <div className="mt-3 flex items-center justify-between rounded-md bg-background p-2">
                                        <span className="text-sm font-medium">Outstanding Balance</span>
                                        <Badge variant={supplierBalance > 0 ? 'destructive' : supplierBalance < 0 ? 'outline' : 'secondary'} className="font-bold">
                                            {formatMoney(supplierBalance)}
                                        </Badge>
                                    </div>
                                </div>
                            )}

                            {recentPayments.length > 0 && (
                                <div className="space-y-2">
                                    <h4 className="text-sm font-semibold">Recent Payments</h4>
                                    {recentPayments.map((payment) => (
                                        <div key={payment.id} className="rounded-md border p-2 text-sm">
                                            <div className="flex justify-between">
                                                <span>{payment.payment_method}</span>
                                                <span>Rs. {Number(payment.paid_amount).toFixed(2)}</span>
                                            </div>
                                            <div className="text-xs text-muted-foreground">{payment.payment_date}</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CreditCard className="h-5 w-5" />
                                {selectedSupplier ? `Record Payment for ${selectedSupplier.FstNm}` : 'Record Payment'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {!selectedSupplier && (
                                <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30">
                                    <div className="flex items-start gap-3">
                                        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
                                        <div>
                                            <h4 className="font-semibold text-amber-900 dark:text-amber-200">Supplier Required</h4>
                                            <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">Please select a supplier from the left panel before recording a payment.</p>
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
                                        <Label>Select Bank Account</Label>
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
                                        disabled={processing || !data.payment_method || !selectedSupplier}
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
