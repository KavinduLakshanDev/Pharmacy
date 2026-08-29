import { useState } from 'react';
import { PageTemplate } from '@/components/page-template';
import { usePage, router } from '@inertiajs/react';
import { Plus, Eye, Edit, Trash2, MoreHorizontal, Package, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { hasPermission } from '@/utils/authorization';
import { CrudTable } from '@/components/CrudTable';
import { CrudFormModal } from '@/components/CrudFormModal';
import { CrudDeleteModal } from '@/components/CrudDeleteModal';
import { toast } from '@/components/custom-toast';
import { useTranslation } from 'react-i18next';
import { Pagination } from '@/components/ui/pagination';
import { SearchAndFilterBar } from '@/components/ui/search-and-filter-bar';
// import { ProductBarcode } from '@/components/Barcode';

export default function Products() {
  const { t } = useTranslation();
  const { auth, products, categories, taxes, genericNames = [], drugForms = [], filters: pageFilters = {} } = usePage().props as any;
  const permissions = auth?.permissions || [];
  const isCompany = auth?.user?.type === 'company';

  // State
  const [searchTerm, setSearchTerm] = useState(pageFilters.search || '');
  const [selectedGenericName, setSelectedGenericName] = useState(pageFilters.generic_name || 'all');
  const [selectedDrugForm, setSelectedDrugForm] = useState(pageFilters.drug_form || 'all');
  const [showFilters, setShowFilters] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<any>(null);
  const [formMode, setFormMode] = useState<'create' | 'edit' | 'view'>('create');
  const [activeView, setActiveView] = useState('list');

  // Check if any filters are active
  const hasActiveFilters = () => {
    return searchTerm !== '' || selectedGenericName !== 'all' || selectedDrugForm !== 'all';
  };

  // Count active filters
  const activeFilterCount = () => {
    return (searchTerm ? 1 : 0)
      + (selectedGenericName !== 'all' ? 1 : 0)
      + (selectedDrugForm !== 'all' ? 1 : 0);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters();
  };

  const applyFilters = () => {
    router.get(route('products.index'), {
      page: 1,
      search: searchTerm || undefined,
      generic_name: selectedGenericName !== 'all' ? selectedGenericName : undefined,
      drug_form: selectedDrugForm !== 'all' ? selectedDrugForm : undefined,
      per_page: pageFilters.per_page
    }, { preserveState: true, preserveScroll: true });
  };

  const handleSort = (field: string) => {
    const direction = pageFilters.sort_field === field && pageFilters.sort_direction === 'desc' ? 'asc' : 'desc';

    router.get(route('products.index'), {
      sort_field: field,
      sort_direction: direction,
      page: 1,
      search: searchTerm || undefined,
      generic_name: selectedGenericName !== 'all' ? selectedGenericName : undefined,
      drug_form: selectedDrugForm !== 'all' ? selectedDrugForm : undefined,
      per_page: pageFilters.per_page
    }, { preserveState: true, preserveScroll: true });
  };

  const handleAction = (action: string, item: any) => {
    setCurrentItem(item);

    switch (action) {
      case 'view':
        router.visit(route('products.show', item.id));
        break;
      case 'edit':
        router.visit(route('products.edit', item.id));
        break;
      case 'delete':
        setIsDeleteModalOpen(true);
        break;
      case 'toggle-status':
        handleToggleStatus(item);
        break;
    }
  };

  const handleAddNew = () => {
    setCurrentItem(null);
    setFormMode('create');
    setIsFormModalOpen(true);
  };

  const handleFormSubmit = (formData: any) => {
    if (formMode === 'create') {
      toast.loading(t('Creating product...'));

      router.post(route('products.store'), formData, {
        onSuccess: (page) => {
          setIsFormModalOpen(false);
          toast.dismiss();
          const flash = (page.props as any).flash;
          if (flash?.success) {
            toast.success(t(flash.success));
          } else if (flash?.error) {
            toast.error(t(flash.error));
          }
        },
        onError: (errors) => {
          toast.dismiss();
          if (typeof errors === 'string') {
            toast.error(errors);
          } else {
            toast.error(t('Failed to create: {{errors}}', { errors: Object.values(errors).join(', ') }));
          }
        }
      });
    } else if (formMode === 'edit') {
      toast.loading(t('Updating product...'));

      router.put(route('products.update', currentItem.id), formData, {
        onSuccess: (page) => {
          setIsFormModalOpen(false);
          toast.dismiss();
          const flash = (page.props as any).flash;
          if (flash?.success) {
            toast.success(t(flash.success));
          } else if (flash?.error) {
            toast.error(t(flash.error));
          }
        },
        onError: (errors) => {
          toast.dismiss();
          if (typeof errors === 'string') {
            toast.error(errors);
          } else {
            toast.error(t('Failed to update: {{errors}}', { errors: Object.values(errors).join(', ') }));
          }
        }
      });
    }
  };

  const handleDeleteConfirm = () => {
    toast.loading(t('Deleting product...'));

    router.delete(route('products.destroy', currentItem.id), {
      onSuccess: (page) => {
        setIsDeleteModalOpen(false);
        toast.dismiss();
        const flash = (page.props as any).flash;
        if (flash?.success) {
          toast.success(t(flash.success));
        } else if (flash?.error) {
          toast.error(t(flash.error));
        }
      },
      onError: (errors) => {
        toast.dismiss();
        if (typeof errors === 'string') {
          toast.error(errors);
        } else {
          toast.error(t('Failed to delete: {{errors}}', { errors: Object.values(errors).join(', ') }));
        }
      }
    });
  };

  const handleToggleStatus = (product: any) => {
    const newStatus = product.status === 'active' ? 'inactive' : 'active';
    toast.loading(t('{{action}} product...', { action: newStatus === 'active' ? t('Activating') : t('Deactivating') }));

    router.put(route('products.toggle-status', product.id), {}, {
      onSuccess: (page) => {
        toast.dismiss();
        const flash = (page.props as any).flash;
        if (flash?.success) {
          toast.success(t(flash.success));
        } else if (flash?.error) {
          toast.error(t(flash.error));
        }
      },
      onError: (errors) => {
        toast.dismiss();
        if (typeof errors === 'string') {
          toast.error(errors);
        } else {
          toast.error(t('Failed to update: {{errors}}', { errors: Object.values(errors).join(', ') }));
        }
      }
    });
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedGenericName('all');
    setSelectedDrugForm('all');
    setShowFilters(false);

    router.get(route('products.index'), {
      page: 1,
      per_page: pageFilters.per_page
    }, { preserveState: true, preserveScroll: true });
  };

  // Define page actions
  const pageActions: Array<{
    label: string;
    icon: React.ReactNode;
    variant: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
    onClick: () => void;
  }> = [];

  // Add buttons for different product types if user has permission
  if (hasPermission(permissions, 'create-products')) {
    pageActions.push({
      label: t('Add Product'),
      icon: <Plus className="h-4 w-4 mr-2" />,
      variant: 'default' as const,
      onClick: () => router.visit(route('products.create'))
    });
  }

  const breadcrumbs = [
    { title: t('Dashboard'), href: route('dashboard') },
    { title: t('Products') }
  ];

  // Define table columns
  const columns = [
    {
      key: 'name',
      label: t('Name'),
      sortable: true,
      render: (value: any, row: any) => {
        const mainImage = row.media?.find((m: any) => m.collection_name === 'main');
        const imageUrl = mainImage?.original_url || row.display_image_url || row.main_image_url || row.image;

        return (
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden p-1">
              <img
                src={imageUrl}
                alt={row.name}
                className="max-h-full max-w-full object-contain rounded-lg"
                onError={(e) => {
                  const target = e.currentTarget as HTMLImageElement;
                  if (!target.src.startsWith('data:image/svg+xml')) {
                    target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMDAgNjBMMTQwIDgwVjE0MEwxMDAgMTYwTDYwIDE0MFY4MEwxMDAgNjBaIiBzdHJva2U9IiM5Q0EzQUYiIHN0cm9rZS13aWR0aD0iMiIgZmlsbD0iI0U1RTdFQiIvPgo8Y2lyY2xlIGN4PSI4NSIgY3k9Ijk1IiByPSI4IiBmaWxsPSIjOUNBM0FGIi8+CjxwYXRoIGQ9Ik03MCAxMzBMODUgMTE1TDEwMCAxMzBMMTMwIDEwMEwxMzAgMTMwSDcwWiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4=';
                  } else {
                    target.style.display = 'none';
                    const icon = target.nextElementSibling as HTMLElement;
                    if (icon) icon.style.display = 'flex';
                  }
                }}
              />
              <Package className="h-6 w-6 text-gray-400 hidden" />
            </div>
            <div>
              <div className="font-semibold text-gray-900 dark:text-white">{row.name}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">SKU: {row.sku}</div>
              {row.barcode && (
                <div className="text-xs text-gray-400">{t('Barcode')}: {row.barcode}</div>
              )}
            </div>
          </div>
        );
      }
    },
    {
      key: 'price',
      label: t('Price'),
      sortable: true,
      render: (value: any, row: any) => (
        <div className="space-y-1">
          <div className="font-semibold text-green-600">
            {window.appSettings?.formatCurrency(parseFloat(value || 0)) || `$${parseFloat(value || 0).toFixed(2)}`}
          </div>
          {row.sale_price && (
            <div className="text-xs text-blue-600">
              {t('Sale')}: {window.appSettings?.formatCurrency(parseFloat(row.sale_price)) || `$${parseFloat(row.sale_price).toFixed(2)}`}
            </div>
          )}
          {row.wholesale_price && (
            <div className="text-xs text-purple-600">
              {t('Wholesale')}: {window.appSettings?.formatCurrency(parseFloat(row.wholesale_price)) || `$${parseFloat(row.wholesale_price).toFixed(2)}`}
            </div>
          )}
          {row.cost_price && (
            <div className="text-xs text-red-600">
              {t('Cost')}: {window.appSettings?.formatCurrency(parseFloat(row.cost_price)) || `$${parseFloat(row.cost_price).toFixed(2)}`}
            </div>
          )}
          {row.card_price && (
            <div className="text-xs text-purple-600">
              {t('Card')} : {window.appSettings?.formatCurrency(parseFloat(row.card_price)) || `$${parseFloat(row.card_price).toFixed(2)}`}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'stock_quantity',
      label: (
        <div className="flex items-center gap-1">
          {t('Stock')}
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-4 w-4 text-gray-400 hover:text-gray-500" />
            </TooltipTrigger>
            <TooltipContent>
              {t('Stock is calculated from master transactions (GRN/GIN/Production-In)')}
            </TooltipContent>
          </Tooltip>
        </div>
      ),
      sortable: true,
      render: (value: any) => (
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
          value > 10 ? 'bg-green-100 text-green-800' :
          value > 0 ? 'bg-yellow-100 text-yellow-800' :
          'bg-red-100 text-red-800'
        }`}>
          {Number(value).toFixed(2)} {value === 1 ? t('unit') : t('units')}
        </span>
      )
    },
    {
      key: 'drug_form',
      label: t('Drug Form'),
      render: (value: any) => value?.name || t('-')
    },
    {
      key: 'generic_name',
      label: t('Generic Name'),
      render: (value: any) => value?.name || t('-')
    },
    // {
    //   key: 'created_at',
    //   label: t('Created At'),
    //   sortable: true,
    //   render: (value: string) => window.appSettings?.formatDateTime(value, false) || new Date(value).toLocaleDateString()
    // }
  ];

  // Define table actions
  const actions = [
    {
      label: t('View'),
      icon: 'Eye',
      action: 'view',
      className: 'text-blue-500',
      requiredPermission: 'view-products'
    },
    {
      label: t('Edit'),
      icon: 'Edit',
      action: 'edit',
      className: 'text-amber-500',
      requiredPermission: 'edit-products'
    },
    {
      label: t('Toggle Status'),
      icon: 'Lock',
      action: 'toggle-status',
      className: 'text-amber-500',
      requiredPermission: 'toggle-status-products'
    },
    {
      label: t('Delete'),
      icon: 'Trash2',
      action: 'delete',
      className: 'text-red-500',
      requiredPermission: 'delete-products'
    }
  ];

  // Prepare filter options
  const genericNameOptions = [
    { value: 'all', label: t('All Generic Names') },
    ...(genericNames || []).map((genericName: any) => ({
      value: genericName.id.toString(),
      label: genericName.name
    }))
  ];

  const drugFormOptions = [
    { value: 'all', label: t('All Drug Forms') },
    ...(drugForms || []).map((drugForm: any) => ({
      value: drugForm.id.toString(),
      label: drugForm.name
    }))
  ];

  return (
    <PageTemplate
      title={t("Products")}
      description={t("Manage your products and pricing")}
      url="/products"
      actions={pageActions}
      breadcrumbs={breadcrumbs}
      noPadding
    >
      {/* Search and filters section */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow mb-4 p-4">
        <SearchAndFilterBar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onSearch={handleSearch}
          filters={[
            {
              name: 'generic_name',
              label: t('Generic Name'),
              type: 'select' as const,
              value: selectedGenericName,
              onChange: setSelectedGenericName,
              options: genericNameOptions
            },
            {
              name: 'drug_form',
              label: t('Drug Form'),
              type: 'select' as const,
              value: selectedDrugForm,
              onChange: setSelectedDrugForm,
              options: drugFormOptions
            }
          ]}
          showFilters={showFilters}
          setShowFilters={setShowFilters}
          hasActiveFilters={hasActiveFilters}
          activeFilterCount={activeFilterCount}
          onResetFilters={handleResetFilters}
          onApplyFilters={applyFilters}
          currentPerPage={pageFilters.per_page?.toString() || "10"}
          onPerPageChange={(value) => {
            router.get(route('products.index'), {
              page: 1,
              per_page: parseInt(value),
              search: searchTerm || undefined,
              generic_name: selectedGenericName !== 'all' ? selectedGenericName : undefined,
              drug_form: selectedDrugForm !== 'all' ? selectedDrugForm : undefined,
            }, { preserveState: true, preserveScroll: true });
          }}
          showViewToggle={true}
          activeView={activeView}
          onViewChange={setActiveView}
        />
      </div>

      {/* Content section */}
      {activeView === 'list' ? (
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow overflow-hidden">
          <CrudTable
            columns={columns}
            actions={actions}
            data={products?.data || []}
            from={products?.from || 1}
            onAction={handleAction}
            sortField={pageFilters.sort_field}
            sortDirection={pageFilters.sort_direction}
            onSort={handleSort}
            permissions={permissions}
            entityPermissions={{
              view: 'view-products',
              edit: 'edit-products',
              delete: 'delete-products'
            }}
          />

          {/* Pagination section */}
          <Pagination
            from={products?.from || 0}
            to={products?.to || 0}
            total={products?.total || 0}
            links={products?.links}
            entityName={t("products")}
            onPageChange={(url) => router.get(url)}
          />
        </div>
      ) : (
        <div>
          {/* Grid View */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
            {products?.data?.map((product: any) => (
              <Card key={product.id} className="group bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
                {/* Product Image */}
                <div className="relative aspect-square bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 p-4">
                  {(() => {
                    const mainImage = product.media?.find((m: any) => m.collection_name === 'main');
                    const imageUrl = mainImage?.original_url || product.display_image_url || product.main_image_url || product.image;

                    return (
                      <>
                        <img
                          src={imageUrl}
                          alt={product.name}
                          className="w-full h-full object-contain rounded-lg group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            const target = e.currentTarget as HTMLImageElement;
                            if (!target.src.startsWith('data:image/svg+xml')) {
                              target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMDAgNjBMMTQwIDgwVjE0MEwxMDAgMTYwTDYwIDE0MFY4MEwxMDAgNjBaIiBzdHJva2U9IiM5Q0EzQUYiIHN0cm9rZS13aWR0aD0iMiIgZmlsbD0iI0U1RTdFQiIvPgo8Y2lyY2xlIGN4PSI4NSIgY3k9Ijk1IiByPSI4IiBmaWxsPSIjOUNBM0FGIi8+CjxwYXRoIGQ9Ik03MCAxMzBMODUgMTE1TDEwMCAxMzBMMTMwIDEwMEwxMzAgMTMwSDcwWiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4=';
                            } else {
                              target.style.display = 'none';
                              const icon = target.nextElementSibling as HTMLElement;
                              if (icon) icon.style.display = 'flex';
                            }
                          }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center hidden">
                          <Package className="h-16 w-16 text-gray-400" />
                        </div>
                      </>
                    );
                  })()}

                  {/* Status Badge */}
                  <div className="absolute top-3 left-3">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      product.status === 'active'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                      <div className={`w-1.5 h-1.5 rounded-full mr-1 ${product.status === 'active' ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                      {product.status === 'active' ? t('Active') : t('Inactive')}
                    </span>
                  </div>

                  {/* Actions dropdown */}
                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="secondary" size="sm" className="h-8 w-8 p-0 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 z-50" sideOffset={5}>
                        {hasPermission(permissions, 'view-products') && (
                          <DropdownMenuItem onClick={() => router.visit(route('products.show', product.id))}>
                            <Eye className="h-4 w-4 mr-2" />
                            <span>{t("View Product")}</span>
                          </DropdownMenuItem>
                        )}
                        {hasPermission(permissions, 'edit-products') && (
                          <DropdownMenuItem onClick={() => router.visit(route('products.edit', product.id))}>
                            <Edit className="h-4 w-4 mr-2" />
                            <span>{t("Edit")}</span>
                          </DropdownMenuItem>
                        )}
                        {hasPermission(permissions, 'toggle-status-products') && (
                          <DropdownMenuItem onClick={() => handleToggleStatus(product)}>
                            <span>{product.status === 'active' ? t("Deactivate") : t("Activate")}</span>
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        {hasPermission(permissions, 'delete-products') && (
                          <DropdownMenuItem onClick={() => handleAction('delete', product)} className="text-red-600">
                            <Trash2 className="h-4 w-4 mr-2" />
                            <span>{t("Delete")}</span>
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Product Info */}
                <div className="p-4 space-y-3">
                  {/* Product Name & SKU */}
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm line-clamp-2 mb-1">{product.name}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">{product.sku}</p>
                  </div>

                  {/* Price & Stock */}
                  <div className="flex items-center justify-between">
                    <div className="text-lg font-bold text-green-600 dark:text-green-400">
                      {window.appSettings?.formatCurrency(parseFloat(product.price || 0)) || `$${parseFloat(product.price || 0).toFixed(2)}`}
                    </div>
                    <div className={`text-xs font-medium px-2 py-1 rounded-full ${
                      product.stock_quantity > 10 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                      product.stock_quantity > 0 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' :
                      'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                    }`}>
                      {product.stock_quantity ? Number(product.stock_quantity).toFixed(2) : '0.00'} {t('in stock')}
                    </div>
                  </div>

                  {/* Category & Brand Tags */}
                  <div className="flex flex-wrap gap-1">
                    {product.category && (
                      <span className="inline-flex items-center px-2 py-1 rounded-md bg-blue-50 dark:bg-blue-900/30 text-xs font-medium text-blue-700 dark:text-blue-300">
                        {product.category.name}
                      </span>
                    )}
                    {product.generic_name && (
                      <span className="inline-flex items-center px-2 py-1 rounded-md bg-emerald-50 dark:bg-emerald-900/30 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                        {product.generic_name.name}
                      </span>
                    )}
                  </div>

                  {/* Action Button */}
                  {hasPermission(permissions, 'view-products') && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.visit(route('products.show', product.id))}
                      className="w-full mt-3 h-8 text-xs hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <Eye className="h-3 w-3 mr-2" />
                      {t("View Details")}
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>

          {/* Pagination for grid view */}
          <div className="mt-6 bg-white dark:bg-gray-900 rounded-lg shadow overflow-hidden">
            <Pagination
              from={products?.from || 0}
              to={products?.to || 0}
              total={products?.total || 0}
              links={products?.links}
              entityName={t("products")}
              onPageChange={(url) => router.get(url)}
            />
          </div>
        </div>
      )}

      {/* Form Modal */}
      <CrudFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSubmit={handleFormSubmit}
        formConfig={{
          fields: [
            { name: 'name', label: t('Product Name'), type: 'text', required: true },
            { name: 'sku', label: t('SKU'), type: 'text', required: true },
            { name: 'description', label: t('Description'), type: 'textarea' },
            { name: 'price', label: t('Price'), type: 'number', required: true, step: '0.01', min: '0' },
            { name: 'stock_quantity', label: t('Stock Quantity'), type: 'number', required: false, min: '0', defaultValue: '0' },
            { name: 'image', label: t('Image URL'), type: 'text' },
            {
              name: 'category_id',
              label: t('Category'),
              type: 'select',
              options: categories ? categories.map((category: any) => ({
                value: category.id.toString(),
                label: category.name
              })) : []
            },
            {
              name: 'tax_id',
              label: t('Tax'),
              type: 'select' as const,
              options: taxes ? taxes.map((tax: any) => ({
                value: tax.id.toString(),
                label: `${tax.name} (${tax.rate}%)`
              })) : []
            },
            {
              name: 'status',
              label: t('Status'),
              type: 'select' as const,
              options: [
                { value: 'active', label: t('Active') },
                { value: 'inactive', label: t('Inactive') }
              ],
              defaultValue: 'active'
            }
          ],
          modalSize: 'xl'
        }}
        initialData={currentItem ? {
          ...currentItem
        } : null}
        title={
          formMode === 'create'
            ? t('Add New Product')
            : formMode === 'edit'
              ? t('Edit Product')
              : t('View Product')
        }
        mode={formMode}
      />

      {/* Delete Modal */}
      <CrudDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        itemName={currentItem?.name || ''}
        entityName={t('product')}
      />
    </PageTemplate>
  );
}
