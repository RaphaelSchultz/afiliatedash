// Dashboard uses Brazil timezone (UTC-3) for daily reports
// This module provides utilities to work with Brazilian day boundaries

import { format, parseISO, startOfDay, endOfDay } from 'date-fns';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';

export const BRAZIL_TIMEZONE = 'America/Sao_Paulo'; // UTC-3

/**
 * Convert a local date to the start of that day in Brazil timezone (UTC-3)
 * This returns the UTC timestamp that represents 00:00:00 in Brazil
 */
export function toBrazilStartOfDay(date: Date | string): Date {
  const d = typeof date === 'string' ? parseISO(date) : date;
  // Get start of day in Brazil timezone, then convert to UTC
  const brazilStart = startOfDay(toZonedTime(d, BRAZIL_TIMEZONE));
  return fromZonedTime(brazilStart, BRAZIL_TIMEZONE);
}

/**
 * Convert a local date to the end of that day in Brazil timezone (UTC-3)
 * This returns the UTC timestamp that represents 23:59:59 in Brazil
 */
export function toBrazilEndOfDay(date: Date | string): Date {
  const d = typeof date === 'string' ? parseISO(date) : date;
  // Get end of day in Brazil timezone, then convert to UTC
  const brazilEnd = endOfDay(toZonedTime(d, BRAZIL_TIMEZONE));
  return fromZonedTime(brazilEnd, BRAZIL_TIMEZONE);
}

/**
 * Format a UTC timestamp as date in Brazil timezone (for display)
 */
export function formatBrazilDate(utcDate: string | Date, formatStr: string = 'dd/MM'): string {
  const d = typeof utcDate === 'string' ? parseISO(utcDate) : utcDate;
  const brazilTime = toZonedTime(d, BRAZIL_TIMEZONE);
  return format(brazilTime, formatStr);
}

/**
 * Get the Brazil day (YYYY-MM-DD) for a given UTC timestamp
 */
export function getBrazilDay(utcDate: string | Date): string {
  const d = typeof utcDate === 'string' ? parseISO(utcDate) : utcDate;
  const brazilTime = toZonedTime(d, BRAZIL_TIMEZONE);
  return format(brazilTime, 'yyyy-MM-dd');
}

/**
 * Convert a YYYY-MM-DD date string to ISO string for Supabase query
 * representing the start of that day in Brazil timezone
 */
export function toBrazilQueryStart(dateStr: string): string {
  const date = parseISO(dateStr);
  const brazilStart = toBrazilStartOfDay(date);
  return brazilStart.toISOString();
}

/**
 * Convert a YYYY-MM-DD date string to ISO string for Supabase query
 * representing the end of that day in Brazil timezone
 */
export function toBrazilQueryEnd(dateStr: string): string {
  const date = parseISO(dateStr);
  const brazilEnd = toBrazilEndOfDay(date);
  return brazilEnd.toISOString();
}
