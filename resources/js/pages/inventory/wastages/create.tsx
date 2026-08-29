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
import { Plus, Search, X } from 'lucide-react';
import { toast } from '@/components/custom-toast';

type WastageItem = {
  product_id: number | '';
  batch_no?: string;
  quantity: number;
  unit_price: number;
  pack_size?: number | null;
};

export default function WastageCreate() {
  const { t } = useTranslation();
  const { branches = [], products = [], batchStock = {}, wastageNo = '' } = usePage().props as any;

  const [formData, setFormData] = useState({
    wastage_no: wastageNo,
    branch_id: branches?.[0]?.id?.toString() ?? '',
    wastage_date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const [items, setItems] = useState<WastageItem[]>([]);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [itemModalStep, setItemModalStep] = useState<'select' | 'details'>('select');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeItemIndex, setActiveItemIndex] = useState<number | null>(null);
  const [currentItem, setCurrentItem] = useState<WastageItem | null>(null);

  const selectedBranchId = formData.branch_id;

  const stockForSelectedBranch: Record<string, number> = useMemo(() => {
    const batchesForBranch: Record<string, Array<{ batch_no: string; quantity: number; unit_price: number; pack_size: number | null; available_units: number }>> =
      batchStock[selectedBranchId] ?? {};

    return Object.fromEntries(
      Object.entries(batchesForBranch).map(([productId, batches]) => [
        productId,
        batches.filter((b) => b.available_units > 0).reduce((sum, b) => sum + b.available_units, 0),
      ]),
    );
  }, [batchStock, selectedBranchId]);

  const batchStockForSelectedBranch = useMemo(() => {
    return batchStock[selectedBranchId] ?? {};
  }, [batchStock, selectedBranchId]);

  const filteredProducts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const productsWithStock = products.filter((product: any) => Number(stockForSelectedBranch[product.id] ?? 0) > 0);

    if (!term) {
      return productsWithStock;
    }

    return productsWithStock.filter((product: any) => {
      const name = (product.name || '').toLowerCase();
      const sku = (product.sku || '').toLowerCase();
      return name.includes(term) || sku.includes(term);
    });
  }, [products, searchTerm, stockForSelectedBranch]);

  const availableBatches = useMemo(() => {
    if (!currentItem?.product_id) {
      return [];
    }

    return batchStockForSelectedBranch[currentItem.product_id] ?? [];
  }, [batchStockForSelectedBranch, currentItem]);

  const selectedProduct = useMemo(() => {
    if (!currentItem?.product_id) return null;
    return products.find((product: any) => product.id === currentItem.product_id) || null;
  }, [currentItem, products]);

  const handleFormChange = (name: string, value: any) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const openAddItemModal = () => {
    setCurrentItem({ product_id: '' as any, batch_no: '', quantity: 1, unit_price: 0 });
    setActiveItemIndex(null);
    setItemModalStep('select');
    setSearchTerm('');
    setIsItemModalOpen(true);
  };

  const handleSelectProduct = (product: any) => {
    const availableQuantity = Number(stockForSelectedBranch[product.id] ?? 0);

    if (availableQuantity <= 0) {
      toast.error(t('This product has no stock in the selected branch.'));
      return;
    }

    setCurrentItem((prev) => ({
      ...prev!,
      product_id: product.id,
      batch_no: '',
      unit_price: 0,
      pack_size: null,
      quantity: 1,
    }));
    setItemModalStep('details');
  };

  const handleSaveItem = () => {
    if (!currentItem) return;

    const product = products.find((p: any) => p.id === currentItem.product_id);
    const quantity = Number(currentItem.quantity || 0);
    const batch = currentItem.batch_no ? availableBatches.find((item: any) => item.batch_no === currentItem.batch_no) : null;

    if (!product) {
      toast.error(t('Please select a valid product.'));
      return;
    }

    if (!currentItem.batch_no) {
      toast.error(t('Please select a batch for this product.'));
      return;
    }

    if (!batch) {
      toast.error(t('The selected batch is not available.'));
      return;
    }

    if (quantity < 1) {
      toast.error(t('Quantity must be at least 1.'));
      return;
    }

    if (batch.available_units <= 0) {
      toast.error(t('This batch has no stock in the selected branch.'));
      return;
    }

    if (quantity > batch.available_units) {
      toast.error(t('Quantity exceeds available batch stock in the selected branch.'));
      return;
    }

    const packSize = batch.pack_size ? Number(batch.pack_size) : null;

    const cleaned: WastageItem = {
      product_id: currentItem.product_id,
      batch_no: currentItem.batch_no,
      quantity,
      unit_price: Number(currentItem.unit_price || 0),
      pack_size: currentItem.pack_size ?? null,
    };

    setItems((prev) => {
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
    setActiveItemIndex(index);
    setCurrentItem(items[index]);
    setItemModalStep('details');
    setIsItemModalOpen(true);
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const totalAmount = items.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.unit_price || 0), 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (items.length === 0) {
      toast.error(t('Please add at least one item.'));
      return;
    }

    toast.loading(t('Recording wastage...'));

    const payloadItems = items.map((item) => {
      const packSize = item.pack_size ?? null;
      const boxedQuantity = packSize ? Number(item.quantity) / packSize : Number(item.quantity);
      const boxUnitPrice = packSize ? Number(item.unit_price) * packSize : Number(item.unit_price);

      return {
        product_id: item.product_id,
        batch_no: item.batch_no,
        quantity: boxedQuantity,
        unit_price: boxUnitPrice,
      };
    });

    router.post(route('inventory.wastages.store'), { ...formData, items: payloadItems }, {
      onSuccess: (page: any) => {
        toast.dismiss();
        if (page.props?.flash?.success) {
          toast.success(t(page.props.flash.success));
        } else {
          toast.success(t('Wastage recorded successfully.'));
        }
      },
      onError: (errors: any) => {
        toast.dismiss();
        const message = typeof errors === 'object' ? Object.values(errors).flat().join(', ') : errors;
        toast.error(message || t('Failed to record wastage.'));
      },
    });
  };

  const breadcrumbs = [
    { title: t('Dashboard'), href: route('dashboard') },
    { title: t('Wastages'), href: route('inventory.wastages.index') },
    { title: t('New Wastage') },
  ];

  return (
    <PageTemplate
      title={t('New Wastage')}
      description={t('Record inventory wastage transactions.')}
      breadcrumbs={breadcrumbs}
      url="/inventory/wastages/create"
      actions={[
        {
          label: t('Back'),
          variant: 'outline',
          onClick: () => router.visit(route('inventory.wastages.index')),
        },
      ]}
      noPadding
    >
      <form onSubmit={handleSubmit} className="max-w-6xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('Wastage Details')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('Wastage No')}</label>
                <Input value={formData.wastage_no} onChange={(e) => handleFormChange('wastage_no', e.target.value)} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('Wastage Date')}</label>
                <Input type="date" value={formData.wastage_date} onChange={(e) => handleFormChange('wastage_date', e.target.value)} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('Branch')}</label>
                <Select value={formData.branch_id} onValueChange={(value) => handleFormChange('branch_id', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('Select branch')} />
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
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('Notes')}</label>
              <Textarea value={formData.notes} onChange={(e) => handleFormChange('notes', e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex items-center justify-between gap-4">
            <CardTitle>{t('Items')}</CardTitle>
            <Button type="button" variant="default" onClick={openAddItemModal}>
              <Plus className="mr-2 h-4 w-4" />
              {t('Add Item')}
            </Button>
          </CardHeader>
          <CardContent>
            {items.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('Product')}</TableHead>
                    <TableHead>{t('SKU')}</TableHead>
                    <TableHead>{t('Batch')}</TableHead>
                    <TableHead>{t('Quantity')}</TableHead>
                    <TableHead>{t('Cost Price')}</TableHead>
                    <TableHead>{t('Line Total')}</TableHead>
                    <TableHead>{t('Actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, index) => {
                    const product = products.find((product: any) => product.id === item.product_id);
                    return (
                      <TableRow key={index}>
                        <TableCell>{product?.name || t('-')}</TableCell>
                        <TableCell>{product?.sku || t('-')}</TableCell>
                        <TableCell>{item.batch_no || t('-')}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>{window.appSettings?.formatCurrency?.(Number(item.unit_price)) ?? Number(item.unit_price).toFixed(2)}</TableCell>
                        <TableCell>{window.appSettings?.formatCurrency?.(Number(item.quantity * item.unit_price)) ?? Number(item.quantity * item.unit_price).toFixed(2)}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => handleEditItem(index)}>
                              {t('Edit')}
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleRemoveItem(index)}>
                              {t('Remove')}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-10 text-gray-500">{t('No items added yet.')}</div>
            )}
          </CardContent>
          <div className="p-4 text-right text-sm font-medium text-gray-700">
            {t('Total')}: {window.appSettings?.formatCurrency?.(Number(totalAmount)) ?? Number(totalAmount).toFixed(2)}
          </div>
        </Card>

        <div className="flex justify-end gap-2 pb-6">
          <Button type="button" variant="outline" onClick={() => router.visit(route('inventory.wastages.index'))}>
            {t('Cancel')}
          </Button>
          <Button type="submit">{t('Save Wastage')}</Button>
        </div>
      </form>

      <Dialog open={isItemModalOpen} onOpenChange={setIsItemModalOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{itemModalStep === 'select' ? t('Select a product') : t('Item details')}</DialogTitle>
            <DialogDescription>
              {itemModalStep === 'select'
                ? t('Search by product name or SKU to add a wastage item.')
                : t('Enter quantity and cost price for the selected product.')}
            </DialogDescription>
          </DialogHeader>

          {itemModalStep === 'select' ? (
            <div className="space-y-4">
              <Input
                placeholder={t('Search products...')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mb-4"
              />
              <div className="grid gap-3 max-h-80 overflow-y-auto">
                {filteredProducts.map((product: any) => (
                  <button
                    type="button"
                    key={product.id}
                    className="rounded-lg border p-4 text-left hover:border-blue-500"
                    onClick={() => handleSelectProduct(product)}
                  >
                    <div className="font-semibold">{product.name}</div>
                    <div className="text-sm text-gray-500">{product.sku}</div>
                    <div className="text-xs text-emerald-600">
                      {t('Available stock')}: {Number(stockForSelectedBranch[product.id] ?? 0).toFixed(2)}
                    </div>
                  </button>
                ))}
                {filteredProducts.length === 0 && (
                  <div className="text-sm text-gray-500">{t('No products found.')}</div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">{selectedProduct?.name || t('Product')}</p>
                <p className="text-sm text-gray-500">{selectedProduct?.sku}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('Batch')}</label>
                  <Select
                    value={currentItem?.batch_no ?? ''}
                    onValueChange={(value) => {
                      const selectedBatch = availableBatches.find((batch: any) => batch.batch_no === value);
                      setCurrentItem((prev) => ({
                        ...prev!,
                        batch_no: value,
                        unit_price: selectedBatch ? Number(selectedBatch.unit_price) : Number(prev?.unit_price ?? 0),
                        pack_size: selectedBatch?.pack_size ?? null,
                      }));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('Select batch')} />
                    </SelectTrigger>
                    <SelectContent>
                      {availableBatches.filter((batch: any) => Number(batch.available_units) > 0).map((batch: any) => (
                        <SelectItem key={batch.batch_no} value={batch.batch_no}>
                          {batch.batch_no} ({t('Stock')}: {batch.available_units})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('Wastage Quantity')}</label>
                  <Input
                    type="number"
                    min={1}
                    step={1}
                    value={currentItem?.quantity ?? 1}
                    onChange={(e) => setCurrentItem((prev) => ({ ...prev!, quantity: Number(e.target.value) }))}
                  />
                  <p className="mt-1 text-xs text-gray-500">{t('Enter wastage quantity in tablets.')}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('Unit Cost Price')}</label>
                  <Input
                    type="number"
                    min={0}
                    step="0.0001"
                    value={currentItem?.unit_price ?? 0}
                    onChange={(e) => setCurrentItem((prev) => ({ ...prev!, unit_price: Number(e.target.value) }))}
                  />
                  <p className="mt-1 text-xs text-gray-500">{t('Enter the cost per tablet.')}</p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex justify-between gap-2">
            <Button type="button" variant="outline" onClick={() => setIsItemModalOpen(false)}>
              {t('Cancel')}
            </Button>
            {itemModalStep === 'select' ? (
              <Button
                type="button"
                onClick={() => {
                  if (!currentItem?.product_id) {
                    toast.error(t('Please select a product first.'));
                    return;
                  }
                  setItemModalStep('details');
                }}
                disabled={!currentItem?.product_id}
              >
                {t('Continue')}
              </Button>
            ) : (
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
