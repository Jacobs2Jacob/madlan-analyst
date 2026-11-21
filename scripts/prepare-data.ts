import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'csv-parse/sync';

const root = process.cwd();
const input = fs.readFileSync(path.join(root, 'data/deals.csv'), 'utf8');
const rows = parse(input, { columns: true, skip_empty_lines: true, relax_column_count: true });

const bool = (value: unknown): boolean | null => {
  const v = String(value ?? '').trim().toLowerCase();
  if (['true', 'yes', '1', 'כן'].includes(v)) return true;
  if (['false', 'no', '0', 'לא'].includes(v)) return false;
  return null;
};

const numberValue = (value: unknown): number | null => {
  const v = String(value ?? '').replace(/[₪,]/g, '').trim();
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const rooms = (value: unknown): number | null => {
  const match = String(value ?? '').replace(',', '.').match(/\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : null;
};

const clean = (value: unknown) => String(value ?? '').trim().replace(/\s+/g, ' ');

const city = (value: unknown) => {
  const v = clean(value);
  const aliases: Record<string, string> = {
    'Jerusalem': 'ירושלים',
    'ירושלים': 'ירושלים',
    'Tel Aviv': 'תל אביב-יפו',
    'Tel Aviv-Yafo': 'תל אביב-יפו',
    'תל אביב יפו': 'תל אביב-יפו',
    'תל אביב-יפו': 'תל אביב-יפו',
    'תל אביב': 'תל אביב-יפו',
    'באר-שבע': 'באר שבע',
    'באר שבע': 'באר שבע',
    'ב"ש': 'באר שבע',
    'בית-שמש': 'בית שמש',
    'בית שמש': 'בית שמש',
    'מודיעין מכבים רעות': 'מודיעין-מכבים-רעות',
    'מודיעין-מכבים-רעות': 'מודיעין-מכבים-רעות',
    'מודיעין': 'מודיעין-מכבים-רעות',
  };
  return aliases[v] ?? v;
};

const normalized = rows.map((value: unknown) => {
  const row = value as Record<string, unknown>;
  const price = numberValue(row.price_nis);
  const size = numberValue(row.size_sqm);
  const suppliedPpsm = numberValue(row.price_per_sqm);
  const derivedPpsm = price && size && price > 0 && size > 0 ? Math.round(price / size) : null;

  return {
    dealId: clean(row.deal_id),
    city: city(row.city),
    neighborhood: clean(row.neighborhood),
    street: clean(row.street),
    propertyType: clean(row.property_type),
    rooms: rooms(row.rooms),
    sizeSqm: size,
    floor: numberValue(row.floor),
    totalFloors: numberValue(row.total_floors),
    yearBuilt: numberValue(row.year_built),
    condition: clean(row.condition),
    hasElevator: bool(row.has_elevator),
    hasParking: bool(row.has_parking),
    hasBalcony: bool(row.has_balcony),
    hasSafeRoom: bool(row.has_safe_room),
    dealDate: clean(row.deal_date),
    priceNis: price,
    pricePerSqm: suppliedPpsm && suppliedPpsm > 0 ? suppliedPpsm : derivedPpsm,
    pricePerSqmDerived: suppliedPpsm && suppliedPpsm > 0 ? false : Boolean(derivedPpsm),
    source: clean(row.source),
  };
});

fs.writeFileSync(path.join(root, 'data/transactions.json'), JSON.stringify(normalized));
console.log(`Prepared ${normalized.length} transactions.`);
