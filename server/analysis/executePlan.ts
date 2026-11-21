import type { AnalysisPlan } from '../schemas/analysis';
import type { ServerTransaction } from '../data/load';

type EvidenceRow = Record<string, string | number | null>;

export type ComputedAnalysis = {
  metrics: Array<{ label: string; value: string }>;
  evidence: EvidenceRow[];
  limitations: string[];
  analysisRows: number;
};

function median(values: number[]) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2;
}

function aggregate(values: number[], aggregation: AnalysisPlan['aggregation']) {
  if (!values.length) return null;
  if (aggregation === 'count') return values.length;
  if (aggregation === 'average') {
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }
  return median(values);
}

function formatMetric(value: number | null, metric: AnalysisPlan['metric']) {
  if (value == null) return '—';
  if (metric === 'count') return value.toLocaleString('he-IL');
  return `₪${Math.round(value).toLocaleString('he-IL')}`;
}

function metricValue(row: ServerTransaction, metric: AnalysisPlan['metric']) {
  if (metric === 'count') return 1;
  return metric === 'price_nis' ? row.priceNis : row.pricePerSqm;
}

function matchesFilters(row: ServerTransaction, plan: AnalysisPlan) {
  const f = plan.filters;
  return (
    (!f.city || row.city === f.city) &&
    (!f.neighborhood || row.neighborhood === f.neighborhood) &&
    (!f.propertyType || row.propertyType === f.propertyType) &&
    (f.rooms == null || row.rooms === f.rooms) &&
    (!f.condition || row.condition === f.condition)
  );
}

function groupLabel(row: ServerTransaction, groupBy: NonNullable<AnalysisPlan['groupBy']>) {
  if (groupBy === 'year') return row.dealDate?.slice(0, 4) ?? 'לא ידוע';
  if (groupBy === 'has_parking') return row.hasParking == null ? 'לא ידוע' : row.hasParking ? 'יש חניה' : 'אין חניה';
  if (groupBy === 'has_elevator') return row.hasElevator == null ? 'לא ידוע' : row.hasElevator ? 'יש מעלית' : 'אין מעלית';
  return String(row[groupBy] ?? 'לא ידוע');
}

export function executePlan(
  rows: ServerTransaction[],
  plan: AnalysisPlan,
): ComputedAnalysis {
  const filtered = rows.filter((row) => matchesFilters(row, plan));
  const limitations: string[] = [];

  if (plan.status !== 'supported' || plan.operation === 'unsupported') {
    return {
      metrics: [],
      evidence: [],
      limitations: [plan.reason ?? 'השאלה אינה נתמכת על ידי הניתוח הקיים.'],
      analysisRows: filtered.length,
    };
  }

  if (!filtered.length) {
    return {
      metrics: [{ label: 'עסקאות שנבדקו', value: '0' }],
      evidence: [],
      limitations: ['לא נמצאו עסקאות התואמות את הסינון.'],
      analysisRows: 0,
    };
  }

  if (plan.operation === 'anomalies') {
    const priced = filtered.filter(
      (row) => row.pricePerSqm != null && row.pricePerSqm > 0,
    );
    const center = median(priced.map((row) => row.pricePerSqm!));
    const ranked = [...priced]
      .sort(
        (a, b) =>
          Math.abs((b.pricePerSqm! - center!) / center!) -
          Math.abs((a.pricePerSqm! - center!) / center!),
      )
      .slice(0, plan.limit);

    limitations.push(
      'חריגות כאן מוגדרות ביחס למחיר למ״ר החציוני של העסקאות שנמצאו; זה אינו קובע שהעסקה שגויה.',
    );

    return {
      metrics: [
        { label: 'עסקאות שנבדקו', value: filtered.length.toLocaleString('he-IL') },
        { label: 'מחיר חציוני למ״ר', value: formatMetric(center, 'price_per_sqm') },
      ],
      evidence: ranked.map((row) => ({
        עיר: row.city,
        שכונה: row.neighborhood,
        'מחיר למ״ר': row.pricePerSqm,
        תאריך: row.dealDate,
        מקור: row.source,
      })),
      limitations,
      analysisRows: filtered.length,
    };
  }

  if (!plan.groupBy) {
    return {
      metrics: [],
      evidence: [],
      limitations: ['לא הוגדר שדה לקיבוץ התוצאות.'],
      analysisRows: filtered.length,
    };
  }

  const groups = new Map<string, number[]>();
  for (const row of filtered) {
    const value = metricValue(row, plan.metric);
    if (value == null || !Number.isFinite(value)) continue;
    const key = groupLabel(row, plan.groupBy);
    const values = groups.get(key) ?? [];
    values.push(value);
    groups.set(key, values);
  }

  const computed = [...groups.entries()]
    .map(([group, values]) => ({
      group,
      value: aggregate(values, plan.aggregation),
      count: values.length,
    }))
    .filter((row) => row.value != null)
    .sort((a, b) => (b.value! - a.value!));

  if (plan.operation === 'trend') {
    computed.sort((a, b) => a.group.localeCompare(b.group));
  }

  if (plan.operation === 'group_compare' && computed.length >= 2) {
    limitations.push(
      'ההשוואה מתארת הבדל שנצפה בנתונים ואינה מוכיחה קשר סיבתי.',
    );
  }

  if (plan.operation === 'ranking') {
    limitations.push('הדירוג מבוסס רק על העסקאות שנמצאות בדאטה שסופק.');
  }

  return {
    metrics: [
      { label: 'עסקאות שנבדקו', value: filtered.length.toLocaleString('he-IL') },
      { label: 'קבוצות', value: computed.length.toLocaleString('he-IL') },
    ],
    evidence: computed.slice(0, plan.limit).map((row) => ({
      קבוצה: row.group,
      ערך: formatMetric(row.value, plan.metric),
      עסקאות: row.count,
    })),
    limitations,
    analysisRows: filtered.length,
  };
}
