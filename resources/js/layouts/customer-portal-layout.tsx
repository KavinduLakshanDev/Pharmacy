import { Head, Link, router, usePage } from '@inertiajs/react';
import { type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useFavicon } from '@/hooks/use-favicon';
import { useBrand } from '@/contexts/BrandContext';
import { THEME_COLORS } from '@/hooks/use-appearance';
import { LogOut, User, LayoutDashboard, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CustomerPortalLayoutProps {
    children: ReactNode;
    title: string;
}

export default function CustomerPortalLayout({ children, title }: CustomerPortalLayoutProps) {
    useFavicon();
    const { t } = useTranslation();
    const { logoLight, logoDark, themeColor, customColor, appName } = useBrand();
    const primaryColor = themeColor === 'custom' ? customColor : THEME_COLORS[themeColor as keyof typeof THEME_COLORS];

    const handleLogout = () => {
        router.post(route('logout'));
    };

    const page = usePage();
    const currentUrl = (page as any).url as string;

    const activeClass = (href: string) =>
        currentUrl === href || currentUrl.startsWith(`${href}?`) ?
            'bg-primary text-primary-foreground dark:bg-primary/95' :
            'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800';

    return (
        <>
            <Head title={`${title} - ${appName}`} />
            <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
                {/* Header */}
                <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm">
                    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between h-16">
                            <div className="flex items-center gap-3">
                                <img
                                    src={logoDark}
                                    alt={appName}
                                    className="h-8 w-auto dark:hidden"
                                />
                                <img
                                    src={logoLight}
                                    alt={appName}
                                    className="h-8 w-auto hidden dark:block"
                                />
                                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                    {t('Customer Portal')}
                                </span>
                            </div>

                            <nav className="flex items-center gap-2">
                                <Link
                                    href={route('customer-portal.dashboard')}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors ${activeClass(route('customer-portal.dashboard'))}`}
                                >
                                    <LayoutDashboard className="h-4 w-4" />
                                    {t('Dashboard')}
                                </Link>
                                <Link
                                    href={route('customer-portal.profile')}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors ${activeClass(route('customer-portal.profile'))}`}
                                >
                                    <User className="h-4 w-4" />
                                    {t('Profile')}
                                </Link>
                                <Link
                                    href={route('customer-portal.prescriptions.index')}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors ${activeClass(route('customer-portal.prescriptions.index'))}`}
                                >
                                    <FileText className="h-4 w-4" />
                                    {t('Prescriptions')}
                                </Link>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleLogout}
                                    className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300"
                                >
                                    <LogOut className="h-4 w-4" />
                                    {t('Logout')}
                                </Button>
                            </nav>
                        </div>
                    </div>
                </header>

                {/* Main content */}
                <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {children}
                </main>
            </div>
        </>
    );
}
