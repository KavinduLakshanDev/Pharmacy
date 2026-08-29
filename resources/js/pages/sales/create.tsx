import { useEffect, useMemo, useState, useRef } from 'react';
import { usePage, router } from '@inertiajs/react';
import { PageTemplate } from '@/components/page-template';
import { Button } from '@/components/ui/button';
import { CrudFormModal } from '@/components/CrudFormModal';
import { BatchSelectionModal } from '@/components/BatchSelectionModal';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useTranslation } from 'react-i18next';
import { 
  Search, 
  UserPlus, 
  Maximize, 
  ArrowLeft, 
  Power,
  CreditCard,
  ShoppingCart,
  Plus,
  Trash2,
  FileText,
  Landmark,
  X,
  Printer,
  Minus,
  Settings,
  Monitor,
  Gift
} from 'lucide-react';
import { isElectron, printInElectron, getElectronPrinters } from '@/lib/electron-utils';
import { toast } from '@/components/custom-toast';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import SearchableSelect from '@/components/ui/searchable-select';
import { PosReceipt, type ReceiptData } from './components/pos-receipt';
import { generateReceiptHtml } from '@/utils/receipt-generator';

type SaleItem = {
  product_id: number;
  code: string;
  name: string;
  quantity: number;
  unit_price: number;
  our_price: number;
  discount_type: string;
  discount_value: number;
  discount_amount: number;
  total: number;
  batch_no?: string;
  expiry_date?: string;
  weight?: string;
};

type SalePayment = {
  payment_method: string;
  amount: number;
  finance_account_id?: string;
  cheque_no?: string;
  cheque_date?: string;
  cheque_bank?: string;
  cheque_branch?: string;
};

interface SalesFormData {
  sale_no: string;
  customer_id: string;
  branch_id: string;
  sale_date: string;
  paid_amount: number;
  cash_payment: number;
  discount_type: string;
  discount_value: number;
  delivery_charge: number;
  payment_method: string;
  finance_account_id: string;
  cheque_no: string;
  cheque_date: string;
  cheque_bank: string;
  cheque_branch: string;
  status: string;
  auto_print: boolean;
  issued_by: string;
  checked_by: string;
  payments: SalePayment[];
}

