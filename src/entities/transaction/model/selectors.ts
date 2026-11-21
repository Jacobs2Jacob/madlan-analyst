import type { Transaction } from './types';

export const uniqueSorted = (values: Array<string | number | null>) =>
  [...new Set(values.filter((value) => value !== null))].sort((a, b) =>
    String(a).localeCompare(String(b), 'he'),
  );

export const median = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b);

  if (!sorted.length) {
    return null;
  }

  const middle = Math.floor(sorted.length / 2);

  return sorted.length % 2
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2;
};

export const getMedianPricePerSqm = (rows: Transaction[]) =>
  median(
    rows
      .map((row) => row.pricePerSqm)
      .filter((value): value is number => value != null && value > 0),
  );
