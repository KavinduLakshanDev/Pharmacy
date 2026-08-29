import { Breadcrumbs } from '@/components/breadcrumbs';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useLayout } from '@/contexts/LayoutContext';
import { type BreadcrumbItem as BreadcrumbItemType } from '@/types';
import { ProfileMenu } from '@/components/profile-menu';
import { LanguageSwitcher } from '@/components/language-switcher';
import { usePage, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Navigation2Off } from 'lucide-react';
export function AppSidebarHeader({ breadcrumbs = [] }: { breadcrumbs?: BreadcrumbItemType[] }) {
    const { t } = useTranslation();
    const { position } = useLayout();

    return (
        <header className="border-sidebar-border/50 flex h-14 shrink-0 items-center gap-2 border-b bg-white px-4 shadow-[0_1px_3px_0_rgb(0,0,0,0.04)] transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 dark:bg-gray-900 dark:shadow-none md:px-4">
            <div className="flex w-full items-center justify-between">
                <div className="flex items-center gap-2">
                    {position === 'left' && <SidebarTrigger className="-ml-1 text-gray-500 hover:text-gray-700 dark:text-gray-400" />}
                    <Breadcrumbs items={breadcrumbs.map(b => ({ label: b.title, href: b.href }))} />
                </div>
                <div className="flex items-center gap-2">
                    {(usePage().props as any).isImpersonating && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-2 border-red-200 bg-red-50 hover:bg-red-100"
                                    onClick={() => router.post(route('impersonate.leave'))}
                                >
                                    <Navigation2Off className="h-4 w-4 text-red-600" />
                                    <span className="font-mono text-xs text-red-800">{t('Return Back')}</span>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>{t("Stop impersonation").toUpperCase()}</TooltipContent>
                        </Tooltip>
                    )}
                    <ProfileMenu />
                    {position === 'right' && <SidebarTrigger className="-mr-1 text-gray-500 hover:text-gray-700 dark:text-gray-400" />}
                </div>
            </div>
        </header>
    );
}
