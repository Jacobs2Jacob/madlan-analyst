import { executePlan } from './localCompute.js';
import { loadTransactions } from './data/load.js';
import { explain, planQuestion } from './llm/analysis.js';
import type { AnalysisPlan } from './schemas/analysis.js';

export class AnalysisUnavailableError extends Error {
  statusCode = 503;

  constructor(message = 'שירות ה-AI אינו זמין כרגע. אפשר לנסות שוב מאוחר יותר.') {
    super(message);
    this.name = 'AnalysisUnavailableError';
  }
}

export class UnsupportedQuestionError extends Error {
  statusCode = 422;

  constructor(message = 'השאלה אינה נתמכת על ידי סוגי הניתוח הזמינים. נסה שאלה על מחירים, ערים, מאפייני דירה, מגמות או עסקאות חריגות.') {
    super(message);
    this.name = 'UnsupportedQuestionError';
  }
}

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
    throw new AnalysisUnavailableError();
  }

  if (plan.status === 'unsupported' || plan.operation === 'unsupported') {
    throw new UnsupportedQuestionError(
      plan.reason ??
        'השאלה אינה נתמכת על ידי סוגי הניתוח הזמינים. נסה שאלה על מחירים, ערים, מאפייני דירה, מגמות או עסקאות חריגות.',
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
