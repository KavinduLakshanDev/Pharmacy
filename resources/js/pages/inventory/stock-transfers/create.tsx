import { useMemo, useState } from 'react';
import { usePage, router } from '@inertiajs/react';
import { PageTemplate } from '@/components/page-template';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useTranslation } from 'react-i18next';
import { Plus, X, Search } from 'lucide-react';
import { toast } from '@/components/custom-toast';

type BatchStock = {
  balance: number;
  pack_size: number | null;
  available_units: number;
  unit_cost_price: number | null;
};

type TransferItem = {
  product_id: number | '';
  batch_no: string | null;
  quantity: number;
  unit_price: number;
  unit_cost_price: number | null;
};

export default function StockTransferCreate() {
  const { t } = useTranslation();
  const { branches = [], products = [], branchBatchStock = {}, statuses = [], transferNo = '' } = usePage().props as any;

  const [formData, setFormData] = useState({
    transfer_no: transferNo,
    from_branch_id: branches?.[0]?.id?.toString() ?? '',
    to_branch_id: branches?.[1]?.id?.toString() ?? '',
    transfer_date: new Date().toISOString().split('T')[0],
    notes: '',
    status: 'approved',
  });

  const [items, setItems] = useState<TransferItem[]>([]);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [itemModalStep, setItemModalStep] = useState<'select' | 'details'>('select');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeItemIndex, setActiveItemIndex] = useState<number | null>(null);
  const [currentItem, setCurrentItem] = useState<TransferItem | null>(null);

  const fromBranchId = formData.from_branch_id;

  // branchBatchStock[branchId][productId][batchNo] = BatchStock
  const batchesForFromBranch: Record<string, Record<string, BatchStock>> = useMemo(() => {
    return branchBatchStock[fromBranchId] ?? {};
  }, [branchBatchStock, fromBranchId]);

  const totalStockForProduct = (productId: number): number => {
    const batches = batchesForFromBranch[productId] ?? {};
    return Object.values(batches).reduce((s: number, v: BatchStock) => s + Number(v.available_units), 0);
  };


  const filteredProducts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return products;

    return products.filter((product: any) => {
      const name = (product.name || '').toLowerCase();
      const sku = (product.sku || '').toLowerCase();
      return name.includes(term) || sku.includes(term);
    });
  }, [products, searchTerm]);

  const selectedProduct = useMemo(() => {
    if (!currentItem?.product_id) return null;
    return products.find((p: any) => p.id === currentItem.product_id) || null;
  }, [currentItem, products]);

  const availableStock = useMemo(() => {
    if (!currentItem?.product_id) return 0;
    if (currentItem.batch_no) {
      return Number(batchesForFromBranch[currentItem.product_id]?.[currentItem.batch_no]?.available_units ?? 0);
    }
    return totalStockForProduct(currentItem.product_id as number);
  }, [currentItem, batchesForFromBranch]);




  const handleFormChange = (name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const openAddItemModal = () => {
    setCurrentItem({ product_id: '' as any, batch_no: null, quantity: 1, unit_price: 0, unit_cost_price: null });
    setActiveItemIndex(null);
    setItemModalStep('select');
    setSearchTerm('');
    setIsItemModalOpen(true);
  };

  const handleSelectProduct = (product: any) => {
    setCurrentItem(prev => ({
      ...prev!,
      product_id: product.id,
      batch_no: null,
      unit_price: Number(product.price || 0),
      unit_cost_price: null,
      quantity: 1,
    }));
    setItemModalStep('details');
  };

  const handleSaveItem = () => {
    if (!currentItem) return;

    const product = products.find((p: any) => p.id === currentItem.product_id);
    const quantity = Number(currentItem.quantity || 0);
    const availableBatches = Object.entries(batchesForFromBranch[currentItem.product_id as number] ?? {})
      .filter(([, batch]) => Number(batch.available_units) > 0);
    const batchInfo = currentItem.batch_no
      ? batchesForFromBranch[currentItem.product_id as number]?.[currentItem.batch_no]
      : undefined;
    const packSize = batchInfo?.pack_size ?? (product?.pack_size ? Number(product.pack_size) : null);
    const available = availableStock;

    if (!product) {
      toast.error(t('Please select a valid product.'));
      return;
    }

    if (availableBatches.length > 0 && !currentItem.batch_no) {
      toast.error(t('Please select a batch for this product before saving the item.'));
      return;
    }

    if (quantity < 1) {
      toast.error(t('Quantity must be at least 1.'));
      return;
    }

    if (available > 0 && quantity > available) {
      toast.error(t('Quantity exceeds available stock in the source branch.'));
      return;
    }

    const transferQuantity = packSize && packSize > 0 ? quantity / packSize : quantity;

    const cleaned: TransferItem = {
      product_id: currentItem.product_id,
      batch_no: currentItem.batch_no || null,
      quantity: transferQuantity,
      unit_price: Number(currentItem.unit_price || 0),
      unit_cost_price: currentItem.unit_cost_price,
    };

    setItems(prev => {
      if (activeItemIndex !== null && activeItemIndex >= 0) {
        const next = [...prev];
        next[activeItemIndex] = cleaned;
        return next;
      }
      return [...prev, cleaned];
    });

    setIsItemModalOpen(false);
  };

  const handleEditItem = (index: number) => {
    const item = items[index];
    const batchInfo = item.batch_no
      ? batchesForFromBranch[item.product_id as number]?.[item.batch_no]
      : undefined;
    const quantity = batchInfo?.pack_size ? item.quantity * batchInfo.pack_size : item.quantity;

    setActiveItemIndex(index);
    setCurrentItem({ ...item, quantity });
    setItemModalStep('details');
    setIsItemModalOpen(true);
  };

  const handleRemoveItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (items.length === 0) {
      toast.error(t('Please add at least one item.'));
      return;
    }

    if (formData.from_branch_id === formData.to_branch_id) {
      toast.error(t('Source and destination branches must be different.'));
      return;
    }

    toast.loading(t('Creating stock transfer...'));

    router.post(route('inventory.stock-transfers.store'), { ...formData, items }, {
      onSuccess: (page: any) => {
        toast.dismiss();
        if (page.props?.flash?.success) {
          toast.success(t(page.props.flash.success));
        } else {
          toast.success(t('Stock transfer created successfully'));
        }
      },
      onError: (errors: any) => {
        toast.dismiss();
        const message = typeof errors === 'object' ? Object.values(errors).flat().join(', ') : errors;
        toast.error(message || t('Failed to create stock transfer'));
      },
    });
  };

  const breadcrumbs = [
    { title: t('Dashboard'), href: route('dashboard') },
    { title: t('Stock Transfers'), href: route('inventory.stock-transfers.index') },
    { title: t('New Transfer') },
  ];

  return (
    <PageTemplate
      title={t('New Stock Transfer')}
      description={t('Transfer stock between branches')}
      breadcrumbs={breadcrumbs}
      url="/inventory/stock-transfers/create"
      actions={[
        {
          label: t('Back'),
          variant: 'outline',
          onClick: () => router.visit(route('inventory.stock-transfers.index')),
        },
      ]}
      noPadding
    >
      <form onSubmit={handleSubmit} className="max-w-6xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('Transfer Information')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('Transfer No')}</label>
                <Input
                  value={formData.transfer_no}
                  onChange={(e) => handleFormChange('transfer_no', e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('Transfer Date')}</label>
                <Input
                  type="date"
                  value={formData.transfer_date}
                  onChange={(e) => handleFormChange('transfer_date', e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('Status')}</label>
                <Select value={formData.status} onValueChange={(value) => handleFormChange('status', value)}>
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('From Branch (Source)')}</label>
                <Select value={formData.from_branch_id?.toString()} onValueChange={(value) => handleFormChange('from_branch_id', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('Select source branch')} />
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
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('To Branch (Destination)')}</label>
                <Select value={formData.to_branch_id?.toString()} onValueChange={(value) => handleFormChange('to_branch_id', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('Select destination branch')} />
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

              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('Notes')}</label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => handleFormChange('notes', e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('Items to Transfer')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">{t('Select products and quantities to transfer from the source branch.')}</p>
              <Button type="button" onClick={openAddItemModal}>
                <Plus className="mr-2 h-4 w-4" /> {t('Add Item')}
              </Button>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('Product')}</TableHead>
                  <TableHead>{t('Batch No')}</TableHead>
                  <TableHead>{t('Available Stock')}</TableHead>
                  <TableHead>{t('Qty to Transfer')}</TableHead>
                  <TableHead>{t('Total Cost Price')}</TableHead>
                  <TableHead>{t('Actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-gray-400 py-6">
                      {t('No items added yet.')}
                    </TableCell>
                  </TableRow>
                )}
                {items.map((item, idx) => {
                  const product = products.find((p: any) => p.id === item.product_id);
                  const batchInfo = item.batch_no
                    ? batchesForFromBranch[item.product_id as number]?.[item.batch_no]
                    : null;
                  const batchQty = batchInfo ? batchInfo.available_units : totalStockForProduct(item.product_id as number);
                  const tabletQty = batchInfo?.pack_size
                    ? item.quantity * batchInfo.pack_size
                    : item.quantity;
                  const qtyLabel = String(tabletQty);
                  const totalCostPrice = item.unit_cost_price != null
                    ? tabletQty * Number(item.unit_cost_price)
                    : null;

                  return (
                    <TableRow key={idx}>
                      <TableCell>{product?.name ?? item.product_id}</TableCell>
                      <TableCell>{item.batch_no ?? '-'}</TableCell>
                      <TableCell>{batchQty}</TableCell>
                      <TableCell>{qtyLabel}</TableCell>
                      <TableCell>{totalCostPrice != null ? (window.appSettings?.formatCurrency?.(totalCostPrice) ?? totalCostPrice.toFixed(2)) : '-'}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button type="button" variant="outline" size="sm" onClick={() => handleEditItem(idx)}>
                            {t('Edit')}
                          </Button>
                          <Button type="button" variant="destructive" size="sm" onClick={() => handleRemoveItem(idx)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>


          </CardContent>
        </Card>

        <div className="flex justify-end gap-3 pb-6">
          <Button type="button" variant="outline" onClick={() => router.visit(route('inventory.stock-transfers.index'))}>
            {t('Cancel')}
          </Button>
          <Button type="submit">{t('Create Transfer')}</Button>
        </div>
      </form>

      {/* Product Selection Dialog */}
      <Dialog open={isItemModalOpen} onOpenChange={setIsItemModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{itemModalStep === 'select' ? t('Select Product') : t('Item Details')}</DialogTitle>
            <DialogDescription>
              {itemModalStep === 'select'
                ? t('Choose a product to transfer.')
                : t('Set the quantity and unit price for this item.')}
            </DialogDescription>
          </DialogHeader>

          {itemModalStep === 'select' && (
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  className="pl-9"
                  placeholder={t('Search by name or SKU...')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="max-h-80 overflow-y-auto space-y-1">
                {filteredProducts.map((product: any) => {
                  const stock = totalStockForProduct(product.id);
                  return (
                    <button
                      key={product.id}
                      type="button"
                      className="w-full flex justify-between items-center px-3 py-2 rounded hover:bg-gray-50 text-left"
                      onClick={() => handleSelectProduct(product)}
                    >
                      <span className="font-medium">{product.name}</span>
                      <span className="text-xs text-gray-500">{t('In stock')}: {stock}</span>
                    </button>
                  );
                })}
                {filteredProducts.length === 0 && (
                  <p className="text-center text-gray-400 py-4">{t('No products found.')}</p>
                )}
              </div>
            </div>
          )}

          {itemModalStep === 'details' && currentItem && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500">{t('Product')}</p>
                <p className="font-semibold">{selectedProduct?.name}</p>
              </div>
              {/* Batch selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('Batch')}</label>
                {(() => {
                  const batches = Object.entries(batchesForFromBranch[currentItem.product_id as number] ?? {})
                    .filter(([, batch]) => Number(batch.available_units) > 0);
                  return batches.length > 0 ? (
                    <Select
                      value={currentItem.batch_no ?? ''}
                      onValueChange={(val) => {
                        const batchInfo = batchesForFromBranch[currentItem.product_id as number]?.[val];
                        setCurrentItem(prev => ({
                          ...prev!,
                          batch_no: val || null,
                          unit_cost_price: batchInfo?.unit_cost_price ?? prev!.unit_cost_price,
                        }));
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t('Select batch...')} />
                      </SelectTrigger>
                      <SelectContent>
                        {batches.map(([batchNo, batch]) => (
                          <SelectItem key={batchNo} value={batchNo}>
                            {batchNo} — {t('Qty')}: {batch.available_units}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-sm text-gray-400">{t('No batches available in source branch.')}</p>
                  );
                })()}
                <p className="text-xs text-gray-500 mt-1">{t('Available in selected batch')}: {availableStock}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('Quantity')}</label>
                  <Input
                    type="number"
                    min={1}
                    step="1"
                    max={availableStock > 0 ? availableStock : undefined}
                    value={currentItem.quantity}
                    onChange={(e) => setCurrentItem(prev => ({ ...prev!, quantity: Number(e.target.value) }))}
                  />
                  {currentItem.batch_no && batchesForFromBranch[currentItem.product_id as number]?.[currentItem.batch_no]?.pack_size && (
                    <p className="text-xs text-gray-500 mt-1">
                      {t('Enter quantity in tablets.')}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('Unit Price')}</label>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={currentItem.unit_price}
                    onChange={(e) => setCurrentItem(prev => ({ ...prev!, unit_price: Number(e.target.value) }))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('Unit Cost Price')}</label>
                  <div className="rounded-md border bg-gray-50 px-3 py-2 text-sm font-medium">
                    {currentItem.unit_cost_price != null
                      ? (window.appSettings?.formatCurrency?.(currentItem.unit_cost_price) ?? Number(currentItem.unit_cost_price).toFixed(2))
                      : '-'}
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            {itemModalStep === 'details' && (
              <Button type="button" variant="outline" onClick={() => setItemModalStep('select')}>
                {t('Back')}
              </Button>
            )}
            <Button type="button" variant="outline" onClick={() => setIsItemModalOpen(false)}>
              {t('Cancel')}
            </Button>
            {itemModalStep === 'details' && (
              <Button type="button" onClick={handleSaveItem}>
                {t('Save Item')}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageTemplate>
  );
}
