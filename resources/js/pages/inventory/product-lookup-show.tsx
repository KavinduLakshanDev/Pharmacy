import { PageTemplate } from '@/components/page-template';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { router, usePage } from '@inertiajs/react';
import { BookOpen, ExternalLink, Globe, Loader2, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface Product {
    id: number;
    name: string;
    sku?: string | null;
    description?: string | null;
    price?: number | null;
    category?: { name: string } | null;
    brand?: { name: string } | null;
    generic_name?: { name: string } | null;
    drug_form?: { name: string } | null;
    unit?: { name: string } | null;
}

interface WikipediaSummary {
    title: string;
    extract: string;
    thumbnail?: { source: string; width: number; height: number } | null;
    content_urls?: { desktop?: { page?: string } } | null;
}

interface WikiState {
    status: 'idle' | 'loading' | 'found' | 'not_found' | 'error';
    data: WikipediaSummary | null;
}

export default function InventoryProductLookupShowPage() {
    const { t } = useTranslation();
    const { product } = usePage<{ product: Product }>().props;
    const [wiki, setWiki] = useState<WikiState>({ status: 'idle', data: null });

    useEffect(() => {
        setWiki({ status: 'loading', data: null });

        // Try the product name first, then fall back to the generic name
        const searchTerms = [product.name, product.generic_name?.name].filter(Boolean) as string[];
        let cancelled = false;

        const tryFetch = async (terms: string[]): Promise<void> => {
            for (const term of terms) {
                const encoded = encodeURIComponent(term.replace(/\s+/g, '_'));
                const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encoded}`;
                try {
                    const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
                    if (res.ok) {
                        const data: WikipediaSummary = await res.json();
                        if (!cancelled) {
                            setWiki({ status: 'found', data });
                        }
                        return;
                    }
                } catch {
                    // try next term
                }
            }
            if (!cancelled) {
                setWiki({ status: 'not_found', data: null });
            }
        };

        tryFetch(searchTerms);

        return () => {
            cancelled = true;
        };
    }, [product.name, product.generic_name?.name]);

    const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(product.name + ' pharmacy drug')}`;

    return (
        <PageTemplate
            title={product.name}
            description={t('Inventory details and external knowledge for this product.')}
            url={`/inventory/product-lookup/${product.id}`}
            breadcrumbs={[
                { title: t('Dashboard'), href: route('dashboard') },
                { title: t('Inventory'), href: route('inventory.dashboard') },
                { title: t('Product Lookup'), href: route('inventory.product-lookup') },
                { title: product.name },
            ]}
            actions={[
                {
                    label: t('Back'),
                    variant: 'outline',
                    onClick: () => router.visit(route('inventory.product-lookup')),
                },
            ]}
            noPadding
        >
            <div className="mx-auto max-w-6xl space-y-6">
                {/* Product info card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            {product.name}
                            {product.sku && (
                                <Badge variant="outline" className="font-mono text-xs">
                                    {product.sku}
                                </Badge>
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                            {[
                                { label: t('Brand'), value: product.brand?.name },
                                { label: t('Category'), value: product.category?.name },
                                { label: t('Generic Name'), value: product.generic_name?.name },
                                { label: t('Drug Form'), value: product.drug_form?.name },
                                { label: t('Unit'), value: product.unit?.name },
                                {
                                    label: t('Price'),
                                    value:
                                        product.price != null
                                            ? (window.appSettings?.formatCurrency?.(Number(product.price)) ??
                                              Number(product.price).toFixed(2))
                                            : null,
                                },
                            ].map(({ label, value }) => (
                                <div key={label}>
                                    <p className="text-xs font-medium text-gray-500">{label}</p>
                                    <p className="text-sm font-semibold text-gray-900">{value ?? '—'}</p>
                                </div>
                            ))}
                        </div>

                        {product.description ? (
                            <div className="mt-4 border-t pt-4">
                                <p className="text-xs font-medium text-gray-500">{t('Internal description')}</p>
                                <p className="mt-1 text-sm text-gray-700 whitespace-pre-wrap">{product.description}</p>
                            </div>
                        ) : null}

                        <div className="mt-4 flex flex-wrap gap-2 border-t pt-4">
                            <Button size="sm" asChild>
                                <a href={googleUrl} target="_blank" rel="noopener noreferrer">
                                    <Search className="mr-1.5 h-3.5 w-3.5" />
                                    {t('Search on Google')}
                                </a>
                            </Button>
                            <Button variant="outline" size="sm" asChild>
                                <a
                                    href={`https://www.google.com/search?q=${encodeURIComponent(product.name)}&tbm=isch`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <Globe className="mr-1.5 h-3.5 w-3.5" />
                                    {t('Google Images')}
                                </a>
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Wikipedia card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BookOpen className="h-5 w-5 text-gray-500" />
                            {t('Wikipedia summary')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {wiki.status === 'loading' && (
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                {t('Fetching Wikipedia article…')}
                            </div>
                        )}

                        {wiki.status === 'not_found' && (
                            <p className="text-sm text-gray-500">
                                {t('No Wikipedia article found for this product.')}
                            </p>
                        )}

                        {wiki.status === 'error' && (
                            <p className="text-sm text-red-500">
                                {t('Could not reach Wikipedia. Check your connection.')}
                            </p>
                        )}

                        {wiki.status === 'found' && wiki.data && (
                            <div className="space-y-4">
                                <div className="flex gap-4">
                                    {wiki.data.thumbnail?.source && (
                                        <img
                                            src={wiki.data.thumbnail.source}
                                            alt={wiki.data.title}
                                            className="h-28 w-auto flex-shrink-0 rounded object-cover"
                                        />
                                    )}
                                    <div className="space-y-2">
                                        <p className="text-sm font-semibold text-gray-900">{wiki.data.title}</p>
                                        <p className="text-sm leading-relaxed text-gray-700">{wiki.data.extract}</p>
                                    </div>
                                </div>

                                {wiki.data.content_urls?.desktop?.page && (
                                    <Button variant="outline" size="sm" asChild>
                                        <a
                                            href={wiki.data.content_urls.desktop.page}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                                            {t('Read full article on Wikipedia')}
                                        </a>
                                    </Button>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </PageTemplate>
    );
}
