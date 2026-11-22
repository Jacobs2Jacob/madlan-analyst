import { z } from 'zod';

export const analysisPlanSchema = z
  .object({
    status: z.enum(['supported', 'unsupported']),

    operation: z.enum([
      'group_compare',
      'ranking',
      'trend',
      'anomalies',
      'unsupported',
    ]),

    metric: z.enum([
      'price_nis',
      'price_per_sqm',
      'count',
    ]),

    aggregation: z.enum([
      'median',
      'average',
      'count',
    ]),

    groupBy: z
      .enum([
        'city',
        'neighborhood',
        'has_parking',
        'has_elevator',
        'condition',
        'year',
      ])
      .nullable(),

    filters: z.object({
      city: z.string().nullable(),
      neighborhood: z.string().nullable(),
      propertyType: z.string().nullable(),
      rooms: z.number().nullable(),
      condition: z.string().nullable(),
    }),

    limit: z.number().int().min(1).max(10),

    reason: z.string().nullable(),
  })
  .superRefine((plan, ctx) => {
    // Unsupported plans must use the unsupported operation.
    if (
      plan.status === 'unsupported' &&
      plan.operation !== 'unsupported'
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['operation'],
        message:
          'Unsupported plans must use operation="unsupported".',
      });
    }

    // Supported plans cannot use the unsupported operation.
    if (
      plan.status === 'supported' &&
      plan.operation === 'unsupported'
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['operation'],
        message:
          'Supported plans cannot use operation="unsupported".',
      });
    }

    // Trend analysis always uses year as its time dimension.
    if (
      plan.status === 'supported' &&
      plan.operation === 'trend' &&
      plan.groupBy !== 'year'
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['groupBy'],
        message:
          'Trend analysis requires groupBy="year".',
      });
    }

    // Group comparison requires a grouping dimension.
    if (
      plan.status === 'supported' &&
      plan.operation === 'group_compare' &&
      plan.groupBy === null
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['groupBy'],
        message:
          'Group comparison requires a groupBy field.',
      });
    }

    // Ranking requires a grouping dimension.
    if (
      plan.status === 'supported' &&
      plan.operation === 'ranking' &&
      plan.groupBy === null
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['groupBy'],
        message:
          'Ranking requires a groupBy field.',
      });
    }

    // Count metric requires count aggregation.
    if (
      plan.status === 'supported' &&
      plan.metric === 'count' &&
      plan.aggregation !== 'count'
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['aggregation'],
        message:
          'The count metric requires count aggregation.',
      });
    }
  });

export type AnalysisPlan = z.infer<typeof analysisPlanSchema>;

export const analysisPlanJsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'status',
    'operation',
    'metric',
    'aggregation',
    'groupBy',
    'filters',
    'limit',
    'reason',
  ],
  properties: {
    status: {
      type: 'string',
      enum: ['supported', 'unsupported'],
    },

    operation: {
      type: 'string',
      enum: [
        'group_compare',
        'ranking',
        'trend',
        'anomalies',
        'unsupported',
      ],
    },

    metric: {
      type: 'string',
      enum: [
        'price_nis',
        'price_per_sqm',
        'count',
      ],
    },

    aggregation: {
      type: 'string',
      enum: [
        'median',
        'average',
        'count',
      ],
    },

    groupBy: {
      anyOf: [
        {
          type: 'string',
          enum: [
            'city',
            'neighborhood',
            'has_parking',
            'has_elevator',
            'condition',
            'year',
          ],
        },
        { type: 'null' },
      ],
    },

    filters: {
      type: 'object',
      additionalProperties: false,
      required: [
        'city',
        'neighborhood',
        'propertyType',
        'rooms',
        'condition',
      ],
      properties: {
        city: {
          anyOf: [
            { type: 'string' },
            { type: 'null' },
          ],
        },
        neighborhood: {
          anyOf: [
            { type: 'string' },
            { type: 'null' },
          ],
        },
        propertyType: {
          anyOf: [
            { type: 'string' },
            { type: 'null' },
          ],
        },
        rooms: {
          anyOf: [
            { type: 'number' },
            { type: 'null' },
          ],
        },
        condition: {
          anyOf: [
            { type: 'string' },
            { type: 'null' },
          ],
        },
      },
    },

    limit: {
      type: 'integer',
      minimum: 1,
      maximum: 10,
    },

    reason: {
      anyOf: [
        { type: 'string' },
        { type: 'null' },
      ],
    },
  },
} as const;