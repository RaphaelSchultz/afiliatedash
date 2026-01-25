import { useSearchParams } from 'react-router-dom';
import { useMemo, useCallback, useEffect, useState } from 'react';
import { startOfMonth, endOfMonth, format, parseISO, subDays } from 'date-fns';
import { toBrazilQueryStart, toBrazilQueryEnd } from '@/lib/shopeeTimezone';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

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

export function useFilters() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const [userDataRange, setUserDataRange] = useState<{ minDate: string | null; maxDate: string | null }>({
    minDate: null,
    maxDate: null,
  });
  const [hasInitialized, setHasInitialized] = useState(false);

  // Fetch user's data range on mount
  useEffect(() => {
    if (!user || hasInitialized) return;

    const fetchDataRange = async () => {
      try {
        const { data, error } = await supabase
          .from('shopee_vendas')
          .select('purchase_time')
          .eq('user_id', user.id)
          .order('purchase_time', { ascending: false })
          .limit(1);

        if (!error && data && data.length > 0) {
          const maxDate = data[0].purchase_time;
          const maxDateObj = new Date(maxDate);
          const minDateObj = subDays(maxDateObj, 30);

          const newMinDate = format(minDateObj, 'yyyy-MM-dd');
          const newMaxDate = format(maxDateObj, 'yyyy-MM-dd');

          setUserDataRange({ minDate: newMinDate, maxDate: newMaxDate });

          // Set URL params if not already set
          const hasDateParams = searchParams.has('startDate') || searchParams.has('endDate');
          if (!hasDateParams) {
            const params = new URLSearchParams(searchParams);
            params.set('startDate', newMinDate);
            params.set('endDate', newMaxDate);
            setSearchParams(params, { replace: true });
          }
        }
      } catch (err) {
        console.error('Error fetching data range:', err);
      } finally {
        setHasInitialized(true);
      }
    };

    fetchDataRange();
  }, [user, hasInitialized, searchParams, setSearchParams]);

  const filters = useMemo<Filters>(() => {
    const now = new Date();
    const defaultStart = userDataRange.minDate || format(startOfMonth(now), 'yyyy-MM-dd');
    const defaultEnd = userDataRange.maxDate || format(endOfMonth(now), 'yyyy-MM-dd');

    return {
      startDate: searchParams.get('startDate') || defaultStart,
      endDate: searchParams.get('endDate') || defaultEnd,
      status: searchParams.get('status')?.split(',').filter(Boolean) || [],
      channels: searchParams.get('channels')?.split(',').filter(Boolean) || [],
      subId1: searchParams.get('subId1')?.split(',').filter(Boolean) || [],
      subId2: searchParams.get('subId2')?.split(',').filter(Boolean) || [],
      subId3: searchParams.get('subId3')?.split(',').filter(Boolean) || [],
      subId4: searchParams.get('subId4')?.split(',').filter(Boolean) || [],
      subId5: searchParams.get('subId5')?.split(',').filter(Boolean) || [],
    };
  }, [searchParams, userDataRange]);

  const setFilters = useCallback(
    (newFilters: Partial<Filters>) => {
      const updated = { ...filters, ...newFilters };
      const params = new URLSearchParams();

      if (updated.startDate) params.set('startDate', updated.startDate);
      if (updated.endDate) params.set('endDate', updated.endDate);
      if (updated.status.length > 0) params.set('status', updated.status.join(','));
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
    setSearchParams({}, { replace: true });
  }, [setSearchParams]);

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
