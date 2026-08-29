import { useEffect, useRef, useState } from 'react';
import { PageTemplate, type PageAction } from '@/components/page-template';
import { usePage, router, Link } from '@inertiajs/react';
import { Plus, Eye, Edit, Trash2 } from 'lucide-react';
import { hasPermission } from '@/utils/authorization';
import { CrudTable } from '@/components/CrudTable';
import { CrudFormModal } from '@/components/CrudFormModal';
import { CrudDeleteModal } from '@/components/CrudDeleteModal';
import { toast } from '@/components/custom-toast';
import { useTranslation } from 'react-i18next';
import { Pagination } from '@/components/ui/pagination';
import { SearchAndFilterBar } from '@/components/ui/search-and-filter-bar';
import { Button } from '@/components/ui/button';
import SearchableSelect from '@/components/ui/searchable-select';

function RecommendedSupplierPanel({
  formData,
  handleChange,
  loading,
  recommendations,
  t,
}: {
  formData: any;
  handleChange: (field: string, value: string) => void;
  loading: boolean;
  recommendations: any[];
  t: (key: string) => string;
}) {
  const lastAutoAppliedSupplierId = useRef('');

  useEffect(() => {
    const topRecommendation = recommendations[0];
    const topSupplierId = topRecommendation ? String(topRecommendation.supplier_id) : '';
    const selectedSupplierId = String(formData.supplier_id || '');

    if (!topSupplierId) {
      return;
    }

    const shouldAutoApply = selectedSupplierId === '' || selectedSupplierId === lastAutoAppliedSupplierId.current;

    if (shouldAutoApply && selectedSupplierId !== topSupplierId) {
      handleChange('supplier_id', topSupplierId);
      lastAutoAppliedSupplierId.current = topSupplierId;
    }
  }, [formData.supplier_id, handleChange, recommendations]);

  return (
    <div className="col-span-2 rounded-lg border border-amber-200 bg-amber-50 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h4 className="text-sm font-semibold text-amber-900">{t('Recommended Supplier')}</h4>
          <p className="text-xs text-amber-700">
            {loading
              ? t('Calculating supplier ranking...')
              : t('Based on cost price and delivery speed from GRN history.')}
          </p>
        </div>
        {recommendations[0] && (
          <Button
            type="button"
            variant="outline"
            onClick={() => handleChange('supplier_id', String(recommendations[0].supplier_id))}
          >
            {t('Use Top Supplier')}
          </Button>
        )}
      </div>

      {recommendations.length > 0 ? (
        <div className="space-y-3">
          {recommendations.slice(0, 3).map((recommendation: any, index: number) => (
            <div key={recommendation.supplier_id} className="rounded-md border border-amber-200 bg-white p-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-gray-900">
                    #{index + 1} {recommendation.supplier_name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {t('Score')}: {recommendation.score} | {t('Cost')}: {recommendation.cost_score} | {t('Delivery')}: {recommendation.delivery_score}
                  </p>
                  {recommendation.average_delivery_days !== null && (
                    <p className="text-xs text-gray-500">
                      {t('Average delivery time')}: {recommendation.average_delivery_days} {t('days')}
                    </p>
                  )}
                </div>
                <Button
                  type="button"
                  onClick={() => handleChange('supplier_id', String(recommendation.supplier_id))}
                  variant={String(formData.supplier_id || '') === String(recommendation.supplier_id) ? 'default' : 'outline'}
                >
                  {t('Select')}
                </Button>
              </div>
              {Array.isArray(recommendation.reasons) && recommendation.reasons.length > 0 && (
                <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-gray-600">
                  {recommendation.reasons.map((reason: string) => (
                    <li key={reason}>{reason}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-amber-700">
          {t('Select a product to recommend a supplier from GRN history.')}
        </p>
      )}
    </div>
  );
}

export default function PurchaseOrders() {
  const { t } = useTranslation();
  const { auth, purchaseOrders, suppliers = [], products, users = [], filters: pageFilters = {} } = usePage().props as any;
  const permissions = auth?.permissions || [];
  const isCompany = auth?.user?.type === 'company';

  const [searchTerm, setSearchTerm] = useState(pageFilters.search || '');
  const [selectedSupplier, setSelectedSupplier] = useState(pageFilters.supplier_id || 'all');
  const [selectedAssignee, setSelectedAssignee] = useState(pageFilters.assigned_to || 'all');
  const [showFilters, setShowFilters] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<any>(null);
  const [formMode, setFormMode] = useState<'create' | 'edit' | 'view'>('create');
  const [currentProductItem, setCurrentProductItem] = useState({
    product_id: '',
    quantity: 1,
    unit_price: 0,
    discount_type: 'none',
    discount_value: 0
  });
  const [currentProductError, setCurrentProductError] = useState('');
  const [addedProducts, setAddedProducts] = useState<any[]>([]);
  const [supplierRecommendations, setSupplierRecommendations] = useState<any[]>([]);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);

  const hasActiveFilters = () => {
    return searchTerm !== '' || selectedSupplier !== 'all' || selectedAssignee !== 'all';
  };

  const activeFilterCount = () => {
    return (searchTerm ? 1 : 0) + (selectedSupplier !== 'all' ? 1 : 0) + (selectedAssignee !== 'all' ? 1 : 0);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters();
  };

  const applyFilters = () => {
    router.get(route('purchase-orders.index'), {
      page: 1,
      search: searchTerm || undefined,
      supplier_id: selectedSupplier !== 'all' ? selectedSupplier : undefined,
      assigned_to: selectedAssignee !== 'all' ? selectedAssignee : undefined,
      per_page: pageFilters.per_page
    }, { preserveState: true, preserveScroll: true });
  };

  const handleSort = (field: string) => {
    const direction = pageFilters.sort_field === field && pageFilters.sort_direction === 'asc' ? 'desc' : 'asc';

    router.get(route('purchase-orders.index'), {
      sort_field: field,
      sort_direction: direction,
      page: 1,
      search: searchTerm || undefined,
      supplier_id: selectedSupplier !== 'all' ? selectedSupplier : undefined,
      assigned_to: selectedAssignee !== 'all' ? selectedAssignee : undefined,
      per_page: pageFilters.per_page
    }, { preserveState: true, preserveScroll: true });
  };

  const handleAction = (action: string, item: any) => {
    setCurrentItem(item);

    switch (action) {
      case 'view':
        router.get(route('purchase-orders.show', item.id));
        break;
      case 'edit':
        setFormMode('edit');
        setIsFormModalOpen(true);
        clearProductLineFields();
        const loadedProducts = item.products?.map((product: any) => ({
          product_id: product.id,
          quantity: product.pivot.quantity,
          unit_price: product.pivot.unit_price,
          discount_type: product.pivot.discount_type || 'none',
          discount_value: product.pivot.discount_value || 0
        })) || [];
        setAddedProducts(loadedProducts);
        break;
      case 'delete':
        setIsDeleteModalOpen(true);
        break;
      case 'receive':
        router.get(route('grns.create-from-po', item.id));
        break;
    }
  };

  const clearProductLineFields = () => {
    setCurrentProductItem({
      product_id: '',
      quantity: 1,
      unit_price: 0,
      discount_type: 'none',
      discount_value: 0
    });
    setCurrentProductError('');
  };

  useEffect(() => {
    if (!isFormModalOpen) {
      return;
    }

    const productIds = Array.from(
      new Set(
        [...addedProducts, ...(currentProductItem.product_id ? [currentProductItem] : [])]
          .map((item) => String(item.product_id || ''))
          .filter(Boolean),
      ),
    );

    if (productIds.length === 0) {
      setSupplierRecommendations([]);
      return;
    }

    const controller = new AbortController();

    setRecommendationsLoading(true);

    const params = new URLSearchParams();
    productIds.forEach((productId) => params.append('product_ids[]', productId));

    fetch(`${route('purchase-orders.recommend-suppliers')}?${params.toString()}`, {
      headers: {
        Accept: 'application/json',
      },
      signal: controller.signal,
    })
      .then((response) => response.json())
      .then((data) => {
        setSupplierRecommendations(Array.isArray(data.recommendations) ? data.recommendations : []);
      })
      .catch(() => {
        setSupplierRecommendations([]);
      })
      .finally(() => {
        setRecommendationsLoading(false);
      });

    return () => controller.abort();
  }, [addedProducts, currentProductItem.product_id, isFormModalOpen]);

  const handleAddNew = () => {
    setCurrentItem(null);
    setFormMode('create');
    setIsFormModalOpen(true);
    clearProductLineFields();
    setAddedProducts([]);
  };

  const handleFormSubmit = (formData: any) => {
    const submitData = {
      ...formData,
      products: Array.isArray(formData.products) && formData.products.length > 0 ? formData.products : addedProducts
    };

    if (!submitData.products || !Array.isArray(submitData.products) || submitData.products.length === 0) {
      toast.error(t('Add at least one product before saving the purchase order.'));
      return;
    }

    // Remove manual total calculations - let backend handle this
    // The backend calculateTotals() method will compute correct values

    if (formMode === 'create') {
      toast.loading(t('Creating purchase order...'));

      router.post(route('purchase-orders.store'), submitData, {
        onSuccess: (page) => {
          setIsFormModalOpen(false);
          toast.dismiss();
          const flash = (page.props as any).flash as { success?: string; error?: string };
          if (flash?.success) {
            toast.success(t(flash.success));
          }
        },
        onError: (errors) => {
          toast.dismiss();
          toast.error(t('Failed to create: {{errors}}', { errors: Object.values(errors).join(', ') }));
        }
      });
    } else if (formMode === 'edit') {
      toast.loading(t('Updating purchase order...'));

      router.put(route('purchase-orders.update', currentItem.id), submitData, {
        onSuccess: (page) => {
          setIsFormModalOpen(false);
          toast.dismiss();
          const flash = (page.props as any).flash as { success?: string; error?: string };
          if (flash?.success) {
            toast.success(t(flash.success));
          } else if (flash?.error) {
            toast.error(t(flash.error));
          }
        },
        onError: (errors) => {
          toast.dismiss();
          toast.error(t('Failed to update: {{errors}}', { errors: Object.values(errors).join(', ') }));
        }
      });
    }
  };

  const handleDeleteConfirm = () => {
    toast.loading(t('Deleting purchase order...'));

    router.delete(route('purchase-orders.destroy', currentItem.id), {
      onSuccess: (page) => {
        setIsDeleteModalOpen(false);
        toast.dismiss();
        const flash = (page.props as any).flash as { success?: string; error?: string };
        if (flash?.success) {
          toast.success(t(flash.success));
        } else if (flash?.error) {
          toast.error(t(flash.error));
        }
      },
      onError: (errors) => {
        toast.dismiss();
        toast.error(t('Failed to delete: {{errors}}', { errors: Object.values(errors).join(', ') }));
      }
    });
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedSupplier('all');
    setSelectedAssignee('all');
    setShowFilters(false);

    router.get(route('purchase-orders.index'), {
      page: 1,
      supplier_id: undefined,
      per_page: pageFilters.per_page
    }, { preserveState: true, preserveScroll: true });
  };

  const pageActions: PageAction[] = [];

  if (hasPermission(permissions, 'create-purchase-orders')) {
    pageActions.push({
      label: t('Add Purchase Order'),
      icon: <Plus className="h-4 w-4 mr-2" />,
      variant: 'default',
      onClick: () => handleAddNew()
    });
  }

  const breadcrumbs = [
    { title: t('Dashboard'), href: route('dashboard') },
    { title: t('Purchase Orders') }
  ];

  const columns = [
    {
      key: 'order_number',
      label: t('Order Number'),
      sortable: true,
      render: (value: string, item: any) => (
        <Link
          href={route('purchase-orders.show', item.id)}
          className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800 transition-colors duration-200 border border-blue-200 hover:border-blue-300"
        >
          {value}
        </Link>
      )
    },
    {
      key: 'name',
      label: t('Name'),
      sortable: true
    },
    {
      key: 'supplier',
      label: t('Supplier'),
      render: (value: any) => value?.company_name || t('-')
    },
    {
      key: 'order_date',
      label: t('Order Date'),
      sortable: true,
      render: (value: string) => window.appSettings?.formatDateTime(value, false) || new Date(value).toLocaleDateString()
    },
    {
      key: 'created_at',
      label: t('Created At'),
      sortable: true,
      render: (value: string) => window.appSettings?.formatDateTime(value, false) || new Date(value).toLocaleDateString()
    }
  ];

  const actions = [
    {
      label: t('View'),
      icon: 'Eye',
      action: 'view',
      className: 'text-blue-500',
      requiredPermission: 'view-purchase-orders'
    },
    {
      label: t('Edit'),
      icon: 'Edit',
      action: 'edit',
      className: 'text-amber-500',
      requiredPermission: 'edit-purchase-orders'
    },
    {
      label: t('Receive Items'),
      icon: 'PackageCheck',
      action: 'receive',
      className: 'text-green-500',
      requiredPermission: 'manage-grns'
    },
    {
      label: t('Delete'),
      icon: 'Trash2',
      action: 'delete',
      className: 'text-red-500',
      requiredPermission: 'delete-purchase-orders'
    }
  ];

  return (
    <PageTemplate
      title={t("Purchase Orders")}
      description={t('Manage and search purchase orders.')}
      url="/purchase-orders"
      actions={pageActions}
      breadcrumbs={breadcrumbs}
      noPadding
    >
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow mb-4 p-4">
        <SearchAndFilterBar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onSearch={handleSearch}
          filters={[
            {
              name: 'supplier_id',
              label: t('Supplier'),
              type: 'select' as const,
              value: selectedSupplier,
              onChange: setSelectedSupplier,
              options: [
                { value: 'all', label: t('All Suppliers') },
                ...suppliers?.map((supplier: any) => ({ value: supplier.id.toString(), label: supplier.company_name })) || []
              ]
            },
            ...(isCompany ? [{
              name: 'assigned_to',
              label: t('Assigned To'),
              type: 'select' as const,
              value: selectedAssignee,
              onChange: setSelectedAssignee,
              options: [
                { value: 'all', label: t('All Users') },
                { value: 'unassigned', label: t('Unassigned') },
                ...users.map((user: any) => ({ value: user.id.toString(), label: user.name }))
              ]
            }] : [])
          ]}
          showFilters={showFilters}
          setShowFilters={setShowFilters}
          hasActiveFilters={hasActiveFilters}
          activeFilterCount={activeFilterCount}
          onResetFilters={handleResetFilters}
          onApplyFilters={applyFilters}
          currentPerPage={pageFilters.per_page?.toString() || "10"}
          onPerPageChange={(value) => {
            router.get(route('purchase-orders.index'), {
              page: 1,
              per_page: parseInt(value),
              search: searchTerm || undefined,
              supplier_id: selectedSupplier !== 'all' ? selectedSupplier : undefined,
              assigned_to: selectedAssignee !== 'all' ? selectedAssignee : undefined
            }, { preserveState: true, preserveScroll: true });
          }}
        />
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-lg shadow overflow-hidden">
        <CrudTable
          columns={columns}
          actions={actions}
          data={purchaseOrders?.data || []}
          from={purchaseOrders?.from || 1}
          onAction={handleAction}
          sortField={pageFilters.sort_field}
          sortDirection={pageFilters.sort_direction}
          onSort={handleSort}
          permissions={permissions}
          entityPermissions={{
            view: 'view-purchase-orders',
            edit: 'edit-purchase-orders',
            delete: 'delete-purchase-orders'
          }}
        />

        <Pagination
          from={purchaseOrders?.from || 0}
          to={purchaseOrders?.to || 0}
          total={purchaseOrders?.total || 0}
          links={purchaseOrders?.links}
          entityName={t("purchase orders")}
          onPageChange={(url) => router.get(url)}
        />
      </div>

      <CrudFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSubmit={handleFormSubmit}
        formConfig={{
          productOptions: products,
          modalSize: '5xl',
          layout: 'grid',
          columns: 2,
          fields: [
            { name: 'name', label: t('Name'), type: 'text', required: true, colSpan: 2 },
            { name: 'description', label: t('Description'), type: 'textarea', colSpan: 2 },
            {
              name: 'supplier_recommendation',
              label: t('Recommended Supplier'),
              type: 'custom',
              colSpan: 2,
              render: (_field: any, formData: any, handleChange: any) => (
                <RecommendedSupplierPanel
                  formData={formData}
                  handleChange={handleChange}
                  loading={recommendationsLoading}
                  recommendations={supplierRecommendations}
                  t={t}
                />
              )
            },
            {
              name: formMode === 'view' ? 'supplier_name' : 'supplier_id',
              label: t('Supplier'),
              type: formMode === 'view' ? 'text' : 'select',
              readOnly: formMode === 'view',
              options: formMode === 'view' ? [] : [
                ...suppliers?.map((supplier: any) => ({ value: supplier.id, label: supplier.company_name })) || []
              ]
            },
            { name: 'order_date', label: t('Order Date'), type: 'date', required: true, defaultValue: new Date().toISOString().split('T')[0] },
            { name: 'expected_delivery_date', label: t('Expected Delivery Date'), type: 'date' },
            {
              name: 'products_header',
              label: t('Products & Services'),
              type: 'custom',
              colSpan: 2,
              render: () => (
                <div className="col-span-2 border-t pt-4 mt-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">{t('Products & Services')}</h3>
                </div>
              )
            },
            {
              name: 'products',
              label: t('Products & Services'),
              type: 'custom',
              colSpan: 2,
              render: (field: any, formData: any, handleChange: any) => {
                const currentProducts = addedProducts.length > 0 ? addedProducts : (formData.products || []);
                const selectedProduct = products?.find((product: any) => String(product.id) === String(currentProductItem.product_id));
                const productPrice = currentProductItem.unit_price || parseFloat(selectedProduct?.price || 0) || 0;
                const productTotal = (currentProductItem.quantity || 0) * productPrice;
                const discountAmount = currentProductItem.discount_type === 'percentage'
                  ? (productTotal * (currentProductItem.discount_value || 0)) / 100
                  : Math.min(currentProductItem.discount_value || 0, productTotal);
                const lineTotal = productTotal - discountAmount;

                const addProductLine = () => {
                  if (!currentProductItem.product_id) {
                    setCurrentProductError(t('Please select a product.'));
                    return;
                  }

                  if (!currentProductItem.quantity || currentProductItem.quantity < 1) {
                    setCurrentProductError(t('Please enter a valid quantity.'));
                    return;
                  }

                  const newLine = {
                    product_id: currentProductItem.product_id,
                    quantity: currentProductItem.quantity,
                    unit_price: productPrice,
                    discount_type: currentProductItem.discount_type || 'none',
                    discount_value: currentProductItem.discount_value || 0
                  };

                  const existingProductIndex = currentProducts.findIndex((item: any) => String(item.product_id) === String(newLine.product_id));
                  const nextProducts = existingProductIndex > -1
                    ? currentProducts.map((item: any, index: number) => index === existingProductIndex
                        ? {
                            ...item,
                            quantity: Number(item.quantity || 0) + Number(newLine.quantity || 0),
                            unit_price: newLine.unit_price,
                            discount_type: newLine.discount_type,
                            discount_value: newLine.discount_value
                          }
                        : item)
                    : [...currentProducts, newLine];

                  handleChange('products', nextProducts);
                  setAddedProducts(nextProducts);
                  clearProductLineFields();
                  setCurrentProductError('');
                };

                const removeProductLine = (index: number) => {
                  const nextProducts = currentProducts.filter((_: any, i: number) => i !== index);
                  handleChange('products', nextProducts);
                  setAddedProducts(nextProducts);
                };

                const calculateTotals = () => {
                  let subtotal = 0;
                  let totalTax = 0;
                  let totalDiscount = 0;

                  currentProducts.forEach((item: any) => {
                    const quantity = parseFloat(item.quantity) || 0;
                    const unitPrice = parseFloat(item.unit_price) || 0;
                    const itemTotal = quantity * unitPrice;
                    const discountType = item.discount_type;
                    const discountValue = parseFloat(item.discount_value) || 0;
                    const itemDiscount = discountType === 'percentage'
                      ? (itemTotal * discountValue) / 100
                      : Math.min(discountValue, itemTotal);
                    const discountedTotal = itemTotal - itemDiscount;

                    subtotal += discountedTotal;
                    totalDiscount += itemDiscount;

                    const product = products?.find((product: any) => String(product.id) === String(item.product_id));
                    if (product?.tax) {
                      totalTax += (discountedTotal * product.tax.rate) / 100;
                    }
                  });

                  return { subtotal, totalTax, totalDiscount, grandTotal: subtotal + totalTax };
                };

                const totals = calculateTotals();

                return (
                  <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="space-y-1 md:col-span-2">
                        <label className="text-sm font-medium text-gray-700">{t('Product')}</label>
                        <SearchableSelect
                          value={currentProductItem.product_id}
                          onValueChange={(productId) => {
                            const product = products?.find((item: any) => String(item.id) === productId);
                            setCurrentProductItem((prev) => ({
                              ...prev,
                              product_id: productId,
                              unit_price: product ? parseFloat(product.price || 0) : prev.unit_price,
                            }));
                          }}
                          placeholder={t('Select Product')}
                          options={products?.map((product: any) => ({
                            value: String(product.id),
                            label: product.name,
                            sublabel: product.sku ? `${t('SKU')}: ${product.sku}` : undefined,
                          })) || []}
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700">{t('Quantity')}</label>
                        <input
                          type="number"
                          min="1"
                          value={currentProductItem.quantity}
                          onChange={(e) => setCurrentProductItem(prev => ({ ...prev, quantity: parseInt(e.target.value, 10) || 1 }))}
                          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="md:col-span-2"></div>
                      <Button
                        type="button"
                        onClick={addProductLine}
                        className="w-full"
                      >
                        {t('Add Item')}
                      </Button>
                    </div>

                    {currentProductError ? (
                      <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {currentProductError}
                      </div>
                    ) : null}

                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                      <h4 className="text-sm font-semibold text-gray-900 mb-3">{t('Added Products')}</h4>
                      {currentProducts.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200 text-sm">
                            <thead className="bg-white">
                              <tr>
                                <th className="px-3 py-2 text-left font-medium text-gray-600">{t('Product')}</th>
                                <th className="px-3 py-2 text-right font-medium text-gray-600">{t('Qty')}</th>
                                <th className="px-3 py-2 text-right font-medium text-gray-600">{t('Action')}</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {currentProducts.map((item: any, index: number) => {
                                const product = products?.find((product: any) => String(product.id) === String(item.product_id));
                                const quantity = parseFloat(item.quantity) || 0;

                                return (
                                  <tr key={index} className="bg-white">
                                    <td className="px-3 py-2 text-left text-gray-900">{product?.name || t('Unknown')}</td>
                                    <td className="px-3 py-2 text-right text-gray-900">{quantity}</td>
                                    <td className="px-3 py-2 text-right">
                                      <button
                                        type="button"
                                        onClick={() => removeProductLine(index)}
                                        className="text-sm font-medium text-red-600 hover:text-red-700"
                                      >
                                        {t('Remove')}
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">{t('No products added yet.')}</p>
                      )}
                    </div>

                  </div>
                );
              }
            },


          ]
        }}
        initialData={currentItem ? {
          ...currentItem,
          assigned_user_name: currentItem.assigned_user?.name || t('Unassigned'),
          supplier_name: currentItem.supplier?.company_name || t('-'),
          sales_order_name: currentItem.sales_order?.name || t('-'),
          account_name: currentItem.account?.name || t('-'),
          billing_contact_name: currentItem.billing_contact?.name || t('-'),
          shipping_contact_name: currentItem.shipping_contact?.name || t('-'),
          products: currentItem.products?.map((product: any) => ({
            product_id: product.id,
            quantity: product.pivot.quantity,
            unit_price: product.pivot.unit_price,
            discount_type: product.pivot.discount_type || 'none',
            discount_value: product.pivot.discount_value || 0
          })) || []
        } : null}
        title={
          formMode === 'create'
            ? t('Add New Purchase Order')
            : formMode === 'edit'
              ? t('Edit Purchase Order')
              : t('View Purchase Order')
        }
        mode={formMode}
      />

      <CrudDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        itemName={currentItem?.name || ''}
        entityName={t('purchase order')}
      />
    </PageTemplate>
  );
}
