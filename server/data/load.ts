import fs from 'node:fs';
import path from 'node:path';

export type ServerTransaction = {
  dealId: string;
  city: string;
  neighborhood: string | null;
  street: string | null;
  propertyType: string;
  rooms: number | null;
  sizeSqm: number | null;
  floor: number | null;
  totalFloors: number | null;
  yearBuilt: number | null;
  condition: string | null;
  hasElevator: boolean | null;
  hasParking: boolean | null;
  hasBalcony: boolean | null;
  hasSafeRoom: boolean | null;
  dealDate: string | null;
  priceNis: number | null;
  pricePerSqm: number | null;
  pricePerSqmDerived: boolean;
  source: string;
};

let cached: ServerTransaction[] | null = null;

export function loadTransactions(): ServerTransaction[] {
  if (cached) return cached;

  const file = path.join(process.cwd(), 'data', 'transactions.json');
  cached = JSON.parse(fs.readFileSync(file, 'utf8')) as ServerTransaction[];
  return cached;
}
