import type { route as routeFn } from 'ziggy-js';

declare global {
    const route: typeof routeFn;

    interface AppSettings {
        formatCurrency: (value: number) => string;
        formatDateTime: (value: string, includeTime?: boolean) => string;
        [key: string]: unknown;
    }

    interface Window {
        appSettings?: AppSettings;
        storage: (path: string) => string;
        asset: (path: string) => string;
    }
}
