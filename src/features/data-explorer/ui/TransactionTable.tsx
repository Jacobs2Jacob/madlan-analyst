import { useEffect, useState } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';

import type { Transaction } from '../../../entities/transaction';

import styles from './TransactionTable.module.css';

const PAGE_SIZE = 50;

const formatMoney = (value: number | null) =>
  value == null ? '—' : `₪${Math.round(value).toLocaleString('he-IL')}`;

const formatYesNo = (value: boolean | null) =>
  value == null ? '—' : value ? 'כן' : 'לא';

function TransactionRow({ row }: { row: Transaction }) {
  return (
    <tr>
      <td>{row.city}</td>
      <td>{row.neighborhood ?? '—'}</td>
      <td>{row.street ?? '—'}</td>
      <td>{row.rooms ?? '—'}</td>
      <td>{row.sizeSqm ?? '—'}</td>
      <td>{formatYesNo(row.hasParking)}</td>
      <td>{formatMoney(row.priceNis)}</td>
      <td>
        {formatMoney(row.pricePerSqm)}
        {row.pricePerSqmDerived ? ' *' : ''}
      </td>
      <td>{row.dealDate ?? '—'}</td>
      <td>{row.source}</td>
    </tr>
  );
}

export function TransactionTable({ rows }: { rows: Transaction[] }) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    setVisibleCount(Math.min(PAGE_SIZE, rows.length));
  }, [rows.length]);

  const visibleRows = rows.slice(0, visibleCount);
  const hasMore = visibleCount < rows.length;

  return (
    <div className={styles.wrap}>
      <InfiniteScroll
        dataLength={visibleRows.length}
        next={() =>
          setVisibleCount((current) =>
            Math.min(current + PAGE_SIZE, rows.length),
          )
        }
        hasMore={hasMore}
        loader={<div className={styles.loader}>טוען עסקאות נוספות...</div>}
        endMessage={
          rows.length > PAGE_SIZE ? (
            <div className={styles.note}>
              כל {rows.length.toLocaleString('he-IL')} העסקאות הוצגו.
            </div>
          ) : null
        }
      >
        <table className={styles.table}>
          <thead>
            <tr>
              <th>עיר</th>
              <th>שכונה</th>
              <th>רחוב</th>
              <th>חדרים</th>
              <th>מ״ר</th>
              <th>חניה</th>
              <th>מחיר</th>
              <th>מחיר למ״ר</th>
              <th>תאריך</th>
              <th>מקור</th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row, index) => (
              <TransactionRow key={`${row.dealId}-${index}`} row={row} />
            ))}
          </tbody>
        </table>
      </InfiniteScroll>
    </div>
  );
}
