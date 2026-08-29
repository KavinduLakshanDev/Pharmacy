import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageTemplate } from '@/components/page-template';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useForm, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { CheckCircle, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Branch {
  id: number;
  name: string;
}

interface Supplier {
  AdrKy: number;
  AdrCd: string;
  FstNm: string;
  LstNm: string;
  TP1: string;
  Address: string;
}

interface GrnOption {
  id: number;
  invoice_no: string;
  grn_no: string;
  grn_date: string;
  total_amount: number;
}

interface GrnItem {
  grn_item_id: number;
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
}

interface SupplierReturnProductInput {
  grn_item_id: number;
  product_id: number;
  quantity: number;
  return_quantity: number;
  unit_price: number;
  batch_no: string | null;
  expiry_date: string | null;
}

export default function SupplierReturnsCreatePage() {
  const { flash } = usePage<{ flash?: { success?: string }; branches?: Branch[] }>().props;
  const { branches = [] } = usePage<{ branches: Branch[] }>().props;
  const { t: translate } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [grns, setGrns] = useState<GrnOption[]>([]);
  const [selectedGrnId, setSelectedGrnId] = useState<number | null>(null);
  const [grnItems, setGrnItems] = useState<GrnItem[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data, setData, post, processing, reset } = useForm<any>({
    supplier_id: 0,
    grn_id: 0,
    branch_id: null as number | null,
    return_date: new Date().toISOString().split('T')[0],
    notes: '',
    products: [] as SupplierReturnProductInput[],
  });

  useEffect(() => {
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    if (searchTerm.length >= 2) {
      const timeout = setTimeout(() => {
        fetch(route('inventory.supplier-returns.search-suppliers') + `?search=${encodeURIComponent(searchTerm)}`)
          .then((response) => response.json())
          .then(setSuppliers)
          .catch(console.error);
      }, 300);

      searchTimeout.current = timeout;
    } else {
      setSuppliers([]);
    }

    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [searchTerm]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const branchParam = params.get('branch_id');
    const productParam = params.get('product_id');
    const batchParam = params.get('batch_no');

    const branchId = branchParam ? Number(branchParam) : null;
    const productId = productParam ? Number(productParam) : null;
    const batchNo = batchParam || null;

    if (branchId !== null && !Number.isNaN(branchId)) {
      setSelectedBranchId(branchId);
      setData('branch_id', branchId);
    }

    if (productId !== null && !Number.isNaN(productId) && batchNo) {
      const query = new URLSearchParams();
      query.set('product_id', String(productId));
      query.set('batch_no', batchNo);

      if (branchId !== null && !Number.isNaN(branchId)) {
        query.set('branch_id', String(branchId));
      }

      fetch(`${route('inventory.supplier-returns.targets')}?${query.toString()}`)
        .then((response) => response.ok ? response.json() : null)
        .then((result) => {
          if (!result) {
            return;
          }

          if (result.branch_id) {
            setSelectedBranchId(result.branch_id);
            setData('branch_id', result.branch_id);
          }

          if (result.supplier) {
            setSelectedSupplier(result.supplier);
            setSearchTerm(`${result.supplier.FstNm} ${result.supplier.LstNm}`);
            setData('supplier_id', result.supplier.AdrKy);
          }

          if (result.grns?.length) {
            setGrns(result.grns);
          }

          if (result.default_grn_id) {
            setSelectedGrnId(result.default_grn_id);
            setData('grn_id', result.default_grn_id);
            fetchGrnDetails(result.default_grn_id);
          }
        })
        .catch(console.error);
    }
  }, []);

  const selectSupplier = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setSearchTerm(`${supplier.FstNm} ${supplier.LstNm}`);
    setSuppliers([]);
    setSelectedGrnId(null);
    setGrnItems([]);
    setData('supplier_id', supplier.AdrKy);
    setData('grn_id', 0);
    setData('products', []);

    fetch(route('inventory.supplier-returns.grns', supplier.AdrKy))
      .then((response) => response.json())
      .then(setGrns)
      .catch(console.error);
  };

  const fetchGrnDetails = (grnId: number) => {
    setSelectedGrnId(grnId);
    setData('grn_id', grnId);

    const url = route('inventory.supplier-returns.grn-details', grnId)
      + (selectedBranchId ? `?branch_id=${selectedBranchId}` : '');

    fetch(url)
      .then((response) => response.json())
      .then((result) => {
        const items = result.items.map((item: Omit<GrnItem, 'return_quantity'>) => ({
          ...item,
          quantity: Number(item.quantity) || 0,
          available_stock: Number(item.available_stock) || 0,
          available_units: Number(item.available_units) || 0,
          pack_size: item.pack_size ? Number(item.pack_size) : null,
          unit_cost_price: Number(item.unit_cost_price) || 0,
          unit_stock: Number(item.unit_stock ?? item.available_stock) || 0,
          unit_price: Number(item.unit_price) || 0,
          total_price: Number(item.total_price) || 0,
          return_quantity: 0,
        }));

        setGrnItems(items);
        setData('products', items.map((item: GrnItem) => ({
          grn_item_id: item.grn_item_id,
          product_id: item.product_id,
          quantity: item.return_quantity,
          return_quantity: item.return_quantity,
          unit_price: item.unit_price,
          batch_no: item.batch_no,
          expiry_date: item.expiry_date,
        })));
      })
      .catch(console.error);
  };

  const handleReturnQuantityChange = (grnItemId: number, value: string) => {
    const newQuantity = Number(value);
    const updatedItems = grnItems.map((item) => {
      if (item.grn_item_id !== grnItemId) {
        return item;
      }

      // Max allowed is in units (tablets)
      const maxAllowedUnits = item.available_units;
      const sanitizedQuantity = isNaN(newQuantity)
        ? 0
        : Math.max(0, Math.min(newQuantity, maxAllowedUnits));

      return { ...item, return_quantity: sanitizedQuantity };
    });

    setGrnItems(updatedItems);
    setData('products', updatedItems.map((item) => ({
      grn_item_id: item.grn_item_id,
      product_id: item.product_id,
      // Convert units back to boxes before sending to server
      quantity: item.pack_size ? item.return_quantity / item.pack_size : item.return_quantity,
      return_quantity: item.return_quantity,
      // Convert tablet unit_cost_price back to box price for the ledger
      unit_price: item.pack_size ? item.unit_cost_price * item.pack_size : item.unit_cost_price,
      batch_no: item.batch_no,
      expiry_date: item.expiry_date,
    })));
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    post(route('inventory.supplier-returns.store'), {
      preserveScroll: true,
      onSuccess: () => {
        setSelectedSupplier(null);
        setSelectedGrnId(null);
        setSelectedBranchId(null);
        setGrnItems([]);
        reset();
      },
    });
  };

  const grandTotal = grnItems.reduce((sum, item) => sum + item.return_quantity * item.unit_cost_price, 0);

  const breadcrumbs = [
    { title: translate('Dashboard'), href: route('dashboard') },
    { title: translate('Inventory'), href: route('inventory.dashboard') },
    { title: translate('Supplier Returns'), href: route('inventory.supplier-returns.index') },
    { title: translate('Add Supplier Return') },
  ];

  return (
    <PageTemplate
      title={translate('Add Supplier Return')}
      description={translate('Create and manage product returns to suppliers.')}
      url="/inventory/supplier-returns/create"
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

        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Search className="h-4 w-4" />
                {translate('Supplier')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="supplier-search">{translate('Search Supplier')}</Label>
                <Input
                  id="supplier-search"
                  type="text"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder={translate('Enter supplier name or contact')}
                  className="mt-1"
                />
              </div>

              {suppliers.length > 0 && (
                <div className="space-y-2 rounded-lg border border-gray-200 bg-white p-2 shadow-sm">
                  {suppliers.map((supplier) => (
                    <button
                      key={supplier.AdrKy}
                      type="button"
                      className="w-full rounded-lg px-3 py-2 text-left hover:bg-gray-50"
                      onClick={() => selectSupplier(supplier)}
                    >
                      <div className="font-medium">{supplier.FstNm}</div>
                      <div className="text-xs text-gray-500">{supplier.AdrCd}</div>
                    </button>
                  ))}
                </div>
              )}

              {selectedSupplier ? (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-slate-50 p-4">
                  <div className="text-sm font-semibold text-slate-800">{selectedSupplier.FstNm}</div>
                  <div className="text-sm text-slate-600">{selectedSupplier.AdrCd}</div>
                  <div className="text-sm text-slate-500">{selectedSupplier.TP1}</div>
                  <div className="mt-2 text-sm text-slate-500">{selectedSupplier.Address}</div>
                </div>
              ) : (
                <p className="text-sm text-slate-500">{translate('Select a supplier to load supplier invoices.')}</p>
              )}
            </CardContent>
          </Card>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{translate('Invoice & Return Details')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="branch-select">{translate('Branch')}</Label>
                    <Select
                      value={selectedBranchId ? String(selectedBranchId) : ''}
                      onValueChange={(value) => {
                        const id = Number(value) || null;
                        setSelectedBranchId(id);
                        setData('branch_id', id);
                        // Re-fetch GRN details if already selected so available stock updates
                        if (selectedGrnId) {
                          const url = route('inventory.supplier-returns.grn-details', selectedGrnId)
                            + (id ? `?branch_id=${id}` : '');
                          fetch(url)
                            .then((response) => response.json())
                            .then((result) => {
                              const items = result.items.map((item: Omit<GrnItem, 'return_quantity'>) => ({
                                ...item,
                                quantity: Number(item.quantity) || 0,
                                available_stock: Number(item.available_stock) || 0,
                                available_units: Number(item.available_units) || 0,
                                pack_size: item.pack_size ? Number(item.pack_size) : null,
                                unit_cost_price: Number(item.unit_cost_price) || 0,
                                unit_price: Number(item.unit_price) || 0,
                                total_price: Number(item.total_price) || 0,
                                return_quantity: 0,
                              }));
                              setGrnItems(items);
                            })
                            .catch(console.error);
                        }
                      }}
                    >
                      <SelectTrigger id="branch-select" className="mt-1">
                        <SelectValue placeholder={translate('All branches')} />
                      </SelectTrigger>
                      <SelectContent>
                        {branches.map((branch) => (
                          <SelectItem key={branch.id} value={String(branch.id)}>
                            {branch.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="grn-select">{translate('Supplier Invoice')}</Label>
                    <Select value={selectedGrnId ? String(selectedGrnId) : ''} onValueChange={(value) => fetchGrnDetails(Number(value))}>
                      <SelectTrigger id="grn-select" className="mt-1">
                        <SelectValue placeholder={translate('Select invoice')} />
                      </SelectTrigger>
                      <SelectContent>
                        {grns.map((grn) => (
                          <SelectItem key={grn.id} value={String(grn.id)}>
                            {grn.invoice_no} · {grn.grn_date}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedSupplier && grns.length === 0 && (
                      <p className="mt-2 text-sm text-slate-500">{translate('No invoices found for this supplier.')}</p>
                    )}
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

                {grnItems.length > 0 && (
                  <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold">{translate('Product')}</th>
                          <th className="px-4 py-3 text-right font-semibold">{translate('Unit Stock (tablet)')}</th>
                          <th className="px-4 py-3 text-right font-semibold">{translate('Return Qty')}</th>
                          <th className="px-4 py-3 text-right font-semibold">{translate('Unit Price')}</th>
                          <th className="px-4 py-3 text-right font-semibold">{translate('Line Total')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {grnItems.map((item) => (
                          <tr key={item.grn_item_id}>
                            <td className="whitespace-nowrap px-4 py-3">{item.product_name}</td>
                            <td className="whitespace-nowrap px-4 py-3 text-right">
                              {(item.unit_stock ?? item.available_units ?? 0).toFixed(0)}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <Input
                                type="number"
                                min="0"
                                max={String(item.available_units)}
                                step="1"
                                value={String(item.return_quantity)}
                                onChange={(event) => handleReturnQuantityChange(item.grn_item_id, event.target.value)}
                                className="w-24"
                              />
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 text-right">{item.unit_cost_price.toFixed(2)}</td>
                            <td className="whitespace-nowrap px-4 py-3 text-right">{(item.return_quantity * item.unit_cost_price).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-gray-50">
                        <tr>
                          <td className="px-4 py-3 font-semibold" colSpan={4}>
                            {translate('Total Return Amount')}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-right font-semibold">{grandTotal.toFixed(2)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}

                <div className="flex items-center justify-end gap-3">
                  <Button type="submit" disabled={processing || selectedGrnId === null || grandTotal <= 0}>
                    {translate('Record Return')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>
        </div>
      </div>
    </PageTemplate>
  );
}
