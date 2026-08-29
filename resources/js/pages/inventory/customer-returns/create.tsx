import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageTemplate } from '@/components/page-template';
import { BatchSelectionModal } from '@/components/BatchSelectionModal';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { FormDataConvertible } from '@inertiajs/core';
import { useForm, usePage } from '@inertiajs/react';
import { CheckCircle, ChevronDown, CreditCard, LoaderCircle, Search, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

/** Sale invoices recorded as customer returns in this browser — second returns are blocked (see sale-return guard). */
const CUSTOMER_RETURN_RECORDED_SALES_STORAGE_KEY = 'unitec_pharmacy_customer_return_sale_ids_v1';

function readRecordedCustomerReturnSaleIds(): number[] {
    if (typeof window === 'undefined') {
        return [];
    }

    try {
        const raw = window.localStorage.getItem(CUSTOMER_RETURN_RECORDED_SALES_STORAGE_KEY);
        if (!raw) {
            return [];
        }

        const parsed = JSON.parse(raw) as unknown;
        if (!Array.isArray(parsed)) {
            return [];
        }

        return parsed
            .map((id) => (typeof id === 'number' ? id : Number(id)))
            .filter((id) => Number.isFinite(id) && id > 0);
    } catch {
        return [];
    }
}

function persistRecordedCustomerReturnSaleId(saleId: number): void {
    if (typeof window === 'undefined') {
        return;
    }

    const set = new Set(readRecordedCustomerReturnSaleIds());
    set.add(saleId);
    window.localStorage.setItem(CUSTOMER_RETURN_RECORDED_SALES_STORAGE_KEY, JSON.stringify([...set]));
}

function saleHasRecordedCustomerReturnInBrowser(saleId: number): boolean {
    return readRecordedCustomerReturnSaleIds().includes(saleId);
}

interface Branch {
    id: number;
    name: string;
}

interface CustomerOption {
    AdrKy: number;
    AdrCd: string;
    FstNm: string;
    LstNm: string;
    TP1: string;
    Address: string;
}

interface SaleOption {
    id: number;
    sale_no: string;
    sale_date: string | null;
    total_amount: number;
    customer_id: number | null;
}

interface SaleLineItem {
    sale_item_id: number;
    product_id: number;
    product_name: string;
    quantity: number;
    available_stock: number;
    available_units: number;
    pack_size: number | null;
    unit_cost_price: number;
    unit_stock: number;
    unit_price: number;
    total_price: number;
    batch_no: string | null;
    expiry_date: string | null;
    return_quantity: number;
    selected_for_return: boolean;
}

interface CustomerReturnProductInput {
    sales_transaction_item_id: number | null;
    product_id: number;
    quantity: number;
    return_quantity: number;
    unit_price: number;
    batch_no: string | null;
    expiry_date: string | null;
}

interface AdditionalLineBatch {
    batch_no: string;
    balance: number;
    unit_sales_price: number | null;
    expiry_date: string | null;
}

interface AdditionalProductBatchesResponse {
    id: number;
    name: string;
    sku: string | null;
    barcode: string | null;
    unit_price: number;
    batches: AdditionalLineBatch[];
}

type ProductWithBatchesForModal = AdditionalProductBatchesResponse & { price: number };

interface AdditionalMedicationRow {
    key: string;
    product_id: number;
    product_name: string;
    quantity: number;
    unit_price: number;
    batch_no: string | null;
    expiry_date: string | null;
    /** Sales units available on selected batch; null when unbatched or unknown */
    max_batch_balance: number | null;
}

interface ProductSearchOption {
    id: number;
    name: string;
    sku: string | null;
    unit_price: number;
}

function buildProductPayloads(items: SaleLineItem[]): CustomerReturnProductInput[] {
    return items
        .filter((item) => item.selected_for_return && item.return_quantity > 0)
        .map((item) => {
            const quantity = item.pack_size ? item.return_quantity / item.pack_size : item.return_quantity;
            const unit_price = item.pack_size ? item.unit_cost_price * item.pack_size : item.unit_cost_price;

            return {
                sales_transaction_item_id: item.sale_item_id,
                product_id: item.product_id,
                quantity,
                return_quantity: item.return_quantity,
                unit_price,
                batch_no: item.batch_no,
                expiry_date: item.expiry_date,
            };
        });
}

function additionalsToPayloads(rows: AdditionalMedicationRow[]): CustomerReturnProductInput[] {
    return rows
        .filter((line) => line.quantity > 0 && line.product_id > 0)
        .map((line) => ({
            sales_transaction_item_id: null,
            product_id: line.product_id,
            quantity: line.quantity,
            return_quantity: line.quantity,
            unit_price: line.unit_price,
            batch_no: line.batch_no,
            expiry_date: line.expiry_date,
        }));
}

interface FinanceBankAccount {
    id: number;
    name: string;
    bank_branch: string | null;
    bank_account_no: string | null;
}

type SettlementPaymentMode = 'cash' | 'credit' | 'card' | 'cheque' | 'bank_transfer' | 'split';

function newRowKey(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }

    return `row-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export default function CustomerReturnsCreatePage() {
    const { flash } = usePage<{
        flash?: { success?: string };
        branches?: Branch[];
        financeBankAccounts?: FinanceBankAccount[];
    }>().props;
    const { branches = [], financeBankAccounts = [] } = usePage<{
        branches: Branch[];
        financeBankAccounts: FinanceBankAccount[];
    }>().props;
    const { t: translate } = useTranslation();
    const [customerSearchTerm, setCustomerSearchTerm] = useState('');
    const [customers, setCustomers] = useState<CustomerOption[]>([]);
    const [selectedCustomer, setSelectedCustomer] = useState<CustomerOption | null>(null);
    const [invoiceQuery, setInvoiceQuery] = useState('');
    const [saleMatches, setSaleMatches] = useState<SaleOption[]>([]);
    const [invoiceSearchLoading, setInvoiceSearchLoading] = useState(false);
    const [saleInvoicePickerOpen, setSaleInvoicePickerOpen] = useState(false);
    const saleInvoicePickerRef = useRef<HTMLDivElement | null>(null);
    const [lockedSaleChoice, setLockedSaleChoice] = useState<SaleOption | null>(null);
    const [selectedSaleId, setSelectedSaleId] = useState<number | null>(null);
    const [saleLineItems, setSaleLineItems] = useState<SaleLineItem[]>([]);
    const [additionalMedications, setAdditionalMedications] = useState<AdditionalMedicationRow[]>([]);
    const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);
    /** Branch on the locked sale invoice (used for stock scope when "All branches" is selected). */
    const [saleBranchId, setSaleBranchId] = useState<number | null>(null);
    const [productDraft, setProductDraft] = useState('');
    const [productMatches, setProductMatches] = useState<ProductSearchOption[]>([]);
    const [saleReturnBlocked, setSaleReturnBlocked] = useState(false);
    const [additionalBatchModalOpen, setAdditionalBatchModalOpen] = useState(false);
    const [additionalProductForBatch, setAdditionalProductForBatch] = useState<ProductWithBatchesForModal | null>(null);
    const [additionalProductLoadingId, setAdditionalProductLoadingId] = useState<number | null>(null);
    const [settlementPaymentMode, setSettlementPaymentMode] = useState<SettlementPaymentMode>('cash');
    const [settlementPaidDraft, setSettlementPaidDraft] = useState('');
    const customerSearchTimeout = useRef<number | null>(null);
    const productSearchTimeout = useRef<number | null>(null);

    const { data, setData, post, processing, reset } = useForm({
        customer_id: 0,
        sales_transaction_id: 0,
        branch_id: null as number | null,
        return_date: new Date().toISOString().split('T')[0],
        notes: '',
        products: [] as FormDataConvertible,
        settlement_payment_mode: 'cash',
        settlement_cash_amount: 0,
        settlement_bank_amount: 0,
        settlement_online_amount: 0,
        settlement_cheque_amount: 0,
        settlement_finance_account_id: null as number | null,
        settlement_cheque_no: '',
        settlement_cheque_date: '',
        settlement_cheque_bank_name: '',
        settlement_cheque_branch: '',
    });

    useEffect(() => {
        setData(
            'products',
            [...buildProductPayloads(saleLineItems), ...additionalsToPayloads(additionalMedications)] as unknown as FormDataConvertible,
        );
    }, [additionalMedications, saleLineItems, setData]);

    useEffect(() => {
        if (lockedSaleChoice) {
            return undefined;
        }

        const shouldFetch =
            saleInvoicePickerOpen || invoiceQuery.trim().length > 0;

        if (!shouldFetch) {
            setSaleMatches([]);
            setInvoiceSearchLoading(false);

            return undefined;
        }

        const timeout = window.setTimeout(() => {
            const params = new URLSearchParams();

            if (selectedBranchId !== null) {
                params.set('branch_id', String(selectedBranchId));
            }

            if (selectedCustomer) {
                params.set('customer_id', String(selectedCustomer.AdrKy));
            }

            const trimmedQuery = invoiceQuery.trim();
            if (trimmedQuery !== '') {
                params.set('search', trimmedQuery);
            }

            const suffix = params.toString() ? `?${params.toString()}` : '';

            setInvoiceSearchLoading(true);
            fetch(route('inventory.customer-returns.sales') + suffix)
                .then((response) => response.json())
                .then(setSaleMatches)
                .catch(console.error)
                .finally(() => setInvoiceSearchLoading(false));
        }, 300);

        return () => window.clearTimeout(timeout);
    }, [invoiceQuery, lockedSaleChoice, selectedBranchId, selectedCustomer, saleInvoicePickerOpen]);

    useEffect(() => {
        if (!saleInvoicePickerOpen) {
            return undefined;
        }

        const handlePointerDown = (event: MouseEvent | TouchEvent): void => {
            const node = saleInvoicePickerRef.current;
            if (node && !node.contains(event.target as Node)) {
                setSaleInvoicePickerOpen(false);
            }
        };

        document.addEventListener('mousedown', handlePointerDown);
        document.addEventListener('touchstart', handlePointerDown);

        return () => {
            document.removeEventListener('mousedown', handlePointerDown);
            document.removeEventListener('touchstart', handlePointerDown);
        };
    }, [saleInvoicePickerOpen]);

    useEffect(() => {
        if (customerSearchTimeout.current) {
            clearTimeout(customerSearchTimeout.current);
        }

        if (customerSearchTerm.length >= 2) {
            const timeout = window.setTimeout(() => {
                fetch(
                    `${route('inventory.customer-returns.search-customers')}?search=${encodeURIComponent(customerSearchTerm)}`,
                )
                    .then((response) => response.json())
                    .then(setCustomers)
                    .catch(console.error);
            }, 300);

            customerSearchTimeout.current = timeout;
        } else {
            setCustomers([]);
        }

        return () => {
            if (customerSearchTimeout.current) {
                clearTimeout(customerSearchTimeout.current);
            }
        };
    }, [customerSearchTerm]);

    useEffect(() => {
        if (productSearchTimeout.current) {
            window.clearTimeout(productSearchTimeout.current);
        }

        if (productDraft.trim().length < 2 || !lockedSaleChoice) {
            setProductMatches([]);

            return undefined;
        }

        const timer = window.setTimeout(() => {
            const params = new URLSearchParams();
            params.set('search', productDraft.trim());
            const branchForStock = selectedBranchId ?? saleBranchId;
            if (branchForStock !== null) {
                params.set('branch_id', String(branchForStock));
            }

            fetch(`${route('inventory.customer-returns.search-products')}?${params.toString()}`)
                .then((response) => response.json())
                .then(setProductMatches)
                .catch(console.error);
        }, 300);

        productSearchTimeout.current = timer;

        return () => window.clearTimeout(timer);
    }, [productDraft, lockedSaleChoice, saleBranchId, selectedBranchId]);

    const resetInvoiceChoice = (): void => {
        setInvoiceQuery('');
        setLockedSaleChoice(null);
        setSaleInvoicePickerOpen(false);
        setSelectedSaleId(null);
        setSaleMatches([]);
        setInvoiceSearchLoading(false);
        setSaleLineItems([]);
        setAdditionalMedications([]);
        setProductDraft('');
        setProductMatches([]);
        setSaleBranchId(null);
        setSaleReturnBlocked(false);
        setData('sales_transaction_id', 0);
        setData('products', []);
    };

    const selectSaleFromSearch = (option: SaleOption): void => {
        setLockedSaleChoice(option);
        setSaleInvoicePickerOpen(false);
        setSaleMatches([]);
        fetchSaleDetails(option.id);
    };

    const selectCustomer = (customer: CustomerOption) => {
        setSelectedCustomer(customer);
        setCustomerSearchTerm(customer.FstNm);
        setCustomers([]);
        resetInvoiceChoice();
        setData('customer_id', customer.AdrKy);
    };

    const fetchSaleDetails = (saleId: number): void => {
        setSelectedSaleId(saleId);
        setData('sales_transaction_id', saleId);
        setAdditionalMedications([]);
        setProductDraft('');
        setProductMatches([]);
        setSaleBranchId(null);
        setSaleReturnBlocked(false);

        if (saleHasRecordedCustomerReturnInBrowser(saleId)) {
            setSaleReturnBlocked(true);
            setSaleLineItems([]);

            return;
        }

        const urlSuffix = selectedBranchId ? `?branch_id=${selectedBranchId}` : '';
        fetch(route('inventory.customer-returns.sale-details', saleId) + urlSuffix)
            .then((response) => response.json())
            .then((result) => {
                const branchRaw = result?.sale?.branch_id;
                setSaleBranchId(typeof branchRaw === 'number' ? branchRaw : branchRaw != null ? Number(branchRaw) : null);

                const items = result.items.map((item: Omit<SaleLineItem, 'return_quantity' | 'selected_for_return'>) => ({
                    ...item,
                    quantity: Number(item.quantity) || 0,
                    available_stock: Number(item.available_stock) || 0,
                    available_units: Number(item.available_units) || 0,
                    pack_size: item.pack_size ? Number(item.pack_size) : null,
                    unit_cost_price: Number(item.unit_cost_price) || 0,
                    unit_stock: Number(item.unit_stock ?? item.available_units) || 0,
                    unit_price: Number(item.unit_price) || 0,
                    total_price: Number(item.total_price) || 0,
                    return_quantity: 0,
                    selected_for_return: false,
                }));

                setSaleLineItems(items);
            })
            .catch(console.error);
    };

    const handleReturnQuantityChange = (saleItemId: number, value: string) => {
        if (saleReturnBlocked) {
            return;
        }

        const newQuantity = Number(value);
        const updatedItems = saleLineItems.map((item) => {
            if (item.sale_item_id !== saleItemId) {
                return item;
            }

            if (!item.selected_for_return) {
                return item;
            }

            const maxAllowedUnits = item.available_units;
            const sanitizedQuantity = Number.isNaN(newQuantity)
                ? 0
                : Math.max(0, Math.min(newQuantity, maxAllowedUnits));

            return { ...item, return_quantity: sanitizedQuantity };
        });

        setSaleLineItems(updatedItems);
    };

    const toggleMedicationForReturn = (saleItemId: number, included: boolean): void => {
        if (saleReturnBlocked) {
            return;
        }

        const updatedItems = saleLineItems.map((item) =>
            item.sale_item_id === saleItemId
                ? { ...item, selected_for_return: included, return_quantity: included ? item.return_quantity : 0 }
                : item,
        );

        setSaleLineItems(updatedItems);
    };

    const appendAdditionalMedication = (partial: Omit<AdditionalMedicationRow, 'key'>): void => {
        setAdditionalMedications((prev) => [...prev, { ...partial, key: newRowKey() }]);
    };

    const handleSelectAdditionalProductFromSearch = (productOption: ProductSearchOption): void => {
        if (saleReturnBlocked) {
            return;
        }

        const branchForStock = selectedBranchId ?? saleBranchId;

        const clearProductSearch = (): void => {
            setProductDraft('');
            setProductMatches([]);
        };

        const addWithoutBatch = (): void => {
            appendAdditionalMedication({
                product_id: productOption.id,
                product_name: productOption.name,
                quantity: 1,
                unit_price: productOption.unit_price,
                batch_no: null,
                expiry_date: null,
                max_batch_balance: null,
            });
            clearProductSearch();
        };

        if (branchForStock === null) {
            addWithoutBatch();

            return;
        }

        setAdditionalProductLoadingId(productOption.id);
        const params = new URLSearchParams({
            product_id: String(productOption.id),
            branch_id: String(branchForStock),
        });

        fetch(`${route('inventory.customer-returns.additional-product-batches')}?${params.toString()}`)
            .then(async (response) => {
                if (!response.ok) {
                    throw new Error('batch fetch failed');
                }

                return response.json() as Promise<AdditionalProductBatchesResponse>;
            })
            .then((data) => {
                const forModal: ProductWithBatchesForModal = { ...data, price: data.unit_price };

                if (data.batches.length === 1) {
                    const b = data.batches[0];
                    appendAdditionalMedication({
                        product_id: data.id,
                        product_name: data.name,
                        quantity: 1,
                        unit_price: b.unit_sales_price ?? data.unit_price,
                        batch_no: b.batch_no,
                        expiry_date: b.expiry_date,
                        max_batch_balance: b.balance,
                    });
                    clearProductSearch();
                } else if (data.batches.length > 1) {
                    setAdditionalProductForBatch(forModal);
                    setAdditionalBatchModalOpen(true);
                    clearProductSearch();
                } else {
                    appendAdditionalMedication({
                        product_id: data.id,
                        product_name: data.name,
                        quantity: 1,
                        unit_price: data.unit_price,
                        batch_no: null,
                        expiry_date: null,
                        max_batch_balance: null,
                    });
                    clearProductSearch();
                }
            })
            .catch(() => {
                addWithoutBatch();
            })
            .finally(() => {
                setAdditionalProductLoadingId(null);
            });
    };

    const handleAdditionalBatchSelected = (batch: AdditionalLineBatch): void => {
        if (!additionalProductForBatch) {
            return;
        }

        const data = additionalProductForBatch;
        appendAdditionalMedication({
            product_id: data.id,
            product_name: data.name,
            quantity: 1,
            unit_price: batch.unit_sales_price ?? data.unit_price,
            batch_no: batch.batch_no,
            expiry_date: batch.expiry_date,
            max_batch_balance: batch.balance,
        });
        setAdditionalBatchModalOpen(false);
        setAdditionalProductForBatch(null);
    };

    const updateAdditionalRow = (
        rowKey: string,
        updater: Partial<Pick<AdditionalMedicationRow, 'quantity' | 'unit_price'>>,
    ): void => {
        setAdditionalMedications((prev) =>
            prev.map((row) => {
                if (row.key !== rowKey) {
                    return row;
                }

                const merged = { ...row, ...updater };
                if (typeof merged.quantity === 'number' && merged.max_batch_balance !== null) {
                    merged.quantity = Math.min(merged.quantity, merged.max_batch_balance);
                }

                return merged;
            }),
        );
    };

    const removeAdditionalRow = (rowKey: string): void => {
        setAdditionalMedications((prev) => prev.filter((row) => row.key !== rowKey));
    };

    const handleInvoiceFieldChange = (value: string): void => {
        if (lockedSaleChoice) {
            resetInvoiceChoice();
            setInvoiceQuery(value);
            setSaleInvoicePickerOpen(true);

            return;
        }

        setInvoiceQuery(value);
        if (value.trim().length > 0) {
            setSaleInvoicePickerOpen(true);
        }
    };

    const productBatchLineCounts = useMemo(() => {
        const m = new Map<number, number>();
        for (const item of saleLineItems) {
            m.set(item.product_id, (m.get(item.product_id) ?? 0) + 1);
        }

        return m;
    }, [saleLineItems]);

    const handleSubmit = (event: FormEvent) => {
        event.preventDefault();
        const saleIdRecorded = selectedSaleId;
        post(route('inventory.customer-returns.store'), {
            preserveScroll: true,
            onSuccess: () => {
                if (saleIdRecorded !== null) {
                    persistRecordedCustomerReturnSaleId(saleIdRecorded);
                }
                setSelectedCustomer(null);
                resetInvoiceChoice();
                setSelectedBranchId(null);
                setCustomerSearchTerm('');
                reset();
            },
        });
    };

    const invoiceLineHasSelection = saleLineItems.some((item) => item.selected_for_return);

    const invoiceLinesSubtotal = saleLineItems.reduce(
        (sum, item) => (item.selected_for_return ? sum + item.return_quantity * item.unit_cost_price : sum),
        0,
    );

    const additionalLinesSubtotal = additionalMedications.reduce((sum, line) => sum + line.quantity * line.unit_price, 0);

    const extraPaymentDue = Math.max(0, additionalLinesSubtotal - invoiceLinesSubtotal);

    const creditAfterExchange = Math.max(0, invoiceLinesSubtotal - additionalLinesSubtotal);

    const grossInboundStockValue = invoiceLinesSubtotal + additionalLinesSubtotal;

    const hasInboundSettlement = extraPaymentDue >= 0.005;

    const settlementSum = useMemo(() => {
        const cash = Number(data.settlement_cash_amount) || 0;
        const bank = Number(data.settlement_bank_amount) || 0;
        const online = Number(data.settlement_online_amount) || 0;
        const cheque = Number(data.settlement_cheque_amount) || 0;

        return Math.round((cash + bank + online + cheque) * 100) / 100;
    }, [
        data.settlement_bank_amount,
        data.settlement_cash_amount,
        data.settlement_cheque_amount,
        data.settlement_online_amount,
    ]);

    const settlementAllocationsValid = useMemo(() => {
        if (!hasInboundSettlement) {
            return true;
        }
        if (settlementSum < 0.01) {
            return false;
        }
        if (settlementPaymentMode === 'credit') {
            return settlementSum <= extraPaymentDue + 0.02;
        }

        return Math.abs(settlementSum - extraPaymentDue) <= 0.02;
    }, [extraPaymentDue, hasInboundSettlement, settlementPaymentMode, settlementSum]);

    const settlementNeedsFinanceAccount = useMemo(() => {
        if (!hasInboundSettlement) {
            return false;
        }
        const bankAmt = Number(data.settlement_bank_amount) || 0;
        const onlineAmt = Number(data.settlement_online_amount) || 0;
        if (settlementPaymentMode === 'split') {
            return (bankAmt >= 0.005 || onlineAmt >= 0.005) && !data.settlement_finance_account_id;
        }

        return ['bank_transfer', 'card', 'credit'].includes(settlementPaymentMode) && !data.settlement_finance_account_id;
    }, [
        data.settlement_bank_amount,
        data.settlement_finance_account_id,
        data.settlement_online_amount,
        hasInboundSettlement,
        settlementPaymentMode,
    ]);

    const settlementNeedsChequeNo = useMemo(() => {
        if (!hasInboundSettlement) {
            return false;
        }
        const chequeAmt = Number(data.settlement_cheque_amount) || 0;
        if (chequeAmt < 0.005) {
            return false;
        }

        return String(data.settlement_cheque_no ?? '').trim() === '';
    }, [data.settlement_cheque_amount, data.settlement_cheque_no, hasInboundSettlement]);

    useEffect(() => {
        if (!hasInboundSettlement) {
            setSettlementPaidDraft('');
            setSettlementPaymentMode('cash');
            setData('settlement_cash_amount', 0);
            setData('settlement_bank_amount', 0);
            setData('settlement_online_amount', 0);
            setData('settlement_cheque_amount', 0);
            setData('settlement_finance_account_id', null);
            setData('settlement_cheque_no', '');
            setData('settlement_cheque_date', '');
            setData('settlement_cheque_bank_name', '');
            setData('settlement_cheque_branch', '');

            return;
        }
        setSettlementPaidDraft((prev) => (prev === '' ? extraPaymentDue.toFixed(2) : prev));
    }, [extraPaymentDue, hasInboundSettlement, setData]);

    useEffect(() => {
        if (!hasInboundSettlement || settlementPaymentMode === 'split') {
            return;
        }
        const paid = Math.round((Number(settlementPaidDraft) || 0) * 100) / 100;
        setData('settlement_cash_amount', settlementPaymentMode === 'cash' ? paid : 0);
        setData('settlement_bank_amount', settlementPaymentMode === 'credit' || settlementPaymentMode === 'bank_transfer' ? paid : 0);
        setData('settlement_online_amount', settlementPaymentMode === 'card' ? paid : 0);
        setData('settlement_cheque_amount', settlementPaymentMode === 'cheque' ? paid : 0);
        setData('settlement_payment_mode', settlementPaymentMode);
    }, [hasInboundSettlement, settlementPaidDraft, settlementPaymentMode, setData]);

    useEffect(() => {
        if (!hasInboundSettlement) {
            return undefined;
        }
        const onKey = (e: KeyboardEvent): void => {
            if (e.key !== 'F1' && e.key !== 'F2' && e.key !== 'F3' && e.key !== 'F4' && e.key !== 'F5' && e.key !== 'F6') {
                return;
            }
            e.preventDefault();
            const map: Record<string, SettlementPaymentMode> = {
                F1: 'cash',
                F2: 'credit',
                F3: 'card',
                F4: 'cheque',
                F5: 'bank_transfer',
                F6: 'split',
            };
            const mode = map[e.key];
            if (mode) {
                setSettlementPaymentMode(mode);
            }
        };
        window.addEventListener('keydown', onKey);

        return () => window.removeEventListener('keydown', onKey);
    }, [hasInboundSettlement]);

    const invoiceInputDisplay = lockedSaleChoice
        ? `${lockedSaleChoice.sale_no}${lockedSaleChoice.sale_date ? ` · ${lockedSaleChoice.sale_date}` : ''}`
        : invoiceQuery;

    const breadcrumbs = [
        { title: translate('Dashboard'), href: route('dashboard') },
        { title: translate('Inventory'), href: route('inventory.dashboard') },
        { title: translate('Customer Returns'), href: route('inventory.customer-returns.index') },
        { title: translate('Add Customer Return') },
    ];

    return (
        <PageTemplate
            title={translate('Add Customer Return')}
            description={translate(
                'Record medications returned by a customer against the sale invoice number. Each invoice line shows batch and expiry; the same product on several batches is listed on separate rows.',
            )}
            url="/inventory/customer-returns/create"
            breadcrumbs={breadcrumbs}
            noPadding
        >
            <div className="space-y-6">
                {flash?.success && (
                    <Alert className="rounded-lg border border-green-200 bg-green-50 text-green-800">
                        <CheckCircle className="mr-2 h-4 w-4" />
                        <AlertDescription>{flash.success}</AlertDescription>
                    </Alert>
                )}

                {lockedSaleChoice && saleReturnBlocked ? (
                    <Alert className="rounded-lg border border-amber-200 bg-amber-50 text-amber-950">
                        <AlertDescription>
                            {translate(
                                'A customer return was already recorded for this sale invoice in this browser. Starting another return for the same invoice is not allowed here. Use a different invoice or another workstation if a further return is required.',
                            )}
                        </AlertDescription>
                    </Alert>
                ) : null}

                <div className="grid gap-6 lg:grid-cols-[1px_1fr]">
                    <Card>
                        {/* <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Search className="h-4 w-4" />
                                {translate('Customer')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label htmlFor="customer-search">{translate('Search Customer')}</Label>
                                <Input
                                    id="customer-search"
                                    type="text"
                                    value={customerSearchTerm}
                                    onChange={(event) => setCustomerSearchTerm(event.target.value)}
                                    placeholder={translate('Enter customer name or code')}
                                    className="mt-1"
                                />
                            </div>

                            {customers.length > 0 && (
                                <div className="space-y-2 rounded-lg border border-gray-200 bg-white p-2 shadow-sm">
                                    {customers.map((customer) => (
                                        <button
                                            key={customer.AdrKy}
                                            type="button"
                                            className="w-full rounded-lg px-3 py-2 text-left hover:bg-gray-50"
                                            onClick={() => selectCustomer(customer)}
                                        >
                                            <div className="font-medium">{customer.FstNm}</div>
                                            <div className="text-xs text-gray-500">{customer.AdrCd}</div>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {selectedCustomer ? (
                                <div className="rounded-2xl border border-dashed border-gray-200 bg-slate-50 p-4">
                                    <div className="text-sm font-semibold text-slate-800">{selectedCustomer.FstNm}</div>
                                    <div className="text-sm text-slate-600">{selectedCustomer.AdrCd}</div>
                                    <div className="text-sm text-slate-500">{selectedCustomer.TP1}</div>
                                    <div className="mt-2 text-sm text-slate-500">{selectedCustomer.Address}</div>
                                </div>
                            ) : (
                                <p className="text-sm text-slate-500">{translate('Select the returning customer.')}</p>
                            )}
                        </CardContent> */}
                    </Card>

                    <form onSubmit={handleSubmit} className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Search className="h-4 w-4" />
                                {translate('Customer')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label htmlFor="customer-search">{translate('Search Customer')}</Label>
                                <Input
                                    id="customer-search"
                                    type="text"
                                    value={customerSearchTerm}
                                    onChange={(event) => setCustomerSearchTerm(event.target.value)}
                                    placeholder={translate('Enter customer name or code')}
                                    className="mt-1"
                                />
                            </div>

                            {customers.length > 0 && (
                                <div className="space-y-2 rounded-lg border border-gray-200 bg-white p-2 shadow-sm">
                                    {customers.map((customer) => (
                                        <button
                                            key={customer.AdrKy}
                                            type="button"
                                            className="w-full rounded-lg px-3 py-2 text-left hover:bg-gray-50"
                                            onClick={() => selectCustomer(customer)}
                                        >
                                            <div className="font-medium">{customer.FstNm}</div>
                                            <div className="text-xs text-gray-500">{customer.AdrCd}</div>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {selectedCustomer ? (
                                <div className="rounded-2xl border border-dashed border-gray-200 bg-slate-50 p-4">
                                    <div className="text-sm font-semibold text-slate-800">{selectedCustomer.FstNm}</div>
                                    <div className="text-sm text-slate-600">{selectedCustomer.AdrCd}</div>
                                    <div className="text-sm text-slate-500">{selectedCustomer.TP1}</div>
                                    <div className="mt-2 text-sm text-slate-500">{selectedCustomer.Address}</div>
                                </div>
                            ) : (
                                <p className="text-sm text-slate-500">{translate('Select the returning customer.')}</p>
                            )}
                        </CardContent>
                    </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">{translate('Invoice & Return Details')}</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div>
                                        <Label htmlFor="branch-select">{translate('Branch')}</Label>
                                        <Select
                                            value={selectedBranchId !== null ? String(selectedBranchId) : 'none'}
                                            onValueChange={(value) => {
                                                const id = value === 'none' ? null : Number(value);
                                                setSelectedBranchId(id);
                                                setData('branch_id', id);
                                                resetInvoiceChoice();
                                            }}
                                        >
                                            <SelectTrigger id="branch-select" className="mt-1">
                                                <SelectValue placeholder={translate('All branches')} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">{translate('All branches')}</SelectItem>
                                                {branches.map((branch) => (
                                                    <SelectItem key={branch.id} value={String(branch.id)}>
                                                        {branch.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div ref={saleInvoicePickerRef} className="relative">
                                        <Label htmlFor="invoice-lookup">{translate('Sale invoice number')}</Label>
                                        <div className="mt-1 flex gap-1">
                                            <Input
                                                id="invoice-lookup"
                                                type="text"
                                                autoComplete="off"
                                                role="combobox"
                                                aria-expanded={!lockedSaleChoice && saleInvoicePickerOpen}
                                                aria-controls="sale-invoice-options"
                                                placeholder={translate('Search sale invoice or open list')}
                                                className="min-w-0 flex-1"
                                                value={invoiceInputDisplay}
                                                onChange={(event) => handleInvoiceFieldChange(event.target.value)}
                                                onFocus={() => {
                                                    if (!lockedSaleChoice) {
                                                        setSaleInvoicePickerOpen(true);
                                                    }
                                                }}
                                            />
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="icon"
                                                className="size-9 shrink-0"
                                                aria-label={translate('Open sale invoice list')}
                                                onClick={() => {
                                                    if (lockedSaleChoice) {
                                                        resetInvoiceChoice();
                                                        setSaleInvoicePickerOpen(true);

                                                        return;
                                                    }
                                                    setSaleInvoicePickerOpen((open) => !open);
                                                }}
                                            >
                                                <ChevronDown
                                                    className={`h-4 w-4 transition-transform duration-200 ${saleInvoicePickerOpen ? 'rotate-180' : ''}`}
                                                />
                                            </Button>
                                        </div>
                                        <p className="mt-2 text-xs text-slate-500">
                                            {translate(
                                                'Open the list or type to filter sale invoices, then choose a row to load medications.',
                                            )}
                                        </p>

                                        {!lockedSaleChoice && saleInvoicePickerOpen ? (
                                            <div
                                                id="sale-invoice-options"
                                                role="listbox"
                                                className="absolute top-full z-50 mt-1 max-h-52 w-full space-y-1 overflow-auto rounded-lg border border-gray-200 bg-white p-2 shadow-md"
                                            >
                                                {invoiceSearchLoading ? (
                                                    <div className="flex items-center justify-center gap-2 py-6 text-sm text-slate-500">
                                                        <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />
                                                        {translate('Loading invoices…')}
                                                    </div>
                                                ) : saleMatches.length > 0 ? (
                                                    saleMatches.map((sale) => (
                                                        <button
                                                            key={sale.id}
                                                            type="button"
                                                            role="option"
                                                            className="w-full rounded-md px-3 py-2 text-left text-sm hover:bg-slate-50"
                                                            onClick={() => selectSaleFromSearch(sale)}
                                                        >
                                                            <span className="font-medium">{sale.sale_no}</span>
                                                            {sale.sale_date ? (
                                                                <span className="text-slate-500"> · {sale.sale_date}</span>
                                                            ) : null}
                                                        </button>
                                                    ))
                                                ) : invoiceQuery.trim().length >= 1 ? (
                                                    <p className="px-2 py-3 text-center text-sm text-slate-500">
                                                        {translate('No sale invoices match this search.')}
                                                    </p>
                                                ) : (
                                                    <p className="px-2 py-3 text-center text-sm text-slate-500">
                                                        {translate('No sale invoices found for this branch filter.')}
                                                    </p>
                                                )}
                                            </div>
                                        ) : null}
                                    </div>

                                    <div>
                                        <Label htmlFor="return-date">{translate('Return Date')}</Label>
                                        <Input
                                            id="return-date"
                                            type="date"
                                            value={String(data.return_date ?? '')}
                                            onChange={(event) => setData('return_date', event.target.value)}
                                            className="mt-1"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <Label htmlFor="return-notes">{translate('Notes')}</Label>
                                    <Textarea
                                        id="return-notes"
                                        value={String(data.notes ?? '')}
                                        onChange={(event) => setData('notes', event.target.value)}
                                        className="mt-1"
                                        rows={4}
                                    />
                                </div>

                                {saleLineItems.length > 0 && (
                                    <div className="space-y-3">
                                        <div>
                                            <h3 className="text-sm font-semibold text-slate-900">
                                                {translate('Returned from customer')}{' '}
                                                <span className="ml-1 rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                                                    {translate('Stock in')}
                                                </span>
                                            </h3>
                                            <p className="text-xs text-slate-500">
                                                {translate(
                                                    'Select medications to include in this return, then enter the quantity returned for each. Each row is one sale line (one batch). When the same medication was sold on multiple batches, you will see multiple rows with different batch numbers and expiry dates.',
                                                )}
                                            </p>
                                        </div>
                                        <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-sm">
                                            <table className="min-w-full divide-y divide-gray-100 text-sm">
                                                <thead className="bg-gray-50/80">
                                                    <tr>
                                                        <th className="w-12 px-2 py-3 text-center font-semibold" scope="col">
                                                            {translate('Include')}
                                                        </th>
                                                        <th className="px-4 py-3 text-left font-semibold">{translate('Medication')}</th>
                                                        <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-gray-500">
                                                            {translate('Batch No')}
                                                        </th>
                                                        <th className="px-4 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-gray-500">
                                                            {translate('Expiry')}
                                                        </th>
                                                        <th className="px-4 py-3 text-right font-semibold">
                                                            {translate('Sold units (this line)')}
                                                        </th>
                                                        <th className="px-4 py-3 text-right font-semibold">{translate('Return Qty')}</th>
                                                        <th className="px-4 py-3 text-right font-semibold">{translate('Unit Price')}</th>
                                                        <th className="px-4 py-3 text-right font-semibold">{translate('Line Total')}</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-50">
                                                    {saleLineItems.flatMap((item, idx) => {
                                                        const prev = idx > 0 ? saleLineItems[idx - 1] : null;
                                                        const batchCountForProduct =
                                                            productBatchLineCounts.get(item.product_id) ?? 0;
                                                        const startGroup = !prev || prev.product_id !== item.product_id;
                                                        const showMultiBatchHeader =
                                                            startGroup && batchCountForProduct > 1;
                                                        const rows: ReactNode[] = [];

                                                        if (showMultiBatchHeader) {
                                                            rows.push(
                                                                <tr
                                                                    key={`batch-group-${item.product_id}-${idx}`}
                                                                    className="border-b border-gray-100 bg-gray-50/90"
                                                                >
                                                                    <td
                                                                        colSpan={8}
                                                                        className="px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-gray-600"
                                                                    >
                                                                        {item.product_name}
                                                                        <span className="font-normal normal-case text-gray-500">
                                                                            {' '}
                                                                            — {batchCountForProduct}{' '}
                                                                            {translate('batches on this invoice')}
                                                                        </span>
                                                                    </td>
                                                                </tr>,
                                                            );
                                                        }

                                                        rows.push(
                                                            <tr
                                                                key={item.sale_item_id}
                                                                className={
                                                                    item.selected_for_return
                                                                        ? 'hover:bg-primary/5'
                                                                        : 'bg-slate-50/80 text-slate-500'
                                                                }
                                                            >
                                                                <td className="px-2 py-3 text-center align-middle">
                                                                    <Checkbox
                                                                        checked={item.selected_for_return}
                                                                        onCheckedChange={(checked) =>
                                                                            toggleMedicationForReturn(
                                                                                item.sale_item_id,
                                                                                checked === true,
                                                                            )
                                                                        }
                                                                        disabled={saleReturnBlocked}
                                                                        aria-label={translate('Include in return')}
                                                                    />
                                                                </td>
                                                                <td className="px-4 py-3 align-middle">
                                                                    <div className="font-medium text-gray-900">{item.product_name}</div>
                                                                    {item.pack_size != null && item.pack_size > 0 ? (
                                                                        <div className="mt-0.5 text-xs text-slate-500">
                                                                            {translate('Pack size')}: {item.pack_size}
                                                                        </div>
                                                                    ) : null}
                                                                </td>
                                                                <td className="px-4 py-3 align-middle">
                                                                    <div className="font-bold text-gray-800">
                                                                        {item.batch_no?.trim() ? item.batch_no : '—'}
                                                                    </div>
                                                                </td>
                                                                <td className="px-4 py-3 align-middle text-center font-bold text-orange-600">
                                                                    {item.expiry_date
                                                                        ? String(item.expiry_date).split('T')[0]
                                                                        : '—'}
                                                                </td>
                                                                <td className="whitespace-nowrap px-4 py-3 text-right align-middle">
                                                                    <span
                                                                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${
                                                                            item.selected_for_return
                                                                                ? 'bg-primary/15 text-primary'
                                                                                : 'bg-gray-100 text-gray-600'
                                                                        }`}
                                                                    >
                                                                        {(item.unit_stock ?? item.available_units ?? 0).toFixed(0)}
                                                                    </span>
                                                                </td>
                                                                <td className="px-4 py-3 text-right align-middle">
                                                                    <Input
                                                                        type="number"
                                                                        min="0"
                                                                        max={String(item.available_units)}
                                                                        step="1"
                                                                        disabled={!item.selected_for_return || saleReturnBlocked}
                                                                        value={
                                                                            item.selected_for_return
                                                                                ? String(item.return_quantity)
                                                                                : '0'
                                                                        }
                                                                        onChange={(event) =>
                                                                            handleReturnQuantityChange(
                                                                                item.sale_item_id,
                                                                                event.target.value,
                                                                            )
                                                                        }
                                                                        className="w-24"
                                                                    />
                                                                </td>
                                                                <td className="whitespace-nowrap px-4 py-3 text-right align-middle tabular-nums">
                                                                    {item.unit_cost_price.toFixed(2)}
                                                                </td>
                                                                <td className="whitespace-nowrap px-4 py-3 text-right align-middle tabular-nums">
                                                                    {item.selected_for_return
                                                                        ? (item.return_quantity * item.unit_cost_price).toFixed(2)
                                                                        : '0.00'}
                                                                </td>
                                                            </tr>,
                                                        );

                                                        return rows;
                                                    })}
                                                </tbody>
                                                {invoiceLinesSubtotal > 0 ? (
                                                    <tfoot className="bg-gray-50">
                                                        <tr>
                                                            <td className="px-4 py-3 font-medium text-slate-600" colSpan={7}>
                                                                {translate('Subtotal (invoice lines)')}
                                                            </td>
                                                            <td className="whitespace-nowrap px-4 py-3 text-right font-semibold">
                                                                {invoiceLinesSubtotal.toFixed(2)}
                                                            </td>
                                                        </tr>
                                                    </tfoot>
                                                ) : null}
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {invoiceLineHasSelection ? (
                                    <div className="space-y-3 rounded-2xl border border-blue-100 bg-blue-50/40 p-4">
                                        <div>
                                            <h3 className="text-sm font-semibold text-slate-900">
                                                {translate('Replacement / exchange')}
                                                <span className="ml-2 rounded-md bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-800">
                                                    {translate('Stock out')}
                                                </span>
                                            </h3>
                                            <p className="text-xs text-slate-600">
                                                {translate(
                                                    'Search catalog products for exchange or extra lines. When several batches are in stock, you will choose the batch (same as POS). Batch and expiry are stored on the return.',
                                                )}
                                            </p>
                                        </div>
                                        <div>
                                            <Label htmlFor="extra-product-search">{translate('Search product')}</Label>
                                            <Input
                                                id="extra-product-search"
                                                type="search"
                                                autoComplete="off"
                                                className="mt-1 max-w-xl"
                                                value={productDraft}
                                                placeholder={translate('Name or SKU (min 2 characters)')}
                                                onChange={(event) => setProductDraft(event.target.value)}
                                            />
                                            {productMatches.length > 0 ? (
                                                <div className="mt-2 max-h-52 max-w-xl space-y-1 overflow-auto rounded-lg border border-gray-200 bg-white p-2 shadow-sm">
                                                    {productMatches.map((productOption) => (
                                                        <button
                                                            key={productOption.id}
                                                            type="button"
                                                            disabled={additionalProductLoadingId === productOption.id}
                                                            className="w-full rounded-md px-3 py-2 text-left text-sm hover:bg-slate-50 disabled:opacity-60"
                                                            onClick={() => handleSelectAdditionalProductFromSearch(productOption)}
                                                        >
                                                            <div className="flex items-center justify-between gap-2">
                                                                <div className="font-medium">{productOption.name}</div>
                                                                {additionalProductLoadingId === productOption.id ? (
                                                                    <LoaderCircle className="h-4 w-4 shrink-0 animate-spin text-slate-500" aria-hidden />
                                                                ) : null}
                                                            </div>
                                                            <div className="text-xs text-slate-500">
                                                                {[productOption.sku?.trim(), productOption.unit_price.toFixed(2)]
                                                                    .filter((part): part is string => Boolean(part && part !== ''))
                                                                    .join(' · ')}
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            ) : null}
                                        </div>

                                        {additionalMedications.length > 0 ? (
                                            <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
                                                <table className="min-w-full divide-y divide-gray-200 text-sm">
                                                    <thead className="bg-gray-50">
                                                        <tr>
                                                            <th className="px-4 py-3 text-left font-semibold">{translate('Medication')}</th>
                                                            <th className="px-4 py-3 text-left font-semibold">{translate('Batch')}</th>
                                                            <th className="px-4 py-3 text-left font-semibold">{translate('Expiry')}</th>
                                                            <th className="px-4 py-3 text-right font-semibold">{translate('Qty')}</th>
                                                            <th className="px-4 py-3 text-right font-semibold">{translate('Unit Price')}</th>
                                                            <th className="px-4 py-3 text-right font-semibold">{translate('Line Total')}</th>
                                                            <th className="px-4 py-3 text-right font-semibold">
                                                                <span className="sr-only">{translate('Remove')}</span>
                                                            </th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-200">
                                                        {additionalMedications.map((row) => (
                                                            <tr key={row.key}>
                                                                <td className="max-w-[12rem] px-4 py-3">{row.product_name}</td>
                                                                <td className="px-4 py-3 text-sm text-slate-700">
                                                                    {row.batch_no?.trim() ? row.batch_no : '—'}
                                                                </td>
                                                                <td className="px-4 py-3 text-sm text-slate-700">
                                                                    {row.expiry_date
                                                                        ? String(row.expiry_date).split('T')[0]
                                                                        : '—'}
                                                                </td>
                                                                <td className="px-4 py-3 text-right">
                                                                    <Input
                                                                        type="number"
                                                                        min="0.01"
                                                                        step="0.01"
                                                                        max={
                                                                            row.max_batch_balance !== null
                                                                                ? String(row.max_batch_balance)
                                                                                : undefined
                                                                        }
                                                                        className="ml-auto w-24"
                                                                        value={String(row.quantity)}
                                                                        onChange={(event) =>
                                                                            updateAdditionalRow(row.key, {
                                                                                quantity: Math.max(Number(event.target.value), 0),
                                                                            })
                                                                        }
                                                                    />
                                                                </td>
                                                                <td className="px-4 py-3 text-right">
                                                                    <Input
                                                                        type="number"
                                                                        min="0"
                                                                        step="0.01"
                                                                        className="ml-auto w-28"
                                                                        value={String(row.unit_price)}
                                                                        onChange={(event) =>
                                                                            updateAdditionalRow(row.key, {
                                                                                unit_price: Math.max(Number(event.target.value), 0),
                                                                            })
                                                                        }
                                                                    />
                                                                </td>
                                                                <td className="whitespace-nowrap px-4 py-3 text-right font-medium">
                                                                    {(row.quantity * row.unit_price).toFixed(2)}
                                                                </td>
                                                                <td className="px-2 py-3 text-right">
                                                                    <Button
                                                                        type="button"
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="text-destructive"
                                                                        aria-label={translate('Remove')}
                                                                        onClick={() => removeAdditionalRow(row.key)}
                                                                    >
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </Button>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                    <tfoot className="bg-gray-50">
                                                        <tr>
                                                            <td className="px-4 py-3 font-medium text-slate-600" colSpan={5}>
                                                                {translate('Subtotal (additional lines)')}
                                                            </td>
                                                            <td className="whitespace-nowrap px-4 py-3 text-right font-semibold">
                                                                {additionalLinesSubtotal.toFixed(2)}
                                                            </td>
                                                            <td />
                                                        </tr>
                                                    </tfoot>
                                                </table>
                                            </div>
                                        ) : null}
                                    </div>
                                ) : null}

                                {(invoiceLinesSubtotal > 0 || additionalLinesSubtotal > 0) ? (
                                    <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
                                        <div className="flex flex-wrap justify-between gap-2 text-sm">
                                            <span className="text-slate-600">{translate('Return credit (invoice lines)')}</span>
                                            <span className="font-medium tabular-nums text-slate-900">
                                                {invoiceLinesSubtotal.toFixed(2)}
                                            </span>
                                        </div>
                                        <div className="flex flex-wrap justify-between gap-2 text-sm">
                                            <span className="text-slate-600">
                                                − {translate('New purchases on this return')}
                                            </span>
                                            <span className="font-medium tabular-nums text-slate-900">
                                                {additionalLinesSubtotal.toFixed(2)}
                                            </span>
                                        </div>
                                        <div className="space-y-2 border-t border-slate-200 pt-3">
                                            {extraPaymentDue >= 0.005 ? (
                                                <div className="flex flex-wrap justify-between gap-2 text-sm font-semibold text-amber-900">
                                                    <span>{translate('Extra payment due from customer')}</span>
                                                    <span className="tabular-nums">{extraPaymentDue.toFixed(2)}</span>
                                                </div>
                                            ) : null}
                                            {creditAfterExchange >= 0.005 ? (
                                                <div className="flex flex-wrap justify-between gap-2 text-sm font-semibold text-emerald-900">
                                                    <span>{translate('Credit to customer after purchase offset')}</span>
                                                    <span className="tabular-nums">{creditAfterExchange.toFixed(2)}</span>
                                                </div>
                                            ) : null}
                                            {extraPaymentDue < 0.005 && creditAfterExchange < 0.005 ? (
                                                <div className="text-sm font-medium text-slate-700">
                                                    {translate('Return value and purchases offset exactly.')}
                                                </div>
                                            ) : null}
                                        </div>
                                        <p className="border-t border-slate-100 pt-2 text-xs text-slate-500">
                                            {translate('Combined line value (return credit + exchange total)')}:{' '}
                                            <span className="font-medium tabular-nums">
                                                {grossInboundStockValue.toFixed(2)}
                                            </span>
                                        </p>
                                    </div>
                                ) : null}

                                {hasInboundSettlement ? (
                                    <div className="bg-secondary shrink-0 rounded-2xl border border-primary/10 p-4">
                                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                                            <div className="space-y-3 lg:col-span-8">
                                                <div className="rounded-2xl border border-primary/10 bg-white p-3 shadow-sm">
                                                    <div className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-primary">
                                                        <CreditCard className="h-3.5 w-3.5" aria-hidden />
                                                        {translate('Payment Mode')}
                                                    </div>
                                                    <RadioGroup
                                                        value={settlementPaymentMode}
                                                        onValueChange={(val: string) => {
                                                            const m = val as SettlementPaymentMode;
                                                            setSettlementPaymentMode(m);
                                                            setData('settlement_payment_mode', m);
                                                            if (m !== 'split') {
                                                                setSettlementPaidDraft(extraPaymentDue.toFixed(2));
                                                            }
                                                        }}
                                                        className="flex flex-wrap gap-x-6 gap-y-1.5"
                                                    >
                                                        <div className="flex items-center space-x-1.5">
                                                            <RadioGroupItem value="cash" id="cr-pay-cash" className="border-primary/30 text-primary" />
                                                            <Label htmlFor="cr-pay-cash" className="cursor-pointer text-xs font-bold text-gray-700">
                                                                {translate('Cash')}{' '}
                                                                <span className="ml-0.5 text-[9px] font-normal text-gray-400">(F1)</span>
                                                            </Label>
                                                        </div>
                                                        <div className="flex items-center space-x-1.5">
                                                            <RadioGroupItem value="credit" id="cr-pay-credit" />
                                                            <Label htmlFor="cr-pay-credit" className="cursor-pointer text-xs font-bold text-gray-700">
                                                                {translate('Credit')}{' '}
                                                                <span className="ml-0.5 text-[9px] font-normal text-gray-400">(F2)</span>
                                                            </Label>
                                                        </div>
                                                        <div className="flex items-center space-x-1.5">
                                                            <RadioGroupItem value="card" id="cr-pay-card" className="border-primary/30 text-primary" />
                                                            <Label htmlFor="cr-pay-card" className="cursor-pointer text-xs font-bold text-gray-700">
                                                                {translate('Card')}{' '}
                                                                <span className="ml-0.5 text-[9px] font-normal text-gray-400">(F3)</span>
                                                            </Label>
                                                        </div>
                                                        <div className="flex items-center space-x-1.5">
                                                            <RadioGroupItem value="cheque" id="cr-pay-cheque" />
                                                            <Label htmlFor="cr-pay-cheque" className="cursor-pointer text-xs font-bold text-gray-700">
                                                                {translate('Cheque')}{' '}
                                                                <span className="ml-0.5 text-[9px] font-normal text-gray-400">(F4)</span>
                                                            </Label>
                                                        </div>
                                                        <div className="flex items-center space-x-1.5">
                                                            <RadioGroupItem value="bank_transfer" id="cr-pay-bank" />
                                                            <Label htmlFor="cr-pay-bank" className="cursor-pointer text-xs font-bold text-gray-700">
                                                                {translate('Bank')}{' '}
                                                                <span className="ml-0.5 text-[9px] font-normal text-gray-400">(F5)</span>
                                                            </Label>
                                                        </div>
                                                        <div className="flex items-center space-x-1.5">
                                                            <RadioGroupItem value="split" id="cr-pay-split" />
                                                            <Label htmlFor="cr-pay-split" className="cursor-pointer text-xs font-bold text-gray-700">
                                                                {translate('Split')}{' '}
                                                                <span className="ml-0.5 text-[9px] font-normal text-gray-400">(F6)</span>
                                                            </Label>
                                                        </div>
                                                    </RadioGroup>
                                                    {settlementPaymentMode === 'credit' ? (
                                                        <p className="mt-2 text-xs text-slate-600">
                                                            {translate(
                                                                'On credit you may pay less than the amount due; the remainder is added to the customer account balance.',
                                                            )}
                                                        </p>
                                                    ) : null}
                                                </div>

                                                {settlementPaymentMode === 'split' ? (
                                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                                        <div>
                                                            <Label>{translate('Cash')}</Label>
                                                            <Input
                                                                type="number"
                                                                min="0"
                                                                step="0.01"
                                                                className="mt-1"
                                                                value={String(data.settlement_cash_amount || '')}
                                                                onChange={(e) => setData('settlement_cash_amount', Math.max(0, Number(e.target.value) || 0))}
                                                                onWheel={(e) => (e.target as HTMLInputElement).blur()}
                                                            />
                                                        </div>
                                                        <div>
                                                            <Label>{translate('Bank')}</Label>
                                                            <Input
                                                                type="number"
                                                                min="0"
                                                                step="0.01"
                                                                className="mt-1"
                                                                value={String(data.settlement_bank_amount || '')}
                                                                onChange={(e) => setData('settlement_bank_amount', Math.max(0, Number(e.target.value) || 0))}
                                                                onWheel={(e) => (e.target as HTMLInputElement).blur()}
                                                            />
                                                        </div>
                                                        <div>
                                                            <Label>{translate('Card')} / {translate('Online Transfer')}</Label>
                                                            <Input
                                                                type="number"
                                                                min="0"
                                                                step="0.01"
                                                                className="mt-1"
                                                                value={String(data.settlement_online_amount || '')}
                                                                onChange={(e) =>
                                                                    setData('settlement_online_amount', Math.max(0, Number(e.target.value) || 0))
                                                                }
                                                                onWheel={(e) => (e.target as HTMLInputElement).blur()}
                                                            />
                                                        </div>
                                                        <div>
                                                            <Label>{translate('Cheque')}</Label>
                                                            <Input
                                                                type="number"
                                                                min="0"
                                                                step="0.01"
                                                                className="mt-1"
                                                                value={String(data.settlement_cheque_amount || '')}
                                                                onChange={(e) =>
                                                                    setData('settlement_cheque_amount', Math.max(0, Number(e.target.value) || 0))
                                                                }
                                                                onWheel={(e) => (e.target as HTMLInputElement).blur()}
                                                            />
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <Label className="text-[10px] font-bold uppercase text-gray-500">
                                                            {translate('Paid Amount')}
                                                        </Label>
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            step="0.01"
                                                            className="mt-1 h-10 rounded-lg border-primary/10 text-lg font-medium focus:ring-primary/20"
                                                            value={settlementPaidDraft}
                                                            onChange={(e) => setSettlementPaidDraft(e.target.value)}
                                                            onWheel={(e) => (e.target as HTMLInputElement).blur()}
                                                        />
                                                    </div>
                                                )}

                                                {(settlementPaymentMode === 'split' ||
                                                    ['bank_transfer', 'card', 'credit'].includes(settlementPaymentMode)) &&
                                                financeBankAccounts.length > 0 ? (
                                                    <div>
                                                        <Label>{translate('Deposit to (finance bank account)')}</Label>
                                                        <Select
                                                            value={
                                                                data.settlement_finance_account_id
                                                                    ? String(data.settlement_finance_account_id)
                                                                    : 'none'
                                                            }
                                                            onValueChange={(v) =>
                                                                setData('settlement_finance_account_id', v === 'none' ? null : Number(v))
                                                            }
                                                        >
                                                            <SelectTrigger className="mt-1">
                                                                <SelectValue placeholder={translate('Select company bank account')} />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="none">{translate('None')}</SelectItem>
                                                                {financeBankAccounts.map((acc) => (
                                                                    <SelectItem key={acc.id} value={String(acc.id)}>
                                                                        {acc.name}
                                                                        {acc.bank_account_no ? ` · ${acc.bank_account_no}` : ''}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                ) : null}

                                                {(settlementPaymentMode === 'cheque' ||
                                                    (settlementPaymentMode === 'split' &&
                                                        (Number(data.settlement_cheque_amount) || 0) >= 0.005)) && (
                                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                                        <div>
                                                            <Label>{translate('Cheque no')}</Label>
                                                            <Input
                                                                className="mt-1"
                                                                value={String(data.settlement_cheque_no ?? '')}
                                                                onChange={(e) => setData('settlement_cheque_no', e.target.value)}
                                                            />
                                                        </div>
                                                        <div>
                                                            <Label>{translate('Cheque date')}</Label>
                                                            <Input
                                                                type="date"
                                                                className="mt-1"
                                                                value={String(data.settlement_cheque_date ?? '')}
                                                                onChange={(e) => setData('settlement_cheque_date', e.target.value)}
                                                            />
                                                        </div>
                                                        <div>
                                                            <Label>{translate('Cheque bank')}</Label>
                                                            <Input
                                                                className="mt-1"
                                                                value={String(data.settlement_cheque_bank_name ?? '')}
                                                                onChange={(e) => setData('settlement_cheque_bank_name', e.target.value)}
                                                            />
                                                        </div>
                                                        <div>
                                                            <Label>{translate('Cheque branch')}</Label>
                                                            <Input
                                                                className="mt-1"
                                                                value={String(data.settlement_cheque_branch ?? '')}
                                                                onChange={(e) => setData('settlement_cheque_branch', e.target.value)}
                                                            />
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                                                    <span className="text-slate-600">{translate('Amount due from customer')}</span>
                                                    <span className="font-semibold tabular-nums text-amber-900">
                                                        {extraPaymentDue.toFixed(2)}
                                                    </span>
                                                </div>
                                                <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                                                    <span className="text-slate-600">{translate('Allocated total')}</span>
                                                    <span
                                                        className={`font-semibold tabular-nums ${
                                                            settlementAllocationsValid ? 'text-emerald-800' : 'text-amber-900'
                                                        }`}
                                                    >
                                                        {settlementSum.toFixed(2)}
                                                    </span>
                                                </div>
                                                {!settlementAllocationsValid ? (
                                                    <p className="text-xs text-amber-800">
                                                        {translate('Adjust payment amounts to match the amount due, or use Credit for a partial payment.')}
                                                    </p>
                                                ) : null}
                                                {settlementNeedsFinanceAccount ? (
                                                    <p className="text-xs text-amber-800">
                                                        {translate('Select a deposit bank account for bank or card settlement.')}
                                                    </p>
                                                ) : null}
                                                {settlementNeedsChequeNo ? (
                                                    <p className="text-xs text-amber-800">
                                                        {translate('Enter cheque number when recording a cheque payment.')}
                                                    </p>
                                                ) : null}
                                                <p className="text-xs text-slate-500">
                                                    {translate(
                                                        'Creates rows in customer_payments for each method used, same as POS customer collections.',
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ) : null}

                                <div className="flex items-center justify-end gap-3">
                                    <Button
                                        type="submit"
                                        disabled={
                                            processing ||
                                            saleReturnBlocked ||
                                            selectedSaleId === null ||
                                            !Array.isArray(data.products) ||
                                            data.products.length === 0 ||
                                            !selectedCustomer ||
                                            (hasInboundSettlement &&
                                                (!settlementAllocationsValid ||
                                                    settlementNeedsFinanceAccount ||
                                                    settlementNeedsChequeNo))
                                        }
                                    >
                                        {translate('Record Return')}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </form>
                </div>
            </div>
            <BatchSelectionModal
                isOpen={additionalBatchModalOpen}
                onClose={() => {
                    setAdditionalBatchModalOpen(false);
                    setAdditionalProductForBatch(null);
                }}
                product={additionalProductForBatch}
                onSelect={(batch) => {
                    handleAdditionalBatchSelected({
                        batch_no: batch.batch_no,
                        balance: batch.balance,
                        unit_sales_price:
                            batch.unit_sales_price !== undefined && batch.unit_sales_price !== null
                                ? Number(batch.unit_sales_price)
                                : null,
                        expiry_date: batch.expiry_date ?? null,
                    });
                }}
            />
        </PageTemplate>
    );
}
