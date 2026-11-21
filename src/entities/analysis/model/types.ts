export type AnalysisPlan = {
  status: 'supported' | 'unsupported';
  operation:
    | 'group_compare'
    | 'ranking'
    | 'trend'
    | 'anomalies'
    | 'unsupported';
  metric: 'price_nis' | 'price_per_sqm' | 'count';
  aggregation: 'median' | 'average' | 'count';
  groupBy:
    | 'city'
    | 'neighborhood'
    | 'has_parking'
    | 'has_elevator'
    | 'condition'
    | 'year'
    | null;
  filters: {
    city: string | null;
    neighborhood: string | null;
    propertyType: string | null;
    rooms: number | null;
    condition: string | null;
  };
  limit: number;
  reason: string | null;
};

export type AnalysisResult = {
  question: string;
  interpretation: string;
  plan: AnalysisPlan;
  summary: string;
  metrics: Array<{
    label: string;
    value: string;
  }>;
  evidence: Array<Record<string, string | number | null>>;
  limitations: string[];
  analysisRows: number;
  aiAvailable: boolean;
};
