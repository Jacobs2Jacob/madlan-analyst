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
  {
    expiresAt: number;
    value: AnalysisResponse;
  }
>();

const inFlight = new Map<string, Promise<AnalysisResponse>>();

function cacheKey(plan: AnalysisPlan) {
  return JSON.stringify(plan);
}

function getCached(key: string) {
  const cached = analysisCache.get(key);

  if (!cached) {
    return undefined;
  }

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
  if (
    plan.operation === 'ranking' ||
    plan.operation === 'group_compare'
  ) {
    return 'השוואת קבוצות';
  }

  if (plan.operation === 'trend') {
    return 'מגמת מחירים';
  }

  if (plan.operation === 'anomalies') {
    return 'איתור עסקאות חריגות';
  }

  return 'ניתוח הנתונים';
}

function fallbackSummary(
  plan: AnalysisPlan,
  computed: {
    metrics: Array<{ label: string; value: string }>;
    evidence: Array<Record<string, string | number | null>>;
    limitations: string[];
    analysisRows: number;
  },
) {
  if (computed.analysisRows === 0) {
    return 'לא נמצאו עסקאות התואמות את הסינון שבשאלה.';
  }

  const first = computed.evidence[0];
  const second = computed.evidence[1];

  if (plan.operation === 'trend' && first && second) {
    const last = computed.evidence[computed.evidence.length - 1];
    const firstGroup = first['קבוצה'];
    const firstValue = first['ערך'];
    const lastGroup = last?.['קבוצה'];
    const lastValue = last?.['ערך'];

    if (last && firstGroup !== lastGroup) {
      return `לפי הנתונים, המחיר השתנה מ-${firstValue} בשנת ${firstGroup} ל-${lastValue} בשנת ${lastGroup}. הנתונים מתארים את השינוי שנצפה בעסקאות שנכללו בניתוח.`;
    }
  }

  if (plan.operation === 'group_compare' && first && second) {
    return `לפי הנתונים, ${first['קבוצה']} הציג ערך של ${first['ערך']}, לעומת ${second['ערך']} עבור ${second['קבוצה']}. מדובר בהבדל שנצפה בנתונים ולא בהוכחה לקשר סיבתי.`;
  }

  if (plan.operation === 'ranking' && first) {
    const top = computed.evidence
      .slice(0, 3)
      .map((row) => `${row['קבוצה']}: ${row['ערך']}`)
      .join(', ');

    return `לפי הנתונים, הקבוצות המובילות בדירוג הן: ${top}. הדירוג מבוסס על העסקאות שנמצאות בדאטה שסופק.`;
  }

  if (plan.operation === 'anomalies') {
    return `נמצאו ${computed.evidence.length} עסקאות שנראות חריגות ביחס למחיר למ״ר החציוני של העסקאות שנבדקו. חריגה אינה אומרת שהעסקה שגויה.`;
  }

  return 'הניתוח הושלם על בסיס העסקאות שנמצאו. הנתונים המוצגים למטה מבוססים על החישוב שבוצע.';
}

async function executeAnalysis(
  question: string,
  plan: AnalysisPlan,
  plannerAiAvailable = true,
): Promise<AnalysisResponse> {
  const computed = executePlan(loadTransactions(), plan);

  let summary = fallbackSummary(plan, computed);
  let aiAvailable = plannerAiAvailable;

  if (plannerAiAvailable) {
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

export async function analyzeQuestion(
  question: string,
): Promise<AnalysisResponse> {
  let plan: AnalysisPlan;
  let plannerAiAvailable = true;

  try {
    const planned = await planQuestion(question);
    plan = planned.plan;
    plannerAiAvailable = planned.aiAvailable;
  } catch (error) {
    console.error('LLM planning failed and no deterministic fallback matched:', error);
    throw new AnalysisUnavailableError();
  }

  if (
    plan.status === 'unsupported' ||
    plan.operation === 'unsupported'
  ) {
    throw new UnsupportedQuestionError(
      plan.reason ??
        'השאלה אינה נתמכת על ידי סוגי הניתוח הזמינים. נסה שאלה על מחירים, ערים, מאפייני דירה, מגמות או עסקאות חריגות.',
    );
  }

  const key = cacheKey(plan);

  const cached = getCached(key);

  if (cached) {
    return cached;
  }

  const existingRequest = inFlight.get(key);

  if (existingRequest) {
    return existingRequest;
  }

  const request = executeAnalysis(question, plan, plannerAiAvailable)
    .then((result) => {
      if (result.aiAvailable) {
        setCached(key, result);
      }
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

  constructor(
    message = 'שירות ה-AI אינו זמין כרגע. אפשר לנסות שוב מאוחר יותר.',
  ) {
    super(message);
    this.name = 'AnalysisUnavailableError';
  }
}

export class UnsupportedQuestionError extends Error {
  statusCode = 422;

  constructor(
    message = 'השאלה אינה נתמכת על ידי סוגי הניתוח הזמינים. נסה שאלה על מחירים, ערים, מאפייני דירה, מגמות או עסקאות חריגות.',
  ) {
    super(message);
    this.name = 'UnsupportedQuestionError';
  }
}