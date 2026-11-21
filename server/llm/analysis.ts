import OpenAI from 'openai';

import { loadTransactions } from '../data/load';
import {
  analysisPlanJsonSchema,
  analysisPlanSchema,
  type AnalysisPlan,
} from '../schemas/analysis';

const model = process.env.OPENAI_MODEL || 'gpt-6.2-sol';

function getClient() {
  const key = process.env.OPENAI_API_KEY;
  return key ? new OpenAI({ apiKey: key }) : null;
}

function fallbackPlan(question: string): AnalysisPlan | null {
  const q = question.trim();

  if (q === 'האם דירות עם חניה נמכרות במחיר גבוה יותר?') {
    return {
      status: 'supported',
      operation: 'group_compare',
      metric: 'price_per_sqm',
      aggregation: 'median',
      groupBy: 'has_parking',
      filters: {
        city: null,
        neighborhood: null,
        propertyType: 'דירה',
        rooms: null,
        condition: null,
      },
      limit: 2,
      reason: null,
    };
  }

  if (q === 'אילו ערים הכי יקרות לדירות 4 חדרים?') {
    return {
      status: 'supported',
      operation: 'ranking',
      metric: 'price_per_sqm',
      aggregation: 'median',
      groupBy: 'city',
      filters: {
        city: null,
        neighborhood: null,
        propertyType: 'דירה',
        rooms: 4,
        condition: null,
      },
      limit: 8,
      reason: null,
    };
  }

  if (q === 'איך השתנה המחיר למ״ר לאורך זמן?') {
    return {
      status: 'supported',
      operation: 'trend',
      metric: 'price_per_sqm',
      aggregation: 'median',
      groupBy: 'year',
      filters: {
        city: null,
        neighborhood: null,
        propertyType: null,
        rooms: null,
        condition: null,
      },
      limit: 8,
      reason: null,
    };
  }

  if (q === 'מצא עסקאות שנראות חריגות ביחס לעסקאות דומות.') {
    return {
      status: 'supported',
      operation: 'anomalies',
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
      reason: null,
    };
  }

  return null;
}

function plannerPrompt() {
  const transactions = loadTransactions();
  const cities = [...new Set(transactions.map((row) => row.city))];
  const propertyTypes = [...new Set(transactions.map((row) => row.propertyType))];
  const conditions = [
    ...new Set(
      transactions
        .map((row) => row.condition)
        .filter((value): value is string => Boolean(value)),
    ),
  ];

  return `You are the analysis planner for a Hebrew real-estate transaction analytics product.

The user asks a question about a fixed transaction dataset.

Available fields:
city, neighborhood, propertyType, rooms, sizeSqm, floor, totalFloors,
yearBuilt, condition, hasElevator, hasParking, hasBalcony, hasSafeRoom,
dealDate, priceNis, pricePerSqm, source.

Available canonical cities: ${cities.join(', ')}
Available property types: ${propertyTypes.join(', ')}
Available conditions: ${conditions.join(', ')}

Translate the user's question into ONLY the constrained JSON analysis plan.

Rules:
- Never invent a city, property type, or condition.
- Use price_per_sqm for price comparisons unless total price is explicitly requested.
- Use median for price comparisons by default.
- Use group_compare for comparing groups.
- Use ranking for top/bottom groups.
- Use trend for changes over time.
- Use anomalies for unusual transactions.
- Do not claim causation. Questions about "impact", "effect", or "influence" must become an observed group difference.
- If the question cannot be answered using the supported operations and fields, return status unsupported and explain why.`;
}

export async function planQuestion(question: string): Promise<AnalysisPlan> {
  const client = getClient();

  if (!client) {
    const fallback = fallbackPlan(question);
    if (fallback) return fallback;
    throw new Error('OPENAI_API_KEY is not configured');
  }

  const response = await client.responses.create({
    model,
    instructions: plannerPrompt(),
    input: question,
    text: {
      format: {
        type: 'json_schema',
        name: 'analysis_plan',
        strict: true,
        schema: analysisPlanJsonSchema,
      },
    },
  });

  return analysisPlanSchema.parse(JSON.parse(response.output_text));
}

export async function explain(
  question: string,
  plan: AnalysisPlan,
  analysis: unknown,
) {
  const client = getClient();

  if (!client) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  const response = await client.responses.create({
    model,
    instructions:
      'You explain grounded real-estate analytics results in Hebrew. Use ONLY the supplied computed evidence. Never invent numbers, causes, missing data, or facts. Be concise. Distinguish observed association/difference from causation. Return plain text only.',
    input: `User question: ${question}

Analysis plan:
${JSON.stringify(plan)}

Computed evidence:
${JSON.stringify(analysis)}`,
  });

  return response.output_text.trim();
}
