import { useMemo } from 'react'; 
import { uniqueSorted, useTransactions } from '../../../entities/transaction'; 
import { useExplorerFilters } from '../model/useExplorerFilters';
import { useExplorerSort, type SortKey } from '../model/useExplorerSort';
import { ExplorerFilters as ExplorerFiltersView } from './ExplorerFilters';
import { ExplorerSort } from './ExplorerSort'; 
import { TransactionsSection } from './TransactionsSection'; 
import styles from './DataExplorer.module.css';

type DataExplorerProps = {
  onAsk: () => void;
};

export function DataExplorer({ onAsk }: DataExplorerProps) {
  const { transactions } = useTransactions();
  const { filters, update, clear, filtered } = useExplorerFilters(transactions);
  const { sort, setSort, sorted } = useExplorerSort(filtered);

  const cities = useMemo(
    () => uniqueSorted(transactions.map((transaction) => transaction.city)) as string[],
    [transactions],
  );

  const propertyTypes = useMemo(
    () =>
      uniqueSorted(
        transactions.map((transaction) => transaction.propertyType),
      ) as string[],
    [transactions],
  );

  const rooms = useMemo(
    () =>
      uniqueSorted(transactions.map((transaction) => transaction.rooms))
        .map(Number)
        .sort((a, b) => a - b),
    [transactions],
  );

  return (
    <> 
      <div className={styles.filters}>
        <ExplorerFiltersView
          filters={filters}
          cities={cities}
          rooms={rooms}
          propertyTypes={propertyTypes}
          update={update}
          clear={clear}
        />
        <ExplorerSort value={sort as SortKey} onChange={setSort} />
      </div>
 
      <TransactionsSection rows={sorted} />
    </>
  );
}
