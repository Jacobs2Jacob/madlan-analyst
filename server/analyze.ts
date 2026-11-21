import { executePlan } from './localCompute.js';
import { loadTransactions } from './data/load.js';
import { explain, planQuestion } from './llm/analysis.js';
import type { AnalysisPlan } from './schemas/analysis.js';

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

const CACHE_TTL_MS = 10 * 60 * 1000;
const analysisCache = new Map<
  string,
  { expiresAt: number; value: AnalysisResponse }
>();
const inFlight = new Map<string, Promise<AnalysisResponse>>();

function cacheKey(question: string) {
  return question.trim().replace(/\s+/g, ' ').toLocaleLowerCase('he-IL');
}

function getCached(key: string) {
  const cached = analysisCache.get(key);

  if (!cached) return undefined;

  if (cached.expiresAt <= Date.now()) {
    analysisCache.delete(key);
    return undefined;
  }

  return cached.value;
}

function setCached(key: string, value: AnalysisResponse) {
  analysisCache.set(key, {
    expiresAt: Date.now() + CACHE_TTL_MS,
    value,
  });
}

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

async function runAnalysis(question: string): Promise<AnalysisResponse> {
  let plan: AnalysisPlan;
  let aiAvailable = true;

  try {
    plan = await planQuestion(question);
  } 
  catch (error) {
    aiAvailable = false;
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

export async function analyzeQuestion(question: string): Promise<AnalysisResponse> {
  const key = cacheKey(question);
  const cached = getCached(key);

  if (cached) {
    return cached;
  }

  const existingRequest = inFlight.get(key);
  if (existingRequest) {
    return existingRequest;
  }

  const request = runAnalysis(question)
    .then((result) => {
      setCached(key, result);
      return result;
    })
    .finally(() => {
      inFlight.delete(key);
    });

  inFlight.set(key, request);
  return request;
}

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