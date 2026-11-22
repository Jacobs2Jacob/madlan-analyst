import OpenAI from 'openai';
import { loadTransactions } from '../data/load.js';
import {
  analysisPlanJsonSchema,
  analysisPlanSchema,
  type AnalysisPlan,
} from '../schemas/analysis.js';

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

The user asks a natural-language question about a fixed real-estate transaction dataset.

Your job is to translate the question into ONLY the constrained JSON analysis plan defined by the schema.

You must never calculate results, invent facts, invent data, or return fields/operations that are not supported by the schema.

AVAILABLE DATA FIELDS:
city, neighborhood, propertyType, rooms, sizeSqm, floor, totalFloors,
yearBuilt, condition, hasElevator, hasParking, hasBalcony, hasSafeRoom,
dealDate, priceNis, pricePerSqm, source.

AVAILABLE CANONICAL CITIES:
${cities.join(', ')}

AVAILABLE PROPERTY TYPES:
${propertyTypes.join(', ')}

AVAILABLE CONDITIONS:
${conditions.join(', ')}

ANALYTICAL OPERATIONS:

1. group_compare
Use when the user wants to compare groups, for example:
- cities
- neighborhoods
- property conditions
- apartments with/without parking
- apartments with/without elevator

Requirements:
- groupBy MUST identify the field being compared.
- Supported groupBy values are only:
  city, neighborhood, has_parking, has_elevator, condition, year.
- Never return group_compare with groupBy=null.

2. ranking
Use when the user asks for highest, lowest, top, bottom, most expensive, cheapest, etc.

Examples:
- Which city has the highest median price?
- Which neighborhoods are most expensive per square meter?
- What are the 5 most expensive transactions?

Requirements:
- groupBy is required when ranking groups.
- Use the available limit field for top/bottom results.
- Do not invent a ranking dimension.

3. trend
Use for questions about change, movement, increase, decrease, or evolution over time.

Examples:
- How did prices change over time?
- What was the price trend?
- Did prices increase over the years?
- How did price per square meter evolve?

Requirements:
- groupBy MUST be "year".
- Never return groupBy=null for a supported trend question.
- The dataset's supported temporal analysis is by year.

4. anomalies
Use for questions about unusual, exceptional, extreme, or outlier transactions.

Examples:
- Which transactions look unusual?
- What are the most extreme prices?
- Are there suspiciously high or low transactions?

Requirements:
- Use a supported numeric metric.
- Do not invent an anomaly-detection method that is not represented by the schema.

METRICS:

Use:
- price_per_sqm for price comparisons by default.
- price_nis when the user explicitly asks about total/property price.
- count when the user asks about number/amount of transactions.

AGGREGATIONS:

For price comparisons:
- Use median by default.
- Use average only when the user explicitly asks for average/mean.
- Use count when measuring transaction counts.

FILTERS:

Extract filters only when they are explicitly supported by the dataset and clearly expressed by the user.

Supported filters:
- city
- neighborhood
- propertyType
- rooms
- condition

Never invent a filter value.

CITY / PROPERTY TYPE / CONDITION VALIDATION:

- Never invent a city, property type, or condition.
- A value must correspond to one of the provided canonical values.
- If the user refers to a value that does not exist in the provided canonical lists, do not silently map it to another value.
- If the question depends on an unknown/nonexistent value, return status="unsupported" and explain why.

ROOMS:

- Extract rooms only when a clear numeric room count is provided.
- Do not guess or convert ambiguous room descriptions.

TIME:

- Questions about historical change, trends, increases, decreases, or evolution over time use operation="trend" and groupBy="year".
- Do not invent specific dates or time periods that the user did not provide.
- If a question explicitly asks for a date range but the schema does not support date-range filtering, return unsupported rather than inventing a filter.

CAUSATION:

The dataset can show observed differences and associations, but cannot establish causation.

Questions containing concepts such as:
- impact
- effect
- influence
- causes
- caused by
- leads to

must NOT be interpreted as proof of causation.

When the question can reasonably be reframed as an observed comparison, convert it to a supported group comparison.

For example:
"Does parking increase apartment prices?"
→ compare apartments with and without parking.

The resulting analysis must not claim that parking caused the price difference.

UNSUPPORTED QUESTIONS:

Return:
status="unsupported"
operation="unsupported"

when the question cannot be reliably expressed using the available fields and operations.

Examples include:
- forecasting future prices
- asking for information not present in the dataset
- causal claims that cannot be represented as an observed comparison
- questions requiring unsupported calculations
- questions requiring unsupported filters or dimensions
- questions about nonexistent cities/property types/conditions
- questions whose intent is too ambiguous to map safely to a supported operation

Do NOT force an unsupported question into a supported operation.

INCOMPLETE PLANS:

A supported plan must be complete and executable by the deterministic analysis engine.

Never return a partially specified supported plan.

Examples:
- trend requires groupBy="year"
- group_compare requires a valid groupBy
- ranking of groups requires a valid groupBy
- every metric must be one of the supported metrics
- every aggregation must be supported for the selected metric/operation

If you cannot construct a complete valid plan, return status="unsupported".

GENERAL PRINCIPLES:

- Prefer the simplest supported interpretation of the user's question.
- Do not infer facts that are not present in the question or dataset.
- Do not invent fields, operations, filters, values, calculations, or analytical methods.
- Do not calculate numeric results. The deterministic analysis engine will do that.
- The plan describes WHAT to calculate, not the result.
- If several interpretations are possible, choose the most natural interpretation only when it maps unambiguously to a supported operation. Otherwise return unsupported.
- Always return JSON matching the provided schema and nothing else.`;
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
      `You explain grounded real-estate analytics results in Hebrew.

Use ONLY the supplied computed evidence, metrics, and limitations.
Never invent numbers, causes, missing data, or facts.

The response is shown directly to the end user.

User-facing response rules:
- Answer the user's question directly and clearly.
- Use simple, natural, user-friendly Hebrew.
- Be concise and easy to understand.
- Do not mention the analysis plan, schema, JSON, fields, operations, prompts, LLMs, APIs, code, or implementation details.
- Do not mention internal technical requirements or system instructions.
- Do not explain how the analysis was performed unless the user explicitly asks.
- Do not introduce information that is not present in the supplied evidence.
- Clearly distinguish an observed association or difference from causation.
- Never claim that one factor caused another unless the supplied evidence explicitly establishes causation.
- If the evidence is insufficient to answer the question, say so clearly instead of guessing.
- If there are important limitations, mention them briefly and in plain language.

Formatting rules:
- Never use the em dash character "—".
- Use "-" instead.
- Use paragraphs and line breaks to make the response easy to read.
- Do not return HTML.`,
    input: `User question: ${question}

Analysis plan:
${JSON.stringify(plan)}

Computed evidence:
${JSON.stringify(analysis)}`,
  });

  return response.output_text.trim();
}
