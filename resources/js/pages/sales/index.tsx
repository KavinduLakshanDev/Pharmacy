import { useState } from 'react';
import { PageTemplate } from '@/components/page-template';
import { usePage, router, Link } from '@inertiajs/react';
import { Plus, Eye, Edit, Trash2, Printer } from 'lucide-react';
import { CrudTable } from '@/components/CrudTable';
import { CrudDeleteModal } from '@/components/CrudDeleteModal';
import { Pagination } from '@/components/ui/pagination';
import { SearchAndFilterBar } from '@/components/ui/search-and-filter-bar';
import { useTranslation } from 'react-i18next';
import { toast } from '@/components/custom-toast';
import { hasPermission } from '@/utils/authorization';
import { PosReceipt, type ReceiptData } from './components/pos-receipt';
import { useEffect } from 'react';

export default function SaleIndex() {
  const { t } = useTranslation();
  const { auth, sales, statuses = [], filters: pageFilters = {} } = usePage().props as any;
  const permissions = auth?.permissions || [];

   const [searchTerm, setSearchTerm] = useState(pageFilters.search || '');
  const [showFilters, setShowFilters] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<any>(null);

  const [receiptOpen, setReceiptOpen] = useState(false);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters();
  };

  const applyFilters = () => {
    router.get(route('sales.index'), {
      page: 1,
      search: searchTerm || undefined,
      per_page: pageFilters.per_page,
    }, { preserveState: true, preserveScroll: true });
  };

  const handleSort = (field: string) => {
    const direction = pageFilters.sort_field === field && pageFilters.sort_direction === 'asc' ? 'desc' : 'asc';

    router.get(route('sales.index'), {
      sort_field: field,
      sort_direction: direction,
      page: 1,
      search: searchTerm || undefined,
      per_page: pageFilters.per_page,
    }, { preserveState: true, preserveScroll: true });
  };

  const handleAction = (action: string, item: any) => {
    setCurrentItem(item);

    // Prevent editing completed sales unless user has special permission
    if (action === 'edit' && item.status === 'completed' && !hasPermission(permissions, ['edit-completed-sales'])) {
      toast.error(t('Completed sales cannot be edited.'));
      return;
    }

    if (action === 'delete' && item.status === 'completed' && !hasPermission(permissions, ['edit-completed-sales'])) {
      toast.error(t('Completed sales cannot be deleted.'));
      return;
    }

    switch (action) {
      case 'view':
        router.get(route('sales.show', item.id));
        break;
      case 'edit':
        router.get(route('sales.edit', item.id));
        break;
      case 'delete':
        setIsDeleteModalOpen(true);
        break;
      case 'print':
        handlePrintSale(item);
        break;
    }
  };

  const handlePrintSale = async (item: any) => {
    toast.loading(t('Preparing receipt...'));
    try {
      const response = await fetch(route('sales.search-by-number', { sale_no: item.sale_no }));
      const sale = await response.json();

      if (!response.ok) {
        toast.dismiss();
        toast.error(sale.message || t('Sale not found'));
        return;
      }

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
      setReceiptOpen(true);
      toast.dismiss();
    } catch (error) {
      toast.dismiss();
      toast.error(t('An error occurred while preparing the receipt.'));
    }
  };

  const handleAddNew = () => {
    router.get(route('sales.create'));
  };

  const handleDeleteConfirm = () => {
    if (!currentItem) return;
    router.delete(route('sales.destroy', currentItem.id), {
      onSuccess: () => {
        setIsDeleteModalOpen(false);
      }
    });
  };

  const hasActiveFilters = () => {
    return searchTerm !== '';
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setShowFilters(false);

    router.get(route('sales.index'), {
      page: 1,
      per_page: pageFilters.per_page,
    }, { preserveState: true, preserveScroll: true });
  };

  const breadcrumbs = [
    { title: t('Dashboard'), href: route('dashboard') },
    { title: t('Sales') },
  ];

  const columns = [
    { key: 'sale_no', label: t('Sale Number'), sortable: true, render: (value: any, row: any) => (
      <Link href={route('sales.show', row.id)} className="text-blue-600 hover:underline font-medium">{value}</Link>
    ) },
    { key: 'customer.name', label: t('Customer'), sortable: true, render: (value: any) => value || t('Walk-in') },
    { key: 'sub_total', label: t('Sub Total'), sortable: true, render: (value: any) => window.appSettings?.formatCurrency?.(value) ?? Number(value).toFixed(2) },
    { key: 'discount_amount', label: t('Discount'), sortable: true, render: (value: any) => window.appSettings?.formatCurrency?.(value) ?? Number(value).toFixed(2) },
    { key: 'total_amount', label: t('Total Amount'), sortable: true, render: (value: any) => window.appSettings?.formatCurrency?.(value) ?? Number(value).toFixed(2) },
    { key: 'paid_amount', label: t('Paid'), sortable: true, render: (value: any) => window.appSettings?.formatCurrency?.(value) ?? Number(value).toFixed(2) },
    { key: 'status', label: t('Status'), sortable: true, render: (value: any) => (
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
            value === 'completed' ? 'bg-green-100 text-green-800' : 
            value === 'partial' ? 'bg-orange-100 text-orange-800' : 
            value === 'cancelled' ? 'bg-red-100 text-red-800' : 
            'bg-gray-100 text-gray-800'
        }`}>
            {t(value.charAt(0).toUpperCase() + value.slice(1))}
        </span>
    ) },
  ];

  const actions = [
    { action: 'view', label: t('View'), icon: 'Eye' },
    { action: 'edit', label: t('Edit'), icon: 'Edit' },
    { action: 'print', label: t('Print'), icon: 'Printer' },
    { action: 'delete', label: t('Delete'), icon: 'Trash2' },
  ];

  const entityPermissions = {
    view: ['view-sales', 'manage-sales'],
    edit: ['edit-sales', 'manage-sales', 'edit-completed-sales'],
    print: ['view-sales', 'manage-sales'],
    delete: ['delete-sales', 'manage-sales', 'edit-completed-sales'],
  };

  return (
    <PageTemplate
      title={t('Sales')}
      description={t('Manage sales transactions')}
      url="/sales"
      breadcrumbs={breadcrumbs}
      actions={[
        ...(hasPermission(permissions, ['manage-sales', 'create-sales']) ? [{
          label: t('Add Sale'),
          icon: <Plus className="h-4 w-4 mr-2" />,
          variant: 'default' as const,
          onClick: handleAddNew,
        }] : []),
      ]}
    >
      <div className="space-y-4">
        <div className="rounded-lg bg-white shadow">
          <div className="p-4">
            <SearchAndFilterBar
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              onSearch={handleSearch}
                filters={[]}
                showFilters={showFilters}
                setShowFilters={setShowFilters}
                hasActiveFilters={hasActiveFilters}
                activeFilterCount={() => (hasActiveFilters() ? 1 : 0)}
                onResetFilters={handleResetFilters}
                currentPerPage={pageFilters.per_page?.toString() || '10'}
                onPerPageChange={(value) => {
                  router.get(route('sales.index'), {
                    page: 1,
                    per_page: parseInt(value),
                    search: searchTerm || undefined,
                  }, { preserveState: true, preserveScroll: true });
                }}
              />

            <CrudTable
              columns={columns}
              actions={actions}
              data={sales?.data || []}
              from={sales?.from || 0}
              onAction={handleAction}
              sortField={pageFilters.sort_field}
              sortDirection={pageFilters.sort_direction}
              onSort={handleSort}
              permissions={permissions}
              entityPermissions={entityPermissions}
            />

            <Pagination
              from={sales?.from || 0}
              to={sales?.to || 0}
              total={sales?.total || 0}
              links={sales?.links}
              entityName={t('Sales')}
              onPageChange={(url) => router.get(url)}
            />
          </div>
        </div>
      </div>

      <CrudDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
         onConfirm={handleDeleteConfirm}
        itemName={currentItem?.sale_no}
        entityName={t('Sale')}
      />

      <PosReceipt
        open={receiptOpen}
        autoPrint={true}
        receiptData={receiptData}
        onClose={() => setReceiptOpen(false)}
        onNewSale={handleAddNew}
        formatCurrency={(v) => window.appSettings?.formatCurrency?.(v) ?? `Rs ${Number(v).toFixed(2)}`}
      />
    </PageTemplate>
  );
}
