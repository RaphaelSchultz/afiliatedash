import * as React from 'react';
import { format, subDays, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import { DateRange } from 'react-day-picker';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface DateRangePickerProps {
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
  className?: string;
  singleDayOnly?: boolean; // New prop to restrict to single day
}

const presets = [
  { label: 'Últimos 7 dias', days: 7 },
  { label: 'Últimos 15 dias', days: 15 },
  { label: 'Últimos 30 dias', days: 30 },
];

const singleDayPresets = [
  { label: 'Hoje', days: 0 },
  { label: 'Ontem', days: 1 },
  { label: 'Anteontem', days: 2 },
];

export function DateRangePicker({
  dateRange,
  onDateRangeChange,
  className,
  singleDayOnly = false,
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const handlePresetClick = (days: number) => {
    const today = new Date();
    if (singleDayOnly) {
      const targetDate = days === 0 ? today : subDays(today, days);
      onDateRangeChange({
        from: targetDate,
        to: targetDate,
      });
    } else {
      // Range filters should also end YESTERDAY (D-1) by default
      const endDate = subDays(today, 1);
      onDateRangeChange({
        from: subDays(endDate, days - 1), // e.g. 7 days ending yesterday
        to: endDate,
      });
    }
  };

  const handleSelect = (range: DateRange | undefined) => {
    if (singleDayOnly && range?.from) {
      // Force single day selection
      onDateRangeChange({
        from: range.from,
        to: range.from,
      });
    } else {
      onDateRangeChange(range);
    }
  };

  const activePresets = singleDayOnly ? singleDayPresets : presets;

  // Display logic for single day vs range
  const displayText = React.useMemo(() => {
    if (!dateRange?.from) return null;

    if (singleDayOnly || (dateRange.to && isSameDay(dateRange.from, dateRange.to))) {
      return format(dateRange.from, 'dd/MM/yyyy', { locale: ptBR });
    }

    if (dateRange.to) {
      return (
        <>
          {format(dateRange.from, 'dd/MM/yyyy', { locale: ptBR })}
          <span className="mx-2 text-muted-foreground">~</span>
          {format(dateRange.to, 'dd/MM/yyyy', { locale: ptBR })}
        </>
      );
    }

    return format(dateRange.from, 'dd/MM/yyyy', { locale: ptBR });
  }, [dateRange, singleDayOnly]);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'justify-start text-left font-normal bg-secondary/50 border-border hover:bg-secondary hover:text-foreground',
            !dateRange && 'text-muted-foreground',
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
          {displayText || <span>{singleDayOnly ? 'Selecione o dia' : 'Selecione o período'}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-0 bg-card border-border z-50"
        align="start"
        sideOffset={8}
      >
        <div className="flex">
          {/* Presets sidebar */}
          <div className="border-r border-border p-2.5 space-y-1 hidden sm:block w-32">
            <p className="text-[11px] font-medium text-muted-foreground mb-2 px-2">
              Atalhos
            </p>
            {activePresets.map((preset) => (
              <Button
                key={preset.days}
                variant="ghost"
                size="sm"
                className="w-full justify-start text-xs font-normal hover:bg-secondary h-8 px-2"
                onClick={() => handlePresetClick(preset.days)}
              >
                {preset.label}
              </Button>
            ))}
          </div>

          {/* Calendar */}
          <div className="p-2.5">
            {singleDayOnly ? (
              <Calendar
                initialFocus
                mode="single"
                defaultMonth={dateRange?.from}
                selected={dateRange?.from}
                onSelect={(date: Date | undefined) => {
                  handleSelect(date ? { from: date, to: date } : undefined);
                }}
                numberOfMonths={1}
                locale={ptBR}
                disabled={(date) => date > new Date()}
                className="pointer-events-auto"
                classNames={{
                  months: "flex flex-col sm:flex-row space-y-3 sm:space-x-4 sm:space-y-0",
                  month: "space-y-2",
                  caption: "flex justify-center pt-1 relative items-center h-8",
                  caption_label: "text-xs font-medium",
                  nav: "space-x-1 flex items-center",
                  nav_button: "h-6 w-6 bg-transparent p-0 opacity-50 hover:opacity-100",
                  nav_button_previous: "absolute left-1",
                  nav_button_next: "absolute right-1",
                  table: "w-full border-collapse",
                  head_row: "flex",
                  head_cell: "text-muted-foreground rounded-md w-8 font-normal text-[10px]",
                  row: "flex w-full mt-1",
                  cell: cn(
                    "h-8 w-8 text-center text-xs p-0 relative",
                    "[&:has([aria-selected])]:bg-accent",
                    "focus-within:relative focus-within:z-20"
                  ),
                  day: cn(
                    "h-8 w-8 p-0 font-normal text-xs aria-selected:opacity-100 rounded-md",
                    "hover:bg-accent hover:text-accent-foreground",
                    "focus:bg-accent focus:text-accent-foreground"
                  ),
                  day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                  day_today: "",
                  day_outside: "day-outside text-muted-foreground opacity-50",
                  day_disabled: "text-muted-foreground opacity-50",
                  day_hidden: "invisible",
                }}
              />
            ) : (
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={handleSelect}
                numberOfMonths={2}
                locale={ptBR}
                disabled={(date) => date > new Date()}
                className="pointer-events-auto"
                classNames={{
                  months: "flex flex-col sm:flex-row space-y-3 sm:space-x-4 sm:space-y-0",
                  month: "space-y-2",
                  caption: "flex justify-center pt-1 relative items-center h-8",
                  caption_label: "text-xs font-medium",
                  nav: "space-x-1 flex items-center",
                  nav_button: "h-6 w-6 bg-transparent p-0 opacity-50 hover:opacity-100",
                  nav_button_previous: "absolute left-1",
                  nav_button_next: "absolute right-1",
                  table: "w-full border-collapse",
                  head_row: "flex",
                  head_cell: "text-muted-foreground rounded-md w-8 font-normal text-[10px]",
                  row: "flex w-full mt-1",
                  cell: cn(
                    "h-8 w-8 text-center text-xs p-0 relative",
                    "[&:has([aria-selected].day-range-end)]:rounded-r-md",
                    "[&:has([aria-selected].day-outside)]:bg-accent/50",
                    "[&:has([aria-selected])]:bg-accent",
                    "first:[&:has([aria-selected])]:rounded-l-md",
                    "last:[&:has([aria-selected])]:rounded-r-md",
                    "focus-within:relative focus-within:z-20"
                  ),
                  day: cn(
                    "h-8 w-8 p-0 font-normal text-xs aria-selected:opacity-100 rounded-md",
                    "hover:bg-accent hover:text-accent-foreground",
                    "focus:bg-accent focus:text-accent-foreground"
                  ),
                  day_range_start: "day-range-start bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground rounded-l-md",
                  day_range_end: "day-range-end bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground rounded-r-md",
                  day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                  day_today: "",
                  day_outside: "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
                  day_disabled: "text-muted-foreground opacity-50",
                  day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                  day_hidden: "invisible",
                }}
              />
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
