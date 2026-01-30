import { useSearchParams } from 'react-router-dom';
import { useMemo, useCallback } from 'react';
import { format, parseISO, subDays } from 'date-fns';
import { toBrazilQueryStart, toBrazilQueryEnd } from '@/lib/shopeeTimezone';

export interface Filters {
  startDate: string;
  endDate: string;
  status: string[];
  channels: string[];
  subId1: string[];
  subId2: string[];
  subId3: string[];
  subId4: string[];
  subId5: string[];
}

export interface FilterConfig {
  defaultStart?: string;
  defaultEnd?: string;
}

export function useFilters(config?: FilterConfig) {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = useMemo<Filters>(() => {
    const today = new Date();
    // Default: last 30 days ending YESTERDAY (D-1)
    const defaultEnd = config?.defaultEnd || format(subDays(today, 1), 'yyyy-MM-dd');
    const defaultStart = config?.defaultStart || format(subDays(today, 30), 'yyyy-MM-dd');

    // Get dates from URL, but cap endDate to today (no future dates)
    let endDate = searchParams.get('endDate') || defaultEnd;
    const endDateObj = parseISO(endDate);
    if (endDateObj > today) {
      endDate = format(today, 'yyyy-MM-dd'); // Cap at Today if future date in URL
    }

    const statusParam = searchParams.get('status');
    let statusFilters: string[] = ['Completed', 'Pending']; // Default

    if (statusParam !== null) {
      if (statusParam === 'all') {
        statusFilters = [];
      } else {
        statusFilters = statusParam.split(',').filter(Boolean);
      }
    }

    return {
      startDate: searchParams.get('startDate') || defaultStart,
      endDate,
      status: statusFilters,
      channels: searchParams.get('channels')?.split(',').filter(Boolean) || [],
      subId1: searchParams.get('subId1')?.split(',').filter(Boolean) || [],
      subId2: searchParams.get('subId2')?.split(',').filter(Boolean) || [],
      subId3: searchParams.get('subId3')?.split(',').filter(Boolean) || [],
      subId4: searchParams.get('subId4')?.split(',').filter(Boolean) || [],
      subId5: searchParams.get('subId5')?.split(',').filter(Boolean) || [],
    };
  }, [searchParams]);

  const setFilters = useCallback(
    (newFilters: Partial<Filters>) => {
      const today = new Date();
      const updated = { ...filters, ...newFilters };

      // Cap endDate to today
      if (updated.endDate) {
        const endDateObj = parseISO(updated.endDate);
        if (endDateObj > today) {
          updated.endDate = format(today, 'yyyy-MM-dd');
        }
      }

      const params = new URLSearchParams();

      if (updated.startDate) params.set('startDate', updated.startDate);
      if (updated.endDate) params.set('endDate', updated.endDate);

      // Handle status: 'all' for empty, joined string for values
      if (updated.status.length > 0) {
        params.set('status', updated.status.join(','));
      } else {
        params.set('status', 'all');
      }

      if (updated.channels.length > 0) params.set('channels', updated.channels.join(','));
      if (updated.subId1.length > 0) params.set('subId1', updated.subId1.join(','));
      if (updated.subId2.length > 0) params.set('subId2', updated.subId2.join(','));
      if (updated.subId3.length > 0) params.set('subId3', updated.subId3.join(','));
      if (updated.subId4.length > 0) params.set('subId4', updated.subId4.join(','));
      if (updated.subId5.length > 0) params.set('subId5', updated.subId5.join(','));

      setSearchParams(params, { replace: true });
    },
    [filters, setSearchParams]
  );

  const clearFilters = useCallback(() => {
    const params = new URLSearchParams();
    if (config?.defaultStart) params.set('startDate', config.defaultStart);
    if (config?.defaultEnd) params.set('endDate', config.defaultEnd);
    setSearchParams(params, { replace: true });
  }, [setSearchParams, config?.defaultStart, config?.defaultEnd]);

  const parsedDates = useMemo(() => ({
    startDate: parseISO(filters.startDate),
    endDate: parseISO(filters.endDate),
  }), [filters.startDate, filters.endDate]);

  // Brazil timezone query dates (UTC-3)
  const brazilQueryDates = useMemo(() => ({
    startISO: toBrazilQueryStart(filters.startDate),
    endISO: toBrazilQueryEnd(filters.endDate),
  }), [filters.startDate, filters.endDate]);

  const activeFiltersCount = useMemo(() =>
    filters.status.length +
    filters.channels.length +
    filters.subId1.length +
    filters.subId2.length +
    filters.subId3.length +
    filters.subId4.length +
    filters.subId5.length
    , [filters]);

  return {
    filters,
    setFilters,
    clearFilters,
    parsedDates,
    brazilQueryDates,
    activeFiltersCount,
  };
}
