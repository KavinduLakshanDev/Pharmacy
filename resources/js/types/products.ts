// Product type values — mirrors App\Enums\ProductType
export type ProductType =
    | 'Finished product'
    | 'Semi-finished'
    | 'Service'
    | 'Consumable'
    | 'Asset';

// Price type values — mirrors App\Enums\PriceType
export type PriceType =
    | 'sales_price'
    | 'cost_price'
    | 'wholesale_price'
    | 'purchase_price'
    | 'retail_price';

export interface ProductDetailsPrice {
    id: number;
    product_id: number;
    price_type: PriceType;
    price: string | number;
    created_at?: string;
    updated_at?: string;
    deleted_at?: string | null;
}

export interface ProductMedia {
    id: number;
    collection_name: 'main' | 'additional';
    original_url: string;
    thumb_url: string;
}

export interface Unit {
    id: number;
    name: string;
    status?: string;
    description?: string | null;
}

export interface Product {
    id: number;
    name: string;
    product_type: ProductType;
    sku: string;
    description?: string | null;
    price: string | number;
    stock_quantity: number;
    image?: string | null;
    main_image?: string | null;
    main_image_id?: string | number | null;
    additional_image_ids?: (string | number)[] | null;
    category_id?: number | null;
    brand_id?: number | null;
    tax_id?: number | null;
    unit_id?: number | null;
    unit_weight?: string | number | null;
    reorder_level: number;
    expire_date?: string | null;
    status: 'active' | 'inactive';
    created_by: number;
    assigned_to?: number | null;
    created_at?: string;
    updated_at?: string;
    deleted_at?: string | null;
    // Relations
    category?: { id: number; name: string } | null;
    brand?: { id: number; name: string } | null;
    tax?: { id: number; name: string; rate: string | number } | null;
    unit?: Unit | null;
    assigned_user?: { id: number; name: string; email: string } | null;
    creator?: { id: number; name: string; email: string } | null;
    media?: ProductMedia[];
    details_prices?: ProductDetailsPrice[];
    // Appended attributes
    main_image_url?: string | null;
    additional_image_urls?: Array<{ id: number; url: string; thumb_url: string }>;
    has_valid_image?: boolean;
    display_image_url?: string | null;
}

export interface ProductFormData {
    name: string;
    product_type: ProductType;
    sku: string;
    description: string;
    price: string | number;
    stock_quantity: number;
    image: string;
    main_image_id: string | number | null;
    additional_image_ids: (string | number)[];
    category_id: number | null;
    brand_id: number | null;
    tax_id: number | null;
    unit_id: number | null;
    unit_weight: string | number;
    reorder_level: number;
    expire_date: string;
    status: 'active' | 'inactive';
    assigned_to: number | null;
    details_prices: Array<{ price_type: PriceType; price: string | number }>;
}

export const PRODUCT_TYPE_OPTIONS: ProductType[] = [
    'Finished product',
    'Semi-finished',
    'Service',
    'Consumable',
    'Asset',
];

export const PRICE_TYPE_OPTIONS: PriceType[] = [
    'sales_price',
    'cost_price',
    'wholesale_price',
    'purchase_price',
    'retail_price',
];

export const PRICE_TYPE_LABELS: Record<PriceType, string> = {
    sales_price: 'Sales Price',
    cost_price: 'Cost Price',
    wholesale_price: 'Wholesale Price',
    purchase_price: 'Purchase Price',
    retail_price: 'Retail Price',
};
