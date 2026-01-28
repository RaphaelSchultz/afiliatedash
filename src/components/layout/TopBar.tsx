import { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import { Filter, X, Menu } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { useLocation } from 'react-router-dom';
import { useFilters, type FilterConfig } from '@/hooks/useFilters';
import { Button } from '@/components/ui/button';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { SEM_SUB_ID, subIdFieldToFilterKey, type SubIdField } from '@/lib/subIdUtils';
import { FilterSidebar } from './FilterSidebar';

interface SubIdOptions {
  subId1: string[];
  subId2: string[];
  subId3: string[];
  subId4: string[];
  subId5: string[];
}

interface TopBarProps {
  onMobileMenuToggle?: () => void;
  filterConfig?: FilterConfig;
}

export function TopBar({ onMobileMenuToggle, filterConfig }: TopBarProps) {
  const { user } = useAuth();
  const location = useLocation();
  const { filters, setFilters, clearFilters, parsedDates, activeFiltersCount, brazilQueryDates } = useFilters(filterConfig);
  const [showFilters, setShowFilters] = useState(false);
  const [subIdOptions, setSubIdOptions] = useState<SubIdOptions>({
    subId1: [],
    subId2: [],
    subId3: [],
    subId4: [],
    subId5: [],
  });

  // Fetch available SubID options
  useEffect(() => {
    if (!user) return;

    const fetchSubIdOptions = async () => {
      const subIdFields: SubIdField[] = ['sub_id1', 'sub_id2', 'sub_id3', 'sub_id4', 'sub_id5'];
      const results: SubIdOptions = {
        subId1: [],
        subId2: [],
        subId3: [],
        subId4: [],
        subId5: [],
      };

      // Fetch all fields in parallel - including nulls
      const promises = subIdFields.map(async (field) => {
        const { data, error } = await supabase
          .from('shopee_vendas')
          .select(field)
          .eq('user_id', user.id)
          .gte('purchase_time', brazilQueryDates.startISO)
          .lte('purchase_time', brazilQueryDates.endISO);

        if (error) {
          console.error(`Error fetching ${field}:`, error);
          return { field, values: [], hasNull: false };
        }

        // Separate non-null values and check for nulls
        const nonNullValues: string[] = [];
        let hasNull = false;

        for (const row of data || []) {
          const value = row[field];
          if (value === null || value === undefined || value === '') {
            hasNull = true;
          } else {
            nonNullValues.push(value);
          }
        }

        const uniqueValues = [...new Set(nonNullValues)].sort() as string[];

        return { field, values: uniqueValues, hasNull };
      });

      const responses = await Promise.all(promises);

      for (const { field, values, hasNull } of responses) {
        const key = subIdFieldToFilterKey[field as SubIdField];
        // Add "Sem Sub ID" at the beginning if there are null values
        results[key] = hasNull ? [SEM_SUB_ID, ...values] : values;
      }

      setSubIdOptions(results);
    };

    fetchSubIdOptions();
  }, [user, brazilQueryDates]);

  // Convert parsed dates to DateRange for the picker
  const dateRange: DateRange = useMemo(() => ({
    from: parsedDates.startDate,
    to: parsedDates.endDate,
  }), [parsedDates]);

  // Check if current page should use single day selection only
  const singleDayOnly = location.pathname === '/analytics/day';

  const handleDateRangeChange = (range: DateRange | undefined) => {
    if (range?.from) {
      setFilters({
        startDate: format(range.from, 'yyyy-MM-dd'),
        endDate: range.to ? format(range.to, 'yyyy-MM-dd') : format(range.from, 'yyyy-MM-dd'),
      });
    }
  };

  return (
    <header className="sticky top-0 z-40 glass-card border-b border-white/10 px-4 lg:px-6 py-4">
      <div className="flex items-center justify-between gap-4 w-full">
        {/* Left side: Mobile menu only */}
        <div className="flex items-center">
          {/* Mobile Menu Toggle - only visible on mobile */}
          {onMobileMenuToggle && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onMobileMenuToggle}
              className="lg:hidden text-muted-foreground hover:text-foreground"
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}
        </div>

        {/* Right side: All filters aligned right */}
        <div className="flex items-center gap-2 lg:gap-3">
          {/* Date Range Picker - hidden on mobile, visible on desktop */}
          <div className="hidden lg:block">
            <DateRangePicker
              dateRange={dateRange}
              onDateRangeChange={handleDateRangeChange}
              className="w-auto"
              singleDayOnly={singleDayOnly}
            />
          </div>



          {/* Filter Toggle */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowFilters(true)}
            className={cn(
              'relative bg-secondary/50 border-border hover:bg-secondary',
              showFilters && 'bg-primary/10 border-primary/20 text-primary'
            )}
          >
            <Filter className="h-4 w-4" />
            {activeFiltersCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </Button>
        </div>
      </div>

      <FilterSidebar
        open={showFilters}
        onOpenChange={setShowFilters}
        subIdOptions={subIdOptions as any}
        filterConfig={filterConfig}
      />
    </header>
  );
}