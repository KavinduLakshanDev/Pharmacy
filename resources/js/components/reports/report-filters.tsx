import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslation } from 'react-i18next';
import { router } from '@inertiajs/react';

interface ReportFiltersProps {
  filters: {
    dateFrom: string;
    dateTo: string;
    [key: string]: any;
  };
  additionalFilters?: ReactNode;
  hideCard?: boolean;
}

import { ReactNode } from 'react';

export function ReportFilters({ filters, additionalFilters, hideCard = false }: ReportFiltersProps) {
  const { t } = useTranslation();
  const [dateFrom, setDateFrom] = useState(filters.dateFrom);
  const [dateTo, setDateTo] = useState(filters.dateTo);

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.get(window.location.pathname, {
      date_from: dateFrom,
      date_to: dateTo,
    });
  };

  const handleClearFilters = () => {
    const defaultDateFrom = new Date();
    defaultDateFrom.setMonth(defaultDateFrom.getMonth() - 1);
    const defaultDateTo = new Date();
    
    setDateFrom(defaultDateFrom.toISOString().split('T')[0]);
    setDateTo(defaultDateTo.toISOString().split('T')[0]);
    
    router.get(window.location.pathname);
  };

  const content = (
    <form onSubmit={handleFilterSubmit} className="flex items-end gap-4">
      <div className="flex-1 min-w-[150px]">
        <Label htmlFor="date_from" className="text-xs uppercase text-muted-foreground font-semibold mb-1 block">{t('From')}</Label>
        <Input
          id="date_from"
          type="date"
          className="h-9"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
        />
      </div>
      <div className="flex-1 min-w-[150px]">
        <Label htmlFor="date_to" className="text-xs uppercase text-muted-foreground font-semibold mb-1 block">{t('To')}</Label>
        <Input
          id="date_to"
          type="date"
          className="h-9"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
        />
      </div>
      {additionalFilters}
      <Button type="submit" size="sm" className="h-9">{t('Apply')}</Button>
      <Button type="button" variant="outline" size="sm" className="h-9" onClick={handleClearFilters}>{t('Clear')}</Button>
    </form>
  );

  if (hideCard) {
    return content;
  }

  return (
    <Card className="mb-6 p-4">
      {content}
    </Card>
  );
}