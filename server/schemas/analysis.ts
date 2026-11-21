import { z } from 'zod';

export const analysisPlanSchema = z.object({
  status: z.enum(['supported', 'unsupported']),
  operation: z.enum([
    'group_compare',
    'ranking',
    'trend',
    'anomalies',
    'unsupported',
  ]),
  metric: z.enum(['price_nis', 'price_per_sqm', 'count']),
  aggregation: z.enum(['median', 'average', 'count']),
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
    status: { type: 'string', enum: ['supported', 'unsupported'] },
    operation: {
      type: 'string',
      enum: ['group_compare', 'ranking', 'trend', 'anomalies', 'unsupported'],
    },
    metric: {
      type: 'string',
      enum: ['price_nis', 'price_per_sqm', 'count'],
    },
    aggregation: {
      type: 'string',
      enum: ['median', 'average', 'count'],
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
        city: { anyOf: [{ type: 'string' }, { type: 'null' }] },
        neighborhood: { anyOf: [{ type: 'string' }, { type: 'null' }] },
        propertyType: { anyOf: [{ type: 'string' }, { type: 'null' }] },
        rooms: { anyOf: [{ type: 'number' }, { type: 'null' }] },
        condition: { anyOf: [{ type: 'string' }, { type: 'null' }] },
      },
    },
    limit: { type: 'integer', minimum: 1, maximum: 10 },
    reason: { anyOf: [{ type: 'string' }, { type: 'null' }] },
  },
} as const;
