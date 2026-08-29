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
  CreditCard,
  ShoppingCart,
  Plus,
  Trash2,
  FileText,
  Landmark,
  Save,
  X,
  Gift
} from 'lucide-react';
import { toast } from '@/components/custom-toast';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import SearchableSelect from '@/components/ui/searchable-select';

type SaleItem = {
  id?: number;
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

interface SalesFormData {
  sale_no: string;
  customer_id: string;
  branch_id: string;
  sale_date: string;
  status: string;
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
  auto_print: boolean;
}

export default function SaleEdit() {
  const { t } = useTranslation();
  const { 
    sale,
    customers = [], 
    branches = [], 
    products = [], 
    statuses = [],
    discountTypes = [],
    financeAccounts = []
  } = usePage().props as any;

  // Local points states and settings
  const [isRedeemingPoints, setIsRedeemingPoints] = useState(Number(sale.points_redeemed || 0) > 0);
  const [pointsToRedeem, setPointsToRedeem] = useState(Number(sale.points_redeemed || 0).toFixed(2));

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isChequeModalOpen, setIsChequeModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  
  const defaultCustomerId = customers.find((c: any) => c.name.toLowerCase().includes('walk-in'))?.id ?? '';

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
  const [formData, setFormData] = useState<SalesFormData>({
    sale_no: sale.sale_no,
    customer_id: sale.customer_id?.toString() ?? '',
    branch_id: sale.branch_id?.toString() ?? '',
    sale_date: sale.sale_date,
    status: sale.status,
    paid_amount: Number(sale.paid_amount || 0),
    cash_payment: Number(sale.paid_amount || 0),
    discount_type: sale.discount_type || 'percentage',
    discount_value: Number(sale.discount_value || 0),
    delivery_charge: Number(sale.delivery_charge || 0),
    payment_method: sale.payment_method || 'cash',
    finance_account_id: sale.finance_account_id?.toString() ?? '',
    cheque_no: sale.cheque_no ?? '',
    cheque_date: sale.cheque_date ? sale.cheque_date.split('T')[0] : '',
    cheque_bank: sale.cheque_bank ?? '',
    cheque_branch: sale.cheque_branch ?? '',
    auto_print: true,
  });

  const selectedCustomer = useMemo(() => {
    return localCustomers.find((c: any) => String(c.id) === String(formData.customer_id));
  }, [localCustomers, formData.customer_id]);

  // Original customer points pool includes points already redeemed in this specific transaction
  const availableCustomerPoints = useMemo(() => {
    if (!selectedCustomer) return 0;
    const basePoints = Number(selectedCustomer.points || 0);
    if (String(selectedCustomer.id) === String(sale.customer_id)) {
      return basePoints + Number(sale.points_redeemed || 0);
    }
    return basePoints;
  }, [selectedCustomer, sale]);

  const [items, setItems] = useState<SaleItem[]>(sale.items.map((item: any) => ({
      ...item,
      code: item.product?.sku || item.product?.barcode || item.product_id,
      name: item.product?.name || 'Unknown',
      total: Number(item.total_price) - Number(item.discount_amount),
      our_price: item.product?.detailsPrices?.find((p: any) => p.unit_type === 'Our Price')?.price || 0,
      expiry_date: item.expiry_date || '',
  })));
  
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
    if (confirm(t('Are you sure you want to clear all changes?'))) {
      setIsRedeemingPoints(Number(sale.points_redeemed || 0) > 0);
      setPointsToRedeem(Number(sale.points_redeemed || 0).toFixed(2));
      setFormData({
        sale_no: sale.sale_no,
        customer_id: sale.customer_id?.toString() ?? '',
        branch_id: sale.branch_id?.toString() ?? '',
        sale_date: sale.sale_date,
        status: sale.status,
        paid_amount: Number(sale.paid_amount || 0),
        cash_payment: Number(sale.paid_amount || 0),
        discount_type: sale.discount_type || 'percentage',
        discount_value: Number(sale.discount_value || 0),
        delivery_charge: Number(sale.delivery_charge || 0),
        payment_method: sale.payment_method || 'cash',
        finance_account_id: sale.finance_account_id?.toString() ?? '',
        cheque_no: sale.cheque_no ?? '',
        cheque_date: sale.cheque_date ? sale.cheque_date.split('T')[0] : '',
        cheque_bank: sale.cheque_bank ?? '',
        cheque_branch: sale.cheque_branch ?? '',
        auto_print: true,
      });
      setItems(sale.items.map((item: any) => ({
          ...item,
          code: item.product?.sku || item.product?.barcode || item.product_id,
          name: item.product?.name || 'Unknown',
          total: Number(item.total_price) - Number(item.discount_amount),
          our_price: item.product?.detailsPrices?.find((p: any) => p.unit_type === 'Our Price')?.price || 0,
          expiry_date: item.expiry_date || '',
      })));
      toast.success(t('Changes cleared successfully'));
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
  }, [items, formData, isCreateCustomerOpen, handleClearForm, sale, toggleFullScreen]);

  const handleFormChange = (name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'payment_method') {
        if (value === 'cheque') {
            setIsChequeModalOpen(true);
        } else if (['card', 'bank_transfer'].includes(value)) {
            setIsPaymentModalOpen(true);
        }
    }
  };

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
    return Math.max(0, subTotal - totalDiscount - pointsDiscount) + Number(formData.delivery_charge || 0);
  }, [subTotal, totalDiscount, pointsDiscount, formData.delivery_charge]);

  const handleBarcodeSearch = (barcode: string) => {
    const searchTerm = barcode.trim().toLowerCase();
    if (!searchTerm) return;

    const product = products.find((p: any) => 
        (p.barcode && String(p.barcode).toLowerCase() === searchTerm) || 
        String(p.id) === searchTerm || 
        (p.sku && String(p.sku).toLowerCase() === searchTerm) ||
        p.name.toLowerCase().includes(searchTerm)
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
        setSelectedProductForBatch(product);
        setTimeout(() => setBatchModalOpen(true), 150);
      } else {
        setTimeout(() => qtyRef.current?.focus(), 100);
      }
    } else {
      toast.error(t('Product not found or out of stock'));
    }
  };

  const handleAddItem = () => {
    if (!entry.productId) return;
    
    const product = products.find((p: any) => String(p.id) === entry.productId);
    if (!product) return;

    const base = Number(entry.qty) * Number(entry.unitPrice);
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
        const newBase = newQty * Number(existingItem.unit_price);
        let newDiscounted = newBase;
        
        if (existingItem.discount_type === 'percentage') {
          newDiscounted = newBase - (newBase * Number(existingItem.discount_value)) / 100;
        } else if (existingItem.discount_type === 'fixed') {
          newDiscounted = newBase - Math.min(Number(existingItem.discount_value), newBase);
        }

        updatedItems[existingItemIndex] = {
          ...existingItem,
          quantity: newQty,
          discount_amount: newBase - newDiscounted,
          total: newDiscounted
        };
        return updatedItems;
      }
      return [...prev, newItem];
    });

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

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
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

    const paidAmountForPayload = Number(formData.cash_payment || 0);

    const payload = {
      ...formData,
      sub_total: subTotal,
      discount_value: Number(formData.discount_value || 0),
      discount_amount: totalDiscount,
      points_redeemed: isRedeemingPoints ? Number(pointsToRedeem || 0) : 0,
      points_redeemed_amount: isRedeemingPoints ? pointsDiscount : 0,
      delivery_charge: Number(formData.delivery_charge || 0),
      total_amount: grandTotal,
      paid_amount: paidAmountForPayload,
      items: items,
    };

    toast.loading(t('Updating Sale...'));
    setIsSubmitting(true);

    router.put(route('sales.update', sale.id), payload, {
      onSuccess: () => {
        toast.dismiss();
        setIsSubmitting(false);
        toast.success(t('Sale updated successfully'));
      },
      onError: (errors) => {
        toast.dismiss();
        setIsSubmitting(false);
        const errorMessage = typeof errors === 'object' ? Object.values(errors).flat().join(', ') : errors;
        toast.error(t('Failed to update: {{errors}}', { errors: errorMessage }));
      }
    });
  };

  const breadcrumbs = [
    { title: t('Dashboard'), href: route('dashboard') },
    { title: t('Sales'), href: route('sales.index') },
    { title: t('Edit Sale') },
    { title: sale.sale_no },
  ];

  return (
    <PageTemplate
      title={`${t('Edit Sale')}: ${sale.sale_no}`}
      description={t('Update sales transaction details')}
      breadcrumbs={breadcrumbs}
      url={`/sales/${sale.id}/edit`}
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
              {t('Items')}: <span className="text-gray-900">{items.reduce((acc, i) => acc + Number(i.quantity), 0)}</span>
            </div>
            <div className="text-sm font-medium text-gray-500">
              {t('Total')}: <span className="text-gray-900 font-bold">Rs {grandTotal.toFixed(2)}</span>
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
                    onClick={() => {
                      handleFormChange('customer_id', String(defaultCustomerId));
                      setIsRedeemingPoints(false);
                      setPointsToRedeem('0');
                    }}
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
                        {t('Available Points')}: <span className="font-extrabold text-emerald-700">{Number(availableCustomerPoints).toFixed(2)}</span> pts
                        <span className="mx-1 text-emerald-300">|</span>
                        {t('Value')}: <span className="font-extrabold text-emerald-700">Rs {pointsToCash(Number(availableCustomerPoints)).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {Number(availableCustomerPoints) > 0 && (
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
                              const initialPoints = Math.min(Number(availableCustomerPoints), pointsNeededForBill);
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
                            max={Number(availableCustomerPoints)}
                            step="0.01"
                            value={pointsToRedeem}
                            onChange={(e) => {
                              const val = e.target.value;
                              const numVal = Number(val) || 0;
                              const maxPoints = Number(availableCustomerPoints);
                              
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
              <Select 
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
                          setSelectedProductForBatch(p);
                          setTimeout(() => setBatchModalOpen(true), 150);
                        } else {
                          setTimeout(() => qtyRef.current?.focus(), 100);
                        }
                    }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('Search by name...')} />
                </SelectTrigger>
                <SelectContent>
                  {products.map((p: any) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.name} ({p.sku})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-1">
              <label className="text-[10px] uppercase font-bold text-gray-400 mb-1 block">{t('Unit Price')}</label>
              <Input 
                type="number" 
                value={entry.unitPrice} 
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
            </div>

            <div className="flex-1 overflow-auto">
              <Table>
                <TableHeader className="bg-gray-50/50 sticky top-0 z-10">
                  <TableRow className="hover:bg-transparent border-b border-primary/5">
                    <TableHead className="w-10 font-bold text-gray-800">{t('#')}</TableHead>
                    <TableHead className="font-bold text-gray-800">{t('Item')}</TableHead>
                    <TableHead className="font-bold text-gray-800">{t('Batch')}</TableHead>
                    <TableHead className="text-center font-bold text-gray-800">{t('Expiry')}</TableHead>
                    <TableHead className="text-center font-bold text-gray-800">{t('Price')}</TableHead>
                    <TableHead className="text-center font-bold text-gray-800">{t('Qty')}</TableHead>
                    <TableHead className="text-right font-bold text-gray-800">{t('Total')}</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-32 text-center text-gray-400">
                        <div className="flex flex-col items-center gap-2">
                          <ShoppingCart className="h-8 w-8 opacity-20" />
                          <p>{t('No items added yet')}</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    items.map((item, index) => (
                      <TableRow key={index} className="group hover:bg-primary/5 transition-colors border-b border-gray-50">
                        <TableCell className="font-medium text-gray-400">{index + 1}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-bold text-gray-900">{item.name}</span>
                            <span className="text-[10px] text-gray-400 uppercase font-bold tracking-tight">{item.code}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {item.batch_no ? (
                            <Badge variant="outline" className="bg-primary/5 border-primary/20 text-primary font-bold text-[9px] h-5">
                              {item.batch_no}
                            </Badge>
                          ) : '-'}
                        </TableCell>
                        <TableCell className="text-center font-bold text-orange-600">
                          {item.expiry_date ? item.expiry_date.split('T')[0] : '-'}
                        </TableCell>
                        <TableCell className="text-center font-medium">Rs {Number(item.unit_price).toFixed(2)}</TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-2">
                            <span className="font-black text-gray-900 text-sm">{item.quantity}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-black text-gray-900">Rs {item.total.toFixed(2)}</TableCell>
                        <TableCell>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 text-gray-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                            onClick={() => removeItem(index)}
                          >
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
                        </div>
                        <div className="flex items-center space-x-1.5">
                            <RadioGroupItem value="cheque" id="cheque" className="h-3.5 w-3.5 border-border" />
                            <Label htmlFor="cheque" className="text-xs font-bold text-gray-700 cursor-pointer">
                                {t('Cheque')} <span className="text-gray-400 text-[9px] ml-0.5">(F4)</span>
                            </Label>
                        </div>
                        <div className="flex items-center space-x-1.5">
                            <RadioGroupItem value="bank_transfer" id="bank_transfer" className="h-3.5 w-3.5 border-border" />
                            <Label htmlFor="bank_transfer" className="text-xs font-bold text-gray-700 cursor-pointer">
                                {t('Bank')} <span className="text-gray-400 text-[9px] ml-0.5">(F5)</span>
                            </Label>
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

                <div className="bg-white rounded-xl border border-primary/10 p-3 flex items-center gap-3">
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
                    
                    {(['credit', 'cheque', 'bank_transfer'].includes(formData.payment_method) || (formData.cash_payment > 0 && formData.cash_payment < grandTotal)) && (
                        <div className="bg-orange-50 border border-orange-100 rounded-lg p-1.5 px-2 mb-3 animate-in fade-in slide-in-from-top-1">
                            <div className="text-[8px] font-bold text-orange-600 uppercase flex items-center gap-1.5">
                                <span className="w-1 h-1 bg-orange-600 rounded-full animate-pulse"></span>
                                {customers.find((c: any) => String(c.id) === String(formData.customer_id))?.name.toLowerCase().includes('walk-in') 
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
                        {pointsDiscount > 0 && (
                            <div className="flex justify-between items-center text-xs text-emerald-600 animate-in fade-in slide-in-from-top-1">
                                <span className="font-bold">{t('Redeemed Points')} ({Number(pointsToRedeem).toFixed(2)} pts):</span>
                                <span className="font-black">-{ pointsDiscount.toFixed(2) }</span>
                            </div>
                        )}
                        {Number(formData.delivery_charge || 0) > 0 && (
                            <div className="flex justify-between items-center text-xs">
                                <span className="font-medium text-gray-500">{t('Delivery Charge')}:</span>
                                <span className="font-bold text-blue-600">+{Number(formData.delivery_charge).toFixed(2)}</span>
                            </div>
                        )}
                        <div className="h-px bg-primary/10 my-1"></div>
                        <div className="flex justify-between items-center pt-1">
                            <span className="text-base font-bold text-primary">{t('Total')}:</span>
                            <span className="text-xl font-black text-primary">{grandTotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-bold text-primary">{t('Balance')}:</span>
                            <span className="text-base font-black text-primary">{(grandTotal - (formData.cash_payment || 0)).toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                <Button 
                    ref={saveButtonRef}
                    className="w-full h-11 rounded-lg bg-primary hover:bg-primary/90 text-white font-bold text-base shadow-md shadow-primary/10 flex items-center justify-center gap-2"
                    onClick={() => handleSubmit()}
                    disabled={isSubmitting || items.length === 0}
                >
                    <Save className="h-4 w-4" /> {isSubmitting ? t('Processing...') : t('Update Sale')}
                </Button>
            </div>
        </div>
      </div>

      <BatchSelectionModal
        isOpen={batchModalOpen}
        onClose={() => setBatchModalOpen(false)}
        product={selectedProductForBatch}
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
            cash_payment: formData.cash_payment
        }}
        title={t('Payment Details')}
        mode="create"
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
                    placeholder={t('Enter phone number')}
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
                    placeholder={t('Enter email address')}
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
                    placeholder={t('Enter address')}
                    className={newCustomerErrors.address ? 'border-red-500' : ''}
                  />
                  {newCustomerErrors.address && <p className="text-xs text-red-500">{newCustomerErrors.address}</p>}
                </div>

                <div className="col-span-2 space-y-1">
                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    {t('Customer Type')}
                  </label>
                  <Select
                    value={newCustomerForm.type}
                    onValueChange={(val) => setNewCustomerForm(p => ({ ...p, type: val }))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={t('Select type')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="customer">{t('Regular Customer')}</SelectItem>
                      <SelectItem value="privileged_customer">{t('Privileged Customer')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {newCustomerForm.type === 'privileged_customer' && (
                  <div className="col-span-2 space-y-1 animate-in fade-in slide-in-from-top-2 duration-200">
                    <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide flex items-center gap-1.5 text-emerald-700">
                      <Gift className="h-4 w-4" /> {t('Privileged Loyalty Number')} <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={newCustomerForm.privileged_customer_number}
                      onChange={(e) => setNewCustomerForm(p => ({ ...p, privileged_customer_number: e.target.value }))}
                      placeholder={t('Enter loyalty card number')}
                      className={newCustomerErrors.privileged_customer_number ? 'border-red-500' : ''}
                    />
                    {newCustomerErrors.privileged_customer_number && (
                      <p className="text-xs text-red-500">{newCustomerErrors.privileged_customer_number}</p>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t mt-4">
                <Button
                  type="button"
                  variant="outline"
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
                  disabled={isCreatingCustomer}
                >
                  {t('Cancel')}
                </Button>
                <Button type="submit" disabled={isCreatingCustomer} className="bg-primary hover:bg-primary/90 text-white">
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
