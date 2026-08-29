import { NavMain } from '@/components/nav-main';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader } from '@/components/ui/sidebar';
import { useBrand } from '@/contexts/BrandContext';
import { useLayout } from '@/contexts/LayoutContext';
import { useSidebarSettings } from '@/contexts/SidebarContext';
import { type NavItem } from '@/types';
import { hasPermission } from '@/utils/authorization';
import { Link, usePage } from '@inertiajs/react';
import { Briefcase, Building2, Container, CreditCard, DollarSign, Gift, Image, LayoutGrid, Package, Plus, Route, Search, Settings, ShoppingBag, TrendingUp, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

export function AppSidebar() {
    const { t } = useTranslation();
    const { auth } = usePage<{ auth?: { user?: { type?: string; role?: string }; permissions?: string[] } }>().props;
    const userRole = auth?.user?.type || auth?.user?.role;
    const permissions = auth?.permissions || [];

    // Business switch handler removed

    const getSuperAdminNavItems = (): NavItem[] => [
        {
            title: t('Dashboard'),
            href: route('dashboard'),
            icon: LayoutGrid,
        },

        {
            title: t('Companies'),
            href: route('companies.index'),
            icon: Briefcase,
        },
        {
            title: t('Media Library'),
            href: route('media-library'),
            icon: Image,
        },

        {
            title: t('Plans'),
            icon: CreditCard,
            children: [
                {
                    title: t('Plan'),
                    href: route('plans.index')
                },
                {
                    title: t('Plan Request'),
                    href: route('plan-requests.index')
                },
                {
                    title: t('Plan Orders'),
                    href: route('plan-orders.index')
                }
            ]
        },
        // {
        //     title: t('Coupons'),
        //     href: route('coupons.index'),
        //     icon: Settings,
        // },

        {
            title: t('Currencies'),
            href: route('currencies.index'),
            icon: DollarSign,
        },
        // {
        //     title: t('Referral Program'),
        //     href: route('referral.index'),
        //     icon: Gift,
        // },
        // {
        //     title: t('Landing Page'),
        //     icon: Palette,
        //     children: [
        //         {
        //             title: t('Landing Page'),
        //             href: route('landing-page')
        //         },
        //         {
        //             title: t('Custom Pages'),
        //             href: route('landing-page.custom-pages.index')
        //         },
        //         {
        //             title: t('Contact Messages'),
        //             href: route('contact-messages.index')
        //         },
        //         {
        //             title: t('Newsletters'),
        //             href: route('newsletters.index')
        //         },
        //     ]
        // },
        // {
        //     title: t('Email Templates'),
        //     href: route('email-templates.index'),
        //     icon: Mail,
        // },
        {
            title: t('Settings'),
            href: route('settings'),
            icon: Settings,
        },
    ];

    const getCompanyNavItems = (): NavItem[] => {
        const items: NavItem[] = [];

        // 1. Dashboard
        if (hasPermission(permissions, 'manage-dashboard')) {
            items.push({
                title: t('Dashboard'),
                href: route('dashboard'),
                icon: LayoutGrid,
            });
        }

        // 2. Staff
        const staffChildren = [];
        if (hasPermission(permissions, 'manage-users')) {
            staffChildren.push({
                title: t('Users'),
                href: route('users.index'),
            });
        }
        if (hasPermission(permissions, 'manage-roles')) {
            staffChildren.push({
                title: t('Roles'),
                href: route('roles.index'),
            });
        }
        if (staffChildren.length > 0) {
            items.push({
                title: t('Staff'),
                icon: Users,
                children: staffChildren,
            });
        }

        // Branches
        const branchesChildren = [];
        if (hasPermission(permissions, 'manage-branches')) {
            branchesChildren.push({
                title: t('Branches'),
                href: route('branches.index'),
            });
        }
        if (hasPermission(permissions, 'manage-cash-registers')) {
            branchesChildren.push({
                title: t('Cash Registers'),
                href: route('cash-registers.index'),
            });
        }
        if (hasPermission(permissions, 'manage-pos-sessions')) {
            branchesChildren.push({
                title: t('PoS Sessions'),
                href: route('pos-sessions.index'),
            });
        }
        if (branchesChildren.length > 0) {
            items.push({
                title: t('Branches'),
                icon: Building2,
                children: branchesChildren,
            });
        }

        // 3. Lead Management
        // const leadChildren = [];
        // if (hasPermission(permissions, 'manage-lead-statuses')) {
        //     leadChildren.push({
        //         title: t('Lead Statuses'),
        //         href: route('lead-statuses.index')
        //     });
        // }
        // if (hasPermission(permissions, 'manage-lead-sources')) {
        //     leadChildren.push({
        //         title: t('Lead Sources'),
        //         href: route('lead-sources.index')
        //     });
        // }
        // if (hasPermission(permissions, 'manage-leads')) {
        //     leadChildren.push({
        //         title: t('Leads'),
        //         href: route('leads.index')
        //     });
        // }
        // if (leadChildren.length > 0) {
        //     items.push({
        //         title: t('Lead Management'),
        //         icon: Users,
        //         children: leadChildren
        //     });
        // }

        // 4. Opportunity Management
        // const opportunityChildren = [];
        // if (hasPermission(permissions, 'manage-opportunity-stages')) {
        //     opportunityChildren.push({
        //         title: t('Opportunity Stages'),
        //         href: route('opportunity-stages.index')
        //     });
        // }
        // if (hasPermission(permissions, 'manage-opportunity-sources')) {
        //     opportunityChildren.push({
        //         title: t('Opportunity Sources'),
        //         href: route('opportunity-sources.index')
        //     });
        // }
        // if (hasPermission(permissions, 'manage-opportunities')) {
        //     opportunityChildren.push({
        //         title: t('Opportunities'),
        //         href: route('opportunities.index')
        //     });
        // }
        // if (opportunityChildren.length > 0) {
        //     items.push({
        //         title: t('Opportunity Management'),
        //         icon: Briefcase,
        //         children: opportunityChildren
        //     });
        // }

        // 5. Account Management
        // const accountChildren = [];
        // if (hasPermission(permissions, 'manage-account-types')) {
        //     accountChildren.push({
        //         title: t('Account Types'),
        //         href: route('account-types.index')
        //     });
        // }
        // if (hasPermission(permissions, 'manage-account-industries')) {
        //     accountChildren.push({
        //         title: t('Account Industries'),
        //         href: route('account-industries.index')
        //     });
        // }
        // if (hasPermission(permissions, 'manage-accounts')) {
        //     accountChildren.push({
        //         title: t('Accounts'),
        //         href: route('accounts.index')
        //     });
        // }
        // if (accountChildren.length > 0) {
        //     items.push({
        //         title: t('Account Management'),
        //         icon: Building2,
        //         children: accountChildren
        //     });
        // }

        // 6. Contacts
        // if (hasPermission(permissions, 'manage-contacts')) {
        //     items.push({
        //         title: t('Contacts'),
        //         href: route('contacts.index'),
        //         icon: Users,
        //     });
        // }

        // 7. Product Setup
        const productSetupChildren = [];
        // if (hasPermission(permissions, 'manage-taxes')) {
        //     productSetupChildren.push({
        //         title: t('Taxes'),
        //         href: route('taxes.index')
        //     });
        // }
        if (hasPermission(permissions, 'manage-units')) {
            productSetupChildren.push({
                title: t('Units'),
                href: route('units.index'),
            });
        }
        if (hasPermission(permissions, 'manage-generic-names')) {
            productSetupChildren.push({
                title: t('Generic Names'),
                href: route('generic-names.index'),
            });
        }
        if (hasPermission(permissions, 'manage-drug-forms')) {
            productSetupChildren.push({
                title: t('Drug Forms'),
                href: route('drug-forms.index'),
            });
        }
        if (hasPermission(permissions, 'manage-products')) {
            productSetupChildren.push({
                title: t('Products'),
                href: route('products.index'),
            });
        }
        // if (hasPermission(permissions, 'manage-inventory')) {
        //     productSetupChildren.push({
        //         title: t('Inventory Transactions'),
        //         href: route('inventory.transactions.index'),
        //     });
        // }
        if (productSetupChildren.length > 0) {
            items.push({
                title: t('Products Management'),
                icon: Package,
                children: productSetupChildren,
            });
        }

        // Inventory Module
        const inventorychildren = [];

        if (hasPermission(permissions, 'view-inventory-dashboard')) {
            inventorychildren.push({
                title: t('Dashboard'),
                href: route('inventory.dashboard'),
            });
        }

        if (hasPermission(permissions, 'view-inventory-audit')) {
            inventorychildren.push({
                title: t('Audit'),
                href: route('inventory.audit'),
            });
        }
        if (hasPermission(permissions, 'view-inventory-transactions')) {
            inventorychildren.push({
                title: t('Transactions'),
                href: route('inventory.transactions.index'),
            });

            inventorychildren.push({
                title: t('Stock Bin Card'),
                href: route('inventory.stock-bin-card'),
                icon: Package,
            });

            inventorychildren.push({
                title: t('Stock In Hand'),
                href: route('stock-in-hand.index'),
            });

            inventorychildren.push({
                title: t('Product Lookup'),
                href: route('inventory.product-lookup'),
                icon: Search,
            });

            inventorychildren.push({
                title: t('Supplier Payments'),
                href: route('inventory.supplier-payments.index'),
                icon: DollarSign,
            });

            inventorychildren.push({
                title: t('Customer Payments'),
                href: route('inventory.customer-payments.index'),
                icon: DollarSign,
            });

            inventorychildren.push({
                title: t('Supplier Returns'),
                href: route('inventory.supplier-returns.index'),
                icon: Package,
            });

            inventorychildren.push({
                title: t('Drug Destroys'),
                href: route('inventory.drug-destroys.index'),
                permission: 'view-drug-destroys',
                icon: Package,
            });

            inventorychildren.push({
                title: t('Customer Returns'),
                href: route('inventory.customer-returns.index'),
                icon: Package,
            });
        }
        if (hasPermission(permissions, 'manage-grns')) {
            productSetupChildren.push({
                title: t('GRNs'),
                href: route('grns.index'),
            });
        }
        if (hasPermission(permissions, 'manage-inventory')) {
            inventorychildren.push({
                title: t('Stock Transfers'),
                href: route('inventory.stock-transfers.index'),
            });
            inventorychildren.push({
                title: t('Wastages'),
                href: route('inventory.wastages.index'),
            });
        }
        if (hasPermission(permissions, 'manage-prescriptions')) {
            inventorychildren.push({
                title: t('Prescriptions'),
                href: route('inventory.prescriptions.index'),
            });
        }
        if (inventorychildren.length > 0) {
            items.push({
                title: t('Inventory Management'),
                icon: Container,
                children: inventorychildren,
            });
        }

        // Finance
        const financeChildren = [];

        if (hasPermission(permissions, 'manage-finance')) {
            financeChildren.push({ title: t('Dashboard'), href: route('finance.dashboard') });
            financeChildren.push({ title: t('Accounts'), href: route('finance.accounts.index') });
            financeChildren.push({ title: t('Transactions'), href: route('finance.transactions.index') });
            financeChildren.push({ title: t('Petty Cash'), href: route('finance.pettycash.index') });
        }

        if (hasPermission(permissions, 'view-inventory-transactions')) {
            financeChildren.push({ title: t('Customer Payments'), href: route('inventory.customer-payments.index') });
            financeChildren.push({ title: t('Supplier Payments'), href: route('inventory.supplier-payments.index') });
        }

        if (financeChildren.length > 0) {
            items.push({
                title: t('Finance Management'),
                icon: DollarSign,
                children: financeChildren,
            });
        }

        // Sales
        const salesChildren = [];

        if (hasPermission(permissions, 'manage-sales') || hasPermission(permissions, 'view-sales')) {
            salesChildren.push({
                title: t('Sales History'),
                href: route('sales.index'),
                icon: ShoppingBag,
            });
        }

        if (hasPermission(permissions, 'create-sales')) {
            salesChildren.push({        
                title: t('New Sale'),
                href: route('sales.create'),
                icon: Plus,
            });
        }

        if (hasPermission(permissions, 'manage-points-earning-rules') || hasPermission(permissions, 'manage-sales')) {
            salesChildren.push({
                title: t('Points Earning Rules'),
                href: route('points-rules.create'),
                icon: Gift,
            });
        }

        if (salesChildren.length > 0) {
            items.push({
                title: t('Sales Management'),
                icon: ShoppingBag,
                children: salesChildren,
            });
        }

        // Customers
        if (hasPermission(permissions, 'manage-customers')) {
            items.push({
                title: t('Customers'),
                href: route('customers.index'),
                icon: Users,
            });
        }

        items.push({
            title: t('Suppliers'),
            href: route('suppliers.index'),
            icon: Building2,
        });

        // 8. Products
        // if (hasPermission(permissions, 'manage-products')) {
        //     items.push({
        //         title: t('Products'),
        //         href: route('products.index'),
        //         icon: ShoppingBag,
        //     });
        // }

        // 9. Quotes
        // if (hasPermission(permissions, 'manage-quotes')) {
        //     items.push({
        //         title: t('Quotes'),
        //         href: route('quotes.index'),
        //         icon: FileText,
        //     });
        // }

        // 10. Sales Orders
        // if (hasPermission(permissions, 'manage-sales-orders')) {
        //     items.push({
        //         title: t('Sales Orders'),
        //         href: route('sales-orders.index'),
        //         icon: ShoppingBag,
        //     });
        // }

        // 11. Invoices
        // if (hasPermission(permissions, 'manage-invoices')) {
        //     items.push({
        //         title: t('Invoices'),
        //         href: route('invoices.index'),
        //         icon: FileText,
        //     });
        // }

        // 12. Delivery Orders
        // if (hasPermission(permissions, 'manage-delivery-orders')) {
        //     items.push({
        //         title: t('Delivery Orders'),
        //         href: route('delivery-orders.index'),
        //         icon: Ticket,
        //     });
        // }

        // 13. Return Orders
        // if (hasPermission(permissions, 'view-return-orders')) {
        //     items.push({
        //         title: t('Return Orders'),
        //         href: route('return-orders.index'),
        //         icon: FileText,
        //     });
        // }

        // 14. Receipt Orders
        // if (hasPermission(permissions, 'manage-receipt-orders')) {
        //     items.push({
        //         title: t('Receipt Orders'),
        //         href: route('receipt-orders.index'),
        //         icon: FileText,
        //     });
        // }

        // 15. Purchase Orders
        if (hasPermission(permissions, 'manage-purchase-orders')) {
            items.push({
                title: t('Purchase Orders'),
                href: route('purchase-orders.index'),
                icon: ShoppingBag,
            });
        }

        // 17. Document Management
        // const documentChildren = [];
        // if (hasPermission(permissions, 'manage-document-folders')) {
        //     documentChildren.push({
        //         title: t('Folders'),
        //         href: route('document-folders.index')
        //     });
        // }
        // if (hasPermission(permissions, 'manage-document-types')) {
        //     documentChildren.push({
        //         title: t('Types'),
        //         href: route('document-types.index')
        //     });
        // }
        // if (hasPermission(permissions, 'manage-documents')) {
        //     documentChildren.push({
        //         title: t('Documents'),
        //         href: route('documents.index')
        //     });
        // }
        // if (documentChildren.length > 0) {
        //     items.push({
        //         title: t('Document Management'),
        //         icon: Folder,
        //         children: documentChildren
        //     });
        // }

        // 18. Campaign Management
        // const campaignChildren = [];
        // if (hasPermission(permissions, 'manage-campaign-types')) {
        //     campaignChildren.push({
        //         title: t('Campaign Types'),
        //         href: route('campaign-types.index')
        //     });
        // }
        // if (hasPermission(permissions, 'manage-target-lists')) {
        //     campaignChildren.push({
        //         title: t('Target Lists'),
        //         href: route('target-lists.index')
        //     });
        // }
        // if (hasPermission(permissions, 'manage-campaigns')) {
        //     campaignChildren.push({
        //         title: t('Campaigns'),
        //         href: route('campaigns.index')
        //     });
        // }
        // if (campaignChildren.length > 0) {
        //     items.push({
        //         title: t('Campaign Management'),
        //         icon: Megaphone,
        //         children: campaignChildren
        //     });
        // }

        // 19. Project Management
        // const projectChildren = [];
        // if (hasPermission(permissions, 'manage-task-statuses')) {
        //     projectChildren.push({
        //         title: t('Task Statuses'),
        //         href: route('task-statuses.index')
        //     });
        // }
        // if (hasPermission(permissions, 'manage-project-tasks')) {
        //     projectChildren.push({
        //         title: t('Project Tasks'),
        //         href: route('project-tasks.index')
        //     });
        // }
        // if (hasPermission(permissions, 'manage-projects')) {
        //     projectChildren.push({
        //         title: t('Projects'),
        //         href: route('projects.index')
        //     });
        // }
        // if (projectChildren.length > 0) {
        //     items.push({
        //         title: t('Project Management'),
        //         icon: Briefcase,
        //         children: projectChildren
        //     });
        // }

        // 20. Calendar
        // if (hasPermission(permissions, 'manage-meetings') || hasPermission(permissions, 'manage-calls') || hasPermission(permissions, 'manage-project-tasks')) {
        //     items.push({
        //         title: t('Calendar'),
        //         href: route('calendar.index'),
        //         icon: Calendar,
        //     });
        // }

        // 21. Cases
        // if (hasPermission(permissions, 'manage-cases')) {
        //     items.push({
        //         title: t('Cases'),
        //         href: route('cases.index'),
        //         icon: FileText,
        //     });
        // }

        // 22. Meetings
        // if (hasPermission(permissions, 'manage-meetings')) {
        //     items.push({
        //         title: t('Meetings'),
        //         href: route('meetings.index'),
        //         icon: CalendarDays,
        //     });
        // }

        // 23. Calls
        // if (hasPermission(permissions, 'manage-calls')) {
        //     items.push({
        //         title: t('Calls'),
        //         href: route('calls.index'),
        //         icon: Phone,
        //     });
        // }

        // 24. Reports
        const reportChildren: NavItem[] = [];

        if (hasPermission(permissions, 'manage-reports') || hasPermission(permissions, 'view-sales-reports')) {
            reportChildren.push({
                title: t('Sales Report'),
                href: route('reports.sales-report')
            });
        }

        if (hasPermission(permissions, 'manage-reports') || hasPermission(permissions, 'view-price-details-report')) {
            reportChildren.push({
                title: t('Price Details Report'),
                href: route('reports.price-details')
            });
        }

        if (hasPermission(permissions, 'manage-reports') || hasPermission(permissions, 'view-customer-details-report')) {
            reportChildren.push({
                title: t('Customer Details Report'),
                href: route('reports.customer-details')
            });
        }

        if (hasPermission(permissions, 'manage-reports') || hasPermission(permissions, 'view-customer-details-report')) {
            reportChildren.push({
                title: t('Customer Outstanding Report'),
                href: route('reports.customer-outstanding')
            });
        }

        if (hasPermission(permissions, 'manage-reports') || hasPermission(permissions, 'view-cash-collection-report')) {
            reportChildren.push({
                title: t(' Collection Report'),
                href: route('reports.cash-collection')
            });
        }

        if (hasPermission(permissions, 'manage-reports')) {
            reportChildren.push({
                title: t('Approved Stock Transfers'),
                href: route('reports.approved-stock-transfers')
            });
        }

        if (hasPermission(permissions, 'manage-reports') || hasPermission(permissions, 'view-supplier-details-report')) {
            reportChildren.push({
                title: t('Supplier Details Report'),
                href: route('reports.supplier-details')
            });
        }

        if (hasPermission(permissions, 'manage-reports') || hasPermission(permissions, 'view-supplier-ledger-card')) {
            reportChildren.push({
                title: t('Supplier Ledger Card'),
                href: route('reports.supplier-ledger-card')
            });
        }

        if (hasPermission(permissions, 'manage-reports') || hasPermission(permissions, 'view-customer-ledger-card')) {
            reportChildren.push({
                title: t('Customer Ledger Card'),
                href: route('reports.customer-ledger-card')
            });
        }

        if (hasPermission(permissions, 'manage-reports')) {
            reportChildren.push({
                title: t('Supplier Product Report'),
                href: route('reports.supplier-product')
            });

            reportChildren.push({
                title: t('Reorder Level Report'),
                href: route('reports.reorder-level')
            });

            reportChildren.push({
                title: t('Fast & Slow Moving Items'),
                href: route('reports.fast-slow-moving')
            });
        }

        if (reportChildren.length > 0) {
            items.push({
                title: t('Reports'),
                icon: TrendingUp,
                children: [
                    // {
                    //     title: t('Lead Reports'),
                    //     href: route('reports.leads')
                    // },
                    // {
                    //     title: t('Sales Reports'),
                    //     href: route('reports.sales')
                    // },
                    // {
                    //     title: t('Product Reports'),
                    //     href: route('reports.product-reports')
                    // },
                    // {
                    //     title: t('Contact Reports'),
                    //     href: route('reports.customers')
                    // },
                    ...reportChildren,
                    // {
                    //     title: t('Project Reports'),
                    //     href: route('reports.projects')
                    // }
                ]
            });
        }

        // 25. Shipping Provider Types
        // if (hasPermission(permissions, 'manage-shipping-provider-types')) {
        //     items.push({
        //         title: t('Shipping Provider Types'),
        //         href: route('shipping-provider-types.index'),
        //         icon: Ticket,
        //     });
        // }

        // 26. Plans
        const planChildren = [];
        if (hasPermission(permissions, 'manage-plans')) {
            planChildren.push({
                title: t('Plans'),
                href: route('plans.index')
            });
        }
        if (hasPermission(permissions, 'manage-plan-requests')) {
            planChildren.push({
                title: t('Plan Requests'),
                href: route('plan-requests.index')
            });
        }
        if (hasPermission(permissions, 'manage-plan-orders')) {
            planChildren.push({
                title: t('Plan Orders'),
                href: route('plan-orders.index')
            });
        }
        if (planChildren.length > 0) {
            items.push({
                title: t('Plans'),
                icon: CreditCard,
                children: planChildren
            });
        }

        // 27. Referral Program
        // if (hasPermission(permissions, 'manage-referral')) {
        //     items.push({
        //         title: t('Referral Program'),
        //         href: route('referral.index'),
        //         icon: Gift,
        //     });
        // }

        // 28. Media Library
        if (hasPermission(permissions, 'manage-media')) {
            items.push({
                title: t('Media Library'),
                href: route('media-library'),
                icon: Image,
            });
        }

        // 29. Notification Templates
        // if (hasPermission(permissions, 'manage-notification-templates')) {
        //     items.push({
        //         title: t('Notification Templates'),
        //         href: route('notification-templates.index'),
        //         icon: Mail,
        //     });
        // }

        // 30. Settings
        if (hasPermission(permissions, 'manage-settings')) {
            items.push({
                title: t('Settings'),
                href: route('settings'),
                icon: Settings,
            });
        }

        return items;
    };

    const mainNavItems = userRole === 'superadmin' ? getSuperAdminNavItems() : getCompanyNavItems();

    const { effectivePosition } = useLayout();
    const { variant, collapsible, style } = useSidebarSettings();
    const { logoLight, logoDark, favicon, updateBrandSettings } = useBrand();
    const [sidebarStyle, setSidebarStyle] = useState({});

    useEffect(() => {
        // Apply styles based on sidebar style
        if (style === 'colored') {
            setSidebarStyle({ backgroundColor: 'var(--primary)', color: 'white' });
        } else if (style === 'gradient') {
            setSidebarStyle({
                background: 'linear-gradient(to bottom, var(--primary), color-mix(in srgb, var(--primary), transparent 20%))',
                color: 'white',
            });
        } else {
            setSidebarStyle({});
        }
    }, [style]);

    const filteredNavItems = mainNavItems;

    // Get the first available menu item's href for logo link
    const getFirstAvailableHref = () => {
        if (filteredNavItems.length === 0) return route('dashboard');

        const firstItem = filteredNavItems[0];
        if (firstItem.href) {
            return firstItem.href;
        } else if (firstItem.children && firstItem.children.length > 0) {
            return firstItem.children[0].href || route('dashboard');
        }
        return route('dashboard');
    };

    return (
        <Sidebar side={effectivePosition} collapsible={collapsible} variant={variant} className={style !== 'plain' ? 'sidebar-custom-style' : ''}>
            <SidebarHeader className={style !== 'plain' ? 'sidebar-styled' : ''} style={sidebarStyle}>
                <div className="flex items-center justify-center p-2">
                    <Link href={getFirstAvailableHref()} prefetch className="flex items-center justify-center">
                        {/* Logo for expanded sidebar */}
                        <div className="flex h-12 items-center group-data-[collapsible=icon]:hidden">
                            {(() => {
                                const isDark = document.documentElement.classList.contains('dark');
                                const currentLogo = isDark ? logoLight : logoDark;
                                const displayUrl = currentLogo
                                    ? currentLogo.startsWith('http')
                                        ? currentLogo
                                        : currentLogo.startsWith('/storage/')
                                          ? `${window.location.origin}${currentLogo}`
                                          : currentLogo.startsWith('/')
                                            ? `${window.location.origin}${currentLogo}`
                                            : currentLogo
                                    : '';

                                return displayUrl ? (
                                    <img
                                        key={`${currentLogo}-${Date.now()}`}
                                        src={displayUrl}
                                        alt="Logo"
                                        className="h-10 w-auto max-w-[180px] transition-all duration-200"
                                        onError={() => updateBrandSettings({ [isDark ? 'logoLight' : 'logoDark']: isDark ? '/images/logos/logo-light.png' : '/images/logos/logo-dark.png' })}
                                    />
                                ) : (
                                    <div className="flex h-12 items-center text-lg font-semibold tracking-tight text-inherit">WorkDo</div>
                                );
                            })()}
                        </div>

                        {/* Icon for collapsed sidebar */}
                        <div className="hidden h-8 w-8 group-data-[collapsible=icon]:block">
                            {(() => {
                                const displayFavicon = favicon
                                    ? favicon.startsWith('http')
                                        ? favicon
                                        : favicon.startsWith('/storage/')
                                          ? `${window.location.origin}${favicon}`
                                          : favicon.startsWith('/')
                                            ? `${window.location.origin}${favicon}`
                                            : favicon
                                    : '';

                                return displayFavicon ? (
                                    <img
                                        key={`${favicon}-${Date.now()}`}
                                        src={displayFavicon}
                                        alt="Icon"
                                        className="h-8 w-8 transition-all duration-200"
                                        onError={() => updateBrandSettings({ favicon: '/images/logos/favicon.ico' })}
                                    />
                                ) : (
                                    <div className="bg-primary flex h-8 w-8 items-center justify-center rounded font-bold text-white shadow-sm">
                                        W
                                    </div>
                                );
                            })()}
                        </div>
                    </Link>
                </div>

                {/* Business Switcher removed */}
            </SidebarHeader>

            <SidebarContent>
                <div style={sidebarStyle} className={`h-full ${style !== 'plain' ? 'sidebar-styled' : ''}`}>
                    <NavMain items={filteredNavItems} position={effectivePosition} />
                </div>
            </SidebarContent>

            <SidebarFooter>
                {/* <NavFooter items={footerNavItems} className="mt-auto" position={position} /> */}
                {/* Profile menu moved to header */}
            </SidebarFooter>
        </Sidebar>
    );
}
