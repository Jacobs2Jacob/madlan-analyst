import rawTransactions from '../../../../data/transactions.json';

import type { Transaction } from './types';

export const transactions = rawTransactions as Transaction[];
