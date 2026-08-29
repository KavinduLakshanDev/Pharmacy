import { Head, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { ReactNode } from 'react';
// import { FloatingChatGpt } from '@/components/FloatingChatGpt';

export interface PageAction {
  label: string;
  icon?: ReactNode;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  onClick?: () => void;
  className?: string;
}

export interface PageTemplateProps {
  title: string;
  description?: string;
  url: string;
  actions?: PageAction[];
  children: ReactNode;
  noPadding?: boolean;
  breadcrumbs?: BreadcrumbItem[];
}

export function PageTemplate({
  title,
  description,
  url,
  actions,
  children,
  noPadding = false,
  breadcrumbs
}: PageTemplateProps) {
  // Default breadcrumbs if none provided
  const pageBreadcrumbs: BreadcrumbItem[] = breadcrumbs || [
    {
      title,
      href: url,
    },
  ];

  return (
    <AppLayout breadcrumbs={pageBreadcrumbs}>
      <Head title={`${title} - ${(usePage().props as any).globalSettings?.titleText || 'Unitec'}`} />

      <div className="flex flex-1 flex-col">
        {/* Page header */}
        <div className="flex shrink-0 items-center justify-between border-b bg-white px-6 py-4 dark:bg-gray-900 dark:border-gray-800">
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-gray-900 dark:text-white">{title}</h1>
            {description && (
              <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{description}</p>
            )}
          </div>
          {actions && actions.length > 0 && (
            <div className="flex items-center gap-2">
              {actions.map((action, index) => (
                <Button
                  key={index}
                  variant={action.variant || 'outline'}
                  size="sm"
                  onClick={action.onClick}
                  className={`cursor-pointer ${action.className || ''}`}
                >
                  {action.icon && <span className="flex items-center">{action.icon}</span>}
                  {action.label}
                </Button>
              ))}
            </div>
          )}
        </div>

        {/* Content */}
        <div className={noPadding ? 'flex-1' : 'flex-1 p-6'}>
          <div className={noPadding ? '' : 'rounded-xl border bg-white p-6 shadow-sm dark:bg-gray-900 dark:border-gray-800'}>
            {children}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
