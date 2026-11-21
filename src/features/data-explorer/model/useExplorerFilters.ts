import { useMemo, useState } from 'react';

import type { Transaction } from '../../../entities/transaction';

import { initialFilters, type ExplorerFilters } from './types';

export function useExplorerFilters(rows: Transaction[]) {
  const [filters, setFilters] = useState<ExplorerFilters>(initialFilters);

  const filtered = useMemo(() => {
    const query = filters.search.trim().toLowerCase();

    return rows.filter((row) => {
      const matchesSearch =
        !query ||
        [row.city, row.neighborhood, row.street, row.dealId].some((value) =>
          String(value ?? '').toLowerCase().includes(query),
        );

      const matchesParking =
        !filters.parking ||
        (filters.parking === 'yes'
          ? row.hasParking === true
          : row.hasParking === false);

      return (
        matchesSearch &&
        (!filters.city || row.city === filters.city) &&
        (!filters.rooms || String(row.rooms) === filters.rooms) &&
        (!filters.propertyType || row.propertyType === filters.propertyType) &&
        matchesParking
      );
    });
  }, [filters, rows]);

  const update = (patch: Partial<ExplorerFilters>) => {
    setFilters((current) => ({ ...current, ...patch }));
  };

  const clear = () => setFilters(initialFilters);

  return { filters, update, clear, filtered };
}
