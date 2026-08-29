import { LucideIcon } from 'lucide-react';
import type { MasterTransactionEnums } from './masterTransactionEnums';

export interface SharedData {
    auth: {
        user: {
            id: number;
            name: string;
            email: string;
        } | null;
    };
    masterTransactionEnums?: MasterTransactionEnums;
}

export interface NavItem {
    title: string;
    href?: string;
    // Lucide icons are passed as components (e.g. `LayoutGrid`) and rendered as `<item.icon />`
    icon?: React.ComponentType<React.SVGProps<SVGSVGElement>> | React.ReactNode;
    permission?: string;
    children?: NavItem[];
    target?: string;
    external?: boolean;
    defaultOpen?: boolean;
    badge?: {
        label: string;
        variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost';
    };
}

export interface BreadcrumbItem {
    title: string;
    href?: string;
}

export interface PageAction {
    label: string;
    icon: React.ReactNode;
    variant: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
    onClick: () => void;
}
