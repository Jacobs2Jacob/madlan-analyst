import type { Transaction } from '../../../entities/transaction';

import { TransactionTable } from './TransactionTable';

export function TransactionsSection({ rows }: { rows: Transaction[] }) {
  return (
    <section>
      <TransactionTable rows={rows} />
    </section>
  );
}
