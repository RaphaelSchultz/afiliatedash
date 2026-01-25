import { useSearchParams } from 'react-router-dom';
import { useMemo, useCallback } from 'react';
import { startOfMonth, endOfMonth, format, parseISO } from 'date-fns';
import { toShopeeQueryStart, toShopeeQueryEnd } from '@/lib/shopeeTimezone';

export interface Filters {
  startDate: string;
  endDate: string;
  status: string[];
  channels: string[];
}

export function useFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = useMemo<Filters>(() => {
    const now = new Date();
    const defaultStart = format(startOfMonth(now), 'yyyy-MM-dd');
    const defaultEnd = format(endOfMonth(now), 'yyyy-MM-dd');

    return {
      startDate: searchParams.get('startDate') || defaultStart,
      endDate: searchParams.get('endDate') || defaultEnd,
      status: searchParams.get('status')?.split(',').filter(Boolean) || [],
      channels: searchParams.get('channels')?.split(',').filter(Boolean) || [],
    };
  }, [searchParams]);

  const setFilters = useCallback(
    (newFilters: Partial<Filters>) => {
      const updated = { ...filters, ...newFilters };
      const params = new URLSearchParams();

      if (updated.startDate) params.set('startDate', updated.startDate);
      if (updated.endDate) params.set('endDate', updated.endDate);
      if (updated.status.length > 0) params.set('status', updated.status.join(','));
      if (updated.channels.length > 0) params.set('channels', updated.channels.join(','));

      setSearchParams(params, { replace: true });
    },
    [filters, setSearchParams]
  );

  const clearFilters = useCallback(() => {
    setSearchParams({}, { replace: true });
  }, [setSearchParams]);

  const parsedDates = useMemo(() => ({
    startDate: parseISO(filters.startDate),
    endDate: parseISO(filters.endDate),
  }), [filters.startDate, filters.endDate]);

  // Shopee timezone query dates (UTC+8)
  const shopeeQueryDates = useMemo(() => ({
    startISO: toShopeeQueryStart(filters.startDate),
    endISO: toShopeeQueryEnd(filters.endDate),
  }), [filters.startDate, filters.endDate]);

  return {
    filters,
    setFilters,
    clearFilters,
    parsedDates,
    shopeeQueryDates,
  };
}
