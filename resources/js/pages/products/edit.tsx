import { PageTemplate } from '@/components/page-template';
import { usePage, router } from '@inertiajs/react';
import { ArrowLeft, Upload, X, Image as ImageIcon, Trash2 } from 'lucide-react';
import MediaPicker from '@/components/MediaPicker';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import SearchableSelect from '@/components/ui/searchable-select';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { toast } from '@/components/custom-toast';

export default function ProductEdit() {
  const { t } = useTranslation();
  const { product, categories, taxes, users, auth, mainImage, additionalImages, units, genericNames = [], drugForms = [] } = usePage().props as any;
  const isCompany = auth?.user?.type === 'company';
  const defaultUnitId = units?.find((u: any) => u.name?.toLowerCase() === 'pc')?.id?.toString() ?? '';

  const [formData, setFormData] = useState({
    name: product.name || '',
    sku: product.sku || '',
    barcode: product.barcode || '',
    description: product.description || '',
    sale_price: product.sale_price ?? '',
    cost_price: product.cost_price ?? '',
    price: product.price || '',
    unit_id: product.unit_id?.toString() || defaultUnitId,
    reorder_level: product.reorder_level || '',
    expire_date: product.expire_date || '',
    has_expiry: product.has_expiry ?? true,
    pack_size: product.pack_size || '',
    profit_margin: product.profit_margin ?? '',
    category_id: product.category_id?.toString() || '',
    generic_name_id: product.generic_name_id?.toString() || '',
    drug_form_id: product.drug_form_id?.toString() || '',
    drug_strength: product.drug_strength || '',
    tax_id: product.tax_id?.toString() || '',
    status: product.status || 'active',
    assigned_to: product.assigned_to?.toString() || ''
  });



  // Validate media IDs - clear if media doesn't exist
  const [mainImageId, setMainImageId] = useState<number | ''>(() => {
    if (product.main_image_id && mainImage) {
      return product.main_image_id;
    }
    return '';
  });
  
  const [additionalImageIds, setAdditionalImageIds] = useState<number[]>(() => {
    if (product.additional_image_ids && additionalImages) {
      // Filter out deleted media IDs
      const validIds = product.additional_image_ids.filter((id: number) => 
        additionalImages.some((img: any) => img.id === id)
      );
      return validIds;
    }
    return [];
  });

  const breadcrumbs = [
    { title: t('Dashboard'), href: route('dashboard') },
    { title: t('Products'), href: route('products.index') },
    { title: product.name },
    { title: t('Edit') }
  ];

  const handleInputChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };



  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const salePrice = formData.sale_price ? parseFloat(formData.sale_price) : null;
    const costPrice = formData.cost_price ? parseFloat(formData.cost_price) : null;

    const submitData = {
      ...formData,
      price: salePrice ?? 0,
      details_prices: [
        ...(costPrice !== null ? [{ price_type: 'cost_price', price: costPrice }] : []),
        ...(salePrice !== null ? [{ price_type: 'sales_price', price: salePrice }] : []),
      ],
      main_image_id: mainImageId || null,
      additional_image_ids: additionalImageIds.length > 0 ? additionalImageIds : null,
      _method: 'PUT'
    };


    toast.loading(t('Updating product...'));

    router.post(route('products.update', product.id), submitData, {
      onSuccess: (page) => {
        toast.dismiss();
        const flash: any = page.props.flash ?? {};

        if (flash.success) {
          toast.success(t(flash.success));
        } else if (flash.error) {
          toast.error(t(flash.error));
        }

        router.visit(route('products.index'));
      },
      onError: (errors) => {
        toast.dismiss();
        if (typeof errors === 'string') {
          toast.error(errors);
        } else {
          toast.error(`Failed to update product: ${Object.values(errors).join(', ')}`);
        }
      }
    });
  };

  const pageTitle = t('Edit Product');
  const pageDescription = t('Update a product with pricing options');

  return (
    <PageTemplate
      title={pageTitle}
      description={pageDescription}
      url={route('products.edit', product.id)}
      breadcrumbs={breadcrumbs}
      actions={[
        {
          label: t('Back to Products'),
          icon: <ArrowLeft className="h-4 w-4 mr-2" />,
          variant: 'outline',
          onClick: () => router.visit(route('products.index'))
        }
      ]}
      noPadding
    >
      <form onSubmit={handleSubmit} className="max-w-6xl mx-auto space-y-6">
        {/* Categories and Settings */}
        <Card>
          <CardHeader>
            <CardTitle>{t('Categories & Settings')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('Category')}</label>
                <Select value={formData.category_id} onValueChange={(value) => handleInputChange('category_id', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('Select category')} />
                  </SelectTrigger>
                  <SelectContent>
                    {categories?.map((category: any) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div> */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('Generic Name')}</label>
                <SearchableSelect
                  value={formData.generic_name_id}
                  onValueChange={(value) => handleInputChange('generic_name_id', value)}
                  options={genericNames?.map((gn: any) => ({
                    value: gn.id.toString(),
                    label: gn.name,
                  }))}
                  placeholder={t('Select generic name')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('Drug Form')}</label>
                <SearchableSelect
                  value={formData.drug_form_id}
                  onValueChange={(value) => handleInputChange('drug_form_id', value)}
                  options={drugForms?.map((df: any) => ({
                    value: df.id.toString(),
                    label: df.name,
                  }))}
                  placeholder={t('Select drug form')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('Drug Strength')}</label>
                <Input
                  value={formData.drug_strength}
                  onChange={(e) => handleInputChange('drug_strength', e.target.value)}
                  placeholder={t('e.g. 500mg')}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('Unit')}</label>
                <SearchableSelect
                  value={formData.unit_id}
                  onValueChange={(value) => handleInputChange('unit_id', value)}
                  options={units?.map((u: any) => ({
                    value: u.id.toString(),
                    label: u.name,
                  }))}
                  placeholder={t('Select unit')}
                />
              </div>
              {/* <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('Tax')}</label>
                <Select value={formData.tax_id} onValueChange={(value) => handleInputChange('tax_id', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('Select tax')} />
                  </SelectTrigger>
                  <SelectContent>
                    {taxes?.map((tax: any) => (
                      <SelectItem key={tax.id} value={tax.id.toString()}>
                        {tax.name} ({tax.rate}%)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div> */}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* {isCompany && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('Assign To')}</label>
                  <Select value={formData.assigned_to} onValueChange={(value) => handleInputChange('assigned_to', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('Select user')} />
                    </SelectTrigger>
                    <SelectContent>
                      {users?.map((user: any) => (
                        <SelectItem key={user.id} value={user.id.toString()}>
                          {user.name} ({user.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )} */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('Status')}</label>
                <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">{t('Active')}</SelectItem>
                    <SelectItem value="inactive">{t('Inactive')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>



        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>{t('Basic Information')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">{t('Product Name')} <span className="text-red-500">*</span></label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  required
                  className="w-full"
                />
              </div>
              <div>
                <label htmlFor="sku" className="block text-sm font-medium text-gray-700 mb-1">{t('Item Code')} <span className="text-red-500">*</span></label>
                <Input
                  id="sku"
                  value={formData.sku}
                  onChange={(e) => handleInputChange('sku', e.target.value)}
                  required
                  className="w-full"
                />
              </div>
              <div>
                <label htmlFor="barcode" className="block text-sm font-medium text-gray-700 mb-1">{t('Barcode')}</label>
                <div className="flex gap-2">
                  <Input
                    id="barcode"
                    value={formData.barcode}
                    onChange={(e) => handleInputChange('barcode', e.target.value)}
                    className="flex-1 min-w-0"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const code = Math.floor(100000000000 + Math.random() * 900000000000).toString();
                      handleInputChange('barcode', code);
                    }}
                  >
                    {t('Generate')}
                  </Button>
                </div>
              </div>
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">{t('Description')}</label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="cost_price" className="block text-sm font-medium text-gray-700 mb-1">{t('Cost Price')}</label>
                <Input
                  id="cost_price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.cost_price}
                  onChange={(e) => handleInputChange('cost_price', e.target.value)}
                  className="pl-3"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label htmlFor="sale_price" className="block text-sm font-medium text-gray-700 mb-1">{t('Sale Price')}</label>
                <Input
                  id="sale_price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.sale_price}
                  onChange={(e) => handleInputChange('sale_price', e.target.value)}
                  className="pl-3"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label htmlFor="reorder_level" className="block text-sm font-medium text-gray-700 mb-1">{t('Reorder Level')}</label>
                <Input
                  id="reorder_level"
                  type="number"
                  min="0"
                  value={formData.reorder_level}
                  onChange={(e) => handleInputChange('reorder_level', e.target.value)}
                  placeholder="0"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('Has Expiry Date')}</label>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="has_expiry"
                    checked={formData.has_expiry}
                    onChange={(e) => setFormData(prev => ({ ...prev, has_expiry: e.target.checked, expire_date: e.target.checked ? prev.expire_date : '' }))}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <label htmlFor="has_expiry" className="text-sm text-gray-600">{t('This product requires an expiry date')}</label>
                </div>
              </div>

              {formData.has_expiry && (
              <div>
                <label htmlFor="expire_date" className="block text-sm font-medium text-gray-700 mb-1">{t('Expiry Period (Days)')}</label>
                <Input
                  id="expire_date"
                  type="number"
                  min="0"
                  value={formData.expire_date}
                  onChange={(e) => handleInputChange('expire_date', e.target.value)}
                  placeholder="30"
                  className="w-full"
                />
              </div>
              )}

              <div>
                <label htmlFor="pack_size" className="block text-sm font-medium text-gray-700 mb-1">{t('Pack Size')}</label>
                <Input
                  id="pack_size"
                  value={formData.pack_size}
                  onChange={(e) => handleInputChange('pack_size', e.target.value)}
                  placeholder={t('e.g., 10 tablets, 100ml')}
                  className="w-full"
                />
              </div>

              <div>
                <label htmlFor="profit_margin" className="block text-sm font-medium text-gray-700 mb-1">{t('Profit Margin (%)')}</label>
                <div className="relative">
                  <Input
                    id="profit_margin"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={formData.profit_margin}
                    onChange={(e) => handleInputChange('profit_margin', e.target.value)}
                    className="pr-8"
                    placeholder="0.00"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">%</span>
                </div>
              </div>
            </div>

            {/* Price Summary */}
            {(formData.sale_price || formData.cost_price) && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-medium text-gray-900 mb-3">{t('Price Summary')}</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <>
                    {formData.cost_price && (
                      <div>
                        <span className="text-gray-600">{t('Cost')}:</span>
                        <span className="font-medium text-red-600 ml-1">${parseFloat(formData.cost_price).toFixed(2)}</span>
                      </div>
                    )}
                    {formData.sale_price && (
                      <div>
                        <span className="text-gray-600">{t('Sale')}:</span>
                        <span className="font-medium text-green-600 ml-1">${parseFloat(formData.sale_price).toFixed(2)}</span>
                      </div>
                    )}
                  </>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Images */}
        <Card>
          <CardHeader>
            <CardTitle>{t('Product Images')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Main Image */}
            <div>
              <MediaPicker
                label={t('Main Image')}
                value={mainImageId}
                onChange={(value) => setMainImageId(value as number)}
                placeholder={t('Select main image...')}
                showPreview={true}
                returnType="id"
              />
            </div>

            {/* Additional Images */}
            <div>
              <MediaPicker
                label={t('Additional Images')}
                value={additionalImageIds}
                onChange={(value) => setAdditionalImageIds(value as number[])}
                placeholder={t('Select additional images...')}
                multiple={true}
                showPreview={true}
                returnType="id"
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={() => router.visit(route('products.index'))}>
            {t('Cancel')}
          </Button>
          <Button type="submit">
            {t('Update Product')}
          </Button>
        </div>
      </form>
    </PageTemplate>
  );
}