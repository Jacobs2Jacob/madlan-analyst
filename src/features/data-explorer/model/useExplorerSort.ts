import { useMemo, useState } from 'react';

import type { Transaction } from '../../../entities/transaction';

export type SortKey = 'date' | 'price' | 'sqm';

export function useExplorerSort(rows: Transaction[]) {
  const [sort, setSort] = useState<SortKey>('date');

  const sorted = useMemo(
    () =>
      [...rows].sort((a, b) => {
        if (sort === 'price') return (b.priceNis ?? -1) - (a.priceNis ?? -1);
        if (sort === 'sqm') {
          return (b.pricePerSqm ?? -1) - (a.pricePerSqm ?? -1);
        }
        return String(b.dealDate ?? '').localeCompare(String(a.dealDate ?? ''));
      }),
    [rows, sort],
  );

  return { sort, setSort, sorted };
}
