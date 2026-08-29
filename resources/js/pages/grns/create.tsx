import { useEffect, useMemo, useState } from 'react';
import { usePage, router } from '@inertiajs/react';
import { PageTemplate } from '@/components/page-template';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import SearchableSelect from '@/components/ui/searchable-select';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useTranslation } from 'react-i18next';
import { Plus, X, Search } from 'lucide-react';
import { toast } from '@/components/custom-toast';

type GrnItem = {
  product_id: number | '';
  quantity: number;
  free_qty?: number;
  unit_price: number;
  sale_price?: number | null;
  discount_type: string;
  discount_value: number;
  expiry_date?: string | null;
  batch_no?: string | null;
  pack_size?: string | null;
};

export default function GrnCreate() {
  const { t } = useTranslation();
  const { suppliers = [], branches = [], products = [], statuses = [], discountTypes = [], nextGrnNo = '', nextBatchNo = '', fromPurchaseOrder = null } = usePage().props as any;

  const [formData, setFormData] = useState({
    grn_no: nextGrnNo,
    batch_no: nextBatchNo,
    invoice_no: '',
    sup_id: fromPurchaseOrder?.sup_id || '',
    branch_id: branches?.[0]?.id ?? '',
    grn_date: new Date().toISOString().split('T')[0],
    description: fromPurchaseOrder ? t('Received from Purchase Order #{{id}}', { id: fromPurchaseOrder.id }) : '',
    status: statuses?.includes('approved') ? 'approved' : statuses?.[0] ?? 'pending',
  });

  const [isGeneratingGrnNo, setIsGeneratingGrnNo] = useState(false);
  const [isGeneratingBatchNo, setIsGeneratingBatchNo] = useState(false);

  const fetchNextGrnNo = async (date: string) => {
    setIsGeneratingGrnNo(true);
    try {
      const res = await fetch(route('grns.next-number') + `?date=${date}`);
      const data = await res.json();
      handleFormChange('grn_no', data.grn_no);
    } finally {
      setIsGeneratingGrnNo(false);
    }
  };

  const fetchNextBatchNo = async (date: string) => {
    setIsGeneratingBatchNo(true);
    try {
      const res = await fetch(route('grns.next-number') + `?date=${date}`);
      const data = await res.json();
      handleFormChange('batch_no', data.batch_no);
    } finally {
      setIsGeneratingBatchNo(false);
    }
  };

  const [items, setItems] = useState<GrnItem[]>(fromPurchaseOrder?.items || []);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [itemModalStep, setItemModalStep] = useState<'select' | 'details'>('select');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeItemIndex, setActiveItemIndex] = useState<number | null>(null);
  const [currentItem, setCurrentItem] = useState<GrnItem | null>(null);
  const [isManualSalePrice, setIsManualSalePrice] = useState(false);

  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      batch_no: prev.batch_no || nextBatchNo,
    }));
  }, []);

  useEffect(() => {
    if (!formData.branch_id && branches?.length) {
      setFormData(prev => ({
        ...prev,
        branch_id: branches[0].id,
      }));
    }
  }, [branches]);

  const filteredProducts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    if (!term) {
      return products;
    }

    return products.filter((product: any) => {
      const name = (product.name || '').toString().toLowerCase();
      const genericName = (product.generic_name?.name || '').toString().toLowerCase();
      const sku = (product.sku || '').toString().toLowerCase();
      const code = (product.id || '').toString().toLowerCase();

      return name.includes(term) || genericName.includes(term) || sku.includes(term) || code.includes(term);
    });
  }, [products, searchTerm]);

  const selectedProduct = useMemo(() => {
    if (!currentItem?.product_id) return null;
    return products.find((p: any) => p.id === currentItem.product_id) || null;
  }, [currentItem, products]);

  const lineTotal = useMemo(() => {
    if (!currentItem) return 0;
    const quantity = Number(currentItem.quantity || 0);
    const unitPrice = Number(currentItem.unit_price || 0);
    const base = quantity * unitPrice;

    if (!currentItem.discount_type) return base;

    const discountValue = Number(currentItem.discount_value || 0);
    if (currentItem.discount_type === 'percentage') {
      return base - (base * discountValue) / 100;
    }

    if (currentItem.discount_type === 'fixed') {
      return base - Math.min(discountValue, base);
    }

    return base;
  }, [currentItem]);

  const grandTotal = useMemo(() => {
    return items.reduce((sum, item) => {
      const quantity = Number(item.quantity || 0);
      const unitPrice = Number(item.unit_price || 0);
      const base = quantity * unitPrice;
      const discountValue = Number(item.discount_value || 0);

      if (item.discount_type === 'percentage') {
        return sum + (base - (base * discountValue) / 100);
      }

      if (item.discount_type === 'fixed') {
        return sum + (base - Math.min(discountValue, base));
      }

      return sum + base;
    }, 0);
  }, [items]);

  const handleFormChange = (name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const openAddItemModal = () => {
    setCurrentItem({
      product_id: '' as any,
      quantity: 1,
      free_qty: 0,
      unit_price: 0,
      sale_price: null,
      discount_type: 'none',
      discount_value: 0,
      expiry_date: null,
      pack_size: '',
    });
    setActiveItemIndex(null);
    setItemModalStep('select');
    setSearchTerm('');
    setIsItemModalOpen(true);
    setIsManualSalePrice(false);
  };

  const handleSelectProduct = (product: any) => {
    setCurrentItem(prev => ({
      ...prev!,
      product_id: product.id,
      unit_price: product.cost_price != null ? Number(product.cost_price) : Number(product.price || 0),
      sale_price: product.sale_price != null ? Number(product.sale_price) : null,
      quantity: 1,
      pack_size: product.pack_size || '',
      expiry_date: product.has_expiry === false ? null : (prev?.expiry_date ?? null),
    }));
    setIsManualSalePrice(false);
    setItemModalStep('details');
  };

  useEffect(() => {
    if (currentItem && selectedProduct && !isManualSalePrice) {
      const margin = Number(selectedProduct.profit_margin || 0);
      if (margin > 0) {
        const cost = Number(currentItem.unit_price || 0);
        const calculatedSalePrice = cost * (1 + margin / 100);
        const roundedSalePrice = Number(calculatedSalePrice.toFixed(4));
        if (roundedSalePrice !== currentItem.sale_price) {
          setCurrentItem(prev => prev ? { ...prev, sale_price: roundedSalePrice } : prev);
        }
      }
    }
  }, [currentItem?.unit_price, selectedProduct?.id, selectedProduct?.profit_margin, isManualSalePrice]);

  const handleSaveItem = () => {
    if (!currentItem) return;

    const cleanedItem = {
      ...currentItem,
      quantity: Number(currentItem.quantity || 0),
      unit_price: Number(currentItem.unit_price || 0),
      discount_value: Number(currentItem.discount_value || 0),
      discount_type: currentItem.discount_type || 'none',
    };

    setItems(prev => {
      if (activeItemIndex !== null && activeItemIndex >= 0) {
        const next = [...prev];
        next[activeItemIndex] = cleanedItem;
        return next;
      }

      return [...prev, cleanedItem];
    });

    setIsItemModalOpen(false);
  };

  const handleEditItem = (index: number) => {
    setActiveItemIndex(index);
    setCurrentItem(items[index]);
    setItemModalStep('details');
    setIsItemModalOpen(true);
  };

  const handleRemoveItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      ...formData,
      items: items.map(item => ({ ...item, batch_no: formData.batch_no || null })),
    };

    toast.loading(t('Creating GRN...'));

    router.post(route('grns.store'), payload, {
      onSuccess: (page: any) => {
        toast.dismiss();
        if (page.props?.flash?.success) {
          toast.success(t(page.props.flash.success));
        } else {
          toast.success(t('GRN created successfully'));
        }
      },
      onError: (errors: any) => {
        toast.dismiss();
        const errorMessage = typeof errors === 'object' ? Object.values(errors).flat().join(', ') : errors;
        toast.error(t('Failed to create: {{errors}}', { errors: errorMessage }) || t('Failed to create GRN'));
      }
    });
  };

  const breadcrumbs = [
    { title: t('Dashboard'), href: route('dashboard') },
    { title: t('GRN'), href: route('grns.index') },
    { title: t('Create GRN') },
  ];

  return (
    <PageTemplate
      title={t('Create GRN')}
      description={t('Create a new Goods Received Note')}
      breadcrumbs={breadcrumbs}
      url="/grns/create"
      actions={[
        {
          label: t('Back to GRNs'),
          variant: 'outline',
          onClick: () => router.visit(route('grns.index')),
        },
      ]}
      noPadding
    >
      <form onSubmit={handleSubmit} className="max-w-6xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('Basic Information')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('GRN Number')}</label>
                <div className="flex gap-2">
                  <Input
                    value={formData.grn_no}
                    readOnly
                    required
                  />
                  <Button type="button" variant="outline" disabled={isGeneratingGrnNo} onClick={() => fetchNextGrnNo(formData.grn_date)}>
                    {t('Generate')}
                  </Button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('Batch No')}</label>
                <div className="flex gap-2">
                  <Input
                    value={formData.batch_no}
                    readOnly
                  />
                  <Button type="button" variant="outline" disabled={isGeneratingBatchNo} onClick={() => fetchNextBatchNo(formData.grn_date)}>
                    {t('Generate')}
                  </Button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('Supplier')}</label>
                <SearchableSelect
                  value={formData.sup_id?.toString() ?? ''}
                  onValueChange={(value) => handleFormChange('sup_id', value)}
                  options={suppliers.map((supplier: any) => ({
                    value: String(supplier.id),
                    label: supplier.company_name,
                    sublabel: supplier.address ?? undefined,
                  }))}
                  placeholder={t('Search supplier')}
                  noOptionsText={t('No suppliers found')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('Branch')}</label>
                <Select
                  value={formData.branch_id?.toString() ?? ''}
                  onValueChange={(value) => handleFormChange('branch_id', value)}
                  disabled
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('Select a branch')} />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((branch: any) => (
                      <SelectItem key={branch.id} value={String(branch.id)}>
                        {branch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('Invoice No')}</label>
                <Input
                  value={formData.invoice_no}
                  onChange={(e) => handleFormChange('invoice_no', e.target.value)}
                />
              </div>


              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('Status')}</label>
                <Select value={formData.status || ''} onValueChange={(value) => handleFormChange('status', value)} disabled>
                  <SelectTrigger>
                    <SelectValue placeholder={t('Select status')} />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map((status: string) => (
                      <SelectItem key={status} value={status}>
                        {t(status.charAt(0).toUpperCase() + status.slice(1))}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('Description')}</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => handleFormChange('description', e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              {t('GRN Items')}
              <Button type="button" onClick={openAddItemModal}>
                <Plus className="mr-2 h-4 w-4" />
                {t('Add Item')}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('#')}</TableHead>
                  <TableHead>{t('Product')}</TableHead>
                  <TableHead>{t('Quantity')}</TableHead>
                  <TableHead>{t('Pack Size')}</TableHead>
                  <TableHead>{t('Free Qty')}</TableHead>
                  <TableHead>{t('Cost Price')}</TableHead>
                  <TableHead>{t('Sale Price')}</TableHead>
                  <TableHead>{t('New Cost Price')}</TableHead>
                  <TableHead>{t('Unit Cost Price')}</TableHead>
                  <TableHead>{t('Unit Sales Price')}</TableHead>
                  <TableHead>{t('Unit Stock (tablet)')}</TableHead>
                  <TableHead>{t('Expiry Date')}</TableHead>
                  <TableHead>{t('Discount Type')}</TableHead>
                  <TableHead>{t('Discount Value')}</TableHead>
                  <TableHead>{t('Total')}</TableHead>
                  <TableHead>{t('Actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={16} className="text-center py-10">
                      {t('No products added yet')}.
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item, index) => {
                    const product = products.find((p: any) => p.id === item.product_id);
                    const packSizeNum = Number(item.pack_size) || 1;
                    const base = Number(item.quantity || 0) * Number(item.unit_price || 0);
                    const discountValue = Number(item.discount_value || 0);
                    const discounted =
                      item.discount_type === 'percentage'
                        ? base - (base * discountValue) / 100
                        : item.discount_type === 'fixed'
                        ? base - Math.min(discountValue, base)
                        : base;
                    const totalQty = Number(item.quantity || 1) + Number(item.free_qty || 0);
                    const unitCostPrice = discounted / (totalQty * packSizeNum);
                    const newCostPrice = discounted / totalQty;
                    const unitSalesPrice = item.sale_price != null ? Number(item.sale_price) / packSizeNum : null;
                    const unitStock = totalQty * packSizeNum;

                    return (
                      <TableRow key={index}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{product ? `${product.name} ${product.generic_name?.name ? `(${product.generic_name.name})` : ''} (${product.sku})` : t('-')}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>{item.pack_size || '-'}</TableCell>
                        <TableCell>{item.free_qty ?? 0}</TableCell>
                        <TableCell>{window.appSettings?.formatCurrency?.(item.unit_price) ?? Number(item.unit_price).toFixed(2)}</TableCell>
                        <TableCell>{item.sale_price != null ? (window.appSettings?.formatCurrency?.(item.sale_price) ?? Number(item.sale_price).toFixed(2)) : '-'}</TableCell>
                        <TableCell>{window.appSettings?.formatCurrency?.(newCostPrice) ?? newCostPrice.toFixed(2)}</TableCell>
                        <TableCell>{window.appSettings?.formatCurrency?.(unitCostPrice) ?? unitCostPrice.toFixed(2)}</TableCell>
                        <TableCell>{unitSalesPrice != null ? (window.appSettings?.formatCurrency?.(unitSalesPrice) ?? unitSalesPrice.toFixed(2)) : '-'}</TableCell>
                        <TableCell>{unitStock}</TableCell>
                        <TableCell>{item.expiry_date || '-'}</TableCell>
                        <TableCell>{item.discount_type || '-'}</TableCell>
                        <TableCell>{item.discount_value}</TableCell>
                        <TableCell>{window.appSettings?.formatCurrency?.(discounted) ?? discounted.toFixed(2)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button type="button" variant="outline" size="icon" onClick={() => handleEditItem(index)}>
                              <span className="sr-only">{t('Edit')}</span>
                              <span className="text-sm">✎</span>
                            </Button>
                            <Button type="button" variant="outline" size="icon" onClick={() => handleRemoveItem(index)}>
                              <span className="sr-only">{t('Remove')}</span>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>

            <div className="mt-4 flex flex-col gap-2 text-right">
              <div className="text-sm text-gray-600">
                {t('Grand Total')}: <span className="font-semibold">{window.appSettings?.formatCurrency?.(grandTotal) ?? grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => router.visit(route('grns.index'))}>
            {t('Cancel')}
          </Button>
          <Button type="submit">{t('Create GRN')}</Button>
        </div>
      </form>

      <Dialog open={isItemModalOpen} onOpenChange={setIsItemModalOpen}>
        <DialogContent className="sm:max-w-4xl w-full">
          <DialogHeader>
            <DialogTitle>{itemModalStep === 'select' ? t('Select Product') : t('Item Details')}</DialogTitle>
            <DialogDescription>
              {itemModalStep === 'select'
                ? t('Search for products by name, code or SKU, then select one to add.')
                : t('Review and edit details before adding to the GRN.')}
            </DialogDescription>
          </DialogHeader>

          {itemModalStep === 'select' ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-gray-500" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={t('Search products...')}
                />
              </div>
              <div className="max-h-96 overflow-y-auto space-y-2">
                {filteredProducts.length === 0 ? (
                  <div className="text-center text-sm text-gray-500">{t('No products found.')}</div>
                ) : (
                  filteredProducts.map((product: any) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between rounded-lg border p-3 hover:border-primary hover:bg-primary/5"
                    >
                      <div>
                        <div className="font-medium">
                          {product.name} {product.generic_name?.name && <span className="text-sm text-gray-500 font-normal">({product.generic_name.name})</span>}
                        </div>
                        <div className="text-xs text-gray-500">
                          {t('Code')}: {product.id} • {t('SKU')}: {product.sku}
                        </div>
                        <div className="text-xs text-gray-500">
                          {t('Cost')}: {window.appSettings?.formatCurrency?.(product.price) ?? product.price}
                        </div>
                        {product.pack_size && (
                          <div className="text-xs text-gray-500">
                            {t('Pack Size')}: {product.pack_size}
                          </div>
                        )}
                      </div>
                      <Button type="button" onClick={() => handleSelectProduct(product)}>
                        {t('Select')}
                      </Button>
                    </div>
                  ))
                )}
              </div>
              <DialogFooter className="justify-end">
                <Button type="button" variant="outline" onClick={() => setIsItemModalOpen(false)}>
                  {t('Cancel')}
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('Product')}</label>
                  <div className="rounded-md border bg-gray-50 px-3 py-2 text-sm">{selectedProduct?.name ?? '-'}</div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('Product Code')}</label>
                  <div className="rounded-md border bg-gray-50 px-3 py-2 text-sm">{selectedProduct?.sku ?? selectedProduct?.id ?? '-'}</div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('Quantity')}</label>
                  <Input
                    type="number"
                    min={1}
                    value={currentItem?.quantity}
                    onChange={(e) => setCurrentItem(prev => prev ? { ...prev, quantity: Number(e.target.value) } : prev)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('Free Quantity')}</label>
                  <Input
                    type="number"
                    min={0}
                    step={1}
                    value={currentItem?.free_qty ?? 0}
                    onChange={(e) => setCurrentItem(prev => prev ? { ...prev, free_qty: Number(e.target.value) } : prev)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('Pack Size')}</label>
                  <Input
                    type="text"
                    value={currentItem?.pack_size || ''}
                    onChange={(e) => setCurrentItem(prev => prev ? { ...prev, pack_size: e.target.value } : prev)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('Unit Stock (tablet)')}</label>
                  <div className="rounded-md border bg-gray-50 px-3 py-2 text-sm font-medium">
                    {(() => {
                      const qty = Number(currentItem?.quantity || 0);
                      const freeQty = Number(currentItem?.free_qty || 0);
                      const ps = Number(currentItem?.pack_size) || 1;
                      return ((qty + freeQty) * ps).toFixed(0);
                    })()}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('Cost Price')}</label>
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    value={currentItem?.unit_price ?? 0}
                    onChange={(e) => setCurrentItem(prev => prev ? { ...prev, unit_price: Number(e.target.value) } : prev)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('New Cost Price')}</label>
                  <div className="rounded-md border bg-gray-50 px-3 py-2 text-sm font-medium">
                    {(() => {
                      const qty = Number(currentItem?.quantity || 1);
                      const freeQty = Number(currentItem?.free_qty || 0);
                      const totalQty = qty + freeQty || 1;
                      const newCostPrice = lineTotal / totalQty;
                      return window.appSettings?.formatCurrency?.(newCostPrice) ?? newCostPrice.toFixed(2);
                    })()}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('Unit Cost Price')}</label>
                  <div className="rounded-md border bg-gray-50 px-3 py-2 text-sm font-medium">
                    {(() => {
                      const qty = Number(currentItem?.quantity || 1);
                      const freeQty = Number(currentItem?.free_qty || 0);
                      const ps = Number(currentItem?.pack_size) || 1;
                      const ucp = lineTotal / ((qty + freeQty) * ps);
                      return window.appSettings?.formatCurrency?.(ucp) ?? ucp.toFixed(2);
                    })()}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('Sale Price')}</label>
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    value={currentItem?.sale_price ?? ''}
                    placeholder="0.00"
                    onChange={(e) => {
                      const val = e.target.value === '' ? null : Number(e.target.value);
                      setIsManualSalePrice(true);
                      setCurrentItem(prev => prev ? { ...prev, sale_price: val } : prev);
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('Unit Sales Price')}</label>
                  <div className="rounded-md border bg-gray-50 px-3 py-2 text-sm font-medium">
                    {(() => {
                      const sp = currentItem?.sale_price != null ? Number(currentItem.sale_price) : null;
                      const ps = Number(currentItem?.pack_size) || 1;
                      if (sp === null) return '-';
                      const usp = sp / ps;
                      return window.appSettings?.formatCurrency?.(usp) ?? usp.toFixed(2);
                    })()}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('Discount Type')}</label>
                  <Select
                    value={currentItem?.discount_type || 'none'}
                    onValueChange={(value) => setCurrentItem(prev => prev ? { ...prev, discount_type: value } : prev)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('Select type')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">{t('None')}</SelectItem>
                      <SelectItem value="fixed">{t('Fixed')}</SelectItem>
                      <SelectItem value="percentage">{t('Percentage')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('Discount Value')}</label>
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    value={currentItem?.discount_value}
                    onChange={(e) => setCurrentItem(prev => prev ? { ...prev, discount_value: Number(e.target.value) } : prev)}
                  />
                </div>
                {selectedProduct?.has_expiry !== false && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('Expiry Date')} <span className="text-red-500">*</span></label>
                    <Input
                      type="date"
                      required
                      value={currentItem?.expiry_date || ''}
                      onChange={(e) => setCurrentItem(prev => prev ? { ...prev, expiry_date: e.target.value } : prev)}
                    />
                  </div>
                )}
              </div>

              <div className="rounded-lg border bg-gray-50 p-4">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>{t('Line Total')}</span>
                  <span className="font-semibold">{window.appSettings?.formatCurrency?.(lineTotal) ?? lineTotal.toFixed(2)}</span>
                </div>
              </div>

              <DialogFooter className="justify-end">
                <Button type="button" variant="outline" onClick={() => setItemModalStep('select')}>
                  {t('Back')}
                </Button>
                <Button type="button" onClick={handleSaveItem}>{t('Add Item')}</Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </PageTemplate>
  );
}


