/**
 * Shared enum values for the master transaction UI.
 *
 * These values are provided by the backend via the Inertia shared props (masterTransactionEnums)
 * to keep frontend and backend in sync without hardcoding enum literals in multiple places.
 */
export interface MasterTransactionEnums {
  types: string[];
  statuses: string[];
  sourceTypes: string[];
  sourcePrefixes: Record<string, string>;
  stockTypes: string[];
}

export interface EnumOption {
  value: string;
  label: string;
}

const humanize = (value: string): string =>
  value
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase());

export const toEnumOptions = (values: string[]): EnumOption[] => {
  return values.map((value) => ({
    value,
    label: humanize(value),
  }));
};
