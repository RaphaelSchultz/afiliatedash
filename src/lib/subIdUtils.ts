/**
 * Constants and utilities for SubID handling
 */

// Display text for null/empty SubID values
export const SEM_SUB_ID = 'Sem Sub ID';

/**
 * Normalizes a SubID value for display
 * Converts null, undefined, or empty strings to "Sem Sub ID"
 */
export function normalizeSubIdForDisplay(value: string | null | undefined): string {
  if (value === null || value === undefined || value === '') {
    return SEM_SUB_ID;
  }
  return value;
}

/**
 * Checks if a SubID value represents a null/empty value
 */
export function isNullSubId(value: string): boolean {
  return value === SEM_SUB_ID;
}

/**
 * Mapping from database field to filter key
 */
export const subIdFieldToFilterKey = {
  'sub_id1': 'subId1',
  'sub_id2': 'subId2',
  'sub_id3': 'subId3',
  'sub_id4': 'subId4',
  'sub_id5': 'subId5',
} as const;

export type SubIdField = keyof typeof subIdFieldToFilterKey;
export type SubIdFilterKey = (typeof subIdFieldToFilterKey)[SubIdField];