export default function SaleCreate() {
  const { t } = useTranslation();
  const { 
    customers = [], 
    branches = [], 
    products = [], 
    statuses = [],
    discountTypes = [],
    nextSaleNo = '',
    // auth,
    mustStartSession = false,
    cashRegisters = [],
    activeSession = null,
    currentBranchId = '',
    financeAccounts = [],
    globalSettings = {}
  } = usePage().props as any;

  // Local points states and settings
  const [isRedeemingPoints, setIsRedeemingPoints] = useState(false);
  const [pointsToRedeem, setPointsToRedeem] = useState('0');

  const { pointsRule = null } = usePage().props as any;

  const pointsToCash = (points: number) => {
    if (!pointsRule || Number(pointsRule.redemption_points) <= 0) return points;
    return (points / Number(pointsRule.redemption_points)) * Number(pointsRule.redemption_amount);
  };

  const pointsDiscount = useMemo(() => {
    if (!isRedeemingPoints || !pointsRule) return 0;
    const rate = Number(pointsRule.redemption_amount) / Number(pointsRule.redemption_points);
    return Number(pointsToRedeem || 0) * rate;
  }, [pointsToRedeem, pointsRule, isRedeemingPoints]);
  
  const defaultCustomerId = customers.find((c: any) => c.name.toLowerCase().includes('walk-in'))?.id ?? '';

  const [sessionData, setSessionData] = useState({
    cash_register_id: '',
    opening_balance: '0.00',
    notes: ''
  });

  const [closeSessionData, setCloseSessionData] = useState({
    closing_balance: '0.00',
    notes: ''
  });

  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [isChequeModalOpen, setIsChequeModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isSplitPaymentModalOpen, setIsSplitPaymentModalOpen] = useState(false);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [isRePrintModalOpen, setIsRePrintModalOpen] = useState(false);
  const [isSearchingSale, setIsSearchingSale] = useState(false);

  // Local customers list (allows adding new customers without full reload)
  const [localCustomers, setLocalCustomers] = useState<any[]>(customers);

  // Quick create customer modal state
  const [isCreateCustomerOpen, setIsCreateCustomerOpen] = useState(false);
  const [newCustomerForm, setNewCustomerForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    type: 'customer',
    privileged_customer_number: '',
  });
  const [newCustomerErrors, setNewCustomerErrors] = useState<Record<string, string>>({});
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);

  const handleQuickCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingCustomer(true);
    setNewCustomerErrors({});

    try {
      const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '';
      const response = await fetch(route('customers.quick-store'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': csrfToken,
          'Accept': 'application/json',
        },
        body: JSON.stringify(newCustomerForm),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.errors) {
          const flat: Record<string, string> = {};
          for (const [k, v] of Object.entries(data.errors)) {
            flat[k] = Array.isArray(v) ? (v as string[])[0] : String(v);
          }
          setNewCustomerErrors(flat);
        } else {
          toast.error(data.message ?? t('Failed to create customer'));
        }
        return;
      }

      const newCustomer = data.customer;
      setLocalCustomers((prev) => [newCustomer, ...prev]);
      handleFormChange('customer_id', String(newCustomer.id));
      setIsCreateCustomerOpen(false);
      setNewCustomerForm({
        name: '',
        phone: '',
        email: '',
        address: '',
        type: 'customer',
        privileged_customer_number: '',
      });
      toast.success(t('Customer created successfully'));
    } catch {
      toast.error(t('Failed to create customer'));
    } finally {
      setIsCreatingCustomer(false);
    }
  };

  const handleStartSession = (data?: any) => {
    const submitData = data || sessionData;
    
    if (!submitData.cash_register_id) {
        toast.error(t('Please select a cash register'));
        return;
    }

    toast.loading(t('Starting session...'));
    router.post(route('pos-sessions.store'), submitData, {
        onSuccess: () => {
            toast.dismiss();
            toast.success(t('Session started successfully'));
            // router.reload();
        },
        onError: (errors) => {
            toast.dismiss();
            const errorMsg = typeof errors === 'object' ? Object.values(errors).join(', ') : errors;
            toast.error(errorMsg);
        }
    });
  };

  const handleCloseSession = (data: any) => {
    if (!activeSession?.id) return;

    toast.loading(t('Closing session...'));
    router.put(route('pos-sessions.close', activeSession.id), data, {
        onSuccess: () => {
            toast.dismiss();
            toast.success(t('Session closed successfully'));
            setIsCloseModalOpen(false);
            router.get(route('sales.index'));
        },
        onError: (errors) => {
            toast.dismiss();
            const errorMsg = typeof errors === 'object' ? Object.values(errors).join(', ') : errors;
            toast.error(errorMsg);
        }
    });
  };

  const handleRePrintSearch = async (data: { sale_no: string }) => {
    setIsSearchingSale(true);
    toast.loading(t('Searching sale...'));
    try {
      const response = await fetch(route('sales.search-by-number', { sale_no: data.sale_no }));
      const sale = await response.json();

      if (!response.ok) {
        toast.dismiss();
        toast.error(sale.message || t('Sale not found'));
        return;
      }

      // Format the sale data for receipt
      const receiptData: ReceiptData = {
        saleNumber: sale.sale_no,
        date: sale.sale_date,
        customer: sale.customer?.name || t('Walk-in Customer'),
        cashier: '', 
        items: sale.items.map((item: any) => ({
          product_id: item.product_id,
          product_name: item.product?.name || item.name,
          product_sku: item.product?.sku || item.code || '',
          quantity: Number(item.quantity),
          unit_price: Number(item.unit_price),
          discount_type: item.discount_type,
          discount_value: Number(item.discount_value),
          discount_amount: Number(item.discount_amount),
          tax_rate: 0,
          tax_amount: 0,
          line_total: Number(item.total_price) - Number(item.discount_amount),
        })),
        subtotal: Number(sale.sub_total),
        itemDiscount: sale.items.reduce((s: number, i: any) => s + Number(i.discount_amount), 0),
        orderDiscount: Number(sale.discount_amount) - sale.items.reduce((s: number, i: any) => s + Number(i.discount_amount), 0),
        tax: 0,
        total: Number(sale.total_amount),
        paymentMode: sale.payments?.length > 1 ? 'split' : (sale.payments?.[0]?.payment_method || 'cash'),
        cashAmount: sale.payments?.filter((p: any) => p.payment_method === 'cash').reduce((s: number, p: any) => s + Number(p.amount), 0) || 0,
        cardAmount: sale.payments?.filter((p: any) => p.payment_method === 'card').reduce((s: number, p: any) => s + Number(p.amount), 0) || 0,
        bankAmount: sale.payments?.filter((p: any) => p.payment_method === 'bank_transfer').reduce((s: number, p: any) => s + Number(p.amount), 0) || 0,
        totalPaid: Number(sale.paid_amount),
        changeDue: Math.max(0, Number(sale.paid_amount) - Number(sale.total_amount)),
        issuedBy: sale.issued_by,
        checkedBy: sale.checked_by,
        posSession: null,
        globalSettings: null,
      };

      setReceiptData(receiptData);
      setIsRePrintModalOpen(false);
      toast.dismiss();
      
      if (formData.auto_print && isElectron()) {
          handleDirectPrint(receiptData);
      } else {
          setReceiptOpen(true);
      }
    } catch (error) {
      toast.dismiss();
      toast.error(t('An error occurred while searching for the sale.'));
    } finally {
      setIsSearchingSale(false);
    }
  };

  const [formData, setFormData] = useState<SalesFormData>({
    sale_no: nextSaleNo,
    customer_id: String(defaultCustomerId),
    branch_id: String(currentBranchId || (branches?.[0]?.id ?? '')),
    sale_date: new Date().toISOString().split('T')[0],
    paid_amount: 0,
    cash_payment: 0,
    discount_type: 'percentage', // 'percentage' or 'fixed'
    discount_value: 0,
    delivery_charge: 0,
    payment_method: 'cash',
    finance_account_id: '',
    cheque_no: '',
    cheque_date: '',
    cheque_bank: '',
    cheque_branch: '',
    status: 'completed',
    auto_print: true,
    issued_by: '',
    checked_by: '',
    payments: [] as SalePayment[],
  });

  const selectedCustomer = useMemo(() => {
    return localCustomers.find((c: any) => String(c.id) === String(formData.customer_id));
  }, [localCustomers, formData.customer_id]);

  const breadcrumbs = [
    { title: t('Dashboard'), href: route('dashboard') },
    { title: t('Sales'), href: route('sales.index') },
    { title: t('New Sale') },
  ];

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [items, setItems] = useState<SaleItem[]>([]);

  const [selectedPrinter, setSelectedPrinter] = useState<string>(
    localStorage.getItem('qz_printer_name') || ''
  );
  const [availablePrinters, setAvailablePrinters] = useState<any[]>([]);

  useEffect(() => {
    if (isElectron()) {
      getElectronPrinters().then(printers => {
        setAvailablePrinters(printers);
        // If no printer is selected but there is a default, or if selected printer is not in list
        const currentStored = localStorage.getItem('qz_printer_name');
        if (!currentStored && printers.length > 0) {
            const defaultPrinter = printers.find((p: any) => p.isDefault)?.name || printers[0].name;
            setSelectedPrinter(defaultPrinter);
            localStorage.setItem('qz_printer_name', defaultPrinter);
        }
      });
    }
  }, []);

  const handleDirectPrint = async (data: ReceiptData) => {
    if (!isElectron()) {
        setReceiptOpen(true);
        return;
    }

    const currentGlobalSettings = data?.globalSettings || globalSettings;

    const companyName =
      getAppSetting('companyName') ||
      getAppSetting('storeName') ||
      (currentGlobalSettings?.companyName as string) ||
      (currentGlobalSettings?.storeName as string) ||
      (data?.posSession?.branch_name as string) ||
      'POS Sale';

    const companyLogoPath =
      getAppSetting('companyLogo') ||
      (currentGlobalSettings?.companyLogo as string) ||
      '';

    const resolveLogoUrl = (logo?: string): string | null => {
        if (!logo) return null;
        if (logo.startsWith('http')) return logo;
        const base = (window as any).appSettings?.imageUrl || (window as any).appSettings?.baseUrl || '';
        const separator = base.endsWith('/') || logo.startsWith('/') ? '' : '/';
        return `${base}${separator}${logo}`;
    };

    const companyLogo = resolveLogoUrl(companyLogoPath);
    const branchAddress = data?.posSession && typeof data.posSession.branch_address === 'string'
        ? data.posSession.branch_address
        : '';
    const companyPhone = getAppSetting('companyPhone') || (currentGlobalSettings?.companyPhone as string | undefined);
    const companyAddress = getAppSetting('companyAddress') || (currentGlobalSettings?.companyAddress as string | undefined);

    const html = generateReceiptHtml(
        data,
        (v) => `Rs ${Number(v).toFixed(2)}`,
        companyName,
        companyLogo,
        companyAddress || null,
        companyPhone || null,
        branchAddress || null,
        t
    );

    try {
        if (isElectron()) {
            await printInElectron(html, selectedPrinter);
            toast.success(t('Receipt printed via Desktop App'));
        } else {
            setReceiptOpen(true);
        }
    } catch (err: any) {
        console.error('Direct print failed:', err);
        setReceiptOpen(true); // Fallback to modal
    }
  };

  function getAppSetting(key: string): string | null {
    const appSettings = (window as any).appSettings;
    if (!appSettings) return null;
    const value = typeof appSettings.get === 'function' ? appSettings.get(key, null) : appSettings[key];
    return value != null ? String(value) : null;
  }

  // Update sale_no when nextSaleNo changes (after a successful store)
  useEffect(() => {
    if (nextSaleNo && !formData.sale_no) {
      setFormData(prev => ({ ...prev, sale_no: nextSaleNo }));
    }
  }, [nextSaleNo]);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        toast.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const handleClearForm = () => {
    if (confirm(t('Are you sure you want to clear the form?'))) {
      setItems([]);
      setIsRedeemingPoints(false);
      setPointsToRedeem('0');
      setFormData({
        sale_no: nextSaleNo,
        customer_id: String(defaultCustomerId),
        branch_id: String(currentBranchId || (branches?.[0]?.id ?? '')),
        sale_date: new Date().toISOString().split('T')[0],
        paid_amount: 0,
        cash_payment: 0,
        discount_type: 'percentage',
        discount_value: 0,
        delivery_charge: 0,
        payment_method: 'cash',
        finance_account_id: '',
        cheque_no: '',
        cheque_date: '',
        cheque_bank: '',
        cheque_branch: '',
        status: 'completed',
        auto_print: formData.auto_print,
        issued_by: '',
        checked_by: '',
        payments: [],
      });
      toast.success(t('Form cleared successfully'));
    }
  };

  // Payment Hotkeys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F1') { e.preventDefault(); handleFormChange('payment_method', 'cash'); }
      else if (e.key === 'F2') { e.preventDefault(); handleFormChange('payment_method', 'credit'); }
      else if (e.key === 'F3') { e.preventDefault(); handleFormChange('payment_method', 'card'); }
      else if (e.key === 'F4') { e.preventDefault(); handleFormChange('payment_method', 'cheque'); }
      else if (e.key === 'F5') { e.preventDefault(); handleFormChange('payment_method', 'bank_transfer'); }
      else if (e.key === 'F8') { e.preventDefault(); setIsCreateCustomerOpen(true); }
      else if (e.key === 'F10') { e.preventDefault(); handleClearForm(); }
      else if (e.key === 'F11') { e.preventDefault(); toggleFullScreen(); }
      else if (e.key === 'F12') { e.preventDefault(); handleSubmit(); }
      else if (e.key === '+') {
        if (isCreateCustomerOpen) return;
        e.preventDefault();
        paidAmountRef.current?.focus();
        paidAmountRef.current?.select();
      }
      else if (e.key === '-') {
        if (isCreateCustomerOpen) return;
        e.preventDefault();
        discountRef.current?.focus();
        discountRef.current?.select();
      }
      else if (e.key === '`') {
        if (isCreateCustomerOpen) return;
        e.preventDefault();
        barcodeRef.current?.focus();
        barcodeRef.current?.select();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [items, formData, isCreateCustomerOpen, nextSaleNo, defaultCustomerId, currentBranchId, branches, handleClearForm]);
  
  // Item Entry State
  const [entry, setEntry] = useState({
    barcode: '',
    productId: '',
    unitPrice: 0,
    qty: 1,
    discountType: 'none',
    discountValue: 0,
    batch_no: '',
    expiry_date: ''
  });

  const [batchModalOpen, setBatchModalOpen] = useState(false);
  const [selectedProductForBatch, setSelectedProductForBatch] = useState<any>(null);

  const barcodeRef = useRef<HTMLInputElement>(null);
  const qtyRef = useRef<HTMLInputElement>(null);
  const paidAmountRef = useRef<HTMLInputElement>(null);
  const discountRef = useRef<HTMLInputElement>(null);
  const saveButtonRef = useRef<HTMLButtonElement>(null);

  const selectedProduct = useMemo(() => {
    return products.find((p: any) => String(p.id) === entry.productId);
  }, [products, entry.productId]);

  const selectedBatch = useMemo(() => {
    if (!selectedProduct || !entry.batch_no) return null;
    return selectedProduct.batches?.find((b: any) => b.batch_no === entry.batch_no);
  }, [selectedProduct, entry.batch_no]);

  // Financials
  const subTotal = useMemo(() => {
    return items.reduce((sum, item) => sum + item.total, 0);
  }, [items]);

  const totalDiscount = useMemo(() => {
    if (formData.discount_type === 'percentage') {
      return (subTotal * Number(formData.discount_value || 0)) / 100;
    }
    return Number(formData.discount_value || 0);
  }, [subTotal, formData.discount_type, formData.discount_value]);

  const grandTotal = useMemo(() => {
    return Math.max(0, subTotal - totalDiscount + Number(formData.delivery_charge || 0) - pointsDiscount);
  }, [subTotal, totalDiscount, formData.delivery_charge, pointsDiscount]);

  const totalPaid = useMemo(() => {
    if (formData.payments && formData.payments.length > 0) {
        return formData.payments.reduce((sum: number, p: any) => sum + Number(p.amount), 0);
    }
    return Number(formData.cash_payment || 0);
  }, [formData.payments, formData.cash_payment]);

  const computedProductForBatch = useMemo(() => {
    if (!selectedProductForBatch) return null;
    return {
        ...selectedProductForBatch,
        batches: selectedProductForBatch.batches?.map((batch: any) => {
            const inCart = items
                .filter(i => i.product_id === selectedProductForBatch.id && i.batch_no === batch.batch_no)
                .reduce((sum, i) => sum + i.quantity, 0);
            return {
                ...batch,
                balance: Number(batch.balance) - inCart
            };
        })
    };
  }, [selectedProductForBatch, items]);

  // Additional Hotkeys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F7') { e.preventDefault(); /* Handle Return */ }
      if (e.key === 'F8') { e.preventDefault(); /* Focus Customer Payment / Paid Amount */ }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (mustStartSession) {
    const cashRegisterOptions = cashRegisters.map((reg: any) => ({
      value: reg.id.toString(),
      label: `${reg.name} (${reg.register_code})`
    }));

    return (
      <PageTemplate
        title={t('')}
        description={t('')}
        url="/sales/create"
        breadcrumbs={breadcrumbs}
      >
        <div className="flex flex-col items-center justify-center min-h-[400px] bg-gray-50/50 rounded-3xl border-2 border-dashed border-gray-200">
          <div className="bg-white p-12 rounded-[2.5rem] shadow-xl shadow-gray-200/50 text-center max-w-sm border border-gray-100 relative">
            <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Power className="h-10 w-10 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('Session Required')}</h2>
            {/* <p className="text-gray-500 mb-8 font-medium">
              {t('A POS session must be active to process sales. Please start one below.')}
            </p> */}
            {/* <Button 
                onClick={() => setSessionData(prev => ({ ...prev }))}
                size="lg"
                className="bg-primary hover:bg-primary/90 text-white font-bold rounded-xl px-8"
            >
                {t('Open Start Session Form')}
            </Button> */}
          </div>

          <CrudFormModal
            isOpen={true}
            onClose={() => router.get(route('sales.index'))}
            onSubmit={(data) => {
                handleStartSession(data);
            }}
            formConfig={{
              fields: [
                {
                  name: 'cash_register_id',
                  label: t('Cash Register'),
                  type: 'select',
                  required: true,
                  options: cashRegisterOptions
                },
                { 
                    name: 'opening_balance', 
                    label: t('Opening Balance'), 
                    type: 'number', 
                    step: '0.01', 
                    required: true,
                    defaultValue: '0.00'
                },
                { name: 'notes', label: t('Notes'), type: 'textarea' }
              ],
              modalSize: 'lg'
            }}
            initialData={sessionData}
            title={t('Start New POS Session')}
            mode="create"
          />
        </div>
      </PageTemplate>
    );
  }


  const handleFormChange = (name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'payment_method') {
        if (value === 'cheque') {
            setIsChequeModalOpen(true);
        } else if (['card', 'bank_transfer'].includes(value)) {
            setIsPaymentModalOpen(true);
        } else if (value === 'split') {
            setIsSplitPaymentModalOpen(true);
        }
    }
  };

  const addSplitPayment = (payment: any) => {
    setFormData(prev => ({
        ...prev,
        payments: [...(prev.payments || []), payment],
        payment_method: 'split'
    }));
    setIsSplitPaymentModalOpen(false);
  };

  const removePayment = (index: number) => {
    setFormData(prev => ({
        ...prev,
        payments: prev.payments.filter((_: any, i: number) => i !== index)
    }));
  };




  const handleBarcodeSearch = (barcode: string) => {
    const searchTerm = barcode.trim().toLowerCase();
    if (!searchTerm) return;

    const product = products.find((p: any) => 
        (p.barcode && String(p.barcode).toLowerCase() === searchTerm) || 
        String(p.id) === searchTerm || 
        (p.sku && String(p.sku).toLowerCase() === searchTerm)
    );
    if (product) {
      setEntry(prev => ({
        ...prev,
        productId: String(product.id),
        unitPrice: Number(product.price),
        barcode: barcode,
        batch_no: ''
      }));

      if (product.batches?.length === 1) {
        const batch = product.batches[0];
        setEntry(prev => ({ 
          ...prev, 
          batch_no: batch.batch_no,
          unitPrice: Number(batch.unit_sales_price || product.price)
        }));
        setTimeout(() => qtyRef.current?.focus(), 100);
      } else if (product.batches?.length > 1) {
        const firstBatch = product.batches[0];
        setEntry(prev => ({ 
          ...prev, 
          batch_no: firstBatch.batch_no,
          unitPrice: Number(firstBatch.unit_sales_price || product.price),
          expiry_date: firstBatch.expiry_date || ''
        }));
        setSelectedProductForBatch(product);
        setTimeout(() => setBatchModalOpen(true), 150);
      } else {
        setTimeout(() => qtyRef.current?.focus(), 100);
      }
    } else {
      toast.error(t('Product not found. Try searching by name in the Item Name field.'));
    }
  };

  const handleAddItem = () => {
    if (!entry.productId) return;
    
    const product = products.find((p: any) => String(p.id) === entry.productId);
    if (!product) return;

    const base = Number(entry.qty) * Number(entry.unitPrice);
    
    // Real-time stock validation
    const available = selectedBatch ? Number(selectedBatch.balance) : (product?.branch_stock ? Number(product.branch_stock) : 0);
    const inCart = items
      .filter(i => i.product_id === product.id && i.batch_no === entry.batch_no)
      .reduce((sum, i) => sum + i.quantity, 0);

    if (Number(entry.qty) + inCart > available) {
      toast.error(t('Insufficient stock for this batch. Available: {{qty}}', { qty: (available - inCart).toFixed(2) }));
      return;
    }

    let discounted = base;
    if (entry.discountType === 'percentage') {
      discounted = base - (base * Number(entry.discountValue)) / 100;
    } else if (entry.discountType === 'fixed') {
      discounted = base - Math.min(Number(entry.discountValue), base);
    }

    const newItem: SaleItem = {
      product_id: product.id,
      code: product.sku || product.barcode || product.id,
      name: product.name,
      quantity: entry.qty,
      unit_price: entry.unitPrice,
      our_price: product.detailsPrices?.find((p: any) => p.unit_type === 'Our Price')?.price || 0,
      discount_type: entry.discountType,
      discount_value: entry.discountValue,
      discount_amount: base - discounted,
      total: discounted,
      batch_no: entry.batch_no,
      expiry_date: entry.expiry_date,
      weight: product.pack_size || '-'
    };

    setItems(prev => {
      const existingItemIndex = prev.findIndex(item => 
        item.product_id === newItem.product_id && 
        item.batch_no === newItem.batch_no
      );

      if (existingItemIndex > -1) {
        const updatedItems = [...prev];
        const existingItem = updatedItems[existingItemIndex];
        const newQty = Number(existingItem.quantity) + Number(newItem.quantity);
        
        // Recalculate total for the merged item
        const newBase = newQty * Number(existingItem.unit_price);
        let newTotal = newBase;
        if (existingItem.discount_type === 'percentage') {
          newTotal = newBase - (newBase * Number(existingItem.discount_value)) / 100;
        } else if (existingItem.discount_type === 'fixed') {
          newTotal = newBase - Math.min(Number(existingItem.discount_value), newBase);
        }

        updatedItems[existingItemIndex] = {
          ...existingItem,
          quantity: newQty,
          discount_amount: newBase - newTotal,
          total: newTotal
        };
        return updatedItems;
      }

      return [...prev, newItem];
    });
    
    // Reset entry
    setEntry({
      barcode: '',
      productId: '',
      unitPrice: 0,
      qty: 1,
      discountType: 'none',
      discountValue: 0,
      batch_no: '',
      expiry_date: ''
    });
    barcodeRef.current?.focus();
  };

  const removeItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (items.length === 0) {
      toast.error(t('Please add at least one item.'));
      return;
    }

    // Require registered customer for certain payment methods
    const restrictedMethods = ['credit', 'cheque', 'bank_transfer'];
    if (restrictedMethods.includes(formData.payment_method)) {
      if (!formData.customer_id || String(formData.customer_id) === String(defaultCustomerId)) {
        toast.error(t('A registered customer is required for {{method}} payments.', { 
            method: t(formData.payment_method.charAt(0).toUpperCase() + formData.payment_method.slice(1).replace('_', ' ')) 
        }));
        return;
      }
    }

    // Prevent partial payment for Walk-in customers
    if (String(formData.customer_id) === String(defaultCustomerId) && totalPaid < Number(grandTotal.toFixed(2))) {
      toast.error(t('Partial payments are not allowed for Walk-in customers. Full payment is required.'));
      return;
    }

    // Ensure cash payment is sufficient for cash transactions
    // if (formData.payment_method === 'cash' && Number(formData.cash_payment || 0) < Number(grandTotal.toFixed(2))) {
    //   toast.error(t('Cash paid must be equal to or greater than the total amount.'));
    //   return;
    // }

    // Require bank account for Card or Bank Transfer
    if (['card', 'bank_transfer'].includes(formData.payment_method)) {
      if (!formData.finance_account_id) {
        toast.error(t('Please select a bank account for {{method}} payment.', {
            method: t(formData.payment_method.charAt(0).toUpperCase() + formData.payment_method.slice(1).replace('_', ' '))
        }));
        return;
      }
    }

    const paidAmountForPayload = formData.payments && formData.payments.length > 0
      ? formData.payments.reduce((sum: number, p: any) => sum + Number(p.amount), 0)
      : Number(formData.cash_payment || 0);

    const payload = {
      ...formData,
      customer_id: formData.customer_id || defaultCustomerId,
      sub_total: subTotal,
      discount_value: Number(formData.discount_value || 0),
      discount_amount: totalDiscount,
      delivery_charge: Number(formData.delivery_charge || 0),
      points_redeemed: isRedeemingPoints ? Number(pointsToRedeem || 0) : 0,
      points_redeemed_amount: isRedeemingPoints ? pointsDiscount : 0,
      total_amount: grandTotal,
      paid_amount: paidAmountForPayload,
      items: items,
      payments: formData.payments && formData.payments.length > 0 
        ? formData.payments 
        : [{
            payment_method: formData.payment_method,
            amount: paidAmountForPayload,
            finance_account_id: formData.finance_account_id,
            cheque_no: formData.cheque_no,
            cheque_date: formData.cheque_date,
            cheque_bank: formData.cheque_bank,
            cheque_branch: formData.cheque_branch
          }]
    };

    toast.loading(t('Creating Sale...'));
    setIsSubmitting(true);

    const calculatedPointsEarned = pointsRule && selectedCustomer?.type === 'privileged_customer'
      ? Math.floor((grandTotal / Number(pointsRule.currency_amount)) * Number(pointsRule.points_earned) * 100) / 100
      : 0;

    const calculatedNewBalance = selectedCustomer
      ? Math.max(0, Number(selectedCustomer.points || 0) - (isRedeemingPoints ? Number(pointsToRedeem || 0) : 0) + calculatedPointsEarned)
      : 0;

    // Snapshot current sale data before reset for the receipt
    const saleSnapshot = {
      saleNumber: formData.sale_no,
      date: formData.sale_date,
      customer: selectedCustomer?.name ?? t('Walk-in Customer'),
      cashier: '',
      items: items.map((item) => ({
        product_id: item.product_id,
        product_name: item.name,
        product_sku: item.code ?? '',
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount_type: item.discount_type,
        discount_value: item.discount_value,
        discount_amount: item.discount_amount,
        tax_rate: 0,
        tax_amount: 0,
        line_total: item.total,
      })),
      subtotal: subTotal,
      itemDiscount: items.reduce((s, i) => s + i.discount_amount, 0),
      orderDiscount: totalDiscount - items.reduce((s, i) => s + i.discount_amount, 0),
      points_redeemed: isRedeemingPoints ? Number(pointsToRedeem || 0) : 0,
      points_redeemed_amount: isRedeemingPoints ? pointsDiscount : 0,
      points_earned: calculatedPointsEarned,
      customer_points_balance: calculatedNewBalance,
      tax: 0,
      total: grandTotal,
      paymentMode: formData.payments.length > 1 ? 'split' : (formData.payment_method || 'cash'),
      cashAmount: formData.payments.length > 1
        ? formData.payments.filter(p => p.payment_method === 'cash').reduce((s, p) => s + p.amount, 0)
        : (formData.payment_method === 'cash' ? Number(formData.cash_payment || formData.paid_amount) : 0),
      cardAmount: formData.payments.length > 1
        ? formData.payments.filter(p => p.payment_method === 'card').reduce((s, p) => s + p.amount, 0)
        : (formData.payment_method === 'card' ? Number(formData.paid_amount) : 0),
      bankAmount: formData.payments.length > 1
        ? formData.payments.filter(p => p.payment_method === 'bank_transfer').reduce((s, p) => s + p.amount, 0)
        : (formData.payment_method === 'bank_transfer' ? Number(formData.paid_amount) : 0),
      totalPaid: totalPaid,
      changeDue: Math.max(0, totalPaid - grandTotal),
      issuedBy: formData.issued_by,
      checkedBy: formData.checked_by,
      posSession: activeSession,
      globalSettings: null,
    };

    router.post(route('sales.store'), payload, {
      preserveState: true,
      onSuccess: (page: any) => {
        toast.dismiss();
        toast.success(t('Sale created successfully'));
        setIsSubmitting(false);

        const lastSale = page.props.flash?.last_sale;
        let actualSnapshot = saleSnapshot;
        if (lastSale) {
            actualSnapshot = {
                ...saleSnapshot,
                saleNumber: lastSale.sale_no,
                date: lastSale.sale_date || saleSnapshot.date,
                items: lastSale.items.map((item: any) => ({
                    product_id: item.product_id,
                    product_name: item.product?.name || item.name,
                    product_sku: item.product?.sku || item.code || '',
                    quantity: Number(item.quantity),
                    unit_price: Number(item.unit_price),
                    discount_type: item.discount_type,
                    discount_value: Number(item.discount_value),
                    discount_amount: Number(item.discount_amount),
                    tax_rate: 0,
                    tax_amount: 0,
                    line_total: Number(item.total_price) - Number(item.discount_amount),
                })),
                subtotal: Number(lastSale.sub_total),
                itemDiscount: lastSale.items.reduce((s: number, i: any) => s + Number(i.discount_amount), 0),
                orderDiscount: Number(lastSale.discount_amount) - lastSale.items.reduce((s: number, i: any) => s + Number(i.discount_amount), 0),
                total: Number(lastSale.total_amount),
                totalPaid: Number(lastSale.paid_amount),
                changeDue: Math.max(0, Number(lastSale.paid_amount) - Number(lastSale.total_amount)),
                issuedBy: lastSale.issued_by,
                checkedBy: lastSale.checked_by,
            };
        }
        setReceiptData(actualSnapshot);

        if (formData.auto_print && isElectron()) {
            handleDirectPrint(actualSnapshot);
        } else {
            setReceiptOpen(true);
        }

        setItems([]);
        setIsRedeemingPoints(false);
        setPointsToRedeem('0');
        setFormData({
          sale_no: '', // Will be regenerated by controller/nextSaleNo
          customer_id: String(defaultCustomerId),
          branch_id: String(currentBranchId || (branches?.[0]?.id ?? '')),
          sale_date: new Date().toISOString().split('T')[0],
          paid_amount: 0,
          cash_payment: 0,
          discount_type: 'percentage',
          discount_value: 0,
          delivery_charge: 0,
          payment_method: 'cash',
          finance_account_id: '',
          cheque_no: '',
          cheque_date: '',
          cheque_bank: '',
          cheque_branch: '',
          status: 'completed',
          auto_print: formData.auto_print,
          issued_by: '',
          checked_by: '',
          payments: [],
        });
      },
      onError: (errors) => {
        toast.dismiss();
        setIsSubmitting(false);
        const errorMessage = typeof errors === 'object' ? Object.values(errors).flat().join(', ') : errors;
        toast.error(t('Failed to create sale: {{errors}}', { errors: errorMessage }));
      }
    });
  };

  return (
    <PageTemplate
      title={t('')}
      description={t('')}
      breadcrumbs={breadcrumbs}
      url="/sales/create"
      noPadding
    >
      <div className="flex flex-col h-[calc(100vh-100px)] bg-gray-50 overflow-hidden text-xs">
        {/* POS Header Info */}
        <div className="bg-white border-b px-3 py-1 flex items-center justify-between shadow-sm shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-primary/10 px-3 py-1.5 rounded-lg border border-primary/20 shadow-sm">
                <span className="text-[10px] uppercase font-black text-primary/60 tracking-wider">{t('Branch')}</span>
                <span className="text-sm font-black text-primary tracking-tight">
                    {branches.find((b: any) => String(b.id) === String(formData.branch_id))?.name}
                </span>
            </div>
            <div className="text-sm font-medium text-gray-500">
              {t('Items')}: <span className="text-gray-900">{items.reduce((acc, i) => acc + i.quantity, 0)}</span>
            </div>
            <div className="text-sm font-medium text-gray-500">
              {t('Total')}: <span className="text-gray-900 font-bold">Rs {grandTotal.toFixed(2)}</span>
            </div>

            <div className="h-6 w-px bg-gray-200 mx-1"></div>

            <div className="flex items-center gap-2">
              {isElectron() ? (
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 py-1 flex items-center gap-1.5">
                    <Monitor className="h-3 w-3" />
                    <span className="font-semibold text-[10px] uppercase tracking-wider">{t('Desktop Mode Ready')}</span>
                  </Badge>
                  
                  <div className="flex items-center gap-1 bg-gray-100 rounded-md px-2 py-1 border border-gray-200">
                    <Printer className="h-3 w-3 text-gray-500" />
                    <select 
                      className="bg-transparent border-none text-[10px] font-medium focus:ring-0 cursor-pointer"
                      value={selectedPrinter}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSelectedPrinter(val);
                        localStorage.setItem('qz_printer_name', val);
                        toast.success(t('Printer updated: {{name}}', { name: val }));
                      }}
                    >
                      <option value="">{t('Default Printer')}</option>
                      {availablePrinters.map((p: any) => (
                        <option key={p.name} value={p.name}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              ) : (
                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 py-1 flex items-center gap-1.5">
                  <span className="font-semibold text-[10px] uppercase tracking-wider">{t('Browser Mode')}</span>
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => router.visit(route('sales.index'))}>
              <ArrowLeft className="h-4 w-4 mr-2" /> {t('Back')}
            </Button>
            <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                    if (!document.fullscreenElement) {
                        document.documentElement.requestFullscreen().catch(err => {
                            toast.error(`Error attempting to enable full-screen mode: ${err.message}`);
                        });
                    } else {
                        document.exitFullscreen();
                    }
                }}
            >
              <Maximize className="h-4 w-4 mr-2" /> {t('Full Screen')}
            </Button>
            <Button variant="destructive" size="sm" onClick={() => setIsCloseModalOpen(true)}>
              <Power className="h-4 w-4 mr-2" /> {t('End Session')}
            </Button>
          </div>
        </div>

        {/* Input Bar */}
        <div className="bg-white p-4 border-b space-y-4 shadow-sm shrink-0">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
            {/* Customer Search */}
            <div className="md:col-span-7 space-y-2">
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <SearchableSelect 
                    value={formData.customer_id} 
                    onValueChange={(val) => {
                      handleFormChange('customer_id', val);
                      setIsRedeemingPoints(false);
                      setPointsToRedeem('0');
                    }}
                    options={localCustomers.map((c: any) => {
                      const isPrivileged = c.type === 'privileged_customer';
                      const parts = [];
                      if (c.phone) {
                        parts.push(c.phone);
                      }
                      if (isPrivileged && c.privileged_customer_number) {
                        parts.push(`#${c.privileged_customer_number}`);
                      }
                      return {
                        value: String(c.id),
                        label: isPrivileged ? `${c.name} ★` : c.name,
                        sublabel: parts.length > 0 ? parts.join(' | ') : undefined
                      };
                    })}
                    placeholder={t('Search and select customer...')}
                  />
                </div>
              {String(formData.customer_id) !== String(defaultCustomerId) && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-gray-400 hover:text-red-500"
                  onClick={() => handleFormChange('customer_id', String(defaultCustomerId))}
                  title={t('Reset to Walk-in')}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
              <Button variant="outline" size="icon" title={t('Add new Customer')} onClick={() => setIsCreateCustomerOpen(true)}>
                <UserPlus className="h-4 w-4" />
              </Button>
            </div>

            {/* Privileged Customer Points Info & Redemption Block */}
            {selectedCustomer?.type === 'privileged_customer' && pointsRule && (
              <div className="bg-emerald-50/70 border border-emerald-100/80 rounded-xl p-3 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-sm animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-start gap-2.5">
                  <div className="w-9 h-9 bg-emerald-500/10 rounded-lg flex items-center justify-center text-emerald-600 shrink-0">
                    <Gift className="h-5 w-5 animate-pulse" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                      {t('Privileged Loyalty Account')} 
                      <span className="bg-emerald-500/20 text-emerald-700 text-[9px] px-1.5 py-0.5 rounded-full font-bold">
                        #{selectedCustomer.privileged_customer_number || 'N/A'}
                      </span>
                    </div>
                    <div className="text-[11px] text-emerald-600/90 mt-0.5">
                      {t('Available Points')}: <span className="font-extrabold text-emerald-700">{Number(selectedCustomer.points || 0).toFixed(2)}</span> pts
                      <span className="mx-1 text-emerald-300">|</span>
                      {t('Value')}: <span className="font-extrabold text-emerald-700">Rs {pointsToCash(Number(selectedCustomer.points || 0)).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {Number(selectedCustomer.points || 0) > 0 && (
                  <div className="flex items-center gap-3 border-t md:border-t-0 border-emerald-100/50 pt-2.5 md:pt-0">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={isRedeemingPoints}
                        onChange={(e) => {
                          setIsRedeemingPoints(e.target.checked);
                          if (e.target.checked) {
                            const rate = Number(pointsRule.redemption_amount) / Number(pointsRule.redemption_points);
                            const pointsNeededForBill = subTotal / rate;
                            const initialPoints = Math.min(Number(selectedCustomer.points || 0), pointsNeededForBill);
                            setPointsToRedeem(initialPoints.toFixed(2));
                          } else {
                            setPointsToRedeem('0');
                          }
                        }}
                        className="h-4 w-4 rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="text-xs font-extrabold text-emerald-800">{t('Redeem Points')}</span>
                    </label>

                    {isRedeemingPoints && (
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          min="0"
                          max={Number(selectedCustomer.points || 0)}
                          step="0.01"
                          value={pointsToRedeem}
                          onChange={(e) => {
                            const val = e.target.value;
                            const numVal = Number(val) || 0;
                            const maxPoints = Number(selectedCustomer.points || 0);
                            
                            if (numVal > maxPoints) {
                              setPointsToRedeem(maxPoints.toFixed(2));
                            } else {
                              setPointsToRedeem(val);
                            }
                          }}
                          className="h-8 w-20 text-xs border-emerald-200/80 focus:ring-emerald-500/20 rounded-lg font-bold text-emerald-800 bg-white"
                        />
                        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest shrink-0">PTS</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

            {/* Date Selector */}
            <div className="md:col-span-5">
              <label className="text-[10px] uppercase font-bold text-gray-400 mb-1 block">{t('Sale Date')}</label>
              <Input 
                type="date" 
                className="h-10"
                value={formData.sale_date} 
                onChange={(e) => handleFormChange('sale_date', e.target.value)} 
                required 
              />
            </div>
          </div>
          
          {/* Item Search */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
            <div className="md:col-span-3">
              <label className="text-[10px] uppercase font-bold text-gray-400 mb-1 block">{t('Item Code / Barcode')}</label>
              <div className="relative">
                <Input 
                  ref={barcodeRef}
                  placeholder={t('Scan...')} 
                  className="pl-8"
                  value={entry.barcode}
                  onChange={(e) => {
                    setEntry(prev => ({ ...prev, barcode: e.target.value }));
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        handleBarcodeSearch(entry.barcode);
                    }
                  }}
                />
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
              </div>
            </div>

            <div className="md:col-span-5">
              <label className="text-[10px] uppercase font-bold text-gray-400 mb-1 block">{t('Item Name')}</label>
              <SearchableSelect 
                value={entry.productId} 
                onValueChange={(val) => {
                    const p = products.find((x: any) => String(x.id) === val);
                      if (p) {
                        setEntry(prev => ({ 
                            ...prev, 
                            productId: val, 
                            unitPrice: Number(p.price),
                            barcode: p.barcode || '',
                            batch_no: '',
                            expiry_date: ''
                        }));
                        
                        if (p.batches?.length === 1) {
                          setEntry(prev => ({ 
                            ...prev, 
                            batch_no: p.batches[0].batch_no,
                            expiry_date: p.batches[0].expiry_date || ''
                          }));
                          setTimeout(() => qtyRef.current?.focus(), 100);
                        } else if (p.batches?.length > 1) {
                          const firstBatch = p.batches[0];
                          setEntry(prev => ({ 
                            ...prev, 
                            batch_no: firstBatch.batch_no,
                            unitPrice: Number(firstBatch.unit_sales_price || p.price),
                            expiry_date: firstBatch.expiry_date || ''
                          }));
                          setSelectedProductForBatch(p);
                          setTimeout(() => setBatchModalOpen(true), 150);
                        } else {
                          setTimeout(() => qtyRef.current?.focus(), 100);
                        }
                    }
                }}
                options={products.filter((p: any) => Number(p.branch_stock) > 0).map((p: any) => ({
                    value: String(p.id),
                    label: `${p.name} ${p.generic_name?.name ? `(${p.generic_name.name})` : ''} - [${p.sku}]`
                }))}
                placeholder={t('Search by name...')}
              />
            </div>

            <div className="md:col-span-1">
              <label className="text-[10px] uppercase font-bold text-gray-400 mb-1 block">{t('Unit Price')}</label>
              <Input 
                type="number" 
                value={entry.unitPrice} 
                // readOnly
                className="bg-gray-50 cursor-not-allowed"
                onChange={(e) => setEntry(prev => ({ ...prev, unitPrice: Number(e.target.value) }))}
                onWheel={(e) => (e.target as HTMLInputElement).blur()}
              />
            </div>

            <div className="md:col-span-1">
              <label className="text-[10px] uppercase font-bold text-gray-400 mb-1 block">{t('Qty')}</label>
              <Input 
                ref={qtyRef}
                type="number" 
                value={entry.qty} 
                onChange={(e) => setEntry(prev => ({ ...prev, qty: Number(e.target.value) }))}
                onWheel={(e) => (e.target as HTMLInputElement).blur()}
                onKeyDown={(e) => { if (e.key === 'Enter') handleAddItem(); }}
              />
            </div>
            <div className="md:col-span-2 flex items-end gap-2">
              <Button className="flex-1 bg-primary hover:bg-primary/90 h-10" onClick={handleAddItem}>
                <Plus className="h-4 w-4 mr-1" /> {t('Add')}
              </Button>
              <Button variant="outline" className="h-10" onClick={() => setEntry({
                  barcode: '',
                  productId: '',
                  unitPrice: 0,
                  qty: 1,
                  discountType: 'none',
                  discountValue: 0,
                  batch_no: '',
                  expiry_date: ''
              })}>
                {t('Reset')}
              </Button>
            </div>
          </div>
        </div>

        {/* Main Table Area */}
        <div className="flex-1 p-4 bg-background min-h-0">
          <div className="bg-white rounded-2xl border border-primary/10 shadow-sm overflow-hidden flex flex-col h-full">
            <div className="p-4 border-b border-primary/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <ShoppingCart className="h-5 w-5 text-primary" />
                </div>
                <h2 className="font-bold text-gray-800">{t('Items List')}</h2>
              </div>
              <div className="flex items-center gap-4 bg-primary/5 p-2 px-4 rounded-xl border border-primary/10">
                <div className="text-xs">
                  <span className="text-primary font-bold">{t('Stock')}:</span> <span className="font-black ml-1">{selectedProduct?.branch_stock ? Number(selectedProduct.branch_stock).toFixed(2) : '0.00'}</span>
                </div>
                <div className="h-4 w-px bg-primary/20"></div>
                <div className="text-xs">
                  <span className="text-green-600 font-bold">{t('Available')}:</span> 
                  <span className="font-black ml-1">
                    {(() => {
                        const baseStock = selectedBatch ? Number(selectedBatch.balance) : (selectedProduct?.branch_stock ? Number(selectedProduct.branch_stock) : 0);
                        const inCart = items
                            .filter(i => i.product_id === selectedProduct?.id && (!entry.batch_no || i.batch_no === entry.batch_no))
                            .reduce((sum, i) => sum + i.quantity, 0);
                        return (baseStock - inCart).toFixed(2);
                    })()}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-auto">
              <Table>
                <TableHeader className="bg-secondary sticky top-0 z-10">
                  <TableRow className="hover:bg-transparent border-none">
                    <TableHead className="text-[11px] font-bold text-gray-800 uppercase px-4">{t('Item Code')}</TableHead>
                    <TableHead className="text-[11px] font-bold text-gray-800 uppercase">{t('Item Name')}</TableHead>
                    <TableHead className="text-[11px] font-bold text-gray-800 uppercase">{t('Batch No')}</TableHead>
                    <TableHead className="text-[11px] font-bold text-gray-800 uppercase text-center">{t('Expiry')}</TableHead>
                    <TableHead className="text-[11px] font-bold text-gray-800 uppercase text-right">{t('Sales Price')}</TableHead>
                    <TableHead className="text-[11px] font-bold text-gray-800 uppercase text-center">{t('Quantity')}</TableHead>
                    {/* <TableHead className="text-[11px] font-bold text-primary uppercase text-right">{t('Discount')}</TableHead> */}
                    <TableHead className="text-[11px] font-bold text-gray-800 uppercase text-right">{t('Total')}</TableHead>
                    <TableHead className="text-[11px] font-bold text-gray-800 uppercase text-center">{t('Action')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-[200px] text-center italic text-gray-400">
                        {t('No items added yet')}
                      </TableCell>
                    </TableRow>
                  ) : (
                    items.map((item, index) => (
                      <TableRow key={index} className="border-b border-gray-50 hover:bg-primary/5">
                        <TableCell className="font-medium text-gray-800 px-4">{item.code}</TableCell>
                        <TableCell className="font-medium text-gray-700">{item.name}</TableCell>
                        <TableCell className="font-medium text-gray-500">{item.batch_no || '-'}</TableCell>
                        <TableCell className="font-medium text-orange-600 text-center">
                          {item.expiry_date ? item.expiry_date.split('T')[0] : '-'}
                        </TableCell>
                        <TableCell className="text-right text-gray-900 font-bold">{item.unit_price.toFixed(2)}</TableCell>
                        <TableCell className="text-center font-bold">{item.quantity}</TableCell>
                        {/* <TableCell className="text-right text-orange-500 font-medium">
                            {item.discount_type !== 'none' ? (item.unit_price * item.quantity - item.total).toFixed(2) : '0.00'}
                        </TableCell> */}
                        <TableCell className="text-right font-black text-primary">{item.total.toFixed(2)}</TableCell>
                        <TableCell className="text-center">
                            <Button variant="ghost" size="icon" onClick={() => removeItem(index)} className="h-7 w-7 text-gray-300 hover:text-red-500">
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>

        {/* New POS Footer Layout */}
        <div className="bg-secondary p-4 grid grid-cols-12 gap-4 shrink-0">
            {/* Left Section: Payment */}
            <div className="col-span-8 space-y-2">
                <div className="bg-white rounded-2xl border border-primary/10 p-3 shadow-sm">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-primary uppercase tracking-widest mb-3">
                        <CreditCard className="h-3.5 w-3.5" /> {t('Payment Mode')}
                    </div>
                    <RadioGroup 
                        value={formData.payment_method} 
                        onValueChange={(val: string) => handleFormChange('payment_method', val)}
                        className="flex flex-wrap gap-x-6 gap-y-1.5"
                    >
                        <div className="flex items-center space-x-1.5">
                            <RadioGroupItem value="cash" id="cash" className="h-3.5 w-3.5 border-primary/30 text-primary" />
                            <Label htmlFor="cash" className="text-xs font-bold text-gray-700 cursor-pointer">
                                {t('Cash')} <span className="text-gray-400 text-[9px] ml-0.5">(F1)</span>
                            </Label>
                        </div>
                        <div className="flex items-center space-x-1.5">
                            <RadioGroupItem value="credit" id="credit" className="h-3.5 w-3.5 border-border" />
                            <Label htmlFor="credit" className="text-xs font-bold text-gray-700 cursor-pointer">
                                {t('Credit')} <span className="text-gray-400 text-[9px] ml-0.5">(F2)</span>
                            </Label>
                        </div>
                        <div className="flex items-center space-x-1.5">
                            <RadioGroupItem value="card" id="card" className="h-3.5 w-3.5 border-primary/30 text-primary" />
                            <Label htmlFor="card" className="text-xs font-bold text-gray-700 cursor-pointer">
                                {t('Card')} <span className="text-gray-400 text-[9px] ml-0.5">(F3)</span>
                            </Label>
                            {formData.payment_method === 'card' && (
                                <button onClick={() => setIsPaymentModalOpen(true)} className="p-1 rounded-full hover:bg-primary/10 text-primary transition-colors">
                                    <Settings className="h-3 w-3" />
                                </button>
                            )}
                        </div>
                        <div className="flex items-center space-x-1.5">
                            <RadioGroupItem value="cheque" id="cheque" className="h-3.5 w-3.5 border-border" />
                            <Label htmlFor="cheque" className="text-xs font-bold text-gray-700 cursor-pointer">
                                {t('Cheque')} <span className="text-gray-400 text-[9px] ml-0.5">(F4)</span>
                            </Label>
                            {formData.payment_method === 'cheque' && (
                                <button onClick={() => setIsChequeModalOpen(true)} className="p-1 rounded-full hover:bg-primary/10 text-primary transition-colors">
                                    <Settings className="h-3 w-3" />
                                </button>
                            )}
                        </div>
                        <div className="flex items-center space-x-1.5">
                            <RadioGroupItem value="bank_transfer" id="bank_transfer" className="h-3.5 w-3.5 border-border" />
                            <Label htmlFor="bank_transfer" className="text-xs font-bold text-gray-700 cursor-pointer">
                                {t('Bank')} <span className="text-gray-400 text-[9px] ml-0.5">(F5)</span>
                            </Label>
                            {formData.payment_method === 'bank_transfer' && (
                                <button onClick={() => setIsPaymentModalOpen(true)} className="p-1 rounded-full hover:bg-primary/10 text-primary transition-colors">
                                    <Settings className="h-3 w-3" />
                                </button>
                            )}
                        </div>
                        <div className="flex items-center space-x-1.5">
                            <RadioGroupItem value="split" id="split" className="h-3.5 w-3.5 border-border" />
                            <Label htmlFor="split" className="text-xs font-bold text-gray-700 cursor-pointer">
                                {t('Split')}
                            </Label>
                            {formData.payment_method === 'split' && (
                                <button onClick={() => setIsSplitPaymentModalOpen(true)} className="p-1 rounded-full hover:bg-primary/10 text-primary transition-colors">
                                    <Plus className="h-3 w-3" />
                                </button>
                            )}
                        </div>
                    </RadioGroup>
                </div>

                <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1">
                        <Label className="text-[10px] font-bold text-gray-500 uppercase ml-1">{t('Discount')}</Label>
                        <div className="flex gap-2">
                            <Input 
                                ref={discountRef}
                                type="number" 
                                value={formData.discount_value} 
                                onChange={(e) => handleFormChange('discount_value', Number(e.target.value))}
                                onWheel={(e) => (e.target as HTMLInputElement).blur()}
                                className="h-10 border-primary/10 rounded-lg focus:ring-primary/20 text-lg font-medium flex-1"
                            />
                            <div className="flex bg-primary/5 p-1 rounded-lg border border-primary/10 shrink-0 h-10">
                                <button 
                                    onClick={() => handleFormChange('discount_type', 'percentage')}
                                    className={`px-3 rounded-md text-[10px] font-bold transition-all ${formData.discount_type === 'percentage' ? 'bg-primary text-white shadow-sm' : 'text-primary hover:bg-primary/10'}`}
                                >
                                    %
                                </button>
                                <button 
                                    onClick={() => handleFormChange('discount_type', 'fixed')}
                                    onWheel={(e) => (e.target as HTMLInputElement).blur()}
                                    className={`px-3 rounded-md text-[10px] font-bold transition-all ${formData.discount_type === 'fixed' ? 'bg-primary text-white shadow-sm' : 'text-primary hover:bg-primary/10'}`}
                                >
                                    RS
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <Label className="text-[10px] font-bold text-gray-500 uppercase ml-1">{t('Delivery Charge')}</Label>
                        <Input
                            type="number"
                            value={formData.delivery_charge}
                            onChange={(e) => handleFormChange('delivery_charge', Number(e.target.value))}
                            onWheel={(e) => (e.target as HTMLInputElement).blur()}
                            className="h-10 border-primary/10 rounded-lg focus:ring-primary/20 text-lg font-medium"
                            min={0}
                            step="0.01"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-[10px] font-bold text-gray-500 uppercase ml-1">{t('Paid Amount')}</Label>
                        <Input 
                            ref={paidAmountRef}
                            type="number" 
                            value={formData.cash_payment} 
                            onChange={(e) => handleFormChange('cash_payment', Number(e.target.value))}
                            onWheel={(e) => (e.target as HTMLInputElement).blur()}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    saveButtonRef.current?.focus();
                                }
                            }}
                            className="h-10 border-primary/10 rounded-lg focus:ring-primary/20 text-lg font-medium"
                        />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4 bg-white rounded-xl border border-primary/10 p-3 shadow-sm">
                    <div className="space-y-1">
                        <Label className="text-[10px] font-bold text-gray-500 uppercase ml-1">{t('Issued By')}</Label>
                        <Input 
                            type="text" 
                            value={formData.issued_by} 
                            onChange={(e) => handleFormChange('issued_by', e.target.value)}
                            placeholder={t('Enter name')}
                            className="h-8 border-primary/10 rounded-lg focus:ring-primary/20 text-xs"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-[10px] font-bold text-gray-500 uppercase ml-1">{t('Checked By')}</Label>
                        <Input 
                            type="text" 
                            value={formData.checked_by} 
                            onChange={(e) => handleFormChange('checked_by', e.target.value)}
                            placeholder={t('Enter name')}
                            className="h-8 border-primary/10 rounded-lg focus:ring-primary/20 text-xs"
                        />
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-primary/10 p-3 flex items-center gap-3 shadow-sm">
                    <input 
                        type="checkbox" 
                        id="auto-print" 
                        checked={formData.auto_print} 
                        onChange={(e) => handleFormChange('auto_print', e.target.checked)}
                        className="h-4 w-4 rounded border-primary/20 text-primary focus:ring-primary"
                    />
                    <label htmlFor="auto-print" className="text-sm font-bold text-primary">
                        {t('Auto-print receipt after saving')}
                    </label>
                </div>
            </div>

            {/* Right Section: Order Summary */}
            <div className="col-span-4 space-y-3">
                <div className="bg-secondary rounded-2xl border border-primary/20 p-4 shadow-sm relative overflow-hidden">
                    {/* <h3 className="text-primary font-bold text-base mb-2">{t('Order Summary')}</h3> */}
                    
                    {(['credit', 'cheque', 'bank_transfer'].includes(formData.payment_method) || (formData.cash_payment > 0 && formData.cash_payment < grandTotal)) && (
                        <div className="bg-orange-50 border border-orange-100 rounded-lg p-1.5 px-2 mb-3 animate-in fade-in slide-in-from-top-1">
                            <div className="text-[8px] font-bold text-orange-600 uppercase flex items-center gap-1.5">
                                <span className="w-1 h-1 bg-orange-600 rounded-full animate-pulse"></span>
                                {String(formData.customer_id) === String(defaultCustomerId) 
                                    ? t('Registered customer required for this payment method')
                                    : t('Customer linked for credit/partial payment')}
                            </div>
                        </div>
                    )}

                    <div className="space-y-2">
                        <div className="flex justify-between items-center text-xs">
                            <span className="font-medium text-gray-500">{t('Subtotal')}:</span>
                            <span className="font-bold text-gray-700">{subTotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                            <span className="font-medium text-gray-500">{t('Discount')}:</span>
                            <span className="font-bold text-red-500">-{ totalDiscount.toFixed(2) }</span>
                        </div>
                        {Number(formData.delivery_charge || 0) > 0 && (
                            <div className="flex justify-between items-center text-xs">
                                <span className="font-medium text-gray-500">{t('Delivery Charge')}:</span>
                                <span className="font-bold text-blue-600">+{Number(formData.delivery_charge).toFixed(2)}</span>
                            </div>
                        )}
                        {pointsDiscount > 0 && (
                            <div className="flex justify-between items-center text-xs text-emerald-600 animate-in fade-in slide-in-from-top-1">
                                <span className="font-bold">{t('Redeemed Points')} ({Number(pointsToRedeem).toFixed(2)} pts):</span>
                                <span className="font-black">-{ pointsDiscount.toFixed(2) }</span>
                            </div>
                        )}
                        <div className="h-px bg-primary/10 my-1"></div>
                        <div className="flex justify-between items-center pt-1">
                            <span className="text-base font-bold text-primary">{t('Total')}:</span>
                            <span className="text-xl font-black text-primary">{grandTotal.toFixed(2)}</span>
                        </div>

                        {['card', 'bank_transfer'].includes(formData.payment_method) && (
                            <div className="flex justify-between items-center text-[10px] text-gray-500 bg-white/50 p-2 rounded-lg border border-primary/5 mt-2">
                                <div className="flex flex-col">
                                    <span className="font-bold text-primary uppercase text-[8px] tracking-widest">{t('Account')}</span>
                                    <span className="font-bold truncate max-w-[120px]">
                                        {financeAccounts.find((a: any) => String(a.id) === String(formData.finance_account_id))?.name || <span className="text-red-400">{t('No Account Selected')}</span>}
                                    </span>
                                </div>
                                <button onClick={() => setIsPaymentModalOpen(true)} className="text-[9px] font-black text-primary hover:bg-primary/10 p-1 px-2 rounded border border-primary/20 bg-primary/5">
                                    {t('Change')}
                                </button>
                            </div>
                        )}

                        {formData.payment_method === 'cheque' && (
                            <div className="flex justify-between items-center text-[10px] text-gray-500 bg-white/50 p-2 rounded-lg border border-primary/5 mt-2">
                                <div className="flex flex-col">
                                    <span className="font-bold text-primary uppercase text-[8px] tracking-widest">{t('Cheque Details')}</span>
                                    <span className="font-bold">
                                        {formData.cheque_no ? `#${formData.cheque_no}` : <span className="text-red-400">{t('No Details Entered')}</span>}
                                    </span>
                                </div>
                                <button onClick={() => setIsChequeModalOpen(true)} className="text-[9px] font-black text-primary hover:bg-primary/10 p-1 px-2 rounded border border-primary/20 bg-primary/5">
                                    {t('Edit')}
                                </button>
                            </div>
                        )}
                        
                        {formData.payments && formData.payments.length > 0 && (
                            <div className="mt-2 space-y-1">
                                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t('Payments')}</div>
                                {formData.payments.map((payment: any, index: number) => (
                                    <div key={index} className="flex justify-between items-center bg-white/50 p-1.5 rounded-lg border border-primary/5">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-bold text-primary uppercase">{t(payment.payment_method)}</span>
                                            {payment.cheque_no && <span className="text-[8px] text-gray-500">#{payment.cheque_no}</span>}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-black text-primary">Rs {Number(payment.amount).toFixed(2)}</span>
                                            <button onClick={() => removePayment(index)} className="text-red-400 hover:text-red-600">
                                                <X className="h-3 w-3" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="flex justify-between items-center mt-2">
                            <span className="text-sm font-bold text-primary">{t('Paid')}:</span>
                            <span className="text-base font-black text-primary">{totalPaid.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-bold text-primary">{t('Balance')}:</span>
                            <span className="text-base font-black text-primary">{(grandTotal - totalPaid).toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                <div className="flex gap-2 mt-2 w-full">
                    <Button 
                        ref={saveButtonRef}
                        className="flex-[2] h-11 rounded-lg bg-primary hover:bg-primary/90 text-white font-bold text-sm shadow-md shadow-primary/10 flex items-center justify-center gap-1.5"
                        onClick={handleSubmit}
                        disabled={isSubmitting || items.length === 0}
                    >
                        <ShoppingCart className="h-4 w-4" /> {isSubmitting ? t('Processing...') : t('Save Sale (F12)')}
                    </Button>

                    <Button 
                        variant="outline" 
                        className="flex-1 h-11 rounded-lg bg-white border-gray-200 text-gray-800 font-bold text-xs shadow-sm hover:bg-gray-50"
                        onClick={() => setIsRePrintModalOpen(true)}
                    >
                        {t('Bill Re Print')}
                    </Button>
                </div>
            </div>
        </div>
      </div>

      <BatchSelectionModal
        isOpen={batchModalOpen}
        onClose={() => {
          setBatchModalOpen(false);
          setTimeout(() => qtyRef.current?.focus(), 100);
        }}
        product={computedProductForBatch}
        onSelect={(batch) => {
          setEntry(prev => ({ 
            ...prev, 
            batch_no: batch.batch_no,
            expiry_date: batch.expiry_date || '',
            unitPrice: batch.unit_sales_price ? Number(batch.unit_sales_price) : prev.unitPrice
          }));
          setBatchModalOpen(false);
          setTimeout(() => qtyRef.current?.focus(), 100);
        }}
      />

      <CrudFormModal
        isOpen={isCloseModalOpen}
        onClose={() => setIsCloseModalOpen(false)}
        onSubmit={handleCloseSession}
        formConfig={{
          fields: [
            { 
                name: 'closing_balance', 
                label: t('Closing Balance'), 
                type: 'number', 
                step: '0.01', 
                required: true,
                defaultValue: '0.00'
            },
            { name: 'notes', label: t('Notes'), type: 'textarea' }
          ],
          modalSize: 'lg'
        }}
        initialData={closeSessionData}
        title={t('End POS Session')}
        mode="create"
      />

      <CrudFormModal
        isOpen={isChequeModalOpen}
        onClose={() => setIsChequeModalOpen(false)}
        onSubmit={(data: any) => {
            setFormData(prev => ({ ...prev, ...data }));
            setIsChequeModalOpen(false);
        }}
        formConfig={{
          fields: [
            { 
                name: 'cheque_no', 
                label: t('Cheque No'), 
                type: 'text',
                required: true,
                row: 1,
                width: 'calc(50% - 0.5rem)'
            },
            { 
                name: 'cheque_date', 
                label: t('Cheque Date'), 
                type: 'date',
                required: true,
                row: 1,
                width: 'calc(50% - 0.5rem)'
            },
            { 
                name: 'cheque_bank', 
                label: t('Bank Name'), 
                type: 'text',
                required: true,
                row: 2,
                width: 'calc(50% - 0.5rem)'
            },
            { 
                name: 'cheque_branch', 
                label: t('Branch Name'), 
                type: 'text',
                required: true,
                row: 2,
                width: 'calc(50% - 0.5rem)'
            },
            { 
                name: 'cash_payment', 
                label: t('Paid Amount'), 
                type: 'number',
                required: true 
            }
          ],
          modalSize: 'lg'
        }}
        initialData={{
            ...formData,
            cash_payment: formData.cash_payment || grandTotal
        }}
        title={t('Cheque Payment Details')}
        mode="create"
      />

      <CrudFormModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onSubmit={(data: any) => {
            setFormData(prev => ({ ...prev, ...data }));
            setIsPaymentModalOpen(false);
        }}
        formConfig={{
          fields: [
            { 
                name: 'finance_account_id', 
                label: t('Bank / Account'), 
                type: 'select',
                required: true,
                options: financeAccounts.map((account: any) => ({
                    value: String(account.id),
                    label: `${account.name} (${account.account_type})`
                }))
            },
            { 
                name: 'cash_payment', 
                label: t('Paid Amount'), 
                type: 'number',
                required: true 
            }
          ],
          modalSize: 'lg'
        }}
        initialData={{
            finance_account_id: formData.finance_account_id,
            cash_payment: formData.cash_payment || grandTotal
        }}
        title={t('Payment Details')}
        mode="create"
      />

      <CrudFormModal
        isOpen={isSplitPaymentModalOpen}
        onClose={() => setIsSplitPaymentModalOpen(false)}
        onSubmit={(data: any) => {
            addSplitPayment(data);
        }}
        formConfig={{
          fields: [
            { 
                name: 'payment_method', 
                label: t('Method'), 
                type: 'select',
                required: true,
                options: [
                    { value: 'cash', label: t('Cash') },
                    { value: 'card', label: t('Card') },
                    { value: 'cheque', label: t('Cheque') },
                    { value: 'bank_transfer', label: t('Bank Transfer') }
                ]
            },
            { 
                name: 'amount', 
                label: t('Amount'), 
                type: 'number',
                required: true 
            },
            { 
                name: 'finance_account_id', 
                label: t('Bank / Account'), 
                type: 'select',
                conditional: (mode, data) => ['card', 'bank_transfer'].includes(data.payment_method),
                required: true,
                options: financeAccounts.map((account: any) => ({
                    value: String(account.id),
                    label: `${account.name} (${account.account_type})`
                }))
            },
            { 
                name: 'cheque_no', 
                label: t('Cheque No'), 
                type: 'text',
                conditional: (mode, data) => data.payment_method === 'cheque',
                required: true,
                row: 1,
                width: 'calc(50% - 0.5rem)'
            },
            { 
                name: 'cheque_date', 
                label: t('Cheque Date'), 
                type: 'date',
                conditional: (mode, data) => data.payment_method === 'cheque',
                required: true,
                row: 1,
                width: 'calc(50% - 0.5rem)'
            },
            { 
                name: 'cheque_bank', 
                label: t('Bank Name'), 
                type: 'text',
                conditional: (mode, data) => data.payment_method === 'cheque',
                required: true,
                row: 2,
                width: 'calc(50% - 0.5rem)'
            },
            { 
                name: 'cheque_branch', 
                label: t('Branch Name'), 
                type: 'text',
                conditional: (mode, data) => data.payment_method === 'cheque',
                required: true,
                row: 2,
                width: 'calc(50% - 0.5rem)'
            }
          ],
          modalSize: 'lg'
        }}
        initialData={{
            payment_method: 'cash',
            amount: grandTotal - totalPaid
        }}
        title={t('Add Payment Method')}
        mode="create"
      />

      <CrudFormModal
        isOpen={isRePrintModalOpen}
        onClose={() => setIsRePrintModalOpen(false)}
        onSubmit={handleRePrintSearch}
        formConfig={{
          fields: [
            { 
                name: 'sale_no', 
                label: t('Sale Number'), 
                type: 'text',
                required: true,
                placeholder: 'S-yymmdd-000'
            }
          ],
          modalSize: 'md'
        }}
        initialData={{ sale_no: '' }}
        title={t('Re-print Bill')}
        mode="create"
      />

      <PosReceipt
        open={receiptOpen}
        autoPrint={formData.auto_print}
        onClose={() => setReceiptOpen(false)}
        onNewSale={() => setReceiptOpen(false)}
        receiptData={receiptData}
        formatCurrency={(v) => `Rs ${Number(v).toFixed(2)}`}
      />

      {/* Quick Create Customer Modal */}
      {isCreateCustomerOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60">
          <div className="bg-white rounded-2xl shadow-2xl w-[460px] max-w-[95vw] overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <div className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-primary" />
                <span className="text-base font-semibold text-gray-800">{t('New Customer')}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsCreateCustomerOpen(false);
                  setNewCustomerErrors({});
                  setNewCustomerForm({
                    name: '',
                    phone: '',
                    email: '',
                    address: '',
                    type: 'customer',
                    privileged_customer_number: '',
                  });
                }}
                className="p-1.5 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleQuickCreateCustomer} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-1">
                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    {t('Full Name')} <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={newCustomerForm.name}
                    onChange={(e) => setNewCustomerForm(p => ({ ...p, name: e.target.value }))}
                    placeholder={t('Enter customer name')}
                    className={newCustomerErrors.name ? 'border-red-500' : ''}
                    autoFocus
                  />
                  {newCustomerErrors.name && <p className="text-xs text-red-500">{newCustomerErrors.name}</p>}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    {t('Phone')} <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={newCustomerForm.phone}
                    onChange={(e) => setNewCustomerForm(p => ({ ...p, phone: e.target.value }))}
                    placeholder={t('0771234567')}
                    className={newCustomerErrors.phone ? 'border-red-500' : ''}
                  />
                  {newCustomerErrors.phone && <p className="text-xs text-red-500">{newCustomerErrors.phone}</p>}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    {t('Email')}
                  </label>
                  <Input
                    type="email"
                    value={newCustomerForm.email}
                    onChange={(e) => setNewCustomerForm(p => ({ ...p, email: e.target.value }))}
                    placeholder={t('Optional')}
                    className={newCustomerErrors.email ? 'border-red-500' : ''}
                  />
                  {newCustomerErrors.email && <p className="text-xs text-red-500">{newCustomerErrors.email}</p>}
                </div>

                <div className="col-span-2 space-y-1">
                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    {t('Address')}
                  </label>
                  <Input
                    value={newCustomerForm.address}
                    onChange={(e) => setNewCustomerForm(p => ({ ...p, address: e.target.value }))}
                    placeholder={t('Optional')}
                  />
                </div>

                <div className="col-span-2 flex items-center gap-2 py-1">
                  <input
                    type="checkbox"
                    id="quick_is_privileged"
                    checked={newCustomerForm.type === 'privileged_customer'}
                    onChange={(e) => {
                      const isChecked = e.target.checked;
                      setNewCustomerForm(p => ({
                        ...p,
                        type: isChecked ? 'privileged_customer' : 'customer',
                        privileged_customer_number: isChecked ? p.privileged_customer_number : ''
                      }));
                      if (!isChecked) {
                        setNewCustomerErrors(prev => ({ ...prev, privileged_customer_number: '' }));
                      }
                    }}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer transition-all"
                  />
                  <label htmlFor="quick_is_privileged" className="text-xs font-bold text-gray-700 cursor-pointer select-none">
                    {t('Register as Privileged Customer')}
                  </label>
                </div>

                {newCustomerForm.type === 'privileged_customer' && (
                  <div className="col-span-2 space-y-1 animate-in fade-in slide-in-from-top-2 duration-200">
                    <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide flex items-center gap-1">
                      {t('Privileged Customer Number')} <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={newCustomerForm.privileged_customer_number}
                      onChange={(e) => setNewCustomerForm(p => ({ ...p, privileged_customer_number: e.target.value }))}
                      placeholder={t('Enter privileged customer number')}
                      className={newCustomerErrors.privileged_customer_number ? 'border-red-500 focus-visible:ring-red-500/20' : 'focus-visible:ring-primary/20'}
                      autoFocus
                    />
                    {newCustomerErrors.privileged_customer_number && (
                      <p className="text-xs text-red-500 animate-in fade-in duration-150">
                        {newCustomerErrors.privileged_customer_number}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setIsCreateCustomerOpen(false);
                    setNewCustomerErrors({});
                    setNewCustomerForm({
                      name: '',
                      phone: '',
                      email: '',
                      address: '',
                      type: 'customer',
                      privileged_customer_number: '',
                    });
                  }}
                >
                  {t('Cancel')}
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-primary hover:bg-primary/90 text-white font-semibold"
                  disabled={isCreatingCustomer}
                >
                  {isCreatingCustomer ? t('Creating...') : t('Create Customer')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageTemplate>
  );
}



