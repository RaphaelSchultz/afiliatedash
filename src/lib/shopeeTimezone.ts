// Shopee uses Singapore timezone (UTC+8) for daily reports
// This module provides utilities to work with "Shopee Day" concept

import { format, parseISO, startOfDay, endOfDay, addHours, subHours } from 'date-fns';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';

export const SHOPEE_TIMEZONE = 'Asia/Singapore'; // UTC+8

/**
 * Convert a local date to the start of that day in Shopee timezone (UTC+8)
 * This returns the UTC timestamp that represents 00:00:00 in Singapore
 */
export function toShopeeStartOfDay(date: Date | string): Date {
  const d = typeof date === 'string' ? parseISO(date) : date;
  // Get start of day in Singapore timezone, then convert to UTC
  const singaporeStart = startOfDay(toZonedTime(d, SHOPEE_TIMEZONE));
  return fromZonedTime(singaporeStart, SHOPEE_TIMEZONE);
}

/**
 * Convert a local date to the end of that day in Shopee timezone (UTC+8)
 * This returns the UTC timestamp that represents 23:59:59 in Singapore
 */
export function toShopeeEndOfDay(date: Date | string): Date {
  const d = typeof date === 'string' ? parseISO(date) : date;
  // Get end of day in Singapore timezone, then convert to UTC
  const singaporeEnd = endOfDay(toZonedTime(d, SHOPEE_TIMEZONE));
  return fromZonedTime(singaporeEnd, SHOPEE_TIMEZONE);
}

/**
 * Format a UTC timestamp as date in Shopee timezone (for display)
 */
export function formatShopeeDate(utcDate: string | Date, formatStr: string = 'dd/MM'): string {
  const d = typeof utcDate === 'string' ? parseISO(utcDate) : utcDate;
  const singaporeTime = toZonedTime(d, SHOPEE_TIMEZONE);
  return format(singaporeTime, formatStr);
}

/**
 * Get the Shopee day (YYYY-MM-DD) for a given UTC timestamp
 */
export function getShopeeDay(utcDate: string | Date): string {
  const d = typeof utcDate === 'string' ? parseISO(utcDate) : utcDate;
  const singaporeTime = toZonedTime(d, SHOPEE_TIMEZONE);
  return format(singaporeTime, 'yyyy-MM-dd');
}

/**
 * Convert a YYYY-MM-DD date string to ISO string for Supabase query
 * representing the start of that day in Shopee timezone
 */
export function toShopeeQueryStart(dateStr: string): string {
  // Parse the date and get start of day in Singapore
  const date = parseISO(dateStr);
  const shopeeStart = toShopeeStartOfDay(date);
  return shopeeStart.toISOString();
}

/**
 * Convert a YYYY-MM-DD date string to ISO string for Supabase query
 * representing the end of that day in Shopee timezone
 */
export function toShopeeQueryEnd(dateStr: string): string {
  // Parse the date and get end of day in Singapore
  const date = parseISO(dateStr);
  const shopeeEnd = toShopeeEndOfDay(date);
  return shopeeEnd.toISOString();
}
