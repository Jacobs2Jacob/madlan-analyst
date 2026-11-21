import { executePlan } from './analysis/executePlan';
import { loadTransactions } from './data/load';
import { explain, planQuestion } from './llm/analysis';
import type { AnalysisPlan } from './schemas/analysis';

export type AnalysisResponse = {
  question: string;
  interpretation: string;
  plan: AnalysisPlan;
  summary: string;
  metrics: Array<{ label: string; value: string }>;
  evidence: Array<Record<string, string | number | null>>;
  limitations: string[];
  analysisRows: number;
  aiAvailable: boolean;
};

function interpretation(plan: AnalysisPlan) {
  if (plan.operation === 'ranking' || plan.operation === 'group_compare') {
    return 'השוואת קבוצות';
  }
  if (plan.operation === 'trend') return 'מגמת מחירים';
  if (plan.operation === 'anomalies') return 'איתור עסקאות חריגות';
  return 'ניתוח הנתונים';
}

function fallbackUnsupportedPlan(reason: string): AnalysisPlan {
  return {
    status: 'unsupported',
    operation: 'unsupported',
    metric: 'price_per_sqm',
    aggregation: 'median',
    groupBy: null,
    filters: {
      city: null,
      neighborhood: null,
      propertyType: null,
      rooms: null,
      condition: null,
    },
    limit: 8,
    reason,
  };
}

export async function analyzeQuestion(question: string): Promise<AnalysisResponse> {
  let plan: AnalysisPlan;
  let aiAvailable = true;

  try {
    plan = await planQuestion(question);
  } catch (error) {
    console.error('LLM planning failed:', error);
    aiAvailable = false;
    plan = fallbackUnsupportedPlan(
      'שירות ה-AI אינו זמין כרגע. אפשר לנסות שוב מאוחר יותר.',
    );
  }

  const computed = executePlan(loadTransactions(), plan);
  let summary =
    computed.limitations[0] ?? 'הניתוח הושלם על בסיס העסקאות שנמצאו.';

  if (aiAvailable && plan.status === 'supported') {
    try {
      summary = await explain(question, plan, computed);
    } catch (error) {
      console.error('LLM explanation failed:', error);
      aiAvailable = false;
    }
  }

  return {
    question,
    interpretation: interpretation(plan),
    plan,
    summary,
    metrics: computed.metrics,
    evidence: computed.evidence,
    limitations: computed.limitations,
    analysisRows: computed.analysisRows,
    aiAvailable,
  };
}
